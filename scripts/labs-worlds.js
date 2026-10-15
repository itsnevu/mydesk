// The worlds: a series of products, each told as one scroll-driven 3D world backed by a working dApp and Solidity
// contracts, every app running its real contracts on an Ethereum chain inside the browser. Navy's copy, as written
// (2026-10-13); the cards and the filter render on the Labs page (scripts/site.js labsPage), above the GitHub experiments.
// The site's words present them as "3D web interactive design" and never say "crypto" (Navy, 2026-10-12): the lead, the
// page description and the home's reel all follow that; the cards' categories and tags keep each product's own facts.
// Each card: name, tagline, category, description, tags and one "Visit" link to the site's root (Navy: never the /app/ path).
// The card's picture is a frame of the world itself, public/site/labs/<key>.webp (1280x720, with a -800 copy for phones):
// taken past the site's gate ("Enter silent", "Drop in", "Go inside", "Go for orbit", "Board in silence"), a few wheel steps in,
// then cropped under the site's own header. A world without a picture keeps the coloured plate.
// Indonesian and Chinese: LAB_WORLDS_T (the worlds) and WORLDS_UI (the section's own words) under the list, read through
// worldsFor(lang) and worldsUiFor(lang); worldsSection({ ..., lang }) prints them. English stays the default.

export const WORLDS_INTRO = 'A series of 3D web interactive designs: each one a product told as a scroll-driven 3D world, with a working app behind it that runs its real logic inside the browser, so you can play every role without signing up for anything. All brands are concepts except Pyris Pact, which is a live product.';
export const WORLDS_STACK = ['three.js', 'TypeScript', 'Vite', 'Solidity (Foundry, OpenZeppelin)', 'viem', 'an in-browser EVM sandbox'];
// the tags every card carries (the shared stack, short), before a card's own
const SHARED_TAGS = ['three.js', 'TypeScript', 'Solidity', 'viem'];

// the filters: a few families of products (every world has its own category; these group them)
export const WORLD_KINDS = [['defi', 'DeFi & markets'], ['privacy', 'Privacy & ZK'], ['infra', 'Wallets & infrastructure'], ['real', 'Real-world assets']];

// the worlds, A to Z; the order the site shows them in is SHOWCASE below
const WORLDS_AZ = [
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
// the showcase: the worlds Navy wants seen first (2026-10-12: "zelra, veil, tabika, serlok, kresil itu yang paling atas"), in this
// order, on the Labs page and in the home's reel alike (both number the cards from this list); the rest follow A to Z
export const SHOWCASE = ['zelra', 'veil', 'tabika', 'serlok', 'kresil'];
export const WORLDS = [...SHOWCASE.map((k) => WORLDS_AZ.find((w) => w.key === k)).filter(Boolean), ...WORLDS_AZ.filter((w) => !SHOWCASE.includes(w.key))];

// ---------- the same worlds in Indonesian and Chinese: per world its tagline, category and body (the card's description). A field
// missing here falls back to the English above (Pyris Pact keeps its Latin motto everywhere; a category that is all product
// terms stays as it is). Names, tech names and tags are never translated. The English's rules hold here too: no dashes, and the
// worlds are "3D web interactive design" in every language (the header above).
// (named LAB_WORLDS_T, not WORLDS_T: i18n-projects.js already exports a WORLDS_T for the 3D desk's worlds, and site.js imports it)
export const LAB_WORLDS_T = {
  id: {
    anginra: { tagline: 'Perdagangkan angin.',
      body: 'Sebuah regata layar, dari tembakan start sampai matahari terbenam, menjelaskan cara kerja bursa perpetual futures. Ambil posisi long atau short di ETH dan WIND hingga 20× dengan margin USDC, dengan funding per detik, mark price dari oracle, likuidasi oleh keeper dan vault LP di sisi seberangnya.' },
    bakaura: { tagline: 'Setiap ton, dihitung sekali.', category: 'Karbon biru / ReFi',
      body: 'Satu hari di pesisir mangrove yang telah dipulihkan. Karbon diukur oleh sensor dan satelit, disahkan oleh 2 dari 3 verifikator, diterbitkan sebagai satu token per ton dengan cadangan buffer untuk risiko pelepasan kembali, diperdagangkan, lalu dipensiunkan menjadi sertifikat on-chain.' },
    bendara: { tagline: 'Air terkunci, tetap cair.',
      body: 'Satu hari di sebuah bendungan pegunungan. Stake USDC untuk mendapatkan bdUSD, yang nilainya naik setiap epoch. Operator menyetor jaminan dan kena slashing dari jaminannya lebih dulu, penarikan mengantre selama tujuh epoch, dan stake yang sama bisa di-restake ke layanan di hilir.' },
    bidama: { tagline: 'Pembayaran yang menggelinding.', category: 'Routing pembayaran',
      body: 'Lintasan kelereng yang cerah. Router menghitung harga setiap jalur lewat pool stablecoin dan mendaratkan pembayaran multi-hop dalam token yang diinginkan penerima. Ia juga mengurus invoice, penggajian massal dan langganan, lalu menggambar setiap rute sebagai lintasan kelereng.' },
    dengung: { tagline: 'Mesin yang bayar sendiri.', category: 'Pembayaran agen AI',
      body: 'Sarang lebah yang berpendar di malam hari. Agen AI saling membayar per panggilan API lewat micropayment channel dengan voucher bertanda tangan, dan mensubkontrakkan pekerjaan ke rantai agen berikutnya dengan escrow, stake dan reputasi.' },
    komidi: { tagline: 'Setiap koin adalah wahana.', category: 'Launchpad memecoin',
      body: 'Pasar malam di atas danau. Siapa pun bisa meluncurkan koin di satu bonding curve bersama. Begitu kurvanya penuh, koin itu naik kelas ke sebuah pool yang LP-nya dikunci selamanya, dengan vesting untuk pembuatnya.' },
    kresil: { tagline: 'Mesin, tumbuh dalam kristal.', category: 'NFT asal-usul',
      body: 'Satu perjalanan tanpa putus menembus es yang tumbuh. Pesan sebuah mesin lebih dulu dengan dana di escrow, lalu terima sertifikat NFT yang kristal SVG on-chain-nya tumbuh di setiap tahap lab, sampai mesinnya dikirim.' },
    kuanta: { tagline: 'Mesin yang ditakuti wallet Anda.', category: 'Keamanan pasca-kuantum',
      body: 'Turun ke dalam komputer kuantum bersuhu 15 milikelvin. Periksa apakah public key sebuah wallet sudah terekspos, lalu pindahkan dananya ke vault yang diamankan tanda tangan berbasis hash Lamport, diverifikasi on-chain. Simulasi Q-Day menguras wallet yang terekspos, sementara vault-nya tetap bertahan.' },
    kuncira: { tagline: 'Sebuah rumah, bukan kunci.',
      body: 'Kompleks rumah Jawa di tengah badai malam. Smart wallet yang dibuka dengan passkey, dengan session key, batas belanja harian, gas yang dibayar dengan USDC, dan guardian yang bisa mengganti gemboknya kalau kuncinya hilang.' },
    nemora: { tagline: 'Orbit rendah, tetap terbuka.', category: 'Bounty sampah antariksa',
      body: 'Satu putaran mengelilingi Bumi selama 92 menit. Sponsor mendanai bounty untuk sampah antariksa sungguhan yang terlacak, seperti Envisat, dan seorang operator menyetor jaminan untuk mengambil misinya. Konsorsium pelacak 2 dari 3 mengesahkan penangkapan dan masuknya kembali ke atmosfer di Point Nemo, lalu kredit pembersihan dicetak dan dipensiunkan.' },
    pustaria: { tagline: 'Perpustakaan yang tak bisa lupa.', category: 'Penyimpanan terdesentralisasi',
      body: 'Perpustakaan luas di malam hari. Bayar sekali untuk menyimpan sebuah file, yang dipecah menjadi potongan dan disegel di bawah satu Merkle root. Para penjaga yang menyetor jaminan wajib menjawab tantangan halaman acak setiap epoch, atau kehilangan jaminannya.' },
    pyris: { category: 'Escrow per milestone (produk live)',
      body: 'Berjalan menyusuri kota Romawi dari satu senja ke senja berikutnya. Escrow per milestone dalam USDC di Arc dan Robinhood Chain: aplikasinya membaca kontrak mainnet yang sedang live, dan setiap fungsi escrow, dari pembuatan sampai sengketa dan arbitrase, bisa dimainkan di sandbox.' },
    rimbasa: { tagline: 'Menembus hutan gelap, tetap tersegel.', category: 'Perlindungan MEV',
      body: 'Hutan kunang-kunang di malam hari. Transaksi tetap tersegel sampai sebuah blok memasukkannya, para searcher menawar dalam lelang tertutup untuk bertransaksi di belakangnya, dan 90% dari nilai itu kembali ke pengguna. Aplikasinya memperlihatkan swap yang sama saat terkena sandwich dan saat tersegel.' },
    serlok: { tagline: 'Kerumunan adalah oracle-nya.', category: 'Pasar prediksi',
      body: 'Observatorium di puncak gunung pada malam hari. Siapa pun bisa membuka pasar, dan kerumunan memperdagangkan hasil-hasilnya di pool constant-product. Jawabannya diselesaikan secara optimistis: proposal dengan jaminan, jendela sengketa yang terbuka, dan dewan beranggotakan lima orang.' },
    subakra: { tagline: 'Uang yang mengalir seperti air.', category: 'Streaming uang',
      body: 'Sawah terasering Bali dari subuh sampai malam. Gaji, langganan dan vesting mengalir per detik sebagai stream yang bisa dipindahtangankan, dengan penggajian massal dari sebuah CSV.' },
    tabika: { tagline: 'Uang yang bepergian tanpa terlihat.', category: 'Pembayaran privat (zero-knowledge)',
      body: 'Satu putaran kereta keliling Jepang. Sebuah shielded pool: setor yen sebagai catatan rahasia, lalu tarik di mana saja, atau bayar sebuah toko lewat relayer, dengan bukti zero-knowledge Groth16 yang dibuat di browser dalam sekitar setengah detik. Tidak ada yang menghubungkan setoran dengan pembayarannya.' },
    tambat: { tagline: 'Kargo, ditambatkan on-chain.', category: 'Pembiayaan perdagangan RWA',
      body: 'Sebuah pelabuhan sepanjang satu malam. Bill of lading menjadi token, pengirim barang menarik pembiayaan di muka dari lending pool, dan asuransi badai parametrik langsung membayar begitu oracle cuaca mencatat kecepatan anginnya.' },
    tempaan: { tagline: 'Dolar yang ditempa dari milik Anda.', category: 'Stablecoin CDP',
      body: 'Percetakan uang di malam hari. Kunci emas dan cetak dolar dengan jaminan itu pada kolateral 150%, dengan stability fee, likuidasi lewat lelang Belanda dan cadangan USDC untuk menjaga peg. Satu tombol membuat pasar anjlok, supaya Anda bisa melihat likuidasinya berjalan.' },
    terikal: { tagline: 'Atap Anda adalah pembangkit listrik.', category: 'Energi DePIN',
      body: 'Lembah surya di gurun, dari golden hour sampai fajar. Panel surya, turbin angin dan baterai terdaftar sebagai perangkat on-chain, oracle meteran 2 dari 3 mengesahkan output setiap jam, dan kilowatt-jam diperdagangkan di pasar per jam.' },
    tujurel: { tagline: 'Setiap jalur berakhir di stasiun yang sama.', category: 'Rollup & bridge',
      body: 'Metro di malam hari. Rollup berjalan sebagai jalur-jalur metro yang batch-nya menunggu tujuh hari di Central. Siapa pun bisa membuktikan secara on-chain bahwa sebuah tiket itu palsu dan men-slash pengirimnya, dan sebuah bridge menawarkan jalan keluar instan lewat likuiditas berjaminan.' },
    veil: { tagline: 'Bayar semua. Tak satu pun terungkap.', category: 'Penggajian privat',
      body: 'Aula gelap bernuansa tinta dan tembaga. Satu setoran treasury dibayarkan oleh relayer berjaminan dari inventaris mereka sendiri dalam rentang waktu yang diacak, jadi tidak ada yang menghubungkan perusahaan dengan stafnya. Peta lengkapnya tetap terenkripsi, hanya untuk auditor.' },
    zelra: { tagline: 'Tunjukkan buktinya, bukan datanya.', category: 'Kredensial ZK',
      body: 'Satu perjalanan tanpa putus melewati sebuah ruang privat. Buktikan sebuah kondisi keuangan, misalnya kolateral ≥ 1,5× pinjaman, dengan bukti zero-knowledge yang tidak pernah mengungkap nilainya; fasilitas kredit dan airdrop berbasis kelayakan memakai bukti-bukti itu. Live di mainnet Robinhood Chain (perlu wallet).' },
  },
  zh: {
    anginra: { tagline: '乘风交易。', category: '永续合约 DEX',
      body: '一场帆船赛，从发令枪响到日落，讲清楚一个永续合约交易所怎么运作。以 USDC 作保证金，对 ETH 和 WIND 做多或做空，最高 20 倍杠杆；资金费率按秒结算，标记价格来自预言机，清算由 keeper 执行，另一边是一个 LP 金库。' },
    bakaura: { tagline: '每一吨，只算一次。', category: '蓝碳 / ReFi',
      body: '在一片修复后的红树林海岸度过一天。碳由传感器和卫星测量，经三位验证者中任意两位证明，按每吨一个代币发行并留出逆转缓冲，进入交易，最后注销为一张链上证书。' },
    bendara: { tagline: '锁住的水，依然流动。', category: '流动性质押与再质押',
      body: '高山水坝上的一天。质押 USDC 换取 bdUSD，它的汇率每个周期都会上涨。运营者要缴纳保证金，被罚没时先从保证金扣起；提款需排队七个周期；同一份质押还能再质押给下游的服务。' },
    bidama: { tagline: '会滚动的支付。', category: '支付路由',
      body: '一条色彩明亮的弹珠轨道。路由器为每条穿过稳定币池的路径报价，把多跳支付以收款人想要的代币送到。它还处理发票、批量发薪和订阅，并把每条路线画成一段弹珠轨道。' },
    dengung: { tagline: '自己买单的机器。', category: 'AI 智能体支付',
      body: '夜里一座发光的蜂巢。AI 智能体通过微支付通道和签名凭证，按每次 API 调用互相付款，并借助托管、质押和信誉，把工作沿着一条条智能体链层层转包下去。' },
    komidi: { tagline: '每枚币，都是一趟游乐。', category: 'Memecoin 发射平台',
      body: '湖上的一场夜市。任何人都能在同一条共享的联合曲线上发行一枚币。曲线填满后，这枚币便“毕业”进入一个池子，池中的 LP 永久锁定，创建者的份额按期解锁。' },
    kresil: { tagline: '机器，在晶体中生长。', category: '溯源 NFT',
      body: '一镜到底，穿过层层生长的冰。预订一台机器，款项进入托管，你会收到一张 NFT 证书，证书里的链上 SVG 晶体随实验室的每个阶段一起生长，直到交付。' },
    kuanta: { tagline: '让你的钱包害怕的机器。', category: '后量子安全',
      body: '下潜到一台 15 毫开尔文的量子计算机内部。先检查一个钱包的公钥是否已经暴露，再把资金转进一个金库，由在链上验证的 Lamport 哈希签名保护。一场 Q-Day 模拟会掏空暴露的钱包，而金库安然无恙。' },
    kuncira: { tagline: '一座房子，而非一把钥匙。', category: '智能钱包（账户抽象）',
      body: '暴风雨之夜里的一座爪哇宅院。一个用通行密钥打开的智能钱包，带会话密钥、每日消费限额、用 USDC 支付的 gas，还有守护人：钥匙丢了，他们可以帮你换锁。' },
    nemora: { tagline: '近地轨道，保持畅通。', category: '太空碎片悬赏',
      body: '绕地球一圈，92 分钟。赞助方为真实在轨追踪的碎片（比如 Envisat）设立悬赏，一位运营者缴纳保证金接下任务。一个三方追踪联盟中任意两方确认碎片已被捕获，并在尼莫点再入大气层，随后清除信用被铸造并注销。' },
    pustaria: { tagline: '不会遗忘的图书馆。', category: '去中心化存储',
      body: '夜里一座巨大的图书馆。付一次费用就能存下一个文件，文件被切成块，封存在同一个 Merkle 根之下。缴纳了保证金的守护者每个周期都必须回答一次随机抽页的挑战，否则就会失去保证金。' },
    pyris: { category: '里程碑托管（已上线产品）',
      body: '漫步一座罗马城，从一次日落走到下一次日落。在 Arc 和 Robinhood Chain 上以 USDC 进行的里程碑托管：应用读取主网上正在运行的合约，而从创建到争议、仲裁的每一个托管功能，都能在沙盒里亲手试玩。' },
    rimbasa: { tagline: '封好自己，穿行黑暗森林。', category: 'MEV 防护',
      body: '夜里一片萤火虫森林。交易在被打包进区块之前始终密封，搜索者在密封拍卖中竞价，争取紧跟其后交易，而这部分价值的 90% 回到用户手里。应用把同一笔兑换放在一起对比：遭遇三明治攻击时怎样，密封时又怎样。' },
    serlok: { tagline: '群众就是预言机。', category: '预测市场',
      body: '夜里的一座山顶天文台。任何人都能开设一个市场，大家在恒定乘积池里交易它的各种结果。答案以乐观方式结算：一份缴纳保证金的提案、一段开放的争议期，以及一个五人委员会。' },
    subakra: { tagline: '像水一样流动的钱。', category: '资金流支付',
      body: '巴厘岛的梯田，从黎明到夜晚。工资、订阅和分期解锁按秒流动，每一条资金流都可以转让，还能用一个 CSV 批量发薪。' },
    tabika: { tagline: '悄然远行的钱。', category: '隐私支付（零知识）',
      body: '环绕日本的一圈铁路。一个屏蔽池：把日元存成一张秘密票据，然后在任何地方取出，或者通过中继者付款给商店，所需的 Groth16 零知识证明在浏览器里大约半秒就能生成。存款和付款之间没有任何关联。' },
    tambat: { tagline: '货物，停泊在链上。', category: 'RWA 贸易融资',
      body: '港口的一整夜。提单变成代币，托运人从借贷池里提取预付款，一份参数化风暴保险在天气预言机报出风速的那一刻就自动赔付。' },
    tempaan: { tagline: '用你持有的东西，铸出一枚美元。', category: 'CDP 稳定币',
      body: '夜里的一座铸币厂。锁入黄金，以 150% 的抵押率铸出美元，配有稳定费、荷兰式拍卖清算和 USDC 锚定储备。按下一个按钮，市场就会崩盘，让你亲眼看着清算一笔笔执行。' },
    terikal: { tagline: '你的屋顶就是一座电站。', category: 'DePIN 能源',
      body: '一座沙漠里的太阳能山谷，从黄金时刻到黎明。太阳能板、风力涡轮机和电池注册为链上设备，三个电表预言机中任意两个证明每小时的发电量，千瓦时在每小时一轮的市场里撮合成交。' },
    tujurel: { tagline: '每条线路，都终于同一站。', category: 'Rollup 与跨链桥',
      body: '夜里的地铁。Rollup 像一条条地铁线运行，每一批都要在中央站等上七天。任何人都能在链上证明一张车票是伪造的，并罚没发布者的保证金；一座跨链桥则借助有保证金的流动性，提供即时退出。' },
    veil: { tagline: '付给每个人，不暴露任何人。', category: '隐私薪资',
      body: '一座墨色与铜色交织的幽暗大厅。一笔金库存款由缴纳了保证金的中继者，用他们自己的库存，在一段随机错开的时间窗内发放出去，因此没有任何线索能把公司和员工联系起来。完整的对应表只以密文保存，留给审计方查看。' },
    zelra: { tagline: '只亮出证明，不亮出数据。', category: 'ZK 凭证',
      body: '一镜到底，穿过一间私密的内室。用零知识证明来证明一项财务条件，比如抵押品 ≥ 贷款的 1.5 倍，却从不透露具体数值；一条信用额度和一次资格空投会使用这些证明。已在 Robinhood Chain 主网上线（需要钱包）。' },
  },
};

// the section's own words per language: the kick, the lead, the filter's kinds, and the one stack item that is a phrase, not a name
// (the rest of its words, the headline, the counts, Visit and the alt text, come from the site's `t`, scripts/i18n.js lw_*)
const WORLDS_UI = {
  id: { kick: 'Labs',
    intro: 'Serangkaian 3D web interactive design: masing-masing satu produk yang diceritakan sebagai dunia 3D yang bergerak mengikuti scroll, dengan aplikasi sungguhan di baliknya yang menjalankan logika aslinya di dalam browser, jadi Anda bisa memainkan setiap peran tanpa perlu mendaftar apa pun. Semua brand di sini adalah konsep, kecuali Pyris Pact, yang sudah menjadi produk live.',
    kinds: { defi: 'DeFi & pasar', privacy: 'Privasi & ZK', infra: 'Wallet & infrastruktur', real: 'Aset dunia nyata' },
    stack: { 'an in-browser EVM sandbox': 'sandbox EVM di dalam browser' } },
  zh: { kick: '实验室', title: '3D 网页交互设计',
    intro: '一系列 3D 网页交互设计：每一个都把一款产品讲成一个随滚动展开的 3D 世界，背后是一个真正能用的应用，在浏览器里运行它真实的逻辑，所以每一个角色你都可以亲自扮演，什么都不用注册。除了已上线的 Pyris Pact，其余品牌都是概念。',
    kinds: { defi: 'DeFi 与市场', privacy: '隐私与 ZK', infra: '钱包与基础设施', real: '现实世界资产' },
    stack: { 'an in-browser EVM sandbox': '浏览器内的 EVM 沙盒' } },
};

/** The section's words in a language: { kick, intro, stack, kinds } ('en', or a language without words, gives the English exports). */
export function worldsUiFor(lang = 'en') {
  const x = WORLDS_UI[lang];
  if (!x) return { kick: 'Labs', title: '3D web interactive design', intro: WORLDS_INTRO, stack: WORLDS_STACK, kinds: WORLD_KINDS };
  return { kick: x.kick ?? 'Labs', title: x.title ?? '3D web interactive design', intro: x.intro ?? WORLDS_INTRO, stack: WORLDS_STACK.map((s) => x.stack?.[s] ?? s), kinds: WORLD_KINDS.map(([k, label]) => [k, x.kinds?.[k] ?? label]) };
}

/** The worlds in a language: WORLDS in the same order, with tagline, category and body translated where a translation exists
 *  ('en', or a language without translations, gives WORLDS itself). Everything else (key, name, kind, url, hue, tags, live) is kept. */
export function worldsFor(lang = 'en') {
  const T = LAB_WORLDS_T[lang];
  if (!T) return WORLDS;
  return WORLDS.map((w) => { const x = T[w.key]; return x ? { ...w, tagline: x.tagline ?? w.tagline, category: x.category ?? w.category, body: x.body ?? w.body } : w; });
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const arrow = '<svg class="ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

export const WORLDS_CSS = `
/* ---------- the worlds on the Labs page: each card a dark plate in the product's own colour, the tagline in serif, the facts under it */
.worlds-stack { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 10px; margin: -6px 0 clamp(26px, 3vw, 40px); font: 600 12px var(--cond); letter-spacing: 0.16em; text-transform: uppercase; color: var(--faint); }
.worlds-stack span { padding: 6px 11px; border: 1px solid var(--line); border-radius: 999px; color: var(--dim); letter-spacing: 0.1em; }
.worlds-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; }
.world { --acc: hsl(var(--h) 70% 72%); --bgc: hsl(var(--h) 34% 11%); scroll-margin-top: 96px; display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: var(--bg-2); transition: border-color 0.35s, transform 0.6s var(--ease); }
.world:hover, .js .worlds-grid.in > .world:hover { border-color: var(--line-2); }   /* (no lift: only the Visit pill is a link) */
/* the card the home's reel sent you to (#w-<key>) is marked */
.world:target { border-color: var(--acc); box-shadow: 0 0 0 1px var(--acc), 0 24px 50px -30px rgba(0, 0, 0, 0.85); }
.world[hidden] { display: none; }   /* (the filter hides by attribute; the flex display above would otherwise win) */
.labs-chapter .serif-h { margin-bottom: clamp(18px, 2vw, 28px); }
.world-plate { position: relative; display: flex; flex-direction: column; justify-content: flex-end; min-height: 190px; padding: 22px 22px 20px; background: radial-gradient(120% 100% at 85% 0%, color-mix(in srgb, var(--acc) 28%, transparent), transparent 62%), radial-gradient(90% 80% at 10% 100%, color-mix(in srgb, var(--acc) 14%, transparent), transparent 60%), var(--bgc); }
.world-plate::before { content: ""; position: absolute; inset: 0; background: linear-gradient(var(--line) 1px, transparent 1px) 0 0 / 34px 34px, linear-gradient(90deg, var(--line) 1px, transparent 1px) 0 0 / 34px 34px; opacity: 0.5; pointer-events: none; }
/* a plate with a photograph of the world: the picture fills it, a scrim keeps the labels and the tagline readable, a slow zoom on hover */
/* (the plate clips its own picture: the slow zoom grew the picture past the plate's bottom edge into the body, out from under
   the scrim, a brighter strip that did not belong to anything; the plate's top corners round like the card's) */
.world-plate.has-shot { aspect-ratio: 16 / 9; min-height: 0; padding: 20px 22px 18px; overflow: hidden; border-radius: 13px 13px 0 0; isolation: isolate; }
.world-shot { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; object-fit: cover; transform: scale(1.001); transition: transform 1.4s var(--ease), opacity 0.6s; }
.world:hover .world-shot { transform: scale(1.045); }
.world-plate.has-shot::before { z-index: 1; opacity: 1; background: linear-gradient(to top, rgba(9, 8, 10, 0.92) 0%, rgba(9, 8, 10, 0.55) 36%, rgba(9, 8, 10, 0) 60%), linear-gradient(to bottom, rgba(9, 8, 10, 0.78), rgba(9, 8, 10, 0) 34%); }
.world-plate.has-shot .world-top, .world-plate.has-shot .world-tag { z-index: 2; }
.world-plate.has-shot .world-top { color: rgba(241, 234, 219, 0.92); text-shadow: 0 1px 8px rgba(0, 0, 0, 0.65); } .world-plate.has-shot .world-tag { text-shadow: 0 1px 10px rgba(0, 0, 0, 0.7); }
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
:lang(zh) .world.is-live .world-top b::after { content: " · 已上线"; }   /* (Indonesian says "live" too; Chinese does not) */
.worlds-after { margin-top: clamp(80px, 9vw, 130px); padding-top: clamp(40px, 5vw, 64px); border-top: 1px solid var(--line-2); }
@media (max-width: 1100px) { .worlds-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .worlds-grid { grid-template-columns: 1fr; } .world-plate { min-height: 160px; } }
`;

/** The worlds section (the first chapter of the Labs page): the kick, the filter pills, the cards. `t` is the page's translator,
 *  `u` adds the language prefix to a link, `splitPair` is the site's rising headline, `lang` ('en', 'id' or 'zh') the language of
 *  the words this module holds itself (the lead, the kinds, the worlds' taglines, categories and bodies). */
export function worldsSection({ t, u = (p) => p, splitPair = (a, b) => `${esc(a)} <em>${esc(b)}</em>`, labsCount = 0, exists = () => false, img = null, lang = 'en' }) {
  const kick = (s) => `<span class="kick"><span class="sr">${esc(s)}</span><span class="kt" aria-hidden="true">${esc(s)}</span></span>`;
  const S = worldsUiFor(lang), worlds = worldsFor(lang);
  const n = worlds.length;
  const counts = Object.fromEntries(S.kinds.map(([k]) => [k, worlds.filter((w) => w.kind === k).length]));
  const pills = [['all', t('all'), n], ...S.kinds.map(([k, label]) => [k, label, counts[k]])]
    .map(([k, label, c]) => `<button type="button" class="pill-f" data-kind="${k}" aria-pressed="${k === 'all'}"><span>${esc(label)}</span><span class="c">${c}</span></button>`).join('');
  const cards = worlds.map((w, i) => {
    const tags = [...SHARED_TAGS.map((x) => `<span>${esc(x)}</span>`), ...(w.tags || []).map((x) => `<span class="is-extra">${esc(x)}</span>`)].join('');
    // the plate: a photograph of the world itself (public/site/labs/<key>.webp, taken past its gate) when there is one, the
    // first row fetched eagerly since it sits near the top of the page; a card without a picture keeps the coloured plate
    const shotRel = `site/labs/${w.key}.webp`;
    const shot = img && exists(shotRel) ? img(shotRel, t('lw_shotAlt', { n: w.name }), { cls: 'world-shot', sizes: '(min-width: 1100px) 31vw, (min-width: 640px) 46vw, 92vw', eager: i < 3 }) : '';
    return `<li class="world${w.live ? ' is-live' : ''}" id="w-${w.key}" data-kind="${w.kind}" style="--i:${i % 9};--h:${w.hue}">
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
    <span class="p-kick" data-reveal>${kick(S.kick)}</span>
    <h1 class="p-title cap" id="labs-h" data-split>${splitPair(t('lw_title'), t('lw_em'))}</h1>
    <p class="p-lead arc-lead" data-reveal>${esc(S.intro)}</p>
    <div class="worlds-stack" data-reveal><span style="border:0;padding:0;letter-spacing:0.16em;color:var(--faint)">${esc(t('lw_stack'))}</span>${S.stack.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
    <div class="arc-filters" role="group" aria-label="${esc(t('lw_filter'))}" data-reveal>${pills}</div>
    <p class="sr" role="status"></p>
    <h2 class="sr" id="worlds-list-h">${esc(S.title)}</h2>
    <ol class="arc-grid worlds-grid" aria-labelledby="worlds-list-h" data-stagger>${cards}</ol>
  </section>`;
}
