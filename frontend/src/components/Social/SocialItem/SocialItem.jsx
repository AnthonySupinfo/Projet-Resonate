import { useState } from 'react';
import './SocialItem.css';
import likeNotLiked from '../../../../public/icons/likeNotLiked.png';
import CommentItem from "./CommentItem/CommentItem.jsx";
import NewCommItem from "./NewCommItem/NewCommItem.jsx";
import TrackBox from "./SocialItemVariations/TrackBox/TrackBox.jsx";
import UserFollowBox from "./SocialItemVariations/UserFollowBox/UserFollowBox.jsx";
import PlaylistBox from "./SocialItemVariations/PlaylistBox/PlaylistBox.jsx";

const CONTENT_COMPONENTS = {
    LIKE_TRACK: TrackBox,
    ADD_TRACK_PLAYLIST: TrackBox,
    FOLLOW_USER: UserFollowBox,
    CREATE_PLAYLIST: PlaylistBox,
    FOLLOW_PLAYLIST: PlaylistBox
};

export default function SocialItem({ activity }) {
    const [showComments, setShowComments] = useState(false);
    const [isReplying, setIsReplying] = useState(false);

    if (!activity) return null;

    const SpecificContent = CONTENT_COMPONENTS[activity.type];
    const actorAvatar = activity.user.avatar;
    const isActorImageUrl = actorAvatar && (actorAvatar.startsWith('http') || actorAvatar.startsWith('/') || actorAvatar.startsWith('data:image'));

    const handleReplyClick = () => {
        setIsReplying(true);
        setShowComments(true);
    };

    const toggleComments = () => {
        setShowComments(!showComments);
        if (showComments) {
            setIsReplying(false);
        }
    };

    const renderActionText = () => {
        switch (activity.type) {
            case 'LIKE_TRACK':
                return <><strong>{activity.user.name}</strong> aime <strong>{activity.target.name}</strong> de <strong>{activity.target.artist}</strong></>;
            case 'ADD_TRACK_PLAYLIST':
                return <><strong>{activity.user.name}</strong> a ajouté <strong>{activity.target.name}</strong> à sa playlist <strong>{activity.target.playlistName}</strong></>;
            case 'FOLLOW_USER':
                return <><strong>{activity.user.name}</strong> a commencé à suivre <strong>{activity.target.name}</strong></>;
            case 'CREATE_PLAYLIST':
                return <><strong>{activity.user.name}</strong> a créé la playlist <strong>{activity.target.name}</strong></>;
            case 'FOLLOW_PLAYLIST':
                return <><strong>{activity.user.name}</strong> suit la playlist <strong>{activity.target.name}</strong></>;
            default:
                return <><strong>{activity.user.name}</strong> a interagi avec <strong>{activity.target.name}</strong></>;
        }
    };

    return (
        <div className="social-item-wrapper">
            {isActorImageUrl ? (
                <img
                    src={actorAvatar}
                    alt="Avatar"
                    className="social-item-avatar"
                    onError={(e) => e.target.style.display = "none"}
                />
            ) : actorAvatar ? (
                <div className="social-item-avatar text-avatar">{actorAvatar}</div>
            ) : (
                <div className="social-item-avatar text-avatar">👤</div>
            )}

            <div className="social-item-card">
                <div className="social-item-header">
                    <p className="social-item-title">
                        {renderActionText()}
                        <span className="social-item-time">{activity.timeAgo}</span>
                    </p>
                    <button className="social-item-like-btn">
                        <img src={likeNotLiked} alt="J'aime" className="action-icon" />
                    </button>
                </div>

                {SpecificContent && <SpecificContent data={activity.data} />}

                <div className="social-item-footer">
                    <button
                        className="social-item-action-link"
                        onClick={toggleComments}
                    >
                        {showComments ? "Cacher les commentaires" : "Voir les commentaires"}
                    </button>
                    {!showComments && (
                        <>
                            <span className="social-item-dot">•</span>
                            <button
                                className="social-item-action-link"
                                onClick={handleReplyClick}
                            >
                                Répondre
                            </button>
                        </>
                    )}
                </div>

                {showComments && (
                    <div className="comments-section">
                        {isReplying ? (
                            <NewCommItem
                                isLast={false}
                                onCancel={() => setIsReplying(false)}
                            />
                        ) : (
                            <div className="comment-trigger-container" onClick={() => setIsReplying(true)}>
                                <div className="comment-tree-line"></div>
                                <img
                                    src="https://placehold.co/32x32/555/FFF?text=Me"
                                    alt="Mon avatar"
                                    className="comment-avatar"
                                />
                                <div className="comment-trigger-input">
                                    Ajouter un commentaire...
                                </div>
                            </div>
                        )}
                        <CommentItem isLast={false} />
                        <CommentItem isLast={true} />
                    </div>
                )}
            </div>
        </div>
    );
}