const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET favorites for a user
router.get('/', (req, res) => {
  // For MVP, hardcode user_id to 1
  const user_id = 1;
  
  const query = `
    SELECT r.*, f.id as favorite_id
    FROM favorites f
    JOIN recipes r ON f.recipe_id = r.id
    WHERE f.user_id = ?
  `;
  
  db.all(query, [user_id], (err, favorites) => {
    if (err) {
      console.error('Error fetching favorites:', err.message);
      return res.status(500).json({ error: 'Failed to fetch favorites' });
    }
    
    res.json(favorites);
  });
});

// POST add a recipe to favorites
router.post('/', (req, res) => {
  const { recipe_id } = req.body;
  
  if (!recipe_id) {
    return res.status(400).json({ error: 'Recipe ID is required' });
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
    
    // Check if already in favorites
    db.get('SELECT * FROM favorites WHERE user_id = ? AND recipe_id = ?', [user_id, recipe_id], (err, favorite) => {
      if (err) {
        console.error('Error checking favorite:', err.message);
        return res.status(500).json({ error: 'Failed to check favorite' });
      }
      
      if (favorite) {
        return res.status(409).json({ error: 'Recipe already in favorites', favorite });
      }
      
      // Add to favorites
      db.run('INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)', [user_id, recipe_id], function(err) {
        if (err) {
          console.error('Error adding favorite:', err.message);
          return res.status(500).json({ error: 'Failed to add favorite' });
        }
        
        const favoriteId = this.lastID;
        
        res.status(201).json({
          id: favoriteId,
          user_id,
          recipe_id,
          message: 'Recipe added to favorites'
        });
      });
    });
  });
});

// DELETE remove a recipe from favorites
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // For MVP, hardcode user_id to 1
  const user_id = 1;
  
  db.run('DELETE FROM favorites WHERE id = ? AND user_id = ?', [id, user_id], function(err) {
    if (err) {
      console.error('Error removing favorite:', err.message);
      return res.status(500).json({ error: 'Failed to remove favorite' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    
    res.json({ message: 'Recipe removed from favorites' });
  });
});

module.exports = router; 