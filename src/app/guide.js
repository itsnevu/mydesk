// A plain-language guide for visitors who don't know where to start: a "? Guide" button that is always in the corner
// (and the G key, and the button drawn on the portfolio screen), opening a panel that says what to click for what, where
// every row is itself a button that takes you there.
import { initHints, showHints } from 'app/hints';

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
const CONTROLS = [['Look around', 'drag with the mouse (or one finger)', 'or use the arrow keys'], ['Zoom in / out', 'scroll (or pinch)', 'or press + and -'], ['Go back', 'press Esc, or the ✕ at the top right'], ['Tip', 'anything that lights up when you point at it can be clicked']];
// the same on a touch screen: the gestures the canvas answers to (engine/controls: one finger turns, two pinch and slide), no mouse, wheel or Esc
const TOUCH_CONTROLS = [['Look around', 'drag with one finger'], ['Zoom in / out', 'pinch with two fingers'], ['Slide the view', 'drag with two fingers'], ['Go back', 'tap the ✕ at the top right'], ['Tip', '"What can I tap?" above puts a label on everything that opens']];

const CSS = `
#guide-btn { position: absolute; left: 40px; bottom: calc(30px + var(--safe-b, 0px)); z-index: 40; display: flex; align-items: center; gap: 10px; padding: 11px 18px 11px 12px; border: 1px solid rgba(217,160,91,0.6); border-radius: 999px; background: rgba(18,15,10,0.78); backdrop-filter: blur(8px); color: var(--paper, #e7ddc8); font: 600 14px/1 var(--sans, system-ui); letter-spacing: 0.04em; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity .5s, border-color .2s, transform .2s; }
#guide-btn b { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--accent, #d9a05b); color: #1a140d; font-size: 15px; }
#guide-btn:hover { border-color: var(--accent, #d9a05b); transform: translateY(-1px); }
/* the pulse that points a first-timer at the guide waits for the desk: on the gate the button is hidden and a pulse there is spent unseen; the .8s lets the button fade in first and skips the moment the desk shows before "See the work" or the tour takes over */
body[data-state="desk"] #guide-btn.pulse b { animation: guide-pulse 1.6s ease-in-out .8s 5; }
@keyframes guide-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(217,160,91,0.7); } 50% { box-shadow: 0 0 0 9px rgba(217,160,91,0); } }
body:not([data-state="loading"]):not([data-state="gate"]):not([data-state="entering"]) #guide-btn { opacity: 1; pointer-events: auto; }
#guide { position: absolute; inset: 0; z-index: 80; display: grid; place-items: center; padding: 16px; background: rgba(8,6,4,0.62); backdrop-filter: blur(6px); opacity: 0; pointer-events: none; transition: opacity .3s; }
#guide.open { opacity: 1; pointer-events: auto; }
#guide .card { width: min(620px, 100%); max-height: calc(100vh - 32px); max-height: calc(100dvh - 32px); overflow: auto; padding: 30px 30px 24px; border: 1px solid rgba(217,160,91,0.35); border-radius: 18px; background: #17130e; color: var(--paper, #e7ddc8); font-family: var(--sans, system-ui); box-shadow: 0 30px 80px rgba(0,0,0,0.6); transform: translateY(10px); transition: transform .3s; scrollbar-width: thin; scrollbar-color: rgba(217,160,91,0.45) transparent; }
#guide.open .card { transform: none; }
#guide .quick { display: block; width: 100%; margin: 0 0 18px; padding: 16px; border: 0; border-radius: 12px; background: var(--accent, #d9a05b); color: #1a140d; font: 500 17px var(--sans, system-ui); text-align: center; cursor: pointer; }
#guide .quick strong { font-weight: 800; }
#quick-btn { position: absolute; left: 160px; bottom: calc(30px + var(--safe-b, 0px)); z-index: 40; padding: 13px 18px; border: 0; border-radius: 999px; background: var(--accent, #d9a05b); color: #1a140d; font: 700 14px/1 var(--sans, system-ui); letter-spacing: 0.03em; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity .5s, transform .2s; }
#quick-btn:hover { transform: translateY(-1px); }
/* the two corner buttons stand the same height side by side on a desktop */
@media (min-width: 761px) and (pointer: fine), (min-width: 1025px) { #guide-btn, #quick-btn { box-sizing: border-box; height: 48px; } #quick-btn { display: flex; align-items: center; padding: 0 22px; } }
body:not([data-state="loading"]):not([data-state="entering"]):not([data-state="detail"]) #quick-btn { opacity: 1; pointer-events: auto; }
body[data-state="gate"] #quick-btn { left: 50%; bottom: 7%; transform: translateX(calc(-100% - 6px)); padding: 16px 26px; font-size: 16px; z-index: 70; }
/* the gate's second way in: the story tour (the orange bookmark key's walk through the keyboard), for a visitor with a minute */
#tour-btn { position: absolute; left: 50%; bottom: 7%; z-index: 70; transform: translateX(6px); padding: 15px 24px; border: 1px solid rgba(217,160,91,0.7); border-radius: 999px; background: rgba(18,15,10,0.72); backdrop-filter: blur(8px); color: var(--paper, #e7ddc8); font: 600 16px/1 var(--sans, system-ui); letter-spacing: 0.02em; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity .5s, transform .2s, border-color .2s; white-space: nowrap; }
#tour-btn:hover { border-color: var(--accent, #d9a05b); transform: translateX(6px) translateY(-1px); }
body[data-state="gate"] #tour-btn { opacity: 1; pointer-events: auto; }
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
  #tour-btn { left: 16px; right: 16px; bottom: calc(80px + var(--safe-b, 0px)); transform: none; padding: 15px 18px; border-radius: 14px; text-align: center; }
  #tour-btn:hover { transform: none; }
  body[data-state="gate"] #guide-btn { bottom: calc(146px + var(--safe-b, 0px)); }
  body[data-state="gate"] #gate-tip { bottom: calc(150px + var(--safe-b, 0px)); }
  #quick-btn:hover { transform: none; }
  #guide-btn { left: 16px; bottom: calc(82px + var(--safe-b, 0px)); padding: 9px 15px 9px 9px; font-size: 14px; }
  body[data-state="focus"] #guide-btn, body[data-state="focus"] #quick-btn,
  body[data-state="project"] #guide-btn, body[data-state="gallery"] #guide-btn, body[data-state="switching"] #guide-btn,
  body[data-state="detail"] #guide-btn { opacity: 0 !important; pointer-events: none !important; }
  #guide .row .go { display: none; }
  /* a link's destination can be a long client name: it wraps inside the screen instead of running off both edges */
  #gate-tip { bottom: calc(88px + var(--safe-b, 0px)); left: 16px; right: 16px; transform: none; white-space: normal; text-align: center; font-size: 15px; }
}
/* a phone held sideways: a full-width bar would eat the short screen, so "? Guide" and "See the work" take the two bottom
   corners, clear of the notch. On the gate "See the work" and the tour stand side by side under the two keys, the same pill,
   as on a desktop (the full-width tour bar lay across the keys and took taps meant for QUIET), and the tip sits just above
   them (a gate rule, so it outranks the phone block's) */
@media (pointer: coarse) and (orientation: landscape) and (max-height: 500px) {
  #quick-btn { left: auto; right: calc(16px + var(--safe-r, 0px)); bottom: calc(14px + var(--safe-b, 0px)); padding: 15px 24px; border-radius: 999px; font-size: 15px; }
  body[data-state="gate"] #quick-btn { left: 50%; right: auto; bottom: calc(14px + var(--safe-b, 0px)); transform: translateX(calc(-100% - 6px)); padding: 15px 24px; border-radius: 999px; font-size: 15px; }
  #tour-btn { left: 50%; right: auto; bottom: calc(14px + var(--safe-b, 0px)); transform: translateX(6px); padding: 14px 24px; border-radius: 999px; font-size: 15px; }
  #tour-btn:hover { transform: translateX(6px); }
  #guide-btn { left: calc(16px + var(--safe-l, 0px)); bottom: calc(14px + var(--safe-b, 0px)); }
  body[data-state="gate"] #gate-tip { bottom: calc(76px + var(--safe-b, 0px)); }
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
  /* the dvh cap sits behind @supports: a line with var() in it is checked only after the cascade, so a browser without dvh would end with no cap at all */
  @supports (height: 100dvh) { #guide .card { max-height: calc((100dvh - 32px) / var(--ui, 1)); } }
  /* two columns of destinations, so the whole card fits a 16:9 window without scrolling */
  #guide .rows { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  #guide .rows .row { margin: 0; }
}
`;

// the gate's one line: what the brass key does. A deep link's destination is named (main.js passes it); with a mouse, Enter is offered too (it presses the brass key: experience.onKeyDown); the trailing "or" leads into the two buttons
export function gateTip(name) {
  const tip = document.getElementById('gate-tip'); if (!tip) return;
  const touch = matchMedia('(pointer: coarse)').matches;
  tip.textContent = `${touch ? 'Tap the brass key' : 'Press the brass key (or Enter)'} to ${name ? `go to ${name}` : 'step in'}, or`;
}

export function initGuide(xp) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const btn = document.createElement('button'); btn.id = 'guide-btn'; btn.type = 'button'; btn.className = 'pulse';
  btn.setAttribute('aria-label', 'Open the guide'); btn.innerHTML = '<b>?</b> Guide';
  // five pulses, once: a run cut short by leaving the desk starts over on the way back; one played to the end takes the class away
  btn.addEventListener('animationend', (e) => { if (e.animationName === 'guide-pulse') btn.classList.remove('pulse'); });
  const panel = document.createElement('div'); panel.id = 'guide'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'guide-title');
  // on a touch screen the copy says tap, not click
  const touch = matchMedia('(pointer: coarse)').matches; const verb = (t) => (touch ? t.replace(/^Click/, 'Tap').replace(/\bclick(ed)?\b/g, (m, ed) => (ed ? 'tapped' : 'tap')) : t);
  panel.innerHTML = `<div class="card">
    <h2 id="guide-title">How to look around</h2>
    <p class="lead">This portfolio is a desk you can explore. Pick what you'd like to see and I'll take you there.</p>
    <button class="quick" type="button" data-go="work">In a hurry? <strong>Show me the work →</strong></button>
    <button class="row hints-row" type="button" data-go="hints"><div class="what"><strong>What can I ${touch ? 'tap' : 'click'}?</strong><span>A label on everything in view that opens something</span></div><span class="go">SHOW →</span></button>
    <div class="rows">${ROWS.map(([t, how, key, id]) => `<button class="row" type="button" data-go="${id}"><div class="what"><strong>${t}</strong><span>${verb(how)}</span></div>${key && !touch ? `<kbd>${key}</kbd>` : ''}<span class="go">GO →</span></button>`).join('')}</div>
    <h3>Moving around</h3>
    <dl>${(touch ? TOUCH_CONTROLS : CONTROLS).map(([a, b, k]) => `<dt>${a}</dt><dd>${verb(b)}${k && !touch ? `, ${k}` : ''}</dd>`).join('')}</dl>
    <button class="close" type="button">Got it, let me explore</button>
  </div>`;
  const quick = document.createElement('button'); quick.id = 'quick-btn'; quick.type = 'button'; quick.textContent = 'See the work →';
  // on the gate it skips straight in: enter without sound, land, and open the project pages
  quick.addEventListener('click', () => { if (document.body.dataset.state === 'gate') xp.enter({ music: false, direct: 'work' }); else xp.activate('work'); });
  // the tour: in without sound, then the story walks the keyboard stop by stop (the same walk as the orange bookmark key, or T)
  const tour = document.createElement('button'); tour.id = 'tour-btn'; tour.type = 'button'; tour.textContent = 'Take the 60-second tour';
  tour.addEventListener('click', () => { if (document.body.dataset.state === 'gate') xp.enter({ music: false, direct: 'art4' }); });
  const tip = document.createElement('div'); tip.id = 'gate-tip'; tip.setAttribute('aria-hidden', 'true');
  document.body.append(btn, quick, tour, tip, panel);
  gateTip();
  // closed, the panel is inert: nothing in it can be focused or clicked by keyboard; closing hands focus back to the button
  let open = false; panel.inert = true;
  const show = () => { open = true; panel.inert = false; panel.classList.add('open'); btn.classList.remove('pulse'); panel.querySelector('.quick, .row')?.focus(); };
  const hide = () => {
    open = false; panel.classList.remove('open'); panel.inert = true;
    if (panel.contains(document.activeElement) || document.activeElement === document.body) { if (getComputedStyle(btn).pointerEvents !== 'none') btn.focus({ preventScroll: true }); else document.activeElement?.blur?.(); }
  };
  // on the desk the button first labels everything that can be clicked (the bar under the labels opens this card);
  // anywhere else (an object up close, a world) it opens the card
  initHints(xp, () => show());
  btn.addEventListener('click', () => { btn.classList.remove('pulse'); if (document.body.dataset.state === 'desk') showHints(); else show(); });
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
  panel.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { hide(); setTimeout(() => (b.dataset.go === 'home' ? goHome() : b.dataset.go === 'hints' ? (document.body.dataset.state === 'desk' ? showHints() : (goHome(), setTimeout(showHints, 1900))) : xp.activate(b.dataset.go)), 250); }));
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
