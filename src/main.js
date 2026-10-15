// KeyboardWeb, bootstrap
import { Experience } from 'app/experience';
import { state, S } from 'app/state';
import { applyMotionToCSS } from 'app/motion';
import { applyThemeToCSS } from 'app/theme';
import { audio } from 'app/audio';
import { PROJECTS, SITE, WORLDS, projectByKey, DISCOVERY_TOTAL } from 'app/data';
import { parseRoute, onRoute, setRoute } from 'app/router';
import * as ui from 'app/ui';
import { initGuide } from 'app/guide';
import { initLikes } from 'app/likes';
import { initSite, openSite } from 'app/simplesite';

applyMotionToCSS();
applyThemeToCSS();
document.body.dataset.state = 'loading';
{ const c = document.getElementById('gate-count'); if (c) c.textContent = DISCOVERY_TOTAL; }// #site is the plain website: it opens at once, over the loading screen, so a shared link needs no 3D
if (location.hash === '#site') openSite();

async function boot() {
  const canvas = document.getElementById('canvas');
  let xp;
  try {
    xp = new Experience(canvas);
  } catch (err) {
    // no WebGL2 here: say so, and hand the visitor the plain portfolio (the same work, no 3D)
    const msg = String(err.message || err).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    document.getElementById('loading').innerHTML = `<div class="loading-inner"><div class="loading-label">this desk needs WebGL2</div><div class="loading-percent" style="margin-top:12px">${msg}</div><a class="loading-out" href="/">read the portfolio instead →</a></div>`;
    window.nvTrack?.('3d_unsupported', { reason: msg.slice(0, 80) });
    return;
  }
  window.__kw = { xp, state };
  const t0 = performance.now();
  // fonts first so canvas legends render with the right typeface
  ui.loading.set(0.05);
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1800))]); } catch {}
  await xp.init((p) => ui.loading.set(0.05 + p * 0.95));
  const wait = Math.max(0, 900 - (performance.now() - t0));
  await new Promise((r) => setTimeout(r, wait));
  ui.loading.done();
  state.go(S.GATE);
  xp.pendingDirect = null;

  // ---------- gate
  const initial = parseRoute();
  // a #project-<key> link opens that project's world when it has one (worlds are where #project-* links come from), otherwise its page;
  // either way from wherever the visitor is: out of another world first, or with the page they were reading put away
  const openWorld = (wi) => () => {
    const go = () => xp.enterWorldVia(wi, WORLDS[wi].trigger);
    if (xp.sceneName === 'project') { if (xp.world3?.def.world !== WORLDS[wi]) xp.leaveWorld(go); return; }
    if (state.is(S.DETAIL)) { ui.detail.hide(); state.go(S.DESK); }
    go();
  };
  const openPage = (p) => () => { if (state.is(S.OVERVIEW)) xp.exitToDesk(); if (state.is(S.DETAIL)) { ui.detail.show(p); return; } xp.openDetail(p); };
  const directFor = (route) => {
    if (!route) return null;
    if (route.type === 'target' && route.slug === 'site') return () => openSite();
    if (route.type === 'project') {
      const wi = WORLDS.findIndex((w) => w.project === route.slug); if (wi >= 0) return openWorld(wi);
      const p = projectByKey(route.slug); return PROJECTS.includes(p) ? openPage(p) : null;
    }
    if (route.type === 'scene') return 'monitor';
    if (route.type === 'target') { const alias = { tab: 'note' }; const id = alias[route.slug] || route.slug; if (xp.world.targets[id] || xp.resolveTarget(id)) return id; }
    return null;
  };
  xp.directFor = directFor;   // (the site's sheet uses it for a link to the desk clicked before the gate)
  xp.pendingDirect = initial?.slug === 'site' ? null : directFor(initial);   // (#site is already open)

  // ---------- UI wiring
  ui.menu.build((m) => xp.activate(m.target));
  initGuide(xp);
  initLikes();
  initSite(xp);
  ui.syncFaded();   // (app/guide and app/hints have made their buttons)
  ui.hud.identity(() => xp.activate('note'));
  ui.detail.build({
    onBack: () => xp.back(),
    // the page's 3D button: back into the world the page was opened in, or into this project's own world from anywhere else
    // (the same way in as a #project- link: out of another world first, or with the page put away); mid-flight it waits, like back()
    inWorld: (p) => xp.sceneName === 'project' && xp.world3?.project.key === p?.key,
    onView3D: (p) => {
      if (xp.flight || xp._entering) return;
      const wi = WORLDS.findIndex((w) => w.project === p?.key);
      if (wi < 0 || (xp.sceneName === 'project' && xp.world3?.project.key === p.key)) { xp.back(); return; }
      // (the page hands focus back to whatever opened it, a HUD button the world hides: let go of it, as a panel's go inside
      // button does, so Enter and Space reach the world)
      openWorld(wi)(); document.activeElement?.blur?.();
    },
    // every page shown (the strip, the arrows) keeps the address bar on it, so a shared link opens the same page
    onShow: (p) => { audio.hover(); if (p && state.is(S.DETAIL)) setRoute(`project-${p.key}`); },
  });
  document.getElementById('back-btn').addEventListener('click', () => xp.back());
  // ‹ › inside a world: the same as ← → (switchWorld itself puts away an open hotspot's panel)
  const worldStep = (dir) => { if (state.is(S.PROJECT)) xp.switchWorld(dir); };
  document.getElementById('world-prev')?.addEventListener('click', () => worldStep(-1));
  document.getElementById('world-next')?.addEventListener('click', () => worldStep(1));
  document.getElementById('sound-toggle').addEventListener('click', () => { audio.toggle(); ui.hud.sound(audio.state); xp.pressKey('space'); });
  // the desk speakers pulse only while the music is actually audible
  audio.on((st) => { ui.hud.sound(st); xp.world.musicOn = st.enabled && st.playing; });
  window.addEventListener('keydown', (e) => xp.onKeyDown(e));
  window.addEventListener('keyup', (e) => xp.onKeyUp(e));
  // a hidden tab goes quiet; coming back only wakes the sound if it was on
  document.addEventListener('visibilitychange', () => { if (audio.setHidden) audio.setHidden(document.hidden); else if (audio.ctx) (document.hidden ? audio.ctx.suspend() : audio.ctx.resume()).catch?.(() => {}); });

  // ---------- routes after entry
  onRoute((r) => {
    if (state.is(S.LOADING, S.GATE, S.ENTERING, S.SWITCHING)) return;
    const go = directFor(r);
    if (!go) { if (!state.is(S.DESK)) xp.back(); return; }
    if (typeof go === 'function') go(); else xp.activate(go);
  });

  state.on((next) => { document.title = SITE.name; });
}

boot();
