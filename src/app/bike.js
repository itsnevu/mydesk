// A road bike on the wall: an all-black aero race bike, no brand and no logos anywhere, resting on two walnut pegs by its top tube
// with its drive side to the room, and a black aero helmet hung by its strap from the right drop.
// The frame is swept along its tubes' axes with elliptical and aero sections: a gently sloping top tube, an oversized down tube,
// a seat tube that bows round the rear wheel, dropped seat stays, a tapered head tube and a curved fork. Deep carbon rims on 24
// bladed straight-pull spokes, disc rotors with cut-outs and flat-mount calipers. A 2× drivetrain in dark gunmetal: toothed rings
// on a four-arm spider, a 12-speed cassette, a chain wrapped link by link round ring, jockeys and cog, both derailleurs, clipless
// pedals. An aero bar with taped drops, hoods and levers; a lofted saddle on carbon rails; one bottle cage.
// The room's lamps don't reach this wall, so every material paints in its own light: its colour as emissive, and a warm rim
// (fresnel) that draws the black edges against the plaster. Static parts are merged by material: nine draw calls.
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, cylinder, sphere, merge } from 'engine/geometry';
import { drawTexture } from 'engine/textures';
import { M4, color } from 'engine/math';

// ---------- the layout. 1 unit ≈ 1.9 cm. Origin on the wall under the middle of the bike; x runs along it (front wheel +x),
// y up from the tyres, +z out into the room. The bike's right (drive) side faces the room.
const R = 18.3, ZC = 12.8;                                       // tyre radius (700c), and the centre plane's stand-off (the bar is ≈ 22 wide)
const RA = [-26, R], FA = [26, R], BB = [-4.43, 14.5];           // axles (wheelbase 52), bottom bracket (≈ 72 mm drop, 415 mm stays)
const STD = [-0.284, 0.9588], HAD = [0.2924, -0.9563];           // seat tube (73.5°) and steering axis (73°, pointing down)
const HT = [15.56, 44.5], HB = 8.4;                              // head tube top, and its length down the axis
const TILT = Math.atan2(HAD[0], -HAD[1]);                        // the steerer's lean as a turn about z (≈ 17°)
const FWD = [-HAD[1], HAD[0]], STF = [STD[1], -STD[0]];          // square to the steerer and to the seat tube, forwards
const BC = [20.2, 47.25];                                        // the bar's centre, at the end of a 100 mm stem
const CRANK = -0.61;                                             // the drive-side arm points forward and down (≈ 35°)
const CHAIN = { ring: 2.5, cog: 2.2 };                           // where the chain runs (dz): on the big ring, on the 17 t cog
const P = (x, y, dz = 0) => [x, y, ZC + dz];
const stAt = (s, dz = 0) => P(BB[0] + STD[0] * s, BB[1] + STD[1] * s, dz);
const htAt = (s, dz = 0) => P(HT[0] + HAD[0] * s, HT[1] + HAD[1] * s, dz);
const pitchR = (T) => 12.7 / (2 * Math.sin(Math.PI / T)) / 19;   // a sprocket's pitch radius on a ½" chain

// ---------- a small vector kit
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => scl(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1)), lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const along = (o, ...terms) => terms.reduce((p, [v, k]) => add(p, scl(v, k)), o);   // o + Σ v·k
const mix = (a, b, t) => a + (b - a) * t, clamp01 = (v) => Math.min(1, Math.max(0, v)), smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const sp = (v, p) => Math.sign(v) * Math.abs(v) ** p, wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const ring2 = (r, n, ph = 0) => Array.from({ length: n }, (_, i) => [r * Math.cos(ph + (i / n) * Math.PI * 2), r * Math.sin(ph + (i / n) * Math.PI * 2)]);
const line = (a, b, n = 12) => Array.from({ length: n + 1 }, (_, i) => lerp3(a, b, i / n));
const xf = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
// a smooth curve through evenly spaced knots (Catmull-Rom), t in 0..1
const curve = (k) => (t) => { const f = clamp01(t) * (k.length - 1), i = Math.min(Math.floor(f), k.length - 2), u = f - i; const p0 = k[Math.max(i - 1, 0)], p1 = k[i], p2 = k[i + 1], p3 = k[Math.min(i + 2, k.length - 1)]; return 0.5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (3 * p1 - p0 - 3 * p2 + p3) * u * u * u); };

// ---------- geometry kit
function pack(pos, nor, uv, idx) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i++) { min[i % 3] = Math.min(min[i % 3], pos[i]); max[i % 3] = Math.max(max[i % 3], pos[i]); }
  return { positions: new Float32Array(pos), normals: new Float32Array(nor), uvs: new Float32Array(uv), indices: pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), bounds: { min, max } };
}
// raw arrays with their own normals → geometry; every triangle is wound to face along its normals (back faces are culled)
function mesh(pos, nor, uv, idx) {
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const f = crs([pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]], [pos[c] - pos[a], pos[c + 1] - pos[a + 1], pos[c + 2] - pos[a + 2]]);
    if (f[0] * (nor[a] + nor[b] + nor[c]) + f[1] * (nor[a + 1] + nor[b + 1] + nor[c + 1]) + f[2] * (nor[a + 2] + nor[b + 2] + nor[c + 2]) < 0) { const x = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = x; }
  }
  return pack(pos, nor, uv, idx);
}
// raw arrays → geometry with area-weighted normals shared by every vertex at the same spot (seams, poles and tips shade smoothly)
function geo(pos, uv, idx) {
  const keys = [], acc = new Map();
  for (let i = 0; i < pos.length; i += 3) keys.push(`${Math.round(pos[i] * 500)},${Math.round(pos[i + 1] * 500)},${Math.round(pos[i + 2] * 500)}`);
  for (let k = 0; k < idx.length; k += 3) {
    const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3;
    const f = crs([pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]], [pos[c] - pos[a], pos[c + 1] - pos[a + 1], pos[c + 2] - pos[a + 2]]);
    for (const v of [a, b, c]) { const s = acc.get(keys[v / 3]); if (s) { s[0] += f[0]; s[1] += f[1]; s[2] += f[2]; } else acc.set(keys[v / 3], [...f]); }
  }
  return pack(pos, keys.flatMap((k) => nrm(acc.get(k) || [0, 1, 0])), uv, idx);
}
// a grid of points (rows × cols) → triangles, wound so the face at cell `at` points along `out`; `keep(i, j)` can leave cells open
function sheet(P, UV, at, out, keep = null) {
  const rows = P.length, cols = P[0].length, pos = [], uv = [], idx = [];
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { pos.push(...P[i][j]); uv.push(...UV[i][j]); }
  const [ti, tj] = at, flip = dot(crs(sub(P[ti][tj + 1], P[ti][tj]), sub(P[ti + 1][tj], P[ti][tj])), out) < 0;
  for (let i = 0; i < rows - 1; i++) for (let j = 0; j < cols - 1; j++) {
    if (keep && !keep(i, j)) continue;
    const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
    if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  return geo(pos, uv, idx);
}
// a tube swept along a path. `sec(t, i)` gives the half-sizes [a, b] of a superelliptic section (`sq`: 2 = ellipse, higher = squarer),
// `a` along `side` and `b` across it. With `transport` the side is carried along the path from its start, so a bent tube never twists
function sweep(path, sec, side, { seg = 14, sq = 2.5, closed = false, transport = false } = {}) {
  const n = path.length, L = [0], P = [], UV = []; let W = null;
  for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(...sub(path[i], path[i - 1])));
  for (let i = 0; i < n; i++) {
    const prev = i > 0 ? path[i - 1] : closed ? path[n - 2] : path[i], next = i < n - 1 ? path[i + 1] : closed ? path[1] : path[i];
    const T = nrm(sub(next, prev)), s0 = transport && W ? W : typeof side === 'function' ? side(i) : side;
    W = nrm(sub(s0, scl(T, dot(s0, T))));
    const D = crs(T, W), [a, b] = sec(L[i] / L[n - 1], i), ring = [], ruv = [];
    for (let k = 0; k <= seg; k++) {
      const t = (k / seg) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      ring.push(along(path[i], [W, sp(c, 2 / sq) * a], [D, sp(s, 2 / sq) * b])); ruv.push([k / seg, L[i] / 8]);
    }
    P.push(ring); UV.push(ruv);
  }
  const m = Math.max(0, Math.min(n >> 1, n - 2));
  return sheet(P, UV, [m, 0], sub(P[m][0], path[m]));
}
// a Catmull-Rom curve through control points, `n` samples per span
function spline(pts, n = 8) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3))); }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// a surface of revolution about z through the profile [[r, z], …], which runs with the outside on its right (anticlockwise
// round a closed section). `sharp` gives each profile segment its own normal (machined steps); otherwise neighbours share them
function lathe(prof, n = 48, sharp = false) {
  const segs = prof.slice(1).map((q, j) => { const p = prof[j], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [(q[1] - p[1]) / l, (p[0] - q[0]) / l]; });
  const closed = prof[0][0] === prof.at(-1)[0] && prof[0][1] === prof.at(-1)[1];
  const strips = sharp ? segs.map((N, j) => [[...prof[j], ...N], [...prof[j + 1], ...N]]) : [prof.map((p, j) => { const a = segs[j - 1] || (closed ? segs.at(-1) : segs[0]), b = segs[j] || (closed ? segs[0] : segs.at(-1)), l = Math.hypot(a[0] + b[0], a[1] + b[1]) || 1; return [...p, (a[0] + b[0]) / l, (a[1] + b[1]) / l]; })];
  const pos = [], nor = [], uv = [], idx = [];
  for (const rows of strips) {
    const base = pos.length / 3, m = rows.length;
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a); rows.forEach(([r, z, nr, nz], j) => { pos.push(r * ca, r * sa, z); nor.push(nr * ca, nr * sa, nz); uv.push(i / n, j / (m - 1)); }); }
    for (let i = 0; i < n; i++) for (let j = 0; j < m - 1; j++) { const a = base + i * m + j, b = a + m; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  return mesh(pos, nor, uv, idx);
}
// a flat ring between two closed outlines sampled at the same angles (anticlockwise), `t` thick about z = 0. u runs round it, so the
// machined sheen (sheenTexture) lies across every disc the same way
function ringPlate(outer, inner, t) {
  const pos = [], nor = [], uv = [], idx = [], n = outer.length, h = t / 2;
  const strip = (base) => { for (let i = 0; i < n; i++) { const a = base + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } };
  for (const s of [1, -1]) { const base = pos.length / 3; for (let i = 0; i <= n; i++) { const o = outer[i % n], q = inner[i % n]; pos.push(o[0], o[1], s * h, q[0], q[1], s * h); nor.push(0, 0, s, 0, 0, s); uv.push(i / n, 0.5, i / n, 0.5); } strip(base); }
  for (const [Lp, g] of [[outer, 1], [inner, -1]]) {
    const base = pos.length / 3;
    for (let i = 0; i <= n; i++) { const p = Lp[i % n], d = [Lp[(i + 1) % n][0] - Lp[(i + n - 1) % n][0], Lp[(i + 1) % n][1] - Lp[(i + n - 1) % n][1]], l = Math.hypot(d[0], d[1]) || 1; pos.push(p[0], p[1], h, p[0], p[1], -h); nor.push((g * d[1]) / l, (-g * d[0]) / l, 0, (g * d[1]) / l, (-g * d[0]) / l, 0); uv.push(i / n, 0.5, i / n, 0.5); }
    strip(base);
  }
  return mesh(pos, nor, uv, idx);
}
// a flat plate, `t` thick about z = 0, from an outline that is star-shaped about its centroid (anticlockwise)
function fanPlate(outline, t, u = 0.06) {
  const n = outline.length, h = t / 2, c = outline.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n], [0, 0]), pos = [], nor = [], uv = [], idx = [];
  for (const s of [1, -1]) { const base = pos.length / 3; pos.push(c[0], c[1], s * h); nor.push(0, 0, s); uv.push(u, 0.5); for (const p of outline) { pos.push(p[0], p[1], s * h); nor.push(0, 0, s); uv.push(u, 0.5); } for (let i = 0; i < n; i++) idx.push(base, base + 1 + i, base + 1 + ((i + 1) % n)); }
  const base = pos.length / 3;
  for (let i = 0; i <= n; i++) { const p = outline[i % n], d = [outline[(i + 1) % n][0] - outline[(i + n - 1) % n][0], outline[(i + 1) % n][1] - outline[(i + n - 1) % n][1]], l = Math.hypot(d[0], d[1]) || 1; pos.push(p[0], p[1], h, p[0], p[1], -h); nor.push(d[1] / l, -d[0] / l, 0, d[1] / l, -d[0] / l, 0); uv.push(u, 0.5, u, 0.5); }
  for (let i = 0; i < n; i++) { const a = base + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  return mesh(pos, nor, uv, idx);
}
// a flat plate between two polylines running the same way with the same count (a curved band), `t` thick about z = 0
function stripPlate(lo, hi, t, u = 0.06) {
  const pos = [], nor = [], uv = [], idx = [], n = lo.length, h = t / 2;
  for (const s of [1, -1]) { const base = pos.length / 3; for (let i = 0; i < n; i++) { pos.push(lo[i][0], lo[i][1], s * h, hi[i][0], hi[i][1], s * h); nor.push(0, 0, s, 0, 0, s); uv.push(u, 0.5, u, 0.5); } for (let i = 0; i < n - 1; i++) { const a = base + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
  const rim = [...lo, ...hi.slice().reverse()], m = rim.length; let area = 0;
  for (let i = 0; i < m; i++) { const p = rim[i], q = rim[(i + 1) % m]; area += p[0] * q[1] - q[0] * p[1]; }
  const g = area > 0 ? 1 : -1;
  for (let i = 0; i < m; i++) { const p = rim[i], q = rim[(i + 1) % m], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, N = [(g * (q[1] - p[1])) / l, (-g * (q[0] - p[0])) / l, 0], s = pos.length / 3; pos.push(p[0], p[1], h, q[0], q[1], h, p[0], p[1], -h, q[0], q[1], -h); for (let k = 0; k < 4; k++) { nor.push(...N); uv.push(u, 0.5); } idx.push(s, s + 1, s + 2, s + 1, s + 3, s + 2); }
  return mesh(pos, nor, uv, idx);
}
// a flat annulus r0..r1 cut into nA × nR cells; `keep(i, j)` says which stay (the rest are holes); walls line every cut edge
function polarPlate(r0, r1, nA, nR, keep, t) {
  const pos = [], nor = [], uv = [], idx = [], h = t / 2, TAU = Math.PI * 2;
  const at = (i, j) => { const a = (i / nA) * TAU, r = r0 + ((r1 - r0) * j) / nR; return [r * Math.cos(a), r * Math.sin(a)]; };
  const k = (i, j) => j >= 0 && j < nR && keep(((i % nA) + nA) % nA, j);
  const quad = (a, b, c, d, N, u) => { const s = pos.length / 3; for (const p of [a, b, c, d]) { pos.push(...p); nor.push(...N); uv.push(u, 0.5); } idx.push(s, s + 1, s + 2, s + 1, s + 3, s + 2); };
  for (let i = 0; i < nA; i++) for (let j = 0; j < nR; j++) {
    if (!k(i, j)) continue;
    const p00 = at(i, j), p10 = at(i + 1, j), p01 = at(i, j + 1), p11 = at(i + 1, j + 1), u = (i + 0.5) / nA, a0 = (i / nA) * TAU, a1 = ((i + 1) / nA) * TAU, am = (a0 + a1) / 2;
    for (const s of [1, -1]) quad([...p00, s * h], [...p10, s * h], [...p01, s * h], [...p11, s * h], [0, 0, s], u);
    if (!k(i, j - 1)) quad([...p00, h], [...p10, h], [...p00, -h], [...p10, -h], [-Math.cos(am), -Math.sin(am), 0], u);
    if (!k(i, j + 1)) quad([...p01, h], [...p11, h], [...p01, -h], [...p11, -h], [Math.cos(am), Math.sin(am), 0], u);
    if (!k(i - 1, j)) quad([...p00, h], [...p01, h], [...p00, -h], [...p01, -h], [Math.sin(a0), -Math.cos(a0), 0], u);
    if (!k(i + 1, j)) quad([...p10, h], [...p11, h], [...p10, -h], [...p11, -h], [-Math.sin(a1), Math.cos(a1), 0], u);
  }
  return mesh(pos, nor, uv, idx);
}
// a toothed outline (anticlockwise): T rounded teeth between the root and tip radii, m samples a tooth, the valleys at ph + k·2π/T
function teeth(T, r0, r1, m = 6, ph = 0) {
  const out = [];
  for (let k = 0; k < T * m; k++) { const d = Math.abs((k % m) / m - 0.5) * 2, h = d < 0.6 ? Math.sqrt(1 - (d / 0.6) ** 2) : 0, a = ph + (k / (T * m)) * Math.PI * 2, r = r0 + (r1 - r0) * Math.sqrt(h); out.push([r * Math.cos(a), r * Math.sin(a)]); }
  return out;
}
// the convex outline round two circles (anticlockwise)
function hull2(c1, r1, c2, r2, n = 40) {
  return Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, d = [Math.cos(a), Math.sin(a)], [c, r] = c1[0] * d[0] + c1[1] * d[1] + r1 >= c2[0] * d[0] + c2[1] * d[1] + r2 ? [c1, r1] : [c2, r2]; return [c[0] + r * d[0], c[1] + r * d[1]]; });
}
// a closed belt round circles {c, r, s} taken in the order it travels (s = +1 wraps anticlockwise, seen from the room). Its legs are
// the tangents between neighbours: outer ones where both turn the same way, crossed ones where they turn opposite ways
function belt(circles) {
  const n = circles.length, legs = circles.map((A, i) => {
    const B = circles[(i + 1) % n], d = [B.c[0] - A.c[0], B.c[1] - A.c[1]], be = Math.atan2(d[1], d[0]) - Math.asin((B.s * B.r - A.s * A.r) / Math.hypot(d[0], d[1])), pu = [-Math.sin(be), Math.cos(be)];
    return [[A.c[0] - A.s * A.r * pu[0], A.c[1] - A.s * A.r * pu[1]], [B.c[0] - B.s * B.r * pu[0], B.c[1] - B.s * B.r * pu[1]]];
  });
  const pts = [];
  circles.forEach((C, i) => {
    const p = legs[(i + n - 1) % n][1], q = legs[i][0];
    const a0 = Math.atan2(p[1] - C.c[1], p[0] - C.c[0]); let a1 = Math.atan2(q[1] - C.c[1], q[0] - C.c[0]);
    if (C.s > 0) while (a1 < a0) a1 += Math.PI * 2; else while (a1 > a0) a1 -= Math.PI * 2;
    const k = Math.max(2, Math.ceil((Math.abs(a1 - a0) * C.r) / 0.04));
    for (let j = 0; j <= k; j++) { const a = a0 + ((a1 - a0) * j) / k; pts.push([C.c[0] + C.r * Math.cos(a), C.c[1] + C.r * Math.sin(a)]); }
  });
  return pts;
}
// points evenly spaced round a closed polyline, as near `step` apart as an even count allows (inner and outer links come in pairs)
function evenly(pts, step) {
  const n = pts.length, L = [0];
  for (let i = 1; i <= n; i++) L.push(L[i - 1] + Math.hypot(pts[i % n][0] - pts[i - 1][0], pts[i % n][1] - pts[i - 1][1]));
  const count = 2 * Math.round(L[n] / step / 2), out = []; let j = 0;
  for (let k = 0; k < count; k++) { const s = (k / count) * L[n]; while (L[j + 1] < s) j++; const a = pts[j], c = pts[(j + 1) % n], t = (s - L[j]) / (L[j + 1] - L[j] || 1); out.push([mix(a[0], c[0], t), mix(a[1], c[1], t)]); }
  return out;
}
// a frame whose y axis runs from a towards b, centred between them (for cylinders laid along a line)
function toward(a, b) {
  const Y = nrm(sub(b, a)); let X = crs(Y, [0, 0, 1]); if (Math.hypot(...X) < 1e-3) X = crs(Y, [1, 0, 0]); X = nrm(X); const Z = crs(X, Y), c = lerp3(a, b, 0.5);
  return [X[0], X[1], X[2], 0, Y[0], Y[1], Y[2], 0, Z[0], Z[1], Z[2], 0, c[0], c[1], c[2], 1];
}
const flatUV = (g, u = 0.06) => { g.uvs = g.uvs.map((_, i) => (i % 2 ? 0.5 : u)); return g; };   // parts that should take the sheen's plain band

// static parts that share a material become one draw call (as in app/room); `frame` nests the next parts in a local frame (a wheel)
function batch() {
  const parts = new Map(); let base = null;
  const keep = (g, mat, m, n) => { if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push({ geo: g, m, n }); };
  return {
    frame(p, r = [0, 0, 0]) { base = p ? M4.compose(new Array(16), p, r, [1, 1, 1]) : null; },
    put(g, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
      let m = M4.compose(new Array(16), p, r, s); if (base) m = M4.multiply(new Array(16), base, m);
      keep(g, mat, m, [0, 1, 2].flatMap((j) => [0, 1, 2].map((i) => m[j * 4 + i] / (s[j] * s[j]))));
    },
    putM(g, mat, m) { if (base) m = M4.multiply(new Array(16), base, m); keep(g, mat, m, [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]); },
    build(parent) { for (const [mat, list] of parts) { const mesh = new Mesh(merge(list), mat, 'bike:' + mat.name); mesh.castShadow = false; parent.add(mesh); } },
  };
}

// ---------- painted textures
// bar tape: a black wrap, each turn's overlap a dark ridge with a faint lit edge above it; one turn per tile (u round the bar, v along)
function tapeTexture() {
  let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return drawTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#202022'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1600; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,250,240'},${0.03 + r() * 0.06})`; ctx.fillRect(r() * w, r() * h, 1.5, 1.5); }
    for (const o of [-h, 0, h]) {
      ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, o); ctx.lineTo(w, o + h); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,236,210,0.16)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, o + 6); ctx.lineTo(w, o + h + 6); ctx.stroke();
    }
  }, { repeat: true });
}
// machined metal has nothing to reflect on this wall, so the display light's reflection is painted round each disc (u runs round
// it): a soft streak above the axle and a fainter one below, as a lamp overhead leaves in a turned surface; plain parts sit at u ≈ 0
function sheenTexture() {
  return drawTexture(256, 4, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    for (const [u, v] of [[0, 0.55], [0.13, 0.55], [0.25, 1], [0.37, 0.55], [0.63, 0.5], [0.75, 0.8], [0.87, 0.5], [1, 0.55]]) g.addColorStop(u, `rgb(${Array(3).fill(Math.round(v * 255))})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }, { repeat: true, srgb: false });
}
// the tyres, painted round their section (u round the wheel, v round the section from the crown): a smooth slick crown, file-tread
// shoulders, a plain sidewall with two moulded rings, the bead darker where it seats in the rim
function tyreTexture() {
  return drawTexture(64, 128, (ctx, w, h) => {
    const band = (v0, v1, fill) => { for (const [a, c] of [[v0, v1], [1 - v1, 1 - v0]]) { ctx.fillStyle = fill; ctx.fillRect(0, (1 - c) * h, w, (c - a) * h); } };
    ctx.fillStyle = '#262523'; ctx.fillRect(0, 0, w, h);
    band(0, 0.06, '#1d1c1b'); band(0.06, 0.13, '#211f1e'); band(0.37, 0.5, '#151413');
    for (const v of [0.22, 0.3]) band(v - 0.004, v + 0.004, '#191817');
    for (const [a, c] of [[0.06, 0.13], [0.87, 0.94]]) {   // the file tread: fine diagonal ribs across the shoulders
      ctx.save(); ctx.beginPath(); ctx.rect(0, (1 - c) * h, w, (c - a) * h); ctx.clip();
      for (let x = -h; x < w + h; x += 10) { ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h * 0.6, h); ctx.stroke(); ctx.strokeStyle = 'rgba(255,240,220,0.08)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 2, 0); ctx.lineTo(x + 2 + h * 0.6, h); ctx.stroke(); }
      ctx.restore();
    }
  }, { repeat: true });
}
// walnut grain as a light modulation round 1, so the pegs keep the room's walnut colour
function grainTexture() {
  let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return drawTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ececec'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) { const y = r() * h; ctx.strokeStyle = `rgba(${r() < 0.6 ? '40,26,16' : '255,240,220'},${0.12 + r() * 0.22})`; ctx.lineWidth = 0.6 + r() * 2.2; ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 8, w * 0.6, y + (r() - 0.5) * 8, w, y + (r() - 0.5) * 5); ctx.stroke(); }
  }, { repeat: true });
}

// ---------- wheels: each in its own frame (the axle along z, dz 0 on the centre plane, turned by `turn`): tyre, deep rim, hub,
// 24 bladed straight-pull spokes laced two-cross, the valve, and the disc rotor on the left (wall) side with its carrier
const TYRE = Array.from({ length: 25 }, (_, k) => [17.52 + 0.78 * Math.cos((k / 24) * Math.PI * 2), 0.74 * Math.sin((k / 24) * Math.PI * 2)]);
const RIM = [[16.98, 0], [16.95, 0.28], [17.02, 0.52], [16.98, 0.7], [16.7, 0.75], [16.2, 0.79], [15.6, 0.77], [15.1, 0.66], [14.78, 0.46], [14.58, 0.22], [14.52, 0], [14.58, -0.22], [14.78, -0.46], [15.1, -0.66], [15.6, -0.77], [16.2, -0.79], [16.7, -0.75], [16.98, -0.7], [17.02, -0.52], [16.95, -0.28], [16.98, 0]];
const HUB = {
  rear: [[0.6, -3.74], [0.6, -3.48], [1.12, -3.42], [1.14, -2.92], [0.96, -2.86], [0.96, -2.56], [1.5, -2.5], [1.52, -2.2], [0.94, -2.12], [0.86, -1.0], [0.86, 0.3], [0.96, 0.78], [1.46, 0.84], [1.46, 1.08], [0.86, 1.14], [0.86, 3.42], [0.6, 3.48], [0.6, 3.74]],
  front: [[0.56, -2.63], [0.56, -2.42], [1.08, -2.38], [1.1, -2.08], [0.9, -2.02], [1.42, -1.95], [1.44, -1.66], [0.86, -1.58], [0.76, 0], [0.86, 1.58], [1.44, 1.66], [1.42, 1.95], [0.86, 2.02], [0.56, 2.42], [0.56, 2.63]],
};
function wheel(b, M, front, turn) {
  const c = front ? FA : RA;
  b.frame(P(c[0], c[1]), [0, 0, turn]);
  b.put(lathe(TYRE, 160), M.rubber);
  b.put(lathe(RIM, 144), M.gloss);
  b.put(lathe(front ? HUB.front : HUB.rear, 32, true), M.gloss);
  // the spokes: alternate rim holes go to alternate flanges; on each flange they lead and trail two holes round (two-cross)
  const fl = front ? [[-1.8, 1.43], [1.8, 1.43]] : [[-2.35, 1.5], [0.96, 1.45]];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2, side = i % 2 ? 0 : 1, h = a + ((i >> 1) % 2 ? -1 : 1) * (Math.PI / 3), [fz, fr] = fl[side];
    b.put(sweep([[fr * Math.cos(h), fr * Math.sin(h), fz], [14.62 * Math.cos(a), 14.62 * Math.sin(a), side ? 0.2 : -0.2]], () => [0.028, 0.065], [0, 0, 1], { seg: 6, sq: 2 }), M.carbon);
  }
  // the valve through the spoke bed, with its lock nut
  const vd = [Math.cos(Math.PI / 2 + Math.PI / 24), Math.sin(Math.PI / 2 + Math.PI / 24), 0];   // between two spoke holes
  b.putM(flatUV(cylinder(0.13, 0.13, 1.5, 10)), M.metal, toward(scl(vd, 14.7), scl(vd, 13.2)));
  b.putM(flatUV(cylinder(0.3, 0.3, 0.24, 6)), M.metal, toward(scl(vd, 14.5), scl(vd, 14.26)));
  b.putM(flatUV(cylinder(0.07, 0.07, 0.4, 6)), M.metal, toward(scl(vd, 13.22), scl(vd, 12.82)));
  // the rotor: a slotted steel track on six curved arms of a black carrier, on the hub's centre-lock splines
  const rz = front ? -2.3 : -3.05, ro = front ? 4.2 : 3.7, ri = ro - 0.7;
  b.put(polarPlate(ri, ro, 120, 5, (i, j) => !(j >= 1 && j <= 3 && (i + 2 * j) % 10 < 2), 0.1), M.metal, [0, 0, rz]);
  for (let k = 0; k < 6; k++) { const a0 = (k / 6) * Math.PI * 2, arm = []; for (let s = 0; s <= 6; s++) { const r = mix(1.3, ri + 0.18, s / 6), a = a0 + 0.42 * (s / 6) ** 1.4; arm.push([r * Math.cos(a), r * Math.sin(a), rz]); } b.put(sweep(arm, (t) => [0.075, mix(0.3, 0.2, t)], [0, 0, 1], { seg: 8, sq: 4 }), M.carbon); }
  b.put(ringPlate(ring2(1.52, 48), ring2(front ? 1.1 : 1.14, 48), 0.3), M.carbon, [0, 0, rz + (front ? 0.1 : 0.12)]);
  // the thru-axle's ends past the dropouts (the rear hanger sits between the dropout and the axle's head)
  const ax = front ? [3.13, -3.13] : [4.6, -4.3];
  b.put(cylinder(0.6, 0.64, 0.3, 20), M.carbon, [0, 0, ax[0] + 0.15], [Math.PI / 2, 0, 0]);
  b.put(cylinder(0.64, 0.6, 0.3, 20), M.carbon, [0, 0, ax[1] - 0.15], [Math.PI / 2, 0, 0]);
  b.frame(null);
}

// ---------- the frame, fork and dropouts, all in the bike's own frame
function frame(b, M) {
  const { carbon } = M, Z = [0, 0, 1];
  // top tube: from the head tube back to the seat cluster, falling ≈ 8°; deeper than wide at the front
  b.put(sweep(line(htAt(1.25), stAt(26)), (t) => [mix(0.84, 0.72, t), mix(0.98, 0.8, t)], Z, { seg: 20, sq: 2.3 }), carbon);
  // down tube: oversized and squared off, flaring into the bottom bracket
  b.put(sweep(line(htAt(5), P(-3.9, 15.3), 16), (t) => [mix(1.12, 1.0, smooth(0, 0.3, t)) + 0.62 * smooth(0.78, 1, t), 1.32 + 0.14 * smooth(0.8, 1, t)], Z, { seg: 22, sq: 2.7 }), carbon);
  // seat tube: an aero section that bows forward round the rear wheel, slimmer where the tyre passes, beefier at the cluster
  const bow = (s) => 0.45 * Math.exp(-(((s - 9.5) / 5) ** 2));
  const st = Array.from({ length: 25 }, (_, i) => { const s = (i / 24) * 27.6, p = stAt(s); return [p[0] + STF[0] * bow(s), p[1] + STF[1] * bow(s), p[2]]; });
  b.put(sweep(st, (t) => { const s = t * 27.6, base = 1 - smooth(0, 4, s), top = smooth(21, 25, s); return [0.74 + 0.26 * base + 0.12 * top, 1.02 + 0.22 * base - 0.12 * Math.exp(-(((s - 9.5) / 4) ** 2)) + 0.12 * top]; }, Z, { seg: 22, sq: 2.2 }), carbon);
  b.put(sweep(line(stAt(26.9), stAt(27.75), 2), (t) => [mix(0.92, 0.68, t * t), mix(1.2, 1.0, t * t)], Z, { seg: 22, sq: 2.3 }), carbon);   // the seat collar, closing onto the post
  // head tube: tapered, longer fore and aft than across
  b.put(sweep(line(htAt(-0.15), htAt(HB + 0.15), 8), (t) => [mix(1.06, 1.36, t), mix(1.36, 1.66, t)], Z, { seg: 24, sq: 2.2 }), carbon);
  b.put(cylinder(1.58, 1.58, 4.52, 32), carbon, P(BB[0], BB[1]), [Math.PI / 2, 0, 0]);   // the bottom bracket shell
  // dropped seat stays and the chainstays: wide round the tyre, pinched in to the cluster and the shell; the drive-side stay tucks
  // inside the chainrings
  for (const g of [-1, 1]) {
    b.put(sweep(spline([P(-25.55, 19.45, g * 4.0), P(-22.2, 23.0, g * 3.3), P(-18.0, 27.4, g * 2.25), P(-14.6, 30.9, g * 1.5), P(-12.6, 33.0, g * 0.95), P(-10.6, 34.75, g * 0.45)], 6), (t) => [mix(0.26, 0.33, smooth(0, 0.3, t)), mix(0.42, 0.56, t)], Z, { seg: 14, sq: 2.2 }), carbon);
    b.put(sweep(spline([P(-5.2, 14.45, g * 1.45), P(-8.2, 15.0, g * 1.5), P(-12.0, 15.7, g * 2.05), P(-17.5, 16.75, g * 3.0), P(-22.5, 17.6, g * 3.72), P(-25.3, 18.05, g * 4.0)], 6), (t) => [mix(0.4, 0.26, smooth(0.6, 1, t)), mix(0.78, 0.46, t)], Z, { seg: 14, sq: 2.4 }), carbon);
    b.put(fanPlate(hull2(RA, 1.15, [-25.1, 19.3], 0.75), 0.56), carbon, [0, 0, ZC + g * 4.02]);   // rear dropouts (142 mm, thru-axle)
    b.put(fanPlate(hull2(FA, 0.95, [25.5, 19.65], 0.62), 0.5), carbon, [0, 0, ZC + g * 2.88]);   // fork tips (100 mm)
  }
  b.put(fanPlate(hull2(RA, 0.72, [-26.75, 16.25], 0.5), 0.3), carbon, [0, 0, ZC + 4.45]);   // the derailleur hanger
  // the fork: blades curving forward to the offset, aero in section, from a crown that closes the head tube
  for (const g of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 14; i++) { const s = mix(0.5, 19.71, i / 14), off = 2.32 * (s / 19.71) ** 2, p = htAt(HB + s); pts.push([p[0] + FWD[0] * off, p[1] + FWD[1] * off, ZC + g * (1.75 + 1.13 * smooth(2, 19.7, s))]); }
    b.put(sweep(pts, (t) => [mix(0.52, 0.24, t), mix(1.0, 0.5, t)], Z, { seg: 16, sq: 2.3 }), carbon);
  }
  b.put(roundedBox({ w: 3.1, h: 1.3, d: 4.9, r: 0.55, seg: 3 }), carbon, htAt(HB + 0.55), [0, 0, TILT]);
  // flat-mount calipers on the left, each straddling its rotor: on the chainstay behind, on the fork leg in front
  for (const [c, ro, rz, a] of [[RA, 3.7, -3.05, 0.42], [FA, 4.2, -2.3, 2.55]]) b.put(roundedBox({ w: 2.5, h: 1.3, d: 1.0, r: 0.38, seg: 3 }), carbon, P(c[0] + (ro - 0.36) * Math.cos(a), c[1] + (ro - 0.36) * Math.sin(a), rz), [0, 0, a + Math.PI / 2]);
}

// ---------- the cockpit: headset, stem, an aero bar with taped drops, hoods, levers
const BAR = [[0, 0, 0], [0, 0, 2.3], [-0.3, 0.05, 5.4], [-0.15, 0.06, 7.9], [0.9, 0, 9.45], [2.6, -0.2, 10.1], [3.7, -0.75, 10.28], [4.15, -2.1, 10.4], [3.95, -3.9, 10.6], [2.75, -5.6, 10.85], [0.7, -6.45, 11.05], [-1.4, -6.45, 11.18], [-3.2, -6.25, 11.25]];
function cockpit(b, M) {
  const { carbon, metal, tape, rubber } = M, Z = [0, 0, 1], c = P(BC[0], BC[1]);
  // the headset's top cover, a spacer, the stem's steerer clamp and the top cap, all keeping the head tube's aero section
  b.put(cylinder(1, 1, 0.55, 28), carbon, htAt(-0.42), [0, 0, TILT], [1.34, 1, 1.05]);
  b.put(cylinder(1, 1, 0.6, 28), carbon, htAt(-1.01), [0, 0, TILT], [1.25, 1, 1.0]);
  b.put(cylinder(1, 1, 1.45, 28), carbon, htAt(-2.05), [0, 0, TILT], [1.14, 1, 0.98]);
  b.put(cylinder(0.92, 1, 0.16, 28), carbon, htAt(-2.85), [0, 0, TILT], [1.06, 1, 0.92]);
  b.put(sweep(line(htAt(-2.05), c, 6), (t) => [mix(0.6, 0.56, t), mix(0.66, 0.62, t)], Z, { seg: 18, sq: 3 }), carbon);   // the stem
  b.put(cylinder(0.96, 0.96, 2.7, 28), carbon, c, [Math.PI / 2, 0, 0]);   // its face plate round the bar, four bolts
  for (const [u, v] of [[0.42, 0.85], [-0.42, 0.85], [0.42, -0.85], [-0.42, -0.85]]) b.put(flatUV(cylinder(0.15, 0.15, 0.16, 10)), metal, add(c, [0.9, u, v]), [0, 0, Math.PI / 2]);
  // the bar, each half from the clamp: round there, a flat wing along the tops, round again through the bend and drops
  const barSec = (p) => { const d = Math.abs(p[2] - ZC), w = smooth(1.9, 2.9, d) * (1 - smooth(7.0, 8.4, d)), r = mix(0.84, 0.64, smooth(1.5, 2.6, d)); return [mix(r, 1.22, w), mix(r, 0.42, w)]; };
  for (const g of [-1, 1]) {
    const pts = spline(BAR.map(([x, y, z]) => add(c, [x, y, g * z])), 6);
    b.put(sweep(pts, (t, i) => barSec(pts[i]), [1, 0, 0], { seg: 20, sq: 2.2, transport: true }), carbon);
    // the tape: from the end of the wing to the drop's end, wound so each turn overlaps the last
    const wrap = pts.slice(pts.findIndex((p) => Math.abs(p[2] - ZC) > 8.3));
    b.put(sweep(wrap, (t) => { const r = mix(0.66, 0.8, smooth(0, 0.035, t)); return [r, r]; }, [1, 0, 0], { seg: 18, sq: 2, transport: true }), tape);
    const e = pts.at(-1), d = nrm(sub(e, pts.at(-2)));
    b.putM(cylinder(0.76, 0.76, 0.2, 20), carbon, toward(add(e, scl(d, -0.06)), add(e, scl(d, 0.14))));   // the end plug
    // the hood: lofted over the bar's forward bend, rising to the horn
    const top = curve([0.45, 0.62, 0.72, 0.85, 1.1, 1.55, 1.85, 1.7, 1.2]), bot = curve([-0.62, -0.8, -1.08, -1.55, -2.2, -2.75, -2.92, -2.72, -2.25]), hw = curve([0.62, 0.88, 0.97, 0.98, 0.96, 0.88, 0.74, 0.58, 0.42]);
    const ends = (t) => Math.sqrt(1 - (1 - clamp01(t / 0.08)) ** 2) * Math.sqrt(1 - (1 - clamp01((1 - t) / 0.1)) ** 2), HP = [], HU = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30, e2 = Math.max(ends(t), 0.02), x = BC[0] + mix(2.3, 6.6, t), ym = BC[1] + (top(t) + bot(t)) / 2, hh = ((top(t) - bot(t)) / 2) * Math.sqrt(e2), zc = ZC + g * mix(10.14, 10.34, t), row = [], ruv = [];
      for (let j = 0; j <= 24; j++) { const a = (j / 24) * Math.PI * 2; row.push([x, ym + hh * sp(Math.sin(a), 2 / 2.6), zc + hw(t) * e2 * sp(Math.cos(a), 2 / 2.8)]); ruv.push([j / 24, t]); }
      HP.push(row); HU.push(ruv);
    }
    b.put(sheet(HP, HU.map((row) => row.map(() => [0.5, 0.25])), [15, 3], sub(HP[15][3], HP[15][15])), rubber);   // plain rubber, off the tyre's tread bands
    // the brake lever down the front of the drop, the shift paddle tucked behind it
    b.put(sweep(spline([[6.15, -1.9], [6.3, -3.3], [6.05, -4.8], [5.4, -6.3], [4.8, -7.25]].map(([x, y], i) => P(BC[0] + x, BC[1] + y, g * mix(10.42, 10.6, i / 4))), 6), (t) => { const q = Math.sqrt(clamp01((1 - t) / 0.05)); return [mix(0.26, 0.2, t) * (0.5 + 0.5 * q), mix(0.55, 0.36, t) * (0.4 + 0.6 * q)]; }, Z, { seg: 14, sq: 2.6 }), carbon);
    b.put(sweep(spline([[5.42, -2.55], [5.47, -3.7], [5.12, -4.8], [4.62, -5.5]].map(([x, y]) => P(BC[0] + x, BC[1] + y, g * 10.06)), 6), (t) => { const q = Math.sqrt(clamp01((1 - t) / 0.06)); return [0.1, 0.3 * (0.4 + 0.6 * q)]; }, Z, { seg: 10, sq: 3 }), carbon);
  }
}

// ---------- the saddle: lofted from the tail (t = 0) to the nose (t = 1), a satin cover over a carbon shell, a relief channel down
// the middle, on oval carbon rails. Its own frame: x along it (nose +x), y up from the shell's base line
const sW = curve([2.9, 3.62, 3.55, 3.0, 2.15, 1.45, 1.08, 0.95, 0.82]), sTop = curve([0.98, 1.12, 1.08, 1.0, 0.94, 0.9, 0.88, 0.86, 0.8]), sBot = curve([0.3, 0.12, 0.05, 0.08, 0.14, 0.2, 0.26, 0.32, 0.4]);
const sEnds = (t) => Math.sqrt(1 - (1 - clamp01(t / 0.07)) ** 2) * Math.sqrt(1 - (1 - clamp01((1 - t) / 0.08)) ** 2);
function saddleAt(t, a) {
  const e = Math.max(sEnds(t), 0.015), c = Math.cos(a), s = Math.sin(a), ym = (sTop(t) + sBot(t)) / 2, hh = ((sTop(t) - sBot(t)) / 2) * Math.sqrt(e);
  const z = sW(t) * e * sp(c, 2 / 2.7), groove = s > 0 ? 0.13 * Math.exp(-((z / 0.48) ** 2)) * smooth(0.25, 0.4, t) * (1 - smooth(0.7, 0.85, t)) : 0;
  return [mix(-7.1, 7.1, t), ym + hh * (s >= 0 ? sp(s, 2 / 2.3) : sp(s, 2 / 4.5)) - groove, z];
}
function seat(b, M) {
  // the aero post out of the collar, and its clamp head with two bolts underneath
  b.put(sweep(line(stAt(26.4), stAt(36.75), 10), (t) => { const q = 0.4 + 0.6 * Math.sqrt(clamp01((1 - t) / 0.03)); return [0.62 * q, 0.95 * q]; }, [0, 0, 1], { seg: 22, sq: 2.4 }), M.carbon);
  b.put(roundedBox({ w: 2.7, h: 0.72, d: 2.4, r: 0.22, seg: 2 }), M.carbon, P(-15.1, 49.85));
  for (const s of [-1, 1]) b.put(flatUV(cylinder(0.18, 0.18, 0.3, 10)), M.metal, P(-15.1 + s * 0.75, 49.36));
  b.frame(P(-15.7, 50.95));
  const loft = (a0, a1, cols) => { const Pp = [], UV = []; for (let i = 0; i <= 72; i++) { const t = i / 72, row = [], ruv = []; for (let j = 0; j <= cols; j++) { row.push(saddleAt(t, mix(a0, a1, j / cols))); ruv.push([j / cols, t]); } Pp.push(row); UV.push(ruv); } return [Pp, UV]; };
  const [cp, cu] = loft(-0.32, Math.PI + 0.32, 30); b.put(sheet(cp, cu, [36, 15], [0, 1, 0]), M.leather);
  const [hp, hu] = loft(Math.PI + 0.32, Math.PI * 2 - 0.32, 14); b.put(sheet(hp, hu, [36, 7], [0, -1, 0]), M.carbon);
  for (const g of [-1, 1]) b.put(sweep(spline([[5.4, 0.62, g * 0.42], [3.2, -0.5, g * 0.8], [1.2, -1.08, g * 0.9], [-1.6, -1.1, g * 0.92], [-3.9, -0.72, g * 1.2], [-5.6, 0.45, g * 1.62]], 6), () => [0.17, 0.21], [0, 0, 1], { seg: 10, sq: 2 }), M.carbon);
  b.frame(null);
}

/// ---------- the chain's path, in 52 × 17: round the ring, the lower jockey, the upper jockey (the S through the cage) and the cog.
// Its pins also say where each sprocket it wraps must have its teeth: `phase` turns a sprocket so the rollers sit in its valleys
function chainPath() {
  const J1 = [RA[0] + 3.4 * Math.cos(-1.4), RA[1] + 3.4 * Math.sin(-1.4)], J2 = [J1[0] + 3.9 * Math.cos(-1.19), J1[1] + 3.9 * Math.sin(-1.19)];
  const pins = evenly(belt([{ c: BB, r: pitchR(52), s: -1 }, { c: J2, r: pitchR(11), s: -1 }, { c: J1, r: pitchR(11), s: 1 }, { c: RA, r: pitchR(17), s: -1 }]), 0.668);
  const phase = (c, T) => { const r = pitchR(T); let s = 0, k = 0; for (const p of pins) if (Math.abs(Math.hypot(p[0] - c[0], p[1] - c[1]) - r) < 0.005) { const a = Math.atan2(p[1] - c[1], p[0] - c[0]) * T; s += Math.sin(a); k += Math.cos(a); } return Math.atan2(s, k) / T; };
  return { J1, J2, pins, phase };
}

// ---------- the drivetrain, in dark gunmetal
function drivetrain(b, M) {
  const { carbon, metal } = M, { J1, J2, pins, phase } = chainPath();
  // the crankset, in the bottom bracket's frame: 52/36 rings on a four-arm spider, hollow arms, the spindle, bearing cups
  b.frame(P(BB[0], BB[1]));
  const arms = [0, 1, 2, 3].map((k) => CRANK + Math.PI / 4 + (k * Math.PI) / 2);
  const tabbed = (n, r0, r1, ph = 0) => Array.from({ length: n }, (_, i) => { const a = ph + (i / n) * Math.PI * 2; let r = r0; for (const s of arms) r -= (r0 - r1) * Math.exp(-((wrapA(a - s) / 0.17) ** 2)); return [r * Math.cos(a), r * Math.sin(a)]; });
  const big = pitchR(52), small = pitchR(36), pr = phase(BB, 52);
  b.put(ringPlate(teeth(52, big - 0.21, big + 0.17, 6, pr), tabbed(312, 4.55, 2.62, pr), 0.2), metal, [0, 0, CHAIN.ring]);
  b.put(ringPlate(teeth(36, small - 0.21, small + 0.17), tabbed(216, 3.25, 2.62), 0.18), metal, [0, 0, 2.08]);
  for (const s of arms) {
    const d = [Math.cos(s), Math.sin(s)];
    b.put(sweep([[d[0] * 0.9, d[1] * 0.9, 2.82], [d[0] * 3.05, d[1] * 3.05, 2.82]], (t) => [0.16, mix(0.44, 0.34, t)], [0, 0, 1], { seg: 10, sq: 3 }), carbon);
    b.put(cylinder(0.4, 0.4, 0.38, 16), carbon, [d[0] * 2.95, d[1] * 2.95, 2.79], [Math.PI / 2, 0, 0]);
    b.put(flatUV(cylinder(0.23, 0.23, 1.12, 12)), metal, [d[0] * 2.95, d[1] * 2.95, 2.48], [Math.PI / 2, 0, 0]);   // the chainring bolt
  }
  const crank = (side) => {
    const a = CRANK + (side > 0 ? 0 : Math.PI), d = [Math.cos(a), Math.sin(a)];
    b.put(sweep([0, 2.5, 5, 7.5, 9.08].map((s) => [d[0] * s, d[1] * s, side * mix(3.32, 3.74, s / 9.08)]), (t) => [mix(0.33, 0.27, t), mix(0.92, 0.6, t)], [0, 0, 1], { seg: 14, sq: 2.6 }), carbon);
    b.put(cylinder(0.64, 0.64, 0.66, 20), carbon, [d[0] * 9.08, d[1] * 9.08, side * 3.74], [Math.PI / 2, 0, 0]);
    return [d[0] * 9.08, d[1] * 9.08];
  };
  const pd = crank(1), pn = crank(-1);
  b.put(cylinder(1.18, 1.18, 0.86, 28), carbon, [0, 0, 3.17], [Math.PI / 2, 0, 0]);
  b.put(cylinder(1.02, 1.02, 0.95, 24), carbon, [0, 0, -3.2], [Math.PI / 2, 0, 0]);
  b.put(flatUV(cylinder(0.6, 0.6, 6.4, 20)), metal, [0, 0, 0], [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) b.put(flatUV(cylinder(1.22, 1.22, 0.28, 28)), metal, [0, 0, s * 2.4], [Math.PI / 2, 0, 0]);
  // clipless road pedals hanging on their spindles: a wide platform, the cleat's hook at the front, the spring clip at the back
  const pedal = (at, side, tilt) => {
    const base = M4.compose(new Array(16), at, side > 0 ? [0, 0, tilt] : [0, Math.PI, tilt], [1, 1, 1]);
    const put = (g, mat, p, r = [0, 0, 0]) => b.putM(g, mat, M4.multiply(new Array(16), base, M4.compose(new Array(16), p, r, [1, 1, 1])));
    put(flatUV(cylinder(0.26, 0.26, 1.5, 12)), metal, [0, 0, 0.75], [Math.PI / 2, 0, 0]);
    put(cylinder(0.56, 0.56, 0.9, 16), carbon, [0, 0, 0.75], [Math.PI / 2, 0, 0]);
    put(roundedBox({ w: 3.3, h: 0.6, d: 2.8, r: 0.26, seg: 2 }), carbon, [0.1, 0, 2.15]);
    put(roundedBox({ w: 0.7, h: 0.6, d: 2.4, r: 0.24, seg: 2 }), carbon, [1.55, 0.36, 2.15], [0, 0, 0.4]);
    put(roundedBox({ w: 0.9, h: 0.46, d: 2.2, r: 0.2, seg: 2 }), carbon, [-1.3, 0.38, 2.15]);
  };
  pedal([pd[0], pd[1], 4.07], 1, -0.22); pedal([pn[0], pn[1], -4.07], -1, 0.3);
  // the cassette, in the rear axle's frame: twelve toothed cogs (11–30) on spacers, a castellated lockring
  b.frame(P(RA[0], RA[1]));
  [11, 12, 13, 14, 15, 16, 17, 19, 21, 24, 27, 30].forEach((T, k) => { const r = pitchR(T), z = 3.3 - 0.184 * k, ph = T === 17 ? phase(RA, 17) : 0; b.put(ringPlate(teeth(T, r - 0.21, r + 0.16, 5, ph), ring2(0.88, T * 5, ph), 0.09), metal, [0, 0, z]); if (k < 11) b.put(ringPlate(ring2(1.36, 40), ring2(0.88, 40), 0.088), metal, [0, 0, z - 0.092]); });
  b.put(ringPlate(teeth(12, 1.06, 1.2, 2), ring2(0.62, 24), 0.12), metal, [0, 0, 3.41]);
  b.frame(null);
  // the chain: pins evenly spaced round the ring, the jockeys and the 17 t cog; outer and inner plates in turn, waisted like the real thing
  const link = (L, rr, w) => { const o = []; for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * Math.PI; o.push([L / 2 + rr * Math.cos(a), rr * Math.sin(a)]); } o.push([0, w]); for (let i = 0; i <= 8; i++) { const a = Math.PI / 2 + (i / 8) * Math.PI; o.push([-L / 2 + rr * Math.cos(a), rr * Math.sin(a)]); } o.push([0, -w]); return o; };
  const outerPlate = fanPlate(link(0.668, 0.2, 0.15), 0.05), innerPlate = fanPlate(link(0.668, 0.185, 0.14), 0.045), pin = flatUV(cylinder(0.085, 0.085, 0.54, 6));
  const cz = (x) => mix(CHAIN.cog, CHAIN.ring, smooth(-24, -8, x));
  pins.forEach((p, k) => {
    const q = pins[(k + 1) % pins.length], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], a = Math.atan2(q[1] - p[1], q[0] - p[0]), outer = k % 2 === 0;
    for (const g of [-1, 1]) b.put(outer ? outerPlate : innerPlate, metal, [m[0], m[1], ZC + cz(m[0]) + g * (outer ? 0.215 : 0.148)], [0, 0, a]);
    b.put(pin, metal, [p[0], p[1], ZC + cz(p[0])], [Math.PI / 2, 0, 0]);
  });
  // the rear derailleur: cage plates either side of two toothed jockeys, the cage pivot, the parallelogram up to the knuckle on the hanger
  const cg = ZC + CHAIN.cog;
  b.put(fanPlate(hull2(J1, 1.45, J2, 1.52), 0.1), carbon, [0, 0, cg + 0.42]);
  b.put(fanPlate(hull2(J1, 1.3, J2, 1.36), 0.08), metal, [0, 0, cg - 0.42]);
  for (const J of [J1, J2]) { const ph = phase(J, 11); b.put(ringPlate(teeth(11, 0.99, 1.33, 5, ph), ring2(0.42, 55, ph), 0.2), metal, [J[0], J[1], cg]); b.put(cylinder(0.34, 0.34, 1.1, 16), carbon, [J[0], J[1], cg], [Math.PI / 2, 0, 0]); }
  const PK = [J1[0] + 0.3, J1[1] + 0.35];
  b.put(cylinder(0.62, 0.62, 1.0, 20), carbon, [PK[0], PK[1], cg + 0.98], [Math.PI / 2, 0, 0]);
  b.put(sweep([P(PK[0], PK[1], CHAIN.cog + 1.1), P(-26.0, 15.5, 3.75), P(-26.75, 16.2, 4.75)], () => [0.36, 0.6], [0, 0, 1], { seg: 12, sq: 3 }), carbon);
  b.put(roundedBox({ w: 1.15, h: 1.5, d: 0.95, r: 0.3, seg: 2 }), carbon, P(-26.85, 16.3, 4.95), [0, 0, -0.35]);
  // the front derailleur on its braze-on: a curved outer plate hugging the big ring, a shorter inner plate, a bridge, the linkage
  const fdPlate = (a0, a1, y0, y1, t, dz) => { const lo = [], hi = []; for (let i = 0; i <= 12; i++) { const a = mix(a1, a0, i / 12), x = BB[0] + 5.92 * Math.cos(a); lo.push([x, BB[1] + 5.92 * Math.sin(a)]); hi.push([x, mix(y1, y0, i / 12)]); } b.put(stripPlate(lo, hi, t), metal, [0, 0, ZC + dz]); };
  fdPlate(1.6, 2.44, 21.05, 20.85, 0.12, 3.02); fdPlate(1.66, 2.2, 20.95, 20.85, 0.08, 1.98);
  b.put(roundedBox({ w: 0.5, h: 0.42, d: 1.12, r: 0.12, seg: 2 }), metal, P(BB[0] + 5.92 * Math.cos(2.2) + 0.2, 20.64, 2.5));
  const s0 = stAt(8.3), sb = 0.45 * Math.exp(-(((8.3 - 9.5) / 5) ** 2));
  b.put(roundedBox({ w: 1.0, h: 1.7, d: 0.5, r: 0.15, seg: 2 }), carbon, [s0[0] + STF[0] * sb, s0[1] + STF[1] * sb, ZC + 0.92], [0, 0, Math.atan2(STD[1], STD[0]) - Math.PI / 2]);
  b.put(roundedBox({ w: 1.7, h: 1.3, d: 2.2, r: 0.3, seg: 2 }), carbon, P(s0[0] + STF[0] * sb - 0.35, 21.75, 2.15), [0, 0, 0.25]);
}

// ---------- one bottle cage on the down tube: two loops that would hug a bottle, a spine on the tube, a cup under the bottle's base
function cage(b, M) {
  const A = htAt(5), B0 = P(-3.9, 15.3), u = nrm(sub(A, B0)), n = [-u[1], u[0], 0], C = lerp3(B0, A, 0.42), z = [0, 0, 1];
  const at = (X, Yp, Zl) => along(C, [u, X], [n, 1.34 + Yp], [z, Zl]);
  const tube = (pts) => b.put(sweep(pts, () => [0.18, 0.18], z, { seg: 10, sq: 2 }), M.carbon);
  for (const g of [-1, 1]) { const pts = [at(-4.35, 0.14, g * 0.36)]; for (let i = 0; i <= 16; i++) { const X = mix(-4.2, 4.0, i / 16), psi = 0.44 + 1.48 * Math.sin((Math.PI * i) / 16); pts.push(at(X, 2.25 - 2.12 * Math.cos(psi), g * 2.12 * Math.sin(psi))); } pts.push(at(4.15, 0.14, g * 0.36)); tube(spline(pts, 3)); }
  tube(spline(Array.from({ length: 9 }, (_, i) => { const psi = mix(-1.05, 1.05, i / 8); return at(-4.5, 2.31 - 2.12 * Math.cos(psi), 2.12 * Math.sin(psi)); }), 3));   // its lowest point clears the tube's crown
  b.put(sweep([at(-4.5, 0.12, 0), at(4.25, 0.12, 0)], () => [0.42, 0.12], z, { seg: 12, sq: 3 }), M.carbon);
  for (const X of [-1.7, 1.7]) b.putM(flatUV(cylinder(0.24, 0.24, 0.1, 12)), M.metal, toward(at(X, 0.2, 0), at(X, 0.3, 0)));
}

// ---------- the wall mount: two walnut pegs out of small walnut plates, cradling the top tube near each end; bronze caps stand
// proud of the pegs as a lip in front of the tube, bronze collars and screws on the plates
function mount(b, M) {
  const A = htAt(1.25), B = stAt(26), d = nrm(sub(B, A)), D = [d[1], -d[0], 0];   // D: up, square to the top tube
  for (const t of [0.22, 0.8]) {
    const r = 0.72, c = along(lerp3(A, B, t), [D, -mix(0.98, 0.8, t) - r - 0.01]), x = c[0], y = c[1];
    b.put(cylinder(r, r, ZC + 1.25 - 0.45, 24), M.walnut, [x, y, (0.45 + ZC + 1.25) / 2], [Math.PI / 2, 0, 0]);
    b.put(cylinder(1.02, 1.02, 0.42, 28), M.bronze, [x, y, ZC + 1.46], [Math.PI / 2, 0, 0]);
    b.put(sphere(1.02, 24, 12), M.bronze, [x, y, ZC + 1.67], [0, 0, 0], [1, 1, 0.28]);
    b.put(cylinder(0.98, 0.98, 0.2, 28), M.bronze, [x, y, 0.55], [Math.PI / 2, 0, 0]);
    b.put(roundedBox({ w: 2.9, h: 3.9, d: 0.45, r: 0.2, seg: 3, uvTopOnly: false }), M.walnut, [x, y - 0.35, 0.225]);
    for (const s of [-1, 1]) b.put(cylinder(0.2, 0.2, 0.1, 12), M.bronze, [x, y - 0.35 + s * 1.35, 0.5], [Math.PI / 2, 0, 0]);
  }
}

/// ---------- the helmet. Its own frame: x forwards, y up, z to its left, the origin in the middle of the rim. The shell is a dome
// over the rim: φ runs round the rim (0 the brow, π/2 the left), t from the rim (0) to the crown (1); the back is drawn out low
// and long (the aero tail). The liner is the same dome drawn in toward the middle of the head
const CROWN = [-0.9, 6.7], HC = [-0.5, 1.5, 0];
function helmRim(f) { const c = Math.cos(f), s = Math.sin(f), back = Math.max(0, -c); return [(c >= 0 ? 6.5 : 7.9) * sp(c, 0.9), -0.85 * Math.abs(s) ** 1.6 + (c > 0 ? 0.35 : 0.75) * c * c, 5.3 * sp(s, 0.85) * (1 - 0.16 * back * back)]; }
function helmAt(f, t, k = 1) {
  const r = helmRim(f), back = Math.max(0, -Math.cos(f)) ** 2, q = Math.cos((t * Math.PI) / 2) ** (0.85 - 0.25 * back), e = Math.sin((t * Math.PI) / 2) ** (0.95 + 0.6 * back);
  const p = [CROWN[0] + (r[0] - CROWN[0]) * q, r[1] + (CROWN[1] - r[1]) * e, r[2] * q];
  return k === 1 ? p : add(HC, scl(sub(p, HC), k));
}
// ten vents, as [φ0, φ1, t0, t1]: two pairs of channels from the brow up toward the crown, a pair at the temples, two pairs of
// exhausts from the tail; they narrow as they climb, as a road helmet's do
const VENTS = [[0.07, 0.24, 0.1, 0.84], [0.38, 0.55, 0.12, 0.64], [1.05, 1.3, 0.24, 0.5], [2.6, 2.79, 0.13, 0.66], [2.92, 3.07, 0.15, 0.78]].flatMap(([a, c, t0, t1]) => [[a, c, t0, t1], [-c, -a, t0, t1]]);
const SPLIT = (g) => [-0.3, -2.5, g * 4.9];   // where the straps meet below each ear (g = 1 the left, -1 the right)
function helmet(b, M) {
  const uniq = (v) => [...new Set(v.map((x) => +x.toFixed(5)))].sort((p, q) => p - q);
  const F = uniq([...Array.from({ length: 97 }, (_, i) => -Math.PI + (i / 96) * Math.PI * 2), ...VENTS.flatMap((v) => [v[0], v[1]])]);
  const T = uniq([...Array.from({ length: 29 }, (_, i) => i / 28), ...VENTS.flatMap((v) => [v[2], v[3]])]);
  const vent = (j, i) => { if (j < 0 || i < 0 || j >= T.length - 1 || i >= F.length - 1) return false; const f = (F[i] + F[i + 1]) / 2, t = (T[j] + T[j + 1]) / 2; return VENTS.some(([a, c, t0, t1]) => f > a && f < c && t > t0 && t < t1); };
  const UVg = T.map((t) => F.map((f) => [(f + Math.PI) / (Math.PI * 2), t])), outer = T.map((t) => F.map((f) => helmAt(f, t))), inner = T.map((t) => F.map((f) => helmAt(f, t, 0.86)));
  // it hangs by its right strap from the right drop, its centre of mass (in the dome) square under that splitter: so the dome swings
  // down and out toward the room, the opening up toward the wall, and the brow turns a little to the room
  const bar = P(BC[0] + 0.7, BC[1] - 6.45, 11.05), rr = 0.95, hang = add(bar, [0, -2.6, rr]);
  const v = sub([-0.6, 2.5, 0], SPLIT(-1)), R3 = [Math.atan2(v[2], -v[1]), -0.35, 0];
  const at = sub(hang, xf(M4.compose(new Array(16), [0, 0, 0], R3, [1, 1, 1]), SPLIT(-1))), Mw = M4.compose(new Array(16), at, R3, [1, 1, 1]);
  b.frame(at, R3);
  b.put(sheet(outer, UVg, [1, 0], sub(outer[1][0], HC), (j, i) => !vent(j, i)), M.gloss);
  b.put(sheet(inner, UVg, [1, 0], sub(HC, inner[1][0]), (j, i) => !vent(j, i)), M.liner);
  // the padded edge round the rim, and the liner's walls inside every vent
  const pos = [], nor = [], uv = [], idx = [];
  const quad = (a, c, d, e, ref) => { let nn = nrm(crs(sub(c, a), sub(d, a))); if (dot(nn, ref) < 0) nn = scl(nn, -1); const s = pos.length / 3; for (const p of [a, c, d, e]) { pos.push(...p); nor.push(...nn); uv.push(0.5, 0.5); } idx.push(s, s + 1, s + 2, s + 1, s + 3, s + 2); };
  for (let i = 0; i < F.length - 1; i++) quad(outer[0][i], outer[0][i + 1], inner[0][i], inner[0][i + 1], [0, -1, 0]);
  for (let j = 0; j < T.length - 1; j++) for (let i = 0; i < F.length - 1; i++) {
    if (!vent(j, i)) continue;
    const mid = scl(add(add(outer[j][i], outer[j][i + 1]), add(outer[j + 1][i], outer[j + 1][i + 1])), 0.25);
    const wall = (r0, c0, r1, c1) => quad(outer[r0][c0], outer[r1][c1], inner[r0][c0], inner[r1][c1], sub(mid, scl(add(outer[r0][c0], outer[r1][c1]), 0.5)));
    if (!vent(j - 1, i)) wall(j, i, j, i + 1);
    if (!vent(j + 1, i)) wall(j + 1, i, j + 1, i + 1);
    if (!vent(j, i - 1)) wall(j, i, j + 1, i);
    if (!vent(j, i + 1)) wall(j, i + 1, j + 1, i + 1);
  }
  b.put(mesh(pos, nor, uv, idx), M.liner);
  // the straps: from anchors inside the rim, under its edge, to a splitter below each ear
  for (const g of [-1, 1]) {
    const S = SPLIT(g);
    for (const a of [helmAt(g * 1.0, 0.05, 0.83), helmAt(g * 2.25, 0.07, 0.83)]) b.put(sweep(spline([a, add(lerp3(a, S, 0.35), [0, -0.25, -g * 0.2]), S], 8), () => [0.03, 0.36], [0, 0, 1], { seg: 8, sq: 4 }), M.leather);
    b.put(roundedBox({ w: 1.0, h: 1.25, d: 0.3, r: 0.12, seg: 2 }), M.leather, S);
  }
  b.frame(null);
  // the right strap runs up the drop's room side, over the tape and down the far side to its buckle half; the left hangs free with the other
  const arc = Array.from({ length: 13 }, (_, k) => { const a = (k / 12) * Math.PI; return [bar[0], bar[1] + rr * Math.sin(a), bar[2] + rr * Math.cos(a)]; });
  b.put(sweep([hang, add(hang, [0, 1.3, 0]), ...arc, add(bar, [0, -1.0, -rr]), add(bar, [0, -1.7, -rr])], () => [0.36, 0.03], [1, 0, 0], { seg: 8, sq: 4 }), M.leather);
  b.put(roundedBox({ w: 1.05, h: 1.45, d: 0.4, r: 0.15, seg: 2 }), M.carbon, add(bar, [0, -2.35, -rr - 0.06]));
  const SL = xf(Mw, SPLIT(1));
  b.put(sweep([SL, add(SL, [0.04, -1.2, -0.06]), add(SL, [0.08, -2.4, -0.09]), add(SL, [0.09, -3.2, -0.1])], () => [0.36, 0.03], [1, 0, 0], { seg: 8, sq: 4 }), M.leather);
  b.put(roundedBox({ w: 1.15, h: 1.6, d: 0.48, r: 0.16, seg: 2 }), M.carbon, add(SL, [0.09, -3.95, -0.1]));
}

/** The bike and its helmet as one Node: origin on the wall surface under the middle of the bike, x along it (front +x), y up from the
 *  tyres' lowest points, +z into the room; nothing behind z = 0. Its materials' painted-in light is listed in userData.dimmable. */
export function buildBike() {
  const root = new Node('bike'), b = batch(), dimmable = [], warm = color('#c7a36a');
  // like the room's furniture: the lamps don't reach the wall, so each material carries its own colour as emissive light, and a warm
  // rim so the black edges read against the plaster under the brass display light
  const mat = (name, hex, o = {}) => { const c = o.color || color(hex), k = o.amb ?? 0.8; const m = new Material({ roughness: 0.5, metalness: 0, receiveShadow: false, fresnel: 0.3, fresnelColor: warm, ...o, color: c, emissive: c.map((v) => v * k), emissiveMap: o.emap || o.map || null }); m.name = name; dimmable.push(m); return m; };
  const M = {
    carbon: mat('carbon', '#18181b', { roughness: 0.44, metalness: 0.12, amb: 0.9, fresnel: 0.34 }),          // satin UD carbon
    gloss: mat('gloss', '#121214', { roughness: 0.16, metalness: 0.2, amb: 0.9, fresnel: 0.4 }),             // rims, hubs, the helmet's shell
    rubber: mat('rubber', '#ffffff', { map: tyreTexture(), mapRepeat: [48, 1], roughness: 0.88, amb: 0.85, fresnel: 0.26 }),   // tyres and hoods
    metal: mat('gunmetal', '#4d4f55', { roughness: 0.3, metalness: 0.8, amb: 0.75, emap: sheenTexture(), fresnel: 0.3 }),
    tape: mat('tape', '#ffffff', { map: tapeTexture(), mapRepeat: [1, 10.8], roughness: 0.82, amb: 0.85, fresnel: 0.26 }),
    leather: mat('leather', '#1a1a1c', { roughness: 0.55, amb: 0.85, fresnel: 0.3 }),                         // the saddle's cover, the webbing
    liner: mat('liner', '#222224', { roughness: 0.95, amb: 0.7, fresnel: 0.16 }),                            // the helmet's foam and padding
    walnut: mat('walnut', '#2a1a0e', { map: grainTexture(), roughness: 0.6, amb: 0.9, fresnel: 0.2 }),
    bronze: mat('bronze', '#8e6a3d', { roughness: 0.35, metalness: 0.85, amb: 0.5, fresnel: 0.3 }),
  };
  wheel(b, M, false, -2.62); wheel(b, M, true, 1.93);
  frame(b, M); cockpit(b, M); seat(b, M); drivetrain(b, M); cage(b, M); mount(b, M); helmet(b, M);
  b.build(root);
  root.userData.dimmable = dimmable;
  return root;
}
