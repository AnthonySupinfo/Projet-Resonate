from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.services.follows import follow_service
from fastapi import HTTPException
from app.models.user import User

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

    return await follow_service.follow_user(db, user_id, target_id)

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