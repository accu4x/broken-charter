# Open items

Decisions, tech debt and open questions for Broken Charter. Ideas live in `BACKLOG.md`.
Keep entries dated. **Correct, don't overwrite:** when a decision is superseded, mark it with the
date and a pointer to what replaced it. Numbers are stable IDs, not priority.

_Last updated: 2026-10-09 (repo pushed, item 13; next build agreed, items 14–16; items 17 and 18
resolved; board refresh set, item 15; progression and polish planned, items 25–45; the hall build ordered, items 46–48; Instinct and mastery carry-over, items 49–50). Before that:
2026-10-08 (items 1–12, the first three builds)._

## The artifact

| Name | URL | Capabilities | Sharing |
|---|---|---|---|
| **Broken Charter** | https://claude.ai/artifact/4kQSr4xjDXpF7DrSCUAZGX | none | Private; Dan shares it by link when he chooses (item 12) |

- Built from `artifact/src/` by `node artifact/build.mjs`. Always republish to this URL: player
  saves are tied to it.
- **Version 4, 2026-10-09:** game days, Sleep, one contract a day, the v3 save and resuming a
  fight after a reload. Published by Cowork from the working tree (not yet merged), after a rebuild
  from source matched `artifact/dist/` and `smoke.py` passed. *Merged 2026-10-09 as `a1e4523`
  (PR #2); the live page matches that build byte for byte.*
- **Version 5, 2026-10-10:** the five-day week (merge `d5013a1`, PR #4). Published by Claude Code.
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
   classes (adding ranger and druid) with three subclasses each, 18 in all, chosen at level 3
   `[amended 2026-10-09: level 5, item 25; five classes and 20 subclasses, item 39]`.
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
    - **Training.** Pay to level; subclass at level 3 `[amended 2026-10-09: level 5, item 25]`;
      the yard caps the trainable level.
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
    *The room built 2026-10-10 (branch `hall/scene`):* `artifact/src/hall.js` draws one lit room
    (hearth, torches, forge, embers, grain) with eight stations as buttons over the canvas; the
    stairs sleep. Each station opens today's panel in a sheet that slides up under the room.
    Heroes on the roster idle around the hearth, and posted heroes stand at their posts. Locked
    stations can sit dark with a padlock; nothing is locked until the questline.
15. **Daily limits.** **One contract per day.** A dispatch takes a day: a hero goes out once,
    comes back the next day, and can be sent again then (Dan, 2026-10-09; settles item 18). The
    **recruit board refreshes every 3 days**, not daily (Dan, 2026-10-09). `[amended 2026-10-09:
    every 4 days, item 33; then every 5 days, item 40]` *Built 2026-10-09
    (slice A).* Save shape v3 migrates v2 saves: the day starts at 1, and anything out or locked
    resolves on the first Sleep.
16. **A guided questline, one feature per day.** A steward (working name Maud, a retired
    one-eyed sergeant) introduces each feature in short dialog with a spotlight and arrow; each
    comes with a small quest and reward. Order: day 1 contract board, three starting heroes and
    the Sunken Crypt only, with a guided first fight; day 2 recruiting; day 3 training; day 4
    the chapel, and permadeath switches on (days 1–3 forgiving: the fallen come home wounded);
    day 5 the forge and Thornwood; day 6 the map table; day 7 the steward's ledger and Mirefen.
    Skippable from settings. **Starts a fresh save** (Dan).

## Progression and polish (planned 2026-10-09, not started)

Detail, order of work and Claude's proposals: `docs/SPEC-progression-and-polish.md`. These items
record what Dan decided; the spec marks everything else as proposed.

25. **2026-10-09: Hero milestones.** Subclass at **level 5** (was 3). **Mastery at level 10**: a
    focus that is a flavour of the hero's own class (Dan: "for mages what kind of skills, for
    warriors archetype (damage, defense)... make each a flavor of their class"). Milestones cost
    materials as well as gold. Something at **15** and **20** (item 30).
26. **2026-10-09: Specialty dungeons.** The upgrade materials come from special dungeons, as in
    Summoners War's upgrade dungeons (Dan). Shape proposed in the spec (trials and sigils);
    details open (item 31).
27. **2026-10-09: Boss phases and tells.** Bosses change at half health. Before a special move
    the boss shows an emote: 80% of the time the move comes next turn, 20% the tell comes a turn
    early. **A special move never happens without a tell** (Dan).
28. **2026-10-09: The polish list and its order.** All of it is in: settings and light graphics,
    the rules split and balance simulator, visible counters, boss phases, elite modifiers, the run
    summary, subclass looks and music. Order agreed as in the spec's table; mastery and trials
    were added after and slotted as phase 4b.
29. **2026-10-09: Balance tests.** Tests, not just a simulator: every class has places where it
    excels and places where it struggles (wording to confirm, item 32).

33. **2026-10-09: The game week.** `[superseded 2026-10-09: five days, item 40]` Four days make a week (Dan). New recruits arrive every four days,
    at the start of each week (amends item 15). Trials rotate through the classes one a day, so a
    week runs each class's trial once, if there are four classes (item 19).
34. **2026-10-09: Class trials.** `[amended 2026-10-09: any party may enter, item 41]` Once per day. Each day's trial belongs to one class, rotating
    daily; only heroes of that class may go, **up to five**. Trial drops unlock the **subclass,
    mastery and legend** gates (Dan: "make the trials unlock mastery and legend gates as well").
    Supersedes the spec's first proposal of three mixed trials.
35. **2026-10-09: Levels 15 and 20.** Renown at 15 (a guild-wide passive tied to the hero's focus,
    lost if the hero dies) and Legend at 20, as proposed in the spec (Dan: "yes"). Numbers stay
    proposals until the simulator tunes them.
36. **2026-10-09: New regions.** `[amended 2026-10-09: five classes, item 45]` A new region unlocks when the guild has **a level-20 hero of each of
    the four classes** (Dan: "player level up a foursome to 20").
37. **2026-10-09: A stun interrupts a boss's telegraphed move** (Dan). The tell clears.
38. **2026-10-09: Balance tests prove balance among the classes.** Each class has places where it
    excels and places where it struggles (Dan confirmed the wording).

39. **2026-10-09: Five base classes and 20 subclasses.** Warrior, Thief, Mage, Priest and **Ranger**
    (the ranged physical attacker), so the party of five, the week and the legends all line up
    (Dan). **Druid** becomes a subclass (Ranger + support), and the **Bard** is a subclass (Thief +
    support). Each class has four subclasses, one per other class, each adding that class's
    **flavour**: Warrior toughness, Ranger damage, Priest support, Thief cunning, Mage spellcraft.
    Dan accepted the grid in the spec (§2a); names are placeholders. Settles item 19.
40. **2026-10-09: A week is five days.** New recruits arrive weekly, every five days (Dan).
    Supersedes item 33.
    *Built 2026-10-09 (branch `week/five-days`):* the header reads "Day 12 · Week 3", and the
    recruit board refreshes at the start of each week (days 1, 6, 11…), keyed to the week number
    so a hall upgrade's reroll doesn't shift it.
41. **2026-10-09: Class trials take any party.** Dan: "make the trials not have to be 5 of the same
    class... allow balanced party." A trial still belongs to one class a day and drops that
    class's sigils for the subclass, mastery and legend gates.
42. **2026-10-09: Racial Rites.** Racial trials, renamed Rites, alongside the class trials (Dan:
    "both racial trials AND class trials"). One race a day; only that race may enter, in any mix
    of classes ("kind of like a water team fire team in Summoners War but you still have a
    balanced party"). A Rite upgrades **that race's passive for every hero of that race**,
    guild-wide, through five ranks.
43. **2026-10-09: The fifth race is Wolfkin,** playable from day one (Dan: a race "I can play right
    away", not gnomes). Races: Human, Elf, Dwarf, Orc, Wolfkin. Passives proposed in the spec
    (§2b); Wolfkin's rank V is a pack bonus that rewards all-Wolfkin parties. `[amended
    2026-10-10: Instinct approved, item 49]`
44. **2026-10-09: The daily load.** A contract, a class trial and a Rite every day, with longer
    sessions; the player can stop mid-day and come back (Dan).
45. **2026-10-09: New regions need five legends:** a level-20 hero of each of the five classes.
    Amends item 36.

## The hall build, in pull requests (agreed 2026-10-09)

46. **2026-10-09: Order.** One pull request at a time, each played before the next (Dan, from
    `../private/broken-charter/HANDOVER-hall-and-questline-2026-10-09.md`): these docs; the
    five-day week; the hall as a scene (item 14); settings, light graphics and the subclass at
    level 5 (spec phase 1); the guided questline (item 16); then the five classes and Wolfkin.
    Settings come **before** the questline, because its skip and text speed live there (Dan).
47. **2026-10-09: The starting three.** The questline starts with **Brenna (Warrior), Sela (Thief)
    and Hilde (Priest)** (Dan).
48. **2026-10-09: Five classes and Wolfkin fold into the hall build** (Dan: yes), as their own pull
    request after the questline and before the fresh save is published, so nothing needs
    migrating. Moves that part of spec phase 4b forward; trials, Rites and milestones stay in 4b.
49. **2026-10-10: Wolfkin Instinct is approved:** a wolfkin is never ambushed (Dan), so
    `lore/WORLD.md`'s "Nothing ambushes a wolfkin" stands as canon. The damage numbers stay
    proposals for the simulator.
50. **2026-10-10: Mastery upgrades carry over to the subclass skill** (Dan). A level-10 focus whose
    upgrade names the base class's third skill (Warlord, Cutthroat, Arcanist, Shepherd,
    Pathfinder) upgrades whatever skill the hero's subclass put in that slot, in kind. How each
    of the 20 subclass skills takes it is designed with them, in phase 4b.

## Open questions

17. **Which vehicle.** `[resolved 2026-10-09]` **A hobby** (Dan). No deadline and no monetization
    driver, as it has been run so far.
18. **"Dispatch a person once."** `[resolved 2026-10-09]` Dan: "a dispatch takes a day." Once per
    day; the same hero may go out again the next day. Folded into item 15.
19. **Six classes or four.** `[resolved 2026-10-09: five, item 39]` See item 6. `[2026-10-09: was blocking]` The game week
    (item 33), the class trials (item 34) and the region rule (item 36) all assume four. The spec
    recommends four, with Ranger and Druid back as subclasses.
20. **The Necromancer.** `[open 2026-10-08]` Known from day one, or a mystery the guild uncovers?
21. **Public link.** `[open 2026-10-08]` When, if ever, to share the artifact publicly.
30. **Levels 15 and 20.** `[resolved 2026-10-09: items 35 and 36]` Dan: "Need to think about that." His direction: a
    guild-wide passive, and at 20 unlocking another base, or something, based on the hero's class.
    Proposals in the spec (§2).
31. **Trials.** `[resolved 2026-10-09]` Once per day (item 34). A trial is **on top of** the day's
    one contract, and **permadeath applies** in trials (Dan: "yes and yes").
32. **Two small confirmations.** `[resolved 2026-10-09: items 37 and 38]` Dan wrote that each class should have places
    where it excels "but places where they do well": read as "struggles". And: does a stun
    interrupt a boss's telegraphed move (proposed in the spec, §5)?

## Tech debt

22. **Real-clock days.** `[resolved 2026-10-09, slice A]` Recruit refresh, dispatch returns and post locks read the
    device date, and the smoke test moves it with `bc.dayshift`. Item 14 replaces both.
23. **Smoke test only.** `[2026-10-09]` No unit tests of combat maths or the save migration
    beyond `smoke.py`. Worth a small Node test of damage, turn order and migration once the
    numbers settle.
24. **Frame rate.** `[2026-10-08]` About 46 fps headless at 3× pixel density in battle. Older phones
    may stutter; a lighter graphics setting is in `BACKLOG.md`.
