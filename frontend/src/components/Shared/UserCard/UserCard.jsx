import { useState, useEffect } from 'react';
import './UserCard.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../../context/AuthContext.jsx";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { getProfile, getUserStats } from "../../../api/auth.js";
import FollowUsersListModal from '../../Profile/HeaderCard/FollowUsersListModal/FollowUsersListModal.jsx';

export default function UserCard() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [fetchedUser, setFetchedUser] = useState(null);
    const [stats, setStats] = useState({ followers_count: 0, playlists_count: 0, reviews_count: 0 });
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'followers' });

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await getProfile();
                if (data) {
                    setFetchedUser(data);
                }
            } catch (err) {
                console.error(err);
            }
        };

        loadProfile();
        
        window.addEventListener("profileUpdated", loadProfile);

        return () => {
            window.removeEventListener("profileUpdated", loadProfile);
        };
    }, []);

    const currentUser = fetchedUser || user;

    useEffect(() => {
        const fetchStats = async () => {
            if (currentUser?.id) {
                try {
                    const data = await getUserStats(currentUser.id);
                    if (data) {
                        setStats(data);
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        };

        fetchStats();
    }, [currentUser?.id]);

    const myAvatar = currentUser?.avatar_url;
    const isImageUrl = myAvatar && (myAvatar.startsWith('http') || myAvatar.startsWith('/') || myAvatar.startsWith('data:image'));

    const fullName = currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : t('layout.loadingProfile');

    return (
        <>
            <div className="user-card">
                <Link to="/profile" className="user-link">
                    <div className="avatar-viewport">
                        {isImageUrl ? (
                            <img
                                src={myAvatar}
                                alt={`${t('layout.altAvatarOf')} ${fullName}`}
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
                    <div
                        className="stat-item"
                        onClick={() => setModalConfig({ isOpen: true, type: 'followers' })}
                        style={{ cursor: 'pointer' }}
                    >
                        <span className="stat-number">{stats.followers_count || 0}</span>
                        <span className="stat-label">{t('layout.statFollowers')}</span>
                    </div>

                    <div className="stat-divider"></div>

                    <div
                        className="stat-item"
                        onClick={() => navigate('/library/playlists')}
                        style={{ cursor: 'pointer' }}
                    >
                        <span className="stat-number">{stats.playlists_count || 0}</span>
                        <span className="stat-label">{t('layout.statPlaylists')}</span>
                    </div>

                    <div className="stat-divider"></div>

                    <div className="stat-item">
                        <span className="stat-number">{stats.listening_minutes || 0}</span>
                        <span className="stat-label">{t('layout.statMinutes')}<br/>{t('layout.statListening')}</span>
                    </div>
                </div>
            </div>

            <FollowUsersListModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                type={modalConfig.type}
                userId={currentUser?.id}
            />
        </>
    );
}