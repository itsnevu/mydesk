// The Satoshi Nakamoto statue from Budapest: a bronze bust in a hoodie, the hood up and peaked, broad sloping shoulders;
// the face is polished gold, a smooth mirror with closed eyes, a nose and lips just raised from it, and a polished V at the
// neck; a round ₿ medallion on the figure's left chest; a light grey speckled stone plinth with SATOSHI NAKAMOTO carved in it.
// It stands against the right wall facing into the room, under the framed prints. Units: 1 unit ≈ 19.5 mm; floor y = -40.
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, cylinder, sphere, torus, cone } from 'engine/geometry';
import { drawTexture, SANS } from 'engine/textures';
import { color } from 'engine/math';
import { flatten } from 'app/bake';
import { tube as sweep } from 'app/cables';

export const SATOSHI_POS = [111, -40, 36];

// light grey granite, speckled
function stoneTexture() {
  return drawTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#c4c2bd'; ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 9000; k++) { const v = Math.random(); ctx.fillStyle = v < 0.45 ? 'rgba(60,58,55,0.55)' : v < 0.8 ? 'rgba(235,233,228,0.6)' : 'rgba(120,112,104,0.6)'; ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); }
  });
}
// the name cut into the stone: only the letters (dark in the cut, a lit lower lip), transparent everywhere else
function lettersTexture(text) {
  return drawTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 52px ${SANS}`;
    text.split('\n').forEach((l, i) => { const y = h * 0.4 + i * 70; ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillText(l, w / 2 + 1, y + 3); ctx.fillStyle = 'rgba(38,36,33,0.92)'; ctx.fillText(l, w / 2, y); });
  });
}
// the mirror face: polished gold metal reflecting the room: bright and warm above, a sharp window streak, a dark floor below,
// a hot rim at the edge. The front of the sphere is u = 0.25 (canvas x 128).
function faceTexture() {
  return drawTexture(512, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fff6d8'); g.addColorStop(0.3, '#f0c66a'); g.addColorStop(0.5, '#9a6a22'); g.addColorStop(0.56, '#3a2408'); g.addColorStop(0.72, '#7a5218'); g.addColorStop(1, '#2a1804'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,252,240,0.95)'; ctx.beginPath(); ctx.ellipse(96, 70, 9, 42, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,252,240,0.55)'; ctx.beginPath(); ctx.ellipse(118, 64, 4, 26, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,200,0.35)'; ctx.beginPath(); ctx.ellipse(170, 150, 30, 8, 0.4, 0, Math.PI * 2); ctx.fill();
  });
}
function medallionTexture() {
  return drawTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#4a3218'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w * 0.4, h * 0.35, 10, w / 2, h / 2, w * 0.5); g.addColorStop(0, '#c8954a'); g.addColorStop(1, '#7a5426'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e0b56a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.4, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#f0c878'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 140px ${SANS}`; ctx.fillText('₿', w / 2, h / 2 + 8);
  });
}

export function buildSatoshi() {
  const faceMap = faceTexture(), medalMap = medallionTexture();
  const M = {
    stone: new Material({ color: [1, 1, 1], map: stoneTexture(), roughness: 0.7, emissive: [0.07, 0.07, 0.068] }),
    letters: new Material({ color: [1, 1, 1], map: lettersTexture('SATOSHI\nNAKAMOTO'), roughness: 0.7, emissive: [0.07, 0.07, 0.068], transparent: true, depthWrite: false, receiveShadow: true }),
    rimBronze: new Material({ color: color('#8a6236'), roughness: 0.42, metalness: 0.4, fresnel: 0.35, fresnelColor: color('#f0c27f'), emissive: color('#2a1a0b') }),
    // old bronze: dark brown with a little green-black in it, satin, its light on the edges rather than in the colour
    // warm dark bronze that reads from the room side: the bust faces away from the key light, so its tone comes from the sky
    // fill and a low glow of its own (it only looked brown before because rotated normals were lit the wrong way round)
    bronze: new Material({ color: color('#9a7448'), roughness: 0.45, metalness: 0.35, fresnel: 0.25, fresnelColor: color('#c8955c'), emissive: color('#3a2a18') }),
    bronzeDark: new Material({ color: color('#1e1309'), roughness: 0.5, metalness: 0.6, emissive: color('#080502') }),
    face: new Material({ color: [1, 0.8, 0.45], map: faceMap, emissiveMap: faceMap, emissive: [0.42, 0.3, 0.13], roughness: 0.06, metalness: 1, fresnel: 0.35, fresnelColor: color('#ffd98a') }),
    polish: new Material({ color: color('#d9a24a'), roughness: 0.06, metalness: 1, fresnel: 0.3, fresnelColor: color('#ffd98a'), emissive: color('#4a3010') }),
    gold: new Material({ color: color('#d9a85a'), roughness: 0.12, metalness: 0.9, fresnel: 0.45, fresnelColor: color('#fff2c8'), emissive: color('#6a4c18') }),
    medal: new Material({ color: [1, 1, 1], map: medalMap, emissiveMap: medalMap, emissive: [0.2, 0.17, 0.12], roughness: 0.35, metalness: 0.6 }),
  };
  const root = new Node('satoshi'); root.position = [...SATOSHI_POS]; root.rotation[1] = -Math.PI / 2;   // its front (+z) faces into the room
  const add = (geo, mat, p, r, s) => { const m = new Mesh(geo, mat); m.position = p; if (r) m.rotation = r; if (s) m.scale = s; root.add(m); return m; };
  // ---------- the plinth: a plain granite block on a wider foot, the name cut into its front
  add(roundedBox({ w: 15, h: 2, d: 15, r: 0.3, seg: 2 }), M.stone, [0, 1, 0]);
  add(roundedBox({ w: 12.5, h: 32, d: 12.5, r: 0.2, seg: 2 }), M.stone, [0, 18, 0]);
  { const l = add(box(12.4, 12.4, 0.01), M.letters, [0, 22, 6.255]); l.castShadow = false; l.renderOrder = 6; }
  add(roundedBox({ w: 13.5, h: 1.2, d: 13.5, r: 0.25, seg: 2 }), M.stone, [0, 34.4, 0]);
  const Y = 35;
  // ---------- the bust: broad sloping shoulders over a chest flatter at the front, the hoodie's front seam
  const CH = { c: [0, Y + 2.8, -0.3], r: [6.9, 4.2, 4.1] };
  const chestZ = (x, y) => { const u = 1 - ((x - CH.c[0]) / CH.r[0]) ** 2 - ((y - CH.c[1]) / CH.r[1]) ** 2; return CH.c[2] + CH.r[2] * Math.sqrt(Math.max(0, u)); };
  const chestN = (x, y) => { const z = chestZ(x, y), n = [(x - CH.c[0]) / CH.r[0] ** 2, (y - CH.c[1]) / CH.r[1] ** 2, (z - CH.c[2]) / CH.r[2] ** 2], l = Math.hypot(...n); return n.map((v) => v / l); };
  const aim = (d) => [Math.atan2(d[2], d[1]), 0, -Math.asin(d[0])];   // turns a cylinder's axis (y) onto d
  add(sphere(1, 40, 24), M.bronze, CH.c, null, CH.r);
  add(cylinder(6.3, 6.6, 2.4, 40), M.bronze, [0, Y + 1.2, -0.3], null, [1, 1, 0.6]);
  add(box(0.07, 4.0, 0.06), M.bronzeDark, [0, Y + 2.4, 3.8], [0.25, 0, 0]);
  for (const sd of [-1, 1]) {
    const x0 = sd * 1.15, pts = [[x0, Y + 6.4, 3.35]];
    for (let k = 1; k <= 7; k++) { const y = Y + 6.0 - k * 0.5, x = x0 + sd * k * 0.03; pts.push([x, y, chestZ(x, y) + 0.17]); }
    add(sweep(pts, 0.16, 10, 6), M.bronze, [0, 0, 0]);
    const end = pts[pts.length - 1], n = chestN(end[0], end[1]), dn = [0, -1, 0], tip = [end[0], end[1] - 0.3, chestZ(end[0], end[1] - 0.3) + 0.2];
    add(cylinder(0.2, 0.17, 0.62, 12), M.polish, tip, aim(dn.map((v, i) => v + n[i] * 0.25)));
  }
  // the ₿ medallion on the figure's left chest (the viewer's right)
  { const bx = 2.7, by = Y + 4.0, n = chestN(bx, by), z = chestZ(bx, by);
    add(cylinder(1.15, 1.15, 0.08, 40), M.medal, [bx + n[0] * 0.02, by + n[1] * 0.02, z + n[2] * 0.02], aim(n)); }
  // ---------- the polished V at the neck, where the hood's two sides meet under the chin
  add(cone(0.9, 2.0, 3), M.gold, [0, Y + 6.1, 2.95], [Math.PI, Math.PI / 6, 0], [1, 1, 0.25]);
  // ---------- the hood: rounded at the back, rising to a forward-leaning peak, its thick rim framing the face
  const H = Y + 10.2;
  add(sphere(1, 40, 28), M.bronze, [0, H, -1.3], null, [4.2, 4.7, 4.4]);
  add(cone(2.1, 2.4, 24), M.bronze, [0, H + 4.1, -1.0], [0.3, 0, 0], [1, 1, 0.9]);
  add(sphere(0.55, 16, 10), M.bronze, [0, H + 5.2, -0.66]);
  add(torus(2.75, 0.85, 48, 14), M.rimBronze, [0, H - 0.4, 2.55], [Math.PI / 2, 0, 0], [1, 1, 1.3]);
  for (const s of [-1, 1]) add(sphere(1, 20, 14), M.bronze, [s * 2.3, H - 4.2, 1.9], null, [1.2, 1.6, 1.0]);
  // ---------- the face: a polished gold oval set in the hood; nose, brow, lips and chin just raised from it
  add(sphere(1, 48, 32), M.face, [0, H - 0.4, 2.0], null, [2.3, 3.1, 1.45]);
  add(sphere(1, 20, 14), M.face, [0, H - 0.6, 3.3], [0.25, 0, 0], [0.36, 0.9, 0.42]);
  add(sphere(1, 20, 12), M.face, [0, H + 0.55, 3.0], null, [1.7, 0.28, 0.36]);
  add(sphere(1, 20, 12), M.face, [0, H - 1.95, 2.95], null, [0.75, 0.2, 0.28]);
  add(sphere(1, 20, 12), M.face, [0, H - 2.85, 2.8], null, [0.95, 0.38, 0.42]);
  flatten(root, 'satoshi');
  const hit = new Mesh(box(16, 52, 16), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), 'satoshi-hit');
  hit.position = [0, 27, 0]; hit.castShadow = false; hit.pickable = true; hit.userData = { keyId: 'satoshi', interactive: true, glow: 0, targetGlow: 0 }; root.add(hit);
  return { root, hit };
}
