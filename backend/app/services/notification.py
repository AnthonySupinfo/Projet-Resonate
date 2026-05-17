from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy import func
from app.models import User
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
        notifications = result.scalars().all()

        injected_notifs = []
        for notif in notifications:
            item = {
                "id": notif.id,
                "type": notif.type,
                "is_read": notif.is_read,
                "created_at": notif.created_at,
                "message": notif.message,
                "related_review_id": notif.related_review_id,
                "related_user_id": notif.related_user_id
            }

            if notif.related_user_id:
                actor = await db.get(User, notif.related_user_id)
                if actor:
                    item["related_user_username"] = actor.username
                    item["related_user_avatar"] = actor.avatar_url

            injected_notifs.append(item)

        return injected_notifs

    async def get_unread_count(self, db: AsyncSession, user_id: str) -> int:
        """Compte le nombre de notifications non lues d'un utilisateur."""
        stmt = (
            select(func.count(Notification.id))
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one()

notification_service = NotificationService()