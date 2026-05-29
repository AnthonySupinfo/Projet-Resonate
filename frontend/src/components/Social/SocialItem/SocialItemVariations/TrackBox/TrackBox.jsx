import './TrackBox.css';
import add from '../../../../../../public/icons/add.png';

export default function TrackBox({ data }) {
    return (
        <div className="social-item-track-box">
            <img
                src={data?.coverUrl || "https://placehold.co/64x64/222/FFF?text=?"}
                alt="Pochette"
                className="social-track-cover"
            />

            <div className="social-track-info">
                <h4 className="social-track-title">{data?.title}</h4>
                <p className="social-track-meta">
                    {data?.artist} • {data?.album} • {data?.duration}
                </p>
            </div>

            <button className="social-track-add-btn">
                <img src={add} alt="Ajouter" className="action-icon" />
            </button>
        </div>
    );
}