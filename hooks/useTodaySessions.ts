import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { generateDailyContent, SESSIONS_PER_DAY } from '@/lib/contentGenerator';
import { localDateString } from '@/lib/date';
import { setSessions } from '@/lib/sessionCache';
import type { CachedSession } from '@/lib/sessionCache';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

type SessionRow = {
  id: string;
  category: string | null;
  source_title: string | null;
  reading_content: string | null;
  completed: boolean | null;
};

const SESSION_COLUMNS = 'id, category, source_title, reading_content, completed';

function toCached(rows: SessionRow[]): CachedSession[] {
  return rows.map((s) => ({
    id: s.id,
    category: s.category ?? 'General Knowledge',
    source_title: s.source_title ?? 'Daily reading',
    reading_content: s.reading_content ?? '',
    completed: !!s.completed,
  }));
}

/**
 * Generation is slow and must only happen once per user per day, even if
 * several screens/effects ask at the same time.
 */
const inFlight = new Map<string, Promise<CachedSession[]>>();

async function fetchOrCreateToday(profileId: string, profile: Profile): Promise<CachedSession[]> {
  const today = localDateString();
  const { data: existing, error: fetchError } = await supabase
    .from('sessions')
    .select(SESSION_COLUMNS)
    .eq('profile_id', profileId)
    .eq('session_date', today)
    .order('created_at', { ascending: true });
  if (fetchError) throw fetchError;
  if (existing && existing.length >= SESSIONS_PER_DAY) {
    return toCached(existing.slice(0, SESSIONS_PER_DAY));
  }

  const key = `${profileId}:${today}`;
  let pending = inFlight.get(key);
  if (!pending) {
    pending = (async () => {
      const generated = await generateDailyContent(profile);
      // Rows inserted together would share one created_at and come back in random order,
      // so each gets its own timestamp to keep the day's sequence stable.
      const baseTime = Date.now();
      const { data: inserted, error: insertError } = await supabase
        .from('sessions')
        .insert(
          generated.map((s, i) => ({
            profile_id: profileId,
            category: s.category,
            source_title: s.sourceTitle,
            reading_content: s.content,
            session_date: today,
            created_at: new Date(baseTime + i).toISOString(),
          }))
        )
        .select(`${SESSION_COLUMNS}, created_at`);
      if (insertError) throw insertError;
      // An insert's returned rows can't be ordered by the database, so sort them here.
      const ordered = [...(inserted ?? [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      return toCached(ordered);
    })().finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  return pending;
}

export function useTodaySessions(profileId: string | null, profile: Profile | null) {
  const [sessions, setSessionsState] = useState<CachedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const load = useCallback(async () => {
    const currentProfile = profileRef.current;
    if (!profileId || !currentProfile) {
      setSessionsState([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const result = await fetchOrCreateToday(profileId, currentProfile);
      setSessionsState(result);
      setSessions(result);
    } catch (e) {
      console.warn('Failed to load sessions', e);
      // Supabase errors are plain objects with a `message`, not Error instances.
      const message = (e as { message?: unknown } | null)?.message;
      setError(typeof message === 'string' ? message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Refresh (without a spinner) when coming back from a reading/chat to show completed sessions.
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      load();
    }, [load])
  );

  const reload = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  return { sessions, loading, error, reload };
}
