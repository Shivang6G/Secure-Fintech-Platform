import uuid
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.domain import Account, JournalEntry, Posting

class PostingModel(BaseModel):
    account_id: uuid.UUID
    direction: str = Field(..., pattern="^(DEBIT|CREDIT)$")
    amount: Decimal = Field(..., gt=Decimal("0.0000"), decimal_places=4)

class JournalEntryModel(BaseModel):
    reference_number: str
    entry_date: date
    narration: str
    postings: list[PostingModel]

    @model_validator(mode="after")
    def validate_invariants(self):
        debits = sum(p.amount for p in self.postings if p.direction == "DEBIT")
        credits = sum(p.amount for p in self.postings if p.direction == "CREDIT")
        if debits != credits:
            raise ValueError(f"Imbalance detected: Debits ({debits}) != Credits ({credits})")
        return self

class LedgerEngine:
    @staticmethod
    async def post(session: AsyncSession, org_id: uuid.UUID, user_id: uuid.UUID, payload: JournalEntryModel):
        account_ids = [p.account_id for p in payload.postings]
        q = select(Account).where(Account.id.in_(account_ids), Account.organization_id == org_id)
        valid = (await session.execute(q)).scalars().all()
        if len(valid) != len(set(account_ids)):
            raise ValueError("Accounts specified do not exist or belong to a different organization.")

        entry = JournalEntry(
            organization_id=org_id,
            reference_number=payload.reference_number,
            entry_date=payload.entry_date,
            narration=payload.narration,
            posted_by=user_id,
        )
        session.add(entry)
        await session.flush()

        for p in payload.postings:
            session.add(Posting(
                journal_entry_id=entry.id,
                account_id=p.account_id,
                direction=p.direction,
                amount=p.amount
            ))
        await session.flush()
        return entry