// "What can I click?": the guide button puts a small label on every clickable thing in view, pinned to it while the camera
// moves; labels that would overlap step aside (or wait their turn), a click on one goes there, and a bar at the foot of the
// screen says what the labels mean, opens the full guide or puts them away.
import { TARGETS } from 'app/data';
import { TIP_LIFT, SHORTCUTS } from 'app/experience';
import { declutter } from 'app/ui';

const CSS = `
#hints { position: absolute; inset: 0; z-index: 31; pointer-events: none; opacity: 0; transition: opacity .35s; }
#hints.on { opacity: 1; }
#hints .hn { position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: 7px; padding: 5px 11px 5px 5px; border: 1px solid rgba(217,160,91,0.55); border-radius: 999px; background: rgba(20,16,11,0.88); backdrop-filter: blur(6px); color: var(--paper, #e7ddc8); font: 600 13px var(--sans, system-ui); white-space: nowrap; transform: translate(-50%, calc(-100% - 9px)); pointer-events: auto; cursor: pointer; opacity: 0; animation: hn-in .4s cubic-bezier(.22,1,.36,1) forwards; animation-delay: calc(var(--i) * 30ms); }
#hints .hn::after { content: ""; position: absolute; left: 50%; top: 100%; width: 1px; height: 9px; background: rgba(217,160,91,0.7); }
#hints .hn b { display: grid; place-items: center; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 999px; background: var(--accent, #d9a05b); color: #1a140d; font: 700 11px var(--mono, monospace); }
#hints .hn:hover, #hints .hn:focus-visible { border-color: var(--accent, #d9a05b); background: rgba(40,28,16,0.96); outline: none; }
#hints .hn.off { visibility: hidden; }
body.hints-on #toast { opacity: 0 !important; }   /* a message would sit on the bar */
@keyframes hn-in { from { opacity: 0; } to { opacity: 1; } }
#hints-bar { position: absolute; left: 50%; bottom: calc(96px + var(--safe-b, 0px)); z-index: 41; display: flex; align-items: center; gap: 14px; padding: 8px 8px 8px 16px; border: 1px solid rgba(217,160,91,0.45); border-radius: 999px; background: rgba(20,16,11,0.92); backdrop-filter: blur(8px); color: var(--paper, #e7ddc8); font: 500 14px var(--sans, system-ui); transform: translate(-50%, 10px); opacity: 0; pointer-events: none; transition: opacity .3s, transform .3s; white-space: nowrap; }
#hints-bar.on { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
#hints-bar button { padding: 8px 14px; border: 1px solid rgba(217,160,91,0.5); border-radius: 999px; background: none; color: inherit; font: 600 13px var(--sans, system-ui); cursor: pointer; }
#hints-bar button.fill { background: var(--accent, #d9a05b); border-color: var(--accent, #d9a05b); color: #1a140d; }
@media (min-width: 1025px) { #hints .hn { transform: translate(-50%, calc(-100% - 9px)) scale(var(--ui, 1)); transform-origin: 50% 100%; } #hints-bar { zoom: var(--ui, 1); } }
@media (max-width: 760px), (pointer: coarse) and (max-width: 1024px) {
  #hints .hn { font-size: 12px; padding: 4px 9px 4px 4px; }
  #hints-bar { left: 16px; right: 16px; bottom: calc(136px + var(--safe-b, 0px)); transform: translateY(10px); justify-content: space-between; white-space: normal; font-size: 13px; }
  #hints-bar.on { transform: none; }
  #hints-bar .say { flex: 1; }
}
@media (prefers-reduced-motion: reduce) { #hints .hn { animation-duration: .01s; animation-delay: 0s; } }
`;

// the order labels claim space in when two would overlap: the ways into the work first
const ORDER = ['monitor', 'keyboard', 'art4', 'note', 'lamp', 'clock', 'mouse', 'pc', 'speaker', 'mug', 'chair', 'watches', 'satoshi', 'bike', 'katana', 'pullup', 'medals', 'notebook', 'mandarin', 'model', 'plant', 'cat'];
// skipped: keys that only do something small (the backlight, the overview orbit), the cat's bed and bowl (her own label is enough),
// and room fixtures that just switch on and off; a world's key is labelled only when it is an object too (the mouse: Contact)
const SKIP = new Set(['alias', 'secret', 'micro', 'guide', 'quickwork', 'curtains', 'lights', 'door', 'aircon', 'floorlamp', 'overview', 'backlight', 'catbed', 'catbowl']);
// labels that sit in the middle of their object instead of over its top (the screen and the tower are tall: their tops sit
// at the top of the window, under the HUD)
const MIDDLE = new Set(['monitor', 'pc']);

const HUD = ['identity', 'discovery', 'nav-hints', 'menu-toggle', 'guide-btn', 'quick-btn', 'sound-toggle', 'like-btn', 'kbd-hints', 'hints-bar', 'scene-label'];

let root = null, bar = null, xp = null, items = [], raf = 0, onFull = null;

function build() {
  if (root) return;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  root = document.createElement('div'); root.id = 'hints'; root.setAttribute('aria-label', 'What you can click');
  bar = document.createElement('div'); bar.id = 'hints-bar'; bar.setAttribute('role', 'status');
  const touch = matchMedia('(pointer: coarse)').matches;
  bar.innerHTML = `<span class="say">Everything labelled can be ${touch ? 'tapped' : 'clicked'}</span><button type="button" data-full>Full guide</button><button type="button" class="fill" data-hide>Got it</button>`;
  document.body.append(root, bar);
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-id]'); if (!b) return; const id = b.dataset.id; hideHints(); xp?.activate(id); });
  bar.querySelector('[data-hide]').addEventListener('click', () => hideHints());
  bar.querySelector('[data-full]').addEventListener('click', () => { hideHints(); onFull?.(); });
  // they go away when the visitor moves on: Esc, a click into the scene, or leaving the desk
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && hintsOn()) { e.stopImmediatePropagation(); hideHints(); } }, true);
  document.getElementById('canvas')?.addEventListener('pointerdown', () => { if (hintsOn()) hideHints(); });
}

// over the top of what the object actually is (its geometry's box, wherever the mesh's own origin happens to be); the hover
// tip's lift is the fallback for things that are a node of parts rather than one mesh
const anchor = (id, t) => {
  const m = t.mesh; if (!m) return null;
  if (m.userData?.tipAt) return m.userData.tipAt;
  const b = m.geometry?.bounds;
  if (b && m.localToWorld) { const cx = (b.min[0] + b.max[0]) / 2, cz = (b.min[2] + b.max[2]) / 2; return m.localToWorld([cx, MIDDLE.has(id) ? (b.min[1] + b.max[1]) / 2 : b.max[1] + 0.2, cz]); }
  const wp = m.getWorldPosition([0, 0, 0]); wp[1] += TIP_LIFT[id] ?? 1;
  return wp;
};

function frame() {
  raf = 0; if (!hintsOn()) return;
  if (document.body.dataset.state !== 'desk') { hideHints(); return; }
  const cam = xp.camera;
  for (const it of items) {
    const p = anchor(it.id, it.t); if (!p) { it.el.classList.add('off'); continue; }
    // a big object half out of the window (the right-hand screen) keeps its label, held just inside the edge
    const nd = cam.project(p), y = (-nd[1] * 0.5 + 0.5) * innerHeight;
    let x = (nd[0] * 0.5 + 0.5) * innerWidth; if (MIDDLE.has(it.id) && Math.abs(nd[0]) < 1.4) x = Math.min(Math.max(x, 110), innerWidth - 110);
    const on = nd[2] < 1 && x > 24 && x < innerWidth - 24 && y > 60 && y < innerHeight - 60;
    it.el.classList.toggle('off', !on);
    if (on) { it.el.style.left = `${Math.round(x)}px`; it.el.style.top = `${Math.round(y)}px`; }
  }
  // the HUD that is showing is in the way of every label: they step around it like around each other
  const hud = HUD.map((id) => document.getElementById(id)).filter((e) => e && e.offsetParent !== null && getComputedStyle(e).opacity > 0.05).map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height);
  declutter(items.map((it) => it.el), 4, 64, hud);
  raf = requestAnimationFrame(frame);
}

export const hintsOn = () => !!root?.classList.contains('on');
export function initHints(experience, openGuide) { xp = experience; onFull = openGuide; build(); }
export function showHints() {
  build(); if (!xp) return;
  const targets = xp.world.targets;
  const ids = Object.keys(targets).filter((id) => { const d = TARGETS[id]; return d && !SKIP.has(d.kind) && (d.kind !== 'world' || d.label) && (d.hint || d.label?.title || d.title); });
  ids.sort((a, b) => ((ORDER.indexOf(a) + 1) || 99) - ((ORDER.indexOf(b) + 1) || 99));
  // one label per name (the space bar and the speaker both play the music: the speaker keeps it)
  const seen = new Set(); ids.splice(0, ids.length, ...ids.filter((id) => { const d = TARGETS[id], k = d.hint || d.label?.title || d.title; if (seen.has(k)) return false; seen.add(k); return true; }));
  root.innerHTML = '';
  items = ids.map((id, i) => {
    const d = TARGETS[id], el = document.createElement('button');
    el.type = 'button'; el.className = 'hn off'; el.dataset.id = id; el.style.setProperty('--i', i);
    const key = d.shortcut || SHORTCUTS[id];
    el.innerHTML = `<b>${key || '•'}</b>${d.hint || d.label?.title || d.title}`;
    root.appendChild(el); return { id, t: targets[id], el };
  });
  root.classList.add('on'); bar.classList.add('on'); document.body.classList.add('hints-on');
  if (!raf) raf = requestAnimationFrame(frame);
}
export function hideHints() {
  if (!root) return;
  root.classList.remove('on'); bar.classList.remove('on'); document.body.classList.remove('hints-on');
  if (raf) cancelAnimationFrame(raf); raf = 0;
  setTimeout(() => { if (!hintsOn()) root.innerHTML = ''; }, 400);
}
