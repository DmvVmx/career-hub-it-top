"""seed base dictionaries"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "d25813623654"
down_revision = "497b4824492e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO roles (id, name) VALUES
        (1, 'student'),
        (2, 'employer'),
        (3, 'admin');
    """)

    op.execute("""
        INSERT INTO auth_sources (id, name) VALUES
        (1, 'internal'),
        (2, 'journal');
    """)

    op.execute("""
        INSERT INTO system_statuses (id, category, name) VALUES
        (1, 'user', 'active'),
        (2, 'user', 'banned'),
        (3, 'user', 'deleted'),
        (4, 'employer', 'pending'),
        (5, 'employer', 'approved'),
        (6, 'employer', 'rejected'),
        (7, 'vacancy', 'draft'),
        (8, 'vacancy', 'published'),
        (9, 'vacancy', 'archived'),
        (10, 'application', 'sent'),
        (11, 'application', 'viewed'),
        (12, 'application', 'accepted'),
        (13, 'application', 'rejected');
    """)


def downgrade() -> None:
    op.execute("""
        DELETE FROM system_statuses
        WHERE id IN (1,2,3,4,5,6,7,8,9,10,11,12,13);
    """)

    op.execute("""
        DELETE FROM auth_sources
        WHERE id IN (1,2);
    """)

    op.execute("""
        DELETE FROM roles
        WHERE id IN (1,2,3);
    """)