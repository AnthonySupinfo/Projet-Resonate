import { useState } from 'react';
import StarRating from '../StarRating/StarRating';
import { likeReview, unlikeReview, deleteReview, reportReview, createCommentReview, deleteCommentReview, updateReview } from '../../../api/api';
import './ReviewCard.css';
import { useAuth } from '../../../context/AuthContext';
import { getUserStats } from '../../../api/auth';

export default function ReviewCard({ review, onReviewDeleted }) {

    const { user } = useAuth();
    const currentUserId = user?.user_id || user?.id;

    const [currentReview, setCurrentReview] = useState(review);

    const [isLiked, setIsLiked] = useState(review.is_liked_by_user || false);
    const [likesCount, setLikesCount] = useState(review.like_count || 0);
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
                await likeReview(currentReview.id);
            } else {
                await unlikeReview(currentReview.id);
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
                await deleteReview(currentReview.id);
                if (onReviewDeleted) onReviewDeleted(currentReview.id);
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
                await reportReview(currentReview.id, reason);
                alert ("Merci, la critique a été signalée à l'équipe de modération.");
            } catch (error) {
                alert("Erreur lors du signalement");
            }
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const updatedRev = await updateReview(currentReview.id, {
                rating: editRating,
                content: editContent.trim()
            });
            setCurrentReview({ ...currentReview, rating: updatedRev.rating, content: updatedRev.content, has_been_modified: true});
            setIsEditing(false);
        } catch (error) {
            alert("Erreur lors de la modification.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if(!newComment.trim()) return;

        setIsCommenting(true);
        try {
            const addedComment = await createCommentReview(currentReview.id, newComment.trim()); 
            setComments([...comments, {
                ...addedComment,
                username: user?.username,// a modifier pour fetch les vraies commentaire 
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

                        <button className={`interactions-btn comment-btn ${showComments ? 'active' : ''}`} onClick={() => setShowComments(!showComments)}>
                            {showComments ? 'Masquer' : 'Commenter'} {comments.length > 0 && `(${comments.length})`}
                        </button>
                    </div>

                    <div className="review-actions">
                        {String(currentUserId) === String(currentReview.user_id) ? (
                            <>
                                <button className="action-btn edit-btn" onClick={() => setIsEditing(true)}>Modifier</button>
                                <button className="action-btn delete-btn" onClick={handleDeleteClick}>Supprimer</button>
                            </>
                        ) : (
                            <button className="action-btn report-btn" onClick={handleReportClick} title="Signaler">Signaler</button>
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
