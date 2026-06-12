from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.sql.functions import concat

from app.db.session import get_db
from app.models.user import User
from app.models.playlist import Playlist
from app.services.lastfm import lastfm_service
from app.models.album import Album as AlbumModel

router = APIRouter(tags=["search"])


@router.get("/search/albums")
async def search_albums(
    q: str = Query(..., description="Nom de l'album"),
    sort: str = Query("default", description="Tri: name | popularity | date"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    year_min: int = Query(None),
    year_max: int = Query(None),
    genre: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    limit = min(limit, 50)
    data = await lastfm_service.search_albums(q)
    albums = data.get("results", [])

    album_keys = [(a.get("name"), a.get("artist")) for a in albums]

    stmt = select(AlbumModel).where(
        or_(*[
            (AlbumModel.name == name) & (AlbumModel.artist_name == artist)
            for name, artist in album_keys if name and artist
        ])
    )

    result = await db.execute(stmt)
    db_albums = {(a.name, a.artist_name): a for a in result.scalars().all()}

    enriched = []
    for album in albums:
        key = (album.get("name"), album.get("artist"))
        db_album = db_albums.get(key)

        album["year"] = db_album.year if db_album else None
        album["tags"] = db_album.tags if db_album else []

        enriched.append(album)

    if year_min:
        enriched = [a for a in enriched if a.get(
            "year") and int(a["year"]) >= year_min]
    if year_max:
        enriched = [a for a in enriched if a.get(
            "year") and int(a["year"]) >= year_max]

    if genre:
        g = genre.lower()
        enriched = [
            a for a in enriched
            if g in [str(t).lower() for t in (a.get("tags") or [])]
            if g in a.get("name", "").lower()
            or g in a.get("artist", "").lower()
        ]

    if sort == "name" or sort == "az":
        enriched.sort(key=lambda x: x.get("name", ""))

    elif sort == "za":
        enriched.sort(key=lambda x: x.get("name", ""), reverse=True)

    elif sort == "popularity":
        enriched.sort(key=lambda x: int(
            x.get("listeners", 0) or 0), reverse=True)

    elif sort == "date":
        enriched.sort(key=lambda x: int(x.get("year", 0) or 0), reverse=True)

    start = (page - 1) * limit
    end = start + limit

    paginated = enriched[start:start + limit]

    return {
        "results": paginated,
        "page": page,
        "limit": limit,
        "total_count": len(enriched),
        "source": data.get("source", "unknown")
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
