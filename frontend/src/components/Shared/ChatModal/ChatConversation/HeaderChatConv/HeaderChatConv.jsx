import './HeaderChatConv.css';
import chevronDown from '../../../../../../public/icons/chevronDown.png';

export default function HeaderChatConv({ friend, onBack }) {
    const friendName = friend?.name || friend?.username || 'Ami';
    const rawAvatar = friend?.avatarUrl;

    const isImageUrl = rawAvatar && (rawAvatar.startsWith('http') || rawAvatar.startsWith('/') || rawAvatar.startsWith('data:image'));

    return (
        <div className="header-chat-conv">
            <button className="header-chat-back-btn" onClick={onBack}>
                <img src={chevronDown} alt="Retour" className="back-icon" />
            </button>

            <div className="header-chat-friend-info">
                <div className="header-chat-avatar-wrapper">
                    {isImageUrl ? (
                        <img
                            src={rawAvatar}
                            alt={friendName}
                            className="header-chat-avatar-image"
                            onError={e => e.target.style.display = "none"}
                        />
                    ) : rawAvatar ? (
                        <span className="header-chat-avatar-emoji">{rawAvatar}</span>
                    ) : (
                        <span className="header-chat-avatar-placeholder">👤</span>
                    )}
                </div>
                <span className="header-chat-name">{friendName}</span>
            </div>
        </div>
    );
}