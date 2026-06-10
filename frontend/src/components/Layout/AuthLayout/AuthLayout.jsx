import { Outlet, useLocation } from "react-router-dom";
import FavoritePlaylistCard from "../../Shared/FavoritePlaylistCard/FavoritePlaylistCard";
import './AuthLayout.css';
import NavCard from "../../Shared/NavCard/NavCard.jsx";
import UserCard from "../../Shared/UserCard/UserCard.jsx";
import LibraryCard from "../../library/libraryCard/LibraryCard.jsx";
import NotifsCard from "../../Shared/NotifsCard/NotifsCard.jsx";
import SearchBar from "../../Shared/SearchBar/SearchBar.jsx";
import ChatModal from "../../Shared/ChatModal/ChatModal.jsx";
import {useNotificationSocket} from "../../../hooks/useNotificationSocket.js";
import {useAuth} from "../../../context/AuthContext.jsx";
import { ChatContext } from "../../../context/ChatContext.jsx";
import {useState} from "react";

export default function AuthLayout() {
    const location = useLocation();
    const { token } = useAuth();

    const [incomingChatEvent, setIncomingChatEvent] = useState(null);
    const [incomingNotificationEvent, setIncomingNotificationEvent] = useState(null);

    const handleIncomingWebsocketMessage = (data) => {
        console.log("WebSocket a reçu un message :", data);

        switch (data.type) {
            case 'new_message':
            case 'conversation_read':
                setIncomingChatEvent({ ...data, timestamp: Date.now() });
                break;

            case 'new_notification':
                setIncomingNotificationEvent({ ...data, timestamp: Date.now() });
                break;

            default:
                console.warn("Type de message inconnu :", data.type);
        }
    };

    useNotificationSocket(token, handleIncomingWebsocketMessage);

    const isHomePage = location.pathname === '/';
    const hasRightSidebar = location.pathname === '/' || location.pathname === '/social';

    return (
        <ChatContext.Provider value={{ incomingChatEvent, incomingNotificationEvent }}>
            <div className={`auth-layout ${!hasRightSidebar ? 'profile-mode' : ''} ${isHomePage ? 'home-mode' : ''}`}>
                <aside className="left-sidebar">
                    <UserCard />
                    <NavCard />
                    <LibraryCard />
                </aside>

                <div className="auth-topbar">
                    {!isHomePage && (
                        <SearchBar />
                    )}

                    <div className="notifs-wrapper">
                        <NotifsCard />
                    </div>
                </div>

                <main className="auth-content">
                    <Outlet />
                </main>

                {hasRightSidebar && (
                    <aside>
                        <FavoritePlaylistCard/>
                    </aside>
                )}

                <ChatModal />
            </div>
        </ChatContext.Provider>
    );
}