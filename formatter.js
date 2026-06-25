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
 * When `recipes` is provided, each dish line is followed by a `  做法: ...`
 * line so the brief cooking instruction comes along with the meal plan.
 *
 * @param {Array<{slotId: string, dish: string, flavor: '中式'|'西式'}>} plan
 * @param {Date} date
 * @param {Record<string, string>} [recipes] — optional map of dish name -> recipe
 * @returns {string}
 */
export function formatCopyText(plan, date, recipes = {}) {
  const lines = [`${formatDate(date)} 今日食谱`];
  const meals = ['breakfast', 'lunch', 'dinner'];
  for (const meal of meals) {
    lines.push(MEAL_LABELS[meal]);
    for (const kind of ['protein', 'carb']) {
      const slotId = `${meal}-${kind}`;
      const entry = plan.find(p => p.slotId === slotId);
      if (!entry) continue;
      lines.push(`  · ${KIND_LABELS[kind]}：${entry.dish}`);
      const recipe = recipes[entry.dish];
      if (recipe) lines.push(`      做法：${recipe}`);
    }
  }
  return lines.join('\n');
}
