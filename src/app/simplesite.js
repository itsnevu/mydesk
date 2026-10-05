// The plain website: the same portfolio as an ordinary scrolling page (about, skills, the path so far, the work, contact) for
// visitors who would rather read than explore. The monitor opens it, and #site opens it straight away, over the loading
// screen or the gate, so a link sent to a recruiter needs no 3D at all. "Explore the 3D desk" puts it away. Every line comes
// from app/data: nothing here is new copy except the section names.
import { SITE, PROJECTS, WORLDS, SHOTS, STORY, GALLERY } from 'app/data';
import { setRoute } from 'app/router';

const CSS = `
#site { position: fixed; inset: 0; z-index: 90; overflow: auto; overscroll-behavior: contain; background: var(--bg, #120f0a); color: var(--paper, #e7ddc8); font-family: var(--sans, system-ui); -webkit-font-smoothing: antialiased; opacity: 0; pointer-events: none; transition: opacity .35s; scrollbar-width: thin; scrollbar-color: rgba(217,160,91,0.45) transparent; }
#site.open { opacity: 1; pointer-events: auto; }
#site:focus { outline: none; }
#site * { box-sizing: border-box; }
#site a { color: inherit; text-decoration: none; }
#site .s-wrap { width: min(1080px, 100%); margin: 0 auto; padding: 0 24px; }
#site .s-mono { font-family: var(--mono, monospace); }
#site .s-bar { position: sticky; top: 0; z-index: 2; background: rgba(18,15,10,0.86); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(199,163,106,0.14); }
#site .s-bar .s-wrap { display: flex; align-items: center; gap: 28px; height: 64px; }
#site .s-brand { font-weight: 700; font-size: 18px; letter-spacing: 0.01em; margin-right: auto; }
#site .s-nav { display: flex; gap: 24px; font-size: 14px; color: rgba(231,221,200,0.7); }
#site .s-nav a:hover { color: var(--paper, #e7ddc8); }
#site .s-3d { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px; border: 1px solid rgba(217,160,91,0.6); border-radius: 999px; font: 600 14px var(--sans, system-ui); color: var(--paper, #e7ddc8); background: none; cursor: pointer; white-space: nowrap; transition: border-color .2s, background .2s; }
#site .s-3d:hover { border-color: var(--accent, #d9a05b); background: rgba(217,160,91,0.1); }
#site .s-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 48px; padding: 0 22px; border-radius: 999px; font: 700 15px var(--sans, system-ui); border: 1px solid rgba(217,160,91,0.6); color: var(--paper, #e7ddc8); background: none; cursor: pointer; transition: transform .2s, background .2s; }
#site .s-btn.fill { background: var(--accent, #d9a05b); border-color: var(--accent, #d9a05b); color: #1a140d; }
#site .s-btn:hover { transform: translateY(-1px); }
#site .s-hero { padding: 96px 0 72px; }
#site .s-eyebrow { font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent, #d9a05b); }
#site h1 { margin: 16px 0 20px; font-size: clamp(40px, 7vw, 76px); line-height: 1.02; letter-spacing: -0.02em; font-weight: 700; }
#site .s-lead { max-width: 640px; margin: 0 0 32px; font-size: 18px; line-height: 1.65; color: rgba(231,221,200,0.78); }
#site .s-row { display: flex; flex-wrap: wrap; gap: 12px; }
#site .s-stats { display: flex; flex-wrap: wrap; gap: 10px 28px; margin-top: 44px; font-size: 13px; color: rgba(231,221,200,0.62); }
#site .s-stats span::before { content: "> "; color: var(--accent, #d9a05b); }
#site section { padding: 72px 0; border-top: 1px solid rgba(199,163,106,0.12); scroll-margin-top: 64px; }
#site h2 { margin: 10px 0 28px; font-size: clamp(28px, 4vw, 40px); letter-spacing: -0.01em; }
#site .s-about { display: grid; grid-template-columns: 1.4fr 1fr; gap: 40px; align-items: start; }
#site .s-about p { margin: 0 0 16px; font-size: 17px; line-height: 1.7; color: rgba(231,221,200,0.82); }
#site .s-chips { display: flex; flex-wrap: wrap; gap: 8px; }
#site .s-chip { padding: 8px 12px; border: 1px solid rgba(199,163,106,0.25); border-radius: 999px; font-size: 13px; color: rgba(231,221,200,0.85); }
#site .s-skills { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
#site .s-card { padding: 22px; border: 1px solid rgba(199,163,106,0.18); border-radius: 16px; background: #17130e; }
#site .s-card h3 { margin: 0 0 12px; font-size: 16px; }
#site .s-card ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; font-size: 14px; color: rgba(231,221,200,0.75); }
#site .s-path { display: grid; gap: 0; }
#site .s-stop { display: grid; grid-template-columns: 200px 1fr; gap: 24px; padding: 20px 0; border-bottom: 1px solid rgba(199,163,106,0.1); }
#site .s-stop:last-child { border-bottom: 0; }
#site .s-when { font-size: 13px; color: var(--accent, #d9a05b); padding-top: 3px; }
#site .s-stop h3 { margin: 0 0 6px; font-size: 18px; }
#site .s-stop p { margin: 0; font-size: 15px; line-height: 1.65; color: rgba(231,221,200,0.75); }
#site .s-feature { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 48px; }
#site .s-feature .s-card { display: flex; flex-direction: column; }
#site .s-feature p { margin: 0 0 18px; font-size: 14px; line-height: 1.65; color: rgba(231,221,200,0.75); flex: 1; }
#site .s-meta { display: block; margin-bottom: 10px; font-size: 12px; letter-spacing: 0.08em; color: var(--accent, #d9a05b); }
#site .s-stack { display: block; margin-bottom: 16px; font-size: 12px; color: rgba(231,221,200,0.55); }
#site .s-link { align-self: flex-start; font: 600 14px var(--sans, system-ui); color: var(--accent, #d9a05b); background: none; border: 0; padding: 0; cursor: pointer; }
#site .s-link:hover { text-decoration: underline; }
#site h3.s-sub { margin: 0 0 18px; font-size: 20px; }
#site .s-sites { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
#site .s-site { display: block; border: 1px solid rgba(199,163,106,0.18); border-radius: 16px; overflow: hidden; background: #17130e; transition: border-color .2s, transform .2s; }
#site .s-site:hover { border-color: rgba(217,160,91,0.6); transform: translateY(-2px); }
#site .s-shot { display: block; aspect-ratio: 16 / 10; width: 100%; object-fit: cover; object-position: top; background: #211a11; }
#site .s-ph { display: flex; flex-direction: column; justify-content: center; gap: 8px; aspect-ratio: 16 / 10; padding: 24px; background: radial-gradient(ellipse at 30% 20%, rgba(217,160,91,0.16), transparent 60%), #1c1610; border-bottom: 1px solid rgba(199,163,106,0.14); }
#site .s-ph b { font-size: 24px; line-height: 1.15; color: var(--paper, #e7ddc8); }
#site .s-ph small { font: 13px var(--mono, monospace); color: var(--accent, #d9a05b); }
#site .s-site-body { padding: 16px 18px 18px; }
#site .s-site h4 { margin: 0 0 4px; font-size: 16px; }
#site .s-site span { font-size: 13px; color: rgba(231,221,200,0.6); }
#site .s-contact { display: grid; grid-template-columns: 1.2fr 1fr; gap: 40px; align-items: start; }
#site .s-contact p { margin: 0 0 24px; font-size: 18px; line-height: 1.6; color: rgba(231,221,200,0.8); }
#site .s-links { display: grid; gap: 10px; }
#site .s-links a { display: flex; justify-content: space-between; padding: 14px 18px; border: 1px solid rgba(199,163,106,0.18); border-radius: 12px; font-size: 15px; transition: border-color .2s; }
#site .s-links a:hover { border-color: var(--accent, #d9a05b); }
#site .s-links a i { font-style: normal; color: var(--accent, #d9a05b); }
#site footer { padding: 32px 0 48px; border-top: 1px solid rgba(199,163,106,0.12); font-size: 13px; color: rgba(231,221,200,0.5); }
#site footer .s-wrap { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; }
#site :focus-visible { outline: 2px solid var(--accent, #d9a05b); outline-offset: 3px; }
@media (max-width: 900px) {
  #site .s-skills { grid-template-columns: repeat(2, 1fr); }
  #site .s-feature, #site .s-sites { grid-template-columns: repeat(2, 1fr); }
  #site .s-about, #site .s-contact { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  #site .s-wrap { padding: 0 16px; }
  #site .s-nav { display: none; }
  #site .s-bar .s-wrap { height: 58px; }
  #site .s-hero { padding: 56px 0 48px; }
  #site .s-lead { font-size: 16px; }
  #site section { padding: 52px 0; scroll-margin-top: 58px; }
  #site .s-skills, #site .s-feature, #site .s-sites { grid-template-columns: 1fr; }
  #site .s-stop { grid-template-columns: 1fr; gap: 6px; }
  #site .s-row .s-btn { flex: 1 1 100%; }
}
@media (prefers-reduced-motion: reduce) { #site, #site .s-btn, #site .s-site { transition: none; } }
`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ext = 'target="_blank" rel="noopener"';

function html() {
  const wa = SITE.links.find((l) => l.label === 'WhatsApp');
  const worldOf = (p) => WORLDS.findIndex((w) => w.project === p.key);
  const featured = PROJECTS.filter((p) => worldOf(p) >= 0);
  const sites = PROJECTS.filter((p) => p.url);
  // the path so far: the story's stops between the opening and the closing line
  const path = STORY.filter((s) => s.at !== 'keyboard' && s.at !== 'enter');
  return `
  <header class="s-bar"><div class="s-wrap">
    <a class="s-brand" href="#site" data-top>${esc(SITE.name)}</a>
    <nav class="s-nav" aria-label="Sections"><a href="#s-about" data-jump>About</a><a href="#s-skills" data-jump>Skills</a><a href="#s-work" data-jump>Work</a><a href="#s-contact" data-jump>Contact</a></nav>
    <button type="button" class="s-3d" data-close>Explore the 3D desk</button>
  </div></header>
  <main>
    <div class="s-hero"><div class="s-wrap">
      <span class="s-eyebrow s-mono">${esc(SITE.role)}</span>
      <h1>${SITE.headline.map(esc).join('<br>')}</h1>
      <p class="s-lead">ERP systems in Go and Next.js, and websites for Indonesian businesses.</p>
      <div class="s-row">
        <a class="s-btn fill" href="#s-work" data-jump>See my work</a>
        ${wa ? `<a class="s-btn" href="${esc(wa.href)}" ${ext}>WhatsApp me</a>` : ''}
      </div>
      <div class="s-stats s-mono">${SITE.screen.map((l) => `<span>${esc(l)}</span>`).join('')}</div>
    </div></div>
    <section id="s-about"><div class="s-wrap">
      <span class="s-eyebrow s-mono">about</span><h2>Who I am</h2>
      <div class="s-about">
        <div><p>${esc(SITE.about)}</p><p>Currently ${esc(SITE.currently)}</p></div>
        <div class="s-chips">${SITE.facts.map((f) => `<span class="s-chip">${esc(f)}</span>`).join('')}</div>
      </div>
    </div></section>
    <section id="s-skills"><div class="s-wrap">
      <span class="s-eyebrow s-mono">skills</span><h2>What I work with</h2>
      <div class="s-skills">${SITE.skills.map((g) => `<div class="s-card"><h3>${esc(g.group)}</h3><ul>${g.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>
    </div></section>
    <section id="s-path"><div class="s-wrap">
      <span class="s-eyebrow s-mono">the path so far</span><h2>Experience</h2>
      <div class="s-path">${path.map((s) => `<div class="s-stop"><span class="s-when s-mono">${esc(s.when)}</span><div><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></div></div>`).join('')}</div>
    </div></section>
    <section id="s-work"><div class="s-wrap">
      <span class="s-eyebrow s-mono">work</span><h2>Selected projects</h2>
      <div class="s-feature">${featured.map((p) => `<div class="s-card"><span class="s-meta s-mono">${esc(p.date)} · ${esc(p.industry)}</span><h3>${esc(p.title)}</h3><span class="s-stack s-mono">${esc(p.stack)}</span><p>${esc(p.description)}</p><button type="button" class="s-link" data-world="${worldOf(p)}">Explore it in 3D →</button></div>`).join('')}</div>
      <h3 class="s-sub">Live client websites</h3>
      <div class="s-sites">${sites.map((p) => `<a class="s-site" href="${esc(p.url)}" ${ext}>${GALLERY[p.key] || SHOTS.includes(p.key)
        ? `<img class="s-shot" src="${GALLERY[p.key] ? `shots/gallery/${p.key}-1.webp` : `shots/${p.key}.webp`}" alt="${esc(p.title)} website" loading="lazy" decoding="async">`
        : `<span class="s-ph" aria-hidden="true"><b>${esc(p.title)}</b><small>${esc(new URL(p.url).hostname.replace(/^www\./, ''))}</small></span>`}
        <div class="s-site-body"><h4>${esc(p.title)}</h4><span>${esc(p.industry)} · ${esc(p.stack)}</span></div></a>`).join('')}</div>
    </div></section>
    <section id="s-contact"><div class="s-wrap">
      <span class="s-eyebrow s-mono">contact</span><h2>Say hello</h2>
      <div class="s-contact">
        <div><p>Have a project in mind? WhatsApp is the fastest way to reach me.</p>${wa ? `<a class="s-btn fill" href="${esc(wa.href)}" ${ext}>Chat on WhatsApp</a>` : ''}</div>
        <div class="s-links">${SITE.links.map((l) => `<a href="${esc(l.href)}" ${ext}>${esc(l.label)}<i>↗</i></a>`).join('')}</div>
      </div>
    </div></section>
  </main>
  <footer><div class="s-wrap"><span>© ${esc(SITE.year)} ${esc(SITE.name)}</span><button type="button" class="s-3d" data-close>Explore the 3D desk</button></div></footer>`;
}

let el = null, xp = null, lastFocus = null;

function build() {
  if (el) return el;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  el = document.createElement('div'); el.id = 'site'; el.tabIndex = -1; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', `${SITE.name}, portfolio`);
  el.inert = true; el.setAttribute('aria-hidden', 'true'); el.innerHTML = html(); document.body.appendChild(el);
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-close],[data-jump],[data-top],[data-world]'); if (!t) return;
    if (t.hasAttribute('data-close')) { e.preventDefault(); closeSite(); return; }
    if (t.hasAttribute('data-top')) { e.preventDefault(); el.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (t.hasAttribute('data-jump')) { e.preventDefault(); el.querySelector(t.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' }); return; }
    // into that project's world: the page goes away and the desk takes the visitor there (only once past the gate)
    const wi = Number(t.dataset.world); closeSite();
    const st0 = document.body.dataset.state;
    if (xp && wi >= 0 && st0 !== 'loading' && st0 !== 'gate' && st0 !== 'entering') xp.enterWorldVia(wi, WORLDS[wi].trigger);
  });
  // while the page is up the desk hears no keys (Esc closes the page; arrows, space and Tab scroll and move through it as usual)
  window.addEventListener('keydown', (e) => {
    if (!isSiteOpen()) return;
    e.stopImmediatePropagation();
    if (e.key === 'Escape') { e.preventDefault(); closeSite(); }
  }, true);
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
  el.inert = false; el.setAttribute('aria-hidden', 'false'); el.classList.add('open'); el.scrollTop = 0;
  setRoute('site');
  el.focus({ preventScroll: true });   // the page itself takes the focus: Tab moves on from there, and no ring shows on a click
}
export function closeSite(fromHistory = false) {
  if (!isSiteOpen()) return;
  el.classList.remove('open'); el.inert = true; el.setAttribute('aria-hidden', 'true');
  if (!fromHistory && location.hash === '#site') setRoute('');
  if (lastFocus?.focus) try { lastFocus.focus({ preventScroll: true }); } catch {}
}
