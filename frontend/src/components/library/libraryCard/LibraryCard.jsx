import { useState } from 'react';
import './LibraryCard.css';

export default function LibraryCard() {
    const [activeTab, setActiveTab] = useState('playlists'); // state pour gérer l'onglet actif

    return (
        <div className="library-card-container">
            <h3 className="library-title">Librarie</h3>

            <div className="library-tabs">
                <button
                    className={`tab ${activeTab === 'playlists' ? 'active' : ''}`}
                    onClick={() => setActiveTab('playlists')}
                >
                    Playlists
                </button>
                <button
                    className={`tab ${activeTab === 'albums' ? 'active' : ''}`}
                    onClick={() => setActiveTab('albums')}
                >
                    Albums
                </button>
            </div>

            {activeTab === 'playlists' && (
                <ul className="library-list">
                    <li className='library-item'>
                        <div className="library-icon favorite">♥</div>
                        <div className="library-info">
                            <span className="library-name">Musique favorites</span>
                            <span className="library-meta">Playlist • 68 musiques</span>
                        </div>
                    </li>
                    <li className="library-item">
                        <div className="library-icon cover-placeholder">
                            <img src="https://placehold.co/40x40/1a1a1a/ffffff?text=K" alt="K-pop" />
                        </div>
                        <div className="library-info">
                            <span className="library-name">Top K-Pop</span>
                            <span className="library-meta">Playlist • 38 musiques</span>
                        </div>
                    </li>
                </ul>
            )}

            {activeTab === 'albums' && (
                <ul className="library-list">
                    <li className='library-item'>
                        <div className="library-icon cover-placeholder">
                            <img src="https://placehold.co/40x40/2a2a2c/ffffff?text=AL" alt="Album" />
                        </div>
                        <div className="library-info">
                            <span className="library-name">Albums likés</span>
                            <span className="library-meta">38 albums</span>
                        </div>
                    </li>
                </ul>
            )}
            <button className="create-btn">
                <span className="create-icon">+</span>Créer une playlist
            </button>
        </div>
    );
}