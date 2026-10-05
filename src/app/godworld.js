// World 01, GodPlan ERP, built in code: the floor of the company that runs on it, cut open and seen from above like an architect's
// model. Every corner of the floor is a module (the same places the hotspots name): the dashboard fills the back wall and is live,
// the attendance gates stand at the entrance, Employees is the desk floor with the staff board, Payroll a glass office with its
// printer, CRM the sales corner with its pipeline board, and the core (Go and PostgreSQL) a glass server room. Lit cables run from
// the core under the floor to every corner, and the day keeps happening: people tap in at the gates, the tap travels to the core
// and up to the dashboard, payslips come out of the printer, deals move along the pipeline. A crane is still up: the build goes on.
// Units are the worlds' own (the plinth is 38 wide, its top at y 1.16); x and z are local to the world's origin.
import { Node, Mesh, Material, Texture } from 'engine/scene';
import { box, cylinder, sphere, cone, torus } from 'engine/geometry';
import { MONO, SANS } from 'engine/textures';
import { color } from 'engine/math';
import { flatten, atlasMerge } from 'app/bake';
import { KIT } from 'app/kbtown';

const { M, plain, BRASS, BRONZE, LAMP, GLOW, LINE, put, fuse, panel, atlas, fit, ICON, signBand } = KIT;
const F = 1.4;   // the floor's top (a slab over the plinth)
const S = 0.17;  // world units to atlas units (the atlas draws 640 px per atlas unit)

// ---------- people, at this scale (about 1.6 tall), standing or seated
const SKIN = '#e0b58a';
function figure(parent, hex, pos, { seated = false, ry = 0, scale = 1 } = {}) {
  const g = new Node('person'); g.position = pos; g.rotation[1] = ry; g.scale = [scale, scale, scale]; parent.add(g);
  if (seated) {
    put(g, fuse([[cylinder(0.2, 0.24, 0.62, 8), [0, 0.82, 0]], [box(0.36, 0.14, 0.42), [0, 0.5, 0.16]]]), plain(hex, 0.8), [0, 0, 0]);
    put(g, sphere(0.17, 10, 8), plain(SKIN, 0.8), [0, 1.3, 0]);
  } else {
    put(g, fuse([[cylinder(0.2, 0.24, 0.75, 8), [0, 1.02, 0]], [box(0.12, 0.6, 0.14), [-0.1, 0.32, 0]], [box(0.12, 0.6, 0.14), [0.1, 0.32, 0]]]), plain(hex, 0.8), [0, 0, 0]);
    put(g, sphere(0.17, 10, 8), plain(SKIN, 0.8), [0, 1.56, 0]);
  }
  return g;
}
function plant(parent, pos, s = 1) {
  put(parent, cylinder(0.3 * s, 0.24 * s, 0.5 * s, 10), plain('#8a5a34', 0.8), [pos[0], F + 0.25 * s, pos[2]]);
  put(parent, fuse([[sphere(0.45, 8, 6), [0, 0, 0]], [sphere(0.34, 8, 6), [0.25, 0.25, 0.1]], [sphere(0.32, 8, 6), [-0.22, 0.3, -0.08]]]), plain('#56603a', 0.85), [pos[0], F + 0.85 * s, pos[2]], null, [s, s, s]);
}
function desk(parent, pos, ry, screenUV, mat) {
  const g = new Node('desk'); g.position = pos; g.rotation[1] = ry; parent.add(g);
  put(g, box(1.8, 0.08, 0.9), plain('#6b4f36', 0.7), [0, 0.76, 0]);
  for (const x of [-0.82, 0.82]) put(g, box(0.06, 0.74, 0.8), BRONZE(), [x, 0.38, 0]);
  put(g, box(0.78, 0.48, 0.05), plain('#15120f', 0.4, 0.4), [0, 1.12, -0.26]);
  put(g, panel(0.7, 0.4, screenUV), mat, [0, 1.12, -0.232]).castShadow = false;
  put(g, box(0.06, 0.3, 0.06), BRONZE(), [0, 0.92, -0.3]);
  put(g, box(0.5, 0.03, 0.18), plain('#2b2520', 0.5), [0, 0.81, 0.08]);
  put(g, box(0.5, 0.08, 0.5), plain('#2b2520', 0.6), [0, 0.46, 0.75]);
  put(g, box(0.5, 0.5, 0.08), plain('#2b2520', 0.6), [0, 0.74, 0.98]);
  return g;
}
function board(parent, pos, ry, w, h, uv, mat) {   // a free-standing board on two legs, its face one atlas cell
  const g = new Node('board'); g.position = pos; g.rotation[1] = ry; parent.add(g);
  for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) put(g, box(0.08, h + 0.6, 0.08), BRONZE(), [x, (h + 0.6) / 2, 0]);
  put(g, box(w + 0.16, h + 0.16, 0.1), plain('#2b1a10', 0.7), [0, 0.6 + h / 2, 0]);
  put(g, panel(w, h, uv), mat, [0, 0.6 + h / 2, 0.056]).castShadow = false;
  return g;
}
const glassMat = () => M('worldGlass', { color: [0.85, 0.8, 0.7], roughness: 0.08, opacity: 0.16, transparent: true, depthWrite: false, fresnel: 0.25, fresnelColor: [1, 0.85, 0.6] });

// ---------- the live dashboard on the back wall: header, the modules down the side, four tiles, a chart; the tile of whatever just
// happened on the floor lights up (a tap at the gates, a payslip, a deal), and the chart keeps drawing
const MODULES = ['Dashboard', 'Employees', 'Attendance', 'Payroll', 'Tasks', 'CRM'];
function liveDashboard() {
  const W = 2048, H = 968, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  const tex = new Texture(cv, {}), A = '#d9a05b', Cr = '#e7ddc8', dim = '#5c4a3a';
  const state = { flash: { attendance: 0, payroll: 0, crm: 0, employees: 0 }, t: 0, last: -1 };
  const draw = (t) => {
    ctx.fillStyle = '#100c08'; ctx.fillRect(0, 0, W, H);
    // header
    ctx.fillStyle = '#1b140d'; ctx.fillRect(0, 0, W, 96);
    ctx.fillStyle = A; ctx.font = `700 54px ${SANS}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.letterSpacing = '0px'; ctx.fillText('GodPlan', 300, 50);
    ctx.fillStyle = 'rgba(231,221,200,0.55)'; ctx.font = `500 26px ${MONO}`; ctx.letterSpacing = '4px'; ctx.fillText('DASHBOARD', 560, 52);
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(W - 70 - i * 46, 48, 14, 0, 7); ctx.fillStyle = i === 0 ? A : dim; ctx.fill(); }
    // the modules down the side
    ctx.fillStyle = '#16110b'; ctx.fillRect(0, 96, 260, H - 96);
    MODULES.forEach((m, i) => { const on = i === 0; ctx.fillStyle = on ? 'rgba(217,160,91,0.18)' : 'transparent'; ctx.fillRect(16, 130 + i * 112, 228, 88); ctx.fillStyle = on ? A : 'rgba(231,221,200,0.6)'; ctx.font = `600 30px ${SANS}`; ctx.letterSpacing = '0px'; ctx.fillText(m, 40, 174 + i * 112); });
    // four tiles, each a picture of its module, lit when the floor just did something there
    const tiles = [['HEADCOUNT', 'employees'], ['ATTENDANCE', 'attendance'], ['PAYROLL', 'payroll'], ['PIPELINE', 'crm']], tw = 410, th = 300, ty = 132;
    tiles.forEach(([lab, k], i) => {
      const tx = 300 + i * (tw + 24), f = state.flash[k];
      ctx.fillStyle = `rgba(${Math.round(29 + 60 * f)},${Math.round(21 + 40 * f)},${Math.round(14 + 14 * f)},1)`; ctx.fillRect(tx, ty, tw, th);
      ctx.strokeStyle = f > 0.05 ? `rgba(255,214,150,${f})` : 'rgba(231,221,200,0.08)'; ctx.lineWidth = 4; ctx.strokeRect(tx + 2, ty + 2, tw - 4, th - 4);
      ctx.fillStyle = Cr; ctx.font = `600 26px ${MONO}`; ctx.letterSpacing = '3px'; ctx.fillText(lab, tx + 28, ty + 42);
      ctx.fillStyle = A; ctx.strokeStyle = A; const cx = tx + tw / 2, cy = ty + 180, Sz = 170;
      if (k === 'employees') ICON.people(ctx, cx, cy, Sz);
      else if (k === 'attendance') { const p = 0.55 + 0.35 * ((t * 0.05) % 1); ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(cx, cy, 70, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke(); ctx.strokeStyle = dim; ctx.beginPath(); ctx.arc(cx, cy, 70, -Math.PI / 2 + p * Math.PI * 2, Math.PI * 1.5); ctx.stroke(); }
      else if (k === 'payroll') for (let b = 0; b < 6; b++) { const bh = 40 + ((b * 37 + 11) % 5) * 22 + (b === 5 ? 30 * f : 0); ctx.fillRect(cx - 150 + b * 52, cy + 80 - bh, 34, bh); }
      else { const cols = 3; for (let c = 0; c < cols; c++) { ctx.fillStyle = 'rgba(231,221,200,0.12)'; ctx.fillRect(cx - 170 + c * 116, cy - 80, 104, 170); ctx.fillStyle = A; for (let r = 0; r < 3 - c; r++) ctx.fillRect(cx - 162 + c * 116, cy - 70 + r * 50, 88, 38); } }
    });
    // the chart under them, drawing itself across the screen
    const cx0 = 300, cy0 = 470, cw = W - 340, ch = 440;
    ctx.fillStyle = '#1d150e'; ctx.fillRect(cx0, cy0, cw, ch);
    ctx.strokeStyle = 'rgba(231,221,200,0.06)'; ctx.lineWidth = 2; for (let g = 1; g < 5; g++) { ctx.beginPath(); ctx.moveTo(cx0, cy0 + (ch * g) / 5); ctx.lineTo(cx0 + cw, cy0 + (ch * g) / 5); ctx.stroke(); }
    const n = 40, reach = Math.min(1, ((t * 0.06) % 1.25)), pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n; if (u > reach) break; const v = 0.62 - 0.38 * u + 0.08 * Math.sin(u * 13) + 0.04 * Math.sin(u * 31); pts.push([cx0 + u * cw, cy0 + ch * v]); }
    if (pts.length > 1) {
      ctx.beginPath(); ctx.moveTo(pts[0][0], cy0 + ch); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.lineTo(pts[pts.length - 1][0], cy0 + ch); ctx.closePath(); ctx.fillStyle = 'rgba(184,98,44,0.35)'; ctx.fill();
      ctx.beginPath(); pts.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.strokeStyle = A; ctx.lineWidth = 6; ctx.stroke();
      const e = pts[pts.length - 1]; ctx.beginPath(); ctx.arc(e[0], e[1], 12, 0, 7); ctx.fillStyle = '#ffe0b0'; ctx.fill();
    }
    tex.needsUpdate = true;
  };
  draw(0);
  return { texture: tex, state, tick: (dt, t) => { for (const k in state.flash) state.flash[k] = Math.max(0, state.flash[k] - dt * 0.8); const q = Math.floor(t * 8); if (q !== state.last) { state.last = q; draw(t); } }, ping: (k) => { state.flash[k] = 1; } };
}

// ---------- the boards and screens around the floor, in one atlas
function drawCell(ctx, c, W, H, glow) {
  const A = glow ? '#ffc27a' : '#d9a05b', Cr = glow ? '#ffe2b8' : '#f1e2c8', ink = glow ? '#000' : '#2b1a10';
  switch (c.kind) {
    case 'sign': if (!glow) { ctx.fillStyle = '#1b130c'; ctx.fillRect(0, 0, W, H); } signBand(ctx, 0, 0, W, H, c.text, glow, 0.6, c.sub); return;
    case 'org': {   // the staff board: who works here, in their teams
      if (!glow) { ctx.fillStyle = '#efe4cf'; ctx.fillRect(0, 0, W, H); }
      ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(H * 0.11)}px ${SANS}`; ctx.letterSpacing = '2px'; ctx.fillText('EMPLOYEES', W * 0.05, H * 0.12);
      for (let t = 0; t < 4; t++) for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) {
        const x = W * (0.05 + t * 0.235 + k * 0.105), y = H * (0.28 + r * 0.24);
        if (!glow) { ctx.fillStyle = '#d6c7ab'; ctx.fillRect(x, y, W * 0.095, H * 0.2); ctx.fillStyle = ['#b8622c', '#8e6a3d', '#66703e', '#5c4a3a'][(t + r + k) % 4]; ctx.beginPath(); ctx.arc(x + W * 0.0475, y + H * 0.07, H * 0.045, 0, 7); ctx.fill(); ctx.fillRect(x + W * 0.02, y + H * 0.13, W * 0.055, H * 0.025); }
      }
      return;
    }
    case 'kanban': {   // the sales pipeline: three columns, deals as cards
      if (!glow) { ctx.fillStyle = '#efe4cf'; ctx.fillRect(0, 0, W, H); }
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ['LEADS', 'TALKING', 'WON'].forEach((lab, i) => {
        const x = W * (0.04 + i * 0.32); ctx.fillStyle = ink; ctx.font = `700 ${Math.round(H * 0.1)}px ${SANS}`; ctx.letterSpacing = '2px'; ctx.fillText(lab, x, H * 0.12);
        for (let r = 0; r < 4 - i; r++) { ctx.fillStyle = glow ? (i === 2 ? '#7a4c1e' : '#000') : ['#d9a05b', '#c9b48a', '#b8622c'][i]; ctx.fillRect(x, H * (0.24 + r * 0.18), W * 0.27, H * 0.14); }
      });
      return;
    }
    case 'payroll': {   // the payroll screen: a month's runs as bars, the payday marked
      ctx.fillStyle = glow ? '#1c1007' : '#120d09'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = A; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(H * 0.13)}px ${SANS}`; ctx.letterSpacing = '2px'; ctx.fillText('PAYROLL', W * 0.06, H * 0.14);
      for (let b = 0; b < 12; b++) { const bh = H * (0.18 + ((b * 29) % 7) * 0.06); ctx.fillStyle = b === 11 ? Cr : A; ctx.fillRect(W * (0.06 + b * 0.075), H * 0.9 - bh, W * 0.05, bh); }
      return;
    }
    case 'gate': {   // the attendance screen on the gate post
      ctx.fillStyle = glow ? '#1c1007' : '#120d09'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = A; ctx.fillStyle = A; ICON.clock(ctx, W / 2, H * 0.4, W * 0.7);
      ctx.font = `700 ${Math.round(H * 0.12)}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '1px'; ctx.fillText('TAP IN', W / 2, H * 0.82);
      return;
    }
    case 'leave': {   // the leave calendar beside the gates
      if (!glow) { ctx.fillStyle = '#efe4cf'; ctx.fillRect(0, 0, W, H); }
      ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(H * 0.12)}px ${SANS}`; ctx.letterSpacing = '2px'; ctx.fillText('LEAVE', W * 0.06, H * 0.13);
      for (let r = 0; r < 4; r++) for (let d = 0; d < 7; d++) { const on = (r * 7 + d) % 9 === 3 || (r * 7 + d) % 11 === 5; ctx.fillStyle = on ? (glow ? '#7a4c1e' : '#b8622c') : (glow ? '#000' : '#d6c7ab'); ctx.fillRect(W * (0.06 + d * 0.13), H * (0.28 + r * 0.17), W * 0.11, H * 0.13); }
      return;
    }
    case 'screen': {   // a desk screen: a table of rows
      ctx.fillStyle = glow ? '#1c1007' : '#120d09'; ctx.fillRect(0, 0, W, H);
      for (let r = 0; r < 5; r++) { ctx.fillStyle = r === 0 ? A : glow ? '#5a3a18' : '#8a7a66'; ctx.fillRect(W * 0.08, H * (0.12 + r * 0.17), W * (r === 0 ? 0.5 : 0.84), H * 0.08); }
      return;
    }
    case 'phone': {
      ctx.fillStyle = glow ? '#1c1007' : '#120d09'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = A; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(W * 0.14)}px ${SANS}`; ctx.letterSpacing = '0px'; ctx.fillText('GodPlan', W / 2, H * 0.08);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = glow ? '#3a2410' : '#2a1d12'; ctx.fillRect(W * 0.1, H * (0.17 + i * 0.18), W * 0.8, H * 0.14); ctx.fillStyle = A; ctx.fillRect(W * 0.16, H * (0.21 + i * 0.18), W * (0.25 + (i % 3) * 0.15), H * 0.03); }
      return;
    }
    case 'window': { ctx.fillStyle = glow ? '#3a2a14' : '#cbb68e'; ctx.fillRect(0, 0, W, H); for (let i = 0; i < 6; i++) { ctx.fillStyle = glow ? '#b07a3c' : '#f0c27e'; ctx.fillRect(W * (0.03 + i * 0.163), H * 0.15, W * 0.13, H * 0.7); } return; }
  }
}

/** Build world 01 on its plinth. Returns what buildDiorama expects: { hs, lights, update, wake }. */
export function buildGodWorld(root, O, mini = false) {
  const stat = new Node('godplan-floor'); root.add(stat);
  const live = [], dash = liveDashboard();
  // the atlas: the boards and the little screens (sizes in world units, scaled into the atlas)
  const C = {
    org: { w: 6, h: 2.4, kind: 'org' }, kanban: { w: 5, h: 2.2, kind: 'kanban' }, payroll: { w: 3.2, h: 1.7, kind: 'payroll' }, gate: { w: 0.5, h: 0.7, kind: 'gate' },
    leave: { w: 2.4, h: 1.6, kind: 'leave' }, screen: { w: 0.7, h: 0.4, kind: 'screen' }, phone: { w: 1.4, h: 2.6, kind: 'phone' }, window: { w: 8, h: 1.4, kind: 'window' },
    wall: { w: 17, h: 1.1, kind: 'sign', text: 'GODPLAN', sub: 'ONE SYSTEM, EVERY DEPARTMENT' },
    core: { w: 4.4, h: 0.7, kind: 'sign', text: 'THE CORE', sub: 'GO · POSTGRESQL' }, hr: { w: 4, h: 0.7, kind: 'sign', text: 'EMPLOYEES' }, pay: { w: 4, h: 0.7, kind: 'sign', text: 'PAYROLL' },
    crm: { w: 4, h: 0.7, kind: 'sign', text: 'CRM' }, att: { w: 5, h: 0.7, kind: 'sign', text: 'ATTENDANCE & LEAVE' },
  };
  const cells = Object.values(C).map((c) => ({ ...c, w: c.w * S, h: c.h * S, ref: c }));
  const tex = atlas(cells, (ctx, c, W, H, glow) => drawCell(ctx, c.ref, W, H, glow), 2048);
  for (const c of cells) c.ref.uv = c.uv;
  const am = new Material({ color: [1, 1, 1], map: tex.map, emissiveMap: tex.emissiveMap, emissive: color('#ffc27a'), emissiveIntensity: 1.3, roughness: 0.6 });
  const sign = (k, x, y, z, ry = 0) => { const g = new Node(); g.position = [x, y, z]; g.rotation[1] = ry; stat.add(g); put(g, box(C[k].w + 0.16, C[k].h + 0.16, 0.08), plain('#2b1a10', 0.7), [0, 0, -0.03]); put(g, panel(C[k].w, C[k].h, C[k].uv), am, [0, 0, 0.012]).castShadow = false; return g; };

  // ---------- the floor plate, the walls that hold the story (the back wall with the dashboard, the left with its windows)
  put(stat, box(34, 0.24, 30), plain('#3a2c20', 0.85), [0, 1.28, -1]);
  put(stat, box(34.2, 0.06, 30.2), BRONZE(), [0, 1.17, -1]);
  for (const [x, z, w, d] of [[-8, -3.2, 16, 0.5], [6, -3.2, 14, 0.5], [0, 2, 0.5, 14]]) put(stat, box(w, 0.01, d), plain('#5a4a3a', 0.9), [x, F + 0.006, z]);   // carpet runs
  put(stat, box(32, 11, 0.6), plain('#221c18', 0.6), [0, F + 5.5, -14.4]);
  put(stat, box(18, 9, 0.12), BRASS(), [0, F + 5.15, -14.05]);
  // (unlit: a screen gives light, it doesn't catch the room's lamps as a glare)
  const dashMat = new Material({ color: [1, 1, 1], map: dash.texture, unlit: true });
  put(stat, panel(17.4, 8.2, [0, 0, 1, 1]), dashMat, [0, F + 5.15, -13.98]).castShadow = false;
  sign('wall', 0, F + 10.3, -14.0);
  put(stat, box(0.6, 3.8, 18), plain('#3a2c20', 0.8), [-16.7, F + 1.9, -5]);
  put(stat, panel(8, 1.4, C.window.uv), am, [-16.39, F + 2.2, -9], [0, Math.PI / 2, 0]).castShadow = false;
  put(stat, panel(8, 1.4, C.window.uv), am, [-16.39, F + 2.2, 0], [0, Math.PI / 2, 0]).castShadow = false;

  // ---------- the core: a glass server room in the back-left corner, racks with their lights, the database beside them
  {
    const x0 = -15.8, x1 = -8.4, z0 = -13.8, z1 = -7.2, h = 4.2, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    put(stat, box(x1 - x0, 0.08, z1 - z0), plain('#15120f', 0.4, 0.3), [cx, F + 0.04, cz]);
    for (const [x, z, w, d] of [[cx, z1, x1 - x0, 0.06], [x1, cz, 0.06, z1 - z0]]) put(stat, box(w, h, d), glassMat(), [x, F + h / 2, z]).castShadow = false;
    for (const [x, z, w, d] of [[cx, z1, x1 - x0, 0.14], [x1, cz, 0.14, z1 - z0]]) put(stat, box(w, 0.14, d), BRONZE(), [x, F + h, z]);
    put(stat, box(0.14, h, 0.14), BRONZE(), [x1, F + h / 2, z1]);
    const rackLed = M('rackLed', { color: [1, 0.7, 0.35], emissive: color('#ffb766'), emissiveIntensity: 1.8 });
    const leds = [];
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
      const rx = -14.6 + i * 1.3, rz = -12.6 + r * 2.6;
      put(stat, box(1, 3.1, 0.9), plain('#1c1712', 0.4, 0.4), [rx, F + 1.55, rz]);
      for (let k = 0; k < 7; k++) { const led = put(stat, box(0.7, 0.05, 0.02), rackLed, [rx, F + 0.5 + k * 0.38, rz + 0.46]); led.castShadow = false; }
    }
    // the database: three stacked discs, lit at the seams (PostgreSQL behind every screen)
    for (let i = 0; i < 3; i++) { put(stat, cylinder(0.9, 0.9, 0.8, 24), plain('#d6c7ab', 0.5), [-9.6, F + 0.45 + i * 0.95, -8.6]); put(stat, cylinder(0.92, 0.92, 0.1, 24), LINE(), [-9.6, F + 0.9 + i * 0.95, -8.6]).castShadow = false; }
    sign('core', cx, F + h + 0.8, z1 + 0.05);
    live.push((dt, t) => { rackLed.emissive = [1, 0.62 + 0.25 * Math.sin(t * 7.3), 0.3]; });
    void leds;
  }

  // ---------- Employees: the desk floor on the left, the staff board behind it
  const deskSeats = [];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
    const x = -14 + i * 2.6, z = 0 + r * 3.2;
    desk(stat, [x, F, z], 0, C.screen.uv, am);
    if ((i + r) % 4 !== 3) figure(stat, ['#b8622c', '#e7ddc8', '#8e6a3d', '#d9a05b'][(i + r) % 4], [x, F, z + 0.78], { seated: true, ry: Math.PI });
    deskSeats.push([x, z + 0.9]);
  }
  board(stat, [-9, F, -1.6], 0, C.org.w, C.org.h, C.org.uv, am);
  sign('hr', -9, F + 3.45, -1.62);
  plant(stat, [-16, 0, 6.2], 1.1);

  // ---------- Payroll: a glass office back right, a desk, the printer with its payslips, the safe, its screen
  let slip = null;
  {
    const x0 = 3, x1 = 13.5, z0 = -12.6, z1 = -5.4, h = 2.6, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    for (const [x, z, w, d] of [[cx, z1, x1 - x0, 0.06], [x0, cz, 0.06, z1 - z0], [x1, cz, 0.06, z1 - z0]]) put(stat, box(w, h, d), glassMat(), [x, F + h / 2, z]).castShadow = false;
    for (const [x, z, w, d] of [[cx, z1, x1 - x0, 0.1], [x0, cz, 0.1, z1 - z0], [x1, cz, 0.1, z1 - z0]]) put(stat, box(w, 0.1, d), BRONZE(), [x, F + h, z]);
    put(stat, box(2.4, 0.08, 1.2), plain('#6b4f36', 0.7), [8, F + 0.78, -9]); for (const x of [6.9, 9.1]) put(stat, box(0.06, 0.76, 1.1), BRONZE(), [x, F + 0.39, -9]);
    figure(stat, '#8e6a3d', [8, F, -8.1], { seated: true, ry: Math.PI });
    put(stat, box(1, 0.6, 0.8), plain('#d6c7ab', 0.6), [11.4, F + 0.3, -9]); put(stat, box(1.04, 0.5, 0.84), plain('#3b3a33', 0.5, 0.3), [11.4, F + 0.85, -9]);
    for (let i = 0; i < 6; i++) put(stat, box(0.6, 0.02, 0.8), plain('#efe4cf', 0.9), [12.6, F + 0.62 + i * 0.025, -9.2 + (i % 2) * 0.03]);
    put(stat, box(1, 0.6, 0.8), plain('#3b3a33', 0.5, 0.3), [12.6, F + 0.3, -9.2]);
    put(stat, box(1.2, 1.4, 1.1), plain('#2b2520', 0.4, 0.4), [4.2, F + 0.7, -11.6]); put(stat, cylinder(0.22, 0.22, 0.08, 16), BRASS(), [4.2, F + 0.8, -11.03], [Math.PI / 2, 0, 0]);
    put(stat, box(C.payroll.w + 0.16, C.payroll.h + 0.16, 0.1), plain('#15120f', 0.4, 0.3), [8, F + 2.0, -12.5]);
    put(stat, panel(C.payroll.w, C.payroll.h, C.payroll.uv), am, [8, F + 2.0, -12.44]).castShadow = false;
    sign('pay', cx, F + h + 0.7, z1 + 0.05);
    // a payslip slides out of the printer now and then and the payroll tile on the dashboard answers
    slip = put(root, box(0.5, 0.015, 0.7), plain('#efe4cf', 0.9), [11.4, F + 1.12, -9]); slip.userData.dynamic = true;
  }

  // ---------- CRM: the sales corner front right, round tables with phones, the pipeline board
  {
    for (const [x, z] of [[7, 3], [11.5, 3], [9.2, 7]]) {
      put(stat, cylinder(0.9, 0.9, 0.08, 20), plain('#6b4f36', 0.7), [x, F + 0.76, z]); put(stat, cylinder(0.08, 0.12, 0.74, 8), BRONZE(), [x, F + 0.38, z]);
      put(stat, box(0.3, 0.08, 0.2), plain('#15120f', 0.5), [x + 0.2, F + 0.84, z]);
      for (let k = 0; k < 2; k++) { const a = k * Math.PI + 0.4; figure(stat, ['#e7ddc8', '#b8622c', '#66703e'][k % 3], [x + Math.cos(a) * 1.2, F, z + Math.sin(a) * 1.2], { seated: true, ry: -a + Math.PI / 2 }); }
    }
    board(stat, [13.2, F, 5.2], -0.45, C.kanban.w, C.kanban.h, C.kanban.uv, am);
    sign('crm', 13.2, F + 3.35, 5.2).rotation[1] = -0.45;
  }

  // ---------- Attendance & leave: the gates at the entrance, the screen on the post, the leave calendar beside them
  const gateMat = M('gateLit', { color: [1, 0.75, 0.4], emissive: color('#ffcf8a'), emissiveIntensity: 1, roughness: 0.4 });
  const lanes = [-2.4, -0.8, 0.8, 2.4];
  {
    for (const x of [-3.2, -1.6, 0, 1.6, 3.2]) { put(stat, box(0.3, 1.05, 1.4), plain('#2b2520', 0.4, 0.4), [x, F + 0.52, 10.6]); put(stat, box(0.32, 0.06, 1.42), gateMat, [x, F + 1.07, 10.6]).castShadow = false; }
    for (const x of lanes) put(stat, box(1.2, 0.5, 0.04), glassMat(), [x, F + 0.8, 10.6]).castShadow = false;
    put(stat, box(0.4, 1.8, 0.4), plain('#2b2520', 0.4, 0.4), [4.6, F + 0.9, 10.6]);
    put(stat, panel(C.gate.w, C.gate.h, C.gate.uv), am, [4.6, F + 1.4, 10.81]).castShadow = false;
    board(stat, [-6, F, 10.4], 0.25, C.leave.w, C.leave.h, C.leave.uv, am);
    sign('att', 0, F + 2.3, 11.4);
    for (let i = 0; i < 3; i++) put(stat, box(8, 0.01, 0.6), plain(i % 2 ? '#4a3b2c' : '#5a4a3a', 0.95), [0, F + 0.007, 12.2 + i * 0.6]);
  }

  // ---------- the lobby in the middle: a reception desk under the dashboard, plants
  put(stat, box(5, 1.05, 1.2), plain('#6b4f36', 0.7), [0, F + 0.52, -9.5]); put(stat, box(5.1, 0.06, 1.3), BRASS(), [0, F + 1.07, -9.5]);
  figure(stat, '#d9a05b', [0, F, -10.4]);
  for (const [x, z, s] of [[-3.6, -9.5, 1], [3.6, -9.5, 1], [-7.4, 6.6, 0.9], [15.6, 9.8, 1.1], [-15.6, -5.4, 1]]) plant(stat, [x, 0, z], s);

  // ---------- on the phone too: the app standing at the front left
  {
    const g = new Node('phone'); g.position = [-12, F, 10]; g.rotation[1] = 0.35; stat.add(g);
    put(g, box(1.2, 0.3, 0.8), plain('#3b2b1d', 0.8), [0, 0.15, 0]);
    put(g, box(1.6, 2.9, 0.2), plain('#15120f', 0.3, 0.4), [0, 1.85, 0], [-0.1, 0, 0]);
    put(g, panel(C.phone.w, C.phone.h, C.phone.uv), am, [0, 1.85, 0.11], [-0.1, 0, 0]).castShadow = false;
  }

  // ---------- the cables: from the core under the floor to every corner, and the light that runs along them
  const routes = [
    [[-8.4, -10], [-6.6, -10], [-6.6, -3.2], [-9, -3.2], [-9, -1.9]],           // to Employees
    [[-6.6, -10], [-6.6, -13.2], [0, -13.2]],                                     // up to the dashboard
    [[-6.6, -3.2], [8, -3.2], [8, -5.3]],                                         // to Payroll
    [[-6.6, -3.2], [9.2, -3.2], [9.2, 1.6]],                                      // to CRM
    [[-6.6, -3.2], [0, -3.2], [0, 9.8]],                                          // to the gates
  ];
  const cableMat = LINE();
  for (const r of routes) for (let i = 0; i < r.length - 1; i++) {
    const [a, b] = [r[i], r[i + 1]], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    put(stat, box(Math.abs(dx) + 0.12, 0.03, Math.abs(dz) + 0.12), cableMat, [(a[0] + b[0]) / 2, F + 0.02, (a[1] + b[1]) / 2]).castShadow = false; void L;
  }
  const pathLen = (r) => r.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - r[i][0], p[1] - r[i][1]), 0);
  const along = (r, d) => { for (let i = 0; i < r.length - 1; i++) { const a = r[i], b = r[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= l) return [a[0] + ((b[0] - a[0]) * d) / l, a[1] + ((b[1] - a[1]) * d) / l]; d -= l; } return r[r.length - 1]; };
  // the routes as whole paths out of the core (the later ones branch off the first)
  const full = [routes[0], [routes[0][0], routes[0][1], ...routes[1].slice(1)], [routes[0][0], routes[0][1], routes[0][2], ...routes[2].slice(1)], [routes[0][0], routes[0][1], routes[0][2], ...routes[3].slice(1)], [routes[0][0], routes[0][1], routes[0][2], ...routes[4].slice(1)]];
  const pulseMat = M('worldPulse', { color: [1, 0.85, 0.6], emissive: color('#fff0d0'), emissiveIntensity: 3, roughness: 0.3 });
  const pulses = [];
  if (!mini) for (let i = 0; i < 7; i++) { const p = put(root, sphere(0.16, 10, 8), pulseMat, [0, F + 0.12, 0]); p.castShadow = false; p.userData.dynamic = true; pulses.push({ p, route: full[i % full.length], k: i / 7, back: false }); }

  // ---------- the crane: an extension still going up behind the payroll office
  {
    const cr = new Node('crane'); cr.position = [15.6, F, -12.6]; stat.add(cr);
    const paint = plain('#d9a05b', 0.6, 0.1), mastH = 12;
    for (const [dx, dz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) put(cr, box(0.08, mastH, 0.08), paint, [dx, mastH / 2, dz]);
    for (let y = 0.6; y < mastH; y += 1) put(cr, box(0.7, 0.05, 0.05), paint, [0, y, 0.3], [0, 0, 0.8]);
    for (const [x, z] of [[14.6, -13.6], [16.8, -13.6], [14.6, -11], [16.8, -11]]) put(stat, box(0.12, 3.6, 0.12), plain('#8a7a66', 0.6, 0.3), [x, F + 1.8, z]);
    for (const y of [1.8, 3.6]) put(stat, box(2.4, 0.1, 2.8), plain('#8a7a66', 0.6, 0.3), [15.7, F + y, -12.3]);
  }
  let jib = null;
  if (!mini) {
    jib = new Node('jib'); jib.position = [15.6, F + 12, -12.6]; jib.userData.dynamic = true; root.add(jib);
    put(jib, fuse([[box(11, 0.22, 0.4), [-4, 0.2, 0]], [box(3.2, 0.22, 0.4), [3, 0.2, 0]], [box(0.1, 1.6, 0.1), [0, 1, 0]]]), plain('#d9a05b', 0.6, 0.1), [0, 0, 0]);
    put(jib, fuse([[box(0.9, 0.8, 0.8), [4.2, -0.3, 0]], [box(0.8, 0.7, 0.7), [0.3, -0.3, 0.5]]]), plain('#3b2b1d', 0.8), [0, 0, 0]);
    put(jib, fuse([[box(0.03, 3, 0.03), [-7.5, -1.5, 0]], [box(1.6, 0.14, 0.3), [-7.5, -3, 0]]]), BRONZE(), [0, 0, 0]);
  }

  // ---------- the people coming in: from the front edge to a gate, a tap, then on to their desks
  const walkers = [];
  if (!mini) for (let i = 0; i < 4; i++) { const g = figure(root, ['#b8622c', '#e7ddc8', '#66703e', '#8e6a3d'][i], [lanes[i], F, 14], { ry: Math.PI }); g.userData.dynamic = true; walkers.push({ g, lane: lanes[i], phase: i * 2.6, tapped: -1 }); }

  // merge what stands still: one palette draw for the plain parts, one for the atlas, a few for what glows
  flatten(stat, 'godplan-world');
  const mats = atlasMerge(stat, 'godplan-world');

  // ---------- the hotspots: the six corners of the floor (asset-local x, z; y absolute), and where their pins stand
  const hs = {};
  const spot = (id, center, size, anchor, cam) => {
    const hit = new Mesh(box(size[0], size[1], size[2]), M('hsHit', { color: [0, 0, 0], opacity: 0.01, transparent: true, depthWrite: false }));
    hit.position = [...center]; hit.castShadow = false; root.add(hit);
    hs[id] = { mesh: hit, anchor, center, size, cam };
  };
  spot('screen', [0, F + 5.15, -13.6], [18, 9, 1.2], [6.5, F + 10.9, -13.4], { dir: [0.08, 0.2, 1], max: 25 });
  spot('desk', [-10, F + 1.2, 1], [11, 2.6, 7], [-9, F + 4.8, -1.4]);
  spot('papers', [8.2, F + 1.3, -9], [10.5, 2.8, 7.4], [8.2, F + 4, -6]);
  spot('lamp', [9.8, F + 1.2, 4.6], [9, 2.6, 7], [9.2, F + 4.4, 1.2]);
  spot('tower', [-12, F + 2.1, -10.5], [7.6, 4.4, 6.8], [-12, F + 6.2, -8]);
  spot('greenhouse', [0, F + 1, 10.6], [8, 2.2, 3], [0, F + 3.2, 11.4]);

  // ---------- light: the dashboard's glow over the floor, a lamp over the desks, one over the sales corner, the server room's own
  const lights = mini ? [] : [
    { id: 'dash', position: [O[0], F + 7, O[2] - 4], color: color('#ffc98a'), intensity: 3.2, distance: 26 },
    { id: 'lamp-hr', position: [O[0] - 10, F + 5, O[2] + 2], color: color('#ffd6a3'), intensity: 2.2, distance: 14 },
    { id: 'lamp-crm', position: [O[0] + 9, F + 5, O[2] + 4], color: color('#ffd6a3'), intensity: 2, distance: 13 },
    { id: 'core', position: [O[0] - 12, F + 3, O[2] - 10], color: color('#ffb766'), intensity: 1.8, distance: 10 },
  ].map((l) => ({ ...l, base: l.intensity }));

  // ---------- the day: walkers, taps, pulses, payslips, the crane; everything that glows wakes as the visitor arrives
  const emissives = mats.filter((mt) => mt.emissiveIntensity > 0 && Math.max(...mt.emissive) > 0).map((mt) => ({ mat: mt, base: mt.emissiveIntensity }));
  emissives.push({ mat: pulseMat, base: pulseMat.emissiveIntensity });
  const state = { wake: 0.3, target: 1 };
  const send = (route, back = false) => { const free = pulses.find((q) => q.k >= 1); if (free) { free.route = route; free.k = 0; free.back = back; } };
  let nextSlip = 4;
  const update = (dt, t, cam) => {
    state.wake += (state.target - state.wake) * (1 - Math.exp(-2.2 * dt));
    for (const e of emissives) e.mat.emissiveIntensity = e.base * (0.12 + 0.88 * state.wake);
    { const k = 0.25 + 0.75 * state.wake; dashMat.color = [k, k, k]; }
    dash.tick(dt, t);
    for (const f of live) f(dt, t);
    // pulses: out from the core to a corner (or back from the gates after a tap), then free for the next
    for (const q of pulses) {
      if (q.k >= 1) { if (Math.random() < dt * 0.6) { q.route = full[Math.floor(Math.random() * full.length)]; q.k = 0; q.back = false; } else { q.p.visible = false; continue; } }
      const L = pathLen(q.route); q.k = Math.min(1, q.k + (dt * 6) / L); const d = (q.back ? 1 - q.k : q.k) * L, [x, z] = along(q.route, d);
      q.p.visible = true; q.p.position = [x, F + 0.14, z]; const s = Math.min(1, Math.min(q.k, 1 - q.k) * 10); q.p.scale = [s, s, s];
      if (q.k >= 1 && q.back) dash.ping('attendance');
    }
    // walkers: in from the edge, a tap at the gate (the gate post's light jumps, a pulse runs to the core), on to the desks
    walkers.forEach((w, i) => {
      const c = (t + w.phase) % 10.4, g = w.g;
      if (c < 3) { g.position = [w.lane, F, 14.6 - c * 1.1]; g.visible = true; }
      else if (c < 3.8) { g.position = [w.lane, F, 11.3]; if (w.tapped !== Math.floor((t + w.phase) / 10.4)) { w.tapped = Math.floor((t + w.phase) / 10.4); gateMat.emissive = [1, 0.95, 0.75]; send(full[4], true); } }
      else if (c < 8) { const k = (c - 3.8) / 4.2, seat = deskSeats[(i * 3 + 1) % deskSeats.length]; g.position = [w.lane + (seat[0] - w.lane) * k, F, 11.3 + (seat[1] + 2 - 11.3) * k]; g.rotation[1] = Math.atan2(seat[0] - w.lane, seat[1] + 2 - 11.3); }
      else { g.visible = false; }
      if (c < 3) g.rotation[1] = Math.PI;
    });
    gateMat.emissive = gateMat.emissive.map((v, k) => v + ([1, 0.81, 0.54][k] - v) * (1 - Math.exp(-2 * dt)));
    // a payslip comes out now and then
    if (slip) { if (t > nextSlip) { nextSlip = t + 7; dash.ping('payroll'); } const k = Math.max(0, Math.min(1, 1 - (nextSlip - t - 5.5) / 1.2)); slip.position = [11.4, F + 1.12, -9 + 0.7 * k]; slip.visible = k > 0.02; }
    if ((t % 9) < dt) dash.ping('crm');
    if ((t % 6.5) < dt) dash.ping('employees');
    if (jib) jib.rotation[1] = -0.4 + Math.sin(t * 0.1) * 0.3;
    if (cam) lights.forEach((l) => { l.intensity = l.base * state.wake; });
  };
  return { hs, lights, update, wake: state };
}
