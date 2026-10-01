// A right-handed mouse, sculpted rather than squashed: the body is lofted from cross-sections along its length (a low, round
// nose, a waist, the hump of the palm rest towards the back, a thumb hollow on the left), split into a glossy button half and a
// matte palm half. Details: the split between the buttons and the seam behind them, a ridged rubber wheel with a bronze core in
// its slot, a DPI button, two thumb buttons, a dark sole, and a backlight line on the back.
// 1 unit ≈ 19 mm: about 12 cm long, 6 cm wide, 3.8 cm high. Origin on the desk under the middle; the buttons face -z.
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, cylinder, merge } from 'engine/geometry';
import { drawTexture } from 'engine/textures';
import { M4, color } from 'engine/math';
import { MAT, BACKLIGHTS } from 'app/theme';
import { tube } from 'app/cables';

const L = 6.4, SOLE = 0.16, SPLIT = 0.44;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
// a smooth curve through evenly spaced knots (Catmull-Rom), t in 0..1
const curve = (k) => (t) => { const f = clamp01(t) * (k.length - 1), i = Math.min(Math.floor(f), k.length - 2), u = f - i; const p0 = k[Math.max(i - 1, 0)], p1 = k[i], p2 = k[i + 1], p3 = k[Math.min(i + 2, k.length - 1)]; return 0.5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (3 * p1 - p0 - 3 * p2 + p3) * u * u * u); };
const width = curve([1.3, 1.42, 1.4, 1.36, 1.46, 1.6, 1.58, 1.42, 1.2]);        // half-width from the nose (t = 0) to the tail (t = 1)
const height = curve([0.62, 0.95, 1.22, 1.5, 1.78, 1.98, 1.96, 1.62, 1.0]);   // crown height above the sole
// the ends round off; a shallow thumb hollow runs along the left flank
const ends = (t) => Math.sqrt(1 - (1 - clamp01(t / 0.1)) ** 2) * Math.sqrt(1 - (1 - clamp01((1 - t) / 0.16)) ** 2);
const hollow = (t) => 0.13 * Math.max(0, 1 - ((t - 0.52) / 0.24) ** 2);
const zAt = (t) => -L / 2 + t * L;
// a point on the shell at length t and angle a (0 = right foot, π/2 = crown, π = left foot); the top falls away slightly to the right
function shell(t, a) {
  const e = Math.max(ends(t), 0.04), c = Math.cos(a), s = Math.sin(a), n = 2.5;
  const hw = (c >= 0 ? width(t) : width(t) - hollow(t)) * e;
  const x = hw * Math.sign(c) * Math.abs(c) ** (2 / n), lean = 1 - 0.1 * (x / 1.6);
  return [x, SOLE + height(t) * e * lean * Math.abs(s) ** (2 / n), zAt(t)];
}
const surfaceY = (x, t) => { let lo = 0, hi = Math.PI; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (shell(t, m)[0] > x) lo = m; else hi = m; } return shell(t, (lo + hi) / 2)[1]; };

// raw arrays → geometry, with area-weighted normals shared by every vertex at the same spot (so seams shade smoothly)
function geo(pos, uv, idx) {
  const key = (i) => `${Math.round(pos[i] * 400)},${Math.round(pos[i + 1] * 400)},${Math.round(pos[i + 2] * 400)}`, acc = new Map(), keys = [];
  for (let i = 0; i < pos.length; i += 3) keys.push(key(i));
  for (let k = 0; k < idx.length; k += 3) {
    const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3, u = [pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]], v = [pos[c] - pos[a], pos[c + 1] - pos[a + 1], pos[c + 2] - pos[a + 2]];
    const f = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    for (const p of [a, b, c]) { const s = acc.get(keys[p / 3]); if (s) { s[0] += f[0]; s[1] += f[1]; s[2] += f[2]; } else acc.set(keys[p / 3], [...f]); }
  }
  const nor = keys.flatMap((k) => { const n = acc.get(k); const l = Math.hypot(...n) || 1; return [n[0] / l, n[1] / l, n[2] / l]; });
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i++) { min[i % 3] = Math.min(min[i % 3], pos[i]); max[i % 3] = Math.max(max[i % 3], pos[i]); }
  return { positions: new Float32Array(pos), normals: new Float32Array(nor), uvs: new Float32Array(uv), indices: new Uint16Array(idx), bounds: { min, max } };
}
// the shell between t0 and t1, wound to face outwards (checked against the crown's upward normal)
function loft(t0, t1, rows = 26, cols = 30) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) { pos.push(...shell(t0 + (t1 - t0) * (i / rows), (j / cols) * Math.PI)); uv.push(j / cols, i / rows); }
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const a = i * (cols + 1) + j, b = a + 1, c = a + cols + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = geo(pos, uv, idx), mid = (Math.floor(rows / 2) * (cols + 1) + Math.floor(cols / 2)) * 3;
  if (g.normals[mid + 1] < 0) { for (let k = 0; k < g.indices.length; k += 3) { const x = g.indices[k + 1]; g.indices[k + 1] = g.indices[k + 2]; g.indices[k + 2] = x; } for (let k = 0; k < g.normals.length; k++) g.normals[k] = -g.normals[k]; }
  return g;
}
// the sole: a dark band round the foot of the shell
function skirt(n = 80) {
  const pos = [], uv = [], idx = [], ring = [];
  for (let i = 0; i <= n; i++) { const t = i / n; ring.push(shell(t, 0)); }
  for (let i = n; i >= 0; i--) { const t = i / n; ring.push(shell(t, Math.PI)); }
  ring.forEach(([x, , z], i) => { const k = 0.985; pos.push(x * k, 0, z * k, x * k, SOLE + 0.02, z * k); uv.push(i / ring.length, 0, i / ring.length, 1); });
  for (let i = 0; i < ring.length - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = geo(pos, uv, idx);
  // outward test: a point on the right flank should face +x
  if (g.normals[(Math.floor(n / 2) * 2) * 3] < 0) { for (let k = 0; k < g.indices.length; k += 3) { const x = g.indices[k + 1]; g.indices[k + 1] = g.indices[k + 2]; g.indices[k + 2] = x; } for (let k = 0; k < g.normals.length; k++) g.normals[k] = -g.normals[k]; }
  return g;
}
const ridged = () => drawTexture(64, 64, (ctx, w, h) => { ctx.fillStyle = '#2a2420'; ctx.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 4) { ctx.fillStyle = '#0c0a09'; ctx.fillRect(x, 0, 2, h); } }, { repeat: true });

export function buildMouse() {
  const root = new Node('mouse');
  const soft = (hex, o = {}) => { const c = color(hex); return new Material({ color: c, roughness: 0.55, metalness: 0.05, emissive: c.map((v) => v * 0.35), ...o }); };
  // two-tone: a matte, slightly lighter palm rest; darker, glossy buttons
  const palmMat = soft('#2b241e', { roughness: 0.74 }), keyMat = soft('#141110', { roughness: 0.22, metalness: 0.25 }), dark = soft('#0b0908', { roughness: 0.85 });
  const body = new Mesh(loft(SPLIT, 1), palmMat, 'mouse'); root.add(body);
  const keys = new Mesh(loft(0, SPLIT, 22), keyMat, 'mouse-keys'); root.add(keys);
  const sole = new Mesh(skirt(), dark, 'mouse-sole'); root.add(sole);

  // the split between the two buttons, the seam behind them, and the wheel's slot
  const groove = [];
  // one continuous fine line each, a hair above the shell
  const split = []; for (let i = 0; i <= 10; i++) { const t = 0.015 + (i / 10) * (SPLIT - 0.04); split.push([0, surfaceY(0, t) + 0.012, zAt(t)]); }
  groove.push({ geo: tube(split, 0.026, 6, 4) });
  const seam = []; for (let j = 2; j <= 18; j++) { const p = shell(SPLIT, (j / 20) * Math.PI); seam.push([p[0], p[1] + 0.012, p[2]]); }
  groove.push({ geo: tube(seam, 0.026, 6, 4) });
  const tw = 0.26, wy = surfaceY(0, tw), wz = zAt(tw);
  groove.push({ geo: roundedBox({ w: 0.46, h: 0.24, d: 1.15, r: 0.1, seg: 2 }), m: M4.compose(new Array(16), [0, wy - 0.06, wz], [-0.14, 0, 0], [1, 1, 1]), n: [1, 0, 0, 0, 1, 0, 0, 0, 1] });
  const grooves = new Mesh(merge(groove), dark, 'mouse-grooves'); root.add(grooves);

  // the wheel: ridged rubber with a bronze core; the spin node turns about the axle (x)
  const wheel = new Node('mouse-wheel'); wheel.position = [0, wy - 0.18, wz]; root.add(wheel);   // it stands ≈ 4 mm proud of the shell
  const axle = (r, w, seg) => merge([{ geo: cylinder(r, r, w, seg), m: M4.compose(new Array(16), [0, 0, 0], [0, 0, Math.PI / 2], [1, 1, 1]), n: [0, 1, 0, -1, 0, 0, 0, 0, 1] }]);
  wheel.add(new Mesh(axle(0.4, 0.24, 28), new Material({ color: [1, 1, 1], map: ridged(), mapRepeat: [6, 1], roughness: 0.8, emissive: [0.02, 0.016, 0.013] }), 'mouse-wheel-tyre'));
  wheel.add(new Mesh(axle(0.3, 0.27, 22), new Material({ ...MAT.bronze, emissive: [0.08, 0.05, 0.02] }), 'mouse-wheel-core'));

  // a DPI button behind the wheel, two thumb buttons and a thumb rest on the left flank
  const bits = [];
  const tb = 0.37; bits.push({ geo: roundedBox({ w: 0.32, h: 0.09, d: 0.5, r: 0.04, seg: 2 }), m: M4.compose(new Array(16), [0, surfaceY(0, tb) + 0.02, zAt(tb)], [-0.22, 0, 0], [1, 1, 1]), n: [1, 0, 0, 0, 1, 0, 0, 0, 1] });
  // thumb buttons: two small soft pills high on the left flank, laid along it (their thickness along the flank's normal)
  for (const [t, len] of [[0.41, 0.66], [0.54, 0.58]]) { const p = shell(t, Math.PI * 0.8); bits.push({ geo: roundedBox({ w: 0.14, h: 0.2, d: len, r: 0.07, seg: 3 }), m: M4.compose(new Array(16), [p[0] - 0.04, p[1] + 0.03, p[2]], [0, 0, -0.95], [1, 1, 1]), n: null }); }
  for (const b of bits) if (!b.n) { const m = b.m; b.n = [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]; }
  const buttons = new Mesh(merge(bits), keyMat, 'mouse-buttons'); root.add(buttons);

  // the backlight line across the back of the palm rest (it follows the keyboard's backlight)
  const tl = 0.86, ly = surfaceY(0, tl), slope = Math.atan2(surfaceY(0, tl - 0.02) - surfaceY(0, tl + 0.02), 0.04 * L);
  const glow = new Mesh(box(1.0, 0.03, 0.09), new Material({ color: [0, 0, 0], emissive: color(BACKLIGHTS[0].hex), emissiveIntensity: 0.9, unlit: true }), 'mouse-line');
  glow.position = [0, ly + 0.012, zAt(tl)]; glow.rotation = [slope, 0, 0]; root.add(glow);

  for (const m of [body, keys, sole, grooves, buttons, glow]) m.castShadow = true;
  return { root, body, keys, wheel, line: glow, parts: [keys, sole, grooves, buttons] };
}
