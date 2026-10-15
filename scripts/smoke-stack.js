// The stack's own check (run by scripts/smoke.js): every tool on the stack can be explained in every language, the words keep
// Navy's rules, and the GitHub snapshot the counts come from is there and sane. A tool added to STACK without its words, or a
// snapshot that lost its repositories, fails here instead of showing an empty panel on the site.
import fs from 'node:fs';
import path from 'node:path';
import { STACK, STACK_TEXT, STACK_UI, stackModel, slugOf } from './stack-tools.js';

export async function checkStack(root) {
  const problems = [], notes = [];
  const tools = STACK.flat();
  // every tool explained in every language: what it is and what was done with it, no dashes, no leftover braces
  for (const lang of Object.keys(STACK_UI)) {
    for (const t of tools) {
      const x = STACK_TEXT[lang]?.[t];
      if (!x || x.length !== 2 || !x[0] || !x[1]) { problems.push(`stack: "${t}" has no words in ${lang} (STACK_TEXT.${lang})`); continue; }
      for (const s of x) {
        if (/[—–]/.test(s)) problems.push(`stack: a dash in ${lang} "${t}": ${s.slice(0, 60)}`);
        const left = s.replace(/\{[nw]\}/g, '');
        if (/[{}]/.test(left)) problems.push(`stack: a stray brace in ${lang} "${t}": ${s.slice(0, 60)}`);
      }
    }
    for (const [k, v] of Object.entries(STACK_UI[lang])) if (typeof v === 'string' && /[—–]/.test(v)) problems.push(`stack: a dash in STACK_UI.${lang}.${k}`);
  }
  // one slug per tool (the panels and the #stack-<tool> links are found by it)
  const slugs = tools.map(slugOf);
  for (const s of new Set(slugs)) if (slugs.filter((x) => x === s).length > 1) problems.push(`stack: two tools share the slug "${s}"`);
  // the snapshot: present, with repositories, and every counted repository with bytes and tools
  let gh = null;
  try { gh = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'github-stats.json'), 'utf8')); } catch (e) { problems.push(`stack: scripts/github-stats.json cannot be read (${e.message})`); }
  if (gh) {
    const own = (gh.repos || []).filter((r) => !r.skip);
    if (own.length < 5) problems.push(`stack: the GitHub snapshot has ${own.length} repositories (run node scripts/github-stats.mjs)`);
    for (const r of own) if (!r.bytes || !Array.isArray(r.tools)) problems.push(`stack: repository ${r.name} has no bytes or tools in the snapshot`);
    const age = (Date.now() - Date.parse(gh.at)) / 864e5;
    if (age > 120) notes.push(`stack: the GitHub snapshot is ${Math.round(age)} days old (node scripts/github-stats.mjs refreshes it)`);
    // the model counts something for the tools the site leads with
    const M = stackModel({ D: { PROJECTS: [] }, gh });
    for (const t of ['TypeScript', 'JavaScript', 'React', 'Next.js']) if (!M.tools[t].repos.length) problems.push(`stack: ${t} counts no repositories in the snapshot`);
    notes.length || notes.push(`stack: ${tools.length} tools, ${own.length} repositories counted (snapshot of ${gh.at})`);
  }
  return { problems, notes, tools: tools.length };
}
