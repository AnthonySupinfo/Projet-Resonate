import './MessageItem.css';

export default function MessageItem({ message, isMine, friend }) {
    const senderName = isMine ? "Moi" : (friend?.name || friend?.username);

    const senderAvatar = isMine
        ? "https://placehold.co/40x40/555/FFF?text=Me"
        : (friend?.avatarUrl || "https://placehold.co/40x40/555/FFF?text=U");

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
        <div className={`message-item-wrapper ${isMine ? 'mine' : 'theirs'}`}>
            <img src={senderAvatar} alt={senderName} className="message-avatar" />

            <div className="message-content-col">
                <div className="message-meta">
                    <span className="message-sender">{senderName}</span>
                    <span className="message-time">{formatTime(message.created_at)}</span>
                </div>
                <div className="message-bubble">
                    {message.content}
                </div>
            </div>
        </div>
    );
}