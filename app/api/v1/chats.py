from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.encoders import jsonable_encoder
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models import (
    Application,
    Chat,
    ChatMessage,
    EmployerProfile,
    Resume,
    StudentProfile,
    User,
    Vacancy,
)
from app.schemas.chat import (
    ChatCloseRequest,
    ChatListResponse,
    ChatMessageCreateRequest,
    ChatMessageListResponse,
    ChatMessageResponse,
    ChatResponse,
    ChatResumeResponse,
    ChatUserResponse,
    ChatVacancyResponse,
)
from app.services.chat_service import (
    close_chat,
    create_chat_message,
    create_or_get_chat_from_application,
    get_chat_messages,
    get_my_chats,
    get_user_role,
    reopen_chat,
    save_chat_file,
)

from app.api.v1.chat_ws import manager


router = APIRouter(prefix="/chats", tags=["Chats"])


def build_message_response(message: ChatMessage) -> ChatMessageResponse:
    return ChatMessageResponse(
        id=message.id,
        chat_id=message.chat_id,
        sender_user_id=message.sender_user_id,
        text=message.text,
        file_url=message.file_url,
        file_name=message.file_name,
        file_type=message.file_type,
        created_at=message.created_at,
    )


async def build_chat_response(
    db: AsyncSession,
    user: User,
    chat: Chat,
) -> ChatResponse:
    role = await get_user_role(db=db, user=user)

    companion = None
    vacancy_response = None
    resume_response = None

    if role == "student":
        employer = await db.get(EmployerProfile, chat.employer_profile_id)

        if employer:
            companion = ChatUserResponse(
                user_id=employer.user_id,
                role="employer",
                company_name=employer.company_name,
                avatar_url=employer.avatar_url,
            )

    if role == "employer":
        student = await db.get(StudentProfile, chat.student_profile_id)

        if student:
            companion = ChatUserResponse(
                user_id=student.user_id,
                role="student",
                full_name=student.full_name,
                photo_url=student.photo_url,
            )

    application = await db.get(Application, chat.application_id)

    if application:
        vacancy = await db.get(Vacancy, application.vacancy_id)

        if vacancy:
            vacancy_response = ChatVacancyResponse(
                id=vacancy.id,
                title=vacancy.title,
                city=vacancy.city,
                direction=vacancy.direction,
                work_format=vacancy.work_format,
                employment_type=vacancy.employment_type,
            )

        if application.resume_id:
            resume = await db.get(Resume, application.resume_id)

            if resume:
                resume_response = ChatResumeResponse(
                    id=resume.id,
                    title=resume.title,
                    about=resume.about,
                    city=resume.city,
                    direction=resume.direction,
                    skills=resume.skills,
                    experience=resume.experience,
                    education=resume.education,
                    contacts=resume.contacts,
                    is_public=resume.is_public,
                    created_at=resume.created_at,
                    updated_at=resume.updated_at,
                )

    last_message = await db.scalar(
        select(ChatMessage)
        .where(ChatMessage.chat_id == chat.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(1)
    )

    last_message_text = None

    if last_message:
        last_message_text = last_message.text or last_message.file_name or "Файл"

    return ChatResponse(
        id=chat.id,
        student_profile_id=chat.student_profile_id,
        employer_profile_id=chat.employer_profile_id,
        application_id=chat.application_id,
        is_closed=chat.is_closed,
        closed_by_user_id=chat.closed_by_user_id,
        closed_at=chat.closed_at,
        close_reason=chat.close_reason,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        companion=companion,
        vacancy=vacancy_response,
        resume=resume_response,
        last_message=last_message_text,
    )


@router.post("/from-application/{application_id}", response_model=ChatResponse)
async def create_chat_from_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        chat = await create_or_get_chat_from_application(
            db=db,
            user=current_user,
            application_id=application_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_chat_response(db=db, user=current_user, chat=chat)


@router.get("", response_model=ChatListResponse)
async def get_chats(
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        chats, total = await get_my_chats(
            db=db,
            user=current_user,
            limit=limit,
            offset=offset,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return ChatListResponse(
        items=[
            await build_chat_response(db=db, user=current_user, chat=chat)
            for chat in chats
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{chat_id}/messages", response_model=ChatMessageListResponse)
async def get_messages(
    chat_id: int,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        messages, total = await get_chat_messages(
            db=db,
            user=current_user,
            chat_id=chat_id,
            limit=limit,
            offset=offset,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return ChatMessageListResponse(
        items=[build_message_response(message) for message in messages],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/{chat_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    chat_id: int,
    payload: ChatMessageCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        message = await create_chat_message(
            db=db,
            user=current_user,
            chat_id=chat_id,
            text=payload.text,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return build_message_response(message)


@router.post("/{chat_id}/messages/file", response_model=ChatMessageResponse)
async def send_file_message(
    chat_id: int,
    text: str | None = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        file_url, file_name, file_type = await save_chat_file(file)

        message = await create_chat_message(
            db=db,
            user=current_user,
            chat_id=chat_id,
            text=text,
            file_url=file_url,
            file_name=file_name,
            file_type=file_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    message_response = build_message_response(message)

    await manager.broadcast(
        chat_id,
        {
            "type": "message",
            "message": jsonable_encoder(message_response),
        },
    )

    return message_response


@router.patch("/{chat_id}/close", response_model=ChatResponse)
async def close_chat_endpoint(
    chat_id: int,
    payload: ChatCloseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        chat = await close_chat(
            db=db,
            user=current_user,
            chat_id=chat_id,
            reason=payload.reason,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    chat_response = await build_chat_response(db=db, user=current_user, chat=chat)

    await manager.broadcast(
        chat_id,
        {
            "type": "chat_closed",
            "chat": jsonable_encoder(chat_response),
        },
    )

    return chat_response


@router.patch("/{chat_id}/reopen", response_model=ChatResponse)
async def reopen_chat_endpoint(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        chat = await reopen_chat(
            db=db,
            user=current_user,
            chat_id=chat_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    chat_response = await build_chat_response(db=db, user=current_user, chat=chat)

    await manager.broadcast(
        chat_id,
        {
            "type": "chat_reopened",
            "chat": jsonable_encoder(chat_response),
        },
    )

    return chat_response