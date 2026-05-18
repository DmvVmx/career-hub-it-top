from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.resume import ResumeResponse
from app.schemas.vacancy import VacancyResponse


class ApplicationCreateRequest(BaseModel):
    vacancy_id: int
    resume_id: int | None = None
    message: str | None = Field(default=None, max_length=2000)


class EmployerInviteStudentRequest(BaseModel):
    vacancy_id: int
    message: str | None = Field(default=None, max_length=2000)


class ApplicationStatusUpdateRequest(BaseModel):
    status: str = Field(pattern="^(viewed|invited|rejected)$")


class StudentApplicationStatusUpdateRequest(BaseModel):
    status: str = Field(pattern="^(accepted|student_rejected)$")


class ApplicationStudentResponse(BaseModel):
    id: int
    full_name: str | None = None
    group_name: str | None = None
    photo_url: str | None = None


class ApplicationCompanyResponse(BaseModel):
    id: int
    company_name: str
    avatar_url: str | None = None


class ApplicationResponse(BaseModel):
    id: int
    status: str
    message: str | None = None
    created_at: datetime
    updated_at: datetime

    student: ApplicationStudentResponse | None = None
    company: ApplicationCompanyResponse | None = None
    vacancy: VacancyResponse | None = None
    resume: ResumeResponse | None = None


class ApplicationListResponse(BaseModel):
    items: list[ApplicationResponse]
    total: int
    limit: int
    offset: int