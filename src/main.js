import Phaser from 'phaser';
// Banners of Ashmere: original prototype. Placeholder shapes only.
const W = 960, H = 440, GROUND = 380, SAVE = 'ashmere-save-v1';
const HEROES = [
  { id: 'aldric', name: 'Ser Aldric Vane', role: 'Shieldlord', color: 0x4f8cff, hp: 2400, dmg: 90, range: 50, cleave: 4, abil: 'Bulwark Charge: knocks back and stuns 6 foes' },
  { id: 'sylwen', name: 'Sylwen Thornleaf', role: 'Elf Warden', color: 0x55e07a, hp: 1400, dmg: 70, range: 320, cleave: 2, abil: 'Thornvolley: arrows strike 10 foes' },
  { id: 'maera', name: 'Maera of the Ember Crown', role: 'Drake Rider', color: 0xff7a3d, hp: 1800, dmg: 80, range: 160, cleave: 3, abil: 'Drakefire: scorches up to 8 foes just ahead' },
];
const def = () => ({ gold: 50, stage: 1, best: 1, oaths: 0, heroLv: { aldric: 1, sylwen: 1, maera: 1 },
  abilLv: { aldric: 1, sylwen: 1, maera: 1 } });
let S; try { S = { ...def(), ...JSON.parse(localStorage.getItem(SAVE)) }; } catch { S = def(); }
// migrate pre-0.2 saves: drop troop fields
delete S.troopCount; delete S.troopLv; delete S.autoBoss; S.heroLv = { ...def().heroLv, ...S.heroLv }; S.abilLv = { ...def().abilLv, ...S.abilLv };
const save = () => localStorage.setItem(SAVE, JSON.stringify(S));
const oathMult = () => 1 + S.oaths * 0.1;
const fmt = n => n < 1e3 ? Math.floor(n) + '' : n < 1e6 ? (n / 1e3).toFixed(1) + 'K' : n < 1e9 ? (n / 1e6).toFixed(2) + 'M' : n.toExponential(2);
const heroCost = h => Math.floor(25 * Math.pow(1.15, S.heroLv[h] - 1));
const abilCost = h => Math.floor(200 * Math.pow(1.6, S.abilLv[h] - 1));
const isBossStage = () => S.stage % 10 === 0;

const STRETCH = 1200, CRIT = 0.15;
class Battle extends Phaser.Scene {
  constructor() { super('battle'); }
  create() {
    this.pool = []; this.units = []; this.drops = []; this.shots = []; this.camX = 0;
    this.bg = this.add.graphics(); this.g = this.add.graphics(); this.fx = this.add.graphics();
    // pooled floating damage numbers
    this.nums = []; this.numIdx = 0;
    for (let i = 0; i < 70; i++) this.nums.push(this.add.text(0, 0, '', { fontSize: '14px', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setVisible(false).setDepth(10));
    this.txt = this.add.text(10, 8, '', { fontSize: '14px', color: '#fff', stroke: '#000', strokeThickness: 3 }).setScrollFactor(0).setDepth(11);
    this.cameras.main.setBounds(0, 0, 1e8, H);
    this.startStage(0);
    this.time.addEvent({ delay: 2500, loop: true, callback: () => save() });
    window.__scene = this;
  }
  get(u) { const o = this.pool.pop() || {}; Object.assign(o, { dead: false, cd: 0, abilCd: 3, stun: 0, boss: false, portal: false, shielded: false, hero: null, cleave: 0, dmg: 0, hurtT: 0 }, u); this.units.push(o); return o; }
  heroStats(h) { const m = Math.pow(1.12, S.heroLv[h.id] - 1) * oathMult(); return { max: h.hp * m, dmg: h.dmg * m }; }
  startStage(x0) {
    for (const u of this.units) u.dead = true;
    this.stageX = x0; this.camX = x0; this.bossSpawned = false; this.spawnTimer = 1;
    this.stageHp = 25 * Math.pow(1.13, S.stage - 1); this.stageDmg = this.stageHp * 0.4;
    HEROES.forEach((h, i) => { const st = this.heroStats(h);
      this.get({ side: 0, x: x0 + 140 - i * 60, y: GROUND - 20 - i * 40, hp: st.max, max: st.max, dmg: st.dmg, range: h.range, speed: 100, r: 22, color: h.color, hero: h, cleave: h.cleave }); });
    const php = this.stageHp * 120;
    this.portal = this.get({ side: 1, portal: true, x: x0 + STRETCH, y: GROUND - 70, hp: php, max: php, range: 0, speed: 0, r: 40, color: 0x7a2cff, shielded: isBossStage() });
  }
  buffHero(id) { for (const u of this.units) if (u.hero && u.hero.id === id && !u.dead) { const r = u.hp / u.max, st = this.heroStats(u.hero); u.max = st.max; u.hp = u.max * Math.min(1, r + 0.2); u.dmg = st.dmg; } }
  spawnEnemy(boss) {
    const p = this.portal, hp = this.stageHp * (boss ? 60 : 1) * (0.8 + Math.random() * 0.4);
    this.get({ side: 1, x: p.x - 30 - Math.random() * 30, y: boss ? GROUND - 60 : GROUND - 10 - Math.random() * 120, hp, max: hp,
      dmg: this.stageDmg * (boss ? 7 : 1), range: boss ? 80 : 20, speed: boss ? 25 : 35 + Math.random() * 25, r: boss ? 52 : 12,
      color: boss ? 0x8a1020 : (Math.random() < 0.2 ? 0x4b6b2a : 0x6f8a3a), boss });
  }
  num(x, y, v, kind) { // kind: 0 hero dmg, 1 crit, 2 hero hurt
    const t = this.nums[this.numIdx = (this.numIdx + 1) % this.nums.length];
    t.setText(fmt(v)).setPosition(x + (Math.random() - 0.5) * 20, y).setVisible(true).setAlpha(1)
      .setColor(['#ffe680', '#ff9a1f', '#ff4d4d'][kind]).setFontSize(kind === 1 ? 22 : 14);
    t.life = 0.8;
  }
  hit(t, d, src) {
    if (t.dead) return;
    if (t.shielded) { if (Math.random() < 0.05) this.num(t.x, t.y - 50, 0, 2); return; }
    let crit = false; if (src && src.hero && Math.random() < CRIT) { d *= 2; crit = true; }
    t.hp -= d;
    if (t.side === 0) this.num(t.x, t.y - 30, d, 2);
    else if (crit || t.boss || t.portal || Math.random() < 0.5) this.num(t.x, t.y - t.r - 6, d, crit ? 1 : 0);
    if (t.hp <= 0) { t.dead = true;
      if (t.side === 1) this.drops.push({ x: t.x, y: t.y, v: this.stageHp * (t.portal ? 30 : t.boss ? 40 : 1) * 0.6 * oathMult(), t: 0 });
      if (t.boss) { this.portal.shielded = false; }
      if (t.portal) { S.stage++; S.best = Math.max(S.best, S.stage); this.nextAt = this.time.now + 600; } }
  }
  update(_, dtMs) {
    const dt = Math.min(dtMs, 50) / 1000; const allies = [], foes = [];
    if (this.nextAt && this.time.now > this.nextAt) { this.nextAt = 0; this.startStage(this.portal.x + 200); }
    for (const u of this.units) if (!u.dead) (u.side === 0 ? allies : foes).push(u);
    const p = this.portal;
    if (!p.dead) {
      if ((this.spawnTimer -= dt) <= 0 && foes.length < 120) { const k = 3 + Math.floor(S.stage / 4); for (let i = 0; i < k; i++) this.spawnEnemy(false); this.spawnTimer = Math.max(0.8, 2 - S.stage * 0.02); }
      if (isBossStage() && !this.bossSpawned && allies.some(a => a.x > p.x - 700)) { this.bossSpawned = true; this.spawnEnemy(true); }
    }
    for (const u of this.units) {
      if (u.dead || u.portal) continue; if (u.stun > 0) { u.stun -= dt; continue; }
      const opp = u.side === 0 ? foes : allies; let best = null, bd = 1e9;
      for (const o of opp) { if (o.dead) continue; const d = Math.abs(o.x - u.x) + Math.abs(o.y - u.y) * 0.3 + (o.portal && o.shielded ? 400 : 0); if (d < bd) { bd = d; best = o; } }
      if (best && Math.abs(best.x - u.x) <= u.range + u.r + best.r) {
        if ((u.cd -= dt) <= 0) { u.cd = u.hero ? 0.6 : 1;
          if (u.cleave) { const tg = opp.filter(o => !o.dead && Math.abs(o.x - best.x) < 60 && Math.abs(o.y - best.y) < 60).slice(0, u.cleave); if (!tg.includes(best)) tg[0] = best; tg.forEach(o => this.hit(o, u.dmg, u)); }
          else this.hit(best, u.dmg, u);
          if (u.range > 60) this.shots.push({ x1: u.x, y1: u.y, x2: best.x, y2: best.y, t: 0.12 }); }
      } else if (best) u.x += Math.sign(best.x - u.x) * u.speed * dt;
      else if (u.side === 0) u.x += u.speed * dt;
      if (u.hero && best && (u.abilCd -= dt) <= 0) { u.abilCd = Math.max(3, 7 - S.abilLv[u.hero.id] * 0.3); this.ability(u, foes); }
    }
    let front = 0; for (const a of allies) front = Math.max(front, a.x);
    if (front) this.camX += Math.max(0, front - W * 0.4 - this.camX) * dt * 2;
    this.camX = Math.min(this.camX, p.x + 200 - W * 0.75);
    if (!allies.length && !this.nextAt) this.startStage(this.stageX); // wipe: retry this stage
    this.cameras.main.scrollX = this.camX;
    for (const d of this.drops) { d.t += dt; if (d.t > 0.5) { S.gold += d.v; d.done = true; } }
    this.drops = this.drops.filter(d => !d.done);
    for (const t of this.nums) if (t.visible) { t.life -= dt; t.y -= 40 * dt; t.setAlpha(Math.min(1, t.life * 2)); if (t.life <= 0) t.setVisible(false); }
    this.units = this.units.filter(u => { if (u.dead) { this.pool.push(u); return false; } return true; });
    this.draw(); window.dispatchEvent(new Event('tick'));
  }
  ability(h, foes) {
    // rebalanced so no single ability clears a stage
    const k = 1 + (S.abilLv[h.hero.id] - 1) * 0.35;
    const near = foes.filter(f => !f.dead && !f.portal).sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x));
    if (h.hero.id === 'aldric') near.slice(0, 6).forEach(f => { this.hit(f, h.dmg * 2.2 * k, h); if (!f.boss) f.x += 50; f.stun = 1.2; });
    if (h.hero.id === 'sylwen') near.slice(0, 10).forEach(f => { this.hit(f, h.dmg * 1.8 * k, h); this.shots.push({ x1: h.x, y1: h.y - 40, x2: f.x, y2: f.y, t: 0.25 }); });
    if (h.hero.id === 'maera') { this.flame = { x: h.x, t: 0.4 }; near.filter(f => f.x > h.x - 20 && f.x - h.x < 180).slice(0, 8).forEach(f => this.hit(f, h.dmg * 1.6 * k, h)); }
  }
  bar(g, x, y, w, frac, col) { g.fillStyle(0x000000, 0.7).fillRect(x - w / 2 - 1, y - 1, w + 2, 5); g.fillStyle(col).fillRect(x - w / 2, y, w * Math.max(0, frac), 3); }
  draw() {
    const g = this.g, bg = this.bg, cx = this.camX; bg.clear(); g.clear(); this.fx.clear();
    const region = Math.floor((S.stage - 1) / 10) % 4, skies = [0x2b3d5a, 0x3a2f4f, 0x4a2b2b, 0x24323a], grounds = [0x3d5a2c, 0x5a5130, 0x4a3326, 0x40484f];
    bg.fillStyle(skies[region]).fillRect(cx, 0, W, H); bg.fillStyle(grounds[region]).fillRect(cx, GROUND - 150, W, H);
    for (let x = Math.floor(cx / 160) * 160; x < cx + W + 160; x += 160) bg.fillStyle(0x000000, 0.2).fillTriangle(x, GROUND - 150, x + 60, GROUND - 210 - (x % 7) * 6, x + 120, GROUND - 150);
    const tt = this.time.now / 1000;
    for (const u of this.units) {
      if (u.x < cx - 80 || u.x > cx + W + 80) continue;
      if (u.portal) { g.fillStyle(0x2a1040).fillEllipse(u.x, u.y, 70, 130); g.fillStyle(u.color, 0.6 + 0.3 * Math.sin(tt * 4)).fillEllipse(u.x, u.y, 50 + 6 * Math.sin(tt * 3), 110);
        if (u.shielded) g.lineStyle(4, 0x9fe8ff, 0.7).strokeEllipse(u.x, u.y, 90, 150);
        this.bar(g, u.x, u.y - 82, 90, u.hp / u.max, u.shielded ? 0x9fe8ff : 0xc070ff); continue; }
      if (u.hero) { g.fillStyle(0x000000, 0.3).fillEllipse(u.x, u.y + u.r, u.r * 2, 8); g.fillStyle(u.color).fillCircle(u.x, u.y, u.r); g.lineStyle(3, 0xffffff, 0.8).strokeCircle(u.x, u.y, u.r); g.fillStyle(0xf3c76b).fillTriangle(u.x - 9, u.y - 26, u.x + 9, u.y - 26, u.x, u.y - 44);
        this.bar(g, u.x, u.y - 52, 50, u.hp / u.max, 0x66ff66); }
      else if (u.boss) { g.fillStyle(u.color).fillRect(u.x - u.r, u.y - u.r, u.r * 2, u.r * 2); g.fillStyle(0xffd700).fillTriangle(u.x - 20, u.y - u.r, u.x + 20, u.y - u.r, u.x, u.y - u.r - 18); this.bar(g, u.x, u.y - u.r - 28, 90, u.hp / u.max, 0xff4444); }
      else { g.fillStyle(u.color).fillTriangle(u.x - 12, u.y + 12, u.x + 12, u.y + 12, u.x, u.y - 14); g.fillStyle(0xff3030).fillRect(u.x - 4, u.y - 2, 3, 3).fillRect(u.x + 1, u.y - 2, 3, 3);
        this.bar(g, u.x, u.y - 20, 22, u.hp / u.max, 0xff5555); }
    }
    for (const s of this.shots) { s.t -= 1 / 60; this.fx.lineStyle(1, 0xffffaa, 0.8).lineBetween(s.x1, s.y1, s.x2, s.y2); }
    this.shots = this.shots.filter(s => s.t > 0);
    if (this.flame) { this.fx.fillStyle(0xff6a00, 0.35).fillRect(this.flame.x, GROUND - 150, 180, 170); if ((this.flame.t -= 1 / 60) <= 0) this.flame = null; }
    for (const d of this.drops) this.fx.fillStyle(0xffd700).fillCircle(d.x, d.y - d.t * 60, 6);
    const p = this.portal, dist = Math.max(0, Math.round((p.x - Math.max(...this.units.filter(u => u.hero).map(u => u.x), this.stageX)) / 10));
    this.txt.setText(`${['Greenvale Marches', 'Dunmoor Reach', 'Cinderfell', 'Frostspire Pass'][region]}  ·  Enemy Lv ${S.stage}: HP ${fmt(this.stageHp)} / Dmg ${fmt(this.stageDmg)}  ·  Foes ${this.units.filter(u => u.side === 1 && !u.portal).length}\n`
      + `Rift: ${p.dead ? 'DESTROYED' : fmt(Math.max(0, p.hp)) + ' HP' + (p.shielded ? ' (warded until the Warlord falls)' : '')}  ·  ${dist}m away` + (isBossStage() ? '  ·  WARLORD STAGE' : ''));
  }
}


const game = new Phaser.Game({ type: Phaser.AUTO, width: W, height: H, parent: 'game', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY }, backgroundColor: '#111', scene: Battle, fps: { target: 60 } });
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
  $('rally').textContent = `Raise the Banners (+${oathGain()})`; $('rally').disabled = oathGain() < 1;
  panel.querySelectorAll('button').forEach(b => b.disabled = S.gold < +b.dataset.cost);
});
$('rally').onclick = () => { const g = oathGain(); if (g < 1 || !confirm(`Reset to stage 1 for ${g} Oathmarks?`)) return; const o = S.oaths + g; S = def(); S.oaths = o; save(); location.reload(); };
render(); setInterval(render, 1000);
