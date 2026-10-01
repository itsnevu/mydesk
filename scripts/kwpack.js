// kwb2 packer: assets/*.json (kwbin1 base64 or plain float arrays) → assets/*.kwb, a compact binary the loader prefers.
// Lossless w.r.t. what the engine renders: the same quantised values decode to the same Float32 attributes. Smaller because
// identical vertices are welded (same position + normal → one vertex, same triangles), positions are delta-coded int16 split
// into byte planes, normals into int8 planes, indices are zigzag-delta varints, and the whole payload is zlib-deflated.
// File: 'KWB2' + zlib( u32le headerLen | header JSON | blob ). header = the asset JSON with each mesh's geometry replaced by
// { n: verts, ni: indices, q (quantised) | f: 1 (float32), ib: index bytes }; blob = per mesh, in order: positions, normals, indices.
// CLI: `node scripts/kwpack.js [name…]` packs assets/<name>.json (all when no names) next to the originals.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

export const MAGIC = 'KWB2';
// desk_props: openLampShade() averages the shade's vertices, so its vertex multiset must stay as authored
const NOWELD = new Set(['desk_props']);
const GEO = new Set(['pos', 'nor', 'idx', 'idx32', 'positions', 'normals', 'indices']);

const b64 = (s) => { const b = Buffer.from(s, 'base64'); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length); };
function geometry(me) {
  if (me.pos) return { q: me.q || 100, p: new Int16Array(b64(me.pos)), n: new Int8Array(b64(me.nor)), i: me.idx32 ? new Uint32Array(b64(me.idx)) : new Uint16Array(b64(me.idx)) };
  return { p: new Float32Array(me.positions), n: new Float32Array(me.normals), i: Uint32Array.from(me.indices) };
}
function weld(g) {
  const nv = g.p.length / 3, seen = new Map(), remap = new Uint32Array(nv), P = [], N = [];
  for (let k = 0; k < nv; k++) {
    const a = k * 3, key = `${g.p[a]},${g.p[a + 1]},${g.p[a + 2]},${g.n[a]},${g.n[a + 1]},${g.n[a + 2]}`;
    let r = seen.get(key); if (r === undefined) { r = P.length / 3; seen.set(key, r); P.push(g.p[a], g.p[a + 1], g.p[a + 2]); N.push(g.n[a], g.n[a + 1], g.n[a + 2]); }
    remap[k] = r;
  }
  return { ...g, p: new g.p.constructor(P), n: new g.n.constructor(N), i: Uint32Array.from(g.i, (v) => remap[v]) };
}
function varints(idx) {
  const out = []; let prev = 0;
  for (const v of idx) { const d = v - prev; prev = v; let z = d < 0 ? -2 * d - 1 : 2 * d; while (z >= 128) { out.push((z % 128) | 128); z = Math.floor(z / 128); } out.push(z); }
  return Buffer.from(out);
}

/** Pack one parsed asset JSON into kwb2 bytes. */
export function pack(json, { name = '', weldVerts = !NOWELD.has(name) } = {}) {
  const head = { ...json, meshes: [] }, parts = [];
  for (const me of json.meshes) {
    let g = geometry(me); if (weldVerts) g = weld(g);
    const nv = g.p.length / 3, d = {}; for (const k in me) if (!GEO.has(k)) d[k] = me[k];
    if (g.q) {
      const pb = Buffer.alloc(nv * 6), nb = Buffer.alloc(nv * 3);
      for (let c = 0; c < 3; c++) {
        let prev = 0; const lo = c * 2 * nv, hi = lo + nv;
        for (let k = 0; k < nv; k++) { const v = g.p[k * 3 + c], u = (v - prev) & 0xffff; prev = v; pb[lo + k] = u & 255; pb[hi + k] = u >> 8; nb[c * nv + k] = g.n[k * 3 + c] & 255; }
      }
      parts.push(pb, nb); Object.assign(d, { n: nv, ni: g.i.length, q: g.q });
    } else { parts.push(Buffer.from(g.p.buffer), Buffer.from(g.n.buffer)); Object.assign(d, { n: nv, ni: g.i.length, f: 1 }); delete d.q; }
    const ib = varints(g.i); parts.push(ib); d.ib = ib.length;
    head.meshes.push(d);
  }
  const hj = Buffer.from(JSON.stringify(head)), hl = Buffer.alloc(4); hl.writeUInt32LE(hj.length);
  return Buffer.concat([Buffer.from(MAGIC), zlib.deflateSync(Buffer.concat([hl, hj, ...parts]), { level: 9, memLevel: 9 })]);
}

/** Pack assets/<name>.json → assets/<name>.kwb when the .kwb is missing or older. Returns the bytes (or null if the JSON is unreadable). */
export function packFile(dir, name, { force = false } = {}) {
  const src = path.join(dir, name + '.json'), dst = path.join(dir, name + '.kwb');
  const ss = fs.statSync(src, { throwIfNoEntry: false }); if (!ss) return null;
  const ds = fs.statSync(dst, { throwIfNoEntry: false });
  if (!force && ds && ds.mtimeMs >= ss.mtimeMs) return fs.readFileSync(dst);
  let json; try { json = JSON.parse(fs.readFileSync(src, 'utf8')); } catch { return null; } // mid-export: let the loader fall back
  const out = pack(json, { name });
  try { fs.writeFileSync(dst + '.tmp', out); fs.renameSync(dst + '.tmp', dst); } catch {}
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
  const names = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
  let a = 0, b = 0;
  for (const n of names) { const raw = fs.statSync(path.join(dir, n + '.json')).size, out = packFile(dir, n, { force: true }); a += raw; b += out.length; console.log(`${n.padEnd(20)} ${(raw / 1024).toFixed(0).padStart(6)} kB → ${(out.length / 1024).toFixed(0).padStart(5)} kB`); }
  console.log(`total ${(a / 1024).toFixed(0)} kB → ${(b / 1024).toFixed(0)} kB`);
}
