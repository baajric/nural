import { ARABIC_MARKER } from './quranApi';

const WORDS_PER_MINUTE = 200;

/** Estimated minutes to read a session's content (Arabic paragraphs are not counted twice). */
export function estimateReadingMinutes(content: string): number {
  const words = content
    .split('\n\n')
    .filter((p) => !p.startsWith(ARABIC_MARKER))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
