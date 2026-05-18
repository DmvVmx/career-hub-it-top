"""create applications"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b0d15fc7d4ca"
down_revision: Union[str, Sequence[str], None] = "f2d263e17f71"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO system_statuses (category, name)
        VALUES
            ('application', 'sent'),
            ('application', 'viewed'),
            ('application', 'invited'),
            ('application', 'rejected')
        ON CONFLICT (category, name) DO NOTHING;
    """)

    op.execute("""
        SELECT setval(
            pg_get_serial_sequence('system_statuses', 'id'),
            (SELECT MAX(id) FROM system_statuses)
        );
    """)

    op.create_table(
        "applications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_profile_id", sa.Integer(), sa.ForeignKey("student_profiles.id"), nullable=False),
        sa.Column("employer_profile_id", sa.Integer(), sa.ForeignKey("employer_profiles.id"), nullable=False),
        sa.Column("vacancy_id", sa.Integer(), sa.ForeignKey("vacancies.id"), nullable=False),
        sa.Column("resume_id", sa.Integer(), sa.ForeignKey("resumes.id"), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status_id", sa.Integer(), sa.ForeignKey("system_statuses.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_index("ix_applications_student_profile_id", "applications", ["student_profile_id"])
    op.create_index("ix_applications_employer_profile_id", "applications", ["employer_profile_id"])
    op.create_index("ix_applications_vacancy_id", "applications", ["vacancy_id"])
    op.create_index("ix_applications_resume_id", "applications", ["resume_id"])
    op.create_index("ix_applications_status_id", "applications", ["status_id"])

    op.create_unique_constraint(
        "uq_applications_student_vacancy",
        "applications",
        ["student_profile_id", "vacancy_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_applications_student_vacancy", "applications", type_="unique")

    op.drop_index("ix_applications_status_id", table_name="applications")
    op.drop_index("ix_applications_resume_id", table_name="applications")
    op.drop_index("ix_applications_vacancy_id", table_name="applications")
    op.drop_index("ix_applications_employer_profile_id", table_name="applications")
    op.drop_index("ix_applications_student_profile_id", table_name="applications")

    op.drop_table("applications")

    op.execute("""
        DELETE FROM system_statuses
        WHERE category = 'application'
        AND name IN ('sent', 'viewed', 'invited', 'rejected');
    """)