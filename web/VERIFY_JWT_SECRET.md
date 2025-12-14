# Verify JWT Secret Setup

The "No suitable key or wrong key type" error means PostgREST can't validate your JWT. Let's verify everything is set up correctly.

## Step 1: Check JWT Secret is Set

1. **Check Edge Function logs:**
   ```bash
   npx supabase functions logs auth-signup --limit 5
   ```
   
   Look for:
   - `JWT_SECRET length: XX` - Should show a number (the secret length)
   - If you see `JWT_SECRET is not set!`, the secret isn't configured

2. **Verify the secret in Supabase Dashboard:**
   - Go to Supabase Dashboard → Edge Functions → Settings
   - Check if `JWT_SECRET` is listed in the secrets
   - If not, set it:
     ```bash
     npx supabase secrets set JWT_SECRET=your-jwt-secret-here
     ```

## Step 2: Verify JWT Secret Value

The JWT secret must be **exactly** the same as your Supabase project's JWT secret:

1. Go to Supabase Dashboard → Settings → API
2. Find **"JWT Secret"** (scroll down, it's a long string)
3. Click the eye icon to reveal it
4. Copy the **entire** secret (it's very long, make sure you get it all)
5. Set it as the secret:
   ```bash
   npx supabase secrets set JWT_SECRET=<paste-the-entire-secret-here>
   ```
6. Redeploy functions:
   ```bash
   npx supabase functions deploy auth-signup
   npx supabase functions deploy auth-signin
   ```

## Step 3: Check JWT Structure

After signing in, check the browser console. You should see:
- `JWT Token (first 50 chars): ...`
- `JWT Payload: { sub: "...", role: "authenticated", aud: "authenticated", ... }`

Verify the payload has:
- ✅ `sub`: User ID (UUID)
- ✅ `role`: "authenticated"
- ✅ `aud`: "authenticated"
- ✅ `user_id`: User ID (UUID)
- ✅ `exp`: Expiration timestamp
- ✅ `iat`: Issued at timestamp
- ✅ `iss`: Your Supabase project URL

## Step 4: Test with a Fresh Token

1. **Sign out** (clears old token)
2. **Sign in again** (generates new token with current secret)
3. Check browser console for JWT debug info
4. Try accessing games

## Common Issues

### JWT_SECRET not set
- **Symptom**: Edge Function logs show "JWT_SECRET is not set!"
- **Fix**: Run `npx supabase secrets set JWT_SECRET=...`

### Wrong JWT Secret
- **Symptom**: Token is generated but PostgREST rejects it
- **Fix**: Make sure you're using the **exact** JWT secret from Supabase Dashboard → Settings → API

### Token format wrong
- **Symptom**: JWT payload missing required claims
- **Fix**: Check browser console for JWT payload structure

## Debugging Commands

```bash
# Check if secret is set
npx supabase secrets list

# View Edge Function logs
npx supabase functions logs auth-signup --limit 10
npx supabase functions logs auth-signin --limit 10

# Redeploy functions
npx supabase functions deploy auth-signup
npx supabase functions deploy auth-signin
```


