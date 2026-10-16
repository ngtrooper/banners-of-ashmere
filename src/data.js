// Banners of Ashmere: game data. Everything here is original.
export const ATTRS = {
  fire: { name: 'Fire', icon: '✹', color: 0xff6a2a, css: '#ff6a2a' },
  frost: { name: 'Frost', icon: '❄', color: 0x6fd3ff, css: '#6fd3ff' },
  nature: { name: 'Nature', icon: '❦', color: 0x5fd35f, css: '#5fd35f' },
  light: { name: 'Light', icon: '☀', color: 0xffe27a, css: '#ffe27a' },
  shadow: { name: 'Shadow', icon: '☾', color: 0xa07bff, css: '#a07bff' },
};
export const ATTR_KEYS = Object.keys(ATTRS);
// Fire > Nature > Frost > Fire; Light and Shadow wound each other
export const ADV = { fire: 'nature', nature: 'frost', frost: 'fire', light: 'shadow', shadow: 'light' };
// Attribute damage modifiers are switched OFF for now (Franklin is deciding); the system stays in code.
export const ATTR_ENABLED = false;
export const attrMult = (a, d) => !ATTR_ENABLED ? 1 : ADV[a] === d ? 1.3 : ADV[d] === a ? 0.8 : 1;

// LINEAR stats: stat(level) = base + growth * (level - 1). Crit values are fractions (0.05 = 5%).
// (Exponential/multiplicative scaling is planned for later.)
export const STAT_KEYS = ['hp', 'atk', 'def', 'aspd', 'move', 'range', 'crit', 'critDmg'];
export const STAT_NAMES = { hp: 'HP', atk: 'ATK', def: 'DEF', aspd: 'Attack Speed', move: 'Move Speed', range: 'Range', crit: 'Crit Chance', critDmg: 'Crit Damage' };
const st = (o) => Object.fromEntries(STAT_KEYS.map(k => [k, { base: o[k][0], growth: o[k][1] }]));
export const CLASS_STATS = {
  knight: st({ hp: [12, 1.0], atk: [9, 0.6], def: [3, 0.3], aspd: [0.8, 0.005], move: [80, 0], range: [40, 0], crit: [0.05, 0.001], critDmg: [1.5, 0.005] }),
  rogue: st({ hp: [8, 0.6], atk: [7, 0.6], def: [1.5, 0.15], aspd: [1.6, 0.01], move: [140, 0], range: [28, 0], crit: [0.3, 0.002], critDmg: [2.0, 0.01] }),
  archer: st({ hp: [7, 0.5], atk: [10, 0.7], def: [1, 0.1], aspd: [1.0, 0.01], move: [95, 0], range: [330, 1], crit: [0.15, 0.0015], critDmg: [1.75, 0.005] }),
  mage: st({ hp: [7, 0.5], atk: [8, 0.6], def: [1, 0.1], aspd: [0.6, 0.005], move: [90, 0], range: [240, 1], crit: [0.1, 0.001], critDmg: [1.6, 0.005] }),
  cleric: st({ hp: [9, 0.7], atk: [4, 0.4], def: [2, 0.2], aspd: [0.8, 0.005], move: [90, 0], range: [220, 0], crit: [0.05, 0.0005], critDmg: [1.5, 0] }),
};
export const statsAt = (table, lv) => Object.fromEntries(STAT_KEYS.map(k => [k, table[k].base + table[k].growth * (lv - 1)]));

export const CLASSES = {
  knight: { name: 'Knight', icon: '♜', form: 0, desc: 'Front-line tank. Melee cleave hits up to 4 foes, and enemies near the Knight are taunted to attack it.' },
  rogue: { name: 'Rogue', icon: '†', form: 0, desc: 'Fast, high crit. Dives past the front line to pick off ranged and wounded foes.' },
  archer: { name: 'Archer', icon: '➶', form: 210, desc: 'Long-range single-target shots from the back line.' },
  mage: { name: 'Mage', icon: '✦', form: 150, desc: 'Ranged attacks that splash 60% damage onto nearby foes.' },
  cleric: { name: 'Cleric', icon: '✚', form: 175, desc: 'Heals the most wounded ally, and attacks when everyone is healthy.' },
};

export const HEROES = [
  { id: 'aldric', name: 'Ser Aldric Vane', title: 'Shield of House Vane', cls: 'knight', attr: 'light', unlock: 0,
    sprite: { key: 'aldric', url: './sprites/aldric_v6.png', fw: 184, fh: 184, frames: 14, scale: 1, ox: 0.565, oy: 0.973, anims: { idle: [0], walk: [6, 7, 8, 9, 10, 11, 12, 13], attack: [1, 2, 3, 4, 5] }, hit: 2, frameDur: 0.08, durs: [0.1, 0.07, 0.06, 0.12, 0.14], stride: 90, artBob: true }, portrait: './sprites/aldric-portrait_v6.png',
    abil: { name: 'Bulwark Charge', text: 'Slams the 6 nearest foes for 220% ATK, knocking them back and stunning them for 1.2 s.' } },
  { id: 'kael', name: 'Kael Duskmantle', title: 'Blade of the Hollow Court', cls: 'rogue', attr: 'shadow', unlock: 120,
    sprite: { key: 'kael', url: './sprites/kael_v1.png', fw: 234, fh: 164, frames: 19, scale: 1, ox: 0.504, oy: 0.97, anims: { idle: [0, 1, 2, 3, 4], walk: [5, 6, 7, 8, 9, 10, 11, 12], attack: [13, 14, 15, 16, 17, 18] }, hit: 3, frameDur: 0.07, durs: [0.07, 0.06, 0.06, 0.08, 0.08, 0.1], idleDur: 0.16, stride: 110 }, portrait: './sprites/kael-portrait_v1.png',
    abil: { name: 'Shadowstep', text: 'Vanishes and reappears beside the most dangerous ranged foe nearby, striking a guaranteed 400% ATK crit.' } },
  { id: 'sylwen', name: 'Sylwen Thornleaf', title: 'Warden of the Elderwood', cls: 'archer', attr: 'nature', unlock: 0,
    sprite: { key: 'sylwen', url: './sprites/sylwen_v5.png', fw: 142, fh: 152, frames: 13, scale: 1, ox: 0.366, oy: 0.967, anims: { idle: [0], walk: [5, 6, 7, 8, 9, 10, 11, 12], attack: [0, 1, 2, 3, 4] }, hit: 3, frameDur: 0.08, durs: [0.07, 0.1, 0.13, 0.08, 0.12], stride: 104, shotColor: 0x7dff6a, shotY: 82 }, portrait: './sprites/sylwen-portrait_v5.png',
    abil: { name: 'Thornvolley', text: 'Looses thorned arrows at the 10 nearest foes for 180% ATK each.' } },
  { id: 'maera', name: 'Maera of the Ember Crown', title: 'Drake-bonded Pyromancer', cls: 'mage', attr: 'fire', unlock: 0, splash: 70,
    abil: { name: 'Drakefire', text: 'Her drake scorches up to 8 foes in a 180 px strip for 160% ATK.' } },
  { id: 'isolde', name: 'Sister Isolde Brightwater', title: 'Tidewarden of the Pale Shrine', cls: 'cleric', attr: 'frost', unlock: 300, heal: 2.2,
    sprite: { key: 'isolde', url: './sprites/isolde_v1.png', fw: 152, fh: 172, frames: 18, scale: 1, ox: 0.395, oy: 0.971, anims: { idle: [0, 1, 2, 3], walk: [4, 5, 6, 7, 8, 9, 10, 11], attack: [12, 13, 14, 15, 16, 17] }, hit: 3, frameDur: 0.08, durs: [0.08, 0.08, 0.1, 0.12, 0.1, 0.1], idleDur: 0.2, stride: 96 }, portrait: './sprites/isolde-portrait_v1.png',
    abil: { name: 'Tidal Grace', text: 'Restores 25% max HP to every ally (scales with rank, up to 50%).' } },
];

// Goblin warband (placeholder roster; region-themed enemies come later). Enemy level = stage.
export const ENEMIES = {
  brute: { id: 'brute', name: 'Goblin Brute', cls: 'knight', r: 10, w: 30, from: 1, sprite: { key: 'goblin_brute', url: './sprites/goblin_brute_v3.png', fw: 156, fh: 116, frames: 12, scale: 0.5, ox: 0.474, oy: 0.957, anims: { idle: [0], walk: [0, 1, 2, 3, 4, 5], attack: [6, 7, 8, 9, 10, 11] }, hit: 3, frameDur: 0.09, stride: 44 },
    stats: st({ hp: [9, 1.2], atk: [2, 0.4], def: [1.5, 0.25], aspd: [0.7, 0], move: [38, 0], range: [24, 0], crit: [0.05, 0], critDmg: [1.5, 0] }) },
  sneak: { id: 'sneak', name: 'Goblin Sneak', cls: 'rogue', r: 7, w: 20, from: 3, sprite: { key: 'goblin_sneak', url: './sprites/goblin_sneak_v3.png', fw: 166, fh: 96, frames: 12, scale: 0.5, ox: 0.458, oy: 0.948, anims: { idle: [0], walk: [0, 1, 2, 3, 4, 5], attack: [6, 7, 8, 9, 10, 11] }, hit: 3, frameDur: 0.09, stride: 44 },
    stats: st({ hp: [4, 0.6], atk: [1.6, 0.35], def: [0.5, 0.1], aspd: [1.4, 0], move: [85, 0], range: [18, 0], crit: [0.2, 0], critDmg: [1.5, 0] }) },
  slinger: { id: 'slinger', name: 'Goblin Slinger', cls: 'archer', r: 7, w: 20, from: 1, sprite: { key: 'goblin_slinger', url: './sprites/goblin_slinger_v3.png', fw: 160, fh: 100, frames: 12, scale: 0.5, ox: 0.388, oy: 0.95, anims: { idle: [0], walk: [0, 1, 2, 3, 4, 5], attack: [6, 7, 8, 9, 10, 11] }, hit: 3, frameDur: 0.09, stride: 44 },
    stats: st({ hp: [3, 0.5], atk: [1.4, 0.3], def: [0.5, 0.1], aspd: [0.8, 0], move: [42, 0], range: [200, 0], crit: [0.1, 0], critDmg: [1.5, 0] }) },
  hexer: { id: 'hexer', name: 'Goblin Hexer', cls: 'mage', r: 7, w: 15, from: 5, splash: 50, sprite: { key: 'goblin_hexer', url: './sprites/goblin_hexer_v3.png', fw: 144, fh: 98, frames: 12, scale: 0.5, ox: 0.403, oy: 0.949, anims: { idle: [0], walk: [0, 1, 2, 3, 4, 5], attack: [6, 7, 8, 9, 10, 11] }, hit: 2, frameDur: 0.09, stride: 44, shotColor: 0xb44dff, shotY: 62 },
    stats: st({ hp: [3, 0.5], atk: [1.2, 0.3], def: [0.5, 0.1], aspd: [0.5, 0], move: [40, 0], range: [180, 0], crit: [0.05, 0], critDmg: [1.5, 0] }) },
  mender: { id: 'mender', name: 'Goblin Mender', cls: 'cleric', r: 7, w: 10, from: 8, heal: 1.5, sprite: { key: 'goblin_mender', url: './sprites/goblin_mender_v3.png', fw: 104, fh: 98, frames: 12, scale: 0.5, ox: 0.404, oy: 0.949, anims: { idle: [0], walk: [0, 1, 2, 3, 4, 5], attack: [6, 7, 8, 9, 10, 11] }, hit: 3, frameDur: 0.09, stride: 44, shotColor: 0x8dff4a, shotY: 66 },
    stats: st({ hp: [4, 0.6], atk: [0.6, 0.15], def: [0.5, 0.1], aspd: [0.6, 0], move: [40, 0], range: [160, 0], crit: [0.05, 0], critDmg: [1.5, 0] }) },
};
export const BOSS = { name: 'Goblin Warchief', hp: 25, atk: 3, def: 2, scale: 1.25 };

// parallax layers per region (y = top of layer in battle space; far/near/ground scroll at 0.15/0.45/1.0 of the camera)
export const BACKDROPS = {"greenvale": {"far": {"y": -50, "w": 1588, "h": 224}, "near": {"y": 168, "w": 1588, "h": 136}, "ground": {"y": 296, "w": 2560, "h": 144}}, "dunmoor": {"far": {"y": -42, "w": 1588, "h": 234}, "near": {"y": 186, "w": 1588, "h": 118}, "ground": {"y": 296, "w": 2328, "h": 144}}, "cinderfell": {"far": {"y": -58, "w": 1588, "h": 246}, "near": {"y": 182, "w": 1588, "h": 122}, "ground": {"y": 296, "w": 2844, "h": 144}}, "frostspire": {"far": {"y": -50, "w": 1588, "h": 252}, "near": {"y": 196, "w": 1588, "h": 108}, "ground": {"y": 296, "w": 2560, "h": 144}}};
export const REGION_BG = ['greenvale', 'dunmoor', 'cinderfell', 'frostspire', 'greenvale'];
export const REGIONS = [
  { name: 'Greenvale Marches', attr: 'nature', sky: 0x2b3d5a, ground: 0x3d5a2c },
  { name: 'Dunmoor Reach', attr: 'shadow', sky: 0x2a2440, ground: 0x4a4430 },
  { name: 'Cinderfell', attr: 'fire', sky: 0x4a2b2b, ground: 0x4a3326 },
  { name: 'Frostspire Pass', attr: 'frost', sky: 0x24323a, ground: 0x46525a },
  { name: 'Dawnspire Ruins', attr: 'light', sky: 0x3d3a52, ground: 0x5a5440 },
];
