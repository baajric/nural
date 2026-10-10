import { router } from 'expo-router';

import { OnboardingScaffold } from '@/components/onboarding-scaffold';
import { LearningAreaGrid } from '@/components/profile-pickers';
import { MAX_LEARNING_AREAS } from '@/constants/options';
import { useOnboarding } from '@/contexts/onboarding-context';

export default function LearningScreen() {
  const { learningAreas, toggleLearningArea } = useOnboarding();
  const count = learningAreas.length;
  return (
    <OnboardingScaffold
      title="What are you curious about?"
      subtitle={`Pick up to ${MAX_LEARNING_AREAS} areas. Your daily readings are drawn from these.`}
      eyebrow={`${count} of ${MAX_LEARNING_AREAS} selected`}
      primaryLabel="Continue"
      primaryDisabled={count === 0}
      onPrimary={() => router.push('/onboarding/interview')}>
      <LearningAreaGrid selected={learningAreas} onToggle={toggleLearningArea} />
    </OnboardingScaffold>
  );
}
