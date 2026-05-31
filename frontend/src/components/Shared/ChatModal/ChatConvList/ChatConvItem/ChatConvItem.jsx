import './ChatConvItem.css';

export default function ChatConvItem({ conversation, onSelect }) {
    const isUnread = conversation.last_message_is_read === false && conversation.last_message_sender_id === conversation.other_user_id;
    const avatar = conversation.other_user_avatar || "https://placehold.co/40x40/555/FFF?text=U";
    const displayName = conversation.other_user_username;

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

    return (
        <div className="chat-conv-item-container" onClick={() => onSelect(conversation)}>
            <div className="chat-conv-avatar-wrapper">
                <img src={avatar} alt={displayName} className="chat-conv-avatar" />
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
                        {conversation.last_message_sender_id !== conversation.other_user_id && conversation.last_message_content ? "Vous : " : ""}
                        {conversation.last_message_content || "Nouvelle conversation"}
                    </span>
                    {isUnread && <span className="chat-conv-unread-dot"></span>}
                </div>
            </div>
        </div>
    );
}