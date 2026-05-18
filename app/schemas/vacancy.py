from datetime import datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.core.catalogs import (
    validate_city,
    validate_direction,
    validate_employment_type,
    validate_skills,
    validate_work_format,
)


class VacancyCompanyResponse(BaseModel):
    id: int
    company_name: str
    avatar_url: str | None = None
    status: str


class VacancyCreateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=10)
    requirements: str = Field(min_length=2)

    salary_from: int | None = Field(default=None, ge=0)
    salary_to: int | None = Field(default=None, ge=0)

    city: str = Field(min_length=2, max_length=100)
    direction: str = Field(min_length=2, max_length=50)
    skills: str = Field(min_length=1, max_length=3000)

    work_format: str = Field(min_length=2, max_length=50)
    employment_type: str = Field(min_length=2, max_length=50)

    @field_validator(
        "title",
        "description",
        "requirements",
        "city",
        "direction",
        "skills",
        "work_format",
        "employment_type",
    )
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Поле обязательно для заполнения")

        return value

    @field_validator("city")
    @classmethod
    def validate_city_field(cls, value: str) -> str:
        return validate_city(value)

    @field_validator("direction")
    @classmethod
    def validate_direction_field(cls, value: str) -> str:
        return validate_direction(value)

    @field_validator("work_format")
    @classmethod
    def validate_work_format_field(cls, value: str) -> str:
        return validate_work_format(value)

    @field_validator("employment_type")
    @classmethod
    def validate_employment_type_field(cls, value: str) -> str:
        return validate_employment_type(value)

    @model_validator(mode="after")
    def validate_salary_and_skills(self):
        if self.salary_from is not None and self.salary_to is not None:
            if self.salary_from > self.salary_to:
                raise ValueError("Зарплата “от” не может быть больше зарплаты “до”")

        self.skills = validate_skills(self.skills)

        return self


class VacancyUpdateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=10)
    requirements: str = Field(min_length=2)

    salary_from: int | None = Field(default=None, ge=0)
    salary_to: int | None = Field(default=None, ge=0)

    city: str = Field(min_length=2, max_length=100)
    direction: str = Field(min_length=2, max_length=50)
    skills: str = Field(min_length=1, max_length=3000)

    work_format: str = Field(min_length=2, max_length=50)
    employment_type: str = Field(min_length=2, max_length=50)

    @field_validator(
        "title",
        "description",
        "requirements",
        "city",
        "direction",
        "skills",
        "work_format",
        "employment_type",
    )
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Поле обязательно для заполнения")

        return value

    @field_validator("city")
    @classmethod
    def validate_city_field(cls, value: str) -> str:
        return validate_city(value)

    @field_validator("direction")
    @classmethod
    def validate_direction_field(cls, value: str) -> str:
        return validate_direction(value)

    @field_validator("work_format")
    @classmethod
    def validate_work_format_field(cls, value: str) -> str:
        return validate_work_format(value)

    @field_validator("employment_type")
    @classmethod
    def validate_employment_type_field(cls, value: str) -> str:
        return validate_employment_type(value)

    @model_validator(mode="after")
    def validate_salary_and_skills(self):
        if self.salary_from is not None and self.salary_to is not None:
            if self.salary_from > self.salary_to:
                raise ValueError("Зарплата “от” не может быть больше зарплаты “до”")

        self.skills = validate_skills(self.skills)

        return self


class VacancyResponse(BaseModel):
    id: int
    title: str
    description: str
    requirements: str

    salary_from: int | None = None
    salary_to: int | None = None

    city: str | None = None
    direction: str | None = None
    skills: str | None = None

    work_format: str
    employment_type: str

    status: str
    rejection_reason: str | None = None
    created_at: datetime
    company: VacancyCompanyResponse | None = None