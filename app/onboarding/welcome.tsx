import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Fonts, palettes, PAPER_INK, Spacing } from '@/constants/theme';
import { HERO_ILLUSTRATION } from '@/lib/illustrations';

// The welcome screen is a "book cover": always printed on paper, in both themes.
const PAPER = palettes.light.paper;
const PAPER_TRANSPARENT = 'rgba(240, 226, 202, 0)';

const FACTS = [
  { value: '5', label: 'readings' },
  { value: '10', label: 'minutes each' },
  { value: '1', label: 'reflection' },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.heroWrap}>
        <Image source={HERO_ILLUSTRATION} style={styles.hero} contentFit="cover" contentPosition="bottom" />
        <LinearGradient colors={[PAPER, PAPER_TRANSPARENT]} style={[styles.fade, styles.fadeTop]} />
        <LinearGradient colors={[PAPER_TRANSPARENT, PAPER]} style={[styles.fade, styles.fadeBottom]} />
      </View>

      <Animated.View
        entering={FadeInDown.duration(600).delay(150)}
        style={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Text style={styles.wordmark}>Nural</Text>
        <Text style={styles.tagline}>A few quiet minutes a day to read, reflect and grow.</Text>

        <View style={styles.facts}>
          {FACTS.map((fact, i) => (
            <View key={fact.label} style={[styles.fact, i > 0 && styles.factDivider]}>
              <Text style={styles.factValue}>{fact.value}</Text>
              <Text style={styles.factLabel}>{fact.label}</Text>
            </View>
          ))}
        </View>

        <Button
          label="Begin"
          icon="arrow-right"
          onPress={() => router.push('/onboarding/spiritual')}
          fixedColors={{ background: PAPER_INK, foreground: PAPER }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAPER,
  },
  heroWrap: {
    flex: 1,
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  fadeTop: {
    top: 0,
    height: 90,
  },
  fadeBottom: {
    bottom: 0,
    height: 80,
  },
  content: {
    paddingHorizontal: Spacing.screen,
  },
  wordmark: {
    fontFamily: Fonts.serifMedium,
    fontSize: 60,
    lineHeight: 66,
    color: PAPER_INK,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    lineHeight: 28,
    color: PAPER_INK,
    opacity: 0.8,
    marginTop: Spacing.xs,
  },
  facts: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  fact: {
    flex: 1,
  },
  factDivider: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(28, 36, 56, 0.18)',
    paddingLeft: Spacing.lg,
  },
  factValue: {
    fontFamily: Fonts.serifMedium,
    fontSize: 30,
    color: PAPER_INK,
  },
  factLabel: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: PAPER_INK,
    opacity: 0.7,
  },
});
