// All HTML layers: gate, HUD, menu, switching, gallery cards, detail page, overlays.
import { PROJECTS, SITE, FACTS, projectIndex, MENU, TARGETS, DISCOVERY_GROUPS, WORLDS, SHOTS, GALLERY, GALLERY_PHONE, SHOT_HOST } from 'app/data';
import { studyTexture } from 'app/gallery';
import { MOTION } from 'app/motion';

const $ = (id) => document.getElementById(id);
const isTouch = matchMedia('(pointer: coarse)').matches;
// a project with its own miniature world on the desk (GodPlan, the client street, JAKASN)
const hasWorld = (p) => WORLDS.some((w) => w.project === p.key);
// the small-screen layout, the same query as styles.css's mobile block
const compact = matchMedia('(max-width: 760px), (pointer: coarse) and (max-width: 1024px)');
// on a touch screen the copy says tap, not click ("click the key again", "the small things are clickable", "esc to keep exploring")
const TAP = { '': 'tap', able: 'tappable', ed: 'tapped', ing: 'tapping', s: 'taps' };
const touchWords = (s) => (!isTouch || !s ? s : String(s)
  .replace(/\besc to keep exploring\b/gi, 'tap × to keep exploring')
  .replace(/\b([Cc])lick(able|ed|ing|s)?\b/g, (m, c, suf = '') => { const w = TAP[suf] || 'tap'; return c === 'C' ? w[0].toUpperCase() + w.slice(1) : w; }));
// something hidden can't be tabbed into or read out while it's hidden
const setShown = (el, on) => { el.inert = !on; el.setAttribute('aria-hidden', on ? 'false' : 'true'); };
for (const id of ['spatial', 'view-project', 'detail']) { const e = $(id); if (e) e.inert = true; }   // (all three start hidden)
// the interface grows with big (or zoomed-out) windows: 1 on a laptop, up to 3.2; styles.css reads it as --ui (from 1025px up)
let uiScale = 1;
const setUIScale = () => { uiScale = innerWidth > 1024 ? Math.min(3.2, Math.max(1, Math.min(innerWidth / 1440, innerHeight / 810))) : 1; document.documentElement.style.setProperty('--ui', uiScale.toFixed(3)); };
setUIScale(); addEventListener('resize', setUIScale);

// ---------- loading
export const loading = {
  set(p) { $('loading-fill').style.width = `${Math.round(p * 100)}%`; $('loading-percent').textContent = `${Math.round(p * 100)}%`; },
  done() { $('loading').classList.add('out'); setTimeout(() => $('loading').remove(), 800); },
};

// ---------- gate
export const gate = {
  show() {
    $('gate-year').textContent = SITE.year; $('gate-name').textContent = SITE.author;
    if (isTouch) $('gate-hint').textContent = 'drag to rotate · pinch to zoom · tap what glows';
    $('gate').classList.remove('hidden');
  },
  bind({ onEnter, onPortfolio, onMute }) {
    $('gate-enter').addEventListener('click', onEnter);
    $('gate-portfolio').addEventListener('click', onPortfolio);
    $('gate-mute').addEventListener('click', onMute);
  },
  leave() { $('gate').classList.add('leaving'); setTimeout(() => $('gate').classList.add('hidden'), 1200); },
};

// ---------- discoveries: a count, three meters by where to look, and on click the list of what is left and where
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const disc = { found: new Set(), order: [], groups: [], open: false, onPick: null, bound: false, shown: -1 };
// the groups as data.js names them, holding only ids that count; an id no group lists is filed under the desk
function discoveryGroups(order) {
  const groups = DISCOVERY_GROUPS.map((g) => ({ ...g, ids: g.ids.filter((id) => order.includes(id)) }));
  const listed = new Set(groups.flatMap((g) => g.ids));
  for (const id of order) if (!listed.has(id)) (groups.find((g) => g.id === 'desk') || groups[0]).ids.push(id);
  return groups.filter((g) => g.ids.length);
}
function renderDiscoveryList() {
  const { found, groups } = disc;
  const tip = isTouch ? 'Tap anything that glows. Each new thing counts once; tap one you have found to go back to it.'
    : 'Anything that names itself when you point at it can be found. Each counts once; click one you have found to go back to it.';
  $('discovery-list').innerHTML = `<div class="dl-head"><span class="dl-title mono">what's left, and where</span><button type="button" class="dl-close" aria-label="Close the list">×</button></div><p class="dl-tip">${tip}</p>` +
    groups.map((g) => {
      const got = g.ids.filter((id) => found.has(id)), left = g.ids.length - got.length;
      const chips = got.map((id) => `<button type="button" class="dl-chip" data-id="${id}">${esc(TARGETS[id]?.discover || id)}</button>`).join('');
      return `<section class="dl-group${left ? '' : ' done'}"><div class="dl-row"><span class="dl-name">${g.title}</span><span class="dl-count mono">${got.length}/${g.ids.length}</span></div><p class="dl-hint">${g.hint}</p>` +
        `<div class="dl-chips">${chips}<span class="dl-left mono">${left ? `${left} still hidden` : 'all found'}</span></div></section>`;
    }).join('');
}
function setDiscoveryOpen(v) {
  disc.open = v; if (v) renderDiscoveryList();
  $('discovery').classList.toggle('open', v); $('discovery-toggle').setAttribute('aria-expanded', String(v)); $('discovery-list').setAttribute('aria-hidden', String(!v));
}
function bindDiscovery() {
  if (disc.bound) return; disc.bound = true;
  $('discovery-toggle').addEventListener('click', () => setDiscoveryOpen(!disc.open));
  $('discovery-list').addEventListener('click', (e) => {
    if (e.target.closest('.dl-close')) { setDiscoveryOpen(false); return; }
    const chip = e.target.closest('.dl-chip'); if (chip) { setDiscoveryOpen(false); disc.onPick?.(chip.dataset.id); }
  });
  // anywhere else closes it; Esc closes it without also stepping the scene back
  addEventListener('pointerdown', (e) => { if (disc.open && !$('discovery').contains(e.target)) setDiscoveryOpen(false); }, true);
  addEventListener('keydown', (e) => { if (disc.open && e.key === 'Escape') { setDiscoveryOpen(false); e.preventDefault(); e.stopImmediatePropagation(); } }, true);
}

// ---------- HUD
const tip = $('key-tip');
let toastTimer = null;
export const hud = {
  discovery(found, order) {
    bindDiscovery();
    if (disc.order !== order) { disc.order = order; disc.groups = discoveryGroups(order); }
    disc.found = found;
    const n = found.size, total = order.length;
    $('discovery-value').textContent = n; $('discovery-total').textContent = `/${total}`;
    $('discovery-compact').textContent = `${n}/${total}`; $('discovery-bar').style.transform = `scaleX(${n / total})`;
    const box = $('discovery-groups');
    if (!box.children.length) box.innerHTML = disc.groups.map((g) => `<span class="dg" data-g="${g.id}"><span class="dg-bar"><i></i></span><span class="dg-text mono">${g.label} <b>0</b>/${g.ids.length}</span></span>`).join('');
    for (const g of disc.groups) {
      const k = g.ids.filter((id) => found.has(id)).length, el = box.querySelector(`[data-g="${g.id}"]`);
      el.querySelector('i').style.transform = `scaleX(${k / g.ids.length})`; el.querySelector('b').textContent = k; el.classList.toggle('done', k === g.ids.length);
    }
    $('discovery-toggle').setAttribute('aria-label', `Discoveries: ${n} of ${total} found. Show what is left and where to look.`);
    // a small tick when the count goes up (not on the first paint, which may restore a saved count)
    if (disc.shown >= 0 && n > disc.shown) { const v = $('discovery').querySelector('.discovery-value'); v.classList.remove('bump'); void v.offsetWidth; v.classList.add('bump'); }
    disc.shown = n;
    if (disc.open) renderDiscoveryList();
  },
  // a found thing picked from the list goes back to it
  discoveryPick(fn) { disc.onPick = fn; },
  navHints(v) { $('nav-hints').classList.toggle('visible', v); },
  sceneLabel(title, sub) {
    const el = $('scene-label');
    if (!title) { el.classList.remove('visible'); return; }
    $('scene-label-title').textContent = title; $('scene-label-sub').textContent = sub || '';
    el.classList.add('visible');
  },
  // the name card follows its anchor, held inside the window and clear of the corner buttons; an anchor off screen hides it, and on a
  // small screen the stylesheet docks it above the buttons instead (inline positions would override that)
  sceneLabelPos(x, y) {
    const el = $('scene-label');
    if (compact.matches) { if (el.style.left) { el.style.left = ''; el.style.top = ''; } el.classList.remove('offscreen'); return; }
    const off = !(x > -60 && x < innerWidth + 60 && y > -60 && y < innerHeight + 60); el.classList.toggle('offscreen', off); if (off) return;
    const w = (el.offsetWidth || 200) * uiScale, h = (el.offsetHeight || 46) * uiScale;
    el.style.left = `${Math.max(24, Math.min(x, innerWidth - w - 52 * uiScale))}px`; el.style.top = `${Math.max(24 * uiScale, Math.min(y, innerHeight - h - 84 * uiScale))}px`;
  },
  keyTip(x, y, key, text) {
    if (!key) { tip.classList.remove('visible'); return; }
    $('key-tip-key').textContent = key; $('key-tip-text').textContent = text;
    // the tip is centred over its point and lifted above it: keep the whole label inside the window
    const hw = ((tip.offsetWidth || 160) * uiScale) / 2 + 8, th = (tip.offsetHeight || 30) * uiScale * 1.4 + 8;
    tip.style.left = `${Math.min(Math.max(x, hw), innerWidth - hw)}px`; tip.style.top = `${Math.min(Math.max(y, th), innerHeight - 8)}px`; tip.classList.add('visible');
  },
  back(v) { const b = $('back-btn'); b.classList.toggle('visible', v); if (!v && document.activeElement === b) b.blur(); b.inert = !v; document.body.dataset.backvisible = v ? '1' : '0'; },
  kbdHints(items) {
    const el = $('kbd-hints');
    if (!items || isTouch) { el.classList.remove('visible'); return; }
    el.innerHTML = items.map(([k, t]) => `<span><kbd>${k}</kbd>${t}</span>`).join('');
    el.classList.add('visible');
  },
  toast(html, ms = 2400) {
    const el = $('toast'); el.innerHTML = touchWords(html); el.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), ms);
  },
  sound(st) {
    const b = $('sound-toggle');
    b.setAttribute('aria-pressed', st.enabled && st.playing ? 'true' : 'false');
    $('sound-text').textContent = st.enabled ? 'sound on' : 'sound off';
  },
  cursor(c) { document.body.dataset.cursor = c; },
  // who this is, top-left from the first frame: one click to About instead of finding the note on the desk
  identity(onClick) {
    $('id-name').textContent = SITE.name; $('id-role').textContent = `${SITE.role} · ERP & web`;
    $('identity').addEventListener('click', () => onClick());
  },
};

// ---------- menu
export const menu = {
  build(onSelect) {
    const nav = $('site-menu');
    nav.innerHTML = '';
    for (const m of MENU) {
      const a = document.createElement('a'); a.href = `#${m.target}`; a.textContent = m.label; a.dataset.key = (m.key || m.target).toUpperCase();
      // (the link lets go of focus first: closing the menu would otherwise hand it to the toggle, and Space would reopen the menu)
      a.addEventListener('click', (e) => { e.preventDefault(); a.blur(); menu.close(); onSelect(m); });
      nav.appendChild(a);
    }
    setShown(nav, false); $('back-btn').inert = true;
    $('menu-toggle').addEventListener('click', () => menu.toggle());
    window.addEventListener('click', (e) => { if (menu.isOpen && !nav.contains(e.target) && !$('menu-toggle').contains(e.target)) menu.close(); });
  },
  get isOpen() { return $('site-menu').classList.contains('open'); },
  open() { $('site-menu').classList.add('open'); $('menu-toggle').classList.add('open'); $('menu-toggle').setAttribute('aria-expanded', 'true'); setShown($('site-menu'), true); },
  close() { const nav = $('site-menu'); if (nav.contains(document.activeElement)) $('menu-toggle').focus(); nav.classList.remove('open'); $('menu-toggle').classList.remove('open'); $('menu-toggle').setAttribute('aria-expanded', 'false'); setShown(nav, false); },
  toggle() { menu.isOpen ? menu.close() : menu.open(); },
};

// ---------- switching scenes
let factIndex = Math.floor(Math.random() * FACTS.length);
export const switching = {
  show() {
    const glyphs = ['esc', 'tab', 'f1', 'f2', 'f3', '⏎', '␣', 'fn', '◀', '▶', 'ctrl', 'alt'];
    const row = (rev) => (rev ? [...glyphs].reverse() : glyphs).map((g) => `<span>${g}</span>`).join('');
    $('sw-row-top').innerHTML = row(false); $('sw-row-bottom').innerHTML = row(true);
    factIndex = (factIndex + 1) % FACTS.length;
    $('sw-fact').textContent = 'fact: ' + FACTS[factIndex];
    $('switching').classList.add('visible'); $('switching').setAttribute('aria-hidden', 'false');
  },
  hide() { $('switching').classList.remove('visible'); $('switching').setAttribute('aria-hidden', 'true'); },
};

// ---------- generated project imagery (shared by detail page)
const cardCanvasCache = new Map();
function cardCanvas(p, w, h) {
  const k = `${p.key}:${w}x${h}`;
  if (!cardCanvasCache.has(k)) cardCanvasCache.set(k, studyTexture(p, w, h).image);
  return cardCanvasCache.get(k);
}

// ---------- detail
let dHandlers = {}, detailReturn = null;
export const detail = {
  build(handlers) {
    dHandlers = handlers;
    $('detail-back').addEventListener('click', () => handlers.onBack?.());
    $('detail-3d').addEventListener('click', () => handlers.onView3D?.(detail.current));
    $('detail-3d').textContent = 'back to the world';
    const strip = $('detail-strip');
    PROJECTS.forEach((p) => {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.key = p.key;
      // a live site's thumbnail is its real screenshot; the file is only asked for when the page first opens (data-src), not at boot
      if (GALLERY[p.key] || SHOTS.includes(p.key)) { const im = document.createElement('img'); im.dataset.src = GALLERY[p.key] ? `shots/gallery/${p.key}-1.webp` : `shots/${p.key}.webp`; im.alt = ''; im.decoding = 'async'; im.onerror = () => im.replaceWith(cardCanvas(p, 240, 152)); b.appendChild(im); }
      else b.appendChild(cardCanvas(p, 240, 152));
      const s = document.createElement('span'); s.textContent = `${projectIndex(p)} ${p.title}`; b.appendChild(s);
      b.addEventListener('click', () => detail.show(p));
      strip.appendChild(b);
    });
    $('detail').inert = true;
  },
  current: null,
  show(p) {
    detail.current = p;
    $('detail-index').textContent = projectIndex(p);
    $('detail-title').textContent = p.title; $('detail-desc').textContent = p.description;
    $('detail-industry').textContent = p.industry; $('detail-stack').textContent = p.stack; $('detail-date').textContent = p.date;
    $('detail-3d').classList.toggle('hidden', !hasWorld(p));
    const live = $('detail-live'); live.classList.toggle('hidden', !p.url);
    if (p.url) { live.href = p.url; live.textContent = `visit ${new URL(p.url).hostname.replace(/^www\./, '')} →`; }
    const media = $('detail-media'); media.innerHTML = ''; media.classList.remove('has-shot');
    for (const im of $('detail-strip').querySelectorAll('img[data-src]')) { im.src = im.dataset.src; im.removeAttribute('data-src'); }
    const shots = GALLERY[p.key] ? Array.from({ length: GALLERY[p.key] }, (_, i) => `shots/gallery/${p.key}-${i + 1}.webp`) : SHOTS.includes(p.key) && p.url ? [`shots/${p.key}.webp`] : [];
    if (shots.length) {
      // the site as it looks: a browser window with its address, the phone version standing in front of it, and when there are
      // more pages, a row of them under the window (a click puts that page in the window)
      const host = p.url ? new URL(p.url).hostname.replace(/^www\./, '') : SHOT_HOST[p.key] || `${p.title} · internal`;
      const phone = GALLERY_PHONE[p.key] || (SHOTS.includes(p.key) ? `shots/${p.key}-m.webp` : null);
      media.classList.add('has-shot');
      media.innerHTML = `<div class="shot-stage"><div class="shot-frame"><div class="shot-bar" aria-hidden="true"><i></i><i></i><i></i><span>${host}</span></div><img class="shot-d" alt="${p.title}: the site" decoding="async"></div>${phone ? `<img class="shot-m" alt="${p.title} on a phone" decoding="async">` : ''}</div>` +
        (shots.length > 1 ? `<div class="shot-thumbs">${shots.map((src, i) => `<button type="button" class="shot-thumb${i ? '' : ' on'}" data-i="${i}" aria-label="${p.title}, page ${i + 1} of ${shots.length}"><img src="${src}" alt="" decoding="async" loading="lazy"></button>`).join('')}</div>` : '');
      const d = media.querySelector('.shot-d'), m = media.querySelector('.shot-m');
      d.onerror = () => { media.classList.remove('has-shot'); media.innerHTML = ''; media.appendChild(cardCanvas(p, 1280, 720)); };
      if (m) { m.onerror = () => m.remove(); m.src = phone; }
      d.src = shots[0];
      media.querySelector('.shot-thumbs')?.addEventListener('click', (e) => { const b = e.target.closest('.shot-thumb'); if (!b) return; d.src = shots[+b.dataset.i]; for (const t of media.querySelectorAll('.shot-thumb')) t.classList.toggle('on', t === b); });
    } else media.appendChild(cardCanvas(p, 1280, 720));
    const strip = $('detail-strip'); for (const b of strip.children) b.classList.toggle('active', b.dataset.key === p.key);
    // the active thumbnail slides to the middle of the strip (scrollIntoView could also scroll the page under it)
    const active = strip.querySelector('.active'); if (active) strip.scrollTo({ left: active.offsetLeft - strip.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2, behavior: 'smooth' });
    const opening = !detail.visible;
    $('detail').classList.add('visible'); setShown($('detail'), true);
    document.querySelector('.detail-scroll').scrollTo({ top: 0 });
    // keyboard focus moves into the page when it opens, and goes back where it came from when it closes
    if (opening) { detailReturn = document.activeElement; $('detail-back').focus({ preventScroll: true }); }
    dHandlers.onShow?.(p);
  },
  hide() {
    const el = $('detail'); if (!el.classList.contains('visible')) return;
    const r = detailReturn; detailReturn = null; if (el.contains(document.activeElement)) { if (r && r.isConnected && r !== document.body) r.focus({ preventScroll: true }); else document.activeElement.blur(); }
    el.classList.remove('visible'); setShown(el, false);
  },
  get visible() { return $('detail').classList.contains('visible'); },
};

// ---------- spatial panel: information anchored beside the object that revealed it
let typeTimer = null;
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
function typeHeading(text) {
  const h = $('sp-heading'); clearInterval(typeTimer); h.setAttribute('aria-label', text); // (a screen reader hears the whole title, not a half-typed one)
  if (MOTION.reduced) { h.textContent = text; h.classList.add('done'); return; }
  h.textContent = ''; h.classList.remove('done');
  let i = 0;
  typeTimer = setInterval(() => { i++; h.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(typeTimer); h.classList.add('done'); } }, 45);
}
// a code snippet as an editor shows it: file tab, line numbers, the usual colours (keywords, types, calls, strings)
const KEYWORDS = new Set(['class', 'private', 'public', 'protected', 'readonly', 'static', 'return', 'const', 'let', 'new', 'extends', 'implements', 'this', 'function', 'if', 'else', 'async', 'await']);
function highlight(line) {
  let out = '', prev = '';
  for (const m of line.matchAll(/(\s+)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|([A-Za-z_$][\w$]*)|(\d+(?:\.\d+)?)|([^\s\w])/g)) {
    const [tok, ws, str, id, num] = m;
    if (ws) out += ws;
    else if (str) out += `<span class="tk-s">${esc(str)}</span>`;
    else if (id) { const cls = KEYWORDS.has(id) ? 'tk-k' : (prev === 'class' || /^[A-Z]/.test(id)) ? 'tk-t' : /^\s*\(/.test(line.slice(m.index + tok.length)) ? 'tk-f' : 'tk-v'; out += `<span class="${cls}">${id}</span>`; prev = id; }
    else if (num) out += `<span class="tk-n">${num}</span>`;
    else out += `<span class="tk-p">${esc(tok)}</span>`;
  }
  return out;
}
function codeBlock(file, lines) {
  const rows = lines.map((l, i) => `<span class="row" style="--i:${i}"><span class="ln" aria-hidden="true">${i + 1}</span><span class="src">${highlight(l) || ' '}</span></span>`).join('');
  return `<figure class="sp-code"><figcaption class="sp-code-bar mono"><span class="sp-code-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="sp-code-file">${esc(file)}</span><span class="sp-code-lang">${esc((file.split('.').pop() || '').toUpperCase())}</span></figcaption><pre class="mono">${rows}</pre></figure>`;
}
// how to leave a panel, said once at its foot (touch has no Esc; the × in the corner works everywhere)
const leaveHint = () => (isTouch ? '' : '<p class="mono sp-hint"><kbd>esc</kbd> or <kbd>×</kbd> to keep exploring</p>');
// the × closes the panel the way the back button does
$('sp-body').addEventListener('click', (e) => {
  if (e.target.closest('.sp-close')) { $('back-btn').click(); return; }
  // a panel's own next step (go inside, look closer): the scene does what a second click on the object would
  const go = e.target.closest('[data-go]'); if (go) { go.blur(); dispatchEvent(new CustomEvent('kw:go', { detail: go.dataset.go })); }
});
function showPanel(sig, heading, html, side = 'right') {
  const el = $('spatial');
  $('sp-sig').textContent = sig; typeHeading(heading); $('sp-body').innerHTML = `<button type="button" class="sp-close" aria-label="Close">×</button>${touchWords(html)}`;
  el.dataset.side = side; el.dataset.pref = side; el.classList.add('visible'); setShown(el, true);
  el.querySelector('.sp-card')?.scrollTo?.({ top: 0 }); // (a new panel starts at its top, not where the last one was scrolled to)
}
// the same outbound links close the About panel and open the Contact one
const linksRow = () => `<div class="contact-links">${SITE.links.map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join('')}</div>`;
export const panel = {
  about() {
    const glance = `<div class="sp-group"><span class="sp-group-title mono">at a glance</span><ul class="sp-skills">${SITE.facts.map((f) => `<li>${f}</li>`).join('')}</ul></div>`;
    showPanel('who I am', 'ABOUT', `<p>${SITE.about}</p><p><strong>Currently:</strong> ${SITE.currently}</p>${glance}${linksRow()}`, 'right');
  },
  skills() {
    const html = SITE.skills.map((g) => `<div class="sp-group"><span class="sp-group-title mono">${g.group}</span><ul class="sp-skills">${g.items.map((i) => `<li>${i}</li>`).join('')}</ul></div>`).join('');
    showPanel('what I work with', 'SKILLS', html, 'right');
  },
  // the PC: what the work runs on, as a spec sheet. One row per layer, each tool a chip with a small status light; the chips
  // come on one after another, like a machine booting, and the count and the GitHub link sit under them
  machine(t) {
    let n = 0; const total = t.stack.reduce((a, r) => a + r.items.length, 0);
    const rows = t.stack.map((r) => `<div class="mc-row"><span class="mc-layer mono">${esc(r.layer)}</span><ul class="mc-chips">${r.items.map((i) => `<li style="--i:${n++}"><i aria-hidden="true"></i>${esc(i)}</li>`).join('')}</ul></div>`).join('');
    const foot = `<div class="mc-foot"><span class="mc-count mono"><b>${total}</b> tools · <b>${t.stack.length}</b> layers</span>${t.github ? `<a class="ov-btn mono sp-go mc-git" href="${t.github}" target="_blank" rel="noopener">the code on GitHub ↗</a>` : ''}</div>`;
    showPanel(t.sub, t.title.toUpperCase(), `<p>${t.body}</p><div class="mc-sheet">${rows}</div>${foot}${leaveHint()}`, 'right');
  },
  contact() {
    showPanel('get in touch', 'SAY HELLO', `
      ${linksRow()}
      <form class="contact-form" id="contact-form">
        <label>name<input name="name" required autocomplete="name" /></label>
        <label>email<input name="email" type="email" autocomplete="email" /></label>
        <label>message<textarea name="message" rows="3" required></textarea></label>
        <div class="row"><button type="submit" class="ov-btn mono">send via whatsapp</button><span class="status" id="contact-status"></span></div>
      </form>`, 'right');
    // the message goes out on WhatsApp, the channel that actually gets answered
    $('contact-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const text = encodeURIComponent(`Hi ${SITE.name.split(' ')[0]}! ${f.get('message')}\n\n${f.get('name')}${f.get('email') ? ` (${f.get('email')})` : ''}`);
      $('contact-status').textContent = 'opening whatsapp…';
      window.open(`https://wa.me/${SITE.whatsapp}?text=${text}`, '_blank', 'noopener');
      setTimeout(() => { $('contact-status').textContent = 'thanks, talk soon.'; }, 900);
    });
  },
  timeline(onPick) {
    const wrap = document.createElement('div'); wrap.className = 'ov-timeline';
    // dates are free text ('since July 2025', 'live'): the year groups them, the latest month orders them, undated ones go last
    const yearOf = (p) => (p.date.match(/\b\d{4}\b/) || [p.date])[0];
    const when = (p) => { const y = p.date.match(/\b\d{4}\b/); if (!y) return -1; const months = [...p.date.toLowerCase().matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/g)].map((m) => MONTHS.indexOf(m[1])); return +y[0] * 12 + Math.max(0, ...months); };
    const sorted = [...PROJECTS].sort((a, b) => when(b) - when(a));
    let year = null;
    for (const p of sorted) {
      const y = yearOf(p);
      if (y !== year) { year = y; const h = document.createElement('div'); h.className = 'ov-year mono'; h.textContent = y; wrap.appendChild(h); }
      const li = document.createElement('button'); li.type = 'button'; li.className = 'ov-row' + (hasWorld(p) ? ' portal' : ''); // (a button: the keyboard can reach every project)
      li.innerHTML = `<span class="ov-list-idx">${projectIndex(p)}</span><span class="ov-list-title">${p.title}</span><span class="ov-list-meta">${p.date.replace(y, '').trim()}</span>`;
      li.addEventListener('click', () => onPick(p));
      wrap.appendChild(li);
    }
    showPanel('every project, in order', 'TIMELINE', '', 'left');
    $('sp-body').appendChild(wrap);
  },
  // an object's panel explains the object, so its eyebrow is the object's own line (no name in front of it, unlike About)
  // o (the target, when there is one): `badge` prints a small pill over the text, `code` + `file` an editor snippet above it
  discovery(title, sub, body, o = {}) {
    const badge = o.badge ? `<p class="sp-badges"><span class="sp-badge mono">${esc(o.badge)}</span></p>` : '';
    const code = o.code ? codeBlock(o.file || sub, o.code) : '';
    showPanel(o.code ? title.toLowerCase() : sub, title.toUpperCase(), `${badge}${code}<p>${body}</p>${leaveHint()}`, 'right');
  },
  hotspot(project, h) {
    showPanel(`${project.title} / ${h.title.toLowerCase()}`, h.title.toUpperCase(), `<p>${h.body}</p>`, 'right');
  },
  place(x, y) {
    const el = $('spatial'); const w = (el.offsetWidth || 300) * uiScale, h = (el.offsetHeight || 160) * uiScale, m = 24;   // the panel's drawn size, after the UI scale
    // the panel opens on the side its caller asked for (the timeline sits left of the clock, so the clock stays in view). It only
    // flips when that side is badly short of room (over a third of the panel would hang off) and the other side has room; a few
    // pixels short, it is nudged inside the window instead, so it never lands on the object it describes (panel is centred on y)
    const overR = x + w + 40 + m - innerWidth, overL = w + 40 + m - x, pref = el.dataset.pref || 'right';
    const side = pref === 'left' ? (overL > w * 0.35 && overR <= 0 ? 'right' : 'left') : (overR > w * 0.35 && overL <= 0 ? 'left' : 'right');
    el.dataset.side = side;
    const lx = side === 'right' ? Math.max(m, Math.min(x, innerWidth - w - 40 - m)) : Math.min(innerWidth - m, Math.max(x, w + 40 + m));
    // vertically it stays between the HUD rows: under the name and the discoveries counter when it sits in the left column, under the
    // menu button otherwise, and above the bottom buttons; a panel taller than that room is centred in it
    const left = side === 'right' ? lx + 28 * uiScale : lx - w - 28 * uiScale;
    const top0 = (left < 330 * uiScale ? 212 : 96) * uiScale, bottom0 = innerHeight - 84 * uiScale;
    const ty = h > bottom0 - top0 ? (top0 + bottom0) / 2 : Math.min(Math.max(top0 + h / 2, y), bottom0 - h / 2);
    el.style.left = `${lx}px`; el.style.top = `${ty}px`;
  },
  hide() { clearInterval(typeTimer); const el = $('spatial'); if (el.contains(document.activeElement)) document.activeElement.blur(); el.classList.remove('visible'); setShown(el, false); },
  get visible() { return $('spatial').classList.contains('visible'); },
};

// ---------- discovery feedback: a quiet two-line notice
let discTimer = null;
export function discovered(label, sub) {
  const el = $('discovered'); $('disc-label').textContent = label; $('disc-sub').textContent = sub || '';
  el.classList.add('visible'); clearTimeout(discTimer); discTimer = setTimeout(() => el.classList.remove('visible'), 2000);
}

// ---------- "view project": appears only after the world has been explored
export const viewProject = {
  show(p, onClick) { const b = $('view-project'); b.onclick = onClick; b.classList.add('visible'); setShown(b, true); },
  place(x, y) { const b = $('view-project'); b.style.left = `${x}px`; b.style.top = `${y}px`; },
  hide() { const b = $('view-project'); if (document.activeElement === b) b.blur(); b.classList.remove('visible'); setShown(b, false); },
};

export const reward = {
  show() { $('reward').classList.add('visible'); setTimeout(() => $('reward').classList.remove('visible'), 3600); },
};

// ---------- the keyboard's story: a caption card at the foot of the screen, one stop at a time (data.js STORY)
let storyEl = null, storyH = {};
function storyCard() {
  if (storyEl) return storyEl;
  storyEl = document.createElement('section'); storyEl.id = 'story'; storyEl.setAttribute('aria-label', 'The story so far');
  storyEl.innerHTML = `<div class="st-head mono"><span class="st-step"></span><span class="st-when"></span><button type="button" class="st-close" aria-label="End the story">×</button></div>
    <div class="st-dots" aria-hidden="true"></div><h3 class="st-title"></h3><p class="st-body" aria-live="polite"></p>
    <div class="st-row"><button type="button" class="st-prev mono">‹ back</button><button type="button" class="st-go mono"></button><button type="button" class="st-next mono"></button></div>`;
  document.body.appendChild(storyEl);
  storyEl.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return; b.blur();
    if (b.classList.contains('st-close')) storyH.onClose?.(); else if (b.classList.contains('st-prev')) storyH.onPrev?.(); else if (b.classList.contains('st-next')) storyH.onNext?.(); else if (b.classList.contains('st-go')) storyH.onGo?.();
  });
  setShown(storyEl, false);
  return storyEl;
}
export const story = {
  // go: the label of the button that steps into the stop ('go inside', 'open it'), or null for a stop with no way in
  show(stop, i, n, handlers, { go = null, next = null } = {}) {
    const el = storyCard(); storyH = handlers;
    el.querySelector('.st-step').textContent = `${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
    el.querySelector('.st-when').textContent = stop.when;
    el.querySelector('.st-title').textContent = stop.title; el.querySelector('.st-body').textContent = stop.body;
    el.querySelector('.st-dots').innerHTML = Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'done' : k === i ? 'on' : ''}"></i>`).join('');
    el.querySelector('.st-prev').disabled = i === 0;
    el.querySelector('.st-next').textContent = next || (i === 0 ? 'start →' : 'next stop →');
    const g = el.querySelector('.st-go'); g.hidden = !go; if (go) g.textContent = go;
    // a new stop: the words fade across
    el.classList.remove('turn'); void el.offsetWidth; el.classList.add('turn');
    el.classList.add('visible'); setShown(el, true); document.body.dataset.story = '1';
  },
  hide() { if (!storyEl) return; if (storyEl.contains(document.activeElement)) document.activeElement.blur(); storyEl.classList.remove('visible'); setShown(storyEl, false); delete document.body.dataset.story; },
  get visible() { return !!storyEl?.classList.contains('visible'); },
};

// ---------- the keyboard as a map: while it has the focus, every district and story key carries a small label (a button)
let mapEl = null, mapPick = null;
export const kbMap = {
  show(items, onPick) {
    if (!mapEl) {
      mapEl = document.createElement('div'); mapEl.id = 'kb-map'; document.body.appendChild(mapEl);
      mapEl.addEventListener('click', (e) => { const b = e.target.closest('[data-id]'); if (b) { b.blur(); mapPick?.(b.dataset.id); } });
    }
    mapPick = onPick;
    mapEl.innerHTML = items.map((it) => `<button type="button" class="km-pin${it.story ? ' km-story' : ''}" data-id="${it.id}"><span class="km-num mono">${esc(it.num)}</span><span class="km-text"><span class="km-title">${esc(it.title)}</span>${it.sub ? `<span class="km-sub mono">${esc(it.sub)}</span>` : ''}</span></button>`).join('');
    mapEl.classList.add('visible');
  },
  // the label stands centred over its point, held inside the window (it is drawn at the UI scale on big screens)
  place(id, x, y, on) {
    const b = mapEl?.querySelector(`[data-id="${id}"]`); if (!b) return;
    const hw = ((b.offsetWidth || 80) * uiScale) / 2 + 8; x = Math.min(Math.max(x, hw), innerWidth - hw);
    b.style.left = `${Math.round(x)}px`; b.style.top = `${Math.round(y)}px`; b.classList.toggle('off', !on);
  },
  hide() { if (!mapEl) return; if (mapEl.contains(document.activeElement)) document.activeElement.blur(); mapEl.classList.remove('visible'); },
  get visible() { return !!mapEl?.classList.contains('visible'); },
};

export { isTouch };
