import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IllustrationPanel } from '@/components/illustration-panel';
import {
  KNOWLEDGE_LEVELS,
  LEARNING_AREAS,
  MAX_LEARNING_AREAS,
  SPIRITUAL_OPTIONS,
} from '@/constants/options';
import { Fonts, PAPER_INK, Radius, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import type { KnowledgeLevel, SpiritualOption } from '@/contexts/onboarding-context';
import { useTheme, useThemedStyles } from '@/contexts/theme-context';

function tap() {
  if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
}

/** Single-choice list of spiritual paths, each with its illustration. */
export function SpiritualPicker({
  value,
  onChange,
}: {
  value: SpiritualOption | null;
  onChange: (value: SpiritualOption) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.list}>
      {SPIRITUAL_OPTIONS.map((option) => {
        const selected = value === option.id;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              tap();
              onChange(option.id);
            }}
            style={[styles.row, selected && styles.rowSelected]}>
            {option.id === 'none' ? (
              <View style={[styles.rowThumb, styles.rowThumbIcon]}>
                <Feather name="compass" size={24} color={PAPER_INK} />
              </View>
            ) : (
              <IllustrationPanel category={option.category} style={styles.rowThumb} />
            )}
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{option.label}</Text>
              <Text style={styles.rowDescription}>{option.description}</Text>
            </View>
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected && <Feather name="check" size={14} color={colors.onPrimary} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Two-column grid of illustrated learning areas; up to MAX_LEARNING_AREAS can be chosen. */
export function LearningAreaGrid({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (area: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const full = selected.length >= MAX_LEARNING_AREAS;
  return (
    <View style={styles.grid}>
      {LEARNING_AREAS.map((area) => {
        const isSelected = selected.includes(area);
        const disabled = full && !isSelected;
        return (
          <Pressable
            key={area}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected, disabled }}
            disabled={disabled}
            onPress={() => {
              tap();
              onToggle(area);
            }}
            style={[styles.tile, isSelected && styles.tileSelected, disabled && styles.tileDisabled]}>
            <IllustrationPanel category={area} style={styles.tileArt}>
              {isSelected && (
                <View style={styles.tileCheck}>
                  <Feather name="check" size={14} color={colors.onPrimary} />
                </View>
              )}
            </IllustrationPanel>
            <Text style={styles.tileLabel} numberOfLines={1}>
              {area}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function KnowledgeLevelPicker({
  value,
  onChange,
}: {
  value: KnowledgeLevel | null;
  onChange: (value: KnowledgeLevel) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.levels}>
      {KNOWLEDGE_LEVELS.map((level) => {
        const selected = value === level.value;
        return (
          <Pressable
            key={level.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              tap();
              onChange(level.value);
            }}
            style={[styles.level, selected && styles.levelSelected]}>
            <Text style={[styles.levelLabel, selected && styles.levelLabelSelected]}>{level.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: {
      gap: Spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    rowSelected: {
      borderColor: colors.gold,
      backgroundColor: colors.goldSoft,
    },
    rowThumb: {
      width: 56,
      height: 56,
      borderRadius: Radius.sm,
      backgroundColor: colors.paper,
    },
    rowThumbIcon: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      flex: 1,
    },
    rowLabel: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 16,
      color: colors.text,
    },
    rowDescription: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    tile: {
      // two columns with one gap between them
      width: '48%',
      flexGrow: 1,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    tileSelected: {
      borderColor: colors.gold,
      backgroundColor: colors.goldSoft,
    },
    tileDisabled: {
      opacity: 0.45,
    },
    tileArt: {
      aspectRatio: 1.5,
    },
    tileCheck: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileLabel: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 14,
      color: colors.text,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    levels: {
      gap: Spacing.md,
    },
    level: {
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    levelSelected: {
      borderColor: colors.gold,
      backgroundColor: colors.goldSoft,
    },
    levelLabel: {
      fontFamily: Fonts.sansMedium,
      fontSize: 16,
      color: colors.text,
    },
    levelLabelSelected: {
      fontFamily: Fonts.sansSemiBold,
    },
  });
