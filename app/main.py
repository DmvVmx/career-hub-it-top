from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.v1.auth import router as auth_router
from app.db.database import engine
from app.api.v1.employer import router as employer_router
from app.api.v1.employer_vacancies import router as employer_vacancies_router
from app.api.v1.vacancies import router as vacancies_router
from app.api.v1.companies import router as companies_router
from app.api.v1.student_resumes import router as student_resumes_router
from app.api.v1.public_resumes import router as public_resumes_router
from app.api.v1.student_applications import router as student_applications_router
from app.api.v1.employer_applications import router as employer_applications_router
from app.api.v1.chats import router as chats_router
from app.api.v1.admin import router as admin_router
from app.api.v1.chat_ws import router as chat_ws_router
from app.api.v1.pixel_battle import router as pixel_battle_router
from app.api.v1.pixel_battle_ws import router as pixel_battle_ws_router


app = FastAPI(title="Career Hub IT TOP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(employer_router)
app.include_router(employer_vacancies_router)
app.include_router(vacancies_router)
app.include_router(companies_router)
app.include_router(student_resumes_router)
app.include_router(public_resumes_router)
app.include_router(student_applications_router)
app.include_router(employer_applications_router)
app.include_router(chats_router)
app.include_router(admin_router)
app.include_router(chat_ws_router)

app.include_router(pixel_battle_router)
app.include_router(pixel_battle_ws_router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/frontend", StaticFiles(directory="frontend", html=True), name="frontend")
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return {"message": "API работает 🚀"}


@app.get("/health/db")
async def db_health():
    async with engine.connect() as connection:
        result = await connection.execute(text("SELECT 1"))
        value = result.scalar_one()

    return {"status": "ok", "db": value}