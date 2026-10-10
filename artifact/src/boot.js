/* ================= BOOT ================= */
function boot() {
  buildSprites(Object.keys(FOES), new Set(Object.keys(FOES)));
  for (const k of ['battle', 'elite', 'treasure', 'rest', 'boss']) ICONS[k] = iconGrid(k);
  renderGuild(); show('guild'); requestAnimationFrame(frame);
}
const fontReady = (document.fonts && document.fonts.load) ? Promise.race([Promise.all([document.fonts.load('16px "Pixelify Sans"'), document.fonts.load('32px "Jacquard 12"')]), new Promise(r => setTimeout(r, 1500))]) : Promise.resolve();
fontReady.then(boot, boot);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { last = performance.now(); if (!$('section[data-screen="guild"]').hidden) renderGuild(); } });
window.__bc = { B, get RUN() { return RUN; }, get SAVE() { return SAVE; }, startRun, enterNode, reachable, renderGuild, heroById, heroState, sleep, PREFS, FPS };
