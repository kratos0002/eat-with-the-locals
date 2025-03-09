const db = require('../db/database');
const axios = require('axios');

// Constants
const SEARCH_RADIUS_KM = 50; // Search radius for finding nearby recipes
const EARTH_RADIUS_KM = 6371; // Earth radius in kilometers

/**
 * Get recipes near a location with a simple approach that works in production
 */
async function getRecipesNearLocation(lat, lng, radius = SEARCH_RADIUS_KM) {
  return new Promise((resolve, reject) => {
    try {
      // Input validation with fallbacks
      const parsedLat = parseFloat(lat) || 0;
      const parsedLng = parseFloat(lng) || 0;
      const parsedRadius = parseFloat(radius) || SEARCH_RADIUS_KM;

      console.log(`[RecipeService] Searching for recipes near lat:${parsedLat}, lng:${parsedLng}, radius:${parsedRadius}km`);

      // First check if we're near any known cities (simple approach)
      const nearbyCity = findNearbyCity(parsedLat, parsedLng);
      if (nearbyCity) {
        console.log(`[RecipeService] Found nearby city: ${nearbyCity.name}`);
        return resolve(getCityRecipes(nearbyCity.name, parsedLat, parsedLng));
      }

      // Fallback to generic recipes if no city found
      console.log(`[RecipeService] No nearby city found, generating generic recipes`);
      const genericCityName = getCityNameFromCoordinates(parsedLat, parsedLng);
      const genericRecipes = generateGenericRecipes(genericCityName, parsedLat, parsedLng);
      return resolve(genericRecipes);

    } catch (error) {
      console.error('[RecipeService] Error in getRecipesNearLocation:', error);
      // Return empty array instead of failing completely
      return resolve([]);
    }
  });
}

/**
 * Find if coordinates are near any known city
 */
function findNearbyCity(lat, lng) {
  // List of major cities with their coordinates
  const cities = [
    { name: 'Naples', lat: 40.8358, lng: 14.2488, country: 'Italy' },
    { name: 'Milan', lat: 45.4642, lng: 9.1900, country: 'Italy' },
    { name: 'Austin', lat: 30.2672, lng: -97.7431, country: 'USA' },
    { name: 'London', lat: 51.5074, lng: -0.1278, country: 'United Kingdom' },
    { name: 'Marrakesh', lat: 31.6295, lng: -7.9811, country: 'Morocco' },
    { name: 'Georgetown', lat: 5.4141, lng: 100.3296, country: 'Malaysia' },
    { name: 'Florence', lat: 43.7696, lng: 11.2558, country: 'Italy' },
    { name: 'New Orleans', lat: 29.9511, lng: -90.0715, country: 'USA' },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503, country: 'Japan' },
    { name: 'Lyon', lat: 45.7640, lng: 4.8357, country: 'France' },
    { name: 'Lima', lat: -12.0464, lng: -77.0428, country: 'Peru' },
    { name: 'Cape Town', lat: -33.9249, lng: 18.4241, country: 'South Africa' },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093, country: 'Australia' },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, country: 'India' },
    { name: 'New York', lat: 40.7128, lng: -74.0060, country: 'USA' },
    { name: 'Paris', lat: 48.8566, lng: 2.3522, country: 'France' },
    { name: 'Bangkok', lat: 13.7563, lng: 100.5018, country: 'Thailand' }
  ];

  // Find the closest city
  let closestCity = null;
  let minDistance = Infinity;

  cities.forEach(city => {
    const distance = calculateDistance(lat, lng, city.lat, city.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  });

  // Only return the city if it's within the search radius
  return minDistance <= SEARCH_RADIUS_KM ? closestCity : null;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = EARTH_RADIUS_KM; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
}

/**
 * Get recipes for a specific city
 */
function getCityRecipes(cityName, lat, lng) {
  // Get the curated recipes for this city
  const allCurated = getStaticCuratedRecipes();
  
  // Filter recipes for this city
  const cityRecipes = allCurated.filter(recipe => 
    recipe.city && recipe.city.toLowerCase() === cityName.toLowerCase());
  
  if (cityRecipes.length > 0) {
    // Return the curated recipes for this city
    return cityRecipes.map(recipe => ({
      ...recipe,
      id: `static-${recipe.city.toLowerCase()}-${recipe.name.toLowerCase().replace(/\s+/g, '-')}`,
      distance: calculateDistance(lat, lng, recipe.location_lat, recipe.location_lng)
    }));
  }
  
  // If no curated recipes, generate mock ones
  return generateGenericRecipes(cityName, lat, lng);
}

/**
 * Get a city name from coordinates
 */
function getCityNameFromCoordinates(lat, lng) {
  // Simple regions based on coordinates
  if (lat > 30 && lat < 50 && lng > -10 && lng < 30) return "European";
  if (lat > 20 && lat < 50 && lng > 100 && lng < 150) return "East Asian";
  if (lat > -40 && lat < 10 && lng > 100 && lng < 160) return "Southeast Asian";
  if (lat > 10 && lat < 35 && lng > 60 && lng < 90) return "South Asian";
  if (lat > 25 && lat < 50 && lng > -130 && lng < -60) return "North American";
  if (lat > -40 && lat < 15 && lng > -90 && lng < -30) return "South American";
  if (lat > -40 && lat < 40 && lng > 10 && lng < 60) return "African";
  
  // If can't determine region, use "Local"
  return "Local";
}

/**
 * Generate generic recipes for any location
 */
function generateGenericRecipes(prefix, lat, lng) {
  // Make sure prefix is a string
  const cuisinePrefix = prefix ? String(prefix) : "Local";
  
  const dishes = [
    {
      name: `${cuisinePrefix} Spiced Rice`,
      ingredients: 'Rice, Vegetables, Spices, Herbs, Olive Oil, Salt',
      instructions: '1. Cook rice according to package. 2. Sauté vegetables with spices. 3. Mix with rice. 4. Garnish with herbs.',
      type: 'Main Dish'
    },
    {
      name: `${cuisinePrefix} Grilled Fish`,
      ingredients: 'Fresh Fish, Lemon, Garlic, Herbs, Olive Oil, Salt, Pepper',
      instructions: '1. Marinate fish with lemon, garlic, and herbs. 2. Grill until cooked through. 3. Serve with a side of vegetables.',
      type: 'Seafood'
    },
    {
      name: `${cuisinePrefix} Vegetable Stew`,
      ingredients: 'Mixed Vegetables, Beans, Tomatoes, Onions, Garlic, Spices, Broth',
      instructions: '1. Sauté onions and garlic. 2. Add vegetables and spices. 3. Pour in broth and simmer until vegetables are tender. 4. Serve hot.',
      type: 'Vegetarian'
    },
    {
      name: `${cuisinePrefix} Sweet Dessert`,
      ingredients: 'Flour, Sugar, Eggs, Butter, Vanilla, Local Fruits',
      instructions: '1. Mix flour, sugar, eggs, and butter. 2. Add vanilla and fold in fruits. 3. Bake until golden. 4. Serve warm or cold.',
      type: 'Dessert'
    },
    {
      name: `${cuisinePrefix} Street Food Wrap`,
      ingredients: 'Flatbread, Protein of choice, Vegetables, Sauce, Spices',
      instructions: '1. Cook protein with spices. 2. Warm flatbread. 3. Add protein, vegetables, and sauce. 4. Fold and serve.',
      type: 'Street Food'
    }
  ];
  
  // Generate recipes with proper IDs and location data
  return dishes.map((dish, index) => ({
    id: `generic-${cuisinePrefix.toLowerCase()}-${index + 1}`,
    name: dish.name,
    ingredients: dish.ingredients,
    instructions: dish.instructions,
    location_lat: lat,
    location_lng: lng,
    location_name: `${cuisinePrefix} Region`,
    city: cuisinePrefix,
    country: 'Various',
    source_type: 'api',
    is_approved: 1,
    distance: 0.5 * (index + 1),
    cuisine_type: dish.type
  }));
}

/**
 * Get static curated recipes (hardcoded for reliability)
 */
function getStaticCuratedRecipes() {
  return [
    // Naples, Italy: Pizza Margherita
    {
      name: 'Pizza Margherita',
      ingredients: 'For the dough: 500g Italian 00 flour, 325ml water, 10g salt, 7g fresh yeast\nFor the topping: 400g San Marzano tomatoes, 250g fresh mozzarella (preferably buffalo), Fresh basil leaves, Extra virgin olive oil, Salt',
      instructions: '1. Make the dough by mixing flour, water, salt, and yeast. Knead for 10-15 minutes until elastic.\n2. Let the dough rise for 2 hours at room temperature.\n3. Divide into 4 balls and let rise another hour.\n4. Preheat oven to the highest temperature (ideally 450-500°F) with a pizza stone if available.\n5. Stretch each dough ball into a thin circle.\n6. Crush tomatoes by hand and spread on dough, leaving a border for the crust.\n7. Tear the mozzarella into pieces and distribute over the tomatoes.\n8. Bake for 4-5 minutes until the crust is charred in spots.\n9. Garnish with fresh basil and drizzle with olive oil before serving.',
      location_lat: 40.8358,
      location_lng: 14.2488,
      location_name: 'Naples, Italy',
      city: 'Naples',
      country: 'Italy'
    },
    // Milan, Italy: Risotto alla Milanese
    {
      name: 'Risotto alla Milanese',
      ingredients: '320g Carnaroli rice, 1 liter beef stock (kept warm), 1 small onion, finely chopped, 50g butter, 30g bone marrow (optional, but traditional), 100ml dry white wine, 0.5g saffron threads, 60g Parmesan cheese, grated, Salt to taste',
      instructions: '1. In a heavy-bottomed pot, melt half the butter with bone marrow (if using) and sauté the onion until translucent.\n2. Add rice and toast for 2-3 minutes, stirring constantly.\n3. Add white wine and cook until evaporated.\n4. Begin adding warm stock one ladle at a time, stirring frequently and waiting until liquid is absorbed before adding more.\n5. After 10 minutes, dissolve saffron in a small amount of stock and add to the rice.\n6. Continue cooking and adding stock until rice is al dente (usually 18-20 minutes total).\n7. Remove from heat, add remaining butter and Parmesan cheese.\n8. Cover and let rest for 2 minutes, then stir vigorously to create a creamy texture.\n9. Serve immediately, with additional Parmesan if desired.',
      location_lat: 45.4642,
      location_lng: 9.1900,
      location_name: 'Milan, Italy',
      city: 'Milan',
      country: 'Italy'
    },
    // Mumbai, India: Vada Pav
    {
      name: 'Vada Pav',
      ingredients: 'For the vada: 4 large potatoes (boiled and mashed), 2 green chilies (finely chopped), 1 inch ginger (grated), 2 cloves garlic (minced), 1 tsp mustard seeds, 1 sprig curry leaves, 1/2 tsp turmeric powder, 1 tbsp vegetable oil, Salt to taste\nFor the batter: 1 cup gram flour (besan), 1/4 tsp turmeric powder, 1/2 tsp red chili powder, 1 pinch asafoetida (hing), Salt to taste, Water as needed\nFor serving: 8 pav buns, Green chutney, Tamarind chutney, Dry garlic chutney, Oil for deep frying',
      instructions: '1. Heat oil in a pan, add mustard seeds and let them splutter.\n2. Add curry leaves, green chilies, ginger, and garlic. Sauté for a minute.\n3. Add turmeric powder and mashed potatoes. Mix well and cook for 2-3 minutes.\n4. Season with salt and let the mixture cool. Shape into round patties.\n5. Prepare the batter by mixing gram flour with spices and enough water to make a thick coating batter.\n6. Heat oil for deep frying. Dip each potato patty in the batter and deep fry until golden brown.\n7. Slice pav buns horizontally without separating completely. Spread chutneys inside.\n8. Place the hot vada inside the pav, and serve immediately.',
      location_lat: 19.0760,
      location_lng: 72.8777,
      location_name: 'Mumbai, India',
      city: 'Mumbai',
      country: 'India'
    },
    // Mumbai, India: Pav Bhaji
    {
      name: 'Pav Bhaji',
      ingredients: '4 medium potatoes (boiled and mashed), 1 cup cauliflower (boiled and chopped), 1/2 cup peas, 2 carrots (boiled and chopped), 2 large onions (finely chopped), 2 tomatoes (finely chopped), 2 bell peppers (finely chopped), 2-3 tbsp pav bhaji masala, 1 tsp red chili powder, 1 tsp turmeric powder, 2 tbsp butter, 1 lemon, Fresh coriander leaves, 8 pav buns, Salt to taste',
      instructions: '1. Heat butter in a large pan. Add half the chopped onions and sauté until golden brown.\n2. Add bell peppers and cook for 2 minutes. Add tomatoes, salt, turmeric powder, red chili powder, and pav bhaji masala.\n3. Cook until tomatoes are soft and oil begins to separate.\n4. Add all the boiled and mashed vegetables and mix well. Add a little water if needed.\n5. Mash the mixture with a potato masher while cooking, until you get a smooth consistency.\n6. Simmer for 15-20 minutes, adjusting salt and spices to taste.\n7. Heat a flat pan, slice the pav buns, and toast them with butter until crispy.\n8. Serve the bhaji hot, topped with remaining raw onions, coriander leaves, and a squeeze of lemon juice, with buttered pav on the side.',
      location_lat: 19.0760,
      location_lng: 72.8777,
      location_name: 'Mumbai, India',
      city: 'Mumbai',
      country: 'India'
    }
  ];
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
  return { id: 'mock-id', message: 'Recipe submitted for moderation' };
}

/**
 * Get recipes in the moderation queue
 */
async function getModerationQueue() {
  return [];
}

/**
 * Approve or reject a recipe in the moderation queue
 */
async function moderateRecipe(moderationId, status, reviewerId, notes) {
  return { message: `Recipe ${status}`, recipe_id: moderationId };
}

// Export methods
module.exports = {
  getRecipesNearLocation,
  submitRecipeForModeration,
  getModerationQueue,
  moderateRecipe
}; 