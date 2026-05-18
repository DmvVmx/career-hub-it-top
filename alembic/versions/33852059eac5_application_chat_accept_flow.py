"""application chat accept flow

Revision ID: 33852059eac5
Revises: 08f3b79240a3
Create Date: 2026-05-05 04:03:37.862546
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "33852059eac5"
down_revision: Union[str, Sequence[str], None] = "08f3b79240a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Новый статус: студент отклонил приглашение работодателя.
    op.execute(
        """
        INSERT INTO system_statuses (category, name)
        VALUES ('application', 'student_rejected')
        ON CONFLICT (category, name) DO NOTHING
        """
    )

    # Если в старой базе есть чаты без application_id,
    # удаляем их, потому что теперь чат обязан быть привязан к конкретному отклику.
    op.execute(
        """
        DELETE FROM chat_messages
        WHERE chat_id IN (
            SELECT id FROM chats WHERE application_id IS NULL
        )
        """
    )

    op.execute(
        """
        DELETE FROM chats
        WHERE application_id IS NULL
        """
    )

    # Убираем старую уникальность: один общий чат на студента и работодателя.
    op.drop_constraint(
        "uq_chats_student_employer",
        "chats",
        type_="unique",
    )

    # Теперь чат всегда должен быть связан с конкретным откликом.
    op.alter_column(
        "chats",
        "application_id",
        existing_type=sa.Integer(),
        nullable=False,
    )

    # Новая уникальность: один чат на один application.
    op.create_unique_constraint(
        "uq_chats_application",
        "chats",
        ["application_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_chats_application",
        "chats",
        type_="unique",
    )

    op.alter_column(
        "chats",
        "application_id",
        existing_type=sa.Integer(),
        nullable=True,
    )

    op.create_unique_constraint(
        "uq_chats_student_employer",
        "chats",
        ["student_profile_id", "employer_profile_id"],
    )

    op.execute(
        """
        DELETE FROM system_statuses
        WHERE category = 'application'
          AND name = 'student_rejected'
          AND id NOT IN (
              SELECT status_id FROM applications
          )
        """
    )