import { useState, useRef, useEffect } from 'react';
import './ChatConversation.css';
import HeaderChatConv from './HeaderChatConv/HeaderChatConv.jsx';
import MessageItem from './MessageItem/MessageItem.jsx';
import FooterChatConv from './FooterChatConv/FooterChatConv.jsx';
import { chatService } from '../../../../api/chat.service.js';

export default function ChatConversation({ conversationId, friend, onBack }) {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const loadMessagesAndMarkRead = async () => {
            if (!conversationId) return;
            try {
                const data = await chatService.getMessages(conversationId);
                setMessages(data);

                await chatService.markConversationRead(conversationId);
            } catch (error) {
                console.error("Erreur lors du chargement des messages", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadMessagesAndMarkRead();
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (content) => {
        try {
            const newMsg = await chatService.sendMessage(conversationId, content);
            setMessages(prevMessages => [...prevMessages, newMsg]);
        } catch (error) {
            console.error("Erreur lors de l'envoi du message", error);
        }
    };

    return (
        <div className="chat-conversation-container">
            <HeaderChatConv friend={friend} onBack={onBack} />

            <div className="chat-messages-area">
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        Chargement des messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        Dites bonjour à {friend?.name || friend?.username} !
                    </div>
                ) : (
                    messages.map(msg => (
                        <MessageItem
                            key={msg.id}
                            message={msg}
                            isMine={String(msg.sender_id) !== String(friend.id)}
                            friend={friend}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <FooterChatConv onSend={handleSendMessage} />
        </div>
    );
}