// A wall clock for the front wall, over the shoe rack by the door: a turned walnut rim round a cream face with sixty minute ticks
// and twelve hour bars (no numerals, no name), black hour and minute hands and a coral seconds hand with a counterweight, on a
// brass boss, under a glass that only shows in its rim of reflected light. It keeps the visitor's own time: the hands are set
// from the clock on their machine every frame, the seconds hand sweeping rather than ticking.
// The room's lamps don't reach this wall, so every material paints in a little of its own colour as light (the room scales it with
// `dimmable`), and the walnut and the brass carry a warm rim. Local frame: origin at the centre of the face's back, on the wall,
// facing +z; the room turns it to face into the room. 1 unit ≈ 19 mm: 24 across (46 cm), 2.6 deep.
import { Node, Mesh, Material } from 'engine/scene';
import { box, cylinder, merge } from 'engine/geometry';
import { drawTexture } from 'engine/textures';
import { M4, color } from 'engine/math';

const R = 12, FACE_R = 10.6, DEPTH = 2.6, FACE_Z = 0.9;   // outer radius, the face's radius inside the rim, the depth, the face's set-back plane

// a lathe: the profile [[r, z], …] turned about z (the clock's axis); u runs round, v along the profile
function lathe(prof, n = 72) {
  const pos = [], nor = [], uv = [], idx = [], m = prof.length;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    for (let j = 0; j < m; j++) {
      const [r, z] = prof[j], p = prof[Math.max(0, j - 1)], q = prof[Math.min(m - 1, j + 1)];
      // the profile's normal in (r, z): its tangent turned a quarter
      const tr = q[0] - p[0], tz = q[1] - p[1], l = Math.hypot(tr, tz) || 1, nr = tz / l, nz = -tr / l;
      pos.push(r * c, r * s, z); nor.push(nr * c, nr * s, nz); uv.push(i / n, j / (m - 1));
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < m - 1; j++) { const a = i * m + j, b = a + m; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const P = new Float32Array(pos), min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let k = 0; k < P.length; k += 3) for (let d = 0; d < 3; d++) { min[d] = Math.min(min[d], P[k + d]); max[d] = Math.max(max[d], P[k + d]); }
  return { positions: P, normals: new Float32Array(nor), uvs: new Float32Array(uv), indices: new Uint16Array(idx), bounds: { min, max } };
}
// a flat disc facing +z at height z, its uvs the face's canvas
function disc(r, z, n = 72) {
  const pos = [0, 0, z], nor = [0, 0, 1], uv = [0.5, 0.5], idx = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; pos.push(r * Math.cos(a), r * Math.sin(a), z); nor.push(0, 0, 1); uv.push(0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a)); }
  for (let i = 1; i <= n; i++) idx.push(0, i, i + 1);
  return { positions: new Float32Array(pos), normals: new Float32Array(nor), uvs: new Float32Array(uv), indices: new Uint16Array(idx), bounds: { min: [-r, -r, z], max: [r, r, z] } };
}
const at = (geo, p, r = [0, 0, 0]) => ({ geo, m: M4.compose(new Array(16), p, r, [1, 1, 1]), n: M4.compose(new Array(16), [0, 0, 0], r, [1, 1, 1]).filter((_, i) => i % 4 < 3 && i < 12) });

function faceTexture() {
  return drawTexture(512, 512, (ctx, w, h) => {
    const c = w / 2;
    const g = ctx.createRadialGradient(c, c * 0.9, 20, c, c, c); g.addColorStop(0, '#efe7d6'); g.addColorStop(0.85, '#e2d7c1'); g.addColorStop(1, '#c9bba0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.translate(c, c);
    for (let i = 0; i < 60; i++) {
      const hour = i % 5 === 0, a = (i / 60) * Math.PI * 2;
      ctx.save(); ctx.rotate(a); ctx.fillStyle = hour ? '#1b1714' : 'rgba(27,23,20,0.75)';
      if (hour) ctx.fillRect(-5, -c * 0.92, 10, c * 0.15); else ctx.fillRect(-1.6, -c * 0.92, 3.2, c * 0.06);
      ctx.restore();
    }
    // a thin ring inside the ticks, and the face's paper grain
    ctx.strokeStyle = 'rgba(27,23,20,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, c * 0.72, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 2500; i++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * c; ctx.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},0.05)`; ctx.fillRect(Math.cos(a) * r, Math.sin(a) * r, 1.5, 1.5); }
  });
}
function walnutTexture() {
  return drawTexture(256, 64, (ctx, w, h) => {
    ctx.fillStyle = '#3d2716'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { const y = Math.random() * h; ctx.strokeStyle = `rgba(${Math.random() < 0.5 ? '18,10,5' : '110,74,44'},${0.15 + Math.random() * 0.25})`; ctx.lineWidth = 0.6 + Math.random() * 1.6; ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(w * 0.33, y + (Math.random() - 0.5) * 6, w * 0.66, y + (Math.random() - 0.5) * 6, w, y + (Math.random() - 0.5) * 4); ctx.stroke(); }
  });
}

/** The clock. Returns { root, dimmable, update(dt, time) }: update sets the hands from the visitor's own clock. */
export function buildWallClock() {
  const root = new Node('wall-clock'), rim = color('#d9a86a');
  const walnutMap = walnutTexture();
  const walnut = new Material({ color: [1, 1, 1], map: walnutMap, mapRepeat: [3, 1], emissive: [0.55, 0.55, 0.55], emissiveMap: walnutMap, roughness: 0.45, fresnel: 0.25, fresnelColor: rim, receiveShadow: false });
  const faceMap = faceTexture();
  const face = new Material({ color: [1, 1, 1], map: faceMap, emissive: [0.62, 0.62, 0.62], emissiveMap: faceMap, roughness: 0.7, receiveShadow: false });
  const ink = color('#141110'), coral = color('#d9643a'), brassC = color('#9a7442');
  const black = new Material({ color: ink, emissive: ink.map((v) => v * 0.5), roughness: 0.4, fresnel: 0.15, fresnelColor: rim, receiveShadow: false });
  const red = new Material({ color: coral, emissive: coral.map((v) => v * 0.6), roughness: 0.4, receiveShadow: false });
  const brass = new Material({ color: brassC, emissive: brassC.map((v) => v * 0.7), roughness: 0.3, metalness: 0.8, fresnel: 0.35, fresnelColor: color('#f0cf98'), receiveShadow: false });
  // the glass: nearly nothing but a rim of reflected light
  const glass = new Material({ color: [0.9, 0.9, 0.9], opacity: 0.07, transparent: true, depthWrite: false, roughness: 0.05, fresnel: 0.5, fresnelColor: color('#f3dcb6'), receiveShadow: false });
  const mesh = (geo, mat, name) => { const m = new Mesh(geo, mat, name); m.castShadow = false; return m; };

  // the rim: a turned walnut profile from the wall round the front lip and back down into the face
  const prof = [[R - 1.2, 0], [R - 0.2, 0], [R, 0.25], [R, DEPTH - 0.5], [R - 0.3, DEPTH - 0.05], [R - 0.8, DEPTH], [FACE_R + 0.35, DEPTH - 0.1], [FACE_R + 0.05, DEPTH - 0.45], [FACE_R, FACE_Z]];
  root.add(mesh(lathe(prof), walnut, 'clock-rim'));
  root.add(mesh(merge([{ geo: disc(FACE_R + 0.02, FACE_Z) }]), face, 'clock-face'));
  root.add(mesh(disc(FACE_R + 0.1, DEPTH - 0.2), glass, 'clock-glass'));
  // the hands, each on its own pivot at the centre, stacked a little apart in z: hour, minute, seconds, the boss over them
  const hand = (mat, parts, z, name) => { const pivot = new Node(name); pivot.position = [0, 0, z]; root.add(pivot); pivot.add(mesh(merge(parts), mat, name)); return pivot; };
  const hourH = hand(black, [at(box(0.75, 6.6, 0.12), [0, 2.7, 0]), at(cylinder(0.75, 0.75, 0.12, 20), [0, 0, 0], [Math.PI / 2, 0, 0])], FACE_Z + 0.25, 'clock-hour');
  const minH = hand(black, [at(box(0.5, 10.0, 0.1), [0, 4.4, 0]), at(cylinder(0.6, 0.6, 0.1, 20), [0, 0, 0], [Math.PI / 2, 0, 0])], FACE_Z + 0.42, 'clock-minute');
  const secH = hand(red, [at(box(0.16, 11.9, 0.06), [0, 3.55, 0]), at(cylinder(0.55, 0.55, 0.07, 20), [0, -2.2, 0], [Math.PI / 2, 0, 0])], FACE_Z + 0.56, 'clock-second');
  const boss = mesh(cylinder(0.4, 0.45, 0.35, 20), brass, 'clock-boss'); boss.position = [0, 0, FACE_Z + 0.72]; boss.rotation = [Math.PI / 2, 0, 0]; root.add(boss);

  const TAU = Math.PI * 2;
  const update = () => {
    const d = new Date(), s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
    // clockwise as seen from the front (+z): a negative turn about z
    secH.rotation[2] = -TAU * (s / 60); minH.rotation[2] = -TAU * (m / 60); hourH.rotation[2] = -TAU * (h / 12);
  };
  update();
  return { root, dimmable: [walnut, face, black, red, brass], update };
}
