// KeyboardWeb theme, the single source of colour for 3D materials, lights and UI.
// Direction: a warm dark room. Dark walnut, aged bronze, tungsten light, black keys, cream type, amber highlights.
import { color } from 'engine/math';

export const T = {
  bg: '#120f0a',        // void / page background
  deep: '#1a140d',      // deep brown (desk shadow side)
  surface: '#211a11',   // surfaces, cards
  walnut: '#1f150c',    // desk wood
  walnutLight: '#3a2a1a',
  mat: '#171009',       // desk mat
  keyBlack: '#15120f',  // keycaps
  keyCase: '#0f0c09',   // keyboard case
  bronze: '#8e6a3d',
  bronzeDark: '#4d3822',
  gold: '#b08a52',
  highlight: '#c7a36a',
  cream: '#d6c7ab',
  creamDim: '#8d8374',
  amber: '#d9a05b',     // the single accent
  ember: '#b8622c',
  tungsten: '#ffd6a3',  // lamp light colour
  screen: '#0c0a08',
};

// Backlight options: all warm, no RGB.
export const BACKLIGHTS = [
  { name: 'amber', hex: '#d9a05b' },
  { name: 'warm white', hex: '#f1e2c8' },
  { name: 'ember', hex: '#c7743a' },
  { name: 'off', hex: '#000000' },
];

// Linear-space colour helpers for materials/lights.
export const C = Object.fromEntries(Object.entries(T).map(([k, v]) => [k, color(v)]));

// Materials: physically-plausible presets that keep the scene tactile but coherent.
export const MAT = {
  walnut: { color: C.walnut, roughness: 0.62, metalness: 0.05 },
  matte: { color: C.mat, roughness: 0.98, metalness: 0 },
  plastic: { color: C.keyBlack, roughness: 0.58, metalness: 0.02 },
  casePlastic: { color: C.keyCase, roughness: 0.42, metalness: 0.2 },
  bronze: { color: C.bronze, roughness: 0.34, metalness: 0.85 },
  bronzeDark: { color: C.bronzeDark, roughness: 0.45, metalness: 0.75 },
  cream: { color: C.cream, roughness: 0.72, metalness: 0 },
  paper: { color: color('#efe4cf'), roughness: 0.95, metalness: 0 },
  ceramic: { color: color('#e9dfcd'), roughness: 0.3, metalness: 0.02 },
  glass: { color: [0.92, 0.9, 0.86], roughness: 0.08, metalness: 0.0 },
  screen: { color: C.screen, roughness: 0.15, metalness: 0.4 },
};

// Lighting rig for the desk. `level` (0..1) scales everything so the intro can bring the room up from dark.
export const DESK_LIGHTS = {
  hemi: { sky: color('#4e3c2b'), ground: color('#1a120b') }, // bright enough that nothing in the room falls to black
  dir: { direction: [0.35, -1, 0.55], color: color('#ffe2c0').map((c) => c * 0.55) },
  points: [
    { id: 'lamp', position: [-9.6, 5.4, -3.4], color: color(T.tungsten), intensity: 20, distance: 24 },
    { id: 'screen', position: [0, 5.4, -7.2], color: color('#ffb66a'), intensity: 4, distance: 16 },
    { id: 'fill', position: [14, 9, 12], color: color('#b9a58c'), intensity: 2.2, distance: 36 },
  ],
  exposure: 1.02,
  fog: { color: color(T.bg), near: 90, far: 340 }, // the room's walls close the scene now: fog is only atmosphere, not a curtain over a void
};

export const GALLERY_LIGHTS = {
  hemi: { sky: color('#5a4632'), ground: color('#140e08') },
  dir: { direction: [-0.35, -1, -0.25], color: color('#e8c9a0').map((c) => c * 0.85) },
  exposure: 1.1,
  fog: { color: color(T.bg), near: 46, far: 110 },
};

// Push the same tokens to CSS so UI and scene never drift apart.
export function applyThemeToCSS() {
  const r = document.documentElement.style;
  r.setProperty('--bg', T.bg); r.setProperty('--surface', T.surface); r.setProperty('--deep', T.deep);
  r.setProperty('--paper', '#e7ddc8'); r.setProperty('--accent', T.amber); r.setProperty('--gold', T.gold); r.setProperty('--bronze', T.bronze);
  r.setProperty('--muted', T.creamDim);
}
