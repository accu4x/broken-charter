/* ================= CHARACTER LOOKS ================= */
const LOOKS = {
  brenna: { rig: 'h', head: 'helm', metal: '#8d929e', skin: '#c99878', body: '#6f7480', chest: 'plate', tabard: '#6a1e1c', sleeve: '#5f6470', glove: '#5a5e68', legs: '#4a4c56', kneeC: '#7a7f8c', boots: '#3a2c22', belt: '#3a2a1e', cape: '#3e1c1c', shield: '#4a2422', trim: '#8a7040', weapon: 'sword', pauldron: '#8d929e', shW: 11, seed: 3 },
  sela: { rig: 'h', head: 'hood', hood: '#323a30', skin: '#d4b08e', body: '#3b322c', chest: 'scarf', scarf: '#6e2420', sleeve: '#2e2824', legs: '#2a2522', boots: '#2e2219', belt: '#4a3524', weapon: 'dagger', offDagger: true, shW: 9, waistW: 7, legW: 2, seed: 5 },
  orrin: { rig: 'h', head: 'hat', hat: '#262a3e', hair: '#5a5050', skin: '#cfa47e', body: '#2a2e44', robe: true, robeC: '#2a2e44', chest: 'robe', trim: '#8f7436', boots: '#2a1e16', weapon: 'staff', orb: '#ffb35a', orbD: '#c2501c', caster: true, beard: '#8a8278', shW: 9, seed: 8 },
  hilde: { rig: 'h', head: 'long', hair: '#9a4a24', beard: '#a8552a', skin: '#d29a76', body: '#a49c88', robe: true, robeC: '#9c9480', chest: 'robe', trim: '#9a7a36', boots: '#3a2a1e', weapon: 'mace', wmetal: '#a88a3e', legH: 8, torsoH: 10, shW: 11, waistW: 10, headW: 9, seed: 4 },
  grask: { rig: 'h', head: 'topknot', hair: '#1c1820', skin: '#6f8458', body: '#4e3e2c', chest: 'leather', strap: '#2e2218', fur: '#5e5446', sleeve: '#6f8458', legs: '#3e3226', boots: '#2a2018', belt: '#2a2018', weapon: 'bow', scar: true, shW: 12, waistW: 9, headW: 8, seed: 6 },
  wren: { rig: 'h', head: 'long', hair: '#8d9a8c', leafCrown: true, skin: '#dcc0a0', body: '#33482f', robe: true, robeC: '#2f432c', chest: 'robe', trim: '#6a7a42', boots: '#2e2218', weapon: 'staff', orb: '#9ae07a', orbD: '#3e7a34', caster: true, shW: 9, waistW: 7, seed: 12 },

  skeleton: { rig: 'h', head: 'skull', skin: '#bfb699', body: '#a89f84', chest: 'ribs', limb: 1, legW: 1, legs: '#a89f84', boots: '#8a826a', sleeve: '#a89f84', glove: '#a89f84', belt: '#3e3024', weapon: 'rusty', eye: '#ff4a32', shW: 9, waistW: 4, seed: 21 },
  ghoul: { rig: 'h', head: 'bald', skin: '#7d8a72', eye: '#e8d84a', body: '#3a3430', chest: 'rags', sleeve: '#7d8a72', legs: '#4a4038', boots: '#5d6a54', claws: true, hunch: 3, headFwd: 1, legH: 9, torsoH: 9, shW: 10, waistW: 7, seed: 22 },
  wraith: { rig: 'h', head: 'wraith', hood: '#2e2840', skin: '#2e2840', body: '#2a2438', robeC: '#2a2438', sleeve: '#2e2840', glove: '#5e5a7a', eye: '#7ff0e0', float: true, claws: true, legH: 9, shW: 10, seed: 23 },
  boneknight: { rig: 'h', head: 'skullhelm', skin: '#bfb699', metal: '#3e3f48', body: '#3e3f48', chest: 'plate', tabard: '#4a1414', sleeve: '#34353e', glove: '#3e3f48', legs: '#2e2f38', kneeC: '#4e505a', boots: '#24252c', belt: '#2a2018', cape: '#3a1010', weapon: 'greatsword', pauldron: '#4e505a', eye: '#ff3a2a', gw: 40, gh: 50, cx: 17, legH: 14, torsoH: 14, headH: 9, headW: 9, shW: 15, waistW: 11, legW: 4, limb: 3, seed: 24 },
  goblin: { rig: 'h', head: 'goblin', skin: '#5f7a3c', body: '#4a3a26', chest: 'rags', sleeve: '#5f7a3c', legs: '#3a2e20', boots: '#3a4a26', belt: '#2a2018', weapon: 'dagger', gw: 28, gh: 32, cx: 12, legH: 7, torsoH: 7, headH: 8, headW: 9, shW: 8, waistW: 7, legW: 2, seed: 31 },
  slinger: { rig: 'h', head: 'goblin', skin: '#688444', body: '#5a4a2a', chest: 'leather', strap: '#3a2a1a', sleeve: '#688444', legs: '#3a2e20', boots: '#3a4a26', weapon: 'sling', gw: 28, gh: 32, cx: 12, legH: 7, torsoH: 7, headH: 8, headW: 9, shW: 8, waistW: 7, legW: 2, seed: 32 },
  shaman: { rig: 'h', head: 'mask', skin: '#5f7a3c', body: '#3e2a3e', robe: true, robeC: '#3a283a', chest: 'rags', sleeve: '#5f7a3c', boots: '#3a4a26', weapon: 'staff', orb: '#7fe07a', orbD: '#2e6a2a', caster: true, gw: 28, gh: 34, cx: 12, legH: 7, torsoH: 8, headH: 8, headW: 9, shW: 8, waistW: 7, seed: 33 },
  troll: { rig: 't', skin: '#62775a', belly: '#7a8a66', loin: '#4a3624', size: 1 },
  mossback: { rig: 't', skin: '#56704e', belly: '#6e8058', loin: '#3a2a1a', size: 1.28 },
  lizard: { rig: 'h', head: 'lizard', skin: '#3e7a66', crest: '#b8642e', body: '#4e4230', chest: 'leather', strap: '#2e2418', sleeve: '#3e7a66', legs: '#3e7a66', boots: '#2e5a4a', belt: '#2a2018', weapon: 'spear', thrust: true, tail: true, shW: 10, waistW: 8, seed: 41 },
  spitter: { rig: 'h', head: 'lizard', skin: '#5a7a42', crest: '#8a4ab8', body: '#5a7a42', chest: 'rags', sleeve: '#5a7a42', legs: '#5a7a42', boots: '#3e5a2e', claws: true, tail: true, belly: '#a8f06a', hunch: 1, shW: 9, waistW: 8, seed: 42 },
  matriarch: { rig: 'h', head: 'frill', skin: '#3a7064', crest: '#2e9a8a', body: '#243a52', robe: true, robeC: '#22344a', chest: 'robe', trim: '#9a7a36', sleeve: '#3a7064', boots: '#2a4a40', weapon: 'staff', orb: '#c08cf0', orbD: '#5a2e8a', caster: true, tail: true, gw: 38, gh: 48, cx: 16, legH: 13, torsoH: 13, headH: 9, headW: 9, shW: 13, waistW: 11, seed: 43 }
};
const SPR = {};
function buildSprites(keys, foeSet) {
  for (const k of keys) { const o = LOOKS[k]; SPR[k] = makeFrames(o.rig === 't' ? troll : humanoid, o, foeSet.has(k)); }
}
