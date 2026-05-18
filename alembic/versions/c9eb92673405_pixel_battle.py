"""pixel battle

Revision ID: c9eb92673405
Revises: f9aa6e72bd8d
Create Date: 2026-05-05 14:59:43.991287

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c9eb92673405"
down_revision: Union[str, Sequence[str], None] = "f9aa6e72bd8d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        "pixel_battle_clans",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("emoji", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_default", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_pixel_battle_clans_name"),
        "pixel_battle_clans",
        ["name"],
        unique=True,
    )

    op.create_table(
        "pixel_battle_seasons",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("width", sa.Integer(), server_default="100", nullable=False),
        sa.Column("height", sa.Integer(), server_default="60", nullable=False),
        sa.Column("status", sa.String(length=30), server_default="active", nullable=False),
        sa.Column(
            "starts_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("final_snapshot_json", sa.Text(), nullable=True),
        sa.Column("winner_clan_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["winner_clan_id"], ["pixel_battle_clans.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_pixel_battle_seasons_status"),
        "pixel_battle_seasons",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_pixel_battle_seasons_winner_clan_id"),
        "pixel_battle_seasons",
        ["winner_clan_id"],
        unique=False,
    )

    op.create_table(
        "pixel_battle_user_states",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("season_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("last_pixel_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["season_id"], ["pixel_battle_seasons.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "season_id",
            "user_id",
            name="uq_pixel_battle_user_states_season_user",
        ),
    )
    op.create_index(
        op.f("ix_pixel_battle_user_states_season_id"),
        "pixel_battle_user_states",
        ["season_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_pixel_battle_user_states_user_id"),
        "pixel_battle_user_states",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "pixel_battle_clan_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("clan_id", sa.Integer(), nullable=False),
        sa.Column("student_profile_id", sa.Integer(), nullable=False),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["clan_id"], ["pixel_battle_clans.id"]),
        sa.ForeignKeyConstraint(["student_profile_id"], ["student_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_pixel_battle_clan_members_clan_id"),
        "pixel_battle_clan_members",
        ["clan_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_pixel_battle_clan_members_student_profile_id"),
        "pixel_battle_clan_members",
        ["student_profile_id"],
        unique=True,
    )

    op.create_table(
        "pixel_battle_pixel_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("season_id", sa.Integer(), nullable=False),
        sa.Column("x", sa.Integer(), nullable=False),
        sa.Column("y", sa.Integer(), nullable=False),
        sa.Column("old_color", sa.String(length=20), nullable=True),
        sa.Column("new_color", sa.String(length=20), nullable=False),
        sa.Column("old_clan_id", sa.Integer(), nullable=True),
        sa.Column("new_clan_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("student_profile_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["new_clan_id"], ["pixel_battle_clans.id"]),
        sa.ForeignKeyConstraint(["old_clan_id"], ["pixel_battle_clans.id"]),
        sa.ForeignKeyConstraint(["season_id"], ["pixel_battle_seasons.id"]),
        sa.ForeignKeyConstraint(["student_profile_id"], ["student_profiles.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_pixel_battle_pixel_events_created_at"),
        "pixel_battle_pixel_events",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_pixel_battle_pixel_events_new_clan_id"),
        "pixel_battle_pixel_events",
        ["new_clan_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_pixel_battle_pixel_events_old_clan_id"),
        "pixel_battle_pixel_events",
        ["old_clan_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_pixel_battle_pixel_events_season_id"),
        "pixel_battle_pixel_events",
        ["season_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_pixel_battle_pixel_events_student_profile_id"),
        "pixel_battle_pixel_events",
        ["student_profile_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_pixel_battle_pixel_events_user_id"),
        "pixel_battle_pixel_events",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "pixel_battle_pixels",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("season_id", sa.Integer(), nullable=False),
        sa.Column("x", sa.Integer(), nullable=False),
        sa.Column("y", sa.Integer(), nullable=False),
        sa.Column("color", sa.String(length=20), nullable=False),
        sa.Column("updated_by_user_id", sa.Integer(), nullable=False),
        sa.Column("updated_by_student_profile_id", sa.Integer(), nullable=False),
        sa.Column("updated_by_clan_id", sa.Integer(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["season_id"], ["pixel_battle_seasons.id"]),
        sa.ForeignKeyConstraint(["updated_by_clan_id"], ["pixel_battle_clans.id"]),
        sa.ForeignKeyConstraint(
            ["updated_by_student_profile_id"],
            ["student_profiles.id"],
        ),
        sa.ForeignKeyConstraint(["updated_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "season_id",
            "x",
            "y",
            name="uq_pixel_battle_pixels_season_xy",
        ),
    )
    op.create_index(
        op.f("ix_pixel_battle_pixels_season_id"),
        "pixel_battle_pixels",
        ["season_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_pixel_battle_pixels_updated_by_clan_id"),
        "pixel_battle_pixels",
        ["updated_by_clan_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_pixel_battle_pixels_updated_by_student_profile_id"),
        "pixel_battle_pixels",
        ["updated_by_student_profile_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_pixel_battle_pixels_updated_by_user_id"),
        "pixel_battle_pixels",
        ["updated_by_user_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(
        op.f("ix_pixel_battle_pixels_updated_by_user_id"),
        table_name="pixel_battle_pixels",
    )
    op.drop_index(
        op.f("ix_pixel_battle_pixels_updated_by_student_profile_id"),
        table_name="pixel_battle_pixels",
    )
    op.drop_index(
        op.f("ix_pixel_battle_pixels_updated_by_clan_id"),
        table_name="pixel_battle_pixels",
    )
    op.drop_index(
        op.f("ix_pixel_battle_pixels_season_id"),
        table_name="pixel_battle_pixels",
    )
    op.drop_table("pixel_battle_pixels")

    op.drop_index(
        op.f("ix_pixel_battle_pixel_events_user_id"),
        table_name="pixel_battle_pixel_events",
    )
    op.drop_index(
        op.f("ix_pixel_battle_pixel_events_student_profile_id"),
        table_name="pixel_battle_pixel_events",
    )
    op.drop_index(
        op.f("ix_pixel_battle_pixel_events_season_id"),
        table_name="pixel_battle_pixel_events",
    )
    op.drop_index(
        op.f("ix_pixel_battle_pixel_events_old_clan_id"),
        table_name="pixel_battle_pixel_events",
    )
    op.drop_index(
        op.f("ix_pixel_battle_pixel_events_new_clan_id"),
        table_name="pixel_battle_pixel_events",
    )
    op.drop_index(
        op.f("ix_pixel_battle_pixel_events_created_at"),
        table_name="pixel_battle_pixel_events",
    )
    op.drop_table("pixel_battle_pixel_events")

    op.drop_index(
        op.f("ix_pixel_battle_clan_members_student_profile_id"),
        table_name="pixel_battle_clan_members",
    )
    op.drop_index(
        op.f("ix_pixel_battle_clan_members_clan_id"),
        table_name="pixel_battle_clan_members",
    )
    op.drop_table("pixel_battle_clan_members")

    op.drop_index(
        op.f("ix_pixel_battle_user_states_user_id"),
        table_name="pixel_battle_user_states",
    )
    op.drop_index(
        op.f("ix_pixel_battle_user_states_season_id"),
        table_name="pixel_battle_user_states",
    )
    op.drop_table("pixel_battle_user_states")

    op.drop_index(
        op.f("ix_pixel_battle_seasons_winner_clan_id"),
        table_name="pixel_battle_seasons",
    )
    op.drop_index(
        op.f("ix_pixel_battle_seasons_status"),
        table_name="pixel_battle_seasons",
    )
    op.drop_table("pixel_battle_seasons")

    op.drop_index(
        op.f("ix_pixel_battle_clans_name"),
        table_name="pixel_battle_clans",
    )
    op.drop_table("pixel_battle_clans")