/* ================= SHARED HELPERS ================= */
const $ = s => document.querySelector(s);
const rnd = Math.random;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(rnd() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
// Player settings in one key. Older saves kept bc.music, bc.sfx and bc.speed; they migrate in once.
const PREFS = (() => {
  const had = store.get('bc.settings', null);
  const p = Object.assign({ music: 1, sfx: 1, speed: 1, light: false, lightChecked: false }, had || {});
  if (!had) {
    if (store.get('bc.music', true) === false) p.music = 0;
    if (store.get('bc.sfx', true) === false) p.sfx = 0;
    const sp = store.get('bc.speed', null); if (sp) p.speed = clamp(sp, 1, 3);
    ['bc.music', 'bc.sfx', 'bc.speed'].forEach(k => store.del(k)); store.set('bc.settings', p);
  }
  return p;
})();
const savePrefs = () => store.set('bc.settings', PREFS);
function toast(text) { const el = $('#toast'); el.textContent = text; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 7000); }
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
