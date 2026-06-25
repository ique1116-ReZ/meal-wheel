# Meal Wheel — 今日餐桌食谱生成器

**Status:** Design approved, awaiting implementation
**Date:** 2026-06-24
**Author:** brainstorming session
**Repo:** `github.com/suunto/meal-wheel`
**Deployment:** GitHub Pages (static, no backend)

---

## 1. Purpose

A small, mobile-friendly web app that picks today's three meals (six dishes total) from a fixed library of ~1400 Chinese/Western breakfast/dinner recipes. The system picks; the user only accepts or swaps individual dishes they don't like.

**Why this exists:** the user maintains a curated recipe library (`.md` files) and wants a frictionless way to ask "what should I eat today?" without manually choosing from 1400 options.

## 2. Core Decisions (from brainstorming)

| Dimension | Decision |
|---|---|
| Scope | One day (3 meals × protein + carb = 6 dishes) |
| Structure | Breakfast + Lunch + Dinner, each meal = 1 protein + 1 carb |
| Generation rules | 4 presets, user-selectable |
| Selection UX | System picks; user does not select favorites in advance |
| Swap UX | Each dish has independent "换一道" button |
| Visual style | Warm editorial — cream/beige background, serif headline |
| Tech stack | Pure HTML + CSS + vanilla JS, no build step |
| Hosting | GitHub Pages, no domain registration, no ICP filing |

## 3. Generation Rules (4 presets)

1. **一天不重复** (default, recommended) — 6 dishes are all unique within the day.
2. **纯随机** — each slot picks independently; repeats allowed.
3. **风味轮换** — breakfast + lunch use one flavor (中 or 西); dinner flips to the other.
4. **主菜重复副菜换** — lunch protein = dinner protein (cook once, eat twice); carbs differ.

### Algorithm sketch

```js
// Each slot is bound to a list of possible categories (one per flavor).
// The rule decides which flavor to pick per slot.
const SLOTS = [
  { id: 'breakfast-protein', meal: 'breakfast', kind: 'protein' },
  { id: 'breakfast-carb',    meal: 'breakfast', kind: 'carb' },
  { id: 'lunch-protein',     meal: 'lunch',     kind: 'protein' },
  { id: 'lunch-carb',        meal: 'lunch',     kind: 'carb' },
  { id: 'dinner-protein',    meal: 'dinner',    kind: 'protein' },
  { id: 'dinner-carb',       meal: 'dinner',    kind: 'carb' },
];

// Resolves the category key for a slot given a chosen flavor ('中式' | '西式').
// e.g. ('breakfast', 'protein', '中式') -> '中式早餐蛋白'
function categoryKeyFor(slot, flavor) {
  const meal = { breakfast: '早餐', lunch: '正餐', dinner: '正餐' }[slot.meal];
  const kind = slot.kind === 'protein' ? '蛋白' : '碳水';
  return `${flavor}${meal}${kind}`;
}

function noRepeat(categories) {
  const used = new Set();
  const flavors = pickFlavors('noRepeat');
  return SLOTS.map(slot => {
    const key = categoryKeyFor(slot, flavors[slot.meal]);
    const pool = categories[key].filter(d => !used.has(d));
    const pick = pool.length
      ? pool[Math.floor(Math.random() * pool.length)]
      : categories[key][Math.floor(Math.random() * categories[key].length)];
    used.add(pick);
    return { slotId: slot.id, dish: pick, flavor: flavors[slot.meal] };
  });
}

// pureRandom, flavorRotation, mainRepeat — analogous, see app.js.
// pickFlavors returns { breakfast, lunch, dinner } → '中式' | '西式'
//   - noRepeat:  all three random (independently, or constrained by rule)
//   - pureRandom: all three random
//   - flavorRotation: breakfast === lunch, dinner is the other
//   - mainRepeat: same as pureRandom
```

### Edge cases

| Case | Behavior |
|---|---|
| Category too small to enforce "no repeat" | Fall back to allow repeats in that category only |
| Category is empty | Slot shows "—"; "换一道" disabled |
| "换一道" reselects same dish | Retry up to 5 times; then show "无其他选择" |
| All rules require ≥ 2 dishes in protein + carb category | Enforced by data; if violated, show error in console + degrade gracefully |

## 4. Architecture

### File layout

```
/Users/suunto/recipe-app/
├── index.html              # single-page entry
├── app.js                  # all logic (generation, swap, copy, render)
├── style.css               # warm editorial styling, mobile-first
├── data/
│   └── dishes.json         # all 8 categories, ~30 KB
├── scripts/
│   └── sync_dishes.py      # convert .md files → dishes.json
├── icons/
│   ├── icon-192.png        # PWA icons
│   └── icon-512.png
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # service worker (cache-first)
├── docs/
│   └── superpowers/specs/  # design docs (this file)
├── .gitignore
└── README.md               # deploy + sync instructions
```

### Data flow

```
[.md files] → sync_dishes.py → data/dishes.json
                                       ↓
                              [browser fetches JSON]
                                       ↓
                         [app.js generation engine]
                                       ↓
                           [DOM: 6 dish cards]
                                       ↓
                       [user clicks 换一道 / 重新配餐]
                                       ↓
                          [swap or re-roll, re-render]
```

### Data model

`data/dishes.json`:
```json
{
  "version": 1,
  "categories": {
    "中式早餐蛋白": ["水煮蛋", "茶叶蛋", "..."],
    "中式早餐碳水": ["包子", "花卷", "..."],
    "中式正餐蛋白": ["清蒸鲈鱼", "红烧鲈鱼", "..."],
    "中式正餐碳水": ["米饭", "杂粮饭", "..."],
    "西式早餐蛋白": ["煎蛋", "炒鸡蛋", "..."],
    "西式早餐碳水": ["全麦吐司", "贝果", "..."],
    "西式正餐蛋白": ["牛排", "三文鱼", "..."],
    "西式正餐碳水": ["意面", "土豆泥", "..."]
  }
}
```

Source files (read-only to app, edited manually by user):
- `/Users/suunto/Documents/饮食菜品库/中式早餐蛋白.md`
- `/Users/suunto/Documents/饮食菜品库/中式早餐碳水.md`
- `/Users/suunto/Documents/饮食菜品库/中式正餐蛋白.md`
- `/Users/suunto/Documents/饮食菜品库/中式正餐碳水.md`
- `/Users/suunto/Documents/饮食菜品库/西式早餐蛋白.md`
- `/Users/suunto/Documents/饮食菜品库/西式早餐碳水.md`
- `/Users/suunto/Documents/饮食菜品库/西式正餐蛋白.md`
- `/Users/suunto/Documents/饮食菜品库/西式正餐碳水.md`

## 5. UI Specification

### Layout (mobile-first, single column, 380px target)

```
┌────────────────────────────┐
│ 2026 · 06 · 24 · WED       │  ← date, uppercase, letter-spaced
│ 温润的餐桌                  │  ← serif title, italic
│ — 为你今日配的六道菜 —        │  ← subtitle
│                            │
│ ┌──────────────────────┐   │
│ │ 规则 [一天不重复   ▾] │   │  ← rule selector
│ └──────────────────────┘   │
│                            │
│ ┌─ 🌅 早餐 · Breakfast ─┐  │
│ │ 蛋白  茶叶蛋      [换] │  │
│ │ 碳水  全麦吐司    [换] │  │
│ └────────────────────────┘  │
│                            │
│ ┌─ ☀️ 午餐 · Lunch ────┐  │
│ │ 蛋白  清蒸鲈鱼    [换] │  │
│ │ 碳水  杂粮饭      [换] │  │
│ └────────────────────────┘  │
│                            │
│ ┌─ 🌙 晚餐 · Dinner ───┐  │
│ │ 蛋白  白切鸡      [换] │  │
│ │ 碳水  燕麦粥      [换] │  │
│ └────────────────────────┘  │
│                            │
│ [📋 复制今日] [🎲 重新配餐] │  ← bottom actions row
│                            │
│ tip: 不喜欢某道？点"换一道" │
└────────────────────────────┘
```

### Interaction details

- **"换一道" (per-dish swap):** picks a new random dish from the same category as the current dish, with the following per-rule semantics:
  - **noRepeat:** new dish must not be one of the 5 other dishes already on the plate today. Fall back to allow-repeat after 5 retries.
  - **pureRandom:** new dish is an unconstrained random pick from the category.
  - **flavorRotation:** the slot's flavor is fixed (e.g., breakfast/lunch flavor stays as the rule decided); pick is unconstrained within that category.
  - **mainRepeat:** if swapping lunch-protein or dinner-protein, the swapped dish becomes the new shared protein (both slots update). If swapping a carb, the new carb must differ from the other carb on the plate.
- **"重新配餐" (full reroll):** runs the active rule from scratch, replaces all 6 dishes. The chosen flavor(s) for `flavorRotation` may change.
- **Rule change:** if current 6 dishes violate the newly-selected rule, rerun the new rule (e.g., switching to "no repeat" when there are duplicates).
- **"📋 复制今日":** copies the day as plain text to clipboard via `navigator.clipboard.writeText()`. Format below.

### Copy format (plain text)

```
2026/06/24 今日食谱
🌅 早餐
  · 蛋白：茶叶蛋
  · 碳水：全麦吐司
☀️ 午餐
  · 蛋白：清蒸鲈鱼
  · 碳水：杂粮饭
🌙 晚餐
  · 蛋白：白切鸡
  · 碳水：燕麦粥
```

### Visual tokens

- Background: `#fdf6e3` (cream)
- Card surface: `rgba(255, 255, 255, 0.55)` with 1px `#e7d6b3` border
- Text primary: `#451a03` (deep brown)
- Text muted: `#92400e` (amber)
- Accent: `#b45309` (warm orange-brown)
- Headline font: `Georgia, "Times New Roman", serif` (italic, 32px)
- Body font: `-apple-system, "Helvetica Neue", sans-serif` (12–18px)

## 6. PWA (Progressive Web App)

- `manifest.webmanifest` declares `display: standalone`, theme color, icons (192 + 512).
- `sw.js` uses cache-first strategy for `index.html`, `app.js`, `style.css`, `data/dishes.json`.
- On mobile Safari/Chrome: "Add to Home Screen" produces a full-screen app icon, no browser chrome.

## 7. Deployment

### Initial setup

```bash
cd /Users/suunto/recipe-app
git init -b main         # (already done)
gh repo create meal-wheel --public --source=. --remote=origin --push
# In GitHub UI: Settings → Pages → Source: main, root
```

### Subsequent updates

```bash
# UI / code change
git add . && git commit -m "feat: ..." && git push
# GitHub Pages auto-deploys in ~10 seconds.

# Recipe library change
# 1. edit /Users/suunto/Documents/饮食菜品库/*.md
# 2. python scripts/sync_dishes.py
# 3. git add data/dishes.json && git commit -m "data: 加了 5 道新菜" && git push
```

### Live URL

`https://ique1116-rez.github.io/meal-wheel/` (auto HTTPS via GitHub Pages; no domain registration needed; no ICP filing needed since static asset hosting on GitHub's CDN).

## 8. `scripts/sync_dishes.py` Specification

- Reads 8 `.md` files from `/Users/suunto/Documents/饮食菜品库/`
- For each file: splits on newlines, strips whitespace, drops empty lines, dedupes within file
- Outputs `data/dishes.json` in the schema above
- Logs: `OK: 8 categories, 1396 dishes total` (or counts per category)
- Idempotent: running twice produces same output
- Total runtime: < 1 second

## 9. Testing

### Scope

- **Unit tests (Vitest, 80%+ coverage required):** the 4 generation algorithms, swap logic, edge cases, format function for the copy text.
- **No E2E tests** for MVP — the UI is one page, manually tested across iOS Safari + Android Chrome.

### Test cases (algorithm)

| Rule | Test |
|---|---|
| noRepeat | 6 unique dishes for a 6-dish library |
| noRepeat | falls back to repeat when category exhausted |
| pureRandom | can produce same dish twice in 1000 iterations |
| flavorRotation | breakfast/lunch flavor == A, dinner flavor == B |
| mainRepeat | lunch protein === dinner protein |
| mainRepeat | lunch carb !== dinner carb |
| swap | new dish is in same category, different from current |
| swap | respects active rule (no-repeat) |

### Test command

```bash
npm test
```

(Vitest installed as a dev dependency only; not bundled into the deployed site.)

## 10. Error Handling

| Case | Behavior |
|---|---|
| `data/dishes.json` 404 / parse error | Show full-screen error: "数据加载失败 — 请检查网络后刷新" |
| Empty category | Slot shows "—", swap button disabled with tooltip "该分类暂无其他选择" |
| localStorage unavailable | Silently skip persistence; app still works |
| Clipboard API unavailable | Fall back to selecting a hidden `<textarea>` and `document.execCommand('copy')` |
| `sw.js` registration fails | App still works; just no offline support |

## 11. Out of Scope (YAGNI)

- User accounts / login
- Saving historical plans
- Manual favorite / blacklist
- Nutritional information
- Multiple-day planning (week, month)
- Sharing / collaboration
- Image attachments per dish
- AI-based recommendations

These may be revisited in v2 if the user wants them.

## 12. Open Questions

None. All decisions resolved during brainstorming on 2026-06-24.

## 13. Glossary

- **Slot** — one of the 6 positions in a daily plan (e.g., `breakfast-protein`).
- **Category** — one of the 8 keys in `dishes.json` (e.g., `中式早餐蛋白`).
- **Flavor** — `中式` or `西式`; a slot's flavor determines which of the 2 candidate categories it draws from.
- **Rule** — one of 4 generation presets that decides both flavor assignment and repeat semantics.
- **Swap** — replace a single dish on the plate while respecting the active rule.

---

## Implementation Sequence (preview)

1. Bootstrap project: `index.html` + `style.css` + `app.js` skeleton; render a hardcoded 6 dishes.
2. Build `scripts/sync_dishes.py`; generate `data/dishes.json` from the user's `.md` files.
3. Wire up generation engine with all 4 rules + unit tests.
4. Wire up swap + reroll + rule change.
5. Wire up copy-to-clipboard.
6. Apply warm editorial styling + responsive layout.
7. Add PWA manifest + service worker.
8. Write README with deploy + sync instructions.
9. `git init` (done), commit, push to `github.com/suunto/meal-wheel`.
10. Enable GitHub Pages; verify live URL.
