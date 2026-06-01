import { useState } from 'react';
import StarRating from '../StarRating/StarRating';
import { createReview } from '../../../api/api';
import './ReviewForm.css';

export default function ReviewForm({ albumId, onReviewAdded }) {
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(rating === 0) { // force un user à mettre min 1 étoile
            setError('Veuillez attribuer une note avec les étoiles');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const newReview = await createReview(albumId, {
                rating: rating, 
                content: content.trim()
            });

            // vide le formulaire 
            setRating(0);
            setContent('');

            //prévient le composant parentqu'une reviex a été ajouté
            if(onReviewAdded) {
                onReviewAdded(newReview);
            }
        } catch (error) {
            setError ("Erreur lors de la publication de la critique. Vous en avez peut-être déjà posté une pour cet album.")
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="review-form-container">
            <h3 className="review-form-title">Écrire une critique</h3>

            {error && <div className="review-form-error">{error}</div>}

            <form onSubmit={handleSubmit} className="review-form">
                <div className="rating-selection">
                    <span className="rating-label">Votre note : </span>
                    <StarRating rating={rating} onRatingChange={setRating} readOnly={isLoading}/>
                </div>

                <textarea className="review-textarea" placeholder="Partagez votre avis sur cet album..." value={content} onChange={(e) => setContent(e.target.value)} disabled={isLoading} rows="4"/>

                <div className="review-form-actions">
                    <button type="submit" className="btn-submit-review" disabled={isLoading || rating === 0}>
                        {isLoading ? 'Publication...' : 'Publier la critique'}
                    </button>
                </div>
            </form>
        </div>
    );
}