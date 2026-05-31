import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from "../../../context/AuthContext.jsx";
import { getProfile, getUserProfile } from "../../../api/auth.js";
import { feedService } from "../../../api/feed.service.js";
import modifyIcon from '../../../../public/icons/modify.png';
import reportIcon from '../../../../public/icons/report.png';
import './HeaderCard.css';

export default function HeaderCard() {
    const { id } = useParams();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);

    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
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
        return <div className="header-card-container loading">Chargement du profil...</div>;
    }

    const myAvatar = currentUser.avatar_url;
    const isImageUrl = typeof myAvatar === 'string' && (myAvatar.startsWith('http') || myAvatar.startsWith('/') || myAvatar.startsWith('data:image'));
    const fullName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username || "Utilisateur";

    const getJoinedDate = (dateStr) => {
        if (!dateStr) return "22/02/2026";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "22/02/2026";
            return d.toLocaleDateString('fr-FR');
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
            } else {
                await feedService.followUser(id);
                setIsFollowing(true);
            }
        } catch (error) {
            console.error("Erreur lors de l'action de follow", error);
        } finally {
            setIsFollowLoading(false);
        }
    };

    return (
        <div className="header-card-container">
            <div className="header-top-section">
                <div className="header-user-info-wrapper">

                    <div className="header-avatar-viewport">
                        {isImageUrl ? (
                            <img
                                src={myAvatar}
                                alt={`Avatar de ${fullName}`}
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
                            <span className="header-stat">12 followers</span>
                            <span className="header-stat-separator">•</span>
                            <span className="header-stat">18 following</span>
                        </div>

                        <span className="header-joined-date">Inscrit depuis le {joinedDate}</span>
                    </div>
                </div>

                {isMyProfile ? (
                    <Link to="/settings" className="header-action-btn">
                        <img
                            src={modifyIcon}
                            alt="Modifier le profil"
                            className="action-icon-img"
                        />
                        Modifier
                    </Link>
                ) : (
                    <div className="header-actions-group">
                        <button
                            className="header-action-btn follow-btn"
                            onClick={handleFollowToggle}
                            disabled={isFollowLoading}
                            style={{ opacity: isFollowLoading ? 0.7 : 1, cursor: isFollowLoading ? 'wait' : 'pointer' }}
                        >
                            {isFollowLoading ? "..." : isFollowing ? "Suivi" : "Suivre"}
                        </button>
                        <button className="header-icon-btn">
                            <img src={reportIcon} alt="Signaler" className="action-icon-img" />
                        </button>
                    </div>
                )}
            </div>

            <div className="header-bottom-section">
                <div className="info-row">
                    <span className="info-label">A propos :</span>
                    <p className="info-value">
                        {currentUser.bio || "Je suis un super utilisateur de Resonate, qui n'a pas encore de bio..."}
                    </p>
                </div>

                <div className="info-row">
                    <span className="info-label">Site web :</span>
                    {websiteUrl ? (
                        <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="info-value link">
                            {currentUser.website.replace(/^https?:\/\//, '')}
                        </a>
                    ) : (
                        <span className="info-value empty">Non renseigné</span>
                    )}
                </div>
            </div>
        </div>
    );
}