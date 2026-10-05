// The background track (public/bgsound.m4a, streamed) and synthesized key sounds; respects autoplay rules.
// If the track can't play (a file:// build, a failed load) a synthesized pad takes its place.
// One bus → compressor → soft clip, so stacked sounds never clip; while sound is off nothing is built at all.

const rnd = (a, b) => a + Math.random() * (b - a);
const MUSIC = 0.2;          // pad level: a bed under the clicks, never over them
const TRACK = 'bgsound.m4a', TRACK_LEVEL = 0.34;   // the music: an hour-long track, looped, under the clicks
const MAX_VOICES = 48;      // spam guard: past this, new one-shots are dropped instead of piling up
// gentle chord cycle in D minor-ish, root note low
const CHORDS = [[146.83, 220, 261.63, 349.23], [130.81, 196, 261.63, 311.13], [174.61, 220, 261.63, 392], [116.54, 174.61, 233.08, 293.66]];

class AudioEngine {
  constructor() {
    this.ctx = null; this.master = null; this.musicGain = null; this.sfxGain = null;
    this.enabled = true;      // user wants sound (music and effects)
    this.playing = false;     // music currently audible
    this.unlocked = false;    // a user gesture has happened
    this.hidden = false;
    this.listeners = new Set();
    this._pad = null; this._track = null; this._trackFailed = false; this._trackPause = 0; this._live = 0; this._hoverAt = -1; this._hoverHeat = 0; this._confirmAt = -1;
    // iOS/Safari drop a running context to suspended/interrupted (calls, lock screen) and only a gesture may resume it
    if (typeof window !== 'undefined') { const kick = () => { if (this.ctx && this.unlocked && this.enabled && !document.hidden && this.ctx.state !== 'running') this._resume(); }; for (const e of ['pointerdown', 'touchend', 'keydown']) window.addEventListener(e, kick, { capture: true, passive: true }); }
  }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  _emit() { for (const l of this.listeners) l(this.state); }
  get state() { return { enabled: this.enabled, playing: this.playing, unlocked: this.unlocked }; }
  _init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC({ latencyHint: 'interactive' }); } catch { try { this.ctx = new AC(); } catch { return; } }
    const ctx = this.ctx;
    // master: compressor glues stacks (6 ms lookahead), the waveshaper caps the output under 0.96 and stays linear below 0.6
    this.master = ctx.createGain(); this.master.gain.value = 1;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.knee.value = 6; comp.ratio.value = 12; comp.attack.value = 0.002; comp.release.value = 0.15;
    const clip = ctx.createWaveShaper(); clip.curve = this._ceiling();
    this.master.connect(comp); comp.connect(clip); clip.connect(ctx.destination);
    this.musicGain = ctx.createGain(); this.musicGain.gain.value = 0;
    // the track has its own fader straight to the master: it is mixed already, so it skips the room's reverb
    this.trackGain = ctx.createGain(); this.trackGain.gain.value = 0; this.trackGain.connect(this.master);
    this.sfxGain = ctx.createGain(); this.sfxGain.gain.value = 1;
    // one room for everything: the pad sits in it, the clicks only touch it
    const conv = ctx.createConvolver(); conv.buffer = this._impulse(2.8, 2.5);
    const mSend = ctx.createGain(); mSend.gain.value = 0.45; const sSend = ctx.createGain(); sSend.gain.value = 0.14;
    this.musicGain.connect(this.master); this.musicGain.connect(mSend); mSend.connect(conv);
    this.sfxGain.connect(this.master); this.sfxGain.connect(sSend); sSend.connect(conv); conv.connect(this.master);
    this._noise = this._buf(2, () => Math.random() * 2 - 1);
  }
  _buf(seconds, fn, ch = 1) {
    const rate = this.ctx.sampleRate, len = Math.floor(rate * seconds), buf = this.ctx.createBuffer(ch, len, rate);
    for (let c = 0; c < ch; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = fn(i / len, i); }
    return buf;
  }
  // random grains land anywhere in level: pin each take to one RMS so the rustle is equally loud every time
  _norm(buf, rms) { const d = buf.getChannelData(0); let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i]; const k = rms / Math.sqrt(s / d.length || 1); for (let i = 0; i < d.length; i++) d[i] *= k; return buf; }
  _impulse(seconds, decay) { return this._buf(seconds, (x) => (Math.random() * 2 - 1) * Math.pow(1 - x, decay), 2); }
  // odd length so 0 maps exactly to 0 (no DC); linear to 0.6, then tanh into 0.96
  _ceiling() { const n = 2049, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1, a = Math.abs(x); c[i] = Math.sign(x) * (a < 0.6 ? a : 0.6 + 0.36 * Math.tanh((a - 0.6) / 0.36)); } return c; }
  _resume() { const c = this.ctx; if (!c || c.state === 'running' || c.state === 'closed') return; try { const p = c.resume(); if (p && p.catch) p.catch(() => {}); } catch {} }
  // muted with the pad gone: stop the audio thread entirely (battery); setEnabled(true) resumes it inside its gesture
  _sleep() { const c = this.ctx; if (!c || this.enabled || this._pad || (this._track && !this._track.paused) || c.state !== 'running' || !c.suspend) return; try { const p = c.suspend(); if (p && p.catch) p.catch(() => {}); } catch {} }
  // ----- music: the track, streamed (only what is heard is downloaded); paused once faded out, so it picks up where it was
  get _useTrack() { return !this._trackFailed && typeof location !== 'undefined' && location.protocol !== 'file:'; }
  _trackStart() {
    clearTimeout(this._trackPause); this._trackPause = 0;
    if (!this._track) {
      const a = new Audio(); a.src = TRACK; a.loop = true; a.preload = 'none';
      a.addEventListener('error', () => { this._trackFailed = true; if (this.playing) this._fadeMusic(true); });
      try { this.ctx.createMediaElementSource(a).connect(this.trackGain); } catch { this._trackFailed = true; return; }
      this._track = a;
    }
    if (!this.hidden) { const p = this._track.play(); if (p && p.catch) p.catch(() => {}); }
  }
  _trackStop() { clearTimeout(this._trackPause); this._trackPause = setTimeout(() => { if (!this.playing && this._track) { this._track.pause(); this._sleep(); } }, 1600); }
  // ----- the fallback pad: built on demand, torn down once silent, never two at once
  _padStart() {
    if (this._pad) { clearTimeout(this._pad.kill); this._pad.kill = 0; return; }
    const ctx = this.ctx, t = ctx.currentTime;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 520; filter.Q.value = 0.7; filter.connect(this.musicGain);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lfoG = ctx.createGain(); lfoG.gain.value = 180; lfo.connect(lfoG); lfoG.connect(filter.frequency);
    const pad = this._pad = { oscs: [lfo], nodes: [filter, lfo, lfoG], voices: [], i: 0, kill: 0, timer: 0 };
    for (let i = 0; i < 4; i++) {
      const o = ctx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sawtooth';
      const g = ctx.createGain(); g.gain.value = 0.09 - i * 0.012; o.connect(g); g.connect(filter);
      pad.oscs.push(o); pad.nodes.push(o, g); pad.voices.push(o);
    }
    this._chord(pad, 0); for (const o of pad.oscs) o.start(t);
    // while the tab is hidden the clock is frozen: skip changes instead of queueing them
    pad.timer = setInterval(() => { if (ctx.state !== 'running') return; pad.i = (pad.i + 1) % CHORDS.length; this._chord(pad, 4); }, 9000);
  }
  _chord(pad, glide) {
    const t = this.ctx.currentTime;
    CHORDS[pad.i].forEach((f, i) => { const fr = pad.voices[i].frequency, v = f * (i % 2 ? 1.003 : 0.997); fr.cancelScheduledValues(t); if (glide) fr.setTargetAtTime(v, t, glide / 3); else fr.setValueAtTime(v, t); });
  }
  _padStop() {
    const pad = this._pad; if (!pad || pad.kill) return;
    let tries = 0; const kill = () => {
      if (this._pad !== pad) return;
      // the fade only advances while the clock runs; stopping early would click when the tab comes back
      if (this.ctx.state !== 'running' || (this.musicGain.gain.value > 1e-4 && tries++ < 5)) { pad.kill = setTimeout(kill, 1000); return; }
      clearInterval(pad.timer); for (const o of pad.oscs) { try { o.stop(); } catch {} } for (const n of pad.nodes) n.disconnect();
      this._pad = null; this._sleep();
    };
    pad.kill = setTimeout(kill, 3200);
  }
  /** Call on the first user gesture. */
  unlock() {
    this._init(); if (!this.ctx) return;
    this.unlocked = true; this._resume();
    // older iOS only opens the output once a buffer has started inside the gesture
    if (!this._primed) { this._primed = true; const s = this.ctx.createBufferSource(); s.buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate); s.connect(this.ctx.destination); s.onended = () => s.disconnect(); s.start(0); }
    if (this.enabled) this._fadeMusic(1); else this._sleep();
    this._emit();
  }
  _fadeMusic(on) {
    if (!this.ctx) return;
    const track = this._useTrack;
    if (on) { if (track) this._trackStart(); else this._padStart(); }
    if (on && !track && this._track) this._track.pause();   // (the track just failed: the pad takes over)
    // setTarget picks up from wherever the last fade got to, so rapid toggles glide instead of popping
    const t = this.ctx.currentTime;
    for (const [g, level] of [[this.trackGain.gain, track ? TRACK_LEVEL : 0], [this.musicGain.gain, track ? 0 : MUSIC]]) { g.cancelScheduledValues(t); g.setTargetAtTime(on ? level : 0, t, on ? 1 : 0.3); }
    if (!on || track) this._padStop();
    if (!on) this._trackStop();
    this.playing = !!on;
  }
  setEnabled(v) {
    v = !!v; const was = this.enabled; this.enabled = v;
    // a soft click confirms sound is back (once, however fast the toggle is hammered)
    if (this.unlocked) { if (v) this._resume(); this._fadeMusic(v); if (v && !was && !(this.ctx.currentTime - this._confirmAt < 0.4)) { this._confirmAt = this.ctx.currentTime; this.switchClick(); } }
    this._emit();
  }
  toggle() { this.setEnabled(!this.enabled); }
  /** Tab visibility: freeze the clock while hidden, wake only if there is something to hear. */
  setHidden(h) {
    this.hidden = !!h; if (!this.ctx) return;
    // the track pauses with the tab (a suspended context would let it run on silently and lose its place)
    if (h) { if (this._track) this._track.pause(); try { const p = this.ctx.suspend(); if (p && p.catch) p.catch(() => {}); } catch {} }
    else if (this.enabled && this.unlocked) { this._resume(); if (this.playing && this._useTrack && this._track) { const p = this._track.play(); if (p && p.catch) p.catch(() => {}); } }
  }
  // ----- sfx building blocks: every node frees itself when its source ends
  _t() { return this.ctx && this.unlocked && this.enabled && this._live < MAX_VOICES ? this.ctx.currentTime : -1; }
  _env(v, t, a, d, g) { v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g, t + a); v.gain.exponentialRampToValueAtTime(g * 1e-3, t + a + d); v.gain.linearRampToValueAtTime(0, t + a + d + 0.01); return t + a + d + 0.02; }
  // a sound's own stereo spot (left keys a little left); it frees itself with its last voice. no StereoPanner (old Safari): centre
  _pan(x) { if (!x || !this.ctx.createStereoPanner) return null; const p = this.ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, x)) * 0.35; p.connect(this.sfxGain); return { node: p, n: 0 }; }
  _out(v, bus) { this._live++; if (bus) { bus.n++; v.connect(bus.node); } else v.connect(this.sfxGain); }
  _done(bus) { this._live--; if (bus && --bus.n === 0) bus.node.disconnect(); }
  /** filtered noise with an attack/decay: the stuff of clicks, thocks, rustles and air */
  _burst(t, { type = 'bandpass', f, q = 1, a = 0.001, d, g, buf = this._noise, rate = 1, sweep = null, bus = null }) {
    const ctx = this.ctx, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), v = ctx.createGain();
    s.buffer = buf; s.playbackRate.value = rate; fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (sweep) for (const [fr, at] of sweep) fl.frequency.exponentialRampToValueAtTime(fr, t + at);
    const end = this._env(v, t, a, d, g), len = end - t;
    s.connect(fl); fl.connect(v); this._out(v, bus);
    s.onended = () => { s.disconnect(); fl.disconnect(); v.disconnect(); this._done(bus); };
    // a random slice of the shared noise: no allocation per sound, and no two clicks share a grain
    s.start(t, buf === this._noise ? Math.random() * Math.max(0, buf.duration - len * rate - 0.01) : 0, len * rate);
  }
  _tone(t, { type = 'sine', f, f2 = 0, glide = 0, a = 0.002, d, g, bus = null }) {
    const ctx = this.ctx, o = ctx.createOscillator(), v = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + (glide || a + d));
    const end = this._env(v, t, a, d, g);
    o.connect(v); this._out(v, bus);
    o.onended = () => { o.disconnect(); v.disconnect(); this._done(bus); };
    o.start(t); o.stop(end);
  }
  // ----- sfx
  /** opts.pan: -1 left edge … 1 right edge (kept subtle) */
  hover(opts) {
    const t = this._t(); if (t < 0) return; const { pan = 0 } = opts || {};
    // a fingertip meeting a cap: a dark brush, no beep. sweeping across many keys thins out instead of buzzing
    const dt = t - this._hoverAt; if (dt < 0.05) return;
    this._hoverHeat = this._hoverHeat * Math.exp(-dt / 0.3) + 1; this._hoverAt = t;
    this._burst(t, { type: 'lowpass', f: rnd(1500, 2100), q: 0.7, a: 0.002, d: 0.016, g: 0.13 / this._hoverHeat, bus: this._pan(pan) });
  }
  /**
   * A switch bottoming out: the stem's tick, the cap's hollow thock a few ms later, the plate's knock under both. Never the same twice.
   * opts.pan: the key's place across the board, -1 left edge … 1 right edge. opts.w: cap width in u; long caps (≥1.75u: shift, enter,
   * backspace, space) are deeper and carry a faint stabilizer rattle.
   */
  keyPress(pitch = 1, opts) {
    const t = this._t(); if (t < 0) return; const { pan = 0, w = 1 } = opts || {};
    const long = w >= 1.75, p = pitch * rnd(0.95, 1.05) * (long ? Math.max(0.74, 0.9 - (w - 1.75) * 0.035) : 1), g = rnd(0.8, 1.05), bus = this._pan(pan), body = long ? 0.08 : 0.06;
    this._burst(t, { f: 3800 * p, q: 0.9, d: 0.012, g: 0.21 * g, bus });
    this._burst(t + 0.004, { f: 360 * p * rnd(0.96, 1.04), q: 4, a: 0.002, d: body, g: 1.05 * g, bus });
    this._burst(t + 0.004, { type: 'lowpass', f: 1500 * p, q: 0.7, d: 0.028, g: 0.35 * g, bus });
    this._tone(t + 0.003, { f: 150 * p, f2: 85 * p, d: body, g: 0.17 * g, bus });
    // the stabilizer wire settling: two or three tiny metallic ticks just after the thock
    if (long) for (let i = 0, n = w > 3 ? 3 : 2; i < n; i++) this._burst(t + 0.009 + i * 0.008 + rnd(0, 0.004), { f: rnd(4600, 5800), q: 10, d: 0.007, g: rnd(0.15, 0.25) * g / (i + 1), bus });
  }
  /** The upstroke: lighter and brighter than the press (wire to keyup). Same opts as keyPress. */
  keyRelease(pitch = 1, opts) {
    const t = this._t(); if (t < 0) return; const { pan = 0, w = 1 } = opts || {};
    const p = pitch * rnd(0.95, 1.05) * (w >= 1.75 ? 0.88 : 1), g = rnd(0.8, 1.05), bus = this._pan(pan);
    this._burst(t, { f: 2800 * p, q: 1.2, d: 0.008, g: 0.25 * g, bus });
    this._burst(t + 0.002, { f: 620 * p, q: 3, d: 0.03, g: 1 * g, bus });
  }
  whoosh() {
    const t = this._t(); if (t < 0) return;
    this._burst(t, { type: 'lowpass', f: 200, q: 0.9, a: 0.35, d: 0.55, g: 0.11, sweep: [[2200, 0.4], [150, 0.9]] });
  }
  /** short mechanical tick (clock): escapement click with a small metallic ring */
  tick() {
    const t = this._t(); if (t < 0) return;
    this._burst(t, { type: 'highpass', f: 3200, q: 0.7, d: 0.005, g: 0.11 });
    this._burst(t, { f: 4300 * rnd(0.98, 1.02), q: 9, d: 0.03, g: 0.6 });
    this._burst(t + 0.001, { f: 1700, q: 4, d: 0.018, g: 0.19 });
  }
  /** soft switch click (lamp, neon): a plastic snap and its small return */
  switchClick() {
    const t = this._t(); if (t < 0) return;
    const p = rnd(0.96, 1.04);
    this._burst(t, { type: 'highpass', f: 2400, q: 0.7, d: 0.006, g: 0.22 });
    this._burst(t + 0.002, { f: 1150 * p, q: 6, d: 0.035, g: 1.2 });
    this._tone(t, { f: 210 * p, f2: 120, d: 0.04, g: 0.14 });
    this._burst(t + 0.065, { f: 1500 * p, q: 5, d: 0.02, g: 0.38 });
  }
  /** soft electronic wake (monitor, PC): a relay, then the rising hum */
  powerOn() {
    const t = this._t(); if (t < 0) return;
    this._burst(t, { f: 900, q: 2, d: 0.03, g: 0.15 });
    this._tone(t + 0.02, { f: 180, f2: 720, glide: 0.4, a: 0.12, d: 0.5, g: 0.038 });
    this._tone(t + 0.02, { type: 'triangle', f: 360, f2: 1440, glide: 0.4, a: 0.15, d: 0.4, g: 0.01 });
  }
  /** paper rustle (note, curtains, box): a crinkle of random grains; three takes × speed × tone so it never repeats exactly */
  paper() {
    const t = this._t(); if (t < 0) return;
    if (!this._paper) this._paper = [0, 1, 2].map(() => { let grain = 0, amp = 0; return this._norm(this._buf(0.34, (x) => { if (Math.random() < 0.004 * (1 - x)) { grain = 1; amp = rnd(0.3, 1); } grain *= 0.993; return (Math.random() * 2 - 1) * grain * amp * (0.35 + 0.65 * (1 - x)); }), 0.2); });
    this._burst(t, { type: 'highpass', f: rnd(1300, 2100), q: 0.6, a: 0.004, d: rnd(0.26, 0.34), g: 0.15 * rnd(0.9, 1.05), buf: this._paper[Math.random() * 3 | 0], rate: rnd(0.85, 1.15) });
    // sometimes the sheet's body flaps too: a soft low puff under the crinkle
    if (Math.random() < 0.5) this._burst(t + rnd(0, 0.05), { type: 'lowpass', f: rnd(380, 600), q: 0.7, a: 0.02, d: 0.09, g: 0.12 });
  }
  /** an appliance acknowledging its remote (the split AC over the door): one clean beep for on, two short ones for off.
   *  A flat sine with soft edges, not a decaying ping; kept low, since the ear is most sensitive right around 2.7 kHz. */
  beep(on = true) {
    const t = this._t(); if (t < 0) return;
    const one = (at, dur) => {
      const ctx = this.ctx, o = ctx.createOscillator(), v = ctx.createGain(), g = 0.055;
      o.type = 'sine'; o.frequency.setValueAtTime(2700, at);
      v.gain.setValueAtTime(0, at); v.gain.linearRampToValueAtTime(g, at + 0.008); v.gain.setValueAtTime(g, at + dur - 0.015); v.gain.linearRampToValueAtTime(0, at + dur);
      o.connect(v); this._out(v); o.onended = () => { o.disconnect(); v.disconnect(); this._done(); };
      o.start(at); o.stop(at + dur + 0.01);
    };
    if (on) one(t, 0.11); else { one(t, 0.05); one(t + 0.09, 0.05); }
  }
  chime() {
    const t = this._t(); if (t < 0) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { const ti = t + i * 0.09; this._tone(ti, { f, a: 0.008, d: 1.3, g: 0.05 }); this._tone(ti, { f: f * 2.01, a: 0.004, d: 0.35, g: 0.011 }); });
  }
}

export const audio = new AudioEngine();
