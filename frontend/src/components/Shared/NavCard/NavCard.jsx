import './NavCard.css';
import { NavLink } from 'react-router-dom';
import { useLanguage } from "../../../context/LanguageContext.jsx"
import { useAuth } from "../../../context/AuthContext.jsx";

import iconHomeUnselected from '../../../../public/icons/nav/accueil-unselected.png';
import iconHomeSelected from '../../../../public/icons/nav/accueil-selected.png';
import iconExploreUnselected from '../../../../public/icons/nav/explore-unselected.png';
import iconExploreSelected from '../../../../public/icons/nav/explore-selected.png';
import iconLoginUnselected from '../../../../public/icons/nav/login-unselected.png';
import iconSocialUnselected from '../../../../public/icons/nav/social-unselected.png';
import iconSocialSelected from '../../../../public/icons/nav/social-selected.png';
import iconFavoritesUnselected from '../../../../public/icons/nav/favorites-unselected.png';
import iconFavoritesSelected from '../../../../public/icons/nav/favorites-selected.png';


export default function NavCard() {
    const {t} = useLanguage();
    const { user } = useAuth();

    return (
        <div className="nav-card">
            <nav className="nav-menu">
                {/*Liens communs*/}
                <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    {({ isActive }) => (
                        <>
                            <span className="nav-text">{t('layout.navHome')}</span>
                            <img src={isActive ? iconHomeSelected : iconHomeUnselected} alt="" className="nav-icon" />
                        </>
                    )}
                </NavLink>

                <NavLink to="/explore" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    {({ isActive }) => (
                        <>
                            <span className="nav-text">{t('layout.navExplore')}</span>
                            <img src={isActive ? iconExploreSelected : iconExploreUnselected} alt="" className="nav-icon" />
                        </>
                    )}
                </NavLink>


                {user ? (
                    <>
                        {/*User connecté*/}
                        <NavLink to="/social" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                            {({ isActive }) => (
                                <>
                                    <span className="nav-text">{t('layout.navSocial')}</span>
                                    <img src={isActive ? iconSocialSelected : iconSocialUnselected} alt="" className="nav-icon" />
                                </>
                            )}
                        </NavLink>

                        <NavLink to="/library" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                            {({ isActive }) => (
                                <>
                                    <span className="nav-text">{t('layout.navFav')}</span>
                                    <img src={isActive ? iconFavoritesSelected : iconFavoritesUnselected} alt="" className="nav-icon" />
                                </>
                            )}
                        </NavLink>
                    </>
                ) : (
                    // User déconnecté
                    <NavLink to="/login" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        {({ isActive }) => (
                            <>
                                <span className="nav-text">{t('layout.navLogin')}</span>
                                <img src={iconLoginUnselected} alt="" className="nav-icon" />
                            </>
                        )}
                    </NavLink>
                )}


            </nav>
        </div>
    );
}