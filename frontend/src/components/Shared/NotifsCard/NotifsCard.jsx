import { Link, useNavigate } from 'react-router-dom';
import './NotifsCard.css';
import iconNotif from '../../../../public/icons/notifsbar/notif.png';
import iconConversation from '../../../../public/icons/notifsbar/conversation.png';
import iconLogout from '../../../../public/icons/notifsbar/logout.png';
import logoResonate from '../../../../public/logoResonate.png';
import {useAuth} from "../../../context/AuthContext.jsx";

export default function NotifsCard() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const onLogoutClick = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="notifs-card">
            <button className="notif-btn">
                <img src={iconNotif} alt="Notifications" className="notif-icon" />
            </button>

            <button className="notif-btn notif-badge-wrapper">
                <img src={iconConversation} alt="Messages" className="notif-icon" />
                {/*<span className="notif-badge">2</span>*/}
            </button>

            <button className="notif-btn" onClick={onLogoutClick}>
                <img src={iconLogout} alt="Se déconnecter" className="notif-icon" />
            </button>

            <Link to="/" className="notif-avatar">
                <img src={logoResonate} alt="Accueil" className="notif-avatar-image" />
            </Link>
        </div>
    );
}