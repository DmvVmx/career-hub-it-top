"""add rejection reasons

Revision ID: c058d0f6aa50
Revises: 1825328243f8
Create Date: 2026-05-01 09:32:14.219886

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c058d0f6aa50'
down_revision: Union[str, Sequence[str], None] = '1825328243f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "employer_profiles",
        sa.Column("rejection_reason", sa.Text(), nullable=True),
    )

    op.add_column(
        "student_profiles",
        sa.Column("rejection_reason", sa.Text(), nullable=True),
    )

    op.add_column(
        "vacancies",
        sa.Column("rejection_reason", sa.Text(), nullable=True),
    )

    op.add_column(
        "resumes",
        sa.Column("rejection_reason", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("resumes", "rejection_reason")
    op.drop_column("vacancies", "rejection_reason")
    op.drop_column("student_profiles", "rejection_reason")
    op.drop_column("employer_profiles", "rejection_reason")

