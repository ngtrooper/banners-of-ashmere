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
- **Aldric v2 (clarity pass):** each full-resolution frame is box-filtered down to near-native pixel resolution (88 px tall), alpha is hardened (soft alpha kept only on the gold glow), and a 1 px dark outline plus a soft light rim are added. The result is upscaled ×2 nearest-neighbour to 178×176 cells, so he's about 140 px tall on screen. His collision radius grew to 30, and formation spacing behind the Knight is now 150/175/210 px (mage/cleric/archer).
- **Floating numbers** spawn above each unit's art and HP bar, using the sprite height. They drift up and outward and are smaller for regular hits (12 px; crits 20 px). Damage taken by heroes peels off to the side.
- **Sylwen Thornleaf** uses Franklin's chibi art: 5 frames (idle, draw, full draw, release with a glowing arrow, recover), made by `tools/make_sylwen_sprite.py`. The script crops inside each bordered box, which drops the border and labels. It removes the dark background by flood-filling dark regions connected to the edge plus large enclosed pockets (scipy), keeps the green glow with a soft alpha ramp, aligns frames to the feet and body centre, and resamples with Lanczos. The sheet is exported at 2× display size (118×176 cells) and shown at 0.5 scale with LINEAR texture filtering, so she stays smooth while Aldric's pixel art stays crisp under the global `pixelArt` setting. Her attack plays frames 2–5, and the green arrow fires on frame 4.
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
- M1.6 (done): Aldric clarity pass (larger, crisp integer scale, outline), damage numbers moved off the art.
- M1.5 (done): Sylwen chibi sprite and portrait (smooth filtering), arrow synced to the release frame.
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

## M1.7 — 16-bit art, goblins, linear stats

**Art.** Everything is now true 16-bit pixel art: a 32-colour palette per sheet, hard alpha, a 1 px dark outline and 2× nearest-neighbour scaling, built by `tools/make_sprites_16bit.py`. An image-generation tool wasn't available, so the sheets were made procedurally in code. Aldric and Sylwen are derived from their earlier sprites, and the goblins are drawn from scratch.
- Aldric `aldric_v3`: idle, walk ×4, attack ×5.
- Sylwen `sylwen_v3`: idle, walk ×4, attack ×4.
- Five goblin classes, all `goblin_*_v1`, each with walk ×4 and attack ×3: Brute (knight), Sneak (rogue), Slinger (archer), Hexer (mage) and Mender (cleric).
- Every 10th stage brings the **Goblin Warchief**, a scaled-up Brute.
- Units play their walk frames while moving and their idle frame while standing.

**Stats are linear for now:** `stat = base + growth × (level − 1)`.
- This covers HP, ATK, DEF, AtkSpd, MoveSpd, Range, Crit and CritDmg, with values set per class in `CLASS_STATS`.
- Goblins use the same formula, with level = stage number.
- There's no exponential stage or training multiplier. Exponential growth is planned for a later milestone, once the core loop is tuned.
- Costs: hero level `10 + 6n + 0.6n²`; ability rank `40 × rank²`.
- Gold per kill: `1 + 0.5 × (stage − 1)`.
- Stage length: `min(2000, 1100 + 45 × stage)` px.

**Attributes** are still in the code, but `ATTR_ENABLED = false` turns off their damage modifiers and hides their badges.

## M1.8 — Generated sprite sheets

The code-drawn walk cycles and goblins are replaced by generated pixel-art sheets. `tools/make_sprites_gen.py` processes them; the source JPGs stay local and are never committed. The pipeline:
- Frames are found with dilated connected components, plus a grid cut for the goblin sheet.
- The black background is removed, every frame shares a common foot baseline, and all cells in a sheet are the same size.
- Frames are box-downscaled to native resolution with hard alpha and a 1 px outline, then upscaled ×2 nearest-neighbour. No palette quantization, so the art isn't degraded.

Assets:
- `aldric_v4`: the original idle and 5 attack frames, plus the new 6-frame walk, matched to ~140 px.
- `sylwen_v4`: a 6-frame walk, and idle plus nock, draw, release (arrow fires here) and recover.
- `goblin_*_v2`: a 6-frame walk for each goblin, shown flipped to face left.
  - Regular goblins are ~62% of hero height and the Brute ~75%. The Warchief is a Brute at 1.25×.
  - Goblins have no attack frames yet. They attack with a lunge/squash tween and a white flash.
  - Hexer and Mender projectiles are purple and green.

## M1.9 — Test tools and smaller goblins

**Test tab** (developer helpers):
- **Reset** asks for confirmation, then replaces the save with a fresh one at stage 1.
- **Sim 30 min** fast-forwards 1800 s of the real battle logic with no rendering (`Battle.step` at a fixed 1/30 s timestep).
  - It runs in ~25 ms chunks through `setTimeout`, so the tab stays responsive.
  - Every simulated second it auto-buys the cheapest affordable upgrade (train, ability rank or recruit).
  - A popup then shows stages gained, gold earned and spent, purchases, and levels and ranks gained.

**Goblins at half size:** the sprites draw at 0.5 scale, which is exactly native resolution of the ×2 sheets, so no pixels are lost.
- Regular goblins are ~31% of hero height and the Brute ~37%. The Warchief is the Brute at 1.25×.
- Hitbox radii are halved. HP bars and damage numbers follow the scaled art.

## M1.10 — Animation timing and Summoning Altar (art pending)

- **Walk timing:** the walk frame advances with distance travelled (one cycle per sprite `stride`), so feet don't slide at any move speed. Units bob slightly twice per cycle.
- **Attack timing:** attacks use per-frame durations (`durs`: windup, swing, held impact, recover). The hit lands at the start of the `hit` frame.
- **Summoning Altar:** recruiting now opens an altar scene. A rune circle charges, a pillar of light bursts with a flash and sparks, then the hero card is revealed. It works for any hero with an `unlock` cost.
- **Art pending:** no image-generation tool was available, so these are still to come:
  - 8-frame walk sheets
  - goblin attack sheets
  - altar art
  - Kael and Isolde sprites
  - region parallax backgrounds

  The altar effect is CSS-only for now.

## M1.11 — Generated art pass 2

Franklin generated the sheets. `tools/make_sprites_gen2.py` and `tools/make_scenes_gen2.py` process them; the source JPGs stay local in `/workspace/src2`.

**Frame splitting:**
- Each row is split by column seams. Blobs that cross a seam are cut there, and the pieces go to the frame on the left, because effects trail to the right.
- Small stray specks near the feet line are removed.
- Every frame was checked by eye.

**Sprite sheets:**
- `aldric_v5`: original idle and attack, plus an 8-frame walk.
- `sylwen_v5`: idle and attack, plus an 8-frame walk.
- `kael_v1`: idle ×5, walk ×8, attack ×6 (violet slash).
- `isolde_v1`: idle ×4, walk ×8, cast ×6 (blue glow).
- `goblin_*_v3`: the 6-frame walk (the new goblin walk sheet still had 6 frames per row, so the old walk is kept) plus a 6-frame attack, which replaces the lunge tween.
- Hit frames: Brute 4, Sneak 4, Slinger 4, Hexer 3, Mender 4.
- Heroes with several idle frames loop them.

**Summoning Altar:** the generated altar scene, with the 8-frame burst played over the rune circle (screen blend). The hero's idle sprite is revealed at the brightest burst frame.

**Backgrounds:**
- Each region panorama is split into far, near and ground bands. They're mirror-tiled horizontally and scroll at 0.15, 0.45 and 1.0 of camera speed.
- The ground strip covers y 296–440. Hero lanes and goblin spawn heights are compressed so every unit's feet land on it.
- Dawnspire Ruins (region 5) reuses Greenvale until it gets its own art.

## M1.12 — Aldric walk v3

`aldric_v6` uses a new 8-frame walk with bigger strides and knee lifts, processed by `tools/make_aldric_walk3.py`.
- Frames are aligned on the head centre instead of the bounding box: sideways drift is at most 2 px at 2x scale.
- The feet share a common ground line, and the art's own up/down bob is kept, so the code bob is turned off for him (`artBob`).
- The sequence is a clean loop: contact, down, pass, up, then the same for the other leg.
- The stride is 90 px per cycle, so the planted foot keeps pace with the ground.
