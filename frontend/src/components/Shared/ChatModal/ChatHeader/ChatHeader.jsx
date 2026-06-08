import { useState, useEffect } from 'react';
import './ChatHeader.css';
import newChat from '../../../../../public/icons/newChat.png';
import chevronUp from '../../../../../public/icons/chevronUp.png';
import chevronDown from '../../../../../public/icons/chevronDown.png';
import { useAuth } from "../../../../context/AuthContext.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { getProfile } from "../../../../api/auth.js";

export default function ChatHeader({ isOpen, toggleChat, onNewMessageClick }) {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [fetchedUser, setFetchedUser] = useState(null);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await getProfile();
                if (data) {
                    setFetchedUser(data);
                }
            } catch (err) {
                console.error("Erreur lors de la récupération du profil dans ChatHeader", err);
            }
        };

        loadProfile();
    }, []);

    const currentUser = fetchedUser || user;
    const myAvatar = currentUser?.avatar_url || currentUser?.avatar;
    const isImageUrl = myAvatar && (myAvatar.startsWith('http') || myAvatar.startsWith('/') || myAvatar.startsWith('data:image'));

    return (
        <div className="chat-header-container" onClick={toggleChat}>
            <div className="chat-header-left">
                <div className="chat-header-avatar-wrapper">
                    {isImageUrl ? (
                        <img
                            src={myAvatar}
                            alt={t('social.myAvatar')}
                            className="chat-header-avatar-image"
                            onError={e => e.target.style.display = "none"}
                        />
                    ) : myAvatar ? (
                        <span className="chat-header-avatar-emoji">{myAvatar}</span>
                    ) : (
                        <span className="chat-header-avatar-placeholder">👤</span>
                    )}
                    <span className="chat-status-dot"></span>
                </div>
                <h3 className="chat-header-title">{t('social.chatTitle')}</h3>
            </div>

            <div className="chat-header-actions">
                <button
                    className="chat-action-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onNewMessageClick();
                    }}
                >
                    <img src={newChat} alt={t('social.newMessage')} className="chat-action-icon" />
                </button>
                <button className="chat-action-btn">
                    <img
                        src={isOpen ? chevronDown : chevronUp}
                        alt={t('social.toggleChat')}
                        className="chat-action-icon chevron"
                    />
                </button>
            </div>
        </div>
    );
}