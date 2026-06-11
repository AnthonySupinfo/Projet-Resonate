import { useState, useEffect } from 'react';
import AlbumCard from '../components/library/albumCard/AlbumCard';
import { getMyLibrary } from '../api/api';
import { useLanguage } from '../context/LanguageContext.jsx';
import './MyAlbumsPage.css';

export default function MyAlbumsPage() {
    const { t } = useLanguage();
    const [library, setLibrary] = useState([]);
    const [activeTab, setActiveTab] = useState('ALL');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLibrary = async () => {
            setIsLoading(true);
            try {
                const data = await getMyLibrary(activeTab !== 'ALL' ? activeTab : null);
                setLibrary(data);
            } catch(error) {
                console.error("Erreur chargement bibliothèque", error)
            } finally {
                setIsLoading(false);
            }
        };
        fetchLibrary();
    }, [activeTab]);

    const filteredLibrary = library;

    const tabs = [
        { id: 'ALL', label: t('album.all') },
        { id: 'PLANNED', label: t('album.planned') },
        { id: 'LISTENING', label: t('album.listening') },
        { id: 'COMPLETED', label: t('album.completed') },
        { id: 'DROPPED', label: t('album.dropped') },
    ];

    return (
        <div className="my-album-page">
            <div className="topbar-placeholder"></div>
            <h2 className="page-title">{t('album.myAlbumsTitle')}</h2>

            <div className="status-tabs">
                {tabs.map(tab => (
                    <button key={tab.id} className={`tab-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
                ))}
            </div>

            {isLoading ? (
                <div className="loading-state">{t('album.loadingCollection')}</div>
            ) : (
                <div className="albums-grid">
                    {filteredLibrary.length > 0 ? (
                        filteredLibrary.map(item => (
                            <div key={item.id} className="album-item-container">
                                <AlbumCard album={item.album || item} />
                                {item.rating && <span className="personal-note">{t('album.myRating')}{item.rating}/5</span>}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">{t('album.emptyCategory')}</div>
                    )}
                </div>
            )}
        </div>
    );
}