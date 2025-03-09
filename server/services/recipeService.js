const db = require('../db/database');
const axios = require('axios');

// Constants
const SEARCH_RADIUS_KM = 50; // Search radius for finding nearby recipes
const EARTH_RADIUS_KM = 6371; // Earth radius in kilometers

/**
 * Get recipes near a location with a hybrid approach:
 * 1. First check our database for curated and cached recipes
 * 2. If not enough recipes are found, fetch from API
 */
async function getRecipesNearLocation(lat, lng, radius = SEARCH_RADIUS_KM) {
  return new Promise((resolve, reject) => {
    try {
      // Validate input
      if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
        return reject(new Error('Invalid latitude or longitude values'));
      }
      
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      const parsedRadius = isNaN(parseFloat(radius)) ? SEARCH_RADIUS_KM : parseFloat(radius);

      // Calculate bounding box for quick filtering
      const latRadian = parsedLat * Math.PI / 180;
      const latDelta = parsedRadius / EARTH_RADIUS_KM;
      const lngDelta = parsedRadius / (EARTH_RADIUS_KM * Math.cos(latRadian));
      
      const minLat = parsedLat - latDelta * 180 / Math.PI;
      const maxLat = parsedLat + latDelta * 180 / Math.PI;
      const minLng = parsedLng - lngDelta * 180 / Math.PI;
      const maxLng = parsedLng + lngDelta * 180 / Math.PI;

      console.log(`Searching for recipes near lat:${parsedLat}, lng:${parsedLng}, radius:${parsedRadius}km`);
      console.log(`Bounding box: minLat:${minLat}, maxLat:${maxLat}, minLng:${minLng}, maxLng:${maxLng}`);

      // Query to find recipes within the bounding box
      const query = `
        SELECT *, 
          (6371 * acos(cos(radians(?)) * cos(radians(location_lat)) * cos(radians(location_lng) - radians(?)) + sin(radians(?)) * sin(radians(location_lat)))) AS distance
        FROM recipes
        WHERE location_lat BETWEEN ? AND ?
          AND location_lng BETWEEN ? AND ?
          AND is_approved = 1
        HAVING distance < ?
        ORDER BY distance
      `;

      db.all(query, [parsedLat, parsedLng, parsedLat, minLat, maxLat, minLng, maxLng, parsedRadius], async (err, recipes) => {
        if (err) {
          console.error('Error fetching recipes from database:', err.message);
          return reject(err);
        }
        
        console.log(`Found ${recipes.length} recipes in database`);
        
        try {
          // If we have enough recipes from our database, return them
          if (recipes.length >= 5) {
            return resolve(recipes);
          }
          
          // If not enough recipes, try to generate mock data
          const cityName = await reverseGeocode(parsedLat, parsedLng);
          if (cityName) {
            const mockRecipes = generateMockRecipes(cityName, parsedLat, parsedLng);
            
            if (mockRecipes && mockRecipes.length > 0) {
              // Combine database recipes with mock recipes
              const combinedRecipes = [...recipes, ...mockRecipes];
              return resolve(combinedRecipes);
            }
          }
          
          // If we got here, just return whatever we have from the database
          return resolve(recipes);
        } catch (error) {
          console.error('Error in hybrid recipe fetching:', error);
          // If API fetching fails, return what we have from the database
          return resolve(recipes);
        }
      });
    } catch (error) {
      console.error('Unexpected error in getRecipesNearLocation:', error);
      return reject(error);
    }
  });
}

/**
 * Check if we have cached recipes for a location
 */
async function checkCachedRecipes(lat, lng) {
  return new Promise((resolve, reject) => {
    // Calculate a reasonable distance (5km) to consider the same location
    const distance = 5;
    
    const query = `
      SELECT recipe_data
      FROM recipe_cache
      WHERE (6371 * acos(cos(radians(?)) * cos(radians(location_lat)) * cos(radians(location_lng) - radians(?)) + sin(radians(?)) * sin(radians(location_lat)))) < ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    db.get(query, [lat, lng, lat, distance], (err, row) => {
      if (err) {
        console.error('Error checking cached recipes:', err.message);
        return resolve([]);
      }
      
      if (row && row.recipe_data) {
        try {
          const recipes = JSON.parse(row.recipe_data);
          return resolve(recipes);
        } catch (error) {
          console.error('Error parsing cached recipe data:', error);
          return resolve([]);
        }
      }
      
      return resolve([]);
    });
  });
}

/**
 * Cache recipes for a location
 */
async function cacheRecipesForLocation(locationName, lat, lng, recipes) {
  return new Promise((resolve, reject) => {
    const recipeData = JSON.stringify(recipes);
    
    const query = `
      INSERT INTO recipe_cache (location_name, location_lat, location_lng, recipe_data)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(location_name) DO UPDATE SET
        recipe_data = ?,
        created_at = CURRENT_TIMESTAMP
    `;
    
    db.run(query, [locationName, lat, lng, recipeData, recipeData], function(err) {
      if (err) {
        console.error('Error caching recipes:', err.message);
        return reject(err);
      }
      
      return resolve(this.lastID);
    });
  });
}

/**
 * Get the city name for coordinates using reverse geocoding
 */
async function reverseGeocode(lat, lng) {
  try {
    console.log(`Attempting to reverse geocode lat:${lat}, lng:${lng}`);
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`, {
      headers: {
        'User-Agent': 'Eat-With-The-Locals/1.0'
      }
    });
    
    if (response.data && response.data.address) {
      // Try to get the city, town, or village name
      const cityName = response.data.address.city || 
                      response.data.address.town || 
                      response.data.address.village || 
                      response.data.address.county;
      
      console.log(`Reverse geocoding result: ${cityName}`);
      return cityName;
    }
    return null;
  } catch (error) {
    console.error('Error in reverse geocoding:', error.message);
    return null;
  }
}

/**
 * Fetch recipes from an external API
 * Note: In a real implementation, you would use your chosen API provider
 * For this example, we'll simulate a response
 */
async function fetchRecipesFromAPI(cityName) {
  try {
    // This is a placeholder - in a real implementation, you would call an actual API
    // For example, Perplexity API or another recipe API
    
    // Mock API call for demonstration purposes
    // await axios.get(`https://api.example.com/recipes?location=${encodeURIComponent(cityName)}`);
    
    // Generate mock recipes based on the city name
    const mockRecipes = generateMockRecipes(cityName);
    
    return mockRecipes;
  } catch (error) {
    console.error('Error fetching recipes from API:', error);
    return [];
  }
}

/**
 * Generate mock recipes for demonstration
 * In a real implementation, this would be replaced with actual API calls
 */
function generateMockRecipes(cityName, lat, lng) {
  const recipes = [];
  console.log(`Generating mock recipes for ${cityName}`);
  
  // Generate 3 mock recipes
  for (let i = 1; i <= 3; i++) {
    recipes.push({
      id: `mock-${cityName.toLowerCase().replace(/\s+/g, '-')}-${i}`,
      name: `${cityName} Special Dish ${i}`,
      ingredients: `Ingredient 1, Ingredient 2, Ingredient 3, Local ${cityName} spices`,
      instructions: `1. Step one for ${cityName} recipe.\n2. Step two for ${cityName} recipe.\n3. Step three for ${cityName} recipe.\n4. Serve hot and enjoy!`,
      location_name: `${cityName}`,
      location_lat: lat,
      location_lng: lng,
      source_type: 'api',
      is_approved: 1,
      distance: 0.5 * i  // Fake distance in km
    });
  }
  
  return recipes;
}

/**
 * Add a user-submitted recipe to the moderation queue
 */
async function submitRecipeForModeration(recipeData) {
  return new Promise((resolve, reject) => {
    // Insert the recipe with is_approved set to 0
    const recipeQuery = `
      INSERT INTO recipes (
        name, ingredients, instructions, 
        location_lat, location_lng, location_name,
        city, country, photo_url, 
        source_type, is_approved, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(
      recipeQuery,
      [
        recipeData.name,
        recipeData.ingredients,
        recipeData.instructions,
        recipeData.location_lat,
        recipeData.location_lng,
        recipeData.location_name,
        recipeData.city || null,
        recipeData.country || null,
        recipeData.photo_url || null,
        'user',
        0, // Not approved yet
        recipeData.user_id || 2 // Default to user_id 2 if not provided
      ],
      function(err) {
        if (err) {
          console.error('Error submitting recipe:', err.message);
          return reject(err);
        }
        
        const recipeId = this.lastID;
        
        // Add to moderation queue
        const moderationQuery = `
          INSERT INTO moderation_queue (recipe_id, status)
          VALUES (?, ?)
        `;
        
        db.run(moderationQuery, [recipeId, 'pending'], function(err) {
          if (err) {
            console.error('Error adding to moderation queue:', err.message);
            return reject(err);
          }
          
          return resolve({
            id: recipeId,
            message: 'Recipe submitted successfully and awaiting moderation'
          });
        });
      }
    );
  });
}

/**
 * Get recipes in the moderation queue
 */
async function getModerationQueue() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT m.id as moderation_id, m.status, m.created_at as submission_date,
             r.id as recipe_id, r.name, r.location_name, r.city, r.country, r.user_id
      FROM moderation_queue m
      JOIN recipes r ON m.recipe_id = r.id
      WHERE m.status = 'pending'
      ORDER BY m.created_at DESC
    `;
    
    db.all(query, [], (err, recipes) => {
      if (err) {
        console.error('Error fetching moderation queue:', err.message);
        return reject(err);
      }
      
      return resolve(recipes);
    });
  });
}

/**
 * Approve or reject a recipe in the moderation queue
 */
async function moderateRecipe(moderationId, status, reviewerId, notes) {
  return new Promise((resolve, reject) => {
    // Start a transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Update the moderation queue entry
      db.run(
        `UPDATE moderation_queue 
         SET status = ?, reviewer_id = ?, review_notes = ?, review_date = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, reviewerId, notes || null, moderationId],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            console.error('Error updating moderation status:', err.message);
            return reject(err);
          }
          
          if (this.changes === 0) {
            db.run('ROLLBACK');
            return reject(new Error('Moderation entry not found'));
          }
          
          // Get the recipe ID for this moderation entry
          db.get(
            'SELECT recipe_id FROM moderation_queue WHERE id = ?',
            [moderationId],
            (err, row) => {
              if (err || !row) {
                db.run('ROLLBACK');
                console.error('Error getting recipe ID:', err?.message);
                return reject(err || new Error('Moderation entry not found'));
              }
              
              // Update the recipe approval status
              const isApproved = status === 'approved' ? 1 : 0;
              
              db.run(
                `UPDATE recipes 
                 SET is_approved = ?, approval_date = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [isApproved, row.recipe_id],
                function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    console.error('Error updating recipe approval:', err.message);
                    return reject(err);
                  }
                  
                  // Commit the transaction
                  db.run('COMMIT', (err) => {
                    if (err) {
                      console.error('Error committing transaction:', err.message);
                      return reject(err);
                    }
                    
                    return resolve({
                      message: `Recipe ${status}`,
                      recipe_id: row.recipe_id
                    });
                  });
                }
              );
            }
          );
        }
      );
    });
  });
}

module.exports = {
  getRecipesNearLocation,
  submitRecipeForModeration,
  getModerationQueue,
  moderateRecipe
}; 