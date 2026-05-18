from datetime import datetime

from pydantic import BaseModel


class CompanyVacancyResponse(BaseModel):
    id: int
    title: str
    salary_from: int | None = None
    salary_to: int | None = None
    city: str | None = None
    work_format: str | None = None
    employment_type: str | None = None
    created_at: datetime


class CompanyPublicProfileResponse(BaseModel):
    id: int
    company_name: str
    inn: str
    phone: str | None = None
    avatar_url: str | None = None
    description: str | None = None
    status: str
    vacancies: list[CompanyVacancyResponse]