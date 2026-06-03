import { useState } from 'react';
import './SocialItem.css';
import likeNotLiked from '../../../../public/icons/likeNotLiked.png';
import CommentItem from "./CommentItem/CommentItem.jsx";
import NewCommItem from "./NewCommItem/NewCommItem.jsx";
import TrackBox from "./SocialItemVariations/TrackBox/TrackBox.jsx";
import UserFollowBox from "./SocialItemVariations/UserFollowBox/UserFollowBox.jsx";
import PlaylistBox from "./SocialItemVariations/PlaylistBox/PlaylistBox.jsx";
import { Link } from 'react-router-dom';

const CONTENT_COMPONENTS = {
    LIKE_TRACK: TrackBox,
    ADD_TRACK_PLAYLIST: TrackBox,
    FOLLOW_USER: UserFollowBox,
    CREATE_PLAYLIST: PlaylistBox,
    FOLLOW_PLAYLIST: PlaylistBox
};

export default function SocialItem({ activity, hideComments = false }) {
    const [showComments, setShowComments] = useState(false);
    const [isReplying, setIsReplying] = useState(false);

    console.log("Mon activity CREATE_PLAYLIST :", activity);
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
        const userLink = (
            <Link to={`/user/${activity.user.id}`} className="social-item-user-link">
                <strong>{activity.user.name}</strong>
            </Link>
        );

        const playlistLink = (name, id) => (
            <Link to={`/library/playlists/${id}`} className="social-item-user-link">
                <strong>{name}</strong>
            </Link>
        );

        switch (activity.type) {
            case 'FOLLOW_USER':
                return <>{userLink} a commencé à suivre <strong>{activity.target.name}</strong></>;
            case 'LIKE_TRACK':
                return <>{userLink} aime <strong>{activity.target.name}</strong> de <strong>{activity.target.artist}</strong></>;
            case 'ADD_TRACK_PLAYLIST':
                return <>{userLink} a ajouté <strong>{activity.target.name}</strong> à sa playlist <strong>{activity.target.playlistName}</strong></>;
            case 'CREATE_PLAYLIST':
                return <>{userLink} a créé la playlist {playlistLink(activity.target.name, activity.target.id)}</>;
            case 'FOLLOW_PLAYLIST':
                return <>{userLink} suit la playlist {playlistLink(activity.target.name, activity.target.id)}</>;
            default:
                return <>{userLink} a interagi avec <strong>{activity.target.name}</strong></>;
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

                {SpecificContent && <SpecificContent activity={activity} />}

                {!hideComments && (
                    <>
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
                    </>
                )}
            </div>
        </div>
    );
}