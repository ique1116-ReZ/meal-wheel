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

/**
 * Rule 3: flavorRotation — breakfast + lunch share one flavor; dinner uses the other.
 */
export function flavorRotation(categories) {
  const breakfastFlavor = Math.random() < 0.5 ? '中式' : '西式';
  const dinnerFlavor = breakfastFlavor === '中式' ? '西式' : '中式';
  const flavors = {
    breakfast: breakfastFlavor,
    lunch:     breakfastFlavor,  // lunch shares with breakfast
    dinner:    dinnerFlavor,
  };
  return SLOTS.map(slot => {
    const key = categoryKeyFor(slot, flavors[slot.meal]);
    return { slotId: slot.id, dish: pickOne(categories[key]), flavor: flavors[slot.meal] };
  });
}

/**
 * Rule 4: mainRepeat — lunch protein = dinner protein (cook once, eat twice).
 * Carbs for lunch and dinner differ. Breakfast is independent.
 */
export function mainRepeat(categories) {
  const breakfastFlavor = Math.random() < 0.5 ? '中式' : '西式';
  const mainFlavor = Math.random() < 0.5 ? '中式' : '西式';
  const flavors = {
    breakfast: breakfastFlavor,
    lunch:     mainFlavor,
    dinner:    mainFlavor,
  };

  // Lunch protein = Dinner protein (shared).
  const mainProteinKey = categoryKeyFor(
    { meal: 'lunch', kind: 'protein' },
    mainFlavor
  );
  const sharedProtein = pickOne(categories[mainProteinKey]);

  // Lunch carb: pick from mainFlavor's main-carb category.
  const lunchCarbKey = categoryKeyFor(
    { meal: 'lunch', kind: 'carb' },
    mainFlavor
  );
  const lunchCarb = pickOne(categories[lunchCarbKey]);

  // Dinner carb: different from lunch carb, within same category.
  const dinnerCarbKey = categoryKeyFor(
    { meal: 'dinner', kind: 'carb' },
    mainFlavor
  );
  const carbPool = categories[dinnerCarbKey].filter(d => d !== lunchCarb);
  const dinnerCarb = carbPool.length
    ? pickOne(carbPool)
    : pickOne(categories[dinnerCarbKey]);

  // Breakfast: independent picks.
  const breakfastProteinKey = categoryKeyFor(
    { meal: 'breakfast', kind: 'protein' },
    breakfastFlavor
  );
  const breakfastCarbKey = categoryKeyFor(
    { meal: 'breakfast', kind: 'carb' },
    breakfastFlavor
  );

  return [
    { slotId: 'breakfast-protein', dish: pickOne(categories[breakfastProteinKey]), flavor: breakfastFlavor },
    { slotId: 'breakfast-carb',    dish: pickOne(categories[breakfastCarbKey]),    flavor: breakfastFlavor },
    { slotId: 'lunch-protein',     dish: sharedProtein,                            flavor: mainFlavor },
    { slotId: 'lunch-carb',        dish: lunchCarb,                                flavor: mainFlavor },
    { slotId: 'dinner-protein',    dish: sharedProtein,                            flavor: mainFlavor },
    { slotId: 'dinner-carb',       dish: dinnerCarb,                               flavor: mainFlavor },
  ];
}

/**
 * Swap a single dish on the plate.
 * @param {Array<{slotId: string, dish: string, flavor: Flavor}>} current
 * @param {string} slotId — the slot to swap
 * @param {Record<string, string[]>} categories
 * @param {string[]} used — dishes already on the plate (for no-repeat)
 * @returns {{slotId: string, dish: string, flavor: Flavor}}
 */
export function swapDish(current, slotId, categories, used = []) {
  const target = current.find(c => c.slotId === slotId);
  const slot = SLOTS.find(s => s.id === slotId);
  const key = categoryKeyFor(slot, target.flavor);
  const pool = categories[key].filter(d => d !== target.dish && !used.includes(d));
  // If the only available dish is the current one (exhausted category or all
  // others already used), fall back to any dish in the category except the
  // current — and if that's empty too, allow the current.
  if (pool.length) return { slotId, dish: pickOne(pool), flavor: target.flavor };
  const altPool = categories[key].filter(d => d !== target.dish);
  if (altPool.length) return { slotId, dish: pickOne(altPool), flavor: target.flavor };
  return { slotId, dish: target.dish, flavor: target.flavor };
}
