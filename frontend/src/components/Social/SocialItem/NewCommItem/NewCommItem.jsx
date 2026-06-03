import './NewCommItem.css';

export default function NewCommItem({ isLast, onCancel }) {
    return (
        <div className="new-comm-item-container">
            <div className={`comment-tree-line ${isLast ? 'last' : ''}`}></div>

            <img
                src="https://placehold.co/32x32/555/FFF?text=Me"
                alt="Mon avatar"
                className="comment-avatar"
            />

            <div className="new-comm-content">
                <input
                    type="text"
                    className="new-comm-input"
                    placeholder="Ajouter un commentaire..."
                />

                <button className="new-comm-btn cancel" onClick={onCancel}>✕</button>
                <button className="new-comm-btn submit">Envoyer</button>
            </div>
        </div>
    );
}