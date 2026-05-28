import './UserCard.css';
import { Link } from 'react-router-dom';
import logoResonate from "../../../../public/logoResonate.png";

export default function UserCard() {
    return (
        <div className="user-card">
            <Link to="/profile" className="user-link"> {/*TODO: Remplacer vers la page profil quand elle sera faite*/}
                <div className="avatar-viewport">
                    <img
                        src={logoResonate} // TODO: Remplacer par l'avatar du user
                        alt="Avatar utilisateur"
                        className="avatar-image"
                    />
                </div>

                <div className="user-info">
                    <span className="user-name-text">John Doe</span>
                    <span className="user-username-text">@doejohn</span>
                </div>
            </Link>

            <div className="user-stats">
                <div className="stat-item">
                    <span className="stat-number">12</span>
                    <span className="stat-label">Followers</span>
                </div>

                <div className="stat-divider"></div>

                <div className="stat-item">
                    <span className="stat-number">8</span>
                    <span className="stat-label">Playlists</span>
                </div>

                <div className="stat-divider"></div>

                <div className="stat-item">
                    <span className="stat-number">489</span>
                    <span className="stat-label">Minutes<br/>d'écoute</span>
                </div>
            </div>
        </div>
    );
}