// Draw-call reduction for the hand-built props (PC, monitors, clamp lamp, watch box): every static mesh under a root is
// baked into one mesh per material, so a prop made of hundreds of parts costs a handful of draws (and shadow draws).
// Left alone: anything under a node with userData.dynamic (fan rotors, watch hands), pickable meshes (hover/click
// volumes, the portfolio screen), hidden meshes, and meshes that have children of their own.
import { Mesh, Material, Texture } from 'engine/scene';
import { merge } from 'engine/geometry';
import { M4 } from 'engine/math';

const toSrgb = (c) => { c = Math.max(0, Math.min(1, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; };

/**
 * Merge many small parts that differ only in colour into one draw: plain opaque parts (no texture, not emissive, not unlit)
 * are grouped by how they shine (roughness and metalness to the nearest 0.1, fresnel, sidedness, shadows) and each group
 * becomes one mesh whose colours come from a small palette texture (4×4 texels per colour, sampled at the block centre so
 * nothing bleeds; no mipmaps). Everything else under root is left as it is. keep(mesh) → true keeps a mesh out.
 * Returns the materials now drawn under root.
 */
export function atlasMerge(root, name = root.name, { keep = () => false } = {}) {
  const saved = [root.position, root.rotation, root.scale];
  root.position = [0, 0, 0]; root.rotation = [0, 0, 0]; root.scale = [1, 1, 1];
  root.updateWorld();
  const buckets = new Map(), colours = new Map(), taken = [];
  const visit = (n, frozen) => {
    if (n !== root && (n.userData.dynamic || n.visible === false)) frozen = true;
    const m = n.material;
    if (!frozen && n.geometry && m && !n.pickable && n.children.length === 0 && !keep(n) && !m.map && !m.emissiveMap && !m.transparent && !m.unlit &&
        Math.max(...m.emissive) * m.emissiveIntensity < 1e-4) {
      const r = Math.round(m.roughness * 10) / 10, mt = Math.round(m.metalness * 10) / 10;
      const key = `${r}|${mt}|${m.fresnel}|${m.fresnelColor.join(',')}|${m.doubleSide ? 1 : 0}|${m.receiveShadow ? 1 : 0}|${n.castShadow ? 1 : 0}|${n.renderOrder || 0}`;
      if (!buckets.has(key)) buckets.set(key, { r, mt, src: m, cast: n.castShadow, order: n.renderOrder || 0, parts: [] });
      const ck = m.color.map((c) => Math.round(toSrgb(c) * 255)).join(',');
      if (!colours.has(ck)) colours.set(ck, colours.size);
      buckets.get(key).parts.push({ n, ck });
      taken.push(n);
    }
    for (const c of [...n.children]) visit(c, frozen);
  };
  visit(root, false);
  if (taken.length < 2) { [root.position, root.rotation, root.scale] = saved; return liveMaterials(root); }
  // the palette: a 16-wide grid of 4×4 blocks, sRGB (the texture is decoded to linear on the GPU)
  const B = 4, cols = 16, rows = Math.ceil(colours.size / cols), W = cols * B, H = rows * B;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  const uvOf = new Map();
  for (const [ck, i] of colours) {
    const bx = i % cols, by = Math.floor(i / cols); ctx.fillStyle = `rgb(${ck})`; ctx.fillRect(bx * B, by * B, B, B);
    uvOf.set(ck, [(bx * B + B / 2) / W, 1 - (by * B + B / 2) / H]);
  }
  const palette = new Texture(cv, { mipmaps: false });
  for (const n of taken) n.parent?.remove(n);
  for (const b of buckets.values()) {
    const parts = b.parts.map(({ n, ck }) => {
      const g = n.geometry, [u, v] = uvOf.get(ck), nv = g.positions.length / 3, uvs = new Float32Array(nv * 2);
      for (let i = 0; i < nv; i++) { uvs[i * 2] = u; uvs[i * 2 + 1] = v; }
      return { geo: { positions: g.positions, normals: g.normals, uvs, indices: g.indices }, m: M4.copy(new Float32Array(16), n.worldMatrix), n: M4.normalFromMat4(new Float32Array(9), n.worldMatrix) };
    });
    const s = b.src;
    const mat = new Material({ color: [1, 1, 1], map: palette, roughness: b.r, metalness: b.mt, fresnel: s.fresnel, fresnelColor: [...s.fresnelColor], doubleSide: s.doubleSide, receiveShadow: s.receiveShadow });
    const mesh = new Mesh(merge(parts), mat, `${name}:palette`); mesh.castShadow = b.cast; mesh.renderOrder = b.order; mesh.userData.palette = true; root.add(mesh);
  }
  [root.position, root.rotation, root.scale] = saved;
  return liveMaterials(root);
}
function liveMaterials(root) { const s = new Set(); root.traverse((n) => { if (n.geometry && n.material) s.add(n.material); }); return [...s]; }

// keyOf(mesh) groups by something other than the material instance (an asset builds one Material per part even when the
// parts share a material name); each group is drawn with the first material seen for its key.
export function flatten(root, name = root.name, { keyOf = null } = {}) {
  const saved = [root.position, root.rotation, root.scale];
  root.position = [0, 0, 0]; root.rotation = [0, 0, 0]; root.scale = [1, 1, 1];
  root.updateWorld();
  const groups = new Map(), mats = new Map(), baked = [];
  const visit = (n, frozen) => {
    if (n !== root && (n.userData.dynamic || n.visible === false)) frozen = true;
    if (!frozen && n.geometry && n.material && !n.pickable && n.children.length === 0) {
      const key = keyOf ? keyOf(n) : n.material;
      if (!mats.has(key)) mats.set(key, n.material);
      const sub = `${n.castShadow ? 1 : 0}|${n.renderOrder || 0}`;
      if (!groups.has(key)) groups.set(key, new Map());
      const bySub = groups.get(key); if (!bySub.has(sub)) bySub.set(sub, []);
      bySub.get(sub).push({ geo: n.geometry, m: M4.copy(new Float32Array(16), n.worldMatrix), n: M4.normalFromMat4(new Float32Array(9), n.worldMatrix) });
      baked.push(n);
    }
    for (const c of [...n.children]) visit(c, frozen);
  };
  visit(root, false);
  for (const n of baked) n.parent?.remove(n);
  for (const [key, bySub] of groups) for (const [sub, parts] of bySub) {
    const [cast, order] = sub.split('|').map(Number);
    const mesh = new Mesh(merge(parts), mats.get(key), `${name}:baked`); mesh.castShadow = !!cast; mesh.renderOrder = order; root.add(mesh);
  }
  [root.position, root.rotation, root.scale] = saved;
  return root;
}
