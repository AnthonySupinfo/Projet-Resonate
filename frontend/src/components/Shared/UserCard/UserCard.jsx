import { useState, useEffect } from 'react';
import './UserCard.css';
import { Link } from 'react-router-dom';
import { useAuth } from "../../../context/AuthContext.jsx";
import { getProfile } from "../../../api/auth.js";

export default function UserCard() {
    const { user } = useAuth();
    const [fetchedUser, setFetchedUser] = useState(null);
    const [stats, setStats] = useState({ followers_count: 0, playlists_count: 0, reviews_count: 0 });
    const token = localStorage.getItem("token");

    useEffect(() => {
        const loadProfile = async () => {
            if (token) {
                try {
                    const data = await getProfile(token);
                    if (data) {
                        setFetchedUser(data);
                    }
                } catch (err) {
                    console.error("Erreur lors de la récupération du profil", err);
                }
            }
        };

        loadProfile();
    }, [token]);

    const currentUser = fetchedUser || user;

    useEffect(() => {
        const fetchStats = async () => {
            if (currentUser?.id && token) {
                try {
                    const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://localhost";
                    const response = await fetch(`${baseUrl}/api/v1/users/${currentUser.id}/stats`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setStats(data);
                    }
                } catch (err) {
                    console.error("Erreur lors de la récupération des statistiques", err);
                }
            }
        };

        fetchStats();
    }, [currentUser?.id, token]);

    const myAvatar = currentUser?.avatar_url;
    const isImageUrl = myAvatar && (myAvatar.startsWith('http') || myAvatar.startsWith('/') || myAvatar.startsWith('data:image'));

    const fullName = currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : 'Chargement...';

    return (
        <div className="user-card">
            <Link to="/profile" className="user-link">
                <div className="avatar-viewport">
                    {isImageUrl ? (
                        <img
                            src={myAvatar}
                            alt={`Avatar de ${fullName}`}
                            className="avatar-image"
                            onError={e => e.target.style.display = "none"}
                        />
                    ) : myAvatar ? (
                        <span className="avatar-emoji">{myAvatar}</span>
                    ) : (
                        <span className="avatar-placeholder">👤</span>
                    )}
                </div>

                <div className="user-info">
                    <span className="user-name-text">{fullName}</span>
                    <span className="user-username-text">
                        {currentUser?.username ? `@${currentUser.username}` : ''}
                    </span>
                </div>
            </Link>

            <div className="user-stats">
                <div className="stat-item">
                    <span className="stat-number">{stats.followers_count || 0}</span>
                    <span className="stat-label">Followers</span>
                </div>

                <div className="stat-divider"></div>

                <div className="stat-item">
                    <span className="stat-number">{stats.playlists_count || 0}</span>
                    <span className="stat-label">Playlists</span>
                </div>

                <div className="stat-divider"></div>

                <div className="stat-item">
                    <span className="stat-number">489</span>
                    <span className="stat-label">Minutes<br/>d'écoute</span>
                </div>
            </div>
        </div>
    );
}