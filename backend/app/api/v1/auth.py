from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.services.auth import register_user, login_user
from app.core.dependencies import get_current_user, require_admin

# Router
router = APIRouter(prefix="/auth", tags=["auth"])

# POST /auth/register
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
    # Renvoie 201 Created et les infos de l'utilisateur (sans le mot de passe)
)
async def register(
    data: RegisterRequest,
    # Récupère les données de la requête (email, password, etc.) et les valide grâce à Pydantic

    db: AsyncSession = Depends(get_db)
    # Récupère une session de base de données grâce à Depends(get_db)
):

    user = await register_user(data, db)
    return user

# POST /auth/login
@router.post(
    "/login",
    response_model=TokenResponse
    # Renvoie le token JWT que React va stocker
)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):

    token = await login_user(data.email, data.password, db)
    return TokenResponse(access_token=token)

# POST /auth/token - route dédiée au bouton Authorize de Swagger
@router.post("/token", include_in_schema=False)
async def login_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):

    token = await login_user(form_data.username, form_data.password, db)
    return TokenResponse(access_token=token)

# GET /auth/me
@router.get("/me", tags=["auth"])
async def get_me(current_user: dict = Depends(get_current_user)):

    return {
        "user_id": current_user["user_id"],
        "role": current_user["role"]
    }

# GET /auth/admin-test
@router.get("/admin-test", tags=["auth"])
async def admin_test(admin: dict = Depends(require_admin)):

    return {
        "message": "Accès admin confirmé",
        "user_id": admin["user_id"]
    }