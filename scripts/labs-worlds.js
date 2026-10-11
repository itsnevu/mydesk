// The worlds: a series of crypto products, each told as one scroll-driven 3D world backed by a working dApp and Solidity
// contracts, every app running its real contracts on an Ethereum chain inside the browser. Navy's copy, as written
// (2026-10-13); the cards and the filter render on the Labs page (scripts/site.js labsPage), above the GitHub experiments.
// Each card: name, tagline, category, description, tags and one "Visit" link to the site's root (Navy: never the /app/ path).
// The card's picture is a frame of the world itself, public/site/labs/<key>.webp (1280x720, with a -800 copy for phones):
// taken past the site's gate ("Enter silent", "Drop in", "Go inside", "Go for orbit", "Board in silence"), a few wheel steps in,
// then cropped under the site's own header. A world without a picture keeps the coloured plate.

export const WORLDS_INTRO = 'A series of crypto products, each told as one scroll-driven 3D world and each backed by a working dApp and Solidity contracts. Every app runs its real contracts on an Ethereum chain inside the browser, so you can play every role without a wallet. All brands are concepts except Pyris Pact, which is a live product.';
export const WORLDS_STACK = ['three.js', 'TypeScript', 'Vite', 'Solidity (Foundry, OpenZeppelin)', 'viem', 'an in-browser EVM sandbox'];
// the tags every card carries (the shared stack, short), before a card's own
const SHARED_TAGS = ['three.js', 'TypeScript', 'Solidity', 'viem'];

// the filters: a few families of products (every world has its own category; these group them)
export const WORLD_KINDS = [['defi', 'DeFi & markets'], ['privacy', 'Privacy & ZK'], ['infra', 'Wallets & infrastructure'], ['real', 'Real-world assets']];

export const WORLDS = [
  { key: 'anginra', name: 'ANGINRA', tagline: 'Trade the wind.', category: 'Perp DEX', kind: 'defi', url: 'https://anginra.vercel.app', hue: 205,
    body: 'A sailing regatta from start gun to sunset explains a perpetual futures exchange. Long or short ETH and WIND up to 20× on USDC margin, with per-second funding, an oracle mark price, keeper liquidations and an LP vault on the other side.' },
  { key: 'bakaura', name: 'BAKAURA', tagline: 'Every tonne, counted once.', category: 'Blue carbon / ReFi', kind: 'real', url: 'https://bakaura.vercel.app', hue: 150,
    body: 'One day on a restored mangrove coast. Carbon is measured by sensors and satellite, attested by 2-of-3 verifiers, issued as one token per tonne with a reversal buffer, traded, and retired into an on-chain certificate.' },
  { key: 'bendara', name: 'BENDARA', tagline: 'Locked water, still liquid.', category: 'Liquid staking & restaking', kind: 'defi', url: 'https://bendara-seven.vercel.app', hue: 190,
    body: 'One day at an alpine dam. Stake USDC for bdUSD, whose rate rises every epoch. Operators bond and are slashed bond-first, withdrawals queue for seven epochs, and the same stake can be restaked to services downstream.' },
  { key: 'bidama', name: 'BIDAMA', tagline: 'Payments that roll.', category: 'Payment routing', kind: 'defi', url: 'https://bidama.vercel.app', hue: 20,
    body: 'A bright marble run. The router prices every path through stablecoin pools and lands multi-hop payments in the token the recipient wants. It also handles invoices, batch payroll and subscriptions, and draws every route as a marble track.' },
  { key: 'dengung', name: 'DENGUNG', tagline: 'Machines that pay their own way.', category: 'AI agent payments', kind: 'infra', url: 'https://dengung.vercel.app', hue: 42,
    body: 'A glowing hive at night. AI agents pay each other per API call through micropayment channels with signed vouchers, and subcontract work down chains of agents with escrow, stakes and reputation.' },
  { key: 'komidi', name: 'KOMIDI', tagline: 'Every coin is a ride.', category: 'Memecoin launchpad', kind: 'defi', url: 'https://komidi.vercel.app', hue: 320,
    body: 'A night fair on a lake. Anyone launches a coin on one shared bonding curve. When the curve fills, the coin graduates into a pool whose LP is locked forever, with vesting for the creator.' },
  { key: 'kresil', name: 'KRESIL', tagline: 'Machines, grown in crystal.', category: 'Provenance NFTs', kind: 'real', url: 'https://kresil.vercel.app', hue: 200,
    body: 'An unbroken journey through grown ice. Pre-order a machine into escrow and receive an NFT certificate whose on-chain SVG crystal grows with every lab stage, through to delivery.' },
  { key: 'kuanta', name: 'KUANTA', tagline: 'The machine your wallet is afraid of.', category: 'Post-quantum security', kind: 'privacy', url: 'https://kuanta.vercel.app', hue: 260, tags: ['Lamport signatures'],
    body: 'A descent into a quantum computer at 15 millikelvin. Audit whether a wallet\'s public key is exposed, then move funds into a vault secured by Lamport hash-based signatures verified on-chain. A Q-Day simulation drains exposed wallets while the vaults hold.' },
  { key: 'kuncira', name: 'KUNCIRA', tagline: 'A house, not a key.', category: 'Smart wallet (account abstraction)', kind: 'infra', url: 'https://kuncira.vercel.app', hue: 28,
    body: 'A Javanese house compound through a night storm. A smart wallet opened by a passkey, with session keys, daily spending limits, gas paid in USDC, and guardians who can change the lock if the key is lost.' },
  { key: 'nemora', name: 'NEMORA', tagline: 'Low orbit, kept open.', category: 'Space-debris bounties', kind: 'real', url: 'https://nemora-nine.vercel.app', hue: 225,
    body: 'One 92-minute lap of the Earth. Sponsors fund bounties on real tracked debris such as Envisat, and an operator bonds to take the mission. A 2-of-3 tracking consortium attests capture and reentry at Point Nemo, and removal credits are minted and retired.' },
  { key: 'pustaria', name: 'PUSTARIA', tagline: 'The library that cannot forget.', category: 'Decentralised storage', kind: 'infra', url: 'https://pustaria.vercel.app', hue: 36,
    body: 'A vast library at night. Pay once to store a file, chunked and sealed under one Merkle root. Bonded keepers must answer a random page challenge every epoch or lose their bond.' },
  { key: 'pyris', name: 'PYRIS PACT', tagline: 'Pacta mundum movent.', category: 'Milestone escrow (live product)', kind: 'real', url: 'https://pyris-phi.vercel.app', hue: 12, live: true,
    body: 'A walk through a Roman city from one sunset to the next. Milestone escrow in USDC on Arc and Robinhood Chain: the app reads the live mainnet contracts, and every escrow function, from create to dispute and arbitration, is playable in the sandbox.' },
  { key: 'rimbasa', name: 'RIMBASA', tagline: 'Walk the dark forest sealed.', category: 'MEV protection', kind: 'privacy', url: 'https://rimbasa.vercel.app', hue: 95, tags: ['Circom', 'snarkjs', 'Groth16'],
    body: 'A firefly forest at night. Transactions stay sealed until a block includes them, searchers bid in a sealed auction to trade behind them, and 90% of that value goes back to the user. The app shows the same swap sandwiched versus sealed.' },
  { key: 'serlok', name: 'SERLOK', tagline: 'The crowd is the oracle.', category: 'Prediction markets', kind: 'defi', url: 'https://serlok-ten.vercel.app', hue: 240,
    body: 'A mountain observatory at night. Anyone opens a market and the crowd trades its outcomes in a constant-product pool. Answers settle optimistically: a bonded proposal, an open dispute window, and a council of five.' },
  { key: 'subakra', name: 'SUBAKRA', tagline: 'Money that flows like water.', category: 'Money streaming', kind: 'defi', url: 'https://subakra.vercel.app', hue: 110,
    body: 'Balinese rice terraces from dawn to night. Salaries, subscriptions and vesting stream by the second as transferable streams, with batch payroll from a CSV.' },
  { key: 'tabika', name: 'TABIKA', tagline: 'Money that travels unseen.', category: 'Private payments (zero-knowledge)', kind: 'privacy', url: 'https://tabika-two.vercel.app', hue: 350,
    body: 'A railway loop around Japan. A shielded pool: deposit yen as a secret note, then withdraw anywhere, or pay a shop through a relayer, with a Groth16 zero-knowledge proof made in the browser in about half a second. Nothing links the deposit to the payment.' },
  { key: 'tambat', name: 'TAMBAT', tagline: 'Cargo, moored on chain.', category: 'RWA trade finance', kind: 'real', url: 'https://tambat-nine.vercel.app', hue: 210,
    body: 'A harbour through one night. Bills of lading become tokens, shippers draw an advance from a lending pool, and a parametric storm cover pays out the moment weather oracles post the wind.' },
  { key: 'tempaan', name: 'TEMPAAN', tagline: 'A dollar struck from what you hold.', category: 'CDP stablecoin', kind: 'defi', url: 'https://tempaan.vercel.app', hue: 45,
    body: 'A mint at night. Lock gold and mint a dollar against it at 150% collateral, with stability fees, Dutch-auction liquidations and a USDC peg reserve. One button crashes the market so you can watch liquidations run.' },
  { key: 'terikal', name: 'TERIKAL', tagline: 'Your roof is a power plant.', category: 'DePIN energy', kind: 'real', url: 'https://terikal.vercel.app', hue: 32,
    body: 'A desert solar valley from golden hour to dawn. Solar panels, wind turbines and batteries register as on-chain devices, 2-of-3 meter oracles attest each hour\'s output, and kilowatt-hours clear in an hourly market.' },
  { key: 'tujurel', name: 'TUJUREL', tagline: 'Every line ends at the same station.', category: 'Rollups & bridge', kind: 'infra', url: 'https://tujurel.vercel.app', hue: 275,
    body: 'A metro at night. Rollups run as metro lines whose batches wait seven days at Central. Anyone can prove a forged ticket wrong on-chain and slash its poster, and a bridge offers instant exits through bonded liquidity.' },
  { key: 'veil', name: 'VEIL', tagline: 'Pay everyone. Reveal no one.', category: 'Private payroll', kind: 'privacy', url: 'https://veil-blue.vercel.app', hue: 215,
    body: 'A dark ink-and-copper hall. One treasury deposit is paid out by bonded relayers from their own inventory inside a jitter window, so nothing links the company to its staff. The full map stays encrypted for the auditor.' },
  { key: 'zelra', name: 'ZELRA', tagline: 'Reveal the proof, not the data.', category: 'ZK credentials', kind: 'privacy', url: 'https://zelra-three.vercel.app', hue: 285, tags: ['Circom', 'snarkjs', 'Groth16'],
    body: 'One continuous journey through a private chamber. Prove a financial condition, such as collateral ≥ 1.5× a loan, with a zero-knowledge proof that never reveals the value; a credit line and an eligibility drop consume the proofs. Live on Robinhood Chain mainnet (needs a wallet).' },
];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const arrow = '<svg class="ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

export const WORLDS_CSS = `
/* ---------- the worlds on the Labs page: each card a dark plate in the product's own colour, the tagline in serif, the facts under it */
.worlds-stack { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 10px; margin: -6px 0 clamp(26px, 3vw, 40px); font: 600 12px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--faint); }
.worlds-stack span { padding: 6px 11px; border: 1px solid var(--line); border-radius: 999px; color: var(--dim); letter-spacing: 0.1em; }
.worlds-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; }
.world { --acc: hsl(var(--h) 70% 72%); --bgc: hsl(var(--h) 34% 11%); display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: var(--bg-2); transition: border-color 0.35s, transform 0.6s var(--ease); }
.world:hover { border-color: var(--line-2); transform: translateY(-3px); }
.world[hidden] { display: none; }   /* (the filter hides by attribute; the flex display above would otherwise win) */
.labs-chapter .serif-h { margin-bottom: clamp(18px, 2vw, 28px); }
.world-plate { position: relative; display: flex; flex-direction: column; justify-content: flex-end; min-height: 190px; padding: 22px 22px 20px; background: radial-gradient(120% 100% at 85% 0%, color-mix(in srgb, var(--acc) 28%, transparent), transparent 62%), radial-gradient(90% 80% at 10% 100%, color-mix(in srgb, var(--acc) 14%, transparent), transparent 60%), var(--bgc); }
.world-plate::before { content: ""; position: absolute; inset: 0; background: linear-gradient(var(--line) 1px, transparent 1px) 0 0 / 34px 34px, linear-gradient(90deg, var(--line) 1px, transparent 1px) 0 0 / 34px 34px; opacity: 0.5; pointer-events: none; }
/* a plate with a photograph of the world: the picture fills it, a scrim keeps the labels and the tagline readable, a slow zoom on hover */
.world-plate.has-shot { aspect-ratio: 16 / 9; min-height: 0; padding: 20px 22px 18px; }
.world-shot { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; object-fit: cover; transform: scale(1.001); transition: transform 1.4s var(--ease), opacity 0.6s; }
.world:hover .world-shot { transform: scale(1.045); }
.world-plate.has-shot::before { z-index: 1; opacity: 1; background: linear-gradient(to top, rgba(9, 8, 10, 0.9) 0%, rgba(9, 8, 10, 0.5) 34%, rgba(9, 8, 10, 0) 58%), linear-gradient(to bottom, rgba(9, 8, 10, 0.55), rgba(9, 8, 10, 0) 30%); }
.world-plate.has-shot .world-top, .world-plate.has-shot .world-tag { z-index: 2; }
.world-plate.has-shot .world-top { color: rgba(241, 234, 219, 0.8); }
.world-plate.has-shot .world-tag { text-shadow: 0 1px 14px rgba(0, 0, 0, 0.5); }
@media (prefers-reduced-motion: reduce) { .world:hover .world-shot { transform: none; } }
.world-top { position: absolute; left: 22px; right: 22px; top: 18px; display: flex; justify-content: space-between; gap: 10px; font: 600 11px var(--cond); letter-spacing: 0.18em; text-transform: uppercase; color: var(--faint); }
.world-top b { color: var(--acc); font-weight: 700; }
.world-tag { position: relative; font: italic 400 clamp(24px, 1.9vw, 30px)/1.12 var(--serif); color: var(--ink); text-wrap: balance; }
.world-body { display: flex; flex-direction: column; gap: 10px; padding: 18px 22px 22px; flex: 1; }
.world-name { font: 700 22px/1 var(--cond); letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink); }
.world-cat { font: 600 11px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--acc); }
.world-desc { font-size: 15.5px; line-height: 1.55; color: var(--dim); text-wrap: pretty; }
.world-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; padding-top: 6px; }
.world-tags span { padding: 5px 9px; border: 1px solid var(--line); border-radius: 999px; font: 600 10.5px var(--cond); letter-spacing: 0.12em; text-transform: uppercase; color: var(--faint); }
.world-tags span.is-extra { color: var(--acc); border-color: color-mix(in srgb, var(--acc) 40%, transparent); }
.world-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.world-links a { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border: 1px solid var(--line-2); border-radius: 999px; font: 600 11px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--dim); transition: border-color 0.3s, color 0.3s, background 0.3s; }
.world-links a:hover, .world-links a:focus-visible { border-color: var(--ink); color: var(--ink); }
.world-links .ar { width: 0.8em; height: 0.8em; }
.world.is-live .world-top b::after { content: " · live"; color: #7fd49c; }
.worlds-after { margin-top: clamp(80px, 9vw, 130px); padding-top: clamp(40px, 5vw, 64px); border-top: 1px solid var(--line-2); }
@media (max-width: 1100px) { .worlds-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .worlds-grid { grid-template-columns: 1fr; } .world-plate { min-height: 160px; } }
`;

/** The worlds section (the first chapter of the Labs page): the kick, the filter pills, the cards. `t` is the page's translator,
 *  `u` adds the language prefix to a link, `splitPair` is the site's rising headline. */
export function worldsSection({ t, u = (p) => p, splitPair = (a, b) => `${esc(a)} <em>${esc(b)}</em>`, labsCount = 0, exists = () => false, img = null }) {
  const kick = (s) => `<span class="kick"><span class="sr">${esc(s)}</span><span class="kt" aria-hidden="true">${esc(s)}</span></span>`;
  const n = WORLDS.length;
  const counts = Object.fromEntries(WORLD_KINDS.map(([k]) => [k, WORLDS.filter((w) => w.kind === k).length]));
  const pills = [['all', t('all'), n], ...WORLD_KINDS.map(([k, label]) => [k, label, counts[k]])]
    .map(([k, label, c]) => `<button type="button" class="pill-f" data-kind="${k}" aria-pressed="${k === 'all'}"><span>${esc(label)}</span><span class="c">${c}</span></button>`).join('');
  const cards = WORLDS.map((w, i) => {
    const tags = [...SHARED_TAGS.map((x) => `<span>${esc(x)}</span>`), ...(w.tags || []).map((x) => `<span class="is-extra">${esc(x)}</span>`)].join('');
    // the plate: a photograph of the world itself (public/site/labs/<key>.webp, taken past its gate) when there is one, the
    // first row fetched eagerly since it sits near the top of the page; a card without a picture keeps the coloured plate
    const shotRel = `site/labs/${w.key}.webp`;
    const shot = img && exists(shotRel) ? img(shotRel, t('lw_shotAlt', { n: w.name }), { cls: 'world-shot', sizes: '(min-width: 1100px) 31vw, (min-width: 640px) 46vw, 92vw', eager: i < 3 }) : '';
    return `<li class="world${w.live ? ' is-live' : ''}" data-kind="${w.kind}" style="--i:${i % 9};--h:${w.hue}">
      <div class="world-plate${shot ? ' has-shot' : ''}">${shot}<span class="world-top"><span>${pad(i + 1)} / ${pad(n)}</span><b>${esc(w.category)}</b></span><p class="world-tag">${esc(w.tagline)}</p></div>
      <div class="world-body">
        <h3 class="world-name">${esc(w.name)}</h3>
        <span class="world-cat">${esc(w.category)}</span>
        <p class="world-desc">${esc(w.body)}</p>
        <div class="world-tags">${tags}</div>
        <div class="world-links"><a href="${esc(w.url)}/" target="_blank" rel="noopener" data-track="lab_open" data-lab="${esc(w.key)}" data-channel="visit">${esc(t('lw_visit'))} ${arrow}</a></div>
      </div>
    </li>`;
  }).join('');
  return `<section class="arc labs worlds wrap" aria-labelledby="labs-h">
    <div class="p-crumbs" data-reveal><a href="${esc(u('/'))}">${esc(t('backHome'))}</a><span>${esc(t('lw_count', { n, m: labsCount }))}</span></div>
    <span class="p-kick" data-reveal>${kick('Labs')}</span>
    <h1 class="p-title cap" id="labs-h" data-split>${splitPair(t('lw_title'), t('lw_em'))}</h1>
    <p class="p-lead arc-lead" data-reveal>${esc(WORLDS_INTRO)}</p>
    <div class="worlds-stack" data-reveal><span style="border:0;padding:0;letter-spacing:0.16em;color:var(--faint)">${esc(t('lw_stack'))}</span>${WORLDS_STACK.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
    <div class="arc-filters" role="group" aria-label="${esc(t('lw_filter'))}" data-reveal>${pills}</div>
    <p class="sr" role="status"></p>
    <ol class="arc-grid worlds-grid" data-stagger>${cards}</ol>
  </section>`;
}
