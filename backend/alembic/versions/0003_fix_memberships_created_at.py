from alembic import op
import sqlalchemy as sa

revision = "0003_fix_memberships_created_at"
down_revision = "0002_goals_recurring"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "memberships",
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade():
    op.drop_column("memberships", "created_at")
