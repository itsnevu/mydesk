// A plain swing-arm desk lamp clamped to the back right corner of the desk, reaching over so its bar hangs above and
// behind the centre monitor, washing the wall: C-clamp with a screw under the top, a swivel,
// a double-rod lower arm with springs, a parallel-link upper arm and a long bar head with a warm LED strip underneath.
// Click it to switch it. Units: 1 unit ≈ 19.5 mm; the desk top is y = 0 and its right edge is x = 48.
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, cylinder, torus } from 'engine/geometry';
import { drawTexture } from 'engine/textures';
import { color } from 'engine/math';
import { flatten } from 'app/bake';

const EDGE = 48, DESK_T = 2.62, WALL_Z = -30.5; // the back wall's face (app/room BACK = -30.6)
export const LAMP_BASE = [47.2, 0, -21.0];        // where the clamp grips the desk: the back right corner
const AIM = Math.PI;                              // the arm reaches straight left, behind the monitors               // the arm swings out toward the keyboard side, a little forward
const L1 = 26, L2 = 36, BAR = 26, BACK = 5 * Math.PI / 180, RISE = 6 * Math.PI / 180; // the bar centres over x ≈ 0, above the screens

function poolTexture() {
  return drawTexture(256, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.45, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.setTransform(1, 0, 0, 0.5, 0, h / 4); ctx.fillStyle = g; ctx.fillRect(0, 0, w, w);
  });
}

export function buildClampLamp() {
  const metal = new Material({ color: color('#141414'), roughness: 0.38, metalness: 0.55, fresnel: 0.25, fresnelColor: color('#fff1d8'), emissive: color('#0d0d0d') });
  const joint = new Material({ color: color('#222224'), roughness: 0.3, metalness: 0.7, emissive: color('#0f0f10') });
  const spring = new Material({ color: color('#8d8a86'), roughness: 0.3, metalness: 0.85, emissive: color('#141312') });
  const led = new Material({ color: [0, 0, 0], emissive: color('#ffe1b0'), emissiveIntensity: 2.2, unlit: true, receiveShadow: false });
  const pool = new Material({ color: color('#ffd9a0'), map: poolTexture(), opacity: 0.32, transparent: true, depthWrite: false, unlit: true, receiveShadow: false });
  const root = new Node('clamp-lamp');
  const add = (parent, geo, mat, p, r) => { const m = new Mesh(geo, mat); m.position = p; if (r) m.rotation = r; parent.add(m); return m; };
  const [bx, , bz] = LAMP_BASE;
  // ---------- the C-clamp around the desk edge, its screw and T-handle underneath
  add(root, roundedBox({ w: 3.2, h: 0.5, d: 2.6, r: 0.12, seg: 2 }), metal, [bx + 0.0, 0.25, bz]);
  add(root, roundedBox({ w: 0.6, h: DESK_T + 1.3, d: 2.6, r: 0.12, seg: 2 }), metal, [EDGE + 0.32, -(DESK_T + 1.3) / 2 + 0.5, bz]);
  add(root, roundedBox({ w: 3.0, h: 0.5, d: 2.6, r: 0.12, seg: 2 }), metal, [EDGE - 0.9, -DESK_T - 0.55, bz]);
  add(root, cylinder(0.24, 0.24, 2.4, 12), spring, [bx, -DESK_T - 1.2, bz]);
  add(root, cylinder(0.6, 0.6, 0.22, 20), joint, [bx, -DESK_T - 0.13, bz]);
  add(root, roundedBox({ w: 2.2, h: 0.28, d: 0.28, r: 0.1, seg: 1 }), metal, [bx, -DESK_T - 2.4, bz]);
  // ---------- the swivel, then the arm in its own plane (local +x = toward the reach, y up)
  add(root, cylinder(0.75, 0.85, 1.3, 24), joint, [bx, 1.15, bz]);
  const arm = new Node('clamp-lamp-arm'); arm.position = [bx, 2.0, bz]; arm.rotation[1] = AIM; root.add(arm);
  const P0 = [0, 0], P1 = [-Math.sin(BACK) * L1, Math.cos(BACK) * L1], P2 = [P1[0] + Math.cos(RISE) * L2, P1[1] + Math.sin(RISE) * L2];
  const rod = (a, b, z, t = 0.3, w = 0.22, mat = metal) => { const dx = b[0] - a[0], dy = b[1] - a[1]; add(arm, roundedBox({ w: Math.hypot(dx, dy), h: t, d: w, r: 0.08, seg: 1, uvTopOnly: false }), mat, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z], [0, 0, Math.atan2(dy, dx)]); };
  const off = (p, a, b, k) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [p[0] - (dy / l) * k, p[1] + (dx / l) * k]; };
  // lower arm: twin rods, a parallel link just inside them, and two springs lying along the rods, hooked at both ends
  const LINK = 0.6, at = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  for (const z of [-0.42, 0.42]) rod(P0, P1, z);
  rod(off(P0, P0, P1, LINK), off(P1, P0, P1, LINK), 0, 0.2, 0.18);
  for (const z of [-0.42, 0.42]) {
    const sa = off(at(P0, P1, 0.1), P0, P1, -0.3), sb = off(at(P0, P1, 0.58), P0, P1, -0.3), n = 30, ang = Math.atan2(sb[1] - sa[1], sb[0] - sa[0]);
    for (let k = 0; k <= n; k++) add(arm, torus(0.14, 0.035, 10, 4), spring, [sa[0] + (sb[0] - sa[0]) * (k / n), sa[1] + (sb[1] - sa[1]) * (k / n), z], [0, 0, ang - Math.PI / 2]).castShadow = false;
    for (const p of [sa, sb]) { const q = off(p, P0, P1, 0.3); add(arm, cylinder(0.05, 0.05, 0.34, 6), spring, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, z], [0, 0, ang]); }
  }
  // upper arm: twin rods and its parallel link
  for (const z of [-0.42, 0.42]) rod(P1, P2, z);
  rod(off(P1, P1, P2, LINK), off(P2, P1, P2, LINK), 0, 0.18, 0.16);
  // hinges: a hub at each joint swallows the rod and link ends; an axle through it and a tension knob on the outside
  for (const p of [P0, P1, P2]) {
    add(arm, cylinder(0.82, 0.82, 1.2, 24), joint, [p[0], p[1], 0], [Math.PI / 2, 0, 0]);
    for (const sd of [-1, 1]) add(arm, cylinder(0.3, 0.3, 0.3, 16), metal, [p[0], p[1], sd * 0.72], [Math.PI / 2, 0, 0]);
    add(arm, cylinder(0.6, 0.52, 0.34, 20), joint, [p[0], p[1], 0.98], [Math.PI / 2, 0, 0]);
  }
  // the head: a short knuckle down to a long round bar, LED strip on its underside, end caps
  add(arm, roundedBox({ w: 0.6, h: 1.1, d: 0.6, r: 0.15, seg: 2 }), joint, [P2[0] + 0.3, P2[1] - 0.55, 0]);
  const headY = P2[1] - 1.25, x0 = P2[0], x1 = P2[0] + BAR;
  add(arm, cylinder(0.55, 0.55, BAR, 24), metal, [(x0 + x1) / 2, headY, 0], [0, 0, Math.PI / 2]);
  for (const x of [x0 - 0.12, x1 + 0.12]) add(arm, cylinder(0.58, 0.58, 0.24, 24), joint, [x, headY, 0], [0, 0, Math.PI / 2]);
  add(arm, box(BAR - 0.6, 0.05, 0.62), led, [(x0 + x1) / 2, headY - 0.56, 0]).castShadow = false;
  add(arm, cylinder(0.2, 0.2, 0.08, 12), led, [x1 - 0.8, headY + 0.56, 0]).castShadow = false; // the touch switch's dot
  // ---------- the light it throws: a soft warm wash on the wall behind the screens, under and around the bar
  const mid = (x0 + x1) / 2, c = Math.cos(AIM), s = Math.sin(AIM);
  const pl = add(root, box(BAR + 22, 16, 0.01), pool, [bx + mid * c, 2.0 + P2[1] - 6.5, WALL_Z], null); pl.castShadow = false; pl.renderOrder = 5;
  // ---------- hover / click: the head and the arm
  const hit = add(arm, box(BAR + 1.5, 2.2, 2.4), new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false }), [(x0 + x1) / 2, headY, 0]);
  hit.castShadow = false; hit.pickable = true; hit.name = 'clamp-lamp-hit';
  hit.userData = { keyId: 'desklamp', interactive: true, glow: 0, targetGlow: 0 };
  root.traverse((n) => { if (n.geometry && n.material === pool) n.castShadow = false; });
  // ---------- on / off, eased
  let on = true, v = 1;
  const toggle = () => { on = !on; return on; };
  const set = (v) => { on = !!v; };
  const update = (dt, level = 1) => {
    v += ((on ? 1 : 0) - v) * (1 - Math.exp(-10 * dt));
    const g = hit.userData.glow || 0;
    led.emissiveIntensity = 0.12 + v * (1.1 + 1.3 * level) * (1 + g * 0.25);
    pool.opacity = v * (0.16 + 0.3 * level);
  };
  flatten(root, 'clamp-lamp');
  const headWorld = [bx + mid * c, 2.0 + headY, bz - mid * s];
  return { root, hit, toggle, set, update, headWorld, get on() { return on; } };
}
