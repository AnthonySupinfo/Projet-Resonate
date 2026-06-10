from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from starlette.status import HTTP_404_NOT_FOUND
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.services.follows import follow_service
from fastapi import HTTPException
from app.models.user import User
from typing import List
from app.schemas.auth import UserProfileResponse
from app.services.email import send_follow_email

router = APIRouter(prefix="/users", tags=["Social"])

@router.post("/{target_id}/follow", status_code=status.HTTP_201_CREATED)
async def follow(
        target_id: str,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    """S'abonner à un utilisateur."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Impossible de trouver l'ID dans le token")

    result = await follow_service.follow_user(db, user_id, target_id)

    # Notif email à l'utilisateur suivi si il a activé les notifications
    try:
        target_user = await db.get(User, target_id)
        follower = await db.get(User, user_id)
        if target_user and follower and target_user.email_notifications:
            await send_follow_email(target_user.email, follower.username)
    except Exception:
        pass  # Silencieux (l'email ne doit jamais bloquer l'action)

    return result

@router.delete("/{target_id}/follow")
async def unfollow(
    target_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Se désabonner d'un utilisateur."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Impossible de trouver l'ID dans le token")

    return await follow_service.unfollow_user(db, user_id, target_id)

@router.get("/{target_id}/followers", response_model=List[UserProfileResponse])
async def get_followers(
    target_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Récuprérer les abonnés d'un utilisateur."""
    target_user = await db.get(User, target_id)
    if not target_user:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="L'utilisateur n'existe pas en BDD.")

    return await follow_service.get_followers(db, target_id)

@router.get("/{target_id}/following", response_model=List[UserProfileResponse])
async def get_following(
    target_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Récupérer les comptes suivis d'un utilisateur."""
    target_user = await db.get(User, target_id)
    if not target_user:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="L'utilisateur n'existe pas en BDD.")

    return await follow_service.get_following(db, target_id)