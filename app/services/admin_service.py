from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Application,
    Chat,
    EmployerProfile,
    Resume,
    Role,
    StudentProfile,
    SystemStatus,
    User,
    Vacancy,
)


async def get_role_name(db: AsyncSession, role_id: int) -> str:
    role = await db.get(Role, role_id)
    return role.name if role else "unknown"


async def get_status_name(db: AsyncSession, status_id: int | None) -> str:
    if not status_id:
        return "unknown"

    status = await db.get(SystemStatus, status_id)
    return status.name if status else "unknown"


async def get_status_by_name(db: AsyncSession, category: str, name: str) -> SystemStatus:
    status = await db.scalar(
        select(SystemStatus).where(
            SystemStatus.category == category,
            SystemStatus.name == name,
        )
    )

    if not status:
        raise ValueError(f"Статус {category}:{name} не найден")

    return status


async def ensure_admin(db: AsyncSession, user: User) -> None:
    role_name = await get_role_name(db=db, role_id=user.role_id)

    if role_name != "admin":
        raise ValueError("Доступ только для администратора")


async def get_admin_stats(db: AsyncSession) -> dict:
    employer_role = await db.scalar(select(Role).where(Role.name == "employer"))
    student_role = await db.scalar(select(Role).where(Role.name == "student"))

    employer_pending = await get_status_by_name(db, "employer", "pending")
    student_pending = await get_status_by_name(db, "student", "pending")

    users_total = await db.scalar(select(func.count(User.id)))

    students_total = 0
    employers_total = 0

    if student_role:
        students_total = await db.scalar(
            select(func.count(User.id)).where(User.role_id == student_role.id)
        )

    if employer_role:
        employers_total = await db.scalar(
            select(func.count(User.id)).where(User.role_id == employer_role.id)
        )

    employer_profiles_total = await db.scalar(select(func.count(EmployerProfile.id)))
    employer_profiles_pending = await db.scalar(
        select(func.count(EmployerProfile.id)).where(
            EmployerProfile.status_id == employer_pending.id
        )
    )

    student_profiles_pending = await db.scalar(
        select(func.count(StudentProfile.id)).where(
            StudentProfile.status_id == student_pending.id
        )
    )

    vacancies_total = await db.scalar(select(func.count(Vacancy.id)))
    resumes_total = await db.scalar(select(func.count(Resume.id)))
    applications_total = await db.scalar(select(func.count(Application.id)))
    chats_total = await db.scalar(select(func.count(Chat.id)))

    return {
        "users_total": users_total or 0,
        "students_total": students_total or 0,
        "employers_total": employers_total or 0,
        "employer_profiles_total": employer_profiles_total or 0,
        "employer_profiles_pending": employer_profiles_pending or 0,
        "student_profiles_pending": student_profiles_pending or 0,
        "vacancies_total": vacancies_total or 0,
        "resumes_total": resumes_total or 0,
        "applications_total": applications_total or 0,
        "chats_total": chats_total or 0,
    }


async def get_admin_employers(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[EmployerProfile], int]:
    total = await db.scalar(select(func.count(EmployerProfile.id)))

    result = await db.execute(
        select(EmployerProfile)
        .order_by(EmployerProfile.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    return list(result.scalars().all()), total or 0


async def get_admin_employer_by_id(db: AsyncSession, profile_id: int) -> EmployerProfile:
    profile = await db.get(EmployerProfile, profile_id)

    if not profile:
        raise ValueError("Профиль работодателя не найден")

    return profile


async def approve_employer(db: AsyncSession, profile_id: int) -> EmployerProfile:
    profile = await get_admin_employer_by_id(db=db, profile_id=profile_id)
    status = await get_status_by_name(db, "employer", "approved")

    profile.status_id = status.id
    profile.rejection_reason = None

    await db.commit()
    await db.refresh(profile)

    return profile


async def unapprove_employer(db: AsyncSession, profile_id: int) -> EmployerProfile:
    profile = await get_admin_employer_by_id(db=db, profile_id=profile_id)
    status = await get_status_by_name(db, "employer", "pending")

    profile.status_id = status.id

    await db.commit()
    await db.refresh(profile)

    return profile


async def reject_employer(
    db: AsyncSession,
    profile_id: int,
    reason: str,
) -> EmployerProfile:
    profile = await get_admin_employer_by_id(db=db, profile_id=profile_id)
    status = await get_status_by_name(db, "employer", "rejected")

    profile.status_id = status.id
    profile.rejection_reason = reason

    await db.commit()
    await db.refresh(profile)

    return profile


async def get_admin_students(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[StudentProfile], int]:
    total = await db.scalar(select(func.count(StudentProfile.id)))

    result = await db.execute(
        select(StudentProfile)
        .order_by(StudentProfile.id.desc())
        .limit(limit)
        .offset(offset)
    )

    return list(result.scalars().all()), total or 0


async def get_admin_student_by_id(db: AsyncSession, profile_id: int) -> StudentProfile:
    profile = await db.get(StudentProfile, profile_id)

    if not profile:
        raise ValueError("Профиль студента не найден")

    return profile


async def approve_student(db: AsyncSession, profile_id: int) -> StudentProfile:
    profile = await get_admin_student_by_id(db=db, profile_id=profile_id)
    status = await get_status_by_name(db, "student", "approved")

    profile.status_id = status.id
    profile.rejection_reason = None

    await db.commit()
    await db.refresh(profile)

    return profile


async def unapprove_student(db: AsyncSession, profile_id: int) -> StudentProfile:
    profile = await get_admin_student_by_id(db=db, profile_id=profile_id)
    status = await get_status_by_name(db, "student", "pending")

    profile.status_id = status.id

    await db.commit()
    await db.refresh(profile)

    return profile


async def reject_student(
    db: AsyncSession,
    profile_id: int,
    reason: str,
) -> StudentProfile:
    profile = await get_admin_student_by_id(db=db, profile_id=profile_id)
    status = await get_status_by_name(db, "student", "rejected")

    profile.status_id = status.id
    profile.rejection_reason = reason

    await db.commit()
    await db.refresh(profile)

    return profile


async def update_user_status(
    db: AsyncSession,
    user_id: int,
    status_name: str,
) -> User:
    user = await db.get(User, user_id)

    if not user:
        raise ValueError("Пользователь не найден")

    role_name = await get_role_name(db=db, role_id=user.role_id)

    if role_name == "admin":
        raise ValueError("Администратора нельзя заблокировать")

    status = await get_status_by_name(db, "user", status_name)
    user.status_id = status.id

    await db.commit()
    await db.refresh(user)

    return user


async def get_admin_vacancies(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[Vacancy], int]:
    total = await db.scalar(select(func.count(Vacancy.id)))

    result = await db.execute(
        select(Vacancy)
        .order_by(Vacancy.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    return list(result.scalars().all()), total or 0


async def get_admin_vacancy_by_id(db: AsyncSession, vacancy_id: int) -> Vacancy:
    vacancy = await db.get(Vacancy, vacancy_id)

    if not vacancy:
        raise ValueError("Вакансия не найдена")

    return vacancy


async def reject_vacancy(
    db: AsyncSession,
    vacancy_id: int,
    reason: str,
) -> Vacancy:
    vacancy = await get_admin_vacancy_by_id(db=db, vacancy_id=vacancy_id)
    status = await get_status_by_name(db, "vacancy", "archived")

    vacancy.status_id = status.id
    vacancy.rejection_reason = reason

    await db.commit()
    await db.refresh(vacancy)

    return vacancy


async def delete_vacancy_by_admin(db: AsyncSession, vacancy_id: int) -> Vacancy:
    vacancy = await get_admin_vacancy_by_id(db=db, vacancy_id=vacancy_id)
    status = await get_status_by_name(db, "vacancy", "deleted")

    vacancy.status_id = status.id

    await db.commit()
    await db.refresh(vacancy)

    return vacancy


async def get_admin_resumes(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[Resume], int]:
    total = await db.scalar(select(func.count(Resume.id)))

    result = await db.execute(
        select(Resume)
        .order_by(Resume.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    return list(result.scalars().all()), total or 0


async def get_admin_resume_by_id(db: AsyncSession, resume_id: int) -> Resume:
    resume = await db.get(Resume, resume_id)

    if not resume:
        raise ValueError("Резюме не найдено")

    return resume


async def reject_resume(
    db: AsyncSession,
    resume_id: int,
    reason: str,
) -> Resume:
    resume = await get_admin_resume_by_id(db=db, resume_id=resume_id)
    status = await get_status_by_name(db, "resume", "archived")

    resume.status_id = status.id
    resume.rejection_reason = reason

    await db.commit()
    await db.refresh(resume)

    return resume


async def delete_resume_by_admin(db: AsyncSession, resume_id: int) -> Resume:
    resume = await get_admin_resume_by_id(db=db, resume_id=resume_id)
    status = await get_status_by_name(db, "resume", "deleted")

    resume.status_id = status.id

    await db.commit()
    await db.refresh(resume)

    return resume


async def get_admin_applications(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[Application], int]:
    total = await db.scalar(select(func.count(Application.id)))

    result = await db.execute(
        select(Application)
        .order_by(Application.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    return list(result.scalars().all()), total or 0


async def get_admin_application_by_id(
    db: AsyncSession,
    application_id: int,
) -> Application:
    application = await db.get(Application, application_id)

    if not application:
        raise ValueError("Отклик не найден")

    return application