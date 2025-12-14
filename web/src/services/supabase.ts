// Supabase configuration - we don't create a client here to avoid multiple instances
// Clients are created in apiService.ts with custom JWT tokens

// These will be set via environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as environment variables in your deployment platform (Vercel, Netlify, etc.)';
  console.error(errorMsg);
  // In production, throw an error to prevent the app from running with invalid config
  if (import.meta.env.PROD) {
    throw new Error(errorMsg);
  }
}

// Export URL and key for Edge Function calls and API service
export const supabaseConfig = {
  supabaseUrl,
  supabaseKey: supabaseAnonKey,
};

