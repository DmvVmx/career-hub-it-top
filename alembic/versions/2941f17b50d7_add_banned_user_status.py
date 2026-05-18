"""add banned user status

Revision ID: 2941f17b50d7
Revises: 9d8ba2e75be7
Create Date: 2026-04-27 11:53:09.311813

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2941f17b50d7'
down_revision: Union[str, Sequence[str], None] = '9d8ba2e75be7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO system_statuses (category, name)
        VALUES ('user', 'banned')
        ON CONFLICT (category, name) DO NOTHING;
    """)

    op.execute("""
        SELECT setval(
            pg_get_serial_sequence('system_statuses', 'id'),
            (SELECT MAX(id) FROM system_statuses)
        );
    """)


def downgrade() -> None:
    op.execute("""
        DELETE FROM system_statuses
        WHERE category = 'user'
        AND name = 'banned';
    """)