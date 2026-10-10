/* ================= FOES, SETTINGS, STATUS ================= */
const FOES = {
  skeleton: { name: 'Skeleton', hp: 70, atk: 15, def: 12, spd: 96, undead: true, skills: [{ name: 'Bone Slash', t: 'enemy', dmg: 1.0, el: 'phys', style: 'melee' }] },
  ghoul: { name: 'Ghoul', hp: 85, atk: 17, def: 8, spd: 104, undead: true, skills: [{ name: 'Rend', t: 'enemy', dmg: .95, el: 'phys', style: 'melee', st: [['bleed', 2, .4]] }, { name: 'Gorge', t: 'enemy', cd: 3, dmg: 1.4, el: 'phys', style: 'melee' }] },
  wraith: { name: 'Wraith', hp: 60, atk: 19, def: 6, spd: 112, undead: true, float: true, skills: [{ name: 'Chill Touch', t: 'enemy', dmg: 1.0, el: 'dark', style: 'shot', fx: 'dark', bar: -15 }, { name: 'Wail', t: 'allEnemies', cd: 3, dmg: .55, el: 'dark', style: 'spell', fx: 'dark' }] },
  boneknight: { name: 'Bone Knight', hp: 420, atk: 25, def: 18, spd: 100, undead: true, boss: true, skills: [{ name: 'Grave Cleave', t: 'enemy', dmg: 1.25, el: 'phys', style: 'melee' }, { name: 'Dread Sweep', t: 'allEnemies', cd: 3, dmg: .8, el: 'dark', style: 'spell', fx: 'dark' }, { name: 'Raise Dead', t: 'self', cd: 4, summon: 'skeleton', style: 'aura', fx: 'dark' }] },
  goblin: { name: 'Goblin', hp: 42, atk: 13, def: 6, spd: 116, goblin: true, skills: [{ name: 'Stab', t: 'enemy', dmg: 1.0, el: 'phys', style: 'melee' }] },
  slinger: { name: 'Goblin Slinger', hp: 38, atk: 14, def: 5, spd: 112, goblin: true, skills: [{ name: 'Sling Stone', t: 'enemy', dmg: 1.0, el: 'phys', style: 'shot', fx: 'stone', st: [['stun', 1, .12]] }] },
  shaman: { name: 'Goblin Shaman', hp: 48, atk: 12, def: 6, spd: 106, goblin: true, skills: [{ name: 'Hex Bolt', t: 'enemy', dmg: .9, el: 'arcane', style: 'shot', fx: 'arcane' }, { name: 'War Chant', t: 'allAllies', cd: 3, ally: [['atkUp', 2]], style: 'aura', fx: 'buff' }, { name: 'Mend', t: 'allAllies', cd: 3, heal: .2, style: 'aura', fx: 'heal' }] },
  troll: { name: 'Bridge Troll', hp: 240, atk: 24, def: 12, spd: 84, troll: true, big: true, skills: [{ name: 'Club', t: 'enemy', dmg: 1.3, el: 'phys', style: 'melee' }, { name: 'Ground Pound', t: 'allEnemies', cd: 3, dmg: .7, el: 'phys', style: 'spell', fx: 'quake', st: [['stun', 1, .2]] }] },
  mossback: { name: 'Old Mossback', hp: 520, atk: 28, def: 14, spd: 86, troll: true, boss: true, big: true, skills: [{ name: 'Crush', t: 'enemy', dmg: 1.6, el: 'phys', style: 'melee', st: [['stun', 1, .3]] }, { name: 'Sweep', t: 'allEnemies', cd: 3, dmg: .85, el: 'phys', style: 'spell', fx: 'quake' }, { name: 'Bellow', t: 'self', cd: 4, self: [['atkUp', 2]], summon: 'goblin', style: 'aura', fx: 'buff' }] },
  lizard: { name: 'Lizardkin Spear', hp: 72, atk: 17, def: 12, spd: 106, lizard: true, skills: [{ name: 'Spear Thrust', t: 'enemy', dmg: 1.1, el: 'phys', style: 'melee', st: [['poison', 2, .4]] }] },
  spitter: { name: 'Venomspitter', hp: 56, atk: 16, def: 8, spd: 113, lizard: true, skills: [{ name: 'Spit', t: 'enemy', dmg: .8, el: 'nature', style: 'shot', fx: 'venom', st: [['poison', 2, .7]] }, { name: 'Venom Cloud', t: 'allEnemies', cd: 3, dmg: .45, el: 'nature', style: 'spell', fx: 'venom', st: [['poison', 2, .5]] }] },
  matriarch: { name: 'Fen Matriarch', hp: 460, atk: 24, def: 14, spd: 108, lizard: true, boss: true, skills: [{ name: 'Tidecaller', t: 'enemy', dmg: 1.2, el: 'arcane', style: 'shot', fx: 'venom', st: [['poison', 2, .5]] }, { name: 'Swamp Surge', t: 'allEnemies', cd: 3, dmg: .75, el: 'nature', style: 'spell', fx: 'venom', st: [['poison', 2, .4]] }, { name: 'Shed Skin', t: 'self', cd: 4, heal: .18, cleanse: true, style: 'aura', fx: 'heal' }] }
};
const SETTINGS = {
  crypt: { name: 'The Sunken Crypt', tier: 'Contract · Undead', reward: 140,
    blurb: 'The dead walk the old imperial vaults. A town priest pays the guild to put them back.',
    hint: 'Undead are immune to poison and bleeding. Holy damage hits them 60% harder.', tags: [['Holy is strong', 'good'], ['Poison useless', 'warn']], music: 'crypt',
    battles: [['skeleton', 'skeleton', 'ghoul'], ['skeleton', 'wraith', 'skeleton'], ['ghoul', 'ghoul', 'wraith'], ['wraith', 'skeleton', 'ghoul']],
    elite: [['wraith', 'ghoul', 'wraith', 'skeleton']], boss: ['boneknight', 'skeleton', 'skeleton'] },
  thorn: { name: 'Thornwood Raid', tier: 'Contract · Goblins', reward: 150,
    blurb: 'Warbands pour through the broken frontier. A lord wants the forest road open again.',
    hint: 'Goblins come in swarms, so area attacks shine. Trolls regenerate unless they are burning.', tags: [['Area attacks', 'good'], ['Bring fire', 'warn']], music: 'thorn',
    battles: [['goblin', 'goblin', 'slinger', 'goblin'], ['goblin', 'shaman', 'slinger', 'goblin', 'goblin'], ['slinger', 'goblin', 'goblin', 'shaman'], ['goblin', 'goblin', 'goblin', 'slinger']],
    elite: [['troll', 'goblin', 'goblin']], boss: ['mossback', 'goblin', 'slinger'] },
  mire: { name: 'Mirefen Dispute', tier: 'Contract · Lizardkin', reward: 145,
    blurb: 'Settlers drained the marsh. The lizardkin want it back. The settlers are paying, for now.',
    hint: 'Lizardkin ambush from the water unless a Thief or Ranger scouts ahead. Their venom poisons; priests can cleanse it.', tags: [['Bring a scout', 'good'], ['Venom', 'warn']], music: 'mire',
    battles: [['lizard', 'spitter', 'lizard'], ['lizard', 'lizard', 'spitter'], ['spitter', 'lizard', 'spitter'], ['lizard', 'spitter', 'lizard', 'spitter']],
    elite: [['lizard', 'lizard', 'spitter', 'spitter']], boss: ['matriarch', 'lizard', 'spitter'] }
};
const RELICS = {
  ember: { name: 'Ember Charm', text: 'Fire damage +30%.' }, bell: { name: 'Saint’s Bell', text: 'Healing +30%.' },
  ward: { name: 'Wardstone', text: 'Party DEF +15%.' }, feather: { name: 'Quickfeather', text: 'Party SPD +8%.' },
  banner: { name: 'Guild Banner', text: 'Heroes start each battle 30% closer to their first turn.' }, antivenom: { name: 'Antivenom Flask', text: 'Heroes can’t be poisoned.' },
  whetstone: { name: 'Whetstone', text: 'Crit chance +10%.' }, salt: { name: 'Grave Salt', text: 'Holy damage +30%.' }
};
const STATUS = {
  burn: { c: '#ff8a3a', debuff: true, label: 'Burning' }, poison: { c: '#b47ce0', debuff: true, label: 'Poisoned' }, bleed: { c: '#d0402e', debuff: true, label: 'Bleeding' },
  stun: { c: '#f0d04a', debuff: true, label: 'Stunned' }, defBreak: { c: '#8a8a96', debuff: true, label: 'DEF broken' },
  atkUp: { c: '#e8683a', label: 'ATK up' }, defUp: { c: '#7fa8d8', label: 'DEF up' }, regen: { c: '#7fc86a', label: 'Regen' }, taunt: { c: '#d6a84e', label: 'Taunting' }
};

const ICONS = {};
function iconGrid(kind) {
  const g = Grid(12, 12);
  if (kind === 'battle') { for (let i = 0; i < 8; i++) { g.px(2 + i, 2 + i, '!#cfd2dc'); g.px(9 - i, 2 + i, '!#cfd2dc'); } g.rect(2, 8, 2, 2, '!#a37a36'); g.rect(8, 8, 2, 2, '!#a37a36'); }
  if (kind === 'elite') { g.rect(3, 2, 6, 5, '!#d8cfb4'); g.rect(4, 7, 4, 2, '!#d8cfb4'); g.px(4, 4, '!#b02a20'); g.px(7, 4, '!#b02a20'); g.px(5, 5, '!#2a1414'); g.px(6, 5, '!#2a1414'); g.px(5, 8, '!#2a1414'); g.px(2, 1, '!#d8cfb4'); g.px(9, 1, '!#d8cfb4'); }
  if (kind === 'treasure') { g.rect(2, 4, 8, 6, '!#6a4020'); g.rect(2, 4, 8, 2, '!#8a5a2e'); g.rect(5, 6, 2, 2, '!#d6a84e'); g.rect(2, 7, 8, 1, '!#a37a36'); }
  if (kind === 'rest') { g.rect(3, 9, 6, 1, '!#5e4228'); g.px(2, 10, '!#5e4228'); g.px(9, 10, '!#5e4228'); g.rect(5, 4, 2, 5, '!#e8742a'); g.px(4, 6, '!#e8742a'); g.px(7, 5, '!#e8742a'); g.rect(5, 6, 2, 3, '!#ffd27a'); g.px(6, 2, '!#e8742a'); }
  if (kind === 'boss') { g.rect(2, 3, 8, 2, '!#d6a84e'); [2, 5, 6, 9].forEach(x => { g.px(x, 1, '!#d6a84e'); g.px(x, 2, '!#d6a84e'); }); g.rect(3, 6, 6, 4, '!#d8cfb4'); g.px(4, 7, '!#b02a20'); g.px(7, 7, '!#b02a20'); }
  shade(g); selout(g); return toCanvas(g);
}

