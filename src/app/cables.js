// The cabling: what plugs into what. Each screen's video lead runs from the back of its panel to the stand's pole, down the back
// of the pole through its clips, straight back over the stand's base and the desk's back edge into a steel tray hung under it,
// along the tray and up over the edge at the far end to the graphics card. The keyboard's lead threads back between the left speaker and the
// little shelf, round the stand's base and into the same tray, to the PC's rear USB; the PC's audio and the speaker wire between the
// two speakers run in it too. Everything that takes power (the screens, the right speaker, the PC, the clamp lamp) drops behind the
// desk to a power strip on the floor, which plugs into the wall. The mouse is wireless.
// Every cable is a tube swept along a Catmull-Rom curve through hand-placed points, settled onto whatever it lies on (mat, desk,
// floor) so it never sinks in. Slots, lanes and drop points are ordered so that no two cables cross, and they share one rubber
// material (one draw call).
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, cylinder, merge } from 'engine/geometry';
import { M4, color } from 'engine/math';
import { MONITOR_PORTS, MONITOR_POLE, MONITOR_BASE } from 'app/monitors';
import { LAMP_BASE } from 'app/clamplamp';

const FLOOR = -40, DESK_TOP = -0.02, DESK_UNDER = -2.62, MAT_TOP = 0.12, WALL_Z = -30.6, EDGE_Z = -24.0;
const DESK = { x0: -48, x1: 48, z1: 24 }, MAT = { x0: -15, x1: 15, z0: -5.9, z1: 7.1 };
const TRAY = { x0: -46.4, x1: 14.4, y0: -4.4, y1: -2.8, z0: -25.6, z1: -22.4, t: 0.2 };   // a steel tray under the back edge of the desk
const STRIP = [-0.1, FLOOR + 0.8, -27.6], STRIP_W = 21;   // the power strip on the floor behind the desk: eight sockets
const SOCKET = [-16, FLOOR + 9, WALL_Z + 0.25];
const socketX = (i) => STRIP[0] - STRIP_W / 2 + 2.1 + i * 2.4;
// everything a cable can lie on, as footprints with the height of their top: the mat, the desk, the stand's two base plates, the tray
const B = MONITOR_BASE, SX = MONITOR_POLE.x;
const SURFACES = [
  { x: [MAT.x0, MAT.x1], z: [MAT.z0, MAT.z1], y: MAT_TOP }, { x: [DESK.x0, DESK.x1], z: [EDGE_Z, DESK.z1], y: DESK_TOP },
  { x: [SX - B.lo.x, SX + B.lo.x], z: B.lo.z, y: B.lo.y }, { x: [SX - B.hi.x, SX + B.hi.x], z: B.hi.z, y: B.hi.y },
  { x: [TRAY.x0, TRAY.x1], z: [TRAY.z0, TRAY.z1], y: TRAY.y0 + TRAY.t },
];

// ---------- a centripetal Catmull-Rom curve through the points, `n` samples per span: unlike the uniform kind it never overshoots
// where the points are unevenly spaced, so a cable stays where it was laid
function spline(pts, n = 6) {
  const out = [], d = (a, b) => Math.max(1e-4, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])));
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i], p2 = pts[i + 1];
    const p0 = i > 0 ? pts[i - 1] : p1.map((v, j) => 2 * v - p2[j]), p3 = i + 2 < pts.length ? pts[i + 2] : p2.map((v, j) => 2 * v - p1[j]);
    const t1 = d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
    for (let k = 0; k < n; k++) {
      const t = t1 + ((t2 - t1) * k) / n, L = (a, b, ta, tb) => a.map((v, j) => ((tb - t) * v + (t - ta) * b[j]) / (tb - ta));
      const A1 = L(p0, p1, 0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
      out.push(L(L(A1, A2, 0, t2), L(A2, A3, t1, t3), t1, t2));
    }
  }
  out.push([...pts[pts.length - 1]]);
  return out;
}

// a cable lies on things: it rests on the highest surface under it (or the floor), never sinks in (the curve can dip between points)
function settle(q, r) {
  let top = FLOOR;
  for (const s of SURFACES) if (q[0] > s.x[0] && q[0] < s.x[1] && q[2] > s.z[0] && q[2] < s.z[1] && q[1] > s.y - 1.2 && s.y > top) top = s.y;
  if (q[1] < top + r) q[1] = top + r + 0.01;
  return q;
}

/** A round tube along a curve through `points` (or along `points` themselves when `samples` is 0); the ring frame is carried along the curve so the tube never twists. */
export function tube(points, r = 0.2, seg = 8, samples = 6) {
  const path = samples ? spline(points, samples) : points, pos = [], nor = [], uv = [], idx = [];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  let N = null, len = 0;
  for (let i = 0; i < path.length; i++) {
    const T = nrm(sub(path[Math.min(i + 1, path.length - 1)], path[Math.max(i - 1, 0)]));
    if (!N) N = nrm(crs(T, Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
    else { const d = dot(N, T); N = nrm([N[0] - T[0] * d, N[1] - T[1] * d, N[2] - T[2] * d]); }
    const B = crs(T, N);
    if (i) len += Math.hypot(...sub(path[i], path[i - 1]));
    for (let k = 0; k <= seg; k++) {
      const a = (k / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), n = [N[0] * c + B[0] * s, N[1] * c + B[1] * s, N[2] * c + B[2] * s];
      pos.push(path[i][0] + n[0] * r, path[i][1] + n[1] * r, path[i][2] + n[2] * r); nor.push(...n); uv.push(k / seg, len / 4);
    }
  }
  for (let i = 0; i < path.length - 1; i++) for (let k = 0; k < seg; k++) { const a = i * (seg + 1) + k, b = a + seg + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  // wind every triangle to face along its normals (outwards)
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t] * 3, idx[t + 1] * 3, idx[t + 2] * 3];
    const f = crs([pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]], [pos[c] - pos[a], pos[c + 1] - pos[a + 1], pos[c + 2] - pos[a + 2]]);
    if (f[0] * (nor[a] + nor[b] + nor[c]) + f[1] * (nor[a + 1] + nor[b + 1] + nor[c + 1]) + f[2] * (nor[a + 2] + nor[b + 2] + nor[c + 2]) < 0) { const x = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = x; }
  }
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i++) { min[i % 3] = Math.min(min[i % 3], pos[i]); max[i % 3] = Math.max(max[i % 3], pos[i]); }
  return { positions: new Float32Array(pos), normals: new Float32Array(nor), uvs: new Float32Array(uv), indices: pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), bounds: { min, max } };
}

/** `pc`: the PC's ports in world space ({ io, video, power }, from app/pc's pcPorts); `speakers`: [left, right], each
 * { plug, power, aux, back } in world space (app/speakers: the posts, the right one's mains inlet and AUX jack; `back` the way its back faces). */
export function buildCables(pc, speakers = []) {
  const root = new Node('cables');
  const rubber = new Material({ color: color('#0e0c0b'), roughness: 0.55, emissive: color('#0e0c0b').map((v) => v * 0.6) });
  // the centre lines are kept on the node, so a check can walk every cable against everything it might pass through
  const parts = [], paths = [];
  const lay = (pts, r, name) => { const path = spline(pts, 6).map((q) => settle(q, r)); parts.push({ geo: tube(path, r, 8, 0) }); paths.push({ name, r, pts: path }); };
  root.userData = { paths };
  const rest = (r) => DESK_TOP + r + 0.01, inTray = (r) => TRAY.y0 + TRAY.t + r + 0.01, onFloor = (r) => FLOOR + r + 0.01;
  const flat = (v) => { const l = Math.hypot(v[0], v[2]) || 1; return [v[0] / l, 0, v[2] / l]; };
  const at = (p, n, k, dy = 0) => [p[0] + n[0] * k, p[1] + dy, p[2] + n[2] * k];   // k out along n, dy up
  // which way a panel's back faces (from its two ports, which sit along the panel), and the PC's rear panel
  // (from each panel's yaw, as app/monitors lays them out: ±0.42 for the side screens. The ports can't tell us any more, since
  // the left screen is turned to portrait and its two ports now sit one above the other)
  const YAW = { center: 0, left: 0.42, right: -0.42 }, back = (id) => [-Math.sin(YAW[id]), 0, -Math.cos(YAW[id])];
  const pcT = flat([pc.power[0] - pc.io[0], 0, pc.power[2] - pc.io[2]]), pcN = [pcT[2], 0, -pcT[0]];
  const P = MONITOR_POLE, cz = P.clipsZ, px = P.x, pz = P.z;
  // over the desk's back edge from a lane on the desk, round the corner and down behind it (reversed, the way back up)
  const overEdge = (x, r, z) => [[x, rest(r), EDGE_Z], [x, -r, EDGE_Z - r - 0.12], [x, -1.4, z]];
  // along the floor in its lane, then up onto the strip into socket i (lanes and sockets are ordered so no two cables cross)
  const toStrip = (i, lane, r, x0) => {
    const sx = socketX(i), d = Math.sign(sx - x0) || 1, f = onFloor(r);
    // short straight pieces at both ends of a long run keep the curve on its lane (the turns would otherwise pull it off)
    const run = Math.abs(sx - x0) > 6 ? [[x0 + d * 1.2, f, lane], [x0 + d * 2.4, f, lane], [sx - d * 2.4, f, lane], [sx - d * 1.3, f, lane]] : Math.abs(sx - x0) > 2.8 ? [[x0 + d * 1.2, f, lane], [sx - d * 1.3, f, lane]] : [[(x0 + sx) / 2, f, lane]];
    return [...run, [sx - d * 0.2, f + 0.2, -25.2 + (lane + 25.2) * 0.3], [sx, -38.9, -25.25], [sx, -37.95, -25.5], [sx, -37.9, -26.4], [sx, -37.9, -27.2]];
  };
  // straight down behind the tray onto the strip's top, then a short bend forward into socket i's plug (its cable leaves the front)
  const onStrip = (i, r, x0, z0) => { const sx = socketX(i), top = STRIP[1] + 0.8; return [[x0 + (sx - x0) * 0.3, -33, z0 - 0.05], [sx, top + r + 1.6, z0 - 0.1], [sx, top + 0.5 + r * 0.2, -26.35], [sx, -37.9, -26.6], [sx, -37.9, -27.2]]; };
  // the far end of the tray: up out of it behind the desk's back edge and over onto the desk, then forward to the PC and up to a port
  const toPC = (x, r, lane, port, mid) => [[x + 1.9, inTray(r), lane], [x + 0.7, inTray(r), lane], [x + 0.15, -3.4, Math.min(lane, EDGE_Z - r - 0.1)], ...overEdge(x, r, Math.min(lane, EDGE_Z - r - 0.1) + 0.05).reverse(), [x, rest(r), EDGE_Z + 0.6], [x, rest(r), -8], [x + (port[0] - x) * 0.3, 2.2, -5.3], ...mid, at(port, pcN, 1.5, -1.2), at(port, pcN, 0.6), port];

  // ---------- the video leads. Pole slot, tray lane and rise are ordered so the leads never cross: the left screen's lead is the
  // leftmost on the pole, the frontmost of the three in the tray and the last to rise; the centre screen's is the rightmost, the
  // backmost and the first to rise. On the desk they run forward to the PC in that order, left to right.
  const vr = 0.2, vport = (k) => [pc.video[0] + pcT[0] * k, pc.video[1], pc.video[2] + pcT[2] * k];
  const VLEAD = { left: { slot: -0.5, tray: -24.16, rise: -44.8, port: -1 }, right: { slot: 0, tray: -24.58, rise: -44.0, port: 0 }, center: { slot: 0.5, tray: -25.0, rise: -43.2, port: 1 } };
  const zb = pz - B.collar - vr - 0.25;   // just behind the collar at the foot of the pole
  for (const [id, v] of Object.entries(VLEAD)) {
    const port = MONITOR_PORTS[id].video, nb = back(id), sx = px + v.slot, side = Math.sign(port[0] - px);
    // off the back of the panel and across to the pole: the side screens come in high, over the centre screen's lead
    const top = id === 'center'
      ? [port, at(port, nb, 1.05, -0.3), [px + 1.45, 10.9, pz - 0.85], [sx, 10.5, cz]]
      : [port, at(port, nb, 1.0, -0.3), [px + side * 16, 15.4, cz + 0.7], [px + side * 7, 14.6, cz + 0.2], [px + side * 2.2, 13.8, cz], [sx + side * 0.3, 13.5, cz], [sx, 13.0, cz], [sx, 12.0, cz]];
    // down the back of the pole through the clips, back clear of the collar, then straight back over the stand's two steps and the
    // desk's back edge, and down into the tray
    const pole = [[sx, 8.5, cz], [sx, 4.5, cz], [sx, 2.9, zb + 0.15], [sx, B.hi.y + vr + 0.01, zb - 0.1], [sx, B.hi.y + vr + 0.01, B.hi.z[0] + 0.1], [sx, B.lo.y + vr + 0.05, B.hi.z[0] - 0.35], [sx, B.lo.y + vr - 0.05, B.lo.z[0] + 0.03], [sx, 0.0, EDGE_Z - 0.25], [sx, -1.2, EDGE_Z - 0.4], [sx, -3.0, (EDGE_Z - 0.4 + v.tray) / 2], [sx - 0.5, inTray(vr), v.tray], [sx - 2.5, inTray(vr), v.tray]];
    lay([...top, ...pole, ...toPC(v.rise, vr, v.tray, vport(v.port), [])], vr, 'video-' + id);
  }
  // keyboard → PC: out of the back of the case, back between the left speaker and the little shelf, round the stand's base,
  // over the desk's back edge into the front lane of the tray (tucked under the desk), and up its far end to the rear USB
  const kr = 0.17, ky = rest(kr);
  lay([[-2.4, 0.55, -3.3], [-2.6, MAT_TOP + kr + 0.05, -4.4], [-3.4, MAT_TOP + kr + 0.01, -5.6], [-4.6, ky, -8.6], [-5.6, ky, -12.4], [-6.1, ky, -15.4], [-7.9, ky, -16.6], [-8.6, ky, -17.6], [-9.6, ky, -20.6], [-10.2, ky, -23.3], ...overEdge(-10.3, kr, -24.35), [-10.4, -2.9, -24.3], [-10.6, -3.3, -23.95], [-11.1, inTray(kr), -23.74], [-12.6, inTray(kr), -23.74], ...toPC(-45.6, kr, -23.74, pc.io, [[-46.2, 8.5, -2.9]])], kr, 'keyboard');

  // the desk mic (app/deskgear: base at [24, 0, 1.2]): out of the back of its base, straight back under the right screen and up to
  // the USB hub on the back of that screen, a little along the panel from its video port
  const mr = 0.13, rp = MONITOR_PORTS.right, rt = flat([rp.power[0] - rp.video[0], 0, rp.power[2] - rp.video[2]]), rnb = back('right');
  const hub = [rp.video[0] - rt[0] * 5, rp.video[1], rp.video[2] - rt[2] * 5];
  lay([[24.9, 0.3, -0.4], [25.0, rest(mr), -1.9], [25.2, rest(mr), -8], [hub[0] + 0.2, rest(mr), hub[2] - 0.6], at(hub, rnb, 1.6, -8), at(hub, rnb, 1.0, -0.6), at(hub, rnb, 0.4), hub], mr, 'mic');

  // ---------- power. Left of the stand everything drops behind the tray; the floor lanes run in front of the strip.
  // the PC: off its back, down to the desk, straight back and over the edge, down behind the tray, along the front lane
  const pr = 0.3, pcx = pc.power[0] - 0.8;
  lay([pc.power, at(pc.power, pcN, 0.8, -0.5), [pcx + 0.2, 0.9, pc.power[2] - 2.2], [pcx, rest(pr), pc.power[2] - 3.8], [pcx - 0.1, rest(pr), -20], [pcx - 0.1, rest(pr), EDGE_Z + 0.5], ...overEdge(pcx - 0.1, pr, -25.2), [pcx - 0.1, -2.6, -26.15], [pcx, -20, -26.2], [pcx, onFloor(pr) + 0.6, -26.1], ...toStrip(2, -24.1, pr, pcx)], pr, 'pc-power');
  // each screen's power lead: down from the back of its panel to the desk, back over the edge and down to the floor
  const MP = { left: { x: -28.2, lane: -24.6, sock: 1 }, center: { x: 8.6, lane: -25.1, sock: 7 }, right: { x: 35.8, lane: -24.1, sock: 5 } };
  for (const [id, m] of Object.entries(MP)) {
    const port = MONITOR_PORTS[id].power, nb = back(id), r = 0.16, y = rest(r), behind = m.x > TRAY.x0 && m.x < TRAY.x1, zd = behind ? -26.15 : -24.9;
    const down = id === 'center'
      ? [port, at(port, nb, 1.0, -0.4), [6.4, 7.5, -22.2], [m.x - 0.3, 2.4, -23.2], [m.x, y, -23.6]]
      : [port, at(port, nb, 1.1, -0.5), [port[0] + nb[0] * 2.4 + (m.x - port[0]) * 0.4, 5.5, port[2] + nb[2] * 2.4], [m.x, y, -20.5], [m.x, y, -23.4]];
    // (a lead that comes down behind the tray right over the strip drops straight onto it and into its plug from the front)
    const tail = behind && Math.abs(m.x - STRIP[0]) < STRIP_W / 2 ? onStrip(m.sock, r, m.x, zd) : [[m.x, onFloor(r) + 0.6, zd], ...toStrip(m.sock, m.lane, r, m.x)];
    lay([...down, ...overEdge(m.x, r, behind ? -25.2 : -24.6), [m.x, -2.6, zd], [m.x + 0.1, -20, zd], ...tail], r, 'power-' + id);
  }
  // the speakers, an active pair. The right one carries the amplifier: mains into its inlet (straight back, over the edge and down
  // behind the tray to the strip), the PC's audio into its AUX jack, and a speaker wire out of its posts to the passive left one.
  // The wire and the AUX lead share the tray with the rest: the wire in the lane in front of the keyboard's (it drapes over the
  // keyboard's lead where it comes in), the AUX lead in the front lane, from the PC's rear audio out at the tray's far end to the
  // right speaker: it comes in before every other lead and leaves after them, so it crosses none of them.
  const [spL, spR] = speakers;
  if (spL && spR && spR.power && spR.aux) {
    // up out of the tray's near end behind the desk's back edge and over onto the desk (toPC's mirror image)
    const rise = (x, r, lane) => [[x - 1.9, inTray(r), lane], [x - 0.7, inTray(r), lane], [x - 0.15, -3.4, Math.min(lane, EDGE_Z - r - 0.1)], ...overEdge(x, r, Math.min(lane, EDGE_Z - r - 0.1) + 0.05).reverse(), [x, rest(r), EDGE_Z + 0.6]];
    const along = (x0, x1, y, lane) => { const out = []; for (let k = 1; k < 4; k++) out.push([x0 + ((x1 - x0) * k) / 4, y, lane]); return out; };
    // the speaker wire: left post → back on the desk, left of the keyboard's lead → over the edge and down into its lane → along
    // the tray → up again behind the right speaker → its post
    const wr = 0.1, wl = -23.3, wy = inTray(wr), ex = -12.2, rx = 10.8, L0 = spL.plug, Lb = spL.back, R0 = spR.plug, Rb = spR.back;
    lay([L0, at(L0, Lb, 0.7, -0.55), [L0[0] + Lb[0] * 2.2 - 0.1, rest(wr), L0[2] + Lb[2] * 2.2], [ex, rest(wr), -21.0], [ex, rest(wr), -23.3], ...overEdge(ex, wr, -24.3),
      [ex, -3.1, -24.2], [ex - 0.05, -3.52, -23.74], [ex + 0.35, wy, -23.34], [ex + 1.5, wy, wl], ...along(ex + 1.5, rx - 1.9, wy, wl), ...rise(rx, wr, wl),
      [rx + 0.1, rest(wr), -20.0], [R0[0] - 0.1 + Rb[0] * 2.0, rest(wr), R0[2] + Rb[2] * 2.0 - 0.1], at(R0, Rb, 0.7, -0.55), R0], wr, 'speaker-wire');
    // the right speaker's mains lead: out of the inlet, down to the desk, back over the edge and down behind the tray to the strip
    const pr2 = 0.12, P0 = spR.power, Pb = spR.back, px2 = 12.0;
    lay([P0, at(P0, Pb, 0.8, -0.6), at(P0, Pb, 1.7, -2.3), [px2 + 0.2, rest(pr2), P0[2] + Pb[2] * 3.2], [px2, rest(pr2), -20.5], [px2, rest(pr2), -23.3], ...overEdge(px2, pr2, -25.2), [px2, -2.6, -26.15], [px2, -20, -26.2], [px2, onFloor(pr2) + 0.6, -26.1], ...toStrip(6, -24.6, pr2, px2)], pr2, 'speakerR-power');
    // the AUX lead: from the PC's rear audio out (the middle jack of three, over the USB ports) down behind the case, along the desk
    // to the tray's far end and into its front lane, the length of the tray, up behind the right speaker and into its jack
    const ar = 0.075, al = -22.85, ax = 13.0, audio = [pc.io[0], pc.io[1] + 1.94, pc.io[2]], A0 = spR.aux, Ab = spR.back;
    lay([...toPC(-46.3, ar, al, audio, [[-46.9, 9.8, -3.0]]).reverse(), ...along(-44.4, ax - 1.9, inTray(ar), al), ...rise(ax, ar, al),
      [ax + 0.1, rest(ar), -19.6], [A0[0] + Ab[0] * 2.2, rest(ar), A0[2] + Ab[2] * 2.2], at(A0, Ab, 0.9, -0.5), at(A0, Ab, 0.3), A0], ar, 'aux');
  }
  // the clamp lamp's cord: out of the clamp, down the outside of the desk's right end, along the floor in the front lane
  const lr = 0.15, cord = [LAMP_BASE[0] + 1.4, -1.5, LAMP_BASE[2]];
  lay([cord, [cord[0] + 0.4, -5, cord[2] - 0.4], [cord[0] + 0.5, -20, cord[2] - 1.8], [cord[0] + 0.2, -36, cord[2] - 2.5], [cord[0] - 0.4, onFloor(lr) + 0.3, cord[2] - 2.6], ...toStrip(4, -23.6, lr, cord[0] - 0.6)], lr, 'lamp-cord');
  // the strip's own cord, out of its left end behind everything, along the floor and up in front of the skirting to the wall socket
  const wr = 0.24;
  lay([[STRIP[0] - STRIP_W / 2 + 0.4, STRIP[1], -28.6], [STRIP[0] - STRIP_W / 2 - 1.0, onFloor(wr), -28.7], [SOCKET[0] + 1.4, onFloor(wr), -29.05], [SOCKET[0] + 0.2, onFloor(wr) + 0.5, -29.25], [SOCKET[0], -37.4, -29.25], [SOCKET[0], -34.5, -29.45], [SOCKET[0], -32.6, -29.7], [SOCKET[0], -31.7, -29.75]], wr, 'strip-cord');
  const cables = new Mesh(merge(parts), rubber, 'cables'); cables.castShadow = false; root.add(cables);

  // ---------- the tray, the power strip with its plugs, and the wall socket
  const put = (geo, p, r = [0, 0, 0]) => ({ geo, m: M4.compose(new Array(16), p, r, [1, 1, 1]), n: M4.compose(new Array(16), [0, 0, 0], r, [1, 1, 1]).filter((_, i) => i % 4 < 3 && i < 12) });
  const steel = new Material({ color: color('#1c1916'), roughness: 0.45, metalness: 0.6, emissive: color('#1c1916').map((v) => v * 0.5) });
  const tx = (TRAY.x0 + TRAY.x1) / 2, tw = TRAY.x1 - TRAY.x0, tzc = (TRAY.z0 + TRAY.z1) / 2, td = TRAY.z1 - TRAY.z0, th = TRAY.y1 - TRAY.y0;
  // (the floor of the tray fits between its two walls, so their outer faces never share a plane with it)
  const tray = [put(box(tw, TRAY.t, td - 2 * TRAY.t), [tx, TRAY.y0 + TRAY.t / 2, tzc]), put(box(tw, th, TRAY.t), [tx, TRAY.y0 + th / 2, TRAY.z1 - TRAY.t / 2]), put(box(tw, th, TRAY.t), [tx, TRAY.y0 + th / 2, TRAY.z0 + TRAY.t / 2])];
  // hung from the underside of the desk top by straps on its front wall
  for (const x of [-42, -28, -14, -1, 9.6]) tray.push(put(box(0.8, DESK_UNDER - TRAY.y0, 0.25), [x, (DESK_UNDER + TRAY.y0) / 2, TRAY.z1 + 0.125]));
  const trayMesh = new Mesh(merge(tray), steel, 'cable-tray'); trayMesh.castShadow = false; root.add(trayMesh);
  const shell = new Material({ color: color('#1a1715'), roughness: 0.6, emissive: color('#1a1715').map((v) => v * 0.6) });
  const hole = new Material({ color: color('#050404'), roughness: 0.9 });
  const body = [put(roundedBox({ w: STRIP_W, h: 1.6, d: 3.6, r: 0.4, seg: 2 }), STRIP), put(roundedBox({ w: 4.2, h: 0.4, d: 6, r: 0.3, seg: 2 }), [SOCKET[0], SOCKET[1], WALL_Z + 0.2], [Math.PI / 2, 0, 0])];
  // a plug in every socket that has a cable, and one in the wall
  for (const i of [1, 2, 4, 5, 6, 7]) body.push(put(roundedBox({ w: 1.3, h: 1.0, d: 1.7, r: 0.25, seg: 2 }), [socketX(i), STRIP[1] + 1.3, STRIP[2]]));
  body.push(put(roundedBox({ w: 1.3, h: 1.9, d: 0.9, r: 0.25, seg: 2 }), [SOCKET[0], SOCKET[1] - 0.4, WALL_Z + 0.85]));
  const strip = new Mesh(merge(body), shell, 'power-strip'); strip.castShadow = false; root.add(strip);
  const holes = [];
  for (let i = 0; i < 8; i++) holes.push(put(cylinder(0.55, 0.55, 0.1, 14), [socketX(i), STRIP[1] + 0.82, STRIP[2]]));
  holes.push(put(box(1.2, 1.8, 0.1), [SOCKET[0], SOCKET[1] + 1.6, WALL_Z + 0.42]));
  const sockets = new Mesh(merge(holes), hole, 'power-strip-sockets'); sockets.castShadow = false; root.add(sockets);
  const led = new Mesh(box(0.9, 0.12, 0.5), new Material({ color: [0, 0, 0], emissive: color('#ffb066'), emissiveIntensity: 1.6, unlit: true }), 'power-strip-led');
  led.position = [STRIP[0] - STRIP_W / 2 + 0.75, STRIP[1] + 0.82, STRIP[2] + 0.9]; led.castShadow = false; root.add(led);
  return root;
}
