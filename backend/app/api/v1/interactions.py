from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.core.dependencies import get_current_user
from datetime import datetime, timezone

from app.models.notification import NotificationType
from app.models.reviews import Review
from app.models.review_likes import ReviewLike
from app.models.review_comments import ReviewComment
from app.models.reports import Report
from app.models.user import User
from app.models.album import Album
from app.schemas.review_comments import ReviewCommentCreate, ReviewCommentResponse
from app.schemas.review_likes import ReviewLikeResponse
from app.schemas.reports import ReportCreate, ReportResponse
from app.services.feed import feed_service
from app.models.user_activity_feed import ActivityTypes
from app.services.notification import notification_service
from app.services.email import send_like_email, send_comment_email

router = APIRouter(tags=["interactions"])


async def get_existing_review(review_id: int, db: AsyncSession) -> Review:
    stmt = select(Review).filter(
        Review.id == review_id, Review.deleted_at == None)
    result = await db.execute(stmt)
    review = result.scalars().first()

    if not review:
        raise HTTPException(status_code=404, detail="Review introuvable")
    return review


# Liker une review
@router.post("/reviews/{review_id}/like", response_model=ReviewLikeResponse, status_code=status.HTTP_201_CREATED)
async def like_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    review = await get_existing_review(review_id, db)

    stmt_liked = select(ReviewLike).filter(  # Vérifie que la review a pas déjà été liké
        ReviewLike.review_id == review_id, ReviewLike.user_id == current_user["user_id"])
    result = await db.execute(stmt_liked)
    review_liked = result.scalars().first()

    if review_liked:
        raise HTTPException(
            status_code=409, detail="Vous avez déjà liké cette review")

    new_like = ReviewLike(user_id=current_user["user_id"], review_id=review_id)
    db.add(new_like)

    await db.flush()

    await feed_service.log_activity(
        db=db,
        user_id=current_user["user_id"],
        activity_type=ActivityTypes.LIKE_REVIEW,
        review_id=review_id
    )

    await notification_service.create_notification(
        db=db,
        user_id=review.user_id,
        notification_type=NotificationType.LIKE,
        related_user_id=current_user["user_id"],
        related_review_id=review.id
    )

    await db.commit()
    await db.refresh(new_like)

    # Notif email à l'auteur de la review si il a activé les notifications
    try:
        review_author = await db.get(User, review.user_id)
        liker = await db.get(User, current_user["user_id"])
        album = await db.get(Album, review.album_id)
        if review_author and liker and album and review_author.email_notifications:
            if str(review_author.id) != str(current_user["user_id"]):  # pas de notif si on like sa propre review
                await send_like_email(review_author.email, liker.username, album.name)
    except Exception:
        pass  # Silencieux (l'email ne doit jamais bloquer l'action)

    return new_like


@router.delete("/reviews/{review_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def delete_like(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    review = await get_existing_review(review_id, db)

    stmt_delete_like = select(ReviewLike).filter(
        ReviewLike.review_id == review_id, ReviewLike.user_id == current_user["user_id"])
    result = await db.execute(stmt_delete_like)
    like = result.scalars().first()

    if not like:
        raise HTTPException(
            status_code=404, detail="Vous n'avez pas liké cette review")

    await db.delete(like)
    await db.commit()


@router.post("/reviews/{review_id}/comment", response_model=ReviewCommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    review_id: int,
    body: ReviewCommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    review = await get_existing_review(review_id, db)

    new_comment = ReviewComment(
        user_id=current_user["user_id"], review_id=review_id, content=body.content)

    db.add(new_comment)
    await db.flush()

    await feed_service.log_activity(
        db=db,
        user_id=current_user["user_id"],
        activity_type=ActivityTypes.COMMENT_REVIEW,
        review_id=review_id
    )

    await notification_service.create_notification(
        db=db,
        user_id=review.user_id,
        notification_type=NotificationType.COMMENT,
        related_user_id=current_user["user_id"],
        related_review_id=review.id
    )

    await db.commit()
    await db.refresh(new_comment)

    # Notif email à l'auteur de la review si il a activé les notifications
    try:
        review_author = await db.get(User, review.user_id)
        commenter = await db.get(User, current_user["user_id"])
        album = await db.get(Album, review.album_id)
        if review_author and commenter and album and review_author.email_notifications:
            if str(review_author.id) != str(current_user["user_id"]):  # pas de notif si on commente sa propre review
                await send_comment_email(review_author.email, commenter.username, album.name, body.content)
    except Exception:
        pass  # Silencieux (l'email ne doit jamais bloquer l'action)

    return new_comment


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    stmt_delete_comment = select(ReviewComment).filter(
        ReviewComment.id == comment_id, ReviewComment.deleted_at == None)
    result = await db.execute(stmt_delete_comment)
    comment = result.scalars().first()

    if not comment:
        raise HTTPException(status_code=404, detail="Commentaire introuvable")

    if str(comment.user_id) != str(current_user["user_id"]):
        raise HTTPException(
            status_code=403, detail="Vous n'êtes pas l'auteur de ce commentaire")

    comment.deleted_at = datetime.now(timezone.utc)
    await db.commit()


# Signaler une review
@router.post("/reviews/{review_id}/report", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def report_review(
    review_id: int,
    body: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    review = await get_existing_review(review_id, db)

    # Vérifie que c'est la première fois qu'on signale cette review
    stmt_unique_report = select(Report).filter(
        Report.review_id == review_id, Report.reporter_id == current_user["user_id"])
    result = await db.execute(stmt_unique_report)
    report = result.scalars().first()

    if report:
        raise HTTPException(
            status_code=409, detail="Vous avez déjà signalé cette review")

    new_report = Report(
        reporter_id=current_user["user_id"],
        review_id=review_id,
        reason=body.reason
    )
    db.add(new_report)
    await db.commit()
    await db.refresh(new_report)
    return new_report