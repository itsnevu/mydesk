// A plain-language guide for visitors who don't know where to start: a "? Guide" button that is always in the corner
// (and the G key, and the button drawn on the portfolio screen), opening a panel that says what to click for what, where
// every row is itself a button that takes you there.
const ROWS = [
  ['See my work', 'Click the right screen ("Hi, I\'m Navy") or a glowing key', 'W', 'monitor'],
  ['Who I am', 'Click the paper note on the desk', 'A', 'note'],
  ['What I can do', 'Click the desk lamp', 'S', 'lamp'],
  ['Every project, in order', 'Click the little clock', 'P', 'clock'],
  ['The story so far', 'Click the orange bookmark key', 'T', 'art4'],
  ['Get in touch', 'Click the mouse', 'C', 'mouse'],
  ['Sit where I work', 'Click the chair', '', 'chair'],
  ['Lost? Back to the start', 'Brings the camera back to the whole desk', '', 'home'],
];
const CONTROLS = [['Look around', 'drag with the mouse (or one finger)'], ['Zoom in / out', 'scroll (or pinch)'], ['Go back', 'press Esc, or the ✕ at the top right'], ['Tip', 'anything that lights up when you point at it can be clicked']];

const CSS = `
#guide-btn { position: absolute; left: 40px; bottom: calc(30px + var(--safe-b, 0px)); z-index: 40; display: flex; align-items: center; gap: 10px; padding: 11px 18px 11px 12px; border: 1px solid rgba(217,160,91,0.6); border-radius: 999px; background: rgba(18,15,10,0.78); backdrop-filter: blur(8px); color: var(--paper, #e7ddc8); font: 600 14px/1 var(--sans, system-ui); letter-spacing: 0.04em; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity .5s, border-color .2s, transform .2s; }
#guide-btn b { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--accent, #d9a05b); color: #1a140d; font-size: 15px; }
#guide-btn:hover { border-color: var(--accent, #d9a05b); transform: translateY(-1px); }
#guide-btn.pulse b { animation: guide-pulse 1.6s ease-in-out 5; }
@keyframes guide-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(217,160,91,0.7); } 50% { box-shadow: 0 0 0 9px rgba(217,160,91,0); } }
body:not([data-state="loading"]):not([data-state="gate"]):not([data-state="entering"]) #guide-btn { opacity: 1; pointer-events: auto; }
#guide { position: absolute; inset: 0; z-index: 80; display: grid; place-items: center; padding: 16px; background: rgba(8,6,4,0.62); backdrop-filter: blur(6px); opacity: 0; pointer-events: none; transition: opacity .3s; }
#guide.open { opacity: 1; pointer-events: auto; }
#guide .card { width: min(620px, 100%); max-height: calc(100vh - 32px); overflow: auto; padding: 30px 30px 24px; border: 1px solid rgba(217,160,91,0.35); border-radius: 18px; background: #17130e; color: var(--paper, #e7ddc8); font-family: var(--sans, system-ui); box-shadow: 0 30px 80px rgba(0,0,0,0.6); transform: translateY(10px); transition: transform .3s; scrollbar-width: thin; scrollbar-color: rgba(217,160,91,0.45) transparent; }
#guide.open .card { transform: none; }
#guide .quick { display: block; width: 100%; margin: 0 0 18px; padding: 16px; border: 0; border-radius: 12px; background: var(--accent, #d9a05b); color: #1a140d; font: 500 17px var(--sans, system-ui); text-align: center; cursor: pointer; }
#guide .quick strong { font-weight: 800; }
#quick-btn { position: absolute; left: 160px; bottom: calc(30px + var(--safe-b, 0px)); z-index: 40; padding: 13px 18px; border: 0; border-radius: 999px; background: var(--accent, #d9a05b); color: #1a140d; font: 700 14px/1 var(--sans, system-ui); letter-spacing: 0.03em; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity .5s, transform .2s; }
#quick-btn:hover { transform: translateY(-1px); }
body:not([data-state="loading"]):not([data-state="entering"]):not([data-state="detail"]) #quick-btn { opacity: 1; pointer-events: auto; }
body[data-state="gate"] #quick-btn { left: 50%; bottom: 7%; transform: translateX(-50%); padding: 16px 26px; font-size: 16px; z-index: 70; }
/* inside a world or the gallery the way out is the world's own button: the shortcut steps aside (important: the rule that
   shows it is more specific) */
body[data-state="project"] #quick-btn, body[data-state="gallery"] #quick-btn, body[data-state="switching"] #quick-btn { opacity: 0 !important; pointer-events: none !important; }
/* the gate: one line that says what to do, just above "See the work" */
#gate-tip { position: absolute; left: 50%; bottom: calc(7% + 70px * var(--ui, 1)); transform: translateX(-50%); z-index: 70; color: var(--paper, #e7ddc8); font: 500 calc(15px * var(--ui, 1)) var(--sans, system-ui); letter-spacing: 0.02em; text-shadow: 0 2px 14px rgba(0,0,0,0.9); white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity .5s; }
body[data-state="gate"] #gate-tip { opacity: 1; }
/* a narrow desktop window: the centred key hints would run into the two buttons, so they give way */
@media (max-width: 980px) { #kbd-hints { display: none !important; } }
/* phones and tablets (the same breakpoint as styles.css): one obvious thing to press. "See the work" spans the bottom of the
   screen; "? Guide" sits on the row above it, on the left (the sound toggle shares that row on the right, styles.css).
   While something else owns the screen they step aside: an object's bottom sheet (focus), a world (it has its own way
   out), the project pages (they have their own back). */
@media (max-width: 760px), (pointer: coarse) and (max-width: 1024px) {
  #quick-btn, body[data-state="gate"] #quick-btn { left: 16px; right: 16px; bottom: calc(16px + var(--safe-b, 0px)); transform: none; padding: 17px 18px; border-radius: 14px; font-size: 16px; text-align: center; box-shadow: 0 10px 28px rgba(0,0,0,0.45); }
  #quick-btn:hover { transform: none; }
  #guide-btn { left: 16px; bottom: calc(82px + var(--safe-b, 0px)); padding: 9px 15px 9px 9px; font-size: 14px; }
  body[data-state="focus"] #guide-btn, body[data-state="focus"] #quick-btn,
  body[data-state="project"] #guide-btn, body[data-state="gallery"] #guide-btn, body[data-state="switching"] #guide-btn,
  body[data-state="detail"] #guide-btn { opacity: 0 !important; pointer-events: none !important; }
  #guide .row .go { display: none; }
  #gate-tip { bottom: calc(88px + var(--safe-b, 0px)); font-size: 15px; }
}
/* a phone held sideways: a full-width bar would eat the short screen, so "? Guide" and "See the work" take the two bottom
   corners (on the gate the button is centred), clear of the notch */
@media (pointer: coarse) and (orientation: landscape) and (max-height: 500px) {
  #quick-btn { left: auto; right: calc(16px + var(--safe-r, 0px)); bottom: calc(14px + var(--safe-b, 0px)); padding: 15px 24px; border-radius: 999px; font-size: 15px; }
  body[data-state="gate"] #quick-btn { left: 50%; right: auto; bottom: calc(14px + var(--safe-b, 0px)); transform: translateX(-50%); }
  #guide-btn { left: calc(16px + var(--safe-l, 0px)); bottom: calc(14px + var(--safe-b, 0px)); }
  #gate-tip { bottom: calc(76px + var(--safe-b, 0px)); }
  #guide .card { padding: 20px 22px 16px; }
}
#guide h2 { margin: 0 0 6px; font-size: 28px; font-weight: 700; }
#guide .lead { margin: 0 0 20px; color: rgba(231,221,200,0.7); font-size: 16px; line-height: 1.5; }
#guide .row { display: flex; align-items: center; gap: 16px; width: 100%; margin: 0 0 10px; padding: 14px 16px; border: 1px solid rgba(231,221,200,0.12); border-radius: 12px; background: rgba(255,255,255,0.03); color: inherit; font: inherit; text-align: left; cursor: pointer; transition: border-color .2s, background .2s; }
#guide .row:hover, #guide .row:focus-visible { border-color: var(--accent, #d9a05b); background: rgba(217,160,91,0.08); outline: none; }
#guide .row .what { flex: 1; }
#guide .row strong { display: block; font-size: 18px; margin-bottom: 3px; }
#guide .row span { color: rgba(231,221,200,0.65); font-size: 14px; line-height: 1.4; }
#guide .row kbd { min-width: 30px; padding: 5px 8px; border: 1px solid rgba(231,221,200,0.4); border-radius: 6px; box-shadow: 0 2px 0 rgba(231,221,200,0.3); font: 600 13px var(--mono, monospace); text-align: center; }
#guide .row .go { color: var(--accent, #d9a05b); font: 600 13px var(--mono, monospace); letter-spacing: 0.08em; }
#guide h3 { margin: 22px 0 10px; font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent, #d9a05b); }
#guide dl { display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; margin: 0; font-size: 15px; }
#guide dt { font-weight: 600; } #guide dd { margin: 0; color: rgba(231,221,200,0.7); }
#guide .close { display: block; width: 100%; margin-top: 22px; padding: 14px; border: 0; border-radius: 12px; background: var(--accent, #d9a05b); color: #1a140d; font: 700 16px var(--sans, system-ui); cursor: pointer; }
@media (max-width: 760px) { #guide .card { padding: 22px 18px 18px; } #guide .row kbd { display: none; } }
/* big (or zoomed-out) windows: grow with the rest of the HUD (styles.css, --ui); the card's height cap is divided back out of the zoom */
@media (min-width: 1025px) {
  #guide .card, #guide-btn, #quick-btn { zoom: var(--ui, 1); }
  #guide .card { width: min(780px, 100%); max-height: calc((100vh - 32px) / var(--ui, 1)); }
  /* two columns of destinations, so the whole card fits a 16:9 window without scrolling */
  #guide .rows { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  #guide .rows .row { margin: 0; }
}
`;

export function initGuide(xp) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const btn = document.createElement('button'); btn.id = 'guide-btn'; btn.type = 'button'; btn.className = 'pulse';
  btn.setAttribute('aria-label', 'Open the guide'); btn.innerHTML = '<b>?</b> Guide';
  const panel = document.createElement('div'); panel.id = 'guide'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'guide-title');
  // on a touch screen the copy says tap, not click
  const touch = matchMedia('(pointer: coarse)').matches; const verb = (t) => (touch ? t.replace(/^Click/, 'Tap').replace('click', 'tap') : t);
  panel.innerHTML = `<div class="card">
    <h2 id="guide-title">How to look around</h2>
    <p class="lead">This portfolio is a desk you can explore. Pick what you'd like to see and I'll take you there.</p>
    <button class="quick" type="button" data-go="work">In a hurry? <strong>Show me the work →</strong></button>
    <div class="rows">${ROWS.map(([t, how, key, id]) => `<button class="row" type="button" data-go="${id}"><div class="what"><strong>${t}</strong><span>${verb(how)}</span></div>${key ? `<kbd>${key}</kbd>` : ''}<span class="go">GO →</span></button>`).join('')}</div>
    <h3>Moving around</h3>
    <dl>${CONTROLS.map(([a, b]) => `<dt>${a}</dt><dd>${verb(b)}</dd>`).join('')}</dl>
    <button class="close" type="button">Got it, let me explore</button>
  </div>`;
  const quick = document.createElement('button'); quick.id = 'quick-btn'; quick.type = 'button'; quick.textContent = 'See the work →';
  // on the gate it skips straight in: enter without sound, land, and open the project pages
  quick.addEventListener('click', () => { if (document.body.dataset.state === 'gate') xp.enter({ music: false, direct: 'work' }); else xp.activate('work'); });
  const tip = document.createElement('div'); tip.id = 'gate-tip'; tip.setAttribute('aria-hidden', 'true');
  tip.textContent = touch ? 'Tap the brass key to step in, or' : 'Press the brass key to step in, or';
  document.body.append(btn, quick, tip, panel);
  // closed, the panel is inert: nothing in it can be focused or clicked by keyboard; closing hands focus back to the button
  let open = false; panel.inert = true;
  const show = () => { open = true; panel.inert = false; panel.classList.add('open'); btn.classList.remove('pulse'); panel.querySelector('.quick, .row')?.focus(); };
  const hide = () => {
    open = false; panel.classList.remove('open'); panel.inert = true;
    if (panel.contains(document.activeElement) || document.activeElement === document.body) { if (getComputedStyle(btn).pointerEvents !== 'none') btn.focus({ preventScroll: true }); else document.activeElement?.blur?.(); }
  };
  btn.addEventListener('click', show);
  panel.querySelector('.close').addEventListener('click', hide);
  panel.addEventListener('click', (e) => { if (e.target === panel) hide(); });
  // back to the start view from anywhere: leave an object, a page or a world first, then fly back to where the visit began
  const goHome = () => {
    const st = () => document.body.dataset.state;
    const fly = (tries = 0) => {
      if ((xp.flight || st() !== 'desk') && tries < 30) { setTimeout(() => fly(tries + 1), 120); return; }
      if (st() === 'desk') xp.flyTo(xp.home, { duration: 1.6, lift: 1.5, onComplete: () => xp.settle('desk') });
    };
    if (['focus', 'overview', 'detail', 'project'].includes(st())) xp.back();
    fly();
  };
  panel.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { hide(); setTimeout(() => (b.dataset.go === 'home' ? goHome() : xp.activate(b.dataset.go)), 250); }));
  // G opens it; Esc closes it before the scene sees it
  window.addEventListener('keydown', (e) => {
    // while the guide is open it is modal: no key reaches the scene behind it (Tab moves through the card and wraps around at
    // either end instead of walking out into the page behind, Enter and Space still press the focused button, Esc closes)
    if (open) {
      e.stopImmediatePropagation();
      if (e.key === 'Escape') { e.preventDefault(); hide(); }
      else if (e.key === 'Tab') {
        const f = [...panel.querySelectorAll('button')].filter((b) => b.offsetParent !== null), first = f[0], last = f[f.length - 1], a = document.activeElement;
        if (!panel.contains(a)) { e.preventDefault(); (e.shiftKey ? last : first)?.focus(); }
        else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (!open && (e.key === 'g' || e.key === 'G') && !e.ctrlKey && !e.metaKey && document.body.dataset.state !== 'gate' && document.body.dataset.state !== 'loading') { e.stopImmediatePropagation(); show(); }
  }, true);
  // the button drawn on the portfolio screen
  window.addEventListener('kw:guide', show);
  return { show, hide };
}
