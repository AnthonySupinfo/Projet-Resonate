from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from jose import jwt
from datetime import datetime, timedelta, timezone
from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.services.auth import register_user, login_user
from app.services.email import send_reset_password_email
from app.core.dependencies import get_current_user, require_admin
from app.core.config import settings
from app.models.user import User
import bcrypt
import re

# Router
router = APIRouter(prefix="/auth", tags=["auth"])

# POST /auth/register
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await register_user(data, db)
    return user

# POST /auth/login
@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    token = await login_user(data.email, data.password, db)
    return TokenResponse(access_token=token)

# POST /auth/token - Swagger uniquement
@router.post("/token", include_in_schema=False)
async def login_swagger(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    token = await login_user(form_data.username, form_data.password, db)
    return TokenResponse(access_token=token)

# GET /auth/me
@router.get("/me", tags=["auth"])
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"user_id": current_user["user_id"], "role": current_user["role"]}

# GET /auth/admin-test
@router.get("/admin-test", tags=["auth"])
async def admin_test(admin: dict = Depends(require_admin)):
    return {"message": "Accès admin confirmé", "user_id": admin["user_id"]}

# Schémas reset password
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# POST /auth/check-availability
class CheckAvailabilityRequest(BaseModel):
    email: EmailStr
    username: str

@router.post("/check-availability", status_code=status.HTTP_200_OK)
async def check_availability(data: CheckAvailabilityRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Cet email est déjà utilisé.")
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Cet identifiant est déjà pris.")
    return {"available": True}

# POST /auth/forgot-password
@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user:
        return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé."}

    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    reset_token = jwt.encode(
        {"sub": str(user.id), "exp": expire, "type": "reset"},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

    try:
        await send_reset_password_email(user.email, reset_token)
    except Exception:
        pass

    return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé."}


# POST /auth/reset-password
@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    if len(data.new_password) < 6:
        raise HTTPException(status_code=422, detail="Le mot de passe doit faire au moins 6 caractères")

    if len(re.findall(r'\d', data.new_password)) < 2:
        raise HTTPException(status_code=422, detail="Le mot de passe doit contenir au moins 2 chiffres")

    if not re.search(r'[!@#$%^&*()\[\]{},.\-?":{}|<>_+=\\\/~`\';:]', data.new_password):
        raise HTTPException(status_code=422, detail="Le mot de passe doit contenir au moins 1 caractère spécial")

    try:
        payload = jwt.decode(data.token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Token invalide")
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=400, detail="Token invalide ou expiré")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    new_hash = bcrypt.hashpw(data.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user.hashed_password = new_hash
    await db.commit()

    return {"message": "Mot de passe modifié avec succès"}