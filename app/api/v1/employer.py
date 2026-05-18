from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

import os
from uuid import uuid4
import aiofiles

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models import User
from app.schemas.employer import (
    EmployerAvatarResponse,
    EmployerProfileResponse,
    EmployerProfileUpsertRequest,
)
from app.services.employer_service import (
    get_employer_profile,
    get_employer_status_name,
    upsert_employer_profile,
)


router = APIRouter(prefix="/employer", tags=["Employer"])


def build_employer_profile_response(
    profile,
    status_name: str,
) -> EmployerProfileResponse:
    return EmployerProfileResponse(
        id=profile.id,
        company_name=profile.company_name,
        inn=profile.inn,
        phone=profile.phone,
        avatar_url=profile.avatar_url,
        description=profile.description,
        status=status_name,
        rejection_reason=profile.rejection_reason,
    )


@router.get("/profile", response_model=EmployerProfileResponse | None)
async def employer_get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_employer_profile(db=db, user=current_user)

    if not profile:
        return None

    status_name = await get_employer_status_name(db=db, status_id=profile.status_id)

    return build_employer_profile_response(
        profile=profile,
        status_name=status_name,
    )


@router.put("/profile", response_model=EmployerProfileResponse)
async def employer_update_profile(
    payload: EmployerProfileUpsertRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        profile = await upsert_employer_profile(
            db=db,
            user=current_user,
            payload=payload,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    status_name = await get_employer_status_name(db=db, status_id=profile.status_id)

    return build_employer_profile_response(
        profile=profile,
        status_name=status_name,
    )


@router.post("/profile/avatar", response_model=EmployerAvatarResponse)
async def employer_upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    allowed_content_types = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }

    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Можно загрузить только JPG, PNG или WEBP изображение",
        )

    max_size = 5 * 1024 * 1024
    content = await file.read()

    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Размер изображения не должен превышать 5 МБ",
        )

    upload_dir = "uploads/employers"
    os.makedirs(upload_dir, exist_ok=True)

    extension = allowed_content_types[file.content_type]
    filename = f"{current_user.id}_{uuid4().hex}{extension}"
    file_path = os.path.join(upload_dir, filename)

    async with aiofiles.open(file_path, "wb") as out_file:
        await out_file.write(content)

    return EmployerAvatarResponse(
        avatar_url=f"/uploads/employers/{filename}"
    )