import { useState, useEffect } from 'react';
import MapSelector from '../components/MapSelector';
import RecipeCard from '../components/RecipeCard';
import { getRecipesByLocation } from '../services/api';
import './Home.css';

function Home() {
  const [location, setLocation] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location) {
      fetchRecipes(location);
    }
  }, [location]);

  const fetchRecipes = async (location) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecipesByLocation(location.lat, location.lng);
      setRecipes(data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError('Failed to fetch recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setLocation(location);
  };

  const handleFavoriteToggle = (recipeId, isFavorite) => {
    // Update the recipes list to reflect the favorite status change
    setRecipes(recipes.map(recipe => 
      recipe.id === recipeId ? { ...recipe, isFavorite } : recipe
    ));
  };

  return (
    <div className="home-page">
      <section className="hero">
        <h1>Discover Local Recipes Around the World</h1>
        <p>Find authentic recipes from specific locations and share your own culinary creations</p>
      </section>

      <section className="location-section">
        <h2>Select a Location</h2>
        <p>Click on the map to find recipes from that area</p>
        <MapSelector onLocationSelect={handleLocationSelect} />
      </section>

      {location && (
        <section className="recipes-section">
          <h2>Recipes Near This Location</h2>
          
          {loading && <div className="loading">Loading recipes...</div>}
          
          {error && <div className="error-message">{error}</div>}
          
          {!loading && !error && recipes.length === 0 && (
            <div className="no-recipes">
              <p>No recipes found near this location.</p>
              <p>Be the first to <a href="/submit">add a recipe</a> for this area!</p>
            </div>
          )}
          
          <div className="recipes-grid">
            {recipes.map(recipe => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                isFavorite={recipe.isFavorite || false}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Home; 