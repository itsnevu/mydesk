// Miniature asset library, one coherent language for all worlds: warm wood, painted metal, bronze, cream paper,
// frosted glass. Everything is procedural and reusable; builders return Nodes ready to place.
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, cylinder, torus, sphere, cone } from 'engine/geometry';
import { drawTexture, noiseTexture, MONO, SANS } from 'engine/textures';
import { color } from 'engine/math';
import { T, C, MAT } from 'app/theme';

const m = (o) => new Material(o);
export const add = (parent, mesh, pos, rot, scale) => { if (pos) mesh.position = pos; if (rot) mesh.rotation = rot; if (scale) mesh.scale = scale; parent.add(mesh); return mesh; };
export function seeded(seed) { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- shared materials (few, reused)
export const PAL = {
  plaster: ['#6b4f36', '#5a4330', '#7a5a3e', '#4d3a2a', '#8a6a48'],
  paint: ['#3b2b1d', '#2e2418', '#43301f', '#5c4a3a'],
  roof: ['#3a2417', '#2b1a10', '#4a2e1c', '#5a3a22'],
  trim: MAT.bronzeDark,
  glassWarm: { color: [1, 1, 1], emissive: color('#ffc98a'), emissiveIntensity: 0.55, unlit: true },
  foliage: ['#56603a', '#66703e', '#7a8446', '#4a5236'],
};
const matCache = new Map();
export const mat = (key, o) => { if (!matCache.has(key)) matCache.set(key, m(o)); return matCache.get(key); };
const plasterMat = (i) => mat('plaster' + i, { color: color(PAL.plaster[i % PAL.plaster.length]), roughness: 0.92 });
const roofMat = (i) => mat('roof' + i, { color: color(PAL.roof[i % PAL.roof.length]), roughness: 0.8 });
const paintMat = (i) => mat('paint' + i, { color: color(PAL.paint[i % PAL.paint.length]), roughness: 0.7, metalness: 0.15 });
const trimMat = () => mat('trim', MAT.bronzeDark);
const bronzeMat = () => mat('bronze', MAT.bronze);
const woodMat = () => mat('wood', { ...MAT.walnut, color: color('#4a3520') });
const paperMat = () => mat('paper', MAT.paper);
const foliageMat = (i) => mat('fol' + i, { color: color(PAL.foliage[i % PAL.foliage.length]), roughness: 0.85 });
const glassMat = () => mat('glassWarm', PAL.glassWarm);
const darkGlass = () => mat('glassDark', { color: color('#1a130c'), roughness: 0.2, metalness: 0.3 });

// ---------- façade texture: windows drawn onto a wall (lit / unlit mix), doors, trims
const facadeCache = new Map();
function facadeTexture(cols, rows, seed, hue = 30) {
  const key = `${cols}x${rows}:${seed}`;
  if (facadeCache.has(key)) return facadeCache.get(key);
  const rnd = seeded(seed);
  const W = 256 * Math.max(1, Math.round(cols / 2)), H = 256 * Math.max(1, Math.round(rows / 2));
  const tex = drawTexture(W, H, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    const cw = w / cols, rh = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cw + cw * 0.28, y = r * rh + rh * 0.22, ww = cw * 0.44, wh = rh * 0.5;
      const lit = rnd() > 0.45;
      ctx.fillStyle = 'rgba(40,26,12,0.9)'; ctx.fillRect(x - 3, y - 3, ww + 6, wh + 6); // frame
      ctx.fillStyle = lit ? `hsl(${hue} 80% ${62 + rnd() * 18}%)` : 'rgba(20,14,8,1)'; ctx.fillRect(x, y, ww, wh);
      ctx.strokeStyle = 'rgba(40,26,12,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + ww / 2, y); ctx.lineTo(x + ww / 2, y + wh); ctx.moveTo(x, y + wh / 2); ctx.lineTo(x + ww, y + wh / 2); ctx.stroke();
    }
    // grime
    const img = ctx.getImageData(0, 0, w, h); const d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    ctx.putImageData(img, 0, 0);
  });
  const em = drawTexture(W, H, (ctx, w, h) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    const rnd2 = seeded(seed); const cw = w / cols, rh = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = c * cw + cw * 0.28, y = r * rh + rh * 0.22; const lit = rnd2() > 0.45; if (lit) { ctx.fillStyle = `hsl(${hue} 85% ${60 + rnd2() * 20}%)`; ctx.fillRect(x, y, cw * 0.44, rh * 0.5); } else { rnd2(); } }
  }, { srgb: false });
  const out = { map: tex, emissiveMap: em };
  facadeCache.set(key, out);
  return out;
}

/**
 * Building: plaster body with windowed façades, trim band, roof variant (flat/gable/hip/terrace), optional awning, sign, balcony.
 * opts: { w, d, h, floors, roof, seed, awning, sign, balcony, chimney, base }
 */
export function building({ w = 3, d = 3, h = 3, floors = 2, roof = 'gable', seed = 1, awning = false, sign = null, balcony = false, chimney = false, door = true, tower = false, lite = false } = {}) {
  if (lite) { awning = false; balcony = false; door = false; sign = null; chimney = false; }
  const g = new Node('building'); const rnd = seeded(seed * 7 + 3);
  const cols = Math.max(1, Math.round(w / 1.1));
  const fac = facadeTexture(cols, floors, seed);
  const bodyMat = m({ color: color(PAL.plaster[seed % PAL.plaster.length]), roughness: 0.9, map: fac.map, emissive: color('#ffc98a'), emissiveIntensity: 0.9, emissiveMap: fac.emissiveMap });
  const body = add(g, new Mesh(roundedBox({ w, h, d, r: 0.03, seg: 1, uvTopOnly: false }), bodyMat), [0, h / 2, 0]);
  // plinth + trim band
  add(g, new Mesh(box(w + 0.12, 0.16, d + 0.12), trimMat()), [0, 0.08, 0]);
  if (!lite) add(g, new Mesh(box(w + 0.08, 0.08, d + 0.08), trimMat()), [0, h - 0.02, 0]);
  if (door) { add(g, new Mesh(box(0.6, 1.0, 0.06), woodMat()), [-w / 2 + 0.9, 0.5, d / 2 + 0.02]); add(g, new Mesh(box(0.14, 0.9, 0.02), glassMat()), [-w / 2 + 0.9 + 0.2, 0.55, d / 2 + 0.06]).castShadow = false; }
  if (awning) { const aw = add(g, new Mesh(box(w * 0.55, 0.05, 0.9), m({ color: color(['#b8622c', '#8e6a3d', '#6b4f36'][seed % 3]), roughness: 0.9 })), [w * 0.1, 1.45, d / 2 + 0.42], [0.25, 0, 0]); for (const dx of [-w * 0.24, w * 0.24]) add(g, new Mesh(cylinder(0.025, 0.025, 0.7, 6), bronzeMat()), [w * 0.1 + dx, 1.18, d / 2 + 0.8], [0.4, 0, 0]); }
  if (balcony) { add(g, new Mesh(box(w * 0.5, 0.06, 0.6), woodMat()), [0, h * 0.55, d / 2 + 0.3]); for (let i = 0; i <= 4; i++) add(g, new Mesh(cylinder(0.02, 0.02, 0.5, 5), bronzeMat()), [-w * 0.25 + i * (w * 0.5 / 4), h * 0.55 + 0.27, d / 2 + 0.58]); add(g, new Mesh(box(w * 0.5, 0.03, 0.03), bronzeMat()), [0, h * 0.55 + 0.52, d / 2 + 0.58]); }
  if (roof === 'gable') { const rh = 0.5 + rnd() * 0.5; const R = (d + 0.3) / 1.732; const sy = rh / (1.5 * R); const prism = add(g, new Mesh(cylinder(R, R, w + 0.3, 3), roofMat(seed)), [0, 0, 0], [0, 0, Math.PI / 2]); const wrap = new Node('roof'); wrap.position = [0, h + 0.5 * R * sy, 0]; wrap.scale = [1, sy, 1]; g.add(wrap); g.children.splice(g.children.indexOf(prism), 1); prism.position = [0, 0, 0]; wrap.add(prism); add(g, new Mesh(box(w + 0.34, 0.06, 0.08), bronzeMat()), [0, h + rh + 0.02, 0]); }
  else if (roof === 'hip') { const rh = 0.6; add(g, new Mesh(cone(Math.hypot(w, d) / 2 + 0.2, rh, 4), roofMat(seed)), [0, h + rh / 2, 0], [0, Math.PI / 4, 0], [w / Math.hypot(w, d) * 1.42, 1, d / Math.hypot(w, d) * 1.42]); }
  else if (roof === 'terrace') { add(g, new Mesh(box(w + 0.2, 0.12, d + 0.2), trimMat()), [0, h + 0.06, 0]); for (const [dx, dz] of [[-w / 2 + 0.3, -d / 2 + 0.3], [w / 2 - 0.3, -d / 2 + 0.3]]) { add(g, new Mesh(cylinder(0.22, 0.2, 0.4, 10), m({ color: color('#7a4a2e'), roughness: 0.85 })), [dx, h + 0.32, dz]); add(g, new Mesh(sphere(0.32, 8, 6), foliageMat(seed)), [dx, h + 0.7, dz]); } add(g, new Mesh(box(w * 0.4, 0.5, 0.05), m({ color: color('#d9c9a8'), roughness: 0.9 })), [w * 0.15, h + 0.37, d / 2 - 0.1]); }
  else { add(g, new Mesh(box(w + 0.2, 0.14, d + 0.2), trimMat()), [0, h + 0.07, 0]); if (chimney) add(g, new Mesh(box(0.35, 0.7, 0.35), plasterMat(seed + 2)), [w / 2 - 0.5, h + 0.4, -d / 2 + 0.5]); }
  if (chimney && roof === 'gable') add(g, new Mesh(box(0.32, 0.9, 0.32), plasterMat(seed + 2)), [w / 2 - 0.5, h + 0.45, -d / 4]);
  if (tower) { const tw = Math.min(w, d) * 0.5; add(g, new Mesh(box(tw, 2.2, tw), plasterMat(seed + 3)), [w / 2 - tw / 2, h + 1.1, -d / 2 + tw / 2]); add(g, new Mesh(cone(tw * 0.8, 1.2, 4), roofMat(seed + 1)), [w / 2 - tw / 2, h + 2.8, -d / 2 + tw / 2], [0, Math.PI / 4, 0]); add(g, new Mesh(box(tw * 0.5, 0.4, 0.02), glassMat()), [w / 2 - tw / 2, h + 1.4, -d / 2 + tw + 0.01]).castShadow = false; }
  if (sign) { const st = signTexture(sign); add(g, new Mesh(box(Math.min(w * 0.7, 2.4), 0.55, 0.05), m({ ...MAT.paper, color: color('#d9c9a8'), map: st, emissive: C.highlight, emissiveIntensity: 0.15 })), [w * 0.05, 1.9, d / 2 + 0.05]); }
  // a few practical lights along the façade
  if (!lite) add(g, new Mesh(sphere(0.08, 6, 4), m({ color: [1, 1, 1], emissive: color(T.tungsten), emissiveIntensity: 2.2, unlit: true })), [w / 2 - 0.4, 1.4, d / 2 + 0.1]).castShadow = false;
  g.userData.size = { w, h, d };
  return g;
}
const signCache = new Map();
function signTexture(text) { if (!signCache.has(text)) signCache.set(text, drawTexture(512, 128, (ctx, w, h) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = 'rgba(40,26,12,0.92)'; ctx.font = `700 64px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '6px'; ctx.fillText(text.toUpperCase(), w / 2, h / 2); })); return signCache.get(text); }

// ---------- vegetation
export function tree(kind = 0, seed = 1, s = 1) {
  const g = new Node('tree'); const rnd = seeded(seed);
  const trunk = mat('trunk', { color: color('#3a2716'), roughness: 0.9 });
  if (kind === 0) { // round canopy
    add(g, new Mesh(cylinder(0.08, 0.12, 1.2, 7), trunk), [0, 0.6, 0]);
    for (let i = 0; i < 4; i++) add(g, new Mesh(sphere(0.55 + rnd() * 0.25, 9, 7), foliageMat(seed + i)), [(rnd() - 0.5) * 0.7, 1.5 + rnd() * 0.6, (rnd() - 0.5) * 0.7]);
  } else if (kind === 1) { // conifer
    add(g, new Mesh(cylinder(0.06, 0.1, 0.8, 7), trunk), [0, 0.4, 0]);
    for (let i = 0; i < 3; i++) add(g, new Mesh(cone(0.75 - i * 0.18, 0.9, 8), foliageMat(seed + i)), [0, 0.9 + i * 0.55, 0]);
  } else if (kind === 2) { // tall slender
    add(g, new Mesh(cylinder(0.07, 0.1, 2.2, 7), trunk), [0, 1.1, 0]);
    add(g, new Mesh(sphere(0.5, 9, 7), foliageMat(seed)), [0, 2.4, 0], null, [1, 1.6, 1]);
  } else { // shrub cluster
    for (let i = 0; i < 5; i++) add(g, new Mesh(sphere(0.28 + rnd() * 0.16, 8, 6), foliageMat(seed + i)), [(rnd() - 0.5) * 0.9, 0.25 + rnd() * 0.2, (rnd() - 0.5) * 0.9]);
  }
  g.scale = [s, s, s]; g.rotation[1] = rnd() * 6.28;
  return g;
}
export function planter(seed = 1) { const g = new Node('planter'); add(g, new Mesh(roundedBox({ w: 1.2, h: 0.5, d: 0.5, r: 0.04, seg: 2 }), paintMat(seed)), [0, 0.25, 0]); for (let i = 0; i < 3; i++) add(g, new Mesh(sphere(0.22, 7, 5), foliageMat(seed + i)), [-0.35 + i * 0.35, 0.6, 0]); return g; }

// ---------- street furniture & props
export function lampPost(h = 2.4) { const g = new Node('lamp'); add(g, new Mesh(cylinder(0.04, 0.06, h, 8), bronzeMat()), [0, h / 2, 0]); add(g, new Mesh(box(0.5, 0.04, 0.04), bronzeMat()), [0.2, h, 0]); add(g, new Mesh(cone(0.18, 0.2, 10), trimMat()), [0.42, h - 0.08, 0], [Math.PI, 0, 0]); add(g, new Mesh(sphere(0.09, 8, 6), m({ color: [1, 1, 1], emissive: color(T.tungsten), emissiveIntensity: 2.6, unlit: true })), [0.42, h - 0.2, 0]).castShadow = false; g.userData.light = [0.42, h - 0.2, 0]; return g; }
export function bench() { const g = new Node('bench'); add(g, new Mesh(box(1.4, 0.06, 0.45), woodMat()), [0, 0.45, 0]); add(g, new Mesh(box(1.4, 0.4, 0.05), woodMat()), [0, 0.75, -0.2], [-0.15, 0, 0]); for (const dx of [-0.6, 0.6]) add(g, new Mesh(box(0.06, 0.45, 0.4), bronzeMat()), [dx, 0.22, 0]); return g; }
export function crate(seed = 1, s = 1) { const g = new Node('crate'); add(g, new Mesh(roundedBox({ w: 0.7, h: 0.7, d: 0.7, r: 0.03, seg: 2 }), mat('crate', { color: color('#8a6a48'), roughness: 0.85, map: noiseTexture(64, [150, 120, 90], 30), mapRepeat: [1, 1] })), [0, 0.35, 0], [0, seeded(seed)() * 1.2, 0]); g.scale = [s, s, s]; return g; }
export function cart(seed = 1) { const g = new Node('cart'); add(g, new Mesh(box(1.2, 0.5, 0.7), woodMat()), [0, 0.6, 0]); for (const dx of [-0.4, 0.4]) add(g, new Mesh(cylinder(0.22, 0.22, 0.06, 12), bronzeMat()), [dx, 0.22, 0.38], [Math.PI / 2, 0, 0]); add(g, new Mesh(box(1.3, 0.05, 0.9), m({ color: color(['#b8622c', '#8e6a3d'][seed % 2]), roughness: 0.9 })), [0, 1.35, 0]); for (const dx of [-0.55, 0.55]) add(g, new Mesh(cylinder(0.02, 0.02, 0.5, 5), bronzeMat()), [dx, 1.1, 0.3]); for (let i = 0; i < 4; i++) add(g, new Mesh(sphere(0.1, 6, 4), m({ color: color(['#c96f3f', '#d9a05b', '#a06a3e', '#e7ddc8'][i]), roughness: 0.8 })), [-0.4 + i * 0.26, 0.92, 0.05]); return g; }
export function bicycle() { const g = new Node('bike'); for (const dx of [-0.42, 0.42]) add(g, new Mesh(torus(0.3, 0.025, 20, 6), trimMat()), [dx, 0.3, 0], [0, Math.PI / 2, 0]); add(g, new Mesh(box(0.7, 0.03, 0.03), bronzeMat()), [0, 0.5, 0], [0, 0, 0.35]); add(g, new Mesh(box(0.03, 0.4, 0.03), bronzeMat()), [0.2, 0.62, 0]); add(g, new Mesh(box(0.25, 0.04, 0.1), woodMat()), [-0.2, 0.78, 0]); return g; }
export function signPost(text, h = 2.0) { const g = new Node('signpost'); add(g, new Mesh(cylinder(0.03, 0.03, h, 6), bronzeMat()), [0, h / 2, 0]); add(g, new Mesh(box(1.1, 0.34, 0.04), m({ ...MAT.paper, color: color('#d9c9a8'), map: signTexture(text) })), [0.35, h - 0.3, 0]); return g; }
export function stackedBooks(seed = 1) { const g = new Node('books'); const rnd = seeded(seed); for (let i = 0; i < 4; i++) add(g, new Mesh(box(0.5 + rnd() * 0.2, 0.09, 0.35 + rnd() * 0.1), m({ color: color(['#5c4a3a', '#8e6a3d', '#b8622c', '#3b2b1d'][i]), roughness: 0.8 })), [rnd() * 0.06, 0.05 + i * 0.09, rnd() * 0.05], [0, (rnd() - 0.5) * 0.5, 0]); return g; }
export function shelfUnit(w = 3, h = 4, seed = 1) { const g = new Node('shelf'); const rnd = seeded(seed); for (const dx of [-w / 2, w / 2]) add(g, new Mesh(box(0.1, h, 0.5), woodMat()), [dx, h / 2, 0]); const n = Math.floor(h / 0.9); for (let i = 0; i <= n; i++) { const y = 0.1 + i * 0.9; add(g, new Mesh(box(w, 0.06, 0.5), woodMat()), [0, y, 0]); if (i < n) { let x = -w / 2 + 0.3; while (x < w / 2 - 0.3) { const kind = rnd(); if (kind < 0.5) { const bw = 0.15 + rnd() * 0.1, bh = 0.45 + rnd() * 0.3; add(g, new Mesh(box(bw, bh, 0.4), m({ color: color(['#5c4a3a', '#8e6a3d', '#b8622c', '#3b2b1d', '#d9c9a8'][Math.floor(rnd() * 5)]), roughness: 0.85 })), [x + bw / 2, y + bh / 2 + 0.03, 0]); x += bw + 0.03; } else if (kind < 0.7) { add(g, new Mesh(roundedBox({ w: 0.45, h: 0.35, d: 0.4, r: 0.03, seg: 1 }), paintMat(Math.floor(rnd() * 4))), [x + 0.25, y + 0.2, 0]); x += 0.55; } else if (kind < 0.85) { add(g, new Mesh(cylinder(0.12, 0.1, 0.3, 10), m({ color: color('#7a4a2e'), roughness: 0.85 })), [x + 0.15, y + 0.18, 0]); add(g, new Mesh(sphere(0.18, 7, 5), foliageMat(1)), [x + 0.15, y + 0.42, 0]); x += 0.4; } else x += 0.3 + rnd() * 0.4; } } } return g; }
export function tower(h = 6, seed = 1) { const g = new Node('tower'); add(g, new Mesh(cylinder(0.5, 0.7, 0.4, 12), trimMat()), [0, 0.2, 0]); for (let i = 0; i < 3; i++) add(g, new Mesh(cylinder(0.08 - i * 0.015, 0.1 - i * 0.015, h / 3, 8), bronzeMat()), [0, 0.4 + h / 6 + i * (h / 3), 0]); for (let i = 1; i < 4; i++) add(g, new Mesh(torus(0.3 + (3 - i) * 0.12, 0.02, 14, 5), bronzeMat()), [0, 0.4 + i * (h / 3.2), 0]); add(g, new Mesh(sphere(0.12, 8, 6), m({ color: [1, 1, 1], emissive: color('#ff7a3a'), emissiveIntensity: 2.2, unlit: true })), [0, h + 0.5, 0]).castShadow = false; add(g, new Mesh(sphere(0.35, 10, 8), m({ ...MAT.bronze, roughness: 0.3 })), [0, h * 0.75, 0.25], null, [1, 0.5, 0.3]); return g; }
export function bridge(len = 5, y = 2) { const g = new Node('bridge'); add(g, new Mesh(box(len, 0.12, 1.1), woodMat()), [0, y, 0]); for (const dz of [-0.5, 0.5]) { add(g, new Mesh(box(len, 0.03, 0.03), bronzeMat()), [0, y + 0.5, dz]); for (let i = 0; i <= 6; i++) add(g, new Mesh(cylinder(0.02, 0.02, 0.5, 5), bronzeMat()), [-len / 2 + i * (len / 6), y + 0.25, dz]); } for (const dx of [-len / 2 + 0.3, len / 2 - 0.3]) add(g, new Mesh(box(0.2, y, 1.0), trimMat()), [dx, y / 2, 0]); return g; }
export function path(parent, pts, w = 1.2, matKey = 'path') { const pm = mat(matKey, { color: color('#3a2a1c'), roughness: 1, map: noiseTexture(128, [70, 52, 36], 18, true), mapRepeat: [1, 1] }); for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; const dx = b[0] - a[0], dz = b[1] - a[1]; const len = Math.hypot(dx, dz) + w; const seg = add(parent, new Mesh(box(len, 0.03, w), pm), [(a[0] + b[0]) / 2, 0.02, (a[1] + b[1]) / 2], [0, -Math.atan2(dz, dx), 0]); seg.castShadow = false; } }
export function person(seed = 1) { const g = new Node('person'); const rnd = seeded(seed); const c = m({ color: color(['#d9a05b', '#e7ddc8', '#b8622c', '#8e6a3d'][Math.floor(rnd() * 4)]), roughness: 0.8 }); add(g, new Mesh(cylinder(0.09, 0.11, 0.42, 8), c), [0, 0.21, 0]); add(g, new Mesh(sphere(0.08, 8, 6), m({ color: color('#e0b58a'), roughness: 0.8 })), [0, 0.5, 0]); g.rotation[1] = rnd() * 6.28; return g; }
export function screenBoard(w = 1.6, h = 1.0, draw, pos, parent) { const tex = drawTexture(384, 240, (ctx, W, H) => { ctx.fillStyle = T.screen; ctx.fillRect(0, 0, W, H); draw(ctx, W, H); }); const g = new Node('board'); add(g, new Mesh(box(w + 0.1, h + 0.1, 0.08), darkGlass()), [0, h / 2 + 0.6, 0]); add(g, new Mesh(box(w, h, 0.02), m({ color: [1, 1, 1], unlit: true, map: tex })), [0, h / 2 + 0.6, 0.05]).castShadow = false; add(g, new Mesh(cylinder(0.04, 0.05, 0.6, 6), bronzeMat()), [0, 0.3, 0]); if (parent) { g.position = pos; parent.add(g); } return g; }

/** Ground: plinth top with a subtle paving noise; districts are placed on top. */
export function ground(parent, w, d, y = 0) { const g = add(parent, new Mesh(box(w, 0.06, d), mat('ground', { color: color('#2a2118'), roughness: 1, map: noiseTexture(256, [52, 42, 30], 12, true), mapRepeat: [6, 6] })), [0, y + 0.03, 0]); g.castShadow = false; return g; }
export function terrace(parent, w, d, h, pos) { const g = add(parent, new Mesh(roundedBox({ w, h, d, r: 0.04, seg: 1 }), mat('terrace', { color: color('#3b2b1d'), roughness: 0.9 })), [pos[0], pos[1] + h / 2, pos[2]]); add(parent, new Mesh(box(w + 0.1, 0.06, d + 0.1), trimMat()), [pos[0], pos[1] + h + 0.03, pos[2]]).castShadow = false; return g; }
