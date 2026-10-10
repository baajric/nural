import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DisplaySettings } from '@/components/display-settings';
import { Button } from '@/components/ui/button';
import { SPIRITUAL_OPTIONS } from '@/constants/options';
import { Fonts, PAPER_INK, Radius, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useOnboarding } from '@/contexts/onboarding-context';
import { useTheme, useThemedStyles } from '@/contexts/theme-context';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { name, spiritualPreference, learningAreas, interviewAnswers, resetOnboarding } = useOnboarding();

  const userName = name?.trim() || 'Guest';
  const spiritualLabel =
    SPIRITUAL_OPTIONS.find((option) => option.id === spiritualPreference)?.label ?? 'Not set';

  const handleReset = () => {
    Alert.alert(
      'Start over?',
      'This signs this device out of your profile and restarts onboarding. Your streak will start from zero.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start over',
          style: 'destructive',
          onPress: async () => {
            await resetOnboarding();
            router.replace('/onboarding/welcome');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: Spacing.xxxl,
        paddingHorizontal: Spacing.screen,
      }}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>You</Text>

      {/* Profile */}
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={styles.name} numberOfLines={1}>
            {userName}
          </Text>
          <Text style={styles.profileMeta}>{spiritualLabel}</Text>
        </View>
      </View>

      <View style={styles.chips}>
        {learningAreas.map((area) => (
          <View key={area} style={styles.chip}>
            <Text style={styles.chipText}>{area}</Text>
          </View>
        ))}
      </View>

      {/* What the user told us in onboarding; reflections are built around this. */}
      <Pressable style={styles.card} onPress={() => router.push('/edit-profile')}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Your focus</Text>
          <Feather name="edit-2" size={16} color={colors.textSecondary} />
        </View>
        <Text style={styles.fieldLabel}>30-day goal</Text>
        <Text style={styles.fieldValue}>{interviewAnswers.q2 || 'Not set yet'}</Text>
        <Text style={styles.fieldLabel}>Biggest challenge</Text>
        <Text style={styles.fieldValue}>{interviewAnswers.q1 || 'Not set yet'}</Text>
      </Pressable>

      <Button
        label="Edit profile and interests"
        variant="secondary"
        icon="chevron-right"
        onPress={() => router.push('/edit-profile')}
        style={styles.editButton}
      />

      {/* Display */}
      <Text style={styles.sectionTitle}>Display</Text>
      <View style={styles.card}>
        <DisplaySettings />
      </View>

      <Button label="Start over" variant="ghost" onPress={handleReset} style={styles.reset} />
      <Text style={styles.version}>Nural 1.0</Text>
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    eyebrow: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.goldText,
      marginBottom: Spacing.lg,
    },
    profile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
    },
    avatar: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.paper,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: Fonts.serifMedium,
      fontSize: 32,
      color: PAPER_INK,
    },
    profileText: {
      flex: 1,
    },
    name: {
      fontFamily: Fonts.serifMedium,
      fontSize: 30,
      lineHeight: 36,
      color: colors.text,
    },
    profileMeta: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      color: colors.textSecondary,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: Radius.pill,
      backgroundColor: colors.goldSoft,
    },
    chipText: {
      fontFamily: Fonts.sansMedium,
      fontSize: 13,
      color: colors.goldText,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitle: {
      fontFamily: Fonts.serifMedium,
      fontSize: 20,
      color: colors.text,
    },
    fieldLabel: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.textMuted,
      marginTop: Spacing.lg,
    },
    fieldValue: {
      fontFamily: Fonts.serif,
      fontSize: 18,
      lineHeight: 25,
      color: colors.text,
      marginTop: Spacing.xs,
    },
    editButton: {
      marginTop: Spacing.md,
    },
    sectionTitle: {
      fontFamily: Fonts.serifMedium,
      fontSize: 22,
      color: colors.text,
      marginTop: Spacing.xxl,
      marginBottom: Spacing.md,
    },
    reset: {
      marginTop: Spacing.xxl,
    },
    version: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: Spacing.sm,
    },
  });
