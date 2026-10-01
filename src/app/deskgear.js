// Two small things on the desk: a hardware crypto wallet (Nano X-style: glossy black body under a brushed steel swivel
// cover, two buttons, a tiny OLED) lying on the mat left of the keyboard, and a simple desktop condenser microphone on a
// round base with a yoke, at the free right side of the desk. Units: 1 unit ≈ 19.5 mm; the mat top is y = 0.12.
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, cylinder, sphere, torus } from 'engine/geometry';
import { drawTexture, MONO } from 'engine/textures';
import { color } from 'engine/math';
import { flatten } from 'app/bake';

export const ASHTRAY_POS = [43, 0, 19.5], PACK_POS = [35, 0, 19.5], LIGHTER_POS = [30.5, 0, 21];
export const WALLET_POS = [-8.0, 0.22, 6.2],   // resting on its lower cover plate (mat top 0.12 + plate 0.1), clear of the keyboard's front edge
  MIC_POS = [24.0, 0, 1.2], MACBOOK_POS = [36.0, 0, 7.0];

// the lid's apple, drawn upside down: on a closed MacBook it reads upright only from behind the hinge
function logoTexture() {
  return drawTexture(256, 304, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); ctx.translate(w / 2, h / 2); ctx.rotate(Math.PI); ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(w * 0.36, h * 0.6, w * 0.25, h * 0.27, 0.15, 0, Math.PI * 2); ctx.ellipse(w * 0.64, h * 0.6, w * 0.25, h * 0.27, -0.15, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(w * 0.93, h * 0.5, w * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.33, w * 0.12, h * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; ctx.beginPath(); ctx.ellipse(w * 0.56, h * 0.17, w * 0.07, h * 0.12, 0.7, 0, Math.PI * 2); ctx.fill();
  });
}

function oledTexture() {
  return drawTexture(256, 64, (ctx, w, h) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8f1ff'; ctx.font = `700 34px ${MONO}`; ctx.textBaseline = 'middle'; ctx.fillText('₿', 22, h / 2 + 2);
    ctx.font = `600 24px ${MONO}`; ctx.fillText('Bitcoin', 66, h / 2 + 1);
    ctx.fillRect(w - 34, h / 2 - 8, 14, 16); ctx.fillStyle = '#000'; ctx.fillRect(w - 31, h / 2 - 5, 8, 10);
  }, { srgb: true });
}
// one wisp: a thin line rising from the bottom centre, curling more and spreading as it climbs, then thinning away
function wispTexture(seed) {
  return drawTexture(128, 512, (ctx, w, h) => {
    let a = seed; const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
    ctx.clearRect(0, 0, w, h); ctx.lineCap = 'round';
    for (let pass = 0; pass < 3; pass++) {
      ctx.filter = `blur(${2 + pass * 4}px)`;
      ctx.beginPath(); let x = w / 2; ctx.moveTo(x, h - 2);
      const f1 = 0.02 + r() * 0.02, f2 = 0.05 + r() * 0.03, p1 = r() * 6, p2 = r() * 6;
      for (let y = h - 2; y > 0; y -= 4) { const t = 1 - y / h; x = w / 2 + Math.sin(y * f1 + p1) * 18 * t * t + Math.sin(y * f2 + p2) * 9 * t; ctx.lineTo(x, y); }
      const g = ctx.createLinearGradient(0, h, 0, 0); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.45, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 2 + pass * 5; ctx.globalAlpha = pass === 0 ? 0.9 : 0.35; ctx.stroke();
    }
    ctx.filter = 'none'; ctx.globalAlpha = 1;
  });
}
function packTexture() {
  return drawTexture(256, 256, (ctx, w, h) => { ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#b3242a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h * 0.35); ctx.lineTo(w / 2, h * 0.55); ctx.lineTo(0, h * 0.35); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2a2a2a'; ctx.font = `700 26px ${MONO}`; ctx.textAlign = 'center'; ctx.fillText('FILTER', w / 2, h * 0.72); ctx.font = `500 14px ${MONO}`; ctx.fillText('20 KRETEK', w / 2, h * 0.84); });
}
function grilleTexture() {
  return drawTexture(128, 128, (ctx, w, h) => { ctx.fillStyle = '#3a3a3c'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#111'; for (let y = 2; y < h; y += 6) for (let x = (y / 6) % 2 ? 3 : 0; x < w; x += 6) { ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2); ctx.fill(); } }, { repeat: true });
}

export function buildDeskGear() {
  const root = new Node('desk-gear');
  const M = {
    gloss: new Material({ color: color('#0d0d0f'), roughness: 0.12, metalness: 0.3, fresnel: 0.35, fresnelColor: color('#fff1d8') }),
    steel: new Material({ color: color('#c9ccd0'), roughness: 0.35, metalness: 0.75, emissive: color('#1b1b1d') }),
    oled: new Material({ color: [0, 0, 0], emissive: [1, 1, 1], emissiveMap: oledTexture(), emissiveIntensity: 0.9, unlit: true, receiveShadow: false }),
    matte: new Material({ color: color('#1a1a1c'), roughness: 0.55, metalness: 0.25, emissive: color('#0c0c0d') }),
    grille: new Material({ color: [1, 1, 1], map: grilleTexture(), mapRepeat: [4, 3], roughness: 0.4, metalness: 0.6 }),
    knob: new Material({ color: color('#2a2a2d'), roughness: 0.35, metalness: 0.6 }),
    led: new Material({ color: [0, 0, 0], emissive: color('#ffb547'), emissiveIntensity: 1.8, unlit: true, receiveShadow: false }),
    rubber: new Material({ color: color('#0b0b0b'), roughness: 0.95 }),
    glassAsh: new Material({ color: color('#8a9a96'), roughness: 0.05, metalness: 0.1, opacity: 0.55, transparent: true, depthWrite: false, fresnel: 0.6, fresnelColor: color('#e8fff8') }),
    ashGrey: new Material({ color: color('#6d6a66'), roughness: 1 }),
    notch: new Material({ color: color('#5c6a66'), roughness: 0.1, opacity: 0.6, transparent: true, depthWrite: false }),
    filter: new Material({ color: color('#d58a3c'), roughness: 0.8 }),
    paper: new Material({ color: color('#f2efe8'), roughness: 0.9 }),
    ember: new Material({ color: [0, 0, 0], emissive: color('#ff5a1a'), emissiveIntensity: 2.2, unlit: true, receiveShadow: false }),
    pack: new Material({ color: [1, 1, 1], map: packTexture(), roughness: 0.6, emissive: [0.08, 0.08, 0.08] }),
    zippo: new Material({ color: color('#8d9096'), roughness: 0.22, metalness: 0.95, fresnel: 0.4, fresnelColor: color('#ffffff'), emissive: color('#1c1c1e') }),
    midnight: new Material({ color: color('#2e3a52'), roughness: 0.3, metalness: 0.5, fresnel: 0.28, fresnelColor: color('#c9d6ff'), emissive: color('#0b0f18') }),
    seam: new Material({ color: color('#0f131b'), roughness: 0.6 }),
    hinge: new Material({ color: color('#1a2130'), roughness: 0.4, metalness: 0.4 }),
    logo: new Material({ color: color('#5a6a86'), map: logoTexture(), roughness: 0.08, metalness: 0.85, transparent: true, depthWrite: false, fresnel: 0.4, fresnelColor: color('#e6eeff') }),
  };
  const put = (parent, geo, mat, p, r, s) => { const m = new Mesh(geo, mat); m.position = p; if (r) m.rotation = r; if (s) m.scale = s; parent.add(m); return m; };
  // ---------- the wallet: 72 × 18.6 × 11.75 mm, lying flat, cover swung a little open
  const w = new Node('wallet'); w.position = [...WALLET_POS]; w.rotation[1] = 0.15; root.add(w);
  const L = 3.7, Wd = 0.95, T = 0.6;
  put(w, roundedBox({ w: L, h: T, d: Wd, r: 0.28, seg: 4, uvTopOnly: false }), M.gloss, [0, T / 2, 0]);
  put(w, box(1.55, 0.02, 0.42), M.oled, [-0.35, T + 0.005, 0.05]);
  for (const x of [0.85, 1.25]) put(w, cylinder(0.14, 0.14, 0.12, 16), M.matte, [x, T / 2, -Wd / 2 - 0.02], [Math.PI / 2, 0, 0]);
  // brushed steel cover on a pivot at one end, swung ~35° off the body so the screen shows
  const cov = new Node('wallet-cover'); cov.position = [L / 2 - 0.42, T / 2, 0]; cov.rotation[1] = 0.6; w.add(cov);
  put(cov, roundedBox({ w: L + 0.2, h: 0.08, d: Wd + 0.12, r: 0.04, seg: 2 }), M.steel, [-(L / 2 - 0.42), T / 2 + 0.06, 0]);
  put(cov, roundedBox({ w: L + 0.2, h: 0.08, d: Wd + 0.12, r: 0.04, seg: 2 }), M.steel, [-(L / 2 - 0.42), -T / 2 - 0.06, 0]);
  put(cov, roundedBox({ w: 0.3, h: T + 0.2, d: Wd + 0.12, r: 0.1, seg: 2 }), M.steel, [0.55, 0, 0]);
  put(cov, cylinder(0.22, 0.22, T + 0.24, 20), M.steel, [0, 0, 0]);
  // ---------- the microphone, a little turned toward the chair
  const mic = new Node('mic'); mic.position = [...MIC_POS]; mic.rotation[1] = -0.5; root.add(mic);
  put(mic, cylinder(2.3, 2.45, 0.55, 40), M.matte, [0, 0.28, 0]);
  put(mic, cylinder(2.35, 2.35, 0.08, 40), M.rubber, [0, 0.04, 0]);
  put(mic, cylinder(0.26, 0.3, 3.6, 16), M.steel, [0, 2.3, 0]);
  // yoke: a U that holds the body at its middle, two tension knobs
  put(mic, roundedBox({ w: 3.4, h: 0.3, d: 0.5, r: 0.1, seg: 2 }), M.matte, [0, 4.15, 0]);
  for (const s of [-1, 1]) { put(mic, roundedBox({ w: 0.3, h: 3.0, d: 0.5, r: 0.1, seg: 2 }), M.matte, [s * 1.55, 5.6, 0]); put(mic, cylinder(0.42, 0.42, 0.45, 20), M.knob, [s * 1.9, 6.6, 0], [0, 0, Math.PI / 2]); }
  // the body, tilted back a touch: lower housing, grille head with rings, gain knob and status LED on the front
  const body = new Node('mic-body'); body.position = [0, 6.6, 0]; body.rotation[0] = -0.12; mic.add(body);
  put(body, cylinder(1.25, 1.2, 5.2, 36), M.matte, [0, -0.9, 0]);
  put(body, cylinder(1.3, 1.3, 3.4, 36), M.grille, [0, 3.0, 0]);
  put(body, sphere(1.3, 36, 14), M.grille, [0, 4.7, 0], null, [1, 0.38, 1]);
  for (const y of [1.3, 4.7]) put(body, torus(1.3, 0.09, 40, 6), M.steel, [0, y, 0]);
  put(body, cylinder(0.32, 0.32, 0.3, 20), M.knob, [0, -0.6, 1.3], [Math.PI / 2, 0, 0]);
  put(body, sphere(0.09, 10, 8), M.led, [0, 0.35, 1.24]).castShadow = false;
  // ---------- a closed MacBook Air 13" in Midnight: 304 × 215 × 11.3 mm, lid seam, front notch, hinge, ports, feet, logo
  const mb = new Node('macbook'); mb.position = [...MACBOOK_POS]; mb.rotation[1] = -0.25; root.add(mb);
  const MW = 15.6, MD = 11.0, CR = 0.45, FEET = 0.06;
  const slab = (y0, h, mat) => {
    put(mb, box(MW, h, MD - 2 * CR), mat, [0, y0 + h / 2, 0]); put(mb, box(MW - 2 * CR, h, MD), mat, [0, y0 + h / 2, 0]);
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) put(mb, cylinder(CR, CR, h, 16), mat, [sx * (MW / 2 - CR), y0 + h / 2, sz * (MD / 2 - CR)]);
  };
  slab(FEET, 0.3, M.midnight);                 // the base
  slab(FEET + 0.3, 0.02, M.seam);              // the seam between base and lid
  slab(FEET + 0.32, 0.26, M.midnight);         // the lid
  put(mb, box(1.7, 0.16, 0.12), M.seam, [0, FEET + 0.28, MD / 2 - 0.02]);                 // the notch you open it by
  put(mb, box(MW - 2.4, 0.24, 0.14), M.hinge, [0, FEET + 0.3, -MD / 2 + 0.03]);           // hinge
  for (const z of [-2.6, -1.8]) put(mb, roundedBox({ w: 0.1, h: 0.1, d: 0.42, r: 0.04, seg: 1 }), M.seam, [-MW / 2 - 0.01, FEET + 0.16, z]);
  put(mb, roundedBox({ w: 0.1, h: 0.1, d: 0.7, r: 0.04, seg: 1 }), M.seam, [-MW / 2 - 0.01, FEET + 0.16, -3.6]);   // MagSafe
  put(mb, cylinder(0.08, 0.08, 0.1, 10), M.seam, [MW / 2 + 0.01, FEET + 0.16, -3.2], [0, 0, Math.PI / 2]);        // headphone jack
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) put(mb, cylinder(0.32, 0.32, FEET, 12), M.rubber, [sx * (MW / 2 - 1.3), FEET / 2, sz * (MD / 2 - 1.3)]);
  const logo = put(mb, box(1.5, 0.004, 1.8), M.logo, [0, FEET + 0.582, 0]); logo.castShadow = false; logo.renderOrder = 6;
  // ---------- by the MacBook: a heavy round glass ashtray with a lit cigarette resting in a notch, two stubs and ash; a plain
  // pack with two cigarettes showing, and a chrome lighter. The ember glows and flickers, a thin smoke rises (see update)
  const ash = new Node('ashtray'); ash.position = [...ASHTRAY_POS]; ash.rotation[1] = 0.4; root.add(ash);
  const AR = 2.55, AH = 1.8;
  put(ash, cylinder(AR, AR + 0.1, AH, 40), M.glassAsh, [0, AH / 2, 0]);
  put(ash, cylinder(AR - 0.55, AR - 0.75, 0.2, 32), M.ashGrey, [0, 0.62, 0]);
  // the lit one: filter outside the rim, paper over the bowl, a grey ash tip and the ember
  const cig = new Node('cig'); cig.position = [AR - 0.3, AH - 0.05, 0]; cig.rotation = [0, 0, 0.12]; ash.add(cig);
  put(cig, cylinder(0.2, 0.2, 1.3, 14), M.filter, [0.75, 0, 0], [0, 0, Math.PI / 2]);
  put(cig, cylinder(0.2, 0.2, 2.2, 14), M.paper, [-1.0, 0, 0], [0, 0, Math.PI / 2]);
  put(cig, cylinder(0.2, 0.19, 0.5, 14), M.ashGrey, [-2.35, 0, 0], [0, 0, Math.PI / 2]);
  const ember = put(cig, sphere(0.19, 12, 8), M.ember, [-2.62, 0, 0], null, [0.5, 1, 1]); ember.castShadow = false;
  for (const [x, z, r] of [[-0.6, 0.7, 0.8], [0.5, -0.8, -0.6]]) { put(ash, cylinder(0.2, 0.2, 1.0, 12), M.filter, [x, 0.92, z], [0, r, Math.PI / 2]); put(ash, cylinder(0.21, 0.21, 0.25, 12), M.ashGrey, [x - Math.cos(r) * 0.6, 0.92, z + Math.sin(r) * 0.6], [0, r, Math.PI / 2]); }
  // the pack (85 × 55 × 22 mm), lid open, two cigarettes showing
  const pk = new Node('pack'); pk.position = [...PACK_POS]; pk.rotation[1] = -0.5; root.add(pk);
  put(pk, box(2.8, 1.1, 4.35), M.pack, [0, 0.55, 0]);
  // a loose cigarette beside the closed pack
  put(root, cylinder(0.2, 0.2, 3.0, 14), M.paper, [PACK_POS[0] - 4.2, 0.2, PACK_POS[2] - 3.4], [0, 0, Math.PI / 2]);
  put(root, cylinder(0.205, 0.205, 1.3, 14), M.filter, [PACK_POS[0] - 6.35, 0.2, PACK_POS[2] - 3.4], [0, 0, Math.PI / 2]);
  // a chrome lighter, lid shut
  put(root, roundedBox({ w: 1.95, h: 2.9, d: 0.67, r: 0.15, seg: 2 }), M.zippo, [LIGHTER_POS[0], 0.34, LIGHTER_POS[2]], [Math.PI / 2, 0, 0.3]);
  // smoke: a few soft puffs that rise from the ember, drift and fade
  const emberWorld = () => { const c = Math.cos(0.4), s = Math.sin(0.4), lx = AR - 0.3 - 2.62 * Math.cos(0.12), ly = AH - 0.05 - 2.62 * Math.sin(0.12); return [ASHTRAY_POS[0] + lx * c, ASHTRAY_POS[1] + ly, ASHTRAY_POS[2] - lx * s]; };
  root.traverse((n) => { if (n.geometry && (n.material === M.oled || n.material === M.ember || n.material?.transparent)) n.castShadow = false; });
  flatten(root, 'desk-gear');
  // smoke: a thin curling ribbon off the ember, three crossed wisps (each its own drawing and material) that turn slowly,
  // sway and breathe, so it reads as a column of smoke from any side
  const eW = emberWorld();
  const wisps = [0, 1, 2].map((k) => {
    const mt = new Material({ color: [0.86, 0.86, 0.9], map: wispTexture(31 + k * 17), opacity: 0.5, transparent: true, depthWrite: false, unlit: true, receiveShadow: false, doubleSide: true });
    const m = new Mesh(box(2.4, 11, 0.01), mt, 'smoke'); m.castShadow = false; m.renderOrder = 12; m.position = [eW[0], eW[1] + 5.4, eW[2]]; m.rotation = [0, (k / 3) * Math.PI, 0]; root.add(m);
    return { m, mt, k };
  });
  const update = (dt, time) => {
    M.ember.emissiveIntensity = 1.6 + Math.sin(time * 7.3) * 0.35 + Math.sin(time * 13.1) * 0.25;
    for (const w of wisps) {
      w.m.rotation[1] = (w.k / 3) * Math.PI + time * (0.12 + w.k * 0.04);
      w.m.position[0] = eW[0] + Math.sin(time * 0.6 + w.k * 2) * 0.25;
      w.m.scale = [1 + Math.sin(time * 0.8 + w.k) * 0.15, 1 + Math.sin(time * 0.5 + w.k * 1.7) * 0.06, 1];
      w.mt.opacity = 0.32 + Math.sin(time * 0.9 + w.k * 2.1) * 0.12;
    }
  };
  return { root, update };
}
