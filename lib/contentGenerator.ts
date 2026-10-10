import { getDailyBibleReading } from './bibleApi';
import { getPassageForCategory, pickBook } from './bookReader';
import type { Book } from './bookReader';
import { buildCategoryList, SCRIPTURE_CATEGORIES } from './dailyPlan';
import { getDailyQuranReading } from './quranApi';
import type { Profile } from './types';

export type { Profile } from './types';

export interface DailySession {
  category: string;
  sourceTitle: string;
  content: string;
}

export { SESSIONS_PER_DAY } from './dailyPlan';

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
    if (SCRIPTURE_CATEGORIES.includes(category)) return { category, book: null };
    const book = pickBook(category, usedTitles);
    usedTitles.add(book.title);
    return { category, book };
  });
  return Promise.all(plan.map(({ category, book }) => generateSession(category, book)));
}
