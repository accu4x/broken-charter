/* ================= LAYERED SCENES ================= */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return [c, c.getContext('2d')]; }
function band(c, cols, y0, y1, w, x0) {
  x0 = x0 || 0;
  for (let y = Math.floor(y0); y < y1; y++) {
    const f = (y - y0) / Math.max(1, y1 - y0) * (cols.length - 1); const i = Math.floor(f), fr = f - i;
    for (let x = x0; x < x0 + w; x++) { const th = (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16; c.fillStyle = cols[Math.min(cols.length - 1, fr > th ? i + 1 : i)]; c.fillRect(x, y, 1, 1); }
  }
}
function P(c, x, y, col, w, h) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w || 1, h || 1); }
function lineC(c, x0, y0, x1, y1, col, w) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))); c.fillStyle = col; const ww = w || 1; for (let i = 0; i <= n; i++) { const t = i / n; c.fillRect(Math.round(x0 + (x1 - x0) * t - (ww - 1) / 2), Math.round(y0 + (y1 - y0) * t - (ww - 1) / 2), ww, ww); } }
function gothArch(cx, top, hw, spring) { return y => y < top ? -1 : y >= spring ? hw : hw * Math.pow((y - top) / (spring - top), .55); }
// The guild's banner: the broken charter, a ring of gold with a gap and a cross. 22 x 32 with its rod.
function charterBanner(M, bx, by) {
  P(M, bx - 3, by - 2, '#4a3624', 22, 2);
  for (let y = 0; y < 30; y++) for (let x = 0; x < 16; x++) { if (y > 24 && ((x * 7 + y * 3) % 5 < 2 || (x % 4 === 0 && y > 26))) continue; const sh = x < 2 ? '#7a2622' : x > 13 ? '#3e1212' : '#5c1a18'; P(M, bx + x, by + y, sh); }
  const ccx = bx + 8, ccy = by + 12; for (let a = 0; a < 48; a++) { const t = a / 48 * Math.PI * 2; if (t > .35 && t < 1.15) continue; P(M, ccx + Math.cos(t) * 5, ccy + Math.sin(t) * 5, '#a8863e'); }
  P(M, ccx, ccy - 3, '#a8863e', 1, 7); P(M, ccx - 3, ccy, '#a8863e', 7, 1); P(M, ccx + 4, ccy + 3, '#5c1a18');
}
function skull(c, x, y, col) { P(c, x, y, col, 4, 3); P(c, x + 1, y + 3, col, 2, 1); P(c, x, y + 1, '#120c0e'); P(c, x + 2, y + 1, '#120c0e'); }

function buildScene(key, aw, ah) {
  const R = mulberry(key.charCodeAt(0) * 131 + aw);
  const pick = a => a[Math.floor(R() * a.length)];
  const fw = Math.round((aw + 48) / 2), fh = Math.round(ah / 2);
  const [far, F] = mk(fw, fh), [mid, M] = mk(aw, ah), [fg, G] = mk(fw, fh);
  const S = { far, mid, fg, lights: [], flames: [], key };
  const groundY = Math.round(ah * .56);

  if (key === 'crypt') {
    S.ambient = [52, 44, 60]; S.grade = 'rgba(120,80,50,.22)'; S.fog = 'rgba(70,60,80,'; S.stage = [110, 90, 80];
    // FAR: receding vaulted corridor (soft)
    band(F, ['#07060a', '#0d0a10', '#141018', '#1a1520'], 0, fh, fw);
    for (let k = 0; k < 6; k++) {
      const s = 1 - k * .14, hw = fw * .2 * s, top = fh * (.08 + k * .07), spring = fh * (.32 + k * .05), base = fh * (.62 - k * .015);
      const ring = ['#1c1724', '#18141f', '#15111b', '#120f17', '#100d14', '#0e0b12'][k];
      const A = gothArch(fw / 2, top, hw + 3, spring + 2); const B = gothArch(fw / 2, top + 2, hw, spring);
      for (let y = Math.floor(top); y < base; y++) { const a = A(y), b = B(y); if (a < 0) continue; for (let x = Math.round(fw / 2 - a); x <= fw / 2 + a; x++) P(F, x, y, (b >= 0 && Math.abs(x - fw / 2) <= b) ? (k === 5 ? '#2a1e2e' : '#0b0910') : ring); }
    }
    for (let y = Math.round(fh * .62); y < fh; y++) { const p = (y - fh * .62) / (fh * .38); P(F, 0, y, p < .3 ? '#16121c' : '#120e16', fw, 1); }
    // MID: catacomb wall with central archway, ossuary niches, pillars
    const archTop = ah * .1, archSpring = ah * .3, archHW = aw * .13;
    const A = gothArch(aw / 2, archTop, archHW, archSpring), A2 = gothArch(aw / 2, archTop - 4, archHW + 5, archSpring);
    for (let y = 0, r = 0; y < groundY; y += 7, r++) {
      const off = (r % 2) * 7;
      for (let x = -off; x < aw; x += 14) {
        const base = pick(['#2a2430', '#28222e', '#2e2834', '#252029', '#2c2531']); const gr = y / groundY;
        P(M, x, y, '#110d14', 14, 7); P(M, x + 1, y + 1, base, 12, 5); P(M, x + 1, y + 1, darken(base, 1.18), 12, 1); P(M, x + 1, y + 5, darken(base, .75), 12, 1);
        if (R() < .25) { let cx = x + 2 + R() * 9, cy = y + 2; for (let i = 0; i < 3; i++) { P(M, cx, cy, '#151118'); cx += R() < .5 ? 1 : -1; cy += 1; } }
        if (R() < gr * .6) P(M, x + 1 + R() * 10, y + 4, pick(['#2e3a26', '#25301f', '#1d1a1e']), 2 + R() * 3, 1);
      }
    }
    // niches
    for (const side of [0, 1]) {
      const x0 = side ? aw * .74 : aw * .04, x1 = side ? aw * .96 : aw * .26;
      for (let ny = ah * .1; ny < groundY - 14; ny += 15) for (let nx = x0; nx < x1 - 10; nx += 13) {
        P(M, nx, ny + 2, '#08060a', 10, 9); P(M, nx + 1, ny + 1, '#08060a', 8, 1); P(M, nx + 2, ny, '#08060a', 6, 1);
        P(M, nx - 1, ny + 11, '#3a3340', 12, 1);
        const r = R(); if (r < .7) { skull(M, nx + 3, ny + 6, pick(['#8f8670', '#a39a82', '#7e7662'])); if (R() < .5) skull(M, nx + 6, ny + 7, '#6e6656'); }
        else if (r < .82) { S.flames.push({ x: nx + 5, y: ny + 9, s: .5, candle: true }); P(M, nx + 4, ny + 9, '#d8cdb0', 2, 2); S.lights.push({ x: nx + 5, y: ny + 7, r: 26, c: [255, 170, 90], i: .55, fl: R() * 6 }); }
      }
    }
    // central opening (show far layer through)
    for (let y = 0; y < groundY; y++) { const a = A2(y), b = A(y); if (a < 0) continue; for (let x = Math.round(aw / 2 - a); x <= aw / 2 + a; x++) { if (b >= 0 && Math.abs(x - aw / 2) <= b) M.clearRect(x, y, 1, 1); else P(M, x, y, (Math.floor((x + y) / 3) % 2) ? '#3a3342' : '#332d3b'); } }
    // pillars
    for (const px of [aw * .335, aw * .665]) {
      const x = Math.round(px - 5);
      P(M, x - 2, ah * .05, '#3e3746', 14, 4); P(M, x - 1, ah * .05 + 4, '#2a2430', 12, 2);
      for (let y = Math.round(ah * .05 + 6); y < groundY; y++) { P(M, x, y, '#3a3341', 10, 1); P(M, x, y, '#4a4252', 2, 1); P(M, x + 8, y, '#221d28', 2, 1); P(M, x + 4, y, '#332d3a', 1, 1); }
      P(M, x - 2, groundY - 4, '#3e3746', 14, 4);
      // sconce + torch
      const ty = Math.round(ah * .34); P(M, x + 3, ty, '#2a1e16', 4, 6); P(M, x + 2, ty - 1, '#4a3a2a', 6, 2);
      S.flames.push({ x: x + 5, y: ty - 2, s: 1 }); S.lights.push({ x: x + 5, y: ty - 5, r: 120, c: [255, 140, 60], i: 1.05, fl: R() * 6, bloom: 1 });
    }
    // banner hanging from arch apex — the broken charter
    charterBanner(M, Math.round(aw / 2 - 8), Math.round(archTop + 2));
    // chains
    for (const cxx of [aw * .2, aw * .8]) for (let y = 0; y < 26; y += 3) { P(M, cxx, y, '#4a4a52', 2, 2); P(M, cxx, y + 2, '#2a2a30', 2, 1); }
    // floor with perspective
    const vpx = aw / 2, vpy = ah * .28;
    for (let y = groundY; y < ah; y++) {
      const depth = (y - vpy) / (groundY - vpy); const rowF = Math.pow((y - groundY) / (ah - groundY), .62) * 7; const row = Math.floor(rowF);
      for (let x = 0; x < aw; x++) {
        const u = (x - vpx) / depth / (aw * .085); const col = Math.floor(u);
        const seamX = Math.abs(u - Math.round(u)) * depth * aw * .085 < .6, seamY = rowF - row < .09 * (1 + row * .1);
        let c = ((row + col) & 1) ? '#262029' : '#221c25';
        if (seamX || seamY) c = '#141016';
        else if ((x * 13 + y * 7 + col * 31) % 23 === 0) c = '#2c2530';
        P(M, x, y, c);
      }
    }
    P(M, 0, groundY, '#3a3340', aw, 1); P(M, 0, groundY + 1, '#0e0b10', aw, 1);
    for (let i = 0; i < 7; i++) { let x = R() * aw, y = groundY + 6 + R() * (ah - groundY - 8); for (let j = 0; j < 9; j++) { P(M, x, y, '#120e14'); x += R() * 2 - .5; y += R() - .5; } }
    for (let i = 0; i < 5; i++) { const x = R() * aw, y = groundY + 10 + R() * (ah - groundY - 14); for (let j = 0; j < 14; j++) P(M, x + (R() - .5) * 10, y + (R() - .5) * 4, '#2a1416'); }
    for (let i = 0; i < 12; i++) { const x = R() * aw, y = groundY + 4 + R() * (ah - groundY - 6); if (R() < .3) skull(M, x, y, '#7a725e'); else P(M, x, y, '#8a826c', 3, 1); }
    S.lights.push({ x: aw / 2, y: ah * .3, r: 70, c: [120, 70, 150], i: .45, fl: 0 });
    // FG soft: dark pillars at edges, cobwebs, rubble
    P(G, 0, 0, '#050407', 7, fh); P(G, fw - 7, 0, '#050407', 7, fh); P(G, 7, 0, '#0b090e', 2, fh); P(G, fw - 9, 0, '#0b090e', 2, fh);
    G.strokeStyle = 'rgba(190,185,200,.18)'; G.lineWidth = .6; for (let i = 0; i < 6; i++) { G.beginPath(); G.moveTo(7, i * 4); G.quadraticCurveTo(14 + i * 2, 6 + i * 3, 9 + i * 3, 0); G.stroke(); G.beginPath(); G.moveTo(fw - 7, i * 4); G.quadraticCurveTo(fw - 14 - i * 2, 6 + i * 3, fw - 9 - i * 3, 0); G.stroke(); }
    for (let i = 0; i < 18; i++) { const side = i % 2; const x = side ? fw - 6 - R() * 18 : 4 + R() * 18; P(G, x, fh - 2 - R() * 6, '#0a080c', 2 + R() * 4, 2 + R() * 3); }
  }

  if (key === 'thorn') {
    S.ambient = [46, 40, 58]; S.grade = 'rgba(110,50,60,.2)'; S.fog = 'rgba(60,40,50,'; S.stage = [90, 70, 70];
    band(F, ['#07050a', '#110a12', '#1e0f17', '#33141a', '#4e1c1c', '#6a2a1e'], 0, fh * .72, fw);
    const mx = fw * .72, my = fh * .22;
    for (let y = -10; y <= 10; y++) for (let x = -10; x <= 10; x++) { const d = x * x + y * y; if (d <= 100) P(F, mx + x, my + y, d > 80 ? '#8e6a58' : (x - y > 6 ? '#a88470' : '#c4a088')); }
    P(F, mx - 3, my - 2, '#9a7660', 3, 2); P(F, mx + 2, my + 3, '#9a7660', 2, 2);
    let hy = fh * .58; for (let x = 0; x < fw; x++) { hy += (R() - .5) * 1.4; hy = Math.max(fh * .5, Math.min(fh * .64, hy)); P(F, x, hy, '#140b12', 1, fh); }
    for (let i = 0; i < 26; i++) { const x = R() * fw, h = 6 + R() * 12, base = fh * .66; for (let j = 0; j < h; j++) P(F, x - j * .25, base - j, '#0c070c', Math.max(1, j * .5), 1); }
    P(F, 0, fh * .7, '#0c070c', fw, fh);
    // MID: gnarled trees, brambles, totem
    const tree = (x, y, ang, len, w, d) => { const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len; lineC(M, x, y, x1, y1, '#120c12', Math.max(1, Math.round(w))); if (w > 2) lineC(M, x - w / 2 + .5, y, x1 - w / 2 + .5, y1, '#2a1e24', 1); if (R() < .5) P(M, x1 + 1, y1, '#120c12'); if (d > 0) { const n = 2 + (R() < .3 ? 1 : 0); for (let i = 0; i < n; i++) tree(x1, y1, ang + (R() - .5) * 1.4 + (i - (n - 1) / 2) * .5, len * (.62 + R() * .15), w * .62, d - 1); } };
    for (const [tx, s] of [[.04, 1.2], [.15, .8], [.86, .9], [.97, 1.25], [.27, .55], [.72, .6]]) { const x = aw * tx, y = groundY + 2; tree(x, y, -Math.PI / 2 + (R() - .5) * .3, 30 * s, 6 * s, 4); lineC(M, x, y, x - 6 * s, y + 3, '#120c12', 2); lineC(M, x, y, x + 7 * s, y + 3, '#120c12', 2); }
    for (let x = 0; x < aw; x += 1) { if (R() < .55) { const h = R() * 9; lineC(M, x, groundY + 1, x + (R() - .5) * 6, groundY + 1 - h, '#140d12'); } }
    { const tx = Math.round(aw * .5), ty = groundY - 4; lineC(M, tx, ty + 4, tx, ty - 26, '#3a2a1e', 2); lineC(M, tx - 6, ty - 18, tx + 6, ty - 18, '#3a2a1e', 1); skull(M, tx - 1, ty - 30, '#a39a82'); P(M, tx - 6, ty - 17, '#7a2a20', 1, 5); P(M, tx + 6, ty - 17, '#7a2a20', 1, 4); P(M, tx + 5, ty - 13, '#c9b88a', 1, 2); }
    // ground
    for (let y = groundY; y < ah; y++) for (let x = 0; x < aw; x++) {
      const p = (y - groundY) / (ah - groundY); const path = Math.abs(x - aw / 2) < aw * (.12 + p * .5); const th = (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16;
      let c = path ? (th < .5 ? '#241c16' : '#211913') : (th < .5 ? '#1a1612' : '#17140f'); if ((x * 31 + y * 17) % 37 === 0) c = '#2c2218'; P(M, x, y, c);
    }
    for (let i = 0; i < 9; i++) { let x = R() * aw, y = groundY + 4 + R() * (ah - groundY - 6), a = R() * 6; for (let j = 0; j < 22; j++) { P(M, x, y, '#120d0a', 2, 1); x += Math.cos(a); y += Math.sin(a) * .3; a += (R() - .5) * .6; } }
    for (let i = 0; i < 160; i++) P(M, R() * aw, groundY + 2 + R() * (ah - groundY), pick(['#4a2a1a', '#3a2214', '#5a3a1e', '#2e2a1a']), 1 + (R() < .3 ? 1 : 0), 1);
    for (let i = 0; i < 70; i++) { const x = R() * aw, y = groundY + 2 + R() * (ah - groundY); P(M, x, y - 2, '#1e2a1a', 1, 2); P(M, x + 1, y - 3, '#2a3a22', 1, 3); }
    // campfire between the lines
    { const cx = Math.round(aw / 2), cy = Math.round(ah * .74); for (let a = 0; a < 10; a++) { const t = a / 10 * Math.PI * 2; P(M, cx + Math.cos(t) * 7 - 1, cy + Math.sin(t) * 2.5, '#3a3436', 3, 2); } lineC(M, cx - 5, cy + 1, cx + 5, cy - 1, '#3a2614', 2); lineC(M, cx - 4, cy - 1, cx + 4, cy + 1, '#4a3018', 2); P(M, cx - 3, cy - 1, '#ff8a2a', 6, 1);
      S.flames.push({ x: cx, y: cy - 1, s: 1.8, fire: true }); S.lights.push({ x: cx, y: cy - 6, r: 160, c: [255, 130, 50], i: 1.15, fl: 1, bloom: 1.4 }); }
    S.lights.push({ x: (mx * 2) - 24, y: my * 2, r: 240, c: [140, 110, 150], i: .35, fl: 0 });
    // FG: thorn branches + grass
    const thorn = (x, y, ang, len, w, d) => { const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len; lineC(G, x, y, x1, y1, '#050306', Math.max(1, Math.round(w))); for (let i = 0; i < len / 3; i++) { const t = R(); P(G, x + (x1 - x) * t + (R() - .5) * 2, y + (y1 - y) * t + (R() - .5) * 2, '#050306'); } if (d > 0) for (let i = 0; i < 2; i++) thorn(x1, y1, ang + (R() - .5) * 1.2, len * .65, w * .6, d - 1); };
    thorn(0, 2, .5, 22, 4, 3); thorn(fw, 0, Math.PI - .4, 24, 4, 3); thorn(0, fh * .5, -.2, 12, 3, 2);
    for (let x = 0; x < fw; x++) { const edge = Math.min(x, fw - x) / fw; if (R() < .8 - edge * 1.6) lineC(G, x, fh, x + (R() - .5) * 4, fh - 3 - R() * 10 * (1 - edge * 2), '#060407'); }
  }

  if (key === 'mire') {
    S.ambient = [50, 60, 62]; S.grade = 'rgba(60,110,100,.18)'; S.fog = 'rgba(150,175,165,'; S.stage = [80, 90, 85];
    band(F, ['#0a0f10', '#121a1a', '#1c2626', '#283432', '#36433e', '#44524a'], 0, fh * .7, fw);
    for (let i = 0; i < 9; i++) { const x = R() * fw, h = 10 + R() * 16, base = fh * .66; lineC(F, x, base, x + (R() - .5) * 3, base - h, '#1a2422', 1); lineC(F, x, base - h * .6, x - 4, base - h * .8, '#1a2422'); lineC(F, x, base - h * .4, x + 5, base - h * .65, '#1a2422'); }
    let hy = fh * .62; for (let x = 0; x < fw; x++) { hy += (R() - .5) * .9; hy = Math.max(fh * .58, Math.min(fh * .66, hy)); P(F, x, hy, '#161e1e', 1, fh); }
    // MID: ruined settler embankment, dead trees with moss, stilt hut
    const wallY = Math.round(ah * .47);
    for (let x = 0; x < aw; x += 8) { const broken = (x > aw * .4 && x < aw * .58) || R() < .12; const h = broken ? 3 + R() * 6 : 12 + R() * 3; for (let r = 0; r < h; r += 4) { const c = pick(['#2a302c', '#262c28', '#2e3430']); P(M, x + ((r / 4) % 2) * 4, wallY + 14 - r, '#121614', 8, 4); P(M, x + 1 + ((r / 4) % 2) * 4, wallY + 15 - r, c, 6, 2); P(M, x + 1 + ((r / 4) % 2) * 4, wallY + 15 - r, darken(c, 1.2), 6, 1); } if (R() < .4) P(M, x + 2, wallY + 14 - h + 2, '#2e4a2a', 3, 2); }
    const dtree = (x, s) => { const y = groundY + 4; lineC(M, x, y, x + 2, y - 40 * s, '#121816', Math.round(4 * s)); for (let b = 0; b < 4; b++) { const by = y - (16 + b * 7) * s, dir = b % 2 ? 1 : -1, len = (12 - b * 2) * s; lineC(M, x + 1, by, x + 1 + dir * len, by - len * .5, '#121816', Math.max(1, Math.round(2 * s - b * .3))); for (let m = 0; m < 4; m++) { const mx2 = x + 1 + dir * len * (m + 1) / 5; lineC(M, mx2, by - len * .5 * (m + 1) / 5, mx2 + (R() - .5), by - len * .5 * (m + 1) / 5 + 4 + R() * 10 * s, R() < .5 ? '#34442e' : '#2a3a26'); } } };
    dtree(aw * .07, 1.1); dtree(aw * .93, 1.05); dtree(aw * .3, .6); dtree(aw * .68, .55);
    { const hx = Math.round(aw * .52), hy = Math.round(ah * .4); for (const sx of [-8, -2, 4, 9]) lineC(M, hx + sx, hy + 10, hx + sx, groundY + 6, '#1a1612', 1); P(M, hx - 11, hy - 2, '#221c16', 24, 12); for (let i = 0; i < 14; i++) P(M, hx - 13 + i * 2, hy - 3 - Math.min(i, 13 - i) * .9, '#2e2a1e', 3, 2); P(M, hx + 2, hy + 2, '#ffb460', 3, 3); P(M, hx + 3, hy + 2, '#fff0b0', 1, 2);
      S.lights.push({ x: hx + 3, y: hy + 3, r: 60, c: [255, 170, 90], i: .8, fl: R() * 6, bloom: .6 }); S.hut = { x: hx + 3, y: hy + 3 }; }
    // water + islands
    for (let y = groundY; y < ah; y++) for (let x = 0; x < aw; x++) { const th = (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16; const p = (y - groundY) / (ah - groundY); P(M, x, y, p * .8 + th * .3 < .45 ? '#1a2a2c' : '#132022'); }
    for (let i = 0; i < 50; i++) P(M, R() * aw, groundY + R() * (ah - groundY), pick(['#26403e', '#1f3434']), 3 + R() * 9, 1);
    const isl = (cx, cy, rw, rh) => { for (let y = -rh; y <= rh; y++) { const hw = rw * Math.sqrt(1 - (y * y) / (rh * rh)) * (1 + Math.sin(y * 1.7) * .03); for (let x = -hw; x <= hw; x++) { const th = (BAYER[((y + 64) & 3) * 4 + ((Math.round(x) + 64) & 3)] + .5) / 16; P(M, cx + x, cy + y, y < -rh + 2 ? '#3a4230' : y > rh - 2 ? '#191c14' : (th < .5 ? '#2a2e20' : '#26291c')); } } };
    isl(aw * .23, ah * .79, aw * .22, ah * .15); isl(aw * .77, ah * .79, aw * .22, ah * .15);
    for (let i = 0; i < 70; i++) { const side = R() < .5 ? .23 : .77; const rx = aw * side + (R() - .5) * aw * .46, base = ah * (.68 + R() * .26), rh = 3 + R() * 9; lineC(M, rx, base, rx + (R() - .5) * 2, base - rh, pick(['#3a5030', '#4a6236', '#2e4226'])); if (R() < .25) P(M, rx, base - rh - 2, '#4a301e', 1, 2); }
    for (let i = 0; i < 10; i++) { const lx = aw * (.4 + R() * .2), ly = groundY + 6 + R() * (ah - groundY - 10); P(M, lx, ly, '#2e5034', 5, 1); P(M, lx + 1, ly - 1, '#3a6040', 3, 1); }
    S.wisps = [0, 1, 2].map(i => ({ x: aw * (.42 + i * .08), y: ah * (.6 + i * .05), p: i * 2.1 }));
    // FG: hanging moss + reeds
    for (let x = 0; x < fw; x += 2) { const edge = Math.min(x, fw - x) / fw; const len = R() * 16 * Math.max(0, 1 - edge * 3.2); if (len > 1) lineC(G, x, 0, x + (R() - .5) * 2, len, R() < .5 ? '#0c140e' : '#101a12'); }
    for (let x = 0; x < fw; x++) { const edge = Math.min(x, fw - x) / fw; if (R() < .7 - edge * 2) lineC(G, x, fh, x + (R() - .5) * 3, fh - 4 - R() * 12, '#07100a'); }
  }
  // a small soft light that follows the party, so they read in the dark
  S.partyLight = { r: aw * .32 };
  return S;
}
function sceneThumb(key) {
  const aw = 240, ah = 144; const sc = buildScene(key, aw, ah); const [c, x] = mk(aw, ah);
  x.imageSmoothingEnabled = true; x.drawImage(sc.far, -24, 0, aw + 48, ah); x.imageSmoothingEnabled = false; x.drawImage(sc.mid, 0, 0);
  return c.toDataURL();
}
