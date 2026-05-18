from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import EmployerProfile, Role, SystemStatus, User, Vacancy
from app.schemas.vacancy import VacancyCreateRequest, VacancyUpdateRequest


async def get_status_name(db: AsyncSession, status_id: int) -> str:
    status = await db.scalar(
        select(SystemStatus).where(SystemStatus.id == status_id)
    )
    return status.name if status else "unknown"


async def get_status_by_name(
    db: AsyncSession,
    category: str,
    name: str,
) -> SystemStatus:
    status = await db.scalar(
        select(SystemStatus).where(
            SystemStatus.category == category,
            SystemStatus.name == name,
        )
    )

    if not status:
        raise ValueError(f"Статус {category}:{name} не найден")

    return status


async def ensure_employer(db: AsyncSession, user: User) -> None:
    role = await db.scalar(select(Role).where(Role.id == user.role_id))

    if not role or role.name != "employer":
        raise ValueError("Доступно только работодателю")


async def get_my_employer_profile(
    db: AsyncSession,
    user: User,
) -> EmployerProfile:
    await ensure_employer(db=db, user=user)

    profile = await db.scalar(
        select(EmployerProfile).where(EmployerProfile.user_id == user.id)
    )

    if not profile:
        raise ValueError("Сначала заполните профиль компании")

    return profile


async def create_employer_vacancy(
    db: AsyncSession,
    user: User,
    payload: VacancyCreateRequest,
) -> Vacancy:
    profile = await get_my_employer_profile(db=db, user=user)

    published_status = await get_status_by_name(
        db=db,
        category="vacancy",
        name="published",
    )

    vacancy = Vacancy(
        employer_profile_id=profile.id,
        title=payload.title,
        description=payload.description,
        requirements=payload.requirements,
        salary_from=payload.salary_from,
        salary_to=payload.salary_to,
        city=payload.city,
        direction=payload.direction,
        skills=payload.skills,
        work_format=payload.work_format,
        employment_type=payload.employment_type,
        rejection_reason=None,
        status_id=published_status.id,
    )

    db.add(vacancy)
    await db.commit()
    await db.refresh(vacancy)

    return vacancy


async def get_my_vacancies(
    db: AsyncSession,
    user: User,
) -> list[Vacancy]:
    profile = await get_my_employer_profile(db=db, user=user)
    deleted_status = await get_status_by_name(db, "vacancy", "deleted")

    result = await db.execute(
        select(Vacancy)
        .where(
            Vacancy.employer_profile_id == profile.id,
            Vacancy.status_id != deleted_status.id,
        )
        .order_by(Vacancy.created_at.desc())
    )

    return list(result.scalars().all())


async def get_my_vacancy_by_id(
    db: AsyncSession,
    user: User,
    vacancy_id: int,
) -> Vacancy:
    profile = await get_my_employer_profile(db=db, user=user)

    vacancy = await db.scalar(
        select(Vacancy).where(
            Vacancy.id == vacancy_id,
            Vacancy.employer_profile_id == profile.id,
        )
    )

    if not vacancy:
        raise ValueError("Вакансия не найдена")

    return vacancy


async def update_employer_vacancy(
    db: AsyncSession,
    user: User,
    vacancy_id: int,
    payload: VacancyUpdateRequest,
) -> Vacancy:
    vacancy = await get_my_vacancy_by_id(
        db=db,
        user=user,
        vacancy_id=vacancy_id,
    )

    deleted_status = await get_status_by_name(db, "vacancy", "deleted")

    if vacancy.status_id == deleted_status.id:
        raise ValueError("Удаленную вакансию нельзя редактировать")

    vacancy.title = payload.title
    vacancy.description = payload.description
    vacancy.requirements = payload.requirements
    vacancy.salary_from = payload.salary_from
    vacancy.salary_to = payload.salary_to
    vacancy.city = payload.city
    vacancy.direction = payload.direction
    vacancy.skills = payload.skills
    vacancy.work_format = payload.work_format
    vacancy.employment_type = payload.employment_type

    # Если админ отклонял вакансию, после исправления убираем старую причину.
    vacancy.rejection_reason = None

    # После исправления снова делаем вакансию опубликованной.
    published_status = await get_status_by_name(db, "vacancy", "published")
    vacancy.status_id = published_status.id

    await db.commit()
    await db.refresh(vacancy)

    return vacancy


async def archive_employer_vacancy(
    db: AsyncSession,
    user: User,
    vacancy_id: int,
) -> Vacancy:
    vacancy = await get_my_vacancy_by_id(db=db, user=user, vacancy_id=vacancy_id)

    deleted_status = await get_status_by_name(db, "vacancy", "deleted")
    if vacancy.status_id == deleted_status.id:
        raise ValueError("Удаленную вакансию нельзя архивировать")

    archived_status = await get_status_by_name(db, "vacancy", "archived")
    vacancy.status_id = archived_status.id

    await db.commit()
    await db.refresh(vacancy)

    return vacancy


async def restore_employer_vacancy(
    db: AsyncSession,
    user: User,
    vacancy_id: int,
) -> Vacancy:
    vacancy = await get_my_vacancy_by_id(db=db, user=user, vacancy_id=vacancy_id)

    deleted_status = await get_status_by_name(db, "vacancy", "deleted")
    if vacancy.status_id == deleted_status.id:
        raise ValueError("Удаленную вакансию нельзя восстановить")

    published_status = await get_status_by_name(db, "vacancy", "published")
    vacancy.status_id = published_status.id
    vacancy.rejection_reason = None

    await db.commit()
    await db.refresh(vacancy)

    return vacancy


async def delete_employer_vacancy(
    db: AsyncSession,
    user: User,
    vacancy_id: int,
) -> Vacancy:
    vacancy = await get_my_vacancy_by_id(db=db, user=user, vacancy_id=vacancy_id)
    deleted_status = await get_status_by_name(db, "vacancy", "deleted")

    vacancy.status_id = deleted_status.id

    await db.commit()
    await db.refresh(vacancy)

    return vacancy