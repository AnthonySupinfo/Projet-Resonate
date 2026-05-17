from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.notification import Notification, NotificationType

class NotificationService:
    async def create_notification(self,
                                  db: AsyncSession,
                                  user_id: str,
                                  notification_type: NotificationType,
                                  related_user_id: str = None,
                                  related_review_id: int = None,
                                  message: str = None
                                  ) -> Notification:
                                    """Crée une notification en base de données."""

                                    if user_id == related_user_id:
                                        return None

                                    new_notification = Notification(
                                        user_id=user_id,
                                        type=notification_type,
                                        related_user_id=related_user_id,
                                        related_review_id=related_review_id,
                                        message=message
                                    )

                                    db.add(new_notification)
                                    await db.flush()
                                    return new_notification

    async def get_user_notifications(self, db: AsyncSession, user_id: str, limit: int = 20, offset: int = 0):
        """Récupère les notifications d'un utilisateur, de la plus récente à la plus ancienne."""
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(desc(Notification.created_at))
            .limit(limit)
            .offset(offset)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

notification_service = NotificationService()