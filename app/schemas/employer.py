import re

from pydantic import BaseModel, Field, field_validator


PHONE_RULE_MESSAGE = (
    "Телефон должен быть в формате +79991234567 или 89991234567. "
    "Разрешены только цифры, пробелы, скобки, дефисы и знак +."
)


def normalize_phone(value: str) -> str:
    cleaned = re.sub(r"[\s\-\(\)]", "", value)

    if cleaned.startswith("8") and len(cleaned) == 11:
        cleaned = "+7" + cleaned[1:]

    if cleaned.startswith("7") and len(cleaned) == 11:
        cleaned = "+" + cleaned

    if not re.fullmatch(r"\+7\d{10}", cleaned):
        raise ValueError(PHONE_RULE_MESSAGE)

    return cleaned


class EmployerProfileUpsertRequest(BaseModel):
    company_name: str = Field(min_length=2, max_length=255)
    inn: str = Field(min_length=10, max_length=12)
    phone: str = Field(min_length=10, max_length=30)
    avatar_url: str | None = Field(default=None, max_length=500)
    description: str = Field(min_length=10, max_length=3000)

    @field_validator("company_name")
    @classmethod
    def validate_company_name(cls, value: str) -> str:
        value = value.strip()

        if len(value) < 2:
            raise ValueError("Название компании обязательно")

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        value = value.strip()

        if len(value) < 10:
            raise ValueError("Описание компании должно содержать минимум 10 символов")

        return value

    @field_validator("inn")
    @classmethod
    def validate_inn(cls, value: str) -> str:
        value = value.strip()

        if not value.isdigit():
            raise ValueError("ИНН должен содержать только цифры")

        if len(value) not in (10, 12):
            raise ValueError("ИНН должен состоять из 10 или 12 цифр")

        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if not value:
            raise ValueError("Телефон обязателен")

        return normalize_phone(value)


class EmployerProfileResponse(BaseModel):
    id: int
    company_name: str
    inn: str
    phone: str | None = None
    avatar_url: str | None = None
    description: str | None = None
    status: str
    rejection_reason: str | None = None


class EmployerAvatarResponse(BaseModel):
    avatar_url: str