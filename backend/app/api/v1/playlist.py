from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy import select, func
from uuid import uuid4
from uuid import UUID
from app.db.session import get_db
from app.models.playlist import Playlist, PlaylistType
from app.models.user_playlist_item import UserPlaylistItem
from app.models.track import Track
from app.schemas.playlist import PlaylistCreate, PlaylistResponse, PlaylistUpdate
from app.core.dependencies import get_current_user
from app.schemas.user_playlist_item import PlaylistItemAdd, PlaylistItemResponse
from app.services.feed import feed_service
from app.models.user_activity_feed import ActivityTypes
from app.models.album import Album
from app.schemas.playlist import ToggleFavoriteTrack

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

    await db.flush()

    await feed_service.log_activity(
        db=db,
        user_id=current_user["user_id"],
        activity_type=ActivityTypes.CREATE_PLAYLIST,
        playlist_id=new_playlist.id
    )

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

    if body.is_favorite is not None:
        existing.is_favorite = body.is_favorite

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

# Récupère toutes les playlists d'un user connecté


@router.get("/me", response_model=list[PlaylistResponse])
async def get_my_playlist(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    stmt_my_playlists = select(Playlist).filter(
        Playlist.user_id == current_user["user_id"], Playlist.deleted_at == None).order_by(Playlist.created_at.desc())
    result = await db.execute(stmt_my_playlists)
    playlists = result.scalars().all()

    for p in playlists:
        stmt_count = select(func.count()).where(
            UserPlaylistItem.playlist_id == p.id)
        count = await db.scalar(stmt_count)
        setattr(p, "track_count", count or 0)

    return playlists


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

    stmt_count = select(func.count()).where(
        UserPlaylistItem.playlist_id == playlist_id)
    track_count = await db.scalar(stmt_count)

    setattr(existing, "track_count", track_count or 0)

    stmt_tracks = select(Track).join(
        UserPlaylistItem,
        UserPlaylistItem.track_id == Track.id
    ).where(
        UserPlaylistItem.playlist_id == playlist_id
    ).options(joinedload(Track.album))

    result_tracks = await db.execute(stmt_tracks)
    tracks = result_tracks.scalars().all()

    setattr(existing, "tracks", tracks)

    return existing


@router.post("/{playlist_id}/tracks", response_model=PlaylistItemResponse, status_code=status.HTTP_201_CREATED)
async def add_track_playlist(
    playlist_id: int,
    body: PlaylistItemAdd,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    existing = await check_playlist_exist_and_owner(playlist_id, current_user["user_id"], db)

    stmt_track_existing = select(Track).filter(Track.name == body.track_id)
    result_track_existing = await db.execute(stmt_track_existing)
    track_existing = result_track_existing.scalars().first()


    if not track_existing:
        # récupérer un album existant
        stmt_album = select(Album).limit(1)
        result_album = await db.execute(stmt_album)
        album = result_album.scalars().first()
        artist = body.artist


        if not album:
            album = Album(
                id=uuid4(),
                name="Unknown Album"
            )
            db.add(album)
            await db.flush()


        if not album:
            raise HTTPException(status_code=500, detail="Aucun album en base")

        track_existing = Track(
            id=uuid4(),
            name=body.track_name,
            artist=artist,
            album_id=album.id  # FIX IMPORTANT
        )
        db.add(track_existing)
        await db.flush()

    else:
        # IMPORTANT : mettre à jour l'artiste si absent
        if not track_existing.artist and body.artist:
            track_existing.artist = body.artist
            await db.flush()


    stmt_track_playlist = select(UserPlaylistItem).filter(
        UserPlaylistItem.playlist_id == playlist_id, UserPlaylistItem.track_id == track_existing.id)
    result_track_playlist = await db.execute(stmt_track_playlist)
    track_playlist = result_track_playlist.scalars().first()

    if track_playlist:
        raise HTTPException(
            status_code=409, detail="Cette track est déjà dans la playlist")

    new_item = UserPlaylistItem(
        playlist_id=playlist_id, track_id=track_existing.id)

    db.add(new_item)

    try:
        await feed_service.log_activity(
            db=db,
            user_id=current_user["user_id"],
            activity_type=ActivityTypes.ADD_TRACK_PLAYLIST,
            playlist_id=playlist_id,
            track_id=track_existing.id
        )
    except Exception as e:
        print("Feed error:", e)

    await db.commit()
    await db.refresh(new_item)
    return new_item


@router.delete("/{playlist_id}/tracks/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_track_playlist(
    playlist_id: int,
    track_id: UUID,
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

# TOFIX : toggle favoris (ajout/suppression d'une track dans la playlist favoris)
@router.post("/favorites/toggle", status_code=200)
async def toggle_favorite_track(
    body: ToggleFavoriteTrack,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    print("\n===== TOGGLE FAVORITE CALLED =====")
    print("BODY:", body)
    print("USER:", current_user)

    # 1. FIND FAVORITES PLAYLIST
    stmt_fav = select(Playlist).filter(
        Playlist.user_id == current_user["user_id"],
        Playlist.is_favorite == True,
        Playlist.deleted_at == None
    )
    result_fav = await db.execute(stmt_fav)
    fav_playlist = result_fav.scalars().first()

    # 2. PROTECTION : la playlist favoris doit exister (créée à l'inscription)
    if not fav_playlist:
        raise Exception("Favorites playlist should already exist")


    print("USING PLAYLIST:", fav_playlist.id)

    # 3. FIND TRACK (FIX IMPORTANT)
    stmt_track = select(Track).filter(Track.name == body.track_name, Track.artist == body.artist)
    result_track = await db.execute(stmt_track)
    track = result_track.scalars().first()

    if not track:
        print("CREATE TRACK")

        stmt_album = select(Album).limit(1)
        result_album = await db.execute(stmt_album)
        album = result_album.scalars().first()

        if not album:
            album = Album(id=uuid4(), name="Unknown Album")
            db.add(album)
            await db.flush()

        track = Track(
            id=uuid4(),
            name=body.track_name,
            artist=body.artist,
            album_id=album.id
        )

        db.add(track)
        await db.flush()

    # 4. CHECK EXISTING ITEM
    stmt_item = select(UserPlaylistItem).filter(
        UserPlaylistItem.playlist_id == fav_playlist.id,
        UserPlaylistItem.track_id == track.id
    )
    result_item = await db.execute(stmt_item)
    existing = result_item.scalars().first()

    if existing:
        print("REMOVE FROM FAVORITES")
        await db.delete(existing)
        status = "removed"
    else:
        print("ADD TO FAVORITES")
        db.add(UserPlaylistItem(
            playlist_id=fav_playlist.id,
            track_id=track.id
        ))
        status = "added"

    # SEUL COMMIT ICI
    await db.commit()

    print("FINAL COMMIT DONE")

    # DEBUG FINAL (va maintenant s’exécuter !)
    stmt_check = select(Playlist).where(
        Playlist.user_id == current_user["user_id"]
    )
    res_check = await db.execute(stmt_check)
    print("DB PLAYLISTS AFTER:", res_check.scalars().all())

    return {"status": status}



@router.get("/user/{target_user_id}", response_model=list[PlaylistResponse])
async def get_target_user_playlist(
        target_user_id: str,
        db: AsyncSession = Depends(get_db)
):
    """Récupère uniquement les playlists publiques d'un utilisateur spécifique."""
    stmt = select(Playlist).filter(
        Playlist.user_id == target_user_id,
        Playlist.is_public == True,
        Playlist.deleted_at == None
    ).order_by(Playlist.created_at.desc())

    result = await db.execute(stmt)
    return result.scalars().all()
