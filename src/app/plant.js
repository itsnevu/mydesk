// The corner plant: a fiddle-leaf fig in a ribbed ceramic planter. Three woody stems rise from the soil, each carrying broad,
// violin-shaped leaves in a spiral: small, bright and upright at the tips, big, dark and drooping lower down. Every leaf is real
// geometry (cupped along its midrib, arched along its length, its margin gently waved) with a glossy veined top and a paler
// matte underside, so the whole canopy is three draw calls (mature tops, young tops, undersides); stems, pot and soil add three more.
// Local frame: origin on the floor at the centre of the pot, y up. Units: 1 ≈ 19 mm.
import { Node, Mesh, Material } from 'engine/scene';
import { merge, sphere } from 'engine/geometry';
import { color } from 'engine/math';
import { drawTexture } from 'engine/textures';

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// ---------- textures
function leafTexture() {
  const r = rng(41);
  return drawTexture(256, 512, (ctx, w, h) => {
    // glossy dark green, a shade lighter along the midrib
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#22381a'); g.addColorStop(0.5, '#3a5a24'); g.addColorStop(1, '#22381a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '10,20,6' : '120,150,70'},${r() * 0.08})`; ctx.fillRect(r() * w, r() * h, 2, 2); }
    // the lateral veins: from the midrib out and up to the margin, in pairs
    ctx.lineCap = 'round';
    for (let k = 0; k < 11; k++) {
      const v0 = h * (0.06 + k * 0.083);
      for (const s of [-1, 1]) {
        ctx.strokeStyle = 'rgba(160,184,98,0.55)'; ctx.lineWidth = 3 - k * 0.12;
        ctx.beginPath(); ctx.moveTo(w / 2, h - v0); ctx.quadraticCurveTo(w / 2 + s * w * 0.22, h - v0 - h * 0.035, w / 2 + s * w * 0.47, h - v0 - h * 0.1); ctx.stroke();
        ctx.strokeStyle = 'rgba(160,184,98,0.18)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(w / 2 + s * w * 0.12, h - v0 - h * 0.012); ctx.quadraticCurveTo(w / 2 + s * w * 0.2, h - v0 - h * 0.06, w / 2 + s * w * 0.18, h - v0 - h * 0.09); ctx.stroke();
      }
    }
    // the midrib, pale and tapering toward the tip
    const m = ctx.createLinearGradient(0, h, 0, 0); m.addColorStop(0, 'rgba(206,214,140,0.95)'); m.addColorStop(1, 'rgba(206,214,140,0.25)');
    ctx.fillStyle = m; ctx.beginPath(); ctx.moveTo(w / 2 - 5, h); ctx.lineTo(w / 2 + 5, h); ctx.lineTo(w / 2 + 1, 6); ctx.lineTo(w / 2 - 1, 6); ctx.closePath(); ctx.fill();
    // a gloss band along one half, and a darker rim at the margin
    const s = ctx.createLinearGradient(0, 0, w, 0); s.addColorStop(0.18, 'rgba(255,255,255,0)'); s.addColorStop(0.32, 'rgba(255,255,230,0.08)'); s.addColorStop(0.42, 'rgba(255,255,255,0)');
    ctx.fillStyle = s; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(8,16,4,0.5)'; ctx.fillRect(0, 0, 6, h); ctx.fillRect(w - 6, 0, 6, h);
  });
}
// the underside: paler and matte, the veins standing out
function underTexture() {
  const r = rng(42);
  return drawTexture(256, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#4f6a38'); g.addColorStop(0.5, '#6b8a4c'); g.addColorStop(1, '#4f6a38');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '30,40,16' : '170,190,120'},${r() * 0.08})`; ctx.fillRect(r() * w, r() * h, 2, 2); }
    ctx.lineCap = 'round';
    for (let k = 0; k < 11; k++) {
      const v0 = h * (0.06 + k * 0.083);
      for (const s of [-1, 1]) { ctx.strokeStyle = 'rgba(214,226,170,0.7)'; ctx.lineWidth = 3.4 - k * 0.14; ctx.beginPath(); ctx.moveTo(w / 2, h - v0); ctx.quadraticCurveTo(w / 2 + s * w * 0.22, h - v0 - h * 0.035, w / 2 + s * w * 0.47, h - v0 - h * 0.1); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(226,232,180,0.95)'; ctx.beginPath(); ctx.moveTo(w / 2 - 7, h); ctx.lineTo(w / 2 + 7, h); ctx.lineTo(w / 2 + 1.5, 6); ctx.lineTo(w / 2 - 1.5, 6); ctx.closePath(); ctx.fill();
  });
}
// the same blade seen from below: normals turned over, every triangle wound the other way
function underside(geo) {
  const idx = new Uint16Array(geo.indices.length);
  for (let t = 0; t < idx.length; t += 3) { idx[t] = geo.indices[t]; idx[t + 1] = geo.indices[t + 2]; idx[t + 2] = geo.indices[t + 1]; }
  return { ...geo, normals: geo.normals.map((v) => -v), indices: idx };
}
function barkTexture() {
  const r = rng(43);
  return drawTexture(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#5b4a38'; ctx.fillRect(0, 0, w, h);
    // the streaks run along the stem (constant u), with a few pale lenticels
    for (let i = 0; i < 70; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '30,22,14' : '140,120,96'},${0.1 + r() * 0.25})`; ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 20 + r() * 90); }
    for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(190,175,150,0.35)'; ctx.fillRect(r() * w, r() * h, 3, 1); }
  }, { repeat: true });
}
function ceramicTexture() {
  const r = rng(47);
  return drawTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d2c3a6'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i++) { ctx.fillStyle = `rgba(${r() < 0.6 ? '70,52,36' : '255,250,235'},${r() * 0.18})`; ctx.fillRect(r() * w, r() * h, 1.4, 1.4); }
  }, { repeat: true });
}
function soilTexture() {
  const r = rng(53);
  return drawTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#2a1d14'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = r(); ctx.fillStyle = v < 0.5 ? `rgba(10,6,3,${0.3 + r() * 0.4})` : v < 0.85 ? `rgba(92,68,48,${0.2 + r() * 0.4})` : `rgba(170,150,120,${0.3 + r() * 0.3})`; ctx.beginPath(); ctx.arc(r() * w, r() * h, 0.6 + r() * 2.2, 0, Math.PI * 2); ctx.fill(); }
  });
}

// ---------- geometry
// grid normals: for a (NU × NV) grid of positions, each vertex's normal from its neighbours across and along (facing +across × +along)
function gridNormals(pos, NU, NV) {
  const nor = new Float32Array(pos.length), P = (i, j) => { const k = (Math.min(NV - 1, Math.max(0, j)) * NU + Math.min(NU - 1, Math.max(0, i))) * 3; return [pos[k], pos[k + 1], pos[k + 2]]; };
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const n = nrm(crs(sub(P(i + 1, j), P(i - 1, j)), sub(P(i, j + 1), P(i, j - 1)))), k = (j * NU + i) * 3; nor[k] = n[0]; nor[k + 1] = n[1]; nor[k + 2] = n[2]; }
  return nor;
}
function gridGeo(pos, uv, NU, NV) {
  const idx = [];
  for (let j = 0; j < NV - 1; j++) for (let i = 0; i < NU - 1; i++) { const a = j * NU + i, b = a + 1, c = a + NU, d = c + 1; idx.push(a, b, d, a, d, c); }
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i++) { min[i % 3] = Math.min(min[i % 3], pos[i]); max[i % 3] = Math.max(max[i % 3], pos[i]); }
  return { positions: new Float32Array(pos), normals: gridNormals(pos, NU, NV), uvs: new Float32Array(uv), indices: new Uint16Array(idx), bounds: { min, max } };
}

// the fiddle: narrow at the stalk, a soft waist, broadest near the top, a blunt rounded tip (half-width as a fraction of W)
const FIDDLE = [[0, 0.06], [0.1, 0.3], [0.24, 0.52], [0.4, 0.58], [0.56, 0.78], [0.72, 0.96], [0.84, 0.92], [0.93, 0.66], [0.98, 0.34], [1, 0]];
function fiddle(t) {
  let i = 0; while (i < FIDDLE.length - 2 && FIDDLE[i + 1][0] < t) i++;
  const [t0, w0] = FIDDLE[i], [t1, w1] = FIDDLE[i + 1], u = (t - t0) / (t1 - t0 || 1), s = u * u * (3 - 2 * u);
  return w0 + (w1 - w0) * s;
}
/** One leaf blade along +y from its stalk end, upper face +z: cupped along the midrib, arched by `curl`, its margin waved. */
function leafGeo(L, W, cup, curl, wave, seed) {
  const NU = 9, NV = 15, pos = [], uv = [];
  for (let j = 0; j < NV; j++) {
    const t = j / (NV - 1), hw = (W / 2) * fiddle(t);
    for (let i = 0; i < NU; i++) {
      const s = (i / (NU - 1)) * 2 - 1, x = s * hw;
      const z = Math.abs(s) * hw * cup + curl * L * t * t + wave * Math.sin(t * 11 + seed + (s > 0 ? 1.7 : 0)) * s * s * hw * 0.14;
      pos.push(x, t * L, z); uv.push(i / (NU - 1), t);
    }
  }
  return gridGeo(pos, uv, NU, NV);
}
/** A tapered stalk along a curve through `pts` (radius r0 at the start to r1 at the end), its frame carried along so it never twists. */
function stalk(pts, r0, r1, seg = 9, n = 6) {
  const path = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; path.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3))); }
  }
  path.push(pts[pts.length - 1]);
  const L = [0]; for (let i = 1; i < path.length; i++) L.push(L[i - 1] + Math.hypot(...sub(path[i], path[i - 1])));
  const pos = [], nor = [], uv = [], idx = []; let N = null;
  for (let i = 0; i < path.length; i++) {
    const T = nrm(sub(path[Math.min(i + 1, path.length - 1)], path[Math.max(i - 1, 0)]));
    N = N ? nrm(sub(N, mul(T, dot(N, T)))) : nrm(crs(T, Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
    const B = crs(T, N), r = r0 + (r1 - r0) * (L[i] / L[L.length - 1]);
    for (let k = 0; k <= seg; k++) { const a = (k / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), d = add(mul(N, c), mul(B, s)); pos.push(...add(path[i], mul(d, r))); nor.push(...d); uv.push(k / seg, L[i] / 8); }
  }
  for (let i = 0; i < path.length - 1; i++) for (let k = 0; k < seg; k++) { const a = i * (seg + 1) + k, b = a + seg + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  // wind every triangle to face along its normals (outwards)
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t] * 3, idx[t + 1] * 3, idx[t + 2] * 3];
    const f = crs([pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]], [pos[c] - pos[a], pos[c + 1] - pos[a + 1], pos[c + 2] - pos[a + 2]]);
    if (f[0] * (nor[a] + nor[b] + nor[c]) + f[1] * (nor[a + 1] + nor[b + 1] + nor[c + 1]) + f[2] * (nor[a + 2] + nor[b + 2] + nor[c + 2]) < 0) { const x = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = x; }
  }
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i++) { min[i % 3] = Math.min(min[i % 3], pos[i]); max[i % 3] = Math.max(max[i % 3], pos[i]); }
  return { positions: new Float32Array(pos), normals: new Float32Array(nor), uvs: new Float32Array(uv), indices: new Uint16Array(idx), bounds: { min, max } };
}
/** A lathe: profile [[r, y], …] from the bottom up, turned about y; `rib(theta)` scales the radius (the planter's ribs). */
function lathe(profile, seg, rib = () => 1) {
  const pos = [], uv = [], NV = profile.length, NU = seg + 1;
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = (i / seg) * Math.PI * 2, [r, y] = profile[j], rr = r * rib(a); pos.push(Math.sin(a) * rr, y, Math.cos(a) * rr); uv.push((i / seg) * 4, y / 16); }
  return gridGeo(pos, uv, NU, NV);
}
const M = (m) => ({ m, n: [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]] });
const frame = (X, Y, Z, p) => M([X[0], X[1], X[2], 0, Y[0], Y[1], Y[2], 0, Z[0], Z[1], Z[2], 0, p[0], p[1], p[2], 1]);

/**
 * `keepOut(p)` → true where a leaf may not reach (walls, a curtain, a window sill…), in this plant's local frame; leaves that would
 * are turned toward the room until they fit.
 */
export function buildPlant(keepOut = () => false) {
  const root = new Node('plant'), r = rng(9);
  const amb = (c, k) => c.map((v) => v * k);
  const leafTex = leafTexture();
  const mats = {
    // glossy but not mirror-like (harder highlights read as white paint at this distance). Each blade is two-faced: the top
    // glossy and dark, the underside its own paler, matte material, so a leaf seen from below is green, never black
    leaf: new Material({ color: color('#d9e6c8'), map: leafTex, roughness: 0.5, emissive: amb(color('#c6d4b0'), 1.7), emissiveMap: leafTex, receiveShadow: false, fresnel: 0.18, fresnelColor: color('#e8d2a0') }),
    young: new Material({ color: color('#eef6b4'), map: leafTex, roughness: 0.48, emissive: amb(color('#e2ee9e'), 1.8), emissiveMap: leafTex, receiveShadow: false, fresnel: 0.18, fresnelColor: color('#f0e0a8') }),
    under: (() => { const t = underTexture(); return new Material({ color: color('#e4ecd6'), map: t, roughness: 0.75, emissive: amb(color('#e4ecd6'), 1.9), emissiveMap: t, receiveShadow: false }); })(),
    bark: new Material({ color: [1, 1, 1], map: barkTexture(), mapRepeat: [1, 1], roughness: 0.8, emissive: [0.55, 0.55, 0.55], emissiveMap: null, receiveShadow: false }),
    pot: new Material({ color: [1, 1, 1], map: ceramicTexture(), roughness: 0.7, emissive: [0.62, 0.6, 0.56], receiveShadow: false }),
    soil: new Material({ color: [1, 1, 1], map: soilTexture(), roughness: 0.95, emissive: [0.5, 0.5, 0.5], receiveShadow: false }),
  };
  mats.bark.emissiveMap = mats.bark.map; mats.pot.emissiveMap = mats.pot.map; mats.soil.emissiveMap = mats.soil.map;
  // the emissive is a little painted-in ambience; scale it down to the room's light level (app/room dims what is listed here)
  for (const m of Object.values(mats)) m.emissive = m.emissive.map((v) => v * 0.55);
  root.userData.dimmable = Object.values(mats);

  // ---------- the planter: a ribbed ceramic cylinder with a rolled lip, a dark foot, soil and a few pebbles inside
  const H = 15.5, R = 7.3, soilY = H - 1.5;
  const potGeo = lathe([[5.9, 0.5], [6.1, 1.2], [6.6, 5], [7.0, 10], [7.25, 14.4], [7.45, 15.0], [7.4, 15.5], [7.0, 15.6], [6.75, 15.2], [6.7, soilY - 0.2]], 64, (a) => 1 + 0.03 * Math.pow(Math.abs(Math.cos(a * 9)), 0.6));
  const foot = lathe([[5.4, 0], [5.9, 0.05], [6.05, 0.5], [5.9, 0.62], [5.0, 0.62]], 48);
  root.add(Object.assign(new Mesh(merge([{ geo: potGeo }, { geo: foot }]), mats.pot, 'plant-pot'), { castShadow: false }));
  const soil = [{ geo: lathe([[0.01, soilY + 0.25], [3, soilY + 0.2], [6.75, soilY - 0.1]], 40) }];
  for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, d = 1.5 + r() * 4.6; soil.push({ geo: sphere(0.32 + r() * 0.3, 8, 6), m: [1, 0, 0, 0, 0, 0.6, 0, 0, 0, 0, 1, 0, Math.sin(a) * d, soilY + 0.25, Math.cos(a) * d, 1], n: [1, 0, 0, 0, 1, 0, 0, 0, 1] }); }
  root.add(Object.assign(new Mesh(merge(soil), mats.soil, 'plant-soil'), { castShadow: false }));

  // ---------- three stems, leaning out a little, each with its leaves in a spiral (137.5° apart)
  const stems = [], leaves = { leaf: [], young: [], under: [] };
  const STEMS = [{ a: 0.6, lean: 0.16, h: 84 }, { a: 2.7, lean: 0.2, h: 70 }, { a: 4.6, lean: 0.18, h: 60 }];
  STEMS.forEach((S, si) => {
    const base = [Math.sin(S.a) * 1.6, soilY, Math.cos(S.a) * 1.6], out = [Math.sin(S.a), 0, Math.cos(S.a)];
    // a gentle S: out at the bottom, back toward upright near the top
    const pts = [0, 0.25, 0.5, 0.75, 1].map((f) => add(base, [out[0] * S.lean * S.h * (f * 0.9 + Math.sin(f * Math.PI) * 0.15), f * S.h, out[2] * S.lean * S.h * (f * 0.9 + Math.sin(f * Math.PI) * 0.15)]));
    stems.push({ geo: stalk(pts, 0.85, 0.32) });
    const at = (f) => { const k = Math.min(pts.length - 2, Math.floor(f * (pts.length - 1))), u = f * (pts.length - 1) - k; return add(mul(pts[k], 1 - u), mul(pts[k + 1], u)); };
    const nLeaves = Math.round(S.h / 5.2);
    for (let k = 0; k < nLeaves; k++) {
      const f = 0.27 + (k / (nLeaves - 1)) * 0.73, young = f > 0.9, p = at(f);
      // size: grows to the middle of the stem, the newest at the tip are small
      const size = young ? 6.5 + r() * 1.5 : 10.5 + Math.sin(((f - 0.27) / 0.65) * Math.PI) * 3 + r() * 1.5;
      // elevation: the young stand up, the old reach out and droop
      const elev = young ? 0.75 + r() * 0.2 : 0.45 - (0.9 - f) * 1.3 + (r() - 0.5) * 0.25;
      let az = S.a * 0.6 + si * 2.1 + k * 2.39996 + (r() - 0.5) * 0.3, petiole, dir, tip, tries = 0;
      // a leaf that would reach into a wall, the curtain or the sill turns toward the room until it fits
      do {
        const h = [Math.sin(az), 0, Math.cos(az)];
        petiole = add(p, add(mul(h, 2.2), [0, 1.2, 0]));
        dir = nrm(add(mul(h, Math.cos(elev)), [0, Math.sin(elev), 0]));
        tip = add(petiole, mul(dir, size * 1.05));
        // the tip, the middle and both edges at the blade's widest
        const side = mul(nrm(crs(dir, [0, 1, 0])), size * 0.36), wide = add(petiole, mul(dir, size * 0.72));
        if (![tip, add(petiole, mul(dir, size * 0.5)), add(wide, side), sub(wide, side)].some(keepOut)) break;
        az += 0.7;
      } while (++tries < 9);
      if (tries >= 9) continue;
      stems.push({ geo: stalk([p, add(p, add(mul(sub(petiole, p), 0.5), [0, 0.5, 0])), petiole], 0.2, 0.14, 6, 3) });
      // the blade's frame: along `dir`, its face turned up toward the light, rolled a little
      const up = [0, 1, 0], Z0 = nrm(sub(up, mul(dir, dot(up, dir)))), X0 = crs(dir, Z0), roll = (r() - 0.5) * 0.7;
      const Z = nrm(add(mul(Z0, Math.cos(roll)), mul(X0, Math.sin(roll)))), X = crs(dir, Z);
      const geo = leafGeo(size, size * 0.66, 0.22 + r() * 0.12, young ? 0.06 : -0.12 - r() * 0.1, 1, r() * 6);
      const f2 = frame(X, dir, Z, petiole);
      leaves[young ? 'young' : 'leaf'].push({ geo, ...f2 });
      leaves.under.push({ geo: underside(geo), ...f2 });
    }
  });
  root.add(Object.assign(new Mesh(merge(stems), mats.bark, 'plant-stems'), { castShadow: false }));
  for (const k of ['leaf', 'young', 'under']) if (leaves[k].length) root.add(Object.assign(new Mesh(merge(leaves[k]), mats[k], 'plant-leaves'), { castShadow: false }));
  return root;
}
