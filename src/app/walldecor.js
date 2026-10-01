// The back wall above the monitors: a to-do whiteboard in the middle, Pokémon things either side (a figure and a
// Poké Ball on a floating shelf, two shadow boxes of graded card slabs) and a shelf of trailing pothos. Static: everything is baked into a few meshes (app/bake).
// Units: 1 unit ≈ 19.5 mm; the back wall's face is z = -30.6 and the desk top is y = 0.
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, cylinder, sphere, cone, torus } from 'engine/geometry';
import { drawTexture, SANS, MONO } from 'engine/textures';
import { color } from 'engine/math';
import { flatten } from 'app/bake';

const WALL = -30.6;
const HAND = '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive';
const rnd = (() => { let a = 20260; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();

// ---------- textures
function todoTexture() {
  return drawTexture(1024, 640, (ctx, w, h) => {
    ctx.fillStyle = '#f3f1ec'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(200,200,210,0.25)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 6; k++) { ctx.strokeStyle = 'rgba(120,130,150,0.06)'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(rnd() * w, rnd() * h); ctx.quadraticCurveTo(rnd() * w, rnd() * h, rnd() * w, rnd() * h); ctx.stroke(); } // old erased smudges
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#c0392b'; ctx.font = `700 64px ${HAND}`; ctx.fillText('TO-DO', 60, 70);
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(56, 108); ctx.quadraticCurveTo(200, 100, 292, 112); ctx.stroke();
    const items = [[true, 'watch box: Nautilus, Santos, Aquaracer'], [true, 'three 27" monitors + stand'], [false, 'orders API: reserve stock in one tx'], [false, 'deploy GODPLAN ERP v2'], [false, 'reply client emails'], [false, 'gym 7pm (no excuses)']];
    items.forEach(([done, t], k) => {
      const y = 170 + k * 72, ink = k % 3 === 2 ? '#1f4e9c' : '#1d1d1f';
      ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.strokeRect(64, y - 18, 36, 36);
      if (done) { ctx.strokeStyle = '#1f8a4c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(68, y); ctx.lineTo(80, y + 14); ctx.lineTo(108, y - 24); ctx.stroke(); }
      let fs = 38; ctx.font = `600 ${fs}px ${HAND}`; while (ctx.measureText(t).width > 590 && fs > 24) { fs -= 1; ctx.font = `600 ${fs}px ${HAND}`; }
      ctx.fillStyle = done ? 'rgba(29,29,31,0.55)' : ink; ctx.fillText(t, 124, y);
      if (done) { const tw = ctx.measureText(t).width; ctx.strokeStyle = 'rgba(29,29,31,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(120, y + 2); ctx.lineTo(128 + tw, y - 2); ctx.stroke(); }
    });
    // a little architecture doodle in the corner
    ctx.strokeStyle = '#1f4e9c'; ctx.lineWidth = 4; ctx.font = `600 26px ${HAND}`; ctx.fillStyle = '#1f4e9c';
    [['web', 780, 230], ['API', 780, 330], ['DB', 780, 430]].forEach(([t, x, y]) => { ctx.strokeRect(x - 50, y - 28, 100, 56); ctx.fillText(t, x - 22, y); });
    for (const y of [258, 358]) { ctx.beginPath(); ctx.moveTo(780, y); ctx.lineTo(780, y + 44); ctx.lineTo(772, y + 34); ctx.moveTo(780, y + 44); ctx.lineTo(788, y + 34); ctx.stroke(); }
    ctx.fillStyle = '#c0392b'; ctx.font = `700 30px ${HAND}`; ctx.fillText('ship it!', 720, 585);
  });
}
function stickyTexture(text, bg) {
  return drawTexture(256, 256, (ctx, w, h) => { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(0, 0, w, 34); ctx.fillStyle = '#2b2b2b'; ctx.font = `600 34px ${HAND}`; ctx.textBaseline = 'middle'; text.split('\n').forEach((l, k) => ctx.fillText(l, 20, 90 + k * 50)); });
}
// ---------- graded Pokémon card slabs: the card art, and the red-and-white grading label above it
const TYPES = {
  electric: { frame: '#f6d33b', art: ['#ffe680', '#f2a516'], icon: '#f7c71c' }, fire: { frame: '#e8623a', art: ['#ffb26b', '#d2401f'], icon: '#e8501e' },
  water: { frame: '#4f9ae0', art: ['#9ad4ff', '#2b6cc4'], icon: '#3b8be0' }, grass: { frame: '#6cbf4f', art: ['#c4eb8f', '#3d8f35'], icon: '#4caf3a' },
  psychic: { frame: '#b26ad8', art: ['#f0b8ff', '#7d3fb8'], icon: '#a24fd0' }, dark: { frame: '#4a4f63', art: ['#7d86a8', '#1f2333'], icon: '#2f3346' },
  normal: { frame: '#c9b8a0', art: ['#f2e6d3', '#a48e70'], icon: '#b9a58a' }, dragon: { frame: '#3f8f6a', art: ['#9fe0c0', '#1f5c45'], icon: '#2f7d5c' },
};
function emblem(ctx, type, cx, cy, r) {
  ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = r * 0.14; ctx.lineCap = 'round';
  ctx.beginPath();
  if (type === 'fire') { ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.9, -r * 0.1, r * 0.55, r * 0.6); ctx.quadraticCurveTo(0, r, -r * 0.55, r * 0.6); ctx.quadraticCurveTo(-r * 0.9, -r * 0.1, 0, -r); ctx.fill(); }
  else if (type === 'water') { ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.9, r * 0.2, 0, r * 0.85); ctx.quadraticCurveTo(-r * 0.9, r * 0.2, 0, -r); ctx.fill(); }
  else if (type === 'grass') { ctx.ellipse(0, 0, r * 0.45, r, 0.6, 0, Math.PI * 2); ctx.fill(); }
  else if (type === 'psychic') { for (let a = 0; a < 12; a += 0.2) { const rr = r * a / 12; a ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(0, 0); } ctx.stroke(); }
  else if (type === 'dark') { ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.2, r * 0.7, 0, Math.PI * 2); ctx.fill(); }
  else if (type === 'dragon') { ctx.moveTo(-r, r * 0.5); ctx.lineTo(-r * 0.2, -r); ctx.lineTo(r * 0.1, -r * 0.1); ctx.lineTo(r, -r * 0.6); ctx.lineTo(r * 0.3, r); ctx.closePath(); ctx.fill(); }
  else if (type === 'normal') { for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2, b = a + Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(b) * r * 0.45, Math.sin(b) * r * 0.45); } ctx.closePath(); ctx.fill(); }
  else { ctx.moveTo(-r * 0.2, -r); ctx.lineTo(r * 0.5, -r * 0.1); ctx.lineTo(0, -r * 0.1); ctx.lineTo(r * 0.2, r); ctx.lineTo(-r * 0.5, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function cardTexture(name, type, hp, holo) {
  const T = TYPES[type];
  return drawTexture(256, 356, (ctx, w, h) => {
    ctx.fillStyle = '#f2c72e'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = T.frame; ctx.fillRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#1b1b1b'; ctx.font = `800 21px ${SANS}`; ctx.textBaseline = 'middle'; ctx.fillText(name, 20, 30);
    ctx.textAlign = 'right'; ctx.font = `700 13px ${SANS}`; ctx.fillText('HP', w - 64, 31); ctx.font = `800 20px ${SANS}`; ctx.fillText(String(hp), w - 38, 30); ctx.textAlign = 'left';
    ctx.fillStyle = T.icon; ctx.beginPath(); ctx.arc(w - 24, 30, 11, 0, Math.PI * 2); ctx.fill(); emblem(ctx, type, w - 24, 30, 7);
    // the art window: a type-coloured scene, a holo sheen on the rare ones, the subject's emblem big in the middle
    ctx.fillStyle = '#c9a227'; ctx.fillRect(18, 48, w - 36, 150);
    const g = ctx.createLinearGradient(0, 52, 0, 194); g.addColorStop(0, T.art[0]); g.addColorStop(1, T.art[1]); ctx.fillStyle = g; ctx.fillRect(22, 52, w - 44, 142);
    if (holo) { for (let k = 0; k < 9; k++) { const hg = ctx.createLinearGradient(22 + k * 30, 52, 52 + k * 30, 194); hg.addColorStop(0, 'rgba(255,255,255,0)'); hg.addColorStop(0.5, `hsla(${k * 40},90%,75%,0.35)`); hg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = hg; ctx.fillRect(22, 52, w - 44, 142); } }
    if (name === 'Pikachu') {
      const cx = w / 2, cy = 128;
      for (const s of [-1, 1]) { ctx.fillStyle = '#ffd31a'; ctx.beginPath(); ctx.moveTo(cx + s * 20, cy - 26); ctx.lineTo(cx + s * 52, cy - 72); ctx.lineTo(cx + s * 38, cy - 16); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.moveTo(cx + s * 45, cy - 62); ctx.lineTo(cx + s * 52, cy - 72); ctx.lineTo(cx + s * 49, cy - 52); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#ffd31a'; ctx.strokeStyle = '#7a5410'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, 44, 36, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (const s of [-1, 1]) { ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(cx + s * 18, cy - 6, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e4402a'; ctx.beginPath(); ctx.arc(cx + s * 32, cy + 10, 8, 0, Math.PI * 2); ctx.fill(); }
    } else { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(w / 2, 176, 54, 10, 0, 0, Math.PI * 2); ctx.fill(); emblem(ctx, type, w / 2, 120, 48); }
    // attack box
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(22, 206, w - 44, 112);
    ctx.fillStyle = '#1b1b1b'; ctx.font = `700 14px ${SANS}`;
    [['Quick Attack', 30], ['Signature Move', 90]].forEach(([t, d], k) => { const y = 228 + k * 44; ctx.fillStyle = T.icon; ctx.beginPath(); ctx.arc(36, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#1b1b1b'; ctx.fillText(t, 52, y); ctx.textAlign = 'right'; ctx.font = `800 16px ${SANS}`; ctx.fillText(String(d), w - 30, y); ctx.textAlign = 'left'; ctx.font = `700 14px ${SANS}`; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(52, y + 12, w - 110, 2); });
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.font = `600 10px ${MONO}`; ctx.fillText('025/165  ★', 22, 336);
  });
}
// Gengar's face, painted onto its body sphere: the sphere faces +z at u = 0.25, v = 0.5 (canvas x 128, y 128)
function gengarFaceTexture() {
  return drawTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8f7fd0'; ctx.fillRect(0, 0, w, h);
    const cx = 128;
    for (const sd of [-1, 1]) {
      const ex = cx + sd * 32, ey = 86;
      ctx.save(); ctx.beginPath(); ctx.moveTo(ex - sd * 20, ey + 2); ctx.lineTo(ex + sd * 20, ey - 14); ctx.quadraticCurveTo(ex + sd * 22, ey + 12, ex - sd * 2, ey + 14); ctx.quadraticCurveTo(ex - sd * 18, ey + 12, ex - sd * 20, ey + 2); ctx.closePath();
      ctx.fillStyle = '#ffd9dc'; ctx.fill(); ctx.clip();
      ctx.fillStyle = '#e0303e'; ctx.beginPath(); ctx.arc(ex - sd * 2, ey + 3, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a0a12'; ctx.beginPath(); ctx.arc(ex - sd * 2, ey + 3, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.strokeStyle = '#2a1840'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ex - sd * 21, ey + 1); ctx.lineTo(ex + sd * 21, ey - 15); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(cx - 58, 116); ctx.quadraticCurveTo(cx, 128, cx + 58, 116); ctx.quadraticCurveTo(cx + 40, 168, cx, 170); ctx.quadraticCurveTo(cx - 40, 168, cx - 58, 116); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#2a1840'; ctx.lineWidth = 4; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.strokeStyle = '#3a2a55'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx - 56, 136); ctx.quadraticCurveTo(cx, 150, cx + 56, 136); ctx.stroke();
    for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(cx + k * 12, 118); ctx.lineTo(cx + k * 12, 172); ctx.stroke(); }
    ctx.restore();
  });
}
function spotPoolTexture() {
  return drawTexture(256, 256, (ctx, w, h) => { const g = ctx.createRadialGradient(w / 2, 0, 8, w / 2, h * 0.15, h * 1.05); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
}
function slabLabelTexture(name, year, grade) {
  return drawTexture(256, 72, (ctx, w, h) => {
    ctx.fillStyle = '#d61f26'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#ffffff'; ctx.fillRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = '#111'; ctx.textBaseline = 'middle';
    ctx.font = `700 12px ${SANS}`; ctx.fillText(`${year} POKEMON`, 14, 19); ctx.font = `800 15px ${SANS}`; ctx.fillText(name.toUpperCase(), 14, 37); ctx.font = `600 10px ${MONO}`; ctx.fillText('#' + (40000000 + name.length * 1234567), 14, 55);
    ctx.textAlign = 'right'; ctx.font = `700 11px ${SANS}`; ctx.fillText('GEM MT', w - 16, 22); ctx.font = `900 26px ${SANS}`; ctx.fillText(String(grade), w - 16, 46);
    for (let k = 0; k < 26; k++) { ctx.fillRect(130 + k * 3, 48, k % 3 ? 1 : 2, 12); }
  });
}
function pokeBallTexture() { return drawTexture(256, 128, (ctx, w, h) => { ctx.fillStyle = '#e3350d'; ctx.fillRect(0, 0, w, h / 2); ctx.fillStyle = '#f2f2f2'; ctx.fillRect(0, h / 2, w, h / 2); ctx.fillStyle = '#151515'; ctx.fillRect(0, h / 2 - 5, w, 10); }); }

// ---------- plants
function leafGeo() { const g = sphere(1, 10, 6); return g; }
/** A vine: a stem through pts (y, z offsets along a hanging curve) with leaves on alternating sides. */
function vine(add, mats, pts, { leafSize = 0.85, every = 0.9 } = {}) {
  const leaf = leafGeo();
  let carry = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz);
    // stem segment
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const yaw = Math.atan2(dx, dz), pitch = Math.acos(Math.max(-1, Math.min(1, dy / (len || 1))));
    add(cylinder(0.07, 0.07, len, 5), mats.stem, mid, [Math.atan2(dz, dy), 0, -Math.asin(dx / (len || 1))]); void pitch; void yaw;
    for (let t = carry; t < len; t += every) {
      const p = [a[0] + dx * (t / len), a[1] + dy * (t / len), a[2] + dz * (t / len)], side = rnd() < 0.5 ? -1 : 1, s = leafSize * (0.7 + rnd() * 0.5);
      add(leaf, rnd() < 0.35 ? mats.leafLight : rnd() < 0.5 ? mats.leaf : mats.leafDark, [p[0] + side * 0.45 * s, p[1] - 0.15, p[2] + 0.25 + rnd() * 0.3], [-1.2 + rnd() * 0.6, rnd() * Math.PI * 2, side * (0.4 + rnd() * 0.5)], null, [s, s * 0.12, s * 0.7]);
      carry = t + every - len;
    }
  }
}
/** Points of a strand hanging from p0, swinging a little sideways. */
function strand(p0, length, sway) { const pts = []; const n = Math.max(3, Math.round(length / 1.2)); for (let k = 0; k <= n; k++) { const t = k / n; pts.push([p0[0] + Math.sin(t * 2.4) * sway, p0[1] - length * t, p0[2] + 0.4 + t * 0.6]); } return pts; }

export function buildWallDecor() {
  const root = new Node('wall-decor');
  const M = {
    wood: new Material({ color: color('#5a3a22'), roughness: 0.5, metalness: 0.05 }),
    frame: new Material({ color: color('#141210'), roughness: 0.45, metalness: 0.3 }),
    alu: new Material({ color: color('#a7a9ad'), roughness: 0.3, metalness: 0.8, emissive: color('#1a1a1c') }),
    board: new Material({ color: [1, 1, 1], map: todoTexture(), roughness: 0.25, emissive: [0.05, 0.05, 0.05] }),
    acrylic: new Material({ color: [0.9, 0.92, 0.95], roughness: 0.04, opacity: 0.07, transparent: true, depthWrite: false, fresnel: 0.5, fresnelColor: color('#ffffff') }),
    velvet: new Material({ color: color('#121214'), roughness: 1 }),
    brass: new Material({ color: color('#c79a52'), roughness: 0.3, metalness: 0.8, emissive: color('#2a1c08') }),
    spotLed: new Material({ color: [0, 0, 0], emissive: color('#fff0d4'), emissiveIntensity: 2.4, unlit: true, receiveShadow: false }),
    pool: new Material({ color: color('#ffe2b0'), map: spotPoolTexture(), opacity: 0.5, transparent: true, depthWrite: false, unlit: true, receiveShadow: false }),
    paper: new Material({ color: color('#efe7d6'), roughness: 0.9 }),
    stem: new Material({ color: color('#3f5a2a'), roughness: 0.8 }),
    leaf: new Material({ color: color('#3e7a3a'), roughness: 0.55, emissive: color('#0a1608') }),
    leafLight: new Material({ color: color('#79a94a'), roughness: 0.55, emissive: color('#101a08') }),
    leafDark: new Material({ color: color('#24492a'), roughness: 0.6, emissive: color('#061006') }),
    pot: new Material({ color: color('#e8e1d5'), roughness: 0.4 }),
    potDark: new Material({ color: color('#c46a3c'), roughness: 0.6 }),
    soil: new Material({ color: color('#2a1d14'), roughness: 1 }),
    gengar: new Material({ color: color('#8f7fd0'), roughness: 0.5, emissive: color('#8f7fd0').map((v) => v * 0.3) }),
    gengarFace: new Material({ color: [1, 1, 1], map: gengarFaceTexture(), emissiveMap: gengarFaceTexture(), roughness: 0.5, emissive: [0.3, 0.3, 0.3] }),
    eyeRed: new Material({ color: color('#e8333a'), roughness: 0.3, emissive: color('#3a0608') }),
    yellow: new Material({ color: color('#ffd31a'), roughness: 0.45, emissive: color('#2a1f00') }),
    black: new Material({ color: color('#141414'), roughness: 0.4 }),
    red: new Material({ color: color('#e4402a'), roughness: 0.45 }),
    ball: new Material({ color: [1, 1, 1], map: pokeBallTexture(), roughness: 0.25 }),
    white: new Material({ color: color('#f4f4f4'), roughness: 0.3 }),
    brown: new Material({ color: color('#8a5a2b'), roughness: 0.6 }),
    markerB: new Material({ color: color('#1f4e9c'), roughness: 0.4 }), markerR: new Material({ color: color('#c0392b'), roughness: 0.4 }), markerK: new Material({ color: color('#1d1d1f'), roughness: 0.4 }),
  };
  const add = (geo, mat, p, r, order, s) => { const m = new Mesh(geo, mat); m.position = p; if (r) m.rotation = r; if (s) m.scale = s; root.add(m); return m; };
  const Z = (d) => WALL + d;                 // d = distance out from the wall
  // a black shadow box on a velvet back, three by two slabs: clear acrylic case, the card inside, the grade label on top
  const slabBox = (x, y, cards) => {
    const SW = 4.3, SH = 7.0, G = 0.8, cols = 3, rows = 2, W = cols * SW + (cols + 1) * G, H = rows * SH + (rows + 1) * G;
    add(box(W, H, 0.2), M.velvet, [x, y, Z(0.1)]);
    const pl = add(box(W - 0.4, H - 0.4, 0.02), M.pool, [x, y + 0.2, Z(0.22)]); pl.renderOrder = 5;
    for (const sx of [-1, 1]) { add(cylinder(0.12, 0.12, 2.6, 8), M.brass, [x + sx * (W / 2 - 2), y + H / 2 + 1.6, Z(1.3)], [Math.PI / 2 - 0.5, 0, 0]); add(cylinder(0.32, 0.32, 0.3, 14), M.brass, [x + sx * (W / 2 - 2), y + H / 2 + 1.0, Z(0.15)], [Math.PI / 2, 0, 0]); }
    add(cylinder(0.42, 0.42, W - 1.4, 18), M.brass, [x, y + H / 2 + 2.15, Z(2.4)], [0, 0, Math.PI / 2]);
    add(box(W - 1.8, 0.06, 0.34), M.spotLed, [x, y + H / 2 + 1.74, Z(2.3)]);
    for (const s of [-1, 1]) { add(box(W + 1.6, 0.8, 1.8), M.frame, [x, y + s * (H / 2 + 0.4), Z(0.9)]); add(box(0.8, H, 1.8), M.frame, [x + s * (W / 2 + 0.4), y, Z(0.9)]); }
    cards.forEach(([name, type, hp, holo], k) => {
      const cx = x - W / 2 + G + SW / 2 + (k % cols) * (SW + G), cy = y + H / 2 - G - SH / 2 - Math.floor(k / cols) * (SH + G), z = Z(0.55);
      add(roundedBox({ w: SW, h: SH, d: 0.34, r: 0.12, seg: 2 }), M.acrylic, [cx, cy, z]).renderOrder = 10;
      add(box(3.2, 4.45, 0.02), (() => { const t = cardTexture(name, type, hp, holo); return new Material({ color: [1, 1, 1], map: t, emissiveMap: t, emissive: [0.62, 0.58, 0.5], roughness: holo ? 0.15 : 0.45, metalness: holo ? 0.25 : 0, fresnel: holo ? 0.35 : 0, fresnelColor: [1, 0.95, 1] }); })(), [cx, cy - 0.85, z]);
      add(box(3.9, 1.1, 0.02), (() => { const t = slabLabelTexture(name, 1999 + (k * 7 + name.length) % 25, 10); return new Material({ color: [1, 1, 1], map: t, emissiveMap: t, emissive: [0.55, 0.52, 0.46], roughness: 0.5 }); })(), [cx, cy + 2.65, z]);
    });
  };
  // ---------- the to-do whiteboard, its marker tray and a few sticky notes and magnets
  const BX = 0, BY = 45, BW = 30, BH = 18.75;
  add(box(BW, BH, 0.3), M.board, [BX, BY, Z(0.45)]);
  for (const s of [-1, 1]) { add(roundedBox({ w: BW + 1.2, h: 0.6, d: 0.9, r: 0.2, seg: 2 }), M.alu, [BX, BY + s * (BH / 2 + 0.3), Z(0.45)]); add(roundedBox({ w: 0.6, h: BH, d: 0.9, r: 0.2, seg: 2 }), M.alu, [BX + s * (BW / 2 + 0.3), BY, Z(0.45)]); }
  add(box(12, 0.25, 1.6), M.alu, [BX - 6, BY - BH / 2 - 0.9, Z(0.9)]); add(box(12, 0.6, 0.15), M.alu, [BX - 6, BY - BH / 2 - 0.7, Z(1.65)]);
  [[M.markerB, -9.5], [M.markerR, -7.6], [M.markerK, -5.7]].forEach(([m, x]) => { add(cylinder(0.32, 0.32, 3.4, 12), m, [BX + x, BY - BH / 2 - 0.45, Z(1.0)], [0, 0, Math.PI / 2]); add(cylinder(0.33, 0.33, 1.0, 12), M.white, [BX + x + 1.1, BY - BH / 2 - 0.45, Z(1.0)], [0, 0, Math.PI / 2]); });
  add(roundedBox({ w: 3.2, h: 1.0, d: 1.2, r: 0.2, seg: 2 }), M.black, [BX - 2.4, BY - BH / 2 - 0.3, Z(1.05)]);
  const sticky = (x, y, rot, text, bg) => { const m = new Material({ color: [1, 1, 1], map: stickyTexture(text, bg), roughness: 0.8, emissive: [0.03, 0.03, 0.02] }); add(box(4.2, 4.2, 0.05), m, [x, y, Z(0.64)], [0, 0, rot]); };
  sticky(BX + 11.5, BY + 6.0, -0.08, 'deadline\nFRIDAY', '#ffe46b');
  sticky(BX + 12.6, BY - 6.4, 0.07, 'call\nclient', '#ff9fb2');
  for (const [x, y, m] of [[BX + 2.5, BY + 8.2, M.red], [BX + 11.5, BY + 7.9, M.markerB], [BX + 12.6, BY - 4.5, M.markerK]]) add(cylinder(0.45, 0.45, 0.35, 16), m, [x, y, Z(0.85)], [Math.PI / 2, 0, 0]);
  // ---------- left: a floating shelf with a Gengar figure and a Poké Ball, then a shadow box of graded slabs
  const SX = -41, SY = 38;
  add(box(11, 0.7, 4.2), M.wood, [SX, SY, Z(2.1)]);
  // Gengar figure (~12 cm), after the official art: a pear-shaped lavender body (wider at the hips), the face painted on
  // (angry red eyes, the big white grin), tall pointed ears, a crown of spikes standing up and a few down the back, arms held
  // out with three claws, short thick legs
  const px = SX - 2.2, py = SY + 0.35, pz = Z(2.3);
  add(sphere(2.2, 36, 24), M.gengarFace, [px, py + 3.0, pz], null, null, [1.12, 1.0, 0.86]);              // head-and-chest, face on it
  add(sphere(2.0, 28, 18), M.gengar, [px, py + 1.9, pz - 0.1], null, null, [1.22, 0.95, 0.92]);           // the wide hips
  for (const sd of [-1, 1]) {
    add(cone(0.8, 2.6, 16), M.gengar, [px + sd * 1.45, py + 5.3, pz - 0.15], [0, 0, -sd * 0.5]);            // ears, up and out
    add(cone(0.5, 1.4, 12), M.gengar, [px + sd * 2.45, py + 3.7, pz - 0.2], [0, 0, -sd * 1.15]);             // cheek tufts
    add(cone(0.6, 2.0, 12), M.gengar, [px + sd * 2.75, py + 2.2, pz + 0.2], [0, 0, -sd * (Math.PI / 2 + 0.35)]); // arms held out
    for (const k of [-1, 0, 1]) add(cone(0.17, 0.6, 8), M.gengar, [px + sd * 3.75, py + 1.85 + k * 0.28, pz + 0.25 + k * 0.1], [0, 0, -sd * (Math.PI / 2 + 0.6)]);
    add(sphere(0.85, 16, 10), M.gengar, [px + sd * 1.05, py + 0.5, pz + 0.3], null, null, [1, 0.62, 1.25]);  // legs
    for (const k of [-1, 0, 1]) add(cone(0.14, 0.45, 8), M.gengar, [px + sd * 1.05 + k * 0.32, py + 0.32, pz + 1.35], [Math.PI / 2, 0, 0]);
  }
  // the crown: spikes standing up over the head, then a jagged row down the back
  for (const [x, y, z, r, h, tz, tx] of [[0, 5.6, -0.3, 0.45, 1.7, 0, -0.15], [-0.6, 5.35, -0.5, 0.4, 1.3, 0.35, -0.2], [0.6, 5.35, -0.5, 0.4, 1.3, -0.35, -0.2], [0, 4.6, -1.5, 0.45, 1.3, 0, -0.9], [-0.55, 3.8, -1.95, 0.42, 1.1, 0.3, -1.2], [0.55, 3.6, -1.95, 0.42, 1.1, -0.3, -1.25], [0, 2.7, -2.1, 0.42, 1.0, 0, -1.45]])
    add(cone(r, h, 10), M.gengar, [px + x, py + y, pz + z], [tx, 0, tz]);
  add(cone(0.4, 1.1, 10), M.gengar, [px, py + 1.0, pz - 2.0], [-1.9, 0, 0]);                              // the tail
  // Poké Ball on a little stand
  const bx = SX + 3.0, by = SY + 0.35; // the ball, right of the figure
  add(cylinder(0.9, 1.1, 0.4, 24), M.black, [bx, by + 0.2, Z(2.1)]);
  const ball = add(sphere(1.6, 28, 18), M.ball, [bx, by + 2.0, Z(2.1)], [0, Math.PI / 2, 0]);
  add(torus(1.6, 0.09, 36, 6), M.black, [bx, by + 2.0, Z(2.1)], [Math.PI / 2, 0, 0]);
  add(cylinder(0.45, 0.45, 0.25, 20), M.black, [bx, by + 2.0, Z(2.1) + 1.55], [Math.PI / 2, 0, 0]);
  add(cylinder(0.3, 0.3, 0.3, 20), M.white, [bx, by + 2.0, Z(2.1) + 1.62], [Math.PI / 2, 0, 0]);
  void ball;
  slabBox(-26, 46, [['Pikachu', 'electric', 60, true], ['Charizard', 'fire', 170, true], ['Mewtwo', 'psychic', 130, false], ['Gengar', 'dark', 110, false], ['Blastoise', 'water', 150, true], ['Umbreon', 'dark', 120, true]]);
  // ---------- right: a shelf of trailing pothos, then the framed Pikachu
  const PX = 25, PY = 50;
  add(box(15, 0.7, 4.0), M.wood, [PX, PY, Z(2.0)]);
  for (const [x, mat, r] of [[PX - 4, M.pot, 1.5], [PX + 3.5, M.potDark, 1.3]]) {
    add(cylinder(r, r * 0.8, r * 1.6, 24), mat, [x, PY + 0.35 + r * 0.8, Z(2.0)]);
    add(cylinder(r * 0.92, r * 0.92, 0.1, 24), M.soil, [x, PY + 0.35 + r * 1.55, Z(2.0)]);
    // a crown of leaves, and strands spilling over the shelf edge
    for (let k = 0; k < 9; k++) { const a = rnd() * Math.PI * 2, s = 0.9 + rnd() * 0.5; add(leafGeo(), rnd() < 0.4 ? M.leafLight : M.leaf, [x + Math.cos(a) * r * 0.7, PY + 0.4 + r * 1.7 + rnd() * 0.8, Z(2.0) + Math.sin(a) * r * 0.7], [-0.6 + rnd() * 1.2, rnd() * 6.28, rnd() * 0.8], null, [s, s * 0.12, s * 0.7]); }
    for (let k = 0; k < 4; k++) vine(add, M, strand([x + (k - 1.5) * 0.8, PY + 0.3, Z(3.6)], 7 + rnd() * 9, (rnd() - 0.5) * 2.4));
  }
  slabBox(42, 45, [['Rayquaza', 'dragon', 180, true], ['Lugia', 'psychic', 160, true], ['Venusaur', 'grass', 160, false], ['Eevee', 'normal', 60, false], ['Snorlax', 'normal', 150, false], ['Mew', 'psychic', 70, true]]);
  root.traverse((n) => { if (n.geometry) n.castShadow = false; });
  flatten(root, 'wall-decor');
  return { root };
}
