// Hash routes: #project-<key>, #scene-gallery, #<target id>. Keeps the URL shareable without a server.
const listeners = new Set();

export function parseRoute() {
  const h = location.hash.replace(/^#/, '');
  if (!h) return null;
  let m = h.match(/^project-(.+)$/); if (m) return { type: 'project', slug: m[1] };
  m = h.match(/^scene-(.+)$/); if (m) return { type: 'scene', slug: m[1] };
  return { type: 'target', slug: h };
}

// Stepping in from the bare desk adds ONE history entry, so the browser's or the phone's back button closes what was opened instead
// of leaving the site; moving from one thing to the next replaces that entry, and coming back out turns it back into the bare
// address without popping history (a programmatic step back could land after the next push and close the wrong thing).
// The entry keeps { kw: history.length } from when it was pushed: while it is still the newest entry of the tab, the next thing
// opened takes it over instead of pushing another, so opening and closing things never piles up dead Back presses. Once anything
// comes after it (a page opened inside the site sheet's frame, a link from the site), the next open pushes as before, so Back
// still closes it first. push/replaceState fire no hashchange.
export function setRoute(hash) {
  const next = hash ? `#${hash}` : location.pathname + location.search;
  if (location.hash === (hash ? `#${hash}` : '')) return;
  if (hash && !location.hash && history.state?.kw !== history.length) { history.pushState(null, '', next); history.replaceState({ kw: history.length }, '', next); }
  else history.replaceState(history.state, '', next);
}

export function onRoute(fn) { listeners.add(fn); }
// back / forward between entries changes the hash: that is the visitor moving, so the experience follows
window.addEventListener('hashchange', () => { for (const l of listeners) l(parseRoute()); });
