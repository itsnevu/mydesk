// What Navy's public GitHub says about his stack, as a snapshot the site reads (scripts/github-stats.json): every repository
// he owns, the bytes of his own code in each language, and the tools found in it. Everything is read from the repositories
// themselves, through a shallow clone with no checkout (blobs over 2 MB stay on GitHub: no code file is that big):
// - languages: the size of each source file by its extension, leaving out what is not his code (dependencies, builds,
//   minified files, and the Solidity libraries Foundry keeps in lib/: OpenZeppelin alone is 4 MB in three of the repositories,
//   which is why GitHub's own "most used languages" count reads Solidity first);
// - tools: the file tree and the manifests (package.json, go.mod, docker-compose, prisma).
// Forks are left out, and so are the copies of other people's projects in NOT_MINE (imported whole in one commit).
// Run it now and then: `node scripts/github-stats.mjs` (one GitHub API call; set GITHUB_TOKEN if you run it often).
// Client work (the WordPress sites, the ERP's front end) is not on GitHub: the site counts that from data.js.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const USER = process.env.GH_USER || 'itsnevu';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'scripts', 'github-stats.json');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'nv-gh-'));
const headers = { 'User-Agent': 'navygibran.dev', Accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
const api = async (p) => { const r = await fetch(`https://api.github.com${p}`, { headers }); if (!r.ok) throw new Error(`${p}: ${r.status} ${await r.text()}`); return r.json(); };
const git = (args, cwd, input) => execFileSync('git', args, { cwd, input, encoding: 'utf8', maxBuffer: 256 << 20, stdio: [input == null ? 'ignore' : 'pipe', 'pipe', 'ignore'], env: { ...process.env, GIT_NO_LAZY_FETCH: '1' } });

// someone else's project, copied in whole: not counted (checked by hand, 2026-10-15, from each one's first commit and package.json)
const NOT_MINE = {
  solmine: 'Biomes, the open-source sandbox MMORPG by ill-inc, imported in one commit',
  rpg: 'RPGJS v5 beta, imported in one commit',
  '3d-game': 'JDungeon3D, an open-source Godot MMORPG, published as a web build',
  '2d-rpg-game': 'NEAR Lands, a Phaser 3 template, started from its code',
  ojslocal: 'a backup of Open Journal Systems (a README only)',
};
// what the files cannot show: the 3D desk runs on its own WebGL2 engine, the shaders written inside the JavaScript
const ALSO = { mydesk: ['WebGL'] };

const LANG_OF = {
  ts: 'TypeScript', tsx: 'TypeScript', mts: 'TypeScript', cts: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript',
  sol: 'Solidity', go: 'Go', py: 'Python', ipynb: 'Jupyter Notebook', dart: 'Dart', svelte: 'Svelte', vue: 'Vue', php: 'PHP', kt: 'Kotlin', java: 'Java',
  cs: 'C#', css: 'CSS', scss: 'CSS', html: 'HTML', glsl: 'GLSL', vert: 'GLSL', frag: 'GLSL', wgsl: 'WGSL', sql: 'SQL', rs: 'Rust', cpp: 'C++', cc: 'C++',
  swift: 'Swift', shader: 'ShaderLab', hlsl: 'HLSL', sh: 'Shell', circom: 'Circom', gd: 'GDScript',
};
// a path that is not the author's own code: dependencies, builds, vendored libraries, minified or generated files, Yarn's own
// plugins, and the hashed bundles a build leaves in an assets folder
const VENDOR = /(^|\/)(node_modules|vendor|vendors|third_party|dist|build|out|\.next|\.svelte-kit|\.vercel|coverage|typechain-types|artifacts|cache|public\/(vendor|lib|libs|build)|assets\/vendor)\/|\.min\.(js|css)$|\.bundle\.js$|(^|\/)\.yarn\/|(^|\/)\.pnp\.c?js$|(^|\/)assets\/[^/]+-[\w-]{8}\.(js|css)$|(^|\/)(next-env\.d\.ts|.*\.generated\.\w+)$/;
const has = (deps, ...names) => names.some((n) => n instanceof RegExp ? Object.keys(deps).some((k) => n.test(k)) : n in deps);

// the tools, in the names the site uses (scripts/site.js STACK); each rule reads the files, the dependencies and go.mod
const RULES = {
  Go: ({ files }) => files.some((f) => /\.go$/.test(f)),
  TypeScript: ({ files }) => files.some((f) => /\.(ts|tsx|mts)$/.test(f) && !/\.d\.ts$/.test(f)),
  JavaScript: ({ files }) => files.some((f) => /\.(js|jsx|mjs|cjs)$/.test(f) && !/(^|\/)[^/]*\.config\.(js|mjs|cjs)$/.test(f)),
  PHP: ({ files }) => files.some((f) => /\.php$/.test(f)),
  Solidity: ({ files }) => files.some((f) => /\.sol$/.test(f)),
  Python: ({ files }) => files.some((f) => /\.(py|ipynb)$/.test(f)),
  'Next.js': ({ deps }) => has(deps, 'next'),
  React: ({ deps }) => has(deps, 'react'),
  SvelteKit: ({ deps }) => has(deps, '@sveltejs/kit'),
  'Tailwind CSS': ({ deps, files }) => has(deps, 'tailwindcss', /^@tailwindcss\//) || files.some((f) => /(^|\/)tailwind\.config\./.test(f)),
  'Node.js': ({ deps, files }) => has(deps, 'express', 'fastify', 'koa', 'hono', '@hono/node-server', '@nestjs/core', 'socket.io', 'ws', 'puppeteer', 'playwright', 'commander', 'yargs')
    || files.some((f) => /(^|\/)(server|serve|index)\.(js|mjs|ts)$/.test(f) && !/(^|\/)(src|app|components|public)\//.test(f)),
  Bun: ({ deps, files }) => has(deps, '@types/bun', 'bun-types') || files.some((f) => /(^|\/)(bun\.lockb?|bunfig\.toml)$/.test(f)),
  'REST APIs': ({ deps, gomod, files }) => has(deps, 'express', 'fastify', 'koa', 'hono', '@nestjs/core')
    || /gin-gonic|gofiber|labstack\/echo|go-chi|gorilla\/mux/.test(gomod)
    || files.some((f) => /(^|\/)app\/api\/.*route\.(ts|js)$|(^|\/)pages\/api\/|(^|\/)api\/[^/]+\.(ts|js)$|(^|\/)routes?\/.*\.(go|py)$|(^|\/)handlers?\/.*\.go$/.test(f)),
  PostgreSQL: ({ deps, gomod, compose, prisma }) => has(deps, 'pg', 'postgres', '@neondatabase/serverless', '@vercel/postgres', '@supabase/supabase-js')
    || /lib\/pq|jackc\/pgx|driver\/postgres/.test(gomod) || /postgres/.test(compose) || /provider\s*=\s*"postgresql"/.test(prisma),
  MySQL: ({ deps, gomod, compose, prisma }) => has(deps, 'mysql', 'mysql2') || /go-sql-driver\/mysql|driver\/mysql/.test(gomod) || /mysql|mariadb/.test(compose) || /provider\s*=\s*"mysql"/.test(prisma),
  WordPress: ({ files }) => files.some((f) => /(^|\/)wp-content\/|(^|\/)functions\.php$/.test(f)),
  WooCommerce: ({ files }) => files.some((f) => /(^|\/)woocommerce\//.test(f)),
  Docker: ({ files }) => files.some((f) => /(^|\/)(Dockerfile[^/]*|docker-compose[^/]*\.ya?ml|compose\.ya?ml)$/.test(f)),
  Vercel: ({ deps, files }) => has(deps, /^@vercel\//) || files.some((f) => /(^|\/)vercel\.json$/.test(f)),
  Swagger: ({ deps, gomod, files }) => has(deps, /swagger/, /openapi/) || /swaggo/.test(gomod) || files.some((f) => /(^|\/)(swagger|openapi)\.(json|ya?ml)$/.test(f)),
  GSAP: ({ deps }) => has(deps, 'gsap'),
  'Framer Motion': ({ deps }) => has(deps, 'framer-motion', 'motion'),
  'Three.js': ({ deps }) => has(deps, 'three', '@react-three/fiber'),
  WebGL: ({ deps, files }) => has(deps, 'three', '@react-three/fiber', 'ogl', 'regl', 'twgl.js', 'pixi.js') || files.some((f) => /\.(glsl|vert|frag|wgsl)$/.test(f)),
  'Smart contracts': ({ deps, files }) => files.some((f) => /\.sol$/.test(f)) || has(deps, 'hardhat') || files.some((f) => /(^|\/)foundry\.toml$/.test(f)),
  'Wallet integration': ({ deps }) => has(deps, 'wagmi', 'viem', 'ethers', 'web3', '@rainbow-me/rainbowkit', /^@reown\//, /^@web3modal\//, /^@walletconnect\//, /^@solana\/wallet-adapter/, /^@privy-io\//, /^@dynamic-labs\//),
};
RULES['dApp frontends'] = (x) => RULES['Wallet integration'](x) && (has(x.deps, 'react', 'next', 'svelte', '@sveltejs/kit', 'vue') || x.files.some((f) => /\.html$/.test(f)));

const t0 = Date.now();
// (without the API, past GitHub's hourly limit, the list of the last snapshot is used again: the rest is git, which has no limit)
let all;
try { all = (await api(`/users/${USER}/repos?per_page=100&type=owner&sort=pushed`)).filter((r) => !r.fork && r.name.toLowerCase() !== USER.toLowerCase()); }
catch (e) {
  if (!fs.existsSync(OUT)) throw e;
  console.log(`GitHub API refused (${e.message.slice(0, 60)}...): using the repository list of the last snapshot`);
  all = JSON.parse(fs.readFileSync(OUT, 'utf8')).repos.map((r) => ({ name: r.name, html_url: r.url, clone_url: r.url + '.git', description: r.description, homepage: r.homepage, created_at: r.created, pushed_at: r.pushed, size: r.skip === 'empty' ? 0 : 1 }));
}
console.log(`${all.length} repositories of ${USER} (forks and the profile README left out)`);
const out = [];
for (const r of all) {
  const base = { name: r.name, url: r.html_url, description: r.description || '', homepage: r.homepage || '', created: r.created_at.slice(0, 10), pushed: r.pushed_at.slice(0, 10) };
  if (NOT_MINE[r.name] || !r.size) { out.push({ ...base, skip: NOT_MINE[r.name] || 'empty' }); console.log(`  ${r.name}: left out`); continue; }
  const dir = path.join(work, r.name);
  let tree = [];
  try {
    git(['clone', '--quiet', '--bare', '--depth', '1', '--filter=blob:limit=2m', r.clone_url, dir], work);
    tree = git(['ls-tree', '-r', 'HEAD'], dir).split('\n').filter(Boolean).map((l) => { const [meta, f] = l.split('\t'); return { sha: meta.split(' ')[2], type: meta.split(' ')[1], f }; }).filter((x) => x.type === 'blob');
  } catch { console.log(`  ${r.name}: clone failed`); out.push({ ...base, skip: 'clone failed' }); continue; }
  // Foundry keeps its libraries in lib/ beside foundry.toml: those are OpenZeppelin's and forge-std's, not his
  const foundryLibs = tree.filter((x) => /(^|\/)foundry\.toml$/.test(x.f)).map((x) => x.f.replace(/foundry\.toml$/, '') + 'lib/');
  const files = tree.map((x) => x.f).filter((f) => !VENDOR.test(f) && !foundryLibs.some((p) => f.startsWith(p)));
  const own = new Set(files);
  const code = tree.filter((x) => own.has(x.f) && LANG_OF[x.f.split('.').pop().toLowerCase()]);
  const sizes = git(['cat-file', '--batch-check=%(objectname) %(objectsize)'], dir, code.map((x) => x.sha).join('\n') + '\n')
    .split('\n').reduce((m, l) => { const [sha, n] = l.split(' '); if (n && /^\d+$/.test(n)) m[sha] = +n; return m; }, {});
  const bytes = {};
  for (const x of code) { const lang = LANG_OF[x.f.split('.').pop().toLowerCase()]; if (sizes[x.sha]) bytes[lang] = (bytes[lang] || 0) + sizes[x.sha]; }
  const blob = (f) => { const x = tree.find((y) => y.f === f); try { return x ? git(['cat-file', '-p', x.sha], dir) : ''; } catch { return ''; } };
  const deps = {};
  for (const f of files.filter((f) => /(^|\/)package\.json$/.test(f))) {
    try { const p = JSON.parse(blob(f)); Object.assign(deps, p.dependencies, p.devDependencies, p.peerDependencies); } catch {}
  }
  const gomod = files.filter((f) => /(^|\/)go\.mod$/.test(f)).map(blob).join('\n');
  const compose = files.filter((f) => /(^|\/)(docker-compose[^/]*|compose)\.ya?ml$/.test(f)).map(blob).join('\n').toLowerCase();
  const prisma = files.filter((f) => /\.prisma$/.test(f)).map(blob).join('\n');
  const ctx = { files, deps, gomod, compose, prisma };
  const tools = [...new Set([...Object.keys(RULES).filter((k) => { try { return RULES[k](ctx); } catch { return false; } }), ...(ALSO[r.name] || [])])];
  const sorted = Object.fromEntries(Object.entries(bytes).sort((a, b) => b[1] - a[1]));
  out.push({ ...base, bytes: sorted, tools });
  console.log(`  ${r.name}: ${Object.entries(sorted).slice(0, 4).map(([k, v]) => `${k} ${Math.round(v / 1e3)}k`).join(', ')} | ${tools.join(', ')}`);
  fs.rmSync(dir, { recursive: true, force: true });
}
fs.rmSync(work, { recursive: true, force: true });
fs.writeFileSync(OUT, JSON.stringify({ user: USER, at: new Date().toISOString().slice(0, 10), repos: out }, null, 1) + '\n');
console.log(`wrote ${path.relative(root, OUT)} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
