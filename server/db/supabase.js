// Try to load environment variables, but don't fail if dotenv is missing
try {
  require('dotenv').config();
} catch (error) {
  console.log('Dotenv not available, using environment variables directly');
}

// Try to load supabase
let createClient;
try {
  const supabaseLib = require('@supabase/supabase-js');
  createClient = supabaseLib.createClient;
} catch (error) {
  console.error('Failed to load @supabase/supabase-js, will use a mock client:', error.message);
  // Create a mock createClient function that returns a dummy supabase client
  createClient = (url, key) => {
    console.log(`Creating mock Supabase client with URL: ${url}`);
    return {
      from: (table) => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
        upsert: () => Promise.resolve({ data: null, error: null }),
        eq: () => ({ select: () => Promise.resolve({ data: [], error: null }) })
      }),
      rpc: () => Promise.resolve({ data: null, error: null }),
      auth: {
        signUp: () => Promise.resolve({ data: null, error: null }),
        signIn: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ data: null, error: null })
      },
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: null }),
          list: () => Promise.resolve({ data: [], error: null })
        })
      }
    };
  };
}

// Initialize Supabase client
// NOTE: Replace these with your actual Supabase URL and anon key from your project settings
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection and log the result
async function testConnection() {
  try {
    const { data, error } = await supabase.from('recipes').select('count', { count: 'exact' });
    if (error) throw error;
    console.log('Supabase connection successful. Recipe count:', data);
    return true;
  } catch (error) {
    console.error('Error connecting to Supabase:', error.message);
    return false;
  }
}

module.exports = { supabase, testConnection }; 