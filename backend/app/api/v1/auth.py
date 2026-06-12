from fastapi import APIRouter, Depends, status, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from jose import jwt
from datetime import datetime, timedelta, timezone
from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.services.auth import register_user, login_user, rotate_refresh_token, revoke_all_refresh_tokens
from app.services.email import send_reset_password_email
from app.core.dependencies import get_current_user, require_admin
from app.core.config import settings
from app.core.limiter import limiter
from app.models.user import User
import bcrypt
import re

router = APIRouter(prefix="/auth", tags=["auth"])

# POST /auth/register (3 inscriptions max par minute par IP)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register(request: Request, data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await register_user(data, db)
    return user

# POST /auth/login (5 tentatives max par minute par IP)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    tokens = await login_user(data.email, data.password, db)
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"]
    )

# POST /auth/token - Swagger uniquement (5 tentatives max par minute par IP)


@router.post("/token", include_in_schema=False)
@limiter.limit("5/minute")
async def login_swagger(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    tokens = await login_user(form_data.username, form_data.password, db)
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"]
    )

# POST /auth/refresh (10 refresh max par minute par IP)


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("10/minute")
async def refresh(request: Request, data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    result = await rotate_refresh_token(data.refresh_token, db)
    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"]
    )

# POST /auth/logout (révoque tous les refresh tokens de l'utilisateur)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await revoke_all_refresh_tokens(current_user["user_id"], db)
    return {"message": "Déconnexion réussie"}

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

# POST /auth/check-availability (10 vérifications max par minute par IP)


class CheckAvailabilityRequest(BaseModel):
    email: EmailStr
    username: str


@router.post("/check-availability", status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def check_availability(request: Request, data: CheckAvailabilityRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409, detail="Cet email est déjà utilisé.")
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409, detail="Cet identifiant est déjà pris.")
    return {"available": True}

# POST /auth/forgot-password (3 demandes max par minute par IP)


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
async def forgot_password(request: Request, data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
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


# POST /auth/reset-password (3 tentatives max par minute par IP)
@router.post("/reset-password", status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
async def reset_password(request: Request, data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=422, detail="Le mot de passe doit faire au moins 6 caractères")

    if len(re.findall(r'\d', data.new_password)) < 2:
        raise HTTPException(
            status_code=422, detail="Le mot de passe doit contenir au moins 2 chiffres")

    if not re.search(r'[!@#$%^&*()\[\]{},.\-?":{}|<>_+=\\\/~`\';:]', data.new_password):
        raise HTTPException(
            status_code=422, detail="Le mot de passe doit contenir au moins 1 caractère spécial")

    try:
        payload = jwt.decode(data.token, settings.JWT_SECRET_KEY, algorithms=[
                             settings.JWT_ALGORITHM])
        if payload.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Token invalide")
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=400, detail="Token invalide ou expiré")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    new_hash = bcrypt.hashpw(data.new_password.encode(
        "utf-8"), bcrypt.gensalt()).decode("utf-8")
    user.hashed_password = new_hash
    await db.commit()

    return {"message": "Mot de passe modifié avec succès"}

# POST /auth/change-password - changer son mot de passe (nécessite le mot de passe actuel)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # Les comptes OAuth n'ont pas de mot de passe local
    if not user.hashed_password:
        raise HTTPException(
            status_code=400,
            detail="Ce compte utilise une connexion externe (Google/GitHub). Pas de mot de passe local."
        )

    # Vérification du mot de passe actuel
    if not bcrypt.checkpw(data.current_password.encode("utf-8"), user.hashed_password.encode("utf-8")):
        raise HTTPException(
            status_code=401, detail="Mot de passe actuel incorrect")

    # Validation du nouveau mot de passe (mêmes règles que reset-password)
    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=422, detail="Le mot de passe doit faire au moins 6 caractères")
    if len(re.findall(r'\d', data.new_password)) < 2:
        raise HTTPException(
            status_code=422, detail="Le mot de passe doit contenir au moins 2 chiffres")
    if not re.search(r'[!@#$%^&*()\[\]{},.\-?":{}|<>_+=\\\/~`\';:]', data.new_password):
        raise HTTPException(
            status_code=422, detail="Le mot de passe doit contenir au moins 1 caractère spécial")

    # Mise à jour du mot de passe
    new_hash = bcrypt.hashpw(data.new_password.encode(
        "utf-8"), bcrypt.gensalt()).decode("utf-8")
    user.hashed_password = new_hash
    await db.commit()

    return {"message": "Mot de passe modifié avec succès"}


# POST /auth/change-email - changer son email (nécessite le mot de passe actuel)
class ChangeEmailRequest(BaseModel):
    current_password: str
    new_email: EmailStr


@router.post("/change-email", status_code=status.HTTP_200_OK)
async def change_email(
    data: ChangeEmailRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # Les comptes OAuth ne peuvent pas changer leur email manuellement
    if not user.hashed_password:
        raise HTTPException(
            status_code=400,
            detail="Ce compte utilise une connexion externe. L'email ne peut pas être modifié."
        )

    # Vérification du mot de passe
    if not bcrypt.checkpw(data.current_password.encode("utf-8"), user.hashed_password.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")

    # Vérification que le nouvel email n'est pas déjà utilisé
    if data.new_email == user.email:
        raise HTTPException(
            status_code=400, detail="C'est déjà votre email actuel")

    result = await db.execute(select(User).where(User.email == data.new_email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409, detail="Cet email est déjà utilisé")

    # Mise à jour
    user.email = data.new_email
    await db.commit()

    return {"message": "Email modifié avec succès", "new_email": data.new_email}
