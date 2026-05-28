from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models import Follow, Playlist, Review

class StatsService:

    async def get_user_stats(self, db: AsyncSession, target_user_id: str) -> dict:
        """Calcule toutes les statistiques du profil utilisateur."""

        followers_stmt = select(func.count()).select_from(Follow).where(Follow.following_id == target_user_id)
        followers_count = await db.scalar(followers_stmt) or 0

        playlists_stmt = select(func.count()).select_from(Playlist).where(Playlist.user_id == target_user_id)
        playlists_count = await db.scalar(playlists_stmt) or 0

        # ToDo: adapter et décommenté quand j'aurai récupéré les tracks :
        listening_minutes = 0
        # listening_stmt = select(func.coalesce(func.sum(Stream.duration_minutes), 0)).select_from(Stream).where(
        #     Stream.user_id == target_user_id)
        # listening_minutes = await db.scalar(listening_stmt)

        liked_albums_count = 0
        # liked_albums_stmt = select(func.count()).select_from(AlbumLike).where(AlbumLike.user_id == target_user_id)
        # liked_albums_count = await db.scalar(liked_albums_stmt) or 0

        reviews_stmt = select(func.count()).select_from(Review).where(Review.user_id == target_user_id)
        reviews_count = await db.scalar(reviews_stmt) or 0

        comments_stmt = (
            select(func.count())
            .select_from(Review)
            .where(
                Review.user_id == target_user_id,
                Review.content.is_not(None),
                Review.content != ""
            )
        )
        comments_count = await db.scalar(comments_stmt) or 0

        return {
            "followers_count": followers_count,
            "playlists_count": playlists_count,
            "listening_minutes": listening_minutes,
            "liked_albums_count": liked_albums_count,
            "reviews_count": reviews_count,
            "comments_count": comments_count
        }


stats_service = StatsService()