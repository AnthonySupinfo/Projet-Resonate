import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "../../../../../context/AuthContext.jsx";
import { feedService } from '../../../../../api/feed.service';
import './UserFollowBox.css';
import followUser from '../../../../../../public/icons/notifsbar/follow.png';

export default function UserFollowBox({ activity }) {
    const { target } = activity;
    const { user } = useAuth();

    const rawAvatar = target?.avatarUrl;
    const isImageUrl = rawAvatar && (rawAvatar.startsWith('http') || rawAvatar.startsWith('/') || rawAvatar.startsWith('data:image'));

    const [isFollowing, setIsFollowing] = useState(target?.isFollowedByMe || false);
    const [isLoading, setIsLoading] = useState(false);

    const isMe = user && target?.id === String(user.user_id);

    const handleFollowToggle = async () => {
        if (isLoading || !target?.id || isMe) return;

        setIsLoading(true);
        try {
            if (isFollowing) {
                await feedService.unfollowUser(target.id);
                setIsFollowing(false);
            } else {
                await feedService.followUser(target.id);
                setIsFollowing(true);
            }
        } catch (error) {
            console.error("Erreur lors de l'action de follow", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="social-item-user-box">
            <Link to={`/user/${target?.id}`} className="social-user-avatar-wrapper" style={{ textDecoration: 'none' }}>
                {isImageUrl ? (
                    <img
                        src={rawAvatar}
                        alt={target?.name || "Avatar"}
                        className="social-user-avatar-image"
                        onError={(e) => (e.target.style.display = "none")}
                    />
                ) : rawAvatar ? (
                    <span className="social-user-avatar-emoji">{rawAvatar}</span>
                ) : (
                    <span className="social-user-avatar-placeholder">👤</span>
                )}
            </Link>

            <div className="social-user-info">
                <h4 className="social-user-name">
                    <Link to={`/user/${target?.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {target?.name}
                    </Link>
                </h4>
                <p className="social-user-handle">{target?.username || `@${target?.name}`}</p>
            </div>

            {!isMe && (
                <button
                    className={`social-user-add-btn ${isFollowing ? 'following' : ''}`}
                    onClick={handleFollowToggle}
                    disabled={isLoading}
                    style={{
                        opacity: isLoading ? 0.7 : 1,
                        cursor: isLoading ? 'wait' : 'pointer'
                    }}
                >
                    {isLoading ? (
                        <span style={{ fontSize: '0.85rem' }}>...</span>
                    ) : isFollowing ? (
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Suivi</span>
                    ) : (
                        <img src={followUser} alt="Suivre" className="action-icon" />
                    )}
                </button>
            )}
        </div>
    );
}