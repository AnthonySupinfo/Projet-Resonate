import { useState, useEffect } from 'react';
import './ChatNewConv.css';
import FriendItem from './FriendItem/FriendItem.jsx';
import chevronDown from '../../../../../public/icons/chevronDown.png';
import { chatService } from '../../../../api/chat.service.js';

export default function ChatNewConv({ onCancel, onOpenExisting, onSendNew, conversations }) {
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [messageContent, setMessageContent] = useState("");
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const loadFriends = async () => {
            try {
                const data = await chatService.getMutualFriends();
                setFriends(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadFriends();
    }, []);

    const handleSelectFriend = (friend) => {
        setIsDropdownOpen(false);

        const existingConv = conversations.find(c => String(c.other_user_id) === String(friend.id));

        if (existingConv) {
            onOpenExisting(existingConv.conversation_id, friend);
        } else {
            setSelectedFriend(friend);
            setMessageContent("");
        }
    };

    const handleSendClick = async () => {
        if (selectedFriend && messageContent.trim() !== "") {
            setIsSending(true);
            try {
                const convData = await chatService.startConversation(selectedFriend.id);
                await chatService.sendMessage(convData.conversation_id, messageContent.trim());
                onSendNew(convData.conversation_id, selectedFriend);
            } catch (error) {
                console.error("Erreur lors de l'envoi du premier message", error);
            } finally {
                setIsSending(false);
            }
        }
    };

    return (
        <div className="chat-new-conv-container">
            <div className="new-conv-header">
                <span className="new-conv-label">À :</span>
                <div className="new-conv-selector">
                    <div
                        className="selector-trigger"
                        onClick={() => !isLoading && setIsDropdownOpen(!isDropdownOpen)}
                    >
                        {isLoading ? (
                            <span className="selector-value placeholder">Chargement...</span>
                        ) : selectedFriend ? (
                            <span className="selector-value selected">
                                {`${selectedFriend.first_name || ''} ${selectedFriend.last_name || ''}`.trim() || selectedFriend.username}
                            </span>
                        ) : (
                            <span className="selector-value placeholder">Choisir un ami...</span>
                        )}
                        <img
                            src={chevronDown}
                            alt="Ouvrir"
                            className={`selector-icon ${isDropdownOpen ? 'open' : ''}`}
                        />
                    </div>

                    {isDropdownOpen && (
                        <div className="selector-dropdown">
                            {friends.length === 0 ? (
                                <div style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Aucun ami mutuel trouvé
                                </div>
                            ) : (
                                friends.map(friend => (
                                    <FriendItem
                                        key={friend.id}
                                        friend={friend}
                                        onSelect={handleSelectFriend}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {selectedFriend && (
                <>
                    <div className="new-conv-body">
                        <textarea
                            className="new-conv-input-main"
                            placeholder="Écris ton premier message ici..."
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            disabled={isSending}
                        ></textarea>
                    </div>

                    <div className="new-conv-footer-compact">
                        <div className="new-conv-actions">
                            <button className="new-conv-btn cancel" onClick={onCancel} disabled={isSending}>
                                Annuler
                            </button>
                            <button
                                className="new-conv-btn send"
                                onClick={handleSendClick}
                                disabled={!selectedFriend || messageContent.trim() === "" || isSending}
                            >
                                {isSending ? "Envoi..." : "Envoyer"}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}