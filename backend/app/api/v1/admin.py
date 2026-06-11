from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import List
from app.db.session import get_db
from app.core.dependencies import require_admin
from app.models.reports import Report, ReportStatus
from app.models.reviews import Review
from app.models.user import User
from app.models.album import Album
from app.schemas.reports import ReportResponse

router = APIRouter(prefix="/admin", tags=["admin"])


# GET /admin/reports - liste tous les signalements (admin uniquement)
@router.get("/reports")
async def get_all_reports(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    status_filter: str = "PENDING"
):
    # Récupère tous les signalements avec le @username du signaleur et le lien vers l'album
    stmt = select(Report)
    if status_filter != "ALL":
        try:
            s = ReportStatus[status_filter]
            stmt = stmt.where(Report.status == s)
        except KeyError:
            raise HTTPException(status_code=400, detail="Statut invalide. Valeurs : PENDING, RESOLVED, DISMISSED, ALL")
    stmt = stmt.order_by(Report.created_at.desc())
    result = await db.execute(stmt)
    reports = result.scalars().all()

    enriched = []
    for report in reports:
        reporter = await db.get(User, report.reporter_id)

        # Récupère la review et son album pour construire le lien
        review = await db.get(Review, report.review_id)
        album_artist = None
        album_name = None
        if review:
            album = await db.get(Album, review.album_id)
            if album:
                album_artist = album.artist_name
                album_name = album.name

        # Si c'est un signalement d'utilisateur, récupère son username
        reported_user = None
        if report.reported_user_id:
            reported_user = await db.get(User, report.reported_user_id)

        enriched.append({
            "id": report.id,
            "reporter_id": report.reporter_id,
            "reporter_username": reporter.username if reporter else None,
            "review_id": report.review_id,
            "reported_user_id": report.reported_user_id,
            "reported_username": reported_user.username if reported_user else None,
            "album_artist": album_artist,
            "album_name": album_name,
            "reason": report.reason,
            "status": report.status,
            "created_at": report.created_at,
            "reviewed_by_id": report.reviewed_by_id,
            "resolved_at": report.resolved_at,
        })
    return enriched


# GET /admin/featured - liste toutes les critiques mises en avant
@router.get("/featured")
async def get_featured_reviews(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Récupère toutes les reviews avec is_featured = True avec infos album et auteur
    stmt = select(Review).where(Review.is_featured == True, Review.deleted_at == None)
    result = await db.execute(stmt)
    reviews = result.scalars().all()

    enriched = []
    for review in reviews:
        author = await db.get(User, review.user_id)
        album = await db.get(Album, review.album_id)
        enriched.append({
            "id": review.id,
            "content": review.content,
            "rating": review.rating,
            "author_username": author.username if author else None,
            "author_avatar": author.avatar_url if author else None,
            "album_name": album.name if album else None,
            "album_artist": album.artist_name if album else None,
            "posted_at": review.posted_at,
        })
    return enriched


# PATCH /admin/reports/{report_id}/resolve - résoudre un signalement (supprime la review)
@router.patch("/reports/{report_id}/resolve", response_model=ReportResponse)
async def resolve_report(
    report_id: int,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    #Résout un signalement : la review signalée est supprimée (soft delete).
    report = await db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Signalement introuvable")
    if report.status != ReportStatus.PENDING:
        raise HTTPException(status_code=400, detail="Ce signalement a déjà été traité")

    # Soft delete de la review signalée
    review = await db.get(Review, report.review_id)
    if review and not review.deleted_at:
        review.deleted_at = datetime.now(timezone.utc)

    # Mise à jour du signalement
    report.status = ReportStatus.RESOLVED
    report.reviewed_by_id = admin["user_id"]
    report.resolved_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(report)
    return report


# PATCH /admin/reports/{report_id}/dismiss - rejeter un signalement (contenu conservé)
@router.patch("/reports/{report_id}/dismiss", response_model=ReportResponse)
async def dismiss_report(
    report_id: int,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Rejette un signalement : la review est conservée, le signalement est classé sans suite
    report = await db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Signalement introuvable")
    if report.status != ReportStatus.PENDING:
        raise HTTPException(status_code=400, detail="Ce signalement a déjà été traité")

    report.status = ReportStatus.DISMISSED
    report.reviewed_by_id = admin["user_id"]
    report.resolved_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(report)
    return report


# PATCH /admin/reviews/{review_id}/feature - mettre une critique en coup de cœur
@router.patch("/reviews/{review_id}/feature", status_code=status.HTTP_200_OK)
async def feature_review(
    review_id: int,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Met en avant une critique (coup de cœur) — visible sur la fiche album
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Critique introuvable")
    if review.deleted_at:
        raise HTTPException(status_code=400, detail="Impossible de mettre en avant une critique supprimée")

    # Retire l'ancien coup de cœur du même album s'il existe
    stmt = select(Review).where(
        Review.album_id == review.album_id,
        Review.is_featured == True,
        Review.id != review_id
    )
    result = await db.execute(stmt)
    old_featured = result.scalars().all()
    for old in old_featured:
        old.is_featured = False

    review.is_featured = True
    await db.commit()
    return {"message": "Critique mise en avant", "review_id": review_id}


# PATCH /admin/reviews/{review_id}/unfeature - retirer le coup de cœur
@router.patch("/reviews/{review_id}/unfeature", status_code=status.HTTP_200_OK)
async def unfeature_review(
    review_id: int,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Retire la mise en avant d'une critique
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Critique introuvable")

    review.is_featured = False
    await db.commit()
    return {"message": "Mise en avant retirée", "review_id": review_id}