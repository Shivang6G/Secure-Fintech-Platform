import uuid
from datetime import date, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.domain import Goal, Account, Posting, JournalEntry


class GoalAnalytics:
    @staticmethod
    async def list_with_progress(session: AsyncSession, org_id: uuid.UUID) -> list[dict]:
        stmt = select(Goal, Account).join(Account, Goal.account_id == Account.id).where(
            Goal.organization_id == org_id, Goal.is_active == True
        )
        rows = (await session.execute(stmt)).all()

        out = []
        for goal, acc in rows:
            bal_stmt = select(
                func.coalesce(func.sum(Posting.amount).filter(Posting.direction == "DEBIT"), 0),
                func.coalesce(func.sum(Posting.amount).filter(Posting.direction == "CREDIT"), 0),
            ).where(Posting.account_id == acc.id)
            debits, credits = (await session.execute(bal_stmt)).one()
            current_balance = float(debits) - float(credits)  # ASSET-normal account

            target = float(goal.target_amount)
            progress_pct = round(min(100.0, max(0.0, (current_balance / target) * 100.0)), 2) if target > 0 else 0.0

            days_remaining = (goal.target_date - date.today()).days
            months_remaining = max(1, round(days_remaining / 30.44))
            remaining_amount = max(0.0, target - current_balance)
            required_monthly = round(remaining_amount / months_remaining, 2) if days_remaining > 0 else remaining_amount

            out.append({
                "id": str(goal.id),
                "name": goal.name,
                "account_id": str(acc.id),
                "account_name": acc.name,
                "target_amount": target,
                "current_balance": current_balance,
                "progress_pct": progress_pct,
                "target_date": str(goal.target_date),
                "days_remaining": days_remaining,
                "required_monthly_contribution": required_monthly,
                "status": "ACHIEVED" if current_balance >= target else ("OVERDUE" if days_remaining < 0 else "ON_TRACK"),
            })
        return out


class RunwayAnalytics:
    @staticmethod
    async def compute(session: AsyncSession, org_id: uuid.UUID, lookback_days: int = 90) -> dict:
        cutoff = date.today() - timedelta(days=lookback_days)

        # Liquid cash = sum of ASSET account balances (proxy: all ASSET accounts).
        cash_stmt = (
            select(
                func.coalesce(func.sum(Posting.amount).filter(Posting.direction == "DEBIT"), 0),
                func.coalesce(func.sum(Posting.amount).filter(Posting.direction == "CREDIT"), 0),
            )
            .join(Account, Posting.account_id == Account.id)
            .where(Account.organization_id == org_id, Account.classification == "ASSET")
        )
        debits, credits = (await session.execute(cash_stmt)).one()
        liquid_assets = float(debits) - float(credits)

        # Burn = EXPENSE debits posted within the lookback window.
        burn_stmt = (
            select(func.coalesce(func.sum(Posting.amount), 0))
            .join(JournalEntry, Posting.journal_entry_id == JournalEntry.id)
            .join(Account, Posting.account_id == Account.id)
            .where(
                Account.organization_id == org_id,
                Account.classification == "EXPENSE",
                Posting.direction == "DEBIT",
                JournalEntry.entry_date >= cutoff,
            )
        )
        total_expense = float((await session.execute(burn_stmt)).scalar())
        months_in_window = max(lookback_days / 30.44, 1e-6)
        avg_monthly_burn = round(total_expense / months_in_window, 2)

        if avg_monthly_burn <= 0:
            runway_months = None
            cash_zero_date = None
        else:
            runway_months = round(liquid_assets / avg_monthly_burn, 1)
            cash_zero_date = str(date.today() + timedelta(days=int(runway_months * 30.44)))

        return {
            "liquid_assets": liquid_assets,
            "average_monthly_burn": avg_monthly_burn,
            "lookback_days": lookback_days,
            "runway_months": runway_months,
            "projected_cash_zero_date": cash_zero_date,
        }
