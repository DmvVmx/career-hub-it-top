from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.api.v1.employer_vacancies import build_vacancy_response
from app.api.v1.public_resumes import build_public_resume_response
from app.db.database import get_db
from app.models import Application, EmployerProfile, Resume, StudentProfile, User, Vacancy
from app.schemas.application import (
    ApplicationCompanyResponse,
    ApplicationCreateRequest,
    ApplicationListResponse,
    ApplicationResponse,
    ApplicationStudentResponse,
    StudentApplicationStatusUpdateRequest,
)
from app.services.application_service import (
    create_student_application,
    get_status_name,
    get_student_applications,
    update_student_application_status,
)

router = APIRouter(prefix="/student/applications", tags=["Student applications"])


async def build_application_response(
    db: AsyncSession,
    application: Application,
) -> ApplicationResponse:
    status_name = await get_status_name(db=db, status_id=application.status_id)

    student_profile = await db.get(StudentProfile, application.student_profile_id)
    employer_profile = await db.get(EmployerProfile, application.employer_profile_id)
    vacancy = await db.get(Vacancy, application.vacancy_id)
    resume = await db.get(Resume, application.resume_id) if application.resume_id else None

    student = None
    company = None
    vacancy_response = None
    resume_response = None

    if student_profile:
        student = ApplicationStudentResponse(
            id=student_profile.id,
            full_name=student_profile.full_name,
            group_name=student_profile.group_name,
            photo_url=student_profile.photo_url,
        )

    if employer_profile:
        company = ApplicationCompanyResponse(
            id=employer_profile.id,
            company_name=employer_profile.company_name,
            avatar_url=employer_profile.avatar_url,
        )

    if vacancy:
        vacancy_response = await build_vacancy_response(db=db, vacancy=vacancy)

    if resume:
        resume_response = await build_public_resume_response(db=db, resume=resume)

    return ApplicationResponse(
        id=application.id,
        status=status_name,
        message=application.message,
        created_at=application.created_at,
        updated_at=application.updated_at,
        student=student,
        company=company,
        vacancy=vacancy_response,
        resume=resume_response,
    )


@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def student_create_application(
    payload: ApplicationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        application = await create_student_application(
            db=db,
            user=current_user,
            vacancy_id=payload.vacancy_id,
            resume_id=payload.resume_id,
            message=payload.message,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_application_response(db=db, application=application)


@router.get("", response_model=ApplicationListResponse)
async def student_get_applications(
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        applications, total = await get_student_applications(
            db=db,
            user=current_user,
            limit=limit,
            offset=offset,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return ApplicationListResponse(
        items=[
            await build_application_response(db=db, application=application)
            for application in applications
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
async def student_update_application_status(
    application_id: int,
    payload: StudentApplicationStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        application = await update_student_application_status(
            db=db,
            user=current_user,
            application_id=application_id,
            new_status_name=payload.status,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_application_response(db=db, application=application)