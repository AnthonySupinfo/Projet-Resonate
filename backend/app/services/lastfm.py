import httpx
from fastapi import HTTPException
from app.core.config import settings

from datetime import datetime, timedelta, timezone

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.db.session import AsyncSessionLocal
from app.models.album import Album
from app.models.artist import Artist
from app.models.track import Track
from app.models.album_search_cache import AlbumSearchCache


class LastFMService:
    BASE_URL = "https://ws.audioscrobbler.com/2.0/"

    CACHE_DURATION = timedelta(days=7)

    def __init__(self):
        self.api_key = settings.LASTFM_API_KEY
        if not self.api_key:
            raise RuntimeError("LASTFM_API_KEY is missing in backend/.env")

    async def _request(self, params: dict):
        params["api_key"] = self.api_key
        params["format"] = "json"

        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(self.BASE_URL, params=params)
        except httpx.TimeoutException:
            raise HTTPException(504, "Last.fm ne répond pas (timeout).")

        if response.status_code == 429:
            raise HTTPException(429, "Limite de requêtes Last.fm atteinte.")

        data = response.json()

        if "error" in data:
            raise HTTPException(400, f"Last.fm error: {data.get('message')}")

        return data

    async def search_albums(self, query: str, page: int = 1, limit: int = 30):

        async with AsyncSessionLocal() as session:
            stmt = select(AlbumSearchCache).where(
                AlbumSearchCache.query == query
            )
            result = await session.execute(stmt)
            cache_entry = result.scalar_one_or_none()

            if cache_entry and is_cache_valid(cache_entry.fetched_at):
                return {
                    "query": query,
                    "page": page,
                    "limit": limit,
                    "results": cache_entry.results,
                    "source": "cache"
                }

            # 3 Appel Last.fm
            params = {
                "method": "album.search",
                "album": query,
                "page": page,
                "limit": limit,
            }
            data = await self._request(params)

            albums = data.get("results", {}).get(
                "albummatches", {}).get("album", [])
            if not albums:
                raise HTTPException(404, "Aucun album trouvé.")

            if cache_entry:
                cache_entry.results = albums
                cache_entry.fetched_at = datetime.now(timezone.utc)
            else:
                cache_entry = AlbumSearchCache(
                    query=query,
                    results=albums,
                    fetched_at=datetime.now(timezone.utc),
                )
                session.add(cache_entry)

            await session.commit()

            return {
                "query": query,
                "results": albums,
                "source": "api"
            }

    async def get_album_detail(self, artist: str, album: str):

        async with AsyncSessionLocal() as session:

            stmt = select(Album).options(selectinload(Album.tracks)).where(
                Album.artist_name == artist,
                Album.name == album
            )

            result = await session.execute(stmt)
            db_album = result.scalar_one_or_none()

            if db_album and is_cache_valid(db_album.fetched_at):
                serialized = self._serialize_album(db_album)
                serialized["year"] = db_album.year
                return serialized

            params = {
                "method": "album.getinfo",
                "artist": artist,
                "album": album,
            }
            data = await self._request(params)

            import re

            release_date = (
                data.get("album", {})
                .get("releasedate", "")
                .strip()
            )

            year = None

            if release_date:
                match = re.search(r"\d{4}", release_date)
                if match:
                    year = match.group(0)

            album_info = data.get("album")
            images = album_info.get("image", [])
            cover_image = None

            for img in reversed(images):
                if img.get("#text"):
                    cover_image = img.get("#text")
                    break

            if cover_image:
                cover_image = cover_image.replace("http://", "https://")

            if not album_info:
                raise HTTPException(404, "Album introuvable sur Last.fm.")

            artist_name = album_info.get("artist")

            if artist_name:
                lastfm_artist_url = f"https://www.last.fm/music/{artist_name.replace(' ', '+')}"
            else:
                lastfm_artist_url = None

            stmt = select(Artist).where(Artist.lastfm_url == lastfm_artist_url)
            result = await session.execute(stmt)
            db_artist = result.scalar_one_or_none()

            if db_artist:
                db_artist.name = artist_name
                db_artist.fetched_at = datetime.now(timezone.utc)
            else:
                db_artist = Artist(
                    name=artist_name,
                    lastfm_url=lastfm_artist_url,
                    fetched_at=datetime.now(timezone.utc),
                )
                session.add(db_artist)

            lastfm_album_url = album_info.get("url")

            raw_tags = album_info.get("tags", {})
            if isinstance(raw_tags, dict):
                raw_tags = raw_tags.get("tag", [])
            elif isinstance(raw_tags, str):
                raw_tags = []

            if isinstance(raw_tags, dict):
                raw_tags = [raw_tags]

            tag_names = [t.get("name", "").lower()
                         for t in raw_tags if isinstance(t, dict)]

            stmt = select(Album).where(Album.lastfm_url == lastfm_album_url)
            result = await session.execute(stmt)
            db_album = result.scalar_one_or_none()

            if db_album:
                db_album.name = album_info.get("name")
                db_album.artist_name = artist_name
                db_album.fetched_at = datetime.now(timezone.utc)
                db_album.image = cover_image
                db_album.year = year
                db_album.tags = tag_names
            else:
                db_album = Album(
                    name=album_info.get("name"),
                    artist_name=artist_name,
                    lastfm_url=lastfm_album_url,
                    fetched_at=datetime.now(timezone.utc),
                    image=cover_image,
                    year=year,
                    tags=tag_names,
                )
                session.add(db_album)

            await session.flush()

            await session.execute(
                delete(Track).where(Track.album_id == db_album.id)
            )

            tracks = album_info.get("tracks", {}).get("track", [])

            if isinstance(tracks, dict):
                tracks = [tracks]

            for t in tracks:
                if not isinstance(t, dict):
                    continue

                track = Track(
                    album_id=db_album.id,
                    name=t.get("name"),
                    position=int(t.get("@attr", {}).get("rank")
                                 ) if t.get("@attr") else None,
                    duration=int(t.get("duration")) if t.get(
                        "duration") else None,
                )
                session.add(track)

            await session.commit()
            # données

            stmt = (
                select(Album)
                .options(selectinload(Album.tracks))
                .where(Album.id == db_album.id)
            )

            result = await session.execute(stmt)
            db_album = result.scalar_one()

            serialized = self._serialize_album(db_album)
            serialized["year"] = db_album.year
            return serialized

    async def get_artist_detail(self, name: str):
        async with AsyncSessionLocal() as session:
            params = {
                "method": "artist.getinfo",
                "artist": name,
            }
            data = await self._request(params)

            artist_info = data.get("artist")
            if not artist_info:
                raise HTTPException(404, "Artiste introuvable sur Last.fm.")

            artist_name = artist_info.get("name")
            lastfm_url = artist_info.get("url")

            stmt = select(Artist).where(Artist.lastfm_url == lastfm_url)
            result = await session.execute(stmt)
            db_artist = result.scalar_one_or_none()

            if db_artist and is_cache_valid(db_artist.fetched_at):
                return self._serialize_artist(db_artist)

            if db_artist:
                db_artist.name = artist_name
                db_artist.fetched_at = datetime.now(timezone.utc)
            else:
                db_artist = Artist(
                    name=artist_name,
                    lastfm_url=lastfm_url,
                    fetched_at=datetime.now(timezone.utc),
                )
                session.add(db_artist)

            await session.commit()
            await session.refresh(db_artist)

            return {
                "name": db_artist.name,
                "lastfm_url": db_artist.lastfm_url,
                "fetched_at": db_artist.fetched_at.isoformat(),
                "source": "api"
            }

    def _serialize_album(self, album: Album) -> dict:
        return {
            "id": str(album.id),
            "name": album.name,
            "artist": album.artist_name,
            "lastfm_url": album.lastfm_url,
            "tags": album.tags or [],
            "tracks": [
                {
                    "name": t.name,
                    "position": t.position,
                    "duration": t.duration,
                }
                for t in album.tracks
            ],
            "image": album.image,
            "fetched_at": album.fetched_at.isoformat() if album.fetched_at else None,
        }

    def _serialize_artist(self, artist: Artist) -> dict:
        return {
            "id": str(artist.id),
            "name": artist.name,
            "lastfm_url": artist.lastfm_url,
            "fetched_at": artist.fetched_at.isoformat() if artist.fetched_at else None,
            "source": "cache"
        }

    '''
    async def get_album_year(self, artist: str, album: str):
        params = {
            "method": "album.getinfo",
            "artist": artist,
            "album": album,
        }

        try:
            data = await self._fetch(params)

            release_date = (
                data.get("album", {})
                .get("releasedate", "")
                .strip()
            )

            if release_date:
                import re
                match = re.search(r"\d{4}", release_date)
                if match:
                    return year

        except Exception as e:
        return None
    '''


def is_cache_valid(fetched_at: datetime | None) -> bool:
    if fetched_at is None:
        return False
    return datetime.now(timezone.utc) - fetched_at < LastFMService.CACHE_DURATION


lastfm_service = LastFMService()
