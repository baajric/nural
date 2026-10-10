import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

import { chooseBook } from './dailyPlan';
import { LOCAL_BOOKS } from './localLibrary';
import { cleanGutenbergText, extractPassage } from './passage';

/** A book a passage can be drawn from: a Project Gutenberg text or a file from the optional local library. */
export type Book = { title: string } & ({ gutenbergId: number } | { asset: number });

const g = (gutenbergId: number, title: string): Book => ({ gutenbergId, title });

// Public-domain books on Project Gutenberg (https://www.gutenberg.org), by reading category.
const MEDITATIONS = g(2680, 'Meditations');
const THE_PRINCE = g(1232, 'The Prince');
const FRANKLIN = g(20203, 'The Autobiography of Benjamin Franklin');
const WALDEN = g(205, 'Walden');
const EMERSON = g(16643, 'Essays by Ralph Waldo Emerson');
const SHORT_HISTORY = g(35461, 'A Short History of the World');
const TALKS_ON_PSYCHOLOGY = g(16287, 'Talks to Teachers on Psychology');
const MONEY_GETTING = g(8581, 'The Art of Money Getting');
const THE_LAW = g(44800, 'The Law');

const GUTENBERG_LIBRARY: Record<string, Book[]> = {
  Psychology: [
    g(445, 'The Crowd: A Study of the Popular Mind'),
    g(15489, 'Dream Psychology'),
    TALKS_ON_PSYCHOLOGY,
    g(4507, 'As a Man Thinketh'),
  ],
  Neuroscience: [g(57628, 'The Principles of Psychology'), TALKS_ON_PSYCHOLOGY],
  Productivity: [g(2274, 'How to Live on 24 Hours a Day'), g(935, 'Self-Help'), FRANKLIN],
  Finance: [
    g(4359, 'Lombard Street: A Description of the Money Market'),
    MONEY_GETTING,
    g(24518, 'Extraordinary Popular Delusions and the Madness of Crowds'),
  ],
  Economics: [g(3300, 'The Wealth of Nations'), THE_LAW, g(30107, 'Principles of Political Economy')],
  Business: [g(7213, 'My Life and Work'), MONEY_GETTING, g(368, 'Acres of Diamonds')],
  Leadership: [g(132, 'The Art of War'), THE_PRINCE, MEDITATIONS],
  Technology: [g(2900, 'The Age of Invention'), g(4238, 'On the Economy of Machinery and Manufactures')],
  Philosophy: [g(5827, 'The Problems of Philosophy'), MEDITATIONS, g(4363, 'Beyond Good and Evil')],
  History: [SHORT_HISTORY, g(7142, 'The History of the Peloponnesian War'), g(2707, 'The History of Herodotus')],
  Science: [g(1228, 'On the Origin of Species'), g(14474, 'The Chemical History of a Candle')],
  'Health & Fitness': [g(30660, 'Discourses on a Sober and Temperate Life')],
  Literature: [g(1342, 'Pride and Prejudice'), WALDEN, EMERSON],
  Politics: [g(34901, 'On Liberty'), g(147, 'Common Sense'), THE_PRINCE, g(1404, 'The Federalist Papers')],
  'Art & Creativity': [
    g(5321, 'Concerning the Spiritual in Art'),
    g(174, 'The Picture of Dorian Gray'),
    g(1974, 'The Poetics of Aristotle'),
  ],
  Law: [g(2449, 'The Common Law'), THE_LAW, g(7370, 'Second Treatise of Government'), g(1497, 'The Republic')],
  'General Knowledge': [SHORT_HISTORY, EMERSON, WALDEN, FRANKLIN],
  // Spiritual paths without a scripture API
  Buddhism: [g(2017, 'The Dhammapada')],
  Stoicism: [g(45109, 'The Enchiridion'), MEDITATIONS],
  Mindfulness: [g(216, 'Tao Te Ching'), g(2500, 'Siddhartha')],
};

/** Every book available for a category: Project Gutenberg plus any local books tagged with it. */
export function booksForCategory(category: string): Book[] {
  const local: Book[] = LOCAL_BOOKS.filter((book) => book.categories.includes(category)).map((book) => ({
    title: book.title,
    asset: book.asset,
  }));
  const online = GUTENBERG_LIBRARY[category] ?? [];
  const all = [...local, ...online];
  return all.length > 0 ? all : GUTENBERG_LIBRARY['General Knowledge'];
}

async function readLocalBook(assetModule: number): Promise<string> {
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('Could not load book asset');
  // On web the asset is served over HTTP; on devices it is a local file.
  return process.env.EXPO_OS === 'web'
    ? (await fetch(asset.localUri)).text()
    : new File(asset.localUri).text();
}

async function fetchGutenbergBook(bookId: number): Promise<string> {
  const url = `https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}.txt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gutenberg fetch failed: ${res.status}`);
  return cleanGutenbergText(await res.text());
}

/** A random ~10 minute passage from the book. */
export async function readPassage(book: Book): Promise<string> {
  const text = 'asset' in book ? await readLocalBook(book.asset) : await fetchGutenbergBook(book.gutenbergId);
  return extractPassage(text);
}

/** Picks a book for the category, avoiding titles already used today when there is another option. */
export function pickBook(category: string, usedTitles: ReadonlySet<string> = new Set()): Book {
  return chooseBook(booksForCategory(category), usedTitles);
}

/**
 * A passage from `book`; if it can't be loaded (e.g. Gutenberg is unreachable for that
 * title), falls back to the category's other books before giving up.
 */
export async function getPassageForCategory(
  category: string,
  book: Book
): Promise<{ content: string; sourceTitle: string }> {
  const alternatives = booksForCategory(category).filter((other) => other.title !== book.title);
  let lastError: unknown;
  for (const candidate of [book, ...alternatives]) {
    try {
      return { content: await readPassage(candidate), sourceTitle: candidate.title };
    } catch (e) {
      console.warn(`Could not load "${candidate.title}"`, e);
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`No reading available for ${category}`);
}
