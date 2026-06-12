from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi.responses import Response
import httpx
from pydantic import BaseModel
from typing import Literal
from uuid import UUID

from app.core.dependencies import get_current_user, require_admin, get_optional_user
from app.models import Track
from app.models.user_activity_feed import ActivityTypes
from app.services.feed import feed_service
from app.services.lastfm import lastfm_service
from app.models.album import Album
from app.db.session import get_db
from app.models.reviews import Review
from app.models.user_album_status import UserAlbumStatus

router = APIRouter(tags=["albums"])


@router.get("/albums/random/track", tags=["albums"])
async def get_random_track(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Track)
        .options(selectinload(Track.album))
        .order_by(func.random())
        .limit(1)
    )
    track = result.scalar_one_or_none()

    if not track or not track.album:
        return {
            "track_name": "Birds",
            "artist": "Imagine Dragons",
            "album_name": "Origins",
            "year": 2018,
            "image": "/imagineDragons.jpg"
        }

    return {
        "track_name": track.name,
        "artist": track.artist or track.album.artist_name,
        "album_name": track.album.name,
        "year": track.album.year,
        "image": track.album.image
    }


@router.get("/albums/{album_id}")
async def get_album_detail(
    album_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    # 1 Récupérer album + tracks depuis DB
    result = await db.execute(
        select(Album)
        .options(selectinload(Album.tracks))
        .where(Album.id == album_id)
    )

    album = result.scalar_one_or_none()

    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    lastfm_data = None

    if not album.tracks or len(album.tracks) == 0 or album.year is None:
        lastfm_data = await lastfm_service.get_album_detail(
            album.artist_name,
            album.name
        )

        if lastfm_data:
            if lastfm_data.get("year"):
                album.year = lastfm_data["year"]
                await db.commit()

    avg_result = await db.execute(
        select(func.avg(Review.rating)).where(
            Review.album_id == album.id,
            Review.deleted_at == None
        )
    )

    average_rating = avg_result.scalar()
    average_rating = round(average_rating, 2) if average_rating else None

    user_status = None

    if current_user:
        status_result = await db.execute(
            select(UserAlbumStatus).where(
                UserAlbumStatus.user_id == current_user["user_id"],
                UserAlbumStatus.album_id == album.id
            )
        )

        status = status_result.scalar_one_or_none()
        user_status = status.status if status else None

    tracks_data = [
        {
            "name": t.name,
            "position": t.position,
            "duration": t.duration
        }
        for t in album.tracks
    ]

    if not tracks_data and lastfm_data:
        tracks_data = lastfm_data.get("tracks", [])

    genres = lastfm_data.get("tags", []) if lastfm_data else []
    '''
    Lastfm ne renvoie pas de genres, sur le API le genre est vide 
    '''

    final_image = getattr(album, "image", None)

    if not final_image and lastfm_data:
        final_image = lastfm_data.get("image")

    return {
        "id": str(album.id),
        "name": album.name,
        "artist": album.artist_name,
        "url": album.lastfm_url,
        "tracks": tracks_data,
        "genres": genres,
        "average_rating": average_rating,
        "user_status": user_status,
        "year": album.year,
        "image": final_image,
        "source": "cache"
    }


@router.post("/albums/{album_id}/review", tags=["reviews"])
async def post_review(
    album_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return {"message": f"Critique postée par {current_user['user_id']}"}


@router.delete("/admin/reviews/{review_id}")
async def delete_review(
    review_id: str,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    return {"message": "Critique supprimée"}


@router.get("/detail/{artist}/{album}", tags=["albums"])
async def album_detail(artist: str, album: str):
    return await lastfm_service.get_album_detail(artist, album)


@router.get("/artist/{name}", tags=["artists"])
async def artist_detail(name: str):
    return await lastfm_service.get_artist_detail(name)


@router.get("/image-proxy")
async def image_proxy(url: str | None = None):
    FALLBACK_URL = "http://localhost/fallback.jpg"

    try:
        if not url or url.strip() == "":
            raise ValueError("Empty URL")

        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(url)

            if resp.status_code == 200:
                return Response(
                    content=resp.content,
                    media_type=resp.headers.get("content-type", "image/jpeg")
                )
            else:
                raise ValueError("Invalid status")

    except Exception as e:
        print("IMAGE ERROR:", e)

        async with httpx.AsyncClient() as client:
            fallback = await client.get(FALLBACK_URL)

            return Response(
                content=fallback.content,
                media_type="image/jpeg"
            )


class StatusUpdate(BaseModel):
    status: Literal["PLANNED", "LISTENING", "COMPLETED", "DROPPED"]


@router.put("/albums/{album_id}/status")
async def update_album_status(
    album_id: UUID,
    data: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(
        select(UserAlbumStatus).where(
            UserAlbumStatus.user_id == current_user["user_id"],
            UserAlbumStatus.album_id == album_id
        )
    )

    existing = result.scalar_one_or_none()

    if existing:
        existing.status = data.status
    else:
        new_status = UserAlbumStatus(
            user_id=current_user["user_id"],
            album_id=album_id,
            status=data.status
        )
        db.add(new_status)

    await db.commit()

    try:
        await feed_service.log_activity(
            db=db,
            user_id=current_user["user_id"],
            activity_type=ActivityTypes.UPDATE_ALBUM_STATUS,
            album_id=album_id
        )
    except Exception as e:
        print("Feed error:", e)

    return {"status": data.status}
