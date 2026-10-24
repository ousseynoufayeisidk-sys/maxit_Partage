import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

// Environment variables validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

/**
 * Supabase client singleton with persistent auth session.
 * Automatically refreshes tokens and persists sessions to localStorage.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// TypeScript types matching database schema

/**
 * User profile stored in the profiles table.
 */
export interface Profile {
  id: string;
  prenom: string;
  nom: string;
  phone: string | null;
  created_at: string;
}

/**
 * Collection (collecte) stored in the collectes table.
 * History is stored as JSONB array in the database.
 */
export interface DbCollecte {
  id: string;
  title: string;
  motif: 'anniversaire' | 'sortie' | 'facture' | 'cadeau' | 'evenement' | 'autre';
  total: number;
  deadline: string | null;
  message: string | null;
  created_by: string;
  history: Array<{
    at: string;
    text: string;
  }>;
  created_at: string;
}

/**
 * Participant in a collecte stored in the participants table.
 */
export interface DbParticipant {
  id: string;
  collecte_id: string;
  profile_id: string | null;
  prenom: string;
  nom: string;
  phone: string | null;
  amount: number;
  status: 'attente' | 'paye';
  invite_token: string | null;
  joined_at: string | null;
  created_at: string;
}

/**
 * Get the current authenticated session.
 * Returns the session object or null if no session exists or on error.
 * 
 * @returns Promise<Session | null> - Current session or null
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return data.session;
  } catch (err) {
    console.error('Unexpected error getting session:', err);
    return null;
  }
}

/**
 * Sign in anonymously. Idempotent: checks for existing session first.
 * Creates a profile in the profiles table if it doesn't exist.
 * Returns the session after sign-in or throws on error.
 * 
 * @returns Promise<Session> - The authenticated session
 * @throws Error if sign-in fails
 */
export async function signInAnon(): Promise<Session> {
  // Check if already signed in
  const existingSession = await getSession();
  if (existingSession) {
    return existingSession;
  }

  // Sign in anonymously
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw new Error(`Anonymous sign-in failed: ${error.message}`);
  }

  if (!data.session) {
    throw new Error('Anonymous sign-in succeeded but no session returned');
  }

  // Ensure profile exists (required for collectes.created_by foreign key)
  const userId = data.session.user.id;
  
  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  // Only create if doesn't exist - use "Vous" as temporary name
  if (!existingProfile) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        prenom: 'Vous',
        nom: '',
        phone: null,
      });

    if (profileError) {
      console.error('Failed to create profile:', profileError);
      // Don't throw - profile might already exist from a race condition
    }
  }

  return data.session;
}
