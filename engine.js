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

/**
 * Pick a random element from an array.
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Decide the flavor for each meal. The `noRepeat` rule can mix flavors
 * freely (it doesn't constrain flavors), so this is the same as `pureRandom`.
 * Shared by noRepeat and pureRandom (same module, no export needed).
 * @returns {{breakfast: Flavor, lunch: Flavor, dinner: Flavor}}
 */
function pickFlavorsFree() {
  return {
    breakfast: Math.random() < 0.5 ? '中式' : '西式',
    lunch:     Math.random() < 0.5 ? '中式' : '西式',
    dinner:    Math.random() < 0.5 ? '中式' : '西式',
  };
}

/**
 * Rule 1: noRepeat — all 6 dishes are unique within the day.
 * @param {Record<string, string[]>} categories — the dish library.
 * @returns {Array<{slotId: string, dish: string, flavor: Flavor}>}
 */
export function noRepeat(categories) {
  const used = new Set();
  const flavors = pickFlavorsFree();
  return SLOTS.map(slot => {
    const key = categoryKeyFor(slot, flavors[slot.meal]);
    const pool = categories[key].filter(d => !used.has(d));
    const pick = pool.length ? pickOne(pool) : pickOne(categories[key]);
    used.add(pick);
    return { slotId: slot.id, dish: pick, flavor: flavors[slot.meal] };
  });
}

/**
 * Rule 2: pureRandom — each slot picks independently; repeats allowed.
 */
export function pureRandom(categories) {
  const flavors = pickFlavorsFree();
  return SLOTS.map(slot => {
    const key = categoryKeyFor(slot, flavors[slot.meal]);
    return { slotId: slot.id, dish: pickOne(categories[key]), flavor: flavors[slot.meal] };
  });
}
