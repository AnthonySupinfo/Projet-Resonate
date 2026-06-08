import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { feedService } from '../../../../api/feed.service.js';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './FollowUsersListModal.css';

export default function FollowUsersListModal({ isOpen, onClose, type, userId }) {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useLanguage();

    // Utilisation des traductions pour le titre
    const title = type === 'followers' ? t('userProfile.followersListTitle') : t('userProfile.followingListTitle');

    useEffect(() => {
        if (!isOpen || !userId) return;

        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const data = type === 'followers'
                    ? await feedService.getFollowers(userId)
                    : await feedService.getFollowing(userId);

                setUsers(data);
            } catch (error) {
                console.error("Erreur lors de la récupération de la liste", error);
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [isOpen, userId, type]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="follow-modal-content" onClick={e => e.stopPropagation()}>
                <div className="follow-modal-header">
                    <h2>{title}</h2>
                    <button
                        className="close-modal-btn"
                        onClick={onClose}
                        title={t('userProfile.closeModal')}
                    >
                        ✕
                    </button>
                </div>

                <div className="follow-modal-body">
                    {isLoading ? (
                        <p className="follow-modal-empty">{t('userProfile.loadingUsers')}</p>
                    ) : users.length === 0 ? (
                        <p className="follow-modal-empty">{t('userProfile.noUsersFound')}</p>
                    ) : (
                        <ul className="follow-modal-list">
                            {users.map(user => {
                                const rawAvatar = user.avatar_url || user.avatar;
                                const isImageUrl = rawAvatar && (rawAvatar.startsWith('http') || rawAvatar.startsWith('/') || rawAvatar.startsWith('data:image'));

                                return (
                                    <li key={user.id}>
                                        <Link to={`/user/${user.id}`} className="follow-modal-item" onClick={onClose}>
                                            <div className="follow-modal-avatar">
                                                {isImageUrl ? (
                                                    <img
                                                        src={rawAvatar}
                                                        alt={`${t('userProfile.avatarOf')} ${user.username}`}
                                                        onError={(e) => (e.target.style.display = "none")}
                                                    />
                                                ) : rawAvatar ? (
                                                    <span>{rawAvatar}</span>
                                                ) : (
                                                    <span className="placeholder">👤</span>
                                                )}
                                            </div>
                                            <span className="follow-modal-username">@{user.username}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}