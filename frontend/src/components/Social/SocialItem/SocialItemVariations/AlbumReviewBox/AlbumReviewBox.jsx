import { Link } from 'react-router-dom';
import './AlbumReviewBox.css';

export default function AlbumReviewBox({ activity }) {
    const { user, target, review } = activity;

    const safeArtist = target?.artist ? encodeURIComponent(target.artist) : "inconnu";
    const safeAlbum = target?.albumTitle ? encodeURIComponent(target.albumTitle) : "inconnu";
    const albumRoute = `/albums/${safeArtist}/${safeAlbum}`;

    const rating = review?.rating || 0;
    const isActorImageUrl = user?.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/') || user.avatar.startsWith('data:image'));

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className={`review-star ${i <= rating ? 'filled' : 'empty'}`}>
                    ★
                </span>
            );
        }
        return stars;
    };

    return (
        <div className="social-item-review-box">
            <Link to={albumRoute} className="review-cover-link">
                <img
                    src={target.coverUrl || "https://placehold.co/80x80/222/FFF?text=?"}
                    alt="Album Cover"
                    className="review-album-cover"
                />
            </Link>

            <div className="review-content-wrapper">
                <Link to={`/user/${user.id}`} className="review-avatar-link">
                    {isActorImageUrl ? (
                        <img
                            src={user.avatar}
                            alt="User Avatar"
                            className="review-user-avatar"
                        />
                    ) : (
                        <div className="review-user-avatar text-avatar">{user?.avatar || "👤"}</div>
                    )}
                </Link>

                <div className="review-details">
                    <div className="review-stars">
                        {renderStars()}
                    </div>
                    {review?.content && (
                        <p className="review-text">{review.content}</p>
                    )}
                </div>
            </div>
        </div>
    );
}