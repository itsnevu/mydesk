// The left wall (x = -120) between the corner plant and the front: a warm neon "ship it." over the framed print (click to
// switch it), a monstera in a floor pot in front of the print, and a pull-up + dip power tower against the wall.
// Units: 1 unit ≈ 19.5 mm; the floor is y = -40 (the desk top is y = 0).
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, cylinder, sphere, torus, plane, cone } from 'engine/geometry';
import { drawTexture } from 'engine/textures';
import { color } from 'engine/math';
import { flatten } from 'app/bake';
import { tube as sweep } from 'app/cables';

const WALL = -120, FLOOR = -40;
const SCRIPT = '"Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive';
const rnd = (() => { let a = 4242; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();

// a monstera leaf: heart-shaped, deep splits from the edge toward the midrib, a few holes; base at the top of the canvas
function monsteraTexture() {
  return drawTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#3f8a3e'); g.addColorStop(1, '#1f5a2a'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(w / 2, 22);
    ctx.bezierCurveTo(w * 0.15, -4, -4, h * 0.42, w * 0.18, h * 0.72); ctx.bezierCurveTo(w * 0.3, h * 0.9, w * 0.45, h * 0.98, w / 2, h - 4);
    ctx.bezierCurveTo(w * 0.55, h * 0.98, w * 0.7, h * 0.9, w * 0.82, h * 0.72); ctx.bezierCurveTo(w + 4, h * 0.42, w * 0.85, -4, w / 2, 22); ctx.fill();
    ctx.strokeStyle = 'rgba(190,230,150,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w / 2, 24); ctx.lineTo(w / 2, h - 10); ctx.stroke();
    ctx.globalCompositeOperation = 'destination-out'; ctx.lineCap = 'round';
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) {
      const y0 = h * (0.28 + k * 0.13), y1 = y0 + 18 + k * 4;
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(w / 2 + s * w * 0.6, y1 + 10); ctx.lineTo(w / 2 + s * (w * 0.2 - k * 3), y0); ctx.stroke();
      if (k < 4) { ctx.beginPath(); ctx.ellipse(w / 2 + s * w * 0.12, y0 + 14, 5, 9, s * 0.5, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalCompositeOperation = 'source-over';
  }, { repeat: false });
}
// an original pixel-art landscape in the manner of a Minecraft painting: blocky hills at dusk, a square sun, an oak, a
// creeper in the grass, a plank frame. 32 × 40 "pixels", each drawn as a block so it stays crisp when filtered
function minecraftTexture() {
  const PW = 32, PH = 40, S = 16;
  return drawTexture(PW * S, PH * S, (ctx) => {
    const r = (() => { let a = 77; return () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff; }; })();
    const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x * S, y * S, S, S); };
    const sky = ['#2b2350', '#3b2f63', '#563a73', '#7a4775', '#a3566c', '#cf7360', '#ec9a5c', '#f6c066'];
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) px(x, y, sky[Math.min(sky.length - 1, Math.floor(y / 3))]);
    for (let y = 15; y < 19; y++) for (let x = 20; x < 24; x++) px(x, y, y === 15 || x === 20 ? '#ffe9a0' : '#fff4c8');      // the sun
    for (const [cx, cy, n] of [[4, 6, 6], [15, 4, 5], [25, 9, 4]]) for (let i = 0; i < n; i++) { px(cx + i, cy, '#d9c7e6'); if (i > 0 && i < n - 1) px(cx + i, cy - 1, '#ece0f2'); }
    // far hills, near hills (grass top, dirt below), stone at the bottom
    let hy = 26; for (let x = 0; x < PW; x++) { hy = Math.max(22, Math.min(28, hy + Math.round((r() - 0.5) * 2))); for (let y = hy; y < PH; y++) px(x, y, y === hy ? '#4b5f7a' : '#3a4a63'); }
    let gy = 30; for (let x = 0; x < PW; x++) { gy = Math.max(28, Math.min(32, gy + Math.round((r() - 0.5) * 2))); for (let y = gy; y < PH; y++) px(x, y, y === gy ? (r() < 0.3 ? '#6fa83f' : '#5e9a36') : y === gy + 1 ? '#5e9a36' : y < 36 ? (r() < 0.2 ? '#7a5534' : '#8b6240') : (r() < 0.3 ? '#6e6e6e' : '#7f7f7f')); }
    // an oak on the left
    for (let y = 23; y < 30; y++) px(5, y, '#6b4a2a');
    for (let y = 18; y < 24; y++) for (let x = 2; x < 9; x++) if (!((y === 18 || y === 23) && (x === 2 || x === 8))) px(x, y, r() < 0.35 ? '#3d7a2e' : '#2f6624');
    // a creeper on the right
    const cx = 24; for (let y = 22; y < 30; y++) for (let x = cx; x < cx + 3; x++) px(x, y, r() < 0.4 ? '#5fb04f' : '#4b9a3e');
    for (let y = 18; y < 22; y++) for (let x = cx - 0.5 + 0; x < cx + 3.5; x++) px(Math.floor(x), y, r() < 0.4 ? '#6cc05a' : '#58aa48');
    px(cx, 19, '#111'); px(cx + 2, 19, '#111'); px(cx + 1, 20, '#111'); px(cx, 21, '#111'); px(cx + 2, 21, '#111');
    for (const x of [cx - 1, cx + 3]) for (let y = 30; y < 31; y++) px(x, y - 1, '#4b9a3e');
    // plank frame
    for (let x = 0; x < PW; x++) for (const y of [0, PH - 1]) px(x, y, (x + y) % 4 ? '#9c7a48' : '#7d5f36');
    for (let y = 0; y < PH; y++) for (const x of [0, PW - 1]) px(x, y, (x + y) % 4 ? '#9c7a48' : '#7d5f36');
  });
}

// the tsuka's wrap: black silk ito crossing in diamonds over white samegawa (u runs around the grip, v along it)
function itoTexture() {
  return drawTexture(128, 512, (ctx, w, h) => {
    ctx.fillStyle = '#e9e3d4'; ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 900; k++) { ctx.fillStyle = 'rgba(190,180,160,0.5)'; ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 1.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#111'; const step = h / 3;
    for (let k = 0; k < 3; k++) { const y = k * step; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + step * 0.5); ctx.lineTo(w, y + step * 0.72); ctx.lineTo(0, y + step * 0.22); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(w, y); ctx.lineTo(0, y + step * 0.5); ctx.lineTo(0, y + step * 0.72); ctx.lineTo(w, y + step * 0.22); ctx.closePath(); ctx.fill(); }
  }, { repeat: true });
}
// the faint warm light the neon throws on the wall around it
function washTexture() {
  return drawTexture(256, 128, (ctx, w, h) => { const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.5); g.addColorStop(0, 'rgba(255,170,70,0.9)'); g.addColorStop(0.5, 'rgba(255,150,50,0.3)'); g.addColorStop(1, 'rgba(255,140,40,0)'); ctx.setTransform(1, 0, 0, 0.5, 0, h / 4); ctx.fillStyle = g; ctx.fillRect(0, 0, w, w); });
}
// a strip of cloth hanging over a bar: a path across the bar in (z, y), stretched along x from x0 to x1, a few soft folds
function clothStrip(path, x0, x1, segX = 10) {
  const pos = [], nor = [], uv = [], idx = [], n = path.length;
  for (let i = 0; i < n; i++) {
    const [z, y] = path[i], [zp, yp] = path[Math.max(0, i - 1)], [zn, yn] = path[Math.min(n - 1, i + 1)];
    const tz = zn - zp, ty = yn - yp, tl = Math.hypot(tz, ty) || 1, hang = Math.min(1, Math.max(0, (path[1][1] - y) / 4));
    for (let k = 0; k <= segX; k++) {
      const x = x0 + ((x1 - x0) * k) / segX, fold = hang * 0.09 * Math.sin(k * 1.9 + i * 0.4);
      pos.push(x, y, z + fold * Math.sign(z - path[Math.floor(n / 2)][0] || 1)); nor.push(0, tz / tl, -ty / tl); uv.push(k / segX, i / (n - 1));
    }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < segX; k++) { const q = i * (segX + 1) + k; idx.push(q, q + 1, q + segX + 1, q + 1, q + segX + 2, q + segX + 1); }
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], pos[i + k]); max[k] = Math.max(max[k], pos[i + k]); }
  return { positions: new Float32Array(pos), normals: new Float32Array(nor), uvs: new Float32Array(uv), indices: new Uint16Array(idx), bounds: { min, max } };
}
// ---------- neon: the tube (crisp) and its halo (blurred), both drawn from the same script line
function neonTexture(blur) {
  return drawTexture(1024, 384, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.font = `italic 700 210px ${SCRIPT}`;
    if (blur) { ctx.filter = 'blur(28px)'; ctx.fillStyle = 'rgba(255,165,55,0.95)'; ctx.fillText('ship it.', w / 2, h / 2); ctx.filter = 'none'; return; }
    ctx.fillStyle = '#fff2d2'; ctx.fillText('ship it.', w / 2, h / 2);
    ctx.globalCompositeOperation = 'source-atop'; ctx.strokeStyle = 'rgba(255,150,40,0.95)'; ctx.lineWidth = 12; ctx.strokeText('ship it.', w / 2, h / 2); ctx.globalCompositeOperation = 'source-over';
  });
}

export function buildLeftWall() {
  const root = new Node('left-wall');
  const M = {
    acrylic: new Material({ color: [0.9, 0.92, 0.95], roughness: 0.05, opacity: 0.12, transparent: true, depthWrite: false, fresnel: 0.4, fresnelColor: color('#ffffff') }),
    steelPin: new Material({ color: color('#b7b9bc'), roughness: 0.3, metalness: 0.8 }),
    neon: new Material({ color: [1, 1, 1], map: neonTexture(false), unlit: true, transparent: true, depthWrite: false, receiveShadow: false }),
    halo: new Material({ color: [1, 1, 1], map: neonTexture(true), unlit: true, transparent: true, depthWrite: false, receiveShadow: false, opacity: 0.85 }),
    wash: new Material({ color: [1, 1, 1], map: washTexture(), unlit: true, transparent: true, depthWrite: false, receiveShadow: false, opacity: 0.3 }),
    pot: new Material({ color: color('#d8d2c6'), roughness: 0.55 }),
    soil: new Material({ color: color('#2a1d14'), roughness: 1 }),
    stem: new Material({ color: color('#4a6b2e'), roughness: 0.7 }),
    leaf: new Material({ color: [1, 1, 1], map: monsteraTexture(), roughness: 0.45, emissive: [0.03, 0.06, 0.03], transparent: true, depthWrite: false, doubleSide: true }),
    leafB: new Material({ color: [0.85, 0.95, 0.85], map: monsteraTexture(), roughness: 0.45, emissive: [0.03, 0.06, 0.03], transparent: true, depthWrite: false, doubleSide: true }),
    dbHead: new Material({ color: color('#141414'), roughness: 0.7 }),
    dbFace: new Material({ color: color('#8f9296'), roughness: 0.3, metalness: 0.8 }),
    knurl: new Material({ color: color('#7d8085'), roughness: 0.5, metalness: 0.8 }),
    frame: new Material({ color: color('#18181a'), roughness: 0.4, metalness: 0.55, fresnel: 0.2, fresnelColor: color('#fff1d8'), emissive: color('#0d0d0e') }),
    foam: new Material({ color: color('#141414'), roughness: 0.85 }),
    grip: new Material({ color: color('#1f1f20'), roughness: 0.95 }),
    bar: new Material({ color: color('#c4c6c9'), roughness: 0.25, metalness: 0.85, emissive: color('#1a1a1c') }),
    rubber: new Material({ color: color('#0b0b0b'), roughness: 0.95 }),
    towel: new Material({ color: color('#c9b79c'), roughness: 1, doubleSide: true }),
  };
  const add = (parent, geo, mat, p, r, s) => { const m = new Mesh(geo, mat); m.position = p; if (r) m.rotation = r; if (s) m.scale = s; parent.add(m); return m; };
  // a straight rod from a to b (cylinder along y, turned to the segment)
  const rod = (parent, a, b, r, mat, seg = 12) => { const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(...d); return add(parent, cylinder(r, r, len, seg), mat, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [Math.atan2(d[2], d[1]), 0, -Math.asin(d[0] / len)]); };

  // ---------- neon "ship it." over the print (z 34..58, centred z 46), on a clear acrylic backer held off the wall by four pins
  const neon = new Node('neon'); neon.position = [WALL, 50, 25]; root.add(neon);
  add(neon, box(0.25, 15.5, 40), M.acrylic, [1.2, 0, 0]).renderOrder = 10;
  for (const [y, z] of [[7, -19], [7, 19], [-7, -19], [-7, 19]]) add(neon, cylinder(0.25, 0.25, 1.2, 10), M.steelPin, [0.6, y, z], [0, 0, Math.PI / 2]);
  const wash = add(neon, box(0.02, 34, 80), M.wash, [0.12, 0, 0]); wash.castShadow = false; wash.renderOrder = 10;
  const halo = add(neon, box(0.02, 19.5, 52), M.halo, [0.25, 0, 0]); halo.castShadow = false; halo.renderOrder = 11;
  const tube = add(neon, box(0.02, 15, 40), M.neon, [1.45, 0, 0]); tube.castShadow = false; tube.renderOrder = 12;
  const neonHit = add(neon, box(2.5, 16, 41), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), [1.2, 0, 0]);
  neonHit.castShadow = false; neonHit.pickable = true; neonHit.name = 'neon-hit';
  neonHit.userData = { keyId: 'neon', interactive: true, glow: 0, targetGlow: 0 };

  // ---------- a Minecraft-style pixel painting in the middle of the free wall (y 2..38, z 11..39)
  const paint = add(root, box(0.6, 36, 28), new Material({ color: [1, 1, 1], map: minecraftTexture(), roughness: 0.8, emissive: [0.12, 0.12, 0.12], emissiveMap: minecraftTexture() }), [WALL + 1.35, 20, 25]);
  paint.castShadow = false;

  // ---------- monstera in a floor pot in front of the painting, leaning into the room (clear of the wall, the rack, the tower)
  const mon = new Node('monstera'); mon.position = [-108, FLOOR, 71]; root.add(mon);
  add(mon, cylinder(6.8, 5.2, 13, 32), M.pot, [0, 6.5, 0]);
  add(mon, torus(6.7, 0.35, 32, 6), M.pot, [0, 13, 0]);
  add(mon, cylinder(6.3, 6.3, 0.4, 28), M.soil, [0, 12.5, 0]);
  const leafGeo = plane(1, 1, 6);
  for (let k = 0; k < 10; k++) {
    // yaw spread toward the room (sin ≥ 0: away from the wall), a few standing tall near the middle
    const yaw = 0.8 + (k / 9) * 1.55 + (rnd() - 0.5) * 0.15, tall = k % 3 === 1, lean = tall ? 0.25 + rnd() * 0.15 : 0.6 + rnd() * 0.3, len = tall ? 24 + rnd() * 6 : 15 + rnd() * 8;
    const tip = [Math.sin(yaw) * Math.sin(lean) * len, 12.5 + Math.cos(lean) * len, Math.cos(yaw) * Math.sin(lean) * len];
    rod(mon, [Math.sin(yaw) * 1.5, 12.5, Math.cos(yaw) * 1.5], tip, 0.3, M.stem, 8);
    const size = 8 + rnd() * 4, turn = new Node('leaf-turn'); turn.position = tip; turn.rotation = [0, yaw, 0]; mon.add(turn); const g = new Node('leaf'); turn.add(g); g.rotation = [tall ? 0.1 + rnd() * 0.2 : 0.2 + rnd() * 0.25, 0, (rnd() - 0.5) * 0.4];
    const lf = add(g, leafGeo, rnd() < 0.5 ? M.leaf : M.leafB, [0, 0, size * 0.48], null, [size * 0.95, 1, size]); lf.renderOrder = 6;
  }
  // ---------- pull-up + dip tower against the wall (local: x out from the wall, y up from the floor, z along the wall).
  // Every member is placed by its ends so the joints meet: floor rails, uprights, braces, the top frame and the bar.
  const tw = new Node('power-tower'); tw.position = [WALL, FLOOR, 105]; root.add(tw);
  const T = 2.6, ZW = 22, XU = 8, TOP = 107, DY = 56, ZD = 19.2;
  const steel = (w, h, d) => roundedBox({ w, h, d, r: Math.min(0.35, w / 3, h / 3, d / 3), seg: 2, uvTopOnly: false });
  const beamX = (x0, x1, y, z, h = T, d = T, m = M.frame) => add(tw, steel(x1 - x0, h, d), m, [(x0 + x1) / 2, y, z]);
  const beamZ = (z0, z1, x, y, w = T, h = T, m = M.frame) => add(tw, steel(w, h, z1 - z0), m, [x, y, (z0 + z1) / 2]);
  const beamY = (y0, y1, x, z, w = T, d = T, m = M.frame) => add(tw, steel(w, y1 - y0, d), m, [x, (y0 + y1) / 2, z]);
  const bolt = (p, axis) => add(tw, cylinder(0.34, 0.34, 0.22, 6), M.bar, p, axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, Math.PI / 2]);
  for (const sz of [-1, 1]) {
    const z = sz * ZW;
    beamX(1, 47, 1.1, z, 2.2);                                                       // floor rail
    for (const x of [2.2, 45.8]) add(tw, cylinder(1.5, 1.6, 0.5, 14), M.rubber, [x, 0.25, z]);
    beamY(2.2, TOP + T / 2, XU, z);                                                  // upright
    beamX(XU - T / 2, 34, TOP, z);                                                   // pull-up arm
    // dip station: a bracket off the upright, the arm forward, a foam grip on its end, the elbow pad above on a post
    beamZ(Math.min(z, sz * ZD), Math.max(z, sz * ZD), XU + T / 2 + 0.8, DY, 1.6, 1.8);
    beamX(XU + T / 2, 31, DY, sz * ZD, 1.8, 1.8);
    add(tw, cylinder(1.0, 1.0, 8, 16), M.grip, [27, DY, sz * ZD], [0, 0, Math.PI / 2]);
    beamY(DY + 0.9, DY + 5, 13, sz * ZD, 1.6, 1.6);
    add(tw, roundedBox({ w: 12, h: 2.4, d: 4.6, r: 0.9, seg: 3 }), M.foam, [15, DY + 6.2, sz * ZD]);
    // black caps on the open tube ends; bolt heads on the outside of each joint
    add(tw, roundedBox({ w: 0.35, h: T + 0.12, d: T + 0.12, r: 0.1, seg: 2 }), M.rubber, [34.1, TOP, z]);
    add(tw, roundedBox({ w: 0.35, h: 2.32, d: T + 0.12, r: 0.1, seg: 2 }), M.rubber, [47.1, 1.1, z]);
    for (const y of [TOP - 0.7, TOP + 0.7, DY - 0.5, DY + 0.5, 50 - 0.5, 50 + 0.5, 2.2 + 0.9]) bolt([XU, y, z + sz * (T / 2 + 0.1)], 'z');
    for (const y of [TOP, DY]) bolt([XU + T / 2 + 0.1, y, z - sz * 0.6], 'x');
  }
  beamZ(-ZW - T / 2, ZW + T / 2, 2.2, 1.1, T, 2.2);                                   // back floor rail
  beamZ(-ZW + T / 2, ZW - T / 2, XU, TOP);                                            // top crossbar
  beamZ(-ZW + T / 2, ZW - T / 2, XU, 50);                                             // mid crossbar
  beamY(50 + T / 2, TOP - T / 2, XU, 0, 2.2, 2.2);                                    // spine for the back pad
  add(tw, roundedBox({ w: 2.4, h: 24, d: 14, r: 1, seg: 3 }), M.foam, [XU + T / 2 + 1.2, 75, 0]);
  // the straight pull-up bar under the arms' ends, with foam grips at the wide ends
  add(tw, cylinder(0.65, 0.65, 2 * ZW + 6, 20), M.bar, [33, TOP - T / 2 - 0.65, 0], [Math.PI / 2, 0, 0]);
  for (const sz of [-1, 1]) add(tw, cylinder(0.95, 0.95, 6, 16), M.grip, [33, TOP - T / 2 - 0.65, sz * (ZW + 0.5)], [Math.PI / 2, 0, 0]);
  // a towel over the right dip arm
  add(tw, clothStrip([[ZD + 1.18, DY - 8.2], [ZD + 1.12, DY - 4.4], [ZD + 1.06, DY - 0.6], [ZD + 1.0, DY + 0.55], [ZD + 0.55, DY + 1.05], [ZD, DY + 1.13], [ZD - 0.55, DY + 1.05], [ZD - 1.0, DY + 0.55], [ZD - 1.06, DY - 0.6], [ZD - 1.12, DY - 3.6], [ZD - 1.2, DY - 6.6]], 20.5, 27.5), M.towel, [0, 0, 0]);
  // click volume over the whole tower
  const towerHit = add(tw, box(48, TOP + 4, 2 * ZW + 6), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), [24, (TOP + 4) / 2, 0]);
  towerHit.castShadow = false; towerHit.pickable = true; towerHit.name = 'tower-hit';
  towerHit.userData = { keyId: 'pullup', interactive: true, glow: 0, targetGlow: 0 };
  // ---------- a two-tier hex dumbbell rack on the floor along the wall: a full set of pairs, 2.5–25 kg, at real size
  // (a 25 kg head is ~22 cm across). Local: x out from the wall, y up from the floor, z along the wall (z 1..55 in the room).
  const rk = new Node('dumbbell-rack'); rk.position = [WALL, FLOOR, 36]; root.add(rk);
  const RL = 54, LOW = { x: 12.5, y: 8 }, HIGH = { x: 9, y: 22.5 };
  for (const sz of [-1, 1]) {                                                                   // the two A-frame ends
    const z = sz * (RL / 2 - 1.2);
    add(rk, box(22, 1.8, 2.4), M.frame, [11, 0.9, z]);
    add(rk, box(2.2, 23, 2.2), M.frame, [HIGH.x, 1.8 + 11.5, z]); add(rk, box(2.2, 8.4, 2.2), M.frame, [LOW.x, 1.8 + 4.2, z]);
    for (const x of [1.5, 20.5]) add(rk, cylinder(1.1, 1.2, 0.5, 12), M.rubber, [x, 0.25, z]);
  }
  for (const t of [LOW, HIGH]) { add(rk, box(1.6, 0.9, RL), M.frame, [t.x - 2.2, t.y, 0]); add(rk, box(1.6, 0.9, RL), M.frame, [t.x + 2.2, t.y, 0]); }
  // one dumbbell: hex heads (radius and thickness grow with the weight), a knurled chrome handle along x
  const dumbbell = (t, z, kg) => {
    const r = 2.0 + kg * 0.145, hw = 0.9 + kg * 0.09, hl = 6.6;
    const d = new Node('dumbbell'); d.position = [t.x, t.y + 0.45 + r * 0.87, z]; d.rotation = [0, 0, Math.PI / 2]; rk.add(d);
    for (const s of [-1, 1]) {
      add(d, cylinder(r, r, hw * 2, 6), M.dbHead, [0, s * (hl / 2 + hw), 0], [0, Math.PI / 6, 0]);
      add(d, cylinder(r * 0.78, r * 0.78, 0.06, 6), M.dbFace, [0, s * (hl / 2 + hw * 2 + 0.03), 0], [0, Math.PI / 6, 0]);
    }
    add(d, cylinder(0.6, 0.6, hl + 0.2, 16), M.bar, [0, 0, 0]);
    for (let k = -2; k <= 2; k++) add(d, torus(0.62, 0.05, 16, 4), M.knurl, [0, k * 0.9, 0]);
    return r;
  };
  for (const [kgs, t] of [[[2.5, 5, 7.5, 10, 12.5], HIGH], [[15, 17.5, 20, 22.5, 25], LOW]]) {
    let z = -RL / 2 + 2.6;
    for (const kg of kgs) { const r = 2.0 + kg * 0.145; dumbbell(t, z + r, kg); z += 2 * r + 0.7; }
  }
  root.traverse((n) => { if (n.geometry && n.material?.transparent) n.castShadow = false; });
  // ---------- two katana above the neon, edge up, handles to the viewer's left (+z), on a dark walnut wall rack
  // (a katana is ~100 cm: a 70 cm curved saya, a 25 cm tsuka). Each is built along the wall from its kojiri to the kashira.
  const kr = new Node('katana-rack'); kr.position = [WALL, 0, 25]; root.add(kr);
  const KM = {
    rack: new Material({ color: color('#5a3720'), roughness: 0.45, metalness: 0.05, emissive: color('#5a3720').map((v) => v * 0.18) }),
    felt: new Material({ color: color('#5a1414'), roughness: 1 }),
    lacquerBlack: new Material({ color: color('#0b0a0a'), roughness: 0.12, metalness: 0.3, fresnel: 0.45, fresnelColor: color('#fff1d8'), emissive: color('#050404') }),
    lacquerRed: new Material({ color: color('#6e0f12'), roughness: 0.14, metalness: 0.25, fresnel: 0.45, fresnelColor: color('#ffd9c8'), emissive: color('#1a0304') }),
    ito: new Material({ color: [1, 1, 1], map: itoTexture(), mapRepeat: [1, 1], roughness: 0.8 }),
    gold: new Material({ color: color('#c79a4a'), roughness: 0.3, metalness: 0.85, fresnel: 0.3, fresnelColor: color('#ffe6b0'), emissive: color('#2a1c08') }),
    iron: new Material({ color: color('#2b2a28'), roughness: 0.4, metalness: 0.8 }),
    cord: new Material({ color: color('#c9a64a'), roughness: 0.8 }),
  };
  // the rack: no back panel, just two walnut arms off small wall plates, each with two felt-lined cradles
  for (const sz of [-1, 1]) {
    add(kr, roundedBox({ w: 0.6, h: 12.2, d: 3.2, r: 0.25, seg: 2 }), KM.rack, [0.3, 67.3, sz * 15]);
    for (const y of [61.75, 72.85]) add(kr, sphere(0.3, 12, 8), KM.gold, [0.62, y, sz * 15], null, [0.45, 1, 1]);
    for (const y of [64.2, 71.4]) {
      add(kr, roundedBox({ w: 4.4, h: 1.4, d: 1.8, r: 0.35, seg: 2 }), KM.rack, [2.6, y - 1.3, sz * 15]);
      add(kr, roundedBox({ w: 0.8, h: 1.6, d: 1.8, r: 0.3, seg: 2 }), KM.rack, [4.6, y - 0.2, sz * 15]);
      add(kr, box(1.6, 0.25, 1.7), KM.felt, [3.3, y - 0.52, sz * 15]);
    }
  }
  // one sword lying along z with a gentle curve (sori) up toward the tip, the cutting edge up
  const katana = (y, saya) => {
    // one continuous curve from the kojiri, through the saya's mouth, down along the tsuka to the kashira; the saya and the
    // tsuka are each a single swept tube along it, so there are no seams
    const Lsaya = 36, Ltsuka = 13, z0 = -26, sori = 1.7, x = 3.4, T1 = 1 + Ltsuka / Lsaya;
    const at = (t) => [x, y + sori * (3.6 * t * (1 - t) + 0.3 * t), z0 + t * Lsaya];
    const tilt = (t) => Math.atan2(Lsaya, sori * (3.6 * (1 - 2 * t) + 0.3));
    const ring = (t, dz, geo, mat) => { const p = at(t + dz / Lsaya); add(kr, geo, mat, p, [tilt(t + dz / Lsaya), 0, 0]); };
    const pts = (t0, t1, n) => Array.from({ length: n + 1 }, (_, k) => at(t0 + (t1 - t0) * k / n));
    add(kr, sweep(pts(0, 1, 32), 0.62, 20, 0), saya, [0, 0, 0]);
    add(kr, sphere(0.62, 16, 10), saya, at(0), null, [1, 1, 0.6]);
    ring(0, 0.6, cylinder(0.66, 0.66, 1.1, 20), KM.gold);
    ring(1, -0.3, cylinder(0.68, 0.68, 0.6, 20), KM.gold);
    { const p = at(1 - 6 / Lsaya); add(kr, roundedBox({ w: 0.5, h: 0.5, d: 1.2, r: 0.15, seg: 2 }), saya, [x, p[1] - 0.75, p[2]]); }
    ring(1, 0.25, cylinder(0.5, 0.55, 0.5, 16), KM.gold);
    ring(1, 0.65, cylinder(1.65, 1.65, 0.28, 36), KM.iron);
    { const p = at(1 + 0.65 / Lsaya); add(kr, torus(1.6, 0.08, 36, 4), KM.gold, p, [tilt(1 + 0.65 / Lsaya), 0, 0]); }
    for (const dz of [0.45, 0.85]) ring(1, dz, cylinder(0.72, 0.72, 0.1, 20), KM.gold);
    ring(1, 1.25, cylinder(0.72, 0.62, 0.7, 20), KM.gold);
    const t0 = 1 + 1.6 / Lsaya;
    add(kr, sweep(pts(t0, T1, 12), 0.64, 20, 0), KM.ito, [0, 0, 0]);
    { const p = at((t0 + T1) / 2); add(kr, sphere(0.36, 10, 8), KM.gold, [x + 0.55, p[1], p[2]], null, [0.5, 0.7, 1.6]); }
    ring(T1, 0.4, cylinder(0.62, 0.68, 0.8, 20), KM.gold);
    // the sageo cord, tied at the kurikata and hanging in a soft loop along the saya
    const c0 = at(1 - 6 / Lsaya), c1 = at(1 - 13 / Lsaya), c2 = at(1 - 20 / Lsaya);
    const cord = [[x + 0.3, c0[1] - 0.95, c0[2]], [x + 0.5, c0[1] - 1.9, c0[2] - 2.2], [x + 0.62, c1[1] - 1.75, c1[2] + 2.2], [x + 0.72, c1[1] - 0.45, c1[2] + 0.2], [x + 0.72, c1[1] - 0.7, c1[2] - 0.5], [x + 0.62, c1[1] - 1.9, c1[2] - 2.6], [x + 0.55, c2[1] - 2.5, c2[2]]];
    add(kr, sweep(cord, 0.19, 8, 8), KM.cord, [0, 0, 0]);
    ring(1, -13, torus(0.74, 0.14, 28, 6), KM.cord);
    for (const p of [cord[0], cord[cord.length - 1]]) add(kr, sphere(0.27, 10, 8), KM.cord, p);
    add(kr, cone(0.22, 0.9, 10), KM.cord, [cord[6][0], cord[6][1] - 0.6, cord[6][2]], [Math.PI, 0, 0]);
  };
  katana(64.2 + 0.62, KM.lacquerBlack);
  katana(71.4 + 0.62, KM.lacquerRed);
  const katanaHit = add(kr, box(7, 14, 52), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), [3, 69, 0]);
  katanaHit.castShadow = false; katanaHit.pickable = true; katanaHit.name = 'katana-hit';
  katanaHit.userData = { keyId: 'katana', interactive: true, glow: 0, targetGlow: 0 };
  flatten(kr, 'katana-rack');
  flatten(mon, 'monstera'); flatten(tw, 'power-tower'); flatten(rk, 'dumbbell-rack');
  // ---------- on / off for the neon, eased, with a little flicker as it strikes
  let on = true, v = 1, strike = 0;
  const toggle = () => { on = !on; if (on) strike = 0.6; return on; };
  const update = (dt, time, level = 1) => {
    v += ((on ? 1 : 0) - v) * (1 - Math.exp(-12 * dt));
    strike = Math.max(0, strike - dt);
    const flick = strike > 0 ? (Math.sin(time * 90) > 0.2 ? 1 : 0.25) : 1, g = neonHit.userData.glow || 0;
    const k = v * flick * (0.65 + 0.35 * level) * (1 + g * 0.2);
    M.neon.opacity = 0.08 + 0.92 * k; M.halo.opacity = 0.85 * k; M.wash.opacity = 0.3 * k;
  };
  return { root, neonHit, towerHit, katanaHit, toggle, update, get on() { return on; } };
}
