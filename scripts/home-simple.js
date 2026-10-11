// The simple home: the same portfolio for the people Navy actually sells to, owners of businesses who do not read a site, they look
// at it and then call. Six screens, about four hundred words, one button repeated (WhatsApp), and everything that moves kept:
// the intro, the hero that drifts with the pointer, counters, the logo loop, cards that tilt, a line that runs through the steps,
// the desk turning in its card. Indonesian first (the market), the strings in one table so the other languages can follow.
// This module renders only <main>, its CSS and its small script; scripts/site.js (or the preview) wraps it in the page shell and
// hands in the pieces it already renders: the hero picture, the portrait, the two logo rows.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const kick = (s) => `<span class="kick"><span class="sr">${esc(s)}</span><span class="kt" aria-hidden="true">${esc(s)}</span></span>`;
function split(s, n = { i: 0 }, em = false) {
  const out = esc(s).split(/\s+/).filter(Boolean).map((t) => `<span class="wd"><span style="--i:${n.i++}">${t}</span></span>`).join(' ');
  return em ? `<em>${out}</em>` : out;
}
const splitPair = (plain, italic) => { const n = { i: 0 }; return `${split(plain, n)} ${split(italic, n, true)}`; };
const arrow = '<svg class="ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const arrowR = '<svg class="ar ar-r" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const pad = (n) => String(n).padStart(2, '0');

// the words, by language (Indonesian is the one Navy's clients read; the others can be filled in later and fall back to it)
export const WORDS = {
  id: {
    who: 'Navy Gibran · Full-stack developer', title: 'Website dan sistem', titleEm: 'untuk bisnis Anda.',
    lead: 'Profil perusahaan, toko online, sampai sistem ERP. Dibuat rapi, mudah dipakai, dan siap dipakai setiap hari.',
    chat: 'Chat WhatsApp', seeWork: 'Lihat karya', status: 'Menerima proyek baru · Indonesia',
    sec: { hero: 'Pembuka', proof: 'Bukti', work: 'Karya', serv: 'Layanan', how: 'Caranya', contact: 'Kontak' },
    n_sites: 'situs klien live', n_projects: 'proyek', n_industries: 'industri', trusted: 'Dipercaya oleh',
    workKick: 'Karya', workTitle: 'Tiga contoh,', workEm: 'dari dua puluh.', allWork: 'Semua {n} proyek',
    kinds: { site: 'Website perusahaan', store: 'Toko online', erp: 'Sistem & ERP' },
    servKick: 'Layanan', servTitle: 'Yang bisa', servEm: 'saya buat.', example: 'Contoh: {t}',
    serv: {
      site: 'Profil usaha yang rapi, cepat dibuka, dan mudah ditemukan di Google.',
      store: 'Katalog, keranjang, pembayaran, dan pengiriman dalam satu toko.',
      erp: 'Karyawan, absensi, gaji, dan penjualan dalam satu sistem.',
    },
    howKick: 'Caranya', howTitle: 'Empat langkah,', howEm: 'tanpa ribet.',
    steps: [['Chat', 'Ceritakan usaha Anda.'], ['Sepakat', 'Lingkup dan biaya, tertulis.'], ['Dibuat', 'Anda ikut melihat prosesnya.'], ['Online', 'Diluncurkan, lalu dirawat.']],
    contactKick: 'Kontak', contactTitle: 'Ceritakan', contactEm: 'usaha Anda.', contactLine: 'Satu pesan cukup untuk mulai. Saya sendiri yang membalas.',
    waText: 'Halo Navy, saya lihat portofolio Anda dan ingin membuat website untuk usaha saya.',
    see3d: 'Lihat versi 3D', see3dSub: 'Portofolio yang sama, dibangun sebagai meja kerja.',
    alt3d: 'Meja kerja 3D di malam hari', altShot: 'Tampilan {t}',
  },
};
WORDS.en = {
  ...WORDS.id,
  who: 'Navy Gibran · Full-stack developer', title: 'Websites and systems', titleEm: 'for your business.',
  lead: 'Company profiles, online stores, up to ERP systems. Built tidy, easy to use, and ready for every day.',
  chat: 'Chat on WhatsApp', seeWork: 'See the work', status: 'Taking new projects · Indonesia',
  sec: { hero: 'Intro', proof: 'Proof', work: 'Work', serv: 'Services', how: 'How it goes', contact: 'Contact' },
  n_sites: 'live client sites', n_projects: 'projects', n_industries: 'industries', trusted: 'Trusted by',
  workKick: 'Work', workTitle: 'Three examples,', workEm: 'out of twenty.', allWork: 'All {n} projects',
  kinds: { site: 'Company website', store: 'Online store', erp: 'Systems & ERP' },
  servKick: 'Services', servTitle: 'What I can', servEm: 'build for you.', example: 'Example: {t}',
  serv: { site: 'A tidy company profile that opens fast and is easy to find on Google.', store: 'Catalogue, cart, payment and delivery in one store.', erp: 'Employees, attendance, payroll and sales in one system.' },
  howKick: 'How it goes', howTitle: 'Four steps,', howEm: 'no fuss.',
  steps: [['Chat', 'Tell me about your business.'], ['Agree', 'Scope and cost, in writing.'], ['Build', 'You watch it take shape.'], ['Launch', 'Live, then looked after.']],
  contactKick: 'Contact', contactTitle: 'Tell me about', contactEm: 'your business.', contactLine: 'One message is enough to start. I answer it myself.',
  waText: "Hi Navy, I saw your portfolio and I'd like a website for my business.",
  see3d: 'See the 3D version', see3dSub: 'The same portfolio, built as a desk.', alt3d: 'The 3D desk at night', altShot: '{t}',
};
WORDS.zh = { ...WORDS.en };   // (until the Chinese words are written)

// the three examples, one per kind of work, and the one-line said under each (in each language)
export const EXAMPLES = [
  { key: 'dams-garage', kind: 'site', line: { id: 'Website salon mobil premium di Tangerang Selatan.', en: 'The website of a premium car care shop in South Tangerang.' } },
  { key: 'flora-indonesia', kind: 'store', line: { id: 'Toko bunga online: pilih, bayar, kirim.', en: 'An online florist: choose, pay, deliver.' } },
  { key: 'godplan-erp', kind: 'erp', line: { id: 'Satu sistem untuk karyawan, absensi, gaji, dan CRM.', en: 'One system for employees, attendance, payroll and CRM.' } },
];

const ICONS = {
  site: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 13h5M7 16h8"/></svg>',
  store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 9l1.5-5h13L20 9M4 9v10a1 1 0 001 1h14a1 1 0 001-1V9M4 9h16M9 20v-6h6v6"/></svg>',
  erp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
};

/**
 * The page's <main>. `D` is the data module, `lang` the language, `pieces` what the shell already renders (heroMedia, portrait,
 * loops: the two logo rows, deskShot and whether the loop video exists), `img` the site's picture helper, `u` the link prefix.
 */
export function homeSimpleMain({ D, lang = 'id', pieces, img, u = (p) => p, projectMedia }) {
  const W = WORDS[lang] || WORDS.id, L = (o) => o[lang] || o.id;
  const fillVars = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m);
  const P = (k) => D.PROJECTS.find((p) => p.key === k);
  const clientSites = D.PROJECTS.filter((p) => p.url && p.date !== 'previous design').length;
  const projects = D.PROJECTS.filter((p) => p.key !== 'client-websites').length;
  const wa = `https://wa.me/${D.SITE.whatsapp}?text=${encodeURIComponent(W.waText)}`;
  const phone = (n) => { const d = String(n).replace(/\D/g, ''); const cc = d.slice(0, 2), r = d.slice(2); return `+${cc} ${r.slice(0, 3)} ${r.slice(3, 7)} ${r.slice(7)}`.trim(); };
  const av = pieces.avatar ? '<img class="btn-av" src="/site/avatar.webp" alt="" width="40" height="40" decoding="async">' : '';
  const chatBtn = (cls = 'btn btn-fill btn-lg') => `<a class="${cls}" href="${wa}" target="_blank" rel="noopener" data-track="contact_click" data-channel="WhatsApp" data-magnet>${av}${esc(W.chat)} ${arrow}</a>`;

  const cards = EXAMPLES.map((x, i) => {
    const p = P(x.key); if (!p) return '';
    const m = projectMedia(D, p);
    return `<li class="hs-card" style="--i:${i}"><a href="${u(`/work/${p.key}/`)}" data-track="project_open" data-project="${p.key}" data-from="simple" data-name="${esc(p.title)}">
      <span class="hs-pic">${m.cover ? img(m.cover, fillVars(W.altShot, { t: p.title }), { sizes: '(min-width: 900px) 31vw, 92vw' }) : ''}</span>
      <span class="hs-k">${esc(W.kinds[x.kind])}</span><span class="hs-t">${esc(p.title)}</span><span class="hs-l">${esc(L(x.line))}</span>
    </a></li>`;
  }).join('');
  const serv = ['site', 'store', 'erp'].map((k, i) => {
    const eg = P(EXAMPLES.find((x) => x.kind === k).key);
    return `<li style="--i:${i}"><i>${ICONS[k]}</i><h3>${esc(W.kinds[k])}</h3><p>${esc(W.serv[k])}</p><a class="eg" href="${u(`/work/${eg.key}/`)}" data-track="project_open" data-project="${eg.key}" data-from="simple-serv">${esc(fillVars(W.example, { t: eg.title }))} ${arrowR}</a></li>`;
  }).join('');
  const steps = W.steps.map(([s, b], i) => `<li style="--i:${i}"><b>${pad(i + 1)}</b><strong>${esc(s)}</strong><span>${esc(b)}</span></li>`).join('');

  return `<main id="main" tabindex="-1">
  <section class="hero hs-hero" aria-label="${esc(W.sec.hero)}" data-scene="hero">
    ${pieces.heroMedia}
    ${pieces.portrait}
    <div class="hero-in wrap">
      <p class="hero-who">${kick(W.who)}</p>
      <h1 class="hero-title cap hs-title" data-split>${splitPair(W.title, W.titleEm)}</h1>
      <p class="hs-lead" data-reveal>${esc(W.lead)}</p>
      <div class="hero-cta" data-reveal>${chatBtn()}<a class="btn btn-lg" href="#karya" data-magnet>${esc(W.seeWork)} ${arrowR}</a></div>
      <p class="hs-status" data-reveal><span class="dot dot--open" aria-hidden="true"></span>${esc(W.status)}</p>
    </div>
  </section>

  <section class="hs-proof" aria-label="${esc(W.sec.proof)}" data-sec="${esc(W.sec.proof)}">
    <div class="wrap hs-nums" data-stagger>
      <div><b><span data-count="${clientSites}">${clientSites}</span></b><span>${esc(W.n_sites)}</span></div>
      <div><b><span data-count="${projects}">${projects}</span></b><span>${esc(W.n_projects)}</span></div>
      <div><b><span data-count="10">10</span><i>+</i></b><span>${esc(W.n_industries)}</span></div>
    </div>
    <div class="cream hs-logos" data-scene="cream">
      <span class="lbl">${esc(W.trusted)}</span>
      ${pieces.loops}
    </div>
  </section>

  <section class="hs-work wrap" id="karya" aria-labelledby="hs-work-h" data-sec="${esc(W.sec.work)}">
    <div class="hs-head"><div data-reveal>${kick(W.workKick)}</div><h2 class="serif-h" id="hs-work-h" data-split>${splitPair(W.workTitle, W.workEm)}</h2></div>
    <ol class="hs-cards" data-stagger>${cards}</ol>
    <a class="btn hs-more" href="${u('/work/')}" data-magnet data-reveal>${esc(fillVars(W.allWork, { n: projects }))} ${arrowR}</a>
  </section>

  <section class="hs-serv wrap" aria-labelledby="hs-serv-h" data-sec="${esc(W.sec.serv)}">
    <div class="hs-head"><div data-reveal>${kick(W.servKick)}</div><h2 class="serif-h" id="hs-serv-h" data-split>${splitPair(W.servTitle, W.servEm)}</h2></div>
    <ul class="hs-serv-list" data-stagger>${serv}</ul>
  </section>

  <section class="hs-how wrap" aria-labelledby="hs-how-h" data-sec="${esc(W.sec.how)}">
    <div class="hs-head"><div data-reveal>${kick(W.howKick)}</div><h2 class="serif-h" id="hs-how-h" data-split>${splitPair(W.howTitle, W.howEm)}</h2></div>
    <ol class="hs-steps" data-stagger>${steps}</ol>
  </section>

  <section class="hs-contact wrap" id="kontak" aria-labelledby="hs-contact-h" data-sec="${esc(W.sec.contact)}" data-hide-tab>
    <div class="hs-contact-grid">
      <div>
        <div data-reveal>${kick(W.contactKick)}</div>
        <h2 class="serif-h" id="hs-contact-h" data-split>${splitPair(W.contactTitle, W.contactEm)}</h2>
        <p class="big" data-reveal>${esc(W.contactLine)}</p>
        <div class="hs-contact-cta" data-reveal>${chatBtn()}</div>
        <p class="hs-lines" data-reveal><a href="tel:+${D.SITE.whatsapp}">${esc(phone(D.SITE.whatsapp))}</a><i aria-hidden="true">·</i><a href="mailto:${esc(D.SITE.email)}">${esc(D.SITE.email)}</a></p>
      </div>
      <a class="hs-3d" href="${u('/3d/')}" data-track="3d_cta_click" data-from="simple" data-reveal>${img(pieces.deskShot, W.alt3d, { sizes: '(min-width: 900px) 40vw, 100vw' })}${pieces.loopVideo ? '<video muted loop playsinline preload="none" aria-hidden="true" tabindex="-1" data-mp4="/site/desk-loop.mp4"></video>' : ''}<span><b>${esc(W.see3d)} ${arrow}</b><small>${esc(W.see3dSub)}</small></span></a>
    </div>
  </section>
  <div class="hs-bar" aria-hidden="true">${chatBtn('btn btn-fill')}</div>
</main>`;
}

export const HOME_SIMPLE_CSS = `
/* ---------- the simple home (scripts/home-simple.js): bigger type, one button, six screens */
body.home-simple { font-size: 20px; }
.hs-title { max-width: 11em; }
.hs-lead { max-width: 26em; margin: clamp(18px, 2vw, 26px) 0 clamp(22px, 2.6vw, 34px); font-size: clamp(19px, 1.5vw, 24px); line-height: 1.5; color: var(--dim); text-wrap: pretty; }
.hs-status { display: flex; align-items: center; gap: 10px; margin-top: 24px; font: 600 12px var(--cond); letter-spacing: 0.18em; text-transform: uppercase; color: var(--dim); }
.hs-proof { padding-top: clamp(60px, 7vw, 100px); }
.hs-nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding-bottom: clamp(48px, 6vw, 80px); }
.hs-nums > div { display: grid; gap: 6px; padding-top: 22px; border-top: 1px solid var(--line-2); }
.hs-nums b { font: 400 clamp(56px, 7vw, 120px)/0.9 var(--serif); letter-spacing: -0.02em; }
.hs-nums b i { font-style: normal; color: var(--accent-2); }
.hs-nums > div > span { font: 600 13px var(--cond); letter-spacing: 0.18em; text-transform: uppercase; color: var(--dim); }
.hs-logos { padding: clamp(40px, 5vw, 70px) 0 clamp(26px, 3vw, 44px); }
.hs-logos > .lbl { display: block; text-align: center; margin-bottom: 26px; }
.hs-head { display: grid; grid-template-columns: repeat(12, 1fr); column-gap: 24px; row-gap: 16px; align-items: end; margin-bottom: clamp(36px, 4vw, 56px); }
.hs-head > div { grid-column: 1 / 13; } .hs-head .serif-h { grid-column: 1 / 10; }
.hs-work, .hs-serv, .hs-how, .hs-contact { padding-top: clamp(90px, 10vw, 150px); }
.hs-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.hs-card a { display: grid; gap: 10px; transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); transition: transform 0.5s var(--ease); }
.hs-pic { display: block; aspect-ratio: 4 / 3; overflow: hidden; border-radius: 10px; background: var(--bg-2); box-shadow: 0 0 0 1px var(--line), 0 30px 60px -30px rgba(0, 0, 0, 0.8); }
.hs-pic img { width: 100%; height: 100%; object-fit: cover; object-position: top; transition: transform 1.2s var(--ease); }
.hs-card a:hover .hs-pic img, .hs-card a:focus-visible .hs-pic img { transform: scale(1.05); }
.hs-k { margin-top: 8px; font: 600 12px var(--cond); letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent-2); }
.hs-t { font: 700 clamp(26px, 2.4vw, 40px)/1 var(--cond); text-transform: uppercase; transition: color 0.3s; }
.hs-card a:hover .hs-t { color: var(--accent-2); }
.hs-l { font-size: 18px; color: var(--dim); text-wrap: pretty; }
.hs-more { margin-top: clamp(32px, 4vw, 48px); }
.hs-serv-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.hs-serv-list li { display: grid; gap: 14px; align-content: start; padding: clamp(24px, 2.6vw, 36px); border: 1px solid var(--line-2); border-radius: 14px; transition: border-color 0.3s, transform 0.5s var(--ease); }
.hs-serv-list li:hover { border-color: var(--ink); transform: translateY(-4px); }
.hs-serv-list i { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; background: rgba(217, 160, 91, 0.14); color: var(--accent-2); transition: transform 0.5s var(--ease); }
.hs-serv-list li:hover i { transform: rotate(-8deg) scale(1.08); }
.hs-serv-list svg { width: 26px; height: 26px; }
.hs-serv-list h3 { font: 700 clamp(24px, 2vw, 32px)/1 var(--cond); text-transform: uppercase; }
.hs-serv-list p { font-size: 18px; color: var(--dim); text-wrap: pretty; }
.hs-serv-list .eg { display: inline-flex; align-items: center; gap: 6px; font: 600 12px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent-2); }
.hs-steps { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding-top: 28px; }
.hs-steps::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--line); }
.hs-steps::after { content: ""; position: absolute; left: 0; top: 0; width: 100%; height: 1px; background: var(--accent); transform-origin: left; transform: scaleX(var(--go, 0)); transition: transform 1.8s var(--ease); }
.hs-steps li { display: grid; gap: 8px; align-content: start; }
.hs-steps b { font: 600 13px var(--cond); letter-spacing: 0.14em; color: var(--accent); }
.hs-steps strong { font: 700 clamp(28px, 2.6vw, 44px)/0.95 var(--cond); text-transform: uppercase; }
.hs-steps span { font-size: 17px; color: var(--dim); }
.hs-contact { padding-bottom: clamp(90px, 10vw, 150px); }
.hs-contact-grid { display: grid; grid-template-columns: 7fr 5fr; gap: 48px; align-items: center; }
.hs-contact .big { max-width: 24em; margin: 18px 0 28px; font-size: clamp(19px, 1.5vw, 24px); color: var(--dim); text-wrap: pretty; }
.hs-lines { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 14px; margin-top: 22px; font-size: 20px; }
.hs-lines a { border-bottom: 1px solid var(--line-2); transition: color 0.3s, border-color 0.3s; } .hs-lines a:hover { color: var(--accent-2); border-color: var(--accent-2); }
.hs-lines i { font-style: normal; color: var(--faint); }
.hs-3d { position: relative; display: block; aspect-ratio: 4 / 3; overflow: hidden; border-radius: 14px; box-shadow: 0 0 0 1px var(--line), 0 40px 80px -40px rgba(0, 0, 0, 0.9); }
.hs-3d img, .hs-3d video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hs-3d img { transition: transform 1.4s var(--ease); } .hs-3d:hover img { transform: scale(1.04); }
.hs-3d video { opacity: 0; transition: opacity 0.6s; } .hs-3d.play video { opacity: 1; }
.hs-3d::after { content: ""; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(10, 8, 6, 0.85), transparent 55%); }
.hs-3d > span { position: absolute; z-index: 1; left: 22px; right: 22px; bottom: 20px; display: grid; gap: 4px; }
.hs-3d b { display: inline-flex; align-items: center; gap: 8px; font: 700 clamp(22px, 2vw, 32px)/1 var(--cond); text-transform: uppercase; }
.hs-3d small { font-size: 15px; color: rgba(241, 234, 219, 0.82); }
.hs-bar { display: none; }
@media (max-width: 1100px) { .hs-contact-grid { grid-template-columns: 1fr; } .hs-3d { max-width: 560px; } }
@media (max-width: 900px) {
  .hs-cards, .hs-serv-list { grid-template-columns: 1fr; }
  .hs-steps { grid-template-columns: 1fr 1fr; }
  .hs-head .serif-h { grid-column: 1 / 13; }
  .hs-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; display: flex; padding: 10px max(14px, env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left)); background: rgba(14, 12, 9, 0.86); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border-top: 1px solid var(--line); transform: translateY(110%); transition: transform 0.5s var(--ease); }
  .hs-bar.on { transform: none; }
  .hs-bar .btn { flex: 1; height: 54px; }
  body.home-simple .side-3d, body.home-simple .side-3d-nav { display: none; }
  body.home-simple .foot { padding-bottom: 90px; }
}
@media (max-width: 560px) { .hs-nums { gap: 12px; } .hs-nums b { font-size: clamp(40px, 12vw, 56px); } .hs-steps { grid-template-columns: 1fr; } .hero-cta .btn { width: 100%; } }
@media (prefers-reduced-motion: reduce) { .hs-card a { transform: none !important; } .hs-steps::after { transition: none; } }
`;

// the page's own motion: cards tilt toward the pointer (mouse only), the steps' line runs once they are in view, the desk's loop
// plays in its card while it is on screen, the phone's WhatsApp bar appears once the hero's own button has scrolled away
export const HOME_SIMPLE_JS = `(function(){
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-off');
  if (fine && !reduce) document.querySelectorAll('.hs-card a').forEach(function (a) {
    a.addEventListener('pointermove', function (e) { var r = a.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; a.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg'); a.style.setProperty('--rx', (-y * 9).toFixed(2) + 'deg'); });
    a.addEventListener('pointerleave', function () { a.style.setProperty('--ry', '0deg'); a.style.setProperty('--rx', '0deg'); });
  });
  if (!('IntersectionObserver' in window)) return;
  var steps = document.querySelector('.hs-steps');
  if (steps) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) steps.style.setProperty('--go', 1); }); }, { threshold: 0.35 }).observe(steps);
  var card = document.querySelector('.hs-3d'), v = card && card.querySelector('video');
  if (v && !reduce) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { if (!v.src) v.src = v.dataset.mp4; v.play().then(function () { card.classList.add('play'); }).catch(function () {}); } else v.pause(); }); }, { threshold: 0.3 }).observe(card);
  var bar = document.querySelector('.hs-bar'), ctas = document.querySelectorAll('.hero-cta, .hs-contact-cta'), seen = new Map();
  if (bar && ctas.length) { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { seen.set(e.target, e.isIntersecting); }); var hero = ctas[0].getBoundingClientRect(); var anyIn = false; seen.forEach(function (v) { if (v) anyIn = true; }); bar.classList.toggle('on', !anyIn && hero.bottom < 0); }); ctas.forEach(function (c) { io.observe(c); }); }
})();`;
