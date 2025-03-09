const { supabase } = require('../db/supabase');
const axios = require('axios');
const { getStaticCuratedRecipes } = require('./curatedRecipes');
const perplexityService = require('./perplexityService');

// Constants
const SEARCH_RADIUS_KM = 50; // Search radius for finding nearby recipes
const EARTH_RADIUS_KM = 6371; // Earth radius in kilometers

/**
 * Get a recipe by ID with its variants
 * @param {string} recipeId - The ID of the recipe to fetch
 * @returns {Object} Recipe with variants
 */
async function getRecipeById(recipeId) {
  try {
    console.log(`Fetching recipe with ID: ${recipeId}`);
    
    // Fetch the recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();
    
    if (recipeError) {
      console.error('Error fetching recipe:', recipeError);
      throw recipeError;
    }
    
    if (!recipe) {
      console.log(`Recipe with ID ${recipeId} not found`);
      throw new Error('Recipe not found');
    }
    
    // Fetch approved variants for this recipe
    const { data: variants, error: variantsError } = await supabase
      .from('recipe_variants')
      .select('*')
      .eq('parent_recipe_id', recipeId)
      .eq('status', 'approved');
    
    if (variantsError) {
      console.error('Error fetching recipe variants:', variantsError);
      // Don't throw here, we can still return the recipe without variants
    }
    
    // Return recipe with variants
    return {
      ...recipe,
      variants: variants || []
    };
  } catch (error) {
    console.error(`Error in getRecipeById: ${error.message}`);
    throw error;
  }
}

/**
 * Get a city name from coordinates using reverse geocoding
 */
async function getCityNameFromCoordinates(lat, lng) {
  try {
    // Try to get a city name from OpenStreetMap's Nominatim service
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      { headers: { 'User-Agent': 'Eat-With-The-Locals-App' } }
    );

    if (response.data && response.data.address) {
      // Try to get the city or town or county
      const cityName = response.data.address.city || 
                      response.data.address.town || 
                      response.data.address.village || 
                      response.data.address.county ||
                      response.data.address.state;
      
      if (cityName) {
        console.log(`[RecipeService] Found city name from coordinates: ${cityName}`);
        return cityName;
      }
    }
  } catch (error) {
    console.error('[RecipeService] Error getting city name from coordinates:', error);
  }

  // If we couldn't get a city name from geocoding, use a region-based approach
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
 * Generate generic recipes for a location using Perplexity API
 */
async function generateGenericRecipes(cityName, lat, lng) {
  try {
    // Check if we have the Perplexity API key
    if (process.env.PERPLEXITY_API_KEY) {
      console.log(`[RecipeService] Using Perplexity API to generate recipes for ${cityName}`);
      
      // Use the Perplexity service to generate recipes
      const generatedRecipes = await perplexityService.generateGenericRecipesForLocation(cityName, lat, lng);
      
      if (generatedRecipes && generatedRecipes.length > 0) {
        // Add distance field for consistency with our API
        return generatedRecipes.map((recipe, index) => ({
          ...recipe,
          distance: 0.5 * (index + 1)
        }));
      }
    }
  } catch (error) {
    console.error('[RecipeService] Error using Perplexity API:', error);
  }
  
  // Fallback to hardcoded recipes if Perplexity API fails or is not configured
  console.log(`[RecipeService] Using fallback recipes for ${cityName}`);
  return generateHardcodedRecipes(cityName, lat, lng);
}

/**
 * Generate hardcoded generic recipes for a location
 */
function generateHardcodedRecipes(prefix, lat, lng) {
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
    is_approved: true,
    distance: 0.5 * (index + 1),
    cuisine_type: dish.type
  }));
}

/**
 * Get recipes near a location with Supabase
 */
async function getRecipesNearLocation(lat, lng, radius = SEARCH_RADIUS_KM) {
  try {
    // Input validation with fallbacks
    const parsedLat = parseFloat(lat) || 0;
    const parsedLng = parseFloat(lng) || 0;
    const parsedRadius = parseFloat(radius) || SEARCH_RADIUS_KM;

    console.log(`[RecipeService] Searching for recipes near lat:${parsedLat}, lng:${parsedLng}, radius:${parsedRadius}km`);

    // First try to get recipes from Supabase within the radius
    const { data: dbRecipes, error: dbError } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_approved', true)
      .order('id', { ascending: false });

    if (dbError) {
      console.error('Error fetching recipes from Supabase:', dbError);
      // Fall back to static recipes if database query fails
      return getFallbackRecipes(parsedLat, parsedLng);
    }

    // If we got recipes from the database, filter by distance
    if (dbRecipes && dbRecipes.length > 0) {
      // Calculate distance and filter
      const nearbyRecipes = dbRecipes
        .map(recipe => ({
          ...recipe,
          distance: calculateDistance(
            parsedLat, 
            parsedLng, 
            recipe.location_lat, 
            recipe.location_lng
          )
        }))
        .filter(recipe => recipe.distance <= parsedRadius)
        .sort((a, b) => a.distance - b.distance);

      if (nearbyRecipes.length > 0) {
        console.log(`[RecipeService] Found ${nearbyRecipes.length} recipes in the database within ${parsedRadius}km`);
        return nearbyRecipes;
      }
    }

    // If no results from the database or not enough, try to generate from API or static data
    console.log(`[RecipeService] No recipes found in database, checking for nearby cities`);
    
    // Check for nearby popular cities
    const nearbyCity = findNearbyCity(parsedLat, parsedLng);
    if (nearbyCity) {
      console.log(`[RecipeService] Found nearby city: ${nearbyCity.name}`);
      
      // Try to get cached city recipes first
      const cachedRecipes = await getCachedCityRecipes(nearbyCity.name);
      if (cachedRecipes && cachedRecipes.length > 0) {
        console.log(`[RecipeService] Using cached recipes for ${nearbyCity.name}`);
        return cachedRecipes;
      }
      
      // If not cached, get static recipes and cache them for next time
      const cityRecipes = getStaticCityRecipes(nearbyCity.name, parsedLat, parsedLng);
      if (cityRecipes.length > 0) {
        // Cache the recipes in Supabase for future use
        await cacheRecipes(cityRecipes);
        return cityRecipes;
      }
    }
    
    // Last resort: generate generic recipes based on region
    console.log(`[RecipeService] No specific city recipes found, generating generic recipes`);
    const genericCityName = await getCityNameFromCoordinates(parsedLat, parsedLng);
    const genericRecipes = await generateGenericRecipes(genericCityName, parsedLat, parsedLng);
    
    // Cache the generic recipes
    await cacheRecipes(genericRecipes);
    
    return genericRecipes;
  } catch (error) {
    console.error('[RecipeService] Error in getRecipesNearLocation:', error);
    // Return fallback recipes in case of any error
    return getFallbackRecipes(lat, lng);
  }
}

/**
 * Cache recipes in Supabase for future use
 */
async function cacheRecipes(recipes) {
  try {
    if (!recipes || recipes.length === 0) return;
    
    // Make sure recipes have proper IDs and approved status
    const preparedRecipes = recipes.map(recipe => ({
      ...recipe,
      id: recipe.id || `generated-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      is_approved: true,
      source_type: recipe.source_type || 'api'
    }));

    // Insert recipes into Supabase
    const { data, error } = await supabase
      .from('recipes')
      .upsert(preparedRecipes, { 
        onConflict: 'name,location_lat,location_lng',
        ignoreDuplicates: true
      });

    if (error) {
      console.error('[RecipeService] Error caching recipes:', error);
    } else {
      console.log(`[RecipeService] Successfully cached ${preparedRecipes.length} recipes`);
    }
  } catch (error) {
    console.error('[RecipeService] Error in cacheRecipes:', error);
  }
}

/**
 * Get cached recipes for a city from Supabase
 */
async function getCachedCityRecipes(cityName) {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('city', cityName)
      .eq('is_approved', true);

    if (error) {
      console.error(`[RecipeService] Error fetching cached recipes for ${cityName}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[RecipeService] Error in getCachedCityRecipes:', error);
    return null;
  }
}

/**
 * Get fallback recipes in case of database failure
 */
function getFallbackRecipes(lat, lng) {
  // Use static curated recipes as an example
  const curatedRecipes = getStaticCuratedRecipes();
  
  if (curatedRecipes && curatedRecipes.length > 0) {
    // Return a few random recipes from the curated collection
    const randomRecipes = curatedRecipes.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Add distance field
    return randomRecipes.map((recipe, index) => ({
      ...recipe,
      distance: 10 + (index * 5), // Random distances
      id: `fallback-${recipe.city ? recipe.city.toLowerCase() : 'unknown'}-${index}`
    }));
  }
  
  // If no curated recipes, generate hardcoded ones
  return generateHardcodedRecipes('Local', lat, lng);
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
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return Infinity; // Return a large distance if any coordinate is missing
  }
  
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
 * Get static recipes for a specific city
 */
function getStaticCityRecipes(cityName, lat, lng) {
  // Get all curated recipes
  const allCurated = getStaticCuratedRecipes();
  
  // Filter recipes for this city
  const cityRecipes = allCurated.filter(recipe => 
    recipe.city && recipe.city.toLowerCase() === cityName.toLowerCase());
  
  if (cityRecipes.length > 0) {
    // Add distance and unique IDs to recipes
    return cityRecipes.map(recipe => ({
      ...recipe,
      id: `static-${recipe.city.toLowerCase()}-${recipe.name.toLowerCase().replace(/\s+/g, '-')}`,
      distance: calculateDistance(lat, lng, recipe.location_lat, recipe.location_lng)
    }));
  }
  
  // If no curated recipes, generate mock ones
  return generateHardcodedRecipes(cityName, lat, lng);
}

module.exports = {
  getRecipesNearLocation,
  getRecipeById,
  getCityNameFromCoordinates,
  generateGenericRecipes,
  cacheRecipes,
  calculateDistance,
  getStaticCityRecipes,
  getFallbackRecipes,
  findNearbyCity,
  getCachedCityRecipes,
  generateHardcodedRecipes
}; 