import type { Profile } from './types';

export const SESSIONS_PER_DAY = 5;

/** Categories whose text comes from a scripture API instead of a book. */
export const SCRIPTURE_CATEGORIES = ['Islam', 'Christianity'];

/** Reading category for each spiritual path chosen in onboarding ('none' has no spiritual session). */
export const SPIRITUAL_CATEGORY: Record<string, string> = {
  islam: 'Islam',
  christianity: 'Christianity',
  buddhism: 'Buddhism',
  stoicism: 'Stoicism',
  meditation: 'Mindfulness',
};

/**
 * The day's reading categories, in order: the spiritual path first (if any), then the
 * user's learning areas in rotation, and General Knowledge in the last slot.
 */
export function buildCategoryList(profile: Pick<Profile, 'spiritual_preference' | 'learning_areas'>): string[] {
  const areas =
    Array.isArray(profile.learning_areas) && profile.learning_areas.length > 0
      ? profile.learning_areas
      : ['General Knowledge'];

  const categories: string[] = [];
  const spiritual = profile.spiritual_preference ? SPIRITUAL_CATEGORY[profile.spiritual_preference] : undefined;
  if (spiritual) categories.push(spiritual);

  const learningSlots = SESSIONS_PER_DAY - categories.length;
  for (let i = 0; i < learningSlots; i++) {
    const isLast = i === learningSlots - 1;
    categories.push(isLast ? 'General Knowledge' : areas[i % areas.length]);
  }
  return categories;
}

/** Picks one of `books`, avoiding titles already used today when another option exists. */
export function chooseBook<T extends { title: string }>(
  books: T[],
  usedTitles: ReadonlySet<string> = new Set(),
  random: () => number = Math.random
): T {
  const unused = books.filter((book) => !usedTitles.has(book.title));
  const pool = unused.length > 0 ? unused : books;
  return pool[Math.floor(random() * pool.length)];
}
