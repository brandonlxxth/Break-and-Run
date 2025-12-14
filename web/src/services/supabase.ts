// Supabase configuration - we don't create a client here to avoid multiple instances
// Clients are created in apiService.ts with custom JWT tokens

// These will be set via environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

// Export URL and key for Edge Function calls and API service
export const supabaseConfig = {
  supabaseUrl,
  supabaseKey: supabaseAnonKey,
};

