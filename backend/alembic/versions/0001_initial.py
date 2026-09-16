from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    op.execute('CREATE EXTENSION IF NOT EXISTS "citext";')
    
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('email', postgresql.CITEXT(), unique=True, nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('totp_secret', sa.String(64), nullable=True),
        sa.Column('is_mfa_enabled', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    op.create_table('organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('type', sa.String(32), nullable=False),
        sa.Column('base_currency', sa.CHAR(3), server_default='INR', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    op.create_table('memberships',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(32), nullable=False),
        sa.UniqueConstraint('user_id', 'organization_id', name='uq_user_organization')
    )

    op.create_table('accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('account_number', sa.String(64), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('classification', sa.String(32), nullable=False),
        sa.Column('currency', sa.CHAR(3), server_default='INR', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.UniqueConstraint('organization_id', 'account_number', name='uq_org_account')
    )

    op.create_table('journal_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('reference_number', sa.String(128), nullable=False),
        sa.Column('entry_date', sa.Date(), nullable=False),
        sa.Column('narration', sa.Text(), nullable=False),
        sa.Column('posted_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('posted_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.UniqueConstraint('organization_id', 'reference_number', name='uq_org_reference')
    )

    op.create_table('postings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('journal_entry_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('journal_entries.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounts.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('direction', sa.String(8), nullable=False),
        sa.Column('amount', sa.Numeric(18, 4), nullable=False),
        sa.CheckConstraint('amount > 0', name='chk_positive_amt')
    )

    op.execute('''
    CREATE OR REPLACE FUNCTION verify_journal_entry_balance() RETURNS TRIGGER AS $$
    DECLARE v_offset NUMERIC(18, 4);
    BEGIN
        SELECT COALESCE(SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE -amount END), 0)
        INTO v_offset FROM postings WHERE journal_entry_id = NEW.journal_entry_id;
        IF v_offset <> 0 THEN
            RAISE EXCEPTION 'Imbalance detected: offset is %', v_offset;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    ''')

    op.execute('''
    CREATE CONSTRAINT TRIGGER trg_verify_entry_balance
    AFTER INSERT OR UPDATE ON postings
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION verify_journal_entry_balance();
    ''')

def downgrade():
    op.execute('DROP TRIGGER IF EXISTS trg_verify_entry_balance ON postings;')
    op.execute('DROP FUNCTION IF EXISTS verify_journal_entry_balance;')
    op.drop_table('postings')
    op.drop_table('journal_entries')
    op.drop_table('accounts')
    op.drop_table('memberships')
    op.drop_table('organizations')
    op.drop_table('users')