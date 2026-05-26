from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.config import settings
from app.services.oauth import (
    get_google_access_token, get_google_user_info,
    get_github_access_token, get_github_user_info,
    handle_oauth_user
)

router = APIRouter(prefix="/oauth", tags=["oauth"])

# GOOGLE
@router.get("/google/login")
async def google_login():
    
    # Redirige vers Google
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        "&response_type=code"
        "&scope=openid email profile"
        f"&redirect_uri=https://localhost/api/v1/oauth/google/callback"
        "&access_type=offline"
    )
    return RedirectResponse(url=google_auth_url)


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):

    # Échange le code contre un access_token Google
    access_token = await get_google_access_token(code)

    # Récupère le profil Google
    user_info = await get_google_user_info(access_token)

    # Gère les 3 cas (reconnexion, liaison, création)
    tokens = await handle_oauth_user(
        provider="google",
        provider_user_id=user_info["id"],
        provider_email=user_info["email"],
        provider_username=user_info.get("name", user_info["email"].split("@")[0]),
        db=db
    )

    # Redirige vers le frontend avec les tokens
    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/oauth/callback?token={tokens['access_token']}&refresh_token={tokens['refresh_token']}"
    )

# GITHUB
@router.get("/github/login")
async def github_login():

    # Redirige vers GitHub
    github_auth_url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        "&scope=user:email"
        f"&redirect_uri=https://localhost/api/v1/oauth/github/callback"
    )
    return RedirectResponse(url=github_auth_url)

@router.get("/github/callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_db)):

    # Échange le code contre un access_token GitHub
    access_token = await get_github_access_token(code)

    # Récupère le profil GitHub
    user_info = await get_github_user_info(access_token)

    # Gère les 3 cas (reconnexion, liaison, création)
    tokens = await handle_oauth_user(
        provider="github",
        provider_user_id=str(user_info["id"]),
        provider_email=user_info["email"],
        provider_username=user_info.get("login", user_info["email"].split("@")[0]),
        db=db
    )

    # Redirige vers le frontend avec les tokens
    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/oauth/callback?token={tokens['access_token']}&refresh_token={tokens['refresh_token']}"
    )