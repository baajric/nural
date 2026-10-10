import { router } from 'expo-router';
import { useState } from 'react';

import { OnboardingScaffold } from '@/components/onboarding-scaffold';
import { KnowledgeLevelPicker } from '@/components/profile-pickers';
import { TextField } from '@/components/ui/text-field';
import { INTERVIEW_QUESTIONS } from '@/constants/options';
import { useOnboarding } from '@/contexts/onboarding-context';

const STEPS = ['q1', 'q2', 'q3', 'q4'] as const;

const HINTS: Record<(typeof STEPS)[number], string> = {
  q1: 'Nural uses this to connect each reading to what you are facing.',
  q2: 'One clear goal is enough. Your reflections will keep coming back to it.',
  q3: 'This sets the tone of your conversations.',
  q4: 'There is no right answer — say it in your own words.',
};

export default function InterviewScreen() {
  const { interviewAnswers, setInterviewAnswer } = useOnboarding();
  const [step, setStep] = useState(0);
  const key = STEPS[step];

  const answered = key === 'q3' ? interviewAnswers.q3 !== null : interviewAnswers[key].trim().length > 0;

  const goNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else router.push('/onboarding/name');
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  return (
    <OnboardingScaffold
      eyebrow={`Question ${step + 1} of ${STEPS.length}`}
      title={INTERVIEW_QUESTIONS[key]}
      subtitle={HINTS[key]}
      primaryLabel="Continue"
      primaryDisabled={!answered}
      onPrimary={goNext}
      onBack={goBack}>
      {key === 'q3' ? (
        <KnowledgeLevelPicker
          value={interviewAnswers.q3}
          onChange={(level) => setInterviewAnswer('q3', level)}
        />
      ) : (
        <TextField
          // remount per question so the field doesn't keep the previous question's cursor/scroll
          key={key}
          multiline
          autoFocus
          placeholder="Type your answer..."
          value={interviewAnswers[key]}
          onChangeText={(text) => setInterviewAnswer(key, text)}
          maxLength={500}
        />
      )}
    </OnboardingScaffold>
  );
}
