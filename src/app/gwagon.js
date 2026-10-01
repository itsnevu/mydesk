// A 1:18 Mercedes-AMG G 63 model on the bookshelf, in an acrylic display case on a black plinth with an LED strip:
// boxy body in gloss black, the Panamericana grille, round LED headlights, turn signals on the wings, exposed door hinges,
// side exhausts, flared arches, 22" multi-spoke wheels, the spare on the tailgate. Units: 1 unit ≈ 19.5 mm (so the
// 4.87 m car at 1:18 is ~13.9 long). Local frame: x forward, y up, z to the car's left.
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, cylinder, torus, sphere } from 'engine/geometry';
import { drawTexture, SANS } from 'engine/textures';
import { color } from 'engine/math';
import { flatten } from 'app/bake';

function plaqueTexture() {
  return drawTexture(256, 48, (ctx, w, h) => { ctx.fillStyle = '#0d0d0e'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#d8d2c4'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 22px ${SANS}`; ctx.fillText('AMG G 63  ·  1:18', w / 2, h / 2 + 1); });
}

export function buildGWagon() {
  const M = {
    paint: new Material({ color: color('#0e0f12'), roughness: 0.1, metalness: 0.55, fresnel: 0.55, fresnelColor: color('#e8eeff'), emissive: color('#060607') }),
    chrome: new Material({ color: color('#d9dce0'), roughness: 0.12, metalness: 0.95, fresnel: 0.4, fresnelColor: color('#ffffff'), emissive: color('#202124') }),
    blackTrim: new Material({ color: color('#141416'), roughness: 0.5, metalness: 0.2 }),
    glass: new Material({ color: color('#0b0d12'), roughness: 0.05, metalness: 0.6, fresnel: 0.6, fresnelColor: color('#cfd8ff') }),
    tire: new Material({ color: color('#101010'), roughness: 0.9 }),
    rim: new Material({ color: color('#2a2b2e'), roughness: 0.3, metalness: 0.85, emissive: color('#0d0d0e') }),
    led: new Material({ color: [0, 0, 0], emissive: color('#f2f6ff'), emissiveIntensity: 1.6, unlit: true, receiveShadow: false }),
    amber: new Material({ color: [0, 0, 0], emissive: color('#ff9a2e'), emissiveIntensity: 1.1, unlit: true, receiveShadow: false }),
    red: new Material({ color: [0, 0, 0], emissive: color('#d01822'), emissiveIntensity: 1.0, unlit: true, receiveShadow: false }),
    acrylic: new Material({ color: [0.92, 0.94, 0.97], roughness: 0.03, opacity: 0.1, transparent: true, depthWrite: false, fresnel: 0.55, fresnelColor: color('#ffffff') }),
    plinth: new Material({ color: color('#0d0d0e'), roughness: 0.35, metalness: 0.3 }),
    strip: new Material({ color: [0, 0, 0], emissive: color('#fff1d8'), emissiveIntensity: 1.6, unlit: true, receiveShadow: false }),
    plaque: new Material({ color: [1, 1, 1], map: plaqueTexture(), roughness: 0.4, emissive: [0.25, 0.24, 0.22], emissiveMap: plaqueTexture() }),
  };
  const root = new Node('g63-display');
  const car = new Node('g63'); car.position = [0, 1.0, 0]; root.add(car);
  const add = (p, geo, mat, pos, rot, s) => { const m = new Mesh(geo, mat); m.position = pos; if (rot) m.rotation = rot; if (s) m.scale = s; p.add(m); return m; };
  const L = 13.4, W = 5.0, WR = 1.14, WB = 8.25, TR = 2.4;   // body length, width, wheel radius, wheelbase, half track
  const yB0 = 0.8, yBelt = 3.75, yRoof = 5.6, xF = L / 2, xR = -L / 2;
  // ---------- body: lower tub, the hood, the cabin, flared arches
  add(car, roundedBox({ w: L, h: yBelt - yB0, d: W, r: 0.18, seg: 2 }), M.paint, [0, (yB0 + yBelt) / 2, 0]);
  add(car, roundedBox({ w: 9.6, h: yRoof - yBelt, d: W - 0.4, r: 0.22, seg: 2 }), M.paint, [-1.65, (yBelt + yRoof) / 2, 0]);
  add(car, roundedBox({ w: 9.0, h: 0.12, d: W - 0.7, r: 0.05, seg: 1 }), M.blackTrim, [-1.75, yRoof + 0.05, 0]);           // roof panel line
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * WB / 2 + 0.1, z = sz * (W / 2 + 0.12);
    add(car, roundedBox({ w: 3.4, h: 0.38, d: 0.3, r: 0.12, seg: 2 }), M.blackTrim, [x, 2.5, z]);                                // arch flare
  }
  // ---------- glass: windscreen, side windows split by the B/C pillars, the rear window
  add(car, box(0.06, 1.45, W - 1.0), M.glass, [3.17, 4.66, 0]);
  for (const sz of [-1, 1]) {
    for (const [x, w] of [[1.6, 2.9], [-1.55, 2.9], [-4.6, 2.4]]) add(car, box(w, 1.4, 0.06), M.glass, [x, 4.66, sz * (W / 2 - 0.17)]);
    // exposed door hinges on the A-pillar, door handles, the door seams
    for (const y of [2.4, 3.4]) add(car, cylinder(0.12, 0.12, 0.35, 10), M.paint, [3.05, y, sz * (W / 2 + 0.03)]);
    for (const x of [1.0, -2.2]) add(car, box(0.55, 0.12, 0.08), M.chrome, [x, 3.35, sz * (W / 2 + 0.04)]);
    for (const x of [3.2, 0.05, -3.1]) add(car, box(0.04, 3.9, 0.03), M.blackTrim, [x, 3.0, sz * (W / 2 + 0.01)]);
    // mirrors, side exhausts in front of the rear wheels, running boards
    add(car, roundedBox({ w: 0.6, h: 0.55, d: 0.75, r: 0.12, seg: 2 }), M.paint, [2.8, 4.05, sz * (W / 2 + 0.45)]);
    for (const dz of [0, 0.35]) add(car, cylinder(0.13, 0.13, 0.45, 12), M.chrome, [-2.45 + dz * 0.8, 0.95, sz * (W / 2 + 0.05)], [Math.PI / 2, 0, 0]);
    add(car, roundedBox({ w: 4.6, h: 0.15, d: 0.5, r: 0.06, seg: 1 }), M.blackTrim, [-0.25, 1.15, sz * (W / 2 + 0.2)]);
    // turn signals on top of the wings, the round LED headlight with its ring, the vertical tail lamp
    add(car, roundedBox({ w: 0.7, h: 0.28, d: 0.42, r: 0.1, seg: 2 }), M.amber, [5.5, yBelt + 0.14, sz * 1.95]);
    add(car, cylinder(0.6, 0.6, 0.2, 24), M.chrome, [xF + 0.04, 2.95, sz * 1.75], [0, 0, Math.PI / 2]);
    add(car, cylinder(0.48, 0.48, 0.05, 24), M.glass, [xF + 0.15, 2.95, sz * 1.75], [0, 0, Math.PI / 2]);
    add(car, torus(0.42, 0.05, 24, 4), M.led, [xF + 0.17, 2.95, sz * 1.75], [0, 0, Math.PI / 2]);
    add(car, cylinder(0.14, 0.14, 0.06, 12), M.led, [xF + 0.17, 2.95, sz * 1.75], [0, 0, Math.PI / 2]);
    add(car, box(0.08, 1.3, 0.55), M.red, [xR - 0.03, 2.9, sz * 2.1]);
  }
  // ---------- the Panamericana grille, the star, the bumpers with the silver skid plate
  add(car, box(0.08, 1.35, 2.5), M.blackTrim, [xF + 0.04, 2.85, 0]);
  for (let k = 0; k < 15; k++) add(car, box(0.06, 1.28, 0.06), M.chrome, [xF + 0.09, 2.85, -1.17 + k * (2.34 / 14)]);
  add(car, box(0.07, 0.07, 2.5), M.chrome, [xF + 0.1, 3.5, 0]); add(car, box(0.07, 0.07, 2.5), M.chrome, [xF + 0.1, 2.2, 0]);
  add(car, cylinder(0.32, 0.32, 0.05, 24), M.chrome, [xF + 0.13, 2.85, 0], [0, 0, Math.PI / 2]);
  add(car, roundedBox({ w: 0.6, h: 0.75, d: W + 0.1, r: 0.15, seg: 2 }), M.blackTrim, [xF + 0.15, 1.35, 0]);
  add(car, box(0.15, 0.25, W - 1.4), M.chrome, [xF + 0.4, 0.95, 0]);
  add(car, roundedBox({ w: 0.5, h: 0.7, d: W + 0.1, r: 0.15, seg: 2 }), M.blackTrim, [xR - 0.1, 1.35, 0]);
  // ---------- the spare wheel on the tailgate, under a body-colour cover with the star
  add(car, cylinder(1.2, 1.2, 0.55, 32), M.paint, [xR - 0.35, 3.0, 0.35], [0, 0, Math.PI / 2]);
  add(car, torus(1.0, 0.06, 32, 4), M.chrome, [xR - 0.64, 3.0, 0.35], [0, 0, Math.PI / 2]);
  add(car, cylinder(0.3, 0.3, 0.04, 20), M.chrome, [xR - 0.64, 3.0, 0.35], [0, 0, Math.PI / 2]);
  // ---------- 22" wheels: tyre, a multi-spoke dark rim, the centre cap
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = new Node('wheel'); w.position = [sx * WB / 2 + 0.1, WR, sz * TR]; car.add(w);
    add(w, cylinder(WR, WR, 0.85, 32), M.tire, [0, 0, 0], [Math.PI / 2, 0, 0]);
    const face = sz * 0.43;
    add(w, cylinder(0.82, 0.82, 0.05, 32), M.rim, [0, 0, face], [Math.PI / 2, 0, 0]);
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; add(w, box(0.72, 0.1, 0.06), M.chrome, [Math.cos(a) * 0.42, Math.sin(a) * 0.42, face + sz * 0.03], [0, 0, a]); }
    add(w, cylinder(0.18, 0.18, 0.07, 16), M.chrome, [0, 0, face + sz * 0.04], [Math.PI / 2, 0, 0]);
  }
  // ---------- the display: a black plinth with an LED strip and a plaque, the acrylic cover
  add(root, roundedBox({ w: 16.2, h: 1.0, d: 7.4, r: 0.15, seg: 2 }), M.plinth, [0, 0.5, 0]);
  add(root, box(15.6, 0.06, 0.12), M.strip, [0, 1.02, 3.3]).castShadow = false;
  add(root, box(5.5, 0.6, 0.04), M.plaque, [0, 0.5, 3.72]);
  const cover = add(root, box(16.0, 7.0, 7.2), M.acrylic, [0, 1.0 + 3.5, 0]); cover.castShadow = false; cover.renderOrder = 10;
  root.traverse((n) => { if (n.geometry && n.material && (n.material === M.led || n.material === M.amber || n.material === M.red)) n.castShadow = false; });
  flatten(root, 'g63-display');
  return { root };
}
