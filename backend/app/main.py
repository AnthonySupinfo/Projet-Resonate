import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.config import settings
from app.db.session import engine, Base

# IMPORT DES MODELES (OBLIGATOIRE POUR create_all)
from app.models.album import Album
from app.models.artist import Artist
from app.models.track import Track
from app.models.album_search_cache import AlbumSearchCache
from app.models.playlist import Playlist
from app.models.reviews import Review
from app.models.review_comments import ReviewComment
from app.models.reports import Report
from app.models.user_album_status import UserAlbumStatus
from app.models.user_playlist_status import UserPlaylistStatus
from app.models.user_playlist_item import UserPlaylistItem
from app.models.refresh_token import RefreshToken

# IMPORT DES ROUTERS
from app.api.v1 import auth, oauth, users, albums
from app.api.v1 import library, playlist, reviews, interactions


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("TABLES DETECTED:", Base.metadata.tables.keys())
    await asyncio.sleep(2)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Resonate API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url=None
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Gestion du rate limiting (429 Too Many Requests)
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Trop de requêtes. Réessayez dans quelques instants."}
    )

# Gestion globale des erreurs
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if settings.ENVIRONMENT == "development":
        return JSONResponse(
            status_code=500,
            content={"detail": f"Erreur interne : {str(exc)}"}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "Une erreur interne est survenue"}
    )

# CORS (autoriser uniquement le frontend à accéder à l'API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# ROUTES AUTH
app.include_router(auth.router, prefix="/api/v1")
app.include_router(oauth.router, prefix="/api/v1")

# ROUTES UTILISATEUR
app.include_router(users.router, prefix="/api/v1")

# ROUTES ALBUMS / LAST.FM
app.include_router(albums.router, prefix="/api/v1")

# LES AUTRES ROUTES (PLAYLISTS, REVIEWS, INTERACTIONS)
app.include_router(library.router, prefix="/api/v1")
app.include_router(library.library_router, prefix="/api/v1")
app.include_router(playlist.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(interactions.router, prefix="/api/v1")


# HEALTH CHECK
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "resonate-backend"}