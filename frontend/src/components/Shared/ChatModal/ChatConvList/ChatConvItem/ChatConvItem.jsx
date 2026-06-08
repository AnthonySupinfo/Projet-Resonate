import './ChatConvItem.css';
import { useLanguage } from '../../../../../context/LanguageContext.jsx';

export default function ChatConvItem({ conversation, onSelect }) {
    const { t, language } = useLanguage();

    const isUnread = conversation.last_message_is_read === false && conversation.last_message_sender_id === conversation.other_user_id;
    const rawAvatar = conversation.other_user_avatar;
    const displayName = conversation.other_user_username;

    const isImageUrl = rawAvatar && (rawAvatar.startsWith('http') || rawAvatar.startsWith('/') || rawAvatar.startsWith('data:image'));

    const formatTime = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "";
            return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return "";
        }
    };

    return (
        <div className="chat-conv-item-container" onClick={() => onSelect(conversation)}>
            <div className="chat-conv-avatar-wrapper">
                {isImageUrl ? (
                    <img
                        src={rawAvatar}
                        alt={displayName}
                        className="chat-conv-avatar-image"
                        onError={e => e.target.style.display = "none"}
                    />
                ) : rawAvatar ? (
                    <span className="chat-conv-avatar-emoji">{rawAvatar}</span>
                ) : (
                    <span className="chat-conv-avatar-placeholder">👤</span>
                )}
            </div>

            <div className="chat-conv-details">
                <div className="chat-conv-header">
                    <span className={`chat-conv-name ${isUnread ? 'unread' : ''}`}>{displayName}</span>
                    <span className={`chat-conv-time ${isUnread ? 'unread' : ''}`}>
                        {formatTime(conversation.last_message_date)}
                    </span>
                </div>

                <div className="chat-conv-message-row">
                    <span className={`chat-conv-last-msg ${isUnread ? 'unread' : ''}`}>
                        {conversation.last_message_sender_id !== conversation.other_user_id && conversation.last_message_content ? t('social.youPrefix') : ""}
                        {conversation.last_message_content || t('social.newConversation')}
                    </span>
                    {isUnread && <span className="chat-conv-unread-dot"></span>}
                </div>
            </div>
        </div>
    );
}