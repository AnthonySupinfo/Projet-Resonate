from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.playlist import Playlist
from app.services.lastfm import lastfm_service

router = APIRouter(tags=["search"])


# 1 SEARCH ALBUMS (Last.fm + pagination)

@router.get("/search/albums")
async def search_albums(
    q: str = Query(..., description="Nom de l'album"),
    sort: str = Query("default", description="Tri: name | popularity | date"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1)
):
    # sécurité (limite max)
    limit = min(limit, 50)

    # appel API Last.fm (via ton service avec cache)
    data = await lastfm_service.search_albums(q)

    # récupérer la bonne liste
    albums = data.get("results", [])
    source = data.get("source", "unknown")

    # TRI 
    if sort == "name":
        albums.sort(key=lambda x: x.get("name", ""))

    elif sort == "popularity":
        # Last.fm ne donne pas une vraie popularité fiable → fallback
        albums.sort(key=lambda x: int(x.get("listeners", 0) or 0), reverse=True)

    elif sort == "date":
        # souvent pas dispo → fallback
        albums.sort(key=lambda x: int(x.get("year", 0) or 0), reverse=True)

    # pagination
    start = (page - 1) * limit
    end = start + limit

    paginated = albums[start:end]

    # réponse finale
    return {
        "results": paginated,
        "page": page,
        "limit": limit,
        "total_count": len(albums),
        "source": source
    }



# 2 SEARCH USERS (BDD)
@router.get("/search/users")
async def search_users(
    q: str = Query(..., description="Nom utilisateur"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(
        User.username.ilike(f"%{q}%")
    )

    result = await db.execute(stmt)
    users = result.scalars().all()

    start = (page - 1) * limit
    end = start + limit

    return {
        "results": users[start:end],
        "page": page,
        "limit": limit,
        "total_count": len(users)
    }


# 3 SEARCH PLAYLISTS (publiques uniquement)
@router.get("/search/lists")
async def search_lists(
    q: str = Query(..., description="Nom playlist"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Playlist).where(
        Playlist.is_public == True,
        Playlist.name.ilike(f"%{q}%")
    )

    result = await db.execute(stmt)
    playlists = result.scalars().all()

    start = (page - 1) * limit
    end = start + limit

    return {
        "results": playlists[start:end],
        "page": page,
        "limit": limit,
        "total_count": len(playlists)
    }

'''
Le tri par popularité et date est un peu compliqué car Last.fm ne fournit pas de 
données fiables à ce sujet. J'ai utilisé des champs comme "listeners" pour la popularité 
et "year" pour la date, mais ce n'est pas parfait. Si tu veux vraiment du tri fiable, 
il faudrait peut-être envisager une autre source de données ou un système de notation 
interne.
'''