// navygibran.dev page script (inlined into every page by scripts/site.js). Everything here is an enhancement: without it the page
// reads the same. No libraries, no WebGL.
//   · a gentle inertial scroll for the mouse wheel (touch and keyboard stay native), anchors and "back to top" glide with it
//   · scenes: each one gets a progress value every frame it is near the screen and turns it into CSS custom properties
//   · reveals, word-by-word rises, staggered lists, loops of names that run faster (and turn) with the scroll
//   · the intro, the menu, the curtain between pages, the pointer ring, magnetic buttons
(() => {
  const root = document.documentElement;
  // a link shared before the split (navygibran.dev/#project-x, /#note) belongs to the 3D desk: a project goes to its page here,
  // anything else the desk knows goes to the desk
  const DESK = __DESK_TARGETS__, PROJECTS = __PROJECTS__, INDEX = __INDEX__;
  // the page's language: its path prefix ('' for Indonesian, '/en', '/zh') and the few words this script says itself
  const PFX = __PREFIX__, LANG = __LANG__, JT = __JS_T__;
  const jt = (k, vars) => String(JT[k] ?? k).replace(/\{(\w+)\}/g, (m, v) => (vars && v in vars ? vars[v] : m));
  // the language switch remembers the choice (the default pages forward to it on arrival)
  document.querySelectorAll('.lang a[data-lang]').forEach((a) => a.addEventListener('click', () => { try { localStorage.setItem('nv-lang', a.dataset.lang); } catch {} }));
  // the reading of the home (Full or Simple), chosen at the intro's gate or in the header, remembered the same way
  document.querySelectorAll('.view a[data-view]').forEach((a) => a.addEventListener('click', () => { if (a.dataset.view === 'desk') return; try { localStorage.setItem('nv-view', a.dataset.view); } catch {} }));
  const h0 = location.hash.slice(1);
  if (h0 && location.pathname === '/' && !document.getElementById(h0)) {
    const m = h0.match(/^project-(.+)$/);
    if (m && PROJECTS.includes(m[1])) { location.replace(`/work/${m[1]}/`); return; }
    if (h0 === 'site') { history.replaceState(null, '', '/'); }
    else if (m || /^scene-/.test(h0) || DESK.includes(h0)) { location.replace(`/3d/#${h0}`); return; }
  }

  // analytics-ready: events go to whatever is listening (a dataLayer, Vercel Analytics), and nowhere if nothing is
  const track = (name, data = {}) => {
    try { (window.dataLayer = window.dataLayer || []).push({ event: name, ...data }); window.va?.('event', { name, data }); } catch {}
  };
  window.nvTrack = track;
  const project = document.body.dataset.project;
  track(project ? 'project_view' : 'portfolio_view', project ? { project } : { path: location.pathname });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-track]'); if (!a) return;
    const { track: name, ...rest } = a.dataset; track(name, rest);
  });

  // ---------- big screens: the whole page is zoomed by k (set before the first paint by the head script)
  let zk = Number(root.style.getPropertyValue('--k')) || 1;
  const setScale = (k) => {
    zk = k;
    if (k > 1.02) { root.style.setProperty('--k', k.toFixed(4)); root.style.zoom = k.toFixed(4); }
    else { root.style.removeProperty('--k'); root.style.zoom = ''; zk = 1; }
  };
  if (zk > 1) {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:calc(50vh / var(--k, 1));visibility:hidden;pointer-events:none';
    document.body.append(probe);
    const ok = Math.abs(probe.getBoundingClientRect().height - innerHeight / 2) < innerHeight * 0.02;
    probe.remove();
    if (!ok) setScale(1);
  }
  const wantScale = () => Math.max(1, Math.min(innerWidth / 1600, innerHeight / 900));

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('motion-off');
  let interacted = false;
  for (const t of ['scroll', 'wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(t, () => { interacted = true; }, { passive: true, once: true, capture: true });
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  // framed in the 3D desk's sheet (app/simplesite): links to the desk are messages to it, not navigations (the class is set in <head>)
  const inDesk = root.classList.contains('in-desk');
  const toDesk = (hash) => { try { parent.postMessage({ nv: 'desk', hash: hash || '' }, location.origin); } catch {} };
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  let vh = innerHeight;
  addEventListener('resize', () => {
    vh = innerHeight; dirty = true;
    if (root.style.getPropertyValue('--k') || wantScale() > 1.02) { const k = wantScale(); if (Math.abs(k - zk) > 0.01) setScale(k); }
  });

  // ---------- the curtain between pages: arriving, it lifts away; leaving for another page of this site, it comes up first
  const curtain = document.querySelector('.curtain');
  const lift = () => { if (!root.classList.contains('curtain-on')) return; requestAnimationFrame(() => { curtain.classList.add('out'); root.classList.remove('curtain-on'); }); };
  lift();
  curtain?.addEventListener('transitionend', (e) => { if (e.target === curtain && e.propertyName === 'transform' && curtain.classList.contains('out')) curtain.classList.remove('out'); });
  addEventListener('pageshow', (e) => { if (e.persisted) { curtain.classList.remove('in'); curtain.classList.add('out'); } });
  // a browser with cross-document view transitions (Chrome 126+) morphs the clicked picture into the project page's own instead of
  // raising the curtain: the picture gets its transition name at the click, the project page's hero picture always has it
  const vt = !reduce && 'PageRevealEvent' in window && typeof CSS !== 'undefined' && CSS.supports('view-transition-name', 'x');
  addEventListener('pagereveal', (e) => {
    if (!e.viewTransition) return;
    root.classList.add('vt-in');
    document.querySelector('.p-hero [data-reveal]')?.classList.add('in');   // (the hero arrives morphed, not clipped open)
    e.viewTransition.finished.then(() => root.classList.remove('vt-in'));
  });
  const leaveTo = (href, bg, name, carry = true, pic = null) => {
    if (inDesk) { const u = new URL(href, location.href); if (u.pathname.startsWith('/3d')) { toDesk(u.hash); return; } }
    if (reduce) { location.href = href; return; }
    if (vt && pic) { pic.style.viewTransitionName = 'shot'; location.href = href; return; }
    if (carry) try { sessionStorage.setItem('nv-curtain', bg || '1'); if (name) sessionStorage.setItem('nv-curtain-name', name); else sessionStorage.removeItem('nv-curtain-name'); } catch {}
    const ct = curtain.querySelector('.curtain-t'); if (ct) ct.textContent = name || '';
    // a project link sends the curtain up in that project's colour; anything else in cream
    root.style.removeProperty('--curtain'); root.classList.remove('curtain-tint');
    curtain.style.background = bg || ''; curtain.classList.toggle('tint', !!bg);
    curtain.classList.remove('out'); curtain.classList.add('in');
    setTimeout(() => { location.href = href; }, 640);
  };

  // in the desk's sheet, Esc with nothing of the page's own open (the menu, the palette, a lightbox) hands the key on: the sheet closes
  if (inDesk) addEventListener('keydown', (e) => { if (e.key === 'Escape' && !document.body.classList.contains('menu-open') && !document.querySelector('dialog[open], .lb.open, .lb[open]')) toDesk(''); }, true);

  // ---------- inertial wheel scrolling (mouse only); everything else moves the page natively and the glide follows it
  const smooth = fine && !reduce;
  let target = scrollY, current = scrollY, gliding = false, lastT = 0, locked = false;
  const maxY = () => document.documentElement.scrollHeight - innerHeight;
  const glide = (now) => {
    const dt = Math.min(64, now - lastT || 16); lastT = now;
    current += (target - current) * (1 - Math.exp(-dt / 105));
    if (Math.abs(target - current) < 0.5) { current = target; gliding = false; }
    window.scrollTo(0, current);
    if (gliding) requestAnimationFrame(glide);
  };
  const startGlide = () => { if (!gliding) { gliding = true; lastT = performance.now(); requestAnimationFrame(glide); } };
  const scrollToY = (y) => {
    y = clamp(y, 0, maxY());
    if (!smooth) { window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); return; }
    current = scrollY; target = y; startGlide();
  };
  if (smooth) {
    addEventListener('wheel', (e) => {
      if (e.ctrlKey || locked || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      const d = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1);
      if (!gliding) current = scrollY;
      target = clamp(target + d, 0, maxY());
      startGlide();
    }, { passive: false });
    addEventListener('scroll', () => { if (!gliding) target = current = scrollY; }, { passive: true });
  }

  // anchors on this page glide to their place; links to another page of the site go through the curtain
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && !url.hash && a.classList.contains('brand')) { e.preventDefault(); if (menuOpen) setMenu(false); scrollToY(0); return; }
    if (url.pathname === location.pathname && url.hash) {
      const id = decodeURIComponent(url.hash.slice(1)), el = id === 'top' ? null : document.getElementById(id);
      if (id !== 'top' && !el) return;
      e.preventDefault();
      if (menuOpen) setMenu(false);
      const y = el ? el.getBoundingClientRect().top + scrollY - (id === 'main' ? 0 : 20) : 0;
      scrollToY(y);
      if (el && id === 'main') el.focus?.({ preventScroll: true });
      history.replaceState(null, '', id === 'top' ? location.pathname : url.hash);
      return;
    }
    if (url.pathname.startsWith('/3d')) { e.preventDefault(); leaveTo(url.href, '#0a0806', 'The 3D desk', false); return; }   // (its own loader takes over)
    if (url.pathname !== location.pathname) { e.preventDefault(); leaveTo(url.href, a.dataset.bg, a.dataset.name, true, a.dataset.project ? a.querySelector('.case-big > img, .more-pic img, .arc-pic img, .ix-thumb img') : null); }
  });

  // ---------- the intro: posters of the work, the mark, the name in outline then filled, a count while the fonts arrive
  const intro = document.getElementById('intro');
  if (intro && root.classList.contains('intro-on')) {
    locked = true;
    const count = intro.querySelector('.intro-count');
    const t0 = performance.now(), MIN = 2750, MAX = 4300;
    let fontsReady = false, done = false;
    (document.fonts?.ready || Promise.resolve()).then(() => { fontsReady = true; });
    const finish = () => {
      if (done) return; done = true;
      count.textContent = '100';
      root.classList.add('intro-out');
      try { sessionStorage.setItem('nv-intro', '1'); } catch {}
      setTimeout(() => { root.classList.remove('intro-on', 'intro-out', 'intro-choose'); intro.remove(); locked = false; dirty = true; }, 1500);
    };
    // the gate: once the name has played, two doors (this page, Simple, or the story at /full/) until a reading has been chosen once;
    // the choice is remembered (nv-view), the header's switch changes it. Skip, Escape and a click outside the doors mean Simple.
    const gate = intro.querySelector('.intro-gate');
    let chosen = null; try { chosen = localStorage.getItem('nv-view'); } catch {}
    let choosing = false;
    const choose = () => {
      if (done || !gate || chosen) return finish();
      choosing = true; gate.hidden = false; count.textContent = '100';
      requestAnimationFrame(() => root.classList.add('intro-choose'));
      setTimeout(() => { if (!done) gate.querySelector('[data-view="simple"]')?.focus({ preventScroll: true }); }, 700);
    };
    const pick = (view, href) => {
      if (done) return;
      try { localStorage.setItem('nv-view', view); } catch {}
      track('gate_pick', { view });
      if (view === 'simple' || !href) { finish(); return; }
      // the story: the doors fade, the intro stays black, the next page opens under the curtain
      done = true;
      try { sessionStorage.setItem('nv-intro', '1'); sessionStorage.setItem('nv-curtain', '1'); } catch {}
      root.classList.add('intro-leave');
      setTimeout(() => { location.href = href; }, 520);
    };
    gate?.querySelectorAll('.intro-door').forEach((d) => d.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); pick(d.dataset.view, d.getAttribute('href')); }));
    gate?.querySelector('.intro-gate-hint a')?.addEventListener('click', (e) => e.stopPropagation());
    const tick = (now) => {
      if (done) return;
      const t = now - t0, p = Math.min(1, t / MIN);
      count.textContent = String(Math.round(ease(p) * (fontsReady ? 100 : 94))).padStart(2, '0');
      if ((p >= 1 && fontsReady) || t > MAX) { setTimeout(choose, 160); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    intro.addEventListener('click', (e) => { if (choosing && e.target.closest('.intro-doors')) return; if (choosing) pick('simple'); else finish(); });
    addEventListener('keydown', (e) => { if (done) return; if (e.key === 'Escape') { choosing ? pick('simple') : finish(); return; } if (!choosing && (e.key === 'Enter' || e.key === ' ')) finish(); });
  }

  // ---------- header: folds to the mark and a round button once the page moves, slips away reading down, back on the way up
  const head = document.querySelector('.head');
  const btn = document.querySelector('.menu-btn'), menu = document.getElementById('menu');
  let menuOpen = false, keyboard = false;
  addEventListener('keydown', (e) => { if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') keyboard = true; }, true);
  addEventListener('pointerdown', () => { keyboard = false; }, true);
  const setMenu = (open) => {
    menuOpen = open; locked = open;
    btn.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('open', open); menu.setAttribute('aria-hidden', String(!open)); menu.inert = !open;
    document.body.classList.toggle('menu-open', open);
    document.querySelectorAll('main, footer, .side-3d').forEach((el) => { el.inert = open; });
    if (open) {
      head.classList.remove('away');
      // (the section the reader is in: of those begun above the middle of the screen, the one that began last; the menu's order is not the page's)
      let here = null, best = -Infinity;
      for (const a of menu.querySelectorAll('.menu-links a[href*="/full/#"]')) { const s = location.pathname === `${PFX}/full/` && document.getElementById(a.getAttribute('href').split('#')[1]), top = s ? s.getBoundingClientRect().top : Infinity; if (top < innerHeight * 0.45 && top > best) { best = top; here = a; } }
      menu.querySelectorAll('.menu-links a').forEach((a) => a.classList.toggle('here', a === here));
      setTimeout(() => (keyboard ? menu.querySelector('a') : menu)?.focus({ preventScroll: true }), 350);
    }
  };
  if (menu) { menu.inert = true; menu.tabIndex = -1; menu.style.outline = 'none'; btn?.addEventListener('click', () => setMenu(!menuOpen)); }
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); btn.focus(); } });

  // ---------- reveals: once, as each thing first comes into view
  const showAll = (sel) => document.querySelectorAll(sel).forEach((el) => el.classList.add('in'));
  document.querySelectorAll('[data-stagger]').forEach((el) => [...el.children].forEach((c, i) => { if (!c.style.getPropertyValue('--i')) c.style.setProperty('--i', i); }));
  if (!('IntersectionObserver' in window) || reduce) showAll('[data-reveal], [data-split], [data-stagger]');
  else {
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -9% 0px', threshold: 0.01 });
    document.querySelectorAll('[data-reveal], [data-split], [data-stagger]').forEach((el) => io.observe(el));
  }

  // ---------- pictures arrive softly: each lazy one fades in once it has loaded (its frame's colour holds the place till then)
  document.querySelectorAll('img.lz').forEach((im) => {
    const done = () => im.classList.add('ld');
    if (im.complete && im.naturalWidth) done();
    else { im.addEventListener('load', done, { once: true }); im.addEventListener('error', done, { once: true }); }
  });

  // ---------- scenes: a function per scene, called with its progress every frame it is near the screen
  //   pass: 0 when its top reaches the bottom of the screen, 1 when its bottom leaves the top
  //   pin:  0 when it reaches the top, 1 when its end reaches the bottom (the sticky part holds still in between)
  const scenes = [];
  const scene = (sel, fn, mode = 'pass') => document.querySelectorAll(sel).forEach((el) => scenes.push({ el, fn, mode, near: true }));
  const set = (el, k, v) => el.style.setProperty(k, typeof v === 'number' ? v.toFixed(4) : v);

  scene('[data-scene="hero"]', (p, r, el) => set(el, '--q', clamp(-r.top / Math.max(1, r.height))));

  // manifesto: three statements and the answer, each with its own stretch of the scroll
  const maniSlides = [...document.querySelectorAll('.mani [data-slide]')];
  const spans = [[-0.24, 0.27], [0.25, 0.5], [0.48, 0.73], [0.71, 1.04]];
  scene('[data-scene="mani"]', (p, r, el, raw) => {
    set(el, '--p', p);
    maniSlides.forEach((s, i) => {
      const [a, b] = spans[i] || [0, 1], t = clamp(((i === 0 ? raw : p) - a) / (b - a)), last = i === maniSlides.length - 1;
      const o = last ? Math.min(1, t * 5) : Math.min(1, t * 5, (1 - t) * 5);
      set(s, '--t', t); set(s, '--o', o);
      s.classList.toggle('on', last ? t > 0.05 : t > 0.05 && t < 0.92);
    });
  }, 'pin');

  // the page turns cream as the definition arrives; the brackets close in from either side
  scene('[data-scene="cream"]', (p, r, el) => set(el, '--c', ease(clamp((vh - r.top) / (vh * 0.72)))));
  // project pages: the main picture and its phone at two speeds, gallery pictures drifting inside their frames
  scene('[data-scene="phero"]', (p, r, el) => set(el, '--ph', p));
  document.querySelectorAll('.gallery .shot').forEach((el) => scenes.push({ el, mode: 'pass', near: true, fn: (p) => set(el, '--gp', p - 0.5) }));
  scene('[data-scene="defn"]', (p, r, el) => set(el, '--b', ease(clamp((vh * 0.95 - r.top) / (vh * 0.8)))));

  // the giant letters: the window zooms out, the question gathers, then the promise
  scene('[data-scene="maskq"]', (p, r, el) => {
    set(el, '--sh', ease(clamp((vh - r.top) / (vh * 0.72))));
    set(el, '--a', ease(clamp(p / 0.48)));
    set(el, '--d', ease(clamp((p - 0.52) / 0.3)));
    set(el, '--pr', ease(clamp((p - 0.62) / 0.26)));
  }, 'pin');

  // the work: each panel opens its picture as it arrives and darkens as the next one covers it; the rail follows
  const cases = [...document.querySelectorAll('.case')];
  const rail = document.querySelector('.rail'), railItems = rail ? [...rail.children] : [];
  scene('[data-scene="work"]', (p, r) => {
    const rs = cases.map((c) => c.getBoundingClientRect());
    let act = 0;
    cases.forEach((c, i) => {
      const cr = rs[i], nx = rs[i + 1];
      set(c, '--e', ease(clamp((vh - cr.top) / (vh * 0.85))));
      set(c, '--cover', nx ? clamp((vh - nx.top) / vh) : 0);
      if (cr.top <= vh * 0.5) act = i;
    });
    railItems.forEach((li, i) => li.classList.toggle('act', i === act));
    rail?.classList.toggle('on', r.top < vh * 0.3 && r.bottom > vh * 0.7);
  });

  // the path: the line fills as the list passes the middle of the screen, each stop lights when it is reached
  const stops = [...document.querySelectorAll('.path-list li')];
  scene('[data-scene="path"]', () => {
    const list = document.querySelector('.path-list'); if (!list) return;
    const lr = list.getBoundingClientRect(), tops = stops.map((s) => s.getBoundingClientRect().top);
    set(list, '--pl', clamp((vh * 0.6 - lr.top) / lr.height));
    stops.forEach((s, i) => s.classList.toggle('lit', tops[i] < vh * 0.6));
  });

  // the teaser picture drifts; contact grows into place; the footer name fills from the left
  scene('[data-scene="teaser"]', (p, r, el, raw) => {
    set(el, '--sh', ease(clamp((vh - r.top) / (vh * 0.72))));
    set(el, '--g', ease(clamp((raw + 0.06) / 0.56)));
    const hh = ease(clamp((p - 0.58) / 0.3));
    set(el, '--h', hh);
    el.classList.toggle('live', hh > 0.4);
    if (!reduce) el.querySelectorAll('[data-count]').forEach((c) => { if (hh < 0.05) arm(c); else if (hh > 0.4) countUp(c); });
  }, 'pin');

  // the introduction reads along: each word lights as the paragraph passes the middle of the screen
  const readers = [...document.querySelectorAll('[data-read]')].map((el) => ({ el, w: [...el.querySelectorAll('.wd')], lit: -1 }));
  readers.forEach((rd) => scenes.push({ el: rd.el, mode: 'pass', near: true, fn: (p, r) => {
    const n = Math.round(clamp((vh * 0.82 - r.top) / (r.height * 0.95 + vh * 0.18)) * rd.w.length);
    if (n !== rd.lit) { rd.w.forEach((w, i) => w.classList.toggle('lit', i < n)); rd.lit = n; }
  } }));
  // project pages: the next project slides into place; on touch screens its colour rises behind it (hover does that with a mouse)
  if (!reduce) scene('[data-scene="pnext"]', (p, r, el) => {
    const a = el.querySelector('a'); if (!a) return;
    const top = a.getBoundingClientRect().top;
    set(el, '--nt', ease(clamp((vh * 0.98 - top) / (vh * 0.55))));
    if (!fine) set(el, '--nf', ease(clamp((vh * 0.82 - top) / (vh * 0.45))));
  });
  scene('[data-scene="contact"]', (p, r, el) => set(el.querySelector('.contact-title'), '--cg', ease(clamp((vh - r.top) / (vh * 0.7)))));
  // (at the very end of the page the name is always complete, even on a page too short to scroll it full)
  scene('[data-scene="foot"]', (p, r, el) => set(el, '--f', scrollY + vh >= document.documentElement.scrollHeight - 4 ? 1 : ease(clamp((vh - r.top) / Math.min(vh, r.height)))));

  // only scenes near the screen do any work
  if ('IntersectionObserver' in window) {
    // a scene that comes near (or leaves) is recomputed on the next frame, even when the page has not moved since: after a jump
    // (a hash link, the End key, a reload half way down) the scene must not wait for the next scroll to catch up
    const near = new IntersectionObserver((es) => es.forEach((en) => scenes.forEach((s) => { if (s.el === en.target && s.near !== en.isIntersecting) { s.near = en.isIntersecting; dirty = true; } })), { rootMargin: '60% 0px 60% 0px' });
    scenes.forEach((s) => near.observe(s.el));
  }

  // ---------- loops of names and logos: a steady drift that speeds up with the scroll and turns with its direction
  const loops = reduce ? [] : [...document.querySelectorAll('.mq')].map((el) => ({ el, tracks: [...el.querySelectorAll('.mq-t')], dir: Number(el.dataset.mq) || 1, speed: Number(el.dataset.speed) || 40, x: 0, w: 0, hover: false, near: true, lean: !!el.closest('.bigq') }));
  loops.forEach((l) => {
    l.el.addEventListener('mouseenter', () => { l.hover = true; });
    l.el.addEventListener('mouseleave', () => { l.hover = false; });
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { l.near = es[0].isIntersecting; }, { rootMargin: '20% 0px' }).observe(l.el);
  });
  const measure = () => loops.forEach((l) => { l.w = l.tracks[0]?.offsetWidth || 0; });
  measure(); addEventListener('resize', measure); addEventListener('load', measure);
  document.fonts?.ready.then(measure);

  // ---------- one frame loop for everything that follows the scroll
  let lastY = -1, dirty = true, vel = 0, flow = 1, prevT = performance.now();
  const bar = document.querySelector('meta[name="theme-color"]'), barBase = bar?.content || '#0e0c09';
  let barNow = barBase;
  const paintBar = () => {
    if (!bar) return;
    const el = document.elementFromPoint(innerWidth / 2, 2);
    const sec = el?.closest?.('.cream, .case, .menu');
    const c = !sec || sec.classList.contains('menu') ? barBase : sec.classList.contains('cream') ? '#ebe3d2' : getComputedStyle(sec).getPropertyValue('--bgc').trim() || barBase;
    if (c !== barNow) { barNow = c; bar.content = c; }
  };
  const depth = new Set();
  // the header names the part of the page being read: the last part begun above 40% of the screen (none above the first,
  // none once the last has ended); a new name rolls up into place, a name after none simply appears
  const secEls = [...document.querySelectorAll('[data-sec]')], secBox = document.querySelector('.head-sec'), secIn = secBox?.firstElementChild;
  let secNow = null, secT = 0;
  const paintSec = () => {
    if (!secEls.length || !secIn) return;
    let at = null;
    for (const s of secEls) { if (s.getBoundingClientRect().top < vh * 0.4) at = s; else break; }
    const label = !at || (at === secEls[secEls.length - 1] && at.getBoundingClientRect().bottom < vh * 0.4) ? '' : at.dataset.sec;
    if (label === secNow) return;
    const prev = secNow; secNow = label;
    secBox.classList.toggle('on', !!label);
    clearTimeout(secT);
    if (!label) return;
    if (!prev || reduce) { secIn.classList.remove('out', 'pre'); secIn.textContent = label; return; }
    secIn.classList.add('out');
    secT = setTimeout(() => { secIn.textContent = label; secIn.classList.remove('out'); secIn.classList.add('pre'); void secIn.offsetWidth; secIn.classList.remove('pre'); }, 230);
  };
  const smallScreen = matchMedia('(max-width: 900px)');
  const frame = (now) => {
    const dt = Math.min(64, now - prevT) / 1000; prevT = now;
    const y = scrollY;
    const dy = lastY < 0 ? 0 : y - lastY;
    vel += (dy - vel) * 0.18;
    if (Math.abs(dy) > 0.5) flow += ((dy > 0 ? 1 : -1) - flow) * 0.08;
    if (y !== lastY || dirty) {
      lastY = y; dirty = false;
      head?.classList.toggle('compact', y > 60);
      paintBar(); paintSec();
      const sp = clamp(y / Math.max(1, document.documentElement.scrollHeight - vh));
      root.style.setProperty('--sp', sp.toFixed(4));
      for (const mark of [25, 50, 75, 100]) if (sp * 100 >= mark - 0.5 && !depth.has(mark)) { depth.add(mark); track('scroll_depth', { pct: mark, path: location.pathname }); }
      if (!menuOpen && head) {
        if (y > 700 && dy > 3) head.classList.add('away');
        else if (dy < -3 || y < 700) head.classList.remove('away');
      }
      // on a small screen the round "3D" button slips away while reading down, like the header (it sits over the text)
      if (smallScreen.matches) {
        if (y > 600 && dy > 3) document.body.classList.add('tab-away');
        else if (dy < -3 || y < 600) document.body.classList.remove('tab-away');
      }
      for (const s of scenes) {
        if (!s.near || reduce) continue;
        const r = s.el.getBoundingClientRect();
        const raw = s.mode === 'pin' ? -r.top / Math.max(1, r.height - vh) : (vh - r.top) / (r.height + vh);
        s.fn(clamp(raw), r, s.el, raw);
      }
    }
    const boost = 1 + Math.min(7, Math.abs(vel) * 0.35);
    for (const l of loops) {
      if (!l.near || !l.w) continue;
      const v = l.hover ? 0 : l.speed * boost * l.dir * flow;
      l.x -= v * dt;
      if (l.x <= -l.w) l.x += l.w; else if (l.x > 0) l.x -= l.w;
      const sk = l.lean ? ` skewX(${clamp(-vel * 0.28, -12, 12).toFixed(2)}deg)` : '';
      for (const t of l.tracks) t.style.transform = `translate3d(${l.x.toFixed(2)}px,0,0)${sk}`;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // ---------- the index: a screenshot follows the pointer over a row (mouse only)
  const prev = document.querySelector('.ix-preview');
  if (prev && fine) {
    const pimg = prev.querySelector('img');
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0, on = false;
    const loop = () => { x += (tx - x) * 0.16; y += (ty - y) * 0.16; prev.style.transform = `translate3d(${(x / zk - 180).toFixed(1)}px, ${(y / zk - 90).toFixed(1)}px, 0) rotate(${((tx - x) * 0.03).toFixed(2)}deg)`; raf = on || Math.abs(tx - x) > 0.5 ? requestAnimationFrame(loop) : 0; };
    document.querySelector('.index-list')?.addEventListener('mouseenter', () => document.querySelectorAll('a[data-preview]').forEach((a) => { const im = new Image(); im.src = a.dataset.preview; }), { once: true });
    document.querySelectorAll('a[data-preview]').forEach((a) => {
      a.addEventListener('mouseenter', (e) => { pimg.src = a.dataset.preview; if (!on) { x = tx = e.clientX + 220; y = ty = e.clientY; } on = true; prev.classList.add('on'); if (!raf) raf = requestAnimationFrame(loop); });
      a.addEventListener('mousemove', (e) => { tx = e.clientX + 230; ty = e.clientY; });
      a.addEventListener('mouseleave', () => { on = false; prev.classList.remove('on'); });
    });
  }

  // ---------- the menu: each link shows a picture of where it leads, in the panel beside the list
  // (left alone, the panel leafs through them on its own, one every few seconds; a pointer on a link holds that link's picture)
  const pvBox = menu?.querySelector('.menu-pv');
  if (pvBox) {
    const pics = [...pvBox.querySelectorAll('img')], cap = pvBox.querySelector('.menu-pv-cap'), links = [...menu.querySelectorAll('.menu-links a')];
    let held = null, timer = 0, idx = -1;
    const show = (a) => {
      const k = a?.dataset.pv;
      pics.forEach((im) => im.classList.toggle('on', k != null && im.dataset.k === k));
      pvBox.classList.toggle('has', k != null);
      if (cap && a) { cap.firstElementChild.textContent = a.querySelector('.mn')?.textContent || ''; cap.lastElementChild.textContent = a.querySelector('.sr')?.textContent || ''; }
    };
    const step = () => { if (held) return; idx = (idx + 1) % links.length; show(links[idx]); };
    links.forEach((a) => {
      const hold = () => { held = a; idx = links.indexOf(a); show(a); };
      a.addEventListener('mouseenter', hold); a.addEventListener('focus', hold);
      a.addEventListener('blur', () => { if (held === a) held = null; });
    });
    menu.querySelector('.menu-links')?.addEventListener('mouseleave', () => { held = null; });
    // the leafing runs while the menu is open and the panel is on screen (a phone has no panel); with motion reduced it shows one
    new MutationObserver(() => {
      clearInterval(timer);
      if (!menu.classList.contains('open')) { held = null; show(null); return; }
      if (!pvBox.clientWidth) return;
      idx = -1; step();
      if (!reduce) timer = setInterval(step, 3000);
    }).observe(menu, { attributes: true, attributeFilter: ['class'] });
  }
  // the big mark behind the menu leans away from the pointer
  const menuBg = menu?.querySelector('.menu-bg');
  if (menuBg && fine && !reduce) menu.addEventListener('pointermove', (e) => { const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5; menuBg.style.transform = `translate(${(-x * 28).toFixed(1)}px, ${(-y * 18).toFixed(1)}px)`; });

  // ---------- the hero picture drifts a little toward the pointer
  const hero = document.querySelector('.hero');
  if (hero && fine && !reduce) {
    let hx = 0, hy = 0, tx = 0, ty = 0, run = false;
    const drift = () => { hx += (tx - hx) * 0.09; hy += (ty - hy) * 0.09; hero.style.setProperty('--mx', hx.toFixed(3)); hero.style.setProperty('--my', hy.toFixed(3)); if (Math.abs(tx - hx) + Math.abs(ty - hy) > 0.002) requestAnimationFrame(drift); else run = false; };
    hero.addEventListener('mousemove', (e) => { const b = hero.getBoundingClientRect(); tx = ((e.clientX - b.left) / b.width) * 2 - 1; ty = ((e.clientY - b.top) / b.height) * 2 - 1; if (!run) { run = true; requestAnimationFrame(drift); } });
  }

  // ---------- over the big rows of names, the pointer leaves a trail of the projects' screenshots (mouse only)
  const trailZone = document.querySelector('.bigq');
  if (trailZone && fine && !reduce) {
    const srcs = [...document.querySelectorAll('.index-list a[data-preview]')].map((a) => a.dataset.preview);
    let pool = null, k = 0, si = 0, lx = -999, ly = -999;
    trailZone.addEventListener('mouseenter', () => {
      if (pool) return;
      srcs.forEach((u) => { const pre = new Image(); pre.src = u; });
      pool = Array.from({ length: 9 }, () => { const im = document.createElement('img'); im.className = 'trail'; im.alt = ''; im.decoding = 'async'; trailZone.append(im); return im; });
    });
    trailZone.addEventListener('mousemove', (e) => {
      if (!pool || !srcs.length) return;
      const b = trailZone.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
      if (Math.hypot(x - lx, y - ly) < 120) return;
      lx = x; ly = y;
      const im = pool[k++ % pool.length];
      im.src = srcs[si++ % srcs.length];
      im.style.left = `${(x / zk).toFixed(1)}px`; im.style.top = `${(y / zk).toFixed(1)}px`; im.style.setProperty('--r', `${(Math.random() * 14 - 7).toFixed(1)}deg`);
      im.classList.remove('go'); void im.offsetWidth; im.classList.add('go');
    });
  }

  // ---------- numbers count up as they come into view. The real number stays in the page (for search engines, screen readers and
  // paper); a counter is set to 0 only just before it scrolls into view, and only once a visitor has scrolled or touched the page
  const counters = [...document.querySelectorAll('[data-count]')];
  const arm = (el) => { if (!interacted || el.dataset.counted || el.dataset.armed) return; el.dataset.armed = '1'; el.textContent = '0'; };
  const settle = (el) => { el.dataset.counted = '1'; el.textContent = el.dataset.count; };
  if (counters.length && 'IntersectionObserver' in window && !reduce) {
    const near = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting && en.boundingClientRect.top > innerHeight) arm(en.target); }), { rootMargin: '0px 0px 30% 0px' });
    const seen = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting && en.target.dataset.armed) { seen.unobserve(en.target); countUp(en.target); } }), { threshold: 0.9 });
    counters.forEach((el) => { if (!el.closest('.teaser')) { near.observe(el); seen.observe(el); } });
  }

  function countUp(el) {
    if (el.dataset.counted || !el.dataset.armed) return; el.dataset.counted = '1';
    const n = Number(el.dataset.count) || 0, t0 = performance.now(), dur = 1300;
    const step = (now) => { if (el.dataset.counted !== '1') return; const p = clamp((now - t0) / dur); el.textContent = String(Math.round(ease(p) * n)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  // ---------- a plate (a project shown without a screenshot) keeps its light where the pointer is (mouse only)
  if (fine && !reduce) document.querySelectorAll('.plate').forEach((pl) => {
    const box = pl.parentElement;
    box.addEventListener('pointermove', (e) => {
      const r = pl.getBoundingClientRect();
      pl.style.setProperty('--px', `${clamp((e.clientX - r.left) / r.width) * 100}%`); pl.style.setProperty('--py', `${clamp((e.clientY - r.top) / r.height) * 100}%`);
    });
    box.addEventListener('pointerleave', () => { pl.style.removeProperty('--px'); pl.style.removeProperty('--py'); });
  });

  // ---------- before printing: every number final, every picture fetched now (lazy ones would print as empty frames)
  addEventListener('beforeprint', () => {
    counters.forEach((el) => { el.dataset.counted = 'print'; el.textContent = el.dataset.count; });
    document.querySelectorAll('img[loading="lazy"]').forEach((im) => { im.loading = 'eager'; });
  });

  // ---------- a project with several pages flips through them while the pointer rests on its picture (mouse only)
  if (fine && !reduce) document.querySelectorAll('.case-big[data-shots]').forEach((box) => {
    let shots; try { shots = JSON.parse(box.dataset.shots); } catch { return; }
    const link = box.closest('.case-in'), layers = [...box.querySelectorAll('.case-alt')], bars = [...box.querySelectorAll('.case-bars i')];
    if (!link || layers.length < 2 || shots.length < 2) return;
    const DUR = 1300;
    let k = 0, front = -1, timer = 0, warm = false;
    const show = (n) => {
      if (n === 0) { layers.forEach((l) => l.classList.remove('on')); front = -1; return; }
      const next = front === 0 ? 1 : 0, L = layers[next];
      L.src = shots[n];
      const reveal = () => {
        if (!box.matches(':hover') && !link.matches(':hover')) return;
        L.style.zIndex = '2'; if (front >= 0) layers[front].style.zIndex = '1';
        L.classList.add('on');
        const old = front; front = next;
        if (old >= 0) setTimeout(() => { if (front !== old) layers[old].classList.remove('on'); }, 650);
      };
      (L.decode ? L.decode() : Promise.resolve()).then(reveal, reveal);
    };
    const paint = () => bars.forEach((b, n) => { b.classList.toggle('done', n < k); b.classList.remove('run'); });
    const run = () => { const b = bars[k]; if (!b) return; b.style.setProperty('--dur', `${DUR}ms`); void b.offsetWidth; b.classList.add('run'); };
    const step = () => { k = (k + 1) % shots.length; show(k); paint(); run(); timer = setTimeout(step, DUR); };
    link.addEventListener('mouseenter', () => {
      if (!warm) { warm = true; shots.forEach((u) => { const im = new Image(); im.src = u; }); }
      clearTimeout(timer); k = 0; paint(); run(); timer = setTimeout(step, DUR);
    });
    link.addEventListener('mouseleave', () => { clearTimeout(timer); k = 0; show(0); bars.forEach((b) => b.classList.remove('done', 'run')); });
  });

  // ---------- the archive's filters: the grid fades, the cards of that kind come back in turn; the choice stays in the address
  // (a page may hold several filtered grids, the Labs page its worlds and its experiments: each section's pills work its own
  // grid, and only the first keeps its choice in the address)
  document.querySelectorAll('.arc-grid').forEach((arcGrid, gi) => {
    const sec = arcGrid.closest('section') || document;
    const pills = [...sec.querySelectorAll('.pill-f')], cards = [...arcGrid.children];
    const bar = sec.querySelector('.arc-filters'), dock = sec.querySelector('.arc-dock'), dockT = dock?.firstElementChild;
    let fadeT = 0;
    const apply = (kind, remember) => {
      pills.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === kind)));
      const show = () => {
        let n = 0;
        cards.forEach((c) => { c.hidden = !(kind === 'all' || c.dataset.kind === kind); if (!c.hidden) n++; });
        arcGrid.classList.add('in'); arcGrid.classList.remove('fading');
        const st = sec.querySelector('[role="status"]'); if (st && remember) st.textContent = jt('filtered', { n, t: cards.length });
      };
      clearTimeout(fadeT);
      if (reduce) show(); else { arcGrid.classList.add('fading'); fadeT = setTimeout(show, 220); }
      if (remember) { if (gi === 0) history.replaceState(null, '', kind === 'all' ? location.pathname : `#${kind}`); track('archive_filter', { kind, group: gi }); }
    };
    pills.forEach((b) => b.addEventListener('click', () => {
      apply(b.dataset.kind, true);
      // (chosen from the dock far down the list: the page glides back up to the filters, so the choice is seen from its first card)
      if (bar && b.closest('.arc-dock')) scrollToY(bar.getBoundingClientRect().top + scrollY - (head?.offsetHeight || 80) - 12);
    }));
    // the dock: in view once the filters have gone off the top, away again near the end of the list (and under the menu)
    if (dock && bar && dockT) {
      dock.hidden = false; dock.inert = true;
      let dockOn = false, q = 0;
      const edges = () => { const m = dockT.scrollWidth - dockT.clientWidth; dockT.style.setProperty('--fl', dockT.scrollLeft > 2 ? '28px' : '0px'); dockT.style.setProperty('--fr', dockT.scrollLeft < m - 2 ? '28px' : '0px'); };
      dockT.addEventListener('scroll', edges, { passive: true });
      const check = () => {
        q = 0;
        const on = !menuOpen && bar.getBoundingClientRect().bottom < 0 && arcGrid.getBoundingClientRect().bottom > innerHeight * 0.55;
        if (on === dockOn) return;
        dockOn = on; dock.classList.toggle('on', on); dock.inert = !on; document.body.classList.toggle('dock-on', on);
        document.documentElement.style.scrollPaddingBottom = on ? '96px' : '';
        const cur = dock.querySelector('[aria-pressed="true"]');
        if (on && cur) dockT.scrollLeft = cur.offsetLeft - (dockT.clientWidth - cur.offsetWidth) / 2;
        edges();
      };
      addEventListener('scroll', () => { if (!q) q = requestAnimationFrame(check); }, { passive: true });
      addEventListener('resize', () => { check(); edges(); });
      check();
    }
    const fromHash = () => { const k = location.hash.slice(1) || 'all'; if (pills.some((b) => b.dataset.kind === k)) apply(k, false); };
    if (gi === 0) { if (location.hash) fromHash(); addEventListener('hashchange', fromHash); }
  });

  // ---------- the rail beside the work: each number goes to its project
  rail?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]'), list = document.querySelector('.cases');
    if (!b || !list || !cases[0]) return;
    scrollToY(list.getBoundingClientRect().top + scrollY + Number(b.dataset.go) * cases[0].getBoundingClientRect().height + 2);
  });

  // ---------- a small notice at the bottom of the screen, read out too
  let toastEl = null, toastT = 0;
  const toast = (msg) => {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.append(toastEl); }
    toastEl.textContent = msg; clearTimeout(toastT);
    requestAnimationFrame(() => toastEl.classList.add('on'));
    toastT = setTimeout(() => toastEl.classList.remove('on'), 2000);
  };
  document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const text = b.dataset.copy; let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {}
    if (!ok) { try { const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0'; document.body.append(ta); ta.select(); ok = document.execCommand('copy'); ta.remove(); } catch {} }
    toast(ok ? (text.includes('@') ? jt('emailCopied') : jt('numberCopied')) : (b.querySelector('.copy-n')?.textContent || text));
    track('contact_click', { channel: 'copy-number' });
  }));

  // ---------- the brief: composed into one tidy WhatsApp message (the form's own submit still works without this)
  // a field left empty says so under itself, in the page's words (without the script the browser's own check stands)
  const briefMark = (el, bad) => {
    const box = el.closest('.field'), msg = box?.querySelector('.field-msg');
    box?.classList.toggle('bad', bad);
    if (bad) { el.setAttribute('aria-invalid', 'true'); if (msg) el.setAttribute('aria-describedby', msg.id); }
    else { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
  };
  const briefReady = (f) => {
    const need = [...f.querySelectorAll('[required]')], bad = need.filter((el) => !el.value.trim());
    need.forEach((el) => briefMark(el, bad.includes(el)));
    bad.forEach((el) => { const box = el.closest('.field'); if (!box) return; box.classList.remove('nudge'); void box.offsetWidth; box.classList.add('nudge'); });
    bad[0]?.focus();
    return !bad.length;
  };
  // the one message, for the preview and for the button alike; what is still missing shows as a gap in the preview
  const briefParts = (f) => { const d = new FormData(f); return { kind: d.get('kind') || '', name: String(d.get('name') || '').trim(), idea: String(d.get('text') || '').trim() }; };
  const briefText = ({ kind, name, idea }) => `${jt('briefHi', { name })}${kind ? ` ${kind}:` : ''} ${idea}`;
  const [briefHiA, briefHiB] = jt('briefHi', { name: '\u0001' }).split('\u0001');
  document.querySelectorAll('form.brief').forEach((f) => {
    f.noValidate = true;
    f.querySelectorAll('[required]').forEach((el) => el.addEventListener('input', () => { if (el.value.trim()) briefMark(el, false); }));
    const pv = f.querySelector('.brief-pv'), msg = pv?.querySelector('.brief-msg');
    if (!pv || !msg) return;
    const gap = () => { const g = document.createElement('span'); g.className = 'gap'; g.textContent = '…'; return g; };
    const paint = () => {
      const p = briefParts(f), any = !!(p.name || p.idea);
      pv.classList.toggle('on', any);
      if (!any) return;
      msg.replaceChildren(briefHiA, p.name || gap(), `${briefHiB}${p.kind ? ` ${p.kind}:` : ''} `, p.idea || gap());
    };
    f.addEventListener('input', paint); f.addEventListener('change', paint);
    paint();
  });
  document.querySelectorAll('form.brief').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!briefReady(f)) return;
    const parts = briefParts(f), kind = parts.kind, msg = briefText(parts);
    const num = (f.getAttribute('action') || '').split('/').pop();
    track('contact_click', { channel: 'brief', kind: kind || '' });
    const waUrl = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`, w = window.open(waUrl, '_blank');
    if (w) { try { w.opener = null; } catch {} } else location.href = waUrl;
    toast(jt('openingWa'));
  }));
  // the same brief by email: the mail app opens with the message written (the address is on the form)
  document.querySelectorAll('form.brief [data-mail-send]').forEach((b) => b.addEventListener('click', () => {
    const f = b.closest('form'); if (!f || !briefReady(f)) return;
    const parts = briefParts(f);
    track('contact_click', { channel: 'email', kind: parts.kind || '' });
    location.href = `mailto:${f.dataset.mail || ''}?subject=${encodeURIComponent(jt('mailSubject'))}&body=${encodeURIComponent(briefText(parts))}`;
  }));

  // ---------- the labels in brackets decode into place the first time they are seen
  const kts = [...document.querySelectorAll('.kt')];
  if (kts.length && 'IntersectionObserver' in window && !reduce) {
    const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/<>_#';
    const decode = (el) => {
      const text = el.textContent, n = text.length;
      el.style.width = `${el.getBoundingClientRect().width.toFixed(1)}px`;
      const t0 = performance.now(), dur = 480 + n * 16;
      let last = 0;
      const step = (now) => {
        const p = clamp((now - t0) / dur);
        if (now - last > 40 || p >= 1) {
          last = now;
          let out = '';
          for (let i = 0; i < n; i++) { const ch = text[i]; out += ch === ' ' || p >= (i / n) * 0.7 + 0.3 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]; }
          el.textContent = out;
        }
        if (p < 1) requestAnimationFrame(step); else { el.textContent = text; el.style.width = ''; }
      };
      requestAnimationFrame(step);
    };
    const kio = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { kio.unobserve(en.target); setTimeout(() => decode(en.target), 120); } }), { threshold: 1 });
    kts.forEach((el) => kio.observe(el));
  }

  // ---------- the palette: ⌘K / Ctrl K, or / outside a form, or the menu's button; type to narrow, ↑ ↓ to choose, ↵ to go
  if (typeof HTMLDialogElement === 'function' && INDEX) {
    const mac = /Mac|iPhone|iPad/.test(navigator.userAgentData?.platform || navigator.platform || '');
    document.querySelectorAll('[data-kbd]').forEach((k) => { k.textContent = mac ? '⌘ K' : 'Ctrl K'; });
    const onHome = location.pathname === `${PFX}/full/`;   // (the sections live on the story page)
    const items = [
      ...[[jt('selectedWork'), `${PFX}/full/#work`, jt('sixClose')], [jt('allProjects'), `${PFX}/work/`, jt('everyOne', { n: INDEX.p.length })], [jt('clients'), `${PFX}/full/#clients`, jt('whoTrusted')], [jt('whatIBuild'), `${PFX}/full/#territories`, jt('territories')], [jt('thePath'), `${PFX}/full/#path`, jt('fromStairs')], [jt('contact'), `${PFX}/full/#contact`, jt('yourTurn')], [jt('theDesk'), '/3d/', jt('otherWay')], [jt('home'), `${PFX}/`, 'navygibran.dev']]
        .map(([t, href, d]) => ({ g: jt('goTo'), t, d, href })),
      ...INDEX.p.map(([key, t, d, s, bg, kind], i) => ({ g: jt('projects'), n: String(i + 1).padStart(2, '0'), t, d, s: `${s} ${kind}`, href: `${PFX}/work/${key}/`, bg, here: location.pathname === `${PFX}/work/${key}/` })),
      ...INDEX.l.map(([t, href]) => ({ g: jt('elsewhere'), t, d: href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), href, ext: true })),
    ];
    const ico = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>';
    const pal = document.createElement('dialog');
    pal.className = 'pal'; pal.setAttribute('aria-label', jt('palAria'));
    pal.innerHTML = `<div class="pal-bar">${ico}<input class="pal-in" type="search" role="combobox" aria-label="${jt('palInput')}" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" placeholder="${jt('palPh')}" autocomplete="off" spellcheck="false"><button class="pal-esc" type="button" aria-label="Close">esc</button></div>`
      + `<ul class="pal-list" id="pal-list" role="listbox" aria-label="Results"></ul>`
      + `<div class="pal-foot" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> choose</span><span><kbd>↵</kbd> go</span><span><kbd>esc</kbd> close</span></div>`;
    document.body.append(pal);
    const input = pal.querySelector('.pal-in'), list = pal.querySelector('.pal-list');
    let shown = [], sel = 0;
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const mark = (t, q) => {
      const i = q ? norm(t).indexOf(q) : -1;
      const e = (s) => s.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
      return i < 0 ? e(t) : `${e(t.slice(0, i))}<mark>${e(t.slice(i, i + q.length))}</mark>${e(t.slice(i + q.length))}`;
    };
    const paint = () => {
      const q = norm(input.value.trim()), words = q.split(/\s+/).filter(Boolean);
      shown = items.filter((it) => { const hay = norm(`${it.t} ${it.d || ''} ${it.s || ''} ${it.g}`); return words.every((w) => hay.includes(w)); });
      if (q) shown.sort((a, b) => (norm(b.t).startsWith(q) - norm(a.t).startsWith(q)) || (norm(b.t).includes(q) - norm(a.t).includes(q)));
      sel = Math.min(sel, Math.max(0, shown.length - 1));
      if (!shown.length) { list.innerHTML = '<li class="pal-empty" role="presentation">Nothing by that name. Try a project, a client or a tool.</li>'; input.removeAttribute('aria-activedescendant'); return; }
      let g = '', html = '';
      shown.forEach((it, i) => {
        if (it.g !== g && !q) { g = it.g; html += `<li class="pal-g" role="presentation">${g}</li>`; }
        html += `<li class="pal-o" role="option" id="pal-${i}" data-i="${i}" aria-selected="${i === sel}">${it.n ? `<span class="pal-n">${it.n}</span>` : ''}<span class="pal-t">${mark(it.t, words[0] || '')}${it.ext ? ' ↗' : ''}</span><span class="pal-d">${mark(it.here ? 'You are here' : it.d || '', '')}</span></li>`;
      });
      list.innerHTML = html;
      input.setAttribute('aria-activedescendant', `pal-${sel}`);
    };
    const choose = (i, scroll = true) => {
      sel = i;
      list.querySelectorAll('.pal-o').forEach((o) => o.setAttribute('aria-selected', String(Number(o.dataset.i) === i)));
      input.setAttribute('aria-activedescendant', `pal-${i}`);
      if (scroll) list.querySelector(`#pal-${i}`)?.scrollIntoView({ block: 'nearest' });
    };
    const go = (it) => {
      if (!it) return;
      pal.close();
      track('palette_go', { to: it.href });
      if (it.ext) { window.open(it.href, '_blank', 'noopener'); return; }
      const url = new URL(it.href, location.href);
      if (url.pathname === location.pathname) {
        const el = url.hash && document.getElementById(url.hash.slice(1));
        scrollToY(el ? el.getBoundingClientRect().top + scrollY - 20 : 0);
        if (url.hash) history.replaceState(null, '', url.hash);
        return;
      }
      if (url.pathname.startsWith('/3d')) { leaveTo(url.href, '#0a0806', 'The 3D desk', false); return; }
      leaveTo(url.href, it.bg, it.t);
    };
    const open = () => {
      if (pal.open) return;
      if (menuOpen) setMenu(false);
      input.value = ''; sel = 0; paint();
      input.placeholder = innerWidth < 560 ? jt('palPhShort') : jt('palPh');
      pal.showModal(); locked = true; input.focus();
      track('palette_open', { path: location.pathname });
    };
    pal.addEventListener('close', () => { locked = false; });
    input.addEventListener('input', () => { sel = 0; paint(); list.scrollTop = 0; });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (shown.length) choose((sel + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length); }
      else if (e.key === 'Enter') { e.preventDefault(); go(shown[sel]); }
      else if (e.key === 'Escape') { e.preventDefault(); pal.close(); }
      else if (e.key === 'Home' && !input.value) { e.preventDefault(); choose(0); }
      else if (e.key === 'End' && !input.value) { e.preventDefault(); choose(shown.length - 1); }
    });
    list.addEventListener('mousemove', (e) => { const o = e.target.closest('.pal-o'); if (o && Number(o.dataset.i) !== sel) choose(Number(o.dataset.i), false); });
    list.addEventListener('click', (e) => { const o = e.target.closest('.pal-o'); if (o) go(shown[Number(o.dataset.i)]); });
    pal.addEventListener('click', (e) => { if (e.target === pal || e.target.closest('.pal-esc')) pal.close(); });   // (outside the panel, or esc)
    pal.addEventListener('wheel', (e) => { if (!e.target.closest('.pal-list')) e.preventDefault(); }, { passive: false });
    document.querySelectorAll('[data-palette]').forEach((b) => b.addEventListener('click', open));
    addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey) && !e.altKey) { e.preventDefault(); pal.open ? pal.close() : open(); }
      else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey && !pal.open) { e.preventDefault(); open(); }
    });
  }

  // ---------- project pages: a screenshot opens large (click or tap); ← and → (or a swipe) step through them, Escape or a click closes
  const zooms = [...document.querySelectorAll('.shot-main > img, .shot-main .phone img, .gallery .shot > img')];
  if (zooms.length && typeof HTMLDialogElement === 'function') {
    const ico = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
    const lb = document.createElement('dialog');
    lb.className = 'lb'; lb.setAttribute('aria-label', 'Screenshots');
    lb.innerHTML = `<figure class="lb-fig"><img class="lb-img" alt=""><figcaption class="lb-cap"><span class="lb-n"></span><span class="lb-t"></span></figcaption></figure>`
      + `<button class="lb-x" type="button" aria-label="${jt('close')}">${ico('M6 6l12 12M18 6L6 18')}</button>`
      + `<button class="lb-p" type="button" aria-label="${jt('prevShot')}">${ico('M15 5l-7 7 7 7')}</button>`
      + `<button class="lb-nx" type="button" aria-label="${jt('nextShot')}">${ico('M9 5l7 7-7 7')}</button>`;
    document.body.append(lb);
    const big = lb.querySelector('.lb-img'), num = lb.querySelector('.lb-n'), cap = lb.querySelector('.lb-t');
    let at = 0;
    const show = (i) => {
      at = (i + zooms.length) % zooms.length;
      const s = zooms[at];
      big.style.animation = 'none'; void big.offsetWidth; big.style.animation = '';
      big.src = s.getAttribute('src'); big.alt = s.alt;   // (the original, never the phone-sized copy the page may be showing)
      num.textContent = `${at + 1} / ${zooms.length}`; cap.textContent = s.alt.replace(/: (screenshot|another page)( \d+)?$/, '');
    };
    lb.classList.toggle('one', zooms.length < 2);
    zooms.forEach((s, i) => {
      s.closest('figure')?.setAttribute('data-cursor', 'Zoom');
      // (a keyboard reaches each one too: Enter or Space opens it, and closing returns there)
      s.tabIndex = 0; s.setAttribute('role', 'button'); s.setAttribute('aria-label', `${s.alt}, open large`);
      s.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.click(); } });
      s.addEventListener('click', () => {
        show(i); lb.showModal(); locked = true;
        track('screenshot_zoom', { project: location.pathname.split('/')[2] || '', n: i + 1 });
      });
    });
    lb.addEventListener('close', () => { locked = false; });
    lb.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });   // (the page behind stays where it was)
    lb.addEventListener('click', (e) => {
      if (e.target.closest('.lb-p')) show(at - 1);
      else if (e.target.closest('.lb-nx')) show(at + 1);
      else lb.close();
    });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); show(at + (e.key === 'ArrowLeft' ? -1 : 1)); }
    });
    let sx = null;
    lb.addEventListener('touchstart', (e) => { sx = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      if (sx === null || zooms.length < 2) return;
      const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) { e.preventDefault(); show(at + (dx > 0 ? -1 : 1)); }
    });
  }

  // ---------- project pages: ← and → step through the projects
  const nb = document.body.dataset;
  if (nb.prev || nb.next) addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || menuOpen) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
    if (e.key === 'ArrowRight' && nb.next) { e.preventDefault(); track('project_open', { project: nb.next, from: 'key' }); leaveTo(nb.next, nb.nextBg, nb.nextName); }
    else if (e.key === 'ArrowLeft' && nb.prev) { e.preventDefault(); track('project_open', { project: nb.prev, from: 'key' }); leaveTo(nb.prev, nb.prevBg, nb.prevName); }
  });

  // ---------- the motion switch at the foot of the page: remembered in this browser, applied on the next load
  document.querySelectorAll('.motion').forEach((b) => {
    const off = root.classList.contains('motion-off');
    b.setAttribute('aria-pressed', String(off));
    b.innerHTML = `${jt('motion')} <b>${off ? jt('motionOff') : jt('motionOn')}</b>`;
    b.title = off ? 'Turn the animations back on' : 'Turn the animations off';
    b.addEventListener('click', () => {
      try { if (off) localStorage.removeItem('nv-motion'); else localStorage.setItem('nv-motion', 'off'); } catch {}
      track('motion_toggle', { motion: off ? 'on' : 'off' });
      location.reload();
    });
  });

  // ---------- a shortcut for keyboards: d, e, s, k typed anywhere outside a form goes into the desk
  let typed = '';
  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.key.length !== 1) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable) return;
    typed = (typed + e.key.toLowerCase()).slice(-4);
    if (typed === 'desk') { typed = ''; track('3d_cta_click', { from: 'typed' }); leaveTo('/3d/', '#0a0806', 'The 3D desk', false); }
  });

  // ---------- while the tab is in the background, it says so
  const baseTitle = document.title;
  document.addEventListener('visibilitychange', () => { document.title = document.hidden ? 'Still here | Navy Gibran' : baseTitle; });

  // ---------- the pointer ring (mouse only): trails the cursor, grows over links, says what a project link does
  if (fine && !reduce) {
    const ring = document.createElement('div'); ring.className = 'ring'; ring.setAttribute('aria-hidden', 'true'); ring.innerHTML = '<span></span>';
    const label = ring.firstChild; document.body.append(ring);
    let rx = -100, ry = -100, mx = -100, my = -100, moving = false;
    const step = () => { rx += (mx - rx) * 0.22; ry += (my - ry) * 0.22; ring.style.transform = `translate3d(${(rx / zk).toFixed(1)}px, ${(ry / zk).toFixed(1)}px, 0)`; if (Math.abs(mx - rx) + Math.abs(my - ry) > 0.3) requestAnimationFrame(step); else moving = false; };
    const classify = (el) => {
      const l = el?.closest?.('[data-cursor]'), a = !l && el?.closest?.('a, button');
      ring.classList.toggle('label', !!l); ring.classList.toggle('big', !!a);
      if (l) label.textContent = l.dataset.cursor;
    };
    addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY; ring.classList.add('on');
      classify(e.target);
      if (!moving) { moving = true; requestAnimationFrame(step); }
    }, { passive: true });
    let pend = false;
    addEventListener('scroll', () => {
      if (pend || !ring.classList.contains('on')) return;
      pend = true;
      requestAnimationFrame(() => { pend = false; classify(document.elementFromPoint(mx, my)); });
    }, { passive: true });
    document.addEventListener('mouseleave', () => ring.classList.remove('on'));
    // the picture of a project tilts a little toward the pointer
    document.querySelectorAll('.case-in').forEach((a) => {
      const m = a.querySelector('.case-media'); if (!m) return;
      a.addEventListener('mousemove', (e) => { const b = m.getBoundingClientRect(); const x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5; m.style.transform = `perspective(1600px) rotateY(${(clamp(x, -0.6, 0.6) * 7).toFixed(2)}deg) rotateX(${(clamp(y, -0.6, 0.6) * -5).toFixed(2)}deg)`; });
      a.addEventListener('mouseleave', () => { m.style.transform = ''; });
    });
    // magnetic buttons: lean toward the pointer, spring back when it leaves
    document.querySelectorAll('[data-magnet]').forEach((m) => {
      m.addEventListener('mousemove', (e) => { const b = m.getBoundingClientRect(); m.style.transform = `translate3d(${((e.clientX - b.left - b.width / 2) * 0.22 / zk).toFixed(1)}px, ${((e.clientY - b.top - b.height / 2) * 0.32 / zk).toFixed(1)}px, 0)`; });
      m.addEventListener('mouseleave', () => { m.style.transform = ''; });
    });
  }

  // ---------- a keyboard that tabs into the teaser lands where its words have risen (they are invisible until then)
  const teaserEl = document.querySelector('.teaser');
  teaserEl?.addEventListener('focusin', () => {
    if (teaserEl.classList.contains('live') || reduce) return;
    const top = teaserEl.getBoundingClientRect().top + scrollY;
    scrollToY(top + teaserEl.offsetHeight - vh);
  });

  // ---------- GodPlan's architecture diagram: a module under the pointer (or focus) lights its path to the API and the database,
  // and the caption says what travels; leaving it puts the resting line back
  const archFig = document.querySelector('.arch-fig');
  if (archFig) {
    let notes = {}; try { notes = JSON.parse(document.getElementById('arch-notes')?.textContent || '{}'); } catch {}
    const say = archFig.querySelector('.arch-say'), svg = archFig.querySelector('svg');
    const light = (mod) => { svg.querySelectorAll('[data-mod]').forEach((el) => el.classList.toggle('on', !!mod && el.dataset.mod === mod)); svg.classList.toggle('lit', !!mod); if (say) say.textContent = mod && notes[mod] ? notes[mod] : say.dataset.idle; };
    svg.querySelectorAll('.am').forEach((g) => {
      g.addEventListener('pointerenter', () => light(g.dataset.mod)); g.addEventListener('pointerleave', () => light(null));
      g.addEventListener('focus', () => light(g.dataset.mod)); g.addEventListener('blur', () => light(null));
      g.addEventListener('click', () => light(g.classList.contains('on') ? null : g.dataset.mod));
    });
  }

  // ---------- selected work: the pictures tilt toward the pointer (a mouse, motion on); the phone shot sits a little in front
  if (fine && !reduce) document.querySelectorAll('.case-in').forEach((a) => {
    const media = a.querySelector('.case-media'); if (!media) return;
    let raf = 0, tx = 0, ty = 0;
    const apply = () => { raf = 0; media.style.setProperty('--tx', tx.toFixed(3)); media.style.setProperty('--ty', ty.toFixed(3)); };
    a.addEventListener('pointermove', (e) => { const r = a.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; if (!raf) raf = requestAnimationFrame(apply); });
    a.addEventListener('pointerleave', () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(apply); });
  });

  // ---------- the difference: the steps light one after another as the section passes, the stack last on Navy's side
  const diffSec = document.getElementById('difference');
  const diffSteps = diffSec ? [...diffSec.querySelectorAll('.diff-col--usual ol li'), ...diffSec.querySelectorAll('.diff-col--mine ol li')] : [];
  if (diffSteps.length && !reduce) scene('#difference', (p, r) => {
    diffSec.classList.add('diff-live');
    const n = Math.round(clamp((vh * 0.85 - r.top) / (r.height * 0.7)) * diffSteps.length);
    diffSteps.forEach((li, i) => li.classList.toggle('lit', i < n));
  });

  // ---------- the desk turns with the scroll: frames the 3D engine rendered (public/site/turn), drawn to a canvas while the
  // teaser holds still; the nearest frame that has arrived is shown until all are in. Not on a phone (a 16:9 frame blown up to a
  // portrait screen goes soft: the sharp still stays), nor with data saver or reduced motion.
  const turnEl = document.querySelector('.teaser-turn');
  // (a slow or metered connection keeps the still: the frames are a few MB that nobody on 3G should pay for)
  const conn = navigator.connection, noData = !!(conn && (conn.saveData || /(^|[^4-9])[23]g$/.test(conn.effectiveType || '')));
  if (turnEl && !reduce && !noData && matchMedia('(min-width: 700px)').matches && 'IntersectionObserver' in window) {
    // The frames stay compressed (blobs, a few MB in all); only a window of them around the scroll position is decoded into
    // bitmaps, off the main thread, and the ones that fall out of the window are released. Nothing is redrawn unless the
    // frame to show changes, and the nearest decoded frame stands in until the exact one is ready.
    const n = +turnEl.dataset.n || 0, WIN = 3;
    const ctx = turnEl.getContext('2d'), blobs = new Array(n), bmps = new Array(n), pending = new Set();
    let started = false, shown = -1, want = 0;
    const wanted = () => Math.round(want * (n - 1));
    const nearest = (i) => { for (let d = 0; d < n; d++) { if (bmps[i + d]) return i + d; if (bmps[i - d]) return i - d; } return -1; };
    const ensure = (c) => {
      for (let i = 0; i < n; i++) {
        const inWin = Math.abs(i - c) <= WIN;
        if (!inWin && bmps[i]) { bmps[i].close(); bmps[i] = null; }
        if (inWin && blobs[i] && !bmps[i] && !pending.has(i)) {
          pending.add(i);
          createImageBitmap(blobs[i]).then((b) => { pending.delete(i); if (Math.abs(i - wanted()) <= WIN) { bmps[i] = b; draw(); } else b.close(); }).catch(() => pending.delete(i));
        }
      }
    };
    const draw = () => {
      const c = wanted(); ensure(c);
      const i = nearest(c); if (i < 0 || i === shown) return; shown = i;
      const f = bmps[i]; if (turnEl.width !== f.width || turnEl.height !== f.height) { turnEl.width = f.width; turnEl.height = f.height; }   // (the canvas takes the frames' own size: no upscaling of its own)
      ctx.drawImage(f, 0, 0, turnEl.width, turnEl.height); turnEl.classList.add('on');
    };
    const start = () => {
      if (started || n < 2 || typeof createImageBitmap !== 'function') return; started = true;
      // the two ends and the middle first, then the rest, so a scrub has something to show early
      const order = [0, n - 1, Math.floor(n / 2), ...Array.from({ length: n }, (_, i) => i)].filter((v, k, arr) => arr.indexOf(v) === k);
      // (low priority: the frames never compete with a picture that is on screen)
      order.forEach((i) => { fetch(`/site/turn/desk-${i}.webp`, { priority: 'low' }).then((r) => (r.ok ? r.blob() : Promise.reject())).then((b) => { blobs[i] = b; draw(); }).catch(() => {}); });
    };
    new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) start(); }), { rootMargin: '60% 0px 60% 0px' }).observe(turnEl.closest('.teaser') || turnEl);
    scene('[data-scene="teaser"]', (p) => { want = clamp(p); draw(); }, 'pin');
  }

  // ---------- the desk loop in the teaser: fetched when the teaser comes near (not on small screens, data saver or reduced motion),
  // playing only while it is on screen; the still underneath stays if the video cannot play
  const tv = document.querySelector('.teaser-video');
  const saveData = !!navigator.connection?.saveData;
  if (tv && !turnEl && !reduce && !saveData && matchMedia('(min-width: 700px)').matches && 'IntersectionObserver' in window) {   // (the turntable, when its frames exist, takes the loop's place)
    let loaded = false;
    const load = () => {
      if (loaded) return; loaded = true;
      for (const [src, type] of [[tv.dataset.webm, 'video/webm'], [tv.dataset.mp4, 'video/mp4']]) { if (!src) continue; const s = document.createElement('source'); s.src = src; s.type = type; tv.append(s); }
      tv.load();
    };
    tv.addEventListener('playing', () => tv.classList.add('on'));
    new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { load(); tv.play().catch(() => {}); } else if (loaded) tv.pause();
    }), { rootMargin: '40% 0px 40% 0px' }).observe(tv.closest('.teaser') || tv);
  }

  // ---------- the "3D" tab on the edge steps aside over the work (the rail of its numbers stands there), the teaser, contact and
  // the footer (they offer the way in themselves)
  const tabHide = document.querySelectorAll('[data-hide-tab]');
  if (tabHide.length && 'IntersectionObserver' in window) {
    const seen = new Set();
    const tio = new IntersectionObserver((es) => { es.forEach((en) => (en.isIntersecting ? seen.add(en.target) : seen.delete(en.target))); document.body.classList.toggle('tab-off', seen.size > 0); }, { threshold: 0, rootMargin: '-35% 0px -35% 0px' });
    tabHide.forEach((el) => tio.observe(el));
  }

  // ---------- the time where Navy is (Western Indonesia Time), wherever the page shows it
  const clocks = document.querySelectorAll('[data-clock]');
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
    const tick = () => { const t = `Jakarta ${fmt.format(new Date())} WIB`; clocks.forEach((c) => { c.textContent = t; }); };
    tick(); setInterval(tick, 30000);
  }
})();
