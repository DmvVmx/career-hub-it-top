from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Resume, Role, StudentProfile, SystemStatus, User
from app.schemas.resume import ResumeUpsertRequest


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
    status = await db.scalar(select(SystemStatus).where(SystemStatus.id == status_id))
    return status.name if status else "unknown"


async def ensure_student(db: AsyncSession, user: User) -> None:
    role = await db.scalar(select(Role).where(Role.id == user.role_id))

    if not role or role.name != "student":
        raise ValueError("Доступно только студенту")


async def get_my_student_profile(
    db: AsyncSession,
    user: User,
) -> StudentProfile:
    await ensure_student(db=db, user=user)

    profile = await db.scalar(
        select(StudentProfile).where(StudentProfile.user_id == user.id)
    )

    if not profile:
        raise ValueError("Профиль студента не найден")

    return profile


async def create_my_resume(
    db: AsyncSession,
    user: User,
    payload: ResumeUpsertRequest,
) -> Resume:
    profile = await get_my_student_profile(db=db, user=user)
    published_status = await get_status_by_name(db, "resume", "published")

    resume = Resume(
        student_profile_id=profile.id,
        title=payload.title,
        about=payload.about,
        city=payload.city,
        direction=payload.direction,
        skills=payload.skills,
        experience=payload.experience,
        education=payload.education,
        contacts=payload.contacts,
        is_public=payload.is_public,
        status_id=published_status.id,
        rejection_reason=None,
    )

    db.add(resume)
    await db.commit()
    await db.refresh(resume)

    return resume


async def get_my_resumes(
    db: AsyncSession,
    user: User,
    limit: int,
    offset: int,
) -> tuple[list[Resume], int]:
    profile = await get_my_student_profile(db=db, user=user)
    deleted_status = await get_status_by_name(db, "resume", "deleted")

    total = await db.scalar(
        select(func.count(Resume.id)).where(
            Resume.student_profile_id == profile.id,
            Resume.status_id != deleted_status.id,
        )
    )

    result = await db.execute(
        select(Resume)
        .where(
            Resume.student_profile_id == profile.id,
            Resume.status_id != deleted_status.id,
        )
        .order_by(Resume.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    return list(result.scalars().all()), total or 0


async def get_my_resume_by_id(
    db: AsyncSession,
    user: User,
    resume_id: int,
) -> Resume:
    profile = await get_my_student_profile(db=db, user=user)

    resume = await db.scalar(
        select(Resume).where(
            Resume.id == resume_id,
            Resume.student_profile_id == profile.id,
        )
    )

    if not resume:
        raise ValueError("Резюме не найдено")

    return resume


async def update_my_resume(
    db: AsyncSession,
    user: User,
    resume_id: int,
    payload: ResumeUpsertRequest,
) -> Resume:
    resume = await get_my_resume_by_id(db=db, user=user, resume_id=resume_id)
    deleted_status = await get_status_by_name(db, "resume", "deleted")

    if resume.status_id == deleted_status.id:
        raise ValueError("Удаленное резюме нельзя редактировать")

    resume.title = payload.title
    resume.about = payload.about
    resume.city = payload.city
    resume.direction = payload.direction
    resume.skills = payload.skills
    resume.experience = payload.experience
    resume.education = payload.education
    resume.contacts = payload.contacts
    resume.is_public = payload.is_public

    # Если резюме было отклонено/в архиве, после исправления публикуем заново и убираем старую причину.
    published_status = await get_status_by_name(db, "resume", "published")
    resume.status_id = published_status.id
    resume.rejection_reason = None

    await db.commit()
    await db.refresh(resume)

    return resume


async def archive_my_resume(
    db: AsyncSession,
    user: User,
    resume_id: int,
) -> Resume:
    resume = await get_my_resume_by_id(db=db, user=user, resume_id=resume_id)

    deleted_status = await get_status_by_name(db, "resume", "deleted")
    if resume.status_id == deleted_status.id:
        raise ValueError("Удаленное резюме нельзя архивировать")

    archived_status = await get_status_by_name(db, "resume", "archived")
    resume.status_id = archived_status.id

    await db.commit()
    await db.refresh(resume)

    return resume


async def restore_my_resume(
    db: AsyncSession,
    user: User,
    resume_id: int,
) -> Resume:
    resume = await get_my_resume_by_id(db=db, user=user, resume_id=resume_id)

    deleted_status = await get_status_by_name(db, "resume", "deleted")
    if resume.status_id == deleted_status.id:
        raise ValueError("Удаленное резюме нельзя восстановить")

    published_status = await get_status_by_name(db, "resume", "published")
    resume.status_id = published_status.id
    resume.rejection_reason = None

    await db.commit()
    await db.refresh(resume)

    return resume


async def delete_my_resume(
    db: AsyncSession,
    user: User,
    resume_id: int,
) -> Resume:
    resume = await get_my_resume_by_id(db=db, user=user, resume_id=resume_id)
    deleted_status = await get_status_by_name(db, "resume", "deleted")

    resume.status_id = deleted_status.id

    await db.commit()
    await db.refresh(resume)

    return resume


async def get_public_resumes(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[Resume], int]:
    published_resume_status = await get_status_by_name(db, "resume", "published")
    approved_student_status = await get_status_by_name(db, "student", "approved")

    total = await db.scalar(
        select(func.count())
        .select_from(Resume)
        .join(StudentProfile, StudentProfile.id == Resume.student_profile_id)
        .where(
            Resume.status_id == published_resume_status.id,
            Resume.is_public.is_(True),
            StudentProfile.status_id == approved_student_status.id,
        )
    )

    result = await db.execute(
        select(Resume)
        .join(StudentProfile, StudentProfile.id == Resume.student_profile_id)
        .where(
            Resume.status_id == published_resume_status.id,
            Resume.is_public.is_(True),
            StudentProfile.status_id == approved_student_status.id,
        )
        .order_by(Resume.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    return list(result.scalars().all()), total or 0


async def get_public_resume_by_id(
    db: AsyncSession,
    resume_id: int,
) -> Resume:
    published_resume_status = await get_status_by_name(db, "resume", "published")
    approved_student_status = await get_status_by_name(db, "student", "approved")

    resume = await db.scalar(
        select(Resume)
        .join(StudentProfile, StudentProfile.id == Resume.student_profile_id)
        .where(
            Resume.id == resume_id,
            Resume.status_id == published_resume_status.id,
            Resume.is_public.is_(True),
            StudentProfile.status_id == approved_student_status.id,
        )
    )

    if not resume:
        raise ValueError("Резюме не найдено или студент еще не подтвержден")

    return resume