"""Link completed consultations to their Google Calendar events.

Revision ID: c62d17a9e4f0
Revises: b71209a4e821
"""

from alembic import op
import sqlalchemy as sa

revision = "c62d17a9e4f0"
down_revision = "b71209a4e821"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("consultas") as batch:
        batch.add_column(sa.Column("google_event_id", sa.String(1024), nullable=True))
        batch.create_index("ix_consultas_google_event_id", ["google_event_id"], unique=True)


def downgrade():
    with op.batch_alter_table("consultas") as batch:
        batch.drop_index("ix_consultas_google_event_id")
        batch.drop_column("google_event_id")
