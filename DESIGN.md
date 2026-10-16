# Banners of Ashmere: Design
Original idle hero-commander game. It takes genre inspiration from idle hero-collectors (e.g. Hordefall), but no code, art, names or text are copied. The tone is high fantasy (knights, noble houses, dragons, elves, horde clans), with no real-franchise names or characters.

## World
The realm of **Ashmere** is a patchwork of feuding noble houses. From the eastern wastes comes the **Gravemaw Horde**: ash-skinned clans led by Warlords, with drakes overhead. You lead the **Last Banner**, an alliance of houses, marching east region by region to break the Horde.
Regions (one per 10 stages): Greenvale Marches, Dunmoor Reach, Cinderfell, Frostspire Pass, and later the Thornwild, the Sunken Keep and the Maw.

## Core loop
1. Your band of heroes (no allied troops; heroes fight alone) marches right along a long side-scrolling battlefield and auto-fights hordes.
2. Kills drop gold. You spend it on **Training** (hero level: +12% HP/dmg each) and **Ability Rank** (ability damage +50% per rank, shorter cooldown).
3. Every 10th stage is a **Warlord** boss. You challenge it when ready, and beating it lets you advance.
4. If all heroes fall, the army regroups at the current stage.
5. **Prestige: "Raise the Banners"**. You reset stage, gold and hero/ability levels, and gain **Oathmarks** (+10% to everything per mark, based on best stage).

## Heroes (commanders)
Heroes are the whole army: big, durable units whose basic attacks **cleave** (hitting 2–4 foes), each with an auto-cast ability. Planned: Command Auras that buff the other heroes, and more hero slots unlocked as you collect heroes.
- **Ser Aldric Vane** (House Vane, Shieldlord): Bulwark Charge knocks back and stuns the front line.
- **Sylwen Thornleaf** (Elf Warden): Thornvolley hits 15 foes.
- **Maera of the Ember Crown** (Drake Rider): Drakefire sends a burning wave.
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
- M1.1 (done): troops removed (old saves migrated), units 2x bigger, heroes rebalanced with cleave and Ability Rank.
- M1 (done): prototype with scrolling field, 3 heroes, hordes, gold, upgrades, Warlord every 10 stages, prestige, save.
- M2: offline gains, hero collection and War Chests, Command Auras, number balancing.
- M3: art pass (sprites), sound, more regions/enemies, Heirlooms.
- M4: Sieges, dailies, Oath Tree, GitHub Pages deploy.

## Different from Hordefall
The battle is an army battle across one long, scrolling map rather than a small fixed team. A few oversized heroes cleave through huge hordes, and the setting, names and prestige systems are all original.
