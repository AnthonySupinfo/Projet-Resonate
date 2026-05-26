from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.db.session import get_db
from app.models.user_album_status import UserAlbumStatus, MediaStatus
from app.models.album import Album
from app.schemas.user_album_status import UserAlbumStatusCreate, UserAlbumStatusResponse, UserAlbumStatusWithAlbumResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/albums", tags=["library"])

# PUT = pour ajouter ou màj le statut


@router.put("/{album_id}/status", response_model=UserAlbumStatusResponse)
async def upsert_album_status(
    album_id: int,
    body: UserAlbumStatusCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Vérifie que l'album existe
    stmt_album = select(Album).filter(Album.id == album_id)
    result_album = await db.execute(stmt_album)
    album = result_album.scalars().first()

    if not album:
        raise HTTPException(status_code=404, detail="Album introuvable")

    # Chercher un statut existant pour cet user + album
    stmt_existing = select(UserAlbumStatus).filter(
        UserAlbumStatus.user_id == current_user["user_id"], UserAlbumStatus.album_id == album_id)
    result_existing = await db.execute(stmt_existing)
    existing = result_existing.scalars().first()

    if existing:
        existing.status = body.status  # màj
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        new_status = UserAlbumStatus(
            user_id=current_user["user_id"],
            album_id=album_id,
            status=body.status
        )
        db.add(new_status)
        await db.commit()
        await db.refresh(new_status)
        return new_status

# DELETE = retirer de la biblio


@router.delete("/{album_id}/status", status_code=status.HTTP_204_NO_CONTENT)
async def delete_album_status(
    album_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    stmt_existing = select(UserAlbumStatus).filter(
        UserAlbumStatus.user_id == current_user["user_id"], UserAlbumStatus.album_id == album_id)
    result_existing = await db.execute(stmt_existing)
    existing = result_existing.scalars().first()

    if not existing:
        raise HTTPException(
            status_code=404, detail="Cet album n'est pas dans votre bibliothèque.")

    await db.delete(existing)
    await db.commit()


library_router = APIRouter(prefix="/users", tags=["library"])


@library_router.get("/me/library", response_model=list[UserAlbumStatusWithAlbumResponse])
async def get_my_library(
    status: MediaStatus | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = (
        select(UserAlbumStatus)
        .options(joinedload(UserAlbumStatus.album))  # joint l'album
        .filter(UserAlbumStatus.user_id == current_user["user_id"])
    )

    if status:
        query = query.filter(UserAlbumStatus.status == status)

    result = await db.execute(query)
    return result.scalars().all()
