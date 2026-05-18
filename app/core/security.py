from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings
from jose import JWTError


pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "refresh",
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        return payload
    except JWTError:
        raise ValueError("Неверный или истекший токен")
    
import re


PASSWORD_RULE_MESSAGE = (
    "Пароль должен содержать минимум 8 символов, "
    "одну заглавную английскую букву, одну цифру и один спецсимвол. "
    "Русские буквы использовать нельзя."
)


def validate_strong_password(password: str) -> None:
    if not password:
        raise ValueError(PASSWORD_RULE_MESSAGE)

    if len(password) < 8:
        raise ValueError(PASSWORD_RULE_MESSAGE)

    if not re.fullmatch(r"[A-Za-z0-9!@#$%^&*()_\-+=\[\]{};:,.?/\\|`~]+", password):
        raise ValueError(PASSWORD_RULE_MESSAGE)

    if not re.search(r"[A-Z]", password):
        raise ValueError(PASSWORD_RULE_MESSAGE)

    if not re.search(r"\d", password):
        raise ValueError(PASSWORD_RULE_MESSAGE)

    if not re.search(r"[!@#$%^&*()_\-+=\[\]{};:,.?/\\|`~]", password):
        raise ValueError(PASSWORD_RULE_MESSAGE)