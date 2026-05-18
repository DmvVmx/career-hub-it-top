import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Application,
    Chat,
    ChatMessage,
    EmployerProfile,
    Role,
    StudentProfile,
    SystemStatus,
    User,
)


CHAT_FILES_DIR = Path("static/chat_files")
CHAT_FILES_DIR.mkdir(parents=True, exist_ok=True)


async def get_user_role(db: AsyncSession, user: User) -> str:
    role = await db.get(Role, user.role_id)

    if not role:
        raise ValueError("Роль пользователя не найдена")

    return role.name


async def get_status_name(db: AsyncSession, status_id: int) -> str:
    status = await db.get(SystemStatus, status_id)
    return status.name if status else "unknown"


async def ensure_application_accepted(
    db: AsyncSession,
    application: Application,
) -> None:
    status_name = await get_status_name(db=db, status_id=application.status_id)

    if status_name != "accepted":
        raise ValueError("Чат доступен только после принятия приглашения студентом")


async def ensure_chat_open(chat: Chat) -> None:
    if chat.is_closed:
        raise ValueError("Чат закрыт. Отправка новых сообщений недоступна")


async def get_student_profile_for_user(
    db: AsyncSession,
    user: User,
) -> StudentProfile:
    profile = await db.scalar(
        select(StudentProfile).where(StudentProfile.user_id == user.id)
    )

    if not profile:
        raise ValueError("Профиль студента не найден")

    return profile


async def get_employer_profile_for_user(
    db: AsyncSession,
    user: User,
) -> EmployerProfile:
    profile = await db.scalar(
        select(EmployerProfile).where(EmployerProfile.user_id == user.id)
    )

    if not profile:
        raise ValueError("Профиль работодателя не найден")

    return profile


async def get_application_for_user(
    db: AsyncSession,
    user: User,
    application_id: int,
) -> Application:
    role = await get_user_role(db=db, user=user)

    if role == "student":
        profile = await get_student_profile_for_user(db=db, user=user)

        application = await db.scalar(
            select(Application).where(
                Application.id == application_id,
                Application.student_profile_id == profile.id,
            )
        )

    elif role == "employer":
        profile = await get_employer_profile_for_user(db=db, user=user)

        application = await db.scalar(
            select(Application).where(
                Application.id == application_id,
                Application.employer_profile_id == profile.id,
            )
        )

    else:
        raise ValueError("Чаты доступны только студентам и работодателям")

    if not application:
        raise ValueError("Отклик не найден или нет доступа")

    return application


async def create_or_get_chat_from_application(
    db: AsyncSession,
    user: User,
    application_id: int,
) -> Chat:
    application = await get_application_for_user(
        db=db,
        user=user,
        application_id=application_id,
    )

    await ensure_application_accepted(db=db, application=application)

    chat = await db.scalar(
        select(Chat).where(Chat.application_id == application.id)
    )

    if chat:
        return chat

    chat = Chat(
        student_profile_id=application.student_profile_id,
        employer_profile_id=application.employer_profile_id,
        application_id=application.id,
    )

    db.add(chat)
    await db.commit()
    await db.refresh(chat)

    return chat


async def get_my_chats(
    db: AsyncSession,
    user: User,
    limit: int,
    offset: int,
) -> tuple[list[Chat], int]:
    role = await get_user_role(db=db, user=user)

    accepted_status = await db.scalar(
        select(SystemStatus).where(
            SystemStatus.category == "application",
            SystemStatus.name == "accepted",
        )
    )

    if not accepted_status:
        raise ValueError("Статус application:accepted не найден")

    if role == "student":
        profile = await get_student_profile_for_user(db=db, user=user)
        where_clause = Chat.student_profile_id == profile.id

    elif role == "employer":
        profile = await get_employer_profile_for_user(db=db, user=user)
        where_clause = Chat.employer_profile_id == profile.id

    else:
        raise ValueError("Чаты доступны только студентам и работодателям")

    total = await db.scalar(
        select(func.count(Chat.id))
        .join(Application, Application.id == Chat.application_id)
        .where(
            where_clause,
            Application.status_id == accepted_status.id,
        )
    )

    result = await db.execute(
        select(Chat)
        .join(Application, Application.id == Chat.application_id)
        .where(
            where_clause,
            Application.status_id == accepted_status.id,
        )
        .order_by(Chat.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )

    return list(result.scalars().all()), total or 0


async def get_chat_for_user(
    db: AsyncSession,
    user: User,
    chat_id: int,
) -> Chat:
    role = await get_user_role(db=db, user=user)

    chat = await db.get(Chat, chat_id)

    if not chat:
        raise ValueError("Чат не найден")

    application = await db.get(Application, chat.application_id)

    if not application:
        raise ValueError("Отклик для чата не найден")

    await ensure_application_accepted(db=db, application=application)

    if role == "student":
        profile = await get_student_profile_for_user(db=db, user=user)

        if chat.student_profile_id != profile.id:
            raise ValueError("Нет доступа к чату")

    elif role == "employer":
        profile = await get_employer_profile_for_user(db=db, user=user)

        if chat.employer_profile_id != profile.id:
            raise ValueError("Нет доступа к чату")

    else:
        raise ValueError("Нет доступа к чату")

    return chat


async def get_chat_messages(
    db: AsyncSession,
    user: User,
    chat_id: int,
    limit: int,
    offset: int,
) -> tuple[list[ChatMessage], int]:
    await get_chat_for_user(db=db, user=user, chat_id=chat_id)

    total = await db.scalar(
        select(func.count(ChatMessage.id)).where(ChatMessage.chat_id == chat_id)
    )

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.chat_id == chat_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .offset(offset)
    )

    return list(result.scalars().all()), total or 0


async def ensure_message_rate_limit(
    db: AsyncSession,
    user: User,
    chat_id: int,
    is_file: bool,
) -> None:
    cooldown_seconds = 5 if is_file else 1

    last_message = await db.scalar(
        select(ChatMessage)
        .where(
            ChatMessage.chat_id == chat_id,
            ChatMessage.sender_user_id == user.id,
        )
        .order_by(ChatMessage.created_at.desc())
        .limit(1)
    )

    if not last_message or not last_message.created_at:
        return

    now = datetime.now(last_message.created_at.tzinfo or timezone.utc)
    diff = now - last_message.created_at

    if diff < timedelta(seconds=cooldown_seconds):
        if is_file:
            raise ValueError("Файлы можно отправлять не чаще одного раза в 5 секунд")

        raise ValueError("Сообщения можно отправлять не чаще одного раза в секунду")


async def create_chat_message(
    db: AsyncSession,
    user: User,
    chat_id: int,
    text: str | None = None,
    file_url: str | None = None,
    file_name: str | None = None,
    file_type: str | None = None,
) -> ChatMessage:
    chat = await get_chat_for_user(db=db, user=user, chat_id=chat_id)

    await ensure_chat_open(chat)

    if not text and not file_url:
        raise ValueError("Сообщение не может быть пустым")

    await ensure_message_rate_limit(
        db=db,
        user=user,
        chat_id=chat.id,
        is_file=bool(file_url),
    )

    message = ChatMessage(
        chat_id=chat.id,
        sender_user_id=user.id,
        text=text,
        file_url=file_url,
        file_name=file_name,
        file_type=file_type,
    )

    chat.updated_at = func.now()

    db.add(message)
    await db.commit()
    await db.refresh(message)

    return message


async def close_chat(
    db: AsyncSession,
    user: User,
    chat_id: int,
    reason: str | None = None,
) -> Chat:
    chat = await get_chat_for_user(db=db, user=user, chat_id=chat_id)

    if chat.is_closed:
        raise ValueError("Чат уже закрыт")

    chat.is_closed = True
    chat.closed_by_user_id = user.id
    chat.closed_at = func.now()
    chat.close_reason = reason
    chat.updated_at = func.now()

    await db.commit()
    await db.refresh(chat)

    return chat


async def reopen_chat(
    db: AsyncSession,
    user: User,
    chat_id: int,
) -> Chat:
    chat = await get_chat_for_user(db=db, user=user, chat_id=chat_id)

    if not chat.is_closed:
        raise ValueError("Чат уже открыт")

    chat.is_closed = False
    chat.closed_by_user_id = None
    chat.closed_at = None
    chat.close_reason = None
    chat.updated_at = func.now()

    await db.commit()
    await db.refresh(chat)

    return chat


async def save_chat_file(file: UploadFile) -> tuple[str, str, str]:
    original_name = file.filename or "file"
    extension = os.path.splitext(original_name)[1].lower()

    safe_name = f"{uuid.uuid4().hex}{extension}"
    file_path = CHAT_FILES_DIR / safe_name

    content = await file.read()

    max_size = 10 * 1024 * 1024
    if len(content) > max_size:
        raise ValueError("Файл слишком большой. Максимум 10 МБ")

    file_path.write_bytes(content)

    return (
        f"/static/chat_files/{safe_name}",
        original_name,
        file.content_type or "application/octet-stream",
    )