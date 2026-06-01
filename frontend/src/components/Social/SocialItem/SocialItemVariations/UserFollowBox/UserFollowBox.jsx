import './UserFollowBox.css';
import followUser from '../../../../../../public/icons/notifsbar/follow.png';

export default function UserFollowBox({ data }) {
    const rawAvatar = data?.avatarUrl;
    const isImageUrl = rawAvatar && (rawAvatar.startsWith('http') || rawAvatar.startsWith('/') || rawAvatar.startsWith('data:image'));

    return (
        <div className="social-item-user-box">
            <div className="social-user-avatar-wrapper">
                {isImageUrl ? (
                    <img
                        src={rawAvatar}
                        alt={data?.name || "Avatar"}
                        className="social-user-avatar-image"
                        onError={(e) => (e.target.style.display = "none")}
                    />
                ) : rawAvatar ? (
                    <span className="social-user-avatar-emoji">{rawAvatar}</span>
                ) : (
                    <span className="social-user-avatar-placeholder">👤</span>
                )}
            </div>

            <div className="social-user-info">
                <h4 className="social-user-name">{data?.name}</h4>
                <p className="social-user-handle">{data?.username}</p>
            </div>

            <button className="social-user-add-btn">
                <img src={followUser} alt="Suivre" className="action-icon" />
            </button>
        </div>
    );
}