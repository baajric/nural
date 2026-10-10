import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type Props = {
  label: string;
  onPress: () => void;
  /** primary: filled; secondary: outlined; ghost: text only */
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: keyof typeof Feather.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  /** Fixed colors for surfaces that don't follow the theme (e.g. illustration paper). */
  fixedColors?: { background: string; foreground: string };
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  fixedColors,
  style,
}: Props) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  const background = fixedColors?.background ?? (variant === 'primary' ? colors.primary : 'transparent');
  const foreground = fixedColors?.foreground ?? (variant === 'primary' ? colors.onPrimary : colors.text);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={() => {
        if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.border },
        variant === 'ghost' && styles.ghost,
        pressed && styles.pressed,
        inactive && styles.inactive,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          <Text style={[styles.label, { color: foreground }]}>{label}</Text>
          {icon && <Feather name={icon} size={18} color={foreground} />}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  ghost: {
    minHeight: 44,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  inactive: {
    opacity: 0.4,
  },
});
