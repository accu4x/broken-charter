# Broken Charter

*The empire is gone. Your guild still holds its charter.*

A dark pixel-art guild-management roguelite for the browser. The last emperor's final act was to
sign the charters that let the guilds defend what was left. You run one of them.

- **Take contracts.** Clear the Sunken Crypt, the Thornwood and the Mirefen, each a branching
  path of fights, caches and camps that ends at a boss.
- **Fight in turns.** A party of five with a leader, turn order by speed, three skills each, and
  an auto-battle you can trust but not rely on. Every faction has a counter: holy against the
  dead, fire against trolls, scouts against lizardkin ambushes.
- **Run the guild.** Recruit from a board that changes, train heroes into subclasses, forge gear
  and potions from what your contracts bring home, send idle heroes out to gather, hunt or scout,
  and post veterans to run the hall.
- **Lose people.** Permadeath is on. A wiped party is gone for good. The fallen of a party that
  made it home can be carried to the chapel, where the rite costs gold and can fail. Their names
  go on the wall.

No accounts and no server: the game is one HTML file, and your guild lives in your browser.

## Play

In the browser: <https://play.latentmirror.com/broken-charter/>, or on claude.ai:
<https://claude.ai/artifact/4kQSr4xjDXpF7DrSCUAZGX>. Progress stays on your device, and each of
the two keeps its own guild.

## Build and test

Node 20 or later, no dependencies. The smoke test needs Python with Playwright.

```
node artifact/build.mjs                  # artifact/dist/broken-charter.html
node artifact/build.mjs --site           # artifact/dist/site/ for play.latentmirror.com
python artifact/test/smoke.py            # headless play-through
node artifact/test/leak.test.cjs         # run before every push; fails closed
```

Built files are not committed; every build is reproducible from `artifact/src/`.
`CLAUDE.md` covers how the project is run, `OPEN-ITEMS.md` the decisions behind it,
`BACKLOG.md` what comes next, and `lore/` the world.

## Licence

Two licences, because the writing and the machinery are different things.

- **The writing:** everything in `lore/`, and the names, descriptions and other game text in
  `artifact/src/classes.js` and `artifact/src/data.js`, is
  [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Full text in `LICENSE`.
- **The code** in `artifact/` is MIT. Full text in `artifact/LICENSE`.
