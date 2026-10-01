// The split air conditioner high on the right wall, over the door: a modern inverter indoor unit, the most local touch a room in
// Tangerang can have. Matte white and softly rounded: a gently bowed front panel framed by a thin seam, an intake grille across the
// top, side caps that fillet into the body, and underneath, the outlet: a louvre flap with the vertical vanes standing behind it in
// the dark duct. A hidden display reads 24°C in cool white LED segments through a faint window in the panel, beside a blue-white
// status light. The insulated refrigerant line leaves the left end near the wall, bends down into a short run of white trunking, and
// the trunking's elbow turns it into the wall. Running, the flap opens to 35° and swings ±8°, and a few faint streaks of cold air
// drift out and sink below the unit; switched off, the flap closes flush and the display goes dark.
// The room's lamps don't reach this wall, so the white paints in its own soft light (its colour as emissive, which the room scales
// through `dimmable`) with a warm rim, and a soft contact shadow is painted on the plaster behind it.
// Six draw calls: the body (every static part on one atlas), the flap, the display, two airflow groups that fade in turn, the shadow.
// Local frame: the wall is z = 0 and the unit stands out toward +z; x runs along the wall (+x to the viewer's right), y up; the origin
// is the back-top-centre of the body. 1 unit ≈ 19 mm: the body is 42 × 15 × 10.5 (80 × 28 × 20 cm).
import { Node, Mesh, Material } from 'engine/scene';
import { box } from 'engine/geometry';
import { drawTexture } from 'engine/textures';
import { color } from 'engine/math';

// ---------- the layout
const W = 42, HW = W / 2, RE = 0.9, XIN = HW - RE;          // width; the side caps round off over the last RE units of it
const XO = 17, XF = XO - 0.1, XS = 19.8;                     // the outlet spans x ±17 (65 cm), the flap a hair less; the panel's side seams
const HOLE = 4.0, GAP = 0.07, THICK = 0.22, DEEP = 3.0;      // the outlet's width round the outline, the gap round the flap, its thickness, the duct's depth
const OPEN = (35 * Math.PI) / 180, SWING = (8 * Math.PI) / 180, PERIOD = 7.5;
const DISPLAY = { x: 12, y: -9.45 };                         // the middle of the display, low on the panel's right
const PIPE = { x: -20.4, y: -11.6, z: 1.2, r: 0.85, bend: 1.3 };
const TRUNK = { x: -23.2, w: 3.4, d: 2.4, r: 0.35, top: -13.0, bot: -15.2 };   // its elbow meets the wall 2.4 lower, at y -17.6 (the door's casing tops out near -18.5)
const LIFE = 3.0, STREAKS = 4, NS = 10, AIR = 0.16;          // airflow: a group lives 3 s; four streaks a group, ten segments each; peak opacity
const TEX_W = 2048, TEX_H = 1024, SH = 640;                  // the body's atlas: the shell's skin over the top 640 rows, eight swatches below
const SW = { white: 0, dark: 1, seam: 2, vane: 3, blower: 4, tape: 5, window: 6, pvc: 7 };
// the side profile (z out from the wall, y up), a polygon with a fillet at every corner [z, y, r], clockwise from the back-top: a flat
// top, a soft top-front edge, the panel bowing gently forward, the lip rolling under into the outlet, the bottom, and the rear
// underside rising back to the wall
const OUTLINE = [[0, 0, 1.0], [9.2, 0, 2.6], [10.65, -6.5, 16], [10.0, -12.6, 2.6], [5.0, -15.0, 2.6], [1.2, -14.6, 1.2], [0, -13.2, 1.0]];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const unit2 = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const add2 = (p, ...terms) => terms.reduce((a, [v, k]) => [a[0] + v[0] * k, a[1] + v[1] * k], p);   // p + Σ v·k
const nrm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// outline points are [z, y]; in the unit's frame that is (x, y, z) = (x, p[1], p[0])
const P3 = (x, p) => [x, p[1], p[0]], N3 = (n) => [0, n[1], n[0]];
const lift = (x, q, h) => [x, q.p[1] + q.n[1] * h, q.p[0] + q.n[0] * h];   // h along the outline's normal at q, at x
// the side caps fillet everywhere except against the wall, so the back stays flush with the plaster
const backW = (n) => smooth(-0.98, -0.85, n[0]);
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// a swatch's own (u, v) (v up) → the atlas; a 12 px margin keeps neighbours from bleeding in
const tile = (k, u = 0.5, v = 0.5) => [(256 * k + 12 + 232 * u) / TEX_W, 1 - (TEX_H - 12 - (TEX_H - SH - 24) * v) / TEX_H];

// ---------- the outline, sampled: every fillet in ≤ 5° steps, the flats in ≤ 1.2 unit steps (the back, against the wall, in one),
// each point with its arc length s (from where the back meets the top fillet) and its outward normal
function outline() {
  const n = OUTLINE.length, pts = [], corner = [];
  const C = OUTLINE.map((c, i) => {
    const a = OUTLINE[(i + n - 1) % n], b = OUTLINE[(i + 1) % n], din = unit2([c[0] - a[0], c[1] - a[1]]), dout = unit2([b[0] - c[0], b[1] - c[1]]);
    const turn = Math.acos(clamp(din[0] * dout[0] + din[1] * dout[1], -1, 1)), t = c[2] * Math.tan(turn / 2);
    // the fillet's centre sits r inside the incoming edge (clockwise outline: inside is the edge direction turned -90°)
    const p0 = [c[0] - din[0] * t, c[1] - din[1] * t], ctr = [p0[0] + din[1] * c[2], p0[1] - din[0] * c[2]];
    return { r: c[2], turn, ctr, phi: Math.atan2(p0[1] - ctr[1], p0[0] - ctr[0]), p0, p1: [c[0] + dout[0] * t, c[1] + dout[1] * t], dout };
  });
  const push = (p, nn) => { const q = pts[pts.length - 1]; pts.push({ p, n: nn, s: q ? q.s + Math.hypot(p[0] - q.p[0], p[1] - q.p[1]) : 0 }); };
  C.forEach((c, i) => {
    const m = Math.max(2, Math.ceil(c.turn / ((5 * Math.PI) / 180))), first = pts.length;
    for (let k = 0; k <= m; k++) { const f = c.phi - (c.turn * k) / m, nn = [Math.cos(f), Math.sin(f)]; push([c.ctr[0] + nn[0] * c.r, c.ctr[1] + nn[1] * c.r], nn); }
    corner.push({ a: pts[first].s, b: pts[pts.length - 1].s });
    // the flat on to the next fillet (whose first point ends it)
    const q = C[(i + 1) % n].p0, e = c.p1, nn = [-c.dout[1], c.dout[0]], steps = nn[0] < -0.99 ? 1 : Math.ceil(Math.hypot(q[0] - e[0], q[1] - e[1]) / 1.2);
    for (let k = 1; k < steps; k++) push([e[0] + ((q[0] - e[0]) * k) / steps, e[1] + ((q[1] - e[1]) * k) / steps], nn);
  });
  push([...pts[0].p], [...pts[0].n]);   // closed: the start again, at s = S
  const S = pts[pts.length - 1].s;
  // the point and normal at any s, interpolated along the samples (so anything placed with it lies exactly on the shell)
  const at = (s) => {
    s = clamp(s, 0, S);
    let lo = 0, hi = pts.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (pts[mid].s <= s) lo = mid; else hi = mid; }
    const a = pts[lo], b = pts[hi], t = (s - a.s) / (b.s - a.s || 1);
    return { s, p: [a.p[0] + (b.p[0] - a.p[0]) * t, a.p[1] + (b.p[1] - a.p[1]) * t], n: unit2([a.n[0] + (b.n[0] - a.n[0]) * t, a.n[1] + (b.n[1] - a.n[1]) * t]) };
  };
  return { pts, corner, S, at };
}

// ---------- geometry kit: raw arrays → a mesh, every triangle wound to face along its normals (back faces are culled)
function builder() {
  const pos = [], nor = [], uv = [], idx = [];
  return {
    vert(p, n, t) { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); uv.push(t[0], t[1]); return pos.length / 3 - 1; },
    tri(a, b, c) { idx.push(a, b, c); },
    quad(a, b, c, d) { idx.push(a, b, c, a, c, d); },
    build() {
      for (let t = 0; t < idx.length; t += 3) {
        const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
        const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
        const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
        if (fx * (nor[a] + nor[b] + nor[c]) + fy * (nor[a + 1] + nor[b + 1] + nor[c + 1]) + fz * (nor[a + 2] + nor[b + 2] + nor[c + 2]) < 0) { const x = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = x; }
      }
      const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < pos.length; i++) { const k = i % 3; if (pos[i] < min[k]) min[k] = pos[i]; if (pos[i] > max[k]) max[k] = pos[i]; }
      return { positions: new Float32Array(pos), normals: new Float32Array(nor), uvs: new Float32Array(uv), indices: pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), bounds: { min, max } };
    },
  };
}
// a box about o along three orthonormal axes, half sizes hs
function slab(B, o, ax, hs, t) {
  for (let f = 0; f < 3; f++) for (const sg of [-1, 1]) {
    const n = ax[f].map((v) => v * sg), u = ax[(f + 1) % 3], v = ax[(f + 2) % 3], hu = hs[(f + 1) % 3], hv = hs[(f + 2) % 3], c = o.map((p, i) => p + n[i] * hs[f]);
    const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => B.vert(c.map((p, i) => p + u[i] * hu * a + v[i] * hv * b), n, t));
    B.quad(q[0], q[1], q[2], q[3]);
  }
}
// a round tube along a path, its ring frame carried along so it never twists; u runs round it, v along it, both into swatch k
function tube(B, path, r, seg, k) {
  const L = [0];
  for (let i = 1; i < path.length; i++) L.push(L[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]));
  const id = []; let N = null;
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)], T = nrm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    N = N ? nrm(N.map((v, j) => v - T[j] * (N[0] * T[0] + N[1] * T[1] + N[2] * T[2]))) : nrm(cross(T, Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
    const Bn = cross(T, N);
    for (let j = 0; j <= seg; j++) { const t = (j / seg) * Math.PI * 2, d = [0, 1, 2].map((m) => N[m] * Math.cos(t) + Bn[m] * Math.sin(t)); id.push(B.vert(path[i].map((p, m) => p + d[m] * r), d, tile(k, j / seg, L[i] / L[L.length - 1]))); }
  }
  for (let i = 0; i < path.length - 1; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; B.quad(id[a], id[a + 1], id[b + 1], id[b]); }
}

// ---------- painted textures
const rrect = (ctx, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
// the body's atlas. Top: the shell's own skin, x across and the outline's arc length down (light falling off toward the wall and under
// the unit, a shadowed rim round the outlet, the intake slots across the top). Bottom: plain and patterned swatches for every other part.
// It is both the colour and the emissive map, so the painted-in light follows the shading.
function bodyTexture(S, mk) {
  return drawTexture(TEX_W, TEX_H, (ctx, w, h) => {
    const X = (x) => ((x + HW) / W) * w, Y = (s) => (s / S) * SH;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    const band = (s0, s1, a0, a1, x0 = -HW, x1 = HW) => { const g = ctx.createLinearGradient(0, Y(s0), 0, Y(s1)); g.addColorStop(0, `rgba(0,0,0,${a0})`); g.addColorStop(1, `rgba(0,0,0,${a1})`); ctx.fillStyle = g; ctx.fillRect(X(x0), Y(s0), X(x1) - X(x0), Y(s1) - Y(s0)); };
    band(0, mk.topA + 1.4, 0.22, 0);              // the back-top edge, against the wall
    band(mk.top, mk.bot, 0, 0.07);                 // the panel falls off a little toward its foot
    band(mk.bot, mk.h1, 0.07, 0.13);               // the lip rolling under
    band(mk.h1, mk.h2, 0.13, 0.16);                // (beside the outlet)
    band(mk.h2, mk.g, 0.16, 0.34);                 // under the unit, darker toward the wall
    band(mk.g, S, 0.34, 0.34);                     // the back
    band(mk.h1 - 0.35, mk.h1, 0, 0.2, -XO - 0.35, XO + 0.35);   // the outlet's rim, in its own shadow
    band(mk.h2, mk.h2 + 0.35, 0.2, 0, -XO - 0.35, XO + 0.35);
    for (const sg of [-1, 1]) { const xa = X(sg * (XO + 0.35)), xb = X(sg * XO), g = ctx.createLinearGradient(xa, 0, xb, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.2)'); ctx.fillStyle = g; ctx.fillRect(Math.min(xa, xb), Y(mk.h1), Math.abs(xb - xa), Y(mk.h2) - Y(mk.h1)); }
    // the intake grille across the top: slots running front to back
    ctx.fillStyle = 'rgba(32,33,35,0.92)';
    for (let k = 0; k <= 64; k++) { const x = -19.2 + k * 0.6; rrect(ctx, X(x - 0.12), Y(mk.g0), X(x + 0.12) - X(x - 0.12), Y(mk.g1) - Y(mk.g0), 5); ctx.fill(); }
    // ---- the swatches, 256 px wide; fn draws in the swatch's (u, v), v up
    const swatch = (k, base, fn) => {
      ctx.save(); ctx.translate(256 * k, SH); ctx.beginPath(); ctx.rect(0, 0, 256, h - SH); ctx.clip();
      ctx.fillStyle = base; ctx.fillRect(0, 0, 256, h - SH);
      if (fn) fn((u) => 12 + 232 * u, (v) => h - SH - 12 - (h - SH - 24) * v);
      ctx.restore();
    };
    swatch(SW.white, '#ffffff');
    swatch(SW.dark, '#2a2b2e');                    // inside the duct
    swatch(SW.seam, '#77756f');                    // a hairline gap reads as a grey line on white plastic
    swatch(SW.vane, '#a8a8a4');                    // white vanes, in the duct's shade
    // the blower deep in the duct: its blades run the length of the unit, split by discs every few inches
    swatch(SW.blower, '#1c1d20', (U, V) => {
      ctx.fillStyle = '#35373b'; for (let v = 0; v <= 1.001; v += 0.035) ctx.fillRect(U(0), V(v) - 1.5, U(1) - U(0), 3);
      ctx.fillStyle = '#111214'; for (let u = 0; u <= 1.001; u += 0.125) ctx.fillRect(U(u) - 2, V(1), 4, V(0) - V(1));
    });
    // vinyl tape wound round the line: five turns along it, each overlap a shadowed edge with a lit lip above it
    swatch(SW.tape, '#dedbd3', (U, V) => {
      const r = rng(5);
      for (let i = 0; i < 1800; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.05})`; ctx.fillRect(r() * 256, r() * (h - SH), 2, 2); }
      for (let j = -1; j <= 5; j++) for (const [dv, col, lw] of [[0, 'rgba(120,114,104,0.55)', 3], [0.012, 'rgba(255,255,255,0.5)', 1.5]]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(U(0), V(j / 5 + dv)); ctx.lineTo(U(1), V((j + 1) / 5 + dv)); ctx.stroke(); }
    });
    // the display's window: a faint smoky pane in the panel, drawn in units (the patch it lies on is 5.4 × 2.1)
    swatch(SW.window, '#ffffff', (U, V) => {
      ctx.translate(U(0), V(1)); ctx.scale((U(1) - U(0)) / 5.4, (V(0) - V(1)) / 2.1);
      const g = ctx.createLinearGradient(0, 0.25, 0, 1.85); g.addColorStop(0, '#a9adb2'); g.addColorStop(1, '#b9bcc0');
      ctx.fillStyle = g; rrect(ctx, 0.25, 0.25, 4.9, 1.6, 0.32); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 0.045; rrect(ctx, 0.25, 0.25, 4.9, 1.6, 0.32); ctx.stroke();
    });
    swatch(SW.pvc, '#f6f4ef');                     // the trunking's PVC, a shade creamier than the unit
  });
}
// seven-segment glyphs: each segment a bar with pointed ends, a hairline apart
const SEGS = { 2: 'abdeg', 4: 'bcfg', C: 'adef' };
function sevenSeg(ctx, ch, x, y, w, h, t) {
  const g = t * 0.2, hb = (x0, x1, yc) => { ctx.beginPath(); ctx.moveTo(x0, yc); ctx.lineTo(x0 + t / 2, yc - t / 2); ctx.lineTo(x1 - t / 2, yc - t / 2); ctx.lineTo(x1, yc); ctx.lineTo(x1 - t / 2, yc + t / 2); ctx.lineTo(x0 + t / 2, yc + t / 2); ctx.closePath(); ctx.fill(); };
  const vb = (xc, y0, y1) => { ctx.beginPath(); ctx.moveTo(xc, y0); ctx.lineTo(xc + t / 2, y0 + t / 2); ctx.lineTo(xc + t / 2, y1 - t / 2); ctx.lineTo(xc, y1); ctx.lineTo(xc - t / 2, y1 - t / 2); ctx.lineTo(xc - t / 2, y0 + t / 2); ctx.closePath(); ctx.fill(); };
  const L = x + t / 2, R = x + w - t / 2, T = y + t / 2, M = y + h / 2, B = y + h - t / 2;
  for (const s of SEGS[ch]) {
    if (s === 'a') hb(L + g, R - g, T); if (s === 'g') hb(L + g, R - g, M); if (s === 'd') hb(L + g, R - g, B);
    if (s === 'f') vb(L, T + g, M - g); if (s === 'b') vb(R, T + g, M - g); if (s === 'e') vb(L, M + g, B - g); if (s === 'c') vb(R, M + g, B - g);
  }
}
// the display: 24°C and the status light, lit in three passes (a wide blue halo, a tighter glow, the segments); clear elsewhere
function displayTexture() {
  return drawTexture(512, 160, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const glyphs = () => {
      sevenSeg(ctx, '2', 190, 30, 56, 100, 12); sevenSeg(ctx, '4', 262, 30, 56, 100, 12);
      ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(342, 41, 8, 0, Math.PI * 2); ctx.stroke();   // the degree mark
      sevenSeg(ctx, 'C', 358, 30, 38, 64, 9);
    };
    const led = (r) => { ctx.beginPath(); ctx.arc(122, 80, r, 0, Math.PI * 2); ctx.fill(); };
    ctx.save(); ctx.filter = 'blur(10px)'; ctx.fillStyle = ctx.strokeStyle = 'rgba(110,175,255,0.55)'; glyphs(); led(13); ctx.restore();
    ctx.save(); ctx.filter = 'blur(3px)'; ctx.fillStyle = ctx.strokeStyle = 'rgba(205,230,255,0.85)'; glyphs(); led(8); ctx.restore();
    ctx.fillStyle = ctx.strokeStyle = '#f0f8ff'; glyphs();
    ctx.fillStyle = '#d4ebff'; led(6);
  });
}
// one airflow streak (white: the material tints it): soft across, faint at the tail, brightest a third along, a long fade to the head
// (v = 1), with a few fine fibres running down it
function streakTexture() {
  const r = rng(77), fibres = Array.from({ length: 5 }, () => [0.32 + r() * 0.36, 0.25 + r() * 0.5, r() * 6.28]);
  return drawTexture(64, 256, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / w, v = 1 - (y + 0.5) / h, across = Math.exp(-(((u - 0.5) / 0.2) ** 2)), along = Math.sin(Math.PI * Math.pow(v, 0.7)) ** 1.5;
      let fib = 0.55; for (const [o, s, p] of fibres) fib += s * 0.35 * Math.exp(-(((u - o - 0.04 * Math.sin(v * 9 + p)) / 0.05) ** 2));
      const k = (y * w + x) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = 255; img.data[k + 3] = Math.round(clamp(across * along * fib, 0, 1) * 255);
    }
    ctx.putImageData(img, 0, 0);
  });
}
// the shadow on the plaster (x -26..26, y -20..1.5 of the unit's frame): soft below the body, tight where it meets the wall, the trunking's too
function shadowTexture() {
  return drawTexture(512, 256, (ctx, w, h) => {
    const X = (x) => ((x + 26) / 52) * w, Y = (y) => ((1.5 - y) / 21.5) * h;
    ctx.clearRect(0, 0, w, h);
    const blob = (x0, y0, x1, y1, r, blur, a) => { ctx.save(); ctx.filter = `blur(${blur}px)`; ctx.fillStyle = `rgba(0,0,0,${a})`; rrect(ctx, X(x0), Y(y1), X(x1) - X(x0), Y(y0) - Y(y1), r); ctx.fill(); ctx.restore(); };
    blob(-20.6, -16.4, 20.6, -1.2, 18, 16, 0.5);
    blob(-21, -13.6, 21, -0.4, 8, 5, 0.42);
    blob(-25.1, -18.2, -21.2, -12.4, 6, 6, 0.32);
  });
}

/**
 * The air conditioner. Returns { root, hit, toggle, update(dt, time, level), dimmable }: root in the frame above (the room mounts it
 * on the right wall), hit an invisible pickable box tight round the body (keyId 'aircon'), toggle() switches it and returns the new
 * state (it starts on), update eases the flap, swing, display and air (level 0..1 is the room's light level), dimmable the materials
 * whose emissive the room scales.
 */
export function buildAircon() {
  const O = outline(), at = O.at, S = O.S, cn = O.corner, base = O.pts.map((q) => q.s);
  // where things sit round the outline: the front panel from under the top-front edge to above the lip; the outlet from low on
  // the lip to just into the bottom's curve (its edges snapped onto samples nearby, so the cut is clean)
  const snap = (s) => { const k = base.reduce((b, v) => (Math.abs(v - s) < Math.abs(b - s) ? v : b), base[0]); return Math.abs(k - s) < 0.02 ? k : s; };
  const sTop = cn[1].b + 0.12, sBot = cn[3].a - 0.08, h1 = snap(cn[3].b - 0.55), h2 = snap(h1 + HOLE), sF0 = h1 + GAP, sF1 = h2 - GAP;
  const marks = { topA: cn[0].b, g0: cn[0].b + 0.55, g1: cn[1].a - 0.45, top: sTop, bot: sBot, h1, h2, g: cn[6].a };
  const white = color('#e9e8e4'), atlas = bodyTexture(S, marks);
  const M = {
    // matte white plastic, its own colour painted in as light so it reads soft white in the dim room, and a warm rim at the edges
    body: new Material({ color: white, map: atlas, roughness: 0.55, metalness: 0, emissive: white.map((v) => v * 0.48), emissiveMap: atlas, fresnel: 0.2, fresnelColor: color('#f1e6d4'), receiveShadow: false }),
    disp: new Material({ color: [2.2, 2.35, 2.6], map: displayTexture(), unlit: true, transparent: true, depthWrite: false, receiveShadow: false }),
    shadow: new Material({ color: [0, 0, 0], map: shadowTexture(), unlit: true, transparent: true, depthWrite: false, opacity: 0.85, receiveShadow: false }),
  };
  const root = new Node('aircon'), B = builder(), wt = tile(SW.white);
  const own = (mesh, order = 0) => { mesh.castShadow = false; mesh.renderOrder = order; return mesh; };

  // ---------- the shell: the outline swept along x, each end filleted (radius RE) into a flat side cap, the outlet cut out underneath
  const xs = [];
  for (let k = 6; k >= 0; k--) xs.push({ x: -(XIN + RE * Math.sin((k * Math.PI) / 12)), th: (k * Math.PI) / 12 });
  xs.push({ x: -XO, th: 0 }, { x: XO, th: 0 });
  for (let k = 0; k <= 6; k++) xs.push({ x: XIN + RE * Math.sin((k * Math.PI) / 12), th: (k * Math.PI) / 12 });
  const rows = [...new Set([...base, h1, h2])].sort((a, b) => a - b).map(at);
  const grid = rows.map((q) => xs.map(({ x, th }) => {
    // the fillet: inset along the outline's normal by RE(1 - cos θ), the normal tipping out toward ±x by θ
    const w = backW(q.n), d = RE * (1 - Math.cos(th)) * w, k = Math.cos(th) * w + (1 - w);
    return B.vert([x, q.p[1] - d * q.n[1], q.p[0] - d * q.n[0]], nrm([Math.sign(x) * Math.sin(th) * w, k * q.n[1], k * q.n[0]]), [(x + HW) / W, 1 - ((q.s / S) * SH) / TEX_H]);
  }));
  for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < xs.length - 1; j++) {
    if (rows[i].s >= h1 - 1e-6 && rows[i + 1].s <= h2 + 1e-6 && xs[j].x >= -XO - 1e-6 && xs[j + 1].x <= XO + 1e-6) continue;   // the outlet
    B.quad(grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]);
  }
  for (const X of [xs[0], xs[xs.length - 1]]) {
    const nn = [Math.sign(X.x), 0, 0], ring = rows.slice(0, -1).map((q) => { const d = RE * backW(q.n); return [X.x, q.p[1] - d * q.n[1], q.p[0] - d * q.n[0]]; });
    const ci = B.vert([X.x, ring.reduce((a, p) => a + p[1], 0) / ring.length, ring.reduce((a, p) => a + p[2], 0) / ring.length], nn, wt), vi = ring.map((p) => B.vert(p, nn, wt));
    for (let i = 0; i < vi.length; i++) B.tri(ci, vi[i], vi[(i + 1) % vi.length]);
  }

  // ---------- the seam round the front panel: a hairline just proud of the shell along its top and foot and down both ends
  const seam = tile(SW.seam), SWD = 0.045, UP = 0.03;
  for (const s of [sTop, sBot]) { const e = [at(s - SWD), at(s + SWD)].map((q) => [-XS, XS].map((x) => B.vert(lift(x, q, UP), N3(q.n), seam))); B.quad(e[0][0], e[0][1], e[1][1], e[1][0]); }
  const along = [sTop - SWD, ...base.filter((s) => s > sTop - SWD && s < sBot + SWD), sBot + SWD].map(at);
  for (const x of [-XS, XS]) { const e = along.map((q) => [x - SWD, x + SWD].map((xx) => B.vert(lift(xx, q, UP), N3(q.n), seam))); for (let i = 0; i < e.length - 1; i++) B.quad(e[i][0], e[i][1], e[i + 1][1], e[i + 1][0]); }

  // ---------- the display's window, a patch lying on the panel just proud of it (its swatch is white round the pane, so it blends in)
  const sAtY = (y) => { let lo = sTop, hi = sBot; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (at(m).p[1] > y) lo = m; else hi = m; } return (lo + hi) / 2; };
  const patch = (G, x0, x1, y0, y1, h, uv) => {
    const s0 = sAtY(y1), s1 = sAtY(y0), N = 6, id = [];
    for (let j = 0; j <= N; j++) { const q = at(s0 + ((s1 - s0) * j) / N); for (let i = 0; i <= 2; i++) id.push(G.vert(lift(x0 + ((x1 - x0) * i) / 2, q, h), N3(q.n), uv(i / 2, 1 - j / N))); }
    for (let j = 0; j < N; j++) for (let i = 0; i < 2; i++) { const a = j * 3 + i; G.quad(id[a], id[a + 1], id[a + 4], id[a + 3]); }
  };
  patch(B, DISPLAY.x - 2.7, DISPLAY.x + 2.7, DISPLAY.y - 1.05, DISPLAY.y + 1.05, 0.025, (u, v) => tile(SW.window, u, v));

  // ---------- the outlet's duct: the opening's own curve, walls running up into the body, a rounded roof where the blower turns,
  // closed at both ends; nineteen vertical vanes stand in it just above the opening
  const H1 = at(h1).p, H2 = at(h2).p, c2 = unit2([H1[0] - H2[0], H1[1] - H2[1]]), m2 = [-c2[1], c2[0]];   // across the opening (front, up) and into the body
  const fTop = add2(H1, [m2, DEEP], [c2, 0.1]), rTop = add2(H2, [m2, DEEP], [c2, -0.15]), mid = add2([(fTop[0] + rTop[0]) / 2, (fTop[1] + rTop[1]) / 2], [m2, 0.9]);
  const roof = Array.from({ length: 7 }, (_, k) => { const t = k / 6, a = (1 - t) ** 2, b = 2 * t * (1 - t), c = t * t; return [a * rTop[0] + b * mid[0] + c * fTop[0], a * rTop[1] + b * mid[1] + c * fTop[1]]; });
  const section = [...rows.filter((q) => q.s >= h1 - 1e-6 && q.s <= h2 + 1e-6).map((q) => q.p), ...roof];   // front edge to rear edge, then the rear wall, roof and front wall
  const dk = tile(SW.dark);
  for (const sg of [-1, 1]) {
    const x = sg * XO, nn = [-sg, 0, 0], ci = B.vert(P3(x, [section.reduce((a, p) => a + p[0], 0) / section.length, section.reduce((a, p) => a + p[1], 0) / section.length]), nn, dk);
    const vi = section.map((p) => B.vert(P3(x, p), nn, dk)); for (let i = 0; i < vi.length; i++) B.tri(ci, vi[i], vi[(i + 1) % vi.length]);
  }
  const wall = (p0, p1, toward) => { const e = unit2([p1[0] - p0[0], p1[1] - p0[1]]); let n = [-e[1], e[0]]; if (n[0] * toward[0] + n[1] * toward[1] < 0) n = [-n[0], -n[1]]; const q = [[-XO, p0], [XO, p0], [XO, p1], [-XO, p1]].map(([x, p]) => B.vert(P3(x, p), N3(n), dk)); B.quad(q[0], q[1], q[2], q[3]); };
  wall(H1, fTop, [-c2[0], -c2[1]]); wall(H2, rTop, c2);
  const rf = roof.map((p, k) => { const a = roof[Math.max(0, k - 1)], b = roof[Math.min(6, k + 1)], e = unit2([b[0] - a[0], b[1] - a[1]]); let n = [-e[1], e[0]]; if (n[0] * m2[0] + n[1] * m2[1] > 0) n = [-n[0], -n[1]]; return [-XO, XO].map((x) => B.vert(P3(x, p), N3(n), tile(SW.blower, (x + XO) / (2 * XO), k / 6))); });
  for (let k = 0; k < 6; k++) B.quad(rf[k][0], rf[k][1], rf[k + 1][1], rf[k + 1][0]);
  const chord = Math.hypot(H1[0] - H2[0], H1[1] - H2[1]), vc = add2([(H1[0] + H2[0]) / 2, (H1[1] + H2[1]) / 2], [m2, 1.45]);
  for (let k = 0; k < 19; k++) slab(B, P3(-XO + 1.25 + (k * (2 * XO - 2.5)) / 18, vc), [[1, 0, 0], N3(m2), N3(c2)], [0.05, 0.9, chord * 0.37], tile(SW.vane));

  // ---------- the refrigerant line: out of the left end near the wall, bent down into the trunking, wrapped in vinyl tape
  const { x: px, y: py, z: pz, r: pr, bend: br } = PIPE, tx = TRUNK.x, line = [];
  for (let k = 0; k <= 3; k++) line.push([px + ((tx + br - px) * k) / 3, py, pz]);
  for (let k = 1; k <= 10; k++) { const a = (k / 10) * (Math.PI / 2); line.push([tx + br - br * Math.sin(a), py - br + br * Math.cos(a), pz]); }
  for (let k = 1; k <= 3; k++) line.push([tx, py - br + (TRUNK.top - 0.8 - (py - br)) * (k / 3), pz]);
  tube(B, line, pr, 14, SW.tape);
  // ---------- the trunking: a PVC duct down the wall, a rectangle with rounded front corners, capped at the top where the line
  // goes in; at its foot an elbow (the section swept a quarter turn about the wall line) turns it into the wall
  const { w: tw2, d: td, r: tr } = TRUNK, tw = tw2 / 2, pvc = tile(SW.pvc), sec = [[-tw, 0, -1, 0]];
  for (let k = 0; k <= 4; k++) { const a = Math.PI - (k / 4) * (Math.PI / 2); sec.push([-tw + tr + tr * Math.cos(a), td - tr + tr * Math.sin(a), Math.cos(a), Math.sin(a)]); }
  for (let k = 0; k <= 4; k++) { const a = Math.PI / 2 - (k / 4) * (Math.PI / 2); sec.push([tw - tr + tr * Math.cos(a), td - tr + tr * Math.sin(a), Math.cos(a), Math.sin(a)]); }
  sec.push([tw, 0, 1, 0]);
  const run = [TRUNK.bot, TRUNK.top].map((y) => sec.map(([sx, sz, nx, nz]) => B.vert([tx + sx, y, sz], [nx, 0, nz], pvc)));   // (the elbow starts from this same section, so the joint is seamless)
  for (let k = 0; k < sec.length - 1; k++) B.quad(run[0][k], run[0][k + 1], run[1][k + 1], run[1][k]);
  const capC = B.vert([tx, TRUNK.top, td / 2], [0, 1, 0], pvc), cap = sec.map(([sx, sz]) => B.vert([tx + sx, TRUNK.top, sz], [0, 1, 0], pvc));
  for (let k = 0; k < cap.length; k++) B.tri(capC, cap[k], cap[(k + 1) % cap.length]);
  const elbow = Array.from({ length: 9 }, (_, j) => { const a = (j / 8) * (Math.PI / 2), c = Math.cos(a), s = Math.sin(a); return sec.map(([sx, sz, nx, nz]) => B.vert([tx + sx, TRUNK.bot - sz * s, sz * c], [nx, -nz * s, nz * c], pvc)); });
  for (let j = 0; j < 8; j++) for (let k = 0; k < sec.length - 1; k++) B.quad(elbow[j][k], elbow[j][k + 1], elbow[j + 1][k + 1], elbow[j + 1][k]);
  root.add(own(new Mesh(B.build(), M.body, 'aircon')));

  // ---------- the louvre flap: the outline's own curve across the opening (so it closes flush), THICK deep, built about its hinge,
  // which sits 0.75 from its rear edge and 0.35 inside: opening drops the front edge while the rear tucks up into the duct
  const qv = at(sF1 - 0.75), pv = [qv.p[0] - qv.n[0] * 0.35, qv.p[1] - qv.n[1] * 0.35], F = builder();
  const fq = [sF0, ...base.filter((s) => s > sF0 + 1e-3 && s < sF1 - 1e-3), sF1].map(at);
  const fp = (x, q, h) => [x, q.p[1] + q.n[1] * h - pv[1], q.p[0] + q.n[0] * h - pv[0]];
  const outer = fq.map((q) => [-XF, XF].map((x) => F.vert(fp(x, q, 0), N3(q.n), wt))), inner = fq.map((q) => [-XF, XF].map((x) => F.vert(fp(x, q, -THICK), N3([-q.n[0], -q.n[1]]), wt)));
  for (let i = 0; i < fq.length - 1; i++) { F.quad(outer[i][0], outer[i][1], outer[i + 1][1], outer[i + 1][0]); F.quad(inner[i][0], inner[i][1], inner[i + 1][1], inner[i + 1][0]); }
  for (const [i, sg] of [[0, -1], [fq.length - 1, 1]]) { const q = fq[i], tg = N3([q.n[1] * sg, -q.n[0] * sg]), e = [-XF, XF].flatMap((x) => [F.vert(fp(x, q, 0), tg, wt), F.vert(fp(x, q, -THICK), tg, wt)]); F.quad(e[0], e[2], e[3], e[1]); }
  for (const sg of [-1, 1]) { const nn = [sg, 0, 0], o = fq.map((q) => F.vert(fp(sg * XF, q, 0), nn, wt)), n = fq.map((q) => F.vert(fp(sg * XF, q, -THICK), nn, wt)); for (let i = 0; i < fq.length - 1; i++) F.quad(o[i], o[i + 1], n[i + 1], n[i]); }
  const hinge = new Node('aircon-flap-hinge'); hinge.position = [0, pv[1], pv[0]]; hinge.rotation = [OPEN, 0, 0]; root.add(hinge);
  hinge.add(own(new Mesh(F.build(), M.body, 'aircon-flap')));

  // ---------- the display: the lit glyphs on a patch just proud of the window
  const D = builder();
  patch(D, DISPLAY.x - 2.3, DISPLAY.x + 2.3, DISPLAY.y - 0.72, DISPLAY.y + 0.72, 0.05, (u, v) => [u, v]);
  root.add(own(new Mesh(D.build(), M.disp, 'aircon-display'), 1));

  // ---------- the contact shadow on the plaster, just off the wall (and, like everything here, below local y +2: the ceiling is close)
  const SB = builder(), sq = [[-26, -20], [26, -20], [26, 1.5], [-26, 1.5]].map(([x, y]) => SB.vert([x, y, 0.15], [0, 0, 1], [(x + 26) / 52, (y + 20) / 21.5]));
  SB.quad(sq[0], sq[1], sq[2], sq[3]);
  root.add(own(new Mesh(SB.build(), M.shadow, 'aircon-shadow')));

  // ---------- the air: two groups of four streaks, each streak a pair of crossed ribbons (one flat across the outlet, one upright
  // along the flow) so it reads from any side. Each group is born at the outlet unseen, drifts out and down as it fades in and out,
  // and is reborn elsewhere; the two run half a life apart, so the flow never stops. Positions are rewritten every frame.
  const airTex = streakTexture();
  const air = [0, 1].map(() => {
    const nv = STREAKS * (NS + 1) * 4, nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = [];
    for (let v = 0; v < nv; v++) { nor[v * 3 + 1] = 1; uv[v * 2] = v % 2; uv[v * 2 + 1] = (Math.floor(v / 4) % (NS + 1)) / NS; }
    for (let k = 0; k < STREAKS; k++) for (let i = 0; i < NS; i++) for (const e of [0, 2]) { const a = (k * (NS + 1) + i) * 4 + e, b = a + 4; idx.push(a, a + 1, b + 1, a, b + 1, b); }
    const geo = { positions: new Float32Array(nv * 3), normals: nor, uvs: uv, indices: new Uint16Array(idx), dynamic: true, bounds: { min: [-23, -27, 3], max: [23, -9, 23] } };
    const mat = new Material({ color: color('#a9d2ff').map((v) => v * 1.4), map: airTex, unlit: true, transparent: true, depthWrite: false, doubleSide: true, opacity: 0, receiveShadow: false });
    root.add(own(new Mesh(geo, mat, 'aircon-air'), 2));
    return { geo, mat };
  });

  // ---------- the hover and click volume, tight round the body
  const hit = new Mesh(box(W + 0.6, 15.6, 10.9), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false, receiveShadow: false }), 'aircon-hit');
  hit.position = [0, -7.6, 5.45]; hit.castShadow = false; hit.pickable = true;
  hit.userData = { keyId: 'aircon', interactive: true, glow: 0, targetGlow: 0 };
  root.add(hit);

  // ---------- life. open: the flap's travel (its motor drives it at a steady pace, eased at the ends); swing: how much of the ±8°
  // sweep it is making; flow: the air; disp: the display's light
  let on = true, open = 1, swing = 1, flow = 1, disp = 1, hov = 0;
  const q0 = at(sF0), dz0 = q0.p[0] - pv[0], dy0 = q0.p[1] - pv[1];   // the flap's front edge, from the hinge
  const toggle = () => { on = !on; return on; };
  const update = (dt, time, level = 1) => {
    dt = Math.min(Math.max(dt || 0, 0), 0.1); time = time || 0;
    hov += ((hit.userData.targetGlow || 0) - hov) * (1 - Math.exp(-8 * dt));
    open = clamp(open + (on ? 1 : -1) * dt * 0.5, 0, 1);
    swing += ((on && open > 0.98 ? 1 : 0) - swing) * (1 - Math.exp(-1.2 * dt));
    const th = smooth(0, 1, open) * (OPEN + SWING * swing * Math.sin((time / PERIOD) * Math.PI * 2));
    hinge.rotation[0] = th;
    // the display wakes with the unit and with the room; the rim warms a little under the cursor
    disp += ((on ? 1 : 0) - disp) * (1 - Math.exp(-(on ? 6 : 3) * dt));
    M.disp.opacity = clamp(disp * (0.3 + 0.7 * level) * (1 + 0.15 * hov), 0, 1);
    M.body.fresnel = 0.2 + 0.16 * hov;
    // the air comes once the flap is half open, and stops at once when the unit is switched off
    flow = on && open > 0.5 ? Math.min(1, flow + dt * 0.7) : Math.max(0, flow - dt * 2.5);
    // it leaves between the lip and the flap's front edge, along the flap and a little down, then sinks as it goes
    const c = Math.cos(th), s = Math.sin(th), fy = c * dy0 - s * dz0, fz = s * dy0 + c * dz0;
    const ez = (H1[0] + pv[0] + fz) / 2, ey = (H1[1] + pv[1] + fy) / 2, a0 = Math.atan2(fy, fz) - 0.14;
    for (let g = 0; g < 2; g++) {
      const A = air[g], ph = time / LIFE + g * 0.5, cyc = Math.floor(ph), life = ph - cyc;
      A.mat.opacity = AIR * flow * (0.4 + 0.6 * level) * Math.sin(Math.PI * life) ** 2;
      if (A.mat.opacity < 0.002) continue;   // unseen: the renderer skips it, so leave the buffer alone
      const P = A.geo.positions;
      for (let k = 0; k < STREAKS; k++) {
        const r = rng(cyc * 7919 + g * 104729 + k * 613 + 1);
        const x0 = (r() * 1.64 - 0.82) * XO, sp = 2.7 * (0.85 + 0.3 * r()), al = a0 + (r() - 0.5) * 0.22, amp = 0.15 + 0.3 * r(), wph = r() * 6.283, wid = 0.45 + 0.4 * r(), len = 4 + 2.6 * r(), kap = 0.06 + 0.05 * r();
        const head = sp * life * LIFE, L = Math.min(head, len * (0.55 + 0.45 * life)), tail = head - L;
        for (let i = 0; i <= NS; i++) {
          // the path turns steadily downward (kap per unit), integrated in closed form, with a slow wave running along it
          const sd = tail + (L * i) / NS, ang = al - kap * sd, zz = ez + (Math.sin(al) - Math.sin(ang)) / kap, yy = ey + (Math.cos(ang) - Math.cos(al)) / kap;
          const nz = -Math.sin(ang), ny = Math.cos(ang), wav = amp * Math.sin(1.3 * sd - 2.4 * time + wph) * Math.min(1, sd / 1.5);
          const cx = x0 * (1 + 0.022 * sd) + 0.25 * Math.sin(0.9 * sd + time + wph) * Math.min(1, sd / 2), cy = yy + ny * wav, cz = zz + nz * wav;
          const hw = wid * (0.55 + 0.45 * Math.min(1, sd / 6)), o = (k * (NS + 1) + i) * 12;
          P[o] = cx - hw; P[o + 1] = cy; P[o + 2] = cz; P[o + 3] = cx + hw; P[o + 4] = cy; P[o + 5] = cz;
          P[o + 6] = cx; P[o + 7] = cy - ny * hw * 0.8; P[o + 8] = cz - nz * hw * 0.8; P[o + 9] = cx; P[o + 10] = cy + ny * hw * 0.8; P[o + 11] = cz + nz * hw * 0.8;
        }
      }
      A.geo.needsUpdate = true;
    }
  };
  return { root, hit, toggle, update, dimmable: [M.body], get on() { return on; } };
}
