import { supabase } from './supabase';

/**
 * Makes sure this device has a Supabase session and returns the user id.
 *
 * Nural signs in anonymously: there is no login screen, but every device gets its own
 * authenticated user, which row-level security uses to keep each person's data private.
 * The session is persisted, so the same user is restored on the next launch.
 *
 * Returns null when signing in is not possible (offline, or anonymous sign-ins are
 * disabled in the Supabase project); requests then fail row-level security.
 */
export async function ensureSignedIn(): Promise<string | null> {
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session) return existing.session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn('Anonymous sign-in failed:', error.message);
    return null;
  }
  return data.user?.id ?? null;
}

/** Ends the session; the next `ensureSignedIn` creates a fresh anonymous user. */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) console.warn('Sign-out failed:', error.message);
}
