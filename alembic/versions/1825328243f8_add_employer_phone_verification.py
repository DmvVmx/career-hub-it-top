from alembic import op
import sqlalchemy as sa


revision = "1825328243f8"
down_revision = "2941f17b50d7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "employer_profiles",
        sa.Column(
            "phone_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.add_column(
        "employer_profiles",
        sa.Column(
            "phone_verified_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("employer_profiles", "phone_verified_at")
    op.drop_column("employer_profiles", "phone_verified")