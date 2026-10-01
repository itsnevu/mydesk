// The machine: a full-size dual-glass case (glass front and glass side, no pillar between them) on the left of the desk,
// built to be looked into: ATX board, AIO pump with a lit ring, a 360 radiator up top, a vertically mounted graphics card
// showing its fans, four lit memory sticks, cream sleeved cables, and seven fans, every light the same warm yellow.
// Units: 1 unit ≈ 19.5 mm (a 120 mm fan is 6.15). Local frame: x → the glass side, z → the glass front, y up.
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, cylinder, torus, sphere } from 'engine/geometry';
import { drawTexture, MONO } from 'engine/textures';
import { color } from 'engine/math';
import { flatten } from 'app/bake';

export const CASE = { w: 14, h: 23, d: 22 };
const WARM = '#ffb547';

function boardTexture() {
  return drawTexture(256, 320, (ctx, w, h) => {
    ctx.fillStyle = '#17191b'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(160,170,180,0.10)'; ctx.lineWidth = 1;
    for (let k = 0; k < 70; k++) { ctx.beginPath(); let x = Math.random() * w, y = Math.random() * h; ctx.moveTo(x, y); for (let q = 0; q < 4; q++) { if (q % 2) x += (Math.random() - 0.5) * 80; else y += (Math.random() - 0.5) * 80; ctx.lineTo(x, y); } ctx.stroke(); }
    ctx.fillStyle = 'rgba(200,205,210,0.5)'; ctx.font = `600 9px ${MONO}`; ctx.fillText('PCIE_1', 20, 238); ctx.fillText('M.2_1', 150, 200); ctx.fillText('CPU_FAN', 170, 22);
    for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(${150 + Math.random() * 60},${150 + Math.random() * 60},${160 + Math.random() * 60},0.35)`; ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 2 + Math.random() * 3); }
  });
}
function glowTexture() {
  return drawTexture(128, 128, (ctx, w, h) => { const g = ctx.createRadialGradient(w * 0.55, h * 0.5, 4, w * 0.5, h * 0.5, w * 0.7); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(30,30,30,1)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }, { srgb: false });
}

// the pump's round screen: a warm ring and a lit core
function pumpFaceTexture() {
  return drawTexture(256, 256, (ctx, w, h) => {
    ctx.translate(0, h); ctx.scale(1, -1);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.5); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.8, 'rgba(255,170,60,0.55)'); g.addColorStop(1, 'rgba(255,190,90,0.95)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffb547'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.36, Math.PI * 0.75, Math.PI * 1.95); ctx.stroke();
    // a symmetric face (a lit core and tick ring), so it reads the same however the cap's UVs land
    for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; ctx.fillStyle = k % 2 ? 'rgba(255,200,120,0.5)' : '#ffd593'; ctx.fillRect(w / 2 + Math.cos(a) * w * 0.27 - 3, h / 2 + Math.sin(a) * h * 0.27 - 3, 6, 6); }
    const c = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.17); c.addColorStop(0, '#fff1d6'); c.addColorStop(1, 'rgba(255,170,60,0)'); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.17, 0, Math.PI * 2); ctx.fill();
  }, { srgb: false });
}

// the lit name along the card's top edge
function rtxTexture() {
  return drawTexture(512, 72, (ctx, w, h) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8e8e8'; ctx.font = `800 34px ${MONO}`; ctx.fillText('GEFORCE RTX', 26, h / 2 + 2);
    ctx.fillStyle = '#ffd593'; ctx.font = `800 38px ${MONO}`; ctx.fillText('5060', 300, h / 2 + 2);
    ctx.fillStyle = '#76b900'; ctx.fillRect(w - 70, h / 2 - 12, 40, 24);
  }, { srgb: false });
}

// where the cables plug in, in the case's own frame (before its 0.88 scale): rear I/O, the card's outputs, the PSU inlet
export const PC_PORTS_LOCAL = { io: [-5.8, 17.8, -11.2], video: [-3.5, 11.2, -11.2], power: [4.6, 3.6, -11.2] };
/** The same ports in world coordinates for a case placed at pos with yaw ry (app/room: PC_POS, PC_RY). */
export function pcPorts(pos, ry, scale = 0.88) {
  const c = Math.cos(ry), s = Math.sin(ry);
  return Object.fromEntries(Object.entries(PC_PORTS_LOCAL).map(([k, [x, y, z]]) => [k, [pos[0] + (x * c + z * s) * scale, pos[1] + y * scale, pos[2] + (-x * s + z * c) * scale]]));
}

/** A 120 mm fan facing +y: frame, translucent blades that catch the ring's light, a lit ring. Returns { node, rotor }. */
function fan(M, size = 6.15) {
  const node = new Node('fan'), half = size / 2, t = 1.28;
  const add = (geo, mat, p, r) => { const m = new Mesh(geo, mat); m.position = p; if (r) m.rotation = r; node.add(m); return m; };
  for (const s of [-1, 1]) { add(box(size, t, 0.42), M.fanFrame, [0, 0, s * (half - 0.21)]); add(box(0.42, t, size - 0.84), M.fanFrame, [s * (half - 0.21), 0, 0]); }
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) add(box(1.0, t, 1.0), M.fanFrame, [x * (half - 0.7), 0, z * (half - 0.7)], [0, Math.PI / 4, 0]);
  add(torus(half - 0.42, 0.11, 40, 6), M.led, [0, t / 2 - 0.05, 0]).castShadow = false;
  add(torus(half - 0.42, 0.11, 40, 6), M.led, [0, -t / 2 + 0.05, 0]).castShadow = false;
  const rotor = new Node('rotor'); rotor.userData.dynamic = true; node.add(rotor);
  const hub = new Mesh(cylinder(0.95, 0.95, 0.9, 24), M.fanHub); rotor.add(hub);
  const cap = new Mesh(cylinder(0.7, 0.7, 0.05, 24), M.ledSoft); cap.position[1] = 0.46; cap.castShadow = false; rotor.add(cap);
  for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; const bl = new Mesh(roundedBox({ w: half - 1.1, h: 0.06, d: 1.55, r: 0.03, seg: 1, uvTopOnly: false }), M.blade); bl.renderOrder = 9; bl.position = [Math.cos(a) * (0.95 + (half - 1.15) / 2), 0, Math.sin(a) * (0.95 + (half - 1.15) / 2)]; bl.rotation = [0.5, -a, 0]; bl.castShadow = false; rotor.add(bl); }
  flatten(rotor, 'fan-rotor'); // hub, cap and nine blades turn as three meshes
  return { node, rotor };
}

export function buildPC() {
  const M = {
    shell: new Material({ color: color('#151413'), roughness: 0.42, metalness: 0.45, emissive: color('#151413').map((v) => v * 0.5) }),
    inner: new Material({ color: color('#1a1919'), roughness: 0.7, emissive: color(WARM), emissiveMap: glowTexture(), emissiveIntensity: 0.06 }),
    trim: new Material({ color: color('#4a4a4f'), roughness: 0.26, metalness: 0.7, fresnel: 0.3, fresnelColor: color('#fff1d8'), emissive: color('#151517') }),
    port: new Material({ color: color('#9a9a9e'), roughness: 0.3, metalness: 0.8, emissive: color('#141414') }),
    hole: new Material({ color: color('#050505'), roughness: 0.9 }),
    rtx: new Material({ color: [0, 0, 0], emissive: [1, 1, 1], emissiveMap: rtxTexture(), emissiveIntensity: 1, unlit: true, receiveShadow: false }),
    pump: new Material({ color: [0, 0, 0], emissive: [1, 1, 1], emissiveMap: pumpFaceTexture(), emissiveIntensity: 1.2, unlit: true, receiveShadow: false }),
    pcb: new Material({ color: [1, 1, 1], map: boardTexture(), roughness: 0.6, emissive: color('#3a2810') }), pcbGlow: color('#3a2810'),
    heatsink: new Material({ color: color('#3c3d40'), roughness: 0.32, metalness: 0.75, emissive: color('#141210') }),
    silver: new Material({ color: color('#b9bcc0'), roughness: 0.25, metalness: 0.8, emissive: color('#1d1b18') }),
    gpu: new Material({ color: color('#202124'), roughness: 0.4, metalness: 0.55, emissive: color('#100e0b') }),
    fanFrame: new Material({ color: color('#141414'), roughness: 0.6, metalness: 0.2 }),
    fanHub: new Material({ color: color('#1b1b1b'), roughness: 0.45, metalness: 0.3 }),
    blade: new Material({ color: color('#6b5a40'), roughness: 0.5, emissive: color(WARM), emissiveIntensity: 0.5, opacity: 0.72, transparent: true, depthWrite: false, doubleSide: true }),
    led: new Material({ color: [0, 0, 0], emissive: color(WARM), emissiveIntensity: 2.0, unlit: true, receiveShadow: false }),
    ledSoft: new Material({ color: [0, 0, 0], emissive: color('#ffd593'), emissiveIntensity: 1.4, unlit: true, receiveShadow: false }),
    sleeve: new Material({ color: color('#dccdab'), roughness: 0.8, emissive: color('#2b2114') }),
    tube: new Material({ color: color('#16161a'), roughness: 0.55 }),
    glass: new Material({ color: [0.42, 0.42, 0.44], roughness: 0.04, opacity: 0.17, transparent: true, depthWrite: false, fresnel: 0.45, fresnelColor: color('#fff1d8') }),
  };
  const root = new Node('pc'); root.scale = [0.88, 0.88, 0.88]; const { w: W, h: H, d: D } = CASE; // a mid-tower: ~40 cm tall
  const add = (geo, mat, p, r, parent = root) => { const m = new Mesh(geo, mat); m.position = p; if (r) m.rotation = r; parent.add(m); return m; };
  const L = -W / 2, R = W / 2, F = D / 2, B = -D / 2;
  // ---------- shell: tray wall, back, top, floor, feet, a thin frame around the two glass panels
  add(box(0.4, H, D), M.inner, [L + 0.2, H / 2, 0]);
  add(box(W, H, 0.4), M.inner, [0, H / 2, B + 0.2]);
  add(roundedBox({ w: W, h: 0.6, d: D, r: 0.18, seg: 2 }), M.shell, [0, H - 0.3, 0]);
  add(roundedBox({ w: W, h: 0.7, d: D, r: 0.18, seg: 2 }), M.shell, [0, 0.95, 0]);
  for (const [x, z] of [[L + 1.4, B + 1.6], [R - 1.4, B + 1.6], [L + 1.4, F - 1.6], [R - 1.4, F - 1.6]]) add(cylinder(0.75, 0.9, 0.6, 16), M.shell, [x, 0.3, z]);
  // outer skins, so the lit inside never shows on the back or the tray side
  add(box(W, H, 0.06), M.shell, [0, H / 2, B - 0.03]); add(box(0.06, H, D), M.shell, [L - 0.03, H / 2, 0]);
  // gunmetal frame: the two pillars and the rails that hold the glass
  add(box(0.5, H - 1.3, 0.5), M.trim, [R - 0.25, H / 2 + 0.3, B + 0.25]);
  add(box(0.5, H - 1.3, 0.5), M.trim, [L + 0.25, H / 2 + 0.3, F - 0.25]);
  add(box(W, 0.5, 0.5), M.trim, [0, H - 0.85, F - 0.25]); add(box(0.5, 0.5, D), M.trim, [R - 0.25, H - 0.85, 0]);
  add(box(W, 0.5, 0.5), M.trim, [0, 1.55, F - 0.25]); add(box(0.5, 0.5, D), M.trim, [R - 0.25, 1.55, 0]);
  // the power LED, a small amber dot on the front of the bottom rail, and the drive-activity dot beside it
  for (const [x, r, mat] of [[R - 1.3, 0.12, M.led], [R - 1.75, 0.08, M.ledSoft]]) { const d = add(sphere(r, 10, 8), mat, [x, 1.55, F + 0.01]); d.scale = [1, 1, 0.5]; d.castShadow = false; }
  // top front: power button with its ring, two USB ports and a USB-C
  add(cylinder(0.45, 0.45, 0.12, 20), M.trim, [L + 2.0, H + 0.06, F - 1.5]);
  add(torus(0.5, 0.05, 24, 4), M.led, [L + 2.0, H + 0.08, F - 1.5]).castShadow = false;
  for (const [x, w2] of [[L + 3.6, 0.7], [L + 4.6, 0.7], [L + 5.5, 0.45]]) add(box(w2, 0.04, 0.3), M.hole, [x, H + 0.02, F - 1.5]).castShadow = false;
  // ---------- the back: I/O shield, seven slot covers with the card's outputs, the PSU with its grille and inlet, an exhaust grille
  const RZ = B - 0.08;
  add(box(2.1, 6.4, 0.1), M.trim, [L + 1.2, 17.8, RZ]);
  for (let k = 0; k < 4; k++) { add(box(0.6, 0.28, 0.1), M.port, [L + 0.85, 15.4 + k * 0.6, RZ - 0.06]); add(box(0.6, 0.28, 0.1), M.port, [L + 1.55, 15.4 + k * 0.6, RZ - 0.06]); }
  add(box(0.7, 0.62, 0.1), M.hole, [L + 1.2, 18.4, RZ - 0.06]); for (let k = 0; k < 3; k++) add(cylinder(0.14, 0.14, 0.1, 10), M.port, [L + 0.8 + k * 0.4, 20.0, RZ - 0.06], [Math.PI / 2, 0, 0]);
  for (let k = 0; k < 7; k++) { add(box(5.6, 0.7, 0.08), M.trim, [-3.1, 6.7 + k * 1.0, RZ]); if (k < 4 || k > 5) add(box(4.6, 0.12, 0.1), M.hole, [-3.1, 6.7 + k * 1.0, RZ - 0.03]).castShadow = false; add(cylinder(0.16, 0.16, 0.2, 10), M.port, [-0.6, 6.7 + k * 1.0, RZ - 0.08], [Math.PI / 2, 0, 0]); }
  for (let k = 0; k < 3; k++) add(box(0.62, 0.26, 0.1), M.hole, [-5.0 + k * 0.95, 11.2, RZ - 0.07]);
  add(box(0.5, 0.26, 0.1), M.hole, [-2.0, 11.2, RZ - 0.07]);
  add(box(6.4, 3.4, 0.1), M.shell, [3.0, 3.2, RZ]);
  for (const r of [0.5, 0.9, 1.3]) add(torus(r, 0.05, 28, 4), M.trim, [1.6, 3.2, RZ - 0.06], [Math.PI / 2, 0, 0]);
  add(box(0.9, 0.62, 0.12), M.hole, [4.6, 3.6, RZ - 0.06]); add(box(0.36, 0.6, 0.14), M.trim, [5.6, 3.6, RZ - 0.06]);
  for (const r of [0.9, 1.5, 2.1, 2.7]) add(torus(r, 0.06, 32, 4), M.trim, [0.5, 16.8, RZ - 0.04], [Math.PI / 2, 0, 0]);
  for (const y of [2.0, H - 1.2]) add(cylinder(0.22, 0.22, 0.3, 12), M.trim, [R - 1.0, y, RZ - 0.1], [Math.PI / 2, 0, 0]);
  // top vent mesh
  for (let k = -8; k <= 8; k++) add(box(W - 2, 0.05, 0.25), M.heatsink, [0, H + 0.02, k * 1.15]).castShadow = false;
  // ---------- PSU shroud (y 1.3–5.2) with three intake fans standing on it
  const shroudY = 5.2;
  add(box(W - 0.4, shroudY - 1.3, D - 0.4), M.shell, [0.2, 1.3 + (shroudY - 1.3) / 2, 0]);
  add(box(W - 0.6, 0.06, 0.12), M.led, [0.2, shroudY - 0.1, F - 0.3]).castShadow = false;
  add(box(3.2, 0.03, 1.2), M.trim, [-2.6, shroudY + 0.01, 7.6]).castShadow = false;            // the brand plate on the shroud
  const fans = [];
  for (const z of [-6.6, 0, 6.6]) { const f = fan(M); f.node.position = [1.4, shroudY + 0.64, z]; root.add(f.node); fans.push(f); }
  // ---------- motherboard (ATX 305 × 244 mm) on the tray: x -6.5..-6.3, y 6.4..21.4, z -10.2..2.3
  const BX = L + 0.4, BS = BX + 0.2, by0 = 6.4, bh = 15, bd = 12.5, bz = -10.2 + bd / 2;   // BS = the board's front surface
  add(box(0.2, bh, bd), M.pcb, [BX + 0.1, by0 + bh / 2, bz]);
  for (const [y, z] of [[by0 + 0.5, -9.7], [by0 + 0.5, 1.8], [by0 + bh - 0.5, -9.7], [by0 + bh - 0.5, 1.8], [by0 + 7.5, -9.7], [by0 + 7.5, 1.8]]) add(cylinder(0.16, 0.16, 0.08, 10), M.silver, [BS + 0.04, y, z], [0, 0, Math.PI / 2]);
  const cpu = [BS, 17.2, -4.6];
  // socket area: the VRM heatsink over it, the I/O shroud along the rear edge with its light, capacitors, the 8-pin EPS socket
  add(roundedBox({ w: 1.3, h: 1.4, d: 6.0, r: 0.2, seg: 2 }), M.heatsink, [BS + 0.65, 20.2, -5.3]);
  for (let k = 0; k < 9; k++) add(box(1.32, 0.06, 0.08), M.trim, [BS + 0.66, 20.9, -8.1 + k * 0.68]).castShadow = false;
  add(roundedBox({ w: 1.7, h: 6.6, d: 1.9, r: 0.25, seg: 2 }), M.gpu, [BS + 0.85, 17.9, -9.25]);
  add(box(0.06, 5.6, 0.12), M.led, [BS + 1.72, 17.9, -8.5]).castShadow = false;
  for (let k = 0; k < 6; k++) add(cylinder(0.14, 0.14, 0.42, 10), M.silver, [BS + 0.21, 14.6, -7.6 + k * 0.4], [0, 0, Math.PI / 2]);
  add(box(0.5, 0.45, 0.9), M.gpu, [BS + 0.25, 21.0, -9.4]);
  // four DIMMs (133 mm long, 2 units tall) right of the socket, lit along their top edges
  for (let k = 0; k < 4; k++) { const z = -1.9 + k * 0.6; add(box(1.9, 6.8, 0.36), M.gpu, [BS + 0.95, 17.2, z]); add(box(0.14, 6.6, 0.38), M.ledSoft, [BS + 1.95, 17.2, z]).castShadow = false; }
  // chipset heatsink, two M.2 heatsinks (above and below the card), two PCIe slots, the CMOS battery, the 24-pin socket
  add(roundedBox({ w: 0.45, h: 2.6, d: 2.8, r: 0.15, seg: 2 }), M.heatsink, [BS + 0.22, 8.7, 0.4]);
  add(roundedBox({ w: 0.36, h: 0.62, d: 6.0, r: 0.1, seg: 2 }), M.silver, [BS + 0.18, 13.3, -5.4]);
  add(roundedBox({ w: 0.36, h: 0.62, d: 6.0, r: 0.1, seg: 2 }), M.silver, [BS + 0.18, 8.0, -5.6]);
  for (const y of [11.9, 7.1]) add(box(0.3, 0.22, 7.6), M.hole, [BS + 0.15, y, -6.0]);
  add(cylinder(0.5, 0.5, 0.08, 20), M.silver, [BS + 0.04, 9.4, -8.9], [0, 0, Math.PI / 2]);
  add(box(0.9, 2.8, 0.42), M.hole, [BS + 0.45, 15.4, 2.05]);
  // ---------- AIO pump on the socket: body, lit ring, the round screen
  add(cylinder(1.75, 1.75, 1.4, 40), M.gpu, [cpu[0] + 0.7, cpu[1], cpu[2]], [0, 0, -Math.PI / 2]);
  add(torus(1.62, 0.12, 40, 6), M.led, [cpu[0] + 1.42, cpu[1], cpu[2]], [0, 0, Math.PI / 2]).castShadow = false;
  const face = add(cylinder(1.38, 1.38, 0.05, 36), M.pump, [cpu[0] + 1.43, cpu[1], cpu[2]], [Math.PI / 2, Math.PI / 2, 0]); face.castShadow = false;
  // ---------- the 240 radiator under the top panel (x -1.6..4.8, y 21.0..22.4), two fans pulling up through it
  const RX = 1.6, RT = 1.4;
  add(box(6.4, RT, 12.3), M.heatsink, [RX, 22.4 - RT / 2, -1.75]);
  for (const [z0, z1] of [[-8.9, -7.9], [4.4, 5.2]]) add(box(6.4, RT + 0.2, z1 - z0), M.gpu, [RX, 22.4 - RT / 2 - 0.1, (z0 + z1) / 2]);
  for (const z of [-4.83, 1.33]) { const f = fan(M); f.node.position = [RX, 21.0 - 0.64, z]; root.add(f.node); fans.push(f); }
  // tubes from the pump's face out toward the glass, up and back into the radiator's end tank
  const tube = (pts, r = 0.3, mat = M.tube) => { for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]], d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(...d); add(cylinder(r, r, len, 12), mat, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [Math.atan2(d[2], d[1]), 0, -Math.asin(d[0] / len)]).castShadow = true; if (i) add(sphere(r, 12, 8), mat, a); } };
  for (const dz of [-0.55, 0.55]) tube([[cpu[0] + 1.3, cpu[1] + 1.1, cpu[2] + dz], [-4.0, 18.9, cpu[2] + dz], [-2.9, 20.0, -6.6 + dz * 0.6], [-2.1, 21.4, -8.4 + dz * 0.5], [-1.6, 21.6, -8.4 + dz * 0.5]]);
  // ---------- rear exhaust fan behind the socket
  { const f = fan(M); f.node.position = [0.5, 16.8, B + 0.4 + 0.64]; f.node.rotation = [Math.PI / 2, 0, 0]; root.add(f.node); fans.push(f); }
  // ---------- GeForce RTX 5060, dual fan, in the top x16 slot: sticks out of the board to x -0.05, y 10.2..12.25, z -10.4..1.4
  const GX0 = BS + 0.1, GX1 = -0.05, GY0 = 10.2, GY1 = 12.25, GZ0 = -10.4, GZ1 = 1.4, gcx = (GX0 + GX1) / 2, gcz = (GZ0 + GZ1) / 2, glen = GZ1 - GZ0;
  add(roundedBox({ w: GX1 - GX0, h: 1.2, d: glen, r: 0.25, seg: 2 }), M.gpu, [gcx, GY0 + 0.6 + 0.1, gcz]);                 // shroud
  add(box(GX1 - GX0 - 0.1, 0.1, glen - 0.2), M.silver, [gcx, GY1 - 0.05, gcz]);                                           // backplate
  for (let k = 0; k < 30; k++) add(box(GX1 - GX0 - 0.5, 0.7, 0.05), M.heatsink, [gcx, GY0 + 1.6, GZ0 + 0.6 + k * 0.36]).castShadow = false; // fin stack
  for (const z of [GZ0 + 3.4, GZ0 + 8.6]) {                                                                                  // two fans on its underside
    const ring = add(torus(2.3, 0.12, 36, 6), M.led, [gcx, GY0 - 0.02, z], [0, 0, 0]); ring.castShadow = false;
    const rotor = new Node('gpu-rotor'); rotor.position = [gcx, GY0 + 0.15, z]; rotor.userData.dynamic = true; root.add(rotor);
    rotor.add(new Mesh(cylinder(0.75, 0.75, 0.3, 20), M.fanHub));
    for (let k = 0; k < 11; k++) { const a = (k / 11) * Math.PI * 2, bl = new Mesh(roundedBox({ w: 1.5, h: 0.05, d: 0.95, r: 0.03, seg: 1, uvTopOnly: false }), M.blade); bl.position = [Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5]; bl.rotation = [0.45, -a, 0]; bl.castShadow = false; bl.renderOrder = 9; rotor.add(bl); }
    flatten(rotor, 'gpu-rotor'); fans.push({ rotor });
  }
  const logo = add(box(0.03, 1.0, 7.4), M.rtx, [GX1 + 0.02, GY0 + 1.05, gcz - 0.4]); logo.castShadow = false;                 // GEFORCE RTX 5060, lit, facing the glass
  add(box(0.04, 0.08, glen - 0.6), M.led, [GX1 + 0.03, GY1 - 0.22, gcz]).castShadow = false;
  add(box(0.5, 0.42, 0.95), M.hole, [GX1 - 0.25, GY0 + 0.9, GZ1 - 1.6]);                                                       // the 8-pin socket
  add(box(0.08, 2.05, 0.6), M.silver, [GX0 + 0.25, (GY0 + GY1) / 2, GZ0 + 0.05]);                                            // the bracket's inside edge
  // ---------- cream sleeved cables: 24-pin through the tray grommet, EPS over the top, the card's 8-pin up from the shroud
  add(box(0.12, 5.4, 1.2), M.hole, [L + 0.46, 15.4, 3.6]);
  for (let k = 0; k < 12; k++) { const y = 14.15 + (k % 6) * 0.48, x = L + 0.55 + Math.floor(k / 6) * 0.34; tube([[x, y, 3.6], [x + 0.5, y, 3.2], [BS + 0.5, y, 2.5]], 0.15, M.sleeve); }
  for (let k = 0; k < 8; k++) tube([[L + 0.55, 21.9, -8.6 + (k % 4) * 0.3], [BS + 0.3, 21.85, -8.9 + (k % 4) * 0.3], [BS + 0.3, 21.3, -9.2 + (k % 4) * 0.25]], 0.13, M.sleeve);
  for (let k = 0; k < 4; k++) { const z = GZ1 - 1.9 + k * 0.22; tube([[5.9, shroudY, z], [5.9, GY0 + 0.95, z], [GX1 + 0.6, GY0 + 0.95, z], [GX1 - 0.02, GY0 + 0.95, z]], 0.12, M.sleeve); }
  add(box(0.9, 0.08, 1.4), M.hole, [5.9, shroudY + 0.01, GZ1 - 1.6]).castShadow = false;
  // ---------- light strips behind the front and side glass edges
  add(box(0.1, H - 7, 0.1), M.led, [L + 0.5, H / 2 + 2.6, F - 0.6]).castShadow = false;
  add(box(W - 1.2, 0.1, 0.1), M.led, [0, H - 0.75, F - 0.7]).castShadow = false;
  add(box(0.1, H - 7, 0.1), M.led, [L + 0.5, H / 2 + 2.6, B + 0.6]).castShadow = false;
  add(box(0.1, 0.1, D - 1.2), M.led, [L + 0.5, H - 0.75, 0]).castShadow = false;
  add(box(0.1, 0.1, D - 1.2), M.led, [R - 0.7, shroudY + 0.05, 0]).castShadow = false;
  // ---------- glass: front and side, meeting at the corner
  const gf = add(box(W - 0.2, H - 1.6, 0.12), M.glass, [-0.1, H / 2 + 0.6, F - 0.06]); gf.castShadow = false; gf.renderOrder = 10;
  const gs = add(box(0.12, H - 1.6, D - 0.2), M.glass, [R - 0.06, H / 2 + 0.6, 0.1]); gs.castShadow = false; gs.renderOrder = 10;
  // ---------- hover / click volume
  const hit = add(box(W + 0.8, H + 0.8, D + 0.8), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), [0, H / 2, 0]);
  hit.castShadow = false; hit.pickable = true; hit.name = 'pc-hit';
  hit.userData = { keyId: 'pc', interactive: true, glow: 0, targetGlow: 0 };
  // ---------- life: the fans turn, the light breathes, and comes up with the room
  const update = (dt, time, level = 1) => {
    const g = hit.userData.glow || 0, breath = 0.86 + Math.sin(time * 1.2) * 0.14;
    for (const [k, f] of fans.entries()) f.rotor.rotation[1] += dt * (7 + (k % 3) * 0.6 + g * 6);
    M.led.emissiveIntensity = (0.35 + 1.9 * level) * breath * (1 + g * 0.5);
    M.ledSoft.emissiveIntensity = (0.3 + 1.3 * level) * breath * (1 + g * 0.4);
    M.inner.emissiveIntensity = (0.03 + 0.13 * level) * breath * (1 + g * 0.6);
    M.pump.emissiveIntensity = (0.4 + 0.9 * level) * (1 + g * 0.3);
    M.blade.emissiveIntensity = (0.15 + 0.6 * level) * breath;
    M.pcb.emissive = M.pcbGlow.map((c) => c * (0.4 + 0.8 * level) * breath);
  };
  root.traverse((n) => { if (n.geometry && n.material?.transparent) n.castShadow = false; });
  flatten(root, 'pc'); // ~400 parts → a few dozen draws
  return { root, hit, update };
}
