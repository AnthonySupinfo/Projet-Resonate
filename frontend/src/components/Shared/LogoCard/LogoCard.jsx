import { Link } from 'react-router-dom';
import logoResonate from '../../../../public/logoResonate.png';
import './LogoCard.css';

export default function LogoCard() {
    return (
        <div className="logo-card">
            <Link to="/" className="logo-link">
                <div className="logo-viewport">
                    <img
                        src={logoResonate}
                        alt="Logo Resonate"
                        className="logo-image"
                    />
                </div>
                <span className="logo-text">Resonate</span>
            </Link>
        </div>
    );
}