// The Labs page (/labs/): Navy's own experiments from app/labs, in the site's grammar (scripts/site.js). This module renders only
// the page's <main> and its CSS, with small helpers of its own, so it stays independent of the page shell; scripts/site.js wraps
// it in head(), header() and footer() like the archive, and the archive's filter script runs it unchanged (.arc-grid, .pill-f,
// #arc-status). A lab with a screenshot shows it; the others get a plate: the language's mark, the repository, the month.
// Every word the page prints comes in English, Indonesian and Chinese: the labs themselves through labsFor(lang) and labKindsFor(lang)
// (src/app/labs.js), the page's own lines in LABS_UI below, the meta in labsMetaFor(lang). English stays the default everywhere.
import { LABS, labsFor, labKindsFor } from '../src/app/labs.js';
import { WORLDS } from './labs-worlds.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// (a paragraph's text needs only &, < and > escaped: the English line's apostrophe stays as it always printed)
const escText = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
const kick = (s) => `<span class="kick"><span class="sr">${esc(s)}</span><span class="kt" aria-hidden="true">${esc(s)}</span></span>`;
// every word in its own mask (the site's rising lines), the italic ending in <em>; Chinese has no spaces, so there each character
// is its own word and Latin runs stay whole, a character counting for less in the stagger (the same rule as scripts/site.js)
const CJK = /[　-〿㐀-鿿豈-﫿＀-￯]/;
function split(s, n = { i: 0 }, em = false, lang = 'en') {
  let out;
  if (lang === 'zh') {
    const toks = String(s).match(/[　-〿㐀-鿿豈-﫿＀-￯]\s*|[^\s　-〿㐀-鿿豈-﫿＀-￯]+\s*/g) || [];
    out = toks.map((tk) => { const i = n.i; n.i = Math.round((n.i + 0.4) * 10) / 10; return `<span class="wd"><span style="--i:${i}">${esc(tk.trim())}</span></span>${/\s$/.test(tk) ? ' ' : ''}`; }).join('');
  } else out = esc(s).split(/\s+/).filter(Boolean).map((t) => `<span class="wd"><span style="--i:${n.i++}">${t}</span></span>`).join(' ');
  return em ? `<em>${out}</em>` : out;
}
const splitPairIn = (lang) => (plain, italic) => { const n = { i: 0 }; return `${split(plain, n, false, lang)}${lang === 'zh' && CJK.test(String(plain).slice(-1)) ? '' : ' '}${split(italic, n, true, lang)}`; };
const arrow = '<svg class="ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

// each kind's tint, in the site's warm dark: the plate's light and the mark
const TINT = { ai: '#c9a7ff', play: '#e8b97a', tools: '#9fd9a8' };

// ---------- the page's own words, per language ({n} is filled in; a missing key falls back to the English). `links` renames a
// link's label on the page (the analytics keep the English label as the channel, and 'Live' stays the one that is filled).
export const LABS_UI = {
  en: {
    kick: 'Labs', all: 'All', home: '← Home', count: '{n} experiments', title: 'No brief,', em: 'no client.',
    lead: 'Side projects, made on my own time and kept open on GitHub. This is where I try things before a client ever asks for them: agents, games, machine learning, a desk in 3D.',
    filter: 'Show labs by kind', end: 'Each description follows the repository\'s own README. More of the work, forks and course projects included, is on GitHub.',
    shotAlt: '{n}: screenshot', cardLive: '{n}: open the live site', cardRepo: '{n}: the repository on GitHub', links: {},
  },
  id: {
    kick: 'Labs', all: 'Semua', home: '← Beranda', count: '{n} eksperimen', title: 'Tanpa brief,', em: 'tanpa klien.',
    lead: 'Proyek sampingan, dibuat di waktu luang saya dan dibiarkan terbuka di GitHub. Di sinilah saya mencoba banyak hal sebelum ada klien yang memintanya: agen, game, machine learning, sebuah desk 3D.',
    filter: 'Tampilkan eksperimen menurut jenis', end: 'Setiap deskripsi mengikuti README repositorinya sendiri. Karya lainnya, termasuk fork dan proyek kuliah, ada di GitHub.',
    shotAlt: '{n}: tangkapan layar', cardLive: '{n}: buka situs live', cardRepo: '{n}: repositorinya di GitHub', links: {},
  },
  zh: {
    kick: '实验室', all: '全部', home: '← 首页', count: '{n} 个实验', title: '没有简报，', em: '没有客户。',
    lead: '业余项目，用我自己的时间做的，全都开源在 GitHub 上。在客户开口之前，我先在这里试验各种东西：智能体、游戏、机器学习，还有一张 3D 书桌。',
    filter: '按类型显示实验', end: '每段介绍都依据该仓库自己的 README。更多作品，包括 fork 和课程项目，都在 GitHub 上。',
    shotAlt: '{n}：截图', cardLive: '{n}：打开线上网站', cardRepo: '{n}：GitHub 上的仓库', links: { Live: '在线访问', 'Chrome Web Store': 'Chrome 网上应用店' },
  },
};
const uiFor = (lang) => ({ ...LABS_UI.en, ...(LABS_UI[lang] || {}) });

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
// an h2 under a kick instead of the page's h1; `chapter.kick/title/em` are the words, in the page's language.
// `lang` ('en', 'id' or 'zh') picks the words for everything else; `splitPair` may be the site's own (the default is the same rule).
export function labsMain({ exists = () => false, img = null, chapter = null, lang = 'en', splitPair = splitPairIn(lang) } = {}) {
  const S = uiFor(lang), labs = labsFor(lang), kinds = labKindsFor(lang), KIND = Object.fromEntries(kinds);
  const n = labs.length;
  const counts = Object.fromEntries(kinds.map(([k]) => [k, labs.filter((l) => l.kind === k).length]));
  const pills = [['all', S.all, n], ...kinds.map(([k, label]) => [k, label, counts[k]])]
    .map(([k, label, c]) => `<button type="button" class="pill-f" data-kind="${k}" aria-pressed="${k === 'all'}"><span>${esc(label)}</span><span class="c">${c}</span></button>`).join('');
  const stats = kinds.map(([k, label]) => `<span style="--acc:${TINT[k]}"><i aria-hidden="true"></i><b>${counts[k]}</b>${esc(label)}</span>`).join('');
  const wide = new Set(['threedotjs', 'telegram']);
  const cards = labs.map((l, i) => {
    const acc = TINT[l.kind] || TINT.tools, gh = l.links.find(([t]) => /github|contracts/i.test(t))?.[1] || l.links[0][1];
    const live = l.links.find(([t]) => t === 'Live');
    const pic = l.shot && exists(l.shot) && img
      ? img(l.shot, fill(S.shotAlt, { n: l.name }), { sizes: '(min-width: 1100px) 31vw, (min-width: 560px) 46vw, 92vw' })
      : `<span class="lab-plate" aria-hidden="true"><span class="lab-repo">itsnevu / <b>${esc(gh.replace(/^https:\/\/github\.com\/itsnevu\//, '').replace(/\/.*$/, ''))}</b></span><i class="lab-mark${wide.has(l.mark) ? ' lab-mark--wide' : ''}" style="--m:url(/site/tools/${esc(l.mark)}.svg)"></i><span class="lab-meta"><b>${esc(KIND[l.kind])}</b><span>${esc(l.lang)}</span>${l.license ? `<span>${esc(l.license)}</span>` : ''}<span>${esc(l.when)}</span></span></span>`;
    const links = l.links.map(([t, h]) => `<a href="${esc(h)}"${h.startsWith('/') ? '' : ' target="_blank" rel="noopener"'} class="${t === 'Live' ? 'is-live' : ''}" data-track="lab_open" data-lab="${esc(l.key)}" data-channel="${esc(t)}">${esc(S.links[t] ?? t)} ${arrow}</a>`).join('');
    return `<li class="arc-card lab" data-kind="${l.kind}" style="--i:${i % 9};--acc:${acc}">
      <a href="${esc(live ? live[1] : gh)}"${live && live[1].startsWith('/') ? '' : ' target="_blank" rel="noopener"'} data-track="lab_open" data-lab="${esc(l.key)}" data-channel="card" aria-label="${esc(fill(live ? S.cardLive : S.cardRepo, { n: l.name }))}">
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
    <p class="p-lead arc-lead" data-reveal>${escText(S.lead)}</p>
    <div class="lab-stats" data-reveal>${stats}</div>
    <div class="arc-filters" role="group" aria-label="${esc(S.filter)}" data-reveal>${pills}</div>
    <p class="sr" role="status"></p>
    <ol class="arc-grid lab-grid" data-stagger>${cards}</ol>
    <div class="labs-end" data-reveal>
      <p>${escText(S.end)}</p>
      <a class="btn" href="https://github.com/itsnevu" target="_blank" rel="noopener" data-track="contact_click" data-channel="GitHub">github.com/itsnevu ${arrow}</a>
    </div>
  </section>`;
  return `<main id="main" tabindex="-1">
  <section class="arc labs wrap" aria-labelledby="labs-h">
    <div class="p-crumbs" data-reveal><a href="/">${esc(S.home)}</a><span>${esc(fill(S.count, { n }))}</span></div>
    <span class="p-kick" data-reveal>${kick(S.kick)}</span>
    <h1 class="p-title cap" id="labs-h" data-split>${splitPair(S.title, S.em)}</h1>
    <p class="p-lead arc-lead" data-reveal>${escText(S.lead)}</p>
    <div class="lab-stats" data-reveal>${stats}</div>
    <div class="arc-filters" role="group" aria-label="${esc(S.filter)}" data-reveal>${pills}</div>
    <p class="sr" role="status" id="arc-status"></p>
    <ol class="arc-grid lab-grid" data-stagger>${cards}</ol>
    <div class="labs-end" data-reveal>
      <p>${escText(S.end)}</p>
      <a class="btn" href="https://github.com/itsnevu" target="_blank" rel="noopener" data-track="contact_click" data-channel="GitHub">github.com/itsnevu ${arrow}</a>
    </div>
  </section>
</main>`;
}

// (the English meta, as the site has always read it; labsMetaFor(lang) below gives the same in every language)
export const LABS_META = {
  title: 'Labs | Navy Gibran',
  description: `${LABS.length} experiments by Navy Gibran, every one on GitHub: an AI browser agent, guardrails for agents, a voice assistant in Indonesian, ad analytics with AI insight, a Three.js fishing game and more.`,
  menu: { label: 'Labs', sub: `${LABS.length} experiments, no client` },
};

// the meta per language: {n} the labs, {w} the worlds, {d} the labs' description; `page` is the page's meta description, kept near
// 150 characters so a search result shows it whole
const META = {
  en: { title: LABS_META.title, description: LABS_META.description, label: LABS_META.menu.label, sub: LABS_META.menu.sub,
    page: '{w} 3D web interactive designs, each a scroll-driven world with a working app in the browser, and {n} experiments by Navy Gibran on GitHub.',
    imageAlt: 'Labs: the worlds and experiments of Navy Gibran' },
  id: { title: 'Labs | Navy Gibran', label: 'Labs', sub: '{n} eksperimen, tanpa klien',
    description: '{n} eksperimen karya Navy Gibran, semuanya ada di GitHub: agen browser AI, guardrail untuk agen, asisten suara berbahasa Indonesia, analitik iklan dengan insight AI, game memancing Three.js dan lainnya.',
    page: '{w} karya 3D web interactive design, tiap dunia bergerak mengikuti scroll dengan aplikasi yang jalan di browser, dan {n} eksperimen Navy Gibran di GitHub.',
    imageAlt: 'Labs: dunia dan eksperimen Navy Gibran' },
  zh: { title: '实验室 | Navy Gibran', label: '实验室', sub: '{n} 个实验，没有客户',
    description: 'Navy Gibran 的 {n} 个实验，全部开源在 GitHub 上：一个 AI 浏览器智能体、给智能体用的护栏、一个说印尼语的语音助手、带 AI 洞察的广告分析、一款 Three.js 钓鱼游戏，等等。',
    page: '{w} 个 3D 网页交互设计，每个都是随滚动展开、背后有真实应用在浏览器里运行的世界；另有 Navy Gibran 在 GitHub 上的 {n} 个实验。',
    imageAlt: '实验室：Navy Gibran 的世界与实验' },
};

/** The Labs page's meta in a language: { title, description, menu: { label, sub }, count, worlds, pageDescription, imageAlt }.
 *  `description` is the labs' own (LABS_META.description's counterpart), `pageDescription` the whole page's (the worlds first),
 *  `count` the number of labs and `worlds` the number of worlds. 'en' gives LABS_META's words exactly. */
export function labsMetaFor(lang = 'en') {
  const M = { ...META.en, ...(META[lang] || {}) }, v = { n: LABS.length, w: WORLDS.length };
  const description = fill(M.description, v);
  // (the English lowers the description's first letter as it joins the sentence; the other languages keep it as written)
  const d = lang === 'en' || !META[lang] ? `${description.charAt(0).toLowerCase()}${description.slice(1)}` : description;
  return { title: M.title, description, menu: { label: M.label, sub: fill(M.sub, v) }, count: LABS.length, worlds: WORLDS.length, pageDescription: fill(M.page, { ...v, d }), imageAlt: M.imageAlt };
}
