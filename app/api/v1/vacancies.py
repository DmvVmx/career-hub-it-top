from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models import EmployerProfile, SystemStatus, Vacancy
from app.schemas.vacancy import VacancyResponse
from app.services.vacancy_service import get_status_name


router = APIRouter(prefix="/vacancies", tags=["Vacancies"])


async def build_public_vacancy_response(
    db: AsyncSession,
    vacancy: Vacancy,
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


@router.get("", response_model=list[VacancyResponse])
async def get_public_vacancies(
    db: AsyncSession = Depends(get_db),
):
    published_status = await db.scalar(
        select(SystemStatus).where(
            SystemStatus.category == "vacancy",
            SystemStatus.name == "published",
        )
    )

    approved_employer_status = await db.scalar(
        select(SystemStatus).where(
            SystemStatus.category == "employer",
            SystemStatus.name == "approved",
        )
    )

    if not published_status or not approved_employer_status:
        return []

    result = await db.execute(
        select(Vacancy)
        .join(EmployerProfile, EmployerProfile.id == Vacancy.employer_profile_id)
        .where(
            Vacancy.status_id == published_status.id,
            EmployerProfile.status_id == approved_employer_status.id,
        )
        .order_by(Vacancy.created_at.desc())
    )

    vacancies = result.scalars().all()

    return [
        await build_public_vacancy_response(db=db, vacancy=vacancy)
        for vacancy in vacancies
    ]


@router.get("/{vacancy_id}", response_model=VacancyResponse)
async def get_public_vacancy_detail(
    vacancy_id: int,
    db: AsyncSession = Depends(get_db),
):
    vacancy = await db.get(Vacancy, vacancy_id)

    if not vacancy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Вакансия не найдена",
        )

    status_name = await get_status_name(db=db, status_id=vacancy.status_id)

    if status_name != "published":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Вакансия не найдена или недоступна",
        )

    profile = await db.get(EmployerProfile, vacancy.employer_profile_id)

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Вакансия не найдена или недоступна",
        )

    employer_status = await db.get(SystemStatus, profile.status_id)

    if not employer_status or employer_status.name != "approved":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Вакансия не найдена или недоступна",
        )

    return await build_public_vacancy_response(db=db, vacancy=vacancy)