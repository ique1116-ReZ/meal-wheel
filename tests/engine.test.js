import { describe, it, expect } from 'vitest';
import { categoryKeyFor } from '../engine.js';

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
