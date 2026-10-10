import { Stack, useSegments } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const STEPS = ['spiritual', 'learning', 'interview', 'name'] as const;

/** Segmented progress for the steps after the welcome screen. */
function OnboardingProgressBar() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const current = STEPS.findIndex((step) => (segments as string[]).includes(step));
  if (current === -1) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: Spacing.screen,
        paddingTop: insets.top + Spacing.md,
        backgroundColor: colors.background,
      }}>
      {STEPS.map((step, i) => (
        <View
          key={step}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: i <= current ? colors.gold : colors.border,
          }}
        />
      ))}
    </View>
  );
}

export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <>
      <OnboardingProgressBar />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="spiritual" />
        <Stack.Screen name="learning" />
        <Stack.Screen name="interview" />
        <Stack.Screen name="name" />
      </Stack>
    </>
  );
}
