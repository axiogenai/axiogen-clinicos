import { createClient } from '@supabase/supabase-js';

// Default Supabase project credentials (can be overridden via .env file or Vercel env vars)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rykurrsenvqernwnofpa.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5a3VycnNlbnZxZXJud25vZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDMxMzksImV4cCI6MjEwMTUxOTEzOX0.fs5xcELvz0g9GojZRbSnSmfiZaFMHZLWfeD5yaIQhDM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Helper methods for Supabase Authentication
 */
export const supabaseAuth = {
  // Sign in with Email & Password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign up new user
  signUp: async (email: string, password: string, metadata: { name?: string; role?: string } = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    return data;
  },

  // Send Password Reset Email / OTP Code via Supabase Auth
  resetPasswordForEmail: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  },

  // Verify OTP for password recovery
  verifyOtp: async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });
    if (error) throw error;
    return data;
  },

  // Update User Password after OTP verification
  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },

  // Sign out user
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current active session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },
};
