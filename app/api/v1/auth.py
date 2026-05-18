from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_current_user_role
from app.db.database import get_db
from app.models import StudentProfile, SystemStatus, User
from app.schemas.auth import (
    AdminLoginRequest,
    AuthTokenResponse,
    CurrentUserResponse,
    EmployerForgotPasswordRequest,
    EmployerLoginRequest,
    EmployerRegisterRequest,
    EmployerRegisterResponse,
    EmployerResetPasswordRequest,
    StudentLoginRequest,
    StudentLoginResponse,
    TokenResponse,
    VerifyEmailCodeRequest,
    VerifyEmailCodeResponse,
)
from app.services.auth_service import (
    login_admin,
    login_employer,
    login_student,
    register_employer,
    reset_employer_password,
    send_employer_password_reset_code,
    verify_employer_email_code,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


async def get_status_name(db: AsyncSession, status_id: int | None) -> str | None:
    if not status_id:
        return None

    status_obj = await db.scalar(
        select(SystemStatus).where(SystemStatus.id == status_id)
    )

    return status_obj.name if status_obj else None


@router.post(
    "/employer/register",
    response_model=EmployerRegisterResponse,
    status_code=status.HTTP_200_OK,
)
async def employer_register(
    payload: EmployerRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await register_employer(db=db, payload=payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return EmployerRegisterResponse(**result)


@router.post(
    "/employer/verify-code",
    response_model=VerifyEmailCodeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def employer_verify_code(
    payload: VerifyEmailCodeRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await verify_employer_email_code(
            db=db,
            email=str(payload.email),
            code=payload.code,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return VerifyEmailCodeResponse(
        id=user.id,
        email=user.email,
        message="Email подтвержден, работодатель зарегистрирован",
    )


@router.post(
    "/employer/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
)
async def employer_login(
    payload: EmployerLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        tokens = await login_employer(db=db, payload=payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return TokenResponse(**tokens)


@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
async def auth_me(
    current_user: User = Depends(get_current_user),
    role: str = Depends(get_current_user_role),
    db: AsyncSession = Depends(get_db),
):
    student_profile = None

    if role == "student":
        profile = await db.scalar(
            select(StudentProfile).where(StudentProfile.user_id == current_user.id)
        )

        if profile:
            student_profile = {
                "full_name": profile.full_name,
                "group_name": profile.group_name,
                "birthday": str(profile.birthday) if profile.birthday else None,
                "photo_url": profile.photo_url,
                "level": profile.level,
                "status": await get_status_name(db=db, status_id=profile.status_id),
                "rejection_reason": profile.rejection_reason,
            }

    return CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        journal_login=current_user.journal_login,
        role=role,
        student_profile=student_profile,
    )


@router.post(
    "/student/login",
    response_model=StudentLoginResponse,
)
async def student_login(
    payload: StudentLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await login_student(db=db, payload=payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return StudentLoginResponse(**result)


@router.post("/admin/login", response_model=AuthTokenResponse)
async def admin_login(
    payload: AdminLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    return await login_admin(
        db=db,
        username=payload.username,
        password=payload.password,
    )


@router.post("/employer/forgot-password")
async def employer_forgot_password(
    payload: EmployerForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await send_employer_password_reset_code(
            db=db,
            email=str(payload.email),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/employer/reset-password")
async def employer_reset_password(
    payload: EmployerResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await reset_employer_password(
            db=db,
            email=str(payload.email),
            code=payload.code,
            new_password=payload.new_password,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))