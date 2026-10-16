import Phaser from 'phaser';
import { HEROES, ENEMIES, BOSS, CLASSES, ATTRS, ATTR_KEYS, attrMult, REGIONS, BACKDROPS, REGION_BG } from './data.js';
import { S, save, fmt, heroStats, enemyStats, oathMult, isBossStage, region } from './state.js';
export const W = 960, H = 440, GROUND = 400;
const stretch = () => Math.min(2000, 1100 + S.stage * 45); // short early stages, longer later
const RANGED = new Set(['archer', 'mage', 'cleric']);
const LANE = { knight: -50, rogue: -22, archer: -88, mage: -72, cleric: -38 }; // all feet land on the ground strip (y 296..440)
const PARALLAX = { far: 0.15, near: 0.45, ground: 1 };
const ENEMY_LIST = Object.values(ENEMIES);
// attack timeline: cumulative end time of each attack frame (per-frame durations when given)
const cum = sp => sp._cum || (sp._cum = sp.anims.attack.reduce((a, _, i) => (a.push((a[i - 1] || 0) + ((sp.durs && sp.durs[i]) || sp.frameDur)), a), []));
const atkLen = sp => sp.anims.attack.length ? cum(sp)[sp.anims.attack.length - 1] : sp.atkDur;
const atkFrame = (sp, t) => { const c = cum(sp); let i = 0; while (i < c.length - 1 && t >= c[i]) i++; return sp.anims.attack[i]; };
const dist = u => (a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x);

export class Battle extends Phaser.Scene {
  constructor() { super('battle'); }
  sheets() { return [...HEROES, ...Object.values(ENEMIES)].map(x => x.sprite).filter(Boolean); }
  preload() {
    for (const sp of this.sheets()) this.load.spritesheet(sp.key, sp.url, { frameWidth: sp.fw, frameHeight: sp.fh });
    for (const nm in BACKDROPS) for (const l in PARALLAX) this.load.image(`bg-${nm}-${l}`, `./bg/${nm}-${l}_v1.webp`);
  }
  create() {
    this.pool = []; this.units = []; this.drops = []; this.shots = []; this.fxs = [];
    this.layers = {};
    for (const nm in BACKDROPS) this.layers[nm] = Object.keys(PARALLAX).map(l => { const b = BACKDROPS[nm][l], key = `bg-${nm}-${l}`;
      if (!this.textures.exists(key) || this.textures.get(key).key === '__MISSING') return null;
      return { l, ts: this.add.tileSprite(0, b.y, W, b.h, key).setOrigin(0, 0).setScrollFactor(0).setDepth(-10 + Object.keys(PARALLAX).indexOf(l)).setVisible(false) }; }).filter(Boolean);
    this.bg = this.add.graphics(); this.g = this.add.graphics(); this.fx = this.add.graphics().setDepth(5);
    this.nums = []; this.numIdx = 0;
    for (let i = 0; i < 80; i++) this.nums.push(this.add.text(0, 0, '', { fontFamily: 'Georgia,serif', fontSize: '14px', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setVisible(false).setDepth(10));
    this.glyphs = {};
    for (const h of HEROES) this.glyphs[h.id] = this.add.text(0, 0, CLASSES[h.cls].icon, { fontFamily: 'DejaVu Sans,Segoe UI Symbol,serif', fontSize: '20px', color: '#1a1020' }).setOrigin(0.5).setDepth(6).setVisible(false);
    // guard: a stale/mismatched sheet would render as one big image; fall back to placeholder shapes instead
    this.okSprite = {};
    for (const sp of this.sheets()) {
      const tex = this.textures.get(sp.key), src = tex.getSourceImage();
      if (tex.frameTotal - 1 !== sp.frames || src.width !== sp.fw * sp.frames || src.height !== sp.fh) { console.warn(`sprite ${sp.key}: sheet ${src.width}x${src.height} does not match ${sp.frames}x${sp.fw}x${sp.fh}; using placeholder`); continue; }
      this.okSprite[sp.key] = true;
    }
    this.spool = [];
    this.txt = this.add.text(10, 8, '', { fontFamily: 'Georgia,serif', fontSize: '14px', color: '#f1e4c4', stroke: '#000', strokeThickness: 3, lineSpacing: 4 }).setScrollFactor(0).setDepth(11);
    this.cameras.main.setBounds(0, 0, 1e8, H);
    this.startStage(0);
    this.time.addEvent({ delay: 2500, loop: true, callback: save });
    window.__scene = this;
  }
  get(u) {
    const o = this.pool.pop() || {};
    Object.assign(o, { dead: false, anim: null, pending: null, cd: Math.random() * 0.5, abilCd: 3, stun: 0, boss: false, portal: false, shielded: false, hero: null, etype: null, idle: false, sprite: null, ss: 1, moving: false, phase: Math.random() * 4, tint: 0,
      cls: 'knight', attr: 'nature', splash: 0, heal: 0, crit: 0, critDmg: 1.5, def: 0, aspd: 1, move: 0, range: 20, atk: 0 }, u);
    this.units.push(o); return o;
  }
  spawnHero(h, x) {
    const st = heroStats(h);
    return this.get({ side: 0, hero: h, cls: h.cls, attr: h.attr, ...st, max: st.hp, x: x - CLASSES[h.cls].form, y: GROUND + LANE[h.cls], r: h.sprite && h.sprite.fh > 150 ? 30 : 22, color: ATTRS[h.attr].color, sprite: h.sprite && this.okSprite[h.sprite.key] ? h.sprite : null });
  }
  addHero(id) { const h = HEROES.find(x => x.id === id); this.spawnHero(h, this.camX + 260); }
  refreshHero(id) {
    for (const u of this.units) if (u.hero && u.hero.id === id && !u.dead) {
      const r = u.hp / u.max, st = heroStats(u.hero); Object.assign(u, st); u.max = st.hp; u.hp = u.max * Math.min(1, r + 0.2);
    }
  }
  heroUnit(id) { return this.units.find(u => u.hero && u.hero.id === id && !u.dead); }
  startStage(x0) {
    for (const u of this.units) u.dead = true;
    this.stageX = x0; this.camX = x0; this.bossSpawned = false; this.spawnTimer = 1;
    this.gs = (1 + 0.5 * (S.stage - 1)) * oathMult(); // gold per kill (linear for now)
    for (const h of HEROES) if (S.unlocked[h.id]) this.spawnHero(h, x0 + 240);
    const php = 30 * enemyStats(ENEMIES.brute).hp;
    this.portal = this.get({ side: 1, portal: true, x: x0 + stretch(), y: GROUND - 90, hp: php, max: php, r: 40, color: 0x7a2cff, shielded: isBossStage(), attr: REGIONS[region()].attr });
    // pre-placed packs along the road so there is no empty walk
    const pack = Math.min(10, 3 + Math.floor(S.stage / 4));
    for (let x = x0 + 520; x < x0 + stretch() - 250; x += 300) for (let i = 0; i < pack; i++) this.spawnEnemy(x + Math.random() * 120, true);
  }
  pickType() {
    const list = ENEMY_LIST.filter(e => S.stage >= e.from); let r = Math.random() * list.reduce((a, e) => a + e.w, 0);
    for (const e of list) if ((r -= e.w) <= 0) return e; return list[0];
  }
  spawnEnemy(x, idle, boss) {
    const type = boss ? ENEMIES.brute : this.pickType(), st = enemyStats(type), reg = REGIONS[region()];
    const attr = boss || Math.random() < 0.6 ? reg.attr : ATTR_KEYS[Math.floor(Math.random() * 5)];
    const m = boss ? BOSS : { hp: 1, atk: 1, def: 1 }, hp = st.hp * m.hp * (0.9 + Math.random() * 0.2);
    return this.get({ side: 1, etype: type, cls: type.cls, attr, boss: !!boss, idle, x, y: boss ? GROUND - 30 : GROUND - 12 - Math.random() * 80, hp, max: hp,
      atk: st.atk * m.atk, def: st.def * m.def, aspd: st.aspd, move: st.move * (0.9 + Math.random() * 0.2), range: boss ? 60 : st.range, crit: st.crit, critDmg: st.critDmg,
      splash: type.splash || 0, heal: type.heal || 0, r: boss ? 14 : type.r, color: ATTRS[attr].color,
      sprite: type.sprite && this.okSprite[type.sprite.key] ? type.sprite : null, ss: boss ? BOSS.scale : 1, tint: boss ? 0xffb0a0 : 0 });
  }
  // top of a unit's art (above its HP bar), so floating numbers never cover the character
  headY(u) {
    if (u.sprite) { const sp = u.sprite; return u.y + u.r - sp.fh * sp.scale * u.ss * sp.oy - 18; }
    if (u.hero) return u.y - 44; if (u.portal) return u.y - 104; if (u.boss) return u.y - u.r - 40; return u.y - u.r - 16;
  }
  num(u, v, kind) { // 0 hero dmg, 1 crit, 2 hero hurt, 3 heal
    if (this.sim) return;
    const t = this.nums[this.numIdx = (this.numIdx + 1) % this.nums.length], side = Math.random() < 0.5 ? -1 : 1;
    const hurt = kind === 2, x = u.x + (hurt ? side * (26 + Math.random() * 14) : (Math.random() - 0.5) * 20);
    t.setText((kind === 3 ? '+' : '') + (v < 10 ? v.toFixed(1) : fmt(v)) + (kind === 1 ? '!' : '')).setPosition(x, this.headY(u) - (hurt ? 4 : 0)).setVisible(true).setAlpha(1)
      .setColor(['#ffe680', '#ff9a1f', '#ff5a5a', '#6dff8a'][kind]).setFontSize(kind === 1 ? 20 : kind === 0 ? 12 : 13);
    t.vx = hurt ? side * 38 : (Math.random() - 0.5) * 30; t.vy = -(36 + Math.random() * 14); t.life = 0.85;
  }
  wake(u) { u.idle = false; for (const o of this.units) if (o.idle && Math.abs(o.x - u.x) < 240) o.idle = false; }
  deal(src, t, mult, forceCrit) {
    if (t.dead || t.shielded) return;
    let raw = src.atk * mult * attrMult(src.attr, t.attr); const crit = forceCrit || Math.random() < src.crit; if (crit) raw *= src.critDmg;
    const d = raw * raw / (raw + t.def); // DEF: damage = raw * raw / (raw + DEF)
    t.hp -= d; if (t.idle) this.wake(t);
    if (t.side === 0) this.num(t, d, 2);
    else if (crit || t.boss || t.portal || Math.random() < 0.6) this.num(t, d, crit ? 1 : 0);
    if (t.hp <= 0) {
      t.dead = true;
      if (t.side === 1) this.drops.push({ x: t.x, y: t.y, v: this.gs * (t.portal ? 40 : t.boss ? 40 : 1), t: 0 });
      if (t.boss) this.portal.shielded = false;
      if (t.portal) { S.stage++; S.best = Math.max(S.best, S.stage); this.nextAt = this.clock + 0.7; }
    }
  }
  healUnit(t, amt) { const a = Math.min(amt, t.max - t.hp); if (a <= 0) return; t.hp += a; if (t.side === 0 || Math.random() < 0.3) this.num(t, a, 3); }
  beam(u, t, c) { this.shots.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, t: 0.12, c }); }
  blast(x, y, r, c) { this.fxs.push({ x, y, r, c, t: 0.3 }); }
  heroTarget(u, foes) {
    if (u.cls === 'rogue') {
      let best = null, bs = -1;
      for (const f of foes) { if (f.dead || f.portal || Math.abs(f.x - u.x) > 450) continue; const sc = (RANGED.has(f.cls) ? 2 : 1) / (f.hp / f.max + 0.2); if (sc > bs) { bs = sc; best = f; } }
      if (best) return best;
    }
    let best = null, bd = 1e9;
    for (const f of foes) { if (f.dead) continue; const d = Math.abs(f.x - u.x) + Math.abs(f.y - u.y) * 0.3 + (f.portal ? (f.shielded ? 800 : 60) : 0); if (d < bd) { bd = d; best = f; } }
    return best;
  }
  enemyTarget(u, heroes) {
    if (!heroes.length) return null;
    if (u.cls === 'rogue') return heroes.reduce((a, b) => b.x < a.x ? b : a);
    if (this.knight && Math.abs(this.knight.x - u.x) < 260) return this.knight; // taunt
    return heroes.reduce((a, b) => Math.abs(b.x - u.x) < Math.abs(a.x - u.x) ? b : a);
  }
  mostWounded(u, mates, th) { let best = null, br = th; for (const m of mates) { if (m.dead || m.portal || m.idle || Math.abs(m.x - u.x) > 400) continue; const r = m.hp / m.max; if (r < br) { br = r; best = m; } } return best; }
  attack(u, t, healing, opp) {
    if (healing) { this.healUnit(t, u.atk * u.heal); this.beam(u, t, 0x7dffa0); return; }
    this.deal(u, t, 1);
    if (u.cls === 'knight') { let n = u.boss ? 2 : u.side === 0 ? 3 : 1; for (const o of opp) { if (n <= 0) break; if (o !== t && !o.dead && !o.portal && Math.abs(o.x - t.x) < 60 && Math.abs(o.y - t.y) < 70) { this.deal(u, o, 1); n--; } } }
    else if (u.cls === 'mage') { let n = 10; for (const o of opp) { if (n <= 0) break; if (o !== t && !o.dead && !o.portal && Math.abs(o.x - t.x) < u.splash && Math.abs(o.y - t.y) < u.splash) { this.deal(u, o, 0.6); n--; } } this.blast(t.x, t.y, u.splash, u.color); this.beam(u, t, u.color); }
    else if (u.range > 60) { const sp = u.sprite; if (sp && sp.shotColor) this.shots.push({ x1: u.x + (u.side ? -20 : 24), y1: u.y + u.r - sp.shotY * sp.scale * u.ss, x2: t.x, y2: t.y, t: 0.15, c: sp.shotColor }); else this.beam(u, t, u.side === 0 ? 0xffffaa : 0xff9090); }
  }
  move(u, dir, dt) {
    let nx = u.x + dir * u.move * dt;
    if (u.side === 0 && dir > 0 && this.knight && u !== this.knight && RANGED.has(u.cls)) { const lim = this.knight.x - CLASSES[u.cls].form; if (nx > lim) nx = Math.max(u.x, lim); }
    if (nx !== u.x) { u.moving = true; u.walk = (u.walk || 0) + Math.abs(nx - u.x); } u.x = nx;
  }
  ability(u, foes, allies) {
    const k = 1 + (S.abilLv[u.hero.id] - 1) * 0.35, live = foes.filter(f => !f.dead && !f.portal && !f.idle), near = r => live.filter(f => Math.abs(f.x - u.x) < r).sort(dist(u));
    switch (u.hero.id) {
      case 'aldric': { const t = near(160).slice(0, 6); if (!t.length) return false; if (u.anim == null) u.anim = 0; t.forEach(f => { this.deal(u, f, 2.2 * k); if (!f.boss) f.x += 50; f.stun = 1.2; }); this.blast(u.x + 40, u.y, 110, 0xfff0a0); return true; }
      case 'kael': { const c = near(450); if (!c.length) return false; const t = c.sort((a, b) => (RANGED.has(b.cls) - RANGED.has(a.cls)) || b.atk - a.atk)[0]; u.x = t.x + t.r + 15; this.deal(u, t, 4 * k, true); this.blast(t.x, t.y, 40, 0xa07bff); return true; }
      case 'sylwen': { const t = near(u.range + 40).slice(0, 10); if (!t.length) return false; if (u.anim == null) u.anim = 0; t.forEach(f => { this.deal(u, f, 1.8 * k); this.shots.push({ x1: u.x, y1: u.y - 40, x2: f.x, y2: f.y, t: 0.25, c: 0x9dff9d }); }); return true; }
      case 'maera': { const c = near(u.range + 40); if (!c.length) return false; const a = c[0]; c.filter(f => Math.abs(f.x - a.x) < 180).slice(0, 8).forEach(f => this.deal(u, f, 1.6 * k)); this.fxs.push({ rect: true, x: a.x - 30, y: a.y, r: 180, c: 0xff6a00, t: 0.4 }); return true; }
      case 'isolde': { if (!allies.some(a => a.hp / a.max < 0.9)) return false; allies.forEach(a => this.healUnit(a, a.max * 0.25 * Math.min(2, k))); this.blast(u.x, u.y, 90, 0x7dffa0); return true; }
    }
    return false;
  }
  update(_, ms) {
    if (this.sim) return; // headless fast-forward in progress
    const dt = Math.min(ms, 50) / 1000 * (S.speed || 1);
    this.step(dt);
    for (const t of this.nums) if (t.visible) { t.life -= dt; t.x += t.vx * dt; t.y += t.vy * dt; t.setAlpha(Math.min(1, t.life * 2)); if (t.life <= 0) t.setVisible(false); }
    this.draw(dt);
  }
  // fast-forward the real battle logic with a fixed timestep and no rendering, chunked so the tab stays responsive
  simulate(seconds, autoBuy, onProgress) {
    return new Promise(done => {
      const DT = 1 / 30, t0 = performance.now(); let t = 0, nextBuy = 0;
      this.sim = true; this.earned = 0;
      for (const n of this.nums) n.setVisible(false);
      const chunk = () => {
        const end = performance.now() + 25;
        while (t < seconds && performance.now() < end) {
          for (let i = 0; i < 30 && t < seconds; i++) { this.step(DT); t += DT; if (t >= nextBuy) { autoBuy(); nextBuy = t + 1; } }
          this.shots.length = 0; this.fxs.length = 0;
        }
        onProgress && onProgress(t / seconds);
        if (t < seconds) setTimeout(chunk, 0);
        else { this.sim = false; done({ ms: performance.now() - t0 }); }
      };
      chunk();
    });
  }
  step(dt) {
    this.clock = (this.clock || 0) + dt;
    if (this.nextAt && this.clock > this.nextAt) { this.nextAt = 0; this.startStage(this.portal.x + 260); }
    const allies = [], foes = [];
    for (const u of this.units) if (!u.dead) (u.side === 0 ? allies : foes).push(u);
    let front = -1e9; this.knight = null;
    for (const a of allies) { front = Math.max(front, a.x); if (a.cls === 'knight' && !this.knight) this.knight = a; }
    const p = this.portal;
    if (!p.dead && allies.length) {
      if (front > p.x - 1100 && (this.spawnTimer -= dt) <= 0 && foes.length < 140) { const k = Math.min(8, 2 + Math.floor(S.stage / 5)); for (let i = 0; i < k; i++) this.spawnEnemy(p.x - 40 - Math.random() * 30, false); this.spawnTimer = Math.max(1, 2.2 - S.stage * 0.02); }
      if (isBossStage() && !this.bossSpawned && front > p.x - 700) { this.bossSpawned = true; this.spawnEnemy(p.x - 70, false, true); }
    }
    for (const u of this.units) {
      if (u.dead || u.portal) continue;
      if (u.idle) { if (front > u.x - 380) this.wake(u); else continue; }
      if (u.anim != null) { u.anim += dt; if (u.pending && u.anim >= u.pending.at) { const q = u.pending; u.pending = null; if (!q.tgt.dead) this.attack(u, q.tgt, q.healing, q.opp); } if (!u.sprite || u.anim > atkLen(u.sprite)) u.anim = null; }
      u.moving = false;
      if (u.stun > 0) { u.stun -= dt; continue; }
      u.cd -= dt;
      const mates = u.side === 0 ? allies : foes, opp = u.side === 0 ? foes : allies;
      let tgt = null, healing = false;
      if (u.heal) { const w = this.mostWounded(u, mates, u.side === 0 ? 0.85 : 0.75); if (w) { tgt = w; healing = true; } }
      if (!tgt) tgt = u.side === 0 ? this.heroTarget(u, opp) : this.enemyTarget(u, opp);
      if (tgt) {
        if (Math.abs(tgt.x - u.x) - u.r - tgt.r <= u.range) { if (u.cd <= 0) { u.cd = 1 / u.aspd; const sp = u.sprite; if (sp) { u.anim = 0; u.pending = { tgt, healing, opp, at: sp.anims.attack.length ? (sp.hit ? cum(sp)[sp.hit - 1] : 0) : sp.hitAt }; } else this.attack(u, tgt, healing, opp); } }
        else this.move(u, Math.sign(tgt.x - u.x), dt);
      } else if (u.side === 0) this.move(u, 1, dt);
      if (u.hero && (u.abilCd -= dt) <= 0 && this.ability(u, opp, mates)) u.abilCd = Math.max(3, 7 - 0.3 * S.abilLv[u.hero.id]);
    }
    if (allies.length) { const tx = Math.min(Math.max(front - W * 0.5, this.stageX), p.x + 220 - W * 0.8); this.camX += (tx - this.camX) * Math.min(1, dt * 2); }
    if (!allies.length && !this.nextAt) this.startStage(this.stageX); // wipe: retry stage
    this.cameras.main.scrollX = this.camX;
    for (const d of this.drops) { d.t += dt; if (d.t > 0.5) { S.gold += d.v; this.earned = (this.earned || 0) + d.v; d.done = true; } }
    this.drops = this.drops.filter(d => !d.done);
    this.units = this.units.filter(u => { if (u.dead) { this.pool.push(u); return false; } return true; });
  }
  bar(g, x, y, w, frac, col) { g.fillStyle(0x000000, 0.75).fillRect(x - w / 2 - 1, y - 1, w + 2, 5); g.fillStyle(col).fillRect(x - w / 2, y, w * Math.max(0, frac), 3); }
  drawEnemy(g, u) {
    const { x, y, r } = u; g.fillStyle(0x000000, 0.3).fillEllipse(x, y + r, r * 1.8, 6); g.fillStyle(u.color, u.idle ? 0.75 : 1); g.lineStyle(2, 0x120d0a, 1);
    switch (u.cls) {
      case 'knight': g.fillTriangle(x - r, y + r, x + r, y + r, x, y - r).strokeTriangle(x - r, y + r, x + r, y + r, x, y - r); break;
      case 'rogue': g.fillTriangle(x - r, y, x + r, y, x, y - r).fillTriangle(x - r, y, x + r, y, x, y + r); g.strokeTriangle(x - r, y, x, y - r, x + r, y); break;
      case 'archer': g.fillTriangle(x - r * 0.7, y + r, x + r * 0.7, y + r, x, y - r * 1.2).strokeTriangle(x - r * 0.7, y + r, x + r * 0.7, y + r, x, y - r * 1.2); g.lineStyle(2, 0xd8c8a0).lineBetween(x - 8, y + 2, x - 14, y - 18); break;
      case 'mage': g.fillCircle(x, y, r).strokeCircle(x, y, r); g.lineStyle(2, 0x2a0a3a).strokeCircle(x, y, r + 4); break;
      case 'cleric': g.fillRect(x - r, y - r, r * 2, r * 2).strokeRect(x - r, y - r, r * 2, r * 2); g.fillStyle(0x2a2a2a).fillRect(x - 2, y - r + 3, 4, r * 2 - 6).fillRect(x - r + 3, y - 2, r * 2 - 6, 4); break;
    }
    g.fillStyle(0xff2020).fillRect(x - 4, y - 3, 3, 3).fillRect(x + 1, y - 3, 3, 3);
    this.bar(g, x, y - r - 8, 22, u.hp / u.max, 0xff5555);
  }
  draw(dt) {
    const g = this.g, bg = this.bg, cx = this.camX, reg = REGIONS[region()], tt = this.time.now / 1000; bg.clear(); g.clear(); this.fx.clear();
    const lay = this.layers[REGION_BG[region()]];
    for (const nm in this.layers) for (const o of this.layers[nm]) o.ts.setVisible(this.layers[nm] === lay);
    if (lay && lay.length === 3) { for (const o of lay) o.ts.tilePositionX = Math.round(cx * PARALLAX[o.l]); }
    else {
    bg.fillStyle(reg.sky).fillRect(cx, 0, W, H); bg.fillStyle(reg.ground).fillRect(cx, GROUND - 160, W, H);
    for (let x = Math.floor(cx * 0.5 / 180) * 180; x < cx * 0.5 + W + 180; x += 180) { const px = x + cx * 0.5; bg.fillStyle(0x000000, 0.22).fillTriangle(px, GROUND - 160, px + 80, GROUND - 230 - (x % 7) * 7, px + 160, GROUND - 160); }
    bg.fillStyle(0x000000, 0.12); for (let x = Math.floor(cx / 90) * 90; x < cx + W + 90; x += 90) bg.fillRect(x, GROUND - 40 + (x % 3) * 10, 30, 3);
    }
    for (const h of HEROES) this.glyphs[h.id].setVisible(false);
    let si = 0;
    for (const u of this.units) {
      if (u.x < cx - 80 || u.x > cx + W + 80) continue;
      if (u.portal) {
        g.fillStyle(0x1a0830).fillEllipse(u.x, u.y, 80, 150); g.fillStyle(u.color, 0.6 + 0.3 * Math.sin(tt * 4)).fillEllipse(u.x, u.y, 56 + 6 * Math.sin(tt * 3), 126);
        if (u.shielded) g.lineStyle(4, 0x9fe8ff, 0.7).strokeEllipse(u.x, u.y, 100, 170);
        this.bar(g, u.x, u.y - 92, 100, u.hp / u.max, u.shielded ? 0x9fe8ff : 0xc070ff); continue;
      }
      if (u.sprite) {
        const sp = u.sprite, an = sp.anims, feet = u.y + u.r, sc = sp.scale * u.ss;
        const lunge = u.anim != null && !an.attack.length, lp = lunge ? Math.sin(Math.PI * Math.min(1, u.anim / sp.atkDur)) : 0;
        const fr = lunge ? an.walk[1] : u.anim != null ? atkFrame(sp, u.anim)
          : u.moving ? an.walk[Math.floor(((u.walk || 0) / (sp.stride * sp.scale * u.ss) + u.phase) * an.walk.length) % an.walk.length] : an.idle.length > 1 ? an.idle[Math.floor(tt / (sp.idleDur || 0.15) + u.phase) % an.idle.length] : an.idle[0];
        // feet locked to ground travel (frame advances with distance, one cycle per stride); small bob twice per cycle
        const bob = u.moving && u.anim == null ? -Math.abs(Math.sin(Math.PI * 2 * ((u.walk || 0) / (sp.stride * sp.scale * u.ss) + u.phase))) * 2 * sp.scale * u.ss : 0;
        const spr = this.spool[si] || (this.spool[si] = this.add.sprite(0, 0, sp.key, 0)); si++;
        if (spr.texture.key !== sp.key) spr.setTexture(sp.key);
        spr.setFrame(fr).setOrigin(sp.ox, sp.oy).setScale(sc * (1 + 0.12 * lp), sc * (1 - 0.1 * lp)).setFlipX(u.side === 1).setDepth(6 + u.y / 1000).setVisible(true)
          .setPosition(Math.round(u.x + (u.side ? -1 : 1) * 12 * lp), Math.round(feet + bob + (u.hero && an.idle.length === 1 && fr === an.idle[0] && !u.moving ? Math.sin(tt * 3) * 1.5 : 0)));
        if (lunge && lp > 0.8) spr.setTintFill(0xffffff); else if (u.tint) spr.setTint(u.tint); else spr.clearTint();
        if (u.idle) spr.setAlpha(0.85); else spr.setAlpha(1);
        g.fillStyle(0x000000, 0.35).fillEllipse(u.x, feet, u.hero ? 44 : u.r * 2.4, 9);
        const top = feet - sp.fh * sc * sp.oy - 4;
        if (u.hero) { this.bar(g, u.x, top - 6, 50, u.hp / u.max, 0x66ff66); const cd = Math.max(3, 7 - 0.3 * S.abilLv[u.hero.id]); this.bar(g, u.x, top, 50, 1 - Math.max(0, u.abilCd) / cd, 0x6fb6ff); }
        else this.bar(g, u.x, top, u.boss ? 100 : u.cls === 'knight' ? 36 : 28, u.hp / u.max, 0xff5555);
      } else if (u.hero) {
        g.fillStyle(0x000000, 0.3).fillEllipse(u.x, u.y + u.r, u.r * 2, 8); g.fillStyle(u.color).fillCircle(u.x, u.y, u.r); g.lineStyle(3, 0xf3e2b0, 0.9).strokeCircle(u.x, u.y, u.r);
        this.glyphs[u.hero.id].setPosition(u.x, u.y).setVisible(true);
        this.bar(g, u.x, u.y - 34, 50, u.hp / u.max, 0x66ff66);
        const cd = Math.max(3, 7 - 0.3 * S.abilLv[u.hero.id]); this.bar(g, u.x, u.y - 28, 50, 1 - Math.max(0, u.abilCd) / cd, 0x6fb6ff);
      } else if (u.boss) {
        g.fillStyle(0x000000, 0.35).fillEllipse(u.x, u.y + u.r, u.r * 2, 10); g.fillStyle(0x6a0c18).fillRect(u.x - u.r, u.y - u.r, u.r * 2, u.r * 2); g.lineStyle(4, u.color).strokeRect(u.x - u.r, u.y - u.r, u.r * 2, u.r * 2);
        g.fillStyle(0xffd700).fillTriangle(u.x - 22, u.y - u.r, u.x + 22, u.y - u.r, u.x, u.y - u.r - 20); g.fillStyle(0xff2020).fillRect(u.x - 14, u.y - 10, 8, 6).fillRect(u.x + 6, u.y - 10, 8, 6);
        this.bar(g, u.x, u.y - u.r - 30, 100, u.hp / u.max, 0xff4444);
      } else this.drawEnemy(g, u);
    }
    for (; si < this.spool.length; si++) this.spool[si].setVisible(false);
    for (const s of this.shots) { s.t -= dt; this.fx.lineStyle(2, s.c, 0.85).lineBetween(s.x1, s.y1, s.x2, s.y2); }
    this.shots = this.shots.filter(s => s.t > 0);
    for (const f of this.fxs) { f.t -= dt; if (f.rect) this.fx.fillStyle(f.c, 0.35).fillRect(f.x, f.y - 70, f.r, 110); else this.fx.fillStyle(f.c, 0.18).fillCircle(f.x, f.y, f.r * (1.2 - f.t)); }
    this.fxs = this.fxs.filter(f => f.t > 0);
    for (const d of this.drops) this.fx.fillStyle(0xffd700).fillCircle(d.x, d.y - d.t * 60, 6).lineStyle(1, 0x7a5a00).strokeCircle(d.x, d.y - d.t * 60, 6);
    const p = this.portal, lead = Math.max(this.stageX, ...this.units.filter(u => u.hero).map(u => u.x)), foes = this.units.filter(u => u.side === 1 && !u.portal).length;
    this.txt.setText(`${reg.name}   ·   Goblin Lv ${S.stage}   ·   Foes ${foes}\n`
      + `Rift ${p.dead ? 'DESTROYED' : fmt(p.hp) + ' HP' + (p.shielded ? ' (warded: slay the Warchief)' : '')}   ·   ${Math.max(0, Math.round((p.x - lead) / 10))}m ahead` + (isBossStage() ? '   ·   WARCHIEF STAGE' : ''));
  }
}
