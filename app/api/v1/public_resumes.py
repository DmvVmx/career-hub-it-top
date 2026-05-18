from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models import StudentProfile
from app.schemas.resume import (
    ResumeListResponse,
    ResumeResponse,
    ResumeStudentResponse,
)
from app.services.pdf_service import generate_resume_pdf
from app.services.resume_service import (
    get_public_resume_by_id,
    get_public_resumes,
    get_status_name,
)


router = APIRouter(prefix="/resumes/public", tags=["Public resumes"])


async def build_public_resume_response(
    db: AsyncSession,
    resume,
) -> ResumeResponse:
    status_name = await get_status_name(db=db, status_id=resume.status_id)

    profile = await db.get(StudentProfile, resume.student_profile_id)
    student = None

    if profile:
        student = ResumeStudentResponse(
            id=profile.id,
            full_name=profile.full_name,
            group_name=profile.group_name,
            photo_url=profile.photo_url,
        )

    return ResumeResponse(
        id=resume.id,
        title=resume.title,
        about=resume.about,
        city=resume.city,
        direction=resume.direction,
        skills=resume.skills,
        experience=resume.experience,
        education=resume.education,
        contacts=resume.contacts,
        is_public=resume.is_public,
        status=status_name,
        rejection_reason=resume.rejection_reason,
        created_at=resume.created_at,
        updated_at=resume.updated_at,
        student=student,
    )


@router.get("", response_model=ResumeListResponse)
async def public_get_resumes(
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    resumes, total = await get_public_resumes(
        db=db,
        limit=limit,
        offset=offset,
    )

    return ResumeListResponse(
        items=[
            await build_public_resume_response(db=db, resume=resume)
            for resume in resumes
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{resume_id}/pdf")
async def public_download_resume_pdf(
    resume_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        resume = await get_public_resume_by_id(db=db, resume_id=resume_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    student = await db.get(StudentProfile, resume.student_profile_id)

    pdf_bytes = generate_resume_pdf(resume=resume, student=student)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="resume_{resume.id}.pdf"'
        },
    )


@router.get("/{resume_id}", response_model=ResumeResponse)
async def public_get_resume_detail(
    resume_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        resume = await get_public_resume_by_id(db=db, resume_id=resume_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return await build_public_resume_response(db=db, resume=resume)