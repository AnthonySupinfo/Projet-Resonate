import { useState, useRef, useEffect } from 'react';
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
    console.log("Données du user connecté :", user);

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
        return "Il y a 2h";
    };

    const renderMessage = () => {
        if (notification.message) {
            return <span className="notif-text-content">{notification.message}</span>;
        }

        const username = notification.related_user_username || "Un utilisateur";

        switch (notification.type) {
            case "LIKE":
                return (
                    <span className="notif-text-content">
                        <strong>{username}</strong> aime votre contenu
                    </span>
                );
            case "COMMENT":
                return (
                    <span className="notif-text-content">
                        <strong>{username}</strong> a commenté votre publication
                    </span>
                );
            case "FOLLOW":
                return (
                    <span className="notif-text-content">
                        <strong>{username}</strong> vous suit
                    </span>
                );
            default:
                return <span className="notif-text-content">Nouvelle activité de <strong>{username}</strong></span>;
        }
    };

    const getOverlayIcon = () => {
        switch (notification.type) {
            case "LIKE":
                return <img src={iconLike} alt="Like" className="overlay-icon-img" />;
            case "COMMENT":
                return <img src={iconComment} alt="Comment" className="overlay-icon-img" />;
            case "FOLLOW":
                return <img src={iconFollow} alt="Follow" className="overlay-icon-img" />;
            default:
                return <img src={iconDefault} alt="Notif" className="overlay-icon-img" />;
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
                            alt="avatar"
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
                alt="Cover"
                className="notif-thumbnail rounded"
            />
        );
    };

    return (
        <div className={`notifs-item-wrapper ${isMenuOpen ? 'menu-is-open' : ''}`}>
            {!notification.is_read && <div className="notif-pink-dot"></div>}

            <div
                className={`notifs-item-container ${notification.is_read ? 'read' : 'unread'}`}
                onClick={() => {
                    console.log("Navigation vers la page..."); // ToDo : à remplacer quand les pages seront pretes
                }}
            >
                <div className="notif-avatar-wrapper">
                    <img
                        src={notification.related_user_avatar || "https://placehold.co/40x40/35313a/ffffff?text=U"}
                        alt=""
                        className="notif-item-avatar"
                    />
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
                        <img src={iconMenu} alt="Menu" className="item-menu-icon" />
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
                                Marquer comme lu
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}