import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.core.config import settings
from app.models.user import User
from app.models.oauth_account import OAuthAccount
from app.services.auth import create_access_token, create_refresh_token

# Fonctions Google
async def get_google_access_token(code: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": "http://localhost:8000/api/v1/oauth/google/callback",
                "grant_type": "authorization_code",
            }
        )
    data = response.json()
    if "access_token" not in data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible d'obtenir le token Google"
        )
    return data["access_token"]

async def get_google_user_info(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
    data = response.json()
    if "id" not in data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de récupérer le profil Google"
        )
    return data


# Fonctions GitHub
async def get_github_access_token(code: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "code": code,
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
            }
        )
    data = response.json()
    if "access_token" not in data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible d'obtenir le token GitHub"
        )
    return data["access_token"]

async def get_github_user_info(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        # Récupère le profil de base
        profile_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github.v3+json"
            }
        )
        profile = profile_response.json()

        # Si l'email est privé, on le cherche dans /user/emails
        if not profile.get("email"):
            emails_response = await client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            emails = emails_response.json()
            # On prend l'email principal vérifié
            primary_email = next(
                (e["email"] for e in emails if e["primary"] and e["verified"]),
                None
            )
            profile["email"] = primary_email

    if not profile.get("id") or not profile.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de récupérer le profil GitHub"
        )
    return profile


# Logique commune Google + GitHub
async def handle_oauth_user(
    provider: str,
    provider_user_id: str,
    provider_email: str,
    provider_username: str,
    db: AsyncSession
) -> dict:
    result = await db.execute(
        select(OAuthAccount).where(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_user_id == str(provider_user_id)
        )
    )
    oauth_account = result.scalar_one_or_none()

    if oauth_account:
        result = await db.execute(
            select(User).where(User.id == oauth_account.user_id)
        )
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ce compte a été désactivé"
            )
        access_token = create_access_token(user.id, user.role)
        refresh_token = await create_refresh_token(user.id, db)
        return {"access_token": access_token, "refresh_token": refresh_token}

    result = await db.execute(
        select(User).where(User.email == provider_email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        new_oauth = OAuthAccount(
            user_id=existing_user.id,
            provider=provider,
            provider_user_id=str(provider_user_id),
            provider_email=provider_email
        )
        db.add(new_oauth)
        await db.commit()
        access_token = create_access_token(existing_user.id, existing_user.role)
        refresh_token = await create_refresh_token(existing_user.id, db)
        return {"access_token": access_token, "refresh_token": refresh_token}

    base_username = provider_username.lower().replace(" ", "_")[:20]
    username = base_username
    counter = 1
    while True:
        result = await db.execute(
            select(User).where(User.username == username)
        )
        if not result.scalar_one_or_none():
            break
        username = f"{base_username}_{provider}_{counter}"[:20]
        counter += 1

    # Création du compte Resonate sans mot de passe (hashed_password=None) car c'est un compte OAuth
    new_user = User(
        email=provider_email,
        username=username,
        hashed_password=None
    )
    db.add(new_user)
    await db.flush()  # flush pour obtenir l'id sans commit

    new_oauth = OAuthAccount(
        user_id=new_user.id,
        provider=provider,
        provider_user_id=str(provider_user_id),
        provider_email=provider_email
    )
    db.add(new_oauth)
    await db.commit()
    await db.refresh(new_user)

    access_token = create_access_token(new_user.id, new_user.role)
    refresh_token = await create_refresh_token(new_user.id, db)
    return {"access_token": access_token, "refresh_token": refresh_token}