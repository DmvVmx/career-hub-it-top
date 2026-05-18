"""create chats

Revision ID: 9d8ba2e75be7
Revises: b6339a5c3246
Create Date: 2026-04-27 08:21:37.928136

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9d8ba2e75be7'
down_revision: Union[str, Sequence[str], None] = 'b6339a5c3246'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "chats",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_profile_id", sa.Integer(), sa.ForeignKey("student_profiles.id"), nullable=False),
        sa.Column("employer_profile_id", sa.Integer(), sa.ForeignKey("employer_profiles.id"), nullable=False),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("applications.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("student_profile_id", "employer_profile_id", name="uq_chats_student_employer"),
    )

    op.create_index("ix_chats_student_profile_id", "chats", ["student_profile_id"])
    op.create_index("ix_chats_employer_profile_id", "chats", ["employer_profile_id"])
    op.create_index("ix_chats_application_id", "chats", ["application_id"])

    op.create_table(
        "chat_messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("chat_id", sa.Integer(), sa.ForeignKey("chats.id"), nullable=False),
        sa.Column("sender_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("file_url", sa.String(length=500), nullable=True),
        sa.Column("file_name", sa.String(length=255), nullable=True),
        sa.Column("file_type", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_index("ix_chat_messages_chat_id", "chat_messages", ["chat_id"])
    op.create_index("ix_chat_messages_sender_user_id", "chat_messages", ["sender_user_id"])


def downgrade() -> None:
    op.drop_index("ix_chat_messages_sender_user_id", table_name="chat_messages")
    op.drop_index("ix_chat_messages_chat_id", table_name="chat_messages")
    op.drop_table("chat_messages")

    op.drop_index("ix_chats_application_id", table_name="chats")
    op.drop_index("ix_chats_employer_profile_id", table_name="chats")
    op.drop_index("ix_chats_student_profile_id", table_name="chats")
    op.drop_table("chats")
