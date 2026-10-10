/* ================= BATTLE ENGINE ================= */
const cv = $('#cv'); const cx = cv.getContext('2d');
const V = { S: 3, aw: 360, ah: 216, dpr: 1 };
const B = { units: [], over: true, turn: null, auto: store.get('bc.auto', false), speed: store.get('bc.speed', 1), awaiting: null, pending: null, popups: [], parts: [], projs: [], fx: [], dl: [], shake: 0, hitstop: 0, setting: 'crypt', scene: null, t: 0, hover: null, cam: { x: 180, y: 108, z: 1 }, camT: { x: 180, y: 108, z: 1 }, punch: 0, mods: {} };
const tweens = [];
function tween(dur, fn, ease) { const d = Math.max(1, dur / B.speed); return new Promise(res => tweens.push({ t0: performance.now(), d, fn, ease: ease || (k => 1 - Math.pow(1 - k, 3)), res })); }
const wait = ms => tween(ms, () => {});
const now = () => performance.now();

let lm = null, lmx = null, grain = null;
function sizeCanvas() {
  const wrap = $('#stage'); const cw = wrap.clientWidth; if (!cw) return;
  const dpr = window.devicePixelRatio || 1; const dev = cw * dpr;
  const S = Math.max(1, Math.round(dev / 360)); const aw = Math.floor(dev / S); const ah = Math.round(aw * .6);
  const changed = aw !== V.aw || ah !== V.ah || !B.scene || B.scene.key !== B.setting;
  Object.assign(V, { S, aw, ah, dpr });
  cv.width = aw * S; cv.height = ah * S; cv.style.width = (aw * S / dpr) + 'px'; cv.style.height = (ah * S / dpr) + 'px';
  if (changed) { B.scene = buildScene(B.setting, aw, ah); [lm, lmx] = mk(aw / 2, ah / 2); layoutUnits(); B.cam = { x: aw / 2, y: ah / 2, z: 1 }; B.camT = { x: aw / 2, y: ah / 2, z: 1 }; AMB.fog = []; AMB.flies = []; }
}
window.addEventListener('resize', () => { if (!$('section[data-screen="battle"]').hidden) sizeCanvas(); if (!$('section[data-screen="map"]').hidden && RUN) renderMap(); });

const HSLOT = [[.37, .72], [.31, .9], [.25, .64], [.2, .83], [.12, .75]];
const FSLOT = [[.63, .72], [.69, .9], [.75, .64], [.8, .83], [.88, .75]];
const BOSSSLOT = [.78, .88];
function layoutUnits() { for (const u of B.units) { const sl = u.side === 'hero' ? HSLOT[u.slot] : (u.boss ? BOSSSLOT : FSLOT[u.slot]); u.x = sl[0] * V.aw; u.y = sl[1] * V.ah; } }
function effAtk(u) { let m = 1; if (hasS(u, 'atkUp')) m += .3; if (u.side === 'hero') m += B.mods.atk; return u.atk * m; }
function effDef(u) { let m = 1; if (hasS(u, 'defUp')) m *= 1.4; if (hasS(u, 'defBreak')) m *= .55; if (u.side === 'hero') m *= 1 + B.mods.def; return u.def * m; }
function effSpd(u) { let m = 1; if (u.side === 'hero') m += B.mods.spd; return u.spd * m; }
function hasS(u, k) { return u.st.some(s => s.k === k); }
function addS(u, k, t) {
  if (!u.alive) return false;
  if ((k === 'poison' || k === 'bleed') && u.undead) { popup(u, 'Immune', '#cfd3e6'); return false; }
  if (k === 'poison' && u.side === 'hero' && (B.mods.antivenom || (u.hm && u.hm.poisonImmune))) { popup(u, 'Immune', '#cfd3e6'); return false; }
  const ex = u.st.find(s => s.k === k); if (ex) { ex.t = Math.max(ex.t, t); ex.fresh = (u === B.turn); return true; }
  u.st.push({ k, t, fresh: u === B.turn }); return true;
}
const aliveSide = side => B.units.filter(u => u.alive && u.side === side);
function makeUnit(base, side, slot, extra) {
  const u = Object.assign({ side, slot, ox: 0, oy: 0, alpha: 1, flash: 0, bar: 0, st: [], alive: true, phase: rnd() * 6, pose: 'idle', poseUntil: 0, ghost: 1 }, extra);
  u.skills = base.skills.map(s => Object.assign({ cur: 0 }, s)); return u;
}
function buildBattle(comp, layer, kind) {
  B.units = []; B.popups = []; B.parts = []; B.projs = []; B.fx = []; B.dl = [];
  const lh = heroById(RUN.leader); const lead = lh && RUN.hp[RUN.leader] > 0 ? CLASSES[lh.cls].leader : {};
  B.mods = { atk: (lead.atk || 0) + RUN.drill * .1, def: (lead.def || 0) + (RUN.relics.includes('ward') ? .15 : 0), spd: (lead.spd || 0) + (RUN.relics.includes('feather') ? .08 : 0), crit: (lead.crit || 0) + (RUN.relics.includes('whetstone') ? .1 : 0), regen: lead.regen || 0, heal: RUN.relics.includes('bell') ? .3 : 0, fire: RUN.relics.includes('ember') ? .3 : 0, holy: RUN.relics.includes('salt') ? .3 : 0, antivenom: RUN.relics.includes('antivenom') };
  let slot = 0;
  RUN.party.forEach(id => {
    if (RUN.hp[id] <= 0) return;
    const h = heroById(id); if (!h) return; ensureSprite(h); const st = heroStats(h); const max = runHeroMax(id);
    B.units.push(makeUnit({ skills: heroSkills(h) }, 'hero', slot++, { id, key: id, name: h.name, maxhp: max, hp: Math.max(1, Math.round(RUN.hp[id] * max)), atk: st.atk, def: st.def, spd: st.spd + (RUN.contract === 'crypt' ? st.m.cryptSpd : 0), crit: st.crit, scout: !!CLASSES[h.cls].scout, hm: st.m }));
  });
  const scale = (1 + .1 * layer) * (kind === 'elite' ? 1.2 : 1); let fs = 0;
  comp.forEach(k => {
    const f = FOES[k]; const u = makeUnit(f, 'foe', f.boss ? -1 : fs++, { key: k, name: f.name, maxhp: Math.round(f.hp * scale * FOE_HP), atk: f.atk * scale * FOE_ATK, def: f.def, spd: f.spd, crit: .1, undead: f.undead, troll: f.troll, lizard: f.lizard, goblin: f.goblin, boss: f.boss, float: f.float, big: f.big || f.boss });
    u.hp = u.maxhp; B.units.push(u);
  });
  B.units.forEach(u => u.bar = rnd() * 12);
  if (RUN.relics.includes('banner')) aliveSide('hero').forEach(u => u.bar += 30);
  if (RUN.intel) { aliveSide('hero').forEach(u => u.bar += 40); aliveSide('foe').forEach(u => u.bar = 0); }
}
function fr(u) { return SPR[u.key].idle0; }
function popup(u, text, color, big) { const n = B.popups.filter(p => p.u === u && p.t < 450).length; B.popups.push({ u, x: u.x + u.ox, y: u.y - fr(u).h - 8 - n * 9, text, color, big, t: -n * 90 }); }
function part(o) { B.parts.push(Object.assign({ vx: 0, vy: 0, g: 0, drag: 1, life: 30, sz: 1 }, o, { max: o.life || 30 })); }
function burst(x, y, color, n, spread, up, o) { if (REDUCED) n = Math.ceil(n / 3); for (let i = 0; i < n; i++) part(Object.assign({ x, y, vx: (rnd() - .5) * spread, vy: (rnd() - .5) * spread - (up || 0), g: up ? -.01 : .07, life: 22 + rnd() * 26, c: Array.isArray(color) ? pick(color) : color }, o || {})); }
function center(u) { return [u.x + u.ox, u.y - fr(u).h * .5 + u.oy]; }
const FXCOL = { fire: ['#ff8a2a', '#ffd06a', '#e0401c'], holy: ['#fff4c8', '#f4cf6a', '#ffffff'], arcane: ['#9ab8ff', '#6a7cff', '#e0d4ff'], nature: ['#8ed06a', '#3e7a34', '#c8f0a0'], dark: ['#7a5ac8', '#3a2a5a', '#b08ae0'], venom: ['#a8f06a', '#b47ce0', '#5a8a3a'], arrow: ['#d8cfb4'], arrows: ['#d8cfb4'], stone: ['#8a8a92'], heal: ['#7fd08a', '#c8f7d0', '#ffffff'], buff: ['#e8b85a', '#fff0b8'], smoke: ['#6a6670', '#9a96a0', '#4a4650'], quake: ['#5a4228', '#8a6a42'], phys: ['#ffffff', '#ffe0b0'] };
const LIGHTC = { fire: [255, 130, 50], holy: [255, 230, 160], arcane: [120, 150, 255], nature: [130, 220, 110], dark: [140, 90, 220], venom: [150, 240, 100], heal: [130, 230, 150], buff: [255, 200, 110], phys: [255, 220, 180] };
const EMISSIVE = new Set(['fire', 'holy', 'arcane', 'heal', 'buff', 'venom', 'dark', 'nature']);
function dlight(x, y, r, c, i, life) { B.dl.push({ x, y, r, c, i, life, max: life }); }
function setPose(u, p, ms) { u.pose = p; u.poseUntil = ms ? now() + ms / B.speed : Infinity; }
function focusCam(a, b, z) { const fx = b ? (a.x + b.x) / 2 : a.x; B.camT = { x: V.aw / 2 + (fx - V.aw / 2) * .22, y: V.ah * .56, z: (z || 1.04) + .01 }; }
function resetCam() { B.camT = { x: V.aw / 2, y: V.ah * .53, z: 1.03 }; }

async function runBattle(comp, layer, kind) {
  B.setting = RUN.contract; B.over = false; B.kind = kind; B.scene = null;
  show('battle'); sizeCanvas();
  buildBattle(comp, layer, kind); layoutUnits();
  SND.play(kind === 'boss' ? 'boss' : 'battle');
  updateCtrls(); setLog(kind === 'boss' ? `<b>${B.units.find(u => u.boss).name}</b> blocks the way.` : kind === 'elite' ? 'A tougher band bars the path.' : 'Enemies ahead.');
  $('#skills').innerHTML = ''; $('#desc').textContent = ''; updateWho(null);
  B.units.forEach(u => { u.ox = u.side === 'hero' ? -V.aw * .5 : V.aw * .5; });
  B.cam.z = 1.16; resetCam();
  await tween(620, k => B.units.forEach(u => { const s = u.side === 'hero' ? -1 : 1; u.ox = s * V.aw * .5 * (1 - k); }));
  B.units.forEach(u => u.ox = 0);
  if (RUN.contract === 'mire') {
    const scouts = aliveSide('hero').filter(u => u.scout);
    if (scouts.length || RUN.intel) { setLog(`<b>${scouts[0] ? scouts[0].name : 'Your scouts'}</b> ${scouts[0] ? 'spots' : 'spotted'} the lizardkin in the reeds. No ambush.`); if (scouts[0]) popup(scouts[0], 'Spotted!', '#7fd08a'); await wait(700); }
    else { setLog('<b>Ambush!</b> The lizardkin strike from the water.'); SND.fx('ambush'); B.shake = 8; B.punch = .06; aliveSide('foe').forEach(u => { u.bar = 100; popup(u, 'Ambush!', '#d0402e'); }); await wait(800); }
  }
  renderOrder();
  while (true) {
    if (!aliveSide('foe').length) { await endBanner('Victory', 'win'); syncHP(); return 'win'; }
    if (!aliveSide('hero').length) { await endBanner('Defeat', 'lose'); syncHP(); return 'lose'; }
    const live = B.units.filter(u => u.alive);
    let best = null, bt = Infinity;
    for (const u of live) { const t = Math.max(0, (100 - u.bar) / effSpd(u)); if (t < bt || (t === bt && effSpd(u) > effSpd(best))) { bt = t; best = u; } }
    if (bt > 0) { const from = live.map(u => u.bar); await tween(Math.min(320, 40 + bt * 260), k => live.forEach((u, i) => u.bar = from[i] + effSpd(u) * bt * k), k => k); live.forEach((u, i) => u.bar = from[i] + effSpd(u) * bt); }
    best.bar = 0;
    await takeTurn(best);
    renderOrder(); resetCam();
    await wait(140);
  }
}
function syncHP() { B.units.filter(u => u.side === 'hero').forEach(u => RUN.hp[u.id] = u.alive ? u.hp / u.maxhp : 0); B.over = true; B.turn = null; saveRun(); }
async function endBanner(text, sfx) {
  B.turn = null; B.pending = null; $('#skills').innerHTML = ''; $('#desc').textContent = ''; updateWho(null);
  const bn = $('#banner'); bn.textContent = text; bn.className = 'banner ' + sfx; bn.hidden = false; SND.fx(sfx);
  if (sfx === 'win') { aliveSide('hero').forEach(u => { u.cheer = true; burst(...center(u), FXCOL.buff, 12, 2.5, 1, { e: 1 }); }); B.camT = { x: V.aw * .4, y: V.ah / 2, z: 1.06 }; }
  else B.camT = { x: V.aw * .6, y: V.ah / 2, z: 1.06 };
  await new Promise(r => setTimeout(r, 1600));
  bn.hidden = true; aliveSide('hero').forEach(u => u.cheer = false); resetCam();
}

async function takeTurn(u) {
  B.turn = u; u.st.forEach(s => s.fresh = false); renderOrder(); updateWho(u);
  const tick = async (k, pct, color) => { if (!hasS(u, k)) return; const d = Math.max(1, Math.round(u.maxhp * (u.boss ? pct / 2 : pct))); u.hp -= d; popup(u, '-' + d, color); u.flash = .6; setPose(u, 'hurt', 220); burst(...center(u), color, 8, 1.6, .4, { e: k === 'burn' ? 1 : 0 }); await wait(280); };
  await tick('burn', .06, '#ff8a3a'); await tick('poison', .05, '#b47ce0'); await tick('bleed', .05, '#d0402e');
  if (u.hp <= 0) { await kill(u); B.turn = null; return; }
  const healTick = async pct => { const amt = Math.round(u.maxhp * pct * (u.side === 'hero' ? 1 + B.mods.heal : 1)); if (u.hp >= u.maxhp) return; u.hp = Math.min(u.maxhp, u.hp + amt); popup(u, '+' + amt, '#7fd08a'); burst(...center(u), FXCOL.heal, 6, 1, 1, { e: 1 }); await wait(220); };
  if (hasS(u, 'regen')) await healTick(.08);
  if (u.side === 'hero' && B.mods.regen) await healTick(B.mods.regen);
  if (u.troll) { if (hasS(u, 'burn')) { popup(u, 'Regen blocked', '#ff8a3a'); await wait(240); } else if (u.hp < u.maxhp) await healTick(.06); }
  if (hasS(u, 'stun')) { popup(u, 'Stunned', '#f0d04a'); setLog(`<b>${u.name}</b> is stunned and loses the turn.`); await wait(480); endTurn(u, null); return; }
  let choice;
  if (u.side === 'hero' && !B.auto) choice = await playerChoose(u);
  else { if (u.side === 'hero') showSkills(u, true); else { $('#skills').innerHTML = ''; $('#desc').textContent = ''; } await wait(u.side === 'hero' ? 260 : 340); choice = aiChoose(u); }
  if (!choice) choice = aiChoose(u);
  await execSkill(u, choice.skill, choice.target);
  endTurn(u, choice.skill);
}
function endTurn(u, used) {
  u.skills.forEach(s => { if (s === used) s.cur = s.cd || 0; else if (s.cur > 0) s.cur--; });
  u.st = u.st.filter(s => { if (s.fresh) { s.fresh = false; return true; } s.t--; return s.t > 0; });
  B.turn = null;
}
function validTargets(u, s) {
  if (s.t === 'enemy') { const foes = aliveSide(u.side === 'hero' ? 'foe' : 'hero'); const taunt = foes.filter(f => hasS(f, 'taunt')); return taunt.length ? taunt : foes; }
  if (s.t === 'ally') return aliveSide(u.side); return [];
}
function aiChoose(u) {
  const allies = aliveSide(u.side), foes = aliveSide(u.side === 'hero' ? 'foe' : 'hero');
  let best = null, bs = -1;
  for (const s of u.skills) {
    if (s.cur > 0) continue; let sc = 0; const n = s.t === 'allEnemies' ? foes.length : 1;
    if (s.dmg) sc += s.dmg * (s.hits || 1) * n * (s.t === 'allEnemies' && foes.length < 2 ? .7 : 1);
    if (s.heal) { const tg = s.t === 'self' ? [u] : allies; const miss = tg.reduce((a, x) => a + Math.max(0, 1 - x.hp / x.maxhp), 0); sc += miss > .45 ? miss * 3 : miss * .5; }
    if (s.cleanse) sc += allies.reduce((a, x) => a + x.st.filter(t => STATUS[t.k].debuff).length, 0) * .4;
    if (s.ally) { const k = s.ally[0][0]; const have = allies.filter(x => hasS(x, k)).length; sc += have < allies.length / 2 ? 1.4 : .1; if (k === 'regen') sc += allies.some(x => x.hp / x.maxhp < .7) ? .8 : -.6; }
    if (s.self && s.self.some(x => x[0] === 'taunt')) sc += allies.some(x => x.hp / x.maxhp < .6) ? .6 : 0;
    if (s.summon) sc += allies.length < 4 ? 2 : -5;
    if (s.st) sc += .25; if (s.bar) sc += .3;
    if (u.side === 'foe') sc *= .85 + rnd() * .3;
    if (sc > bs) { bs = sc; best = s; }
  }
  best = best || u.skills[0];
  let target = null; const vt = validTargets(u, best);
  if (vt.length) target = (u.side === 'hero' || rnd() < .5) ? vt.slice().sort((a, b) => a.hp / a.maxhp - b.hp / b.maxhp)[0] : pick(vt);
  return { skill: best, target };
}
function playerChoose(u) { return new Promise(res => { B.awaiting = { u, res }; B.pending = u.skills[0]; showSkills(u, false); }); }
function resolvePlayer(choice) { if (!B.awaiting) return; const r = B.awaiting.res; B.awaiting = null; B.pending = null; $('#skills').querySelectorAll('button').forEach(b => b.disabled = true); r(choice); }
function showSkills(u, readonly) {
  const box = $('#skills'); box.innerHTML = '';
  setLog(`<b>${u.name}</b>${readonly ? ' acts on auto.' : '’s turn.'}`);
  u.skills.forEach(s => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn skill' + (B.pending === s ? ' sel' : '');
    b.innerHTML = `<span class="nm">${s.name}</span><span class="cd">${s.cd ? 'Cooldown ' + s.cd : 'Basic'}${s.t === 'allEnemies' ? ' · All enemies' : s.t === 'allAllies' ? ' · Party' : ''}</span>${s.cur ? `<span class="wait">${s.cur}</span>` : ''}`;
    b.disabled = readonly || s.cur > 0;
    b.onclick = () => { if (!B.awaiting) return; SND.fx('blip'); if (s.t === 'enemy' || s.t === 'ally') { B.pending = s; showSkills(u, false); } else resolvePlayer({ skill: s, target: null }); };
    b.onmouseenter = () => { $('#desc').textContent = s.desc || ''; };
    box.appendChild(b);
  });
  if (!readonly && u.side === 'hero' && RUN && RUN.pack) for (const k in RUN.pack) {
    if (!RUN.pack[k]) continue; const b = document.createElement('button'); b.type = 'button'; b.className = 'btn skill item' + (B.pending && B.pending.item === k ? ' sel' : '');
    b.innerHTML = `<span class="nm">${ITEMS[k].name}</span><span class="cd">Item · ×${RUN.pack[k]}</span>`;
    b.onclick = () => { if (!B.awaiting) return; SND.fx('blip'); const s = Object.assign({ item: k }, ITEMS[k].skill); if (s.t === 'ally') { B.pending = s; showSkills(u, false); } else resolvePlayer({ skill: s, target: null }); };
    b.onmouseenter = () => { $('#desc').textContent = ITEMS[k].skill.desc; };
    box.appendChild(b);
  }
  const sel = B.pending || u.skills[0];
  $('#desc').textContent = readonly ? '' : (sel.desc || '') + (sel.t === 'enemy' ? ' Tap an enemy.' : sel.t === 'ally' ? ' Tap a hero.' : '');
}
function setLog(h) { $('#log').innerHTML = h; }
function updateWho(u) {
  const w = $('#who'); if (!u) { w.hidden = true; return; } w.hidden = false;
  const pc = $('#whoPort'); const p = portrait(u.key); pc.width = 30; pc.height = 30; const x = pc.getContext('2d'); x.clearRect(0, 0, 30, 30); x.drawImage(p, 0, 0);
  pc.className = 'px ' + (u.side === 'hero' ? 'h' : 'f');
  $('#whoName').textContent = u.name; $('#whoHp').textContent = Math.max(0, Math.round(u.hp)) + ' / ' + u.maxhp;
  $('#whoBar').style.width = clamp(u.hp / u.maxhp * 100, 0, 100) + '%';
  $('#whoSt').innerHTML = u.st.map(s => `<span class="chip" style="color:${STATUS[s.k].c}">${STATUS[s.k].label}</span>`).join('');
}
function canvasPoint(e) {
  const r = cv.getBoundingClientRect(); const sx = (e.clientX - r.left) / r.width * V.aw, sy = (e.clientY - r.top) / r.height * V.ah;
  const z = B.cam.z; return [(sx - V.aw / 2) / z + B.cam.x, (sy - V.ah / 2) / z + B.cam.y];
}
function unitAt(ax, ay, list) {
  let best = null, bd = Infinity;
  for (const u of list) { const f = fr(u); const hw = u.big ? 16 : 10; const cy0 = u.y - f.h / 2; if (Math.abs(ax - u.x) <= hw + 4 && Math.abs(ay - cy0) <= f.h / 2 + 6) { const d = Math.hypot(ax - u.x, ay - cy0); if (d < bd) { bd = d; best = u; } } }
  return best;
}
cv.addEventListener('click', e => { if (!B.awaiting || !B.pending) return; const [ax, ay] = canvasPoint(e); const u = unitAt(ax, ay, validTargets(B.awaiting.u, B.pending)); if (u) { SND.fx('select'); resolvePlayer({ skill: B.pending, target: u }); } });
cv.addEventListener('pointermove', e => { if (!B.awaiting || !B.pending) { B.hover = null; return; } const [ax, ay] = canvasPoint(e); B.hover = unitAt(ax, ay, validTargets(B.awaiting.u, B.pending)); });
cv.addEventListener('keydown', e => {
  if (!B.awaiting || !B.pending) return; const vt = validTargets(B.awaiting.u, B.pending); if (!vt.length) return;
  const i = Math.max(0, vt.indexOf(B.hover));
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { B.hover = vt[(i + 1) % vt.length]; e.preventDefault(); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { B.hover = vt[(i - 1 + vt.length) % vt.length]; e.preventDefault(); }
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); resolvePlayer({ skill: B.pending, target: B.hover || vt[0] }); }
});
function updateCtrls() { $('#autoBtn').textContent = 'Auto ' + (B.auto ? 'on' : 'off'); $('#autoBtn').classList.toggle('on', B.auto); $('#speedBtn').textContent = 'Speed ' + B.speed + '×'; $('#speedBtn').classList.toggle('on', B.speed > 1); }
$('#autoBtn').onclick = () => { B.auto = !B.auto; store.set('bc.auto', B.auto); updateCtrls(); SND.fx('blip'); if (B.auto && B.awaiting) resolvePlayer(aiChoose(B.awaiting.u)); };
$('#speedBtn').onclick = () => { B.speed = B.speed >= 3 ? 1 : B.speed + 1; store.set('bc.speed', B.speed); updateCtrls(); SND.fx('blip'); };
function renderOrder() {
  const box = $('#order'); box.innerHTML = ''; const live = B.units.filter(u => u.alive); if (!live.length) return;
  const bars = new Map(live.map(u => [u, u.bar])); const seq = []; if (B.turn) seq.push(B.turn);
  for (let n = 0; seq.length < 9 && n < 40; n++) { let best = null, bt = Infinity; for (const u of live) { const t = Math.max(0, (100 - bars.get(u)) / effSpd(u)); if (t < bt) { bt = t; best = u; } } live.forEach(u => bars.set(u, bars.get(u) + effSpd(u) * bt)); bars.set(best, 0); seq.push(best); }
  seq.forEach(u => { const c = portrait(u.key); c.classList.add(u.side === 'hero' ? 'h' : 'f'); c.title = u.name; box.appendChild(c); });
}

async function execSkill(u, s, target) {
  const foes = aliveSide(u.side === 'hero' ? 'foe' : 'hero'), allies = aliveSide(u.side);
  let tg = s.t === 'enemy' ? [target && target.alive ? target : validTargets(u, s)[0]] : s.t === 'ally' ? [target || allies[0]] : s.t === 'allEnemies' ? foes : s.t === 'allAllies' ? allies : [u];
  tg = tg.filter(Boolean);
  if (s.item && RUN.pack[s.item] > 0) { RUN.pack[s.item]--; saveRun(); }
  setLog(`<b>${u.name}</b> uses ${s.name}.`);
  const dir = u.side === 'hero' ? 1 : -1; const fx = s.fx || (s.el === 'phys' ? 'phys' : s.el);
  focusCam(u, tg[0] && tg[0] !== u ? tg[0] : null, s.t === 'allEnemies' || s.cd >= 3 ? 1.06 : 1.035);
  if (s.style === 'melee') {
    const t0 = tg[0]; const reach = (t0.big ? 18 : 12) + 2;
    const tx = s.t === 'allEnemies' ? (u.side === 'hero' ? V.aw * .62 : V.aw * .38) : t0.x + t0.ox - dir * reach;
    const ty = s.t === 'allEnemies' ? u.y : t0.y; const dx = tx - u.x, dy = (ty - u.y) * .7;
    setPose(u, 'wind'); await tween(150, k => { u.ox = -dir * 4 * k; });
    await tween(170, k => { u.ox = -dir * 4 + (dx + dir * 4) * k; u.oy = dy * k - Math.sin(k * Math.PI) * 5; }, k => k * k);
    setPose(u, 'strike'); SND.fx('slash');
    const [hx, hy] = center(t0); B.fx.push({ type: 'trail', x: hx - dir * 6, y: hy - 2, dir, life: 14, max: 14, c: u.side === 'hero' ? [255, 240, 220] : [255, 200, 190] });
    await applyHits(u, s, tg, fx);
    await wait(90);
    setPose(u, 'idle'); await tween(240, k => { u.ox = dx * (1 - k); u.oy = dy * (1 - k); });
    u.ox = 0; u.oy = 0;
  } else if (s.style === 'shot') {
    setPose(u, 'wind'); await tween(180, k => { u.oy = -2 * Math.sin(k * Math.PI); });
    setPose(u, 'strike'); SND.fx(fx === 'arrow' || fx === 'stone' ? 'arrow' : fx);
    if (fx === 'holy') { await pillar(tg[0]); }
    else if (fx === 'arcane') { await beam(u, tg[0]); }
    else await projectile(u, tg[0], fx);
    await applyHits(u, s, tg, fx);
    setPose(u, 'idle');
  } else if (s.style === 'spell') {
    setPose(u, 'wind'); await tween(220, k => { u.oy = -3 * Math.sin(k * Math.PI); });
    const [ux, uy] = center(u); B.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 4, r1: 22, life: 26, max: 26, c: LIGHTC[fx] || [255, 220, 180] }); dlight(ux, uy, 60, LIGHTC[fx] || [255, 220, 180], .8, 24);
    setPose(u, 'strike'); SND.fx(fx === 'arrows' ? 'arrow' : fx);
    if (fx === 'quake') { B.shake = 12; B.punch = .05; tg.forEach(t => crack(t)); await wait(200); }
    else if (fx === 'smoke') { tg.forEach(t => burst(t.x, t.y - 10, FXCOL.smoke, 18, 1.4, .3, { sz: 3, soft: 1, g: -.01, life: 50 })); await wait(260); }
    else if (fx === 'nature') { tg.forEach(t => vines(t)); await wait(320); }
    else if (fx === 'arrows') { await Promise.all(tg.map((t, i) => wait(i * 50).then(() => projectile(u, t, 'arrow', true)))); }
    else await Promise.all(tg.map((t, i) => wait(i * 60).then(() => projectile(u, t, fx))));
    await applyHits(u, s, tg, fx);
    setPose(u, 'idle');
  } else {
    SND.fx(fx === 'dark' ? 'dark' : fx === 'heal' ? 'heal' : 'buff');
    setPose(u, 'wind');
    const c = LIGHTC[fx] || LIGHTC.buff;
    tg.forEach((t, i) => { B.fx.push({ type: 'ring', x: t.x, y: t.y, r0: 3, r1: 16, life: 30 + i * 3, max: 30 + i * 3, c }); burst(t.x, t.y - 4, FXCOL[fx] || FXCOL.buff, 10, 1, 1.2, { e: 1, g: -.015 }); });
    dlight(u.x, u.y - 14, 90, c, .9, 40);
    await tween(320, k => { u.oy = -3 * Math.sin(k * Math.PI); });
    await applyHits(u, s, tg, fx);
    setPose(u, 'idle');
  }
}
function projectile(u, t, fx, lob) {
  const [x0, y0] = center(u); const [x1, y1] = center(t);
  const p = { x: x0, y: y0, px: x0, py: y0, fx, c: FXCOL[fx] || FXCOL.phys, arrow: fx === 'arrow', stone: fx === 'stone' };
  B.projs.push(p); const arc = lob ? 34 : p.arrow ? 10 : 7;
  return tween(lob ? 340 : 260, k => {
    p.px = p.x; p.py = p.y; p.x = x0 + (x1 - x0) * k; p.y = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * arc;
    if (!p.arrow && !p.stone && rnd() < .9) part({ x: p.x, y: p.y, vx: (rnd() - .5) * .5, vy: (rnd() - .5) * .5 - .2, life: 16, c: pick(p.c), e: EMISSIVE.has(fx) ? 1 : 0, sz: rnd() < .3 ? 2 : 1 });
  }, k => k).then(() => { B.projs.splice(B.projs.indexOf(p), 1); impact(t, fx); });
}
function impact(t, fx) {
  const [x, y] = center(t); const c = LIGHTC[fx];
  if (c) { dlight(x, y, 70, c, 1, 18); B.fx.push({ type: 'flash', x, y, r: 16, life: 10, max: 10, c }); }
  if (fx === 'fire') { burst(x, y, FXCOL.fire, 16, 2.4, 1, { e: 1, g: -.03 }); for (let i = 0; i < 6; i++) part({ x: x + (rnd() - .5) * 8, y: y + 6, vy: -.6 - rnd() * .6, life: 30, c: pick(FXCOL.fire), e: 1, sz: 2, soft: 1 }); }
  if (fx === 'venom') burst(x, y, FXCOL.venom, 14, 2.4, .2, { e: 0, g: .1 });
  if (fx === 'dark') { burst(x, y, FXCOL.dark, 12, 1.6, .6, { e: 1, g: -.02, soft: 1, sz: 2 }); }
}
function pillar(t) { const [x, y] = center(t); B.fx.push({ type: 'pillar', x, y: t.y, life: 30, max: 30, c: LIGHTC.holy }); dlight(x, y, 90, LIGHTC.holy, 1.2, 30); for (let i = 0; i < 10; i++) part({ x: x + (rnd() - .5) * 10, y: t.y - rnd() * 30, vy: -.3 - rnd() * .4, life: 30, c: pick(FXCOL.holy), e: 1 }); return wait(220); }
function beam(u, t) { const [x0, y0] = center(u), [x1, y1] = center(t); B.fx.push({ type: 'beam', x0, y0, x1, y1, life: 20, max: 20, c: LIGHTC.arcane }); B.fx.push({ type: 'rune', x: x0, y: y0, life: 26, max: 26, c: LIGHTC.arcane }); dlight((x0 + x1) / 2, (y0 + y1) / 2, 100, LIGHTC.arcane, 1, 22); B.punch = Math.max(B.punch, .03); return wait(200); }
function crack(t) { const segs = []; for (let i = 0; i < 4; i++) { let x = t.x, y = t.y; const pts = [[x, y]]; let a = rnd() * Math.PI * 2; for (let j = 0; j < 5; j++) { x += Math.cos(a) * 3; y += Math.sin(a) * 1.2; a += (rnd() - .5) * 1.2; pts.push([x, y]); } segs.push(pts); } B.fx.push({ type: 'crack', segs, life: 60, max: 60 }); burst(t.x, t.y - 2, FXCOL.quake, 14, 2.2, 1, { g: .08 }); }
function vines(t) { const lines = []; for (let i = 0; i < 6; i++) { const x0 = t.x + (rnd() - .5) * 14; const h = 10 + rnd() * 16; lines.push({ x0, h, lean: (rnd() - .5) * 8 }); } B.fx.push({ type: 'vines', y: t.y, lines, life: 46, max: 46 }); dlight(t.x, t.y - 10, 50, LIGHTC.nature, .6, 30); }
async function applyHits(u, s, tg, fx) {
  let any = false;
  for (const t of tg) {
    if (!t.alive) continue;
    if (s.dmg) {
      for (let h = 0; h < (s.hits || 1); h++) { if (!t.alive) break; dealDamage(u, t, s, fx); any = true; if ((s.hits || 1) > 1) await wait(150); }
      if (t.alive && s.st) for (const [k, turns, ch] of s.st) if (rnd() < ch) { if (addS(t, k, turns)) { popup(t, STATUS[k].label, STATUS[k].c); SND.fx('debuff'); } }
      if (t.alive && s.bar) t.bar = clamp(t.bar + s.bar, 0, 100);
    }
    if (s.heal) { const amt = Math.round(t.maxhp * s.heal * (u.side === 'hero' ? 1 + B.mods.heal : 1)); t.hp = Math.min(t.maxhp, t.hp + amt); popup(t, '+' + amt, '#7fd08a'); burst(...center(t), FXCOL.heal, 8, 1.4, 1, { e: 1 }); }
    if (s.cleanse) { const n = t.st.length; t.st = t.st.filter(x => !STATUS[x.k].debuff); if (t.st.length < n) popup(t, 'Cleansed', '#c8f7d0'); }
    if (s.ally) for (const [k, turns] of s.ally) { if (addS(t, k, turns)) burst(...center(t), FXCOL[fx] || FXCOL.buff, 6, 1.2, 1, { e: 1 }); }
  }
  if (s.ally) popup(u, STATUS[s.ally[0][0]].label, STATUS[s.ally[0][0]].c);
  if (s.self) for (const [k, turns] of s.self) { addS(u, k, turns); popup(u, STATUS[k].label, STATUS[k].c); }
  if (s.selfHeal && u.alive) { const amt = Math.round(u.maxhp * s.selfHeal); u.hp = Math.min(u.maxhp, u.hp + amt); popup(u, '+' + amt, '#7fd08a'); }
  if (s.summon) await summon(u, s.summon);
  if (any) await wait(140);
  for (const t of tg) if (t.alive && t.hp <= 0) await kill(t);
}
function dealDamage(src, t, s, fx) {
  let mult = s.dmg; const el = s.el;
  if (s.exec && t.hp / t.maxhp < .5) mult *= s.exec;
  let em = 1, weak = false;
  if (el === 'holy' && t.undead) { em = 1.6; weak = true; }
  if (el === 'fire' && t.troll) { em = 1.3; weak = true; }
  if (src.side === 'hero') { if (el === 'fire') em *= 1 + B.mods.fire; if (el === 'holy') em *= 1 + B.mods.holy; }
  if (src.hm) { if (t.undead) em *= 1 + src.hm.vsUndead; if (t.goblin) em *= 1 + src.hm.vsGoblin; if (el === 'holy') em *= 1 + src.hm.holy; }
  const crit = rnd() < src.crit + (src.side === 'hero' ? B.mods.crit : 0);
  const d = Math.max(1, Math.round(effAtk(src) * mult * 100 / (100 + effDef(t) * 3) * (.9 + rnd() * .2) * em * (crit ? 1.5 : 1)));
  t.hp -= d; t.flash = 1; setPose(t, 'hurt', 300);
  B.shake = Math.max(B.shake, crit ? 7 : 3.5); B.hitstop = Math.max(B.hitstop, (crit ? 120 : 55) / B.speed); if (crit) B.punch = Math.max(B.punch, .07);
  const [x, y] = center(t);
  const blood = t.undead ? ['#d8cfb4', '#a89f84'] : t.lizard || t.goblin || t.troll ? ['#4a6a2a', '#2e4a1a', '#6a8a3a'] : ['#8a1a14', '#5a0e0c', '#b02a20'];
  burst(x, y, blood, crit ? 14 : 8, crit ? 3 : 2.2, .4, { g: .12 });
  burst(x, y, FXCOL[fx] || FXCOL.phys, crit ? 10 : 5, crit ? 3.4 : 2.4, 0, { e: 1 });
  B.fx.push({ type: 'flash', x, y, r: crit ? 18 : 11, life: 8, max: 8, c: [255, 240, 220] });
  popup(t, String(d), crit ? '#f4c35a' : '#f2e8d4', crit);
  if (weak) setTimeout(() => popup(t, 'Weak!', '#7fd08a'), 90);
  t.knock = (src.side === 'hero' ? 1 : -1) * (crit ? 5 : 3);
  SND.fx(crit ? 'crit' : 'hit');
}
async function kill(u) {
  if (!u.alive) return;
  u.alive = false; u.hp = 0; SND.fx('death'); setPose(u, 'hurt');
  burst(...center(u), u.undead ? ['#d8cfb4', '#8a826c'] : ['#6a6670', '#3a3640'], 18, 2.2, .6, { g: .1 });
  await wait(160); u.pose = 'dead'; B.shake = Math.max(B.shake, 3);
  burst(u.x, u.y, ['#3a3236', '#5a5056'], 10, 2, .3, { g: .05, soft: 1, sz: 2 });
  await tween(360, k => { u.alpha = 1 - k * .45; });
  if (u.side === 'hero') setLog(`<b>${u.name}</b> has fallen.`);
}
async function summon(u, key) {
  const used = new Set(aliveSide('foe').map(x => x.slot));
  const slot = [0, 1, 2, 3, 4].find(i => !used.has(i)); if (slot === undefined || aliveSide('foe').length >= 5) return;
  const f = FOES[key]; const scale = u.atk / (FOES[u.key].atk * FOE_ATK) * .9;
  const n = makeUnit(f, 'foe', slot, { key, name: f.name, maxhp: Math.round(f.hp * scale * FOE_HP), atk: f.atk * scale * FOE_ATK, def: f.def, spd: f.spd, crit: .1, undead: f.undead, goblin: f.goblin });
  n.hp = n.maxhp; n.bar = 0; B.units = B.units.filter(x => x.alive || x.slot !== slot || x.side !== 'foe'); B.units.push(n); layoutUnits(); n.alpha = 0;
  popup(n, f.name, '#b08ae0'); burst(n.x, n.y - 10, FXCOL.dark, 16, 2, 1, { e: 1 }); dlight(n.x, n.y - 10, 60, LIGHTC.dark, 1, 30);
  await tween(320, k => { n.alpha = k; n.oy = (1 - k) * 8; }); n.oy = 0;
}

/* ================= RENDER ================= */
let last = performance.now();
function frame(t) {
  const dt = Math.min(50, t - last); last = t; B.t += dt;
  let frozen = false;
  if (B.hitstop > 0) { B.hitstop -= dt; frozen = true; for (const tw of tweens) tw.t0 += dt; }
  for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i]; const k = clamp((t - tw.t0) / tw.d, 0, 1); tw.fn(tw.ease(k)); if (k >= 1) { tweens.splice(i, 1); tw.res(); } }
  if (!$('section[data-screen="battle"]').hidden && B.scene) draw(frozen ? 0 : dt, dt);
  else if (!$('section[data-screen="guild"]').hidden) drawHall(dt);
  requestAnimationFrame(frame);
}
const AMB = { flies: [], fog: [], embers: [] };
const TINT = new WeakMap();
function tinted(mask, col) { let m = TINT.get(mask); if (!m) TINT.set(mask, m = new Map()); let t = m.get(col); if (t) return t; const [tc, tx] = mk(mask.width, mask.height); tx.drawImage(mask, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = col; tx.fillRect(0, 0, mask.width, mask.height); if (m.size < 24) m.set(col, tc); return tc; }
function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function makeGrain() { const [g, x] = mk(128, 128); const id = x.createImageData(128, 128); for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (Math.random() - .5) * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } x.putImageData(id, 0, 0); return g; }

function draw(dt, rdt) {
  const S = V.S, W = V.aw, H = V.ah, c = cx, sc = B.scene, t = B.t;
  // camera
  const ease = 1 - Math.exp(-rdt * .007);
  B.cam.x += (B.camT.x - B.cam.x) * ease; B.cam.y += (B.camT.y - B.cam.y) * ease; B.cam.z += (B.camT.z - B.cam.z) * ease;
  B.punch *= Math.exp(-rdt * .012);
  const z = B.cam.z + B.punch; const hv = W / (2 * z), vv = H / (2 * z);
  const camx = clamp(B.cam.x, hv, W - hv), camy = clamp(B.cam.y, vv, H - vv);
  let shx = 0, shy = 0; if (B.shake > 0 && !REDUCED) { shx = (rnd() - .5) * B.shake * S * .6; shy = (rnd() - .5) * B.shake * S * .6; } B.shake = Math.max(0, B.shake - rdt * .03);
  const setT = p => { const cxp = W / 2 + (camx - W / 2) * p, cyp = H / 2 + (camy - H / 2) * p; c.setTransform(S * z, 0, 0, S * z, (W / 2 - cxp * z) * S + shx, (H / 2 - cyp * z) * S + shy); };
  const snap = v => Math.round(v * S * z) / (S * z);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
  // layers
  setT(.45); c.imageSmoothingEnabled = true; c.drawImage(sc.far, -24, 0, W + 48, H);
  setT(1); c.imageSmoothingEnabled = false; c.drawImage(sc.mid, 0, 0);
  // pre-light ambient
  if (sc.key === 'mire') { for (let i = 0; i < 30; i++) { const y = Math.round(H * .58 + ((i * 37) % 100) / 100 * H * .42); const x = ((i * 71 + t * .008 * (1 + i % 3)) % (W + 20)) - 10; c.fillStyle = i % 2 ? 'rgba(110,150,150,.35)' : 'rgba(140,170,165,.22)'; c.fillRect(Math.round(x), y, 3 + i % 6, 1); } if (sc.hut) for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(255,190,110,.35)'; c.fillRect(Math.round(sc.hut.x - 2 + Math.sin(t * .003 + i) * 2), Math.round(H * .6 + i * 5), 4 + (i % 3), 1); } }
  // units
  const list = B.units.slice().sort((a, b) => (a.alive - b.alive) || (a.y - b.y));
  const nowT = now();
  for (const u of list) {
    if (u.alpha <= 0) continue;
    if (u.knock) { u.knock *= Math.pow(.82, rdt / 16); if (Math.abs(u.knock) < .1) u.knock = 0; }
    let pose = !u.alive ? 'dead' : (u.pose !== 'idle' && nowT < u.poseUntil) ? u.pose : ((Math.floor((t + u.phase * 900) / 560) % 2) ? 'idle1' : 'idle0');
    if (u.alive && u.pose === 'hurt' && nowT >= u.poseUntil) u.pose = 'idle';
    const f = SPR[u.key][pose]; u._f = f;
    const bob = u.alive ? (u.float ? Math.sin(t * .003 + u.phase) * 2 : 0) + (u.cheer ? -Math.abs(Math.sin(t * .012 + u.phase)) * 4 : 0) : 0;
    const x = u.x + u.ox + (u.knock || 0), y = u.y + u.oy;
    c.globalAlpha = .45 * u.alpha; c.fillStyle = '#000'; c.beginPath(); c.ellipse(x, u.y + .5, (u.big ? 15 : 8) * (u.alive ? 1 : 1.3), u.big ? 3.5 : 2.2, 0, 0, Math.PI * 2); c.fill();
    c.globalAlpha = u.alpha;
    u._dx = snap(x - f.ax); u._dy = snap(y - f.ay + bob + (u.float && u.alive ? -3 : 0));
    c.drawImage(f.n, u._dx, u._dy);
  }
  c.globalAlpha = 1;
  // non-emissive particles + ground fx
  for (const e of B.fx) {
    if (e.type === 'crack') { c.globalAlpha = Math.min(1, e.life / 20); c.fillStyle = '#0a0608'; for (const pts of e.segs) for (const [px, py] of pts) c.fillRect(Math.round(px), Math.round(py), 1, 1); }
    if (e.type === 'vines') { const k = 1 - e.life / e.max; const g = Math.min(1, k * 4); c.globalAlpha = Math.min(1, e.life / 12); for (const l of e.lines) { const h = l.h * g; for (let j = 0; j < h; j++) { const px = l.x0 + l.lean * (j / l.h) + Math.sin(j * .7) * .8; c.fillStyle = j % 4 === 0 ? '#5a8a3a' : '#2e4a22'; c.fillRect(Math.round(px), Math.round(e.y - j), 1, 1); if (j % 5 === 2) { c.fillStyle = '#a8c86a'; c.fillRect(Math.round(px + 1), Math.round(e.y - j), 1, 1); } } } }
  }
  c.globalAlpha = 1;
  drawParts(c, dt, false);
  // LIGHTING
  const lw = lm.width, lh = lm.height, kx = lw / W;
  lmx.setTransform(1, 0, 0, 1, 0, 0); lmx.globalCompositeOperation = 'source-over'; lmx.fillStyle = `rgb(${sc.ambient.join(',')})`; lmx.fillRect(0, 0, lw, lh);
  lmx.globalCompositeOperation = 'lighter';
  const addL = (x, y, r, col, i) => { if (i <= 0.01) return; const g = lmx.createRadialGradient(x * kx, y * kx, 0, x * kx, y * kx, r * kx); g.addColorStop(0, rgba(col, Math.min(1, i))); g.addColorStop(.45, rgba(col, Math.min(1, i) * .42)); g.addColorStop(1, rgba(col, 0)); lmx.fillStyle = g; lmx.fillRect((x - r) * kx, (y - r) * kx, r * 2 * kx, r * 2 * kx); };
  addL(W / 2, H * .82, W * .62, sc.stage, .7);
  const hs = aliveSide('hero'); if (hs.length) { const hx = hs.reduce((a, u) => a + u.x, 0) / hs.length; addL(hx, H * .76, W * .34, [255, 200, 160], .5); }
  const lights = [];
  for (const L of sc.lights) { const fl = L.fl ? 1 + Math.sin(t * .011 + L.fl) * .1 + Math.sin(t * .037 + L.fl * 2) * .06 : 1; lights.push({ x: L.x, y: L.y, r: L.r * (L.fl ? .97 + fl * .03 : 1), c: L.c, i: L.i * fl, bloom: L.bloom }); }
  for (const u of B.units) if (u.alive && u._f) for (const gl of u._f.glows) lights.push({ x: u._dx + gl.x, y: u._dy + gl.y, r: gl.r, c: hex(gl.c), i: .7, bloom: .5 });
  for (const p of B.projs) if (!p.arrow && !p.stone) lights.push({ x: p.x, y: p.y, r: 46, c: LIGHTC[p.fx] || [255, 220, 180], i: 1, bloom: .8 });
  for (let i = B.dl.length - 1; i >= 0; i--) { const d = B.dl[i]; d.life -= dt * .06; if (d.life <= 0) { B.dl.splice(i, 1); continue; } lights.push({ x: d.x, y: d.y, r: d.r, c: d.c, i: d.i * (d.life / d.max), bloom: .6 }); }
  if (sc.wisps) for (const w of sc.wisps) { w.cx = w.x + Math.sin(t * .0007 + w.p) * 22; w.cy = w.y + Math.sin(t * .0013 + w.p * 2) * 6; lights.push({ x: w.cx, y: w.cy, r: 42, c: [150, 255, 200], i: .55 + Math.sin(t * .004 + w.p) * .15, bloom: .7 }); }
  if (B.turn && B.turn.alive) lights.push({ x: B.turn.x, y: B.turn.y - 6, r: 34, c: [255, 220, 170], i: .35 });
  for (const L of lights) addL(L.x, L.y, L.r, L.c, L.i);
  setT(1); c.globalCompositeOperation = 'multiply'; c.imageSmoothingEnabled = true; c.drawImage(lm, 0, 0, W, H); c.globalCompositeOperation = 'source-over'; c.imageSmoothingEnabled = false;
  // rim light + flashes
  c.globalCompositeOperation = 'lighter';
  for (const u of B.units) {
    if (!u.alive || !u._f || u.alpha <= 0) continue; const f = u._f; const [ux, uy] = [u.x, u.y - f.h / 2];
    let best = null, bi = 0; for (const L of lights) { const d = Math.hypot(L.x - ux, L.y - uy); const v = L.i * Math.max(0, 1 - d / (L.r * 1.25)); if (v > bi && d > 4) { bi = v; best = L; } }
    if (best && bi > .05) { c.globalAlpha = Math.min(.95, bi * 1.5) * u.alpha; c.drawImage(tinted(best.x > ux ? f.rr : f.rl, rgba(best.c, 1)), u._dx, u._dy); }
    if (B.hover === u) { c.globalAlpha = .7 + Math.sin(t * .012) * .2; c.drawImage(tinted(f.rr, '#c0392b'), u._dx, u._dy); c.drawImage(tinted(f.rl, '#c0392b'), u._dx, u._dy); }
  }
  c.globalCompositeOperation = 'source-over';
  for (const u of B.units) { if (u.flash > 0 && u._f) { c.globalAlpha = u.alpha * Math.min(1, u.flash); c.drawImage(u._f.w, u._dx, u._dy); u.flash = Math.max(0, u.flash - rdt * .007); } }
  c.globalAlpha = 1;
  // emissive: flames, projectiles, fx, particles
  for (const fl of sc.flames) drawFlame(c, fl, t);
  c.globalCompositeOperation = 'lighter';
  for (const p of B.projs) {
    if (p.arrow) { c.globalCompositeOperation = 'source-over'; const a = Math.atan2(p.y - p.py, p.x - p.px); c.save(); c.translate(p.x, p.y); c.rotate(a); c.fillStyle = '#d8cfb4'; c.fillRect(-5, -.5, 7, 1); c.fillStyle = '#8a8e9a'; c.fillRect(2, -1, 2, 2); c.fillStyle = '#8a2a22'; c.fillRect(-6, -1, 2, 2); c.restore(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(p.x - 14 * Math.sign(p.x - p.px || 1), p.y, 10, .5); continue; }
    if (p.stone) { c.globalCompositeOperation = 'source-over'; c.fillStyle = '#8a8a92'; c.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2); c.globalCompositeOperation = 'lighter'; continue; }
    glow(c, p.x, p.y, 12, LIGHTC[p.fx] || [255, 220, 180], .55); c.fillStyle = p.c[0]; c.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 4, 4); c.fillStyle = '#fff6e0'; c.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2);
  }
  for (let i = B.fx.length - 1; i >= 0; i--) {
    const e = B.fx[i]; e.life -= dt * .06; if (e.life <= 0) { B.fx.splice(i, 1); continue; } const k = e.life / e.max;
    if (e.type === 'trail') { c.strokeStyle = rgba(e.c, k * .9); c.lineWidth = 3 * k + .5; c.beginPath(); const a0 = e.dir > 0 ? -1.9 : -1.2, a1 = e.dir > 0 ? .6 : 2.5; c.arc(e.x, e.y, 11, Math.min(a0, a1), Math.max(a0, a1)); c.stroke(); c.strokeStyle = rgba([255, 255, 255], k * .6); c.lineWidth = 1; c.beginPath(); c.arc(e.x, e.y, 10, Math.min(a0, a1) + .3, Math.max(a0, a1) - .3); c.stroke(); }
    if (e.type === 'flash') { glow(c, e.x, e.y, e.r * (1.4 - k * .4), e.c, k * .9); c.fillStyle = rgba([255, 255, 255], k * .8); const s = Math.round(e.r * .5 * k); c.fillRect(e.x - s, e.y - .5, s * 2, 1); c.fillRect(e.x - .5, e.y - s, 1, s * 2); }
    if (e.type === 'ring') { const r = e.r1 - (e.r1 - e.r0) * k; c.strokeStyle = rgba(e.c, k * .8); c.lineWidth = 1.5; c.beginPath(); c.ellipse(e.x, e.y, r, r * .32, 0, 0, Math.PI * 2); c.stroke(); }
    if (e.type === 'pillar') { const w = 10 * Math.min(1, (1 - k) * 4) * (k < .3 ? k / .3 : 1); const g = c.createLinearGradient(0, e.y - H, 0, e.y); g.addColorStop(0, rgba(e.c, 0)); g.addColorStop(.7, rgba(e.c, .35)); g.addColorStop(1, rgba(e.c, .8)); c.fillStyle = g; c.fillRect(e.x - w / 2, e.y - H, w, H); c.fillStyle = rgba([255, 255, 240], .7 * k); c.fillRect(e.x - w / 6, e.y - H, w / 3, H); }
    if (e.type === 'beam') { c.strokeStyle = rgba(e.c, k * .5); c.lineWidth = 6 * k; c.beginPath(); c.moveTo(e.x0, e.y0); c.lineTo(e.x1, e.y1); c.stroke(); c.strokeStyle = rgba([240, 240, 255], k); c.lineWidth = 1.5 * k + .5; c.stroke(); }
    if (e.type === 'rune') { c.strokeStyle = rgba(e.c, k); c.lineWidth = 1; const r = 9 + (1 - k) * 4, a = t * .006; c.beginPath(); c.arc(e.x, e.y, r, 0, Math.PI * 2); c.stroke(); for (let j = 0; j < 6; j++) { const aa = a + j * Math.PI / 3; c.fillStyle = rgba(e.c, k); c.fillRect(e.x + Math.cos(aa) * r - 1, e.y + Math.sin(aa) * r - 1, 2, 2); } }
  }
  drawParts(c, dt, true);
  // ambient emissives
  if (sc.key === 'thorn') { if (AMB.flies.length < 14) AMB.flies.push({ x: rnd() * W, y: H * .3 + rnd() * H * .45, p: rnd() * 6 }); AMB.flies.forEach(f => { f.x += Math.sin(t * .0009 + f.p) * .1 * dt / 16; f.y += Math.cos(t * .0013 + f.p * 2) * .07 * dt / 16; const a = .5 + Math.sin(t * .004 + f.p * 3) * .5; glow(c, f.x, f.y, 5, [216, 240, 122], .3 * a); c.fillStyle = rgba([232, 245, 154], a); c.fillRect(Math.round(f.x), Math.round(f.y), 1, 1); }); }
  if (sc.wisps) for (const w of sc.wisps) { glow(c, w.cx, w.cy, 10, [150, 255, 200], .5); c.fillStyle = '#e8fff0'; c.fillRect(Math.round(w.cx) - 1, Math.round(w.cy) - 1, 2, 2); }
  if (sc.key === 'crypt') { if (AMB.flies.length < 22) AMB.flies.push({ x: rnd() * W, y: rnd() * H, v: .02 + rnd() * .03, p: rnd() * 6 }); c.fillStyle = 'rgba(255,220,180,.28)'; AMB.flies.forEach(f => { f.y -= f.v * dt * .1; f.x += Math.sin(t * .001 + f.p) * .03 * dt / 16; if (f.y < 0) { f.y = H; f.x = rnd() * W; } c.fillRect(Math.round(f.x), Math.round(f.y), 1, 1); }); }
  // bloom on strong lights
  for (const L of lights) if (L.bloom) glow(c, L.x, L.y, L.r * .35, L.c, .22 * L.bloom * Math.min(1, L.i));
  c.globalCompositeOperation = 'source-over';
  // foreground (depth-blurred) + fog
  setT(1.25); c.imageSmoothingEnabled = true; c.drawImage(sc.fg, -24, 0, W + 48, H); setT(1);
  if (!AMB.fog.length) for (let i = 0; i < (sc.key === 'mire' ? 7 : 4); i++) AMB.fog.push({ x: rnd() * W, y: H * (.5 + rnd() * .45), r: 30 + rnd() * 45, v: .004 + rnd() * .006 });
  const fogA = sc.key === 'mire' ? .16 : .07;
  AMB.fog.forEach(f => { f.x += f.v * rdt; if (f.x - f.r > W) f.x = -f.r; const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); g.addColorStop(0, sc.fog + fogA + ')'); g.addColorStop(1, sc.fog + '0)'); c.fillStyle = g; c.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2); });
  c.imageSmoothingEnabled = false;
  // UI in world
  drawUnitUI(c, t, rdt);
  // screen space: grade, vignette, grain
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'soft-light'; c.fillStyle = sc.grade; c.fillRect(0, 0, cv.width, cv.height);
  c.globalCompositeOperation = 'source-over';
  const vg = c.createRadialGradient(cv.width / 2, cv.height * .55, cv.height * .3, cv.width / 2, cv.height * .55, cv.width * .68); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(3,2,5,.78)'); c.fillStyle = vg; c.fillRect(0, 0, cv.width, cv.height);
  if (!grain) grain = makeGrain();
  if (!REDUCED) { c.globalCompositeOperation = 'overlay'; c.globalAlpha = .09; const pat = c.createPattern(grain, 'repeat'); c.save(); c.translate(Math.floor(rnd() * 128), Math.floor(rnd() * 128)); c.fillStyle = pat; c.fillRect(-128, -128, cv.width + 256, cv.height + 256); c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
}
function glow(c, x, y, r, col, a) { if (a <= 0) return; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
function drawParts(c, dt, emissive) {
  for (let i = B.parts.length - 1; i >= 0; i--) {
    const p = B.parts[i]; if (!!p.e !== emissive) continue;
    p.x += p.vx * dt * .06; p.y += p.vy * dt * .06; p.vy += p.g * dt * .06; p.life -= dt * .06;
    if (p.life <= 0) { B.parts.splice(i, 1); continue; }
    const a = clamp(p.life / Math.min(20, p.max), 0, 1);
    if (p.soft) { c.globalAlpha = 1; glow(c, p.x, p.y, p.sz * 2.5, hex(p.c), a * (emissive ? .7 : .45)); }
    else { c.globalAlpha = a; c.fillStyle = p.c; c.fillRect(Math.round(p.x), Math.round(p.y), p.sz, p.sz); }
  }
  c.globalAlpha = 1;
}
function drawFlame(c, f, t) {
  const s = f.s; const fl = REDUCED ? 0 : Math.sin(t * .02 + f.x) * .5 + Math.sin(t * .057 + f.y) * .5; const h = Math.round((f.candle ? 2 : 5 * s) + fl * (f.candle ? .6 : 1.4 * s));
  const w = f.candle ? 1 : Math.round(3 * s); const x = Math.round(f.x - w / 2), y = Math.round(f.y);
  c.fillStyle = '#c23a14'; c.fillRect(x - (f.candle ? 0 : 1), y - h, w + (f.candle ? 0 : 2), h);
  c.fillStyle = '#ff8a2a'; c.fillRect(x, y - h + 1, w, h - 1);
  c.fillStyle = '#ffe08a'; c.fillRect(x + Math.floor(w / 3), y - Math.ceil(h * .6), Math.max(1, Math.round(w / 3)), Math.ceil(h * .6));
  if (!f.candle && !f.still && rnd() < .12 * s) part({ x: f.x + (rnd() - .5) * w, y: y - h, vx: (rnd() - .5) * .3, vy: -.4 - rnd() * .5, life: 30 + rnd() * 30, c: pick(['#ff9a3a', '#ffd06a']), e: 1, g: -.003 });
}
function drawUnitUI(c, t, rdt) {
  const vt = (B.awaiting && B.pending) ? validTargets(B.awaiting.u, B.pending) : [];
  for (const u of B.units) {
    if (!u.alive || !u._f) continue; const f = u._f;
    const f0 = SPR[u.key].idle0; const bw = u.big ? 28 : 18; const x = u.x + u.ox + (u.knock || 0); const by = Math.round(u.y - f0.h - 6 + (u.float ? -3 : 0)); const bx = Math.round(x - bw / 2);
    const fr_ = clamp(u.hp / u.maxhp, 0, 1); u.ghost = Math.max(fr_, u.ghost - rdt * .0004); if (u.ghost < fr_) u.ghost = fr_;
    c.fillStyle = 'rgba(8,5,6,.85)'; c.fillRect(bx - 1, by - 1, bw + 2, 5);
    c.fillStyle = '#2a0e0e'; c.fillRect(bx, by, bw, 2);
    c.fillStyle = 'rgba(230,217,188,.75)'; c.fillRect(bx, by, Math.round(bw * u.ghost), 2);
    c.fillStyle = u.side === 'hero' ? '#b8322a' : '#8e1e18'; c.fillRect(bx, by, Math.round(bw * fr_), 2);
    c.fillStyle = 'rgba(255,190,170,.45)'; c.fillRect(bx, by, Math.round(bw * fr_), 1);
    c.fillStyle = '#1a1410'; c.fillRect(bx, by + 2, bw, 1); c.fillStyle = '#b8a57a'; c.fillRect(bx, by + 2, Math.round(bw * clamp(u.bar / 100, 0, 1)), 1);
    if (u.side === 'hero') { c.fillStyle = '#8a6d3b'; c.fillRect(bx - 1, by - 1, 1, 5); }
    u.st.forEach((s, i) => { c.fillStyle = 'rgba(8,5,6,.9)'; c.fillRect(bx + i * 4 - 1, by - 5, 4, 4); c.fillStyle = STATUS[s.k].c; c.fillRect(bx + i * 4, by - 4, 2, 2); });
    if (B.turn === u) { c.globalAlpha = .6 + Math.sin(t * .01) * .3; c.strokeStyle = '#d6a84e'; c.lineWidth = 1; c.beginPath(); c.ellipse(u.x + u.ox, u.y + .5, u.big ? 17 : 10, u.big ? 4 : 2.8, 0, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1; }
    if (vt.includes(u)) { const hot = B.hover === u; const ay = by - (u.st.length ? 9 : 5) - Math.round(Math.abs(Math.sin(t * .008)) * 2); c.fillStyle = hot ? '#ffffff' : '#c0392b'; for (let r = 0; r < 3; r++) c.fillRect(Math.round(x) - (2 - r), ay + r, 2 * (2 - r) + 1, 1); }
  }
  for (let i = B.popups.length - 1; i >= 0; i--) {
    const p = B.popups[i]; p.t += rdt; if (p.t > 950) { B.popups.splice(i, 1); continue; } if (p.t < 0) continue;
    const k = p.t / 950; const pop = p.t < 120 ? 1 + (1 - p.t / 120) * .5 : 1; const size = (p.big ? 11 : 8) * pop;
    const yy = p.y - 9 * Math.sqrt(k);
    c.font = `700 ${size}px "Pixelify Sans", ui-monospace, monospace`; c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.globalAlpha = k > .7 ? (1 - k) / .3 : 1; c.lineWidth = 2.2; c.strokeStyle = '#0a0608'; c.lineJoin = 'round'; c.strokeText(p.text, p.x, yy); c.fillStyle = p.color; c.fillText(p.text, p.x, yy);
  }
  c.globalAlpha = 1;
}

