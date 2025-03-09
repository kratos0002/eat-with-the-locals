// Try to load environment variables, but don't fail if dotenv is missing
try {
  require('dotenv').config();
} catch (error) {
  console.log('Dotenv not available, using environment variables directly');
}

const path = require('path');
const { supabase } = require('./supabase');
const { getStaticCuratedRecipes } = require('../services/curatedRecipes');

async function setupSupabase() {
  console.log('Starting Supabase setup...');

  try {
    // Check if recipes table is empty
    console.log('Checking if recipes table is empty...');
    const { data: recipes, error: countError } = await supabase
      .from('recipes')
      .select('id')
      .limit(1);

    if (countError) {
      console.error('Error checking recipes table:', countError);
      console.log('Please create the tables first using the SQL script in the Supabase dashboard.');
      throw countError;
    }

    // Seed with curated recipes if the table is empty
    if (!recipes || recipes.length === 0) {
      console.log('Seeding recipes table with curated data...');
      const curatedRecipes = getStaticCuratedRecipes();
      console.log(`Found ${curatedRecipes.length} curated recipes to seed`);
      
      const { error: seedError } = await supabase
        .from('recipes')
        .insert(curatedRecipes);
      
      if (seedError) {
        console.error('Error seeding recipes:', seedError);
        throw seedError;
      }
      console.log(`Successfully seeded ${curatedRecipes.length} curated recipes`);
    } else {
      console.log('Recipes table already has data, skipping seed');
    }

    console.log('Supabase setup completed successfully');
  } catch (error) {
    console.error('Error setting up Supabase:', error);
    throw error;
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupSupabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupSupabase }; 