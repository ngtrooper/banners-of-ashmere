import { HEROES } from './data.js';
export const SAVE = 'ashmere-save-v1';
const fresh = () => ({ v: 3, gold: 50, stage: 1, best: 1, oaths: 0, speed: 1, heroLv: {}, abilLv: {}, unlocked: { aldric: true, sylwen: true, maera: true } });
export const S = (() => {
  let s = fresh();
  try { const o = JSON.parse(localStorage.getItem(SAVE)); if (o) s = { ...s, ...o, unlocked: { ...s.unlocked, ...(o.unlocked || {}) } }; } catch { /* corrupt save: start fresh */ }
  delete s.troopCount; delete s.troopLv; delete s.autoBoss; // v1/v2 leftovers
  s.heroLv = { ...s.heroLv }; s.abilLv = { ...s.abilLv };
  for (const h of HEROES) { s.heroLv[h.id] ??= 1; s.abilLv[h.id] ??= 1; }
  s.v = 3; return s;
})();
let resetting = false;
export const save = () => { if (!resetting) localStorage.setItem(SAVE, JSON.stringify(S)); };
export const oathMult = () => 1 + S.oaths * 0.1;
export const fmt = n => { n = Math.max(0, n); return n < 1e3 ? Math.floor(n) + '' : n < 1e6 ? (n / 1e3).toFixed(1) + 'K' : n < 1e9 ? (n / 1e6).toFixed(2) + 'M' : n < 1e12 ? (n / 1e9).toFixed(2) + 'B' : n.toExponential(2); };
export const isBossStage = () => S.stage % 10 === 0;
export const region = () => Math.floor((S.stage - 1) / 10) % 5;
export const heroCost = id => Math.floor(25 * Math.pow(1.15, S.heroLv[id] - 1));
export const abilCost = id => Math.floor(200 * Math.pow(1.6, S.abilLv[id] - 1));
export function heroStats(h, lvOverride) {
  const lv = lvOverride ?? S.heroLv[h.id], g = Math.pow(1.12, lv - 1) * oathMult(), b = h.base;
  return { atk: b.atk * g, hp: b.hp * g, def: b.def * Math.pow(1.1, lv - 1), aspd: b.aspd, move: b.move, range: b.range, crit: b.crit, critDmg: b.critDmg, splash: b.splash || 0, heal: b.heal || 0 };
}
export function enemyStats(t, stage = S.stage) { const s = Math.pow(1.13, stage - 1); return { atk: t.atk * s, hp: t.hp * s, def: t.def * s }; }
export const oathGain = () => Math.max(0, Math.floor((S.best - 20) / 5));
export function prestige() { const g = oathGain(); if (g < 1) return; const n = fresh(); n.oaths = S.oaths + g; resetting = true; localStorage.setItem(SAVE, JSON.stringify(n)); location.reload(); }
