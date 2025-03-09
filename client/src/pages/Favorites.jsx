import { useState, useEffect } from 'react';
import RecipeCard from '../components/RecipeCard';
import { getFavorites } from '../services/api';
import './Favorites.css';

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError('Failed to fetch favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = (recipeId, isFavorite) => {
    if (!isFavorite) {
      // Remove from favorites list if unfavorited
      setFavorites(favorites.filter(recipe => recipe.id !== recipeId));
    }
  };

  return (
    <div className="favorites-page">
      <h1>My Favorite Recipes</h1>
      <p className="favorites-intro">Your saved recipes from around the world</p>
      
      {loading && <div className="loading">Loading favorites...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && !error && favorites.length === 0 && (
        <div className="no-favorites">
          <p>You haven't saved any favorites yet.</p>
          <p>Explore recipes and click the "Add to Favorites" button to save them here.</p>
          <a href="/" className="btn">Explore Recipes</a>
        </div>
      )}
      
      <div className="favorites-grid">
        {favorites.map(recipe => (
          <RecipeCard 
            key={recipe.id} 
            recipe={recipe} 
            isFavorite={true}
            onFavoriteToggle={handleFavoriteToggle}
          />
        ))}
      </div>
    </div>
  );
}

export default Favorites; 