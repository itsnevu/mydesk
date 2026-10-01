// The gallery scene: a dark studio with a round table and easels. Lives far from the desk; toggled by visibility.
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, plane, cylinder, torus, sphere } from 'engine/geometry';
import { noiseTexture, drawTexture, MONO, SANS } from 'engine/textures';
import { color } from 'engine/math';
import { PROJECTS } from 'app/data';
import { T, C, MAT } from 'app/theme';

export const GALLERY_ORIGIN = [400, 0, 0];

export function buildGallery() {
  const root = new Node('gallery');
  root.position = [...GALLERY_ORIGIN];
  root.visible = false;
  const g = { root, frames: [], lights: [] };

  const floor = new Mesh(plane(60, 60, 1), new Material({ color: color('#1a130c'), roughness: 0.92, map: noiseTexture(512, [30, 24, 18], 8), mapRepeat: [8, 8] }), 'g-floor');
  floor.castShadow = false; root.add(floor);
  // faint circular rug under table
  const rug = new Mesh(cylinder(6.5, 6.5, 0.03, 48), new Material({ color: color('#22190f'), roughness: 1 }), 'g-rug'); rug.position[1] = 0.015; rug.castShadow = false; root.add(rug);

  // table
  const wood = new Material({ color: color('#3a2716'), roughness: 0.55, metalness: 0.05, map: noiseTexture(256, [170, 140, 110], 22), mapRepeat: [2, 2] });
  const top = new Mesh(cylinder(3.2, 3.2, 0.32, 56), wood, 'g-table'); top.position[1] = 2.0; top.pickable = true; top.userData = { keyId: 'table', interactive: true }; root.add(top);
  const rim = new Mesh(torus(3.15, 0.09, 56, 8), new Material(MAT.bronze)); rim.position[1] = 2.17; root.add(rim);
  const stem = new Mesh(cylinder(0.32, 0.5, 1.9, 24), new Material(MAT.bronzeDark)); stem.position[1] = 0.95; root.add(stem);
  const foot = new Mesh(cylinder(1.6, 1.7, 0.12, 40), new Material(MAT.bronzeDark)); foot.position[1] = 0.06; root.add(foot);
  g.table = top;

  // easels with framed studies in an arc behind the table
  const easelMat = new Material({ color: color('#3a281a'), roughness: 0.8 });
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (0.2 + 0.6 * (i / (n - 1))); // arc from right to left behind
    const r = 11 + (i % 2) * 2.2;
    const x = Math.cos(a) * r, z = -Math.sin(a) * r;
    const e = new Node('easel'); e.position = [x, 0, z]; e.rotation[1] = Math.atan2(-x, -z); root.add(e);
    for (const dx of [-0.6, 0.6]) { const leg = new Mesh(box(0.12, 6.4, 0.12), easelMat); leg.position = [dx, 3.2, 0]; leg.rotation[0] = 0.12; e.add(leg); }
    const back = new Mesh(box(0.12, 6.0, 0.12), easelMat); back.position = [0, 3.0, -0.9]; back.rotation[0] = -0.28; e.add(back);
    const shelf = new Mesh(box(1.9, 0.12, 0.3), easelMat); shelf.position = [0, 2.4, 0.15]; shelf.rotation[0] = 0.12; e.add(shelf);
    const p = PROJECTS[(i * 2) % PROJECTS.length];
    const canvasTex = studyTexture(p);
    const frame = new Mesh(roundedBox({ w: 2.6, h: 3.2, d: 0.14, r: 0.02, seg: 1, uvTopOnly: false }), new Material({ color: color('#14100c'), roughness: 0.5, metalness: 0.2 })); frame.position = [0, 4.1, 0.22]; frame.rotation[0] = 0.12; e.add(frame);
    const art = new Mesh(box(2.3, 2.9, 0.02), new Material({ color: [1, 1, 1], map: canvasTex, unlit: true })); art.position = [0, 4.1, 0.3]; art.rotation[0] = 0.12; art.castShadow = false; e.add(art);
    g.frames.push(art);
  }

  // pendant lamp above the table
  const cord = new Mesh(cylinder(0.03, 0.03, 8, 8), new Material({ color: [0.02, 0.02, 0.02] })); cord.position[1] = 11; root.add(cord);
  const shade = new Mesh(cylinder(0.6, 1.9, 1.6, 32, false), new Material({ ...MAT.bronzeDark, doubleSide: true })); shade.position[1] = 7.4; root.add(shade);
  const bulb = new Mesh(sphere(0.35, 12, 8), new Material({ color: [1, 1, 1], emissive: [1, 0.92, 0.75], emissiveIntensity: 4, unlit: true })); bulb.position[1] = 6.9; bulb.castShadow = false; root.add(bulb);
  g.lights.push({ id: 'pendant', position: [GALLERY_ORIGIN[0], 6.6, 0], color: color(T.tungsten), intensity: 4.2, distance: 26 });
  g.lights.push({ id: 'fill', position: [GALLERY_ORIGIN[0] - 8, 5, 9], color: color('#c99a66'), intensity: 1.8, distance: 30 });
  g.lights.push({ id: 'easels', position: [GALLERY_ORIGIN[0], 5, -6], color: color('#ffd9b0'), intensity: 4, distance: 24 });

  // a few dust motes for depth
  const motes = [];
  for (let i = 0; i < 24; i++) {
    const m = new Mesh(sphere(0.05, 6, 4), new Material({ color: [1, 1, 1], emissive: [1, 0.9, 0.7], emissiveIntensity: 0.8, unlit: true, opacity: 0.5, transparent: true, depthWrite: false }));
    m.position = [(Math.random() - 0.5) * 14, 1 + Math.random() * 7, (Math.random() - 0.5) * 14]; m.castShadow = false; root.add(m); motes.push(m);
  }
  g.camera = { position: [GALLERY_ORIGIN[0] + 0.5, 6.2, 13.5], target: [GALLERY_ORIGIN[0], 2.6, 0] };
  g.update = (dt, t) => {
    for (let i = 0; i < motes.length; i++) { const m = motes[i]; m.position[1] += Math.sin(t * 0.6 + i) * 0.002; m.position[0] += Math.cos(t * 0.4 + i * 0.7) * 0.002; }
  };
  return g;
}

// Abstract "study" canvases for each project: generated from its hue, no imagery to copy.
export function studyTexture(p, w = 384, h = 480) {
  return drawTexture(w, h, (ctx) => {
    const hue = p.hue;
    ctx.fillStyle = `hsl(${hue} 35% 7%)`; ctx.fillRect(0, 0, w, h);
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, 10, w * 0.5, h * 0.45, w * 0.7);
    grad.addColorStop(0, `hsl(${hue} 62% 48% / 0.85)`); grad.addColorStop(1, `hsl(${hue} 40% 10% / 0)`);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = `hsl(${(hue + 10) % 360} 45% 78% / 0.65)`; ctx.lineWidth = 3;
    const seed = p.key.length * 13 + hue;
    const rnd = mulberry(seed);
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      const r = 30 + rnd() * 150; const cx = w * (0.3 + rnd() * 0.4), cy = h * (0.3 + rnd() * 0.4);
      if (i % 3 === 0) ctx.arc(cx, cy, r, 0, Math.PI * 2);
      else if (i % 3 === 1) ctx.rect(cx - r / 2, cy - r / 2, r, r * 0.7);
      else { ctx.moveTo(cx - r, cy + r / 2); ctx.lineTo(cx, cy - r); ctx.lineTo(cx + r, cy + r / 2); ctx.closePath(); }
      ctx.stroke();
    }
    // grain
    for (let i = 0; i < 1800; i++) { ctx.fillStyle = `rgba(255,255,255,${rnd() * 0.08})`; ctx.fillRect(rnd() * w, rnd() * h, 1.5, 1.5); }
    // long client names step the type down instead of running off the card
    const title = p.title.toUpperCase(); let size = 18;
    do { ctx.font = `500 ${size}px ${MONO}`; } while (ctx.measureText(title).width > w - 48 && --size > 10);
    ctx.fillStyle = 'rgba(240,235,225,0.85)'; ctx.fillText(title, 24, h - 44);
    ctx.fillStyle = 'rgba(240,235,225,0.45)'; ctx.font = `400 14px ${MONO}`; ctx.fillText(p.date, 24, h - 22);
  });
}

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
