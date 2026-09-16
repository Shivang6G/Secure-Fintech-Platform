from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0002_goals_recurring'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('goals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('target_amount', sa.Numeric(18, 4), nullable=False),
        sa.Column('target_date', sa.Date(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint('target_amount > 0', name='check_goal_target_positive'),
    )
    op.create_index('ix_goals_organization_id', 'goals', ['organization_id'])
    op.create_index('ix_goals_account_id', 'goals', ['account_id'])

    op.create_table('recurring_schedules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('debit_account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounts.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('credit_account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounts.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('amount', sa.Numeric(18, 4), nullable=False),
        sa.Column('frequency', sa.String(20), nullable=False),
        sa.Column('next_execution_date', sa.Date(), nullable=False),
        sa.Column('narration', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('last_executed_at', sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint('amount > 0', name='check_recurring_amount_positive'),
        sa.CheckConstraint(
            "frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL')",
            name='check_recurring_frequency_valid',
        ),
        sa.CheckConstraint('debit_account_id != credit_account_id', name='check_recurring_accounts_distinct'),
    )
    op.create_index('ix_recurring_schedules_organization_id', 'recurring_schedules', ['organization_id'])


def downgrade():
    op.drop_index('ix_recurring_schedules_organization_id', table_name='recurring_schedules')
    op.drop_table('recurring_schedules')
    op.drop_index('ix_goals_account_id', table_name='goals')
    op.drop_index('ix_goals_organization_id', table_name='goals')
    op.drop_table('goals')
