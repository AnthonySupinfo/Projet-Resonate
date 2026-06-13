import { useState, useEffect } from 'react';
import StarRating from '../StarRating/StarRating';
import { reviewsService } from '../../../api/reviews.service';
import './ReviewCard.css';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import iconLiked from '../../../../public/icons/likeLiked.png';
import iconNotLiked from '../../../../public/icons/likeNotLiked.png';
import iconSignal from "../../../../public/icons/signal.png";

export default function ReviewCard({ review, onReviewDeleted, onReviewUpdated }) {
    const { user } = useAuth();
    const { t } = useLanguage();
    const currentUserId = user?.user_id || user?.id;
    const isAdmin = user?.role === "admin";

    const [currentReview, setCurrentReview] = useState(review);

    const [isLiked, setIsLiked] = useState(review.user_liked || false);
    const [likesCount, setLikesCount] = useState(review.likes_count || 0);
    const [isLiking, setIsLiking] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState(review.comments || []);
    const [newComment, setNewComment] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editRating, setEditRating] = useState(currentReview.rating);
    const [editContent, setEditContent] = useState(currentReview.content || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState(null);

    // Coup de cœur admin
    const [isFeatured, setIsFeatured] = useState(review.is_featured || false);
    const [isFeatureLoading, setIsFeatureLoading] = useState(false);

    const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState(null);
    const [confirmDeleteReview, setConfirmDeleteReview] = useState(false);

    const [confirmReportReviewId, setConfirmReportReviewId] = useState(null);
    const [reportReason, setReportReason] = useState('');

    useEffect(() => {
        // CRITIQUE
        setCurrentReview(review);

        // likes / commentaires
        setIsLiked(review.user_liked || false);
        setLikesCount(review.likes_count || 0);
        setComments(review.comments || []);
        setIsFeatured(review.is_featured || false);

    }, [review]);

    const formattedDate = new Date(review.posted_at).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const handleLikeClick = async () => {
        if (isLiking) return;
        setIsLiking(true);

        const nextStatus = !isLiked;

        setIsLiked(nextStatus);
        setLikesCount(prev => nextStatus ? prev + 1 : prev - 1);

        try {
            if (nextStatus) {
                await reviewsService.likeReview(currentReview.id);
            } else {
                await reviewsService.unlikeReview(currentReview.id);
            }
        } catch (error) {
            console.error(" ERROR LIKE:", error);
            setIsLiked(!nextStatus);
            setLikesCount(prev => !nextStatus ? prev + 1 : prev - 1);
        } finally {
            setIsLiking(false);
        }
    };

    const handleDeleteClick = async () => {
        setConfirmDeleteReview(true);
    };

    const confirmDeleteReviewAction = async () => {
        setConfirmDeleteReview(false);
        setIsDeleting(true);
        try {
            await reviewsService.deleteReview(currentReview.id);
            if (onReviewDeleted) onReviewDeleted(currentReview.id);
        } catch (error) {
            console.error("Erreur de suppression", error);
            setMessage(t('reviews.errorDelete'));
            setIsDeleting(false);
        }
    };

    const handleReportClick = async () => {
        setConfirmReportReviewId(currentReview.id);
    };

    const confirmReportAction = async () => {
        if(!reportReason.trim()) return;
        try {
            await reviewsService.reportReview(currentReview.id, reportReason.trim());
            setMessage(t('reviews.reportSuccess'));
        } catch (error) {
            setMessage(t('reviews.reportError'));
        } finally {
            setConfirmReportReviewId(null);
            setReportReason('');
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        setIsUpdating(true);

        try {
            const updatedRev = await reviewsService.updateReview(currentReview.id, {
                rating: editRating,
                content: editContent.trim()
            });

            const updatedReviewFull = {
                ...currentReview,
                rating: updatedRev.rating,
                content: updatedRev.content,
                has_been_modified: true
            };

            setCurrentReview(updatedReviewFull);

            if (onReviewUpdated) {
                onReviewUpdated(updatedReviewFull);
            }

            setIsEditing(false);

        } catch (error) {
            setMessage(t('reviews.errorEdit'));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();

        if (!newComment.trim()) return;
        setIsCommenting(true);

        try {
            const addedComment = await reviewsService.createCommentReview(
                currentReview.id,
                newComment.trim()
            );

            setComments([...comments, addedComment]);
            setNewComment('');

        } catch (error) {
            setMessage(t('reviews.errorComment'));
        } finally {
            setIsCommenting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        setConfirmDeleteCommentId(commentId);
    };

    const confirmDeleteCommentAction = async () => {
        try {
            await reviewsService.deleteCommentReview(confirmDeleteCommentId);
            setComments(comments.filter(c => c.id !== confirmDeleteCommentId));
        } catch (error) {
            setMessage(t('reviews.errorDeleteComment'));
        } finally {
            setConfirmDeleteCommentId(null);
        }
    };

    const handleFeatureClick = async () => {
        if (isFeatureLoading) return;
        setIsFeatureLoading(true);
        const action = isFeatured ? "unfeature" : "feature";
        try {
            await reviewsService.toggleFeature(currentReview.id, action);
            setIsFeatured(!isFeatured);
        } catch {
            setMessage(t('reviews.errorFeature'));
        } finally {
            setIsFeatureLoading(false);
        }
    };

    return (
        <>
            {message && (
                <div className="review-message">
                    {message}
                    <button onClick={() => setMessage(null)}>x</button>
                </div>
            )}

            <div className={`review-card ${isDeleting ? 'deleting' : ''} ${isFeatured ? 'review-card--featured' : ''}`}>

                {isFeatured && (
                    <div className="review-featured-badge">❤️ {t('reviews.featuredBadge')}</div>
                )}

                <div className="review-card-header">
                    <div className="review-author-info">

                        {(() => {
                            const av = currentReview.avatar_url;
                            const isUrl = av && (av.startsWith('http') || av.startsWith('/') || av.startsWith('data:image'));
                            const placeholder = `https://placehold.co/40x40/35313A/ffffff?text=${encodeURIComponent(currentReview.username?.[0]?.toUpperCase() || 'U')}`;

                            return isUrl ? (
                                <img src={av} alt="Avatar" className="review-avatar" onError={(e) => { e.target.src = placeholder; }}/>
                            ) : av ? (
                                <span className="review-avatar">{av}</span>
                            ) : (
                                <img src={placeholder} alt="Avatar" className="review-avatar"/>
                            );
                        }) () }

                        <div className="review-meta">
                            <span className="review-username">{currentReview.username || t('reviews.defaultUser')}</span>
                            <span className="review-date">{formattedDate} {currentReview.has_been_modified && `(${t('reviews.modified')})`}</span>
                        </div>
                    </div>

                    {!isEditing && <StarRating rating={currentReview.rating} readOnly={true} />}
                </div>

                {isEditing ? (
                    <form onSubmit={handleEditSubmit} className="inline-edit-form">
                        <div className="inline-edit-rating">
                            <StarRating rating={editRating} onRatingChange={setEditRating} readOnly={isUpdating} />
                        </div>
                        <textarea className="review-textarea" value={editContent} onChange={(e) => setEditContent(e.target.value)} disabled={isUpdating} rows="3"/>
                        <div className="edit-actions">
                            <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)} disabled={isUpdating}>{t('reviews.cancel')}</button>
                            <button type="submit" className="btn-submit-review" disabled={isUpdating}>{t('reviews.save')}</button>
                        </div>
                    </form>

                ) : (
                    <>
                        {currentReview.content && <p className="review-content">{currentReview.content}</p>}
                    </>
                )}

                {!isEditing && (
                    <div className="review-card-footer">
                        <div className="review-interactions">
                            <button
                                className={`interaction-btn like-btn ${isLiked ? 'active' : ''}`}
                                onClick={handleLikeClick}
                                disabled={isLiking}>
                                {isLiked ? (
                                    <img src={iconLiked} alt={t('reviews.like')} className="interaction-icon" />
                                ) : (
                                    <img src={iconNotLiked} alt={t('reviews.like')} className="interaction-icon" />
                                )}
                                <span className="count">{likesCount}</span>
                            </button>

                            <button className={`interaction-btn comment-btn ${showComments ? 'active' : ''}`} onClick={() => setShowComments(!showComments)}>
                                {showComments ? t('reviews.hide') : t('reviews.comment')} {comments.length > 0 && `(${comments.length})`}
                            </button>
                        </div>

                        <div className="review-actions">
                            {isAdmin && (
                                <button
                                    className={`action-btn feature-btn ${isFeatured ? 'feature-btn--active' : ''}`}
                                    onClick={handleFeatureClick}
                                    disabled={isFeatureLoading}
                                    title={isFeatured ? t('reviews.unfeature') : t('reviews.feature')}
                                >
                                    {isFeatureLoading ? "..." : isFeatured ? "💔" : "❤️"}
                                </button>
                            )}

                            {String(currentUserId) === String(currentReview.user_id) ? (
                                <>
                                    <button className="action-btn edit-btn" onClick={() => setIsEditing(true)}>
                                        {t('reviews.edit')}
                                    </button>
                                    <button className="action-btn delete-btn" onClick={handleDeleteClick}>
                                        {t('reviews.delete')}
                                    </button>
                                </>
                            ) : (
                                <button className="action-btn report-btn" onClick={handleReportClick} title={t('reviews.report')}>
                                    <img src={iconSignal} alt={t('reviews.report')} className="interaction-icon" />
                                    {t('reviews.report')}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {showComments && (
                    <div className="comments-section">
                        <div className="comments-list">
                            {comments.length === 0 ? (
                                <p className="no-comments">{t('reviews.firstComment')}</p>
                            ) : (
                                comments.map(c => (
                                    <div key={c.id} className="comment-item">
                                        <div className="comment-content">
                                            <span className="comment-author">{c.username || t('reviews.defaultUser')}</span>
                                            <span className="comment-text">{c.content}</span>
                                        </div>
                                        {String(currentUserId) === String(c.user_id) && (
                                            <button className="delete-comment-btn" onClick={() => handleDeleteComment(c.id)} title={t('reviews.delete')}>x</button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <form className="comment-form" onSubmit={handleCommentSubmit}>
                            <input type="text" className="comment-input" placeholder={t('reviews.commentPlaceholder')} value={newComment} onChange={(e) => setNewComment(e.target.value)} disabled={isCommenting}/>
                            <button type="submit" className="comment-submit-btn" disabled={!newComment.trim() || isCommenting}>{t('reviews.send')}</button>
                        </form>
                    </div>
                )}

                {/* Modale suppression commentaire */}
                {confirmDeleteCommentId && (
                    <div className="confirm-modal-overlay" onClick={() => setConfirmDeleteCommentId(null)}>
                        <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                            <p className="confirm-modal-text">{t('reviews.deleteCommentConfirm')}</p>
                            <div className="confirm-modal-actions">
                                <button className="confirm-modal-cancel" onClick={() => setConfirmDeleteCommentId(null)}>
                                    {t('reviews.cancel')}
                                </button>
                                <button className="confirm-modal-confirm" onClick={confirmDeleteCommentAction}>
                                    {t('reviews.delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modale suppression critique */}
                {confirmDeleteReview && (
                    <div className="confirm-modal-overlay" onClick={() => setConfirmDeleteReview(false)}>
                        <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                            <p className="confirm-modal-text">{t('reviews.deleteReviewConfirm')}</p>
                            <div className="confirm-modal-actions">
                                <button className="confirm-modal-cancel" onClick={() => setConfirmDeleteReview(false)}>
                                    {t('reviews.cancel')}
                                </button>
                                <button className="confirm-modal-confirm" onClick={confirmDeleteReviewAction}>
                                    {t('reviews.delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modale signalement critique */}
                {confirmReportReviewId && (
                    <div className="confirm-modal-overlay" onClick={() => { setConfirmReportReviewId(null); setReportReason(''); }}>
                        <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                            <p className="confirm-modal-text">{t('reviews.reportReviewTitle')}</p>
                            <input className="comment-input" placeholder={t('reviews.reportPlaceholder')} value={reportReason} onChange={(e) => setReportReason(e.target.value)}/>
                            <div className="confirm-modal-actions">
                                <button className="confirm-modal-cancel" onClick={() => {setConfirmReportReviewId(null); setReportReason(''); }}>
                                    {t('reviews.cancel')}
                                </button>
                                <button className="confirm-modal-confirm" onClick={confirmReportAction} disabled={!reportReason.trim()}>
                                    {t('reviews.report')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}