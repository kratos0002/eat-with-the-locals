# Eat with the Locals

A geo-recipe locator that helps users discover and share recipes based on specific locations. This application combines curated recipes, dynamic recipe fetching, and user-contributed content to create a comprehensive platform for exploring local cuisine from around the world.

## Features

- **Location Selection**: Select a location using an interactive map or search bar
- **Recipe Display**: View recipes tied to specific locations, including detailed ingredients and instructions
- **Curated Content**: Access high-quality recipes for 13 iconic cities and their signature dishes
- **Dynamic Recipe Fetching**: Discover recipes for less common locations through API integration
- **User Contributions**: Submit your own recipes and associate them with specific locations
- **Quality Control**: Moderation system for user-submitted recipes
- **Interactive Features**: Save recipes to favorites, rate them (1-5 stars), and share them

## Project Structure

```
eat-with-the-locals/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Main views
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
├── server/           # Node.js/Express backend
│   ├── db/           # Database setup (SQLite)
│   ├── routes/       # API endpoints
│   ├── services/     # Business logic
│   └── server.js     # Main server file
```

## Technology Stack

- **Frontend**: React, React Router, Leaflet for maps, Axios for API requests
- **Backend**: Node.js, Express
- **Database**: SQLite
- **Mapping**: Leaflet.js (open-source mapping library)
- **Styling**: Pure CSS

## Hybrid Recipe System

The application employs a three-tier system for recipes:

1. **Pre-populated Curated Recipes**: High-quality recipes for iconic cities
2. **API-Fetched Recipes**: Dynamic recipe retrieval for less common locations
3. **User Contributions**: Community-submitted recipes with moderation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```
git clone <repository-url>
cd eat-with-the-locals
```

2. Install server dependencies:
```
cd server
npm install
```

3. Install client dependencies:
```
cd ../client
npm install
```

### Running Locally

1. Start the server:
```
cd server
npm run dev
```

2. In a separate terminal, start the client:
```
cd client
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

- `GET /recipes?lat=<lat>&lng=<lng>&radius=<radius>`: Retrieve recipes near a given latitude and longitude
- `GET /recipes/:id`: Get a specific recipe by ID
- `POST /recipes`: Submit a new recipe (enters moderation queue)
- `GET /favorites`: Get user's favorite recipes
- `POST /favorites`: Add a recipe to favorites
- `DELETE /favorites/:id`: Remove a recipe from favorites
- `GET /ratings/recipe/:recipeId`: Get average rating for a recipe
- `POST /ratings`: Rate a recipe
- `GET /recipes/admin/moderation-queue`: Get recipes awaiting moderation (admin only)
- `POST /recipes/admin/moderate/:id`: Approve or reject a recipe (admin only)

## License

ISC 