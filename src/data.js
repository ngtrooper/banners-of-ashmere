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
export const attrMult = (a, d) => ADV[a] === d ? 1.3 : ADV[d] === a ? 0.8 : 1;

export const CLASSES = {
  knight: { name: 'Knight', icon: '♜', form: 0, desc: 'Front-line tank. Melee cleave hits up to 4 foes, and enemies near the Knight are taunted to attack it.' },
  rogue: { name: 'Rogue', icon: '†', form: 0, desc: 'Fast, high crit. Dives past the front line to pick off ranged and wounded foes.' },
  archer: { name: 'Archer', icon: '➶', form: 170, desc: 'Long-range single-target shots from the back line.' },
  mage: { name: 'Mage', icon: '✦', form: 120, desc: 'Ranged attacks that splash 60% damage onto nearby foes.' },
  cleric: { name: 'Cleric', icon: '✚', form: 140, desc: 'Heals the most wounded ally, and attacks when everyone is healthy.' },
};

export const HEROES = [
  { id: 'aldric', name: 'Ser Aldric Vane', title: 'Shield of House Vane', cls: 'knight', attr: 'light', unlock: 0,
    sprite: { key: 'aldric', url: './sprites/aldric.png', fw: 83, fh: 86, frames: 6, scale: 1, ox: 0.437, oy: 0.987, hitFrame: 3, frameDur: 0.08 }, portrait: './sprites/aldric-portrait.png',
    base: { atk: 60, hp: 2600, def: 14, aspd: 0.8, move: 80, range: 40, crit: 0.05, critDmg: 1.5 },
    abil: { name: 'Bulwark Charge', text: 'Slams the 6 nearest foes for 220% ATK, knocking them back and stunning them for 1.2 s.' } },
  { id: 'kael', name: 'Kael Duskmantle', title: 'Blade of the Hollow Court', cls: 'rogue', attr: 'shadow', unlock: 400,
    base: { atk: 55, hp: 1300, def: 6, aspd: 1.8, move: 150, range: 28, crit: 0.35, critDmg: 2.0 },
    abil: { name: 'Shadowstep', text: 'Vanishes and reappears beside the most dangerous ranged foe nearby, striking a guaranteed 400% ATK crit.' } },
  { id: 'sylwen', name: 'Sylwen Thornleaf', title: 'Warden of the Elderwood', cls: 'archer', attr: 'nature', unlock: 0,
    // painted (non-pixel) art: exported at 2x, shown at 0.5 with LINEAR filtering
    sprite: { key: 'sylwen', url: './sprites/sylwen.png', fw: 112, fh: 176, frames: 5, scale: 0.5, linear: true, ox: 0.399, oy: 0.96, hitFrame: 3, frameDur: 0.08, shotColor: 0x7dff6a, shotY: 50 }, portrait: './sprites/sylwen-portrait.png',
    base: { atk: 95, hp: 1200, def: 4, aspd: 1.0, move: 95, range: 340, crit: 0.15, critDmg: 1.75 },
    abil: { name: 'Thornvolley', text: 'Looses thorned arrows at the 10 nearest foes for 180% ATK each.' } },
  { id: 'maera', name: 'Maera of the Ember Crown', title: 'Drake-bonded Pyromancer', cls: 'mage', attr: 'fire', unlock: 0,
    base: { atk: 70, hp: 1300, def: 4, aspd: 0.6, move: 90, range: 240, crit: 0.1, critDmg: 1.6, splash: 70 },
    abil: { name: 'Drakefire', text: 'Her drake scorches up to 8 foes in a 180 px strip for 160% ATK.' } },
  { id: 'isolde', name: 'Sister Isolde Brightwater', title: 'Tidewarden of the Pale Shrine', cls: 'cleric', attr: 'frost', unlock: 1500,
    base: { atk: 40, hp: 1500, def: 8, aspd: 0.8, move: 90, range: 220, crit: 0.05, critDmg: 1.5, heal: 2.2 },
    abil: { name: 'Tidal Grace', text: 'Restores 25% max HP to every ally (scales with rank, up to 50%).' } },
];

export const ENEMIES = {
  brute: { id: 'brute', name: 'Gravemaw Brute', cls: 'knight', atk: 9, hp: 45, def: 8, aspd: 0.7, move: 38, range: 22, crit: 0.05, r: 15, w: 30, from: 1 },
  raider: { id: 'raider', name: 'Ashfang Raider', cls: 'rogue', atk: 8, hp: 20, def: 3, aspd: 1.4, move: 85, range: 18, crit: 0.2, r: 10, w: 20, from: 3 },
  spear: { id: 'spear', name: 'Bonespear Thrower', cls: 'archer', atk: 9, hp: 18, def: 2, aspd: 0.8, move: 42, range: 200, crit: 0.1, r: 11, w: 20, from: 1 },
  hex: { id: 'hex', name: 'Hexcaller', cls: 'mage', atk: 7, hp: 18, def: 2, aspd: 0.5, move: 40, range: 180, crit: 0.05, splash: 50, r: 11, w: 15, from: 5 },
  mender: { id: 'mender', name: 'Rotmender', cls: 'cleric', atk: 4, hp: 22, def: 3, aspd: 0.6, move: 40, range: 160, crit: 0.05, heal: 1.5, r: 10, w: 10, from: 8 },
};

export const REGIONS = [
  { name: 'Greenvale Marches', attr: 'nature', sky: 0x2b3d5a, ground: 0x3d5a2c },
  { name: 'Dunmoor Reach', attr: 'shadow', sky: 0x2a2440, ground: 0x4a4430 },
  { name: 'Cinderfell', attr: 'fire', sky: 0x4a2b2b, ground: 0x4a3326 },
  { name: 'Frostspire Pass', attr: 'frost', sky: 0x24323a, ground: 0x46525a },
  { name: 'Dawnspire Ruins', attr: 'light', sky: 0x3d3a52, ground: 0x5a5440 },
];
