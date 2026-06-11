import { useState, useEffect } from 'react';
import StarRating from '../StarRating/StarRating';
import { createReview, updateReview } from '../../../api/api';
import { useLanguage } from '../../../context/LanguageContext.jsx';
import './ReviewForm.css';

export default function ReviewForm({ albumId, onReviewAdded, existingReview }) {
    const { t } = useLanguage();
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
            setError(t('album.errorNoRating'));
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            let result;

            if (!existingReview) {
                result = await createReview(albumId, {
                    rating,
                    content: content.trim()
                });

            } else if (existingReview && isEditing) {
                result = await updateReview(existingReview.id, {
                    rating,
                    content: content.trim()
                });

            } else {
                setError(t('album.errorAlreadyReviewed'));
                setIsLoading(false);
                return;
            }

            setIsEditing(false);

            if (onReviewAdded) {
                onReviewAdded(result);
            }

        } catch (error) {
            setError(t('album.errorPublishing'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="review-form-container">
            <h3 className="review-form-title">{t('album.writeReviewTitle')}</h3>

            {error && <div className="review-form-error">{error}</div>}

            <form onSubmit={handleSubmit} className={`review-form ${existingReview && !isEditing ? "disabled-form" : ""}`}>

                <div className="rating-selection">
                    <span className="rating-label">{t('album.yourRatingLabel')}</span>
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
                            {t('album.editReviewBtn')}
                        </button>
                    )}

                    {(!existingReview || isEditing) && (
                        <button
                            type="submit"
                            className="btn-submit-review"
                            disabled={isLoading || rating === 0}
                        >
                            {existingReview ? t('album.updateReviewBtn') : t('album.publishReviewBtn')}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}