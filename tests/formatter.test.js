import { describe, it, expect } from 'vitest';
import { formatCopyText } from '../formatter.js';

describe('formatCopyText', () => {
  it('formats a plan into plain text', () => {
    const plan = [
      { slotId: 'breakfast-protein', dish: '茶叶蛋', flavor: '中式' },
      { slotId: 'breakfast-carb',    dish: '全麦吐司', flavor: '中式' },
      { slotId: 'lunch-protein',     dish: '清蒸鲈鱼', flavor: '中式' },
      { slotId: 'lunch-carb',        dish: '杂粮饭', flavor: '中式' },
      { slotId: 'dinner-protein',    dish: '白切鸡', flavor: '中式' },
      { slotId: 'dinner-carb',       dish: '燕麦粥', flavor: '中式' },
    ];
    const text = formatCopyText(plan, new Date('2026-06-24T00:00:00'));
    expect(text).toBe(`2026/06/24 今日食谱
🌅 早餐
  · 蛋白：茶叶蛋
  · 碳水：全麦吐司
☀️ 午餐
  · 蛋白：清蒸鲈鱼
  · 碳水：杂粮饭
🌙 晚餐
  · 蛋白：白切鸡
  · 碳水：燕麦粥`);
  });

  it('pads single-digit month and day with zeros', () => {
    const plan = [
      { slotId: 'breakfast-protein', dish: 'A', flavor: '中式' },
      { slotId: 'breakfast-carb',    dish: 'A', flavor: '中式' },
      { slotId: 'lunch-protein',     dish: 'A', flavor: '中式' },
      { slotId: 'lunch-carb',        dish: 'A', flavor: '中式' },
      { slotId: 'dinner-protein',    dish: 'A', flavor: '中式' },
      { slotId: 'dinner-carb',       dish: 'A', flavor: '中式' },
    ];
    const text = formatCopyText(plan, new Date('2026-01-05T00:00:00'));
    expect(text.startsWith('2026/01/05 今日食谱\n')).toBe(true);
  });
});
