import { useState, useRef, useEffect } from 'react';
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import { useAuth } from "../../../../../context/AuthContext.jsx";
import './NotifsItem.css';
import iconDefault from '../../../../../../public/icons/notifsbar/default.png';
import iconLike from '../../../../../../public/icons/notifsbar/like.png';
import iconComment from '../../../../../../public/icons/notifsbar/comment.png';
import iconFollow from '../../../../../../public/icons/notifsbar/follow.png';
import iconMenu from '../../../../../../public/icons/notifsbar/menu.png';

export default function NotifsItem({ notification, onRead, myAvatar }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const { user } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const formatTime = (dateString) => {
        if (!dateString) return "";

        const pastDate = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - pastDate) / 1000);

        if (diffInSeconds < 60) {
            return t('layout.timeJustNow');
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return t('layout.timeMinutesAgo').replace('{time}', diffInMinutes);
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return t('layout.timeHoursAgo').replace('{time}', diffInHours);
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            return t('layout.timeDaysAgo').replace('{time}', diffInDays);
        }

        const locale = t('layout.navHome') === 'Home' ? 'en-US' : 'fr-FR';

        return new Intl.DateTimeFormat(locale, {
            day: 'numeric',
            month: 'short'
        }).format(pastDate);
    };

    const renderMessage = () => {
        if (notification.message) {
            return <span className="notif-text-content">{notification.message}</span>;
        }

        const username = notification.related_user_username || t('layout.notifDefaultUser');

        switch (notification.type) {
            case "LIKE":
                return (
                    <span className="notif-text-content">
                        <strong>{username}</strong> {t('layout.notifLike')}
                    </span>
                );
            case "COMMENT":
                return (
                    <span className="notif-text-content">
                        <strong>{username}</strong> {t('layout.notifComment')}
                    </span>
                );
            case "FOLLOW":
                return (
                    <span className="notif-text-content">
                        <strong>{username}</strong> {t('layout.notifFollow')}
                    </span>
                );
            default:
                return <span className="notif-text-content">{t('layout.notifDefaultActivity')} <strong>{username}</strong></span>;
        }
    };

    const getOverlayIcon = () => {
        switch (notification.type) {
            case "LIKE":
                return <img src={iconLike} alt={t('layout.altLike')} className="overlay-icon-img" />;
            case "COMMENT":
                return <img src={iconComment} alt={t('layout.altComment')} className="overlay-icon-img" />;
            case "FOLLOW":
                return <img src={iconFollow} alt={t('layout.altFollow')} className="overlay-icon-img" />;
            default:
                return <img src={iconDefault} alt={t('layout.altDefault')} className="overlay-icon-img" />;
        }
    };

    const renderThumbnail = () => {
        if (notification.type === 'FOLLOW') {
            const isImageUrl = myAvatar && (myAvatar.startsWith('http') || myAvatar.startsWith('/') || myAvatar.startsWith('data:image'));

            return (
                <div className="avatar-preview">
                    {isImageUrl ? (
                        <img
                            src={myAvatar}
                            alt={t('layout.altAvatar')}
                            className="avatar-img"
                            onError={e => e.target.style.display = "none"}
                        />
                    ) : myAvatar ? (
                        <span className="avatar-emoji">{myAvatar}</span>
                    ) : (
                        <span className="avatar-placeholder">👤</span>
                    )}
                </div>
            );
        }

        return (
            <img
                src={"https://placehold.co/44x44/1a1a1a/ffffff?text=C"}
                alt={t('layout.altCover')}
                className="notif-thumbnail rounded"
            />
        );
    };

    const rawNotifAvatar = notification.related_user_avatar;
    const isNotifAvatarUrl = rawNotifAvatar && (rawNotifAvatar.startsWith('http') || rawNotifAvatar.startsWith('/') || rawNotifAvatar.startsWith('data:image'));

    return (
        <div className={`notifs-item-wrapper ${isMenuOpen ? 'menu-is-open' : ''}`}>
            {!notification.is_read && <div className="notif-pink-dot"></div>}

            <div
                className={`notifs-item-container ${notification.is_read ? 'read' : 'unread'}`}
                onClick={() => {
                    if (!notification.is_read) {
                        onRead(notification.id);
                    }
                    console.log("Navigation vers la page...");
                }}
            >
                <div className="notif-avatar-wrapper">
                    {isNotifAvatarUrl ? (
                        <img
                            src={rawNotifAvatar}
                            alt={t('layout.altAvatar')}
                            className="notif-item-avatar-img"
                            onError={e => e.target.style.display = "none"}
                        />
                    ) : rawNotifAvatar ? (
                        <span className="notif-item-avatar-emoji">{rawNotifAvatar}</span>
                    ) : (
                        <span className="notif-item-avatar-placeholder">👤</span>
                    )}
                    <div className="notif-type-overlay">{getOverlayIcon()}</div>
                </div>

                <div className="notif-body-content">
                    <div className="notif-message-line">{renderMessage()}</div>
                    <span className="notif-timestamp">{formatTime(notification.created_at)}</span>
                </div>

                <div className="notif-thumbnail-col">
                    {renderThumbnail()}
                </div>

                <div className="notif-action-col" ref={menuRef}>
                    <button
                        className="notif-item-menu-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(!isMenuOpen);
                        }}
                    >
                        <img src={iconMenu} alt={t('layout.altMenu')} className="item-menu-icon" />
                    </button>

                    {isMenuOpen && (
                        <div className="notifs-item-dropdown">
                            <button
                                className="notifs-item-dropdown-btn"
                                disabled={notification.is_read}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRead(notification.id);
                                    setIsMenuOpen(false);
                                }}
                            >
                                {t('layout.notifReadOne')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}