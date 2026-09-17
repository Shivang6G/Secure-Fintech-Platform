import uuid
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
import csv
import io
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, func, cast, Date
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.core.security import hash_password, verify_password, create_access_token, verify_access_token
from app.core.limiter import limiter
from app.models.domain import User, Organization, Membership, Account, JournalEntry, Posting, Budget, Goal, RecurringSchedule, AuditLog
from app.services.ledger import LedgerEngine, JournalEntryModel
from app.services.recurring import RecurringEngine
from app.services.analytics import GoalAnalytics, RunwayAnalytics

router = APIRouter()
security_bearer = HTTPBearer()

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    org_name: str
    org_type: str

class AccountCreateRequest(BaseModel):
    account_number: str
    name: str
    classification: str = Field(..., pattern="^(ASSET|LIABILITY|EQUITY|REVENUE|EXPENSE)$")

class BudgetCreateRequest(BaseModel):
    account_id: uuid.UUID
    name: str
    allocated_amount: Decimal = Field(..., gt=Decimal("0.0000"))
    alert_threshold_pct: Decimal = Field(default=Decimal("80.00"), ge=Decimal("1.00"), le=Decimal("100.00"))
    period_start: date
    period_end: date

class GoalCreateRequest(BaseModel):
    account_id: uuid.UUID
    name: str
    target_amount: Decimal = Field(..., gt=Decimal("0.0000"))
    target_date: date

class RecurringScheduleCreateRequest(BaseModel):
    debit_account_id: uuid.UUID
    credit_account_id: uuid.UUID
    amount: Decimal = Field(..., gt=Decimal("0.0000"))
    frequency: str = Field(..., pattern="^(DAILY|WEEKLY|MONTHLY|QUARTERLY|ANNUAL)$")
    next_execution_date: date
    narration: str

async def get_current_user(cred: HTTPAuthorizationCredentials = Depends(security_bearer), session: AsyncSession = Depends(get_db_session)):
    try:
        claims = verify_access_token(cred.credentials)
        user_id = uuid.UUID(claims["sub"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication signature rejected.")
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User nonexistent.")
    return user

@router.post("/auth/register")
@limiter.limit("5/minute")
async def register(request: Request, payload: RegisterRequest, session: AsyncSession = Depends(get_db_session)):
    stmt = select(User).where(User.email == payload.email)
    existing = (await session.execute(stmt)).scalars().first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Email '{payload.email}' is already registered.")

    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    session.add(user)
    await session.flush()

    org = Organization(name=payload.org_name, type=payload.org_type)
    session.add(org)
    await session.flush()

    membership = Membership(user_id=user.id, organization_id=org.id, role="OWNER")
    session.add(membership)
    await session.commit()

    token = create_access_token({"sub": str(user.id), "org": str(org.id), "role": "OWNER"})
    return {
        "token": token,
        "org_id": str(org.id),
        "user_id": str(user.id)
    }

@router.get("/organizations/{org_id}/accounts")
async def list_accounts(org_id: uuid.UUID, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    stmt = select(
        Account.id,
        Account.account_number,
        Account.name,
        Account.classification,
        Account.currency
    ).where(Account.organization_id == org_id, Account.is_active == True)
    result = await session.execute(stmt)
    rows = result.all()
    return [
        {
            "id": str(r[0]),
            "account_number": r[1],
            "name": r[2],
            "classification": r[3],
            "currency": r[4]
        } for r in rows
    ]

@router.post("/organizations/{org_id}/accounts")
async def create_account(org_id: uuid.UUID, payload: AccountCreateRequest, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    account = Account(
        organization_id=org_id,
        account_number=payload.account_number,
        name=payload.name,
        classification=payload.classification,
    )
    session.add(account)
    await session.commit()
    return {"id": str(account.id)}

@router.get("/organizations/{org_id}/ledger/entries")
async def list_entries(org_id: uuid.UUID, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    query = (
        select(JournalEntry)
        .where(JournalEntry.organization_id == org_id)
        .options(selectinload(JournalEntry.postings))
        .order_by(JournalEntry.posted_at.desc())
    )
    result = await session.execute(query)
    entries = result.scalars().all()
    return [
        {
            "id": str(e.id),
            "reference_number": e.reference_number,
            "entry_date": str(e.entry_date),
            "narration": e.narration,
            "posted_at": e.posted_at.isoformat(),
            "postings": [
                {
                    "id": str(p.id),
                    "account_id": str(p.account_id),
                    "direction": p.direction,
                    "amount": float(p.amount)
                } for p in e.postings
            ]
        } for e in entries
    ]

@router.post("/organizations/{org_id}/ledger/entries")
async def post_entry(org_id: uuid.UUID, payload: JournalEntryModel, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    try:
        entry = await LedgerEngine.post(session, org_id, user.id, payload)
        await session.commit()
        return {"status": "COMMITTED", "entry_id": str(entry.id)}
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/organizations/{org_id}/analytics/net-worth")
async def get_net_worth(org_id: uuid.UUID, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    acc_stmt = select(
        Account.id,
        Account.account_number,
        Account.name,
        Account.classification,
        Account.currency
    ).where(Account.organization_id == org_id, Account.is_active == True)
    accounts = (await session.execute(acc_stmt)).all()

    account_map = {}
    for acc in accounts:
        account_map[acc[0]] = {
            "id": str(acc[0]),
            "account_number": acc[1],
            "name": acc[2],
            "classification": acc[3],
            "currency": acc[4],
            "debits": 0.0,
            "credits": 0.0,
            "balance": 0.0
        }

    if account_map:
        posting_stmt = (
            select(
                Posting.account_id,
                Posting.direction,
                func.coalesce(func.sum(Posting.amount), 0).label("total")
            )
            .where(Posting.account_id.in_(list(account_map.keys())))
            .group_by(Posting.account_id, Posting.direction)
        )
        postings = (await session.execute(posting_stmt)).all()
        for p in postings:
            acc_id, direction, total = p[0], p[1], float(p[2])
            if acc_id in account_map:
                if direction == "DEBIT":
                    account_map[acc_id]["debits"] = total
                elif direction == "CREDIT":
                    account_map[acc_id]["credits"] = total

    total_assets = 0.0
    total_liabilities = 0.0
    total_equity = 0.0
    account_list = []

    for acc in account_map.values():
        cls = acc["classification"]
        if cls == "ASSET":
            bal = acc["debits"] - acc["credits"]
            total_assets += bal
        elif cls == "LIABILITY":
            bal = acc["credits"] - acc["debits"]
            total_liabilities += bal
        elif cls == "EQUITY":
            bal = acc["credits"] - acc["debits"]
            total_equity += bal
        elif cls == "EXPENSE":
            bal = acc["debits"] - acc["credits"]
        else:
            bal = acc["credits"] - acc["debits"]

        acc["balance"] = bal
        account_list.append(acc)

    net_worth = total_assets - total_liabilities

    return {
        "net_worth": net_worth,
        "total_assets": total_assets,
        "total_liabilities": total_liabilities,
        "total_equity": total_equity,
        "accounts": account_list
    }

@router.get("/organizations/{org_id}/budgets")
async def list_budgets(org_id: uuid.UUID, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    stmt = (
        select(Budget, Account)
        .join(Account, Budget.account_id == Account.id)
        .where(Budget.organization_id == org_id)
        .order_by(Budget.created_at.desc())
    )
    results = (await session.execute(stmt)).all()

    budget_list = []
    for b, a in results:
        spend_stmt = (
            select(func.coalesce(func.sum(Posting.amount), 0))
            .join(JournalEntry, Posting.journal_entry_id == JournalEntry.id)
            .where(
                Posting.account_id == a.id,
                Posting.direction == "DEBIT",
                JournalEntry.entry_date >= b.period_start,
                JournalEntry.entry_date <= b.period_end
            )
        )
        spent_amount = float((await session.execute(spend_stmt)).scalar())
        allocated = float(b.allocated_amount)
        utilization_pct = round((spent_amount / allocated) * 100.0, 2) if allocated > 0 else 0.0
        threshold = float(b.alert_threshold_pct)

        status_flag = "HEALTHY"
        if spent_amount >= allocated:
            status_flag = "BREACHED"
        elif utilization_pct >= threshold:
            status_flag = "WARNING"

        budget_list.append({
            "id": str(b.id),
            "account_id": str(a.id),
            "account_name": a.name,
            "account_number": a.account_number,
            "name": b.name,
            "allocated_amount": allocated,
            "spent_amount": spent_amount,
            "remaining_amount": max(0.0, allocated - spent_amount),
            "utilization_pct": utilization_pct,
            "alert_threshold_pct": threshold,
            "period_start": str(b.period_start),
            "period_end": str(b.period_end),
            "status": status_flag
        })

    return budget_list

@router.post("/organizations/{org_id}/budgets")
async def create_budget(org_id: uuid.UUID, payload: BudgetCreateRequest, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    acc_check = await session.execute(
        select(Account).where(Account.id == payload.account_id, Account.organization_id == org_id)
    )
    acc = acc_check.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected expense account does not belong to your organization.")

    budget = Budget(
        organization_id=org_id,
        account_id=payload.account_id,
        name=payload.name,
        allocated_amount=payload.allocated_amount,
        alert_threshold_pct=payload.alert_threshold_pct,
        period_start=payload.period_start,
        period_end=payload.period_end
    )
    session.add(budget)
    await session.commit()
    return {"id": str(budget.id), "status": "ACTIVE"}


# ---------------------------------------------------------------------------
# PHASE 3 — Financial Goals
# ---------------------------------------------------------------------------

@router.get("/organizations/{org_id}/goals")
async def list_goals(org_id: uuid.UUID, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    return await GoalAnalytics.list_with_progress(session, org_id)

@router.post("/organizations/{org_id}/goals")
async def create_goal(org_id: uuid.UUID, payload: GoalCreateRequest, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    acc = await session.get(Account, payload.account_id)
    if not acc or acc.organization_id != org_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account does not belong to your organization.")
    if acc.classification != "ASSET":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Goals must be linked to an ASSET account.")

    goal = Goal(
        organization_id=org_id,
        account_id=payload.account_id,
        name=payload.name,
        target_amount=payload.target_amount,
        target_date=payload.target_date,
    )
    session.add(goal)
    await session.commit()
    return {"id": str(goal.id), "status": "ACTIVE"}

@router.delete("/organizations/{org_id}/goals/{goal_id}")
async def deactivate_goal(org_id: uuid.UUID, goal_id: uuid.UUID, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    goal = await session.get(Goal, goal_id)
    if not goal or goal.organization_id != org_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found.")
    goal.is_active = False
    await session.commit()
    return {"status": "DEACTIVATED"}


# ---------------------------------------------------------------------------
# PHASE 3 — Recurring Transactions / Automation
# ---------------------------------------------------------------------------

@router.get("/organizations/{org_id}/recurring-schedules")
async def list_recurring_schedules(org_id: uuid.UUID, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    stmt = select(RecurringSchedule).where(RecurringSchedule.organization_id == org_id).order_by(RecurringSchedule.next_execution_date.asc())
    rows = (await session.execute(stmt)).scalars().all()
    return [
        {
            "id": str(r.id),
            "debit_account_id": str(r.debit_account_id),
            "credit_account_id": str(r.credit_account_id),
            "amount": float(r.amount),
            "frequency": r.frequency,
            "next_execution_date": str(r.next_execution_date),
            "narration": r.narration,
            "is_active": r.is_active,
        } for r in rows
    ]

@router.post("/organizations/{org_id}/recurring-schedules")
async def create_recurring_schedule(org_id: uuid.UUID, payload: RecurringScheduleCreateRequest, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    if payload.debit_account_id == payload.credit_account_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debit and credit accounts must differ.")
    for acc_id in (payload.debit_account_id, payload.credit_account_id):
        acc = await session.get(Account, acc_id)
        if not acc or acc.organization_id != org_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Both accounts must belong to your organization.")

    schedule = RecurringSchedule(
        organization_id=org_id,
        debit_account_id=payload.debit_account_id,
        credit_account_id=payload.credit_account_id,
        amount=payload.amount,
        frequency=payload.frequency,
        next_execution_date=payload.next_execution_date,
        narration=payload.narration,
    )
    session.add(schedule)
    await session.commit()
    return {"id": str(schedule.id), "status": "ACTIVE"}

@router.post("/organizations/{org_id}/recurring-schedules/{schedule_id}/deactivate")
async def deactivate_recurring_schedule(org_id: uuid.UUID, schedule_id: uuid.UUID, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    schedule = await session.get(RecurringSchedule, schedule_id)
    if not schedule or schedule.organization_id != org_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found.")
    schedule.is_active = False
    await session.commit()
    return {"status": "DEACTIVATED"}

@router.post("/organizations/{org_id}/recurring-schedules/execute-due")
async def execute_due_schedules(org_id: uuid.UUID, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    results = await RecurringEngine.execute_due_for_org(session, org_id)
    await session.commit()
    return {"processed": len(results), "results": results}


# ---------------------------------------------------------------------------
# PHASE 3 — Autonomous Advisory: Cash Runway
# ---------------------------------------------------------------------------

@router.get("/organizations/{org_id}/analytics/runway")
async def get_runway(org_id: uuid.UUID, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    return await RunwayAnalytics.compute(session, org_id)

@router.get("/organizations/{org_id}/audit-logs")
async def list_audit_logs(org_id: uuid.UUID, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    stmt = select(AuditLog).where(AuditLog.organization_id == org_id).order_by(AuditLog.created_at.desc()).limit(100)
    result = await session.execute(stmt)
    rows = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "user_id": str(r.user_id) if r.user_id else None,
            "method": r.method,
            "path": r.path,
            "status_code": r.status_code,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        } for r in rows
    ]

@router.get("/organizations/{org_id}/reports/ledger-csv")
async def export_ledger_csv(org_id: uuid.UUID, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    stmt = (
        select(JournalEntry.entry_date, JournalEntry.reference_number, JournalEntry.narration, Account.name, Posting.direction, Posting.amount)
        .join(Posting, Posting.journal_entry_id == JournalEntry.id)
        .join(Account, Account.id == Posting.account_id)
        .where(JournalEntry.organization_id == org_id)
        .order_by(JournalEntry.entry_date.desc())
    )
    result = await session.execute(stmt)
    rows = result.all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Date", "Reference", "Narration", "Account", "Direction", "Amount"])
    for r in rows:
        writer.writerow([r[0], r[1], r[2], r[3], r[4], str(r[5])])
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=ledger_report_{org_id}.csv"},
    )

@router.get("/organizations/{org_id}/reports/ledger.csv")
async def export_ledger_csv(org_id: uuid.UUID, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    stmt = (
        select(JournalEntry, Posting, Account)
        .join(Posting, Posting.journal_entry_id == JournalEntry.id)
        .join(Account, Account.id == Posting.account_id)
        .where(JournalEntry.organization_id == org_id)
        .order_by(JournalEntry.entry_date.desc())
    )
    result = await session.execute(stmt)
    rows = result.all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Date", "Reference", "Narration", "Account", "Classification", "Direction", "Amount"])
    for entry, posting, account in rows:
        writer.writerow([
            entry.entry_date, entry.reference_number, entry.narration,
            account.name, account.classification, posting.direction, posting.amount
        ])
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ledger_report.csv"}
    )