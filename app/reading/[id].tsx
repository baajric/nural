import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DisplaySettings } from '@/components/display-settings';
import { IllustrationPanel } from '@/components/illustration-panel';
import { Button } from '@/components/ui/button';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/contexts/theme-context';
import { ARABIC_MARKER } from '@/lib/quranApi';
import { estimateReadingMinutes } from '@/lib/readingTime';
import { getSession, getSessionByIndex } from '@/lib/sessionCache';

export default function ReadingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, readingSize } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { id, sessionId, category = 'General Knowledge', title = 'Daily reading' } =
    useLocalSearchParams<{ id: string; sessionId?: string; category?: string; title?: string }>();

  const blockIndex = Number.parseInt(String(id), 10) || 0;
  const session = sessionId ? getSession(sessionId) : getSessionByIndex(blockIndex);
  const content = session?.reading_content ?? '';
  const paragraphs = useMemo(() => content.split('\n\n').filter(Boolean), [content]);
  const minutes = useMemo(() => estimateReadingMinutes(content), [content]);

  const [showDisplaySettings, setShowDisplaySettings] = useState(false);

  // Time actually spent on this screen, passed on so progress reflects real reading time.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const progress = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    const max = event.contentSize.height - event.layoutMeasurement.height;
    progress.value = max > 0 ? Math.min(1, Math.max(0, event.contentOffset.y / max)) : 1;
  });
  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const handleFinished = () => {
    const minutesRead = Math.min(30, Math.max(1, Math.round((Date.now() - startedAt.current) / 60000)));
    router.replace({
      pathname: '/chat',
      params: {
        sessionId: sessionId ?? session?.id ?? '',
        category,
        sourceTitle: title,
        minutesRead: String(minutesRead),
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close reading"
          hitSlop={12}
          style={styles.iconButton}
          onPress={() => router.back()}>
          <Feather name="x" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {category}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Text size and appearance"
          hitSlop={12}
          style={styles.iconButton}
          onPress={() => setShowDisplaySettings(true)}>
          <Text style={styles.aa}>Aa</Text>
        </Pressable>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}>
        <IllustrationPanel category={category} style={styles.art} />

        <Text style={styles.category}>{category}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{minutes} min read</Text>
        <View style={styles.rule} />

        {paragraphs.length === 0 && (
          <Text style={styles.empty}>This reading is no longer available. Go back and open it again.</Text>
        )}

        {paragraphs.map((paragraph, i) =>
          paragraph.startsWith(ARABIC_MARKER) ? (
            <Text
              key={i}
              style={[
                styles.arabic,
                { fontSize: readingSize.fontSize + 8, lineHeight: (readingSize.fontSize + 8) * 2 },
              ]}>
              {paragraph.slice(ARABIC_MARKER.length)}
            </Text>
          ) : (
            <Text
              key={i}
              style={[styles.paragraph, { fontSize: readingSize.fontSize, lineHeight: readingSize.lineHeight }]}>
              {paragraph}
            </Text>
          )
        )}

        {paragraphs.length > 0 && (
          <View style={styles.finish}>
            <View style={styles.ornament}>
              <View style={styles.ornamentLine} />
              <Feather name="feather" size={16} color={colors.gold} />
              <View style={styles.ornamentLine} />
            </View>
            <Text style={styles.finishTitle}>What stayed with you?</Text>
            <Text style={styles.finishText}>
              Take a moment with Nural to connect this reading to your own life.
            </Text>
            <Button label="Reflect on this" icon="arrow-right" onPress={handleFinished} />
          </View>
        )}
      </Animated.ScrollView>

      {/* "Aa" sheet */}
      <Modal
        visible={showDisplaySettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDisplaySettings(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowDisplaySettings(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <View style={styles.sheetHandle} />
          <DisplaySettings />
          <Button
            label="Done"
            onPress={() => setShowDisplaySettings(false)}
            style={styles.sheetButton}
          />
        </View>
      </Modal>
    </View>
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
      flex: 1,
      textAlign: 'center',
      fontFamily: Fonts.sansSemiBold,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.textSecondary,
    },
    aa: {
      fontFamily: Fonts.serifMedium,
      fontSize: 19,
      color: colors.text,
    },
    progressTrack: {
      height: 3,
      backgroundColor: colors.surfaceAlt,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.gold,
    },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
    },
    art: {
      height: 190,
      borderRadius: Radius.lg,
      marginBottom: Spacing.xl,
    },
    category: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.goldText,
    },
    title: {
      fontFamily: Fonts.serifMedium,
      fontSize: 32,
      lineHeight: 38,
      color: colors.text,
      letterSpacing: -0.3,
      marginTop: Spacing.xs,
    },
    meta: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: Spacing.sm,
    },
    rule: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: Spacing.xl,
    },
    paragraph: {
      fontFamily: Fonts.serif,
      color: colors.text,
      marginBottom: Spacing.xl,
    },
    arabic: {
      fontFamily: Fonts.arabic,
      color: colors.text,
      textAlign: 'right',
      writingDirection: 'rtl',
      marginBottom: Spacing.sm,
    },
    empty: {
      fontFamily: Fonts.sans,
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
    },
    finish: {
      marginTop: Spacing.lg,
    },
    ornament: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    ornamentLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    finishTitle: {
      fontFamily: Fonts.serifMedium,
      fontSize: 26,
      lineHeight: 32,
      color: colors.text,
      textAlign: 'center',
    },
    finishText: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      lineHeight: 23,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.xl,
    },
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
      paddingHorizontal: Spacing.screen,
      paddingTop: Spacing.md,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: Spacing.xl,
    },
    sheetButton: {
      marginTop: Spacing.xl,
    },
  });
