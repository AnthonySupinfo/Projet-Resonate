import './UserFollowBox.css';
import followUser from '../../../../../../public/icons/notifsbar/follow.png';

export default function UserFollowBox({ data }) {
    const avatar = data?.avatarUrl;
    const isImageUrl = avatar && (avatar.startsWith('http') || avatar.startsWith('/') || avatar.startsWith('data:image'));

    return (
        <div className="social-item-user-box">
            {isImageUrl ? (
                <img
                    src={avatar}
                    alt="Avatar"
                    className="social-user-avatar"
                    onError={(e) => (e.target.style.display = "none")}
                />
            ) : avatar ? (
                <div className="social-user-avatar text-avatar">{avatar}</div>
            ) : (
                <div className="social-user-avatar text-avatar">👤</div>
            )}

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