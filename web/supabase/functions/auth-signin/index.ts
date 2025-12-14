// Supabase Edge Function for user signin with Argon2
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

    // Create Supabase client with service role for admin operations
    // SUPABASE_URL is automatically provided by Supabase when linked
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    // Find user by email
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (fetchError || !user) {
      // Don't reveal if user exists or not (security best practice)
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password with Argon2
    // Parse the stored hash: $argon2id$v=19$m=16384,t=2,p=2$salt$hash
    let isValid: boolean;
    try {
      const parts = user.password_hash.split('$');
      if (parts.length !== 6 || parts[1] !== 'argon2id') {
        throw new Error('Invalid hash format');
      }
      
      // Parse parameters from hash
      const params = parts[3].split(',');
      const m = parseInt(params[0].split('=')[1]); // memory cost
      const t = parseInt(params[1].split('=')[1]); // time cost
      const p = parseInt(params[2].split('=')[1]); // parallelism
      
      const salt = Uint8Array.from(atob(parts[4]), c => c.charCodeAt(0));
      const storedHash = atob(parts[5]);
      
      // Recompute hash with same parameters from stored hash
      const computedHash = argon2id(password, salt, {
        t,
        m,
        p,
        dkLen: 32,
      });
      
      // Compare hashes (constant-time comparison)
      const computedHashStr = String.fromCharCode(...computedHash);
      isValid = computedHashStr === storedHash;
    } catch (verifyError) {
      console.error('Argon2 verify error:', verifyError);
      isValid = false;
    }

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate JWT token with user_id in claims
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
    const jwt = await createJWT(user.id, jwtSecret);
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
          id: user.id,
          email: user.email,
        },
        token: jwt,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Signin error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

