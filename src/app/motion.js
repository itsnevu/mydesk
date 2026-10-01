// One motion language for the whole experience.
import { Ease } from 'engine/tween';

// The OS "reduce motion" setting. CSS honours it through the media query; MOTION.reduced is the same answer for
// script-driven motion (camera flights, typed headings, idle spins). Read it when the motion starts so a live change counts.
const reduceQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

export const MOTION = {
  get reduced() { return !!reduceQuery?.matches; },
  dur: {
    micro: 0.16,     // hover, press
    fast: 0.32,      // UI fades
    base: 0.6,       // panels
    camera: 1.5,     // camera flights
    cameraLong: 2.2, // overview / scene flights
    scene: 1.0,      // switching-scenes overlay hold
    intro: 2.6,      // gate → desk
  },
  ease: {
    ui: Ease.power2Out,
    uiIn: Ease.power1In,
    camera: Ease.power2InOut,
    cameraSoft: Ease.sineInOut,
    pop: Ease.backOut,
    popStrong: Ease.backOutStrong,
    spring: Ease.elasticOut,
  },
  cssEase: 'cubic-bezier(0.22, 1, 0.36, 1)',
  cssEaseInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  keyPressDepth: 0.16, // world units a key travels when pressed
  keyLerp: 14,         // per-second damping for key travel
  stagger: 0.02,       // wave across keys
};

// Sync CSS custom properties so UI transitions share the same numbers.
export function applyMotionToCSS() {
  const r = document.documentElement.style;
  r.setProperty('--d-micro', MOTION.dur.micro + 's');
  r.setProperty('--d-fast', MOTION.dur.fast + 's');
  r.setProperty('--d-base', MOTION.dur.base + 's');
  r.setProperty('--ease', MOTION.cssEase);
  r.setProperty('--ease-io', MOTION.cssEaseInOut);
  // <html data-motion="reduced|full"> for stylesheets that want a hook outside the media query; kept in sync live
  const sync = () => { document.documentElement.dataset.motion = MOTION.reduced ? 'reduced' : 'full'; };
  sync(); reduceQuery?.addEventListener?.('change', sync);
}
