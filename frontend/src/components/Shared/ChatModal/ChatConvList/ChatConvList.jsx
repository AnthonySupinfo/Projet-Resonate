import './ChatConvList.css';
import ChatConvItem from './ChatConvItem/ChatConvItem.jsx';
import { useLanguage } from '../../../../context/LanguageContext.jsx';

export default function ChatConvList({ conversations, onSelectConversation }) {
    const { t } = useLanguage();

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
                <p>{t('social.noConversations')}</p>
                <span>{t('social.clickToStartConv')}</span>
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