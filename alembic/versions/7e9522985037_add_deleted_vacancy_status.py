"""add deleted vacancy status"""

from alembic import op


revision = "7e9522985037"
down_revision = "42e975cd7c85"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO system_statuses (id, category, name)
        VALUES (14, 'vacancy', 'deleted')
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
        WHERE category = 'vacancy' AND name = 'deleted';
    """)