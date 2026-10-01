// Tiny tween engine, one motion vocabulary for camera, objects and UI.

const c1 = 1.70158;
export const Ease = {
  linear: (t) => t,
  sineIn: (t) => 1 - Math.cos((t * Math.PI) / 2),
  sineOut: (t) => Math.sin((t * Math.PI) / 2),
  sineInOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  power1In: (t) => t * t,
  power1Out: (t) => 1 - (1 - t) * (1 - t),
  power1InOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  power2Out: (t) => 1 - Math.pow(1 - t, 3),
  power2InOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  power3Out: (t) => 1 - Math.pow(1 - t, 4),
  power3InOut: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  expoOut: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  expoInOut: (t) => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  backOut: (t, s = c1) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  backOutStrong: (t) => Ease.backOut(t, 2.4),
  elasticOut: (t) => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
};

const active = new Set();
// on the requestAnimationFrame clock from the start, so a tween made before the first frame does not count from 0 and finish at once
let now = (globalThis.performance?.now() ?? 0) / 1000;

class Tween {
  constructor(target, props, opts) {
    this.target = target;
    this.props = props;
    this.duration = opts.duration ?? 0.6;
    this.delay = opts.delay ?? 0;
    this.ease = opts.ease ?? Ease.power2InOut;
    this.onUpdate = opts.onUpdate;
    this.onComplete = opts.onComplete;
    this.onStart = opts.onStart;
    this.start = now + this.delay;
    this.from = null;
    this.done = false;
    this.started = false;
    this.killed = false;
  }
  tick(t) {
    if (this.killed) return true;
    if (t < this.start) return false;
    if (!this.started) {
      this.started = true;
      this.from = {};
      for (const k in this.props) {
        const v = this.target[k];
        this.from[k] = Array.isArray(v) || ArrayBuffer.isView(v) ? Array.from(v) : v;
      }
      this.onStart?.();
    }
    const p = this.duration <= 0 ? 1 : Math.min(1, (t - this.start) / this.duration);
    const e = this.ease(p);
    for (const k in this.props) {
      const a = this.from[k], b = this.props[k];
      if (Array.isArray(a)) {
        const tv = this.target[k];
        for (let i = 0; i < a.length; i++) tv[i] = a[i] + (b[i] - a[i]) * e;
      } else {
        this.target[k] = a + (b - a) * e;
      }
    }
    this.onUpdate?.(e, p);
    if (p >= 1) { this.done = true; this.onComplete?.(); return true; }
    return false;
  }
  kill() { this.killed = true; active.delete(this); }
}

export const tween = {
  to(target, props, opts = {}) {
    const t = new Tween(target, props, opts);
    active.add(t);
    return t;
  },
  killOf(target) {
    for (const t of active) if (t.target === target) t.kill();
  },
  delayed(seconds, fn) {
    const t = new Tween({}, {}, { duration: 0, delay: seconds, onComplete: fn });
    active.add(t);
    return t;
  },
  // absolute time, so motion is frame-rate independent; a callback that throws drops its own tween, not the whole loop
  update(time) {
    now = time;
    for (const t of active) { let end = true; try { end = t.tick(time); } catch (e) { console.error(e); } if (end) active.delete(t); }
  },
  get now() { return now; },
};
