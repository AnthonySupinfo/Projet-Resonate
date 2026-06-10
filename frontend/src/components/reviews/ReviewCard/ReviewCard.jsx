import { useState, useEffect } from 'react';
import StarRating from '../StarRating/StarRating';
import { likeReview, unlikeReview, deleteReview, reportReview, createCommentReview, deleteCommentReview, updateReview } from '../../../api/api';
import './ReviewCard.css';
import { useAuth } from '../../../context/AuthContext';
import { getUserStats, authFetch } from '../../../api/auth';

const API_URL = import.meta.env.VITE_API_URL || ""

export default function ReviewCard({ review, onReviewDeleted, onReviewUpdated }) {

    const { user } = useAuth();
    const currentUserId = user?.user_id || user?.id;
    const isAdmin = user?.role === "admin"

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

    // Coup de cœur admin
    const [isFeatured, setIsFeatured] = useState(review.is_featured || false)
    const [isFeatureLoading, setIsFeatureLoading] = useState(false)

    const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState(null);
    const [confirmDeleteReview, setConfirmDeleteReview] = useState(false);

    useEffect(() => {

        console.log(" SYNC REVIEW CARD");

        console.log("review.id:", review.id);
        console.log("review.content:", review.content);
        console.log("review.rating:", review.rating);

        console.log("review.user_liked:", review.user_liked);
        console.log("review.likes_count:", review.likes_count);

        // CRITIQUE
        setCurrentReview(review);

        // likes / commentaires
        setIsLiked(review.user_liked || false);
        setLikesCount(review.likes_count || 0);
        setComments(review.comments || []);
        setIsFeatured(review.is_featured || false)

    }, [review]); // IMPORTANT : dépendance sur review entier


    const formattedDate = new Date(review.posted_at).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    
    const handleLikeClick = async () => {
        if (isLiking) return;

        console.log("CLICK LIKE");
        console.log("review.id:", currentReview.id);
        console.log("isLiked BEFORE:", isLiked);

        setIsLiking(true);

        const nextStatus = !isLiked;

        // optimistic update
        setIsLiked(nextStatus);
        setLikesCount(prev => nextStatus ? prev + 1 : prev - 1);

        try {
            if (nextStatus) {
                console.log(" CALL likeReview()");
                await likeReview(currentReview.id);
            } else {
                console.log(" CALL unlikeReview()");
                await unlikeReview(currentReview.id);
            }

            console.log(" API SUCCESS");

        } catch (error) {
            console.error(" ERROR LIKE:", error);

            // rollback
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
                await deleteReview(currentReview.id);
                if (onReviewDeleted) onReviewDeleted(currentReview.id);
            } catch (error) {
                console.error("Erreur de suppression", error);
                alert("Impossible de supprimer la critique");
                setIsDeleting(false);
            }
    };

    const handleReportClick = async () => {
        const reason = window.prompt("Pourquoi signalez vous cette critique ? (Spam, Insultes, etc)");
        if(reason) {
            try {
                await reportReview(currentReview.id, reason);
                alert ("Merci, la critique a été signalée à l'équipe de modération.");
            } catch (error) {
                alert("Erreur lors du signalement");
            }
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        console.log(" EDIT SUBMIT");
        console.log("review.id:", currentReview.id);

        setIsUpdating(true);

        try {
            const updatedRev = await updateReview(currentReview.id, {
                rating: editRating,
                content: editContent.trim()
            });

            console.log(" API UPDATE RESULT:", updatedRev);

            const updatedReviewFull = {
                ...currentReview,
                rating: updatedRev.rating,
                content: updatedRev.content,
                has_been_modified: true
            };

            //  update local
            setCurrentReview(updatedReviewFull);

            //  update parent (IMPORTANT)
            if (onReviewUpdated) {
                console.log(" SENDING UPDATE TO PARENT");
                onReviewUpdated(updatedReviewFull);
            }

            setIsEditing(false);
            console.log(" UPDATE SUCCESS:", updatedRev);

        } catch (error) {
            console.error(" ERROR UPDATE:", error);
            alert("Erreur lors de la modification.");
        } finally {
            setIsUpdating(false);
        }

    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();

        if (!newComment.trim()) return;

        console.log(" SUBMIT COMMENT");
        console.log("review.id:", currentReview.id);
        console.log("content:", newComment);

        setIsCommenting(true);

        try {
            console.log(" CALL createCommentReview");

            const addedComment = await createCommentReview(
                currentReview.id,
                newComment.trim()
            );

            console.log(" API COMMENT RESPONSE:", addedComment);

            setComments([...comments, {
                ...addedComment,
                username: user?.username,
                user_id: currentUserId
            }]);

            setNewComment('');

        } catch (error) {
            console.error(" COMMENT ERROR:", error);

            alert("Impossible de poster le commentaire");
        } finally {
            setIsCommenting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        setConfirmDeleteCommentId(commentId); 
    };

        const confirmDeleteCommentAction = async () => {
            try {
               await deleteCommentReview(confirmDeleteCommentId);
                setComments(comments.filter(c => c.id !== confirmDeleteCommentId));
            } catch (error) {
                alert ("Erreur lors de la suppression du commentaire.");
            } finally {
                setConfirmDeleteCommentId(null);
            }
    };

    // Coup de cœur admin — met en avant ou retire la mise en avant
    const handleFeatureClick = async () => {
        if (isFeatureLoading) return
        setIsFeatureLoading(true)
        const action = isFeatured ? "unfeature" : "feature"
        try {
            const res = await authFetch(`${API_URL}/api/v1/admin/reviews/${currentReview.id}/${action}`, {
                method: "PATCH"
            })
            if (!res.ok) throw new Error()
            setIsFeatured(!isFeatured)
        } catch {
            alert("Erreur lors de la mise en avant.")
        } finally {
            setIsFeatureLoading(false)
        }
    }

    return (
        <div className={`review-card ${isDeleting ? 'deleting' : ''} ${isFeatured ? 'review-card--featured' : ''}`}>

            {/* Badge coup de cœur — visible pour tous si la critique est mise en avant */}
            {isFeatured && (
                <div className="review-featured-badge">❤️ Coup de cœur</div>
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
                        <span className="review-username">{currentReview.username || "Utilisateur"}</span>
                        <span className="review-date">{formattedDate} {currentReview.has_been_modified && "(Modifié)"}</span>
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
                        <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)} disabled={isUpdating}>Annuler</button>
                        <button type="submit" className="btn-submit-review" disabled={isUpdating}>Enregistrer</button>
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
                                {isLiked ? '❤️' : '🤍'} <span className="count">{likesCount}</span>
                        </button>

                        <button className={`interaction-btn comment-btn ${showComments ? 'active' : ''}`} onClick={() => setShowComments(!showComments)}>
                            {showComments ? 'Masquer' : 'Commenter'} {comments.length > 0 && `(${comments.length})`}
                        </button>
                    </div>
             
                    <div className="review-actions">
                        {/* Bouton coup de cœur — visible uniquement pour l'admin */}
                        {isAdmin && (
                            <button
                                className={`action-btn feature-btn ${isFeatured ? 'feature-btn--active' : ''}`}
                                onClick={handleFeatureClick}
                                disabled={isFeatureLoading}
                                title={isFeatured ? "Retirer le coup de cœur" : "Mettre en avant"}
                            >
                                {isFeatureLoading ? "..." : isFeatured ? "💔" : "❤️"}
                            </button>
                        )}

                        {String(currentUserId) === String(currentReview.user_id) ? (
                            <>
                                <button className="action-btn edit-btn" onClick={() => setIsEditing(true)}>
                                    Modifier
                                </button>
                                <button
                                    className="action-btn delete-btn" onClick={handleDeleteClick}>
                                    Supprimer
                                </button>
                            </>
                        ) : (
                            <button className="action-btn report-btn" onClick={handleReportClick} title="Signaler">
                                Signaler
                            </button>
                        )}
                    </div>
                </div>
            )}

            {showComments && (
                <div className="comments-section">
                    <div className="comments-list">
                        {comments.length === 0 ? (
                            <p className="no-comments">Soyez le premier à commenter!</p>
                        ) : (
                            comments.map(c => (
                                <div key={c.id} className="comment-item">
                                    <div className="comment-content">
                                        <span className="comment-author">{c.username || "Utilisateur"}</span>
                                        <span className="comment-text">{c.content}</span>
                                    </div>
                                    {String(currentUserId) === String(c.user_id) && (
                                        <button className="delete-comment-btn" onClick={() => handleDeleteComment(c.id)} title="Supprimer">x</button>
                                    )}
                                    </div>
                            ))
                        )}
                    </div>

                    <form className="comment-form" onSubmit={handleCommentSubmit}>
                        <input type="text" className="comment-input" placeholder="Ajouter un commentaire..." value={newComment} onChange={(e) => setNewComment(e.target.value)} disabled={isCommenting}/>
                        <button type="submit" className="comment-submit-btn" disabled={!newComment.trim() || isCommenting}>Envoyer</button>
                    </form>
                </div>
            )}
            {confirmDeleteCommentId && (
                <div className="confirm-modal-overlay" onClick={() => setConfirmDeleteCommentId(null)}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <p className="confirm-modal-text">Supprimer ce commentaire</p>
                        <div className="confirm-modal-actions">
                            <button className="confirm-modal-cancel" onClick={() => setConfirmDeleteCommentId(null)}>
                                Annuler
                            </button>
                            <button className="confirm-modal-confirm" onClick={confirmDeleteCommentAction}>
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDeleteReview && (
                <div className="confirm-modal-overlay" onClick={() => setConfirmDeleteReview(false)}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <p className="confirm-modal-text">Supprimer cette critique ?</p>
                        <div className="confirm-modal-actions">
                            <button className="confirm-modal-cancel" onClick={() => setConfirmDeleteReview(false)}>
                                Annuler
                            </button>
                            <button className="confirm-modal-confirm" onClick={confirmDeleteReviewAction}>
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}