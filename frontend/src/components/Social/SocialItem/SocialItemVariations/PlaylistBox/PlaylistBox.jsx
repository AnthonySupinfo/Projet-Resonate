import './PlaylistBox.css';
import add from '../../../../../../public/icons/add.png';

export default function PlaylistBox({ data }) {
    return (
        <div className="social-item-playlist-box">
            <img
                src={data?.coverUrl || "https://placehold.co/64x64/222/FFF?text=P"}
                alt="Pochette playlist"
                className="social-playlist-cover"
            />

            <div className="social-playlist-info">
                <h4 className="social-playlist-title">{data?.title || data?.name}</h4>
                <p className="social-playlist-meta">
                    par {data?.username?.replace('@', '') || "Resonate"} • 85 titres
                </p>
            </div>

            <button className="social-playlist-add-btn">
                <img src={add} alt="Ajouter" className="action-icon" />
            </button>
        </div>
    );
}