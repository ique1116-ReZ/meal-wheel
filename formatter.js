// formatter.js — pure functions for displaying/copying a plan.

const MEAL_LABELS = {
  breakfast: '🌅 早餐',
  lunch:     '☀️ 午餐',
  dinner:    '🌙 晚餐',
};

const KIND_LABELS = {
  protein: '蛋白',
  carb:    '碳水',
};

function pad2(n) {
  return n < 10 ? `0${n}` : String(n);
}

function formatDate(d) {
  return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`;
}

/**
 * Format a plan as plain text suitable for clipboard.
 * @param {Array<{slotId: string, dish: string, flavor: '中式'|'西式'}>} plan
 * @param {Date} date
 * @returns {string}
 */
export function formatCopyText(plan, date) {
  const lines = [`${formatDate(date)} 今日食谱`];
  const meals = ['breakfast', 'lunch', 'dinner'];
  for (const meal of meals) {
    lines.push(MEAL_LABELS[meal]);
    for (const kind of ['protein', 'carb']) {
      const slotId = `${meal}-${kind}`;
      const entry = plan.find(p => p.slotId === slotId);
      lines.push(`  · ${KIND_LABELS[kind]}：${entry.dish}`);
    }
  }
  return lines.join('\n');
}
