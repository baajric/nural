import { describe, expect, it } from '@jest/globals';

import { applyCompletedSession, EMPTY_STREAK, visibleStreak } from '../lib/streak';
import type { StreakState } from '../lib/streak';

const TODAY = '2026-03-10';
const YESTERDAY = '2026-03-09';

function streak(overrides: Partial<StreakState>): StreakState {
  return { ...EMPTY_STREAK, ...overrides };
}

describe('applyCompletedSession', () => {
  it('starts a streak of 1 for a first session', () => {
    expect(applyCompletedSession(null, TODAY, YESTERDAY, 8)).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: TODAY,
      totalSessions: 1,
      totalReadingMinutes: 8,
    });
  });

  it('extends the streak when the last session was yesterday', () => {
    const next = applyCompletedSession(
      streak({ currentStreak: 4, longestStreak: 6, lastActiveDate: YESTERDAY, totalSessions: 12 }),
      TODAY,
      YESTERDAY,
      10
    );
    expect(next.currentStreak).toBe(5);
    expect(next.longestStreak).toBe(6);
    expect(next.totalSessions).toBe(13);
  });

  it('keeps the streak for a second session on the same day', () => {
    const next = applyCompletedSession(
      streak({ currentStreak: 3, longestStreak: 3, lastActiveDate: TODAY, totalSessions: 7 }),
      TODAY,
      YESTERDAY,
      10
    );
    expect(next.currentStreak).toBe(3);
    expect(next.totalSessions).toBe(8);
  });

  it('restarts at 1 after a missed day but remembers the longest streak', () => {
    const next = applyCompletedSession(
      streak({ currentStreak: 9, longestStreak: 9, lastActiveDate: '2026-03-07' }),
      TODAY,
      YESTERDAY,
      10
    );
    expect(next.currentStreak).toBe(1);
    expect(next.longestStreak).toBe(9);
  });

  it('raises the longest streak when the current one passes it', () => {
    const next = applyCompletedSession(
      streak({ currentStreak: 5, longestStreak: 5, lastActiveDate: YESTERDAY }),
      TODAY,
      YESTERDAY,
      10
    );
    expect(next.longestStreak).toBe(6);
  });

  it('adds at least one whole minute of reading time', () => {
    const base = streak({ totalReadingMinutes: 20, lastActiveDate: TODAY, currentStreak: 1 });
    expect(applyCompletedSession(base, TODAY, YESTERDAY, 0).totalReadingMinutes).toBe(21);
    expect(applyCompletedSession(base, TODAY, YESTERDAY, 6.6).totalReadingMinutes).toBe(27);
  });
});

describe('visibleStreak', () => {
  it('shows the streak while the user was active today or yesterday', () => {
    expect(visibleStreak(streak({ currentStreak: 4, lastActiveDate: TODAY }), TODAY, YESTERDAY)).toBe(4);
    expect(visibleStreak(streak({ currentStreak: 4, lastActiveDate: YESTERDAY }), TODAY, YESTERDAY)).toBe(4);
  });

  it('shows 0 once a day has been missed', () => {
    expect(visibleStreak(streak({ currentStreak: 4, lastActiveDate: '2026-03-08' }), TODAY, YESTERDAY)).toBe(0);
    expect(visibleStreak(EMPTY_STREAK, TODAY, YESTERDAY)).toBe(0);
  });
});
