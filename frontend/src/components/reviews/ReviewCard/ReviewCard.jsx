import { useState } from 'react';
import StarRating from '../StarRating/StarRating';
import { likeReview, unlikeReview, deleteReview, reportReview, createCommentReview, deleteCommentReview } from '../../../api/api';
import './ReviewCard.css';

export default function ReviewCard({ review, currentUserId, onReviewDeleted }) {
    const [isLiked, setIsLiked] = useState(review.is_liked_by_user || false);
    const [likesCount, setLikesCount] = useState(review.like_count || 0);
    const [isLiking, setIsLiking] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState(review.comments || []);
    const [newComment, setNewComment] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);

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
                await likeReview(review.id);
            } else {
                await unlikeReview(review.id);
            }
        } catch (error) {
            console.error("Erreur lors du like", error);
            setIsLiked(!nextStatus); // annule si backend refuse
            setLikesCount(prev => !nextStatus ? prev +1 : prev - 1);
        } finally {
            setIsLiking(false);
        }
    };

    const handleDeleteClick = async () => {
        if (window.confirm("Voulez-vous vraiment supprimer cette critique ?")) {
            setIsDeleting(true);
            try {
                await deleteReview(review.id);
                if (onReviewDeleted) onReviewDeleted(review.id);
            } catch (error) {
                console.error("Erreur de suppression", error);
                alert("Impossible de supprimer la critique");
                setIsDeleting(false);
            }
        }
    };

    const handleReportClick = async () => {
        const reason = window.prompt("Pourquoi signalez vous cette critique ? (Spam, Insultes, etc)");
        if(reason) {
            try {
                await reportReview(review.id, reason);
                alert ("Merci, la critique a été signalée à l'équipe de modération.");
            } catch (error) {
                alert("Erreur lors du signalement");
            }
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if(!newComment.trim()) return;

        setIsCommenting(true);
        try {
            const addedComment = await createCommentReview(review.id, newComment.trim()); 
            setComments([...comments, {
                ...addedComment,
                username: "Moi",// a modifier pour fetch les vraies commentaire 
                user_id: currentUserId
            }]);
            setNewComment('');
        } catch (error) {
            console.error("Erreur lors de l'ajout du commentaire", error);
            alert("Impossible de poster le commentaire");
        } finally {
            setIsCommenting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (window.confirm("Voulez-vous supprimer ce commentaire ?")) {
            try {
                await deleteCommentReview(commentId);
                setComments(comments.filter(c => c.id !== commentId));
            } catch (error) {
                alert ("Erreur lors de la suppression du commentaire.");
            }
        }
    };

    return (
        <div className={`review-card ${isDeleting ? 'deleting' : ''}`}>
            <div className="review-card-header">
                <div className="review-author-info">
                    <img src={review.avatar_url || `https://placehold.co/40x40/2a2a2c/ffffff?text=${review.username?.[0] || 'U'}`} alt="Avatar" className="review-avatar"/>
                    <div className="review-meta">
                        <span className="review-username">{review.username || "Utilisateur"}</span>
                        <span className="review-date">{formattedDate} {review.has_been_modified && "(Modifié)"}</span>
                    </div>
                </div>

                <StarRating rating={review.rating} readOnly={true} />
            </div>

            {review.content && (
                <p className="review-content">{review.content}</p>
            )}

            <div className="review-card-footer">
                <div className="review-interactions">
                    <button 
                        className={`interaction-btn like-btn ${isLiked ? 'active' : ''}`} 
                        onClick={handleLikeClick} 
                        disabled={isLiking}>
                            {isLiked ? '❤️' : '🤍'} <span className="count">{likesCount}</span>
                    </button>

                    <button className={`interactions-btn comment-btn ${showComments ? 'active' : ''}`} onClick={() => setShowComments(!showComments)}>
                        {showComments ? 'Masquer' : 'Commenter'} {comments.length > 0 && `(${comments.length})`}
                    </button>
                </div>

                <div className="review-actions">
                    {String(currentUserId) === String(review.user_id) ? (
                        <button className="actions-btn delete-btn" onClick={handleDeleteClick}>Supprimer</button>
                    ) : (
                        <button className="action-btn report-btn" onClick={handleReportClick} title="Signaler">Signaler</button>
                    )}
                </div>
            </div>

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
                                        <button className="delete-comment-btn" onClick={() => handleDeleteComment(c.id)}>x</button>
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
        </div>
    );
}
