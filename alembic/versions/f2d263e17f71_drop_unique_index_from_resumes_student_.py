"""drop unique index from resumes student profile

Revision ID: f2d263e17f71
Revises: 57c00a08eb41
Create Date: 2026-04-25

"""
from typing import Sequence, Union

from alembic import op


revision: str = "f2d263e17f71"
down_revision: Union[str, Sequence[str], None] = "57c00a08eb41"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        DROP INDEX IF EXISTS ix_resumes_student_profile_id;
    """)

    op.create_index(
        "ix_resumes_student_profile_id",
        "resumes",
        ["student_profile_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_resumes_student_profile_id", table_name="resumes")

    op.create_index(
        "ix_resumes_student_profile_id",
        "resumes",
        ["student_profile_id"],
        unique=True,
    )