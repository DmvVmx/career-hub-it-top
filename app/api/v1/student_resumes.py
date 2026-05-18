from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models import StudentProfile, User
from app.schemas.resume import (
    ResumeListResponse,
    ResumeResponse,
    ResumeStudentResponse,
    ResumeUpsertRequest,
)
from app.services.pdf_service import generate_resume_pdf
from app.services.resume_service import (
    archive_my_resume,
    create_my_resume,
    delete_my_resume,
    get_my_resume_by_id,
    get_my_resumes,
    get_status_name,
    restore_my_resume,
    update_my_resume,
)


router = APIRouter(prefix="/student/resumes", tags=["Student resumes"])


async def build_resume_response(
    db: AsyncSession,
    resume,
    include_student: bool = False,
) -> ResumeResponse:
    status_name = await get_status_name(db=db, status_id=resume.status_id)

    student = None

    if include_student:
        profile = await db.get(StudentProfile, resume.student_profile_id)

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


@router.post(
    "",
    response_model=ResumeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def student_create_resume(
    payload: ResumeUpsertRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        resume = await create_my_resume(db=db, user=current_user, payload=payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_resume_response(db=db, resume=resume)


@router.get("", response_model=ResumeListResponse)
async def student_get_my_resumes(
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        resumes, total = await get_my_resumes(
            db=db,
            user=current_user,
            limit=limit,
            offset=offset,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return ResumeListResponse(
        items=[
            await build_resume_response(db=db, resume=resume)
            for resume in resumes
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{resume_id}", response_model=ResumeResponse)
async def student_get_my_resume_detail(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        resume = await get_my_resume_by_id(
            db=db,
            user=current_user,
            resume_id=resume_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return await build_resume_response(db=db, resume=resume)


@router.put("/{resume_id}", response_model=ResumeResponse)
async def student_update_resume(
    resume_id: int,
    payload: ResumeUpsertRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        resume = await update_my_resume(
            db=db,
            user=current_user,
            resume_id=resume_id,
            payload=payload,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_resume_response(db=db, resume=resume)


@router.patch("/{resume_id}/archive", response_model=ResumeResponse)
async def student_archive_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        resume = await archive_my_resume(
            db=db,
            user=current_user,
            resume_id=resume_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_resume_response(db=db, resume=resume)


@router.patch("/{resume_id}/restore", response_model=ResumeResponse)
async def student_restore_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        resume = await restore_my_resume(
            db=db,
            user=current_user,
            resume_id=resume_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_resume_response(db=db, resume=resume)


@router.delete("/{resume_id}", response_model=ResumeResponse)
async def student_delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        resume = await delete_my_resume(
            db=db,
            user=current_user,
            resume_id=resume_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_resume_response(db=db, resume=resume)


@router.get("/{resume_id}/pdf")
async def student_download_resume_pdf(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        resume = await get_my_resume_by_id(
            db=db,
            user=current_user,
            resume_id=resume_id,
        )
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