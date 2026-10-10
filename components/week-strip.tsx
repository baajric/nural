import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/contexts/theme-context';
import { addDays, getWeekStart, localDateString } from '@/lib/date';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** This week's days (Mon–Sun): filled when at least one session was completed that day. */
export function WeekStrip({ counts }: { counts: Record<string, number> }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const monday = getWeekStart();
  const today = localDateString();

  return (
    <View style={styles.row}>
      {DAY_LABELS.map((label, i) => {
        const date = localDateString(addDays(monday, i));
        const done = (counts[date] ?? 0) > 0;
        const isToday = date === today;
        const isFuture = date > today;
        return (
          <View key={i} style={styles.day}>
            <Text style={[styles.label, isToday && styles.labelToday]}>{label}</Text>
            <View
              style={[
                styles.dot,
                done && styles.dotDone,
                isToday && !done && styles.dotToday,
                isFuture && styles.dotFuture,
              ]}>
              {done && <Feather name="check" size={16} color={colors.onPrimary} />}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    day: {
      alignItems: 'center',
      gap: Spacing.sm,
    },
    label: {
      fontFamily: Fonts.sansMedium,
      fontSize: 12,
      color: colors.textMuted,
    },
    labelToday: {
      fontFamily: Fonts.sansBold,
      color: colors.text,
    },
    dot: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotDone: {
      backgroundColor: colors.gold,
    },
    dotToday: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.gold,
    },
    dotFuture: {
      opacity: 0.5,
    },
  });
