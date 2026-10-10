import { describe, expect, it } from '@jest/globals';

import { buildCategoryList, chooseBook, SESSIONS_PER_DAY } from '../lib/dailyPlan';

describe('buildCategoryList', () => {
  it('always plans five sessions', () => {
    const profiles = [
      { spiritual_preference: 'islam', learning_areas: ['Psychology'] },
      { spiritual_preference: 'none', learning_areas: ['Psychology', 'Finance', 'History', 'Law'] },
      { spiritual_preference: null, learning_areas: [] },
    ];
    for (const profile of profiles) {
      expect(buildCategoryList(profile)).toHaveLength(SESSIONS_PER_DAY);
    }
  });

  it('puts the spiritual path first and General Knowledge last', () => {
    expect(buildCategoryList({ spiritual_preference: 'islam', learning_areas: ['Psychology', 'Finance'] })).toEqual([
      'Islam',
      'Psychology',
      'Finance',
      'Psychology',
      'General Knowledge',
    ]);
  });

  it('maps each spiritual path to its reading category', () => {
    const first = (path: string) => buildCategoryList({ spiritual_preference: path, learning_areas: ['Law'] })[0];
    expect(first('christianity')).toBe('Christianity');
    expect(first('buddhism')).toBe('Buddhism');
    expect(first('stoicism')).toBe('Stoicism');
    expect(first('meditation')).toBe('Mindfulness');
  });

  it('has no spiritual session for a secular profile', () => {
    expect(
      buildCategoryList({ spiritual_preference: 'none', learning_areas: ['History', 'Science', 'Law', 'Politics'] })
    ).toEqual(['History', 'Science', 'Law', 'Politics', 'General Knowledge']);
  });

  it('falls back to General Knowledge when no areas were chosen', () => {
    expect(new Set(buildCategoryList({ spiritual_preference: null, learning_areas: [] }))).toEqual(
      new Set(['General Knowledge'])
    );
  });
});

describe('chooseBook', () => {
  const books = [{ title: 'A' }, { title: 'B' }, { title: 'C' }];

  it('avoids titles already used today', () => {
    for (const r of [0, 0.3, 0.6, 0.99]) {
      expect(chooseBook(books, new Set(['A', 'C']), () => r).title).toBe('B');
    }
  });

  it('repeats a title only when every book was already used', () => {
    expect(chooseBook(books, new Set(['A', 'B', 'C']), () => 0).title).toBe('A');
  });

  it('can reach every unused book', () => {
    const picked = new Set([0, 0.4, 0.8].map((r) => chooseBook(books, new Set(), () => r).title));
    expect(picked).toEqual(new Set(['A', 'B', 'C']));
  });

  it('never repeats a title across a day while the category has enough books', () => {
    const used = new Set<string>();
    for (let i = 0; i < books.length; i++) {
      const book = chooseBook(books, used);
      expect(used.has(book.title)).toBe(false);
      used.add(book.title);
    }
  });
});
