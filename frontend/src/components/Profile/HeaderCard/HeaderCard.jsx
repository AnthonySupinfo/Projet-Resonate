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

    // Modale de signalement utilisateur
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportLoading, setReportLoading] = useState(false);
    const [reportSuccess, setReportSuccess] = useState("");
    const [reportError, setReportError] = useState("");
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

    // Signalement d'un utilisateur — soumission de la modale
    const handleReportSubmit = async () => {
        if (!reportReason.trim()) return
        setReportLoading(true)
        setReportError("")
        try {
            const res = await authFetch(`${API_URL}/api/v1/users/${id}/report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: reportReason })
            })
            if (res.status === 409) {
                setReportError("Vous avez déjà signalé cet utilisateur.")
                return
            }
            if (!res.ok) throw new Error()
            setReportSuccess("Merci, l'utilisateur a été signalé à l'équipe de modération.")
            setReportReason("")
            setTimeout(() => { setReportModalOpen(false); setReportSuccess("") }, 2000)
        } catch {
            setReportError("Erreur lors du signalement.")
        } finally {
            setReportLoading(false)
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
                            <button className="header-icon-btn" onClick={() => { setReportModalOpen(true); setReportReason(""); setReportError(""); setReportSuccess("") }} title="Signaler cet utilisateur">
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

            {/* Modale de signalement utilisateur */}
            {reportModalOpen && (
                <div className="confirm-modal-overlay" onClick={() => setReportModalOpen(false)}>
                    <div className="confirm-modal" onClick={e => e.stopPropagation()} style={{ minWidth: "340px" }}>
                        <p className="confirm-modal-text">Signaler cet utilisateur</p>
                        <textarea
                            style={{ width: "100%", borderRadius: "12px", padding: "10px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-primary)", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", resize: "none", outline: "none", boxSizing: "border-box" }}
                            rows={3}
                            placeholder="Faux compte, arnaque, comportement abusif..."
                            value={reportReason}
                            onChange={e => setReportReason(e.target.value)}
                        />
                        {reportError && <p style={{ color: "#ff4b4b", fontSize: "0.85rem", margin: 0 }}>{reportError}</p>}
                        {reportSuccess && <p style={{ color: "#27ae60", fontSize: "0.85rem", margin: 0 }}>{reportSuccess}</p>}
                        <div className="confirm-modal-actions">
                            <button className="confirm-modal-cancel" onClick={() => setReportModalOpen(false)}>
                                Annuler
                            </button>
                            <button className="confirm-modal-confirm" onClick={handleReportSubmit} disabled={reportLoading || !reportReason.trim()}>
                                {reportLoading ? "..." : "Signaler"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}