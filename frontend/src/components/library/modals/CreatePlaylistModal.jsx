import { useState } from 'react';
import './CreatePlaylistModal.css';
import { createPlaylist } from '../../../api/api';
import { useLanguage } from '../../../context/LanguageContext.jsx';

export default function CreatePlaylistModal({ isOpen, onClose, onPlaylistCreated }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { t } = useLanguage();

    if(!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(!name.trim()) {
            setError(t('library.nameRequired'));
            return;
        }

        setIsLoading(true);
        setError('');

        try { // appelle API backend
            const newPlaylist = await createPlaylist({
                name: name,
                description: description,
                is_public: isPublic
            });

            //vide le formulaire
            setName('');
            setDescription('');
            setIsPublic(false);

            if (onPlaylistCreated) {
                onPlaylistCreated(newPlaylist);
            }

            //ferme la modale
            onClose();
        } catch(err) {
            setError(t('library.creationError'));
        } finally {
            setIsLoading(false);
        }
    };

    //permet fermer le modale dès qu'on clique sur la page arrière
    const handleOverlayClick = (e) => {
        if (e.target.className === 'modal-overlay') {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content">
                <h2 className="modal-title">{t('library.createNewPlaylist')}</h2>
                {error && <div className="modal-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="playlist-name">{t('library.nameLabel')}</label>
                        <input
                            id="playlist-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('library.namePlaceholder')}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="playlist-desc">{t('library.descLabel')}</label>
                        <textarea
                            id="playlist-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('library.descPlaceholder')}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group-checkbox">
                        <input
                            id="playlist-public"
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            disabled={isLoading}
                        />
                        <label htmlFor="playlist-public">{t('library.makePublicLabel')}</label>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={isLoading}>{t('library.cancelBtn')}</button>
                        <button type="submit" className="btn-submit" disabled={isLoading}>{isLoading ? t('library.creatingBtn') : t('library.createBtn')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}