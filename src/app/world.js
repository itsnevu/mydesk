// Builds the desk scene: keyboard, portal keys, monitor, clock, note, lamp, mouse, mug. Warm dark room around it (app/room).
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, sphere, cylinder, torus, cone } from 'engine/geometry';
import { legendTexture, iconLegendTexture, ICONS, noiseTexture, drawTexture, MONO, SANS } from 'engine/textures';
import { buildAsset } from 'engine/assets';
import { color, lerp } from 'engine/math';
import { PROJECTS, SITE, TARGETS } from 'app/data';
import { T, C, MAT, BACKLIGHTS, DESK_LIGHTS } from 'app/theme';
import { buildRoom, PC_POS } from 'app/room';
import { buildWatchBox } from 'app/watches';
import { buildMonitors } from 'app/monitors';
import { buildClampLamp } from 'app/clamplamp';
import { buildWallDecor } from 'app/walldecor';
import { buildDeskGear } from 'app/deskgear';
import { buildLeftWall } from 'app/leftwall';
import { buildGWagon } from 'app/gwagon';
import { buildSatoshi } from 'app/satoshi';
import { flatten, atlasMerge } from 'app/bake';
import { buildMouse } from 'app/mouse';
import { buildMandarinBook } from 'app/mandarin';
import { buildCat } from 'app/cat';
import { buildDistrict, builtHere, buildKeyMini, keyBuiltHere, lowerParts } from 'app/kbtown';
const add =(parent, mesh, pos, rot, scale) => { if (pos) mesh.position = pos; if (rot) mesh.rotation = rot; if (scale) mesh.scale = scale; parent.add(mesh); return mesh; };
// the owner's name as the screens print it
const BRAND = SITE.name.toUpperCase();

// ---------- layout (tenkeyless). [label, width, id, sub]
const ROWS = [
  { z: 0, keys: [['esc', 1, 'esc'], [null, 1], ['F1', 1], ['F2', 1], ['F3', 1, 'mech'], ['F4', 1], [null, 0.5], [null, 3], ['F8', 1, 'f8'], [null, 0.5], ['F9', 1], ['F10', 1], ['F11', 1], ['F12', 1], [null, 0.25], ['prt', 1], ['scr', 1, 'secret'], [null, 1]] },
  { z: 1.5, keys: [['`', 1, null, '~'], ['1', 1, 'n1', '!'], ['2', 1, 'n2', '@'], ['3', 1, null, '#'], ['4', 1, null, '$'], ['5', 1, null, '%'], ['6', 1, null, '^'], [null, 4], ['-', 1, null, '_'], ['=', 1, null, '+'], ['⌫', 2], [null, 0.25], [null, 3]] },
  { z: 2.5, keys: [['tab', 1.5, 'tab'], ['Q', 1], ['W', 1, 'w'], ['E', 1], [null, 5], ['O', 1, 'o'], ['P', 1, 'p'], ['[', 1, 'stairs'], [']', 1, 'rbr'], ['\\', 1.5], [null, 0.25], [null, 3]] },
  { z: 3.5, keys: [['about', 1.75, 'caps'], ['A', 1, 'a'], ['S', 1, 's'], ['D', 1, 'd'], [null, 2], ['H', 1, 'sapling'], ['J', 1], ['K', 1], ['L', 1], [';', 1, 'garden'], ["'", 1, 'plaza'], ['enter', 2.25, 'enter']] },
  { z: 4.5, keys: [['shift', 2.25, 'lshift'], ['Z', 1], ['X', 1, 'x'], ['C', 1, 'c'], [null, 2], ['me', 1, 'n'], ['N', 1], ['M', 1], [',', 1], ['.', 1], ['/', 1], ['shift', 1.75, 'rshift'], [null, 1.25], ['▲', 1, 'up']] },
  { z: 5.5, keys: [['', 1.25, 'art1'], ['', 1.25, 'art2'], ['', 1.25, 'art3'], ['', 6.25, 'space'], ['', 1.25, 'art4'], ['fn', 1.25, 'fn'], ['', 1.25, 'art5'], ['ctrl', 1.25, 'rctrl'], [null, 0.25], ['◀', 1, 'left'], ['▼', 1, 'down'], ['▶', 1, 'right']] },
];
// Hero clusters: districts that replace several keycaps. Positions are keyboard-local (centre of the removed keys).
const CLUSTERS = {
  signal: { asset: 'cluster_signal', x: -0.125, z: -0.75, w: 4, d: 2 },
  market: { asset: 'cluster_market', x: -3.0, z: 0.75, w: 2, d: 3 },
  mechbay: { asset: 'cluster_mech', x: -1.125, z: -2.75, w: 3, d: 1 },
  lab: { asset: 'cluster_green', x: 7.625, z: -0.75, w: 3, d: 2 },
};
const KB_W = 18.25, KB_D = 6.5;
const CASE_H = 0.78, KEY_H = 0.55, KEY_GAP = 0.07;
const CAP_LIFT = 0.07, CAP_TRAVEL = 0.095;   // a cap rests on its switch a little above the plate and bottoms out just on it
const DIORAMA_KEYS = { o: 3, x: 4, rbr: 5, f8: 6 };
const MINI_SCALE = 0.0235;
const SPECIAL_KEYS = { mech: 'key_micro_switch', sapling: 'key_micro_tree', stairs: 'key_micro_stairs', secret: 'key_secret', enter: 'key_enter', plaza: 'key_plaza', garden: 'key_garden' };
const PORTAL_IDS = new Set([...Object.keys(DIORAMA_KEYS), ...Object.keys(SPECIAL_KEYS)]);
const CREAM_IDS = new Set(['caps', 'n', 'space', 'enter']);
const BRONZE_IDS = new Set(['esc', 'pause']);
const ICON_KEYS = { a: ['about', 'about'], s: ['skills', 'skills'], c: ['contact', 'contact'], w: ['work', 'work'], p: ['time', 'timeline'], art1: ['cup'], art2: ['leaf'], art3: ['bread'], art4: ['bookmark'], art5: ['cat'] };

// A diorama key or a district, from its Blender parts: drawn merged (one mesh per material name, then the plain parts share
// palette draws) but picked as precisely as the parts themselves (an invisible box per original part), so a tall district never
// swallows the clicks meant for the keys around it. The shell (the body that glows on hover) stays its own mesh and material.
// skip(part, centre) leaves a part out before anything is built from it.
const HIT_MAT = new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false });
function buildMiniature(json, name, overrides, { skip = null } = {}) {
  const a = buildAsset(json, { name, group: (n) => n, overrides });
  const root = a.root, parts = [];
  root.traverse((n) => { if (n.geometry) parts.push(n); });
  if (skip) for (const p of parts) { const b = p.geometry.bounds; if (skip(p, [0, 1, 2].map((k) => (b.min[k] + b.max[k]) / 2))) p.parent?.remove(p); }
  const kept = parts.filter((p) => p.parent);
  const shell = a.groups.get('shell')?.children.find((c) => c.parent && c.material && !c.material.transparent) || kept.find((c) => c.material && !c.material.transparent);
  if (shell) shell.userData.dynamic = true;
  const proxies = kept.map((p) => { const b = p.geometry.bounds, sz = [0, 1, 2].map((k) => Math.max(0.05, b.max[k] - b.min[k])); const h = new Mesh(box(sz[0], sz[1], sz[2]), HIT_MAT, 'hit-part'); h.position = [0, 1, 2].map((k) => (b.min[k] + b.max[k]) / 2); h.castShadow = false; h.pickable = true; return h; });
  for (const h of proxies) root.add(h);
  flatten(root, name, { keyOf: (n) => `${n.name.split(':').pop()}|${n.material.transparent ? 1 : 0}|${n.material.opacity}|${n.material.doubleSide ? 1 : 0}` });
  const mats = atlasMerge(root, name);
  return { root, shell, mats, proxies };
}

// A sheet of paper lying on the desk: a slight bow across it and its back right corner lifting off (a plane, its texture the
// same way round as a box's top face)
function curledSheet(w, d, segs = 12) {
  const pos = [], nor = [], uv = [], idx = [];
  const h = (x, z) => { const u = x / w + 0.5, v = z / d + 0.5, c = Math.max(0, u + (1 - v) - 1.25); return 0.24 * c * c + 0.012 * Math.sin(Math.PI * u); };
  for (let j = 0; j <= segs; j++) for (let i = 0; i <= segs; i++) {
    const x = (i / segs - 0.5) * w, z = (j / segs - 0.5) * d, e = 0.01;
    const dx = (h(x + e, z) - h(x - e, z)) / (2 * e), dz = (h(x, z + e) - h(x, z - e)) / (2 * e), l = Math.hypot(dx, 1, dz);
    pos.push(x, h(x, z), z); nor.push(-dx / l, 1 / l, -dz / l); uv.push(i / segs, 1 - j / segs);
  }
  for (let j = 0; j < segs; j++) for (let i = 0; i < segs; i++) { const q = j * (segs + 1) + i; idx.push(q, q + segs + 1, q + 1, q + 1, q + segs + 1, q + segs + 2); }
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], pos[i + k]); max[k] = Math.max(max[k], pos[i + k]); }
  return { positions: new Float32Array(pos), normals: new Float32Array(nor), uvs: new Float32Array(uv), indices: new Uint16Array(idx), bounds: { min, max } };
}

export function buildWorld({ keyboardBody = null, keyAssets = {}, deskProps = null } = {}) {
  const root = new Node('world');
  const world = { root, keys: [], targets: {}, pickables: [], lights: [], towns: {}, backlightIndex: 0, t: 0, lightLevel: 0, lampOn: true, musicOn: false };

  // ---------- desk: dark walnut with grain, and a matte desk mat
  const desk = new Mesh(roundedBox({ w: 96, h: 2.6, d: 48, r: 0.35, seg: 3, uvTopOnly: false }), new Material({ ...MAT.walnut, map: woodTexture(), mapRepeat: [3, 2] }), 'desk');
  desk.castShadow = false; desk.position[1] = -1.32; desk.position[2] = 0;   // z -24..24
  root.add(desk);
  const mat =new Mesh(roundedBox({ w: 30, h: 0.12, d: 13, r: 0.06, seg: 2, uvTopOnly: false }), new Material({ ...MAT.matte, map: noiseTexture(256, [30, 24, 18], 7, true), mapRepeat: [6, 3] }), 'deskmat');
  mat.position[1] = 0.06; mat.position[2] = 0.6; mat.castShadow = false;
  root.add(mat);

  // ---------- desk environment props (Blender): books, an architectural model, tools, plants, containers, sketches, a small shelf
  const deskHits = {};
  if (deskProps) {
    // the shelf wall is far from every lamp: its plaster gets the room's painted-in light, so it reads as a wall, not a black board
    const dp = buildAsset(deskProps, { name: 'desk-props', group: (n) => n, overrides: { KW_Plaster3: { color: [0.07, 0.07, 0.074], emissive: [0.045, 0.045, 0.048], emissiveIntensity: 1 }, KW_Plaster2: { emissive: [0.07, 0.037, 0.017], emissiveIntensity: 1 } } }); dp.root.position = [0, 0, 0]; root.add(dp.root);
    // the clock's dial and glass are live canvas textures on our side; drop the export's static ones
    // the exported desk monitor is replaced by the three 27" screens (app/monitors)
    { const mg = dp.groups.get('monitor_body'); if (mg) mg.visible = false; }
    // the exported backboard behind the screens is lit by the desk lights while the room's back wall (app/room) is painted:
    // against the grey room it read as a pale panel, so the room's own wall shows instead
    { const wg = dp.groups.get('wall'); if (wg) wg.visible = false; }
    { const cg = dp.groups.get('clock_body'); if (cg) for (const m2 of [...cg.children]) if (/KW_Cream|KW_WarmGlass/.test(m2.name)) cg.remove ? cg.remove(m2) : (m2.visible = false); }
    // nothing sinks into the desk mat (its top is y 0.12): what lies on it rides on top, what sat on its edge steps off it;
    // the exported monitor cable and its clips went with the old monitor (the cabling lives in app/cables now)
    for (const [k, g] of dp.groups) {
      if (/^DK_Cable/.test(k)) g.visible = false;
      else if (/^DK_Mug_|^pencil$|^ruler$/.test(k)) g.position[1] = 0.12;
      else if (/^DK_Plant_/.test(k)) g.position[2] = -1.0;
      else if (k === 'clock_body') g.position[2] = -0.6;
      else if (k === 'sketch') { g.position[0] = -2.4; g.position[2] = -0.5; }
    }
    // the exported lamp shade is a closed cone and its rim a closed thin disc: drop the caps over the mouth so the bulb shows inside
    { const sm = dp.groups.get('DK_Lamp_shade')?.children[0], rm = dp.groups.get('DK_Lamp_rim')?.children[0]; if (sm) openLampShade(sm, rm); }
    { const parts = [...dp.groups.entries()].filter(([k]) => /^DK_Plant_/.test(k)).map(([, g]) => g);
      if (parts.length) {
        const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
        for (const g of parts) g.traverse((m2) => { if (m2.geometry) { const b = m2.geometry.bounds; for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], b.min[k] + g.position[k]); mx[k] = Math.max(mx[k], b.max[k] + g.position[k]); } } });
        const pivot = new Node('plant'); pivot.position = [(mn[0] + mx[0]) / 2, mn[1], (mn[2] + mx[2]) / 2]; dp.root.add(pivot);
        for (const g of parts) { g.position = g.position.map((v, k) => v - pivot.position[k]); pivot.add(g); }
        dp.groups.set('plant-pivot', pivot);
      } }
    root.updateWorld();
    for (const [gname, id, size, lift] of [['books', 'notebook', [4.2, 1.8, 3.2], 0.9], ['arch_model', 'model', [4.6, 2.2, 3.6], 1.1], ['plant-pivot', 'plant', [3.0, 4.6, 3.0], 2.3]]) {
      const g = dp.groups.get(gname) || [...dp.groups.entries()].find(([k]) => k.startsWith(gname))?.[1]; if (!g) continue;
      let c = [0, 0, 0], n = 0; g.traverse((m2) => { if (m2.geometry) { const b = m2.geometry.bounds; const wc = m2.localToWorld([(b.min[0] + b.max[0]) / 2, 0, (b.min[2] + b.max[2]) / 2]); c[0] += wc[0]; c[2] += wc[2]; n++; } }); if (!n) continue;
      const hit = new Mesh(box(size[0], size[1], size[2]), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), 'hit:' + id);
      hit.position = [c[0] / n, lift, c[2] / n]; hit.castShadow = false; hit.pickable = true; hit.userData = { keyId: id, interactive: true, glow: 0, targetGlow: 0, group: g }; root.add(hit); world.pickables.push(hit); deskHits[id] = hit;
    }
    // the props are ~100 Blender parts, one draw each: bake the static ones into one mesh per material, keyed by the material's
    // name (the asset builds a Material per part); the planter that sways when it is clicked stays its own node
    { const pl = deskHits.plant?.userData.group; if (pl) { flatten(pl, 'plant', { keyOf: (n) => n.name.split(':').pop() }); pl.userData.dynamic = true; }
      flatten(dp.root, 'desk-props', { keyOf: (n) => `${n.name.split(':').pop()}|${n.material.doubleSide ? 1 : 0}|${n.material.opacity}` });
      atlasMerge(dp.root, 'desk-props'); }
  }
  // ---------- watch box (left of the books, between the pencil pot and the PC), opening toward the keyboard: Nautilus, Santos, Aquaracer
  const WATCH_POS = [-22.6, 0, -2.4];
  const watchBox = buildWatchBox(); watchBox.root.position = [...WATCH_POS]; watchBox.root.rotation[1] = Math.PI / 2; root.add(watchBox.root);
  watchBox.hit.userData = { keyId: 'watches', interactive: true, glow: 0, targetGlow: 0 }; world.pickables.push(watchBox.hit); world.watchBox = watchBox;
  // ---------- a plain swing-arm lamp clamped to the right edge of the desk (click to switch it)
  const clampLamp = buildClampLamp(); root.add(clampLamp.root); world.pickables.push(clampLamp.hit); world.clampLamp = clampLamp;
  // ---------- the back wall above the screens (to-do board, Pokémon things, trailing plants) and two small things on the desk
  root.add(buildWallDecor().root);
  const deskGear = buildDeskGear(); root.add(deskGear.root);
  // a Mandarin course book and two flashcards on the free right front of the desk; clicked, the cover opens (app/mandarin)
  const mandarin = buildMandarinBook(); root.add(mandarin.root); world.pickables.push(mandarin.hit, mandarin.cardsHit); world.mandarin = mandarin;
  // a 1:18 G 63 in its case on the bookshelf (between the stacked books and the plant), Satoshi on a pedestal by the right wall
  const g63 = buildGWagon(); g63.root.position = [82.5, 20, -22]; root.add(g63.root);
  const satoshi = buildSatoshi(); root.add(satoshi.root); world.pickables.push(satoshi.hit);
  // ---------- the left wall: a neon "ship it." over the print (click to switch it), a monstera, a pull-up + dip tower
  const leftWall = buildLeftWall(); root.add(leftWall.root); world.pickables.push(leftWall.neonHit, leftWall.towerHit, leftWall.katanaHit); world.leftWall = leftWall;
  // ---------- the room around the desk (floor, walls, window, the bookshelf of projects) and, on the desk, the PC and two speakers
  const room = buildRoom(root); world.room = room; world.pickables.push(...room.pickables);
  // the cat (app/cat), asleep on the desk chair, her feeder on the floor beside it; she dims and wakes with the room
  const cat = buildCat(); root.add(cat.root); world.pickables.push(cat.hits.cat, cat.hits.bowl); world.cat = cat;
  for (const m of cat.dimmable) room.dim(m); cat.onMaterial = (m) => room.dim(m);
  // ---------- keyboard
  const kb = new Node('keyboard'); kb.position = [0, 0.12, 0.2]; root.add(kb);
  // the chassis is a Blender asset (assets/keyboard_body.json): layered shell, bronze seam, bezel, plate, screws, walnut cheeks, feet, knob, braided cable
  const plateMat = new Material({ color: color('#0a0806'), roughness: 0.9, emissive: color(BACKLIGHTS[0].hex), emissiveIntensity: 0.03 });
  let plateLit = plateMat;   // the chassis' plate (its dark plastic) takes the backlight's glow
  if (keyboardBody) { const body = buildAsset(keyboardBody, { name: 'chassis', group: () => 'all', overrides: { KW_WarmBrass: { roughness: 0.5, metalness: 0.75 }, KW_Bronze: { roughness: 0.5 } } }); kb.add(body.root); body.root.traverse((n) => { if (n.material && n.name.endsWith(':KW_DarkPlastic')) plateLit = n.material; }); }
  else { const fallback = new Mesh(roundedBox({ w: KB_W + 0.7, h: CASE_H, d: KB_D + 0.7, r: 0.22, seg: 3 }), new Material(MAT.casePlastic), 'case'); fallback.position[1] = CASE_H / 2; kb.add(fallback); }
  const caseMesh = new Mesh(box(KB_W + 1.6, CASE_H + 0.2, KB_D + 1.0), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), 'case-hit');
  caseMesh.position[1] = CASE_H / 2; caseMesh.castShadow = false; kb.add(caseMesh);

  const geoCache = new Map();
  // sculpted profile: each row has its own cap height, taper and tilt (like a real SA/Cherry profile), so the board reads as a landscape
  const PROFILE = [{ h: 0.5, tilt: 0.09, taper: 0.8, dish: 0.02 }, { h: 0.64, tilt: 0.07, taper: 0.8, dish: 0.035 }, { h: 0.6, tilt: 0.035, taper: 0.82, dish: 0.03 }, { h: 0.56, tilt: 0, taper: 0.83, dish: 0.03 }, { h: 0.54, tilt: -0.04, taper: 0.84, dish: 0.025 }, { h: 0.52, tilt: -0.06, taper: 0.86, dish: 0.015 }];
  const keyGeo = (w, ri) => { const pr = PROFILE[ri] || PROFILE[3]; const k = `${w.toFixed(2)}|${ri}`; if (!geoCache.has(k)) geoCache.set(k, roundedBox({ w: w - KEY_GAP, h: pr.h, d: 1 - KEY_GAP, r: 0.1, seg: 4, taper: pr.taper, dish: pr.dish })); return geoCache.get(k); };
  const inkMats = [], iconMats = [], portalCaps = [];
  const capAspect = (w) => (w - KEY_GAP) / (1 - KEY_GAP);
  const startX = -KB_W / 2, startZ = -KB_D / 2;
  const legends = {};
  for (const [ri, row] of ROWS.entries()) {
    let x = startX; const pr = PROFILE[ri] || PROFILE[3];
    for (const [label, w, id, sub] of row.keys) {
      if (label === null) { x += w; continue; }
      const cx = x + w / 2, cz = startZ + row.z + 0.5; x += w;
      const isCream = CREAM_IDS.has(id), isPortal = PORTAL_IDS.has(id);
      const isBronze = BRONZE_IDS.has(id), isIcon = !!ICON_KEYS[id], isArt = id?.startsWith('art');
      let tex;
      if (isIcon) tex = iconLegendTexture(ICONS[ICON_KEYS[id][0]], null, { dark: !isCream, aspect: capAspect(w) });
      else tex = legendTexture(label, { sub, dark: !isCream, size: w > 1.4 ? 0.9 : 1, align: w > 1.4 ? 'left' : 'center', aspect: capAspect(w) });
      const { map, emissiveMap } = tex;
      let material;
      if (isPortal) {
        // secondary project keys: contained, subtle, a numbered engraved cap that lights amber, nothing sitting on top of it
        const numTex = iconLegendTexture(ICONS.num(label), null, { dark: true });
        material = new Material({ ...MAT.plastic, color: color('#1c1712'), emissive: C.amber, emissiveIntensity: 1.2, emissiveMap: numTex.emissiveMap });
      } else if (isCream) {
        material = new Material({ ...MAT.cream, map });
      } else if (isBronze) {
        material = new Material({ ...MAT.bronze, roughness: 0.5, color: color('#a05a2c'), map });
      } else if (isArt) {
        material = new Material({ color: color(['#8e6a3d', '#6f6a4a', '#a8865a', '#8a5a34', '#6b5a48'][Number(id.slice(3)) - 1]), roughness: 0.8, map });
      } else if (isIcon) {
        material = new Material({ ...MAT.plastic, color: color('#1c1712'), emissive: C.amber, emissiveIntensity: 1.6, emissiveMap });
        iconMats.push(material);
      } else {
        // controlled irregularity: every standard cap is a slightly different batch (tone + wear), never identical
        const seed = ((cx * 7.31 + cz * 3.17) % 1 + 1) % 1; const tone = 0.9 + seed * 0.2;
        material = new Material({ ...MAT.plastic, color: MAT.plastic.color.map((c) => c * tone), roughness: 0.5 + seed * 0.25, emissive: color(BACKLIGHTS[0].hex), emissiveIntensity: 0.85, emissiveMap });
        inkMats.push(material);
      }
      let mesh;
      const assetName = DIORAMA_KEYS[id] !== undefined ? `key_0${DIORAMA_KEYS[id] + 1}` : SPECIAL_KEYS[id];
      if (isPortal && keyAssets[assetName]) {
        // TYPE E, a diorama key: charcoal shell with a recessed tray, brass lip, acrylic lid and the world's miniature inside
        // one draw per material for the whole miniature (not one per Blender part); the shell's material is found by its name
        // a chapter built in code (app/kbtown) keeps only the key's Blender shell, or builds on top of all of it (F8's mountain)
        const built = keyBuiltHere(id); let kjson = built === 'replace' ? { ...keyAssets[assetName], meshes: keyAssets[assetName].meshes.filter((m) => m.name === 'shell') } : keyAssets[assetName];
        // the sunken garden's pine stood 1.2 high in its back-left corner, right in front of P: it is cut down to about half
        if (id === 'garden') kjson = lowerParts(kjson, (me, b) => me.name === 'mini' && b.max[0] < 0.01 && b.max[2] < 0.01 && b.max[1] > 0.7, 0.55, 0.52);
        const mini = buildMiniature(kjson, `key:${id}`, { KW_WarmBrass: { roughness: 0.55, metalness: 0.7 }, KW_ClearAcrylic: { opacity: 0.14 }, KW_WarmGlass: { opacity: 0.2 }, KW_DarkPlastic: { roughness: 0.78, metalness: 0.02 } });
        mesh = mini.root; const first = mini.shell, live = mini.mats;
        mesh.material = first ? first.material : new Material(MAT.plastic);
        for (const h of mini.proxies) h.userData = { ownerKey: mesh };
        const km = built ? buildKeyMini(id, keyAssets[assetName]) : null;
        if (km) { mesh.add(km.root); live.push(...km.mats); for (const h of km.hits) h.userData = { ownerKey: mesh }; world.towns['key:' + id] = { update: km.update, spot: () => null }; }
        portalCaps.push({ x: cx, z: cz, hw: (w - KEY_GAP) / 2, hd: (1 - KEY_GAP) / 2 });
        // the miniature's own lights (windows, lamps, screens) sleep until the visitor comes close or reaches for the key
        mesh.__emissives = live.filter((mt) => mt.emissiveIntensity > 0 && Math.max(...mt.emissive) > 0 && mt !== mesh.material).map((mt) => ({ mat: mt, base: mt.emissiveIntensity }));
        mesh.__rims = live.filter((mt) => !mt.transparent && mt.emissiveIntensity === 0 && mt.metalness < 0.5).map((mt) => ({ mat: mt, base: mt.fresnel || 0 }));
        mesh.__wake = 0;
        const fj = keyAssets[assetName].frame || { scale: MINI_SCALE, offset: [0, 0.38, 0] };
        const frame = new Node('frame:' + id); frame.position = [...fj.offset]; frame.scale = [fj.scale, fj.scale, fj.scale]; mesh.add(frame);
        mesh.position = [cx, CASE_H, cz];
        mesh.userData = { keyId: id, label, restY: CASE_H, press: 0, targetPress: 0, width: w, interactive: true, glow: 0, targetGlow: 0, baseEmissive: mesh.material.emissiveIntensity, baseFresnel: 0, frame, diorama: true, pressDepth: id === 'secret' ? -0.35 : 0.16 };
      } else {
        mesh = new Mesh(keyGeo(w, ri), material, `key:${id || label}`);
        mesh.position = [cx, CASE_H + CAP_LIFT + pr.h / 2, cz]; mesh.rotation[0] = pr.tilt;
        mesh.userData = { keyId: id, label, restY: CASE_H + CAP_LIFT + pr.h / 2, pressDepth: CAP_TRAVEL, press: 0, targetPress: 0, width: w, interactive: !!(id && TARGETS[id]), glow: 0, targetGlow: 0, baseEmissive: material.emissiveIntensity, baseFresnel: material.fresnel };
        mesh.pickable = true;
      }
      kb.add(mesh); world.keys.push(mesh); if (mesh.userData.diorama) mesh.traverse((n) => { if (n.pickable) world.pickables.push(n); }); else world.pickables.push(mesh);
      if (id) legends[id] = mesh;
    }
  }
  // ---------- hero clusters (Blender): open districts set into the key bed where caps were removed
  for (const [id, cdef] of Object.entries(CLUSTERS)) {
    let json = keyAssets[cdef.asset]; if (!json) continue;
    // a district built in code (app/kbtown) keeps only its Blender shell, the stone it stands on; what stands on it is made there
    if (builtHere(id)) json = { ...json, meshes: json.meshes.filter((m) => m.name === 'shell') };
    // a district never grows into the diorama key beside it: a part whose centre falls on such a cap is left out
    const onKey = (p, c) => portalCaps.some((k) => Math.abs(cdef.x + c[0] - k.x) < k.hw && Math.abs(cdef.z + c[2] - k.z) < k.hd);
    const mini = buildMiniature(json, `cluster:${id}`, { KW_WarmBrass: { roughness: 0.55, metalness: 0.7 }, KW_WarmGlass: { opacity: 0.16 }, KW_DarkPlastic: { roughness: 0.78, metalness: 0.02 } }, { skip: onKey });
    const mesh = mini.root, first = mini.shell, live = mini.mats;
    mesh.material = first ? first.material : new Material(MAT.plastic);
    for (const h of mini.proxies) h.userData = { ownerKey: mesh };
    // a district's low stone steps lie under the keyboard case's own click box (0.1 over the plate): a thin floor box over each
    // step, just higher than that, keeps a click on a street or a square for the district (only its own steps, never a key)
    for (const h of mini.proxies) {
      const b = h.geometry.bounds, sx = b.max[0] - b.min[0], sz = b.max[2] - b.min[2];
      if (h.position[1] + b.max[1] > 0.15 || sx < 0.3 || sz < 0.3) continue;
      const f = new Mesh(box(sx, 0.16, sz), HIT_MAT, 'hit-floor'); f.position = [h.position[0], 0.08, h.position[2]]; f.castShadow = false; f.pickable = true; f.userData = { ownerKey: mesh }; mesh.add(f);
    }
    // its buildings and shops (already merged, each with its own tight click volume, which belongs to the district too)
    const town = buildDistrict(id);
    if (town) { mesh.add(town.root); live.push(...town.mats); for (const h of town.hits) h.userData.ownerKey = mesh; world.towns[id] = town; }
    mesh.__emissives = live.filter((mt) => mt.emissiveIntensity > 0 && Math.max(...mt.emissive) > 0).map((mt) => ({ mat: mt, base: mt.emissiveIntensity }));
    mesh.__rims = []; mesh.__wake = 0;
    const fj = json.frame; let frame = null;
    if (fj) { frame = new Node('frame:' + id); frame.position = [...fj.offset]; frame.scale = [fj.scale, fj.scale, fj.scale]; mesh.add(frame); }
    mesh.position = [cdef.x, CASE_H, cdef.z];
    mesh.userData = { keyId: id, label: id, restY: CASE_H, press: 0, targetPress: 0, width: cdef.w, depth: cdef.d, interactive: true, glow: 0, targetGlow: 0, baseEmissive: 0, baseFresnel: 0, frame, diorama: true, cluster: true, pressDepth: 0.05 };
    kb.add(mesh); world.keys.push(mesh); mesh.traverse((n) => { if (n.pickable) world.pickables.push(n); }); legends[id] = mesh;
  }
  { const feet = new Node('feet'), footMat = new Material(MAT.bronze); kb.add(feet);
    for (const [dx, dz] of [[-8, -3], [8, -3], [-8, 3], [8, 3]]) { const foot = new Mesh(cylinder(0.25, 0.3, 0.14, 16), footMat); foot.position = [dx, -0.07, dz]; feet.add(foot); }
    flatten(feet, 'feet'); }
  caseMesh.pickable = true; caseMesh.userData = { keyId: 'keyboard', interactive: true, glow: 0, targetGlow: 0 }; world.pickables.push(caseMesh);
  world.lights.push({ id: 'well', position: [0, CASE_H + 1.6, 0.2], color: color(T.tungsten), intensity: 1.2, distance: 8, base: 1.2 });
  world.inkMats = inkMats; world.iconMats = iconMats; world.plateMat = plateLit; world.inkScale = 1;

  // ---------- monitor: bronze stand, dark glass screen
  // three 27" panels on a pole stand (app/monitors): design references on the left, code in the middle, and on the right
  // the site being built, which is the clickable portfolio screen
  const screenTex = makeScreenTexture();
  const screenMat = new Material({ color: [1, 1, 1], unlit: true, map: screenTex.texture });
  const monitors = buildMonitors(screenMat); root.add(monitors.root); world.monitors = monitors;
  const screen = monitors.portfolio; const SCR = monitors.portfolioPos, SN = monitors.portfolioNormal;
  screen.pickable = true; screen.userData = { keyId: 'monitor', interactive: true, glow: 0, targetGlow: 0 };
  world.pickables.push(screen); world.screenTex = screenTex; world.screenMat = screenMat;
  // the drawn guide button's click volume (canvas 600..952 × 470..524 of 1024 × 560 → screen-local), a hair in front of the glass
  const guideHit = new Mesh(box(10.5, 1.7, 0.3), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), 'hit:guide');
  guideHit.position = [((776 / 1024) - 0.5) * 30.6, (0.5 - 497 / 560) * 17.2, 0.16]; guideHit.castShadow = false; guideHit.pickable = true;
  guideHit.userData = { keyId: 'guide', interactive: true, glow: 0, targetGlow: 0 }; screen.add(guideHit); world.pickables.push(guideHit);

  // ---------- desk clock (right of monitor): bronze body, cream face, live hands → timeline
  const clockG = new Node('clock-group'); clockG.position = [10.6, 0.12, -7.0]; clockG.rotation[1] = -0.35; root.add(clockG);
  const clockBody = new Mesh(cylinder(1.5, 1.5, 0.7, 40), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), 'clock'); clockBody.castShadow = false; clockBody.rotation[0] = Math.PI / 2; clockBody.position = [0, 1.63, 0];
  clockBody.pickable = true; clockBody.userData = { keyId: 'clock', interactive: true, glow: 0, targetGlow: 0 }; clockG.add(clockBody); world.pickables.push(clockBody);
  const clockTex = makeClockTexture();
  const face = new Mesh(cylinder(1.3, 1.3, 0.02, 40), new Material({ ...MAT.cream, map: clockTex.texture, emissive: C.cream, emissiveIntensity: 0.04 }), 'clock-face');
  // the Blender body's front bezel (KW_BronzeDark) is a solid disc r1.62 spanning z 0.36–0.48 around centre y 1.63: seat the dial and glass just on its face
  face.rotation[0] = -Math.PI / 2; face.position = [0, 1.63, 0.495]; face.castShadow = false; clockG.add(face);
  const glassFace = new Mesh(cylinder(1.35, 1.35, 0.04, 40), new Material({ ...MAT.glass, opacity: 0.18, transparent: true, fresnel: 0.5, fresnelColor: C.highlight, depthWrite: false }), 'clock-glass');
  glassFace.rotation[0] = Math.PI / 2; glassFace.position = [0, 1.63, 0.53]; glassFace.castShadow = false; clockG.add(glassFace);
  world.clockTex = clockTex; world.clockBody = clockBody;

  // ---------- mouse (right): a sculpted right-handed mouse (app/mouse) → navigation guide
  const mouseG = new Node('mouse-group'); mouseG.position = [12.7, 0.12, 1.9]; mouseG.rotation[1] = -0.25; root.add(mouseG);
  const mouse = buildMouse(); mouseG.add(mouse.root);
  const mouseBody = mouse.body; mouseBody.pickable = true; mouseBody.userData = { keyId: 'mouse', interactive: true, glow: 0, targetGlow: 0 }; world.pickables.push(mouseBody);
  for (const m of mouse.parts) { m.pickable = true; m.userData = { ownerKey: mouseBody }; world.pickables.push(m); }
  const mouseWheel = mouse.wheel; world.mouseWheel = mouseWheel;
  const mouseLine = mouse.line; world.mouseLine = mouseLine;

  // ---------- mug (left): ceramic, coffee, steam on hover (hidden discovery)
  const mugG = new Node('mug-group'); mugG.position = [-13.4, 0.12, -3.6]; root.add(mugG);
  // the mug itself is a Blender prop (DK_Mug_*); this is only its hit volume, the steam stays procedural
  const mug = new Mesh(cylinder(1.15, 1.15, 2.2, 16), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), 'mug'); mug.position[1] = 1.1; mug.castShadow = false; mug.pickable = true; mug.userData = { keyId: 'mug', interactive: true, glow: 0, targetGlow: 0 };
  mugG.add(mug); world.pickables.push(mug);
  const steam = [];
  for (let i = 0; i < 4; i++) {
    const s = new Mesh(sphere(0.2, 12, 8), new Material({ color: [1, 0.95, 0.85], opacity: 0, transparent: true, unlit: true, depthWrite: false }), 'steam');
    s.position = [(i - 1.5) * 0.25, 2.1, 0]; s.castShadow = false; mugG.add(s); steam.push(s);
  }
  world.steam = steam;

  // ---------- lamp (left back): aged bronze, tungsten bulb → light toggle
  const lampG = new Node('lamp'); lampG.position = [-15, 0, -8]; root.add(lampG);
  // the articulated lamp is a Blender prop (DK_Lamp_*); here: an invisible head to click and the bulb that actually glows
  // shadeG sits on the Blender shade's apex (DK_Lamp_shade: cone r1.55, 1.79 long) with local −y down its axis, so the bulb lands inside the shade
  const shadeG = new Node('shade'); shadeG.position = [4.255, 6.128, 3.041]; shadeG.rotation = [-0.529, 0, 0.584]; lampG.add(shadeG);
  const head = new Mesh(cone(1.6, 1.9, 12), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), 'lamp-head'); head.position = [0, -0.92, 0]; head.castShadow = false; head.pickable = true; head.userData = { keyId: 'lamp', interactive: true, glow: 0, targetGlow: 0 }; shadeG.add(head); world.pickables.push(head);
  const bulbMat = new Material({ color: [1, 1, 1], emissive: color(T.tungsten), emissiveIntensity: 3, unlit: true });
  const bulb = new Mesh(sphere(0.32, 12, 8), bulbMat); bulb.position = [0, -1.2, 0]; bulb.castShadow = false; shadeG.add(bulb);
  world.bulbMat = bulbMat; world.lampHead = head; world.shadeG = shadeG;

  // ---------- notebook (front right): closed, cream pages, bronze spine
  // it lies on the bare desk right of the mat, clear of the mouse, the pencil and the ruler
  const nb = new Node('notebook'); nb.position = [19.6, 0, 9.6]; nb.rotation[1] = -0.22; root.add(nb);
  const nbCover = new Mesh(roundedBox({ w: 4.2, h: 0.5, d: 5.6, r: 0.08, seg: 2 }), new Material({ color: color('#2a1c11'), roughness: 0.7 })); nbCover.position[1] = 0.25; nb.add(nbCover);
  const nbPages = new Mesh(box(4.0, 0.34, 5.3), new Material(MAT.paper)); nbPages.position = [0.1, 0.25, 0]; nb.add(nbPages);
  const spine = new Mesh(box(0.22, 0.54, 5.6), new Material(MAT.bronzeDark)); spine.position = [-2.05, 0.27, 0]; nb.add(spine);
  const band = new Mesh(box(0.35, 0.56, 5.65), new Material({ color: color('#3a1f10'), roughness: 0.8 })); band.position = [1.2, 0.27, 0]; nb.add(band);

  // ---------- skills, written on the desk mat under the lamp; the light reveals them
  const skillsTex = drawTexture(2048, 400, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'top';
    const colW = w / SITE.skills.length;
    SITE.skills.forEach((g, i) => {
      const x = 40 + i * colW; let y = 36;
      ctx.font = `600 26px ${MONO}`; ctx.letterSpacing = '6px'; ctx.fillText(g.group.toUpperCase(), x, y); y += 52;
      ctx.font = `500 44px ${SANS}`; ctx.letterSpacing = '0px';
      for (const it of g.items) { ctx.fillText(it, x, y); y += 60; }
    });
  });
  const skillsMat = new Material({ color: C.cream, map: skillsTex, unlit: true, opacity: 0, transparent: true, depthWrite: false, receiveShadow: false });
  const skillsDecal = new Mesh(box(14, 0.01, 2.75), skillsMat, 'skills-decal'); skillsDecal.position = [0.5, 0.135, 5.55]; skillsDecal.castShadow = false; root.add(skillsDecal);
  world.skillsMat = skillsMat; world.skillsReveal = 0;

  // ---------- plant (right back)
  // (the potted plant by the clock is a Blender prop: DK_Plant_*)

  // ---------- note (front left): cream paper → about
  const note = new Mesh(curledSheet(2.6, 2.6, 12), new Material({ ...MAT.paper, map: makeNoteTexture() }), 'note');
  note.position = [-13.2, 0.14, 3.2]; note.rotation[1] = 0.28; note.pickable = true; note.userData = { keyId: 'note', interactive: true, glow: 0, targetGlow: 0, restY: undefined };
  root.add(note); world.pickables.push(note); world.note = note;

  // ---------- targets & camera stages
  const kbY = kb.position[1], kbZ = kb.position[2];
  const keyWorld = (id) => { const m = legends[id]; return [m.position[0], kbY + m.position[1] + KEY_H / 2, kbZ + m.position[2]]; };
  const stagesFor = (id) => {
    const p = keyWorld(id); const t = TARGETS[id]; const u = legends[id]?.userData || {}; const sc = Math.max(1, ((u.width || 1) + (u.depth || 1)) * 0.42);
    if (u.cluster && t.kind === 'world') return [{ position: [p[0] + 0.3 * sc, p[1] + 2.2 * sc, p[2] + 2.0 * sc], target: [p[0], p[1] + 0.2, p[2]] }, { position: [p[0] + 0.9, p[1] + 1.1, p[2] + 1.6], target: [p[0], p[1] + 0.35, p[2] - 0.1] }];
    if (u.cluster) return [{ position: [p[0] + 0.5 * sc, p[1] + 1.4 * sc, p[2] + 1.5 * sc], target: [p[0], p[1] + 0.15, p[2]] }];
    if (t.kind === 'portal') return [
      { position: [p[0] + 0.15, p[1] + 2.6, p[2] + 2.3], target: [p[0], p[1] - 0.2, p[2]] },
      { position: [p[0] + 0.05, p[1] + 1.15, p[2] + 1.05], target: [p[0], p[1] - 0.25, p[2] - 0.05] },
    ];
    if (t.kind === 'world') return [{ position: [p[0] + 0.2, p[1] + 2.4, p[2] + 2.0], target: [p[0], p[1] - 0.2, p[2]] }, { position: [p[0] + 0.9, p[1] + 1.25, p[2] + 1.5], target: [p[0], p[1] + 0.3, p[2]] }];
    if (t.kind === 'micro' || t.kind === 'secret') return [{ position: [p[0] + 0.7, p[1] + 1.1, p[2] + 1.3], target: [p[0], p[1] + 0.3, p[2]] }];
    if (t.kind === 'gallery') return [{ position: [p[0], p[1] + 2.2, p[2] + 2.0], target: [p[0], p[1] - 0.2, p[2]] }, { position: [p[0], p[1] + 0.6, p[2] + 0.55], target: [p[0], p[1] - 0.3, p[2] - 0.1] }];
    if (t.kind === 'music') return [{ position: [p[0], p[1] + 3.2, p[2] + 2.6], target: [p[0], p[1], p[2] - 0.2] }];
    if (t.kind === 'backlight') return [{ position: [p[0] + 0.2, p[1] + 2.2, p[2] + 1.8], target: [p[0], p[1], p[2]] }];
    if (t.kind === 'overview') return [{ position: [-9, 17, 24], target: [0, 1.2, -1] }];
    return [{ position: [p[0], p[1] + 2.5, p[2] + 2], target: p }];
  };
  const objStageMonitor = () => [{ position: [SCR[0] + SN[0] * 29, SCR[1], SCR[2] + SN[2] * 29], target: [...SCR] }];
  const objStage = {
    monitor: [{ position: [SCR[0] + SN[0] * 29, SCR[1], SCR[2] + SN[2] * 29], target: [...SCR] }, { position: [SCR[0] + SN[0] * 3.6, SCR[1], SCR[2] + SN[2] * 3.6], target: [...SCR] }],
    clock: [{ position: [12.6, 4.6, 0.4], target: [10.6, 1.8, -6.8] }],
    note: [{ position: [-12.9, 8.6, 5.4], target: [-13.2, 0.2, 3.2] }],   // from almost straight above, so it reads
    lamp: [{ position: [0.5, 12.5, 15.5], target: [0.5, 0.2, 5.0] }],
    mouse: [{ position: [14.1, 6.2, 8.7], target: [12.7, 1.4, 1.9] }],
    mug: [{ position: [-12.4, 4.6, 0.2], target: [-13.4, 1.4, -3.6] }],
    keyboard: [{ position: [0.4, 16, 13], target: [0, 0.6, -0.2] }],
    pc: [{ position: [PC_POS[0] + 20, 17, PC_POS[2] + 20], target: [PC_POS[0] + 0.5, 9.5, PC_POS[2]] }], // towards the glass corner, so the lit inside reads
    speaker: [{ position: [0, 9.5, 9], target: [0, 4, -12] }],
    desklamp: [{ position: [clampLamp.headWorld[0] - 6, clampLamp.headWorld[1] + 4, clampLamp.headWorld[2] + 22], target: [clampLamp.headWorld[0] + 4, clampLamp.headWorld[1] - 6, clampLamp.headWorld[2] - 4] }],
    guide: objStageMonitor(), work: objStageMonitor(),
    chair: [{ position: [0, 23, 27], target: [0, 16.5, -16] }],
    // the left wall's pieces and the bust are framed whole, a few degrees above level (inside focus mode's tilt limit)
    neon: [{ position: [-72, 54.5, 31], target: [-120, 49, 25] }],
    katana: [{ position: [-68, 73.5, 30], target: [-119, 67.3, 25] }],
    pullup: [{ position: [12, 50, 50], target: [-100, 36, 105], minDistance: 25, maxDistance: 150 }],
    satoshi: [{ position: [53, 2, 37], target: [111, -5.5, 36] }],   // the bust and the name cut in the stone under it
    watches: [{ position: [WATCH_POS[0] + 7.4, 10.6, WATCH_POS[2] + 1.2], target: [WATCH_POS[0] + 0.3, 2.4, WATCH_POS[2]] }],
    // the bike on the front wall, behind the chair, is taken in whole from the desk side of the room (its own zoom range: focus mode's is desk-object sized)
    bike: [{ position: [-4, 46, 32], target: [6, 38, 117], minDistance: 30, maxDistance: 120 }],
    // the medal hanger above the prints on the right wall, square on, the whole row in frame
    medals: [{ position: [62, 57, 36], target: [118, 57, 36], minDistance: 20, maxDistance: 90 }],
    // the curtains toggle where they are; this stage only exists so the target is complete
    curtains: [{ position: [-66, 26, 40], target: [-84, 26, -24] }],
    lights: [{ position: [90, 20, 74], target: [119, 12, 77] }],
    door: [{ position: [70, 20, 100], target: [120, 12, 105] }],
    // the air conditioner high over the door, from a little below and back into the room so the flap and the air under it read
    aircon: [{ position: [80, 66, 95], target: [118, 79, 106] }],
    // the floor lamp in the back right corner: it switches where it stands, so this stage only completes the target
    floorlamp: [{ position: [86, 24, 14], target: [112, 22, -15] }],
  };
  for (const [id, hit] of Object.entries(deskHits)) { const q = hit.position; objStage[id] = [{ position: [q[0] + 3.5, q[1] + 5, q[2] + 8.5], target: [q[0], q[1], q[2]] }]; }
  objStage.mandarin = mandarin.stages;
  const objMesh = { monitor: screen, clock: clockBody, note, lamp: head, mouse: mouseBody, mug, keyboard: caseMesh, pc: room.pc, bike: room.bike, medals: room.medals, curtains: room.curtains, lights: room.lights, door: room.door, aircon: room.aircon, floorlamp: room.floorlamp, speaker: room.speakers[0], watches: watchBox.hit, desklamp: clampLamp.hit, chair: room.chair, guide: guideHit, work: screen, neon: leftWall.neonHit, pullup: leftWall.towerHit, katana: leftWall.katanaHit, satoshi: satoshi.hit, ...deskHits };
  objMesh.mandarin = mandarin.hit;
  // the cat: the chair and her feeder in one view, from the front left of the room, above them
  objStage.cat = [{ position: [-60, 34, 82], target: [-8, -29, 36] }]; objStage.catbowl = objStage.cat;
  objMesh.cat = cat.hits.cat; objMesh.catbowl = cat.hits.bowl;
  for (const id of Object.keys(TARGETS)) {
    const t = TARGETS[id];
    if (t.kind === 'alias') continue;
    if (objStage[id]) world.targets[id] = { ...t, id, mesh: objMesh[id], stages: objStage[id] };
    else if (legends[id]) world.targets[id] = { ...t, id, mesh: legends[id], stages: stagesFor(id) };
    else console.warn(`[world] target '${id}' has no camera stage and no key: skipped`);   // never let one missing stage stop the whole scene
  }
  // the keys that are navigation: the letter shortcuts and the three project districts (the old F1–F3 caps are gone)
  world.navKeys = ['a', 's', 'c', 'w', 'p', 'signal', 'market', 'lab', 'caps', 'n'].map((k) => legends[k]).filter(Boolean);
  // the whole trading setup in frame: three screens across the back, the keyboard below them, the PC at the front left
  world.home = { position: [-7, 31, 56], target: [-11.5, 9.5, -3] };
  world.mobileHome = { position: [0, 34, 40], target: [0, 8, -6] };
  // ---------- the entry: a physical brass key on the desk in front of the keyboard, with the name plate beside it.
  // It is the only thing the visitor can touch before the room wakes up; pressing it starts one continuous camera move.
  {
    const gate = new Node('gate'); root.add(gate); world.gate = gate; world.gatePickables = [];
    const plate = new Mesh(roundedBox({ w: 6.2, h: 0.22, d: 4.2, r: 0.08, seg: 3 }), new Material(MAT.walnut), 'gate-plate'); plate.position = [0, 0.11, 13.6]; gate.add(plate);
    add(gate, new Mesh(box(6.3, 0.03, 4.3), new Material(MAT.bronzeDark)), [0, 0.225, 13.6]).castShadow = false;
    const mk = (id, w, d, h, x, z, tex, matDef) => { const m2 = new Mesh(roundedBox({ w, h, d, r: 0.16, seg: 4, taper: 0.86, dish: 0.05 }), new Material({ ...matDef, map: tex, fresnel: 0.35, fresnelColor: color(T.highlight), emissive: C.amber, emissiveIntensity: 0 }), 'gate:' + id); m2.position = [x, 0.22 + h / 2, z]; m2.userData = { keyId: id, restY: 0.22 + h / 2, press: 0, targetPress: 0, width: w, interactive: true, glow: 0, targetGlow: 0, gate: true, baseEmissive: 0, baseFresnel: 0.35, pressDepth: h * 0.42 }; m2.pickable = true; gate.add(m2); world.gatePickables.push(m2); world.keys.push(m2); return m2; };
    const enterTex = drawTexture(512, 320, (ctx, w, h) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = 'rgba(30,20,10,0.9)'; ctx.font = `700 92px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '10px'; ctx.fillText('ENTER', w / 2, h / 2 - 18); ctx.font = `500 30px ${MONO}`; ctx.letterSpacing = '6px'; ctx.fillStyle = 'rgba(30,20,10,0.6)'; ctx.fillText('WITH SOUND', w / 2, h / 2 + 62); });
    const muteTex = drawTexture(256, 256, (ctx, w, h) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = 'rgba(30,20,10,0.85)'; ctx.font = `600 34px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '4px'; ctx.fillText('QUIET', w / 2, h / 2 - 16); ctx.font = `400 22px ${MONO}`; ctx.fillStyle = 'rgba(30,20,10,0.55)'; ctx.fillText('no sound', w / 2, h / 2 + 30); });
    world.gateEnter = mk('gate-enter', 3.2, 2.0, 0.9, -0.9, 13.4, enterTex, { color: C.bronze, roughness: 0.32, metalness: 0.85 });
    world.gateMute = mk('gate-mute', 1.5, 1.5, 0.7, 1.75, 13.4, muteTex, { color: C.cream, roughness: 0.7, metalness: 0 });
    const nameTex = drawTexture(1024, 384, (ctx, w, h) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = 'rgba(30,20,10,0.92)'; ctx.font = `700 96px ${SANS}`; ctx.letterSpacing = '3px'; ctx.textBaseline = 'alphabetic'; ctx.fillText(SITE.name.toUpperCase(), 48, 150); ctx.font = `400 30px ${MONO}`; ctx.letterSpacing = '5px'; ctx.fillStyle = 'rgba(30,20,10,0.62)'; ctx.fillText(`${SITE.role.toUpperCase()}  ·  ${SITE.year}`, 52, 222); ctx.font = `400 28px ${MONO}`; ctx.fillStyle = 'rgba(184,98,44,0.95)'; ctx.fillText('PRESS THE BRASS KEY TO COME IN', 52, 312); });
    const namePlate = new Mesh(box(11, 0.06, 4.1), new Material({ ...MAT.paper, color: color('#a8977a'), map: nameTex, emissive: C.highlight, emissiveIntensity: 0.03 }), 'gate-name'); namePlate.position = [-8.6, 0.03, 13.9]; namePlate.rotation[1] = 0.1; namePlate.castShadow = false; gate.add(namePlate); world.gateName = namePlate;
    world.lights.push({ id: 'gate', position: [0.4, 6.5, 15.5], color: color(T.tungsten), intensity: 7, distance: 16, base: 7 });
  }
  // the arrival: low and close to the brass key, the keyboard a dark silhouette behind it, the lamp the only light on
  world.gateCamera = { position: [4.4, 3.7, 21.4], target: [-3.6, 0.5, 12.3] };
  // a phone held upright sees a narrow slice: from in front and above, the name plate (x -14..-3) and both keys (to x 3) fit
  // (at fov 68 on a 9:19.5 phone the slice at the plate is about x -15.8..4.4, a margin of a unit or more on each side)
  world.gateCameraPortrait = { position: [-5.7, 24.5, 35.5], target: [-5.7, 0.2, 13.8] };
  world.keyById = legends;

  // ---------- lighting rig (scaled by lightLevel so the room can come up from dark)
  // the screen light moves up to the centre panel and reaches further: three big screens light the desk
  const baseLights = [...DESK_LIGHTS.points.map((l) => (l.id === 'screen' ? { ...l, position: [0, 14.7, -11.5], intensity: 7, distance: 34 } : l)).map((l) => ({ ...l, base: l.intensity })), ...world.lights];
  world.lights = baseLights;
  world.setLightLevel = (v) => {
    world.lightLevel = v;
    for (const l of baseLights) {
      const lampFactor = l.id === 'lamp' ? (world.lampOn ? 1 : 0.06) : 1;
      // the desk lamp is the one light already on when the visitor arrives; everything else comes up with the room
      const lv = l.id === 'lamp' ? Math.max(v, world.lampFloor || 0) : v;
      l.intensity = l.id === 'gate' ? l.base * Math.max(0, 1 - v * 1.3) : l.base * lv * lampFactor;
    }
    bulbMat.emissiveIntensity = 3 * Math.max(v, world.lampFloor || 0) * (world.lampOn ? 1 : 0.05);
    const bl = world.backlightIndex;
    for (const m of inkMats) m.emissiveIntensity = 0.85 * v * world.inkScale;
    plateLit.emissiveIntensity = (BACKLIGHTS[bl].name === 'off' ? 0 : 0.035) * v;
    // the monitor sleeps in the dark room and wakes late in the ramp
    const sv = 0.03 + 0.97 * Math.max(0, Math.min(1, (v - 0.3) / 0.6));
    screenMat.color = [sv, sv, sv]; monitors.setLevel(sv);
    // the room's light is baked into its surfaces, so it is scaled here to wake with the desk
    room.setLevel(v);
  };
  world.setBacklight = (i) => {
    world.backlightIndex = i % BACKLIGHTS.length;
    const b = BACKLIGHTS[world.backlightIndex]; const c = color(b.hex);
    // off: no glow, but the legends stay printed (a faint cream) and the icon caps lose their amber with the rest
    const off = b.name === 'off'; world.inkScale = off ? 0.35 : 1;
    for (const m of inkMats) m.emissive = off ? C.creamDim : c;
    for (const m of iconMats) m.emissive = off ? C.creamDim : C.amber;
    plateLit.emissive = c; mouseLine.material.emissive = c;
    world.setLightLevel(world.lightLevel);
    return b;
  };
  world.setLamp = (on) => { world.lampOn = on; world.setLightLevel(world.lightLevel); };
  world.setLightLevel(0);

  // ---------- per-frame
  world.update = (dt, time, cam) => {
    world.t = time;
    const lam = 1 - Math.exp(-14 * dt);
    const slow = 1 - Math.exp(-3.5 * dt);
    let nearest = null, nearestD = Infinity;
    for (const k of world.keys) {
      const u = k.userData;
      u.press += (u.targetPress - u.press) * lam;
      // a hovered key rises a hair towards the hand before it can be pressed
      k.position[1] = u.restY - u.press * (u.pressDepth || 0.16) + (u.diorama ? 0 : u.glow * 0.025);
      if (k.__emissives) {
        let prox = 0;
        if (cam) { const wp = k.getWorldPosition([0, 0, 0]); const d = Math.hypot(cam[0] - wp[0], cam[1] - wp[1], cam[2] - wp[2]); prox = Math.max(0, Math.min(1, 1 - (d - 2.2) / 7)); if (d < nearestD) { nearestD = d; nearest = k; } }
        const target = Math.max(prox * 0.85, u.glow, u.press);
        k.__wake += (target - k.__wake) * slow;
        const w = 0.1 + 0.9 * k.__wake;
        for (const e of k.__emissives) e.mat.emissiveIntensity = e.base * w * (0.35 + 0.65 * (world.lightLevel || 0));
        for (const r of k.__rims) { r.mat.fresnel = r.base + u.glow * 0.22; r.mat.fresnelColor = [1, 0.8, 0.55]; }
      }
      if (u.follow) u.follow.position[1] = u.followY - u.press * (u.pressDepth || 0.16);
      if (u.interactive) {
        u.glow += (u.targetGlow - u.glow) * lam;
        if (k.material.transparent) { k.material.fresnel = u.baseFresnel + u.glow * 0.6; k.material.emissiveIntensity = u.baseEmissive + u.glow * 0.25; }
        else if (k.material.emissiveMap) k.material.emissiveIntensity = (u.baseEmissive * (world.lightLevel || 0) * (k.material.map ? 1 : world.inkScale)) + u.glow * 0.9;
        else k.material.emissive = [u.glow * 0.18, u.glow * 0.12, u.glow * 0.05];
      }
      // a key the story types on its way between two stops (app/experience typeTrail): its legend flashes, then fades back
      if (u.flash > 0 && k.material.emissiveMap) { u.flash = Math.max(0, u.flash - dt * 1.3); k.material.emissiveIntensity = (u.baseEmissive * (world.lightLevel || 0) * (k.material.map ? 1 : world.inkScale)) + Math.max(u.interactive ? u.glow : 0, u.flash * u.flash) * 3; }
      if (u.inner) { u.inner.position[1] = (u.innerY ?? CASE_H + 0.1) - u.press * 0.16 * 0.3; if (!u.innerStatic) u.inner.rotation[1] = Math.sin(time * 0.25 + (u.keyId?.length || 0)) * 0.25; }
    }
    // the districts' moving parts (a turning orb, a flying elephant, chimney smoke) and the pin over a shop being pointed at
    for (const tw of Object.values(world.towns)) tw.update(dt, time);
    // the small tungsten pool over the keyboard drifts towards whichever miniature is awake, or the shop being pointed at
    { const well = baseLights.find((l) => l.id === 'well'); const hot = world.keys.find((k) => k.__emissives && k.userData.glow > 0.02) || (nearestD < 6 ? nearest : null);
      // (while the story types its way between two stops, the light runs along the keys being typed)
      let spot = world.trailAt || null; if (!spot) for (const [id, tw] of Object.entries(world.towns)) { const sp = tw.spot(); if (sp) { spot = legends[id].localToWorld(sp); break; } }
      if (well) { const wk = spot ? 1 : hot ? Math.max(hot.userData.glow, hot.__wake) : 0; const tp = spot || (hot ? hot.getWorldPosition([0, 0, 0]) : [0, CASE_H + 1.6, 0.2]); const ty = spot ? tp[1] + 0.8 : hot ? tp[1] + 1.1 : CASE_H + 1.6;
        well.position[0] += (tp[0] - well.position[0]) * slow; well.position[1] += (ty - well.position[1]) * slow; well.position[2] += ((spot ? tp[2] + 0.2 : hot ? tp[2] + 0.3 : 0.2) - well.position[2]) * slow;
        well.intensity = well.base * world.lightLevel * (1 + wk * 2.2); well.distance = spot ? 2.4 : hot ? 4.5 : 8; } }
    // object hover glows
    screen.userData.glow += (screen.userData.targetGlow - screen.userData.glow) * lam;
    baseLights[1].intensity = baseLights[1].base * world.lightLevel * (1 + screen.userData.glow * 1.4);
    clockBody.userData.glow += (clockBody.userData.targetGlow - clockBody.userData.glow) * lam;
    clockBody.userData.spin = Math.max(0, (clockBody.userData.spin || 0) - dt * 0.6);
    clockTex.tick(time, clockBody.userData.glow * 0.6 + clockBody.userData.spin * 2.5);
    note.userData.glow += (note.userData.targetGlow - note.userData.glow) * lam;
    note.userData.liftV = (note.userData.liftV || 0) + ((note.userData.lift || 0) - (note.userData.liftV || 0)) * (1 - Math.exp(-6 * dt));
    // the note stays flat so it can be read: hover only lifts it a hair; picked up, it rises a little, still flat to the camera
    note.position[1] = 0.14 + note.userData.glow * 0.04 + note.userData.liftV * 0.35; note.rotation[0] = 0; note.rotation[2] = 0;
    head.userData.glow += (head.userData.targetGlow - head.userData.glow) * lam;
    mouseBody.userData.glow += (mouseBody.userData.targetGlow - mouseBody.userData.glow) * lam;
    mouseWheel.rotation[0] += dt * (0.4 + mouseBody.userData.glow * 8);
    mug.userData.glow += (mug.userData.targetGlow - mug.userData.glow) * lam;
    for (let i = 0; i < steam.length; i++) {
      const s = steam[i]; const ph = (time * 0.5 + i * 0.37) % 1;
      s.position[1] = 2.0 + ph * 1.6; s.position[0] = (i - 1.5) * 0.22 + Math.sin(time * 2 + i) * 0.12;
      const target = (world.steamOn ? 0.35 : 0.06) * (1 - ph) * Math.min(1, ph * 4);
      s.material.opacity += (target - s.material.opacity) * (1 - Math.exp(-4 * dt));
      s.scale = [1 + ph, 1 + ph, 1 + ph];
    }
    world.skillsRevealV = (world.skillsRevealV || 0) + ((world.skillsReveal || 0) - (world.skillsRevealV || 0)) * (1 - Math.exp(-3 * dt));
    skillsMat.opacity = world.skillsRevealV * (world.lampOn ? 1 : 0.2);
    screenTex.tick(time); monitors.update(time); guideHit._hidden = screenTex.mode !== 'home';
    // the room: the PC's breathing lights, the speakers (they follow world.musicOn), a book sliding out of the shelf
    room.update(dt, time, world);
    cat.update(dt, time, cam);
    watchBox.update(dt); clampLamp.update(dt, world.lightLevel); leftWall.update(dt, time, world.lightLevel); deskGear.update(dt, time);
  };
  return world;
}

// ---------- helpers
function hsl(h, s, l) {
  const k = (n) => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((v) => Math.pow(v, 2.2));
}

function woodTexture() {
  return drawTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    // grain: long soft streaks, slightly darker/lighter than the base
    for (let i = 0; i < 260; i++) {
      const y = Math.random() * h, len = 120 + Math.random() * 400, a = 0.05 + Math.random() * 0.12;
      const dark = Math.random() > 0.45;
      ctx.strokeStyle = dark ? `rgba(20,10,4,${a})` : `rgba(255,220,180,${a * 0.6})`;
      ctx.lineWidth = 0.6 + Math.random() * 2.2;
      ctx.beginPath(); ctx.moveTo(Math.random() * w - 100, y);
      ctx.bezierCurveTo(Math.random() * w, y + (Math.random() - 0.5) * 12, Math.random() * w, y + (Math.random() - 0.5) * 12, Math.random() * w + len, y + (Math.random() - 0.5) * 6);
      ctx.stroke();
    }
    const img = ctx.getImageData(0, 0, w, h); const d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    ctx.putImageData(img, 0, 0);
  }, { repeat: true });
}

// Tiny sculptures inside portal keys: original abstract objects per project, in the room's palette.
function buildPortalObject(project, id) {
  const g = new Node('portal:' + id);
  const col = hsl(project.hue, 0.7, 0.55);
  const mat = new Material({ color: col, roughness: 0.35, metalness: 0.4, emissive: col, emissiveIntensity: 0.2 });
  const paper = new Material(MAT.cream);
  if (id === 'f1') {
    const stem = new Mesh(cylinder(0.02, 0.03, 0.34, 8), mat); stem.position[1] = 0.17; g.add(stem);
    for (let i = 0; i < 3; i++) { const leaf = new Mesh(sphere(0.07, 10, 6), mat); leaf.scale = [1.8, 0.35, 0.9]; leaf.position = [Math.cos(i * 2.1) * 0.12, 0.14 + i * 0.09, Math.sin(i * 2.1) * 0.12]; leaf.rotation[1] = -i * 2.1; g.add(leaf); }
    const seed = new Mesh(sphere(0.045, 8, 6), paper); seed.position = [0.2, 0.32, 0]; g.add(seed);
  } else if (id === 'f2') {
    for (let i = 0; i < 4; i++) { const s = new Mesh(box(0.34 - i * 0.05, 0.05, 0.34 - i * 0.05), i % 2 ? paper : mat); s.position[1] = 0.03 + i * 0.09; s.rotation[1] = i * 0.35; g.add(s); }
  } else {
    for (let i = 0; i < 3; i++) { const r = new Mesh(torus(0.08 + i * 0.07, 0.012, 24, 6), i === 1 ? paper : mat); r.position[1] = 0.05 + i * 0.07; g.add(r); }
    const needle = new Mesh(box(0.02, 0.32, 0.02), paper); needle.position[1] = 0.18; g.add(needle);
  }
  for (const c of g.children) c.castShadow = false;
  return g;
}

// Monitor: amber terminal on dark glass, a hello from the owner, clock, blinking cursor.
function makeScreenTexture() {
  const W = 1024, H = 560;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
  const tex = drawTexture(W, H, () => {}); tex.image = c;
  let last = -1, mode = 'home', modeProject = null, modeList = [];
  function draw(t) {
    ctx.fillStyle = T.screen; ctx.fillRect(0, 0, W, H);
    if (mode === 'projects') { drawProjects(t); tex.needsUpdate = true; return; }
    const vg = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7); vg.addColorStop(0, 'rgba(60,40,20,0.35)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(231,221,200,0.05)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(199,163,106,0.28)'; ctx.strokeRect(40.5, 40.5, W - 81, H - 81);
    ctx.fillStyle = T.cream; ctx.font = `600 22px ${MONO}`; ctx.textBaseline = 'top';
    ctx.fillText(BRAND, 72, 68);
    ctx.fillStyle = T.amber; ctx.fillText('/ hello', 72 + ctx.measureText(BRAND).width + 27, 68);
    ctx.fillStyle = 'rgba(231,221,200,0.5)'; ctx.font = `400 18px ${MONO}`;
    const d = new Date(); const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    ctx.textAlign = 'right'; ctx.fillText(`${hh}:${mm}  ·  ${SITE.year}`, W - 72, 70); ctx.textAlign = 'left';
    ctx.font = `500 64px ${SANS}`; ctx.fillStyle = '#f3ead8';
    ctx.fillText(SITE.headline[0], 72, 150); ctx.fillText(SITE.headline[1], 72, 222);
    ctx.font = `400 26px ${MONO}`; ctx.fillStyle = T.highlight;
    ctx.fillText('> ' + SITE.screen[0], 72, 330);
    ctx.fillStyle = 'rgba(231,221,200,0.65)';
    ctx.fillText('> ' + SITE.screen[1], 72, 372);
    const blink = Math.floor(t * 2) % 2 === 0;
    ctx.fillStyle = blink ? T.amber : 'transparent'; ctx.fillRect(72, 420, 16, 30);
    ctx.fillStyle = 'rgba(231,221,200,0.35)'; ctx.font = `400 16px ${MONO}`;
    ctx.fillText('click the screen to see the work', 100, 428);
    // the guide button, bottom right: for anyone who isn't sure where to start
    { const bx = 600, by = 470, bw = 352, bh = 54, pulse = 0.55 + 0.45 * Math.abs(Math.sin(t * 2));
      ctx.fillStyle = `rgba(217,160,91,${0.18 + 0.12 * pulse})`; ctx.strokeStyle = T.amber; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 27); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.amber; ctx.beginPath(); ctx.arc(bx + 30, by + bh / 2, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a140d'; ctx.font = `700 20px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', bx + 30, by + bh / 2 + 1);
      ctx.fillStyle = '#f3ead8'; ctx.font = `600 21px ${SANS}`; ctx.textAlign = 'left'; ctx.fillText('Click here for a guide', bx + 58, by + bh / 2 + 1); ctx.textBaseline = 'top'; }
    tex.needsUpdate = true;
  }
  function drawProjects(t) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * 0.75); vg.addColorStop(0, 'rgba(90,60,25,0.5)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(199,163,106,0.3)'; ctx.strokeRect(40.5, 40.5, W - 81, H - 81);
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillStyle = T.amber; ctx.font = `600 22px ${MONO}`; ctx.fillText(`${BRAND} / projects`, 72, 68);
    ctx.fillStyle = '#f3ead8'; ctx.font = `500 88px ${SANS}`; ctx.fillText(modeProject ? modeProject.title : 'Projects', 72, 130);
    ctx.fillStyle = 'rgba(231,221,200,0.6)'; ctx.font = `400 24px ${MONO}`; ctx.fillText(modeProject ? `${modeProject.date}  ·  ${modeProject.stack}` : 'the work, one key at a time', 72, 240);
    modeList.forEach((p, i) => { const on = modeProject && p.key === modeProject.key; ctx.fillStyle = on ? T.amber : 'rgba(231,221,200,0.5)'; ctx.font = `${on ? 600 : 400} 26px ${MONO}`; ctx.fillText(`${on ? '▸' : ' '} F${i + 1}  ${p.title}`, 72, 330 + i * 44); });
    const blink = Math.floor(t * 2) % 2 === 0; ctx.fillStyle = blink ? T.amber : 'transparent'; ctx.fillRect(W - 120, H - 90, 16, 30);
    ctx.fillStyle = 'rgba(231,221,200,0.4)'; ctx.font = `400 16px ${MONO}`; ctx.fillText('entering…', W - 96, H - 82);
  }
  draw(0);
  return { get mode() { return mode; }, texture: tex, tick: (t) => { const q = Math.floor(t * 4); if (q !== last) { last = q; draw(t); } }, setMode: (m2, project, list) => { mode = m2; modeProject = project || null; modeList = list || []; last = -1; } };
}

// Lamp shade (Blender export): the cone is closed over its mouth and the rim is a solid thin disc. Keep only the cone's sides
// (triangles touching the apex, its highest vertex) and the rim's edge band (triangles spanning its thickness along the cone axis).
function openLampShade(shade, rim) {
  const g = shade.geometry, P = g.positions, I = g.indices, n = P.length / 3;
  let apex = 0; for (let i = 1; i < n; i++) if (P[i * 3 + 1] > P[apex * 3 + 1]) apex = i;
  const mouth = [0, 0, 0]; for (let i = 0; i < n; i++) if (i !== apex) for (let k = 0; k < 3; k++) mouth[k] += P[i * 3 + k] / (n - 1);
  const ax = [0, 1, 2].map((k) => mouth[k] - P[apex * 3 + k]); const al = Math.hypot(...ax); for (let k = 0; k < 3; k++) ax[k] /= al;
  const filter = (geo, keepTri) => { const out = []; for (let i = 0; i < geo.indices.length; i += 3) { const t = [geo.indices[i], geo.indices[i + 1], geo.indices[i + 2]]; if (keepTri(t, geo.positions)) out.push(...t); } geo.indices = new geo.indices.constructor(out); };
  filter(g, (t) => t.includes(apex));
  shade.material.doubleSide = true;
  if (rim) {
    const h = (Q, v) => (Q[v * 3] - mouth[0]) * ax[0] + (Q[v * 3 + 1] - mouth[1]) * ax[1] + (Q[v * 3 + 2] - mouth[2]) * ax[2];
    filter(rim.geometry, (t, Q) => { const d = t.map((v) => h(Q, v)); return Math.max(...d) - Math.min(...d) > 0.01; });
    rim.material.doubleSide = true;
  }
}

// Clock face: cream dial, bronze hands at the real time; on hover the hands sweep (a hint that time is the index).
function makeClockTexture() {
  const S = 512;
  const c = document.createElement('canvas'); c.width = S; c.height = S; const ctx = c.getContext('2d');
  const tex = drawTexture(S, S, () => {}); tex.image = c;
  let lastKey = '';
  function draw(t, sweep) {
    const d = new Date();
    const key = `${d.getMinutes()}:${d.getSeconds()}:${sweep.toFixed(2)}`;
    if (key === lastKey) return; lastKey = key;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, S, S);
    ctx.save(); ctx.translate(S / 2, S / 2);
    ctx.strokeStyle = 'rgba(60,40,20,0.55)'; ctx.lineWidth = 3;
    for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2; const len = i % 5 === 0 ? 26 : 10; ctx.lineWidth = i % 5 === 0 ? 5 : 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (S / 2 - 30), Math.sin(a) * (S / 2 - 30)); ctx.lineTo(Math.cos(a) * (S / 2 - 30 - len), Math.sin(a) * (S / 2 - 30 - len)); ctx.stroke(); }
    ctx.fillStyle = 'rgba(60,40,20,0.75)'; ctx.font = `600 22px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(SITE.initials, 0, -90); ctx.font = `400 14px ${MONO}`; ctx.fillText('TIMELINE', 0, 90);
    const hr = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 + sweep * 0.35, mn = d.getMinutes() / 60 + sweep * 1.0;
    const hand = (frac, len, w) => { const a = frac * Math.PI * 2 - Math.PI / 2; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-Math.cos(a) * 24, -Math.sin(a) * 24); ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len); ctx.stroke(); };
    ctx.strokeStyle = '#4d3822'; ctx.lineCap = 'round'; hand(hr, 120, 12); hand(mn, 180, 8);
    ctx.strokeStyle = '#b8622c'; hand((d.getSeconds() / 60 + sweep * 2) % 1, 195, 3);
    ctx.fillStyle = '#4d3822'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    tex.needsUpdate = true;
  }
  draw(0, 0);
  return { texture: tex, tick: (t, sweep) => draw(t, Math.round(sweep * 40) / 40) };
}

function makeNoteTexture() {
  return drawTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(120,90,50,0.25)'; ctx.lineWidth = 1;
    for (let y = 56; y < h; y += 26) { ctx.beginPath(); ctx.moveTo(20, y + 0.5); ctx.lineTo(w - 20, y + 0.5); ctx.stroke(); }
    ctx.fillStyle = '#24170b'; ctx.font = `700 24px ${MONO}`;   // dark enough to stay legible under the desk lamp
    ctx.fillText('about me', 26, 48);
    ctx.font = `500 19px ${MONO}`; ctx.fillStyle = '#2e1f10';
    // a long line is written a little smaller so it stays on the paper; the pen stroke underlines the last one
    SITE.note.forEach((line, i) => { let f = 19; do { ctx.font = `400 ${f}px ${MONO}`; } while (ctx.measureText('> ' + line).width > w - 46 && --f > 12); ctx.fillText('> ' + line, 26, 92 + i * 26); });
    const uy = 92 + (SITE.note.length - 1) * 26 + 6;
    ctx.strokeStyle = 'rgba(160,72,24,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(26, uy); ctx.lineTo(214, uy - 4); ctx.stroke();
  });
}
