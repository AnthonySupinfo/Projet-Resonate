from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user, require_admin
from app.services.lastfm import lastfm_service

from sqlalchemy import select
from app.models.album import Album
from app.db.session import AsyncSessionLocal
from uuid import UUID

from sqlalchemy.orm import selectinload

router = APIRouter()

# Route publique - pas besoin d'être connecté


@router.get("/albums/{album_id}", tags=["albums"])
async def get_album(album_id: UUID):

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(Album)
            .options(selectinload(Album.tracks))  #  CHARGE LES TRACKS
            .where(Album.id == album_id)
        )

        album = result.scalar_one_or_none()

        if not album:
            return {"error": "Album not found"}

        return {
            "id": str(album.id),
            "name": album.name,
            "artist": album.artist_name,
            "tracks": [
                {
                    "name": t.name,
                    "position": t.position,
                    "duration": t.duration
                }
                for t in album.tracks
            ]
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