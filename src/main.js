// KeyboardWeb, bootstrap
import { Experience } from 'app/experience';
import { state, S } from 'app/state';
import { applyMotionToCSS } from 'app/motion';
import { applyThemeToCSS } from 'app/theme';
import { audio } from 'app/audio';
import { PROJECTS, SITE, WORLDS, projectByKey } from 'app/data';
import { parseRoute, onRoute, setRoute } from 'app/router';
import * as ui from 'app/ui';
import { initGuide } from 'app/guide';
import { initLikes } from 'app/likes';

applyMotionToCSS();
applyThemeToCSS();
document.body.dataset.state = 'loading';

async function boot() {
  const canvas = document.getElementById('canvas');
  let xp;
  try {
    xp = new Experience(canvas);
  } catch (err) {
    document.getElementById('loading').innerHTML = `<div class="loading-inner"><div class="loading-label">this desk needs WebGL2</div><div class="loading-percent" style="margin-top:12px">${err.message}</div></div>`;
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
    if (route.type === 'project') {
      const wi = WORLDS.findIndex((w) => w.project === route.slug); if (wi >= 0) return openWorld(wi);
      const p = projectByKey(route.slug); return PROJECTS.includes(p) ? openPage(p) : null;
    }
    if (route.type === 'scene') return 'monitor';
    if (route.type === 'target') { const alias = { tab: 'note' }; const id = alias[route.slug] || route.slug; if (xp.world.targets[id] || xp.resolveTarget(id)) return id; }
    return null;
  };
  xp.pendingDirect = directFor(initial);

  // ---------- UI wiring
  ui.menu.build((m) => xp.activate(m.target));
  initGuide(xp);
  initLikes();
  ui.hud.identity(() => xp.activate('note'));
  ui.detail.build({
    onBack: () => xp.back(),
    onView3D: () => xp.back(),
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
