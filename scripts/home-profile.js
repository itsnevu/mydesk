// The profile home: the portfolio as one narrow column anyone can scan in a minute, the way a GitHub or LinkedIn profile reads
// (Navy's reference: zickrian.dev). A card with the banner, the portrait, one paragraph and the links; a row of tabs to the rest of
// the site; then lists, not prose: experience, projects, clients, stack, each a row with a name, a line and a chip or two,
// the long parts folded away behind a toggle. Our own palette and type stay, and so does the motion: the banner drifts with the
// pointer, rows light as they arrive, chips answer the hover, notes appear in the margins on a wide screen.
// This module renders only <main>, its CSS and its script; scripts/site.js (or the preview) wraps it in the page shell.
import { DITHER_JS } from './dither.js';
import { STACK, stackModel, stackSection, STACK_CSS, STACK_JS } from './stack-tools.js';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const I = {
  work: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 12h18"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1.5 1.5M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1.5-1.5"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>',
  flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 3h6M10 3v6l-5.5 9A2 2 0 006.2 21h11.6a2 2 0 001.7-3L14 9V3"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/></svg>',
  cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>',
  org: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16M15 9h4a1 1 0 011 1v11M8 8h3M8 12h3M8 16h3M3 21h18"/></svg>',
  cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 9l10-5 10 5-10 5L2 9zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  out: '<svg class="ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  pause: '<svg class="pz" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9M11 3.5v9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  play: '<svg class="pl" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6L12.6 8z" fill="currentColor"/></svg>',
  right: '<svg class="ar ar-r" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
};
// +62 851-7953-6062 from 6285179536062 (Indonesian mobile numbers: country code, then 3-4-4)
const phoneOf = (n) => { const d = String(n).replace(/\D/g, ''); return d.startsWith('62') && d.length >= 11 ? `+62 ${d.slice(2, 5)}-${d.slice(5, 9)}-${d.slice(9)}` : `+${d}`; };
const mark = (slug, cls = '') => `<i class="pf-m${cls ? ' ' + cls : ''}" style="--m:url(/site/tools/${slug}.svg)" aria-hidden="true"></i>`;

export const WORDS = {
  id: {
    handle: '@itsnevu', role: 'Full-stack developer', where: 'Indonesia', site: 'navygibran.dev', open: 'Menerima proyek baru',
    bio: 'Full-stack developer dari Indonesia. Saya membangun sistem ERP dengan Go dan Next.js, serta website untuk bisnis: profil perusahaan, toko online, dan aplikasi custom. Dua puluh tiga situs klien online hari ini.',
    live: 'situs live', tabs: { home: 'Beranda', work: 'Karya', labs: 'Labs', cv: 'CV', desk: 'Desk 3D' },
    exp: 'Pengalaman', edu: 'Pendidikan', projects: 'Proyek', clients: 'Klien', stack: 'Stack',
    viewAll: 'Lihat semua', more: 'Tampilkan lebih banyak', less: 'Tampilkan lebih sedikit', open_: 'Buka', close_: 'Tutup',
    status: { live: 'Live', first: 'Versi pertama', done: 'Selesai' }, year: { 'godplan-erp': '2025', jakasn: '2025' },
    dur: { y: 'tahun', m: 'bulan', d: 'hari' }, present: 'sekarang',
    thanks: 'Terima kasih sudah mempercayakan brand Anda kepada saya.',
    notes: ['Dari mengangkat TV ke lantai atas sampai membangun ERP.', 'Dua puluh enam proyek. Dua puluh tiga di antaranya online hari ini.', 'Satu pesan cukup untuk mulai.'],
    ctaTitle: 'Ceritakan usaha Anda.', ctaLine: 'Website, toko online, atau sistem. Satu pesan cukup untuk mulai, dan saya sendiri yang membalas.',
    chat: 'Chat WhatsApp', see3d: 'Lihat versi 3D', cvBtn: 'Unduh CV', email: 'Email',
    waText: 'Halo Navy, saya lihat portofolio Anda dan ingin membicarakan sebuah proyek.',
    altBanner: 'Meja kerja Navy Gibran di malam hari', altPortrait: 'Navy Gibran',
    reel: '3D web interactive design', reelLine: '{n} dunia 3D yang dijelajahi dengan scroll: tiap dunia satu cerita, satu produk, dan satu aplikasi yang benar-benar jalan di browser. Dibuat dengan three.js.',
    featured: 'Unggulan', localTime: 'Waktu setempat', fab: 'Chat',
    pause: 'Jeda', play: 'Putar', tabsLabel: 'Navigasi situs', copyMail: 'Salin email', copyNum: 'Salin nomor', aboutRow: 'Selengkapnya tentang {o}',
    services: 'Yang saya bangun', processT: 'Cara kerjanya', nowIs: 'Kini {n}',
    ring: 'Terbuka untuk freelance & full-time', enter3d: 'Masuk ke desk 3D', expandAll: 'Buka semua', collapseAll: 'Tutup semua',
    rail: { me: 'Profil', worlds: 'Dunia 3D', contact: 'Kontak' }, railLabel: 'Bagian halaman', hl: ['sistem ERP', 'Dua puluh tiga situs klien'], stats: { live: 'situs live', projects: 'proyek', worlds: 'dunia 3D' },
    reelOpen: 'Buka di Labs', reelAll: 'Jelajahi {n} dunia', reelHint: 'Arahkan ke gambar kecil untuk ganti dunia', reelHintTouch: 'Ketuk gambar kecil untuk ganti dunia', reelAlt: 'Satu frame dari dunia 3D {n}',
  },
};
WORDS.en = {
  ...WORDS.id,
  role: 'Full-stack developer', where: 'Indonesia', open: 'Taking new projects',
  bio: 'Full-stack developer from Indonesia. I build ERP systems in Go and Next.js, and websites for businesses: company profiles, online stores and custom applications. Twenty-three client sites are live today.',
  live: 'live sites', tabs: { home: 'Home', work: 'Work', labs: 'Labs', cv: 'CV', desk: '3D desk' },
  exp: 'Experience', edu: 'Education', projects: 'Projects', clients: 'Clients', stack: 'Stack',
  viewAll: 'View all', more: 'Show more', less: 'Show less', open_: 'Open', close_: 'Close',
  status: { live: 'Live', first: 'First version', done: 'Done' }, dur: { y: 'yr', m: 'mo', d: 'days' }, present: 'present',
  thanks: 'Thank you for trusting me with your brand.',
  notes: ['From carrying TVs upstairs to building an ERP.', 'Twenty-six projects. Twenty-three of them are live today.', 'One message is enough to start.'],
  ctaTitle: 'Tell me about your business.', ctaLine: 'A website, an online store or a system. One message is enough to start, and I answer it myself.',
  chat: 'Chat on WhatsApp', see3d: 'See the 3D version', cvBtn: 'Download CV', email: 'Email',
  waText: "Hi Navy, I saw your portfolio and I'd like to talk about a project.", altBanner: "Navy Gibran's desk at night", altPortrait: 'Navy Gibran',
  reel: '3D web interactive design', reelLine: '{n} worlds in 3D you scroll through: each one a story, a product and a working app that really runs in the browser. Built with three.js.',
  featured: 'Featured', localTime: 'Local time', fab: 'Chat',
  pause: 'Pause', play: 'Play', tabsLabel: 'Site', copyMail: 'Copy email', copyNum: 'Copy number', aboutRow: 'More about {o}',
  services: 'What I build', processT: 'How it works', nowIs: 'Now {n}',
  ring: 'Open to freelance & full-time', enter3d: 'Step into the 3D desk', expandAll: 'Expand all', collapseAll: 'Collapse all',
  rail: { me: 'Profile', worlds: '3D worlds', contact: 'Contact' }, railLabel: 'Sections', hl: ['ERP systems', 'Twenty-three client sites'], stats: { live: 'live sites', projects: 'projects', worlds: '3D worlds' },
  reelOpen: 'Open in Labs', reelAll: 'Explore {n} worlds', reelHint: 'Point at a small frame to change the world', reelHintTouch: 'Tap a small frame to change the world', reelAlt: 'A frame of the 3D world {n}',
};
WORDS.zh = {
  ...WORDS.en,
  role: '全栈开发者', where: '印度尼西亚', open: '接新项目',
  bio: '来自印度尼西亚的全栈开发者。我用 Go 和 Next.js 做 ERP 系统，也为企业做网站：企业官网、网上商店和定制应用。如今有二十三个客户网站在线运行。',
  live: '个上线网站', tabs: { home: '首页', work: '作品', labs: '实验室', cv: '简历', desk: '3D 桌面' },
  exp: '经历', edu: '教育', projects: '项目', clients: '客户', stack: '技术栈',
  viewAll: '查看全部', more: '显示更多', less: '收起', open_: '展开', close_: '收起',
  status: { live: '已上线', first: '第一版', done: '已完成' }, dur: { y: '年', m: '个月', d: '天' }, present: '至今',
  thanks: '感谢你把品牌托付给我。',
  notes: ['从扛电视上楼，到构建 ERP。', '二十六个项目，其中二十三个如今在线。', '一条消息就能开始。'],
  ctaTitle: '说说你的生意。', ctaLine: '一个网站、一家网店或一套系统。一条消息就能开始，而且由我本人回复。',
  chat: '用 WhatsApp 聊', see3d: '看 3D 版本', cvBtn: '下载简历', email: '邮箱',
  waText: 'Hi Navy! 我看了你的作品集，想聊一个项目。', altBanner: 'Navy Gibran 夜里的书桌', altPortrait: 'Navy Gibran',
  reel: '3D 网页交互设计', reelLine: '{n} 个可以滚动穿行的 3D 世界：每个都是一个故事、一个产品，以及一个真正在浏览器里运行的应用。用 three.js 构建。',
  featured: '精选', localTime: '当地时间', fab: '聊天',
  pause: '暂停', play: '播放', tabsLabel: '网站导航', copyMail: '复制邮箱', copyNum: '复制号码', aboutRow: '关于 {o} 的更多',
  services: '我做什么', processT: '合作流程', nowIs: '现为 {n}',
  ring: '接受自由职业与全职工作', enter3d: '进入 3D 桌面', expandAll: '全部展开', collapseAll: '全部收起',
  rail: { me: '简介', worlds: '3D 世界', contact: '联系' }, railLabel: '页面章节', hl: ['ERP 系统', '二十三个客户网站'], stats: { live: '个上线网站', projects: '个项目', worlds: '个 3D 世界' },
  reelOpen: '在实验室打开', reelAll: '探索 {n} 个世界', reelHint: '指向小图即可切换世界', reelHintTouch: '轻点小图即可切换世界', reelAlt: '3D 世界 {n} 的一帧',
};
// the chips that are words rather than tool names, in the page's language (the tool names stay as they are written)
// (a chip that is a project with its own page links to it)
const CHIP_LINK = { 'GodPlan ERP': 'godplan-erp', JAKASN: 'jakasn' };
const CHIP_T = {
  en: { TK: 'Kindergarten', SD: 'Primary school', SMP: 'Junior high', SMA: 'Senior high' },
  id: { 'GPA 3.71': 'IPK 3.71', 'Teaching assistant': 'Asisten dosen', 'Field work': 'Kerja lapangan', '341 laptops': '341 laptop', 'Custom themes': 'Tema custom', 'Wallet integration': 'Integrasi wallet', 'dApp frontends': 'Frontend dApp' },
  zh: { 'GPA 3.71': '绩点 3.71', 'Teaching assistant': '助教',
    Hardware: '硬件', '341 laptops': '341 台笔记本', 'Field work': '现场工作', 'Competitive programming': '算法竞赛', 'Design patterns': '设计模式',
    TK: '幼儿园', SD: '小学', SMP: '初中', SMA: '高中', 'REST APIs': 'REST API', 'Custom themes': '定制主题', 'Smart contracts': '智能合约',
    'Wallet integration': '钱包集成', 'dApp frontends': 'dApp 前端',
  },
};

// what each stop of the path carries beyond its words (the words come from i18n, in the same order): a logo, its chips, its
// span in months (year, month; null = present) for the duration, and whether it is education
// (`logo` is a one-colour mark in public/site/logos, made from the organisation's own site: a .webp silhouette, or an .svg)
const PATH_META = [
  { logo: 'gajah-terbang-kreatif', mono: 'GTK', chips: ['Go', 'Next.js', 'WordPress', 'GodPlan ERP'], from: [2025, 7], to: null },
  { logo: 'bkn', mono: 'BKN', chips: ['PHP', 'MySQL', 'OJS', 'JAKASN'], from: [2025, 1], to: [2025, 6] },
  { logo: 'umn', mono: 'PC', chips: ['C++', 'Competitive programming'], from: [2024, 1], to: [2025, 1], loose: true },
  { logo: 'compnet', big: true, mono: 'NCI', chips: ['Hardware', '341 laptops', 'BNI'], days: 2 },   // (the BNI laptops: Compnet's job, BNI the client)
  { logo: 'compnet', big: true, mono: 'NCI', chips: ['Field work', 'Pertamina'] },
  { logo: 'umn', mono: 'UMN', chips: ['Teaching assistant', 'OOP', 'SOLID', 'Design patterns', 'GPA 3.71'], from: [2022, 8], to: [2026, 6], loose: true, edu: true },
  { logo: 'pahoa', mono: 'PH', chips: ['TK', 'SD', 'SMP', 'SMA', '2021'], edu: true },
];
const TOOL_MARK = {
  Go: 'go', TypeScript: 'typescript', JavaScript: 'javascript', PHP: 'php', Solidity: 'solidity', Python: 'python', 'Next.js': 'nextdotjs', React: 'react', SvelteKit: 'svelte', 'Tailwind CSS': 'tailwindcss',
  'Node.js': 'nodedotjs', Bun: 'bun', PostgreSQL: 'postgresql', MySQL: 'mysql', WordPress: 'wordpress', WooCommerce: 'woocommerce', Elementor: 'elementor',
  Docker: 'docker', Vercel: 'vercel', Swagger: 'swagger', DBeaver: 'dbeaver', Figma: 'figma', GSAP: 'gsap', 'Framer Motion': 'framer', 'Three.js': 'threedotjs', WebGL: 'webgl',
  'Smart contracts': 'ethereum', 'Wallet integration': 'walletconnect', 'C++': 'cplusplus', OJS: 'php', 'GodPlan ERP': 'go', JAKASN: 'php',
};
const SOCIAL = [['WhatsApp', 'whatsapp'], ['Email', 'gmail'], ['LinkedIn', 'linkedin'], ['GitHub', 'github'], ['X', 'x']];

/** The page's <main>. `path` and `stackNames` are the language's rows from i18n; `worlds` the Labs worlds; `clients` [{key, name, word?}];
 * `gh` the GitHub snapshot (scripts/github-stats.json) the stack counts from. */
export function homeProfileMain({ D, lang = 'id', path, stackNames, worlds = [], clients, gh, services: svc = [], process: steps = [], exists, img, u = (p) => p, tp = (p, f) => p[f], projectMedia, stackOf = (p) => p.stack || '', roll = (x) => esc(x), now = new Date() }) {
  const W = WORDS[lang] || WORDS.id;
  const chip = (t) => { const s = TOOL_MARK[t], inner = `${s && exists(`site/tools/${s}.svg`) ? mark(s) : ''}${esc(CHIP_T[lang]?.[t] ?? t)}`; return CHIP_LINK[t] ? `<a class="pf-chip pf-chip--a" href="${u(`/work/${CHIP_LINK[t]}/`)}" data-track="project_open" data-project="${CHIP_LINK[t]}" data-from="profile-chip">${inner}</a>` : `<span class="pf-chip">${inner}</span>`; };
  const dur = (m) => {
    if (m.days) return `${m.days} ${W.dur.d}`;
    if (!m.from) return '';
    const to = m.to || [now.getFullYear(), now.getMonth() + 1];
    const n = (to[0] - m.from[0]) * 12 + (to[1] - m.from[1]) + (m.to ? 1 : 0);
    if (m.loose) return `${Math.max(1, Math.round(n / 12))} ${W.dur.y}`;   // (a span known only by its years)
    const y = Math.floor(n / 12), mo = n % 12;
    return [y ? `${y} ${W.dur.y}` : '', mo ? `${mo} ${W.dur.m}` : ''].filter(Boolean).join(' ') || `1 ${W.dur.m}`;
  };
  const logoFile = (m) => m.logo && (m.logo.includes('.') ? m.logo : `${m.logo}.webp`);
  // (`big` lets a fine-lined mark fill more of its circle, or it reads as a smudge at 44 px)
  const avatar = (m) => logoFile(m) && exists(`site/logos/${logoFile(m)}`) ? `<i class="pf-av pf-av--m" style="--m:url(/site/logos/${logoFile(m)})${m.big ? ';--ms:92%' : ''}" aria-hidden="true"></i>` : `<i class="pf-av" aria-hidden="true">${esc(m.mono || '')}</i>`;
  const rowPath = (r, m, i, open = false) => `<li class="pf-row pf-exp${m.from && m.to === null ? ' pf-row--now' : ''}${open ? ' open' : ''}" style="--i:${i}">
      ${m.from && m.to === null ? '<i class="pf-pulse" aria-hidden="true"></i>' : ''}${avatar(m)}
      <div class="pf-body">
        <div class="pf-top"><b>${esc(r.org)}</b><button type="button" class="pf-tg" aria-expanded="${open}" aria-label="${esc(W.aboutRow.replace('{o}', r.org))}">${I.chev}</button></div>
        <span class="pf-role">${esc(r.role)}</span>
        <span class="pf-meta"><span>${esc(r.when)}</span>${dur(m) ? `<i>·</i><span>${esc(dur(m))}</span>` : ''}</span>
        <div class="pf-chips">${m.chips.map(chip).join('')}</div>
        <div class="pf-fold"><p>${esc(r.body)}</p></div>
      </div>
    </li>`;
  const rows = path.map((r, i) => [r, PATH_META[i] || { chips: [] }, i]);
  const expRows = rows.filter(([, m]) => !m.edu), eduRows = rows.filter(([, m]) => m.edu);
  const nowOrg = (rows.find(([, m]) => m.from && m.to === null) || [])[0]?.org || '';   // (the job with no end: shown in the hero)
  const exp = expRows.map(([r, m, i], k) => rowPath(r, m, i, k < 2)).join('');   // (the two jobs open: a recruiter reads them without a click)
  const edu = eduRows.map(([r, m, i]) => rowPath(r, m, i)).join('');

  const counted = D.PROJECTS.filter((p) => p.key !== 'client-websites');
  const clientSites = D.PROJECTS.filter((p) => p.url && p.date !== 'previous design').length;
  const status = (p) => p.now ? W.nowIs.replace('{n}', p.now.name) : W.year[p.key] || (p.year ? String(p.year) : p.date === 'previous design' ? W.status.first : p.date === 'live' ? W.status.live : p.date);
  const stat = (p) => {
    const yr = W.year[p.key] || (p.year ? String(p.year) : '');
    if (!p.now && p.date === 'live') return `<span class="pf-live"><i aria-hidden="true"></i>${esc(W.status.live)}</span>${yr ? `<i>·</i><span>${esc(yr)}</span>` : ''}`;
    return `<span>${esc(status(p))}</span>`;
  };
  const stk = (p) => (p.stack ? stackOf(p) : '').split(' · ').slice(0, 2).join(' · ');   // (stackOf: site.js, the words translated)
  const sm = (rel, w) => { const x = rel.replace(/\.webp$/, `-${w}.webp`); return x !== rel && exists(x) ? x : null; };
  const cover = (rel, sizes, w, h) => { const set = [[sm(rel, 384), 384], [sm(rel, 800), 800]].filter(([x]) => x).map(([x, n]) => `/${x} ${n}w`).join(', '); return `<img src="/${rel}"${set ? ` srcset="${set}" sizes="${sizes}"` : ''} alt="" loading="lazy" decoding="async" width="${w}" height="${h}">`; };
  const rowProject = (p, i) => { const m = projectMedia(D, p); return `<li class="pf-row pf-pj" style="--i:${i % 8}"${i >= 5 ? ' hidden data-more' : ''}><a href="${u(`/work/${p.key}/`)}" data-track="project_open" data-project="${p.key}" data-from="profile" data-name="${esc(p.title)}">
      <span class="pf-th">${m.cover ? cover(m.cover, '96px', 96, 60) : I.folder}</span>
      <span class="pf-body"><b>${esc(p.title)}</b><span class="pf-meta"><span>${esc(tp(p, 'industry'))}</span><i>·</i>${stat(p)}</span></span>
      <span class="pf-pj-st">${esc(stk(p))}</span><span class="pf-go">${I.out}</span></a></li>`; };
  const hostOf = (url) => { try { return new URL(url).host.replace(/^www\./, ''); } catch (x) { return ''; } };
  const feat = (p, i) => { const m = projectMedia(D, p); return `<li class="pf-feat" style="--i:${i}"><a href="${u(`/work/${p.key}/`)}" data-track="project_open" data-project="${p.key}" data-from="profile-featured" data-name="${esc(p.title)}">
      <span class="pf-feat-pic"><span class="pf-feat-bar" aria-hidden="true"><i></i><i></i><i></i>${p.url ? `<span>${esc(hostOf(p.url))}</span>` : ''}</span>${m.cover ? cover(m.cover, '(min-width: 800px) 240px, (min-width: 481px) 46vw, 92vw', 640, 400) : I.folder}</span>
      <span class="pf-feat-body"><b>${esc(p.title)}</b><span class="pf-meta"><span>${esc(tp(p, 'industry'))}</span><i>·</i>${stat(p)}</span>${(tp(p, 'did') || [])[0] ? `<span class="pf-feat-did">${esc((tp(p, 'did') || [])[0])}</span>` : ''}</span>
      <span class="pf-go">${I.out}</span></a></li>`; };
  // the three cards lead with sites that open: a domain that stopped resolving is left out of the cards (it stays in the list below,
  // untouched; whether it still counts as live is Navy's call). Checked 2026-10-16: miniaturkapal.com and airon.site gave NXDOMAIN.
  const UNREACHABLE = new Set(['miniatur-kapal', 'airon']);
  const lead = counted.filter((p) => !UNREACHABLE.has(p.key) && projectMedia(D, p).cover).slice(0, 3), leadKeys = new Set(lead.map((p) => p.key));
  const featured = lead.map(feat).join('');
  const projects = counted.filter((p) => !leadKeys.has(p.key)).map(rowProject).join('');

  const logo = (c) => c.word || !exists(`site/logos/${c.key}.webp`)
    ? `<a class="pf-logo pf-logo--w" href="${u(`/work/${c.key}/`)}" title="${esc(c.name)}"><span>${esc(c.word ? c.word.join(' ') : c.name)}</span></a>`
    : `<a class="pf-logo" href="${u(`/work/${c.key}/`)}" title="${esc(c.name)}" aria-label="${esc(c.name)}"><span class="pf-logo-m" style="--m:url(/site/logos/${c.key}.webp)"><img src="/site/logos/${c.key}.webp" alt="" loading="lazy" decoding="async"></span></a>`;
  const marq = clients.filter((c) => !c.word && exists(`site/logos/${c.key}.webp`));
  const marquee = marq.length > 5 ? `<div class="pf-marq" aria-hidden="true"><div class="pf-marq-t">${[...marq, ...marq].map((c) => `<i class="pf-marq-i" style="--m:url(/site/logos/${c.key}.webp)"></i>`).join('')}</div></div>` : '';
  const cvHref = (D.SITE.links.find((l) => l.label === 'Résumé') || {}).href || '';
  const wa = `https://wa.me/${D.SITE.whatsapp}?text=${encodeURIComponent(W.waText)}`;
  const social = SOCIAL.map(([label, slug]) => {
    const l = D.SITE.links.find((x) => x.label === label); if (!l) return '';
    return `<a class="pf-soc" href="${esc(l.href)}" target="_blank" rel="noopener" title="${esc(label)}" aria-label="${esc(label)}" data-track="contact_click" data-channel="${esc(label)}">${exists(`site/tools/${slug}.svg`) ? mark(slug) : esc(label[0])}</a>`;
  }).join('') + `<a class="pf-soc pf-soc--w" href="${u('/cv/')}" title="CV">${I.doc}<span>CV</span></a>`;
  const sec = (title, n, extra = '', id = '') => `<div class="pf-h"><h2${id ? ` id="${id}"` : ''}><em>${esc(title)}</em><sup>(${n})</sup></h2>${extra}</div>`;
  // the stack: how often each tool shows up in the work (GitHub and the shipped projects), and what was done with it (scripts/stack-tools.js)
  const toolIcon = (t) => { const s = TOOL_MARK[t]; return s && exists(`site/tools/${s}.svg`) ? mark(s) : ''; };
  const stack = stackSection({ M: stackModel({ D, gh }), lang, layers: stackNames, name: (t) => CHIP_T[lang]?.[t] ?? t, icon: toolIcon, u, worlds: worlds.length,
    sec: (n) => sec(W.stack, n, gh?.user ? `<a class="pf-all" href="https://github.com/${esc(gh.user)}" target="_blank" rel="noopener" data-track="contact_click" data-channel="GitHub">GitHub ${I.out}</a>` : '', 'pf-st') });
  const hatch = '<div class="pf-hatch" aria-hidden="true"></div>';
  // what I build: the five kinds of work (i18n CONTENT.territories), each with the projects that prove it (site.js TERRITORIES)
  const services = svc.length ? `
  <section class="pf-sec pf-svc" aria-labelledby="pf-svc">
    ${sec(W.services, svc.length, '', 'pf-svc')}
    <ol class="pf-svc-g" data-stagger>${svc.map((s, i) => `<li class="pf-svc-c${i === svc.length - 1 && svc.length % 2 ? ' is-wide' : ''}" style="--i:${i}">
      <span class="pf-svc-n">${pad(i + 1)}</span>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.body)}</p>
      ${(s.items || []).length ? `<div class="pf-chips">${s.items.map(chip).join('')}</div>` : ''}
      ${(s.proof || []).length || s.also ? `<div class="pf-svc-p">${(s.proof || []).map((x) => `<a href="${u(`/work/${x.key}/`)}" data-track="project_open" data-project="${x.key}" data-from="profile-services">${esc(x.title)} ${I.out}</a>`).join('')}${s.also ? `<a href="${s.also}" data-track="3d_cta_click" data-from="profile-services">${esc(W.tabs.desk)} ${I.out}</a>` : ''}</div>` : ''}
    </li>`).join('')}</ol>
  </section>
  ${hatch}` : '';
  // how it works: the four steps (i18n CONTENT.process), a line through them
  const proc = steps.length ? `
  <section class="pf-sec pf-proc" aria-labelledby="pf-proc">
    ${sec(W.processT, steps.length, '', 'pf-proc')}
    <ol class="pf-proc-l" data-stagger>${steps.map((s, i) => `<li style="--i:${i}"><span class="pf-proc-n">${pad(i + 1)}</span><b>${esc(s.step)}</b><p>${esc(s.body)}</p></li>`).join('')}</ol>
  </section>
  ${hatch}` : '';
  const more = (label) => `<button type="button" class="pf-more" data-more-btn data-less="${esc(W.less)}"><span>${esc(label)}</span>${I.chev}</button>`;
  // the reel: the 3D worlds of the Labs page (scripts/labs-worlds.js) as one stage over a strip of their frames, the last section
  // before the closing banner (Navy: "paling bawah"). The page script walks the stage through the worlds and brings up the frame pointed
  // at; the stage, every frame, the header's link and the button are all doors to /labs (the frame's own card, #w-<key>).
  // Only the first frame is in the markup (the stage fetches the others as it goes); the strip uses the 360 px copies.
  const shots = worlds.filter((w) => exists(`site/labs/${w.key}.webp`));
  const reel = shots.length > 1 ? (() => {
    const n = shots.length, w0 = shots[0], labsAt = (w) => `${u('/labs/')}#w-${w.key}`;
    const small = (w) => exists(`site/labs/${w.key}-800.webp`) ? `/site/labs/${w.key}-800.webp` : '';
    const thumb = (w, i) => { const s = exists(`site/labs/${w.key}-360.webp`) ? `/site/labs/${w.key}-360.webp` : small(w) || `/site/labs/${w.key}.webp`; return `<li><a class="pf-thumb${i ? '' : ' is-on'}" href="${labsAt(w)}" data-i="${i}" data-key="${esc(w.key)}" data-big="/site/labs/${w.key}.webp" data-small="${small(w)}" data-cat="${esc(w.category)}" data-tag="${esc(w.tagline)}" data-name="${esc(w.name)}" data-h="${w.hue}" aria-label="${esc(w.name)}: ${esc(w.tagline)}"${i ? '' : ' aria-current="true"'} data-track="lab_open" data-lab="${esc(w.key)}" data-channel="profile-reel"><img src="${s}" alt="" width="360" height="203" loading="lazy" decoding="async"></a></li>`; };
    return `
  <section class="pf-sec pf-reel" id="pf-reel" aria-label="${esc(W.reel)}" style="--h:${w0.hue}">
    ${sec(W.reel, n, `<a class="pf-all" href="${u('/labs/')}">${esc(W.viewAll)} ${I.out}</a>`)}
    <p class="pf-reel-line">${esc(W.reelLine.replace('{n}', n))}</p>
    <a class="pf-stage" href="${labsAt(w0)}" data-alt="${esc(W.reelAlt)}" data-track="lab_open" data-lab="${esc(w0.key)}" data-channel="profile-stage">
      <span class="pf-stage-pics"><img class="pf-stage-pic is-on" src="/site/labs/${w0.key}.webp"${small(w0) ? ` srcset="${small(w0)} 800w, /site/labs/${w0.key}.webp 1280w" sizes="(min-width: 800px) 720px, 100vw"` : ''} width="1280" height="720" alt="${esc(W.reelAlt.replace('{n}', w0.name))}" loading="lazy" decoding="async"></span>
      <span class="pf-stage-marks" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span class="pf-stage-top"><span class="pf-stage-n">${pad(1)} / ${pad(n)}</span><b class="pf-stage-cat">${esc(w0.category)}</b></span>
      <span class="pf-stage-text"><em class="pf-stage-tag">${esc(w0.tagline)}</em><span class="pf-stage-row"><span class="pf-stage-name">${esc(w0.name)}</span><span class="pf-stage-open">${esc(W.reelOpen)} ${I.out}</span></span></span>
      <span class="pf-stage-go">${esc(W.reelOpen)} ${I.out}</span>
      <i class="pf-stage-bar" aria-hidden="true"></i>
    </a>
    <ul class="pf-strip" aria-label="${esc(W.reel)}">${shots.map(thumb).join('')}</ul>
    <div class="pf-reel-row">
      <a class="btn btn-fill" href="${u('/labs/')}" data-track="lab_open" data-channel="profile-reel-btn" data-magnet>${roll(W.reelAll.replace('{n}', n))} ${I.out}</a>
      <button type="button" class="pf-reel-pause" data-pause="${esc(W.pause)}" data-play="${esc(W.play)}">${I.pause}${I.play}<span>${esc(W.pause)}</span></button>
      <span class="pf-reel-hint"><span class="if-hover">${esc(W.reelHint)}</span><span class="if-touch">${esc(W.reelHintTouch)}</span></span>
    </div>
  </section>
  ${hatch}`;
  })() : '';

  const bio = (W.hl || []).reduce((h, ph) => h.replace(esc(ph), `<mark class="pf-hl">${esc(ph)}</mark>`), esc(W.bio));
  const ringText = `${W.ring} · ${W.ring} · `;
  const rail = [['pf-me', W.rail.me], ...(reel ? [['pf-reel', W.rail.worlds]] : []), ['pf-exp', W.exp], ...(svc.length ? [['pf-svc', W.services]] : []), ['pf-pj', W.projects], ['pf-cl', W.clients], ['pf-st', W.stack], ...(steps.length ? [['pf-proc', W.processT]] : []), ['pf-contact', W.rail.contact]]
    .map(([id, label], i) => `<li><a href="#${id}" data-rail="${id}"><b>${pad(i)}</b><span>${esc(label)}</span></a></li>`).join('');
  return `<main id="main" tabindex="-1">
<div class="pf">
  <aside class="pf-notes" aria-hidden="true"><span class="pf-note pf-note--1">${esc(W.notes[0])}</span><span class="pf-note pf-note--3">${esc(W.notes[2])}</span></aside>
  <section class="pf-card" id="pf-me" aria-label="Navy Gibran">
    <div class="pf-banner">${img('site/desk-wide.webp', W.altBanner, { eager: true, sizes: '(min-width: 800px) 760px, 100vw' })}${exists('site/desk-loop.webm') || exists('site/desk-loop.mp4') ? `<video class="pf-banner-v" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1">${exists('site/desk-loop.webm') ? '<source src="/site/desk-loop.webm" type="video/webm">' : ''}${exists('site/desk-loop.mp4') ? '<source src="/site/desk-loop.mp4" type="video/mp4">' : ''}</video>` : ''}<a class="pf-banner-go" href="/3d/" aria-label="${esc(W.enter3d)}" data-track="3d_cta_click" data-from="profile-banner">${I.cube}<span>${esc(W.enter3d)}</span>${I.right}</a></div>
    <div class="pf-card-in">
      <div class="pf-id">
        <div class="pf-face-w"><figure class="pf-face">${exists('site/portrait-240.webp') ? `<img src="/site/portrait.webp" srcset="/site/portrait-240.webp 240w, ${exists('site/portrait-360.webp') ? '/site/portrait-360.webp 360w, ' : ''}/site/portrait.webp 640w" sizes="(max-width: 480px) 100px, 116px" alt="${esc(W.altPortrait)}" width="640" height="800" fetchpriority="high" decoding="async">` : img('site/portrait.webp', W.altPortrait, { eager: true, sizes: '120px' })}</figure><svg class="pf-ring" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="pf-ring-p" d="M100,100 m-86,0 a86,86 0 1,1 172,0 a86,86 0 1,1 -172,0"/></defs><text><textPath href="#pf-ring-p" textLength="536" lengthAdjust="spacing">${esc(ringText)}</textPath></text></svg></div>
        <div class="pf-hero-cta"><a class="btn btn-fill pf-hero-wa" href="${wa}" target="_blank" rel="noopener" data-track="contact_click" data-channel="WhatsApp" data-from="profile-hero" data-magnet>${roll(W.chat)} ${I.out}</a>${cvHref ? `<a class="btn pf-hero-cv" href="${esc(cvHref)}" download="${esc(cvHref.split('/').pop())}" data-track="cv_download" data-from="profile-hero" data-magnet>${I.doc}${roll(W.cvBtn)}</a>` : ''}</div>
      </div>
      <h1 class="pf-name">Navy Gibran <span class="pf-verified" title="navygibran.dev">${I.link}</span></h1>
      <span class="pf-handle">${esc(W.handle)}</span>
      <p class="pf-bio">${bio}</p>
      <ul class="pf-facts"><li>${I.work}${esc(W.role)}</li><li>${I.pin}${esc(W.where)}<span class="pf-clock" data-clock title="${esc(W.localTime)}"></span></li><li>${nowOrg ? `${I.org}${esc(nowOrg)}` : `${I.link}${esc(W.site)}`}</li><li class="pf-open"><span class="dot dot--open" aria-hidden="true"></span>${esc(W.open)}</li></ul>
      <div class="pf-nums" data-stagger>
        <a class="pf-num" href="${u('/work/client-websites/')}" style="--i:0"><b data-count="${clientSites}">${clientSites}</b><span>${esc(W.stats.live)}</span></a>
        <a class="pf-num" href="${u('/work/')}" style="--i:1"><b data-count="${counted.length}">${counted.length}</b><span>${esc(W.stats.projects)}</span></a>
        ${shots.length ? `<a class="pf-num" href="${u('/labs/')}" style="--i:2"><b data-count="${shots.length}">${shots.length}</b><span>${esc(W.stats.worlds)}</span></a>` : ''}
      </div>
      <div class="pf-socials">${social}</div>
    </div>
  </section>
  <nav class="pf-tabs pf-tabs--pin" aria-label="${esc(W.tabsLabel)}">
    <a href="${u('/')}" aria-current="page">${I.home}<span>${esc(W.tabs.home)}</span></a>
    <a href="${u('/work/')}">${I.folder}<span>${esc(W.tabs.work)}</span></a>
    <a href="${u('/labs/')}">${I.flask}<span>${esc(W.tabs.labs)}</span></a>
    <a href="${u('/cv/')}">${I.doc}<span>${esc(W.tabs.cv)}</span></a>
    <a href="/3d/" data-track="3d_cta_click" data-from="profile-tab">${I.cube}<span>${esc(W.tabs.desk)}</span></a>
    <i class="pf-tabs-ind" aria-hidden="true"></i>
  </nav>
  ${hatch}${reel}
  <section class="pf-sec" aria-labelledby="pf-exp">
    ${sec(W.exp, expRows.length, `<button type="button" class="pf-all pf-xall" data-open="${esc(W.expandAll)}" data-close="${esc(W.collapseAll)}">${esc(W.expandAll)}</button>`, 'pf-exp')}
    <ol class="pf-list pf-tl" data-stagger>${exp}</ol>
    <div class="pf-h pf-h--sub"><h3>${I.cap}${esc(W.edu)}<sup>(${eduRows.length})</sup></h3></div>
    <ol class="pf-list pf-tl" data-stagger>${edu}</ol>
  </section>
  ${hatch}${services}
  <section class="pf-sec pf-sec--pj" aria-labelledby="pf-pj">
    <span class="pf-note pf-note--2" aria-hidden="true">${esc(W.notes[1])}</span>
    ${sec(W.projects, counted.length, `<a class="pf-all" href="${u('/work/')}">${esc(W.viewAll)} ${I.out}</a>`, 'pf-pj')}
    <ol class="pf-feats" data-stagger aria-label="${esc(W.featured)}">${featured}</ol>
    <ol class="pf-list" data-stagger data-fold>${projects}</ol>
    ${more(W.more)}
  </section>
  ${hatch}
  <section class="pf-sec pf-sec--cl pf-sec--cream" aria-labelledby="pf-cl">
    ${sec(W.clients, clientSites, `<a class="pf-all" href="${u('/work/client-websites/')}">${esc(W.viewAll)} ${I.out}</a>`, 'pf-cl')}
    ${marquee}
    <div class="pf-logos" data-stagger>${clients.map(logo).join('')}</div>
    <span class="pf-note pf-note--cl" aria-hidden="true">${esc(W.thanks)}</span>
  </section>
  ${hatch}
  ${stack}
  ${hatch}${proc}
  <section class="pf-cta" id="pf-contact" aria-label="${esc(W.ctaTitle)}" data-reveal>
    ${img('site/desk-wide.webp', '', { sizes: '(min-width: 800px) 760px, 100vw' })}
    <div class="pf-cta-in">
      <span class="pf-cta-status"><span class="dot dot--open" aria-hidden="true"></span>${esc(W.ring)}</span>
      <h2>${esc(W.ctaTitle)}</h2>
      <p>${esc(W.ctaLine)}</p>
      <div class="pf-cta-row">
        <a class="btn btn-fill" href="${wa}" target="_blank" rel="noopener" data-track="contact_click" data-channel="WhatsApp" data-magnet>${exists('site/avatar.webp') ? '<img class="btn-av" src="/site/avatar.webp" alt="" width="40" height="40" decoding="async">' : ''}${roll(W.chat)} ${I.out}</a>
        ${D.SITE.whatsapp ? `<button class="btn pf-cta-mail pf-cta-num" type="button" aria-label="${esc(W.copyNum)} ${esc(phoneOf(D.SITE.whatsapp))}" data-copy="+${esc(D.SITE.whatsapp)}" data-track="contact_click" data-channel="WhatsApp number" data-from="profile-cta" data-magnet>${exists('site/tools/whatsapp.svg') ? mark('whatsapp') : ''}<span>${esc(phoneOf(D.SITE.whatsapp))}</span></button>` : ''}
        ${D.SITE.email ? `<button class="btn pf-cta-mail" type="button" aria-label="${esc(W.copyMail)} ${esc(D.SITE.email)}" data-copy="${esc(D.SITE.email)}" data-track="contact_click" data-channel="Email" data-from="profile-cta" data-magnet>${exists('site/tools/gmail.svg') ? mark('gmail') : ''}<span>${esc(D.SITE.email)}</span></button>` : ''}
        <a class="btn" href="/3d/" data-track="3d_cta_click" data-from="profile-cta" data-magnet>${roll(W.see3d)} ${I.right}</a>
      </div>
    </div>
  </section>
  <nav class="pf-rail" aria-label="${esc(W.railLabel)}"><ol>${rail}</ol></nav>
  <a class="pf-fab" href="${wa}" target="_blank" rel="noopener" data-track="contact_click" data-channel="WhatsApp" data-from="profile-fab" aria-label="${esc(W.chat)}" tabindex="-1">${exists('site/tools/whatsapp.svg') ? mark('whatsapp') : ''}<span>${esc(W.fab)}</span></a>
</div>
</main>`;
}

export const HOME_PROFILE_CSS = `
/* ---------- the profile home (scripts/home-profile.js): one narrow column, lists not prose */
body.home-profile { background-image: radial-gradient(rgba(241, 234, 219, 0.06) 1px, transparent 1px); background-size: 22px 22px; }
/* the field behind the column, drawn by the page script (scripts/dither.js): a dithered wave in the page's tones that drifts on its
   own, erased around the pointer for a moment, ringed by a click; the CSS dots above are the fallback without WebGL2 */
body.home-profile.has-field { background-image: none; }
.pf-field { position: fixed; inset: 0; z-index: -1; pointer-events: none; opacity: 0; transition: opacity 1.2s; }
.pf-field.on { opacity: 1; }
canvas.pf-field { display: block; width: 100%; height: 100%; }
.pf { position: relative; width: min(100%, 780px); margin: 0 auto; padding: calc(var(--head-h) + 8px) 0 clamp(60px, 7vw, 100px); }
.pf-card, .pf-sec, .pf-cta, .pf-hatch { border-left: 1px solid var(--line); border-right: 1px solid var(--line); background: var(--bg); }
.pf-card { overflow: hidden; border-top: 1px solid var(--line); border-radius: 14px 14px 0 0; }
.pf-banner { position: relative; height: clamp(150px, 26vw, 230px); overflow: hidden; }
.pf-banner img { width: 100%; height: 100%; object-fit: cover; object-position: 60% 45%; filter: brightness(0.7) saturate(0.85); transform: translate3d(calc(var(--mx, 0) * -10px), calc(var(--my, 0) * -8px), 0) scale(1.08); transition: transform 0.6s var(--ease); }
.pf-banner-v { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 60% 45%; filter: brightness(0.7) saturate(0.85); opacity: 0; transition: opacity 1.2s; pointer-events: none; }
.pf-banner-v.on { opacity: 1; }
.pf-banner::after { content: ""; position: absolute; inset: 0; background: linear-gradient(0deg, var(--bg) 0%, transparent 45%); }
.pf-card-in { padding: 0 clamp(18px, 3vw, 30px) clamp(18px, 3vw, 26px); }
.pf-id { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-top: -58px; }
/* (positioned, so the whole figure, its ring included, paints above the banner it overlaps; the banner is positioned too, and
   an unpositioned figure's ring was painted beneath it, leaving half a ring. The ring is opaque for the same bright half.) */
.pf-face { position: relative; z-index: 1; width: 116px; height: 116px; border-radius: 50%; overflow: hidden; border: 4px solid var(--bg); box-shadow: 0 0 0 1.5px #8f8574, 0 20px 40px -20px rgba(0, 0, 0, 0.8); background: var(--bg-2); transition: transform 0.6s var(--ease), box-shadow 0.4s; }
.pf-face:hover { box-shadow: 0 0 0 1.5px var(--accent-2), 0 20px 40px -20px rgba(0, 0, 0, 0.8); }
.pf-face:hover { transform: translateY(-3px) rotate(-2deg); }
.pf-face img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 28%; filter: saturate(0.85) contrast(1.05); }
.pf-stat { display: inline-flex; align-items: baseline; gap: 6px; margin-bottom: 10px; padding: 8px 12px; border: 1px solid var(--line-2); border-radius: 999px; font: 600 12px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--dim); transition: border-color 0.3s, color 0.3s; }
.pf-stat b { font: 400 20px/1 var(--serif); letter-spacing: 0; color: var(--ink); }
.pf-stat:hover { border-color: var(--ink); color: var(--ink); }
.pf-hero-wa { height: 46px; padding: 0 20px; margin-bottom: 10px; font-size: 13px; }
.pf-hero-cta { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-bottom: 10px; } .pf-hero-cta .pf-hero-wa { margin: 0; }
.pf-hero-cv { height: 46px; padding: 0 18px; gap: 8px; font-size: 13px; } .pf-hero-cv svg { width: 16px; height: 16px; }
.pf-clock { margin-left: 8px; padding-left: 9px; border-left: 1px solid var(--line-2); color: var(--faint); font-variant-numeric: tabular-nums; } .pf-clock:empty { display: none; }
/* three numbers under the facts: the proof at a glance, counted up as they arrive */
.pf-nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px; }
.pf-num { display: grid; gap: 2px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px; color: var(--dim); background: rgba(241, 234, 219, 0.025); transition: border-color 0.3s, color 0.3s, transform 0.5s var(--ease), background 0.3s; }
.pf-num b { font: 400 clamp(30px, 3.6vw, 40px)/1 var(--serif); color: var(--ink); font-variant-numeric: tabular-nums; }
.pf-num span { font: 600 11px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; }
.pf-num:hover { border-color: var(--line-2); color: var(--ink); transform: translateY(-3px); background: rgba(241, 234, 219, 0.05); }
/* the portrait's ring: "open to freelance & full-time" turning slowly round it (the LinkedIn "open to work" frame, in our type) */
.pf-face-w { position: relative; z-index: 1; flex: none; }
.pf-ring { position: absolute; inset: -16px; width: calc(100% + 32px); height: calc(100% + 32px); pointer-events: none; overflow: visible; animation: pf-spin 40s linear infinite; }
.pf-ring text { font: 700 12.5px var(--cond); letter-spacing: 0.2em; text-transform: uppercase; fill: var(--accent-2); }
@keyframes pf-spin { to { transform: rotate(360deg); } }
/* the banner is a door into the 3D desk */
.pf-banner-go { position: absolute; right: 14px; top: 14px; z-index: 2; display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px; border: 1px solid rgba(241, 234, 219, 0.4); border-radius: 999px; background: rgba(9, 8, 10, 0.5); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); font: 600 11px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink); transition: background 0.3s, border-color 0.3s, color 0.3s, transform 0.5s var(--ease); }
.pf-banner-go svg { width: 15px; height: 15px; } .pf-banner-go .ar { width: 0.85em; height: 0.85em; transition: transform 0.4s var(--ease); }
.pf-banner-go:hover, .pf-banner-go:focus-visible { background: var(--ink); border-color: var(--ink); color: #140f09; } .pf-banner-go:hover .ar { transform: translateX(3px); }
/* the bio's two key phrases, marked with a stroke that draws in */
.pf-hl { color: var(--ink); background: linear-gradient(transparent 62%, rgba(217, 160, 91, 0.32) 62%) no-repeat 0 0 / 100% 100%; }
.pf-hx .pf-hl { background-size: 0% 100%; transition: background-size 1.1s var(--ease) 0.5s; } .pf-hx .pf-bio.in .pf-hl { background-size: 100% 100%; }
.pf-name { display: flex; align-items: center; gap: 10px; margin-top: 24px; font: 700 clamp(28px, 3.4vw, 40px)/1 var(--cond); text-transform: uppercase; letter-spacing: -0.01em; }
.pf-verified { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: #140f09; } .pf-verified svg { width: 13px; height: 13px; }
.pf-handle { display: block; margin-top: 6px; font: 600 13px var(--cond); letter-spacing: 0.14em; color: var(--faint); }
.pf-bio { max-width: 40em; margin: 16px 0 0; font-size: 17px; line-height: 1.6; color: var(--dim); text-wrap: pretty; }
.pf-facts { display: flex; flex-wrap: wrap; gap: 8px 20px; margin: 18px 0 0; font: 600 12px var(--cond); letter-spacing: 0.14em; text-transform: uppercase; color: var(--dim); }
.pf-facts li { display: inline-flex; align-items: center; gap: 7px; } .pf-facts svg { width: 15px; height: 15px; color: var(--accent); }
.pf-open { color: var(--ink); }
.pf-socials { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--line); }
.pf-soc { display: inline-grid; place-items: center; width: 42px; height: 42px; border: 1px solid var(--line-2); border-radius: 10px; color: var(--dim); transition: border-color 0.3s, color 0.3s, transform 0.5s var(--ease), background 0.3s; }
.pf-soc:hover, .pf-soc:focus-visible { border-color: var(--ink); color: var(--ink); transform: translateY(-3px); background: rgba(241, 234, 219, 0.05); }
.pf-soc--w { width: auto; grid-auto-flow: column; gap: 8px; padding: 0 12px; font: 600 12px var(--cond); letter-spacing: 0.16em; } .pf-soc--w svg { width: 16px; height: 16px; }
.pf-m { display: inline-block; width: 18px; height: 18px; background: currentColor; -webkit-mask: var(--m) center / contain no-repeat; mask: var(--m) center / contain no-repeat; }
.pf-tabs { position: sticky; top: 0; z-index: 3; display: flex; border-top: 1px solid var(--line); background: rgba(14, 12, 9, 0.9); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); overflow-x: auto; scrollbar-width: none; }
.pf-tabs::-webkit-scrollbar { display: none; }
/* pinned for the whole column: under the site header while it shows, sliding up to the top when it hides on the way down */
.pf-tabs--pin { top: calc(var(--head-h) - 10px); z-index: 20; border-left: 1px solid var(--line); border-right: 1px solid var(--line); box-shadow: 0 1px 0 var(--line); transition: top 0.7s var(--ease); }
body:has(.head.away) .pf-tabs--pin { top: 0; }
.pf-tabs a { position: relative; flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: max-content; height: 50px; padding: 0 16px; font: 600 12px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--dim); transition: color 0.3s; }
.pf-tabs a svg { width: 16px; height: 16px; }
/* one indicator that slides to the tab pointed at, back to the page's own on leaving (the script measures; without it, each tab's own line) */
.pf-tabs-ind { position: absolute; left: 0; bottom: 0; width: 0; height: 2px; background: var(--accent); pointer-events: none; transition: transform 0.55s var(--ease), width 0.55s var(--ease); }
.pf-tabs.has-ind a::after { display: none; }
.pf-tabs a::after { content: ""; position: absolute; left: 14px; right: 14px; bottom: 0; height: 2px; background: var(--accent); transform: scaleX(0); transform-origin: left; transition: transform 0.5s var(--ease); }
.pf-tabs a:hover, .pf-tabs a[aria-current] { color: var(--ink); } .pf-tabs a[aria-current]::after, .pf-tabs a:hover::after { transform: none; }
.pf-hatch { height: 14px; background-color: var(--bg); background-image: repeating-linear-gradient(135deg, var(--line) 0 1px, transparent 1px 9px); background-size: 200% 100%; animation: pf-hatch 60s linear infinite; }
@keyframes pf-hatch { to { background-position: -400px 0; } }
.pf-sec { padding: clamp(18px, 2.6vw, 26px) clamp(18px, 3vw, 30px) clamp(22px, 3vw, 30px); }
.pf-h { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.pf-h h2 { font: 400 clamp(26px, 2.6vw, 32px)/1 var(--serif); } .pf-h h2 em { color: var(--accent-2); }
.pf-h sup { margin-left: 6px; font: 600 11px var(--cond); letter-spacing: 0.12em; color: var(--faint); vertical-align: 0.9em; }
.pf-h--sub { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--line); }
.pf-h h3 { display: inline-flex; align-items: center; gap: 8px; font: 600 12px var(--cond); letter-spacing: 0.18em; text-transform: uppercase; color: var(--dim); } .pf-h h3 svg { width: 16px; height: 16px; color: var(--accent); }
.pf-all { display: inline-flex; align-items: center; gap: 6px; font: 600 12px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--dim); transition: color 0.3s; } .pf-all:hover { color: var(--accent-2); }
.pf-list { display: grid; }
.pf-row { display: grid; grid-template-columns: 44px 1fr; column-gap: 14px; padding: 16px 0; border-top: 1px solid var(--line); transition: background 0.3s; }
.pf-row:first-child { border-top: 0; }
.pf-av { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: var(--bg-2); box-shadow: 0 0 0 1px var(--line); font: 700 12px var(--cond); letter-spacing: 0.08em; color: var(--dim); }
.pf-av--m { background: var(--ink); -webkit-mask: var(--m) center / var(--ms, 64%) no-repeat; mask: var(--m) center / var(--ms, 64%) no-repeat; box-shadow: none; border-radius: 0; opacity: 0.88; transition: opacity 0.3s, transform 0.5s var(--ease); }
.pf-row:hover .pf-av--m { opacity: 1; transform: scale(1.06); }
.pf-body { display: grid; gap: 6px; min-width: 0; }
.pf-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.pf-top b { font: 700 clamp(17px, 1.6vw, 20px)/1.2 var(--cond); text-transform: uppercase; letter-spacing: 0.01em; }
.pf-role { font-size: 17px; color: var(--ink); }
.pf-meta { display: flex; flex-wrap: wrap; gap: 4px 8px; font: 600 11.5px var(--cond); letter-spacing: 0.12em; text-transform: uppercase; color: var(--faint); }
.pf-meta i { font-style: normal; opacity: 0.6; }
.pf-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.pf-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border: 1px solid var(--line); border-radius: 6px; font: 500 12px var(--cond); letter-spacing: 0.08em; color: var(--dim); transition: border-color 0.3s, color 0.3s, transform 0.4s var(--ease); }
.pf-chip .pf-m { width: 13px; height: 13px; opacity: 0.85; }
.pf-chip:hover { border-color: var(--line-2); color: var(--ink); transform: translateY(-2px); }
.pf-chip--a { border-color: color-mix(in srgb, var(--accent) 45%, transparent); color: var(--ink); } .pf-chip--a::after { content: "↗"; margin-left: 2px; font-size: 0.85em; opacity: 0.7; } .pf-chip--a:hover, .pf-chip--a:focus-visible { border-color: var(--accent); color: var(--accent-2); }
.pf-pj.rise { animation: pf-rise 0.6s var(--ease) both; animation-delay: calc(var(--k, 0) * 45ms); }
.pf-hx .pf-tl::before { transform: scaleY(0); transform-origin: top; transition: transform 1.6s var(--ease); } .pf-hx .pf-tl.in::before { transform: none; }
.pf-hx .pf-proc-l::before { transform: scaleX(0); transform-origin: left; transition: transform 1.4s var(--ease) 0.2s; } .pf-hx .pf-proc-l.in::before { transform: none; }
.pf-tg { display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid var(--line); border-radius: 8px; background: none; color: var(--dim); cursor: pointer; transition: border-color 0.3s, color 0.3s, transform 0.4s var(--ease); }
.pf-tg svg { width: 14px; height: 14px; } .pf-tg:hover { border-color: var(--ink); color: var(--ink); }
.pf-tg[aria-expanded="true"] { transform: rotate(180deg); }
.pf-fold { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.5s var(--ease); }
.pf-fold > p { overflow: hidden; margin: 0; font-size: 16px; line-height: 1.55; color: var(--dim); text-wrap: pretty; }
.pf-exp.open .pf-fold { grid-template-rows: 1fr; } .pf-exp.open .pf-fold > p { padding-top: 6px; }
/* the experience as a timeline: a line down the avatar column, each stop a ring on it */
.pf-tl { position: relative; }
.pf-tl::before { content: ""; position: absolute; left: 21px; top: 24px; bottom: 24px; width: 1px; background: linear-gradient(var(--line-2), var(--line) 70%, transparent); }
.pf-tl .pf-row { position: relative; }
.pf-tl .pf-av { position: relative; z-index: 1; background: var(--bg); box-shadow: 0 0 0 1px var(--line-2); }
.pf-tl .pf-av--m { background: var(--ink); box-shadow: none; outline: 6px solid var(--bg); }
/* the first three projects as picture cards; the rest keep the list, with a bigger thumbnail */
.pf-feats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px; }
.pf-feat a { display: grid; gap: 0; height: 100%; overflow: hidden; border: 1px solid var(--line); border-radius: 12px; background: var(--bg-2); transition: border-color 0.3s, transform 0.6s var(--ease), box-shadow 0.4s; }
.pf-feat a:hover { border-color: var(--line-2); --ty: -4px; box-shadow: 0 24px 40px -28px rgba(0, 0, 0, 0.9); }
.pf-feat-pic { display: grid; place-items: center; aspect-ratio: 16 / 10; overflow: hidden; color: var(--dim); background: var(--bg-3); }
.pf-feat-pic img { width: 100%; height: 100%; object-fit: cover; object-position: top; filter: saturate(0.9); transform: scale(1.001); transition: transform 1.4s var(--ease); } .pf-feat-pic svg { width: 24px; height: 24px; }
.pf-feat a:hover .pf-feat-pic img { transform: scale(1.06); }
.pf-feat-pic { position: relative; padding-top: 22px; place-items: stretch; }
.pf-feat-pic > svg { margin: auto; }
.pf-feat-bar { position: absolute; left: 0; right: 0; top: 0; z-index: 1; display: flex; align-items: center; gap: 5px; height: 22px; padding: 0 10px; background: rgba(14, 12, 9, 0.92); border-bottom: 1px solid var(--line); }
.pf-feat-bar i { width: 6px; height: 6px; border-radius: 50%; background: rgba(241, 234, 219, 0.22); }
.pf-feat-bar span { margin-left: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 600 9.5px var(--cond); letter-spacing: 0.1em; color: var(--faint); }
/* what I build: the kinds of work as cards, the last one across when they are odd; each ends with the projects that prove it */
.pf-svc-g { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pf-svc-c { display: grid; align-content: start; gap: 10px; padding: 20px 20px 18px; border: 1px solid var(--line); border-radius: 12px; background: rgba(241, 234, 219, 0.02); transition: border-color 0.3s, background 0.3s, transform 0.5s var(--ease); }
.pf-svc-c:hover { border-color: var(--line-2); background: rgba(241, 234, 219, 0.04); transform: translateY(-3px); }
.pf-svc-c.is-wide { grid-column: 1 / -1; }
.pf-svc-n { font: 700 11px var(--cond); letter-spacing: 0.18em; color: var(--accent); }
.pf-svc-c h3 { font: 700 19px/1.15 var(--cond); text-transform: uppercase; letter-spacing: 0.01em; }
.pf-svc-c > p { font-size: 15px; line-height: 1.55; color: var(--dim); text-wrap: pretty; }
.pf-svc-c .pf-chips { margin-top: 0; }
.pf-svc-p { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 2px; padding-top: 10px; border-top: 1px solid var(--line); }
.pf-svc-p a { display: inline-flex; align-items: center; gap: 5px; font: 600 11.5px var(--cond); letter-spacing: 0.14em; text-transform: uppercase; color: var(--dim); transition: color 0.3s; }
.pf-svc-p a:hover, .pf-svc-p a:focus-visible { color: var(--accent-2); } .pf-svc-p .ar { width: 0.8em; height: 0.8em; }
/* how it works: four steps on one line */
.pf-proc-l { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.pf-proc-l::before { content: ""; position: absolute; left: 14px; right: 14px; top: 14px; height: 1px; background: linear-gradient(90deg, var(--accent), var(--line-2) 45%, var(--line)); }
.pf-proc-l li { position: relative; display: grid; align-content: start; gap: 6px; }
.pf-proc-n { display: grid; place-items: center; width: 28px; height: 28px; margin-bottom: 6px; border-radius: 50%; background: var(--bg); box-shadow: 0 0 0 1px var(--line-2); font: 700 10.5px var(--cond); letter-spacing: 0.06em; color: var(--accent-2); }
.pf-proc-l li:first-child .pf-proc-n { background: var(--accent); box-shadow: none; color: #140f09; }
.pf-proc-l b { font: 700 16px/1.2 var(--cond); text-transform: uppercase; letter-spacing: 0.02em; }
.pf-proc-l p { font-size: 14.5px; line-height: 1.5; color: var(--dim); text-wrap: pretty; }
.pf-feat-body { display: grid; align-content: start; gap: 4px; padding: 12px 14px 14px; }
.pf-feat-did { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 4px; padding-top: 8px; border-top: 1px solid var(--line); font-size: 13.5px; line-height: 1.45; color: var(--faint); }
/* the cards lean toward the pointer (the script sets --rx/--ry on a fine pointer), and a soft light follows it across them */
.pf-feat > a { transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(var(--ty, 0px)); }
.pf-feat > a.is-tilt { transition: border-color 0.3s, transform 0.18s linear, box-shadow 0.4s; }
.pf-num, .pf-feat > a, .pf-logo { position: relative; }
.pf-num::before, .pf-feat > a::before, .pf-logo::before { content: ""; position: absolute; inset: 0; z-index: 2; border-radius: inherit; pointer-events: none; background: radial-gradient(240px circle at var(--gx, 50%) var(--gy, 50%), rgba(217, 160, 91, 0.15), transparent 65%); opacity: 0; transition: opacity 0.35s; }
.pf-num:hover::before, .pf-feat > a:hover::before, .pf-logo:hover::before { opacity: 1; }
/* keyboard focus gets the hover's lift, and a press answers on touch */
.pf-num:focus-visible { transform: translateY(-3px); border-color: var(--line-2); } .pf-feat > a:focus-visible { --ty: -4px; border-color: var(--line-2); } .pf-logo:focus-visible { transform: translateY(-3px); }
.pf-num:active, .pf-feat > a:active, .pf-logo:active, .pf-soc:active, .pf-pj a:active, .pf-svc-c:active, .pf-thumb:active { scale: 0.98; }
.pf-sec--cream .pf-logo::before { background: radial-gradient(150px circle at var(--gx, 50%) var(--gy, 50%), rgba(23, 18, 12, 0.08), transparent 65%); }
.pf-feat .pf-go { z-index: 3; }
/* the list's floating preview: the project's picture riding beside the pointer (wide screens with a mouse) */
.pf-peek { position: fixed; left: 0; top: 0; z-index: 30; width: 300px; aspect-ratio: 16 / 10; overflow: hidden; border-radius: 10px; background: var(--bg-2); box-shadow: 0 0 0 1px var(--line-2), 0 30px 60px -20px rgba(0, 0, 0, 0.85); pointer-events: none; opacity: 0; scale: 0.86; rotate: -2deg; transition: opacity 0.3s, scale 0.45s var(--ease), rotate 0.6s var(--ease); }
.pf-peek.on { opacity: 1; scale: 1; rotate: 0deg; }
.pf-peek img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
/* the current job: two slow rings behind its mark */
.pf-pulse { position: absolute; left: 0; top: 16px; width: 44px; height: 44px; pointer-events: none; }
.pf-pulse::before, .pf-pulse::after { content: ""; position: absolute; inset: 0; border: 1px solid #7fd49c; border-radius: 50%; opacity: 0; animation: pf-ping 3s var(--ease) infinite; }
.pf-pulse::after { animation-delay: 1.5s; }
@keyframes pf-ping { 0% { transform: scale(0.9); opacity: 0.75; } 100% { transform: scale(1.6); opacity: 0; } }
/* the floating WhatsApp button: in once the hero's button has gone by, out again when the closing banner arrives */
.pf-fab { position: fixed; right: 20px; bottom: calc(20px + env(safe-area-inset-bottom, 0px)); z-index: 40; display: inline-flex; align-items: center; gap: 9px; height: 52px; padding: 0 22px 0 18px; border-radius: 999px; background: var(--ink); color: #140f09; font: 700 13px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; box-shadow: 0 18px 40px -14px rgba(0, 0, 0, 0.75); opacity: 0; transform: translateY(18px) scale(0.92); pointer-events: none; transition: opacity 0.4s, transform 0.6s var(--ease), background 0.3s; }
.pf-fab .pf-m { width: 20px; height: 20px; color: #1f9e4f; }
.pf-fab.on { opacity: 1; transform: none; pointer-events: auto; }
.pf-fab:hover, .pf-fab:focus-visible { background: var(--accent-2); }
.pf-feat b { font: 700 15.5px/1.2 var(--cond); text-transform: uppercase; letter-spacing: 0.01em; }
.pf-feat .pf-meta { text-transform: none; letter-spacing: 0.02em; font: 400 13.5px var(--text); color: var(--dim); }
.pf-feat .pf-go { position: absolute; } .pf-feat { position: relative; } .pf-feat .pf-go { right: 12px; top: 12px; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; background: rgba(9, 8, 10, 0.6); color: var(--ink); opacity: 0; transform: translateY(4px); }
.pf-feat a:hover .pf-go { opacity: 1; transform: none; }
.pf-pj { display: block; padding: 0; }
.pf-pj-st { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 5px 9px; border: 1px solid var(--line); border-radius: 6px; font: 600 10.5px var(--cond); letter-spacing: 0.12em; text-transform: uppercase; color: var(--faint); transition: border-color 0.3s, color 0.3s; }
.pf-pj-st:empty { visibility: hidden; padding: 0; border: 0; }
.pf-pj a:hover .pf-pj-st { border-color: var(--line-2); color: var(--dim); }
.pf-live { display: inline-flex; align-items: center; gap: 6px; color: #9fdcb3; }
.pf-live i { width: 6px; height: 6px; border-radius: 50%; background: #7fd49c; box-shadow: 0 0 0 3px rgba(127, 212, 156, 0.16); }
/* the experience opens with a click anywhere on the row, or all at once from the header */
.pf-exp { cursor: pointer; } .pf-exp:hover .pf-top b { color: var(--accent-2); } .pf-top b { transition: color 0.3s; }
.pf-xall { padding: 0; border: 0; background: none; cursor: pointer; }
/* the headings rise as their section arrives (the script marks them; without it they simply stand) */
.pf-hx .pf-h h2 em, .pf-hx .pf-h h2 sup { display: inline-block; transition: transform 0.9s var(--ease), opacity 0.9s var(--ease); }
.pf-hx .pf-h h2 sup { transition-delay: 0.25s; }
.pf-hx .pf-h:not(.in) h2 em { transform: translateY(0.45em); opacity: 0; } .pf-hx .pf-h:not(.in) h2 sup { opacity: 0; }
/* the targets of the rail land under the pinned tabs */
#pf-me, #pf-reel, #pf-exp, #pf-svc, #pf-pj, #pf-cl, #pf-st, #pf-proc, #pf-contact { scroll-margin-top: calc(var(--head-h) + 70px); }
/* the chapter rail: the sections as numbers in the left margin, the one in view lit, its name on hover (a wide screen with a mouse) */
.pf-rail { display: none; }
@media (min-width: 1360px) and (hover: hover) {
  .pf-rail { display: block; position: fixed; left: 26px; top: 50%; z-index: 25; translate: 0 -50%; }
  .pf-rail ol { display: grid; gap: 2px; }
  .pf-rail a { display: flex; align-items: center; gap: 10px; height: 26px; font: 600 11px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--dim); text-shadow: 0 0 6px var(--bg), 0 0 14px var(--bg); transition: color 0.3s; }
  .pf-rail b { width: 18px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .pf-rail a::after { content: ""; order: 1; width: 12px; height: 1px; background: currentColor; opacity: 0.5; transition: width 0.5s var(--ease), background 0.3s, opacity 0.3s; }
  .pf-rail span { order: 2; max-width: 0; overflow: hidden; white-space: nowrap; opacity: 0; transition: max-width 0.5s var(--ease), opacity 0.3s; }
  .pf-rail a:hover, .pf-rail a:focus-visible { color: var(--ink); } .pf-rail a:hover span, .pf-rail a:focus-visible span { max-width: 160px; opacity: 1; }
  .pf-rail a.on { color: var(--ink); } .pf-rail a.on::after { width: 30px; background: var(--accent); opacity: 1; }
} .pf-pj[hidden] { display: none; }
.pf-pj a { display: grid; grid-template-columns: 96px 1fr auto 24px; align-items: center; column-gap: 14px; padding: 12px 0; transition: padding 0.4s var(--ease), color 0.3s; }
.pf-pj a:hover { color: var(--accent-2); padding-left: 8px; }
.pf-th { display: grid; place-items: center; width: 96px; height: 60px; overflow: hidden; border-radius: 6px; background: var(--bg-2); box-shadow: 0 0 0 1px var(--line); color: var(--dim); }
.pf-th img { width: 100%; height: 100%; object-fit: cover; object-position: top; filter: grayscale(0.15) brightness(0.95); } .pf-th svg { width: 20px; height: 20px; }
.pf-pj b { font: 700 clamp(17px, 1.6vw, 20px)/1.2 var(--cond); text-transform: uppercase; }
.pf-pj .pf-meta { text-transform: none; letter-spacing: 0.02em; font: 400 14.5px var(--text); color: var(--dim); }
.pf-go { color: var(--faint); transition: color 0.3s, transform 0.4s var(--ease); } .pf-go .ar { width: 14px; height: 14px; } .pf-pj a:hover .pf-go { color: var(--accent-2); transform: translate(2px, -2px); }
.pf-more { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 8px; padding: 12px; border: 1px solid var(--line); border-radius: 10px; background: none; color: var(--dim); font: 600 12px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; cursor: pointer; transition: border-color 0.3s, color 0.3s; }
.pf-more svg { width: 14px; height: 14px; transition: transform 0.4s var(--ease); } .pf-more:hover { border-color: var(--ink); color: var(--ink); } .pf-more.open svg { transform: rotate(180deg); }
/* the clients on cream: one light room in the dark column */
.pf-sec--cream { background: var(--cream); color: var(--cream-ink); border-color: var(--cream-line); }
.pf-sec--cream .pf-h h2 em { color: var(--cream-ink); } .pf-sec--cream .pf-h sup, .pf-sec--cream .pf-all { color: var(--cream-dim); } .pf-sec--cream .pf-all:hover { color: var(--cream-ink); }
.pf-sec--cream .pf-logo { border-color: var(--cream-line); color: var(--cream-dim); }
/* a mark names itself on hover: it lifts, its client's name slides in under it */
.pf-logo:not(.pf-logo--w)::after { content: attr(title); position: absolute; left: 6px; right: 6px; bottom: 7px; font: 700 9px/1 var(--cond); letter-spacing: 0.12em; text-transform: uppercase; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--cream-ink); opacity: 0; transform: translateY(4px); transition: opacity 0.3s, transform 0.45s var(--ease); }
.pf-logo .pf-logo-m { transition: transform 0.5s var(--ease); }
.pf-logo:not(.pf-logo--w):hover::after, .pf-logo:not(.pf-logo--w):focus-visible::after { opacity: 0.7; transform: none; }
@media (hover: none) { .pf-logo:not(.pf-logo--w)::after { opacity: 0.7; transform: none; } .pf-logo:not(.pf-logo--w) .pf-logo-m { transform: translateY(-7px) scale(0.9); } }   /* (a touch screen never hovers: the names stay) */
.pf-logo:not(.pf-logo--w):hover .pf-logo-m, .pf-logo:not(.pf-logo--w):focus-visible .pf-logo-m { transform: translateY(-7px) scale(0.9); }
.pf-sec--cream .pf-logo:hover { border-color: var(--cream-ink); color: var(--cream-ink); background: rgba(23, 18, 12, 0.04); }   /* (on the cream a mark darkens; it must not take the dark page's light hover) */
.pf-sec--cream .pf-note--cl { color: var(--accent-2); }
/* the marks sliding by, slowly, across the cream (paused under the pointer, still for reduced motion) */
.pf-marq { --pad: clamp(18px, 3vw, 30px); margin: 0 calc(-1 * var(--pad)) 18px; padding: 14px 0; overflow: hidden; border-top: 1px solid var(--cream-line); border-bottom: 1px solid var(--cream-line); -webkit-mask: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent); mask: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent); }
.pf-marq-t { display: flex; width: max-content; animation: pf-marq 60s linear infinite; }
.pf-marq:hover .pf-marq-t { animation-play-state: paused; }
.pf-marq-i { flex: none; width: 112px; height: 32px; margin-right: 44px; background: var(--cream-ink); opacity: 0.72; -webkit-mask: var(--m) center / contain no-repeat; mask: var(--m) center / contain no-repeat; }
@keyframes pf-marq { to { transform: translate3d(-50%, 0, 0); } }
.pf-logos { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
.pf-logo { display: grid; place-items: center; height: 68px; padding: 0 12px; border: 1px solid var(--line); border-radius: 10px; color: var(--dim); transition: border-color 0.3s, color 0.3s, transform 0.5s var(--ease); }
/* the logo in one colour: the mask is the client's own silhouette, the hidden <img> only gives it its width */
.pf-logo-m { display: block; max-width: 100%; height: 30px; background: currentColor; -webkit-mask: var(--m) center / contain no-repeat; mask: var(--m) center / contain no-repeat; }
.pf-logo-m img { display: block; height: 30px; width: auto; max-width: 100%; visibility: hidden; }
.pf-logo:hover { border-color: var(--line-2); color: var(--ink); transform: translateY(-3px); }
.pf-logo--w span { padding: 0 8px; font: 700 12px/1.1 var(--cond); letter-spacing: 0.06em; text-transform: uppercase; text-align: center; }
.pf-stack { display: grid; }
.pf-st { display: grid; grid-template-columns: 150px 1fr; column-gap: 16px; padding: 12px 0; border-top: 1px solid var(--line); }
.pf-st:first-child { border-top: 0; }
.pf-st-n { display: flex; gap: 8px; padding-top: 6px; font: 600 12px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--dim); } .pf-st-n b { color: var(--accent); }
.pf-st .pf-chips { margin-top: 0; }
` + STACK_CSS + `
.pf-cta { position: relative; overflow: hidden; border-bottom: 1px solid var(--line); border-radius: 0 0 14px 14px; min-height: 300px; display: grid; align-items: end; }
.pf-cta > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 40%; filter: brightness(0.5) saturate(0.9); transition: transform 2s var(--ease); }
.pf-cta:hover > img { transform: scale(1.04); }
.pf-cta-in { position: relative; display: grid; gap: 12px; padding: clamp(28px, 4vw, 40px) clamp(18px, 3vw, 30px); background: linear-gradient(0deg, rgba(14, 12, 9, 0.92), rgba(14, 12, 9, 0.2)); }
.pf-cta h2 { font: 400 clamp(30px, 3.4vw, 44px)/1.05 var(--serif); }
.pf-cta p { max-width: 30em; font-size: 17px; color: var(--dim); text-wrap: pretty; }
.pf-cta-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
.pf-cta-status { display: inline-flex; align-items: center; gap: 10px; font: 600 12px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink); }
.pf-cta-mail { gap: 10px; border-color: rgba(241, 234, 219, 0.45); background: rgba(9, 8, 10, 0.45); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); color: var(--ink); text-transform: none; letter-spacing: 0.04em; font-size: 14px; cursor: pointer; }
.pf-cta-mail:hover, .pf-cta-mail:focus-visible { background: var(--ink); border-color: var(--ink); color: #140f09; }
body.home-profile .foot { position: relative; background: var(--bg); } .pf-cta-mail .pf-m { width: 17px; height: 17px; }
/* ---------- the reel: the Labs worlds as one 16:9 stage (the frame fading to the next, a slow push in, the words rising, a thin
   clock along the bottom) over a strip of their frames that scrolls sideways; the colour of the words is the world's own hue */
.pf-reel { --acc: hsl(var(--h, 40) 70% 72%); }
.pf-reel-line { max-width: 40em; margin: -2px 0 16px; font-size: 16.5px; line-height: 1.55; color: var(--dim); text-wrap: pretty; }
.pf-stage { position: relative; display: block; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 12px; background: var(--bg-2); box-shadow: 0 0 0 1px var(--line); color: var(--ink); isolation: isolate; touch-action: pan-y; transition: box-shadow 0.4s; }
.pf-stage:hover, .pf-stage:focus-visible { box-shadow: 0 0 0 1px var(--line-2), 0 30px 60px -30px rgba(0, 0, 0, 0.8); }
.pf-stage-pics { position: absolute; inset: 0; transform: translate3d(calc(var(--mx, 0) * -10px), calc(var(--my, 0) * -8px), 0) scale(1.04); transition: transform 0.9s var(--ease); }
.pf-stage-pic { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transform: scale(1); transition: opacity 0.9s var(--ease), transform 0s 0.9s; }
.pf-stage-pic.is-on { opacity: 1; transform: scale(1.07); transition: opacity 0.9s var(--ease), transform 7s linear; }
.pf-stage::before { content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none; background: linear-gradient(to top, rgba(9, 8, 10, 0.9) 0%, rgba(9, 8, 10, 0.5) 34%, rgba(9, 8, 10, 0) 62%), linear-gradient(to bottom, rgba(9, 8, 10, 0.5), rgba(9, 8, 10, 0) 28%); }
.pf-stage-marks { position: absolute; inset: 12px; z-index: 2; pointer-events: none; opacity: 0.6; transition: opacity 0.4s, inset 0.6s var(--ease); }
.pf-stage-marks i { position: absolute; width: 14px; height: 14px; border: 0 solid var(--ink); }
.pf-stage-marks i:nth-child(1) { left: 0; top: 0; border-width: 1.5px 0 0 1.5px; } .pf-stage-marks i:nth-child(2) { right: 0; top: 0; border-width: 1.5px 1.5px 0 0; }
.pf-stage-marks i:nth-child(3) { left: 0; bottom: 0; border-width: 0 0 1.5px 1.5px; } .pf-stage-marks i:nth-child(4) { right: 0; bottom: 0; border-width: 0 1.5px 1.5px 0; }
.pf-stage:hover .pf-stage-marks { inset: 8px; opacity: 1; }
.pf-stage-top { position: absolute; left: 20px; right: 20px; top: 18px; z-index: 2; display: flex; justify-content: space-between; gap: 12px; font: 600 11px var(--cond); letter-spacing: 0.18em; text-transform: uppercase; color: rgba(241, 234, 219, 0.8); }
.pf-stage-top b { color: var(--acc); font-weight: 700; text-align: right; transition: color 0.6s; }
.pf-stage-text { position: absolute; left: 20px; right: 20px; bottom: 18px; z-index: 2; display: grid; gap: 7px; padding-right: 160px; }
.pf-stage-tag { font: italic 400 clamp(24px, 3.6vw, 34px)/1.1 var(--serif); color: var(--ink); text-wrap: balance; text-shadow: 0 1px 14px rgba(0, 0, 0, 0.5); }
.pf-stage-row { display: flex; align-items: baseline; gap: 10px; font: 700 12.5px var(--cond); letter-spacing: 0.2em; text-transform: uppercase; }
.pf-stage-name { color: var(--acc); transition: color 0.6s; }
.pf-stage-open { display: none; align-items: center; gap: 5px; color: rgba(241, 234, 219, 0.75); letter-spacing: 0.14em; font-weight: 600; } .pf-stage-open .ar { width: 0.8em; height: 0.8em; }
.pf-reel.is-swap .pf-stage-text { animation: pf-rise 0.8s var(--ease); }
@keyframes pf-rise { from { opacity: 0; transform: translateY(10px); } }
.pf-stage-go { position: absolute; right: 18px; bottom: 18px; z-index: 2; display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border: 1px solid rgba(241, 234, 219, 0.45); border-radius: 999px; background: rgba(9, 8, 10, 0.45); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); font: 600 11px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink); opacity: 0; transform: translateY(6px); transition: opacity 0.4s, transform 0.5s var(--ease), background 0.3s, border-color 0.3s, color 0.3s; }
.pf-stage-go .ar { width: 0.8em; height: 0.8em; }
.pf-stage:hover .pf-stage-go, .pf-stage:focus-visible .pf-stage-go { opacity: 1; transform: none; background: var(--ink); border-color: var(--ink); color: #140f09; }
.pf-stage-bar { position: absolute; left: 0; right: 0; bottom: 0; z-index: 3; height: 2px; background: rgba(241, 234, 219, 0.12); }
.pf-stage-bar::after { content: ""; position: absolute; inset: 0; background: var(--acc); transform: scaleX(0); transform-origin: left; }
.pf-reel.is-swap .pf-stage-bar::after { animation: pf-bar 4.8s linear forwards; }
.pf-reel.is-hold .pf-stage-bar::after { animation-play-state: paused; }
@keyframes pf-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.pf-strip { --pad: clamp(18px, 3vw, 30px); display: flex; gap: 8px; margin: 10px calc(-1 * var(--pad)) 0; padding: 6px var(--pad); overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; -webkit-mask: linear-gradient(90deg, transparent, #000 var(--pad), #000 calc(100% - var(--pad)), transparent); mask: linear-gradient(90deg, transparent, #000 var(--pad), #000 calc(100% - var(--pad)), transparent); }
.pf-strip::-webkit-scrollbar { display: none; }
.pf-strip li { flex: 0 0 auto; scroll-snap-align: center; }
.pf-thumb { position: relative; display: block; width: 128px; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 7px; background: var(--bg-2); box-shadow: 0 0 0 1px var(--line); opacity: 0.5; transform: scale(0.95); transition: opacity 0.35s, transform 0.5s var(--ease); }
.pf-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.pf-thumb::before { content: attr(data-name); position: absolute; left: 0; right: 0; bottom: 0; z-index: 1; padding: 18px 8px 5px; background: linear-gradient(rgba(9, 8, 10, 0), rgba(9, 8, 10, 0.94) 60%); text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9); font: 700 9.5px/1 var(--cond); letter-spacing: 0.16em; color: var(--ink); opacity: 0; transform: translateY(4px); transition: opacity 0.3s, transform 0.4s var(--ease); }
.pf-thumb:hover::before, .pf-thumb:focus-visible::before, .pf-thumb.is-on::before { opacity: 1; transform: none; }
.pf-thumb::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1.5px var(--acc); opacity: 0; transition: opacity 0.3s; }
.pf-thumb:hover, .pf-thumb:focus-visible { opacity: 0.92; transform: none; }
.pf-thumb.is-on { opacity: 1; transform: none; } .pf-thumb.is-on::after { opacity: 1; }
.pf-strip.is-drag { cursor: grabbing; scroll-snap-type: none; } .pf-strip.is-drag .pf-thumb { pointer-events: none; }
.pf-reel-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; margin-top: 16px; }
.pf-reel-row .btn { height: 50px; padding: 0 24px; font-size: 13.5px; }
.pf-reel-pause { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 14px; border: 1px solid var(--line-2); border-radius: 999px; background: none; color: var(--dim); font: 600 11.5px var(--cond); letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; transition: border-color 0.3s, color 0.3s; }
.pf-reel-pause:hover, .pf-reel-pause:focus-visible { border-color: var(--ink); color: var(--ink); }
.pf-reel-pause svg { width: 13px; height: 13px; } .pf-reel-pause .pl, .pf-reel-pause.on .pz { display: none; } .pf-reel-pause.on .pl { display: block; }
.pf-reel.is-paused .pf-stage-bar::after { animation-play-state: paused; }
.pf-reel-hint { font: 600 11.5px var(--cond); letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint); }
.pf-reel-hint .if-touch { display: none; }
@media (hover: none), (pointer: coarse) { .pf-reel-hint .if-touch { display: inline; } .pf-stage-go { display: none; } .pf-stage-open { display: inline-flex; } .pf-stage-text { padding-right: 0; } .pf-stage-marks { opacity: 0.4; } }
/* margin notes on a wide screen only: the italic in the gutters, in after the column settles */
.pf-notes, .pf-note--cl, .pf-note--2 { display: none; }
@media (min-width: 1240px) {
  .pf-notes, .pf-note--cl, .pf-note--2 { display: block; }
  /* (the thanks rides beside the client logos: inside their section, so it stays with them whatever the lists above unfold to) */
  .pf-sec--cl { position: relative; } .pf-note--cl { right: -230px; top: 50%; translate: 0 -50%; }
  .pf-note { text-shadow: 0 0 10px var(--bg), 0 0 22px var(--bg); position: absolute; width: 190px; font: italic 400 20px/1.3 var(--serif); color: var(--accent-2); opacity: 0; transform: translateY(14px) rotate(-2deg); transition: opacity 1s var(--ease), transform 1.2s var(--ease); }
  .pf-note.in { opacity: 0.9; transform: rotate(-2deg); }
  .pf-sec--pj { position: relative; } .pf-note--2 { right: -230px; top: 50%; translate: 0 -50%; }   /* (the projects count sits beside the projects, Navy's ask) */
  .pf-note--1 { left: -230px; top: 560px; text-align: right; } .pf-note--3 { left: -230px; bottom: 120px; text-align: right; }
}
@media (max-width: 800px) {
  .pf { padding-top: calc(var(--head-h) + 4px); }
  .pf-card, .pf-sec, .pf-cta, .pf-hatch, .pf-tabs--pin { border-left: 0; border-right: 0; }
  .pf-marq-i { width: 88px; height: 26px; margin-right: 32px; } .pf-card, .pf-cta { border-radius: 0; }
  .pf-logos { grid-template-columns: repeat(3, 1fr); }
  .pf-st { grid-template-columns: 1fr; row-gap: 8px; } .pf-td { margin-top: -8px; }
  .pf-pj a { grid-template-columns: 72px 1fr 20px; } .pf-pj-st { display: none; }
  .pf-svc-g { grid-template-columns: 1fr; } .pf-svc-c.is-wide { grid-column: auto; }
  .pf-proc-l { grid-template-columns: 1fr 1fr; row-gap: 22px; } .pf-proc-l::before { display: none; } .pf-banner-go span { display: none; } .pf-banner-go { padding: 0 11px; } .pf-th { width: 72px; height: 45px; }
  .pf-feats { grid-template-columns: 1fr 1fr; } .pf-feat:nth-child(3) { grid-column: 1 / -1; } .pf-feat:nth-child(3) > a { grid-template-columns: 1fr 1fr; align-items: center; }   /* (the third card across, picture beside its words, instead of hidden) */
  .pf-nums { gap: 8px; } .pf-num { padding: 12px; }
  .pf-stage { border-radius: 10px; } .pf-stage-top { left: 14px; right: 14px; top: 14px; } .pf-stage-text { left: 14px; right: 14px; bottom: 14px; gap: 5px; }
  .pf-stage-marks { inset: 9px; } .pf-stage-marks i { width: 11px; height: 11px; }
  .pf-thumb { width: 104px; } .pf-reel-row .btn { width: 100%; }
  .pf-tabs a { min-width: 0; padding: 0 6px; gap: 6px; font-size: 12px; letter-spacing: 0.06em; } .pf-tabs a svg { width: 15px; height: 15px; }
  body.home-profile .side-3d, body.home-profile .side-3d-nav { display: none; }
}
@media (max-width: 480px) { .pf-tabs a { flex-direction: column; gap: 4px; height: 58px; padding: 0 2px; } .pf-tabs a::after { left: 10px; right: 10px; } .pf-id { flex-direction: column; align-items: flex-start; } .pf-hero-wa { margin: 10px 0 0; } .pf-hero-cta { justify-content: flex-start; margin: 24px 0 0; } .pf-fab { right: 14px; bottom: calc(14px + env(safe-area-inset-bottom, 0px)); height: 48px; } .pf-feats { grid-template-columns: 1fr; } .pf-feat:nth-child(3) { grid-column: auto; } .pf-feat:nth-child(3) > a { grid-template-columns: none; } .pf-nums { grid-template-columns: 1fr 1fr 1fr; } .pf-num b { font-size: 26px; } .pf-face { width: 100px; height: 100px; } .pf-id { margin-top: -50px; } }
@media (prefers-reduced-motion: reduce) { .pf-ring { animation: none; } .pf-pulse { display: none; } .pf-marq-t { animation: none; } .pf-tabs--pin { transition: none; } .pf-banner-v { display: none; } .pf-hatch { animation: none; } .pf-banner img { transform: scale(1.04); } }
@media (prefers-reduced-motion: reduce) { .pf-reel-pause { display: none; } .pf-stage-pics, .pf-stage-pic.is-on { transform: none; } .pf-reel.is-swap .pf-stage-text { animation: none; } .pf-stage-bar { display: none; } }
.motion-off .pf-marq-t { animation: none; } .motion-off .pf-reel-pause { display: none; } .motion-off .pf-stage-pics, .motion-off .pf-stage-pic.is-on { transform: none; } .motion-off .pf-reel.is-swap .pf-stage-text { animation: none; } .motion-off .pf-stage-bar { display: none; }
`;

export const HOME_PROFILE_JS = DITHER_JS + STACK_JS + `
(function(){
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-off');
  // the banner drifts a little toward the pointer
  var card = document.querySelector('.pf-card'), bimg = document.querySelector('.pf-banner img');
  if (card && bimg && fine && !reduce) card.addEventListener('pointermove', function (e) { var r = card.getBoundingClientRect(); bimg.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3)); bimg.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3)); });
  // the banner's loop of the desk, on a desktop that is not saving data (the still stays under it, and for everyone else)
  var bv = document.querySelector('.pf-banner-v');
  var cn = navigator.connection;
  if (bv && fine && !reduce && !(cn && (cn.saveData || /(^|-)(2g|3g)$/.test(cn.effectiveType || '')))) {
    var play = function () { var q = bv.play(); if (q && q.catch) q.catch(function () {}); };
    var go = function () {
      bv.addEventListener('playing', function () { bv.classList.add('on'); }, { once: true }); bv.load(); play();
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) play(); else bv.pause(); }); }).observe(bv);
    };
    var later = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(go, { timeout: 3000 }); };
    if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
  }
  // the local time where Navy works (Western Indonesia, UTC+7), after the country
  var clk = document.querySelector('[data-clock]');
  if (clk && window.Intl) { try { var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); var tick = function () { clk.textContent = fmt.format(new Date()) + ' WIB'; }; tick(); setInterval(tick, 30000); } catch (x) {} }
  // a soft light that follows the pointer across the cards, and the featured cards leaning toward it
  if (fine && !reduce) {
    document.querySelectorAll('.pf-num, .pf-feat > a, .pf-logo').forEach(function (el) { el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); el.style.setProperty('--gx', (e.clientX - r.left) + 'px'); el.style.setProperty('--gy', (e.clientY - r.top) + 'px'); }); });
    document.querySelectorAll('.pf-feat > a').forEach(function (a) {
      a.addEventListener('pointermove', function (e) { var r = a.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; a.classList.add('is-tilt'); a.style.setProperty('--rx', (y * -7).toFixed(2) + 'deg'); a.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg'); });
      a.addEventListener('pointerleave', function () { a.classList.remove('is-tilt'); a.style.removeProperty('--rx'); a.style.removeProperty('--ry'); });
    });
  }
  // the project list's floating preview: the row's picture rides beside the pointer (a wide screen with a mouse)
  if (fine && !reduce && innerWidth >= 1100) (function () {
    var peek = document.createElement('div'), pim = new Image(), tx = 0, ty = 0, cx = 0, cy = 0, on = false, raf = 0;
    peek.className = 'pf-peek'; peek.setAttribute('aria-hidden', 'true'); pim.alt = ''; pim.decoding = 'async'; peek.appendChild(pim); document.body.appendChild(peek);
    function place() { peek.style.transform = 'translate3d(' + Math.min(cx + 28, innerWidth - 316) + 'px,' + Math.max(12, Math.min(cy - 94, innerHeight - 200)) + 'px,0)'; }
    function loop() { cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2; place(); if (on || Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5) raf = requestAnimationFrame(loop); else raf = 0; }
    document.querySelectorAll('.pf-pj a').forEach(function (a) {
      var im = a.querySelector('.pf-th img'); if (!im) return;
      a.addEventListener('pointerenter', function (e) { tx = e.clientX; ty = e.clientY; if (!peek.classList.contains('on')) { cx = tx; cy = ty; place(); } pim.src = im.currentSrc || im.src; on = true; peek.classList.add('on'); if (!raf) raf = requestAnimationFrame(loop); });
      a.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; });
      a.addEventListener('pointerleave', function () { on = false; peek.classList.remove('on'); });
    });
    addEventListener('scroll', function () { if (on) { on = false; peek.classList.remove('on'); } }, { passive: true });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && on) { on = false; peek.classList.remove('on'); } });   // (WCAG 1.4.13: what appears on hover can be dismissed)
  })();
  // the floating WhatsApp button: in once the hero's button has gone by, out again when the closing banner comes into view
  (function () {
    var fab = document.querySelector('.pf-fab'), hero = document.querySelector('.pf-hero-cta'), end = document.querySelector('.pf-cta');
    if (!fab || !hero || !end || !('IntersectionObserver' in window)) return;
    var past = false, done = false, set = function () { var on = past && !done; fab.classList.toggle('on', on); fab.tabIndex = on ? 0 : -1; };
    new IntersectionObserver(function (es) { es.forEach(function (e) { past = !e.isIntersecting && e.boundingClientRect.top < 0; }); set(); }).observe(hero);
    new IntersectionObserver(function (es) { es.forEach(function (e) { done = e.isIntersecting || e.boundingClientRect.top < 0; }); set(); }).observe(end);
  })();
  // the three numbers count up once the intro has gone and they are in view (the page's own counter only arms numbers below the fold)
  (function () {
    var nums = [].slice.call(document.querySelectorAll('.pf-num b[data-count]')); if (!nums.length || reduce || !('IntersectionObserver' in window)) return;
    var root = document.documentElement;
    nums.forEach(function (el) { el.dataset.counted = '1'; el.textContent = '0'; });
    var go = function () { nums.forEach(function (el, k) { var n = +el.dataset.count || 0, t0 = 0; var step = function (now) { if (!t0) t0 = now + k * 140; var q = Math.min(1, Math.max(0, (now - t0) / 1100)); el.textContent = String(Math.round((1 - Math.pow(1 - q, 3)) * n)); if (q < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }); };
    var watch = function () { var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); } }, { threshold: 0.6 }); io.observe(nums[0].closest('.pf-nums') || nums[0]); };
    if (root.classList.contains('intro-on')) new MutationObserver(function (ms, mo) { if (!root.classList.contains('intro-on')) { mo.disconnect(); watch(); } }).observe(root, { attributes: true, attributeFilter: ['class'] });
    else watch();
  })();
  // a row's story opens under it
  var setOpen = function (row, on) { row.classList.toggle('open', on); var b = row.querySelector('.pf-tg'); if (b) b.setAttribute('aria-expanded', String(on)); };
  document.querySelectorAll('.pf-exp').forEach(function (row) { row.addEventListener('click', function (e) { if (e.target.closest('a') || (window.getSelection && String(getSelection()).length)) return; setOpen(row, !row.classList.contains('open')); }); });
  var xall = document.querySelector('.pf-xall');
  if (xall) xall.addEventListener('click', function () { var on = !xall.classList.contains('on'); xall.classList.toggle('on', on); xall.textContent = on ? xall.dataset.close : xall.dataset.open; (xall.closest('section') || document).querySelectorAll('.pf-exp').forEach(function (row) { setOpen(row, on); }); });
  // the tabs: one indicator that slides to the tab pointed at, and back to the page's own
  (function () {
    var tabs = document.querySelector('.pf-tabs'), ind = tabs && tabs.querySelector('.pf-tabs-ind'); if (!ind) return;
    var cur = tabs.querySelector('a[aria-current]'), go = function (a) { if (!a) return; ind.style.width = Math.max(0, a.offsetWidth - 28) + 'px'; ind.style.transform = 'translateX(' + (a.offsetLeft + 14) + 'px)'; };
    tabs.classList.add('has-ind'); go(cur);
    tabs.querySelectorAll('a').forEach(function (a) { a.addEventListener('pointerenter', function () { go(a); }); a.addEventListener('focus', function () { go(a); }); a.addEventListener('blur', function () { go(cur); }); });
    tabs.addEventListener('pointerleave', function () { go(cur); }); addEventListener('resize', function () { go(cur); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { go(cur); });
  })();
  // the headings rise as their section arrives, the bio's phrases draw their stroke
  if (!reduce && 'IntersectionObserver' in window) {
    document.body.classList.add('pf-hx');
    var rise = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rise.unobserve(e.target); } }); }, { threshold: 0.4 });
    document.querySelectorAll('.pf-h, .pf-bio, .pf-tl, .pf-proc-l').forEach(function (h) { rise.observe(h); });
  }
  // the chapter rail: the section in view is lit; a click glides to its section without touching the address
  (function () {
    var links = [].slice.call(document.querySelectorAll('.pf-rail a')); if (!links.length) return;
    var secs = links.map(function (a) { var t = document.getElementById(a.dataset.rail); return t ? (t.closest('section') || t) : null; });
    links.forEach(function (a, i) { a.addEventListener('click', function (e) { var t = document.getElementById(a.dataset.rail); if (!t) return; e.preventDefault(); t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }); });
    if (!('IntersectionObserver' in window)) return;
    var light = function (i) { links.forEach(function (a, k) { a.classList.toggle('on', k === i); if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); };
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) light(secs.indexOf(e.target)); }); }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (sec) { if (sec) io.observe(sec); });
  })();
  // the lists fold after a few rows
  document.querySelectorAll('.pf-more').forEach(function (btn) { var list = btn.previousElementSibling, label = btn.querySelector('span'), more = label.textContent, less = btn.dataset.less; btn.addEventListener('click', function () { var on = !btn.classList.contains('open'); btn.classList.toggle('open', on); list.querySelectorAll('[data-more]').forEach(function (li, k) { li.hidden = !on; if (on && !reduce) { li.style.setProperty('--k', k); li.classList.remove('rise'); void li.offsetWidth; li.classList.add('rise'); } }); label.textContent = on ? less : more; if (!on) list.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); }); });
  // the margin notes come in with the column
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('in'); }); }, { threshold: 0.2 }); document.querySelectorAll('.pf-note').forEach(function (n) { io.observe(n); }); }
  // the reel: one stage over a strip of frames. A frame pointed at (tapped once, or focused) comes up on the stage with its words;
  // the stage walks on by itself while it is on screen and nobody is over it (the bar along its bottom is the clock: when its
  // animation ends the next world comes up, and holding pauses it); a swipe or the arrow keys turn it by hand. Every frame and the
  // stage lead to that world's card on /labs (a frame already on the stage navigates; on touch the first tap only brings it up).
  (function () {
    var reel = document.querySelector('.pf-reel'); if (!reel) return;
    var stage = reel.querySelector('.pf-stage'), pics = reel.querySelector('.pf-stage-pics'), strip = reel.querySelector('.pf-strip'), bar = reel.querySelector('.pf-stage-bar');
    var thumbs = [].slice.call(reel.querySelectorAll('.pf-thumb')), n = thumbs.length, cur = 0, imgs = {}, hoverT = 0, over = false, off = true, started = false;
    var nEl = reel.querySelector('.pf-stage-n'), catEl = reel.querySelector('.pf-stage-cat'), tagEl = reel.querySelector('.pf-stage-tag'), nameEl = reel.querySelector('.pf-stage-name');
    if (!stage || !pics || !strip || !bar || n < 2) return;
    imgs[0] = pics.querySelector('img');
    function two(i) { return (i < 9 ? '0' : '') + (i + 1); }
    function pic(i) {   // the stage's picture of world i, made on first need (the next one is made ahead, so a fade finds it ready)
      if (imgs[i]) return imgs[i];
      var t = thumbs[i], im = new Image(); im.className = 'pf-stage-pic'; im.alt = ''; im.decoding = 'async';
      if (t.dataset.small) { im.srcset = t.dataset.small + ' 800w, ' + t.dataset.big + ' 1280w'; im.sizes = '(min-width: 800px) 720px, 100vw'; }
      im.src = t.dataset.big; pics.appendChild(im); imgs[i] = im; return im;
    }
    var focused = false, paused = false;
    function hold() { reel.classList.toggle('is-hold', over || focused || paused || off || document.hidden); reel.classList.toggle('is-paused', paused); }
    var restT = 0, auto = 0;
    function rest() { clearTimeout(restT); over = true; hold(); restT = setTimeout(function () { over = false; hold(); }, 6000); }   // (a finger on the reel: it waits a while)
    function centre(t) { clearTimeout(auto); auto = setTimeout(function () { auto = 0; }, 900); strip.scrollTo({ left: t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' }); }
    function show(i, byHand) {
      i = ((i % n) + n) % n; if (i === cur) return;
      var im = pic(i), go = function () {
        if (i === cur) return; cur = i;
        Object.keys(imgs).forEach(function (k) { imgs[k].classList.toggle('is-on', +k === i); imgs[k].alt = +k === i ? (stage.dataset.alt || '').replace('{n}', thumbs[i].dataset.name) : ''; });   // (only the picture shown has an alt)
        thumbs.forEach(function (t, k) { t.classList.toggle('is-on', k === i); if (k === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
        var t = thumbs[i];
        nEl.textContent = two(i) + ' / ' + two(n - 1); catEl.textContent = t.dataset.cat; tagEl.textContent = t.dataset.tag; nameEl.textContent = t.dataset.name;
        reel.style.setProperty('--h', t.dataset.h); stage.href = t.href; stage.dataset.lab = t.dataset.key;
        reel.classList.remove('is-swap'); void reel.offsetWidth; if (!reduce) reel.classList.add('is-swap');   // (the words rise again, the clock restarts)
        if (!byHand) centre(t);   // (by hand the strip stays put: scrolling it under a resting pointer would bring up the next frame)
        pic((i + 1) % n);
      };
      if (im.decode) im.decode().then(go, go); else go();
    }
    bar.addEventListener('animationend', function () { if (!reel.classList.contains('is-hold')) show(cur + 1); });
    thumbs.forEach(function (t, i) {
      if (fine) { t.addEventListener('pointerenter', function () { clearTimeout(hoverT); hoverT = setTimeout(function () { show(i, true); }, 80); }); t.addEventListener('pointerleave', function () { clearTimeout(hoverT); }); }
      t.addEventListener('focus', function () { show(i, true); });
      t.addEventListener('click', function (e) { if (strip.dataset.dragged) { e.preventDefault(); return; } if (!fine && i !== cur) { e.preventDefault(); show(i, true); } });
    });
    if (fine) {   // the strip drags sideways under a mouse (a drag is not a click)
      var x0 = 0, s0 = 0, pid = -1, moved = false;
      strip.addEventListener('pointerdown', function (e) { if (e.button !== 0 || e.pointerType !== 'mouse') return; pid = e.pointerId; x0 = e.clientX; s0 = strip.scrollLeft; moved = false; });
      strip.addEventListener('pointermove', function (e) { if (e.pointerId !== pid) return; var d = e.clientX - x0; if (!moved && Math.abs(d) > 6) { moved = true; strip.classList.add('is-drag'); try { strip.setPointerCapture(pid); } catch (x) {} } if (moved) strip.scrollLeft = s0 - d; });
      var end = function (e) { if (e.pointerId !== pid) return; pid = -1; if (moved) { strip.dataset.dragged = '1'; setTimeout(function () { strip.classList.remove('is-drag'); delete strip.dataset.dragged; }, 0); } };
      strip.addEventListener('pointerup', end); strip.addEventListener('pointercancel', end);
    }
    if (fine && !reduce) {   // the picture leans a little toward the pointer
      stage.addEventListener('pointermove', function (e) { var r = stage.getBoundingClientRect(); pics.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3)); pics.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3)); });
      stage.addEventListener('pointerleave', function () { pics.style.removeProperty('--mx'); pics.style.removeProperty('--my'); });
    }
    var sx = 0, sy = 0, swiped = false;   // a swipe across the stage turns it; so do the arrow keys when it has the focus
    stage.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; swiped = false; });
    stage.addEventListener('pointerup', function (e) { var dx = e.clientX - sx, dy = e.clientY - sy; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { swiped = true; show(cur + (dx < 0 ? 1 : -1), true); } });
    stage.addEventListener('click', function (e) { if (swiped) { e.preventDefault(); swiped = false; } });
    stage.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1, true); } else if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1, true); } });
    reel.addEventListener('focusin', function () { focused = true; hold(); });
    reel.addEventListener('focusout', function (e) { if (!reel.contains(e.relatedTarget)) { focused = false; hold(); } });
    var pz = reel.querySelector('.pf-reel-pause');
    if (pz) pz.addEventListener('click', function () { paused = !paused; pz.classList.toggle('on', paused); pz.querySelector('span').textContent = paused ? pz.dataset.play : pz.dataset.pause; hold(); });
    [stage, strip].forEach(function (el) { el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { clearTimeout(restT); over = true; hold(); } }); el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { over = false; hold(); } }); });
    reel.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') rest(); });
    strip.addEventListener('scroll', function () { if (!auto && !fine) rest(); }, { passive: true });   // (the strip scrolled by hand, not by the reel itself)
    document.addEventListener('visibilitychange', hold);
    var start = function () { if (started) return; started = true; pic(1); if (!reduce) reel.classList.add('is-swap'); };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { off = !e.isIntersecting; hold(); if (!off) start(); }); }, { threshold: 0.35 }).observe(stage);
    else { off = false; hold(); start(); }
  })();
  // the background: the dither field (scripts/dither.js, react-bits' Dither in WebGL2) in the page's own tones. It drifts on its own,
  // the pointer erases it where it passes and leaves a short trail (mouse only), a click sends a ring out; a phone gets a coarser
  // cell at 30 fps, reduced motion gets one still frame, and without WebGL2 the CSS dots stay.
  if (!window.requestAnimationFrame || typeof nvDither !== 'function') return;
  var field = nvDither({ waveColor: '#8c8c8c', backgroundColor: '#0e0c09', pixelSize: fine ? 2 : 3, dpr: fine ? 1.5 : 1, fps: fine ? 30 : 24, mouse: fine && !reduce, mouseRadius: 0.3, trail: 0.5, clickRipple: fine && !reduce, intro: !reduce, animate: !reduce });
  if (!field) return;
  document.body.prepend(field.canvas); document.body.classList.add('has-field'); requestAnimationFrame(function () { field.canvas.classList.add('on'); }); field.start();
  // (it slows down when nobody moves: after twelve quiet seconds it drifts at 12 frames a second instead of 30, never still,
  // and the next move brings it back; a hidden tab draws nothing at all)
  if (!reduce) {
    var quiet = 0, slow = false, full = fine ? 30 : 24, nap = function () { clearTimeout(quiet); quiet = setTimeout(function () { slow = true; if (field.setFps) field.setFps(12); }, 12000); };
    var stir = function () { if (slow) { slow = false; if (field.setFps) field.setFps(full); } nap(); };
    ['pointermove', 'pointerdown', 'wheel', 'scroll', 'keydown', 'touchstart'].forEach(function (ev) { addEventListener(ev, stir, { passive: true }); });
    nap();
  }
})();`;
