// Worlds 02 (Client Websites) and 03 (JAKASN), built in code: the same district that stands on the keyboard (app/kbtown), at a
// world's size, so going in through the key lands in the place the key showed. The client street is its sixteen shops, each with
// its trade on the roof and its name over the door; JAKASN is the civic hall between the OJS press and BKNPEDIA. The world's
// places to inspect are the district's own buildings.
import { Node, Mesh } from 'engine/scene';
import { box } from 'engine/geometry';
import { color } from 'engine/math';
import { KIT, buildDistrictWorld } from 'app/kbtown';

const { M, plain } = KIT;
const K = 11;          // keyboard units to world units: a 0.4-wide shop becomes 4.4
const Y = 1.16;        // the plinth's top

// where each world's hotspots are: a shop (by key), a building (by the note it carries), or a box of its own (district-local)
const PLAN = {
  'market-district': {
    district: 'market',
    // the three stone steps of the street (from the keyboard's shell): top, x extent, z extent
    steps: [[0.16, -0.63, 1.38, -1.5, -0.5], [0.08, -1.38, 0.63, -0.5, 0.5], [0.03, -0.88, 1.13, 0.5, 1.5]],
    hotspots: {
      sign: { box: [[-0.84, 0.03, 1.36], [-0.32, 0.4, 1.48]] },                                    // the street's name board
      shelves: { shops: ['nf-optical', 'yukti-rasa-mitrabumi', 'orthobone', 'izzi'] },              // a row of company profiles
      counter: { shops: ['flora-indonesia'] },                                                     // the florist's checkout
      crate: { shops: ['winfaith'] },                                                              // the custom build, behind the front
    },
    lights: [[0.2, 1.1, -1.0], [-0.4, 0.9, 0.0], [0.2, 0.8, 1.0], [-1.1, 0.9, -1.0]],
  },
  'tech-lab': {
    district: 'lab',
    steps: [[0.06, -1.5, 1.5, -1, 1]],
    hotspots: { monitors: { note: 'monitors' }, rings: { note: 'rings' }, diagram: { note: 'diagram', first: true }, device: { note: 'device' } },
    lights: [[0, 1.2, 0.2], [-1.0, 0.9, -0.4], [1.0, 0.9, -0.4], [0, 0.8, 0.9]],
  },
};
export const townWorldHere = (key) => !!PLAN[key];

/** Build world 02 or 03 on its plinth. Returns what buildDiorama expects: { hs, lights, update, wake }. */
export function buildTownWorld(root, O, key, mini = false) {
  const plan = PLAN[key];
  const d = buildDistrictWorld(plan.district, mini ? 1.5 : 3);
  const town = new Node('town:' + key); town.position = [0, Y + 0.02, 0]; town.scale = [K, K, K]; root.add(town);
  // the stone steps it stands on (on the keyboard these were the Blender shell)
  const stone = plain('#2a2117', 0.9);
  for (const [top, x0, x1, z0, z1] of plan.steps) { const s = new Mesh(box(x1 - x0, top + 0.02, z1 - z0), stone); s.position = [(x0 + x1) / 2, (top + 0.02) / 2 - 0.02, (z0 + z1) / 2]; town.add(s); }
  town.add(d.root);
  // the hotspots: the box around the buildings each one names, its pin just over the tallest of them
  root.updateWorld(); const local = (n, p) => { const w = n.localToWorld(p); return [w[0] - O[0], w[1] - O[1], w[2] - O[2]]; };
  const bounds = (nodes) => {
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (const n of nodes) { const b = n.geometry.bounds; for (const x of [b.min[0], b.max[0]]) for (const y of [b.min[1], b.max[1]]) for (const z of [b.min[2], b.max[2]]) { const p = local(n, [x, y, z]); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], p[k]); mx[k] = Math.max(mx[k], p[k]); } } }
    return [mn, mx];
  };
  const hs = {};
  for (const [id, h] of Object.entries(plan.hotspots)) {
    let mn, mx;
    if (h.box) { mn = h.box[0].map((v, k) => v * K + (k === 1 ? Y : 0)); mx = h.box[1].map((v, k) => v * K + (k === 1 ? Y : 0)); }
    else {
      const subs = d.subs.filter((q) => (h.shops ? h.shops.includes(q.h.userData.shop) : q.h.userData.note?.hs === h.note));
      [mn, mx] = bounds((h.first ? subs.slice(0, 1) : subs).map((q) => q.h));
    }
    const size = [0, 1, 2].map((k) => mx[k] - mn[k]), center = [0, 1, 2].map((k) => (mn[k] + mx[k]) / 2);
    const hit = new Mesh(box(size[0], size[1], size[2]), M('hsHit', { color: [0, 0, 0], opacity: 0.01, transparent: true, depthWrite: false }));
    hit.position = center; hit.castShadow = false; root.add(hit);
    hs[id] = { mesh: hit, anchor: [center[0], mx[1] + 0.9, center[2]], center, size };
  }
  // the district's own click volumes have no part in a world (its places are the hotspots above)
  for (const q of d.subs) q.h.pickable = false;
  const lights = mini ? [] : plan.lights.map(([x, y, z], i) => ({ id: 'town' + i, position: [O[0] + x * K, Y + y * K, O[2] + z * K], color: color('#ffd6a3'), intensity: 3.6, distance: 20, base: 3.6 }));
  // everything that glows wakes as the visitor arrives; the moving parts (smoke, the orb, the flying elephant, the crane) keep moving
  const emissives = d.mats.filter((mt) => mt.emissiveIntensity > 0 && Math.max(...mt.emissive) > 0).map((mt) => ({ mat: mt, base: mt.emissiveIntensity }));
  const state = { wake: 0.3, target: 1 };
  const update = (dt, t) => {
    state.wake += (state.target - state.wake) * (1 - Math.exp(-2.2 * dt));
    for (const e of emissives) e.mat.emissiveIntensity = e.base * (0.12 + 0.88 * state.wake);
    if (!mini) for (const f of d.live) f(t);
    for (const l of lights) l.intensity = l.base * state.wake;
  };
  return { hs, lights, update, wake: state };
}
