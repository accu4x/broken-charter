/* ================= SAVE & CLOCK ================= */
// Game days, not the device clock: SAVE.day counts up by one each time the player sleeps.
const FOE_ATK = 1.45, FOE_HP = 1.2;
const BOARD_DAYS = 3;
const xpNeed = lv => 80 + 40 * (lv - 1);
const lvMul = lv => 1 + .07 * (lv - 1);
function newSave() { return { v: 3, day: 1, contractDay: null, gold: 60, done: 0, wins: {}, roster: [], party: [], leader: null, contract: 'crypt', mats: { bone: 2, iron: 2, scrap: 2, hide: 2, scale: 2, venom: 2 }, items: { draught: 1, antivenom: 0, oil: 0 }, pack: { draught: 1, antivenom: 0, oil: 0 }, build: { hall: 1, yard: 1, forge: 1 }, posts: {}, dispatch: [], reports: [], chapel: [], fallen: [], intel: {}, board: [], boardDay: null, nextUid: 1, note: '' }; }
let SAVE = store.get('bc.save', null);
store.del('bc.dayshift');
if (SAVE && SAVE.v === 2) {
  // v2 -> v3: real dates become game days. Anything out or locked resolves on the first Sleep.
  SAVE.v = 3; SAVE.day = 1; SAVE.contractDay = store.get('bc.run', null) ? 1 : null;
  SAVE.dispatch.forEach(d => d.back = 2);
  for (const k in SAVE.posts) if (SAVE.posts[k]) SAVE.posts[k].until = 2;
  SAVE.boardDay = SAVE.board && SAVE.board.length ? 1 : null;
  store.set('bc.save', SAVE);
}
if (!SAVE || SAVE.v !== 3) {
  const old = SAVE || {}; const s = newSave();
  s.gold = old.gold != null ? old.gold : 60; s.done = old.done || 0; s.wins = old.wins || {}; s.contract = old.contract || 'crypt';
  const starters = [['brenna', 'Brenna', 'warrior', 'human'], ['sela', 'Sela', 'thief', 'elf'], ['orrin', 'Orrin', 'mage', 'human'], ['hilde', 'Hilde', 'priest', 'dwarf'], ['grask', 'Grask', 'ranger', 'orc'], ['wren', 'Wren', 'druid', 'elf']];
  for (const [uid, name, cls, race] of starters) { const oh = (old.heroes || {})[uid] || { lv: 1, xp: 0 }; s.roster.push({ uid, name, cls, race, lv: oh.lv, xp: oh.xp, quirks: [], gear: { weapon: 0, armor: 0, trinket: null }, sub: null, look: null }); }
  s.party = (old.party || ['brenna', 'sela', 'orrin', 'hilde', 'grask']).slice(0, 5); s.leader = old.leader || 'brenna';
  SAVE = s; store.set('bc.save', SAVE);
}
const save = () => store.set('bc.save', SAVE);
let RUN = store.get('bc.run', null);
if (RUN) { RUN.pack = RUN.pack || {}; RUN.mats = RUN.mats || {}; }
const saveRun = () => { if (RUN) store.set('bc.run', RUN); else store.del('bc.run'); };
const heroById = uid => SAVE.roster.find(h => h.uid === uid);

/* ---------- hero math ---------- */
function heroMods(h) {
  const m = { hp: 0, atk: 0, def: 0, spd: 0, crit: 0, spdFlat: 0, xp: 0, vsUndead: 0, vsGoblin: 0, holy: 0, poisonImmune: 0, cryptSpd: 0, greedy: 0 };
  const add = o => { for (const k in o) m[k] = (m[k] || 0) + o[k]; };
  add(RACES[h.race].mods); h.quirks.forEach(q => add(QUIRKS[q].mods)); if (h.sub) add(CLASSES[h.cls].subs[h.sub].mods);
  if (h.gear.weapon) add(GEAR.weapon[h.gear.weapon].mods); if (h.gear.armor) add(GEAR.armor[h.gear.armor].mods); if (h.gear.trinket) add(TRINKETS[h.gear.trinket].mods);
  return m;
}
function heroStats(h) { const C = CLASSES[h.cls], m = heroMods(h), L = lvMul(h.lv); return { hp: Math.round(C.hp * L * (1 + m.hp)), atk: C.atk * L * (1 + m.atk), def: C.def * L * (1 + m.def), spd: Math.round(C.spd * (1 + m.spd) + m.spdFlat), crit: C.crit + m.crit, m }; }
function heroSkills(h) { const C = CLASSES[h.cls]; const sk = C.skills.slice(); if (h.sub) sk[2] = C.subs[h.sub].skill; return sk; }
function className(h) { return CLASSES[h.cls].name + (h.sub ? ' · ' + CLASSES[h.cls].subs[h.sub].name : ''); }
function ensureSprite(h) { if (!SPR[h.uid]) SPR[h.uid] = makeFrames(humanoid, h.look || LOOKS[h.uid], false); }
function postHolder(k) { const p = SAVE.posts[k]; return p && heroById(p.uid) ? heroById(p.uid) : null; }
function heroState(h) {
  if (SAVE.chapel.some(c => c.uid === h.uid)) return 'chapel';
  if (Object.values(SAVE.posts).some(p => p && p.uid === h.uid)) return 'posted';
  if (SAVE.dispatch.some(d => d.uid === h.uid)) return 'away';
  if (RUN && RUN.party.includes(h.uid)) return 'run';
  return 'ready';
}
const STATE_LABEL = { chapel: 'In the chapel', posted: 'On post', away: 'Dispatched', run: 'On contract', ready: 'Ready' };
const disc = { drill: () => { const h = postHolder('drill'); return h ? (h.cls === 'warrior' ? .35 : .25) : 0; }, recruit: () => { const h = postHolder('recruiter'); return h ? (h.cls === 'thief' ? .3 : .2) : 0; }, qm: () => { const h = postHolder('quartermaster'); return h ? (h.cls === 'ranger' ? .25 : .15) : 0; }, chap: () => { const h = postHolder('chaplain'); return h ? (h.cls === 'priest' || h.cls === 'druid' ? .25 : .15) : 0; } };
function trainCost(h) { return Math.round(50 * h.lv * (1 - disc.drill()) * (1 + heroMods(h).greedy)); }
const yardCap = () => [0, 4, 7, 10][SAVE.build.yard];
const rosterCap = () => [0, 10, 12, 14][SAVE.build.hall];
function forgeCost(cost) { const s = postHolder('smith'); if (!s) return cost; const o = {}; for (const k in cost) o[k] = k === 'g' ? Math.round(cost[k] * .75) : (s.race === 'dwarf' ? Math.max(1, cost[k] - 1) : cost[k]); return o; }
function canPay(cost) { for (const k in cost) { if (k === 'g') { if (SAVE.gold < cost.g) return false; } else if ((SAVE.mats[k] || 0) < cost[k]) return false; } return true; }
function pay(cost) { for (const k in cost) { if (k === 'g') SAVE.gold -= cost.g; else SAVE.mats[k] -= cost[k]; } }
function costHTML(cost) { return Object.keys(cost).map(k => k === 'g' ? `<span class="cost ${SAVE.gold < cost.g ? 'short' : ''}"><b class="gold">${cost.g}g</b></span>` : `<span class="cost ${(SAVE.mats[k] || 0) < cost[k] ? 'short' : ''}"><i class="dot" style="background:${MATCOL[k]}"></i>${cost[k]} ${MATS[k].split(' ').pop()}</span>`).join(''); }

/* ---------- recruitment ---------- */
function genCandidate() {
  const R = Math.random; const P = a => a[Math.floor(R() * a.length)];
  const cls = P(Object.keys(CLASSES)), race = P(Object.keys(RACES));
  const taken = new Set(SAVE.roster.map(h => h.name).concat(SAVE.fallen.map(f => f.name)));
  const pool = NAMES[race].filter(n => !taken.has(n)); const name = P(pool.length ? pool : NAMES[race]);
  const goods = Object.keys(QUIRKS).filter(k => QUIRKS[k].good), bads = Object.keys(QUIRKS).filter(k => !QUIRKS[k].good);
  const quirks = []; if (R() < .8) quirks.push(P(goods)); if (R() < .45 || !quirks.length) { const b = P(bads); quirks.push(b); }
  const lv = SAVE.build.hall >= 3 && R() < .4 ? 2 : 1;
  const nG = quirks.filter(q => QUIRKS[q].good).length, nB = quirks.length - nG;
  const cost = 70 + nG * 25 - nB * 15 + (lv - 1) * 60;
  return { uid: 'r' + (SAVE.nextUid++) + '_' + Math.floor(R() * 1e4), name, cls, race, lv, xp: 0, quirks, gear: { weapon: 0, armor: 0, trinket: null }, sub: null, look: recruitLook(cls, race, R), cost };
}
const boardDaysLeft = () => SAVE.boardDay == null ? 0 : Math.max(0, SAVE.boardDay + BOARD_DAYS - SAVE.day);
function refreshBoard() { if (SAVE.board && boardDaysLeft() > 0) return false; const n = 2 + SAVE.build.hall + (postHolder('recruiter') ? 1 : 0); SAVE.board = Array.from({ length: n }, genCandidate); SAVE.boardDay = SAVE.day; save(); return true; }
function hireCost(c) { if (desperate()) return 0; return Math.round(c.cost * (1 - disc.recruit()) * (1 + (c.quirks.includes('greedy') ? .15 : 0))); }
function desperate() { return SAVE.roster.filter(h => heroState(h) !== 'chapel').length === 0; }

/* ---------- day rollover: Sleep, dispatch returns, post locks ---------- */
const contractTaken = () => SAVE.contractDay === SAVE.day;
function sleep() {
  if (RUN) return;
  SAVE.day++; GUI.confirm = null; SAVE.note = '';
  collectDispatch();
  if (refreshBoard()) SAVE.reports.push('New faces are waiting on the recruit board.');
  SND.fx('heal'); renderGuild();
}
function collectDispatch() {
  const t = SAVE.day; const back = SAVE.dispatch.filter(d => d.back <= t); if (!back.length) return;
  SAVE.dispatch = SAVE.dispatch.filter(d => d.back > t);
  for (const d of back) {
    const h = heroById(d.uid); if (!h) continue; let line = `<b>${h.name}</b> returned from `;
    if (d.kind === 'gather') { const n = 2 + Math.floor(h.lv / 2) + (h.race === 'dwarf' || h.cls === 'druid' ? 2 : 0); const got = {}; for (let i = 0; i < n; i++) { const m = pick(REGION_MATS[d.region]); got[m] = (got[m] || 0) + 1; SAVE.mats[m] += 1; } line += `gathering in ${SETTINGS[d.region].name} with ` + Object.keys(got).map(k => `${got[k]} ${MATS[k].toLowerCase()}`).join(' and ') + '.'; }
    if (d.kind === 'hunt') { const g = 25 + 10 * h.lv + (h.cls === 'ranger' || h.race === 'orc' ? 20 : 0); SAVE.gold += g; line += `the hunt with <b class="gold">${g} gold</b> in pelts and bounties.`; }
    if (d.kind === 'scout') { SAVE.intel[d.region] = true; SAVE.gold += 10; line += `scouting ${SETTINGS[d.region].name}. The next party there moves first and earns 10% more gold.`; }
    h.xp += 20; while (h.xp >= xpNeed(h.lv)) { h.xp -= xpNeed(h.lv); h.lv++; line += ` ${h.name} reached Lv ${h.lv}.`; }
    SAVE.reports.push(line);
  }
  save();
}

/* ================= SCREENS ================= */
function show(name) { document.querySelectorAll('section[data-screen]').forEach(s => s.hidden = s.dataset.screen !== name); window.scrollTo(0, 0); if (name === 'battle') requestAnimationFrame(sizeCanvas); }
function portrait(id, size) {
  const c = document.createElement('canvas'); c.width = 30; c.height = 30; c.className = 'px';
  const f = SPR[id].idle0; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(f.n, f.ax - 14, Math.max(0, f.top - 1), 30, 30, 0, 0, 30, 30);
  if (size) { c.style.width = size + 'px'; c.style.height = size + 'px'; } return c;
}
function fullFigure(id, size) { const f = SPR[id].idle0; const c = document.createElement('canvas'); c.width = 34; c.height = 40; c.className = 'px'; c.getContext('2d').drawImage(f.n, 17 - f.ax, 38 - f.ay); if (size) { c.style.width = size + 'px'; c.style.height = Math.round(size * 40 / 34) + 'px'; } return c; }
function iconCanvas(kind, size) { const c = document.createElement('canvas'); c.width = 12; c.height = 12; c.className = 'px'; c.getContext('2d').drawImage(ICONS[kind], 0, 0); if (size) { c.style.width = size + 'px'; c.style.height = size + 'px'; } return c; }
const THUMBS = {}; function thumb(k) { return THUMBS[k] || (THUMBS[k] = sceneThumb(k)); }

/* ================= GUILD HALL ================= */
const GUI = { tab: store.get('bc.tab', 'hall'), forgeHero: null, subFor: null, confirm: null, dMission: 'gather:crypt' };
const TABS = [['hall', 'Hall'], ['roster', 'Roster'], ['recruit', 'Recruit'], ['forge', 'Forge'], ['dispatch', 'Dispatch'], ['posts', 'Posts'], ['chapel', 'Chapel']];
function rankName() { const d = SAVE.done; return d >= 8 ? 'Charter Bastion' : d >= 4 ? 'Charter House' : d >= 1 ? 'Charter Lodge' : 'Charter Hall'; }
function renderGuild() {
  collectDispatch(); refreshBoard();
  SAVE.roster.forEach(ensureSprite); (SAVE.board || []).forEach(ensureSprite);
  SAVE.party = SAVE.party.filter(uid => heroById(uid) && heroState(heroById(uid)) === 'ready');
  if (!SAVE.party.includes(SAVE.leader)) SAVE.leader = SAVE.party[0] || null;
  SND.play('guild');
  $('#gGold').textContent = SAVE.gold; $('#gDone').textContent = SAVE.done; $('#gRank').textContent = rankName();
  $('#gDay').textContent = SAVE.day;
  $('#sleepRow').innerHTML = GUI.confirm === 'sleep'
    ? `<span>End the day without a contract?</span><button class="btn small" data-act="sleep" type="button">Sleep</button><button class="btn small" data-act="cancel" type="button">Stay up</button>`
    : `<span class="muted small">${RUN ? 'A party is still out.' : contractTaken() ? "Today's contract is taken." : 'One contract a day.'}</span><button class="btn small" data-act="${contractTaken() ? 'sleep' : 'askSleep'}" ${RUN ? 'disabled' : ''} type="button">Sleep</button>`;
  $('#gMats').innerHTML = Object.keys(MATS).map(k => `<span class="mat" title="${MATS[k]}"><i class="dot" style="background:${MATCOL[k]}"></i>${MATS[k]} <b class="num">${SAVE.mats[k] || 0}</b></span>`).join('');
  $('#musicBtn').textContent = 'Music ' + (SND.musicOn ? 'on' : 'off'); $('#musicBtn').classList.toggle('on', SND.musicOn);
  $('#sfxBtn').textContent = 'Sound ' + (SND.sfxOn ? 'on' : 'off'); $('#sfxBtn').classList.toggle('on', SND.sfxOn);
  $('#resumeWin').hidden = !RUN; if (RUN) $('#resumeName').textContent = SETTINGS[RUN.contract].name;
  const badges = { recruit: '', dispatch: SAVE.reports.length ? '•' : '', chapel: SAVE.chapel.length ? String(SAVE.chapel.length) : '', hall: SAVE.reports.length ? '•' : '' };
  $('#tabs').innerHTML = TABS.map(([k, l]) => `<button type="button" class="tab ${GUI.tab === k ? 'on' : ''}" data-act="tab" data-k="${k}" role="tab" aria-selected="${GUI.tab === k}">${l}${badges[k] ? `<sup>${badges[k]}</sup>` : ''}</button>`).join('');
  const P = $('#panel');
  P.innerHTML = ({ hall: tabHall, roster: tabRoster, recruit: tabRecruit, forge: tabForge, dispatch: tabDispatch, posts: tabPosts, chapel: tabChapel })[GUI.tab]();
  P.querySelectorAll('[data-fig]').forEach(el => { const id = el.dataset.fig; if (SPR[id]) el.appendChild(fullFigure(id, +(el.dataset.size || 60))); });
  P.querySelectorAll('[data-port]').forEach(el => { const id = el.dataset.port; if (SPR[id]) el.appendChild(portrait(id, +(el.dataset.size || 34))); });
  P.querySelectorAll('[data-thumb]').forEach(el => el.style.backgroundImage = `url(${thumb(el.dataset.thumb)})`);
  save();
}
function buildingCard(key) {
  const lv = SAVE.build[key], B = BUILDINGS[key]; const up = UPCOST[lv + 1];
  return `<div class="bld"><div><span class="label">${B.name} · Level ${lv}</span><p>${B.lv[lv]}</p>${up ? `<p class="muted small">Next: ${B.lv[lv + 1]}</p>` : ''}</div>${up ? `<div class="buy"><div class="costs">${costHTML(up)}</div><button class="btn small" data-act="upgrade" data-k="${key}" ${canPay(up) ? '' : 'disabled'} type="button">Upgrade</button></div>` : '<span class="chip good">Fully upgraded</span>'}</div>`;
}
function quirkChips(h) { return h.quirks.map(q => `<span class="chip ${QUIRKS[q].good ? 'good' : 'warn'}" title="${QUIRKS[q].text}">${QUIRKS[q].name}</span>`).join(''); }
function statLine(h) { const s = heroStats(h); return `HP ${s.hp} · ATK ${Math.round(s.atk)} · DEF ${Math.round(s.def)} · SPD ${s.spd}`; }

function tabHall() {
  let h = '';
  if (SAVE.reports.length) h += `<div class="win notice"><div class="spread"><span class="label">Overnight</span><button class="btn small" data-act="clearReports" type="button">Dismiss</button></div>${SAVE.reports.map(r => `<p>${r}</p>`).join('')}</div>`;
  if (SAVE.chapel.length) h += `<div class="win notice warnbox"><div class="spread"><p>${SAVE.chapel.length} fallen hero${SAVE.chapel.length > 1 ? 'es lie' : ' lies'} in the chapel awaiting a decision.</p><button class="btn small" data-act="tab" data-k="chapel" type="button">Go to the chapel</button></div></div>`;
  h += `<div class="win"><div class="spread" style="margin-bottom:10px"><h2>Contract board</h2><span class="label">Pick one</span></div><div class="contracts">`;
  for (const k in SETTINGS) { const s = SETTINGS[k]; const wins = SAVE.wins[k] || 0;
    h += `<button type="button" class="card contract cursor ${SAVE.contract === k ? 'sel' : ''}" data-act="contract" data-k="${k}"><div class="thumb" data-thumb="${k}"></div><span class="label">${s.tier}</span><h3>${s.name}</h3><p class="blurb">${s.blurb}</p><div class="row" style="gap:6px">${s.tags.map(t => `<span class="chip ${t[1]}">${t[0]}</span>`).join('')}${SAVE.intel[k] ? '<span class="chip good">Scouted</span>' : ''}</div><div class="spread" style="font-size:13px"><span class="gold num">${s.reward} gold</span><span class="muted">${wins ? 'Cleared ×' + wins : 'Not yet cleared'}</span></div></button>`; }
  h += `</div></div>`;
  const party = SAVE.party.map(heroById).filter(Boolean);
  h += `<div class="win"><div class="spread" style="margin-bottom:8px"><h2>Party</h2><span class="label">${party.length} / 5</span></div>`;
  h += party.length ? `<div class="partyrow">${party.map(p => `<div class="pslot"><div data-port="${p.uid}" data-size="44"></div><span>${p.name}</span>${SAVE.leader === p.uid ? '<span class="crown">Leader</span>' : `<button class="link" data-act="leader" data-uid="${p.uid}" type="button">Make leader</button>`}</div>`).join('')}</div>` : '<p class="muted">No one is assigned. Add heroes from the Roster tab.</p>';
  h += `<p class="muted small" style="margin-top:8px">${SAVE.leader ? `${heroById(SAVE.leader).name} leads: ${CLASSES[heroById(SAVE.leader).cls].leader.text}.` : ''} <button class="link" data-act="tab" data-k="roster" type="button">Edit party</button></p></div>`;
  const packN = Object.values(SAVE.pack).reduce((a, b) => a + b, 0);
  h += `<div class="win"><div class="spread" style="margin-bottom:8px"><h2>Pack</h2><span class="label">${packN} / 3 slots</span></div><div class="packrow">`;
  for (const k in ITEMS) { const n = SAVE.pack[k] || 0, st = SAVE.items[k] || 0; h += `<div class="packitem"><div><b>${ITEMS[k].name}</b><span class="muted small">${ITEMS[k].text} In stock: ${st}</span></div><div class="stepper"><button class="btn small" data-act="pack" data-k="${k}" data-d="-1" ${n ? '' : 'disabled'} type="button" aria-label="Pack one less">−</button><b class="num">${n}</b><button class="btn small" data-act="pack" data-k="${k}" data-d="1" ${n < st && packN < 3 ? '' : 'disabled'} type="button" aria-label="Pack one more">+</button></div></div>`; }
  h += `</div><p class="muted small" style="margin-top:6px">Craft more at the Forge. Using an item in battle takes the hero's turn.</p></div>`;
  const ok = party.length >= 1 && !RUN && !contractTaken();
  h += `<div class="spread"><span class="muted">${RUN ? 'Finish or abandon the current contract first.' : contractTaken() ? "The guild has taken today's contract. Sleep to start a new day." : !party.length ? 'Assign at least one hero.' : `Permadeath is on. A full wipe loses everyone sent.`}</span><button class="btn primary" data-act="embark" ${ok ? '' : 'disabled'} type="button">Embark</button></div>`;
  return h;
}
function tabRoster() {
  let h = `<div class="win">${buildingCard('yard')}</div>`;
  h += `<div class="win"><div class="spread" style="margin-bottom:10px"><h2>Roster</h2><span class="label">${SAVE.roster.length} / ${rosterCap()} · Party ${SAVE.party.length} / 5</span></div><div class="roster">`;
  for (const hr of SAVE.roster) {
    const st = heroState(hr), inP = SAVE.party.includes(hr.uid), lead = SAVE.leader === hr.uid, tc = trainCost(hr), canSub = hr.lv >= 3 && !hr.sub;
    h += `<div class="card hero ${inP ? 'sel' : ''}"><div class="fig" data-fig="${hr.uid}" data-size="60"></div><div class="info"><h3>${hr.name}${lead ? '<span class="crown">Leader</span>' : ''}</h3>
      <span class="meta">${className(hr)} · ${RACES[hr.race].name} · Lv <b class="num">${hr.lv}</b></span><span class="meta num">${statLine(hr)}</span>
      <div class="xpbar" title="Experience"><i style="width:${Math.min(100, hr.xp / xpNeed(hr.lv) * 100)}%"></i></div>
      <div class="row" style="gap:4px">${quirkChips(hr)}<span class="chip ${st === 'ready' ? '' : 'warn'}">${STATE_LABEL[st]}</span></div>
      <span class="meta small">${hr.gear.weapon ? GEAR.weapon[hr.gear.weapon].name + ' weapon' : 'No weapon'} · ${hr.gear.armor ? GEAR.armor[hr.gear.armor].name + ' armour' : 'No armour'}${hr.gear.trinket ? ' · ' + TRINKETS[hr.gear.trinket].name : ''}</span></div>
      <div class="acts">${st === 'ready' ? `<button type="button" class="btn small ${inP ? 'on' : ''}" data-act="party" data-uid="${hr.uid}">${inP ? 'In party' : 'Add to party'}</button>` : ''}
      <button type="button" class="btn small" data-act="train" data-uid="${hr.uid}" ${SAVE.gold >= tc && hr.lv < yardCap() && st !== 'chapel' ? '' : 'disabled'}>${hr.lv >= yardCap() ? 'Yard max Lv ' + yardCap() : `Train <span class="gold num">${tc}g</span>`}</button>
      ${canSub ? `<button type="button" class="btn small primary" data-act="subFor" data-uid="${hr.uid}">Choose subclass</button>` : ''}
      ${hr.sub && SAVE.build.yard >= 2 ? `<button type="button" class="btn small" data-act="retrain" data-uid="${hr.uid}" ${SAVE.gold >= 100 ? '' : 'disabled'}>Retrain <span class="gold">100g</span></button>` : ''}
      ${GUI.confirm === 'dismiss:' + hr.uid ? `<span class="small">Dismiss ${hr.name} for good?</span><button type="button" class="btn small" data-act="dismiss" data-uid="${hr.uid}">Dismiss</button><button type="button" class="btn small" data-act="cancel">Keep</button>` : (st === 'ready' ? `<button type="button" class="btn small ghost" data-act="askDismiss" data-uid="${hr.uid}">Dismiss</button>` : '')}</div>`;
    if (GUI.subFor === hr.uid && canSub) {
      h += `<div class="subpick">${Object.entries(CLASSES[hr.cls].subs).map(([k, s]) => `<button type="button" class="btn choice" data-act="sub" data-uid="${hr.uid}" data-k="${k}"><span>${s.name} <span class="muted small">${CLASSES[hr.cls].name} + ${s.from}</span></span><small>${s.text} New skill: <b>${s.skill.name}</b>, ${s.skill.desc.charAt(0).toLowerCase() + s.skill.desc.slice(1)}</small></button>`).join('')}</div>`;
    }
    h += `</div>`;
  }
  return h + `</div></div>`;
}
function tabRecruit() {
  let h = `<div class="win">${buildingCard('hall')}</div>`;
  h += `<div class="win"><div class="spread" style="margin-bottom:6px"><h2>Recruit board</h2><span class="label">Roster ${SAVE.roster.length} / ${rosterCap()}</span></div><p class="muted small" style="margin-bottom:10px">New faces arrive every ${BOARD_DAYS} days; the next in ${boardDaysLeft() === 1 ? '1 day' : boardDaysLeft() + ' days'}. ${postHolder('recruiter') ? `${postHolder('recruiter').name} is recruiting: hires ${Math.round(disc.recruit() * 100)}% cheaper.` : 'Post a Recruiter for better terms.'}${desperate() ? ' With no one left, a volunteer will sign on for free.' : ''}</p><div class="roster">`;
  if (!SAVE.board.length) h += `<p class="muted">The board is empty until new faces arrive.</p>`;
  for (const c of SAVE.board) {
    const cost = hireCost(c), full = SAVE.roster.length >= rosterCap();
    h += `<div class="card hero"><div class="fig" data-fig="${c.uid}" data-size="60"></div><div class="info"><h3>${c.name}</h3><span class="meta">${CLASSES[c.cls].name} · ${RACES[c.race].name} (${RACES[c.race].text}) · Lv ${c.lv}</span><span class="meta num">${statLine(c)}</span><div class="row" style="gap:4px">${quirkChips(c)}</div><span class="meta small">${c.quirks.map(q => QUIRKS[q].name + ': ' + QUIRKS[q].text).join(' · ')}</span></div>
      <div class="acts"><button type="button" class="btn small primary" data-act="hire" data-uid="${c.uid}" ${SAVE.gold >= cost && !full ? '' : 'disabled'}>${full ? 'Roster full' : `Hire <span class="num">${cost}g</span>`}</button></div></div>`;
  }
  return h + `</div></div>`;
}
function tabForge() {
  let h = `<div class="win">${buildingCard('forge')}${postHolder('smith') ? `<p class="muted small">${postHolder('smith').name} works the forge: gold costs −25%${postHolder('smith').race === 'dwarf' ? ', one less of each material' : ''}.</p>` : ''}</div>`;
  const heroes = SAVE.roster.filter(x => heroState(x) !== 'chapel'); if (!heroById(GUI.forgeHero) && heroes.length) GUI.forgeHero = heroes[0].uid;
  const hr = heroById(GUI.forgeHero);
  h += `<div class="win"><h2 style="margin-bottom:8px">Gear</h2><div class="herotabs">${heroes.map(x => `<button type="button" class="hchip ${x.uid === GUI.forgeHero ? 'on' : ''}" data-act="forgeHero" data-uid="${x.uid}"><span data-port="${x.uid}" data-size="28"></span>${x.name}</button>`).join('')}</div>`;
  if (hr) {
    h += `<p class="meta" style="margin:8px 0">${hr.name} · ${className(hr)} · ${statLine(hr)}</p><div class="gearrows">`;
    for (const slot of ['weapon', 'armor']) { const cur = hr.gear[slot], nx = GEAR[slot][cur + 1]; const label = slot === 'weapon' ? 'Weapon' : 'Armour';
      h += `<div class="gearrow"><div><span class="label">${label}</span><b>${cur ? GEAR[slot][cur].name : 'None'}</b>${cur ? `<span class="muted small"> ${Object.entries(GEAR[slot][cur].mods).map(([k, v]) => `+${Math.round(v * 100)}% ${k.toUpperCase()}`).join(', ')}</span>` : ''}</div>`;
      if (nx) { const c = forgeCost(nx.cost); const lock = cur + 1 > SAVE.build.forge; h += `<div class="buy"><span class="small">${nx.name}: ${Object.entries(nx.mods).map(([k, v]) => `+${Math.round(v * 100)}% ${k.toUpperCase()}`).join(', ')}</span><div class="costs">${costHTML(c)}</div><button type="button" class="btn small" data-act="craftGear" data-slot="${slot}" ${!lock && canPay(c) ? '' : 'disabled'}>${lock ? `Needs Forge Lv ${cur + 1}` : 'Forge'}</button></div>`; }
      else h += `<span class="chip good">Best available</span>`;
      h += `</div>`; }
    h += `<div class="gearrow"><div><span class="label">Trinket</span><b>${hr.gear.trinket ? TRINKETS[hr.gear.trinket].name : 'None'}</b></div><div class="trinkets">`;
    for (const k in TRINKETS) { const T = TRINKETS[k], c = forgeCost(T.cost); h += `<div class="buy"><span class="small"><b>${T.name}</b>: ${T.text}</span><div class="costs">${costHTML(c)}</div><button type="button" class="btn small" data-act="craftTrinket" data-k="${k}" ${hr.gear.trinket !== k && canPay(c) ? '' : 'disabled'}>${hr.gear.trinket === k ? 'Equipped' : 'Forge'}</button></div>`; }
    h += `</div></div></div>`;
  }
  h += `</div><div class="win"><h2 style="margin-bottom:8px">Consumables</h2><div class="gearrows">`;
  for (const k in ITEMS) { const I = ITEMS[k], c = forgeCost(I.cost); h += `<div class="gearrow"><div><b>${I.name}</b> <span class="muted small">${I.text} In stock: <b class="num">${SAVE.items[k] || 0}</b></span></div><div class="buy"><div class="costs">${costHTML(c)}</div><button type="button" class="btn small" data-act="craftItem" data-k="${k}" ${canPay(c) ? '' : 'disabled'}>Brew</button></div></div>`; }
  return h + `</div></div>`;
}
const MISSIONS = [['gather:crypt', 'Gather · Sunken Crypt (bone dust, grave iron)'], ['gather:thorn', 'Gather · Thornwood (goblin scrap, troll hide)'], ['gather:mire', 'Gather · Mirefen (lizard scale, venom sacs)'], ['hunt:', 'Hunt for bounties (gold)'], ['scout:crypt', 'Scout · Sunken Crypt'], ['scout:thorn', 'Scout · Thornwood'], ['scout:mire', 'Scout · Mirefen']];
function tabDispatch() {
  const slots = 1 + SAVE.build.hall; let h = '';
  if (SAVE.reports.length) h += `<div class="win notice"><div class="spread"><span class="label">Returned</span><button class="btn small" data-act="clearReports" type="button">Dismiss</button></div>${SAVE.reports.map(r => `<p>${r}</p>`).join('')}</div>`;
  h += `<div class="win"><div class="spread" style="margin-bottom:6px"><h2>Dispatch</h2><span class="label">${SAVE.dispatch.length} / ${slots} out</span></div><p class="muted small" style="margin-bottom:10px">Send heroes out for a day. They return tomorrow with their haul and can't take contracts while away. Slots grow with the Recruitment Hall.</p>`;
  if (SAVE.dispatch.length) h += `<div class="gearrows">${SAVE.dispatch.map(d => { const x = heroById(d.uid); return x ? `<div class="gearrow"><div class="row"><span data-port="${x.uid}" data-size="34"></span><div><b>${x.name}</b><span class="muted small"> ${MISSIONS.find(m => m[0] === d.kind + ':' + (d.region || ''))[1]}</span></div></div><span class="chip">Back tomorrow</span></div>` : ''; }).join('')}</div>`;
  const ready = SAVE.roster.filter(x => heroState(x) === 'ready');
  if (SAVE.dispatch.length < slots) {
    h += `<div class="form"><label class="label" for="dMission">Mission</label><select id="dMission" class="sel">${MISSIONS.map(m => `<option value="${m[0]}" ${GUI.dMission === m[0] ? 'selected' : ''}>${m[1]}</option>`).join('')}</select>
      <label class="label" for="dHero">Hero</label><select id="dHero" class="sel">${ready.map(x => `<option value="${x.uid}">${x.name} · ${className(x)} · Lv ${x.lv}${SAVE.party.includes(x.uid) ? ' (leaves party)' : ''}</option>`).join('')}</select>
      <button type="button" class="btn primary" data-act="dispatch" ${ready.length ? '' : 'disabled'}>Send out</button>
      <p class="muted small">Dwarves and Druids gather more. Rangers and Orcs hunt better. Scouting makes your next party there move first and earn more.</p></div>`;
  } else h += `<p class="muted">Every slot is in use.</p>`;
  return h + `</div>`;
}
function tabPosts() {
  let h = `<div class="win"><h2 style="margin-bottom:6px">Guild posts</h2><p class="muted small" style="margin-bottom:10px">A posted hero gives a passive bonus but can't take contracts or dispatches. Posts lock until tomorrow once filled.</p><div class="gearrows">`;
  const ready = SAVE.roster.filter(x => heroState(x) === 'ready');
  for (const k in POSTS) {
    const p = SAVE.posts[k], hr = p && heroById(p.uid); const locked = hr && SAVE.day < p.until;
    h += `<div class="gearrow post"><div><span class="label">${POSTS[k].name}</span><p class="small">${POSTS[k].text}</p></div>`;
    if (hr) h += `<div class="row"><span data-port="${hr.uid}" data-size="34"></span><b>${hr.name}</b>${locked ? '<span class="chip">Locked until tomorrow</span>' : `<button type="button" class="btn small" data-act="release" data-k="${k}">Release</button>`}</div>`;
    else h += `<div class="row"><select class="sel" id="post_${k}">${ready.map(x => `<option value="${x.uid}">${x.name} · ${className(x)}</option>`).join('')}</select><button type="button" class="btn small" data-act="assign" data-k="${k}" ${ready.length ? '' : 'disabled'}>Assign</button></div>`;
    h += `</div>`;
  }
  return h + `</div></div>`;
}
function tabChapel() {
  let h = `<div class="win"><h2 style="margin-bottom:6px">Chapel</h2><p class="muted small" style="margin-bottom:10px">Heroes who fell on a contract their party survived lie here. Resurrection is costly and can fail. ${postHolder('chaplain') ? `${postHolder('chaplain').name} tends the altar: +${Math.round(disc.chap() * 100)}% odds.` : 'Post a Chaplain to improve the odds.'}</p>`;
  if (SAVE.note) h += `<p class="note">${SAVE.note}</p>`;
  if (!SAVE.chapel.length) h += `<p class="muted">No one lies in the chapel.</p>`;
  for (const c of SAVE.chapel) { const hr = heroById(c.uid); if (!hr) continue; const fee = 60 + 40 * hr.lv, ch = Math.min(.95, .65 + disc.chap());
    h += `<div class="gearrow"><div class="row"><span data-port="${hr.uid}" data-size="40"></span><div><b>${hr.name}</b><span class="muted small"> ${className(hr)} · Lv ${hr.lv} · fell in ${c.where}</span></div></div><div class="buy"><span class="small">${Math.round(ch * 100)}% chance</span><button type="button" class="btn small primary" data-act="resurrect" data-uid="${hr.uid}" ${SAVE.gold >= fee ? '' : 'disabled'}>Resurrect <span class="num">${fee}g</span></button><button type="button" class="btn small" data-act="bury" data-uid="${hr.uid}">Lay to rest</button></div></div>`; }
  h += `</div><div class="win wall"><h2 style="margin-bottom:8px">Wall of the Fallen</h2>`;
  h += SAVE.fallen.length ? `<ul class="fallen">${SAVE.fallen.slice().reverse().map(f => `<li><b>${f.name}</b> <span class="muted">${f.cls} · Lv ${f.lv}</span><span class="small muted"> ${f.cause} · ${typeof f.date === 'number' ? 'Day ' + f.date : new Date(f.date + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></li>`).join('')}</ul>` : `<p class="muted">No names yet.</p>`;
  return h + `</div>`;
}
function killHero(uid, cause) {
  const h = heroById(uid); if (!h) return;
  SAVE.fallen.push({ name: h.name, cls: className(h), lv: h.lv, cause, date: SAVE.day });
  SAVE.roster = SAVE.roster.filter(x => x.uid !== uid); SAVE.party = SAVE.party.filter(x => x !== uid); SAVE.chapel = SAVE.chapel.filter(c => c.uid !== uid);
  for (const k in SAVE.posts) if (SAVE.posts[k] && SAVE.posts[k].uid === uid) delete SAVE.posts[k];
  SAVE.dispatch = SAVE.dispatch.filter(d => d.uid !== uid); if (SAVE.leader === uid) SAVE.leader = SAVE.party[0] || null;
}
$('#panel').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act, uid = b.dataset.uid, k = b.dataset.k; const hr = uid && (heroById(uid) || (SAVE.board || []).find(c => c.uid === uid));
  SND.init(); let snd = 'blip';
  switch (a) {
    case 'tab': GUI.tab = k; store.set('bc.tab', k); GUI.confirm = null; break;
    case 'contract': SAVE.contract = k; break;
    case 'leader': SAVE.leader = uid; snd = 'select'; break;
    case 'party': if (SAVE.party.includes(uid)) SAVE.party = SAVE.party.filter(x => x !== uid); else if (SAVE.party.length < 5) { SAVE.party.push(uid); if (!SAVE.leader) SAVE.leader = uid; } else { snd = 'debuff'; } break;
    case 'pack': { const d = +b.dataset.d; SAVE.pack[k] = clamp((SAVE.pack[k] || 0) + d, 0, SAVE.items[k] || 0); break; }
    case 'embark': snd = 'select'; startRun(); return;
    case 'train': { const c = trainCost(hr); if (SAVE.gold < c || hr.lv >= yardCap()) return; SAVE.gold -= c; hr.lv++; hr.xp = 0; snd = 'buff'; break; }
    case 'subFor': GUI.subFor = GUI.subFor === uid ? null : uid; break;
    case 'sub': hr.sub = k; GUI.subFor = null; snd = 'buff'; break;
    case 'retrain': if (SAVE.gold < 100) return; SAVE.gold -= 100; hr.sub = null; GUI.subFor = uid; snd = 'buff'; break;
    case 'askDismiss': GUI.confirm = 'dismiss:' + uid; break;
    case 'cancel': GUI.confirm = null; break;
    case 'dismiss': SAVE.roster = SAVE.roster.filter(x => x.uid !== uid); SAVE.party = SAVE.party.filter(x => x !== uid); GUI.confirm = null; snd = 'debuff'; break;
    case 'upgrade': { const c = UPCOST[SAVE.build[k] + 1]; if (!c || !canPay(c)) return; pay(c); SAVE.build[k]++; snd = 'buff'; if (k === 'hall') { SAVE.boardDay = null; } break; }
    case 'hire': { const c = hireCost(hr); if (SAVE.gold < c || SAVE.roster.length >= rosterCap()) return; SAVE.gold -= c; const n = Object.assign({}, hr); delete n.cost; SAVE.roster.push(n); SAVE.board = SAVE.board.filter(x => x.uid !== uid); snd = 'coin'; break; }
    case 'forgeHero': GUI.forgeHero = uid; break;
    case 'craftGear': { const h2 = heroById(GUI.forgeHero), slot = b.dataset.slot, nx = GEAR[slot][h2.gear[slot] + 1]; const c = forgeCost(nx.cost); if (!canPay(c)) return; pay(c); h2.gear[slot]++; snd = 'buff'; break; }
    case 'craftTrinket': { const h2 = heroById(GUI.forgeHero); const c = forgeCost(TRINKETS[k].cost); if (!canPay(c)) return; pay(c); h2.gear.trinket = k; snd = 'buff'; break; }
    case 'craftItem': { const c = forgeCost(ITEMS[k].cost); if (!canPay(c)) return; pay(c); SAVE.items[k] = (SAVE.items[k] || 0) + 1; snd = 'coin'; break; }
    case 'dispatch': { const m = $('#dMission').value, h2 = heroById($('#dHero').value); if (!h2 || heroState(h2) !== 'ready') return; GUI.dMission = m; const [kind, region] = m.split(':'); SAVE.dispatch.push({ uid: h2.uid, kind, region: region || null, back: SAVE.day + 1 }); SAVE.party = SAVE.party.filter(x => x !== h2.uid); snd = 'select'; break; }
    case 'assign': { const h2 = heroById($('#post_' + k).value); if (!h2 || heroState(h2) !== 'ready') return; SAVE.posts[k] = { uid: h2.uid, until: SAVE.day + 1 }; SAVE.party = SAVE.party.filter(x => x !== h2.uid); snd = 'select'; break; }
    case 'release': { const p = SAVE.posts[k]; if (p && SAVE.day >= p.until) delete SAVE.posts[k]; break; }
    case 'clearReports': SAVE.reports = []; break;
    case 'resurrect': { const fee = 60 + 40 * hr.lv, ch = Math.min(.95, .65 + disc.chap()); if (SAVE.gold < fee) return; SAVE.gold -= fee;
      if (Math.random() < ch) { SAVE.chapel = SAVE.chapel.filter(c => c.uid !== uid); SAVE.note = `${hr.name} draws breath again.`; snd = 'heal'; }
      else { const c = SAVE.chapel.find(c2 => c2.uid === uid); killHero(uid, 'Resurrection failed after falling in ' + (c ? c.where : 'battle')); SAVE.note = `The rite failed. ${hr.name} is gone.`; snd = 'lose'; } break; }
    case 'bury': { const c = SAVE.chapel.find(c2 => c2.uid === uid); killHero(uid, 'Fell in ' + (c ? c.where : 'battle')); SAVE.note = `${hr.name} was laid to rest.`; snd = 'death'; break; }
  }
  SND.fx(snd); renderGuild();
});
$('#panel').addEventListener('change', e => { if (e.target.id === 'dMission') GUI.dMission = e.target.value; });
$('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-act="tab"]'); if (!b) return; SND.init(); GUI.tab = b.dataset.k; store.set('bc.tab', GUI.tab); GUI.confirm = null; SAVE.note = ''; SND.fx('blip'); renderGuild(); });
$('#sleepRow').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; SND.init();
  if (b.dataset.act === 'askSleep') { GUI.confirm = 'sleep'; SND.fx('blip'); renderGuild(); }
  else if (b.dataset.act === 'cancel') { GUI.confirm = null; SND.fx('blip'); renderGuild(); }
  else sleep();
});
$('#musicBtn').onclick = () => { SND.init(); SND.setMusic(!SND.musicOn); renderGuild(); };
$('#sfxBtn').onclick = () => { SND.init(); SND.setSfx(!SND.sfxOn); SND.fx('blip'); renderGuild(); };
$('#resumeBtn').onclick = () => { SND.fx('select'); renderMap(); show('map'); };

/* ================= RUN & MAP ================= */
function genMap() {
  const layers = [1, 2 + (rnd() < .5 ? 1 : 0), 3, 2 + (rnd() < .5 ? 1 : 0), 1, 1];
  const nodes = layers.map((n, L) => Array.from({ length: n }, (_, i) => ({ L, i, type: 'battle', next: [] })));
  for (let L = 1; L <= 3; L++) for (const nd of nodes[L]) { const r = rnd(); nd.type = L === 1 ? (r < .65 ? 'battle' : 'treasure') : (r < .45 ? 'battle' : r < .65 ? 'elite' : r < .85 ? 'treasure' : 'rest'); }
  for (let L = 2; L <= 3; L++) if (!nodes[L].some(n => n.type === 'battle' || n.type === 'elite')) nodes[L][0].type = 'battle';
  nodes[4][0].type = 'rest'; nodes[5][0].type = 'boss';
  for (let L = 0; L < nodes.length - 1; L++) {
    const A = nodes[L], Bn = nodes[L + 1];
    A.forEach((nd, i) => { const pos = A.length === 1 ? .5 : i / (A.length - 1); const j = Math.round(pos * (Bn.length - 1)); nd.next.push(j); if (rnd() < .5 && Bn.length > 1) { const k = clamp(j + (rnd() < .5 ? -1 : 1), 0, Bn.length - 1); if (!nd.next.includes(k)) nd.next.push(k); } });
    Bn.forEach((_, j) => { if (!A.some(nd => nd.next.includes(j))) { let best = 0, bd = 9; A.forEach((nd, i) => { const pos = A.length === 1 ? .5 : i / (A.length - 1); const d = Math.abs(pos * (Bn.length - 1) - j); if (d < bd) { bd = d; best = i; } }); A[best].next.push(j); } });
  }
  return nodes;
}
function startRun() {
  const party = SAVE.party.filter(uid => heroById(uid) && heroState(heroById(uid)) === 'ready'); if (!party.length || contractTaken()) return;
  const pack = {}; for (const k in ITEMS) { const n = Math.min(SAVE.pack[k] || 0, SAVE.items[k] || 0); pack[k] = n; SAVE.items[k] -= n; SAVE.pack[k] = 0; }
  const intel = !!SAVE.intel[SAVE.contract]; SAVE.intel[SAVE.contract] = false;
  SAVE.contractDay = SAVE.day;
  RUN = { contract: SAVE.contract, map: genMap(), pos: null, visited: [], gold: 0, relics: [], drill: 0, hp: {}, party, leader: party.includes(SAVE.leader) ? SAVE.leader : party[0], pack, mats: {}, intel, xp: 0 };
  party.forEach(id => RUN.hp[id] = 1); save(); saveRun(); renderMap(); show('map');
}
function runHeroMax(id) { const h = heroById(id); const st = heroStats(h); const lh = heroById(RUN.leader); const lead = lh && RUN.hp[RUN.leader] > 0 ? CLASSES[lh.cls].leader : {}; return Math.round(st.hp * (1 + (lead.hp || 0))); }
function reachable() { if (!RUN.pos) return RUN.map[0].map((_, i) => [0, i]); const nd = RUN.map[RUN.pos[0]][RUN.pos[1]]; return nd.next.map(j => [RUN.pos[0] + 1, j]); }
function renderMap() {
  const S = SETTINGS[RUN.contract]; SND.play(S.music); RUN.party.forEach(uid => { const h = heroById(uid); if (h) ensureSprite(h); });
  $('#mTier').textContent = S.tier; $('#mName').textContent = S.name; $('#mHint').textContent = S.hint + (RUN.intel ? ' Your scouts mapped the way: you move first, and earn 10% more gold.' : ''); $('#mGold').textContent = RUN.gold;
  const wrap = $('#mapwrap'); wrap.innerHTML = ''; wrap.style.backgroundImage = `url(${thumb(RUN.contract)})`;
  const W = wrap.clientWidth || 360, H = wrap.clientHeight || 420, L = RUN.map.length;
  const posOf = (l, i) => { const n = RUN.map[l].length; return [W * (i + 1) / (n + 1), H - 36 - l * (H - 72) / (L - 1)]; };
  const NS = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('preserveAspectRatio', 'none');
  const open = reachable().map(p => p.join(',')); const vis = new Set(RUN.visited.map(p => p.join(',')));
  RUN.map.forEach((layer, l) => layer.forEach((nd, i) => nd.next.forEach(j => {
    const [x1, y1] = posOf(l, i), [x2, y2] = posOf(l + 1, j); const ln = document.createElementNS(NS, 'path');
    ln.setAttribute('d', `M${x1} ${y1} Q${(x1 + x2) / 2 + (j - i) * 6} ${(y1 + y2) / 2} ${x2} ${y2}`); ln.setAttribute('fill', 'none');
    const walked = vis.has(l + ',' + i) && vis.has((l + 1) + ',' + j); const avail = RUN.pos && RUN.pos[0] === l && RUN.pos[1] === i;
    ln.setAttribute('stroke', walked ? '#c9963e' : avail ? '#e6d9bc' : '#5a4632'); ln.setAttribute('stroke-width', walked || avail ? 3 : 2); ln.setAttribute('stroke-dasharray', walked ? '' : '2 6'); ln.setAttribute('stroke-linecap', 'round'); svg.appendChild(ln);
  })));
  wrap.appendChild(svg);
  const label = { battle: 'Fight', elite: 'Elite fight', treasure: 'Cache', rest: 'Camp', boss: 'Boss' };
  RUN.map.forEach((layer, l) => layer.forEach((nd, i) => {
    const [x, y] = posOf(l, i); const b = document.createElement('button'); b.type = 'button'; b.className = 'node';
    const key = l + ',' + i; const isOpen = open.includes(key); const here = RUN.pos && RUN.pos[0] === l && RUN.pos[1] === i;
    if (vis.has(key)) b.classList.add('done'); if (here) b.classList.add('here'); if (isOpen) b.classList.add('open'); else if (!vis.has(key)) b.classList.add('lock'); if (nd.type === 'boss') b.classList.add('boss');
    b.style.left = x + 'px'; b.style.top = y + 'px'; b.title = label[nd.type]; b.setAttribute('aria-label', label[nd.type] + (isOpen ? ', available' : ''));
    b.appendChild(iconCanvas(nd.type, nd.type === 'boss' ? 36 : 28)); b.disabled = !isOpen; b.onclick = () => enterNode(l, i); wrap.appendChild(b);
  }));
  const lg = $('#legend'); lg.innerHTML = ''; for (const k of ['battle', 'elite', 'treasure', 'rest', 'boss']) { const s = document.createElement('span'); s.appendChild(iconCanvas(k, 18)); s.append(label[k]); lg.appendChild(s); }
  renderPartyMini($('#mParty'));
  const packTxt = Object.keys(RUN.pack).filter(k => RUN.pack[k]).map(k => `<span class="chip">${ITEMS[k].name} ×${RUN.pack[k]}</span>`).join('');
  const matTxt = Object.keys(RUN.mats).filter(k => RUN.mats[k]).map(k => `<span class="chip"><i class="dot" style="background:${MATCOL[k]}"></i>${MATS[k]} ×${RUN.mats[k]}</span>`).join('');
  $('#mRelics').innerHTML = RUN.relics.map(k => `<span class="chip good" title="${RELICS[k].text}">${RELICS[k].name}</span>`).join('') + (RUN.drill ? `<span class="chip good">Drilled +${RUN.drill * 10}% ATK</span>` : '') + packTxt + matTxt;
  const ar = $('#abandonRow'); ar.innerHTML = '<button class="btn small" id="abandonBtn" type="button">Abandon contract</button>';
  $('#abandonBtn').onclick = () => {
    ar.innerHTML = '<span>Abandon this contract? Survivors return with half the purse; the fallen go to the chapel.</span>';
    const y = document.createElement('button'); y.className = 'btn small'; y.type = 'button'; y.textContent = 'Abandon';
    const n = document.createElement('button'); n.className = 'btn small'; n.type = 'button'; n.textContent = 'Keep going';
    y.onclick = () => finishRun(false, true); n.onclick = () => renderMap(); ar.append(y, n);
  };
}
function renderPartyMini(el) {
  el.innerHTML = '';
  RUN.party.forEach(id => { const h = heroById(id); if (!h) return; const f = RUN.hp[id]; const d = document.createElement('div'); d.className = 'mini' + (f <= 0 ? ' fallen' : '');
    d.appendChild(portrait(id, 38)); const max = runHeroMax(id);
    d.insertAdjacentHTML('beforeend', `<div style="min-width:0;display:grid;gap:3px"><span>${h.name}${RUN.leader === id ? ' <span class="crown">Leader</span>' : ''} <span class="muted num">${f > 0 ? Math.round(f * max) + '/' + max : 'Fallen'}</span></span><div class="hpbar"><i class="${f < .35 ? 'low' : ''}" style="width:${f * 100}%"></i></div></div>`);
    el.appendChild(d); });
}
async function enterNode(l, i) {
  const nd = RUN.map[l][i]; SND.fx('select');
  RUN.pos = [l, i]; RUN.visited.push([l, i]); saveRun();
  if (nd.type === 'battle' || nd.type === 'elite' || nd.type === 'boss') {
    const S = SETTINGS[RUN.contract];
    const comp = nd.type === 'boss' ? S.boss : nd.type === 'elite' ? pick(S.elite) : pick(S.battles);
    const res = await runBattle(comp, l, nd.type);
    if (res === 'lose') return finishRun(false);
    RUN.gold += nd.type === 'boss' ? 110 : nd.type === 'elite' ? 45 : 18 + l * 4;
    RUN.xp = (RUN.xp || 0) + (nd.type === 'boss' ? 100 : nd.type === 'elite' ? 55 : 30);
    const mats = REGION_MATS[RUN.contract]; const n = nd.type === 'boss' ? 5 : nd.type === 'elite' ? 3 : 1 + (rnd() < .5 ? 1 : 0);
    for (let j = 0; j < n; j++) { const m = pick(mats); RUN.mats[m] = (RUN.mats[m] || 0) + 1; }
    saveRun();
    if (nd.type === 'boss') return finishRun(true);
    renderMap(); show('map');
  } else if (nd.type === 'treasure') showTreasure(); else if (nd.type === 'rest') showRest();
}
function showTreasure() {
  const g = 25 + Math.floor(rnd() * 16); RUN.gold += g; const m = pick(REGION_MATS[RUN.contract]); RUN.mats[m] = (RUN.mats[m] || 0) + 2; saveRun(); SND.fx('coin');
  const pool = shuffle(Object.keys(RELICS).filter(k => !RUN.relics.includes(k))).slice(0, 2);
  const p = $('#eventPanel');
  p.innerHTML = `<span class="label">Cache</span><h2>A forgotten strongbox</h2><p>Inside: <b class="gold num">${g} gold</b>, 2 ${MATS[m].toLowerCase()} and two imperial curios. Your party can carry one.</p><div class="choices"></div>`;
  const ch = p.querySelector('.choices');
  pool.forEach(k => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn choice cursor'; b.innerHTML = `${RELICS[k].name}<small>${RELICS[k].text}</small>`; b.onclick = () => { RUN.relics.push(k); saveRun(); SND.fx('buff'); renderMap(); show('map'); }; ch.appendChild(b); });
  if (!pool.length) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn choice'; b.textContent = 'Move on'; b.onclick = () => { renderMap(); show('map'); }; ch.appendChild(b); }
  show('event');
}
function showRest() {
  const p = $('#eventPanel');
  p.innerHTML = `<span class="label">Camp</span><h2>A sheltered fire</h2><p>The party can rest or sharpen up before pressing on. The fallen stay fallen until the chapel.</p><div class="choices"></div>`;
  const ch = p.querySelector('.choices');
  const a = document.createElement('button'); a.type = 'button'; a.className = 'btn choice cursor'; a.innerHTML = 'Tend wounds<small>Every living hero heals 40%.</small>';
  a.onclick = () => { RUN.party.forEach(id => { if (RUN.hp[id] > 0) RUN.hp[id] = Math.min(1, RUN.hp[id] + .4); }); saveRun(); SND.fx('heal'); renderMap(); show('map'); };
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn choice cursor'; b.innerHTML = 'Drill<small>Party ATK +10% for the rest of this contract.</small>';
  b.onclick = () => { RUN.drill++; saveRun(); SND.fx('buff'); renderMap(); show('map'); };
  ch.append(a, b); show('event');
}
function finishRun(won, abandoned) {
  const S = SETTINGS[RUN.contract]; const wipe = !won && !abandoned;
  let gold = wipe ? 0 : won ? RUN.gold + S.reward : Math.floor(RUN.gold / 2);
  if (gold > 0) gold = Math.round(gold * (1 + disc.qm() + (RUN.intel ? .1 : 0)));
  SAVE.gold += gold; if (won) { SAVE.done++; SAVE.wins[RUN.contract] = (SAVE.wins[RUN.contract] || 0) + 1; }
  const lines = [], dead = [], chapel = [];
  if (!wipe) { for (const k in RUN.mats) SAVE.mats[k] = (SAVE.mats[k] || 0) + RUN.mats[k]; for (const k in RUN.pack) SAVE.items[k] = (SAVE.items[k] || 0) + RUN.pack[k]; }
  const where = S.name;
  for (const uid of RUN.party) {
    const h = heroById(uid); if (!h) continue;
    if (wipe) { dead.push(h.name); killHero(uid, 'Lost with the whole party in ' + where); continue; }
    if (RUN.hp[uid] <= 0) { chapel.push(h.name); SAVE.chapel.push({ uid, where }); continue; }
    const xp = Math.round((RUN.xp || 0) * (1 + heroMods(h).xp + (postHolder('drill') ? .15 : 0)));
    h.xp += xp; while (h.xp >= xpNeed(h.lv)) { h.xp -= xpNeed(h.lv); h.lv++; lines.push(`${h.name} reached Lv ${h.lv}${h.lv === 3 && !h.sub ? ' and can choose a subclass' : ''}`); }
  }
  save(); const party = RUN.party.slice(); const matsWon = wipe ? {} : RUN.mats; const xpEach = RUN.xp || 0; RUN = null; saveRun();
  SND.fx(won ? 'win' : 'lose');
  const p = $('#resultPanel');
  p.innerHTML = `<span class="label">${won ? 'Contract complete' : abandoned ? 'Contract abandoned' : 'Party wiped out'}</span>
    <h2>${won ? S.name + ' cleared' : abandoned ? 'The party turns back' : 'None returned'}</h2>
    <p>${won ? 'The charter holds a little longer. Word of your guild spreads.' : abandoned ? 'Survivors limp home.' : 'The whole party was lost. Their names go on the wall.'}</p>
    <div class="stats"><div class="stat"><span class="label">Gold banked</span><b class="num gold">+${gold}</b></div>${wipe ? '' : `<div class="stat"><span class="label">XP each</span><b class="num">+${xpEach}</b></div>`}</div>
    ${Object.keys(matsWon).length ? `<div class="row" style="gap:6px">${Object.keys(matsWon).map(k => `<span class="chip"><i class="dot" style="background:${MATCOL[k]}"></i>${MATS[k]} ×${matsWon[k]}</span>`).join('')}</div>` : ''}
    ${lines.length ? `<p class="gold">${lines.join(' · ')}</p>` : ''}
    ${chapel.length ? `<p class="warntext">${chapel.join(', ')} ${chapel.length > 1 ? 'were' : 'was'} carried to the chapel. Resurrect or lay them to rest from the guild hall.</p>` : ''}
    ${dead.length ? `<p class="warntext">Lost: ${dead.join(', ')}.</p>` : ''}
    <div class="partyhp" id="rParty" style="width:100%"></div>
    <button class="btn primary" type="button" id="homeBtn">Back to the guild hall</button>`;
  const rp = $('#rParty'); party.forEach(id => { const h = heroById(id); if (!h || chapel.includes(h.name)) return; const d = document.createElement('div'); d.className = 'mini'; d.appendChild(portrait(id, 38)); d.insertAdjacentHTML('beforeend', `<div style="display:grid;gap:3px"><span>${h.name} <span class="muted num">Lv ${h.lv}</span></span><div class="xpbar"><i style="width:${Math.min(100, h.xp / xpNeed(h.lv) * 100)}%"></i></div></div>`); rp.appendChild(d); });
  $('#homeBtn').onclick = () => { SND.fx('select'); GUI.tab = chapel.length ? 'chapel' : 'hall'; renderGuild(); show('guild'); };
  show('result');
}
