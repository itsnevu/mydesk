// The static site's smoke check (run by scripts/smoke.js, so by `npm run smoke`): renders every page in memory with renderSite
// and checks that they hold together, without a browser. What a broken edit tends to break, page by page:
//  - visible text and the attributes people see (alt, title, aria-label, placeholder, meta content) carry no em or en dash and no
//    template leftovers ("undefined", "NaN", "[object Object]", an unfilled {placeholder} or ${...});
//  - ids are unique, and every aria-labelledby / aria-describedby / aria-controls / label[for] / href="#id" points at one;
//  - every internal link, src, srcset candidate and data-* picture points at a rendered page or a file in public/, and a link
//    with a #fragment to another page finds that id there;
//  - every JSON-LD block parses; <html lang> matches the language of the path; every hreflang alternate exists;
//  - each English page has its Indonesian and Chinese twin; every <img> has an alt (empty is fine for decoration);
//  - one <h1> per page; a <title> and a meta description (at most 170 characters) on every page, each unique within its
//    language; a canonical link (not on the noindex 404) and an og:image; rel="noopener" on every target="_blank" link;
//    every url() in the stylesheets points at a rendered file or one in public/.
//  - on /id/ and /zh/, no word that site.js translates (TERM_T) is left in English.
// Exported as checkSite(root) -> { pages, links, anchors, problems: [..], notes: [..] }; `node scripts/smoke-site.js` runs it alone.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DASH = /[–—]/;
const LEFTOVER = /\bundefined\b|\bNaN\b|\[object Object\]|\$\{|\{(?:n|t|y|m|link|link2|link3|name|count)\}/;
const LANGS = [['', 'en'], ['id/', 'id'], ['zh/', 'zh-Hans']];   // (path prefix, the <html lang> it must carry)

const strip = (h) => h.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
const textOf = (h) => strip(h).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ');
const attrs = (tag) => { const o = {}; for (const m of tag.matchAll(/\s([a-zA-Z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) o[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? ''; return o; };
const tagsOf = (h) => [...strip(h).matchAll(/<([a-zA-Z][\w-]*)(\s[^>]*)?>/g)].map((m) => ({ name: m[1].toLowerCase(), a: attrs(m[2] || '') }));
const near = (s, i) => s.slice(Math.max(0, i - 40), i + 40).replace(/\s+/g, ' ').trim();

export async function checkSite(root, given = null) {   // (given: an already rendered page map, for testing the check itself)
  const pages = given || await (await import(pathToFileURL(path.join(root, 'scripts', 'site.js')).href)).renderSite();
  // (the words site.js translates per language, TERM_T: on /id/ and /zh/ the English must not show; a word that is also part of a tool's
  // name, like Motion in Framer Motion, is checked with those names blanked out)
  const TERM = (await import(pathToFileURL(path.join(root, 'scripts', 'site.js')).href)).TERM_T || {};
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const leak = Object.fromEntries(Object.entries(TERM).map(([lg, d]) => [lg, Object.entries(d).filter(([en, tr]) => en !== tr)
    .map(([en]) => [en, new RegExp(`(?<![A-Za-z])${esc(en)}(?![A-Za-z])`)])]));
  const NAMES = /Framer Motion/g;   // (proper names that contain a translated word; blanked out before the check)
  const html = Object.entries(pages).filter(([k]) => k.endsWith('.html'));
  const problems = [], notes = [], titles = {}, descs = {}, cssOf = [];
  let links = 0, anchors = 0;
  const idsOf = new Map(html.map(([k, h]) => [k, new Set(tagsOf(h).map((t) => t.a.id).filter(Boolean))]));
  const pub = (p) => { try { return fs.statSync(path.join(root, 'public', decodeURIComponent(p))).isFile(); } catch { return false; } };
  // where an internal URL lands: a rendered page (its key) or a public file ('public'), else null
  const land = (url) => {
    const p = url.split('#')[0].split('?')[0];
    if (p === '/3d/' || p === '/3d') return '3d';   // (the desk is built by scripts/build.js from index.html, not by renderSite)
    if (p.endsWith('/')) { const k = p.slice(1) + 'index.html'; return pages[k] !== undefined ? k : null; }
    const k = p.slice(1);
    if (pages[k] !== undefined) return k;
    if (pages[k + '/index.html'] !== undefined) return k + '/index.html';
    return pub(p.slice(1)) ? 'public' : null;
  };

  for (const [key, h] of html) {
    const where = '/' + key.replace(/index\.html$/, '');
    // words people see
    const text = textOf(h);
    let i = text.search(DASH); if (i >= 0) problems.push(`${where}: a dash in the text: "${near(text, i)}"`);
    i = text.search(LEFTOVER); if (i >= 0) problems.push(`${where}: a template leftover in the text: "${near(text, i)}"`);
    const lg = key.startsWith('id/') ? 'id' : key.startsWith('zh/') ? 'zh' : '';
    const named = lg ? text.replace(NAMES, ' ') : text;
    for (const [en, re] of leak[lg] || []) { const j = named.search(re); if (j >= 0) problems.push(`${where}: "${en}" is left in English (site.js TERM_T translates it): "${near(named, j)}"`); }
    const tags = tagsOf(h);
    for (const t of tags) for (const name of ['alt', 'title', 'aria-label', 'placeholder', 'content']) {
      const v = t.a[name]; if (!v) continue;
      if (name === 'content' && !(t.name === 'meta')) continue;
      if (DASH.test(v)) problems.push(`${where}: a dash in <${t.name} ${name}="${v.slice(0, 80)}">`);
      if (LEFTOVER.test(v)) problems.push(`${where}: a template leftover in <${t.name} ${name}="${v.slice(0, 80)}">`);
    }
    // ids and what points at them
    const seen = new Map(); for (const t of tags) if (t.a.id) seen.set(t.a.id, (seen.get(t.a.id) || 0) + 1);
    for (const [id, n] of seen) if (n > 1) problems.push(`${where}: id "${id}" is used ${n} times`);
    const ids = idsOf.get(key);
    for (const t of tags) {
      for (const name of ['aria-labelledby', 'aria-describedby', 'aria-controls']) for (const ref of (t.a[name] || '').split(/\s+/).filter(Boolean)) {
        anchors++; if (!ids.has(ref)) problems.push(`${where}: <${t.name} ${name}="${ref}"> points at no id`);
      }
      if (t.name === 'label' && t.a.for) { anchors++; if (!ids.has(t.a.for)) problems.push(`${where}: <label for="${t.a.for}"> points at no id`); }
      if (t.name === 'img' && !('alt' in t.a)) problems.push(`${where}: an <img> without alt: ${t.a.src || ''}`);
      // links and pictures
      const urls = [];
      if (t.a.href) urls.push(t.a.href);
      if (t.a.src) urls.push(t.a.src);
      for (const name of ['srcset', 'imagesrcset']) if (t.a[name]) urls.push(...t.a[name].split(',').map((c) => c.trim().split(/\s+/)[0]).filter(Boolean));
      for (const name of ['data-big', 'data-small', 'data-preview', 'poster']) if (t.a[name]) urls.push(t.a[name]);
      for (const url of urls) {
        if (url.startsWith('#')) { if (url.length > 1) { anchors++; if (!ids.has(decodeURIComponent(url.slice(1)))) problems.push(`${where}: <${t.name}> links to "${url}", no such id on the page`); } continue; }
        if (!url.startsWith('/') || url.startsWith('//')) continue;
        links++;
        const to = land(url);
        if (!to) { problems.push(`${where}: <${t.name}> points at ${url}, which is neither a page nor a file in public/`); continue; }
        const frag = url.includes('#') ? decodeURIComponent(url.split('#')[1]) : '';
        if (frag && idsOf.has(to)) { anchors++; if (!idsOf.get(to).has(frag)) problems.push(`${where}: ${url} lands on a page without id "${frag}"`); }
      }
      // the page's language and its alternates
      if (t.name === 'html') {
        const want = (LANGS.find(([pre]) => pre && key.startsWith(pre)) || LANGS[0])[1];
        if (t.a.lang !== want) problems.push(`${where}: <html lang="${t.a.lang}">, expected "${want}"`);
      }
      if (t.name === 'link' && t.a.rel === 'alternate' && t.a.hreflang && t.a.href) {
        const u = t.a.href.replace(/^https:\/\/navygibran\.dev/, '');
        if (u.startsWith('/') && !land(u)) problems.push(`${where}: hreflang ${t.a.hreflang} points at ${t.a.href}, which is not rendered`);
      }
    }
    for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(m[1]); } catch (e) { problems.push(`${where}: a JSON-LD block does not parse (${e.message})`); }
    }
    // the head and the outline: one h1, a title and a description (unique within the language, checked below), a canonical
    // (not on the noindex 404), an og:image, and a new tab never without rel="noopener"
    const body = strip(h);
    const h1 = (body.match(/<h1[\s>]/g) || []).length; if (h1 !== 1) problems.push(`${where}: ${h1} <h1> on the page, expected 1`);
    const lang = (LANGS.find(([pre]) => pre && key.startsWith(pre)) || LANGS[0])[1];
    const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1], desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    if (!title) problems.push(`${where}: no <title>`); else (titles[lang + '\u0000' + title] = titles[lang + '\u0000' + title] || []).push(where);
    if (!desc) problems.push(`${where}: no meta description`); else {
      (descs[lang + '\u0000' + desc] = descs[lang + '\u0000' + desc] || []).push(where);
      if (desc.length > 170) problems.push(`${where}: the meta description is ${desc.length} characters (search results cut it near 160)`);
    }
    if (!/(^|\/)404\.html$/.test(key) && !/<link rel="canonical"/.test(h)) problems.push(`${where}: no canonical link`);
    if (!/<meta property="og:image"/.test(h)) problems.push(`${where}: no og:image (a shared link would show no picture)`);
    for (const m of body.matchAll(/<a\s[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(m[0])) problems.push(`${where}: a new-tab link without rel="noopener": ${m[0].slice(0, 90)}`);
    for (const m of h.matchAll(/<style>([\s\S]*?)<\/style>/g)) cssOf.push([`${where} <style>`, m[1]]);
  }
  for (const [k, w] of Object.entries(titles)) if (w.length > 1) problems.push(`the same <title> "${k.split('\u0000')[1].slice(0, 70)}" on ${w.length} pages: ${w.slice(0, 4).join(' ')}`);
  for (const [k, w] of Object.entries(descs)) if (w.length > 1) problems.push(`the same meta description "${k.split('\u0000')[1].slice(0, 60)}" on ${w.length} pages: ${w.slice(0, 4).join(' ')}`);
  // every url() in the stylesheets (the shared /s/ files and any inline <style>) points at a rendered file or one in public/
  for (const [where, c] of [...Object.entries(pages).filter(([k]) => k.endsWith('.css')).map(([k, v]) => [`/${k}`, v]), ...cssOf]) {
    for (const m of c.matchAll(/url\(\s*['"]?(\/[^'")\s]+)['"]?\s*\)/g)) { links++; if (!land(m[1])) problems.push(`${where}: url(${m[1]}) points at nothing`); }
  }
  // every English page has its two twins
  for (const [key] of html) {
    if (LANGS.some(([pre]) => pre && key.startsWith(pre)) || key === '404.html') continue;
    for (const [pre] of LANGS.slice(1)) if (pages[pre + key] === undefined) problems.push(`/${key.replace(/index\.html$/, '')}: no ${pre.slice(0, -1)} twin`);
  }
  if (!pages['sitemap.xml']) problems.push('sitemap.xml is not rendered');
  return { pages: html.length, links, anchors, problems, notes };
}

// run alone: node scripts/smoke-site.js
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const r = await checkSite(root);
  for (const n of r.notes) console.log('note  ' + n);
  for (const p of r.problems) console.log('FAIL  ' + p);
  console.log(`${r.problems.length ? 'FAIL' : 'ok  '}  site: ${r.pages} pages, ${r.links} internal links, ${r.anchors} anchors and references checked, ${r.problems.length} problem(s)`);
  process.exit(r.problems.length ? 1 : 0);
}
