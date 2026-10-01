// The watch box on the left of the desk: a walnut three-slot case, lid open, holding a Patek Philippe Nautilus 5712/1A
// (blue), a Cartier Santos (large, steel) and a TAG Heuer Aquaracer Professional 300 (blue). Everything is modelled in
// millimetres from reference photos and scaled to the desk (1 unit ≈ 2 cm). The hands keep the visitor's local time.
import { Node, Mesh, Material } from 'engine/scene';
import { box, roundedBox, cylinder, sphere, merge } from 'engine/geometry';
import { drawTexture, SANS } from 'engine/textures';
import { M4, color } from 'engine/math';
import { flatten } from 'app/bake';

const MM = 0.05; // mm → desk units
const TAU = Math.PI * 2;
const SERIF = '"Times New Roman", Georgia, serif';

// ---------- 2D signed distance shapes (mm, x → 3 o'clock, z → 6 o'clock)
const circle = (R) => (x, z) => Math.hypot(x, z) - R;
const union = (...fs) => (x, z) => Math.min(...fs.map((f) => f(x, z)));
const moved = (f, dx, dz) => (x, z) => f(x - dx, z - dz);
// convex polygon from half-planes [angle, distance]; exact distance, optionally rounded by r
function hull(planes, r = 0) {
  const P = planes.map(([a, d]) => [a, d - r]); const V = [];
  for (let i = 0; i < P.length; i++) {
    const [a1, d1] = P[i], [a2, d2] = P[(i + 1) % P.length];
    const c1 = Math.cos(a1), s1 = Math.sin(a1), c2 = Math.cos(a2), s2 = Math.sin(a2), det = c1 * s2 - s1 * c2;
    V.push([(d1 * s2 - d2 * s1) / det, (c1 * d2 - c2 * d1) / det]);
  }
  return (x, z) => sdConvex(V, x, z) - r;
}
function sdConvex(V, x, z) {
  let dmin = Infinity, maxLine = -Infinity;
  for (let i = 0; i < V.length; i++) {
    const [ax, az] = V[i], [bx, bz] = V[(i + 1) % V.length];
    const ex = bx - ax, ez = bz - az, px = x - ax, pz = z - az, l2 = ex * ex + ez * ez;
    const t = Math.max(0, Math.min(1, (px * ex + pz * ez) / l2));
    dmin = Math.min(dmin, Math.hypot(px - ex * t, pz - ez * t));
    maxLine = Math.max(maxLine, (px * ez - pz * ex) / Math.sqrt(l2));
  }
  return maxLine <= 0 ? maxLine : dmin;
}
const rect = (hx, hz, r = 0) => hull([[0, hx], [Math.PI / 2, hz], [Math.PI, hx], [Math.PI * 1.5, hz]], r);
const octo = (hx, hz, hd, r = 0) => hull([0, 1, 2, 3, 4, 5, 6, 7].map((k) => [k * Math.PI / 4, k % 2 ? hd : k % 4 === 0 ? hx : hz]), r);
const ngon = (n, a, r = 0) => hull(Array.from({ length: n }, (_, k) => [k * TAU / n, a]), r);
const polyHull = (V, r = 0) => (x, z) => sdConvex(V, x, z) - r; // V counter-clockwise in (x, z)

// ---------- geometry builder
class Geo {
  constructor(uv = 50) { this.p = []; this.n = []; this.u = []; this.i = []; this.uv = uv; }
  v(x, y, z, nx = 0, ny = 1, nz = 0) { this.p.push(x, y, z); this.n.push(nx, ny, nz); this.u.push(0.5 + x / this.uv, 0.5 - z / this.uv); return this.p.length / 3 - 1; }
  // triangle wound so its face normal agrees with the expected direction e
  t(a, b, c, e) {
    const P = this.p, ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
    const ux = P[b * 3] - ax, uy = P[b * 3 + 1] - ay, uz = P[b * 3 + 2] - az, vx = P[c * 3] - ax, vy = P[c * 3 + 1] - ay, vz = P[c * 3 + 2] - az;
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (cx * e[0] + cy * e[1] + cz * e[2] < 0) this.i.push(a, c, b); else this.i.push(a, b, c);
  }
  // smooth normals from the faces (area weighted)
  smooth() {
    const P = this.p, N = new Array(P.length).fill(0), I = this.i;
    for (let k = 0; k < I.length; k += 3) {
      const a = I[k] * 3, b = I[k + 1] * 3, c = I[k + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
      for (const q of [a, b, c]) { N[q] += cx; N[q + 1] += cy; N[q + 2] += cz; }
    }
    for (let q = 0; q < N.length; q += 3) { const l = Math.hypot(N[q], N[q + 1], N[q + 2]) || 1; N[q] /= l; N[q + 1] /= l; N[q + 2] /= l; }
    this.n = N; return this;
  }
  build() {
    const positions = new Float32Array(this.p), min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let q = 0; q < positions.length; q += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], positions[q + k]); max[k] = Math.max(max[k], positions[q + k]); }
    return { positions, normals: new Float32Array(this.n), uvs: new Float32Array(this.u), indices: positions.length / 3 > 65535 ? new Uint32Array(this.i) : new Uint16Array(this.i), bounds: { min, max } };
  }
}

/**
 * A solid swept around the y axis whose cross-section at each profile point is an offset of a 2D shape.
 * profile: [d, y, opts?] from the top centre outward and down (d = offset from the shape, null = the axis);
 * opts.f swaps the shape for that point, opts.sharp creases there. corners: angles where the outline creases.
 */
function solid(f, profile, { n = 72, corners = null, uv = 50, rmax = 90 } = {}) {
  const g = new Geo(uv);
  const radius = (fn, th, d) => { const c = Math.cos(th), s = Math.sin(th); let lo = 0, hi = rmax; for (let k = 0; k < 42; k++) { const m = (lo + hi) / 2; if (fn(m * c, m * s) < d) lo = m; else hi = m; } return (lo + hi) / 2; };
  // columns: one closed loop, or one open run per facet between creases
  const runs = [];
  if (corners) { const cs = [...corners].sort((a, b) => a - b); for (let k = 0; k < cs.length; k++) { const a0 = cs[k], a1 = k + 1 < cs.length ? cs[k + 1] : cs[0] + TAU; const m = Math.max(1, Math.round((n * (a1 - a0)) / TAU)); runs.push({ th: Array.from({ length: m + 1 }, (_, j) => a0 + ((a1 - a0) * j) / m), closed: false }); } }
  else runs.push({ th: Array.from({ length: n }, (_, j) => (TAU * j) / n), closed: true });
  for (const run of runs) {
    const rows = profile.map(([d, y, o = {}]) => run.th.map((th) => { const r = d === null ? 0 : radius(o.f || f, th, d); return { x: r * Math.cos(th), y, z: r * Math.sin(th), r }; }));
    const mk = (row) => row.map((p) => g.v(p.x, p.y, p.z));
    const rowIn = [], rowOut = [];
    for (let i = 0; i < rows.length; i++) { const a = mk(rows[i]); rowIn[i] = a; rowOut[i] = profile[i][2]?.sharp && i > 0 && i < rows.length - 1 ? mk(rows[i]) : a; }
    const cols = run.th.length, span = run.closed ? cols : cols - 1;
    for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < span; j++) {
      const j1 = (j + 1) % cols, th = run.th[j];
      const dr = rows[i + 1][j].r - rows[i][j].r, dy = rows[i + 1][j].y - rows[i][j].y;
      const e = [-dy * Math.cos(th), dr, -dy * Math.sin(th)];
      const a = rowOut[i][j], b = rowOut[i][j1], c = rowIn[i + 1][j], d = rowIn[i + 1][j1];
      g.t(a, c, b, e); g.t(b, c, d, e);
    }
  }
  return g.smooth().build();
}

/** A flat-shaded prism from a convex outline (x, z) between heights y0 and y1. */
function prism(V, y0, y1, uv = 50) {
  const g = new Geo(uv); let area = 0;
  for (let k = 0; k < V.length; k++) { const [ax, az] = V[k], [bx, bz] = V[(k + 1) % V.length]; area += ax * bz - bx * az; }
  const W = area < 0 ? [...V].reverse() : V;
  const cx = W.reduce((s, p) => s + p[0], 0) / W.length, cz = W.reduce((s, p) => s + p[1], 0) / W.length;
  for (const [y, ny] of [[y1, 1], [y0, -1]]) { const c = g.v(cx, y, cz, 0, ny, 0); const ring = W.map(([x, z]) => g.v(x, y, z, 0, ny, 0)); for (let k = 0; k < W.length; k++) g.t(c, ring[k], ring[(k + 1) % W.length], [0, ny, 0]); }
  for (let k = 0; k < W.length; k++) {
    const [ax, az] = W[k], [bx, bz] = W[(k + 1) % W.length], ex = bx - ax, ez = bz - az, l = Math.hypot(ex, ez), nx = ez / l, nz = -ex / l;
    const a = g.v(ax, y0, az, nx, 0, nz), b = g.v(bx, y0, bz, nx, 0, nz), c = g.v(ax, y1, az, nx, 0, nz), d = g.v(bx, y1, bz, nx, 0, nz);
    g.t(a, b, c, [nx, 0, nz]); g.t(b, d, c, [nx, 0, nz]);
  }
  return g.build();
}
const circlePts = (r, n, cx = 0, cz = 0, rot = 0) => Array.from({ length: n }, (_, k) => [cx + r * Math.cos(rot + (k * TAU) / n), cz + r * Math.sin(rot + (k * TAU) / n)]);

// ---------- baking: transform a geometry, and merge many parts per material into one mesh
const tmpM = M4.create();
function xf(geo, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  M4.compose(tmpM, p, r, [1, 1, 1]); const m = tmpM;
  const P = geo.positions, N = geo.normals, pos = new Float32Array(P.length), nor = new Float32Array(N.length);
  for (let q = 0; q < P.length; q += 3) {
    const x = P[q] * s[0], y = P[q + 1] * s[1], z = P[q + 2] * s[2];
    pos[q] = m[0] * x + m[4] * y + m[8] * z + m[12]; pos[q + 1] = m[1] * x + m[5] * y + m[9] * z + m[13]; pos[q + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    const nx = N[q] / s[0], ny = N[q + 1] / s[1], nz = N[q + 2] / s[2];
    const ox = m[0] * nx + m[4] * ny + m[8] * nz, oy = m[1] * nx + m[5] * ny + m[9] * nz, oz = m[2] * nx + m[6] * ny + m[10] * nz, l = Math.hypot(ox, oy, oz) || 1;
    nor[q] = ox / l; nor[q + 1] = oy / l; nor[q + 2] = oz / l;
  }
  return { positions: pos, normals: nor, uvs: geo.uvs, indices: geo.indices, bounds: geo.bounds };
}
class Batch {
  constructor() { this.parts = new Map(); }
  put(mat, geo, p, r, s) { if (!this.parts.has(mat)) this.parts.set(mat, []); this.parts.get(mat).push(p || r || s ? xf(geo, p || undefined, r || undefined, s || undefined) : geo); return this; }
  into(parent, name) { for (const [mat, list] of this.parts) { const m = new Mesh(merge(list.map((geo) => ({ geo }))), mat, name); m.castShadow = !mat.transparent; if (mat.transparent) m.renderOrder = 10; parent.add(m); } return parent; }
}

// ---------- materials
function brushedTexture() {
  return drawTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d8d8d8'; ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 900; k++) { const y = Math.random() * h, a = 0.02 + Math.random() * 0.05; ctx.fillStyle = Math.random() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`; ctx.fillRect(0, y, w, 0.6 + Math.random()); }
  }, { repeat: true });
}
function woodTexture() {
  return drawTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#7a4b2a'; ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 140; k++) { const y = Math.random() * h, a = 0.05 + Math.random() * 0.16; ctx.strokeStyle = Math.random() < 0.6 ? `rgba(40,20,8,${a})` : `rgba(255,220,170,${a * 0.5})`; ctx.lineWidth = 0.5 + Math.random() * 2.2; ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.012 + k) * 3 + Math.sin(x * 0.05 + k * 3) * 0.8); ctx.stroke(); }
  }, { repeat: true });
}
function suedeTexture() {
  return drawTexture(128, 128, (ctx, w, h) => { const img = ctx.createImageData(w, h); for (let q = 0; q < img.data.length; q += 4) { const v = 225 + (Math.random() - 0.5) * 36; img.data[q] = img.data[q + 1] = img.data[q + 2] = v; img.data[q + 3] = 255; } ctx.putImageData(img, 0, 0); }, { repeat: true });
}
function materials() {
  const brushed = brushedTexture();
  return {
    polished: new Material({ color: color('#e3e6ea'), metalness: 0.45, roughness: 0.13, fresnel: 0.4, fresnelColor: color('#fff1de'), emissive: color('#29292c') }),
    brushed: new Material({ color: color('#cfd2d6'), metalness: 0.4, roughness: 0.42, map: brushed, mapRepeat: [3, 3], fresnel: 0.2, fresnelColor: color('#f3e6d4'), emissive: color('#1f1f22') }),
    blued: new Material({ color: color('#1d3590'), metalness: 0.6, roughness: 0.22, fresnel: 0.3, fresnelColor: color('#6f8cff'), emissive: color('#050b24') }),
    lume: new Material({ color: color('#efeadb'), roughness: 0.7, emissive: color('#3d4a3a') }),
    orange: new Material({ color: color('#f08a1c'), roughness: 0.5, emissive: color('#3a1a00') }),
    spinel: new Material({ color: color('#1f3fae'), metalness: 0.1, roughness: 0.06, fresnel: 0.6, fresnelColor: color('#8fb0ff'), emissive: color('#06103a') }),
    crystal: new Material({ color: [0.95, 0.96, 1], roughness: 0.04, opacity: 0.12, transparent: true, depthWrite: false, fresnel: 0.55, fresnelColor: color('#fff4e2') }),
    dark: new Material({ color: color('#0b0c0f'), roughness: 0.6 }),
    wood: new Material({ color: color('#b07040'), roughness: 0.42, metalness: 0.04, map: woodTexture(), mapRepeat: [1, 1] }),
    suede: new Material({ color: color('#9b8468'), roughness: 1, map: suedeTexture(), mapRepeat: [4, 4] }),
    brass: new Material({ color: color('#d2a95c'), metalness: 0.8, roughness: 0.28, fresnel: 0.25, fresnelColor: color('#ffe3b0'), emissive: color('#1d1407') }),
    glass: new Material({ color: [0.92, 0.9, 0.86], roughness: 0.05, opacity: 0.1, transparent: true, depthWrite: false, fresnel: 0.5, fresnelColor: color('#ffe9c8') }),
  };
}

// ---------- dials: drawn in millimetres (origin = centre, +y = 6 o'clock)
function dialTexture(uv, draw) {
  return drawTexture(1024, 1024, (ctx, w) => { ctx.setTransform(w / uv, 0, 0, w / uv, w / 2, w / 2); draw(ctx); });
}
const at = (h, r) => [Math.sin((h / 12) * TAU) * r, -Math.cos((h / 12) * TAU) * r];
function text(ctx, s, x, y, font, fill, { spacing = 0, rot = 0, sx = 1, sy = 1 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sx, sy); ctx.font = font; ctx.fillStyle = fill; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (spacing) { const ws = [...s].map((c) => ctx.measureText(c).width), total = ws.reduce((a, b) => a + b, 0) + spacing * (s.length - 1); let cx = -total / 2; [...s].forEach((c, k) => { ctx.fillText(c, cx + ws[k] / 2, 0); cx += ws[k] + spacing; }); }
  else ctx.fillText(s, 0, 0);
  ctx.restore();
}
function moonAge(d = new Date()) { const syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14); return ((((d.getTime() - ref) / 86400000) % syn) + syn) % syn; }

function nautilusDial(ctx) {
  const day = new Date().getDate();
  const g = ctx.createRadialGradient(0, -3, 0.5, 0, 0, 22); g.addColorStop(0, '#3b6c96'); g.addColorStop(0.45, '#23466e'); g.addColorStop(1, '#0a1424');
  ctx.fillStyle = g; ctx.fillRect(-17, -17, 34, 34);
  // the embossed horizontal bands of the Nautilus dial
  for (let y = -17; y < 17; y += 1.1) { ctx.fillStyle = 'rgba(160,200,235,0.10)'; ctx.fillRect(-17, y, 34, 0.22); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(-17, y + 0.62, 34, 0.26); }
  const sub = (cx, cy, r, base) => { const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); sg.addColorStop(0, base[0]); sg.addColorStop(1, base[1]); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 0.06; for (let k = 0.4; k < r; k += 0.22) { ctx.beginPath(); ctx.arc(cx, cy, k, 0, TAU); ctx.stroke(); } };
  // date + moon phase at 7
  const [dx, dy] = [-3.4, 7.4];
  sub(dx, dy, 5.7, ['#1f3a5c', '#0f1f35']);
  for (let n = 1; n <= 31; n++) { const a = ((n - 1) / 31) * TAU, x = dx + Math.sin(a) * 4.75, y = dy - Math.cos(a) * 4.75; if (n % 2) text(ctx, String(n), x, y, `600 0.78px ${SANS}`, n === 1 ? '#d23b3b' : '#e9eef5', { rot: a }); else { ctx.fillStyle = '#c9d3df'; ctx.beginPath(); ctx.arc(x, y, 0.1, 0, TAU); ctx.fill(); } }
  ctx.save(); ctx.beginPath(); ctx.arc(dx, dy - 0.1, 3.4, Math.PI, 0); ctx.closePath(); ctx.clip();
  ctx.fillStyle = '#0a1630'; ctx.fillRect(dx - 4, dy - 4, 8, 4);
  for (const [sx, sy] of [[-2.4, -1.2], [-1.4, -2.6], [0, -1.8], [1.5, -2.7], [2.5, -1.0], [-0.6, -0.7], [1.0, -0.6]]) { ctx.fillStyle = '#e6dcc0'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 0.12 : 0.3, a = (k * Math.PI) / 5; ctx.lineTo(dx + sx + Math.sin(a) * rr, dy + sy - Math.cos(a) * rr); } ctx.fill(); }
  const age = moonAge(), mx = dx + Math.cos(Math.PI * (age / 29.53)) * -2.0;
  ctx.fillStyle = '#efe6c8'; ctx.beginPath(); ctx.arc(mx, dy - 1.7, 1.15, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#c4ccd6'; ctx.lineWidth = 0.08; ctx.beginPath(); ctx.arc(dx, dy - 0.1, 3.4, Math.PI, 0); ctx.stroke();
  // small seconds at 4
  const [sx, sy] = [7.5, 6.2];
  sub(sx, sy, 4.5, ['#2a4566', '#152842']);
  for (let k = 0; k < 60; k++) { const a = (k / 60) * TAU, r0 = k % 5 ? 3.9 : 3.55; ctx.strokeStyle = '#dfe6ee'; ctx.lineWidth = k % 5 ? 0.06 : 0.12; ctx.beginPath(); ctx.moveTo(sx + Math.sin(a) * r0, sy - Math.cos(a) * r0); ctx.lineTo(sx + Math.sin(a) * 4.25, sy - Math.cos(a) * 4.25); ctx.stroke(); }
  for (const [s, k] of [['60', 0], ['15', 15], ['30', 30], ['45', 45]]) { const a = (k / 60) * TAU; text(ctx, s, sx + Math.sin(a) * 2.6, sy - Math.cos(a) * 2.6, `500 0.85px ${SANS}`, '#e8edf3'); }
  // power reserve between 10 and 11
  const [px, py] = [-6.4, -6.0];
  ctx.strokeStyle = '#dfe6ee'; ctx.lineWidth = 0.07;
  for (let k = 0; k <= 12; k++) { const a = (115 - k * 10) * Math.PI / 180, r0 = k % 3 ? 3.7 : 3.35; ctx.beginPath(); ctx.moveTo(px + Math.cos(a) * r0, py + Math.sin(a) * r0); ctx.lineTo(px + Math.cos(a) * 4.0, py + Math.sin(a) * 4.0); ctx.stroke(); }
  ctx.strokeStyle = '#c8333a'; ctx.lineWidth = 0.32; ctx.beginPath(); ctx.arc(px, py, 3.85, -12 * Math.PI / 180, 2 * Math.PI / 180); ctx.stroke();
  for (const [s, a] of [['48', 115], ['36', 85], ['24', 55], ['12', 25]]) { const r = a * Math.PI / 180; text(ctx, s, px + Math.cos(r) * 2.55, py + Math.sin(r) * 2.55, `500 0.72px ${SANS}`, '#e3e9f0'); }
  // signature, set to the right of centre as on the 5712
  text(ctx, 'PATEK PHILIPPE', 4.1, -3.7, `700 1.32px ${SERIF}`, '#eef2f6', { spacing: 0.06, sx: 0.92 });
  text(ctx, 'GENEVE', 4.1, -2.15, `600 0.82px ${SERIF}`, '#e3e8ee', { spacing: 0.12 });
  text(ctx, 'SWISS', 0, 14.2, `500 0.42px ${SANS}`, '#d5dde6', { spacing: 0.05 });
  ctx.fillStyle = '#d5dde6'; ctx.fillRect(-0.25, 12.9, 0.5, 0.55);
  ctx.fillStyle = '#e9eef5'; text(ctx, String(day), dx + Math.sin(((day - 1) / 31) * TAU) * 4.75, dy - Math.cos(((day - 1) / 31) * TAU) * 4.75, `600 0.78px ${SANS}`, '#ffffff', { rot: ((day - 1) / 31) * TAU });
}

function santosDial(ctx) {
  const day = new Date().getDate();
  const g = ctx.createRadialGradient(0, -2, 1, 0, 0, 24); g.addColorStop(0, '#f7f5f0'); g.addColorStop(1, '#dcd8d0');
  ctx.fillStyle = g; ctx.fillRect(-17, -17, 34, 34);
  for (let k = 0; k < 2400; k++) { ctx.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '120,115,105'},0.06)`; ctx.fillRect(Math.random() * 34 - 17, Math.random() * 34 - 17, 0.15, 0.15); }
  // Roman numerals on a square, set radially (Cartier writes IIII)
  const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  for (let h = 0; h < 12; h++) {
    if (h === 6) continue; // the date sits at 6
    const a = (h / 12) * TAU, sx = Math.sin(a), sy = -Math.cos(a), k = 11.0 / Math.max(Math.abs(sx), Math.abs(sy));
    text(ctx, ROMAN[h], sx * k, sy * k, `700 3.1px ${SERIF}`, '#121212', { rot: a, sx: h % 3 === 0 ? 0.62 : 0.5, sy: 1.25 });
  }
  // railway minute track around the centre
  const sq = (r) => { ctx.strokeRect(-r, -r, 2 * r, 2 * r); };
  ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 0.09; sq(8.6); sq(7.95);
  for (let m = 0; m < 60; m++) { const a = (m / 60) * TAU, sx = Math.sin(a), sy = -Math.cos(a), k = 1 / Math.max(Math.abs(sx), Math.abs(sy)); ctx.lineWidth = m % 5 ? 0.06 : 0.13; ctx.beginPath(); ctx.moveTo(sx * k * 7.95, sy * k * 7.95); ctx.lineTo(sx * k * 8.6, sy * k * 8.6); ctx.stroke(); }
  text(ctx, 'CARTIER', 0, -5.4, `600 1.2px ${SERIF}`, '#151515', { spacing: 0.12 });
  text(ctx, 'AUTOMATIC', 0, 5.6, `500 0.72px ${SANS}`, '#2a2a2a', { spacing: 0.08 });
  text(ctx, 'SWISS', -3.6, 14.1, `500 0.42px ${SANS}`, '#555', { spacing: 0.05 }); text(ctx, 'MADE', 3.6, 14.1, `500 0.42px ${SANS}`, '#555', { spacing: 0.05 });
  // date at 6
  ctx.fillStyle = '#9a968f'; ctx.fillRect(-1.45, 9.95, 2.9, 3.0); ctx.fillStyle = '#ffffff'; ctx.fillRect(-1.3, 10.1, 2.6, 2.7);
  text(ctx, String(day), 0, 11.5, `600 1.7px ${SANS}`, '#111');
}

function aquaracerDial(ctx) {
  const day = new Date().getDate();
  const g = ctx.createRadialGradient(0, 0, 0.5, 0, 0, 18); g.addColorStop(0, '#3a72c0'); g.addColorStop(0.6, '#24508f'); g.addColorStop(1, '#122d57');
  ctx.fillStyle = g; ctx.fillRect(-20, -20, 40, 40);
  // sunray under horizontal grooves
  for (let k = 0; k < 360; k++) { const a = (k / 360) * TAU; ctx.strokeStyle = `rgba(255,255,255,${0.025 + 0.03 * Math.abs(Math.sin(a * 2))})`; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17); ctx.stroke(); }
  for (let y = -17; y < 17; y += 0.78) { ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(-17, y, 34, 0.16); ctx.fillStyle = 'rgba(190,215,255,0.10)'; ctx.fillRect(-17, y + 0.2, 34, 0.1); }
  text(ctx, 'AQUARACER', 0, -8.1, `600 1.15px ${SANS}`, '#f1f4f8', { spacing: 0.16 });
  // the applied shield logo
  ctx.save(); ctx.translate(0, -5.5); ctx.strokeStyle = '#e8edf2'; ctx.lineWidth = 0.14; ctx.fillStyle = 'rgba(210,220,232,0.18)';
  ctx.beginPath(); ctx.moveTo(-1.35, -1.25); ctx.lineTo(1.35, -1.25); ctx.lineTo(1.35, 0.55); ctx.quadraticCurveTo(1.35, 1.1, 0, 1.45); ctx.quadraticCurveTo(-1.35, 1.1, -1.35, 0.55); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-1.35, -0.2); ctx.lineTo(1.35, -0.2); ctx.stroke();
  text(ctx, 'TAG', 0, -0.72, `700 0.78px ${SANS}`, '#f4f6f8', { spacing: 0.05 }); text(ctx, 'HEUER', 0, 0.42, `700 0.52px ${SANS}`, '#f4f6f8');
  ctx.restore();
  text(ctx, 'AUTOMATIC', 0, 4.3, `600 0.82px ${SANS}`, '#c7d93a', { spacing: 0.08 });
  text(ctx, '300 m / 1000 ft', 0, 5.8, `500 0.66px ${SANS}`, '#e9eef5');
  text(ctx, 'SWISS', -2.3, 14.4, `500 0.42px ${SANS}`, '#dfe6ee', { spacing: 0.04 }); text(ctx, 'MADE', 2.3, 14.4, `500 0.42px ${SANS}`, '#dfe6ee', { spacing: 0.04 });
  // date at 6 inside its round frame
  ctx.fillStyle = '#f7f7f4'; ctx.beginPath(); ctx.arc(0, 11.0, 1.75, 0, TAU); ctx.fill();
  text(ctx, String(day), 0, 11.05, `600 1.55px ${SANS}`, '#111');
  // rehaut: minute ticks on the sloped chapter ring
  ctx.fillStyle = '#0f2447'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.arc(0, 0, 15.55, 0, TAU, true); ctx.fill();
  for (let m = 0; m < 60; m++) { const a = (m / 60) * TAU; ctx.strokeStyle = '#eef2f7'; ctx.lineWidth = m % 5 ? 0.08 : 0.16; ctx.beginPath(); ctx.moveTo(Math.sin(a) * 15.8, -Math.cos(a) * 15.8); ctx.lineTo(Math.sin(a) * (m % 5 ? 16.3 : 16.6), -Math.cos(a) * (m % 5 ? 16.3 : 16.6)); ctx.stroke(); }
}
function aquaracerInsert(ctx) {
  const g = ctx.createRadialGradient(0, 0, 16, 0, 0, 21); g.addColorStop(0, '#20366b'); g.addColorStop(1, '#16274f');
  ctx.fillStyle = g; ctx.fillRect(-22, -22, 44, 44);
  ctx.fillStyle = '#f4f6f9'; ctx.strokeStyle = '#f4f6f9';
  for (let m = 1; m < 60; m++) {
    const a = (m / 60) * TAU, s = Math.sin(a), c = -Math.cos(a);
    if (m % 10 === 0) { const flip = m > 15 && m < 45; text(ctx, String(m), s * 18.15, c * 18.15, `600 2.0px ${SANS}`, '#f4f6f9', { rot: a + (flip ? Math.PI : 0), sx: 0.9 }); }
    else if (m % 5 === 0) { ctx.lineWidth = 0.45; ctx.beginPath(); ctx.moveTo(s * 17.4, c * 17.4); ctx.lineTo(s * 18.9, c * 18.9); ctx.stroke(); }
    else if (m < 15) { ctx.lineWidth = 0.2; ctx.beginPath(); ctx.moveTo(s * 18.1, c * 18.1); ctx.lineTo(s * 18.9, c * 18.9); ctx.stroke(); }
  }
  // the 12 o'clock triangle with its lume pip
  ctx.lineWidth = 0.32; ctx.beginPath(); ctx.moveTo(-1.35, -19.2); ctx.lineTo(1.35, -19.2); ctx.lineTo(0, -16.95); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#e9efe2'; ctx.beginPath(); ctx.arc(0, -18.55, 0.42, 0, TAU); ctx.fill();
}

// ---------- hands (pointing to 12 = −z, pivot at the origin)
const hand = (pts) => pts.map(([x, z]) => [x, z]);
const sword = (len, w, tail) => hand([[0, -len], [w, -len * 0.62], [0.5, 0.3], [0.35, tail], [-0.35, tail], [-0.5, 0.3], [-w, -len * 0.62]]);
function makeHand(mats, parts) { const n = new Node('hand'); const b = new Batch(); for (const [mat, V, y0, y1] of parts) b.put(mats[mat], prism(V, y0, y1)); b.into(n, 'watch-hand'); return n; }

// ---------- bracelet: rows of links following the pillow from each lug down to the slot
function bracelet(b, { lugZ, lugY, path, rows, pitch, floor, link }) {
  for (const side of [1, -1]) {
    const run = path.filter(([z]) => z * side > lugZ + 0.8); if (side < 0) run.reverse();
    const pts = [[lugZ * side, lugY], ...run.map(([z, y]) => [z, y])];
    // walk the polyline at an even pitch
    let seg = 0, carry = pitch / 2;
    for (let k = 0; k < rows; k++) {
      let need = k === 0 ? carry : pitch;
      while (seg < pts.length - 1) { const [z0, y0] = pts[seg], [z1, y1] = pts[seg + 1], l = Math.hypot(z1 - z0, y1 - y0); if (need <= l) { const t = need / l; pts[seg] = [z0 + (z1 - z0) * t, y0 + (y1 - y0) * t]; break; } need -= l; seg++; }
      if (seg >= pts.length - 1) break;
      const [z, y] = pts[seg], [z1, y1] = pts[seg + 1], tz = (z1 - z) * side, ty = y1 - y, tl = Math.hypot(tz, ty) || 1;
      if (y < floor) break;
      const ang = Math.atan2(-ty / tl, tz / tl) * side;
      link(b, [0, y, z], [ang, 0, 0], k);
    }
  }
}
// the pillow's cross-section (z, y), offset outward by d
function pillowPath(cy, hz, hy, r, d) {
  const f = rect(hz, hy, r), out = [];
  for (let k = 0; k <= 96; k++) { const a = (k / 96) * Math.PI * 2; const s = Math.sin(a), c = Math.cos(a); let lo = 0, hi = 80; for (let q = 0; q < 40; q++) { const m = (lo + hi) / 2; if (f(m * s, m * c) < d) lo = m; else hi = m; } out.push([lo * s, cy + lo * c]); }
  return out;
}

// ---------- the three watches (mm; y = 0 at the case back, dial up, 12 o'clock toward −z)
function nautilus(M, path, floor) {
  const w = new Node('nautilus'), b = new Batch();
  const bezelF = octo(18.05, 18.45, 22.2, 7.2), apF = octo(13.9, 14.25, 17.0, 5.6);
  const caseF = union(octo(19.5, 19.4, 23.6, 7.6), moved(rect(1.7, 9.2, 1.3), 20.0, 0), moved(rect(1.7, 9.2, 1.3), -20.0, 0), rect(13.6, 20.6, 1.0));
  b.put(M.brushed, solid(caseF, [[-4, 5.6], [0, 5.6, { sharp: 1 }], [0, 1.4, { sharp: 1 }], [-1.2, 0.7]]));
  b.put(M.polished, solid(circle(15.5), [[null, 0.7], [0, 0.7], [0.3, 0.2], [-0.6, 0]]));
  b.put(M.polished, solid(apF, [[0, 6.5], [0, 7.5, { sharp: 1 }], [0.9, 8.15]]));
  b.put(M.brushed, solid(bezelF, [[0.9, 8.15, { f: apF }], [-1.15, 8.15]]));
  b.put(M.polished, solid(bezelF, [[-1.15, 8.15], [-0.25, 7.9], [0, 7.35, { sharp: 1 }], [0, 5.6]]));
  // crown in the right-hand ear
  b.put(M.brushed, solid(ngon(18, 2.4, 0.15), [[null, 2.6], [-0.3, 2.6], [0, 2.3, { sharp: 1 }], [0, 0]], { n: 72, corners: Array.from({ length: 18 }, (_, k) => (k + 0.5) * TAU / 18) }), [21.5, 3.2, 0], [0, 0, -Math.PI / 2]);
  // dial, applied batons, crystal
  const dial = new Mesh(solid(apF, [[null, 6.5], [0.4, 6.5]], { uv: 34 }), new Material({ color: [1, 1, 1], roughness: 0.45, metalness: 0.1, map: dialTexture(34, nautilusDial), emissive: color('#060c16') }), 'nautilus-dial');
  w.add(dial);
  const baton = (h, off = 0) => {
    const a = (h / 12) * TAU, ux = Math.sin(a), uz = -Math.cos(a), px = -uz, pz = ux;
    let lo = 0, hi = 20; for (let q = 0; q < 30; q++) { const m = (lo + hi) / 2; if (apF(m * ux, m * uz) < -1.1) lo = m; else hi = m; }
    const pt = (r, l) => [ux * r + px * l, uz * r + pz * l], V = (hw, r0, r1) => [pt(r0, off - hw), pt(r1, off - hw), pt(r1, off + hw), pt(r0, off + hw)];
    b.put(M.polished, prism(V(0.55, lo - 3.6, lo), 6.5, 7.05)); b.put(M.lume, prism(V(0.32, lo - 3.3, lo - 0.3), 7.05, 7.1));
  };
  baton(0, -0.75); baton(0, 0.75); for (const h of [1, 2, 3, 8, 9, 10, 11]) baton(h);
  // subdial hands: date pointer at 7, small seconds at 4, power reserve at 10–11
  const day = new Date().getDate();
  const sub = (x, z, len, ang) => { const V = hand([[0, -len], [0.18, -len + 0.8], [0.14, 0.6], [-0.14, 0.6], [-0.18, -len + 0.8]]).map(([px, pz]) => [x + px * Math.cos(ang) - pz * Math.sin(ang), z + px * Math.sin(ang) + pz * Math.cos(ang)]); b.put(M.polished, prism(V, 6.55, 6.75)); b.put(M.polished, solid(circle(0.35), [[null, 6.85], [0, 6.85], [0, 6.5]], { n: 16 }), [x, 0, z]); };
  sub(-3.4, 7.4, 4.3, ((day - 1) / 31) * TAU);
  sub(-6.4, -6.0, 3.6, ((-5 + (38 / 48) * 120) + 90) * Math.PI / 180);
  b.put(M.crystal, solid(apF, [[null, 7.75], [0.3, 7.75]]));
  b.into(w, 'nautilus');
  // live hands
  const H = { hour: makeHand(M, [['polished', hand([[0, -10.2], [0.78, -9.3], [0.78, 0], [0.42, 1.9], [-0.42, 1.9], [-0.78, 0], [-0.78, -9.3]]), 0, 0.22], ['lume', hand([[0, -9.2], [0.42, -8.4], [0.42, -2.2], [-0.42, -2.2], [-0.42, -8.4]]), 0.22, 0.26]]),
    minute: makeHand(M, [['polished', hand([[0, -14.0], [0.62, -13.1], [0.55, 0], [0.3, 1.9], [-0.3, 1.9], [-0.55, 0], [-0.62, -13.1]]), 0, 0.22], ['lume', hand([[0, -13.2], [0.34, -12.6], [0.34, -2.4], [-0.34, -2.4], [-0.34, -12.6]]), 0.22, 0.26]]),
    second: makeHand(M, [['polished', hand([[0.09, -3.9], [0.09, 0.9], [-0.09, 0.9], [-0.09, -3.9]]), 0, 0.12]]) };
  H.hour.position = [0, 7.15, 0]; H.minute.position = [0, 7.45, 0]; H.second.position = [7.5, 6.85, 6.2];
  for (const h of Object.values(H)) w.add(h);
  const cap = new Mesh(solid(circle(0.75), [[null, 7.75], [0, 7.75], [0, 7.1]], { n: 24 }), M.polished); w.add(cap);
  // integrated bracelet: brushed outer links with a polished centre link
  const brace = new Batch();
  bracelet(brace, { lugZ: 20.4, lugY: 3.0, path, floor, rows: 12, pitch: 4.5, link: (bb, p, r, k) => {
    const wdt = 25.5 - Math.min(k, 9) * 0.6;
    bb.put(M.brushed, roundedBox({ w: wdt, h: 3.4, d: 4.15, r: 0.5, seg: 1, uvTopOnly: false }), p, r);
    bb.put(M.polished, roundedBox({ w: wdt * 0.47, h: 0.8, d: 2.3, r: 0.38, seg: 1, uvTopOnly: false }), [0, p[1] + 1.55 * Math.cos(r[0]), p[2] + 1.55 * Math.sin(r[0])], r);
  } });
  brace.into(w, 'nautilus-bracelet');
  return { node: w, hands: H, seconds: 'sub' };
}

function santos(M, path, floor) {
  const w = new Node('santos'), b = new Batch();
  const bezelF = octo(17.9, 19.8, 24.3, 2.2), apF = rect(14.7, 14.4, 2.0);
  const horn = rect(1.9, 2.4, 1.0);
  const caseF = union(octo(19.9, 19.8, 25.9, 2.6), moved(horn, 13.1, -21.4), moved(horn, -13.1, -21.4), moved(horn, 13.1, 21.4), moved(horn, -13.1, 21.4), moved(rect(1.6, 6.3, 1.3), 20.2, 0));
  b.put(M.brushed, solid(caseF, [[-4, 6.0], [-0.5, 6.0], [0, 5.6, { sharp: 1 }], [0, 1.5, { sharp: 1 }], [-1.2, 0.8]]));
  b.put(M.polished, solid(rect(16.5, 16.5, 4), [[null, 0.8], [0, 0.8], [0.2, 0.2], [-0.8, 0]]));
  b.put(M.polished, solid(apF, [[0, 6.6], [0, 7.6, { sharp: 1 }], [1.0, 8.2]]));
  b.put(M.brushed, solid(bezelF, [[1.0, 8.2, { f: apF }], [-0.9, 8.2]]));
  b.put(M.polished, solid(bezelF, [[-0.9, 8.2], [-0.2, 8.0], [0, 7.5, { sharp: 1 }], [0, 6.0]]));
  // the eight bezel screws
  const screw = solid(circle(0.78), [[null, 8.42], [-0.15, 8.42], [0, 8.3], [0, 8.0]], { n: 24 });
  for (const [x, z] of [[-8.3, -17.6], [8.3, -17.6], [-8.3, 17.6], [8.3, 17.6], [-16.2, -8.2], [-16.2, 8.2], [16.2, -8.2], [16.2, 8.2]]) { b.put(M.polished, screw, [x, 0, z]); b.put(M.dark, box(1.15, 0.08, 0.2), [x, 8.43, z], [0, 0.6, 0]); }
  // octagonal crown with the blue spinel cabochon
  b.put(M.polished, solid(ngon(8, 2.65, 0.1), [[null, 3.6], [-0.2, 3.6], [0, 3.3, { sharp: 1 }], [0, 0]], { n: 64, corners: Array.from({ length: 8 }, (_, k) => (k + 0.5) * TAU / 8) }), [21.6, 3.6, 0], [0, 0, -Math.PI / 2]);
  b.put(M.spinel, sphere(1.55, 20, 12), [25.25, 3.6, 0], null, [0.55, 1, 1]);
  const dial = new Mesh(solid(apF, [[null, 6.6], [0.4, 6.6]], { uv: 34 }), new Material({ color: [1, 1, 1], roughness: 0.55, map: dialTexture(34, santosDial), emissive: color('#141210') }), 'santos-dial');
  w.add(dial);
  b.put(M.crystal, solid(apF, [[null, 7.85], [0.3, 7.85]]));
  b.into(w, 'santos');
  const H = { hour: makeHand(M, [['blued', sword(8.7, 0.95, 1.6), 0, 0.2]]), minute: makeHand(M, [['blued', sword(12.6, 0.78, 1.8), 0, 0.2]]), second: makeHand(M, [['blued', hand([[0, -13.0], [0.12, -12], [0.14, 3.0], [-0.14, 3.0], [-0.12, -12]]), 0, 0.12]]) };
  H.hour.position = [0, 6.95, 0]; H.minute.position = [0, 7.2, 0]; H.second.position = [0, 7.45, 0];
  for (const h of Object.values(H)) w.add(h);
  const cap = new Mesh(sphere(0.62, 14, 8), M.blued); cap.position = [0, 7.55, 0]; w.add(cap);
  // SmartLink bracelet: one brushed link per row, two screws each; the first link sits between the horns
  const brace = new Batch();
  bracelet(brace, { lugZ: 19.4, lugY: 3.4, path, floor, rows: 11, pitch: 6.1, link: (bb, p, r, k) => {
    const wdt = 22.4 - Math.min(k, 8) * 0.35, up = [0, Math.cos(r[0]), Math.sin(r[0])];
    bb.put(M.brushed, roundedBox({ w: wdt, h: 3.1, d: 5.75, r: 0.55, seg: 1, uvTopOnly: false }), p, r);
    for (const sx of [-1, 1]) {
      bb.put(M.polished, cylinder(0.72, 0.72, 0.2, 10), [sx * wdt * 0.32, p[1] + up[1] * 1.6, p[2] + up[2] * 1.6], r);
      bb.put(M.dark, box(1.0, 0.1, 0.18), [sx * wdt * 0.32, p[1] + up[1] * 1.71, p[2] + up[2] * 1.71], [r[0], sx * 0.5, 0]);
    }
  } });
  brace.into(w, 'santos-bracelet');
  return { node: w, hands: H, seconds: 'centre' };
}

function aquaracer(M, path, floor) {
  const w = new Node('aquaracer'), b = new Batch();
  const bezel12 = ngon(12, 21.5, 0.35), corners12 = Array.from({ length: 12 }, (_, k) => (k + 0.5) * TAU / 12);
  const lugs = polyHull([[-12.4, -25.2], [12.4, -25.2], [19.4, -13.5], [19.4, 13.5], [12.4, 25.2], [-12.4, 25.2], [-19.4, 13.5], [-19.4, -13.5]], 2.4);
  const caseF = union(circle(21.0), lugs, moved(rect(2.2, 6.6, 1.8), 20.6, 0));
  b.put(M.brushed, solid(caseF, [[-4, 8.6], [-0.4, 8.6], [0, 8.1, { sharp: 1 }], [0, 2.0, { sharp: 1 }], [-1.4, 1.3]]));
  b.put(M.polished, solid(circle(17.5), [[null, 1.3], [0, 1.3], [0.3, 0.5], [-0.8, 0]]));
  // twelve-sided steel bezel around the blue ceramic insert
  b.put(M.polished, solid(bezel12, [[0, 11.45, { f: circle(19.9) }], [-0.45, 11.45, { sharp: 1 }], [0, 10.9, { sharp: 1 }], [0, 8.75]], { corners: corners12 }));
  const insert = new Mesh(solid(circle(19.9), [[-3.3, 11.2], [0, 11.42]], { uv: 44 }), new Material({ color: [1, 1, 1], roughness: 0.12, metalness: 0.1, map: dialTexture(44, aquaracerInsert), fresnel: 0.35, fresnelColor: color('#cfe0ff'), emissive: color('#060a14') }), 'aquaracer-insert');
  w.add(insert);
  // dial and its sloped chapter ring share one texture
  const dialMat = new Material({ color: [1, 1, 1], roughness: 0.4, metalness: 0.15, map: dialTexture(36, aquaracerDial), emissive: color('#050a16') });
  w.add(new Mesh(solid(circle(15.6), [[null, 7.8], [0, 7.8, { sharp: 1 }], [0.95, 9.9]], { uv: 36 }), dialMat, 'aquaracer-dial'));
  // applied indices: octagons, bars at 3 and 9, the long 12 with its orange stripe, the date frame at 6
  const oct = (r) => circlePts(r, 8, 0, 0, Math.PI / 8);
  for (const h of [1, 2, 4, 5, 7, 8, 10, 11]) { const [x, z] = at(h, 13.1); b.put(M.polished, prism(oct(1.3).map(([a, c]) => [a + x, c + z]), 7.8, 8.45)); b.put(M.lume, prism(oct(0.98).map(([a, c]) => [a + x, c + z]), 8.45, 8.5)); }
  for (const h of [3, 9]) { const s = h === 3 ? 1 : -1; b.put(M.polished, prism([[s * 11.4, -0.62], [s * 15.0, -0.62], [s * 15.0, 0.62], [s * 11.4, 0.62]], 7.8, 8.45)); b.put(M.lume, prism([[s * 11.65, -0.38], [s * 14.75, -0.38], [s * 14.75, 0.38], [s * 11.65, 0.38]], 8.45, 8.5)); }
  b.put(M.polished, prism([[-0.75, -15.0], [0.75, -15.0], [0.75, -10.6], [-0.75, -10.6]], 7.8, 8.45)); b.put(M.lume, prism([[-0.5, -14.75], [0.5, -14.75], [0.5, -10.85], [-0.5, -10.85]], 8.45, 8.5)); b.put(M.orange, prism([[-0.12, -14.6], [0.12, -14.6], [0.12, -11.0], [-0.12, -11.0]], 8.5, 8.53));
  b.put(M.polished, solid(circle(2.05), [[-0.3, 8.2], [0, 8.2, { sharp: 1 }], [0, 7.8]], { n: 40 }), [0, 0, 11.0]);
  // crown with guards, fluted
  b.put(M.brushed, solid(ngon(24, 3.1, 0.12), [[null, 3.8], [-0.3, 3.8], [0, 3.4, { sharp: 1 }], [0, 0]], { n: 96, corners: Array.from({ length: 24 }, (_, k) => (k + 0.5) * TAU / 24) }), [22.6, 4.6, 0], [0, 0, -Math.PI / 2]);
  b.put(M.crystal, solid(circle(16.8), [[null, 11.9], [0, 11.75]]));
  b.into(w, 'aquaracer');
  const octHand = (len, wdt, tail) => hand([[0, -len], [wdt, -len + wdt * 1.4], [wdt, -2.0], [wdt * 0.55, tail], [-wdt * 0.55, tail], [-wdt, -2.0], [-wdt, -len + wdt * 1.4]]);
  const H = { hour: makeHand(M, [['polished', octHand(9.4, 0.95, 1.6), 0, 0.22], ['lume', hand([[0, -8.4], [0.6, -7.6], [0.6, -2.6], [-0.6, -2.6], [-0.6, -7.6]]), 0.22, 0.26]]),
    minute: makeHand(M, [['polished', octHand(14.8, 0.75, 1.8), 0, 0.22], ['lume', hand([[0, -13.9], [0.45, -13.3], [0.45, -2.7], [-0.45, -2.7], [-0.45, -13.3]]), 0.22, 0.26]]),
    second: makeHand(M, [['polished', hand([[0.11, -15.2], [0.11, 3.2], [-0.11, 3.2], [-0.11, -15.2]]), 0, 0.12], ['lume', hand([[0.42, -12.6], [0.42, -10.4], [-0.42, -10.4], [-0.42, -12.6]]), 0.12, 0.16], ['polished', circlePts(0.9, 16, 0, 3.0), 0, 0.12]]) };
  H.hour.position = [0, 8.75, 0]; H.minute.position = [0, 9.05, 0]; H.second.position = [0, 9.35, 0];
  for (const h of Object.values(H)) w.add(h);
  w.add(new Mesh(solid(circle(0.8), [[null, 9.6], [0, 9.6], [0, 8.7]], { n: 24 }), M.polished));
  // three-row bracelet: brushed outer links, polished centre links
  const brace = new Batch();
  bracelet(brace, { lugZ: 25.2, lugY: 4.2, path, floor, rows: 10, pitch: 6.6, link: (bb, p, r, k) => {
    const wdt = 22 - Math.min(k, 8) * 0.38, up = [0, Math.cos(r[0]), Math.sin(r[0])];
    for (const sx of [-1, 1]) bb.put(M.brushed, roundedBox({ w: wdt * 0.33, h: 3.8, d: 6.3, r: 0.5, seg: 1, uvTopOnly: false }), [sx * wdt * 0.335, p[1], p[2]], r);
    bb.put(M.polished, roundedBox({ w: wdt * 0.32, h: 3.9, d: 5.9, r: 0.7, seg: 2, uvTopOnly: false }), [0, p[1] + up[1] * 0.05, p[2] + up[2] * 0.05], r);
  } });
  brace.into(w, 'aquaracer-bracelet');
  return { node: w, hands: H, seconds: 'centre' };
}

// ---------- the box
/** Build the watch box. Returns { root, hit, update }. Root is in desk units; place it on the desk at y = desk top. */
export function buildWatchBox() {
  const M = materials();
  const root = new Node('watch-box'); const mm = new Node('watch-box-mm'); mm.scale = [MM, MM, MM]; root.add(mm);
  const W = 234, D = 102, H = 56, T = 9, FLOOR = 8, SLOT = 70, DIV = 3;
  const b = new Batch();
  // walnut shell
  b.put(M.wood, box(W, FLOOR, D), [0, FLOOR / 2, 0]);
  for (const s of [-1, 1]) { b.put(M.wood, box(W, H, T), [0, H / 2, s * (D / 2 - T / 2)]); b.put(M.wood, box(T, H, D - 2 * T), [s * (W / 2 - T / 2), H / 2, 0]); }
  // brass inlay around the rim, hinges and the front clasp
  for (const s of [-1, 1]) { b.put(M.brass, box(W + 0.4, 1.2, 1.2), [0, H - 3, s * (D / 2 + 0.1)]); b.put(M.brass, box(1.2, 1.2, D + 0.4), [s * (W / 2 + 0.1), H - 3, 0]); }
  b.put(M.brass, roundedBox({ w: 22, h: 12, d: 2.2, r: 0.8, seg: 2 }), [0, H - 7, D / 2 + 1.0]);
  for (const s of [-1, 1]) b.put(M.brass, cylinder(2.4, 2.4, 26, 18), [s * 72, H, -D / 2 - 0.5], [0, 0, Math.PI / 2]);
  // suede lining, dividers and pillows
  const inW = W - 2 * T, inD = D - 2 * T;
  b.put(M.suede, box(inW, 2, inD), [0, FLOOR + 1, 0]);
  for (const s of [-1, 1]) { b.put(M.suede, box(inW, H - FLOOR - 2, 1.5), [0, (H + FLOOR) / 2, s * (inD / 2 - 0.75)]); b.put(M.suede, box(1.5, H - FLOOR - 2, inD), [s * (inW / 2 - 0.75), (H + FLOOR) / 2, 0]); }
  for (const s of [-1, 1]) b.put(M.suede, roundedBox({ w: DIV, h: 40, d: inD - 3, r: 1.2, seg: 2, uvTopOnly: false }), [s * (SLOT / 2 + DIV / 2 + 0.2), FLOOR + 20, 0]);
  const PH = 44, PD = 64, PR = 18, PY = FLOOR + 2 + PH / 2;
  for (const x of [-(SLOT + DIV), 0, SLOT + DIV]) b.put(M.suede, roundedBox({ w: SLOT - 6, h: PH, d: PD, r: PR, seg: 4, uvTopOnly: false }), [x, PY, 0]);
  b.into(mm, 'watch-box');
  // the lid, hinged at the back: shut to start with, it swings open (−1.78 rad) when you click the box
  const LID_OPEN = -1.78;
  const lid = new Node('watch-box-lid'); lid.position = [0, H, -D / 2]; lid.rotation[0] = 0; lid.userData.dynamic = true; mm.add(lid);
  const lb = new Batch(), LH = 22;
  for (const s of [-1, 1]) { lb.put(M.wood, box(W, LH, T), [0, LH / 2, D / 2 + s * (D / 2 - T / 2)]); lb.put(M.wood, box(T, LH, D - 2 * T), [s * (W / 2 - T / 2), LH / 2, D / 2]); }
  const rimW = 16; lb.put(M.wood, box(W, 5, rimW), [0, LH - 2.5, rimW / 2]); lb.put(M.wood, box(W, 5, rimW), [0, LH - 2.5, D - rimW / 2]);
  for (const s of [-1, 1]) lb.put(M.wood, box(rimW, 5, D - 2 * rimW), [s * (W / 2 - rimW / 2), LH - 2.5, D / 2]);
  lb.put(M.brass, box(W + 0.4, 1.2, 1.2), [0, 3, D + 0.1]);
  lb.put(M.glass, box(W - 2 * rimW, 1.5, D - 2 * rimW), [0, LH - 2.5, D / 2]);
  lb.into(lid, 'watch-box-lid');
  // the watches, 12 o'clock toward the hinge
  const path = pillowPath(PY, PD / 2, PH / 2, PR, 1.9);
  const top = PY + PH / 2 - 1.0;
  const rel = path.map(([z, y]) => [z, y - top]), floor = FLOOR + 4 - top;
  const watches = [nautilus(M, rel, floor), santos(M, rel, floor), aquaracer(M, rel, floor)];
  watches.forEach((wt, k) => { wt.node.position = [(k - 1) * (SLOT + DIV), top, 0]; mm.add(wt.node); wt.node.traverse((n) => { if (n.material?.transparent) n.castShadow = false; }); for (const h of Object.values(wt.hands)) h.userData.dynamic = true; });
  // invisible hit volume for hover / click
  const hit = new Mesh(box(W * MM + 0.4, 4.2, D * MM + 0.6), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), 'hit:watches');
  hit.position = [0, 2.1, 0]; hit.castShadow = false; hit.pickable = true; root.add(hit);
  let open = false, lidV = 0;
  const toggle = () => { open = !open; return open; };
  const update = (dt = 0.016) => {
    lidV += ((open ? 1 : 0) - lidV) * (1 - Math.exp(-5 * dt));
    const e = lidV * lidV * (3 - 2 * lidV); lid.rotation[0] = LID_OPEN * e;
    const d = new Date(), s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
    for (const wt of watches) {
      wt.hands.hour.rotation[1] = -(h / 12) * TAU; wt.hands.minute.rotation[1] = -(m / 60) * TAU;
      // the automatic movements sweep in small steps (8 beats a second)
      wt.hands.second.rotation[1] = -(Math.floor(s * 8) / 8 / 60) * TAU;
    }
  };
  update();
  flatten(lid, 'watch-box-lid');
  flatten(root, 'watch-box');
  return { root, hit, update, toggle, get open() { return open; } };
}
