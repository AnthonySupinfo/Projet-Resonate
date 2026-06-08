from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi.responses import Response
import httpx
from pydantic import BaseModel
from typing import Literal
from uuid import UUID
from app.core.dependencies import get_current_user, require_admin
from app.services.lastfm import lastfm_service

from app.db.session import get_db
from app.models.album import Album
from app.db.session import AsyncSessionLocal
from app.models.track import Track
from app.models.reviews import Review
from app.models.user_album_status import UserAlbumStatus
from app.services.lastfm import lastfm_service
from app.core.dependencies import get_optional_user 
from app.models.user import User




router = APIRouter(tags=["albums"])

# Route publique - pas besoin d'être connecté



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

    # 2 Enrichissement Last.fm si nécessaire
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


    # 3 Moyenne des reviews
    avg_result = await db.execute(
        select(func.avg(Review.rating)).where(
            Review.album_id == album.id
        )
    )

    average_rating = avg_result.scalar()
    average_rating = round(average_rating, 2) if average_rating else None

    # 4 Statut utilisateur (si connecté)
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

    # 5 Tracks (DB prioritaire)
    tracks_data = [
        {
            "name": t.name,
            "position": t.position,
            "duration": t.duration
        }
        for t in album.tracks
    ]

    # fallback si pas en DB
    if not tracks_data and lastfm_data:
        tracks_data = lastfm_data.get("tracks", [])

    # 6 Genres (uniquement via Last.fm)
    genres = lastfm_data.get("tags", []) if lastfm_data else [] 
    '''
    Lastfm ne renvoie pas de genres, sur le API le genre est vide 
    '''

    # 7 Réponse finale
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

        "source": "cache"  # ici c’est cache DB (normal)
    }


# Route protégée - doit être connecté


@router.post("/albums/{album_id}/review", tags=["reviews"])
async def post_review(album_id: str, current_user=Depends(get_current_user)):
    # Si on arrive ici, le token est valide. current_user contient user_id et role.
    return {"message": f"Critique postée par {current_user['user_id']}"}

# Route admin - doit être admin


@router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, admin=Depends(require_admin)):
    return {"message": "Critique supprimée"}
    # Si on arrive ici, l'utilisateur est admin. require_admin a vérifié le rôle et renvoyé une 403 sinon.


# ROUTES LAST.FM (NOUVELLES)

# 1) Recherche d'albums
@router.get("/search", tags=["search"])
async def search_albums(q: str = Query(..., description="Nom de l'album à rechercher"), page: int = Query(1), limit: int = Query(30)):
    return await lastfm_service.search_albums(q, page, limit)

# 2) Détail d'un album
@router.get("/detail/{artist}/{album}", tags=["albums"])
async def album_detail(artist: str, album: str):
    return await lastfm_service.get_album_detail(artist, album)

# 3) Détail d'un artiste
@router.get("/artist/{name}", tags=["artists"])
async def artist_detail(name: str):
    return await lastfm_service.get_artist_detail(name)

# 4) Pour récupérer l'image d'un album (proxy pour contourner les CORS, par le frontend ca ne passe pas donc passe par backend)
@router.get("/image-proxy")
async def image_proxy(url: str | None = None):
    FALLBACK_URL = "http://localhost/fallback.jpg"  # ton image locale

    try:
        # URL invalide ou vide
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

        # fallback LOCAL (ultra important)
        async with httpx.AsyncClient() as client:
            fallback = await client.get(FALLBACK_URL)

            return Response(
                content=fallback.content,
                media_type="image/jpeg"
            )

# 5) Recherche d'autre users (pour le social, ex: suivre un utilisateur)
@router.get("/search/users")
async def search_users(q: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.username.ilike(f"%{q}%"))
        )

        users = result.scalars().all()

        return {
            "results": [
                {
                    "id": str(u.id),
                    "username": u.username,
                }
                for u in users
            ]
        }

# status d'un album pour l'utilisateur connecté (ex: "want_to_listen", "listening", "listened")
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

    return {"status": data.status}

# test temporaire pour vérifier que les routes sont bien intégrées
print(""" \n\n\n\n\n\n\n!!!!!!!!!\n\n\n\n\n!!!!!!!!
      ALBUMS ROUTES LOADED\n\n\n\n!!!!!!!!!\n\n\n\n\n\n!!!!!!!!!""")