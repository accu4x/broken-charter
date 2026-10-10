# SPEC: progression and polish pass

_Planning session with Dan, 2026-10-09. For Claude Code, alongside and after the guild-hall build
(`OPEN-ITEMS.md` items 14–16). Decisions are logged in `OPEN-ITEMS.md` items 25–48; this file holds the
detail. Where they disagree, OPEN-ITEMS wins._

_`[amended 2026-10-09: items 46–48]` Two parts now ride with the hall build, in its pull-request
order: **phase 1** (settings, light graphics, subclass at level 5) lands before the questline, and
the **five classes and Wolfkin** (§2a, and the races of §2b) land after it, before the fresh save
is published. The rest of phase 4b stays where the table puts it._

**How to read it.** Each section says what is **decided** (Dan said so) and what is **proposed**
(a starting point Claude drafted; Dan has not signed off). Build only what is decided, and ask
Dan before turning a proposal into code. Every number here is a starting point for the balance
simulator (section 3), not a promise.

## Order of work

Agreed by Dan, 2026-10-09. Phase 4b was added in the same session, after the order was agreed;
it sits there because it needs the simulator to tune, and Dan may move it.

| Phase | What | Why here |
|---|---|---|
| 1 | Settings and light graphics (§1); subclass gate moves to level 5 (§2, first part) | Ships with the hall build: the tutorial needs a skip, and the day-3 training quest explains subclasses |
| 2 | Combat rules split out, balance simulator and balance tests (§3) | Every later combat change gets tuned with numbers |
| 3 | Visible counters and bestiary (§4); boss phases and tells (§5) | Most change to how fights play |
| 4 | Elite modifiers (§6); run summary (§7) | Variety and story |
| 4b | ~~Five classes and the 20-subclass grid (§2a)~~ (moved into the hall build, item 48); the game week, class trials and racial Rites (§2b); mastery (10), renown (15), legend (20) and new regions (§2c) | Needs the simulator; new since the order was agreed |
| 5 | Subclass and mastery looks, music (§8) | Flavour |

Phase 4b changes the class list (six to five) and the races (Wolfkin joins). The guild-hall
build starts a fresh save (item 16), so no migration is needed if 4b lands before players build
up a guild; if it lands later, migrate as §2a says.

## 1. Settings and light graphics

**Decided.** A settings panel with music and sound volume, a light graphics mode for older phones,
text speed, default battle speed, and tutorial skip.

*Built 2026-10-10 (branch `settings/panel`), as proposed below: the gear opens the panel from the
header; volume, light graphics (with the automatic switch and its notice) and battle speed are in.
Text speed and the tutorial's skip and replay join the panel with the questline, which they
control.*

**Proposed.**
- Opened from a gear icon in the guild hall's corner (the hall build owns the hall layout).
- **Light mode** turns off film grain, bloom and fog, halves particle counts, caps dynamic lights
  at six, and drops the light map to quarter resolution. Default it on when the first battle
  averages under 40 fps for three seconds, and say so once in a toast.
- Text speed covers the steward's typewriter dialog: slow, normal, instant.
- Stored as `bc.settings`; `bc.music`, `bc.sfx` and `bc.speed` migrate into it.

**Done when** the smoke test toggles light mode mid-battle with no page error, and a light-mode
battle renders with the grain and bloom passes skipped.

## 2. Classes, races and hero milestones

### 2a. Five classes and the subclass grid

**Decided** (Dan, 2026-10-09):
- **Five base classes,** so the party of five, the five-day week and the five legends all line up:
  **Warrior, Thief, Mage, Priest, Ranger.** Ranger is the ranged physical attacker. **Druid is no
  longer a base class;** it returns as a subclass.
- **Each subclass is the base class plus the flavour of the class it borrows from.** Every class
  has four subclasses, one per other class, so every pairing exists both ways: **20 subclasses.**
- **The flavours:** Warrior brings **toughness**, Ranger **damage**, Priest **support**, Thief
  **cunning**, Mage **spellcraft**. (Dan first said "versatility" for Thief and "utility" for Mage;
  he accepted the sharper words with the grid.)
- **The Bard is a subclass:** a Thief with the support flavour.
- The grid below is accepted as the starting point. Names are placeholders.

| Base ↓ / flavour → | Toughness (Warrior) | Damage (Ranger) | Cunning (Thief) | Spellcraft (Mage) | Support (Priest) |
|---|---|---|---|---|---|
| **Warrior** | — | Berserker | Duelist | Spellblade | Paladin |
| **Thief** | Brigand | Assassin | — | Trickster | **Bard** |
| **Mage** | Battlemage | Evoker | Illusionist | — | Enchanter |
| **Priest** | Templar | Inquisitor | Oracle | Theurge | — |
| **Ranger** | Warden | — | Stalker | Arcane Archer | **Druid** |

**Proposed:**
- What each flavour does, so every subclass reads at a glance:
  - **Toughness:** +HP and DEF; the new skill guards, taunts or shrugs off a debuff.
  - **Damage:** +ATK or crit; the new skill is a heavy single hit or a sustained bleed.
  - **Cunning:** +SPD; the new skill moves turn bars, dodges or stacks bleeds and poisons.
  - **Spellcraft:** the new skill hits an area or carries an element (fire, arcane, nature) and
    a control effect.
  - **Support:** the new skill heals, cleanses or buffs allies; the Bard's are songs that push
    allies' turns forward.
- Each subclass replaces the base class's third skill, as today. Reuse a built skill only where
  the base and the borrowed class are unchanged: **Paladin, Spellblade, Trickster, Battlemage,
  Illusionist, Templar.** Duelist and Theurge swap direction (Duelist is now a Warrior, Theurge a
  Priest), and Oracle, Inquisitor and Warden change flavour, so those five keep the name but get
  a new skill. Design them and the rest to the flavour rule.
- **Migration, if a guild already exists:** druid heroes become Rangers, and a druid who had a
  subclass takes the Druid subclass; heroes keep a subclass only where its base and borrowed
  class are unchanged (the six above); the rest get their subclass choice back for free.

### 2b. The game week, class trials and racial Rites

**Decided** (Dan, 2026-10-09):
- **A week is five days.** New recruits arrive weekly, **every five days.**
- **Every day:** the day's one contract, **plus** one class trial, **plus** one racial Rite. Sessions
  run longer, and the player can stop mid-day and come back.
- **Class trials** rotate through the five classes, one a day. **Any party may enter** (a
  balanced party is fine). A trial drops **sigils of that day's class**, which pay for the
  **subclass, mastery and legend** gates of heroes of that class.
- **Racial Rites** (the racial trials, renamed) rotate through the five races, one a day. **Only
  heroes of that day's race may enter, in any mix of classes.** A Rite **upgrades that race's
  passive for every hero of that race, guild-wide,** so investing in elves strengthens all your
  elves and permadeath doesn't erase the progress.
- **Permadeath applies** in trials and Rites.
- **The fifth race is Wolfkin,** playable from day one.

**Proposed:**
- **The week:** day 1 Warrior trial and Human Rite; day 2 Thief and Elf; day 3 Mage and Dwarf;
  day 4 Priest and Orc; day 5 Ranger and Wolfkin. Recruits arrive on day 1.
- **Shape:** three rooms and a guardian, no caches or camps, no relics. Enemies scale to the
  strongest hero sent.
- **Class trials** test their class: the Warrior's is a wall of heavy hitters, the Thief's punishes
  slow parties, the Mage's is a swarm, the Priest's is a war of attrition, the Ranger's is a
  target hunt across a wide field.
- **Sigils:** Iron (Warrior), Shadow (Thief), Arcane (Mage), Holy (Priest), Hunt (Ranger). Bosses
  drop the rare **Charter Seal**.
- **Milestone costs** (sigils of the hero's class): subclass 3 sigils and 100 gold; mastery 8
  sigils, 1 Charter Seal and 300 gold; legend 20 sigils, 3 Charter Seals and 800 gold. Renown at 15
  needs no materials. Until trials exist, the level-5 subclass costs gold only.
- **Rites and their places:** the Human Charter Vault, the Elven Moonwell, the Dwarven Deep Forge,
  the Orcish Blood Pit, the Wolfkin Hunting Ground. Each clear earns that race **kinship**; enough
  kinship raises the race's passive a rank (rank II at 3 clears, III at 7, IV at 12, V at 18).

**Races and their passives** (proposed; ranks I to V, rank I is what every hero starts with):

| Race | Passive | Ranks I → IV | Rank V |
|---|---|---|---|
| **Human** | Resolve | +10% XP, rising to +25% | **Last Stand:** once per fight, survives a killing blow at 1 HP |
| **Elf** | Swiftness | +4 SPD, rising to +10 | **First Light:** +25% damage on their first turn each fight |
| **Dwarf** | Stoneblood | +8% HP and −4 SPD, rising to +20% HP and no SPD penalty | **Unshaken:** can't be stunned |
| **Orc** | Bloodrage | +6% ATK, rising to +15% | **Fury:** +20% damage below half health |
| **Wolfkin** | Instinct | Never ambushed (**decided**, item 49); +10% damage to bleeding enemies, rising to +25% | **Pack:** +5% damage for each other Wolfkin in the party |

Wolfkin need a look in `looks.js`: a canine head on the humanoid rig (muzzle, ears, fur), in the
same shading as the rest. Their skin tones are fur colours. Lizardkin stay a backlog idea, as
recruits after the Mirefen.

### 2c. Hero milestones: levels 5, 10, 15 and 20

**Decided** (Dan, 2026-10-09):
- **Subclass at level 5** (was 3).
- **Mastery at level 10:** a focus that is a flavour of the hero's own class.
- **Renown at 15 and Legend at 20,** as proposed below.
- **A new region** unlocks when the guild has raised **a level-20 hero of each of the five
  classes:** a full party of legends.

**Proposed: mastery focuses (level 10).** Each focus gives one passive and upgrades one skill. It
stacks with the subclass, so a Paladin Vanguard and a Paladin Slayer play differently.

| Class | Focus | Passive | Skill upgrade |
|---|---|---|---|
| Warrior | **Vanguard** (defence) | Takes 15% less damage while taunting | Shield Wall lasts 3 turns |
| | **Slayer** (damage) | +10% crit; crits on targets under half health deal +25% | Cleave becomes Rending Cleave (bleeds) |
| | **Warlord** (leadership) | Party +5% ATK while the Warlord stands | Sunder also grants the party ATK up |
| Thief | **Cutthroat** (burst) | First hit each fight is a guaranteed crit | Backstab's bonus starts at 60% health |
| | **Shadow** (tempo) | Starts every fight 30% closer to a turn | Smoke Bomb also stuns one enemy |
| | **Scoundrel** (affliction) | Bleeds and poisons last a turn longer | Twin Fangs always bleeds |
| Mage | **Pyromancer** (fire) | +15% fire damage; burns deal more | Firebolt becomes Fireball (splashes) |
| | **Arcanist** (raw power) | Skill cooldowns −1 | Arcane Lance ignores half of DEF |
| | **Hexer** (curses) | Debuffs land 20% more often | Flame Wave also breaks DEF |
| Priest | **Saint** (healing) | Heals +20% | Mending Light also gives a turn of regen |
| | **Zealot** (holy damage) | +15% holy damage | Smite becomes Holy Fire (hits two) |
| | **Shepherd** (protection) | Allies under 25% health take 20% less damage | Benediction also cleanses |
| Ranger | **Marksman** (precision) | +15% crit damage | Aimed Shot can't be dodged and breaks DEF |
| | **Trapper** (control) | Bleeds also slow the turn bar | Volley pushes back every enemy's turn |
| | **Pathfinder** (scouting) | Party moves first in every fight; dispatches bring back more | Hunter's Mark marks all enemies |

**Decided** (item 50): an upgrade to the base class's third skill carries over, in kind, to the
subclass skill that replaces it.

The Thief's burst focus is renamed **Cutthroat** (it was Assassin) so it doesn't clash with the
Assassin subclass.

**Renown (15) and Legend (20).** The mechanics below are **decided** (item 35: Dan, "yes"); the
numbers in them (+5%, +1 slot, the wings' bonuses, the yard caps) stay **proposed** until the
simulator tunes them.
- **Renown:** a guild-wide passive that follows the hero's focus. A Pyromancer gives every hero +5%
  fire damage, a Saint +5% resurrection odds, a Pathfinder +1 dispatch slot. It lasts only while
  that hero lives.
- **Legend:** the hero can retire to found a **branch hall**. The class decides its wing: a
  Warrior's fort (contracts there hit harder), a Priest's abbey (better resurrection), a Mage's
  tower (cheaper crafting), a Thief's den (more gold), a Ranger's lodge (better scouting and
  hunting). Five legends, one per class, open a new region and found its hall together. Raising a
  hero to 20 takes roughly forty contracts at today's XP rates, so this is the long game, and
  losing one to permadeath sets the region back.
- **The yard** grows to five levels, with trainable caps of 4, 7, 10, 15 and 20.

## 3. Combat rules, balance simulator and balance tests

**Decided.** A simulator, and **tests that prove balance among the classes:** every class has
places where it excels and places where it struggles (Dan confirmed, 2026-10-09).

**Proposed.**
- **Split the rules out.** Move damage, turn order, status effects, skill resolution and enemy AI
  from `battle.js` into `artifact/src/rules.js`, which runs in the browser and in Node, as Kestrel
  Nine does with `engine.js`. `battle.js` keeps animation, effects and drawing, and calls the
  rules. Take the random-number generator as a parameter (`mulberry`), so a seed replays a
  fight exactly.
- **`artifact/test/balance.cjs`** plays seeded auto battles and prints a table: win rate,
  average heroes lost, and fight length, per contract, node type and party level.
- **Starting targets:** a fresh level-1 starter party clears the Sunken Crypt about 60% of the
  time on auto, and loses at most one hero on average to the boss.
- **Balance tests** (`artifact/test/balance.test.cjs`, seeded, so they pass or fail the same way
  every run):
  - **Niche test.** Swap each of the five classes into a reference party. Across the scenario
    grid (each contract × normal, elite and boss, plus each trial), every class must rank in the
    top two in at least one scenario and the bottom two in at least one. No class may rank top
    two in more than half.
  - **Race test.** The same check for races at equal passive ranks: no race may win every
    scenario, and each race's rank-V ability must be worth a measurable gain somewhere.
  - **Counter test.** On each contract, a party carrying that faction's counter beats one
    without it by at least 10 points of win rate.
  - **No dead options.** No subclass or mastery focus loses to taking nothing at all.
  - **Band test.** Win rates stay inside the target bands, so a tuning change that breaks
    difficulty fails loudly.
- Tests print their tables, so a failure shows which number moved.

## 4. Visible counters and bestiary

**Decided.** Yes.

**Proposed.**
- While a skill is selected, each valid target shows a tag: **Weak!** (green), **Resists**
  (amber), **Immune** (grey). The description line shows the expected damage range against the
  hovered target, without crits.
- `rules.estimateDamage(source, target, skill)` returns `[min, max]`, so the preview and the real
  hit can't drift apart.
- **Bestiary.** An entry opens the first time the guild meets an enemy: name, faction, a line of
  lore, and its weaknesses and immunities, filled in as they are discovered. Where it lives in
  the hall is the hall build's call (perhaps a trophy wall).

## 5. Boss phases and tells

**Decided.**
- Bosses change at half health.
- **A stun interrupts a telegraphed move.**
- **Tells:** before a special move the boss shows an emote. **80% of the time** the move comes on
  the boss's next turn. **20% of the time** the tell is a turn early: the boss does something else
  next, then the move. **A special move never happens without a tell.**

**Proposed.**
- **The rule in code.** When the AI picks a special for its next turn, it shows the tell at the
  end of its current turn and rolls the timing (80/20). The tell stays visible until the move
  lands. Basic attacks need no tell.
- **A stun interrupts** (decided, Dan): a boss stunned while its tell is up loses the move, and
  the tell clears. Stun builds earn their keep.
- **The phase change:** a banner, a camera push, a music shift and one free action.

| Boss | Tell | Phase 2 at half health | Its counter |
|---|---|---|---|
| **Bone Knight** | Raises the greatsword; eye sockets flare red | Raises two skeletons; Dread Aura slows the party 10% | Holy area attacks end the aura |
| **Old Mossback** | Sniffs the air, pounds his chest | Enrages: +30% ATK, Sweep hits harder | If burning at the change, he staggers for a turn instead |
| **Fen Matriarch** | Frill flares and she hisses | Every third turn she submerges: untargetable, summons a lizard, resurfaces on your weakest hero | A Thief or Ranger in the party sees where: she surfaces stunned |

## 6. Elite modifiers

**Decided.** Yes.

**Proposed.** An elite fight rolls one trait; from map layer 3, two. Bosses get none (they have
phases). Traits show as chips on the health bar and in the bestiary. Elite fights drop 50% more
materials.

| Trait | Effect | Counter |
|---|---|---|
| Armoured | +50% DEF | DEF-breaking skills work twice as well |
| Frenzied | +25% SPD, −15% DEF | Stuns on it last a turn longer |
| Venomous | Its attacks may poison | Antivenom, cleansing, Marsh-born |
| Regenerating | Heals 6% a turn | Burning stops it |
| Shielded | The first hit is absorbed | Multi-hit skills strip it |
| Vengeful | Bursts on death, hitting every hero for 8% | Shield Wall, killing it last |

## 7. Run summary

**Decided.** Yes.

**Proposed.**
- Track per hero across the run: damage dealt and taken, healing, kills, items used.
- The result screen shows a small table and names an **MVP**: damage, plus healing ×1.5, plus
  50 per kill.
- The fallen are recorded with their killer: "Felled by the Bone Knight in the Sunken Crypt."
  The Wall of the Fallen uses the same line.

## 8. Subclass and mastery looks, music

**Decided.** Yes.

**Proposed.**
- **Subclass looks:** each of the 20 subclasses changes the sprite (trim, cape, weapon or glow).
  For example, holy trim and a white tabard for a Paladin, furs and a bare arm for a Berserker,
  a rune-lit blade for a Spellblade. Done as look deltas in `looks.js`, applied when a hero's
  sprite is built.
- **Mastery:** a faint aura in the focus's colour in battle, and a mark on the roster card.
- **Music:** a guild-hall theme, a phase-2 variant of the boss theme, a victory sting.

## Open, for Dan

- Subclass and mastery names are placeholders until Dan has played them.
- The milestone costs, kinship thresholds and passive numbers are first guesses for the simulator.
- Logistics (food and supplies) and the lords' politics are in `BACKLOG.md` for a later session.
- ~~**Mastery upgrades to the third skill.**~~ `[resolved 2026-10-10, item 50]` They carry over
  to the subclass skill in that slot, in kind. Upgrades to Sunder (Warlord), Backstab
  (Cutthroat), Arcane Lance (Arcanist), Benediction (Shepherd) and Hunter's Mark (Pathfinder)
  apply to whichever skill the hero's subclass put in the third slot; design how each subclass
  skill takes them alongside the 20 skills.
