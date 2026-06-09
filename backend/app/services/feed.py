from sqlalchemy import select, desc, func
from app.models import Album, Review
from app.models.follow import Follow
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user_activity_feed import UserActivityFeed, ActivityTypes
from app.models.user import User
from app.models.playlist import Playlist
from app.models.user_playlist_item import UserPlaylistItem

class FeedService:
    async def log_activity(self,
                           db: AsyncSession,
                           user_id: str,
                           activity_type: ActivityTypes,
                           target_user_id: str = None,
                           review_id: int = None,
                           playlist_id: int = None,
                           album_id: int = None,
                           track_id: int = None
                           ) -> UserActivityFeed:
        """Enregistrer une nouvelle action (donc un nouveau post) dans le fil d'actualité."""

        new_activity = UserActivityFeed(
            user_id=user_id,
            activity_type=activity_type,
            target_user_id=target_user_id,
            review_id=review_id,
            playlist_id=playlist_id,
            album_id=album_id,
            track_id=track_id
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

        injected_feed = []

        for activity in activities:
            actor = await db.get(User, activity.user_id)
            if not actor:
                continue

            item = {
                "id": activity.id,
                "activity_type": activity.activity_type,
                "created_at": activity.created_at,
                "actor_id": actor.id,
                "actor_username": actor.username,
                "actor_avatar": actor.avatar_url,
            }

            # Playlists
            if activity.activity_type in (ActivityTypes.CREATE_PLAYLIST,
                                          ActivityTypes.FOLLOW_PLAYLIST) and activity.playlist_id:
                playlist = await db.get(Playlist, activity.playlist_id)
                item["playlist_id"] = activity.playlist_id
                item["playlist_name"] = playlist.name if playlist else "Playlist supprimée"
                if playlist:
                    if hasattr(playlist, 'cover_url'):
                        item["cover_url"] = playlist.cover_url

                    stmt_count = select(func.count()).where(UserPlaylistItem.playlist_id == activity.playlist_id)
                    item["track_count"] = await db.scalar(stmt_count) or 0

            # Albums
            elif activity.activity_type == ActivityTypes.LIKE_ALBUM and activity.album_id:
                album = await db.get(Album, activity.album_id)
                item["album_id"] = activity.album_id
                item["album_title"] = album.title if album else "Album inconnu"
                item["cover_url"] = album.image if album else None

            elif activity.activity_type == ActivityTypes.REVIEW_ALBUM and activity.review_id:
                review = await db.get(Review, activity.review_id)
                item["review_id"] = activity.review_id

                if review:
                    item["review_like_rating"] = review.rating
                    item["review_comment_content"] = review.content

                    if review.album_id:
                        album = await db.get(Album, review.album_id)
                        item["album_id"] = review.album_id
                        item["album_title"] = album.title if album else "Album inconnu"
                        # item["cover_url"] = album.cover_url if album else None TODO: décommenter quand Krishna aura fait les albums

            # Follow users
            elif activity.activity_type == ActivityTypes.FOLLOW_USER and activity.target_user_id:
                target_user = await db.get(User, activity.target_user_id)
                item["target_user_id"] = activity.target_user_id
                item["target_user_username"] = target_user.username if target_user else "Utilisateur supprimé"
                item["target_user_avatar"] = target_user.avatar_url if target_user else None

                stmt_follow = select(Follow).where(
                    Follow.follower_id == current_user_id,
                    Follow.following_id == activity.target_user_id
                )
                result_follow = await db.execute(stmt_follow)
                item["target_user_is_followed_by_me"] = result_follow.scalar_one_or_none() is not None

            # Interactions sur reviews
            elif activity.activity_type in (ActivityTypes.LIKE_REVIEW,
                                            ActivityTypes.COMMENT_REVIEW) and activity.review_id:
                review = await db.get(Review, activity.review_id)
                item["review_id"] = activity.review_id
                if review and review.album_id:
                    album = await db.get(Album, review.album_id)
                    item["album_id"] = review.album_id
                    item["album_title"] = album.title if album else "Album inconnu"

            # Tracks
            elif activity.activity_type in (ActivityTypes.ADD_TRACK_PLAYLIST, ActivityTypes.LIKE_TRACK):
                if activity.playlist_id:
                    playlist = await db.get(Playlist, activity.playlist_id)
                    item["playlist_id"] = activity.playlist_id
                    item["playlist_name"] = playlist.name if playlist else "Playlist supprimée"

                # TODO : décommenter quand Krishna aura fait les tracks
                # if activity.track_id:
                #     track = await db.get(Track, activity.track_id)
                #     item["track_id"] = activity.track_id
                #     item["track_title"] = track.title if track else "Musique inconnue"

            injected_feed.append(item)

        return injected_feed

feed_service = FeedService()