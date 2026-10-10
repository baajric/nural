import { describe, expect, it } from '@jest/globals';

import { addDays, getWeekStart, localDateString, mondayIndex } from '../lib/date';
import { estimateReadingMinutes } from '../lib/readingTime';
import { ARABIC_MARKER } from '../lib/quranApi';

describe('localDateString', () => {
  it('formats the local calendar date with zero padding', () => {
    expect(localDateString(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
    expect(localDateString(new Date(2026, 11, 31, 12))).toBe('2026-12-31');
  });

  it('uses the local day even just before and after midnight', () => {
    expect(localDateString(new Date(2026, 2, 10, 23, 59))).toBe('2026-03-10');
    expect(localDateString(new Date(2026, 2, 11, 0, 1))).toBe('2026-03-11');
  });
});

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(localDateString(addDays(new Date(2026, 0, 31, 12), 1))).toBe('2026-02-01');
    expect(localDateString(addDays(new Date(2026, 0, 1, 12), -1))).toBe('2025-12-31');
  });

  it('does not change the date it was given', () => {
    const date = new Date(2026, 4, 15, 12);
    addDays(date, 3);
    expect(localDateString(date)).toBe('2026-05-15');
  });
});

describe('week helpers', () => {
  it('counts Monday as the first day of the week', () => {
    expect(mondayIndex(new Date(2026, 2, 9))).toBe(0); // Monday
    expect(mondayIndex(new Date(2026, 2, 11))).toBe(2); // Wednesday
    expect(mondayIndex(new Date(2026, 2, 15))).toBe(6); // Sunday
  });

  it('finds the Monday of the week for any day in it', () => {
    for (let day = 9; day <= 15; day++) {
      expect(localDateString(getWeekStart(new Date(2026, 2, day, 18, 30)))).toBe('2026-03-09');
    }
  });
});

describe('estimateReadingMinutes', () => {
  it('assumes about 200 words per minute', () => {
    expect(estimateReadingMinutes(Array(2000).fill('word').join(' '))).toBe(10);
  });

  it('never estimates less than a minute', () => {
    expect(estimateReadingMinutes('Just a few words.')).toBe(1);
  });

  it('does not count Arabic paragraphs, which are shown next to their translation', () => {
    const translation = Array(400).fill('word').join(' ');
    const arabic = `${ARABIC_MARKER}${Array(400).fill('كلمة').join(' ')}`;
    expect(estimateReadingMinutes(`${arabic}\n\n${translation}`)).toBe(2);
  });
});
