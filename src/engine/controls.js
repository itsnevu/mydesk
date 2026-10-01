// Orbit controls with damping: left drag rotate, right (or shift/ctrl + left) drag pan, wheel / trackpad pinch zoom; touch: 1 finger rotate, 2 finger pinch/pan.
import { V3, clamp, smoothstep } from 'engine/math';

const WALL_SOFT = 4; // the camera eases onto a wall over this many units instead of stopping dead
const TAP_SLOP = 10; // px a finger may wander before a touch turns the view: the same slop app/experience allows a tap, so a tap never turns it
const ZOOM_SOFT = 0.35; // log-distance over which a zoom eases onto its min/max
// smooth min: exactly min(a, b) once they are k apart, a rounded corner in between (never above the min, so never through a wall)
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
// a C1 ramp: 0 below -w, x above w, a parabola between, so a slope starts and stops without a kink
const ramp = (x, w) => (x <= -w ? 0 : x >= w ? x : ((x + w) * (x + w)) / (4 * w));
const _p = [0, 0, 0], _l = [0, 0, 0], _q = [0, 0, 0], _m = [0, 0, 0];

export class OrbitControls {
  constructor(camera, dom) {
    this.camera = camera; this.dom = dom;
    this.enabled = true;
    this.enableRotate = true; this.enablePan = true; this.enableZoom = true;
    this.zoomToCursor = false; // zooming keeps the point under the cursor (or between the fingers) still, by sliding the target toward it
    this.damping = 8; // higher = snappier; what is left of the lag on release is the glide
    this.rotateSpeed = 1.0; this.panSpeed = 1.0; this.zoomSpeed = 1.0;
    this.minDistance = 2; this.maxDistance = 60;
    this.minPolar = 0.05; this.maxPolar = Math.PI / 2 - 0.05;
    this.minAzimuth = -Infinity; this.maxAzimuth = Infinity;
    this.autoRotate = false; this.autoRotateSpeed = 0.15; // rad/s
    this.rise = null; // { from, rate, max }: zoomed out past `from`, the view rises with the distance, so pulling back reveals the room
    this.bounds = null; // { camera: {min, max}, target: {min, max} }: a room the view may not leave (only the output is limited, so the orbit itself is untouched)
    this.target = V3.clone(camera.target);
    // spherical of camera around target
    this._sph = this._fromCamera();
    this._goal = { ...this._sph };
    this._goalTarget = V3.clone(this.target);
    this._state = 'none';
    this._last = [0, 0];
    this._slop = null;
    this._pinch = 0;
    this._touchMid = [0, 0];
    this._touching = 0;
    this._fix = null;
    this.onStart = null; this.onEnd = null; this.onChange = null;
    this._bind();
  }
  _fromCamera() {
    const o = V3.sub([0, 0, 0], this.camera.position, this.camera.target);
    const r = V3.len(o);
    return { r, theta: Math.atan2(o[0], o[2]), phi: Math.acos(clamp(o[1] / r, -1, 1)) };
  }
  // the rise eases in at `from` and eases out at `max` (no kink in the motion as a zoom crosses either)
  _lift(r) { const k = this.rise; if (!k) return 0; const w = 1.5, y = ramp((r - k.from) * k.rate, w); return k.max - ramp(k.max - y, w); }
  /** Camera position + look target for an orbit (r, theta, phi) around pivot t, kept inside the room. */
  _place(r, theta, phi, t, pos, look) {
    const b = this.bounds, st = Math.sin(theta), ct = Math.cos(theta), ty = t[1] + this._lift(r);
    let h = r * Math.sin(phi), y = ty + r * Math.cos(phi), x, z;
    if (b) {
      // a wall shortens the arm along the view ray: the camera slides along it still facing the target, and rounds corners instead of
      // parking in them; height is limited on its own, so pulling back against a wall still cranes the view up over the room
      const lo = b.camera.min, hi = b.camera.max;
      let t0 = 0, t1 = Infinity, ok = true;
      for (let i = 0; i < 3; i += 2) {
        const dv = i ? ct : st;
        if (Math.abs(dv) < 1e-9) { if (t[i] < lo[i] || t[i] > hi[i]) ok = false; continue; }
        let a = (lo[i] - t[i]) / dv, c = (hi[i] - t[i]) / dv; if (a > c) { const s = a; a = c; c = s; }
        if (a > t0) t0 = a; if (c < t1) t1 = c;
      }
      if (ok && t1 >= t0) { h = Math.max(t0, smin(h, t1, WALL_SOFT)); x = t[0] + h * st; z = t[2] + h * ct; }
      // a target outside the camera's room whose view ray misses it: plain per-axis clamp
      else { x = clamp(t[0] + h * st, lo[0], hi[0]); z = clamp(t[2] + h * ct, lo[2], hi[2]); }
      y = clamp(y, lo[1], hi[1]);
    } else { x = t[0] + h * st; z = t[2] + h * ct; }
    pos[0] = x; pos[1] = y; pos[2] = z; look[0] = t[0]; look[1] = ty; look[2] = t[2];
  }
  // the distance past which zooming out changes nothing on screen (pressed into the walls and the ceiling, the rise topped out):
  // zooming out stops there, so zooming back in answers at once instead of spending notches on a distance nobody sees
  _cap(theta, phi, t) {
    let lo = this.minDistance, hi = this.maxDistance;
    if (!this.bounds || !isFinite(hi)) return hi;
    this._place(hi, theta, phi, t, _q, _m); const qx = _q[0], qy = _q[1], qz = _q[2], my = _m[1];
    const same = (r) => { this._place(r, theta, phi, t, _p, _l); return Math.abs(_p[0] - qx) + Math.abs(_p[1] - qy) + Math.abs(_p[2] - qz) + Math.abs(_l[1] - my) < 1e-4; };
    if (same(lo)) return lo;
    for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (same(m)) hi = m; else lo = m; }
    return hi;
  }
  /** Re-sync internal state to camera (after external camera tweens). */
  sync() {
    this._sph = this._fromCamera(); this._goal = { ...this._sph };
    V3.copy(this.target, this.camera.target); this.target[1] -= this._lift(this._sph.r); V3.copy(this._goalTarget, this.target);
    // a camera parked where the room would not put it (a flight ending against a wall) is eased in, not snapped
    this._place(this._sph.r, this._sph.theta, this._sph.phi, this.target, _p, _l);
    const f = V3.sub([0, 0, 0], this.camera.position, _p); this._fix = V3.len(f) > 1e-4 ? f : null;
  }
  _bind() {
    const d = this.dom, st = d.style;
    st.touchAction = 'none'; st.userSelect = st.webkitUserSelect = 'none'; st.webkitTouchCallout = 'none'; st.webkitTapHighlightColor = 'transparent';
    d.addEventListener('contextmenu', (e) => e.preventDefault());
    d.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); }); // middle-drag pans, it does not start autoscroll
    d.addEventListener('pointerdown', (e) => {
      if (!this.enabled || e.pointerType === 'touch') return; // touch is handled by touch events
      d.setPointerCapture(e.pointerId);
      this._state = e.button === 2 || e.button === 1 || e.shiftKey || e.ctrlKey || e.metaKey ? 'pan' : 'rotate';
      this._last = [e.clientX, e.clientY];
      this.onStart?.(this._state);
    });
    d.addEventListener('pointermove', (e) => {
      if (!this.enabled || e.pointerType === 'touch' || this._state === 'none') return;
      const dx = e.clientX - this._last[0], dy = e.clientY - this._last[1];
      this._last = [e.clientX, e.clientY];
      if (this._state === 'rotate') this._rotate(dx, dy); else this._pan(dx, dy);
    });
    const up = (e) => { if (e.pointerType !== 'touch' && this._state !== 'none') { this._state = 'none'; this.onEnd?.(); } };
    d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up); d.addEventListener('lostpointercapture', up);
    d.addEventListener('wheel', (e) => {
      e.preventDefault(); // never scroll or zoom the page, not even mid-flight
      if (!this.enabled) return;
      // lines and pages to pixels; a mouse notch (~100px) is ~12%, a trackpad's stream of small deltas glides, a pinch (ctrl+wheel) is finer so it is scaled up
      const px = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? d.clientHeight || 800 : 1);
      this._zoom(Math.exp(clamp(px * (e.ctrlKey ? 0.01 : 0.0012), -0.5, 0.5) * this.zoomSpeed), e.clientX, e.clientY);
    }, { passive: false });
    // Safari's trackpad pinch comes as gesture events (no ctrl+wheel); left alone it zooms the page. On iOS a touch pinch fires them too, the touch handlers own that
    let gs = 1;
    d.addEventListener('gesturestart', (e) => { e.preventDefault(); gs = e.scale || 1; });
    d.addEventListener('gesturechange', (e) => { e.preventDefault(); const s = e.scale || 1; if (this.enabled && !this._touching) this._zoom(gs / s, e.clientX, e.clientY); gs = s; });
    d.addEventListener('gestureend', (e) => e.preventDefault());
    // touch
    const span = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const mid = (t) => [(t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2];
    // (re)start from the fingers down now: a finger lifted mid-pinch hands over to rotate from where the other one is, so nothing jumps
    const grip = (t) => {
      this._touching = t.length;
      if (!this.enabled || !t.length) this._state = 'none';
      else if (t.length === 1) { this._state = 'rotate'; this._last = [t[0].clientX, t[0].clientY]; this._slop = [t[0].clientX, t[0].clientY]; }
      else { this._state = 'pinch'; this._pinch = span(t); this._touchMid = mid(t); this._slop = null; }
    };
    d.addEventListener('touchstart', (e) => { grip(e.touches); if (this._state !== 'none') this.onStart?.(this._state); }, { passive: true });
    d.addEventListener('touchmove', (e) => {
      if (e.cancelable) e.preventDefault();
      if (!this.enabled) return;
      const t = e.touches;
      if (this._state === 'rotate' && t.length === 1) {
        const x = t[0].clientX, y = t[0].clientY;
        // a tap's jitter does not turn the view; past the slop the whole move counts (the damping smooths the catch-up)
        if (this._slop) { if (Math.hypot(x - this._slop[0], y - this._slop[1]) < TAP_SLOP) return; this._slop = null; }
        this._rotate(x - this._last[0], y - this._last[1]); this._last = [x, y];
      } else if (this._state === 'pinch' && t.length >= 2) {
        const p = span(t), m = mid(t);
        if (this._pinch > 0 && p > 0) this._zoom(this._pinch / p, m[0], m[1]);
        this._pan(m[0] - this._touchMid[0], m[1] - this._touchMid[1]);
        this._pinch = p; this._touchMid = m;
      }
    }, { passive: false });
    const lift = (e) => { const was = this._state; grip(e.touches); if (was !== 'none' && this._state === 'none') this.onEnd?.(); };
    d.addEventListener('touchend', lift); d.addEventListener('touchcancel', lift);
  }
  _rotate(dx, dy) {
    if (!this.enableRotate) return;
    const h = this.dom.clientHeight || 1;
    this._goal.theta -= (2 * Math.PI * dx / h) * this.rotateSpeed;
    this._goal.phi -= (2 * Math.PI * dy / h) * this.rotateSpeed;
    this._goal.phi = clamp(this._goal.phi, this.minPolar, this.maxPolar);
    this._goal.theta = clamp(this._goal.theta, this.minAzimuth, this.maxAzimuth);
    this.onChange?.('rotate');
  }
  // the camera basis and the view-plane point under a client position, at the target's depth
  _basis() {
    const c = this.camera, fwd = V3.normalize([0, 0, 0], V3.sub([0, 0, 0], c.target, c.position));
    const right = V3.normalize([0, 0, 0], V3.cross([0, 0, 0], fwd, [0, 1, 0])), up = V3.cross([0, 0, 0], right, fwd);
    return { right, up, k: 2 * Math.tan((c.fov * Math.PI) / 360) * V3.dist(c.position, c.target) };
  }
  _pan(dx, dy) {
    if (!this.enablePan) return;
    // scaled by how far the camera really is from the target (pressed against a wall it is nearer than the orbit radius), so the room moves with the cursor
    const { right, up, k } = this._basis(), s = (k / (this.dom.clientHeight || 1)) * this.panSpeed;
    V3.addScaled(this._goalTarget, this._goalTarget, right, -dx * s);
    V3.addScaled(this._goalTarget, this._goalTarget, up, dy * s);
    this.onChange?.('pan');
  }
  /** Zoom by factor f (>1 out), toward client point (x, y) when zoomToCursor. */
  _zoom(f, x, y) {
    if (!this.enableZoom) return;
    const s = this._sph, g = this._goal;
    // past the cap nothing moves on screen: drop that slack (invisible) so the zoom answers at once
    s.r = Math.min(s.r, this._cap(s.theta, s.phi, this.target));
    const cap = this._cap(g.theta, g.phi, this._goalTarget), r0 = Math.min(g.r, cap), lo = this.minDistance, hi = Math.min(this.maxDistance, cap);
    // the last stretch to a limit is eased: a step takes at most a share of the room left, so the zoom settles onto min/max instead of hitting it
    // (a distance already outside the limits, left by a flight, is never pushed further out, nor snapped in)
    const u = Math.log(f), room = Math.max(0, u < 0 ? Math.log(r0 / lo) : Math.log(hi / r0));
    const r1 = clamp(r0 * Math.exp(Math.sign(u) * Math.min(Math.abs(u), room * (1 - Math.exp(-Math.abs(u) / ZOOM_SOFT)))), Math.min(lo, r0), Math.max(hi, r0));
    // the point under the cursor stays under it: the target slides toward it as the view closes in, away as it pulls back (the room bounds still hold the target).
    // Inside the rise the zoom stays centred (there the aim already sinks and climbs with the distance, the two would fight); below it the cursor leads
    const wz = this.rise ? 1 - smoothstep(this.rise.from - 8, this.rise.from + 4, r0) : 1;
    if (this.zoomToCursor && this.enablePan && x !== undefined && wz > 0 && Math.abs(r1 - r0) > 1e-6) {
      this._place(r0, g.theta, g.phi, this._goalTarget, _p, _l); const d0 = V3.dist(_p, _l);
      this._place(r1, g.theta, g.phi, this._goalTarget, _p, _l); const d1 = V3.dist(_p, _l);
      const rc = this.dom.getBoundingClientRect(), nx = ((x - rc.left) / (rc.width || 1)) * 2 - 1, ny = 1 - ((y - rc.top) / (rc.height || 1)) * 2;
      const { right, up } = this._basis(), w = wz * (d0 - d1) * Math.tan((this.camera.fov * Math.PI) / 360), a = this.camera.aspect || rc.width / (rc.height || 1);
      V3.addScaled(this._goalTarget, this._goalTarget, right, nx * a * w);
      V3.addScaled(this._goalTarget, this._goalTarget, up, ny * w);
    }
    g.r = r1;
    this.onChange?.('zoom');
  }
  update(dt) {
    if (!this.enabled) return;
    if (this.autoRotate && this._state === 'none') this._goal.theta += this.autoRotateSpeed * dt;
    const k = 1 - Math.exp(-this.damping * dt);
    const s = this._sph, g = this._goal, b = this.bounds;
    s.r += (g.r - s.r) * k; s.theta += (g.theta - s.theta) * k; s.phi += (g.phi - s.phi) * k;
    if (b) for (let i = 0; i < 3; i++) this._goalTarget[i] = clamp(this._goalTarget[i], b.target.min[i], b.target.max[i]);
    V3.lerp(this.target, this.target, this._goalTarget, k);
    this._place(s.r, s.theta, s.phi, this.target, this.camera.position, this.camera.target);
    const f = this._fix;
    if (f) { V3.add(this.camera.position, this.camera.position, V3.scale(f, f, Math.exp(-10 * dt))); if (V3.len(f) < 1e-4) this._fix = null; }
  }
  get isInteracting() { return this._state !== 'none'; }
}
