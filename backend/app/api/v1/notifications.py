from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from typing import List

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.services.notification import notification_service
from app.schemas.notification import NotificationResponse
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationResponse])
async def get_my_notifications(
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    """Récupère la liste des notifications de l'utilisateur connecté."""
    return await notification_service.get_user_notifications(db, current_user["user_id"])

@router.patch("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_as_read(
        notification_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    """Marque une notification spécifique comme lue."""
    notif = await db.get(Notification, notification_id)

    if not notif:
        raise HTTPException(status_code=404, detail="Notification introuvable")

    if str(notif.user_id) != str(current_user["user_id"]):
        raise HTTPException(status_code=403, detail="Cette notification ne vous appartient pas.")

    notif.is_read = True
    await db.commit()
    return None

@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Marque toutes les notifications comme lues."""

    stmt = (
        update(Notification)
        .where(
            Notification.user_id == current_user["user_id"],
            Notification.is_read == False
        )
        .values(is_read=True)
    )

    await db.execute(stmt)
    await db.commit()
    return None

@router.get("/unread-count")
async def get_unread_notifications_count(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Renvoie le nombre de notifications non lues."""
    count = await notification_service.get_unread_count(db, current_user["user_id"])
    return {"unread_count": count}