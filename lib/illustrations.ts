/**
 * Illustration for each reading category.
 * `paper` is the measured color at the image's left/right edges, so a panel painted
 * with it continues the artwork without a visible seam.
 */
export type Illustration = { source: number; paper: string };

const art = {
  psychology: { source: require('../assets/illustrations/psychology.webp'), paper: '#F0E1C9' },
  finance: { source: require('../assets/illustrations/finance.webp'), paper: '#EFE3CC' },
  business: { source: require('../assets/illustrations/business.webp'), paper: '#EFE1C9' },
  technology: { source: require('../assets/illustrations/technology.webp'), paper: '#EFE3CE' },
  philosophy: { source: require('../assets/illustrations/philosophy.webp'), paper: '#F0E2C9' },
  history: { source: require('../assets/illustrations/history.webp'), paper: '#EDE1CA' },
  science: { source: require('../assets/illustrations/science.webp'), paper: '#EEE0CA' },
  health: { source: require('../assets/illustrations/health.webp'), paper: '#EFDFC9' },
  leadership: { source: require('../assets/illustrations/leadership.webp'), paper: '#EFE2CC' },
  productivity: { source: require('../assets/illustrations/productivity.webp'), paper: '#EFE1C8' },
  economics: { source: require('../assets/illustrations/economics.webp'), paper: '#EFE1C8' },
  neuroscience: { source: require('../assets/illustrations/neuroscience.webp'), paper: '#F0E1CB' },
  literature: { source: require('../assets/illustrations/literature.webp'), paper: '#EFE3CB' },
  politics: { source: require('../assets/illustrations/politics.webp'), paper: '#EDE0CA' },
  art: { source: require('../assets/illustrations/art.webp'), paper: '#F1E4CC' },
  law: { source: require('../assets/illustrations/law.webp'), paper: '#F0E3CC' },
  general: { source: require('../assets/illustrations/general.webp'), paper: '#EFE0C8' },
  islam: { source: require('../assets/illustrations/islam.webp'), paper: '#EEDEC6' },
  christianity: { source: require('../assets/illustrations/christianity.webp'), paper: '#F0E1C5' },
  buddhism: { source: require('../assets/illustrations/buddhism.webp'), paper: '#EEE2CB' },
  mindfulness: { source: require('../assets/illustrations/mindfulness.webp'), paper: '#F1E3CA' },
  complete: { source: require('../assets/illustrations/complete.webp'), paper: '#EFE2C9' },
} satisfies Record<string, Illustration>;

const BY_CATEGORY: Record<string, Illustration> = {
  Psychology: art.psychology,
  Finance: art.finance,
  Business: art.business,
  Technology: art.technology,
  Philosophy: art.philosophy,
  History: art.history,
  Science: art.science,
  'Health & Fitness': art.health,
  Leadership: art.leadership,
  Productivity: art.productivity,
  Economics: art.economics,
  Neuroscience: art.neuroscience,
  Literature: art.literature,
  Politics: art.politics,
  'Art & Creativity': art.art,
  Law: art.law,
  'General Knowledge': art.general,
  // Spiritual paths
  Islam: art.islam,
  Christianity: art.christianity,
  Buddhism: art.buddhism,
  Stoicism: art.philosophy,
  Mindfulness: art.mindfulness,
};

export const HERO_ILLUSTRATION: number = require('../assets/illustrations/hero.webp');
export const DAY_COMPLETE_ILLUSTRATION: Illustration = art.complete;

export function getIllustration(category: string): Illustration {
  return BY_CATEGORY[category] ?? art.general;
}
