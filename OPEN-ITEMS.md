# Open items

Decisions, tech debt and open questions for Broken Charter. Ideas live in `BACKLOG.md`.
Keep entries dated. **Correct, don't overwrite:** when a decision is superseded, mark it with the
date and a pointer to what replaced it. Numbers are stable IDs, not priority.

_Last updated: 2026-10-09 (repo pushed, item 13; next build agreed, items 14–16; items 17 and 18
resolved; board refresh set, item 15). Before that:
2026-10-08 (items 1–12, the first three builds)._

## The artifact

| Name | URL | Capabilities | Sharing |
|---|---|---|---|
| **Broken Charter** | https://claude.ai/artifact/4kQSr4xjDXpF7DrSCUAZGX | none | Private; Dan shares it by link when he chooses (item 12) |

- Built from `artifact/src/` by `node artifact/build.mjs`. Always republish to this URL: player
  saves are tied to it.
- **Design notes (brainstorm):** the Claude Docs page "Guild of the Broken Charter — Design
  Notes", https://claude.ai/code/artifact/e728d11a-a62a-44b7-b9b4-40dde67b5136. It holds the
  first brainstorm in prose. This file is the record; where they disagree, this file wins.

## Decision log

1. **2026-10-08: Origin.** Started as a brainstorm about retro JRPGs: "you were running a guild
   for adventurers and you have to accept contracts and send adventurers out." A fantasy setting,
   separate from Kestrel Nine.
2. **2026-10-08: Game loop.** The repeatable loop of hero-collector games (Summoners War and
   similar) without the gambling, made roguelite: runs are expeditions; the guild persists.
3. **2026-10-08: No AI at runtime.** Dan: "let's make it so the game itself doesn't need an agent
   to run." Everything ships as static content and deterministic code. AI-voiced rivals stay a
   backlog idea, opt-in and ring-fenced.
4. **2026-10-08: The world.** The **fallen empire's charters** are the spine (Dan's pick). The
   other two seeds are woven in: the **shifting wilds** explain fresh maps each run, and the
   **returning darkness** (the Necromancer's cycles) gives seasons. Full text: `lore/WORLD.md`.
5. **2026-10-08: Threats.** Undead under a Necromancer, goblins, trolls, and **lizardkin** (Dan
   replaced bugbears). Each rewards a different party: holy beats undead, area damage beats
   goblin swarms, fire stops troll regeneration, scouts stop lizardkin ambushes. Lizardkin are
   morally grey: the marshes were theirs before the empire drained them.
6. **2026-10-08: Classes.** Dan's design: four base classes (warrior, thief, mage, priest), each
   with three subclasses borrowing from one of the others. **As built** the game has six base
   classes (adding ranger and druid) with three subclasses each, 18 in all, chosen at level 3.
   Races: human, elf, dwarf, orc. Whether to keep six or return to four is open (item 19).
7. **2026-10-08: Combat.** A party of **five with a leader** whose bonus covers the party;
   **speed-based** turn order; **branching** room maps (Dan's three picks). Auto-battle is optional,
   plays decently but ignores counters, and never pays less. Three settings to start: crypt,
   forest, marsh.
8. **2026-10-08: First look.** `[superseded 2026-10-08 by item 9]` 8-bit pixel art, smooth and
   modern with crisp animation.
9. **2026-10-08: Look, darker and grittier.** Dan: "Let's go darker and grittier... sprite size
   32 pixels is fine... all of them at once." Sharp 32px sprites with hue-shifted shading and
   pose frames, three-layer scenes with depth blur, dynamic lighting with rim light and bloom,
   per-setting colour grade, film grain; iron-and-brass UI with Jacquard 12 titles. **A deliberate
   exception to the workspace Slate tokens** (`../AGENTS.md`, Design system): Dan asked for this
   look by name, as Kestrel Nine's CRT screen keeps its own phosphor colours.
10. **2026-10-08: Balance.** Enemy attack ×1.45 and health ×1.2 (`FOE_ATK`, `FOE_HP` in
    `guild.js`), and +10% per map layer. With these, a fresh level-1 party on auto cleared about
    two runs in three in headless tests, usually losing at the boss.
11. **2026-10-08: Guild systems.** `[amended 2026-10-09: refresh timing and daily limits, item 15]`
    Dan went "full into the rogue-lite approach":
    - **Permadeath.** A full wipe kills everyone sent. If some survive, the fallen go to the
      **chapel**: resurrect for a fee (60 + 40 × level gold) at about **65%** odds, or lay them to
      rest. Failures and burials go on the **Wall of the Fallen**.
    - **Recruitment.** A board of candidates with race and quirks, refreshed once a day; the first
      board appears at once. Hires cost gold; the board grows with the Recruitment Hall.
    - **Training.** Pay to level; subclass at level 3; the yard caps the trainable level.
    - **Forge.** Faction materials make three tiers of weapon and armour, trinkets, and three
      consumables (Healing Draught, Antivenom, Fire Oil), up to three carried per run.
    - **Dispatch.** Idle heroes gather, hunt or scout for a day; they cannot take contracts while away.
    - **Posts.** Chaplain, Smith, Drillmaster, Recruiter, Quartermaster; a post **locks for a day**
      once filled.
12. **2026-10-08: Sharing.** Private for now; "potentially later for public use." Sharing the
    artifact by link is Dan's call (item 21).
13. **2026-10-09: Repo.** This folder, `workspace/broken-charter/`, is the system of record and the
    **public** repo `accu4x/broken-charter`: MIT for the code, CC BY-NC-SA 4.0 for the writing, as
    in Kestrel Nine. Decisions and backlog live **in the repo** (Dan), not in `../private/`.
    The first commit and push are Claude Code's (`../private/broken-charter/HANDOVER-repo-setup-2026-10-09.md`).
    *Done 2026-10-09 (Claude Code):* https://github.com/accu4x/broken-charter, public. Dan's rule
    is no direct pushes to `main`, so `main` starts with a stub commit `9237321` (README,
    licences, git settings) and the game comes in through the first pull request (`324e287`).
    Before the push: build 194.1 KB, `smoke: clean` (22 checks), `leak: clean (git)` (26 files)
    and `leak: clean (dir)` on `artifact/dist`. A local `pre-push` hook runs the leak check on
    every push (Dan). Hooks are not committed, so a fresh clone needs it added again.

## Next build (agreed 2026-10-09, not started)

14. **The guild hall becomes a scene, and Sleep replaces real time.** One lit pixel-art room in
    the battle style, with a station per feature (contract board, recruiting desk, training
    dummy, forge, map table, steward's ledger, chapel door, stairs to the bunks). Tapping a
    station slides its panel up. A day counter replaces dates; **Sleep** ends the day: dispatches
    return, posts unlock, the next feature opens. Removes `bc.dayshift` and the real clock.
    *Sleep built 2026-10-09 (slice A, branch `slice-a/sleep`):* a day counter and a Sleep button
    in the header, which asks first if no contract was taken. The room is slice B.
15. **Daily limits.** **One contract per day.** A dispatch takes a day: a hero goes out once,
    comes back the next day, and can be sent again then (Dan, 2026-10-09; settles item 18). The
    **recruit board refreshes every 3 days**, not daily (Dan, 2026-10-09). *Built 2026-10-09
    (slice A).* Save shape v3 migrates v2 saves: the day starts at 1, and anything out or locked
    resolves on the first Sleep.
16. **A guided questline, one feature per day.** A steward (working name Maud, a retired
    one-eyed sergeant) introduces each feature in short dialog with a spotlight and arrow; each
    comes with a small quest and reward. Order: day 1 contract board, three starting heroes and
    the Sunken Crypt only, with a guided first fight; day 2 recruiting; day 3 training; day 4
    the chapel, and permadeath switches on (days 1–3 forgiving: the fallen come home wounded);
    day 5 the forge and Thornwood; day 6 the map table; day 7 the steward's ledger and Mirefen.
    Skippable from settings. **Starts a fresh save** (Dan).

## Open questions

17. **Which vehicle.** `[resolved 2026-10-09]` **A hobby** (Dan). No deadline and no monetization
    driver, as it has been run so far.
18. **"Dispatch a person once."** `[resolved 2026-10-09]` Dan: "a dispatch takes a day." Once per
    day; the same hero may go out again the next day. Folded into item 15.
19. **Six classes or four.** `[open 2026-10-08]` See item 6.
20. **The Necromancer.** `[open 2026-10-08]` Known from day one, or a mystery the guild uncovers?
21. **Public link.** `[open 2026-10-08]` When, if ever, to share the artifact publicly.

## Tech debt

22. **Real-clock days.** `[resolved 2026-10-09, slice A]` Recruit refresh, dispatch returns and post locks read the
    device date, and the smoke test moves it with `bc.dayshift`. Item 14 replaces both.
23. **Smoke test only.** `[2026-10-09]` No unit tests of combat maths or the save migration
    beyond `smoke.py`. Worth a small Node test of damage, turn order and migration once the
    numbers settle.
24. **Frame rate.** `[2026-10-08]` About 46 fps headless at 3× pixel density in battle. Older phones
    may stutter; a lighter graphics setting is in `BACKLOG.md`.
