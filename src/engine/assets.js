// Loads Blender-authored assets exported by the project's exporter into engine Nodes.
// Formats: kwb2 (assets/*.kwb, preferred: deflated binary, see scripts/kwpack.js), kwbin1 JSON (int16/int8 base64) and plain JSON
// ({ meshes: [{ name, material: {color, roughness, metalness, emissive?, emissiveIntensity?, opacity?}, positions, normals, indices }] }).
// Meshes that share a material (and a group key) are merged into one draw call.
import { Node, Mesh, Material } from 'engine/scene';

const cache = new Map();

/**
 * Fetch an asset once. Bundled build: inlined as base64 kwb2 in <script type="application/octet-stream" id="kwa-NAME">
 * (decoded only when first asked for, so unvisited worlds cost nothing at startup) or legacy window.__KW_ASSETS.
 * Dev: assets/NAME.kwb, falling back to assets/NAME.json.
 */
export async function loadAsset(name) {
  if (cache.has(name)) return cache.get(name);
  const inline = globalThis.__KW_ASSETS?.[name], tag = globalThis.document?.getElementById('kwa-' + name);
  const json = () => fetch(`./assets/${name}.json`).then((r) => { if (!r.ok) throw new Error(`asset ${name}: ${r.status}`); return r.json(); });
  const p = inline ? Promise.resolve(inline)
    : tag ? Promise.resolve().then(() => decodeKwb(b64(tag.textContent.trim())))
    : fetch(`./assets/${name}.kwb`).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then((b) => decodeKwb(new Uint8Array(b))).catch(json);
  cache.set(name, p);
  p.catch(() => cache.delete(name));
  return p;
}

function b64(str) { const bin = atob(str); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }

// Minimal RFC 1951 inflater (zlib header skipped, adler ignored), table-driven. Synchronous on purpose: DecompressionStream
// works chunk by chunk between tasks, so beside a running render loop it took ~30x longer than this for the same bytes.
const LB = [], LE = [], DB = [], DE = [];
for (let i = 0, b = 3; i < 29; i++) { LE[i] = i < 8 || i === 28 ? 0 : (i - 4) >> 2; LB[i] = i === 28 ? 258 : b; b += 1 << LE[i]; }
for (let i = 0, b = 1; i < 30; i++) { DE[i] = i < 4 ? 0 : (i - 2) >> 1; DB[i] = b; b += 1 << DE[i]; }
export function inflate(src) {
  let pos = 2, bb = 0, bc = 0, out = new Uint8Array(src.length * 8 + 1024), len = 0;
  const need = (n) => { while (bc < n) { bb |= (src[pos++] | 0) << bc; bc += 8; } }; // reading past the end yields zeros, never consumed
  const bits = (n) => { need(n); const v = bb & ((1 << n) - 1); bb >>>= n; bc -= n; return v; };
  const room = (n) => { if (len + n > out.length) { const o = new Uint8Array(Math.max(out.length * 2, len + n)); o.set(out); out = o; } };
  // canonical Huffman code → table indexed by the next `max` stream bits (LSB first, so codes sit bit-reversed): (symbol << 4) | length
  const tree = (lens) => {
    let max = 1; for (const l of lens) if (l > max) max = l;
    const count = new Uint16Array(16), next = new Uint16Array(16), table = new Uint32Array(1 << max);
    for (const l of lens) count[l]++; count[0] = 0;
    for (let b = 1, code = 0; b < 16; b++) { code = (code + count[b - 1]) << 1; next[b] = code; }
    lens.forEach((l, s) => { if (!l) return; let c = next[l]++, r = 0; for (let k = 0; k < l; k++, c >>= 1) r = (r << 1) | (c & 1); for (let j = r; j < table.length; j += 1 << l) table[j] = (s << 4) | l; });
    return { table, max, mask: (1 << max) - 1 };
  };
  const sym = (t) => { need(t.max); const e = t.table[bb & t.mask], l = e & 15; if (!l) throw new Error('inflate: bad code'); bb >>>= l; bc -= l; return e >> 4; };
  let fixed = null, last = 0;
  while (!last) {
    last = bits(1); const type = bits(2);
    if (type === 0) { pos -= bc >> 3; bb = 0; bc = 0; const n = src[pos] | (src[pos + 1] << 8); pos += 4; room(n); out.set(src.subarray(pos, pos + n), len); len += n; pos += n; continue; } // byte-align, giving back look-ahead
    let lt, dt;
    if (type === 1) { if (!fixed) { const l = []; for (let i = 0; i < 288; i++) l[i] = i < 144 ? 8 : i < 256 ? 9 : i < 280 ? 7 : 8; fixed = [tree(l), tree(new Array(30).fill(5))]; } [lt, dt] = fixed; }
    else {
      const hlit = bits(5) + 257, hdist = bits(5) + 1, hclen = bits(4) + 4, cl = new Array(19).fill(0);
      for (let i = 0; i < hclen; i++) cl[[16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15][i]] = bits(3);
      const ct = tree(cl), lens = [];
      while (lens.length < hlit + hdist) { const s = sym(ct); if (s < 16) lens.push(s); else if (s === 16) { const p = lens[lens.length - 1], r = 3 + bits(2); for (let i = 0; i < r; i++) lens.push(p); } else { const r = s === 17 ? 3 + bits(3) : 11 + bits(7); for (let i = 0; i < r; i++) lens.push(0); } }
      lt = tree(lens.slice(0, hlit)); dt = tree(lens.slice(hlit));
    }
    for (;;) {
      const s = sym(lt); if (s === 256) break;
      if (s < 256) { room(1); out[len++] = s; continue; }
      const n = LB[s - 257] + bits(LE[s - 257]), ds = sym(dt), d = DB[ds] + bits(DE[ds]);
      room(n); for (let i = 0; i < n; i++, len++) out[len] = out[len - d];
    }
  }
  return out.subarray(0, len);
}

/** kwb2 bytes ('KWB2' + zlib payload) → the asset JSON shape, each mesh's geometry as typed arrays. */
export function decodeKwb(bytes, unzip = inflate) {
  if (String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== 'KWB2') throw new Error('not a kwb2 asset');
  const B = unzip(bytes.subarray(4)), hl = B[0] | (B[1] << 8) | (B[2] << 16) | (B[3] << 24);
  const head = JSON.parse(new TextDecoder().decode(B.subarray(4, 4 + hl))); let o = 4 + hl;
  for (const me of head.meshes) {
    const n = me.n, positions = new Float32Array(n * 3), normals = new Float32Array(n * 3), indices = new Uint32Array(me.ni);
    if (me.f) { positions.set(new Float32Array(B.slice(o, o + n * 12).buffer)); normals.set(new Float32Array(B.slice(o + n * 12, o + n * 24).buffer)); o += n * 24; }
    else {
      const q = me.q;
      for (let c = 0; c < 3; c++) { const lo = o + c * 2 * n, hi = lo + n; let v = 0; for (let k = 0; k < n; k++) { v = ((v + (B[lo + k] | (B[hi + k] << 8))) << 16) >> 16; positions[k * 3 + c] = v / q; } }
      o += n * 6;
      for (let c = 0; c < 3; c++) { const s = o + c * n; for (let k = 0; k < n; k++) normals[k * 3 + c] = ((B[s + k] << 24) >> 24) / 127; }
      o += n * 3;
    }
    const end = o + me.ib; let v = 0;
    for (let i = 0; i < me.ni; i++) { let z = 0, m = 1, b; do { b = B[o++]; z += (b & 127) * m; m *= 128; } while (b & 128); v += z % 2 ? -(z + 1) / 2 : z / 2; indices[i] = v; }
    if (o !== end) throw new Error('kwb2: index stream out of step');
    me.positions = positions; me.normals = normals; me.indices = indices;
  }
  return head;
}

/** Decode a kwbin1 mesh (quantised int16 positions, int8 normals, base64) into typed arrays. */
function decodeMesh(me) {
  if (!me.pos) return me;
  const q = me.q || 100; const p16 = new Int16Array(b64(me.pos).buffer); const n8 = new Int8Array(b64(me.nor).buffer);
  const positions = new Float32Array(p16.length); for (let i = 0; i < p16.length; i++) positions[i] = p16[i] / q;
  const normals = new Float32Array(n8.length); for (let i = 0; i < n8.length; i++) normals[i] = n8[i] / 127;
  const ib = b64(me.idx).buffer;
  return { name: me.name, material: me.material, positions, normals, indices: me.idx32 ? new Uint32Array(ib) : new Uint16Array(ib) };
}

function materialFrom(m, overrides = {}) {
  const o = { color: m.color, roughness: m.roughness, metalness: m.metalness };
  if (m.emissive) { o.emissive = m.emissive; o.emissiveIntensity = m.emissiveIntensity; }
  if (m.opacity !== undefined) { o.opacity = m.opacity; o.transparent = true; o.depthWrite = false; o.fresnel = 0.08; o.fresnelColor = [1, 0.85, 0.6]; }
  return new Material({ ...o, ...(overrides[m.name] || {}) });
}

/**
 * Build a Node from an asset. `group(meshName)` returns a key: meshes with the same key and material are merged.
 * Returns { root, groups: Map<key, Node>, materials: Material[] }.
 */
export function buildAsset(json, { group = () => 'all', overrides = {}, castShadow = true, name = 'asset' } = {}) {
  const root = new Node(name);
  const buckets = new Map(); // `${key}|${matName}` → { key, mat, parts: decoded meshes, nv, ni }
  for (const raw of json.meshes) {
    const me = decodeMesh(raw);
    const key = group(me.name); const mk = `${key}|${me.material.name}`;
    let b = buckets.get(mk);
    if (!b) { b = { key, mat: me.material, parts: [], nv: 0, ni: 0 }; buckets.set(mk, b); }
    b.parts.push(me); b.nv += me.positions.length / 3; b.ni += me.indices.length;
  }
  const groups = new Map(); const materials = [];
  for (const b of buckets.values()) {
    let g = groups.get(b.key); if (!g) { g = new Node(`${name}:${b.key}`); root.add(g); groups.set(b.key, g); }
    const mat = materialFrom(b.mat, overrides); materials.push(mat);
    const positions = new Float32Array(b.nv * 3), normals = new Float32Array(b.nv * 3), indices = b.nv > 65535 ? new Uint32Array(b.ni) : new Uint16Array(b.ni);
    let base = 0, io = 0;
    for (const me of b.parts) {
      positions.set(me.positions, base * 3); normals.set(me.normals, base * 3);
      const I = me.indices; for (let i = 0; i < I.length; i++) indices[io + i] = I[i] + base;
      base += me.positions.length / 3; io += I.length;
    }
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 3) for (let k = 0; k < 3; k++) { const v = positions[i + k]; if (v < min[k]) min[k] = v; if (v > max[k]) max[k] = v; }
    const mesh = new Mesh({ positions, normals, uvs: new Float32Array(b.nv * 2), indices, bounds: { min, max } }, mat, `${name}:${b.key}:${b.mat.name}`);
    mesh.castShadow = castShadow && !b.mat.opacity && !(b.mat.emissiveIntensity > 2);
    if (b.mat.opacity) mesh.renderOrder = 10;
    g.add(mesh);
  }
  return { root, groups, materials };
}
