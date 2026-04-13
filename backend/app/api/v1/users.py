from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import UserProfileResponse, UpdateProfileRequest
import json

router = APIRouter(prefix="/users", tags=["users"])

# GET /users/me - profil complet de l'utilisateur connecté
@router.get("/me", response_model=UserProfileResponse)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()
    return user

# PATCH /users/me - modifier le profil
@router.patch("/me", response_model=UserProfileResponse)
async def update_profile(
    data: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()

    # Met à jour uniquement les champs envoyés
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    if data.bio is not None:
        user.bio = data.bio
    if data.website is not None:
        user.website = data.website
    if data.theme is not None:
        user.theme = data.theme

    await db.commit()
    await db.refresh(user)
    return user

# GET /users/me/export - télécharger ses données (RGPD)
@router.get("/me/export")
async def export_data(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()

    # Génère un JSON avec toutes les données de l'utilisateur
    export = {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "role": user.role,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "website": user.website,
        "theme": user.theme,
        "is_active": user.is_active,
        "created_at": str(user.created_at)
    }

    return export