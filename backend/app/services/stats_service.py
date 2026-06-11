from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models import Follow, Playlist, Review
from app.models.user_album_status import UserAlbumStatus, MediaStatus

class StatsService:
    async def get_user_stats(self, db: AsyncSession, target_user_id: str) -> dict:
        """Calcule toutes les statistiques du profil utilisateur."""
        followers_stmt = select(func.count()).select_from(Follow).where(Follow.following_id == target_user_id)
        followers_count = await db.scalar(followers_stmt) or 0

        playlists_stmt = select(func.count()).select_from(Playlist).where(Playlist.user_id == target_user_id)
        playlists_count = await db.scalar(playlists_stmt) or 0

        completed_stmt = select(func.count()).select_from(UserAlbumStatus).where(
            UserAlbumStatus.user_id == target_user_id,
            UserAlbumStatus.status == MediaStatus.COMPLETED
        )
        completed_albums_count = await db.scalar(completed_stmt) or 0

        # Albums en cours d'écoute (statut LISTENING dans user_album_status)
        listening_stmt = select(func.count()).select_from(UserAlbumStatus).where(
            UserAlbumStatus.user_id == target_user_id,
            UserAlbumStatus.status == MediaStatus.LISTENING
        )
        liked_albums_count = await db.scalar(listening_stmt) or 0

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
            "completed_albums_count": completed_albums_count,
            "liked_albums_count": liked_albums_count,
            "in_progress_albums_count": liked_albums_count,
            "reviews_count": reviews_count,
            "comments_count": comments_count
        }

stats_service = StatsService()