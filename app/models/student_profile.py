from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func,Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)

    journal_student_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    group_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    birthday: Mapped[date | None] = mapped_column(Date, nullable=True)
    level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ✅ НОВОЕ ПОЛЕ СТАТУСА
    status_id: Mapped[int] = mapped_column(
        ForeignKey("system_statuses.id"),
        nullable=False,
        server_default="21",  # pending
    )

    last_journal_sync_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )