// The Labs page (/labs/): Navy's own experiments from app/labs, in the site's grammar (scripts/site.js). This module renders only
// the page's <main> and its CSS, with small helpers of its own, so it stays independent of the page shell; scripts/site.js wraps
// it in head(), header() and footer() like the archive, and the archive's filter script runs it unchanged (.arc-grid, .pill-f,
// #arc-status). A lab with a screenshot shows it; the others get a plate: the language's mark, the repository, the month.
import { LABS, LAB_KINDS } from '../src/app/labs.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const kick = (s) => `<span class="kick"><span class="sr">${esc(s)}</span><span class="kt" aria-hidden="true">${esc(s)}</span></span>`;
// every word in its own mask (the site's rising lines), the italic ending in <em>
function split(s, n = { i: 0 }, em = false) {
  const out = esc(s).split(/\s+/).filter(Boolean).map((t) => `<span class="wd"><span style="--i:${n.i++}">${t}</span></span>`).join(' ');
  return em ? `<em>${out}</em>` : out;
}
const splitPair = (plain, italic) => { const n = { i: 0 }; return `${split(plain, n)} ${split(italic, n, true)}`; };
const arrow = '<svg class="ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

// each kind's tint, in the site's warm dark: the plate's light and the mark
const TINT = { ai: '#c9a7ff', play: '#e8b97a', tools: '#9fd9a8' };
const KIND = Object.fromEntries(LAB_KINDS);

export const LABS_CSS = `
.labs .arc-lead { max-width: 34em; }
.lab-grid { align-items: start; }
/* (the story and the links sit outside the card's link, so they take the number column's width as a margin to line up with the name) */
.lab { --num: 28px; }
.lab { --acc: var(--accent-2); }
.lab > a { display: grid; grid-template-columns: auto 1fr; column-gap: 12px; row-gap: 4px; }
.lab-pic { aspect-ratio: 16 / 10; }
/* the plate of a lab without a picture: its light in the corner, a faint grid, the language's mark, the repository and the month */
.lab-plate { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: clamp(16px, 2.2vw, 26px); background:
  radial-gradient(120% 90% at 85% 10%, color-mix(in srgb, var(--acc) 22%, transparent), transparent 60%),
  linear-gradient(var(--line) 1px, transparent 1px) 0 0 / 40px 40px, linear-gradient(90deg, var(--line) 1px, transparent 1px) 0 0 / 40px 40px, var(--bg-2); }
.lab-repo { display: flex; align-items: center; gap: 8px; font: 500 12px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--dim); }
.lab-repo b { font-weight: 700; color: var(--ink); }
.lab-mark { position: absolute; left: 50%; top: 50%; width: clamp(56px, 7vw, 96px); height: clamp(56px, 7vw, 96px); transform: translate(-50%, -56%); background: var(--acc); -webkit-mask: var(--m) center / contain no-repeat; mask: var(--m) center / contain no-repeat; opacity: 0.9; transition: transform 0.9s var(--ease); }
.lab-mark--wide { width: clamp(100px, 12vw, 170px); }
.lab > a:hover .lab-mark, .lab > a:focus-visible .lab-mark { transform: translate(-50%, -56%) scale(1.08) rotate(-4deg); }
.lab-meta { display: flex; flex-wrap: wrap; gap: 6px 14px; font: 600 11px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--faint); }
.lab-meta b { font-weight: 600; color: var(--acc); }
.lab-pic img { filter: grayscale(0.1) brightness(0.94); }
.lab .arc-i { font-style: normal; font-size: 17px; line-height: 1.45; color: var(--dim); text-wrap: pretty; }
.lab .arc-s { margin-top: 8px; }
.lab-more { margin: 10px 0 0 var(--num); font-size: 15.5px; line-height: 1.55; color: var(--faint); text-wrap: pretty; }
.lab-links { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 0 var(--num); }
.lab-links a { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 13px; border: 1px solid var(--line-2); border-radius: 999px; font: 600 11px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--dim); transition: border-color 0.3s, color 0.3s, background 0.3s; }
.lab-links a:hover, .lab-links a:focus-visible { border-color: var(--ink); color: var(--ink); }
.lab-links a.is-live { background: var(--ink); border-color: var(--ink); color: #140f09; }
.lab-links a.is-live:hover { background: var(--accent-2); border-color: var(--accent-2); }
.lab-links .ar { width: 0.8em; height: 0.8em; }
/* the kinds, as a strip under the lead: a count each, in its tint */
.lab-stats { display: flex; flex-wrap: wrap; gap: 10px 28px; margin: 0 0 clamp(30px, 3vw, 44px); font: 600 12px var(--cond); letter-spacing: 0.18em; text-transform: uppercase; color: var(--faint); }
.lab-stats b { font: 400 clamp(26px, 2.2vw, 34px)/1 var(--serif); letter-spacing: 0; text-transform: none; color: var(--ink); margin-right: 6px; }
.lab-stats i { display: inline-block; width: 8px; height: 8px; margin-right: 10px; border-radius: 50%; background: var(--acc); vertical-align: 2px; }
.labs-end { margin-top: clamp(60px, 7vw, 100px); padding-top: 28px; border-top: 1px solid var(--line-2); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 14px 28px; }
.labs-end p { max-width: 30em; font-size: 17px; color: var(--dim); text-wrap: pretty; }
`;

/** The page's <main>: the archive's bones, each lab a card with its picture or plate, the kind filters, a line to GitHub at the end. */
// `chapter`: rendered as the second chapter of the Labs page (after the worlds, scripts/labs-worlds.js): no <main>, no crumbs,
// an h2 under a kick instead of the page's h1; `chapter.kick/title/em` are the words, in the page's language
export function labsMain({ exists = () => false, img = null, chapter = null } = {}) {
  const n = LABS.length;
  const counts = Object.fromEntries(LAB_KINDS.map(([k]) => [k, LABS.filter((l) => l.kind === k).length]));
  const pills = [['all', 'All', n], ...LAB_KINDS.map(([k, label]) => [k, label, counts[k]])]
    .map(([k, label, c]) => `<button type="button" class="pill-f" data-kind="${k}" aria-pressed="${k === 'all'}"><span>${esc(label)}</span><span class="c">${c}</span></button>`).join('');
  const stats = LAB_KINDS.map(([k, label]) => `<span style="--acc:${TINT[k]}"><i aria-hidden="true"></i><b>${counts[k]}</b>${esc(label)}</span>`).join('');
  const wide = new Set(['threedotjs', 'telegram']);
  const cards = LABS.map((l, i) => {
    const acc = TINT[l.kind] || TINT.tools, gh = l.links.find(([t]) => /github|contracts/i.test(t))?.[1] || l.links[0][1];
    const live = l.links.find(([t]) => t === 'Live');
    const pic = l.shot && exists(l.shot) && img
      ? img(l.shot, `${l.name}: screenshot`, { sizes: '(min-width: 1100px) 31vw, (min-width: 560px) 46vw, 92vw' })
      : `<span class="lab-plate" aria-hidden="true"><span class="lab-repo">itsnevu / <b>${esc(gh.replace(/^https:\/\/github\.com\/itsnevu\//, '').replace(/\/.*$/, ''))}</b></span><i class="lab-mark${wide.has(l.mark) ? ' lab-mark--wide' : ''}" style="--m:url(/site/tools/${esc(l.mark)}.svg)"></i><span class="lab-meta"><b>${esc(KIND[l.kind])}</b><span>${esc(l.lang)}</span>${l.license ? `<span>${esc(l.license)}</span>` : ''}<span>${esc(l.when)}</span></span></span>`;
    const links = l.links.map(([t, h]) => `<a href="${esc(h)}"${h.startsWith('/') ? '' : ' target="_blank" rel="noopener"'} class="${t === 'Live' ? 'is-live' : ''}" data-track="lab_open" data-lab="${esc(l.key)}" data-channel="${esc(t)}">${esc(t)} ${arrow}</a>`).join('');
    return `<li class="arc-card lab" data-kind="${l.kind}" style="--i:${i % 9};--acc:${acc}">
      <a href="${esc(live ? live[1] : gh)}"${live && live[1].startsWith('/') ? '' : ' target="_blank" rel="noopener"'} data-track="lab_open" data-lab="${esc(l.key)}" data-channel="card" aria-label="${esc(l.name)}: ${live ? 'open the live site' : 'the repository on GitHub'}">
        <span class="arc-pic lab-pic">${pic}</span>
        <span class="arc-n">${pad(i + 1)}</span><span class="arc-t">${esc(l.name)}</span><span class="arc-i">${esc(l.line)}</span><span class="arc-s">${esc([KIND[l.kind], ...l.stack, l.when].join(' · '))}</span>
      </a>
      ${l.more ? `<p class="lab-more">${esc(l.more)}</p>` : ''}
      <div class="lab-links">${links}</div>
    </li>`;
  }).join('');
  if (chapter) return `<section class="arc labs labs-chapter worlds-after wrap" aria-labelledby="labs-more-h">
    <span class="p-kick" data-reveal>${kick(chapter.kick)}</span>
    <h2 class="serif-h" id="labs-more-h" data-split>${splitPair(chapter.title, chapter.em)}</h2>
    <p class="p-lead arc-lead" data-reveal>Side projects, made on my own time and kept open on GitHub. This is where I try things before a client ever asks for them: agents, games, machine learning, a desk in 3D.</p>
    <div class="lab-stats" data-reveal>${stats}</div>
    <div class="arc-filters" role="group" aria-label="Show labs by kind" data-reveal>${pills}</div>
    <p class="sr" role="status"></p>
    <ol class="arc-grid lab-grid" data-stagger>${cards}</ol>
    <div class="labs-end" data-reveal>
      <p>Each description follows the repository's own README. More of the work, forks and course projects included, is on GitHub.</p>
      <a class="btn" href="https://github.com/itsnevu" target="_blank" rel="noopener" data-track="contact_click" data-channel="GitHub">github.com/itsnevu ${arrow}</a>
    </div>
  </section>`;
  return `<main id="main" tabindex="-1">
  <section class="arc labs wrap" aria-labelledby="labs-h">
    <div class="p-crumbs" data-reveal><a href="/">← Home</a><span>${n} experiments</span></div>
    <span class="p-kick" data-reveal>${kick('Labs')}</span>
    <h1 class="p-title cap" id="labs-h" data-split>${splitPair('No brief,', 'no client.')}</h1>
    <p class="p-lead arc-lead" data-reveal>Side projects, made on my own time and kept open on GitHub. This is where I try things before a client ever asks for them: agents, games, machine learning, a desk in 3D.</p>
    <div class="lab-stats" data-reveal>${stats}</div>
    <div class="arc-filters" role="group" aria-label="Show labs by kind" data-reveal>${pills}</div>
    <p class="sr" role="status" id="arc-status"></p>
    <ol class="arc-grid lab-grid" data-stagger>${cards}</ol>
    <div class="labs-end" data-reveal>
      <p>Each description follows the repository's own README. More of the work, forks and course projects included, is on GitHub.</p>
      <a class="btn" href="https://github.com/itsnevu" target="_blank" rel="noopener" data-track="contact_click" data-channel="GitHub">github.com/itsnevu ${arrow}</a>
    </div>
  </section>
</main>`;
}

export const LABS_META = {
  title: 'Labs | Navy Gibran',
  description: `${LABS.length} experiments by Navy Gibran, every one on GitHub: an AI browser agent, guardrails for agents, a voice assistant in Indonesian, ad analytics with AI insight, a Three.js fishing game and more.`,
  menu: { label: 'Labs', sub: `${LABS.length} experiments, no client` },
};
