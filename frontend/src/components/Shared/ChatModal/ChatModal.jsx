import { useState, useEffect } from 'react';
import './ChatModal.css';
import ChatHeader from './ChatHeader/ChatHeader.jsx';
import ChatNewConv from './ChatNewConv/ChatNewConv.jsx';
import ChatConversation from './ChatConversation/ChatConversation.jsx';
import ChatConvList from './ChatConvList/ChatConvList.jsx';
import { useChatContext } from '../../../context/ChatContext.jsx';
import { chatService } from '../../../api/chat.service.js';

export default function ChatModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentView, setCurrentView] = useState('list');
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [activeFriend, setActiveFriend] = useState(null);

    const { incomingChatEvent } = useChatContext();

    useEffect(() => {
        if (incomingChatEvent && incomingChatEvent.type === 'new_message') {
            chatService.getConversations()
                .then(data => setConversations(data))
                .catch(console.error);
        }
    }, [incomingChatEvent]);

    useEffect(() => {
        if (isOpen) {
            const fetchConversations = async () => {
                try {
                    const data = await chatService.getConversations();
                    setConversations(data);
                } catch (error) {
                    console.error("Erreur de chargement des conversations", error);
                }
            };
            fetchConversations();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleToggle = () => setIsOpen(prev => !prev);

        window.addEventListener('toggleChatModal', handleToggle);

        return () => window.removeEventListener('toggleChatModal', handleToggle);
    }, []);

    const toggleChat = () => setIsOpen(!isOpen);

    const handleNewMessageClick = () => {
        if (!isOpen) setIsOpen(true);
        setCurrentView('new');
    };

    const handleCancelNew = () => setCurrentView('list');

    const handleOpenExistingConversation = (conversationId, friend) => {
        setActiveConversationId(conversationId);
        setActiveFriend(friend);
        setCurrentView('conversation');

        setConversations(prevConvs =>
            prevConvs.map(conv =>
                conv.conversation_id === conversationId
                    ? { ...conv, last_message_is_read: true }
                    : conv
            )
        );
    };

    const handleSendNew = (conversationId, friend) => {
        setActiveConversationId(conversationId);
        setActiveFriend(friend);
        setCurrentView('conversation');

        chatService.getConversations().then(data => setConversations(data)).catch(console.error);
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setActiveConversationId(null);
        setActiveFriend(null);

        chatService.getConversations()
            .then(data => setConversations(data))
            .catch(console.error);
    };

    return (
        <div className={`chat-modal-container ${isOpen ? 'open' : 'closed'}`}>
            <ChatHeader
                isOpen={isOpen}
                toggleChat={toggleChat}
                onNewMessageClick={handleNewMessageClick}
            />

            <div className="chat-modal-body">
                {isOpen && (
                    <>
                        {currentView === 'list' && (
                            <ChatConvList
                                conversations={conversations}
                                onSelectConversation={handleOpenExistingConversation}
                            />
                        )}

                        {currentView === 'new' && (
                            <ChatNewConv
                                conversations={conversations}
                                onCancel={handleCancelNew}
                                onOpenExisting={handleOpenExistingConversation}
                                onSendNew={handleSendNew}
                            />
                        )}

                        {currentView === 'conversation' && (
                            <ChatConversation
                                conversationId={activeConversationId}
                                friend={activeFriend}
                                onBack={handleBackToList}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}