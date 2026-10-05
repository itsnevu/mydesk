// The cat: a real tabby (a photo-textured scan, public/cat/cat.bin + cat.jpg, from "Medium poly Cat In Motion 3d Model Free" by
// iRahulRajput on Sketchfab, CC BY 4.0), life-size (≈ 41 cm nose to rump), asleep on the desk chair, curled up on her side.
// Her food and water stand on a little wooden feeder on the floor to the left of the chair. Click her and she wakes, rolls up
// onto her feet, stretches, jumps down, walks over to her bowl and eats; then she goes back, jumps up onto the chair and sleeps.
// The scan came as one static mesh in a walking pose, so she is rigged here: a pelvis and a chest that bend the spine, a neck
// and a head, a two-joint tail and four legs with a knee each. Every vertex is weighted to those bones by where it lies on the
// body (legs by the line each leg traces from paw to hip), and the mesh is skinned on the CPU each frame she moves.
// Model space: +x is forward (nose ≈ 0.5, rump ≈ -0.33), y is up (paws at 0), z is to her right; 1 model unit ≈ S room units.
import { Node, Mesh, Material, Texture } from 'engine/scene';
import { box, cylinder, sphere, torus } from 'engine/geometry';
import { color } from 'engine/math';
import { audio } from 'app/audio';

const S = 26;                                     // model units to room units: 1 unit ≈ 1.9 cm, so nose to rump ≈ 21.6 ≈ 41 cm
const FLOOR = -40 + 0.35;                         // the floor, on the rug
// the chair (app/room: at [10, FLOOR, 35], turned 0.32): its seat cushion's top, a little behind the middle of the seat
const CHAIR_RY = 0.32, SEAT = [10 - Math.sin(CHAIR_RY) * 1.5, -40 + 23.2, 35 - Math.cos(CHAIR_RY) * 1.5];
// she sleeps with her back to the backrest, her paws toward the desk; she jumps down and up on the chair's left
const SLEEP_RY = CHAIR_RY + Math.PI, TAKEOFF = [-9, FLOOR, 41];
// her feeder: food and water on a low wooden stand, on the floor left of the chair, its long side toward the room
const FEEDER = [-27, FLOOR, 37], FEEDER_RY = 0.25, STAND_H = 3.6;

const mats = new Map();
const M = (k, o) => { if (!mats.has(k)) mats.set(k, new Material(o)); return mats.get(k); };
function put(parent, geo, mat, pos, rot, scale) { const m = new Mesh(geo, mat); m.position = pos || [0, 0, 0]; if (rot) m.rotation = rot; if (scale) m.scale = scale; parent.add(m); return m; }

// ---------- the rig (model space). Leg lines are traced from the scan: paw, knee (or elbow / hock), top of the leg.
const LEGS = [
  { name: 'BL', side: -1, back: true, line: [[-0.26, 0.03], [-0.30, 0.20], [-0.27, 0.36]], z: -0.075, rest: -0.03 },
  { name: 'BR', side: 1, back: true, line: [[-0.08, 0.02], [-0.19, 0.20], [-0.24, 0.36]], z: 0.075, rest: 0.24 },
  { name: 'FL', side: -1, back: false, line: [[0.39, 0.02], [0.275, 0.22], [0.31, 0.36]], z: -0.07, rest: 0.39 },
  { name: 'FR', side: 1, back: false, line: [[0.15, 0.02], [0.105, 0.20], [0.085, 0.36]], z: 0.075, rest: 0.11 },
];
// bones: [pivot, parent]; legs follow as upper (pivot at the top of the leg) and lower (pivot at the knee)
const B = { pelvis: 0, chest: 1, neck: 2, head: 3, tail1: 4, tail2: 5 };
const BONES = [
  { p: [-0.12, 0.42, 0], parent: -1 }, { p: [0.12, 0.42, 0], parent: -1 },
  { p: [0.25, 0.44, 0], parent: 1 }, { p: [0.36, 0.48, 0], parent: 2 },
  { p: [-0.34, 0.34, 0.02], parent: 0 }, { p: [-0.42, 0.29, 0.03], parent: 4 },
];
for (const l of LEGS) {
  l.up = BONES.length; BONES.push({ p: [l.line[2][0], l.line[2][1], l.z], parent: l.back ? B.pelvis : B.chest });
  l.lo = BONES.length; BONES.push({ p: [l.line[1][0], l.line[1][1], l.z], parent: l.up });
}
const NB = BONES.length;

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// where a leg's centre line is (its x) at height y
const legX = (l, y) => { const [f, k, t] = l.line; if (y <= k[1]) return f[0] + (k[0] - f[0]) * Math.max(0, (y - f[1]) / (k[1] - f[1])); return k[0] + (t[0] - k[0]) * Math.min(1, (y - k[1]) / (t[1] - k[1])); };

/** Weights for every vertex: up to four (bone, weight) pairs each. */
function weigh(pos) {
  const n = pos.length / 3, bi = new Uint8Array(n * 4), bw = new Float32Array(n * 4), w = new Float32Array(NB);
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    w.fill(0);
    // the spine: pelvis to chest, then the neck and the head (only above the chest's underside), the tail behind the rump
    const t = smooth(-0.1, 0.12, x), nk = smooth(0.2, 0.3, x) * smooth(0.3, 0.38, y), hd = smooth(0.33, 0.4, x);
    const tl = smooth(-0.345, -0.395, x) * smooth(0.16, 0.22, y) * smooth(0.075, 0.045, Math.abs(z - 0.025)), tl2 = smooth(-0.42, -0.47, x);   // (narrow: the rump either side stays on the pelvis)
    w[B.pelvis] = 1 - t; w[B.chest] = t * (1 - nk); w[B.neck] = t * nk * (1 - hd); w[B.head] = t * nk * hd;
    for (let k = 0; k < 6; k++) w[k] *= 1 - tl;
    w[B.tail1] = tl * (1 - tl2); w[B.tail2] = tl * tl2;
    // a leg: the nearest leg line on her side of the body, full weight below the belly, fading into the body above it
    let best = null, bd = 1;
    if (Math.abs(z) > 0.012 && y < 0.37) for (const l of LEGS) { if (Math.sign(z) !== l.side) continue; const d = Math.abs(x - legX(l, y)); if (d < bd) { bd = d; best = l; } }
    if (best) {
      const lw = smooth(0.36, 0.27, y) * smooth(0.095, 0.065, bd);
      if (lw > 0) {
        for (let k = 0; k < NB; k++) w[k] *= 1 - lw;
        const lo = smooth(best.line[1][1] + 0.035, best.line[1][1] - 0.035, y);
        w[best.up] += lw * (1 - lo); w[best.lo] += lw * lo;
      }
    }
    // keep the four largest
    const order = [...w.keys()].sort((a, b) => w[b] - w[a]).slice(0, 4); let sum = 0;
    for (const k of order) sum += w[k];
    order.forEach((k, j) => { bi[i * 4 + j] = k; bw[i * 4 + j] = w[k] / (sum || 1); });
  }
  return { bi, bw };
}

// rotation (x, then y, then z) as a 3x3, row major
function rot3(ax, ay, az, out) {
  const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az);
  // Rz * Ry * Rx
  out[0] = cz * cy; out[1] = cz * sy * sx - sz * cx; out[2] = cz * sy * cx + sz * sx;
  out[3] = sz * cy; out[4] = sz * sy * sx + cz * cx; out[5] = sz * sy * cx - cz * sx;
  out[6] = -sy; out[7] = cy * sx; out[8] = cy * cx;
  return out;
}

/** The scan: 'KCAT', vertex and index counts, the position bounds, then quantised positions, uvs, normals and indices. */
async function loadScan() {
  const buf = await fetch('cat/cat.bin').then((r) => { if (!r.ok) throw new Error('cat ' + r.status); return r.arrayBuffer(); });
  const dv = new DataView(buf); let o = 4;
  const n = dv.getUint32(o, true), ni = dv.getUint32(o + 4, true); o += 8;
  const mn = [0, 1, 2].map((k) => dv.getFloat32(o + k * 4, true)), mx = [0, 1, 2].map((k) => dv.getFloat32(o + 12 + k * 4, true)); o += 24;
  const q = new Uint16Array(buf, o, n * 3); o += n * 6;
  const qu = new Uint16Array(buf.slice(o, o + n * 4)); o += n * 4;
  const qn = new Int8Array(buf, o, n * 3); o += n * 3; o += (4 - (o % 4)) % 4;
  const indices = new Uint16Array(buf.slice(o, o + ni * 2));
  const rest = new Float32Array(n * 3), nrest = new Float32Array(n * 3), uvs = new Float32Array(n * 2);
  for (let i = 0; i < n * 3; i++) { const k = i % 3; rest[i] = mn[k] + (q[i] / 65535) * (mx[k] - mn[k]); nrest[i] = qn[i] / 127; }
  for (let i = 0; i < n * 2; i++) uvs[i] = qu[i] / 65535;
  return { n, rest, nrest, uvs, indices };
}
const loadImage = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });

// ---------- poses: each a set of joint angles (radians), blended from one to the next
//  roll: lying on her side (1), curl: the spine rounded (pelvis and chest turn toward each other), lift: body height offset,
//  nk/hd: neck and head pitch (negative: down), hy: head turn, t1/t2: tail (pitch), tz: tail sideways,
//  legs: each leg's angle from straight down (positive: paw forward) and its lower joint's bend
const POSE = {
  stand: { roll: 0, curl: 0, lift: 0, ch: 0, pv: 0, nk: 0, hd: 0, hy: 0, hr: 0, t1: 0.25, t2: 0.15, tz: 0, lBL: 0.02, lBR: 0.05, lFL: 0.12, lFR: 0.1, kBL: 0, kBR: 0, kFL: 0, kFR: 0 },
  sleep: { roll: 1, curl: 0.6, lift: 0, ch: 0, pv: 0, nk: -0.5, hd: -0.3, hy: 0.1, hr: 0.15, t1: 0.7, t2: 0.8, tz: 0, lBL: 0.55, lBR: 0.5, lFL: 0.3, lFR: 0.25, kBL: -1.1, kBR: -1.0, kFL: -1.6, kFR: -1.4 },
  stretch: { roll: 0, curl: -0.12, lift: -0.02, ch: -0.18, pv: 0.06, nk: 0.3, hd: 0.15, hy: 0, hr: 0, t1: 0.9, t2: 0.3, tz: 0, lBL: -0.15, lBR: -0.05, lFL: 0.85, lFR: 0.8, kBL: 0, kBR: 0, kFL: -0.1, kFR: -0.1 },
  crouch: { roll: 0, curl: 0.1, lift: -0.05, ch: 0.05, pv: 0, nk: 0.15, hd: 0, hy: 0, hr: 0, t1: 0.4, t2: 0.1, tz: 0, lBL: 0.35, lBR: 0.35, lFL: 0.15, lFR: 0.15, kBL: -0.7, kBR: -0.7, kFL: 0.5, kFR: 0.5 },
  leap: { roll: 0, curl: -0.1, lift: 0, ch: 0, pv: 0, nk: 0.1, hd: 0, hy: 0, hr: 0, t1: 0.5, t2: 0.2, tz: 0, lBL: -0.6, lBR: -0.5, lFL: 0.7, lFR: 0.6, kBL: 0.2, kBR: 0.2, kFL: -0.2, kFR: -0.2 },
  eat: { roll: 0, curl: 0.05, lift: -0.03, ch: -0.22, pv: 0, nk: -0.75, hd: -0.3, hy: 0, hr: 0, t1: 0.15, t2: 0.4, tz: 0.3, lBL: 0.12, lBR: 0.15, lFL: 0.3, lFR: 0.28, kBL: -0.2, kBR: -0.2, kFL: 0.25, kFR: 0.25 },
  sit: { roll: 0, curl: 0.05, lift: -0.02, ch: 0, pv: 0, nk: 0.1, hd: 0, hy: 0, hr: 0, t1: 0.05, t2: 0.6, tz: 0.6, lBL: 0.02, lBR: 0.05, lFL: 0.12, lFR: 0.1, kBL: 0, kBR: 0, kFL: 0, kFR: 0 },
};
const KEYS = Object.keys(POSE.stand);

/** Build the cat and her feeder. Returns { root, hits: { cat, bowl }, update(dt, t, cam), poke(), feed(), get mode, dimmable }. */
export function buildCat() {
  const root = new Node('cat-corner');
  const dimmable = [];
  const furn = (k, hex, o = {}) => { const c = color(hex), m = M(k, { roughness: 0.8, receiveShadow: true, ...o, color: c, emissive: c.map((v) => v * (o.amb ?? 0.45)) }); dimmable.push(m); return m; };

  // ---------- the feeder: a low walnut stand with two bowls let into it (food, water) on a little mat
  let kibble;
  {
    const f = new Node('cat-feeder'); f.position = FEEDER; f.rotation = [0, FEEDER_RY, 0]; root.add(f);
    put(f, box(22, 0.15, 11), furn('feedMat', '#3a2c20', { roughness: 1, amb: 0.35 }), [0, 0.08, 0]);
    const wood = furn('feedWood', '#6b4426', { roughness: 0.55, amb: 0.5 });
    put(f, box(17, 0.8, 7.4), wood, [0, STAND_H - 0.4, 0]);
    for (const sx of [-1, 1]) put(f, box(1.2, STAND_H - 0.8, 6.6), wood, [sx * 7.6, (STAND_H - 0.8) / 2 + 0.15, 0]);
    const bowl = (x, hex) => { const g = new Node(); g.position = [x, STAND_H, 0]; f.add(g); put(g, cylinder(3, 2.2, 1.9, 32), furn('bowl' + hex, hex, { roughness: 0.25, metalness: 0.1, amb: 0.55 }), [0, 0.4, 0]); put(g, torus(2.95, 0.18, 32, 6), furn('bowlRim' + hex, hex, { roughness: 0.25, amb: 0.55 }), [0, 1.35, 0]); put(g, cylinder(2.55, 2.55, 0.08, 32), furn('bowlIn', '#2b1a10', { roughness: 0.6, amb: 0.3 }), [0, 0.95, 0]); return g; };
    const food = bowl(-3.9, '#d9a05b'), water = bowl(3.9, '#e7ddc8');
    put(water, cylinder(2.5, 2.5, 0.05, 32), M('catWater', { color: [0.5, 0.58, 0.62], emissive: [0.12, 0.14, 0.16], roughness: 0.05, metalness: 0.2, fresnel: 0.6, fresnelColor: [1, 0.9, 0.75] }), [0, 1.15, 0]);
    kibble = new Node(); kibble.position = [0, 1.05, 0]; food.add(kibble);
    const kb = furn('kibble', '#7a4a24', { amb: 0.4 });
    for (let i = 0; i < 44; i++) { const a = i * 2.4, r = 0.4 + (i % 6) * 0.36; put(kibble, sphere(0.34, 6, 4), kb, [Math.cos(a) * r, 0.1 + (i % 3) * 0.12, Math.sin(a) * r], null, [1, 0.7, 1]); }
  }
  // where she stands to eat: her paws ≈ 0.43 model units behind her nose, facing the food bowl
  const foodAt = (() => { const c = Math.cos(FEEDER_RY), s = Math.sin(FEEDER_RY); return [FEEDER[0] + -3.9 * c, FEEDER[2] - -3.9 * s]; })();
  const EAT_SPOT = [foodAt[0] + 0.44 * S * Math.cos(0.35), foodAt[1] + 0.44 * S * Math.sin(0.35)];

  // ---------- the cat: a node on the floor under her (turned to her heading), a body that rolls when she lies on her side
  const cat = new Node('cat'); cat.scale = [S, S, S]; root.add(cat);
  const body = new Node('cat-body'); cat.add(body);
  const HIT = M('catHit', { color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false });
  const hit = (parent, size, pos, keyId) => { const h = put(parent, box(...size), HIT, pos); h.castShadow = false; h.pickable = true; h.userData = { keyId, interactive: true, glow: 0, targetGlow: 0 }; return h; };
  const catHit = hit(body, [0.86, 0.6, 0.3], [0.04, 0.3, 0], 'cat');
  const bowlHit = hit(root, [19, STAND_H + 3, 9], [FEEDER[0], FEEDER[1] + (STAND_H + 3) / 2, FEEDER[2]], 'catbowl'); bowlHit.rotation = [0, FEEDER_RY, 0];

  // the scan arrives a moment later; until then there is nothing to draw (the click volume is already in place). (Only over
  // http: the Node smoke test builds the world without a server.)
  let skin = null;
  if (/^https?:$/.test(globalThis.location?.protocol || '')) Promise.all([loadScan(), loadImage('cat/cat.jpg')]).then(([scan, img]) => {
    const { bi, bw } = weigh(scan.rest);
    const geo = { positions: new Float32Array(scan.rest), normals: new Float32Array(scan.nrest), uvs: scan.uvs, indices: scan.indices, bounds: { min: [-0.75, -0.75, -0.75], max: [0.75, 0.9, 0.75] }, dynamic: true, needsUpdate: true };
    const tex = new Texture(img, { flipY: false });
    const fur = new Material({ color: [1, 1, 1], map: tex, emissive: [0.42, 0.42, 0.42], emissiveMap: tex, roughness: 0.92 });
    dimmable.push(fur); api.onMaterial?.(fur);
    const mesh = new Mesh(geo, fur, 'cat-scan'); body.add(mesh);
    skin = { ...scan, bi, bw, geo, mesh, R: new Float32Array(NB * 9), T: new Float32Array(NB * 3), dirty: true };
  }).catch((e) => console.warn('cat: the scan did not load', e));

  // the bones' world transforms from this frame's joint angles, then every vertex moved by its weights
  const rl = new Float32Array(9);
  const angles = new Array(NB).fill(null).map(() => [0, 0, 0]);
  function pose(P) {
    for (const a of angles) a[0] = a[1] = a[2] = 0;
    // the spine: pelvis and chest turn toward each other to round the back (curl), the chest can dip or rise on its own
    angles[B.pelvis][2] = P.curl + P.pv; angles[B.chest][2] = -P.curl + P.ch;
    angles[B.neck][2] = P.nk; angles[B.head] = [P.hr, P.hy, P.hd];
    angles[B.tail1] = [0, P.tz, P.t1 - 0.25]; angles[B.tail2] = [0, P.tz * 0.8, P.t2 - 0.15];
    for (const l of LEGS) { angles[l.up][2] = P['l' + l.name] - l.rest; angles[l.lo][2] = P['k' + l.name]; }
    const { R, T } = skin;
    for (let b = 0; b < NB; b++) {
      const bone = BONES[b], [ax, ay, az] = angles[b]; rot3(ax, ay, az, rl);
      const p = bone.p, lt = [p[0] - (rl[0] * p[0] + rl[1] * p[1] + rl[2] * p[2]), p[1] - (rl[3] * p[0] + rl[4] * p[1] + rl[5] * p[2]), p[2] - (rl[6] * p[0] + rl[7] * p[1] + rl[8] * p[2])];
      const o9 = b * 9, o3 = b * 3;
      if (bone.parent < 0) { R.set(rl, o9); T[o3] = lt[0]; T[o3 + 1] = lt[1]; T[o3 + 2] = lt[2]; continue; }
      const q9 = bone.parent * 9, q3 = bone.parent * 3;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) R[o9 + r * 3 + c] = R[q9 + r * 3] * rl[c] + R[q9 + r * 3 + 1] * rl[3 + c] + R[q9 + r * 3 + 2] * rl[6 + c];
        T[o3 + r] = R[q9 + r * 3] * lt[0] + R[q9 + r * 3 + 1] * lt[1] + R[q9 + r * 3 + 2] * lt[2] + T[q3 + r];
      }
    }
    const { rest, nrest, bi, bw, geo, n } = skin, out = geo.positions, nout = geo.normals;
    for (let i = 0; i < n; i++) {
      const i3 = i * 3, i4 = i * 4, x = rest[i3], y = rest[i3 + 1], z = rest[i3 + 2], nx = nrest[i3], ny = nrest[i3 + 1], nz = nrest[i3 + 2];
      let px = 0, py = 0, pz = 0, qx = 0, qy = 0, qz = 0;
      for (let j = 0; j < 4; j++) {
        const w = bw[i4 + j]; if (w === 0) continue;
        const b = bi[i4 + j], o9 = b * 9, o3 = b * 3;
        px += w * (R[o9] * x + R[o9 + 1] * y + R[o9 + 2] * z + T[o3]); py += w * (R[o9 + 3] * x + R[o9 + 4] * y + R[o9 + 5] * z + T[o3 + 1]); pz += w * (R[o9 + 6] * x + R[o9 + 7] * y + R[o9 + 8] * z + T[o3 + 2]);
        qx += w * (R[o9] * nx + R[o9 + 1] * ny + R[o9 + 2] * nz); qy += w * (R[o9 + 3] * nx + R[o9 + 4] * ny + R[o9 + 5] * nz); qz += w * (R[o9 + 6] * nx + R[o9 + 7] * ny + R[o9 + 8] * nz);
      }
      out[i3] = px; out[i3 + 1] = py; out[i3 + 2] = pz;
      const l = Math.hypot(qx, qy, qz) || 1; nout[i3] = qx / l; nout[i3 + 1] = qy / l; nout[i3 + 2] = qz / l;
    }
    geo.needsUpdate = true;
  }

  // ---------- sound: a meow (a voice gliding through a formant) and a purr (rumbling noise), both quiet, only with sound on
  const voice = (kind) => {
    const ctx = audio.ctx; if (!ctx || !audio.enabled || ctx.state !== 'running') return null;
    const out = ctx.createGain(); out.connect(audio.sfxGain || ctx.destination); const t = ctx.currentTime;
    if (kind === 'meow') {
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

  // ---------- her routine. A plan is a list of steps run one after another: hold a pose, turn, walk, jump.
  const P = { ...POSE.sleep };
  const st = { pose: 'sleep', blend: 3, x: SEAT[0], y: SEAT[1], z: SEAT[2], heading: SLEEP_RY, phase: 0, moving: 0, plan: [], step: null, t0: 0, from: null, food: 1, slept: 0, purr: null, look: 0, startle: 0 };
  let now = 0;
  const yawTo = (x, z) => Math.atan2(-(z - st.z), x - st.x);   // her heading toward a point (+x of the model is her nose)
  const run = (steps) => { st.plan = steps; st.step = null; };
  const wakeAndEat = () => run([
    { pose: 'stand', secs: 1.5, blend: 2.2 },        // rolls up onto her feet on the seat
    { pose: 'stretch', secs: 1.6, blend: 3 },
    { pose: 'stand', secs: 0.5, blend: 4 },
    { turn: () => yawTo(TAKEOFF[0], TAKEOFF[2]) },
    { pose: 'crouch', secs: 0.45, blend: 8 },
    { jump: TAKEOFF, secs: 0.62, apex: 4 },
    { pose: 'stand', secs: 0.35, blend: 6 },
    { walk: EAT_SPOT },
    { turn: () => yawTo(foodAt[0], foodAt[1]) },
    { pose: 'eat', secs: 9, blend: 3, eat: true },
    { pose: 'sit', secs: 3, blend: 2.5 },
    { walk: [TAKEOFF[0] - 5, TAKEOFF[2] + 3] },
    { turn: () => yawTo(SEAT[0], SEAT[2]) },
    { pose: 'crouch', secs: 0.5, blend: 8 },
    { jump: SEAT, secs: 0.6, apex: 8 },
    { pose: 'stand', secs: 0.4, blend: 6 },
    { turn: () => SLEEP_RY + 0.0 },
    { pose: 'sleep', secs: 0, blend: 1.4, sleep: true },
  ]);

  const api = {
    root, dimmable, hits: { cat: catHit, bowl: bowlHit },
    /** a click on her: asleep, she wakes and goes to eat; awake, she answers */
    poke() {
      voice('meow'); st.startle = 1;
      if (st.pose === 'sleep' && !st.plan.length) { if (st.slept > 12) st.food = 1; wakeAndEat(); return 'woke'; }
      if (st.step?.eat) return 'eating';
      return 'busy';
    },
    /** her bowl, filled: if she is asleep she wakes up for it */
    feed() { st.food = 1; if (st.pose === 'sleep' && !st.plan.length) { wakeAndEat(); return 'woke'; } return 'awake'; },
    get mode() { return st.step ? (st.step.eat ? 'eat' : st.step.walk ? 'walk' : st.step.jump ? 'jump' : st.pose) : st.pose; },
  };

  const lerp = (a, b, k) => a + (b - a) * k;
  const angle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let frame = 0;
  api.update = (dt, t, cam, camera) => {
    now = t; dt = Math.min(dt, 0.05);
    // the next step of her plan
    if (!st.step && st.plan.length) { st.step = st.plan.shift(); st.t0 = t; st.from = [st.x, st.y, st.z]; if (st.step.pose) { st.pose = st.step.pose; st.blend = st.step.blend; } if (st.step.turn) st.step.to = st.step.turn(); }
    const s = st.step; st.moving = 0;
    if (s) {
      const el = t - st.t0;
      if (s.walk) {
        st.pose = 'stand'; st.blend = 5;
        const dx = s.walk[0] - st.x, dz = s.walk[1] - st.z, d = Math.hypot(dx, dz), want = Math.atan2(-dz, dx), dh = angle(want - st.heading);
        st.heading += Math.sign(dh) * Math.min(Math.abs(dh), dt * 3.2);
        const v = (Math.abs(dh) > 0.9 ? 4 : 17) * Math.min(1, 0.35 + d / 6);
        const step = Math.min(d, v * dt); st.x += Math.cos(st.heading) * step; st.z -= Math.sin(st.heading) * step; st.y = FLOOR;
        st.phase += (step / (0.55 * S)) * Math.PI * 2; st.moving = 1;
        if (d < 0.3) st.step = null;
      } else if (s.turn !== undefined) {
        const dh = angle(s.to - st.heading); st.heading += Math.sign(dh) * Math.min(Math.abs(dh), dt * 2.6);
        st.phase += Math.min(Math.abs(dh), dt * 2.6) * 1.6; st.moving = Math.abs(dh) > 0.02 ? 0.5 : 0;   // she steps round on the spot
        if (Math.abs(dh) < 0.01) st.step = null;
      } else if (s.jump) {
        st.pose = 'leap'; st.blend = 10;
        const k = Math.min(1, el / s.secs), e = k * k * (3 - 2 * k), [fx, fy, fz] = st.from, [tx, ty, tz] = s.jump;
        st.x = lerp(fx, tx, e); st.z = lerp(fz, tz, e); st.y = lerp(fy, ty, k) + Math.sin(k * Math.PI) * s.apex;
        if (k >= 1) st.step = null;
      } else {
        if (s.eat) { st.food = Math.max(0, st.food - dt / s.secs); }
        if (s.sleep) { st.slept = 0; st.plan = []; st.step = null; }
        else if (el > s.secs) st.step = null;
      }
    }
    if (st.pose === 'sleep') st.slept += dt;
    // hovered: she purrs (asleep or awake) and, awake and standing, looks at you
    const hovered = catHit.userData.targetGlow > 0.5;
    if (hovered && !st.purr) st.purr = voice('purr'); else if (!hovered && st.purr) { st.purr.stop(); st.purr = null; }
    // blend toward the pose, the gait and the small life on top of it
    const target = POSE[st.pose] || POSE.stand, k = 1 - Math.exp(-(st.blend || 3) * dt);
    for (const key of KEYS) P[key] = lerp(P[key], target[key], k);
    let look = 0;
    if (hovered && cam && st.pose !== 'sleep' && !st.moving) { const a = angle(Math.atan2(-(cam[2] - st.z), cam[0] - st.x) - st.heading); look = Math.max(-0.9, Math.min(0.9, a)); }
    st.look = lerp(st.look, look, 1 - Math.exp(-4 * dt));
    const Q = { ...P };
    Q.hy += st.look;
    if (st.moving) {
      // walk: a lateral-sequence gait (back left, front left, back right, front right, a quarter apart), each paw lifting as it swings
      const amp = 0.28 * st.moving;
      [['BL', 0], ['FL', Math.PI / 2], ['BR', Math.PI], ['FR', Math.PI * 1.5]].forEach(([nm, off]) => {
        const front = nm[0] === 'F', ph = st.phase + off;
        Q['l' + nm] = (front ? 0.14 : 0.04) + Math.sin(ph) * amp;
        Q['k' + nm] += Math.max(0, Math.cos(ph)) * (front ? -0.55 : 0.5) * st.moving;
      });
      Q.ch += Math.sin(st.phase * 2) * 0.02; Q.hd += Math.sin(st.phase * 2 + 1) * 0.03; Q.tz += Math.sin(st.phase * 0.5) * 0.15;
    }
    if (st.pose === 'eat' && st.step?.eat) { Q.hd += Math.sin(t * 9) * 0.06; Q.nk += Math.sin(t * 4.5) * 0.03; }
    if (st.pose === 'sleep') { Q.curl += Math.sin(t * 1.3) * 0.012; Q.t2 += Math.sin(t * 0.6) * 0.08; }
    else Q.tz += Math.sin(t * 1.1) * 0.12;
    // lying on her side: the body rolls over (her back toward -z) and settles onto the cushion, centred on it
    const roll = P.roll;
    body.rotation = [-roll * Math.PI / 2, 0, 0];
    body.position = [0, roll * 0.125 + Math.sin(roll * Math.PI) * 0.12 + P.lift + (st.moving ? Math.abs(Math.sin(st.phase)) * 0.006 : 0), roll * 0.3];
    cat.position = [st.x, st.y, st.z]; cat.rotation = [0, st.heading, 0];
    // the skin is the one costly part (22k vertices): skipped while Tupac is out of view, and while asleep and settled (only the
    // breath moves) it is redone every third frame
    frame++;
    if (skin) {
      let seen = true;
      if (camera) {
        const p = camera.position, g = camera.target, fx = g[0] - p[0], fy = g[1] - p[1], fz = g[2] - p[2], fl = Math.hypot(fx, fy, fz) || 1;
        const cx = st.x - p[0], cy = st.y + 6 - p[1], cz = st.z - p[2], d = Math.hypot(cx, cy, cz) || 1;
        seen = (cx * fx + cy * fy + cz * fz) / (d * fl) > Math.cos(((camera.fov || 40) * Math.PI) / 180 * 0.5 * Math.max(1, camera.aspect || 1) + 0.35);
      }
      const settled = st.pose === 'sleep' && !hovered && Math.abs(P.roll - 1) < 0.01;
      if (seen && (!settled || frame % 3 === 0)) pose(Q);
    }
    kibble.visible = st.food > 0.04; kibble.scale = [1, Math.max(0.25, st.food), 1];
  };
  return api;
}
