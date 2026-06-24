import { describe, it, expect } from 'vitest';
import { categoryKeyFor, noRepeat, pureRandom, flavorRotation, mainRepeat, SLOTS } from '../engine.js';

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

  it('allows repeats: with 1 dish per category, repeated slots pick the same dish when flavors match', () => {
    // With 1 dish per category, when lunch and dinner get the same flavor
    // (~50% per run), the 6 slots collapse to 4 unique dishes (lunch/dinner
    // protein share a 1-dish category, same for carbs). If pureRandom
    // enforced uniqueness, the set size would always be 6. After 100 runs
    // the probability of never seeing set size 4 is ~2^-100.
    const tiny = Object.fromEntries(
      Object.entries(categories).map(([k, v]) => [k, [v[0]]])
    );
    let sawSize4 = false;
    for (let i = 0; i < 100; i++) {
      if (new Set(pureRandom(tiny).map(r => r.dish)).size === 4) {
        sawSize4 = true;
        break;
      }
    }
    expect(sawSize4).toBe(true);
  });
});

describe('flavorRotation', () => {
  const categories = {
    '中式早餐蛋白': ['中早蛋A', '中早蛋B'],
    '中式早餐碳水': ['中早包A', '中早包B'],
    '中式正餐蛋白': ['中正鱼A', '中正鱼B'],
    '中式正餐碳水': ['中正饭A', '中正饭B'],
    '西式早餐蛋白': ['西早蛋A', '西早蛋B'],
    '西式早餐碳水': ['西早包A', '西早包B'],
    '西式正餐蛋白': ['西正鱼A', '西正鱼B'],
    '西式正餐碳水': ['西正饭A', '西正饭B'],
  };

  it('returns 6 dishes', () => {
    expect(flavorRotation(categories)).toHaveLength(6);
  });

  it('breakfast flavor == lunch flavor, dinner flavor is the other', () => {
    for (let i = 0; i < 20; i++) {
      const result = flavorRotation(categories);
      const byMeal = Object.fromEntries(
        ['breakfast', 'lunch', 'dinner'].map(m => [
          m,
          result.filter(r => r.slotId.startsWith(m))[0].flavor,
        ])
      );
      expect(byMeal.breakfast).toBe(byMeal.lunch);
      expect(byMeal.dinner).not.toBe(byMeal.breakfast);
    }
  });

  it('picks from the right category for the assigned flavor', () => {
    const result = flavorRotation(categories);
    for (const r of result) {
      const slot = SLOTS.find(s => s.id === r.slotId);
      const key = categoryKeyFor(slot, r.flavor);
      expect(categories[key]).toContain(r.dish);
    }
  });
});

describe('mainRepeat', () => {
  const categories = {
    '中式早餐蛋白': ['早蛋A', '早蛋B'],
    '中式早餐碳水': ['早包A', '早包B'],
    '中式正餐蛋白': ['中鱼A', '中鱼B', '中鱼C'],
    '中式正餐碳水': ['中饭A', '中饭B', '中饭C'],
    '西式早餐蛋白': ['西早A', '西早B'],
    '西式早餐碳水': ['西早C', '西早D'],
    '西式正餐蛋白': ['西正A', '西正B', '西正C'],
    '西式正餐碳水': ['西正D', '西正E', '西正F'],
  };

  it('returns 6 dishes', () => {
    expect(mainRepeat(categories)).toHaveLength(6);
  });

  it('lunch protein and dinner protein are the same dish', () => {
    for (let i = 0; i < 20; i++) {
      const result = mainRepeat(categories);
      const lunchP = result.find(r => r.slotId === 'lunch-protein').dish;
      const dinnerP = result.find(r => r.slotId === 'dinner-protein').dish;
      expect(lunchP).toBe(dinnerP);
    }
  });

  it('lunch carb and dinner carb are different dishes (when category has > 1 dish)', () => {
    for (let i = 0; i < 20; i++) {
      const result = mainRepeat(categories);
      const lunchC = result.find(r => r.slotId === 'lunch-carb').dish;
      const dinnerC = result.find(r => r.slotId === 'dinner-carb').dish;
      // All main-flavor categories in this test data have 3 dishes, so
      // lunch and dinner carbs will always differ.
      expect(lunchC).not.toBe(dinnerC);
    }
  });

  it('picks dishes from the right category for the assigned flavor', () => {
    const result = mainRepeat(categories);
    for (const r of result) {
      const slot = SLOTS.find(s => s.id === r.slotId);
      const key = categoryKeyFor(slot, r.flavor);
      expect(categories[key]).toContain(r.dish);
    }
  });
});
