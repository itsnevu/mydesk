// The desk cat: a ginger tabby who lives on the front left of the desk, with her bed and her two bowls. She is built from parts
// that move (a body that pitches, a head that turns, ears, four legs with knees, an eight-joint tail) and she keeps her own day:
// she walks about the desk, sits and looks around, washes a paw, lies down like a loaf, eats when there is food, and sleeps curled
// in her bed. Point at her and she looks at you and purrs; click her and she reacts to what she was doing (a sleeper wakes and
// stretches, a cat who is poked again and again flattens her ears, puffs her tail and runs to bed). Click the bowl to fill it and
// she comes to eat; click the bed and she goes to sleep.
// Built in "cat units" (her body is 1 long, the ground is y 0) and scaled onto the desk.
import { Node, Mesh, Material, Texture } from 'engine/scene';
import { box, cylinder, sphere, cone, torus } from 'engine/geometry';
import { color } from 'engine/math';
import { audio } from 'app/audio';

const K = 8.5;                                   // cat units to desk units: about 8.5 long nose to rump, 7 tall at the ears
const DESK_Y = 0;                                // the desk's top
// where she goes (desk x, z), and which places lead to which: the free front of the desk, left of the keyboard and under it
const BED = [-22, 15.5], BOWL = [-12.5, 17.5], WATER = [-9.3, 18.2];
const SPOTS = { bed: [-22, 12.2], bowl: [-12.5, 14.2], a: [-27, 9], b: [-4, 15], c: [5, 15.5], d: [9, 13.5], e: [-6, 20.5], f: [2, 20.8], g: [-17, 20] };

const mats = new Map();
const M = (k, o) => { if (!mats.has(k)) mats.set(k, new Material(o)); return mats.get(k); };
function put(parent, geo, mat, pos, rot, scale) { const m = new Mesh(geo, mat); m.position = pos || [0, 0, 0]; if (rot) m.rotation = rot; if (scale) m.scale = scale; parent.add(m); return m; }
const node = (parent, pos, rot) => { const n = new Node(); n.position = pos || [0, 0, 0]; if (rot) n.rotation = rot; parent.add(n); return n; };

// the coat: ginger with darker rings round the body and a cream belly (the body spheres lie along z, so their latitude rings are stripes)
function tabby() {
  // (u runs round the body: the belly is at u 0.25, the spine at 0.75; v runs nose to tail) the stripes come down from the spine
  // and thin out on the flanks, never reaching the cream belly
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const c = cv.getContext('2d');
  c.fillStyle = '#c9773a'; c.fillRect(0, 0, 256, 256);
  const back = c.createLinearGradient(0, 0, 256, 0); back.addColorStop(0.55, 'rgba(150,72,28,0)'); back.addColorStop(0.75, 'rgba(150,72,28,0.35)'); back.addColorStop(0.95, 'rgba(150,72,28,0)');
  c.fillStyle = back; c.fillRect(0, 0, 256, 256);   // a darker saddle along the spine
  for (let i = 0; i < 7; i++) {
    const v = 50 + i * 26 + (i % 2) * 4;
    for (const side of [-1, 1]) {
      c.beginPath(); c.moveTo(192, v - 5); c.quadraticCurveTo(192 + side * 26, v + 2, 192 + side * 46, v + 10 + (i % 3) * 3); c.quadraticCurveTo(192 + side * 26, v + 6, 192, v + 3); c.closePath();
      c.fillStyle = 'rgba(118,54,20,0.55)'; c.fill();
    }
  }
  const g = c.createLinearGradient(0, 0, 256, 0); g.addColorStop(0.06, 'rgba(240,226,200,0)'); g.addColorStop(0.17, 'rgba(240,226,200,1)'); g.addColorStop(0.33, 'rgba(240,226,200,1)'); g.addColorStop(0.44, 'rgba(240,226,200,0)');
  c.fillStyle = g; c.fillRect(0, 0, 256, 256);
  return new Texture(cv, {});
}

// ---------- poses: every joint as a number, blended from one to the next
//  y: body height, p: body pitch (negative lifts the front), hx/hy: head pitch/yaw, fu/fl: front legs (upper/lower), bu/bl: back legs,
//  tu: tail lift, tc: tail curl, eye: eyes open (0 closed), ear: ears back (1 flat)
const POSE0 = { ny: 0, nd: 0 };
const POSE = {
  stand: { y: 0.37, p: 0, hx: 0, hy: 0, fu: 0, fl: 0, bu: 0, bl: 0, tu: 1, tc: 0.15, eye: 1, ear: 0 },
  sit: { y: 0.28, p: -0.6, hx: -0.15, hy: 0, fu: 0.6, fl: 0, bu: 1.25, bl: -2.2, tu: 0.1, tc: 0.9, eye: 1, ear: 0 },
  loaf: { y: 0.17, p: 0, hx: -0.05, hy: 0, fu: -1.35, fl: 2.6, bu: 1.4, bl: -2.7, tu: 0, tc: 1, eye: 0.8, ear: 0 },
  sleep: { y: 0.16, p: 0.05, hx: 0.35, hy: 0.5, ny: 1.1, nd: 0.55, fu: -1.4, fl: 2.7, bu: 1.45, bl: -2.7, tu: 0, tc: 1.6, eye: 0, ear: 0.15 },
  eat: { y: 0.34, p: 0.22, hx: 0.85, hy: 0, fu: -0.25, fl: 0.15, bu: 0.1, bl: -0.2, tu: 0.6, tc: 0.25, eye: 0.6, ear: 0 },
  groom: { y: 0.28, p: -0.6, hx: 0.55, hy: 0.35, fu: 0.6, fl: 0, bu: 1.25, bl: -2.2, tu: 0.1, tc: 0.9, eye: 0.3, ear: 0 },
  angry: { y: 0.4, p: 0, hx: -0.1, hy: 0, fu: 0, fl: 0, bu: 0, bl: 0, tu: 1.4, tc: -0.2, eye: 1, ear: 1 },
  stretch: { y: 0.3, p: 0.35, hx: -0.3, hy: 0, fu: -0.9, fl: 0, bu: 0.15, bl: 0, tu: 1.3, tc: 0.1, eye: 0.4, ear: 0 },
};
for (const k in POSE) POSE[k] = { ...POSE0, ...POSE[k] };

/** Build the cat, her bed and her bowls. Returns { root, hits: { cat, bed, bowl }, update(dt, t, cam), poke(), feed(), toBed() }. */
export function buildCat() {
  const root = new Node('cat-corner');
  // ---------- her bed: a round cushion with a rolled rim, a knitted blanket over one side
  {
    const b = node(root, [BED[0], DESK_Y, BED[1]]);
    put(b, cylinder(5.2, 5.4, 0.9, 32), M('bedBase', { color: color('#5a3a26'), roughness: 0.95 }), [0, 0.45, 0]);
    put(b, cylinder(4.3, 4.3, 0.5, 32), M('bedCushion', { color: color('#d9c3a0'), roughness: 1 }), [0, 1.0, 0]);
    put(b, torus(4.7, 0.9, 32, 10), M('bedRim', { color: color('#8a5a34'), roughness: 0.95 }), [0, 1.2, 0]);
    put(b, box(4.4, 0.18, 3), M('blanket', { color: color('#b8622c'), roughness: 1 }), [1.2, 1.32, 1.4], [0, 0.4, 0.05]);
  }
  // ---------- her bowls: food (kibble shows when there is some) and water, on a little mat
  let kibble = null;
  {
    put(root, box(7.6, 0.08, 3.4), M('bowlMat', { color: color('#3b2b1d'), roughness: 1 }), [(BOWL[0] + WATER[0]) / 2, DESK_Y + 0.04, (BOWL[1] + WATER[1]) / 2 + 0.2]);
    const bowl = (x, z, hex) => { const g = node(root, [x, DESK_Y, z]); put(g, cylinder(1.45, 1.05, 0.9, 24), M('bowl' + hex, { color: color(hex), roughness: 0.35, metalness: 0.1 }), [0, 0.53, 0]); put(g, cylinder(1.2, 1.2, 0.06, 24), M('bowlIn', { color: color('#2b1a10'), roughness: 0.6 }), [0, 0.96, 0]); return g; };
    const food = bowl(BOWL[0], BOWL[1], '#d9a05b'), water = bowl(WATER[0], WATER[1], '#e7ddc8');
    put(water, cylinder(1.12, 1.12, 0.04, 24), M('water', { color: [0.55, 0.62, 0.66], roughness: 0.05, metalness: 0.2, fresnel: 0.6, fresnelColor: [1, 0.9, 0.75] }), [0, 0.92, 0]);
    kibble = node(food, [0, 0.95, 0]);
    const kb = M('kibble', { color: color('#7a4a24'), roughness: 0.8 });
    for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 0.25 + (i % 5) * 0.17; put(kibble, sphere(0.16, 6, 4), kb, [Math.cos(a) * r, 0.05 + (i % 3) * 0.06, Math.sin(a) * r], null, [1, 0.7, 1]); }
  }

  // ---------- the cat
  const cat = node(root, [SPOTS.bed[0], DESK_Y, SPOTS.bed[1]]); cat.scale = [K, K, K];
  const fur = M('fur', { color: [1, 1, 1], map: tabby(), roughness: 0.95 }), ginger = M('ginger', { color: color('#c9773a'), roughness: 0.95 }), cream = M('cream', { color: color('#efe2c6'), roughness: 0.95 });
  const pink = M('pink', { color: color('#d98a80'), roughness: 0.7 }), dark = M('catDark', { color: color('#1b120b'), roughness: 0.5 });
  const eyeMat = M('catEye', { color: color('#d9a33a'), emissive: color('#ffb84a'), emissiveIntensity: 0.35, roughness: 0.2 });
  const body = node(cat, [0, 0.37, 0]);
  const blob = (parent, s, pos, mat = fur) => put(parent, sphere(1, 18, 12), mat, pos, mat === fur ? [Math.PI / 2, 0, 0] : null, s);
  blob(body, [0.18, 0.25, 0.17], [0, 0, 0]);           // (rotated: the sphere's z is its y here)
  blob(body, [0.165, 0.15, 0.17], [0, 0.02, 0.15]);
  blob(body, [0.175, 0.16, 0.175], [0, 0.01, -0.15]);
  blob(body, [0.13, 0.2, 0.1], [0, -0.07, 0.02], cream);
  // the head, on a neck that dips to eat
  const neck = node(body, [0, 0.07, 0.2]);
  const head = node(neck, [0, 0.13, 0.07]);
  put(head, sphere(1, 18, 12), ginger, [0, 0, 0], null, [0.125, 0.11, 0.115]);
  put(head, sphere(1, 12, 8), ginger, [0, -0.025, 0.045], null, [0.13, 0.08, 0.08]);
  put(head, sphere(1, 12, 8), cream, [0, -0.045, 0.095], null, [0.058, 0.04, 0.045]);
  put(head, sphere(0.014, 8, 6), pink, [0, -0.02, 0.135]);
  for (let i = 0; i < 4; i++) put(head, box(0.012, 0.03, 0.006), M('stripeHead', { color: color('#7a3a16'), roughness: 0.9 }), [(i - 1.5) * 0.026, 0.085, 0.07], [-0.5, 0, 0]);
  const ears = [], eyes = [];
  for (const s of [-1, 1]) {
    const e = node(head, [s * 0.07, 0.085, -0.005], [0, 0, -s * 0.25]); ears.push(e);
    put(e, cone(0.045, 0.085, 4), ginger, [0, 0.04, 0], [0, Math.PI / 4, 0]);
    put(e, cone(0.028, 0.06, 4), pink, [0, 0.032, 0.012], [0, Math.PI / 4, 0]);
    const ey = node(head, [s * 0.048, 0.018, 0.098]); eyes.push(ey);
    put(ey, sphere(0.024, 10, 8), eyeMat, [0, 0, 0], null, [1, 1, 0.6]);
    put(ey, box(0.007, 0.034, 0.006), dark, [0, 0, 0.014]);
    for (const w of [-0.012, 0.004]) put(head, box(0.09, 0.0025, 0.0025), cream, [s * 0.09, -0.04 + w, 0.095], [0, s * 0.25, s * 0.15]);
  }
  // four legs: a hip or shoulder joint, a knee, a white paw
  const legs = [];
  for (const [x, z, front] of [[-0.085, 0.16, true], [0.085, 0.16, true], [-0.095, -0.16, false], [0.095, -0.16, false]]) {
    const hip = node(body, [x, -0.03, z]);
    put(hip, cylinder(front ? 0.042 : 0.05, 0.036, 0.18, 10), ginger, [0, -0.09, 0]);
    const knee = node(hip, [0, -0.18, 0]); put(knee, sphere(0.036, 8, 6), ginger, [0, 0, 0]);
    put(knee, cylinder(0.034, 0.03, 0.16, 10), ginger, [0, -0.08, 0]);
    put(knee, sphere(1, 10, 8), cream, [0, -0.165, 0.014], null, [0.042, 0.026, 0.05]);
    legs.push({ hip, knee, front, side: x < 0 ? -1 : 1 });
  }
  // the tail: eight joints, thinner to the tip, the last one dark, a ball at each joint so a bent tail stays whole
  const tail = []; let tp = node(body, [0, 0.05, -0.27]);
  for (let i = 0; i < 8; i++) { const j = node(tp, [0, 0, 0]); const tm = i === 7 ? M('tailTip', { color: color('#7a3a16'), roughness: 0.95 }) : ginger; const fur1 = put(j, cylinder(0.036 - i * 0.002, 0.038 - i * 0.002, 0.07, 8), tm, [0, 0.034, 0]), fur2 = put(j, sphere(0.038 - i * 0.002, 8, 6), tm, [0, 0, 0]); j.userData.fur = [fur1, fur2]; tail.push(j); tp = node(j, [0, 0.066, 0]); }
  // zz over a sleeper
  const zz = [];
  for (let i = 0; i < 3; i++) { const z = put(cat, box(0.05, 0.012, 0.01), new Material({ color: [1, 0.9, 0.7], emissive: color('#ffe0b0'), emissiveIntensity: 0.9, opacity: 0, transparent: true, depthWrite: false }), [0, 0.5, 0]); z.castShadow = false; zz.push(z); }

  // ---------- click volumes: her (rides with her), the bed, the bowl
  const HIT = M('catHit', { color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false });
  const hit = (parent, size, pos, keyId) => { const h = put(parent, box(...size), HIT, pos); h.castShadow = false; h.pickable = true; h.userData = { keyId, interactive: true, glow: 0, targetGlow: 0 }; return h; };
  const catHit = hit(cat, [0.42, 0.7, 0.95], [0, 0.38, 0.02], 'cat');
  const bedHit = hit(root, [11, 3, 11], [BED[0], 1.4, BED[1]], 'catbed');
  const bowlHit = hit(root, [7.8, 2.2, 3.6], [(BOWL[0] + WATER[0]) / 2, 1, (BOWL[1] + WATER[1]) / 2], 'catbowl');

  // ---------- sound: a meow (a voice gliding through a formant) and a purr (rumbling noise), both quiet, only with sound on
  const voice = (kind) => {
    const ctx = audio.ctx; if (!ctx || !audio.enabled || ctx.state !== 'running') return null;
    const out = ctx.createGain(); out.connect(audio.sfxGain || ctx.destination); const t = ctx.currentTime;
    if (kind === 'meow' || kind === 'hiss') {
      if (kind === 'hiss') {
        const n = ctx.createBufferSource(), buf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        n.buffer = buf; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500; n.connect(f); f.connect(out);
        out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.12, t + 0.05); out.gain.exponentialRampToValueAtTime(0.001, t + 0.55); n.start(t); n.stop(t + 0.6); return null;
      }
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(760, t + 0.18); o.frequency.linearRampToValueAtTime(430, t + 0.62);
      f.type = 'bandpass'; f.Q.value = 6; f.frequency.setValueAtTime(800, t); f.frequency.linearRampToValueAtTime(1500, t + 0.2); f.frequency.linearRampToValueAtTime(700, t + 0.6);
      f2.type = 'lowpass'; f2.frequency.value = 3200; o.connect(f); f.connect(f2); f2.connect(out);
      out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.1, t + 0.06); out.gain.setValueAtTime(0.1, t + 0.45); out.gain.exponentialRampToValueAtTime(0.001, t + 0.68); o.start(t); o.stop(t + 0.7); return null;
    }
    // purr: low noise, beating at about 25 times a second; it fades in and is stopped by the caller
    const n = ctx.createBufferSource(), buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = buf; n.loop = true; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; const am = ctx.createGain(); am.gain.value = 0.5; const lfo = ctx.createOscillator(); lfo.frequency.value = 25; const lg = ctx.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
    n.connect(lp); lp.connect(am); am.connect(out); out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.16, t + 0.5); n.start(t); lfo.start(t);
    return { stop: () => { const t2 = ctx.currentTime; out.gain.cancelScheduledValues(t2); out.gain.setValueAtTime(out.gain.value, t2); out.gain.linearRampToValueAtTime(0, t2 + 0.4); n.stop(t2 + 0.45); lfo.stop(t2 + 0.45); } };
  };

  // ---------- her day
  const P = { ...POSE.sleep }, rnd = Math.random;
  const st = { mode: 'sleep', until: 12 + rnd() * 10, target: null, then: null, speed: 1, heading: Math.PI * 0.85, phase: 0, food: 1, hunger: 0.2, tired: 0, pokes: [], purr: null, look: 0, blink: 0, startle: 0, angry: 0, fill: 1 };
  cat.position = [BED[0], DESK_Y + 1.25, BED[1]]; cat.rotation[1] = st.heading;
  const at = (k) => (k === 'bed' ? BED : k === 'bowl' ? SPOTS.bowl : SPOTS[k]);
  const go = (k, then, speed = 1) => { st.mode = 'walk'; st.target = k; st.then = then; st.speed = speed; };
  const pick = () => {
    // what next: bed when tired, the bowl when hungry and there is food, otherwise a stroll to somewhere on the desk
    if (st.tired > 1) return go('bed', 'sleep');
    if (st.hunger > 1 && st.food > 0.05) return go('bowl', 'eat');
    const k = Object.keys(SPOTS).filter((s) => s !== 'bed' && s !== 'bowl')[Math.floor(rnd() * 7)];
    go(k, ['sit', 'loaf', 'groom', 'sit', 'look'][Math.floor(rnd() * 5)]);
  };
  const begin = (mode, t) => { st.mode = mode; st.until = t + ({ sleep: 25 + rnd() * 25, eat: 7 + rnd() * 4, sit: 5 + rnd() * 6, loaf: 8 + rnd() * 8, groom: 5 + rnd() * 4, look: 4 + rnd() * 3, stretch: 1.8, angry: 1.4 }[mode] || 4); };
  let now = 0;
  const api = {
    root, hits: { cat: catHit, bed: bedHit, bowl: bowlHit },
    /** a click on her: what happens depends on what she was doing, and on how often she has been poked lately */
    poke() {
      st.pokes = st.pokes.filter((p) => now - p < 4); st.pokes.push(now);
      if (st.pokes.length >= 3) { st.pokes = []; begin('angry', now); voice('hiss'); st.then = 'bed'; return 'angry'; }
      if (st.mode === 'sleep') { begin('stretch', now); st.then = null; voice('meow'); return 'woke'; }
      if (st.mode === 'eat') { st.startle = 1; voice('meow'); return 'eating'; }
      st.startle = 1; voice('meow'); const ks = ['a', 'b', 'c', 'd', 'e', 'f', 'g']; go(ks[Math.floor(rnd() * ks.length)], 'sit', 2.2); return 'ran';
    },
    /** the bowl, filled: she comes to eat (a sleeper only hears it if she isn't deep asleep) */
    feed() { st.food = 1; st.hunger = 1.2; if (st.mode !== 'sleep' || rnd() < 0.6) go('bowl', 'eat', 1.4); return st.mode; },
    /** off to bed */
    toBed() { st.tired = 1.2; go('bed', 'sleep', 1); },
    get mode() { return st.mode; },
    /** (for checking her poses) hold one where she stands */
    pose(mode, secs = 30) { begin(mode, now); st.until = now + secs; },
  };
  const lerp = (a, b, k) => a + (b - a) * k;
  api.update = (dt, t, cam) => {
    now = t; dt = Math.min(dt, 0.05);
    st.hunger += dt / 70; st.tired += dt / 120;
    // hovered: she looks at you and purrs
    const hovered = catHit.userData.targetGlow > 0.5;
    if (hovered && !st.purr) st.purr = voice('purr'); else if (!hovered && st.purr) { st.purr.stop(); st.purr = null; }
    let pose = POSE.stand, moving = false;
    if (st.mode === 'walk') {
      const tgt = st.target === 'bed' ? BED : at(st.target), dx = tgt[0] - cat.position[0], dz = tgt[1] - cat.position[2], d = Math.hypot(dx, dz);
      const want = Math.atan2(dx, dz); let dh = want - st.heading; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      st.heading += Math.sign(dh) * Math.min(Math.abs(dh), dt * 3.5 * st.speed);
      const v = (Math.abs(dh) > 1.2 ? 1.5 : 6.5) * st.speed * (d < 2 ? Math.max(0.3, d / 2) : 1);
      cat.position[0] += Math.sin(st.heading) * v * dt; cat.position[2] += Math.cos(st.heading) * v * dt;
      st.phase += (v * dt) / (0.55 * K) * Math.PI * 2; moving = true;
      // into the bed (a little step up onto the cushion), out of it
      const inBed = Math.hypot(cat.position[0] - BED[0], cat.position[2] - BED[1]) < 4.2;
      cat.position[1] = lerp(cat.position[1], DESK_Y + (inBed ? 1.25 : 0), 1 - Math.exp(-8 * dt));
      if (d < 0.35) { const th = st.then; if (th === 'sleep') { st.tired = 0; begin('sleep', t); } else if (th === 'eat') begin('eat', t); else begin(th || 'sit', t); if (th === 'eat') st.heading = Math.atan2(BOWL[0] - cat.position[0], BOWL[1] - cat.position[2]); }
    } else {
      pose = POSE[st.mode === 'look' ? 'sit' : st.mode] || POSE.sit;
      if (st.mode === 'eat') { st.food = Math.max(0, st.food - dt / 9); st.hunger = Math.max(0, st.hunger - dt / 5); }
      if (t > st.until) {
        if (st.mode === 'angry') go('bed', 'sleep', 2.6);
        else if (st.mode === 'stretch') pick();
        else if (st.mode === 'sleep') { st.tired = 0; begin('stretch', t); }
        else pick();
      }
      if (st.mode === 'sleep' || st.mode === 'loaf') cat.position[1] = lerp(cat.position[1], DESK_Y + (Math.hypot(cat.position[0] - BED[0], cat.position[2] - BED[1]) < 4.2 ? 1.25 : 0), 1 - Math.exp(-4 * dt));
    }
    // the blend toward this moment's pose, then the moving parts on top of it
    const k = 1 - Math.exp(-(st.mode === 'angry' || st.startle > 0.5 ? 14 : 4) * dt);
    for (const key in P) P[key] = lerp(P[key], pose[key], k);
    st.startle = Math.max(0, st.startle - dt * 2.2);
    const hop = Math.sin(Math.min(1, (1 - st.startle)) * Math.PI) * (st.startle > 0 ? 0.25 : 0);
    const breathe = st.mode === 'sleep' ? Math.sin(t * 1.4) * 0.006 : Math.sin(t * 2.4) * 0.003;
    body.position[1] = P.y + breathe + hop + (moving ? Math.abs(Math.sin(st.phase)) * 0.012 : 0);
    body.rotation[0] = P.p;
    body.scale = st.mode === 'angry' ? [1.12, 1.1, 1] : [1, 1, 1];
    // the head: where her pose puts it, turned toward you when you point at her (or now and then when she sits and looks)
    let hy = P.hy, hx = P.hx;
    if ((hovered || st.mode === 'look') && cam && st.mode !== 'sleep') {
      const wp = cat.getWorldPosition([0, 0, 0]), a = Math.atan2(cam[0] - wp[0], cam[2] - wp[2]) - st.heading;
      hy = Math.max(-1.1, Math.min(1.1, Math.atan2(Math.sin(a), Math.cos(a)))); hx = -0.25;
    } else if (st.mode === 'sit' || st.mode === 'loaf') hy += Math.sin(t * 0.37) * 0.6 * Math.max(0, Math.sin(t * 0.13));
    st.look = lerp(st.look, hy, 1 - Math.exp(-5 * dt));
    neck.rotation[0] = st.mode === 'eat' ? 0.9 + Math.sin(t * 7) * 0.08 : P.nd; neck.rotation[1] = P.ny; head.rotation = [hx - P.p - (st.mode === 'eat' ? 0.7 : 0), st.look, st.mode === 'sleep' ? 0.25 : 0];
    // ears: back when cross, a twitch now and then
    const tw = Math.max(0, Math.sin(t * 0.9 + 1) - 0.97) * 12;
    ears.forEach((e, i) => { const s = i ? 1 : -1; e.rotation = [P.ear * -0.9 + (i ? tw : 0) * 0.3, 0, -s * (0.25 + P.ear * 0.7)]; });
    // eyes: their pose's openness, and a blink every few seconds
    st.blink = (t % 4.3) < 0.12 ? 0.1 : 1;
    for (const e of eyes) e.scale = [1, Math.max(0.08, P.eye * st.blink), 1];
    // legs: the gait while walking (diagonal pairs together), the pose's angles otherwise; a raised paw to wash
    legs.forEach((l, i) => {
      const off = (i === 0 || i === 3) ? 0 : Math.PI, s = Math.sin(st.phase + off), w = moving ? 1 : 0;
      let up = (l.front ? P.fu : P.bu) + w * s * 0.55, lo = (l.front ? P.fl : P.bl) + w * Math.max(0, -s) * (l.front ? 0.7 : -0.9);
      if (st.mode === 'groom' && l.front && l.side > 0) { up = -1.3 + Math.sin(t * 5) * 0.1; lo = 1.6; }
      if (st.mode === 'stretch' && l.front) { up = -1.1; lo = 0; }
      l.hip.rotation[0] = up; l.knee.rotation[0] = lo;
    });
    // the tail: lifted when she walks or is cross (puffed), curled round her when she sits or sleeps, always a little alive
    tail.forEach((j, i) => {
      const f = i / 7, wave = Math.sin(t * (st.mode === 'angry' ? 9 : 2.2) - i * 0.6) * (0.12 + f * 0.25) * (st.mode === 'sleep' ? 0.25 : 1);
      j.rotation = [i === 0 ? -2.0 + P.tu * 1.25 : -0.1 * P.tu + 0.06, 0, (P.tc * 0.34 + wave) * (i ? 1 : 0.4)];   // (each joint bends about z: the segments run along y)
      const puff = st.mode === 'angry' ? 1.7 : 1; for (const f of j.userData.fur) f.scale = [puff, 1, puff];   // (the fur puffs, not the joint: a scaled joint would carry on into the next)
    });
    // zz drifting up from a sleeper
    zz.forEach((z, i) => { const ph = (t * 0.35 + i / 3) % 1, on = st.mode === 'sleep' ? 1 : 0; z.position = [0.1 + ph * 0.12, 0.45 + ph * 0.35, 0.25]; z.material.opacity = on * 0.8 * Math.sin(ph * Math.PI); });
    cat.rotation[1] = st.heading;
    kibble.visible = st.food > 0.05; kibble.scale = [1, Math.max(0.2, st.food), 1];
  };
  return api;
}
