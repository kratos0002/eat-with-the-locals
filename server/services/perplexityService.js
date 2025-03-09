require('dotenv').config();
const axios = require('axios');

/**
 * Generate a recipe for a specific location using Perplexity API
 * @param {string} recipeName - The name of the recipe
 * @param {string} cityName - The city name
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Generated recipe
 */
async function generateRecipeForLocation(recipeName, cityName, lat, lng) {
  try {
    console.log(`Generating recipe for ${recipeName} from ${cityName}`);
    
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY is missing from environment variables');
    }

    // Create a prompt for the Perplexity API
    const prompt = `Create a detailed traditional recipe for "${recipeName}" from ${cityName}. 
    Format your response as JSON with the following structure:
    {
      "name": "Full Recipe Name",
      "ingredients": "Detailed list of ingredients with quantities, each on a new line",
      "instructions": "Step-by-step cooking instructions, with each step numbered and on a new line",
      "cultural_note": "A brief note about the cultural significance or history of this dish in ${cityName}"
    }
    
    Don't include any explanations or additional text outside the JSON structure.`;

    // Make request to Perplexity API
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3-sonar-small-32k',
        messages: [
          { role: 'system', content: 'You are a culinary expert specializing in traditional recipes from around the world. Provide accurate, authentic recipes in JSON format only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1024
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Extract and parse the JSON response
    const responseText = response.data.choices[0].message.content;
    const jsonMatch = responseText.match(/({[\s\S]*})/);
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Perplexity API response');
    }
    
    const recipeData = JSON.parse(jsonMatch[0]);
    
    // Format the recipe for our database
    return {
      name: recipeData.name || recipeName,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      location_lat: lat,
      location_lng: lng,
      location_name: `${cityName}`,
      city: cityName,
      country: extractCountryFromPerplexityResponse(responseText, cityName),
      source_type: 'api',
      is_approved: true, // Auto-approve generated recipes
      cultural_note: recipeData.cultural_note || ''
    };
  } catch (error) {
    console.error('Error generating recipe with Perplexity API:', error);
    // Return a basic fallback recipe if API fails
    return createFallbackRecipe(recipeName, cityName, lat, lng);
  }
}

/**
 * Try to extract country information from the Perplexity response
 * @param {string} responseText - The full response text
 * @param {string} cityName - The city name
 * @returns {string} The country name or empty string
 */
function extractCountryFromPerplexityResponse(responseText, cityName) {
  // Try to find country mentions in the response
  const commonCountries = [
    'United States', 'USA', 'Italy', 'France', 'China', 'India', 'Japan', 
    'Mexico', 'Brazil', 'Thailand', 'Spain', 'Greece', 'Turkey', 'Morocco',
    'Vietnam', 'Germany', 'United Kingdom', 'UK', 'Australia', 'Canada'
  ];
  
  for (const country of commonCountries) {
    if (responseText.includes(country)) {
      return country;
    }
  }
  
  // Default to empty string if no country found
  return '';
}

/**
 * Create a fallback recipe if the API fails
 * @param {string} recipeName - The name of the recipe
 * @param {string} cityName - The city name
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Fallback recipe
 */
function createFallbackRecipe(recipeName, cityName, lat, lng) {
  return {
    name: recipeName,
    ingredients: "Basic ingredients for " + recipeName,
    instructions: "1. Prepare ingredients\n2. Cook according to local tradition\n3. Serve and enjoy",
    location_lat: lat,
    location_lng: lng,
    location_name: `${cityName}`,
    city: cityName,
    country: '',
    source_type: 'api',
    is_approved: true,
    cultural_note: `${recipeName} is a traditional dish from ${cityName}.`
  };
}

/**
 * Generate generic recipes for a location
 * @param {string} cityName - The city name
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Array} List of generated recipes
 */
async function generateGenericRecipesForLocation(cityName, lat, lng) {
  try {
    console.log(`Generating generic recipes for ${cityName}`);
    
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY is missing from environment variables');
    }

    // Create a prompt for the Perplexity API
    const prompt = `List 3 traditional dishes from ${cityName} or the nearest major city to coordinates ${lat}, ${lng}.
    Format your response as JSON with the following structure:
    {
      "dishes": [
        {
          "name": "Dish Name 1",
          "ingredients": "Detailed list of ingredients with quantities, each on a new line",
          "instructions": "Step-by-step cooking instructions, with each step numbered and on a new line",
          "cultural_note": "A brief note about the cultural significance or history of this dish"
        },
        {
          "name": "Dish Name 2",
          "ingredients": "...",
          "instructions": "...",
          "cultural_note": "..."
        },
        {
          "name": "Dish Name 3",
          "ingredients": "...",
          "instructions": "...",
          "cultural_note": "..."
        }
      ],
      "city": "The actual city name",
      "country": "The country name"
    }
    
    Don't include any explanations or additional text outside the JSON structure.`;

    // Make request to Perplexity API
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3-sonar-small-32k',
        messages: [
          { role: 'system', content: 'You are a culinary expert specializing in traditional recipes from around the world. Provide accurate, authentic recipes in JSON format only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2048
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Extract and parse the JSON response
    const responseText = response.data.choices[0].message.content;
    const jsonMatch = responseText.match(/({[\s\S]*})/);
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Perplexity API response');
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    const actualCity = parsedData.city || cityName;
    const actualCountry = parsedData.country || '';
    
    // Format the recipes for our database
    return parsedData.dishes.map(dish => ({
      name: dish.name,
      ingredients: dish.ingredients,
      instructions: dish.instructions,
      location_lat: lat,
      location_lng: lng,
      location_name: `${actualCity}, ${actualCountry}`.trim(),
      city: actualCity,
      country: actualCountry,
      source_type: 'api',
      is_approved: true,
      cultural_note: dish.cultural_note || ''
    }));
  } catch (error) {
    console.error('Error generating generic recipes with Perplexity API:', error);
    // Return fallback recipes if API fails
    return [
      createFallbackRecipe('Local Specialty 1', cityName, lat, lng),
      createFallbackRecipe('Local Specialty 2', cityName, lat, lng),
      createFallbackRecipe('Local Specialty 3', cityName, lat, lng)
    ];
  }
}

module.exports = {
  generateRecipeForLocation,
  generateGenericRecipesForLocation
}; 