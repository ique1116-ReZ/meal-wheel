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

  it('appends a 做法 line for each dish when recipes is provided', () => {
    const plan = [
      { slotId: 'breakfast-protein', dish: '水煮蛋', flavor: '中式' },
      { slotId: 'breakfast-carb',    dish: '白米饭', flavor: '中式' },
      { slotId: 'lunch-protein',     dish: '红烧鲈鱼', flavor: '中式' },
      { slotId: 'lunch-carb',        dish: '扬州炒饭', flavor: '中式' },
      { slotId: 'dinner-protein',    dish: '白切鸡', flavor: '中式' },
      { slotId: 'dinner-carb',       dish: '燕麦粥', flavor: '中式' },
    ];
    const recipes = {
      '水煮蛋':   '鸡蛋冷水下锅，水开中火煮8分钟，捞出浸凉水剥壳。',
      '白米饭':   '米淘净加水(1:1.2)电饭煲/锅煮熟。',
      '红烧鲈鱼': '鲈鱼切块，煎至两面金黄，加葱姜蒜爆香，倒入酱油糖酒焖煮15-20分钟。',
      '扬州炒饭': '隔夜饭打散，热油爆香蛋液+虾仁+青豆+玉米+饭+酱油。',
      '白切鸡':   '白切鸡冷水下锅加葱姜料酒，小火煮至刚熟捞出浸冰水，斩件蘸姜葱酱。',
      '燕麦粥':   '燕麦加水1:5煮10分钟至浓稠，可加奶或蜂蜜。',
    };
    const text = formatCopyText(plan, new Date('2026-06-24T00:00:00'), recipes);
    expect(text).toContain('  · 蛋白：水煮蛋');
    expect(text).toContain('      做法：鸡蛋冷水下锅，水开中火煮8分钟，捞出浸凉水剥壳。');
    expect(text).toContain('  · 碳水：白米饭');
    expect(text).toContain('      做法：米淘净加水(1:1.2)电饭煲/锅煮熟。');
  });

  it('skips 做法 lines for dishes that have no recipe', () => {
    const plan = [
      { slotId: 'breakfast-protein', dish: '水煮蛋', flavor: '中式' },
      { slotId: 'breakfast-carb',    dish: '未知菜', flavor: '中式' },
    ];
    const recipes = { '水煮蛋': '鸡蛋冷水下锅煮8分钟。' };
    const text = formatCopyText(plan, new Date('2026-06-24T00:00:00'), recipes);
    expect(text).toContain('      做法：鸡蛋冷水下锅煮8分钟。');
    // The "未知菜" line must NOT be followed by a 做法 line.
    expect(text).not.toContain('  · 碳水：未知菜\n      做法：');
  });
});
