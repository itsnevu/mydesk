// Which client sites still answer: every project address in src/app/data.js, asked over HTTPS (DNS, then the page itself),
// with the status, the time it took and where it ended up. Run it now and then: `npm run live`. It changes nothing: the
// "live" counts on the pages come from data.js, and a site that has gone is Navy's to mark (date, now: { name, url }).
import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns/promises';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'src/app/data.js'), 'utf8');
const sites = [...src.matchAll(/\{ key: '([\w-]+)', title: '([^']*)'[^\n]*?date: '([^']*)'[^\n]*?url: '([^']*)'/g)].map(([, key, title, date, url]) => ({ key, title, date, url }));
const check = async (s) => {
  const host = new URL(s.url).hostname, t0 = Date.now();
  try { await dns.lookup(host); } catch (e) { return { ...s, ok: false, why: `no DNS (${e.code})` }; }
  try {
    const r = await fetch(s.url, { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'navygibran.dev live check' } });
    return { ...s, ok: r.ok, why: `${r.status}${r.url !== s.url ? ' -> ' + r.url : ''}`, ms: Date.now() - t0 };
  } catch (e) { return { ...s, ok: false, why: e.name === 'TimeoutError' ? 'timed out' : e.cause?.code || e.message }; }
};
const results = [];
for (let i = 0; i < sites.length; i += 6) results.push(...(await Promise.all(sites.slice(i, i + 6).map(check))));
for (const r of results) console.log(`${r.ok ? 'ok  ' : 'DOWN'}  ${r.key.padEnd(24)} ${(r.ms ? r.ms + ' ms' : '').padEnd(8)} ${r.why}${r.date === 'previous design' ? '  (a previous design)' : ''}`);
const live = results.filter((r) => r.date !== 'previous design');
console.log(`\n${live.filter((r) => r.ok).length} of ${live.length} client addresses answer today${live.some((r) => !r.ok) ? '; down: ' + live.filter((r) => !r.ok).map((r) => r.key).join(', ') : ''}`);
