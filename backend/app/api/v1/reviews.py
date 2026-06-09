from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.review_likes import ReviewLike
from uuid import UUID

from app.db.session import get_db
from app.models.reviews import Review
from app.models.album import Album
from app.models.user import User
from app.models import ReviewComment

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
    album_id: UUID,
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
        Review.user_id == current_user["user_id"],
        Review.album_id == album_id,
        Review.parent_id == None,  # IMPORTANT
        Review.deleted_at == None
    )
    result_user_review = await db.execute(stmt_user_review)
    user_review = result_user_review.scalars().first()

    if user_review:
        raise HTTPException(
            status_code=409, detail="Vous avez déjà posté une review pour cet album")

    new_review = Review(
        user_id=current_user["user_id"],
        album_id=album_id,
        rating=body.rating,
        content=body.content,
        parent_id=body.parent_id
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

    stmt_user = select(User).where(User.id == current_user["user_id"])
    result_user = await db.execute(stmt_user)
    user = result_user.scalars().first()

    await db.refresh(new_review)
    return {
        "id": new_review.id,
        "user_id": new_review.user_id,
        "album_id": new_review.album_id,
        "rating": new_review.rating,
        "content": new_review.content,
        "posted_at": new_review.posted_at,
        "updated_at": new_review.updated_at,
        "has_been_modified": new_review.has_been_modified,

        "username": user.username,
        "avatar_url": user.avatar_url,
        "likes_count": 0,
        "user_liked": False,
        "replies": []
    }



@router.patch("/reviews/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    body: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        print(" UPDATE CALLED:", review_id)

        review = await check_review_exist_and_owner(review_id, current_user["user_id"], db)

        if not review:
            print(" Review not found")
            raise HTTPException(status_code=404)

        if review.user_id != current_user["user_id"]:
            print(" Unauthorized user")
            raise HTTPException(status_code=403)

        # UPDATE PROPRE
        if body.rating is not None:
            review.rating = body.rating

        if body.content is not None:
            review.content = body.content

        review.has_been_modified = True
        review.updated_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(review)

        print(" REVIEW UPDATED IN DB:", review.id)

        # récupérer user
        stmt_user = select(User).where(User.id == review.user_id)
        user_result = await db.execute(stmt_user)
        user_obj = user_result.scalar_one()

        # likes_count
        likes_count = await db.scalar(
            select(func.count()).where(ReviewLike.review_id == review.id)
        )

        # user_liked
        stmt_like = select(ReviewLike).where(
            ReviewLike.review_id == review.id,
            ReviewLike.user_id == current_user["user_id"]
        )
        result_like = await db.execute(stmt_like)
        user_liked = result_like.scalars().first() is not None

        response = {
            "id": review.id,
            "user_id": review.user_id,
            "album_id": review.album_id,
            "rating": review.rating,
            "content": review.content,
            "has_been_modified": review.has_been_modified,
            "posted_at": review.posted_at,
            "updated_at": review.updated_at,
            "username": user_obj.username,
            "avatar_url": user_obj.avatar_url,

            "likes_count": likes_count,
            "user_liked": user_liked,

            "replies": [],
            "comments": []
        }

        print(" UPDATE RESPONSE:", response)

        return response

    except Exception as e:
        print(" UPDATE ERROR:", e)
        raise

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
    album_id: UUID,
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
    
    reviews_data = []

    rows = result_album.all()

    print("TOTAL REVIEWS RAW:", len(rows))

    for row in rows:
        review_obj = row[0]
        username = row[1]
        avatar_url = row[2]

        print("PROCESS REVIEW ID:", review_obj.id)

        # COUNT LIKES
        likes_count = await db.scalar(
            select(func.count()).where(ReviewLike.review_id == review_obj.id)
        )

        # USER LIKE
        stmt_user_like = select(ReviewLike).where(
            ReviewLike.review_id == review_obj.id,
            ReviewLike.user_id == current_user["user_id"]
        )
        result_user_like = await db.execute(stmt_user_like)
        user_liked = result_user_like.scalars().first() is not None

        # REPLIES
        stmt_replies = (
            select(Review, User.username, User.avatar_url)
            .join(User, Review.user_id == User.id)
            .where(Review.parent_id == review_obj.id)
        )
        result_replies = await db.execute(stmt_replies)

        formatted_replies = []
        for reply in result_replies.all():
            reply_obj = reply[0]
            reply_username = reply[1]
            reply_avatar = reply[2]

            formatted_replies.append({
                "id": reply_obj.id,
                "content": reply_obj.content,
                "username": reply_username,
                "avatar_url": reply_avatar,
                "posted_at": reply_obj.posted_at
            })

        # COMMENTS
        stmt_comments = (
            select(ReviewComment, User.username)
            .join(User, ReviewComment.user_id == User.id)
            .where(ReviewComment.review_id == review_obj.id)
        )
        result_comments = await db.execute(stmt_comments)

        formatted_comments = []
        for comment_row in result_comments.all():
            comment = comment_row[0]
            username_comment = comment_row[1]

            formatted_comments.append({
                "id": comment.id,
                "content": comment.content,
                "user_id": comment.user_id,
                "username": username_comment
            })

        # FINAL
        review_data = {
            "id": review_obj.id,
            "user_id": review_obj.user_id,
            "album_id": review_obj.album_id,
            "rating": review_obj.rating,
            "content": review_obj.content,
            "has_been_modified": review_obj.has_been_modified,
            "posted_at": review_obj.posted_at,
            "updated_at": review_obj.updated_at,
            "username": username,
            "avatar_url": avatar_url,

            "likes_count": likes_count,
            "user_liked": user_liked,
            "replies": formatted_replies,
            "comments": formatted_comments
        }

        print("ADDING REVIEW:", review_data["id"])

        print("---- REVIEW DEBUG ----")
        print("REVIEW ID:", review_obj.id)
        print("LIKES COUNT:", likes_count)
        print("USER LIKED:", user_liked)
        print("----------------------")

        reviews_data.append(review_data)

    print("FINAL REVIEWS SENT:", len(reviews_data))
    print("FINAL RESPONSE SENT:", reviews_data)

    return reviews_data

