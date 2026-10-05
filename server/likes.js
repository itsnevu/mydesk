// The like counter's server (runs on the VPS behind Caddy, see server/README.md): GET /likes → { count },
// POST /likes { op: 'like' | 'unlike' } → { count }. Zero dependencies; the number lives in one JSON file, written
// atomically (temp file + rename). Who already liked lives in the visitor's browser (app/likes); here each address
// gets one change every few seconds.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT || 8790);
const FILE = process.env.LIKES_FILE || '/var/lib/keyboardweb/likes.json';
fs.mkdirSync(path.dirname(FILE), { recursive: true });

let count = 0;
try { count = Math.max(0, Number(JSON.parse(fs.readFileSync(FILE, 'utf8')).count) || 0); } catch {}
const save = () => { const tmp = FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify({ count })); fs.renameSync(tmp, FILE); };

const recent = new Map(); // ip → time of its last change
setInterval(() => { const old = Date.now() - 3000; for (const [ip, t] of recent) if (t < old) recent.delete(ip); }, 60000).unref();

http.createServer((req, res) => {
  const reply = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end(body === undefined ? undefined : JSON.stringify(body));
  };
  if (new URL(req.url, 'http://x').pathname !== '/likes') return reply(404, { error: 'not found' });
  if (req.method === 'OPTIONS') return reply(204);
  if (req.method === 'GET') return reply(200, { count });
  if (req.method !== 'POST') return reply(405, { error: 'method' });
  let raw = '';
  req.on('data', (c) => { raw += c; if (raw.length > 256) req.destroy(); });
  req.on('end', () => {
    let op; try { op = JSON.parse(raw).op; } catch {}
    if (op !== 'like' && op !== 'unlike') return reply(400, { error: 'op' });
    // Caddy replaces X-Forwarded-For with the real client address (it trusts no proxy in front of it)
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',')[0].trim();
    const now = Date.now();
    if (now - (recent.get(ip) || 0) < 3000) return reply(429, { count });
    recent.set(ip, now);
    count = Math.max(0, count + (op === 'like' ? 1 : -1));
    try { save(); } catch (e) { console.error('save', e.message); }
    reply(200, { count });
  });
}).listen(PORT, '127.0.0.1', () => console.log(`likes → 127.0.0.1:${PORT}, ${count} so far`));
