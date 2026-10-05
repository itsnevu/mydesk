// The room around the desk: floor, walls, a window onto a real city at night, a bookshelf that holds the work, a desk chair,
// a floor lamp and a plant, and on the desk the machine and a pair of speakers.
// The renderer spends its four point lights on the desk, so the room is lit the old way: its light is painted into the
// surfaces (unlit, baked), and its lamps, screens and LEDs glow on their own.
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, sphere, cylinder, torus, merge } from 'engine/geometry';
import { drawTexture, MONO, SANS } from 'engine/textures';
import { M4, color } from 'engine/math';
import { C, MAT } from 'app/theme';
import { PROJECTS, projectIndex } from 'app/data';
import { buildChair } from 'app/chair';
import { buildCity } from 'app/city';
import { buildCables } from 'app/cables';
import { buildPC, pcPorts } from 'app/pc';
import { buildBike } from 'app/bike';
import { buildPlant } from 'app/plant';
import { buildSpeaker } from 'app/speakers';
import { buildFloorLamp } from 'app/floorlamp';
import { buildAircon } from 'app/aircon';
import { buildWallClock } from 'app/wallclock';
import { buildShoeRack } from 'app/shoerack';

// 1 unit ≈ 19 mm (a keycap). The desk top is y = 0, so the floor sits a desk-height below it.
const FLOOR = -40, TOP = 100, BACK = -30.6, FRONT = 130, LEFT = -120, RIGHT = 120;
const ROOM_W = RIGHT - LEFT, ROOM_D = FRONT - BACK, ROOM_H = TOP - FLOOR;
const WIN = { x0: -108, x1: -60, y0: 2, y1: 70 };          // the window, on the back wall left of the desk
const SHELF = { x0: 58, x1: 102, depth: 12, rows: [-34, -16, 2, 20, 38] };
export const PC_POS = [-38.5, 0, 7.5], PC_RY = 0.32; // front left of the desk, turned toward the chair
const SPEAKERS = [[-11.6, -12.8, 0.22], [11.6, -12.8, -0.22]];
// the road bike hangs on the front wall behind the chair, facing back across the room to the desk (app/bike: origin on the wall under the tyres)
const BIKE = [6, 10, FRONT];
// a wall clock on the front wall, right of the bike, over the shoe rack by the door: [x, y] of its centre
const CLOCK = [87, 52];
// three framed prints on the right wall over the side table, the flagship, the name, the client list, each one a way in (keyId = the target it opens)
const PRINTS = [{ key: 'godplan', id: 'signal', z: 4, w: 15, h: 20 }, { key: 'name', id: 'note', z: 36, w: 30, h: 20 }, { key: 'sites', id: 'market', z: 68, w: 15, h: 20 }];
const FRAME_Y = 30, MAT_W = 1.4, RIM = 1.6;
// above the prints, a walnut hanger of running medals; past them, toward the front of the room, a real interior door
// (2.05 × 0.84 m: 43 wide, 105 tall) in a walnut casing
const MEDALS = { zc: 36, y: 68, step: 9 };
const DOOR = { z0: 83.5, z1: 126.5, top: 65, casing: 2.8 };
// seven finisher medals, laid out symmetrically: the marathon in the middle, then the halves, the tens and the fives. Generic faces
// (a distance, FINISHER, a runner, a laurel), no race names
const MEDAL_SET = [
  { metal: 'bronze', dist: '5K', ribbon: ['#2a1c14', '#c96b2c'] }, { metal: 'silver', dist: '10K', ribbon: ['#14233d', '#e8e2d4'] },
  { metal: 'gold', dist: '21K', ribbon: ['#0f3b3a', '#e8d9b0'] }, { metal: 'gold', dist: '42K', ribbon: ['#5e1a1d', '#d9a05b'], r: 3.0 },
  { metal: 'gold', dist: '21K', ribbon: ['#121212', '#e0782c'] }, { metal: 'silver', dist: '10K', ribbon: ['#3d1530', '#d9a05b'] },
  { metal: 'bronze', dist: '5K', ribbon: ['#1f3a1e', '#d6b25e'] },
];
const METALS = { gold: ['#f6d68a', '#c9973f', '#7a5418'], silver: ['#f4f5f6', '#b9bec4', '#6a7077'], bronze: ['#efb07c', '#b06a36', '#5e3415'] };
const frameSize = (p) => [p.w + 2 * (MAT_W + RIM), p.h + 2 * (MAT_W + RIM)];

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// a single-sided quad facing +z with the canvas upright: walls are made of these so the room opens like a doll's house when the camera leaves it
function quad(w, h) {
  const x = w / 2, y = h / 2;
  return { positions: new Float32Array([-x, -y, 0, x, -y, 0, x, y, 0, -x, y, 0]), normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]), uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), indices: new Uint16Array([0, 1, 2, 0, 2, 3]), bounds: { min: [-x, -y, 0], max: [x, y, 0] } };
}

// a quad showing only the [u0..u1] × [v0..v1] part of its canvas
function quadUV(w, h, u0, v0, u1, v1) { const g = quad(w, h); g.uvs = new Float32Array([u0, v0, u1, v0, u1, v1, u0, v1]); return g; }

// static parts that share a material become one draw call
function batch() {
  const parts = new Map();
  return {
    put(geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
      const m = M4.compose(new Array(16), p, r, s);
      const n = [0, 1, 2].flatMap((j) => [0, 1, 2].map((i) => m[j * 4 + i] / (s[j] * s[j])));
      if (!parts.has(mat)) parts.set(mat, []);
      parts.get(mat).push({ geo, m, n });
    },
    build(parent, name, shadows = false) {
      for (const [mat, list] of parts) { const mesh = new Mesh(merge(list), mat, name); mesh.castShadow = shadows; parent.add(mesh); }
      parts.clear();
    },
  };
}

// ---------- painted textures
const softRect = (ctx, x, y, w, h, rgba, blur) => { ctx.save(); ctx.shadowColor = rgba; ctx.shadowBlur = blur; ctx.shadowOffsetX = 20000; ctx.fillStyle = '#000'; ctx.fillRect(x - 20000, y, w, h); ctx.restore(); };
const glow = (ctx, x, y, r, rgb, a, sy = 1) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, sy);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.45, `rgba(${rgb},${a * 0.45})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.restore();
};
function grain(ctx, w, h, r, n, alpha) { for (let i = 0; i < n; i++) { const v = r() < 0.5 ? 0 : 255; ctx.fillStyle = `rgba(${v},${v},${v},${r() * alpha})`; ctx.fillRect(r() * w, r() * h, 1.5, 1.5); } }

function woodTexture(seed, base = [64, 42, 24]) {
  const r = rng(seed);
  return drawTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = `rgb(${base})`; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) { const y = r() * h; ctx.strokeStyle = `rgba(${r() < 0.55 ? '22,12,6' : '128,90,54'},${0.07 + r() * 0.15})`; ctx.lineWidth = 0.6 + r() * 2.2; ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(w * 0.33, y + (r() - 0.5) * 10, w * 0.66, y + (r() - 0.5) * 10, w, y + (r() - 0.5) * 6); ctx.stroke(); }
  }, { repeat: true });
}

function floorTexture() {
  const r = rng(11);
  return drawTexture(1536, 1024, (ctx, w, h) => {
    const X = (x) => ((x - LEFT) / ROOM_W) * w, Z = (z) => ((z - BACK) / ROOM_D) * h, U = (u) => (u / ROOM_W) * w;
    // oak boards running left to right, staggered joints, no two boards quite the same
    const rows = 28, ph = h / rows;
    for (let i = 0; i < rows; i++) {
      let x = -r() * 300;
      while (x < w) {
        const len = 200 + r() * 280, t = 0.82 + r() * 0.36;
        ctx.fillStyle = `rgb(${Math.round(84 * t)},${Math.round(57 * t)},${Math.round(36 * t)})`; ctx.fillRect(x, i * ph, len, ph);
        for (let g = 0; g < 6; g++) { const y = i * ph + r() * ph; ctx.strokeStyle = `rgba(${r() < 0.5 ? '20,11,5' : '120,84,52'},${0.1 + r() * 0.16})`; ctx.lineWidth = 0.6 + r() * 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y + (r() - 0.5) * 3); ctx.stroke(); }
        ctx.fillStyle = 'rgba(10,6,3,0.9)'; ctx.fillRect(x + len - 1.5, i * ph, 1.5, ph);
        x += len;
      }
      ctx.fillStyle = 'rgba(10,6,3,0.9)'; ctx.fillRect(0, i * ph, w, 1.6);
    }
    grain(ctx, w, h, r, 9000, 0.06);
    // the light: the room is dim; the desk throws a shadow, the lamp and the window leave pools
    const dark = ctx.createRadialGradient(X(0), Z(40), U(30), X(0), Z(40), w * 0.7); dark.addColorStop(0, 'rgba(0,0,0,0.03)'); dark.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = dark; ctx.fillRect(0, 0, w, h);
    softRect(ctx, X(-50), Z(-28), U(100), U(66), 'rgba(0,0,0,0.45)', 70);
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, X(0), Z(52), U(62), '255,168,92', 0.22, 0.7);
    // the hallway's light, spilling under the door onto the boards
    glow(ctx, X(RIGHT - 3), Z((DOOR.z0 + DOOR.z1) / 2), U(3.4), '255,200,140', 0.3, 6.5);
    // a faint pool under every ceiling downlight
    for (const [x, z] of DOWNLIGHTS) glow(ctx, X(x), Z(z), U(16), '255,214,170', 0.06);
    glow(ctx, X(-84), Z(-4), U(34), '214,200,184', 0.14, 1.5);
  });
}

// plaster with a dark walnut wainscot below the rail; `paint(ctx, w, h, X, Y)` adds the wall's own light
function wallTexture(seed, widthUnits, paint) {
  const r = rng(seed);
  const W = 1536, H = Math.round((W * ROOM_H) / widthUnits);
  return drawTexture(W, H, (ctx, w, h) => {
    const X = (u) => (u / widthUnits) * w, Y = (y) => ((TOP - y) / ROOM_H) * h;
    // dark grey plaster, with a little unevenness so it reads as a painted wall rather than a flat fill
    ctx.fillStyle = '#4b4b4d'; ctx.fillRect(0, 0, w, h);
    grain(ctx, w, h, r, 14000, 0.06);
    for (let i = 0; i < 40; i++) glow(ctx, r() * w, r() * h, 60 + r() * 140, r() < 0.5 ? '0,0,0' : '112,112,116', 0.1);
    // wainscot: walnut panels from the floor up to a bronze rail
    const railY = Y(-6);
    ctx.fillStyle = '#2e1e12'; ctx.fillRect(0, railY, w, h - railY);
    const panel = X(26);
    for (let x = X(4); x < w; x += panel) { ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 3; ctx.strokeRect(x, railY + 14, panel - X(4), h - railY - 34); ctx.strokeStyle = 'rgba(120,84,50,0.18)'; ctx.lineWidth = 1.2; ctx.strokeRect(x + 3, railY + 17, panel - X(4) - 6, h - railY - 40); }
    ctx.fillStyle = '#8f6638'; ctx.fillRect(0, railY - 5, w, 5); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, railY, w, 4);
    // the room is darker towards the ceiling and into the corners
    const v = ctx.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0.36)'); v.addColorStop(0.55, 'rgba(0,0,0,0.05)'); v.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    const s = ctx.createLinearGradient(0, 0, w, 0); s.addColorStop(0, 'rgba(0,0,0,0.16)'); s.addColorStop(0.18, 'rgba(0,0,0,0)'); s.addColorStop(0.82, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = s; ctx.fillRect(0, 0, w, h);
    // the cornice's soft shadow on the plaster just under it
    const c = ctx.createLinearGradient(0, Y(TOP - 2.6), 0, Y(TOP - 9)); c.addColorStop(0, 'rgba(0,0,0,0.42)'); c.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = c; ctx.fillRect(0, Y(TOP - 2.6), w, Y(TOP - 9) - Y(TOP - 2.6));
    ctx.globalCompositeOperation = 'lighter';
    paint(ctx, w, h, X, Y);
  });
}

// ---------- the curtains: pleated panels hung from rings on the rod. The folds are real geometry, and the fold shading painted
// into the cloth lines up with them (crests catch the room's light, troughs fall dark). A cursor passing over a curtain kicks a
// damped swing into it, strongest at the hem, with a ripple that runs across the folds; at rest it hangs still.
const FOLDS = 5.5;
function curtainTexture(windowSide) {
  const r = rng(windowSide > 0 ? 21 : 22);
  return drawTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#5c3824'; ctx.fillRect(0, 0, w, h);
    // the weave: fine warp threads and a slub here and there
    for (let x = 0; x < w; x += 2) { ctx.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '120,80,52'},${0.04 + r() * 0.06})`; ctx.fillRect(x, 0, 1, h); }
    for (let i = 0; i < 70; i++) { ctx.fillStyle = `rgba(150,104,70,${0.05 + r() * 0.08})`; ctx.fillRect(r() * w, r() * h, 1, 6 + r() * 30); }
    for (let x = 0; x < w; x++) { const f = Math.cos((x / w) * Math.PI * 2 * FOLDS) * 0.5 + 0.5; ctx.fillStyle = `rgba(0,0,0,${0.55 - f * 0.47})`; ctx.fillRect(x, 0, 1, h); }
    const side = ctx.createLinearGradient(0, 0, w, 0); const lit = 'rgba(255,214,170,0.22)', none = 'rgba(255,214,170,0)';
    side.addColorStop(0, windowSide < 0 ? lit : none); side.addColorStop(1, windowSide > 0 ? lit : none);
    ctx.fillStyle = side; ctx.fillRect(0, 0, w, h);
    const v = ctx.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0.6)'); v.addColorStop(0.6, 'rgba(0,0,0,0.1)'); v.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    // a hem at the bottom and a header tape at the top
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, h - 10, w, 2); ctx.fillRect(0, 14, w, 2);
  });
}

/**
 * One curtain hanging from rings on the rod at (rodY, z0), down to yBot. Its outer edge stays at `fixed`; its leading edge
 * runs from `open` (gathered at the side of the window) to `closed` (meeting the other curtain in the middle), and the folds
 * flatten as the cloth spreads. side +1 when the window is to its right. [xMin, xMax] is as far as the cloth may swing (a wall,
 * the desk's end): it presses flat against that instead of passing through. The rings slide along the rod with it.
 */
function buildCurtain({ fixed, open, closed, rodY, yBot, z0, side, mat, ringMat, xMin = -Infinity, xMax = Infinity }) {
  const NU = Math.round(FOLDS * 12) + 1, NV = 32, yTop = rodY - 1.1, H = yTop - yBot, A0 = 0.6, W0 = Math.abs(open - fixed);
  const n = NU * NV, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [];
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const k = j * NU + i; uv[k * 2] = i / (NU - 1); uv[k * 2 + 1] = 1 - j / (NV - 1); }
  // two triangles per cell, wound to face +z (the room)
  for (let j = 0; j < NV - 1; j++) for (let i = 0; i < NU - 1; i++) { const a = j * NU + i, b = a + 1, c = a + NU, d = c + 1; idx.push(a, c, d, a, d, b); }
  const geo = { positions: pos, normals: nor, uvs: uv, indices: new Uint16Array(idx), dynamic: true, bounds: { min: [0, yBot, 0], max: [0, yTop, 0] } };
  const phase = side > 0 ? 0 : 1.7;
  // the rings: one torus per fold that comes toward the room, its hole along the rod; they only ever slide, so the normals never change
  const tor = torus(0.85, 0.12, 14, 6), tn = tor.positions.length / 3, nR = Math.floor(FOLDS) + 1;
  const rPos = new Float32Array(tn * 3 * nR), rNor = new Float32Array(tn * 3 * nR), rUv = new Float32Array(tn * 2 * nR), rIdx = new Uint16Array(tor.indices.length * nR);
  for (let k = 0; k < nR; k++) {
    for (let v = 0; v < tn; v++) { const o = (k * tn + v) * 3; rNor[o] = -tor.normals[v * 3 + 1]; rNor[o + 1] = tor.normals[v * 3]; rNor[o + 2] = tor.normals[v * 3 + 2]; rUv[(k * tn + v) * 2] = tor.uvs[v * 2]; rUv[(k * tn + v) * 2 + 1] = tor.uvs[v * 2 + 1]; }
    for (let q = 0; q < tor.indices.length; q++) rIdx[k * tor.indices.length + q] = tor.indices[q] + k * tn;
  }
  const ringGeo = { positions: rPos, normals: rNor, uvs: rUv, indices: rIdx, dynamic: true, bounds: { min: [0, 0, 0], max: [0, 0, 0] } };
  let x0 = 0, x1 = 0;
  // place every vertex for energy e at time t, then the normals from the grid's neighbours
  const shape = (e, t) => {
    const W = x1 - x0, xc = (x0 + x1) / 2, A = A0 * Math.pow(W0 / W, 0.8);
    for (let j = 0; j < NV; j++) {
      const h = j / (NV - 1), hs = Math.pow(h, 1.6), y = yTop - h * H;
      const swing = e * 2.2 * hs * Math.sin(2.3 * t + phase);
      for (let i = 0; i < NU; i++) {
        const u = i / (NU - 1), k = (j * NU + i) * 3, fold = Math.cos(Math.PI * 2 * FOLDS * u);
        const breathe = 1 + e * 0.35 * h * Math.sin(2.8 * t + 3 * u);
        const ripple = e * 2.0 * Math.pow(h, 1.25) * (0.5 + 0.5 * Math.sin(3.4 * t - Math.PI * 2 * (1.4 * u + 0.9 * h) + phase));
        pos[k] = Math.min(xMax, Math.max(xMin, xc + (u - 0.5) * W * (1 + 0.05 * h) + swing));
        pos[k + 1] = y;
        pos[k + 2] = z0 + A * (1 + 0.3 * h) * fold * breathe + ripple;
      }
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
      const p = (ii, jj) => (Math.min(NV - 1, Math.max(0, jj)) * NU + Math.min(NU - 1, Math.max(0, ii))) * 3;
      const a = p(i + 1, j), b = p(i - 1, j), c = p(i, j + 1), d = p(i, j - 1);
      const du = [pos[a] - pos[b], pos[a + 1] - pos[b + 1], pos[a + 2] - pos[b + 2]], dv = [pos[c] - pos[d], pos[c + 1] - pos[d + 1], pos[c + 2] - pos[d + 2]];
      // normal = dv × du: down the cloth crossed with across it faces the room
      const nx = dv[1] * du[2] - dv[2] * du[1], ny = dv[2] * du[0] - dv[0] * du[2], nz = dv[0] * du[1] - dv[1] * du[0], l = Math.hypot(nx, ny, nz) || 1, k = (j * NU + i) * 3;
      nor[k] = nx / l; nor[k + 1] = ny / l; nor[k + 2] = nz / l;
    }
    // what it covers now, for picking (a closed curtain is clicked anywhere across the window, an open one only at its stack):
    // the cloth's own reach (its hem flares 2.5% wider, a swing carries it 2.2·e sideways, the folds and ripple 1.3·A and 2·e out),
    // so at rest the box hugs it and a view from the side doesn't find the curtain over the glass beside it
    const mx = 0.3 + 0.025 * W + 2.2 * e, mz = A * (1.3 + 0.46 * e);
    geo.bounds.min[0] = Math.max(xMin, x0 - mx); geo.bounds.max[0] = Math.min(xMax, x1 + mx); geo.bounds.min[2] = z0 - mz - 0.1; geo.bounds.max[2] = z0 + mz + 2.0 * e + 0.1;
    geo.needsUpdate = true;
    // the rings ride on the fold crests
    for (let k = 0; k < nR; k++) { const rx = x0 + (k / FOLDS) * W; for (let v = 0; v < tn; v++) { const o = (k * tn + v) * 3; rPos[o] = rx - tor.positions[v * 3 + 1]; rPos[o + 1] = rodY + tor.positions[v * 3]; rPos[o + 2] = z0 + tor.positions[v * 3 + 2]; } }
    ringGeo.bounds = { min: [x0 - 1, rodY - 1, z0 - 1], max: [x1 + 1, rodY + 1, z0 + 1] }; ringGeo.needsUpdate = true;
  };
  const mesh = new Mesh(geo, mat, 'curtain'); mesh.castShadow = false; mesh.pickable = true;
  mesh.userData = { keyId: 'curtains', curtain: true, interactive: true, glow: 0, targetGlow: 0 };
  const ringMesh = new Mesh(ringGeo, ringMat, 'curtain-rings'); ringMesh.castShadow = false;
  // p: 0 open … 1 drawn, eased toward the target; drawing it kicks the cloth into a swing, as a pull would
  let p = 0, target = 0, energy = 0, was = false, rest = false, brushed = 0;
  // (the mesh is built in world space, so it says where its hover tip goes: over the middle of the cloth, a hand below the rod)
  const tipAt = [0, yTop - 10, z0 + 1.5];
  const place = () => { const s = p * p * (3 - 2 * p), lead = open + (closed - open) * s; x0 = Math.min(fixed, lead); x1 = Math.max(fixed, lead); tipAt[0] = (x0 + x1) / 2; mesh.userData.tipAt = tipAt; };
  place(); shape(0, 0);
  const update = (dt, t) => {
    const hov = mesh.userData.targetGlow > 0.5, brush = mesh.userData.brush || 0;
    if (hov && !was) energy = Math.min(1.3, energy + 0.75);   // the cursor brushing into it
    if (brush !== brushed) { energy = Math.min(1.3, energy + 0.08 * Math.min(4, brush - brushed)); brushed = brush; }   // and moving across it
    was = hov;
    if (hov) energy = Math.max(energy, 0.35);
    const moving = p !== target;
    if (moving) { p += Math.sign(target - p) * Math.min(Math.abs(target - p), dt / 1.4); place(); energy = Math.max(energy, 0.45); }
    energy *= Math.exp(-0.65 * dt);
    // once it has settled it stays put, and nothing is recomputed or uploaded until the cursor or a pull comes back
    if (energy < 0.002 && !moving) { if (rest) return; energy = 0; rest = true; } else rest = false;
    shape(energy, t);
  };
  const draw = (v) => { target = v ? 1 : 0; rest = false; };
  return { mesh, ringMesh, update, draw, get drawn() { return target === 1; } };
}

function rugTexture() {
  const r = rng(5);
  // a hand-knotted wool rug in the room's colours: a madder field with a stepped medallion and corner spandrels, a navy main border
  // of small lozenges between cream and rust guard stripes; abrash (the dye lots' bands) runs across it, and the pile is soft
  return drawTexture(1024, 640, (ctx, w, h) => {
    const CREAM = '#cdb894', RUST = '#8a3d1f', NAVY = '#1f2638', MADDER = '#5b2416', DEEP = '#3a170e', OCHRE = '#a8743a';
    // a stepped (knotted) diamond: rows of knots, each row a step narrower than the one before it
    const stepD = (cx, cy, n, sx, sy, fill) => { ctx.fillStyle = fill; for (let k = -n; k <= n; k++) { const half = (n - Math.abs(k) + 0.5) * sx; ctx.fillRect(cx - half, cy + k * sy - sy / 2, half * 2, sy + 0.5); } };
    // the borders, outside in: cream guard, rust stripe, the navy main border with its lozenges, a cream guard, a thin rust line
    const B0 = 14, B1 = 24, B2 = 32, B3 = 78, B4 = 86, B5 = 92;
    ctx.fillStyle = CREAM; ctx.fillRect(0, 0, w, h); ctx.fillStyle = RUST; ctx.fillRect(B0, B0, w - 2 * B0, h - 2 * B0);
    ctx.fillStyle = NAVY; ctx.fillRect(B1, B1, w - 2 * B1, h - 2 * B1);
    ctx.fillStyle = CREAM; ctx.fillRect(B3, B3, w - 2 * B3, h - 2 * B3); ctx.fillStyle = RUST; ctx.fillRect(B4, B4, w - 2 * B4, h - 2 * B4);
    // the field, with its abrash: bands across it a shade lighter or darker, as each lot of wool was dyed
    ctx.fillStyle = MADDER; ctx.fillRect(B5, B5, w - 2 * B5, h - 2 * B5);
    for (let x = B5; x < w - B5;) { const bw = 24 + r() * 110; ctx.fillStyle = r() < 0.5 ? `rgba(130,56,28,${0.1 + r() * 0.2})` : `rgba(28,8,3,${0.08 + r() * 0.16})`; ctx.fillRect(x, B5, Math.min(bw, w - B5 - x), h - 2 * B5); x += bw; }
    // the main border's lozenges, cream round a rust heart, evenly spaced along each side (the corners get their own)
    const mid = (B2 + B3) / 2;
    for (let x = B3 + 18; x < w - B3 - 10; x += 44) for (const y of [mid, h - mid]) { stepD(x, y, 4, 4.4, 4.4, CREAM); stepD(x, y, 2, 4.4, 4.4, RUST); }
    for (let y = B3 + 18; y < h - B3 - 10; y += 44) for (const x of [mid, w - mid]) { stepD(x, y, 4, 4.4, 4.4, CREAM); stepD(x, y, 2, 4.4, 4.4, RUST); }
    for (const [x, y] of [[mid, mid], [w - mid, mid], [mid, h - mid], [w - mid, h - mid]]) { stepD(x, y, 4, 4.4, 4.4, OCHRE); stepD(x, y, 2, 4.4, 4.4, NAVY); }
    // the spandrels: a quarter of the medallion's outline tucked into every corner of the field
    for (const [cx, cy] of [[B5, B5], [w - B5, B5], [B5, h - B5], [w - B5, h - B5]]) {
      ctx.save(); ctx.beginPath(); ctx.rect(B5, B5, w - 2 * B5, h - 2 * B5); ctx.clip();
      stepD(cx, cy, 16, 6, 5, NAVY); stepD(cx, cy, 13, 6, 5, DEEP); stepD(cx, cy, 10, 6, 5, OCHRE); stepD(cx, cy, 8, 6, 5, NAVY);
      ctx.restore();
    }
    // the medallion: stepped diamonds nested in the middle, navy, ochre, cream, rust, a navy heart, with a pendant at each end
    const cx = w / 2, cy = h / 2;
    for (const s of [-1, 1]) { stepD(cx + s * 205, cy, 6, 5, 5, CREAM); stepD(cx + s * 205, cy, 4, 5, 5, NAVY); stepD(cx + s * 205, cy, 2, 5, 5, OCHRE); ctx.fillStyle = CREAM; ctx.fillRect(cx + s * 160 - (s > 0 ? 0 : 14), cy - 2, 14, 4); }
    stepD(cx, cy, 22, 7, 7.4, CREAM); stepD(cx, cy, 20, 7, 7.4, NAVY); stepD(cx, cy, 16, 7, 7.4, OCHRE); stepD(cx, cy, 14, 7, 7.4, MADDER);
    stepD(cx, cy, 10, 7, 7.4, CREAM); stepD(cx, cy, 8, 7, 7.4, RUST); stepD(cx, cy, 5, 7, 7.4, NAVY); stepD(cx, cy, 2, 7, 7.4, CREAM);
    // the field's small motifs, scattered on a loose grid round the medallion: little stepped stars in muted ochre and cream
    for (let y = B5 + 34; y < h - B5 - 20; y += 52) for (let x = B5 + 40; x < w - B5 - 20; x += 58) {
      const dx = Math.abs(x - cx) / 190, dy = Math.abs(y - cy) / 170; if (dx + dy < 1.25) continue;
      const corner = (Math.min(x - B5, w - B5 - x) / 96) + (Math.min(y - B5, h - B5 - y) / 80); if (corner < 1.0) continue;
      const k = r(); stepD(x + (r() - 0.5) * 6, y + (r() - 0.5) * 6, 2, 4, 4, k < 0.5 ? 'rgba(168,116,58,0.75)' : 'rgba(205,184,148,0.6)'); ctx.fillStyle = DEEP; ctx.fillRect(x - 2, y - 2, 4, 4);
    }
    // the pile: knots a hair uneven, a little sheen, and the wear where the chair rolls, toward the middle of the long side by the desk
    grain(ctx, w, h, r, 30000, 0.14);
    for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,230,200'},${r() * 0.05})`; ctx.fillRect(r() * w, r() * h, 1, 3); }
    const wear = ctx.createRadialGradient(cx + 40, h * 0.42, 10, cx + 40, h * 0.42, 220); wear.addColorStop(0, 'rgba(230,200,160,0.1)'); wear.addColorStop(1, 'rgba(230,200,160,0)');
    ctx.fillStyle = wear; ctx.fillRect(0, 0, w, h);
    // the desk's shadow falls across the far half; the front catches the lamp
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,0.38)'); g.addColorStop(0.62, 'rgba(0,0,0,0.28)'); g.addColorStop(0.72, 'rgba(0,0,0,0.03)'); g.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

// a book: the cover colour everywhere (the body samples the corner) and the spine, title, number, bronze bands, on its face
function spineTexture(p) {
  const base = `hsl(${p.hue + 4}, 38%, ${15 + (p.hue % 7)}%)`;
  return drawTexture(96, 512, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    const shade = ctx.createLinearGradient(0, 0, w, 0); shade.addColorStop(0, 'rgba(0,0,0,0.35)'); shade.addColorStop(0.3, 'rgba(255,255,255,0.06)'); shade.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = shade; ctx.fillRect(8, 0, w - 8, h);
    ctx.fillStyle = 'rgba(214,170,100,0.85)'; ctx.fillRect(14, 30, w - 22, 4); ctx.fillRect(14, 40, w - 22, 2); ctx.fillRect(14, h - 70, w - 22, 2); ctx.fillRect(14, h - 62, w - 22, 4);
    ctx.save(); ctx.translate(w / 2 + 4, 58); ctx.rotate(Math.PI / 2);
    const title = p.title.toUpperCase(); let size = 34;
    do { ctx.font = `600 ${size}px ${SANS}`; } while (ctx.measureText(title).width > h - 150 && --size > 14);
    ctx.fillStyle = '#efe0c2'; ctx.textBaseline = 'middle'; ctx.fillText(title, 0, 0); ctx.restore();
    ctx.fillStyle = 'rgba(239,224,194,0.75)'; ctx.font = `500 22px ${MONO}`; ctx.textAlign = 'center'; ctx.fillText(projectIndex(p), w / 2 + 4, h - 26);
  });
}

// the ceiling's recessed downlights (x, z): two rows of three, over the desk and over the middle of the room
const DOWNLIGHTS = [[-60, 20], [0, 20], [60, 20], [-60, 85], [0, 85], [60, 85]];
// the ceiling seen from below: dark plaster, a soft halo round every downlight, a little of the desk's warmth, darker toward the walls
function ceilingTexture() {
  const r = rng(81);
  return drawTexture(1536, 1024, (ctx, w, h) => {
    const X = (x) => ((x - LEFT) / ROOM_W) * w, Z = (z) => ((FRONT - z) / ROOM_D) * h, U = (u) => (u / ROOM_W) * w;
    ctx.fillStyle = '#4e4e50'; ctx.fillRect(0, 0, w, h);
    grain(ctx, w, h, r, 9000, 0.05);
    const v = ctx.createRadialGradient(w / 2, h / 2, w * 0.12, w / 2, h / 2, w * 0.62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, z] of DOWNLIGHTS) glow(ctx, X(x), Z(z), U(10), '255,214,170', 0.2);
    glow(ctx, X(0), Z(0), U(60), '255,170,96', 0.08, 0.7);
  });
}

// ---------- the hallway behind the door, seen only through it: oak boards, warm plaster, one flush light in its ceiling
// (deep enough that the door, swung out to its stop, never reaches the far wall)
const HALL = { x0: RIGHT, x1: RIGHT + 46, z0: DOOR.z0 - 22, z1: DOOR.z1 + 16, top: DOOR.top + 9 };
const DOOR_SWING = 1.15;   // radians the door opens out (about 66°)
function hallFloorTexture() {
  const r = rng(101);
  return drawTexture(512, 1024, (ctx, w, h) => {
    const rows = 9, pw = w / rows;
    for (let i = 0; i < rows; i++) { let y = -r() * 200; while (y < h) { const len = 120 + r() * 160, t = 0.85 + r() * 0.3; ctx.fillStyle = `rgb(${Math.round(96 * t)},${Math.round(66 * t)},${Math.round(42 * t)})`; ctx.fillRect(i * pw, y, pw, len); ctx.fillStyle = 'rgba(10,6,3,0.85)'; ctx.fillRect(i * pw, y + len - 1.5, pw, 1.5); y += len; } ctx.fillStyle = 'rgba(10,6,3,0.9)'; ctx.fillRect(i * pw, 0, 1.6, h); }
    grain(ctx, w, h, r, 4000, 0.06);
    // a wool runner down the middle: a madder field in a navy border with a thin gold line, a row of lozenges, fringed ends,
    // its soft shadow on the boards along one side
    const rx = w * 0.17, rw = w * 0.66, ry = h * 0.1, rh = h * 0.8;
    ctx.fillStyle = 'rgba(8,4,2,0.45)'; ctx.fillRect(rx + 4, ry + 3, rw, rh);
    ctx.fillStyle = '#6a2820'; ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = '#1e2638'; ctx.lineWidth = 22; ctx.strokeRect(rx + 11, ry + 11, rw - 22, rh - 22);
    ctx.strokeStyle = '#b88f55'; ctx.lineWidth = 3; ctx.strokeRect(rx + 28, ry + 28, rw - 56, rh - 56);
    for (let i = 0; i < 5; i++) {
      const cx = rx + rw / 2, cy = ry + rh * (0.14 + i * 0.18), a = rw * 0.22, bh = rh * 0.07;
      ctx.fillStyle = i % 2 ? '#1e2638' : '#b88f55'; ctx.beginPath(); ctx.moveTo(cx, cy - bh); ctx.lineTo(cx + a, cy); ctx.lineTo(cx, cy + bh); ctx.lineTo(cx - a, cy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6a2820'; ctx.beginPath(); ctx.moveTo(cx, cy - bh * 0.45); ctx.lineTo(cx + a * 0.45, cy); ctx.lineTo(cx, cy + bh * 0.45); ctx.lineTo(cx - a * 0.45, cy); ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < 2600; i++) { const x = rx + r() * rw, y = ry + r() * rh; ctx.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,220,180,0.06)'; ctx.fillRect(x, y, 1.5, 1.5); }
    ctx.strokeStyle = 'rgba(226,212,184,0.85)'; ctx.lineWidth = 1.2;
    for (const [y0, dy] of [[ry, -1], [ry + rh, 1]]) for (let x = rx + 4; x < rx + rw - 2; x += 4.5) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + (r() - 0.5) * 2, y0 + dy * (10 + r() * 4)); ctx.stroke(); }
    // the light pool under the hallway lamp
    ctx.globalCompositeOperation = 'lighter'; glow(ctx, w * 0.5, h * 0.5, w * 0.9, '255,196,128', 0.32, 1.6);
  });
}
function hallWallTexture(art) {
  const r = rng(art ? 103 : 104);
  // (the far wall's canvas is shaped like the wall, so the print on it isn't stretched)
  return drawTexture(512, art ? 720 : 512, (ctx, w, h) => {
    ctx.fillStyle = '#6a5f54'; ctx.fillRect(0, 0, w, h); grain(ctx, w, h, r, 6000, 0.05);
    const v = ctx.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(255,214,170,0.28)'); v.addColorStop(0.55, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2e1e12'; ctx.fillRect(0, h * 0.82, w, h * 0.18); ctx.fillStyle = '#8f6638'; ctx.fillRect(0, h * 0.82, w, 4);
    if (art) {
      // a framed abstract print on the far wall, lit from above: warm arcs on cream, in a thin black frame
      // centred on the door's line of sight (the opening's middle, 0.54 of the way along this wall)
      const fw = w * 0.34, fh = h * 0.3, fx = w * 0.537 - fw / 2, fy = h * 0.22;
      ctx.fillStyle = '#141210'; ctx.fillRect(fx - 8, fy - 8, fw + 16, fh + 16); ctx.fillStyle = '#e4d8c0'; ctx.fillRect(fx, fy, fw, fh);
      for (let i = 0; i < 5; i++) { ctx.strokeStyle = ['#b85a2a', '#2c3e50', '#d9a05b', '#5a7a5a', '#7a3a1c'][i]; ctx.lineWidth = 8 + i * 3; ctx.beginPath(); ctx.arc(fx + fw * (0.3 + i * 0.1), fy + fh * 0.9, fw * (0.18 + i * 0.07), Math.PI, Math.PI * 1.9); ctx.stroke(); }
    }
  });
}

// the back of the bookshelf: walnut with long vertical grain, each compartment washed by the LED strip under the shelf above it
function shelfBackTexture() {
  const r = rng(61), top = SHELF.rows.at(-1), H = top - FLOOR;
  return drawTexture(512, 1024, (ctx, w, h) => {
    const Y = (y) => ((top - y) / H) * h;
    ctx.fillStyle = '#24170d'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { const x = r() * w; ctx.strokeStyle = `rgba(${r() < 0.5 ? '10,6,3' : '90,62,38'},${0.08 + r() * 0.14})`; ctx.lineWidth = 0.6 + r() * 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + (r() - 0.5) * 12, h * 0.33, x + (r() - 0.5) * 12, h * 0.66, x + (r() - 0.5) * 8, h); ctx.stroke(); }
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 1; k < SHELF.rows.length; k++) {
      const y0 = SHELF.rows[k] - 1.2, y1 = SHELF.rows[k - 1];
      const g = ctx.createLinearGradient(0, Y(y0), 0, Y(y1)); g.addColorStop(0, 'rgba(255,196,128,0.55)'); g.addColorStop(0.3, 'rgba(255,180,110,0.24)'); g.addColorStop(1, 'rgba(255,170,100,0.05)');
      ctx.fillStyle = g; ctx.fillRect(0, Y(y0), w, Y(y1) - Y(y0));
      // the strip's hot line right under the shelf
      ctx.fillStyle = 'rgba(255,214,170,0.35)'; ctx.fillRect(0, Y(y0), w, 3);
    }
  });
}
// the little print that leans in the shelf: a cream mat round a dusk landscape, sun low over layered hills, a lake below
function shelfPrintTexture() {
  return drawTexture(256, 340, (ctx, w, h) => {
    ctx.fillStyle = '#e6dcc8'; ctx.fillRect(0, 0, w, h);
    const m = 26, iw = w - 2 * m, ih = h - 2 * m - 10, H = (f) => m + ih * f;
    ctx.save(); ctx.beginPath(); ctx.rect(m, m, iw, ih); ctx.clip();
    const sky = ctx.createLinearGradient(0, m, 0, H(0.62)); sky.addColorStop(0, '#2b3550'); sky.addColorStop(0.55, '#b5674a'); sky.addColorStop(1, '#e9b27a');
    ctx.fillStyle = sky; ctx.fillRect(m, m, iw, ih);
    ctx.fillStyle = '#f6d9a8'; ctx.beginPath(); ctx.arc(m + iw * 0.62, H(0.5), iw * 0.11, 0, Math.PI * 2); ctx.fill();
    for (const [f, c, a] of [[0.48, '#7a4a3c', 0.9], [0.55, '#4f3330', 0.7], [0.6, '#2c2026', 0.5]]) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(m, H(f + 0.1));
      for (let x = 0; x <= iw; x += 8) ctx.lineTo(m + x, H(f) + Math.sin(x * 0.03 * a + f * 20) * ih * 0.035 + Math.sin(x * 0.011 + f * 9) * ih * 0.05);
      ctx.lineTo(m + iw, H(1)); ctx.lineTo(m, H(1)); ctx.closePath(); ctx.fill();
    }
    const lake = ctx.createLinearGradient(0, H(0.72), 0, H(1)); lake.addColorStop(0, '#d79a68'); lake.addColorStop(1, '#3a3442');
    ctx.fillStyle = lake; ctx.fillRect(m, H(0.72), iw, ih * 0.28);
    ctx.fillStyle = 'rgba(255,236,200,0.5)'; for (let i = 0; i < 7; i++) ctx.fillRect(m + iw * 0.62 - 14 + i * 2, H(0.75) + i * 7, 28 - i * 4, 2);
    ctx.restore();
    ctx.strokeStyle = 'rgba(60,40,24,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(m - 0.5, m - 0.5, iw + 1, ih + 1);
  });
}
// a rattan weave: rows of flat cane over and under vertical stakes, a little uneven
function rattanTexture() {
  const r = rng(83);
  return drawTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8a6438'; ctx.fillRect(0, 0, w, h);
    const rows = 22, cols = 16, rh = h / rows, cw = w / cols;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const over = (i + j) % 2 === 0, t = 0.85 + r() * 0.3, x = i * cw, y = j * rh;
      const g = ctx.createLinearGradient(0, y, 0, y + rh); g.addColorStop(0, `rgba(${Math.round(214 * t)},${Math.round(170 * t)},${Math.round(110 * t)},1)`); g.addColorStop(1, `rgba(${Math.round(150 * t)},${Math.round(108 * t)},${Math.round(62 * t)},1)`);
      ctx.fillStyle = g; ctx.fillRect(x + (over ? 0 : 2), y + 1, cw - (over ? 0 : 4), rh - 2);
      if (!over) { ctx.fillStyle = 'rgba(60,38,18,0.55)'; ctx.fillRect(x + cw / 2 - 2, y, 4, rh); }
    }
    grain(ctx, w, h, r, 1500, 0.08);
  });
}
// a chunky knit in oatmeal wool: columns of V stitches with a cable down every fourth column
function knitTexture() {
  const r = rng(89);
  return drawTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8c7d66'; ctx.fillRect(0, 0, w, h);
    const cw = 16, rh = 12;
    for (let x = 0; x < w; x += cw) for (let y = 0; y < h; y += rh) {
      const cable = (x / cw) % 4 === 0;
      ctx.strokeStyle = `rgba(${cable ? '232,220,196' : '214,202,178'},${0.8 + r() * 0.2})`; ctx.lineWidth = cable ? 6 : 5;
      ctx.beginPath(); ctx.moveTo(x + 2, y + (cable ? 0 : 1)); ctx.lineTo(x + cw / 2, y + rh - 1); ctx.lineTo(x + cw - 2, y + (cable ? 0 : 1)); ctx.stroke();
      ctx.strokeStyle = 'rgba(70,60,44,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + cw / 2, y + rh - 1); ctx.lineTo(x + cw / 2, y + rh + 1); ctx.stroke();
    }
    grain(ctx, w, h, r, 1200, 0.07);
  });
}

// ---------- the medals: struck faces (one atlas cell each) and striped ribbons (one atlas column each)
function medalAtlas() {
  const S = 256;
  return drawTexture(S * MEDAL_SET.length, S, (ctx) => {
    MEDAL_SET.forEach((m, i) => {
      const [hi, mid, lo] = METALS[m.metal], cx = i * S + S / 2, cy = S / 2;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, S / 2 - 1, 0, Math.PI * 2); ctx.clip();
      // the metal, lit from the upper left
      const g = ctx.createRadialGradient(cx - 50, cy - 60, 8, cx, cy, 160); g.addColorStop(0, hi); g.addColorStop(0.55, mid); g.addColorStop(1, lo);
      ctx.fillStyle = g; ctx.fillRect(cx - S / 2, 0, S, S);
      // struck relief: every line is drawn dark down-right, light up-left, then in the metal itself
      const relief = (draw) => { for (const [dx, c] of [[1.6, 'rgba(0,0,0,0.5)'], [-1.1, 'rgba(255,255,255,0.4)'], [0, lo]]) { ctx.save(); ctx.translate(dx, dx); ctx.strokeStyle = c; ctx.fillStyle = c; draw(); ctx.restore(); } };
      relief(() => { ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, 114, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 98, 0, Math.PI * 2); ctx.stroke(); });
      // a laurel round the lower half
      relief(() => { ctx.lineWidth = 2; for (const s of [-1, 1]) for (let k = 0; k < 7; k++) { const a = Math.PI / 2 + s * (0.42 + k * 0.17); ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * 106, cy + Math.sin(a) * 106, 9, 3.6, a + s * 1.1, 0, Math.PI * 2); ctx.fill(); } });
      // FINISHER round the top
      relief(() => { ctx.font = `700 21px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const t = 'FINISHER'; for (let k = 0; k < t.length; k++) { const a = -Math.PI / 2 + (k - (t.length - 1) / 2) * 0.15; ctx.save(); ctx.translate(cx + Math.cos(a) * 106, cy + Math.sin(a) * 106); ctx.rotate(a + Math.PI / 2); ctx.fillText(t[k], 0, 0); ctx.restore(); } });
      // a runner mid-stride, and the distance under it
      relief(() => {
        ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.arc(cx + 8, cy - 58, 9, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx + 3, cy - 44); ctx.lineTo(cx - 6, cy - 14);                                     // body
        ctx.moveTo(cx + 1, cy - 38); ctx.lineTo(cx + 18, cy - 28); ctx.lineTo(cx + 28, cy - 40);                       // arm forward
        ctx.moveTo(cx + 1, cy - 38); ctx.lineTo(cx - 16, cy - 30); ctx.lineTo(cx - 24, cy - 18);                       // arm back
        ctx.moveTo(cx - 6, cy - 14); ctx.lineTo(cx + 12, cy - 2); ctx.lineTo(cx + 10, cy + 14);                        // leg forward
        ctx.moveTo(cx - 6, cy - 14); ctx.lineTo(cx - 18, cy + 2); ctx.lineTo(cx - 34, cy - 2);                         // leg back
        ctx.stroke();
        ctx.font = `800 ${m.dist.length > 2 ? 54 : 62}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(m.dist, cx, cy + 48);
      });
      ctx.restore();
    });
  });
}
function ribbonAtlas() {
  return drawTexture(64 * MEDAL_SET.length, 256, (ctx, w, h) => {
    MEDAL_SET.forEach((m, i) => {
      const x = i * 64, [base, stripe] = m.ribbon;
      ctx.fillStyle = base; ctx.fillRect(x, 0, 64, h);
      ctx.fillStyle = stripe; ctx.fillRect(x + 10, 0, 6, h); ctx.fillRect(x + 48, 0, 6, h);
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x + 28, 0, 8, h);
      for (let y = 0; y < h; y += 3) { ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(x, y, 64, 1); }
    });
  });
}
// a flat disc facing +z whose UVs cover one atlas cell [u0, u1] × [v0, v1]
function disc(r, seg, u0, v0, u1, v1) {
  const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2, pos = [0, 0, 0], nor = [0, 0, 1], uv = [uc, vc], idx = [];
  for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); pos.push(c * r, s * r, 0); nor.push(0, 0, 1); uv.push(uc + (c * (u1 - u0)) / 2, vc + (s * (v1 - v0)) / 2); if (i) idx.push(0, i, i + 1); }
  return { positions: new Float32Array(pos), normals: new Float32Array(nor), uvs: new Float32Array(uv), indices: new Uint16Array(idx), bounds: { min: [-r, -r, 0], max: [r, r, 0] } };
}
// a flat quad through four world points (bottom-left, bottom-right, top-right, top-left, seen from its front), UVs over one cell
function quad4(p, u0, v0, u1, v1) {
  const e1 = [0, 1, 2].map((k) => p[1][k] - p[0][k]), e2 = [0, 1, 2].map((k) => p[3][k] - p[0][k]);
  const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], l = Math.hypot(...n) || 1;
  const min = [0, 1, 2].map((k) => Math.min(...p.map((q) => q[k]))), max = [0, 1, 2].map((k) => Math.max(...p.map((q) => q[k])));
  return { positions: new Float32Array(p.flat()), normals: new Float32Array([0, 1, 2, 3].flatMap(() => n.map((v) => v / l))), uvs: new Float32Array([u0, v0, u1, v0, u1, v1, u0, v1]), indices: new Uint16Array([0, 1, 2, 0, 2, 3]), bounds: { min, max } };
}

function posterTexture(kind) {
  const r = rng(kind.length * 17);
  if (kind === 'name') return drawTexture(768, 512, (ctx, w, h) => {
    ctx.fillStyle = '#e2d3b6'; ctx.fillRect(0, 0, w, h); grain(ctx, w, h, r, 6000, 0.07);
    ctx.fillStyle = '#c4703a'; ctx.beginPath(); ctx.arc(w * 0.78, h * 0.34, 96, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(196,112,58,0.35)'; ctx.fillRect(w * 0.78 - 140, h * 0.34 + 104, 280, 6);
    ctx.fillStyle = '#1e140c'; ctx.font = `700 96px ${SANS}`; ctx.fillText('NAVY', 56, 168); ctx.fillText('GIBRAN', 56, 262);
    ctx.fillRect(58, 292, w - 116, 3);
    ctx.font = `600 24px ${MONO}`; ctx.fillStyle = 'rgba(30,20,12,0.85)'; ctx.fillText('FULL-STACK DEVELOPER', 58, 338);
    ctx.font = `400 19px ${MONO}`; ctx.fillStyle = 'rgba(30,20,12,0.62)'; ctx.fillText('INFORMATICS · UNIVERSITAS MULTIMEDIA NUSANTARA', 58, 378); ctx.fillText('ERP SYSTEMS · NEXT.JS + GO · WORDPRESS', 58, 408);
    ctx.font = `400 15px ${MONO}`; ctx.fillText('N.G. 2026', w - 158, h - 34);
  });
  if (kind === 'godplan') return drawTexture(480, 640, (ctx, w, h) => {
    ctx.fillStyle = '#15100c'; ctx.fillRect(0, 0, w, h); grain(ctx, w, h, r, 5000, 0.06);
    ctx.font = `700 66px ${SANS}`; ctx.fillStyle = '#efe0c2'; ctx.fillText('GODPLAN', 38, 104); ctx.fillStyle = '#d9a05b'; ctx.fillText('ERP', 38, 172);
    ctx.font = `400 18px ${MONO}`; ctx.fillStyle = 'rgba(239,224,194,0.7)'; ctx.fillText('one system, every department', 40, 212);
    // the dashboard as a diagram: four figures, the week, a ring
    ctx.strokeStyle = 'rgba(217,160,91,0.85)'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { ctx.strokeRect(40 + i * 102, 250, 90, 58); ctx.fillStyle = 'rgba(239,224,194,0.8)'; ctx.fillRect(52 + i * 102, 266, 34 + (i % 2) * 14, 6); ctx.fillStyle = 'rgba(217,160,91,0.9)'; ctx.fillRect(52 + i * 102, 284, 20 + i * 9, 12); }
    ctx.strokeRect(40, 330, 260, 150);
    for (let i = 0; i < 8; i++) { const bh = 30 + r() * 95; ctx.fillStyle = i === 5 ? '#d9a05b' : 'rgba(217,160,91,0.45)'; ctx.fillRect(58 + i * 30, 468 - bh, 18, bh); }
    ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(380, 405, 58, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(239,224,194,0.25)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(380, 405, 58, -Math.PI / 2, Math.PI * 1.1); ctx.strokeStyle = '#d9a05b'; ctx.stroke();
    ctx.font = `500 15px ${MONO}`; ctx.fillStyle = 'rgba(239,224,194,0.6)'; ctx.fillText('SINCE JULY 2025 · GO · NEXT.JS · POSTGRESQL', 40, 590);
  });
  const sites = PROJECTS.filter((p) => p.url).map((p) => p.title.replace(/^PT. /, ''));
  return drawTexture(480, 640, (ctx, w, h) => {
    ctx.fillStyle = '#1a120c'; ctx.fillRect(0, 0, w, h); grain(ctx, w, h, r, 5000, 0.06);
    ctx.font = `700 128px ${SANS}`; ctx.fillStyle = '#d9a05b'; ctx.fillText(String(sites.length), 34, 150);
    ctx.font = `600 34px ${SANS}`; ctx.fillStyle = '#efe0c2'; ctx.fillText('LIVE SITES', 40, 200);
    ctx.font = `400 18px ${MONO}`;
    sites.forEach((t, i) => { ctx.fillStyle = '#d9a05b'; ctx.fillRect(40, 246 + i * 27, 8, 8); ctx.fillStyle = 'rgba(239,224,194,0.82)'; ctx.fillText(t.toUpperCase(), 60, 255 + i * 27); });
  });
}

// ---------- the room (note: torus() lies flat in the XZ plane; a ring that faces you is rotated by x = π/2)
export function buildRoom(root) {
  const room = new Node('room'); root.add(room);
  const pickables = [], dimmers = [], books = [];
  // everything the room's light level scales, so it can wake with the desk at the intro
  const dim = (mat, key) => { dimmers.push([mat, key, [...mat[key]]]); return mat; };
  const baked = (tex) => dim(new Material({ color: [1, 1, 1], map: tex, unlit: true, receiveShadow: false }), 'color');
  // furniture away from the desk lamps gets a little painted-in ambience (its own colour, emissive) so it never falls to black
  const furn = (hex, o = {}) => { const c = o.color || color(hex); const k = o.amb ?? 0.6; return dim(new Material({ roughness: 0.75, metalness: 0, receiveShadow: false, ...o, color: c, emissive: c.map((v) => v * k), emissiveMap: o.map || null }), 'emissive'); };
  const add = (geo, mat, p, r = [0, 0, 0], name = '') => { const m = new Mesh(geo, mat, name); m.position = p; m.rotation = r; m.castShadow = false; room.add(m); return m; };

  // ---------- shell: floor, walls, rug, skirting
  const midZ = (BACK + FRONT) / 2, midY = (FLOOR + TOP) / 2;
  add(quad(ROOM_W, ROOM_D), baked(floorTexture()), [0, FLOOR, midZ], [-Math.PI / 2, 0, 0], 'floor');
  // the rug has a little pile: its face sits 0.35 up, on a bound edge (built with the rest of the room's batch below)
  const RUG = { w: 140, d: 86, z: 20, t: 0.35 };
  add(quad(RUG.w, RUG.d), baked(rugTexture()), [0, FLOOR + RUG.t, RUG.z], [-Math.PI / 2, 0, 0], 'rug');
  const backWall = baked(wallTexture(31, ROOM_W, (ctx, w, h, X, Y) => {
    const x = (v) => X(v - LEFT);
    glow(ctx, x(0), Y(8), X(78), '255,170,96', 0.24, 0.5);
    glow(ctx, x((WIN.x0 + WIN.x1) / 2), Y(36), X(46), '205,196,184', 0.12, 1.3);
    // (the floor lamp's light on this wall is a pool of its own, laid over it, that fades when the lamp is switched off)
    ctx.globalCompositeOperation = 'source-over';
    softRect(ctx, x(SHELF.x0) - 6, Y(40), X(SHELF.x1 - SHELF.x0) + 12, Y(FLOOR) - Y(40), 'rgba(0,0,0,0.8)', 40);
  }));
  // the back wall is cut around the window, so the city outside really is outside
  const wallPiece = (x0, x1, y0, y1) => ({ geo: quadUV(x1 - x0, y1 - y0, (x0 - LEFT) / ROOM_W, (y0 - FLOOR) / ROOM_H, (x1 - LEFT) / ROOM_W, (y1 - FLOOR) / ROOM_H), m: M4.compose(new Array(16), [(x0 + x1) / 2, (y0 + y1) / 2, BACK], [0, 0, 0], [1, 1, 1]), n: [1, 0, 0, 0, 1, 0, 0, 0, 1] });
  add(merge([wallPiece(LEFT, WIN.x0, FLOOR, TOP), wallPiece(WIN.x1, RIGHT, FLOOR, TOP), wallPiece(WIN.x0, WIN.x1, FLOOR, WIN.y0), wallPiece(WIN.x0, WIN.x1, WIN.y1, TOP)]), backWall, [0, 0, 0], [0, 0, 0], 'wall-back');
  add(quad(ROOM_D, ROOM_H), baked(wallTexture(32, ROOM_D, (ctx, w, h, X, Y) => {
    const u = (z) => X(FRONT - z);
    glow(ctx, u(-22), Y(34), X(40), '205,196,184', 0.13, 1.4);
    glow(ctx, u(40), Y(6), X(60), '255,170,96', 0.1, 0.6);
  })), [LEFT, midY, midZ], [0, Math.PI / 2, 0], 'wall-left');
  // the right wall is cut round the door (three pieces of one canvas), so the door can open onto the hallway behind it
  const sidePiece = (z0, z1, y0, y1) => { const m = M4.compose(new Array(16), [RIGHT, (y0 + y1) / 2, (z0 + z1) / 2], [0, -Math.PI / 2, 0], [1, 1, 1]); return { geo: quadUV(z1 - z0, y1 - y0, (z0 - BACK) / ROOM_D, (y0 - FLOOR) / ROOM_H, (z1 - BACK) / ROOM_D, (y1 - FLOOR) / ROOM_H), m, n: [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]] }; };
  add(merge([sidePiece(BACK, DOOR.z0, FLOOR, TOP), sidePiece(DOOR.z1, FRONT, FLOOR, TOP), sidePiece(DOOR.z0, DOOR.z1, DOOR.top, TOP)]), baked(wallTexture(33, ROOM_D, (ctx, w, h, X, Y) => {
    const u = (z) => X(z - BACK);
    // shadows on the plaster: the prints, the medal hanger and its medals, the door's casing; then the picture light's glow
    ctx.globalCompositeOperation = 'source-over';
    for (const p of PRINTS) { const [ow, oh] = frameSize(p); softRect(ctx, u(p.z - ow / 2), Y(FRAME_Y + oh / 2) + 10, X(ow), Y(FRAME_Y - oh / 2) - Y(FRAME_Y + oh / 2), 'rgba(0,0,0,0.55)', 26); }
    const span = (MEDAL_SET.length - 1) * MEDALS.step;
    softRect(ctx, u(MEDALS.zc - span / 2 - 4), Y(MEDALS.y + 1.1) + 5, X(span + 8), X(2.2), 'rgba(0,0,0,0.5)', 12);
    MEDAL_SET.forEach((m, i) => glow(ctx, u(MEDALS.zc + (i - 3) * MEDALS.step), Y(MEDALS.y - 13.7) + 6, X((m.r || 2.6) + 1.2), '0,0,0', 0.5));
    softRect(ctx, u(DOOR.z0 - DOOR.casing), Y(DOOR.top + DOOR.casing + 1.1), X(DOOR.z1 - DOOR.z0 + 2 * DOOR.casing), Y(FLOOR) - Y(DOOR.top + DOOR.casing + 1.1), 'rgba(0,0,0,0.5)', 20);
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, u(PRINTS[1].z), Y(FRAME_Y + 2), X(62), '255,190,120', 0.2, 0.5);
  })), [0, 0, 0], [0, 0, 0], 'wall-right');
  // the front wall, behind the chair: the bike's display light washes the plaster behind it, so the black frame reads as a
  // silhouette on warm wall (this canvas runs from the right wall to the left)
  add(quad(ROOM_W, ROOM_H), baked(wallTexture(34, ROOM_W, (ctx, w, h, X, Y) => {
    const x = (v) => X(RIGHT - v);
    glow(ctx, X(120), Y(6), X(90), '255,170,96', 0.12, 0.6);
    glow(ctx, x(BIKE[0]), Y(BIKE[1] + 30), X(80), '255,186,116', 0.2, 0.62);
    glow(ctx, x(BIKE[0]), Y(BIKE[1] + 58), X(44), '255,204,150', 0.26, 0.3);
    // the clock's soft shadow, a little below it
    ctx.globalCompositeOperation = 'source-over';
    glow(ctx, x(CLOCK[0]), Y(CLOCK[1]) + 9, X(14), '0,0,0', 0.42);
  })), [0, midY, FRONT], [0, Math.PI, 0], 'wall-front');

  const walnut = furn('#2a1a0e', { map: woodTexture(4), mapRepeat: [2, 2], roughness: 0.6, amb: 0.9 });
  const walnutDark = furn('#1a110a', { roughness: 0.7, amb: 0.7 });
  const bronze = furn('#8e6a3d', { roughness: 0.35, metalness: 0.85, amb: 0.35 });
  const b = batch();
  // skirting along every wall
  // (the right wall's run stops at the door's casing)
  const skirtR = DOOR.z0 - DOOR.casing - BACK;
  for (const [p, s] of [[[0, FLOOR + 1.5, BACK + 0.5], [ROOM_W, 3, 1]], [[0, FLOOR + 1.5, FRONT - 0.5], [ROOM_W, 3, 1]], [[LEFT + 0.5, FLOOR + 1.5, midZ], [1, 3, ROOM_D]], [[RIGHT - 0.5, FLOOR + 1.5, BACK + skirtR / 2], [1, 3, skirtR]]]) b.put(box(1, 1, 1), walnutDark, p, [0, 0, 0], s);
  // the rug's bound edge, and a cotton fringe along both short ends, each tassel a little different in length and lie
  const rugEdge = furn('#3e1e10', { roughness: 0.95, amb: 0.75 }), fringe = furn('#d6c9ae', { roughness: 0.95, amb: 0.8 });
  for (const s of [-1, 1]) {
    // (the binding stands a hair proud of the pile, so its top never fights the rug's face)
    b.put(box(RUG.w + 0.4, RUG.t + 0.06, 0.6), rugEdge, [0, FLOOR + (RUG.t + 0.06) / 2, RUG.z + s * (RUG.d / 2 - 0.1)]);
    b.put(box(0.6, RUG.t + 0.06, RUG.d), rugEdge, [s * (RUG.w / 2 - 0.1), FLOOR + (RUG.t + 0.06) / 2, RUG.z]);
    // fine cotton cords, gathered four to a knot at the rug's edge, fanning a little and lying loose on the boards
    const fr = rng(s > 0 ? 91 : 92);
    for (let z = RUG.z - RUG.d / 2 + 0.9, k = 0; z < RUG.z + RUG.d / 2 - 0.6; z += 0.52, k++) {
      if (k % 4 === 0) b.put(sphere(0.26, 8, 6), fringe, [s * (RUG.w / 2 + 0.2), FLOOR + 0.16, z + 0.78], [0, 0, 0], [1.2, 0.7, 1.4]);
      const len = 1.9 + fr() * 0.9, yaw = ((k % 4) - 1.5) * 0.09 + (fr() - 0.5) * 0.25;
      b.put(box(len, 0.06, 0.13), fringe, [s * (RUG.w / 2 + 0.25 + len / 2), FLOOR + 0.04, z + (fr() - 0.5) * 0.12], [0, s * yaw, (fr() - 0.5) * 0.04]);
    }
  }
  // the desk stands on two walnut panel legs and a rail
  // (each panel stands on the rug on two levelling feet, a black glide under a short threaded stem, so it reads as standing on it)
  const glide = furn('#121110', { roughness: 0.5, amb: 0.4 }), feet = FLOOR + RUG.t;
  for (const x of [-43, 43]) {
    b.put(box(3, -2.6 - (feet + 0.65), 40), walnut, [x, (-2.6 + feet + 0.65) / 2, 0]);
    for (const z of [-17.5, 17.5]) { b.put(cylinder(1.05, 1.15, 0.35, 20), glide, [x, feet + 0.175, z]); b.put(cylinder(0.35, 0.35, 0.4, 10), bronze, [x, feet + 0.5, z]); }
  }
  b.put(box(83, 5, 1.4), walnut, [0, -6, -18]);

  // ---------- the ceiling: dark plaster seen only from below, a stepped walnut cornice round the walls, six recessed downlights
  // and a smoke detector. The downlights are the room's "main lights" (the switch by the door).
  add(quad(ROOM_W, ROOM_D), baked(ceilingTexture()), [0, TOP, midZ], [Math.PI / 2, 0, 0], 'ceiling');
  for (const [p, s] of [[[0, 0, BACK], [ROOM_W, 1, 1]], [[0, 0, FRONT], [ROOM_W, 1, 1]], [[LEFT, 0, midZ], [1, 1, ROOM_D]], [[RIGHT, 0, midZ], [1, 1, ROOM_D]]]) {
    const inX = p[0] === LEFT ? 1 : p[0] === RIGHT ? -1 : 0, inZ = p[2] === BACK ? 1 : p[2] === FRONT ? -1 : 0;
    for (const [d, h, y] of [[1.6, 2.6, TOP - 1.3], [2.8, 1.0, TOP - 0.5], [0.8, 0.5, TOP - 2.85]]) b.put(box(1, 1, 1), walnutDark, [p[0] + inX * d / 2, y, p[2] + inZ * d / 2], [0, 0, 0], [inX ? d : s[0], h, inZ ? d : s[2]]);
  }
  const downMat = new Material({ color: [0, 0, 0], emissive: color('#ffdcb0').map((v) => v * 1.2), unlit: true, receiveShadow: false });
  const downE = [...downMat.emissive], trim = furn('#c9c6c0', { roughness: 0.4, metalness: 0.6, amb: 0.5 }), well = furn('#151413', { amb: 0.3 });
  for (const [x, z] of DOWNLIGHTS) {
    b.put(torus(1.95, 0.2, 28, 6), trim, [x, TOP - 0.12, z]);
    b.put(cylinder(1.75, 1.75, 0.6, 28, false), well, [x, TOP - 0.3, z]);
    b.put(cylinder(1.3, 1.3, 0.05, 28), downMat, [x, TOP - 0.55, z]);
  }
  b.put(cylinder(2.3, 2.5, 0.9, 32), furn('#d9d6cf', { roughness: 0.6, amb: 0.5 }), [22, TOP - 0.45, 64]);
  b.put(cylinder(1.4, 1.4, 0.12, 24), furn('#bdb9b0', { amb: 0.5 }), [22, TOP - 0.95, 64]);
  const smokeLed = new Material({ color: [0, 0, 0], emissive: color('#ff3a2a'), emissiveIntensity: 0.4, unlit: true, receiveShadow: false });
  add(sphere(0.18, 8, 6), smokeLed, [24.0, TOP - 1.04, 64], [0, 0, 0], 'smoke-led');

  // ---------- the window: clear glass onto the city (app/city), walnut frame, sill, curtains on a bronze rod
  const wcx = (WIN.x0 + WIN.x1) / 2, wcy = (WIN.y0 + WIN.y1) / 2, ww = WIN.x1 - WIN.x0, wh = WIN.y1 - WIN.y0;
  add(quad(ww, wh), new Material({ color: [0.85, 0.86, 0.86], roughness: 0.05, opacity: 0.06, transparent: true, depthWrite: false, fresnel: 0.35, fresnelColor: [0.95, 0.85, 0.7], receiveShadow: false }), [wcx, wcy, BACK + 0.3], [0, 0, 0], 'window');
  // the wall has depth at the window: four reveals run back from the opening, so the frame reads as set into a real wall
  // (they start a hair behind the wall's face, so the plaster in front of them never fights them for depth)
  const reveal = furn('#47474a', { roughness: 0.9, amb: 0.95 }), rd = 4.2, rz = BACK - 0.05 - rd / 2;
  b.put(box(0.4, wh + 0.8, rd), reveal, [WIN.x0 - 0.2, wcy, rz]); b.put(box(0.4, wh + 0.8, rd), reveal, [WIN.x1 + 0.2, wcy, rz]);
  b.put(box(ww, 0.4, rd), reveal, [wcx, WIN.y1 + 0.2, rz]); b.put(box(ww, 0.4, rd), reveal, [wcx, WIN.y0 - 0.2, rz]);
  const city = buildCity(); room.add(city.root);
  for (const [p, s] of [[[wcx, WIN.y1 + 1, BACK + 1.2], [ww + 4, 2, 2.4]], [[wcx, WIN.y0 - 1, BACK + 1.2], [ww + 4, 2, 2.4]], [[WIN.x0 - 1, wcy, BACK + 1.2], [2, wh + 4, 2.4]], [[WIN.x1 + 1, wcy, BACK + 1.2], [2, wh + 4, 2.4]], [[wcx, wcy, BACK + 0.9], [0.8, wh, 1.2]], [[wcx, WIN.y0 + wh * 0.38, BACK + 0.9], [ww, 0.8, 1.2]]]) b.put(box(1, 1, 1), walnut, p, [0, 0, 0], s);
  b.put(box(ww + 8, 1.4, 5.5), walnut, [wcx, WIN.y0 - 2.4, BACK + 2.6]);
  // on the sill, behind the curtains' line: a candle in a smoked-glass jar (lit, a soft flame) and a little succulent in a clay pot
  const sillY = WIN.y0 - 2.4 + 0.7, sillZ = BACK + 3.9;   // (in front of the frame's bottom rail, which takes the sill's back 2.4)
  b.put(cylinder(1.1, 1.0, 2.4, 20), furn('#3a2c22', { roughness: 0.15, metalness: 0.2, amb: 0.6 }), [-72, sillY + 1.2, sillZ]);
  b.put(cylinder(0.95, 0.95, 1.4, 20), furn('#e8dcc6', { roughness: 0.8, amb: 0.8 }), [-72, sillY + 0.75, sillZ]);
  // (the flame isn't one of the dimmers: update() drives it, so it can flicker on top of the room's light level)
  const flameE = color('#ffb45a').map((v) => v * 2.2), flame = new Material({ color: [0, 0, 0], emissive: [...flameE], unlit: true, receiveShadow: false });
  const flameMesh = add(sphere(0.22, 10, 8), flame, [-72, sillY + 1.85, sillZ], [0, 0, 0], 'candle-flame'); flameMesh.scale = [0.8, 1.9, 0.8];
  b.put(cylinder(1.3, 1.0, 1.8, 18), furn('#a35a32', { roughness: 0.85, amb: 0.7 }), [-102, sillY + 0.9, sillZ]);
  const succulent = furn('#5f7d48', { amb: 0.85 });   // (one material for every leaf: one draw call, not nine)
  for (let j = 0; j < 9; j++) { const a = (j / 9) * Math.PI * 2, tilt = 0.5 + (j % 3) * 0.2; b.put(sphere(0.45, 8, 6), succulent, [-102 + Math.cos(a) * 0.55, sillY + 2.1 + (j % 3) * 0.15, sillZ + Math.sin(a) * 0.55], [Math.sin(a) * tilt, 0, -Math.cos(a) * tilt], [0.7, 1.6, 0.45]); }
  // a brass casement handle on the face of the mullion, just above the transom, lever hanging down
  const tY = WIN.y0 + wh * 0.38;
  b.put(roundedBox({ w: 0.7, h: 2.6, d: 0.25, r: 0.1, seg: 2 }), bronze, [wcx, tY + 2.4, BACK + 1.62]);
  b.put(cylinder(0.3, 0.3, 0.5, 12), bronze, [wcx, tY + 3.0, BACK + 1.95], [Math.PI / 2, 0, 0]);
  b.put(roundedBox({ w: 0.4, h: 3.0, d: 0.4, r: 0.16, seg: 2 }), bronze, [wcx, tY + 1.7, BACK + 2.2], [0.18, 0, 0]);
  // the rod stands out from the wall on two brackets, far enough that the curtains hang clear of the frame and the sill
  const rodY = WIN.y1 + 6, rodZ = BACK + 6.6, rodX0 = LEFT + 0.8, rodX1 = WIN.x1 + 12.4;
  b.put(cylinder(0.45, 0.45, rodX1 - rodX0, 12), bronze, [(rodX0 + rodX1) / 2, rodY, rodZ], [0, 0, Math.PI / 2]);
  // (the brackets sit at the very ends, so the rings never have to pass them)
  for (const x of [rodX0 + 0.35, rodX1 - 0.35]) { b.put(cylinder(0.3, 0.3, rodZ - BACK, 8), bronze, [x, rodY, (BACK + rodZ) / 2], [Math.PI / 2, 0, 0]); b.put(cylinder(1.1, 1.1, 0.4, 16), bronze, [x, rodY, BACK + 0.2], [Math.PI / 2, 0, 0]); }
  b.put(sphere(0.8, 12, 8), bronze, [rodX1 + 0.6, rodY, rodZ]);
  const curtainMat = (side) => furn('#ffffff', { color: [0.55, 0.5, 0.46], map: curtainTexture(side), amb: 0.9, doubleSide: true });
  // click either curtain and both draw across the window, meeting (almost) in the middle; each keeps to its own half, and swings
  // no further than the left wall or the desk's end
  const mid = (WIN.x0 + WIN.x1) / 2;
  const curtains = [
    buildCurtain({ fixed: rodX0 + 1.4, open: WIN.x0 - 1.0, closed: mid - 0.6, rodY, yBot: FLOOR + 2, z0: rodZ, side: 1, mat: curtainMat(1), ringMat: bronze, xMin: LEFT + 0.3, xMax: mid - 0.1 }),
    buildCurtain({ fixed: rodX1 - 1.2, open: WIN.x1 + 1.0, closed: mid + 0.6, rodY, yBot: FLOOR + 2, z0: rodZ, side: -1, mat: curtainMat(-1), ringMat: bronze, xMin: mid + 0.1, xMax: -48.3 }),
  ];
  for (const c of curtains) { room.add(c.mesh); room.add(c.ringMesh); pickables.push(c.mesh); }
  const toggleCurtains = () => { const v = !curtains[0].drawn; for (const c of curtains) c.draw(v); return v; };

  // ---------- the bookshelf: the work, one book per project
  const sx = (SHELF.x0 + SHELF.x1) / 2, sw = SHELF.x1 - SHELF.x0, sd = SHELF.depth, sz = BACK + sd / 2 + 0.4, topY = SHELF.rows.at(-1);
  b.put(box(1.6, topY + 1.2 - FLOOR, sd), walnut, [SHELF.x0 + 0.8, (topY + 1.2 + FLOOR) / 2, sz]);
  b.put(box(1.6, topY + 1.2 - FLOOR, sd), walnut, [SHELF.x1 - 0.8, (topY + 1.2 + FLOOR) / 2, sz]);
  // the plinth sits between the side panels and a little back from their fronts (a toe kick), so no two faces share a plane
  b.put(box(sw - 3.2, 6, sd - 0.8), walnut, [sx, FLOOR + 3, sz - 0.4]);
  for (const y of SHELF.rows) b.put(box(sw - 3.2, 1.2, sd - 0.4), walnut, [sx, y - 0.6, sz]);
  b.put(box(sw - 3.2, topY - FLOOR, 0.4), walnutDark, [sx, (topY + FLOOR) / 2, BACK + 0.7]);
  // the back panel's face, lit by a warm LED strip tucked under the front of every shelf (an aluminium channel, a glowing diffuser);
  // it stands a clear 0.25 proud of the panel behind it, so the two never fight for depth from across the room
  b.put(quad(sw - 3.2, topY - FLOOR), furn('#ffffff', { color: [0.9, 0.88, 0.85], map: shelfBackTexture(), amb: 1.0 }), [sx, (topY + FLOOR) / 2, BACK + 1.15]);
  const stripLed = dim(new Material({ color: [0, 0, 0], emissive: color('#ffd2a0').map((v) => v * 1.6), unlit: true, receiveShadow: false }), 'emissive');
  for (const y of SHELF.rows.slice(1)) { b.put(box(sw - 4.2, 0.3, 0.9), bronze, [sx, y - 1.35, sz + sd / 2 - 1.7]); b.put(box(sw - 4.6, 0.08, 0.6), stripLed, [sx, y - 1.53, sz + sd / 2 - 1.7]); }
  // two rows between the same bookends (22 units each): eight books a row at 2.75 apart, closer and a little thinner when there are more
  const bookRows = [SHELF.rows[2], SHELF.rows[1]], perRow = Math.max(8, Math.ceil(PROJECTS.length / 2)), step = 22 / perRow;
  PROJECTS.forEach((p, i) => {
    const row = bookRows[Math.floor(i / perRow)] ?? bookRows[1]; const k = i % perRow; const rr = rng(i * 7 + 3);
    const t = Math.min(1.9 + rr() * 0.7, step - 0.2), hgt = 9.5 + rr() * 3, d = 8 + rr() * 0.8;
    // the body samples the texture's plain corner on every face (its top too: roundedBox maps the whole texture onto the top
    // by default, which would squash the spine onto it); only the spine quad carries the spine
    const body = roundedBox({ w: t, h: hgt, d, r: 0.12, seg: 2 }); body.uvs.fill(0.02);
    const geo = merge([{ geo: body }, { geo: quad(t - 0.18, hgt - 0.2), m: M4.compose(new Array(16), [0, 0, d / 2 + 0.02], [0, 0, 0], [1, 1, 1]), n: [1, 0, 0, 0, 1, 0, 0, 0, 1] }]);
    // (the shelf's LED strips light the spines, so they carry more of their own colour than the furniture around them)
    const mat = furn('#ffffff', { color: [0.8, 0.78, 0.74], map: spineTexture(p), roughness: 0.6, amb: 0.95 });
    const node = new Node('book:' + p.key);
    const slotX = SHELF.x0 + 3.2 + (k + 0.5) * step - 1.375 + (i >= perRow ? 4 : 0);
    node.position = [slotX, row + hgt / 2, BACK + 0.4 + sd - d / 2 - 0.6];
    node.userData = { book: p.key, interactive: true, glow: 0, targetGlow: 0, restZ: node.position[2] };
    const mesh = new Mesh(geo, mat, 'book'); mesh.castShadow = false; mesh.pickable = true; mesh.userData = { ownerKey: node };
    node.add(mesh); room.add(node); pickables.push(mesh); books.push(node);
  });
  // bookends, and the rest of the shelves: things that are not projects
  const bookend = (x, y) => { b.put(box(0.5, 6, 6), bronze, [x, y + 3, sz + 1]); b.put(box(3, 0.4, 6), bronze, [x + (x < sx ? -1.2 : 1.2), y + 0.2, sz + 1]); };
  // the right-hand bookends stand against the last book of each row
  bookend(SHELF.x0 + 3.2 + (Math.min(perRow, PROJECTS.length) - 0.5) * step + 0.3, SHELF.rows[2]); bookend(SHELF.x0 + 3.2 + 4 - 1.6, SHELF.rows[1]); bookend(SHELF.x0 + 3.2 + 4 + (Math.max(1, PROJECTS.length - perRow) - 0.5) * step + 0.3, SHELF.rows[1]);
  const fabric = furn('#3a2216', { amb: 0.7 }), cream = furn('#cdb994', { amb: 0.7 }), ember = furn('#7a3a1c', { amb: 0.7 });
  // books lying flat: a cover board above and below, the spine along the back (to the wall), and the page block showing between
  // the boards on the other three sides, set a hair inside them, its edge fine-lined with the leaves
  const paper = furn('#ffffff', { color: [0.86, 0.82, 0.74], amb: 0.85, map: drawTexture(64, 64, (ctx, w, h) => { ctx.fillStyle = '#e9e1cf'; ctx.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { ctx.fillStyle = `rgba(120,100,70,${y % 8 === 0 ? 0.22 : 0.09})`; ctx.fillRect(0, y, w, 1); } }) });
  const lyingBook = (w, h, d, cover, p, ry) => {
    const c = Math.cos(ry), s = Math.sin(ry), at = (lx, ly, lz) => [p[0] + lx * c + lz * s, p[1] + ly, p[2] - lx * s + lz * c], t = Math.min(0.2, h * 0.14), r = [0, ry, 0];
    b.put(box(w, t, d), cover, at(0, h / 2 - t / 2, 0), r); b.put(box(w, t, d), cover, at(0, -h / 2 + t / 2, 0), r);
    b.put(box(w, h, t), cover, at(0, 0, -d / 2 + t / 2), r);
    b.put(box(w - 0.3, h - 2 * t + 0.02, d - t - 0.15), paper, at(0, 0, (t - 0.15) / 2), r);
  };
  for (const [j, m] of [[0, cream], [1, ember], [2, fabric]]) lyingBook(11 - j, 1.5, 8, m, [SHELF.x0 + 9, SHELF.rows[3] + 0.75 + j * 1.5, sz], 0.08 * (j - 1));
  // (the middle of this shelf holds the G 63 display case, app/gwagon: the little plant keeps to the right end)
  b.put(cylinder(2.2, 1.7, 3.2, 16), ember, [SHELF.x1 - 5.5, SHELF.rows[3] + 1.6, sz]);
  const shelfLeaf = furn('#3d4a22', { amb: 0.8 });
  for (let j = 0; j < 7; j++) { const a = (j / 7) * Math.PI * 2; b.put(sphere(1.6, 8, 6), shelfLeaf, [SHELF.x1 - 5.5 + Math.cos(a) * 1.8, SHELF.rows[3] + 4.2 + (j % 3) * 0.9, sz + Math.sin(a) * 1.8], [0, a, 0.4], [1.3, 0.45, 0.8]); }
  for (const [x, m] of [[SHELF.x0 + 10, fabric], [SHELF.x0 + 30, ember]]) b.put(roundedBox({ w: 16, h: 12, d: 9, r: 0.6, seg: 2 }), m, [x, SHELF.rows[0] + 6, sz]);
  // each box has a brass label holder with a card in it, and a finger pull over it
  {
    const zf = sz + 4.5, cardMat = (word) => furn('#ffffff', { color: [0.9, 0.87, 0.8], amb: 0.8, map: drawTexture(128, 64, (ctx, w, h) => { ctx.fillStyle = '#e8dfcc'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#2a2018'; ctx.font = `600 22px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(word, w / 2, h / 2 + 1); ctx.fillStyle = 'rgba(42,32,24,0.4)'; ctx.fillRect(14, h - 14, w - 28, 1.5); }) });
    const pull = furn('#0d0907', { roughness: 0.9, amb: 0.2 });
    for (const [x, word] of [[SHELF.x0 + 10, 'CABLES'], [SHELF.x0 + 30, 'ARCHIVE']]) {
      const y = SHELF.rows[0] + 5.2;
      for (const [w, h, dx, dy] of [[4.6, 0.3, 0, 1.45], [4.6, 0.3, 0, -1.45], [0.3, 2.6, -2.15, 0], [0.3, 2.6, 2.15, 0]]) b.put(box(w, h, 0.18), bronze, [x + dx, y + dy, zf + 0.09]);
      b.put(quad(4.0, 2.6), cardMat(word), [x, y, zf + 0.06]);
      b.put(roundedBox({ w: 4.2, h: 1.1, d: 0.12, r: 0.5, seg: 3 }), pull, [x, SHELF.rows[0] + 9.6, zf + 0.02]);
    }
  }
  // a row of slim notebooks on top, a little uneven in height and depth, each with a pale label band on its spine; the last one
  // leans back on the row
  {
    const sage = furn('#4a5646', { amb: 0.7 }), covers = [fabric, ember, sage], band = furn('#d6c9ae', { amb: 0.8 }), y0 = SHELF.rows[4];
    for (let j = 0; j < 9; j++) {
      const hgt = 9.3 + ((j * 7) % 5) * 0.3, dep = 8.5 + ((j * 3) % 4) * 0.18, x = SHELF.x0 + 6 + j * 0.5, m = covers[j % 3];
      if (j < 8) {
        b.put(box(0.42, hgt, dep), m, [x, y0 + hgt / 2, sz]);
        b.put(box(0.34, 0.55, 0.03), band, [x, y0 + 6.6, sz + dep / 2 + 0.01]);
      } else {
        const a = 0.175;   // its foot out from the row, its top corner against the face of the one before
        b.put(box(0.42, hgt, dep), m, [x + 1.6 - Math.sin(a) * hgt / 2, y0 + Math.cos(a) * hgt / 2, sz], [0, 0, a]);
      }
    }
  }
  // on top: two books lying flat, and a cream ceramic vase of dried pampas grass
  const topY2 = SHELF.rows[4];
  lyingBook(9, 1.6, 7, ember, [SHELF.x0 + 22, topY2 + 0.8, sz + 0.5], 0.12);
  lyingBook(8, 1.4, 6.4, fabric, [SHELF.x0 + 22.3, topY2 + 2.3, sz + 0.4], -0.1);
  const vaseX = SHELF.x1 - 10, ceramic = furn('#d6c9b2', { roughness: 0.55, amb: 0.75 }), plume = furn('#e2d2b0', { roughness: 0.9, amb: 0.85 }), stalk = furn('#b49a6e', { amb: 0.7 });
  b.put(sphere(2.6, 20, 14), ceramic, [vaseX, topY2 + 3.1, sz], [0, 0, 0], [1, 1.2, 1]);
  b.put(cylinder(1.0, 1.4, 2.6, 18), ceramic, [vaseX, topY2 + 6.6, sz]);
  b.put(torus(1.0, 0.18, 18, 6), ceramic, [vaseX, topY2 + 7.9, sz]);
  const pg = rng(71);
  for (let j = 0; j < 8; j++) {
    const a = (j / 8) * Math.PI * 2 + pg() * 0.5, tilt = 0.08 + pg() * 0.22, len = 14 + pg() * 9;
    const base = [vaseX, topY2 + 7.6, sz], dir = [Math.sin(tilt) * Math.cos(a), Math.cos(tilt), Math.sin(tilt) * Math.sin(a) * 0.6];
    const mid = [base[0] + dir[0] * len / 2, base[1] + dir[1] * len / 2, base[2] + dir[2] * len / 2], tip = [base[0] + dir[0] * len, base[1] + dir[1] * len, base[2] + dir[2] * len];
    b.put(cylinder(0.06, 0.09, len, 5), stalk, mid, [dir[2] * 1.1, 0, -dir[0] * 1.1]);
    b.put(sphere(1, 8, 6), plume, [tip[0] + dir[0] * 2.4, tip[1] + 2.4, tip[2] + dir[2] * 2.4], [dir[2] * 1.1, a, -dir[0] * 1.1], [0.75, 3.4, 0.75]);
  }
  // the free right ends of the two book rows. Upper: a small framed print leaning on the back panel, and a brass ring on a walnut
  // block over two lying books. Lower: a rattan basket with an oatmeal throw folded into it.
  {
    const y2 = SHELF.rows[2], y1 = SHELF.rows[1], zb = BACK + 3.4, lean = -0.12, c = Math.cos(lean), s = Math.sin(lean);
    // a point (lx, ly, lz) on a thing that leans back from its bottom front edge at (x, y, zb)
    const Ln = (x, y, lx, ly, lz) => [x + lx, y + ly * c - lz * s, zb + ly * s + lz * c];
    const fw = 8, fh = 10.5, ft = 0.7, fd = 0.6, fx = 89.4, frameMat = furn('#1a1410', { roughness: 0.5, amb: 0.5 });
    for (const ly of [ft / 2, fh - ft / 2]) b.put(box(fw, ft, fd), frameMat, Ln(fx, y2, 0, ly, 0), [lean, 0, 0]);
    for (const lx of [-(fw - ft) / 2, (fw - ft) / 2]) b.put(box(ft, fh - 2 * ft, fd), frameMat, Ln(fx, y2, lx, fh / 2, 0), [lean, 0, 0]);
    b.put(box(fw - 2 * ft, fh - 2 * ft, 0.1), frameMat, Ln(fx, y2, 0, fh / 2, -0.22), [lean, 0, 0]);   // its backing board
    b.put(quad(fw - 2 * ft, fh - 2 * ft), furn('#ffffff', { color: [0.9, 0.88, 0.84], map: shelfPrintTexture(), amb: 0.95 }), Ln(fx, y2, 0, fh / 2, 0.08), [lean, 0, 0]);
    const bx = 96.9, bz = -24.6;
    lyingBook(6.0, 1.3, 7.2, cream, [bx, y2 + 0.65, bz], 0.06);
    lyingBook(5.4, 1.1, 6.6, fabric, [bx + 0.1, y2 + 1.85, bz - 0.1], -0.05);
    const sy = y2 + 2.4;
    b.put(roundedBox({ w: 3.2, h: 0.9, d: 2.2, r: 0.15, seg: 2 }), walnutDark, [bx, sy + 0.45, bz]);
    b.put(cylinder(0.14, 0.14, 0.8, 8), bronze, [bx, sy + 1.2, bz]);
    b.put(torus(2.5, 0.2, 40, 8), bronze, [bx, sy + 1.45 + 2.5, bz], [Math.PI / 2, 0, 0]);
    const kx = 95.6, kz = -24.0, rattan = furn('#ffffff', { color: [0.84, 0.76, 0.62], map: rattanTexture(), mapRepeat: [3, 1], roughness: 0.85, amb: 0.85, doubleSide: true });
    b.put(cylinder(3.85, 3.45, 7.4, 32, false), rattan, [kx, y1 + 3.7, kz]);
    b.put(cylinder(3.45, 3.45, 0.3, 32), rattan, [kx, y1 + 0.15, kz]);
    b.put(torus(3.85, 0.32, 32, 6), rattan, [kx, y1 + 7.4, kz]);
    // the throw, folded into it in three soft layers, the top one's end hanging over the front of the rim
    const knit = furn('#ffffff', { color: [0.7, 0.64, 0.55], map: knitTexture(), mapRepeat: [0.5, 0.5], roughness: 0.95, amb: 0.8 });
    const fold = (w, h, d, r, p, rot) => b.put(roundedBox({ w, h, d, r, seg: 3, uvTopOnly: false }), knit, p, rot);
    fold(6.2, 2.0, 5.3, 0.75, [kx, y1 + 5.9, kz], [0, 0.15, 0]);
    fold(6.0, 1.5, 5.1, 0.65, [kx + 0.15, y1 + 7.6, kz + 0.1], [0.03, -0.1, 0.04]);
    fold(5.6, 1.3, 4.7, 0.6, [kx + 0.3, y1 + 8.9, kz + 0.35], [0.06, 0.12, -0.05]);
    fold(5.3, 0.9, 2.3, 0.4, [kx + 0.35, y1 + 8.5, kz + 3.45], [0, 0.12, 0]);
    fold(5.2, 2.8, 0.85, 0.38, [kx + 0.4, y1 + 7.1, kz + 4.55], [0.12, 0.12, 0]);
  }

  // ---------- the floor lamp in the corner by the shelf (app/floorlamp: a walnut tripod in brass shoes under a tall pleated linen
  // drum; its cord trails behind it to a brass socket in the boards)
  const floorLamp = buildFloorLamp(); floorLamp.root.position = [112, FLOOR, -15]; room.add(floorLamp.root);
  for (const m of floorLamp.dimmable) dim(m, 'emissive');
  dim(floorLamp.glow, 'emissive');
  // its light on the back wall, the right wall and the boards: three soft pools laid just over them, which fade with the lamp.
  // Click it (the shade, the stem or the legs) and it goes out, or comes back
  const pool = (w, h, spots) => drawTexture(256, Math.round((256 * h) / w), (ctx, cw, ch) => { ctx.clearRect(0, 0, cw, ch); const k = cw / w; for (const [x, y, r, rgb, a, sy] of spots) glow(ctx, x * k, ch - y * k, r * k, rgb, a, sy); });
  const poolMat = (tex) => new Material({ color: [1, 1, 1], map: tex, opacity: 1, transparent: true, depthWrite: false, unlit: true, receiveShadow: false });
  const lamp = { on: true, p: 1, pools: [], hit: null };
  lamp.pools.push(add(quad(32, 125), poolMat(pool(32, 125, [[24, 87, 24, '255,196,128', 0.45, 1.6], [24, 48, 28, '255,184,112', 0.3, 1.3]])), [104, 22.5, BACK + 0.08], [0, 0, 0], 'lamp-pool'));
  lamp.pools.push(add(quad(46.6, 125), poolMat(pool(46.6, 125, [[16.6, 84, 30, '255,196,128', 0.42, 1.5], [16.6, 45, 28, '255,184,112', 0.24, 1.2]])), [RIGHT - 0.08, 22.5, -7.3], [0, -Math.PI / 2, 0], 'lamp-pool'));
  lamp.pools.push(add(quad(50, 58.6), poolMat(pool(50, 58.6, [[42, 42, 42, '255,184,112', 0.4, 1]])), [95, FLOOR + 0.06, -1.3], [-Math.PI / 2, 0, 0], 'lamp-pool'));
  for (const m of lamp.pools) m.castShadow = false;
  const lampHitMat = new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false });
  lamp.hit = new Node('floorlamp-hit'); lamp.hit.userData = { keyId: 'floorlamp', interactive: true, glow: 0, targetGlow: 0, tipAt: [112, 50, -15] }; room.add(lamp.hit);
  for (const [w, h, d, p] of [[15, 19.5, 15, [112, FLOOR + 75.5, -15]], [3.2, 40, 3.2, [112, FLOOR + 46, -15]], [16.5, 26, 23, [111.4, FLOOR + 13, -17.8]]]) {
    const m = new Mesh(box(w, h, d), lampHitMat, 'floorlamp-hit'); m.position = p; m.castShadow = false; m.pickable = true; m.userData = { ownerKey: lamp.hit }; lamp.hit.add(m); pickables.push(m);
  }
  const toggleFloorLamp = () => { lamp.on = !lamp.on; return lamp.on; };

  // ---------- the desk chair (app/chair), pulled back a little and turned towards the keyboard; a side table by the wall
  const chair = buildChair(); chair.position = [10, FLOOR, 35]; chair.rotation = [0, 0.32, 0]; room.add(chair);
  for (const m of chair.userData.dimmable || []) dim(m, 'emissive');
  // the chair can be pointed at: tight boxes on the seat, the back and the headrest (one big box would swallow clicks meant for the desk)
  const chairHit = new Node('chair-hit'); chairHit.userData = { keyId: 'chair', interactive: true, glow: 0, targetGlow: 0 }; chair.add(chairHit);
  // its hover tip sits just over the headrest (the node itself is on the floor, under the base)
  { const ry = chair.rotation[1]; chairHit.userData.tipAt = [chair.position[0] + Math.sin(ry) * 18.5, chair.position[1] + 69, chair.position[2] + Math.cos(ry) * 18.5]; }
  const hitMat = new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false });
  for (const [w, h, d, p, r] of [[26, 3.2, 25, [0, 22.2, -0.5], [0, 0, 0]], [25, 32, 9, [0, 43, 14.5], [0.17, 0, 0]], [15, 7, 5, [0, 62.5, 18.5], [0, 0, 0]]]) {
    const m = new Mesh(box(w, h, d), hitMat, 'chair-hit'); m.position = p; m.rotation = r; m.castShadow = false; m.pickable = true; m.userData = { ownerKey: chairHit }; chairHit.add(m); pickables.push(m);
  }
  // (the side table that stood here is gone: the Satoshi statue (app/satoshi) takes its place under the middle print)

  // ---------- a fiddle-leaf fig in the corner by the window (app/plant; the left wall's painting and decor are app/leftwall's).
  // Its leaves are kept out of the left wall, the curtain and sill behind it, the dumbbell rack along the wall and the floor.
  const plantP = [-100, FLOOR, -7];
  const plant = buildPlant((q) => {
    const x = q[0] + plantP[0], y = q[1] + plantP[1], z = q[2] + plantP[2];
    return x < LEFT + 3 || z < BACK + 8.5 || (x < WIN.x0 + 0.5 && z < BACK + 11) || (x < -99 && z > -4 && y < 11) || y < FLOOR + 4;
  });
  plant.position = [...plantP]; room.add(plant);
  for (const m of plant.userData.dimmable) dim(m, 'emissive');
  // ---------- the prints on the right wall over the side table, and a brass picture light (built facing +z, turned to face into the room)
  const matMat = furn('#d8c8a6', { amb: 0.8 }), RW = [0, -Math.PI / 2, 0], wx = (d) => RIGHT - d;
  for (const p of PRINTS) {
    const [ow, oh] = frameSize(p);
    b.put(box(ow, RIM, 1.2), walnutDark, [wx(0.65), FRAME_Y + oh / 2 - RIM / 2, p.z], RW); b.put(box(ow, RIM, 1.2), walnutDark, [wx(0.65), FRAME_Y - oh / 2 + RIM / 2, p.z], RW);
    b.put(box(RIM, oh - 2 * RIM, 1.2), walnutDark, [wx(0.65), FRAME_Y, p.z - ow / 2 + RIM / 2], RW); b.put(box(RIM, oh - 2 * RIM, 1.2), walnutDark, [wx(0.65), FRAME_Y, p.z + ow / 2 - RIM / 2], RW);
    b.put(quad(p.w + 2 * MAT_W, p.h + 2 * MAT_W), matMat, [wx(0.25), FRAME_Y, p.z], RW);
    const print = new Mesh(quad(p.w, p.h), furn('#ffffff', { color: [0.86, 0.84, 0.8], map: posterTexture(p.key), amb: 0.8 }), 'print:' + p.key);
    print.position = [wx(0.33), FRAME_Y, p.z]; print.rotation = RW; print.castShadow = false; print.pickable = true; print.userData = { keyId: p.id, interactive: true, glow: 0, targetGlow: 0 };
    room.add(print); pickables.push(print);
  }
  const pz = PRINTS[1].z;
  b.put(cylinder(0.4, 0.4, 22, 12), bronze, [wx(2.6), FRAME_Y + 15.2, pz], [Math.PI / 2, 0, 0]);
  for (const dz of [-7, 7]) b.put(box(2.6, 0.5, 0.5), bronze, [wx(1.3), FRAME_Y + 15.2, pz + dz]);
  b.put(box(0.6, 0.25, 20), dim(new Material({ color: [0, 0, 0], emissive: color('#ffd6a3').map((v) => v * 1.8), unlit: true, receiveShadow: false }), 'emissive'), [wx(2.6), FRAME_Y + 14.75, pz]);

  // ---------- running medals on a walnut hanger above the prints: seven in a row, evenly spaced, every ribbon the same length.
  // Each ribbon loops over a brass peg and comes down in a V to the medal's ring; the medal hangs just off the wall.
  const medalFace = furn('#ffffff', { color: [0.95, 0.94, 0.92], map: medalAtlas(), amb: 0.55, metalness: 0.55, roughness: 0.35 });
  const ribbonMat = furn('#ffffff', { color: [0.85, 0.84, 0.82], map: ribbonAtlas(), amb: 0.7, doubleSide: true });
  const metal = Object.fromEntries(Object.entries(METALS).map(([k, c]) => [k, furn(c[1], { metalness: 0.9, roughness: 0.3, amb: 0.45 })]));
  const ms = MEDALS.step, mspan = (MEDAL_SET.length - 1) * ms, pegY = MEDALS.y - 0.5, ringY = pegY - 9.75, nM = MEDAL_SET.length;
  b.put(box(mspan + 8, 2.2, 0.9), walnut, [wx(0.45), MEDALS.y, MEDALS.zc], RW);
  b.put(box(mspan + 7.4, 0.2, 0.06), bronze, [wx(0.93), MEDALS.y + 0.55, MEDALS.zc], RW);
  for (const s of [-1, 1]) { b.put(box(0.5, 2.4, 1.0), bronze, [wx(0.5), MEDALS.y, MEDALS.zc + s * (mspan / 2 + 4.25)], RW); b.put(cylinder(0.3, 0.3, 0.12, 12), bronze, [wx(0.93), MEDALS.y - 0.2, MEDALS.zc + s * (mspan / 2 + 2.6)], [0, 0, Math.PI / 2]); }
  MEDAL_SET.forEach((m, i) => {
    const zm = MEDALS.zc + (i - (nM - 1) / 2) * ms, r = m.r || 2.6, yc = ringY - 0.45 - r, mat = metal[m.metal];
    b.put(cylinder(0.18, 0.18, 1.0, 10), bronze, [wx(1.4), pegY, zm], [0, 0, Math.PI / 2]);
    b.put(sphere(0.27, 10, 8), bronze, [wx(1.95), pegY, zm]);
    // the ribbon: two straps from the peg, narrowing to the ring (the right one a hair further out, so they never fight)
    const u0 = (i * 64 + 3) / (64 * nM), u1 = (i * 64 + 61) / (64 * nM), xb = 0.32, xt = 1.25;
    b.put(quad4([[wx(xb), ringY, zm - 0.7], [wx(xb), ringY, zm + 0.1], [wx(xt), pegY, zm - 0.05], [wx(xt), pegY, zm - 1.75]], u0, 0, u1, 1), ribbonMat);
    b.put(quad4([[wx(xb + 0.02), ringY, zm - 0.1], [wx(xb + 0.02), ringY, zm + 0.7], [wx(xt + 0.02), pegY, zm + 1.75], [wx(xt + 0.02), pegY, zm + 0.05]], u0, 0, u1, 1), ribbonMat);
    // the ring, the medal's edge and rim, and its struck face
    b.put(torus(0.42, 0.11, 14, 6), mat, [wx(0.3), ringY - 0.25, zm], [0, 0, Math.PI / 2]);
    b.put(cylinder(r, r, 0.3, 40), mat, [wx(0.3), yc, zm], [0, 0, Math.PI / 2]);
    b.put(torus(r - 0.09, 0.1, 40, 6), mat, [wx(0.46), yc, zm], [0, 0, Math.PI / 2]);
    // (the struck face sits a clear 0.04 proud of the medal's flat, so it never shimmers against it from across the room)
    b.put(disc(r - 0.03, 40, i / nM, 0, (i + 1) / nM, 1), medalFace, [wx(0.49), yc, zm], RW);
  });
  const medalHit = new Mesh(box(mspan + 9, 21, 2.6), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), 'medals-hit');
  medalHit.position = [wx(1.3), MEDALS.y - 9.5, MEDALS.zc]; medalHit.rotation = RW; medalHit.castShadow = false; medalHit.pickable = true;
  medalHit.userData = { keyId: 'medals', interactive: true, glow: 0, targetGlow: 0 }; room.add(medalHit); pickables.push(medalHit);

  // ---------- the door: a walnut casing on plinth blocks round a real opening. The four-panel slab hangs on three hinges and swings
  // OUT onto the hallway behind (click it), where a warm light waits; its light falls into the room as the door opens.
  const door = { node: null, hit: null, open: 0, target: 0, glow: null, glowMat: null };
  {
    const zc = (DOOR.z0 + DOOR.z1) / 2, dw = DOOR.z1 - DOOR.z0, c = DOOR.casing, top = DOOR.top, sb = FLOOR + 0.8, st = top - 0.2, fx = 0.7;
    // the slab is a warmer, lighter walnut than the casing, so the door reads as wood in its dim corner, not as a dark hole
    const doorWood = furn('#4a2e1a', { map: woodTexture(7, [92, 62, 38]), mapRepeat: [1, 2], roughness: 0.55, amb: 1.15 });
    // the casing, its plinth blocks and the threshold stay with the wall
    for (const z of [DOOR.z0 - c / 2, DOOR.z1 + c / 2]) { b.put(box(c, top - FLOOR, 1.0), walnut, [wx(0.5), (FLOOR + top) / 2, z], RW); b.put(box(c + 0.5, 6, 1.25), walnutDark, [wx(0.625), FLOOR + 3, z], RW); }
    b.put(box(dw + 2 * c + 0.6, c + 0.4, 1.1), walnut, [wx(0.55), top + (c + 0.4) / 2, zc], RW);
    b.put(box(dw + 2 * c + 1.6, 0.7, 1.5), walnutDark, [wx(0.75), top + c + 0.75, zc], RW);
    b.put(box(dw + 0.6, 0.35, 2.4), walnutDark, [wx(1.2), FLOOR + 0.175, zc], RW);
    // the opening's reveals (the wall's thickness, behind its face), and the hallway's threshold strip beyond them
    const jr = furn('#47474a', { roughness: 0.9, amb: 0.95 });
    for (const z of [DOOR.z0 - 0.2, DOOR.z1 + 0.2]) b.put(box(4.2, top - FLOOR, 0.4), jr, [RIGHT + 2.15, (top + FLOOR) / 2, z]);
    b.put(box(4.2, 0.4, dw), jr, [RIGHT + 2.15, top + 0.2, zc]);
    b.put(box(4.2, 0.3, dw), walnutDark, [RIGHT + 2.15, FLOOR + 0.15, zc]);
    // the slab and everything on it hang from the hinge line at the opening's back corner, and turn about it
    const pz = DOOR.z1 - 0.15, node = new Node('door'); node.position = [RIGHT, 0, pz]; room.add(node); door.node = node;
    const db = batch(), L = (p) => [p[0] - RIGHT, p[1], p[2] - pz];
    db.put(box(dw - 0.3, st - sb, fx), doorWood, L([wx(fx / 2), (st + sb) / 2, zc]), RW);
    // four panels: two tall above the lock rail, two shorter below; each a raised field inside a dark moulding
    const pw = (dw - 0.3 - 2 * 5.2 - 4) / 2, rows = [[15.5, st - 5.5], [sb + 9, 8.5]];
    for (const s of [-1, 1]) for (const [y0, y1] of rows) {
      const z = zc + s * (2 + pw / 2), ph = y1 - y0, y = (y0 + y1) / 2;
      for (const [w, h, dz, dy] of [[pw, 0.5, 0, ph / 2 - 0.25], [pw, 0.5, 0, -ph / 2 + 0.25], [0.5, ph - 1, -pw / 2 + 0.25, 0], [0.5, ph - 1, pw / 2 - 0.25, 0]]) db.put(box(w, h, 0.3), walnutDark, L([wx(fx + 0.15), y + dy, z + dz]), RW);
      db.put(box(pw - 2.2, ph - 2.2, 0.36), doorWood, L([wx(fx + 0.18), y, z]), RW);
    }
    // the lever on the latch side, pointing back toward the hinges, with a keyhole plate under it; the hinges on the hinge edge
    const hz = DOOR.z0 + 3.6, hy = 12;
    db.put(cylinder(1.05, 1.05, 0.35, 24), bronze, L([wx(fx + 0.17), hy, hz]), [0, 0, Math.PI / 2]);
    db.put(cylinder(0.3, 0.3, 1.5, 12), bronze, L([wx(fx + 1.1), hy, hz]), [0, 0, Math.PI / 2]);
    db.put(roundedBox({ w: 0.55, h: 0.55, d: 6.0, r: 0.22, seg: 2 }), bronze, L([wx(fx + 1.85), hy, hz + 2.7]));
    db.put(cylinder(0.75, 0.75, 0.25, 20), bronze, L([wx(fx + 0.12), hy - 5, hz]), [0, 0, Math.PI / 2]);
    db.put(box(0.12, 0.9, 0.3), furn('#0b0806', { amb: 0.2 }), L([wx(fx + 0.27), hy - 5, hz]));
    for (const y of [sb + 9, hy, st - 9]) { db.put(box(0.25, 4.2, 1.1), bronze, L([wx(fx + 0.12), y, DOOR.z1 - 0.7])); db.put(cylinder(0.32, 0.32, 4.2, 10), bronze, L([wx(fx + 0.25), y, DOOR.z1 - 0.05])); }
    db.build(node, 'door');
    // the hallway's light in the gap under the door (it stays at the sill as the door swings)
    b.put(box(dw - 1, sb - FLOOR - 0.35, 0.1), dim(new Material({ color: [0, 0, 0], emissive: color('#ffd2a0').map((v) => v * 1.4), unlit: true, receiveShadow: false }), 'emissive'), [wx(0.08), FLOOR + 0.35 + (sb - FLOOR - 0.35) / 2, zc], RW);
    // the door is clicked on its slab: the box turns with it
    const hit = new Mesh(box(dw - 0.3, st - sb, 2.6), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), 'door-hit');
    hit.position = L([wx(1.0), (st + sb) / 2, zc]); hit.rotation = [...RW]; hit.castShadow = false; hit.pickable = true;
    hit.userData = { keyId: 'door', interactive: true, glow: 0, targetGlow: 0 }; node.add(hit); pickables.push(hit); door.hit = hit;
    // the hallway: oak boards, warm plaster with a print at the far end, a flush light in its ceiling; only ever seen through the door
    const hw = HALL.x1 - HALL.x0, hd = HALL.z1 - HALL.z0, hcx = (HALL.x0 + HALL.x1) / 2, hcz = (HALL.z0 + HALL.z1) / 2, hh = HALL.top - FLOOR;
    add(quad(hw, hd), baked(hallFloorTexture()), [hcx, FLOOR, hcz], [-Math.PI / 2, 0, 0], 'hall-floor');
    add(quad(hd, hh), baked(hallWallTexture(true)), [HALL.x1, (HALL.top + FLOOR) / 2, hcz], [0, -Math.PI / 2, 0], 'hall-wall');
    add(quad(hw, hh), baked(hallWallTexture(false)), [hcx, (HALL.top + FLOOR) / 2, HALL.z0], [0, 0, 0], 'hall-wall');
    add(quad(hw, hh), baked(hallWallTexture(false)), [hcx, (HALL.top + FLOOR) / 2, HALL.z1], [0, Math.PI, 0], 'hall-wall');
    add(quad(hw, hd), furn('#3b3631', { amb: 1.0 }), [hcx, HALL.top, hcz], [Math.PI / 2, 0, 0], 'hall-ceiling');
    add(cylinder(3.2, 3.2, 0.4, 28), dim(new Material({ color: [0, 0, 0], emissive: color('#ffe2b8').map((v) => v * 1.8), unlit: true, receiveShadow: false }), 'emissive'), [hcx, HALL.top - 0.2, hcz], [0, 0, 0], 'hall-light');
    // a coir mat just inside the door (the door opens outward, so it never sweeps it)
    const coir = drawTexture(128, 256, (ctx, w, h) => { const r = rng(111); ctx.fillStyle = '#7a5a34'; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '40,26,12' : '170,130,80'},${0.15 + r() * 0.3})`; ctx.fillRect(r() * w, r() * h, 1, 2 + r() * 5); } ctx.strokeStyle = 'rgba(30,18,8,0.7)'; ctx.lineWidth = 6; ctx.strokeRect(5, 5, w - 10, h - 10); });
    b.put(roundedBox({ w: 10, h: 0.35, d: 26, r: 0.15, seg: 2 }), furn('#ffffff', { color: [0.85, 0.82, 0.78], map: coir, roughness: 0.95, amb: 0.85 }), [RIGHT - 9, FLOOR + 0.175, zc]);
    // the hallway's light falling through the open door onto the room's boards (a soft fan, faded in with the door)
    const fan = drawTexture(256, 256, (ctx, w, h) => { ctx.clearRect(0, 0, w, h); const g = ctx.createRadialGradient(w, h / 2, 4, w, h / 2, w); g.addColorStop(0, 'rgba(255,214,170,0.9)'); g.addColorStop(0.5, 'rgba(255,196,140,0.35)'); g.addColorStop(1, 'rgba(255,190,130,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
    door.glowMat = new Material({ color: color('#ffd8b0'), map: fan, opacity: 0, transparent: true, depthWrite: false, unlit: true, receiveShadow: false });
    door.glow = add(quad(30, dw + 6), door.glowMat, [RIGHT - 15, FLOOR + 0.05, zc], [-Math.PI / 2, 0, 0], 'door-light');
  }
  // ---------- the light switch by the door, at hand height: a cream plate with a rocker that rocks with the room's main lights
  const swZ = DOOR.z0 - DOOR.casing - 3.4, swY = 12;
  b.put(roundedBox({ w: 2.6, h: 4.0, d: 0.3, r: 0.12, seg: 2 }), furn('#e4dfd4', { roughness: 0.5, amb: 0.6 }), [wx(0.15), swY, swZ], RW);
  // its two fixing screws above and below the rocker, painted over with the plate, slots not quite level
  const screwHead = furn('#d9d3c6', { roughness: 0.45, amb: 0.6 });
  for (const [dy, a] of [[1.55, 0.3], [-1.55, -0.5]]) {
    b.put(sphere(0.17, 10, 6), screwHead, [wx(0.3), swY + dy, swZ], [0, 0, 0], [0.35, 1, 1]);
    b.put(box(0.05, 0.05, 0.26), walnutDark, [wx(0.36), swY + dy, swZ], [a, 0, 0]);
  }
  // beside it, a little lower, the AC's remote standing in its white wall holder: an LCD that reads 24°, a red power key, two grey
  {
    const rz = swZ - 5.5, plastic = furn('#e9e7e1', { roughness: 0.45, amb: 0.65 });
    b.put(roundedBox({ w: 2.6, h: 3.4, d: 1.1, r: 0.18, seg: 2 }), plastic, [wx(0.55), 7.2, rz], RW);
    b.put(roundedBox({ w: 1.9, h: 6.2, d: 0.7, r: 0.3, seg: 3 }), plastic, [wx(0.62), 9.4, rz], RW);
    const lcd = drawTexture(64, 48, (ctx, w, h) => {
      ctx.fillStyle = '#93a593'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1d2620'; ctx.font = `700 26px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('24°', w / 2 + 2, h / 2 + 2);
      ctx.fillStyle = 'rgba(29,38,32,0.7)'; ctx.fillRect(6, 6, 10, 3); ctx.fillRect(w - 16, 6, 10, 3);
    });
    b.put(quad(1.3, 0.95), furn('#ffffff', { color: [0.85, 0.88, 0.85], map: lcd, roughness: 0.2, amb: 0.75 }), [wx(1.01), 11.35, rz], RW);
    b.put(roundedBox({ w: 0.6, h: 0.32, d: 0.14, r: 0.08, seg: 2 }), furn('#a8432f', { roughness: 0.5, amb: 0.6 }), [wx(0.98), 10.2, rz - 0.42], RW);
    const key = furn('#bebbb3', { roughness: 0.5, amb: 0.6 });
    for (const dz of [0.12, 0.62]) b.put(roundedBox({ w: 0.4, h: 0.28, d: 0.12, r: 0.07, seg: 2 }), key, [wx(0.98), 10.2, rz + dz], RW);
  }
  const rocker = new Node('light-rocker'); rocker.position = [wx(0.36), swY, swZ]; rocker.rotation = [...RW]; room.add(rocker);
  const rockerMesh = new Mesh(roundedBox({ w: 1.3, h: 2.2, d: 0.34, r: 0.1, seg: 2 }), furn('#efeae0', { roughness: 0.45, amb: 0.65 }), 'light-rocker'); rockerMesh.castShadow = false; rocker.add(rockerMesh);
  const switchHit = new Mesh(box(3.4, 4.8, 1.4), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), 'lights-hit');
  switchHit.position = [wx(0.7), swY, swZ]; switchHit.rotation = [...RW]; switchHit.castShadow = false; switchHit.pickable = true;
  switchHit.userData = { keyId: 'lights', interactive: true, glow: 0, targetGlow: 0 }; room.add(switchHit); pickables.push(switchHit);

  // ---------- the split air conditioner high over the door (app/aircon): its line drops into a short run of trunking over the
  // casing. It starts running; click it and the flap closes flush and the display goes dark, click again and it swings back open.
  const aircon = buildAircon(); aircon.root.position = [RIGHT, 88, 106]; aircon.root.rotation = [0, -Math.PI / 2, 0]; room.add(aircon.root);
  for (const m of aircon.dimmable) dim(m, 'emissive');
  pickables.push(aircon.hit);

  b.build(room, 'room');

  // ---------- the road bike on the front wall behind the chair (app/bike), under a long brass display light that comes up when you
  // point at the bike. Built against a wall that faces +z, then turned round to face back across the room to the desk.
  const bikeWall = new Node('bike-wall'); bikeWall.position = [...BIKE]; bikeWall.rotation = [0, Math.PI, 0]; room.add(bikeWall);
  const bike = buildBike(); bikeWall.add(bike);
  for (const m of bike.userData.dimmable || []) dim(m, 'emissive');
  const bf = batch(), ly = 60, lz = 7;
  bf.put(cylinder(0.55, 0.55, 48, 16), bronze, [0, ly, lz], [0, 0, Math.PI / 2]);
  for (const s of [-1, 1]) { bf.put(cylinder(0.4, 0.4, 7, 10), bronze, [s * 17, ly, 3.5], [Math.PI / 2, 0, 0]); bf.put(cylinder(1.4, 1.4, 0.5, 24), bronze, [s * 17, ly, 0.25], [Math.PI / 2, 0, 0]); bf.put(sphere(0.75, 12, 8), bronze, [s * 24, ly, lz]); }
  bf.build(bikeWall, 'bike-light-fixture');
  const bikeLightE = color('#ffd6a3').map((v) => v * 1.9);
  const bikeLight = new Material({ color: [0, 0, 0], emissive: [...bikeLightE], unlit: true, receiveShadow: false });
  const bikeStrip = new Mesh(box(44, 0.3, 0.8), bikeLight, 'bike-light'); bikeStrip.position = [0, ly - 0.6, lz]; bikeStrip.castShadow = false; bikeWall.add(bikeStrip);
  const bikeHit = new Mesh(box(92, 56, 30), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), 'bike-hit');
  bikeHit.position = [0, 27, 15]; bikeHit.castShadow = false; bikeHit.pickable = true; bikeHit.userData = { keyId: 'bike', interactive: true, glow: 0, targetGlow: 0 };
  bikeWall.add(bikeHit); pickables.push(bikeHit);

  // ---------- the wall clock right of the bike (app/wallclock): it keeps the visitor's own time
  const clock = buildWallClock(); clock.root.position = [CLOCK[0], CLOCK[1], FRONT]; clock.root.rotation = [0, Math.PI, 0]; room.add(clock.root);
  for (const m of clock.dimmable) dim(m, 'emissive');
  // ---------- under it, by the door: the shoe rack (app/shoerack): running shoes on the top tier, socks, sandal jepit below
  const shoeRack = buildShoeRack(); shoeRack.root.position = [CLOCK[0], FLOOR, FRONT]; shoeRack.root.rotation = [0, Math.PI, 0]; room.add(shoeRack.root);
  for (const m of shoeRack.dimmable) dim(m, 'emissive');

  // ---------- on the desk: the machine (app/pc: a full-size dual-glass case, its parts lit warm yellow) and a pair of speakers.
  // It stands at the front left, glass side toward the keyboard, because the three monitors take the back of the desk.
  const machine = buildPC(); machine.root.position = [...PC_POS]; machine.root.rotation = [0, PC_RY, 0]; root.add(machine.root);
  const pcHit = machine.hit; pickables.push(pcHit);

  // (app/speakers: walnut studio monitors, left and right mirrored; the right one carries the amplifier's knob and switch on its back)
  const speakers = SPEAKERS.map(([x, z, ry], si) => {
    const s = buildSpeaker(si ? 1 : -1, 40 + si);
    s.node.position = [x, 0, z]; s.node.rotation = [0, ry, 0]; root.add(s.node);
    pickables.push(...s.parts);
    for (const m of s.dimmable) dim(m, 'emissive');
    return { node: s.node, cab: s.cab, cone: s.cone, cap: s.cap, led: s.led, coneZ: s.cone.position[2], capZ: s.cap.position[2], plug: s.plug, power: s.power, aux: s.aux };
  });
  // the cabling (app/cables) takes the speakers' sockets in world space: each one's posts, the right one's mains inlet and AUX jack
  {
    const W = ([x, z, ry], p) => p && [x + p[0] * Math.cos(ry) + p[2] * Math.sin(ry), p[1], z - p[0] * Math.sin(ry) + p[2] * Math.cos(ry)];
    room.add(buildCables(pcPorts(PC_POS, PC_RY), speakers.map((s, i) => ({ plug: W(SPEAKERS[i], s.plug), power: W(SPEAKERS[i], s.power), aux: W(SPEAKERS[i], s.aux), back: [-Math.sin(SPEAKERS[i][2]), 0, -Math.cos(SPEAKERS[i][2])] }))));
  }

  // ---------- light level and per-frame life
  // the room's painted-in light follows the intro's level, raised by the main lights when they're on (the downlights come up
  // with them); `mains` eases 0 → 1 so the switch fades the room rather than snapping it
  let level = 0, mains = 0, mainsOn = false;
  const setLevel = (v) => {
    level = v; const f = (0.22 + 0.78 * v) * (1 + 0.38 * mains);
    for (const [mat, key, base] of dimmers) mat[key] = base.map((c) => c * f);
    for (let i = 0; i < 3; i++) downMat.emissive[i] = downE[i] * (0.22 + 0.78 * v) * (0.45 + 1.6 * mains);
  };
  const toggleLights = () => { mainsOn = !mainsOn; return mainsOn; };
  const toggleDoor = () => { door.target = door.target ? 0 : 1; return door.target === 1; };
  const ease = (u, dt, k = 12) => { u.glow += (u.targetGlow - u.glow) * (1 - Math.exp(-k * dt)); return u.glow; };
  const update = (dt, time, world) => {
    const lv = world.lightLevel || 0;
    // the machine idles: a slow breath in its lights, brighter when you reach for it
    ease(pcHit.userData, dt); machine.update(dt, time, lv);
    // the floor lamp fades out or up over about a third of a second, its pools with it
    const lt = lamp.on ? 1 : 0; if (lamp.p !== lt) lamp.p += Math.sign(lt - lamp.p) * Math.min(Math.abs(lt - lamp.p), dt * 3);
    floorLamp.update(dt, time, lv, lamp.p); ease(lamp.hit.userData, dt);
    for (const m of lamp.pools) m.material.opacity = lamp.p * (0.22 + 0.78 * lv);
    aircon.update(dt, time, lv);
    clock.update();
    // the speakers move with the music; the LED says whether it is on
    const on = !!world.musicOn;
    const beat = on ? Math.pow(Math.max(0, Math.sin(time * Math.PI * 2 * 1.9)), 8) : 0;
    for (const s of speakers) {
      const sg = ease(s.node.userData, dt);
      s.cone.position[2] = s.coneZ + beat * 0.14; s.cap.position[2] = s.capZ + beat * 0.14;
      s.led.material.emissiveIntensity += ((on ? 2.2 : 0.08) - s.led.material.emissiveIntensity) * (1 - Math.exp(-6 * dt));
      s.cab.emissive[0] = sg * 0.16; s.cab.emissive[1] = sg * 0.1; s.cab.emissive[2] = sg * 0.04;
    }
    // a book you point at slides a little way out of the shelf
    for (const bk of books) { const k = ease(bk.userData, dt, 10); bk.position[2] = bk.userData.restZ + k * 2.6; }
    // the bike's display light wakes with the room, and comes up a little when you point at the bike
    const bl = (0.22 + 0.78 * lv) * (1 + 0.6 * ease(bikeHit.userData, dt, 8));
    for (let i = 0; i < 3; i++) bikeLight.emissive[i] = bikeLightE[i] * bl;
    // the main lights fade up or down over about half a second, the rocker flips with them, the switch plate glows on hover
    const mt = mainsOn ? 1 : 0;
    if (mains !== mt) { mains += Math.sign(mt - mains) * Math.min(Math.abs(mt - mains), dt * 2.2); setLevel(level); }
    rocker.rotation[2] = (mainsOn ? -1 : 1) * 0.16; ease(switchHit.userData, dt);
    // the door swings out to its stop or back shut (eased at both ends), and the hallway's light fans into the room with it
    if (door.open !== door.target) door.open += Math.sign(door.target - door.open) * Math.min(Math.abs(door.target - door.open), dt / 1.3);
    const ds = door.open * door.open * (3 - 2 * door.open);
    door.node.rotation[1] = -DOOR_SWING * ds; door.glowMat.opacity = 0.75 * ds * (0.22 + 0.78 * lv); ease(door.hit.userData, dt);
    // the smoke detector's LED blinks once every few seconds, as they do
    smokeLed.emissiveIntensity = (time % 4.5) < 0.12 ? 2.4 : 0.15;
    // the candle: a flame that never quite holds still (two beats, one quick, one slow), brightest when it stretches
    const fl = 1 + 0.09 * Math.sin(time * 13.1 + Math.sin(time * 3.7) * 2) + 0.05 * Math.sin(time * 29.3);
    flameMesh.scale[1] = 1.9 * fl; flameMesh.scale[0] = flameMesh.scale[2] = 0.8 / Math.sqrt(fl);
    for (let i = 0; i < 3; i++) flame.emissive[i] = flameE[i] * (0.22 + 0.78 * lv) * (0.85 + 0.25 * (fl - 0.86));
    // a curtain the cursor brushes past swings and ripples, then settles
    for (const c of curtains) { ease(c.mesh.userData, dt); c.update(dt, time); }
    city.update(dt, time);
  };
  setLevel(0);
  // the camera keeps clear of the bike on the front wall (it stands ~30 out from it), and the target may reach the bike and the medals
  const bounds = { camera: { min: [LEFT + 6, 1.2, -24.5], max: [RIGHT - 6, TOP - 6, FRONT - 33] }, target: { min: [-118, -4, -20], max: [118, 70, FRONT - 8] } };
  return { root: room, pc: pcHit, bike: bikeHit, chair: chairHit, medals: medalHit, curtains: curtains[0].mesh, lights: switchHit, door: door.hit, aircon: aircon.hit, speakers: speakers.map((s) => s.node), books, pickables, bounds, setLevel, update, toggleCurtains, toggleLights, toggleDoor, toggleAircon: aircon.toggle, toggleFloorLamp, floorlamp: lamp.hit };
}
