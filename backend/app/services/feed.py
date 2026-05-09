from sqlalchemy import select, desc
from app.models.follow import Follow
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user_activity_feed import UserActivityFeed, ActivityTypes

class FeedService:
    async def log_activity(self,
                           db: AsyncSession,
                           user_id: str,
                           activity_type: ActivityTypes,
                           target_user_id: str = None,
                           review_id: int = None,
                           playlist_id: int = None,
                           album_id: int = None
                           # track_id: int = None # TODO : Décommenter quand Krishna aura fait la table Track
                           ) -> UserActivityFeed:
        """Enregistrer une nouvelle action (donc un nouveau post) dans le fil d'actualité."""

        new_activity = UserActivityFeed(
            user_id=user_id,
            activity_type=activity_type,
            target_user_id=target_user_id,
            review_id=review_id,
            playlist_id=playlist_id,
            album_id=album_id
            # track_id=track_id # TODO : Décommenter quand Krishna aura fait la table Track
        )

        db.add(new_activity)
        await db.commit()

        return new_activity

    async def get_user_feed(self, db: AsyncSession, current_user_id: str, limit: int = 20, offset: int = 0):
        """Récupère le fil d'actualité de l'utilisateur"""

        # On récupère d'abord les following, pcq on va vouloir l'activité de ces users là --> Sous-requete
        following_subquery = (
            select(Follow.following_id)
            .where(Follow.follower_id == current_user_id)
        )

        stmt = (
            select(UserActivityFeed)
            .where(UserActivityFeed.user_id.in_(following_subquery))
            .order_by(desc(UserActivityFeed.created_at))
            .limit(limit)
            .offset(offset)
        )

        result = await db.execute(stmt)
        activities = result.scalars().all()

        return activities

feed_service = FeedService()