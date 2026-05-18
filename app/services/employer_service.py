from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import EmployerProfile, Role, SystemStatus, User
from app.schemas.employer import EmployerProfileUpsertRequest


async def get_employer_profile(
    db: AsyncSession,
    user: User,
) -> EmployerProfile | None:
    return await db.scalar(
        select(EmployerProfile).where(EmployerProfile.user_id == user.id)
    )


async def upsert_employer_profile(
    db: AsyncSession,
    user: User,
    payload: EmployerProfileUpsertRequest,
) -> EmployerProfile:
    role = await db.scalar(select(Role).where(Role.id == user.role_id))

    if not role or role.name != "employer":
        raise ValueError("Доступно только работодателю")

    pending_status = await db.scalar(
        select(SystemStatus).where(
            SystemStatus.category == "employer",
            SystemStatus.name == "pending",
        )
    )

    if not pending_status:
        raise ValueError("Статус employer:pending не найден")

    profile = await get_employer_profile(db=db, user=user)

    existing_inn_profile = await db.scalar(
        select(EmployerProfile).where(EmployerProfile.inn == payload.inn)
    )

    if existing_inn_profile and existing_inn_profile.user_id != user.id:
        raise ValueError("Компания с таким ИНН уже существует")

    if not profile:
        profile = EmployerProfile(
            user_id=user.id,
            status_id=pending_status.id,
            company_name=payload.company_name,
            inn=payload.inn,
            phone=payload.phone,
            avatar_url=payload.avatar_url,
            description=payload.description,
            rejection_reason=None,
        )
        db.add(profile)
    else:
        profile.company_name = payload.company_name
        profile.inn = payload.inn
        profile.phone = payload.phone
        profile.avatar_url = payload.avatar_url
        profile.description = payload.description

        # При редактировании снова отправляем на проверку и очищаем старую причину отказа
        profile.status_id = pending_status.id
        profile.rejection_reason = None

    await db.commit()
    await db.refresh(profile)

    return profile


async def get_employer_status_name(
    db: AsyncSession,
    status_id: int,
) -> str:
    status = await db.scalar(
        select(SystemStatus).where(SystemStatus.id == status_id)
    )

    return status.name if status else "unknown"