import './ChatConvList.css';
import ChatConvItem from './ChatConvItem/ChatConvItem.jsx';

export default function ChatConvList({ conversations, onSelectConversation }) {

    const handleSelect = (conv) => {
        const friendData = {
            id: conv.other_user_id,
            username: conv.other_user_username,
            name: conv.other_user_username,
            avatarUrl: conv.other_user_avatar
        };
        onSelectConversation(conv.conversation_id, friendData);
    };

    if (!conversations || conversations.length === 0) {
        return (
            <div className="chat-conv-list-empty">
                <p>Aucune conversation pour le moment.</p>
                <span>Clique sur l'icône de message pour démarrer une discussion !</span>
            </div>
        );
    }

    return (
        <div className="chat-conv-list-container">
            {conversations.map(conv => (
                <ChatConvItem
                    key={conv.conversation_id}
                    conversation={conv}
                    onSelect={handleSelect}
                />
            ))}
        </div>
    );
}