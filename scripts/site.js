// The plain portfolio: navygibran.dev/ and one page per project under /work/<key>/, rendered from src/app/data.js (the same
// content the 3D desk tells) into static HTML. No WebGL, no framework: the CSS and the page script (site/) are inlined into
// every page. scripts/build.js writes these pages into dist/; scripts/serve.js renders them fresh on every request.
// The 3D desk itself lives at /3d/ (dist/3d/index.html); this site only links to it.
// Three languages (scripts/i18n.js, i18n-projects.js): Indonesian at / (the default), English at /en/, Chinese at /zh/. Every
// page is rendered once per language; a language switch sits in the header; the choice is remembered and the default pages
// forward to it. Design: Ownitt's grammar (condensed capitals finished by an italic serif, parenthesised kickers, pinned scenes
// that play as you scroll, colour panels per project, loops of names) and Marcus Lorenzet's calm, in the desk's warm dark.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS, DEFAULT_LANG, LANG_ORDER, OTHER_PREFIXES, UI, CONTENT, fill } from './i18n.js';
import { PROJECTS_T, WORLDS_T, STORY } from './i18n-projects.js';
import { labsMain, LABS_CSS, LABS_META, labsMetaFor } from './labs.js';
import { worldsSection, WORLDS, WORLDS_CSS, worldsFor } from './labs-worlds.js';
import { labsFor } from '../src/app/labs.js';
import { homeProfileMain, HOME_PROFILE_CSS, HOME_PROFILE_JS, phoneOf } from './home-profile.js';
import { STACK, stackModel, stackParts, slugOf, toolboxGrid, STACK_CSS, TOOLBOX_CSS, TOOLBOX_JS } from './stack-tools.js';
import { minifyJS, minifyCSS } from './jsmin.js';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORIGIN = 'https://navygibran.dev';
// Ownitt's own faces (Elza Condensed, IvyPresto Display) are Adobe Fonts: with a web project for navygibran.dev, put its kit id
// here (or in the ADOBE_KIT env var) and the CSS stacks pick them up; until then the free stand-ins in site.css are used.
const ADOBE_KIT = process.env.ADOBE_KIT || '';
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');   // (a Windows checkout has CRLF)

// what Navy's own GitHub repositories say about his stack (written by scripts/github-stats.mjs); without it the stack shows no counts
const GH = (() => { try { return JSON.parse(read('scripts/github-stats.json')); } catch { return null; } })();

// data.js imports BACKLIGHTS from app/theme (3D only); the site doesn't need it, so the import becomes a constant
async function loadData() {
  const src = read('src/app/data.js').replace(/^import\s+\{[^}]*\}\s+from\s+'app\/theme';?\s*$/m, 'const _BL = null;');
  return import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
}

// ---------- the language of the page being rendered (pages render one after another, so one current language is enough)
let LANG = DEFAULT_LANG, L = LANGS[DEFAULT_LANG], PFX = '';
const setLang = (lang) => { LANG = lang; L = LANGS[lang]; PFX = L.prefix; };
const t = (k, vars) => { const v = UI[LANG]?.[k] ?? UI.en[k]; return vars && typeof v === 'string' ? fill(v, vars) : v; };
const tp = (p, f) => PROJECTS_T[LANG]?.[p.key]?.[f] ?? p[f];
// the words among the tool names (a project's stack line, the featured meta, the toolbox), in the page's language: tool names
// stay, the few words between them are said again (Navy: "waktu bahasa china ya china semua")
export const TERM_T = {   // (exported for scripts/smoke-site.js: a translated term must not leak in English onto /id/ or /zh/)
  id: { 'custom build': 'aplikasi custom', 'REST APIs': 'REST API', 'Smart contracts': 'Smart contract', 'Modern UI': 'UI modern', 'Custom UI': 'UI custom', 'Custom CSS': 'CSS custom', 'Creative theme': 'tema kreatif',
    Payments: 'Pembayaran', 'Custom themes': 'Tema custom', 'Wallet integration': 'Integrasi wallet', 'dApp frontends': 'Frontend dApp' },
  zh: { 'custom build': '定制开发', 'Modern UI': '现代界面', 'Custom UI': '定制界面', 'Custom CSS': '定制 CSS', 'Creative theme': '创意主题',
    Payments: '支付', Motion: '动效', 'REST APIs': 'REST API', 'Custom themes': '定制主题', 'Smart contracts': '智能合约', 'Wallet integration': '钱包集成', 'dApp frontends': 'dApp 前端' },
};
const term = (x) => TERM_T[LANG]?.[x] ?? x;
const stackOf = (p) => p.stack.split(' · ').map(term).join(' · ');   // a project's field, translated when a translation exists
const tw = (w) => { const x = WORLDS_T[LANG]?.[w.key]; return x ? { ...w, tagline: x.tagline ?? w.tagline, hotspots: Object.fromEntries(Object.entries(w.hotspots).map(([id, h]) => [id, { ...h, ...(x.hotspots?.[id] || {}) }])) } : w; };
const C = () => CONTENT[LANG] || CONTENT.en;
const u = (p) => `${PFX}${p}`;   // an internal page link, in this language
const cap1 = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

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
// a share card's version, so a redrawn card (og.py bakes the counts in) gets a new address for Facebook, LinkedIn and WhatsApp,
// which keep a picture by its address
const verCache = new Map();
function fileVer(rel) { const file = path.join(root, 'public', rel); let st; try { st = fs.statSync(file); } catch { return ''; } const k = `${file}|${st.mtimeMs}|${st.size}`; if (!verCache.has(k)) verCache.set(k, createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 8)); return verCache.get(k); }
const firstOf = (...rels) => rels.find(exists) || null;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const host = (u) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; } };
const strip = (s) => String(s).replace(/<[^>]+>/g, '');
const pad = (n) => String(n).padStart(2, '0');
// every word in its own mask, so a line rises word by word whatever the width; `n` carries the running index for the stagger.
// Chinese has no spaces: there each character is its own word, and Latin runs inside it stay whole.
const CJK = /[\u3000-\u303f\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/;
function split(s, n = { i: 0 }, em = false) {
  let out;
  if (LANG === 'zh') {
    const toks = String(s).match(/[\u3000-\u303f\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]\s*|[^\s\u3000-\u303f\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]+\s*/g) || [];
    // (a character counts for less than a word in the stagger, or a Chinese headline takes seconds to finish rising)
    out = toks.map((tk) => { const i = n.i; n.i = Math.round((n.i + 0.4) * 10) / 10; return `<span class="wd"><span style="--i:${i}">${esc(tk.trim())}</span></span>${/\s$/.test(tk) ? ' ' : ''}`; }).join('');
  } else out = esc(s).split(/\s+/).filter(Boolean).map((tk) => `<span class="wd"><span style="--i:${n.i++}">${tk}</span></span>`).join(' ');
  return em ? `<em>${out}</em>` : out;
}
// a sentence and its italic ending, both split, one running stagger
const splitPair = (plain, italic) => { const n = { i: 0 }; return `${split(plain, n)}${LANG === 'zh' && CJK.test(plain.slice(-1)) ? '' : ' '}${split(italic, n, true)}`; };

// ---------- what the site says that data.js doesn't. Every line restates a fact from data.js; nothing here is new.
// `bg` and `acc` are each project's own colours (GodPlan's violet interface, Orthobone's royal blue, Godjah's lime, Winfaith red,
// Flora's rose, FLS green and gold), darkened into the panel the project sits on. The kind and the line are in i18n.js.
// (JAKASN left the list: it has no picture to show, Navy's call 2026-10-11; it keeps its page in the archive)
const FEATURED = [
  { key: 'godplan-erp', meta: ['Go', 'Next.js', 'PostgreSQL'], bg: '#17112b', acc: '#b39bff' },
  { key: 'orthobone', meta: ['WooCommerce', 'Elementor'], bg: '#0c1a33', acc: '#8fb4f0' },
  { key: 'godjah-studio', meta: ['Next.js', 'Motion'], bg: '#12170b', acc: '#c9f25a' },
  { key: 'the-bedji-group', meta: ['WordPress', 'Elementor'], bg: '#0b1f18', acc: '#d9b56a' },
  { key: 'winfaith', meta: ['SvelteKit', 'GSAP', 'Three.js'], bg: '#251110', acc: '#ff8a6b' },
  { key: 'flora-indonesia', meta: ['WooCommerce', 'Payments'], bg: '#26131a', acc: '#f5abc0' },
  { key: 'fls-group-indonesia', meta: ['WooCommerce', 'Elementor'], bg: '#0d1f1a', acc: '#d8b26a' },
];
const featuredText = (key) => (C().featured?.[key] || CONTENT.en.featured[key]);

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
// the order the site lists the work in: the client sites first, the two platforms last (Navy, 2026-10-14: "jakasn godplan erp
// taro paling bawah"); data.js keeps its own order for the desk, whose quick shortcut opens its first project, GodPlan ERP
const LAST = ['godplan-erp', 'jakasn'];
const workOrder = (list) => [...list.filter((p) => !LAST.includes(p.key)), ...LAST.map((k) => list.find((p) => p.key === k)).filter(Boolean)];
const counted = (D) => workOrder(D.PROJECTS.filter((p) => !isHub(p)));
// the kind of work a project is: the archive's filters, and the first test for related projects
const KIND_KEYS = ['platform', 'custom', 'store', 'wordpress'];
const kindOf = (x) => (x.key === 'client-websites' ? 'overview' : /WooCommerce/.test(x.stack) ? 'store' : /WordPress/.test(x.stack) ? 'wordpress' : /\bGo\b|OJS/.test(x.stack) ? 'platform' : 'custom');
const kindLabel = (k) => (t('kindLabels')[k] || UI.en.kindLabels[k] || k);

// the client loop: one mark per business (public/site/logos/<key>.webp, a one-colour silhouette of the logo on its own site);
// `word` sets the name instead where no usable logo exists (the site is offline and only an icon survives in the screenshots)
const CLIENTS = [
  { key: 'winfaith', name: 'PT. Winfaith Indonesia' }, { key: 'flora-indonesia', name: 'PT. Rumindo Pertiwi Wardhana' }, { key: 'dams-garage', name: 'Dams Garage' },
  { key: 'yukti-rasa-mitrabumi', name: 'PT. Yukti Rasa Mitrabumi' }, { key: 'nf-optical', name: 'NF Optical' }, { key: 'godjah-studio', name: 'Godjah Studio' },
  { key: 'miniatur-kapal', name: 'Miniatur Kapal', word: ['Miniatur', 'Kapal'] }, { key: 'gracia-box', name: 'Gracia Box' },
  { key: 'orthobone', name: 'Orthobone' }, { key: 'recon', name: 'Recon' }, { key: 'fortunarack', name: 'Fortunarack' }, { key: 'izzi', name: 'Izzi' },
  { key: 'rameinaja', name: 'RameinAja', now: 'Reparty Indonesia', word: ['Ramein', 'Aja'] }, { key: 'little-aivy', name: 'Little Aivy' }, { key: 'airon', name: 'Airon' },
  { key: 'fls-group-indonesia', name: 'FLS Group Indonesia' }, { key: 'the-bedji-group', name: 'The Bedji Group' }, { key: 'godtive', name: 'Godtive' },
  { key: 'duta-mesh', name: 'CV. Duta Mesh' }, { key: 'kusen-tangsel', name: 'Kusen Tangsel, Gita Makmur Aluminium' }, { key: 'nudelisius', name: 'Nudelisius' },
  // (Ur Branded Bae's mark: the white letters, ring and sparkles lifted off its gradient badge; Rathera's site carries another
  // studio's logo, Yolaine Beauty Bar, so Rathera stays by name until Navy sends its own mark)
  { key: 'ur-branded-bae', name: 'Ur Branded Bae' }, { key: 'rathera-beauty-studio', name: 'Rathera Beauty Studio', word: ['Rathera', 'Beauty Studio'] },
];
// the transparent pixel an <img> holds until the page script gives it a picture
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
// a client's name as the page says it: a business that has since taken another name says so, in the page's language
const clientName = (c) => (c.now ? c.name + t('nowSuffix', { n: c.now }) : c.name);
// a link elsewhere by the name the page's language gives it (the CV's file is "Résumé" in data.js, a word only English uses)
const linkLabel = (l) => (l.label === 'Résumé' ? t('resumePdf') : l.label);
// Navy as one person for search engines: one @id on every page and in every language (the home at / is the entity's home), so
// the home, the story, the CV and the projects all speak of the same Navy Gibran rather than three of him
const PERSON_ID = `${ORIGIN}/#person`;
function personLd(D, image) {
  const pic = image || (exists('site/portrait.webp') ? 'site/portrait.webp' : 'og.png');
  const UMN = { '@type': 'CollegeOrUniversity', name: 'Universitas Multimedia Nusantara', url: 'https://www.umn.ac.id/' };
  const deg = (CONTENT[LANG]?.path || []).find((r) => /Multimedia Nusantara/.test(r.org || ''));
  return {
    '@type': 'Person', '@id': PERSON_ID, name: 'Navy Gibran', url: `${ORIGIN}/`, image: `${ORIGIN}/${pic}`, jobTitle: t('jobTitle'), description: t('ldDesc'),
    ...(D.SITE.email ? { email: `mailto:${D.SITE.email}` } : {}), ...(D.SITE.whatsapp ? { telephone: `+${String(D.SITE.whatsapp).replace(/\D/g, '')}` } : {}),
    alumniOf: UMN,
    ...(deg ? { hasCredential: { '@type': 'EducationalOccupationalCredential', credentialCategory: 'degree', name: deg.role, recognizedBy: UMN } } : {}),
    worksFor: { '@type': 'Organization', name: 'PT. Gajah Terbang Kreatif', url: 'https://gajahterbangkreatif.id/' },
    address: { '@type': 'PostalAddress', addressCountry: 'ID' },
    knowsAbout: STACK.flat().map(term), knowsLanguage: ['id', 'en', 'zh'],
    sameAs: D.SITE.links.filter((l) => /linkedin|github|x\.com/.test(l.href)).map((l) => l.href),
  };
}
const ldScript = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
// a description for search results: whole sentences up to about 155 characters (about 80 in Chinese, whose characters are wider),
// cut at the last sentence or clause that fits, never inside a word, and marked with an ellipsis only when something was cut
function metaCut(s, lang = LANG) {
  const max = lang === 'zh' ? 80 : 155;
  s = String(s || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  let stop = -1;
  for (const m of cut.matchAll(/[.!?;](?= )|[。；]/g)) if (!(m[0] === '.' && /(?:^|[\s(])(?:PT|CV|Tbk|Jl|No|Dr|Ir|St|vs|etc|[A-Z])$/.test(cut.slice(0, m.index)))) stop = m.index;
  if (stop > max * 0.5) return cut.slice(0, stop + 1).trim();
  const soft = Math.max(...[': ', ', ', '：', '，', '、'].map((x) => cut.lastIndexOf(x)));
  if (soft > max * 0.6) return cut.slice(0, soft).trim() + (lang === 'zh' ? '……' : '...');
  return cut.replace(/\s+\S*$/, '').replace(/[,.;:]$/, '') + (lang === 'zh' ? '……' : '...');
}

// what I build, by kind of work ("territories"): the proof (project pages) is here, the words are in i18n.js, in the same order
const TERRITORIES = [
  { proof: ['godplan-erp', 'jakasn'] },
  { proof: ['dams-garage', 'nf-optical', 'yukti-rasa-mitrabumi'] },
  { proof: ['flora-indonesia', 'orthobone', 'fls-group-indonesia'] },
  { proof: ['godjah-studio', 'winfaith'] },
  // (`also` adds a place that is not a project page: the desk itself is the proof here)
  { proof: ['godjah-studio', 'winfaith'], also: '/3d/', labs: true },
  // (Web3 is in the toolbox below, not a territory: there is no project to show for it yet, and a territory without proof reads as padding)
];

// each tool's mark (public/site/tools/<slug>.svg, Simple Icons, CC0; the brands belong to their owners), drawn in one colour as a
// mask like the client logos; a tool with no brand mark gets a short monogram in a ring instead
const TOOL_MARK = {
  Go: 'go', TypeScript: 'typescript', JavaScript: 'javascript', PHP: 'php', Solidity: 'solidity', Python: 'python',
  'Next.js': 'nextdotjs', React: 'react', SvelteKit: 'svelte', 'Tailwind CSS': 'tailwindcss',
  'Node.js': 'nodedotjs', Bun: 'bun', PostgreSQL: 'postgresql', MySQL: 'mysql',
  WordPress: 'wordpress', WooCommerce: 'woocommerce', Elementor: 'elementor',
  Docker: 'docker', Vercel: 'vercel', Swagger: 'swagger', DBeaver: 'dbeaver', Figma: 'figma',
  GSAP: 'gsap', 'Framer Motion': 'framer', 'Three.js': 'threedotjs', WebGL: 'webgl',
  'Smart contracts': 'ethereum', 'Wallet integration': 'walletconnect',
};
const TOOL_MONO = { 'REST APIs': 'API', 'Custom themes': 'TH', 'dApp frontends': 'DA' };
const TOOL_WIDE = new Set(['mysql', 'webgl', 'woocommerce', 'gsap']);   // wordmarks: a wider box, or they are a smudge
const toolMark = (tool) => TOOL_MARK[tool] && exists(`site/tools/${TOOL_MARK[tool]}.svg`)
  ? `<i class="tool-i${TOOL_WIDE.has(TOOL_MARK[tool]) ? ' tool-i--wide' : ''}" style="--m:url(/site/tools/${TOOL_MARK[tool]}.svg)" aria-hidden="true"></i>`
  : `<i class="tool-i tool-i--txt" aria-hidden="true">${esc(TOOL_MONO[tool] || tool.slice(0, 2).toUpperCase())}</i>`;
// (the stack itself, its layers and tools, is in scripts/stack-tools.js, shared with the profile home)
// what each menu link shows beside the list
// (Clients and What I build must not share a picture: client-websites-1 is itself a Winfaith shot, so Clients shows a store)
const MENU_PV = ['shots/gallery/godplan-erp-1.webp', 'shots/gallery/orthobone-1.webp', 'shots/gallery/winfaith-1.webp', 'site/desk-keys.webp', 'site/desk-wide.webp', 'site/desk-world.webp', 'shots/labs/flowkite.webp'];
// (the manifesto, the dictionary definition and the masked question used to sit between the introduction and the work: three
// sections saying one thing, eight screens before the first project. The one that says it with evidence, "The difference",
// stays, after the work; the rest went, Navy's call 2026-10-11)

// ---------- pieces
const arrow = '<svg class="ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const arrowD = '<svg class="ar ar-d" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v11M4 9l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const arrowR = '<svg class="ar ar-r" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
// Navy's mark, the two strokes of the N as filled outlines traced from his own logo (site/mark.svg, made by scripts/trace-mark.py);
// pathLength lets the intro draw each outline with a dash of one
const MARK_D = [...read('site/mark.svg').matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
const MARK = (cls = '') => `<svg class="nv-mark${cls ? ` ${cls}` : ''}" viewBox="150 140 220 214" aria-hidden="true">${MARK_D.map((d) => `<path d="${d}" pathLength="1"/>`).join('')}</svg>`;
const circleGo = `<span class="go" aria-hidden="true">${arrowR}</span>`;

let eagerSeen = 0;   // (eager pictures on the page being rendered; head() starts each page at 0)
function img(rel, alt, { cls = '', sizes = '100vw', eager = false, copyW = 800 } = {}) {
  const d = imgSize(rel), c = [cls, eager ? '' : 'lz'].filter(Boolean).join(' ');
  // (a smaller copy, when scripts/thumbs.py has made one, is offered beside the original: 800 px for the wide shots, 320 px for
  // the phone shots)
  const small = rel.replace(/\.webp$/, `-${copyW}.webp`);
  const set = d && small !== rel && exists(small) ? ` srcset="/${small} ${copyW}w, /${rel} ${d.w}w"` : '';
  return `<img src="/${rel}"${set} alt="${esc(alt)}"${d ? ` width="${d.w}" height="${d.h}"` : ''}${c ? ` class="${c}"` : ''} sizes="${sizes}" ${eager ? (eagerSeen++ === 0 ? 'fetchpriority="high"' : '') : 'loading="lazy"'} decoding="async">`.replace(/" +decoding/, '" decoding');
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

// a project's industry line as the lists show it: with "now X" for a business that moved on, "first version" for the earlier site
const industryLine = (p) => tp(p, 'industry') + (p.now ? t('nowSuffix', { n: p.now.name }) : p.date === 'previous design' ? t('firstSuffix') : '');
// a project link's shared attributes (the curtain's colour and name, the tracking)
const pAttrs = (x, from) => `href="${u(`/work/${x.key}/`)}" data-track="project_open" data-project="${x.key}"${from ? ` data-from="${from}"` : ''} data-bg="${tint(x).bg}" data-name="${esc(x.title)}"`;

// a project as a small card: its picture, its name, its trade (the related projects; the 404 page's suggestions)
const moreCard = (D, x, k, from) => {
  const mm = projectMedia(D, x);
  return `<li style="--i:${k}"><a ${pAttrs(x, from)} data-cursor="${esc(t('cursorView'))}"><span class="more-pic">${mm.cover ? img(mm.cover, t('screenshot', { t: x.title }), { sizes: '(min-width: 900px) 30vw, 80vw' }) : plate(x)}</span><span class="more-t">${esc(x.title)}</span><span class="more-i">${esc(tp(x, 'industry'))}</span></a></li>`;
};

// a project without a screenshot (JAKASN) gets a typographic plate instead; on its own page (`full`) the plate also says why
// the picture is missing (`noShot` in data.js), and that line is the one part a screen reader gets
const plate = (p, full = false) => {
  const ns = full && tp(p, 'noShot');
  const hide = ns ? ' aria-hidden="true"' : '';
  return `<div class="plate${ns ? ' plate--note' : ''}"${ns ? '' : ' aria-hidden="true"'}>
    <span class="plate-top"><span class="plate-k"${hide}>${esc(tp(p, 'industry'))}</span>${ns ? kick(ns.tag, ' aria-hidden="true"') : ''}</span>
    <span class="plate-mid"><span class="plate-t"${hide}>${esc(p.title)}</span>${ns ? `<p class="plate-note">${esc(ns.line)}</p>` : ''}</span>
    <span class="plate-s"${hide}>${esc(stackOf(p))}</span></div>`;
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

// `pathname` is the page's path without the language prefix ('/', '/work/', '/work/<key>/'): the canonical and the alternates
// are built from it. The default language's pages forward to a remembered choice (the switch sets it) before anything paints.
function head({ title, description, pathname, image = `${ORIGIN}/${exists('og.jpg') ? 'og.jpg' : 'og.png'}`, imageAlt, css, extra = '', intro = false, theme = '#0e0c09', noindex = false, viewForward = false, nfSwap = false, labels = [] }) {
  const url = `${ORIGIN}${PFX}${pathname}`;
  if (LANG !== DEFAULT_LANG && image.startsWith(ORIGIN + '/') && image.endsWith('.jpg')) { const rel = image.slice(ORIGIN.length + 1).replace(/\.jpg$/, `-${LANG}.jpg`); if (exists(rel)) image = `${ORIGIN}/${rel}`; }
  if (image.startsWith(ORIGIN + '/') && !image.includes('?')) { const v = fileVer(image.slice(ORIGIN.length + 1)); if (v) image += `?v=${v}`; }
  const imgAlt = esc(imageAlt || t('ogDefaultAlt'));
  const twLabels = labels.filter(([l, d]) => l && d).slice(0, 2).map(([l, d], i) => `<meta name="twitter:label${i + 1}" content="${esc(l)}">\n<meta name="twitter:data${i + 1}" content="${esc(d)}">\n`).join('');
  eagerSeen = 0;
  // the home (the simple page) remembers which reading the visitor chose at the gate: "full" sends them to the story before anything
  // paints, in the language they remembered too (this runs before the language forward, so the two never race), never when the
  // address carries a hash, nor inside the desk's sheet
  const viewLang = LANG === DEFAULT_LANG ? `(vl&&/^(${OTHER_PREFIXES})$/.test(vl)?'/'+vl:'')` : `'${PFX}'`;
  const viewFwd = viewForward ? `try{if(!location.hash&&window.top===window.self&&localStorage.getItem('nv-view')==='full'){var vl=localStorage.getItem('nv-lang');location.replace(${viewLang}+'/full/'+location.search);return}}catch(e){}` : '';
  const alts = LANG_ORDER.map((l) => `<link rel="alternate" hreflang="${LANGS[l].html}" href="${ORIGIN}${LANGS[l].prefix}${pathname}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${ORIGIN}${LANGS[DEFAULT_LANG].prefix}${pathname}">`;
  // (never from a path that already carries a prefix, and never from the 404 page: an old server that does not know /en/ would
  // answer it with this page, and the forward would then add /en/ again and again)
  const forward = LANG === DEFAULT_LANG && pathname !== '/404' ? `try{var pl=localStorage.getItem('nv-lang');if(pl&&pl!=='${DEFAULT_LANG}'&&/^(${OTHER_PREFIXES})$/.test(pl)&&!/^\\/(${OTHER_PREFIXES})(\\/|$)/.test(location.pathname)&&window.top===window.self){location.replace('/'+pl+location.pathname+location.search+location.hash)}}catch(e){}` : '';
  // Vercel answers every missing address with the one 404.html at the root (in English). Under /id/ or /zh/ that page fetches its
  // own language's copy and puts its body in place once both are in, before anything shows: the address stays as typed and the
  // answer stays a 404. The page script waits (window.__nf) and runs on the new body; if the copy cannot come, on the English one.
  const swap = nfSwap ? `<script>(function(){var m=/^\\/(${OTHER_PREFIXES})\\//.exec(location.pathname);if(!m)return;var d=document.documentElement,done=0,got=0,ready=0,failed=0;window.__nf=1;d.style.visibility='hidden';function run(b){b.querySelectorAll('script').forEach(function(o){var n=document.createElement('script');for(var i=0;i<o.attributes.length;i++)n.setAttribute(o.attributes[i].name,o.attributes[i].value);n.async=false;n.text=o.text;o.replaceWith(n)})}function end(h){if(done)return;done=1;window.__nf=0;if(h){var n=new DOMParser().parseFromString(h,'text/html'),a=document.querySelector('meta[name=description]'),b=n.querySelector('meta[name=description]');d.lang=n.documentElement.lang;document.title=n.title;if(a&&b)a.content=b.content;document.body.replaceWith(n.body)}run(document.body);d.style.visibility=''}function go(){if(ready&&(got||failed))end(got)}fetch('/'+m[1]+'/404.html').then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(h){got=h;go()}).catch(function(){failed=1;go()});document.addEventListener('DOMContentLoaded',function(){ready=1;go()});setTimeout(function(){failed=1;go()},2500)})()</script>\n` : '';
  return `<!doctype html>
<html lang="${L.html}" class="no-js">
<head>
<meta charset="utf-8">
${swap}<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="Navy Gibran">
${noindex ? '' : `<link rel="canonical" href="${url}">\n${alts}\n`}<meta name="robots" content="${noindex ? 'noindex' : 'index, follow, max-image-preview:large'}">
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
<meta property="og:image:alt" content="${imgAlt}">
<meta property="og:locale" content="${L.og}">
${LANG_ORDER.filter((l) => l !== LANG).map((l) => `<meta property="og:locale:alternate" content="${LANGS[l].og}">`).join('\n')}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${imgAlt}">
${twLabels}<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/site/fonts/barlow-condensed-700-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/site/fonts/instrument-serif-400-italic-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/site/fonts/newsreader-400-static-latin.woff2" as="font" type="font/woff2" crossorigin>
${ADOBE_KIT ? `<link rel="stylesheet" href="https://use.typekit.net/${esc(ADOBE_KIT)}.css">\n` : ''}<script>(function(d){${viewFwd}${forward}d.classList.replace('no-js','js');try{if(window.top!==window.self)d.classList.add('in-desk')}catch(e){}try{var k=Math.max(1,Math.min(innerWidth/1600,innerHeight/900));if(k>1.02&&CSS.supports('zoom','1.5')){d.style.setProperty('--k',k.toFixed(4));d.style.zoom=k.toFixed(4)}}catch(e){}try{if(localStorage.getItem('nv-motion')==='off')d.classList.add('motion-off')}catch(e){}try{var s=sessionStorage,c=s.getItem('nv-curtain');if(c){d.classList.add('curtain-on');if(c!=='1'){d.style.setProperty('--curtain',c);d.classList.add('curtain-tint')}s.removeItem('nv-curtain')}${intro ? "if(!c&&!s.getItem('nv-intro')&&!d.classList.contains('in-desk')&&!d.classList.contains('motion-off')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('intro-on')" : ''}}catch(e){}})(document.documentElement)</script>
${cssLinks(css)}
${BASE_JS ? `<link rel="preload" as="script" href="${asset(minJs(BASE_JS), 'js')}">` : ''}
<script type="speculationrules">{"prefetch":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":"/3d/*"}}]},"eagerness":"moderate"},{"where":{"href_matches":"/3d/*"},"eagerness":"conservative"}]}</script>
<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};</script><script defer src="/_vercel/insights/script.js"></script><script>window.si=window.si||function(){(window.siq=window.siq||[]).push(arguments)};</script><script defer src="/_vercel/speed-insights/script.js"></script>
${extra}</head>`;
}

// the language switch: the same page in each language (the page script remembers the choice)
const langSwitch = (pathname) => `<nav class="lang" aria-label="${esc(t('langAria'))}">${LANG_ORDER.map((l) => `<a href="${LANGS[l].prefix}${pathname}" hreflang="${LANGS[l].html}" lang="${LANGS[l].html}" data-lang="${l}" title="${esc(LANGS[l].name)}"${l === LANG ? ' aria-current="true"' : ''}>${esc(LANGS[l].short)}</a>`).join('')}</nav>`;

// the three readings, beside the languages on every page: Simple (the home), Full (the story at /full/) and the 3D desk
const viewSwitch = (current) => `<nav class="view" aria-label="${esc(t('viewAria'))}"><a href="${u('/')}" data-view="simple"${current === 'simple' ? ' aria-current="true"' : ''}>${esc(t('viewSimple'))}</a><a href="${u('/full/')}" data-view="full"${current === 'home' ? ' aria-current="true"' : ''}>${esc(t('viewFull'))}</a><a href="/3d/" data-view="desk" data-track="3d_cta_click" data-from="switch" aria-label="${esc(t('deskTabAria'))}">3D</a></nav>`;

// the simple reading's menu (the profile page): one column of plain links, the WhatsApp button, the email and the links elsewhere;
// no preview panel, no blurb, no running line. The same overlay and the same button open and close it
function menuSimple(D, current, pathname) {
  const link = (href, label, id, extra = '') => `<a href="${href}"${current === id ? ' aria-current="page"' : ''}${extra}>${esc(label)}</a>`;
  return `<div class="menu menu--simple" id="menu" aria-hidden="true">
  <nav class="sm-links" aria-label="${esc(t('menuMain'))}">
    ${link(u('/'), cap1(t('home')), 'simple')}${link(u('/work/'), t('f_all'), 'work')}${link(u('/labs/'), t('m_labs'), 'labs')}${link(u('/cv/'), t('m_cv'), 'cv')}${link(u('/full/'), t('viewFull'), 'home')}${link('/3d/', t('f_desk'), 'desk', ' data-track="3d_cta_click" data-from="menu"')}
  </nav>
  <div class="sm-side">
    <a class="btn btn-fill" href="${esc(wa(D.SITE.whatsapp, t('waHello')))}" target="_blank" rel="noopener" data-track="contact_click" data-channel="WhatsApp" data-from="menu" data-magnet>${exists('site/avatar.webp') ? '<img class="btn-av" src="/site/avatar.webp" alt="" width="40" height="40" decoding="async">' : ''}${esc(t('chat'))} ${arrow}</a>
    <a class="sm-mail" href="mailto:${esc(D.SITE.email)}" data-track="contact_click" data-channel="Email" data-from="menu">${esc(D.SITE.email)}</a>
    <div class="sm-else"><span class="lbl">${esc(t('elsewhere'))}</span><ul>__ELSE_LINKS__</ul></div>
    <p class="menu-now menu-status"><span class="dot dot--open" aria-hidden="true"></span><span>${esc(`${t('status')} · ${t('where')}`)}</span></p>
    ${langSwitch(pathname)}
  </div>
  <div class="menu-foot" aria-hidden="true"><em>${esc(t('motto'))}</em><span class="menu-esc if-hover"><kbd>Esc</kbd> ${esc(t('escClose'))}</span><span>© __YEAR__</span></div>
</div>`;
}

// the top of every page: the skip link, the anchor "back to top" goes to, the curtain between pages, the header and the menu
// (`D` given: the simple reading's menu instead of the editorial one)
function header(current, pathname, D = null) {
  // each link shows a picture of where it leads in the panel beside the list (desktop)
  // (`sub` is the line beside the word: what the section holds, in a few words; the counts are filled in by build())
  const item = (href, n, label, id, k, em = '', sub = '') => `<a href="${href}" data-pv="${k}"${current === id ? ' aria-current="page"' : ''}><span class="mn">${n}</span><span class="ml">${roll(label, em)}</span>${sub ? `<span class="ml-sub" aria-hidden="true">${sub}</span>` : ''}</a>`;
  // (the panel is at most 580 px wide: an ordinary screen takes the 800 px copy, a sharp one the original)
  const pvSet = (f) => { const s = f.replace(/\.webp$/, '-800.webp'), d = imgSize(f); return s !== f && exists(s) && d ? ` srcset="/${s} 800w, /${f} ${d.w}w" sizes="(min-width: 1180px) 580px, 46vw"` : ''; };
  const pv = MENU_PV.filter(exists).map((f, k) => `<img src="/${f}"${pvSet(f)} alt="" loading="lazy" decoding="async" data-k="${k}"${f.startsWith('shots/') ? ' class="pv-shot"' : ''}>`).join('');
  const nTerr = t('num')[TERRITORIES.length] || TERRITORIES.length;
  return `<a class="skip" href="#main">${esc(t('skip'))}</a>
<div id="top" class="top-anchor"></div>
<div class="curtain" aria-hidden="true">${MARK()}<span class="curtain-t"></span></div><script>try{var n=sessionStorage.getItem('nv-curtain-name');if(n){document.currentScript.previousElementSibling.lastChild.textContent=n;sessionStorage.removeItem('nv-curtain-name')}}catch(e){}</script>
<div class="progress" aria-hidden="true"><i></i></div>
<header class="head${current === 'simple' || current === 'home' ? '' : ' head--3'}">
  <div class="head-in">
    <a class="brand" href="${u('/')}" aria-label="${esc(t('brandHome'))}">${MARK()}<span class="brand-n">Navy Gibran</span><span class="head-sec" aria-hidden="true"><span class="hs-in"></span></span></a>
    ${viewSwitch(current)}
    ${langSwitch(pathname)}
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" data-magnet><span class="menu-word">${roll(t('menu'))}</span><span class="menu-lines" aria-hidden="true"><i></i><i></i></span></button>
  </div>
</header>
${D ? menuSimple(D, current, pathname) : `<div class="menu" id="menu" aria-hidden="true">
  <div class="menu-bg" aria-hidden="true">${MARK()}</div>
  <nav class="menu-links" aria-label="${esc(t('menuMain'))}">
    ${item(u('/work/'), '01', t('m_work'), 'work', 0, '', esc(t('ms_work', { n: '__N_PROJECTS__' })))}${item(u('/full/#clients'), '02', t('m_clients'), 'clients', 1, '', esc(t('ms_clients', { n: '__N_CLIENTS__' })))}${item(u('/full/#territories'), '03', t('m_terr'), 'terr', 2, '', esc(t('ms_terr', { n: nTerr })))}${item(u('/full/#path'), '04', t('m_path'), 'path', 3, '', esc(t('ms_path')))}${item(u('/full/#contact'), '05', t('m_contact'), 'contact', 4, '', esc(t('ms_contact')))}${item('/3d/', '06', t('m_desk'), 'desk', 5, t('m_deskEm'), esc(t('ms_desk')))}${item(u('/labs/'), '07', t('m_labs'), 'labs', 6, '', esc(t('ms_labs', { n: WORLDS.length + (+(LABS_META.menu.sub.match(/\d+/) || [0])[0]) })))}
  </nav>
  <div class="menu-side">
    <div class="menu-pv" aria-hidden="true">${pv}<span class="menu-pv-mark">${MARK()}</span><span class="menu-pv-cap"><b></b><span></span></span></div>
    <p>${esc(t('menuBlurb'))}</p>
    <p class="menu-now"><span class="dot" aria-hidden="true"></span><span><b>${esc(t('now'))}</b> ${esc(cap1(t('nowLine')))}</span></p>
    <p class="menu-now menu-status"><span class="dot dot--open" aria-hidden="true"></span><span>${esc(`${t('status')} · ${t('where')}`)}</span></p>
    <div class="menu-acts"><button class="menu-find" type="button" data-palette><span>${esc(t('find'))}</span><kbd data-kbd>Ctrl K</kbd></button><a class="menu-find menu-cv" href="${u('/cv/')}"${current === 'cv' ? ' aria-current="page"' : ''}><span>${esc(t('m_cv'))}</span></a></div>
    <div><span class="lbl">${esc(t('elsewhere'))}</span><ul>__MENU_LINKS__</ul></div>
    ${langSwitch(pathname)}
    <span class="lbl menu-clock" data-clock>${esc(t('clock'))}</span>
  </div>
  <div class="menu-foot" aria-hidden="true"><em>${esc(t('motto'))}</em><span class="menu-esc if-hover"><kbd>Esc</kbd> ${esc(t('escClose'))}</span><span>© __YEAR__</span></div>
</div>`}`;
}

function footer(D, simple = false) {
  const links = D.SITE.links.map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener" data-track="contact_click" data-channel="${esc(l.label)}">${esc(linkLabel(l))}</a>`).join('');
  const bar = `<div class="foot-bar"><span>© ${esc(D.SITE.copyright || D.SITE.year)} Navy Gibran</span><button class="motion" type="button" aria-pressed="false">${esc(t('motion'))} <b>${esc(t('on'))}</b></button><em>${esc(t('motto'))}</em><span data-clock>${esc(t('clock'))}</span><a href="#top" class="to-top">${roll(t('toTop'))} <span class="up" aria-hidden="true">↑</span></a></div>`;
  // the simple reading's footer: the mark and the name, the links elsewhere, the bar; no giant letters, no columns
  if (simple) return `<footer class="foot foot--simple" data-scene="foot" data-hide-tab>
  <div class="wrap">
    <div class="sf-top"><a class="sf-brand" href="${u('/')}" aria-label="${esc(t('brandHome'))}">${MARK()}<span>Navy Gibran</span></a><nav class="sf-links" aria-label="${esc(t('elsewhere'))}">${links}<a href="/3d/" data-track="3d_cta_click" data-from="footer">${esc(t('f_desk'))}</a></nav></div>
    ${bar}
  </div>
</footer>`;
  return `<footer class="foot" data-scene="foot" data-hide-tab>
  <div class="wrap">
    <div class="foot-big" aria-hidden="true"><span class="fb-o">Navy Gibran</span><span class="fb-f">Navy Gibran</span></div>
    <div class="foot-cols">
      <div><span class="lbl">${esc(t('f_site'))}</span><a href="${u('/full/#work')}">${esc(t('m_work'))}</a><a href="${u('/work/')}">${esc(t('f_all'))}</a><a href="${u('/labs/')}">${esc(t('m_labs'))}</a><a href="${u('/cv/')}">${esc(t('m_cv'))}</a><a href="${u('/full/#clients')}">${esc(t('m_clients'))}</a><a href="${u('/full/#territories')}">${esc(t('m_terr'))}</a><a href="${u('/full/#path')}">${esc(t('m_path'))}</a><a href="${u('/full/#contact')}">${esc(t('m_contact'))}</a></div>
      <div><span class="lbl">${esc(t('elsewhere'))}</span>${links}</div>
      <div><span class="lbl">${esc(t('f_other'))}</span><a href="/3d/" data-track="3d_cta_click" data-from="footer">${esc(t('f_desk'))} ${arrow}</a></div>
    </div>
    ${bar}
  </div>
</footer>`;
}

const minCache = new Map();
function minJs(js) {
  if (minCache.has(js)) return minCache.get(js);
  let out = js;
  try {
    const m = minifyJS(js), again = minifyJS(m.code);
    if (again.code === m.code && again.tokens.length === m.tokens.length) { new vm.Script(m.code); out = m.code; }
  } catch (e) { console.warn('page script left unminified:', e.message); }
  minCache.set(js, out);
  return out;
}
// the files the pages share, named by their content: /s/<hash>.css and .js (vercel.json caches /s/ for a year, immutable). The
// stylesheet and the script every page carries are one file each; a page's own extra (the home's profile, Labs' worlds) is a second.
// Only the page's data stays inline (window.__NV: its language, its words, the index the search reads), a few kB.
let ASSETS = new Map(), BASE_CSS = '', BASE_JS = '', NV_DATA = '{}';
function asset(content, ext) {
  const rel = `s/${createHash('sha1').update(content).digest('hex').slice(0, 10)}.${ext}`;
  ASSETS.set(rel, content);
  return '/' + rel;
}
const splitBase = (code, base) => (base && code.startsWith(base) ? [base, code.slice(base.length)] : [code]).filter((c) => c.trim());
const cssLinks = (css) => splitBase(css, BASE_CSS).map((c) => `<link rel="stylesheet" href="${asset(minCss(c), 'css')}">`).join('\n');
function minCss(css) {
  if (minCache.has(css)) return minCache.get(css);
  let out = css; try { out = minifyCSS(css); } catch (e) { console.warn('page CSS left unminified:', e.message); }
  minCache.set(css, out);
  return out;
}
const tail = (js) => `<script>window.__NV=${NV_DATA}</script>\n${splitBase(js, BASE_JS).map((c) => `<script src="${asset(minJs(c), 'js')}"></script>`).join('\n')}\n</body>\n</html>\n`;

// ---------- home
function home(D, ctx) {
  const P = (k) => D.PROJECTS.find((p) => p.key === k);
  const clientSites = D.PROJECTS.filter((p) => p.url && p.date !== 'previous design');   // (the old Gajah Terbang site shares its address with the redesign)
  const total = D.DISCOVERY_TOTAL;
  const heroPhoto = firstOf('site/hero.webp', 'site/hero.jpg', 'site/hero.jpeg', 'site/hero.png');
  const cvHref = D.SITE.links.find((l) => l.label === 'Résumé')?.href || '#contact';
  const deskShot = exists('site/desk-wide.webp') ? 'site/desk-wide.webp' : 'og.png';
  // the opening picture: its preload offers the same sizes as the picture itself (with only the large one named, a phone fetched both)
  const heroRel = heroPhoto || deskShot, heroSizes = heroPhoto ? '(min-width: 900px) 70vw, 100vw' : '(max-width: 900px) 100vw, 70vw';
  const small800 = (rel) => { const s = rel.replace(/[.]webp$/, '-800.webp'); return s !== rel && exists(s) ? s : null; };
  const heroSmall = small800(heroRel), heroDim = imgSize(heroRel);
  const heroPreload = `<link rel="preload" as="image" href="/${heroRel}"${heroSmall && heroDim ? ` imagesrcset="/${heroSmall} 800w, /${heroRel} ${heroDim.w}w" imagesizes="${heroSizes}"` : ''} fetchpriority="high">`;

  // ---- selected work: one full-screen panel per project, each sliding over the last
  const featured = FEATURED.map((f, i) => {
    const p = P(f.key); if (!p) return '';
    const m = projectMedia(D, p), ft = featuredText(f.key), did = tp(p, 'did');
    const small = m.phone ? `<div class="case-small">${img(m.phone, t('onPhone', { t: p.title }), { sizes: '240px' })}</div>` : m.shots[1] ? `<div class="case-small case-small--wide">${img(m.shots[1], t('anotherPage', { t: p.title }), { sizes: '320px' })}</div>` : '';
    return `<li class="case" style="--bgc:${f.bg};--acc:${f.acc}" data-case="${i}">
      <a class="case-in" ${pAttrs(p)} data-cursor="${esc(t('cursorView'))}">
        <div class="case-top"><span><b>${pad(i + 1)}</b> / ${esc(t('selected'))}</span><span>${esc(ft.kind)}</span></div>
        <div class="case-text">
          <span class="case-meta"><b>${esc(p.title)}</b> · ${f.meta.map((x) => esc(term(x))).join(' · ')}</span>
          <h2 class="case-title">${esc(p.title)}</h2>
          <p class="case-line">${esc(ft.line)}</p>
          ${did ? `<ul class="case-did">${did.slice(0, 3).map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
          <span class="case-cta">${esc(t('viewProject'))} ${circleGo}</span>
        </div>
        <div class="case-media"><div class="case-big"${m.shots.length > 1 ? ` data-shots="${esc(JSON.stringify(m.shots.map((s) => '/' + s)))}"` : ''}>${m.cover ? img(m.cover, t('screenshot', { t: p.title }), { sizes: '(min-width: 1100px) 56vw, 100vw' }) : plate(p)}${m.shots.length > 1 ? `<img class="case-alt" alt="" src="${BLANK}" aria-hidden="true" decoding="async"><img class="case-alt" alt="" src="${BLANK}" aria-hidden="true" decoding="async"><span class="case-bars" aria-hidden="true">${m.shots.map(() => '<i></i>').join('')}</span>` : ''}</div>${small}</div>
        <span class="case-ghost" aria-hidden="true" data-n="${pad(i + 1)}"></span>
      </a>
    </li>`;
  }).join('');
  const rail = FEATURED.map((f, i) => `<li><button type="button" tabindex="-1" data-go="${i}" data-t="${esc(P(f.key)?.title || '')}" aria-label="${esc(P(f.key)?.title || '')}">${pad(i + 1)}</button></li>`).join('');

  const featuredKeys = new Set(FEATURED.map((f) => f.key));
  const rest = counted(D).filter((p) => !featuredKeys.has(p.key));
  const index = rest.map((p, i) => {
    const m = projectMedia(D, p);
    return `<li style="--i:${i}"><a ${pAttrs(p)}${m.cover ? ` data-preview="/${m.cover}"` : ''}><span class="ix-n">${pad(i + 1)}</span>${m.cover ? `<span class="ix-thumb" aria-hidden="true"><img src="/${m.cover}" alt="" loading="lazy" decoding="async" width="96" height="60"></span>` : `<span class="ix-thumb ix-thumb--none" aria-hidden="true" style="--nbg:${tint(p).bg}"><b>${esc(p.title.length <= 8 ? p.title : p.title.split(/\s+/).map((w) => w[0]).join('').slice(0, 3))}</b></span>`}<span class="ix-name">${esc(p.title)}</span><span class="ix-ind">${esc(industryLine(p))}</span><span class="ix-stack">${esc(stackOf(p))}</span><span class="ix-go" aria-hidden="true">${arrowR}</span></a></li>`;
  }).join('');
  // three rows of names, the way Ownitt closes its projects: big capitals, a dot between, each row its own direction
  const allNames = counted(D).filter((p) => p.date !== 'previous design').map((p) => p.title);
  const rowNames = (k) => allNames.filter((_, i) => i % 3 === k).map((n) => `<span>${esc(n)}</span>`).join('<i aria-hidden="true">·</i>') + '<i aria-hidden="true">·</i>';
  const bigRows = [0, 1, 2].map((k) => `<div class="mq" data-mq="${k % 2 ? -1 : 1}" data-speed="${38 + k * 8}"><div class="mq-t">${rowNames(k)}</div><div class="mq-t">${rowNames(k)}</div></div>`).join('');

  // ---- the client loop: two rows that run opposite ways, faster when the page moves
  const logo = (c) => {
    if (c.word) return `<a class="logo" href="${u(`/work/${c.key}/`)}" tabindex="-1"><span class="logo-word">${esc(c.word[0])} <em>${esc(c.word[1])}</em></span><span class="logo-n">${esc(clientName(c))}</span></a>`;
    const f = `site/logos/${c.key}.webp`, d = imgSize(f);
    if (!d) return '';
    const a = d.w / d.h, h = Math.min(1.1, Math.max(0.5, 1.05 / Math.sqrt(a)));
    return `<a class="logo" href="${u(`/work/${c.key}/`)}" tabindex="-1" style="--w:${(h * a).toFixed(3)};--h:${h.toFixed(3)};--m:url(/${f})"><span class="logo-m"></span><span class="logo-n">${esc(clientName(c))}</span></a>`;
  };
  const you = `<a class="logo logo--you" href="#contact" tabindex="-1">${esc(t('yourLogo'))}</a>`;
  const half = Math.ceil(CLIENTS.length / 2);
  const row = (list, dir) => { const tt = list.map(logo).join('') + (dir > 0 ? you : ''); return `<div class="mq loop" data-mq="${dir}" data-speed="34" aria-hidden="true"><div class="mq-t">${tt}</div><div class="mq-t">${tt}</div></div>`; };

  const terrWords = C().territories || CONTENT.en.territories;
  const terr = TERRITORIES.map((tr, i) => {
    const w = terrWords[i] || CONTENT.en.territories[i];
    const proof = tr.proof.map(P).filter(Boolean).map((p) => `<a href="${u(`/work/${p.key}/`)}">${esc(p.title)}</a>`).join(', ');
    return `<li class="t" style="--i:${i}">
      <div class="t-row"><span class="t-num">${pad(i + 1)}</span><h3 class="t-title">${esc(w.title)}</h3><span class="t-plus" aria-hidden="true"></span></div>
      <div class="t-run" aria-hidden="true"><div class="t-run-t">${Array(4).fill(`<span>${esc(w.title)}</span><i>✦</i>`).join('')}</div><div class="t-run-t">${Array(4).fill(`<span>${esc(w.title)}</span><i>✦</i>`).join('')}</div></div>
      <div class="t-body"><p>${esc(w.body)}</p><div class="t-items">${w.items.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
        <p class="t-proof">${tr.proof.length ? `${esc(t('seenIn'))} ${proof}${tr.labs ? `, <a href="${u('/labs/')}">${esc(t('m_labs'))}</a>` : ''}${tr.also ? ` ${esc(t('and'))} <a href="${tr.also}" data-track="3d_cta_click" data-from="territory">${esc(t('theDesk'))}</a>` : ''}` : esc(t('experimental'))}</p></div>
    </li>`;
  }).join('');

  const pathRows = (C().path || CONTENT.en.path).map((r, i) => `<li style="--i:${i}"><span class="pt-dot" aria-hidden="true"></span><span class="pt-when">${esc(r.when)}</span><div><h3 class="pt-role">${esc(r.role)}</h3><span class="pt-org">${esc(r.org)}</span></div><p>${esc(r.body)}</p></li>`).join('');
  const DIFF = C().diff || CONTENT.en.diff;
  // (the stack row is the one that opens the usual list and closes Navy's: it is the last of his steps, the first of the usual)
  const diffUsual = DIFF.usual.map((s, i) => `<li${i === 0 ? ' class="is-stack"' : ''}><span class="n">${pad(i + 1)}</span><span class="diff-step">${esc(s)}</span></li>`).join('');
  const diffMine = DIFF.mine.map((s, i) => `<li${i === DIFF.mine.length - 1 ? ' class="is-stack"' : ''}><span class="n">${pad(i + 1)}</span><strong class="diff-step">${esc(s.step)}</strong><span class="diff-body">${esc(s.body)}</span></li>`).join('');
  const how = (C().process || CONTENT.en.process).map((s, i) => `<li style="--i:${i}"><span class="n">${pad(i + 1)}</span><strong>${esc(s.step)}</strong><span>${esc(s.body)}</span></li>`).join('');
  const layers = C().stack || CONTENT.en.stack;
  // the toolbox: how often each tool shows up in the work and, a click away, what was done with it (scripts/stack-tools.js)
  const TB = toolboxGrid({ M: stackModel({ D, gh: GH }), lang: LANG, layers: layers.map((x, i) => x || CONTENT.en.stack[i]), name: term, icon: toolMark, u, worlds: WORLDS.length });
  const contactLinks = D.SITE.links.filter((l) => l.label !== 'WhatsApp').map((l, i) => `<a href="${esc(l.href)}" target="_blank" rel="noopener" data-track="contact_click" data-channel="${esc(l.label)}" style="--i:${i}"><span>${esc(l.label === 'Résumé' ? t('resumePdf') : l.label)}</span>${arrow}</a>`).join('')
    + `<a href="${u('/cv/')}" data-track="contact_click" data-channel="Web CV" style="--i:${D.SITE.links.length}"><span>${esc(t('cv_web'))}</span>${arrowR}</a>`;
  // the desk as a turntable (public/site/turn, rendered from the engine by scripts/turntable.mjs): the teaser scrubs it with the scroll
  const countFrames = (pre) => { let n = 0; while (exists(`site/turn/${pre}${n}.webp`)) n++; return n; };
  const turnN = countFrames('desk-');
  // (each opens the desk where it was taken: the keyboard from above, GodPlan's world through its deep link)
  const deskSmall = [['site/desk-keys.webp', t('deskKeys'), t('deskKeysAlt'), '/3d/'], ['site/desk-world.webp', t('deskWorld'), t('deskWorldAlt'), '/3d/#project-godplan-erp']].filter(([f]) => exists(f));
  const posters = ['godplan-erp', 'godjah-studio', 'winfaith', 'flora-indonesia', 'fls-group-indonesia', 'dams-garage'].filter((k) => exists(`site/intro/${k}.webp`));
  const facts = t('facts').map((f) => fill(f, { n: clientSites.length }));
  const heroFacts = [t('fact_sites', { n: clientSites.length }), t('fact_godplan'), t('fact_stack')];
  const rotate = t('rotate');

  const ld = { '@context': 'https://schema.org', ...personLd(D, heroPhoto) };
  const faq = (C().faq || CONTENT.en.faq || []).map(([q, a]) => [q, fill(a, { n: clientSites.length })]);
  const faqLd = faq.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) } : null;

  // (the story lives at /full/: the home itself is the simple page, which carries the intro and the gate; see simplePage)
  return head({
    title: t('t_full'), description: t('d_home', { n: clientSites.length }), pathname: '/full/', css: ctx.css + STACK_CSS + TOOLBOX_CSS, imageAlt: t('ogHomeAlt'),
    extra: `${heroPreload}\n<script type="application/ld+json">${JSON.stringify(ld)}</script>\n${faqLd ? ldScript(faqLd) + '\n' : ''}`,
  }) + `
<body class="home">
${header('home', '/full/')}
<main id="main" tabindex="-1">
  <section class="hero" aria-label="${esc(t('inShort'))}" data-scene="hero">
    <div class="hero-media">${heroPhoto ? img(heroPhoto, t('heroAlt'), { eager: true, sizes: heroSizes }) : img(deskShot, t('heroDeskAlt'), { eager: true, cls: 'hero-desk', sizes: heroSizes })}</div>
    ${!heroPhoto && exists('site/portrait.webp') ? `<figure class="hero-portrait" data-cursor="${esc(t('heroHello'))}">${img('site/portrait.webp', 'Navy Gibran', { sizes: '(min-width: 900px) 19vw, 34vw' })}</figure>` : ''}
    <div class="hero-in wrap">
      <p class="hero-who">${kick(t('roleLine'))}</p>
      <p class="hero-title cap">${splitPair(t('heroTitle'), t('heroTitleEm'))}</p>
      <div class="hero-proof">
        <ul class="hero-facts" aria-label="${esc(t('atGlance'))}">${heroFacts.map((x, k) => `<li style="--i:${k}">${esc(x)}</li>`).join('')}</ul>
        <div class="hero-cta">
          <a class="btn btn-fill" href="#work" data-magnet>${roll(t('seeWork'))} ${arrowR}</a>
          <a class="btn" href="${esc(wa(D.SITE.whatsapp, t('waHello')))}" target="_blank" rel="noopener" data-track="contact_click" data-channel="WhatsApp" data-from="hero" data-magnet>${roll(t('chat'))} ${arrow}</a>
          <a class="btn btn-ghost" href="${esc(cvHref)}" target="_blank" rel="noopener" data-track="contact_click" data-channel="Résumé" data-from="hero">${roll(t('cv'))} ${arrow}</a>
        </div>
        <span class="hero-status lbl"><span class="dot dot--open" aria-hidden="true"></span>${esc(`${t('status')} · ${t('where')}`)}</span>
      </div>
    </div>
    <div class="hero-rot"><span class="lbl">${esc(t('navyBuilds'))}</span><span class="rot" aria-hidden="true"><span class="rot-t">${[...rotate, rotate[0]].map((r) => `<span>${esc(r)}</span>`).join('')}</span></span><span class="sr">${esc(t('rotateSr'))}</span></div>
    <span class="hero-corner hero-corner--l lbl"><span class="dot dot--open" aria-hidden="true"></span>${esc(`${t('status')} · ${t('where')}`)}</span>
    <a class="hero-corner hero-corner--r lbl" href="#work">${esc(t('selected'))} <i aria-hidden="true"></i></a>
  </section>

  <section class="who wrap" id="who" aria-labelledby="who-h" data-sec="${esc(t('about'))}">
    <div data-reveal>${kick(t('inShort'))}</div>
    <p class="who-p" data-split data-read>${splitPair(t('who'), t('whoEm'))}</p>
    <h1 class="who-h" id="who-h" data-reveal><span class="lbl">${esc(t('roleCountry'))}</span> <em>${esc(t('motto'))}</em></h1>
  </section>

  <section class="work" id="work" aria-label="${esc(t('selected'))}" data-scene="work" data-sec="${esc(t('selected'))}" data-hide-tab>
    <ol class="cases">${featured}</ol>
    <ol class="rail" aria-hidden="true">${rail}</ol>
  </section>

  <section class="rest" aria-labelledby="rest-h" data-sec="${esc(t('rest'))}">
    <div class="rest-head wrap">
      <div data-reveal>${kick(t('rest'))}</div>
      <h2 class="serif-h" id="rest-h" data-split>${splitPair(t('restTitle'), t('restEm'))}</h2>
    </div>
    <div class="bigq" aria-hidden="true">${MARK('bigq-mark')}${bigRows}</div>
    <div class="wrap">
      <p class="rest-note" data-reveal>${esc(t('restNote'))}</p>
      <ul class="index-list" data-stagger>${index}</ul>
      <a class="btn arc-more" href="${u('/work/')}" data-magnet data-reveal>${roll(t('archiveBtn'))} ${arrowR}</a>
    </div>
    <div class="ix-preview" aria-hidden="true"><img alt="" src="${BLANK}"></div>
  </section>

  <div class="cream" data-scene="cream">
    <section class="clients" id="clients" aria-labelledby="clients-h" data-sec="${esc(t('clients'))}">
      <div class="clients-head wrap">
        <div data-reveal>${kick(t('clients'))}</div>
        <h2 class="serif-h" id="clients-h" data-split>${splitPair(t('clientsTitle'), t('clientsEm'))}</h2>
        <p data-reveal>${esc(t('clientsLine', { n: clientSites.length })).replace(String(clientSites.length), `<span data-count="${clientSites.length}">${clientSites.length}</span>`)} <a class="clients-all" href="${u('/work/client-websites/')}" data-track="project_open" data-project="client-websites" data-from="clients">${esc(t('clientsAll', { n: clientSites.length }))} ${arrowR}</a></p>
      </div>
      ${row(CLIENTS.slice(0, half), 1)}
      ${row(CLIENTS.slice(half), -1)}
      <ul class="sr">${CLIENTS.map((c) => `<li>${esc(clientName(c))}</li>`).join('')}</ul>
    </section>

    <section class="diff wrap" id="difference" aria-labelledby="diff-h" data-sec="${esc(t('diff'))}">
      <div class="diff-head">
        <div data-reveal>${kick(t('diff'))}</div>
        <h2 class="serif-h" id="diff-h" data-split>${splitPair(t('diffTitle'), t('diffEm'))}</h2>
        <p data-reveal>${esc(t('diffLine'))}</p>
      </div>
      <div class="diff-cmp">
        <div class="diff-col diff-col--usual">
          <span class="lbl" data-reveal>${esc(t('diffUsualLbl'))}</span>
          <ol data-stagger>${diffUsual}</ol>
          <p class="diff-end" data-reveal>${esc(DIFF.usualEnd)}</p>
        </div>
        <div class="diff-col diff-col--mine">
          <span class="lbl" data-reveal>${esc(t('diffMineLbl'))}</span>
          <ol data-stagger>${diffMine}</ol>
          <p class="diff-end" data-reveal><em>${esc(DIFF.mineEnd[0])}</em> ${esc(DIFF.mineEnd[1])}</p>
        </div>
      </div>
    </section>
  </div>

  <section class="terr wrap" id="territories" aria-labelledby="terr-h" data-sec="${esc(t('whatIBuild'))}">
    <div class="terr-head">
      <div data-reveal>${kick(t('method'))}</div>
      <h2 class="serif-h" id="terr-h" data-split>${splitPair(t('terrTitle', { n: cap1(t('num')[TERRITORIES.length] || String(TERRITORIES.length)) }), t('terrEm'))}</h2>
      <p data-reveal><span class="if-hover">${esc(t('terrHover'))}</span>${esc(t('terrLine'))}</p>
    </div>
    <ol class="terr-list" data-stagger>${terr}</ol>
  </section>

  <div class="cream cream--path cream--under" data-scene="cream">
  <section class="path wrap" id="path" aria-labelledby="path-h" data-scene="path" data-sec="${esc(t('thePath'))}">
    <div class="path-grid">
      <div class="path-side">
        <div data-reveal>${kick(t('pathKick'))}</div>
        <h2 class="serif-h" id="path-h" data-split>${splitPair(t('pathTitle'), t('pathEm'))}</h2>
        <p data-reveal>${esc(t('pathLine', { facts: facts.join(' · ') }))}</p>
      </div>
      <ol class="path-list" data-stagger><span class="path-line" aria-hidden="true"><i></i></span>${pathRows}</ol>
    </div>
    <ol class="how" data-stagger data-sec="${esc(t('process'))}">${how}</ol>
    <div class="stack" data-sec="${esc(t('toolbox'))}">
      <div class="stack-head"><h2 class="serif-h" data-split>${splitPair(t('stackTitle'), t('stackEm'))}</h2><div data-reveal>${kick(t('stack'))}</div></div>
      ${TB.lead}
      ${TB.card}
      <div class="stack-grid" data-stagger>${TB.cols}</div>
      ${TB.legend}
    </div>
  </section>
  </div>
  ${TB.dialog}

  <section class="teaser" id="desk" aria-labelledby="desk-h" data-teaser data-scene="teaser" data-hide-tab data-sec="${esc(t('deskSec'))}">
    <div class="teaser-pin">
      <div class="teaser-frame">${img(deskShot, t('teaserAlt'), { cls: 'teaser-img', sizes: '100vw' })}${exists('site/desk-loop.mp4') ? `<video class="teaser-video" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1" data-webm="${exists('site/desk-loop.webm') ? '/site/desk-loop.webm' : ''}" data-mp4="/site/desk-loop.mp4"></video>` : ''}${turnN > 1 ? `<canvas class="teaser-turn" width="1280" height="720" data-n="${turnN}" aria-hidden="true"></canvas>` : ''}</div>
      <div class="teaser-corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <p class="teaser-top" aria-hidden="true"><span class="cap">${esc(t('thisIs'))}</span> <em>${esc(t('theDeskEm'))}</em></p>
      <div class="teaser-in wrap">
        ${kick(t('otherWay'))}
        <h2 id="desk-h" class="teaser-title cap">${splitPair(t('teaserTitle'), t('teaserEm'))}</h2>
        <p class="teaser-body">${esc(t('teaserBody', { w: '\u0001', d: '\u0002' })).replace('\u0001', `<span data-count="${D.WORLDS.length}">${D.WORLDS.length}</span>`).replace('\u0002', `<span data-count="${total}">${total}</span>`)}</p>
        <div class="teaser-row">
          <a class="btn btn-fill btn-lg" href="/3d/" data-track="3d_cta_click" data-from="teaser" data-magnet>${roll(t('enterDesk'))} ${arrow}</a>
          <span class="teaser-note">${esc(t('teaserNote'))}<span class="if-hover">${esc(t('orType'))}<kbd>d</kbd><kbd>e</kbd><kbd>s</kbd><kbd>k</kbd></span></span>
        </div>
        ${deskSmall.length ? `<div class="teaser-thumbs">${deskSmall.map(([f, cap, alt, href], i) => `<a href="${href}" data-track="3d_cta_click" data-from="teaser-thumb" data-cursor="${esc(t('cursorEnter'))}" style="--i:${i}"><figure>${img(f, alt, { sizes: '(min-width: 900px) 22vw, 45vw' })}<figcaption>${esc(cap.replace(/\s+\S+$/, ''))} <span class="nw">${esc(cap.split(' ').pop())} ${arrow}</span></figcaption></figure></a>`).join('')}</div>` : ''}
      </div>
    </div>
  </section>

  <section class="contact wrap" id="contact" aria-labelledby="contact-h" data-scene="contact" data-hide-tab data-sec="${esc(t('contact'))}">
    <div data-reveal>${kick(t('contact'))}</div>
    <h2 id="contact-h" class="contact-title cap" data-split>${splitPair(t('contactTitle'), t('contactEm'))}</h2>
    <div class="contact-grid">
      <div class="contact-left">
        <p data-reveal>${esc(t('contactLine'))}</p>
        <form class="brief" action="https://wa.me/${D.SITE.whatsapp}" method="get" target="_blank" data-reveal${D.SITE.email ? ` data-mail="${esc(D.SITE.email)}"` : ''}>
          <fieldset class="brief-kind">
            <legend class="lbl">${esc(t('building'))}</legend>
            ${t('kinds').map((k) => `<label class="pill"><input type="radio" name="kind" value="${esc(k)}"><span>${esc(LANG === 'en' ? k.replace(/^(An?|A) (.)/, (m, a, c) => c.toUpperCase()) : k)}</span></label>`).join('')}
          </fieldset>
          <label class="field"><span class="lbl">${esc(t('yourName'))}</span><input name="name" required autocomplete="name" placeholder="${esc(t('namePh'))}"><span class="field-msg" id="brief-name-msg" aria-hidden="true">${esc(t('nameMsg'))}</span></label>
          <label class="field"><span class="lbl">${esc(t('idea'))}</span><textarea name="text" rows="3" required placeholder="${esc(t('ideaPh'))}"></textarea><span class="field-msg" id="brief-text-msg" aria-hidden="true">${esc(t('ideaMsg'))}</span></label>
          <div class="brief-pv" aria-hidden="true"><span class="lbl">${esc(t('opensWith'))}</span><p class="brief-msg"></p></div>
          <div class="brief-send"><button class="btn btn-fill" type="submit" data-magnet>${roll(t('send'))} ${arrow}</button>${D.SITE.email ? `<button class="btn btn-ghost" type="button" data-mail-send>${roll(t('sendMail'))} ${arrow}</button>` : ''}</div>
        </form>
      </div>
      <div class="contact-actions">
        <span class="lbl contact-status" data-reveal><span class="dot dot--open" aria-hidden="true"></span>${esc(`${t('status')} · ${t('where')}`)}</span>
        <span class="lbl contact-or" data-reveal>${esc(t('straight'))}</span>
        <a class="btn btn-fill btn-lg" href="${esc(wa(D.SITE.whatsapp, t('waHello')))}" target="_blank" rel="noopener" data-track="contact_click" data-channel="WhatsApp" data-magnet data-reveal>${exists('site/avatar.webp') ? '<img class="btn-av" src="/site/avatar.webp" alt="" width="40" height="40" decoding="async">' : ''}${roll(t('chat'))} ${arrow}</a>
        <button class="copy" type="button" data-copy="+${D.SITE.whatsapp}" data-reveal><span class="copy-n">${esc(phone(D.SITE.whatsapp))}</span><span class="copy-a">${roll(t('copyNumber'))}</span></button>
        ${D.SITE.email ? `<button class="copy copy--mail" type="button" data-copy="${esc(D.SITE.email)}" data-reveal><span class="copy-n">${esc(D.SITE.email)}</span><span class="copy-a">${roll(t('copyEmail'))}</span></button>` : ''}
        <div class="contact-links" data-stagger>${contactLinks}</div>
      </div>
    </div>
    ${faq.length ? `<div class="faq" data-reveal><h3 class="lbl faq-t">${esc(C().faqTitle || CONTENT.en.faqTitle)}</h3>${faq.map(([q, a], i) => `<details class="faq-q"${i === 0 ? ' open' : ''}><summary>${esc(q)}<span class="faq-i" aria-hidden="true"></span></summary><p>${esc(a)}</p></details>`).join('')}</div>` : ''}
  </section>
</main>
${footer(D)}
` + tail(ctx.js + '\n' + TOOLBOX_JS);
}

// ---------- the case study on a project page: the problem, the approach, the decisions, what comes next (i18n-projects STORY)
function storySection(p) {
  const s = STORY[LANG]?.[p.key] || STORY.en[p.key];
  if (!s) return '';
  return `<section class="story wrap" aria-labelledby="story-h">
      <div class="story-head"><div data-reveal>${kick(t('storyKick'))}</div><h2 class="serif-h" id="story-h" data-split>${splitPair(t('storyTitle'), t('storyEm'))}</h2></div>
      <div class="story-grid">
        <div class="story-col" data-reveal><span class="lbl">${esc(t('problem'))}</span><p>${esc(s.problem)}</p></div>
        <div class="story-col" data-reveal><span class="lbl">${esc(t('approach'))}</span><p>${esc(s.approach)}</p></div>
      </div>
      <ol class="notes story-notes" data-stagger>${s.decisions.map((d, k) => `<li style="--i:${k}"><span class="n">${pad(k + 1)}</span><h3>${esc(d.title)}</h3><p>${esc(d.body)}</p></li>`).join('')}</ol>
      ${s.next ? `<p class="story-next" data-reveal><em>${esc(s.next)}</em></p>` : ''}
    </section>`;
}

// ---------- the architecture of GodPlan ERP, as a diagram the pointer can question: hover a module and its path to the API and
// the database lights, with a line that says what travels. Inline SVG, nothing fetched. The words are in i18n.js (arch).
// Two drawings in one <svg>: the wide one above 900 px, a standing one at or below it (the modules two by two, a spine down to the
// API, Docker and Next.js under it either side, the database at the foot), because the wide one shrunk to a phone left its words at
// six pixels. site/site.js lights every [data-mod] inside the outer <svg>, so both answer the same pointer and keys; CSS shows one.
// A line too long for its box breaks in two (a CJK character is about 1 em wide, a Latin letter about half; caps a little more).
const archWid = (s, em) => [...s].reduce((n, ch) => n + (/[\u2e80-\uffef]/.test(ch) ? 1 : em), 0);
function archWrap(s, maxEm, em = 0.52) {
  if (archWid(s, em) <= maxEm) return [s];
  const tok = s.match(/[A-Za-z0-9.+#'-]+|\s+|./gu) || [s];
  let line = '';
  for (let i = 0; i < tok.length; i++) {
    if (/^[\uff0c\u3002\u3001\uff1b\uff1a\uff01\uff1f\uff09]/.test(tok[i])) { line += tok[i]; continue; }   // (CJK punctuation ends a line, never starts one)
    if (line.trim() && archWid(line + tok[i], em) > maxEm) return [line.trim(), tok.slice(i).join('').trim()];
    line += tok[i];
  }
  return [s];
}
// a module: its name in one or two rows, centred in its box (the name is the button's label either way)
const archMod = ([k, label], x, y, w, h, fs) => {
  const ls = archWrap(label, (w - 14) / fs, 0.56);
  return `<g class="am" data-mod="${k}" tabindex="0" role="button" aria-label="${esc(label)}" aria-describedby="arch-say" transform="translate(${x}, ${y})"><rect width="${w}" height="${h}" rx="8"/>${ls.map((l, j) => `<text x="${w / 2}" y="${(h / 2 + fs * 0.34 + (j - (ls.length - 1) / 2) * (fs + 3)).toFixed(1)}" text-anchor="middle" aria-hidden="true">${esc(l)}</text>`).join('')}</g>`;
};
// a part (the API, the database, Docker, Next.js): its title and, under it, its line in one or two rows
const archPart = (cls, x, y, w, h, title, subs, tf, sf) => {
  const gap = sf + 4, top = (h - (tf + 6 + subs.length * gap)) / 2;
  return `<g class="an ${cls}" transform="translate(${x}, ${y})"><rect width="${w}" height="${h}" rx="10"/><text x="${w / 2}" y="${(top + tf * 0.8).toFixed(1)}" text-anchor="middle" class="at">${esc(title)}</text>${subs.map((l, j) => `<text x="${w / 2}" y="${(top + tf + 6 + sf * 0.8 + j * gap).toFixed(1)}" text-anchor="middle" class="as">${esc(l)}</text>`).join('')}</g>`;
};
function archWide(a, mods) {
  const W = 960, H = 400, mw = 120, gap = 14, my = 30, mh = 54, apiY = 170, dbY = 300;
  const mx0 = (W - (mods.length * mw + (mods.length - 1) * gap)) / 2;
  const cx = (i) => mx0 + i * (mw + gap) + mw / 2;
  const side = [archWrap(a.shipSub, 164 / 12), archWrap(a.uiSub, 164 / 12)], sh = Math.max(...side.map((x) => x.length)) > 1 ? 74 : 60, sy = apiY + 30 - sh / 2;
  return `<svg class="arch-wide" viewBox="0 0 ${W} ${H}" width="100%" height="100%" overflow="visible">
          ${mods.map((m, i) => `<path class="al" data-mod="${m[0]}" d="M${cx(i)} ${my + mh} C ${cx(i)} ${my + mh + 50}, ${W / 2} ${apiY - 40}, ${W / 2} ${apiY}"/>`).join('')}
          <path class="al al--db" d="M${W / 2} ${apiY + 60} L${W / 2} ${dbY}"/>
          <path class="al al--ui" d="M${W / 2 + 160} ${apiY + 30} L${W - 210} ${apiY + 30}"/>
          <path class="al al--ship" d="M${W / 2 - 160} ${apiY + 30} L${210} ${apiY + 30}"/>
          ${mods.map((m, i) => archMod(m, mx0 + i * (mw + gap), my, mw, mh, 15)).join('')}
          ${archPart('an--api', W / 2 - 160, apiY, 320, 60, a.api, archWrap(a.apiSub, 304 / 12), 17, 12)}
          ${archPart('an--db', W / 2 - 150, dbY, 300, 60, 'PostgreSQL', archWrap(a.dbSub, 284 / 12), 17, 12)}
          ${archPart('an--ui', W - 210, sy, 180, sh, a.ui, side[1], 17, 12)}
          ${archPart('an--ship', 30, sy, 180, sh, 'Docker', side[0], 17, 12)}
        </svg>`;
}
function archTall(a, mods) {
  const W = 360, mw = 160, mh = 46, colX = [14, 186], rowY = (r) => 2 + r * 56, spine = 180;
  const apiY = rowY(Math.ceil(mods.length / 2)) + 26, apiH = 62;
  const side = [archWrap(a.shipSub, 144 / 12.5), archWrap(a.uiSub, 144 / 12.5)], sh = Math.max(...side.map((x) => x.length)) > 1 ? 78 : 62;
  const sideY = apiY + apiH + 40, dbY = sideY + sh + 40, H = dbY + 64;
  return `<svg class="arch-tall" viewBox="0 0 ${W} ${H}" width="100%" height="100%" overflow="visible">
          ${mods.map(([k], i) => `<path class="al" data-mod="${k}" d="M${i % 2 ? colX[1] : colX[0] + mw} ${rowY(Math.floor(i / 2)) + mh / 2} H${spine} V${apiY}"/>`).join('')}
          <path class="al al--db" d="M${spine} ${apiY + apiH} V${dbY}"/>
          <path class="al al--ship" d="M${colX[0] + mw / 2} ${apiY + apiH} V${sideY}"/>
          <path class="al al--ui" d="M${colX[1] + mw / 2} ${apiY + apiH} V${sideY}"/>
          ${mods.map((m, i) => archMod(m, colX[i % 2], rowY(Math.floor(i / 2)), mw, mh, 15)).join('')}
          ${archPart('an--api', 30, apiY, 300, apiH, a.api, archWrap(a.apiSub, 284 / 13), 17, 13)}
          ${archPart('an--ship', colX[0], sideY, mw, sh, 'Docker', side[0], 16, 12.5)}
          ${archPart('an--ui', colX[1], sideY, mw, sh, a.ui, side[1], 16, 12.5)}
          ${archPart('an--db', 30, dbY, 300, 62, 'PostgreSQL', archWrap(a.dbSub, 284 / 13), 17, 13)}
        </svg>`;
}
function archSection(p) {
  if (p.key !== 'godplan-erp') return '';
  const a = t('arch');
  const mods = a.modules;   // [[key, label, note], ...]
  const tallH = (() => { const m = archTall(a, mods).match(/viewBox="0 0 360 (\d+(?:\.\d+)?)"/); return m ? +m[1] : 560; })();
  return `<section class="arch wrap" aria-labelledby="arch-h">
      <div class="inside-head"><div data-reveal>${kick(a.kick)}</div><h2 class="serif-h" id="arch-h" data-split>${splitPair(a.title, a.em)}</h2></div>
      <p class="arch-lead" data-reveal>${esc(a.lead)}</p>
      <figure class="arch-fig" data-reveal style="--tall:${tallH}">
        <svg class="arch-svg" role="group" aria-label="${esc(a.aria)}">
        ${archWide(a, mods)}
        ${archTall(a, mods)}
        </svg>
        <figcaption class="arch-say" id="arch-say" aria-live="polite" data-idle="${esc(a.idle)}">${esc(a.idle)}</figcaption>
      </figure>
      <script type="application/json" id="arch-notes">${JSON.stringify(Object.fromEntries(mods.map(([k, , note]) => [k, note]))).replace(/</g, '\\u003c')}</script>
    </section>`;
}

// ---------- one project
// "More like this": the three closest projects by kind and by the tools and industry words they share (as a share of all their
// words, so a long stack does not win by length), less a little for every page a project is already on, so every client site
// gets seen instead of the same few. Worked out once for the whole list, in the order the pages are walked.
const RELATED = new Map();
function relatedOf(list, p) {
  if (!RELATED.size) {
    const toks = (x) => new Set((x.stack || '').toLowerCase().split(' · ').filter(Boolean).concat((x.industry || '').toLowerCase().split(/[\s&,]+/).filter((w) => w.length > 3)));
    const pool = list.filter((x) => x.key !== 'client-websites' && x.date !== 'previous design'), used = {};
    for (const q of list) {
      const br = list.filter((x) => !isHub(x) || x.key === q.key), bi = br.indexOf(q), nx = br[(bi + 1) % br.length];
      const mine = toks(q), kind = kindOf(q);
      const pick = pool.filter((x) => x.key !== q.key && x.key !== nx.key)
        .map((x, k) => { const tx = toks(x), shared = [...tx].filter((w) => mine.has(w)).length, all = new Set([...tx, ...mine]).size; return { x, k, score: (kindOf(x) === kind ? 1 : 0) + (all ? (shared / all) * 2 : 0) - (used[x.key] || 0) * 0.35 }; })
        .sort((a, b) => b.score - a.score || a.k - b.k).slice(0, 3).map((r) => r.x);
      pick.forEach((x) => { used[x.key] = (used[x.key] || 0) + 1; });
      RELATED.set(q.key, pick);
    }
  }
  return RELATED.get(p.key) || [];
}

// the invitation that ends a page of work: the status, a question, WhatsApp pre-filled with the page's address, the number and the
// email to copy, the CV in the page's language. One per page (its heading id is pwa-h).
function waBand(D, { title, msg, from, project = '' }) {
  const cv = (D.SITE.links.find((l) => l.label === 'Résumé') || {}).href;
  const num = D.SITE.whatsapp ? phoneOf(D.SITE.whatsapp) : '';
  return `<section class="p-wa wrap" aria-labelledby="pwa-h">
    <div class="p-wa-in" data-reveal>
      <span class="p-wa-k"><span class="dot dot--open" aria-hidden="true"></span>${esc(t('status'))}</span>
      <h2 class="p-wa-t" id="pwa-h">${esc(title)}</h2>
      <p class="p-wa-l">${esc(t('pwaLine'))}</p>
      <div class="p-wa-row"><a class="btn btn-fill" href="${esc(wa(D.SITE.whatsapp, msg))}" target="_blank" rel="noopener" data-track="contact_click" data-channel="WhatsApp"${project ? ` data-project="${project}"` : ''} data-from="${from}" data-magnet>${exists('site/avatar.webp') ? '<img class="btn-av" src="/site/avatar.webp" alt="" width="40" height="40" decoding="async">' : ''}${roll(t('chat'))} ${arrowR}</a>${num ? `<button class="btn p-wa-mail p-wa-num" type="button" aria-label="${esc(t('copyNumber'))} ${esc(num)}" data-copy="+${esc(D.SITE.whatsapp)}" data-track="contact_click" data-channel="WhatsApp number"${project ? ` data-project="${project}"` : ''} data-from="${from}">${esc(num)}</button>` : ''}${D.SITE.email ? `<button class="btn p-wa-mail" type="button" aria-label="${esc(t('copyEmail'))} ${esc(D.SITE.email)}" data-copy="${esc(D.SITE.email)}" data-track="contact_click" data-channel="Email" data-from="${from}">${esc(D.SITE.email)}</button>` : ''}${cv ? `<a class="btn p-wa-cv" href="${esc(cv)}" download="${esc(cv.split('/').pop())}" data-track="cv_download" data-from="${from}">${roll(t('cv'))}</a>` : ''}</div>
    </div>
  </section>`;
}

function projectPage(D, ctx, p) {
  const list = workOrder(D.PROJECTS);
  // the arrows and "next project" walk the twenty-six projects (all three Gajah Terbang sites among them; the hub only from itself)
  const browse = list.filter((x) => !isHub(x) || x.key === p.key), bi = browse.indexOf(p);
  const next = browse[(bi + 1) % browse.length], prev = browse[(bi - 1 + browse.length) % browse.length];
  const m = projectMedia(D, p);
  const world0 = D.WORLDS.find((w) => w.project === p.key), world = world0 ? tw(world0) : null;
  const redesign = p.date === 'previous design' ? list.find((x) => x.url === p.url && x.key !== p.key) : null;
  // (the first of a company's two sites: `redesign` is the second; on the second, `first` is the first)
  const first = !redesign && p.url ? list.find((x) => x.date === 'previous design' && x.url === p.url && x.key !== p.key) : null;
  const toPage = (x, label) => `<a ${pAttrs(x)}>${label}</a>`;
  const live = redesign ? `<a class="btn btn-fill" ${pAttrs(redesign)} data-magnet>${roll(t('seeUpgrade', { t: redesign.title }))} ${arrowR}</a>` : p.url && !p.now ? `<a class="btn btn-fill" href="${esc(p.url)}" target="_blank" rel="noopener" data-track="project_live" data-project="${p.key}" data-magnet>${roll(t('visit', { h: host(p.url) }))} ${arrow}</a>` : '';
  const firstBtn = first ? `<a class="btn" ${pAttrs(first)} data-magnet>${roll(t('seeFirst'))} ${arrowR}</a>` : '';
  const similar = `<a class="btn btn-ghost" href="${esc(wa(D.SITE.whatsapp, t('waSimilar', { t: p.title })))}" target="_blank" rel="noopener" data-track="contact_click" data-channel="WhatsApp" data-project="${p.key}" data-magnet>${roll(t('similar'))} ${arrow}</a>`;
  const status = p.now ? t('nowIs', { t: p.now.name }) : p.date === 'live' ? (p.year ? t('liveBuilt', { y: p.year }) : t('live')) : p.date === 'previous design' ? t('firstVersion') : cap1(tp(p, 'date'));
  const tag = world ? world.tagline : tp(p, 'industry');
  // a business that has moved on under another name: said in words, with a link to where it is today (no picture)
  const now = p.now ? `<aside class="p-now" data-reveal>${kick(t('today'))}<p>${esc(t('nowNote', { t: p.title, n: '\u0001' })).replace('\u0001', `<a href="${esc(p.now.url)}" target="_blank" rel="noopener">${esc(p.now.name)} ${arrow}</a>`)}</p></aside>` : '';
  // one company, three sites, all Navy's (Gajah Terbang: the WordPress site, its Next.js upgrade at the same address, and Godtive,
  // whose `company` names the first): each page says so and points at the other two, so nobody wonders why a name repeats
  const v1 = redesign ? p : first || (p.company ? list.find((x) => x.key === p.company) : null);
  const v2 = v1 && list.find((x) => x.url === v1.url && x.key !== v1.key), v3 = v1 && list.find((x) => x.company === v1.key);
  const toWp = (x) => toPage(x, `${esc(t('aWordPressSite'))} ${arrowR}`), toNamed = (x) => toPage(x, `${esc(x.title)} ${arrowR}`);
  const pairNote = (key, a, b) => `<aside class="p-now" data-reveal>${kick(t('pairKick'))}<p>${esc(t(key, { t: v1.title, link: '\u0001', link2: '\u0002', link3: '\u0002' })).replace('\u0001', a).replace('\u0002', b)}</p></aside>`;
  const pair = !v1 || !v2 || !v3 ? '' : p === v1 ? pairNote('pairFirst', toNamed(v2), toNamed(v3)) : p === v2 ? pairNote('pairSecond', toWp(v1), toNamed(v3)) : pairNote('pairThird', toWp(v1), toNamed(v2));
  // what Navy did on it, in short lines (data.js `did`), with his role and, for GodPlan, the modules of the system
  const didList = tp(p, 'did'), role = tp(p, 'role'), modules = tp(p, 'modules');
  const did = didList ? `<section class="did wrap" aria-labelledby="did-h">
      <div class="did-grid">
        <div class="did-side"><div data-reveal>${kick(t('whatIDid'))}</div><h2 class="serif-h" id="did-h" data-split>${splitPair(t('didTitle'), t('didEm'))}</h2>${role ? `<p class="did-role" data-reveal><span class="lbl">${esc(t('roleLbl'))}</span>${esc(role)}</p>` : ''}</div>
        <ol class="did-list" data-stagger>${didList.map((d, k) => `<li style="--i:${k}"><span class="n">${pad(k + 1)}</span><p>${esc(d)}</p></li>`).join('')}</ol>
      </div>
      ${modules ? `<div class="did-mods" data-reveal><span class="lbl">${esc(t('modules'))}</span><ul>${modules.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    </section>` : '';
  const inside = world ? `<section class="inside wrap" aria-labelledby="inside-h">
      <div class="inside-head"><div data-reveal>${kick(t('inside'))}</div><h2 class="serif-h" id="inside-h" data-split>${split(cap1(world.tagline) + (LANG === 'zh' ? '。' : '.'))}</h2></div>
      <ol class="notes" data-stagger>${Object.values(world.hotspots).map((h, k) => `<li style="--i:${k}"><span class="n">${pad(k + 1)}</span><h3>${esc(h.title)}</h3><p>${esc(LANG === 'en' ? h.body.replace(/\bthis (floor|street)\b/g, 'its 3D $1') : h.body)}</p></li>`).join('')}</ol>
    </section>` : '';
  const sitesList = list.filter((x) => x.url && x.date !== 'previous design');
  const sites = p.key === 'client-websites' ? `<section class="wrap sites-all" aria-labelledby="sites-h"><div class="inside-head"><div data-reveal>${kick(t('allN', { n: sitesList.length }))}</div><h2 class="serif-h" id="sites-h" data-split>${splitPair(t('everySiteTitle'), t('everySiteEm'))}</h2></div>
      <ul class="index-list" data-stagger>${sitesList.map((x, k) => `<li style="--i:${k}"><a ${pAttrs(x)}><span class="ix-n">${pad(k + 1)}</span>${(() => { const c = projectMedia(D, x).cover, c4 = c && c.replace(/\.webp$/, '-384.webp'); return c ? `<span class="ix-thumb" aria-hidden="true"><img src="/${c}"${exists(c4) ? ` srcset="/${c4} 384w" sizes="96px"` : ''} alt="" loading="lazy" decoding="async" width="96" height="60"></span>` : '<span class="ix-thumb ix-thumb--none" aria-hidden="true"></span>'; })()}<span class="ix-name">${esc(x.title)}</span><span class="ix-ind">${esc(tp(x, 'industry'))}</span><span class="ix-stack">${esc(stackOf(x))}</span><span class="ix-go" aria-hidden="true">${arrowR}</span></a></li>`).join('')}</ul></section>` : '';
  const gallery = m.shots.length > 1 ? `<section class="gallery wrap" aria-label="${esc(t('screenshots'))}">
      ${m.shots.slice(1).map((s, k) => `<figure class="shot g-${k % 3}" data-reveal="clip">${img(s, t('screenshotN', { t: p.title, n: k + 2 }), { sizes: k % 3 ? '(min-width: 900px) 62vw, 100vw' : '(min-width: 1100px) 1300px, 100vw' })}</figure>`).join('')}
    </section>` : '';
  const desc = strip(tp(p, 'description'));
  // a description too thin for a search result or a share preview borrows the first line of what Navy did on the project
  // (already on the page, in this language), only when the result still fits metaCut's limit whole
  const did0 = didList && didList[0] ? String(didList[0]).replace(/\s+/g, ' ').trim() : '';
  const descN = desc.replace(/\s+/g, ' ').trim();
  const thinPlus = did0 && /[.!?。！？]$/.test(descN) && descN.length < (LANG === 'zh' ? 45 : 100) ? (LANG === 'zh' ? `${descN}${did0}。` : `${descN} ${cap1(did0)}.`) : '';
  const metaDesc = thinPlus && metaCut(thinPlus) === thinPlus ? thinPlus : metaCut(desc);
  // (a project that is now something else says so in its "Today" note: the opening paragraph leaves that sentence to it)
  const lead = p.now ? desc.split(/(?<=[.。])\s*/).filter((x) => x && !/^RameinAja (is now|kini|现已)/.test(x)).join(LANG === 'zh' ? '' : ' ') : desc;
  const related = relatedOf(list, p);
  const more = related.length ? `<section class="more wrap" aria-labelledby="more-h">
      <div class="more-head" data-reveal>${kick(t('moreLike'))}<h2 class="sr" id="more-h">${esc(t('moreLike'))}</h2></div>
      <ul class="more-list" data-stagger>${related.map((x, k) => moreCard(D, x, k, 'related')).join('')}</ul>
    </section>` : '';
  // the invitation before "Next project": the status, "want something like this?", WhatsApp pre-filled with this project, the email
  const band = waBand(D, isHub(p)
    ? { title: t('pwaTitleSites'), msg: `${t('waHello')} ${ORIGIN}${u(`/work/${p.key}/`)}`, from: 'hub-band' }
    : { title: t('pwaTitle', { t: p.title }), msg: `${t('waSimilar', { t: p.title })} ${ORIGIN}${u(`/work/${p.key}/`)}`, from: 'project-band', project: p.key });
  const pathname = `/work/${p.key}/`;

  // the project for search engines: its own @id (the /work/ list names the same node), Navy named as its creator (his full entry lives on the home), its live address as sameAs only while that address still serves this site
  const ld = { '@context': 'https://schema.org', '@type': 'CreativeWork', '@id': `${ORIGIN}${u(pathname)}#work`, name: p.title, description: desc, url: `${ORIGIN}${u(pathname)}`, inLanguage: L.html, creator: { '@type': 'Person', '@id': PERSON_ID, name: 'Navy Gibran', url: `${ORIGIN}/` }, ...(p.year ? { dateCreated: String(p.year) } : {}), keywords: p.stack.split(' · ').join(', '), ...(p.url && !p.now && p.date !== 'previous design' ? { sameAs: p.url } : {}), ...(m.cover ? { image: `${ORIGIN}/${m.cover}` } : {}) };
  // where the page sits, for search results: the portfolio, then this project
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Navy Gibran', item: `${ORIGIN}${u('/')}` },
    { '@type': 'ListItem', position: 2, name: t('m_work'), item: `${ORIGIN}${u('/work/')}` },
    { '@type': 'ListItem', position: 3, name: p.title, item: `${ORIGIN}${u(pathname)}` },
  ] };
  return head({
    title: `${p.title}${LANG === 'zh' ? '：' : ': '}${tp(p, 'industry')} | Navy Gibran`,
    description: metaDesc,
    pathname, css: ctx.css,
    image: exists(`site/og/${p.key}.jpg`) ? `${ORIGIN}/site/og/${p.key}.jpg` : undefined, imageAlt: t('ogProjectAlt', { t: p.title }), theme: tint(p).bg,
    labels: [[t('stackLbl'), stackOf(p)], [p.date === 'live' ? t('statusLbl') : t('when'), status]],
    extra: `${ldScript(ld)}\n${ldScript(crumbs)}\n`,
  }) + `
<body class="project" data-project="${p.key}" data-prev="${u(`/work/${prev.key}/`)}" data-prev-bg="${tint(prev).bg}" data-prev-name="${esc(prev.title)}" data-next="${u(`/work/${next.key}/`)}" data-next-bg="${tint(next).bg}" data-next-name="${esc(next.title)}" style="--acc:${tint(p).acc};--bgc:${tint(p).bg}">
${header('work', pathname)}
<main id="main" tabindex="-1">
  <article>
    <div class="p-top">
    <header class="p-head wrap" data-scene="phead">
      <div class="p-crumbs" data-reveal><a href="${u('/work/')}">${esc(t('allWork'))}</a><span class="p-count">${isHub(p) ? esc(t('everySite')) : `<span class="pc-w">${esc(t('project'))}</span>${pad(bi + 1)} / ${pad(browse.length)}`}<span class="keys">${[[prev, '←', 'prevProject'], [next, '→', 'nextProject']].map(([q, k, w]) => `<a ${pAttrs(q, 'step')} aria-label="${esc(t(w, { t: q.title }))}"><kbd>${k}</kbd></a>`).join('')}<i aria-hidden="true">${esc(t('toBrowse'))}</i></span></div>
      <span class="p-kick" data-reveal>${kick(tag)}</span>
      <h1 class="p-title cap" data-split>${split(p.title)}</h1>
      <div class="p-grid">
        <p class="p-lead" data-reveal>${esc(lead)}</p>
        <div class="p-actions" data-reveal>${live}${firstBtn}${p.code ? `<a class="btn" href="${esc(p.code)}" target="_blank" rel="noopener" data-track="contact_click" data-channel="GitHub" data-project="${p.key}" data-magnet>${roll(t('readCode'))} ${arrowR}</a>` : ''}${similar}</div>
        <dl class="p-meta" data-stagger>
          <div style="--i:0"><dt>${esc(t('industry'))}</dt><dd>${esc(tp(p, 'industry'))}</dd></div>
          <div style="--i:1"><dt>${esc(t('stackLbl'))}</dt><dd>${esc(stackOf(p))}</dd></div>
          ${role ? `<div style="--i:2"><dt>${esc(t('roleLbl'))}</dt><dd>${esc(role)}</dd></div>` : ''}
          <div style="--i:2"><dt>${esc(p.date === 'live' ? t('statusLbl') : t('when'))}</dt><dd>${esc(status)}</dd></div>
          ${p.url ? `<div style="--i:3"><dt>${esc(t('address'))}</dt><dd>${p.now ? `${esc(host(p.url))} <span class="was">${esc(t('formerAddress'))}</span>` : redesign ? `${esc(host(p.url))} <span class="was">${esc(t('servesUpgrade'))}</span>` : `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(host(p.url))}</a>`}</dd></div>` : ''}
          ${p.code ? `<div style="--i:4"><dt>${esc(t('codeLbl'))}</dt><dd><a href="${esc(p.code)}" target="_blank" rel="noopener">${esc(p.code.replace(/^https:\/\//, ''))}</a></dd></div>` : ''}
        </dl>
      </div>
      ${now}${pair}
    </header>
    <div class="p-hero wrap" data-scene="phero">
      ${m.cover ? `<figure class="shot shot-main" data-reveal="clip">${img(m.cover, t('screenshot', { t: p.title }), { eager: true, sizes: '(min-width: 1100px) 1100px, 100vw' })}${m.phone ? `<div class="phone">${img(m.phone, t('onPhone', { t: p.title }), { eager: true, copyW: 320, sizes: '(min-width: 694px) 220px, 104px' })}</div>` : ''}</figure>` : `<div class="shot shot-main" data-reveal="clip">${plate(p, true)}</div>`}
    </div>
    </div>
    ${did}
    ${storySection(p)}
    ${archSection(p)}
    ${inside}
    ${sites}
    ${gallery}
  </article>
  ${more}
  ${band}
  <nav class="p-next wrap" aria-label="${esc(t('nextLbl'))}" data-scene="pnext">
    <a ${pAttrs(next)} data-cursor="${esc(t('cursorNext'))}" style="--nbg:${tint(next).bg}"${projectMedia(D, next).cover ? ` data-preview="/${projectMedia(D, next).cover}"` : ''}><span class="lbl">${esc(t('nextLbl'))}</span><span class="p-next-t">${esc(next.title)} ${arrowR}</span><span class="ind">${esc(tp(next, 'industry'))}</span></a>
  </nav>
  <div class="ix-preview" aria-hidden="true"><img alt="" src="${BLANK}"></div>
</main>
${footer(D)}
` + tail(ctx.js);
}

// ---------- the archive: /work/, every project as a card, filtered by the kind of work
function archivePage(D, ctx) {
  const list = counted(D);
  const counts = Object.fromEntries(KIND_KEYS.map((k) => [k, list.filter((p) => kindOf(p) === k).length]));
  const pills = [['all', t('all'), list.length], ...KIND_KEYS.map((k) => [k, kindLabel(k), counts[k]])]
    .map(([k, label, n]) => `<button type="button" class="pill-f" data-kind="${k}" aria-pressed="${k === 'all'}"><span>${esc(label)}</span><span class="c">${n}</span></button>`).join('');
  const cards = list.map((p, i) => {
    const m = projectMedia(D, p);
    return `<li class="arc-card" data-kind="${kindOf(p)}" style="--i:${i % 9}"><a ${pAttrs(p, 'archive')} data-cursor="${esc(t('cursorView'))}">
      <span class="arc-pic">${m.cover ? img(m.cover, t('screenshot', { t: p.title }), { sizes: '(min-width: 1100px) 31vw, (min-width: 560px) 46vw, 92vw' }) : plate(p)}</span>
      <span class="arc-n">${pad(i + 1)}</span><span class="arc-t">${esc(p.title)}</span><span class="arc-i">${esc(industryLine(p))}</span><span class="arc-s">${esc(stackOf(p))}</span>
    </a></li>`;
  }).join('');
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': `${ORIGIN}${u('/work/')}#page`, name: t('t_work'), url: `${ORIGIN}${u('/work/')}`, inLanguage: L.html, isPartOf: { '@id': `${ORIGIN}/#website` }, hasPart: list.map((p) => ({ '@type': 'CreativeWork', '@id': `${ORIGIN}${u(`/work/${p.key}/`)}#work`, name: p.title, url: `${ORIGIN}${u(`/work/${p.key}/`)}` })) },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Navy Gibran', item: `${ORIGIN}${u('/')}` },
      { '@type': 'ListItem', position: 2, name: t('m_work'), item: `${ORIGIN}${u('/work/')}` },
    ] },
  ] };
  return head({
    title: t('t_work'), description: t('d_work', { n: list.length }), pathname: '/work/', css: ctx.css,
    image: exists('site/og/work.jpg') ? `${ORIGIN}/site/og/work.jpg` : undefined, imageAlt: t('ogWorkAlt'),
    extra: `${ldScript(ld)}\n`,
  }) + `
<body class="archive">
${header('work', '/work/')}
<main id="main" tabindex="-1">
  <section class="arc wrap" aria-labelledby="arc-h">
    <div class="p-crumbs" data-reveal><a href="${u('/')}">${esc(t('backHome'))}</a><span>${esc(t('nProjects', { n: list.length }))}</span></div>
    <span class="p-kick" data-reveal>${kick(t('archive'))}</span>
    <h1 class="p-title cap" id="arc-h" data-split>${splitPair(t('allThe'), t('workEm'))}</h1>
    <p class="p-lead arc-lead" data-reveal>${esc(t('archiveLead', { n: list.length }))}</p>
    <p class="arc-hub" data-reveal><a href="${u('/work/client-websites/')}">${esc(t('arcHub', { n: D.PROJECTS.filter((p) => p.url && p.date !== 'previous design').length }))} ${arrowR}</a></p>
    <div class="arc-filters" role="group" aria-label="${esc(t('showByKind'))}" data-reveal>${pills}<button type="button" class="pill-q" data-palette aria-label="${esc(t('searchAria'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><span>${esc(t('search'))}</span><kbd data-kbd>Ctrl K</kbd></button></div>
    <p class="sr" role="status" id="arc-status"></p>
    <ol class="arc-grid" data-stagger>${cards}</ol>
    <div class="arc-dock" role="group" aria-label="${esc(t('showByKind'))}" hidden><div class="arc-dock-t">${pills}</div></div>
  </section>
${waBand(D, { title: t('pwaTitleWork'), msg: `${t('waHello')} ${ORIGIN}${u('/work/')}`, from: 'archive-band' })}
</main>
${footer(D)}
` + tail(ctx.js);
}

// ---------- labs: Navy's own experiments (scripts/labs.js holds the page's body, its CSS and its meta; the same bones as the archive)
// (two chapters: the worlds first, scripts/labs-worlds.js, then the GitHub experiments as a chapter of their own)
function labsPage(D, ctx) {
  // (the worlds and the experiments speak the page's language: scripts/labs-worlds.js and labs.js hold their translations)
  const M = labsMetaFor(LANG), labsCount = M.count;
  // what search engines read: the page in the site, the worlds (CreativeWork) and the experiments (SoftwareSourceCode) as its list,
  // and where it sits; the author is named, since the Person's full entry lives on the home
  const pageUrl = `${ORIGIN}${u('/labs/')}`, me = { '@type': 'Person', '@id': PERSON_ID, name: 'Navy Gibran', url: `${ORIGIN}/` };
  const LIC = { MIT: 'https://opensource.org/licenses/MIT', 'Apache 2.0': 'https://www.apache.org/licenses/LICENSE-2.0' };
  const wl = worldsFor(LANG), ll = labsFor(LANG);
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': `${pageUrl}#page`, url: pageUrl, name: M.title, description: M.pageDescription, inLanguage: L.html, isPartOf: { '@id': `${ORIGIN}/#website` }, author: me,
      mainEntity: { '@type': 'ItemList', numberOfItems: wl.length + ll.length, itemListElement: [
        ...wl.map((w, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'CreativeWork', name: w.name, description: w.tagline, url: w.url, genre: w.category, creator: me, ...(exists(`site/labs/${w.key}.webp`) ? { image: `${ORIGIN}/site/labs/${w.key}.webp` } : {}) } })),
        ...ll.map((l, j) => { const gh = (l.links || []).find(([n]) => n === 'GitHub')?.[1]; return { '@type': 'ListItem', position: wl.length + j + 1, item: { '@type': 'SoftwareSourceCode', name: l.name, description: l.line, ...(gh ? { codeRepository: gh } : {}), programmingLanguage: l.lang, ...(LIC[l.license] ? { license: LIC[l.license] } : {}), author: me } }; }),
      ] } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Navy Gibran', item: `${ORIGIN}${u('/')}` },
      { '@type': 'ListItem', position: 2, name: M.menu.label, item: pageUrl },
    ] },
  ] };
  return head({ title: M.title, description: M.pageDescription, pathname: '/labs/', css: ctx.css + LABS_CSS + WORLDS_CSS, image: exists('site/og/labs.jpg') ? `${ORIGIN}/site/og/labs.jpg` : undefined, imageAlt: M.imageAlt, extra: `${ldScript(ld)}\n` }) + `
<body class="archive labs-page">
${header('labs', '/labs/')}
<main id="main" tabindex="-1">
${worldsSection({ t, u, splitPair, labsCount, exists, img, lang: LANG })}
${labsMain({ exists, img, splitPair, lang: LANG, chapter: { kick: t('lw_moreKick'), title: t('lw_moreTitle'), em: t('lw_moreEm') } })}
${waBand(D, { title: t('pwaTitleLabs'), msg: `${t('waHello')} ${ORIGIN}${u('/labs/')}`, from: 'labs-band' })}
</main>
${footer(D)}
` + tail(ctx.js);
}

// ---------- the CV as a page: one screen, printable, the same facts as the rest of the site (the PDF stays the download)
function cvPage(D, ctx) {
  const P = (k) => D.PROJECTS.find((p) => p.key === k);
  const clientSites = D.PROJECTS.filter((p) => p.url && p.date !== 'previous design');
  const pathAll = C().path || CONTENT.en.path, layers = C().stack || CONTENT.en.stack;
  // the rows are the same in every language; the English ones say which are schooling (`edu`), the rest is experience
  const isEdu = (r, i) => !!(r.edu ?? CONTENT.en.path[i]?.edu);
  const edu = pathAll.filter(isEdu), exp = pathAll.filter((r, i) => !isEdu(r, i));
  const pdf = D.SITE.links.find((l) => l.label === 'Résumé')?.href;
  const links = D.SITE.links.filter((l) => l.label !== 'Résumé');
  const facts = t('facts').map((f) => fill(f, { n: clientSites.length }));
  const SM = stackModel({ D, gh: GH }), byUse = (items) => items.map((x, k) => [x, k]).sort((a, b) => (SM.tools[b[0]]?.places || 0) - (SM.tools[a[0]]?.places || 0) || a[1] - b[1]).map(([x]) => x);
  // a selected project as a recruiter reads it: the role, then the first thing built (the page's address shows when printed)
  const sel = FEATURED.map((f) => P(f.key)).filter(Boolean).map((p) => { const did = tp(p, 'did') || p.did || [], role = tp(p, 'role') || p.role;
    return `<li><a ${pAttrs(p, 'cv')} data-print="navygibran.dev${u(`/work/${p.key}/`)}"><b>${esc(p.title)}</b></a><span class="cv-stack">${esc(stackOf(p))}</span>${role ? `<span class="cv-prole">${esc(role)}</span>` : ''}<p>${esc(did[0] || featuredText(p.key).line)}</p></li>`; }).join('');
  const OSS = ['flowkite', 'curb', 'mydesk'].map((k) => labsFor(LANG).find((l) => l.key === k)).filter(Boolean);
  const oss = OSS.map((l) => { const gh = l.links.find(([n]) => n === 'GitHub')?.[1], live = l.links.find(([n]) => n === 'Live')?.[1];
    const href = live && live.startsWith('/') ? `${ORIGIN}${live}` : live || gh;
    return `<li><a href="${esc(href)}" target="_blank" rel="noopener" data-print="${esc((gh || href).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}" data-track="lab_open" data-lab="${l.key}" data-channel="cv"><b>${esc(l.name)}</b></a><span class="cv-stack">${esc(l.stack.join(' · '))}</span><p>${esc(l.line)}</p></li>`; }).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'ProfilePage', name: `${t('cv_title')} | Navy Gibran`, url: `${ORIGIN}${u('/cv/')}`, inLanguage: L.html, mainEntity: { '@id': PERSON_ID, ...personLd(D) } };
  return head({ title: `${t('cv_title')} | Navy Gibran`, description: t('cv_desc'), pathname: '/cv/', css: ctx.css, ...(exists('site/og/cv.jpg') ? { image: `${ORIGIN}/site/og/cv.jpg`, imageAlt: t('ogCvAlt') } : { imageAlt: t('ogDefaultAlt') }), extra: `<script type="application/ld+json">${JSON.stringify(ld)}</script>\n` }) + `
<body class="cv-page">
${header('cv', '/cv/')}
<main id="main" class="wrap cv" tabindex="-1">
  <div class="p-crumbs" data-reveal><a href="${u('/')}">${esc(t('backHome'))}</a><span class="cv-tools"><button type="button" class="cv-print" onclick="print()">${esc(t('cv_print'))}</button>${pdf ? ` <a href="${esc(pdf)}" target="_blank" rel="noopener" data-track="contact_click" data-channel="Résumé" data-from="cv">${esc(t('cv_pdf'))} ↗</a>` : ''}</span></div>
  <header class="cv-head">
    <span class="p-kick" data-reveal>${kick(t('cv_kick'))}</span>
    <h1 class="p-title cap" data-split>${split('Navy Gibran')}</h1>
    <p class="cv-role" data-reveal>${esc(t('role'))} · ${esc(t('where'))} · <span class="dot dot--open" aria-hidden="true"></span> ${esc(t('status'))}</p>
    <p class="cv-lead" data-reveal>${esc(t('cv_lead'))}</p>
    <ul class="hero-facts cv-facts" data-reveal>${facts.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="cv-actions" data-reveal>${pdf ? `<a class="btn btn-fill" href="${esc(pdf)}" download="${esc(pdf.split('/').pop())}" data-track="contact_click" data-channel="Résumé" data-from="cv-button" data-magnet>${roll(t('cv_download'))} ${arrowD}</a>` : ''}<a class="btn" href="${esc(wa(D.SITE.whatsapp, t('waHello')))}" target="_blank" rel="noopener" data-track="contact_click" data-channel="WhatsApp" data-from="cv" data-magnet>${roll(t('chat'))} ${arrow}</a></div>
  </header>
  <div class="cv-grid">
    <section class="cv-main">
      <h2 class="lbl">${esc(t('inShort'))}</h2>
      <p class="cv-sum">${esc(t('who'))} ${esc(t('whoEm'))}</p>
      <h2 class="lbl">${esc(t('cv_exp'))}</h2>
      <ol class="cv-list">${exp.map((r) => `<li><span class="cv-when">${esc(r.when)}</span><div><h3>${esc(r.role)}</h3><span class="cv-org">${esc(r.org)}</span><p>${esc(r.body)}</p></div></li>`).join('')}</ol>
      <h2 class="lbl">${esc(t('cv_edu'))}</h2>
      <ol class="cv-list">${edu.map((r) => `<li><span class="cv-when">${esc(r.when)}</span><div><h3>${esc(r.role)}</h3><span class="cv-org">${esc(r.org)}</span><p>${esc(r.body)}</p></div></li>`).join('')}</ol>
      <h2 class="lbl">${esc(t('cv_sel'))}</h2>
      <ul class="cv-sel">${sel}</ul>
      ${oss ? `<h2 class="lbl">${esc(t('cv_oss'))}</h2>
      <ul class="cv-sel cv-oss">${oss}</ul>` : ''}
    </section>
    <aside class="cv-side">
      <h2 class="lbl">${esc(t('cv_contact'))}</h2>
      <ul class="cv-links">${D.SITE.email ? `<li><a href="mailto:${esc(D.SITE.email)}">${esc(D.SITE.email)}</a></li>` : ''}<li><a href="${esc(wa(D.SITE.whatsapp, t('waHello')))}" target="_blank" rel="noopener">${esc(phone(D.SITE.whatsapp))}</a></li>${links.filter((l) => l.label !== 'WhatsApp' && l.label !== 'Email').map((l) => `<li><a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}: ${esc(l.href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a></li>`).join('')}<li><a href="${ORIGIN}${u('/')}">navygibran.dev</a></li></ul>
      <h2 class="lbl">${esc(t('cv_skills'))}</h2>
      <p class="cv-skill-key">${esc(t('cv_bold'))}</p>
      ${STACK.map((items, i) => `<div class="cv-skill"><span class="cv-layer">${esc(layers[i] || CONTENT.en.stack[i])}</span><span>${byUse(items).map((x) => (SM.tools[x]?.level === 3 ? `<b>${esc(term(x))}</b>` : esc(term(x)))).join(' · ')}</span></div>`).join('')}
      <h2 class="lbl">${esc(t('cv_lang'))}</h2>
      <p class="cv-langs">${esc(t('cv_langLine'))}</p>
    </aside>
  </div>
</main>
${footer(D)}
` + tail(ctx.js);
}

function notFound(D, ctx) {
  return head({ title: `${t('nf')} | Navy Gibran`, description: t('nfDesc'), pathname: '/404', css: ctx.css, noindex: true, nfSwap: LANG === DEFAULT_LANG }) + `
<body class="nf">
${header('', '/')}
<main id="main" class="wrap nf-in" tabindex="-1">
  ${kick('404')}
  <h1 class="p-title cap" data-split>${splitPair(t('nothing'), t('hereEm'))}</h1>
  <p class="p-lead" data-reveal>${esc(t('nfLine'))}</p>
  <div class="p-actions" data-reveal><a class="btn btn-fill" href="${u('/')}" data-magnet>${roll(t('backPortfolio'))} ${arrowR}</a><a class="btn" href="${u('/work/')}" data-magnet>${roll(t('f_all'))} ${arrowR}</a><a class="btn btn-ghost" href="${esc(wa(D.SITE.whatsapp, t('waHello')))}" target="_blank" rel="noopener" data-track="contact_click" data-channel="WhatsApp" data-from="404" data-magnet>${roll(t('chat'))} ${arrow}</a></div>
  <section class="more nf-more" aria-labelledby="nf-more-h">
    <div class="more-head" data-reveal>${kick(t('startHere'))}<h2 class="sr" id="nf-more-h">${esc(t('startHere'))}</h2></div>
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

// ---------- the intro (once a visit, on the home): posters of the work, the mark, the name; then the gate, two doors, Simple (this
// page) or Full (the story at /full/). The page script shows the gate once the name has played and skips it once a reading has been
// chosen; the choice is remembered (nv-view), the header's switch changes it
function introHtml(D, faceSet = '', faceSizes = '') {
  const posters = ['godplan-erp', 'godjah-studio', 'winfaith', 'flora-indonesia', 'fls-group-indonesia', 'dams-garage'].filter((k) => exists(`site/intro/${k}.webp`));
  const deskShot = exists('site/desk-wide-800.webp') ? 'site/desk-wide-800.webp' : exists('site/desk-wide.webp') ? 'site/desk-wide.webp' : 'og.png';
  return `<div class="intro" id="intro">
  <div class="intro-posters" aria-hidden="true">${posters.map((k, i) => `<figure style="--i:${i}"><img src="/site/intro/${k}.webp" alt="" width="240" height="320" loading="lazy" decoding="async">${MARK()}</figure>`).join('')}</div>
  <div class="intro-in" aria-hidden="true">${MARK('intro-mark')}<div class="intro-word"><div class="iw-o"><span>Navy</span><span>Gibran</span></div><div class="iw-f"><span>Navy</span><span>Gibran</span></div></div><div class="intro-sub">${esc(t('role'))}</div></div>
  <div class="intro-gate" role="dialog" aria-modal="true" aria-labelledby="intro-gate-t" hidden>
    <span class="kick">${esc(t('gateKick'))}</span>
    <h2 class="intro-gate-t" id="intro-gate-t">${esc(t('gateTitle'))}</h2>
    <div class="intro-doors">
      <button class="intro-door" type="button" data-view="simple"><span class="door-pic door-pic--simple" aria-hidden="true"><i class="door-face">${exists('site/portrait.webp') ? `<img src="/site/portrait.webp"${faceSet.includes('portrait-240') ? ` srcset="${faceSet}" sizes="${faceSizes}"` : ''} alt="" width="640" height="800" loading="lazy" decoding="async">` : ''}</i><i class="door-line door-line--1"></i><i class="door-line door-line--2"></i><i class="door-line door-line--3"></i><i class="door-rows"><b></b><b></b><b></b></i></span><b class="door-t">${esc(t('gateSimple'))}</b><small class="door-s">${esc(t('gateSimpleSub'))}</small></button>
      <a class="intro-door" href="${u('/full/')}" data-view="full"><span class="door-pic door-pic--full" aria-hidden="true"><img src="/${deskShot}" alt="" width="800" height="450" loading="lazy" decoding="async"><i class="door-cap"><b>Navy</b><b>Gibran</b></i></span><b class="door-t">${esc(t('gateFull'))}</b><small class="door-s">${esc(t('gateFullSub'))}</small></a>
    </div>
    <p class="intro-gate-hint">${esc(t('gateHint'))} <a href="/3d/" data-track="3d_cta_click" data-from="gate">${esc(t('gate3d'))} ${arrow}</a></p>
  </div>
  <span class="intro-foot lbl" aria-hidden="true">${esc(t('introFoot', { y: D.SITE.year }))}</span>
  <button class="intro-skip" type="button" tabindex="-1">${esc(t('skipIntro'))}</button>
  <span class="intro-count" aria-hidden="true">00</span>
</div>`;
}

// ---------- the home (/): the portfolio as one profile page (scripts/home-profile.js), the reading for the people Navy sells to,
// who look and then call; the intro and the gate play over it, and "Full" leads to the story at /full/
function simplePage(D, ctx) {
  const Cn = C();
  const clients = CLIENTS.map((c) => ({ key: c.key, name: clientName(c), word: c.word || null }));
  const main = homeProfileMain({ D: { ...D, PROJECTS: workOrder(D.PROJECTS) }, lang: LANG, path: Cn.path || CONTENT.en.path, stackNames: Cn.stack || CONTENT.en.stack, worlds: worldsFor(LANG), clients, gh: GH, exists, img, u, tp, projectMedia, stackOf, roll, kind: (p) => (t('kindOne') || {})[kindOf(p)] || '', kindEn: (p) => (UI.en.kindOne || {})[kindOf(p)] || '', bgOf: (p) => tint(p).bg, faq: { title: Cn.faqTitle || '', items: Cn.faq || [] },
    services: (Cn.territories || CONTENT.en.territories).map((x, i) => ({ title: x.title, body: x.body, items: x.items || [], also: TERRITORIES[i]?.also || '', proof: (TERRITORIES[i]?.proof || []).map((k) => D.PROJECTS.find((q) => q.key === k)).filter(Boolean).map((q) => ({ key: q.key, title: q.title })) })),
    process: Cn.process || CONTENT.en.process, waText: t('waHello') });
  const set = (list) => list.filter(([f]) => exists(f)).map(([f, w]) => `/${f} ${w}w`).join(', ');
  const bannerSet = set([['site/desk-wide-800.webp', 800], ['site/desk-wide.webp', 1920]]);
  const faceSet = set([['site/portrait-240.webp', 240], ['site/portrait-360.webp', 360], ['site/portrait.webp', 640]]);
  // (the hero portrait's own sizes in scripts/home-profile.js: its preload and the gate's door take the same srcset and sizes, so all
  // three resolve to one file in every browser; the door's face is smaller, but the hero's sizes keep the file sharp enough for it)
  const faceSizes = '(max-width: 480px) 100px, 116px';
  const preload = [
    bannerSet && `<link rel="preload" as="image" href="/site/desk-wide-800.webp" imagesrcset="${bannerSet}" imagesizes="(min-width: 800px) 760px, 100vw" fetchpriority="high">`,
    // (the portrait only by its srcset once the small copies exist; before that, the one file the <img> asks for)
    faceSet.includes('portrait-240') ? `<link rel="preload" as="image" href="/site/portrait.webp" imagesrcset="${faceSet}" imagesizes="${faceSizes}">` : exists('site/portrait.webp') ? '<link rel="preload" as="image" href="/site/portrait.webp">' : '',
  ].filter(Boolean).join('\n');
  const graph = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebSite', '@id': `${ORIGIN}/#website`, url: `${ORIGIN}/`, name: 'Navy Gibran', inLanguage: LANG_ORDER.map((l) => LANGS[l].html), publisher: { '@id': PERSON_ID } },
    { '@type': 'ProfilePage', '@id': `${ORIGIN}${u('/')}#page`, url: `${ORIGIN}${u('/')}`, name: t('t_home'), description: t('d_simple', { n: D.PROJECTS.filter((p) => p.url && p.date !== 'previous design').length }), inLanguage: L.html, isPartOf: { '@id': `${ORIGIN}/#website` }, mainEntity: { '@id': PERSON_ID } },
    personLd(D),
  ] };
  return head({ title: t('t_home'), description: t('d_simple', { n: D.PROJECTS.filter((p) => p.url && p.date !== 'previous design').length }), pathname: '/', css: ctx.css + HOME_PROFILE_CSS, intro: true, viewForward: true, imageAlt: t('ogHomeAlt'), extra: preload + '\n' + ldScript(graph) + '\n' }) + `
<body class="home home-profile">
${introHtml(D, faceSet, faceSizes)}
${header('simple', '/', D)}
${main}
${footer(D, true)}
` + tail(ctx.js + '\n' + HOME_PROFILE_JS);
}

// ---------- /llms.txt: who Navy is, what he built and how to reach him, as Markdown for language models (llmstxt.org)
function llmsTxt(D) {
  const list = counted(D), nLive = D.PROJECTS.filter((p) => p.url && p.date !== 'previous design').length;
  const one = (s) => metaCut(String(s || ''), 'en');
  const link = (l) => `- ${l.label === 'Résumé' ? 'CV (PDF)' : l.label}: ${l.href.startsWith('/') ? ORIGIN + l.href : l.href.replace(/^mailto:/, '')}`;
  return [
    '# Navy Gibran',
    '',
    `> ${CONTENT.en.ldDesc || UI.en.ldDesc} ${nLive} client sites are live.`,
    '',
    `Full-stack developer in Indonesia (GMT+7), now at PT. Gajah Terbang Kreatif, where he built GodPlan ERP. Informatics graduate of Universitas Multimedia Nusantara (2026, GPA 3.71). Speaks Indonesian and English; reads Mandarin. ${UI.en.status}.`,
    '',
    '## Pages',
    '',
    `- [Profile](${ORIGIN}/): the portfolio at a glance (also in [Bahasa Indonesia](${ORIGIN}/id/) and [Chinese](${ORIGIN}/zh/))`,
    `- [The full story](${ORIGIN}/full/): the work, the clients, the path and how he works`,
    `- [All work](${ORIGIN}/work/): ${list.length} projects, each with its own page`,
    `- [Labs](${ORIGIN}/labs/): 3D web interactive designs and experiments on GitHub`,
    `- [CV](${ORIGIN}/cv/): one page, printable`,
    `- [The 3D desk](${ORIGIN}/3d/): the same portfolio as a 3D room`,
    '',
    '## Contact',
    '',
    ...D.SITE.links.map(link),
    '',
    '## Working with him',
    '',
    ...(CONTENT.en.faq || []).map(([q, ans]) => `- ${q} ${fill(ans, { n: nLive })}`),
    '',
    '## Projects',
    '',
    ...list.map((p) => `- [${p.title}](${ORIGIN}/work/${p.key}/): ${p.industry}. ${one(p.description)} Stack: ${p.stack}.${p.now ? ` Now ${p.now.name}, its old address retired.` : p.date === 'previous design' ? ' The first version, since replaced at the same address.' : p.url ? ` Live at ${p.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}.` : ''}`),
    '',
    '## Stack',
    '',
    STACK.map((items) => items.join(', ')).join('; ') + '.',
    '',
  ].join('\n').replace(/[—–]/g, ',');
}

// ---------- everything, per language: { 'index.html', 'work/<key>/index.html', 'labs/index.html', 'en/index.html', ...,
// '404.html' (the default language), 'sitemap.xml', 'robots.txt' }
export async function renderSite() {
  const D0 = await loadData(), D = D0;
  // big screens are zoomed as a whole (the page's head script sets zoom and --k, from 1600px wide up); zoom multiplies viewport
  // units too, so every vh and vw is divided by --k here, and the held scenes stay exactly one screen tall
  const css = read('site/site.css').replace(/(?<![\w.#-])(\d*\.?\d+)(svh|dvh|lvh|vh|vw|vmin|vmax)\b/g, 'calc($1$2 / var(--k, 1))');
  const cssAll = read('site/fonts.css') + css + motionOffRules(css);
  const jsSrc = read('site/site.js');
  ASSETS = new Map(); BASE_CSS = cssAll; BASE_JS = jsSrc;
  // shared links to the old address (navygibran.dev/#project-x, /#note) belong to the desk: the page script forwards them
  const targets = [...Object.keys(D.TARGETS), 'site'];
  const nClients = D.PROJECTS.filter((p) => p.url && p.date !== 'previous design').length;
  const out = {};
  for (const lang of LANG_ORDER) {
    setLang(lang);
    // (the projects under the names this language gives them: only a few have one, the hub's "Client Websites" first)
    const DL = { ...D0, PROJECTS: D0.PROJECTS.map((p) => (PROJECTS_T[lang]?.[p.key]?.title ? { ...p, title: PROJECTS_T[lang][p.key].title } : p)), SITE: { ...D0.SITE, links: D0.SITE.links.map((l) => { const pdf = l.label === 'Résumé' && l.href.replace(/\.pdf$/, `-${lang}.pdf`); return pdf && lang !== DEFAULT_LANG && exists(pdf.slice(1)) ? { ...l, href: pdf } : l; }) } };
    const D = DL;
    const ctx = { css: cssAll, js: jsSrc };
    // (this language's data for the page script: the desk's old targets, the projects, the index the search reads, the words)
    const SP = stackParts({ M: stackModel({ D, gh: GH }), lang, name: term, icon: () => '', u, worlds: WORLDS.length });
    NV_DATA = JSON.stringify({ desk: targets, projects: D.PROJECTS.map((p) => p.key), index: { p: workOrder(D.PROJECTS).map((p) => [p.key, p.title, industryLine(p), stackOf(p), tint(p).bg, kindLabel(kindOf(p))]), l: D.SITE.links.map((l) => [linkLabel(l), l.href]), s: STACK.flat().map((x) => [slugOf(x), term(x), SP.tip(x)]), w: worldsFor(lang).map((w) => [w.key, w.name, w.category]) }, prefix: PFX, lang, t: { ...t('js'), zoom: t('cursorZoom') } }).replace(/</g, '\\u003c');
    const menuLinks = D.SITE.links.map((l) => `<li><a href="${esc(l.href)}" target="_blank" rel="noopener" data-track="contact_click" data-channel="${esc(l.label)}">${esc(linkLabel(l))}</a></li>`).join('');
    // The simple menu already holds the WhatsApp button and the mail link, so its "elsewhere" row skips those two
    const elseLinks = D.SITE.links.filter((l) => !/^(https:\/\/wa\.me|mailto:)/.test(l.href)).map((l) => `<li><a href="${esc(l.href)}" target="_blank" rel="noopener" data-track="contact_click" data-channel="${esc(l.label)}">${esc(linkLabel(l))}</a></li>`).join('');
    const fillAll = (html) => typeset(html.replace('__MENU_LINKS__', menuLinks).replace('__ELSE_LINKS__', elseLinks).replace(/__N_PROJECTS__/g, counted(D).length).replace(/__N_CLIENTS__/g, nClients).replace(/__YEAR__/g, esc(D.SITE.copyright || D.SITE.year)));
    const dir = PFX ? PFX.slice(1) + '/' : '';
    out[`${dir}index.html`] = fillAll(simplePage(D, ctx));
    out[`${dir}full/index.html`] = fillAll(home(D, ctx));
    out[`${dir}work/index.html`] = fillAll(archivePage(D, ctx));
    out[`${dir}labs/index.html`] = fillAll(labsPage(D, ctx));
    out[`${dir}cv/index.html`] = fillAll(cvPage(D, ctx));
    D.PROJECTS.forEach((p) => { out[`${dir}work/${p.key}/index.html`] = fillAll(projectPage(D, ctx, p)); });
    out[`${dir}404.html`] = fillAll(notFound(D, ctx));
  }
  setLang(DEFAULT_LANG);
  for (const [rel, content] of ASSETS) out[rel] = content;
  const paths = ['/', '/full/', '/work/', '/labs/', '/cv/', ...D.PROJECTS.map((p) => `/work/${p.key}/`)];
  const alt = (pth) => LANG_ORDER.map((l) => `<xhtml:link rel="alternate" hreflang="${LANGS[l].html}" href="${ORIGIN}${LANGS[l].prefix}${pth}"/>`).join('') + `<xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${pth}"/>`;
  const urls = [];
  const pics = (pth) => { const p = D.PROJECTS.find((q) => pth === `/work/${q.key}/`); if (!p) return ''; const m = projectMedia(D, p); return [...m.shots, ...(m.phone ? [m.phone] : [])].slice(0, 6).map((s) => `<image:image><image:loc>${ORIGIN}/${s}</image:loc></image:image>`).join(''); };
  for (const pth of paths) for (const l of LANG_ORDER) urls.push(`  <url><loc>${ORIGIN}${LANGS[l].prefix}${pth}</loc><priority>${pth === '/' ? '1.0' : pth === '/full/' ? '0.9' : pth === '/work/' || pth === '/labs/' ? '0.8' : '0.6'}</priority>${alt(pth)}${pics(pth)}</url>`);
  urls.push(`  <url><loc>${ORIGIN}/3d/</loc><priority>0.8</priority></url>`);
  out['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`;
  out['robots.txt'] = `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`;
  out['llms.txt'] = llmsTxt(D);
  // no dashes in anything the site shows (Navy's rule)
  for (const [k, v] of Object.entries(out)) if (/[—–]/.test(strip(v.replace(/<style>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '')))) console.warn(`warning: ${k} contains an em or en dash`);
  return out;
}

// node scripts/site.js → writes the pages into KW_OUT or dist/ (the build calls renderSite itself)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--og-cv')) {
  const D = await loadData();
  const n = D.PROJECTS.filter((p) => p.url && p.date !== 'previous design').length;
  const out = {};
  for (const lang of LANG_ORDER) { setLang(lang); out[lang] = { kick: t('cv_title'), role: t('role'), country: { id: 'Indonesia', zh: '印度尼西亚' }[lang] || 'Indonesia', facts: t('facts').map((f) => fill(f, { n })), url: `NAVYGIBRAN.DEV${LANGS[lang].prefix.toUpperCase()}/CV` }; }
  process.stdout.write(JSON.stringify(out));
} else if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--og-data')) {
  const D = await loadData();
  const order = counted(D);   // (numbered as the site numbers them; the hub after the projects)
  const want = process.argv[process.argv.indexOf('--og-data') + 1];
  if (want && LANGS[want]) setLang(want);
  const list = [...order, ...D.PROJECTS.filter(isHub)].map((p) => ({ key: p.key, n: order.indexOf(p) + 1, total: order.length, counted: !isHub(p), title: tp(p, 'title') || p.title, industry: want ? tp(p, 'industry') : p.industry, nowLine: p.now ? t('nowSuffix', { n: p.now.name }) : '', stack: p.stack, date: p.date, now: p.now?.name || null, ...tint(p), ...projectMedia(D, p) }));
  if (!want || !LANGS[want]) process.stdout.write(JSON.stringify(list));
  else {
    const lead = t('archiveLead', { n: order.length });
    process.stdout.write(JSON.stringify({ lang: want, ui: { role: t('role'), country: { id: 'Indonesia', zh: '印度尼西亚' }[want] || 'Indonesia', motto: t('motto'), project: t('project').trim(), every: t('everySite'), archive: t('archive'), allThe: t('allThe'), workEm: t('workEm'), count: lead.split(/(?<=[.。])\s*/)[0].replace(/[.。]$/, '') }, projects: list }));
  }
} else if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--og-labs')) {
  const want = process.argv[process.argv.indexOf('--og-labs') + 1];
  if (want && LANGS[want]) setLang(want);
  const M = labsMetaFor(LANG);
  process.stdout.write(JSON.stringify({ lang: LANG, worlds: WORLDS.map((w) => w.key), kick: M.menu.label, title: t('lw_title'), em: t('lw_em'), count: t('lw_count', { n: M.worlds, m: M.count }) }));
} else if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dist = process.env.KW_OUT ? path.resolve(process.env.KW_OUT) : path.join(root, 'dist');
  const pages = await renderSite();
  for (const [rel, html] of Object.entries(pages)) { const f = path.join(dist, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); }
  console.log(`site: ${Object.keys(pages).length} files → ${path.relative(root, dist) || '.'}`);
}
