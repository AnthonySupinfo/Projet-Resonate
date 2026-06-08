import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "../../../../../context/AuthContext.jsx";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import { feedService } from '../../../../../api/feed.service.js';
import './PlaylistBox.css';
import add from '../../../../../../public/icons/add.png';

export default function PlaylistBox({ activity }) {
    const { user: activityUser, target } = activity;
    const { user: currentUser } = useAuth();
    const { t } = useLanguage();

    const [isFollowing, setIsFollowing] = useState(target?.isFollowedByMe || false);
    const [isLoading, setIsLoading] = useState(false);

    const isMyPlaylist = currentUser && activityUser?.id === String(currentUser.user_id);

    const handleFollowToggle = async () => {
        if (isLoading || !target?.id || isMyPlaylist) return;

        setIsLoading(true);
        try {
            if (isFollowing) {
                await feedService.unfollowPlaylist(target.id);
                setIsFollowing(false);
            } else {
                await feedService.followPlaylist(target.id);
                setIsFollowing(true);
            }
        } catch (error) {
            console.error("Erreur lors de l'action sur la playlist", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="social-item-playlist-box">
            <Link to={`/library/playlists/${target.id}`}>
                <img
                    src={target.coverUrl || "https://placehold.co/64x64/222/FFF?text=P"}
                    alt={t('social.playlistCover')}
                    className="social-playlist-cover"
                />
            </Link>

            <div className="social-playlist-info">
                <h4 className="social-playlist-title">
                    <Link to={`/library/playlists/${target.id}`} className="social-playlist-link">
                        {target.name}
                    </Link>
                </h4>
                <p className="social-playlist-meta">
                    {t('social.byAuthor')} <Link to={`/user/${activityUser.id}`} className="social-playlist-user-link">
                    {activityUser.name}
                </Link> • {target.trackCount} {t('social.tracks')}
                </p>
            </div>

            {!isMyPlaylist && (
                <button
                    className={`social-playlist-add-btn ${isFollowing ? 'following' : ''}`}
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
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{t('social.addedStatus')}</span>
                    ) : (
                        <img src={add} alt={t('social.addIcon')} className="action-icon" />
                    )}
                </button>
            )}
        </div>
    );
}