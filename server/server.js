const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const recipeRoutes = require('./routes/recipes');
const favoritesRoutes = require('./routes/favorites');
const ratingsRoutes = require('./routes/ratings');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Simple CORS middleware that allows all origins
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Other middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes - remove /api prefix to match direct calls
app.use('/recipes', recipeRoutes);
app.use('/favorites', favoritesRoutes);
app.use('/ratings', ratingsRoutes);

// Duplicate routes for /api prefix to support both formats
app.use('/api/recipes', recipeRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/ratings', ratingsRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Eat with the Locals API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Function to find an available port
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`CORS is enabled for all origins in development mode`);
  });
  
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use, trying port ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Error starting server:', error);
    }
  });
};

// Start the server on an available port
startServer(PORT); 