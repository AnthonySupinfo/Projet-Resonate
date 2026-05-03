import { NavLink } from 'react-router-dom';
import iconHomeUnselected from '../../../../public/icons/nav/accueil-unselected.png';
import iconHomeSelected from '../../../../public/icons/nav/accueil-selected.png';
import iconExploreUnselected from '../../../../public/icons/nav/explore-unselected.png';
import iconExploreSelected from '../../../../public/icons/nav/explore-selected.png';
import iconLoginUnselected from '../../../../public/icons/nav/login-unselected.png';
import iconLoginSelected from '../../../../public/icons/nav/login-selected.png';
import { useLanguage } from "../../../context/LanguageContext.jsx"
import './NavCard.css';

export default function NavCard() {
    const {t} = useLanguage();

    return (
        <div className="nav-card">
            <nav className="nav-menu">
                <NavLink
                    to="/"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                >
                    {({ isActive }) => (
                        <>
                            <span className="nav-text">{t('layout.navHome')}</span>
                            <img src={isActive ? iconHomeSelected : iconHomeUnselected} alt="" className="nav-icon" />
                        </>
                    )}
                </NavLink>

                <NavLink
                    to="/explore"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                >
                    {({ isActive }) => (
                        <>
                            <span className="nav-text">{t('layout.navExplore')}</span>
                            <img src={isActive ? iconExploreSelected : iconExploreUnselected} alt="" className="nav-icon" />
                        </>
                    )}
                </NavLink>

                <NavLink
                    to="/login"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                >
                    {({ isActive }) => (
                        <>
                            <span className="nav-text">{t('layout.navLogin')}</span>
                            <img src={isActive ? iconLoginSelected : iconLoginUnselected} alt="" className="nav-icon" />
                        </>
                    )}
                </NavLink>
            </nav>
        </div>
    );
}