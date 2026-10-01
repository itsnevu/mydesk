// Zero-dependency dev server: `npm run dev` → http://localhost:5173
// gzip/brotli (node:zlib) when the client accepts it, cached per file version; no-store so edits always show.
// Files missing from the project root are looked up in public/ (copied to dist/ by the build), so `shots/x.webp` works in both.
// assets/NAME.kwb is (re)packed from assets/NAME.json whenever the JSON is newer, so a fresh Blender export is never shadowed.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { packFile } from './kwpack.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 5173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.map': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.wasm': 'application/wasm', '.kwb': 'application/octet-stream', '.bin': 'application/octet-stream', '.glb': 'model/gltf-binary' };
const compressible = /^(text\/|application\/(json|javascript|wasm)|image\/svg)/;
const packed = new Map(); // file+encoding → { key: mtime|size|encoding, body }: one compressed version kept per file

function encode(file, st, data, enc) {
  const key = `${st.mtimeMs}|${st.size}|${enc}`, hit = packed.get(file + enc);
  if (hit?.key === key) return hit.body;
  const body = enc === 'br' ? zlib.brotliCompressSync(data, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: data.length > 1 << 20 ? 5 : 9, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: data.length } }) : zlib.gzipSync(data, { level: 6 });
  packed.set(file + enc, { key, body });
  return body;
}

http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
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
  const missing = () => { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end('not found'); };
  fs.stat(file, (err, st) => {
    if (!err && st.isFile()) return send(file, st);
    if (!pub.startsWith(path.join(root, 'public') + path.sep)) return missing();
    fs.stat(pub, (e2, s2) => (!e2 && s2.isFile() ? send(pub, s2) : missing()));
  });
}).listen(port, () => console.log(`KeyboardWeb → http://localhost:${port}`));
