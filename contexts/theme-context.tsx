import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { palettes, READING_SIZES } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';

const THEME_MODE_KEY = '@nural/theme_mode';
const READING_SIZE_KEY = '@nural/reading_size';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Index into READING_SIZES */
  readingSizeIndex: number;
  setReadingSizeIndex: (index: number) => void;
  readingSize: (typeof READING_SIZES)[number];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [readingSizeIndex, setReadingSizeIndexState] = useState(1);

  useEffect(() => {
    (async () => {
      const [storedMode, storedSize] = await Promise.all([
        AsyncStorage.getItem(THEME_MODE_KEY),
        AsyncStorage.getItem(READING_SIZE_KEY),
      ]);
      if (storedMode === 'system' || storedMode === 'light' || storedMode === 'dark') {
        setModeState(storedMode);
      }
      const size = Number(storedSize);
      if (storedSize !== null && Number.isInteger(size) && size >= 0 && size < READING_SIZES.length) {
        setReadingSizeIndexState(size);
      }
    })();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_MODE_KEY, next);
  }, []);

  const setReadingSizeIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(READING_SIZES.length - 1, index));
    setReadingSizeIndexState(clamped);
    AsyncStorage.setItem(READING_SIZE_KEY, String(clamped));
  }, []);

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? palettes.dark : palettes.light,
      isDark,
      mode,
      setMode,
      readingSizeIndex,
      setReadingSizeIndex,
      readingSize: READING_SIZES[readingSizeIndex],
    }),
    [isDark, mode, setMode, readingSizeIndex, setReadingSizeIndex]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/** Builds a StyleSheet from the current theme colors, rebuilt only when the theme changes. */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
