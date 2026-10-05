// The heart in the corner: how many people liked the desk, and one like per browser (a second press takes it back).
// The number comes from the VPS (server/likes.js; scripts/serve.js keeps a pretend one for npm run dev); if that can't answer
// (down, offline, a file:// build) the heart never shows, so the count on screen is always a real one.
const LS = 'kw-liked';
const API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? '/api/likes' : 'https://keyboardweb.37.60.232.191.sslip.io/likes';
const read = () => { try { return localStorage.getItem(LS) === '1'; } catch { return false; } };
const write = (v) => { try { v ? localStorage.setItem(LS, '1') : localStorage.removeItem(LS); } catch {} };
const fmt = (n) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n));

export async function initLikes() {
  const btn = document.getElementById('like-btn');
  if (!btn || location.protocol === 'file:') return;
  const num = document.getElementById('like-count'), word = document.getElementById('like-word');
  let liked = read(), count = 0, busy = false;
  const render = () => {
    btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
    num.textContent = fmt(count); word.textContent = count === 1 ? 'like' : 'likes';
    btn.setAttribute('aria-label', `${liked ? 'Unlike' : 'Like'} this desk, ${count} ${count === 1 ? 'like' : 'likes'} so far`);
  };
  const call = async (opts) => { const r = await fetch(API, { cache: 'no-store', ...opts }); const j = await r.json().catch(() => ({})); if (!r.ok || typeof j.count !== 'number') throw new Error(r.status); return j.count; };
  try { count = await call(); } catch { return; }
  // this browser liked it but the number says nobody did (a reset store): show it as not liked rather than a lone heart on 0
  if (liked && count === 0) { liked = false; write(false); }
  render(); btn.classList.remove('hidden');

  btn.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    const was = liked, before = count;
    liked = !was; count = Math.max(0, before + (liked ? 1 : -1)); write(liked); render();
    if (liked) { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
    try { count = await call({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: liked ? 'like' : 'unlike' }) }); }
    catch { liked = was; count = before; write(was); }
    render(); busy = false;
  });
}
