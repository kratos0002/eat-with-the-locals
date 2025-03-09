import { useState, useEffect } from 'react';
import './RecipeSubmissionStatus.css';

function RecipeSubmissionStatus({ recipeId }) {
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In a real application, we would check the status of the submission
    // For MVP, we'll just simulate a pending status
    // This would be replaced with an API call like:
    // axios.get(`/api/recipes/submission/${recipeId}/status`)
    
    const checkStatus = () => {
      setLoading(false);
      setStatus('pending');
    };
    
    checkStatus();
  }, [recipeId]);

  if (loading) {
    return <div className="submission-status loading">Checking submission status...</div>;
  }

  if (error) {
    return <div className="submission-status error">{error}</div>;
  }

  return (
    <div className={`submission-status ${status}`}>
      {status === 'pending' && (
        <>
          <h3>Recipe Under Review</h3>
          <p>Your recipe has been submitted and is waiting for moderator approval.</p>
          <p className="status-info">
            Most recipes are reviewed within 24-48 hours. You'll receive a notification once the review is complete.
          </p>
        </>
      )}
      
      {status === 'approved' && (
        <>
          <h3>Recipe Approved!</h3>
          <p>Your recipe has been approved and is now available on Eat with the Locals.</p>
          <p className="status-info">
            Thank you for contributing to our community of local recipes!
          </p>
        </>
      )}
      
      {status === 'rejected' && (
        <>
          <h3>Recipe Not Approved</h3>
          <p>Unfortunately, your recipe submission was not approved by our moderators.</p>
          <p className="status-info">
            Moderator notes: {/* This would come from the API */}
            The recipe doesn't meet our community guidelines. Please ensure your submission includes detailed ingredients and instructions.
          </p>
        </>
      )}
    </div>
  );
}

export default RecipeSubmissionStatus; 