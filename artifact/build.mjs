// Build: node artifact/build.mjs          ->   artifact/dist/broken-charter.html
//        node artifact/build.mjs --site   ->   artifact/dist/site/ for play.latentmirror.com
// The artifact inlines src/style.css and the scripts, in load order, into src/template.html. No
// dependencies. The published artifact (OPEN-ITEMS.md, "The artifact") is that one file.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, copyFileSync } from 'node:fs';
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

if (process.argv.includes('--site')) buildSite();
else buildArtifact();

function buildArtifact() {
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
}

// The site edition (Dan, 2026-10-10): the same game at play.latentmirror.com/broken-charter/, an
// assets-only Worker on its own path route, the way Kestrel Nine is hosted. Play-only for now:
// install, offline play and save export and import are the next slice (BACKLOG.md, Hosting).
// Under its own CSP the page carries no inline script or <style>, and fonts are self-hosted.
function buildSite() {
  const SLUG = 'broken-charter';
  const root = join(here, 'dist', 'site');
  const app = join(root, SLUG); // a route does not strip its path, so assets live under /broken-charter/
  // Empty rather than remove the folder: Windows refuses to delete a directory a shell is in.
  mkdirSync(root, { recursive: true });
  for (const name of readdirSync(root)) rmSync(join(root, name), { recursive: true, force: true });
  mkdirSync(join(app, 'fonts'), { recursive: true });

  // The page shell is the template's markup between the head and the script, as the artifact has it.
  const tpl = src('template.html');
  const body = tpl.slice(tpl.indexOf('<div id="app">'), tpl.indexOf('<script>')).trim();
  if (!body.startsWith('<div id="app">')) throw new Error('template.html no longer opens its markup with <div id="app">.');
  // Inline style *attributes* are allowed by the CSP (style-src-attr); <style>, <script> and inline
  // event handlers are not, so the shell may not carry them.
  if (/<style|<script|\son[a-z]+\s*=/i.test(body)) throw new Error('The page shell carries a <style>, a <script> or an inline handler.');

  const indexHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Broken Charter</title>
<meta name="description" content="A dark pixel-art guild-management roguelite. The empire is gone. Your guild still holds its charter.">
<meta name="theme-color" content="#080605">
<link rel="stylesheet" href="app.css">
</head>
<body>
${body}
<script src="app.js" defer></script>
</body>
</html>
`;
  // The same scope the artifact gives the scripts: one strict function around all of them.
  const appJs = `(() => {\n'use strict';\n${scripts}\n})();\n`;
  const appCss = src('site-fonts.css') + '\n' + src('style.css');

  const files = { 'index.html': indexHtml, 'app.js': appJs, 'app.css': appCss };
  for (const [name, data] of Object.entries(files)) writeFileSync(join(app, name), data);
  // The three faces, latin subsets, with their licences (SIL OFL 1.1), as the artifact loads them
  // from Google Fonts. Self-hosted so the page asks no other origin (Dan, 2026-10-10).
  const fonts = readdirSync(join(here, 'src', 'fonts'));
  for (const f of fonts) copyFileSync(join(here, 'src', 'fonts', f), join(app, 'fonts', f));
  writeFileSync(join(root, '_headers'), src('site-headers.txt').replaceAll('{SLUG}', SLUG));
  const kb = Object.values(files).reduce((a, d) => a + d.length, 0) / 1024;
  console.log(`built dist/site/${SLUG}/ (${Object.keys(files).length} files and ${fonts.length} in fonts/, ${kb.toFixed(1)} KB of text)`);
}
