// The city outside the window, built in depth: towers in four bands that slide past one another as the camera moves, a warm
// hazy night sky with a moon and a few stars, and life on top of it, windows that come and go, red lights breathing on the
// tallest roofs, planes crossing far off, now and then a flock of birds.
// The desk owns the renderer's four point lights, so nothing out here is lit: every surface is unlit and carries its own light,
// and nothing takes the scene fog, which would swallow a city this far away. The static city is merged by material, and every
// light that changes lives in one small texture that update() rewrites, so the whole city is a couple of dozen draw calls.
import { Node, Mesh, Material, Texture } from 'engine/scene';
import { cylinder } from 'engine/geometry';
import { drawTexture } from 'engine/textures';
import { color } from 'engine/math';

// ---------- the plan
// The sky is a cylinder around the middle of the room, not a flat backdrop: from anywhere in the room it stays inside the camera's
// 400-unit far plane. Angles go around its axis: 0 looks straight out of the back wall, positive turns left (towards -x).
const C = [0, 48], SKY_R = 262, A0 = -0.56, A1 = 1.2, TOP = 262, BOT = -300;
const around = (a, rho) => [C[0] - rho * Math.sin(a), C[1] - rho * Math.cos(a)];
const angleOf = (x, z) => Math.atan2(C[0] - x, C[1] - z);
// Towers stand in four bands by distance from that axis. The room is high up, so the near roofs are well below the eye and the
// city rises with distance; each band's colour has gone a little further towards the glow in the air (haze).
const BANDS = [{ to: 145, haze: 0, h: [-16, 6] }, { to: 178, haze: 0.14, h: [-10, 28] }, { to: 210, haze: 0.28, h: [-2, 58] }, { to: 250, haze: 0.44, h: [14, 92] }];
const HAZE = color('#3a2418');
// birds keep to a ring above the two near bands' roofs, planes to one between the last towers and the sky (stars 259, moon 257);
// the flock's ends lie behind the wall as seen from the room, and a bird shows only once it is past z = -45
const FLOCK = { r0: 150, r1: 158, a0: -0.3, a1: 1.0 }, AIR = { r0: 251, r1: 254, a0: -0.5, a1: 1.15 };
// one window cell is 1.8 across and a 2.2 storey tall, the same on every face of every tower: small enough that a tower reads as
// big and far away rather than as a model on the sill
const CW = 1.8, CH = 2.2;
// the facade atlas: four styles side by side, each 20 cells wide and 40 storeys tall (a face never spans two styles)
const ZONES = 4, ZC = 20, ROWS = 40, PX = 16, PY = 20, COLS = ZONES * ZC, TW = COLS * PX, TH = ROWS * PY;
const MOON = { a: 0.66, y: 98, r: 5.6 };

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const lerp = (a, b, t) => a + (b - a) * t;
const snap = (y) => Math.round(y / CH) * CH;
const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const srgb = (v) => Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(Math.min(1, v), 1 / 2.4) - 0.055));
const rgbOf = (s) => s.split(',').map(Number);

// ---------- geometry, written straight into one buffer per material
const acc = () => ({ p: [], n: [], uv: [], idx: [] });
// a frame: a footprint's centre and its turn about y (x' = x cos + z sin, z' = -x sin + z cos, as M4.compose turns)
const frame = (x, z, yaw = 0) => ({ x, z, c: Math.cos(yaw), s: Math.sin(yaw) });
const WORLD = frame(0, 0);
function vert(G, f, x, y, z, nx, ny, nz, u, v) { G.p.push(f.x + x * f.c + z * f.s, y, f.z - x * f.s + z * f.c); G.n.push(nx * f.c + nz * f.s, ny, -nx * f.s + nz * f.c); G.uv.push(u, v); }
// a quad a→b→c→d, counter-clockwise seen from outside; uv is a point (one flat colour) or a rect [u0, v0, u1, v1]
function quad4(G, f, a, b, c, d, nrm, uv) {
  const o = G.p.length / 3, r = uv.length === 4, u1 = r ? uv[2] : uv[0], v1 = r ? uv[3] : uv[1];
  vert(G, f, a[0], a[1], a[2], nrm[0], nrm[1], nrm[2], uv[0], uv[1]); vert(G, f, b[0], b[1], b[2], nrm[0], nrm[1], nrm[2], u1, uv[1]);
  vert(G, f, c[0], c[1], c[2], nrm[0], nrm[1], nrm[2], u1, v1); vert(G, f, d[0], d[1], d[2], nrm[0], nrm[1], nrm[2], uv[0], v1);
  G.idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
}
// A block of a tower in its own frame (front = +z), as the four faces anyone in the room can see: front and roof into F, the sides
// into S (the back and the base never face the room). Facade UVs count window cells, u from the face's first column in the
// atlas, v by height, so a window is the same size everywhere and storeys line up all the way up a tower. Without cols, the
// whole block takes the flat colour.
function block(F, S, f, x0, x1, y0, y1, z0, z1, cols, v0, flat) {
  const va = (v0 + y0 / CH) / ROWS, vb = (v0 + y1 / CH) / ROWS, u = (k, len) => (cols ? [cols[k] / COLS, va, (cols[k] + len / CW) / COLS, vb] : flat);
  quad4(F, f, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], u(0, x1 - x0));
  quad4(S, f, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], u(1, z1 - z0));
  quad4(S, f, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], u(2, z1 - z0));
  quad4(F, f, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], flat);
}
const solid = (F, S, f, x0, x1, y0, y1, z0, z1, uv) => block(F, S, f, x0, x1, y0, y1, z0, z1, null, 0, uv);
// closed on all six sides, for things that fly and are seen from below
function box6(G, f, x0, x1, y0, y1, z0, z1, uv) {
  solid(G, G, f, x0, x1, y0, y1, z0, z1, uv);
  quad4(G, f, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], uv);
  quad4(G, f, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], uv);
}
// an engine primitive (tanks, pyramid roofs) in a frame, turned about its own axis, in one flat colour
function addGeo(G, f, geo, ox, oy, oz, uv, turn = 0) {
  const o = G.p.length / 3, p = geo.positions, n = geo.normals, c = Math.cos(turn), s = Math.sin(turn);
  for (let i = 0; i < p.length; i += 3) vert(G, f, ox + p[i] * c + p[i + 2] * s, oy + p[i + 1], oz - p[i] * s + p[i + 2] * c, n[i] * c + n[i + 2] * s, n[i + 1], -n[i] * s + n[i + 2] * c, uv[0], uv[1]);
  for (let i = 0; i < geo.indices.length; i++) G.idx.push(o + geo.indices[i]);
}
// a flat disc in the plane of rt and up, in three rings of UVs (centre, 30 % out, rim): with one point everywhere it is a solid
// dot; with the centre and the rim on two neighbouring texels, the texture filter fades its alpha out to the edge, a glow
function disc(G, f, p, rt, up, rad, uc, um, ue, seg) {
  const o = G.p.length / 3;
  vert(G, f, p[0], p[1], p[2], 0, 0, 1, uc[0], uc[1]);
  for (let i = 0; i < seg; i++) {
    const t = (i / seg) * Math.PI * 2, x = Math.cos(t), y = Math.sin(t);
    for (const [k, uv] of [[0.3, um], [1, ue]]) vert(G, f, p[0] + (rt[0] * x + up[0] * y) * rad * k, p[1] + (rt[1] * x + up[1] * y) * rad * k, p[2] + (rt[2] * x + up[2] * y) * rad * k, 0, 0, 1, uv[0], uv[1]);
  }
  for (let i = 0; i < seg; i++) { const a = o + 1 + i * 2, b = o + 1 + ((i + 1) % seg) * 2; G.idx.push(o, a, b, a, a + 1, b + 1, a, b + 1, b); }
}
function geoOf(G) {
  const positions = new Float32Array(G.p), min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i++) { const k = i % 3; if (positions[i] < min[k]) min[k] = positions[i]; if (positions[i] > max[k]) max[k] = positions[i]; }
  return { positions, normals: new Float32Array(G.n), uvs: new Float32Array(G.uv), indices: positions.length / 3 > 65535 ? new Uint32Array(G.idx) : new Uint16Array(G.idx), bounds: { min, max } };
}
const meshOf = (G, mat, name) => { const m = new Mesh(geoOf(G), mat, name); m.castShadow = false; return m; };
const unlit = (o) => new Material({ unlit: true, fog: false, receiveShadow: false, ...o });

// ---------- the facade atlas
// lit windows are mostly amber, some warm white, a few dim behind curtains, never blue
const AMBER = ['255,176,102', '255,163,86', '255,190,122', '247,146,70'], WARM = ['255,214,162', '255,226,184'], DIM = ['156,98,52', '128,80,44'];
const litColor = (r) => { const k = r(); return k < 0.7 ? AMBER[(r() * 4) | 0] : k < 0.88 ? WARM[(r() * 2) | 0] : DIM[(r() * 2) | 0]; };
const shade = (rgb, r, s = 0.14) => { const k = 1 - s / 2 + r() * s; return `rgb(${rgb.map((c) => Math.round(c * k))})`; };
// where each style puts its windows in a cell (canvas px from the cell's top left): the windows that come and go sit on these
const WINDOWS = [[[4, 5, 8, 11]], [[1, 6, 15, 11]], [[1, 1, 15, 19]], [[3, 5, 4, 12], [9, 5, 4, 12]]];

function facadeTexture() {
  const r = rng(17);
  return drawTexture(TW, TH, (ctx) => {
    const fill = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    // a lit window is brighter under its ceiling, and sometimes half behind a curtain or a blind
    const lit = (x, y, w, h, rgb) => {
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, `rgb(${rgb})`); g.addColorStop(1, `rgba(${rgb},0.72)`);
      fill(x, y, w, h, '#000'); fill(x, y, w, h, g);
      const k = r();
      if (k < 0.18) fill(x + (r() < 0.5 ? 0 : w / 2), y, w / 2, h, 'rgba(40,22,10,0.55)');
      else if (k < 0.27) for (let i = 2; i < h; i += 3) fill(x, y + i, w, 1, 'rgba(30,16,8,0.45)');
    };
    // a dark window still holds a little of the sky's glow at its top
    const dark = (x, y, w, h) => { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#1d140f'); g.addColorStop(0.45, '#0d0a08'); g.addColorStop(1, '#090706'); fill(x, y, w, h, g); };
    for (let z = 0; z < ZONES; z++) for (let row = 0; row < ROWS; row++) {
      const busy = r() < [0, 0.24, 0.16, 0][z];   // offices and the glass tower light up a floor at a time
      let run = 0;
      for (let c = 0; c < ZC; c++) {
        const x = (z * ZC + c) * PX, y = TH - (row + 1) * PY;   // storey 0 at the bottom of the canvas (v = 0)
        const runOn = (start, len, stray) => (run > 0 ? (run--, true) : busy && r() < start ? ((run = len()), true) : r() < stray);
        if (z === 0) {
          // apartments: punched windows with a sill, a third of them lit
          fill(x, y, PX, PY, shade([22, 16, 12], r)); fill(x + 3, y + 4, 10, 13, '#0a0706'); fill(x + 3, y + 17, 10, 1, '#2a1e15');
          if (r() < 0.33) lit(x + 4, y + 5, 8, 11, litColor(r)); else dark(x + 4, y + 5, 8, 11);
        } else if (z === 1) {
          // offices: ribbon windows, lit a run at a time on the busy floors, mostly warm white
          fill(x, y, PX, PY, shade([17, 13, 10], r));
          if (runOn(0.4, () => 1 + ((r() * 6) | 0), 0.05)) lit(x + 1, y + 6, PX - 1, 11, r() < 0.5 ? WARM[(r() * 2) | 0] : AMBER[(r() * 4) | 0]); else dark(x + 1, y + 6, PX - 1, 11);
          fill(x, y + 6, 1, 11, '#16110d');
        } else if (z === 2) {
          // a glass tower: a dark curtain wall, a few floors lit pane by pane (row 1 stays dark and one pane on row 5 stays lit: SOLID samples them)
          dark(x, y, PX, PY);
          if (row === 5 && c === 3) fill(x + 1, y + 1, PX - 1, PY - 1, 'rgb(226,168,108)');
          else if (row !== 1 && runOn(0.45, () => 2 + ((r() * 7) | 0), 0.025)) fill(x + 1, y + 1, PX - 1, PY - 1, `rgba(${r() < 0.6 ? WARM[(r() * 2) | 0] : AMBER[(r() * 4) | 0]},${0.5 + r() * 0.35})`);
          fill(x, y, 1, PY, '#1c1511'); fill(x, y, PX, 1, '#211813');
        } else {
          // an old hotel: pairs of narrow windows, busier and warmer, a string course under every storey
          fill(x, y, PX, PY, shade([28, 20, 15], r));
          for (const ox of [3, 9]) { fill(x + ox - 1, y + 4, 6, 14, '#0d0907'); if (r() < 0.42) lit(x + ox, y + 5, 4, 12, litColor(r)); else dark(x + ox, y + 5, 4, 12); }
          fill(x, y + 18, PX, 1, '#2a1f17');
        }
      }
    }
  }, { repeat: true });
}
// flat colours, as points in the atlas: the top of an apartment and a hotel cell (walls), the dark glass, the one lit pane (a crown)
const atlasPoint = (zone, col, row, ox, oy) => [((zone * ZC + col) * PX + ox + 0.5) / TW, 1 - (TH - (row + 1) * PY + oy + 0.5) / TH];
const SOLID = { wall: atlasPoint(0, 1, 1, 8, 1), stone: atlasPoint(3, 1, 1, 8, 1), dark: atlasPoint(2, 1, 1, 8, 10), glow: atlasPoint(2, 3, 5, 8, 10) };

// ---------- the sky
// colours by height (sRGB): near-black overhead, warming through the city's glow to a haze at the horizon
const SKY_STOPS = [[262, '#07060a'], [210, '#09070b'], [170, '#0e0a0c'], [138, '#160f0e'], [110, '#20150f'], [84, '#2c1b13'], [58, '#382317'], [30, '#432919'], [0, '#4a2c1a'], [-60, '#46291a'], [-300, '#2a1910']];
const vOfY = (y) => (y - BOT) / (TOP - BOT), BLACK = [3 / 512, 1 - 3 / 512];
function skyTexture() {
  return drawTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    for (const [y, c] of SKY_STOPS) g.addColorStop(1 - vOfY(y), c);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 6, 6);   // true black, for the hood (BLACK), in a corner of the lid nobody sees
    // the moon's halo, round in the world although the canvas is stretched differently across and up
    const mx = ((A1 - MOON.a) / (A1 - A0)) * w, my = (1 - vOfY(MOON.y)) * h;
    ctx.save(); ctx.translate(mx, my); ctx.scale(w / (SKY_R * (A1 - A0)), h / (TOP - BOT));
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 72);
    halo.addColorStop(0, 'rgba(255,228,186,0.34)'); halo.addColorStop(0.16, 'rgba(255,214,166,0.15)'); halo.addColorStop(0.5, 'rgba(236,186,136,0.05)'); halo.addColorStop(1, 'rgba(236,186,136,0)');
    ctx.fillStyle = halo; ctx.fillRect(-72, -72, 144, 144); ctx.restore();
  });
}
function skyGeometry() {
  const G = acc(), N = 48, arc = [];
  for (let i = 0; i <= N; i++) {
    const a = A0 + (A1 - A0) * (i / N), [x, z] = around(a, SKY_R), u = 1 - i / N;   // seen from inside, the angle grows to the left
    arc.push([x, z]);
    vert(G, WORLD, x, BOT, z, Math.sin(a), 0, Math.cos(a), u, 0); vert(G, WORLD, x, TOP, z, Math.sin(a), 0, Math.cos(a), u, 1);
    if (i < N) G.idx.push(i * 2, i * 2 + 1, i * 2 + 3, i * 2, i * 2 + 3, i * 2 + 2);
  }
  // a lid in the night colour over everything behind z = -45, for a steep look up from right by the glass
  const rim = [...arc, [arc[N][0], -45], [arc[0][0], -45]], o = G.p.length / 3;
  vert(G, WORLD, -50, TOP, -110, 0, -1, 0, 0.5, 0.999);
  rim.forEach(([x, z], i) => { vert(G, WORLD, x, TOP, z, 0, -1, 0, 0.5, 0.999); G.idx.push(o, o + 1 + ((i + 1) % rim.length), o + 1 + i); });
  // The room has no ceiling, so from the far side of it the tallest towers would show over the tops of the back and left walls.
  // A hood of the void's own black rises from those wall tops, just outside them: well clear of every line through the window.
  quad4(G, WORLD, [-123, 99, -31], [123, 99, -31], [123, 320, -31], [-123, 320, -31], [0, 0, 1], BLACK);
  quad4(G, WORLD, [-121, 99, 133], [-121, 99, -31.5], [-121, 320, -31.5], [-121, 320, 133], [1, 0, 0], BLACK);
  return G;
}
function moonTexture() {
  const r = rng(9);
  return drawTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f6ead4'; ctx.fillRect(0, 0, w, h);
    // the seas, soft and grey-warm, and the disc a little darker towards its limb
    for (const [x, y, rr, a] of [[0.36, 0.34, 0.17, 0.2], [0.58, 0.4, 0.13, 0.17], [0.5, 0.6, 0.19, 0.14], [0.7, 0.64, 0.08, 0.18], [0.28, 0.58, 0.08, 0.13], [0.62, 0.22, 0.07, 0.1]]) {
      const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, rr * w); g.addColorStop(0, `rgba(150,128,104,${a})`); g.addColorStop(1, 'rgba(150,128,104,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '130,110,90' : '255,250,240'},${r() * 0.12})`; ctx.fillRect(r() * w, r() * h, 2, 2); }
    const limb = ctx.createRadialGradient(w / 2, h / 2, w * 0.28, w / 2, h / 2, w * 0.5); limb.addColorStop(0, 'rgba(120,96,72,0)'); limb.addColorStop(1, 'rgba(120,96,72,0.32)');
    ctx.fillStyle = limb; ctx.fillRect(0, 0, w, h);
  });
}

// ---------- the city
export function buildCity() {
  const root = new Node('city');
  const r = rng(31);

  // ---------- the moving lights: four texels per light in one texture that update() rewrites every frame, its colour at full
  // alpha (the core), at the halo's alpha (a halo's centre), at zero (the halo's rim), and a spare
  const LW = 64, LH = 16, img = new ImageData(LW, LH), lights = new Texture(img, { flipY: false, mipmaps: false });
  let slots = 0;
  const slot = () => slots++;
  const lightUV = (s, k) => [((s % 16) * 4 + k + 0.5) / LW, (((s / 16) | 0) + 0.5) / LH];
  const paint = (s, rgb, core, halo) => {
    const o = (((s / 16) | 0) * LW + (s % 16) * 4) * 4, d = img.data;
    for (let k = 0; k < 12; k += 4) { d[o + k] = rgb[0]; d[o + k + 1] = rgb[1]; d[o + k + 2] = rgb[2]; }
    d[o + 3] = core * 255; d[o + 7] = halo * 255; d[o + 11] = 0;
  };
  const lightMat = unlit({ map: lights, transparent: true, depthWrite: false, doubleSide: true });
  const L = acc();
  // a light: a halo that fades out, then a small solid core on top of it
  const glow = (G, f, p, rt, up, core, halo, s) => {
    if (halo) disc(G, f, p, rt, up, halo, lightUV(s, 1), lightUV(s, 1.62), lightUV(s, 2), 14);
    const c = lightUV(s, 0); disc(G, f, p, rt, up, core, c, c, c, 8);
  };
  const facing = (x, z) => { const a = angleOf(x, z); return [Math.cos(a), 0, -Math.sin(a)]; };   // across the view, as seen from the room
  const UP = [0, 1, 0];
  const RED = [255, 34, 18], GREEN = [70, 255, 120], WHITE = [255, 250, 240], BODY = [14, 11, 9];

  // ---------- the sky, the moon and the stars
  root.add(meshOf(skyGeometry(), unlit({ map: skyTexture() }), 'city-sky'));
  {
    const G = acc(), [mx, mz] = around(MOON.a, 257), rt = [Math.cos(MOON.a), 0, -Math.sin(MOON.a)];
    vert(G, WORLD, mx, MOON.y, mz, 0, 0, 1, 0.5, 0.5);
    for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI * 2, x = Math.cos(t), y = Math.sin(t); vert(G, WORLD, mx + rt[0] * x * MOON.r, MOON.y + y * MOON.r, mz + rt[2] * x * MOON.r, 0, 0, 1, 0.5 + x * 0.5, 0.5 + y * 0.5); if (i < 40) G.idx.push(0, i + 1, i + 2); }
    root.add(meshOf(G, unlit({ map: moonTexture(), color: [1.3, 1.24, 1.12] }), 'city-moon'));
  }
  // a few stars through the glow, fainter towards the horizon; three of them twinkle
  const starSlots = [slot(), slot(), slot()], twinkleStars = [slot(), slot(), slot()];
  paint(starSlots[0], [255, 244, 226], 1, 0); paint(starSlots[1], [255, 236, 214], 0.6, 0); paint(starSlots[2], [240, 226, 210], 0.34, 0);
  for (let i = 0; i < 84; i++) {
    const a = lerp(A0, A1, r()), y = lerp(112, 252, Math.pow(r(), 0.8)), [x, z] = around(a, 259);
    if (Math.hypot((a - MOON.a) * 259, y - MOON.y) < 26) continue;
    const s = i < 3 ? twinkleStars[i] : starSlots[y < 150 ? 2 : r() < 0.25 ? 0 : r() < 0.6 ? 1 : 2], size = i < 3 ? 0.85 : 0.45 + r() * 0.4;
    disc(L, WORLD, [x, y, z], facing(x, z), UP, size, lightUV(s, 0), lightUV(s, 0), lightUV(s, 0), 6);
  }

  // ---------- the towers: a street grid turned a little off the room's axes, its blocks cut into lots (finer near the window), each
  // lot a tower standing back from its edges by a random step; only lots wholly inside the sky and behind the wall are built
  const lots = [], GY = 0.22, BX = 33, BZ = 27, ST = 4.5, O = [-60, -140];
  const grid = (u, v) => [O[0] + u * Math.cos(GY) + v * Math.sin(GY), O[1] - u * Math.sin(GY) + v * Math.cos(GY)];
  const fits = (x, z, hw, hd, yaw) => [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].every(([px, pz]) => { const cx = x + px * Math.cos(yaw) + pz * Math.sin(yaw), cz = z - px * Math.sin(yaw) + pz * Math.cos(yaw); return cz <= -47 && cx <= 138 && cx >= -262 && Math.hypot(cx - C[0], cz - C[1]) <= 249; });
  // a handful of landmarks first, spread along the skyline, clear of the moon and of the elevated road (ROAD)
  for (const [a, h] of [[-0.32, 150], [0.04, 186], [0.4, 170], [0.93, 194]]) {
    const [x, z] = around(a, 224); if (fits(x, z, 10.8, 10.8, GY)) lots.push({ x, z, wc: 12, dc: 12, band: 3, yaw: GY, top: snap(h), kind: 'tower', zone: 2, landmark: true });
  }
  for (let i = -10; i <= 10; i++) for (let j = -7; j <= 7; j++) {
    const [bx, bz] = grid(i * (BX + ST), j * (BZ + ST)), fine = Math.hypot(bx - C[0], bz - C[1]) < 180;
    const k = r(), nx = fine ? (k < 0.5 ? 2 : 3) : k < 0.25 ? 1 : k < 0.75 ? 2 : 3, nz = r() < (fine ? 0.7 : 0.5) ? 2 : 1;
    for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) {
      if (r() < 0.04) continue;   // a car park, a little square
      const lw = BX / nx, ld = BZ / nz, [x, z] = grid(i * (BX + ST) + (a + 0.5) * lw - BX / 2, j * (BZ + ST) + (b + 0.5) * ld - BZ / 2), yaw = GY + (r() - 0.5) * 0.06;
      let wc = Math.min(19, Math.floor((lw - 0.6 - r() * 1.2) / CW)), dc = Math.min(19, Math.floor((ld - 0.6 - r() * 1.2) / CW));
      while (wc >= 5 && dc >= 5 && !fits(x, z, (wc * CW) / 2, (dc * CW) / 2, yaw)) { wc--; dc--; }   // a lot on the edge builds smaller
      const hw = (wc * CW) / 2, hd = (dc * CW) / 2, rho = Math.hypot(x - C[0], z - C[1]), band = BANDS.findIndex((B) => rho < B.to);
      if (wc < 5 || dc < 5 || band < 0 || lots.some((l) => l.landmark && Math.hypot(l.x - x, l.z - z) < 16 + Math.hypot(hw, hd))) continue;
      lots.push({ x, z, wc, dc, band, yaw, rho, reach: Math.hypot(hw, hd) });
    }
  }
  // heights, styles and shapes by band: the odd tall one among the low roofs, towers among the far ones, bunched by district;
  // anything under the birds' ring stays below their lowest flight
  const ZONE_OF = [[0, 0, 3, 1], [0, 1, 3, 2], [1, 2, 0, 3], [1, 2, 2, 0]];
  const district = (x, z) => Math.sin(x * 0.021 + 1.3) * Math.cos(z * 0.027 - 0.4);
  for (const l of lots) {
    if (l.landmark) continue;
    const B = BANDS[l.band], k = r();
    l.zone = ZONE_OF[l.band][(r() * 4) | 0];
    l.kind = l.band < 2 ? (k < 0.3 ? 'setback' : 'block') : l.band === 2 ? (k < 0.4 ? 'setback' : k < 0.62 ? 'tower' : 'block') : k < 0.4 ? 'setback' : k < 0.8 ? 'tower' : 'block';
    l.top = snap(lerp(B.h[0], B.h[1], r()) + (l.band === 0 && r() < 0.15 ? 10 : 0) + (l.kind === 'tower' ? (l.band === 3 ? 18 + r() * 28 : 12) : 0) + (l.band ? district(l.x, l.z) * 12 : 0));
    if (l.rho - l.reach < FLOCK.r1 + 6 && l.rho + l.reach > FLOCK.r0 - 6) l.top = Math.min(l.top, snap(28));
  }

  // one material per band and side: the band's haze is a share of the glow added (emissive) and the same share taken from the facade
  const facade = facadeTexture();
  const towerMats = BANDS.map((b) => [1.12, 0.64].map((k) => unlit({ map: facade, color: [k * (1 - b.haze), k * (1 - b.haze), k * (1 - b.haze)], emissive: HAZE.map((c) => c * b.haze) })));
  const T = BANDS.map(() => [acc(), acc()]);
  const beacons = [], faces = [];
  for (const l of lots) {
    const [F, S] = T[l.band], f = frame(l.x, l.z, l.yaw), v0 = (r() * ROWS) | 0;
    const col = (cells) => l.zone * ZC + ((r() * (ZC - cells + 1)) | 0);   // a face's first column, inside its style
    const span = l.top + 40;   // the part anyone sees: nothing below the room's floor line ever shows
    const tiers = l.kind === 'block' ? [l.top] : l.kind === 'setback' && r() < 0.45 ? [snap(l.top - span * 0.46), snap(l.top - span * 0.2), l.top] : [snap(l.top - span * (0.2 + r() * 0.22)), l.top];
    let wc = l.wc, dc = l.dc, y0 = BOT;
    const cols = [col(wc), col(dc), col(dc)];
    for (let t = 0; t < tiers.length; t++) {
      // each setback a cell or two in from the one below, its windows still in the same columns
      if (t > 0) { const kw = wc > 8 && r() < 0.6 ? 2 : 1, kd = dc > 8 && r() < 0.6 ? 2 : 1; if (wc - 2 * kw < 4 || dc - 2 * kd < 4) break; wc -= 2 * kw; dc -= 2 * kd; cols[0] += kw; cols[1] += kd; cols[2] += kd; }
      const hw = (wc * CW) / 2, hd = (dc * CW) / 2, y1 = Math.max(tiers[t], y0 + CH);
      block(F, S, f, -hw, hw, y0, y1, -hd, hd, cols, v0, SOLID.wall);
      faces.push({ l, f, hw, hd, y0: Math.max(y0, -20), y1, cols: cols.slice(), v0 });
      y0 = y1;
    }
    const hw = (wc * CW) / 2, hd = (dc * CW) / 2, top = y0, spot = (m) => [lerp(-hw + m, hw - m, r()), lerp(-hd + m, hd - m, r())];
    let peak = top, tips = [];
    if (top < 40 && !l.landmark) {
      // a roof you look down on: parapet, a plant room, water tanks on stands, a few ducts
      const t = 0.4, ph = 0.8;
      solid(F, S, f, -hw, hw, top, top + ph, hd - t, hd, SOLID.stone); solid(F, S, f, -hw, hw, top, top + ph, -hd, -hd + t, SOLID.stone);
      solid(F, S, f, -hw, -hw + t, top, top + ph, -hd, hd, SOLID.stone); solid(F, S, f, hw - t, hw, top, top + ph, -hd, hd, SOLID.stone);
      if (r() < 0.75) { const bw = 2.6 + r() * 2.4, bh = 2 + r() * 1.6, [bx, bz] = spot(bw / 2 + 1); solid(F, S, f, bx - bw / 2, bx + bw / 2, top, top + bh, bz - bw / 2, bz + bw / 2, SOLID.stone); }
      if (r() < 0.5 && hw > 5 && hd > 5) for (let k = 0, n = r() < 0.35 ? 2 : 1; k < n; k++) {
        const tr = 1.1 + r() * 0.5, th = 2.4 + r() * 1.1, [tx, tz] = spot(tr + 1.2);
        solid(F, S, f, tx - tr * 0.8, tx + tr * 0.8, top, top + 1.3, tz - tr * 0.8, tz + tr * 0.8, SOLID.wall);
        addGeo(F, f, cylinder(tr, tr, th, 10, false), tx, top + 1.3 + th / 2, tz, SOLID.stone);
        addGeo(F, f, cylinder(0.08, tr * 1.08, th * 0.32, 10, false), tx, top + 1.3 + th * 1.16, tz, SOLID.wall);
      }
      for (let k = 0, n = (r() * 3) | 0; k < n; k++) { const [dx, dz] = spot(2); solid(F, S, f, dx - 1, dx + 1, top, top + 0.8 + r() * 0.6, dz - 0.7, dz + 0.7, SOLID.wall); }
    } else {
      // a tower's crown: a pyramid, a floodlit lantern or a plain plant storey, and on the tallest an antenna or two
      const k = r();
      if (l.kind === 'tower' && k < 0.4) { const s = Math.min(hw, hd), h = s * (1.1 + r() * 0.6); addGeo(F, f, cylinder(0.02, s * Math.SQRT2, h, 4, false), 0, top + h / 2, 0, SOLID.dark, Math.PI / 4); peak = top + h; tips.push([0, peak]); }
      else if (l.kind === 'tower' && k < 0.75 && hw > CW * 2.5 && hd > CW * 2.5) { const lw = hw - CW, ld = hd - CW; solid(F, S, f, -lw, lw, top, top + 2 * CH, -ld, ld, SOLID.glow); solid(F, S, f, -lw + 0.6, lw - 0.6, top + 2 * CH, top + 2 * CH + 1.2, -ld + 0.6, ld - 0.6, SOLID.dark); peak = top + 2 * CH + 1.2; }
      else { solid(F, S, f, -hw + 0.8, hw - 0.8, top, top + 1.6, -hd + 0.8, hd - 0.8, SOLID.dark); peak = top + 1.6; }
      if (l.top > 96 || l.landmark) {
        const n = l.landmark || r() < 0.4 ? 2 : 1;
        for (let a = 0; a < n; a++) { const ah = (a ? 6 : 10) + r() * (a ? 6 : 14), ax = a ? (r() - 0.5) * hw : 0, az = a ? (r() - 0.5) * hd : 0; solid(F, S, f, ax - 0.2, ax + 0.2, peak, peak + ah, az - 0.2, az + 0.2, SOLID.dark); tips.push([ax, peak + ah, az]); }
      }
      // red obstruction lights: on the antennas or the spire, or on two roof corners, just proud of the front
      if (l.top > 70 || l.landmark) {
        if (!tips.length) tips = [[-hw + 0.5, top + 0.5, hd + 0.4], [hw - 0.5, top + 0.5, hd + 0.4]];
        for (const [tx, ty, tz = 0] of tips) beacons.push({ p: [f.x + tx * f.c + tz * f.s, ty + 0.35, f.z - tx * f.s + tz * f.c], s: slot(), f: 0.96 + r() * 0.08, ph: r() });
      }
    }
  }
  // ---------- an elevated road along one street of the grid (between two rows of blocks): a dark deck on piers with sodium lamps,
  // and two lanes of traffic. The cars live in a texture of their own, a row per lane; update() splats each car across two texels,
  // so it glides along the lane instead of stepping
  const ROAD = { v: 47.25, u0: -180, u1: 190, y: 3 }, G0 = frame(O[0], O[1], GY), at0 = (u, y, v) => [G0.x + u * G0.c + v * G0.s, y, G0.z - u * G0.s + v * G0.c];
  {
    const [F, S] = T[2];
    solid(F, S, G0, ROAD.u0, ROAD.u1, ROAD.y - 1.4, ROAD.y, ROAD.v - 1.85, ROAD.v + 1.85, SOLID.dark);
    solid(F, S, G0, ROAD.u0, ROAD.u1, ROAD.y, ROAD.y + 0.6, ROAD.v + 1.45, ROAD.v + 1.85, SOLID.dark);
    for (let u = ROAD.u0 + 9; u < ROAD.u1; u += 18) solid(F, S, G0, u - 0.7, u + 0.7, BOT, ROAD.y - 1.4, ROAD.v - 0.7, ROAD.v + 0.7, SOLID.dark);
    const lamp = slot(); paint(lamp, [255, 168, 80], 1, 0.45);
    for (let u = ROAD.u0 + 4; u < ROAD.u1; u += 10) { const p = at0(u, ROAD.y + 2.2, ROAD.v - 1.7); glow(L, WORLD, p, facing(p[0], p[2]), UP, 0.2, 1.4, lamp); }
  }
  const TL = 256, traffic = new ImageData(TL, 2), trafficTex = new Texture(traffic, { flipY: false, mipmaps: false });
  const lanes = [{ v: ROAD.v - 0.9, rgb: [255, 222, 176], dir: 1, cars: [] }, { v: ROAD.v + 0.7, rgb: [255, 44, 26], dir: -1, cars: [] }];
  {
    const G = acc();
    lanes.forEach((ln, row) => {
      for (let i = 0; i < TL; i++) traffic.data.set(ln.rgb, (row * TL + i) * 4);
      quad4(G, G0, [ROAD.u0, ROAD.y + 0.1, ln.v], [ROAD.u1, ROAD.y + 0.1, ln.v], [ROAD.u1, ROAD.y + 0.75, ln.v], [ROAD.u0, ROAD.y + 0.75, ln.v], [0, 0, 1], [0, (row + 0.5) / 2, 1, (row + 0.5) / 2]);
      for (let k = 0; k < 22; k++) ln.cars.push({ p: r() * (TL + 40), v: lerp(6, 11, r()), b: lerp(0.5, 1, r()) });
    });
    const m = meshOf(G, unlit({ map: trafficTex, transparent: true, depthWrite: false, doubleSide: true }), 'city-traffic'); m.renderOrder = -1; root.add(m);
  }

  towerMats.forEach((pair, b) => pair.forEach((mat, k) => root.add(meshOf(T[b][k], mat, `city-towers-${b}${k ? 's' : 'f'}`))));
  for (const b of beacons) glow(L, WORLD, b.p, facing(b.p[0], b.p[2]), UP, 0.5, 3.8, b.s);

  // ---------- windows that come and go: quads over chosen cells of the nearer facades, switched through their texel
  const twinkles = [], used = new Map();
  const tryWindow = () => {
    const fc = faces[(r() * faces.length) | 0], l = fc.l, a = angleOf(l.x, l.z);
    if (l.band > 2 || a < -0.1 || a > 1.0 || used.get(fc) > 1) return;   // only where the window looks, two at most to a face
    const side = r() < 0.7 ? 0 : 1, cells = Math.round((side ? fc.hd : fc.hw) * 2 / CW), j = (r() * cells) | 0;
    const n = Math.ceil(fc.y0 / CH) + ((r() * Math.floor((fc.y1 - fc.y0) / CH)) | 0), cy = n * CH; if (cy + CH > fc.y1 || cy > 84) return;
    const win = WINDOWS[l.zone][(r() * WINDOWS[l.zone].length) | 0];
    const ua = (win[0] / PX) * CW, ub = ((win[0] + win[2]) / PX) * CW, va = cy + ((PY - win[1] - win[3]) / PY) * CH, vb = cy + ((PY - win[1]) / PY) * CH;
    const s = slot(), uv = lightUV(s, 0), e = 0.14;
    if (side === 0) { const x0 = -fc.hw + j * CW; quad4(L, fc.f, [x0 + ua, va, fc.hd + e], [x0 + ub, va, fc.hd + e], [x0 + ub, vb, fc.hd + e], [x0 + ua, vb, fc.hd + e], [0, 0, 1], uv); }
    else { const z0 = fc.hd - j * CW; quad4(L, fc.f, [fc.hw + e, va, z0 - ua], [fc.hw + e, va, z0 - ub], [fc.hw + e, vb, z0 - ub], [fc.hw + e, vb, z0 - ua], [1, 0, 0], uv); }
    // its two looks, carried through the band's haze and the side's shade, as the facade under it would be
    const B = BANDS[l.band], k = side ? 0.64 : 1.12, tint = (rgb) => rgb.map((c, i) => srgb(lin(c) * k * (1 - B.haze) + HAZE[i] * B.haze));
    twinkles.push({ s, lit: tint(rgbOf(litColor(r))), dark: tint([14, 10, 8]), on: r() < 0.5, next: r() * 18, since: -9, tube: r() < 0.3 });
    used.set(fc, (used.get(fc) || 0) + 1);
  };
  for (let i = 0; i < 4000 && twinkles.length < 60; i++) tryWindow();
  // the city's see-through parts go down before the room's own glass (renderOrder < 0), and these before the planes, which cross the stars
  const lightMesh = meshOf(L, lightMat, 'city-lights'); lightMesh.renderOrder = -2; root.add(lightMesh);

  // ---------- planes: dark bodies, steady red and green wingtips, a white double strobe and a red beacon
  const planes = [0, 1, 2].map((i) => {
    const s = { body: slot(), port: slot(), star: slot(), strobe: slot(), beacon: slot() }, G = acc(), b = lightUV(s.body, 0), sd = [1, 0, 0];
    box6(G, WORLD, -2.9, 2.9, -0.32, 0.32, -0.32, 0.32, b); box6(G, WORLD, -0.6, 0.8, -0.07, 0.07, -3.3, 3.3, b);
    box6(G, WORLD, -2.9, -2.1, 0.3, 1.4, -0.06, 0.06, b); box6(G, WORLD, -2.9, -2.3, -0.04, 0.06, -1.2, 1.2, b);
    // forward is +x, so the left wing is -z; the lights face sideways, towards the room as the plane crosses it
    glow(G, WORLD, [0.1, 0, -3.36], sd, UP, 0.3, 2.2, s.port); glow(G, WORLD, [0.1, 0, 3.36], sd, UP, 0.3, 2.2, s.star);
    for (const p of [[-0.3, 0.05, -3.4], [-0.3, 0.05, 3.4], [-2.95, 1.25, 0]]) glow(G, WORLD, p, sd, UP, 0.26, 4.6, s.strobe);
    for (const p of [[0.4, 0.42, 0], [0.4, -0.42, 0]]) glow(G, WORLD, p, sd, UP, 0.24, 2.8, s.beacon);
    const mesh = meshOf(G, lightMat, 'city-plane'); mesh.visible = false; mesh.renderOrder = -1; root.add(mesh);
    return { mesh, s, active: false, next: [0.5, 7, 15][i], t0: 0, a0: 0, dir: 1, rho: 252, w: 0.06, y: 120, vy: 0, ph: r() * 2 };
  });
  let side = 1;

  // ---------- birds: one mesh each, body, head, tail, and a bent wing a side (the inner half raised, the outer half swept back and
  // a little down, a gull's M); update() flaps them by scaling the bird in y, which turns the M into a W and back
  const birdGeo = (() => {
    const G = acc(), o = [0, 0], wx = 0.1 + 0.7 * Math.cos(0.45), wy = 0.7 * Math.sin(0.45), tx = wx + 0.85 * Math.cos(0.25), ty = wy - 0.85 * Math.sin(0.25);
    box6(G, WORLD, -0.5, 0.5, -0.1, 0.1, -0.12, 0.12, o); box6(G, WORLD, 0.5, 0.86, -0.04, 0.07, -0.06, 0.06, o); box6(G, WORLD, -0.84, -0.5, -0.03, 0.03, -0.15, 0.15, o);
    for (const sd of [-1, 1]) {
      quad4(G, WORLD, [-0.22, 0, 0.1 * sd], [0.3, 0, 0.1 * sd], [0.22, wy, wx * sd], [-0.2, wy, wx * sd], [0, 1, 0], o);
      quad4(G, WORLD, [-0.2, wy, wx * sd], [0.22, wy, wx * sd], [-0.3, ty, tx * sd], [-0.52, ty, tx * sd], [0, 1, 0], o);
    }
    return geoOf(G);
  })();
  const birdMat = unlit({ color: color('#110b08'), doubleSide: true });
  const birds = Array.from({ length: 10 }, () => { const m = new Mesh(birdGeo, birdMat, 'city-bird'); m.castShadow = false; m.visible = false; root.add(m); return { m, back: 0, up: 0, out: 0, ph: 0, hz: 3.5 }; });
  const flock = { active: false, next: 5, t0: 0, dir: 1, n: 8, rho: 154, y: 70, v: 12 };

  // ---------- life
  const lr = rng(77);
  const update = (dt, time) => {
    // windows: someone comes home, someone goes to bed, a tube takes a moment to catch
    for (let i = 0; i < twinkles.length; i++) {
      const w = twinkles[i];
      if (time >= w.next) { w.on = !w.on; w.since = time; w.next = time + (w.on ? 4 + lr() * 18 : 3 + lr() * 14); }
      const catching = w.on && w.tube && time - w.since < 0.9 && Math.sin((time - w.since) * 47 + i * 1.7) < 0;
      paint(w.s, w.on && !catching ? w.lit : w.dark, 1, 0);
    }
    for (let i = 0; i < 3; i++) paint(twinkleStars[i], WHITE, 0.55 + 0.45 * Math.sin(time * (1.3 + i * 0.7) + i * 2.1) * Math.sin(time * 0.37 + i), 0);
    // the red lights on the tallest roofs: about once a second, each on its own beat, with an incandescent's soft edges
    for (let i = 0; i < beacons.length; i++) {
      const b = beacons[i], ph = (time * b.f + b.ph) % 1, k = ph < 0.5 ? Math.min(1, ph * 12) : Math.max(0, 1 - (ph - 0.5) * 8);
      paint(b.s, RED, k, k * 0.42);
    }
    // planes, along an arc just in front of the sky: each crosses the window at one distance and never meets a tower
    for (let i = 0; i < planes.length; i++) {
      const p = planes[i];
      if (!p.active) {
        if (time < p.next) continue;
        side = -side; p.dir = side; p.a0 = side > 0 ? AIR.a0 : AIR.a1; p.t0 = time;   // from the other side than the last one
        p.rho = lerp(AIR.r0, AIR.r1, lr()); p.w = lerp(12, 20, lr()) / p.rho; p.y = lerp(76, 150, lr()); p.vy = (lr() - 0.5) * 1.2; p.ph = lr() * 2;
        p.active = true; p.mesh.visible = true;
      }
      const a = p.a0 + p.dir * p.w * (time - p.t0), fade = Math.min(1, (a - AIR.a0) / 0.12, (AIR.a1 - a) / 0.12);
      if (fade < 0) { p.active = false; p.mesh.visible = false; p.next = time + 3 + lr() * 14; continue; }
      p.mesh.position[0] = C[0] - p.rho * Math.sin(a); p.mesh.position[2] = C[1] - p.rho * Math.cos(a); p.mesh.position[1] = p.y + p.vy * (time - p.t0);
      p.mesh.rotation[1] = a + (p.dir > 0 ? Math.PI : 0);
      const st = (time + p.ph) % 1.3, strobe = st < 0.05 || (st > 0.15 && st < 0.2) ? 1 : 0, beacon = (time * 0.9 + p.ph) % 1 < 0.14 ? 1 : 0;
      paint(p.s.body, BODY, fade, 0); paint(p.s.port, RED, fade, 0.32 * fade); paint(p.s.star, GREEN, fade, 0.32 * fade);
      paint(p.s.strobe, WHITE, strobe * fade, strobe * 0.6 * fade); paint(p.s.beacon, RED, beacon * fade, beacon * 0.45 * fade);
    }
    // a flock now and then: a loose V on its own arc, each bird bobbing and beating at its own pace, gliding now and again
    const F = flock;
    if (!F.active && time >= F.next) {
      F.active = true; F.t0 = time; F.dir = lr() < 0.5 ? 1 : -1; F.n = 6 + ((lr() * 5) | 0); F.rho = lerp(FLOCK.r0 + 2, FLOCK.r1 - 2, lr()); F.y = lerp(48, 84, lr()); F.v = lerp(10, 14, lr());
      for (let i = 0; i < birds.length; i++) {
        const b = birds[i], k = (i + 1) >> 1, s = i === 0 ? 0 : i % 2 ? 1 : -1;
        b.back = k * lerp(2.6, 3.4, lr()); b.up = s * k * lerp(1, 1.5, lr()) + (lr() - 0.5) * 0.7; b.out = s * k * 0.8 + (lr() - 0.5) * 1.2;
        b.ph = lr() * 6.28; b.hz = lerp(3, 4.2, lr());
      }
    }
    if (F.active) {
      const lead = (F.dir > 0 ? FLOCK.a0 : FLOCK.a1) + (F.dir * F.v * (time - F.t0)) / F.rho;
      let flying = false;
      for (let i = 0; i < F.n; i++) {
        const b = birds[i], m = b.m, a = lead - (F.dir * b.back) / F.rho, rho = F.rho + b.out, z = C[1] - rho * Math.cos(a);
        flying = flying || (F.dir > 0 ? a < FLOCK.a1 : a > FLOCK.a0);
        m.visible = a >= FLOCK.a0 && a <= FLOCK.a1 && z <= -45;
        if (!m.visible) continue;
        m.position[0] = C[0] - rho * Math.sin(a); m.position[2] = z;
        m.position[1] = F.y + b.up + Math.sin(time * 1.3 + b.ph) * 0.35 + Math.sin(time * 0.4 + F.t0) * 1.5;
        // banked a little away from the room: seen side-on a level bird is only a spike, tilted it shows its wings
        m.rotation[0] = F.dir * (0.5 + Math.sin(time * 0.7 + b.ph) * 0.08); m.rotation[1] = a + (F.dir > 0 ? Math.PI : 0) + Math.sin(time * 0.9 + b.ph) * 0.06;
        // the beat swings the raised wings through level to below; a glider holds them up in a shallow V
        const glide = Math.min(1, (Math.max(0, Math.sin(time * 0.33 + b.ph * 3) - 0.55) / 0.45) * 1.6);
        m.scale[1] = lerp(0.2 + 0.95 * Math.cos(time * b.hz * Math.PI * 2 + b.ph), 0.55, glide);
      }
      if (!flying) { F.active = false; F.next = time + 4 + lr() * 12; for (let i = 0; i < birds.length; i++) birds[i].m.visible = false; }
    }
    // traffic: each car loops its lane at its own pace, with a hidden run-in at both ends and a fade where the road meets them
    for (let row = 0; row < 2; row++) {
      const ln = lanes[row], d = traffic.data, base = row * TL * 4;
      for (let i = 0; i < TL; i++) d[base + i * 4 + 3] = 0;
      for (let k = 0; k < ln.cars.length; k++) {
        const c = ln.cars[k], q = ((c.p + c.v * time) % (TL + 40)) - 20, pos = ln.dir > 0 ? q : TL - 1 - q;
        if (pos < 0 || pos >= TL - 1) continue;
        const j = Math.floor(pos), fr = pos - j, a = Math.min(1, pos / 10, (TL - 1 - pos) / 10) * c.b * 255;
        d[base + j * 4 + 3] += (1 - fr) * a; d[base + j * 4 + 7] += fr * a;
      }
    }
    trafficTex.needsUpdate = true; lights.needsUpdate = true;
  };
  update(0, 0);   // the first frame already has its lights on
  return { root, update };
}
