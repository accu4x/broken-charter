# Broken Charter

A dark pixel-art guild-management roguelite. You run an adventurers' guild in a fallen empire,
take contracts, and fight speed-based turn battles with permadeath. Started 2026-10-08, delivered
as a single-file **Claude artifact**, built from this folder.

## Read first, in this order

1. `../AGENTS.md`: workspace rules and hard constraints. It is the system of record above this
   file.
2. This file.
3. `lore/WORLD.md`: the world, the factions, the regions.
4. `OPEN-ITEMS.md`: decisions so far, dated, the open questions, and the agreed next build.
5. `BACKLOG.md`: what comes after.
6. `docs/SPEC-progression-and-polish.md`: the progression and polish plan. Phase 1 (settings) and
   the five classes and Wolfkin ride with the guild-hall build (`OPEN-ITEMS.md` items 46–48).

## The rules that matter most

- **Ask, then plan, then build.** Ask Dan whatever is ambiguous, show him the plan, and wait for
  his OK before writing code or files.
- **No AI at runtime.** The game runs with no agent, model or server behind it (Dan,
  2026-10-08). Any future AI character is opt-in, ring-fenced against jailbreaks, and ships as a
  separate feature (`BACKLOG.md`).
- **No gambling.** No loot boxes, no random pulls, no pay-to-win. Recruits are shown before you
  pay for them.
- **Permadeath is the point.** A full party wipe loses everyone sent. Do not soften it without
  Dan's say-so; balance with the chapel, items and posts instead.
- **Own look, not Slate.** This game deliberately uses its own dark gothic palette and pixel
  fonts instead of the workspace Slate tokens (Dan chose "darker and grittier", 2026-10-08;
  OPEN-ITEMS item 9). Keep new UI inside `artifact/src/style.css`'s tokens.
- **Saves survive changes.** Players keep their guild across republishes. A change that breaks
  the save shape bumps `SAVE.v` and migrates, or says plainly that it starts fresh.
- **Build in slices.** Each change should be playable on its own. Dan plays it before the next.
- **Git:** a Cowork session never runs git (`../AGENTS.md`). Repo work belongs to Claude Code.
  This is a **public** repo: run the leak check before every push.

## Layout

| Path | What |
|---|---|
| `lore/WORLD.md` | Canon: the fallen empire, the charters, the factions, the regions. |
| `artifact/src/template.html` | Page shell: screens and windows. Starts with its charset line. |
| `artifact/src/style.css` | All styling. Tokens on `:root`; one dark look by design. |
| `artifact/src/util.js` | Shared helpers: `$`, `rnd`, `clamp`, `pick`, `store`, `mulberry`. |
| `artifact/src/sprites.js` | Pixel toolkit: hue-shifted ramps, shading, outlines, humanoid and troll rigs, pose frames. |
| `artifact/src/looks.js` | Starter heroes' and enemies' looks; the `SPR` sprite cache. |
| `artifact/src/bg.js` | Layered battle scenes (far, mid, foreground) and their lights. |
| `artifact/src/classes.js` | Classes and subclasses, races, quirks, materials, gear, items, posts, buildings. |
| `artifact/src/data.js` | Enemies, contracts, relics, status effects, map icons. |
| `artifact/src/audio.js` | WebAudio sound effects and chiptune music. |
| `artifact/src/hall.js` | The guild hall scene: the room, its stations (`STATIONS`), heroes in the hall, its lighting. |
| `artifact/src/guild.js` | Save and migration, the game day and Sleep, the station panels and the sheet, runs, the map, results. |
| `artifact/src/battle.js` | Battle engine, enemy AI, effects, lighting and rendering. |
| `artifact/src/boot.js` | Start-up, and `window.__bc` hooks for the smoke test. |
| `artifact/build.mjs` | Inlines everything, in load order, into `artifact/dist/broken-charter.html`. |
| `artifact/test/smoke.py` | Headless play-through: migrations, the hall and every station, Sleep and daily limits, a contract, a wipe. |
| `artifact/test/leak.test.cjs` | Private-phrase and secret scan of every publishable file. |
| `docs/SPEC-progression-and-polish.md` | The next planned work: milestones, balance tests, bosses, elites, polish. |
| `docs/showcase/` | Screenshots for Latent Mirror, captured from a real game. |

The scripts share one scope: `build.mjs` concatenates them inside a single function, so each
file can use names declared by the files before it. Keep the order in `build.mjs` in step.

## Build and test

```
node artifact/build.mjs                  # artifact/dist/broken-charter.html
python artifact/test/smoke.py            # headless play-through (Python Playwright)
node artifact/test/leak.test.cjs         # before every push; fails closed
node artifact/test/leak.test.cjs --dir artifact/dist
```

Publish `artifact/dist/broken-charter.html` to the artifact URL in `OPEN-ITEMS.md`, always to the
same URL so players keep their saves. The artifact declares no capabilities: progress lives in
the player's browser (`localStorage`, keys `bc.*`).

## Save keys

| Key | Holds |
|---|---|
| `bc.save` | The guild: roster, gold, materials, items, buildings, posts, dispatches, chapel, the fallen. `v` is the shape version; `day` is the game day. |
| `bc.run` | The contract in progress, so a reload resumes it. |
| `bc.auto`, `bc.speed`, `bc.music`, `bc.sfx`, `bc.tab` | Per-player settings. `bc.tab` is the open station's panel, or `null` when the sheet is closed. |
