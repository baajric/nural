import { ARABIC_MARKER } from '../supabase/functions/reflection/prompts';

/** Paragraphs starting with this marker are Arabic and rendered right-to-left in the reader. */
export { ARABIC_MARKER };

const BASE_URL = 'https://api.alquran.cloud/v1';
/** Target length of the English translation; the Arabic is shown alongside each verse. */
const TARGET_WORDS = 600;

interface QuranAyah {
  number: number;
  text: string;
  numberInSurah: number;
}

interface SurahResponse {
  code: number;
  data?: {
    number: number;
    englishName: string;
    numberOfAyahs: number;
    ayahs: QuranAyah[];
  };
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}

/** A random passage: each verse as an Arabic paragraph followed by its English translation. */
export async function getDailyQuranReading(): Promise<{
  content: string;
  sourceTitle: string;
} | null> {
  try {
    const surahNum = Math.floor(Math.random() * 114) + 1;
    const [enRes, arRes] = await Promise.all([
      fetch(`${BASE_URL}/surah/${surahNum}/en.sahih`),
      fetch(`${BASE_URL}/surah/${surahNum}/ar.uthmani`),
    ]);

    const enData = (await enRes.json()) as SurahResponse;
    const arData = (await arRes.json()) as SurahResponse;

    if (enData.code !== 200 || !enData.data || !arData.data) return null;

    const surah = enData.data;
    const arabicAyahs = arData.data.ayahs;
    const total = surah.ayahs.length;

    // Start anywhere that still leaves room for a full passage; short surahs are read whole.
    const totalWords = wordCount(surah.ayahs.map((a) => a.text).join(' '));
    let start = 0;
    if (totalWords > TARGET_WORDS) {
      const latestStart = Math.floor(total * (1 - TARGET_WORDS / totalWords));
      start = Math.floor(Math.random() * (latestStart + 1));
    }

    const paragraphs: string[] = [];
    let words = 0;
    let end = start;
    for (let i = start; i < total && words < TARGET_WORDS; i++) {
      const en = surah.ayahs[i];
      const ar = arabicAyahs[i];
      if (ar) paragraphs.push(`${ARABIC_MARKER}${ar.text.trim()} ﴿${toArabicDigits(en.numberInSurah)}﴾`);
      paragraphs.push(`${en.numberInSurah}. ${en.text.trim()}`);
      words += wordCount(en.text);
      end = i;
    }

    const first = surah.ayahs[start].numberInSurah;
    const last = surah.ayahs[end].numberInSurah;
    const verseRange = first === last ? `Verse ${first}` : `Verses ${first}–${last}`;

    return {
      content: paragraphs.join('\n\n'),
      sourceTitle: `Surah ${surah.englishName} · ${verseRange}`,
    };
  } catch (e) {
    console.log('getDailyQuranReading error:', e);
    return null;
  }
}
