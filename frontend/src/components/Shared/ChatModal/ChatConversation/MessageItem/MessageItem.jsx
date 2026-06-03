import { useState } from 'react';
import './MessageItem.css';
import modifyIcon from '../../../../../../public/icons/modify.png';

export default function MessageItem({ message, isMine, friend, myAvatar, onEditMessage, isLast }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);

    const senderName = isMine ? "Moi" : (friend?.name || friend?.username);

    const rawAvatar = isMine ? myAvatar : friend?.avatarUrl;
    const isImageUrl = rawAvatar && (rawAvatar.startsWith('http') || rawAvatar.startsWith('/') || rawAvatar.startsWith('data:image'));

    const formatTime = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "";
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return "";
        }
    };

    const handleSave = () => {
        const trimmedContent = editContent.trim();
        if (trimmedContent !== '' && trimmedContent !== message.content) {
            if (onEditMessage) {
                onEditMessage(message.id, trimmedContent);
            }
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditContent(message.content);
        }
    };

    return (
        <div className={`message-item-wrapper ${isMine ? 'mine' : 'theirs'}`}>
            <div className="message-avatar-wrapper">
                {isImageUrl ? (
                    <img
                        src={rawAvatar}
                        alt={senderName}
                        className="message-avatar-image"
                        onError={e => e.target.style.display = "none"}
                    />
                ) : rawAvatar ? (
                    <span className="message-avatar-emoji">{rawAvatar}</span>
                ) : (
                    <span className="message-avatar-placeholder">👤</span>
                )}
            </div>

            <div className="message-content-col">
                <div className="message-meta">
                    <span className="message-sender">{senderName}</span>
                    <span className="message-time">{formatTime(message.created_at)}</span>
                    {message.is_updated && <span className="message-edited-tag">(modifié)</span>}
                    {isMine && isLast && message.is_read && <span className="message-read-status">Lu</span>}
                </div>

                <div className="message-bubble-container">
                    {isEditing ? (
                        <div className="message-edit-container">
                            <input
                                type="text"
                                className="message-edit-input"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            <span className="message-edit-hint">Entrée pour valider, Échap pour annuler</span>
                        </div>
                    ) : (
                        <div className="message-bubble">
                            {message.content}
                        </div>
                    )}

                    {isMine && !isEditing && (
                        <button className="message-edit-btn" onClick={() => setIsEditing(true)}>
                            <img src={modifyIcon} alt="Modifier" className="message-edit-icon" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}