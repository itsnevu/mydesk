// The portfolio, inside the desk. The monitor (and #site) used to open a plain page of its own here; since the real site exists at /,
// that page was a second, poorer copy of it. Now the sheet over the desk holds the site itself (scripts/site.js, served at /),
// framed, so the desk never reloads and there is one portfolio, not two. The site knows it is framed (html.in-desk: no 3D tab,
// no teaser) and every link of its own back to the desk arrives here as a message: the sheet goes away and the desk goes where
// the link pointed (#project-godplan-erp, #note, ...). "Back to the desk" and Esc put the sheet away too. The site loads the
// first time the sheet opens, never with the desk, and a closed sheet is display:none, so nothing in it runs behind the desk.
import { SITE } from 'app/data';
import { setRoute, parseRoute } from 'app/router';

const CSS = `
#site { position: fixed; inset: 0; z-index: 90; background: #0e0c09; opacity: 0; pointer-events: none; transition: opacity .4s ease; }
#site.open { opacity: 1; pointer-events: auto; }
#site:focus { outline: none; }
#site iframe { display: block; width: 100%; height: 100%; border: 0; background: #0e0c09; opacity: 0; transition: opacity .5s ease; }
#site.ready iframe { opacity: 1; }
#site .s-wait { position: absolute; inset: 0; display: grid; place-items: center; text-align: center; color: var(--accent, #d9a05b); font: 500 12px var(--mono, monospace); letter-spacing: .26em; text-transform: uppercase; transition: opacity .3s; }
#site.ready .s-wait { opacity: 0; pointer-events: none; }
#site .s-wait i { display: block; width: 44px; height: 1px; margin: 14px auto 0; background: var(--accent, #d9a05b); animation: s-pulse 1.1s ease-in-out infinite alternate; }
@keyframes s-pulse { from { transform: scaleX(.2); opacity: .4; } to { transform: none; opacity: 1; } }
#site .s-back { position: absolute; right: max(18px, env(safe-area-inset-right)); bottom: max(18px, env(safe-area-inset-bottom)); z-index: 2; display: inline-flex; align-items: center; gap: 10px; height: 46px; padding: 0 18px 0 16px; border-radius: 999px; border: 1px solid rgba(241,234,219,.35); background: rgba(14,12,9,.78); color: #f1eadb; font: 600 12px var(--mono, monospace); letter-spacing: .2em; text-transform: uppercase; cursor: pointer; -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,.4); transition: border-color .25s, background .25s, transform .4s ease; }
#site .s-back:hover { border-color: #f1eadb; background: rgba(14,12,9,.95); transform: translateY(-2px); }
#site .s-back b { font: 700 15px var(--mono, monospace); color: var(--accent, #d9a05b); }
#site :focus-visible { outline: 2px solid var(--accent, #d9a05b); outline-offset: 3px; }
#site .s-back .s-short { display: none; }
@media (max-width: 640px) { #site .s-back { height: 44px; padding: 0 14px 0 12px; } #site .s-back .s-long { display: none; } #site .s-back .s-short { display: inline; } }   /* (a phone keeps the hero's own bottom line clear) */
@media (prefers-reduced-motion: reduce) { #site, #site iframe, #site .s-back { transition: none; } #site .s-wait i { animation: none; } }
`;

let el = null, frame = null, xp = null, lastFocus = null, hideT = 0;

function build() {
  if (el) return el;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  el = document.createElement('div'); el.id = 'site'; el.tabIndex = -1; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', `${SITE.name}, the portfolio`);
  el.inert = true; el.hidden = true; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="s-wait" aria-hidden="true"><span>Opening the site<i></i></span></div><button type="button" class="s-back" data-close aria-label="Back to the desk"><b>←</b><span class="s-long">Back to the desk</span><span class="s-short">Desk</span></button>';
  document.body.appendChild(el);
  el.querySelector('[data-close]').addEventListener('click', () => closeSite());
  // the site's own links to the desk come back as messages: the sheet closes and the desk goes where the link pointed. Before the
  // gate the router ignores the hash, so the link waits as the desk's pending direct, the way a #project-x address does
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || e.data?.nv !== 'desk' || !isSiteOpen()) return;
    closeSite();
    const hash = String(e.data.hash || '').replace(/^#/, '');
    if (!hash || hash === 'site') return;
    location.hash = hash;
    const s = document.body.dataset.state;
    if (xp && (s === 'loading' || s === 'gate' || s === 'entering')) xp.pendingDirect = xp.directFor?.(parseRoute()) || null;
  });
  // while the sheet is up the desk hears no keys (Esc puts the sheet away; inside the frame the site handles its own keys)
  window.addEventListener('keydown', (e) => { if (!isSiteOpen()) return; e.stopImmediatePropagation(); if (e.key === 'Escape') { e.preventDefault(); closeSite(); } }, true);
  window.addEventListener('keyup', (e) => { if (isSiteOpen()) e.stopImmediatePropagation(); }, true);
  // the browser's back button closes it
  window.addEventListener('hashchange', () => { if (isSiteOpen() && location.hash !== '#site') closeSite(true); });
  return el;
}

export const isSiteOpen = () => !!el?.classList.contains('open');
export function initSite(experience) { xp = experience; build(); }
export function openSite() {
  build(); if (isSiteOpen()) return;
  lastFocus = document.activeElement;
  clearTimeout(hideT); el.hidden = false;
  if (!frame) {
    frame = document.createElement('iframe'); frame.title = `${SITE.name}, the portfolio`;
    frame.addEventListener('load', () => { el.classList.add('ready'); try { frame.contentWindow?.focus(); } catch {} });
    frame.src = '/'; el.prepend(frame);
  }
  el.inert = false; el.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => el.classList.add('open'));
  setRoute('site');
  el.focus({ preventScroll: true });
}
export function closeSite(fromHistory = false) {
  if (!isSiteOpen()) return;
  el.classList.remove('open'); el.inert = true; el.setAttribute('aria-hidden', 'true');
  clearTimeout(hideT); hideT = setTimeout(() => { if (!isSiteOpen()) el.hidden = true; }, 450);
  if (!fromHistory && location.hash === '#site') setRoute('');
  if (lastFocus?.focus) try { lastFocus.focus({ preventScroll: true }); } catch {}
}
