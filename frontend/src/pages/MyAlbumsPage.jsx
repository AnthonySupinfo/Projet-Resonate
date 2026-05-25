import { useState, useEffect } from 'react';
import AlbumCard from '../components/library/albumCard/AlbumCard';
import { getMyLibrary } from '../api/api';
import './MyAlbumsPage.css';

export default function MyAlbumsPage() {
    const [library, setLibrary] = useState([]);
    const [activeTab, setActiveTab] = useState('ALL');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLibrary = async () => {
            setIsLoading(true);
            try {
                const data = await getMyLibrary();
                setLibrary(data);
            } catch(error) {
                console.error("Erreur chargement bibliothèque", error)
            }finally {
                setIsLoading(false);
            }
        };
        fetchLibrary();
    }, []);

    // Filtre selon l'onglet actif
    const filteredLibrary = activeTab === 'ALL'
        ? library 
        : library.filter(item => item.status === activeTab );

    const tabs = [
        { id: 'ALL', label: 'Tout voir' },
        { id: 'PLANNED', label: 'À écouter' },
        { id: 'LISTENING', label: 'En cours' },
        { id: 'COMPLETED', label: 'Terminé' },
        { id: 'DROPPED', label: 'Abandonné' },
    ];

    return (
        <div className="my-album-page">
            <div className="topbar-placeholder"></div>
            <h2 className="page-title">Ma bibliothèque d'albums</h2>

            <div className="status-tabs">
                {tabs.map(tab => (
                    <button key={tab.id} className={`tab-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
                ))}
            </div>

            {isLoading ? (
                <div className="loading-state">Chargement de votre collection...</div>
            ) : (
                <div className="albums-grid">
                    {filteredLibrary.length > 0 ? (
                        filteredLibrary.map(item => (
                            <div key={item.id} className="album-item-container">
                                <AlbumCard album={item.album || item} />
                                {item.rating && <span className="personal-note">Ma note : {item.rating}/5</span>}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">Aucun album dans cette catégorie.</div>
                    )}
                </div>
            )}
        </div>
    );
}