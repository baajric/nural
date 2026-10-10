import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, palettes, PAPER_INK, Radius, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/contexts/theme-context';
import { useCompletedCounts } from '@/hooks/useCompletedCounts';
import { useStreak } from '@/hooks/useStreak';
import { SESSIONS_PER_DAY } from '@/lib/contentGenerator';
import { addDays, getWeekStart, localDateString, mondayIndex } from '@/lib/date';

const BAR_MAX_HEIGHT = 96;
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type DayCell = {
  /** null for the empty cells before the 1st */
  day: number | null;
  isToday: boolean;
  isFuture: boolean;
  status: 'full' | 'partial' | 'none';
};

function getMonthCalendar(today: Date, counts: Record<string, number>): DayCell[] {
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: DayCell[] = [];

  for (let i = 0; i < mondayIndex(new Date(year, month, 1)); i++) {
    cells.push({ day: null, isToday: false, isFuture: false, status: 'none' });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const done = counts[localDateString(new Date(year, month, day))] ?? 0;
    cells.push({
      day,
      isToday: day === today.getDate(),
      isFuture: day > today.getDate(),
      status: done >= SESSIONS_PER_DAY ? 'full' : done > 0 ? 'partial' : 'none',
    });
  }
  return cells;
}

export default function ProgressScreen() {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { currentStreak, longestStreak, totalSessions, timeReadFormatted } = useStreak();

  // One query covers both the month calendar and the current week.
  const { today, weekStart, fromDate } = useMemo(() => {
    const now = new Date();
    const monday = getWeekStart(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      today: now,
      weekStart: monday,
      fromDate: localDateString(monday < monthStart ? monday : monthStart),
    };
  }, []);
  const counts = useCompletedCounts(fromDate);

  const calendar = getMonthCalendar(today, counts);
  const week = WEEKDAY_LABELS.map((label, i) => ({
    label,
    sessions: counts[localDateString(addDays(weekStart, i))] ?? 0,
    isToday: i === mondayIndex(today),
  }));
  const monthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: Spacing.xxxl,
        paddingHorizontal: Spacing.screen,
      }}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>Your journey</Text>
      <Text style={styles.title}>Small steps,{'\n'}every day</Text>

      {/* Streak */}
      <View style={styles.streakCard}>
        <View style={styles.streakMain}>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <View>
            <Ionicons name="flame" size={26} color={palettes.light.terracotta} />
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
        </View>
        <Text style={styles.streakHint}>
          {currentStreak === 0
            ? 'Finish one reading today to start a streak.'
            : `Your longest run is ${longestStreak} ${longestStreak === 1 ? 'day' : 'days'}. Keep it going.`}
        </Text>
      </View>

      {/* Totals */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalSessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{timeReadFormatted}</Text>
          <Text style={styles.statLabel}>Time read</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{longestStreak}</Text>
          <Text style={styles.statLabel}>Best streak</Text>
        </View>
      </View>

      {/* This week */}
      <Text style={styles.sectionTitle}>This week</Text>
      <View style={styles.card}>
        <View style={styles.bars}>
          {week.map((day) => {
            const ratio = Math.min(1, day.sessions / SESSIONS_PER_DAY);
            return (
              <View key={day.label} style={styles.barColumn}>
                <Text style={styles.barCount}>{day.sessions}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: Math.max(ratio * BAR_MAX_HEIGHT, day.sessions > 0 ? 8 : 0) },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, day.isToday && styles.barLabelToday]}>{day.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* This month */}
      <Text style={styles.sectionTitle}>{monthLabel}</Text>
      <View style={styles.card}>
        <View style={styles.weekdays}>
          {WEEKDAY_LABELS.map((label) => (
            <Text key={label} style={styles.weekday}>
              {label.charAt(0)}
            </Text>
          ))}
        </View>
        <View style={styles.calendar}>
          {calendar.map((cell, index) => (
            <View key={index} style={styles.dayCell}>
              {cell.day !== null && (
                <View
                  style={[
                    styles.dayCircle,
                    cell.status === 'partial' && styles.dayPartial,
                    cell.status === 'full' && styles.dayFull,
                    cell.isToday && styles.dayToday,
                  ]}>
                  <Text
                    style={[
                      styles.dayNumber,
                      cell.isFuture && styles.dayNumberFuture,
                      cell.status === 'partial' && styles.dayNumberPartial,
                      cell.status === 'full' && styles.dayNumberFull,
                    ]}>
                    {cell.day}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.dayPartial]} />
            <Text style={styles.legendText}>Some readings</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.dayFull]} />
            <Text style={styles.legendText}>All {SESSIONS_PER_DAY}</Text>
          </View>
        </View>
      </View>
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
      marginBottom: Spacing.sm,
    },
    title: {
      fontFamily: Fonts.serifMedium,
      fontSize: 34,
      lineHeight: 40,
      color: colors.text,
      letterSpacing: -0.3,
      marginBottom: Spacing.xl,
    },
    // Printed on paper in both themes, like the illustrations.
    streakCard: {
      backgroundColor: colors.paper,
      borderRadius: Radius.lg,
      padding: Spacing.xl,
    },
    streakMain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    streakNumber: {
      fontFamily: Fonts.serifMedium,
      fontSize: 84,
      lineHeight: 88,
      color: PAPER_INK,
      letterSpacing: -2,
    },
    streakLabel: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 15,
      color: PAPER_INK,
      marginTop: 2,
    },
    streakHint: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      lineHeight: 22,
      color: PAPER_INK,
      opacity: 0.75,
      marginTop: Spacing.sm,
    },
    stats: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    stat: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.md,
    },
    statValue: {
      fontFamily: Fonts.serifMedium,
      fontSize: 24,
      color: colors.text,
    },
    statLabel: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    sectionTitle: {
      fontFamily: Fonts.serifMedium,
      fontSize: 22,
      color: colors.text,
      marginTop: Spacing.xxl,
      marginBottom: Spacing.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
    },
    bars: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    barColumn: {
      flex: 1,
      alignItems: 'center',
    },
    barCount: {
      fontFamily: Fonts.sansMedium,
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    barTrack: {
      width: 14,
      height: BAR_MAX_HEIGHT,
      borderRadius: 7,
      backgroundColor: colors.surfaceAlt,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    barFill: {
      width: '100%',
      borderRadius: 7,
      backgroundColor: colors.gold,
    },
    barLabel: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: Spacing.sm,
    },
    barLabelToday: {
      fontFamily: Fonts.sansBold,
      color: colors.text,
    },
    weekdays: {
      flexDirection: 'row',
      marginBottom: Spacing.sm,
    },
    weekday: {
      width: `${100 / 7}%`,
      textAlign: 'center',
      fontFamily: Fonts.sansMedium,
      fontSize: 12,
      color: colors.textMuted,
    },
    calendar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: `${100 / 7}%`,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayPartial: {
      backgroundColor: colors.goldSoft,
    },
    dayFull: {
      backgroundColor: colors.gold,
    },
    dayToday: {
      borderWidth: 2,
      borderColor: colors.text,
    },
    dayNumber: {
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      color: colors.text,
    },
    dayNumberFuture: {
      color: colors.textMuted,
    },
    dayNumberPartial: {
      color: colors.goldText,
    },
    dayNumberFull: {
      fontFamily: Fonts.sansBold,
      color: colors.onPrimary,
    },
    legend: {
      flexDirection: 'row',
      gap: Spacing.xl,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      color: colors.textSecondary,
    },
  });
