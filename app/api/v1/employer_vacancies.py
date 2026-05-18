from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models import EmployerProfile, SystemStatus, User
from app.schemas.vacancy import (
    VacancyCreateRequest,
    VacancyResponse,
    VacancyUpdateRequest,
)
from app.services.vacancy_service import (
    archive_employer_vacancy,
    create_employer_vacancy,
    delete_employer_vacancy,
    get_my_vacancies,
    get_status_name,
    restore_employer_vacancy,
    update_employer_vacancy,
)


router = APIRouter(prefix="/employer/vacancies", tags=["Employer vacancies"])


async def build_vacancy_response(
    db: AsyncSession,
    vacancy,
) -> VacancyResponse:
    status_name = await get_status_name(db=db, status_id=vacancy.status_id)

    profile = await db.get(EmployerProfile, vacancy.employer_profile_id)
    company = None

    if profile:
        employer_status = await db.get(SystemStatus, profile.status_id)

        company = {
            "id": profile.id,
            "company_name": profile.company_name,
            "avatar_url": profile.avatar_url,
            "status": employer_status.name if employer_status else "unknown",
        }

    return VacancyResponse(
        id=vacancy.id,
        title=vacancy.title,
        description=vacancy.description,
        requirements=vacancy.requirements,
        salary_from=vacancy.salary_from,
        salary_to=vacancy.salary_to,
        city=vacancy.city,
        direction=vacancy.direction,
        skills=vacancy.skills,
        work_format=vacancy.work_format,
        employment_type=vacancy.employment_type,
        status=status_name,
        rejection_reason=vacancy.rejection_reason,
        created_at=vacancy.created_at,
        company=company,
    )


@router.post(
    "",
    response_model=VacancyResponse,
    status_code=status.HTTP_201_CREATED,
)
async def employer_create_vacancy(
    payload: VacancyCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        vacancy = await create_employer_vacancy(
            db=db,
            user=current_user,
            payload=payload,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return await build_vacancy_response(db=db, vacancy=vacancy)


@router.get("", response_model=list[VacancyResponse])
async def employer_get_vacancies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        vacancies = await get_my_vacancies(db=db, user=current_user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return [
        await build_vacancy_response(db=db, vacancy=vacancy)
        for vacancy in vacancies
    ]


@router.put("/{vacancy_id}", response_model=VacancyResponse)
async def employer_update_vacancy(
    vacancy_id: int,
    payload: VacancyUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        vacancy = await update_employer_vacancy(
            db=db,
            user=current_user,
            vacancy_id=vacancy_id,
            payload=payload,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return await build_vacancy_response(db=db, vacancy=vacancy)


@router.patch("/{vacancy_id}/archive", response_model=VacancyResponse)
async def employer_archive_vacancy(
    vacancy_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        vacancy = await archive_employer_vacancy(
            db=db,
            user=current_user,
            vacancy_id=vacancy_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return await build_vacancy_response(db=db, vacancy=vacancy)


@router.patch("/{vacancy_id}/restore", response_model=VacancyResponse)
async def employer_restore_vacancy(
    vacancy_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        vacancy = await restore_employer_vacancy(
            db=db,
            user=current_user,
            vacancy_id=vacancy_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return await build_vacancy_response(db=db, vacancy=vacancy)


@router.delete("/{vacancy_id}", response_model=VacancyResponse)
async def employer_delete_vacancy(
    vacancy_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        vacancy = await delete_employer_vacancy(
            db=db,
            user=current_user,
            vacancy_id=vacancy_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return await build_vacancy_response(db=db, vacancy=vacancy)