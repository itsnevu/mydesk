// Hash routes: #project-<key>, #scene-gallery, #<target id>. Keeps the URL shareable without a server.
const listeners = new Set();

export function parseRoute() {
  const h = location.hash.replace(/^#/, '');
  if (!h) return null;
  let m = h.match(/^project-(.+)$/); if (m) return { type: 'project', slug: m[1] };
  m = h.match(/^scene-(.+)$/); if (m) return { type: 'scene', slug: m[1] };
  return { type: 'target', slug: h };
}

// Stepping in from the desk (no hash yet) adds ONE history entry, so the browser's or the phone's back button closes what was opened
// instead of leaving the site; moving from one thing to the next replaces that entry, and coming back out never pops history itself
// (a programmatic history.back() could land after the next push and close the wrong thing). push/replaceState fire no hashchange.
export function setRoute(hash) {
  const next = hash ? `#${hash}` : location.pathname + location.search;
  if (location.hash === (hash ? `#${hash}` : '')) return;
  if (hash && !location.hash) history.pushState({ kw: 1 }, '', next); else history.replaceState(history.state, '', next);
}

export function onRoute(fn) { listeners.add(fn); }
// back / forward between entries changes the hash: that is the visitor moving, so the experience follows
window.addEventListener('hashchange', () => { for (const l of listeners) l(parseRoute()); });
