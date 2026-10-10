/**
 * Optional personal library.
 *
 * Nural works out of the box with public-domain books from Project Gutenberg.
 * To also read from your own books, put plain-text files in `assets/books/` next to a
 * `library.json` describing them (the folder is git-ignored):
 *
 *   [{ "file": "my-book.txt", "title": "My Book", "categories": ["Psychology", "Productivity"] }]
 *
 * Categories are the learning areas from `constants/options.ts`.
 */

export interface LocalBook {
  title: string;
  categories: string[];
  /** Metro asset module for the .txt file */
  asset: number;
}

interface LibraryEntry {
  file?: unknown;
  title?: unknown;
  categories?: unknown;
}

function loadLocalBooks(): LocalBook[] {
  try {
    // Resolved at bundle time; an empty or missing folder simply yields no books.
    const context = require.context('../assets/books', false, /\.(txt|json)$/);
    const keys = context.keys();
    if (!keys.includes('./library.json')) return [];

    const manifest = context('./library.json');
    const entries: LibraryEntry[] = Array.isArray(manifest) ? manifest : (manifest?.default ?? []);

    return entries.flatMap((entry) => {
      const key = `./${String(entry.file)}`;
      if (typeof entry.title !== 'string' || !Array.isArray(entry.categories) || !keys.includes(key)) {
        return [];
      }
      return [{ title: entry.title, categories: entry.categories.map(String), asset: context(key) as number }];
    });
  } catch (e) {
    console.warn('Could not read the local library, using Project Gutenberg only', e);
    return [];
  }
}

export const LOCAL_BOOKS: LocalBook[] = loadLocalBooks();
