// The floor lamp in the back right corner, between the bookshelf and the right wall: a designer tripod. Three tapered walnut legs
// in brass shoes splay from a turned brass collar (a knurled knob clamps the stem, a bushing lets the cord out underneath); a slim
// brass stem with a coupling carries a harp saddle, an E27 socket and an opal globe, and over them a tall pleated linen drum,
// bound top and bottom in a caramel braid, on a brass spider and finial. The cord, the same braid, drops from the collar, runs
// down the back leg in two brass clips and trails behind the lamp to a brass floor socket, a walnut rocker switch inline on it.
// The slot is narrow (the right wall 8 to one side, the shelf 10 to the other, nothing past x 7.5 or -9 here), so the shade is a
// column, 14.5 across and 18 tall, rather than a wide drum: it fits, and from across the room it still reads as the corner's light.
// The renderer's point lights are spent on the desk, so the lamp is lit like the rest of the room: every material paints in its
// own ambience (its colour as emissive), the brass and the wood get a warm rim, and what the bulb reaches is painted brighter (the
// inside of the shade, the harp and socket, the stem under the shade, the finial, the tops of the legs).
// Static parts merge by material: five draw calls. Local frame: origin on the floor at the lamp's centre, y up; 1 unit ≈ 19 mm,
// so the finial tops out at 85.5 (1.62 m).
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, sphere, merge } from 'engine/geometry';
import { drawTexture } from 'engine/textures';
import { M4, color } from 'engine/math';

// ---------- layout
const FOOT_R = 8.0, TOP_R = 1.2;                                  // the legs' axes: on this circle at the floor, and under the collar
const LEGS = [-45, 75, 195].map((d) => (d * Math.PI) / 180);      // the back leg points into the corner, two reach out to the room
const HUB_Y = 42.5;                                               // the collar's underside, where the legs' axes arrive
const KNOB = (135 * Math.PI) / 180;                               // the knob faces the room, between the two front legs
const HARP = Math.PI / 4;                                         // the harp's plane, square to the knob: from the room its arms stand apart
const SHADE = { r: 7.0, pleat: 0.18, n: 52, y0: 66, y1: 84 };     // mean radius, pleat depth either side of it, pleats, bottom, top
const BULB = { y: 76, r: 2.5 };                                   // a G95 globe, its centre a little above the shade's middle
const CORD = 0.16;                                                // the cord's radius (a 6 mm braid)
const SWITCH = [3.36, -8.45], PLUG = [3.4, -12.95];               // on the floor behind the lamp, short of the back skirting (z -14.6)

// ---------- a small vector kit
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => scl(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1)), dirA = (a) => [Math.cos(a), 0, Math.sin(a)];
const clamp01 = (v) => Math.min(1, Math.max(0, v)), smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const toSrgb = (c) => { c = clamp01(c); return Math.round((c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255); };
// column-major placement from three axes and an origin; orient() stands a part built along +y on the axis Y at p
const basis = (X, Y, Z, p) => [X[0], X[1], X[2], 0, Y[0], Y[1], Y[2], 0, Z[0], Z[1], Z[2], 0, p[0], p[1], p[2], 1];
const at = (p) => basis([1, 0, 0], [0, 1, 0], [0, 0, 1], p);
const orient = (Y, p) => { Y = nrm(Y); const X = nrm(crs(Y, Math.abs(Y[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])); return basis(X, Y, crs(X, Y), p); };
// the legs: each axis runs from the floor at FOOT_R in to TOP_R under the collar, tapering from 0.5 in its shoe to 0.72 up there
const legAxis = (a, y) => { const k = FOOT_R - ((FOOT_R - TOP_R) * y) / HUB_Y; return [Math.cos(a) * k, y, Math.sin(a) * k]; };
const legR = (y) => 0.5 + (0.22 * y) / HUB_Y;
function legFrame(a) {
  const F = legAxis(a, 0), A = nrm(sub(legAxis(a, HUB_Y), F)), out = dirA(a);
  // X: the leg's outer side (square to its axis); -X its inner side, which faces the lamp's axis and a little down
  const X = nrm(sub(out, scl(A, dot(out, A)))), Z = crs(X, A);
  return { F, A, X, Z, inn: scl(X, -1), m: basis(X, A, Z, F) };
}

// ---------- geometry kit
// every triangle wound to face along its vertex normals (back faces are culled)
function wind(pos, nor, idx) {
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const f = crs([pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]], [pos[c] - pos[a], pos[c + 1] - pos[a + 1], pos[c + 2] - pos[a + 2]]);
    if (f[0] * (nor[a] + nor[b] + nor[c]) + f[1] * (nor[a + 1] + nor[b + 1] + nor[c + 1]) + f[2] * (nor[a + 2] + nor[b + 2] + nor[c + 2]) < 0) { const x = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = x; }
  }
}
function pack(pos, nor, uv, idx) {
  wind(pos, nor, idx);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i++) { min[i % 3] = Math.min(min[i % 3], pos[i]); max[i % 3] = Math.max(max[i % 3], pos[i]); }
  return { positions: new Float32Array(pos), normals: new Float32Array(nor), uvs: new Float32Array(uv), indices: pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), bounds: { min, max } };
}
// a part carried into the lamp's frame (positions by m, normals by its inverse transpose), so its UVs can then follow where it ends up
function xform(g, m) {
  const n = M4.normalFromMat4(new Float32Array(9), m), p = g.positions, q = g.normals, P = new Float32Array(p.length), N = new Float32Array(q.length);
  for (let i = 0; i < p.length; i += 3) {
    const x = p[i], y = p[i + 1], z = p[i + 2], a = q[i], b = q[i + 1], c = q[i + 2];
    P[i] = m[0] * x + m[4] * y + m[8] * z + m[12]; P[i + 1] = m[1] * x + m[5] * y + m[9] * z + m[13]; P[i + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    const nx = n[0] * a + n[3] * b + n[6] * c, ny = n[1] * a + n[4] * b + n[7] * c, nz = n[2] * a + n[5] * b + n[8] * c, l = Math.hypot(nx, ny, nz) || 1;
    N[i] = nx / l; N[i + 1] = ny / l; N[i + 2] = nz / l;
  }
  return { ...g, positions: P, normals: N };
}
const remap = (g, f) => { const uv = new Float32Array(g.uvs.length); for (let i = 0; i < uv.length; i += 2) [uv[i], uv[i + 1]] = f(g.uvs[i], g.uvs[i + 1]); return { ...g, uvs: uv }; };
// a surface of revolution about y through the profile [[r, y], …] from the bottom up (the outside on the right as it climbs).
// Neighbouring segments share a normal unless they meet at more than `crease` degrees (a turned edge stays crisp, a curve smooth).
// u runs round from +x (u0 shifts it), v = v(y)
function lathe(prof, n = 32, { crease = 40, v = (y) => y, u0 = 0 } = {}) {
  const segs = prof.slice(1).map((q, j) => { const p = prof[j], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [(q[1] - p[1]) / l, (p[0] - q[0]) / l]; });
  const lim = Math.cos((crease * Math.PI) / 180), rows = [];   // [r, y, nr, ny, joins the row before]
  prof.forEach((p, j) => {
    const a = segs[j - 1], b = segs[j];
    if (a && b && a[0] * b[0] + a[1] * b[1] < lim) { rows.push([...p, ...a, 1], [...p, ...b, 0]); return; }
    const s = a && b ? [a[0] + b[0], a[1] + b[1]] : a || b, l = Math.hypot(s[0], s[1]) || 1;
    rows.push([...p, s[0] / l, s[1] / l, j > 0 ? 1 : 0]);
  });
  const pos = [], nor = [], uv = [], idx = [], m = rows.length;
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a); for (const [r, y, nr, ny] of rows) { pos.push(r * ca, y, r * sa); nor.push(nr * ca, ny, nr * sa); uv.push(u0 + i / n, v(y)); } }
  for (let i = 0; i < n; i++) for (let j = 1; j < m; j++) if (rows[j][4]) { const a = i * m + j - 1, b = a + m; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  return pack(pos, nor, uv, idx);
}
// a smooth curve through the points (centripetal Catmull-Rom: no loops or overshoot where they bunch up), at most `step` apart
function spline(pts, step = 0.4) {
  const out = [pts[0]], kt = (a, b) => Math.sqrt(Math.hypot(...sub(b, a))) || 1e-4;
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i], p2 = pts[i + 1], p0 = i > 0 ? pts[i - 1] : sub(scl(p1, 2), p2), p3 = i + 2 < pts.length ? pts[i + 2] : sub(scl(p2, 2), p1);
    const t1 = kt(p0, p1), t2 = t1 + kt(p1, p2), t3 = t2 + kt(p2, p3), n = Math.max(2, Math.ceil(Math.hypot(...sub(p2, p1)) / step));
    for (let k = 1; k <= n; k++) {
      const t = t1 + (t2 - t1) * (k / n), L = (a, b, ta, tb) => add(scl(a, (tb - t) / (tb - ta)), scl(b, (t - ta) / (tb - ta)));
      const A1 = L(p0, p1, 0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
      out.push(L(L(A1, A2, 0, t2), L(A2, A3, t1, t3), t1, t2));
    }
  }
  return out;
}
// a tube swept along a path. The section is a superellipse (sq 2: an ellipse; higher: squarer) with half-sizes a along the side
// vector and b across it; the side is carried along the path so a bent tube never twists, or held to `side` with `fixed` (a band
// round a leg keeps its width along the leg). u runs round the section, v along the path (one texture repeat per vLen)
function sweep(path, { a = 0.1, b = a, seg = 10, sq = 2, side = null, fixed = false, vLen = 1 } = {}) {
  const n = path.length, pos = [], nor = [], uv = [], idx = []; let W = side, s = 0;
  for (let i = 0; i < n; i++) {
    if (i) s += Math.hypot(...sub(path[i], path[i - 1]));
    const T = nrm(sub(path[Math.min(i + 1, n - 1)], path[Math.max(i - 1, 0)]));
    if (fixed || !W) W = fixed ? side : Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    W = nrm(sub(W, scl(T, dot(W, T))));
    const D = crs(T, W);
    for (let k = 0; k <= seg; k++) {
      const t = (k / seg) * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t), pc = Math.sign(c) * Math.abs(c) ** (2 / sq), ps = Math.sign(sn) * Math.abs(sn) ** (2 / sq);
      pos.push(...add(path[i], add(scl(W, pc * a), scl(D, ps * b))));
      // the section's normal: the gradient of |x/a|^sq + |y/b|^sq
      nor.push(...nrm(add(scl(W, (Math.sign(pc) * Math.abs(pc) ** (sq - 1)) / a), scl(D, (Math.sign(ps) * Math.abs(ps) ** (sq - 1)) / b))));
      uv.push(k / seg, s / vLen);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < seg; k++) { const p = i * (seg + 1) + k, q = p + seg + 1; idx.push(p, q, p + 1, p + 1, q, q + 1); }
  return pack(pos, nor, uv, idx);
}
// the pleated drum: flat facets zigzagging between the rings, a valley at every k/n of the way round and a ridge half a pleat on,
// `off` further out. The inside face sits a fabric's thickness in and faces in. u runs round (0..1), v from v0 (bottom) to v1 (top)
function drum(off, inward, v0, v1) {
  const { r, pleat, n, y0, y1 } = SHADE, pos = [], nor = [], uv = [], idx = [];
  const pt = (q) => { const a = (q / n) * Math.PI * 2, rr = r + off + (q % 1 ? pleat : -pleat); return [Math.cos(a) * rr, Math.sin(a) * rr]; };
  for (let k = 0; k < 2 * n; k++) {
    const q0 = k / 2, q1 = (k + 1) / 2, A = pt(q0), B = pt(q1), mx = A[0] + B[0], mz = A[1] + B[1];
    // each facet's normal is square to its chord, out (or in): its own vertices, so the folds stay crisp
    let nx = B[1] - A[1], nz = A[0] - B[0]; const l = Math.hypot(nx, nz); nx /= l; nz /= l;
    if ((nx * mx + nz * mz > 0) === inward) { nx = -nx; nz = -nz; }
    const base = pos.length / 3;
    for (const [p, q] of [[A, q0], [B, q1]]) for (const y of [y0, y1]) { pos.push(p[0], y, p[1]); nor.push(nx, 0, nz); uv.push(q / n, y === y0 ? v0 : v1); }
    idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
  }
  return pack(pos, nor, uv, idx);
}
// the braid that binds the shade's rim: an elliptical roll round a ring of radius R at height y (a wide radially, b tall)
function piping(R, y, a, b, n = 160, seg = 10) {
  const pos = [], nor = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2, ct = Math.cos(t), st = Math.sin(t);
    for (let k = 0; k <= seg; k++) {
      const p = (k / seg) * Math.PI * 2, cp = Math.cos(p), sp = Math.sin(p), rr = R + a * cp, l = Math.hypot(b * cp, a * sp);
      pos.push(rr * ct, y + b * sp, rr * st); nor.push(((b * cp) / l) * ct, (a * sp) / l, ((b * cp) / l) * st); uv.push(k / seg, (t * R) / 0.5);
    }
  }
  for (let i = 0; i < n; i++) for (let k = 0; k < seg; k++) { const p = i * (seg + 1) + k, q = p + seg + 1; idx.push(p, q, p + 1, p + 1, q, q + 1); }
  return pack(pos, nor, uv, idx);
}
// the knurled grip of the collar's knob, along +y: a shank, a flange, a straight knurl (28 V ridges) between chamfers, a domed cap.
// Its normals come from the surface itself (neighbours across and along), so the ridges catch the light facet by facet
function knob() {
  const rows = [[0.2, 0], [0.2, 0.32], [0.36, 0.34], [0.54, 0.4], [0.6, 0.47], [0.6, 0.52, 1], [0.6, 0.78, 1], [0.6, 1.04, 1], [0.6, 1.09], [0.53, 1.16], [0.42, 1.22], [0.25, 1.26], [0, 1.28]];
  const n = 112, NU = n + 1, NV = rows.length, pos = [], uv = [], nor = [], idx = [];
  for (const [r, y, k] of rows) for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, tri = Math.abs(((i * 28) / n) % 1 - 0.5) * 4 - 1, rr = r * (1 + (k ? 0.06 * tri : 0)); pos.push(Math.cos(a) * rr, y, Math.sin(a) * rr); uv.push(i / n, 0); }
  const P = (i, j) => { const o = (j * NU + i) * 3; return [pos[o], pos[o + 1], pos[o + 2]]; };
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
    const p = P(i, j), ref = [p[0], p[1] - 0.7, p[2]];
    let N = crs(sub(P(i, Math.min(NV - 1, j + 1)), P(i, Math.max(0, j - 1))), sub(P(i === n ? 1 : i + 1, j), P(i === 0 ? n - 1 : i - 1, j)));
    if (Math.hypot(...N) < 1e-9) N = ref;
    N = nrm(N); if (dot(N, ref) < 0) N = scl(N, -1); nor.push(...N);
  }
  for (let j = 0; j < NV - 1; j++) for (let i = 0; i < n; i++) { const a = j * NU + i, c = a + NU; idx.push(a, c, a + 1, a + 1, c, c + 1); }
  return pack(pos, nor, uv, idx);
}

// ---------- painted textures
// walnut, its grain running along the legs (v). Drawn twice from the same seed: the albedo, and the ambience (emissive), which is
// the same wood lit more toward the top, where the shade's light falls (sRGB 200 → about 0.6 at the shoes)
function walnutTexture(lit) {
  const r = rng(23);
  return drawTexture(64, 512, (ctx, w, h) => {
    ctx.fillStyle = '#4b3526'; ctx.fillRect(0, 0, w, h);
    // broad figure first, then the fine grain, wavering a little; each line is drawn across the seam too (x ± w), so it wraps
    for (let i = 0; i < 90; i++) {
      const x = r() * w, broad = i < 14, dark = r() < 0.62, a = broad ? 0.08 + r() * 0.1 : 0.14 + r() * 0.34, wob = 0.6 + r() * 2.2, ph = r() * 6.3, f = 0.006 + r() * 0.02;
      ctx.strokeStyle = dark ? `rgba(30,18,10,${a})` : `rgba(124,88,60,${a})`; ctx.lineWidth = broad ? 3 + r() * 6 : 0.5 + r() * 1.5;
      for (const o of [-w, 0, w]) { ctx.beginPath(); for (let y = 0; y <= h; y += 8) { const xx = x + o + Math.sin(y * f + ph) * wob; if (y) ctx.lineTo(xx, y); else ctx.moveTo(xx, y); } ctx.stroke(); }
    }
    // pores: short dark dashes along the grain
    for (let i = 0; i < 700; i++) { ctx.fillStyle = `rgba(22,12,6,${0.2 + r() * 0.3})`; ctx.fillRect(r() * w, r() * h, 0.7, 2 + r() * 6); }
    if (lit) { ctx.globalCompositeOperation = 'multiply'; const g = ctx.createLinearGradient(0, h, 0, 0); g.addColorStop(0, 'rgb(200,200,200)'); g.addColorStop(1, '#ffffff'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over'; }
  }, { repeat: true });
}
// the brass's ambience: up the canvas (v) how much light reaches the part (0.35 by the floor .. 1 inside the shade); round it (u)
// a soft studio sheen, two broad highlights and a darker band, so a turned surface reads as polished. Linear values, no mipmaps
function brassTexture() {
  return drawTexture(128, 32, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / w, v = 1 - (y + 0.5) / h, sheen = 0.82 + 0.1 * Math.cos(u * Math.PI * 4) + 0.06 * Math.cos((u * 3 + 0.3) * Math.PI * 2), o = (y * w + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = Math.round(255 * clamp01((0.35 + 0.65 * v) * sheen)); img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, { srgb: false, mipmaps: false });
}
// the shade's light. The top half of the canvas is the outside (v 0.51..0.99, bottom to top), the bottom half the inside
// (v 0.01..0.49), which the bulb lights directly and so glows brighter. Round it (u) run the pleats, a dark crease at every fold
// and a bright one at every crown, and the soft shadows of the harp's arms; up it, a hot band level with the bulb, fading to dimmer,
// warmer rims; across it, linen slubs. Stored at half strength (the material's emissive is 2), so the inside can pass 1
function shadeTexture() {
  const W = 1024, H = 512, n = SHADE.n, pw = W / n, r = rng(29), slub = new Float32Array(W * H).fill(1);
  for (let i = 0; i < 700; i++) {
    const y = Math.floor(r() * H), x0 = r() * W, len = 20 + r() * 160, amp = (r() < 0.6 ? 1 : -1) * (0.03 + r() * 0.07), th = r() < 0.3 ? 2 : 1;
    for (let k = 0; k < len; k++) { const x = Math.floor(x0 + k) % W, e = Math.sin((k / len) * Math.PI); for (let t = 0; t < th && y + t < H; t++) slub[(y + t) * W + x] *= 1 + amp * e; }
  }
  const harps = [HARP / (Math.PI * 2), HARP / (Math.PI * 2) + 0.5], bulbH = (BULB.y - SHADE.y0) / (SHADE.y1 - SHADE.y0);
  return drawTexture(W, H, (ctx) => {
    const img = ctx.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) {
      const v = 1 - (y + 0.5) / H, inside = v < 0.5, h = clamp01(inside ? (v - 0.01) / 0.48 : (v - 0.51) / 0.48);
      const prof = inside ? 0.62 + 0.38 * Math.exp(-(((h - bulbH) / 0.38) ** 2)) : 0.56 + 0.44 * Math.exp(-(((h - bulbH) / 0.34) ** 2));
      const peak = inside ? [0.8, 0.56, 0.31] : [0.475, 0.3, 0.14], rim = h < 0.015 || h > 0.985 ? 0.75 : 1, row = 1 + 0.02 * (r() - 0.5);
      for (let x = 0; x < W; x++) {
        const u = (x + 0.5) / W, p = (u * n) % 1, dv = Math.min(p, 1 - p) * pw, dr = Math.abs(p - 0.5) * pw;
        // seen from inside, the outside's folds are crowns and its crowns folds
        const crease = inside ? 1 - 0.1 * Math.exp(-((dr / 1.2) ** 2)) + 0.05 * Math.exp(-((dv / 1.4) ** 2)) : 1 - 0.16 * Math.exp(-((dv / 1.1) ** 2)) + 0.07 * Math.exp(-((dr / 1.3) ** 2));
        let shadow = 1;
        for (const uh of harps) { const du = Math.min(Math.abs(u - uh), 1 - Math.abs(u - uh)) * W; shadow -= (inside ? 0.12 : 0.08) * Math.exp(-((du / (inside ? 9 : 13)) ** 2)) * (1 - smooth(0.85, 0.98, h)); }
        const b = prof * crease * shadow * slub[y * W + x] * row * rim * (0.985 + r() * 0.03), o = (y * W + x) * 4;
        // dimmer light through the cloth is also warmer: blue falls fastest, then green
        d[o] = toSrgb(peak[0] * b); d[o + 1] = toSrgb(peak[1] * b ** 1.25); d[o + 2] = toSrgb(peak[2] * b ** 1.6); d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}
// the cord's braid (and the shade's binding): two sets of strands spiralling opposite ways, over and under, so it reads as a
// diamond weave; each strand rounded, lighter on its crown. Caramel, so it shows against the walnut leg it runs down
function braidTexture() {
  const r = rng(31);
  return drawTexture(64, 64, (ctx, w, h) => {
    const img = ctx.createImageData(w, h), base = [146, 104, 66];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = Math.floor(x / 8), j = Math.floor(y / 8), fx = ((x % 8) + 0.5) / 8, fy = ((y % 8) + 0.5) / 8;
      const q = (i + j) % 2 ? fx + fy : fx + 1 - fy, s = Math.abs((q % 1) - 0.5) * 2, k = (1.12 - 0.45 * s * s) * (0.93 + r() * 0.12), o = (y * w + x) * 4;
      img.data[o] = base[0] * k; img.data[o + 1] = base[1] * k; img.data[o + 2] = base[2] * k; img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, { repeat: true });
}

/**
 * The corner floor lamp. Returns { root, glow, dimmable, update }: `glow` is the shade's Material (its emissive is [2, 2, 2], the
 * colour lives in its emissiveMap) for the room to tie to its light level; `dimmable` the other materials, whose emissive the room
 * scales during the intro; `update(dt, time, level)` breathes the shade and the bulb very slightly through emissiveIntensity only,
 * so it never fights a dimmer that scales emissive; its fourth argument, `power` (0..1), is the lamp's switch.
 */
export function buildFloorLamp() {
  const root = new Node('floor-lamp');
  const rim = color('#d9a86a'), brassC = color('#8e6a3d');
  const walnut = new Material({ color: [1, 1, 1], map: walnutTexture(false), emissive: [0.95, 0.95, 0.95], emissiveMap: walnutTexture(true), roughness: 0.5, metalness: 0, fresnel: 0.22, fresnelColor: rim, receiveShadow: false });
  const brass = new Material({ color: brassC, roughness: 0.32, metalness: 0.85, emissive: brassC.map((c) => c * 1.3), emissiveMap: brassTexture(), fresnel: 0.38, fresnelColor: color('#f0cf98'), receiveShadow: false });
  const shade = new Material({ color: color('#dccbad'), roughness: 0.92, emissive: [2, 2, 2], emissiveMap: shadeTexture(), receiveShadow: false });
  const bulb = new Material({ color: [0, 0, 0], emissive: color('#ffe6c0').map((c) => c * 2.4), unlit: true, receiveShadow: false });
  const braid = braidTexture();
  const cord = new Material({ color: [1, 1, 1], map: braid, emissive: [0.62, 0.62, 0.62], emissiveMap: braid, roughness: 0.85, fresnel: 0.14, fresnelColor: rim, receiveShadow: false });
  for (const [name, m] of Object.entries({ walnut, brass, shade, bulb, cord })) m.name = name;   // (the meshes are named after them)
  const parts = new Map([walnut, brass, shade, bulb, cord].map((m) => [m, []]));
  // brass takes its ambience from where it ends up: dim by the floor, brighter up toward the shade, full inside it (the bulb shines
  // straight on the harp and socket) and on the finial over the open top, a little less at its very tip
  const lightV = (y) => clamp01(0.22 + 0.2 * smooth(20, 64, y) + 0.58 * smooth(64.5, 68, y) - 0.35 * smooth(84.3, 85.4, y));
  const put = (mat, g) => { if (mat === brass) { const uv = new Float32Array(g.uvs); for (let i = 0; i < uv.length / 2; i++) uv[i * 2 + 1] = lightV(g.positions[i * 3 + 1]); g = { ...g, uvs: uv }; } parts.get(mat).push(g); };
  const up = [0, 1, 0], h = dirA(HARP);

  // ---------- the legs: tapered walnut in brass shoes (cut level with the floor) and brass ferrules where they enter the collar
  const frames = LEGS.map(legFrame);
  frames.forEach(({ A, m }, i) => {
    const L = (HUB_Y + 1.5) / A[1], s0 = (HUB_Y - 2.5) / A[1], rS = (s) => legR(s * A[1]);
    put(walnut, xform(lathe([[rS(0.35), 0.35], [rS(L), L]], 28, { v: (s) => s / L, u0: i / 3 }), m));
    const shoe = xform(lathe([[0, -0.4], [0.62, -0.4], [0.68, -0.3], [0.69, -0.1], [0.69, 1.45], [0.72, 1.52], [0.72, 1.68], [0.66, 1.76], [rS(1.8) + 0.02, 1.8]], 28), m);
    for (let k = 1; k < shoe.positions.length; k += 3) shoe.positions[k] = Math.max(0, shoe.positions[k]);
    put(brass, shoe);
    put(brass, xform(lathe([[rS(s0) + 0.006, s0], [0.8, s0 + 0.06], [0.845, s0 + 0.14], [0.845, s0 + 0.4], [0.8, s0 + 0.47], [0.8, (HUB_Y + 0.6) / A[1]]], 28), m));
  });

  // ---------- the collar: a turned hub with a groove round its waist, the knurled knob on it, a coupling on top, the bushing below
  put(brass, lathe([[0, 42.4], [1.5, 42.4], [1.92, 42.46], [2.14, 42.6], [2.26, 42.82], [2.3, 43.08], [2.3, 44.18], [2.2, 44.3], [2.15, 44.5], [2.2, 44.7], [2.3, 44.82], [2.3, 45.92], [2.26, 46.18], [2.14, 46.4], [1.92, 46.54], [1.5, 46.6], [0.9, 46.66], [0.86, 46.7], [0.86, 47.3], [0.8, 47.4], [0.6, 47.44], [0.42, 47.46]], 48));
  put(brass, xform(knob(), orient(dirA(KNOB), add(scl(dirA(KNOB), 2.1), [0, 44.5, 0]))));
  put(brass, lathe([[0, 41.3], [0.2, 41.3], [0.27, 41.36], [0.27, 41.9], [0.34, 41.96], [0.34, 42.45]], 20));
  // ---------- the stem, with a coupling ring halfway, up into the harp's saddle
  put(brass, lathe([[0.42, 46.9], [0.42, 56.6], [0.5, 56.68], [0.53, 56.8], [0.53, 57.4], [0.5, 57.52], [0.42, 57.6], [0.42, 67.3]], 24));

  // ---------- inside the shade: the harp's saddle and its sleeves, the socket with its threaded shade ring, the bulb's E27 cap and globe
  put(brass, xform(roundedBox({ w: 7.3, h: 0.22, d: 0.6, r: 0.08, seg: 2 }), basis(h, up, crs(h, up), [0, 67.0, 0])));
  put(brass, lathe([[0, 66.85], [0.7, 66.85], [0.73, 66.9], [0.73, 67.12], [0.62, 67.16]], 24));
  for (const s of [-1, 1]) put(brass, xform(lathe([[0, 66.8], [0.2, 66.8], [0.22, 66.85], [0.22, 67.9], [0.19, 67.95], [0.13, 67.97]], 12), at(scl(h, s * 3.45))));
  const threads = []; for (let k = 0; k <= 8; k++) threads.push([k % 2 ? 1.1 : 1.06, 69.6 + k * 0.08]);
  put(brass, lathe([[0, 67.15], [0.6, 67.15], [0.88, 67.22], [0.98, 67.4], [1.0, 67.62], [1.0, 69.55], ...threads, [1.0, 70.3], [0.97, 71.0], [0.9, 71.18], [0.78, 71.26], [0.74, 71.3]], 32));
  const cap = [[0.74, 71.15]]; for (let k = 0; k <= 11; k++) cap.push([k % 2 ? 0.75 : 0.69, 71.2 + k * 0.09]); cap.push([0.76, 72.28], [0.8, 72.34], [0.76, 72.42]);
  put(brass, lathe(cap, 24));
  const globe = [[0.74, 72.38], [0.78, 72.8], [0.86, 73.2], [1.0, 73.5]];
  for (let k = 0; k <= 20; k++) { const ph = ((150 - k * 7.5) * Math.PI) / 180; globe.push([BULB.r * Math.sin(ph), BULB.y + BULB.r * Math.cos(ph)]); }
  put(bulb, lathe(globe, 36));
  // the harp: one brass wire rising from each sleeve, round the globe, arching in to meet at the top fitting, its stud through the spider
  const arch = [[3.45, 67.9], [3.45, 70.5], [3.42, 75.5], [3.25, 79.0], [2.7, 81.4], [1.65, 82.95], [0.6, 83.42], [0, 83.5]];
  put(brass, sweep(spline([...arch.map(([w, y]) => add(scl(h, -w), [0, y, 0])), ...arch.slice(0, -1).reverse().map(([w, y]) => add(scl(h, w), [0, y, 0]))], 0.35), { a: 0.12, seg: 10 }));
  put(brass, lathe([[0, 83.25], [0.26, 83.25], [0.3, 83.3], [0.3, 83.62], [0.26, 83.68], [0.12, 83.7], [0.12, 84.2], [0, 84.22]], 16));

  // ---------- the shade: pleated linen outside and in, the braid binding both rims, the spider (its spokes over the legs) and finial
  put(shade, drum(0, false, 0.51, 0.99));
  put(shade, drum(-0.05, true, 0.01, 0.49));
  for (const y of [SHADE.y0 + 0.1, SHADE.y1 - 0.1]) put(cord, piping(SHADE.r, y, 0.27, 0.3));
  put(brass, lathe([[0.13, 83.7], [0.6, 83.7], [0.64, 83.74], [0.64, 83.8], [0.6, 83.84], [0.13, 83.84], [0.13, 83.7]], 24));
  for (const a of LEGS) put(brass, sweep([add(scl(dirA(a), 0.58), [0, 83.77, 0]), add(scl(dirA(a), SHADE.r - 0.05), [0, 83.98, 0])], { a: 0.065, seg: 8 }));
  put(brass, lathe([[0, 83.84], [0.36, 83.84], [0.44, 83.92], [0.44, 84.06], [0.36, 84.14], [0.25, 84.26], [0.21, 84.42], [0.24, 84.52], [0.34, 84.6], [0.44, 84.7], [0.5, 84.84], [0.52, 84.98], [0.5, 85.12], [0.43, 85.26], [0.32, 85.36], [0.17, 85.43], [0, 85.45]], 28));

  // ---------- the cord: out of the bushing, down the back leg's inner side (sagging a little between the clips), off near the foot,
  // across the floor through the switch to the plug
  const B = frames[0], back = LEGS[0], sag = (y) => (y > 31 ? 0.06 * Math.sin((Math.PI * (y - 31)) / 8) : y > 17 ? 0.08 * Math.sin((Math.PI * (y - 17)) / 14) : y > 8.5 ? 0.05 * Math.sin((Math.PI * (y - 8.5)) / 8.5) : 0);
  // (it rides a hair off the wood, RIDE, so the curve between the points never cuts into the leg; the clips are cut to the same line)
  const RIDE = 0.04, onLeg = (y, k = 0) => add(legAxis(back, y), scl(B.inn, legR(y) + CORD + RIDE + k));
  const t = nrm([-0.05, 0, -1]), S0 = [SWITCH[0], 0, SWITCH[1]], ends = [add(S0, add(scl(t, -1.48), [0, 0.42, 0])), add(S0, add(scl(t, 1.48), [0, 0.42, 0]))];
  const toSwitch = [[0, 41.75, 0], [0, 41.15, 0], add(scl(dirA(back), 0.34), [0, 40.45, 0]), ...[39, 36.5, 34, 31, 28, 24, 20.5, 17, 14, 11, 8.5].map((y) => onLeg(y, sag(y))),
    add(scl(dirA(back), 5.72), [0, 6.0, 0]), add(scl(dirA(back), 5.45), [0, 3.6, 0]), add(scl(dirA(back), 5.2), [0, 1.5, 0]), [3.55, 0.3, -4.6], [3.48, CORD + 0.015, -5.5], [3.45, 0.2, -6.3], [3.44, 0.32, -6.62], ends[0]];
  // (the floor points sit a hair high: the curve dips a little past them, and the cord must rest on the boards, not in them)
  const toPlug = [ends[1], [3.28, 0.3, -10.35], [3.29, CORD + 0.015, -10.85], [3.33, 0.2, -11.35], [3.37, 0.38, -11.72], [3.4, 0.5, -12.08]];
  for (const p of [toSwitch, toPlug]) put(cord, sweep(spline(p, 0.35), { a: CORD, seg: 10, vLen: 0.5 }));
  // two brass clips hold it to the leg: a flat band hugging leg and cord together (the hull of the two circles), its width along the leg
  for (const y of [31, 17]) {
    const P = legAxis(back, y), R1 = legR(y) + 0.045, D = legR(y) + CORD + RIDE, R2 = CORD + 0.045, loop = [];
    for (let k = 0; k <= 64; k++) {
      const ps = (k / 64) * Math.PI * 2, u = add(scl(B.inn, Math.cos(ps)), scl(B.Z, Math.sin(ps)));
      loop.push(R1 >= D * Math.cos(ps) + R2 ? add(P, scl(u, R1)) : add(add(P, scl(B.inn, D)), scl(u, R2)));
    }
    put(brass, sweep(loop, { a: 0.13, b: 0.035, sq: 4, seg: 12, side: B.A, fixed: true }));
  }
  // the inline switch: a walnut body on the floor, a brass bezel and rocker on top, brass grommets where the cord goes in
  const sx = [t[2], 0, -t[0]], sw = (p) => basis(sx, up, t, add(S0, p)), grommet = [[0, 0], [0.27, 0], [0.27, 0.12], [0.2, 0.5], [0.18, 0.52]];
  put(walnut, remap(xform(roundedBox({ w: 1.3, h: 0.9, d: 2.2, r: 0.3, seg: 3, uvTopOnly: false }), sw([0, 0.45, 0])), (u, v) => [0.3 + u * 0.3, 0.05 + v * 0.05]));
  put(brass, xform(roundedBox({ w: 0.8, h: 0.08, d: 1.3, r: 0.04, seg: 2 }), sw([0, 0.92, 0])));
  put(brass, xform(roundedBox({ w: 0.6, h: 0.26, d: 1.1, r: 0.11, seg: 3 }), M4.multiply(new Array(16), sw([0, 1.04, 0]), M4.compose(new Array(16), [0, 0, 0], [0.1, 0, 0], [1, 1, 1]))));
  for (const s of [-1, 1]) put(brass, xform(lathe(grommet, 16), orient(scl(t, s), add(S0, add(scl(t, s * 1.0), [0, 0.42, 0])))));
  // the floor socket: a brass plate let into the boards (four screws, a raised ring), the plug standing in it, walnut, the cord in its side
  const P0 = [PLUG[0], 0, PLUG[1]];
  put(brass, xform(roundedBox({ w: 2.3, h: 0.1, d: 2.3, r: 0.05, seg: 2 }), at(add(P0, [0, 0.05, 0]))));
  for (const [dx, dz] of [[-0.88, -0.88], [0.88, -0.88], [-0.88, 0.88], [0.88, 0.88]]) put(brass, xform(sphere(0.09, 10, 6), [1, 0, 0, 0, 0, 0.35, 0, 0, 0, 0, 1, 0, P0[0] + dx, 0.1, P0[2] + dz, 1]));
  put(brass, xform(lathe([[0.62, 0.1], [0.8, 0.1], [0.83, 0.13], [0.8, 0.17], [0.62, 0.17]], 32), at(P0)));
  put(walnut, remap(xform(lathe([[0, 0.12], [0.56, 0.12], [0.6, 0.17], [0.6, 0.86], [0.55, 0.96], [0.42, 1.02], [0, 1.04]], 28), at(P0)), (u, v) => [0.6 + u * 0.3, 0.02 + v * 0.04]));
  put(brass, xform(lathe(grommet, 16), orient([0, 0, 1], add(P0, [0, 0.5, 0.45]))));

  // ---------- one mesh per material
  for (const [mat, list] of parts) {
    const g = merge(list.map((geo) => ({ geo })));
    wind(g.positions, g.normals, g.indices);
    const mesh = new Mesh(g, mat, 'floor-lamp:' + mat.name); mesh.castShadow = false; root.add(mesh);
  }
  const dimmable = [walnut, brass, cord, bulb];
  root.userData.dimmable = dimmable;
  // a slow, smooth breath in the glow, never a flicker: ±1.5 % over about nine seconds, and only once the room is up
  // `power` 0..1 is the switch (the room eases it): off, the bulb goes dark and the linen keeps only the room's light on it
  const update = (dt, time, level = 1, power = 1) => { const k = 1 + 0.015 * Math.sin(time * 0.7) * clamp01(level) * power; shade.emissiveIntensity = k * (0.14 + 0.86 * power); bulb.emissiveIntensity = k * (0.04 + 0.96 * power); };
  return { root, glow: shade, dimmable, update };
}
