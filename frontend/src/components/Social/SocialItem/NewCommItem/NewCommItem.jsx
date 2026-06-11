import { useState } from 'react';
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import './NewCommItem.css';

export default function NewCommItem({ isLast, onCancel, onSubmit, isSubmitting, userAvatar }) {
    const { t } = useLanguage();
    const [content, setContent] = useState('');

    const handleSubmit = () => {
        onSubmit(content);
        setContent('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const isImageUrl = userAvatar && (userAvatar.startsWith('http') || userAvatar.startsWith('/') || userAvatar.startsWith('data:image'));

    return (
        <div className="new-comm-item-container">
            <div className={`comment-tree-line ${isLast ? 'last' : ''}`}></div>

            {isImageUrl ? (
                <img src={userAvatar} alt="Mon avatar" className="comment-avatar" />
            ) : userAvatar ? (
                <span className="comment-avatar text-avatar">{userAvatar}</span>
            ) : (
                <span className="comment-avatar text-avatar">👤</span>
            )}

            <div className="new-comm-content">
                <input
                    type="text"
                    className="new-comm-input"
                    placeholder={t('social.addComment')}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitting}
                    autoFocus
                />

                <button className="new-comm-btn cancel" onClick={onCancel} title={t('social.cancel')} disabled={isSubmitting}>
                    ✕
                </button>
                <button className="new-comm-btn submit" onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
                    {isSubmitting ? '...' : t('social.submit')}
                </button>
            </div>
        </div>
    );
}