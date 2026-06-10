from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.auth import verify_password, revoke_all_refresh_tokens
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.follow import Follow
from app.models.reviews import Review
from app.models.review_comments import ReviewComment
from app.models.playlist import Playlist
from app.models.user_playlist_item import UserPlaylistItem
from app.models.user_album_status import UserAlbumStatus
from app.schemas.auth import UserProfileResponse, UpdateProfileRequest
import json
import csv
import io
from typing import List
from app.schemas.feed import FeedItemResponse
from app.services.feed import feed_service
from app.schemas.stats import UserStatsResponse
from app.services.stats_service import stats_service



router = APIRouter(prefix="/users", tags=["users"])

# GET /users/me - profil complet de l'utilisateur connecté
@router.get("/me", response_model=UserProfileResponse)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    followers_query = await db.execute(
        select(func.count()).where(Follow.following_id == user.id)
    )
    followers_count = followers_query.scalar() or 0

    following_query = await db.execute(
        select(func.count()).where(Follow.follower_id == user.id)
    )
    following_count = following_query.scalar() or 0

    setattr(user, "followers_count", followers_count)
    setattr(user, "following_count", following_count)

    return user

# PATCH /users/me - modifier le profil
@router.patch("/me", response_model=UserProfileResponse)
async def update_profile(
    data: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()

    # Met à jour uniquement les champs envoyés
    if data.first_name is not None:
        user.first_name = data.first_name
    if data.last_name is not None:
        user.last_name = data.last_name
    if data.birth_date is not None:
        user.birth_date = data.birth_date
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    if data.bio is not None:
        user.bio = data.bio
    if data.website is not None:
        user.website = data.website
    if data.theme is not None:
        user.theme = data.theme
    if data.language is not None:
        user.language = data.language
    if data.email_notifications is not None:
        user.email_notifications = data.email_notifications

    await db.commit()
    await db.refresh(user)
    return user

# DELETE /users/me - supprimer son compte (nécessite le mot de passe actuel)
class DeleteAccountRequest(BaseModel):
    password: str

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(
    data: DeleteAccountRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # Vérification du mot de passe avant suppression (sauf comptes OAuth sans password)
    if user.hashed_password:
        if not verify_password(data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Mot de passe incorrect")

    # Suppression du compte (CASCADE sur les FK supprimera reviews, playlists, etc.)
    await db.delete(user)
    await db.commit()
    return None

# GET /users/me/export (télécharger ses données (RGPD))
# Paramètre optionnel : format=json (défaut) ou format=csv
@router.get("/me/export")
async def export_data(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    format: str = Query(default="json", pattern="^(json|csv)$")
):
    user_id = current_user["user_id"]

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    # Profil de base
    export = {
        "profil": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "birth_date": str(user.birth_date) if user.birth_date else None,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "website": user.website,
            "theme": user.theme,
            "is_active": user.is_active,
            "created_at": str(user.created_at),
        }
    }

    # Critiques 
    reviews_result = await db.execute(
        select(Review).where(Review.user_id == user_id)
    )
    reviews = reviews_result.scalars().all()
    export["critiques"] = [
        {
            "id": r.id,
            "album_id": str(r.album_id),
            "rating": r.rating,
            "content": r.content,
            "posted_at": str(r.posted_at),
            "updated_at": str(r.updated_at),
            "has_been_modified": r.has_been_modified,
        }
        for r in reviews
    ]

    # Commentaires sur des critiques 
    comments_result = await db.execute(
        select(ReviewComment).where(ReviewComment.user_id == user_id)
    )
    comments = comments_result.scalars().all()
    export["commentaires"] = [
        {
            "id": c.id,
            "review_id": c.review_id,
            "content": c.content,
            "created_at": str(c.created_at),
            "has_been_modified": c.has_been_modified,
        }
        for c in comments
    ]

    # Playlists
    playlists_result = await db.execute(
        select(Playlist).where(
            Playlist.user_id == user_id,
            Playlist.deleted_at == None  # noqa: E711
        )
    )
    playlists = playlists_result.scalars().all()

    playlists_export = []
    for pl in playlists:
        # Récupère les tracks de la playlist
        items_result = await db.execute(
            select(UserPlaylistItem).where(UserPlaylistItem.playlist_id == pl.id)
        )
        items = items_result.scalars().all()
        playlists_export.append({
            "id": pl.id,
            "name": pl.name,
            "type": pl.type.value,
            "is_public": pl.is_public,
            "description": pl.description,
            "created_at": str(pl.created_at),
            "tracks": [
                {
                    "track_id": str(item.track_id),
                    "added_at": str(item.added_at),
                }
                for item in items
            ],
        })
    export["playlists"] = playlists_export

    # Statuts d'albums (bibliothèque)
    statuts_result = await db.execute(
        select(UserAlbumStatus).where(UserAlbumStatus.user_id == user_id)
    )
    statuts = statuts_result.scalars().all()
    export["bibliotheque_albums"] = [
        {
            "album_id": str(s.album_id),
            "status": s.status.value,
            "updated_at": str(s.updated_at),
        }
        for s in statuts
    ]

    # Abonnements 
    following_result = await db.execute(
        select(Follow).where(Follow.follower_id == user_id)
    )
    following = following_result.scalars().all()
    export["abonnements"] = [f.following_id for f in following]

    followers_result = await db.execute(
        select(Follow).where(Follow.following_id == user_id)
    )
    followers = followers_result.scalars().all()
    export["abonnes"] = [f.follower_id for f in followers]

    # Retour JSON (défaut)
    if format == "json":
        return export

    # Retour CSV - chaque section devient une feuille aplatie
    # Le CSV contient plusieurs blocs séparés par une ligne vide et un titre de section
    output = io.StringIO()
    writer = csv.writer(output)

    # Section profil
    writer.writerow(["=== PROFIL ==="])
    writer.writerow(export["profil"].keys())
    writer.writerow(export["profil"].values())
    writer.writerow([])

    # Section critiques
    writer.writerow(["=== CRITIQUES ==="])
    if export["critiques"]:
        writer.writerow(export["critiques"][0].keys())
        for r in export["critiques"]:
            writer.writerow(r.values())
    else:
        writer.writerow(["Aucune critique"])
    writer.writerow([])

    # Section commentaires
    writer.writerow(["=== COMMENTAIRES ==="])
    if export["commentaires"]:
        writer.writerow(export["commentaires"][0].keys())
        for c in export["commentaires"]:
            writer.writerow(c.values())
    else:
        writer.writerow(["Aucun commentaire"])
    writer.writerow([])

    # Section playlists (sans les tracks pour garder le CSV lisible)
    writer.writerow(["=== PLAYLISTS ==="])
    if export["playlists"]:
        writer.writerow(["id", "name", "type", "is_public", "description", "created_at", "nb_tracks"])
        for pl in export["playlists"]:
            writer.writerow([
                pl["id"], pl["name"], pl["type"],
                pl["is_public"], pl["description"],
                pl["created_at"], len(pl["tracks"])
            ])
    else:
        writer.writerow(["Aucune playlist"])
    writer.writerow([])

    # Section bibliothèque albums
    writer.writerow(["=== BIBLIOTHEQUE ALBUMS ==="])
    if export["bibliotheque_albums"]:
        writer.writerow(export["bibliotheque_albums"][0].keys())
        for s in export["bibliotheque_albums"]:
            writer.writerow(s.values())
    else:
        writer.writerow(["Aucun album"])
    writer.writerow([])

    # Section abonnements
    writer.writerow(["=== ABONNEMENTS ==="])
    writer.writerow(["user_id"])
    for uid in export["abonnements"]:
        writer.writerow([uid])
    writer.writerow([])

    writer.writerow(["=== ABONNES ==="])
    writer.writerow(["user_id"])
    for uid in export["abonnes"]:
        writer.writerow([uid])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=resonate-mes-donnees.csv"}
    )


@router.get("/me/feed", response_model=List[FeedItemResponse])
async def get_my_feed(
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    """Récupère le fil d'actualités."""

    return await feed_service.get_user_feed(db, current_user["user_id"])


@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(
        user_id: str,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    is_followed = False
    follow_query = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user["user_id"],
            Follow.following_id == user_id
        )
    )

    if follow_query.scalar_one_or_none() is not None:
        is_followed = True

    followers_query = await db.execute(
        select(func.count()).where(Follow.following_id == user_id)
    )
    followers_count = followers_query.scalar() or 0

    following_query = await db.execute(
        select(func.count()).where(Follow.follower_id == user_id)
    )
    following_count = following_query.scalar() or 0

    setattr(user, "is_followed_by_me", is_followed)
    setattr(user, "followers_count", followers_count)
    setattr(user, "following_count", following_count)

    return user


@router.get("/{user_id}/stats", response_model=UserStatsResponse)
async def get_user_statistics(
        user_id: str,
        db: AsyncSession = Depends(get_db)
):
    """Renvoie les statistiques d'un utilisateur"""

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    stats = await stats_service.get_user_stats(db, user_id)

    return stats

# PATCH /users/{user_id}/ban - bannir un utilisateur (admin uniquement)
@router.patch("/{user_id}/ban", status_code=status.HTTP_200_OK)
async def ban_user(
    user_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Un admin ne peut pas se bannir lui-même (anti-lockout)
    if user_id == admin["user_id"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous bannir vous-même")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # On ne bannit pas un autre admin
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Impossible de bannir un administrateur")

    user.is_active = False
    await db.commit()

    # Révoque toutes ses sessions d'authentification (il ne pourra plus rafraîchir son token)
    await revoke_all_refresh_tokens(user_id, db)

    return {"message": "Utilisateur banni", "user_id": user_id}


# PATCH /users/{user_id}/unban (réactiver un utilisateur (admin uniquement))
@router.patch("/{user_id}/unban", status_code=status.HTTP_200_OK)
async def unban_user(
    user_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    user.is_active = True
    await db.commit()

    return {"message": "Utilisateur réactivé", "user_id": user_id}