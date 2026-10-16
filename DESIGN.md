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

## Heroes (commanders)
Heroes are the whole army: big, durable units whose basic attacks **cleave** (hitting 2–4 foes), each with an auto-cast ability. Planned: Command Auras that buff the other heroes, and more hero slots unlocked as you collect heroes.
- **Ser Aldric Vane** (House Vane, Shieldlord): Bulwark Charge hits 6 foes for 2.2x damage, knocks them back and stuns them for 1.2 s.
- **Sylwen Thornleaf** (Elf Warden): Thornvolley hits 10 foes for 1.8x damage.
- **Maera of the Ember Crown** (Drake Rider): Drakefire scorches up to 8 foes within 180 px ahead for 1.6x damage (nerfed from unlimited foes within 300 px for 4x).
Planned collection: hero **Sigils** come from **War Chests** and unlock and rank heroes up (stars). Heroes belong to houses, and set bonuses apply when several heroes from the same house are fielded.

## Enemies
Grunts, raiders, brutes (planned: shamans, wolf riders, drakes) and Warlords. Hordes: 30 + 5 per stage per wave (up to 180), with up to 120 alive at once. All units are drawn at about 2x the earlier size.

## Progression and meta (planned)
- Oathmarks are the prestige currency. An Oath Tree for permanent perks.
- **Heirlooms**: equippable artifacts, forged with Starsteel.
- **Sieges**: a side mode that pays forge materials.
- **Dailies**: march orders and a free war chest. No monetization.
- Offline earnings.

## Tech
Phaser 3 + Vite with `base: './'` for GitHub Pages. A DOM UI panel sits over the canvas, saves use localStorage (`ashmere-save-v1`), units are pooled and drawn in one Graphics pass, and everything uses procedural placeholder shapes.

## Milestones
- M1.2 (done): Rift stage endpoints, Warlords guarding warded Rifts, HP bars and pooled damage numbers, Drakefire nerf and ability rebalance.
- M1.1 (done): troops removed (old saves migrated), units 2x bigger, heroes rebalanced with cleave and Ability Rank.
- M1 (done): prototype with scrolling field, 3 heroes, hordes, gold, upgrades, Warlord every 10 stages, prestige, save.
- M2: offline gains, hero collection and War Chests, Command Auras, number balancing.
- M3: art pass (sprites), sound, more regions/enemies, Heirlooms.
- M4: Sieges, dailies, Oath Tree, GitHub Pages deploy.

## Different from Hordefall
The battle is an army battle across one long, scrolling map rather than a small fixed team. A few oversized heroes cleave through huge hordes, and the setting, names and prestige systems are all original.
