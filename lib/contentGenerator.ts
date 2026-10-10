import { getDailyBibleReading } from './bibleApi';
import { getPassageForCategory, pickBook } from './bookReader';
import type { Book } from './bookReader';
import { getDailyQuranReading } from './quranApi';
import type { Profile } from './types';

export type { Profile } from './types';

export interface DailySession {
  category: string;
  sourceTitle: string;
  content: string;
}

export const SESSIONS_PER_DAY = 5;

/** Reading category for each spiritual path chosen in onboarding ('none' has no spiritual session). */
const SPIRITUAL_CATEGORY: Record<string, string> = {
  islam: 'Islam',
  christianity: 'Christianity',
  buddhism: 'Buddhism',
  stoicism: 'Stoicism',
  meditation: 'Mindfulness',
};

function buildCategoryList(profile: Profile): string[] {
  const areas =
    Array.isArray(profile.learning_areas) && profile.learning_areas.length > 0
      ? profile.learning_areas
      : ['General Knowledge'];

  const categories: string[] = [];
  const spiritual = profile.spiritual_preference ? SPIRITUAL_CATEGORY[profile.spiritual_preference] : undefined;
  if (spiritual) categories.push(spiritual);

  // Fill the remaining slots with the user's areas; the last slot is always General Knowledge.
  const learningSlots = SESSIONS_PER_DAY - categories.length;
  for (let i = 0; i < learningSlots; i++) {
    const isLast = i === learningSlots - 1;
    categories.push(isLast ? 'General Knowledge' : areas[i % areas.length]);
  }
  return categories;
}

/** Scripture APIs occasionally fail; try twice before giving up. */
async function withRetry<T>(load: () => Promise<T | null>, name: string): Promise<T> {
  const result = (await load()) ?? (await load());
  if (!result) throw new Error(`${name} is unavailable right now`);
  return result;
}

/** `book` is set for categories read from a book; scripture categories use their own API. */
async function generateSession(category: string, book: Book | null): Promise<DailySession> {
  if (category === 'Islam') {
    const quran = await withRetry(getDailyQuranReading, 'Quran reading');
    return { category, sourceTitle: quran.sourceTitle, content: quran.content };
  }
  if (category === 'Christianity') {
    const bible = await withRetry(getDailyBibleReading, 'Bible reading');
    return { category, sourceTitle: bible.sourceTitle, content: bible.content };
  }

  const { content, sourceTitle } = await getPassageForCategory(category, book ?? pickBook(category));
  return { category, sourceTitle, content };
}

/** Builds today's 5 reading sessions. Throws if any of them could not be loaded. */
export async function generateDailyContent(profile: Profile): Promise<DailySession[]> {
  // Choose the books up front so one day doesn't repeat a title, then load everything in parallel.
  const usedTitles = new Set<string>();
  const plan = buildCategoryList(profile).map((category) => {
    if (category === 'Islam' || category === 'Christianity') return { category, book: null };
    const book = pickBook(category, usedTitles);
    usedTitles.add(book.title);
    return { category, book };
  });
  return Promise.all(plan.map(({ category, book }) => generateSession(category, book)));
}
