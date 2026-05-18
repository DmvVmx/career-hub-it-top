from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models import EmployerProfile, SystemStatus, Vacancy
from app.schemas.company import CompanyPublicProfileResponse, CompanyVacancyResponse

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("/{company_id}", response_model=CompanyPublicProfileResponse)
async def get_company_public_profile(
    company_id: int,
    db: AsyncSession = Depends(get_db),
):
    company = await db.get(EmployerProfile, company_id)

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Компания не найдена",
        )

    company_status = await db.get(SystemStatus, company.status_id)

    published_status = await db.scalar(
        select(SystemStatus).where(
            SystemStatus.category == "vacancy",
            SystemStatus.name == "published",
        )
    )

    vacancies = []

    if published_status:
        result = await db.execute(
            select(Vacancy)
            .where(
                Vacancy.employer_profile_id == company.id,
                Vacancy.status_id == published_status.id,
            )
            .order_by(Vacancy.created_at.desc())
        )

        vacancies = list(result.scalars().all())

    return CompanyPublicProfileResponse(
        id=company.id,
        company_name=company.company_name,
        inn=company.inn,
        phone=company.phone,
        avatar_url=company.avatar_url,
        description=company.description,
        status=company_status.name if company_status else "unknown",
        vacancies=[
            CompanyVacancyResponse(
                id=vacancy.id,
                title=vacancy.title,
                salary_from=vacancy.salary_from,
                salary_to=vacancy.salary_to,
                city=vacancy.city,
                work_format=vacancy.work_format,
                employment_type=vacancy.employment_type,
                created_at=vacancy.created_at,
            )
            for vacancy in vacancies
        ],
    )