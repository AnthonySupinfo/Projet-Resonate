import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from "../../../context/AuthContext.jsx";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { getProfile, getUserProfile, authFetch } from "../../../api/auth.js";
import { feedService } from "../../../api/feed.service.js";
import modifyIcon from '../../../../public/icons/modify.png';
import reportIcon from '../../../../public/icons/report.png';
import FollowUsersListModal from './FollowUsersListModal/FollowUsersListModal.jsx';
import './HeaderCard.css';

const API_URL = import.meta.env.VITE_API_URL || ""

export default function HeaderCard() {
    const { id } = useParams();
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [profile, setProfile] = useState(null);

    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'followers' });
    const token = localStorage.getItem("token");

    const isMyProfile = !id || (user && id === String(user.id));
    const currentUser = isMyProfile ? (profile || user) : profile;

    useEffect(() => {
        const loadProfile = async () => {
            if (token) {
                try {
                    if (isMyProfile) {
                        const data = await getProfile(token);
                        if (data) setProfile(data);
                    } else {
                        const data = await getUserProfile(id);
                        if (data) {
                            setProfile(data);
                            setIsFollowing(data.is_followed_by_me || false);
                        }
                    }
                } catch (err) {
                    console.error("Erreur lors de la récupération du profil", err);
                }
            }
        };
        loadProfile();
    }, [token, id, isMyProfile]);

    if (!currentUser) {
        return <div className="header-card-container loading">{t('userProfile.loadingProfile')}</div>;
    }

    const myAvatar = currentUser.avatar_url;
    const isImageUrl = typeof myAvatar === 'string' && (myAvatar.startsWith('http') || myAvatar.startsWith('/') || myAvatar.startsWith('data:image'));
    const fullName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username || t('userProfile.defaultUser');

    const getJoinedDate = (dateStr) => {
        if (!dateStr) return "22/02/2026";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "22/02/2026";
            return d.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR');
        } catch {
            return "22/02/2026";
        }
    };
    const joinedDate = getJoinedDate(currentUser.created_at);

    const formatWebsiteUrl = (url) => {
        if (!url || typeof url !== 'string') return null;
        return url.startsWith('http') ? url : `https://${url}`;
    };

    const websiteUrl = formatWebsiteUrl(currentUser.website);

    const handleFollowToggle = async () => {
        if (isFollowLoading) return;
        setIsFollowLoading(true);
        try {
            if (isFollowing) {
                await feedService.unfollowUser(id);
                setIsFollowing(false);
                setProfile(prev => ({...prev, followers_count: Math.max(0, (prev.followers_count || 0) - 1)}));
            } else {
                await feedService.followUser(id);
                setIsFollowing(true);
                setProfile(prev => ({...prev, followers_count: (prev.followers_count || 0) + 1}));
            }
        } catch (error) {
            console.error("Erreur lors de l'action de follow", error);
        } finally {
            setIsFollowLoading(false);
        }
    };

    // Signalement d'un utilisateur
    const handleReportUser = async () => {
        const reason = window.prompt("Pourquoi signalez-vous cet utilisateur ? (Faux compte, arnaque, comportement abusif...)")
        if (!reason) return
        try {
            const res = await authFetch(`${API_URL}/api/v1/users/${id}/report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason })
            })
            if (res.status === 409) {
                alert("Vous avez déjà signalé cet utilisateur.")
                return
            }
            if (!res.ok) throw new Error()
            alert("Merci, l'utilisateur a été signalé à l'équipe de modération.")
        } catch {
            alert("Erreur lors du signalement.")
        }
    }

    return (
        <>
            <div className="header-card-container">
                <div className="header-top-section">
                    <div className="header-user-info-wrapper">

                        <div className="header-avatar-viewport">
                            {isImageUrl ? (
                                <img
                                    src={myAvatar}
                                    alt={`${t('userProfile.avatarOf')} ${fullName}`}
                                    className="header-avatar-image"
                                    onError={e => e.target.style.display = "none"}
                                />
                            ) : myAvatar ? (
                                <span className="header-avatar-emoji">{myAvatar}</span>
                            ) : (
                                <span className="header-avatar-placeholder">👤</span>
                            )}
                        </div>

                        <div className="header-user-details">
                            <h1 className="header-fullname">{fullName}</h1>
                            <span className="header-username">@{currentUser.username}</span>

                            <div className="header-stats-row">
                                <span
                                    className="header-stat clickable"
                                    onClick={() => setModalConfig({ isOpen: true, type: 'followers' })}
                                >
                                    {currentUser.followers_count || 0} {t('userProfile.followers')}
                                </span>
                                <span className="header-stat-separator">•</span>
                                <span
                                    className="header-stat clickable"
                                    onClick={() => setModalConfig({ isOpen: true, type: 'following' })}
                                >
                                    {currentUser.following_count || 0} {t('userProfile.following')}
                                </span>
                            </div>

                            <span className="header-joined-date">{t('userProfile.joinedSince')} {joinedDate}</span>
                        </div>
                    </div>

                    {isMyProfile ? (
                        <Link to="/settings" className="header-action-btn">
                            <img
                                src={modifyIcon}
                                alt={t('userProfile.altModify')}
                                className="action-icon-img"
                            />
                            {t('userProfile.modifyBtn')}
                        </Link>
                    ) : (
                        <div className="header-actions-group">
                            <button
                                className="header-action-btn follow-btn"
                                onClick={handleFollowToggle}
                                disabled={isFollowLoading}
                                style={{ opacity: isFollowLoading ? 0.7 : 1, cursor: isFollowLoading ? 'wait' : 'pointer' }}
                            >
                                {isFollowLoading ? "..." : isFollowing ? t('userProfile.followed') : t('userProfile.follow')}
                            </button>
                            {/* Bouton signaler un utilisateur */}
                            <button className="header-icon-btn" onClick={handleReportUser} title="Signaler cet utilisateur">
                                <img src={reportIcon} alt={t('userProfile.altReport')} className="action-icon-img" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="header-bottom-section">
                    <div className="info-row">
                        <span className="info-label">{t('userProfile.aboutLabel')}</span>
                        <p className="info-value">
                            {currentUser.bio || t('userProfile.defaultBio')}
                        </p>
                    </div>

                    <div className="info-row">
                        <span className="info-label">{t('userProfile.websiteLabel')}</span>
                        {websiteUrl ? (
                            <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="info-value link">
                                {currentUser.website.replace(/^https?:\/\//, '')}
                            </a>
                        ) : (
                            <span className="info-value empty">{t('userProfile.notProvided')}</span>
                        )}
                    </div>
                </div>
            </div>
            <FollowUsersListModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                type={modalConfig.type}
                userId={currentUser.id}
            />
        </>
    );
}