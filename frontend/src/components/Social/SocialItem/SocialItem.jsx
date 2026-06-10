import { useState } from 'react';
import './SocialItem.css';
import likeNotLiked from '../../../../public/icons/likeNotLiked.png';
import CommentItem from "./CommentItem/CommentItem.jsx";
import NewCommItem from "./NewCommItem/NewCommItem.jsx";
import UserFollowBox from "./SocialItemVariations/UserFollowBox/UserFollowBox.jsx";
import PlaylistBox from "./SocialItemVariations/PlaylistBox/PlaylistBox.jsx";
import AlbumStatusBox from "./SocialItemVariations/AlbumStatusBox/AlbumStatusBox.jsx";
import AlbumReviewBox from "./SocialItemVariations/AlbumReviewBox/AlbumReviewBox.jsx";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { Link } from 'react-router-dom';

const CONTENT_COMPONENTS = {
    ADD_TRACK_PLAYLIST: PlaylistBox,
    FOLLOW_USER: UserFollowBox,
    CREATE_PLAYLIST: PlaylistBox,
    FOLLOW_PLAYLIST: PlaylistBox,
    UPDATE_ALBUM_STATUS: AlbumStatusBox,
    REVIEW_ALBUM: AlbumReviewBox
};

export default function SocialItem({ activity, hideComments = false }) {
    const [showComments, setShowComments] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const { t } = useLanguage();

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

        const trackLink = (name, artist, albumTitle) => (
            <Link to={`/albums/${encodeURIComponent(artist)}/${encodeURIComponent(albumTitle)}`} className="social-item-user-link">
                <strong>{name}</strong>
            </Link>
        );

        const albumLink = (title, artist) => (
            <Link to={`/albums/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`} className="social-item-user-link">
                <strong>{title}</strong>
            </Link>
        );

        switch (activity.type) {
            case 'FOLLOW_USER':
                return <>{userLink} {t('social.startedFollowing')} <Link to={`/user/${activity.target.id}`} className="social-item-user-link"><strong>{activity.target.name}</strong></Link></>;
            case 'ADD_TRACK_PLAYLIST':
                return <>{userLink} {t('social.added')} {trackLink(activity.target.name, activity.target.artist, activity.target.albumTitle)} {t('social.toPlaylist')} {playlistLink(activity.target.playlistName, activity.target.playlistId)}</>;
            case 'CREATE_PLAYLIST':
                return <>{userLink} {t('social.createdPlaylist')} {playlistLink(activity.target.name, activity.target.id)}</>;
            case 'FOLLOW_PLAYLIST':
                return <>{userLink} {t('social.followsPlaylist')} {playlistLink(activity.target.name, activity.target.id)}</>;
            case 'UPDATE_ALBUM_STATUS':
                switch (activity.target.albumStatus) {
                    case 'PLANNED':
                        return <>{userLink} {t('social.statusPlanned')} {albumLink(activity.target.albumTitle, activity.target.artist)} {t('social.by')} <strong>{activity.target.artist}</strong></>;
                    case 'LISTENING':
                        return <>{userLink} {t('social.statusListening')} {albumLink(activity.target.albumTitle, activity.target.artist)} {t('social.by')} <strong>{activity.target.artist}</strong></>;
                    case 'COMPLETED':
                        return <>{userLink} {t('social.statusCompleted')} {albumLink(activity.target.albumTitle, activity.target.artist)} {t('social.by')} <strong>{activity.target.artist}</strong></>;
                    case 'DROPPED':
                        return <>{userLink} {t('social.statusDropped')} {albumLink(activity.target.albumTitle, activity.target.artist)} {t('social.by')} <strong>{activity.target.artist}</strong></>;
                    default:
                        return <>{userLink} a interagi avec {albumLink(activity.target.albumTitle, activity.target.artist)}</>;
                }
            case 'REVIEW_ALBUM':
                return <>{userLink} {t('social.reviewedAlbum')} {albumLink(activity.target.albumTitle, activity.target.artist)} {t('social.by')} <strong>{activity.target.artist}</strong></>;
            default:
                return <>{userLink} {t('social.interactedWith')} <strong>{activity.target.name}</strong></>;
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
                                {showComments ? t('social.hideComments') : t('social.viewComments')}
                            </button>
                            {!showComments && (
                                <>
                                    <span className="social-item-dot">•</span>
                                    <button
                                        className="social-item-action-link"
                                        onClick={handleReplyClick}
                                    >
                                        {t('social.reply')}
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
                                            {t('social.addComment')}
                                        </div>
                                    </div>
                                )}
                                <CommentItem isLast={true} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}