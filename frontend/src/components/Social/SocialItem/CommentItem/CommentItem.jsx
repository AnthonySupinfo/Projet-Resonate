import './CommentItem.css';
import likeNotLiked from '../../../../../public/icons/likeNotLiked.png';

export default function CommentItem({ isLast }) {
    return (
        <div className="comment-item-container">
            <div className={`comment-tree-line ${isLast ? 'last' : ''}`}></div>

            <img
                src="https://placehold.co/32x32/555/FFF?text=J"
                alt="Avatar"
                className="comment-avatar"
            />

            <div className="comment-content">
                <div className="comment-header">
                    <span className="comment-author">Julie Dupont</span>
                    <span className="comment-username">(@jujud)</span>
                    <span className="comment-time">Il y a 1h</span>
                </div>
                <p className="comment-text">Mais n'importe quoi, toi !</p>
            </div>

            <div className="comment-actions">
                <button className="comment-action-btn">
                    <img src={likeNotLiked} alt="Like" className="comment-icon" />
                    <span className="comment-like-count">2</span>
                </button>
                <button className="comment-action-btn menu-btn">
                    ⋮
                </button>
            </div>
        </div>
    );
}