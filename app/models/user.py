from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Boolean
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    username: Mapped[str | None] = mapped_column(String(100), unique=True, index=True, nullable=True)
    journal_login: Mapped[str | None] = mapped_column(String(100), unique=True, index=True, nullable=True)

    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)

    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    auth_source_id: Mapped[int] = mapped_column(ForeignKey("auth_sources.id"), nullable=False)
    status_id: Mapped[int] = mapped_column(ForeignKey("system_statuses.id"), nullable=False)

    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    is_email_verified: Mapped[bool] = mapped_column(
    Boolean, default=False, server_default="false", nullable=False
    )
    email_verified_at: Mapped[datetime | None] = mapped_column(
    DateTime(timezone=True), nullable=True
    )
    