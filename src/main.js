import Phaser from 'phaser';
// Banners of Ashmere: original prototype. Placeholder shapes only.
const W = 960, H = 440, GROUND = 380, SAVE = 'ashmere-save-v1';
const HEROES = [
  { id: 'aldric', name: 'Ser Aldric Vane', role: 'Shieldlord', color: 0x4f8cff, hp: 2400, dmg: 90, range: 50, cleave: 4, abil: 'Bulwark Charge: knocks back and stuns the front line' },
  { id: 'sylwen', name: 'Sylwen Thornleaf', role: 'Elf Warden', color: 0x55e07a, hp: 1400, dmg: 70, range: 320, cleave: 2, abil: 'Thornvolley: arrows rain on 15 foes' },
  { id: 'maera', name: 'Maera of the Ember Crown', role: 'Drake Rider', color: 0xff7a3d, hp: 1800, dmg: 80, range: 160, cleave: 3, abil: 'Drakefire: a burning wave across the field' },
];
const def = () => ({ gold: 50, stage: 1, best: 1, oaths: 0, heroLv: { aldric: 1, sylwen: 1, maera: 1 },
  abilLv: { aldric: 1, sylwen: 1, maera: 1 } });
let S; try { S = { ...def(), ...JSON.parse(localStorage.getItem(SAVE)) }; } catch { S = def(); }
// migrate pre-0.2 saves: drop troop fields
delete S.troopCount; delete S.troopLv; S.heroLv = { ...def().heroLv, ...S.heroLv }; S.abilLv = { ...def().abilLv, ...S.abilLv };
const save = () => localStorage.setItem(SAVE, JSON.stringify(S));
const oathMult = () => 1 + S.oaths * 0.1;
const fmt = n => n < 1e3 ? Math.floor(n) + '' : n < 1e6 ? (n / 1e3).toFixed(1) + 'K' : n < 1e9 ? (n / 1e6).toFixed(2) + 'M' : n.toExponential(2);
const heroCost = h => Math.floor(25 * Math.pow(1.15, S.heroLv[h] - 1));
const abilCost = h => Math.floor(200 * Math.pow(1.6, S.abilLv[h] - 1));
const isBossStage = () => S.stage % 10 === 0;

class Battle extends Phaser.Scene {
  constructor() { super('battle'); }
  create() {
    this.pool = []; this.units = []; this.drops = []; this.camX = 0; this.waveLeft = 0; this.bossFight = false;
    this.bg = this.add.graphics(); this.g = this.add.graphics(); this.fx = this.add.graphics();
    this.txt = this.add.text(10, 10, '', { fontSize: '14px', color: '#fff' }).setScrollFactor(0);
    this.cameras.main.setBounds(0, 0, 1e7, H);
    this.respawnArmy(); this.startStage();
    this.time.addEvent({ delay: 2500, loop: true, callback: () => save() });
    window.__scene = this;
  }
  get(u) { const o = this.pool.pop() || {}; Object.assign(o, { dead: false, cd: 0, abilCd: 3, stun: 0, boss: false, hero: null, cleave: 0 }, u); this.units.push(o); return o; }
  respawnArmy() {
    for (const u of this.units) if (u.side === 0) { u.dead = true; }
    const x0 = this.camX + 120;
    HEROES.forEach((h, i) => { const lv = S.heroLv[h.id], m = Math.pow(1.12, lv - 1) * oathMult();
      this.get({ side: 0, x: x0 - i * 60, y: GROUND - 20 - i * 40, hp: h.hp * m, max: h.hp * m, dmg: h.dmg * m, range: h.range, speed: 60, r: 22, color: h.color, hero: h, cleave: h.cleave }); });
  }
  buffHero(id) { for (const u of this.units) if (u.hero && u.hero.id === id && !u.dead) { const r = u.hp / u.max, m = Math.pow(1.12, S.heroLv[id] - 1) * oathMult(); u.max = u.hero.hp * m; u.hp = u.max * Math.min(1, r + 0.2); u.dmg = u.hero.dmg * m; } }
  startStage() {
    this.bossFight = false; const n = 30 + Math.min(150, S.stage * 5); this.waveLeft = n;
    this.spawnTimer = 0; this.stageHp = 25 * Math.pow(1.13, S.stage - 1);
  }
  spawnEnemy(boss) {
    const hp = this.stageHp * (boss ? 60 : 1) * (0.8 + Math.random() * 0.4);
    this.get({ side: 1, x: this.camX + W + 20 + Math.random() * 80, y: boss ? GROUND - 60 : GROUND - Math.random() * 130, hp, max: hp,
      dmg: this.stageHp * (boss ? 3 : 0.4), range: boss ? 80 : 20, speed: boss ? 20 : 30 + Math.random() * 20, r: boss ? 52 : 12,
      color: boss ? 0x8a1020 : (Math.random() < 0.2 ? 0x4b6b2a : 0x6f8a3a), boss });
  }
  challengeBoss() { if (!isBossStage() || this.bossFight) return; this.bossFight = true; this.waveLeft = 0; this.spawnEnemy(true); }
  hit(t, d) { t.hp -= d; if (t.hp <= 0 && !t.dead) { t.dead = true; if (t.side === 1) this.drops.push({ x: t.x, y: t.y, v: this.stageHp * (t.boss ? 40 : 1) * 0.6 * oathMult(), t: 0 });
      if (t.boss) { S.stage++; S.best = Math.max(S.best, S.stage); this.startStage(); } } }
  update(_, dtMs) {
    const dt = Math.min(dtMs, 50) / 1000; const allies = [], foes = [];
    for (const u of this.units) if (!u.dead) (u.side === 0 ? allies : foes).push(u);
    // spawning
    if (this.waveLeft > 0 && (this.spawnTimer -= dt) <= 0 && foes.length < 120) { const k = Math.min(this.waveLeft, 3 + Math.floor(S.stage / 5)); for (let i = 0; i < k; i++) this.spawnEnemy(false); this.waveLeft -= k; this.spawnTimer = 0.6; }
    if (this.waveLeft <= 0 && foes.length === 0 && !this.bossFight) {
      if (isBossStage()) { if (S.autoBoss) this.challengeBoss(); }
      else { S.stage++; S.best = Math.max(S.best, S.stage); this.startStage(); }
    }
    for (const u of this.units) {
      if (u.dead) continue; if (u.stun > 0) { u.stun -= dt; continue; }
      const opp = u.side === 0 ? foes : allies; let best = null, bd = 1e9;
      for (const o of opp) { if (o.dead) continue; const d = Math.abs(o.x - u.x) + Math.abs(o.y - u.y) * 0.3; if (d < bd) { bd = d; best = o; } }
      const dir = u.side === 0 ? 1 : -1;
      if (best && bd <= u.range + u.r + best.r) {
        if ((u.cd -= dt) <= 0) { u.cd = u.hero ? 0.6 : 1; if (u.cleave) { const tg = opp.filter(o => !o.dead && Math.abs(o.x - best.x) < 60 && Math.abs(o.y - best.y) < 60).slice(0, u.cleave); tg.forEach(o => this.hit(o, u.dmg)); } else this.hit(best, u.dmg); if (u.range > 60) this.shots.push({ x1: u.x, y1: u.y, x2: best.x, y2: best.y, t: 0.12 }); }
      } else if (best) { u.x += Math.sign(best.x - u.x) * u.speed * dt; }
      else if (u.side === 0) { const lead = this.camX + W * 0.45; if (u.x < lead) u.x += u.speed * dt; }
      else u.x += dir * u.speed * dt;
      if (u.hero && best && (u.abilCd -= dt) <= 0) { u.abilCd = Math.max(2.5, 6.5 - S.abilLv[u.hero.id] * 0.4); this.ability(u, foes); }
    }
    // army advance: camera follows the allied front
    let front = 0; for (const a of allies) if (a.hero) front = Math.max(front, a.x);
    if (front) this.camX += Math.max(0, front - W * 0.35 - this.camX) * dt * 2;
    if (!allies.some(a => a.hero)) { this.respawnArmy(); this.bossFight = false; this.startStage(); this.units = this.units.filter(u => { if (u.side === 1) { u.dead = true; } return !u.dead || (this.pool.push(u), false); }); }
    this.cameras.main.scrollX = this.camX;
    // drops auto-collect
    for (const d of this.drops) { d.t += dt; if (d.t > 0.5) { S.gold += d.v; d.done = true; } }
    this.drops = this.drops.filter(d => !d.done);
    this.units = this.units.filter(u => { if (u.dead) { this.pool.push(u); return false; } return true; });
    this.draw(); window.dispatchEvent(new Event('tick'));
  }
  ability(h, foes) {
    const k = 1 + (S.abilLv[h.hero.id] - 1) * 0.5; const near = foes.filter(f => !f.dead).sort((a, b) => a.x - b.x);
    if (h.hero.id === 'aldric') near.slice(0, 8).forEach(f => { this.hit(f, h.dmg * 3 * k); f.x += 60; f.stun = 1.5; });
    if (h.hero.id === 'sylwen') near.slice(0, 15).forEach(f => { this.hit(f, h.dmg * 2.5 * k); this.shots.push({ x1: h.x, y1: h.y - 40, x2: f.x, y2: f.y, t: 0.25 }); });
    if (h.hero.id === 'maera') { this.flame = { x: h.x, t: 0.4 }; near.filter(f => f.x - h.x < 300).forEach(f => this.hit(f, h.dmg * 4 * k)); }
  }
  draw() {
    const g = this.g, bg = this.bg, cx = this.camX; bg.clear(); g.clear(); this.fx.clear();
    const region = Math.floor((S.stage - 1) / 10) % 4, skies = [0x2b3d5a, 0x3a2f4f, 0x4a2b2b, 0x24323a], grounds = [0x3d5a2c, 0x5a5130, 0x4a3326, 0x40484f];
    bg.fillStyle(skies[region]).fillRect(cx, 0, W, H); bg.fillStyle(grounds[region]).fillRect(cx, GROUND - 150, W, H);
    for (let x = Math.floor(cx / 160) * 160; x < cx + W + 160; x += 160) { bg.fillStyle(0x000000, 0.2).fillTriangle(x, GROUND - 150, x + 60, GROUND - 210 - (x % 7) * 6, x + 120, GROUND - 150); }
    for (const u of this.units) {
      if (u.hero) { g.fillStyle(0x000000, 0.3).fillEllipse(u.x, u.y + u.r, u.r * 2, 8); g.fillStyle(u.color).fillCircle(u.x, u.y, u.r); g.lineStyle(3, 0xffffff, 0.8).strokeCircle(u.x, u.y, u.r); g.fillStyle(0xf3c76b).fillTriangle(u.x - 9, u.y - 26, u.x + 9, u.y - 26, u.x, u.y - 44); }
      else if (u.boss) { g.fillStyle(u.color).fillRect(u.x - u.r, u.y - u.r, u.r * 2, u.r * 2); }
            else { g.fillStyle(u.color).fillTriangle(u.x - 12, u.y + 12, u.x + 12, u.y + 12, u.x, u.y - 14); g.fillStyle(0xff3030).fillRect(u.x - 4, u.y - 2, 3, 3).fillRect(u.x + 1, u.y - 2, 3, 3); };
      if (u.hero || u.boss) { g.fillStyle(0x000000).fillRect(u.x - 25, u.y - u.r - 12, 50, 5); g.fillStyle(0x6f6).fillRect(u.x - 25, u.y - u.r - 12, 50 * Math.max(0, u.hp / u.max), 3); }
    }
    for (const s of this.shots) { s.t -= 1 / 60; this.fx.lineStyle(1, 0xffffaa, 0.8).lineBetween(s.x1, s.y1, s.x2, s.y2); }
    this.shots = this.shots.filter(s => s.t > 0);
    if (this.flame) { this.fx.fillStyle(0xff6a00, 0.35).fillRect(this.flame.x, GROUND - 150, 300, 170); if ((this.flame.t -= 1 / 60) <= 0) this.flame = null; }
    for (const d of this.drops) this.fx.fillStyle(0xffd700).fillCircle(d.x, d.y - d.t * 60, 6);
    this.txt.setText(`Region: ${['Greenvale Marches', 'Dunmoor Reach', 'Cinderfell', 'Frostspire Pass'][region]}   Foes on field: ${this.units.filter(u => u.side === 1).length}` + (isBossStage() ? '   WARLORD STAGE' : ''));
  }
}
Battle.prototype.shots = [];

const game = new Phaser.Game({ type: Phaser.AUTO, width: W, height: H, parent: 'game', backgroundColor: '#111', scene: Battle, fps: { target: 60 } });
const $ = id => document.getElementById(id), panel = $('panel');
function card(html, btns) { const d = document.createElement('div'); d.className = 'card'; d.innerHTML = html; btns.forEach(([label, cost, fn]) => { const b = document.createElement('button'); b.textContent = label; b.dataset.cost = cost(); b.onclick = () => { if (S.gold >= cost()) { S.gold -= cost(); fn(); save(); render(); } }; d.appendChild(b); }); panel.appendChild(d); }
function render() {
  panel.innerHTML = '';
  for (const h of HEROES) card(`<b>${h.name}</b> (${h.role}) Lv ${S.heroLv[h.id]}<br><small>${h.abil}</small><br>`, [[`Train (${fmt(heroCost(h.id))}g)`, () => heroCost(h.id), () => { S.heroLv[h.id]++; game.scene.keys.battle.buffHero(h.id); }],
    [`Ability Rk ${S.abilLv[h.id]} (${fmt(abilCost(h.id))}g)`, () => abilCost(h.id), () => { S.abilLv[h.id]++; }]]);
}
const oathGain = () => Math.max(0, Math.floor((S.best - 20) / 5));
window.addEventListener('tick', () => {
  $('gold').textContent = `Gold ${fmt(S.gold)}`; $('stage').textContent = `Stage ${S.stage} (best ${S.best})`; $('oath').textContent = `Oathmarks ${S.oaths} (+${S.oaths * 10}%)`;
  $('boss').disabled = !isBossStage(); $('rally').textContent = `Raise the Banners (+${oathGain()})`; $('rally').disabled = oathGain() < 1;
  panel.querySelectorAll('button').forEach(b => b.disabled = S.gold < +b.dataset.cost);
});
$('boss').onclick = () => { S.autoBoss = true; game.scene.keys.battle.challengeBoss(); };
$('rally').onclick = () => { const g = oathGain(); if (g < 1 || !confirm(`Reset to stage 1 for ${g} Oathmarks?`)) return; const o = S.oaths + g; S = def(); S.oaths = o; save(); location.reload(); };
render(); setInterval(render, 1000);
