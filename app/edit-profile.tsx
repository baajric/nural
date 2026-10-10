import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KnowledgeLevelPicker, LearningAreaGrid, SpiritualPicker } from '@/components/profile-pickers';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { INTERVIEW_QUESTIONS, MAX_LEARNING_AREAS } from '@/constants/options';
import { Fonts, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useOnboarding } from '@/contexts/onboarding-context';
import type { OnboardingData } from '@/contexts/onboarding-context';
import { useTheme, useThemedStyles } from '@/contexts/theme-context';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { name, spiritualPreference, learningAreas, interviewAnswers, updateProfile } = useOnboarding();

  // Edit a local copy; nothing is saved until "Save changes".
  const [draft, setDraft] = useState<OnboardingData>({
    name,
    spiritualPreference,
    learningAreas,
    interviewAnswers,
  });
  const [saving, setSaving] = useState(false);

  const setAnswer = <K extends keyof OnboardingData['interviewAnswers']>(
    key: K,
    value: OnboardingData['interviewAnswers'][K]
  ) => setDraft((d) => ({ ...d, interviewAnswers: { ...d.interviewAnswers, [key]: value } }));

  const toggleArea = (area: string) =>
    setDraft((d) => ({
      ...d,
      learningAreas: d.learningAreas.includes(area)
        ? d.learningAreas.filter((a) => a !== area)
        : [...d.learningAreas, area].slice(0, MAX_LEARNING_AREAS),
    }));

  const canSave = draft.name.trim().length > 0 && draft.learningAreas.length > 0;

  const handleSave = async () => {
    if (saving || !canSave) return;
    setSaving(true);
    try {
      await updateProfile(draft);
      router.back();
    } catch (e) {
      console.warn('Updating profile failed', e);
      Alert.alert('Could not save', 'Please check your internet connection and try again.');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      {/* iOS shows this as a sheet; Android is full screen and needs the status bar inset. */}
      <View style={[styles.topBar, process.env.EXPO_OS === 'android' && { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
          style={styles.iconButton}
          onPress={() => router.back()}>
          <Feather name="x" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Edit profile</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <TextField
          label="Name"
          value={draft.name}
          onChangeText={(text) => setDraft((d) => ({ ...d, name: text }))}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={40}
        />

        <Text style={styles.sectionTitle}>Where you find guidance</Text>
        <SpiritualPicker
          value={draft.spiritualPreference}
          onChange={(value) => setDraft((d) => ({ ...d, spiritualPreference: value }))}
        />

        <Text style={styles.sectionTitle}>What you&apos;re curious about</Text>
        <Text style={styles.sectionHint}>
          {draft.learningAreas.length} of {MAX_LEARNING_AREAS} selected
        </Text>
        <LearningAreaGrid selected={draft.learningAreas} onToggle={toggleArea} />

        <Text style={styles.sectionTitle}>Your focus</Text>
        <View style={styles.fields}>
          <TextField
            label={INTERVIEW_QUESTIONS.q2}
            multiline
            value={draft.interviewAnswers.q2}
            onChangeText={(text) => setAnswer('q2', text)}
            maxLength={500}
          />
          <TextField
            label={INTERVIEW_QUESTIONS.q1}
            multiline
            value={draft.interviewAnswers.q1}
            onChangeText={(text) => setAnswer('q1', text)}
            maxLength={500}
          />
          <TextField
            label={INTERVIEW_QUESTIONS.q4}
            multiline
            value={draft.interviewAnswers.q4}
            onChangeText={(text) => setAnswer('q4', text)}
            maxLength={500}
          />
        </View>

        <Text style={styles.sectionTitle}>{INTERVIEW_QUESTIONS.q3}</Text>
        <KnowledgeLevelPicker value={draft.interviewAnswers.q3} onChange={(level) => setAnswer('q3', level)} />

        <Text style={styles.note}>
          Changes to your guidance and interests apply from tomorrow&apos;s readings.
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Button label="Save changes" onPress={handleSave} disabled={!canSave} loading={saving} />
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.screen - 8,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topTitle: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 16,
      color: colors.text,
    },
    content: {
      paddingHorizontal: Spacing.screen,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    sectionTitle: {
      fontFamily: Fonts.serifMedium,
      fontSize: 22,
      lineHeight: 28,
      color: colors.text,
      marginTop: Spacing.xxl,
      marginBottom: Spacing.md,
    },
    sectionHint: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: -Spacing.sm,
      marginBottom: Spacing.md,
    },
    fields: {
      gap: Spacing.lg,
    },
    note: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      lineHeight: 21,
      color: colors.textSecondary,
      marginTop: Spacing.xl,
    },
    footer: {
      paddingHorizontal: Spacing.screen,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
  });
