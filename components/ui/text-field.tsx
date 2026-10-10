import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/contexts/theme-context';

type Props = TextInputProps & {
  label?: string;
};

/** Themed text input; pass `multiline` for a taller journal-style field. */
export function TextField({ label, style, multiline, ...rest }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.gold}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.multiline, style]}
        {...rest}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    label: {
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    input: {
      fontFamily: Fonts.sans,
      fontSize: 17,
      lineHeight: 24,
      color: colors.text,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
    multiline: {
      minHeight: 130,
    },
  });
