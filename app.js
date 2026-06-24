// app.js — DOM wiring for Meal Wheel.

import { noRepeat, pureRandom, flavorRotation, mainRepeat, swapDish } from './engine.js';
import { formatCopyText } from './formatter.js';

const RULES = {
  noRepeat:      { label: '一天不重复',      run: (cats) => noRepeat(cats) },
  pureRandom:    { label: '纯随机',          run: (cats) => pureRandom(cats) },
  flavorRotation:{ label: '风味轮换',        run: (cats) => flavorRotation(cats) },
  mainRepeat:    { label: '主菜重复副菜换',  run: (cats) => mainRepeat(cats) },
};

const MEAL_META = {
  breakfast: { label: '早餐', emoji: '🌅', en: 'Breakfast' },
  lunch:     { label: '午餐', emoji: '☀️', en: 'Lunch'     },
  dinner:    { label: '晚餐', emoji: '🌙', en: 'Dinner'    },
};

const state = {
  categories: null,
  plan: [],
  rule: 'noRepeat',
};

const els = {
  heroDate:  document.getElementById('hero-date'),
  ruleSelect:document.getElementById('rule-select'),
  meals:     document.getElementById('meals'),
  copyBtn:   document.getElementById('copy-btn'),
  rerollBtn: document.getElementById('reroll-btn'),
  error:     document.getElementById('error'),
};

// --- Data loading -----------------------------------------------------------

async function loadData() {
  try {
    const res = await fetch('data/dishes.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.categories = data.categories;
  } catch (err) {
    showError('数据加载失败 — 请检查网络后刷新');
    throw err;
  }
}

function showError(msg) {
  els.error.textContent = msg;
  els.error.hidden = false;
}

// --- Generation -------------------------------------------------------------

function generate() {
  if (!state.categories) return;
  state.plan = RULES[state.rule].run(state.categories);
  render();
}

// --- Rendering --------------------------------------------------------------

function formatHeroDate(d) {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()} · ${m < 10 ? '0' + m : m} · ${day < 10 ? '0' + day : day} · ${days[d.getDay()]}`;
}

function render() {
  els.heroDate.textContent = formatHeroDate(new Date());
  // Group slots by meal.
  const byMeal = { breakfast: [], lunch: [], dinner: [] };
  for (const entry of state.plan) {
    const meal = entry.slotId.split('-')[0];
    byMeal[meal].push(entry);
  }
  // Each meal: protein first, then carb.
  for (const meal of Object.keys(byMeal)) {
    byMeal[meal].sort((a, b) => a.slotId.endsWith('protein') ? -1 : 1);
  }

  els.meals.innerHTML = '';
  for (const meal of ['breakfast', 'lunch', 'dinner']) {
    const meta = MEAL_META[meal];
    const section = document.createElement('section');
    section.className = 'meal';
    section.setAttribute('aria-labelledby', `${meal}-head`);

    const head = document.createElement('h2');
    head.className = 'meal-head';
    head.id = `${meal}-head`;
    head.textContent = `${meta.emoji} ${meta.label} · ${meta.en}`;
    section.appendChild(head);

    for (const entry of byMeal[meal]) {
      const row = document.createElement('div');
      row.className = 'dish';
      row.dataset.slotId = entry.slotId;

      const info = document.createElement('div');
      info.className = 'dish-info';

      const tag = document.createElement('span');
      tag.className = 'dish-tag';
      tag.textContent = entry.slotId.endsWith('protein') ? '蛋白' : '碳水';

      const name = document.createElement('span');
      name.className = 'dish-name';
      name.textContent = entry.dish;

      info.appendChild(tag);
      info.appendChild(name);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swap-btn';
      btn.textContent = '换一道';
      btn.setAttribute('aria-label', `换掉 ${entry.dish}`);
      btn.addEventListener('click', () => handleSwap(entry.slotId, row));

      row.appendChild(info);
      row.appendChild(btn);
      section.appendChild(row);
    }

    els.meals.appendChild(section);
  }
}

function renderSwapFlash(row) {
  row.classList.remove('is-swapping');
  // Force reflow so the animation restarts.
  void row.offsetWidth;
  row.classList.add('is-swapping');
}

// --- Handlers ---------------------------------------------------------------

function handleSwap(slotId, row) {
  const used = state.plan.map(p => p.dish);
  const newEntry = swapDish(state.plan, slotId, state.categories, used);
  const idx = state.plan.findIndex(p => p.slotId === slotId);
  state.plan[idx] = newEntry;
  // Update only the affected row's text + flash.
  const nameEl = row.querySelector('.dish-name');
  nameEl.textContent = newEntry.dish;
  row.querySelector('.swap-btn').setAttribute('aria-label', `换掉 ${newEntry.dish}`);
  renderSwapFlash(row);
}

function handleRuleChange() {
  state.rule = els.ruleSelect.value;
  generate();
}

function handleReroll() {
  generate();
}

async function handleCopy() {
  const text = formatCopyText(state.plan, new Date());
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers / non-secure contexts.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    flashCopyBtn('已复制 ✓');
  } catch {
    flashCopyBtn('复制失败');
  }
}

function flashCopyBtn(msg) {
  const original = els.copyBtn.textContent;
  els.copyBtn.textContent = msg;
  setTimeout(() => { els.copyBtn.textContent = original; }, 1200);
}

// --- Service worker registration -------------------------------------------

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* silent */ });
  });
}

// --- Init -------------------------------------------------------------------

(async function init() {
  await loadData();
  generate();
  els.ruleSelect.addEventListener('change', handleRuleChange);
  els.rerollBtn.addEventListener('click', handleReroll);
  els.copyBtn.addEventListener('click', handleCopy);
})();
