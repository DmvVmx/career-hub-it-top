"""update resumes for multiple resumes

Revision ID: f1f5836fd00d
Revises: 42c9c07eb60b
Create Date: 2026-04-25 16:55:31.128612

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1f5836fd00d'
down_revision: Union[str, Sequence[str], None] = '42c9c07eb60b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
