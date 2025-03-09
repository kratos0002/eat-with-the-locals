import axios from 'axios';

// Use the deployed Render API URL
const SERVER_URL = 'https://eat-with-the-locals.onrender.com';

// Create API client with baseURL
const api = axios.create({
  baseURL: SERVER_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Log all requests
api.interceptors.request.use(request => {
  console.log('Starting Request:', request.url);
  return request;
});

// Recipe APIs
export const getRecipesByLocation = async (lat, lng, radius = 50) => {
  try {
    const response = await api.get(`/recipes?lat=${lat}&lng=${lng}&radius=${radius}`);
    console.log('Recipes response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching recipes by location:', error);
    throw error;
  }
};

export const getRecipeById = async (id) => {
  try {
    const response = await api.get(`/recipes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recipe details:', error);
    throw error;
  }
};

export const createRecipe = async (recipeData) => {
  try {
    const response = await api.post('/recipes', recipeData);
    return response.data;
  } catch (error) {
    console.error('Error creating recipe:', error);
    throw error;
  }
};

// Favorites APIs
export const getFavorites = async () => {
  try {
    const response = await api.get('/favorites');
    return response.data;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    throw error;
  }
};

export const addToFavorites = async (recipeId) => {
  try {
    const response = await api.post('/favorites', { recipe_id: recipeId });
    return response.data;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

export const removeFromFavorites = async (favoriteId) => {
  try {
    const response = await api.delete(`/favorites/${favoriteId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

// Ratings APIs
export const getRecipeRating = async (recipeId) => {
  try {
    const response = await api.get(`/ratings/recipe/${recipeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recipe rating:', error);
    throw error;
  }
};

export const getUserRating = async (recipeId) => {
  try {
    const response = await api.get(`/ratings/user/recipe/${recipeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user rating:', error);
    throw error;
  }
};

export const rateRecipe = async (recipeId, rating) => {
  try {
    const response = await api.post('/ratings', { recipe_id: recipeId, rating });
    return response.data;
  } catch (error) {
    console.error('Error rating recipe:', error);
    throw error;
  }
};

// Admin APIs
export const getModerationQueue = async () => {
  try {
    const response = await api.get('/recipes/admin/moderation-queue');
    return response.data;
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    throw error;
  }
};

export const moderateRecipe = async (moderationId, status, notes = '') => {
  try {
    const response = await api.post(`/recipes/admin/moderate/${moderationId}`, { 
      status, 
      notes 
    });
    return response.data;
  } catch (error) {
    console.error('Error moderating recipe:', error);
    throw error;
  }
}; 