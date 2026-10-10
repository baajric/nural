import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useOnboarding } from '@/contexts/onboarding-context';
import { addDays, localDateString } from '@/lib/date';
import { visibleStreak } from '@/lib/streak';
import { supabase } from '@/lib/supabase';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalReadingMinutes: number;
}

const EMPTY: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  totalSessions: 0,
  totalReadingMinutes: 0,
};

function formatTimeRead(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function useStreak() {
  const { profileId } = useOnboarding();
  const [data, setData] = useState<StreakData>(EMPTY);
  const [loading, setLoading] = useState(true);

  // Reload every time the screen is focused so numbers update after a session.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!profileId) {
          setData(EMPTY);
          setLoading(false);
          return;
        }
        const { data: row, error } = await supabase
          .from('streaks')
          .select('current_streak, longest_streak, last_active_date, total_sessions, total_reading_minutes')
          .eq('profile_id', profileId)
          .maybeSingle();
        if (cancelled) return;

        if (error || !row) {
          setData(EMPTY);
        } else {
          const state = {
            currentStreak: Number(row.current_streak) || 0,
            longestStreak: Number(row.longest_streak) || 0,
            lastActiveDate: row.last_active_date ?? null,
            totalSessions: Number(row.total_sessions) || 0,
            totalReadingMinutes: Number(row.total_reading_minutes) || 0,
          };
          const today = localDateString();
          const yesterday = localDateString(addDays(new Date(), -1));
          setData({
            currentStreak: visibleStreak(state, today, yesterday),
            longestStreak: state.longestStreak,
            totalSessions: state.totalSessions,
            totalReadingMinutes: state.totalReadingMinutes,
          });
        }
        setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [profileId])
  );

  return {
    ...data,
    timeReadFormatted: formatTimeRead(data.totalReadingMinutes),
    loading,
  };
}
