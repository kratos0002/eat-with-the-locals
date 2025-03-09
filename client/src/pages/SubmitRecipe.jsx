import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapSelector from '../components/MapSelector';
import RecipeSubmissionStatus from '../components/RecipeSubmissionStatus';
import axios from 'axios';
import './SubmitRecipe.css';

function SubmitRecipe() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    ingredients: '',
    instructions: '',
    location_lat: null,
    location_lng: null,
    location_name: '',
    city: '',
    country: '',
    photo_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationSelected, setLocationSelected] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedRecipeId, setSubmittedRecipeId] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationSelect = (location) => {
    // Extract city and country from the location if available
    let city = '';
    let country = '';
    
    // In a real implementation, you could use reverse geocoding to get these values
    // For MVP, we'll ask the user to enter them manually
    
    setFormData(prev => ({
      ...prev,
      location_lat: location.lat,
      location_lng: location.lng,
      // We keep city and country as they were
    }));
    setLocationSelected(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.ingredients || !formData.instructions || !locationSelected) {
      setError('Please fill in all required fields and select a location');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Submit the recipe using axios directly
      const response = await axios.post('/api/recipes', formData);
      
      setSubmittedRecipeId(response.data.id);
      setSubmitted(true);
      
      // Clear the form data
      setFormData({
        name: '',
        ingredients: '',
        instructions: '',
        location_lat: null,
        location_lng: null,
        location_name: '',
        city: '',
        country: '',
        photo_url: ''
      });
      
      setLocationSelected(false);
      
      // We don't navigate away anymore, instead show the submission status
    } catch (error) {
      console.error('Error submitting recipe:', error);
      setError('Failed to submit recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If the recipe was submitted, show the submission status
  if (submitted && submittedRecipeId) {
    return (
      <div className="submit-recipe">
        <h1>Recipe Submitted</h1>
        <p className="submit-intro">Thank you for contributing to Eat with the Locals!</p>
        
        <RecipeSubmissionStatus recipeId={submittedRecipeId} />
        
        <div className="submission-actions">
          <button 
            className="btn"
            onClick={() => navigate('/')}
          >
            Return to Home
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setSubmitted(false);
              setSubmittedRecipeId(null);
            }}
          >
            Submit Another Recipe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-recipe">
      <h1>Submit a Recipe</h1>
      <p className="submit-intro">Share your favorite local recipe with the community</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="moderation-notice">
        <p>All submitted recipes are reviewed by our moderators before being published.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="recipe-form">
        <div className="form-group">
          <label htmlFor="name">Recipe Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Grandma's Apple Pie"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="location_name">Location Name*</label>
          <input
            type="text"
            id="location_name"
            name="location_name"
            className="form-control"
            value={formData.location_name}
            onChange={handleChange}
            placeholder="e.g., Paris, France"
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              className="form-control"
              value={formData.city}
              onChange={handleChange}
              placeholder="e.g., Paris"
            />
          </div>
          
          <div className="form-group half">
            <label htmlFor="country">Country</label>
            <input
              type="text"
              id="country"
              name="country"
              className="form-control"
              value={formData.country}
              onChange={handleChange}
              placeholder="e.g., France"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Recipe Location*</label>
          <p className="form-help">Select the location this recipe is from on the map</p>
          <MapSelector onLocationSelect={handleLocationSelect} />
          {locationSelected && (
            <div className="location-confirmed">
              ✓ Location selected
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="ingredients">Ingredients*</label>
          <p className="form-help">Enter ingredients with quantities, separated by commas or new lines</p>
          <textarea
            id="ingredients"
            name="ingredients"
            className="form-control"
            value={formData.ingredients}
            onChange={handleChange}
            placeholder="e.g., 2 cups flour, 1 cup sugar, 3 apples, cinnamon to taste"
            rows={5}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="instructions">Instructions*</label>
          <p className="form-help">Enter detailed step-by-step instructions (numbered steps preferred)</p>
          <textarea
            id="instructions"
            name="instructions"
            className="form-control"
            value={formData.instructions}
            onChange={handleChange}
            placeholder="e.g., 1. Preheat oven to 350°F. 2. Mix flour and sugar in a large bowl. 3. Add sliced apples and toss to coat..."
            rows={8}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="photo_url">Recipe Photo URL (Optional)</label>
          <p className="form-help">Enter a URL to a photo of your prepared dish</p>
          <input
            type="url"
            id="photo_url"
            name="photo_url"
            className="form-control"
            value={formData.photo_url}
            onChange={handleChange}
            placeholder="e.g., https://example.com/my-recipe-photo.jpg"
          />
        </div>
        
        <div className="form-note">
          <p>Fields marked with * are required</p>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Recipe'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubmitRecipe; 