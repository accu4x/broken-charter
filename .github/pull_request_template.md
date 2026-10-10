<!-- Delete the lines that do not apply. Tick a box only for what was actually done. -->

## What changes

## Tests

Tick what was run, and say who ran it. Each line is one whole command.

- [ ] `node artifact/build.mjs`
- [ ] `python artifact/test/smoke.py` (needs the build)
- [ ] `node artifact/test/leak.test.cjs`
- [ ] `node artifact/test/leak.test.cjs --dir artifact/dist` (needs the build)

## Before Dan merges

- [ ] **Preview published.** This build is on the preview artifact (`OPEN-ITEMS.md`, "The artifact").
- [ ] **Review it running.** What to look for on the preview:
- [ ] **Saves.** An existing save still loads, or the change says why it can't and what migrates it.
- [ ] **Game text.** New or changed dialog and lore read like the world in `lore/WORLD.md`.
- [ ] **Nothing private.** No handover file and nothing from `../private/`.
- [ ] **Copilot review** requested, and its findings answered.

## After the merge

- [ ] Republish the artifact from `artifact/dist/broken-charter.html` to the same URL.
- [ ] `OPEN-ITEMS.md` updated with the date and the commit.
