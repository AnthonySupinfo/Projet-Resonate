from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models.reviews import Review
from app.models.album import Album
from app.models.user import User

# from app.models.user_activity_feed import UserActivityFeed, ActivityType
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse
from app.core.dependencies import get_current_user

from app.services.feed import feed_service
from app.models.user_activity_feed import ActivityTypes

from datetime import datetime, timezone

router = APIRouter(tags=["reviews"])


async def check_review_exist_and_owner(
        review_id: int, user_id: str, db: AsyncSession) -> Review:
    """Récupère une review et vérifie que l'user en est l'auteur."""
    stmt_existing = select(Review).filter(
        Review.id == review_id, Review.deleted_at == None)
    result_existing = await db.execute(stmt_existing)
    existing = result_existing.scalars().first()

    if not existing:
        raise HTTPException(status_code=404, detail="Review introuvable")

    if str(user_id) != str(existing.user_id):
        raise HTTPException(
            status_code=403, detail="Cette review ne vous appartient pas. Vous ne pouvez pas la modifier")

    return existing


@router.post("/albums/{album_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    album_id: int,
    body: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    stmt_album = select(Album).filter(Album.id == album_id)
    result_album = await db.execute(stmt_album)
    album = result_album.scalars().first()

    if not album:
        raise HTTPException(status_code=404, detail="Album introuvable")

    stmt_user_review = select(Review).filter(
        Review.user_id == current_user["user_id"], Review.album_id == album_id, Review.deleted_at == None)
    result_user_review = await db.execute(stmt_user_review)
    user_review = result_user_review.scalars().first()

    if user_review:
        raise HTTPException(
            status_code=409, detail="Vous avez déjà posté une review pour cet album")

    new_review = Review(
        user_id=current_user["user_id"],
        album_id=album_id,
        rating=body.rating,
        content=body.content
    )
    db.add(new_review)
    await db.flush()  # flush pour obtenir l'id avant le commit

    await feed_service.log_activity(
        db=db,
        user_id=current_user["user_id"],
        activity_type=ActivityTypes.REVIEW_ALBUM,
        review_id=new_review.id,
        album_id=new_review.album_id
    )

    await db.refresh(new_review)
    return new_review


@router.patch("/reviews/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    body: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    review = await check_review_exist_and_owner(review_id, current_user["user_id"], db)

    if body.rating is not None:
        review.rating = body.rating
    if body.content is not None:
        review.content = body.content

    review.has_been_modified = True
    review.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(review)
    return review


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    review = await check_review_exist_and_owner(review_id, current_user["user_id"], db)

    review.deleted_at = datetime.now(timezone.utc)

    await db.commit()


@router.get("/albums/{album_id}/reviews", response_model=list[ReviewResponse])
async def get_album_reviews(
    album_id: int,
    page: int = 1,
    limit: int = 10,  # Nombre de reviews/pages
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    stmt_album = (
        select(Review, User.username, User.avatar_url)
        .join(User, Review.user_id == User.id)
        .where(Review.album_id == album_id, Review.deleted_at == None)
        .order_by(Review.posted_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result_album = await db.execute(stmt_album)
    album = reviews_data = []

    for row in result_album.all():
        review_obj = row[0]
        username = row[1]
        avatar_url = row[2]

        reviews_data.append({
            "id": review_obj.id,
            "user_id": review_obj.user_id,
            "album_id": review_obj.album_id,
            "rating": review_obj.rating,
            "content": review_obj.content,
            "has_been_modified": review_obj.has_been_modified,
            "posted_at": review_obj.posted_at,
            "updated_at": review_obj.updated_at,
            "username": username,
            "avatar_url": avatar_url
        })
    return reviews_data
