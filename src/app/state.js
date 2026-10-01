// Explicit experience state machine. No competing booleans.

export const S = Object.freeze({
  LOADING: 'LOADING',
  GATE: 'GATE',
  ENTERING: 'ENTERING',
  DESK: 'DESK',               // free orbit around the keyboard
  FOCUS: 'FOCUS',             // camera parked on one object; its information lives beside it
  OVERVIEW: 'OVERVIEW',       // slow cinematic auto-orbit
  SWITCHING: 'SWITCHING',     // scene transition overlay
  GALLERY: 'GALLERY',         // inside the project gallery corridor (room selector)
  PROJECT: 'PROJECT',         // inside a project diorama
  DETAIL: 'DETAIL',           // full project page (the final "View Project" stage)
});

const ALLOWED = {
  LOADING: ['GATE'],
  GATE: ['ENTERING'],
  ENTERING: ['DESK', 'SWITCHING'],
  DESK: ['FOCUS', 'OVERVIEW', 'SWITCHING', 'DETAIL'],
  FOCUS: ['DESK', 'FOCUS', 'SWITCHING', 'OVERVIEW', 'DETAIL'],
  OVERVIEW: ['DESK', 'FOCUS', 'SWITCHING'],
  SWITCHING: ['PROJECT', 'DESK', 'FOCUS', 'GALLERY'],
  GALLERY: ['GALLERY', 'SWITCHING', 'DETAIL'],
  PROJECT: ['SWITCHING', 'DETAIL', 'PROJECT'],
  DETAIL: ['PROJECT', 'DESK', 'SWITCHING', 'FOCUS', 'GALLERY'],
};

class Machine {
  constructor() {
    this.current = S.LOADING;
    this.previous = null;
    this.listeners = new Set();
    this.context = { focusKey: null, scene: 'desk', project: null, transitioning: false };
  }
  can(next) { return (ALLOWED[this.current] || []).includes(next); }
  go(next, ctx = {}) {
    if (next === this.current && !ctx.force) { Object.assign(this.context, ctx); return true; }
    if (!this.can(next)) { console.warn(`[state] blocked ${this.current} → ${next}`); return false; }
    this.previous = this.current;
    this.current = next;
    Object.assign(this.context, ctx);
    document.body.dataset.state = next.toLowerCase();
    for (const l of this.listeners) l(next, this.previous, this.context);
    return true;
  }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  is(...states) { return states.includes(this.current); }
}

export const state = new Machine();
