import { useState, useEffect } from 'react';
import StarRating from '../StarRating/StarRating';
import { createReview, updateReview } from '../../../api/api';
import './ReviewForm.css';

/*
export default function ReviewForm({ albumId, onReviewAdded, existingReview }) {
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            setError("Veuillez attribuer une note");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            let result;

            if (existingReview && isEditing) {
                // UPDATE
                result = await updateReview(existingReview.id, {
                    rating,
                    content: content.trim()
                });
            } else if (!existingReview) {
                // CREATE
                result = await createReview(albumId, {
                    rating,
                    content: content.trim()
                });
            } else {
                // bloque si déjà une review et pas en édition
                setError("Vous avez déjà publié une critique");
                setIsLoading(false);
                return;
            }

            setIsEditing(false);

            if (onReviewAdded) {
                onReviewAdded(result);
            }

        } catch (error) {
            setError("Erreur lors de la publication...");
        } finally {
            setIsLoading(false);
        }


    };

    useEffect(() => {
        if (existingReview) {
            setRating(existingReview.rating);
            setContent(existingReview.content || '');
        }
    }, [existingReview]);


    return (
        <div className="review-form-container">
            <h3 className="review-form-title">Écrire une critique</h3>
            <div className="review-form-actions">

                {existingReview && !isEditing && (
                    <button
                        type="button"
                        className="btn-edit-review"
                        onClick={() => setIsEditing(true)}
                    >
                        Modifier votre critique
                    </button>
                )}

                {(!existingReview || isEditing) && (
                    <button
                        type="submit"
                        className="btn-submit-review"
                        disabled={isLoading || rating === 0}
                    >
                        {existingReview ? "Mettre à jour" : "Publier la critique"}
                    </button>
                )}

            </div>

            {error && <div className="review-form-error">{error}</div>}

            <form onSubmit={handleSubmit} className="review-form">
                <div className="rating-selection">
                    <span className="rating-label">Votre note : </span>
                    <StarRating rating={rating} onRatingChange={setRating} readOnly={isLoading || (existingReview && !isEditing)}/>
                </div>

                <textarea className="review-textarea" placeholder="Partagez votre avis sur cet album..." value={content} onChange={(e) => setContent(e.target.value)} disabled={isLoading || (existingReview && !isEditing)} rows="4"/>

                <div className="review-form-actions">

                    <button type="submit" className="btn-submit-review" disabled={isLoading || rating === 0}>
                        Publier la critique"
                    </button>
                </div>
            </form>
        </div>
    );
}
*/


export default function ReviewForm({ albumId, onReviewAdded, existingReview }) {
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (existingReview) {
            setRating(existingReview.rating);
            setContent(existingReview.content || '');
        }
    }, [existingReview]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!rating) {
            setError("Veuillez attribuer une note");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            let result;

            console.log("existingReview:", existingReview);

            if (!existingReview) {
                // CREATION
                result = await createReview(albumId, {
                    rating,
                    content: content.trim()
                });

            } else if (existingReview && isEditing) {
                // UPDATE
                result = await updateReview(existingReview.id, {
                    rating,
                    content: content.trim()
                });

            } else {
                // CAS BLOQUÉ
                setError("Vous avez déjà publié une critique");
                setIsLoading(false);
                return;
            }

            console.log("API RESULT:", result);

            setIsEditing(false);

            if (onReviewAdded) {
                onReviewAdded(result);
            }

        } catch (error) {
            console.error("ERROR API:", error);
            setError("Erreur lors de la publication...");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="review-form-container">
            <h3 className="review-form-title">Écrire une critique</h3>

            {error && <div className="review-form-error">{error}</div>}

            <form onSubmit={handleSubmit} className={`review-form ${existingReview && !isEditing ? "disabled-form" : ""}`}>

                <div className="rating-selection">
                    <span className="rating-label">Votre note : </span>
                    <StarRating
                        rating={rating}
                        onRatingChange={setRating}
                        readOnly={isLoading || (existingReview && !isEditing)}
                    />
                </div>

                <textarea
                    className="review-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isLoading || (existingReview && !isEditing)}
                    rows="4"
                />
                <div className="review-form-actions">
                    {existingReview && !isEditing && (
                        <button
                            type="button"
                            className="btn-edit-review"
                            onClick={() => setIsEditing(true)}
                        >
                            Modifier votre critique
                        </button>
                    )}

                    {(!existingReview || isEditing) && (
                        <button
                            type="submit"
                            className="btn-submit-review"
                            disabled={isLoading || rating === 0}
                        >
                            {existingReview ? "Mettre à jour" : "Publier la critique"}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
