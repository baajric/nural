import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IllustrationPanel } from '@/components/illustration-panel';
import { Button } from '@/components/ui/button';
import { WeekStrip } from '@/components/week-strip';
import { Fonts, PAPER_INK, Radius, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useOnboarding } from '@/contexts/onboarding-context';
import { useTheme, useThemedStyles } from '@/contexts/theme-context';
import { useCompletedCounts } from '@/hooks/useCompletedCounts';
import { useStreak } from '@/hooks/useStreak';
import { useTodaySessions } from '@/hooks/useTodaySessions';
import { getWeekStart, localDateString } from '@/lib/date';
import { DAY_COMPLETE_ILLUSTRATION } from '@/lib/illustrations';
import { estimateReadingMinutes } from '@/lib/readingTime';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { name, profileId, profile } = useOnboarding();
  const { currentStreak } = useStreak();
  const { sessions, loading, error, reload } = useTodaySessions(profileId, profile);
  const weekStart = useMemo(() => localDateString(getWeekStart()), []);
  const weekCounts = useCompletedCounts(weekStart);

  const userName = name?.trim() || 'there';
  const completedCount = sessions.filter((s) => s.completed).length;
  const nextIndex = sessions.findIndex((s) => !s.completed);
  const next = nextIndex >= 0 ? sessions[nextIndex] : null;
  const allDone = sessions.length > 0 && !next;

  const openSession = (index: number) => {
    const session = sessions[index];
    if (!session) return;
    router.push({
      pathname: '/reading/[id]',
      params: {
        id: String(index),
        sessionId: session.id,
        category: session.category,
        title: session.source_title,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingTitle}>Preparing today&apos;s readings</Text>
        <Text style={styles.loadingText}>Choosing five passages for you…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Feather name="cloud-off" size={32} color={colors.textMuted} />
        <Text style={styles.loadingTitle}>Couldn&apos;t prepare today&apos;s readings</Text>
        <Text style={styles.loadingText}>{error}</Text>
        <Button label="Try again" onPress={reload} style={styles.retry} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: Spacing.xxxl,
        paddingHorizontal: Spacing.screen,
      }}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.date}>{formatDate(new Date())}</Text>
          <Text style={styles.greeting}>
            {greeting()},{'\n'}
            {userName}
          </Text>
        </View>
        <View style={styles.streakPill} accessibilityLabel={`${currentStreak} day streak`}>
          <Ionicons name="flame" size={16} color={colors.terracotta} />
          <Text style={styles.streakCount}>{currentStreak}</Text>
        </View>
      </View>

      {/* This week */}
      <View style={styles.weekCard}>
        <WeekStrip counts={weekCounts} />
      </View>

      {/* Up next / day complete */}
      {next && (
        <Animated.View entering={FadeInDown.duration(450)}>
          <Pressable
            style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
            onPress={() => openSession(nextIndex)}>
            <IllustrationPanel category={next.category} style={styles.heroArt}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>
                  {completedCount === 0 ? 'Start here' : 'Up next'} · {nextIndex + 1} of {sessions.length}
                </Text>
              </View>
            </IllustrationPanel>
            <View style={styles.heroBody}>
              <Text style={styles.category}>{next.category}</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {next.source_title}
              </Text>
              <View style={styles.metaRow}>
                <Feather name="clock" size={14} color={colors.textSecondary} />
                <Text style={styles.meta}>{estimateReadingMinutes(next.reading_content)} min read · then reflect</Text>
              </View>
              <Button label="Begin reading" icon="arrow-right" onPress={() => openSession(nextIndex)} />
            </View>
          </Pressable>
        </Animated.View>
      )}

      {allDone && (
        <Animated.View entering={FadeInDown.duration(450)} style={styles.hero}>
          <IllustrationPanel illustration={DAY_COMPLETE_ILLUSTRATION} style={styles.heroArt} />
          <View style={styles.heroBody}>
            <Text style={styles.category}>Day complete</Text>
            <Text style={styles.heroTitle}>You read and reflected on all {sessions.length} today.</Text>
            <Text style={styles.doneText}>
              Let it settle. A new set of readings will be waiting for you tomorrow.
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Today's path */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today&apos;s path</Text>
        <Text style={styles.sectionMeta}>
          {completedCount} of {sessions.length} done
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${sessions.length ? (completedCount / sessions.length) * 100 : 0}%` },
          ]}
        />
      </View>

      <View style={styles.path}>
        {sessions.map((session, index) => {
          const isNext = index === nextIndex;
          const isLast = index === sessions.length - 1;
          return (
            <Animated.View key={session.id} entering={FadeInDown.duration(400).delay(80 * index)}>
              <Pressable
                style={({ pressed }) => [styles.step, pressed && styles.pressed]}
                onPress={() => openSession(index)}>
                <View style={styles.stepRail}>
                  <View
                    style={[
                      styles.stepDot,
                      session.completed && styles.stepDotDone,
                      isNext && styles.stepDotNext,
                    ]}>
                    {session.completed ? (
                      <Feather name="check" size={14} color={colors.onPrimary} />
                    ) : (
                      <Text style={[styles.stepNumber, isNext && styles.stepNumberNext]}>{index + 1}</Text>
                    )}
                  </View>
                  {!isLast && <View style={[styles.stepLine, session.completed && styles.stepLineDone]} />}
                </View>
                <View style={[styles.stepCard, session.completed && styles.stepCardDone]}>
                  <IllustrationPanel category={session.category} style={styles.stepThumb} />
                  <View style={styles.stepText}>
                    <Text style={styles.stepCategory}>{session.category}</Text>
                    <Text style={styles.stepTitle} numberOfLines={2}>
                      {session.source_title}
                    </Text>
                  </View>
                  <Feather
                    name={session.completed ? 'rotate-ccw' : 'chevron-right'}
                    size={session.completed ? 16 : 20}
                    color={colors.textMuted}
                  />
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xxl,
    },
    loadingTitle: {
      fontFamily: Fonts.serifMedium,
      fontSize: 22,
      color: colors.text,
      textAlign: 'center',
      marginTop: Spacing.lg,
    },
    loadingText: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.xs,
    },
    retry: {
      marginTop: Spacing.xl,
      alignSelf: 'stretch',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: Spacing.xl,
    },
    headerText: {
      flex: 1,
    },
    date: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.goldText,
      marginBottom: Spacing.sm,
    },
    greeting: {
      fontFamily: Fonts.serifMedium,
      fontSize: 34,
      lineHeight: 40,
      color: colors.text,
      letterSpacing: -0.3,
    },
    streakPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    streakCount: {
      fontFamily: Fonts.sansBold,
      fontSize: 15,
      color: colors.text,
    },
    weekCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    hero: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    pressed: {
      opacity: 0.9,
    },
    heroArt: {
      height: 210,
    },
    heroBadge: {
      position: 'absolute',
      top: Spacing.md,
      left: Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: Radius.pill,
      backgroundColor: PAPER_INK,
    },
    heroBadgeText: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 12,
      color: colors.paper,
    },
    heroBody: {
      padding: Spacing.xl,
    },
    category: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.goldText,
    },
    heroTitle: {
      fontFamily: Fonts.serifMedium,
      fontSize: 26,
      lineHeight: 32,
      color: colors.text,
      marginTop: Spacing.xs,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    meta: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: colors.textSecondary,
    },
    doneText: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      lineHeight: 23,
      color: colors.textSecondary,
      marginTop: Spacing.sm,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginTop: Spacing.xxl,
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontFamily: Fonts.serifMedium,
      fontSize: 22,
      color: colors.text,
    },
    sectionMeta: {
      fontFamily: Fonts.sansMedium,
      fontSize: 13,
      color: colors.textSecondary,
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.surfaceAlt,
      overflow: 'hidden',
      marginBottom: Spacing.lg,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: colors.gold,
    },
    path: {},
    step: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    stepRail: {
      alignItems: 'center',
      width: 28,
    },
    stepDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      marginTop: 22,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepDotDone: {
      backgroundColor: colors.gold,
    },
    stepDotNext: {
      backgroundColor: colors.primary,
    },
    stepNumber: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 13,
      color: colors.textSecondary,
    },
    stepNumberNext: {
      color: colors.onPrimary,
    },
    stepLine: {
      flex: 1,
      width: 2,
      marginTop: 4,
      marginBottom: -18,
      backgroundColor: colors.border,
    },
    stepLineDone: {
      backgroundColor: colors.gold,
    },
    stepCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    stepCardDone: {
      opacity: 0.6,
    },
    stepThumb: {
      width: 52,
      height: 52,
      borderRadius: Radius.sm,
    },
    stepText: {
      flex: 1,
    },
    stepCategory: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.goldText,
    },
    stepTitle: {
      fontFamily: Fonts.serifMedium,
      fontSize: 17,
      lineHeight: 22,
      color: colors.text,
      marginTop: 2,
    },
  });
