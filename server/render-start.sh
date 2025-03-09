#!/bin/bash
# Script to ensure dependencies are installed before starting the server on Render

echo "Starting render-start.sh script..."

# Print Node and npm versions
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Check if we're in the server directory
if [ ! -f "server.js" ]; then
  echo "Navigating to server directory..."
  cd server
fi

echo "Current directory: $(pwd)"

# Make sure package.json exists
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found!"
  exit 1
fi

echo "Installing dependencies..."
npm install --no-optional

# List installed modules to verify
echo "Listing installed modules:"
ls -la node_modules/ | head -n 20

# Check for critical dependencies
if [ ! -d "node_modules/dotenv" ]; then
  echo "Installing dotenv specifically..."
  npm install dotenv
fi

if [ ! -d "node_modules/@supabase" ]; then
  echo "Installing supabase specifically..."
  npm install @supabase/supabase-js
fi

if [ ! -d "node_modules/express" ]; then
  echo "Installing express specifically..."
  npm install express
fi

echo "Starting server..."
node server.js 