/* ================= GUILD HALL SCENE ================= */
// One lit room, drawn once and relit every frame. Each station is an HTML button laid over the
// canvas at its box (room pixels), so the hall works by touch, mouse, keyboard and screen reader;
// the canvas itself is decoration. A station with `tab` opens that guild panel; the stairs sleep.
const HW = 320, HH = 150, FLOOR = 98;
const STATIONS = [
  { k: 'chapel', tab: 'chapel', name: 'Chapel door', short: 'Chapel', does: 'the fallen and the Wall', box: [4, 16, 40, 84] },
  { k: 'desk', tab: 'recruit', name: 'Recruiting desk', short: 'Recruits', does: 'hire recruits', box: [46, 80, 50, 48] },
  { k: 'board', tab: 'hall', name: 'Contract board', short: 'Contracts', does: 'contracts, party and pack', box: [98, 22, 48, 54] },
  { k: 'table', tab: 'dispatch', name: 'Map table', short: 'Map table', does: 'send heroes out', box: [98, 108, 60, 40] },
  { k: 'ledger', tab: 'posts', name: 'Steward’s ledger', short: 'Ledger', does: 'guild posts', box: [186, 74, 40, 54] },
  { k: 'forge', tab: 'forge', name: 'Forge', short: 'Forge', does: 'gear and brews', box: [228, 38, 52, 72] },
  { k: 'dummy', tab: 'roster', name: 'Training dummy', short: 'Training', does: 'roster, training and party', box: [262, 112, 46, 36] },
  { k: 'stairs', sleep: true, name: 'Stairs to the bunks', short: 'Sleep', does: 'sleep and end the day', box: [281, 8, 38, 98] }
];
// Where heroes stand (feet): idle ones around the hearth, posted ones at their posts.
const IDLE_SPOTS = [[178, 134], [204, 136], [166, 146], [218, 124], [192, 148], [190, 122], [228, 146], [164, 124]];
const POST_SPOTS = { chaplain: [48, 106], recruiter: [100, 104], quartermaster: [180, 108], smith: [240, 112], drill: [256, 146] };
const HALL = { scene: null, S: 1, cw: 0, t: 0, embers: [], people: [], fade: null };
const HALL_FADE = [350, 250, 600]; // Sleep: fade to black, hold, fade back in (ms)
const hcv = $('#hallCv'), hcx = hcv.getContext('2d');
let hlm = null, hlx = null, hlq = null, hlqx = null;

function stationLocked(s) { return false; }

function hallPeople() {
  const out = [], ph = uid => (uid.length * 97 + uid.charCodeAt(0) * 13) % 1000;
  for (const k in POST_SPOTS) { const h = postHolder(k); if (h) out.push({ uid: h.uid, x: POST_SPOTS[k][0], y: POST_SPOTS[k][1], ph: ph(h.uid) }); }
  const ready = SAVE.roster.filter(h => heroState(h) === 'ready').sort((a, b) => SAVE.party.includes(b.uid) - SAVE.party.includes(a.uid));
  ready.slice(0, IDLE_SPOTS.length).forEach((h, i) => out.push({ uid: h.uid, x: IDLE_SPOTS[i][0], y: IDLE_SPOTS[i][1], ph: ph(h.uid) }));
  return out.sort((a, b) => a.y - b.y);
}

function buildHall() {
  const R = mulberry(77); const pk = a => a[Math.floor(R() * a.length)];
  const [mid, M] = mk(HW, HH);
  const S = { mid, lights: [], flames: [], hearth: { x: 170, y: 86, w: 16 }, forge: { x: 254, y: 72, w: 26 } };
  const light = (x, y, r, c, i, fl, bloom) => S.lights.push({ x, y, r, c, i, fl, bloom });
  const candle = (x, y) => { P(M, x - 1, y, '#d8cdb0', 2, 4); P(M, x - 1, y + 3, '#a89c80', 2, 1); S.flames.push({ x, y, s: .5, candle: true, still: true }); light(x, y - 2, 30, [255, 180, 110], .55, R() * 6); };

  // walls: warm stone under a ceiling beam
  for (let y = 6, r = 0; y < FLOOR; y += 7, r++) {
    const off = (r % 2) * 7;
    for (let x = -off; x < HW; x += 14) {
      const base = pk(['#2e2620', '#2a231d', '#33291f', '#2c241e']);
      P(M, x, y, '#140e0a', 14, 7); P(M, x + 1, y + 1, base, 12, 5); P(M, x + 1, y + 1, darken(base, 1.15), 12, 1); P(M, x + 1, y + 5, darken(base, .78), 12, 1);
      if (R() < .2) P(M, x + 2 + R() * 9, y + 3, '#1a130e', 2, 1);
    }
  }
  P(M, 0, 0, '#1a110a', HW, 6); P(M, 0, 5, '#2e1f14', HW, 1); for (let x = 6; x < HW; x += 23) P(M, x, 1, '#24170e', 1, 4);

  // floor: planks, with a worn rug before the hearth
  for (let y = FLOOR; y < HH; y++) {
    const p = (y - FLOOR) / (HH - FLOOR); const row = Math.floor(Math.pow(p, .75) * 7); const len = 22 + row * 7;
    const nextRow = Math.floor(Math.pow((y + 1 - FLOOR) / (HH - FLOOR), .75) * 7);
    for (let x = 0; x < HW; x++) {
      const seg = Math.floor((x + row * 13) / len);
      let c = (row + seg) % 2 ? '#2a1e15' : '#261a12';
      if (nextRow !== row || (x + row * 13) % len === 0) c = '#150d08'; else if ((x * 7 + y * 13 + seg * 5) % 29 === 0) c = '#30231a';
      P(M, x, y, c);
    }
  }
  P(M, 0, FLOOR, '#3a2c20', HW, 1); P(M, 0, FLOOR + 1, '#0e0906', HW, 1);
  for (let y = 116; y <= 146; y++) {
    const inset = Math.round(Math.abs(y - 131) * .3); const x0 = 156 + inset, w = 76 - inset * 2;
    const edge = y === 116 || y === 146; P(M, x0, y, edge ? '#8a5a2a' : '#4a1814', w, 1);
    if (!edge) { P(M, x0, y, '#8a5a2a'); P(M, x0 + w - 1, y, '#8a5a2a'); for (let x = x0 + 3; x < x0 + w - 3; x++) if ((x + y * 2) % 9 === 0 || (x - y * 2 + 300) % 9 === 0) P(M, x, y, '#6a2a1e'); }
  }

  // chapel door: a pointed arch with iron bands, candles either side, a faint holy light
  { const c0 = 23, A = gothArch(c0, 20, 17, 40), B2 = gothArch(c0, 25, 13, 42);
    for (let y = 20; y < FLOOR; y++) { const a = A(y), b = B2(y); if (a < 0) continue; for (let x = Math.round(c0 - a); x <= c0 + a; x++) { const inner = b >= 0 && Math.abs(x - c0) <= b; P(M, x, y, inner ? ((x + 40) % 5 === 0 ? '#22150c' : '#3a2516') : ((Math.floor((x + y) / 3) % 2) ? '#4a3e44' : '#40353b')); } }
    for (const by of [52, 76]) P(M, c0 - 12, by, '#1a1618', 25, 2);
    P(M, c0 + 6, 63, '#8a7a5a', 2, 3); P(M, c0, 30, '#c9a24a', 1, 7); P(M, c0 - 2, 32, '#c9a24a', 5, 1);
    candle(6, 92); candle(40, 92);
    light(c0, 58, 46, [190, 170, 255], .3); }

  // weapon rack above the recruiting desk: crossed spears behind a shield
  lineC(M, 54, 34, 86, 66, '#5e4228', 2); lineC(M, 86, 34, 54, 66, '#5e4228', 2); P(M, 53, 32, '#a8acb8', 2, 3); P(M, 86, 32, '#a8acb8', 2, 3);
  for (let r = 0; r < 22; r++) { const hw = r < 12 ? 9 : Math.max(0, 9 - Math.ceil((r - 11) * 1.1)); for (let x = -hw; x <= hw; x++) P(M, 70 + x, 38 + r, Math.abs(x) === hw || r === 0 ? '#a8863e' : (x < -4 ? '#7a2622' : '#6a1e1c')); }
  P(M, 69, 42, '#a8863e', 3, 12); P(M, 64, 46, '#a8863e', 13, 3);

  // recruiting desk: book, quill, ink and a lantern
  P(M, 48, 102, '#5a4030', 46, 3); P(M, 48, 105, '#3a2818', 46, 2); P(M, 50, 107, '#4a3424', 42, 15);
  for (const px of [52, 72]) { P(M, px, 109, '#3a2818', 18, 1); P(M, px, 119, '#2a1c12', 18, 1); P(M, px, 109, '#3a2818', 1, 11); P(M, px + 17, 109, '#2a1c12', 1, 11); }
  P(M, 50, 122, '#24170d', 42, 2);
  P(M, 56, 98, '#e0d2ae', 7, 4); P(M, 63, 98, '#d0c29e', 7, 4); P(M, 63, 98, '#6a4a2a', 1, 4); for (let i = 0; i < 3; i++) { P(M, 57, 99 + i, '#8a7a5a', 5, 1); P(M, 64, 99 + i, '#8a7a5a', 4, 1); }
  lineC(M, 74, 93, 77, 100, '#e8e0c8'); P(M, 76, 99, '#1a1418', 3, 3);
  P(M, 84, 91, '#2a1e14', 6, 2); P(M, 85, 93, '#2a1e14', 1, 7); P(M, 88, 93, '#2a1e14', 1, 7); P(M, 86, 93, '#ffb050', 2, 6); P(M, 84, 100, '#2a1e14', 6, 2);
  light(87, 96, 50, [255, 170, 90], .7, R() * 6, .5);

  // contract board: a cork board of pinned notices with wax seals
  P(M, 99, 27, '#24170d', 46, 46); P(M, 100, 28, '#3a2616', 44, 44); band(M, ['#5a4028', '#4e3722'], 31, 69, 38, 103);
  P(M, 110, 21, '#4a3424', 24, 5); P(M, 111, 22, '#2e1e12', 22, 3); for (const x of [113, 121, 129]) P(M, x, 23, '#a8863e');
  for (const [nx, ny, nw, nh] of [[105, 33, 11, 13], [118, 31, 10, 11], [130, 34, 11, 12], [106, 50, 12, 12], [120, 46, 10, 14], [132, 51, 9, 13]]) {
    const col = pk(['#d8c8a0', '#cbb88e', '#e0d2ae']);
    P(M, nx, ny, col, nw, nh); P(M, nx + nw - 1, ny + 1, darken(col, .8), 1, nh - 1); P(M, nx + 1, ny + nh - 1, darken(col, .8), nw - 1, 1);
    for (let ly = ny + 3; ly < ny + nh - 3; ly += 2) P(M, nx + 2, ly, '#8a7a5a', nw - 4 - Math.floor(R() * 3), 1);
    P(M, nx + nw - 4, ny + nh - 4, '#8a2a22', 2, 2); P(M, nx + Math.floor(nw / 2), ny, '#c9a24a');
  }

  // torches either side of the hearth
  for (const tx of [94, 226]) { P(M, tx - 1, 48, '#2a1e16', 3, 6); P(M, tx - 2, 47, '#4a3a2a', 5, 2); S.flames.push({ x: tx, y: 46, s: .9, still: true }); light(tx, 42, 100, [255, 140, 60], .85, R() * 6, .8); }

  // the hearth: a stone chimney breast, the charter banner, and the guild's fire
  for (let y = 8, r = 0; y < FLOOR; y += 6, r++) for (let x = 148 + (r % 2) * 5; x < 192; x += 10) { const w = Math.min(10, 192 - x); const base = pk(['#3e342c', '#3a3028', '#443830']); P(M, x, y, '#1a120c', w, 6); P(M, x + 1, y + 1, base, w - 1, 4); P(M, x + 1, y + 1, darken(base, 1.15), w - 1, 1); }
  P(M, 148, 8, '#1a120c', 1, FLOOR - 8); P(M, 191, 8, '#1a120c', 1, FLOOR - 8);
  charterBanner(M, 162, 12);
  P(M, 144, 44, '#5a4030', 52, 3); P(M, 144, 47, '#3a2818', 52, 2); P(M, 146, 49, '#1e140c', 48, 1);
  candle(150, 40); candle(190, 40);
  { const A = gothArch(170, 58, 13, 64); for (let y = 58; y < FLOOR; y++) { const a = A(y); if (a < 0) continue; for (let x = Math.round(170 - a); x <= 170 + a; x++) P(M, x, y, y < 66 ? '#120a06' : ((x + y) % 4 ? '#0c0705' : '#160c07')); } }
  P(M, 156, 90, '#1a1618', 2, 8); P(M, 182, 90, '#1a1618', 2, 8);
  P(M, 159, 93, '#3a2414', 22, 3); P(M, 162, 90, '#4a3018', 16, 3); P(M, 160, 96, '#ff6a1a', 20, 1); P(M, 164, 96, '#ffb050', 8, 1);
  for (const [fx, s] of [[164, 1.3], [170, 1.9], [176, 1.3]]) S.flames.push({ x: fx, y: 90, s, still: true });
  light(170, 80, 190, [255, 140, 60], 1.15, 1, 1.4);

  // steward's ledger: a lectern with the great book open, and a candle
  lineC(M, 206, 125, 206, 100, '#3a2616', 3); P(M, 199, 124, '#2a1c12', 15, 3); P(M, 201, 123, '#3a2616', 11, 1);
  P(M, 195, 94, '#4a3424', 23, 5); P(M, 196, 99, '#2e1e12', 21, 1);
  P(M, 196, 90, '#e0d2ae', 10, 5); P(M, 207, 90, '#d8c8a0', 10, 5); P(M, 206, 89, '#6a4a2a', 1, 6); P(M, 211, 94, '#8a2a22', 1, 5);
  for (let i = 0; i < 4; i++) { P(M, 197, 91 + i, '#8a7a5a', 7 - (i % 2), 1); P(M, 208, 91 + i, '#8a7a5a', 7 - ((i + 1) % 2), 1); }
  candle(217, 86);

  // map table: the realm's chart, rivers and red pins, a candle at the corner
  for (let yy = 0; yy < 10; yy++) { const x0 = Math.round(105 - yy * .5), x1 = Math.round(151 + yy * .5); P(M, x0, 117 + yy, '#4a3424', x1 - x0, 1); if (yy > 0 && yy < 9) for (let x = x0 + 3; x < x1 - 3; x++) P(M, x, 117 + yy, (x + yy) % 7 ? '#c8b48a' : '#b8a47a'); }
  lineC(M, 110, 119, 120, 122, '#5a7a8a'); lineC(M, 120, 122, 128, 125, '#5a7a8a'); lineC(M, 134, 118, 142, 124, '#3e6a3a');
  for (const [mx, my] of [[124, 119], [140, 121], [114, 123]]) { P(M, mx, my, '#7a6a4a', 3, 1); P(M, mx + 1, my - 1, '#7a6a4a'); }
  for (const [px, py] of [[118, 120], [136, 123], [146, 119]]) { P(M, px, py - 2, '#3a2616', 1, 2); P(M, px, py - 3, '#b02a20'); }
  P(M, 100, 127, '#2e1e12', 56, 3); P(M, 100, 130, '#1a110a', 56, 1); P(M, 103, 131, '#24170d', 3, 15); P(M, 150, 131, '#24170d', 3, 15);
  candle(153, 114);

  // the forge: a brick hood over glowing coals, the chimney above, an anvil in front
  for (let y = 6, r = 0; y < 44; y += 4, r++) for (let x = 246 + (r % 2) * 3; x < 262; x += 6) { P(M, x, y, '#1a100c', 6, 4); P(M, x + 1, y + 1, pk(['#3a2a22', '#33251e', '#40302a']), 5, 3); }
  for (let yy = 0; yy < 20; yy++) { const x0 = Math.round(240 - yy * .45), w = Math.round(28 + yy * .9); P(M, x0, 44 + yy, yy % 4 === 3 ? '#1a100c' : ((Math.floor((x0 + yy) / 6) % 2) ? '#3a2a22' : '#33251e'), w, 1); }
  P(M, 232, 64, '#4a3424', 46, 2); P(M, 235, 66, '#120a06', 40, 15);
  for (let i = 0; i < 70; i++) P(M, 237 + R() * 36, 74 + R() * 6, pk(['#ff6a1a', '#c23a14', '#ffb050', '#7a1a0a']));
  for (let y = 81, r = 0; y < FLOOR; y += 4, r++) for (let x = 233 + (r % 2) * 3; x < 277; x += 6) { P(M, x, y, '#1a100c', 6, 4); P(M, x + 1, y + 1, pk(['#3a2a22', '#33251e', '#40302a']), 5, 3); }
  for (const [fx, s] of [[244, .8], [254, 1], [264, .8]]) S.flames.push({ x: fx, y: 75, s, still: true });
  light(254, 72, 90, [255, 110, 40], 1, 2, 1);
  P(M, 250, 100, '#3a3c44', 18, 3); P(M, 248, 99, '#5a5e6a', 22, 2); P(M, 266, 100, '#4a4c56', 4, 1); P(M, 255, 103, '#2e3038', 8, 5); P(M, 252, 108, '#3a3c44', 14, 2);
  lineC(M, 252, 97, 258, 93, '#5e4228'); P(M, 257, 92, '#6a6e7a', 3, 2);

  // training dummy: straw on a post, a painted target
  lineC(M, 284, 146, 284, 118, '#4a3424', 2); P(M, 276, 144, '#3a2616', 17, 2);
  for (let y = 120; y < 136; y++) { const hw = y < 124 ? 4 + (y - 120) * .5 : 6 - Math.max(0, (y - 130) * .5); P(M, 284 - hw, y, (y % 4) ? '#a88a4a' : '#8a6e36', hw * 2 + 1, 1); }
  P(M, 278, 125, '#5a4428', 13, 1); P(M, 279, 131, '#5a4428', 11, 1); lineC(M, 274, 124, 294, 124, '#4a3424', 2);
  for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 16) P(M, 284 + x, 114 + y, x * x + y * y > 9 ? '#8a6e36' : '#b89a5a');
  P(M, 283, 127, '#8a2a22', 3, 3); P(M, 284, 128, '#d8c8a0');

  // stairs to the bunks, climbing to a moonlit landing
  P(M, 300, 0, '#0a0806', 19, 16);
  for (let i = 0; i < 12; i++) { const sx = 284 + i * 3, sy = FLOOR - (i + 1) * 7; P(M, sx, sy + 2, '#2a1c12', 4, FLOOR - sy - 2); P(M, sx, sy, '#7a5a40', 6, 1); P(M, sx, sy + 1, '#5a4030', 6, 1); P(M, sx, sy + 2, '#3a2818', 6, 5); }
  lineC(M, 284, 76, 318, 0, '#5a4030', 2); for (let i = 0; i < 12; i += 2) { const bx = 285 + i * 3, by = FLOOR - (i + 1) * 7; lineC(M, bx, by, bx, by - 14, '#3a2818'); }
  P(M, 296, 40, '#2a1e14', 5, 2); P(M, 297, 42, '#2a1e14', 1, 6); P(M, 300, 42, '#2a1e14', 1, 6); P(M, 298, 42, '#ffb050', 2, 5); P(M, 296, 48, '#2a1e14', 5, 2);
  light(299, 46, 70, [255, 170, 90], .75, R() * 6, .5);
  light(310, 8, 56, [120, 140, 200], .45);
  return S;
}

function sizeHall() {
  const w = hcv.clientWidth; if (!w) return; HALL.cw = w;
  const S = Math.max(1, Math.round(w * (window.devicePixelRatio || 1) / HW));
  if (S !== HALL.S || hcv.width !== HW * S) { HALL.S = S; hcv.width = HW * S; hcv.height = HH * S; }
}

function drawHall(dt) {
  if (!HALL.scene) HALL.scene = buildHall();
  if (hcv.clientWidth !== HALL.cw) sizeHall();
  const sc = HALL.scene, S = HALL.S, c = hcx; HALL.t += dt; const t = HALL.t;
  c.setTransform(S, 0, 0, S, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.imageSmoothingEnabled = false;
  c.drawImage(sc.mid, 0, 0);
  // heroes, with a shadow each and the idle bob of the battle sprites
  for (const p of HALL.people) {
    const F = SPR[p.uid]; if (!F) continue; const f = F[(Math.floor((t + p.ph * 3) / 560) % 2) ? 'idle1' : 'idle0'];
    c.globalAlpha = .45; c.fillStyle = '#000'; c.beginPath(); c.ellipse(p.x, p.y + .5, 7, 2, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    c.drawImage(f.n, Math.round(p.x - f.ax), Math.round(p.y - f.ay));
  }
  // light map: warm ambient plus every lamp, multiplied over the room
  const lite = PREFS.light, q = lite ? 4 : 2; // light graphics: a quarter-resolution light map
  if (!hlm) { [hlm, hlx] = mk(HW / 2, HH / 2); [hlq, hlqx] = mk(HW / 4, HH / 4); }
  const LM = lite ? hlq : hlm, LX = lite ? hlqx : hlx;
  LX.globalCompositeOperation = 'source-over'; LX.fillStyle = 'rgb(56,44,42)'; LX.fillRect(0, 0, HW / q, HH / q); LX.globalCompositeOperation = 'lighter';
  const lights = capLights(sc.lights.map(L => { const fl = L.fl != null && !REDUCED ? 1 + Math.sin(t * .011 + L.fl) * .1 + Math.sin(t * .037 + L.fl * 2) * .06 : 1; return { x: L.x, y: L.y, r: L.r * (.97 + fl * .03), c: L.c, i: L.i * fl, bloom: L.bloom }; }));
  for (const L of lights) { const g = LX.createRadialGradient(L.x / q, L.y / q, 0, L.x / q, L.y / q, L.r / q); g.addColorStop(0, rgba(L.c, Math.min(1, L.i))); g.addColorStop(.45, rgba(L.c, Math.min(1, L.i) * .42)); g.addColorStop(1, rgba(L.c, 0)); LX.fillStyle = g; LX.fillRect((L.x - L.r) / q, (L.y - L.r) / q, L.r * 2 / q, L.r * 2 / q); }
  c.globalCompositeOperation = 'multiply'; c.imageSmoothingEnabled = true; c.drawImage(LM, 0, 0, HW, HH); c.imageSmoothingEnabled = false;
  c.globalCompositeOperation = 'source-over';
  for (const f of sc.flames) drawFlame(c, f, t);
  // embers from the hearth and the forge, then bloom on the strong lights
  c.globalCompositeOperation = 'lighter';
  if (!REDUCED && HALL.embers.length < (lite ? 12 : 24) && rnd() < dt * (lite ? .003 : .006)) { const src = rnd() < .65 ? sc.hearth : sc.forge; HALL.embers.push({ x: src.x + (rnd() - .5) * src.w, y: src.y, vx: (rnd() - .5) * .1, vy: -.15 - rnd() * .2, life: 1 }); }
  for (let i = HALL.embers.length - 1; i >= 0; i--) {
    const e = HALL.embers[i]; e.x += e.vx * dt * .06 + Math.sin(t * .003 + i) * .04; e.y += e.vy * dt * .06; e.life -= dt * .0006;
    if (e.life <= 0 || e.y < 0) { HALL.embers.splice(i, 1); continue; }
    glow(c, e.x, e.y, 3, [255, 150, 60], .35 * e.life); c.fillStyle = rgba([255, 200, 110], e.life); c.fillRect(Math.round(e.x), Math.round(e.y), 1, 1);
  }
  if (!lite) for (const L of lights) if (L.bloom) glow(c, L.x, L.y, L.r * .35, L.c, .2 * L.bloom * Math.min(1, L.i));
  c.globalCompositeOperation = 'source-over';
  // screen space: vignette, grain, and the fade to black when the guild sleeps
  c.setTransform(1, 0, 0, 1, 0, 0); const w = hcv.width, h = hcv.height;
  const vg = c.createRadialGradient(w / 2, h * .55, h * .35, w / 2, h * .55, w * .62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(3,2,5,.72)'); c.fillStyle = vg; c.fillRect(0, 0, w, h);
  if (!REDUCED && !lite) { if (!grain) grain = makeGrain(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = .08; c.save(); c.translate(Math.floor(rnd() * 128), Math.floor(rnd() * 128)); c.fillStyle = c.createPattern(grain, 'repeat'); c.fillRect(-128, -128, w + 256, h + 256); c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
  if (HALL.fade) {
    const f = HALL.fade, [up, hold, down] = HALL_FADE; f.t += dt;
    const a = f.t < up ? f.t / up : f.t < up + hold ? 1 : 1 - (f.t - up - hold) / down;
    if (a <= 0) HALL.fade = null; else { c.fillStyle = `rgba(2,1,3,${a})`; c.fillRect(0, 0, w, h); }
  }
}
