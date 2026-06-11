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
import { useAuth } from "../../../context/AuthContext.jsx";
import { Link } from 'react-router-dom';
import { feedService } from "../../../api/feed.service.js";

const CONTENT_COMPONENTS = {
    ADD_TRACK_PLAYLIST: PlaylistBox,
    FOLLOW_USER: UserFollowBox,
    CREATE_PLAYLIST: PlaylistBox,
    FOLLOW_PLAYLIST: PlaylistBox,
    UPDATE_ALBUM_STATUS: AlbumStatusBox,
    REVIEW_ALBUM: AlbumReviewBox
};

export default function SocialItem({ activity, hideComments = false }) {
    const { t } = useLanguage();
    const { user } = useAuth();

    const [showComments, setShowComments] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [comments, setComments] = useState(activity?.comments || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);

    if (!activity) return null;

    const SpecificContent = CONTENT_COMPONENTS[activity.type];
    const actorAvatar = activity.actor_avatar || activity.user?.avatar;
    const isActorImageUrl = actorAvatar && (actorAvatar.startsWith('http') || actorAvatar.startsWith('/') || actorAvatar.startsWith('data:image'));

    const toggleComments = () => {
        setShowComments(!showComments);
        if (showComments) setIsReplying(false);
    };

    const handleCommentSubmit = async (content) => {
        if (!content.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const newComment = await feedService.createFeedComment(activity.id, content);
            setComments([...comments, newComment]);
            setIsReplying(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeleteComment = async () => {
        if (!commentToDelete) return;
        try {
            await feedService.deleteFeedComment(commentToDelete);
            setComments(comments.filter(c => c.id !== commentToDelete));
        } catch (error) {
            console.error("Impossible de supprimer le commentaire", error);
        } finally {
            setCommentToDelete(null);
        }
    };

    const renderActionText = () => {
        const userLink = (
            <Link to={`/user/${activity.actor_id || activity.user?.id}`} className="social-item-user-link">
                <strong>{activity.actor_username || activity.user?.name}</strong>
            </Link>
        );

        const playlistLink = (name, id) => (
            <Link to={`/library/playlists/${id}`} className="social-item-user-link">
                <strong>{name}</strong>
            </Link>
        );

        const albumLink = (title, artist) => (
            <Link to={`/albums/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`} className="social-item-user-link">
                <strong>{title}</strong>
            </Link>
        );

        switch (activity.activity_type || activity.type) {
            case 'FOLLOW_USER':
                return <>{userLink} {t('social.startedFollowing')} <Link to={`/user/${activity.target_user_id}`} className="social-item-user-link"><strong>{activity.target_user_username}</strong></Link></>;
            case 'CREATE_PLAYLIST':
                return <>{userLink} {t('social.createdPlaylist')} {playlistLink(activity.playlist_name, activity.playlist_id)}</>;
            case 'UPDATE_ALBUM_STATUS':
                return <>{userLink} {t(`social.status${activity.album_status || activity.target?.albumStatus}`)} {albumLink(activity.album_title || activity.target?.albumTitle, activity.album_artist || activity.target?.artist)}</>;
            case 'REVIEW_ALBUM':
                return <>{userLink} {t('social.reviewedAlbum')} {albumLink(activity.album_title || activity.target?.albumTitle, activity.album_artist || activity.target?.artist)}</>;
            default:
                return <>{userLink} a interagi</>;
        }
    };

    return (
        <>
            <div className="social-item-wrapper">
                {isActorImageUrl ? (
                    <img src={actorAvatar} alt="Avatar" className="social-item-avatar" onError={(e) => e.target.style.display = "none"} />
                ) : actorAvatar ? (
                    <div className="social-item-avatar text-avatar">{actorAvatar}</div>
                ) : (
                    <div className="social-item-avatar text-avatar">👤</div>
                )}

                <div className="social-item-card">
                    <div className="social-item-header">
                        <p className="social-item-title">
                            {renderActionText()}
                            <span className="social-item-time">{activity.timeAgo || new Date(activity.created_at).toLocaleDateString()}</span>
                        </p>
                        <button className="social-item-like-btn">
                            <img src={likeNotLiked} alt="J'aime" className="action-icon" />
                        </button>
                    </div>

                    {SpecificContent && <SpecificContent activity={activity} />}

                    {!hideComments && (
                        <>
                            <div className="social-item-footer">
                                <button className="social-item-action-link" onClick={toggleComments}>
                                    {showComments ? t('social.hideComments') : t('social.viewComments')} {comments.length > 0 && `(${comments.length})`}
                                </button>
                                {!showComments && (
                                    <>
                                        <span className="social-item-dot">•</span>
                                        <button className="social-item-action-link" onClick={() => { setIsReplying(true); setShowComments(true); }}>
                                            {t('social.reply')}
                                        </button>
                                    </>
                                )}
                            </div>

                            {showComments && (() => {
                                const currentUserAvatar = user?.avatar_url || user?.avatar;
                                const isCurrentUserAvatarImage = currentUserAvatar && (currentUserAvatar.startsWith('http') || currentUserAvatar.startsWith('/') || currentUserAvatar.startsWith('data:image'));

                                return (
                                    <div className="comments-section">
                                        {comments.map((comment, index) => (
                                            <CommentItem
                                                key={comment.id}
                                                comment={comment}
                                                isLast={index === comments.length - 1 && !isReplying}
                                                currentUserId={user?.id || user?.user_id}
                                                onDelete={() => setCommentToDelete(comment.id)}
                                            />
                                        ))}

                                        {isReplying ? (
                                            <NewCommItem
                                                isLast={true}
                                                onCancel={() => setIsReplying(false)}
                                                onSubmit={handleCommentSubmit}
                                                isSubmitting={isSubmitting}
                                                userAvatar={currentUserAvatar}
                                            />
                                        ) : (
                                            <div className="comment-trigger-container" onClick={() => setIsReplying(true)}>
                                                <div className="comment-tree-line last"></div>

                                                {isCurrentUserAvatarImage ? (
                                                    <img src={currentUserAvatar} alt="Mon avatar" className="comment-avatar" />
                                                ) : currentUserAvatar ? (
                                                    <span className="comment-avatar text-avatar">{currentUserAvatar}</span>
                                                ) : (
                                                    <span className="comment-avatar text-avatar">👤</span>
                                                )}

                                                <div className="comment-trigger-input">
                                                    {t('social.addComment')}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </>
                    )}
                </div>
            </div>

            {commentToDelete && (
                <div className="social-modal-overlay" onClick={() => setCommentToDelete(null)}>
                    <div className="social-modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3 className="social-modal-title">Supprimer le commentaire ?</h3>
                        <div className="social-modal-actions">
                            <button className="social-modal-btn cancel" onClick={() => setCommentToDelete(null)}>
                                Annuler
                            </button>
                            <button className="social-modal-btn danger" onClick={confirmDeleteComment}>
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}