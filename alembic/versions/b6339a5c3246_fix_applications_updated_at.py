"""fix applications updated_at

Revision ID: b6339a5c3246
Revises: b0d15fc7d4ca
Create Date: 2026-04-27 07:47:43.476581

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b6339a5c3246'
down_revision: Union[str, Sequence[str], None] = 'b0d15fc7d4ca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE applications
        ALTER COLUMN updated_at SET DEFAULT now();
    """)

    op.execute("""
        UPDATE applications
        SET updated_at = created_at
        WHERE updated_at IS NULL;
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE applications
        ALTER COLUMN updated_at DROP DEFAULT;
    """)