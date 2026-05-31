import './HeaderChatConv.css';
import chevronDown from '../../../../../../public/icons/chevronDown.png';

export default function HeaderChatConv({ friend, onBack }) {
    const friendName = friend?.name || friend?.username || 'Ami';
    const friendAvatar = friend?.avatarUrl || "https://placehold.co/40x40/555/FFF?text=U";

    return (
        <div className="header-chat-conv">
            <button className="header-chat-back-btn" onClick={onBack}>
                <img src={chevronDown} alt="Retour" className="back-icon" />
            </button>

            <div className="header-chat-friend-info">
                <img src={friendAvatar} alt={friendName} className="header-chat-avatar" />
                <span className="header-chat-name">{friendName}</span>
            </div>
        </div>
    );
}