// Zero-dependency build: bundles the ES modules into one self-contained dist/index.html (works from file:// too).
// Each module becomes a scoped function registered in a tiny module table; imports resolve in dependency order.
// Geometry: every asset the code names as a string literal is packed to kwb2 (scripts/kwpack.js) and inlined as base64 in a
// non-executing <script type="application/octet-stream" id="kwa-NAME">: the HTML parser skips it, and loadAsset() decodes it
// only when asked, so worlds cost nothing until entered. JS and CSS get a light, verified comment/indent strip (scripts/jsmin.js).
// public/** is copied into dist/ as is (lazy images such as shots/<key>.webp stay out of the HTML).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { pack } from './kwpack.js';
import { minifyJS, minifyCSS } from './jsmin.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = process.env.KW_OUT ? path.resolve(process.env.KW_OUT) : path.join(root, 'dist'); // KW_OUT: build somewhere else (tests)
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const mapMatch = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
const map = JSON.parse(mapMatch[1]).imports;

// sources load as they are imported: an import-map entry nobody imports can't break the build, and a module imported before
// its import-map entry exists (another edit in flight) is bundled from src/<spec>.js with a warning: the dev server needs the entry
const sources = { __main: fs.readFileSync(path.join(root, 'src/main.js'), 'utf8') };
function load(spec, from) {
  if (sources[spec] !== undefined) return sources[spec];
  let rel = map[spec];
  if (!rel && fs.existsSync(path.join(root, 'src', spec + '.js'))) { rel = `./src/${spec}.js`; console.warn(`warning: '${spec}' (imported by ${from}) is missing from the import map in index.html; bundled from ${rel}, but the dev server can't load it until the entry is added`); }
  if (!rel) throw new Error(`unknown import '${spec}' (from ${from}): add it to the import map`);
  return (sources[spec] = fs.readFileSync(path.join(root, rel), 'utf8'));
}

const importRe = /^import\s+(?:(\*\s+as\s+\w+)|(\{[^}]*\}))\s+from\s+'([^']+)';?\s*$/gm;
function deps(src) { const d = []; for (const m of src.matchAll(importRe)) d.push(m[3]); return d; }

// topological order
const order = [], seen = new Set();
function visit(spec, stack = []) {
  if (seen.has(spec)) return;
  if (stack.includes(spec)) throw new Error('circular import: ' + [...stack, spec].join(' → '));
  for (const d of deps(load(spec, stack[stack.length - 1]))) visit(d, [...stack, spec]);
  seen.add(spec); order.push(spec);
}
visit('__main');

function transform(spec, src) {
  const exportsList = [];
  let out = src.replace(importRe, (m, star, named, from) => {
    if (star) return `const ${star.replace(/\*\s+as\s+/, '')} = __m['${from}'];`;
    const names = named.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.replace(/\s+as\s+/, ': '));
    return `const { ${names.join(', ')} } = __m['${from}'];`;
  });
  if (/^import\s/m.test(out)) throw new Error(`unhandled import form in ${spec}: only \`import { a, b as c } from '…'\` and \`import * as x from '…'\` are bundled`);
  out = out.replace(/^export\s+(const|let|var|function|class|async function)\s+([A-Za-z_$][\w$]*)/gm, (m, kind, name) => { exportsList.push(name); return `${kind} ${name}`; });
  out = out.replace(/^export\s+\{([^}]*)\};?\s*$/gm, (m, list) => { list.split(',').map((s) => s.trim()).filter(Boolean).forEach((n) => exportsList.push(n)); return ''; });
  if (/^export\s/m.test(out)) throw new Error(`unhandled export form in ${spec}`);
  const ret = spec === '__main' ? '' : `\n  return { ${[...new Set(exportsList)].join(', ')} };`;
  return `__m['${spec}'] = (() => {\n${out}${ret}\n})();`;
}

const header = `/* KeyboardWeb, bundled ${new Date().toISOString()} */\n`;
const full = `'use strict';\nconst __m = {};\n` + order.map((s) => transform(s, sources[s])).join('\n\n');
const parses = (code) => { try { new vm.Script(code); return true; } catch (e) { return e; } };
// light minify, kept only if it re-tokenizes to the same tokens, is idempotent and still parses; otherwise ship the readable bundle
let bundle = full, minNote = 'unminified', tokens = null;
try {
  const m = minifyJS(full); tokens = m.tokens;
  const again = minifyJS(m.code), ok = parses(m.code);
  if (again.code !== m.code || again.tokens.length !== m.tokens.length || again.tokens.some((t, i) => t !== m.tokens[i])) throw new Error('not stable on a second pass');
  if (ok !== true) throw ok;
  bundle = m.code; minNote = `js ${(full.length / 1024).toFixed(0)} → ${(bundle.length / 1024).toFixed(0)} kB`;
} catch (e) { console.warn(`minify skipped (${e.message}); shipping the readable bundle`); if (parses(full) !== true) console.warn('warning: the bundle does not parse:', parses(full).message); }
// a literal "</script" would end the inline script early; "<\/script" means the same inside JS strings, templates and regexes
bundle = header + bundle.replace(/<\/(script)/gi, '<\\/$1');

// assets: only names the code spells out as string literals ('world_02', "key_04", `desk_props`) can reach loadAsset()
const literals = new Set();
if (tokens) { for (const t of tokens) if (/^(['"])[\w.-]+\1$|^`[\w.-]+`$/.test(t)) literals.add(t.slice(1, -1)); }
else for (const m of full.matchAll(/(['"`])([\w.-]+)\1/g)) literals.add(m[2]);
const assetsDir = path.join(root, 'assets'), inlined = [], skipped = []; let assetTags = '', jsonBytes = 0;
if (fs.existsSync(assetsDir)) for (const f of fs.readdirSync(assetsDir).sort()) {
  if (!f.endsWith('.json')) continue;
  const name = f.slice(0, -5); if (!literals.has(name)) { skipped.push(name); continue; }
  const raw = fs.readFileSync(path.join(assetsDir, f)); let bytes;
  try { bytes = pack(JSON.parse(raw), { name }); jsonBytes += raw.length; }
  catch (e) { // mid-export JSON: keep the last good pack rather than failing the build
    const kwb = path.join(assetsDir, name + '.kwb');
    if (!fs.existsSync(kwb)) { console.warn(`warning: assets/${f} unreadable (${e.message}) and no assets/${name}.kwb to fall back on; left out`); continue; }
    console.warn(`warning: assets/${f} unreadable (${e.message}); inlined the last good assets/${name}.kwb instead`); bytes = fs.readFileSync(kwb);
  }
  assetTags += `<script type="application/octet-stream" id="kwa-${name}">${bytes.toString('base64')}</script>\n`;
  inlined.push(name);
}
let css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8'); try { css = minifyCSS(css); } catch {}

let out = html
  .replace(mapMatch[0], '')
  .replace(/<link rel="stylesheet" href="\.\/src\/styles\.css" \/>/, () => `<style>\n${css}\n</style>`)
  .replace(/<script type="module" src="\.\/src\/main\.js"><\/script>/, () => `${assetTags}<script>\n${bundle}\n</script>`);
fs.mkdirSync(dist, { recursive: true });
// public/** first, so nothing in it can overwrite the pages written below
const pub = path.join(root, 'public'); let copied = 0;
if (fs.existsSync(pub)) {
  try { fs.cpSync(pub, dist, { recursive: true, filter: (s) => { const r = path.relative(pub, s); if (r === 'index.html' || r === 'artifact.html') return false; if (fs.statSync(s).isFile()) copied++; return true; } }); }
  catch (e) { console.warn(`warning: copying public/ into dist/ failed part way (${e.message})`); }
}
fs.writeFileSync(path.join(dist, 'index.html'), out);
// artifact flavour: body-only fragment (the host wraps it in its own document skeleton); left out of Vercel builds,
// where dist/ is the public site and only index.html belongs in it
if (!process.env.VERCEL) {
  const frag = out.replace(/^[\s\S]*?<head>/, '').replace(/<\/head>\s*<body[^>]*>/, '').replace(/<\/body>\s*<\/html>\s*$/, '');
  fs.writeFileSync(path.join(dist, 'artifact.html'), frag);
}
const kb = (n) => (n / 1024).toFixed(1) + ' kB';
console.log(`built dist/index.html (${kb(out.length)}, gzip ${kb(zlib.gzipSync(out).length)}), ${order.length} modules, ${minNote}`);
console.log(`assets: ${inlined.length} inlined as kwb2 (${kb(jsonBytes)} of JSON → ${kb(assetTags.length)} base64)${skipped.length ? `, not referenced so left out: ${skipped.join(', ')}` : ''}`);
if (copied) console.log(`public: ${copied} file(s) copied into dist/`);
