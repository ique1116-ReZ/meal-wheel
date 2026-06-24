// engine.js — pure generation algorithms for Meal Wheel.
// No DOM access. No side effects. Unit-tested via tests/engine.test.js.

/**
 * @typedef {'breakfast' | 'lunch' | 'dinner'} Meal
 * @typedef {'protein' | 'carb'} Kind
 * @typedef {'中式' | '西式'} Flavor
 * @typedef {{ meal: Meal, kind: Kind }} Slot
 */

/** 6 slots that make up a daily plan, in display order. */
export const SLOTS = [
  { id: 'breakfast-protein', meal: 'breakfast', kind: 'protein' },
  { id: 'breakfast-carb',    meal: 'breakfast', kind: 'carb' },
  { id: 'lunch-protein',     meal: 'lunch',     kind: 'protein' },
  { id: 'lunch-carb',       meal: 'lunch',     kind: 'carb' },
  { id: 'dinner-protein',   meal: 'dinner',    kind: 'protein' },
  { id: 'dinner-carb',      meal: 'dinner',    kind: 'carb' },
];

/**
 * Resolve the category key in dishes.json for a given slot + flavor.
 * Example: ({meal:'breakfast', kind:'protein'}, '中式') -> '中式早餐蛋白'
 */
export function categoryKeyFor(slot, flavor) {
  const meal = { breakfast: '早餐', lunch: '正餐', dinner: '正餐' }[slot.meal];
  const kind = slot.kind === 'protein' ? '蛋白' : '碳水';
  return `${flavor}${meal}${kind}`;
}
