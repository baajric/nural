import { addDays, localDateString } from './date';
import { applyCompletedSession } from './streak';
import { supabase } from './supabase';

/** Used when the actual reading time is unknown. */
export const DEFAULT_SESSION_MINUTES = 10;

/**
 * Marks a session as completed and updates the user's streak and totals.
 * Safe to call twice for the same session: it only counts once.
 * `minutesRead` is the time actually spent reading.
 */
export async function completeSession(
  profileId: string,
  sessionId: string,
  minutesRead: number = DEFAULT_SESSION_MINUTES
): Promise<void> {
  const { data: updated, error: updateError } = await supabase
    .from('sessions')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('completed', false)
    .select('id');
  if (updateError) throw updateError;
  if (!updated || updated.length === 0) return; // already completed

  const today = localDateString();
  const yesterday = localDateString(addDays(new Date(), -1));

  const { data: streak, error: streakError } = await supabase
    .from('streaks')
    .select('id, current_streak, longest_streak, last_active_date, total_sessions, total_reading_minutes')
    .eq('profile_id', profileId)
    .maybeSingle();
  if (streakError) throw streakError;

  const state = applyCompletedSession(
    streak
      ? {
          currentStreak: streak.current_streak ?? 0,
          longestStreak: streak.longest_streak ?? 0,
          lastActiveDate: streak.last_active_date ?? null,
          totalSessions: streak.total_sessions ?? 0,
          totalReadingMinutes: streak.total_reading_minutes ?? 0,
        }
      : null,
    today,
    yesterday,
    minutesRead
  );
  const next = {
    profile_id: profileId,
    current_streak: state.currentStreak,
    longest_streak: state.longestStreak,
    last_active_date: state.lastActiveDate,
    total_sessions: state.totalSessions,
    total_reading_minutes: state.totalReadingMinutes,
  };

  const { error: saveError } = streak
    ? await supabase.from('streaks').update(next).eq('id', streak.id)
    : await supabase.from('streaks').insert(next);
  if (saveError) throw saveError;
}

/** Number of completed sessions per local date (YYYY-MM-DD) from `fromDate` until today. */
export async function getCompletedCountsByDate(
  profileId: string,
  fromDate: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('sessions')
    .select('session_date')
    .eq('profile_id', profileId)
    .eq('completed', true)
    .gte('session_date', fromDate);
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.session_date] = (counts[row.session_date] ?? 0) + 1;
  }
  return counts;
}
