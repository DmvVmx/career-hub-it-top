from pydantic import BaseModel, EmailStr, Field


class EmployerRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class EmployerRegisterResponse(BaseModel):
    message: str


class VerifyEmailCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


class VerifyEmailCodeResponse(BaseModel):
    id: int
    email: EmailStr
    message: str


class EmployerLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class StudentProfileResponse(BaseModel):
    full_name: str | None = None
    group_name: str | None = None
    birthday: str | None = None
    photo_url: str | None = None
    level: int | None = None
    status: str | None = None
    rejection_reason: str | None = None


class CurrentUserResponse(BaseModel):
    id: int
    email: EmailStr | None = None
    username: str | None = None
    journal_login: str | None = None
    role: str
    student_profile: StudentProfileResponse | None = None

class StudentLoginRequest(BaseModel):
    login: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=1, max_length=128)


class StudentLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    full_name: str
    group_name: str | None = None



class AdminLoginRequest(BaseModel):
    username: str
    password: str

class AuthTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class EmployerForgotPasswordRequest(BaseModel):
    email: EmailStr


class EmployerResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8, max_length=128)