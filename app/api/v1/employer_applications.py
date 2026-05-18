from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.api.v1.student_applications import build_application_response
from app.db.database import get_db
from app.models import User
from app.schemas.application import (
    ApplicationListResponse,
    ApplicationResponse,
    ApplicationStatusUpdateRequest,
    EmployerInviteStudentRequest,
)
from app.services.application_service import (
    get_employer_applications,
    invite_student_by_resume,
    update_employer_application_status,
)


router = APIRouter(prefix="/employer/applications", tags=["Employer applications"])


@router.get("", response_model=ApplicationListResponse)
async def employer_get_applications(
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        applications, total = await get_employer_applications(
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
async def employer_update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        application = await update_employer_application_status(
            db=db,
            user=current_user,
            application_id=application_id,
            new_status_name=payload.status,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_application_response(db=db, application=application)


@router.post("/resumes/{resume_id}/invite", response_model=ApplicationResponse)
async def employer_invite_student_by_resume(
    resume_id: int,
    payload: EmployerInviteStudentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        application = await invite_student_by_resume(
            db=db,
            user=current_user,
            resume_id=resume_id,
            vacancy_id=payload.vacancy_id,
            message=payload.message,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_application_response(db=db, application=application)