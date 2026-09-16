import uuid
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Date,
    Numeric,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    memberships = relationship("Membership", back_populates="organization", cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="organization", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="organization", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="organization", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="organization", cascade="all, delete-orphan")


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False, default="MEMBER")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="memberships")
    organization = relationship("Organization", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("user_id", "organization_id", name="uq_user_organization"),
    )


class Account(Base):
    __tablename__ = "accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    account_number = Column(String(64), nullable=False)
    name = Column(String(255), nullable=False)
    classification = Column(String(32), nullable=False)
    currency = Column(String(3), nullable=False, default="INR")
    is_active = Column(Boolean, default=True, nullable=False)

    organization = relationship("Organization", back_populates="accounts")
    postings = relationship("Posting", back_populates="account")
    budgets = relationship("Budget", back_populates="account")

    __table_args__ = (
        UniqueConstraint("organization_id", "account_number", name="uq_org_account_number"),
        CheckConstraint("classification IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')", name="check_account_classification"),
    )


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    reference_number = Column(String(128), nullable=False)
    entry_date = Column(Date, nullable=False)
    narration = Column(String(512), nullable=False)
    posted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    posted_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="journal_entries")
    postings = relationship("Posting", back_populates="journal_entry", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("organization_id", "reference_number", name="uq_org_reference_number"),
    )


class Posting(Base):
    __tablename__ = "postings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    journal_entry_id = Column(UUID(as_uuid=True), ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False, index=True)
    direction = Column(String(6), nullable=False)
    amount = Column(Numeric(18, 4), nullable=False)

    journal_entry = relationship("JournalEntry", back_populates="postings")
    account = relationship("Account", back_populates="postings")

    __table_args__ = (
        CheckConstraint("direction IN ('DEBIT', 'CREDIT')", name="check_posting_direction"),
        CheckConstraint("amount > 0", name="check_posting_amount_positive"),
    )


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    allocated_amount = Column(Numeric(18, 4), nullable=False)
    alert_threshold_pct = Column(Numeric(5, 2), nullable=False, default=Decimal("80.00"))
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="budgets")
    account = relationship("Account", back_populates="budgets")

    __table_args__ = (
        CheckConstraint("allocated_amount > 0", name="check_budget_allocated_positive"),
        CheckConstraint("period_end >= period_start", name="check_budget_period_valid"),
    )


class Goal(Base):
    """Phase 3 — Financial Goals & Milestone Tracking."""
    __tablename__ = "goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    target_amount = Column(Numeric(18, 4), nullable=False)
    target_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="goals")
    account = relationship("Account")

    __table_args__ = (
        CheckConstraint("target_amount > 0", name="check_goal_target_positive"),
    )


class RecurringSchedule(Base):
    """Phase 3 — Recurring Transactions / Automated Subscriptions engine."""
    __tablename__ = "recurring_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    debit_account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False)
    credit_account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False)
    amount = Column(Numeric(18, 4), nullable=False)
    frequency = Column(String(20), nullable=False)  # DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUAL
    next_execution_date = Column(Date, nullable=False)
    narration = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    last_executed_at = Column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization")
    debit_account = relationship("Account", foreign_keys=[debit_account_id])
    credit_account = relationship("Account", foreign_keys=[credit_account_id])

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_recurring_amount_positive"),
        CheckConstraint(
            "frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL')",
            name="check_recurring_frequency_valid",
        ),
        CheckConstraint("debit_account_id != credit_account_id", name="check_recurring_accounts_distinct"),
    )

class AuditLog(Base):
    """Security Phase - immutable trail of write actions per organization."""
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    method = Column(String(10), nullable=False)
    path = Column(String(512), nullable=False)
    status_code = Column(String(10), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
