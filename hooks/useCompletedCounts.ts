import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useOnboarding } from '@/contexts/onboarding-context';
import { getCompletedCountsByDate } from '@/lib/progress';

/**
 * Completed sessions per local date (YYYY-MM-DD) since `fromDate`.
 * Reloads whenever the screen regains focus.
 */
export function useCompletedCounts(fromDate: string): Record<string, number> {
  const { profileId } = useOnboarding();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      if (!profileId) return;
      let cancelled = false;
      getCompletedCountsByDate(profileId, fromDate)
        .then((c) => {
          if (!cancelled) setCounts(c);
        })
        .catch((e) => console.warn('Failed to load progress', e));
      return () => {
        cancelled = true;
      };
    }, [profileId, fromDate])
  );

  return counts;
}
