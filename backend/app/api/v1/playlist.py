from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.playlist import Playlist, PlaylistType
from app.models.user_playlist_item import UserPlaylistItem
# from app.models.track import Track
from app.schemas.playlist import PlaylistCreate, PlaylistResponse, PlaylistUpdate
from app.core.dependencies import get_current_user
from app.schemas.user_playlist_item import PlaylistItemAdd, PlaylistItemResponse

from datetime import datetime, timezone

router = APIRouter(prefix="/playlists", tags=["playlists"])


async def check_playlist_exist_and_owner(  # Fonction utilitaire :
        playlist_id: int, user_id: str, db: AsyncSession) -> Playlist:
    """Récupère une playlist et vérifie que l'user en est le propriétaire"""
    stmt_existing = select(Playlist).filter(
        Playlist.id == playlist_id, Playlist.deleted_at == None)
    result_existing = await db.execute(stmt_existing)
    existing = result_existing.scalars().first()

    if not existing:
        raise HTTPException(status_code=404, detail="Playlist introuvable")

    if str(user_id) != str(existing.user_id):
        raise HTTPException(
            status_code=403, detail="Cette playlist ne vous appartient pas. Vous ne pouvez pas la modifier")

    return existing


@router.post("/", response_model=PlaylistResponse, status_code=status.HTTP_201_CREATED)
async def create_playlist(
    body: PlaylistCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    new_playlist = Playlist(
        user_id=current_user["user_id"],
        name=body.name,
        type=PlaylistType.CUSTOM,
        description=body.description,
        is_public=body.is_public
    )
    db.add(new_playlist)
    await db.commit()
    await db.refresh(new_playlist)
    return new_playlist


@router.patch("/{playlist_id}", response_model=PlaylistResponse)
async def update_playlist(
    playlist_id: int,
    body: PlaylistUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    existing = await check_playlist_exist_and_owner(playlist_id, current_user["user_id"], db)

    if body.name is not None:
        existing.name = body.name
    if body.description is not None:
        existing.description = body.description
    if body.is_public is not None:
        existing.is_public = body.is_public

    await db.commit()
    await db.refresh(existing)
    return existing


@router.delete("/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_playlist(
    playlist_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    existing = await check_playlist_exist_and_owner(playlist_id, current_user["user_id"], db)

    existing.deleted_at = datetime.now(timezone.utc)

    await db.commit()


@router.get("/{playlist_id}", response_model=PlaylistResponse)
async def get_playlist_id(
    playlist_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    stmt_existing = select(Playlist).filter(
        Playlist.id == playlist_id, Playlist.deleted_at == None)
    result_existing = await db.execute(stmt_existing)
    existing = result_existing.scalars().first()

    if not existing:
        raise HTTPException(status_code=404, detail="Playlist introuvable")

    if not existing.is_public and str(existing.user_id) != str(current_user["user_id"]):
        raise HTTPException(
            status_code=403, detail="Cette playlist est privée")

    return existing


@router.post("/{playlist_id}/tracks", response_model=PlaylistItemResponse, status_code=status.HTTP_201_CREATED)
async def add_track_playlist(
    playlist_id: int,
    body: PlaylistItemAdd,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    existing = await check_playlist_exist_and_owner(playlist_id, current_user["user_id"], db)

    # TODO : décommenter quand Krishna aura codé la table track
    # stmt_track_existing = select(Track).filter(Track.id == body.track_id)
    # result_track_existing = await db.execute(stmt_track_existing)
    # track_existing = result_track_existing.scalars().first()

    # if not track_existing:
    #    raise HTTPException(status_code=404, detail="Track introuvable")

    stmt_track_playlist = select(UserPlaylistItem).filter(
        UserPlaylistItem.playlist_id == playlist_id, UserPlaylistItem.track_id == body.track_id)
    result_track_playlist = await db.execute(stmt_track_playlist)
    track_playlist = result_track_playlist.scalars().first()

    if track_playlist:
        raise HTTPException(
            status_code=409, detail="Cette track est déjà dans la playlist")

    new_item = UserPlaylistItem(
        playlist_id=playlist_id, track_id=body.track_id)

    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    return new_item


@router.delete("/{playlist_id}/tracks/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_track_playlist(
    playlist_id: int,
    track_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    existing = await check_playlist_exist_and_owner(playlist_id, current_user["user_id"], db)

    stmt_item_playlist = select(UserPlaylistItem).filter(
        UserPlaylistItem.playlist_id == playlist_id, UserPlaylistItem.track_id == track_id)
    result_item_playlist = await db.execute(stmt_item_playlist)
    item_playlist = result_item_playlist.scalars().first()

    if not item_playlist:
        raise HTTPException(
            status_code=404, detail="Cette track n'est pas dans votre playlist")

    await db.delete(item_playlist)
    await db.commit()
