import { HEROES, CLASSES, ATTRS, ADV, ENEMIES, REGIONS, BOSS, ATTR_ENABLED, CLASS_STATS, STAT_KEYS, STAT_NAMES } from './data.js';
import { S, save, fmt, fmt1, heroStats, heroCost, abilCost, enemyStats, oathGain, prestige, resetAll, region, oathMult } from './state.js';
const $ = s => document.querySelector(s);
const sc = () => window.__scene;
const pct = v => Math.round(v * 100) + '%';
const weakTo = a => Object.keys(ADV).find(k => ADV[k] === a);
let tab = 'heroes', sheetId = null;
const cards = {};

function badge(kind, key) {
  if (kind === 'cls') { const c = CLASSES[key]; return `<span class="badge cls"><i>${c.icon}</i>${c.name}</span>`; }
  if (!ATTR_ENABLED) return ''; // attributes hidden while Franklin decides
  const a = ATTRS[key]; return `<span class="badge attr" style="--c:${a.css}"><i>${a.icon}</i>${a.name}</span>`;
}
function portrait(h, big) { const img = h.portrait ? `<img class="art${h.sprite && h.sprite.linear ? ' smooth' : ''}" src="${h.portrait}" alt="">` : `<span class="glyph">${CLASSES[h.cls].icon}</span>`; return `<div class="portrait${big ? ' big' : ''}" style="--c:${ATTRS[h.attr].css}">${img}<span class="lv"></span></div>`; }
const power = st => st.atk * st.aspd * (1 + st.crit * (st.critDmg - 1)) * (st.splash ? 1.6 : 1) + st.hp * 0.5 + st.def * 2;

function buy(cost, fn) { if (S.gold < cost) return; S.gold -= cost; fn(); save(); update(); }
function train(id) { buy(heroCost(id), () => { S.heroLv[id]++; sc().refreshHero(id); }); }
function rankUp(id) { buy(abilCost(id), () => { S.abilLv[id]++; }); }
function recruit(id) { const h = HEROES.find(x => x.id === id); if (S.gold < h.unlock) return; summon(h); }
// Summoning Altar: rune circle charges, a pillar of light bursts, then the hero card is revealed
function summon(h) {
  const m = $('#modal'), c = ATTRS[h.attr].css;
  $('#sheet-body').innerHTML = `<div class="altar" style="--c:${c}"><h2>Summoning Altar</h2><p class="dim">Spend ${fmt(h.unlock)} gold to call a hero to your banner.</p>
    <div class="stage-a"><div class="ring r1"></div><div class="ring r2"></div><div class="runes">${'ᚠᚢᚦᚨᚱᚲᚷᚹ'.split('').map((r, i) => `<i style="--i:${i}">${r}</i>`).join('')}</div>
    <div class="slab"></div><div class="beam"></div><div class="flash"></div><div class="reveal">${portrait(h, true)}</div>
    ${Array.from({ length: 18 }, (_, i) => `<b class="spark" style="--a:${i * 20}deg;--d:${(i % 3) * 0.08}s"></b>`).join('')}</div>
    <div class="reveal-card hidden"><h3>${h.name}</h3><div class="title">${h.title}</div><div class="badges">${badge('cls', h.cls)}${badge('attr', h.attr)}</div><p>${h.abil.name}: ${h.abil.text}</p></div>
    <div class="sheet-actions"><button class="btn gold" id="sum-go">Summon<small>${fmt(h.unlock)} gold</small></button></div></div>`;
  sheetId = null; m.classList.remove('hidden');
  $('#sum-go').onclick = () => {
    if (S.gold < h.unlock) return; S.gold -= h.unlock; S.unlocked[h.id] = true; save();
    const alt = $('.altar'); alt.classList.add('go'); $('#sum-go').disabled = true;
    setTimeout(() => { alt.classList.add('done'); $('.reveal-card').classList.remove('hidden'); sc().addHero(h.id); buildHeroes(); update();
      $('.sheet-actions').innerHTML = '<button class="btn gold" id="sum-ok">To battle!</button>'; $('#sum-ok').onclick = closeSheet; }, 2200);
  };
}

function buildHeroes() {
  const el = $('#tab-heroes'); el.innerHTML = '';
  for (const h of HEROES) {
    const d = document.createElement('div'); d.className = 'hero-card' + (S.unlocked[h.id] ? '' : ' locked'); d.dataset.id = h.id;
    d.innerHTML = `${portrait(h)}<div class="info"><div class="name">${h.name}</div><div class="title">${h.title}</div>
      <div class="badges">${badge('cls', h.cls)}${badge('attr', h.attr)}</div>
      <div class="mini"><span>ATK <b class="atk"></b></span><span>HP <b class="hp"></b></span><span>PWR <b class="pwr"></b></span></div>
      <div class="hpbar"><i></i></div></div>
      <div class="actions">${S.unlocked[h.id] ? `<button class="btn gold train">Train<small></small></button><button class="btn abil">${h.abil.name}<small></small></button>`
        : `<button class="btn gold recruit">✦ Summon<small>${fmt(h.unlock)} gold</small></button>`}</div>`;
    d.onclick = e => { if (!e.target.closest('button')) openSheet(h.id); };
    d.querySelector('.train')?.addEventListener('click', () => train(h.id));
    d.querySelector('.abil')?.addEventListener('click', () => rankUp(h.id));
    d.querySelector('.recruit')?.addEventListener('click', () => recruit(h.id));
    el.appendChild(d); cards[h.id] = d;
  }
}
function updateHeroes() {
  for (const h of HEROES) {
    const d = cards[h.id]; if (!d) continue; const st = heroStats(h), u = sc()?.heroUnit(h.id);
    d.querySelector('.lv').textContent = 'Lv ' + S.heroLv[h.id];
    d.querySelector('.atk').textContent = fmt1(st.atk); d.querySelector('.hp').textContent = fmt1(st.hp); d.querySelector('.pwr').textContent = fmt1(power(st));
    d.querySelector('.hpbar i').style.width = (u ? 100 * u.hp / u.max : 0) + '%';
    const t = d.querySelector('.train'), a = d.querySelector('.abil'), r = d.querySelector('.recruit');
    if (t) { t.querySelector('small').textContent = fmt(heroCost(h.id)) + ' gold'; t.disabled = S.gold < heroCost(h.id); }
    if (a) { a.querySelector('small').textContent = `Rank ${S.abilLv[h.id]} · ${fmt(abilCost(h.id))} gold`; a.disabled = S.gold < abilCost(h.id); }
    if (r) r.disabled = S.gold < h.unlock;
  }
}
function openSheet(id) { sheetId = id; $('#modal').classList.remove('hidden'); renderSheet(); }
function closeSheet() { sheetId = null; $('#modal').classList.add('hidden'); }
function renderSheet() {
  if (!sheetId) return;
  const h = HEROES.find(x => x.id === sheetId), lv = S.heroLv[h.id], st = heroStats(h), nx = heroStats(h, lv + 1), u = sc()?.heroUnit(h.id);
  const foeHit = enemyStats(ENEMIES.brute).atk, red = 1 - foeHit / (foeHit + st.def), a = ATTRS[h.attr];
  const rk = S.abilLv[h.id], cd = Math.max(3, 7 - 0.3 * rk), mult = 1 + (rk - 1) * 0.35;
  const row = (k, v, n) => `<div class="row"><span>${k}</span><b>${v}</b>${n ? `<em>→ ${n}</em>` : '<em></em>'}</div>`;
  $('#sheet-body').innerHTML = `<div class="sheet-head">${portrait(h, true)}<div><h2>${h.name}</h2><div class="title">${h.title}</div>
      <div class="badges">${badge('cls', h.cls)}${badge('attr', h.attr)}<span class="badge">Lv ${lv}</span></div></div></div>
    <div class="cols"><div class="stats"><h3>Battle Stats <small class="dim">value · base + growth/level</small></h3>
      ${STAT_KEYS.map(k => { const t = CLASS_STATS[h.cls][k], isPct = k === 'crit' || k === 'critDmg', f = v => isPct ? (v * 100).toFixed(1) + '%' : fmt1(v), g = v => isPct ? (v * 100).toFixed(2) + '%' : (Math.round(v * 1000) / 1000);
        const cur = k === 'hp' && u ? `${fmt1(u.hp)} / ${fmt1(st.hp)}` : f(st[k]);
        return row(STAT_NAMES[k], cur + ` <small>(${g(t.base)} + ${g(t.growth)})</small>`, t.growth ? f(nx[k]) : ''); }).join('')}
      <div class="row"><span>DEF effect</span><b><small>−${pct(red)} damage from a Lv ${S.stage} Brute hit</small></b><em></em></div>
      ${st.splash ? row('Splash Radius', st.splash) : ''}${st.heal ? row('Heal Power', pct(st.heal) + ' ATK') : ''}
      ${row('Power', fmt1(power(st)), fmt1(power(nx)))}${S.oaths ? `<p class="dim">HP/ATK include Oathmark bonus ×${oathMult().toFixed(1)}</p>` : ''}</div>
    <div class="lore"><h3>${h.abil.name} <small>Rank ${rk}</small></h3><p>${h.abil.text}</p><p class="dim">Damage/heal ×${mult.toFixed(2)} · cooldown ${cd.toFixed(1)} s</p>
      <h3>${CLASSES[h.cls].icon} ${CLASSES[h.cls].name}</h3><p>${CLASSES[h.cls].desc}</p>
      ${ATTR_ENABLED ? `<h3 style="color:${a.css}">${a.icon} ${a.name}</h3><p>Deals +30% to <b>${ATTRS[ADV[h.attr]].name}</b>, and deals −20% to (takes +30% from) <b>${ATTRS[weakTo(h.attr)].name}</b>.</p>` : ''}</div></div>
    <div class="sheet-actions">${S.unlocked[h.id] ? `<button class="btn gold" id="sh-train" ${S.gold < heroCost(h.id) ? 'disabled' : ''}>Train to Lv ${lv + 1}<small>${fmt(heroCost(h.id))} gold</small></button>
      <button class="btn" id="sh-abil" ${S.gold < abilCost(h.id) ? 'disabled' : ''}>Rank up ${h.abil.name}<small>${fmt(abilCost(h.id))} gold</small></button>`
      : `<button class="btn gold" id="sh-rec" ${S.gold < h.unlock ? 'disabled' : ''}>✦ Summon<small>${fmt(h.unlock)} gold</small></button>`}</div>`;
  $('#sh-train')?.addEventListener('click', () => { train(h.id); renderSheet(); });
  $('#sh-abil')?.addEventListener('click', () => { rankUp(h.id); renderSheet(); });
  $('#sh-rec')?.addEventListener('click', () => recruit(h.id));
}
function renderCodex() {
  const reg = REGIONS[region()];
  const chain = ['fire', 'nature', 'frost', 'fire'].map(k => `<span style="color:${ATTRS[k].css}">${ATTRS[k].icon} ${ATTRS[k].name}</span>`).join(' <b>›</b> ');
  const attrBox = ATTR_ENABLED ? `<div class="box"><h3>Attribute Cycle</h3><p>${chain}</p>
    <p><span style="color:${ATTRS.light.css}">☀ Light</span> <b>⇄</b> <span style="color:${ATTRS.shadow.css}">☾ Shadow</span></p></div>` : '';
  $('#tab-codex').innerHTML = `<div class="codex">${attrBox}<div class="box"><h3>Combat Rules</h3>
    <p>Stats grow <b>linearly</b>: stat = base + growth × (level − 1). Goblin level = stage.</p>
    <p class="dim">DEF: damage = hit² ÷ (hit + DEF), so big hits punch through and small hits are soaked.</p>
    <p>Current land: <b>${reg.name}</b>.</p></div>
    <div class="box" style="grid-column:1/-1"><h3>Goblin Warband · Lv ${S.stage}</h3><table><tr><th>Foe</th><th>Class</th><th>HP</th><th>ATK</th><th>DEF</th><th>AtkSpd</th><th>Move</th><th>Rng</th><th>From</th></tr>
    ${Object.values(ENEMIES).map(e => { const s = enemyStats(e); return `<tr class="${S.stage < e.from ? 'dim' : ''}"><td>${e.name}</td><td>${CLASSES[e.cls].icon} ${CLASSES[e.cls].name}</td><td>${fmt1(s.hp)} <small class="dim">(${e.stats.hp.base}+${e.stats.hp.growth})</small></td><td>${fmt1(s.atk)} <small class="dim">(${e.stats.atk.base}+${e.stats.atk.growth})</small></td><td>${fmt1(s.def)}</td><td>${s.aspd.toFixed(1)}</td><td>${s.move}</td><td>${s.range}</td><td>${e.from}</td></tr>`; }).join('')}
    </table><p class="dim">Every 10th stage a ${BOSS.name} (Brute ×${BOSS.hp} HP, ×${BOSS.atk} ATK, ×${BOSS.def} DEF) wards the Rift.</p></div></div>`;
}
function renderBanners() {
  const g = oathGain();
  $('#tab-banners').innerHTML = `<div class="codex"><div class="box"><h3>Raise the Banners</h3>
    <p>Retreat to Greenvale, swear your heroes to a new oath, and begin the march again. You lose stage, gold, hero levels and ranks, and recruited heroes. Oathmarks are permanent: each gives +10% ATK, HP and gold.</p>
    <p>Best stage: <b>${S.best}</b> · Oathmarks owned: <b>${S.oaths}</b> · You would gain: <b class="goldtxt">+${g}</b> <span class="dim">(1 per 5 stages past 20)</span></p>
    <button class="btn gold" id="do-prestige" ${g < 1 ? 'disabled' : ''}>Raise the Banners<small>+${g} Oathmarks</small></button></div></div>`;
  $('#do-prestige').onclick = () => { if (confirm(`Reset your march for ${g} Oathmarks?`)) prestige(); };
}
// cheapest affordable purchase (train / rank / recruit), used by the 30-minute simulator
function cheapest() {
  let best = null;
  for (const h of HEROES) {
    if (!S.unlocked[h.id]) { if (!best || h.unlock < best.c) best = { c: h.unlock, f: () => { S.unlocked[h.id] = true; sc().addHero(h.id); } }; continue; }
    const t = heroCost(h.id), a = abilCost(h.id);
    if (!best || t < best.c) best = { c: t, f: () => { S.heroLv[h.id]++; sc().refreshHero(h.id); } };
    if (a < best.c) best = { c: a, f: () => { S.abilLv[h.id]++; } };
  }
  return best;
}
function renderTest() {
  $('#tab-test').innerHTML = `<div class="codex"><div class="box"><h3>Test Tools</h3>
    <p class="dim">Developer helpers for balancing. Not part of normal play.</p>
    <div class="actions" style="display:flex;gap:8px;max-width:520px">
      <button class="btn gold" id="do-sim" title="Fast-forwards 30 minutes of the real battle logic headlessly (fixed 1/30 s timestep, no rendering) and auto-buys the cheapest upgrade (train, ability rank or recruit) every simulated second, so the result reflects real progress.">Sim 30 min<small>fast-forward + auto-buy</small></button>
      <button class="btn" id="do-reset" title="Wipe all progress and start again at stage 1 with a fresh save">Reset<small>fresh save · stage 1</small></button></div>
    <p id="sim-status" class="dim"></p></div></div>`;
  $('#do-reset').onclick = () => { if (confirm('Reset ALL progress back to stage 1 with a fresh save? This cannot be undone.')) resetAll(); };
  $('#do-sim').onclick = runSim;
}
let simming = false;
async function runSim() {
  if (simming) return; simming = true;
  const btn = $('#do-sim'), st = $('#sim-status'); btn.disabled = true;
  const before = { stage: S.stage, best: S.best, gold: S.gold, lv: Object.values(S.heroLv).reduce((a, b) => a + b, 0), rk: Object.values(S.abilLv).reduce((a, b) => a + b, 0), heroes: Object.values(S.unlocked).filter(Boolean).length };
  let spent = 0, buys = 0;
  const autoBuy = () => { for (let i = 0; i < 20; i++) { const b = cheapest(); if (!b || S.gold < b.c) return; S.gold -= b.c; spent += b.c; buys++; b.f(); } };
  const r = await sc().simulate(1800, autoBuy, p => { st.textContent = `Simulating… ${Math.round(p * 100)}%`; });
  save(); buildHeroes(); update(); btn.disabled = false; simming = false; st.textContent = '';
  const lv = Object.values(S.heroLv).reduce((a, b) => a + b, 0), rk = Object.values(S.abilLv).reduce((a, b) => a + b, 0), heroes = Object.values(S.unlocked).filter(Boolean).length;
  const sum = { stagesGained: S.stage - before.stage, stage: S.stage, best: S.best, earned: Math.round(sc().earned), spent: Math.round(spent), buys, levelsGained: lv - before.lv, ranksGained: rk - before.rk, recruited: heroes - before.heroes, seconds: +(r.ms / 1000).toFixed(1) };
  window.__simResult = sum;
  $('#sheet-body').innerHTML = `<h2>30 minutes simulated</h2><div class="stats">
    <div class="row"><span>Stage</span><b>${before.stage} → ${S.stage}</b><em>+${sum.stagesGained}</em></div>
    <div class="row"><span>Gold earned</span><b>${fmt(sum.earned)}</b><em></em></div>
    <div class="row"><span>Gold spent</span><b>${fmt(sum.spent)}</b><em>${buys} purchases</em></div>
    <div class="row"><span>Hero levels gained</span><b>+${sum.levelsGained}</b><em></em></div>
    <div class="row"><span>Ability ranks gained</span><b>+${sum.ranksGained}</b><em></em></div>
    <div class="row"><span>Heroes recruited</span><b>+${sum.recruited}</b><em></em></div>
    <div class="row"><span>Levels now</span><b>${HEROES.filter(h => S.unlocked[h.id]).map(h => h.name.split(' ').slice(-1)[0] + ' ' + S.heroLv[h.id]).join(' · ')}</b><em></em></div>
    <p class="dim">Computed in ${sum.seconds} s of real time.</p></div>`;
  sheetId = null; $('#modal').classList.remove('hidden'); $('#modal').classList.add('simsum');
}
let last = 0;
function update() {
  $('#r-gold').textContent = fmt(S.gold); $('#r-oath').textContent = S.oaths; $('#r-stage').textContent = `${S.stage}`; $('#r-best').textContent = S.best;
  $('#r-region').textContent = REGIONS[region()].name; $('#speed').textContent = (S.speed || 1) + '×';
  updateHeroes(); if (sheetId) renderSheet();
  const now = Date.now(); if (now - last > 1000) { last = now; if (tab === 'codex') renderCodex(); if (tab === 'banners') renderBanners(); if (tab === 'test' && !$('#do-sim')) renderTest(); }
}
export function initUI() {
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => {
    tab = b.dataset.tab; document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('hidden', t.id !== 'tab-' + tab)); last = 0; update();
  });
  $('#speed').onclick = () => { S.speed = S.speed === 2 ? 1 : 2; save(); update(); };
  $('#modal').onclick = e => { if (e.target.id === 'modal') closeSheet(); }; $('#sheet-close').onclick = closeSheet;
  buildHeroes(); setInterval(update, 250); update();
}
