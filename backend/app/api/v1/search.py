from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.sql.functions import concat

from app.db.session import get_db
from app.models.user import User
from app.models.playlist import Playlist
from app.services.lastfm import lastfm_service

router = APIRouter(tags=["search"])


@router.get("/search/albums")
async def search_albums(
    q: str = Query(..., description="Nom de l'album"),
    sort: str = Query("default", description="Tri: name | popularity | date"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1)
):
    limit = min(limit, 50)
    data = await lastfm_service.search_albums(q)

    albums = data.get("results", [])
    source = data.get("source", "unknown")

    if sort == "name":
        albums.sort(key=lambda x: x.get("name", ""))

    elif sort == "popularity":
        albums.sort(key=lambda x: int(x.get("listeners", 0) or 0), reverse=True)

    elif sort == "date":
        albums.sort(key=lambda x: int(x.get("year", 0) or 0), reverse=True)

    start = (page - 1) * limit
    end = start + limit

    paginated = albums[start:end]

    return {
        "results": paginated,
        "page": page,
        "limit": limit,
        "total_count": len(albums),
        "source": source
    }


@router.get("/search/users")
async def search_users(
    q: str = Query(..., description="Nom utilisateur"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(
        or_(
            User.username.ilike(f"%{q}%"),
            User.first_name.ilike(f"%{q}%"),
            User.last_name.ilike(f"%{q}%"),
            concat(User.first_name, ' ', User.last_name).ilike(f"%{q}%")
        )
    )

    result = await db.execute(stmt)
    users = result.scalars().all()

    start = (page - 1) * limit
    end = start + limit

    return {
        "results": [
            {
                "id": str(u.id),
                "username": u.username,
                "first_name": u.first_name,
                "last_name": u.last_name
            }
            for u in users[start:end]
        ],
        "page": page,
        "limit": limit,
        "total_count": len(users)
    }


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