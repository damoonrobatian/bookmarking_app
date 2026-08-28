"""add user theme

Revision ID: 0002_user_theme
Revises: 0001_initial
Create Date: 2026-08-27
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_user_theme"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("theme", sa.String(length=32), server_default="terracotta", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "theme")
