import { useLanguage } from "../../../../context/LanguageContext.jsx";
import './NewCommItem.css';

export default function NewCommItem({ isLast, onCancel }) {
    const { t } = useLanguage();

    return (
        <div className="new-comm-item-container">
            <div className={`comment-tree-line ${isLast ? 'last' : ''}`}></div>

            <img
                src="https://placehold.co/32x32/555/FFF?text=Me"
                alt={t('social.myAvatar')}
                className="comment-avatar"
            />

            <div className="new-comm-content">
                <input
                    type="text"
                    className="new-comm-input"
                    placeholder={t('social.addComment')}
                />

                <button
                    className="new-comm-btn cancel"
                    onClick={onCancel}
                    title={t('social.cancel')}
                >
                    ✕
                </button>
                <button className="new-comm-btn submit">
                    {t('social.submit')}
                </button>
            </div>
        </div>
    );
}