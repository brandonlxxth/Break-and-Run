import { supabaseConfig } from './supabase';

export interface AuthUser {
  id: string;
  email: string | undefined;
}

// Store user in localStorage for session management
const USER_STORAGE_KEY = 'breakandrun_user';
const SESSION_STORAGE_KEY = 'breakandrun_session';

export class AuthService {
  // Sign up with email and password (using Argon2 via Edge Function)
  async signUp(email: string, password: string): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const response = await fetch(`${supabaseConfig.supabaseUrl}/functions/v1/auth-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseConfig.supabaseKey}`,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { user: null, error: new Error(data.error || 'Failed to sign up') };
      }

      if (data.user && data.token) {
        // Store user and token in localStorage (auto sign in after signup)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        localStorage.setItem(SESSION_STORAGE_KEY, data.token);
        return { user: data.user, error: null };
      }
      
      if (data.user) {
        // Fallback if token is missing (shouldn't happen)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        return { user: data.user, error: null };
      }

      return { user: null, error: new Error('No user data returned') };
    } catch (error) {
      console.error('Signup error:', error);
      return { user: null, error: error as Error };
    }
  }

  // Sign in with email and password (using Argon2 via Edge Function)
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const response = await fetch(`${supabaseConfig.supabaseUrl}/functions/v1/auth-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseConfig.supabaseKey}`,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { user: null, error: new Error(data.error || 'Failed to sign in') };
      }

      if (data.user && data.token) {
        // Store user and token in localStorage
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        localStorage.setItem(SESSION_STORAGE_KEY, data.token);
        return { user: data.user, error: null };
      }
      
      if (data.user) {
        // Fallback if token is missing (shouldn't happen)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        return { user: data.user, error: null };
      }

      return { user: null, error: new Error('No user data returned') };
    } catch (error) {
      console.error('Signin error:', error);
      return { user: null, error: error as Error };
    }
  }

  // Get JWT token from localStorage
  getToken(): string | null {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  }

  // Sign out
  async signOut(): Promise<{ error: Error | null }> {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Get current user from localStorage
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const userJson = localStorage.getItem(USER_STORAGE_KEY);
      if (userJson) {
        return JSON.parse(userJson) as AuthUser;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Listen to auth state changes (simplified - checks localStorage)
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    // Check initial state
    this.getCurrentUser().then(callback);

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_STORAGE_KEY) {
        if (e.newValue) {
          callback(JSON.parse(e.newValue) as AuthUser);
        } else {
          callback(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Return cleanup function
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            window.removeEventListener('storage', handleStorageChange);
          },
        },
      },
    };
  }
}

export const authService = new AuthService();

