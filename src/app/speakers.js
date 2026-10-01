// A pair of bookshelf studio monitors for the desk, walnut and satin black with bronze trim; left and right are mirror images.
// The cabinet is a walnut sleeve (veneer with real grain, wrapped round it in one piece: it climbs the sides and runs front to back
// over the top) with softly rounded vertical edges and eased top and bottom edges; the front baffle and the back panel are satin
// black, set a little way into it. On the front: a woven aramid woofer with a rubber half-roll surround and a dust cap, in a machined
// bronze trim ring held by four hex screws; a silk dome tweeter in a shallow waveguide ringed in bronze; a flared slot port along
// the foot; a small engraved NG plate with the amber power LED beside it. On the back, in a recessed plate: gold binding posts with
// red and black collars (the speaker wire comes in clamped under the inner one). The right speaker is the active one: its plate (a
// unit taller) also carries the figure-8 mains inlet, a 3.5 mm AUX jack, a knurled volume knob and a rocker switch, and its posts are
// the SPEAKER OUT that feeds the passive left one. Each stands on a thin cork pad.
// The desk lamps light the walnut (the room drives the cabinet's emissive for its hover glow); every other material carries its
// own colour as a little painted-in light, and the metals a warm rim. Static parts are merged by material: eight draw calls a
// speaker, the cone, the dust cap and the LED among them (the room pushes the first two out with the beat and lights the third).
// Local frame: origin on the desk under the middle, y up, +z out of the front. 1 unit ≈ 19 mm: the cabinet is 84 × 137 × 87 mm.
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, sphere, merge } from 'engine/geometry';
import { drawTexture, SANS } from 'engine/textures';
import { M4, color } from 'engine/math';

const TAU = Math.PI * 2;
// ---------- the layout. Heights inside the cabinet are added to Y0, the top of the pad
const W = 2.2, D = 2.3, H = 7.2, R = 0.42, E = 0.035;      // half width, half depth, height; vertical edge radius; the eased top and bottom edges
const PAD = 0.16, TUCK = 0.12;                               // a 3 mm cork pad, tucked in under the cabinet so it reads as a thing of its own
const LIP = 0.07, LIPV = 0.08, REC = 0.09;                   // the walnut frame round each panel (beside it, above and below it); the panels' set-back
const Y0 = PAD, ZB = D - REC, BW = W - R - LIP, YB0 = Y0 + E + LIPV, YB1 = Y0 + H - E - LIPV;   // ZB: the baffle's plane, BW its half width
const WOOF = { y: Y0 + 3.16, hole: 1.36, base: -0.16 };                  // base: the surround's foot, behind the baffle (the ring's wall hides it)
const TWEET = { y: Y0 + 5.86, hole: 0.9 };
const PORT = { y: Y0 + 0.6, a: 1.15, b: 0.13, f: 0.085, depth: 0.9 };    // the slot: half width (round ends included), half height, flare radius
const BADGE = { y: Y0 + 1.24, w: 0.6, h: 0.2 }, LED_X = 0.56;            // the NG plate, and the LED beside it on the inner side
const CUP = { x: 1.2, y0: Y0 + 0.5, depth: 0.16 }, ZP = -(ZB - CUP.depth);   // the terminal pocket in the back panel (its top: plateOf); ZP: its plate
const POST = { x: 0.5, y: 1.2 }, KNOB = { y: Y0 + 2.44, r: 0.36 }, ROCKER = 0.82;          // POST.y: the height app/cables brings the lead in at
// the right speaker's inputs: the figure-8 mains inlet over the knob (IEC C8, two lobes round the pins, which the cord's C7 fits), its
// satin bezel standing `face` proud of the plate and its well `depth` behind it; the 3.5 mm AUX jack beside the knob, opposite the rocker
const IEC = { y: Y0 + 3.52, lobe: 0.18, e: 0.125, hx: 0.47, hy: 0.29, rc: 0.14, face: 0.045, depth: 0.26 }, AUX = { x: 0.82, y: Y0 + 2.44 };
const SATIN = '#1b1916', INK = '#b4a88e', BRONZE = '#8e6a3d', GOLD = '#c39a4c', ANOD = '#1c1b1a', RED = '#8a1e16';

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- painted textures
// walnut veneer, its grain running up the canvas (v), seamless across (u). `glow`: the same figure as a light modulation round 1,
// the cabinet's emissive map, so the room's hover glow comes up through the grain instead of washing over it
function walnutTexture(seed, glow = false) {
  const k = glow ? 0.5 : 1;
  return drawTexture(512 * k, 1024 * k, (ctx) => {
    const r = rng(seed), w = 512, h = 1024, dark = glow ? '0,0,0' : '28,15,7', light = glow ? '255,255,255' : '156,108,66';
    ctx.scale(k, k);
    ctx.fillStyle = glow ? '#c8c8c8' : 'rgb(86,56,34)'; ctx.fillRect(0, 0, w, h);
    const thrice = (fn) => { for (const o of [-w, 0, w]) { ctx.save(); ctx.translate(o, 0); fn(); ctx.restore(); } };   // drawn across both seams
    // the colour drifts across the leaf in broad soft bands
    for (let i = 0; i < 18; i++) {
      const x = r() * w, bw = 10 + r() * 60, rgb = r() < 0.6 ? dark : light, a = 0.05 + r() * 0.14;
      thrice(() => { const g = ctx.createLinearGradient(x - bw, 0, x + bw, 0); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.5, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - bw, 0, bw * 2, h); });
    }
    // a cathedral or two, where the knife cut across the growth rings: nested arches pointing up the grain
    for (let c = 0; c < 2; c++) {
      const cx = r() * w, top = 120 + r() * 560, n = 6 + Math.floor(r() * 5);
      for (let j = 0; j < n; j++) {
        const sw = 6 + j * (6 + r() * 4), y0 = top + j * 16, tall = 160 + j * 30, a = 0.08 + r() * 0.14, lw = 0.8 + r() * 1.6;
        thrice(() => { ctx.strokeStyle = `rgba(${dark},${a})`; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(cx - sw, y0 + tall); ctx.bezierCurveTo(cx - sw * 1.1, y0, cx + sw * 1.1, y0, cx + sw, y0 + tall); ctx.stroke(); });
      }
    }
    // the grain: long, gently wandering lines, mostly dark, a few pale
    for (let i = 0; i < 260; i++) {
      const x = r() * w, amp = 1 + r() * 4, per = 160 + r() * 520, ph = r() * TAU, lw = 0.5 + r() * 1.9, d = r() < 0.72, a = d ? 0.1 + r() * 0.3 : 0.05 + r() * 0.12;
      thrice(() => { ctx.strokeStyle = `rgba(${d ? dark : light},${a})`; ctx.lineWidth = lw; ctx.beginPath(); for (let y = 0; y <= h; y += 16) { const xx = x + amp * Math.sin(ph + (y / per) * TAU); if (y) ctx.lineTo(xx, y); else ctx.moveTo(xx, y); } ctx.stroke(); });
    }
    // open pores: short dark dashes along the grain
    for (let i = 0; i < 5000; i++) { const x = r() * w, y = r() * h, l = 2 + r() * 5, a = 0.12 + r() * 0.3; ctx.fillStyle = `rgba(${dark},${a})`; ctx.fillRect(x, y, 1, l); }
  }, { repeat: true, srgb: !glow });
}
function corkTexture(seed) {
  const r = rng(seed);
  return drawTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#9a6f45'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = r(), x = r() * w, y = r() * h, rad = 0.6 + r() * 2.2, a = 0.25 + r() * 0.45; ctx.fillStyle = v < 0.45 ? `rgba(70,44,22,${a})` : v < 0.85 ? `rgba(196,152,104,${a})` : `rgba(40,24,12,${a})`; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill(); }
  }, { repeat: true });
}
// the woofer: on the left a plain weave of flat aramid tows (laid flat onto the cone), on the right the surround's rubber
function coneTexture() {
  return drawTexture(512, 256, (ctx) => {
    const r = rng(23), P = 16;
    ctx.fillStyle = '#1e150b'; ctx.fillRect(0, 0, 256, 256);
    for (let j = 0; j < 256 / P; j++) for (let i = 0; i < 256 / P; i++) {
      const x = i * P, y = j * P, across = (i + j) % 2 === 0;
      // each tow is rounded across its width and dives under its neighbours at both ends
      const g = across ? ctx.createLinearGradient(0, y, 0, y + P) : ctx.createLinearGradient(x, 0, x + P, 0);
      g.addColorStop(0, '#35260f'); g.addColorStop(0.35, '#77593a'); g.addColorStop(0.6, '#86663f'); g.addColorStop(1, '#2f210f');
      ctx.globalAlpha = 0.86 + r() * 0.14; ctx.fillStyle = g; ctx.fillRect(x + 0.5, y + 0.5, P - 1, P - 1); ctx.globalAlpha = 1;
      const e = across ? ctx.createLinearGradient(x, 0, x + P, 0) : ctx.createLinearGradient(0, y, 0, y + P);
      e.addColorStop(0, 'rgba(20,12,4,0.55)'); e.addColorStop(0.2, 'rgba(20,12,4,0)'); e.addColorStop(0.8, 'rgba(20,12,4,0)'); e.addColorStop(1, 'rgba(20,12,4,0.55)');
      ctx.fillStyle = e; ctx.fillRect(x, y, P, P);
      ctx.strokeStyle = 'rgba(255,226,170,0.1)'; ctx.lineWidth = 1;   // the filaments along the tow
      for (let q = 3; q < P - 2; q += 3) { ctx.beginPath(); if (across) { ctx.moveTo(x + 2, y + q + 0.5); ctx.lineTo(x + P - 2, y + q + 0.5); } else { ctx.moveTo(x + q + 0.5, y + 2); ctx.lineTo(x + q + 0.5, y + P - 2); } ctx.stroke(); }
    }
    ctx.fillStyle = '#131110'; ctx.fillRect(256, 0, 256, 256);
    for (let i = 0; i < 1500; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,240,220'},${r() * 0.05})`; ctx.fillRect(256 + r() * 256, r() * 256, 1.5, 1.5); }
  });
}
// the metals' atlas (canvas px): 64 px bands for turned parts, u running round them; cells for the small parts
const MB = { bronze: 32, gold: 96, knurl: 160, grip: 224, black: 480 };   // band centre rows
const MC = { red: [0, 256, 128, 320], anod: [128, 256, 256, 320], dark: [256, 256, 384, 320], bright: [384, 256, 448, 320], nickel: [448, 256, 512, 320], screw: [0, 320, 128, 448], badge: [128, 320, 512, 448] };
function metalTexture() {
  return drawTexture(512, 512, (ctx, w) => {
    const r = rng(17);
    const rgb = (hex, k = 1) => { const n = parseInt(hex.slice(1), 16); return `rgb(${[n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.min(255, Math.round(v * k)))})`; };
    // the colour under a sheen that varies round the part, as a lamp overhead leaves streaks in a turned surface
    const SHEEN = [[0, 0.7], [0.11, 1.12], [0.24, 0.78], [0.37, 0.98], [0.5, 0.66], [0.63, 1.05], [0.76, 0.74], [0.89, 1.16], [1, 0.7]];
    const sheen = (x0, y0, x1, y1, hex, stops = SHEEN) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); for (const [u, k] of stops) g.addColorStop(u, rgb(hex, k)); ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); };
    sheen(0, 0, w, 64, BRONZE); sheen(0, 64, w, 128, GOLD); sheen(0, 448, w, 512, ANOD);
    // knurling: dark grooves with a lit edge, 24 round a post's nut, 40 round the knob
    const knurl = (y0, hex, n, groove, lit) => { sheen(0, y0, w, y0 + 64, hex); for (let i = 0; i < n; i++) { const x = (i / n) * w, p = w / n; ctx.fillStyle = groove; ctx.fillRect(x, y0, p * 0.32, 64); ctx.fillStyle = lit; ctx.fillRect(x + p * 0.32, y0, p * 0.12, 64); } };
    knurl(128, GOLD, 24, 'rgba(40,26,8,0.6)', 'rgba(255,236,190,0.35)'); knurl(192, ANOD, 40, 'rgba(0,0,0,0.65)', 'rgba(255,245,230,0.12)');
    sheen(...MC.red, RED); sheen(...MC.anod, ANOD); sheen(...MC.dark, '#4d3822'); sheen(...MC.bright, '#e2c27a'); sheen(...MC.nickel, '#b9b7b1');
    // a button-head screw from above: dark steel, a soft highlight on the dome, the hex socket
    {
      const [x0, y0, x1, y1] = MC.screw, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hex = (s) => { ctx.beginPath(); for (let i = 0; i < 6; i++) ctx.lineTo(cx + s * Math.cos((i / 6) * TAU), cy + s * Math.sin((i / 6) * TAU)); ctx.closePath(); };
      ctx.fillStyle = '#2b2622'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      const g = ctx.createRadialGradient(cx - 14, cy - 16, 2, cx, cy, 58); g.addColorStop(0, 'rgba(255,228,190,0.42)'); g.addColorStop(0.5, 'rgba(255,228,190,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.fillStyle = '#070606'; hex(21); ctx.fill(); ctx.strokeStyle = 'rgba(255,230,200,0.2)'; ctx.lineWidth = 2; hex(22); ctx.stroke();
    }
    // the NG plate: brushed bronze, a fine engraved border and the monogram cut in, dark in the cut, its lower edge catching the light
    {
      const [x0, y0, x1, y1] = MC.badge, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      sheen(x0, y0, x1, y1, '#9a7546', [[0, 0.82], [0.3, 1.04], [0.55, 0.9], [0.8, 1.1], [1, 0.84]]);
      for (let i = 0; i < 140; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '40,26,10' : '255,236,200'},${0.04 + r() * 0.08})`; ctx.fillRect(x0, y0 + r() * (y1 - y0), x1 - x0, 1); }
      const cut = (fn) => { ctx.save(); ctx.translate(0, 2); ctx.fillStyle = ctx.strokeStyle = 'rgba(255,226,170,0.55)'; fn(); ctx.restore(); ctx.fillStyle = ctx.strokeStyle = '#2c1f10'; fn(); };
      cut(() => { ctx.lineWidth = 2; ctx.strokeRect(x0 + 10, y0 + 10, x1 - x0 - 20, y1 - y0 - 20); });
      cut(() => { ctx.font = `600 70px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('N G', cx, cy + 3); });
      cut(() => { ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 36, cy); ctx.lineTo(cx - 76, cy); ctx.moveTo(cx + 76, cy); ctx.lineTo(x1 - 36, cy); ctx.stroke(); });
    }
  });
}
// satin black, with two things painted on: a strip along the top that darkens to the right (the port's throat runs along it into the
// dark), and the terminal plate's screen print, laid out from the same numbers as the parts on the plate
const T_SATIN = [490 / 512, 1 - 300 / 512], dark = (k) => [0.02 + 0.96 * k, 1 - 12 / 512];
// the terminal plate: the right speaker's is a unit taller, to take the mains inlet. Its print sits on the black atlas from canvas row
// 32 down, at as many px a unit as fit 480 rows (the left's ≈ 171, the right's ≈ 126); seen from behind, its +x runs right to left
function plateOf(side) {
  const y1 = Y0 + (side > 0 ? 4.3 : 3.3), U = 480 / (y1 - CUP.y0), X = (x) => (CUP.x - x) * U, Y = (y) => 32 + (y1 - y) * U;
  return { y1, U, X, Y, uv: (p) => [X(p[0]) / 512, 1 - Y(p[1]) / 512] };
}
function blackTexture(side) {
  return drawTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = SATIN; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, SATIN); g.addColorStop(0.3, '#0c0b0a'); g.addColorStop(1, '#020202');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, 24);
    // sizes are given as px at the left plate's 171 px a unit, so the print is the same size on both plates
    const { y1, U, X, Y } = plateOf(side), k = U / 171.4;
    const txt = (s, x, y, px, wt = 600) => { ctx.font = `${wt} ${(px * k).toFixed(1)}px ${SANS}`; ctx.fillText(s, X(x), Y(y)); };
    const ring = (x, y, rr, lw) => { ctx.lineWidth = lw * k; ctx.beginPath(); ctx.arc(X(x), Y(y), rr * U, 0, TAU); ctx.stroke(); };
    ctx.fillStyle = ctx.strokeStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.5; ctx.lineWidth = 2 * k; ctx.strokeRect(X(CUP.x) + 9 * k, Y(y1) + 9 * k, 2 * CUP.x * U - 18 * k, (y1 - CUP.y0) * U - 18 * k); ctx.globalAlpha = 1;
    txt('NG · STUDIO MONITOR', 0, y1 - 0.2, 16);
    ring(-0.82, y1 - 0.2, 0.09, 1.5); txt(side < 0 ? 'L' : 'R', -0.82, y1 - 0.2, 14, 700);
    if (side > 0) {
      // the volume scale: eleven ticks from 7 to 5 o'clock, MIN and MAX at the ends; POWER over the rocker, AUX IN over the jack, and
      // AC IN beside the inlet, in the rocker's column
      for (let i = 0; i <= 10; i++) {
        const a = ((-135 + i * 27) * Math.PI) / 180, r0 = KNOB.r + 0.08, r1 = KNOB.r + (i % 5 ? 0.13 : 0.18);
        ctx.lineWidth = (i % 5 ? 2 : 3) * k; ctx.beginPath(); ctx.moveTo(X(-Math.sin(a) * r0), Y(KNOB.y + Math.cos(a) * r0)); ctx.lineTo(X(-Math.sin(a) * r1), Y(KNOB.y + Math.cos(a) * r1)); ctx.stroke();
      }
      txt('MIN', 0.47, KNOB.y - 0.47, 11); txt('MAX', -0.47, KNOB.y - 0.47, 11); txt('VOLUME', 0, KNOB.y - 0.55, 13);
      txt('POWER', -ROCKER, KNOB.y + 0.33, 11); txt('AUX IN', AUX.x, AUX.y + 0.33, 11); txt('AC IN', -ROCKER, IEC.y, 12);
      txt('SPEAKER OUT', 0, POST.y + 0.56, 12); txt('AC 100-240 V ~ 50/60 Hz · 60 W', 0, CUP.y0 + 0.26, 10, 500);
    } else {
      // no amplifier in this one: its monogram sits where the knob would be
      ring(0, KNOB.y, 0.4, 2); ring(0, KNOB.y, 0.34, 1); txt('NG', 0, KNOB.y + 0.01, 44, 700); txt('PASSIVE', 0, KNOB.y - 0.55, 13);
      txt('SPEAKER IN', 0, POST.y + 0.56, 12); txt('6 Ω · FROM THE ACTIVE SPEAKER', 0, CUP.y0 + 0.26, 10, 500);
    }
    txt('+', -side * POST.x, POST.y + 0.33, 22, 700); txt('−', side * POST.x, POST.y + 0.33, 22, 700);
    txt(`DESIGNED & BUILT BY NG · No. 0${side < 0 ? 1 : 2}`, 0, CUP.y0 + 0.13, 10, 500);
  });
}

// ---------- geometry kit
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
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
// rows of vertices {p, n, t} (all rows the same length) → the strip of quads between each row and the next; `closed` joins last to first
function grid(rows, closed = false) {
  const pos = [], nor = [], uv = [], idx = [], m = rows[0].length, nr = rows.length;
  for (const row of rows) for (const v of row) { pos.push(...v.p); nor.push(...v.n); uv.push(...v.t); }
  for (let i = 0; i < (closed ? nr : nr - 1); i++) for (let j = 0; j < m - 1; j++) { const a = i * m + j, b = ((i + 1) % nr) * m + j; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  return mesh(pos, nor, uv, idx);
}
const quad = (a, b, c, d, n, t) => grid([[{ p: a, n, t: t(a) }, { p: b, n, t: t(b) }], [{ p: d, n, t: t(d) }, { p: c, n, t: t(c) }]]);
// a flat fan from centre c out to a closed outline, facing n
function fan(c, pts, n, t) {
  const pos = [...c], nor = [...n], uv = [...t(c)], idx = [];
  pts.forEach((p, i) => { pos.push(...p); nor.push(...n); uv.push(...t(p)); idx.push(0, 1 + i, 1 + ((i + 1) % pts.length)); });
  return mesh(pos, nor, uv, idx);
}
// a surface of revolution about z through the profile [[r, z], …], which runs with the outside on its right, n segments round; profile
// neighbours share normals, so machined edges read soft. `uvf(f, j, x, y)`: the uv at round fraction f of profile point j (at x, y)
function lathe(prof, n, uvf) {
  const sn = prof.slice(1).map((q, j) => { const p = prof[j], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [(q[1] - p[1]) / l, (p[0] - q[0]) / l]; });
  const pn = prof.map((_, j) => { const a = sn[j - 1] || sn[j], b = sn[j] || sn[j - 1], l = Math.hypot(a[0] + b[0], a[1] + b[1]) || 1; return [(a[0] + b[0]) / l, (a[1] + b[1]) / l]; });
  const rows = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, c = Math.cos(a), s = Math.sin(a); rows.push(prof.map(([r, z], j) => ({ p: [r * c, r * s, z], n: [pn[j][0] * c, pn[j][0] * s, pn[j][1]], t: uvf(i / n, j, r * c, r * s) }))); }
  return grid(rows);
}
const arc = (cr, cz, ar, az, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const t = a0 + ((a1 - a0) * i) / n; return [cr + ar * Math.cos(t), cz + az * Math.sin(t)]; });
// a spherical cap a across its foot and h high, standing on z0: its profile from the foot (t0) to the pole
const dome = (a, h, z0, n) => { const rs = (a * a + h * h) / (2 * h), zc = z0 + h - rs, t0 = Math.asin(a / rs); return Array.from({ length: n + 1 }, (_, i) => { const t = t0 * (1 - i / n); return [rs * Math.sin(t), zc + rs * Math.cos(t)]; }); };
const withUV = (g, t) => { for (let i = 0; i < g.uvs.length; i += 2) { const q = t(g.uvs[i], g.uvs[i + 1]); g.uvs[i] = q[0]; g.uvs[i + 1] = q[1]; } return g; };
const band = (row) => (f) => [f, 1 - row / 512];
const cell = (c) => (f) => [(c[0] + 6 + f * (c[2] - c[0] - 12)) / 512, 1 - (c[1] + c[3]) / 1024];
const cellUV = (c, s = 0, t = 0) => [(c[0] + 6 + s * (c[2] - c[0] - 12)) / 512, 1 - (c[3] - 6 - t * (c[3] - c[1] - 12)) / 512];

// the plan: a rounded rectangle (half sizes hx, hz, corner radius r) as points {p: [x, z], n, s} with outward normals and the
// distance s round from the first, clockwise from above starting where the front meets the front-right corner, na steps a corner
function plan(hx, hz, r, na = 9) {
  const out = []; let s = 0;
  for (const [sx, sz, a0] of [[1, 1, Math.PI / 2], [1, -1, 0], [-1, -1, -Math.PI / 2], [-1, 1, -Math.PI]]) {
    for (let i = 0; i <= na; i++) {
      const a = a0 - (i / na) * (Math.PI / 2), c = Math.cos(a), sn = Math.sin(a), p = [sx * (hx - r) + r * c, sz * (hz - r) + r * sn];
      if (out.length) s += Math.hypot(p[0] - out[out.length - 1].p[0], p[1] - out[out.length - 1].p[1]);
      out.push({ p, n: [c, sn], s });
    }
  }
  return out;
}
// the slot port's outline: a stadium of half width a (round ends included) and half height b about the origin, anticlockwise from
// the foot of its right end, as points {p: [x, y], n} with outward normals
function stadium(a, b, nc = 10, ns = 6) {
  const out = [], k = a - b;
  const end = (cx, a0) => { for (let i = 0; i <= nc; i++) { const t = a0 + (i / nc) * Math.PI; out.push({ p: [cx + b * Math.cos(t), b * Math.sin(t)], n: [Math.cos(t), Math.sin(t)] }); } };
  const side = (y, ny, x0, x1) => { for (let i = 1; i < ns; i++) out.push({ p: [x0 + ((x1 - x0) * i) / ns, y], n: [0, ny] }); };
  end(k, -Math.PI / 2); side(b, 1, k, -k); end(-k, Math.PI / 2); side(-b, -1, -k, k);
  return out;
}
// how far a ray from a stadium's centre at angle t runs before it meets the edge
function stadiumReach(a, b, t) {
  const c = Math.cos(t), s = Math.sin(t), k = a - b;
  if (Math.abs(s) > 1e-9 && Math.abs((b / Math.abs(s)) * c) <= k) return b / Math.abs(s);
  const e = Math.sign(c) * k;   // a round end, centred (e, 0): the far root of |d·(c, s) - (e, 0)| = b
  return c * e + Math.sqrt(c * c * e * e - e * e + b * b);
}
// a flat ring at depth z facing nz between two outlines star-shaped about (cx, cy), joined ray by ray from it at the angles `as`:
// inner(a) and outer(a) are how far each reaches along direction a. `t` is a uv, or the uv as a function of the point
function between(cx, cy, inner, outer, as, z, nz, t) {
  const uv = typeof t === 'function' ? t : () => t, all = as.map((a) => ((a % TAU) + TAU) % TAU).sort((p, q) => p - q).filter((a, i, l) => !i || a - l[i - 1] > 1e-6);
  return grid(all.map((a) => { const c = Math.cos(a), s = Math.sin(a); return [inner(a), outer(a)].map((d) => { const p = [cx + c * d, cy + s * d, z]; return { p, n: [0, 0, nz], t: uv(p) }; }); }), true);
}
// a panel: the rectangle [x0, x1] × [y0, y1] less a hole about (cx, cy), its rays `as` plus the four corners (or it would cut them off)
function holed(x0, x1, y0, y1, cx, cy, hole, as, z, nz, t) {
  const rect = (a) => { const c = Math.cos(a), s = Math.sin(a); return Math.min(c > 1e-9 ? (x1 - cx) / c : c < -1e-9 ? (x0 - cx) / c : Infinity, s > 1e-9 ? (y1 - cy) / s : s < -1e-9 ? (y0 - cy) / s : Infinity); };
  return between(cx, cy, hole, rect, [...as, ...[[x1, y1], [x0, y1], [x0, y0], [x1, y0]].map(([x, y]) => Math.atan2(y - cy, x - cx))], z, nz, t);
}
// how far a ray from the origin at angle a stays inside a shape star-shaped about it (`inside(x, y)`), found by halving
const reachOf = (inside, max = 1) => (a) => { const c = Math.cos(a), s = Math.sin(a); let lo = 0, hi = max; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (inside(c * m, s * m)) lo = m; else hi = m; } return lo; };
// an outline about (cx, cy), sampled on the rays `as` (in increasing order), swept from depth z0 to z1: walls facing out of it (out = 1)
// or into it (-1); `t(k)` the uv at depth fraction k
function wall(cx, cy, reach, as, z0, z1, out, t) {
  const pts = as.map((a) => [cx + Math.cos(a) * reach(a), cy + Math.sin(a) * reach(a)]), n = pts.length;
  return grid(pts.map((p, i) => { const q = pts[(i + 1) % n], o = pts[(i + n - 1) % n], l = Math.hypot(q[0] - o[0], q[1] - o[1]) || 1, nn = [(out * (q[1] - o[1])) / l, (-out * (q[0] - o[0])) / l, 0]; return [{ p: [p[0], p[1], z0], n: nn, t: t(0) }, { p: [p[0], p[1], z1], n: nn, t: t(1) }]; }), true);
}
// the four walls of a rectangular recess [x0, x1] × [y0, y1] between depths z0 and z1, facing into it
const recess = (x0, x1, y0, y1, z0, z1, t) => [
  ...[[x0, 1], [x1, -1]].map(([x, nx]) => quad([x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1], [nx, 0, 0], t)),
  ...[[y0, 1], [y1, -1]].map(([y, ny]) => quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, ny, 0], t)),
];

// ---------- the walnut sleeve: both flanks with their rounded vertical edges, the eased edges all round, the top and the bottom, and
// the narrow frame it leaves round each panel. u runs round the plan, one tile exactly four times round, so the grain wraps the
// cabinet unbroken, as one leaf of veneer would; v runs up the sides. The top takes the grain front to back
function sleeve() {
  const P = plan(W, D, R), half = P.length / 2, per = P[P.length - 1].s + Math.hypot(P[0].p[0] - P[P.length - 1].p[0], P[0].p[1] - P[P.length - 1].p[1]);
  const TU = per / 4, TV = 8, v = (y) => (y - Y0) / TV, XO = W - R, yA = Y0 + E, yB = Y0 + H - E, out = [];
  for (const side of [P.slice(0, half), P.slice(half)]) out.push(grid(side.map(({ p, n, s }) => [yA, yB].map((y) => ({ p: [p[0], y, p[1]], n: [n[0], 0, n[1]], t: [s / TU, v(y)] })))));
  const loop = [...P, { ...P[0], s: per }];
  for (const up of [1, -1]) {
    const y0 = up > 0 ? yB : yA, yc = up > 0 ? Y0 + H : Y0;
    out.push(grid(loop.map(({ p, n, s }) => [0, 1, 2].map((k) => { const b = (k / 2) * (Math.PI / 2), o = E * (1 - Math.cos(b)), y = y0 + up * E * Math.sin(b); return { p: [p[0] - n[0] * o, y, p[1] - n[1] * o], n: [n[0] * Math.cos(b), up * Math.sin(b), n[1] * Math.cos(b)], t: [s / TU, v(y)] }; }))));
    out.push(fan([0, yc, 0], P.map(({ p, n }) => [p[0] - n[0] * E, yc, p[1] - n[1] * E]), [0, up, 0], (q) => [q[0] / TU + 0.5, q[2] / TV + 0.5]));
  }
  // the frames carry on the plan's u: the front closes the loop (from -XO back to XO at s = per), the back runs between the back corners
  const sBack = P[2 * (P.length / 4) - 1].s;
  for (const [z, nz, u] of [[D, 1, (x) => (per - (XO - x)) / TU], [-D, -1, (x) => (sBack + XO - x) / TU]]) {
    const t = (q) => [u(q[0]), v(q[1])];
    for (const [x0, x1, y0, y1] of [[-XO, -BW, yA, yB], [BW, XO, yA, yB], [-BW, BW, yA, YB0], [-BW, BW, YB1, yB]]) out.push(quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, nz], t));
  }
  return merge(out.map((geo) => ({ geo })));
}

// ---------- turned parts: profiles [[r, z], …] that run with the outside on their right (z out of the baffle, or out of the back plate)
const RING = [[1.52, -0.012], [1.52, 0.014], [1.507, 0.042], [1.475, 0.064], [1.42, 0.076], [1.34, 0.079], [1.295, 0.073], [1.265, 0.057], [1.247, 0.033], [1.24, 0.004], [1.24, -0.29]];
const SCREW = [[0.068, -0.012], [0.068, 0.01], [0.062, 0.022], [0.046, 0.03], [0.022, 0.033], [0, 0.034]];
const TRING = [[0.975, -0.004], [0.975, 0.008], [0.965, 0.024], [0.94, 0.034], [0.91, 0.033], [0.89, 0.024], [0.879, 0.008], [0.876, -0.02]];
const GUIDE = [[0.905, 0], [0.86, -0.004], [0.78, -0.018], [0.69, -0.044], [0.6, -0.076], [0.53, -0.1], [0.475, -0.116], [0.44, -0.124], [0.425, -0.126]];
const BEZEL = [[0.088, -0.006], [0.088, 0.01], [0.078, 0.021], [0.063, 0.021], [0.056, 0.008], [0.056, -0.006]];
// the woofer's moving parts, about its own axis at the baffle: a flange under the ring's wall, the half-roll, the cone (curved, deeper
// toward the middle), and the dust cap a little proud of the cone's throat
const coneZ = (r) => WOOF.base - 0.34 * ((1 - r) / 0.62) ** 1.35;
const FLANGE = [[1.32, WOOF.base], [1.2, WOOF.base]], ROLL = arc(1.1, WOOF.base, 0.1, 0.095, 0, Math.PI, 10);
const CONE = Array.from({ length: 13 }, (_, i) => { const r = 1 - (0.62 * i) / 12; return [r, coneZ(r)]; });
const CAP = [[0.42, coneZ(0.42) - 0.035], ...dome(0.42, 0.17, coneZ(0.42) - 0.004, 9)];
const TROLL = arc(0.39, -0.126, 0.035, 0.03, 0, Math.PI, 6), TDOME = dome(0.355, 0.21, -0.126, 10);   // the silk dome, 0.71 across
// a binding post: an anodised collar, the knurled gold nut, its tip with the banana hole
const COLLAR = [[0.21, -0.01], [0.21, 0.085], [0.2, 0.108], [0.18, 0.12], [0.15, 0.123]];
const NUT = [[0.157, 0.115], [0.157, 0.41], [0.147, 0.428], [0.125, 0.437], [0.066, 0.437]];
const TIP = [[0.062, 0.43], [0.062, 0.51], [0.056, 0.528], [0.044, 0.535], [0.027, 0.535], [0.024, 0.52], [0.024, 0.49], [0, 0.49]];
const WASHER = [[0.42, -0.01], [0.42, 0.016], [0.405, 0.026], [0.37, 0.028]], GRIP = [[0.36, 0.02], [0.36, 0.29]];
const KTOP = [[0.36, 0.29], [0.352, 0.312], [0.336, 0.324], [0.31, 0.328], [0.2, 0.328], [0, 0.328]];
// the inlet's figure-8 (two lobes, star-shaped about the middle, the waist ≈ 0.26 high) and its bezel's rounded rectangle, about the
// inlet's centre; a pin, out of the floor of the well; the jack's nut, and its barrel with the 3.5 mm hole and the hole's dark floor
const fig8 = reachOf((x, y) => (Math.abs(x) - IEC.e) ** 2 + y * y <= IEC.lobe * IEC.lobe);
const bezel = reachOf((x, y) => Math.max(Math.abs(x) - IEC.hx + IEC.rc, 0) ** 2 + Math.max(Math.abs(y) - IEC.hy + IEC.rc, 0) ** 2 <= IEC.rc * IEC.rc);
const PIN = [[0.045, -0.01], [0.045, 0.16], [0.038, 0.183], [0.02, 0.193], [0, 0.195]];
const JNUT = [[0.17, -0.01], [0.17, 0.045], [0.16, 0.062], [0.14, 0.068], [0.118, 0.068]];
const JACK = [[0.112, 0.06], [0.112, 0.16], [0.106, 0.176], [0.095, 0.182], [0.088, 0.172], [0.086, 0.15], [0.086, 0.03], [0, 0.03]];
const screwUV = (f, j, x, y) => [(64 + (x / 0.068) * 56) / 512, 1 - (384 - (y / 0.068) * 56) / 512];

// static parts that share a material become one draw call
function batch() {
  const parts = new Map();
  return {
    parts,
    put(geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
      const m = M4.compose(new Array(16), p, r, s);
      if (!parts.has(mat)) parts.set(mat, []);
      parts.get(mat).push({ geo, m, n: [0, 1, 2].flatMap((j) => [0, 1, 2].map((i) => m[j * 4 + i] / (s[j] * s[j]))) });
    },
  };
}
// the textures every speaker shares (the walnut, the cork and the back plate's print are each speaker's own)
let shared = null;
const sharedTextures = () => shared || (shared = { metal: metalTexture(), cone: coneTexture() });

/**
 * One monitor. `side`: -1 for the left speaker (passive), 1 for the right (the one with the amplifier: the mains inlet, the AUX jack,
 * the volume knob and the switch are on its back, and its binding posts feed the left's); `seed` picks its leaf of walnut. Returns
 * { node, parts, cab, cone, cap, led, dimmable, plug, power, aux }: `parts` every mesh (pickable, owned by the node); `cab` the walnut,
 * whose emissive is the room's to drive (its hover glow); `cone` and `cap` at their rest z, to be pushed out along z with the beat;
 * `led` unlit, its emissiveIntensity the room's to drive; `dimmable` the materials whose emissive is painted-in light, to dim with the
 * room. Where leads come in, in local coordinates, each leaving along -z: `plug` the speaker wire (in the inner binding post's nut),
 * `power` the mains lead (in the inlet's well, in front of the pins; the waist of the figure-8 is 0.26 high, so a lead up to 0.13
 * thick fits), `aux` the 3.5 mm plug (in the jack's hole, 0.086 across in radius); the left speaker's power and aux are null.
 */
export function buildSpeaker(side = 1, seed = 40) {
  const node = new Node('speaker'), parts = [], rnd = rng(seed * 7 + 3), tex = sharedTextures(), warm = color('#c7a36a');
  node.userData = { keyId: 'speaker', interactive: true, glow: 0, targetGlow: 0 };
  // the walnut takes the desk lamps' light; the room writes its emissive (the hover glow), which the grain map modulates
  const cab = new Material({ color: [1, 1, 1], map: walnutTexture(seed), emissiveMap: walnutTexture(seed, true), roughness: 0.46, metalness: 0, emissive: [0, 0, 0], fresnel: 0.08, fresnelColor: warm });
  cab.name = 'walnut';
  // everything else paints in a little of its own colour (k), mapped ones through their map
  const lit = (name, k, o) => { const m = new Material({ roughness: 0.6, ...o }); m.name = name; m.emissive = o.map ? [k, k, k] : m.color.map((c) => c * k); if (o.map) m.emissiveMap = o.map; return m; };
  const M = {
    // (the desk lamp stands a hand from the left one's face: a darker albedo and a near-matte finish keep that face satin black under
    // it, with a soft sheen rather than a pale wash; the painted-in light comes through the emissive map, which the colour doesn't touch)
    black: lit('black', 0.45, { color: [0.5, 0.5, 0.5], map: blackTexture(side), roughness: 0.93 }),
    metal: lit('metal', 0.42, { color: [1, 1, 1], map: tex.metal, roughness: 0.3, metalness: 0.85, fresnel: 0.22, fresnelColor: warm }),
    silk: lit('silk', 0.45, { color: color('#2a2521'), roughness: 0.36, metalness: 0.04, fresnel: 0.14, fresnelColor: warm }),
    cork: lit('cork', 0.4, { color: [1, 1, 1], map: corkTexture(seed + 5), roughness: 0.95 }),
  };
  const coneMat = lit('cone', 0.4, { color: [1, 1, 1], map: tex.cone, roughness: 0.52, fresnel: 0.08, fresnelColor: warm });
  const capMat = lit('cap', 0.45, { color: color('#17130f'), roughness: 0.42, metalness: 0.25, fresnel: 0.16, fresnelColor: warm });
  const own = (m) => { m.castShadow = false; m.pickable = true; m.userData = { ownerKey: node }; node.add(m); parts.push(m); return m; };
  const b = batch(), sat = () => T_SATIN, flip = [0, Math.PI, 0];

  const body = own(new Mesh(sleeve(), cab, 'speaker-cabinet')); body.castShadow = true;
  // the cork pad: only its edge ever shows
  const pad = plan(W - TUCK, D - TUCK, R - TUCK);
  b.put(grid(pad.concat({ ...pad[0], s: pad[pad.length - 1].s + Math.hypot(pad[0].p[0] - pad[pad.length - 1].p[0], pad[0].p[1] - pad[pad.length - 1].p[1]) }).map(({ p, n, s }) => [0, PAD].map((y) => ({ p: [p[0], y, p[1]], n: [n[0], 0, n[1]], t: [s / 2.4, y / 2.4] })))), M.cork);

  // ---------- the front. The baffle in three bands, each round its opening, joined edge to edge; the reveal inside the walnut frame
  const pa = PORT.a + PORT.f, pb = PORT.b + PORT.f, ray = (n) => Array.from({ length: n }, (_, i) => (i / n) * TAU);
  const YPW = (PORT.y + pb + WOOF.y - WOOF.hole) / 2, YWT = (WOOF.y + WOOF.hole + TWEET.y - TWEET.hole) / 2;
  b.put(holed(-BW, BW, YB0, YPW, 0, PORT.y, (a) => stadiumReach(pa, pb, a), stadium(pa, pb).map(({ p }) => Math.atan2(p[1], p[0])), ZB, 1, T_SATIN), M.black);
  b.put(holed(-BW, BW, YPW, YWT, 0, WOOF.y, () => WOOF.hole, ray(72), ZB, 1, T_SATIN), M.black);
  b.put(holed(-BW, BW, YWT, YB1, 0, TWEET.y, () => TWEET.hole, ray(48), ZB, 1, T_SATIN), M.black);
  for (const g of recess(-BW, BW, YB0, YB1, ZB, D, sat)) b.put(g, M.black);
  // the port: a quarter-round flare off the baffle into the throat, which darkens into the cabinet, and its far end
  {
    const ol = stadium(PORT.a, PORT.b), K = 4, rows = [], end = PORT.y, zEnd = ZB - PORT.depth;
    for (const { p, n } of [...ol, ol[0]]) {
      const row = [];
      for (let k = 0; k <= K; k++) { const al = (k / K) * (Math.PI / 2), o = PORT.f * (1 - Math.sin(al)), s = Math.sin(al), c = Math.cos(al); row.push({ p: [p[0] + n[0] * o, end + p[1] + n[1] * o, ZB - PORT.f * (1 - c)], n: [-n[0] * s, -n[1] * s, c], t: dark((0.25 * k) / K) }); }
      row.push({ p: [p[0], end + p[1], zEnd], n: [-n[0], -n[1], 0], t: dark(0.85) });
      rows.push(row);
    }
    b.put(grid(rows), M.black);
    b.put(fan([0, end, zEnd], ol.map(({ p }) => [p[0], end + p[1], zEnd]), [0, 0, 1], () => dark(1)), M.black);
  }
  // the woofer's trim ring, machined bronze, with four dark hex screws turned to wherever they stopped
  b.put(lathe(RING, 80, band(MB.bronze)), M.metal, [0, WOOF.y, ZB]);
  for (let i = 0; i < 4; i++) { const a = TAU / 8 + (i * TAU) / 4; b.put(lathe(SCREW, 12, screwUV), M.metal, [1.385 * Math.cos(a), WOOF.y + 1.385 * Math.sin(a), ZB + 0.068], [0, 0, rnd() * TAU]); }
  // the tweeter: the waveguide darkening toward the throat, its bronze ring, the silk dome on its roll
  b.put(lathe(GUIDE, 64, (f, j) => dark(0.04 + (0.2 * j) / (GUIDE.length - 1))), M.black, [0, TWEET.y, ZB]);
  b.put(lathe(TRING, 64, band(MB.bronze)), M.metal, [0, TWEET.y, ZB]);
  b.put(lathe(TROLL, 40, () => [0, 0]), M.silk, [0, TWEET.y, ZB]); b.put(lathe(TDOME, 40, () => [0, 0]), M.silk, [0, TWEET.y, ZB]);
  // the NG plate and the LED's bezel, side by side under the woofer (the LED toward the middle of the desk)
  const ledX = -side * LED_X;
  b.put(withUV(box(BADGE.w, BADGE.h, 0.03), (s, t) => cellUV(MC.badge, s, t)), M.metal, [0, BADGE.y, ZB + 0.015]);
  b.put(lathe(BEZEL, 24, cell(MC.dark)), M.metal, [ledX, BADGE.y, ZB]);

  // ---------- the back: the panel round the terminal pocket, the pocket, the printed plate (on the right speaker cut for the mains
  // inlet), its four screws, the binding posts
  const P = plateOf(side), rays = ray(48);
  for (const [x0, x1, y0, y1] of [[-BW, -CUP.x, YB0, YB1], [CUP.x, BW, YB0, YB1], [-CUP.x, CUP.x, YB0, CUP.y0], [-CUP.x, CUP.x, P.y1, YB1]]) b.put(quad([x0, y0, -ZB], [x1, y0, -ZB], [x1, y1, -ZB], [x0, y1, -ZB], [0, 0, -1], sat), M.black);
  for (const g of recess(-BW, BW, YB0, YB1, -D, -ZB, sat)) b.put(g, M.black);
  for (const g of recess(-CUP.x, CUP.x, CUP.y0, P.y1, ZP, -ZB, sat)) b.put(g, M.black);
  b.put(side > 0 ? holed(-CUP.x, CUP.x, CUP.y0, P.y1, 0, IEC.y, fig8, rays, ZP, -1, P.uv) : quad([-CUP.x, CUP.y0, ZP], [CUP.x, CUP.y0, ZP], [CUP.x, P.y1, ZP], [-CUP.x, P.y1, ZP], [0, 0, -1], P.uv), M.black);
  for (const [sx, y] of [[1, CUP.y0 + 0.13], [-1, CUP.y0 + 0.13], [1, P.y1 - 0.13], [-1, P.y1 - 0.13]]) b.put(lathe(SCREW, 12, screwUV), M.metal, [sx * (CUP.x - 0.13), y, ZP], [0, Math.PI, rnd() * TAU]);
  // red (+) on the inner post, where the lead comes in, black (−) on the outer
  for (const s of [-side, side]) {
    const at = [s * POST.x, POST.y, ZP];
    b.put(lathe(COLLAR, 20, cell(s === -side ? MC.red : MC.anod)), M.metal, at, flip);
    b.put(lathe(NUT, 20, band(MB.knurl)), M.metal, at, flip);
    b.put(lathe(TIP, 16, (f, j) => (j >= 6 ? cell(MC.anod)(f) : band(MB.gold)(f))), M.metal, at, flip);
  }
  if (side > 0) {
    // the amplifier's controls: a knurled knob on a bronze washer with a gold line at about one o'clock, and a rocker switch
    const at = [0, KNOB.y, ZP], ang = Math.PI / 6;
    b.put(lathe(WASHER, 40, band(MB.bronze)), M.metal, at, flip); b.put(lathe(GRIP, 40, band(MB.grip)), M.metal, at, flip); b.put(lathe(KTOP, 40, band(MB.black)), M.metal, at, flip);
    b.put(withUV(box(0.032, 0.17, 0.012), () => cell(MC.bright)(0.5)), M.metal, [-Math.sin(ang) * 0.17, KNOB.y + Math.cos(ang) * 0.17, ZP - 0.334], [0, 0, ang]);
    b.put(withUV(box(0.26, 0.42, 0.06), () => cell(MC.anod)(0.5)), M.metal, [-ROCKER, KNOB.y, ZP - 0.03]);
    b.put(withUV(roundedBox({ w: 0.2, h: 0.36, d: 0.08, r: 0.03, seg: 2 }), sat), M.black, [-ROCKER, KNOB.y, ZP - 0.07], [0.14, 0, 0]);
    // its inputs. The mains inlet: a satin bezel round the figure-8, the well behind it darkening to its floor, two nickel pins standing
    // in it short of the mouth (a lead's end sits in the well in front of them: `power`)
    const zf = ZP + IEC.depth, well = rays.map((a) => [Math.cos(a) * fig8(a), IEC.y + Math.sin(a) * fig8(a), zf]);
    b.put(between(0, IEC.y, fig8, bezel, rays, ZP - IEC.face, -1, T_SATIN), M.black);
    b.put(wall(0, IEC.y, bezel, rays, ZP - IEC.face, ZP + 0.005, 1, sat), M.black);
    b.put(wall(0, IEC.y, fig8, rays, ZP - IEC.face, zf, -1, (k) => dark(0.2 + 0.6 * k)), M.black);
    b.put(fan([0, IEC.y, zf], well, [0, 0, -1], () => dark(0.9)), M.black);
    for (const s of [-1, 1]) b.put(lathe(PIN, 14, cell(MC.nickel)), M.metal, [s * IEC.e, IEC.y, zf], flip);
    // the AUX jack: a nickel nut on the plate and the barrel through it, round the dark 3.5 mm hole (`aux`: a plug's end in it)
    b.put(lathe(JNUT, 24, cell(MC.nickel)), M.metal, [AUX.x, AUX.y, ZP], flip);
    b.put(lathe(JACK, 24, (f, j) => (j >= 5 ? cell(MC.anod)(f) : cell(MC.nickel)(f))), M.metal, [AUX.x, AUX.y, ZP], flip);
  }
  for (const [mat, list] of b.parts) own(new Mesh(merge(list), mat, 'speaker-' + mat.name));

  // ---------- the moving parts: cone and surround as one, the dust cap; the LED
  const cone = own(new Mesh(merge([
    { geo: lathe(FLANGE, 56, () => [0.54, 0.5]) },
    { geo: lathe(ROLL, 56, (f, j) => [0.54 + (0.42 * j) / (ROLL.length - 1), 0.5]) },
    { geo: lathe(CONE, 56, (f, j, x, y) => [0.25 + (x / 1.04) * 0.24, 0.5 + (y / 1.04) * 0.48]) },
  ]), coneMat, 'speaker-cone'));
  cone.position = [0, WOOF.y, ZB];
  const cap = own(new Mesh(lathe(CAP, 40, () => [0, 0]), capMat, 'speaker-cap')); cap.position = [0, WOOF.y, ZB];
  const led = own(new Mesh(sphere(0.052, 16, 10), new Material({ color: [0.05, 0.03, 0.02], emissive: color('#ffb066'), emissiveIntensity: 0.08, unlit: true, receiveShadow: false }), 'speaker-led'));
  led.position = [ledX, BADGE.y, ZB + 0.006]; led.scale = [1, 1, 0.6];
  return {
    node, parts, cab, cone, cap, led, dimmable: [...Object.values(M), coneMat, capMat], plug: [-side * POST.x, POST.y, ZP - 0.28],
    power: side > 0 ? [0, IEC.y, ZP + 0.02] : null, aux: side > 0 ? [AUX.x, AUX.y, ZP - 0.09] : null,
  };
}
