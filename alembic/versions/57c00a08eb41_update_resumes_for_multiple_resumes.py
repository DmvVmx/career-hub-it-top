"""update resumes for multiple resumes

Revision ID: 57c00a08eb41
Revises: f1f5836fd00d
Create Date: 2026-04-25 16:55:48.487701

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "57c00a08eb41"
down_revision: Union[str, Sequence[str], None] = "f1f5836fd00d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO system_statuses (category, name)
        VALUES
            ('resume', 'published'),
            ('resume', 'archived'),
            ('resume', 'deleted')
        ON CONFLICT (category, name) DO NOTHING;
    """)

    op.execute("""
        SELECT setval(
            pg_get_serial_sequence('system_statuses', 'id'),
            (SELECT MAX(id) FROM system_statuses)
        );
    """)

    op.add_column(
        "resumes",
        sa.Column("status_id", sa.Integer(), nullable=True),
    )

    op.execute("""
        UPDATE resumes
        SET status_id = (
            SELECT id FROM system_statuses
            WHERE category = 'resume' AND name = 'published'
            LIMIT 1
        )
        WHERE status_id IS NULL;
    """)

    op.alter_column(
        "resumes",
        "status_id",
        nullable=False,
    )

    op.create_foreign_key(
        "fk_resumes_status_id_system_statuses",
        "resumes",
        "system_statuses",
        ["status_id"],
        ["id"],
    )

    op.create_index(
        "ix_resumes_status_id",
        "resumes",
        ["status_id"],
        unique=False,
    )

    op.execute("""
    ALTER TABLE resumes
    DROP CONSTRAINT IF EXISTS resumes_student_profile_id_key;
""")


def downgrade() -> None:
    op.create_unique_constraint(
    "resumes_student_profile_id_key",
    "resumes",
    ["student_profile_id"],
)

    op.drop_index("ix_resumes_status_id", table_name="resumes")

    op.drop_constraint(
        "fk_resumes_status_id_system_statuses",
        "resumes",
        type_="foreignkey",
    )

    op.drop_column("resumes", "status_id")

    op.execute("""
        DELETE FROM system_statuses
        WHERE category = 'resume'
        AND name IN ('published', 'archived', 'deleted');
    """)