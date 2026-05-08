from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.db.session import engine, Base
from app.api.v1 import auth, oauth, users

from app.api.v1 import library
from app.api.v1 import playlist
from app.api.v1 import interactions
from app.api.v1 import reviews
from app.api.v1 import follows

# Création de la session de base de données et des tables au démarrage de l'application


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

# Application
app = FastAPI(
    title="Resonate API",
    version="1.0.0",
    lifespan=lifespan,
    # Afficher la documentation Swagger uniquement en développement
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url=None
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

# CORS - autoriser uniquement le frontend à accéder à l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes d'authentification classique (email/password)
app.include_router(auth.router, prefix="/api/v1")

# Routes d'authentification OAuth (Google, GitHub)
app.include_router(oauth.router, prefix="/api/v1")

# Routes pour la gestion du profil utilisateur (Settings)
app.include_router(users.router, prefix="/api/v1")

# Route de santé pour vérifier que le backend est opérationnel


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "resonate-backend"}


app.include_router(library.router, prefix="/api/v1")
app.include_router(library.library_router, prefix="/api/v1")

app.include_router(playlist.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(interactions.router, prefix="/api/v1")

app.include_router(follows.router, prefix="/api/v1")
