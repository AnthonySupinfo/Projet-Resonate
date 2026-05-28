# backend/app/services/lastfm.py

import httpx
from fastapi import HTTPException
from app.core.config import settings  # charge LASTFM_API_KEY depuis .env

from datetime import datetime, timedelta, timezone

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.db.session import AsyncSessionLocal
from app.models.album import Album
from app.models.artist import Artist
from app.models.track import Track
from app.models.album_search_cache import AlbumSearchCache



class LastFMService: 
    BASE_URL = "https://ws.audioscrobbler.com/2.0/"

    CACHE_DURATION = timedelta(days=7) # durée de validité du cache, ici 7 jours, 
    # on peut ajuster selon les besoins

    def __init__(self): # récupère la clé API depuis les settings et vérifie sa 
        # présence
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

        # Last.fm renvoie souvent les erreurs dans le JSON lui-même
        if "error" in data:
            raise HTTPException(400, f"Last.fm error: {data.get('message')}")

        return data


    async def search_albums(self, query: str): 

      async with AsyncSessionLocal() as session: 
        stmt = select(AlbumSearchCache).where( 
            AlbumSearchCache.query == query
        )
        result = await session.execute(stmt) # execute
        cache_entry = result.scalar_one_or_none() 

        # 2 Cache valide → retour immédiat
        if cache_entry and is_cache_valid(cache_entry.fetched_at): 
            return {
                "query": query, # la requete de recherche d'album
                "results": cache_entry.results, # les albums depuis le cache
                "source": "cache" # indique que les résultats proviennent du cache
            }

        # 3 Appel Last.fm
        params = { 
            "method": "album.search", # méthode de l'API Last.fm pour rechercher
             # des albums
            "album": query, 
        }
        data = await self._request(params) 

        albums = data.get("results", {}).get("albummatches", {}).get("album", [])
        if not albums:
            raise HTTPException(404, "Aucun album trouvé.")

        # 4 UPSERT cache
        if cache_entry: 
            cache_entry.results = albums # remplace les résultats de l'entrée de 
            # cache existante par les nouveaux résultats obtenus de Last.fm
            cache_entry.fetched_at = datetime.now(timezone.utc) 
        else: 
            cache_entry = AlbumSearchCache( # créer la nouvelle entrée de cache 
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
            
            stmt = select(Album).where(
                Album.artist_name == artist,
                Album.name == album
            )

            result = await session.execute(stmt) # pour executer de maniere asynchrone 
            db_album = result.scalar_one_or_none() 

            # 2 Cache valide → retour immédiat
            if db_album and is_cache_valid(db_album.fetched_at): 
                return self._serialize_album(db_album)

            # 3 Cache absent ou périmé → appel Last.fm
            params = {
                "method": "album.getinfo", 
                "artist": artist, 
                "album": album,
            }
            data = await self._request(params) 

            album_info = data.get("album") 
            if not album_info:
                raise HTTPException(404, "Album introuvable sur Last.fm.")

            # 4 UPSERT ARTIST
            artist_name = album_info.get("artist")

            if artist_name:
                lastfm_artist_url = f"https://www.last.fm/music/{artist_name.replace(' ', '+')}"
            else:
                lastfm_artist_url = None

            # UPSERT DOIT TOUJOURS S’EXÉCUTER (PAS DANS ELSE)
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

            # 5 UPSERT ALBUM
            lastfm_album_url = album_info.get("url") 
            
            # chercher avec la bonne clé UNIQUE
            stmt = select(Album).where(Album.lastfm_url == lastfm_album_url)
            result = await session.execute(stmt)
            db_album = result.scalar_one_or_none()

            if db_album:
                db_album.name = album_info.get("name")
                db_album.artist_name = artist_name
                db_album.fetched_at = datetime.now(timezone.utc)
            else:
                db_album = Album(
                    name=album_info.get("name"),
                    artist_name=artist_name,
                    lastfm_url=lastfm_album_url,
                    fetched_at=datetime.now(timezone.utc),
                )
                session.add(db_album)

            await session.flush()  # garantit db_album.id

            # 6 UPSERT TRACKS (delete & recreate)
            await session.execute( 
                delete(Track).where(Track.album_id == db_album.id) 
            )

            tracks = album_info.get("tracks", {}).get("track", []) 

            for t in tracks: 
                track = Track( # créer une nouvelle instance de Track avec les données 
                    # de la track obtenue de Last.fm 
                    album_id=db_album.id,
                    name=t.get("name"),
                    position=int(t.get("@attr", {}).get("rank")) if t.get("@attr") else None, 
                    duration=int(t.get("duration")) if t.get("duration") else None, 
                )
                session.add(track)

            await session.commit() # enregistre les modifications dans la base de 
            # données
            await session.refresh(db_album) # rafraîchit l'instance de l'album pour 
            # obtenir les données mises à jour

            return self._serialize_album(db_album) 

    async def get_artist_detail(self, name: str): # fonction async
        """
        Détails d’un artiste avec Smart Cache BDD.
        """

        
        async with AsyncSessionLocal() as session:

                # 1 appel Last.fm DIRECT AVANT
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

                # 2 chercher avec clé UNIQUE 
                stmt = select(Artist).where(Artist.lastfm_url == lastfm_url)
                result = await session.execute(stmt)
                db_artist = result.scalar_one_or_none()

                # 3 cache valide
                if db_artist and is_cache_valid(db_artist.fetched_at):
                    return self._serialize_artist(db_artist)

                # 4 UPSERT propre
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
        return { # retourne un dictionnaire avec les informations de l'album 
            # formatées 
            "id": str(album.id),
            "name": album.name,
            "artist": album.artist_name,
            "lastfm_url": album.lastfm_url,
            "fetched_at": album.fetched_at.isoformat() if album.fetched_at else None,
            "source": "cache"
        }
    
    def _serialize_artist(self, artist: Artist) -> dict: # méthode privée pour 
        # formater les données de l'artiste de manière cohérente
        return {
            "id": str(artist.id),
            "name": artist.name,
            "lastfm_url": artist.lastfm_url,
            "fetched_at": artist.fetched_at.isoformat() if artist.fetched_at else None,
            "source": "cache"
        }
    


def is_cache_valid(fetched_at: datetime | None) -> bool: 
    if fetched_at is None:
        return False
    return datetime.now(timezone.utc) - fetched_at < LastFMService.CACHE_DURATION



# Instance réutilisable dans les routes FastAPI
lastfm_service = LastFMService()
