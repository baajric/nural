import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Fonts, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/contexts/theme-context';

type Props = {
  title: string;
  subtitle?: string;
  /** Small label above the title, e.g. "Question 2 of 4" */
  eyebrow?: string;
  children: React.ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  /** Defaults to router.back() */
  onBack?: () => void;
};

/** Shared layout for onboarding steps: back button, heading, scrollable body, pinned action. */
export function OnboardingScaffold({
  title,
  subtitle,
  eyebrow,
  children,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryLoading,
  onBack,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={12}
        style={styles.back}
        onPress={onBack ?? (() => router.back())}>
        <Feather name="arrow-left" size={22} color={colors.text} />
      </Pressable>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <View style={styles.body}>{children}</View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Button
          label={primaryLabel}
          icon="arrow-right"
          onPress={onPrimary}
          disabled={primaryDisabled}
          loading={primaryLoading}
        />
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
    back: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginLeft: Spacing.screen - 8,
      marginTop: Spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.screen,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    eyebrow: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.goldText,
      marginBottom: Spacing.sm,
    },
    title: {
      fontFamily: Fonts.serifMedium,
      fontSize: 32,
      lineHeight: 38,
      color: colors.text,
    },
    subtitle: {
      fontFamily: Fonts.sans,
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
      marginTop: Spacing.sm,
    },
    body: {
      marginTop: Spacing.xl,
    },
    footer: {
      paddingHorizontal: Spacing.screen,
      paddingTop: Spacing.md,
      backgroundColor: colors.background,
    },
  });
