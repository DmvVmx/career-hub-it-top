from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models import (
    Application,
    EmployerProfile,
    Resume,
    StudentProfile,
    User,
    Vacancy,
)
from app.schemas.admin import (
    AdminApplicationResponse,
    AdminEmployerProfileResponse,
    AdminEmployerStatusUpdateRequest,
    AdminListResponse,
    AdminRejectRequest,
    AdminResumeResponse,
    AdminStatsResponse,
    AdminStudentProfileResponse,
    AdminUserResponse,
    AdminVacancyResponse,
)
from app.services.admin_service import (
    approve_employer,
    approve_student,
    delete_resume_by_admin,
    delete_vacancy_by_admin,
    ensure_admin,
    get_admin_application_by_id,
    get_admin_applications,
    get_admin_employer_by_id,
    get_admin_employers,
    get_admin_resume_by_id,
    get_admin_resumes,
    get_admin_stats,
    get_admin_student_by_id,
    get_admin_students,
    get_admin_vacancies,
    get_admin_vacancy_by_id,
    get_role_name,
    get_status_by_name,
    get_status_name,
    reject_employer,
    reject_resume,
    reject_student,
    reject_vacancy,
    unapprove_employer,
    unapprove_student,
    update_user_status,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


async def check_admin(db: AsyncSession, user: User) -> None:
    try:
        await ensure_admin(db=db, user=user)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


async def build_admin_user_response(
    db: AsyncSession,
    user: User,
) -> AdminUserResponse:
    return AdminUserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        journal_login=user.journal_login,
        role=await get_role_name(db=db, role_id=user.role_id),
        status=await get_status_name(db=db, status_id=user.status_id),
        is_email_verified=user.is_email_verified,
        created_at=user.created_at,
    )


async def build_admin_employer_response(
    db: AsyncSession,
    profile: EmployerProfile,
) -> AdminEmployerProfileResponse:
    user = await db.get(User, profile.user_id)

    return AdminEmployerProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        email=user.email if user else None,
        company_name=profile.company_name,
        inn=profile.inn,
        phone=profile.phone,
        avatar_url=profile.avatar_url,
        description=profile.description,
        status=await get_status_name(db=db, status_id=profile.status_id),
        user_status=await get_status_name(db=db, status_id=user.status_id) if user else "unknown",
        rejection_reason=profile.rejection_reason,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


async def build_admin_student_response(
    db: AsyncSession,
    profile: StudentProfile,
) -> AdminStudentProfileResponse:
    user = await db.get(User, profile.user_id)

    return AdminStudentProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        email=user.email if user else None,
        full_name=profile.full_name,
        group_name=profile.group_name,
        photo_url=profile.photo_url,
        birthday=profile.birthday,
        level=profile.level,
        status=await get_status_name(db=db, status_id=profile.status_id),
        user_status=await get_status_name(db=db, status_id=user.status_id) if user else "unknown",
        rejection_reason=profile.rejection_reason,
        created_at=getattr(profile, "created_at", None),
        updated_at=getattr(profile, "updated_at", None),
    )


async def build_admin_vacancy_response(
    db: AsyncSession,
    vacancy: Vacancy,
) -> AdminVacancyResponse:
    company_name = None

    profile = await db.get(EmployerProfile, vacancy.employer_profile_id)
    if profile:
        company_name = profile.company_name

    return AdminVacancyResponse(
        id=vacancy.id,
        title=vacancy.title,
        description=vacancy.description,
        requirements=vacancy.requirements,
        salary_from=vacancy.salary_from,
        salary_to=vacancy.salary_to,
        city=vacancy.city,
        work_format=vacancy.work_format,
        employment_type=vacancy.employment_type,
        company_name=company_name,
        employer_profile_id=vacancy.employer_profile_id,
        status=await get_status_name(db=db, status_id=vacancy.status_id),
        rejection_reason=vacancy.rejection_reason,
        created_at=vacancy.created_at,
        updated_at=vacancy.updated_at,
    )


async def build_admin_resume_response(
    db: AsyncSession,
    resume: Resume,
) -> AdminResumeResponse:
    student_name = None
    group_name = None

    profile = await db.get(StudentProfile, resume.student_profile_id)
    if profile:
        student_name = profile.full_name
        group_name = profile.group_name

    return AdminResumeResponse(
        id=resume.id,
        title=resume.title,
        about=resume.about,
        skills=resume.skills,
        experience=resume.experience,
        education=resume.education,
        contacts=resume.contacts,
        student_name=student_name,
        student_profile_id=resume.student_profile_id,
        group_name=group_name,
        status=await get_status_name(db=db, status_id=resume.status_id),
        is_public=resume.is_public,
        rejection_reason=resume.rejection_reason,
        created_at=resume.created_at,
        updated_at=resume.updated_at,
    )


async def build_admin_application_response(
    db: AsyncSession,
    application: Application,
) -> AdminApplicationResponse:
    student_name = None
    company_name = None
    vacancy_title = None
    resume_title = None

    student = await db.get(StudentProfile, application.student_profile_id)
    employer = await db.get(EmployerProfile, application.employer_profile_id)
    vacancy = await db.get(Vacancy, application.vacancy_id)
    resume = await db.get(Resume, application.resume_id) if application.resume_id else None

    if student:
        student_name = student.full_name

    if employer:
        company_name = employer.company_name

    if vacancy:
        vacancy_title = vacancy.title

    if resume:
        resume_title = resume.title

    return AdminApplicationResponse(
        id=application.id,
        student_name=student_name,
        company_name=company_name,
        vacancy_title=vacancy_title,
        resume_title=resume_title,
        message=application.message,
        status=await get_status_name(db=db, status_id=application.status_id),
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


@router.get("/stats", response_model=AdminStatsResponse)
async def admin_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)
    return AdminStatsResponse(**await get_admin_stats(db=db))


# Оставляем backend endpoint для совместимости, но на новом фронте вкладки "Пользователи" не будет.
@router.get("/users", response_model=AdminListResponse)
async def admin_users(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    total = await db.scalar(select(func.count(User.id)))

    result = await db.execute(
        select(User)
        .order_by(User.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    users = list(result.scalars().all())

    return AdminListResponse(
        items=[await build_admin_user_response(db=db, user=user) for user in users],
        total=total or 0,
        limit=limit,
        offset=offset,
    )


@router.patch("/users/{user_id}/ban", response_model=AdminUserResponse)
async def admin_ban_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        user = await update_user_status(db=db, user_id=user_id, status_name="banned")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_admin_user_response(db=db, user=user)


@router.patch("/users/{user_id}/unban", response_model=AdminUserResponse)
async def admin_unban_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        user = await update_user_status(db=db, user_id=user_id, status_name="active")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_admin_user_response(db=db, user=user)


@router.get("/employers", response_model=AdminListResponse)
async def admin_employers(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    employers, total = await get_admin_employers(db=db, limit=limit, offset=offset)

    return AdminListResponse(
        items=[
            await build_admin_employer_response(db=db, profile=profile)
            for profile in employers
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/employers/{profile_id}", response_model=AdminEmployerProfileResponse)
async def admin_employer_detail(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        profile = await get_admin_employer_by_id(db=db, profile_id=profile_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return await build_admin_employer_response(db=db, profile=profile)


@router.get("/employers/{profile_id}/vacancies", response_model=AdminListResponse)
async def admin_employer_vacancies(
    profile_id: int,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    total = await db.scalar(
        select(func.count(Vacancy.id)).where(Vacancy.employer_profile_id == profile_id)
    )

    result = await db.execute(
        select(Vacancy)
        .where(Vacancy.employer_profile_id == profile_id)
        .order_by(Vacancy.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    vacancies = list(result.scalars().all())

    return AdminListResponse(
        items=[
            await build_admin_vacancy_response(db=db, vacancy=vacancy)
            for vacancy in vacancies
        ],
        total=total or 0,
        limit=limit,
        offset=offset,
    )


@router.patch("/employers/{profile_id}/approve", response_model=AdminEmployerProfileResponse)
async def admin_approve_employer(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        profile = await approve_employer(db=db, profile_id=profile_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_admin_employer_response(db=db, profile=profile)


@router.patch("/employers/{profile_id}/unapprove", response_model=AdminEmployerProfileResponse)
async def admin_unapprove_employer(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        profile = await unapprove_employer(db=db, profile_id=profile_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_admin_employer_response(db=db, profile=profile)


@router.patch("/employers/{profile_id}/reject", response_model=AdminEmployerProfileResponse)
async def admin_reject_employer(
    profile_id: int,
    payload: AdminRejectRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        profile = await reject_employer(
            db=db,
            profile_id=profile_id,
            reason=payload.reason,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_admin_employer_response(db=db, profile=profile)


# Старый endpoint оставляем для совместимости.
@router.patch("/employers/{profile_id}/status", response_model=AdminEmployerProfileResponse)
async def admin_update_employer_status(
    profile_id: int,
    payload: AdminEmployerStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    profile = await db.get(EmployerProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль работодателя не найден")

    status = await get_status_by_name(db=db, category="employer", name=payload.status)
    profile.status_id = status.id

    if payload.status == "approved":
        profile.rejection_reason = None

    await db.commit()
    await db.refresh(profile)

    return await build_admin_employer_response(db=db, profile=profile)


@router.get("/students", response_model=AdminListResponse)
async def admin_students(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    students, total = await get_admin_students(db=db, limit=limit, offset=offset)

    return AdminListResponse(
        items=[
            await build_admin_student_response(db=db, profile=profile)
            for profile in students
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/students/{profile_id}", response_model=AdminStudentProfileResponse)
async def admin_student_detail(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        profile = await get_admin_student_by_id(db=db, profile_id=profile_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return await build_admin_student_response(db=db, profile=profile)


@router.get("/students/{profile_id}/resumes", response_model=AdminListResponse)
async def admin_student_resumes(
    profile_id: int,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    total = await db.scalar(
        select(func.count(Resume.id)).where(Resume.student_profile_id == profile_id)
    )

    result = await db.execute(
        select(Resume)
        .where(Resume.student_profile_id == profile_id)
        .order_by(Resume.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    resumes = list(result.scalars().all())

    return AdminListResponse(
        items=[
            await build_admin_resume_response(db=db, resume=resume)
            for resume in resumes
        ],
        total=total or 0,
        limit=limit,
        offset=offset,
    )


@router.patch("/students/{profile_id}/approve", response_model=AdminStudentProfileResponse)
async def admin_approve_student(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        profile = await approve_student(db=db, profile_id=profile_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_admin_student_response(db=db, profile=profile)


@router.patch("/students/{profile_id}/unapprove", response_model=AdminStudentProfileResponse)
async def admin_unapprove_student(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        profile = await unapprove_student(db=db, profile_id=profile_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_admin_student_response(db=db, profile=profile)


@router.patch("/students/{profile_id}/reject", response_model=AdminStudentProfileResponse)
async def admin_reject_student(
    profile_id: int,
    payload: AdminRejectRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        profile = await reject_student(
            db=db,
            profile_id=profile_id,
            reason=payload.reason,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_admin_student_response(db=db, profile=profile)


@router.get("/vacancies", response_model=AdminListResponse)
async def admin_vacancies(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    vacancies, total = await get_admin_vacancies(db=db, limit=limit, offset=offset)

    return AdminListResponse(
        items=[
            await build_admin_vacancy_response(db=db, vacancy=vacancy)
            for vacancy in vacancies
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/vacancies/{vacancy_id}", response_model=AdminVacancyResponse)
async def admin_vacancy_detail(
    vacancy_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        vacancy = await get_admin_vacancy_by_id(db=db, vacancy_id=vacancy_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return await build_admin_vacancy_response(db=db, vacancy=vacancy)


@router.patch("/vacancies/{vacancy_id}/reject", response_model=AdminVacancyResponse)
async def admin_reject_vacancy(
    vacancy_id: int,
    payload: AdminRejectRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        vacancy = await reject_vacancy(
            db=db,
            vacancy_id=vacancy_id,
            reason=payload.reason,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_admin_vacancy_response(db=db, vacancy=vacancy)


@router.patch("/vacancies/{vacancy_id}/archive", response_model=AdminVacancyResponse)
async def admin_archive_vacancy(
    vacancy_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    vacancy = await db.get(Vacancy, vacancy_id)
    if not vacancy:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")

    status = await get_status_by_name(db=db, category="vacancy", name="archived")
    vacancy.status_id = status.id

    await db.commit()
    await db.refresh(vacancy)

    return await build_admin_vacancy_response(db=db, vacancy=vacancy)


@router.patch("/vacancies/{vacancy_id}/restore", response_model=AdminVacancyResponse)
async def admin_restore_vacancy(
    vacancy_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    vacancy = await db.get(Vacancy, vacancy_id)
    if not vacancy:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")

    status = await get_status_by_name(db=db, category="vacancy", name="published")
    vacancy.status_id = status.id
    vacancy.rejection_reason = None

    await db.commit()
    await db.refresh(vacancy)

    return await build_admin_vacancy_response(db=db, vacancy=vacancy)


@router.delete("/vacancies/{vacancy_id}", response_model=AdminVacancyResponse)
async def admin_delete_vacancy(
    vacancy_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        vacancy = await delete_vacancy_by_admin(db=db, vacancy_id=vacancy_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_admin_vacancy_response(db=db, vacancy=vacancy)


@router.get("/resumes", response_model=AdminListResponse)
async def admin_resumes(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    resumes, total = await get_admin_resumes(db=db, limit=limit, offset=offset)

    return AdminListResponse(
        items=[
            await build_admin_resume_response(db=db, resume=resume)
            for resume in resumes
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/resumes/{resume_id}", response_model=AdminResumeResponse)
async def admin_resume_detail(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        resume = await get_admin_resume_by_id(db=db, resume_id=resume_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return await build_admin_resume_response(db=db, resume=resume)


@router.patch("/resumes/{resume_id}/reject", response_model=AdminResumeResponse)
async def admin_reject_resume(
    resume_id: int,
    payload: AdminRejectRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        resume = await reject_resume(
            db=db,
            resume_id=resume_id,
            reason=payload.reason,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_admin_resume_response(db=db, resume=resume)


@router.patch("/resumes/{resume_id}/archive", response_model=AdminResumeResponse)
async def admin_archive_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    resume = await db.get(Resume, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Резюме не найдено")

    status = await get_status_by_name(db=db, category="resume", name="archived")
    resume.status_id = status.id

    await db.commit()
    await db.refresh(resume)

    return await build_admin_resume_response(db=db, resume=resume)


@router.patch("/resumes/{resume_id}/restore", response_model=AdminResumeResponse)
async def admin_restore_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    resume = await db.get(Resume, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Резюме не найдено")

    status = await get_status_by_name(db=db, category="resume", name="published")
    resume.status_id = status.id
    resume.rejection_reason = None

    await db.commit()
    await db.refresh(resume)

    return await build_admin_resume_response(db=db, resume=resume)


@router.delete("/resumes/{resume_id}", response_model=AdminResumeResponse)
async def admin_delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        resume = await delete_resume_by_admin(db=db, resume_id=resume_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_admin_resume_response(db=db, resume=resume)


@router.get("/applications", response_model=AdminListResponse)
async def admin_applications(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    applications, total = await get_admin_applications(db=db, limit=limit, offset=offset)

    return AdminListResponse(
        items=[
            await build_admin_application_response(db=db, application=application)
            for application in applications
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/applications/{application_id}", response_model=AdminApplicationResponse)
async def admin_application_detail(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_admin(db=db, user=current_user)

    try:
        application = await get_admin_application_by_id(
            db=db,
            application_id=application_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return await build_admin_application_response(db=db, application=application)