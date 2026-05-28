import { useState, useEffect, useRef } from 'react';
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import NotifsItem from './NotifsItem/NotifsItem';
import iconMenu from '../../../../../public/icons/notifsbar/menu.png';
import './NotifsModal.css';

export default function NotifsModal({ notifications, onClose, onReadSingle, onReadAll, myAvatar }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const modalRef = useRef(null);
    const menuRef = useRef(null);
    const { t } = useLanguage();

    useEffect(() => {
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        function handleMenuOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleMenuOutside);
        }
        return () => document.removeEventListener('mousedown', handleMenuOutside);
    }, [isMenuOpen]);

    return (
        <div className="notifs-modal-container" ref={modalRef}>
            <div className="notifs-modal-header">
                <h4 className="notifs-modal-title">{t('layout.notifTitle')}</h4>
                <div className="notifs-global-menu-wrapper" ref={menuRef}>
                    <button
                        className="notifs-modal-menu-trigger"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <img src={iconMenu} alt={t('layout.altMenu')} className="open-menu-icon" />
                    </button>
                    {isMenuOpen && (
                        <div className="notifs-context-dropdown">
                            <button
                                className="notifs-context-item"
                                onClick={() => {
                                    onReadAll();
                                    setIsMenuOpen(false);
                                }}
                            >
                                {t('layout.notifReadAll')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="notifs-modal-body">
                {notifications.length === 0 ? (
                    <div className="notifs-empty-state">{t('layout.notifEmpty')}</div>
                ) : (
                    notifications.map((notif) => (
                        <NotifsItem
                            key={notif.id}
                            notification={notif}
                            onRead={onReadSingle}
                            myAvatar={myAvatar}
                        />
                    ))
                )}
            </div>
        </div>
    );
}