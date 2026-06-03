import './FriendItem.css';

export default function FriendItem({ friend, onSelect }) {
    if (!friend) return null;

    const fullName = `${friend.first_name || ''} ${friend.last_name || ''}`.trim() || friend.username;

    return (
        <div className="friend-item-container" onClick={() => onSelect(friend)}>
            <img
                src={friend.avatar_url || "https://placehold.co/40x40/555/FFF?text=U"}
                alt={`Avatar de ${fullName}`}
                className="friend-item-avatar"
            />
            <div className="friend-item-info">
                <span className="friend-item-name">{fullName}</span>
                <span className="friend-item-handle">@{friend.username}</span>
            </div>
        </div>
    );
}