import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "../../../context/AuthContext.jsx";
import { getProfile } from "../../../api/auth.js";
import modifyIcon from '../../../../public/icons/modify.png';
import './HeaderCard.css';

export default function HeaderCard() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        const loadProfile = async () => {
            if (token) {
                try {
                    const data = await getProfile(token);
                    if (data) setProfile(data);
                } catch (err) {
                    console.error("Erreur lors de la récupération du profil complet", err);
                }
            }
        };
        loadProfile();
    }, [token]);

    const currentUser = profile || user;

    if (!currentUser) {
        return <div className="header-card-container loading">Chargement du profil...</div>;
    }

    const myAvatar = currentUser.avatar_url;
    const isImageUrl = myAvatar && (myAvatar.startsWith('http') || myAvatar.startsWith('/') || myAvatar.startsWith('data:image'));
    const fullName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username;

    const joinedDate = currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString('fr-FR') : "22/02/2026";

    const formatWebsiteUrl = (url) => {
        if (!url) return null;
        return url.startsWith('http') ? url : `https://${url}`;
    };

    const websiteUrl = formatWebsiteUrl(currentUser.website);

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

                <Link to="/settings" className="header-edit-btn">
                    <img
                        src={modifyIcon}
                        alt="Modifier le profil"
                        className="edit-icon-img"
                    />
                    Modifier
                </Link>
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