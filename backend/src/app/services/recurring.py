import uuid
from datetime import date, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.domain import RecurringSchedule, Organization
from app.services.ledger import LedgerEngine, JournalEntryModel, PostingModel

FREQUENCY_STEP = {
    "DAILY": lambda d: d + timedelta(days=1),
    "WEEKLY": lambda d: d + timedelta(weeks=1),
    "MONTHLY": lambda d: _add_months(d, 1),
    "QUARTERLY": lambda d: _add_months(d, 3),
    "ANNUAL": lambda d: _add_months(d, 12),
}


def _add_months(source: date, months: int) -> date:
    month_index = source.month - 1 + months
    year = source.year + month_index // 12
    month = month_index % 12 + 1
    day = min(source.day, 28)  # avoid month-length overflow (safe default)
    return date(year, month, day)


class RecurringEngine:
    """Finds due recurring schedules org-by-org and posts balanced journal
    entries for each, advancing next_execution_date. Designed to be called
    either from a manual API trigger or a background loop in main.py."""

    @staticmethod
    async def execute_due_for_org(session: AsyncSession, org_id: uuid.UUID, as_of: date | None = None) -> list[dict]:
        as_of = as_of or date.today()
        stmt = select(RecurringSchedule).where(
            RecurringSchedule.organization_id == org_id,
            RecurringSchedule.is_active == True,
            RecurringSchedule.next_execution_date <= as_of,
        )
        due = (await session.execute(stmt)).scalars().all()

        # A system posting requires a user id for the journal entry. We fall
        # back to any OWNER membership of the org for attribution.
        results = []
        for schedule in due:
            payload = JournalEntryModel(
                reference_number=f"AUTO-{schedule.id.hex[:8]}-{as_of.isoformat()}",
                entry_date=as_of,
                narration=f"[Recurring] {schedule.narration}",
                postings=[
                    PostingModel(account_id=schedule.debit_account_id, direction="DEBIT", amount=schedule.amount),
                    PostingModel(account_id=schedule.credit_account_id, direction="CREDIT", amount=schedule.amount),
                ],
            )
            try:
                entry = await LedgerEngine.post(session, org_id, await _resolve_owner(session, org_id), payload)
                schedule.next_execution_date = FREQUENCY_STEP[schedule.frequency](schedule.next_execution_date)
                schedule.last_executed_at = None
                results.append({"schedule_id": str(schedule.id), "entry_id": str(entry.id), "status": "POSTED"})
            except ValueError as exc:
                results.append({"schedule_id": str(schedule.id), "status": "SKIPPED", "reason": str(exc)})
        await session.flush()
        return results


async def _resolve_owner(session: AsyncSession, org_id: uuid.UUID) -> uuid.UUID:
    from app.models.domain import Membership
    stmt = select(Membership.user_id).where(Membership.organization_id == org_id, Membership.role == "OWNER")
    owner = (await session.execute(stmt)).scalars().first()
    if not owner:
        raise ValueError("Organization has no OWNER membership to attribute automated postings to.")
    return owner
