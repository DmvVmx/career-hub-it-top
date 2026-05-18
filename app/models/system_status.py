from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class SystemStatus(Base):
    __tablename__ = "system_statuses"
    __table_args__ = (
        UniqueConstraint("category", "name", name="uq_system_statuses_category_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)