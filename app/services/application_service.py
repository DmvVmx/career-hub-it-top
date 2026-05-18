from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Application,
    EmployerProfile,
    Resume,
    Role,
    StudentProfile,
    SystemStatus,
    User,
    Vacancy,
)


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


async def get_status_name(db: AsyncSession, status_id: int) -> str:
    status = await db.get(SystemStatus, status_id)
    return status.name if status else "unknown"


async def get_user_role(db: AsyncSession, user: User) -> str:
    role = await db.get(Role, user.role_id)

    if not role:
        raise ValueError("Роль пользователя не найдена")

    return role.name


async def ensure_employer_approved(
    db: AsyncSession,
    employer_profile: EmployerProfile,
) -> None:
    status = await db.get(SystemStatus, employer_profile.status_id)

    if not status or status.category != "employer" or status.name != "approved":
        raise ValueError("Ваш профиль работодателя еще не подтвержден администратором")


async def ensure_student_approved(
    db: AsyncSession,
    student_profile: StudentProfile,
    own_profile: bool = True,
) -> None:
    status = await db.get(SystemStatus, student_profile.status_id)

    if not status or status.category != "student" or status.name != "approved":
        if own_profile:
            raise ValueError("Ваш профиль студента еще не подтвержден администратором")

        raise ValueError("Профиль студента еще не подтвержден администратором")


async def get_student_profile_for_user(
    db: AsyncSession,
    user: User,
) -> StudentProfile:
    role = await get_user_role(db=db, user=user)

    if role != "student":
        raise ValueError("Доступно только студенту")

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
    role = await get_user_role(db=db, user=user)

    if role != "employer":
        raise ValueError("Доступно только работодателю")

    profile = await db.scalar(
        select(EmployerProfile).where(EmployerProfile.user_id == user.id)
    )

    if not profile:
        raise ValueError("Профиль работодателя не найден")

    return profile


async def create_student_application(
    db: AsyncSession,
    user: User,
    vacancy_id: int,
    resume_id: int | None,
    message: str | None,
) -> Application:
    student_profile = await get_student_profile_for_user(db=db, user=user)

    await ensure_student_approved(db=db, student_profile=student_profile)

    vacancy = await db.get(Vacancy, vacancy_id)

    if not vacancy:
        raise ValueError("Вакансия не найдена")

    published_vacancy_status = await get_status_by_name(db, "vacancy", "published")

    if vacancy.status_id != published_vacancy_status.id:
        raise ValueError("На эту вакансию нельзя откликнуться")

    employer_profile = await db.get(EmployerProfile, vacancy.employer_profile_id)

    if not employer_profile:
        raise ValueError("Работодатель не найден")

    await ensure_employer_approved(db=db, employer_profile=employer_profile)

    existing_application = await db.scalar(
        select(Application).where(
            Application.student_profile_id == student_profile.id,
            Application.vacancy_id == vacancy.id,
        )
    )

    if existing_application:
        existing_status_name = await get_status_name(
            db=db,
            status_id=existing_application.status_id,
        )

        if existing_status_name == "rejected":
            raise ValueError("Работодатель уже отклонил отклик на эту вакансию")

        if existing_status_name == "student_rejected":
            raise ValueError("Вы уже отклоняли приглашение на эту вакансию")

        if existing_status_name == "accepted":
            raise ValueError("По этой вакансии уже открыт чат")

        raise ValueError("Вы уже откликались на эту вакансию")

    resume = None

    if resume_id is not None:
        resume = await db.scalar(
            select(Resume).where(
                Resume.id == resume_id,
                Resume.student_profile_id == student_profile.id,
            )
        )

        if not resume:
            raise ValueError("Резюме не найдено")

        published_resume_status = await get_status_by_name(db, "resume", "published")

        if resume.status_id != published_resume_status.id:
            raise ValueError("Можно прикрепить только опубликованное резюме")

    sent_status = await get_status_by_name(db, "application", "sent")

    application = Application(
        student_profile_id=student_profile.id,
        employer_profile_id=vacancy.employer_profile_id,
        vacancy_id=vacancy.id,
        resume_id=resume.id if resume else None,
        message=message,
        status_id=sent_status.id,
    )

    db.add(application)
    await db.commit()
    await db.refresh(application)

    return application


async def get_student_applications(
    db: AsyncSession,
    user: User,
    limit: int,
    offset: int,
) -> tuple[list[Application], int]:
    student_profile = await get_student_profile_for_user(db=db, user=user)

    total = await db.scalar(
        select(func.count(Application.id)).where(
            Application.student_profile_id == student_profile.id
        )
    )

    result = await db.execute(
        select(Application)
        .where(Application.student_profile_id == student_profile.id)
        .order_by(Application.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    return list(result.scalars().all()), total or 0


async def get_employer_applications(
    db: AsyncSession,
    user: User,
    limit: int,
    offset: int,
) -> tuple[list[Application], int]:
    employer_profile = await get_employer_profile_for_user(db=db, user=user)

    total = await db.scalar(
        select(func.count(Application.id)).where(
            Application.employer_profile_id == employer_profile.id
        )
    )

    result = await db.execute(
        select(Application)
        .where(Application.employer_profile_id == employer_profile.id)
        .order_by(Application.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    return list(result.scalars().all()), total or 0


async def update_employer_application_status(
    db: AsyncSession,
    user: User,
    application_id: int,
    new_status_name: str,
) -> Application:
    employer_profile = await get_employer_profile_for_user(db=db, user=user)

    application = await db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.employer_profile_id == employer_profile.id,
        )
    )

    if not application:
        raise ValueError("Отклик не найден")

    current_status_name = await get_status_name(db=db, status_id=application.status_id)

    allowed_transitions = {
        "sent": {"viewed", "invited", "rejected"},
        "viewed": {"invited", "rejected"},
        "invited": {"rejected"},
        "rejected": {"invited"},
        "student_rejected": {"invited"},
        "accepted": {"rejected"},
    }

    allowed_next_statuses = allowed_transitions.get(current_status_name, set())

    if new_status_name not in allowed_next_statuses:
        raise ValueError(
            f"Нельзя изменить статус отклика с {current_status_name} на {new_status_name}"
        )

    new_status = await get_status_by_name(db, "application", new_status_name)
    application.status_id = new_status.id

    await db.commit()
    await db.refresh(application)

    return application


async def update_student_application_status(
    db: AsyncSession,
    user: User,
    application_id: int,
    new_status_name: str,
) -> Application:
    student_profile = await get_student_profile_for_user(db=db, user=user)

    application = await db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.student_profile_id == student_profile.id,
        )
    )

    if not application:
        raise ValueError("Отклик или приглашение не найдено")

    current_status_name = await get_status_name(db=db, status_id=application.status_id)

    if current_status_name != "invited":
        raise ValueError("Ответить можно только на приглашение работодателя")

    if new_status_name not in {"accepted", "student_rejected"}:
        raise ValueError("Недопустимый статус ответа на приглашение")

    new_status = await get_status_by_name(db, "application", new_status_name)
    application.status_id = new_status.id

    await db.commit()
    await db.refresh(application)

    return application


async def invite_student_by_resume(
    db: AsyncSession,
    user: User,
    resume_id: int,
    vacancy_id: int,
    message: str | None,
) -> Application:
    employer_profile = await get_employer_profile_for_user(db=db, user=user)

    await ensure_employer_approved(db=db, employer_profile=employer_profile)

    resume = await db.get(Resume, resume_id)
    if not resume:
        raise ValueError("Резюме не найдено")

    published_resume_status = await get_status_by_name(db, "resume", "published")
    if resume.status_id != published_resume_status.id or not resume.is_public:
        raise ValueError("Можно приглашать только по публичному опубликованному резюме")

    student_profile = await db.get(StudentProfile, resume.student_profile_id)
    if not student_profile:
        raise ValueError("Профиль студента не найден")

    await ensure_student_approved(
        db=db,
        student_profile=student_profile,
        own_profile=False,
    )

    vacancy = await db.scalar(
        select(Vacancy).where(
            Vacancy.id == vacancy_id,
            Vacancy.employer_profile_id == employer_profile.id,
        )
    )

    if not vacancy:
        raise ValueError("Вакансия не найдена")

    published_vacancy_status = await get_status_by_name(db, "vacancy", "published")
    if vacancy.status_id != published_vacancy_status.id:
        raise ValueError("Приглашать можно только на опубликованную вакансию")

    existing_application = await db.scalar(
        select(Application).where(
            Application.student_profile_id == student_profile.id,
            Application.vacancy_id == vacancy.id,
        )
    )

    invited_status = await get_status_by_name(db, "application", "invited")

    if existing_application:
        existing_status = await get_status_name(
            db=db,
            status_id=existing_application.status_id,
        )

        if existing_status == "accepted":
            raise ValueError("Студент уже принял приглашение по этой вакансии")

        if existing_status == "invited":
            raise ValueError("Студент уже приглашен по этой вакансии")

        if existing_status in {"rejected", "student_rejected", "sent", "viewed"}:
            existing_application.status_id = invited_status.id

            if message:
                existing_application.message = message

            if not existing_application.resume_id:
                existing_application.resume_id = resume.id

            await db.commit()
            await db.refresh(existing_application)

            return existing_application

        raise ValueError("По этой вакансии уже есть отклик или приглашение")

    application = Application(
        student_profile_id=student_profile.id,
        employer_profile_id=employer_profile.id,
        vacancy_id=vacancy.id,
        resume_id=resume.id,
        message=message,
        status_id=invited_status.id,
    )

    db.add(application)
    await db.commit()
    await db.refresh(application)

    return application