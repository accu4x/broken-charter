# Backlog

Ideas and the long-game direction. Decisions live in `OPEN-ITEMS.md`.

## The long arc (from Dan's brainstorm, 2026-10-08)

- **Expansion.** Once the guild levels up enough, open a branch hall in a new region. Each region
  has its own threat and contract board; each branch upgrades on its own, with local specialties
  (a marsh branch trains venom-resistant scouts). The old imperial capital, the Necromancer's
  heartland, is the last region.
- **Retired veterans run branches.** `[2026-10-09: proposed as the level-20 Legend milestone, OPEN-ITEMS item 30]` A veteran retires to become a branch guildmaster, so old
  favourites stay useful and retirement reads as a promotion.
- **Rival guilds.** Mostly competitors for contracts, recruits, prestige and lords' favour.
- **Cross-guild missions.** Big set pieces (a goblin horde, a Necromancer rising) where rivals
  team up. How you perform changes your standing with them afterwards.
- **The lords' politics.** `[2026-10-09: Dan wants to plan this in a later session]` Contracts can quietly favour one house over another. Aid, hinder or
  ignore their schemes; each lord remembers. Their fortunes shift the map, sponsor expansion and
  decide who takes the empty throne. Story progression follows from it.
- **Lizardkin diplomacy.** Contracts that ask whose side you are on; lizardkin recruits later.
- **Logistics.** `[added 2026-10-09]` Managing the guild's food and supplies: provisions for
  expeditions, upkeep for the roster, shortages that force choices (Dan, for a later session).
- **A local sandbox.** Your realm lives in your browser and your choices permanently shape it.
  No shared economy.

## Smaller ideas

- **Rival guildmasters with AI voices.** Talk, negotiate, trade. Must be opt-in and ring-fenced,
  and the game must still run without it (`OPEN-ITEMS.md` item 3).
- **More regions and settings**, each with its own enemies, palette and music.
- **Subclass names and balance pass**, once Dan has played the subclasses.
- **Lighter graphics setting** for older phones: no grain, fewer lights, no bloom (item 24).
- **Music.** Longer chiptune loops per setting, and a guild hall theme.
- **Daily or monthly quest lines** that feel emergent rather than scripted.

## Hosting

- ~~**Installable site edition** at `play.latentmirror.com/broken-charter/`, like Kestrel Nine's
  (assets-only Worker on its own path route, manifest, icons, service worker, save export and
  import). Only if Dan wants it.~~ **Slice 1 built 2026-10-10** (`OPEN-ITEMS.md` item 52): the game
  on the play host under its own CSP, fonts self-hosted.
- **Site edition, slice 2:** install (manifest, icons), offline play (service worker), and save
  export and import, so a guild can move between the play host and the artifact. Like Kestrel
  Nine's.
- **Inline styles into classes,** so the site CSP can drop `style-src-attr 'unsafe-inline'`.
- ~~**Latent Mirror hub page**: screenshot from `docs/showcase/`, Dan's copy, and a link out. No
  iframe.~~ **Added 2026-10-10** in latent-mirror, gates closed, with a Play button for the play host.
