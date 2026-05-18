"""add city direction skills fields

Revision ID: 08f3b79240a3
Revises: c058d0f6aa50
Create Date: 2026-05-03 10:33:10.597319

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '08f3b79240a3'
down_revision: Union[str, Sequence[str], None] = 'c058d0f6aa50'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "vacancies",
        sa.Column("direction", sa.String(length=50), nullable=True),
    )

    op.add_column(
        "vacancies",
        sa.Column("skills", sa.Text(), nullable=True),
    )

    op.add_column(
        "resumes",
        sa.Column("city", sa.String(length=100), nullable=True),
    )

    op.add_column(
        "resumes",
        sa.Column("direction", sa.String(length=50), nullable=True),
    )

    op.create_index("ix_vacancies_direction", "vacancies", ["direction"])
    op.create_index("ix_vacancies_city", "vacancies", ["city"])
    op.create_index("ix_resumes_direction", "resumes", ["direction"])
    op.create_index("ix_resumes_city", "resumes", ["city"])


def downgrade() -> None:
    op.drop_index("ix_resumes_city", table_name="resumes")
    op.drop_index("ix_resumes_direction", table_name="resumes")
    op.drop_index("ix_vacancies_city", table_name="vacancies")
    op.drop_index("ix_vacancies_direction", table_name="vacancies")

    op.drop_column("resumes", "direction")
    op.drop_column("resumes", "city")

    op.drop_column("vacancies", "skills")
    op.drop_column("vacancies", "direction")
