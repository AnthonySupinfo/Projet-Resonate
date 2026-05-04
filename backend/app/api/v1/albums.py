from fastapi import APIRouter, Depends, status
from app.core.dependencies import get_current_user, require_admin

# a supprimer
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from sqlalchemy import select
from app.models.album import Album

router = APIRouter()

# Route publique - pas besoin d'être connecté


@router.get("/albums/{album_id}")
async def get_album(album_id: str):
    return {"album": "...données de l'album"}

# Route protégée - doit être connecté


@router.post("/albums/{album_id}/review")
async def post_review(album_id: str, current_user=Depends(get_current_user)):
    # Si on arrive ici, le token est valide. current_user contient user_id et role.
    return {"message": f"Critique postée par {current_user['user_id']}"}

# Route admin - doit être admin


@router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, admin=Depends(require_admin)):
    return {"message": "Critique supprimée"}
    # Si on arrive ici, l'utilisateur est admin. require_admin a vérifié le rôle et renvoyé une 403 sinon.

# Route de test (A SUPPRIMER)


@router.post("/dev/seed-album", status_code=status.HTTP_201_CREATED)
async def seed_fake_album(db: AsyncSession = Depends(get_db)):
    stmt = select(Album).limit(1)
    result = await db.execute(stmt)
    existing = result.scalars().first()

    if existing:
        return {"message": f"Un album existe déjà avec l'ID {existing.id}"}

    new_album = Album(title="Album Test Backend")
    db.add(new_album)
    await db.commit()
    await db.refresh(new_album)
    return {"message": f"Faux album créé avec succès. Son ID est {new_album.id}"}
