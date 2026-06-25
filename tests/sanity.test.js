import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = join(here, '..', 'data', 'dishes.json');

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});

describe('dishes.json', () => {
  const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
  const EXPECTED_CATEGORIES = [
    '中式早餐蛋白', '中式早餐碳水',
    '中式正餐蛋白', '中式正餐碳水',
    '西式早餐蛋白', '西式早餐碳水',
    '西式正餐蛋白', '西式正餐碳水',
  ];

  it('has the expected version', () => {
    expect(data.version).toBe(2);
  });

  it('has all 8 categories', () => {
    expect(Object.keys(data.categories).sort()).toEqual([...EXPECTED_CATEGORIES].sort());
  });

  it('has a recipes map', () => {
    expect(typeof data.recipes).toBe('object');
    expect(data.recipes).not.toBeNull();
    expect(Object.keys(data.recipes).length).toBeGreaterThan(100);
  });

  it('every dish in every category has a recipe', () => {
    const missing = [];
    for (const cat of EXPECTED_CATEGORIES) {
      const dishes = data.categories[cat] || [];
      for (const dish of dishes) {
        if (!data.recipes[dish]) missing.push(`${cat}: ${dish}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every recipe is a non-empty string under 100 Chinese characters', () => {
    for (const [dish, recipe] of Object.entries(data.recipes)) {
      expect(typeof recipe, `recipe for ${dish}`).toBe('string');
      expect(recipe.length, `recipe for ${dish}`).toBeGreaterThan(0);
      expect(recipe.length, `recipe for ${dish} (${recipe})`).toBeLessThanOrEqual(100);
    }
  });

  it('at least 70% of recipes are step-based (contain 步骤)', () => {
    const stepBased = Object.values(data.recipes).filter(r => r.includes('步骤')).length;
    const ratio = stepBased / Object.keys(data.recipes).length;
    expect(ratio).toBeGreaterThanOrEqual(0.70);
  });

  it('cooking-required recipes contain "步骤"', () => {
    // Excludes ready-to-eat items (罐头/奶酪/酸奶/即食/火腿 etc). For
    // everything else, the recipe must contain "步骤" — single-step items
    // are allowed too, they just have a less strict format.
    const isReadyToEat = (r) =>
      r.includes('即食') || r.includes('即饮') || r.startsWith('开') || r.startsWith('即')
      || /^(切片|撕碎|开杯|入碗)/.test(r);
    const bad = [];
    for (const [dish, recipe] of Object.entries(data.recipes)) {
      if (isReadyToEat(recipe)) continue;
      if (!recipe.includes('步骤')) bad.push(`${dish}: ${recipe}`);
    }
    expect(bad, `cooking recipes missing 步骤: ${bad.join('; ')}`).toEqual([]);
  });

  it('well-known dishes produce recognizable recipes', () => {
    expect(data.recipes['水煮蛋']).toContain('煮');
    expect(data.recipes['红烧鲈鱼']).toContain('焖');
    expect(data.recipes['白米饭']).toContain('米');
    expect(data.recipes['白切鸡']).toContain('冷水');
  });
});
