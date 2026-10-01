// Boot check without a browser: `npm run smoke` (≈1 s). Run it before any headless capture: Chrome is heavy, and most broken loads
// are a missing export or a throw while the world is built, which this catches with the exact file and stack.
//  1. every `import { a, b as c } from 'x'` names something module x really exports. In the browser a missing export stops the
//     whole page from loading (ES modules link before they run); in the built bundle it would be a silent undefined instead.
//  2. the world is built the way Experience.init builds it (buildWorld), with a stub canvas and without the Blender assets, through
//     the same import/export rewrite as scripts/build.js, so it fails exactly where the bundle would.
// ("target … has no camera stage" warnings are expected here: those stages come from the Blender assets, which aren't loaded.)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const map = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
const files = { ...map, __main: './src/main.js' };
const src = {}; for (const [spec, rel] of Object.entries(files)) { try { src[spec] = fs.readFileSync(path.join(root, rel), 'utf8'); } catch (e) { console.log(`FAIL  ${spec}: cannot read ${rel}`); process.exit(1); } }

const importRe = /^import\s+(?:(\*\s+as\s+\w+)|(\{[^}]*\}))\s+from\s+'([^']+)';?\s*$/gm;
const exportsOf = (s) => {
  const names = new Set();
  for (const m of s.matchAll(/^export\s+(?:const|let|var|function|class|async function)\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
  for (const m of s.matchAll(/^export\s+\{([^}]*)\};?\s*$/gm)) m[1].split(',').map((x) => x.trim()).filter(Boolean).forEach((n) => names.add(n.split(/\s+as\s+/).pop()));
  return names;
};

// ---- 1. imports name real exports
const problems = [];
const exp = Object.fromEntries(Object.entries(src).map(([k, s]) => [k, exportsOf(s)]));
for (const [spec, s] of Object.entries(src)) {
  for (const m of s.matchAll(importRe)) {
    const from = m[3];
    if (!src[from]) { problems.push(`${spec} imports from '${from}', which is not in the importmap`); continue; }
    if (m[2]) for (const name of m[2].slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean).map((x) => x.split(/\s+as\s+/)[0])) {
      if (!exp[from].has(name)) problems.push(`${spec} imports { ${name} } from '${from}', which does not export it`);
    }
  }
  const leftover = s.replace(importRe, '').match(/^\s*import\s.*$/m); if (leftover) problems.push(`${spec} has an import form the build can't rewrite: ${leftover[0].trim()}`);
}
if (problems.length) { for (const p of problems) console.log('FAIL  ' + p); process.exit(1); }
console.log(`ok    imports: ${Object.keys(src).length} modules, every imported name is exported`);

// ---- 2. build the world in Node
const ctx2d = new Proxy({}, { get: (t, k) => {
  if (k in t) return t[k];
  if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern' || k === 'createConicGradient') return () => ({ addColorStop() {} });
  if (k === 'measureText') return (s) => ({ width: String(s).length * 8, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 });
  if (k === 'getImageData' || k === 'createImageData') return (x, y, w, h) => { const W = h === undefined ? x : w, H = h === undefined ? y : h; return { data: new Uint8ClampedArray(W * H * 4), width: W, height: H }; };
  return () => {};
}, set: (t, k, v) => { t[k] = v; return true; } });
const el = () => ({ width: 0, height: 0, style: { setProperty() {} }, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, getContext: () => ctx2d, appendChild() {}, append() {}, addEventListener() {}, setAttribute() {}, removeAttribute() {}, querySelector: () => null, querySelectorAll: () => [], children: [] });
Object.assign(globalThis, {
  document: { createElement: el, fonts: { ready: Promise.resolve() }, body: el(), documentElement: el(), head: el(), querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, getElementById: () => null },
  ImageData: class { constructor(a, b, c) { if (typeof a === 'number') { this.width = a; this.height = b; this.data = new Uint8ClampedArray(a * b * 4); } else { this.data = a; this.width = b; this.height = c; } } },
  OffscreenCanvas: class { constructor(w, h) { this.width = w; this.height = h; } getContext() { return ctx2d; } },
  Image: class { constructor() { this.width = 0; this.height = 0; } },
  devicePixelRatio: 1, innerWidth: 1440, innerHeight: 900,
  addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  requestAnimationFrame: () => 0, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  location: { search: '', hash: '', href: 'file:///', pathname: '/' },
});
globalThis.window = globalThis; if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const order = [], seen = new Set();
const visit = (spec) => { if (seen.has(spec)) return; seen.add(spec); for (const m of src[spec].matchAll(importRe)) visit(m[3]); order.push(spec); };
visit('app/world');
const transform = (spec, s) => {
  const names = [];
  let out = s.replace(importRe, (m, star, named, from) => star ? `const ${star.replace(/\*\s+as\s+/, '')} = __m['${from}'];` : `const { ${named.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean).map((x) => x.replace(/\s+as\s+/, ': ')).join(', ')} } = __m['${from}'];`);
  out = out.replace(/^export\s+(const|let|var|function|class|async function)\s+([A-Za-z_$][\w$]*)/gm, (m, kind, name) => { names.push(name); return `${kind} ${name}`; });
  out = out.replace(/^export\s+\{([^}]*)\};?\s*$/gm, (m, list) => { list.split(',').map((x) => x.trim()).filter(Boolean).forEach((n) => names.push(n)); return ''; });
  return `__m['${spec}'] = (() => {\n${out}\n  return { ${[...new Set(names)].join(', ')} };\n})();\n//# sourceURL=${files[spec]}`;
};
const warn = console.warn; let warned = 0; console.warn = (...a) => { if (!/has no camera stage/.test(String(a[0]))) { warned++; warn(...a); } };
try {
  const __m = new Function(`const __m = {};\n${order.map((s) => transform(s, src[s])).join('\n')}\nreturn __m;`)();
  const t0 = Date.now(), w = __m['app/world'].buildWorld({});
  let meshes = 0; w.root.traverse((n) => { if (n.geometry) meshes++; });
  console.log(`ok    world: built in ${Date.now() - t0} ms, ${meshes} meshes, ${Object.keys(w.targets).length} targets${warned ? `, ${warned} warning(s) above` : ''}`);
  console.log('BOOT OK');
} catch (e) {
  console.log('FAIL  building the world threw:\n  ' + (e && e.stack ? e.stack.split('\n').slice(0, 8).join('\n  ') : e));
  process.exit(1);
}
