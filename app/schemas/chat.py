from datetime import datetime

from pydantic import BaseModel, Field


class ChatUserResponse(BaseModel):
    user_id: int
    full_name: str | None = None
    role: str
    photo_url: str | None = None
    company_name: str | None = None
    avatar_url: str | None = None


class ChatVacancyResponse(BaseModel):
    id: int
    title: str
    city: str | None = None
    direction: str | None = None
    work_format: str | None = None
    employment_type: str | None = None


class ChatResumeResponse(BaseModel):
    id: int
    title: str
    about: str | None = None
    city: str | None = None
    direction: str | None = None
    skills: str | None = None
    experience: str | None = None
    education: str | None = None
    contacts: str | None = None
    is_public: bool = True
    created_at: datetime
    updated_at: datetime


class ChatCloseRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=1000)


class ChatResponse(BaseModel):
    id: int
    student_profile_id: int
    employer_profile_id: int
    application_id: int

    is_closed: bool = False
    closed_by_user_id: int | None = None
    closed_at: datetime | None = None
    close_reason: str | None = None

    created_at: datetime
    updated_at: datetime

    companion: ChatUserResponse | None = None
    vacancy: ChatVacancyResponse | None = None
    resume: ChatResumeResponse | None = None
    last_message: str | None = None


class ChatListResponse(BaseModel):
    items: list[ChatResponse]
    total: int
    limit: int
    offset: int


class ChatMessageCreateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)


class ChatMessageResponse(BaseModel):
    id: int
    chat_id: int
    sender_user_id: int
    text: str | None = None
    file_url: str | None = None
    file_name: str | None = None
    file_type: str | None = None
    created_at: datetime


class ChatMessageListResponse(BaseModel):
    items: list[ChatMessageResponse]
    total: int
    limit: int
    offset: int