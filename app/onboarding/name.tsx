import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { OnboardingScaffold } from '@/components/onboarding-scaffold';
import { TextField } from '@/components/ui/text-field';
import { useOnboarding } from '@/contexts/onboarding-context';

export default function NameScreen() {
  const { name, setName, completeOnboarding } = useOnboarding();
  const [localName, setLocalName] = useState(name);
  const [saving, setSaving] = useState(false);

  const handleStart = async () => {
    if (saving) return;
    const trimmedName = localName.trim();
    setName(trimmedName);
    setSaving(true);
    try {
      await completeOnboarding({ name: trimmedName });
      router.replace('/(tabs)');
    } catch (e) {
      console.warn('Saving profile failed', e);
      Alert.alert('Could not save your profile', 'Please check your internet connection and try again.');
      setSaving(false);
    }
  };

  return (
    <OnboardingScaffold
      eyebrow="Last step"
      title="What should we call you?"
      subtitle="Nural will greet you by name each day."
      primaryLabel="Start my journey"
      primaryDisabled={localName.trim().length === 0}
      primaryLoading={saving}
      onPrimary={handleStart}>
      <TextField
        autoFocus
        placeholder="Your name"
        value={localName}
        onChangeText={setLocalName}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={handleStart}
        maxLength={40}
      />
    </OnboardingScaffold>
  );
}
