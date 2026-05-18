from datetime import datetime

from pydantic import BaseModel, Field


class AdminStatsResponse(BaseModel):
    users_total: int
    students_total: int
    employers_total: int
    employer_profiles_total: int
    employer_profiles_pending: int
    student_profiles_pending: int = 0
    vacancies_total: int
    resumes_total: int
    applications_total: int
    chats_total: int


class AdminListResponse(BaseModel):
    items: list
    total: int
    limit: int
    offset: int


class AdminRejectRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=2000)


class AdminEmployerStatusUpdateRequest(BaseModel):
    status: str = Field(pattern="^(pending|approved|rejected)$")


class AdminStudentStatusUpdateRequest(BaseModel):
    status: str = Field(pattern="^(pending|approved|rejected)$")


class AdminUserResponse(BaseModel):
    id: int
    email: str | None = None
    username: str | None = None
    journal_login: str | None = None
    role: str
    status: str | None = None
    is_email_verified: bool
    created_at: datetime


class AdminEmployerProfileResponse(BaseModel):
    id: int
    user_id: int
    email: str | None = None
    company_name: str
    inn: str
    phone: str | None = None
    avatar_url: str | None = None
    description: str | None = None
    status: str
    user_status: str | None = None
    rejection_reason: str | None = None
    created_at: datetime
    updated_at: datetime


class AdminStudentProfileResponse(BaseModel):
    id: int
    user_id: int
    email: str | None = None
    full_name: str
    group_name: str | None = None
    photo_url: str | None = None
    birthday: datetime | None = None
    level: int | None = None
    status: str
    user_status: str | None = None
    rejection_reason: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class AdminVacancyResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    requirements: str | None = None
    salary_from: int | None = None
    salary_to: int | None = None
    city: str | None = None
    work_format: str | None = None
    employment_type: str | None = None
    company_name: str | None = None
    employer_profile_id: int | None = None
    status: str
    rejection_reason: str | None = None
    created_at: datetime
    updated_at: datetime | None = None


class AdminResumeResponse(BaseModel):
    id: int
    title: str
    about: str | None = None
    skills: str | None = None
    experience: str | None = None
    education: str | None = None
    contacts: str | None = None
    student_name: str | None = None
    student_profile_id: int | None = None
    group_name: str | None = None
    status: str
    is_public: bool
    rejection_reason: str | None = None
    created_at: datetime
    updated_at: datetime


class AdminApplicationResponse(BaseModel):
    id: int
    student_name: str | None = None
    company_name: str | None = None
    vacancy_title: str | None = None
    resume_title: str | None = None
    message: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime