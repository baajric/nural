/** Streak and totals for one profile, as stored in the `streaks` table. */
export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  /** Local date (YYYY-MM-DD) of the last completed session */
  lastActiveDate: string | null;
  totalSessions: number;
  totalReadingMinutes: number;
}

export const EMPTY_STREAK: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  totalSessions: 0,
  totalReadingMinutes: 0,
};

/**
 * The streak after completing one more session today.
 * A second session on the same day keeps the streak; a session the day after extends it;
 * any longer gap starts again from 1.
 */
export function applyCompletedSession(
  previous: StreakState | null,
  today: string,
  yesterday: string,
  minutesRead: number
): StreakState {
  const prev = previous ?? EMPTY_STREAK;

  let currentStreak: number;
  if (prev.lastActiveDate === today) {
    currentStreak = Math.max(1, prev.currentStreak);
  } else if (prev.lastActiveDate === yesterday) {
    currentStreak = prev.currentStreak + 1;
  } else {
    currentStreak = 1;
  }

  return {
    currentStreak,
    longestStreak: Math.max(prev.longestStreak, currentStreak),
    lastActiveDate: today,
    totalSessions: prev.totalSessions + 1,
    totalReadingMinutes: prev.totalReadingMinutes + Math.max(1, Math.round(minutesRead)),
  };
}

/** The streak to show: it only counts while the user was active today or yesterday. */
export function visibleStreak(state: StreakState, today: string, yesterday: string): number {
  const alive = state.lastActiveDate === today || state.lastActiveDate === yesterday;
  return alive ? state.currentStreak : 0;
}
