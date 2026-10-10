import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { useOnboarding } from '@/contexts/onboarding-context';
import { useTheme } from '@/contexts/theme-context';

export default function IndexScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isOnboardingComplete } = useOnboarding();

  useEffect(() => {
    if (isOnboardingComplete === null) return;
    if (isOnboardingComplete) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding/welcome');
    }
  }, [isOnboardingComplete, router]);

  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}
