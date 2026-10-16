import { HEROES, CLASS_STATS, statsAt } from './data.js';
export const SAVE = 'ashmere-save-v1';
const fresh = () => ({ v: 4, gold: 50, stage: 1, best: 1, oaths: 0, speed: 1, heroLv: {}, abilLv: {}, unlocked: { aldric: true, sylwen: true, maera: true } });
export const S = (() => {
  let s = fresh();
  try { const o = JSON.parse(localStorage.getItem(SAVE)); if (o) s = { ...s, ...o, unlocked: { ...s.unlocked, ...(o.unlocked || {}) } }; } catch { /* corrupt save: start fresh */ }
  delete s.troopCount; delete s.troopLv; delete s.autoBoss; // v1/v2 leftovers
  s.heroLv = { ...s.heroLv }; s.abilLv = { ...s.abilLv };
  for (const h of HEROES) { s.heroLv[h.id] ??= 1; s.abilLv[h.id] ??= 1; }
  s.v = 4; return s; // v4: linear stats (levels kept)
})();
let resetting = false;
export const save = () => { if (!resetting) localStorage.setItem(SAVE, JSON.stringify(S)); };
export const oathMult = () => 1 + S.oaths * 0.1;
export const fmt = n => { n = Math.max(0, n); return n < 1e3 ? Math.floor(n) + '' : n < 1e6 ? (n / 1e3).toFixed(1) + 'K' : n < 1e9 ? (n / 1e6).toFixed(2) + 'M' : n < 1e12 ? (n / 1e9).toFixed(2) + 'B' : n.toExponential(2); };
export const isBossStage = () => S.stage % 10 === 0;
export const region = () => Math.floor((S.stage - 1) / 10) % 5;
export const heroCost = id => { const n = S.heroLv[id] - 1; return Math.round(10 + 6 * n + 0.6 * n * n); };
export const abilCost = id => 40 * S.abilLv[id] * S.abilLv[id];
export function heroStats(h, lvOverride) {
  const lv = lvOverride ?? S.heroLv[h.id], o = statsAt(CLASS_STATS[h.cls], lv), m = oathMult();
  return { ...o, hp: o.hp * m, atk: o.atk * m, splash: h.splash || 0, heal: h.heal || 0 };
}
export const enemyStats = (t, stage = S.stage) => statsAt(t.stats, stage);
export const fmt1 = n => n < 100 ? (Math.round(n * 10) / 10).toFixed(1) : fmt(n);
export const oathGain = () => Math.max(0, Math.floor((S.best - 20) / 5));
export function resetAll() { resetting = true; localStorage.setItem(SAVE, JSON.stringify(fresh())); location.reload(); }
export function prestige() { const g = oathGain(); if (g < 1) return; const n = fresh(); n.oaths = S.oaths + g; resetting = true; localStorage.setItem(SAVE, JSON.stringify(n)); location.reload(); }
