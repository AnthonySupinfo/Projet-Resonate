import './ChatHeader.css';
import newChat from '../../../../../public/icons/newChat.png';
import chevronUp from '../../../../../public/icons/chevronUp.png';
import chevronDown from '../../../../../public/icons/chevronDown.png';

export default function ChatHeader({ isOpen, toggleChat, onNewMessageClick }) {
    return (
        <div className="chat-header-container" onClick={toggleChat}>
            <div className="chat-header-left">
                <div className="chat-header-avatar-wrapper">
                    <img
                        src="https://placehold.co/40x40/555/FFF?text=Me"
                        alt="Mon avatar"
                        className="chat-header-avatar"
                    />
                    <span className="chat-status-dot"></span>
                </div>
                <h3 className="chat-header-title">Messagerie</h3>
            </div>

            <div className="chat-header-actions">
                <button
                    className="chat-action-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onNewMessageClick();
                    }}
                >
                    <img src={newChat} alt="Nouveau message" className="chat-action-icon" />
                </button>
                <button className="chat-action-btn">
                    <img
                        src={isOpen ? chevronDown : chevronUp}
                        alt="Toggle"
                        className="chat-action-icon chevron"
                    />
                </button>
            </div>
        </div>
    );
}