import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import './TrackBox.css';
import add from '../../../../../../public/icons/add.png';

export default function TrackBox({ activity }) {
    const { target } = activity;
    const { t } = useLanguage();

    return (
        <div className="social-item-track-box">
            <img
                src={target?.coverUrl || "https://placehold.co/64x64/222/FFF?text=?"}
                alt={t('social.trackCover')}
                className="social-track-cover"
            />

            <div className="social-track-info">
                <h4 className="social-track-title">{target?.title || target?.name || t('social.unknownTitle')}</h4>
                <p className="social-track-meta">
                    {target?.artist || t('social.unknownArtist')} • {target?.album || t('social.album')} {target?.duration ? `• ${target.duration}` : ''}
                </p>
            </div>

            <button className="social-track-add-btn">
                <img src={add} alt={t('social.addIcon')} className="action-icon" />
            </button>
        </div>
    );
}