# Banners of Ashmere: Design
Original idle hero-commander game. It takes genre inspiration from idle hero-collectors (e.g. Hordefall), but no code, art, names or text are copied. The tone is high fantasy (knights, noble houses, dragons, elves, horde clans), with no real-franchise names or characters.

## World
The realm of **Ashmere** is a patchwork of feuding noble houses. From the eastern wastes comes the **Gravemaw Horde**: ash-skinned clans led by Warlords, with drakes overhead. You lead the **Last Banner**, an alliance of houses, marching east region by region to break the Horde.
Regions (one per 10 stages): Greenvale Marches, Dunmoor Reach, Cinderfell, Frostspire Pass, and later the Thornwild, the Sunken Keep and the Maw.

## Core loop
1. Your band of heroes (no allied troops; heroes fight alone) marches right along a long side-scrolling battlefield and auto-fights hordes.
2. Kills drop gold. You spend it on **Training** (hero level: +12% HP/dmg each) and **Ability Rank** (ability damage +35% per rank, cooldown 7 s minus 0.3 s per rank, minimum 3 s).
3. Destroy the **Rift** at the end of each stage to advance. On every 10th stage a **Warlord** guards it.
4. If all heroes fall, the army regroups at the current stage.
5. **Prestige: "Raise the Banners"**. You reset stage, gold and hero/ability levels, and gain **Oathmarks** (+10% to everything per mark, based on best stage).

## Stage structure: the Rift
Each stage is a 1,200 px stretch of the scrolling map that ends at a **Gravemaw Rift**, a spawn portal. Enemies keep pouring out of it (3 + stage/4 every 0.8–2 s, with at most 120 alive). The Rift has its own HP bar (120 times the enemy HP for that stage). The heroes have to fight their way to it and destroy it to advance. On every 10th stage the Rift is **warded**: a **Warlord** comes out when the heroes get within about 700 px, and the Rift can't be damaged until the Warlord falls. If all the heroes die, the stage restarts from its beginning.

## Combat feedback
Every hero, enemy, Warlord and Rift has an HP bar. Floating damage numbers come from a pool of 70 recycled text objects: yellow for hero damage, larger orange for crits (15% chance, 2x damage), red for damage taken by heroes. The HUD shows the region, enemy level and its HP/damage, the foe count, the Rift's HP and the distance to it.

## Stat system (heroes and enemies)
Stats: **ATK, HP, DEF, Attack Speed, Move Speed, Range, Crit Chance, Crit Damage, Class, Attribute** (some classes also have Splash or Heal Power).
- **Damage formula:** hit = ATK × skill multiplier × attribute multiplier × (crit ? Crit Damage : 1), then damage = hit² ÷ (hit + DEF). Big hits mostly ignore armour, and small hits get soaked.
- **Attributes:** Fire › Nature › Frost › Fire, and Light ⇄ Shadow (each strong against the other). Advantage gives +30% damage, disadvantage gives −20%. Each region has a dominant attribute: 60% of its foes share it.
- **Hero scaling:** per level, ATK and HP ×1.12 and DEF ×1.10. Each Oathmark adds +10% ATK/HP/gold. **Enemy scaling:** ATK, HP and DEF ×1.13 per stage.

## Classes and formation
- **Knight**: slow front-line tank. Melee cleave hits up to 4 foes, and nearby enemies are taunted to attack it.
- **Rogue**: fast, high crit. Dives past the line to hit ranged and wounded foes.
- **Archer**: long-range single target.
- **Mage**: ranged; attacks splash 60% damage onto nearby foes.
- **Cleric**: heals the most wounded ally below 85% HP, otherwise attacks.
Formation: the Knight leads. The Mage, Cleric and Archer hold 120, 140 and 170 px behind the Knight and never advance past that line. The Rogue roams freely.

## Heroes (commanders)
| Hero | Class | Attribute | Ability |
|---|---|---|---|
| Ser Aldric Vane, Shield of House Vane | Knight | Light | Bulwark Charge: 6 nearest foes take 220% ATK, are knocked back and stunned for 1.2 s |
| Kael Duskmantle, Blade of the Hollow Court (recruit for 400 gold) | Rogue | Shadow | Shadowstep: teleports to the most dangerous ranged foe for a guaranteed 400% ATK crit |
| Sylwen Thornleaf, Warden of the Elderwood | Archer | Nature | Thornvolley: 10 foes take 180% ATK |
| Maera of the Ember Crown, Drake-bonded Pyromancer | Mage | Fire | Drakefire: up to 8 foes in a 180 px strip take 160% ATK |
| Sister Isolde Brightwater, Tidewarden of the Pale Shrine (recruit for 1,500 gold) | Cleric | Frost | Tidal Grace: heals all allies 25% max HP (up to 50% with rank) |
Upgrades: **Train** (level) and **Ability Rank** (+35% ability power per rank, cooldown 7 s − 0.3 s per rank, minimum 3 s). Planned: hero Sigils from War Chests, star ranks, house set bonuses.

## Enemies (Gravemaw Horde)
Every enemy uses the same stat and class rules as the heroes:
- Gravemaw Brute (Knight: tank, cleaves 2).
- Ashfang Raider (Rogue: fast, dives on the hero furthest back). Appears from stage 3.
- Bonespear Thrower (Archer: ranged).
- Hexcaller (Mage: splash). Appears from stage 5.
- Rotmender (Cleric: heals other foes). Appears from stage 8.
**Warlord** (every 10th stage): a Brute with 60× HP, 5× ATK and 2× DEF that wards the Rift.
**Pre-placed packs:** enemy groups sit every 320 px along the road (3 + stage/4 per pack, maximum 10) and wake when heroes come near, so there's no empty walk. The Rift adds 2 + stage/5 more every 1–2.2 s once the heroes are within 1,100 px. At most 140 enemies are alive at once.

## Art
- **Ser Aldric Vane** uses Franklin's pixel-art sprite: a 6-frame sheet `public/sprites/aldric.png` (83×86 cells) plus `aldric-portrait.png`, made from his source sheet by `tools/make_aldric_sprite.py`. The script splits frames with min-brightness seams, turns the dark background transparent with a soft threshold that keeps the gold glow, aligns frames to a common foot baseline and body centre, and scales with nearest-neighbour.
- In the game: frame 1 is idle with a subtle bob. Each basic attack (and Bulwark Charge) plays frames 2–6 at 80 ms per frame, and the hit lands on frame 4 (impact). Phaser runs with `pixelArt`/`roundPixels`.
- Every other unit still uses procedural shapes until its art arrives.

## UI
- A top resource bar shows Gold, Oathmarks, Stage/best, the region and a 1×/2× speed toggle.
- The battlefield is framed and has its own HUD showing the region attribute, enemy level, foe count, Rift HP and distance.
- A bottom tab bar switches between **Heroes** (cards with attribute-coloured portraits, class/attribute badges, live HP bar, Train / Ability / Recruit buttons), **Codex** (attribute cycle and enemy stat table for the current stage) and **Banners** (prestige).
- Clicking a hero opens a **stat sheet** with every stat, the next-level preview, DEF reduction against the current enemies, ability details, class and attribute notes, and upgrade buttons.
The look is a dark-fantasy palette (bronze and gold borders, serif headings). It is original CSS, and only the general layout and feel were inspired by other idle games.

## Progression and meta (planned)
- Oathmarks are the prestige currency. An Oath Tree for permanent perks.
- **Heirlooms**: equippable artifacts, forged with Starsteel.
- **Sieges**: a side mode that pays forge materials.
- **Dailies**: march orders and a free war chest. No monetization.
- Offline earnings.

## Tech
Phaser 3 + Vite with `base: './'` for GitHub Pages. A DOM UI panel sits over the canvas, saves use localStorage (`ashmere-save-v1`), units are pooled and drawn in one Graphics pass, and everything uses procedural placeholder shapes.

## Milestones
- M1.4 (done): Ser Aldric pixel-art sprite and portrait, attack animation synced to the hit.
- M1.3 (done): full stat system (DEF formula, attributes, crits), 5 classes with distinct behaviour and formation, 2 new heroes, 5 enemy classes, pre-placed packs, polished UI with tabs and hero stat sheet, v1/v2 save migration.
- M1.2 (done): Rift stage endpoints, Warlords guarding warded Rifts, HP bars and pooled damage numbers, Drakefire nerf and ability rebalance.
- M1.1 (done): troops removed (old saves migrated), units 2x bigger, heroes rebalanced with cleave and Ability Rank.
- M1 (done): prototype with scrolling field, 3 heroes, hordes, gold, upgrades, Warlord every 10 stages, prestige, save.
- M2: offline gains, hero collection and War Chests, Command Auras, number balancing.
- M3: art pass (sprites), sound, more regions/enemies, Heirlooms.
- M4: Sieges, dailies, Oath Tree, GitHub Pages deploy.

## Different from Hordefall
The battle is an army battle across one long, scrolling map rather than a small fixed team. A few oversized heroes cleave through huge hordes, and the setting, names and prestige systems are all original.
