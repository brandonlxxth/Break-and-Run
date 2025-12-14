import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string | undefined;
}

export class AuthService {
  // Sign up with email and password (using Supabase built-in auth)
  async signUp(email: string, password: string): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error };
      }

      // Check if we have a session (user is immediately authenticated)
      // If email confirmation is required, session will be null
      const { data: { session } } = await supabase.auth.getSession();
      
      if (data.user && session) {
        // User is authenticated immediately
        return { 
          user: { 
            id: data.user.id, 
            email: data.user.email 
          }, 
          error: null 
        };
      } else if (data.user) {
        // User created but needs email confirmation
        return { 
          user: null, 
          error: new Error('Please check your email to confirm your account before signing in') 
        };
      }

      return { user: null, error: new Error('No user data returned') };
    } catch (error) {
      console.error('Signup error:', error);
      return { user: null, error: error as Error };
    }
  }

  // Sign in with email and password (using Supabase built-in auth)
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error };
      }

      if (data.user) {
        return { 
          user: { 
            id: data.user.id, 
            email: data.user.email 
          }, 
          error: null 
        };
      }

      return { user: null, error: new Error('No user data returned') };
    } catch (error) {
      console.error('Signin error:', error);
      return { user: null, error: error as Error };
    }
  }

  // Get JWT token from Supabase session
  async getToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  // Sign out
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Get current user from Supabase session
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // Use getSession() instead of getUser() - more reliable
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return { 
          id: session.user.id, 
          email: session.user.email 
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback({ 
          id: session.user.id, 
          email: session.user.email 
        });
      } else {
        callback(null);
      }
    });

    // Also check initial state
    this.getCurrentUser().then(callback);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            subscription.unsubscribe();
          },
        },
      },
    };
  }
}

export const authService = new AuthService();

