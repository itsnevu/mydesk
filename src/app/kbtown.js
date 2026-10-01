// The keyboard's districts, built so each one reads as what it stands for. The Blender shells (the stone steps a district
// stands on) stay; what stands on them is made here. The client street is thirteen shops, one per live client site, each
// with its trade on the roof (glasses over the optician, a ship over the model maker, a flying elephant over Gajah Terbang)
// and its name over the door; point at one and it names itself, click it and its project page opens.
// Units are the keyboard's own (1 = one key pitch); y = 0 is the plate the removed caps stood on, the district's origin.
import { Node, Mesh, Material, Texture } from 'engine/scene';
import { box, cylinder, sphere, cone, torus, merge } from 'engine/geometry';
import { MONO, SANS } from 'engine/textures';
import { color, M4 } from 'engine/math';
import { flatten, atlasMerge } from 'app/bake';
import { projectByKey, WORLDS } from 'app/data';

// ---------- shared pieces
const mats = new Map();
const M = (key, o) => { if (!mats.has(key)) mats.set(key, new Material(o)); return mats.get(key); };
// (three roughnesses and two metalnesses only: the merge draws one palette mesh per pair, so fewer pairs are fewer draws)
const plain = (hex, rough = 0.85, metal = 0) => { const r = rough < 0.5 ? 0.4 : rough < 0.8 ? 0.7 : 0.9, mt = metal > 0.2 ? 0.4 : 0; return M(`p:${hex}:${r}:${mt}`, { color: color(hex), roughness: r, metalness: mt }); };
// one warm glow for every lit pane, lantern and screen that is not a lamp bulb (one draw for all of them in a district)
const GLOW = () => M('glow', { color: [1, 0.8, 0.5], emissive: color('#ffc98a'), emissiveIntensity: 1.2, roughness: 0.4 });
// brass and dark bronze shine the same way, so they share one palette draw (their colours differ in the palette)
const BRASS = () => M('brass', { color: [0.4342, 0.2542, 0.0844], roughness: 0.4, metalness: 0.8 });
const BRONZE = () => M('bronzeDark', { color: [0.0742, 0.0395, 0.016], roughness: 0.4, metalness: 0.8 });
const LAMP = () => M('lamp', { color: [1, 0.6724, 0.3663], emissive: [1, 0.6724, 0.3663], emissiveIntensity: 5, roughness: 0.3 });
const FOLIAGE = ['#56603a', '#66703e', '#4a5236', '#7a8446'];
export const HIT = new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false });

function put(parent, geo, mat, pos, rot, scale) {
  const m = new Mesh(geo, mat); m.position = pos; if (rot) m.rotation = rot; if (scale) m.scale = scale; parent.add(m); return m;
}
// several primitives in one geometry (one material, one draw): [[geo, pos, rot, scale], ...]
function fuse(list) {
  return merge(list.map(([geo, pos, rot, s]) => { const m = M4.compose(M4.create(), pos || [0, 0, 0], rot || [0, 0, 0], s || [1, 1, 1]); return { geo, m, n: M4.normalFromMat4(new Float32Array(9), m) }; }));
}
// a flat rectangle facing +z whose texture is one cell of an atlas (uv: [u0, v0, u1, v1], v up)
function panel(w, h, uv) {
  const [u0, v0, u1, v1] = uv;
  return { positions: new Float32Array([-w / 2, -h / 2, 0, w / 2, -h / 2, 0, w / 2, h / 2, 0, -w / 2, h / 2, 0]), normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
    uvs: new Float32Array([u0, v0, u1, v0, u1, v1, u0, v1]), indices: new Uint16Array([0, 1, 2, 0, 2, 3]), bounds: { min: [-w / 2, -h / 2, 0], max: [w / 2, h / 2, 0.001] } };
}
// an invisible click volume between two corners
function hitBox(parent, min, max, data = {}) {
  const h = new Mesh(box(max[0] - min[0], max[1] - min[1], max[2] - min[2]), HIT, 'hit-part');
  h.position = [0, 1, 2].map((k) => (min[k] + max[k]) / 2); h.castShadow = false; h.pickable = true; h.userData = data; parent.add(h); return h;
}
function person(parent, hex, pos, s = 1) {
  return put(parent, fuse([[cylinder(0.011, 0.014, 0.05, 6), [0, 0.025, 0]], [sphere(0.011, 6, 4), [0, 0.063, 0]]]), plain(hex, 0.8), pos, null, [s, s, s]);
}
function lampPost(parent, pos, h = 0.13) {
  put(parent, cylinder(0.004, 0.006, h, 6), BRONZE(), [pos[0], pos[1] + h / 2, pos[2]]);
  put(parent, sphere(0.011, 8, 6), LAMP(), [pos[0], pos[1] + h + 0.006, pos[2]]).castShadow = false;
}
function bush(parent, pos, s = 1, seed = 0) {
  put(parent, sphere(0.03 * s, 7, 5), plain(FOLIAGE[((Math.floor(seed) % 4) + 4) % 4], 0.85), [pos[0], pos[1] + 0.022 * s, pos[2]], null, [1, 0.8, 1]);
}

// ---------- a texture atlas drawn once: every shop front, the billboard and the street sign in one image (one material, one draw)
const PPU = 640;   // canvas pixels per keyboard unit
function atlas(cells, draw, maxW = 1536) {
  let x = 0, y = 0, rowH = 0, W = 0; const pad = 6;
  for (const c of cells) {
    c.pw = Math.round(c.w * PPU); c.ph = Math.round(c.h * PPU);
    if (x + c.pw > maxW) { x = 0; y += rowH + pad; rowH = 0; }
    c.px = x; c.py = y; x += c.pw + pad; rowH = Math.max(rowH, c.ph); W = Math.max(W, x);
  }
  const H = y + rowH;
  const make = (glow) => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
    ctx.fillStyle = glow ? '#000' : '#fff'; ctx.fillRect(0, 0, W, H);
    for (const c of cells) { ctx.save(); ctx.beginPath(); ctx.rect(c.px, c.py, c.pw, c.ph); ctx.clip(); ctx.translate(c.px, c.py); draw(ctx, c, c.pw, c.ph, glow); ctx.restore(); }
    return new Texture(cv, glow ? { srgb: false } : {});
  };
  for (const c of cells) c.uv = [c.px / W, 1 - (c.py + c.ph) / H, (c.px + c.pw) / W, 1 - c.py / H];
  return { map: make(false), emissiveMap: make(true) };
}
function fit(ctx, text, maxW, size, weight = 700, font = SANS, spacing = 1) {
  let s = size; const set = () => { ctx.font = `${weight} ${s}px ${font}`; ctx.letterSpacing = `${spacing}px`; };
  set(); while (ctx.measureText(text).width > maxW && s > 7) { s -= 1; set(); }
  return s;
}

// ---------- the client street
// The three stone steps of the old market (from the Blender shell): the back one is the highest, so the tall roofs there show
// over the two rows in front. Each row: the step's top (y), its x extent, its back edge (z0) and its shops, left to right.
const STEPS = [
  { y: 0.16, x0: -0.63, x1: 1.38, z0: -1.5 },
  { y: 0.08, x0: -1.38, x1: 0.63, z0: -0.5 },
  { y: 0.03, x0: -0.88, x1: 1.13, z0: 0.5 },
];
const SHOPS = [
  [
    { key: 'recon', sign: ['RECON'], w: 0.42, h: 0.5, wall: '#4d4a3f', awn: '#6b5a48', trade: 'dish' },
    { key: 'airon', sign: ['AIRON'], w: 0.42, h: 0.46, wall: '#2a2420', awn: '#8e6a3d', trade: 'orb' },
    { key: 'rameinaja', sign: ['RAMEINAJA'], w: 0.44, h: 0.48, wall: '#7a3f22', awn: '#d9a05b', trade: 'billboard' },
    { key: 'gajah-terbang-kreatif', sign: ['GAJAH TERBANG'], w: 0.55, h: 0.58, wall: '#c9b48a', awn: '#4d3822', trade: 'elephant' },
  ],
  [
    { key: 'nf-optical', sign: ['NF OPTICAL'], w: 0.46, h: 0.4, wall: '#d6c7ab', awn: '#2e2418', trade: 'glasses' },
    { key: 'yukti-rasa-mitrabumi', sign: ['YUKTI RASA'], w: 0.46, h: 0.42, wall: '#6f6a4a', awn: '#b8622c', trade: 'flask' },
    { key: 'orthobone', sign: ['ORTHOBONE'], w: 0.46, h: 0.38, wall: '#e7ddc8', awn: '#4a5236', trade: 'cross' },
    { key: 'izzi', sign: ['IZZI'], w: 0.45, h: 0.4, wall: '#8a5a34', awn: '#e7ddc8', trade: 'bag' },
  ],
  [
    { key: 'flora-indonesia', sign: ['FLORA'], w: 0.358, h: 0.32, wall: '#e9dfcd', awn: '#66703e', trade: 'flower' },
    { key: 'dams-garage', sign: ['DAMS GARAGE'], w: 0.358, h: 0.3, wall: '#2b2520', awn: '#b8622c', trade: 'garage' },
    { key: 'gracia-box', sign: ['GRACIA BOX'], w: 0.358, h: 0.3, wall: '#a8865a', awn: '#4d3822', trade: 'boxes' },
    { key: 'winfaith', sign: ['WINFAITH'], w: 0.358, h: 0.34, wall: '#5a4330', awn: '#2e2418', trade: 'factory' },
    { key: 'miniatur-kapal', sign: ['MINIATUR', 'KAPAL'], w: 0.358, h: 0.3, wall: '#4a4a40', awn: '#d6c7ab', trade: 'ship' },
  ],
];
const DEPTH = 0.4, GAP = 0.04;

// a shop front: cornice, a lit sign board with the name, the upper windows on a two-storey shop, the shop window with the trade
// in it (or a roller door on the garage), a door, a plinth. The glow pass draws only what gives light: the sign letters and the
// lit glass, with the goods in the window as shadows against it.
function drawFront(ctx, c, W, H, glow) {
  const s = c.shop, two = s.h >= 0.44;
  const fx = (f) => f * W, fy = (f) => f * H;
  if (!glow) {
    ctx.fillStyle = s.wall; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.07)'; for (let y = fy(0.1); y < H; y += Math.max(6, H / 16)) ctx.fillRect(0, y, W, 1.5);   // courses
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, fy(0.055)); ctx.fillStyle = 'rgba(255,240,215,0.18)'; ctx.fillRect(0, fy(0.055), W, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, H - fy(0.045), W, fy(0.045));
  }
  // the sign board
  const sy0 = fy(two ? 0.075 : 0.085), sy1 = fy(two ? 0.205 : 0.27), sx = fx(0.07);
  if (!glow) { ctx.fillStyle = '#1b130c'; ctx.fillRect(sx, sy0, W - 2 * sx, sy1 - sy0); ctx.strokeStyle = '#b08a52'; ctx.lineWidth = 2; ctx.strokeRect(sx + 1, sy0 + 1, W - 2 * sx - 2, sy1 - sy0 - 2); }
  ctx.fillStyle = glow ? '#ffdcaa' : '#f1e2c8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lines = s.sign, lh = (sy1 - sy0) / lines.length;
  const size = Math.min(...lines.map((l) => fit(ctx, l, W - 2 * sx - 12, Math.min(lh * 0.74, 40), 700, SANS, 1)));
  ctx.font = `700 ${size}px ${SANS}`; lines.forEach((l, i) => ctx.fillText(l, W / 2, sy0 + lh * (i + 0.54)));
  // upper windows
  if (two) {
    const n = s.w > 0.5 ? 3 : 2, ww = W * (n === 3 ? 0.2 : 0.26), gap = (W - n * ww) / (n + 1), y0 = fy(0.27), wh = fy(0.17);
    for (let i = 0; i < n; i++) {
      const x = gap + i * (ww + gap), lit = (i + s.w * 10) % 3 !== 1;
      if (!glow) { ctx.fillStyle = '#21160d'; ctx.fillRect(x - 3, y0 - 3, ww + 6, wh + 6); }
      ctx.fillStyle = lit ? (glow ? '#c98a44' : '#f0c27e') : (glow ? '#000' : '#2a1d12'); ctx.fillRect(x, y0, ww, wh);
      if (!glow) { ctx.fillStyle = '#21160d'; ctx.fillRect(x + ww / 2 - 1, y0, 2, wh); }
    }
  }
  // the ground floor
  const gy0 = fy(two ? 0.55 : 0.36), gy1 = fy(0.93);
  if (s.trade === 'garage') {
    const dx0 = fx(0.08), dx1 = fx(0.92), open = gy0 + (gy1 - gy0) * 0.62;
    if (!glow) { ctx.fillStyle = '#7d6e5c'; ctx.fillRect(dx0, gy0, dx1 - dx0, open - gy0); ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = gy0 + 4; y < open; y += 5) ctx.fillRect(dx0, y, dx1 - dx0, 1.5); }
    ctx.fillStyle = glow ? '#e0a050' : '#f4c47e'; ctx.fillRect(dx0, open, dx1 - dx0, gy1 - open);
    if (!glow) { ctx.fillStyle = '#21160d'; ctx.fillRect(dx0, open - 2, dx1 - dx0, 3); }
    return;
  }
  const doorW = W * 0.2, doorLeft = (s.w * 100) % 2 < 1, dx = doorLeft ? fx(0.07) : W - fx(0.07) - doorW;
  const wx0 = doorLeft ? dx + doorW + fx(0.05) : fx(0.07), wx1 = doorLeft ? W - fx(0.07) : dx - fx(0.05);
  if (!glow) { ctx.fillStyle = '#21160d'; ctx.fillRect(wx0 - 3, gy0 - 3, wx1 - wx0 + 6, gy1 - gy0 + 6); ctx.fillRect(dx - 2, gy0 - 2, doorW + 4, gy1 - gy0 + 2); }
  ctx.fillStyle = glow ? '#d99448' : '#f6cb86'; ctx.fillRect(wx0, gy0, wx1 - wx0, gy1 - gy0);
  ctx.fillStyle = glow ? '#7a4c1e' : '#b98a52'; ctx.fillRect(dx + 3, gy0 + 3, doorW - 6, fy(0.07));   // the lit transom over the door
  if (!glow) { ctx.fillStyle = '#3a2716'; ctx.fillRect(dx + 3, gy0 + 3 + fy(0.08), doorW - 6, gy1 - gy0 - fy(0.08) - 3); ctx.fillStyle = '#b08a52'; ctx.fillRect(doorLeft ? dx + doorW - 9 : dx + 5, (gy0 + gy1) / 2, 4, 4); }
  // the goods, as shapes against the lit glass
  ctx.fillStyle = glow ? '#000' : '#5a3a1e'; ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = Math.max(2, W * 0.012);
  const gw = wx1 - wx0, gh = gy1 - gy0, gx = (f) => wx0 + f * gw, gyy = (f) => gy0 + f * gh;
  ctx.fillRect(wx0, gyy(0.82), gw, gh * 0.18);   // the counter / display shelf
  const circle = (x, y, r, fill = true) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); fill ? ctx.fill() : ctx.stroke(); };
  switch (s.trade) {
    case 'flower': for (let i = 0; i < 4; i++) { const x = gx(0.16 + i * 0.22); ctx.fillRect(x - 2, gyy(0.5), 3, gh * 0.32); circle(x, gyy(0.46), gh * 0.09); } break;
    case 'glasses': for (let i = 0; i < 2; i++) { const x = gx(0.3 + i * 0.4); circle(x - gw * 0.07, gyy(0.5), gh * 0.1, false); circle(x + gw * 0.07, gyy(0.5), gh * 0.1, false); } break;
    case 'flask': for (let i = 0; i < 4; i++) { const x = gx(0.15 + i * 0.23); ctx.fillRect(x - gw * 0.04, gyy(0.5), gw * 0.08, gh * 0.32); ctx.fillRect(x - gw * 0.015, gyy(0.38), gw * 0.03, gh * 0.12); } break;
    case 'cross': ctx.fillRect(gx(0.45), gyy(0.2), gw * 0.1, gh * 0.5); ctx.fillRect(gx(0.32), gyy(0.38), gw * 0.36, gh * 0.14); break;
    case 'bag': for (let i = 0; i < 3; i++) { const x = gx(0.2 + i * 0.3); ctx.fillRect(x - gw * 0.08, gyy(0.45), gw * 0.16, gh * 0.37); ctx.beginPath(); ctx.arc(x, gyy(0.45), gw * 0.05, Math.PI, 0); ctx.stroke(); } break;
    case 'boxes': for (let i = 0; i < 3; i++) for (let j = 0; j <= (i % 2); j++) ctx.fillRect(gx(0.12 + i * 0.28), gyy(0.6 - j * 0.24), gw * 0.22, gh * 0.22); break;
    case 'ship': ctx.beginPath(); ctx.moveTo(gx(0.15), gyy(0.62)); ctx.lineTo(gx(0.85), gyy(0.62)); ctx.lineTo(gx(0.75), gyy(0.78)); ctx.lineTo(gx(0.25), gyy(0.78)); ctx.fill(); ctx.fillRect(gx(0.49), gyy(0.15), 3, gh * 0.48); ctx.beginPath(); ctx.moveTo(gx(0.52), gyy(0.18)); ctx.lineTo(gx(0.75), gyy(0.55)); ctx.lineTo(gx(0.52), gyy(0.55)); ctx.fill(); break;
    case 'factory': for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(gx(0.22 + i * 0.28), gyy(0.55), gh * 0.13, 0, Math.PI * 2); ctx.stroke(); } break;
    default: for (let i = 0; i < 3; i++) ctx.fillRect(gx(0.12 + i * 0.3), gyy(0.4 + (i % 2) * 0.12), gw * 0.18, gh * 0.42 - (i % 2) * gh * 0.12);
  }
  // mullions over everything
  if (!glow) { ctx.fillStyle = '#21160d'; ctx.fillRect((wx0 + wx1) / 2 - 1.5, gy0, 3, gy1 - gy0); }
}
function drawBillboard(ctx, c, W, H, glow) {
  if (!glow) { ctx.fillStyle = '#efe4cf'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#b8622c'; ctx.fillRect(0, 0, W * 0.3, H); }
  // a megaphone, then the name
  ctx.fillStyle = glow ? '#3a2410' : '#efe4cf'; ctx.beginPath(); ctx.moveTo(W * 0.06, H * 0.42); ctx.lineTo(W * 0.16, H * 0.42); ctx.lineTo(W * 0.25, H * 0.2); ctx.lineTo(W * 0.25, H * 0.8); ctx.lineTo(W * 0.16, H * 0.58); ctx.lineTo(W * 0.06, H * 0.58); ctx.fill();
  ctx.fillStyle = glow ? '#3a2410' : '#2b1a10'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const s = fit(ctx, 'RAMEINAJA', W * 0.64, H * 0.46, 700, SANS, 1); ctx.font = `700 ${s}px ${SANS}`; ctx.fillText('RAMEINAJA', W * 0.33, H * 0.42);
  ctx.font = `500 ${Math.round(s * 0.42)}px ${MONO}`; ctx.letterSpacing = '2px'; ctx.fillStyle = glow ? '#20140a' : '#8a5a34'; ctx.fillText('DIGITAL MARKETING', W * 0.335, H * 0.76);
}
function drawLotSign(ctx, c, W, H, glow) {
  if (!glow) { ctx.fillStyle = '#efe4cf'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#b8622c'; ctx.fillRect(0, 0, W, H * 0.12); ctx.fillRect(0, H * 0.88, W, H * 0.12); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = glow ? '#3a2410' : '#2b1a10'; const s = fit(ctx, 'YOUR SITE HERE', W * 0.86, H * 0.36, 700, SANS, 1); ctx.font = `700 ${s}px ${SANS}`; ctx.fillText('YOUR SITE HERE', W / 2, H * 0.42);
  ctx.fillStyle = glow ? '#20140a' : '#8a5a34'; const s2 = fit(ctx, 'THIS LOT IS FREE · SAY HELLO', W * 0.86, H * 0.16, 500, MONO, 2); ctx.font = `500 ${s2}px ${MONO}`; ctx.fillText('THIS LOT IS FREE · SAY HELLO', W / 2, H * 0.7);
}
function drawStreetSign(ctx, c, W, H, glow) {
  if (!glow) { ctx.fillStyle = '#1b130c'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = '#b08a52'; ctx.lineWidth = 3; ctx.strokeRect(3, 3, W - 6, H - 6); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = glow ? '#ffd29a' : '#f1e2c8'; const s = fit(ctx, 'CLIENT WEBSITES', W * 0.86, H * 0.36, 700, SANS, 2); ctx.font = `700 ${s}px ${SANS}`; ctx.fillText('CLIENT WEBSITES', W / 2, H * 0.4);
  ctx.fillStyle = glow ? '#a8682a' : '#d9a05b'; ctx.font = `500 ${Math.round(s * 0.5)}px ${MONO}`; ctx.letterSpacing = '3px'; ctx.fillText('13 LIVE SITES, EVERY SHOP IS REAL', W / 2, H * 0.74);
}

// each trade on its shop's roof (origin: the roof's centre), built small and in the room's palette
function trade(g, s, top, live) {
  const w = s.w, d = DEPTH;
  switch (s.trade) {
    case 'dish': {   // tech research: a dish and a mast with a red light
      put(g, cylinder(0.008, 0.01, 0.07, 6), BRONZE(), [-0.06, top + 0.035, 0]);
      put(g, sphere(0.07, 14, 7, 0), plain('#e7ddc8', 0.5), [-0.06, top + 0.09, 0.01], [-0.9, 0.3, 0], [1, 0.32, 1]);
      put(g, cylinder(0.003, 0.003, 0.06, 4), BRONZE(), [-0.06, top + 0.11, 0.04], [-0.9, 0, 0]);
      put(g, cylinder(0.004, 0.006, 0.22, 5), BRONZE(), [0.13, top + 0.11, -0.08]);
      put(g, sphere(0.008, 6, 4), M('beacon', { color: [1, 0.2, 0.08], emissive: [1, 0.12, 0.04], emissiveIntensity: 4 }), [0.13, top + 0.225, -0.08]).castShadow = false;
      break;
    }
    case 'orb': {    // the AI platform: a lit core turning inside a brass ring, on a plinth
      put(g, box(0.1, 0.03, 0.1), plain('#3b2b1d', 0.6), [0, top + 0.015, 0]);
      const orb = new Node('orb'); orb.position = [0, top + 0.12, 0]; orb.userData.dynamic = true; g.add(orb);
      put(orb, sphere(0.045, 4, 2), M('orb', { color: [1, 0.85, 0.6], emissive: color('#ffcf8a'), emissiveIntensity: 2.4, roughness: 0.2 }), [0, 0, 0]).castShadow = false;
      put(orb, torus(0.07, 0.005, 24, 4), BRASS(), [0, 0, 0], [1.2, 0, 0.3]);
      live.push((t) => { orb.rotation[1] = t * 0.8; orb.position[1] = top + 0.12 + Math.sin(t * 1.6) * 0.01; });
      break;
    }
    case 'billboard': {   // marketing: a billboard on legs over the roof
      put(g, box(0.006, 0.12, 0.006), BRONZE(), [-0.13, top + 0.06, -0.05]); put(g, box(0.006, 0.12, 0.006), BRONZE(), [0.13, top + 0.06, -0.05]);
      put(g, box(0.36, 0.15, 0.012), plain('#2b1a10', 0.7), [0, top + 0.18, -0.05]);
      put(g, panel(0.34, 0.13, s.board.uv), s.atlasMat, [0, top + 0.18, -0.043]).castShadow = false;
      break;
    }
    case 'elephant': {   // Gajah Terbang Kreatif: an elephant with wings, flying over the roof
      const e = new Node('elephant'); e.position = [0, top + 0.17, 0]; e.userData.dynamic = true; g.add(e);
      const body = fuse([
        [sphere(0.06, 12, 8), [0, 0, 0], null, [1.3, 1, 1]], [sphere(0.042, 10, 7), [0.085, 0.03, 0]],
        [cylinder(0.012, 0.016, 0.05, 6), [0.125, 0.0, 0], [0, 0, 0.5]], [cylinder(0.009, 0.012, 0.04, 6), [0.14, -0.04, 0], [0, 0, -0.2]],
        [cylinder(0.014, 0.014, 0.05, 6), [0.04, -0.06, 0.03]], [cylinder(0.014, 0.014, 0.05, 6), [0.04, -0.06, -0.03]],
        [cylinder(0.014, 0.014, 0.05, 6), [-0.045, -0.06, 0.03]], [cylinder(0.014, 0.014, 0.05, 6), [-0.045, -0.06, -0.03]],
        [cylinder(0.003, 0.004, 0.04, 4), [-0.085, 0.0, 0], [0, 0, 1.0]],
      ]);
      put(e, body, plain('#b3a58e', 0.7), [0, 0, 0]);
      const wings = fuse([[sphere(0.05, 10, 4), [0.0, 0.05, 0.05], [0.5, 0, 0.2], [0.9, 0.12, 1.4]], [sphere(0.05, 10, 4), [0.0, 0.05, -0.05], [-0.5, 0, 0.2], [0.9, 0.12, 1.4]]]);
      put(e, wings, plain('#efe4cf', 0.6), [0, 0, 0]);
      e.rotation[1] = -0.5;
      put(g, cylinder(0.004, 0.004, 0.11, 5), BRONZE(), [0, top + 0.055, 0]);
      live.push((t) => { e.position[1] = top + 0.17 + Math.sin(t * 1.3) * 0.012; e.rotation[2] = Math.sin(t * 1.3 + 0.6) * 0.06; });
      break;
    }
    case 'glasses': {   // the optician: a giant pair of spectacles on two posts
      const fr = plain('#1c1712', 0.4, 0.3);
      put(g, fuse([[torus(0.045, 0.007, 20, 6), [-0.058, 0, 0], [Math.PI / 2, 0, 0]], [torus(0.045, 0.007, 20, 6), [0.058, 0, 0], [Math.PI / 2, 0, 0]],
        [box(0.03, 0.007, 0.007), [0, 0.012, 0]], [box(0.007, 0.007, 0.09), [-0.104, 0.012, -0.045]], [box(0.007, 0.007, 0.09), [0.104, 0.012, -0.045]]]), fr, [0, top + 0.1, 0.06]);
      put(g, fuse([[sphere(0.042, 10, 6), [-0.058, 0, 0], null, [1, 1, 0.12]], [sphere(0.042, 10, 6), [0.058, 0, 0], null, [1, 1, 0.12]]]), GLOW(), [0, top + 0.1, 0.06]);
      put(g, box(0.006, 0.06, 0.006), BRONZE(), [-0.06, top + 0.03, 0.04]); put(g, box(0.006, 0.06, 0.006), BRONZE(), [0.06, top + 0.03, 0.04]);
      break;
    }
    case 'flask': {   // flavour & fragrance: a perfume bottle with a brass cap
      put(g, fuse([[sphere(0.05, 12, 8), [0, 0.05, 0], null, [1, 1.05, 0.7]], [cylinder(0.013, 0.015, 0.03, 8), [0, 0.11, 0]]]), GLOW(), [0.04, top, -0.02]);
      put(g, cylinder(0.02, 0.02, 0.025, 8), BRASS(), [0.04, top + 0.135, -0.02]);
      put(g, fuse([[sphere(0.022, 8, 6), [0, 0.03, 0]], [cone(0.02, 0.035, 8), [0, 0.06, 0]]]), plain('#b8622c', 0.5), [-0.12, top, 0.04]);
      break;
    }
    case 'cross': {   // medical: a lit cross on a bracket off the corner, and one on the roof
      const lit = GLOW();
      put(g, fuse([[box(0.03, 0.1, 0.02)], [box(0.1, 0.03, 0.02)]]), lit, [0, top + 0.08, 0]);
      put(g, box(0.006, 0.04, 0.006), BRONZE(), [0, top + 0.02, 0]);
      put(g, box(0.05, 0.006, 0.006), BRONZE(), [w / 2 + 0.02, top - 0.05, d / 2 - 0.02]);
      put(g, fuse([[box(0.016, 0.05, 0.012)], [box(0.05, 0.016, 0.012)]]), lit, [w / 2 + 0.04, top - 0.08, d / 2 - 0.02]);
      break;
    }
    case 'bag': {   // the lifestyle brand: a shopping bag with a rope handle
      put(g, box(0.1, 0.11, 0.045), plain('#efe4cf', 0.8), [0, top + 0.055, 0]);
      put(g, torus(0.026, 0.004, 12, 4, Math.PI), BRASS(), [0, top + 0.11, 0], [-Math.PI / 2, 0, 0]);
      put(g, box(0.07, 0.08, 0.04), plain('#b8622c', 0.8), [0.1, top + 0.04, 0.02], [0, 0.4, 0]);
      break;
    }
    case 'flower': {   // the florist: a big bloom on the roof
      put(g, cylinder(0.005, 0.006, 0.1, 5), plain('#4a5236', 0.8), [0, top + 0.05, 0]);
      const pet = [];
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; pet.push([sphere(0.03, 8, 6), [Math.cos(a) * 0.035, 0, Math.sin(a) * 0.035], null, [1, 0.45, 1]]); }
      put(g, fuse(pet), plain('#c96f3f', 0.6), [0, top + 0.115, 0], [0.5, 0, 0]);
      put(g, sphere(0.02, 8, 6), plain('#e9b65a', 0.5), [0, top + 0.12, 0.012]);
      put(g, fuse([[sphere(0.025, 6, 4), [-0.02, 0, 0], null, [1.4, 0.3, 0.6]], [sphere(0.025, 6, 4), [0.02, 0, 0], null, [1.4, 0.3, 0.6]]]), plain('#66703e', 0.8), [0, top + 0.06, 0]);
      break;
    }
    case 'garage': {   // premium car care: a polisher's lamp on the roof edge
      put(g, box(0.18, 0.025, 0.05), plain('#1c1712', 0.4, 0.3), [0, top + 0.012, 0.1]);
      put(g, box(0.16, 0.012, 0.012), LAMP(), [0, top + 0.03, 0.12]).castShadow = false;
      break;
    }
    case 'boxes': {   // packaging: a stack of cartons on the roof
      const kraft = plain('#a8865a', 0.9), tape = plain('#5c4a3a', 0.9);
      for (const [x, y, z, sz, r] of [[-0.07, 0, -0.03, 0.08, 0.1], [0.03, 0, -0.04, 0.09, -0.05], [-0.03, 0.08, -0.035, 0.075, 0.3], [0.11, 0, 0.04, 0.06, 0.4]]) {
        put(g, box(sz, sz, sz), kraft, [x, top + y + sz / 2, z], [0, r, 0]); put(g, box(sz + 0.002, 0.006, sz * 0.3), tape, [x, top + y + sz + 0.001, z], [0, r, 0]);
      }
      break;
    }
    case 'factory': {   // industrial manufacturing: a saw-tooth roof and a chimney
      for (let i = 0; i < 3; i++) { put(g, gable(0.3, 0.07, w * 0.3), plain('#3b2b1d', 0.8), [-w * 0.32 + i * w * 0.32, top - 0.02, -0.02], [0, Math.PI / 2, 0]); put(g, box(w * 0.18, 0.03, 0.004), GLOW(), [-w * 0.32 + i * w * 0.32, top + 0.005, 0.131]); }
      put(g, cylinder(0.022, 0.028, 0.24, 10), plain('#6b4f36', 0.9), [w * 0.36, top + 0.12, -0.1]);
      put(g, cylinder(0.026, 0.026, 0.012, 10), BRONZE(), [w * 0.36, top + 0.236, -0.1]);
      const puffs = [];
      const smoke = M('smoke', { color: [0.55, 0.5, 0.45], opacity: 0.32, transparent: true, depthWrite: false, roughness: 1 });
      for (let i = 0; i < 3; i++) { const p = put(g, sphere(0.022, 8, 6), smoke, [w * 0.36, top + 0.26, -0.1]); p.castShadow = false; p.userData.dynamic = true; puffs.push(p); }
      live.push((t) => { puffs.forEach((p, i) => { const k = (t * 0.22 + i / 3) % 1; p.position[1] = top + 0.26 + k * 0.2; p.position[0] = w * 0.36 + k * 0.05; const sc = 0.6 + k * 1.3; p.scale = [sc, sc, sc]; }); });
      break;
    }
    case 'ship': {   // the ship-model maker: a sailing ship on the roof
      const shipG = new Node('ship'); shipG.position = [0, top + 0.03, 0]; g.add(shipG);
      put(shipG, fuse([[box(0.2, 0.035, 0.06)], [cone(0.03, 0.06, 4), [0.125, 0, 0], [0, 0, -Math.PI / 2], [1, 1, 0.7]]]), plain('#4a2e1c', 0.6), [0, 0.018, 0]);
      put(shipG, box(0.17, 0.006, 0.05), plain('#8e6a3d', 0.7), [0, 0.038, 0]);
      for (const x of [-0.05, 0.035]) { put(shipG, cylinder(0.003, 0.003, 0.15, 4), BRONZE(), [x, 0.11, 0]); put(shipG, box(0.06, 0.08, 0.004), plain('#efe4cf', 0.9), [x + 0.003, 0.11, 0.004]); }
      put(shipG, box(0.02, 0.012, 0.002), plain('#b8622c', 0.8), [-0.04, 0.18, 0]);
      put(g, box(0.05, 0.03, 0.03), BRONZE(), [0, top + 0.015, 0]);
      shipG.rotation[1] = 0.25;
      break;
    }
  }
}

/** The client street on the market's stone steps: the parts to merge, the moving ones, and each shop with its click volume. */
function clientRow() {
  const root = new Node('client-row'), live = [], shops = [];
  // the shop fronts, the billboard and the street sign share one texture
  const cells = [];
  for (const row of SHOPS) for (const s of row) cells.push({ w: s.w, h: s.h, shop: s, draw: drawFront });
  const board = { w: 0.34, h: 0.13, draw: drawBillboard }, street = { w: 0.5, h: 0.15, draw: drawStreetSign }, lotSign = { w: 0.44, h: 0.16, draw: drawLotSign };
  cells.push(board, street, lotSign);
  const tex = atlas(cells, (ctx, c, W, H, glow) => c.draw(ctx, c, W, H, glow));
  const atlasMat = new Material({ color: [1, 1, 1], map: tex.map, emissiveMap: tex.emissiveMap, emissive: color('#ffc27a'), emissiveIntensity: 1.5, roughness: 0.7 });
  SHOPS.forEach((row, ri) => {
    const st = STEPS[ri], used = row.reduce((a, s) => a + s.w, 0) + GAP * (row.length - 1);
    let x = (st.x0 + st.x1) / 2 - used / 2;
    const zb = st.z0 + 0.06, zf = zb + DEPTH, y = st.y;
    // the pavement along the fronts, and the kerb
    put(root, box(st.x1 - st.x0 - 0.04, 0.008, 0.1), plain('#5a4a3a', 0.95), [(st.x0 + st.x1) / 2, y + 0.004, zf + 0.05]);
    put(root, box(st.x1 - st.x0 - 0.04, 0.012, 0.012), plain('#8a7a66', 0.9), [(st.x0 + st.x1) / 2, y + 0.006, zf + 0.104]);
    row.forEach((s, i) => {
      const cx = x + s.w / 2; x += s.w + GAP;
      const g = new Node('shop:' + s.key); g.position = [cx, y, zb + DEPTH / 2]; root.add(g);
      const cell = cells.find((c) => c.shop === s);
      // body, a cornice, a parapet, the front, the awning over the shop window
      put(g, box(s.w, s.h, DEPTH), plain(s.wall, 0.9), [0, s.h / 2, 0]);
      put(g, box(s.w + 0.012, 0.014, DEPTH + 0.012), plain('#2b1a10', 0.8), [0, s.h + 0.007, 0]);
      put(g, box(s.w - 0.04, 0.004, DEPTH - 0.04), plain('#3a2a1c', 0.95), [0, s.h + 0.016, 0]);
      put(g, panel(s.w, s.h, cell.uv), atlasMat, [0, s.h / 2, DEPTH / 2 + 0.0015]).castShadow = false;
      if (s.trade !== 'garage') {
        const two = s.h >= 0.44, ay = s.h * (1 - (two ? 0.53 : 0.34));
        put(g, box(s.w * 0.84, 0.007, 0.07), plain(s.awn, 0.9), [0, ay, DEPTH / 2 + 0.03], [0.32, 0, 0]);
      }
      s.atlasMat = atlasMat; s.board = board;
      trade(g, s, s.h + 0.02, live);
      // the click volume: the shop and what stands on its roof
      const h = hitBox(g, [-s.w / 2, 0, -DEPTH / 2], [s.w / 2, s.h + (['dish', 'billboard', 'elephant', 'orb'].includes(s.trade) ? 0.26 : 0.14), DEPTH / 2 + 0.05], { shop: s.key, interactive: true, glow: 0, targetGlow: 0, tipAt: null });
      shops.push({ s, g, h, top: s.h + 0.3 });
      // a lamp post at every other gap
      if (i % 2 === 0 && i < row.length - 1) lampPost(root, [x - GAP / 2, y, zf + 0.07]);
    });
    // people on the pavement, a planter or two
    for (let k = 0; k < 3; k++) person(root, ['#b8622c', '#e7ddc8', '#8e6a3d', '#d9a05b', '#5c4a3a'][(ri * 3 + k) % 5], [st.x0 + 0.25 + k * 0.6 + ri * 0.07, y + 0.008, zf + 0.06 + (k % 2) * 0.02], 0.95);
    bush(root, [st.x0 + 0.06, y, zf + 0.07], 0.9, ri); bush(root, [st.x1 - 0.06, y, zf + 0.07], 0.8, ri + 1);
  });
  // the front street's cars: the florist's delivery van, a car outside the garage, and a forklift by the packaging firm
  const front = STEPS[2], fy = front.y, fz = front.z0 + 0.06 + DEPTH + 0.24;
  const shopX = (key) => { const sp = shops.find((q) => q.s.key === key); return sp.g.position[0]; };
  {
    const van = new Node('van'); van.position = [shopX('flora-indonesia'), fy, fz]; root.add(van);
    put(van, box(0.2, 0.08, 0.09), plain('#e9dfcd', 0.6), [0, 0.055, 0]); put(van, box(0.06, 0.05, 0.088), plain('#66703e', 0.6), [0.07, 0.06, 0]);
    put(van, box(0.035, 0.03, 0.092), M('glassDark', { color: color('#1a130c'), roughness: 0.2, metalness: 0.3 }), [0.095, 0.075, 0]);
    for (const [wx, wz] of [[-0.06, 0.047], [0.06, 0.047], [-0.06, -0.047], [0.06, -0.047]]) put(van, cylinder(0.018, 0.018, 0.012, 10), plain('#15120f', 0.9), [wx, 0.018, wz], [Math.PI / 2, 0, 0]);
    put(van, sphere(0.012, 6, 4), plain('#c96f3f', 0.6), [-0.04, 0.1, 0.03]); put(van, sphere(0.01, 6, 4), plain('#e9b65a', 0.6), [-0.01, 0.1, 0.035]);
  }
  {
    const car = new Node('car'); car.position = [shopX('dams-garage'), fy, fz - 0.03]; car.rotation[1] = 0.12; root.add(car);
    put(car, box(0.2, 0.04, 0.085), plain('#15120f', 0.25, 0.5), [0, 0.035, 0]); put(car, box(0.1, 0.035, 0.075), M('glassDark', { color: color('#1a130c'), roughness: 0.2, metalness: 0.3 }), [-0.01, 0.07, 0]);
    put(car, box(0.004, 0.008, 0.06), LAMP(), [0.101, 0.04, 0]).castShadow = false;
    for (const [wx, wz] of [[-0.065, 0.044], [0.065, 0.044], [-0.065, -0.044], [0.065, -0.044]]) put(car, cylinder(0.017, 0.017, 0.012, 10), plain('#0d0b09', 0.9), [wx, 0.017, wz], [Math.PI / 2, 0, 0]);
  }
  {
    const fk = new Node('forklift'); fk.position = [shopX('gracia-box') + 0.05, fy, fz + 0.02]; fk.rotation[1] = -0.5; root.add(fk);
    put(fk, box(0.07, 0.045, 0.05), plain('#d9a05b', 0.6), [0, 0.035, 0]); put(fk, box(0.006, 0.1, 0.04), BRONZE(), [0.04, 0.06, 0]);
    put(fk, box(0.05, 0.004, 0.035), BRONZE(), [0.065, 0.015, 0]); put(fk, box(0.04, 0.04, 0.035), plain('#a8865a', 0.9), [0.065, 0.037, 0]);
    put(fk, box(0.004, 0.04, 0.004), BRONZE(), [-0.02, 0.075, 0.02]); put(fk, box(0.04, 0.004, 0.045), plain('#2b1a10', 0.7), [-0.005, 0.097, 0]);
  }
  // the street's name board, at the front corner where the street begins
  {
    const sx = front.x0 + 0.3, sz = front.z0 + 0.92;
    put(root, box(0.006, 0.12, 0.006), BRONZE(), [sx - 0.22, fy + 0.06, sz]); put(root, box(0.006, 0.12, 0.006), BRONZE(), [sx + 0.22, fy + 0.06, sz]);
    put(root, box(0.52, 0.17, 0.012), plain('#2b1a10', 0.7), [sx, fy + 0.19, sz - 0.004]);
    put(root, panel(0.5, 0.15, street.uv), atlasMat, [sx, fy + 0.19, sz + 0.003]).castShadow = false;
  }
  // the empty lot at the top of the street, where the R key was: fenced, staked out, its sign asking for the next client
  const lots = [];
  {
    const g = new Node('lot'); g.position = [-1.13, 0, -1.0]; root.add(g);
    put(g, box(0.98, 0.16, 0.98), plain('#2a2117', 0.95), [0, 0.08, 0]);
    put(g, box(0.84, 0.01, 0.6), plain('#4a3624', 1), [0, 0.165, -0.08]);
    const fence = plain('#8e6a3d', 0.8);
    for (let i = 0; i <= 6; i++) { const fx = -0.42 + i * 0.14; put(g, box(0.008, 0.06, 0.008), fence, [fx, 0.19, -0.38]); put(g, box(0.008, 0.06, 0.008), fence, [fx, 0.19, 0.22]); }
    for (const fz of [-0.38, 0.22]) put(g, box(0.85, 0.006, 0.006), fence, [0, 0.205, fz]);
    for (const fx of [-0.42, 0.42]) put(g, box(0.006, 0.006, 0.6), fence, [fx, 0.205, -0.08]);
    for (const [sx, sz] of [[-0.3, -0.25], [0.28, -0.25], [-0.3, 0.1], [0.28, 0.1]]) put(g, box(0.006, 0.04, 0.006), plain('#b8622c', 0.7), [sx, 0.185, sz]);
    for (let i = 0; i < 3; i++) put(g, box(0.06, 0.025, 0.035), plain('#a0583a', 0.9), [0.28 + (i % 2) * 0.02, 0.18 + i * 0.026, -0.3]);
    nameBoard(g, -0.05, 0.16, 0.36, 0.44, 0.16, lotSign.uv, atlasMat);
    lots.push({ g, h: hitBox(g, [-0.46, 0.1, -0.42], [0.46, 0.42, 0.42], { lot: true, interactive: true, glow: 0, targetGlow: 0 }), top: 0.48 });
  }
  return { root, live, subs: [...shops.map((q) => ({ g: q.g, h: q.h, top: q.top })), ...lots], shops: shops.map((q) => q.s.key) };
}

// ---------- shared drawing: the small icons the buildings carry (drawn in a box of size S at x, y)
const ICON = {
  people: (ctx, x, y, S) => { for (const [dx, k] of [[-0.18, 0.8], [0.18, 0.8], [0, 1]]) { ctx.beginPath(); ctx.arc(x + dx * S, y - 0.12 * S * k, 0.11 * S * k, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + dx * S, y + 0.25 * S * k, 0.2 * S * k, Math.PI, 0); ctx.fill(); } },
  clock: (ctx, x, y, S) => { ctx.lineWidth = S * 0.08; ctx.beginPath(); ctx.arc(x, y, S * 0.36, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y - S * 0.24); ctx.lineTo(x, y); ctx.lineTo(x + S * 0.17, y + S * 0.1); ctx.stroke(); },
  coins: (ctx, x, y, S) => { for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x - S * 0.08, y + S * 0.26 - i * S * 0.13, S * 0.24, S * 0.08, 0, 0, Math.PI * 2); ctx.fill(); } ctx.beginPath(); ctx.ellipse(x + S * 0.24, y + S * 0.26, S * 0.16, S * 0.06, 0, 0, Math.PI * 2); ctx.fill(); },
  chat: (ctx, x, y, S) => { ctx.beginPath(); ctx.roundRect(x - S * 0.36, y - S * 0.28, S * 0.72, S * 0.46, S * 0.1); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - S * 0.16, y + S * 0.16); ctx.lineTo(x - S * 0.26, y + S * 0.36); ctx.lineTo(x + S * 0.02, y + S * 0.16); ctx.fill(); },
  db: (ctx, x, y, S) => { ctx.lineWidth = S * 0.07; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x, y - S * 0.24 + i * S * 0.22, S * 0.3, S * 0.09, 0, 0, Math.PI * 2); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(x - S * 0.3, y - S * 0.24); ctx.lineTo(x - S * 0.3, y + S * 0.2); ctx.moveTo(x + S * 0.3, y - S * 0.24); ctx.lineTo(x + S * 0.3, y + S * 0.2); ctx.stroke(); },
  book: (ctx, x, y, S) => { ctx.lineWidth = S * 0.07; ctx.beginPath(); ctx.moveTo(x, y - S * 0.22); ctx.quadraticCurveTo(x - S * 0.2, y - S * 0.3, x - S * 0.38, y - S * 0.24); ctx.lineTo(x - S * 0.38, y + S * 0.24); ctx.quadraticCurveTo(x - S * 0.2, y + S * 0.18, x, y + S * 0.26); ctx.quadraticCurveTo(x + S * 0.2, y + S * 0.18, x + S * 0.38, y + S * 0.24); ctx.lineTo(x + S * 0.38, y - S * 0.24); ctx.quadraticCurveTo(x + S * 0.2, y - S * 0.3, x, y - S * 0.22); ctx.lineTo(x, y + S * 0.26); ctx.stroke(); },
};
// a sign band: dark board, brass rule, the words lit
function signBand(ctx, x, y, w, h, text, glow, size = 0.62, sub = null) {
  if (!glow) { ctx.fillStyle = '#1b130c'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#b08a52'; ctx.lineWidth = Math.max(1.5, h * 0.05); ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); }
  ctx.fillStyle = glow ? '#ffd9a6' : '#f1e2c8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const s = fit(ctx, text, w * 0.9, h * (sub ? size * 0.72 : size), 700, SANS, 2); ctx.font = `700 ${s}px ${SANS}`; ctx.fillText(text, x + w / 2, y + h * (sub ? 0.4 : 0.54));
  if (sub) { ctx.fillStyle = glow ? '#a8682a' : '#d9a05b'; const s2 = fit(ctx, sub, w * 0.9, h * 0.2, 500, MONO, 2); ctx.font = `500 ${s2}px ${MONO}`; ctx.fillText(sub, x + w / 2, y + h * 0.76); }
}
// a grid of windows, some lit
function windows(ctx, x, y, w, h, cols, rows, glow, seed = 1, lit = 0.62) {
  const cw = w / cols, rh = h / rows; let r = Math.abs(Math.round(seed * 9301)) % 233280;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    r = (r * 9301 + 49297) % 233280; const on = r / 233280 < lit;
    const wx = x + i * cw + cw * 0.18, wy = y + j * rh + rh * 0.16, ww = cw * 0.64, wh = rh * 0.62;
    if (!glow) { ctx.fillStyle = '#1e140c'; ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4); }
    ctx.fillStyle = on ? (glow ? '#c98a44' : '#f0c27e') : (glow ? '#000' : '#2a1d12'); ctx.fillRect(wx, wy, ww, wh);
  }
}
// a triangular prism lying along x, apex up: a gable roof or a pediment (w along x, h tall, d deep), flat-shaded
function gable(w, h, d) {
  const x = w / 2, z = d / 2, P = [], N = [], U = [], I = [];
  const face = (pts, n) => { const b = P.length / 3; for (const p of pts) { P.push(...p); N.push(...n); U.push(0, 0); } I.push(b, b + 1, b + 2); if (pts.length === 4) I.push(b, b + 2, b + 3); };
  const sl = Math.hypot(h, z);
  face([[-x, 0, z], [x, 0, z], [x, h, 0], [-x, h, 0]], [0, z / sl, h / sl]);
  face([[x, 0, -z], [-x, 0, -z], [-x, h, 0], [x, h, 0]], [0, z / sl, -h / sl]);
  face([[-x, 0, -z], [-x, 0, z], [-x, h, 0]], [-1, 0, 0]);
  face([[x, 0, z], [x, 0, -z], [x, h, 0]], [1, 0, 0]);
  face([[-x, 0, -z], [x, 0, -z], [x, 0, z], [-x, 0, z]], [0, -1, 0]);
  return { positions: new Float32Array(P), normals: new Float32Array(N), uvs: new Float32Array(U), indices: new Uint16Array(I), bounds: { min: [-x, 0, -z], max: [x, h, z] } };
}
function tree(parent, pos, s = 1, seed = 0) {
  put(parent, cylinder(0.008 * s, 0.011 * s, 0.09 * s, 5), plain('#3a2616', 0.9), [pos[0], pos[1] + 0.045 * s, pos[2]]);
  put(parent, fuse([[sphere(0.05, 7, 5), [0, 0, 0]], [sphere(0.036, 7, 5), [0.03, 0.03, 0.01]], [sphere(0.034, 7, 5), [-0.028, 0.025, -0.012]]]), plain(FOLIAGE[((Math.floor(seed) % 4) + 4) % 4], 0.85), [pos[0], pos[1] + 0.12 * s, pos[2]], null, [s, s, s]);
}
const LINE = () => M('dataLine', { color: [1, 0.6, 0.25], emissive: color('#ffb766'), emissiveIntensity: 1.6, roughness: 0.5 });
// a standing name board on two brass legs (the board's face is one atlas cell)
function nameBoard(parent, x, y, z, w, h, uv, mat) {
  put(parent, box(0.006, h * 0.6, 0.006), BRONZE(), [x - w * 0.43, y + h * 0.3, z]); put(parent, box(0.006, h * 0.6, 0.006), BRONZE(), [x + w * 0.43, y + h * 0.3, z]);
  put(parent, box(w + 0.02, h + 0.02, 0.012), plain('#2b1a10', 0.7), [x, y + h * 0.6 + h / 2 - 0.01, z - 0.004]);
  put(parent, panel(w, h, uv), mat, [x, y + h * 0.6 + h / 2 - 0.01, z + 0.003]).castShadow = false;
}

// ---------- GodPlan ERP: one system, every department
// The dashboard is the tower in the middle: its face is the screen (headcount, attendance, tasks, payroll on one page). The
// modules stand around it, each named over its door with its emblem; the core (Go and PostgreSQL) stands among them with the
// database beside it, and lit lines run from it to every door. A crane is still up beside the tower: the build goes on.
const GP = [
  { id: 'employees', label: 'EMPLOYEES', icon: 'people', x: -1.62, w: 0.5, h: 0.56, wall: '#5a4330', hs: 'desk' },
  { id: 'attendance', label: 'ATTENDANCE', icon: 'clock', x: -1.04, w: 0.5, h: 0.46, wall: '#6f6a4a', hs: 'greenhouse' },
  { id: 'hq', label: 'GODPLAN', x: -0.33, w: 0.62, h: 1.06, wall: '#221c18', hs: 'screen' },
  { id: 'core', label: 'THE CORE', icon: 'db', x: 0.4, w: 0.44, h: 0.62, wall: '#15120f', hs: 'tower' },
  { id: 'payroll', label: 'PAYROLL', icon: 'coins', x: 1.02, w: 0.5, h: 0.5, wall: '#7a5a3e', hs: 'papers' },
  { id: 'crm', label: 'CRM', icon: 'chat', x: 1.6, w: 0.46, h: 0.42, wall: '#8a5a34', hs: 'lamp' },
];
function drawDashboard(ctx, x0, y0, w, h, glow) {
  const A = glow ? '#e09a48' : '#d9a05b', Cr = glow ? '#8a6a48' : '#e7ddc8', dim = glow ? '#3a2410' : '#6b5a48';
  ctx.fillStyle = glow ? '#1c1007' : '#120d09'; ctx.fillRect(x0, y0, w, h);
  // header: the name, and the user's dots
  ctx.fillStyle = glow ? '#2a1a0c' : '#1d150e'; ctx.fillRect(x0, y0, w, h * 0.12);
  ctx.fillStyle = A; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(h * 0.075)}px ${SANS}`; ctx.letterSpacing = '0px'; ctx.fillText('GodPlan', x0 + w * 0.17, y0 + h * 0.062);
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x0 + w * (0.9 - i * 0.04), y0 + h * 0.06, h * 0.014, 0, 7); ctx.fillStyle = dim; ctx.fill(); }
  // the sidebar: one square per module
  for (let i = 0; i < 6; i++) { ctx.fillStyle = i === 0 ? A : dim; ctx.fillRect(x0 + w * 0.04, y0 + h * (0.18 + i * 0.12), w * 0.06, h * 0.06); }
  // four tiles: headcount, attendance, tasks, payroll, each a label and a small picture of it (no figures: this is a picture)
  const tw = w * 0.19, th = h * 0.34, ty = y0 + h * 0.17;
  ['HEADCOUNT', 'ATTENDANCE', 'TASKS', 'PAYROLL'].forEach((lab, i) => {
    const tx = x0 + w * 0.15 + i * (tw + w * 0.018);
    ctx.fillStyle = glow ? '#24160a' : '#1d150e'; ctx.fillRect(tx, ty, tw, th);
    ctx.fillStyle = Cr; ctx.textAlign = 'left'; const ls = fit(ctx, lab, tw * 0.84, h * 0.036, 600, MONO, 0); ctx.font = `600 ${ls}px ${MONO}`; ctx.fillText(lab, tx + tw * 0.08, ty + th * 0.16);
    ctx.fillStyle = A; ctx.strokeStyle = A; const cx = tx + tw / 2, cy = ty + th * 0.6, S = Math.min(tw, th) * 0.62;
    if (i === 0) ICON.people(ctx, cx, cy, S);
    else if (i === 1) { ctx.lineWidth = S * 0.12; ctx.beginPath(); ctx.arc(cx, cy, S * 0.34, -Math.PI / 2, Math.PI * 1.15); ctx.stroke(); ctx.strokeStyle = dim; ctx.beginPath(); ctx.arc(cx, cy, S * 0.34, Math.PI * 1.15, Math.PI * 1.5); ctx.stroke(); }
    else if (i === 2) for (let k = 0; k < 3; k++) { ctx.fillStyle = A; ctx.fillRect(cx - S * 0.36, cy - S * 0.3 + k * S * 0.26, S * 0.12, S * 0.12); ctx.fillStyle = k === 2 ? dim : A; ctx.fillRect(cx - S * 0.16, cy - S * 0.27 + k * S * 0.26, S * 0.52, S * 0.06); }
    else for (let k = 0; k < 5; k++) { const bh = S * (0.25 + ((k * 37) % 5) * 0.1); ctx.fillRect(cx - S * 0.4 + k * S * 0.17, cy + S * 0.35 - bh, S * 0.11, bh); }
  });
  // the wide chart under them
  const cy0 = y0 + h * 0.57, ch = h * 0.36, cx0 = x0 + w * 0.15, cw = w * 0.81;
  ctx.fillStyle = glow ? '#24160a' : '#1d150e'; ctx.fillRect(cx0, cy0, cw, ch);
  const pts = [0.62, 0.55, 0.6, 0.42, 0.48, 0.35, 0.4, 0.28, 0.3, 0.2];
  ctx.beginPath(); ctx.moveTo(cx0, cy0 + ch); pts.forEach((v, k) => ctx.lineTo(cx0 + (k / (pts.length - 1)) * cw, cy0 + ch * v)); ctx.lineTo(cx0 + cw, cy0 + ch); ctx.closePath(); ctx.fillStyle = glow ? '#4a2a10' : '#5a3a1e'; ctx.fill();
  ctx.beginPath(); pts.forEach((v, k) => ctx[k ? 'lineTo' : 'moveTo'](cx0 + (k / (pts.length - 1)) * cw, cy0 + ch * v)); ctx.strokeStyle = A; ctx.lineWidth = Math.max(2, h * 0.012); ctx.stroke();
}
function drawGP(ctx, c, W, H, glow) {
  const b = c.b;
  if (c.kind === 'hq') {
    if (!glow) { ctx.fillStyle = '#221c18'; ctx.fillRect(0, 0, W, H); }
    signBand(ctx, W * 0.06, H * 0.015, W * 0.88, H * 0.075, 'GODPLAN', glow, 0.7);
    for (const f of [0.11, 0.15]) { ctx.fillStyle = glow ? '#7a4c1e' : '#c99a5e'; ctx.fillRect(W * 0.06, H * f, W * 0.88, H * 0.022); }
    // the screen, in a brass bezel
    const sx = W * 0.06, sy = H * 0.2, sw = W * 0.88, sh = H * 0.5;
    if (!glow) { ctx.fillStyle = '#b08a52'; ctx.fillRect(sx - 4, sy - 4, sw + 8, sh + 8); }
    drawDashboard(ctx, sx, sy, sw, sh, glow);
    for (const f of [0.74, 0.78]) { ctx.fillStyle = glow ? '#7a4c1e' : '#c99a5e'; ctx.fillRect(W * 0.06, H * f, W * 0.88, H * 0.022); }
    // the lobby: lit glass, the doors
    ctx.fillStyle = glow ? '#d99448' : '#f6cb86'; ctx.fillRect(W * 0.06, H * 0.83, W * 0.88, H * 0.15);
    if (!glow) { ctx.fillStyle = '#21160d'; for (let i = 1; i < 6; i++) ctx.fillRect(W * (0.06 + i * 0.88 / 6) - 1.5, H * 0.83, 3, H * 0.15); ctx.fillStyle = '#3a2716'; ctx.fillRect(W * 0.42, H * 0.88, W * 0.16, H * 0.1); }
    return;
  }
  if (c.kind === 'side') {
    if (!glow) { ctx.fillStyle = '#221c18'; ctx.fillRect(0, 0, W, H); }
    for (let i = 0; i < 14; i++) { const f = 0.11 + i * 0.05; ctx.fillStyle = glow ? (i % 3 === 1 ? '#000' : '#6a4018') : '#a8865a'; ctx.fillRect(W * 0.08, H * f, W * 0.84, H * 0.02); }
    ctx.fillStyle = glow ? '#b07a3c' : '#f0c27e'; ctx.fillRect(W * 0.08, H * 0.83, W * 0.84, H * 0.15); return;
  }
  if (c.kind === 'office') {
    if (!glow) { ctx.fillStyle = b.wall; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, H - H * 0.04, W, H * 0.04); }
    signBand(ctx, W * 0.06, H * 0.04, W * 0.88, H * 0.13, b.label, glow, 0.62);
    // the module's emblem in a lit roundel
    const ex = W / 2, ey = H * 0.36, R = Math.min(W, H) * 0.15;
    if (!glow) { ctx.fillStyle = '#1b130c'; ctx.beginPath(); ctx.arc(ex, ey, R * 1.15, 0, 7); ctx.fill(); ctx.strokeStyle = '#b08a52'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.fillStyle = glow ? '#ffc27a' : '#d9a05b'; ctx.strokeStyle = ctx.fillStyle; ICON[b.icon](ctx, ex, ey, R * 1.6);
    if (b.id === 'core') { // racks: rows of small lights
      for (let j = 0; j < 6; j++) for (let i = 0; i < 9; i++) { const on = (i * 7 + j * 3) % 5 !== 0; ctx.fillStyle = on ? (glow ? ((i + j) % 4 ? '#c98a44' : '#ffe0b0') : '#e0a85e') : (glow ? '#000' : '#2a1d12'); ctx.fillRect(W * (0.12 + i * 0.087), H * (0.58 + j * 0.05), W * 0.04, H * 0.016); }
    } else windows(ctx, W * 0.06, H * 0.56, W * 0.88, H * 0.28, b.w > 0.48 ? 4 : 3, 2, glow, b.x * 10 + 7);
    ctx.fillStyle = glow ? '#7a4c1e' : '#b98a52'; ctx.fillRect(W * 0.4, H * 0.86, W * 0.2, H * 0.1);
    return;
  }
  if (c.kind === 'sign') { if (!glow) { ctx.fillStyle = '#1b130c'; ctx.fillRect(0, 0, W, H); } signBand(ctx, 0, 0, W, H, c.text, glow, 0.6, c.sub); return; }
  if (c.kind === 'phone') {
    ctx.fillStyle = glow ? '#1c1007' : '#120d09'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = glow ? '#e09a48' : '#d9a05b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(W * 0.15)}px ${SANS}`; ctx.letterSpacing = '0px'; ctx.fillText('GodPlan', W / 2, H * 0.1);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = glow ? '#3a2410' : '#2a1d12'; ctx.fillRect(W * 0.1, H * (0.2 + i * 0.17), W * 0.8, H * 0.13); ctx.fillStyle = glow ? '#c98a44' : '#e0a85e'; ctx.fillRect(W * 0.16, H * (0.235 + i * 0.17), W * (0.25 + (i % 3) * 0.15), H * 0.03); ctx.fillStyle = glow ? '#6a4018' : '#8a7a66'; ctx.fillRect(W * 0.16, H * (0.28 + i * 0.17), W * 0.5, H * 0.02); }
    ctx.fillStyle = glow ? '#6a4018' : '#8a7a66'; for (let i = 0; i < 4; i++) ctx.fillRect(W * (0.14 + i * 0.2), H * 0.91, W * 0.12, H * 0.04);
  }
}
function godplan() {
  const root = new Node('godplan'), live = [], subs = [];
  const y = 0.1, py = 0.05, D = 0.5, zc = -0.6;   // the back step (keys 7 to 0) is 0.1 high, the plaza in front of it 0.05
  const cells = [];
  for (const b of GP) { cells.push({ w: b.w, h: b.h, kind: b.id === 'hq' ? 'hq' : 'office', b }); if (b.id === 'hq') cells.push({ w: D, h: b.h, kind: 'side', b }); }
  const plazaSign = { w: 0.62, h: 0.17, kind: 'sign', text: 'GODPLAN ERP', sub: 'ONE SYSTEM, EVERY DEPARTMENT' }, phone = { w: 0.12, h: 0.22, kind: 'phone' };
  cells.push(plazaSign, phone);
  const tex = atlas(cells, drawGP);
  const am = new Material({ color: [1, 1, 1], map: tex.map, emissiveMap: tex.emissiveMap, emissive: color('#ffc27a'), emissiveIntensity: 1.5, roughness: 0.6 });
  for (const b of GP) {
    const g = new Node('gp:' + b.id); g.position = [b.x, y, zc]; root.add(g);
    const cell = cells.find((c) => c.b === b && c.kind !== 'side');
    put(g, box(b.w, b.h, D), plain(b.wall, b.id === 'hq' || b.id === 'core' ? 0.35 : 0.9, b.id === 'hq' ? 0.3 : 0), [0, b.h / 2, 0]);
    put(g, box(b.w + 0.012, 0.014, D + 0.012), plain('#2b1a10', 0.8), [0, b.h + 0.007, 0]);
    put(g, panel(b.w, b.h, cell.uv), am, [0, b.h / 2, D / 2 + 0.0015]).castShadow = false;
    if (b.id === 'hq') {
      const side = cells.find((c) => c.b === b && c.kind === 'side');
      put(g, panel(D, b.h, side.uv), am, [-b.w / 2 - 0.0015, b.h / 2, 0], [0, -Math.PI / 2, 0]).castShadow = false;
      put(g, panel(D, b.h, side.uv), am, [b.w / 2 + 0.0015, b.h / 2, 0], [0, Math.PI / 2, 0]).castShadow = false;
      // the roof: a plant storey and an antenna with its light
      put(g, box(b.w - 0.08, 0.05, D - 0.08), plain('#2b2520', 0.7), [0, b.h + 0.04, -0.03]);
      put(g, cylinder(0.004, 0.006, 0.2, 5), BRONZE(), [0.18, b.h + 0.16, -0.12]);
      put(g, sphere(0.008, 6, 4), M('beacon', { color: [1, 0.2, 0.08], emissive: [1, 0.12, 0.04], emissiveIntensity: 4 }), [0.18, b.h + 0.265, -0.12]).castShadow = false;
    } else put(g, box(b.w * 0.36, 0.06, D * 0.36), plain('#3a2a1c', 0.9), [-b.w * 0.18, b.h + 0.03, -0.08]);   // a plant room
    if (b.id === 'core') {
      // the database beside the core: three stacked discs, lit at the seams
      const dbG = new Node('db'); dbG.position = [b.w / 2 + 0.11, 0, 0.05]; g.add(dbG);
      for (let i = 0; i < 3; i++) { put(dbG, cylinder(0.08, 0.08, 0.075, 18), plain('#d6c7ab', 0.5), [0, 0.045 + i * 0.09, 0]); put(dbG, cylinder(0.082, 0.082, 0.012, 18), LINE(), [0, 0.09 + i * 0.09, 0]).castShadow = false; }
      put(dbG, cylinder(0.083, 0.083, 0.01, 18), BRASS(), [0, 0.008, 0]);
    }
    const tall = b.id === 'hq' ? 0.08 : 0.1;   // (the tower's antenna is a hair: its box stops at the roof storey)
    subs.push({ g, h: hitBox(g, [-b.w / 2, 0, -D / 2], [b.w / 2 + (b.id === 'core' ? 0.2 : 0), b.h + tall, D / 2 + 0.04], { note: { world: 0, hs: b.hs }, interactive: true, glow: 0, targetGlow: 0 }), top: b.h + tall + 0.08 });
  }
  // the lines from the core to every door, along the front of the step, and the light that runs along them
  const busZ = zc + D / 2 + 0.13, coreX = GP.find((b) => b.id === 'core').x;
  put(root, box(3.6, 0.004, 0.014), LINE(), [0, y + 0.003, busZ]).castShadow = false;
  for (const b of GP) put(root, box(0.014, 0.004, 0.13), LINE(), [b.x, y + 0.003, busZ - 0.065]).castShadow = false;
  const pulseMat = M('pulse', { color: [1, 0.85, 0.6], emissive: color('#fff0d0'), emissiveIntensity: 3, roughness: 0.3 });
  const pulses = [], dests = GP.filter((q) => q.id !== 'core');
  for (let i = 0; i < 5; i++) { const p = put(root, sphere(0.012, 8, 6), pulseMat, [coreX, y + 0.01, busZ]); p.castShadow = false; p.userData.dynamic = true; pulses.push(p); }
  live.push((t) => pulses.forEach((p, i) => {
    // each pulse leaves the core, runs along the line to a module and up to its door, then starts again
    const b = dests[i], k = (t * 0.32 + i * 0.21) % 1, dx = b.x - coreX, run = Math.abs(dx) + 0.13, s = k * run;
    if (s < Math.abs(dx)) { p.position[0] = coreX + Math.sign(dx) * s; p.position[2] = busZ; } else { p.position[0] = b.x; p.position[2] = busZ - (s - Math.abs(dx)); }
    const f = Math.min(1, Math.min(k, 1 - k) * 8); p.scale = [f, f, f];
  }));
  // the plaza in front: the phone (it runs on phones too), trees, people on their way in, the name board
  put(root, box(1.9, 0.006, 0.9), plain('#4a3b2c', 0.95), [-0.5, py + 0.003, 0.5]);
  {
    const ph = new Node('phone'); ph.position = [-1.05, py, 0.42]; ph.rotation[1] = 0.25; root.add(ph);
    put(ph, box(0.12, 0.03, 0.06), plain('#3b2b1d', 0.8), [0, 0.015, 0]);
    put(ph, box(0.14, 0.25, 0.022), plain('#15120f', 0.3, 0.4), [0, 0.16, 0], [-0.08, 0, 0]);
    put(ph, panel(0.12, 0.22, phone.uv), am, [0, 0.16, 0.0125], [-0.08, 0, 0]).castShadow = false;
    subs.push({ g: ph, h: hitBox(ph, [-0.08, 0, -0.04], [0.08, 0.3, 0.05], { note: { world: 0, title: 'On the phone', body: 'Built for the phone too: the same system, on a small screen.' }, interactive: true, glow: 0, targetGlow: 0 }), top: 0.36 });
  }
  for (const [x, z, s, k] of [[-1.42, 0.15, 1.1, 0], [-0.62, 0.2, 0.9, 1], [0.32, 0.86, 0.9, 2], [-1.4, 0.82, 0.8, 3]]) tree(root, [x, py, z], s, k);
  for (const [x, z, c] of [[-0.42, 0.1, '#e7ddc8'], [-0.3, 0.16, '#b8622c'], [-0.75, 0.62, '#d9a05b'], [-0.1, 0.45, '#8e6a3d'], [0.15, 0.2, '#5c4a3a']]) person(root, c, [x, py + 0.006, z]);
  for (const x of [-1.25, -0.25]) lampPost(root, [x, py, 0.08]);
  nameBoard(root, -0.42, py, 0.84, 0.62, 0.17, plazaSign.uv, am);
  // a covered bridge from Employees across to the Gajah Terbang shop on the client street (district-local: that shop's back is at
  // x -1.8, z 0.06): the company behind GodPlan is also a client with a public site, the same client twice
  {
    const g = new Node('gp:bridge'); g.position = [-1.79, y, -0.15]; root.add(g);
    const by = 0.34, len = 0.44;
    put(g, box(0.08, 0.02, len), plain('#3b2b1d', 0.7), [0, by, 0]);
    put(g, box(0.07, 0.045, len), GLOW(), [0, by + 0.032, 0]).castShadow = false;
    put(g, box(0.09, 0.01, len + 0.01), BRASS(), [0, by + 0.06, 0]);
    for (const dz of [-0.12, 0.12]) put(g, box(0.012, by, 0.012), BRONZE(), [0, by / 2, dz]);
    subs.push({ g, h: hitBox(g, [-0.06, by - 0.02, -len / 2], [0.06, by + 0.08, len / 2], { note: { world: 0, title: 'The same client twice', body: 'PT. Gajah Terbang Kreatif runs on GodPlan inside, and its public site is a shop on the client street next door: a WordPress site anyone can open, and the internal platform.' }, interactive: true, glow: 0, targetGlow: 0 }), top: by + 0.12 });
  }
  // the crane, still up behind the tower (in the gap between it and the core): the build goes on
  {
    const cr = new Node('crane'); cr.position = [0.08, y, -0.92]; root.add(cr);
    const paint = plain('#d9a05b', 0.6, 0.1), mastH = 1.32;
    for (const [dx, dz] of [[-0.022, -0.022], [0.022, -0.022], [-0.022, 0.022], [0.022, 0.022]]) put(cr, box(0.006, mastH, 0.006), paint, [dx, mastH / 2, dz]);
    for (let yy = 0.08; yy < mastH; yy += 0.09) { put(cr, box(0.05, 0.004, 0.004), paint, [0, yy, 0.022], [0, 0, 0.7]); put(cr, box(0.004, 0.004, 0.05), paint, [0.022, yy + 0.045, 0], [0.7, 0, 0]); }
    put(cr, box(0.08, 0.03, 0.08), plain('#3b2b1d', 0.6), [0, 0.015, 0]);
    const top = new Node('crane-top'); top.position = [0, mastH, 0]; top.userData.dynamic = true; cr.add(top);
    put(top, fuse([[box(0.85, 0.016, 0.03), [-0.3, 0.02, 0]], [box(0.25, 0.016, 0.03), [0.24, 0.02, 0]], [box(0.006, 0.12, 0.006), [0, 0.08, 0]], [box(0.4, 0.004, 0.004), [-0.2, 0.08, 0], [0, 0, -0.25]], [box(0.16, 0.004, 0.004), [0.08, 0.08, 0], [0, 0, 0.6]]]), paint, [0, 0, 0]);
    put(top, fuse([[box(0.06, 0.05, 0.05), [0.02, -0.02, 0.03]], [box(0.07, 0.06, 0.05), [0.32, 0, 0]]]), plain('#3b2b1d', 0.8), [0, 0, 0]);
    put(top, fuse([[box(0.002, 0.16, 0.002), [-0.55, -0.07, 0]], [box(0.14, 0.012, 0.03), [-0.55, -0.16, 0]]]), BRONZE(), [0, 0, 0]);
    live.push((t) => { top.rotation[1] = -0.5 + Math.sin(t * 0.12) * 0.25; });   // (the jib works behind the tower, never swinging out at the viewer)
  }
  return { root, live, subs };
}

// ---------- JAKASN: digital publishing for the civil service
// A civic hall with columns (the journal platform), the OJS press on its left and BKNPEDIA on its right, joined by covered
// bridges (the integrations between them), the core with its database at the front, and the intern's annex where it was built.
function drawJK(ctx, c, W, H, glow) {
  if (c.kind === 'sign') { if (!glow) { ctx.fillStyle = '#1b130c'; ctx.fillRect(0, 0, W, H); } signBand(ctx, 0, 0, W, H, c.text, glow, 0.62, c.sub); return; }
  if (c.kind === 'hall') {   // behind the columns: tall lit windows and the doors
    if (!glow) { ctx.fillStyle = '#d6c7ab'; ctx.fillRect(0, 0, W, H); }
    for (let i = 0; i < 5; i++) { const x = W * (0.07 + i * 0.19), door = i === 2; ctx.fillStyle = door ? (glow ? '#7a4c1e' : '#b98a52') : (glow ? '#c98a44' : '#f0c27e'); ctx.beginPath(); ctx.roundRect(x, H * (door ? 0.4 : 0.22), W * 0.11, H * (door ? 0.6 : 0.6), [W * 0.055, W * 0.055, 0, 0]); ctx.fill(); }
    return;
  }
  // a building front: its sign, an emblem, windows
  const b = c.b;
  if (!glow) { ctx.fillStyle = b.wall; ctx.fillRect(0, 0, W, H); if (b.brick) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < H; y += 7) ctx.fillRect(0, y, W, 1.5); } }
  signBand(ctx, W * 0.06, H * 0.05, W * 0.88, H * 0.16, b.label, glow, 0.62);
  if (b.icon) { ctx.fillStyle = glow ? '#ffc27a' : '#d9a05b'; ctx.strokeStyle = ctx.fillStyle; ICON[b.icon](ctx, W / 2, H * 0.38, Math.min(W, H) * 0.24); }
  if (b.racks) { for (let j = 0; j < 4; j++) for (let i = 0; i < 7; i++) { const on = (i * 5 + j * 3) % 4 !== 0; ctx.fillStyle = on ? (glow ? '#c98a44' : '#e0a85e') : (glow ? '#000' : '#2a1d12'); ctx.fillRect(W * (0.12 + i * 0.11), H * (0.32 + j * 0.12), W * 0.05, H * 0.04); } }
  else windows(ctx, W * 0.06, H * 0.55, W * 0.88, H * 0.28, b.cols || 3, 1, glow, b.seed || 3);
  ctx.fillStyle = glow ? '#7a4c1e' : '#b98a52'; ctx.fillRect(W * 0.42, H * 0.85, W * 0.16, H * 0.15);
}
const JK = {
  ojs: { label: 'OJS', icon: 'book', wall: '#6b4f36', brick: true, w: 0.56, h: 0.5, d: 0.5, x: -1.02, z: -0.42, hs: 'diagram', cols: 3, seed: 2 },
  pedia: { label: 'BKNPEDIA', icon: 'book', wall: '#8a6a48', w: 0.56, h: 0.56, d: 0.5, x: 1.02, z: -0.42, hs: 'diagram', cols: 4, seed: 5 },
  core: { label: 'PHP · MYSQL', wall: '#15120f', racks: true, w: 0.36, h: 0.3, d: 0.3, x: 1.12, z: 0.46, hs: 'rings' },
  intern: { label: 'INTERNSHIP 2025', icon: 'people', wall: '#c9b48a', w: 0.42, h: 0.3, d: 0.3, x: -1.06, z: 0.46, hs: 'device', cols: 2, seed: 4 },
};
function jakasn() {
  const root = new Node('jakasn'), live = [], subs = [];
  const y = 0.06;   // the ground slab's top
  const cells = Object.values(JK).map((b) => ({ w: b.w, h: b.h, kind: 'front', b }));
  const hallFront = { w: 0.74, h: 0.3, kind: 'hall' }, frieze = { w: 0.86, h: 0.05, kind: 'sign', text: 'JAKASN' }, board = { w: 0.6, h: 0.16, kind: 'sign', text: 'JAKASN', sub: 'DIGITAL PUBLISHING FOR THE CIVIL SERVICE' };
  cells.push(hallFront, frieze, board);
  const tex = atlas(cells, drawJK);
  const am = new Material({ color: [1, 1, 1], map: tex.map, emissiveMap: tex.emissiveMap, emissive: color('#ffc27a'), emissiveIntensity: 1.5, roughness: 0.7 });
  const stone = plain('#d6c7ab', 0.8), stoneDark = plain('#a8977a', 0.85);
  // the hall: podium, steps, body, the columns, the entablature with its name, the pediment, a lantern on the roof
  {
    const g = new Node('jk:hall'); g.position = [0, y, -0.25]; root.add(g);
    put(g, box(1.02, 0.06, 0.74), stoneDark, [0, 0.03, 0]);
    for (let i = 0; i < 3; i++) put(g, box(0.6, 0.02, 0.05), stone, [0, 0.01 + i * 0.02, 0.49 - i * 0.04]);
    put(g, box(0.86, 0.32, 0.54), stone, [0, 0.22, -0.06]);
    put(g, panel(0.74, 0.3, hallFront.uv), am, [0, 0.21, 0.21 + 0.0015]).castShadow = false;
    for (let i = 0; i < 6; i++) put(g, fuse([[cylinder(0.024, 0.027, 0.32, 10), [0, 0.16, 0]], [box(0.06, 0.016, 0.06), [0, 0.008, 0]], [box(0.06, 0.016, 0.06), [0, 0.312, 0]]]), plain('#efe4cf', 0.7), [-0.4 + i * 0.16, 0.06, 0.3]);
    put(g, box(0.96, 0.06, 0.66), stone, [0, 0.41, 0]);
    put(g, panel(0.86, 0.05, frieze.uv), am, [0, 0.41, 0.33 + 0.0015]).castShadow = false;
    put(g, gable(0.66, 0.14, 0.96), stoneDark, [0, 0.44, 0], [0, Math.PI / 2, 0]);
    put(g, box(0.16, 0.08, 0.16), GLOW(), [0, 0.56, -0.12]);
    put(g, box(0.19, 0.012, 0.19), BRASS(), [0, 0.606, -0.12]);
    subs.push({ g, h: hitBox(g, [-0.5, 0, -0.36], [0.5, 0.62, 0.52], { note: { world: 2, hs: 'monitors' }, interactive: true, glow: 0, targetGlow: 0 }), top: 0.72 });
  }
  // the press, the encyclopedia, the core, the annex
  for (const [id, b] of Object.entries(JK)) {
    const g = new Node('jk:' + id); g.position = [b.x, y, b.z]; root.add(g);
    put(g, box(b.w, b.h, b.d), plain(b.wall, b.racks ? 0.35 : 0.9), [0, b.h / 2, 0]);
    put(g, box(b.w + 0.012, 0.014, b.d + 0.012), plain('#2b1a10', 0.8), [0, b.h + 0.007, 0]);
    put(g, panel(b.w, b.h, cells.find((c) => c.b === b).uv), am, [0, b.h / 2, b.d / 2 + 0.0015]).castShadow = false;
    if (id === 'ojs' || id === 'pedia') put(g, gable(b.w + 0.02, 0.1, b.d + 0.02), plain('#3a2417', 0.8), [0, b.h + 0.014, 0]);
    if (id === 'core') {
      const dbG = new Node('db'); dbG.position = [-b.w / 2 - 0.08, 0, 0]; g.add(dbG);
      for (let i = 0; i < 3; i++) { put(dbG, cylinder(0.06, 0.06, 0.055, 16), plain('#d6c7ab', 0.5), [0, 0.035 + i * 0.065, 0]); put(dbG, cylinder(0.062, 0.062, 0.01, 16), LINE(), [0, 0.067 + i * 0.065, 0]).castShadow = false; }
    }
    if (id === 'ojs') for (let k = 0; k < 3; k++) for (let j = 0; j < 3 + k; j++) put(g, box(0.07, 0.014, 0.05), plain(['#b8622c', '#efe4cf', '#66703e', '#d9a05b'][(j + k) % 4], 0.85), [-0.12 + k * 0.12, 0.007 + j * 0.015, b.d / 2 + 0.07], [0, (j % 2) * 0.2, 0]);
    subs.push({ g, h: hitBox(g, [-b.w / 2 - (id === 'core' ? 0.15 : 0), 0, -b.d / 2], [b.w / 2, b.h + (b.icon === 'book' ? 0.12 : 0.04), b.d / 2 + 0.06], { note: { world: 2, hs: b.hs }, interactive: true, glow: 0, targetGlow: 0 }), top: b.h + 0.2 });
  }
  // the covered bridges between the press, the hall and the encyclopedia: the integrations between the three systems
  const glassLit = GLOW();
  for (const sx of [-1, 1]) {
    const x0 = sx * 0.5, x1 = sx * 0.74, xm = (x0 + x1) / 2, len = Math.abs(x1 - x0) + 0.02, by = y + 0.3;
    put(root, box(len, 0.03, 0.09), plain('#3b2b1d', 0.7), [xm, by, -0.4]);
    put(root, box(len, 0.05, 0.075), glassLit, [xm, by + 0.04, -0.4]);
    put(root, box(len, 0.012, 0.095), BRASS(), [xm, by + 0.071, -0.4]);
  }
  // the square: a flag, people, trees, the name board at the front
  put(root, box(0.006, 0.42, 0.006), BRONZE(), [0.36, y + 0.21, 0.62]);
  put(root, box(0.11, 0.035, 0.003), plain('#b03a26', 0.8), [0.36 + 0.058, y + 0.4, 0.62]); put(root, box(0.11, 0.035, 0.003), plain('#efe4cf', 0.8), [0.36 + 0.058, y + 0.365, 0.62]);
  for (const [x, z, c] of [[-0.25, 0.55, '#e7ddc8'], [-0.1, 0.62, '#8e6a3d'], [0.15, 0.5, '#b8622c'], [0.55, 0.3, '#d9a05b'], [-0.6, 0.2, '#5c4a3a']]) person(root, c, [x, y, z]);
  for (const [x, z, s, k] of [[-1.38, 0.85, 0.8, 0], [1.4, -0.85, 0.9, 1], [-1.4, -0.86, 0.8, 2], [0.62, 0.85, 0.7, 3]]) tree(root, [x, y, z], s, k);
  nameBoard(root, -0.25, y, 0.84, 0.6, 0.16, board.uv, am);
  return { root, live, subs };
}

// ---------- the district wrapper: merge, a pin over the part being pointed at, a light that follows it
const BUILDERS = { market: clientRow, signal: godplan, lab: jakasn };
/** Is this district built here (the Blender export keeps only its shell)? */
export const builtHere = (id) => !!BUILDERS[id];
/**
 * Build a district: its parts merged (one palette draw for the plain parts, a few for the lit ones), the moving parts left live,
 * and a tight click volume per building that names the building (a client's shop, a module of the ERP) once the district has
 * the focus. Returns { root, mats, hits, update(dt, t), spot(), shops } or null.
 */
export function buildDistrict(id) {
  const make = BUILDERS[id]; if (!make) return null;
  const d = make();
  const pin = new Node('pin'); pin.userData.dynamic = true; pin.visible = false; d.root.add(pin);
  put(pin, fuse([[cone(0.022, 0.05, 10), [0, 0.025, 0], [Math.PI, 0, 0]], [sphere(0.024, 10, 8), [0, 0.065, 0]]]), M('pin', { color: [0.6, 0.36, 0.12], emissive: color('#ffcf8a'), emissiveIntensity: 1.2, roughness: 0.3, metalness: 0.6 }), [0, 0, 0]).castShadow = false;
  flatten(d.root, `town:${id}`);
  const mats = atlasMerge(d.root, `town:${id}`);
  // what each part says when it is pointed at: a shop names its client, a building the note it stands for in the world
  for (const q of d.subs) { const u = q.h.userData; if (u.shop) u.project = projectByKey(u.shop) || null; if (u.note) { const w = WORLDS[u.note.world]; u.noteDef = { ...(u.note.hs ? w.hotspots[u.note.hs] : u.note), world: w }; } }
  let pointed = null;
  const update = (dt, t) => {
    for (const f of d.live) f(t);
    const on = d.subs.find((q) => q.h.userData.targetGlow > 0.5) || null;
    if (on !== pointed) { pointed = on; pin.visible = !!on; }
    if (on) { const p = on.g.position; pin.position = [p[0], p[1] + on.top + Math.sin(t * 3) * 0.015, p[2] + 0.04]; pin.rotation[1] = t * 1.5; }
  };
  // where the part being pointed at is (district-local), for the light that follows it
  const spot = () => (pointed ? [pointed.g.position[0], pointed.g.position[1] + pointed.top * 0.6, pointed.g.position[2] + 0.3] : null);
  return { root: d.root, mats, hits: d.subs.map((q) => q.h), update, spot, shops: d.shops || null };
}

// ---------- the small keys: each who-I-am chapter built on its own cap, small enough to sit inside one key
// O, the campus (in its glass case): a tower, the lecture hall, the board where Object-Oriented Programming was taught, the GPA
// on a brass plaque, a signpost for the three languages. X, the field work: a stairway with a crew carrying TVs up it, a table
// of laptops being re-imaged. ], the process: four stations along a belt, a parcel riding from strategy to the launch pad.
// F8 keeps its mountain and gets a flag at every camp. Enter, the workshop: a low studio with the desk in its window.
let KEY_ATLAS = null;
function drawKey(ctx, c, W, H, glow) {
  const lit = glow ? '#c98a44' : '#f0c27e', dark = glow ? '#000' : '#2a1d12', ink = glow ? '#000' : '#1b130c';
  switch (c.kind) {
    case 'tower': {   // a tall campus tower: a lattice of panels, a few lit
      if (!glow) { ctx.fillStyle = '#d6c7ab'; ctx.fillRect(0, 0, W, H); }
      for (let j = 0; j < 12; j++) for (let i = 0; i < 4; i++) { const on = (i * 5 + j * 3) % 4 === 0; ctx.fillStyle = on ? lit : glow ? '#000' : '#4d3822'; const x = W * (0.08 + i * 0.22), y = H * (0.05 + j * 0.075); ctx.beginPath(); ctx.moveTo(x + W * 0.09, y); ctx.lineTo(x + W * 0.18, y + H * 0.032); ctx.lineTo(x + W * 0.09, y + H * 0.064); ctx.lineTo(x, y + H * 0.032); ctx.fill(); }
      ctx.fillStyle = glow ? '#7a4c1e' : '#b98a52'; ctx.fillRect(W * 0.3, H * 0.92, W * 0.4, H * 0.08); return;
    }
    case 'hall': {   // the lecture hall's front: tall windows
      if (!glow) { ctx.fillStyle = '#8a6a48'; ctx.fillRect(0, 0, W, H); }
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i === 2 ? (glow ? '#7a4c1e' : '#b98a52') : lit; ctx.fillRect(W * (0.05 + i * 0.158), H * 0.2, W * 0.1, H * 0.7); }
      return;
    }
    case 'board': {   // the chalkboard: OOP, and a class with its fields and methods
      ctx.fillStyle = glow ? '#0a0805' : '#22301f'; ctx.fillRect(0, 0, W, H);
      if (!glow) { ctx.strokeStyle = '#8e6a3d'; ctx.lineWidth = 5; ctx.strokeRect(2, 2, W - 4, H - 4); }
      ctx.fillStyle = glow ? '#5a5040' : '#e8e4d8'; ctx.strokeStyle = ctx.fillStyle; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(H * 0.26)}px ${SANS}`; ctx.letterSpacing = '2px'; ctx.fillText('OOP', W * 0.08, H * 0.3);
      ctx.lineWidth = 2; ctx.strokeRect(W * 0.55, H * 0.14, W * 0.36, H * 0.72); ctx.beginPath(); ctx.moveTo(W * 0.55, H * 0.36); ctx.lineTo(W * 0.91, H * 0.36); ctx.moveTo(W * 0.55, H * 0.6); ctx.lineTo(W * 0.91, H * 0.6); ctx.stroke();
      ctx.font = `500 ${Math.round(H * 0.11)}px ${MONO}`; ctx.letterSpacing = '0px'; ctx.fillText('SOLID', W * 0.08, H * 0.62); ctx.fillText('patterns', W * 0.08, H * 0.8); return;
    }
    case 'plaque': { if (!glow) { ctx.fillStyle = '#b08a52'; ctx.fillRect(0, 0, W, H); } ctx.fillStyle = glow ? '#3a2410' : '#2b1a10'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const s = fit(ctx, 'GPA 3.70', W * 0.84, H * 0.5, 700, SANS, 1); ctx.font = `700 ${s}px ${SANS}`; ctx.fillText('GPA 3.70', W / 2, H * 0.4); ctx.font = `500 ${Math.round(s * 0.42)}px ${MONO}`; ctx.letterSpacing = '2px'; ctx.fillText('OUT OF 4.00', W / 2, H * 0.78); return; }
    case 'arrow': { if (!glow) { ctx.fillStyle = '#efe4cf'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W * 0.82, 0); ctx.lineTo(W, H / 2); ctx.lineTo(W * 0.82, H); ctx.lineTo(0, H); ctx.fill(); } ctx.fillStyle = glow ? '#000' : '#2b1a10'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const s = fit(ctx, c.text, W * 0.7, H * 0.7, 700, c.text.length < 3 ? SANS : SANS, 1); ctx.font = `700 ${s}px ${SANS}`; ctx.fillText(c.text, W * 0.44, H * 0.56); return; }
    case 'station': { if (!glow) { ctx.fillStyle = '#1b130c'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = '#b08a52'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, W - 2, H - 2); } ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = glow ? '#ffc27a' : '#d9a05b'; ctx.font = `700 ${Math.round(H * 0.42)}px ${SANS}`; ctx.letterSpacing = '0px'; ctx.fillText(c.n, W * 0.16, H * 0.54); ctx.fillStyle = glow ? '#ffd9a6' : '#f1e2c8'; const s = fit(ctx, c.text, W * 0.66, H * 0.42, 700, SANS, 1); ctx.font = `700 ${s}px ${SANS}`; ctx.fillText(c.text, W * 0.6, H * 0.54); return; }
    case 'wire': { ctx.fillStyle = glow ? '#1c1007' : '#efe4cf'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = glow ? '#3a2410' : '#d9a05b'; ctx.fillRect(W * 0.08, H * 0.08, W * 0.84, H * 0.14); ctx.fillStyle = glow ? '#2a1a0c' : '#c9b48a'; ctx.fillRect(W * 0.08, H * 0.3, W * 0.5, H * 0.3); ctx.fillRect(W * 0.62, H * 0.3, W * 0.3, H * 0.13); ctx.fillRect(W * 0.62, H * 0.47, W * 0.3, H * 0.13); ctx.fillRect(W * 0.08, H * 0.68, W * 0.84, H * 0.08); ctx.fillRect(W * 0.08, H * 0.82, W * 0.5, H * 0.08); return; }
    case 'code': { ctx.fillStyle = glow ? '#1c1007' : '#120d09'; ctx.fillRect(0, 0, W, H); const cols = ['#d9a05b', '#e7ddc8', '#b5c48f', '#e59a74']; for (let j = 0; j < 7; j++) { ctx.fillStyle = glow ? ['#8a5a24', '#6a5a48', '#5a6a40', '#7a4a30'][j % 4] : cols[j % 4]; ctx.fillRect(W * (0.08 + (j % 3) * 0.08), H * (0.1 + j * 0.12), W * (0.3 + ((j * 37) % 5) * 0.1), H * 0.06); } return; }
    case 'workshop': { if (!glow) { ctx.fillStyle = '#1b130c'; ctx.fillRect(0, 0, W, H); } signBand(ctx, 0, 0, W, H, 'THE WORKSHOP', glow, 0.6); return; }
    case 'window': {   // the workshop window: the desk inside, three screens and a lamp
      ctx.fillStyle = glow ? '#b07a3c' : '#f2c27e'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = glow ? '#000' : '#3a2716'; ctx.fillRect(0, H * 0.72, W, H * 0.08); ctx.fillRect(W * 0.1, H * 0.8, W * 0.04, H * 0.2); ctx.fillRect(W * 0.86, H * 0.8, W * 0.04, H * 0.2);
      for (let i = 0; i < 3; i++) { const x = W * (0.2 + i * 0.22); ctx.fillStyle = glow ? '#000' : '#1b130c'; ctx.fillRect(x, H * 0.36, W * 0.19, H * 0.26); ctx.fillStyle = glow ? '#ffd9a6' : '#d9a05b'; ctx.fillRect(x + W * 0.015, H * 0.38, W * 0.16, H * 0.2); ctx.fillStyle = glow ? '#000' : '#1b130c'; ctx.fillRect(x + W * 0.085, H * 0.62, W * 0.02, H * 0.1); }
      if (!glow) { ctx.fillStyle = '#21160d'; ctx.fillRect(W / 2 - 1.5, 0, 3, H); ctx.fillRect(0, H * 0.3, W, 3); }
      return;
    }
    case 'flag': { ctx.fillStyle = glow ? '#3a1a08' : c.now ? '#d9a05b' : '#efe4cf'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = glow ? '#000' : '#2b1a10'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const s = fit(ctx, c.text, W * 0.86, H * 0.7, 700, SANS, 0); ctx.font = `700 ${s}px ${SANS}`; ctx.fillText(c.text, W / 2, H * 0.56); return; }
    case 'tv': { ctx.fillStyle = glow ? '#000' : '#a8865a'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = glow ? '#000' : '#5c4a3a'; ctx.lineWidth = 3; ctx.strokeRect(W * 0.2, H * 0.22, W * 0.6, H * 0.44); ctx.fillStyle = ctx.strokeStyle; ctx.fillRect(W * 0.42, H * 0.7, W * 0.16, H * 0.06); return; }
  }
  void ink; void dark;
}
function keyAtlas() {
  if (KEY_ATLAS) return KEY_ATLAS;
  const C = {
    tower: { w: 0.16, h: 0.48, kind: 'tower' }, hall: { w: 0.36, h: 0.14, kind: 'hall' }, board: { w: 0.18, h: 0.1, kind: 'board' }, plaque: { w: 0.12, h: 0.05, kind: 'plaque' },
    id: { w: 0.08, h: 0.025, kind: 'arrow', text: 'ID' }, en: { w: 0.08, h: 0.025, kind: 'arrow', text: 'EN' }, zh: { w: 0.08, h: 0.025, kind: 'arrow', text: '中文' },
    s1: { w: 0.2, h: 0.05, kind: 'station', n: '1', text: 'STRATEGY' }, s2: { w: 0.2, h: 0.05, kind: 'station', n: '2', text: 'DESIGN' }, s3: { w: 0.2, h: 0.05, kind: 'station', n: '3', text: 'DEVELOP' }, s4: { w: 0.2, h: 0.05, kind: 'station', n: '4', text: 'DEPLOY' },
    wire: { w: 0.1, h: 0.12, kind: 'wire' }, code: { w: 0.09, h: 0.06, kind: 'code' },
    workshop: { w: 0.5, h: 0.08, kind: 'workshop' }, window: { w: 0.36, h: 0.17, kind: 'window' },
    f23: { w: 0.09, h: 0.05, kind: 'flag', text: '2023' }, f24: { w: 0.09, h: 0.05, kind: 'flag', text: '2024' }, f25: { w: 0.09, h: 0.05, kind: 'flag', text: '2025' }, fnow: { w: 0.09, h: 0.05, kind: 'flag', text: 'NOW', now: true },
    tv: { w: 0.07, h: 0.05, kind: 'tv' },
  };
  // the cells are tiny on the board: draw them at a higher resolution than the districts' fronts
  const cells = Object.values(C).map((c) => ({ ...c, w: c.w * 2.4, h: c.h * 2.4, ref: c }));
  const tex = atlas(cells, (ctx, c, W, H, glow) => drawKey(ctx, c.ref, W, H, glow), 1024);
  for (const c of cells) c.ref.uv = c.uv;
  const mat = new Material({ color: [1, 1, 1], map: tex.map, emissiveMap: tex.emissiveMap, emissive: color('#ffc27a'), emissiveIntensity: 1.4, roughness: 0.7 });
  return (KEY_ATLAS = { C, mat });
}
// the height of a Blender surface under (x, z), from its triangles (the mountain on F8), or null outside it
function heightAt(meshes, x, z) {
  let best = null;
  for (const me of meshes) {
    const P = me.positions, I = me.indices; if (!P || !I) continue;
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      const d = (P[b + 2] - P[c + 2]) * (P[a] - P[c]) + (P[c] - P[b]) * (P[a + 2] - P[c + 2]); if (Math.abs(d) < 1e-9) continue;
      const l1 = ((P[b + 2] - P[c + 2]) * (x - P[c]) + (P[c] - P[b]) * (z - P[c + 2])) / d, l2 = ((P[c + 2] - P[a + 2]) * (x - P[c]) + (P[a] - P[c]) * (z - P[c + 2])) / d, l3 = 1 - l1 - l2;
      if (l1 < -1e-4 || l2 < -1e-4 || l3 < -1e-4) continue;
      const y = l1 * P[a + 1] + l2 * P[b + 1] + l3 * P[c + 1]; if (best === null || y > best) best = y;
    }
  }
  return best;
}
const KEYS = {
  // O: the campus, on the oak floor of its glass case (y 0.18, inside ±0.42, up to 0.86; the case's own lamp hangs at the centre)
  o: (root, A, live) => {
    const y = 0.18;
    put(root, box(0.8, 0.004, 0.8), plain('#4a5236', 0.95), [0, y + 0.002, 0]);
    put(root, box(0.8, 0.005, 0.06), plain('#c9b48a', 0.9), [0, y + 0.004, 0.1]); put(root, box(0.06, 0.005, 0.8), plain('#c9b48a', 0.9), [0.05, y + 0.004, 0]);
    // the tower, back left
    put(root, box(0.16, 0.48, 0.16), plain('#d6c7ab', 0.8), [-0.24, y + 0.24, -0.22]);
    for (const r of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { const g = new Node(); g.position = [-0.24, y + 0.24, -0.22]; g.rotation[1] = r; root.add(g); put(g, panel(0.16, 0.48, A.C.tower.uv), A.mat, [0, 0, 0.0815]).castShadow = false; }
    put(root, box(0.18, 0.02, 0.18), plain('#8e6a3d', 0.6, 0.3), [-0.24, y + 0.49, -0.22]);
    // the lecture hall, back right, with its lit front
    put(root, box(0.36, 0.14, 0.18), plain('#8a6a48', 0.85), [0.17, y + 0.07, -0.24]);
    put(root, panel(0.36, 0.14, A.C.hall.uv), A.mat, [0.17, y + 0.07, -0.149]).castShadow = false;
    put(root, gable(0.38, 0.06, 0.2), plain('#3a2417', 0.8), [0.17, y + 0.14, -0.24]);
    // the board in the courtyard, a teacher at it and three students in front of it
    put(root, box(0.19, 0.11, 0.008), plain('#4a3520', 0.7), [-0.03, y + 0.13, 0.17]);
    put(root, panel(0.18, 0.1, A.C.board.uv), A.mat, [-0.03, y + 0.13, 0.175]).castShadow = false;
    for (const dx of [-0.11, 0.05]) put(root, box(0.006, 0.08, 0.006), BRONZE(), [-0.03 + dx, y + 0.04, 0.17]);
    person(root, '#d9a05b', [0.1, y, 0.2], 1.1);
    for (const [px, pz, c] of [[-0.12, 0.32, '#e7ddc8'], [-0.02, 0.33, '#b8622c'], [0.08, 0.32, '#8e6a3d']]) person(root, c, [px, y, pz], 1.0);
    // the GPA plaque on a little stand, and the languages signpost
    put(root, box(0.13, 0.06, 0.012), plain('#2b1a10', 0.6), [0.27, y + 0.05, 0.16], [-0.4, 0, 0]);
    put(root, panel(0.12, 0.05, A.C.plaque.uv), A.mat, [0.27, y + 0.052, 0.167], [-0.4, 0, 0]).castShadow = false;
    put(root, box(0.006, 0.16, 0.006), BRONZE(), [0.3, y + 0.08, -0.02]);
    for (const [k, yy, r] of [['id', 0.15, 0.3], ['en', 0.12, -0.5], ['zh', 0.09, 1.2]]) { const g = new Node(); g.position = [0.3, y + yy, -0.02]; g.rotation[1] = r; root.add(g); put(g, box(0.084, 0.028, 0.004), plain('#2b1a10', 0.7), [0.04, 0, -0.003]); put(g, panel(0.08, 0.025, A.C[k].uv), A.mat, [0.04, 0, 0.0005]).castShadow = false; }
    tree(root, [-0.33, y, 0.12], 0.8, 0); tree(root, [0.36, y, -0.36], 0.7, 2);
  },
  // X: the field work, on the platform's grass (y 0.62, inside ±0.42, the rail along the front)
  x: (root, A, live) => {
    const y = 0.62;
    // the building with its outside stair, back
    put(root, box(0.42, 0.3, 0.2), plain('#8a7a66', 0.9), [0.08, y + 0.15, -0.26]);
    windowsRow(root, A, [0.08, y, -0.159]);
    const steps = 8;
    for (let i = 0; i < steps; i++) put(root, box(0.1, 0.012, 0.035), plain('#c9b48a', 0.85), [-0.22, y + 0.02 + i * 0.036, 0.04 - i * 0.032]);
    put(root, box(0.004, 0.3, 0.27), BRONZE(), [-0.27, y + 0.15, -0.08], [-0.85, 0, 0], [1, 1, 0.9]);
    put(root, box(0.1, 0.012, 0.1), plain('#c9b48a', 0.85), [-0.22, y + 0.3, -0.24]);
    // the crew of four, each with a TV on the stairs
    for (let i = 0; i < 4; i++) {
      const k = 1 + i * 2, py = y + 0.02 + k * 0.036, pz = 0.04 - k * 0.032;
      person(root, ['#d9a05b', '#e7ddc8', '#b8622c', '#8e6a3d'][i], [-0.22, py, pz], 0.95);
      put(root, box(0.07, 0.045, 0.012), plain('#15120f', 0.4, 0.2), [-0.22, py + 0.05, pz + 0.02]);
    }
    // TVs still in their boxes at the foot of the stairs
    for (const [bx, bz, r] of [[-0.33, 0.18, 0.2], [-0.27, 0.27, -0.3], [-0.34, 0.3, 0.6]]) { const g = new Node(); g.position = [bx, y, bz]; g.rotation[1] = r; root.add(g); put(g, box(0.075, 0.055, 0.016), plain('#a8865a', 0.9), [0, 0.028, 0]); put(g, panel(0.07, 0.05, A.C.tv.uv), A.mat, [0, 0.028, 0.0085]).castShadow = false; }
    // the laptop table: rows of open laptops being re-imaged, their screens lit
    put(root, box(0.3, 0.012, 0.16), plain('#4a3520', 0.7), [0.2, y + 0.07, 0.18]);
    for (const dx of [-0.13, 0.13]) for (const dz of [-0.06, 0.06]) put(root, box(0.008, 0.066, 0.008), BRONZE(), [0.2 + dx, y + 0.033, 0.18 + dz]);
    const scr = GLOW();
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { const lx = 0.2 - 0.12 + c * 0.06, lz = 0.18 - 0.05 + r * 0.05; put(root, box(0.04, 0.003, 0.028), plain('#3b3a33', 0.4, 0.4), [lx, y + 0.078, lz]); put(root, box(0.04, 0.026, 0.003), scr, [lx, y + 0.092, lz - 0.014], [-0.25, 0, 0]).castShadow = false; }
    for (let i = 0; i < 3; i++) put(root, box(0.07, 0.04, 0.05), plain('#a8865a', 0.9), [0.37, y + 0.02 + i * 0.041, -0.02 + (i % 2) * 0.01]);
    person(root, '#5c4a3a', [0.2, y, 0.3], 1.0);
    return [[[-0.4, y, -0.38], [0.4, y + 0.34, 0.06]], [[-0.4, y, 0.06], [0.42, y + 0.12, 0.38]]];
  },
  // ]: the process, on the walnut (y 0.33, inside ±0.42): a belt across the middle, four stations behind it, their signs in front
  rbr: (root, A, live) => {
    const y = 0.33;
    put(root, box(0.84, 0.03, 0.08), plain('#1c1712', 0.5, 0.3), [0, y + 0.015, 0.04]);
    for (const dz of [-0.044, 0.044]) put(root, box(0.84, 0.012, 0.008), BRASS(), [0, y + 0.032, 0.04 + dz]);
    for (let i = 0; i < 9; i++) put(root, cylinder(0.012, 0.012, 0.08, 8), plain('#3b3a33', 0.4, 0.5), [-0.4 + i * 0.1, y + 0.03, 0.04], [Math.PI / 2, 0, 0]);
    const xs = [-0.3, -0.1, 0.1, 0.3];
    // 1 strategy: a drafting table with the plan on it
    put(root, box(0.15, 0.008, 0.11), plain('#efe4cf', 0.85), [xs[0], y + 0.1, -0.16], [0.5, 0, 0]);
    for (let i = 0; i < 3; i++) put(root, box(0.1, 0.002, 0.006), plain('#4d3822', 0.8), [xs[0], y + 0.105 + i * 0.012, -0.17 + i * 0.022], [0.5, 0, 0]);
    put(root, box(0.008, 0.1, 0.008), BRONZE(), [xs[0], y + 0.05, -0.16]);
    // 2 design: an easel with a layout on it
    put(root, fuse([[box(0.006, 0.2, 0.006), [-0.04, 0.1, 0], [0.12, 0, 0.15]], [box(0.006, 0.2, 0.006), [0.04, 0.1, 0], [0.12, 0, -0.15]], [box(0.006, 0.18, 0.006), [0, 0.09, -0.05], [-0.35, 0, 0]]]), plain('#8e6a3d', 0.7), [xs[1], y, -0.16]);
    put(root, panel(0.1, 0.12, A.C.wire.uv), A.mat, [xs[1], y + 0.15, -0.145], [-0.12, 0, 0]).castShadow = false;
    // 3 develop: a desk, a lit screen with code, a chair
    put(root, box(0.15, 0.008, 0.08), plain('#4a3520', 0.7), [xs[2], y + 0.07, -0.16]);
    for (const dx of [-0.065, 0.065]) put(root, box(0.006, 0.07, 0.07), BRONZE(), [xs[2] + dx, y + 0.035, -0.16]);
    put(root, box(0.1, 0.07, 0.008), plain('#15120f', 0.3, 0.3), [xs[2], y + 0.12, -0.185]);
    put(root, panel(0.09, 0.06, A.C.code.uv), A.mat, [xs[2], y + 0.12, -0.18]).castShadow = false;
    // 4 deploy: a rocket on its pad, ready
    put(root, cylinder(0.06, 0.07, 0.02, 12), plain('#3b3a33', 0.6, 0.3), [xs[3], y + 0.01, -0.16]);
    const rocket = new Node('rocket'); rocket.position = [xs[3], y + 0.02, -0.16]; rocket.userData.dynamic = true; root.add(rocket);
    put(rocket, fuse([[cylinder(0.022, 0.024, 0.13, 12), [0, 0.085, 0]], [cone(0.022, 0.05, 12), [0, 0.175, 0]]]), plain('#efe4cf', 0.5), [0, 0, 0]);
    put(rocket, fuse([[box(0.004, 0.04, 0.03), [0.022, 0.035, 0], [0, 0, -0.3]], [box(0.004, 0.04, 0.03), [-0.022, 0.035, 0], [0, 0, 0.3]], [box(0.03, 0.04, 0.004), [0, 0.035, 0.022], [0.3, 0, 0]], [box(0.025, 0.012, 0.003), [0, 0.11, 0.023]]]), plain('#b8622c', 0.6), [0, 0, 0]);
    put(rocket, cone(0.016, 0.03, 10), M('flame', { color: [1, 0.7, 0.3], emissive: color('#ffb766'), emissiveIntensity: 2.5 }), [0, 0.0, 0], [Math.PI, 0, 0]).castShadow = false;
    live.push((t) => { rocket.position[1] = y + 0.02 + Math.max(0, Math.sin(t * 0.9)) * 0.008; });
    // the signs along the front edge
    for (let i = 0; i < 4; i++) { put(root, box(0.204, 0.054, 0.01), plain('#2b1a10', 0.7), [xs[i], y + 0.035, 0.32], [-0.5, 0, 0]); put(root, panel(0.2, 0.05, A.C['s' + (i + 1)].uv), A.mat, [xs[i], y + 0.038, 0.326], [-0.5, 0, 0]).castShadow = false; }
    // the parcel riding the belt from the plan to the pad, again and again
    const parcel = put(root, box(0.045, 0.035, 0.04), plain('#a8865a', 0.85), [-0.38, y + 0.055, 0.04]); parcel.userData.dynamic = true;
    live.push((t) => { const k = (t * 0.12) % 1; parcel.position[0] = -0.38 + k * 0.76; const s = Math.min(1, Math.min(k, 1 - k) * 12); parcel.scale = [s, s, s]; });
  },
  // Enter: the workshop, on the cream base (y 0.52, x ±1.05, z ±0.43); kept low on its left half so the ] key behind stays in view
  enter: (root, A, live) => {
    const y = 0.52;
    put(root, box(1.9, 0.006, 0.7), plain('#4a3b2c', 0.95), [0.05, y + 0.003, -0.05]);
    // the studio: two storeys, the desk in the big window, the name over the door, a pitched roof with a skylight
    const sx = 0.42;
    put(root, box(0.74, 0.36, 0.4), plain('#5a4330', 0.9), [sx, y + 0.18, -0.16]);
    put(root, panel(0.36, 0.17, A.C.window.uv), A.mat, [sx - 0.12, y + 0.12, 0.0415]).castShadow = false;
    put(root, box(0.38, 0.012, 0.02), plain('#2b1a10', 0.7), [sx - 0.12, y + 0.212, 0.05]);
    put(root, box(0.1, 0.18, 0.006), plain('#3a2716', 0.7), [sx + 0.22, y + 0.09, 0.043]);
    put(root, box(0.51, 0.09, 0.008), plain('#2b1a10', 0.7), [sx, y + 0.29, 0.042]);
    put(root, panel(0.5, 0.08, A.C.workshop.uv), A.mat, [sx, y + 0.29, 0.047]).castShadow = false;
    put(root, gable(0.78, 0.12, 0.44), plain('#3a2417', 0.8), [sx, y + 0.36, -0.16]);
    put(root, box(0.16, 0.006, 0.12), GLOW(), [sx + 0.12, y + 0.42, -0.1], [0.5, 0, 0]).castShadow = false;
    put(root, cylinder(0.02, 0.022, 0.12, 8), plain('#6b4f36', 0.9), [sx - 0.26, y + 0.46, -0.24]);
    // out front, between the two: the workbench under an awning with its jars and the sketch board; further left only low
    // things (plants, the road bike), since the ] key stands right behind the left half of this key
    const bx = -0.17;
    put(root, box(0.3, 0.012, 0.12), plain('#4a3520', 0.7), [bx, y + 0.08, -0.05]);
    for (const dx of [-0.13, 0.13]) put(root, box(0.01, 0.08, 0.1), BRONZE(), [bx + dx, y + 0.04, -0.05]);
    for (let i = 0; i < 4; i++) put(root, cylinder(0.012, 0.012, 0.03, 8), plain(['#b8622c', '#efe4cf', '#d9a05b', '#66703e'][i], 0.6), [bx - 0.1 + i * 0.06, y + 0.1, -0.06]);
    put(root, box(0.36, 0.008, 0.18), plain('#7a4a2a', 0.9), [bx, y + 0.2, -0.03], [0.25, 0, 0]);
    for (const dx of [-0.17, 0.17]) put(root, box(0.006, 0.2, 0.006), BRONZE(), [bx + dx, y + 0.1, 0.05]);
    put(root, box(0.16, 0.11, 0.008), plain('#efe4cf', 0.9), [bx - 0.02, y + 0.12, -0.16]);
    for (let i = 0; i < 3; i++) put(root, box(0.04, 0.03, 0.002), plain('#8e6a3d', 0.9), [bx - 0.07 + i * 0.05, y + 0.13 + (i % 2) * 0.02, -0.155]);
    for (const [px, pz, s, k] of [[-0.9, -0.22, 1.2, 0], [-0.84, 0.12, 0.9, 1], [-0.62, -0.28, 0.8, 2], [0.86, 0.12, 1, 3]]) bush(root, [px, y, pz], s, k);
    const bike = new Node('bike'); bike.position = [-0.55, y, 0.1]; bike.rotation[1] = 0.15; root.add(bike);
    const blk = plain('#15120f', 0.4, 0.4);
    for (const dx of [-0.05, 0.05]) put(bike, torus(0.03, 0.004, 16, 4), blk, [dx, 0.034, 0]);
    put(bike, fuse([[box(0.07, 0.004, 0.004), [0, 0.06, 0], [0, 0, 0.3]], [box(0.004, 0.05, 0.004), [-0.015, 0.05, 0]], [box(0.02, 0.004, 0.01), [-0.02, 0.078, 0]], [box(0.004, 0.04, 0.03), [0.045, 0.07, 0]]]), blk, [0, 0, 0]);
    person(root, '#d9a05b', [-0.05, y, 0.1], 1.1);
    return [[[-1.0, y, -0.4], [-0.38, y + 0.08, 0.3]], [[-0.38, y, -0.4], [0.03, y + 0.24, 0.3]], [[0.03, y, -0.4], [0.82, y + 0.5, 0.06]]];
  },
  // F8: the mountain stays as it was built; a flag goes up at every camp, from the foot to the summit, and a trail joins them
  f8: (root, A, live, json) => {
    const shells = json.meshes.filter((m) => m.name === 'shell' && /Rock|Grass|Cream/.test(m.material?.name || ''));
    const camps = [[0.3, 0.28, 'f23'], [0.2, -0.04, 'f24'], [-0.06, -0.2, 'f25'], [-0.235, -0.24, 'fnow']];
    const yAt = (x, z) => heightAt(shells, x, z);
    let last = null;
    for (const [x, z, k] of camps) {
      const h = yAt(x, z); if (h === null) continue;
      put(root, box(0.004, 0.13, 0.004), BRONZE(), [x, h + 0.065, z]);
      put(root, panel(0.09, 0.05, A.C[k].uv), A.mat, [x + 0.047, h + 0.102, z + 0.003]).castShadow = false;
      put(root, box(0.092, 0.052, 0.002), plain('#2b1a10', 0.8), [x + 0.047, h + 0.102, z - 0.0005]);
      if (last) for (let i = 1; i < 6; i++) { const f = i / 6, tx = last[0] + (x - last[0]) * f, tz = last[1] + (z - last[1]) * f, ty = yAt(tx, tz); if (ty !== null) put(root, sphere(0.006, 5, 4), M('trail', { color: [1, 0.85, 0.6], emissive: color('#ffd29a'), emissiveIntensity: 1.2 }), [tx, ty + 0.006, tz]).castShadow = false; }
      last = [x, z];
    }
  },
};
function windowsRow(root, A, p) { for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) put(root, box(0.05, 0.05, 0.004), (i + j) % 3 ? GLOW() : plain('#2a1d12', 0.6), [p[0] - 0.15 + i * 0.1, p[1] + 0.1 + j * 0.1, p[2]]); }
/** How a key is built here: 'replace' keeps only its Blender shell, 'add' keeps all of it and builds on top, null leaves it alone. */
export const keyBuiltHere = (id) => (id === 'f8' ? 'add' : KEYS[id] ? 'replace' : null);
/** Build a key's miniature (merged), with one tight click volume for it; json is the key's Blender asset (F8 reads its mountain). */
export function buildKeyMini(id, json) {
  const make = KEYS[id]; if (!make) return null;
  const root = new Node('keymini:' + id), live = [], A = keyAtlas();
  const boxes = make(root, A, live, json);
  // tight click volumes (the shell has its own): the builder's own, or one box over what was built
  const hits = [];
  if (boxes) for (const [a, b] of boxes) hits.push(hitBox(root, a, b, {}));
  else {
    root.updateWorld(); const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    root.traverse((n) => { if (!n.geometry) return; const b = n.geometry.bounds; for (const cx of [b.min[0], b.max[0]]) for (const cy of [b.min[1], b.max[1]]) for (const cz of [b.min[2], b.max[2]]) { const p = n.localToWorld([cx, cy, cz]); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], p[k]); mx[k] = Math.max(mx[k], p[k]); } } });
    if (mn[0] < Infinity) hits.push(hitBox(root, mn, mx, {}));
  }
  flatten(root, `keymini:${id}`);
  const mats = atlasMerge(root, `keymini:${id}`);
  return { root, mats, hits, update: (dt, t) => { for (const f of live) f(t); } };
}

/** A copy of a Blender asset with some parts squashed toward the ground (y about baseY): a tree that grew too tall for its
 *  key and stood in front of the one behind it. test(mesh, bounds) picks the parts. */
export function lowerParts(json, test, factor, baseY) {
  return { ...json, meshes: json.meshes.map((me) => {
    const P = me.positions; if (!(P instanceof Float32Array)) return me;
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], P[i + k]); mx[k] = Math.max(mx[k], P[i + k]); }
    if (!test(me, { min: mn, max: mx })) return me;
    const Q = new Float32Array(P); for (let i = 1; i < Q.length; i += 3) Q[i] = baseY + (Q[i] - baseY) * factor;
    return { ...me, positions: Q };
  }) };
}
