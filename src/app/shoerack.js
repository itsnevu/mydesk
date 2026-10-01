// The shoe rack by the door, on the floor against the front wall: a walnut rack of two slatted tiers on four square legs. On the
// top tier a pair of running shoes tells the story quietly (Navy runs: the finisher medals hang across the room), a folded pair of
// running socks beside them; on the bottom tier, a hand off the floor, a pair of sandal jepit (the Indonesian flip-flop: a white
// rubber footbed on a navy sole, a thin navy Y strap on a toe post), with room to spare. Nothing carries a brand or a logo.
// The rack: legs 1.4 square, front, back and side rails flush with the slats at each tier, six slats a tier with rounded edges and
// small gaps, their through-tenons showing as end grain on the side rails.
// The shoes are sculpted rather than boxed. The upper is lofted over a last: meridians run from the bite line up to a spine down the
// middle of the foot, straight across on the sides and fanning round the heel and the toe, cut open at the collar and along the
// throat. A padded collar rolls round the opening; an engineered knit (painted courses, a perforated toe box), a smooth heel cup, a
// padded tongue, flat laces criss-crossed through six pairs of eyelets and tied in a bow, a coral pull loop at the heel. The sole: a
// thick white foam midsole with a rocker (toe spring), a flared heel and a fine coral line, on a dark outsole with a hint of tread.
// The pair sits naturally, the left shoe a little turned out.
// This wall gets little real light, so every material paints in its own (its colour as emissive, which the room scales through
// `dimmable`), with a warm rim on the wood and the shoes, and a soft contact shadow is painted on the slats under everything that
// rests on them. Static parts merge by material: five draw calls, and a sixth (transparent) for the shadows.
// 1 unit = 19 mm. Local frame: origin on the floor at the middle of the rack's back edge (the wall line), y up, +z out into the room,
// x along the wall. The rack is 34 wide and 15 deep; its top tier is 16 up and the shoes reach about 23.5.
import { Node, Mesh, Material } from 'engine/scene';
import { merge } from 'engine/geometry';
import { drawTexture } from 'engine/textures';
import { M4, color } from 'engine/math';

const PI = Math.PI, TAU = PI * 2;

// ---------- the rack
const LEG = 1.4, LEG_X = 16.3, LEG_ZB = 2.0, LEG_ZF = 15.6;          // leg centres: the rear legs' backs at z 1.3 clear the skirting (1 deep)
const TIERS = [{ y: 3.6, rail: 1.4 }, { y: 16.0, rail: 1.7 }];      // each tier's top (slats and rails flush) and the depth of its rails
const RAIL = 1.0;                                                   // rails 1 thick, set 0.2 in from the legs' faces
const SLATS = 6, SLAT_W = 1.5, SLAT_T = 0.75;
const SZ0 = LEG_ZB + RAIL / 2, SZ1 = LEG_ZF - RAIL / 2, SGAP = (SZ1 - SZ0 - SLATS * SLAT_W) / (SLATS + 1);
const slatZ = (i) => SZ0 + SGAP + SLAT_W / 2 + i * (SLAT_W + SGAP);
// where things sit: a shoe's frame has its heel's back at z 0 and the flat of its sole on y 0 (the pivot is the middle of its length)
const SHOE_AT = [{ x: -8.95, z: 9.45, yaw: 0, right: true }, { x: -2.75, z: 9.3, yaw: 0.1, right: false }];
const FLIP_AT = [{ x: 3.7, z: 8.8, yaw: -0.05, right: true }, { x: 9.55, z: 8.55, yaw: 0.13, right: false }];
const SOCKS_AT = { x: 8.9, z: 8.6, yaw: -0.2 };

// ---------- a small vector kit
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]), nrm = (a) => { const l = len(a); return l > 1e-12 ? scl(a, 1 / l) : [0, 1, 0]; };
const mix = (a, b, t) => a + (b - a) * t, clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const se = (c, p) => Math.sign(c) * Math.abs(c) ** p;   // a signed power: superellipse outlines and sections
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// a smooth function through (x, y) knots (cubic Hermite with Catmull-Rom slopes), held level past the ends
function spline1(k) {
  const n = k.length, m = k.map((p, i) => { const a = k[Math.max(0, i - 1)], b = k[Math.min(n - 1, i + 1)]; return (b[1] - a[1]) / (b[0] - a[0]); });
  return (x) => {
    if (x <= k[0][0]) return k[0][1];
    if (x >= k[n - 1][0]) return k[n - 1][1];
    let i = 0; while (x > k[i + 1][0]) i++;
    const h = k[i + 1][0] - k[i][0], t = (x - k[i][0]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * k[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (3 * t2 - 2 * t3) * k[i + 1][1] + (t3 - t2) * h * m[i + 1];
  };
}
// a smooth curve through 3D points (centripetal Catmull-Rom: no loops where they bunch up), at most `step` apart
function spline3(pts, step = 0.25) {
  const out = [pts[0]], kt = (a, b) => Math.sqrt(len(sub(b, a))) || 1e-4;
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i], p2 = pts[i + 1], p0 = i > 0 ? pts[i - 1] : sub(scl(p1, 2), p2), p3 = i + 2 < pts.length ? pts[i + 2] : sub(scl(p2, 2), p1);
    const t1 = kt(p0, p1), t2 = t1 + kt(p1, p2), t3 = t2 + kt(p2, p3), n = Math.max(2, Math.ceil(len(sub(p2, p1)) / step));
    for (let k = 1; k <= n; k++) {
      const t = t1 + (t2 - t1) * (k / n), L = (a, b, ta, tb) => add(scl(a, (tb - t) / (tb - ta)), scl(b, (t - ta) / (tb - ta)));
      const A1 = L(p0, p1, 0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
      out.push(L(L(A1, A2, 0, t2), L(A2, A3, t1, t3), t1, t2));
    }
  }
  return out;
}

// ---------- geometry kit
function geo(pos, nor, uv, idx) {
  idx = idx.filter((_, i, a) => { const t = i - (i % 3); return len(faceN(pos, a[t], a[t + 1], a[t + 2])) > 1e-7; });   // (drop triangles that collapse: a tube tapered to nothing)
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i++) { const k = i % 3; if (pos[i] < min[k]) min[k] = pos[i]; if (pos[i] > max[k]) max[k] = pos[i]; }
  return { positions: new Float32Array(pos), normals: new Float32Array(nor), uvs: new Float32Array(uv), indices: pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), bounds: { min, max } };
}
const faceN = (p, a, b, c) => crs([p[b * 3] - p[a * 3], p[b * 3 + 1] - p[a * 3 + 1], p[b * 3 + 2] - p[a * 3 + 2]], [p[c * 3] - p[a * 3], p[c * 3 + 1] - p[a * 3 + 1], p[c * 3 + 2] - p[a * 3 + 2]]);
// every triangle wound to face along its vertex normals (back faces are culled): for parts whose normals are known exactly
function wind(pos, nor, idx) {
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t], b = idx[t + 1], c = idx[t + 2], f = faceN(pos, a, b, c);
    if (f[0] * (nor[a * 3] + nor[b * 3] + nor[c * 3]) + f[1] * (nor[a * 3 + 1] + nor[b * 3 + 1] + nor[c * 3 + 1]) + f[2] * (nor[a * 3 + 2] + nor[b * 3 + 2] + nor[c * 3 + 2]) < 0) { idx[t + 1] = c; idx[t + 2] = b; }
  }
}
const pack = (pos, nor, uv, idx) => { wind(pos, nor, idx); return geo(pos, nor, uv, idx); };
// area-weighted face normals shared by every vertex at the same spot (so seams, poles and tips shade smoothly)
function smoothNormals(pos, idx) {
  const keys = [], acc = new Map();
  for (let i = 0; i < pos.length; i += 3) keys.push(`${Math.round(pos[i] * 2000)},${Math.round(pos[i + 1] * 2000)},${Math.round(pos[i + 2] * 2000)}`);
  for (let t = 0; t < idx.length; t += 3) {
    const f = faceN(pos, idx[t], idx[t + 1], idx[t + 2]);
    for (let k = 0; k < 3; k++) { const s = acc.get(keys[idx[t + k]]); if (s) { s[0] += f[0]; s[1] += f[1]; s[2] += f[2]; } else acc.set(keys[idx[t + k]], [...f]); }
  }
  return keys.flatMap((k) => nrm(acc.get(k) || [0, 1, 0]));
}
// a grid of points (rows of columns) made a smooth sheet, turned to face out(p, row); cells that collapse (poles, a closed tip) are dropped
function sheet(P, UV, out) {
  const rows = P.length, cols = P[0].length, pos = [], uv = [], idx = [];
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { pos.push(...P[i][j]); uv.push(...UV[i][j]); }
  let score = 0;
  for (let i = 0; i < rows - 1; i++) for (let j = 0; j < cols - 1; j++) {
    const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
    for (const [x, y, z] of [[a, b, c], [b, d, c]]) {
      const f = faceN(pos, x, y, z), l = len(f);
      if (l < 1e-9) continue;
      idx.push(x, y, z);
      score += dot(scl(f, 1 / l), nrm(out(P[i][j], i)));
    }
  }
  if (score < 0) for (let t = 0; t < idx.length; t += 3) { const x = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = x; }
  return geo(pos, smoothNormals(pos, idx), uv, idx);
}
// a tube along a path: frame(i) gives two directions across it (squared up to the path), sec(i) the half sizes [a, b] along them;
// the section is a superellipse (sq 2: an ellipse; higher: squarer). uv(s, k, i): s the length along the path, k round the section
function tube(path, frame, sec, { seg = 8, sq = 2, uv = (s, k) => [s, k / seg] } = {}) {
  const n = path.length, pos = [], nor = [], uvs = [], idx = []; let s = 0;
  for (let i = 0; i < n; i++) {
    if (i) s += len(sub(path[i], path[i - 1]));
    const T = nrm(sub(path[Math.min(i + 1, n - 1)], path[Math.max(i - 1, 0)])), [A0, B0] = frame(i), [a, b] = sec(i);
    const A = nrm(sub(A0, scl(T, dot(A0, T)))); let B = crs(T, A); if (dot(B, B0) < 0) B = scl(B, -1);
    for (let k = 0; k <= seg; k++) {
      const t = (k / seg) * TAU, pc = se(Math.cos(t), 2 / sq), ps = se(Math.sin(t), 2 / sq);
      pos.push(...add(path[i], add(scl(A, pc * a), scl(B, ps * b))));
      nor.push(...nrm(add(scl(A, se(pc, sq - 1) / Math.max(a, 1e-4)), scl(B, se(ps, sq - 1) / Math.max(b, 1e-4)))));
      uvs.push(...uv(s, k, i));
    }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < seg; k++) { const p = i * (seg + 1) + k, q = p + seg + 1; idx.push(p, q, p + 1, p + 1, q, q + 1); }
  return pack(pos, nor, uvs, idx);
}
// a closed soft solid: a superellipsoid (p1 squares its outline, p2 its edge), its underside flattened to rest on y 0
function pillow({ rx, ry, rz, p1 = 1, p2 = 1, flat = 1, na = 32, ne = 12, uv = (u, v) => [u, v] }) {
  const P = [], UV = [], lift = ry * flat;
  for (let i = 0; i <= ne; i++) {
    const e = -PI / 2 + (i / ne) * PI, ce = se(Math.cos(e), p2), sy = se(Math.sin(e), p2) * (e < 0 ? flat : 1), row = [], ruv = [];
    for (let j = 0; j <= na; j++) { const a = (j / na) * TAU, p = [rx * ce * se(Math.cos(a), p1), lift + ry * sy, rz * ce * se(Math.sin(a), p1)]; row.push(p); ruv.push(uv(j / na, i / ne, p)); }
    P.push(row); UV.push(ruv);
  }
  return sheet(P, UV, (p) => sub(p, [0, lift, 0]));
}
// carry a part into place: positions by m, normals by its cofactor matrix (the inverse transpose times the determinant, its columns
// the cross products of m's columns; the length is normalised away). Worked out here rather than taken from M4.normalFromMat4,
// which returns the inverse of the 3x3, not its transpose
function xform(g, m) {
  const a0 = [m[0], m[1], m[2]], a1 = [m[4], m[5], m[6]], a2 = [m[8], m[9], m[10]], n = [...crs(a1, a2), ...crs(a2, a0), ...crs(a0, a1)];
  const p = g.positions, q = g.normals, P = new Float32Array(p.length), N = new Float32Array(q.length);
  for (let i = 0; i < p.length; i += 3) {
    const x = p[i], y = p[i + 1], z = p[i + 2], a = q[i], b = q[i + 1], c = q[i + 2];
    P[i] = m[0] * x + m[4] * y + m[8] * z + m[12]; P[i + 1] = m[1] * x + m[5] * y + m[9] * z + m[13]; P[i + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    const nx = n[0] * a + n[3] * b + n[6] * c, ny = n[1] * a + n[4] * b + n[7] * c, nz = n[2] * a + n[5] * b + n[8] * c, l = Math.hypot(nx, ny, nz) || 1;
    N[i] = nx / l; N[i + 1] = ny / l; N[i + 2] = nz / l;
  }
  return { ...g, positions: P, normals: N };
}
// the other foot: x mirrored, so every triangle turns over too
function mirrorX(g) {
  const P = new Float32Array(g.positions), N = new Float32Array(g.normals), I = g.indices.slice();
  for (let i = 0; i < P.length; i += 3) { P[i] = -P[i]; N[i] = -N[i]; }
  for (let t = 0; t < I.length; t += 3) { const x = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = x; }
  return { ...g, positions: P, normals: N, indices: I };
}
// a straight walnut member with a rounded-rectangle section (w across z, h up y, edge radius r) along x, centred, capped at both
// ends. u runs along it (the grain), v round its section
function member(L, w, h, r, { seg = 3, u0 = 0, v0 = 0, uS = 1 / 26, vS = 1 / 11, endGrain = false } = {}) {
  const prof = [], cz = w / 2 - r, cy = h / 2 - r;
  for (const [sz, sy, a0] of [[1, 1, 0], [-1, 1, PI / 2], [-1, -1, PI], [1, -1, 1.5 * PI]]) for (let k = 0; k <= seg; k++) { const a = a0 + (k / seg) * (PI / 2); prof.push([sz * cz + r * Math.cos(a), sy * cy + r * Math.sin(a), Math.cos(a), Math.sin(a)]); }
  prof.push(prof[0]);
  const pos = [], nor = [], uv = [], idx = []; let arc = 0;
  prof.forEach((p, k) => { if (k) arc += Math.hypot(p[0] - prof[k - 1][0], p[1] - prof[k - 1][1]); for (const x of [-L / 2, L / 2]) { pos.push(x, p[1], p[0]); nor.push(0, p[3], p[2]); uv.push(u0 + (x + L / 2) * uS, v0 + arc * vS); } });
  for (let k = 0; k < prof.length - 1; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const m = prof.length - 1;
  for (const sx of [-1, 1]) {
    // the ends: cut across the grain (the strip of end grain along the canvas's top) where they show, face grain where they are hidden in a joint
    const cap = (z, y) => (endGrain ? [u0 + 0.31 + z * 0.05, 0.976 + y * 0.012] : [u0 + 0.31 + z * vS, v0 + 0.07 + y * vS]);
    const c = pos.length / 3; pos.push((sx * L) / 2, 0, 0); nor.push(sx, 0, 0); uv.push(...cap(0, 0));
    for (let k = 0; k < m; k++) { pos.push((sx * L) / 2, prof[k][1], prof[k][0]); nor.push(sx, 0, 0); uv.push(...cap(prof[k][0], prof[k][1])); }
    for (let k = 0; k < m; k++) idx.push(c, c + 1 + k, c + 1 + ((k + 1) % m));
  }
  return pack(pos, nor, uv, idx);
}
// column-major placements: a member along x, along z, or standing up y
const alongX = (p) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, p[0], p[1], p[2], 1];
const alongZ = (p) => [0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0, p[0], p[1], p[2], 1];
const alongY = (p) => [0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, p[0], p[1], p[2], 1];
// a thing set down on a tier: turned by yaw about its middle (pivot along its own z), its middle at (x, y, z)
const setDown = (x, y, z, yaw, pivot) => M4.multiply(new Array(16), M4.compose(new Array(16), [x, y, z], [0, yaw, 0], [1, 1, 1]), M4.compose(new Array(16), [0, 0, -pivot], [0, 0, 0], [1, 1, 1]));

// ---------- footprints. A plan outline traced round a foot, q running 0..5: from the heel's back (0) round its outer side (1), along
// the outer side (2), round the toe (3), back along the inner side (4) and round the heel's inner side to the back again (5 = 0).
// Each point starts a meridian: from the outline (B) in toward a spine down the middle of the foot (Q), straight across on the
// sides, fanning round the heel and the toe caps, whose centres are the spine's ends. A left foot: its outer side toward +x
function outline(o) {
  return (q) => {
    q = ((q % 5) + 5) % 5;
    let Q, B, kind, a = 0;
    if (q < 1 || q >= 4) {
      a = q < 1 ? q * (PI / 2) : (q - 5) * (PI / 2);   // 0 at the back, +pi/2 the outer side, -pi/2 the inner
      const w = a >= 0 ? o.wl(o.zh) : o.wm(o.zh);
      Q = [o.xs(o.zh), o.zh]; B = [Q[0] + se(Math.sin(a), 2 / o.nh) * w, o.zh - se(Math.cos(a), 2 / o.nh) * o.rzh]; kind = 0;
    } else if (q < 2) { const z = mix(o.zh, o.zt, q - 1); Q = [o.xs(z), z]; B = [Q[0] + o.wl(z), z]; kind = 1; }
    else if (q < 3) {
      a = (q - 2) * PI; const lat = a <= PI / 2, n = lat ? o.nl : o.nm, w = lat ? o.wl(o.zt) : o.wm(o.zt);
      Q = [o.xs(o.zt), o.zt]; B = [Q[0] + se(Math.cos(a), 2 / n) * w, o.zt + se(Math.sin(a), 2 / n) * o.rzt]; kind = 2;
    } else { const z = mix(o.zt, o.zh, q - 3); Q = [o.xs(z), z]; B = [Q[0] - o.wm(z), z]; kind = 3; }
    const dx = B[0] - Q[0], dz = B[1] - Q[1], R = Math.hypot(dx, dz);
    return { q, Q, B, D: [dx / R, dz / R], R, kind, a, zq: Q[1] };
  };
}
// half widths along the foot: the heel's, a waist under the arch, the ball's (level at both ends, so the caps join smoothly)
const halfW = (zh, zt, h, b, dip) => (z) => { const t = clamp01((z - zh) / (zt - zh)); return h + (b - h) * t * t * (3 - 2 * t) - dip * Math.sin(PI * t) ** 2; };
// the q of each column: heel, sides and toe sampled apart; the outer and inner sides share their z, so the spine's seam closes
function columnQs(nh, ns, nt) { const q = [], seg = (a, b, n) => { for (let i = 0; i < n; i++) q.push(a + ((b - a) * i) / n); }; seg(0, 1, nh); seg(1, 2, ns); seg(2, 3, nt); seg(3, 4, ns); seg(4, 5, nh); q.push(5); return q; }
// texture u round an outline: its length so far (q 0..5 to u 0..1), so a pattern is not stretched round the toe
function arcU(f) {
  const N = 1000, L = [0]; let prev = f(0).B;
  for (let i = 1; i <= N; i++) { const b = f((5 * i) / N).B; L.push(L[i - 1] + Math.hypot(b[0] - prev[0], b[1] - prev[1])); prev = b; }
  return (q) => { const x = (clamp01(q / 5) * N), i = Math.min(N - 1, Math.floor(x)); return mix(L[i], L[i + 1], x - i) / L[N]; };
}

// ---------- the running shoe (shoe frame: a left shoe, its heel's back at z 0, the flat of its sole on y 0, its outer side +x)
const SL = 15.0;                                                    // 28.5 cm over the outsole
const ZB = 0.345, ZH = 2.34, ZT = 10.35, ZTIP = 14.78;              // the upper's heel and toe on the bite line; the heel and toe caps' centres
const ZTE = 5.5, ZV = 9.83;                                         // the top eyelet (the collar meets the throat), the vamp (the throat closes)
const bottomY = (z) => 0.42 * clamp01((2.5 - z) / 2.5) ** 2 + 1.4 * clamp01((z - 9.0) / (SL - 9.0)) ** 2.2;          // heel bevel, the rocker's toe spring
const stackH = (z) => 2.0 - 0.58 * smooth(3.0, ZT, z) - 0.64 * smooth(ZT, SL, z);                                   // 38 mm at the heel, 27 at the ball, thin at the toe
const footbed = (z) => bottomY(z) + stackH(z);
const rimY = (z) => footbed(z) + 0.5 - 0.3 * smooth(3.0, 7.0, z) + 0.04 * smooth(13, SL, z);                      // the midsole cradles the heel
const shoeWl = halfW(ZH, ZT, 1.92, 2.3, 0.32), shoeWm = halfW(ZH, ZT, 1.88, 2.2, 0.55), shoeXs = (z) => -0.2 * smooth(ZH, ZT + 3, z);
const SHOE = outline({ zh: ZH, zt: ZT, rzh: ZH - ZB, rzt: ZTIP - ZT, wl: shoeWl, wm: shoeWm, xs: shoeXs, nh: 2.15, nl: 2.3, nm: 2.9 });
const shoeU = arcU(SHOE);
const domeTop = spline1([[ZH, 5.6], [3.9, 5.3], [ZTE, 4.5], [7.3, 3.8], [8.9, 3.06], [ZT, 2.3]]);   // the last's height over the footbed along the spine
const rSlot = (z) => (0.93 - 0.15 * smooth(ZTE, 9.0, z)) * Math.sqrt(Math.max(0, 1 - smooth(9.15, ZV, z)));   // the throat's half width
const domeAt = (H, R, n, r) => H * Math.max(0, 1 - Math.min(1, Math.abs(r) / R) ** n) ** (1 / n);           // a meridian's height at radius r
const nAt = (z) => 2.25 - 0.2 * smooth(6.0, ZT, z);                                             // the meridians round off toward the toe
const HJ = [domeAt(domeTop(ZTE), shoeWl(ZTE), nAt(ZTE), rSlot(ZTE)), domeAt(domeTop(ZTE), shoeWm(ZTE), nAt(ZTE), rSlot(ZTE))];   // where the collar meets the throat
const qLat = (z) => 1 + (z - ZH) / (ZT - ZH), qMed = (z) => 3 + (ZT - z) / (ZT - ZH);
// the collar line over the footbed: highest at the back (the heel tab), dipping under the ankle bones (the outer one lower), rising to the top eyelet
function collarH(c) {
  if (c.kind === 0) return 3.55 + 0.5 * Math.cos(c.a) ** 2;
  const lat = c.kind === 1, dip = lat ? 3.22 : 3.36, hj = lat ? HJ[0] : HJ[1];
  return 3.55 - (3.55 - dip) * smooth(ZH, 3.5, c.zq) + (hj - dip) * smooth(4.15, ZTE, c.zq);
}
// the midsole's flare past the bite line at its foot: wide at the heel, pulled in under the arch, broad under the ball
function flareOf(c) {
  if (c.kind === 0) return 0.45 + 0.1 * Math.cos(c.a) ** 2;
  if (c.kind === 2) return 0.38 - 0.18 * Math.sin(c.a) ** 2;
  const t = clamp01((c.zq - ZH) / (ZT - ZH));
  return 0.45 - 0.07 * t * t * (3 - 2 * t) - (c.kind === 1 ? 0.2 : 0.24) * Math.sin(PI * t) ** 2;
}
// a column of the shoe: its meridian's top (H), shape (n), where the upper stops (sTop: the collar, the throat's edge, or closed)
function shoeCol(q) {
  const c = SHOE(q), side = c.kind === 1 || c.kind === 3;
  c.H = domeTop(c.zq); c.n = nAt(c.zq) - (c.kind === 2 ? 0.25 * Math.sin(c.a) ** 2 : 0); c.fl = flareOf(c);
  if (c.kind === 0 || (side && c.zq <= ZTE)) { c.hc = collarH(c); c.sTop = Math.asin(Math.min(1, (c.hc / c.H) ** (c.n / 2))) / (PI / 2); c.open = 1; }
  else if (side && c.zq < ZV) { c.sTop = Math.acos(Math.min(1, (rSlot(c.zq) / c.R) ** (c.n / 2))) / (PI / 2); c.open = 2; }
  else { c.sTop = 1; c.open = 0; }
  return c;
}
// a point of the upper: s 0 on the bite line .. 1 at the spine (a superellipse quarter in the meridian's plane, sheared onto the footbed)
function shellAt(c, s) {
  const th = clamp01(s) * (PI / 2), h = c.H * Math.sin(th) ** (2 / c.n);
  let r = c.R * Math.max(0, Math.cos(th)) ** (2 / c.n);
  if (c.kind === 0) r += 0.28 * Math.cos(c.a) ** 4 * smooth(c.hc - 1.3, c.hc + 0.1, h) ** 2;   // the heel tab flares back over the Achilles
  const x = c.Q[0] + c.D[0] * r, z = c.Q[1] + c.D[1] * r;
  return [x, footbed(z) + h, z];
}
const inside = (p) => [shoeXs(p[2]), footbed(Math.min(SL, Math.max(0, p[2]))) + 1.4, p[2]];   // a point inside the foot, level with p
function shellN(q, s) {
  const e = 1e-3, c = shoeCol(q), P = shellAt(c, s);
  const N = crs(sub(shellAt(shoeCol(q + e), s), shellAt(shoeCol(q - e), s)), sub(shellAt(c, Math.min(1, s + e)), shellAt(c, Math.max(0, s - e))));
  if (len(N) < 1e-10) return [0, 1, 0];
  // outward: away from the meridian's own spine point (a point level with P is no guide at the heel's back)
  const n = nrm(N); return dot(n, sub(P, [c.Q[0], footbed(c.Q[1]) + 1.2, c.Q[1]])) < 0 ? scl(n, -1) : n;
}
const sForH = (c, h) => Math.asin(Math.min(1, Math.max(0, h / c.H) ** (c.n / 2))) / (PI / 2);
const sForR = (c, r) => Math.acos(Math.min(1, Math.max(0, r / c.R) ** (c.n / 2))) / (PI / 2);
// the rows of a column by length along it (so the knit's courses keep their spacing), and how far along a given s lies
function meridianLen(c, s1, K = 48) { const L = [0]; let prev = shellAt(c, 0); for (let k = 1; k <= K; k++) { const p = shellAt(c, (s1 * k) / K); L.push(L[k - 1] + len(sub(p, prev))); prev = p; } return L; }
function rowS(c, n, s1 = c.sTop) {
  const K = 48, L = meridianLen(c, s1, K), out = [];
  for (let j = 0; j <= n; j++) { const t = (L[K] * j) / n; let k = 0; while (k < K - 1 && L[k + 1] < t) k++; out.push((s1 * (k + clamp01((t - L[k]) / (L[k + 1] - L[k] || 1)))) / K); }
  return out;
}
const arcFrac = (c, s) => { const K = 48, L = meridianLen(c, c.sTop, K), x = clamp01(s / c.sTop) * K, i = Math.min(K - 1, Math.floor(x)); return mix(L[i], L[i + 1], x - i) / L[K]; };

// ---------- texture atlases (canvas px to uv; the canvases are uploaded flipped, v up)
const UPPER_W = 2048, UPPER_H = 1024, SOLE_W = 1024, SOLE_H = 512, ACC = 512, FLIP_PX = 512;
const UA = (x, y) => [x / UPPER_W, 1 - y / UPPER_H], SA = (x, y) => [x / SOLE_W, 1 - y / SOLE_H], AA = (x, y) => [x / ACC, 1 - y / ACC], FA = (x, y) => [x / FLIP_PX, 1 - y / FLIP_PX];
// upper: the shell over rows 8..632 (u round the outline, v up the meridians); below it the collar, the lining, the tongue, the heel cup
const SHELL_UV = (u, v) => UA(8 + 2032 * u, 632 - 624 * v);
// sole: the sidewall over rows 4..252 (v 0 at the outsole's foot, 1 at the rim); the tread (plan: z across, x down); the insole
const SIDE_UV = (u, v) => SA(8 + 1008 * u, 252 - 248 * v);
const TREAD_UV = (x, z) => SA(8 + (752 * (z + 0.3)) / 15.6, 264 + (240 * (x + 3.2)) / 6.4);
const INSOLE_UV = (x, z) => SA(776 + (240 * (x + 3)) / 6, 264 + (240 * (15.4 - z)) / 15.6);
// eyelets: six pairs, the laces' ends in and out of them
const EYES = [9.35, 8.62, 7.89, 7.16, 6.43, 5.7];
const eyeR = (z) => rSlot(z) + 0.3;

// the shoe's layout, for its textures: where the zones and the eyelets fall in the shell's (u, v)
function shoeLayout() {
  const eyes = [];
  for (const z of EYES) for (const [side, q] of [[1, qLat(z)], [-1, qMed(z)]]) { const c = shoeCol(q); eyes.push([shoeU(q), arcFrac(c, sForR(c, eyeR(z))), side]); }
  return {
    eyes, toe: [shoeU(qLat(ZV)), shoeU(qMed(ZV))], throat: [[shoeU(qLat(ZTE)), shoeU(qLat(ZV))], [shoeU(qMed(ZV)), shoeU(qMed(ZTE))]],
    collar: [[0, shoeU(qLat(ZTE))], [shoeU(qMed(ZTE)), 1]], sides: [[shoeU(1), shoeU(2)], [shoeU(3), shoeU(4)]],
  };
}

// one shoe, a left one in the shoe frame: { upper, sole, accent } lists of geometry
function buildShoe() {
  const out = { upper: [], sole: [], accent: [] };
  const QS = columnQs(8, 18, 22), cols = QS.map(shoeCol);

  // ---- the upper's shell: knit from the bite line (inside the midsole's rim) up to the collar and the throat's edges, closed over the toes
  const NR = 16, rows = cols.map((c) => rowS(c, NR)), P = [], UV = [];
  for (let j = 0; j <= NR; j++) { P.push(cols.map((c, k) => shellAt(c, rows[k][j]))); UV.push(QS.map((q) => SHELL_UV(shoeU(q), j / NR))); }
  out.upper.push(sheet(P, UV, (p) => sub(p, inside(p))));

  // ---- the lining, a little inside the knit, from the throat round the heel (what shows through the collar)
  {
    const q0 = qMed(8.2), q1 = qLat(8.2) + 5, NC = 34, NL = 13, LP = [], LUV = [];
    const lc = Array.from({ length: NC + 1 }, (_, k) => { const q = mix(q0, q1, k / NC), c = shoeCol(q); return { q, c, s: rowS(c, NL) }; });
    for (let j = 0; j <= NL; j++) { LP.push(lc.map(({ q, c, s }) => sub(shellAt(c, s[j]), scl(shellN(q, s[j]), 0.09)))); LUV.push(lc.map((_, k) => UA(8 + (1008 * k) / NC, 1012 - (238 * j) / NL))); }
    out.upper.push(sheet(LP, LUV, (p) => sub(inside(p), p)));
  }

  // ---- the padded collar: a roll round the opening, slimming to a rolled edge along the throat and fading out at the vamp
  {
    const q0 = qMed(ZV), q1 = qLat(ZV) + 5, NP = 84, path = [], fr = [], sec = [];
    for (let i = 0; i <= NP; i++) {
      const q = mix(q0, q1, i / NP), c = shoeCol(q), E = shellAt(c, c.sTop), N = shellN(q, c.sTop), U = nrm(sub(E, shellAt(c, c.sTop - 0.02)));
      const pad = c.kind === 0 ? 1 : 1 - smooth(4.9, 6.0, c.zq), end = c.kind === 0 ? 1 : Math.sqrt(1 - smooth(ZV - 0.75, ZV - 0.04, c.zq)), back = c.kind === 0 ? Math.cos(c.a) ** 2 : 0;
      const a = mix(0.13, 0.36, pad) * end, b = mix(0.055, 0.25 + 0.07 * back, pad) * end;
      path.push(sub(sub(E, scl(N, 0.56 * a)), scl(U, 0.25 * b))); fr.push([N, U]); sec.push([a, b]);
    }
    let total = 0; for (let i = 1; i < path.length; i++) total += len(sub(path[i], path[i - 1]));
    out.upper.push(tube(path, (i) => fr[i], (i) => sec[i], { seg: 9, uv: (s, k) => UA(8 + (1008 * s) / total, 652 + (106 * k) / 9) }));
  }

  // ---- the heel cup: a smooth shell over the knit round the heel, level across the back and easing down at its ends, its edge rolled
  {
    const q0 = qMed(3.6), q1 = qLat(3.6) + 5, NC = 30, RW = [[0, 0.07], [0.2, 0.07], [0.4, 0.07], [0.58, 0.07], [0.74, 0.07], [0.87, 0.069], [0.95, 0.064], [0.985, 0.045], [1, -0.012]];
    const HP = [], HUV = [];
    for (const [fs, off] of RW) {
      const row = [], ruv = [];
      for (let k = 0; k <= NC; k++) {
        const t = k / NC, q = mix(q0, q1, t), c = shoeCol(q), w = 2 * t - 1;
        const hTop = 1.1 + 1.5 * Math.max(0, 1 - Math.abs(w) ** 3) ** 1.2, s = sForH(c, hTop) * fs;
        const o = mix(-0.012, off, smooth(0, 0.045, 1 - Math.abs(w)));
        row.push(add(shellAt(c, s), scl(shellN(q, s), o))); ruv.push(UA(1544 + 496 * t, 1012 - 356 * fs));
      }
      HP.push(row); HUV.push(ruv);
    }
    out.upper.push(sheet(HP, HUV, (p) => sub(p, inside(p))));
  }

  // ---- the tongue: padded, lying in the throat under the eyestays (its sides dive under them), standing up out of the collar
  {
    const centre = (z) => [shoeXs(z), footbed(z) + domeTop(z) - 0.075, z], te = centre(ZTE), up = nrm([0, 0.82, -0.57]);
    const ctl = [10.15, 9.6, 9.0, 8.4, 7.8, 7.2, 6.6, 6.0, ZTE].map(centre);
    ctl.push(add(te, scl(up, 0.38)), add(add(te, scl(up, 0.74)), [0, 0, 0.03]), add(add(te, scl(up, 0.98)), [0, 0, 0.1]));
    const path = spline3(ctl, 0.32), n = path.length, S = [0];
    for (let i = 1; i < n; i++) S.push(S[i - 1] + len(sub(path[i], path[i - 1])));
    const Lt = S[n - 1], M = 8, TP = [], TUV = [], mid = [];
    for (let i = 0; i < n; i++) {
      const p = path[i], T = nrm(sub(path[Math.min(i + 1, n - 1)], path[Math.max(i - 1, 0)])), X = nrm(sub([1, 0, 0], scl(T, T[0])));
      let N = crs(T, X); if (N[1] < 0) N = scl(N, -1);
      const zr = Math.min(9.6, Math.max(ZTE, p[2])), free = 1 - smooth(ZTE - 0.05, ZTE - 0.6, p[2]) * 0.28, rs = rSlot(zr), H = domeTop(zr);
      // its top edge squared off with rounded corners; at the very end the ring pinches onto its mid-surface, closing it
      const f = S[i] / Lt, last = i === n - 1, top = Math.sqrt(Math.max(0, 1 - (Math.max(0, S[i] - (Lt - 0.3)) / 0.3) ** 2)), bot = Math.sqrt(Math.max(0, 1 - (Math.max(0, 0.3 - S[i]) / 0.3) ** 2));
      const hw = (1.0 + 0.18 * smooth(0.15, 0.7, f)) * Math.max(0.04, (0.62 + 0.38 * top) * bot), th0 = 0.1 + 0.16 * smooth(0.45, 0.95, f), th = last ? th0 * 0.3 : th0;
      const drop = (r) => (H - domeAt(H, r >= 0 ? shoeWl(zr) : shoeWm(zr), nAt(zr), r) + 0.13 * smooth(rs - 0.1, rs + 0.2, Math.abs(r))) * free;
      // top and underside at the same offsets across, a thickness apart, so the section can never fold over where the instep falls away
      const at = (r, d) => add(p, add(scl(X, r), scl(N, -d - (last ? th0 * 0.35 : 0)))), ring = [], ruv = [];
      for (let k = 0; k <= M; k++) { const r = (-1 + (2 * k) / M) * hw; ring.push(at(r, drop(r))); ruv.push(UA(1032 + 248 * (k / M), 1012 - 356 * f)); }
      ring.push(at(hw + th * 0.45, drop(hw) + th * 0.5)); ruv.push(UA(1280, 1012 - 356 * f));
      for (let k = M; k >= 0; k--) { const r = (-1 + (2 * k) / M) * hw; ring.push(at(r, drop(r) + th)); ruv.push(UA(1280 + 248 * ((M - k) / M), 1012 - 356 * f)); }
      ring.push(at(-hw - th * 0.45, drop(-hw) + th * 0.5)); ruv.push(UA(1528, 1012 - 356 * f));
      ring.push(ring[0]); ruv.push(UA(1528, 1012 - 356 * f));
      TP.push(ring); TUV.push(ruv); mid.push(sub(p, scl(N, drop(0) + th / 2)));
    }
    out.upper.push(sheet(TP, TUV, (q, i) => sub(q, mid[i])));
  }

  // ---- the sole: one solid, its sidewall from the outsole's foot (a small step out to the midsole) up to the rim, the tread under it,
  // the rim's ledge and the insole on top (the insole is what shows through the collar)
  {
    const RIM = 0.1, rowsDef = [
      [(c) => c.fl - 0.17, (z) => bottomY(z), 0], [(c) => c.fl - 0.09, (z) => bottomY(z) + 0.025, 0.05], [(c) => c.fl - 0.055, (z) => bottomY(z) + 0.08, 0.11],
      [(c) => c.fl - 0.05, (z) => bottomY(z) + 0.15, 0.19], [(c) => c.fl - 0.03, (z) => bottomY(z) + 0.162, 0.21], [(c) => c.fl - 0.004, (z) => bottomY(z) + 0.205, 0.25],
      ...[0, 0.25, 0.5, 0.75, 1].map((v) => [(c) => RIM + (c.fl - RIM) * (1 - v) ** 1.4 + 0.035 * Math.sin(PI * v), (z) => mix(bottomY(z) + 0.26, rimY(z) - 0.1, v), 0.28 + 0.62 * v]),
      [() => RIM + 0.004, (z) => rimY(z) - 0.035, 0.95], [() => RIM - 0.06, (z) => rimY(z), 1],
    ];
    const at = (c, r, yf) => { const x = c.Q[0] + c.D[0] * r, z = c.Q[1] + c.D[1] * r; return [x, yf(z), z]; };
    const wall = rowsDef.map(([o, yf]) => cols.map((c) => at(c, c.R + o(c), yf))), wuv = rowsDef.map(([, , v]) => QS.map((q) => SIDE_UV(shoeU(q), v)));
    out.sole.push(sheet(wall, wuv, (p) => sub(p, inside(p))));
    const bot = [1, 0.66, 0.33, 0].map((k) => cols.map((c) => at(c, (c.R + c.fl - 0.17) * k, bottomY)));
    out.sole.push(sheet(bot, bot.map((r) => r.map((p) => TREAD_UV(p[0], p[2]))), () => [0, -1, 0]));
    const ledge = [RIM - 0.06, 0].map((o) => cols.map((c) => at(c, c.R + o, rimY))), insole = [1, 0.7, 0.4, 0.12, 0].map((k) => cols.map((c) => at(c, c.R * k, rimY)));
    out.sole.push(sheet(ledge, ledge.map(() => QS.map((q) => SIDE_UV(shoeU(q), 0.97))), () => [0, 1, 0]));
    out.sole.push(sheet(insole, insole.map((r) => r.map((p) => INSOLE_UV(p[0], p[2]))), () => [0, 1, 0]));
  }

  // ---- the laces: flat, a bar straight across the bottom pair, then criss-crossed up to the top pair and tied in a bow
  {
    const lat = (z) => [shoeXs(z) + eyeR(z), z], med = (z) => [shoeXs(z) - eyeR(z), z];
    // what a lace lies on: the tongue between the eyestays, their rolled edges, the knit outside them
    const dome = (x, z) => { const r = x - shoeXs(z); return domeAt(domeTop(z), r >= 0 ? shoeWl(z) : shoeWm(z), nAt(z), r); };
    const bed = (x, z) => {
      const a = Math.abs(x - shoeXs(z)), rs = rSlot(z), d = dome(x, z);
      let h = a < rs ? d - 0.075 - 0.13 * smooth(rs - 0.1, rs + 0.2, a) : d;
      if (Math.abs(a - rs) < 0.13) h = Math.max(h, dome(shoeXs(z) + Math.sign(x - shoeXs(z) || 1) * rs, z) + 0.06);
      return footbed(z) + h;
    };
    const bedN = (x, z) => { const e = 0.06; return nrm([-(footbed(z) + dome(x + e, z) - footbed(z) - dome(x - e, z)) / (2 * e), 1, -(footbed(z + e) + dome(x, z + e) - footbed(z - e) - dome(x, z - e)) / (2 * e)]); };
    const LW = 0.165, LT = 0.035, flat = (pts) => tube(pts, (i) => { const p = pts[i], q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)], N = bedN(p[0], p[2]); return [crs(N, nrm(sub(q, o))), N]; }, () => [LW, LT], { seg: 6, sq: 5, uv: (s, k) => AA(s * 480, 102 + (52 * k) / 6) });
    // across the throat, in at one eyelet and out of the other; `over` lifts it where it crosses its twin
    const across = (p0, p1, over = 0, dive = [true, true]) => {
      const n = 14, pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n, x = mix(p0[0], p1[0], t), z = mix(p0[1], p1[1], t); pts.push([x, bed(x, z) + 0.045 + over * (1 - smooth(0.1, 0.32, Math.abs(t - 0.5))), z]); }
      for (let pass = 0; pass < 2; pass++) for (let i = 1; i < n; i++) pts[i][1] = Math.max(bed(pts[i][0], pts[i][2]) + 0.045, (pts[i - 1][1] + 2 * pts[i][1] + pts[i + 1][1]) / 4);
      if (dive[0]) { pts[0][1] -= 0.11; pts[1][1] -= 0.02; }
      if (dive[1]) { pts[n][1] -= 0.11; pts[n - 1][1] -= 0.02; }
      return pts;
    };
    out.accent.push(flat(across(lat(EYES[0]), med(EYES[0]))));
    for (let i = 0; i < EYES.length - 1; i++) {
      out.accent.push(flat(across(lat(EYES[i]), med(EYES[i + 1]), i % 2 ? 0 : 0.075)));
      out.accent.push(flat(across(med(EYES[i]), lat(EYES[i + 1]), i % 2 ? 0.075 : 0)));
    }
    // the bow: a knot on the last cross, two loops falling back over the eyestays, two tails falling forward down the sides
    const KZ = 6.2, KX = shoeXs(KZ), knotY = bed(KX, KZ) + 0.3;
    const top = (r, z, lift) => { const x = shoeXs(z) + r; return [x, bed(x, z) + lift, z]; };
    const side = (sg, z, dh, lift) => { const q = sg > 0 ? qLat(z) : qMed(z), c = shoeCol(q), s = sForH(c, c.H - dh); return add(shellAt(c, s), scl(shellN(q, s), lift)); };
    for (const sg of [1, -1]) {
      const e = sg > 0 ? lat(EYES[5]) : med(EYES[5]);
      out.accent.push(flat(spline3([[e[0], bed(e[0], e[1]) - 0.06, e[1]], [e[0], bed(e[0], e[1]) + 0.05, e[1]], top(sg * 0.55, 6.08, 0.17), [KX + sg * 0.18, knotY - 0.06, KZ - 0.05]], 0.12)));
      const v = sg > 0 ? 0 : 0.12;   // the two halves of the bow are never quite the same
      out.accent.push(flat(spline3([[KX + sg * 0.12, knotY + 0.02, KZ - 0.06], top(sg * 0.38, 6.02, 0.24), top(sg * 0.85, 5.97, 0.2), side(sg, 6.02, 0.62 + v, 0.11), side(sg, 6.15, 1.18 + v, 0.09), side(sg, 6.45, 1.04 + v, 0.09), side(sg, 6.6, 0.54 + v, 0.11), top(sg * 0.8, 6.52, 0.2), top(sg * 0.34, 6.36, 0.24), [KX + sg * 0.12, knotY + 0.02, KZ + 0.06]], 0.1)));
      const tail = spline3([[KX + sg * 0.1, knotY - 0.08, KZ + 0.05], top(sg * 0.42, 6.45, 0.13), top(sg * 0.92, 6.78 + v, 0.09), side(sg, 7.0 + v, 0.72, 0.06), side(sg, 7.22 + v, 1.38 + v, 0.055), side(sg, 7.4 + v, 1.9 + 1.5 * v, 0.055)], 0.1);
      out.accent.push(flat(tail));
      // its aglet: a little dark sleeve on the end
      const T = nrm(sub(tail[tail.length - 1], tail[tail.length - 2])), A0 = tail[tail.length - 1], ag = [0, 0.1, 0.2, 0.3, 0.36].map((d) => add(A0, scl(T, d)));
      const N = shellN(sg > 0 ? qLat(7.4 + v) : qMed(7.4 + v), 0.6);
      const tip = [1, 1, 1, 0.82, 0];   // a sleeve, rounded off at its tip
      out.accent.push(tube(ag, () => [crs(N, T), N], (i) => [0.075 * tip[i], 0.05 * tip[i]], { seg: 8, uv: (s, k) => AA(300 + s * 200, 20 + (k / 8) * 60) }));
    }
    const kn = pillow({ rx: 0.3, ry: 0.13, rz: 0.19, p1: 0.55, p2: 0.7, na: 16, ne: 8, uv: (u, v) => AA(8 + 480 * u, 104 + 48 * v) });   // the knot: the lace wrapped round itself, a small bundle across the lacing
    const tilt = Math.atan2(bed(KX, KZ - 0.2) - bed(KX, KZ + 0.2), 0.4);
    out.accent.push(xform(kn, M4.compose(new Array(16), [KX, knotY - 0.13, KZ], [tilt, 0.12, 0], [1, 1, 1])));
  }

  // ---- the pull loop: coral webbing up the heel's back, over the collar and down inside it
  {
    const c0 = shoeCol(0), E = shellAt(c0, c0.sTop), N = shellN(0, c0.sTop), U = nrm(sub(E, shellAt(c0, c0.sTop - 0.03)));
    const on = (dh, o) => { const s = sForH(c0, c0.hc + dh); return add(shellAt(c0, s), scl(shellN(0, s), o)); }, off = (n, u) => add(E, add(scl(N, n), scl(U, u)));
    const path = spline3([on(-1.1, 0.04), on(-0.8, 0.05), on(-0.55, 0.09), on(-0.32, 0.2), off(0.31, 0.1), off(0.3, 0.42), off(0.12, 0.7), off(-0.14, 0.76), off(-0.38, 0.55), off(-0.47, 0.2)], 0.1);
    let total = 0; for (let i = 1; i < path.length; i++) total += len(sub(path[i], path[i - 1]));
    out.accent.push(tube(path, () => [[1, 0, 0], N], () => [0.36, 0.035], { seg: 6, sq: 5, uv: (s, k) => AA(16 + (224 * s) / total, 12 + (k / 6) * 72) }));
  }
  return out;
}

// ---------- the sandal jepit (frame: a left one, its heel's back at z 0, flat on y 0, its outer side +x)
const FZH = 2.0, FZT = 9.9, FLEN = 14.1;
const flipWl = halfW(FZH, FZT, 1.95, 2.6, 0.5), flipWm = halfW(FZH, FZT, 1.9, 2.45, 0.75), flipXs = (z) => -0.3 * smooth(FZH, FZT + 3, z);
const FLIP = outline({ zh: FZH, zt: FZT, rzh: 1.95, rzt: FLEN - FZT, wl: flipWl, wm: flipWm, xs: flipXs, nh: 2.1, nl: 2.2, nm: 3.0 });
const flipU = arcU(FLIP);
const FTOP = 0.625, FMID = 0.29;                                    // the footbed, and where the white top layer meets the navy sole
const FLIP_TOP_UV = (x, z) => FA(8 + (224 * (x + 3)) / 6, 8 + (496 * (14.3 - z)) / 14.4), FLIP_BOT_UV = (x, z) => FA(264 + (224 * (x + 3)) / 6, 8 + (496 * (14.3 - z)) / 14.4);
// where the foot has pressed: the heel, the ball and the big toe, a little hollow worn into the footbed
const wear = (x, z) => 0.045 * Math.exp(-(((x - flipXs(z)) / 1.1) ** 2 + ((z - 2.7) / 1.4) ** 2)) + 0.032 * Math.exp(-(((x + 0.15) / 1.5) ** 2 + ((z - 10.0) / 1.3) ** 2)) + 0.02 * Math.exp(-(((x + 1.05) / 0.55) ** 2 + ((z - 12.85) / 0.6) ** 2));
const POST = [flipXs(10.75) - 0.42, 10.75], PLUG = [[flipXs(5.7) + flipWl(5.7) - 0.4, 5.7], [flipXs(5.95) - flipWm(5.95) + 0.36, 5.95]];   // the strap's holes: toe post, outer, inner

function buildFlipFlop() {
  const out = [], QS = columnQs(6, 12, 16), cols = QS.map(FLIP);
  const at = (c, r, y) => { const x = c.Q[0] + c.D[0] * r, z = c.Q[1] + c.D[1] * r; return [x, typeof y === 'function' ? y(x, z) : y, z]; };
  // the sole: a navy layer under a white one, edges eased; the footbed's worn hollows; a tread underneath
  const rowsDef = [[-0.05, 0, 0], [-0.012, 0.016, 0], [0, 0.055, 0], [0, FMID, 0], [0, FMID, 1], [0, 0.585, 1], [-0.012, 0.613, 1], [-0.045, FTOP, 1]];
  const wall = rowsDef.map(([o, y]) => cols.map((c) => at(c, c.R + o, y)));
  const wuv = rowsDef.map(([, y, w]) => QS.map((q) => FA(w ? 244 + 8 * (y / FTOP) : 500 + 8 * (y / FMID), 8 + 496 * flipU(q))));
  out.push(sheet(wall, wuv, (p) => sub(p, [flipXs(p[2]), 0.3, p[2]])));
  const topY = (x, z) => FTOP - wear(x, z);
  const top = [1, 0.84, 0.66, 0.47, 0.28, 0.1, 0].map((k) => cols.map((c) => at(c, (c.R - 0.045) * k, topY)));
  out.push(sheet(top, top.map((r) => r.map((p) => FLIP_TOP_UV(p[0], p[2]))), () => [0, 1, 0]));
  const bot = [1, 0.5, 0].map((k) => cols.map((c) => at(c, (c.R - 0.05) * k, 0)));
  out.push(sheet(bot, bot.map((r) => r.map((p) => FLIP_BOT_UV(p[0], p[2]))), () => [0, -1, 0]));
  // the Y strap: a short post up from between the first toes, a moulded knuckle, two arms arching back over the foot into the sides
  const A = [POST[0] + 0.06, 1.45, POST[1] - 0.2], [pl, pm] = PLUG, strapUV = (s, k) => FA(500 + (8 * k) / 8, 8 + 496 * Math.min(1, s / 7));
  // each arm: out from the knuckle, a little up to a soft crown a third of the way back, then easing down into its side's plug,
  // bowed outward in plan (moulded rubber holds that arch with no foot in it)
  for (const P of [pl, pm]) {
    const out2 = (() => { const dx = P[0] - A[0], dz = P[1] - A[2], l = Math.hypot(dx, dz); return [dz / l, -dx / l]; })(), sg = Math.sign(out2[0] * (P[0] - flipXs(P[1]))) || 1;
    const ctl = [0, 0.14, 0.3, 0.46, 0.62, 0.77, 0.89, 0.97].map((t) => {
      const b = 0.42 * Math.sin(PI * t) * sg, y = FTOP + (A[1] - FTOP) * (1 - t) + 0.62 * Math.sin(PI * t) ** 0.9 * (1 - 0.35 * t);
      return [mix(A[0], P[0], t) + out2[0] * b, y, mix(A[2], P[1], t) + out2[1] * b];
    });
    ctl.push([P[0], FTOP - 0.28, P[1]]);
    const path = spline3(ctl, 0.16);
    out.push(tube(path, (i) => { const p = path[i], T = nrm(sub(path[Math.min(i + 1, path.length - 1)], path[Math.max(i - 1, 0)])), Nb = nrm(sub(p, [flipXs(p[2]), 0.2, p[2]])); return [crs(T, Nb), Nb]; },
      (i) => { const f = i / (path.length - 1); return [0.25 - 0.05 * smooth(0.0, 0.15, 1 - f) + 0.05 * smooth(0.82, 1, f), 0.08 + 0.02 * smooth(0.85, 1, f)]; }, { seg: 8, sq: 3.2, uv: strapUV }));
  }
  out.push(tube([[POST[0], 0.4, POST[1]], [POST[0] + 0.02, 0.95, POST[1] - 0.07], [A[0], A[1] - 0.05, A[2]]], () => [[1, 0, 0], [0, 0, 1]], () => [0.15, 0.15], { seg: 10, uv: strapUV }));
  out.push(xform(pillow({ rx: 0.36, ry: 0.22, rz: 0.32, flat: 1, na: 16, ne: 8, uv: (u, v) => FA(500 + 8 * u, 300 + 40 * v) }), M4.compose(new Array(16), [A[0], A[1] - 0.22, A[2]], [0.25, 0, 0], [1, 1, 1])));
  return out;
}

// ---------- the running socks, a folded pair: a soft square pad, ribbed cuffs at one end
function buildSocks() {
  // the pair folded together: the lower sock's ribbed cuff shows past the upper one's; mapped from above, so the cuffs lie across the +z end
  const plan = (dz) => (u, v, p) => AA(256 + (240 * p[0]) / 1.9, 300 - (120 * (p[2] + dz)) / 2.6);
  const lower = pillow({ rx: 1.85, ry: 0.3, rz: 2.55, p1: 0.22, p2: 0.5, flat: 0.3, na: 36, ne: 8, uv: plan(0) });
  const upper = pillow({ rx: 1.74, ry: 0.32, rz: 2.2, p1: 0.24, p2: 0.55, flat: 0.25, na: 36, ne: 8, uv: plan(0.35) });
  return [lower, xform(upper, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.03, 0.31, -0.35, 1])];
}

// ---------- the rack: four legs, and at each tier front, back and side rails with six slats between, the slats' tenons through the sides
function buildRack() {
  const out = [], r = rng(17), grain = () => ({ u0: r() * 4, v0: r() * 0.42 }), H = TIERS[1].y;
  for (const x of [-LEG_X, LEG_X]) for (const z of [LEG_ZB, LEG_ZF]) out.push(xform(member(H, LEG, LEG, 0.12, { ...grain(), endGrain: true }), alongY([x, H / 2, z])));
  for (const { y, rail } of TIERS) {
    const yc = y - rail / 2;
    for (const z of [LEG_ZB, LEG_ZF]) out.push(xform(member(2 * (LEG_X - LEG / 2) + 0.2, RAIL, rail, 0.12, grain()), alongX([0, yc, z])));
    for (const x of [-LEG_X, LEG_X]) out.push(xform(member(LEG_ZF - LEG_ZB - LEG + 0.2, RAIL, rail, 0.12, grain()), alongZ([x, yc, (LEG_ZB + LEG_ZF) / 2])));
    for (let i = 0; i < SLATS; i++) {
      out.push(xform(member(2 * (LEG_X - RAIL / 2) + 0.2, SLAT_W, SLAT_T, 0.2, grain()), alongX([0, y - SLAT_T / 2, slatZ(i)])));
      for (const s of [-1, 1]) out.push(xform(member(0.08, 1.05, 0.38, 0.05, { seg: 2, u0: r(), v0: 0.962, uS: 0.02, vS: 0.008, endGrain: true }), alongX([s * (LEG_X + RAIL / 2), y - SLAT_T / 2, slatZ(i)])));
    }
  }
  return out;
}

// ---------- contact shadows: nothing in this corner casts a real one (the room's light is painted in), so a soft one is painted on
// the flat tops of the slats and rails under everything that rests on them; only on the wood, never over the gaps between the slats.
// Each is an ellipse in the thing's own frame (centre c, half sizes hx along its x and hz along its z), drawn in strips, one per top
function contactShadows(list) {
  const pos = [], nor = [], uv = [], idx = [], T = 0.12;
  const flats = [[LEG_ZB - RAIL / 2 + T, LEG_ZB + RAIL / 2 - T], ...Array.from({ length: SLATS }, (_, i) => [slatZ(i) - SLAT_W / 2 + 0.2, slatZ(i) + SLAT_W / 2 - 0.2]), [LEG_ZF - RAIL / 2 + T, LEG_ZF + RAIL / 2 - T]];
  for (const { m, c, hx, hz, y } of list) {
    const C = [m[0] * c[0] + m[8] * c[1] + m[12], m[2] * c[0] + m[10] * c[1] + m[14]], ax = [m[0], m[2]], az = [m[8], m[10]];
    const ex = Math.abs(ax[0]) * hx + Math.abs(az[0]) * hz, ez = Math.abs(ax[1]) * hx + Math.abs(az[1]) * hz;
    for (const [z0, z1] of flats) {
      const a = Math.max(z0, C[1] - ez), b = Math.min(z1, C[1] + ez), x0 = Math.max(-LEG_X + RAIL / 2, C[0] - ex), x1 = Math.min(LEG_X - RAIL / 2, C[0] + ex);
      if (b <= a || x1 <= x0) continue;
      const base = pos.length / 3;
      for (const [x, z] of [[x0, a], [x1, a], [x1, b], [x0, b]]) {
        const dx = x - C[0], dz = z - C[1];
        pos.push(x, y + 0.012, z); nor.push(0, 1, 0); uv.push(0.5 + (dx * ax[0] + dz * ax[1]) / (2 * hx), 0.5 + (dx * az[0] + dz * az[1]) / (2 * hz));
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  return pack(pos, nor, uv, idx);
}

// ---------- painted textures
// walnut, its grain running across the canvas (u: along every member), seamless both ways; a strip of end grain along the top
function walnutTexture() {
  const r = rng(53);
  return drawTexture(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = 'rgb(74,49,29)'; ctx.fillRect(0, 0, w, h);
    const band = (y, bh, rgb, a) => { for (const o of [-h, 0, h]) { const g = ctx.createLinearGradient(0, y + o - bh, 0, y + o + bh); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.5, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(0, y + o - bh, w, bh * 2); } };
    for (let i = 0; i < 24; i++) band(r() * h, 6 + r() * 34, r() < 0.55 ? '22,12,5' : '142,99,60', 0.05 + r() * 0.13);
    // the grain: long lines, wandering a whole number of waves across so the canvas tiles
    for (let i = 0; i < 330; i++) {
      const y0 = r() * h, amp = 0.5 + r() * 3.5, cyc = 1 + Math.floor(r() * 3), ph = r() * TAU, dark = r() < 0.7, a = dark ? 0.1 + r() * 0.3 : 0.05 + r() * 0.14;
      ctx.strokeStyle = dark ? `rgba(24,13,5,${a})` : `rgba(156,110,68,${a})`; ctx.lineWidth = 0.4 + r() * 1.7;
      for (const o of [-h, 0, h]) { ctx.beginPath(); for (let x = 0; x <= w; x += 16) { const y = y0 + o + amp * Math.sin(ph + (x / w) * TAU * cyc); if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); }
    }
    // cathedrals here and there, where the saw crossed the growth rings: nested arches pointing along the grain
    for (let c = 0; c < 4; c++) {
      const cx = 60 + r() * (w - 460), cy = 60 + r() * (h - 120), n = 5 + Math.floor(r() * 4);
      for (let j = 0; j < n; j++) { const sh = 4 + j * (4 + r() * 3), L = 90 + j * 28; ctx.strokeStyle = `rgba(24,13,5,${0.08 + r() * 0.14})`; ctx.lineWidth = 0.8 + r() * 1.2; ctx.beginPath(); ctx.moveTo(cx + L, cy - sh); ctx.bezierCurveTo(cx - L * 0.12, cy - sh * 1.1, cx - L * 0.12, cy + sh * 1.1, cx + L, cy + sh); ctx.stroke(); }
    }
    // open pores: short dark dashes along the grain
    for (let i = 0; i < 7000; i++) { ctx.fillStyle = `rgba(20,10,4,${0.12 + r() * 0.3})`; ctx.fillRect(r() * w, r() * h, 2 + r() * 6, 0.8); }
    // end grain (the tenons): a darker strip, its rings across it
    ctx.fillStyle = 'rgb(60,39,22)'; ctx.fillRect(0, 0, w, 22);
    for (let x = 0; x < w; x += 3 + r() * 4) { ctx.fillStyle = `rgba(24,13,5,${0.12 + r() * 0.22})`; ctx.fillRect(x, 0, 1, 22); }
    for (let i = 0; i < 400; i++) { ctx.fillStyle = `rgba(16,8,3,${0.2 + r() * 0.3})`; ctx.fillRect(r() * w, r() * 22, 1, 1); }
  }, { repeat: true });
}

// the upper: engineered knit over the shell (fine courses of V stitches along the sides, an open isotropic knit with perforations
// over the toe box, smooth eyestays reinforced round the eyelets, a darker collar band, the knit shadowed where it meets the sole);
// the collar's soft roll, the lining, the tongue (a diamond mesh), the heel cup
function upperTexture(L) {
  const r = rng(61);
  const stitch = drawTexture(8, 10, (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.075)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(1, 1.5); ctx.lineTo(4, 7); ctx.lineTo(7, 1.5); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fillRect(0, 8.5, 8, 1.5); ctx.fillRect(3.6, 0, 0.8, 4);
  }).image;
  const mesh = drawTexture(12, 12, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (const [x, y] of [[3, 3], [9, 9]]) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (const [x, y] of [[9, 3], [3, 9]]) { ctx.beginPath(); ctx.arc(x, y, 1.1, 0, TAU); ctx.fill(); }
  }).image;
  return drawTexture(UPPER_W, UPPER_H, (ctx) => {
    const X = (u) => 8 + 2032 * u, Y = (v) => 632 - 624 * v;
    // a zone painted in thin upright strips, faded in over `fade` px at both ends (so no zone starts on a hard seam)
    const zone = (u0, u1, fade, paint) => { const x0 = X(u0), x1 = X(u1); for (let x = x0; x < x1; x += 4) { ctx.globalAlpha = Math.max(0, Math.min(1, (x - x0 + 2) / fade, (x1 - x - 2) / fade)); paint(x, Math.min(4, x1 - x)); } ctx.globalAlpha = 1; };
    ctx.fillStyle = '#28282a'; ctx.fillRect(0, 0, UPPER_W, UPPER_H);
    // ---- the shell: heather, then the knit's courses
    for (let i = 0; i < 2600; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '120,120,126'},${0.05 + r() * 0.08})`; ctx.fillRect(r() * UPPER_W, r() * 640, 1 + r() * 3, 1); }
    ctx.fillStyle = ctx.createPattern(stitch, 'repeat'); ctx.fillRect(0, 0, UPPER_W, 640);
    // a tighter, faintly lighter weave along the midfoot sides (support)
    const side = ctx.createLinearGradient(0, Y(0.78), 0, Y(0.18)); side.addColorStop(0, 'rgba(255,255,255,0)'); side.addColorStop(0.5, 'rgba(255,255,255,0.035)'); side.addColorStop(1, 'rgba(255,255,255,0)');
    for (const [u0, u1] of L.sides) zone(u0, u1, 90, (x, w) => { ctx.fillStyle = side; ctx.fillRect(x, Y(0.78), w, Y(0.18) - Y(0.78)); });
    // the toe box: an open knit (no courses to ring round the toe's tip), staggered perforations over its top
    {
      const [u0, u1] = L.toe, open = ctx.createPattern(mesh, 'repeat');
      zone(u0, u1, 70, (x, w) => { ctx.fillStyle = '#29292b'; ctx.fillRect(x, 0, w, 640); ctx.fillStyle = open; ctx.fillRect(x, 0, w, 640); });
      for (let y = Y(0.93), row = 0; y < Y(0.3); y += 9, row++) for (let x = X(u0) + 40 + (row % 2) * 6; x < X(u1) - 40; x += 12) {
        const fade = Math.min(1, (x - X(u0) - 40) / 60, (X(u1) - 40 - x) / 60, (Y(0.3) - y) / 40); if (fade <= 0) continue;
        ctx.fillStyle = `rgba(0,0,0,${0.55 * fade})`; ctx.beginPath(); ctx.ellipse(x, y, 2.2, 1.8, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${0.05 * fade})`; ctx.fillRect(x - 2, y + 2, 4, 1);
      }
    }
    // the knit darkens into the sole; the collar's top edge is bound in a darker band
    { const g = ctx.createLinearGradient(0, Y(0.16), 0, Y(0)); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = g; ctx.fillRect(0, Y(0.16), UPPER_W, Y(0) - Y(0.16) + 8); }
    for (const [u0, u1] of L.collar) zone(u0, u1, 24, (x, w) => { ctx.fillStyle = '#1e1e1f'; ctx.fillRect(x, Y(1.02), w, Y(0.9) - Y(1.02)); });
    // the eyestays: a smooth band from the throat's edge down past the eyelets, its stitched lower edge following them
    for (const [side, [u0, u1]] of [[1, L.throat[0]], [-1, L.throat[1]]]) {
      const eyes = L.eyes.filter((e) => e[2] === side).sort((a, b) => a[0] - b[0]), lo = [[u0, eyes[0][1]], ...eyes, [u1, eyes[eyes.length - 1][1]]].map(([u, v]) => [X(u), Y(v - 0.075)]);
      ctx.fillStyle = '#303032'; ctx.beginPath(); ctx.moveTo(X(u0), Y(1.02)); ctx.lineTo(X(u1), Y(1.02)); for (let i = lo.length - 1; i >= 0; i--) ctx.lineTo(lo[i][0], lo[i][1]); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]); ctx.beginPath(); lo.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + 2) : ctx.moveTo(x, y + 2))); ctx.stroke(); ctx.setLineDash([]);
    }
    // the eyelets: punched through a small reinforced patch
    for (const [u, v] of L.eyes) {
      const x = X(u), y = Y(v);
      ctx.fillStyle = '#363638'; ctx.beginPath(); ctx.ellipse(x, y, 13, 9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#060606'; ctx.beginPath(); ctx.ellipse(x, y, 6.5, 4.6, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y + 0.6, 7.5, 5.4, 0, 0.1 * PI, 0.9 * PI); ctx.stroke();
    }
    // a soft light from above: the upper rows a shade lighter
    { const g = ctx.createLinearGradient(0, Y(1), 0, Y(0.45)); g.addColorStop(0, 'rgba(255,240,225,0.05)'); g.addColorStop(1, 'rgba(255,240,225,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, UPPER_W, Y(0.45)); }
    // ---- the collar's roll (u along it, v round it: 0 outside, 0.25 its crown, 0.5 inside): soft brushed charcoal, its crown catching light
    ctx.fillStyle = '#2b2a29'; ctx.fillRect(0, 640, 1024, 126);
    for (let i = 0; i < 2500; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '150,146,140'},${0.05 + r() * 0.07})`; ctx.fillRect(r() * 1024, 644 + r() * 120, 2 + r() * 4, 1); }
    { const g = ctx.createLinearGradient(0, 652, 0, 758); g.addColorStop(0, 'rgba(0,0,0,0.1)'); g.addColorStop(0.25, 'rgba(255,236,214,0.09)'); g.addColorStop(0.5, 'rgba(255,236,214,0.04)'); g.addColorStop(0.75, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.1)'); ctx.fillStyle = g; ctx.fillRect(0, 652, 1024, 106); }
    // ---- the lining: a soft dark textile, the padding at the top a little lighter
    ctx.fillStyle = '#312f2d'; ctx.fillRect(0, 766, 1024, 258);
    for (let i = 0; i < 3000; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '160,154,146'},${0.04 + r() * 0.06})`; ctx.fillRect(r() * 1024, 768 + r() * 256, 1 + r() * 2, 1 + r() * 2); }
    { const g = ctx.createLinearGradient(0, 772, 0, 860); g.addColorStop(0, 'rgba(255,240,224,0.06)'); g.addColorStop(1, 'rgba(255,240,224,0)'); ctx.fillStyle = g; ctx.fillRect(0, 772, 1024, 88); }
    // ---- the tongue: a diamond mesh over padding on top (x 1032..1280), lining underneath (1280..1528); a bound edge at its top
    ctx.fillStyle = '#2e2e30'; ctx.fillRect(1024, 640, 258, 384);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (let d = -400; d < 400; d += 7) {   // 45 degree lines both ways, each cut to the cell
      const t0 = Math.max(0, -d), t1 = Math.min(380, 256 - d); if (t1 > t0) { ctx.beginPath(); ctx.moveTo(1024 + d + t0, 644 + t0); ctx.lineTo(1024 + d + t1, 644 + t1); ctx.stroke(); }
      const s0 = Math.max(0, d), s1 = Math.min(380, 256 + d); if (s1 > s0) { ctx.beginPath(); ctx.moveTo(1280 + d - s0, 644 + s0); ctx.lineTo(1280 + d - s1, 644 + s1); ctx.stroke(); }
    }
    { const g = ctx.createLinearGradient(1032, 0, 1280, 0); g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(0.18, 'rgba(0,0,0,0)'); g.addColorStop(0.82, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)'); ctx.fillStyle = g; ctx.fillRect(1032, 644, 248, 380); }
    ctx.fillStyle = '#1f1f20'; ctx.fillRect(1024, 640, 258, 26);
    ctx.fillStyle = '#312f2d'; ctx.fillRect(1282, 640, 254, 384);
    for (let i = 0; i < 1200; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '160,154,146'},${0.04 + r() * 0.06})`; ctx.fillRect(1284 + r() * 252, 644 + r() * 380, 1 + r() * 2, 1 + r() * 2); }
    // ---- the heel cup: smooth satin black, a soft sheen near its rolled top edge
    ctx.fillStyle = '#1d1d1e'; ctx.fillRect(1536, 640, 512, 384);
    { const g = ctx.createLinearGradient(0, 656, 0, 1012); g.addColorStop(0, 'rgba(255,244,230,0.12)'); g.addColorStop(0.08, 'rgba(255,244,230,0.04)'); g.addColorStop(0.5, 'rgba(255,244,230,0.02)'); g.addColorStop(1, 'rgba(0,0,0,0.25)'); ctx.fillStyle = g; ctx.fillRect(1536, 644, 512, 380); }
  });
}

// the sole: the sidewall (dark outsole with its lugs' edges, white foam with a fine speckle, a thin coral line, shadowed into the
// upper), the tread (rubber pads at the heel and the forefoot, exposed foam under the arch), the insole
function soleTexture() {
  const r = rng(71);
  return drawTexture(SOLE_W, SOLE_H, (ctx) => {
    const Y = (v) => 252 - 248 * v;
    ctx.fillStyle = '#ddd7cb'; ctx.fillRect(0, 0, SOLE_W, 256);
    for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '90,80,64' : '255,255,250'},${0.05 + r() * 0.1})`; ctx.fillRect(r() * SOLE_W, r() * 210, 1 + r() * 1.5, 1 + r() * 1.5); }
    { const g = ctx.createLinearGradient(0, Y(1), 0, Y(0.25)); g.addColorStop(0, 'rgba(40,30,20,0.4)'); g.addColorStop(0.08, 'rgba(40,30,20,0.08)'); g.addColorStop(0.45, 'rgba(255,255,255,0.05)'); g.addColorStop(0.9, 'rgba(40,30,20,0.06)'); g.addColorStop(1, 'rgba(40,30,20,0.2)'); ctx.fillStyle = g; ctx.fillRect(0, 0, SOLE_W, Y(0.25)); }
    ctx.fillStyle = '#d9643c'; ctx.fillRect(0, Y(0.428), SOLE_W, Y(0.402) - Y(0.428));
    ctx.fillStyle = 'rgba(80,30,14,0.35)'; ctx.fillRect(0, Y(0.402) - 1, SOLE_W, 1);
    ctx.fillStyle = '#1c1b1a'; ctx.fillRect(0, Y(0.2), SOLE_W, 256 - Y(0.2));
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(0, Y(0.2), SOLE_W, 2);
    for (let x = 0; x < SOLE_W; x += 9 + r() * 4) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, Y(0.12), 2, 256 - Y(0.12)); }
    // the tread: the outline's footprint in plan, rubber pads with lugs and flex grooves, the arch's foam window
    const TX = (z) => 8 + (752 * (z + 0.3)) / 15.6, TY = (x) => 264 + (240 * (x + 3.2)) / 6.4;
    ctx.fillStyle = '#1b1a19'; ctx.fillRect(0, 256, 768, 256);
    ctx.fillStyle = '#d6d0c4'; ctx.beginPath(); ctx.ellipse(TX(7.1), TY(-0.12), (TX(9.1) - TX(5.1)) / 2, TY(1.0) - TY(0), 0, 0, TAU); ctx.fill();
    for (let z = 0.2; z < 15.2; z += 0.62) for (let x = -3; x < 3; x += 0.55) {
      if (z > 5.0 && z < 9.3 && Math.abs(x + 0.12) < 1.25) continue;
      ctx.fillStyle = `rgba(${r() < 0.5 ? '58,54,50' : '46,44,41'},0.9)`; ctx.fillRect(TX(z) + 2, TY(x) + 2, TX(z + 0.62) - TX(z) - 5, TY(x + 0.55) - TY(x) - 5);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; for (const z of [10.9, 12.1, 13.3]) ctx.fillRect(TX(z), 256, 4, 256);
    ctx.fillRect(TX(0.2), TY(-0.05), TX(4.8) - TX(0.2), 3);
    // the insole: dark textile, the heel's cup worn a little lighter
    ctx.fillStyle = '#3a3836'; ctx.fillRect(768, 256, 256, 256);
    for (let i = 0; i < 2500; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '170,160,150'},${0.05 + r() * 0.07})`; ctx.fillRect(768 + r() * 256, 256 + r() * 256, 1 + r() * 2, 1 + r() * 2); }
    { const g = ctx.createRadialGradient(896, 470, 4, 896, 470, 70); g.addColorStop(0, 'rgba(255,240,220,0.08)'); g.addColorStop(1, 'rgba(255,240,220,0)'); ctx.fillStyle = g; ctx.fillRect(768, 256, 256, 256); }
  });
}

// small things: the coral webbing of the pull loop, dark plastic (aglets), the flat lace (a band right across, so it wraps), the socks
function accentTexture() {
  const r = rng(83);
  return drawTexture(ACC, ACC, (ctx) => {
    ctx.fillStyle = '#8e8a85'; ctx.fillRect(0, 0, ACC, ACC);
    ctx.fillStyle = '#d9643c'; ctx.fillRect(0, 0, 256, 96);
    for (let y = 0; y < 96; y += 3) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, y, 256, 1); }
    ctx.strokeStyle = 'rgba(70,24,10,0.45)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]); for (const x of [26, 222]) { ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x, 90); ctx.stroke(); } ctx.setLineDash([]);
    { const g = ctx.createLinearGradient(256, 0, 512, 0); g.addColorStop(0, '#242322'); g.addColorStop(0.5, '#4a4846'); g.addColorStop(1, '#242322'); ctx.fillStyle = g; ctx.fillRect(256, 0, 256, 96); }
    // the lace: a light grey flat braid, herringbone across it, its edges a shade darker
    ctx.fillStyle = '#b3aea5'; ctx.fillRect(0, 96, ACC, 64);
    ctx.strokeStyle = 'rgba(60,54,46,0.16)'; ctx.lineWidth = 1.5;
    for (let x = -64; x < ACC + 64; x += 8) { ctx.beginPath(); ctx.moveTo(x, 102); ctx.lineTo(x + 13, 128); ctx.lineTo(x, 154); ctx.stroke(); }
    ctx.fillStyle = 'rgba(60,54,46,0.3)'; ctx.fillRect(0, 100, ACC, 3); ctx.fillRect(0, 151, ACC, 3);
    // the socks, mapped from above (x across, the cuffs at the top, the toes at the bottom): heather grey knit in fine courses,
    // ribbed cuffs, a fine coral line under them, the toe's seam and its reinforced tip a shade darker
    ctx.fillStyle = '#8e8a85'; ctx.fillRect(0, 160, ACC, 352);
    for (let i = 0; i < 5000; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '70,66,62' : '200,196,190'},${0.25 + r() * 0.3})`; ctx.fillRect(r() * ACC, 168 + r() * 264, 1 + r() * 2, 1); }
    for (let y = 168; y < 432; y += 4) { ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.fillRect(0, y, ACC, 1); }
    ctx.fillStyle = 'rgba(40,36,32,0.12)'; ctx.fillRect(0, 168, ACC, 54);
    for (let x = 0; x < ACC; x += 3) { ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(x, 168, 1.2, 54); }
    ctx.fillStyle = '#d9643c'; ctx.fillRect(0, 224, ACC, 3);
    ctx.fillStyle = 'rgba(40,36,32,0.16)'; ctx.fillRect(0, 396, ACC, 36);
    ctx.fillStyle = 'rgba(40,36,32,0.45)'; ctx.fillRect(0, 404, ACC, 2);
  }, { repeat: true });
}

// the sandal jepit: the footbed (pebbled white rubber, a moulded rim, worn grey where the foot presses), the navy tread, plain strips
// of white and navy for the edges and the strap
function flipTexture() {
  const r = rng(97);
  return drawTexture(FLIP_PX, FLIP_PX, (ctx) => {
    const X = (x) => 8 + (224 * (x + 3)) / 6, Y = (z) => 8 + (496 * (14.3 - z)) / 14.4;
    ctx.fillStyle = '#e8e6e0'; ctx.fillRect(0, 0, 256, FLIP_PX);
    for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '120,116,108' : '255,255,255'},${0.08 + r() * 0.12})`; ctx.beginPath(); ctx.arc(r() * 240, r() * FLIP_PX, 0.6 + r() * 0.9, 0, TAU); ctx.fill(); }
    // the moulded rim: a fine line just inside the edge
    ctx.strokeStyle = 'rgba(70,64,56,0.18)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 200; i++) { const c = FLIP((5 * i) / 200), k = (c.R - 0.32) / c.R, x = c.Q[0] + (c.B[0] - c.Q[0]) * k, z = c.Q[1] + (c.B[1] - c.Q[1]) * k; if (i) ctx.lineTo(X(x), Y(z)); else ctx.moveTo(X(x), Y(z)); }
    ctx.stroke();
    // worn grey where the heel, the ball and the toes press
    for (const [x, z, rx, rz, a] of [[flipXs(2.7), 2.7, 1.1, 1.5, 0.2], [-0.15, 10.0, 1.4, 1.2, 0.16], [-1.05, 12.85, 0.5, 0.55, 0.16], [0.35, 12.6, 0.35, 0.4, 0.1], [0.95, 12.25, 0.3, 0.35, 0.08]]) {
      ctx.save(); ctx.translate(X(x), Y(z)); ctx.scale(1, (rz * 496 / 14.4) / (rx * 224 / 6));
      const R = (rx * 224) / 6, g = ctx.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, `rgba(110,100,88,${a})`); g.addColorStop(1, 'rgba(110,100,88,0)'); ctx.fillStyle = g; ctx.fillRect(-R, -R, 2 * R, 2 * R); ctx.restore();
    }
    ctx.fillStyle = 'rgba(40,36,30,0.5)'; for (const [x, z] of [POST, ...PLUG]) { ctx.beginPath(); ctx.arc(X(x), Y(z), 5, 0, TAU); ctx.fill(); }
    // plain strips: white for the top layer's edge, navy for the sole's edge and the strap
    ctx.fillStyle = '#eceae4'; ctx.fillRect(240, 0, 16, FLIP_PX);
    ctx.fillStyle = '#1f2b4d'; ctx.fillRect(256, 0, 256, FLIP_PX);
    for (let y = 8; y < FLIP_PX - 8; y += 9) { ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 260; x <= 492; x += 8) { const yy = y + 2 * Math.sin(x * 0.12); if (x === 260) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); } ctx.stroke(); }
    { const g = ctx.createLinearGradient(496, 0, 512, 0); g.addColorStop(0, '#1a2443'); g.addColorStop(0.5, '#2c3b66'); g.addColorStop(1, '#1a2443'); ctx.fillStyle = g; ctx.fillRect(496, 0, 16, FLIP_PX); }
  });
}

// the contact shadow: a soft dark ellipse, its alpha all that matters (black, unlit), clear at the canvas's edge so it clamps to nothing
function contactTexture() {
  return drawTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2 - 1);
    g.addColorStop(0, 'rgba(0,0,0,0.78)'); g.addColorStop(0.62, 'rgba(0,0,0,0.74)'); g.addColorStop(0.75, 'rgba(0,0,0,0.56)'); g.addColorStop(0.87, 'rgba(0,0,0,0.24)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

/**
 * The shoe rack, with its pair of running shoes, the socks and the sandal jepit. Returns { root, dimmable }: root is a Node named
 * 'shoe-rack' (origin on the floor at the middle of the back edge, +z out of the wall); dimmable lists its materials, whose emissive
 * (their painted-in light) the room scales with its own.
 */
export function buildShoeRack() {
  const root = new Node('shoe-rack'), rim = color('#d9a86a');
  const mat = (name, tex, k, o = {}) => { const m = new Material({ color: [1, 1, 1], map: tex, emissive: [k, k, k], emissiveMap: tex, roughness: 0.6, metalness: 0, fresnel: 0.18, fresnelColor: rim, receiveShadow: false, ...o }); m.name = name; return m; };
  const M = {
    walnut: mat('walnut', walnutTexture(), 0.58, { roughness: 0.5, fresnel: 0.22 }),
    upper: mat('upper', upperTexture(shoeLayout()), 0.52, { roughness: 0.82, fresnel: 0.16 }),
    sole: mat('sole', soleTexture(), 0.45, { roughness: 0.62, fresnel: 0.16 }),
    accent: mat('accent', accentTexture(), 0.5, { roughness: 0.7, fresnel: 0.16 }),
    flip: mat('flip-flop', flipTexture(), 0.5, { roughness: 0.55, fresnel: 0.15 }),
  };
  const parts = Object.fromEntries(Object.keys(M).map((k) => [k, []]));
  for (const g of buildRack()) parts.walnut.push(g);
  const top = TIERS[1].y, low = TIERS[0].y;
  // the running shoes: built once, the right one the left's mirror image, set down heel to the wall
  const shoe = buildShoe(), shade = [];
  for (const s of SHOE_AT) {
    const m = setDown(s.x, top, s.z, s.yaw, SL / 2);
    for (const k of ['upper', 'sole', 'accent']) for (const g of shoe[k]) parts[k].push(xform(s.right ? mirrorX(g) : g, m));
    shade.push({ m, c: [0, 7.3], hx: 3.6, hz: 8.6, y: top });
  }
  const flip = buildFlipFlop();
  for (const s of FLIP_AT) {
    const m = setDown(s.x, low, s.z, s.yaw, FLEN / 2);
    for (const g of flip) parts.flip.push(xform(s.right ? mirrorX(g) : g, m));
    shade.push({ m, c: [0, FLEN / 2], hx: 3.25, hz: 8.0, y: low });
  }
  const sm = M4.compose(new Array(16), [SOCKS_AT.x, top, SOCKS_AT.z], [0, SOCKS_AT.yaw, 0], [1, 1, 1]);
  for (const g of buildSocks()) parts.accent.push(xform(g, sm));
  shade.push({ m: sm, c: [0, 0], hx: 2.5, hz: 3.2, y: top });
  for (const [k, list] of Object.entries(parts)) {
    const mesh = new Mesh(merge(list.map((g) => ({ geo: g }))), M[k], 'shoe-rack:' + M[k].name);
    mesh.castShadow = false; root.add(mesh);
  }
  // the contact shadows: one transparent draw call over the opaque five (no emissive, so nothing for the room to dim)
  const shadow = new Material({ color: [0, 0, 0], map: contactTexture(), unlit: true, transparent: true, depthWrite: false, opacity: 0.9, receiveShadow: false });
  shadow.name = 'contact-shadow';
  const shadowMesh = new Mesh(contactShadows(shade), shadow, 'shoe-rack:contact-shadow'); shadowMesh.castShadow = false; root.add(shadowMesh);
  const dimmable = Object.values(M);
  root.userData.dimmable = dimmable;
  return { root, dimmable };
}
