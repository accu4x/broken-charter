// Build: node artifact/build.mjs   ->   artifact/dist/broken-charter.html
// Inlines src/style.css and the scripts, in load order, into src/template.html. No dependencies.
// The published artifact (OPEN-ITEMS.md, "The artifact") is this one file.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = (f) => readFileSync(join(here, 'src', f), 'utf8');

// Load order matters: each file uses names declared by the ones before it, in one shared scope.
export const SCRIPTS = [
  'util.js',     // $, rnd, clamp, pick, store (localStorage with try/catch), mulberry
  'sprites.js',  // pixel toolkit: ramps, shading, outlines, humanoid and troll rigs, pose frames
  'looks.js',    // starter-hero and enemy looks; SPR sprite cache
  'bg.js',       // layered battle scenes and lights per setting
  'classes.js',  // classes, subclasses, races, quirks, materials, gear, items, posts, buildings
  'data.js',     // foes, contracts (settings), relics, status effects, map icons
  'audio.js',    // WebAudio chiptune: sound effects and per-scene music
  'hall.js',     // guild hall scene: the room, its stations, heroes and lights
  'guild.js',    // save and migration, day clock, guild hall tabs, runs, map, results
  'battle.js',   // battle engine, AI, effects, lighting and rendering
  'boot.js',     // start-up and test hooks
];

const scripts = SCRIPTS.map((f) => `/* ---- ${f} ---- */\n` + src(f)).join('\n;\n');
if (scripts.includes('</script')) throw new Error('A script contains a closing script tag.');
const html = src('template.html')
  .replace('/*STYLE*/', () => src('style.css'))
  .replace('/*SCRIPTS*/', () => scripts);
// claude.ai wraps the page and declares the charset itself. Opened straight from disk nothing
// does, so the file has to say it first.
if (!html.startsWith('<meta charset="utf-8">')) throw new Error('template.html must start with its charset line.');
if (!/<title>[^<]+<\/title>/.test(html.slice(0, 8192))) throw new Error('The <title> must sit in the first 8 KB.');

mkdirSync(join(here, 'dist'), { recursive: true });
writeFileSync(join(here, 'dist', 'broken-charter.html'), html);
console.log('built dist/broken-charter.html', (html.length / 1024).toFixed(1) + ' KB');
