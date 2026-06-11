import { useLanguage } from "../../../../context/LanguageContext.jsx";
import './CommentItem.css';
import likeNotLiked from '../../../../../public/icons/likeNotLiked.png';

export default function CommentItem({ comment, isLast, currentUserId, onDelete }) {
    const { t } = useLanguage();

    const isAuthor = String(currentUserId) === String(comment.user_id);
    const date = new Date(comment.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const isImageUrl = comment.avatar_url && (comment.avatar_url.startsWith('http') || comment.avatar_url.startsWith('/') || comment.avatar_url.startsWith('data:image'));

    return (
        <div className="comment-item-container">
            <div className={`comment-tree-line ${isLast ? 'last' : ''}`}></div>

            {isImageUrl ? (
                <img src={comment.avatar_url} alt={comment.username} className="comment-avatar" />
            ) : comment.avatar_url ? (
                <span className="comment-avatar text-avatar">{comment.avatar_url}</span>
            ) : (
                <span className="comment-avatar text-avatar">👤</span>
            )}

            <div className="comment-content">
                <div className="comment-header">
                    <span className="comment-author">@{comment.username}</span>
                    <span className="comment-time">{date}</span>
                </div>
                <p className="comment-text">{comment.content}</p>
            </div>

            <div className="comment-actions">
                {isAuthor && (
                    <button className="comment-action-btn" onClick={() => onDelete(comment.id)} title={t('social.delete')}>
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}