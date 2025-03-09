import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AdminModeration.css';

function AdminModeration() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moderationNotes, setModerationNotes] = useState({});

  useEffect(() => {
    fetchModerationQueue();
  }, []);

  const fetchModerationQueue = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/recipes/admin/moderation-queue');
      setRecipes(response.data);
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      setError('Failed to load moderation queue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotesChange = (recipeId, notes) => {
    setModerationNotes({
      ...moderationNotes,
      [recipeId]: notes
    });
  };

  const handleModerate = async (moderationId, status) => {
    try {
      await axios.post(`/api/recipes/admin/moderate/${moderationId}`, {
        status,
        notes: moderationNotes[moderationId] || ''
      });
      
      // Remove moderated recipe from the list
      setRecipes(recipes.filter(recipe => recipe.moderation_id !== moderationId));
      
      // Clear notes for this recipe
      const updatedNotes = { ...moderationNotes };
      delete updatedNotes[moderationId];
      setModerationNotes(updatedNotes);
    } catch (error) {
      console.error(`Error ${status} recipe:`, error);
      setError(`Failed to ${status} recipe. Please try again.`);
    }
  };

  if (loading) {
    return <div className="loading">Loading moderation queue...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button className="btn" onClick={fetchModerationQueue}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="admin-moderation">
      <h1>Recipe Moderation Queue</h1>
      
      {recipes.length === 0 ? (
        <div className="empty-queue">
          <p>No recipes waiting for moderation.</p>
          <Link to="/" className="btn">Back to Home</Link>
        </div>
      ) : (
        <>
          <p className="queue-info">{recipes.length} recipe(s) waiting for review</p>
          
          <div className="moderation-list">
            {recipes.map(recipe => (
              <div key={recipe.moderation_id} className="moderation-card">
                <div className="moderation-header">
                  <h2>{recipe.name}</h2>
                  <span className="recipe-location">{recipe.location_name || 'Unknown location'}</span>
                </div>
                
                <div className="moderation-details">
                  <p>Submitted on: {new Date(recipe.submission_date).toLocaleDateString()}</p>
                  <Link to={`/recipe-preview/${recipe.recipe_id}`} className="preview-link">
                    Preview Recipe
                  </Link>
                </div>
                
                <div className="moderation-actions">
                  <div className="notes-field">
                    <label htmlFor={`notes-${recipe.moderation_id}`}>Moderation Notes:</label>
                    <textarea 
                      id={`notes-${recipe.moderation_id}`}
                      value={moderationNotes[recipe.moderation_id] || ''}
                      onChange={(e) => handleNotesChange(recipe.moderation_id, e.target.value)}
                      placeholder="Optional notes about this recipe (will be visible to submitter)"
                    />
                  </div>
                  
                  <div className="moderation-buttons">
                    <button 
                      className="btn btn-approve"
                      onClick={() => handleModerate(recipe.moderation_id, 'approved')}
                    >
                      Approve
                    </button>
                    <button 
                      className="btn btn-reject"
                      onClick={() => handleModerate(recipe.moderation_id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminModeration; 