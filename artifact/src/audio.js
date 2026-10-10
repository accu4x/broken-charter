/* ================= AUDIO ================= */
const SND = {
  ctx: null, master: null, mus: null, sfx: null, noise: null,
  musicOn: store.get('bc.music', true), sfxOn: store.get('bc.sfx', true), cur: null, step: 0, next: 0, timer: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = .9; this.master.connect(c.destination);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.connect(this.master);
    this.mus = c.createGain(); this.mus.gain.value = this.musicOn ? 1 : 0; this.mus.connect(lp);
    this.sfx = c.createGain(); this.sfx.gain.value = this.sfxOn ? 1 : 0; this.sfx.connect(this.master);
    const len = c.sampleRate; const buf = c.createBuffer(1, len, c.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this.noise = buf;
    if (this.want) this.play(this.want);
  },
  freq(n) { const m = /^([A-G])(#|b)?(-?\d)$/.exec(n); if (!m) return 0; const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return 440 * Math.pow(2, ((+m[3] + 1) * 12 + base - 69) / 12); },
  tone(bus, type, f, t, dur, g, f2) { const c = this.ctx; const o = c.createOscillator(); const v = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur); v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g, t + .006); v.gain.exponentialRampToValueAtTime(.0008, t + dur); o.connect(v); v.connect(bus); o.start(t); o.stop(t + dur + .02); },
  hiss(bus, t, dur, g, type, f, f2) { const c = this.ctx; const s = c.createBufferSource(); s.buffer = this.noise; const fl = c.createBiquadFilter(); fl.type = type || 'highpass'; fl.frequency.setValueAtTime(f || 2000, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); const v = c.createGain(); v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(.0008, t + dur); s.connect(fl); fl.connect(v); v.connect(bus); s.start(t, Math.random() * .5); s.stop(t + dur + .02); },
  fx(name) {
    if (!this.ctx || !this.sfxOn) return; const t = this.ctx.currentTime + .005, b = this.sfx;
    const arp = (type, notes, gap, g, d) => notes.forEach((n, i) => this.tone(b, type, this.freq(n), t + i * gap, d || .14, g));
    switch (name) {
      case 'blip': this.tone(b, 'square', 660, t, .05, .035); break;
      case 'select': this.tone(b, 'square', 520, t, .04, .035); this.tone(b, 'square', 780, t + .045, .06, .035); break;
      case 'slash': this.hiss(b, t, .14, .24, 'bandpass', 3000, 700); this.tone(b, 'square', 280, t, .09, .05, 100); break;
      case 'hit': this.hiss(b, t, .09, .28, 'lowpass', 1600); this.tone(b, 'sine', 150, t, .14, .26, 45); break;
      case 'crit': this.hiss(b, t, .12, .34, 'lowpass', 2400); this.tone(b, 'sine', 180, t, .2, .3, 40); this.tone(b, 'square', 1200, t, .07, .05, 2000); break;
      case 'fire': this.hiss(b, t, .36, .22, 'bandpass', 500, 2200); this.tone(b, 'sawtooth', 100, t, .28, .04, 60); break;
      case 'holy': arp('triangle', ['E6', 'G#6', 'B6', 'E7'], .05, .06, .26); break;
      case 'arcane': this.tone(b, 'square', 420, t, .3, .05, 1500); this.tone(b, 'triangle', 900, t + .04, .24, .05, 260); break;
      case 'nature': this.tone(b, 'triangle', 260, t, .22, .08, 560); this.hiss(b, t, .18, .08, 'bandpass', 1100); break;
      case 'dark': this.tone(b, 'sawtooth', 190, t, .34, .05, 70); this.tone(b, 'square', 201, t, .34, .03, 75); break;
      case 'venom': this.tone(b, 'sine', 380, t, .24, .1, 150); this.hiss(b, t, .14, .1, 'bandpass', 800); break;
      case 'arrow': this.hiss(b, t, .08, .18, 'highpass', 3400); this.tone(b, 'square', 1500, t, .06, .03, 640); break;
      case 'quake': this.tone(b, 'sine', 80, t, .45, .34, 30); this.hiss(b, t, .4, .22, 'lowpass', 420); break;
      case 'smoke': this.hiss(b, t, .34, .16, 'lowpass', 800, 180); break;
      case 'heal': arp('triangle', ['C5', 'E5', 'G5', 'C6'], .05, .07); break;
      case 'buff': arp('square', ['G4', 'C5', 'E5', 'G5'], .045, .035, .1); break;
      case 'debuff': arp('square', ['E5', 'C5', 'A4'], .05, .03, .1); break;
      case 'death': this.tone(b, 'square', 380, t, .4, .05, 60); this.hiss(b, t + .05, .3, .08, 'lowpass', 600); break;
      case 'ambush': this.tone(b, 'sawtooth', 140, t, .32, .07, 300); this.hiss(b, t, .22, .15, 'bandpass', 1400); break;
      case 'win': arp('square', ['A4', 'C5', 'E5', 'A5', 'E5', 'A5'], .1, .045, .22); break;
      case 'lose': arp('triangle', ['E4', 'D4', 'C4', 'A3'], .18, .1, .4); break;
      case 'coin': this.tone(b, 'square', 988, t, .06, .035); this.tone(b, 'square', 1319, t + .06, .14, .035); break;
    }
  },
  TUNES: {
    guild: { bpm: 92, lead: 'A4 - C5 - E5 - D5 C5 B4 - G4 - A4 - - - F4 - A4 - C5 - B4 A4 G#4 - B4 - E5 - - -', bass: 'A2 - E3 - A2 - E3 - G2 - D3 - G2 - D3 - F2 - C3 - F2 - C3 - E2 - B2 - E2 - G#2 -', drum: 'k...h...s...h..hk...h...s...h.hh', leadType: 'triangle', lg: .07 },
    crypt: { bpm: 80, lead: 'D5 - - F5 E5 - D5 - C5 - - - A4 - - - D5 - - F5 G5 - A5 - Bb5 - A5 - E5 - - -', bass: 'D3 - - - D3 - - - A2 - - - A2 - - - Bb2 - - - Bb2 - - - A2 - - - A2 - C3 -', drum: 'k...h...k...h..hk...h...k...h.hh', leadType: 'triangle', lg: .07 },
    thorn: { bpm: 104, lead: 'E4 - G4 B4 E5 - D5 B4 A4 - G4 - E4 - F#4 - G4 - B4 E5 F#5 - E5 D5 B4 - A4 - G4 - - -', bass: 'E2 - B2 - E2 - B2 - C3 - G3 - C3 - G3 - D3 - A3 - D3 - A3 - B2 - F#3 - B2 - D#3 -', drum: 'k.hks.h.k.hks.hhk.hks.h.k.h.sshh', leadType: 'square', lg: .022 },
    mire: { bpm: 84, lead: 'A4 - C5 - E5 - D5 C5 B4 - - G4 A4 - - - A4 - C5 - F5 - E5 D5 E5 - - - - - - -', bass: 'A2 - E3 - A2 - E3 - G2 - D3 - G2 - D3 - F2 - C3 - F2 - C3 - E2 - B2 - E2 - G#2 -', drum: 'k..h..s.k..h..s.k..h..s.k..h.ss.', leadType: 'triangle', lg: .07 },
    battle: { bpm: 140, lead: 'A4 A4 E5 A4 G5 A4 E5 D5 C5 C5 G5 C5 A5 G5 E5 D5 F5 F5 C6 F5 E5 F5 D5 C5 E5 - B4 - E5 - G#5 -', bass: 'A2 A3 A2 A3 A2 A3 A2 A3 C3 C4 C3 C4 C3 C4 C3 C4 F2 F3 F2 F3 F2 F3 F2 F3 E2 E3 E2 E3 E2 E3 E2 E3', drum: 'khshkkshkhshkkshkhshkkshkhshksss', leadType: 'square', lg: .022 },
    boss: { bpm: 152, lead: 'D5 - D5 F5 D5 - A5 G5 F5 - E5 - D5 - C5 - Bb4 - D5 F5 Bb5 - A5 G5 A5 - C#6 - A5 - E5 -', bass: 'D2 D3 D2 D3 D2 D3 D2 D3 A1 A2 A1 A2 A1 A2 A1 A2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 A1 A2 A1 A2 C#2 C#3 E2 E3', drum: 'khshkhskkhshkhskkhshkhskksksksss', leadType: 'square', lg: .022 }
  },
  play(name) {
    this.want = name; if (!this.ctx) return; if (this.cur && this.cur.name === name) return;
    const T = this.TUNES[name]; if (!T) return;
    this.cur = { name, bpm: T.bpm, lead: T.lead.split(' '), bass: T.bass.split(' '), drum: T.drum.split(''), leadType: T.leadType, lg: T.lg };
    this.step = 0; this.next = this.ctx.currentTime + .08; if (!this.timer) this.timer = setInterval(() => this.tick(), 30);
  },
  tick() {
    const c = this.ctx, T = this.cur; if (!c || !T || document.hidden) return; const sd = 60 / T.bpm / 2;
    if (this.next < c.currentTime) this.next = c.currentTime + .02;
    while (this.next < c.currentTime + .14) {
      const i = this.step % T.lead.length, t = this.next;
      const hold = (arr, i) => { let n = 1; while (arr[(i + n) % arr.length] === '-' && n < arr.length) n++; return n; };
      const ln = T.lead[i]; if (ln && ln !== '-' && ln !== '.') this.tone(this.mus, T.leadType, this.freq(ln), t, sd * hold(T.lead, i) * .95, T.lg);
      const bn = T.bass[i % T.bass.length]; if (bn && bn !== '-' && bn !== '.') this.tone(this.mus, 'triangle', this.freq(bn), t, sd * hold(T.bass, i % T.bass.length) * .9, .085);
      const d = T.drum[i % T.drum.length];
      if (d === 'k') this.tone(this.mus, 'sine', 130, t, .13, .2, 40); if (d === 's') this.hiss(this.mus, t, .1, .09, 'bandpass', 1600); if (d === 'h') this.hiss(this.mus, t, .035, .03, 'highpass', 7000);
      this.step++; this.next += sd;
    }
  },
  setMusic(on) { this.musicOn = on; store.set('bc.music', on); if (this.mus) this.mus.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, .05); },
  setSfx(on) { this.sfxOn = on; store.set('bc.sfx', on); if (this.sfx) this.sfx.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, .02); }
};
window.addEventListener('pointerdown', () => SND.init(), { capture: true });
window.addEventListener('keydown', () => SND.init(), { capture: true });

