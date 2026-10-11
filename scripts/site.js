// The plain portfolio: navygibran.dev/ and one page per project under /work/<key>/, rendered from src/app/data.js (the same
// content the 3D desk tells) into static HTML. No WebGL, no framework: the CSS and the page script (site/) are inlined into
// every page. scripts/build.js writes these pages into dist/; scripts/serve.js renders them fresh on every request.
// The 3D desk itself lives at /3d/ (dist/3d/index.html); this site only links to it.
// Design: Ownitt's grammar (condensed capitals finished by an italic serif, parenthesised kickers, pinned scenes that play as you
// scroll, colour panels per project, loops of names) and Marcus Lorenzet's calm, in the desk's warm dark.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORIGIN = 'https://navygibran.dev';
// Ownitt's own faces (Elza Condensed, IvyPresto Display) are Adobe Fonts: with a web project for navygibran.dev, put its kit id
// here (or in the ADOBE_KIT env var) and the CSS stacks pick them up; until then the free stand-ins in site.css are used.
const ADOBE_KIT = process.env.ADOBE_KIT || '';
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');   // (a Windows checkout has CRLF)

// data.js imports BACKLIGHTS from app/theme (3D only); the site doesn't need it, so the import becomes a constant
async function loadData() {
  const src = read('src/app/data.js').replace(/^import\s+\{[^}]*\}\s+from\s+'app\/theme';?\s*$/m, 'const _BL = null;');
  return import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
}

// width and height of a .webp (VP8, VP8L, VP8X), .png or .jpg, so every <img> carries its size and nothing jumps while it loads
const dimCache = new Map();
function imgSize(rel) {
  const file = path.join(root, 'public', rel);
  if (dimCache.has(file)) return dimCache.get(file);
  let out = null;
  try {
    const b = fs.readFileSync(file);
    if (b.toString('ascii', 0, 4) === 'RIFF') {
      const fourcc = b.toString('ascii', 12, 16);
      if (fourcc === 'VP8 ') out = { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      else if (fourcc === 'VP8L') { const v = b.readUInt32LE(21); out = { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
      else if (fourcc === 'VP8X') out = { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    } else if (b.readUInt32BE(0) === 0x89504e47) out = { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    else if (b[0] === 0xff && b[1] === 0xd8) {
      for (let i = 2; i < b.length - 9;) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1], len = b.readUInt16BE(i + 2);
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) { out = { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) }; break; }
        i += 2 + len;
      }
    }
  } catch {}
  dimCache.set(file, out);
  return out;
}
const exists = (rel) => fs.existsSync(path.join(root, 'public', rel));
const firstOf = (...rels) => rels.find(exists) || null;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const host = (u) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; } };
const strip = (s) => String(s).replace(/<[^>]+>/g, '');
const pad = (n) => String(n).padStart(2, '0');
// every word in its own mask, so a line rises word by word whatever the width; `n` carries the running index for the stagger
function split(s, n = { i: 0 }, em = false) {
  const out = esc(s).split(/\s+/).filter(Boolean).map((t) => `<span class="wd"><span style="--i:${n.i++}">${t}</span></span>`).join(' ');
  return em ? `<em>${out}</em>` : out;
}
// a sentence and its italic ending, both split, one running stagger
const splitPair = (plain, italic) => { const n = { i: 0 }; return `${split(plain, n)} ${split(italic, n, true)}`; };

// ---------- what the site says that data.js doesn't. Every line restates a fact from data.js; nothing here is new.
// `bg` and `acc` are each project's own colours (GodPlan's violet interface, Orthobone's royal blue, Godjah's lime, Winfaith red,
// Flora's rose, FLS green and gold), darkened into the panel the project sits on.
// (JAKASN left the list: it has no picture to show, Navy's call 2026-10-11; it keeps its page in the archive)
const FEATURED = [
  { key: 'godplan-erp', kind: 'ERP', meta: ['Go', 'Next.js', 'PostgreSQL'], bg: '#17112b', acc: '#b39bff', line: 'One system for the parts of a company that usually sprawl across four tools and a spreadsheet: people, attendance, payroll, tasks and CRM.' },
  { key: 'orthobone', kind: 'E-commerce', meta: ['WooCommerce', 'Elementor'], bg: '#0c1a33', acc: '#8fb4f0', line: 'Orthopedic mattresses sold from the brand\'s own store: every bed with its firmness and height, carried from cart to checkout.' },
  { key: 'godjah-studio', kind: 'Custom build', meta: ['Next.js', 'Motion'], bg: '#12170b', acc: '#c9f25a', line: 'The second site I built for PT. Gajah Terbang Kreatif: their WordPress site rebuilt in Next.js with 3D and interactive design. One studio, three brands, a motion-led entrance.' },
  { key: 'the-bedji-group', kind: 'Company website', meta: ['WordPress', 'Elementor'], bg: '#0b1f18', acc: '#d9b56a', line: 'Three businesses on one stretch of the Jatiluwih rice terraces, river tubing, a restaurant and a purification ritual, on one site with booking by WhatsApp.' },
  { key: 'winfaith', kind: 'Custom build', meta: ['SvelteKit', 'GSAP', 'Three.js'], bg: '#251110', acc: '#ff8a6b', line: 'A plastic injection moulding manufacturer built as an application instead of a theme, its catalogue served straight from its own API.' },
  { key: 'flora-indonesia', kind: 'E-commerce', meta: ['WooCommerce', 'Payments'], bg: '#26131a', acc: '#f5abc0', line: 'Flora Indonesia, the florist of PT. Rumindo Pertiwi Wardhana, selling online: catalogue, checkout, payments and delivery logistics, all part of one build.' },
  { key: 'fls-group-indonesia', kind: 'E-commerce', meta: ['WooCommerce', 'Elementor'], bg: '#0d1f1a', acc: '#d8b26a', line: 'Feng shui porcelain, wall decor and LED lamps, in a store that carries the order from cart to checkout.' },
];

// a project's colours: the panel it sits on and its accent. The featured ones are set above; the rest come from the hue in data.js
// (as hex: a browser's theme-color, an older one included, reads it everywhere)
const hsl = (h, s, l) => {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l), k = (n) => (n + h / 30) % 12;
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return '#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('');
};
function tint(p) {
  const f = FEATURED.find((x) => x.key === p.key);
  if (f) return { bg: f.bg, acc: f.acc };
  const h = p.hue ?? 30;
  return { bg: hsl(h, 30, 11), acc: hsl(h, 62, 72) };
}

// "Client Websites" is a hub, not a project: the page that lists every client site (and world 02's page on the desk). It keeps
// its page but stays out of the counts, the archive, the index and the prev/next walk (Navy: twenty projects, 2026-10-12)
const isHub = (p) => p.key === 'client-websites';
const counted = (D) => D.PROJECTS.filter((p) => !isHub(p));
// the kind of work a project is: the archive's filters, and the first test for related projects
const KINDS = [['platform', 'Platforms & ERP'], ['custom', 'Custom builds'], ['store', 'Online stores'], ['wordpress', 'Company websites']];
const kindOf = (x) => (x.key === 'client-websites' ? 'overview' : /WooCommerce/.test(x.stack) ? 'store' : /WordPress/.test(x.stack) ? 'wordpress' : /\bGo\b|OJS/.test(x.stack) ? 'platform' : 'custom');

// the client loop: one mark per business (public/site/logos/<key>.webp, a one-colour silhouette of the logo on its own site);
// `word` sets the name instead where no usable logo exists (the site is offline and only an icon survives in the screenshots)
const CLIENTS = [
  { key: 'winfaith', name: 'PT. Winfaith Indonesia' }, { key: 'flora-indonesia', name: 'PT. Rumindo Pertiwi Wardhana' }, { key: 'dams-garage', name: 'Dams Garage' },
  { key: 'yukti-rasa-mitrabumi', name: 'PT. Yukti Rasa Mitrabumi' }, { key: 'nf-optical', name: 'NF Optical' }, { key: 'godjah-studio', name: 'Godjah Studio' },
  { key: 'miniatur-kapal', name: 'Miniatur Kapal', word: ['Miniatur', 'Kapal'] }, { key: 'gracia-box', name: 'Gracia Box' },
  { key: 'orthobone', name: 'Orthobone' }, { key: 'recon', name: 'Recon' }, { key: 'fortunarack', name: 'Fortunarack' }, { key: 'izzi', name: 'Izzi' },
  { key: 'rameinaja', name: 'RameinAja, now Reparty Indonesia', word: ['Ramein', 'Aja'] }, { key: 'little-aivy', name: 'Little Aivy' }, { key: 'airon', name: 'Airon' },
  { key: 'fls-group-indonesia', name: 'FLS Group Indonesia' }, { key: 'the-bedji-group', name: 'The Bedji Group' },
];

// small counts written out ("five territories"), wherever the page says one
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
// what I build, by kind of work ("territories"); `proof` names the projects that show it
const TERRITORIES = [
  { title: 'ERP, platforms & internal systems', body: 'Systems a company runs on every day: employees, attendance, payroll, tasks, CRM. Clear boundaries in the architecture, so they stay maintainable and testable as they grow. And work inside existing platforms: Open Journal Systems behind a redesigned interface, and the legacy integrations between enterprise-scale systems.', items: ['Go', 'Next.js', 'PostgreSQL', 'Docker', 'PHP', 'Architecture'], proof: ['godplan-erp', 'jakasn'] },
  { title: 'Company websites', body: 'WordPress company profiles a client can hand to their own team afterwards: a custom theme where the design demands it, Elementor where they will edit pages themselves.', items: ['WordPress', 'PHP', 'Elementor', 'Custom themes'], proof: ['dams-garage', 'nf-optical', 'yukti-rasa-mitrabumi'] },
  { title: 'Online stores', body: 'WooCommerce stores where payments and delivery logistics are part of the build, not an afterthought: catalogue, cart, checkout.', items: ['WooCommerce', 'Payments', 'Delivery', 'MySQL'], proof: ['flora-indonesia', 'orthobone', 'fls-group-indonesia'] },
  { title: 'Custom builds', body: 'When a CMS is the wrong tool: custom applications in Next.js or SvelteKit, built as products rather than pages, with the data served from the company\'s own API.', items: ['Next.js', 'SvelteKit', 'TypeScript', 'REST APIs'], proof: ['godjah-studio', 'winfaith'] },
  // (`also` adds a place that is not a project page: the desk itself is the proof here)
  { title: 'Interactive design', body: 'The part of the work I care about most: interfaces that respond. Motion with a reason behind it, 3D where it tells the story better than a page could, and the small details, a cursor, a hover, a transition, that make software feel considered rather than assembled.', items: ['GSAP', 'Three.js', 'WebGL', 'Micro-interactions'], proof: ['godjah-studio', 'winfaith'], also: { href: '/3d/', title: 'the 3D desk' } },
  // (Web3 is in the toolbox below, not a territory: there is no project to show for it yet, and a territory without proof reads as padding)
];

// (no testimonials: Navy's call 2026-10-12, the clients' words are not on hand; the loop of logos is the proof)

// each tool's mark (public/site/tools/<slug>.svg, Simple Icons, CC0; the brands belong to their owners), drawn in one colour as a
// mask like the client logos; a tool with no brand mark gets a short monogram in a ring instead
const TOOL_MARK = {
  Go: 'go', TypeScript: 'typescript', JavaScript: 'javascript', PHP: 'php', Solidity: 'solidity',
  'Next.js': 'nextdotjs', React: 'react', SvelteKit: 'svelte', 'Tailwind CSS': 'tailwindcss',
  'Node.js': 'nodedotjs', Bun: 'bun', PostgreSQL: 'postgresql', MySQL: 'mysql',
  WordPress: 'wordpress', WooCommerce: 'woocommerce', Elementor: 'elementor',
  Docker: 'docker', Vercel: 'vercel', Swagger: 'swagger', DBeaver: 'dbeaver', Figma: 'figma',
  GSAP: 'gsap', 'Framer Motion': 'framer', 'Three.js': 'threedotjs', WebGL: 'webgl',
  'Smart contracts': 'ethereum', 'Wallet integration': 'walletconnect',
};
const TOOL_MONO = { 'REST APIs': 'API', 'Custom themes': 'TH', 'dApp frontends': 'DA' };
const TOOL_WIDE = new Set(['mysql', 'webgl', 'woocommerce', 'gsap']);   // wordmarks: a wider box, or they are a smudge
const toolMark = (t) => TOOL_MARK[t] && exists(`site/tools/${TOOL_MARK[t]}.svg`)
  ? `<i class="tool-i${TOOL_WIDE.has(TOOL_MARK[t]) ? ' tool-i--wide' : ''}" style="--m:url(/site/tools/${TOOL_MARK[t]}.svg)" aria-hidden="true"></i>`
  : `<i class="tool-i tool-i--txt" aria-hidden="true">${esc(TOOL_MONO[t] || t.slice(0, 2).toUpperCase())}</i>`;
// (each tool appears once; REST APIs, Swagger and DBeaver are from the stack on itsnevu.xyz)
const STACK = [
  { layer: 'Languages', items: ['Go', 'TypeScript', 'JavaScript', 'PHP', 'Solidity'] },
  { layer: 'Frontend', items: ['Next.js', 'React', 'SvelteKit', 'Tailwind CSS'] },
  { layer: 'Backend & data', items: ['Node.js', 'Bun', 'REST APIs', 'PostgreSQL', 'MySQL'] },
  { layer: 'Platforms', items: ['WordPress', 'WooCommerce', 'Elementor', 'Custom themes'] },
  { layer: 'Ship & tools', items: ['Docker', 'Vercel', 'Swagger', 'DBeaver', 'Figma'] },
  { layer: 'Motion & 3D', items: ['GSAP', 'Framer Motion', 'Three.js', 'WebGL'] },
  { layer: 'Web3', items: ['Smart contracts', 'Wallet integration', 'dApp frontends'] },
];

// the path so far, newest first (Career, Early Days and Education on the desk)
const PATH = [
  { when: 'July 2025 to present', role: 'Full-stack developer', org: 'PT. Gajah Terbang Kreatif', body: 'Full-stack and WordPress work, and GodPlan ERP: a Go and Next.js system with workforce management features, built as the company\'s internal platform.' },
  { when: 'January to June 2025', role: 'Full-stack developer intern', org: 'Pusbangpeg ASN BKN', body: 'Information Systems Working Group: JAKASN in PHP and MySQL, and work across BKN\'s systems (OJS, JAKASN and BKNPEDIA).' },
  { when: '2024 to 2025', role: 'Programming club', org: 'UMN Programming Club', body: 'C++ for competitive programming, problems solved as a team, and the UMNPC contest.' },
  { when: 'December 2024', role: 'Freelance technician', org: 'BNI procurement', body: '341 Zyrex laptops re-imaged and cloned in two days.' },
  { when: 'October 2023', role: 'Freelance crew', org: 'PT. Nusantara Compnet Integrator', body: 'Where it started: five smart TVs a day, carried up the stairs at Pertamina Simprug by a team of four.' },
  { when: 'August 2022 to 2026', role: 'Bachelor of Informatics', org: 'Universitas Multimedia Nusantara', body: 'Graduated in 2026 with a GPA of 3.71 out of 4.00, after two years as teaching assistant for Object-Oriented Programming: design patterns, SOLID, and the logic behind them.' },
];
// what sets the work apart (Navy, 2026-10-11): the business is read before any technical choice. The usual order beside his; the
// stack opens one list and closes the other
const DIFF = {
  usual: ['The stack', 'The features', 'The screens'],
  usualEnd: 'Then the business bends to fit the software.',
  mine: [
    { step: 'The flow', body: 'How the work really moves: who does what, in what order, and which spreadsheet or group chat holds it together.' },
    { step: 'The friction', body: 'Where time leaks: the double entry, the approval that waits a day, the number nobody quite trusts.' },
    { step: 'The system', body: 'Modules and data shaped around that flow, with boundaries clear enough to grow with the business.' },
    { step: 'The stack', body: 'Go, Next.js, WordPress or a custom build, chosen for what the flow needs.' },
  ],
  mineEnd: ['Then the software fits the business,', 'and people actually use it.'],
};
const PROCESS = [
  { step: 'Strategy', body: 'The roadmap and the architecture.' },
  { step: 'Design', body: 'The experience, from requirements and Figma prototypes.' },
  { step: 'Development', body: 'Secure, scalable systems with clear boundaries.' },
  { step: 'Deployment', body: 'The launch, then monitoring.' },
];
// what each menu link shows beside the list
// (Clients and What I build must not share a picture: client-websites-1 is itself a Winfaith shot, so Clients shows a store)
const MENU_PV = ['shots/gallery/godplan-erp-1.webp', 'shots/gallery/orthobone-1.webp', 'shots/gallery/winfaith-1.webp', 'site/desk-keys.webp', 'site/desk-wide.webp', 'site/desk-world.webp'];
const ROTATE = ['ERP systems', 'company websites', 'online stores', 'custom builds', 'smart contracts', 'a desk in 3D'];
// (the manifesto, the dictionary definition and the masked question used to sit between the introduction and the work: three
// sections saying one thing, eight screens before the first project. The one that says it with evidence, "The difference",
// stays, after the work; the rest went, Navy's call 2026-10-11)

// ---------- pieces
const arrow = '<svg class="ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const arrowR = '<svg class="ar ar-r" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
// Navy's mark (the N from itsnevu.xyz, traced): two strokes, the middle diagonal broken and offset
// Navy's mark, the two strokes of the N as filled outlines traced from his own logo (site/mark.svg, made by scripts/trace-mark.py);
// pathLength lets the intro draw each outline with a dash of one
const MARK_D = [...read('site/mark.svg').matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
const MARK = (cls = '') => `<svg class="nv-mark${cls ? ` ${cls}` : ''}" viewBox="150 140 220 214" aria-hidden="true">${MARK_D.map((d) => `<path d="${d}" pathLength="1"/>`).join('')}</svg>`;
const circleGo = `<span class="go" aria-hidden="true">${arrowR}</span>`;

function img(rel, alt, { cls = '', sizes = '100vw', eager = false } = {}) {
  const d = imgSize(rel), c = [cls, eager ? '' : 'lz'].filter(Boolean).join(' ');
  // (a smaller copy, when scripts/thumbs.py has made one, is offered beside the original: a phone takes the 800 px one)
  const small = rel.replace(/\.webp$/, '-800.webp');
  const set = d && small !== rel && exists(small) ? ` srcset="/${small} 800w, /${rel} ${d.w}w"` : '';
  return `<img src="/${rel}"${set} alt="${esc(alt)}"${d ? ` width="${d.w}" height="${d.h}"` : ''}${c ? ` class="${c}"` : ''} sizes="${sizes}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

export function projectMedia(D, p) {
  const n = D.GALLERY[p.key] || 0;
  const shots = [];
  for (let i = 1; i <= n; i++) if (exists(`shots/gallery/${p.key}-${i}.webp`)) shots.push(`shots/gallery/${p.key}-${i}.webp`);
  if (D.SHOTS.includes(p.key) && exists(`shots/${p.key}.webp`) && !shots.length) shots.push(`shots/${p.key}.webp`);
  let phone = null;
  if (D.SHOTS.includes(p.key) && exists(`shots/${p.key}-m.webp`)) phone = `shots/${p.key}-m.webp`;
  else if (D.GALLERY_PHONE[p.key] && exists(D.GALLERY_PHONE[p.key])) phone = D.GALLERY_PHONE[p.key];
  return { cover: shots[0] || null, shots, phone };
}

// a project as a small card: its picture, its name, its trade (the related projects; the 404 page's suggestions)
const moreCard = (D, x, k, from) => {
  const mm = projectMedia(D, x);
  return `<li style="--i:${k}"><a href="/work/${x.key}/" data-track="project_open" data-project="${x.key}" data-from="${from}" data-bg="${tint(x).bg}" data-name="${esc(x.title)}" data-cursor="View"><span class="more-pic">${mm.cover ? img(mm.cover, `${x.title}: screenshot`, { sizes: '(min-width: 900px) 30vw, 80vw' }) : plate(x)}</span><span class="more-t">${esc(x.title)}</span><span class="more-i">${esc(x.industry)}</span></a></li>`;
};

// a project without a screenshot (JAKASN) gets a typographic plate instead; on its own page (`full`) the plate also says why
// the picture is missing (`noShot` in data.js), and that line is the one part a screen reader gets
const plate = (p, full = false) => {
  const ns = full && p.noShot;
  const hide = ns ? ' aria-hidden="true"' : '';
  return `<div class="plate${ns ? ' plate--note' : ''}"${ns ? '' : ' aria-hidden="true"'}>
    <span class="plate-top"><span class="plate-k"${hide}>${esc(p.industry)}</span>${ns ? kick(ns.tag, ' aria-hidden="true"') : ''}</span>
    <span class="plate-mid"><span class="plate-t"${hide}>${esc(p.title)}</span>${ns ? `<p class="plate-note">${esc(ns.line)}</p>` : ''}</span>
    <span class="plate-s"${hide}>${esc(p.stack)}</span></div>`;
};
// +62 851 7953 6062: the country code, then groups of three, four and four
const phone = (n) => { const d = String(n).replace(/\D/g, ''); const cc = d.slice(0, 2), r = d.slice(2); return `+${cc} ${r.slice(0, 3)} ${r.slice(3, 7)} ${r.slice(7)}`.trim(); };
const wa = (n, text) => `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
const kick = (s, attrs = '') => `<span class="kick"${attrs}><span class="sr">${esc(s)}</span><span class="kt" aria-hidden="true">${esc(s)}</span></span>`;
// a label whose letters roll up on hover, the same letters following from below (screen readers get the word once)
function roll(text, em = '') {
  let i = 0;
  const chars = (s) => [...s].map((ch) => (ch === ' ' ? ' ' : `<span class="ch" style="--i:${i++}">${esc(ch)}</span>`)).join('');
  const row = () => { i = 0; const a = chars(text); const b = em ? ` <em>${chars(em)}</em>` : ''; return a + b; };
  return `<span class="roll"><span class="sr">${esc(text)}${em ? ' ' + esc(em) : ''}</span><span class="ra" aria-hidden="true">${row()}</span><span class="rb" aria-hidden="true">${row()}</span></span>`;
}

function head({ title, description, url, image = `${ORIGIN}/${exists('og.jpg') ? 'og.jpg' : 'og.png'}`, imageAlt, css, extra = '', intro = false, theme = '#0e0c09' }) {
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="Navy Gibran">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="${esc(theme)}">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Navy Gibran">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(imageAlt || 'Navy Gibran, full-stack developer')}">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@itsnevuu">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${image}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/site/fonts/barlow-condensed-700-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/site/fonts/instrument-serif-400-italic-latin.woff2" as="font" type="font/woff2" crossorigin>
${ADOBE_KIT ? `<link rel="stylesheet" href="https://use.typekit.net/${esc(ADOBE_KIT)}.css">\n` : ''}<script>(function(d){d.classList.replace('no-js','js');try{if(window.top!==window.self)d.classList.add('in-desk')}catch(e){}try{var k=Math.max(1,Math.min(innerWidth/1600,innerHeight/900));if(k>1.02&&CSS.supports('zoom','1.5')){d.style.setProperty('--k',k.toFixed(4));d.style.zoom=k.toFixed(4)}}catch(e){}try{if(localStorage.getItem('nv-motion')==='off')d.classList.add('motion-off')}catch(e){}try{var s=sessionStorage,c=s.getItem('nv-curtain');if(c){d.classList.add('curtain-on');if(c!=='1'){d.style.setProperty('--curtain',c);d.classList.add('curtain-tint')}s.removeItem('nv-curtain')}${intro ? "if(!c&&!s.getItem('nv-intro')&&!d.classList.contains('in-desk')&&!d.classList.contains('motion-off')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('intro-on')" : ''}}catch(e){}})(document.documentElement)</script>
<style>${css}</style>
<script type="speculationrules">{"prefetch":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":"/3d/*"}}]},"eagerness":"moderate"},{"where":{"href_matches":"/3d/*"},"eagerness":"conservative"}]}</script>
${extra}</head>`;
}

// the top of every page: the skip link, the anchor "back to top" goes to, the curtain between pages, the header, the menu and
// the tab on the right edge that opens the desk
function header(current) {
  // each link shows a picture of where it leads in the panel beside the list (desktop)
  // (`sub` is the line beside the word: what the section holds, in a few words; the counts are filled in by build())
  const item = (href, n, label, id, k, em = '', sub = '') => `<a href="${href}" data-pv="${k}"${current === id ? ' aria-current="page"' : ''}><span class="mn">${n}</span><span class="ml">${roll(label, em)}</span>${sub ? `<span class="ml-sub" aria-hidden="true">${sub}</span>` : ''}</a>`;
  const pv = MENU_PV.filter(exists).map((f, k) => `<img src="/${f}" alt="" loading="lazy" decoding="async" data-k="${k}"${f.startsWith('shots/') ? ' class="pv-shot"' : ''}>`).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<div id="top" class="top-anchor"></div>
<div class="curtain" aria-hidden="true">${MARK()}<span class="curtain-t"></span></div><script>try{var n=sessionStorage.getItem('nv-curtain-name');if(n){document.currentScript.previousElementSibling.lastChild.textContent=n;sessionStorage.removeItem('nv-curtain-name')}}catch(e){}</script>
<div class="progress" aria-hidden="true"><i></i></div>
<header class="head">
  <div class="head-in">
    <a class="brand" href="/" aria-label="Navy Gibran, home">${MARK()}<span class="brand-n">Navy Gibran</span><span class="head-sec" aria-hidden="true"><span class="hs-in"></span></span></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" data-magnet><span class="menu-word">${roll('Menu')}</span><span class="menu-lines" aria-hidden="true"><i></i><i></i></span></button>
  </div>
</header>
<a class="side-3d" href="/3d/" data-track="3d_cta_click" data-from="tab" aria-label="Enter the 3D desk"><b>3D</b><span>desk ↗</span></a>
<div class="menu" id="menu" aria-hidden="true">
  <div class="menu-bg" aria-hidden="true">${MARK()}</div>
  <nav class="menu-links" aria-label="Main">
    ${item('/#work', '01', 'Work', 'work', 0, '', '__N_PROJECTS__ projects')}${item('/#clients', '02', 'Clients', 'clients', 1, '', '__N_CLIENTS__ businesses, 10+ industries')}${item('/#territories', '03', 'What I build', 'terr', 2, '', `${NUM[TERRITORIES.length] || TERRITORIES.length} territories`)}${item('/#path', '04', 'The path', 'path', 3, '', 'from the stairs to the system')}${item('/#contact', '05', 'Contact', 'contact', 4, '', 'WhatsApp is the fastest way')}${item('/3d/', '06', 'The 3D', 'desk', 5, 'desk', 'the same portfolio, as a room at night')}
  </nav>
  <div class="menu-side">
    <div class="menu-pv" aria-hidden="true">${pv}<span class="menu-pv-mark">${MARK()}</span><span class="menu-pv-cap"><b></b><span></span></span></div>
    <p>Full-stack developer from Indonesia. ERP systems in Go and Next.js, and websites for businesses that want to be found.</p>
    <p class="menu-now"><span class="dot" aria-hidden="true"></span><span><b>Now</b> __NOW__</span></p>
    <p class="menu-now menu-status"><span class="dot dot--open" aria-hidden="true"></span><span>__STATUS__</span></p>
    <button class="menu-find" type="button" data-palette><span>Find a project</span><kbd data-kbd>Ctrl K</kbd></button>
    <div><span class="lbl">Elsewhere</span><ul>__MENU_LINKS__</ul></div>
    <span class="lbl menu-clock" data-clock>Indonesia</span>
  </div>
  <div class="menu-foot" aria-hidden="true"><em>Make it work. Make them want it.</em><span class="menu-esc if-hover"><kbd>Esc</kbd> to close</span><span>© __YEAR__</span></div>
</div>`;
}

function footer(D) {
  const links = D.SITE.links.map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener" data-track="contact_click" data-channel="${esc(l.label)}">${esc(l.label)}</a>`).join('');
  return `<footer class="foot" data-scene="foot" data-hide-tab>
  <div class="wrap">
    <div class="foot-big" aria-hidden="true"><span class="fb-o">Navy Gibran</span><span class="fb-f">Navy Gibran</span></div>
    <div class="foot-cols">
      <div><span class="lbl">Site</span><a href="/#work">Work</a><a href="/work/">All projects</a><a href="/#clients">Clients</a><a href="/#territories">What I build</a><a href="/#path">The path</a><a href="/#contact">Contact</a></div>
      <div><span class="lbl">Elsewhere</span>${links}</div>
      <div><span class="lbl">The other side</span><a href="/3d/" data-track="3d_cta_click" data-from="footer">The 3D desk ${arrow}</a></div>
    </div>
    <div class="foot-bar"><span>© ${esc(D.SITE.copyright || D.SITE.year)} Navy Gibran</span><button class="motion" type="button" aria-pressed="false">Motion <b>on</b></button><em>Make it work. Make them want it.</em><span data-clock>Indonesia</span><a href="#top" class="to-top">${roll('Back to top')} <span class="up" aria-hidden="true">↑</span></a></div>
  </div>
</footer>`;
}

const tail = (js) => `<script>${js}</script>\n</body>\n</html>\n`;

// ---------- home
function home(D, ctx) {
  const P = (k) => D.PROJECTS.find((p) => p.key === k);
  const clientSites = D.PROJECTS.filter((p) => p.url && p.date !== 'previous design');   // (the old Gajah Terbang site shares its address with the redesign)
  const total = D.DISCOVERY_TOTAL;
  const heroPhoto = firstOf('site/hero.webp', 'site/hero.jpg', 'site/hero.jpeg', 'site/hero.png');
  const cvHref = D.SITE.links.find((l) => l.label === 'Résumé')?.href || '#contact';
  const deskShot = exists('site/desk-wide.webp') ? 'site/desk-wide.webp' : 'og.png';
  const maskImg = heroPhoto || deskShot;
  // the opening picture: its preload offers the same sizes as the picture itself (with only the large one named, a phone fetched
  // both), and the giant letters further down take the small copy on a phone too
  const heroRel = heroPhoto || deskShot, heroSizes = heroPhoto ? '(min-width: 900px) 70vw, 100vw' : '(max-width: 900px) 100vw, 70vw';
  const small800 = (rel) => { const s = rel.replace(/[.]webp$/, '-800.webp'); return s !== rel && exists(s) ? s : null; };
  const heroSmall = small800(heroRel), heroDim = imgSize(heroRel), maskSmall = small800(maskImg);
  const heroPreload = `<link rel="preload" as="image" href="/${heroRel}"${heroSmall && heroDim ? ` imagesrcset="/${heroSmall} 800w, /${heroRel} ${heroDim.w}w" imagesizes="${heroSizes}"` : ''} fetchpriority="high">`;

  // ---- selected work: one full-screen panel per project, each sliding over the last
  const featured = FEATURED.map((f, i) => {
    const p = P(f.key); if (!p) return '';
    const m = projectMedia(D, p);
    const small = m.phone ? `<div class="case-small">${img(m.phone, `${p.title} on a phone`, { sizes: '240px' })}</div>` : m.shots[1] ? `<div class="case-small case-small--wide">${img(m.shots[1], `${p.title}: another page`, { sizes: '320px' })}</div>` : '';
    return `<li class="case" style="--bgc:${f.bg};--acc:${f.acc}" data-case="${i}">
      <a class="case-in" href="/work/${p.key}/" data-track="project_open" data-project="${p.key}" data-cursor="View" data-bg="${f.bg}" data-name="${esc(p.title)}">
        <div class="case-top"><span><b>${pad(i + 1)}</b> / Selected work</span><span>${esc(f.kind)}</span></div>
        <div class="case-text">
          <span class="case-meta"><b>${esc(p.title)}</b> · ${f.meta.map(esc).join(' · ')}</span>
          <h3 class="case-title">${esc(p.title)}</h3>
          <p class="case-line">${esc(f.line)}</p>
          ${p.did ? `<ul class="case-did">${p.did.slice(0, 3).map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
          <span class="case-cta">View project ${circleGo}</span>
        </div>
        <div class="case-media"><div class="case-big"${m.shots.length > 1 ? ` data-shots="${esc(JSON.stringify(m.shots.map((s) => '/' + s)))}"` : ''}>${m.cover ? img(m.cover, `${p.title}: screenshot`, { sizes: '(min-width: 1100px) 56vw, 100vw' }) : plate(p)}${m.shots.length > 1 ? `<img class="case-alt" alt="" aria-hidden="true" decoding="async"><img class="case-alt" alt="" aria-hidden="true" decoding="async"><span class="case-bars" aria-hidden="true">${m.shots.map(() => '<i></i>').join('')}</span>` : ''}</div>${small}</div>
        <span class="case-ghost" aria-hidden="true">${pad(i + 1)}</span>
      </a>
    </li>`;
  }).join('');
  const rail = FEATURED.map((f, i) => `<li><button type="button" tabindex="-1" data-go="${i}" data-t="${esc(P(f.key)?.title || '')}" aria-label="${esc(P(f.key)?.title || '')}">${pad(i + 1)}</button></li>`).join('');

  const featuredKeys = new Set(FEATURED.map((f) => f.key));
  const rest = counted(D).filter((p) => !featuredKeys.has(p.key));
  const index = rest.map((p, i) => {
    const m = projectMedia(D, p);
    return `<li style="--i:${i}"><a href="/work/${p.key}/" data-track="project_open" data-project="${p.key}" data-bg="${tint(p).bg}" data-name="${esc(p.title)}"${m.cover ? ` data-preview="/${m.cover}"` : ''}><span class="ix-n">${pad(i + 1)}</span>${m.cover ? `<span class="ix-thumb" aria-hidden="true"><img src="/${m.cover}" alt="" loading="lazy" decoding="async" width="96" height="60"></span>` : '<span class="ix-thumb ix-thumb--none" aria-hidden="true"></span>'}<span class="ix-name">${esc(p.title)}</span><span class="ix-ind">${esc(p.now ? `${p.industry}, now ${p.now.name}` : p.date === 'previous design' ? `${p.industry}, first version` : p.industry)}</span><span class="ix-stack">${esc(p.stack)}</span><span class="ix-go" aria-hidden="true">${arrowR}</span></a></li>`;
  }).join('');
  // three rows of names, the way Ownitt closes its projects: big capitals, a dot between, each row its own direction
  const allNames = counted(D).filter((p) => p.date !== 'previous design').map((p) => p.title);
  const rowNames = (k) => allNames.filter((_, i) => i % 3 === k).map((t) => `<span>${esc(t)}</span>`).join('<i aria-hidden="true">·</i>') + '<i aria-hidden="true">·</i>';
  const bigRows = [0, 1, 2].map((k) => `<div class="mq" data-mq="${k % 2 ? -1 : 1}" data-speed="${38 + k * 8}"><div class="mq-t">${rowNames(k)}</div><div class="mq-t">${rowNames(k)}</div></div>`).join('');

  // ---- the client loop: two rows that run opposite ways, faster when the page moves
  const logo = (c) => {
    if (c.word) return `<a class="logo" href="/work/${c.key}/" tabindex="-1"><span class="logo-word">${esc(c.word[0])} <em>${esc(c.word[1])}</em></span><span class="logo-n">${esc(c.name)}</span></a>`;
    const f = `site/logos/${c.key}.webp`, d = imgSize(f);
    if (!d) return '';
    const a = d.w / d.h, h = Math.min(1.1, Math.max(0.5, 1.05 / Math.sqrt(a)));
    return `<a class="logo" href="/work/${c.key}/" tabindex="-1" style="--w:${(h * a).toFixed(3)};--h:${h.toFixed(3)};--m:url(/${f})"><span class="logo-m"></span><span class="logo-n">${esc(c.name)}</span></a>`;
  };
  const you = '<a class="logo logo--you" href="#contact" tabindex="-1">your logo?</a>';
  const half = Math.ceil(CLIENTS.length / 2);
  const row = (list, dir) => { const t = list.map(logo).join('') + (dir > 0 ? you : ''); return `<div class="mq loop" data-mq="${dir}" data-speed="34" aria-hidden="true"><div class="mq-t">${t}</div><div class="mq-t">${t}</div></div>`; };

  const terr = TERRITORIES.map((t, i) => `<li class="t" style="--i:${i}">
      <div class="t-row"><span class="t-num">${pad(i + 1)}</span><h3 class="t-title">${esc(t.title)}</h3><span class="t-plus" aria-hidden="true"></span></div>
      <div class="t-run" aria-hidden="true"><div class="t-run-t">${Array(4).fill(`<span>${esc(t.title)}</span><i>✦</i>`).join('')}</div><div class="t-run-t">${Array(4).fill(`<span>${esc(t.title)}</span><i>✦</i>`).join('')}</div></div>
      <div class="t-body"><p>${esc(t.body)}</p><div class="t-items">${t.items.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
        <p class="t-proof">${t.proof.length ? `Seen in ${t.proof.map(P).filter(Boolean).map((p) => `<a href="/work/${p.key}/">${esc(p.title)}</a>`).join(', ')}${t.also ? ` and <a href="${esc(t.also.href)}" data-track="3d_cta_click" data-from="territory">${esc(t.also.title)}</a>` : ''}` : 'Experimental, ongoing'}</p></div>
    </li>`).join('');

  const pathRows = PATH.map((r, i) => `<li style="--i:${i}"><span class="pt-dot" aria-hidden="true"></span><span class="pt-when">${esc(r.when)}</span><div><h3 class="pt-role">${esc(r.role)}</h3><span class="pt-org">${esc(r.org)}</span></div><p>${esc(r.body)}</p></li>`).join('');
  const isStack = (s) => (s === 'The stack' ? ' class="is-stack"' : '');
  const diffUsual = DIFF.usual.map((s, i) => `<li${isStack(s)}><span class="n">${pad(i + 1)}</span><span class="diff-step">${esc(s)}</span></li>`).join('');
  const diffMine = DIFF.mine.map((s, i) => `<li${isStack(s.step)}><span class="n">${pad(i + 1)}</span><strong class="diff-step">${esc(s.step)}</strong><span class="diff-body">${esc(s.body)}</span></li>`).join('');
  const how = PROCESS.map((s, i) => `<li style="--i:${i}"><span class="n">${pad(i + 1)}</span><strong>${esc(s.step)}</strong><span>${esc(s.body)}</span></li>`).join('');
  const stack = STACK.map((s, i) => `<div class="st-col" style="--i:${i}"><span class="lbl">${esc(s.layer)}</span><ul>${s.items.map((t) => `<li>${toolMark(t)}<span>${esc(t)}</span></li>`).join('')}</ul></div>`).join('');
  const contactLinks = D.SITE.links.filter((l) => l.label !== 'WhatsApp').map((l, i) => `<a href="${esc(l.href)}" target="_blank" rel="noopener" data-track="contact_click" data-channel="${esc(l.label)}" style="--i:${i}"><span>${esc(l.label === 'Résumé' ? 'Résumé (PDF)' : l.label)}</span>${arrow}</a>`).join('');
  // (each opens the desk where it was taken: the keyboard from above, GodPlan's world through its deep link)
  // the desk as a turntable (public/site/turn, rendered from the engine by a headless pass): the teaser scrubs it with the scroll
  const countFrames = (pre) => { let n = 0; while (exists(`site/turn/${pre}${n}.webp`)) n++; return n; };
  const turnN = countFrames('desk-');
  const deskSmall = [['site/desk-keys.webp', 'The keyboard, every key a chapter', 'The 3D keyboard: small districts built into the keys, each labelled with a project or a chapter', '/3d/'], ['site/desk-world.webp', "Inside GodPlan ERP's world", 'GodPlan ERP as a miniature office floor: employees, payroll, CRM, attendance gates and the core', '/3d/#project-godplan-erp']].filter(([f]) => exists(f));
  const posters = ['godplan-erp', 'godjah-studio', 'winfaith', 'flora-indonesia', 'fls-group-indonesia', 'dams-garage'].filter((k) => exists(`site/intro/${k}.webp`));

  const ld = {
    '@context': 'https://schema.org', '@type': 'Person', name: 'Navy Gibran', url: `${ORIGIN}/`, image: `${ORIGIN}/${heroPhoto || (exists('site/portrait.webp') ? 'site/portrait.webp' : 'og.png')}`, jobTitle: 'Full-stack developer',
    description: 'Full-stack developer: ERP systems in Go and Next.js, and websites for Indonesian businesses on WordPress, WooCommerce and custom builds.',
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Universitas Multimedia Nusantara' },
    worksFor: { '@type': 'Organization', name: 'PT. Gajah Terbang Kreatif' },
    address: { '@type': 'PostalAddress', addressCountry: 'ID' },
    knowsAbout: ['Go', 'Next.js', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'MySQL', 'Docker', 'Tailwind CSS', 'WordPress', 'WooCommerce', 'PHP', 'Solidity'],
    sameAs: D.SITE.links.filter((l) => /linkedin|github|x\.com/.test(l.href)).map((l) => l.href),
  };

  return head({
    title: 'Navy Gibran | Full-stack developer',
    description: `Navy Gibran, full-stack developer from Indonesia: ERP systems in Go and Next.js, and websites for ${clientSites.length} businesses. GodPlan ERP, JAKASN and more.`,
    url: `${ORIGIN}/`, css: ctx.css, intro: true, imageAlt: 'Navy Gibran\'s desk, the 3D version of this portfolio',
    extra: `${heroPreload}\n<script type="application/ld+json">${JSON.stringify(ld)}</script>\n`,
  }) + `
<body class="home">
<div class="intro" id="intro" aria-hidden="true">
  <div class="intro-posters">${posters.map((k, i) => `<figure style="--i:${i}"><img src="/site/intro/${k}.webp" alt="" width="240" height="320">${MARK()}</figure>`).join('')}</div>
  <div class="intro-in">${MARK('intro-mark')}<div class="intro-word"><div class="iw-o"><span>Navy</span><span>Gibran</span></div><div class="iw-f"><span>Navy</span><span>Gibran</span></div></div><div class="intro-sub">Full-stack developer</div></div>
  <span class="intro-foot lbl">( Indonesia · ${esc(D.SITE.year)} )</span>
  <button class="intro-skip" type="button" tabindex="-1">Skip</button>
  <span class="intro-count">00</span>
</div>
${header('home')}
<main id="main" tabindex="-1">
  <section class="hero" aria-label="Introduction" data-scene="hero">
    <div class="hero-media">${heroPhoto ? img(heroPhoto, 'Portrait of Navy Gibran', { eager: true, sizes: heroSizes }) : img(deskShot, 'Navy Gibran\'s desk at night', { eager: true, cls: 'hero-desk', sizes: heroSizes })}</div>
    ${!heroPhoto && exists('site/portrait.webp') ? `<figure class="hero-portrait" data-cursor="Hello">${img('site/portrait.webp', 'Navy Gibran', { sizes: '(min-width: 900px) 19vw, 34vw' })}</figure>` : ''}
    <div class="hero-in wrap">
      <p class="hero-who">${kick('Navy Gibran · full-stack developer')}</p>
      <p class="hero-title cap">${splitPair('Every business already runs on a system. Most of it still lives in', "someone's head.")}</p>
      <div class="hero-proof">
        <ul class="hero-facts" aria-label="At a glance">${[`${clientSites.length} live client sites`, 'Built GodPlan ERP', 'Go · Next.js · WordPress'].map((x, k) => `<li style="--i:${k}">${esc(x)}</li>`).join('')}</ul>
        <div class="hero-cta">
          <a class="btn btn-fill" href="#work" data-magnet>${roll('See the work')} ${arrowR}</a>
          <a class="btn" href="${esc(wa(D.SITE.whatsapp, "Hi Navy! I saw your portfolio and I'd like to talk about a project."))}" target="_blank" rel="noopener" data-track="contact_click" data-channel="WhatsApp" data-from="hero" data-magnet>${roll('Chat on WhatsApp')} ${arrow}</a>
          <a class="btn btn-ghost" href="${esc(cvHref)}" target="_blank" rel="noopener" data-track="contact_click" data-channel="Résumé" data-from="hero">${roll('Download CV')} ${arrow}</a>
        </div>
        <span class="hero-status lbl"><span class="dot dot--open" aria-hidden="true"></span>${esc(D.SITE.status)} · ${esc(D.SITE.where)}</span>
      </div>
    </div>
    <div class="hero-rot"><span class="lbl">Navy builds</span><span class="rot" aria-hidden="true"><span class="rot-t">${[...ROTATE, ROTATE[0]].map((r) => `<span>${esc(r)}</span>`).join('')}</span></span><span class="sr">Navy builds ERP systems, company websites, online stores, custom builds and smart contracts, and this portfolio as a 3D desk.</span></div>
    <span class="hero-corner hero-corner--l lbl"><span class="dot dot--open" aria-hidden="true"></span>${esc(D.SITE.status)} · ${esc(D.SITE.where)}</span>
    <a class="hero-corner hero-corner--r lbl" href="#work">Selected work <i aria-hidden="true"></i></a>
  </section>

  <section class="who wrap" id="who" aria-labelledby="who-h" data-sec="About">
    <div data-reveal>${kick('In short')}</div>
    <p class="who-p" data-split data-read>${splitPair("I'm Navy Gibran. Most of my work starts the same way: a business that already knows how it runs, held together by spreadsheets, group chats and good memory. I turn that into software it can lean on, ERP systems in Go and Next.js, and websites for businesses across Indonesia. The code is rarely the hard part.", 'Understanding the business is.')}</p>
    <h1 class="who-h" id="who-h" data-reveal><span class="lbl">Navy Gibran · full-stack developer, Indonesia.</span> <em>Make it work. Make them want it.</em></h1>
  </section>

  <section class="work" id="work" aria-label="Selected work" data-scene="work" data-sec="Selected work" data-hide-tab>
    <ol class="cases">${featured}</ol>
    <ol class="rail" aria-hidden="true">${rail}</ol>
  </section>

  <section class="rest" aria-labelledby="rest-h" data-sec="The rest">
    <div class="rest-head wrap">
      <div data-reveal>${kick('The rest')}</div>
      <h2 class="serif-h" id="rest-h" data-split>${splitPair('The rest of', 'the street.')}</h2>
    </div>
    <div class="bigq" aria-hidden="true">${MARK('bigq-mark')}${bigRows}</div>
    <div class="wrap">
      <p class="rest-note" data-reveal>Every other project, each with its own page. On the desk they are the shops along the keyboard.</p>
      <ul class="index-list" data-stagger>${index}</ul>
      <a class="btn arc-more" href="/work/" data-magnet data-reveal>${roll('Browse the archive')} ${arrowR}</a>
    </div>
    <div class="ix-preview" aria-hidden="true"><img alt=""></div>
  </section>

  <div class="cream" data-scene="cream">
    <section class="clients" id="clients" aria-labelledby="clients-h" data-sec="Clients">
      <div class="clients-head wrap">
        <div data-reveal>${kick('Clients')}</div>
        <h2 class="serif-h" id="clients-h" data-split>${splitPair('They trusted me', 'with their name.')}</h2>
        <p data-reveal><span data-count="${clientSites.length}">${clientSites.length}</span> businesses in more than ten industries, from car care and florists to server racks and flavour houses. <a class="clients-all" href="/work/client-websites/" data-track="project_open" data-project="client-websites" data-from="clients">All ${clientSites.length} sites, one by one ${arrowR}</a></p>
      </div>
      ${row(CLIENTS.slice(0, half), 1)}
      ${row(CLIENTS.slice(half), -1)}
      <ul class="sr">${CLIENTS.map((c) => `<li>${esc(c.name)}</li>`).join('')}</ul>
    </section>

    <section class="diff wrap" id="difference" aria-labelledby="diff-h" data-sec="The difference">
      <div class="diff-head">
        <div data-reveal>${kick('The difference')}</div>
        <h2 class="serif-h" id="diff-h" data-split>${splitPair('I read the business', 'before I write the code.')}</h2>
        <p data-reveal>Most software is built around its tools, and the people who use it end up working around it. I begin one step earlier, with how the business actually runs: from the first order to the month-end report.</p>
      </div>
      <div class="diff-cmp">
        <div class="diff-col diff-col--usual">
          <span class="lbl" data-reveal>Where projects usually start</span>
          <ol data-stagger>${diffUsual}</ol>
          <p class="diff-end" data-reveal>${esc(DIFF.usualEnd)}</p>
        </div>
        <div class="diff-col diff-col--mine">
          <span class="lbl" data-reveal>Where I start</span>
          <ol data-stagger>${diffMine}</ol>
          <p class="diff-end" data-reveal><em>${esc(DIFF.mineEnd[0])}</em> ${esc(DIFF.mineEnd[1])}</p>
        </div>
      </div>
    </section>
  </div>

  <section class="terr wrap" id="territories" aria-labelledby="terr-h" data-sec="What I build">
    <div class="terr-head">
      <div data-reveal>${kick('The method')}</div>
      <h2 class="serif-h" id="terr-h" data-split>${splitPair(`${(NUM[TERRITORIES.length] || String(TERRITORIES.length)).replace(/^./, (c) => c.toUpperCase())} territories,`, 'one developer.')}</h2>
      <p data-reveal><span class="if-hover">Point at one to see it run. </span>What I bring, and where you can see it, sits right underneath.</p>
    </div>
    <ol class="terr-list" data-stagger>${terr}</ol>
  </section>

  <div class="cream cream--path cream--under" data-scene="cream">
  <section class="path wrap" id="path" aria-labelledby="path-h" data-scene="path" data-sec="The path">
    <div class="path-grid">
      <div class="path-side">
        <div data-reveal>${kick('The path so far')}</div>
        <h2 class="serif-h" id="path-h" data-split>${splitPair('From the stairs', 'to the system.')}</h2>
        <p data-reveal>${esc(D.SITE.facts.join(' · '))}. Indonesian and English, Mandarin passive.</p>
      </div>
      <ol class="path-list" data-stagger><span class="path-line" aria-hidden="true"><i></i></span>${pathRows}</ol>
    </div>
    <ol class="how" data-stagger data-sec="Process">${how}</ol>
    <div class="stack" data-sec="Toolbox">
      <div class="stack-head"><h2 class="serif-h" data-split>${splitPair('The', 'toolbox.')}</h2><div data-reveal>${kick('Stack')}</div></div>
      <div class="stack-grid" data-stagger>${stack}</div>
    </div>
  </section>
  </div>

  <section class="teaser" id="desk" aria-labelledby="desk-h" data-teaser data-scene="teaser" data-hide-tab data-sec="The 3D desk">
    <div class="teaser-pin">
      <div class="teaser-frame">${img(deskShot, 'The 3D desk at night: three monitors, a mechanical keyboard with a small town built into its keys, a lamp and a glass-sided PC', { cls: 'teaser-img', sizes: '100vw' })}${exists('site/desk-loop.mp4') ? `<video class="teaser-video" muted loop playsinline preload="none"aria-hidden="true" tabindex="-1" data-webm="${exists('site/desk-loop.webm') ? '/site/desk-loop.webm' : ''}" data-mp4="/site/desk-loop.mp4"></video>` : ''}${turnN > 1 ? `<canvas class="teaser-turn" width="1280" height="720" data-n="${turnN}" aria-hidden="true"></canvas>` : ''}</div>
      <div class="teaser-corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <p class="teaser-top" aria-hidden="true"><span class="cap">This is</span> <em>the desk.</em></p>
      <div class="teaser-in wrap">
        ${kick('The other way in')}
        <h2 id="desk-h" class="teaser-title cap">${splitPair("There's a desk", 'behind this page.')}</h2>
        <p class="teaser-body">The same portfolio, built as a room at night. A keyboard with a small town set into its keys, <span data-count="${D.WORLDS.length}">${D.WORLDS.length}</span> miniature worlds to step into, a cat asleep on the chair, and <span data-count="${total}">${total}</span> things hidden around the desk. Some are obvious. Some are not.</p>
        <div class="teaser-row">
          <a class="btn btn-fill btn-lg" href="/3d/" data-track="3d_cta_click" data-from="teaser" data-magnet>${roll('Enter the 3D desk')} ${arrow}</a>
          <span class="teaser-note">WebGL · sound optional · best with a mouse<span class="if-hover"> · or just type <kbd>d</kbd><kbd>e</kbd><kbd>s</kbd><kbd>k</kbd></span></span>
        </div>
        ${deskSmall.length ? `<div class="teaser-thumbs">${deskSmall.map(([f, cap, alt, href], i) => `<a href="${href}" data-track="3d_cta_click" data-from="teaser-thumb" data-cursor="Enter" style="--i:${i}"><figure>${img(f, alt, { sizes: '(min-width: 900px) 22vw, 45vw' })}<figcaption>${esc(cap.replace(/\s+\S+$/, ''))} <span class="nw">${esc(cap.split(' ').pop())} ${arrow}</span></figcaption></figure></a>`).join('')}</div>` : ''}
      </div>
    </div>
  </section>

  <section class="contact wrap" id="contact" aria-labelledby="contact-h" data-scene="contact" data-hide-tab data-sec="Contact">
    <div data-reveal>${kick('Contact')}</div>
    <h2 id="contact-h" class="contact-title cap" data-split>${splitPair('Your', 'turn.')}</h2>
    <div class="contact-grid">
      <div class="contact-left">
        <p data-reveal>Tell me the shape of what you need and you get a written scope back before anything starts. A sentence or two is enough to begin; WhatsApp is the fastest way to reach me. Bahasa Indonesia or English, whichever you prefer.</p>
        <form class="brief" action="https://wa.me/${D.SITE.whatsapp}" method="get" target="_blank" data-reveal>
          <fieldset class="brief-kind">
            <legend class="lbl">What are we building?</legend>
            ${['An ERP or internal system', 'A company website', 'An online store', 'A custom build', 'Something else'].map((k) => `<label class="pill"><input type="radio" name="kind" value="${esc(k)}"><span>${esc(k.replace(/^(An?|A) (.)/, (m, a, c) => c.toUpperCase()))}</span></label>`).join('')}
          </fieldset>
          <label class="field"><span class="lbl">Your name</span><input name="name" required autocomplete="name" placeholder="Name"><span class="field-msg" id="brief-name-msg" aria-hidden="true">A name first, so I know who I'm talking to.</span></label>
          <label class="field"><span class="lbl">The idea, in a sentence or two</span><textarea name="text" rows="3" required placeholder="What it should do, and for whom"></textarea><span class="field-msg" id="brief-text-msg" aria-hidden="true">One sentence is enough to start.</span></label>
          <div class="brief-pv" aria-hidden="true"><span class="lbl">WhatsApp opens with</span><p class="brief-msg"></p></div>
          <button class="btn btn-fill" type="submit" data-magnet>${roll('Send on WhatsApp')} ${arrow}</button>
        </form>
      </div>
      <div class="contact-actions">
        <span class="lbl contact-status" data-reveal><span class="dot dot--open" aria-hidden="true"></span>${esc(D.SITE.status)} · ${esc(D.SITE.where)}</span>
        <span class="lbl contact-or" data-reveal>Or straight to the point</span>
        <a class="btn btn-fill btn-lg" href="${esc(wa(D.SITE.whatsapp, "Hi Navy! I saw your portfolio and I'd like to talk about a project."))}" target="_blank" rel="noopener" data-track="contact_click" data-channel="WhatsApp" data-magnet data-reveal>${exists('site/avatar.webp') ? '<img class="btn-av" src="/site/avatar.webp" alt="" width="40" height="40" decoding="async">' : ''}${roll('Chat on WhatsApp')} ${arrow}</a>
        <button class="copy" type="button" data-copy="+${D.SITE.whatsapp}" data-reveal><span class="copy-n">${esc(phone(D.SITE.whatsapp))}</span><span class="copy-a">${roll('Copy number')}</span></button>
        ${D.SITE.email ? `<button class="copy copy--mail" type="button" data-copy="${esc(D.SITE.email)}" data-reveal><span class="copy-n">${esc(D.SITE.email)}</span><span class="copy-a">${roll('Copy email')}</span></button>` : ''}
        <div class="contact-links" data-stagger>${contactLinks}</div>
      </div>
    </div>
  </section>
</main>
${footer(D)}
` + tail(ctx.js);
}

// ---------- one project
function projectPage(D, ctx, p, i) {
  const list = D.PROJECTS;
  // the arrows and "next project" walk the twenty projects (both Gajah Terbang sites among them; the hub only from itself)
  const browse = list.filter((x) => !isHub(x) || x.key === p.key), bi = browse.indexOf(p);
  const next = browse[(bi + 1) % browse.length], prev = browse[(bi - 1 + browse.length) % browse.length];
  const m = projectMedia(D, p);
  const world = D.WORLDS.find((w) => w.project === p.key);
  const f = FEATURED.find((x) => x.key === p.key);
  const redesign = p.date === 'previous design' ? list.find((x) => x.url === p.url && x.key !== p.key) : null;
  // (the first of a company's two sites: `redesign` is the second; on the second, `first` is the first)
  const first = !redesign && p.url ? list.find((x) => x.date === 'previous design' && x.url === p.url && x.key !== p.key) : null;
  const toPage = (x, label) => `<a href="/work/${x.key}/" data-track="project_open" data-project="${x.key}" data-bg="${tint(x).bg}" data-name="${esc(x.title)}">${label}</a>`;
  const live = redesign ? `<a class="btn btn-fill" href="/work/${redesign.key}/" data-track="project_open" data-project="${redesign.key}" data-bg="${tint(redesign).bg}" data-name="${esc(redesign.title)}" data-magnet>${roll(`See the upgrade, ${redesign.title}`)} ${arrowR}</a>` : p.url && !p.now ? `<a class="btn btn-fill" href="${esc(p.url)}" target="_blank" rel="noopener" data-track="project_live" data-project="${p.key}" data-magnet>${roll(`Visit ${host(p.url)}`)} ${arrow}</a>` : '';
  const firstBtn = first ? `<a class="btn" href="/work/${first.key}/" data-track="project_open" data-project="${first.key}" data-bg="${tint(first).bg}" data-name="${esc(first.title)}" data-magnet>${roll('See the first version')} ${arrowR}</a>` : '';
  const similar = `<a class="btn btn-ghost" href="${esc(wa(D.SITE.whatsapp, `Hi Navy! I saw ${p.title} in your portfolio and I'd like to build something similar. Can we talk?`))}" target="_blank" rel="noopener" data-track="contact_click" data-channel="WhatsApp" data-project="${p.key}" data-magnet>${roll('Build something like this')} ${arrow}</a>`;
  const status = p.now ? `Now ${p.now.name}` : p.date === 'live' ? (p.year ? `Live, built ${p.year}` : 'Live') : p.date === 'previous design' ? 'First version, since upgraded' : p.date.charAt(0).toUpperCase() + p.date.slice(1);
  const tag = world ? world.tagline : p.industry;
  // a business that has moved on under another name: said in words, with a link to where it is today (no picture)
  const now = p.now ? `<aside class="p-now" data-reveal>${kick('Today')}<p>${esc(p.title)} is now <a href="${esc(p.now.url)}" target="_blank" rel="noopener">${esc(p.now.name)} ${arrow}</a>, an app for finding, hosting and joining parties across Indonesia.</p></aside>` : '';
  // one company, two sites, both Navy's: each of the two pages says so and points at the other, so nobody wonders why a name repeats
  const pair = redesign ? `<aside class="p-now" data-reveal>${kick('One company, two sites')}<p>This is the first site I built for ${esc(p.title)}, on WordPress. The company later asked for an upgrade with 3D and interactive design, and that became ${toPage(redesign, `${esc(redesign.title)} ${arrowR}`)}: rebuilt from scratch in Next.js, at the same address. Both are my work.</p></aside>`
    : first ? `<aside class="p-now" data-reveal>${kick('One company, two sites')}<p>${esc(first.title)} appears twice in this portfolio because I built both of its sites. The first was ${toPage(first, `a WordPress site ${arrowR}`)}; the company then asked for an upgrade with 3D and interactive design, and this is it: rebuilt from scratch in Next.js, at the same address.</p></aside>` : '';
  // what Navy did on it, in short lines (data.js `did`), with his role and, for GodPlan, the modules of the system
  const did = p.did ? `<section class="did wrap" aria-labelledby="did-h">
      <div class="did-grid">
        <div class="did-side"><div data-reveal>${kick('What I did')}</div><h2 class="serif-h" id="did-h" data-split>${splitPair('The work,', 'in short.')}</h2>${p.role ? `<p class="did-role" data-reveal><span class="lbl">Role</span>${esc(p.role)}</p>` : ''}</div>
        <ol class="did-list" data-stagger>${p.did.map((d, k) => `<li style="--i:${k}"><span class="n">${pad(k + 1)}</span><p>${esc(d)}</p></li>`).join('')}</ol>
      </div>
      ${p.modules ? `<div class="did-mods" data-reveal><span class="lbl">Modules</span><ul>${p.modules.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    </section>` : '';
  const inside = world ? `<section class="inside wrap" aria-labelledby="inside-h">
      <div class="inside-head"><div data-reveal>${kick('Inside the project')}</div><h2 class="serif-h" id="inside-h" data-split>${split(world.tagline.charAt(0).toUpperCase() + world.tagline.slice(1) + '.')}</h2></div>
      <ol class="notes" data-stagger>${Object.values(world.hotspots).map((h, k) => `<li style="--i:${k}"><span class="n">${pad(k + 1)}</span><h3>${esc(h.title)}</h3><p>${esc(h.body.replace(/\bthis (floor|street)\b/g, 'its 3D $1'))}</p></li>`).join('')}</ol>
    </section>` : '';
  const sitesList = list.filter((x) => x.url && x.date !== 'previous design');
  const sites = p.key === 'client-websites' ? `<section class="wrap sites-all" aria-labelledby="sites-h"><div class="inside-head"><div data-reveal>${kick(`All ${sitesList.length}`)}</div><h2 class="serif-h" id="sites-h" data-split>${splitPair('Every site,', 'one by one.')}</h2></div>
      <ul class="index-list" data-stagger>${sitesList.map((x, k) => `<li style="--i:${k}"><a href="/work/${x.key}/" data-track="project_open" data-project="${x.key}" data-bg="${tint(x).bg}" data-name="${esc(x.title)}"><span class="ix-n">${pad(k + 1)}</span>${(() => { const c = projectMedia(D, x).cover; return c ? `<span class="ix-thumb" aria-hidden="true"><img src="/${c}" alt="" loading="lazy" decoding="async" width="96" height="60"></span>` : '<span class="ix-thumb ix-thumb--none" aria-hidden="true"></span>'; })()}<span class="ix-name">${esc(x.title)}</span><span class="ix-ind">${esc(x.industry)}</span><span class="ix-stack">${esc(x.stack)}</span><span class="ix-go" aria-hidden="true">${arrowR}</span></a></li>`).join('')}</ul></section>` : '';
  const gallery = m.shots.length > 1 ? `<section class="gallery wrap" aria-label="Screenshots">
      ${m.shots.slice(1).map((s, k) => `<figure class="shot g-${k % 3}" data-reveal="clip">${img(s, `${p.title}: screenshot ${k + 2}`, { sizes: k % 3 ? '(min-width: 900px) 62vw, 100vw' : '(min-width: 1100px) 1300px, 100vw' })}</figure>`).join('')}
    </section>` : '';
  const desc = strip(p.description);
  // (a project that is now something else says so in its "Today" note: the opening paragraph leaves that sentence to it)
  const lead = p.now ? desc.split(/(?<=\.)\s+/).filter((x) => !x.startsWith(`${p.title} is now`)).join(' ') : desc;
  const toks = (x) => new Set(x.stack.toLowerCase().split(' · ').concat(x.industry.toLowerCase().split(/[\s&,]+/).filter((w) => w.length > 3)));
  const kind = kindOf;
  const mine = toks(p), myKind = kind(p);
  const related = list.filter((x) => x.key !== p.key && x.key !== next.key && x.key !== 'client-websites' && x.date !== 'previous design')
    .map((x, k) => ({ x, k, score: (kind(x) === myKind ? 3 : 0) + [...toks(x)].filter((w) => mine.has(w)).length }))
    .sort((a, b) => b.score - a.score || a.k - b.k).slice(0, 3).map((r) => r.x);
  const more = related.length ? `<section class="more wrap" aria-labelledby="more-h">
      <div class="more-head" data-reveal>${kick('More like this')}<h2 class="sr" id="more-h">More like this</h2></div>
      <ul class="more-list" data-stagger>${related.map((x, k) => moreCard(D, x, k, 'related')).join('')}</ul>
    </section>` : '';

  const ld = { '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.title, description: desc, url: `${ORIGIN}/work/${p.key}/`, creator: { '@type': 'Person', name: 'Navy Gibran', url: `${ORIGIN}/` }, keywords: p.stack.split(' · ').join(', '), ...(p.url && !p.now ? { sameAs: p.url } : {}), ...(m.cover ? { image: `${ORIGIN}/${m.cover}` } : {}) };
  // where the page sits, for search results: the portfolio, then this project
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Navy Gibran', item: `${ORIGIN}/` },
    { '@type': 'ListItem', position: 2, name: p.title, item: `${ORIGIN}/work/${p.key}/` },
  ] };
  return head({
    title: `${p.title} | Navy Gibran`,
    description: desc.length > 158 ? desc.slice(0, 155).replace(/\s+\S*$/, '') + '...' : desc,
    url: `${ORIGIN}/work/${p.key}/`, css: ctx.css,
    image: exists(`site/og/${p.key}.jpg`) ? `${ORIGIN}/site/og/${p.key}.jpg` : undefined, imageAlt: `${p.title}, a project by Navy Gibran`, theme: tint(p).bg,
    extra: `<script type="application/ld+json">${JSON.stringify(ld)}</script>\n<script type="application/ld+json">${JSON.stringify(crumbs)}</script>\n`,
  }) + `
<body class="project" data-project="${p.key}" data-prev="/work/${prev.key}/" data-prev-bg="${tint(prev).bg}" data-prev-name="${esc(prev.title)}" data-next="/work/${next.key}/" data-next-bg="${tint(next).bg}" data-next-name="${esc(next.title)}" style="--acc:${tint(p).acc};--bgc:${tint(p).bg}">
${header('work')}
<main id="main" tabindex="-1">
  <article>
    <div class="p-top">
    <header class="p-head wrap" data-scene="phead">
      <div class="p-crumbs" data-reveal><a href="/work/">← All work</a><span class="p-count">${isHub(p) ? 'Every client site' : `<span class="pc-w">Project </span>${pad(bi + 1)} / ${pad(browse.length)}`}<span class="keys">${[[prev, '←', 'Previous'], [next, '→', 'Next']].map(([q, k, w]) => `<a href="/work/${q.key}/" aria-label="${w} project: ${esc(q.title)}" data-track="project_open" data-project="${q.key}" data-from="step" data-bg="${tint(q).bg}" data-name="${esc(q.title)}"><kbd>${k}</kbd></a>`).join('')}<i aria-hidden="true">to browse</i></span></span></div>
      <span class="p-kick" data-reveal>${kick(tag)}</span>
      <h1 class="p-title cap" data-split>${split(p.title)}</h1>
      <div class="p-grid">
        <p class="p-lead" data-reveal>${esc(lead)}</p>
        <dl class="p-meta" data-stagger>
          <div style="--i:0"><dt>Industry</dt><dd>${esc(p.industry)}</dd></div>
          <div style="--i:1"><dt>Stack</dt><dd>${esc(p.stack)}</dd></div>
          ${p.role ? `<div style="--i:2"><dt>Role</dt><dd>${esc(p.role)}</dd></div>` : ''}
          <div style="--i:2"><dt>${p.date === 'live' ? 'Status' : 'When'}</dt><dd>${esc(status)}</dd></div>
          ${p.url ? `<div style="--i:3"><dt>Address</dt><dd>${p.now ? `${esc(host(p.url))} <span class="was">(former address)</span>` : redesign ? `${esc(host(p.url))} <span class="was">(now serves the upgrade)</span>` : `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(host(p.url))}</a>`}</dd></div>` : ''}
        </dl>
      </div>
      <div class="p-actions" data-reveal>${live}${firstBtn}${similar}</div>
      ${now}${pair}
    </header>
    <div class="p-hero wrap" data-scene="phero">
      ${m.cover ? `<figure class="shot shot-main" data-reveal="clip">${img(m.cover, `${p.title}: screenshot`, { eager: true, sizes: '(min-width: 1100px) 1100px, 100vw' })}${m.phone ? `<div class="phone">${img(m.phone, `${p.title} on a phone`, { eager: true, sizes: '240px' })}</div>` : ''}</figure>` : `<div class="shot shot-main" data-reveal="clip">${plate(p, true)}</div>`}
    </div>
    </div>
    ${did}
    ${inside}
    ${sites}
    ${gallery}
  </article>
  ${more}
  <nav class="p-next wrap" aria-label="Next project" data-scene="pnext">
    <a href="/work/${next.key}/" data-track="project_open" data-project="${next.key}" data-cursor="Next" data-bg="${tint(next).bg}" data-name="${esc(next.title)}" style="--nbg:${tint(next).bg}"${projectMedia(D, next).cover ? ` data-preview="/${projectMedia(D, next).cover}"` : ''}><span class="lbl">Next project</span><span class="p-next-t">${esc(next.title)} ${arrowR}</span><span class="ind">${esc(next.industry)}</span></a>
  </nav>
  <div class="ix-preview" aria-hidden="true"><img alt=""></div>
</main>
${footer(D)}
` + tail(ctx.js);
}

// ---------- the archive: /work/, every project as a card, filtered by the kind of work
function archivePage(D, ctx) {
  const list = counted(D);
  const counts = Object.fromEntries(KINDS.map(([k]) => [k, list.filter((p) => kindOf(p) === k).length]));
  const pills = [['all', 'All', list.length], ...KINDS.map(([k, label]) => [k, label, counts[k]])]
    .map(([k, label, n]) => `<button type="button" class="pill-f" data-kind="${k}" aria-pressed="${k === 'all'}"><span>${esc(label)}</span><span class="c">${n}</span></button>`).join('');
  const cards = list.map((p, i) => {
    const m = projectMedia(D, p);
    const ind = p.now ? `${p.industry}, now ${p.now.name}` : p.date === 'previous design' ? `${p.industry}, first version` : p.industry;
    return `<li class="arc-card" data-kind="${kindOf(p)}" style="--i:${i % 9}"><a href="/work/${p.key}/" data-track="project_open" data-project="${p.key}" data-from="archive" data-bg="${tint(p).bg}" data-name="${esc(p.title)}" data-cursor="View">
      <span class="arc-pic">${m.cover ? img(m.cover, `${p.title}: screenshot`, { sizes: '(min-width: 1100px) 31vw, (min-width: 560px) 46vw, 92vw' }) : plate(p)}</span>
      <span class="arc-n">${pad(i + 1)}</span><span class="arc-t">${esc(p.title)}</span><span class="arc-i">${esc(ind)}</span><span class="arc-s">${esc(p.stack)}</span>
    </a></li>`;
  }).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Work | Navy Gibran', url: `${ORIGIN}/work/`, hasPart: list.map((p) => ({ '@type': 'CreativeWork', name: p.title, url: `${ORIGIN}/work/${p.key}/` })) };
  return head({
    title: 'Work | Navy Gibran',
    description: `All ${list.length} projects by Navy Gibran: ERP systems and platforms, custom builds, online stores and company websites for businesses in Indonesia.`,
    url: `${ORIGIN}/work/`, css: ctx.css,
    image: exists('site/og/work.jpg') ? `${ORIGIN}/site/og/work.jpg` : undefined, imageAlt: 'All the work: the projects of Navy Gibran',
    extra: `<script type="application/ld+json">${JSON.stringify(ld)}</script>\n`,
  }) + `
<body class="archive">
${header('work')}
<main id="main" tabindex="-1">
  <section class="arc wrap" aria-labelledby="arc-h">
    <div class="p-crumbs" data-reveal><a href="/">← Home</a><span>${list.length} projects</span></div>
    <span class="p-kick" data-reveal>${kick('Archive')}</span>
    <h1 class="p-title cap" id="arc-h" data-split>${splitPair('All the', 'work.')}</h1>
    <p class="p-lead arc-lead" data-reveal>${list.length} projects, each with its own page. Pick a kind of work, or take them all.</p>
    <div class="arc-filters" role="group" aria-label="Show projects by kind" data-reveal>${pills}<button type="button" class="pill-q" data-palette aria-label="Search the projects"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><span>Search</span><kbd data-kbd>Ctrl K</kbd></button></div>
    <p class="sr" role="status" id="arc-status"></p>
    <ol class="arc-grid" data-stagger>${cards}</ol>
    <div class="arc-dock" role="group" aria-label="Show projects by kind" hidden><div class="arc-dock-t">${pills}</div></div>
  </section>
</main>
${footer(D)}
` + tail(ctx.js);
}

function notFound(D, ctx) {
  return head({ title: 'Not found | Navy Gibran', description: 'This page does not exist.', url: `${ORIGIN}/404`, css: ctx.css }).replace('index, follow, max-image-preview:large', 'noindex') + `
<body class="nf">
${header('')}
<main id="main" class="wrap nf-in" tabindex="-1">
  ${kick('404')}
  <h1 class="p-title cap" data-split>${splitPair('Nothing', 'here.')}</h1>
  <p class="p-lead" data-reveal>The page you asked for does not exist. Maybe it is hidden somewhere on the desk.</p>
  <div class="p-actions" data-reveal><a class="btn btn-fill" href="/" data-magnet>${roll('Back to the portfolio')} ${arrowR}</a><a class="btn" href="/3d/" data-magnet>${roll('Search the 3D desk')} ${arrow}</a></div>
  <section class="more nf-more" aria-labelledby="nf-more-h">
    <div class="more-head" data-reveal>${kick('Or start here')}<h2 class="sr" id="nf-more-h">Or start here</h2></div>
    <ul class="more-list" data-stagger>${['godplan-erp', 'winfaith', 'flora-indonesia'].map((k) => D.PROJECTS.find((x) => x.key === k)).filter(Boolean).map((x, k) => moreCard(D, x, k, 'notfound')).join('')}</ul>
  </section>
</main>
${footer(D)}
` + tail(ctx.js);
}

// the reduced-motion block, again under html.motion-off (the footer's switch), so a visitor can ask for it on any system
function motionOffRules(css) {
  const at = css.indexOf('@media (prefers-reduced-motion: reduce), print {\n  *, *::before');
  if (at < 0) return '';
  let i = css.indexOf('{', at) + 1, depth = 1;
  const start = i;
  while (i < css.length && depth) { if (css[i] === '{') depth++; else if (css[i] === '}') depth--; i++; }
  const body = css.slice(start, i - 1);
  const pre = (sel) => sel.trim().split(',').map((x) => { x = x.trim(); return x.startsWith('.js ') ? `.motion-off.js ${x.slice(4)}` : `.motion-off ${x}`; }).join(', ');
  return '\n/* the footer switch: the same rules as prefers-reduced-motion */\n' + body.split('\n').map((line) => {
    const m = line.match(/^\s*([^{}/][^{]*)\{(.*)\}\s*$/);
    return m ? `${pre(m[1])} {${m[2]}}` : '';
  }).filter(Boolean).join('\n') + '\n';
}

// ---------- typesetting: in the words a page shows (never inside a tag, a script or a style), apostrophes and quotation marks
// become the typographic ones (someone’s, kids’, “a title”), and PT. is held to the name after it
function typeset(html) {
  let skip = null;
  return html.split(/(<[^>]+>)/).map((part) => {
    if (part.startsWith('<')) {
      const m = /^<(\/?)(script|style|textarea)\b/i.exec(part);
      if (m) skip = m[1] ? null : m[2].toLowerCase();
      return part;
    }
    if (skip || !/'|&#39;|"|&quot;|PT\. /.test(part)) return part;
    return part
      .replace(/\bPT\. /g, 'PT.\u00a0')   // (a company's PT. stays on the line with its name)
      .replace(/(\w)(?:'|&#39;)(\w)/g, '$1’$2')
      .replace(/(s)(?:'|&#39;)(?=[\s,.;:!?)]|$)/g, '$1’')
      .replace(/(^|[\s(])(?:"|&quot;)/g, '$1“')
      .replace(/(?:"|&quot;)/g, '”');
  }).join('');
}

// ---------- everything: { 'index.html': html, 'work/<key>/index.html': html, '404.html', 'sitemap.xml', 'robots.txt' }
export async function renderSite() {
  const D = await loadData();
  // big screens are zoomed as a whole (the page's head script sets zoom and --k, from 1600px wide up); zoom multiplies viewport
  // units too, so every vh and vw is divided by --k here, and the held scenes stay exactly one screen tall
  const css = read('site/site.css').replace(/(?<![\w.#-])(\d*\.?\d+)(svh|dvh|lvh|vh|vw|vmin|vmax)\b/g, 'calc($1$2 / var(--k, 1))');
  const ctx = { css: read('site/fonts.css') + css + motionOffRules(css), js: read('site/site.js') };
  // shared links to the old address (navygibran.dev/#project-x, /#note) belong to the desk: the page script forwards them
  const targets = [...Object.keys(D.TARGETS), 'site'];
  ctx.js = ctx.js.replace('__DESK_TARGETS__', JSON.stringify(targets)).replace('__PROJECTS__', JSON.stringify(D.PROJECTS.map((p) => p.key)))
    .replace('__INDEX__', JSON.stringify({ p: D.PROJECTS.map((p) => [p.key, p.title, p.now ? `${p.industry}, now ${p.now.name}` : p.industry, p.stack, tint(p).bg, (KINDS.find(([k]) => k === kindOf(p)) || [, 'Overview'])[1]]), l: D.SITE.links.map((l) => [l.label, l.href]) }).replace(/</g, '\\u003c'));
  const menuLinks = D.SITE.links.map((l) => `<li><a href="${esc(l.href)}" target="_blank" rel="noopener" data-track="contact_click" data-channel="${esc(l.label)}">${esc(l.label)}</a></li>`).join('');
  const now = D.SITE.currently.charAt(0).toUpperCase() + D.SITE.currently.slice(1);
  const nClients = D.PROJECTS.filter((p) => p.url && p.date !== 'previous design').length;
  const fill = (html) => typeset(html.replace('__MENU_LINKS__', menuLinks).replace('__NOW__', esc(now)).replace('__STATUS__', esc(`${D.SITE.status} · ${D.SITE.where}`)).replace(/__N_PROJECTS__/g, counted(D).length).replace(/__N_CLIENTS__/g, nClients).replace(/__YEAR__/g, esc(D.SITE.copyright || D.SITE.year)));
  const out = { 'index.html': fill(home(D, ctx)), '404.html': fill(notFound(D, ctx)), 'work/index.html': fill(archivePage(D, ctx)) };
  D.PROJECTS.forEach((p, i) => { out[`work/${p.key}/index.html`] = fill(projectPage(D, ctx, p, i)); });
  const today = new Date().toISOString().slice(0, 10);
  const urls = ['/', '/work/', '/3d/', ...D.PROJECTS.map((p) => `/work/${p.key}/`)];
  out['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc><lastmod>${today}</lastmod><priority>${u === '/' ? '1.0' : u === '/3d/' || u === '/work/' ? '0.8' : '0.6'}</priority></url>`).join('\n')}\n</urlset>\n`;
  out['robots.txt'] = `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`;
  // no dashes in anything the site shows (Navy's rule)
  for (const [k, v] of Object.entries(out)) if (/[—–]/.test(strip(v.replace(/<style>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '')))) console.warn(`warning: ${k} contains an em or en dash`);
  return out;
}

// node scripts/site.js → writes the pages into KW_OUT or dist/ (the build calls renderSite itself)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--og-data')) {
  const D = await loadData();
  process.stdout.write(JSON.stringify(D.PROJECTS.map((p, i) => ({ key: p.key, n: i + 1, total: counted(D).length, counted: !isHub(p), title: p.title, industry: p.industry, stack: p.stack, date: p.date, now: p.now?.name || null, ...tint(p), ...projectMedia(D, p) }))));
} else if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dist = process.env.KW_OUT ? path.resolve(process.env.KW_OUT) : path.join(root, 'dist');
  const pages = await renderSite();
  for (const [rel, html] of Object.entries(pages)) { const f = path.join(dist, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); }
  console.log(`site: ${Object.keys(pages).length} files → ${path.relative(root, dist) || '.'}`);
}
