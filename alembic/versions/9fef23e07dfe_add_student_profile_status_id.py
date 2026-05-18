"""add student profile status id

Revision ID: 9fef23e07dfe
Revises: c9eb92673405
Create Date: 2026-05-05 15:36:40.776143

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9fef23e07dfe"
down_revision: Union[str, Sequence[str], None] = "c9eb92673405"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "student_profiles",
        sa.Column("status_id", sa.Integer(), nullable=True),
    )

    op.create_foreign_key(
        "fk_student_profiles_status_id_system_statuses",
        "student_profiles",
        "system_statuses",
        ["status_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_student_profiles_status_id_system_statuses",
        "student_profiles",
        type_="foreignkey",
    )

    op.drop_column("student_profiles", "status_id")