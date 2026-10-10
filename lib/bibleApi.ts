const BASE_URL = 'https://bible-api.com';

/** Well-known chapters that read well on their own (World English Bible, public domain). */
const CHAPTERS: [book: string, chapters: number[]][] = [
  ['Psalms', [1, 8, 19, 23, 27, 34, 37, 46, 51, 90, 91, 103, 121, 139]],
  ['Proverbs', [1, 2, 3, 4, 8, 10, 11, 12, 15, 16, 22, 27]],
  ['Ecclesiastes', [1, 3, 5, 7, 11, 12]],
  ['Isaiah', [40, 55]],
  ['Matthew', [5, 6, 7, 13, 25]],
  ['Luke', [6, 10, 15]],
  ['John', [1, 14, 15]],
  ['Romans', [8, 12]],
  ['1 Corinthians', [13]],
  ['Philippians', [4]],
  ['James', [1, 3]],
];

interface BibleResponse {
  reference?: string;
  verses?: { verse: number; text: string }[];
}

export async function getDailyBibleReading(): Promise<{ content: string; sourceTitle: string } | null> {
  try {
    const [book, chapters] = CHAPTERS[Math.floor(Math.random() * CHAPTERS.length)];
    const chapter = chapters[Math.floor(Math.random() * chapters.length)];
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(`${book} ${chapter}`)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as BibleResponse;
    if (!data.verses || data.verses.length === 0) return null;

    const content = data.verses
      .map((v) => `${v.verse}. ${v.text.replace(/\s*\n\s*/g, ' ').trim()}`)
      .join('\n\n');
    return { content, sourceTitle: data.reference ?? `${book} ${chapter}` };
  } catch (e) {
    console.log('getDailyBibleReading error:', e);
    return null;
  }
}
