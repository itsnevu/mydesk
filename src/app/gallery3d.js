// The Project Gallery: a miniature museum corridor modelled in Blender (assets/gallery.json + rooms.json).
// Seven plinths, one exhibit each. The selected exhibit is lit and near; the others fall back into the dark.
import { Node, Mesh, Material } from 'engine/scene';
import { box } from 'engine/geometry';
import { buildAsset } from 'engine/assets';
import { color } from 'engine/math';
import { ROOMS } from 'app/data';
import { T } from 'app/theme';

export const GALLERY_ORIGIN = [0, 0, 420];
export const ROOM_SPACING = 9;
const N = ROOMS.length;
const X0 = -ROOM_SPACING * (N - 1) / 2;
const PLINTH_TOP = 1.06;
const DISTRICT_SIZE = 38;   // the districts' plinth width; an exhibit's footprint is ~3.4 of it
const EXHIBIT_SIZE = 3.4;

export function buildGallery({ gallery, rooms }) {
  const root = new Node('gallery'); root.position = [...GALLERY_ORIGIN]; root.visible = false;
  const O = GALLERY_ORIGIN;
  const arch = buildAsset(gallery, { name: 'corridor', group: (n) => (n.startsWith('GAL_Sconce') ? 'sconce' : 'arch') });
  root.add(arch.root);
  const ex = buildAsset(rooms, { name: 'rooms', group: (n) => n.slice(0, n.indexOf('_')) });
  root.add(ex.root);
  const list = ROOMS.map((def, i) => {
    const x = X0 + i * ROOM_SPACING;
    const group = ex.groups.get(`R${i + 1}`) || new Node('empty');
    const mats = []; group.traverse((n) => { if (n.material) mats.push(n.material); });
    for (const m of mats) { m.userData = { baseColor: [...m.color], baseEm: m.emissiveIntensity }; }
    const hit = new Mesh(box(4.2, 3.6, 4.2), new Material({ color: [0, 0, 0], opacity: 0.01, transparent: true, depthWrite: false }), `room-hit:${i}`);
    hit.position = [x, 2.4, -1]; hit.castShadow = false; hit.pickable = true;
    hit.userData = { room: i, interactive: true, glow: 0, targetGlow: 0 };
    root.add(hit);
    // the exhibit is the small end of the portal into its district
    const frame = new Node(`room-frame:${i}`); frame.position = [x, PLINTH_TOP, -1]; const s = EXHIBIT_SIZE / DISTRICT_SIZE; frame.scale = [s, s, s]; root.add(frame);
    return { i, def, x, worldX: O[0] + x, group, mats, hit, frame, dim: 0.35, targetDim: 0.35,
      anchor: [O[0] + x, PLINTH_TOP + 0.55, O[2] - 1 + 2.2],           // the label plate on the plinth front
      labelAnchor: [O[0] + x - 3.4, 3.3, O[2] - 1 + 2.2] };
  });
  // lights: one sconce per room exists in the model; the renderer takes 4 point lights, so we light the selection and its neighbours
  const lightFor = (i, k) => ({ id: 'sconce' + k, position: [O[0] + X0 + i * ROOM_SPACING, 5.3, O[2] - 6.4], color: color(T.tungsten), intensity: 0, distance: 14 });
  const lights = [lightFor(0, 0), lightFor(1, 1), lightFor(2, 2), { id: 'gfill', position: [O[0], 7, O[2] + 10], color: color('#c99a66'), intensity: 1.0, distance: 70 }];
  const g = {
    root, origin: O, rooms: list, lights, selected: 0,
    // arrival: the corridor from its front edge, slightly elevated
    camera: { position: [O[0] + 5, 10.5, O[2] + 29], target: [O[0], 2.2, O[2] - 2] },
    selectorCamera: (i) => ({ position: [O[0] + X0 + i * ROOM_SPACING + 2.4, 6.2, O[2] + 12.5], target: [O[0] + X0 + i * ROOM_SPACING, 1.6, O[2] - 1] }),
    closeCamera: (i) => ({ position: [O[0] + X0 + i * ROOM_SPACING + 1.4, 4.4, O[2] + 7.2], target: [O[0] + X0 + i * ROOM_SPACING, 1.5, O[2] - 1] }),
    select(i) { g.selected = (i + N) % N; list.forEach((r, k) => { const d = Math.abs(k - g.selected); r.targetDim = d === 0 ? 1 : d === 1 ? 0.5 : 0.28; }); },
    update(dt, t) {
      const lam = 1 - Math.exp(-6 * dt);
      for (const r of list) {
        r.dim += (r.targetDim - r.dim) * lam;
        const u = r.hit.userData; u.glow += (u.targetGlow - u.glow) * (1 - Math.exp(-12 * dt));
        const f = Math.min(1.15, r.dim + u.glow * 0.15);
        for (const m of r.mats) { const b = m.userData.baseColor; m.color = [b[0] * f, b[1] * f, b[2] * f]; if (m.userData.baseEm) m.emissiveIntensity = m.userData.baseEm * (0.4 + 0.6 * f); }
      }
      // sconces follow the selection
      const sel = g.selected;
      [-1, 0, 1].forEach((d, k) => { const i = sel + d; const L = lights[k]; if (i < 0 || i >= N) { L.intensity = 0; return; } L.position[0] = O[0] + X0 + i * ROOM_SPACING; L.intensity = d === 0 ? 5 : 1.4; });
    },
  };
  g.select(0);
  return g;
}
