import { HEROES, CLASSES, ATTRS, ADV, ENEMIES, REGIONS } from './data.js';
import { S, save, fmt, heroStats, heroCost, abilCost, enemyStats, oathGain, prestige, region, oathMult } from './state.js';
const $ = s => document.querySelector(s);
const sc = () => window.__scene;
const pct = v => Math.round(v * 100) + '%';
const weakTo = a => Object.keys(ADV).find(k => ADV[k] === a);
let tab = 'heroes', sheetId = null;
const cards = {};

function badge(kind, key) {
  if (kind === 'cls') { const c = CLASSES[key]; return `<span class="badge cls"><i>${c.icon}</i>${c.name}</span>`; }
  const a = ATTRS[key]; return `<span class="badge attr" style="--c:${a.css}"><i>${a.icon}</i>${a.name}</span>`;
}
function portrait(h, big) { return `<div class="portrait${big ? ' big' : ''}" style="--c:${ATTRS[h.attr].css}"><span class="glyph">${CLASSES[h.cls].icon}</span><span class="lv"></span></div>`; }
const power = st => st.atk * st.aspd * (1 + st.crit * (st.critDmg - 1)) * (st.splash ? 1.6 : 1) + st.hp * 0.05 + st.def * 2;

function buy(cost, fn) { if (S.gold < cost) return; S.gold -= cost; fn(); save(); update(); }
function train(id) { buy(heroCost(id), () => { S.heroLv[id]++; sc().refreshHero(id); }); }
function rankUp(id) { buy(abilCost(id), () => { S.abilLv[id]++; }); }
function recruit(id) { const h = HEROES.find(x => x.id === id); buy(h.unlock, () => { S.unlocked[id] = true; sc().addHero(id); buildHeroes(); }); }

function buildHeroes() {
  const el = $('#tab-heroes'); el.innerHTML = '';
  for (const h of HEROES) {
    const d = document.createElement('div'); d.className = 'hero-card' + (S.unlocked[h.id] ? '' : ' locked'); d.dataset.id = h.id;
    d.innerHTML = `${portrait(h)}<div class="info"><div class="name">${h.name}</div><div class="title">${h.title}</div>
      <div class="badges">${badge('cls', h.cls)}${badge('attr', h.attr)}</div>
      <div class="mini"><span>ATK <b class="atk"></b></span><span>HP <b class="hp"></b></span><span>PWR <b class="pwr"></b></span></div>
      <div class="hpbar"><i></i></div></div>
      <div class="actions">${S.unlocked[h.id] ? `<button class="btn gold train">Train<small></small></button><button class="btn abil">${h.abil.name}<small></small></button>`
        : `<button class="btn gold recruit">Recruit<small>${fmt(h.unlock)} gold</small></button>`}</div>`;
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
    d.querySelector('.atk').textContent = fmt(st.atk); d.querySelector('.hp').textContent = fmt(st.hp); d.querySelector('.pwr').textContent = fmt(power(st));
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
    <div class="cols"><div class="stats"><h3>Battle Stats</h3>
      ${row('ATK', fmt(st.atk), fmt(nx.atk))}${row('HP', u ? `${fmt(u.hp)} / ${fmt(st.hp)}` : fmt(st.hp) + (S.unlocked[h.id] ? ' (fallen)' : ''), fmt(nx.hp))}
      ${row('DEF', fmt(st.def) + ` <small>(-${pct(red)} vs Lv ${S.stage} Brute)</small>`, fmt(nx.def))}
      ${row('Attack Speed', st.aspd.toFixed(2) + '/s')}${row('Move Speed', st.move)}${row('Range', st.range)}
      ${row('Crit Chance', pct(st.crit))}${row('Crit Damage', pct(st.critDmg))}
      ${st.splash ? row('Splash Radius', st.splash) : ''}${st.heal ? row('Heal Power', pct(st.heal) + ' ATK') : ''}
      ${row('Power', fmt(power(st)), fmt(power(nx)))}</div>
    <div class="lore"><h3>${h.abil.name} <small>Rank ${rk}</small></h3><p>${h.abil.text}</p><p class="dim">Damage/heal ×${mult.toFixed(2)} · cooldown ${cd.toFixed(1)} s</p>
      <h3>${CLASSES[h.cls].icon} ${CLASSES[h.cls].name}</h3><p>${CLASSES[h.cls].desc}</p>
      <h3 style="color:${a.css}">${a.icon} ${a.name}</h3><p>Deals +30% to <b>${ATTRS[ADV[h.attr]].name}</b>, and deals −20% to (takes +30% from) <b>${ATTRS[weakTo(h.attr)].name}</b>.</p>
      <p class="dim">Oathmark bonus: ×${oathMult().toFixed(1)} ATK/HP</p></div></div>
    <div class="sheet-actions">${S.unlocked[h.id] ? `<button class="btn gold" id="sh-train" ${S.gold < heroCost(h.id) ? 'disabled' : ''}>Train to Lv ${lv + 1}<small>${fmt(heroCost(h.id))} gold</small></button>
      <button class="btn" id="sh-abil" ${S.gold < abilCost(h.id) ? 'disabled' : ''}>Rank up ${h.abil.name}<small>${fmt(abilCost(h.id))} gold</small></button>`
      : `<button class="btn gold" id="sh-rec" ${S.gold < h.unlock ? 'disabled' : ''}>Recruit<small>${fmt(h.unlock)} gold</small></button>`}</div>`;
  $('#sh-train')?.addEventListener('click', () => { train(h.id); renderSheet(); });
  $('#sh-abil')?.addEventListener('click', () => { rankUp(h.id); renderSheet(); });
  $('#sh-rec')?.addEventListener('click', () => { recruit(h.id); renderSheet(); });
}
function renderCodex() {
  const reg = REGIONS[region()];
  const chain = ['fire', 'nature', 'frost', 'fire'].map(k => `<span style="color:${ATTRS[k].css}">${ATTRS[k].icon} ${ATTRS[k].name}</span>`).join(' <b>›</b> ');
  $('#tab-codex').innerHTML = `<div class="codex"><div class="box"><h3>Attribute Cycle</h3><p>${chain}</p>
    <p><span style="color:${ATTRS.light.css}">☀ Light</span> <b>⇄</b> <span style="color:${ATTRS.shadow.css}">☾ Shadow</span> (each deals +30% to the other)</p>
    <p class="dim">Advantage: +30% damage. Disadvantage: −20%. DEF: damage = hit² ÷ (hit + DEF).</p>
    <p>Current land: <b>${reg.name}</b>, where most foes are <span style="color:${ATTRS[reg.attr].css}">${ATTRS[reg.attr].icon} ${ATTRS[reg.attr].name}</span>.</p></div>
    <div class="box"><h3>Gravemaw Horde · Lv ${S.stage}</h3><table><tr><th>Foe</th><th>Class</th><th>HP</th><th>ATK</th><th>DEF</th><th>Spd</th><th>Rng</th><th>From</th></tr>
    ${Object.values(ENEMIES).map(e => { const s = enemyStats(e); return `<tr class="${S.stage < e.from ? 'dim' : ''}"><td>${e.name}</td><td>${CLASSES[e.cls].icon} ${CLASSES[e.cls].name}</td><td>${fmt(s.hp)}</td><td>${fmt(s.atk)}</td><td>${fmt(s.def)}</td><td>${e.aspd}/s</td><td>${e.range}</td><td>${e.from}</td></tr>`; }).join('')}
    </table><p class="dim">Every 10th stage a Warlord (60× HP, 5× ATK) wards the Rift.</p></div></div>`;
}
function renderBanners() {
  const g = oathGain();
  $('#tab-banners').innerHTML = `<div class="codex"><div class="box"><h3>Raise the Banners</h3>
    <p>Retreat to Greenvale, swear your heroes to a new oath, and begin the march again. You lose stage, gold, hero levels and ranks, and recruited heroes. Oathmarks are permanent: each gives +10% ATK, HP and gold.</p>
    <p>Best stage: <b>${S.best}</b> · Oathmarks owned: <b>${S.oaths}</b> · You would gain: <b class="goldtxt">+${g}</b> <span class="dim">(1 per 5 stages past 20)</span></p>
    <button class="btn gold" id="do-prestige" ${g < 1 ? 'disabled' : ''}>Raise the Banners<small>+${g} Oathmarks</small></button></div></div>`;
  $('#do-prestige').onclick = () => { if (confirm(`Reset your march for ${g} Oathmarks?`)) prestige(); };
}
let last = 0;
function update() {
  $('#r-gold').textContent = fmt(S.gold); $('#r-oath').textContent = S.oaths; $('#r-stage').textContent = `${S.stage}`; $('#r-best').textContent = S.best;
  $('#r-region').textContent = REGIONS[region()].name; $('#speed').textContent = (S.speed || 1) + '×';
  updateHeroes(); if (sheetId) renderSheet();
  const now = Date.now(); if (now - last > 1000) { last = now; if (tab === 'codex') renderCodex(); if (tab === 'banners') renderBanners(); }
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
