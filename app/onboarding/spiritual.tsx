import { router } from 'expo-router';

import { OnboardingScaffold } from '@/components/onboarding-scaffold';
import { SpiritualPicker } from '@/components/profile-pickers';
import { useOnboarding } from '@/contexts/onboarding-context';

export default function SpiritualScreen() {
  const { spiritualPreference, setSpiritualPreference } = useOnboarding();
  return (
    <OnboardingScaffold
      title="Where do you find guidance?"
      subtitle="This becomes your first reading each day. You can change it any time."
      primaryLabel="Continue"
      primaryDisabled={spiritualPreference === null}
      onPrimary={() => router.push('/onboarding/learning')}>
      <SpiritualPicker value={spiritualPreference} onChange={setSpiritualPreference} />
    </OnboardingScaffold>
  );
}
