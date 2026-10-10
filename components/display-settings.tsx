import { StyleSheet, Text, View } from 'react-native';

import { SegmentedControl } from '@/components/ui/segmented-control';
import { Fonts, READING_SIZES, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/contexts/theme-context';
import type { ThemeMode } from '@/contexts/theme-context';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const SIZE_OPTIONS = READING_SIZES.map((size, index) => ({ value: index, label: size.label }));

/** Appearance + reading text size controls, shared by Settings and the reader's "Aa" sheet. */
export function DisplaySettings() {
  const { mode, setMode, readingSizeIndex, setReadingSizeIndex, readingSize } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>Appearance</Text>
        <SegmentedControl options={THEME_OPTIONS} value={mode} onChange={setMode} />
      </View>
      <View>
        <Text style={styles.label}>Reading text size</Text>
        <SegmentedControl options={SIZE_OPTIONS} value={readingSizeIndex} onChange={setReadingSizeIndex} />
        <Text
          style={[styles.preview, { fontSize: readingSize.fontSize, lineHeight: readingSize.lineHeight }]}
          numberOfLines={2}>
          The quieter you become, the more you are able to hear.
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: Spacing.xl,
    },
    label: {
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    preview: {
      fontFamily: Fonts.serif,
      color: colors.text,
      marginTop: Spacing.md,
    },
  });
