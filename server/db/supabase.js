// Try to load environment variables, but don't fail if dotenv is missing
try {
  require('dotenv').config();
} catch (error) {
  console.log('Dotenv not available, using environment variables directly');
}

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

module.exports = { supabase }; 