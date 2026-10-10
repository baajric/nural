import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

const PROFILE_ID_KEY = 'nural_profile_id';
const PROFILE_CACHE_KEY = '@nural/profile';
// Keys from older versions of the app, cleared on reset.
const LEGACY_KEYS = ['@nural/onboarding_complete', '@nural/completed_blocks'];

export type SpiritualOption =
  | 'islam'
  | 'christianity'
  | 'buddhism'
  | 'stoicism'
  | 'meditation'
  | 'none';

export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

export interface OnboardingData {
  spiritualPreference: SpiritualOption | null;
  learningAreas: string[];
  interviewAnswers: {
    q1: string;
    q2: string;
    q3: KnowledgeLevel | null;
    q4: string;
  };
  name: string;
}

const defaultData: OnboardingData = {
  spiritualPreference: null,
  learningAreas: [],
  interviewAnswers: { q1: '', q2: '', q3: null, q4: '' },
  name: '',
};

type OnboardingContextValue = OnboardingData & {
  setSpiritualPreference: (v: SpiritualOption) => void;
  setLearningAreas: (areas: string[]) => void;
  toggleLearningArea: (area: string) => void;
  setInterviewAnswer: <K extends keyof OnboardingData['interviewAnswers']>(
    key: K,
    value: OnboardingData['interviewAnswers'][K]
  ) => void;
  setName: (v: string) => void;
  /** Saves the profile to Supabase. Throws if saving fails. */
  completeOnboarding: (payload?: { name?: string }) => Promise<void>;
  /** Saves changes to an existing profile. Throws if saving fails. */
  updateProfile: (next: OnboardingData) => Promise<void>;
  resetOnboarding: () => Promise<void>;
  /** null while loading from storage. */
  isOnboardingComplete: boolean | null;
  /** Supabase profile id, set once onboarding is complete. */
  profileId: string | null;
  /** The saved profile, or null before onboarding is complete. */
  profile: Profile | null;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function rowToData(row: Record<string, any>): OnboardingData {
  return {
    name: row.name ?? '',
    spiritualPreference: (row.spiritual_preference as SpiritualOption | null) ?? null,
    learningAreas: Array.isArray(row.learning_areas) ? row.learning_areas : [],
    interviewAnswers: {
      q1: row.biggest_challenge ?? '',
      q2: row.thirty_day_goal ?? '',
      q3: (row.knowledge_level as KnowledgeLevel | null) ?? null,
      q4: row.growth_meaning ?? '',
    },
  };
}

function dataToProfile(d: OnboardingData): Profile {
  return {
    name: d.name.trim() || 'Guest',
    spiritual_preference: d.spiritualPreference,
    learning_areas: d.learningAreas,
    knowledge_level: d.interviewAnswers.q3,
    biggest_challenge: d.interviewAnswers.q1,
    thirty_day_goal: d.interviewAnswers.q2,
    growth_meaning: d.interviewAnswers.q4,
  };
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    (async () => {
      const storedId = await AsyncStorage.getItem(PROFILE_ID_KEY);
      if (!storedId) {
        setIsOnboardingComplete(false);
        return;
      }

      // Show the cached profile immediately so the app works offline / instantly.
      const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        try {
          setData(JSON.parse(cached) as OnboardingData);
          setProfileId(storedId);
          setIsOnboardingComplete(true);
        } catch {}
      }

      // Refresh from Supabase.
      const { data: row, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', storedId)
        .maybeSingle();

      if (row) {
        const fresh = rowToData(row);
        setData(fresh);
        setProfileId(storedId);
        setIsOnboardingComplete(true);
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(fresh));
      } else if (!error) {
        // Profile no longer exists in the database: start onboarding again.
        await AsyncStorage.multiRemove([PROFILE_ID_KEY, PROFILE_CACHE_KEY]);
        setData(defaultData);
        setProfileId(null);
        setIsOnboardingComplete(false);
      } else if (!cached) {
        // Network error and nothing cached: we can't show anything useful yet.
        console.warn('Could not load profile', error);
        setIsOnboardingComplete(false);
      }
    })();
  }, []);

  const setSpiritualPreference = useCallback((v: SpiritualOption) => {
    setData((d) => ({ ...d, spiritualPreference: v }));
  }, []);

  const setLearningAreas = useCallback((areas: string[]) => {
    setData((d) => ({ ...d, learningAreas: areas.slice(0, 4) }));
  }, []);

  const toggleLearningArea = useCallback((area: string) => {
    setData((d) => {
      const idx = d.learningAreas.indexOf(area);
      const next =
        idx === -1
          ? [...d.learningAreas, area].slice(0, 4)
          : d.learningAreas.filter((a) => a !== area);
      return { ...d, learningAreas: next };
    });
  }, []);

  const setInterviewAnswer = useCallback(
    <K extends keyof OnboardingData['interviewAnswers']>(
      key: K,
      value: OnboardingData['interviewAnswers'][K]
    ) => {
      setData((d) => ({
        ...d,
        interviewAnswers: { ...d.interviewAnswers, [key]: value },
      }));
    },
    []
  );

  const setName = useCallback((v: string) => {
    setData((d) => ({ ...d, name: v }));
  }, []);

  const completeOnboarding = useCallback(async (payload?: { name?: string }) => {
    const d: OnboardingData = {
      ...dataRef.current,
      name: payload?.name?.trim() || dataRef.current.name.trim() || 'Guest',
    };

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .insert({
        name: d.name,
        spiritual_preference: d.spiritualPreference,
        learning_areas: d.learningAreas,
        knowledge_level: d.interviewAnswers.q3,
        biggest_challenge: d.interviewAnswers.q1,
        thirty_day_goal: d.interviewAnswers.q2,
        growth_meaning: d.interviewAnswers.q4,
        onboarding_completed: true,
        last_interview_date: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (profileError) throw profileError;

    const newId: string = profileRow.id;
    await supabase.from('streaks').insert({
      profile_id: newId,
      current_streak: 0,
      longest_streak: 0,
      total_sessions: 0,
      total_reading_minutes: 0,
    });

    await AsyncStorage.setItem(PROFILE_ID_KEY, newId);
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(d));
    setData(d);
    setProfileId(newId);
    setIsOnboardingComplete(true);
  }, []);

  const updateProfile = useCallback(
    async (next: OnboardingData) => {
      if (!profileId) throw new Error('No profile to update');
      const cleaned: OnboardingData = { ...next, name: next.name.trim() || 'Guest' };
      const { error } = await supabase
        .from('profiles')
        .update({
          name: cleaned.name,
          spiritual_preference: cleaned.spiritualPreference,
          learning_areas: cleaned.learningAreas,
          knowledge_level: cleaned.interviewAnswers.q3,
          biggest_challenge: cleaned.interviewAnswers.q1,
          thirty_day_goal: cleaned.interviewAnswers.q2,
          growth_meaning: cleaned.interviewAnswers.q4,
          last_interview_date: new Date().toISOString(),
        })
        .eq('id', profileId);
      if (error) throw error;
      await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cleaned));
      setData(cleaned);
    },
    [profileId]
  );

  const resetOnboarding = useCallback(async () => {
    await AsyncStorage.multiRemove([PROFILE_ID_KEY, PROFILE_CACHE_KEY, ...LEGACY_KEYS]);
    setData(defaultData);
    setProfileId(null);
    setIsOnboardingComplete(false);
  }, []);

  const profile = useMemo(
    () => (isOnboardingComplete && profileId ? dataToProfile(data) : null),
    [isOnboardingComplete, profileId, data]
  );

  const value: OnboardingContextValue = {
    ...data,
    setSpiritualPreference,
    setLearningAreas,
    toggleLearningArea,
    setInterviewAnswer,
    setName,
    completeOnboarding,
    updateProfile,
    resetOnboarding,
    isOnboardingComplete,
    profileId,
    profile,
  };

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
