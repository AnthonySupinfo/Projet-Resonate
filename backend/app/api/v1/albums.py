from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
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

    if not album.tracks or len(album.tracks) == 0:
        lastfm_data = await lastfm_service.get_album_detail(
            album.artist_name,
            album.name
        )

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
async def search_albums(q: str = Query(..., description="Nom de l'album à rechercher")):
    return await lastfm_service.search_albums(q)

# 2) Détail d'un album
@router.get("/detail/{artist}/{album}", tags=["albums"])
async def album_detail(artist: str, album: str):
    return await lastfm_service.get_album_detail(artist, album)

# 3) Détail d'un artiste
@router.get("/artist/{name}", tags=["artists"])
async def artist_detail(name: str):
    return await lastfm_service.get_artist_detail(name)

# test temporaire pour vérifier que les routes sont bien intégrées
print(""" \n\n\n\n\n\n\n!!!!!!!!!\n\n\n\n\n!!!!!!!!
      ALBUMS ROUTES LOADED\n\n\n\n!!!!!!!!!\n\n\n\n\n\n!!!!!!!!!""")