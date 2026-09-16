import uuid
from decimal import Decimal
from datetime import date
import pytest
from pydantic import ValidationError
from app.services.ledger import JournalEntryModel, PostingModel


def test_balanced_entry_is_valid():
    acc1, acc2 = uuid.uuid4(), uuid.uuid4()
    entry = JournalEntryModel(
        reference_number="TEST-001",
        entry_date=date.today(),
        narration="Balanced test entry",
        postings=[
            PostingModel(account_id=acc1, direction="DEBIT", amount=Decimal("100.00")),
            PostingModel(account_id=acc2, direction="CREDIT", amount=Decimal("100.00")),
        ],
    )
    assert entry.reference_number == "TEST-001"


def test_imbalanced_entry_is_rejected():
    acc1, acc2 = uuid.uuid4(), uuid.uuid4()
    with pytest.raises(ValidationError):
        JournalEntryModel(
            reference_number="TEST-002",
            entry_date=date.today(),
            narration="Imbalanced test entry",
            postings=[
                PostingModel(account_id=acc1, direction="DEBIT", amount=Decimal("100.00")),
                PostingModel(account_id=acc2, direction="CREDIT", amount=Decimal("50.00")),
            ],
        )


def test_invalid_direction_is_rejected():
    with pytest.raises(ValidationError):
        PostingModel(account_id=uuid.uuid4(), direction="SIDEWAYS", amount=Decimal("10.00"))


def test_negative_amount_is_rejected():
    with pytest.raises(ValidationError):
        PostingModel(account_id=uuid.uuid4(), direction="DEBIT", amount=Decimal("-5.00"))
