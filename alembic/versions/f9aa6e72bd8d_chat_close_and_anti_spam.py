"""chat close and anti spam

Revision ID: f9aa6e72bd8d
Revises: 33852059eac5
Create Date: 2026-05-05 04:39:56.426615
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f9aa6e72bd8d"
down_revision: Union[str, Sequence[str], None] = "33852059eac5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "chats",
        sa.Column(
            "is_closed",
            sa.Boolean(),
            server_default="false",
            nullable=False,
        ),
    )

    op.add_column(
        "chats",
        sa.Column(
            "closed_by_user_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "chats",
        sa.Column(
            "closed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "chats",
        sa.Column(
            "close_reason",
            sa.Text(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_chats_closed_by_user_id",
        "chats",
        ["closed_by_user_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_chats_closed_by_user_id_users",
        "chats",
        "users",
        ["closed_by_user_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_chats_closed_by_user_id_users",
        "chats",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_chats_closed_by_user_id",
        table_name="chats",
    )

    op.drop_column("chats", "close_reason")
    op.drop_column("chats", "closed_at")
    op.drop_column("chats", "closed_by_user_id")
    op.drop_column("chats", "is_closed")