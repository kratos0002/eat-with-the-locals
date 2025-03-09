const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET average rating for a recipe
router.get('/recipe/:recipeId', (req, res) => {
  const { recipeId } = req.params;
  
  const query = `
    SELECT AVG(rating) as average_rating, COUNT(*) as rating_count
    FROM ratings
    WHERE recipe_id = ?
  `;
  
  db.get(query, [recipeId], (err, result) => {
    if (err) {
      console.error('Error fetching ratings:', err.message);
      return res.status(500).json({ error: 'Failed to fetch ratings' });
    }
    
    res.json({ 
      recipe_id: recipeId,
      average_rating: result.average_rating || 0,
      rating_count: result.rating_count || 0
    });
  });
});

// GET user's rating for a recipe
router.get('/user/recipe/:recipeId', (req, res) => {
  const { recipeId } = req.params;
  
  // For MVP, hardcode user_id to 1
  const user_id = 1;
  
  db.get('SELECT * FROM ratings WHERE user_id = ? AND recipe_id = ?', [user_id, recipeId], (err, rating) => {
    if (err) {
      console.error('Error fetching rating:', err.message);
      return res.status(500).json({ error: 'Failed to fetch rating' });
    }
    
    if (!rating) {
      return res.json({ 
        recipe_id: recipeId,
        user_id,
        rating: null,
        has_rated: false
      });
    }
    
    res.json({
      ...rating,
      has_rated: true
    });
  });
});

// POST rate a recipe
router.post('/', (req, res) => {
  const { recipe_id, rating } = req.body;
  
  if (!recipe_id || !rating) {
    return res.status(400).json({ error: 'Recipe ID and rating are required' });
  }
  
  // Validate rating
  const ratingValue = parseInt(rating, 10);
  if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
  }
  
  // For MVP, hardcode user_id to 1
  const user_id = 1;
  
  // Check if the recipe exists
  db.get('SELECT * FROM recipes WHERE id = ?', [recipe_id], (err, recipe) => {
    if (err) {
      console.error('Error checking recipe:', err.message);
      return res.status(500).json({ error: 'Failed to check recipe' });
    }
    
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    // Check if the user has already rated the recipe
    db.get('SELECT * FROM ratings WHERE user_id = ? AND recipe_id = ?', [user_id, recipe_id], (err, existingRating) => {
      if (err) {
        console.error('Error checking rating:', err.message);
        return res.status(500).json({ error: 'Failed to check rating' });
      }
      
      if (existingRating) {
        // Update existing rating
        db.run(
          'UPDATE ratings SET rating = ? WHERE user_id = ? AND recipe_id = ?',
          [ratingValue, user_id, recipe_id],
          function(err) {
            if (err) {
              console.error('Error updating rating:', err.message);
              return res.status(500).json({ error: 'Failed to update rating' });
            }
            
            res.json({
              id: existingRating.id,
              user_id,
              recipe_id,
              rating: ratingValue,
              message: 'Rating updated successfully'
            });
          }
        );
      } else {
        // Add new rating
        db.run(
          'INSERT INTO ratings (user_id, recipe_id, rating) VALUES (?, ?, ?)',
          [user_id, recipe_id, ratingValue],
          function(err) {
            if (err) {
              console.error('Error adding rating:', err.message);
              return res.status(500).json({ error: 'Failed to add rating' });
            }
            
            res.status(201).json({
              id: this.lastID,
              user_id,
              recipe_id,
              rating: ratingValue,
              message: 'Rating added successfully'
            });
          }
        );
      }
    });
  });
});

module.exports = router; 