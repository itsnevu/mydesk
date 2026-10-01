// An ergonomic desk chair in the Aeron / Gesture mould: a polished five-star base on twin-wheel casters, a gas lift in a
// telescopic sleeve, a tilt mechanism with paddles, a cushioned seat with a waterfall front, a curved woven-mesh back carried
// by an S-curve spine, a bronze lumbar pad, a headrest on a post and 4D arms.
// The room's lamps hardly reach it, so like the room's furniture every material carries a little painted-in light of its own
// (emissive ≈ its colour). Static parts are merged by material: six draw calls.
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, cylinder, merge } from 'engine/geometry';
import { drawTexture } from 'engine/textures';
import { M4, color } from 'engine/math';

// 1 unit ≈ 19 mm. Origin: the floor under the middle of the base. The sitter faces -z, so the back is on the +z side.
const SEAT = { top: 23.5, z: -1, hw: 13, hd: 12.5 };                       // seat top, centre, half-width (front), half-depth
const TILT = 0.17, HTILT = 0.04;                                            // the back leans ≈ 10°, the headrest stands more upright
const BACK = { y: 27, z: 10.5, h: 31 };                                     // backrest: bottom centre and height along the lean
const U = [0, Math.cos(TILT), Math.sin(TILT)], F = [0, Math.sin(TILT), -Math.cos(TILT)];       // up the back, and its face (towards the sitter)
const HU = [0, Math.cos(HTILT), Math.sin(HTILT)], HF = [0, Math.sin(HTILT), -Math.cos(HTILT)];
const X = [1, 0, 0];

// ---------- a small vector kit
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => scl(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const along = (o, ...terms) => terms.reduce((p, [v, k]) => add(p, scl(v, k)), o);   // o + Σ v·k
const mix = (a, b, t) => a + (b - a) * t, smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- geometry helpers
// raw arrays → engine geometry; normals are area-weighted face normals shared by every vertex at the same spot, so seams, poles and tips shade smoothly
function geo(pos, uv, idx) {
  const keys = [], acc = new Map();
  for (let i = 0; i < pos.length; i += 3) keys.push(`${Math.round(pos[i] * 500)},${Math.round(pos[i + 1] * 500)},${Math.round(pos[i + 2] * 500)}`);
  for (let k = 0; k < idx.length; k += 3) {
    const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3;
    const f = crs([pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]], [pos[c] - pos[a], pos[c + 1] - pos[a + 1], pos[c + 2] - pos[a + 2]]);
    for (const v of [a, b, c]) { const s = acc.get(keys[v / 3]); if (s) { s[0] += f[0]; s[1] += f[1]; s[2] += f[2]; } else acc.set(keys[v / 3], [...f]); }
  }
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i++) { min[i % 3] = Math.min(min[i % 3], pos[i]); max[i % 3] = Math.max(max[i % 3], pos[i]); }
  return { positions: new Float32Array(pos), normals: new Float32Array(keys.flatMap((k) => nrm(acc.get(k) || [0, 1, 0]))), uvs: new Float32Array(uv), indices: pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), bounds: { min, max } };
}

// a grid of points (rows × cols) → triangles, wound so the face at grid cell `at` points along `out` (back faces are culled)
function sheet(P, UV, at, out) {
  const rows = P.length, cols = P[0].length, pos = [], uv = [], idx = [];
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { pos.push(...P[i][j]); uv.push(...UV[i][j]); }
  const [ti, tj] = at, flip = dot(crs(sub(P[ti][tj + 1], P[ti][tj]), sub(P[ti + 1][tj], P[ti][tj])), out) < 0;
  for (let i = 0; i < rows - 1; i++) for (let j = 0; j < cols - 1; j++) {
    const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
    if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  return geo(pos, uv, idx);
}

// a tube swept along a path. `sec(t, i)` gives the half-sizes [a, b] of a superelliptic section (`sq`: 2 = ellipse, higher = squarer),
// `a` measured along `side` (a vector, or a function of the point index), `b` across it
function sweep(path, sec, side, { seg = 14, sq = 2.5, closed = false } = {}) {
  const n = path.length, L = [0], P = [], UV = [];
  for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(...sub(path[i], path[i - 1])));
  for (let i = 0; i < n; i++) {
    const prev = i > 0 ? path[i - 1] : closed ? path[n - 2] : path[i], next = i < n - 1 ? path[i + 1] : closed ? path[1] : path[i];
    const T = nrm(sub(next, prev)), s0 = typeof side === 'function' ? side(i) : side;
    const W = nrm(sub(s0, scl(T, dot(s0, T)))), D = crs(T, W), [a, b] = sec(L[i] / L[n - 1], i), ring = [], ruv = [];
    for (let k = 0; k <= seg; k++) {
      const t = (k / seg) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      ring.push(along(path[i], [W, Math.sign(c) * Math.abs(c) ** (2 / sq) * a], [D, Math.sign(s) * Math.abs(s) ** (2 / sq) * b])); ruv.push([k / seg, L[i] / 8]);
    }
    P.push(ring); UV.push(ruv);
  }
  const m = n >> 1;
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

// a soft slab (seat, seat pan, arm pads): spokes from the middle of a superelliptic outline run over the top surface `top(x, z)`,
// roll over the edge with radius `re` (it can change around the outline: the seat's long soft front roll is its waterfall) and
// come back underneath at `yb`, the underside tucked in by `tuck`. `zn` is the outline's depth position, -1 at the front and 1 at the back.
function slab({ hw, hd, cz = 0, n = 4, top, re, rb = 0.4, yb, tuck = () => 0, NA = 64 }) {
  const P = [], UV = [];
  for (let k = 0; k <= NA; k++) {
    const a = (k / NA) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), r = (Math.abs(c) ** n + Math.abs(s) ** n) ** (-1 / n), zn = s * r;
    const ox = c * r * hw(zn), oz = zn * hd, L = Math.hypot(ox, oz), ux = ox / L, uz = oz / L, e = re(zn), y0 = yb(zn), tk = tuck(zn);
    const yE = top(ux * (L - e), uz * (L - e)), prof = [];
    for (let i = 0; i <= 10; i++) { const p = (L - e) * Math.sin((i / 10) * Math.PI / 2); prof.push([p, top(ux * p, uz * p)]); }
    for (let i = 1; i <= 7; i++) { const f = (i / 7) * Math.PI / 2; prof.push([L - e + e * Math.sin(f), yE - e * (1 - Math.cos(f))]); }
    prof.push([L - tk, y0 + rb]);
    for (let i = 1; i <= 4; i++) { const f = (i / 4) * Math.PI / 2; prof.push([L - tk - rb + rb * Math.cos(f), y0 + rb - rb * Math.sin(f)]); }
    for (let i = 1; i <= 3; i++) prof.push([(L - tk - rb) * (1 - i / 3), y0]);
    // UVs in the outline's own proportions: the top fills σ < 0.84, the roll and the underside unwrap into the outer band (no smeared texels on the edge)
    const arc = [0]; for (let i = 11; i < prof.length; i++) arc.push(arc[arc.length - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
    P.push(prof.map(([p, y]) => [ux * p, y, cz + uz * p])); UV.push(prof.map(([p], i) => { const g = i <= 10 ? (0.84 * p) / (L - e) : 0.84 + (0.16 * arc[i - 10]) / arc[arc.length - 1]; return [0.5 + 0.5 * g * c * r, 0.5 - 0.5 * g * zn]; }));
  }
  return sheet(P, UV, [NA >> 2, 5], [0, 1, 0]);
}

// a closed rounded rectangle in (ξ, s): ξ ∈ [-1, 1] across, s ∈ [0, h] up, corner radii rb (bottom) and rt (top) as [Δξ, Δs]
function outline(h, rb, rt, n = 6) {
  const pts = [], line = (a, b, m) => { for (let i = 0; i < m; i++) pts.push([mix(a[0], b[0], i / m), mix(a[1], b[1], i / m)]); };
  const arc = (c, r, a0) => { for (let i = 0; i < n; i++) { const a = a0 + (i / n) * Math.PI / 2; pts.push([c[0] + Math.cos(a) * r[0], c[1] + Math.sin(a) * r[1]]); } };
  const ms = Math.max(2, Math.round((h - rb[1] - rt[1]) / 1.8));
  line([0, 0], [1 - rb[0], 0], 5); arc([1 - rb[0], rb[1]], rb, -Math.PI / 2);
  line([1, rb[1]], [1, h - rt[1]], ms); arc([1 - rt[0], h - rt[1]], rt, 0);
  line([1 - rt[0], h], [rt[0] - 1, h], 10); arc([rt[0] - 1, h - rt[1]], rt, Math.PI / 2);
  line([-1, h - rt[1]], [-1, rb[1]], ms); arc([rb[0] - 1, rb[1]], rb, Math.PI);
  line([rb[0] - 1, 0], [0, 0], 5); pts.push([0, 0]);
  return pts;
}
// how far across (in ξ) that rounded rectangle reaches at height s
const reach = (h, rb, rt, s) => s < rb[1] ? 1 - rb[0] + rb[0] * Math.sqrt(Math.max(0, 1 - ((rb[1] - s) / rb[1]) ** 2)) : s > h - rt[1] ? 1 - rt[0] + rt[0] * Math.sqrt(Math.max(0, 1 - ((s - h + rt[1]) / rt[1]) ** 2)) : 1;
// the surface normal of a placed panel at (ξ, s), facing the sitter
const normalOf = (at, xi, s) => nrm(crs(sub(at(xi, s + 0.05), at(xi, s - 0.05)), sub(at(xi + 0.01, s), at(xi - 0.01, s))));

// a woven panel in a slim frame: `at(ξ, s)` places the surface; the frame is a loop swept around its outline, its depth along the surface normal
function framed(at, h, rb, rt, { nx = 24, ns = 28, fw = 0.62, fd = 0.8 } = {}) {
  const P = [], UV = [];
  for (let i = 0; i <= ns; i++) {
    const s = h * (0.5 - 0.5 * Math.cos((i / ns) * Math.PI)), m = reach(h, rb, rt, s), row = [];   // rows bunch up at the rounded ends
    for (let j = 0; j <= nx; j++) row.push(at(mix(-m, m, j / nx), s));
    P.push(row); UV.push(row.map((p) => [p[0] / 6, s / 6]));
  }
  const ring = outline(h, rb, rt), sides = ring.map(([xi, s]) => normalOf(at, xi, s));
  return { panel: sheet(P, UV, [ns >> 1, nx >> 1], normalOf(at, 0, h / 2)), frame: sweep(ring.map(([xi, s]) => at(xi, s)), () => [fd, fw], (i) => sides[i], { closed: true, seg: 12, sq: 3 }) };
}

// static parts that share a material become one draw call (as in app/room); `frame` nests the next parts in a local frame (a caster)
function batch() {
  const parts = new Map(); let base = null;
  return {
    frame(p, r = [0, 0, 0]) { base = p ? M4.compose(new Array(16), p, r, [1, 1, 1]) : null; },
    put(g, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
      let m = M4.compose(new Array(16), p, r, s); if (base) m = M4.multiply(new Array(16), base, m);
      const n = [0, 1, 2].flatMap((j) => [0, 1, 2].map((i) => m[j * 4 + i] / (s[j] * s[j])));
      if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push({ geo: g, m, n });
    },
    build(parent) { for (const [mat, list] of parts) { const mesh = new Mesh(merge(list), mat, 'chair:' + mat.name); mesh.castShadow = false; parent.add(mesh); } },
  };
}

// ---------- painted textures
// the seat's knit: a fine weave, light from above on the middle, shade toward the roll, and a welt seam inset from the edge
function seatTexture() {
  let a = 7; const r = () => (a = (a * 16807) % 2147483647) / 2147483647;
  return drawTexture(512, 512, (ctx, w, h) => {
    // the outline at σ = k (the slab's UVs keep its proportions)
    const ring = (k) => { ctx.beginPath(); for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), q = (Math.abs(c) ** 3.6 + Math.abs(s) ** 3.6) ** (-1 / 3.6); ctx.lineTo(w * (0.5 + 0.5 * k * c * q), h * (0.5 + 0.5 * k * s * q)); } };
    ctx.fillStyle = '#22201e'; ctx.fillRect(0, 0, w, h);                       // the roll and the underside: plain, a shade darker
    ctx.save(); ring(0.86); ctx.clip(); ctx.fillStyle = '#2a2725'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 14000; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,240,220'},${0.03 + r() * 0.06})`; ctx.fillRect(r() * w, r() * h, 2.5, 1); }
    const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.18, w / 2, h / 2, w * 0.46); g.addColorStop(0, 'rgba(255,236,210,0.04)'); g.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore();
    // a welt seam just inside the roll
    ring(0.75); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 4; ctx.stroke();
    ring(0.765); ctx.strokeStyle = 'rgba(255,230,200,0.08)'; ctx.lineWidth = 1.5; ctx.stroke();
  });
}
// polished metal has nothing to reflect in this dark corner, so a studio's worth of reflection is painted around each part
// (u runs around every section): a bright band along the tops of the legs, a streak down the lift, dark between
function sheenTexture() {
  return drawTexture(256, 4, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    for (const [u, v] of [[0, 0.4], [0.08, 0.2], [0.17, 0.75], [0.23, 0.9], [0.3, 0.3], [0.4, 0.15], [0.5, 0.35], [0.6, 0.2], [0.7, 0.85], [0.76, 1], [0.82, 0.7], [0.92, 0.25], [1, 0.4]]) g.addColorStop(u, `rgb(${Array(3).fill(Math.round(v * 255))})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }, { repeat: true, srgb: false });
}
// the back's woven mesh: dark strands with open gaps (alpha), so the room shows faintly through it
function weaveTexture() {
  return drawTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(28,25,22,0.4)'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) { ctx.fillStyle = 'rgba(30,27,24,0.95)'; ctx.fillRect(0, y, w, 7); ctx.fillStyle = 'rgba(120,108,94,0.5)'; ctx.fillRect(0, y + 1, w, 1.5); }
    for (let x = 0; x < w; x += 8) { ctx.fillStyle = 'rgba(20,18,16,0.75)'; ctx.fillRect(x, 0, 2, h); }
  }, { repeat: true });
}

// ---------- the shapes
const seatHw = (zn) => SEAT.hw - 0.8 * (zn + 1);                            // a trapezoid: narrower at the back
const seatTop = (x, z) => { const XN = x / SEAT.hw, Z = z / SEAT.hd; return SEAT.top + 0.22 * XN * XN - 0.42 * Math.exp(-((XN / 0.55) ** 2) - ((Z - 0.2) / 0.55) ** 2) - 0.55 * smooth(-0.35, -1.05, Z) + 0.15 * smooth(0.5, 1, Z); };
const frontness = (zn) => smooth(0.25, 0.85, -zn);
// the backrest: x across, s up along the lean. A shield: narrow at the waist, broad at the shoulders, the top edge arched;
// the sides wrap forward, the lumbar swells towards the sitter, the top eases back
const backHw = (s) => 9.6 + 2.6 * smooth(2, 22, s) - 0.5 * smooth(24, BACK.h, s);
const backAt = (xi, s) => {
  const x = xi * backHw(s), arch = 1 - xi * xi, se = s + 1.2 * arch * smooth(BACK.h * 0.75, BACK.h, s) - 0.6 * arch * (1 - smooth(0, 4, s));
  return along([x, BACK.y, BACK.z], [U, se], [F, Math.exp(-(((se - 8) / 6) ** 2)) - 0.7 * smooth(BACK.h * 0.5, BACK.h, se) ** 2 + 2.6 * (x / 12) ** 2]);
};
const H0 = along([0, BACK.y, BACK.z], [U, BACK.h + 2.5], [F, 0.4]);       // bottom centre of the headrest (its frame tops out ≈ 65.8)
const headAt = (xi, s) => { const x = xi * 7.2; return along(H0, [X, x], [HU, s], [HF, 1.9 * (x / 7.2) ** 2]); };

/** A Node with its origin on the floor under the middle of the base, the seat facing -z. 1 unit ≈ 1.9 cm (the seat top sits ≈ 23.5 up). */
export function buildChair() {
  const chair = new Node('chair'), b = batch(), dimmable = [];
  // like the room's furniture: the lamps barely reach the chair, so each material carries some of its own colour as emissive light
  const mat = (name, hex, o = {}) => { const c = o.color || color(hex), k = o.amb ?? 0.6; const m = new Material({ roughness: 0.6, metalness: 0, receiveShadow: false, ...o, color: c, emissive: c.map((v) => v * k), emissiveMap: o.emap || o.map || null }); m.name = name; dimmable.push(m); return m; };
  const rim = color('#a08a70'), sheen = sheenTexture();
  const graphite = mat('graphite', '#1d1a17', { roughness: 0.45, metalness: 0.15, amb: 0.8, fresnel: 0.06, fresnelColor: rim });
  const soft = mat('soft', '#171513', { roughness: 0.8, amb: 0.7, fresnel: 0.05, fresnelColor: rim });
  const alu = mat('alu', '#9a948c', { roughness: 0.22, metalness: 0.85, amb: 0.85, emap: sheen });
  const bronze = mat('bronze', '#8e6a3d', { roughness: 0.34, metalness: 0.85, amb: 0.7, emap: sheen });
  const fabric = mat('fabric', '#ffffff', { color: [0.86, 0.86, 0.86], map: seatTexture(), roughness: 0.85, amb: 0.75, fresnel: 0.05, fresnelColor: rim });
  const weave = mat('weave', '#ffffff', { color: [0.9, 0.88, 0.86], map: weaveTexture(), roughness: 0.6, amb: 0.75, transparent: true, doubleSide: true });

  // ---------- base: five polished legs sloping down from the hub to twin-wheel casters, which trail forward (the chair was pulled back)
  b.put(cylinder(2.1, 2.75, 3.6, 28), alu, [0, 6, 0]);
  [0.3, -0.5, 0.7, -0.2, 1.0].forEach((yaw, k) => {
    const a = -Math.PI / 2 + (k / 5) * Math.PI * 2, d = [Math.cos(a), 0, Math.sin(a)];
    const leg = spline([[0.5, 6.7], [3, 6.6], [7, 5.9], [11, 5], [14.2, 4.35], [15.6, 4.15], [16.5, 4.1]].map(([r, y]) => [d[0] * r, y, d[2] * r]), 6);
    b.put(sweep(leg, (t) => { const q = Math.sqrt(1 - (1 - Math.min(1, (1 - t) / 0.035)) ** 2); return [mix(1.3, 0.95, t) * q, mix(1.2, 0.68, t) * q]; }, [-d[2], 0, d[0]], { seg: 16, sq: 2.6 }), alu);
    b.put(cylinder(0.6, 0.7, 1.3, 14), graphite, [d[0] * 15.6, 3.3, d[2] * 15.6]);
    b.frame([d[0] * 15.6, 0, d[2] * 15.6], [0, Math.PI + yaw, 0]);
    // twin wheels under a rounded hood, the stem rising from its front into the leg
    for (const w of [-1, 1]) { b.put(cylinder(1.28, 1.28, 0.62, 20), soft, [w * 0.62, 1.28, 0.7], [0, 0, Math.PI / 2]); b.put(cylinder(0.42, 0.42, 0.08, 14), alu, [w * 0.96, 1.28, 0.7], [0, 0, Math.PI / 2]); }
    b.put(roundedBox({ w: 1.5, h: 1.75, d: 2.4, r: 0.7, seg: 3 }), graphite, [0, 2.05, 0.6]);
    b.put(cylinder(0.32, 0.32, 1, 10), graphite, [0, 3.1, 0]);
    b.frame(null);
  });
  // ---------- gas lift: the chrome cylinder rises out of a two-stage telescopic sleeve into a collar under the mechanism
  b.put(cylinder(1.78, 1.86, 2.8, 24), graphite, [0, 9.2, 0]); b.put(cylinder(1.92, 1.92, 0.22, 24), graphite, [0, 10.5, 0]);
  b.put(cylinder(1.6, 1.66, 2.6, 24), graphite, [0, 11.9, 0]); b.put(cylinder(1.74, 1.74, 0.2, 24), graphite, [0, 13.1, 0]);
  b.put(cylinder(1.18, 1.18, 5.2, 28), alu, [0, 15.6, 0]);
  b.put(cylinder(1.55, 1.55, 0.5, 24), graphite, [0, 18, 0]);
  // ---------- tilt mechanism: the box under the seat, a tension knob at the front, paddles each side (height right, tilt lock left)
  b.put(roundedBox({ w: 10.5, h: 2.6, d: 12.5, r: 0.7, seg: 3, taper: 1.05 }), graphite, [0, 19.3, 0.6]);
  b.put(cylinder(0.85, 0.85, 1.4, 16), graphite, [0, 18.9, -6.2], [Math.PI / 2, 0, 0]);
  for (const sx of [-1, 1]) {
    b.put(roundedBox({ w: 3.4, h: 0.3, d: 0.8, r: 0.12, seg: 2 }), graphite, [sx * 6.8, 19, -3.2], [0, sx * 0.25, -sx * 0.12]);
    b.put(roundedBox({ w: 2, h: 0.42, d: 1.3, r: 0.2, seg: 2 }), bronze, [sx * 8.8, 18.75, -3.75], [0, sx * 0.25, -sx * 0.12]);
  }
  // ---------- seat: a dished cushion with a waterfall front on a slimmer pan
  b.put(slab({ hw: seatHw, hd: SEAT.hd, cz: SEAT.z, n: 3.6, top: seatTop, re: (zn) => mix(1.1, 1.75, frontness(zn)), rb: 0.45, tuck: (zn) => mix(0.55, 0.25, frontness(zn)), yb: (zn) => mix(21.85, 20.8, frontness(zn)), NA: 72 }), fabric);
  b.put(slab({ hw: (zn) => seatHw(zn) - 1.3, hd: SEAT.hd - 1.3, cz: SEAT.z + 0.3, n: 3.6, top: () => 21.8, re: () => 0.4, rb: 0.3, yb: () => 20.7, NA: 48 }), graphite);
  // ---------- back: a woven panel in a slim frame, a bronze lumbar pad across its lower back
  const back = framed(backAt, BACK.h, [0.36, 4], [0.5, 6]);
  b.put(back.panel, weave); b.put(back.frame, graphite);
  // the pad rides on the spine (it slides up and down it), following the wrap of the mesh in front of it, its ends rounded off
  const lx = Array.from({ length: 29 }, (_, i) => -0.74 * Math.cos((i / 28) * Math.PI)), ln = lx.map((xi) => normalOf(backAt, xi, 8));
  b.put(sweep(lx.map((xi, i) => add(backAt(xi, 8), scl(ln[i], -0.62))), (t, i) => { const k = Math.sqrt(Math.max(0, 1 - Math.max(0, (Math.abs(lx[i]) - 0.5) / 0.24) ** 2)); return [0.28 * Math.sqrt(k), 1.2 * k]; }, (i) => ln[i], { seg: 12, sq: 3 }), bronze);
  // ---------- spine: out of the mechanism, back and up in an S, then up behind the mesh, where it forks into a Y that holds the frame at the shoulders
  const behindAt = (xi, s, k) => add(backAt(xi, s), scl(normalOf(backAt, xi, s), -k)), behind = (s, k) => behindAt(0, s, k);
  const spine = spline([[0, 19.4, 3], [0, 19.3, 8.2], [0, 20.2, 12.6], [0, 22.6, 14.6], behind(1, 1.75), behind(6, 1.75), behind(9.5, 1.74), behind(13, 1.7)], 6);
  b.put(sweep(spine, (t) => { const q = Math.sqrt(Math.min(1, (1 - t) / 0.012)); return [mix(1.2, 0.85, smooth(0.4, 1, t)) * q, mix(0.78, 0.6, t) * q]; }, X, { seg: 16, sq: 3 }), graphite);
  for (const sx of [-1, 1]) {
    const fork = spline([[0, 11.5, 1.72], [0.2, 15, 1.62], [0.52, 19.5, 1.4], [0.84, 23.5, 1.05], [0.99, 25.2, 0.7]].map(([xi, s, k]) => behindAt(xi * sx, s, k)), 6), fn = fork.map((p, i) => normalOf(backAt, mix(0, 0.99, i / (fork.length - 1)) * sx, mix(11.5, 25.2, i / (fork.length - 1))));
    b.put(sweep(fork, (t) => { const q = Math.sqrt(Math.min(1, (1 - t) / 0.02)); return [mix(0.5, 0.36, t) * q, mix(0.78, 0.45, t) * q]; }, (i) => fn[i], { seg: 12, sq: 3 }), graphite);
  }
  b.put(roundedBox({ w: 3.4, h: 2, d: 1.4, r: 0.45, seg: 2 }), graphite, behind(1.2, 1), [TILT, 0, 0]);
  // ---------- headrest: a small curved mesh pad on a slim blade that slides in a sleeve on the top of the frame
  const head = framed(headAt, 5.2, [0.3, 2.2], [0.3, 2.2], { nx: 16, ns: 10, fw: 0.5, fd: 0.65 });
  b.put(head.panel, weave); b.put(head.frame, graphite);
  b.put(sweep(spline([behind(BACK.h - 2.8, 1.15), behind(BACK.h, 1.2), add(headAt(0, 0.5), scl(HF, -1.1)), add(headAt(0, 2.6), scl(HF, -1))], 6), () => [0.62, 0.3], X, { seg: 12, sq: 3 }), graphite);
  b.put(roundedBox({ w: 2.4, h: 3.4, d: 1.3, r: 0.45, seg: 2 }), graphite, behind(BACK.h - 1.6, 1.05), [TILT, 0, 0]);
  b.put(roundedBox({ w: 2.1, h: 2.6, d: 1.1, r: 0.4, seg: 2 }), graphite, add(headAt(0, 2.6), scl(HF, -1.05)), [HTILT, 0, 0]);
  // ---------- 4D arms: a polished bracket from under the seat, a height column, a soft pad (top ≈ 33, below the desk's underside)
  const pad = slab({ hw: () => 1.95, hd: 5.4, n: 3.2, top: (x, z) => 33.3 - 0.12 * (x / 1.95) ** 2 - 0.15 * (z / 5.4) ** 2, re: () => 0.65, rb: 0.35, yb: () => 31.8, NA: 40 });
  for (const sx of [-1, 1]) {
    const br = spline([[4.5, 19.9, 2.5], [9.5, 19.9, 2.5], [12.6, 20.3, 2.5], [14.1, 21.8, 2.5], [14.6, 24, 2.5], [14.6, 25.8, 2.5]].map(([x, y, z]) => [x * sx, y, z]), 5);
    b.put(sweep(br, () => [1.25, 0.5], [0, 0, 1], { seg: 12, sq: 3 }), alu);
    b.put(roundedBox({ w: 1.5, h: 0.9, d: 2.8, r: 0.3, seg: 2 }), graphite, [14.6 * sx, 25.8, 2.5]);   // the socket, then the chrome height column, then its housing
    b.put(cylinder(0.5, 0.5, 1.6, 16), alu, [14.6 * sx, 26.9, 2.5]);
    b.put(roundedBox({ w: 1.5, h: 4.6, d: 2.3, r: 0.5, seg: 3 }), graphite, [14.6 * sx, 29.7, 2.5]);
    b.put(cylinder(0.3, 0.3, 0.2, 12), bronze, [15.35 * sx, 30.6, 2.5], [0, 0, Math.PI / 2]);
    b.put(pad, soft, [14.6 * sx, 0, 2.2], [0, 0.08 * sx, 0]);
  }
  b.build(chair);
  chair.userData.dimmable = dimmable;   // the painted-in light lives in each material's `emissive`, should the room want to dim it with its own
  return chair;
}
