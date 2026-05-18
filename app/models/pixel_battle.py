from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class PixelBattleClan(Base):
    __tablename__ = "pixel_battle_clans"

    id: Mapped[int] = mapped_column(primary_key=True)

    emoji: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_default: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="true",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class PixelBattleClanMember(Base):
    __tablename__ = "pixel_battle_clan_members"

    id: Mapped[int] = mapped_column(primary_key=True)

    clan_id: Mapped[int] = mapped_column(
        ForeignKey("pixel_battle_clans.id"),
        nullable=False,
        index=True,
    )

    student_profile_id: Mapped[int] = mapped_column(
        ForeignKey("student_profiles.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class PixelBattleSeason(Base):
    __tablename__ = "pixel_battle_seasons"

    id: Mapped[int] = mapped_column(primary_key=True)

    title: Mapped[str] = mapped_column(String(150), nullable=False)

    width: Mapped[int] = mapped_column(Integer, nullable=False, server_default="200")
    height: Mapped[int] = mapped_column(Integer, nullable=False, server_default="120")

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        server_default="active",
        index=True,
    )

    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    ends_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    final_snapshot_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    winner_clan_id: Mapped[int | None] = mapped_column(
        ForeignKey("pixel_battle_clans.id"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class PixelBattlePixel(Base):
    __tablename__ = "pixel_battle_pixels"

    id: Mapped[int] = mapped_column(primary_key=True)

    season_id: Mapped[int] = mapped_column(
        ForeignKey("pixel_battle_seasons.id"),
        nullable=False,
        index=True,
    )

    x: Mapped[int] = mapped_column(Integer, nullable=False)
    y: Mapped[int] = mapped_column(Integer, nullable=False)

    color: Mapped[str] = mapped_column(String(20), nullable=False)

    updated_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    updated_by_student_profile_id: Mapped[int] = mapped_column(
        ForeignKey("student_profiles.id"),
        nullable=False,
        index=True,
    )

    updated_by_clan_id: Mapped[int] = mapped_column(
        ForeignKey("pixel_battle_clans.id"),
        nullable=False,
        index=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "season_id",
            "x",
            "y",
            name="uq_pixel_battle_pixels_season_xy",
        ),
    )


class PixelBattlePixelEvent(Base):
    __tablename__ = "pixel_battle_pixel_events"

    id: Mapped[int] = mapped_column(primary_key=True)

    season_id: Mapped[int] = mapped_column(
        ForeignKey("pixel_battle_seasons.id"),
        nullable=False,
        index=True,
    )

    x: Mapped[int] = mapped_column(Integer, nullable=False)
    y: Mapped[int] = mapped_column(Integer, nullable=False)

    old_color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    new_color: Mapped[str] = mapped_column(String(20), nullable=False)

    old_clan_id: Mapped[int | None] = mapped_column(
        ForeignKey("pixel_battle_clans.id"),
        nullable=True,
        index=True,
    )

    new_clan_id: Mapped[int] = mapped_column(
        ForeignKey("pixel_battle_clans.id"),
        nullable=False,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    student_profile_id: Mapped[int] = mapped_column(
        ForeignKey("student_profiles.id"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )


class PixelBattleUserState(Base):
    __tablename__ = "pixel_battle_user_states"

    id: Mapped[int] = mapped_column(primary_key=True)

    season_id: Mapped[int] = mapped_column(
        ForeignKey("pixel_battle_seasons.id"),
        nullable=False,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    last_pixel_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "season_id",
            "user_id",
            name="uq_pixel_battle_user_states_season_user",
        ),
    )