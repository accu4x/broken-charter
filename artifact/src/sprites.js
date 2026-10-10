/* ================= PIXEL SPRITE TOOLKIT ================= */
const hexCache = {};
function hex(h) { if (hexCache[h]) return hexCache[h]; const n = parseInt(h.slice(1, 7), 16); return hexCache[h] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; }
function hsl2hex(h, s, l) { h = ((h % 1) + 1) % 1; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l)); const f = n => { const k = (n + h * 12) % 12; const a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; return '#' + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join(''); }
const RAMPS = {};
function ramp(c) {
  if (RAMPS[c]) return RAMPS[c];
  const [r, g, b] = hex(c); const [h, s, l] = rgb2hsl(r, g, b);
  const tw = (h0, t, a) => { const d = ((t - h0 + 1.5) % 1) - .5; return h0 + d * a; };
  return RAMPS[c] = [hsl2hex(tw(h, .11, .1), s * .92, l + .11), c, hsl2hex(tw(h, .7, .1), Math.min(1, s * .95 + .03), l - .1), hsl2hex(tw(h, .72, .18), Math.min(1, s * .9 + .05), l - .18)];
}
function darken(c, k) { const [r, g, b] = hex(c); const [h, s, l] = rgb2hsl(r, g, b); return hsl2hex(h, s * .8, l * k); }

function Grid(w, h) {
  const g = { w, h, p: new Array(w * h).fill(null), glows: [] };
  g.px = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (c && x >= 0 && y >= 0 && x < w && y < h) g.p[y * w + x] = c; return g; };
  g.clr = (x, y) => { if (x >= 0 && y >= 0 && x < w && y < h) g.p[y * w + x] = null; };
  g.get = (x, y) => (x >= 0 && y >= 0 && x < w && y < h) ? g.p[y * w + x] : null;
  g.rect = (x, y, ww, hh, c) => { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) g.px(x + i, y + j, c); return g; };
  g.ell = (cx, cy, rx, ry, c) => { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy <= 1.02) g.px(x, y, c); } return g; };
  g.line = (x0, y0, x1, y1, wd, c, w1) => {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; const ww = Math.max(1, Math.round(w1 == null ? wd : wd + (w1 - wd) * t));
      const o = Math.floor((ww - 1) / 2); for (let a = 0; a < ww; a++) for (let b = 0; b < ww; b++) g.px(Math.round(x) - o + a, Math.round(y) - o + b, c);
    }
    return g;
  };
  return g;
}
// light from upper-left; hue-shifted 4-tone ramps; '!' prefix = exact colour (no shading)
function shade(g) {
  const o = g.p.slice();
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const i = y * g.w + x, c = g.p[i]; if (!c) continue;
    if (c[0] === '!') { o[i] = c.slice(1); continue; }
    const same = (xx, yy) => g.get(xx, yy) === c;
    const t = !same(x, y - 1), l = !same(x - 1, y), b = !same(x, y + 1), r = !same(x + 1, y);
    let hi = t || l, lo = b || r;
    if (l && r) { hi = t; lo = b; }
    if (t && b) { hi = l; lo = r; }
    const R = ramp(c);
    o[i] = hi && !lo ? R[0] : (hi && lo) ? R[1] : lo ? ((b && r) ? R[3] : R[2]) : R[1];
  }
  g.p = o;
}
const OUTK = '#0b0710';
function selout(g) {
  const o = g.p.slice(); g.out = new Set();
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const i = y * g.w + x; if (g.p[i]) continue;
    const n = g.get(x, y + 1) || g.get(x - 1, y) || g.get(x + 1, y) || g.get(x, y - 1);
    if (n) { const [r, gg, b] = hex(n); o[i] = '#' + [r * .22 + 11 * .78, gg * .22 + 7 * .78, b * .22 + 16 * .78].map(v => Math.round(v).toString(16).padStart(2, '0')).join(''); g.out.add(i); }
  }
  g.p = o;
}
function toCanvas(g, flip, mode, side) {
  const c = document.createElement('canvas'); c.width = g.w; c.height = g.h;
  const x = c.getContext('2d'); const id = x.createImageData(g.w, g.h);
  for (let y = 0; y < g.h; y++) for (let i = 0; i < g.w; i++) {
    const sx = flip ? g.w - 1 - i : i; const si = y * g.w + sx; const col = g.p[si]; if (!col) continue;
    if (mode === 'rim') {
      if (g.out.has(si)) continue;
      const nx = side === 'R' ? sx + 1 : sx - 1; const ni = y * g.w + nx;
      if (!(nx < 0 || nx >= g.w || !g.p[ni] || g.out.has(ni))) continue;
    }
    const [r, gg, b] = mode ? [255, 255, 255] : hex(col); const k = (y * g.w + i) * 4;
    id.data[k] = r; id.data[k + 1] = gg; id.data[k + 2] = b; id.data[k + 3] = 255;
  }
  x.putImageData(id, 0, 0); return c;
}

/* ---------- humanoid rig (faces right) ---------- */
function humanoid(o, pose) {
  const W = o.gw || 32, H = o.gh || 38; const g = Grid(W, H);
  const gy = H - 3, cx = o.cx != null ? o.cx : 14;
  const legH = o.legH || 10, torsoH = o.torsoH || 10, headH = o.headH || 8, headW = o.headW || 8, shW = o.shW || 10, hunch = o.hunch || 0, limb = o.limb || 2, legW = o.legW || 3;
  const k = pose.k; const b = k === 'idle1' ? 1 : 0; const lean = k === 'hurt' ? -1 : k === 'strike' ? 1 : 0;
  const hipY = gy - legH; const tTop = hipY - torsoH + b + (o.float ? -1 : 0);
  const hx0 = cx - Math.floor(headW / 2) + hunch + lean + (o.headFwd || 0) + 1;
  const hy0 = tTop - headH + 1 + Math.max(0, hunch - 1) + (o.neck || 0);
  const hx1 = hx0 + headW - 1, eyeY = hy0 + Math.floor(headH / 2);
  const shF = [cx + Math.floor(shW / 2) + hunch + lean, tTop + 2], shB = [cx - Math.floor(shW / 2) + 2 + hunch + lean, tTop + 2];
  const arm = k === 'wind' ? 'up' : k === 'strike' ? 'fwd' : 'rest';
  let hand;
  if (o.caster) hand = arm === 'up' ? [shF[0] + 1, tTop - 2] : arm === 'fwd' ? [shF[0] + 5, tTop + 2] : [shF[0] + 2, tTop + torsoH - 3];
  else hand = arm === 'up' ? [shF[0] - 1, tTop - 4] : arm === 'fwd' ? [shF[0] + 6, tTop + 4] : [shF[0] + 2, tTop + torsoH - 2];
  if (o.claws && arm === 'rest') hand = [shF[0] + 3, tTop + torsoH - 1];
  const handB = [shB[0] - 2, tTop + torsoH - 3];
  let ang = arm === 'up' ? -2.55 : arm === 'fwd' ? (o.thrust ? -.05 : .35) : -1.2;
  if (o.caster) ang = arm === 'rest' ? -1.5 : arm === 'up' ? -1.9 : -1.1;
  const sk = o.skin, body = o.body;
  const R = mulberry(o.seed || 11);

  // tail
  if (o.tail) g.line(cx - 1, hipY + 1, cx - 9, gy - 1 + (b ? 0 : 0), 3, sk, 1);
  // cape (behind)
  if (o.cape) {
    const top = tTop + 2, bot = o.float ? gy - 6 : gy - 3;
    for (let y = top; y <= bot; y++) { const p = (y - top) / (bot - top); const x0 = shB[0] - 1 - Math.round(p * 4 + (k === 'strike' ? p * 2 : 0)); const x1 = cx + 1; for (let x = x0; x <= x1; x++) g.px(x, y, o.cape); }
    for (let x = shB[0] - 8; x <= cx + 1; x++) { const d = Math.floor(R() * 4); for (let j = 0; j < d; j++) g.clr(x, bot - j); }
  }
  // back arm + offhand
  g.line(shB[0], shB[1], handB[0], handB[1], limb, '!' + ramp(o.sleeve || body)[2]);
  g.rect(handB[0] - 1, handB[1], 2, 2, '!' + ramp(o.glove || sk)[2]);
  if (o.shield) {
    const sx = shB[0] - 5, sy = tTop + 1;
    for (let r = 0; r < 12; r++) { const hw = r < 7 ? 3 : Math.max(0, 3 - Math.ceil((r - 6) / 1.6)); for (let x = -hw; x <= hw; x++) g.px(sx + x, sy + r, (Math.abs(x) === hw || r === 0) ? o.trim : o.shield); }
    g.rect(sx, sy + 2, 1, 6, '!' + ramp(o.trim)[0]); g.rect(sx - 2, sy + 4, 5, 1, '!' + ramp(o.trim)[0]);
  }
  if (o.offDagger) g.line(handB[0], handB[1] + 1, handB[0] + 3, handB[1] + 4, 1, '!#b8bcc8');
  // legs
  if (o.float) {
    const top = hipY - 2, bot = gy - 3;
    for (let y = top; y <= bot; y++) { const p = (y - top) / (bot - top); const hw = Math.round(shW / 2 + p * 2); for (let x = cx - hw + 1 + hunch; x <= cx + hw - 1 + hunch; x++) g.px(x, y, o.robeC || body); }
    for (let x = cx - Math.round(shW / 2) - 2; x <= cx + Math.round(shW / 2) + 3; x++) { const d = 1 + Math.floor(R() * 5); for (let j = 0; j < d; j++) g.clr(x, bot - j); if (R() < .4) g.px(x, bot + 1, o.robeC || body); }
  } else if (o.robe) {
    const top = hipY - 1, bot = gy - 1;
    for (let y = top; y <= bot; y++) { const p = (y - top) / (bot - top); const hw = Math.round((shW - 2) / 2 + p * 2.5); for (let x = cx - hw + 1; x <= cx + hw + 1; x++) g.px(x, y, o.robeC || body); }
    g.rect(cx - 2, gy - 1, 3, 2, o.boots); g.rect(cx + 2, gy - 1, 3, 2, o.boots);
    if (o.trim) for (let y = top + 1; y <= bot; y++) g.px(cx + 1, y, o.trim);
    for (let x = cx - 5; x <= cx + 7; x++) if (R() < .35) g.clr(x, bot);
  } else {
    const stride = k === 'strike' ? 1 : 0;
    const bx = cx - legW + 1 - stride, fx = cx + 1 + stride;
    g.rect(bx, hipY + 1, legW, legH - 2, '!' + ramp(o.legs)[2]);
    g.rect(fx, hipY + 1, legW, legH - 2, o.legs);
    if (o.kneeC) { g.rect(fx, hipY + Math.floor(legH / 2) - 1, legW, 2, o.kneeC); }
    g.rect(bx - 1, gy - 1, legW + 1, 2, '!' + ramp(o.boots)[2]); g.rect(fx, gy - 1, legW + 2, 2, o.boots); g.px(fx + legW + 1, gy - 1, null);
  }
  // torso
  for (let y = tTop; y <= hipY; y++) {
    const p = (y - tTop) / Math.max(1, hipY - tTop); const wd = Math.round(shW - (y - tTop < 2 ? 0 : p * (shW - (o.waistW || shW - 2))));
    const xo = Math.round(hunch * (1 - p)) + lean; const x0 = cx - Math.floor(wd / 2) + 1 + xo;
    for (let x = x0; x < x0 + wd; x++) g.px(x, y, body);
  }
  const ch = o.chest;
  if (ch === 'plate') { g.ell(shF[0] - 1, tTop + 1, 2.4, 2, o.metal); g.ell(shB[0] + 1, tTop + 1, 2.2, 1.8, '!' + ramp(o.metal)[2]); for (let y = tTop + 3; y <= hipY + 3; y++) g.rect(cx - 1 + lean + (y < hipY ? Math.round(hunch * (1 - (y - tTop) / torsoH)) : 0), y, 4, 1, o.tabard); g.px(cx + lean, tTop + 6, '!#c9963e'); g.px(cx + 1 + lean, tTop + 5, '!#c9963e'); g.px(cx + 1 + lean, tTop + 7, '!#c9963e'); g.px(cx + 2 + lean, tTop + 6, '!#c9963e'); }
  if (ch === 'leather') { for (let i = 0; i < torsoH; i++) g.px(shB[0] + 1 + Math.round(i * (shW - 3) / torsoH), tTop + i, o.strap); if (o.fur) { g.ell(shF[0] - 1, tTop + 1, 3, 2, o.fur); g.ell(shB[0] + 2, tTop, 3, 1.6, o.fur); } }
  if (ch === 'scarf') { g.rect(cx - 2 + lean, tTop, shW - 2, 2, o.scarf); g.line(shB[0], tTop + 1, shB[0] - 3, tTop + 5 + b, 2, o.scarf); }
  if (ch === 'robe') { g.rect(cx + 1 + lean, tTop + 1, 1, torsoH, o.trim); g.rect(cx - 2 + lean, tTop, 6, 1, o.trim); }
  if (ch === 'ribs') { for (let y = tTop + 1; y < hipY - 1; y += 2) for (let x = cx - 2 + lean; x <= cx + 3 + lean; x++) g.px(x, y, '!#2a2420'); for (let y = tTop; y <= hipY; y++) g.px(cx + 1 + lean, y, o.body); }
  if (ch === 'rags') { for (let i = 0; i < 6; i++) g.px(cx - 3 + Math.floor(R() * 7) + lean, tTop + 2 + Math.floor(R() * (torsoH - 2)), '!' + ramp(body)[3]); }
  if (o.belt) { g.rect(cx - Math.floor((o.waistW || shW - 2) / 2) + 1 + lean, hipY, (o.waistW || shW - 2), 1, o.belt); g.px(cx + 1 + lean, hipY, '!#b8903e'); }
  if (o.belly) { g.ell(cx + 2 + lean, tTop + torsoH - 4, 2, 2.5, '!' + o.belly); g.px(cx + 2 + lean, tTop + torsoH - 5, '!#eaffc0'); g.glows.push({ x: cx + 2 + lean, y: tTop + torsoH - 4, c: o.belly, r: 18 }); }

  // head
  const head = o.head;
  if (head !== 'void') {
    for (let y = hy0; y < hy0 + headH; y++) for (let x = hx0; x <= hx1; x++) { if ((x === hx0 || x === hx1) && (y === hy0 || y === hy0 + headH - 1)) continue; g.px(x, y, sk); }
  }
  const skD = '!' + ramp(sk)[3], skM = '!' + ramp(sk)[2];
  const eyeC = o.eye ? '!' + o.eye : '!#1a1018';
  const face = () => {
    g.px(hx1 - 3, eyeY, eyeC); g.px(hx1 - 1, eyeY, eyeC);
    g.px(hx1 - 3, eyeY - 1, skM); g.px(hx1 - 2, eyeY - 1, skM); g.px(hx1 - 1, eyeY - 1, skM);
    g.px(hx1 + 1, eyeY + 1, sk); g.px(hx1, eyeY + 1, sk);
    g.px(hx1 - 2, eyeY + 2 + (headH > 8 ? 1 : 0), skD); g.px(hx1 - 1, eyeY + 2 + (headH > 8 ? 1 : 0), skD);
    if (o.scar) { g.px(hx1 - 2, eyeY + 1, '!#7a3a34'); g.px(hx1 - 3, eyeY + 2, '!#7a3a34'); }
  };
  if (head === 'short' || head === 'long' || head === 'topknot' || head === 'bald') {
    face();
    if (head !== 'bald') {
      g.rect(hx0, hy0 - 1, headW - 1, 3, o.hair); g.rect(hx0 - 1, hy0 + 1, 3, Math.max(3, headH - 3), o.hair); g.px(hx1 - 1, hy0 + 2, o.hair); g.px(hx1, hy0 + 1, o.hair);
      if (head === 'long') g.rect(hx0 - 2, hy0 + 2, 3, headH + 4, o.hair);
      if (head === 'topknot') { g.rect(hx0 + 2, hy0 - 3, 3, 2, o.hair); g.px(hx0 + 1, hy0 - 4, o.hair); }
    }
    g.px(hx0 + 2, eyeY + 1, skM);
  }
  if (head === 'helm') {
    g.rect(hx0 - 1, hy0 - 1, headW + 2, eyeY - hy0 + 1, o.metal);
    g.rect(hx0 - 1, eyeY, 4, headH - (eyeY - hy0), o.metal);
    g.rect(hx1 - 2, eyeY, 3, headH - (eyeY - hy0), o.metal);
    g.rect(hx0 + 2, eyeY, headW - 1, 1, '!#09060b'); g.rect(hx1 - 2, eyeY, 1, 3, '!#09060b');
    g.px(hx1 - 1, eyeY, '!#d9cfb4'); g.px(hx0 + 1, hy0 - 2, o.metal); g.px(hx0 + 2, hy0 - 2, o.metal); g.px(hx0 + 3, hy0 - 2, o.metal);
    for (let x = hx0; x < hx1; x += 2) g.px(x, eyeY - 2, '!' + ramp(o.metal)[2]);
  }
  if (head === 'hood' || head === 'wraith') {
    const hc = o.hood;
    g.rect(hx0 - 1, hy0 - 2, headW + 1, 4, hc); g.px(hx1 + 1, hy0, hc); g.px(hx1 + 1, hy0 + 1, hc); g.px(hx1 + 2, hy0 + 1, hc);
    g.rect(hx0 - 2, hy0, 4, headH + 3, hc);
    for (let y = hy0 + 2; y < eyeY + 1; y++) for (let x = hx0 + 2; x <= hx1; x++) if (g.get(x, y) === sk) g.px(x, y, head === 'wraith' ? '!#05030a' : '!' + darken(sk, .55));
    if (head === 'wraith') { for (let y = hy0 + 2; y < hy0 + headH; y++) for (let x = hx0 + 2; x <= hx1; x++) g.px(x, y, '!#05030a'); g.px(hx1 - 3, eyeY, '!' + o.eye); g.px(hx1 - 1, eyeY, '!' + o.eye); g.glows.push({ x: hx1 - 2, y: eyeY, c: o.eye, r: 16 }); }
    else { face(); g.px(hx1 - 3, eyeY, '!#c9c1a5'); g.px(hx1 - 1, eyeY, '!#c9c1a5'); for (let x = hx0 + 2; x <= hx1; x++) g.px(x, eyeY - 1, '!' + darken(sk, .45)); }
  }
  if (head === 'hat') {
    face(); g.rect(hx0 - 1, hy0 + 1, 3, headH - 2, o.hair);
    g.rect(hx0 - 3, hy0, headW + 6, 1, o.hat); g.rect(hx0 - 2, hy0 + 1, headW + 4, 1, '!' + ramp(o.hat)[3]);
    for (let j = 1; j <= 7; j++) { const w = Math.max(1, headW - 1 - j); const x0 = hx0 + 1 + Math.floor(j / 3) - Math.floor(j * j / 14); g.rect(x0, hy0 - j, w, 1, o.hat); }
    g.rect(hx0, hy0 - 1, headW - 1, 1, o.trim);
  }
  if (head === 'skull' || head === 'skullhelm') {
    for (let x = hx0 + 1; x < hx1; x++) g.px(x, hy0 + headH - 1, null);
    g.rect(hx1 - 4, eyeY - 1, 2, 2, '!#120808'); g.rect(hx1 - 1, eyeY - 1, 2, 2, '!#120808');
    g.px(hx1 - 4, eyeY, '!' + (o.eye || '#ff4a3a')); g.px(hx1 - 1, eyeY, '!' + (o.eye || '#ff4a3a'));
    g.glows.push({ x: hx1 - 2, y: eyeY, c: o.eye || '#ff4a3a', r: 14 });
    g.px(hx1, eyeY + 2, '!#120808');
    for (let x = hx1 - 4; x <= hx1; x += 2) g.px(x, hy0 + headH - 2, '!#120808');
    g.rect(hx1 - 4, hy0 + headH - 1, 5, 1, sk);
    if (head === 'skullhelm') {
      g.rect(hx0 - 1, hy0 - 2, headW + 2, eyeY - hy0, o.metal); g.rect(hx0 - 1, eyeY - 2, 3, headH - 1, o.metal);
      for (let i = 0; i < 5; i++) g.px(hx0 + 1 + i * 2, hy0 - 3 - (i % 2), o.metal);
    }
  }
  if (head === 'goblin' || head === 'mask') {
    face(); g.px(hx1 - 3, eyeY, '!#e8d04a'); g.px(hx1 - 1, eyeY, '!#e8d04a');
    g.line(hx0, eyeY - 1, hx0 - 5, eyeY - 4, 2, sk, 1); g.line(hx1 - 1, hy0 + 1, hx1 + 2, hy0 - 2, 1, sk);
    g.px(hx1 + 1, eyeY + 1, sk); g.px(hx1 + 2, eyeY + 2, sk); g.px(hx1 + 1, eyeY + 2, sk);
    g.px(hx1 - 2, eyeY + 3, '!#e8e0c8'); g.px(hx1 - 4, eyeY + 3, '!#e8e0c8');
    g.rect(hx0, hy0, headW - 2, 1, '!' + ramp(sk)[2]);
    if (head === 'mask') {
      g.rect(hx1 - 5, hy0 + 1, 6, 5, '!#cfc6a8'); g.px(hx1 - 4, eyeY - 1, '!#1a0f0a'); g.px(hx1 - 1, eyeY - 1, '!#1a0f0a'); g.px(hx1 - 4, eyeY - 1, '!#7fd16a');
      g.rect(hx1 - 3, eyeY + 1, 2, 1, '!#8a7a62');
      g.line(hx0 + 1, hy0, hx0 - 2, hy0 - 5, 1, '!#d9cfb4'); g.line(hx1 - 1, hy0, hx1 + 1, hy0 - 5, 1, '!#d9cfb4');
      g.px(hx0 - 1, hy0 + 2, '!#8a2a22'); g.px(hx0 - 2, hy0 + 3, '!#8a2a22'); g.px(hx0 - 2, hy0 + 1, '!#c9963e');
    }
  }
  if (head === 'lizard' || head === 'frill') {
    g.rect(hx1, eyeY - 1, 5, 4, sk); g.px(hx1 + 5, eyeY, sk);
    g.rect(hx1 - 2, eyeY + 2, 7, 1, '!#1a0e10'); g.px(hx1 + 5, eyeY - 1, '!#1a0e10');
    g.px(hx1 - 2, eyeY - 1, '!#e8c84a'); g.px(hx1 - 1, eyeY - 1, '!#120a0a');
    for (let x = hx0; x <= hx1; x += 2) g.px(x, hy0 - 1, o.crest);
    for (let y = hy0; y < hy0 + headH; y += 2) g.px(hx0 - 1, y, o.crest);
    for (let i = 0; i < 6; i++) g.px(hx0 + Math.floor(R() * headW), hy0 + 1 + Math.floor(R() * (headH - 2)), '!' + ramp(sk)[2]);
    if (head === 'frill') { for (let a = 0; a < 7; a++) { const t = -2.4 + a * .38; g.line(hx0 + 1, eyeY, hx0 + 1 + Math.cos(t) * 7, eyeY + Math.sin(t) * 7, 1, o.crest); } for (let x = hx0; x <= hx1; x += 2) g.px(x, hy0 - 2, '!#c9963e'); g.px(hx0 + 3, hy0 - 3, '!#e8c46a'); }
  }
  if (o.beard) { g.rect(hx1 - 4, eyeY + 1, 6, headH - 2, o.beard); g.rect(hx1 - 3, hy0 + headH, 4, 3, o.beard); g.px(hx1 - 1, hy0 + headH + 3, '!#c9963e'); g.px(hx1 - 3, eyeY + 2, '!' + ramp(o.beard)[3]); }
  if (o.leafCrown) { for (let x = hx0; x <= hx1; x += 2) { g.px(x, hy0 - 2, '!#5f8a46'); g.px(x + 1, hy0 - 3, '!#86b25a'); } }

  // weapon in front hand
  const [hx, hy] = hand; const dx = Math.cos(ang), dy = Math.sin(ang);
  const W2 = o.weapon;
  const metal = o.wmetal || '#9da3b0';
  if (W2 === 'sword' || W2 === 'rusty') {
    const L = 12; g.line(hx + dx * 2, hy + dy * 2, hx + dx * L, hy + dy * L, 2, W2 === 'rusty' ? '#857a66' : metal);
    g.line(hx + dx * 3 - dy * .5, hy + dy * 3 + dx * .5, hx + dx * (L - 1) - dy * .5, hy + dy * (L - 1) + dx * .5, 1, W2 === 'rusty' ? '!#a09478' : '!#e2e6ee');
    g.line(hx + dx * 2 - dy * 2.5, hy + dy * 2 + dx * 2.5, hx + dx * 2 + dy * 2.5, hy + dy * 2 - dx * 2.5, 1, '!#a37a36');
    g.px(hx - dx, hy - dy, '!#6b4a2a');
    if (W2 === 'rusty') { g.px(hx + dx * 6, hy + dy * 6, '!#6a3a22'); g.px(hx + dx * 9 + 1, hy + dy * 9, '!#5a3020'); }
  }
  if (W2 === 'greatsword') {
    const L = 19; g.line(hx + dx * 2, hy + dy * 2, hx + dx * L, hy + dy * L, 3, '#7c7f8c');
    g.line(hx + dx * 3, hy + dy * 3, hx + dx * (L - 1), hy + dy * (L - 1), 1, '!#c4c7d2');
    g.line(hx + dx * 2 - dy * 3.5, hy + dy * 2 + dx * 3.5, hx + dx * 2 + dy * 3.5, hy + dy * 2 - dx * 3.5, 2, '!#5a1a1a');
    g.line(hx, hy, hx - dx * 3, hy - dy * 3, 1, '!#3a2a22');
  }
  if (W2 === 'dagger') { g.line(hx + dx * 1, hy + dy * 1, hx + dx * 6, hy + dy * 6, 1, '!#c4c8d4'); g.px(hx + dx * 1 - dy, hy + dy * 1 + dx, '!#8a6a3a'); g.px(hx + dx * 1 + dy, hy + dy * 1 - dx, '!#8a6a3a'); }
  if (W2 === 'mace') { g.line(hx - dx, hy - dy, hx + dx * 8, hy + dy * 8, 1, '!#5a3e24'); g.ell(hx + dx * 10, hy + dy * 10, 2.2, 2.2, o.wmetal || '#b8963e'); g.px(hx + dx * 13, hy + dy * 13, '!#8a6a2a'); }
  if (W2 === 'staff') {
    g.line(hx - dx * 10, hy - dy * 10, hx + dx * 11, hy + dy * 11, 1, '#5e4228');
    const ox = hx + dx * 13, oy = hy + dy * 13; g.ell(ox, oy, 2, 2, '!' + o.orbD); g.px(ox, oy, '!' + o.orb); g.px(ox - 1, oy, '!' + o.orb); g.px(ox, oy - 1, '!#ffffff');
    g.px(ox - 2, oy + 2, '!#6b4a2a'); g.px(ox + 2, oy + 2, '!#6b4a2a');
    g.glows.push({ x: ox, y: oy, c: o.orb, r: 26 });
  }
  if (W2 === 'spear') {
    g.line(hx - dx * 11, hy - dy * 11, hx + dx * 11, hy + dy * 11, 1, '#5e4228');
    const tx = hx + dx * 12, ty = hy + dy * 12; g.line(tx, ty, tx + dx * 4, ty + dy * 4, 2, '!#a8acb8', 1); g.px(tx - dy, ty + dx, '!#7a7e8a'); g.px(tx + dy, ty - dx, '!#7a7e8a');
    g.px(tx - dx - dy, ty - dy + dx, '!#8a2a22');
  }
  if (W2 === 'bow') {
    const bx = hx + 1; for (let y = -9; y <= 9; y++) { const x = Math.round(Math.cos(y / 9 * 1.3) * 3); g.px(bx + x, hy + y, '#6e4a2a'); }
    const pull = k === 'wind' || k === 'strike' ? -4 : 0; g.line(bx, hy - 9, bx + pull, hy, 1, '!#d9d0b8'); g.line(bx + pull, hy, bx, hy + 9, 1, '!#d9d0b8');
    if (pull) g.line(bx + pull, hy, bx + 7, hy, 1, '!#c9b88a');
  }
  if (W2 === 'club') { g.line(hx - dx, hy - dy, hx + dx * 12, hy + dy * 12, 2, '#5e4228', 4); g.px(hx + dx * 8 - dy * 2, hy + dy * 8 + dx * 2, '!#3a2818'); g.px(hx + dx * 11 + dy * 2, hy + dy * 11 - dx * 2, '!#9a9aa8'); }
  if (W2 === 'sling') { g.line(hx, hy, hx + dx * 3, hy + dy * 5 + 2, 1, '!#6e4a2a'); g.ell(hx + dx * 3, hy + dy * 5 + 3, 1, 1, '!#8a8a92'); }
  // front arm
  const sleeve = o.sleeve || body;
  if (o.claws) { g.line(shF[0], shF[1], hx, hy, limb, sleeve); for (let i = -1; i <= 1; i++) g.line(hx + 1, hy + i, hx + 4 + (arm === 'fwd' ? 2 : 0), hy + i * 2 + 2, 1, '!#d9d0b8'); }
  else { g.line(shF[0], shF[1], hx, hy, limb, sleeve); g.rect(hx - 1, hy - 1, 2, 2, o.glove || sk); }
  if (o.pauldron) g.ell(shF[0] - 1, shF[1] - 1, 2.6, 2.2, o.pauldron);

  g.ax = cx + 1; g.ay = gy + 1;
  return g;
}

function troll(o, pose) {
  const s = o.size || 1; const W = Math.round(46 * s), H = Math.round(44 * s); const g = Grid(W, H); const gy = H - 3;
  const k = pose.k; const b = k === 'idle1' ? 1 : 0; const lean = k === 'strike' ? 2 : k === 'hurt' ? -2 : 0;
  const sk = o.skin; const bx = W * .42 + lean, by = gy - H * .38 + b;
  // back arm
  g.line(bx - W * .12, by - H * .12, bx - W * .2, gy - 2, 5 * s, '!' + ramp(sk)[2], 4 * s);
  // legs
  g.rect(bx - W * .18, gy - H * .2, 6 * s, H * .2, '!' + ramp(sk)[2]); g.rect(bx + W * .04, gy - H * .2, 6 * s, H * .2, sk);
  g.rect(bx - W * .2, gy - 2, 8 * s, 3, '!' + ramp(sk)[3]); g.rect(bx + W * .03, gy - 2, 9 * s, 3, '!' + ramp(sk)[2]);
  // body
  g.ell(bx, by, W * .26, H * .25, sk); g.ell(bx + W * .05, by + H * .06, W * .17, H * .15, o.belly);
  g.rect(bx - W * .18, by + H * .12, W * .36, 4 * s, o.loin); for (let x = Math.floor(bx - W * .18); x < bx + W * .18; x += 3) g.px(x, by + H * .12 + 4 * s, o.loin);
  const R = mulberry(9); for (let i = 0; i < 14 * s; i++) { const a = -Math.PI * (.2 + R() * .7); g.px(bx + Math.cos(a) * W * .24, by + Math.sin(a) * H * .23 - R() * 2, '!' + (R() < .5 ? '#7a9a4a' : '#5e7a3a')); }
  for (let i = 0; i < 5; i++) g.px(bx - W * .1 + R() * W * .2, by - H * .1 + R() * H * .2, '!' + ramp(sk)[3]);
  // head
  const hx = bx + W * .2 + lean * .5, hy = by - H * .2;
  g.ell(hx, hy, 5 * s, 4.5 * s, sk); g.rect(hx + 2 * s, hy + 1, 4 * s, 3 * s, sk);
  g.rect(hx - 3 * s, hy - 2 * s, 7 * s, 1, '!' + ramp(sk)[3]); g.px(hx + 1 * s, hy - 1 * s, '!#e8c84a'); g.px(hx + 2 * s, hy - 1 * s, '!#e8c84a'); g.glows.push({ x: hx + 1.5 * s, y: hy - s, c: '#e8c84a', r: 10 });
  g.rect(hx + 1 * s, hy + 3 * s, 5 * s, 1, '!#1a1210'); g.px(hx + 2 * s, hy + 2 * s, '!#e8e0c8'); g.px(hx + 5 * s, hy + 2 * s, '!#e8e0c8');
  if (o.lantern) { g.line(bx - W * .1, by - H * .2, bx - W * .2, by - H * .32, 1, '!#3a2a1a'); g.rect(bx - W * .22, by - H * .32, 3, 4, '!#e8a84a'); g.glows.push({ x: bx - W * .21, y: by - H * .3, c: '#ffb050', r: 30 }); }
  // front arm + club
  const shx = bx + W * .14, shy = by - H * .12;
  const hand = k === 'wind' ? [shx - 2, shy - H * .28] : k === 'strike' ? [shx + W * .26, shy + H * .1] : [shx + W * .1, gy - H * .1];
  const ang = k === 'wind' ? -2.3 : k === 'strike' ? .5 : -1.0;
  const dx = Math.cos(ang), dy = Math.sin(ang);
  g.line(hand[0] - dx * 2, hand[1] - dy * 2, hand[0] + dx * 16 * s, hand[1] + dy * 16 * s, 3 * s, '#5e4228', 6 * s);
  g.px(hand[0] + dx * 10 * s + 2, hand[1] + dy * 10 * s, '!#9a9aa8'); g.px(hand[0] + dx * 13 * s - 1, hand[1] + dy * 13 * s + 2, '!#9a9aa8');
  g.line(shx, shy, hand[0], hand[1], 5 * s, sk, 4 * s); g.ell(hand[0], hand[1], 2.5 * s, 2.5 * s, '!' + ramp(sk)[0]);
  g.ax = Math.round(bx); g.ay = gy + 1;
  return g;
}

function lieDown(g) {
  const n = Grid(g.h, g.w); for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const c = g.p[y * g.w + x]; if (c) n.px(g.h - 1 - y, x, c); }
  let maxY = 0, minX = n.w, maxX = 0; for (let y = 0; y < n.h; y++) for (let x = 0; x < n.w; x++) if (n.p[y * n.w + x]) { maxY = Math.max(maxY, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
  const out = Grid(Math.max(n.w, maxX - minX + 6), n.h); const sy = (n.h - 3) - maxY, sx = Math.floor((out.w - (maxX - minX + 1)) / 2) - minX;
  for (let y = 0; y < n.h; y++) for (let x = 0; x < n.w; x++) { const c = n.p[y * n.w + x]; if (c) out.px(x + sx, y + sy, c); }
  out.ax = Math.floor(out.w / 2); out.ay = n.h - 2; return out;
}
const POSES = ['idle0', 'idle1', 'wind', 'strike', 'hurt', 'dead'];
function makeFrames(builder, o, flip) {
  const F = {};
  for (const k of POSES) {
    let g = builder(o, { k: k === 'dead' ? 'hurt' : k });
    if (k === 'dead') g = lieDown(g);
    shade(g); selout(g);
    let top = g.h; for (let i = 0; i < g.p.length; i++) if (g.p[i]) { top = Math.floor(i / g.w); break; }
    F[k] = {
      n: toCanvas(g, flip), w: toCanvas(g, flip, 'white'),
      rr: toCanvas(g, flip, 'rim', flip ? 'L' : 'R'), rl: toCanvas(g, flip, 'rim', flip ? 'R' : 'L'),
      ax: flip ? g.w - 1 - g.ax : g.ax, ay: g.ay, top, h: g.ay - top,
      glows: (g.glows || []).map(p => ({ x: (flip ? g.w - 1 - p.x : p.x), y: p.y, c: p.c, r: p.r }))
    };
  }
  return F;
}
