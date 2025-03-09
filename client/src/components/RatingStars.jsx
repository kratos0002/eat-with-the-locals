import { useState, useEffect } from 'react';
import { rateRecipe, getUserRating } from '../services/api';
import './RatingStars.css';

function RatingStars({ recipeId, onRatingChange }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserRating = async () => {
      try {
        const userRating = await getUserRating(recipeId);
        if (userRating.has_rated) {
          setRating(userRating.rating);
          setHasRated(true);
        }
      } catch (error) {
        console.error('Error fetching user rating:', error);
      }
    };

    fetchUserRating();
  }, [recipeId]);

  const handleRating = async (newRating) => {
    setIsLoading(true);
    try {
      await rateRecipe(recipeId, newRating);
      setRating(newRating);
      setHasRated(true);
      if (onRatingChange) {
        onRatingChange(newRating);
      }
    } catch (error) {
      console.error('Error rating recipe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rating-stars-container">
      <div className="rating-stars">
        {[...Array(5)].map((_, index) => {
          const ratingValue = index + 1;
          
          return (
            <button
              type="button"
              key={ratingValue}
              className={`rating-star-btn ${ratingValue <= (hover || rating) ? 'filled' : ''}`}
              onClick={() => handleRating(ratingValue)}
              onMouseEnter={() => setHover(ratingValue)}
              onMouseLeave={() => setHover(0)}
              disabled={isLoading}
            >
              <span className="star">&#9733;</span>
            </button>
          );
        })}
      </div>
      <div className="rating-label">
        {hasRated ? 'Your rating' : 'Rate this recipe'}
      </div>
    </div>
  );
}

export default RatingStars; 