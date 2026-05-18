from datetime import datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.core.catalogs import (
    validate_city,
    validate_direction,
    validate_skills,
)


class ResumeUpsertRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    about: str | None = None

    city: str = Field(min_length=2, max_length=100)
    direction: str = Field(min_length=2, max_length=50)
    skills: str = Field(min_length=1, max_length=3000)

    experience: str | None = None
    education: str | None = None
    contacts: str | None = None
    is_public: bool = True

    @field_validator("title", "city", "direction", "skills")
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

    @model_validator(mode="after")
    def validate_skills_field(self):
        self.skills = validate_skills(self.skills)
        return self


class ResumeStudentResponse(BaseModel):
    id: int
    full_name: str | None = None
    group_name: str | None = None
    photo_url: str | None = None


class ResumeResponse(BaseModel):
    id: int
    title: str
    about: str | None = None

    city: str | None = None
    direction: str | None = None
    skills: str | None = None

    experience: str | None = None
    education: str | None = None
    contacts: str | None = None
    is_public: bool
    status: str
    rejection_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    student: ResumeStudentResponse | None = None


class ResumeListResponse(BaseModel):
    items: list[ResumeResponse]
    total: int
    limit: int
    offset: int