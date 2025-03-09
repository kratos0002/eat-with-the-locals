import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecipeRating, addToFavorites, removeFromFavorites } from '../services/api';
import './RecipeCard.css';

function RecipeCard({ recipe, isFavorite, onFavoriteToggle }) {
  const [rating, setRating] = useState(0);
  const [favoriteStatus, setFavoriteStatus] = useState(isFavorite);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const ratingData = await getRecipeRating(recipe.id);
        setRating(ratingData.average_rating);
      } catch (error) {
        console.error('Error fetching recipe rating:', error);
      }
    };

    fetchRating();
  }, [recipe.id]);

  useEffect(() => {
    setFavoriteStatus(isFavorite);
  }, [isFavorite]);

  const handleFavoriteToggle = async () => {
    setIsLoading(true);
    try {
      if (favoriteStatus) {
        await removeFromFavorites(recipe.favorite_id);
      } else {
        await addToFavorites(recipe.id);
      }
      
      setFavoriteStatus(!favoriteStatus);
      if (onFavoriteToggle) {
        onFavoriteToggle(recipe.id, !favoriteStatus);
      }
    } catch (error) {
      console.error('Error toggling favorite status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate stars for rating display
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} className="star full">★</span>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }

    return stars;
  };

  return (
    <div className="recipe-card card">
      <div className="recipe-card-body">
        <h3 className="recipe-title">{recipe.name}</h3>
        <p className="recipe-location">{recipe.location_name || 'Unknown location'}</p>
        
        <div className="recipe-rating">
          {renderStars(rating)}
          <span className="rating-value">({rating ? rating.toFixed(1) : '0.0'})</span>
        </div>
        
        <div className="recipe-preview">
          <p>{recipe.ingredients.split(',').slice(0, 3).join(', ')}...</p>
        </div>
        
        <div className="recipe-actions">
          <Link to={`/recipe/${recipe.id}`} className="btn btn-secondary">
            View Recipe
          </Link>
          <button 
            className={`btn favorite-btn ${favoriteStatus ? 'favorited' : ''}`}
            onClick={handleFavoriteToggle}
            disabled={isLoading}
          >
            {favoriteStatus ? '❤️ Favorited' : '🤍 Add to Favorites'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecipeCard; 