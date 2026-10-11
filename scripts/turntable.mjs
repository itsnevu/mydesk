// The desk as a turntable for the portfolio's teaser (public/site/turn): the 3D engine renders N frames of the home view swung
// from -22° to +56° around its own target (1280x720 CSS pixels at a device scale of 1.5, so 1920x1080 frames, the renderer's
// resolution pinned), by headless Chrome driven over CDP (no Playwright on this PC). Software rendering at that size crashes
// Chrome after a handful of frames, so the frames are made in chunks, each in a fresh Chrome that enters the desk again; a
// frame that already exists is skipped, so a stopped run just continues.
// Run it after the desk changes, with the dev server up: node scripts/turntable.mjs http://localhost:5173 . [--fresh]
// Each frame is a webp at quality 68, about 100 KB; the page loads them lazily, from 700px wide up (a phone keeps the sharp still).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [BASE, ROOT] = [process.argv[2] || 'http://127.0.0.1:5173', process.argv[3] || '.'];
const FRESH = process.argv.includes('--fresh');
const OUT = path.join(ROOT, 'public', 'site', 'turn'); fs.mkdirSync(OUT, { recursive: true });
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9341;
// (-55° put the PC tower across the whole picture; the sweep starts a little left of the home view and ends where the open
// side of the tower, the dumbbells and the whole desk are in view)
const A0 = -22, A1 = 56, N = 24, CHUNK = 4, QUALITY = 68;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const file = (i) => path.join(OUT, `desk-${i}.webp`);
const frameJs = (i) => { const a = ((A0 + ((A1 - A0) * i) / (N - 1)) * Math.PI) / 180; return `(() => { const xp = window.__kw.xp, c = xp.camera, t = c.target, b = window.__turnBase; const dx = b.p[0] - b.t[0], dz = b.p[2] - b.t[2]; const a = ${a}; c.position[0] = b.t[0] + dx * Math.cos(a) + dz * Math.sin(a); c.position[1] = b.p[1]; c.position[2] = b.t[2] - dx * Math.sin(a) + dz * Math.cos(a); t[0] = b.t[0]; t[1] = b.t[1]; t[2] = b.t[2]; return [c.position.map((v) => +v.toFixed(2)), t.map((v) => +v.toFixed(2))]; })()`; };
const HIDE = "(() => { for (const id of ['hud', 'guide-btn', 'quick-btn', 'hud-wa', 'exit-3d', 'gate-tip', 'toast', 'hints', 'hints-bar', 'switching', 'discovered', 'view-project']) document.getElementById(id)?.style.setProperty('display', 'none', 'important'); document.querySelectorAll('.seo-text').forEach((e) => e.style.display = 'none'); return 'hidden'; })()";
// the home view as the engine settled it: the base the sweep turns around (controls off so nothing pulls the camera back; the
// renderer's adaptive resolution off, at its cap)
const BASE_JS = "(() => { const xp = window.__kw.xp; xp.controls.enabled = false; xp.flight = null; const r = xp.renderer; r.adaptive = false; r.pixelRatio = r.maxPixelRatio; r.setSize(r.width, r.height); window.__turnBase = { p: [...xp.camera.position], t: [...xp.camera.target] }; return JSON.stringify(window.__turnBase); })()";

// one Chrome: into the desk, then the frames asked for; closed whatever happens
async function session(todo) {
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--window-size=1280,720', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-first-run', '--mute-audio', '--hide-scrollbars', '--user-data-dir=' + process.env.TEMP + '\\kw-turn-profile', 'about:blank'], { stdio: 'ignore' });
  const kill = async () => { try { chrome.kill(); } catch {} ; await sleep(400); try { spawn('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {} ; await sleep(800); };
  let ws = null;
  try {
    let ver = null; for (let i = 0; i < 50 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(200); } }
    if (!ver) throw new Error('chrome did not answer');
    ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0; const waits = new Map();
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && waits.has(m.id)) { const { r, j } = waits.get(m.id); waits.delete(m.id); m.error ? j(new Error(m.error.message)) : r(m.result); } };
    ws.onclose = () => { for (const { j } of waits.values()) j(new Error('ws closed')); waits.clear(); };
    const send = (method, params = {}, sessionId) => new Promise((r, j) => { const n = ++id; waits.set(n, { r, j }); ws.send(JSON.stringify({ id: n, method, params, sessionId })); });
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const cdp = (m, p) => send(m, p, sessionId);
    await cdp('Page.enable'); await cdp('Runtime.enable');
    const evalJs = async (expr) => (await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
    await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1.5, mobile: false, screenWidth: 1280, screenHeight: 720 });
    await cdp('Page.navigate', { url: `${BASE}/3d/` }); await sleep(1500);
    let st = ''; for (let i = 0; i < 60 && st !== 'gate'; i++) { await sleep(1000); st = await evalJs('document.body.dataset.state'); }
    await evalJs("window.__kw.xp.enter({ music: false }); 'ok'");
    for (let i = 0; i < 40 && st !== 'desk'; i++) { await sleep(1000); st = await evalJs('document.body.dataset.state'); }
    if (st !== 'desk') throw new Error('never reached the desk: ' + st);
    await sleep(2500); await evalJs(HIDE);
    console.log('base', await evalJs(BASE_JS));
    for (const i of todo) {
      const at = await evalJs(frameJs(i)); await sleep(450);
      const { data } = await cdp('Page.captureScreenshot', { format: 'webp', quality: QUALITY });
      fs.writeFileSync(file(i), Buffer.from(data, 'base64'));
      console.log('frame', i, JSON.stringify(at[0]), Math.round(Buffer.byteLength(data, 'base64') / 1024), 'KB');
    }
  } finally { try { ws?.close(); } catch {} ; await kill(); }
}

if (FRESH) for (const f of fs.readdirSync(OUT)) if (/^desk-\d+\.webp$/.test(f)) fs.unlinkSync(path.join(OUT, f));
const missing = () => Array.from({ length: N }, (_, i) => i).filter((i) => !fs.existsSync(file(i)));
for (let round = 0; round < 12 && missing().length; round++) {
  const todo = missing().slice(0, CHUNK);
  console.log('chunk', todo.join(','));
  try { await session(todo); } catch (e) { console.log('session ended:', e.message); }
}
const left = missing();
console.log(left.length ? `missing frames: ${left.join(',')}` : `all ${N} frames in ${path.relative(process.cwd(), OUT) || OUT}`);
process.exit(left.length ? 1 : 0);
