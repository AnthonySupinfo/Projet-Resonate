import { useState } from 'react';
import './StarRating.css';

export default function StarRating({ rating, onRatingChange, readOnly = false }) {
    const [hover, setHover] = useState(0);

    return (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => {
                return (
                    <button 
                        type="button" 
                        key={star} 
                        className={`star-btn ${star <= (hover || rating) ? 'on' : 'off'} ${readOnly ? 'read-only' : ''}`} 
                        onClick={() => !readOnly && onRatingChange(star)}
                        onMouseEnter={() => !readOnly && setHover(star)}
                        onMouseLeave={() => !readOnly && setHover(0)}
                        disabled={readOnly}
                    >★</button>
                );
            })}
        </div>
    );
}