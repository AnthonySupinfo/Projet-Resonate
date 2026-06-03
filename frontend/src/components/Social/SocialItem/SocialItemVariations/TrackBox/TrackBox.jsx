import './TrackBox.css';
import add from '../../../../../../public/icons/add.png';

export default function TrackBox({ activity }) {
    const { target } = activity;

    return (
        <div className="social-item-track-box">
            <img
                src={target?.coverUrl || "https://placehold.co/64x64/222/FFF?text=?"}
                alt="Pochette"
                className="social-track-cover"
            />

            <div className="social-track-info">
                <h4 className="social-track-title">{target?.title || target?.name || "Titre inconnu"}</h4>
                <p className="social-track-meta">
                    {target?.artist || "Artiste inconnu"} • {target?.album || "Album"} {target?.duration ? `• ${target.duration}` : ''}
                </p>
            </div>

            <button className="social-track-add-btn">
                <img src={add} alt="Ajouter" className="action-icon" />
            </button>
        </div>
    );
}