import { useState, useRef, useEffect } from 'react';
import './ChatConversation.css';
import HeaderChatConv from './HeaderChatConv/HeaderChatConv.jsx';
import MessageItem from './MessageItem/MessageItem.jsx';
import FooterChatConv from './FooterChatConv/FooterChatConv.jsx';
import { chatService } from '../../../../api/chat.service.js';
import { useChatContext } from "../../../../context/ChatContext.jsx";
import { getProfile } from '../../../../api/auth.js';

export default function ChatConversation({ conversationId, friend, onBack }) {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const { incomingChatEvent } = useChatContext();
    const [myAvatar, setMyAvatar] = useState(null);

    useEffect(() => {
        const loadMyProfile = async () => {
            try {
                const data = await getProfile();
                if (data) {
                    setMyAvatar(data.avatar_url || data.avatar);
                }
            } catch (err) {
                console.error("Erreur de récupération du profil dans ChatConversation", err);
            }
        };
        loadMyProfile();
    }, []);

    useEffect(() => {
        if (!incomingChatEvent) return;

        if (incomingChatEvent.conversation_id === conversationId) {
            if (incomingChatEvent.type === 'new_message') {
                setMessages(prevMessages => {
                    const exists = prevMessages.some(m => m.id === incomingChatEvent.message.id);
                    if (exists) return prevMessages;

                    return [...prevMessages, incomingChatEvent.message];
                });

                chatService.markConversationRead(conversationId).catch(console.error);
            } else if (incomingChatEvent.type === 'message_updated') {
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.id === incomingChatEvent.message.id ? incomingChatEvent.message : msg
                    )
                );
            } else if (incomingChatEvent.type === 'conversation_read') {
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        String(msg.sender_id) !== String(friend.id) ? { ...msg, is_read: true } : msg
                    )
                );
            }
        }
    }, [incomingChatEvent, conversationId, friend.id]);

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

    const handleEditMessage = async (messageId, newContent) => {
        try {
            const updatedMsg = await chatService.editMessage(messageId, newContent);
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.id === messageId ? updatedMsg : msg
                )
            );
        } catch (error) {
            console.error("Erreur lors de la modification du message", error);
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
                    messages.map((msg, index) => (
                        <MessageItem
                            key={msg.id}
                            message={msg}
                            isMine={String(msg.sender_id) !== String(friend.id)}
                            friend={friend}
                            myAvatar={myAvatar}
                            onEditMessage={handleEditMessage}
                            isLast={index === messages.length - 1}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <FooterChatConv onSend={handleSendMessage} />
        </div>
    );
}