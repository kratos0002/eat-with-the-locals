const express = require('express');
const router = express.Router();
const db = require('../db/database');
const recipeService = require('../services/recipeService');

// GET recipes near a location (Hybrid approach)
router.get('/', async (req, res) => {
  const { lat, lng, radius = 50 } = req.query; // Default radius of 50km if not specified

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const recipes = await recipeService.getRecipesNearLocation(lat, lng, radius);
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error.message);
    return res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// GET a specific recipe
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM recipes WHERE id = ? AND is_approved = 1', [id], (err, recipe) => {
    if (err) {
      console.error('Error fetching recipe:', err.message);
      return res.status(500).json({ error: 'Failed to fetch recipe' });
    }
    
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    res.json(recipe);
  });
});

// POST a new recipe (with moderation)
router.post('/', async (req, res) => {
  const { 
    name, ingredients, instructions, 
    location_lat, location_lng, location_name,
    city, country, photo_url
  } = req.body;
  
  // Simple validation
  if (!name || !ingredients || !instructions || !location_lat || !location_lng) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }
  
  // For MVP, hardcode user_id to 2 (regular user)
  const user_id = 2;
  
  try {
    // Submit the recipe for moderation
    const result = await recipeService.submitRecipeForModeration({
      name,
      ingredients,
      instructions,
      location_lat,
      location_lng,
      location_name,
      city,
      country,
      photo_url,
      user_id
    });
    
    res.status(201).json({
      id: result.id,
      message: result.message
    });
  } catch (error) {
    console.error('Error submitting recipe:', error.message);
    return res.status(500).json({ error: 'Failed to submit recipe' });
  }
});

// GET the moderation queue (admin only)
router.get('/admin/moderation-queue', (req, res) => {
  // In a real app, check if the user is an admin
  // For MVP, we'll skip authentication for simplicity
  
  recipeService.getModerationQueue()
    .then(recipes => {
      res.json(recipes);
    })
    .catch(error => {
      console.error('Error fetching moderation queue:', error.message);
      return res.status(500).json({ error: 'Failed to fetch moderation queue' });
    });
});

// POST to approve or reject a recipe (admin only)
router.post('/admin/moderate/:id', (req, res) => {
  const moderationId = req.params.id;
  const { status, notes } = req.body;
  
  // Validate the status
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be either "approved" or "rejected"' });
  }
  
  // In a real app, get the reviewer ID from the authenticated user
  // For MVP, hardcode to admin user (ID 1)
  const reviewerId = 1;
  
  recipeService.moderateRecipe(moderationId, status, reviewerId, notes)
    .then(result => {
      res.json(result);
    })
    .catch(error => {
      console.error('Error moderating recipe:', error.message);
      return res.status(500).json({ error: 'Failed to moderate recipe' });
    });
});

// PUT update a recipe (only for approved recipes)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, ingredients, instructions, location_lat, location_lng, location_name } = req.body;
  
  // Simple validation
  if (!name || !ingredients || !instructions || !location_lat || !location_lng) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // Check if the recipe exists and is approved
  db.get('SELECT * FROM recipes WHERE id = ? AND is_approved = 1', [id], (err, recipe) => {
    if (err) {
      console.error('Error checking recipe:', err.message);
      return res.status(500).json({ error: 'Failed to check recipe' });
    }
    
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found or not approved' });
    }
    
    // Update the recipe
    const query = `
      UPDATE recipes
      SET name = ?, ingredients = ?, instructions = ?, location_lat = ?, location_lng = ?, location_name = ?
      WHERE id = ?
    `;
    
    db.run(query, [name, ingredients, instructions, location_lat, location_lng, location_name, id], function(err) {
      if (err) {
        console.error('Error updating recipe:', err.message);
        return res.status(500).json({ error: 'Failed to update recipe' });
      }
      
      // Return the updated recipe
      db.get('SELECT * FROM recipes WHERE id = ?', [id], (err, recipe) => {
        if (err) {
          console.error('Error fetching updated recipe:', err.message);
          return res.status(500).json({ error: 'Recipe updated but failed to retrieve details' });
        }
        
        res.json(recipe);
      });
    });
  });
});

// DELETE a recipe (admin only)
router.delete('/admin/:id', (req, res) => {
  const { id } = req.params;
  
  // In a real app, check if the user is an admin
  // For MVP, we'll skip authentication for simplicity
  
  db.run('DELETE FROM recipes WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting recipe:', err.message);
      return res.status(500).json({ error: 'Failed to delete recipe' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    res.json({ message: 'Recipe deleted successfully' });
  });
});

module.exports = router; 