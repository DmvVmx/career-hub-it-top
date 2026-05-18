from sqlalchemy import Column, Integer, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)

    student_profile_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    employer_profile_id = Column(Integer, ForeignKey("employer_profiles.id"), nullable=False)
    vacancy_id = Column(Integer, ForeignKey("vacancies.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)

    message = Column(Text, nullable=True)

    status_id = Column(Integer, ForeignKey("system_statuses.id"), nullable=False)

    created_at = Column(DateTime, server_default=func.now())

    # ВОТ ГЛАВНОЕ ИСПРАВЛЕНИЕ
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # связи
    student = relationship("StudentProfile")
    employer = relationship("EmployerProfile")
    vacancy = relationship("Vacancy")
    resume = relationship("Resume")
    status = relationship("SystemStatus")