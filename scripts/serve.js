// Zero-dependency dev server: `npm run dev` → http://localhost:5173
// gzip/brotli (node:zlib) when the client accepts it, cached per file version; no-store so edits always show.
// Files missing from the project root are looked up in public/ (copied to dist/ by the build), so `shots/x.webp` works in both.
// assets/NAME.kwb is (re)packed from assets/NAME.json whenever the JSON is newer, so a fresh Blender export is never shadowed.
// Two sites, as deployed: / and /work/<key>/ are the plain portfolio (scripts/site.js, rendered fresh on every request), and /3d/
// is the 3D desk, whose sources are the project root (index.html, src/, assets/).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { packFile } from './kwpack.js';
import { OTHER_PREFIXES, LANGS } from './i18n.js';   // (the language prefixes the portfolio is served under beside the default)
const LP = OTHER_PREFIXES;   // 'id|zh'
// the prefix a language used to have (English lived at /en/ for a day): its old links go to the new place
const OLD_PREFIXES = Object.values(LANGS).map((l) => l.code).filter((c) => !new RegExp(`^(${LP})$`).test(c) && LANGS[c].prefix === '');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 5173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.map': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.wasm': 'application/wasm', '.kwb': 'application/octet-stream', '.webmanifest': 'application/manifest+json; charset=utf-8', '.bin': 'application/octet-stream', '.glb': 'model/gltf-binary' };
const compressible = /^(text\/|application\/(json|javascript|wasm)|image\/svg)/;
let devLikes = 0;
const packed = new Map(); // file+encoding → { key: mtime|size|encoding, body }: one compressed version kept per file

function encode(file, st, data, enc) {
  const key = `${st.mtimeMs}|${st.size}|${enc}`, hit = packed.get(file + enc);
  if (hit?.key === key) return hit.body;
  const body = enc === 'br' ? zlib.brotliCompressSync(data, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: data.length > 1 << 20 ? 5 : 9, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: data.length } }) : zlib.gzipSync(data, { level: 6 });
  packed.set(file + enc, { key, body });
  return body;
}

// ---------- the portfolio's renderer lives in a worker thread (scripts/render-worker.mjs). Node never drops a module it has
// loaded, so re-importing site.js alone left its dictionaries, labs and data.js stale until a restart; a worker has its own
// registry, and a new one is started whenever any source of the pages changes (their newest mtime is the version).
const SOURCES = ['scripts', 'site', 'src/app'];
const sourceStamp = () => {
  let latest = 0;
  for (const dir of SOURCES) for (const f of fs.readdirSync(path.join(root, dir))) if (/\.(m?js|css)$/.test(f) && !/^(serve|build|smoke|kwpack|turntable|jsmin|render-worker)\.m?js$/.test(f)) latest = Math.max(latest, fs.statSync(path.join(root, dir, f)).mtimeMs);
  return latest;
};
let renderer = null, rendererStamp = 0, rendererSeq = 0; const pending = new Map();
function renderSite() {
  const stamp = sourceStamp();
  if (!renderer || stamp !== rendererStamp) {
    if (renderer) { renderer.terminate(); for (const [, { reject }] of pending) reject(new Error('the renderer was replaced')); pending.clear(); }
    renderer = new Worker(new URL('./render-worker.mjs', import.meta.url)); rendererStamp = stamp;
    renderer.on('message', (m) => { const w = pending.get(m.id); if (!w) return; pending.delete(m.id); m.error ? w.reject(new Error(m.error)) : w.resolve(m.pages); });
    renderer.on('error', (e) => { for (const [, { reject }] of pending) reject(e); pending.clear(); renderer = null; });
    console.log('site: fresh renderer (sources changed)');
  }
  return new Promise((resolve, reject) => { const id = ++rendererSeq; pending.set(id, { resolve, reject }); renderer.postMessage(id); });
}

http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
  // the like counter (server/likes.js on the VPS): kept in memory here, so the heart works locally and resets with the server
  if (p === '/api/likes') {
    const reply = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
    if (req.method === 'GET') return reply(200, { count: devLikes });
    if (req.method !== 'POST') return reply(405, { error: 'method' });
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      let op; try { op = JSON.parse(raw).op; } catch {}
      if (op !== 'like' && op !== 'unlike') return reply(400, { error: 'op' });
      devLikes = Math.max(0, devLikes + (op === 'like' ? 1 : -1));
      reply(200, { count: devLikes });
    });
    return;
  }
  // the desk lives under /3d/: strip the prefix and serve the project root
  if (p === '/3d') { res.writeHead(301, { Location: '/3d/' }); return res.end(); }
  const desk = p.startsWith('/3d/');
  if (desk) p = p.slice(3);
  // the plain portfolio, rendered from data.js on every request
  // (the portfolio speaks three languages: /en/ and /zh/ hold the same pages under a prefix, the default Indonesian ones at /)
  const old = !desk && OLD_PREFIXES.length && new RegExp(`^/(${OLD_PREFIXES.join('|')})(/|$)`).exec(p);
  if (old) { res.writeHead(301, { Location: p.slice(old[1].length + 1) || '/' }); return res.end(); }
  const sitePath = !desk && (new RegExp(`^/((${LP})/)?$`).test(p) ? p.slice(1) + 'index.html' : /^\/(index\.html|404\.html|sitemap\.xml|robots\.txt)$/.test(p) ? p.slice(1) : new RegExp(`^/((${LP})/)?(work/([\\w-]+/)?|labs/|cv/)(index\\.html)?$`).test(p) ? p.slice(1).replace(/\/$/, '/index.html') : null);
  // (rendered by the worker above: any edit to the templates, the dictionaries, labs or data.js shows without a restart)
  const renderPage = (rel, status = 200) => renderSite().then((pages) => {
    const body = pages[rel];
    if (body === undefined) return renderPage('404.html', 404);
    const type = rel.endsWith('.xml') ? 'application/xml; charset=utf-8' : rel.endsWith('.txt') ? types['.txt'] : types['.html'];
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(req.method === 'HEAD' ? undefined : body);
  }).catch((e) => { console.error('site:', e); res.writeHead(500, { 'Content-Type': 'text/plain' }); res.end(String(e.stack || e)); });
  if (sitePath) return renderPage(sitePath);
  if (!desk && new RegExp(`^/(((${LP})/)?(work(/[\\w-]+)?|labs|cv)|${LP})$`).test(p)) { res.writeHead(301, { Location: p + '/' }); return res.end(); }
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, p);
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  const ext = path.extname(file).toLowerCase();
  // a .kwb whose JSON can't be packed right now (mid-export) is a 404, so the loader falls back to the JSON instead of a stale pack
  if (ext === '.kwb' && path.dirname(file) === path.join(root, 'assets') && fs.existsSync(file.slice(0, -4) + '.json')) {
    let out = null; try { out = packFile(path.dirname(file), path.basename(file, '.kwb')); } catch (e) { console.warn('kwpack', p, e.message); }
    if (!out) { res.writeHead(404, { 'Cache-Control': 'no-store' }); return res.end(); }
    res.writeHead(200, { 'Content-Type': types['.kwb'], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Length': out.length });
    return res.end(req.method === 'HEAD' ? undefined : out); // the fresh pack itself, even if writing it to disk failed
  }
  const pub = path.join(root, 'public', p);
  const send = (file, st) => {
    fs.readFile(file, (err2, data) => {
      if (err2) { res.writeHead(500); return res.end(); }
      const type = types[ext] || 'application/octet-stream';
      const headers = { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
      const accept = String(req.headers['accept-encoding'] || '');
      const enc = data.length > 1024 && compressible.test(type) ? (/\bbr\b/.test(accept) ? 'br' : /\bgzip\b/.test(accept) ? 'gzip' : null) : null;
      if (compressible.test(type)) headers.Vary = 'Accept-Encoding';
      let body = data;
      if (enc) { body = encode(file, st, data, enc); headers['Content-Encoding'] = enc; }
      headers['Content-Length'] = body.length;
      res.writeHead(200, headers);
      res.end(req.method === 'HEAD' ? undefined : body);
    });
  };
  // (a page that isn't there, with or without its trailing slash, gets the site's 404 page, as it does on Vercel)
  const missing = () => { if (!desk && (ext === '' || ext === '.html')) return renderPage('404.html', 404); res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end('not found'); };
  fs.stat(file, (err, st) => {
    if (!err && st.isFile()) return send(file, st);
    if (!pub.startsWith(path.join(root, 'public') + path.sep)) return missing();
    fs.stat(pub, (e2, s2) => (!e2 && s2.isFile() ? send(pub, s2) : missing()));
  });
}).listen(port, () => console.log(`navygibran.dev → http://localhost:${port}/  ·  3D desk → http://localhost:${port}/3d/`));
