"""Add Google identity and revocable sessions.

Revision ID: b71209a4e821
Revises: f27ac01928d8
"""
from alembic import op
import sqlalchemy as sa

revision = "b71209a4e821"
down_revision = "f27ac01928d8"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("usuarios") as batch:
        batch.alter_column("senha_hash", existing_type=sa.String(255), nullable=True)
        batch.add_column(sa.Column("google_subject", sa.String(255), nullable=True))
        batch.add_column(sa.Column("google_refresh_token", sa.Text(), nullable=True))
        batch.create_unique_constraint("uq_usuarios_google_subject", ["google_subject"])
    op.create_table(
        "auth_sessions",
        sa.Column("token_hash", sa.String(64), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"])
    op.create_index("ix_auth_sessions_expires_at", "auth_sessions", ["expires_at"])


def downgrade():
    op.drop_table("auth_sessions")
    # Contas Google ficam sem senha utilizável ao voltar para o schema anterior.
    op.execute("UPDATE usuarios SET senha_hash = '!' WHERE senha_hash IS NULL")
    with op.batch_alter_table("usuarios") as batch:
        batch.drop_constraint("uq_usuarios_google_subject", type_="unique")
        batch.drop_column("google_refresh_token")
        batch.drop_column("google_subject")
        batch.alter_column("senha_hash", existing_type=sa.String(255), nullable=False)
