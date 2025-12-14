// Supabase Edge Function for user signup with Argon2
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Using @noble/hashes for Argon2 (works with Deno)
import { argon2id } from 'https://esm.sh/@noble/hashes@1.3.3/argon2.js';
import { encode } from 'https://deno.land/std@0.168.0/encoding/base64url.ts';

// Helper function to create JWT token
async function createJWT(userId: string, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  // Get Supabase URL from environment to use as audience
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const payload = {
    sub: userId, // Subject (user ID) - required by PostgREST
    role: 'authenticated', // Role claim - required by PostgREST
    aud: 'authenticated', // Audience - required by PostgREST
    user_id: userId, // Custom claim for our RLS function
    exp: now + 60 * 60 * 24 * 7, // 7 days
    iat: now,
    iss: supabaseUrl || 'supabase', // Issuer - use project URL if available
  };

  const encodedHeader = encode(JSON.stringify(header));
  const encodedPayload = encode(JSON.stringify(payload));

  const message = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  const encodedSignature = encode(String.fromCharCode(...new Uint8Array(signature)));

  return `${message}.${encodedSignature}`;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight - must be outside try/catch to always return CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
    // SUPABASE_URL is automatically provided by Supabase when linked
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash password with Argon2
    // Using reduced parameters for Edge Functions: timeCost=2, memoryCost=16384 (16MB), parallelism=2
    // Reduced from 64MB to fit within Supabase Edge Function limits
    let passwordHash: string;
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const hashBytes = argon2id(password, salt, {
        t: 2, // time cost (reduced from 3)
        m: 16384, // memory cost (16 MB, reduced from 64 MB for Edge Functions)
        p: 2, // parallelism (reduced from 4)
        dkLen: 32, // output length
      });
      // Convert to base64 string for storage
      // Format: $argon2id$v=19$m=16384,t=2,p=2$salt$hash
      const saltB64 = btoa(String.fromCharCode(...salt));
      const hashB64 = btoa(String.fromCharCode(...hashBytes));
      passwordHash = `$argon2id$v=19$m=16384,t=2,p=2$${saltB64}$${hashB64}`;
    } catch (hashError) {
      console.error('Argon2 hash error:', hashError);
      return new Response(
        JSON.stringify({ error: 'Failed to hash password' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
      })
      .select('id, email, created_at')
      .single();

    if (insertError) {
      console.error('Error creating user:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create user',
          details: insertError.message || String(insertError)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate JWT token with user_id in claims
    // Use Supabase's JWT secret to sign the token
    const jwtSecret = Deno.env.get('JWT_SECRET') ?? '';
    if (!jwtSecret) {
      console.error('JWT_SECRET is not set!');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify SUPABASE_URL is set for issuer claim
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    if (!supabaseUrl) {
      console.warn('SUPABASE_URL is not set, using fallback issuer');
    }
    
    console.log('JWT_SECRET length:', jwtSecret.length);
    console.log('SUPABASE_URL:', supabaseUrl || 'not set');
    const jwt = await createJWT(newUser.id, jwtSecret);
    console.log('Generated JWT (first 50 chars):', jwt.substring(0, 50) + '...');
    
    // Decode and log payload for debugging
    try {
      const payload = JSON.parse(new TextDecoder().decode(
        Uint8Array.from(atob(jwt.split('.')[1]), c => c.charCodeAt(0))
      ));
      console.log('JWT Payload (server-side):', payload);
    } catch (e) {
      console.error('Failed to decode JWT payload:', e);
    }

    return new Response(
      JSON.stringify({
        user: {
          id: newUser.id,
          email: newUser.email,
        },
        token: jwt,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

