import { Link, useNavigate } from 'react-router-dom';
import './NotifsCard.css';
import iconNotif from '../../../../public/icons/notifsbar/notif.png';
import iconConversation from '../../../../public/icons/notifsbar/conversation.png';
import iconLogout from '../../../../public/icons/notifsbar/logout.png';
import logoResonate from '../../../../public/logoResonate.png';
import {useAuth} from "../../../context/AuthContext.jsx";
import {useEffect, useState, useCallback } from "react";
import NotifsModal from "./NotifsModal/NotifsModal.jsx";
import { getProfile } from "../../../api/auth.js";
import {notificationService} from "../../../api/notification.service.js";
import {useChatContext} from "../../../context/ChatContext.jsx";
import {chatService} from "../../../api/chat.service.js";

export default function NotifsCard() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [myAvatar, setMyAvatar] = useState(null);

    const [lastSeenUnreadCount, setLastSeenUnreadCount] = useState(() => {
        const saved = localStorage.getItem('lastSeenUnreadCount');
        return saved ? parseInt(saved, 10) : 0;
    });

    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [lastSeenUnreadChat, setLastSeenUnreadChat] = useState(() => {
        const saved = localStorage.getItem('lastSeenUnreadChat');
        return saved ? parseInt(saved, 10) : 0;
    });

    const { incomingChatEvent, incomingNotificationEvent } = useChatContext();
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (incomingNotificationEvent && incomingNotificationEvent.unread_count !== undefined) {
            setUnreadCount(incomingNotificationEvent.unread_count);

            notificationService.getNotifications()
                .then(setNotifications)
                .catch(console.error);
        }
    }, [incomingNotificationEvent]);

    useEffect(() => {
        const fetchNotificationsData = async () => {
            try {
                const dataNotifs = await notificationService.getNotifications();
                setNotifications(dataNotifs);

                const dataNotifsCount = await notificationService.getUnreadCount();
                const currentUnread = dataNotifsCount.unread_count;
                setUnreadCount(currentUnread);

                if (token && !myAvatar) {
                    const profileData = await getProfile(token);
                    if (profileData) {
                        setMyAvatar(profileData.avatar_url);
                    }
                }

                if (currentUnread < lastSeenUnreadCount) {
                    setLastSeenUnreadCount(currentUnread);
                    localStorage.setItem('lastSeenUnreadCount', currentUnread.toString());
                }
            } catch (err) {
                console.error("Erreur de récupération au niveau des notifications", err);
            }
        };

        fetchNotificationsData();
    }, [lastSeenUnreadCount, myAvatar, token]);

    const fetchChatUnreadCount = useCallback(async () => {
        try {
            const data = await chatService.getUnreadCount();
            const count = data.unread_count;
            setUnreadChatCount(count);

            if (count < lastSeenUnreadChat) {
                setLastSeenUnreadChat(count);
                localStorage.setItem('lastSeenUnreadChat', count.toString());
            }
        } catch (err) {
            console.error("Erreur de récupération au niveau des notifications de message", err);
        }
    }, [lastSeenUnreadChat]);

    useEffect(() => {
        const initializeChatCount = async () => {
            await fetchChatUnreadCount();
        };
        initializeChatCount();
    }, [fetchChatUnreadCount]);

    useEffect(() => {
        if (incomingChatEvent) {
            const updateChatCount = async () => {
                await fetchChatUnreadCount();
            };
            updateChatCount();
        }
    }, [incomingChatEvent, fetchChatUnreadCount]);

    const handleNotifButtonClick = () => {
        if (!isModalOpen) {
            setIsModalOpen(true);
            setLastSeenUnreadCount(unreadCount);
            localStorage.setItem('lastSeenUnreadCount', unreadCount.toString());
        } else {
            setIsModalOpen(false);
        }
    };

    const handleChatButtonClick = () => {
        setLastSeenUnreadChat(unreadChatCount);
        localStorage.setItem('lastSeenUnreadChat', unreadChatCount.toString());
        window.dispatchEvent(new CustomEvent('toggleChatModal'));
    };

    const handleReadSingle = async (id) => {
        try {
            await notificationService.markAsRead(id);

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );

            const newCount = Math.max(0, unreadCount - 1);
            setUnreadCount(newCount);
            setLastSeenUnreadCount(newCount);
            localStorage.setItem('lastSeenUnreadCount', newCount.toString());
        } catch (err) {
            console.error("Erreur lors du marquage comme lu sur la notification sélectionnée", err);
        }
    };

    const handleReadAll = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            setLastSeenUnreadCount(0);
            localStorage.setItem('lastSeenUnreadCount', '0');
        } catch (err) {
            console.error("Erreur lors du marquage comme lu des notifications", err);
        }
    };

    const onLogoutClick = () => {
        logout();
        navigate('/');
    };

    const showNotifBadge = unreadCount > lastSeenUnreadCount;
    const newNotifsCount = unreadCount - lastSeenUnreadCount;
    const showChatBadge = unreadChatCount > lastSeenUnreadChat;
    const newChatsCount = unreadChatCount - lastSeenUnreadChat;

    return (
        <div className="notifs-card-container">
            <button className="notif-card-btn" onClick={handleNotifButtonClick} onMouseDown={(e) => e.stopPropagation()}>
                <img src={iconNotif} alt="Notifications" className="notif-card-icon" />
                {showNotifBadge && <span className="notif-card-badge">{newNotifsCount}</span>}
            </button>

            <button className="notif-card-btn chat-wrapper" onClick={handleChatButtonClick}>
                <img src={iconConversation} alt="Messages" className="notif-card-icon" />
                {showChatBadge && <span className="notif-card-badge">{newChatsCount}</span>}
            </button>

            <button className="notif-card-btn" onClick={onLogoutClick}>
                <img src={iconLogout} alt="Se déconnecter" className="notif-card-icon" />
            </button>

            <Link to="/" className="notif-card-logo">
                <img src={logoResonate} alt="Accueil" className="notif-card-logo-img" />
            </Link>

            {isModalOpen && (
                <NotifsModal
                    notifications={notifications}
                    onClose={() => setIsModalOpen(false)}
                    onReadSingle={handleReadSingle}
                    onReadAll={handleReadAll}
                    myAvatar={myAvatar}
                />
            )}
        </div>
    );
}