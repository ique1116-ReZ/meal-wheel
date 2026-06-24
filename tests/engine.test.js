import { describe, it, expect } from 'vitest';
import { categoryKeyFor, noRepeat, pureRandom } from '../engine.js';

describe('categoryKeyFor', () => {
  it('maps breakfast protein to 中式早餐蛋白', () => {
    expect(categoryKeyFor({ meal: 'breakfast', kind: 'protein' }, '中式'))
      .toBe('中式早餐蛋白');
  });

  it('maps breakfast carb to 西式早餐碳水', () => {
    expect(categoryKeyFor({ meal: 'breakfast', kind: 'carb' }, '西式'))
      .toBe('西式早餐碳水');
  });

  it('maps lunch protein to 中式正餐蛋白', () => {
    expect(categoryKeyFor({ meal: 'lunch', kind: 'protein' }, '中式'))
      .toBe('中式正餐蛋白');
  });

  it('maps dinner carb to 西式正餐碳水', () => {
    expect(categoryKeyFor({ meal: 'dinner', kind: 'carb' }, '西式'))
      .toBe('西式正餐碳水');
  });
});

describe('noRepeat', () => {
  // Helper: a tiny in-memory library.
  const categories = {
    '中式早餐蛋白': ['蛋A', '蛋B', '蛋C'],
    '中式早餐碳水': ['包A', '包B', '包C'],
    '中式正餐蛋白': ['鱼A', '鱼B', '鱼C'],
    '中式正餐碳水': ['饭A', '饭B', '饭C'],
    '西式早餐蛋白': ['西A', '西B', '西C'],
    '西式早餐碳水': ['西D', '西E', '西F'],
    '西式正餐蛋白': ['西G', '西H', '西I'],
    '西式正餐碳水': ['西J', '西K', '西L'],
  };

  it('returns 6 dishes, one per slot', () => {
    const result = noRepeat(categories);
    expect(result).toHaveLength(6);
    expect(result[0]).toHaveProperty('slotId');
    expect(result[0]).toHaveProperty('dish');
    expect(result[0]).toHaveProperty('flavor');
  });

  it('produces all unique dishes (no repeat)', () => {
    // Run many times; the result must always have 6 distinct dishes.
    for (let i = 0; i < 20; i++) {
      const result = noRepeat(categories);
      const dishes = result.map(r => r.dish);
      expect(new Set(dishes).size).toBe(6);
    }
  });

  it('falls back to allowing repeats when a category is exhausted', () => {
    // 1 dish per category is not enough to satisfy no-repeat for all 6 slots
    // sharing a flavor.
    const tiny = {
      '中式早餐蛋白': ['蛋A'],
      '中式早餐碳水': ['包A'],
      '中式正餐蛋白': ['鱼A'],
      '中式正餐碳水': ['饭A'],
      '西式早餐蛋白': ['西A'],
      '西式早餐碳水': ['西D'],
      '西式正餐蛋白': ['西G'],
      '西式正餐碳水': ['西J'],
    };
    // Should not throw; should return 6 entries.
    const result = noRepeat(tiny);
    expect(result).toHaveLength(6);
  });
});

describe('pureRandom', () => {
  const categories = {
    '中式早餐蛋白': ['蛋A', '蛋B', '蛋C'],
    '中式早餐碳水': ['包A', '包B', '包C'],
    '中式正餐蛋白': ['鱼A', '鱼B', '鱼C'],
    '中式正餐碳水': ['饭A', '饭B', '饭C'],
    '西式早餐蛋白': ['西A', '西B', '西C'],
    '西式早餐碳水': ['西D', '西E', '西F'],
    '西式正餐蛋白': ['西G', '西H', '西I'],
    '西式正餐碳水': ['西J', '西K', '西L'],
  };

  it('returns 6 dishes', () => {
    expect(pureRandom(categories)).toHaveLength(6);
  });

  it('allows repeats: lunch/dinner share categories, so they pick the same dish when category has 1 item', () => {
    // With 1 dish per category and lunch+dinner both mapping to 正餐
    // (and main meals sharing a flavor), the result has 4 unique dishes
    // (the lunch-protein and dinner-protein slots pick from the same
    // category, so they match; same for carbs). This proves repeats are
    // allowed — the implementation does not enforce uniqueness.
    const tiny = Object.fromEntries(
      Object.entries(categories).map(([k, v]) => [k, [v[0]]])
    );
    const dishes = pureRandom(tiny).map(r => r.dish);
    expect(new Set(dishes).size).toBe(4);
  });
});
