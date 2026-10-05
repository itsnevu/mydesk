// The experience controller: the desk is the home world, objects are the navigation, projects are miniature worlds.
import { Renderer } from 'engine/renderer';
import { Node, Camera } from 'engine/scene';
import { OrbitControls } from 'engine/controls';
import { rayFromCamera, pick } from 'engine/raycast';
import { tween, Ease } from 'engine/tween';
import { V3, degToRad, color } from 'engine/math';
import { buildWorld } from 'app/world';
import { buildDiorama, DIORAMA_ORIGIN, worldOrigin } from 'app/dioramas';
import { loadAsset } from 'engine/assets';
import { state, S } from 'app/state';
import { MOTION } from 'app/motion';
import { audio } from 'app/audio';
import { PROJECTS, TARGETS, DISCOVERY_ORDER, WORLDS, STORY, CHAPTERS, projectByKey, projectIndex } from 'app/data';
import { DESK_LIGHTS, GALLERY_LIGHTS, C } from 'app/theme';
import { setRoute } from 'app/router';
import { openSite } from 'app/simplesite';
import * as ui from 'app/ui';

const STORE_KEY = 'kw.found';
const PORTALS = WORLDS.map((w) => projectByKey(w.project));
// the letters onKeyDown binds (via their alias keys): the hover tip shows them so the shortcut is learned by pointing
export const SHORTCUTS = { note: 'A', lamp: 'S', mouse: 'C', monitor: 'W', clock: 'P', cat: 'K' };
// objects whose origin sits low get their hover title lifted clear of the top
// (measured against each object's on-screen top from the home view and the zoomed-out views)
export const TIP_LIFT = { cat: 7, catbowl: 4, pc: 12.5, speaker: 8.4, bike: 26, medals: 11, watches: 4.3, mouse: 3.5, monitor: 9.5, desklamp: 2.6, note: 0.9, chair: 66, neon: 7.8, katana: 5.6, pullup: 53, satoshi: 24.5 };

export class Experience {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas, { shadowSize: ui.isTouch ? 1024 : 2048 });
    this.scene = new Node('root');
    this.camera = new Camera(38, 1, 0.1, 700);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enabled = false;
    this.found = new Set();
    try { const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]'); for (const id of saved) if (DISCOVERY_ORDER.includes(id)) this.found.add(id); } catch {}
    this.hovered = null;
    this.pointer = { x: 0, y: 0, ndcX: 0, ndcY: 0, moved: false, down: null };
    this.focus = null;          // { id, stage } on the desk
    this.flight = null;
    this.time = 0; this.last = 0;
    this.physical = new Set();
    this.sceneName = 'desk';    // 'desk' | 'project'
    this.room = { dim: 1 };
    this.dioramas = new Map();  // key → built diorama (lazy)
    this.world3 = null;         // current diorama
    this.gallery = null;        // the project gallery (lazy)
    this.explored = new Map();  // project key → Set of hotspot ids
    this.panelAnchor = null;    // world point the spatial panel follows
    this.vpAnchor = null;       // world point for the view-project button
    this.hotspot = null;        // currently inspected hotspot
    this._bindPointer();
    // the last moment anyone touched anything (the loop slows down after a while without input)
    this._inputAt = performance.now(); const touched = () => { this._inputAt = performance.now(); };
    for (const ev of ['pointermove', 'pointerdown', 'wheel', 'keydown', 'touchstart']) addEventListener(ev, touched, { capture: true, passive: true });
    // a button in a panel (go inside, look closer) activates its target the way a second click on the object would
    addEventListener('kw:go', (e) => { if (!this.flight) this.activate(e.detail); });
  }

  async init(onProgress) {
    onProgress(0.1);
    await new Promise((r) => setTimeout(r, 30));
    // (key_01–03 are not loaded: the three work districts are the cluster_* assets now)
    const names = ['keyboard_body', 'key_04', 'key_05', 'key_06', 'key_07', 'desk_props', 'key_micro_switch', 'key_micro_tree', 'key_micro_stairs', 'key_secret', 'key_enter', 'key_plaza', 'key_garden', 'cluster_signal', 'cluster_market', 'cluster_mech', 'cluster_green'];
    const loaded = await Promise.all(names.map((n) => loadAsset(n).catch((e) => { console.warn('asset', n, e); return null; })));
    const byName = Object.fromEntries(names.map((n, i) => [n, loaded[i]]));
    const keyAssets = {}; for (const n of names) if (n !== 'keyboard_body' && n !== 'desk_props' && byName[n]) keyAssets[n] = byName[n];
    this.world = buildWorld({ keyboardBody: byName.keyboard_body, keyAssets, deskProps: byName.desk_props });
    this.scene.add(this.world.root);
    onProgress(0.7);
    this.applyDeskLighting();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    const g = this.gateCam;
    V3.copy(this.camera.position, g.position); V3.copy(this.camera.target, g.target);
    this.controls.sync();
    this.setupControls('desk');
    this.world.lampFloor = 0.55; this.world.setLightLevel(0.1);
    ui.hud.discovery(this.found, DISCOVERY_ORDER);
    // a found thing picked from the counter's list: go back to it (not mid-flight, and only once the desk is up)
    ui.hud.discoveryPick((id) => { if (!this.flight && !state.is(S.LOADING, S.GATE, S.ENTERING)) this.activate(id); });
    this.renderer.render(this.scene, this.camera);
    onProgress(1);
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  applyDeskLighting() {
    const r = this.renderer;
    r.clearColor = C.bg; r.fog = { ...DESK_LIGHTS.fog };
    r.hemi = { ...DESK_LIGHTS.hemi };
    r.dir = { direction: DESK_LIGHTS.dir.direction, color: DESK_LIGHTS.dir.color, shadow: { size: 46, near: 1, far: 100, center: [0, 0.5, 2], distance: 50 } };
    r.points = this.world.lights; r.exposure = DESK_LIGHTS.exposure;
  }
  applyWorldLighting(d) {
    const r = this.renderer;
    r.points = d.lights; r.hemi = { ...GALLERY_LIGHTS.hemi };
    r.dir = { direction: [-0.35, -1, -0.25], color: GALLERY_LIGHTS.dir.color.map((c) => c * 1.1), shadow: { size: 30, near: 1, far: 90, center: [d.origin[0], 2, 0], distance: 45 } };
    r.fog = { color: C.bg, near: 50, far: 120 }; r.exposure = 1.2;
  }

  get home() { return (ui.isTouch && innerWidth < innerHeight) || innerWidth < 760 ? this.world.mobileHome : this.world.home; }   // (a phone or tablet held sideways gets the wide desk view)
  // the gate's view: a phone held upright gets its own framing so the name plate and the keys both fit
  get gateCam() { return innerWidth < innerHeight && this.world.gateCameraPortrait ? this.world.gateCameraPortrait : this.world.gateCamera; }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 68 : 38;
  }

  // the desk can be zoomed out to the edge of the room and lowered until the camera looks straight at the walls; the room's bounds keep it inside
  setupControls(mode) {
    const c = this.controls;
    if (mode === 'desk') { c.minDistance = 2.5; c.maxDistance = 200; c.minPolar = 0.12; c.maxPolar = degToRad(87); c.minAzimuth = -Infinity; c.maxAzimuth = Infinity; c.autoRotate = false; c.enablePan = true; c.enableZoom = true; c.enableRotate = true; }
    else if (mode === 'project') { c.minDistance = 7; c.maxDistance = 26; c.minPolar = degToRad(20); c.maxPolar = degToRad(80); c.minAzimuth = degToRad(-70); c.maxAzimuth = degToRad(70); c.autoRotate = false; c.enablePan = true; c.enableZoom = true; c.enableRotate = true; }
    else if (mode === 'focus') { c.minDistance = 2; c.maxDistance = 90; c.minPolar = degToRad(10); c.maxPolar = degToRad(85); c.minAzimuth = -Infinity; c.maxAzimuth = Infinity; c.autoRotate = false; c.enablePan = false; c.enableZoom = true; c.enableRotate = true; }
    else if (mode === 'gallery') { c.minDistance = 6; c.maxDistance = 16; c.minPolar = degToRad(50); c.maxPolar = degToRad(80); c.minAzimuth = degToRad(-18); c.maxAzimuth = degToRad(18); c.autoRotate = false; c.enablePan = false; c.enableZoom = false; c.enableRotate = true; }
    else if (mode === 'overview') { c.minDistance = 12; c.maxDistance = 160; c.minPolar = 0.15; c.maxPolar = degToRad(80); c.minAzimuth = -Infinity; c.maxAzimuth = Infinity; c.autoRotate = true; c.autoRotateSpeed = 0.12; c.enablePan = false; c.enableZoom = true; c.enableRotate = true; }
    // the desk lives in a room: orbiting into a wall slides along it; inside a world there are no walls
    c.bounds = ['desk', 'focus', 'overview'].includes(mode) ? this.world?.room?.bounds || null : null;
    c.rise = mode === 'desk' ? { from: 46, rate: 0.24, max: 18 } : null;
    // at the desk the wheel / a pinch closes in on what is under the cursor (the target slides toward it, still inside the room); elsewhere it closes in on the subject
    c.zoomToCursor = mode === 'desk';
  }

  // ---------- entry (happens once)
  enter({ music = true, direct = null } = {}) {
    if (!state.is(S.GATE)) return;
    audio.setEnabled(music); audio.unlock();
    ui.hud.sound(audio.state);
    state.go(S.ENTERING);
    this.setHovered(null); ui.hud.cursor('');
    audio.keyPress(1.3, { w: this.world.gateEnter?.userData.width });
    // the room wakes in order: the lamp answers the key, then the monitor, then the keyboard's own lights
    tween.delayed(0.45, () => { audio.switchClick(); const f = { v: this.world.lampFloor }; tween.to(f, { v: 1 }, { duration: 0.5, ease: Ease.sineOut, onUpdate: () => { this.world.lampFloor = f.v; this.world.setLightLevel(this.world.lightLevel); } }); });
    tween.delayed(1.1, () => audio.powerOn());
    tween.delayed(0.9, () => audio.whoosh());
    // the entry objects sink into the desk as the room wakes; the gate is gone by the time the camera settles
    tween.delayed(0.35, () => { const g = this.world.gate; const y = { v: 0 }; tween.to(y, { v: -1.6 }, { duration: 1.6, ease: Ease.power2In, onUpdate: () => { g.position[1] = y.v; }, onComplete: () => { g.visible = false; } }); });
    const L = { v: this.world.lightLevel };
    tween.to(L, { v: 1 }, { duration: 3.0, delay: 0.7, ease: Ease.sineInOut, onUpdate: () => this.world.setLightLevel(L.v) });
    this.flyTo(this.home, { duration: MOTION.dur.intro + 0.8, ease: Ease.power3InOut, lift: 3, swing: -6, onComplete: () => {
      state.go(S.DESK);
      this.controls.enabled = true; this.controls.sync();
      this.introWave();
      tween.delayed(0.6, () => { if (state.is(S.DESK)) { ui.hud.navHints(true); this._hintsTimer = setTimeout(() => ui.hud.navHints(false), 9000); } });
      this.updateHints();
      // a deep link either names a target or hands over its own way in (a world, a project page)
      if (direct) tween.delayed(0.4, () => (typeof direct === 'function' ? direct() : this.activate(direct)));
      else this._hintTimer = setTimeout(() => { if (state.is(S.DESK)) ui.hud.toast(ui.isTouch ? '<b>tap</b> anything to see what it is. the <b>note</b> is about me' : '<b>hover</b> anything to see what it is. <b>A</b> opens about me'); }, 3200);
      // a little later, once: the keyboard can tell its own story (unless the visitor has already found it)
      if (!direct) this._storyHint = setTimeout(() => { if (state.is(S.DESK) && !this.flight && !this.found.has('art4')) ui.hud.toast(ui.isTouch ? 'the <b>orange bookmark key</b> tells the story, stop by stop' : '<b>T</b> or the <b>orange bookmark key</b>: the keyboard tells its story', 3400); }, 16000);
      // later still, once: the cat on the chair is out of the desk view, so say so (unless Tupac has been found already)
      if (!direct) this._catHint = setTimeout(() => { if (state.is(S.DESK) && !this.flight && !this.found.has('cat')) ui.hud.toast(ui.isTouch ? '<b>zzz</b>. Tupac the cat is asleep on the chair behind you: find Tupac under <b>room</b> in discoveries' : '<b>zzz</b>. Tupac the cat is asleep on the chair behind you: <b>K</b> to go and see', 3600); }, 42000);
    } });
  }

  introWave() {
    const keys = [...this.world.keys].sort((a, b) => a.position[0] - b.position[0]);
    keys.forEach((k, i) => tween.delayed(i * MOTION.stagger * 0.6, () => { k.userData.targetPress = 1; tween.delayed(0.18, () => { if (this.hovered !== k && !this.physical.has(k.userData.keyId)) k.userData.targetPress = 0; }); }));
    tween.delayed(keys.length * MOTION.stagger * 0.6 + 0.3, () => audio.keyPress(1.2));
  }

  // ---------- camera
  flyTo(stage, { duration = MOTION.dur.camera, ease = MOTION.ease.camera, lift = 0, swing = 0, onComplete } = {}) {
    const from = { p: V3.clone(this.camera.position), t: V3.clone(this.camera.target) };
    const to = { p: V3.clone(stage.position), t: V3.clone(stage.target) };
    this.controls.enabled = false;
    if (this.flight) this.flight.kill();
    const f = { k: 0 };
    this.flight = tween.to(f, { k: 1 }, { duration, ease, onUpdate: (e) => {
      V3.lerp(this.camera.position, from.p, to.p, e);
      const s = Math.sin(e * Math.PI);
      this.camera.position[1] += s * lift; this.camera.position[0] += s * swing;
      V3.lerp(this.camera.target, from.t, to.t, e);
    }, onComplete: () => { this.flight = null; this.controls.sync(); onComplete?.(); } });
    return this.flight;
  }
  /** Park the camera and hand control back with soft limits (free look around the object). */
  settle(mode = 'focus') { this.setupControls(mode); this.controls.enabled = true; this.controls.sync(); }

  // ---------- pointer
  _bindPointer() {
    const c = this.canvas, p = this.pointer;
    const set = (e) => { p.x = e.clientX; p.y = e.clientY; p.ndcX = (e.clientX / innerWidth) * 2 - 1; p.ndcY = -(e.clientY / innerHeight) * 2 + 1; p.moved = true; };
    const cursor = (v) => { if (document.body.dataset.cursor !== v) ui.hud.cursor(v); };
    // empty space you can drag says so (grab); a flight or the gate cannot be dragged, so it keeps the plain arrow
    this.idleCursor = () => (this.controls.enabled && !this.flight ? 'grab' : '');
    // a click is a press that never strayed past the slop (a finger gets a little more room than a mouse) and was let go within 500ms; anything else was a drag
    const slop = (e) => (e.pointerType === 'touch' ? 10 : 6);
    c.addEventListener('pointermove', (e) => {
      set(e); const d = p.down;
      if (d && e.pointerId === d[3]) { d[4] = Math.max(d[4], Math.hypot(e.clientX - d[0], e.clientY - d[1])); if (d[4] > slop(e) && this.controls.enabled) cursor('grabbing'); }
      else if (!d && !this.hovered?.userData.interactive) cursor(this.idleCursor());
    });
    c.addEventListener('pointerdown', (e) => {
      // a second finger turns the touch into a pinch: no click comes out of it
      if (!e.isPrimary) { p.down = null; return; }
      // a HUD button clicked earlier keeps focus, and Space/Enter would press it again instead of reaching the scene
      const a = document.activeElement; if (a && a !== document.body && a !== c) a.blur();
      set(e); p.down = [e.clientX, e.clientY, performance.now(), e.pointerId, 0];
    });
    c.addEventListener('pointerup', (e) => {
      const d = p.down; if (!d || e.pointerId !== d[3]) return; p.down = null;
      const moved = Math.max(d[4], Math.hypot(e.clientX - d[0], e.clientY - d[1])) > slop(e) || performance.now() - d[2] > 500;
      set(e); cursor(this.hovered?.userData.interactive ? 'pointer' : this.idleCursor());
      if (!moved && e.button === 0) this.click();
      // a finger leaves nothing behind to hover: without this the tapped object kept glowing (and a tapped key stayed a third pressed)
      if (e.pointerType === 'touch') { p.moved = false; this.setHovered(null); }
    });
    c.addEventListener('pointercancel', (e) => { if (p.down?.[3] === e.pointerId) { p.down = null; cursor(this.idleCursor()); } });
    c.addEventListener('pointerleave', () => this.setHovered(null));
    this.controls.onStart = () => { clearTimeout(this._hintTimer); if (state.is(S.DESK)) { clearTimeout(this._hintsTimer); this._hintsTimer = setTimeout(() => ui.hud.navHints(false), 1800); } };
  }

  updateHover() {
    if (!this.pointer.moved) return;
    this.pointer.moved = false;
    if (this.pointer.down || !this.canHover()) { this.setHovered(null); return; }
    const ray = rayFromCamera(this.camera, this.pointer.ndcX, this.pointer.ndcY);
    const candidates = state.is(S.GATE) ? this.world.gatePickables : this.sceneName === 'project' ? this.worldPicks() : this.world.pickables;
    const hit = pick(ray, candidates);
    this.setHovered(hit ? this.ownerOf(hit.mesh) : null);
    // a cursor moving over cloth keeps stirring it (app/room's curtains read the count)
    if (this.hovered?.userData.curtain) this.hovered.userData.brush = (this.hovered.userData.brush || 0) + 1;
  }
  /** What can be pointed at inside a world: its places, and on the client street every shop. */
  worldPicks() { const d = this.world3; return (d.pickList ??= [...d.hotspots.map((h) => h.mesh), ...(d.picks || [])]); }
  canHover() { return state.is(S.DESK, S.FOCUS, S.OVERVIEW, S.PROJECT, S.GATE) && !this.flight; }
  /** What a picked part stands for: its owner (the key, the district it belongs to), except a building in a district that has
   *  the focus: then each one is its own target (a client's shop opens its page, a module of the ERP its note). */
  ownerOf(m) { const u = m.userData; if (this.sceneName === 'project') return m; if ((u.shop || u.note || u.lot) && state.is(S.FOCUS) && this.focus?.id === u.ownerKey?.userData.keyId) return m; return u.ownerKey || m; }

  setHovered(mesh) {
    if (mesh === this.hovered) { if (mesh) this.placeTip(mesh); return; }
    if (this.hovered) {
      const u = this.hovered.userData;
      if (u.restY !== undefined && !this.physical.has(u.keyId) && this.focus?.id !== u.keyId) u.targetPress = 0;
      u.targetGlow = 0;
      if (u.keyId === 'mug') this.world.steamOn = false;
    }
    this.hovered = mesh;
    if (mesh) {
      const u = mesh.userData;
      // hover is a touch, not a press: the cap gives a third of its travel and the switch pre-loads; the click completes it
      if (u.restY !== undefined) u.targetPress = u.diorama ? 0.22 : 0.35;
      audio.hover({ pan: this.pointer.ndcX });
      u.targetGlow = 1;
      if (u.keyId === 'mug') this.world.steamOn = true;
      if (u.keyId === 'clock') audio.tick();
      ui.hud.cursor(u.interactive ? 'pointer' : this.idleCursor?.() || '');
      this.placeTip(mesh);
    } else { ui.hud.cursor(this.idleCursor?.() || ''); ui.hud.keyTip(0, 0, null); }
  }

  /** Everything that does something names itself on hover, nothing should need a click to find out what it is. */
  placeTip(mesh) {
    const u = mesh.userData; if (ui.isTouch) { ui.hud.keyTip(0, 0, null); return; }
    let key = '·', text = null, lift = u.restY !== undefined ? 0.4 : 1.2, at = null;
    // a place in a world: the title sits just over its brass pin
    if (u.hotspot) { const h = this.world3?.hotspots.find((x) => x.id === u.hotspot); text = h?.title; if (h) at = [h.anchor[0], h.anchor[1] + 0.9, h.anchor[2]]; }
    // a book on the shelf: its project number, as printed on the spine; the tip clears the top of the tallest book
    else if (u.book) { const p = projectByKey(u.book); if (p) { key = projectIndex(p); text = p.title; } lift = 7; }
    // a shop on the client street: whose it is and what they do, just over its roof
    else if (u.shop) { const p = u.project; if (p) { key = projectIndex(p); text = `${p.title} · ${p.industry}`; } at = mesh.localToWorld([0, mesh.geometry.bounds.max[1] + 0.08, 0]); }
    // a building in a district: what it stands for (a module of the ERP, a part of JAKASN)
    else if (u.note) { const n = u.noteDef; if (n) { key = n.world.num; text = n.title; } at = mesh.localToWorld([0, mesh.geometry.bounds.max[1] + 0.08, 0]); }
    // the free lot at the top of the client street
    else if (u.lot) { key = '+'; text = 'Your site here · say hello'; at = mesh.localToWorld([0, mesh.geometry.bounds.max[1] + 0.08, 0]); }
    else if (u.keyId && TARGETS[u.keyId]) {
      const raw = TARGETS[u.keyId];
      // a district or a chapter key: its number, its name and when it was (the story's dates, or the chapter's)
      if (raw.kind === 'world') { const wd = WORLDS[raw.world], when = STORY.find((st) => st.at === u.keyId)?.when || CHAPTERS.find((c) => c.key === wd.project)?.date; key = wd.num; text = when ? `${wd.title} · ${when}` : wd.title; lift = 0.9; }
      else if (raw.kind === 'micro') { text = raw.title.toUpperCase(); lift = 0.9; }
      // the secret stays secret; everything else names itself, and an alias key (A, S, …) teaches its shortcut
      else if (raw.kind !== 'secret') { const t = this.resolveTarget(u.keyId); text = raw.hint || t.hint || t.label?.title || t.title; key = raw.shortcut || t.shortcut || SHORTCUTS[t.id] || '·'; lift = TIP_LIFT[t.id] ?? lift; }
    }
    if (!text) { ui.hud.keyTip(0, 0, null); return; }
    // (an object whose mesh sits at the origin, like a curtain built in world space, says where its tip goes)
    if (!at && u.tipAt) at = u.tipAt;
    const wp = at || mesh.getWorldPosition([0, 0, 0]); if (!at) wp[1] += lift; const nd = this.camera.project(wp);
    let x = (nd[0] * 0.5 + 0.5) * innerWidth, y = (-nd[1] * 0.5 + 0.5) * innerHeight;
    // an anchor off screen, behind the camera or far from the pointer (a big object seen up close, a curtain, a wall) names itself
    // where the pointer is instead: the title has to be next to what you are pointing at
    const px = this.pointer.x, py = this.pointer.y;
    if (nd[2] > 1 || x < 0 || x > innerWidth || y < 0 || y > innerHeight || Math.hypot(x - px, y - py) > 320) { x = px; y = py - 22; }
    ui.hud.keyTip(x, y, key, text);
  }

  resolveTarget(id) { let t = TARGETS[id]; if (t?.kind === 'alias') return { ...TARGETS[t.to], id: t.to }; return t ? { ...t, id } : null; }

  click() {
    if (this.flight) return;
    if (state.is(S.OVERVIEW)) { this.exitToDesk(); return; }
    if (!this.hovered && this.canHover()) { const ray = rayFromCamera(this.camera, this.pointer.ndcX, this.pointer.ndcY); const hit = pick(ray, state.is(S.GATE) ? this.world.gatePickables : this.sceneName === 'project' ? this.worldPicks() : this.world.pickables); if (hit) this.setHovered(this.ownerOf(hit.mesh)); }
    const m = this.hovered; if (!m) return;
    if (state.is(S.GATE)) { if (m.userData.gate) { this.physical.add(m.userData.keyId); m.userData.targetPress = 1; this.enter({ music: m.userData.keyId === 'gate-enter', direct: this.pendingDirect }); } return; }
    if (this.sceneName === 'project') { if (m.userData.hotspot) this.inspect(m.userData.hotspot); else if (m.userData.shop) this.openShop(m); return; }
    if (m.userData.book) { this.openBook(m.userData.book); return; }
    if (m.userData.shop) { this.openShop(m); return; }
    if (m.userData.note) { this.openNote(m); return; }
    if (m.userData.lot) { audio.keyPress(0.8); ui.panel.contact(); this.anchorPanel(m, [0.5, 0.3, 0]); return; }
    const id = m.userData.keyId;
    // (cloth is not nudged: a curtain that swelled for a moment would look like a glitch, and it swings on its own)
    if (id && TARGETS[id]) { if (m.userData.restY !== undefined) audio.keyPress(1.1, this.keyVoice(m)); else if (!m.userData.curtain) this.nudge(m); this.activate(id); }
    else if (m.userData.restY !== undefined) { audio.keyPress(0.9, this.keyVoice(m)); this.bounce(m); if (!(this.focus?.id === 'keyboard' && state.is(S.FOCUS))) this.activate('keyboard'); }
  }
  /** Where a key sits on the board and how wide it is: the switch sound pans with it, and the long keys sound deeper. */
  keyVoice(m) { const u = m?.userData; return u?.width ? { pan: Math.max(-1, Math.min(1, m.position[0] / 9.125)), w: u.width } : undefined; }

  nudge(m) {
    const base = m.userData.baseScale || (m.userData.baseScale = V3.clone(m.scale));
    tween.killOf(m.scale);
    tween.to(m.scale, base.map((s) => s * 1.07), { duration: 0.12, ease: Ease.power1Out, onComplete: () => tween.to(m.scale, base, { duration: 0.45, ease: MOTION.ease.pop }) });
  }
  bounce(m) { m.userData.targetPress = 1; tween.delayed(0.12, () => { if (this.hovered !== m) m.userData.targetPress = 0; }); }

  discover(id) {
    if (!DISCOVERY_ORDER.includes(id) || this.found.has(id)) return;
    this.found.add(id);
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify([...this.found])); } catch {}
    ui.hud.discovery(this.found, DISCOVERY_ORDER);
    // the notice names the thing (never its internal id) and says how far along the visitor is
    const t = TARGETS[id]; ui.discovered(t.discover, `${this.found.size} of ${DISCOVERY_ORDER.length} found`);
    if (this.found.size === DISCOVERY_ORDER.length) tween.delayed(0.8, () => { ui.reward.show(); audio.chime(); this.introWave(); });
  }

  /** Activate a target: click → immediate reaction → camera → reveal. Never a second click. */
  activate(rawId) {
    const t = this.resolveTarget(rawId); if (!t) return;
    const id = t.id;
    if (this.flight || !state.is(S.DESK, S.FOCUS, S.OVERVIEW, S.PROJECT, S.DETAIL)) return;
    // anything else the visitor reaches for ends the story where it is
    if (this.story && t.kind !== 'story') this.stopStory();
    if (this.sceneName === 'project') { this.leaveWorld(() => this.activate(id)); return; }
    if (rawId !== id) { this.pressKey(rawId); }
    if (this.focus && this.focus.id === id && state.is(S.FOCUS) && t.kind !== 'world') { this.exitToDesk(); return; }
    ui.menu.close(); ui.panel.hide();
    // anything that moves the scene takes the project page down with it (the guide, the menu or a hash can activate from DETAIL)
    if (state.is(S.DETAIL) && !['music', 'guide', 'neon', 'desklamp', 'backlight', 'curtains', 'lights'].includes(t.kind)) { ui.detail.hide(); ui.hud.kbdHints(null); state.go(S.DESK); this._shopReturn = null; }
    const target = this.world.targets[id];
    switch (t.kind) {
      case 'music': this.pressKey('space'); audio.toggle(); ui.hud.sound(audio.state); ui.hud.toast(audio.enabled ? '<b>sound</b> on' : '<b>sound</b> off', 1400); return;
      case 'pov': { this.discover(id); audio.hover(); this.focusObject(id, () => ui.hud.toast('<b>this is the view</b>: design, code, ship', 2600)); return; }
      case 'guide': { window.dispatchEvent(new CustomEvent('kw:guide')); return; }
      // the quick way in: straight to the project pages, no walking around
      case 'quickwork': { if (state.is(S.DETAIL)) return; if (state.is(S.OVERVIEW)) { this.exitToDesk(); tween.delayed(1.6, () => this.openDetail(PROJECTS[0])); return; } const had = !!this.focus; if (had) this.exitToDesk(); tween.delayed(had ? 1.6 : 0, () => this.openDetail(PROJECTS[0])); return; }
      case 'neon': { const on = this.world.leftWall.toggle(); audio.switchClick(); ui.hud.toast(`<b>neon</b> ${on ? 'on' : 'off'}`, 1200); return; }
      case 'desklamp': { const on = !this.world.lampOn; this.setLamp(on); audio.switchClick(); ui.hud.toast(`<b>desk lamp</b> ${on ? 'on' : 'off'}`, 1200); return; }
      case 'backlight': { this.discover(id); this.pressKey('fn'); const b = this.world.setBacklight(this.world.backlightIndex + 1); ui.hud.toast(`<b>backlight</b> ${b.name}`, 1400); return; }
      case 'coffee': { this.discover(id); this.world.steamOn = true; audio.hover(); tween.delayed(2.5, () => { if (this.hovered?.userData.keyId !== 'mug') this.world.steamOn = false; }); ui.hud.toast('<b>coffee</b>, third cup. the best ideas arrive around now.', 2200); return; }
      case 'overview':
        // (the orbit swings the camera away from whatever the pointer was on: its title and its half-press go with it)
        this.setHovered(null); this.leaveFocus(id);
        this.discover(id); state.go(S.OVERVIEW, { focusKey: id }); this.focus = { id, stage: 0 };
        this.setupControls('overview'); ui.hud.sceneLabel(t.label.title, t.label.sub); ui.hud.back(true); ui.hud.navHints(false); this.pressKey('esc');
        this.flyTo(target.stages[0], { duration: MOTION.dur.cameraLong, ease: MOTION.ease.cameraSoft, lift: 3, swing: -4, onComplete: () => { this.controls.enabled = true; this.controls.sync(); } });
        this.updateHints(); setRoute(id); return;
      // on a phone held upright the screen zoom only shows a slice of the monitor: the projects open as pages instead
      // the screen opens the plain website (app/simplesite): the work as an ordinary page, for anyone who'd rather read than explore
      case 'projects': this.discover(id); audio.powerOn(); openSite(); return;
      case 'world': {
        this.discover(id);
        // a trigger that is not a keycap (the mouse) has no keycap to settle on: it is a door straight into its world
        if (!this.world.keyById[id]) { this.enterWorldVia(t.world, id); return; }
        const wd = WORLDS[t.world];
        // major projects go through the key into a full world; the others are discoveries that stay on the desk
        const again = this.focus?.id === id && state.is(S.FOCUS);
        if (!again) { this.discoverKey(t.world, id); return; }
        if (wd.tier === 'world') { this.enterWorldVia(t.world, id); return; }
        this.deeperKey(t.world, id); return;
      }
      case 'micro': case 'secret': {
        this.discover(id); const m = this.world.keyById[id]; if (m) { this.physical.add(id); m.userData.targetPress = 1; m.userData.targetGlow = 1; }
        audio.switchClick();
        this.focusObject(id, () => { ui.panel.discovery(t.title, t.sub, t.body); this.anchorPanel(m, [0.9, 0.9, 0]); if (t.kind === 'secret') ui.hud.toast('<b>secret</b> found', 1800); }); return;
      }
      case 'watches': { this.discover(id); const open = this.world.watchBox.toggle(); audio.paper(); if (open) this.focusObject(id, () => { ui.panel.discovery(t.title, t.sub, t.body, t); this.anchorPanel(this.world.targets[id].mesh, [1.6, 1.4, 0]); }); return; }
      // the Mandarin book: the cover swings open to Lesson 1 while the camera comes over (releaseKey closes it again)
      case 'book': { this.discover(id); audio.paper(); this.world.mandarin.open(true); this.focusObject(id, () => { ui.panel.discovery(t.title, t.sub, t.body, t); this.anchorPanel(this.world.targets[id].mesh, this.world.mandarin.panelOffset); }); return; }
      case 'sketches': case 'model': case 'plant': case 'gym': {
        this.discover(id); audio.paper(); const hit = this.world.targets[id].mesh; this.nudge(hit);
        if (t.kind === 'plant') { const g = hit.userData.group; const r = { v: 0 }; tween.to(r, { v: 1 }, { duration: 1.4, ease: Ease.sineInOut, onUpdate: () => { g.rotation[2] = Math.sin(r.v * Math.PI * 3) * 0.05 * (1 - r.v); } }); }
        this.focusObject(id, () => { ui.panel.discovery(t.title, t.sub, t.body, t); this.anchorPanel(hit, [1.6, 1.4, 0]); }); return;
      }
      case 'story': this.startStory(); return;
      // Tupac: from anywhere else the camera first goes over to the chair and the feeder, then the click wakes the cat
      case 'cat': {
        this.discover(id);
        const credit = '<small>3D cat by <a href="https://sketchfab.com/rt699448" target="_blank" rel="noopener">iRahulRajput</a> (CC BY 4.0)</small>';   // the scan's licence asks for this
        const poke = () => { const r = this.world.cat.poke(); ui.hud.toast(({ woke: '<b>mrrp?</b> Tupac wakes up and goes to find food', eating: 'Tupac is <b>eating</b>, give it a minute', busy: '<b>mrrp</b>' }[r] || '<b>mrrp</b>') + credit, 3200); };
        if (this.focus?.id === 'cat' || this.focus?.id === 'catbowl') poke(); else this.focusObject(id, poke);
        return;
      }
      case 'catbowl': { const r = this.world.cat.feed(); audio.paper(); ui.hud.toast(r === 'woke' ? 'bowl <b>filled</b>. Tupac heard it and is on the way' : 'bowl <b>filled</b>', 2000); return; }
      case 'keyboard': {
        this.discover(id); audio.keyPress(0.9);
        this.focusObject(id, () => { for (const k of this.world.navKeys) { k.userData.targetGlow = 1; tween.delayed(1.2, () => { if (this.hovered !== k) k.userData.targetGlow = 0; }); } });
        this.introWave();
        return;
      }
      // the lamp lights the skills; if it was off, it goes back off when you leave (leaveFocus / exitToDesk)
      case 'skills': this.discover(id); audio.switchClick(); if (this._lampWas === undefined) this._lampWas = this.world.lampOn; this.setLamp(true); this.world.skillsReveal = 1;
        // on a phone the words lit on the desk are too small to read: the same list comes up as a panel
        this.focusObject(id, ui.isTouch || innerWidth < 760 ? () => { ui.panel.skills(); this.anchorPanel(this.world.targets[id].mesh, [1.4, 1.4, 0]); } : null); return;
      case 'timeline': this.discover(id); audio.tick(); this.world.clockBody.userData.spin = 1; this.focusObject(id, () => { ui.panel.timeline((p) => { const wi = WORLDS.findIndex((w) => w.project === p.key); if (wi >= 0) this.enterWorldVia(wi, WORLDS[wi].trigger); else this.openDetail(p); }); this.anchorPanel(this.world.clockBody, [-1.7, 1.2, 0.4]); }); return;
      // the note is the about page: one click picks it up and the camera reads it (exitToDesk puts it back down)
      case 'about': this.discover(id); audio.paper(); this.world.note.userData.lift = 1; this.focusObject(id, () => { ui.panel.about(); this.anchorPanel(this.world.note, [1.4, 1.4, 0]); }); return;
      case 'machine': { this.discover(id); audio.powerOn(); const hit = this.world.targets[id].mesh; this.focusObject(id, () => { if (t.stack) ui.panel.machine(t); else ui.panel.discovery(t.title, t.sub, t.body); this.anchorPanel(hit, [5.5, 4, 0]); }); return; }
      // the bike on the wall: the camera steps back to take it in whole, and nothing but a line at the bottom covers it
      case 'bike': case 'medals': this.discover(id); audio.hover(); this.focusObject(id, () => ui.hud.toast(t.toast, 2800)); return;
      // the curtains: drawn across the window or opened again, right where you are (no camera move)
      case 'curtains': { const drawn = this.world.room.toggleCurtains(); audio.paper(); ui.hud.toast(drawn ? '<b>curtains</b> drawn' : '<b>curtains</b> open', 1300); return; }
      // the switch by the door: the room's main lights (the ceiling downlights) fade up or down, right where you are
      case 'lights': { const on = this.world.room.toggleLights(); audio.switchClick(); ui.hud.toast(on ? '<b>lights</b> on' : '<b>lights</b> off', 1200); return; }
      // the door swings out onto the lit hallway, or back shut
      case 'door': { const open = this.world.room.toggleDoor(); audio.paper(); ui.hud.toast(open ? '<b>door</b> open: the hallway light is on' : '<b>door</b> closed', 1400); return; }
      // the floor lamp in the corner: its inline switch, right where you are
      case 'floorlamp': { const on = this.world.room.toggleFloorLamp(); audio.switchClick(); ui.hud.toast(on ? '<b>floor lamp</b> on' : '<b>floor lamp</b> off', 1200); return; }
      // the air conditioner over the door: switched where you are, with its remote's beep (two for off)
      case 'aircon': { const on = this.world.room.toggleAircon(); (audio.beep ? audio.beep(on) : audio.switchClick()); ui.hud.toast(on ? '<b>AC</b> on: 24°C, cool' : '<b>AC</b> off', 1300); return; }
    }
  }

  /** Camera to an object; the object stays the hero and its panel opens beside it. */
  focusObject(id, onArrive) {
    const target = this.world.targets[id];
    this.leaveFocus(id);
    if (id !== 'note') this.world.note.userData.lift = 0;
    this.focus = { id, stage: 0 };
    state.go(S.FOCUS, { focusKey: id });
    this.setHovered(null); ui.hud.navHints(false); ui.hud.back(true);
    setRoute(id); this.updateHints();
    // a stage may carry its own zoom range (the bike on the wall is seen from across the room, not from a hand's length)
    const st = target.stages[0];
    this.flyTo(st, { duration: MOTION.dur.camera, lift: 1.0, swing: 0.6, onComplete: () => { this.settle('focus'); if (st.maxDistance) { this.controls.minDistance = st.minDistance ?? this.controls.minDistance; this.controls.maxDistance = st.maxDistance; } onArrive?.(); } });
  }
  anchorPanel(mesh, offset) { const p = mesh.getWorldPosition([0, 0, 0]); this.panelAnchor = [p[0] + offset[0], p[1] + offset[1], p[2] + offset[2]]; }
  /** Let go of what had the focus before something else takes it: its key comes back up and stops glowing, and what it lit up
   *  (the skills on the desk, the lamp it switched on, the screen's project list) goes back to rest. */
  leaveFocus(next) {
    const prev = this.focus?.id; if (!prev || prev === next) return;
    this.physical.delete(prev); const m = this.world.keyById[prev]; if (m) { if (this.hovered !== m) m.userData.targetPress = 0; m.userData.targetGlow = 0; }
    if (prev === 'lamp') this.restoreLamp();
    // the screen keeps its project list only while one of the work keys it hands over to has the focus
    if (this._screenProjects && !(next && TARGETS[next]?.kind === 'world')) { this._screenProjects = false; this.world.screenTex?.setMode('home'); this.world.setLightLevel(this.world.lightLevel); }
  }
  restoreLamp() { this.world.skillsReveal = 0; if (this._lampWas === false) this.setLamp(false); this._lampWas = undefined; }

  setLamp(on) { this.world.setLamp(on); this.world.clampLamp?.set(on); tween.killOf(this.room); tween.to(this.room, { dim: on ? 1 : 0.3 }, { duration: 0.8, ease: Ease.sineInOut }); }

  /** Monitor: screen wakes → camera pushes in → the screen becomes the door into the project world. */
  openMonitor(wi = 0) {
    const mon = this.world.targets.monitor;
    // the screen lists the work only; the who-I-am worlds have their own doors
    const work = PORTALS.filter((p) => PROJECTS.includes(p)); if (!work.includes(PORTALS[wi])) wi = 0;
    audio.powerOn();
    this.leaveFocus('monitor');
    this.world.screenTex.setMode('projects', PORTALS[wi], work); this._screenProjects = true;
    this.world.screenMat.color = [1.2, 1.2, 1.2];
    this.nudge(mon.mesh);
    this.focus = { id: 'monitor', stage: 0 };
    state.go(S.FOCUS, { focusKey: 'monitor' });
    this.setHovered(null); ui.hud.navHints(false); ui.hud.back(true); ui.hud.sceneLabel('Projects', 'the keys open them');
    this.updateHints();
    // the screen names the gallery; the key is the door
    // (the hand-over waits a beat; if the visitor backed out or went somewhere else meanwhile, it doesn't happen)
    const tok = this._monitorTok = {};
    this.flyTo(mon.stages[0], { duration: 1.0, ease: Ease.power2InOut, lift: 0.6, onComplete: () => tween.delayed(0.3, () => { if (this._monitorTok !== tok || this.focus?.id !== 'monitor' || !state.is(S.FOCUS) || this.flight) return; this.focus = null; this.discoverKey(wi, WORLDS[wi].trigger); }) });
  }

  /** A shop on the client street: its project page opens over the street, and closing it comes back to the street. */
  openShop(m) {
    const p = m.userData.project; if (!p || this.flight) return;
    audio.keyPress(0.8); this._shopReturn = this.focus?.id || null;
    this.setHovered(null); this.openDetail(p);
  }

  /** A building in a district that has the focus (a module of the ERP, a part of JAKASN): its note opens beside it, with the
   *  way into the district's world under it; the camera stays where it is. */
  openNote(m) {
    const n = m.userData.noteDef, id = this.focus?.id; if (!n || this.flight) return;
    audio.keyPress(0.8); this.nudge(m);
    const go = n.world.tier === 'world' ? `</p><p class="sp-go-row"><button type="button" class="ov-btn mono sp-go" data-go="${id}">go inside →</button>` : '';
    ui.panel.discovery(n.title, n.world.title, n.body + go); this.anchorPanel(m, [0.35, 0.25, 0]);
  }

  /** Bookshelf: a book is a project, its world when it has one, otherwise its page (the same routing as the clock's timeline). */
  openBook(key) {
    if (this.flight) return; const p = projectByKey(key); if (!p) return;
    // let go of the book first: its tip and its slide-out would otherwise outlive the click (the project page does not clear hover)
    this.setHovered(null); ui.panel.hide();
    const wi = WORLDS.findIndex((w) => w.project === key);
    if (wi >= 0) this.enterWorldVia(wi, WORLDS[wi].trigger); else this.openDetail(p);
  }

  /** Camera pose (world space) that looks through `frame` the way `cam` looks at a space whose origin is `origin`. */
  frameStage(frame, cam, origin) {
    frame.updateWorld(frame.parent ? frame.parent.worldMatrix : null);
    const loc = (p) => [p[0] - origin[0], p[1] - origin[1], p[2] - origin[2]];
    return { position: frame.localToWorld(loc(cam.position)), target: frame.localToWorld(loc(cam.target)) };
  }

  // ---------- nine triggers, nine worlds
  /** The small end of a portal: a frame on the trigger object that maps world space onto its top surface. */
  triggerFrame(id) {
    if (this.world.keyById[id]?.userData.frame) return this.world.keyById[id].userData.frame;
    this.frames = this.frames || {};
    if (this.frames[id]) return this.frames[id];
    const mesh = this.world.keyById[id] || this.world.targets[id]?.mesh; if (!mesh) return null;
    const f = new Node('frame:' + id); const w = (mesh.userData.width || 1.2) * 0.9; const s = w / 38; f.scale = [s, s, s];
    f.position = [0, (mesh.userData.restY !== undefined ? 0.28 : 0.4), 0]; mesh.add(f); this.frames[id] = f; return f;
  }
  /** Click → the object reacts → light leaks → the camera approaches, enters and passes through it into the world. */
  async enterWorldVia(wi, triggerId) {
    const def = WORLDS[wi]; const project = projectByKey(def.project); if (!project || this.flight || this._entering) return;
    const trigger = this.world.keyById[triggerId] || this.world.targets[triggerId]?.mesh; const frame = this.triggerFrame(triggerId);
    if (!frame) return;
    this.lastWorld = wi; this.enteredVia = triggerId;
    if (trigger.userData.restY !== undefined) { this.physical.add(triggerId); trigger.userData.targetPress = 1; } else this.nudge(trigger);
    if (triggerId === 'note') { audio.paper(); this.world.note.userData.lift = 1; }
    trigger.userData.targetGlow = 1;
    this.setHovered(null); ui.panel.hide(); ui.hud.navHints(false); ui.hud.back(true);
    ui.hud.sceneLabel(null); ui.hud.kbdHints(null); // the world's name card waits for the world itself
    // the world's geometry may still be on its way; the approach covers the wait
    if (!def.__json) {
      const st0 = state.current; this._entering = true;
      try { def.__json = await loadAsset(def.asset); } catch (e) { console.warn(e); ui.hud.toast('that world is still being built', 1600); }
      this._entering = false;
      // the visitor backed out, or set off somewhere else, while the geometry loaded
      if (!def.__json || state.current !== st0 || this.flight) { this.releaseTrigger(triggerId); if (state.is(S.DESK)) ui.hud.back(false); if (state.is(S.DESK, S.FOCUS)) this.updateHints(); return; }
    }
    const d = this.getDiorama(project); // from here the approach flight itself holds off a second entry
    const st = this.frameStage(frame, d.camera, d.origin);
    const fill = this.world.lights.find((l) => l.id === 'fill'); const mp = trigger.getWorldPosition([0, 0, 0]);
    const base = fill ? { p: [...fill.position], i: fill.intensity, dist: fill.distance } : null; const L = { k: 0 }; const dim0 = this.room.dim; // the desk lamp may be off: dim from there, and leave it so
    tween.to(L, { k: 1 }, { duration: 1.5, ease: Ease.sineIn, onUpdate: () => { if (fill) { fill.position = [mp[0], mp[1] + 0.8, mp[2] + 0.4]; fill.intensity = base.i + L.k * 9; fill.distance = 8; } this.room.dim = dim0 * (1 - L.k * 0.55); } });
    audio.powerOn();
    d.wake.wake = 0.25; d.wake.target = 0.35; // distant view: only a few warm lights
    this.flyTo(st, { duration: 2.2, ease: Ease.power3In, onComplete: () => { if (fill) { fill.position = base.p; fill.intensity = base.i; fill.distance = base.dist; } this.room.dim = dim0; this.emerge(project, d); tween.delayed(0.3, () => { d.wake.target = 1; }); } });
  }
  /** A discovery that stays on the desk: the key depresses, its miniature lights, the camera settles close, a note appears. */
  discoverKey(wi, id) {
    const wd = WORLDS[wi]; const m = this.world.keyById[id]; if (!m) return;
    this.physical.add(id); m.userData.targetPress = 1; m.userData.targetGlow = 1; audio.keyPress(1.1, this.keyVoice(m));
    const target = this.world.targets[id]; this.leaveFocus(id);
    this.focus = { id, stage: 1 }; state.go(S.FOCUS, { focusKey: id });
    this.setHovered(null); ui.hud.navHints(false); ui.hud.back(true); setRoute(id); this.updateHints();
    ui.hud.sceneLabel(`${wd.num} / ${wd.title}`, wd.sub);
    const first = Object.values(wd.hotspots)[0];
    this.flyTo(target.stages[1] || target.stages[0], { duration: MOTION.dur.camera, lift: 0.8, swing: 0.4, onComplete: () => {
      // what to do next, said once and given a button: go in (a full world) or look closer (a discovery); the client street also
      // says its shops are clickable
      // (a touch screen has no pointing: a tap opens the shop or the building's note straight away)
      const town = this.world.towns?.[id];
      const shops = !town ? '' : town.shops ? `<br><br><em>${ui.isTouch ? 'tap a shop to open its page' : 'point at a shop to see whose it is, click it to open its page'}</em>` : `<br><br><em>${ui.isTouch ? 'tap a building to read what it does' : 'point at a building to see what it does'}</em>`;
      const go = wd.tier === 'world' ? `<button type="button" class="ov-btn mono sp-go" data-go="${id}">go inside →</button>` : `<button type="button" class="ov-btn mono sp-go" data-go="${id}">look closer →</button>`;
      this.settle('focus'); ui.panel.discovery(wd.title, wd.sub, `${first.body}${shops}</p><p class="sp-go-row">${go}`); this.anchorPanel(m, [(m.userData.width || 1) * 0.6, 0.9, 0]);
    } });
  }
  /** One layer deeper on a medium discovery: a macro view over the miniature and the next note. */
  deeperKey(wi, id) {
    const wd = WORLDS[wi]; const m = this.world.keyById[id]; const f = m?.userData.frame; if (!m) return;
    const layer = (this.focus.stage || 1) + 1; this.focus.stage = layer;
    const hs = Object.values(wd.hotspots); const h = hs[Math.min(layer - 1, hs.length - 1)];
    const p = m.getWorldPosition([0, 0, 0]); const fp = f ? f.getWorldPosition([0, 0, 0]) : p;
    const ang = 0.9 + layer * 0.7; const rad = 0.95 - Math.min(layer, 3) * 0.12;
    const base = Math.max(fp[1], p[1] + 0.35); const cx = p[0], cz = p[2] - 0.1;
    const st = { position: [cx + Math.cos(ang) * rad, base + 0.7 + 0.1 * layer, cz + Math.sin(ang) * rad + 0.35], target: [cx, base + 0.22, cz] };
    audio.keyPress(0.8); this.nudge(m);
    this.flyTo(st, { duration: 1.1, ease: Ease.power2InOut, onComplete: () => { this.settle('focus'); ui.panel.discovery(h.title, wd.title, h.body + (layer < hs.length ? `</p><p class="sp-go-row"><button type="button" class="ov-btn mono sp-go" data-go="${id}">look closer →</button>` : '')); this.anchorPanel(m, [(m.userData.width || 1) * 0.6, 0.9, 0]); } });
  }
  releaseTrigger(id) {
    const t = this.world.keyById[id] || this.world.targets[id]?.mesh; if (!t) return;
    this.physical.delete(id); if (t.userData.restY !== undefined) t.userData.targetPress = 0; t.userData.targetGlow = 0;
    if (id === 'note') this.world.note.userData.lift = 0;
  }

  /** The exact moment the view of the miniature and the view of the full world coincide: swap, no cut. */
  emerge(project, d) {
    if (!state.go(S.SWITCHING)) return;
    this.sceneName = 'project'; this.world3 = d;
    this.world.root.visible = false; for (const o of this.dioramas.values()) o.root.visible = o === d;
    this.applyWorldLighting(d);
    V3.copy(this.camera.position, d.camera.position); V3.copy(this.camera.target, d.camera.target); this.controls.sync();
    state.go(S.PROJECT, { project: project.key });
    // a key focused on the desk before going in is let go now; the trigger itself is released on the way back out, so the return lines up
    const fk = this.focus?.id; if (fk && fk !== this.enteredVia) this.releaseTrigger(fk);
    this.focus = null; this.hotspot = null; this.hotspotView = null; this.panelAnchor = null; this.labelAnchor = null; this._entering = false;
    ui.hud.back(true); setRoute(`project-${project.key}`); this.updateHints();
    audio.whoosh();
    d.introAt = this.time + 0.9; d.outroAt = -1; // the pins ease in one by one as the camera slows
    // a breath of air: the camera keeps its momentum and eases out into the district; the name card fades in once it has settled
    this.flyTo(d.view, { duration: 1.6, ease: Ease.power3Out, onComplete: () => { this.settle('project'); this.showWorldLabel(d); this.maybeShowViewProject(); if (!this._worldTipShown) { this._worldTipShown = true; ui.hud.toast('<b>look around</b>, the small things are clickable', 2400); } } }); // (the tip once per visit, not on every world)
  }
  /** The world's name card, anchored in front of the plinth; a phone gets the short subtitle so the card fits its width. */
  showWorldLabel(d) {
    const wd = d.def.world; ui.hud.sceneLabel(`${wd.num} / ${wd.title}`, innerWidth < 560 ? wd.sub : `${wd.sub} · ${d.def.tagline}`);
    this.labelAnchor = d.labelAnchor(this.camera);
  }

  // ---------- project worlds
  getDiorama(project) {
    if (!this.dioramas.has(project.key)) { const d = buildDiorama(project, worldOrigin(PORTALS.findIndex((p) => p.key === project.key))); d.root.visible = this.sceneName === 'project'; this.scene.add(d.root); this.dioramas.set(project.key, d); }
    return this.dioramas.get(project.key);
  }
  enterWorld(project) { const wi = WORLDS.findIndex((w) => w.project === project.key); if (wi >= 0) this.enterWorldVia(wi, WORLDS[wi].trigger); }
  inspect(id) {
    const d = this.world3, h = d.hotspots.find((x) => x.id === id); if (!h) return;
    if (!this.explored.has(d.project.key)) this.explored.set(d.project.key, new Set());
    const set = this.explored.get(d.project.key); const first = !set.has(id); set.add(id);
    this.hotspot = h; audio.keyPress(0.8); this.nudge(h.mesh);
    if (h.panel === 'about') ui.panel.about(); else if (h.panel === 'contact') ui.panel.contact(); else ui.panel.hotspot(d.project, h);
    // the camera frames the subject on the left and the panel hangs off its right edge; the panel names the place, so the name card steps aside
    const hc = d.hotspotCamera(h, this.camera); this.hotspotView = hc; this.panelAnchor = [...hc.panel];
    ui.hud.sceneLabel(null); ui.hud.kbdHints([['ESC', 'close'], ['DRAG', 'look']]); this.maybeShowViewProject();
    this.flyTo(hc, { duration: 0.9, ease: MOTION.ease.camera, onComplete: () => { this.settle('project'); this.maybeShowViewProject(); } });
    if (first && set.size === 2 && PROJECTS.includes(d.project)) ui.hud.toast('<b>view project</b> unlocked', 1600);
  }
  maybeShowViewProject() {
    const d = this.world3; if (!d) return;
    const set = this.explored.get(d.project.key); if (!(set && set.size >= 2 && PROJECTS.includes(d.project))) return;
    // over the district the button stands at the plinth's front-right corner; beside a hotspot it tucks in under the panel, where the eye already is
    const hc = this.hotspot && this.hotspotView; const px = hc ? (2 * hc.dist * Math.tan((this.camera.fov * Math.PI) / 360)) / innerHeight : 0;
    this.vpAnchor = hc ? hc.panel.map((v, k) => v + (hc.right[k] * 118 - hc.up[k] * 165) * px) : [d.origin[0] + 14, 6.0, 13.5];
    ui.viewProject.show(d.project, () => this.openDetail(d.project));
  }
  closeHotspot() {
    this.hotspot = null; this.hotspotView = null; this.panelAnchor = null; ui.panel.hide(); this.maybeShowViewProject();
    const d = this.world3; this.flyTo(d.view, { duration: 0.9, onComplete: () => { this.settle('project'); this.showWorldLabel(d); } }); this.updateHints();
  }
  async switchWorld(dir) {
    if (this.flight || this._entering || !state.is(S.PROJECT)) return;
    const from = this.world3; const i = PORTALS.findIndex((p) => p.key === from.project.key);
    const ni = (i + dir + PORTALS.length) % PORTALS.length; const next = PORTALS[ni]; const wdef = WORLDS[ni];
    if (!wdef.__json) {
      this._entering = true; try { wdef.__json = await loadAsset(wdef.asset); } catch (e) { ui.hud.toast('that world is still being built', 1600); } this._entering = false;
      if (!wdef.__json || this.flight || !state.is(S.PROJECT) || this.world3 !== from) return; // left, or moved on, while it loaded
    }
    this.releaseTrigger(this.enteredVia); this.lastWorld = ni; this.enteredVia = wdef.trigger; // the way back out is through the new world's key
    const d = this.getDiorama(next); d.root.visible = true;
    this.setHovered(null); ui.panel.hide(); ui.viewProject.hide(); ui.hud.kbdHints(null); ui.hud.sceneLabel(null); this.hotspot = null; this.hotspotView = null; this.panelAnchor = null; this.vpAnchor = null;
    audio.whoosh(); state.go(S.PROJECT, { project: next.key });
    d.wake.wake = 0.3; d.wake.target = 1;
    const wrap = i + dir < 0 || i + dir >= PORTALS.length; const lift = wrap ? 26 : 12, dur = wrap ? 2.4 : 1.9;
    d.introAt = this.time + dur - 0.5; d.outroAt = -1; from.outroAt = this.time; // the pins left behind bow out
    tween.delayed(0.9, () => { this.world3 = d; this.applyWorldLighting(d); setRoute(`project-${next.key}`); });
    this.flyTo(d.view, { duration: dur, ease: Ease.power2InOut, lift, onComplete: () => { for (const o of this.dioramas.values()) o.root.visible = o === d; this.settle('project'); this.showWorldLabel(d); this.maybeShowViewProject(); this.updateHints(); } });
  }
  leaveWorld(after) {
    if (!state.go(S.SWITCHING)) return;
    const project = this.world3.project; const wi = WORLDS.findIndex((w) => w.project === project.key);
    const triggerId = this.enteredVia || WORLDS[wi]?.trigger; const frame = triggerId ? this.triggerFrame(triggerId) : null;
    this.setHovered(null); ui.panel.hide(); ui.viewProject.hide(); ui.detail.hide(); ui.hud.keyTip(0, 0, null); ui.hud.kbdHints(null); ui.hud.sceneLabel(null);
    this.controls.enabled = false; audio.whoosh();
    const d = this.world3; d.outroAt = this.time; // the miniature on the key has no pins: they bow out before the swap
    this.flyTo(d.camera, { duration: 0.9, ease: Ease.power2In, onComplete: () => {
      if (!frame) { this.exitWorldToDesk(after); return; }
      const st = this.frameStage(frame, d.camera, d.origin);
      this.sceneName = 'desk'; this.world3 = null; this.hotspot = null; this.hotspotView = null; this.panelAnchor = null; this.labelAnchor = null; this.vpAnchor = null;
      for (const o of this.dioramas.values()) o.root.visible = false; this.world.root.visible = true;
      this.applyDeskLighting(); this.world.screenTex.setMode('home'); this.world.setLightLevel(this.world.lightLevel);
      if (this.focus) this.releaseKey(this.focus.id); this.focus = null;
      V3.copy(this.camera.position, st.position); V3.copy(this.camera.target, st.target); this.controls.sync();
      state.go(S.DESK); ui.hud.back(false); setRoute(''); this.updateHints();
      tween.delayed(0.5, () => this.releaseTrigger(triggerId));
      this.flyTo(this.home, { duration: 2.2, ease: Ease.power3Out, lift: 2.5, onComplete: () => { this.settle('desk'); after?.(); } });
    } });
  }
  exitWorldToDesk(after) {
    this.sceneName = 'desk'; this.world3 = null; this.hotspot = null; this.hotspotView = null; this.panelAnchor = null; this.labelAnchor = null; this.vpAnchor = null;
    if (this.enteredVia) this.releaseTrigger(this.enteredVia);
    for (const o of this.dioramas.values()) o.root.visible = false; this.world.root.visible = true;
    this.applyDeskLighting(); this.world.screenTex.setMode('home'); this.world.setLightLevel(this.world.lightLevel);
    V3.copy(this.camera.position, this.home.position); V3.copy(this.camera.target, this.home.target); this.controls.sync();
    state.go(S.DESK); ui.hud.back(false); setRoute(''); this.updateHints(); this.settle('desk'); after?.();
  }

  pressKey(id, hold = false) { const m = this.world.keyById[id]; if (!m) return; m.userData.targetPress = 1; if (!hold) tween.delayed(0.16, () => { if (this.hovered !== m && !this.physical.has(id)) m.userData.targetPress = 0; }); }
  releaseKey(id) { const m = this.world.keyById[id]; if (m && this.hovered !== m && !this.physical.has(id)) m.userData.targetPress = 0; if (id === 'mandarin') this.world.mandarin.open(false); }

  // ---------- the final stage: the project page
  openDetail(p) {
    if (!PROJECTS.includes(p) || !state.go(S.DETAIL, { project: p.key })) return;
    ui.panel.hide(); ui.viewProject.hide(); ui.hud.back(false); ui.hud.sceneLabel(null);
    ui.detail.show(p);
    ui.hud.kbdHints([['ESC', 'back'], ['←', 'prev'], ['→', 'next']]);
    setRoute(`project-${p.key}`);
  }

  /** The universal "back", Esc, X button. */
  back() {
    if (ui.menu.isOpen) { ui.menu.close(); return; }
    if (this.flight) return;
    switch (state.current) {
      case S.DETAIL:
        ui.detail.hide();
        // back into the world: the same "01 / Title" card as on arrival (none while a hotspot's panel is open: the panel names the place)
        if (this.sceneName === 'project') { state.go(S.PROJECT); ui.hud.back(true); if (!this.hotspot) this.showWorldLabel(this.world3); this.updateHints(); this.maybeShowViewProject(); setRoute(`project-${this.world3.project.key}`); }
        // a page opened from a shop on the street: back to the street, where the next shop is a point away
        else if (this._shopReturn && this.focus?.id === this._shopReturn) { const id = this._shopReturn; this._shopReturn = null; state.go(S.FOCUS, { focusKey: id }); ui.hud.back(true); setRoute(id); this.updateHints(); ui.hud.toast(ui.isTouch ? '<b>tap</b> another shop' : '<b>point at</b> another shop, or <b>esc</b> to step back', 2200); }
        else { state.go(S.DESK); this.exitToDesk(); }
        break;
      case S.PROJECT: if (this.hotspot) this.closeHotspot(); else this.leaveWorld(); break;
      case S.FOCUS: case S.OVERVIEW: this.exitToDesk(); break;
    }
  }

  exitToDesk() {
    this._shopReturn = null; this.stopStory();
    const prev = this.focus?.id; if (prev) { this.physical.delete(prev); this.releaseKey(prev); const pm = this.world.keyById[prev]; if (pm) pm.userData.targetGlow = 0; }
    this.focus = null; this.panelAnchor = null; ui.panel.hide();
    if (this.world.note.userData.lift) this.world.note.userData.lift = 0;
    this.restoreLamp(); this._monitorTok = null;
    if (this.world.screenTex) { this._screenProjects = false; this.world.screenTex.setMode('home'); this.world.setLightLevel(this.world.lightLevel); }
    if (!state.go(S.DESK, { focusKey: null })) return;
    ui.hud.sceneLabel(null); ui.hud.back(false); setRoute(''); this.updateHints();
    // continue exploring from where you are: the camera eases back only a little, it does not snap home
    const cp = this.camera.position, ct = this.camera.target; const d = [cp[0] - ct[0], cp[1] - ct[1], cp[2] - ct[2]]; const L = Math.hypot(...d); const k = Math.max(1, 9 / Math.max(L, 0.1));
    const back = { position: [ct[0] + d[0] * k, Math.max(ct[1] + d[1] * k, 5), ct[2] + d[2] * k], target: [ct[0] * 0.5, 0.8, ct[2] * 0.5] };
    this.flyTo(back, { duration: MOTION.dur.camera, lift: 0.8, onComplete: () => this.settle('desk') });
  }

  // ---------- the story: the keyboard read in the order it happened (data.js STORY), one stop at a time
  startStory() {
    if (this.flight) return;
    if (state.is(S.DETAIL)) { ui.detail.hide(); ui.hud.kbdHints(null); state.go(S.DESK); }
    this.discover('art4'); this.pressKey('art4'); audio.paper();
    this.story = { i: -1 };
    this.storyGo(0); setRoute('story');
  }
  storyGo(i) {
    if (!this.story || this.flight || i < 0) return;
    if (i >= STORY.length) { this.activate('mouse'); return; }
    const prev = STORY[this.story.i], stop = STORY[i], id = stop.at;
    this.story.i = i;
    ui.panel.hide(); ui.menu.close(); this.leaveFocus(id);
    // the stop's key goes down and its district wakes, as if it had been pressed
    const m = this.world.keyById[id];
    if (m) { this.physical.add(id); m.userData.targetPress = 1; m.userData.targetGlow = 1; }
    this.focus = { id, stage: 0, story: true }; state.go(S.FOCUS, { focusKey: id });
    this.setHovered(null); ui.hud.navHints(false); ui.hud.back(true); ui.hud.kbdHints(null); ui.hud.sceneLabel(null);
    // the way here is typed: from the bookmark key to the first stop, then from each stop to the next
    const from = !prev || prev.at === 'keyboard' ? 'art4' : prev.at; if (i > 0) this.typeTrail(from, id);
    const t = TARGETS[id], wd = t?.kind === 'world' ? WORLDS[t.world] : null;
    // the last stop ends where a visit should: saying hello
    const last = i === STORY.length - 1;
    ui.story.show(stop, i, STORY.length, { onNext: () => (last ? this.activate('mouse') : this.storyGo(this.story.i + 1)), onPrev: () => this.storyGo(this.story.i - 1), onClose: () => this.exitToDesk(), onGo: () => this.storyEnter() }, { go: wd ? (wd.tier === 'world' ? 'go inside' : 'open it') : null, next: last ? 'say hello →' : null });
    this.flyTo(this.storyStage(id), { duration: i === 0 ? 1.6 : 1.5, lift: 0.7, swing: 0.3, onComplete: () => this.settle('focus') });
  }
  /** Where the camera stands for a stop: the whole board for the first; then each place seen three-quarters from the front, from
   *  as far as its size asks (a district from further than a key), so all of it is in the frame. */
  storyStage(id) {
    const portrait = innerWidth < innerHeight;
    if (id === 'keyboard') return portrait ? { position: [0.2, 16, 15], target: [0.2, 0.6, -0.4] } : { position: [0.4, 10.5, 12.5], target: [0.2, 0.6, -0.6] };
    const m = this.world.keyById[id]; m.updateWorld(m.parent?.worldMatrix);
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    m.traverse((n) => { if (!n.pickable || !n.geometry) return; const b = n.geometry.bounds; for (const x of [b.min[0], b.max[0]]) for (const y of [b.min[1], b.max[1]]) for (const z of [b.min[2], b.max[2]]) { const q = n.localToWorld([x, y, z]); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], q[k]); mx[k] = Math.max(mx[k], q[k]); } } });
    // a single key sits among taller caps: it is seen from higher up, or the caps in front of it would hide it
    const size = Math.max(mx[0] - mn[0], mx[2] - mn[2], (mx[1] - mn[1]) * 1.4), small = size < 2, dist = (small ? 1.6 + size * 1.4 : 1.6 + size * 1.5) * (portrait ? 1.7 : 1);
    const target = [(mn[0] + mx[0]) / 2, mn[1] + (mx[1] - mn[1]) * 0.4, (mn[2] + mx[2]) / 2], dir = V3.normalize([0, 0, 0], small ? [0.16, 1.75, 1] : [0.22, 0.62, 1]);
    // the card covers the foot of the screen: the camera drops a little along its own up, so the stop sits in the upper part
    const up = V3.normalize([0, 0, 0], [-dir[0] * dir[1], 1 - dir[1] * dir[1], -dir[2] * dir[1]]), k = dist * (portrait ? 0.2 : small ? 0.05 : 0.12);
    return { position: target.map((c, i) => c + dir[i] * dist - up[i] * k), target: target.map((c, i) => c - up[i] * k) };
  }
  /** "go inside" on a stop: the story ends there, and the stop opens as a second click on it would. */
  storyEnter() {
    const stop = STORY[this.story?.i]; if (!stop || this.flight) return; const id = stop.at, t = TARGETS[id];
    if (t?.kind !== 'world') return;
    this.stopStory();
    const wd = WORLDS[t.world];
    if (wd.tier === 'world') this.enterWorldVia(t.world, id); else this.discoverKey(t.world, id);
  }
  /** Put the story away where it stands (the camera stays; exitToDesk and every other way out call this). */
  stopStory() { if (!this.story) return; this.story = null; ui.story.hide(); }
  /** The keys between two stops light up one after another, as if the story were being typed from one to the next. */
  typeTrail(a, b) {
    const ka = this.world.keyById[a], kb = this.world.keyById[b]; if (!ka || !kb) return;
    const pa = ka.getWorldPosition([0, 0, 0]), pb = kb.getWorldPosition([0, 0, 0]), dx = pb[0] - pa[0], dz = pb[2] - pa[2], L2 = dx * dx + dz * dz || 1;
    const keys = [];
    for (const k of this.world.keys) {
      const u = k.userData; if (u.diorama || u.gate || u.restY === undefined || !k.material.emissiveMap) continue;
      const p = k.getWorldPosition([0, 0, 0]), f = ((p[0] - pa[0]) * dx + (p[2] - pa[2]) * dz) / L2; if (f <= 0.02 || f >= 0.98) continue;
      if (Math.hypot(pa[0] + dx * f - p[0], pa[2] + dz * f - p[2]) < 0.75) keys.push([f, k]);
    }
    keys.sort((p, q) => p[0] - q[0]);
    keys.forEach(([f, k], n) => tween.delayed(0.12 + f * 0.85, () => {
      const u = k.userData; if (this.physical.has(u.keyId)) return;
      u.flash = 1; u.targetPress = 0.7; if (n % 2 === 0) audio.keyPress(0.3, this.keyVoice(k));
      this.world.trailAt = k.getWorldPosition([0, 0, 0]);
      tween.delayed(0.16, () => { if (this.hovered !== k && !this.physical.has(u.keyId)) u.targetPress = 0; });
      if (n === keys.length - 1) tween.delayed(0.5, () => { this.world.trailAt = null; });
    }));
  }
  /** The labels the keyboard's map shows: every district and diorama key on the board, and the story key. */
  mapItems() {
    if (this._mapItems) return this._mapItems;
    const when = (id) => STORY.find((s) => s.at === id)?.when, lift = { signal: 1.55, market: 0.95, lab: 0.95 };
    this._mapItems = WORLDS.filter((w) => this.world.keyById[w.trigger]).map((w) => ({ id: w.trigger, num: w.num, title: w.title, sub: when(w.trigger) || CHAPTERS.find((c) => c.key === w.project)?.date || '', lift: lift[w.trigger] ?? 0.85 }));
    if (this.world.keyById.art4) this._mapItems.push({ id: 'art4', num: 'T', title: 'The story', sub: 'start here', lift: 0.7, story: true });
    return this._mapItems;
  }

  // ---------- keyboard input
  _keyMap(k) {
    const map = { Escape: 'esc', Tab: 'tab', F1: 'f1', F2: 'f2', F3: 'f3', F4: 'f4', Enter: 'enter', ' ': 'space', ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', CapsLock: 'caps', Shift: 'lshift', Control: 'lctrl', Alt: 'lalt', Meta: 'win', Home: 'home', '1': 'n1', '2': 'n2', w: 'w', a: 'a', s: 's', d: 'd', c: 'c', p: 'p', n: 'n' };
    return map[k] ?? map[k.toLowerCase?.()] ?? null;
  }
  onKeyDown(e) {
    const tag = document.activeElement?.tagName || '';
    if (/^(INPUT|TEXTAREA)$/.test(tag)) return;
    // Enter / Space on a focused button or link belong to that control, not to the desk
    if (/^(BUTTON|A)$/.test(tag) && (e.key === 'Enter' || e.key === ' ')) return;
    const k = e.key, id = this._keyMap(k);
    // Ctrl/Cmd/Alt chords (copy, save, print, select all…) belong to the browser, not the desk
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (id && this.world.keyById[id] && !this.physical.has(id)) { this.physical.add(id); this.world.keyById[id].userData.targetPress = 1; if (state.is(S.DESK, S.FOCUS, S.OVERVIEW)) audio.keyPress(1, this.keyVoice(this.world.keyById[id])); }
    if (e.repeat) return;
    if (state.is(S.GATE) && (k === 'Enter' || k === ' ')) { e.preventDefault(); const m = this.world.gateEnter; this.physical.add('gate-enter'); m.userData.targetPress = 1; this.enter({ music: k === 'Enter', direct: this.pendingDirect }); return; }
    if (state.is(S.LOADING, S.GATE, S.ENTERING, S.SWITCHING)) return;
    // (Tab is left to the browser: it walks the HUD, the panels and the project page; the 3D Tab cap still presses above)
    if (['F1', 'F2', 'F3', ' '].includes(k)) e.preventDefault();
    if (k === 'Escape') { if (ui.menu.isOpen) { ui.menu.close(); return; } if (state.is(S.DESK)) this.activate('esc'); else this.back(); return; }
    // the story walks with the arrows (and Space); Enter steps into the stop
    if (this.story && state.is(S.FOCUS)) {
      if (k === 'ArrowRight' || k === ' ') { e.preventDefault(); this.storyGo(this.story.i + 1); return; }
      if (k === 'ArrowLeft') { this.storyGo(this.story.i - 1); return; }
      if (k === 'Enter') { this.storyEnter(); return; }
    }
    if (k === 'm' || k === 'M') { audio.toggle(); ui.hud.sound(audio.state); this.pressKey('space'); return; }
    if (k === ' ') { if (state.is(S.DESK, S.FOCUS, S.OVERVIEW)) this.activate('space'); else { audio.toggle(); ui.hud.sound(audio.state); } return; }
    if (state.is(S.DETAIL)) { const i = PROJECTS.indexOf(ui.detail.current), n = PROJECTS.length; const p = k === 'ArrowLeft' ? PROJECTS[(i - 1 + n) % n] : k === 'ArrowRight' ? PROJECTS[(i + 1) % n] : null; if (p) { ui.detail.show(p); setRoute(`project-${p.key}`); } return; }
    if (state.is(S.PROJECT)) { if (k === 'ArrowLeft') this.switchWorld(-1); if (k === 'ArrowRight') this.switchWorld(1); if (k === 'Enter' && this.explored.get(this.world3.project.key)?.size >= 2) this.openDetail(this.world3.project); return; }
    if (state.is(S.DESK, S.FOCUS, S.OVERVIEW)) {
      // F1–F3 (or 1–3) are the three work districts on the keyboard
      if (['F1', '1'].includes(k)) this.activate('signal'); if (['F2', '2'].includes(k)) this.activate('market'); if (['F3', '3'].includes(k)) this.activate('lab');
      if (k === 'a' || k === 'A') this.activate('a'); if (k === 's' || k === 'S') this.activate('s'); if (k === 'c' || k === 'C') this.activate('c'); if (k === 'w' || k === 'W') this.activate('w'); if (k === 'p' || k === 'P') this.activate('p');
      if (k === 'Enter') this.activate('monitor');
      // the bike hangs behind the chair, out of the desk view: B turns the camera round to it
      if (k === 'b' || k === 'B') this.activate('bike');
      // T tells the keyboard's story, stop by stop
      if (k === 't' || k === 'T') this.activate('art4');
      // K goes to Tupac, asleep on the chair behind you
      if (k === 'k' || k === 'K') this.activate('cat');
    }
  }
  onKeyUp(e) { const id = this._keyMap(e.key); if (id) { const held = this.physical.delete(id); const m = this.world.keyById[id]; if (held && m && state.is(S.DESK, S.FOCUS, S.OVERVIEW)) audio.keyRelease?.(1, this.keyVoice(m)); if (m && this.hovered !== m && this.focus?.id !== id) m.userData.targetPress = 0; } }

  updateHints() {
    if (ui.isTouch) return;
    switch (state.current) {
      case S.DESK: ui.hud.kbdHints([['click', 'anything that glows'], ['drag', 'look around']]); break;
      case S.FOCUS: ui.hud.kbdHints([['ESC', 'back'], ['DRAG', 'look']]); break;
      case S.OVERVIEW: ui.hud.kbdHints([['ESC', 'back'], ['DRAG', 'orbit']]); break;
      case S.PROJECT: ui.hud.kbdHints([['CLICK', 'inspect'], ['←', 'prev world'], ['→', 'next world'], ['ESC', 'desk']]); break;
      default: ui.hud.kbdHints(null);
    }
  }

  // ---------- loop
  loop(ts) {
    // the next frame is booked first and the frame runs guarded: one throw (a half-built object, a bad value) costs a frame, not the whole desk
    requestAnimationFrame(this.loop);
    // left alone for a while, the desk keeps breathing at half rate (the fans, the clock and the steam still move) so a tab left open
    // doesn't keep a laptop's fan spinning; any input brings the full rate straight back
    // (not in the overview: that is a slow camera orbit, and a moving camera at half rate judders)
    const idle = !this.flight && !this.pointer.down && !state.is(S.OVERVIEW) && performance.now() - this._inputAt > 20000;
    this.renderer.holdAdapt = idle;
    if (idle && ts - (this._frameAt || 0) < 30) return;
    this._frameAt = ts;
    try { this.frame(ts); } catch (err) { if (!this._loopErr || ts - this._loopErr > 5000) { this._loopErr = ts; console.error('[frame]', err); } }
  }
  frame(ts) {
    const t = ts / 1000; const dt = Math.min(0.05, t - (this.last || t)); this.last = t; this.time = t;
    tween.update(t);
    if (state.is(S.GATE, S.LOADING)) { const g = this.gateCam; V3.copy(this.camera.target, g.target); const a = t * 0.06; this.camera.position[0] = g.position[0] + Math.sin(a) * 0.7; this.camera.position[2] = g.position[2] + Math.cos(a) * 0.4; this.camera.position[1] = g.position[1] + Math.sin(t * 0.13) * 0.25; }
    this.controls.update(dt);
    this.updateHover();
    if (this.sceneName === 'desk') {
      this.world.update(dt, t, this.camera.position, this.camera);
      const d = this.room.dim, r = this.renderer;
      r.hemi.sky = DESK_LIGHTS.hemi.sky.map((c) => c * (0.35 + 0.65 * d)); r.hemi.ground = DESK_LIGHTS.hemi.ground.map((c) => c * d);
      r.dir.color = DESK_LIGHTS.dir.color.map((c) => c * (0.25 + 0.75 * d));
    } else if (this.world3) {
      this.world3.update(dt, t, this.camera.position);
      for (const h of this.world3.hotspots) { const u = h.mesh.userData; u.glow += (u.targetGlow - u.glow) * (1 - Math.exp(-14 * dt)); const base = u.baseScale || (u.baseScale = V3.clone(h.mesh.scale)); if (!u.nudging) h.mesh.scale = base.map((s) => s * (1 + u.glow * 0.05)); if (h.pin) { const k = 1 + u.glow * 0.6 + Math.sin(t * 2.2 + h.anchor[0]) * 0.06; h.pin.scale = [k, k, k]; h.pin.position[1] = h.anchor[1] + 0.25 + Math.sin(t * 1.6 + h.anchor[2]) * 0.06 + u.glow * 0.15; u.pinDot.material.emissiveIntensity = 0.9 + u.glow * 1.6; h.pin.visible = this.hotspot !== h; } }
    }
    // the keyboard's map: labels over its districts while the keyboard has the focus
    const mapOn = this.sceneName === 'desk' && state.is(S.FOCUS) && this.focus?.id === 'keyboard' && !this.flight;
    if (mapOn !== ui.kbMap.visible) { if (mapOn) ui.kbMap.show(this.mapItems(), (id) => this.activate(id)); else ui.kbMap.hide(); }
    if (mapOn) for (const it of this.mapItems()) { const m = this.world.keyById[it.id]; if (!m) continue; const wp = m.getWorldPosition([0, 0, 0]); wp[1] += it.lift; const nd = this.camera.project(wp); ui.kbMap.place(it.id, (nd[0] * 0.5 + 0.5) * innerWidth, (-nd[1] * 0.5 + 0.5) * innerHeight, nd[2] < 1); }
    if (mapOn) ui.kbMap.declutter();
    // a story left behind by a jump elsewhere (a world entered, a page opened) is put away
    if (this.story && !state.is(S.FOCUS)) this.stopStory();
    // anchored UI follows the world
    const proj = (p) => { const nd = this.camera.project(p); return [(nd[0] * 0.5 + 0.5) * innerWidth, (-nd[1] * 0.5 + 0.5) * innerHeight]; };
    if (this.panelAnchor && ui.panel.visible) { const [x, y] = proj(this.panelAnchor); ui.panel.place(x, y); }
    if (this.vpAnchor && state.is(S.PROJECT)) { const [x, y] = proj(this.vpAnchor); ui.viewProject.place(x, y); }
    if (state.is(S.PROJECT) && this.labelAnchor) { const [x, y] = proj(this.labelAnchor); ui.hud.sceneLabelPos(x, y); }
    else if (this.focus && state.is(S.FOCUS) && !ui.isTouch) { const m = this.world.targets[this.focus.id].mesh; const wp = m.getWorldPosition([0, 0, 0]); wp[1] += 0.25; wp[0] += (m.userData.width || 1) * 0.5; const [x, y] = proj(wp); ui.hud.sceneLabelPos(x, y); }
    else if (state.is(S.OVERVIEW)) ui.hud.sceneLabelPos(innerWidth * 0.5, innerHeight * 0.72);
    // depth of field follows the camera's subject: sharp on the target, softening with distance from it; never so strong that detail is lost
    { const po = this.renderer.post; const f = V3.dist(this.camera.position, this.camera.target); po.focus += (f - po.focus) * (1 - Math.exp(-6 * dt));
      // zoomed out (the whole desk, the room) everything is sharp: the blur fades out between a close look (35) and the home view (~63)
      const close = Math.max(0, Math.min(1, (14 - f) / 12)), far = Math.max(0, Math.min(1, (f - 35) / 25)), wide = far * far * (3 - 2 * far);
      po.range = 6 + f * 0.9; po.maxBlur = (2.2 + close * 2.6) * (1 - wide); po.vignette = state.is(S.GATE, S.ENTERING) ? 0.5 : 0.3;
      // the near plane rides with the camera's distance: depth precision goes where the eye is, so thin layers (book spines, screens
      // on their bezels, prints on the wall) stop shimmering when the room is seen from across it
      this.camera.near = Math.min(0.6, Math.max(0.1, f * 0.02)); }
    this.renderer.render(this.scene, this.camera);
  }
}
