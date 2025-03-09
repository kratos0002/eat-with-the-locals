import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import RatingStars from '../components/RatingStars';
import { getRecipeById, getRecipeRating, addToFavorites, removeFromFavorites } from '../services/api';
import './RecipeDetails.css';

function RecipeDetails() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [rating, setRating] = useState({ average: 0, count: 0 });
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteId, setFavoriteId] = useState(null);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      setLoading(true);
      try {
        const recipeData = await getRecipeById(id);
        setRecipe(recipeData);
        
        // Check if recipe has favorite_id (meaning it's a favorite)
        if (recipeData.favorite_id) {
          setIsFavorite(true);
          setFavoriteId(recipeData.favorite_id);
        }
        
        const ratingData = await getRecipeRating(id);
        setRating({
          average: ratingData.average_rating,
          count: ratingData.rating_count
        });
        
        // Generate share URL
        setShareUrl(window.location.href);
      } catch (error) {
        console.error('Error fetching recipe details:', error);
        setError('Failed to load recipe details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeDetails();
  }, [id]);

  const handleRatingChange = (newRating) => {
    // Update the displayed rating (this is a simple approach; in a real app you'd recalculate the average)
    setRating(prev => ({
      ...prev,
      average: (prev.average * prev.count + newRating) / (prev.count + 1),
      count: prev.count + 1
    }));
  };

  const handleFavoriteToggle = async () => {
    try {
      if (isFavorite) {
        await removeFromFavorites(favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        const response = await addToFavorites(recipe.id);
        setIsFavorite(true);
        setFavoriteId(response.id);
      }
    } catch (error) {
      console.error('Error toggling favorite status:', error);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        alert('Link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
      });
  };

  if (loading) {
    return <div className="loading">Loading recipe details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!recipe) {
    return <div className="not-found">Recipe not found</div>;
  }

  return (
    <div className="recipe-details">
      <Link to="/" className="back-link">← Back to Recipes</Link>
      
      <h1 className="recipe-title">{recipe.name}</h1>
      
      <div className="recipe-meta">
        <div className="recipe-location">{recipe.location_name}</div>
        <div className="recipe-rating">
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`star ${i < Math.round(rating.average) ? 'filled' : ''}`}>★</span>
            ))}
          </div>
          <span className="rating-text">
            {rating.average.toFixed(1)} ({rating.count} {rating.count === 1 ? 'rating' : 'ratings'})
          </span>
        </div>
      </div>
      
      <div className="recipe-actions">
        <button 
          className={`btn ${isFavorite ? 'btn-favorited' : 'btn-favorite'}`}
          onClick={handleFavoriteToggle}
        >
          {isFavorite ? '❤️ Favorited' : '🤍 Add to Favorites'}
        </button>
        <button className="btn btn-share" onClick={handleShare}>
          Share Recipe
        </button>
      </div>
      
      <div className="recipe-map-container">
        <MapContainer 
          center={[recipe.location_lat, recipe.location_lng]} 
          zoom={13} 
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[recipe.location_lat, recipe.location_lng]} />
        </MapContainer>
      </div>
      
      <div className="recipe-content">
        <div className="recipe-section">
          <h2>Ingredients</h2>
          <ul className="ingredients-list">
            {recipe.ingredients.split(',').map((ingredient, index) => (
              <li key={index}>{ingredient.trim()}</li>
            ))}
          </ul>
        </div>
        
        <div className="recipe-section">
          <h2>Instructions</h2>
          <div className="instructions">
            {recipe.instructions.split(/\d+\./).filter(step => step.trim()).map((step, index) => (
              <div key={index} className="instruction-step">
                <div className="step-number">{index + 1}</div>
                <div className="step-text">{step.trim()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="recipe-rating-section">
        <h2>Rate this Recipe</h2>
        <RatingStars recipeId={recipe.id} onRatingChange={handleRatingChange} />
      </div>
    </div>
  );
}

export default RecipeDetails; 