import { describe, expect, it } from '@jest/globals';

import { cleanGutenbergText, extractPassage, PASSAGE_WORDS } from '../lib/passage';

/** A book of numbered sentences: "Sentence 0 has six words." */
function makeBook(sentences: number): string {
  return Array.from({ length: sentences }, (_, i) => `Sentence ${i} has six words.`).join(' ');
}

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

describe('extractPassage', () => {
  it('returns a short text whole', () => {
    const text = 'A short text. It has two sentences.';
    expect(extractPassage(text)).toBe(text);
  });

  it('cuts roughly a ten minute passage out of a long book', () => {
    const passage = extractPassage(makeBook(5000), () => 0.5);
    const words = wordCount(passage);
    expect(words).toBeGreaterThan(PASSAGE_WORDS - 100);
    expect(words).toBeLessThan(PASSAGE_WORDS + 100);
  });

  it('starts at the beginning of a sentence and ends at the end of one', () => {
    for (const r of [0, 0.123, 0.5, 0.777, 0.999]) {
      const passage = extractPassage(makeBook(5000), () => r);
      expect(passage.startsWith('Sentence ')).toBe(true);
      expect(passage.endsWith('words.')).toBe(true);
    }
  });

  it('skips the front and back matter', () => {
    const total = 5000;
    const first = extractPassage(makeBook(total), () => 0);
    const last = extractPassage(makeBook(total), () => 0.999999);
    const firstIndex = Number(first.match(/^Sentence (\d+)/)?.[1]);
    const lastIndex = Number(last.match(/Sentence (\d+) has six words\.$/)?.[1]);
    expect(firstIndex).toBeGreaterThanOrEqual(total * 0.1 - 1);
    expect(lastIndex).toBeLessThan(total);
    // Starting at most 80% in still leaves room for a full passage.
    expect(wordCount(last)).toBeGreaterThan(PASSAGE_WORDS - 100);
  });

  it('breaks the passage into paragraphs that end on a sentence', () => {
    const paragraphs = extractPassage(makeBook(5000), () => 0.4).split('\n\n');
    expect(paragraphs.length).toBeGreaterThan(5);
    for (const paragraph of paragraphs) {
      expect(paragraph.endsWith('words.')).toBe(true);
    }
  });

  it('is deterministic for a given random source', () => {
    const book = makeBook(5000);
    expect(extractPassage(book, () => 0.3)).toBe(extractPassage(book, () => 0.3));
  });
});

describe('cleanGutenbergText', () => {
  it('removes the licence header and footer', () => {
    const raw = [
      'The Project Gutenberg eBook of Example',
      '*** START OF THE PROJECT GUTENBERG EBOOK EXAMPLE ***',
      'The real text.',
      '*** END OF THE PROJECT GUTENBERG EBOOK EXAMPLE ***',
      'Licence terms.',
    ].join('\n');
    expect(cleanGutenbergText(raw).trim()).toBe('The real text.');
  });

  it('removes italics markers and illustration placeholders', () => {
    expect(cleanGutenbergText('It was _very_ cold. [Illustration: A map] Then it snowed.')).toBe(
      'It was very cold.   Then it snowed.'
    );
  });

  it('leaves text without markers unchanged', () => {
    expect(cleanGutenbergText('Plain text.')).toBe('Plain text.');
  });
});
