// Project dioramas: three handcrafted miniature worlds on bronze-edged plinths. Built lazily on first entry.
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, plane, cylinder, torus, sphere, cone } from 'engine/geometry';
import { noiseTexture, drawTexture, MONO, SANS } from 'engine/textures';
import { color } from 'engine/math';
import { DIORAMAS } from 'app/data';
import { T, C, MAT } from 'app/theme';
import * as A from 'app/assets';
import { buildAsset } from 'engine/assets';
import { buildGodWorld } from 'app/godworld';
import { buildTownWorld, townWorldHere } from 'app/townworld';
import { MOTION } from 'app/motion';

export const DIORAMA_ORIGIN = [400, 0, 0];
export const WORLD_SPACING = 64;
export const worldOrigin = (i) => [DIORAMA_ORIGIN[0] + i * WORLD_SPACING, DIORAMA_ORIGIN[1], DIORAMA_ORIGIN[2]];
let O = DIORAMA_ORIGIN; // origin of the diorama being built

function hsl(h, s, l) {
  const k = (n) => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((v) => Math.pow(v, 2.2));
}
const m = (o) => new Material(o);
const add = (parent, mesh, pos, rot, scale) => { if (pos) mesh.position = pos; if (rot) mesh.rotation = rot; if (scale) mesh.scale = scale; parent.add(mesh); return mesh; };

/** Shared plinth: floor, bevelled base, bronze rim, engraved sign. */
function plinth(root, def, accent, mini = false) {
  if (!mini) { const floor = add(root, new Mesh(plane(140, 140), m({ color: color('#15100a'), roughness: 0.95, map: noiseTexture(512, [26, 20, 14], 8), mapRepeat: [10, 10] })), [0, -0.02, 0]); floor.castShadow = false; }
  const base = add(root, new Mesh(roundedBox({ w: 38, h: 1.1, d: 38, r: 0.18, seg: 3 }), m({ ...MAT.walnut, map: noiseTexture(256, [46, 32, 20], 14), mapRepeat: [3, 3] })), [0, 0.55, 0]);
  if (!mini) A.ground(root, 37.6, 37.6, 1.1);
  add(root, new Mesh(box(38.3, 0.08, 38.3), m(MAT.bronze)), [0, 1.12, 0]).castShadow = false;
  // engraved sign plate on the front edge
  const signTex = drawTexture(1024, 192, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(40,26,12,0.9)'; ctx.font = `700 74px ${SANS}`; ctx.textBaseline = 'middle'; ctx.letterSpacing = '8px';
    ctx.fillText(def.sign, 40, 78);
    ctx.font = `400 26px ${MONO}`; ctx.fillStyle = 'rgba(40,26,12,0.65)'; ctx.letterSpacing = '4px'; ctx.fillText(def.tagline.toUpperCase(), 44, 146);
  });
  add(root, new Mesh(box(6.4, 1.2, 0.06), m({ ...MAT.paper, color: color('#d9c9a8'), map: signTex, emissive: C.highlight, emissiveIntensity: 0.08 })), [-12.4, 0.6, 19.05]);
  add(root, new Mesh(box(6.6, 1.4, 0.04), m(MAT.bronzeDark)), [-12.4, 0.6, 19.02]);
  return base;
}

function tinyKeyboard(parent, pos, w = 1.6, d = 0.6) {
  const g = new Node('tiny-kb'); g.position = pos; parent.add(g);
  add(g, new Mesh(roundedBox({ w, h: 0.08, d, r: 0.03, seg: 2 }), m(MAT.casePlastic)), [0, 0.04, 0]);
  const cols = Math.floor(w / 0.13), rows = Math.floor(d / 0.13);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const k = add(g, new Mesh(box(0.1, 0.05, 0.1), m({ ...MAT.plastic, emissive: C.amber, emissiveIntensity: 0.15 })), [-w / 2 + 0.09 + c * 0.13, 0.1, -d / 2 + 0.09 + r * 0.13]);
    k.castShadow = false;
  }
  return g;
}

function screenTexture(draw, w = 512, h = 320) {
  return drawTexture(w, h, (ctx) => { ctx.fillStyle = T.screen; ctx.fillRect(0, 0, w, h); draw(ctx, w, h); });
}

// ---------- 01 studio
function buildStudio(root, project, def, mini) {
  const accent = hsl(project.hue, 0.6, 0.55);
  plinth(root, def, accent, mini);
  const hs = {};
  const Y = 1.16;
  // architecture: two walls with a tall window, warm room
  const wallMat = m({ color: color('#3a2a1c'), roughness: 0.9 });
  add(root, new Mesh(box(13, 6, 0.3), wallMat), [0, Y + 3, -5.5]);
  add(root, new Mesh(box(0.3, 6, 12), wallMat), [-6.5, Y + 3, 0.5]);
  // window opening (glowing pane) on the back wall
  add(root, new Mesh(box(3.6, 3.2, 0.1), m({ color: [1, 1, 1], emissive: color('#ffc98a'), emissiveIntensity: 0.42, unlit: true })), [3.2, Y + 3.4, -5.3]).castShadow = false;
  for (const [x, y, w, h] of [[3.2, Y + 3.4, 0.12, 3.2], [3.2, Y + 3.4, 3.6, 0.12]]) add(root, new Mesh(box(w, h, 0.16), m(MAT.bronzeDark)), [x, y, -5.28]);
  // floor rug
  add(root, new Mesh(box(9, 0.04, 7), m({ color: color('#2b1e12'), roughness: 1 })), [0.5, Y + 0.02, 0.5]).castShadow = false;
  // desk
  const desk = add(root, new Mesh(roundedBox({ w: 6.4, h: 0.22, d: 2.6, r: 0.05, seg: 2 }), m({ ...MAT.walnut, color: color('#4a3520') })), [0.5, Y + 1.5, -2.2]);
  for (const dx of [-2.9, 2.9]) add(root, new Mesh(box(0.14, 1.4, 2.2), m(MAT.bronzeDark)), [0.5 + dx, Y + 0.7, -2.2]);
  hs.desk = { mesh: desk, anchor: [0.5, Y + 2.2, -1.2] };
  // monitor with the garden on screen
  const gardenTex = screenTexture((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a1208'); g.addColorStop(1, '#0d0906'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const x = 30 + i * 18 + Math.sin(i) * 6, hgt = 60 + ((i * 37) % 120);
      ctx.strokeStyle = `hsl(${project.hue + (i % 3) * 8} 55% ${50 + (i % 4) * 6}%)`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, h - 30); ctx.quadraticCurveTo(x + 10, h - 30 - hgt / 2, x + (i % 2 ? 14 : -10), h - 30 - hgt); ctx.stroke();
      ctx.fillStyle = `hsl(${project.hue + 20} 60% 60%)`; ctx.beginPath(); ctx.ellipse(x + (i % 2 ? 14 : -10), h - 30 - hgt, 5, 9, (i % 2 ? 0.6 : -0.6), 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(231,221,200,0.85)'; ctx.font = `600 22px ${MONO}`; ctx.fillText('> typing…  season 3', 28, 40);
  });
  const mon = add(root, new Mesh(roundedBox({ w: 3.4, h: 2.1, d: 0.14, r: 0.04, seg: 2 }), m({ color: color('#0d0a08'), roughness: 0.35, metalness: 0.5 })), [0.2, Y + 2.85, -2.9]);
  const scr = add(root, new Mesh(box(3.15, 1.85, 0.02), m({ color: [1, 1, 1], unlit: true, map: gardenTex })), [0.2, Y + 2.85, -2.82]); scr.castShadow = false;
  add(root, new Mesh(box(0.4, 0.7, 0.3), m(MAT.bronzeDark)), [0.2, Y + 1.95, -3.0]);
  hs.screen = { mesh: scr, anchor: [0.2, Y + 4.2, -2.8] };
  tinyKeyboard(root, [0.4, Y + 1.61, -1.7]);
  add(root, new Mesh(sphere(0.18, 16, 10), m({ color: color('#17130f'), roughness: 0.4 })), [2.2, Y + 1.7, -1.6], null, [1, 0.6, 1.5]);
  // papers stack + pen
  const papers = new Node('papers'); papers.position = [-2.0, Y + 1.61, -1.7]; root.add(papers);
  for (let i = 0; i < 6; i++) add(papers, new Mesh(box(1.1, 0.02, 1.4), m(MAT.paper)), [i * 0.02, i * 0.022, -i * 0.01], [0, i * 0.06, 0]);
  add(papers, new Mesh(cylinder(0.03, 0.03, 1.0, 8), m(MAT.bronze)), [0.5, 0.16, 0.2], [Math.PI / 2, 0, 0.5]);
  hs.papers = { mesh: papers.children[5], anchor: [-2.0, Y + 2.4, -1.5] };
  // small studio lamp
  const lampG = new Node('studio-lamp'); lampG.position = [3.2, Y + 1.61, -2.6]; root.add(lampG);
  add(lampG, new Mesh(cylinder(0.3, 0.34, 0.06, 20), m(MAT.bronzeDark)), [0, 0.03, 0]);
  add(lampG, new Mesh(cylinder(0.03, 0.03, 1.4, 8), m(MAT.bronze)), [0, 0.7, 0], [0, 0, -0.25]);
  const head = add(lampG, new Mesh(cone(0.36, 0.42, 20), m(MAT.bronze)), [0.35, 1.36, 0], [0.3, 0, -1.9]);
  add(lampG, new Mesh(sphere(0.09, 8, 6), m({ color: [1, 1, 1], emissive: color(T.tungsten), emissiveIntensity: 3, unlit: true })), [0.55, 1.2, 0]).castShadow = false;
  hs.lamp = { mesh: head, anchor: [3.2, Y + 3.6, -2.4] };
  // chair
  const chair = new Node('chair'); chair.position = [0.6, Y, 0.6]; chair.rotation[1] = 0.3; root.add(chair);
  add(chair, new Mesh(roundedBox({ w: 1.2, h: 0.16, d: 1.2, r: 0.05, seg: 2 }), m({ color: color('#5a3a22'), roughness: 0.7 })), [0, 0.9, 0]);
  add(chair, new Mesh(roundedBox({ w: 1.2, h: 1.3, d: 0.14, r: 0.05, seg: 2 }), m({ color: color('#5a3a22'), roughness: 0.7 })), [0, 1.6, 0.55], [-0.12, 0, 0]);
  add(chair, new Mesh(cylinder(0.06, 0.06, 0.85, 8), m(MAT.bronzeDark)), [0, 0.45, 0]);
  add(chair, new Mesh(cylinder(0.5, 0.55, 0.06, 5), m(MAT.bronzeDark)), [0, 0.03, 0]);
  // plant on the floor
  const pot = new Node('plant'); pot.position = [-4.8, Y, 3.6]; root.add(pot);
  add(pot, new Mesh(cylinder(0.5, 0.4, 0.8, 18), m({ color: color('#7a4a2e'), roughness: 0.85 })), [0, 0.4, 0]);
  for (let i = 0; i < 5; i++) add(pot, new Mesh(sphere(0.18, 8, 6), m({ color: color('#4f5e3a'), roughness: 0.8 })), [Math.cos(i * 1.3) * 0.25, 0.9 + i * 0.18, Math.sin(i * 1.3) * 0.25], null, [1.8, 0.5, 1]);
  // floating interface panes above the desk
  const panes = [];
  for (let i = 0; i < 3; i++) {
    const tex = screenTexture((ctx, w, h) => { ctx.fillStyle = `hsl(${project.hue} 40% 12% / 0.9)`; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = 'rgba(231,221,200,0.35)'; ctx.lineWidth = 3; ctx.strokeRect(12, 12, w - 24, h - 24); ctx.fillStyle = 'rgba(231,221,200,0.7)'; ctx.font = `500 30px ${MONO}`; ctx.fillText(['seed 0x1f', 'growth 84%', 'season: spring'][i], 40, 70); for (let j = 0; j < 4; j++) { ctx.fillStyle = `hsl(${project.hue} 60% ${45 + j * 8}% / 0.8)`; ctx.fillRect(40, 110 + j * 40, 80 + j * 90, 18); } }, 512, 320);
    const p = add(root, new Mesh(box(1.5, 0.95, 0.02), m({ color: [1, 1, 1], unlit: true, map: tex, opacity: 0.85, transparent: true, depthWrite: false })), [-1.8 + i * 1.9, Y + 4.4 + i * 0.3, -1.4 - i * 0.6], [0, (1 - i) * 0.25, 0]);
    p.castShadow = false; panes.push(p);
  }
  return { hs, lights: [
    { id: 'window', position: [O[0] + 3.2, Y + 3.4, -4.6], color: color('#ffd9a8'), intensity: 6, distance: 12 },
    { id: 'lamp', position: [O[0] + 3.6, Y + 2.9, -2.4], color: color(T.tungsten), intensity: 4, distance: 9 },
    { id: 'screen', position: [O[0] + 0.2, Y + 2.8, -2.2], color: hsl(project.hue, 0.5, 0.6), intensity: 2.5, distance: 7 },
  ], update: (dt, t) => { panes.forEach((p, i) => { p.position[1] = Y + 4.4 + i * 0.3 + Math.sin(t * 0.8 + i) * 0.08; }); } };
}

// ---------- 02 store
function buildStore(root, project, def, mini) {
  const accent = hsl(project.hue, 0.55, 0.5);
  plinth(root, def, accent, mini);
  const hs = {}; const Y = 1.16;
  // pavement + facade
  add(root, new Mesh(box(15, 0.06, 15), m({ color: color('#2a2118'), roughness: 1, map: noiseTexture(256, [50, 40, 30], 10, true), mapRepeat: [4, 4] })), [0, Y + 0.03, 0]).castShadow = false;
  const facadeMat = m({ color: color('#3b2b1d'), roughness: 0.85 });
  add(root, new Mesh(box(12, 6.5, 0.6), facadeMat), [0, Y + 3.25, -5]);
  add(root, new Mesh(box(0.6, 6.5, 9), facadeMat), [-6, Y + 3.25, -0.6]);
  // shop window
  add(root, new Mesh(box(6, 2.6, 0.1), m({ ...MAT.glass, opacity: 0.35, transparent: true, fresnel: 0.4, fresnelColor: C.highlight, depthWrite: false })), [1.5, Y + 2.4, -4.66]).castShadow = false;
  add(root, new Mesh(box(6.2, 0.14, 0.2), m(MAT.bronze)), [1.5, Y + 3.78, -4.66]);
  // awning (striped)
  const awningTex = drawTexture(256, 64, (ctx, w, h) => { for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#b8622c' : '#e7ddc8'; ctx.fillRect(i * 32, 0, 32, h); } });
  add(root, new Mesh(box(7, 0.08, 2.4), m({ color: [1, 1, 1], roughness: 0.9, map: awningTex, mapRepeat: [3, 1] })), [1.5, Y + 4.1, -3.6], [0.28, 0, 0]);
  // hanging sign
  const signTex = drawTexture(512, 192, (ctx, w, h) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = 'rgba(40,26,12,0.92)'; ctx.font = `700 96px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('LATTICE', w / 2, h / 2 - 12); ctx.font = `400 26px ${MONO}`; ctx.fillText('FLOORS · ROOMS · FILES', w / 2, h / 2 + 62); });
  const sign = add(root, new Mesh(box(3.2, 1.2, 0.08), m({ ...MAT.cream, map: signTex })), [-3.6, Y + 5.2, -4.2]);
  add(root, new Mesh(box(0.06, 1.0, 0.06), m(MAT.bronze)), [-3.6, Y + 6.3, -4.2]);
  hs.sign = { mesh: sign, anchor: [-3.6, Y + 6.2, -3.6] };
  // shelves with product blocks (brutalist: everything is a block)
  const shelves = new Node('shelves'); shelves.position = [-4.6, Y, 1.4]; shelves.rotation[1] = Math.PI / 2; root.add(shelves);
  for (let r = 0; r < 3; r++) {
    add(shelves, new Mesh(box(4.4, 0.08, 1), m(MAT.walnut)), [0, 0.6 + r * 1.1, 0]);
    for (let c = 0; c < 4; c++) {
      const hgt = 0.5 + ((r * 4 + c) % 3) * 0.18;
      add(shelves, new Mesh(roundedBox({ w: 0.7, h: hgt, d: 0.6, r: 0.04, seg: 2 }), m({ color: hsl(project.hue + (c % 2) * 14, 0.45, 0.32 + r * 0.06), roughness: 0.75 })), [-1.6 + c * 1.05, 0.64 + r * 1.1 + hgt / 2, 0]);
    }
  }
  for (const dx of [-2.15, 2.15]) add(shelves, new Mesh(box(0.1, 3.4, 1), m(MAT.bronzeDark)), [dx, 1.7, 0]);
  hs.shelves = { mesh: shelves.children[0], anchor: [-4.6, Y + 4.2, 1.4] };
  // checkout counter with register
  const counter = add(root, new Mesh(roundedBox({ w: 3.6, h: 1.4, d: 1.3, r: 0.05, seg: 2 }), m({ ...MAT.walnut, color: color('#4a3520') })), [2.6, Y + 0.7, 2.2]);
  add(root, new Mesh(box(3.7, 0.08, 1.4), m(MAT.bronze)), [2.6, Y + 1.44, 2.2]);
  const regTex = screenTexture((ctx, w, h) => { ctx.fillStyle = 'rgba(231,221,200,0.9)'; ctx.font = `600 52px ${MONO}`; ctx.fillText('TOTAL', 40, 90); ctx.font = `700 96px ${MONO}`; ctx.fillText('3 rooms', 40, 210); ctx.fillStyle = `hsl(${project.hue} 60% 60%)`; ctx.fillRect(40, 250, 300, 12); }, 512, 320);
  add(root, new Mesh(roundedBox({ w: 1.0, h: 0.7, d: 0.1, r: 0.03, seg: 2 }), m({ color: color('#0d0a08'), roughness: 0.4, metalness: 0.4 })), [2.0, Y + 1.85, 2.0], [-0.25, 0.4, 0]);
  add(root, new Mesh(box(0.9, 0.6, 0.02), m({ color: [1, 1, 1], unlit: true, map: regTex })), [1.98, Y + 1.85, 2.06], [-0.25, 0.4, 0]).castShadow = false;
  hs.counter = { mesh: counter, anchor: [2.6, Y + 2.6, 2.4] };
  // packages / crates / shopping bag near the door
  const crate = new Node('crates'); crate.position = [4.6, Y, -1.6]; root.add(crate);
  const crateMat = m({ color: color('#8a6a48'), roughness: 0.85, map: noiseTexture(128, [150, 120, 90], 30), mapRepeat: [1, 1] });
  add(crate, new Mesh(roundedBox({ w: 1.1, h: 1.1, d: 1.1, r: 0.04, seg: 2 }), crateMat), [0, 0.55, 0]);
  add(crate, new Mesh(roundedBox({ w: 0.9, h: 0.9, d: 0.9, r: 0.04, seg: 2 }), crateMat), [0.2, 1.55, -0.1], [0, 0.4, 0]);
  add(crate, new Mesh(roundedBox({ w: 0.8, h: 0.8, d: 0.8, r: 0.04, seg: 2 }), crateMat), [-1.3, 0.4, 0.6], [0, -0.3, 0]);
  const bag = add(crate, new Mesh(box(0.7, 0.9, 0.35), m({ ...MAT.paper, color: color('#d9c9a8') })), [1.4, 0.45, 0.9], [0, 0.5, 0]);
  add(crate, new Mesh(torus(0.22, 0.02, 16, 6, Math.PI), m(MAT.bronze)), [1.4, 0.95, 0.9], [0, 0.5, 0]);
  hs.crate = { mesh: crate.children[0], anchor: [4.6, Y + 3.0, -1.4] };
  // door with light inside + little street lamp
  add(root, new Mesh(box(1.6, 3.2, 0.1), m({ color: [1, 1, 1], emissive: color('#ffcf98'), emissiveIntensity: 0.7, unlit: true })), [-3.6, Y + 1.6, -4.66]).castShadow = false;
  add(root, new Mesh(cylinder(0.05, 0.06, 3.4, 8), m(MAT.bronzeDark)), [5.6, Y + 1.7, 3.8]);
  add(root, new Mesh(sphere(0.22, 10, 8), m({ color: [1, 1, 1], emissive: color(T.tungsten), emissiveIntensity: 2.5, unlit: true })), [5.6, Y + 3.5, 3.8]).castShadow = false;
  // planter tree
  add(root, new Mesh(roundedBox({ w: 1.2, h: 0.8, d: 1.2, r: 0.05, seg: 2 }), m({ color: color('#3b2b1d'), roughness: 0.9 })), [-1.2, Y + 0.4, 4.4]);
  add(root, new Mesh(cylinder(0.08, 0.1, 1.4, 8), m({ color: color('#4a3520') })), [-1.2, Y + 1.4, 4.4]);
  add(root, new Mesh(sphere(0.85, 12, 8), m({ color: color('#4f5e3a'), roughness: 0.85 })), [-1.2, Y + 2.5, 4.4]);
  return { hs, lights: [
    { id: 'door', position: [O[0] - 3.6, Y + 1.8, -3.8], color: color('#ffcf98'), intensity: 5, distance: 10 },
    { id: 'street', position: [O[0] + 5.6, Y + 3.4, 3.8], color: color(T.tungsten), intensity: 5, distance: 10 },
    { id: 'window', position: [O[0] + 1.5, Y + 2.4, -3.8], color: hsl(project.hue, 0.5, 0.6), intensity: 2.5, distance: 8 },
  ], update: () => {} };
}

// ---------- 03 lab
function buildLab(root, project, def, mini) {
  const accent = hsl(project.hue, 0.5, 0.55);
  plinth(root, def, accent, mini);
  const hs = {}; const Y = 1.16;
  add(root, new Mesh(box(15, 0.06, 15), m({ color: color('#1b1610'), roughness: 0.6, metalness: 0.2, map: noiseTexture(256, [40, 34, 26], 8, true), mapRepeat: [6, 6] })), [0, Y + 0.03, 0]).castShadow = false;
  // back rack with three monitors
  const rack = new Node('rack'); rack.position = [0, Y, -4.6]; root.add(rack);
  add(rack, new Mesh(box(9, 0.14, 1.2), m(MAT.bronzeDark)), [0, 2.4, 0]);
  for (const dx of [-4.2, 4.2]) add(rack, new Mesh(box(0.14, 5.4, 0.14), m(MAT.bronzeDark)), [dx, 2.7, 0.4]);
  const monTex = (i) => screenTexture((ctx, w, h) => {
    ctx.strokeStyle = `hsl(${project.hue} 55% 60% / 0.8)`; ctx.lineWidth = 2;
    for (let r = 0; r < 6; r++) { ctx.beginPath(); ctx.arc(w / 2, h / 2, 20 + r * 24 + (i * 7), 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = 'rgba(231,221,200,0.85)'; ctx.font = `600 26px ${MONO}`; ctx.fillText(['tide +1.8m ↑', 'wind 12kt NW', 'swell 0.6m'][i], 24, 40);
  });
  const mons = [];
  for (let i = 0; i < 3; i++) {
    const x = -3 + i * 3;
    add(rack, new Mesh(roundedBox({ w: 2.6, h: 1.7, d: 0.12, r: 0.03, seg: 2 }), m({ color: color('#0d0a08'), roughness: 0.35, metalness: 0.5 })), [x, 3.4, 0.2], [0, (1 - i) * 0.35, 0]);
    const s = add(rack, new Mesh(box(2.4, 1.5, 0.02), m({ color: [1, 1, 1], unlit: true, map: monTex(i) })), [x + (1 - i) * 0.02, 3.4, 0.27], [0, (1 - i) * 0.35, 0]); s.castShadow = false; mons.push(s);
  }
  hs.monitors = { mesh: mons[1], anchor: [0, Y + 4.9, -4.2] };
  // central ring instrument (rotating)
  const rig = new Node('rings'); rig.position = [0, Y + 2.2, -0.4]; root.add(rig);
  add(root, new Mesh(cylinder(1.3, 1.5, 0.5, 32), m(MAT.bronzeDark)), [0, Y + 0.25, -0.4]);
  add(root, new Mesh(cylinder(0.12, 0.12, 1.5, 8), m(MAT.bronze)), [0, Y + 1.2, -0.4]);
  const rings = [];
  for (let i = 0; i < 3; i++) { const r = add(rig, new Mesh(torus(0.7 + i * 0.5, 0.05, 40, 10), m({ ...MAT.bronze, emissive: accent, emissiveIntensity: 0.25 })), [0, 0, 0]); rings.push(r); }
  const core = add(rig, new Mesh(sphere(0.35, 12, 8), m({ color: [1, 1, 1], emissive: accent, emissiveIntensity: 1.6, unlit: true })), [0, 0, 0]); core.castShadow = false;
  hs.rings = { mesh: rings[2], anchor: [0, Y + 4.6, 0] };
  // diagram board on the left wall
  const boardTex = drawTexture(768, 512, (ctx, w, h) => {
    ctx.fillStyle = '#e7ddc8'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(60,40,20,0.7)'; ctx.lineWidth = 3;
    const nodes = [[120, 120], [380, 90], [620, 160], [200, 330], [470, 300], [640, 420]];
    for (let i = 0; i < nodes.length - 1; i++) { ctx.beginPath(); ctx.moveTo(...nodes[i]); ctx.lineTo(...nodes[i + 1]); ctx.stroke(); }
    for (const [x, y] of nodes) { ctx.fillStyle = '#b8622c'; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(60,40,20,0.85)'; ctx.font = `600 32px ${MONO}`; ctx.fillText('API → rings → canvas', 60, 470);
  });
  add(root, new Mesh(box(0.3, 6, 10), m({ color: color('#3a2a1c'), roughness: 0.9 })), [-6.4, Y + 3, -0.5]);
  const board = add(root, new Mesh(box(0.08, 3.2, 4.8), m({ ...MAT.paper, map: boardTex })), [-6.2, Y + 3.4, -0.6]);
  hs.diagram = { mesh: board, anchor: [-5.4, Y + 5.4, -0.6] };
  // device bench with dials and cables
  const bench = new Node('bench'); bench.position = [3.8, Y, 1.8]; bench.rotation[1] = -0.5; root.add(bench);
  add(bench, new Mesh(roundedBox({ w: 3.4, h: 1.2, d: 1.6, r: 0.05, seg: 2 }), m({ ...MAT.walnut, color: color('#4a3520') })), [0, 0.6, 0]);
  const device = add(bench, new Mesh(roundedBox({ w: 1.8, h: 0.7, d: 1.0, r: 0.06, seg: 2 }), m({ color: color('#1a1512'), roughness: 0.45, metalness: 0.5 })), [0, 1.55, 0]);
  for (let i = 0; i < 4; i++) add(bench, new Mesh(cylinder(0.1, 0.1, 0.08, 12), m(MAT.bronze)), [-0.6 + i * 0.4, 1.94, 0.25], [0, i * 0.7, 0]);
  add(bench, new Mesh(box(0.9, 0.02, 0.28), m({ color: [0, 0, 0], emissive: accent, emissiveIntensity: 1.2, unlit: true })), [0, 1.91, -0.2]).castShadow = false;
  for (let i = 0; i < 3; i++) add(bench, new Mesh(cylinder(0.025, 0.025, 1.6, 6), m({ color: color('#0d0a08') })), [-0.9 + i * 0.1, 1.0, -0.6 + i * 0.1], [0.4, 0, 0.9]);
  hs.device = { mesh: device, anchor: [3.8, Y + 3.2, 1.8] };
  // floating low-poly probe
  const probe = add(root, new Mesh(sphere(0.6, 6, 4), m({ ...MAT.glass, opacity: 0.35, transparent: true, fresnel: 0.9, fresnelColor: accent, depthWrite: false })), [-2.6, Y + 3.6, 2.6]); probe.castShadow = false;
  // light strips
  for (const dx of [-3, 3]) add(root, new Mesh(box(0.06, 0.06, 8), m({ color: [0, 0, 0], emissive: accent, emissiveIntensity: 0.9, unlit: true })), [dx, Y + 0.08, 0]).castShadow = false;
  return { hs, lights: [
    { id: 'core', position: [O[0], Y + 2.4, -0.4], color: accent, intensity: 5, distance: 10 },
    { id: 'mons', position: [O[0], Y + 3.4, -3.4], color: hsl(project.hue, 0.5, 0.6), intensity: 3, distance: 9 },
    { id: 'warm', position: [O[0] + 4, Y + 5, 4], color: color(T.tungsten), intensity: 4, distance: 14 },
  ], update: (dt, t) => { rings[0].rotation[0] = t * 0.5; rings[1].rotation[2] = t * 0.35; rings[2].rotation[1] = t * 0.25; probe.rotation[1] = t * 0.4; probe.position[1] = Y + 3.6 + Math.sin(t * 0.9) * 0.15; } };
}


// ---------- districts: the hero location sits in the centre; the district grows around it in three depth bands.
const Y0 = 1.16;
function put(root, node, x, z, ry = 0, y = Y0) { node.position = [x, y, z]; node.rotation[1] = ry; root.add(node); return node; }
function lampAt(root, lights, x, z, h = 2.4) { if (root.__mini) return null; const l = put(root, A.lampPost(h), x, z); lights.push({ id: 'lp' + lights.length, position: [O[0] + x + 0.42, Y0 + h - 0.2, O[2] + z], color: color(T.tungsten), intensity: 1.6, distance: 6 }); return l; }

function districtSignal(root, hs, lights, mini) {
  const R = A.seeded(11);
  // background band: a terrace of tall houses at the back, a signal tower over the roofs
  const backs = [[-14, -15, 3.2, 3, 4.4, 3, 'gable'], [-9.5, -15.5, 3.4, 3, 5.2, 3, 'terrace'], [-5, -15, 3, 3, 4.0, 2, 'hip'], [4, -15.5, 3.6, 3, 5.6, 3, 'gable'], [8.5, -15, 3, 3, 4.2, 2, 'flat'], [13, -15.5, 3.8, 3.2, 6.0, 4, 'terrace'], [16, -10, 3, 3, 4.6, 3, 'gable'], [-16.5, -9, 3, 3, 4.2, 2, 'hip']];
  backs.forEach(([x, z, w, d, h, f, roof], i) => put(root, A.building({ w, d, h, floors: f, roof, seed: i + 3, chimney: i % 2 === 0, balcony: i % 3 === 1, door: false, lite: mini }), x, z, (R() - 0.5) * 0.2));
  put(root, A.tower(7, 1), 12.5, -11.5);
  // midground: greenhouse (glass) + studio annexes either side of the hero room
  const gh = new Node('greenhouse'); put(root, gh, -12.5, 2);
  add(gh, new Mesh(box(5, 2.6, 4), m({ color: [0.9, 0.86, 0.78], roughness: 0.1, metalness: 0.1, opacity: 0.35, transparent: true, depthWrite: false, fresnel: 0.2, fresnelColor: color('#ffd6a3') })), [0, 1.3, 0]).castShadow = false;
  for (let i = 0; i < 6; i++) add(gh, new Mesh(box(0.06, 2.6, 0.06), m(MAT.bronzeDark)), [-2.5 + i, 1.3, i % 2 ? 2 : -2]);
  add(gh, new Mesh(cone(3.2, 1.4, 4), m({ color: [0.9, 0.86, 0.78], roughness: 0.1, opacity: 0.4, transparent: true, depthWrite: false })), [0, 3.3, 0], [0, Math.PI / 4, 0], [1.1, 1, 0.9]).castShadow = false;
  for (let i = 0; i < 5; i++) add(gh, A.tree(3, 20 + i, 0.8), [-1.6 + i * 0.8, 0.1, (i % 2 ? 0.8 : -0.8)]);
  put(root, A.building({ w: 4, d: 3.2, h: 3.2, floors: 2, roof: 'terrace', seed: 12, sign: 'ATELIER', awning: true }), 12.5, 2.5, -0.35);
  put(root, A.building({ w: 3.2, d: 3, h: 2.8, floors: 1, roof: 'gable', seed: 14, awning: true, sign: 'SEEDS' }), 12.8, 9, -0.5);
  put(root, A.building({ w: 3.4, d: 3, h: 3.4, floors: 2, roof: 'hip', seed: 15, balcony: true }), -13, 9.5, 0.4);
  // the garden: paths, planters, a bridge over a dark stream, benches
  A.path(root.__pathLayer || root, [[-8, 14], [0, 12], [9, 13], [12, 6], [9, -2], [0, -9], [-9, -9], [-11, -2], [-8, 6]], 1.4);
  const stream = add(root, new Mesh(box(30, 0.02, 1.6), m({ color: color('#0f0c0a'), roughness: 0.08, metalness: 0.6, fresnel: 0.5, fresnelColor: color('#c7a36a') })), [0, Y0 + 0.005, -11.4]); stream.castShadow = false;
  put(root, A.bridge(4.2, 0.5), 3, -11.4, Math.PI / 2);
  if (!mini) [[-6, 14.5], [6, 15], [14.5, 14.5], [-15, 14.5]].forEach(([x, z], i) => put(root, A.bench(), x, z, i % 2 ? 0.6 : -0.4));
  const treeSpots = [[-16, 15], [-12, 16], [-8, 17], [8, 17], [15, 16], [17, 10], [17, 4], [17, -4], [-17, -4], [-17, 5], [-16, 13], [-3, 16.5], [3, 16.5], [10, -6], [-10, -6], [16.5, -13], [-16, -13]];
  treeSpots.forEach(([x, z], i) => { if (mini && i % 2) return; put(root, A.tree(i % 4, 30 + i, 0.8 + R() * 0.5), x, z); });
  if (!mini) { [[-9, 11], [9, 11], [12, 12.5], [-12, 12.5], [4, 9], [-4, 9]].forEach(([x, z], i) => put(root, A.planter(i), x, z, i * 0.3)); [[2, 13], [-3, 12.5], [9, 8], [-11, 5]].forEach(([x, z], i) => put(root, A.person(i + 5), x, z)); }
  lampAt(root, lights, -6, 12.5); lampAt(root, lights, 7, 12); lampAt(root, lights, 12, -4); lampAt(root, lights, -11, -6);
  // rooftop utilities: antennas, a transformer box and the cables that tie the district to the tower
  const antennaTops = [];
  [[-9.5, -15.5, 5.2], [4, -15.5, 5.6], [13, -15.5, 6.0], [12.5, 2.5, 3.2], [-13, 9.5, 3.4]].forEach(([x, z, h], i) => {
    const mast = add(root, new Mesh(cylinder(0.03, 0.04, 1.6 + (i % 2) * 0.6, 6), m(MAT.bronzeDark)), [x + 0.8, Y0 + h + 0.8 + (i % 2) * 0.3, z - 0.6]);
    add(root, new Mesh(box(0.5, 0.02, 0.02), m(MAT.bronze)), [x + 0.8, Y0 + h + 1.5 + (i % 2) * 0.6, z - 0.6]);
    add(root, new Mesh(sphere(0.05, 6, 4), m({ color: [1, 1, 1], emissive: color('#ff7a3a'), emissiveIntensity: 1.6, unlit: true })), [x + 0.8, Y0 + h + 1.62 + (i % 2) * 0.6, z - 0.6]).castShadow = false;
    antennaTops.push([x + 0.8, Y0 + h + 1.5 + (i % 2) * 0.6, z - 0.6]);
  });
  const towerTop = [12.5, Y0 + 7.2, -11.5];
  for (const a of antennaTops) { const dx = towerTop[0] - a[0], dy = towerTop[1] - a[1], dz = towerTop[2] - a[2]; const len = Math.hypot(dx, dy, dz); const c = add(root, new Mesh(box(len, 0.02, 0.02), m({ color: color('#1a130c'), roughness: 0.9 })), [(a[0] + towerTop[0]) / 2, (a[1] + towerTop[1]) / 2 - len * 0.03, (a[2] + towerTop[2]) / 2], [0, -Math.atan2(dz, dx), Math.asin(dy / len)]); c.castShadow = false; }
  add(root, new Mesh(box(1.2, 1.0, 0.8), m({ color: color('#3b2b1d'), roughness: 0.7, metalness: 0.3 })), [-2, Y0 + 0.5, -12.6]);
  add(root, new Mesh(box(1.3, 0.06, 0.9), m(MAT.bronzeDark)), [-2, Y0 + 1.03, -12.6]);
  add(root, new Mesh(sphere(0.06, 6, 4), m({ color: [1, 1, 1], emissive: color('#ff7a3a'), emissiveIntensity: 1.6, unlit: true })), [-1.5, Y0 + 0.8, -12.18]).castShadow = false;
  if (!mini) { put(root, A.signPost('STUDIO ↑'), -7, 13); put(root, A.signPost('TOWER →'), 9, -6); }
  // hotspots on district landmarks
  const towerHit = add(root, new Mesh(box(1.6, 8, 1.6), m({ color: [0, 0, 0], opacity: 0.01, transparent: true, depthWrite: false })), [12.5, Y0 + 4, -11.5]); towerHit.castShadow = false;
  hs.tower = { mesh: towerHit, anchor: [12.5, Y0 + 8.5, -11.5] };
  const ghHit = add(root, new Mesh(box(5.2, 4.2, 4.2), m({ color: [0, 0, 0], opacity: 0.01, transparent: true, depthWrite: false })), [-12.5, Y0 + 2, 2]); ghHit.castShadow = false;
  hs.greenhouse = { mesh: ghHit, anchor: [-12.5, Y0 + 4.6, 2] };
}

function districtLattice(root, hs, lights, mini) {
  const R = A.seeded(23);
  // a commerce street running left-right in front of the shop, arcaded blocks behind
  const street = [[-15, 12], [-10.5, 12.5], [-6, 12], [6, 12], [10.5, 12.5], [15, 12]];
  street.forEach(([x, z], i) => put(root, A.building({ w: 3.6, d: 3, h: 2.8 + (i % 3) * 0.5, floors: 1 + (i % 2), roof: i % 2 ? 'terrace' : 'gable', seed: 40 + i, awning: true, lite: mini, sign: ['BREAD', 'PRESS', 'KIOSK', 'LAMPS', 'CLOTH', 'INK'][i] }), x, z + 1.5, 0));
  const backs = [[-15, -14, 3.2, 3.2, 5.2, 3, 'flat'], [-10, -15, 4, 3, 6.4, 4, 'terrace'], [-4.5, -14.5, 3.4, 3, 4.8, 3, 'gable'], [4.5, -15, 3.6, 3.2, 5.6, 3, 'hip'], [10, -14.5, 4, 3, 7.0, 4, 'flat'], [15, -15, 3.2, 3, 5.0, 3, 'gable'], [-16, -6, 3, 3, 4.4, 2, 'terrace'], [16, -6, 3, 3, 4.0, 2, 'gable'], [-16, 2, 3.2, 3, 3.6, 2, 'hip'], [16, 2, 3.2, 3, 4.6, 3, 'flat']];
  backs.forEach(([x, z, w, d, h, f, roof], i) => put(root, A.building({ w, d, h, floors: f, roof, seed: 60 + i, balcony: i % 2 === 0, chimney: i % 3 === 0, door: false, tower: i === 4, lite: mini }), x, z, (R() - 0.5) * 0.15));
  A.path(root, [[-17, 8], [17, 8]], 2.4, 'street');
  A.path(root, [[0, 8], [0, -10]], 1.6, 'street');
  if (!mini) { [[-8, 8], [-3, 8.5], [3, 8.5], [8, 8]].forEach(([x, z], i) => put(root, A.cart(i), x, z, i % 2 ? 0.2 : -0.2)); [[-12, 9.5], [12, 9.3], [-6, 6.2]].forEach(([x, z], i) => put(root, A.bicycle(), x, z, R() * 3)); for (let i = 0; i < 8; i++) put(root, A.crate(i, 0.6 + R() * 0.5), -14 + R() * 4, 5 + R() * 3); [[-5, 10], [2, 9.5], [7, 10.2], [-1, 6.5], [11, 6.5]].forEach(([x, z], i) => put(root, A.person(i + 9), x, z)); put(root, A.signPost('MARKET'), -9, 6); put(root, A.signPost('ARCADE'), 9, 6); }
  if (!mini) [[-12, 5.5], [12, 5.5], [-14, -9], [14, -9]].forEach(([x, z], i) => put(root, A.bench(), x, z, i < 2 ? 0 : Math.PI));
  [[-17, 16], [17, 16], [-17, -17], [17, -17], [-6, -10], [6, -10], [-12, -9], [12, -9]].forEach(([x, z], i) => put(root, A.tree(i % 2 ? 2 : 0, 70 + i, 0.9), x, z));
  lampAt(root, lights, -9, 9.5); lampAt(root, lights, 9, 9.5); lampAt(root, lights, -3, -8); lampAt(root, lights, 3, -8);
  const towerHit = add(root, new Mesh(box(2.2, 8, 2.2), m({ color: [0, 0, 0], opacity: 0.01, transparent: true, depthWrite: false })), [11.5, Y0 + 5, -15.5]); towerHit.castShadow = false;
  hs.tower = { mesh: towerHit, anchor: [11.5, Y0 + 10, -15.5] };
  const mkHit = add(root, new Mesh(box(12, 2, 3), m({ color: [0, 0, 0], opacity: 0.01, transparent: true, depthWrite: false })), [0, Y0 + 1, 8.3]); mkHit.castShadow = false;
  hs.market = { mesh: mkHit, anchor: [0, Y0 + 3, 8.3] };
}

function districtTide(root, hs, lights, mini) {
  const R = A.seeded(37);
  // a harbour: water on the right half, quay edge, warehouses and a lighthouse at the back
  const water = add(root, new Mesh(box(15, 0.02, 38), m({ color: color('#0c0a08'), roughness: 0.06, metalness: 0.7, fresnel: 0.6, fresnelColor: color('#b08a52') })), [11.5, Y0 + 0.004, 0]); water.castShadow = false;
  add(root, new Mesh(box(0.4, 0.5, 38), m(MAT.bronzeDark)), [4, Y0 + 0.1, 0]);
  if (!mini) for (let i = 0; i < 9; i++) add(root, new Mesh(cylinder(0.14, 0.16, 0.5, 8), m(MAT.bronze)), [3.6, Y0 + 0.25, -16 + i * 4]);
  // boats
  for (let i = 0; i < (mini ? 2 : 4); i++) { const b = new Node('boat'); put(root, b, 8 + R() * 6, -12 + i * 7, R() * 0.8); add(b, new Mesh(roundedBox({ w: 2.6, h: 0.5, d: 1.0, r: 0.2, seg: 2, taper: 0.7 }), m({ color: color(['#5c4a3a', '#8e6a3d', '#3b2b1d', '#b8622c'][i]), roughness: 0.6 })), [0, 0.25, 0]); add(b, new Mesh(cylinder(0.03, 0.04, 2.2, 6), m(MAT.bronzeDark)), [0.2, 1.4, 0]); add(b, new Mesh(box(0.05, 1.2, 0.8), m({ ...MAT.paper, color: color('#d9c9a8') })), [0.22, 1.5, 0]); add(b, new Mesh(sphere(0.06, 6, 4), m({ color: [1, 1, 1], emissive: color('#ff7a3a'), emissiveIntensity: 2, unlit: true })), [0.2, 2.5, 0]).castShadow = false; }
  // lighthouse + warehouses
  const lh = new Node('lighthouse'); put(root, lh, 14, -14);
  add(lh, new Mesh(cylinder(0.7, 1.0, 6, 14), m({ color: color('#a8977a'), roughness: 0.85 })), [0, 3, 0]);
  for (let i = 0; i < 3; i++) add(lh, new Mesh(torus(0.86 - i * 0.07, 0.05, 18, 6), m({ color: color('#b8622c'), roughness: 0.7 })), [0, 1.2 + i * 1.8, 0], [Math.PI / 2, 0, 0]);
  add(lh, new Mesh(cylinder(0.7, 0.7, 1.2, 12), m({ color: [1, 1, 1], emissive: color('#ffd6a3'), emissiveIntensity: 1.8, unlit: true, opacity: 0.8, transparent: true })), [0, 6.6, 0]).castShadow = false;
  add(lh, new Mesh(cone(0.85, 0.8, 12), m(MAT.bronzeDark)), [0, 7.5, 0]);
  const whs = [[-14, -15, 5, 4, 3.6, 2, 'gable'], [-7.5, -15.5, 5, 4, 4.2, 2, 'gable'], [-1, -15, 4.5, 4, 3.4, 2, 'flat'], [4.5, -14.5, 4, 3.5, 4.8, 3, 'terrace'], [-16, -7, 3.4, 3, 4.6, 3, 'hip'], [-16, 1, 3.4, 3, 3.8, 2, 'gable'], [-16, 9, 3.6, 3, 5.0, 3, 'terrace'], [-11, 14, 4, 3.2, 3.6, 2, 'gable'], [-4, 14.5, 3.6, 3, 4.4, 3, 'hip'], [2, 14, 3.4, 3, 3.2, 2, 'flat']];
  whs.forEach(([x, z, w, d, h, f, roof], i) => put(root, A.building({ w, d, h, floors: f, roof, seed: 80 + i, chimney: i % 2 === 0, door: i > 6, sign: i === 7 ? 'CHANDLER' : i === 9 ? 'TIDE OFFICE' : null, awning: i > 6, lite: mini }), x, z, (R() - 0.5) * 0.15));
  // crane on the quay
  const crane = new Node('crane'); put(root, crane, 1.5, -8);
  add(crane, new Mesh(box(0.5, 6, 0.5), m(MAT.bronzeDark)), [0, 3, 0]); add(crane, new Mesh(box(6, 0.3, 0.3), m(MAT.bronzeDark)), [2.6, 6, 0]); add(crane, new Mesh(cylinder(0.02, 0.02, 3.5, 4), m(MAT.bronze)), [5, 4.2, 0]); add(crane, new Mesh(box(0.6, 0.6, 0.6), m({ color: color('#8a6a48'), roughness: 0.85 })), [5, 2.2, 0]);
  A.path(root, [[-17, 10], [3, 10], [3, -12]], 2.0, 'quay');
  if (!mini) { for (let i = 0; i < 10; i++) put(root, A.crate(i, 0.6 + R() * 0.6), -12 + R() * 12, 5 + R() * 4); [[-8, 11], [-2, 11.5], [2, 7], [-13, 4]].forEach(([x, z], i) => put(root, A.person(i + 15), x, z)); put(root, A.signPost('QUAY 3'), -6, 8.5); [[-10, 7.5], [-3, 7.5]].forEach(([x, z]) => put(root, A.bench(), x, z)); }
  [[-17, 16], [-12, 17], [-6, 17.5], [-17, -12], [-12, -9], [-7, -9]].forEach(([x, z], i) => put(root, A.tree(i % 3, 90 + i, 0.8 + R() * 0.4), x, z));
  lampAt(root, lights, -8, 9); lampAt(root, lights, 1, 9); lampAt(root, lights, 3, -4); lampAt(root, lights, -14, -3);
  lights.push({ id: 'lighthouse', position: [O[0] + 14, Y0 + 6.6, O[2] - 14], color: color('#ffd6a3'), intensity: 5, distance: 16 });
  const lhHit = add(root, new Mesh(box(2.8, 9, 2.8), m({ color: [0, 0, 0], opacity: 0.01, transparent: true, depthWrite: false })), [14, Y0 + 4.5, -14]); lhHit.castShadow = false;
  hs.lighthouse = { mesh: lhHit, anchor: [14, Y0 + 10, -14] };
  const hbHit = add(root, new Mesh(box(10, 3, 22), m({ color: [0, 0, 0], opacity: 0.01, transparent: true, depthWrite: false })), [11, Y0 + 1, 0]); hbHit.castShadow = false;
  hs.harbour = { mesh: hbHit, anchor: [11, Y0 + 3.5, 0] };
}
const DISTRICTS = { studio: districtSignal, store: districtLattice, lab: districtTide };

// Corrections to exported hotspot boxes (asset-local, like the export): two ids dropped on one building, or a box that swallowed a smaller one
// and so could never be clicked. `pin` moves only the marker, for a subject that sits under a roof. `cam` ({ dir, max }) sets the inspect view's
// direction and caps its distance, for a subject indoors.
const HOTSPOT_FIX = {
  // payroll had landed on the greenhouse; it gets the house on the right. Three pins sat inside what they mark (the desk's bronze canopy,
  // the lamp's head, the greenhouse glass): each now clears the highest surface under its ring
  world_01: { papers: { pos: [13.5, 1.7, 1.8], size: [4.8, 3.4, 3.4] }, desk: { pin: [5, 6.9, -12] }, lamp: { pin: [-12.5, 4.35, 3] }, greenhouse: { pin: [-11, 5.0, -9.5] } },
  world_03: { monitors: { pos: [6, 2.8, -9.2], size: [4.4, 3.6, 1.8] }, rings: { pos: [6, 2.4, -7], size: [4.4, 2.6, 2.2], pin: [6, 2.9, -5.4] }, device: { pin: [-9, 3.9, -9] } }, // screens at the back of the case, the core at its front; the device's pin was in its cable
  world_05: { kiosk: { pin: [12, 4.5, -6] }, slide: { pin: [-5.7, 3.2, 1.9] } }, // the kiosk's pin was inside its roof sign; the slide's floated beside the tower, it now tops the canopy
  world_06: { terrace: { pin: [-9.1, 2.3, 2.9] }, workshop: { pos: [5, 3, -10.5], size: [5.4, 5, 4.4], pin: [5, 5.8, -10.5] }, gallery: { pin: [11, 4.4, -1] } }, // over the middle easel, not in the air between all three; the workshop takes in its roof (to 5.5); the gallery's pin clears its roof
  // indoors: rafters at 8.4 to 9.2 and lamp cords and a string of lights from 5.9 up, so a view stays low (eye level, under the lights) or looks down
  // between two rafters; the shelves box is the three bookcases (it ran 20 deep, more than any view of it could fit)
  world_08: { bench: { pin: [-4, 3.3, -11.5], cam: { dir: [0.25, 0.26, 0.93], max: 13 } }, plants: { cam: { dir: [0.25, 0.31, 0.92], max: 11 } }, sketches: { cam: { dir: [0.21, 0.59, 0.78], max: 18 } }, shelves: { pos: [-12.5, 3.15, 0], size: [1.1, 6.3, 17.3], cam: { dir: [0.89, 0.19, 0.42], max: 13 } } },
  world_09: { phone: { pin: [4.2, 3, -10] }, shelf: { pin: [12.5, 6.5, -6], cam: { dir: [-0.88, 0.23, 0.41], max: 13 } } }, // the phone's pin floated 1.2 above it, the shelf's sat in its top; the shelf faces into the room, the usual view was outside its wall
};

// Export slips, taken out at build (the miniature on the key too, so nothing changes at the swap): world_08's stair rail (mesh 161) came out rotated,
// a brass rod slanting across the bench and the plants; and the bookcases are closed boxes, whose face toward the room hid the books inside.
// [mesh, its material (a guard, should a re-export renumber the meshes), face]: no face drops the whole mesh, 'x+' the side of it facing +x.
const DROP = {
  // four small bookcases were exported as closed walnut boxes inside one merged mesh, seven books shut in each: the face towards the hall opens
  world_04: [[5, 'KW_Walnut', 'x+', [-12.3, -0.1, -2.7, -11.7, 1.6, -1.3]], [5, 'KW_Walnut', 'x-', [12.2, -0.1, 0.8, 12.8, 1.6, 2.2]], [5, 'KW_Walnut', 'z-', [-7.2, -0.1, 11.6, -5.8, 1.6, 12.4]], [5, 'KW_Walnut', 'x-', [6.7, -0.1, 11.3, 7.3, 1.6, 12.7]]],
  // the brass rod and the twelve oak steps it belonged to: a stair exported outside the room (z -11.5 to -22.3, through the back wall at -12
  // and off the plinth), climbing to nothing; and the bookcase fronts, so their books show
  world_08: [[161, 'KW_WarmBrass'], ...Array.from({ length: 12 }, (_, i) => [149 + i, 'KW_Oak']), [19, 'KW_Walnut', 'x+'], [26, 'KW_Walnut', 'x+'], [33, 'KW_Walnut', 'x+'], [40, 'KW_Walnut', 'z+'], [47, 'KW_Walnut', 'x-']],
  world_09: [[90, 'KW_Walnut', 'x-'], [97, 'KW_Walnut', 'x-'], [104, 'KW_Walnut', 'z+'], [150, 'KW_Plaster2', 'x+']],
};
// Micro-life: triangles lifted out of the export into meshes of their own (added after its meshes, so the first-seen order of its materials holds),
// to sway about a pivot or glow to a beat of their own. A `pick` ({ mesh: index or list, mat, box: [x0, y0, z0, x1, y1, z1] }) takes the triangles
// that match every key given, with all three corners inside the box. Only the full world gets them: the miniature on the key never moves.
const LIVE = {
  world_05: [{ id: 'swing', pick: [{ mat: 'KW_Cream', box: [-2.4, 0.7, 7.8, -1.6, 2.6, 8.2] }, { mat: 'KW_Ember', box: [-2.4, 0.7, 7.8, -1.6, 0.85, 8.2] }], pivot: [-2, 2.53, 8], sway: (t, r) => { r[0] = 0.1 * Math.sin(t * 1.96); } }], // ropes and seat, from the bar (along x): a 3.2 s swing
  world_07: [{ id: 'cabin', pick: [{ mat: 'KW_Window', box: [8, 2.9, -9.7, 10.4, 3.5, -9.3] }], glow: (t) => 1 + 0.15 * (0.5 * Math.sin(t * 5.7) + 0.3 * Math.sin(t * 9.4 + 1.3) + 0.2 * Math.sin(t * 2.3 + 0.7)) }], // firelight in the cabin's two windows
  world_08: [[-6, -4], [6, -4], [-6, 8], [6, 8]].map(([x, z], k) => ({ id: 'lamp' + k, pick: [{ mesh: [106 + k * 3, 107 + k * 3, 108 + k * 3], box: [x - 0.8, 5.2, z - 0.8, x + 0.8, 8.95, z + 0.8] }], pivot: [x, 8.9, z], sway: (t, r) => { r[0] = 0.02 * Math.sin(t * 1.7 + k * 2.1); r[2] = 0.02 * Math.sin(t * 1.3 + k * 1.3); } })), // shade, cord and bulb, from the top of the cord
  world_09: [{ id: 'screen', pick: [{ mesh: 87, mat: 'KW_Screen' }], glow: (t) => { const p = (t % 4) / 0.9; return p < 1 ? 1 + 0.6 * Math.sin(p * Math.PI) ** 2 : 1; } }, { id: 'led', pick: [{ mesh: 88, mat: 'KW_Ember' }], glow: (t) => { const p = t % 4; return (p > 0.1 && p < 0.22) || (p > 0.38 && p < 0.5) ? 1.8 : 0.6; } }], // a message every 4 s: the phone lights up and its LED blinks twice
};
// one export mesh's geometry as arrays, whichever form the loader left it in (kwb2 typed arrays, or the kwbin1 base64 buildAsset would decode)
const meshGeo = (me) => { if (me.positions) return me; const b = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer, q = me.q || 100; return { positions: Float32Array.from(new Int16Array(b(me.pos)), (v) => v / q), normals: Float32Array.from(new Int8Array(b(me.nor)), (v) => v / 127), indices: me.idx32 ? new Uint32Array(b(me.idx)) : new Uint16Array(b(me.idx)) }; };
/** The export's meshes with its DROP applied and (`live` given) the LIVE triangles moved into meshes named 'live:<id>' at the end. The cached JSON is left as it is. */
function prepMeshes(json, drops = [], live = []) {
  if (!drops.length && !live.length) return json.meshes;
  const kept = [], moved = new Map();
  json.meshes.forEach((me, mi) => {
    const dr = drops.filter((d) => d[0] === mi && d[1] === me.material.name), lv = live.flatMap((l) => l.pick.filter((p) => (p.mesh === undefined || [].concat(p.mesh).includes(mi)) && (!p.mat || p.mat === me.material.name)).map((p) => ({ id: l.id, box: p.box })));
    if (!dr.length && !lv.length) { kept.push(me); return; }
    if (dr.some((d) => !d[2])) return;
    const g = meshGeo(me), P = g.positions, I = g.indices, keep = [];
    const inside = (b, k) => P[k * 3] >= b[0] && P[k * 3] <= b[3] && P[k * 3 + 1] >= b[1] && P[k * 3 + 1] <= b[4] && P[k * 3 + 2] >= b[2] && P[k * 3 + 2] <= b[5];
    // the face is the mesh's own extreme on that axis; with a box (one object inside a merged mesh, often turned a little off the axes),
    // it is that object's triangles that face that way (their normal within ~25 degrees of the axis)
    const planes = dr.map(([, , f, box]) => { const a = 'xyz'.indexOf(f[0]), s = f[1] === '+' ? 1 : -1; let v = -Infinity; if (!box) for (let k = 0; k < P.length / 3; k++) v = Math.max(v, s * P[k * 3 + a]); return [a, s, s * v, box]; });
    const facing = (tri, a, s) => { const [p, q, r] = tri.map((k) => [P[k * 3], P[k * 3 + 1], P[k * 3 + 2]]); const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], w = [r[0] - p[0], r[1] - p[1], r[2] - p[2]]; const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]; return (s * n[a]) / (Math.hypot(...n) || 1) > 0.9; };
    for (let t = 0; t < I.length; t += 3) {
      const tri = [I[t], I[t + 1], I[t + 2]];
      if (planes.some(([a, s, v, box]) => (box ? tri.every((k) => inside(box, k)) && facing(tri, a, s) : tri.every((k) => Math.abs(P[k * 3 + a] - v) < 0.005)))) continue;
      const l = lv.find((p) => !p.box || tri.every((k) => inside(p.box, k)));
      if (!l) { keep.push(...tri); continue; }
      const key = l.id + '|' + mi; if (!moved.has(key)) moved.set(key, { id: l.id, me, g, tris: [] }); moved.get(key).tris.push(...tri);
    }
    if (keep.length) kept.push(keep.length === I.length ? me : { name: me.name, material: me.material, positions: P, normals: g.normals, indices: Uint32Array.from(keep) });
  });
  for (const { id, me, g, tris } of moved.values()) { // compacted: only the corners these triangles use
    const at = new Map(), P = [], N = [], idx = tris.map((k) => { let n = at.get(k); if (n === undefined) { n = P.length / 3; at.set(k, n); P.push(g.positions[k * 3], g.positions[k * 3 + 1], g.positions[k * 3 + 2]); N.push(g.normals[k * 3], g.normals[k * 3 + 1], g.normals[k * 3 + 2]); } return n; });
    kept.push({ name: 'live:' + id, material: me.material, positions: new Float32Array(P), normals: new Float32Array(N), indices: Uint32Array.from(idx) });
  }
  return kept;
}

/** A world modelled in Blender (assets/world_XX.json): the plinth is ours, everything on it is the export. */
function buildAssetWorld(root, project, def, mini) {
  const accent = hsl(project.hue, 0.6, 0.55);
  plinth(root, def, accent, mini);
  // GodPlan's world is built in code (app/godworld): the floor of the company that runs on it, not the Blender export
  if (def.world.key === 'signal-garden') return buildGodWorld(root, O, mini);
  // the client street and JAKASN: the keyboard's districts at a world's size (app/townworld)
  if (townWorldHere(def.world.key)) return buildTownWorld(root, O, def.world.key, mini);
  const json = def.world.__json; if (!json) return { hs: {}, lights: [], update: () => {} };
  const parts = mini ? [] : LIVE[def.world.asset] || [], meshes = prepMeshes(json, DROP[def.world.asset], parts), grp = (n) => (/^live:/.test(n) ? n : 'all');
  const a = buildAsset(meshes === json.meshes ? json : { ...json, meshes }, { name: 'world:' + def.world.key, group: grp });
  a.root.position = [0, 1.16, 0]; root.add(a.root);
  // a part that sways hangs from a node at its pivot
  const sways = parts.filter((p) => p.pivot && a.groups.has('live:' + p.id)).map((p) => { const g = a.groups.get('live:' + p.id), pv = new Node('live:' + p.id); pv.position = [...p.pivot]; a.root.add(pv); pv.add(g); g.position = p.pivot.map((v) => -v); return { node: pv, sway: p.sway }; });
  const hs = {}; const fix = HOTSPOT_FIX[def.world.asset] || {};
  for (const h0 of json.hotspots || []) {
    const id = h0.id.replace(/\.\d+$/, ''); // Blender suffixes renamed duplicates: 'tower.001' is the tower
    const h = { ...h0, ...fix[id] };
    const hit = add(root, new Mesh(box(h.size[0], h.size[1], h.size[2]), m({ color: [0, 0, 0], opacity: 0.01, transparent: true, depthWrite: false })), [h.pos[0], 1.16 + h.pos[1], h.pos[2]]); hit.castShadow = false;
    if (def.hotspots[id]) hs[id] = { mesh: hit, anchor: h.pin ? [h.pin[0], 1.16 + h.pin[1], h.pin[2]] : [h.pos[0], 1.16 + h.pos[1] + h.size[1] / 2 + 0.2, h.pos[2]], center: [h.pos[0], 1.16 + h.pos[1], h.pos[2]], size: h.size, cam: h.cam };
  }
  const lights = (json.lights || []).map((l) => ({ id: l.id, position: [O[0] + l.pos[0], 1.16 + l.pos[1], O[2] + l.pos[2]], color: color(l.hex), intensity: l.intensity, distance: l.distance, base: l.intensity }));
  // the world wakes as the visitor approaches: windows and lamps are asleep until the camera is near them
  const keys = [...new Set(meshes.map((me) => grp(me.name) + '|' + me.material.name))]; // buildAsset makes one material per group and name, in first-seen order
  const emissives = a.materials.map((mt, i) => { const k = keys[i] || '|', c = k.indexOf('|'); return { mat: mt, base: mt.emissiveIntensity, name: k.slice(c + 1), glow: parts.find((p) => 'live:' + p.id === k.slice(0, c))?.glow }; }).filter((e) => e.base > 0);
  const state = { wake: 0.3, target: 1 };
  // never quite still: lamps breathe, embers and fires flicker, each light on its own phase
  const live = (name, t, k) => /Ember|fire/i.test(name) ? 1 + 0.07 * Math.sin(t * 11 + k) * Math.sin(t * 6.3 + k * 2) + 0.04 * Math.sin(t * 2.1 + k) : /Lamp|lamp|cafe|kiosk/.test(name) ? 1 + 0.035 * Math.sin(t * 1.3 + k * 1.7) : 1 + 0.02 * Math.sin(t * 0.7 + k * 2.3);
  const update = (dt, time, cam) => {
    state.wake += (state.target - state.wake) * (1 - Math.exp(-2.2 * dt));
    const still = MOTION.reduced; // reduced motion: the live parts hang at rest and their lights keep the common breath
    for (const s of sways) if (still) s.node.rotation.fill(0); else s.sway(time, s.node.rotation);
    emissives.forEach((e, i) => { e.mat.emissiveIntensity = e.base * (0.12 + 0.88 * state.wake) * (e.glow && !still ? e.glow(time) : live(e.name, time, i)); });
    if (cam) lights.forEach((l, i) => { const d = Math.hypot(cam[0] - l.position[0], cam[1] - l.position[1], cam[2] - l.position[2]); const prox = Math.max(0, Math.min(1, 1 - (d - 8) / 26)); l.intensity = l.base * state.wake * (0.45 + 0.55 * prox) * live(l.id, time, i + 3); });
  };
  return { hs, lights, update, wake: state };
}
const BUILDERS = { studio: buildStudio, store: buildStore, lab: buildLab, asset: buildAssetWorld };

export function buildDiorama(project, origin = DIORAMA_ORIGIN) {
  O = origin;
  const def = DIORAMAS[project.key];
  const root = new Node('diorama:' + project.key); root.position = [...O]; root.visible = false;
  const { hs, lights, update, wake, picks = [] } = BUILDERS[def.kind](root, project, def);
  if (DISTRICTS[def.kind]) DISTRICTS[def.kind](root, hs, lights, false);
  const pinMat = m({ color: [1, 1, 1], emissive: color(T.amber), emissiveIntensity: 0.9, unlit: true });
  const ringMat = m({ ...MAT.bronze });
  const hotspots = Object.entries(hs).map(([id, h]) => {
    h.mesh.pickable = true; h.mesh.userData = { ...(h.mesh.userData || {}), hotspot: id, interactive: true, glow: 0, targetGlow: 0 };
    // a small brass pin marks every place that can be inspected, the only signage the districts need
    const pin = new Node('pin:' + id); pin.position = [h.anchor[0], h.anchor[1] + 0.25, h.anchor[2]]; root.add(pin);
    const pinBody = new Node('pin-body'); pin.add(pinBody); // turns to face the camera and keeps a steady size on screen
    const ring = add(pinBody, new Mesh(torus(0.22, 0.035, 20, 8), ringMat), [0, 0, 0], [Math.PI / 2, 0, 0]); ring.castShadow = false;
    const dot = add(pinBody, new Mesh(sphere(0.09, 10, 8), pinMat), [0, 0, 0]); dot.castShadow = false;
    const halo = add(pinBody, new Mesh(torus(0.22, 0.018, 28, 6), m({ color: [1, 1, 1], emissive: color(T.amber), emissiveIntensity: 1, unlit: true, opacity: 0, transparent: true, depthWrite: false })), [0, 0, -0.01], [Math.PI / 2, 0, 0]); halo.castShadow = false; halo.renderOrder = 12;
    h.mesh.userData.pin = pin; h.mesh.userData.pinDot = dot;
    const c = h.center || [h.anchor[0], h.anchor[1] - 1, h.anchor[2]];
    return { id, mesh: h.mesh, pin, pinBody, halo, anchor: [O[0] + h.anchor[0], h.anchor[1], O[2] + h.anchor[2]], center: [O[0] + c[0], c[1], O[2] + c[2]], size: h.size || [2, 2, 2], cam: h.cam, ...def.hotspots[id] };
  });
  const view = { position: [O[0] + 10.5, 22.8, 36.5], target: [O[0] - 1, 1.5, -3] };
  const d = {
    root, project, def, hotspots, picks, lights, wake: wake || { wake: 1, target: 1 }, origin: [...O], introAt: -1, outroAt: -1,
    // `camera` is the pose that lines up with the miniature on the key (the swap happens there); `view` is where the visitor settles, a breath closer
    camera: { position: [O[0] + 12, 24, 40], target: [O[0] - 1, 1.5, -3] }, view,
    // inspecting: the subject fills the left of the frame, a little low to clear the HUD, and the panel takes the space to its right; where the panel
    // is docked as a sheet along the bottom, the subject is centred in the band between the HUD and the sheet. Distance follows the subject's size,
    // so a tower and a shop front both fit, and stays inside the orbit limits of 'project' mode (7 to 26) so handing over to the controls never jumps.
    // An indoor subject brings its own direction and a closer cap (h.cam, from HOTSPOT_FIX), kept inside the polar limit (20 to 80 degrees) too.
    hotspotCamera: (h, cam) => {
      const asp = cam?.aspect || 1.6, tv = Math.tan(((cam?.fov || 38) * Math.PI) / 360), th = tv * asp, wide = !docked(), hc = h.cam || {};
      const dir = V.norm(hc.dir || [0.5, 0.52, 0.9]), r = V.norm([dir[2], 0, -dir[0]]), u = V.cross(dir, r);
      const [sx, sy, sz] = h.size, ext = Math.abs(r[0]) * sx / 2 + Math.abs(r[2]) * sz / 2, vert = Math.abs(u[1]) * sy / 2 + (Math.abs(u[0]) * sx + Math.abs(u[2]) * sz) / 2;
      const D = Math.min(hc.max || 25, Math.max(9, vert / (tv * (wide ? 0.55 : 0.5)), ext / (th * (wide ? 0.4 : 0.8))));
      const target = V.add(h.center, wide ? V.add(V.scale(r, 0.3 * D * th), V.scale(u, 0.06 * D * tv)) : V.scale(u, -0.05 * D * tv));
      const edge = Math.min(ext, (wide ? 0.4 : 0.8) * D * th); // a subject wider than the capped view hangs the panel off the planned edge, not off-screen
      return { position: V.add(target, V.scale(dir, D)), target, panel: V.add(h.center, V.add(V.scale(r, edge), V.scale(u, sy * 0.2))), right: r, up: u, dist: D };
    },
    // the name card sits bottom-left, clear of the corner buttons: the point on a plane just in front of the plinth that the settled view puts there
    // (docked layouts drop the card's offset and stack it above the buttons, as the stylesheet does)
    labelAnchor: (cam) => {
      const W = innerWidth, H = innerHeight, dock = docked(), tv = Math.tan((cam.fov * Math.PI) / 360);
      const nx = (2 * (dock ? 20 : 12)) / W - 1, ny = 1 - (2 * (H - (dock ? 180 : 145))) / H;
      const P = view.position, f = V.norm(V.add(view.target, V.scale(P, -1))), r = V.norm([-f[2], 0, f[0]]), u = V.cross(r, f);
      const kx = nx * tv * cam.aspect, ky = ny * tv, z = (d.origin[2] + 19.6 - P[2]) / (f[2] + kx * r[2] + ky * u[2]);
      return V.add(P, V.add(V.scale(f, z), V.add(V.scale(r, kx * z), V.scale(u, ky * z))));
    },
  };
  // pins: ease in one by one after an arrival (and out on leaving, since the miniature on the key has none), hold a steady size on screen,
  // face the camera, and send out a soft ring while hovered
  d.update = (dt, t, cam) => {
    update(dt, t, cam); if (!cam) return;
    const out = d.outroAt < 0 ? 1 : Math.max(0, 1 - (t - d.outroAt) / 0.35);
    hotspots.forEach((h, i) => {
      const p = h.pin.position, wx = cam[0] - d.origin[0] - p[0], wz = cam[2] - d.origin[2] - p[2], dist = Math.hypot(wx, cam[1] - p[1], wz);
      const e = d.introAt < 0 ? 1 : Math.max(0, Math.min(1, (t - d.introAt - i * 0.14) / 0.5)); const pop = e === 1 ? 1 : 1 + 2.2 * Math.pow(e - 1, 3) + 1.2 * Math.pow(e - 1, 2);
      const s = Math.max(0.55, Math.min(1.9, dist / 28)) * Math.max(0.001, pop * out * out); h.pinBody.scale = [s, s, s]; h.pinBody.rotation[1] = Math.atan2(wx, wz);
      const g = h.mesh.userData.glow || 0, ph = (t * 0.85 + i * 0.37) % 1; const k = 1 + ph * 1.5; h.halo.scale = [k, k, k]; h.halo.material.opacity = g * 0.55 * (1 - ph) * (1 - ph);
    });
  };
  return d;
}
// the layout that docks the spatial panel as a bottom sheet (mirrors the breakpoint in styles.css)
const docked = () => typeof matchMedia === 'function' && matchMedia('(max-width: 760px), (pointer: coarse) and (max-width: 1024px)').matches;
const V = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], scale: (a, k) => [a[0] * k, a[1] * k, a[2] * k], norm: (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]] };

/** A miniature of a project world for the keyboard (no floor, no shadows); the caller scales it. */
export function buildMiniWorld(project) {
  const def = DIORAMAS[project.key];
  const root = new Node('mini:' + project.key);
  O = [0, 0, 0]; root.__mini = true;
  const { hs, lights } = BUILDERS[def.kind](root, project, def, true);
  if (DISTRICTS[def.kind]) DISTRICTS[def.kind](root, hs, lights, true);
  root.traverse((n) => { if ('castShadow' in n) n.castShadow = false; });
  return root;
}
