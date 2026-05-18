import json
import random
from datetime import datetime, timezone, date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import HTTPException, status

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    validate_strong_password,
)
from app.db.redis import redis_client
from app.models import AuthSource, Role, SystemStatus, User, StudentProfile
from app.schemas.auth import EmployerLoginRequest, EmployerRegisterRequest, StudentLoginRequest
from app.services.email_service import send_email_verification_code
from app.integrations.journal.client import JournalAuthError, JournalClient


# =========================
# REGISTER EMPLOYER
# =========================

async def register_employer(db: AsyncSession, payload: EmployerRegisterRequest) -> dict:
    existing_user = await db.scalar(select(User).where(User.email == payload.email))

    if existing_user:
        raise ValueError("Пользователь с таким email уже существует")

    validate_strong_password(payload.password)

    code = str(random.randint(100000, 999999))

    redis_key = f"pending_employer:{payload.email}"

    pending_data = {
        "email": str(payload.email),
        "password_hash": hash_password(payload.password),
        "code": code,
    }

    await redis_client.set(redis_key, json.dumps(pending_data), ex=600)

    send_email_verification_code(
        to_email=str(payload.email),
        code=code,
    )

    return {"message": "Код подтверждения отправлен на email"}


# =========================
# VERIFY EMAIL
# =========================

async def verify_employer_email_code(db: AsyncSession, email: str, code: str) -> User:
    existing_user = await db.scalar(select(User).where(User.email == email))
    if existing_user:
        raise ValueError("Пользователь с таким email уже существует")

    redis_key = f"pending_employer:{email}"
    raw_data = await redis_client.get(redis_key)

    if not raw_data:
        raise ValueError("Код истек или регистрация не была начата")

    pending_data = json.loads(raw_data)

    if not pending_data.get("password_hash"):
        raise ValueError("Пароль не найден. Повторите регистрацию.")

    if pending_data["code"] != code:
        raise ValueError("Неверный код подтверждения")

    employer_role = await db.scalar(select(Role).where(Role.name == "employer"))
    internal_auth_source = await db.scalar(select(AuthSource).where(AuthSource.name == "internal"))
    active_status = await db.scalar(
        select(SystemStatus).where(
            SystemStatus.category == "user",
            SystemStatus.name == "active",
        )
    )

    user = User(
        email=email,
        password_hash=pending_data["password_hash"],
        role_id=employer_role.id,
        auth_source_id=internal_auth_source.id,
        status_id=active_status.id,
        is_email_verified=True,
        email_verified_at=datetime.now(timezone.utc),
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    await redis_client.delete(redis_key)

    return user


# =========================
# CHECK BAN
# =========================

async def ensure_user_not_banned(db: AsyncSession, user: User):
    status_obj = await db.get(SystemStatus, user.status_id)

    if status_obj and status_obj.category == "user" and status_obj.name == "banned":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ваш аккаунт заблокирован администратором.",
        )


# =========================
# LOGIN EMPLOYER
# =========================

async def login_employer(db: AsyncSession, payload: EmployerLoginRequest) -> dict:
    user = await db.scalar(select(User).where(User.email == payload.email))

    if not user:
        raise ValueError("Неверный email или пароль")

    if not user.password_hash:
        raise ValueError("Для этого аккаунта вход по паролю недоступен")

    if not verify_password(payload.password, user.password_hash):
        raise ValueError("Неверный email или пароль")

    # 🔥 ВАЖНО
    await ensure_user_not_banned(db, user)

    role = await db.scalar(select(Role).where(Role.id == user.role_id))

    access_token = create_access_token(user_id=user.id, role=role.name)
    refresh_token = create_refresh_token(user_id=user.id, role=role.name)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


# =========================
# LOGIN STUDENT
# =========================

def parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


async def login_student(db: AsyncSession, payload: StudentLoginRequest) -> dict:
    journal_client = JournalClient()

    try:
        student_data = await journal_client.login_and_get_user_info(
            username=payload.login,
            password=payload.password,
        )
    except JournalAuthError as e:
        raise ValueError(str(e))

    student_role = await db.scalar(select(Role).where(Role.name == "student"))
    journal_auth_source = await db.scalar(select(AuthSource).where(AuthSource.name == "journal"))
    active_status = await db.scalar(
        select(SystemStatus).where(
            SystemStatus.category == "user",
            SystemStatus.name == "active",
        )
    )

    journal_student_id = student_data["student_id"]

    profile = await db.scalar(
        select(StudentProfile).where(
            StudentProfile.journal_student_id == journal_student_id
        )
    )

    if profile:
        user = await db.scalar(select(User).where(User.id == profile.user_id))
    else:
        user = User(
            journal_login=payload.login,
            role_id=student_role.id,
            auth_source_id=journal_auth_source.id,
            status_id=active_status.id,
        )
        db.add(user)
        await db.flush()

        profile = StudentProfile(
            user_id=user.id,
            journal_student_id=journal_student_id,
            full_name=student_data["full_name"],
        )
        db.add(profile)

    # 🔥 ПРОВЕРКА БАНА
    await ensure_user_not_banned(db, user)

    profile.full_name = student_data.get("full_name")
    profile.group_name = student_data.get("group_name")
    profile.photo_url = student_data.get("photo")
    profile.birthday = parse_date(student_data.get("birthday"))
    profile.level = student_data.get("level")

    await db.commit()
    await db.refresh(user)
    await db.refresh(profile)

    access_token = create_access_token(user_id=user.id, role="student")
    refresh_token = create_refresh_token(user_id=user.id, role="student")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "full_name": profile.full_name,
        "group_name": profile.group_name,
    }


# =========================
# LOGIN ADMIN
# =========================

async def login_admin(db: AsyncSession, username: str, password: str):
    user = await db.scalar(select(User).where(User.username == username))

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )

    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )

    role = await db.get(Role, user.role_id)

    if not role or role.name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ только для администратора",
        )

    await ensure_user_not_banned(db, user)

    access_token = create_access_token(user_id=user.id, role="admin")
    refresh_token = create_refresh_token(user_id=user.id, role="admin")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


async def send_employer_password_reset_code(
    db: AsyncSession,
    email: str,
) -> dict:
    user = await db.scalar(select(User).where(User.email == email))

    if not user:
        raise ValueError("Пользователь с таким email не найден")

    role = await db.get(Role, user.role_id)

    if not role or role.name != "employer":
        raise ValueError("Восстановление доступно только работодателям")

    code = str(random.randint(100000, 999999))
    redis_key = f"reset_employer_password:{email}"

    await redis_client.set(
        redis_key,
        json.dumps({
            "email": email,
            "code": code,
        }),
        ex=600,
    )

    send_email_verification_code(
        to_email=email,
        code=code,
    )

    return {
        "message": "Код восстановления отправлен на email",
    }


async def reset_employer_password(
    db: AsyncSession,
    email: str,
    code: str,
    new_password: str,
) -> dict:
    validate_strong_password(new_password)

    redis_key = f"reset_employer_password:{email}"
    raw_data = await redis_client.get(redis_key)

    if not raw_data:
        raise ValueError("Код истек или восстановление не было начато")

    data = json.loads(raw_data)

    if data.get("code") != code:
        raise ValueError("Неверный код восстановления")

    user = await db.scalar(select(User).where(User.email == email))

    if not user:
        raise ValueError("Пользователь не найден")

    role = await db.get(Role, user.role_id)

    if not role or role.name != "employer":
        raise ValueError("Сменить пароль можно только работодателю")

    user.password_hash = hash_password(new_password)

    await db.commit()
    await redis_client.delete(redis_key)

    return {
        "message": "Пароль успешно изменен",
    }