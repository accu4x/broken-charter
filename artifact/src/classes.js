/* ================= CLASSES, RACES, ECONOMY ================= */
const CLASSES = {
  warrior: { name: 'Warrior', hp: 165, atk: 22, def: 18, spd: 100, crit: .15, look: 'brenna', leader: { text: 'Party DEF +15%', def: .15 },
    skills: [
      { name: 'Cleave', t: 'enemy', dmg: 1.0, el: 'phys', style: 'melee', desc: 'Strike one enemy.' },
      { name: 'Shield Wall', t: 'allAllies', cd: 3, style: 'aura', fx: 'buff', ally: [['defUp', 2]], self: [['taunt', 2]], desc: 'Party DEF up for 2 turns. Taunts enemies.' },
      { name: 'Sunder', t: 'enemy', cd: 3, dmg: 1.7, el: 'phys', style: 'melee', st: [['defBreak', 2, 1]], desc: 'Heavy blow that breaks the target’s DEF for 2 turns.' }],
    subs: {
      paladin: { name: 'Paladin', from: 'Priest', text: '+10% HP. Holy Strike heals on hit.', mods: { hp: .1 }, skill: { name: 'Holy Strike', t: 'enemy', cd: 3, dmg: 1.5, el: 'holy', style: 'melee', fx: 'holy', selfHeal: .12, desc: 'Holy blow that heals the Paladin 12%.' } },
      barbarian: { name: 'Barbarian', from: 'Thief', text: '+10% ATK, −5% DEF. Reckless Swing bleeds.', mods: { atk: .1, def: -.05 }, skill: { name: 'Reckless Swing', t: 'enemy', cd: 3, dmg: 2.1, el: 'phys', style: 'melee', st: [['bleed', 2, .5]], desc: 'Savage blow that often causes bleeding.' } },
      spellblade: { name: 'Spellblade', from: 'Mage', text: '+5% ATK and SPD. Runeblade burns.', mods: { atk: .05, spd: .05 }, skill: { name: 'Runeblade', t: 'enemy', cd: 3, dmg: 1.6, el: 'arcane', style: 'melee', fx: 'arcane', st: [['burn', 2, .4]], desc: 'Arcane-edged strike that may set the target burning.' } } } },
  thief: { name: 'Thief', hp: 120, atk: 24, def: 11, spd: 118, crit: .25, scout: true, look: 'sela', leader: { text: 'Party SPD +12%', spd: .12 },
    skills: [
      { name: 'Twin Fangs', t: 'enemy', dmg: .62, hits: 2, el: 'phys', style: 'melee', st: [['bleed', 2, .35]], desc: 'Two quick stabs. Each may cause bleeding.' },
      { name: 'Smoke Bomb', t: 'allEnemies', cd: 3, dmg: .4, el: 'phys', style: 'spell', fx: 'smoke', bar: -35, desc: 'Hits all enemies and pushes back their turns.' },
      { name: 'Backstab', t: 'enemy', cd: 3, dmg: 2.0, el: 'phys', style: 'melee', exec: 1.5, desc: 'Huge strike. 50% more damage on a target below half health.' }],
    subs: {
      duelist: { name: 'Duelist', from: 'Warrior', text: '+10% DEF. Riposte raises guard.', mods: { def: .1 }, skill: { name: 'Riposte', t: 'enemy', cd: 3, dmg: 1.4, el: 'phys', style: 'melee', self: [['defUp', 2]], desc: 'Strike, then raise your guard for 2 turns.' } },
      inquisitor: { name: 'Inquisitor', from: 'Priest', text: '+5% HP. Judgement may stun.', mods: { hp: .05 }, skill: { name: 'Judgement', t: 'enemy', cd: 3, dmg: 1.5, el: 'holy', style: 'shot', fx: 'holy', st: [['stun', 1, .3]], desc: 'Holy verdict. May stun.' } },
      trickster: { name: 'Trickster', from: 'Mage', text: '+6% SPD. Hex Knife breaks DEF and poisons.', mods: { spd: .06 }, skill: { name: 'Hex Knife', t: 'enemy', cd: 3, dmg: 1.2, el: 'arcane', style: 'shot', fx: 'arcane', st: [['defBreak', 2, 1], ['poison', 2, .5]], desc: 'Cursed blade: breaks DEF, may poison.' } } } },
  mage: { name: 'Mage', hp: 110, atk: 27, def: 9, spd: 104, crit: .15, look: 'orrin', leader: { text: 'Party ATK +15%', atk: .15 },
    skills: [
      { name: 'Firebolt', t: 'enemy', dmg: 1.1, el: 'fire', style: 'shot', fx: 'fire', st: [['burn', 2, .35]], desc: 'Fire damage. May set the target burning.' },
      { name: 'Flame Wave', t: 'allEnemies', cd: 3, dmg: .75, el: 'fire', style: 'spell', fx: 'fire', st: [['burn', 2, .5]], desc: 'Fire on all enemies. Burning stops troll regeneration.' },
      { name: 'Arcane Lance', t: 'enemy', cd: 4, dmg: 2.5, el: 'arcane', style: 'shot', fx: 'arcane', desc: 'A piercing bolt of raw arcana.' }],
    subs: {
      battlemage: { name: 'Battlemage', from: 'Warrior', text: '+12% HP, +10% DEF. Spellstrike in melee.', mods: { hp: .12, def: .1 }, skill: { name: 'Spellstrike', t: 'enemy', cd: 3, dmg: 2.0, el: 'arcane', style: 'melee', fx: 'arcane', desc: 'Close-range blast of arcana.' } },
      illusionist: { name: 'Illusionist', from: 'Thief', text: '+8% SPD. Mirror Veil stalls enemies.', mods: { spd: .08 }, skill: { name: 'Mirror Veil', t: 'allEnemies', cd: 4, dmg: .5, el: 'arcane', style: 'spell', fx: 'arcane', bar: -40, st: [['stun', 1, .15]], desc: 'Illusions push back every enemy’s turn. May stun.' } },
      theurge: { name: 'Theurge', from: 'Priest', text: '+6% HP. Sacred Flame burns the unholy.', mods: { hp: .06 }, skill: { name: 'Sacred Flame', t: 'allEnemies', cd: 4, dmg: .8, el: 'holy', style: 'spell', fx: 'holy', st: [['burn', 2, .4]], desc: 'Holy fire on all enemies.' } } } },
  priest: { name: 'Priest', hp: 150, atk: 17, def: 15, spd: 98, crit: .1, look: 'hilde', leader: { text: 'Party HP +15%', hp: .15 },
    skills: [
      { name: 'Smite', t: 'enemy', dmg: .9, el: 'holy', style: 'shot', fx: 'holy', desc: 'Holy damage. Undead take extra.' },
      { name: 'Mending Light', t: 'allAllies', cd: 2, heal: .2, cleanse: true, style: 'aura', fx: 'heal', desc: 'Heal the party 20% and cleanse poison, burns and bleeds.' },
      { name: 'Benediction', t: 'allAllies', cd: 4, heal: .1, ally: [['atkUp', 2]], style: 'aura', fx: 'buff', desc: 'Party ATK up for 2 turns, plus a small heal.' }],
    subs: {
      templar: { name: 'Templar', from: 'Warrior', text: '+12% DEF. Crusade draws enemy fire.', mods: { def: .12 }, skill: { name: 'Crusade', t: 'enemy', cd: 3, dmg: 1.4, el: 'holy', style: 'melee', fx: 'holy', self: [['taunt', 2]], desc: 'Holy strike, then taunt enemies.' } },
      confessor: { name: 'Confessor', from: 'Thief', text: '+10% ATK. Penance bleeds and breaks.', mods: { atk: .1 }, skill: { name: 'Penance', t: 'enemy', cd: 3, dmg: 1.3, el: 'holy', style: 'shot', fx: 'holy', st: [['bleed', 2, .6], ['defBreak', 2, .5]], desc: 'A painful absolution. Bleeds; may break DEF.' } },
      oracle: { name: 'Oracle', from: 'Mage', text: '+6% SPD. Omen weakens every foe.', mods: { spd: .06 }, skill: { name: 'Omen', t: 'allEnemies', cd: 4, dmg: .5, el: 'arcane', style: 'spell', fx: 'arcane', st: [['defBreak', 2, .8]], desc: 'Foretold doom: likely breaks every enemy’s DEF.' } } } },
  ranger: { name: 'Ranger', hp: 140, atk: 23, def: 13, spd: 108, crit: .2, scout: true, look: 'grask', leader: { text: 'Party crit chance +12%', crit: .12 },
    skills: [
      { name: 'Aimed Shot', t: 'enemy', dmg: 1.0, el: 'phys', style: 'shot', fx: 'arrow', desc: 'A careful arrow at one enemy.' },
      { name: 'Volley', t: 'allEnemies', cd: 3, dmg: .6, el: 'phys', style: 'spell', fx: 'arrows', st: [['bleed', 2, .3]], desc: 'Arrows rain on all enemies and may cause bleeding.' },
      { name: 'Hunter’s Mark', t: 'enemy', cd: 3, dmg: 1.5, el: 'phys', style: 'shot', fx: 'arrow', st: [['defBreak', 2, 1]], desc: 'Strong shot that breaks the target’s DEF.' }],
    subs: {
      sharpshooter: { name: 'Sharpshooter', from: 'Thief', text: '+10% crit. Headshot hits hardest.', mods: { crit: .1 }, skill: { name: 'Headshot', t: 'enemy', cd: 4, dmg: 2.6, el: 'phys', style: 'shot', fx: 'arrow', desc: 'One devastating arrow.' } },
      warden: { name: 'Warden', from: 'Druid', text: '+8% DEF. Thorn Snare stalls the field.', mods: { def: .08 }, skill: { name: 'Thorn Snare', t: 'allEnemies', cd: 3, dmg: .5, el: 'nature', style: 'spell', fx: 'nature', st: [['bleed', 2, .4]], bar: -25, desc: 'Snares every enemy: bleeds and slows their turns.' } },
      beastmaster: { name: 'Beastmaster', from: 'Warrior', text: '+8% HP. Set the Hound bites twice.', mods: { hp: .08 }, skill: { name: 'Set the Hound', t: 'enemy', cd: 3, dmg: .85, hits: 2, el: 'phys', style: 'melee', st: [['bleed', 2, .5]], desc: 'Two savage bites that may bleed.' } } } },
  druid: { name: 'Druid', hp: 130, atk: 20, def: 12, spd: 106, crit: .12, look: 'wren', leader: { text: 'Party heals 3% HP each turn', regen: .03 },
    skills: [
      { name: 'Thornlash', t: 'enemy', dmg: 1.0, el: 'nature', style: 'shot', fx: 'nature', st: [['poison', 2, .4]], desc: 'Thorns that may poison. Undead are immune to poison.' },
      { name: 'Regrowth', t: 'allAllies', cd: 3, ally: [['regen', 3]], style: 'aura', fx: 'heal', desc: 'The party regenerates 8% HP per turn for 3 turns.' },
      { name: 'Entangle', t: 'allEnemies', cd: 4, dmg: .7, el: 'nature', style: 'spell', fx: 'nature', st: [['stun', 1, .25]], desc: 'Roots grip every enemy. May stun.' }],
    subs: {
      thornweaver: { name: 'Thornweaver', from: 'Mage', text: '+8% ATK. Bramble Storm poisons all.', mods: { atk: .08 }, skill: { name: 'Bramble Storm', t: 'allEnemies', cd: 3, dmg: .9, el: 'nature', style: 'spell', fx: 'nature', st: [['poison', 2, .5]], desc: 'Thorns lash every enemy and may poison.' } },
      wildheart: { name: 'Wildheart', from: 'Warrior', text: '+15% HP, +10% DEF. Bear Form tanks.', mods: { hp: .15, def: .1 }, skill: { name: 'Bear Form', t: 'self', cd: 4, heal: .15, self: [['defUp', 2], ['atkUp', 2], ['taunt', 2]], style: 'aura', fx: 'buff', desc: 'Heal 15%, gain ATK and DEF, and taunt.' } },
      moonseer: { name: 'Moonseer', from: 'Priest', text: 'Moonwell: a big party heal.', mods: {}, skill: { name: 'Moonwell', t: 'allAllies', cd: 3, heal: .25, cleanse: true, style: 'aura', fx: 'heal', desc: 'Heal the party 25% and cleanse debuffs.' } } } }
};
const RACES = {
  human: { name: 'Human', text: '+10% XP', mods: { xp: .1 }, skins: ['#d9a988', '#c99878', '#a87858', '#e0b898'] },
  elf: { name: 'Elf', text: '+4 SPD', mods: { spdFlat: 4 }, skins: ['#e0c4a4', '#d4b896', '#c8ac8a'] },
  dwarf: { name: 'Dwarf', text: '+8% HP, −4 SPD', mods: { hp: .08, spdFlat: -4 }, skins: ['#d29a76', '#c08868', '#b07a5a'] },
  orc: { name: 'Orc', text: '+6% ATK', mods: { atk: .06 }, skins: ['#6f8458', '#7a8a5a', '#5e7a54'] }
};
const QUIRKS = {
  steady: { name: 'Steady Hand', good: 1, text: '+8% crit chance', mods: { crit: .08 } },
  thick: { name: 'Thick Skull', good: 1, text: '+10% DEF', mods: { def: .1 } },
  fleet: { name: 'Fleet-footed', good: 1, text: '+6 SPD', mods: { spdFlat: 6 } },
  brawler: { name: 'Brawler', good: 1, text: '+8% ATK', mods: { atk: .08 } },
  hardy: { name: 'Hardy', good: 1, text: '+10% HP', mods: { hp: .1 } },
  quick: { name: 'Quick Study', good: 1, text: '+20% XP', mods: { xp: .2 } },
  gravebane: { name: 'Gravebane', good: 1, text: '+15% damage to undead', mods: { vsUndead: .15 } },
  goblinbane: { name: 'Goblin-hater', good: 1, text: '+15% damage to goblins', mods: { vsGoblin: .15 } },
  marsh: { name: 'Marsh-born', good: 1, text: 'Immune to poison', mods: { poisonImmune: 1 } },
  devout: { name: 'Devout', good: 1, text: '+20% holy damage', mods: { holy: .2 } },
  reckless: { name: 'Reckless', good: 0, text: '+10% ATK, −10% DEF', mods: { atk: .1, def: -.1 } },
  brittle: { name: 'Brittle', good: 0, text: '−10% HP', mods: { hp: -.1 } },
  slow: { name: 'Slow Learner', good: 0, text: '−20% XP', mods: { xp: -.2 } },
  darkfear: { name: 'Fears the Dark', good: 0, text: '−10 SPD in the Crypt', mods: { cryptSpd: -10 } },
  greedy: { name: 'Greedy', good: 0, text: 'Hires and training cost 15% more', mods: { greedy: .15 } }
};
const NAMES = {
  human: ['Aldric', 'Bertil', 'Corwin', 'Edda', 'Gisla', 'Hale', 'Isolde', 'Joran', 'Maud', 'Osric', 'Rowena', 'Tamsin', 'Wulf', 'Cedric', 'Agnes', 'Ivo'],
  elf: ['Aerin', 'Caelith', 'Ilyra', 'Lethis', 'Saeryn', 'Thalen', 'Vael', 'Ysolde', 'Nimue', 'Faelan'],
  dwarf: ['Bram', 'Dagna', 'Hrolf', 'Ketta', 'Muir', 'Orla', 'Thane', 'Ulfa', 'Grenda', 'Borin'],
  orc: ['Brakka', 'Durz', 'Grima', 'Mog', 'Ruka', 'Skarn', 'Thok', 'Vasha', 'Ugra', 'Korr']
};
const MATS = { bone: 'Bone dust', iron: 'Grave iron', scrap: 'Goblin scrap', hide: 'Troll hide', scale: 'Lizard scale', venom: 'Venom sac' };
const MATCOL = { bone: '#d8cfb4', iron: '#8a8e9a', scrap: '#a37a36', hide: '#7a8a5a', scale: '#3e9a86', venom: '#b47ce0' };
const REGION_MATS = { crypt: ['bone', 'iron'], thorn: ['scrap', 'hide'], mire: ['scale', 'venom'] };
const GEAR = {
  weapon: [null,
    { name: 'Iron', mods: { atk: .08 }, cost: { g: 40, iron: 2, scrap: 1 } },
    { name: 'Tempered', mods: { atk: .16 }, cost: { g: 90, iron: 3, hide: 2, scale: 1 } },
    { name: 'Grave-forged', mods: { atk: .26 }, cost: { g: 160, iron: 5, venom: 2, bone: 2 } }],
  armor: [null,
    { name: 'Padded', mods: { def: .1, hp: .05 }, cost: { g: 40, hide: 2, bone: 1 } },
    { name: 'Scaled', mods: { def: .18, hp: .1 }, cost: { g: 90, hide: 3, scale: 2, iron: 1 } },
    { name: 'Warden’s', mods: { def: .28, hp: .15 }, cost: { g: 160, scale: 4, iron: 3, hide: 2 } }]
};
const TRINKETS = {
  bonecharm: { name: 'Bone Charm', text: '+20% damage to undead', mods: { vsUndead: .2 }, cost: { g: 30, bone: 3 } },
  hidebelt: { name: 'Troll-hide Belt', text: '+12% HP', mods: { hp: .12 }, cost: { g: 30, hide: 3 } },
  scaleamulet: { name: 'Scale Amulet', text: 'Immune to poison', mods: { poisonImmune: 1 }, cost: { g: 30, scale: 2, venom: 1 } }
};
const ITEMS = {
  draught: { name: 'Healing Draught', text: 'Heal one hero 40%.', cost: { g: 15, scale: 1 }, skill: { name: 'Healing Draught', t: 'ally', heal: .4, style: 'aura', fx: 'heal', desc: 'Heal one hero 40%. Uses the turn.' } },
  antivenom: { name: 'Antivenom', text: 'Cleanse every hero’s debuffs.', cost: { g: 10, venom: 1 }, skill: { name: 'Antivenom', t: 'allAllies', cleanse: true, style: 'aura', fx: 'heal', desc: 'Cleanse the whole party. Uses the turn.' } },
  oil: { name: 'Fire Oil', text: 'Burn every enemy.', cost: { g: 15, scrap: 1, bone: 1 }, skill: { name: 'Fire Oil', t: 'allEnemies', dmg: .8, el: 'fire', st: [['burn', 2, 1]], style: 'spell', fx: 'fire', desc: 'Fire damage to all enemies and sets them burning. Uses the turn.' } }
};
const POSTS = {
  chaplain: { name: 'Chaplain', text: 'Resurrection odds +15% (Priests and Druids +25%).' },
  smith: { name: 'Smith', text: 'Forge gold costs −25%. A Dwarf also saves 1 of each material.' },
  drill: { name: 'Drillmaster', text: 'Training −25% gold, +15% contract XP (Warriors −35%).' },
  recruiter: { name: 'Recruiter', text: '+1 candidate on the board; hires 20% cheaper (Thieves 30%).' },
  quartermaster: { name: 'Quartermaster', text: '+15% gold from contracts (Rangers +25%).' }
};
const BUILDINGS = {
  hall: { name: 'Recruitment Hall', lv: ['', 'Board of 3 · roster cap 10', 'Board of 4 · roster cap 12', 'Board of 5 · cap 14 · veterans appear'] },
  yard: { name: 'Training Yard', lv: ['', 'Train up to Lv 4', 'Train up to Lv 7 · retrain subclasses', 'Train up to Lv 10'] },
  forge: { name: 'Forge', lv: ['', 'Tier 1 gear', 'Tier 2 gear', 'Tier 3 gear'] }
};
const UPCOST = [null, null, { g: 180, bone: 2, scrap: 2, scale: 2 }, { g: 360, iron: 4, hide: 4, venom: 3 }];
const CLOTH = ['#2a2e44', '#3a2430', '#2e3a2a', '#3a3226', '#2a3438', '#40302a', '#30283e', '#3e2a22', '#26323a'];
const HAIR = ['#2a2024', '#5a3a24', '#8a5a2a', '#9a4a24', '#b8a888', '#1c1820', '#6a6a70', '#c9b07a'];
function recruitLook(cls, race, R) {
  const P = a => a[Math.floor(R() * a.length)];
  const L = JSON.parse(JSON.stringify(LOOKS[CLASSES[cls].look]));
  L.skin = P(RACES[race].skins); L.seed = Math.floor(R() * 1000);
  if (L.hair) L.hair = P(HAIR);
  const cloth = P(CLOTH);
  if (cls === 'mage' || cls === 'druid' || cls === 'priest') { L.body = cloth; L.robeC = cloth; if (L.hat) L.hat = darken(cloth, .9); }
  if (cls === 'thief') { L.hood = cloth; L.scarf = P(['#6e2420', '#2e4a5a', '#5a4a24', '#3a2a4a']); }
  if (cls === 'warrior') { L.tabard = P(['#6a1e1c', '#1e2e5a', '#2a4a24', '#4a3a1a']); L.cape = darken(L.tabard, .7); L.shield = darken(L.tabard, .8); }
  if (cls === 'ranger') { L.body = P(['#4e3e2c', '#3e3a2a', '#4a3424']); if (race !== 'orc') { L.scar = R() < .3; L.head = P(['short', 'topknot', 'long']); } }
  if (L.beard) L.beard = R() < (race === 'dwarf' ? .85 : .4) ? (L.hair || P(HAIR)) : null;
  else if (race === 'dwarf' && L.head !== 'hood' && R() < .7) L.beard = L.hair || P(HAIR);
  if (race === 'dwarf') { L.legH = 8; L.headW = 9; L.shW = (L.shW || 10) + 1; L.waistW = (L.waistW || 8) + 1; }
  if (race === 'elf') { L.legH = 11; }
  return L;
}
