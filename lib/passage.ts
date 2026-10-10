/** ~2000 words ≈ 10 minutes of reading. */
export const PASSAGE_WORDS = 2000;
/** How far the start/end may move to land on a sentence boundary. */
const SENTENCE_SEARCH_WINDOW = 80;
/** A new paragraph starts after roughly this many words, at the next sentence end. */
const PARAGRAPH_WORDS = 110;

const SENTENCE_END = /[.!?]["'”’)\]]*$/;

/**
 * Cuts a ~10 minute passage out of a whole book.
 * It starts somewhere in the middle (skipping front and back matter), begins and ends
 * on full sentences, and is re-flowed into readable paragraphs separated by blank lines.
 * `random` is injectable so the choice of position can be tested.
 */
export function extractPassage(text: string, random: () => number = Math.random): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const total = words.length;
  let start = 0;
  let end = total;

  if (total > PASSAGE_WORDS) {
    // Start between 10% and 80% of the way through.
    start = Math.floor((total * (10 + random() * 70)) / 100);
    end = Math.min(total, start + PASSAGE_WORDS);

    // Move the start forward to just after the previous sentence ended.
    for (let i = start; i < Math.min(total, start + SENTENCE_SEARCH_WINDOW); i++) {
      if (i > 0 && SENTENCE_END.test(words[i - 1])) {
        start = i;
        break;
      }
    }
    // Extend the end to the next sentence end.
    for (let i = end - 1; i < Math.min(total, end + SENTENCE_SEARCH_WINDOW); i++) {
      if (SENTENCE_END.test(words[i])) {
        end = i + 1;
        break;
      }
    }
  }

  const paragraphs: string[] = [];
  let current: string[] = [];
  for (const word of words.slice(start, end)) {
    current.push(word);
    if (current.length >= PARAGRAPH_WORDS && SENTENCE_END.test(word)) {
      paragraphs.push(current.join(' '));
      current = [];
    }
  }
  if (current.length > 0) paragraphs.push(current.join(' '));
  return paragraphs.join('\n\n');
}

/** Strips Project Gutenberg's licence header/footer and plain-text markup from a book. */
export function cleanGutenbergText(raw: string): string {
  let text = raw;
  const start = text.indexOf('*** START OF');
  const end = text.indexOf('*** END OF');
  if (start >= 0 && end > start) text = text.slice(text.indexOf('\n', start) + 1, end);
  // _italics_ and [Illustration: ...] placeholders
  return text.replace(/\[Illustration[^\]]*\]/g, ' ').replace(/_/g, '');
}
