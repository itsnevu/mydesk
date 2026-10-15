// The stack, made to answer what a reader (a recruiter, a client) asks of it: not only "what does he use" but "what does he use
// most, and what did he actually do with it?". Every tool carries how often it shows up in Navy's work and, one tap away, what it
// is in plain words, what he built with it and where to see it.
// "How often" is counted, never claimed: his own public repositories on GitHub (scripts/github-stats.json, written by
// scripts/github-stats.mjs from the repositories themselves) and the projects in data.js whose stack lists the tool.
// The words are here in three languages (English first); a missing one falls back to English. No dashes, Navy's rule.

// the layers and their tools (the layer names are in i18n.js CONTENT.stack); each tool appears once
// (REST APIs, Swagger and DBeaver are from the stack on itsnevu.xyz; Python joined on 2026-10-15, from seven repositories)
export const STACK = [
  ['Go', 'TypeScript', 'JavaScript', 'PHP', 'Solidity', 'Python'],
  ['Next.js', 'React', 'SvelteKit', 'Tailwind CSS'],
  ['Node.js', 'Bun', 'REST APIs', 'PostgreSQL', 'MySQL'],
  ['WordPress', 'WooCommerce', 'Elementor', 'Custom themes'],
  ['Docker', 'Vercel', 'Swagger', 'DBeaver', 'Figma'],
  ['GSAP', 'Framer Motion', 'Three.js', 'WebGL'],
  ['Smart contracts', 'Wallet integration', 'dApp frontends'],
];
const LANGS = ['Go', 'TypeScript', 'JavaScript', 'PHP', 'Solidity', 'Python'];
// how a project's stack line names a tool, when it is not the tool's own name
const ALIAS = { Tailwind: 'Tailwind CSS', 'Creative theme': 'Custom themes', 'Custom UI': 'Custom themes' };
// what a project's stack line leaves out but its own page says (data.js `did`): GodPlan ships in Docker behind Go services,
// Winfaith reads its catalogue from the company's API
const PROJECT_ALSO = { 'godplan-erp': ['Docker', 'REST APIs'], winfaith: ['REST APIs'] };
// a repository that is a project already counted (one place, not two)
const REPO_PROJECT = { 'backend-godplan': 'godplan-erp' };
// the projects of the current job, PT. Gajah Terbang Kreatif: their tools are the ones "at my job now"
const NOW_PROJECTS = ['godplan-erp', 'godjah-studio', 'godtive'];
// where else a tool can be seen on this site
const AT_LABS = ['TypeScript', 'JavaScript', 'Python', 'Solidity', 'Three.js', 'WebGL', 'Smart contracts', 'Wallet integration', 'dApp frontends'];
const AT_DESK = ['JavaScript', 'WebGL', 'Node.js'];
// GitHub's own colours for the languages (linguist), so the bar reads like the card on a GitHub profile
const LANG_COLOR = { TypeScript: '#3178c6', JavaScript: '#f1e05a', Dart: '#00b4ab', Solidity: '#aa6746', Python: '#3572a5', Go: '#00add8', PHP: '#4f5d95', Kotlin: '#a97bff', 'C#': '#178600', Svelte: '#ff3e00', SQL: '#e38c00', Shell: '#89e051' };
// (markup and styles are in every repository and say little about what someone can build; a notebook's size is mostly the
// output saved inside it, charts and tables, so its bytes are not code either: the notebook's repository still counts for Python)
const NOT_CODE = new Set(['CSS', 'HTML', 'Jupyter Notebook']);
// a repository by the name its product goes by (the names the words above use; Labs uses the same ones)
const REPO_LABEL = {
  'nextjs-commerce-boilerplate': 'LUXE', adpulse: 'AdPulse', Flowkite: 'Flowkite', Curb: 'Curb', jarvis: 'Jarvis', 'credential-forgery-detection': 'NEVU',
  voxel: 'Reel Fortune', chimera: 'Chimera', 'student-performance': 'Student Performance',
};
// (the rest keep their repository's name: a name reads the same in every language, a description would need three)
// repositories counted but never linked by name: what Navy keeps off Labs (his call, 2026-10-12: the on-chain work, Rukun,
// StreakFit and the registration form). They are still in the numbers, and the GitHub link at the end of a row reaches them.
const UNLINKED = new Set(['sheaf', 'payrail', 'mosaic', 'cat', 'pillar', 'prism', 'sc-coinsight', 'be-coinsight', 'fe-coinsight', 'defi-staking-dapp', 'run-app', 'streakfit', 'e-form']);
// what the words call a repository, in any of the three languages, besides its product's name
const SAYS = { 'backend-godplan': ['GodPlan'], mydesk: ['3D', 'portfolio', 'portofolio', '作品集'], 'student-performance': ['graduation', 'kelulusan', '毕业'] };
// a tool with no brand mark gets a monogram in the panel's tile
// tools a repository cannot show (an app on the desk, not a dependency): for the rest, none found means none public yet
const NOT_IN_CODE = new Set(['DBeaver', 'Figma']);
const MONO = { 'REST APIs': 'API', 'Custom themes': 'TH', 'dApp frontends': 'DA' };
const LANG_SLUG = { TypeScript: 'typescript', JavaScript: 'javascript', Solidity: 'solidity', Python: 'python', Go: 'go', PHP: 'php', Dart: 'dart', Kotlin: 'kotlin' };

export const slugOf = (tool) => tool.toLowerCase().replace(/\+/g, 'p').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));

/** Counts every tool in Navy's own repositories and shipped projects. `gh` is scripts/github-stats.json. */
export function stackModel({ D, gh }) {
  const repos = (gh?.repos || []).filter((r) => !r.skip && r.bytes);
  const projects = D.PROJECTS.filter((p) => p.key !== 'client-websites' && p.stack);
  const toolsOf = (p) => [...new Set([...p.stack.split(' · ').map((x) => ALIAS[x] || x), ...(PROJECT_ALSO[p.key] || [])])];
  const pTools = new Map(projects.map((p) => [p.key, toolsOf(p)]));
  const now = new Set(NOW_PROJECTS.flatMap((k) => pTools.get(k) || []));
  // the bytes of his own code per language, markup and styles left out
  const bytes = {};
  for (const r of repos) for (const [l, n] of Object.entries(r.bytes)) if (!NOT_CODE.has(l)) bytes[l] = (bytes[l] || 0) + n;
  const total = Object.values(bytes).reduce((a, b) => a + b, 0) || 1;
  const langRepos = (l) => repos.filter((r) => r.bytes[l]);
  const tools = {};
  for (const tool of STACK.flat()) {
    const inRepos = repos.filter((r) => r.tools.includes(tool));
    const inProjects = projects.filter((p) => pTools.get(p.key).includes(tool));
    const places = new Set([...inProjects.map((p) => p.key), ...inRepos.map((r) => REPO_PROJECT[r.name] || r.name)]).size;
    const isLang = LANGS.includes(tool);
    // a language's repositories in the order of how much of it they hold; a tool's, newest first
    const ordered = isLang ? [...inRepos].sort((a, b) => (b.bytes[tool] || 0) - (a.bytes[tool] || 0)) : [...inRepos].sort((a, b) => b.pushed.localeCompare(a.pushed));
    tools[tool] = {
      repos: ordered, projects: inProjects, places, now: now.has(tool), isLang,
      share: isLang && bytes[tool] ? bytes[tool] / total : 0,
      latest: inRepos.reduce((m, r) => (r.pushed > m ? r.pushed : m), ''),
      level: places >= 10 ? 3 : places >= 4 ? 2 : places >= 1 ? 1 : 0,
    };
  }
  // the bar: the six languages with the most of his code, the rest as one
  const ranked = Object.entries(bytes).sort((a, b) => b[1] - a[1]);
  const langs = ranked.slice(0, 6).map(([name, n]) => ({ name, share: n / total, repos: langRepos(name).length, color: LANG_COLOR[name] || '#8c8c8c', tool: LANGS.includes(name) ? name : null }));
  const rest = ranked.slice(6).reduce((a, [, n]) => a + n, 0);
  if (rest) langs.push({ name: null, share: rest / total, repos: 0, color: null, tool: null });
  // the tools (not the languages) found in the most repositories
  const top = STACK.flat().filter((t) => !LANGS.includes(t) && tools[t].repos.length).sort((a, b) => tools[b].repos.length - tools[a].repos.length).slice(0, 6);
  return { tools, langs, top, repoCount: repos.length, at: gh?.at || '', user: gh?.user || 'itsnevu' };
}

// ---------- the words: what each tool is (for someone who does not code) and what Navy did with it ({n}: WordPress projects, {w}: Labs worlds)
export const STACK_TEXT = {
  en: {
    TypeScript: ['JavaScript with types: mistakes are caught while the code is being written, not by the people using it.', 'My default for anything new: the GodPlan ERP front end, Flowkite (an AI agent that works inside Chrome), the Curb SDK, and the apps behind the Labs worlds.'],
    JavaScript: ['The language every browser runs: what makes a web page move and respond.', 'This portfolio and its 3D desk, on a WebGL engine of my own with no libraries; Reel Fortune, a voxel game in a single page; the AdPulse back end; the JAKASN front end at BKN.'],
    PHP: ['The server language under WordPress, which runs a large part of the web.', 'The WordPress sites and stores I build for clients, and JAKASN at BKN: a journal platform on Open Journal Systems, in PHP and MySQL.'],
    Solidity: ['The language of smart contracts: programs that hold and move money by rules anyone can read.', 'Contracts written in Foundry with OpenZeppelin and tested before they ship: milestone escrow for business payments (Pyris Pact, live) and the contracts behind every Labs world, from private payroll to prediction markets.'],
    Python: ['A readable language that leads in data, machine learning and automation.', 'Jarvis, a voice assistant for Windows that answers in Indonesian; NEVU, forged-diploma detection, its model now being built; a graduation predictor served through FastAPI; the Blender scripts that build the 3D desk.'],
    Go: ["Google's language for servers and APIs: fast, simple and easy to keep running.", 'The back end of GodPlan ERP, my main work since July 2025: a REST API in Gin on PostgreSQL, sign-in with JWT, documented in Swagger, shipped in Docker.'],
    'Next.js': ['A React framework for websites and web apps that load fast and can be found on Google.', 'The GodPlan ERP interface, the Godjah Studio site for Gajah Terbang Kreatif, LUXE (a store template rebranded from one file) and the AdPulse dashboard.'],
    React: ['The library behind most modern web interfaces: screens built from reusable parts.', 'Under every Next.js app I build, and in the Flowkite side panel, where you watch the agent plan, click and type.'],
    SvelteKit: ['A lighter framework that compiles itself away, so pages stay small and quick.', 'The Winfaith site: a manufacturer built as an application rather than a theme, its catalogue served from its own API, with GSAP and Three.js.'],
    'Tailwind CSS': ['Styling written right in the markup, so a design stays consistent from page to page.', 'The styling on almost every app I start: the Next.js apps on GitHub, LUXE and Winfaith.'],
    'Node.js': ['JavaScript on the server: APIs, background jobs, scripts and build tools.', "The build and dev server of this site, the AdPulse sync jobs and API, Chimera's NFT render engine, and the Reel Fortune server."],
    Bun: ['A fast, all in one JavaScript runtime and package manager.', 'Installs and scripts in the GodPlan back end and in a SvelteKit app.'],
    'REST APIs': ['How two programs talk over the web: one asks, the other answers with data.', "The GodPlan ERP API in Go, documented in Swagger; the Express API of AdPulse; route handlers inside Next.js apps; and Winfaith's catalogue, read from the company's own API."],
    PostgreSQL: ['A dependable open-source database for data that has to stay correct.', 'The GodPlan ERP database (employees, attendance, payroll), AdPulse, where Google Ads and Meta Ads data lands every four hours, and several of my Next.js apps.'],
    MySQL: ['The database most websites run on, WordPress included.', 'Under the WordPress stores I build, and behind JAKASN at BKN.'],
    WordPress: ['The most used website platform: the owner updates the site without calling a developer.', '{n} client sites: company profiles, catalogues and online stores for businesses in Indonesia, from car care to aluminium windows.'],
    WooCommerce: ['The shop on top of WordPress: catalogue, cart, payment and delivery.', 'Online stores where checkout and delivery are part of the build: Orthobone mattresses, the Flora Indonesia florist, the 1,700 products of FLS Group, Miniatur Kapal.'],
    Elementor: ['A visual page builder for WordPress: pages are edited by dragging, not by code.', "Sites a client's own team edits after handover: Godtive, Fortunarack, The Bedji Group, Kusen Tangsel and more."],
    'Custom themes': ['A WordPress theme made for one brand, instead of a template many sites share.', 'Where the design asks for it: the first Gajah Terbang Kreatif site, and the custom interface of NF Optical.'],
    Docker: ['Packs an app with everything it needs, so it runs the same on any server.', 'GodPlan ERP ships in Docker, and so do AdPulse, Curb and the graduation predictor.'],
    Vercel: ['Hosting for web apps: every change goes live minutes after it is pushed.', 'This portfolio goes live from GitHub on every push; so do the Labs worlds and the Flowkite site.'],
    Swagger: ['A live manual for an API: every endpoint listed, and tried out in the browser.', 'The GodPlan ERP API documentation, generated from the Go code.'],
    DBeaver: ['A desktop app for looking inside a database and checking data by hand.', 'How I read and check PostgreSQL and MySQL data while I build.'],
    Figma: ['Where interfaces are designed before they are built.', 'Where I read the designs I build from, down to the spacing and the type.'],
    GSAP: ['The animation library behind much of the polished motion on the web.', 'Scroll and entrance motion on Winfaith, and in my apps on GitHub.'],
    'Framer Motion': ['Animation for React interfaces: parts enter, leave and respond smoothly.', 'A few times, for motion inside React apps: a component that enters, leaves or reacts.'],
    'Three.js': ['The library that brings 3D into a web page.', 'The {w} scroll-driven worlds on Labs, the 3D on Winfaith, and the Flowkite landing page.'],
    WebGL: ["The browser's direct line to the graphics card: what draws 3D on the web.", 'The 3D desk runs on a WebGL2 engine I wrote: shadows, tone mapping and depth of field. The dithered background of this page is WebGL2 too.'],
    'Smart contracts': ['Programs on a blockchain that carry out an agreement by themselves.', 'Written in Solidity and tested in Foundry: a milestone escrow that pays out once the work is signed off (Pyris Pact), and the {w} Labs worlds, each running its real contracts on a chain inside the browser.'],
    'Wallet integration': ['Signing in and paying with a wallet instead of a password or a card.', 'Connect, sign and pay flows with viem, wagmi and RainbowKit, in the Labs worlds and in the apps on GitHub.'],
    'dApp frontends': ['The web interface people use to work with smart contracts.', 'Front ends that read and write contracts and say what each step does: the {w} Labs worlds run theirs inside the browser.'],
  },
  id: {
    TypeScript: ['JavaScript dengan tipe data: kesalahan ketahuan saat kode ditulis, bukan oleh orang yang memakainya.', 'Pilihan utama saya untuk semua yang baru: front end GodPlan ERP, Flowkite (agen AI yang bekerja di dalam Chrome), SDK Curb, dan aplikasi di balik dunia-dunia Labs.'],
    JavaScript: ['Bahasa yang dijalankan setiap browser: yang membuat halaman web bergerak dan merespons.', 'Portofolio ini dan meja 3D-nya, di atas engine WebGL buatan saya sendiri tanpa library; Reel Fortune, game voxel dalam satu halaman; back end AdPulse; front end JAKASN di BKN.'],
    PHP: ['Bahasa server di balik WordPress, yang menjalankan sebagian besar web.', 'Situs dan toko WordPress yang saya bangun untuk klien, dan JAKASN di BKN: platform jurnal di atas Open Journal Systems, dengan PHP dan MySQL.'],
    Solidity: ['Bahasa smart contract: program yang menyimpan dan memindahkan uang dengan aturan yang bisa dibaca siapa saja.', 'Kontrak yang ditulis dengan Foundry dan OpenZeppelin, dan diuji sebelum dirilis: escrow per milestone untuk pembayaran bisnis (Pyris Pact, sudah live) dan kontrak di balik setiap dunia Labs, dari payroll privat sampai pasar prediksi.'],
    Python: ['Bahasa yang mudah dibaca, andalan untuk data, machine learning, dan otomasi.', 'Jarvis, asisten suara untuk Windows yang menjawab dalam bahasa Indonesia; NEVU, pendeteksi ijazah palsu yang modelnya sedang dibangun; prediktor kelulusan yang dilayani lewat FastAPI; dan skrip Blender yang membangun meja 3D.'],
    Go: ['Bahasa dari Google untuk server dan API: cepat, sederhana, dan mudah dijaga tetap berjalan.', 'Back end GodPlan ERP, pekerjaan utama saya sejak Juli 2025: REST API dengan Gin di atas PostgreSQL, login dengan JWT, terdokumentasi di Swagger, dan dikirim dalam Docker.'],
    'Next.js': ['Framework React untuk website dan aplikasi web yang cepat dimuat dan mudah ditemukan di Google.', 'Antarmuka GodPlan ERP, situs Godjah Studio untuk Gajah Terbang Kreatif, LUXE (template toko yang diganti brand-nya dari satu file), dan dashboard AdPulse.'],
    React: ['Library di balik sebagian besar antarmuka web modern: layar yang disusun dari komponen yang bisa dipakai ulang.', 'Di bawah setiap aplikasi Next.js yang saya bangun, dan di side panel Flowkite, tempat Anda melihat agen merencanakan, mengklik, dan mengetik.'],
    SvelteKit: ['Framework yang lebih ringan, dikompilasi habis sehingga halaman tetap kecil dan cepat.', 'Situs Winfaith: produsen yang dibangun sebagai aplikasi, bukan tema, dengan katalog dari API-nya sendiri, plus GSAP dan Three.js.'],
    'Tailwind CSS': ['Styling yang ditulis langsung di markup, sehingga desain tetap konsisten dari halaman ke halaman.', 'Styling di hampir setiap aplikasi yang saya mulai: aplikasi Next.js di GitHub, LUXE, dan Winfaith.'],
    'Node.js': ['JavaScript di server: API, pekerjaan latar belakang, skrip, dan alat build.', 'Build dan dev server situs ini, sync job dan API AdPulse, engine render NFT Chimera, dan server Reel Fortune.'],
    Bun: ['Runtime dan package manager JavaScript yang cepat, semua dalam satu.', 'Instalasi dan skrip di back end GodPlan dan di sebuah aplikasi SvelteKit.'],
    'REST APIs': ['Cara dua program berbicara lewat web: satu bertanya, yang lain menjawab dengan data.', 'API GodPlan ERP dengan Go, terdokumentasi di Swagger; API Express milik AdPulse; route handler di dalam aplikasi Next.js; dan katalog Winfaith yang dibaca dari API milik perusahaannya.'],
    PostgreSQL: ['Database open-source yang andal untuk data yang harus selalu benar.', 'Database GodPlan ERP (karyawan, absensi, penggajian), AdPulse, tempat data Google Ads dan Meta Ads masuk setiap empat jam, dan beberapa aplikasi Next.js saya.'],
    MySQL: ['Database yang menjalankan kebanyakan website, termasuk WordPress.', 'Di bawah toko WordPress yang saya bangun, dan di balik JAKASN di BKN.'],
    WordPress: ['Platform website yang paling banyak dipakai: pemilik bisa memperbarui situsnya tanpa memanggil developer.', '{n} situs klien: profil perusahaan, katalog, dan toko online untuk bisnis di Indonesia, dari perawatan mobil sampai kusen aluminium.'],
    WooCommerce: ['Toko di atas WordPress: katalog, keranjang, pembayaran, dan pengiriman.', 'Toko online yang checkout dan pengirimannya jadi bagian dari build: kasur Orthobone, florist Flora Indonesia, 1.700 produk FLS Group, dan Miniatur Kapal.'],
    Elementor: ['Page builder visual untuk WordPress: halaman diedit dengan drag, bukan kode.', 'Situs yang diedit sendiri oleh tim klien setelah serah terima: Godtive, Fortunarack, The Bedji Group, Kusen Tangsel, dan lainnya.'],
    'Custom themes': ['Tema WordPress yang dibuat untuk satu brand, bukan template yang dipakai banyak situs.', 'Ketika desainnya menuntut: situs pertama Gajah Terbang Kreatif, dan antarmuka custom NF Optical.'],
    Docker: ['Membungkus aplikasi beserta semua kebutuhannya, sehingga berjalan sama di server mana pun.', 'GodPlan ERP dikirim dalam Docker, begitu juga AdPulse, Curb, dan prediktor kelulusan.'],
    Vercel: ['Hosting untuk aplikasi web: setiap perubahan live beberapa menit setelah di-push.', 'Portofolio ini live dari GitHub di setiap push; begitu juga dunia-dunia Labs dan situs Flowkite.'],
    Swagger: ['Manual hidup untuk sebuah API: setiap endpoint terdaftar dan bisa dicoba di browser.', 'Dokumentasi API GodPlan ERP, dibuat langsung dari kode Go.'],
    DBeaver: ['Aplikasi desktop untuk melihat isi database dan memeriksa data secara langsung.', 'Cara saya membaca dan memeriksa data PostgreSQL dan MySQL selama membangun.'],
    Figma: ['Tempat antarmuka dirancang sebelum dibangun.', 'Tempat saya membaca desain yang akan saya bangun, sampai ke jarak dan hurufnya.'],
    GSAP: ['Library animasi di balik banyak gerakan halus di web.', 'Gerakan saat scroll dan saat masuk di Winfaith, dan di aplikasi saya di GitHub.'],
    'Framer Motion': ['Animasi untuk antarmuka React: elemen masuk, keluar, dan merespons dengan halus.', 'Beberapa kali, untuk gerakan di dalam aplikasi React: komponen yang masuk, keluar, atau bereaksi.'],
    'Three.js': ['Library yang membawa 3D ke dalam halaman web.', '{w} dunia di Labs yang dijelajahi dengan scroll, 3D di Winfaith, dan landing page Flowkite.'],
    WebGL: ['Jalur langsung browser ke kartu grafis: yang menggambar 3D di web.', 'Meja 3D berjalan di engine WebGL2 yang saya tulis sendiri: bayangan, tone mapping, dan depth of field. Latar dither halaman ini juga WebGL2.'],
    'Smart contracts': ['Program di blockchain yang menjalankan sebuah kesepakatan dengan sendirinya.', 'Ditulis dengan Solidity dan diuji di Foundry: escrow per milestone yang cair begitu pekerjaan disetujui (Pyris Pact), dan {w} dunia Labs, masing-masing menjalankan kontrak aslinya di sebuah chain di dalam browser.'],
    'Wallet integration': ['Masuk dan membayar dengan wallet, bukan dengan password atau kartu.', 'Alur connect, sign, dan bayar dengan viem, wagmi, dan RainbowKit, di dunia-dunia Labs dan di aplikasi di GitHub.'],
    'dApp frontends': ['Antarmuka web yang dipakai orang untuk bekerja dengan smart contract.', 'Front end yang membaca dan menulis kontrak dan menjelaskan setiap langkahnya: {w} dunia Labs menjalankannya di dalam browser.'],
  },
  zh: {
    TypeScript: ['带类型的 JavaScript：错误在写代码时就被发现，而不是由用户发现。', '我做新东西的首选：GodPlan ERP 的前端、Flowkite（在 Chrome 里工作的 AI 智能体）、Curb 的 SDK，以及实验室各个世界背后的应用。'],
    JavaScript: ['每个浏览器都在运行的语言：让网页动起来、能回应操作。', '这个作品集和它的 3D 桌面，跑在我自己写的 WebGL 引擎上，不用任何库；Reel Fortune，一个装在单个页面里的体素游戏；AdPulse 的后端；以及在 BKN 做的 JAKASN 前端。'],
    PHP: ['WordPress 背后的服务器语言，支撑着很大一部分网站。', '我为客户搭建的 WordPress 网站和网店，以及在 BKN 做的 JAKASN：基于 Open Journal Systems 的期刊平台，用 PHP 和 MySQL。'],
    Solidity: ['智能合约的语言：按任何人都能读懂的规则来保管和转移资金的程序。', '用 Foundry 和 OpenZeppelin 编写、上线前先测试的合约：面向企业付款的里程碑托管（Pyris Pact，已上线），以及实验室每个世界背后的合约，从私密薪资到预测市场。'],
    Python: ['易读的语言，在数据、机器学习和自动化领域领先。', 'Jarvis，一个用印尼语回答的 Windows 语音助手；NEVU，识别伪造文凭的项目，模型正在开发中；通过 FastAPI 提供服务的毕业预测器；以及搭建 3D 桌面的 Blender 脚本。'],
    Go: ['Google 推出的服务器与 API 语言：快速、简洁、易于长期运行。', 'GodPlan ERP 的后端，自 2025 年 7 月以来我的主要工作：基于 Gin 和 PostgreSQL 的 REST API，用 JWT 登录，用 Swagger 写文档，用 Docker 交付。'],
    'Next.js': ['基于 React 的框架，做加载快、容易在 Google 上被找到的网站和网页应用。', 'GodPlan ERP 的界面、为 Gajah Terbang Kreatif 做的 Godjah Studio 网站、LUXE（改一个文件就能换品牌的商店模板），以及 AdPulse 的仪表盘。'],
    React: ['大多数现代网页界面背后的库：用可复用的组件拼出页面。', '我做的每个 Next.js 应用的底层，以及 Flowkite 的侧边栏，你可以在那里看着智能体规划、点击和输入。'],
    SvelteKit: ['更轻的框架，编译后几乎不留下框架本身，页面小而快。', 'Winfaith 的网站：一家制造商的网站，做成应用而不是主题，产品目录来自公司自己的 API，并配有 GSAP 和 Three.js。'],
    'Tailwind CSS': ['直接在标记里写样式，让设计在每个页面都保持一致。', '我开始的几乎每个应用都用它：GitHub 上的 Next.js 应用、LUXE 和 Winfaith。'],
    'Node.js': ['在服务器上运行的 JavaScript：API、后台任务、脚本和构建工具。', '本站的构建和开发服务器、AdPulse 的同步任务和 API、Chimera 的 NFT 渲染引擎，以及 Reel Fortune 的服务器。'],
    Bun: ['一体化的快速 JavaScript 运行时和包管理器。', 'GodPlan 后端和一个 SvelteKit 应用里的安装与脚本。'],
    'REST APIs': ['两个程序在网上对话的方式：一方提问，另一方用数据回答。', '用 Go 写的 GodPlan ERP API，用 Swagger 写文档；AdPulse 的 Express API；Next.js 应用里的路由处理；以及从公司自有 API 读取的 Winfaith 产品目录。'],
    PostgreSQL: ['可靠的开源数据库，用于必须保持准确的数据。', 'GodPlan ERP 的数据库（员工、考勤、薪资）、每四小时汇入 Google Ads 和 Meta Ads 数据的 AdPulse，以及我的几个 Next.js 应用。'],
    MySQL: ['大多数网站所用的数据库，包括 WordPress。', '我搭建的 WordPress 网店的底层，以及 BKN 的 JAKASN 背后。'],
    WordPress: ['使用最广的网站平台：网站主人不用找开发者就能自己更新。', '{n} 个客户网站：为印尼企业做的企业官网、产品目录和网店，从汽车美容到铝合金门窗。'],
    WooCommerce: ['WordPress 上的商店：商品目录、购物车、付款和配送。', '把结账和配送都做进去的网店：Orthobone 床垫、Flora Indonesia 花店、FLS Group 的 1,700 多件商品、Miniatur Kapal。'],
    Elementor: ['WordPress 的可视化页面搭建器：拖拽编辑页面，不用写代码。', '交付后由客户团队自己编辑的网站：Godtive、Fortunarack、The Bedji Group、Kusen Tangsel 等。'],
    'Custom themes': ['为一个品牌专门制作的 WordPress 主题，而不是许多网站共用的模板。', '在设计需要时使用：Gajah Terbang Kreatif 的第一个网站，以及 NF Optical 的定制界面。'],
    Docker: ['把应用和它需要的一切打包在一起，在任何服务器上都一样运行。', 'GodPlan ERP 用 Docker 交付，AdPulse、Curb 和毕业预测器也是。'],
    Vercel: ['网页应用的托管平台：每次推送几分钟后就上线。', '这个作品集每次推送都从 GitHub 自动上线；实验室的各个世界和 Flowkite 的网站也是。'],
    Swagger: ['API 的活手册：列出每个接口，并能在浏览器里直接试用。', 'GodPlan ERP 的 API 文档，直接从 Go 代码生成。'],
    DBeaver: ['查看数据库内容、手动检查数据的桌面应用。', '开发时我用它读取和检查 PostgreSQL 和 MySQL 的数据。'],
    Figma: ['界面在开发之前被设计出来的地方。', '我在这里读懂要实现的设计，细到间距和字体。'],
    GSAP: ['网页上许多精致动效背后的动画库。', 'Winfaith 网站的滚动和入场动效，以及我在 GitHub 上的应用。'],
    'Framer Motion': ['React 界面的动画：元素进入、离开和回应都很顺滑。', '用过几次，用于 React 应用里的动效：组件进入、离开或做出反应时。'],
    'Three.js': ['把 3D 带进网页的库。', '实验室里 {w} 个随滚动展开的世界、Winfaith 网站的 3D，以及 Flowkite 的落地页。'],
    WebGL: ['浏览器直通显卡的通道：网页上的 3D 就靠它绘制。', '3D 桌面跑在我自己写的 WebGL2 引擎上：阴影、色调映射和景深。本页的抖动背景也是 WebGL2。'],
    'Smart contracts': ['在区块链上自动执行约定的程序。', '用 Solidity 编写、在 Foundry 中测试：工作验收后即放款的里程碑托管（Pyris Pact），以及实验室的 {w} 个世界，每个都在浏览器里的链上运行真实的合约。'],
    'Wallet integration': ['用钱包登录和付款，而不是用密码或银行卡。', '用 viem、wagmi 和 RainbowKit 做连接、签名和付款流程，用在实验室的各个世界和 GitHub 上的应用里。'],
    'dApp frontends': ['人们用来操作智能合约的网页界面。', '读写合约、并解释每一步在做什么的前端：实验室的 {w} 个世界都在浏览器里运行它们。'],
  },
};

export const STACK_UI = {
  en: {
    lead: 'What I use most, counted from my own code on GitHub and from the projects I have shipped. Tap a tool to see what I built with it.',
    langs: 'Most used languages', tools: 'Most used tools', meta: '{n} of my own repositories on GitHub · {d}',
    note: 'Share of my own code: forks, copies of other people\'s projects, libraries, builds, HTML and CSS left out.', repos: '{n} repos', repo1: '1 repo', other: 'Other',
    legend: 'How often it shows up in my repositories and projects', l1: '1 to 3', l2: '4 to 9', l3: '10 or more', now: 'At my job now',
    how: 'What I did with it', gh: 'On GitHub', ghN: '{n} repositories', gh1: '1 repository', share: '{p}% of my code', latest: 'latest push {d}',
    ghNone: 'Not in a public repository: this is client and company work.', none: 'A tool I work in, not something a repository records.', notYet: 'Not in a public repository yet.',
    ship: 'Shipped in', shipN: '{n} projects', ship1: '1 project', more: '+{n} more', seeAll: 'See them on GitHub', close: 'Close', labs: 'Labs', desk: 'The 3D desk', open: 'What I did with {t}',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], locale: 'en-US',
  },
  id: {
    lead: 'Yang paling sering saya pakai, dihitung dari kode saya sendiri di GitHub dan dari proyek yang sudah saya kerjakan. Ketuk sebuah tool untuk melihat apa yang saya bangun dengannya.',
    langs: 'Bahasa paling sering dipakai', tools: 'Tool paling sering dipakai', meta: '{n} repositori milik saya di GitHub · {d}',
    note: 'Porsi dari kode saya sendiri: fork, salinan proyek orang lain, library, hasil build, HTML, dan CSS tidak dihitung.', repos: '{n} repo', repo1: '1 repo', other: 'Lainnya',
    legend: 'Seberapa sering muncul di repositori dan proyek saya', l1: '1 sampai 3', l2: '4 sampai 9', l3: '10 atau lebih', now: 'Dipakai di kantor sekarang',
    how: 'Yang saya kerjakan dengannya', gh: 'Di GitHub', ghN: '{n} repositori', gh1: '1 repositori', share: '{p}% dari kode saya', latest: 'push terakhir {d}',
    ghNone: 'Tidak ada di repositori publik: ini pekerjaan klien dan kantor.', none: 'Tool yang saya pakai bekerja, bukan sesuatu yang tercatat di repositori.', notYet: 'Belum ada di repositori publik.',
    ship: 'Dipakai di proyek', shipN: '{n} proyek', ship1: '1 proyek', more: '+{n} lagi', seeAll: 'Lihat di GitHub', close: 'Tutup', labs: 'Labs', desk: 'Meja 3D', open: 'Yang saya kerjakan dengan {t}',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], locale: 'id-ID',
  },
  zh: {
    lead: '我最常用的技术，按我在 GitHub 上自己的代码和已交付的项目统计。点一下任何工具，看看我用它做了什么。',
    langs: '最常用的语言', tools: '最常用的工具', meta: 'GitHub 上我自己的 {n} 个仓库 · {d}',
    note: '按我自己代码的占比计算：不含复刻、他人项目的副本、第三方库、构建产物以及 HTML 和 CSS。', repos: '{n} 个仓库', repo1: '1 个仓库', other: '其他',
    legend: '在我的仓库和项目里出现的频率', l1: '1 到 3', l2: '4 到 9', l3: '10 及以上', now: '目前工作中在用',
    how: '我用它做了什么', gh: 'GitHub 上', ghN: '{n} 个仓库', gh1: '1 个仓库', share: '占我代码的 {p}%', latest: '最近推送 {d}',
    ghNone: '不在公开仓库里：这是客户和公司的工作。', none: '这是我工作中用的工具，仓库里不会留下记录。', notYet: '目前还不在公开仓库里。',
    ship: '交付的项目', shipN: '{n} 个项目', ship1: '1 个项目', more: '还有 {n} 个', seeAll: '在 GitHub 上查看', close: '关闭', labs: '实验室', desk: '3D 桌面', open: '我用 {t} 做了什么',
    months: null, locale: 'zh-CN',
  },
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const GH_I = '<i class="pf-m" style="--m:url(/site/tools/github.svg)" aria-hidden="true"></i>';
const X_I = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const OUT_I = '<svg class="ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const GO_I = '<svg class="ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

/**
 * The pieces of the stack any page can show: the words (W), the usage meter, a tool's description (tip), its panel (detail),
 * the GitHub card, the legend and a layer's tools in order of use. `M` is stackModel(); `name(tool)` a tool's name in the
 * page's language; `icon(tool)` its mark; `u` the language's link maker; `worlds` the number of Labs worlds.
 */
export function stackParts({ M, lang = 'en', name, icon, u, worlds }) {
  const W = { ...STACK_UI.en, ...(STACK_UI[lang] || {}) };
  const TX = (tool) => STACK_TEXT[lang]?.[tool] || STACK_TEXT.en[tool] || ['', ''];
  const nf = new Intl.NumberFormat(W.locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const pct = (x) => nf.format(Math.round(x * 1000) / 10);
  const when = (iso) => { if (!iso) return ''; const [y, m] = iso.split('-').map(Number); return W.months ? `${W.months[m - 1]} ${y}` : `${y} 年 ${m} 月`; };
  const wpCount = M.tools.WordPress?.projects.length || 0;
  const meter = (lv) => lv ? `<span class="pf-u" aria-hidden="true"><i${lv >= 1 ? ' class="on"' : ''}></i><i${lv >= 2 ? ' class="on"' : ''}></i><i${lv >= 3 ? ' class="on"' : ''}></i></span>` : '';
  const tip = (t) => {
    const x = M.tools[t], bits = [];
    if (x.now) bits.push(W.now);
    if (x.repos.length) bits.push(x.repos.length === 1 ? W.gh1 : fill(W.ghN, { n: x.repos.length }));
    if (x.projects.length) bits.push(x.projects.length === 1 ? W.ship1 : fill(W.shipN, { n: x.projects.length }));
    return bits.join(' · ');
  };
  const total = STACK.flat().length;
  // a layer's tools, the most used first
  const sorted = (items) => items.map((t, k) => [t, k]).sort((a, b) => M.tools[b[0]].places - M.tools[a[0]].places || a[1] - b[1]).map(([t]) => t);
  // what was done with it: the plain words, then the evidence, each with its links
  const detail = (t) => {
    const x = M.tools[t], s = slugOf(t), [what, how] = TX(t);
    const lines = [];
    if (x.repos.length) {
      const facts = [x.repos.length === 1 ? W.gh1 : fill(W.ghN, { n: x.repos.length })];
      if (x.share >= 0.001) facts.push(fill(W.share, { p: pct(x.share) }));
      if (x.latest) facts.push(fill(W.latest, { d: when(x.latest) }));
      // the repositories the words name come first (by their product's name), then the rest in their order
      const said = fill(how, { n: wpCount, w: worlds }), named = (r) => [REPO_LABEL[r.name], ...(SAYS[r.name] || [])].some((k) => k && said.includes(k)) ? 0 : 1;
      const shown = x.repos.filter((r) => !UNLINKED.has(r.name)).sort((a, b) => named(a) - named(b)).slice(0, 4), left = x.repos.length - shown.length;
      const all = x.isLang && LANG_SLUG[t] ? `https://github.com/${M.user}?tab=repositories&language=${LANG_SLUG[t]}` : `https://github.com/${M.user}?tab=repositories`;
      lines.push(`<div class="pf-tdx-f"><span class="pf-tdx-k">${GH_I}${esc(W.gh)}</span><span class="pf-tdx-v">${facts.map(esc).join(' · ')}</span>
        <span class="pf-tdx-ln">${shown.map((r) => `<a href="${esc(r.url)}" target="_blank" rel="noopener" title="github.com/${esc(M.user)}/${esc(r.name)}" data-track="stack_repo" data-repo="${esc(r.name)}">${esc(REPO_LABEL[r.name] || r.name)} ${OUT_I}</a>`).join('')}${left > 0 ? `<a class="pf-tdx-more" href="${esc(all)}" target="_blank" rel="noopener">${esc(shown.length ? fill(W.more, { n: left }) : W.seeAll)} ${OUT_I}</a>` : ''}</span></div>`);
    }
    if (x.projects.length) {
      const shown = x.projects.slice(0, 4), left = x.projects.length - shown.length;
      const allAt = shown.every((p) => p.url) ? u('/work/client-websites/') : u('/work/');
      lines.push(`<div class="pf-tdx-f"><span class="pf-tdx-k"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>${esc(W.ship)}</span><span class="pf-tdx-v">${esc(x.projects.length === 1 ? W.ship1 : fill(W.shipN, { n: x.projects.length }))}</span>
        <span class="pf-tdx-ln">${shown.map((p) => `<a href="${u(`/work/${p.key}/`)}" data-track="project_open" data-project="${p.key}" data-from="stack">${esc(p.title)} ${GO_I}</a>`).join('')}${left > 0 ? `<a class="pf-tdx-more" href="${allAt}">${esc(fill(W.more, { n: left }))} ${GO_I}</a>` : ''}</span></div>`);
    }
    if (!x.repos.length) lines.push(`<p class="pf-tdx-none">${esc(x.projects.length ? W.ghNone : NOT_IN_CODE.has(t) ? W.none : W.notYet)}</p>`);
    const also = [AT_LABS.includes(t) ? `<a href="${u('/labs/')}">${esc(W.labs)} ${GO_I}</a>` : '', AT_DESK.includes(t) ? `<a href="/3d/" data-track="3d_cta_click" data-from="stack">${esc(W.desk)} ${GO_I}</a>` : ''].filter(Boolean).join('');
    return `<article class="pf-tdx" data-tool="${s}" aria-labelledby="pf-tc-${s}" hidden>
      <div class="pf-tdx-h">
        <span class="pf-tdx-i" aria-hidden="true">${icon(t) || esc(MONO[t] || t.slice(0, 2).toUpperCase())}</span>
        <div class="pf-tdx-t"><b>${esc(name(t))}${x.now ? `<span class="pf-tdx-now"><span class="dot dot--open" aria-hidden="true"></span>${esc(W.now)}</span>` : ''}</b><p>${esc(what)}</p></div>
        <button type="button" class="pf-tdx-x" aria-label="${esc(W.close)}">${X_I}</button>
      </div>
      <span class="pf-tdx-k pf-tdx-k--how">${esc(W.how)}</span>
      <p class="pf-tdx-how">${esc(fill(how, { n: wpCount, w: worlds }))}</p>
      ${lines.join('\n      ')}
      ${also ? `<div class="pf-tdx-also">${also}</div>` : ''}
    </article>`;
  };
  // the GitHub card: the languages as one bar (share of his own code), the tools as bars (repositories that use them)
  const L = M.langs;
  const seg = (l, k) => `<i style="--w:${(l.share * 100).toFixed(2)}%;--c:${l.color || 'var(--line-2)'};--k:${k}"></i>`;
  const leg = (l) => {
    const label = l.name ? esc(l.name) : esc(W.other);
    const inner = `<i class="pf-gh-dot" style="--c:${l.color || 'var(--line-2)'}"></i><b>${label}</b><span>${pct(l.share)}%</span>${l.repos ? `<small>${esc(l.repos === 1 ? W.repo1 : fill(W.repos, { n: l.repos }))}</small>` : ''}`;
    return l.tool ? `<li><button type="button" data-jump="${slugOf(l.tool)}" aria-label="${esc(fill(W.open, { t: l.name }))}">${inner}</button></li>` : `<li><span>${inner}</span></li>`;
  };
  const maxTop = Math.max(1, ...M.top.map((t) => M.tools[t].repos.length));
  const topRow = (t, k) => { const n = M.tools[t].repos.length; return `<li><button type="button" data-jump="${slugOf(t)}" style="--v:${(n / maxTop).toFixed(3)};--k:${k}" aria-label="${esc(fill(W.open, { t: name(t) }))}">${icon(t) || `<span class="pf-gh-mono" aria-hidden="true">${esc(MONO[t] || t.slice(0, 2).toUpperCase())}</span>`}<b>${esc(name(t))}</b><span class="pf-gh-tb" aria-hidden="true"><i></i></span><small>${esc(fill(W.repos, { n }))}</small></button></li>`; };
  const card = M.repoCount ? `<div class="pf-gh" data-reveal>
      <div class="pf-gh-top"><span class="pf-gh-k">${GH_I}${esc(W.langs)}</span><a class="pf-gh-meta" href="https://github.com/${M.user}" target="_blank" rel="noopener" data-track="contact_click" data-channel="GitHub">${esc(fill(W.meta, { n: M.repoCount, d: when(M.at) }))} ${OUT_I}</a></div>
      <div class="pf-gh-bar" role="img" aria-label="${esc(L.map((l) => `${l.name || W.other} ${pct(l.share)}%`).join(', '))}">${L.map(seg).join('')}</div>
      <ul class="pf-gh-leg">${L.map(leg).join('')}</ul>
      ${M.top.length ? `<span class="pf-gh-k pf-gh-k--sub">${esc(W.tools)}</span><ul class="pf-gh-top6">${M.top.map(topRow).join('')}</ul>` : ''}
      <p class="pf-gh-note">${esc(W.note)}</p>
    </div>` : '';
  const legend = `<div class="pf-st-key" aria-hidden="true"><span class="pf-st-key-t">${esc(W.legend)}</span><span>${meter(1)}${esc(W.l1)}</span><span>${meter(2)}${esc(W.l2)}</span><span>${meter(3)}${esc(W.l3)}</span><span><span class="dot dot--open"></span>${esc(W.now)}</span></div>`;
  return { W, meter, tip, detail, card, legend, sorted, total };
}

/**
 * The Stack section of the profile home: the GitHub card, then the tools by layer as chips, each opening its panel under its row.
 * `layers` are the row names in the page's language; `sec(n)` draws the heading; the rest as stackParts.
 */
export function stackSection({ M, lang = 'en', layers, name, icon, u, worlds, sec }) {
  const { W, meter, tip, detail, card, legend, sorted, total } = stackParts({ M, lang, name, icon, u, worlds });
  // a tool's chip: a button that opens what was done with it, under its row
  const chip = (t, i) => {
    const x = M.tools[t], s = slugOf(t);
    return `<button type="button" class="pf-chip pf-tool${x.now ? ' is-now' : ''}" id="pf-tc-${s}" data-tool="${s}" data-u="${x.level}" aria-expanded="false" aria-controls="pf-td-${i}"${tip(t) ? ` title="${esc(tip(t))}" aria-description="${esc(tip(t))}"` : ''} data-track="stack_tool" data-name="${esc(t)}">${icon(t)}<span>${esc(name(t))}</span>${meter(x.level)}</button>`;
  };
  // a row: its tools, the most used first, and the place under them where one opens
  const row = (items, i) => {
    const list = sorted(items);
    return `<div class="pf-st" style="--i:${i}">
      <span class="pf-st-n"><b>${pad(i + 1)}</b>${esc(layers[i] || '')}</span>
      <div class="pf-chips">${list.map((t) => chip(t, i)).join('')}</div>
      <div class="pf-td" id="pf-td-${i}" inert><div class="pf-td-in">${list.map(detail).join('')}</div></div>
    </div>`;
  };
  return `<section class="pf-sec pf-sec--st" id="stack" aria-labelledby="pf-st">
    ${sec(total)}
    <p class="pf-st-lead">${esc(W.lead)}</p>
    ${card}
    <div class="pf-stack" data-stagger>${STACK.map(row).join('')}</div>
    ${legend}
  </section>`;
}

/**
 * The toolbox on /full/: each layer a column of buttons (mark, name, meter), the GitHub card above, the legend under, and one
 * dialog holding every tool's panel (TOOLBOX_JS opens the one asked for). `layers` the column names; `icon` the story's marks.
 */
export function toolboxGrid({ M, lang = 'en', layers, name, icon, u, worlds }) {
  const { W, meter, tip, detail, card, legend, sorted } = stackParts({ M, lang, name, icon, u, worlds });
  const tool = (t) => {
    const x = M.tools[t], s = slugOf(t);
    return `<li><button type="button" class="st-tool${x.now ? ' is-now' : ''}" id="pf-tc-${s}" data-tool-open="${s}" aria-haspopup="dialog" aria-controls="tool-dlg"${tip(t) ? ` title="${esc(tip(t))}" aria-description="${esc(tip(t))}"` : ''} data-track="stack_tool" data-name="${esc(t)}">${icon(t)}<span>${esc(name(t))}</span>${meter(x.level)}</button></li>`;
  };
  const cols = STACK.map((items, i) => `<div class="st-col" style="--i:${i}"><span class="lbl">${esc(layers[i] || '')}</span><ul>${sorted(items).map(tool).join('')}</ul></div>`).join('');
  return {
    lead: `<p class="stack-lead" data-reveal>${esc(W.lead)}</p>`, card, cols, legend,
    dialog: `<dialog class="tl-dlg" id="tool-dlg" aria-label="${esc(W.how)}">${STACK.flat().map(detail).join('')}</dialog>`,
  };
}

export const STACK_CSS = `
/* ---------- the stack (scripts/stack-tools.js): a GitHub card, then the tools by layer, each a button that opens what was done with it */
.pf-st-lead { max-width: 40em; margin: -2px 0 16px; font-size: 16.5px; line-height: 1.55; color: var(--dim); text-wrap: pretty; }
.pf-gh { margin-bottom: 10px; padding: 16px 18px 14px; border: 1px solid var(--line); border-radius: 12px; background: linear-gradient(180deg, rgba(241, 234, 219, 0.035), rgba(241, 234, 219, 0.01)); }
.pf-gh-top { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 16px; margin-bottom: 12px; }
.pf-gh-k { display: inline-flex; align-items: center; gap: 8px; font: 600 12px var(--cond); letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink); }
.pf-gh-k .pf-m { width: 15px; height: 15px; color: var(--dim); }
.pf-gh-k--sub { display: flex; margin: 16px 0 8px; padding-top: 14px; border-top: 1px solid var(--line); }
.pf-gh-meta { display: inline-flex; align-items: center; gap: 5px; font: 600 11px var(--cond); letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint); transition: color 0.3s; }
.pf-gh-meta .ar { width: 10px; height: 10px; } .pf-gh-meta:hover { color: var(--accent-2); }
.pf-gh-bar { display: flex; gap: 2px; height: 10px; overflow: hidden; border-radius: 6px; background: rgba(241, 234, 219, 0.06); }
.pf-gh-bar i { flex: 0 0 var(--w); min-width: 3px; background: color-mix(in srgb, var(--c) 86%, #0e0c09); transform-origin: left; transition: transform 1s var(--ease), filter 0.3s; transition-delay: calc(var(--k) * 90ms); }
.pf-gh-bar i:first-child { border-radius: 6px 0 0 6px; } .pf-gh-bar i:last-child { border-radius: 0 6px 6px 0; }
.js .pf-gh:not(.in) .pf-gh-bar i, .js .pf-gh:not(.in) .pf-gh-tb i { transform: scaleX(0); }
.pf-gh-leg { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 2px 22px; margin-top: 12px; }
.pf-gh-leg li > * { display: flex; align-items: baseline; gap: 7px; width: 100%; padding: 5px 6px; margin: 0 -6px; border: 0; border-radius: 6px; background: none; color: var(--dim); font: 500 13px var(--cond); letter-spacing: 0.06em; text-align: left; }
.pf-gh-leg button { cursor: pointer; transition: background 0.3s, color 0.3s; }
.pf-gh-leg button:hover, .pf-gh-leg button:focus-visible { background: rgba(241, 234, 219, 0.06); color: var(--ink); }
.pf-gh-leg b { font-weight: 600; color: var(--ink); } .pf-gh-leg small { margin-left: auto; font-size: 11.5px; color: var(--faint); white-space: nowrap; }
.pf-gh-dot { flex: none; width: 9px; height: 9px; border-radius: 50%; background: color-mix(in srgb, var(--c) 86%, #0e0c09); transform: translateY(-1px); }
.pf-gh-top6 { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 22px; }
.pf-gh-top6 button { display: grid; grid-template-columns: 16px auto 1fr auto; align-items: center; gap: 9px; width: 100%; padding: 6px 6px; margin: 0 -6px; border: 0; border-radius: 6px; background: none; color: var(--dim); font: 500 13px var(--cond); letter-spacing: 0.06em; text-align: left; cursor: pointer; transition: background 0.3s, color 0.3s; }
.pf-gh-top6 button:hover, .pf-gh-top6 button:focus-visible { background: rgba(241, 234, 219, 0.06); color: var(--ink); }
.pf-gh-top6 .pf-m { width: 14px; height: 14px; }
.pf-gh-mono { font: 700 8.5px/1 var(--cond); letter-spacing: 0.02em; color: var(--dim); text-align: center; } .pf-gh-top6 b { font-weight: 600; color: var(--ink); white-space: nowrap; }
.pf-gh-top6 small { font-size: 11.5px; color: var(--faint); white-space: nowrap; }
.pf-gh-tb { position: relative; height: 4px; border-radius: 2px; background: rgba(241, 234, 219, 0.07); overflow: hidden; }
.pf-gh-tb i { position: absolute; inset: 0 auto 0 0; width: calc(var(--v) * 100%); border-radius: inherit; background: var(--accent); transform-origin: left; transition: transform 1s var(--ease); transition-delay: calc(300ms + var(--k) * 80ms); }
.pf-gh-note { margin: 12px 0 0; font: italic 400 14px/1.4 var(--text); color: var(--faint); }
/* the chips are buttons: the meter (how often), a green dot (at the job now), the open one lit */
.pf-tool { position: relative; cursor: pointer; background: none; font-family: var(--cond); }
.pf-tool .pf-u { margin-left: 2px; }
.pf-u { display: inline-flex; align-items: flex-end; gap: 2px; height: 10px; }
.pf-u i { width: 2.5px; border-radius: 1px; background: var(--line-2); }
.pf-u i:nth-child(1) { height: 4px; } .pf-u i:nth-child(2) { height: 7px; } .pf-u i:nth-child(3) { height: 10px; }
.pf-u i.on { background: var(--accent); }
.pf-tool.is-now::after { content: ""; position: absolute; top: -3px; right: -3px; width: 7px; height: 7px; border-radius: 50%; background: #7fd49c; box-shadow: 0 0 0 2px var(--bg); }
.pf-tool[aria-expanded="true"] { border-color: var(--accent); color: var(--ink); background: rgba(217, 160, 91, 0.1); transform: translateY(-2px); }
.pf-tool[aria-expanded="true"] .pf-m { opacity: 1; }
/* the place under a row where a tool opens */
.pf-st { position: relative; }
.pf-td { grid-column: 1 / -1; display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.55s var(--ease); }
.pf-td-in { min-height: 0; overflow: hidden; visibility: hidden; transition: visibility 0s 0.55s; }
.pf-st.is-open .pf-td { grid-template-rows: 1fr; }
.pf-st.is-open .pf-td-in { visibility: visible; transition: none; }
.pf-tdx { position: relative; margin-top: 12px; padding: 16px 18px 16px; border: 1px solid var(--line-2); border-radius: 12px; background: var(--bg-2); }
.pf-tdx::before { content: ""; position: absolute; top: -6px; left: var(--ax, 40px); width: 10px; height: 10px; border: solid var(--line-2); border-width: 1px 0 0 1px; background: var(--bg-2); transform: rotate(45deg); transition: left 0.45s var(--ease); }
.pf-tdx.is-in { animation: pf-tdx-in 0.5s var(--ease); }
@keyframes pf-tdx-in { from { opacity: 0; transform: translateY(8px); } }
.pf-tdx-h { display: grid; grid-template-columns: 40px 1fr 32px; gap: 12px; align-items: start; }
.pf-tdx-i { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 10px; background: rgba(241, 234, 219, 0.06); box-shadow: 0 0 0 1px var(--line); color: var(--ink); font: 700 12px var(--cond); letter-spacing: 0.06em; }
.pf-tdx-i .pf-m { width: 20px; height: 20px; }
.pf-tdx-t b { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; font: 700 19px/1.15 var(--cond); text-transform: uppercase; letter-spacing: 0.02em; color: var(--ink); }
.pf-tdx-now { display: inline-flex; align-items: center; gap: 7px; font: 600 10.5px var(--cond); letter-spacing: 0.16em; color: #a9e5bd; }
.pf-tdx-now .dot { width: 6px; height: 6px; box-shadow: 0 0 0 3px rgba(127, 212, 156, 0.16); }
.pf-tdx-t p { margin: 5px 0 0; font: italic 400 16px/1.45 var(--text); color: var(--dim); text-wrap: pretty; }
.pf-tdx-x { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid var(--line); border-radius: 8px; background: none; color: var(--dim); cursor: pointer; transition: border-color 0.3s, color 0.3s, transform 0.4s var(--ease); }
.pf-tdx-x svg { width: 14px; height: 14px; } .pf-tdx-x:hover, .pf-tdx-x:focus-visible { border-color: var(--ink); color: var(--ink); transform: rotate(90deg); }
.pf-tdx-k { display: inline-flex; align-items: center; gap: 7px; font: 600 11px var(--cond); letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); }
.pf-tdx-k svg, .pf-tdx-k .pf-m { width: 14px; height: 14px; flex: none; }
.pf-tdx-k--how { display: flex; margin: 14px 0 6px; padding-top: 12px; border-top: 1px solid var(--line); }
.pf-tdx-how { margin: 0; font-size: 17px; line-height: 1.55; color: var(--ink); text-wrap: pretty; }
.pf-tdx-f { display: grid; grid-template-columns: 120px 1fr; column-gap: 14px; row-gap: 6px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--line); }
.pf-tdx-f .pf-tdx-k { color: var(--dim); }
.pf-tdx-v { font: 500 13.5px var(--cond); letter-spacing: 0.06em; color: var(--ink); }
.pf-tdx-ln { grid-column: 2; display: flex; flex-wrap: wrap; gap: 6px; }
.pf-tdx-ln a, .pf-tdx-also a { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border: 1px solid var(--line); border-radius: 999px; font: 500 12.5px var(--cond); letter-spacing: 0.06em; color: var(--dim); transition: border-color 0.3s, color 0.3s, background 0.3s; }
.pf-tdx-ln a .ar, .pf-tdx-also a .ar { width: 10px; height: 10px; opacity: 0.7; }
.pf-tdx-ln a:hover, .pf-tdx-ln a:focus-visible, .pf-tdx-also a:hover, .pf-tdx-also a:focus-visible { border-color: var(--accent-2); color: var(--ink); background: rgba(217, 160, 91, 0.08); }
.pf-tdx-more { color: var(--faint) !important; border-style: dashed !important; }
.pf-tdx-none { margin: 12px 0 0; padding-top: 12px; border-top: 1px dashed var(--line); font: italic 400 15px/1.45 var(--text); color: var(--faint); }
.pf-tdx-also { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.pf-st-key { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line); font: 500 11.5px var(--cond); letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint); }
.pf-st-key > span { display: inline-flex; align-items: center; gap: 7px; }
.pf-st-key-t { width: 100%; letter-spacing: 0.14em; color: var(--dim); }
.pf-st-key .dot { width: 7px; height: 7px; box-shadow: 0 0 0 3px rgba(127, 212, 156, 0.14); animation: none; }
@media (max-width: 800px) {
  .pf-gh { padding: 14px 14px 12px; }
  .pf-gh-top6 { grid-template-columns: 1fr; }
  .pf-tdx { padding: 14px 14px; } .pf-tdx-h { grid-template-columns: 36px 1fr 30px; gap: 10px; } .pf-tdx-i { width: 36px; height: 36px; }
  .pf-tdx-f { grid-template-columns: 1fr; } .pf-tdx-ln { grid-column: 1; }
}
@media (max-width: 420px) { .pf-gh-leg { grid-template-columns: 1fr; gap: 0; } .pf-gh-leg li > * { padding: 4px 6px; } }
@media (prefers-reduced-motion: reduce) { .pf-td, .pf-gh-bar i, .pf-gh-tb i, .pf-tdx::before { transition: none; } .pf-tdx.is-in { animation: none; } }
.motion-off .pf-td, .motion-off .pf-gh-bar i, .motion-off .pf-gh-tb i { transition: none; } .motion-off .pf-tdx.is-in { animation: none; }
`;

export const TOOLBOX_CSS = `
/* ---------- /full/'s toolbox (scripts/stack-tools.js toolboxGrid): on cream, so the dark tokens the card and the meter use are
   given cream values here; the dialog keeps the dark ones */
.stack .pf-m, .tl-dlg .pf-m { display: inline-block; width: 15px; height: 15px; background: currentColor; -webkit-mask: var(--m) center / contain no-repeat; mask: var(--m) center / contain no-repeat; }
.stack { --ink: var(--cream-ink); --dim: var(--cream-dim); --faint: rgba(23, 18, 12, 0.58); --line: var(--cream-line); --line-2: rgba(23, 18, 12, 0.26); --accent: #8f5418; --accent-2: #8f5418; }
.stack-lead { max-width: 40em; margin: -12px 0 22px; font-size: clamp(17px, 1.3vw, 20px); line-height: 1.55; color: var(--cream-dim); text-wrap: pretty; }
.stack .pf-gh { margin-bottom: 30px; background: rgba(23, 18, 12, 0.03); }
.stack .pf-gh-bar { background: rgba(23, 18, 12, 0.08); }
.stack .pf-gh-bar i, .stack .pf-gh-dot { filter: saturate(0.9); }
.stack .pf-gh-leg button:hover, .stack .pf-gh-leg button:focus-visible, .stack .pf-gh-top6 button:hover, .stack .pf-gh-top6 button:focus-visible { background: rgba(23, 18, 12, 0.06); }
.stack .pf-gh-tb { background: rgba(23, 18, 12, 0.1); }
.st-tool { display: inline-flex; align-items: center; gap: 0.5em; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.st-tool .pf-u { margin-left: 0.15em; transform: translateY(-0.1em); }
.st-tool.is-now::after { content: ""; width: 7px; height: 7px; margin-left: 2px; border-radius: 50%; background: #3f9a62; box-shadow: 0 0 0 3px rgba(63, 154, 98, 0.16); align-self: flex-start; transform: translateY(0.35em); }
.st-col li:has(.st-tool) { transition: color 0.3s, transform 0.45s var(--ease); }
.st-col li:has(.st-tool:focus-visible) { color: #8f5418; transform: translateX(8px); }
.stack .pf-st-key { margin-top: 34px; border-top-color: var(--cream-line); color: rgba(23, 18, 12, 0.58); }
.stack .pf-st-key-t { color: var(--cream-dim); }
.tl-dlg { --ink: #f1eadb; --dim: rgba(241, 234, 219, 0.68); --faint: rgba(241, 234, 219, 0.52); --line: rgba(241, 234, 219, 0.13); --line-2: rgba(241, 234, 219, 0.24); --accent: #d9a05b; --accent-2: #e8b97a;
  width: min(660px, calc(100vw - 32px)); max-height: calc(88vh / var(--k, 1)); margin: auto; padding: 0; border: 0; background: transparent; color: var(--ink); overflow: visible; }
.tl-dlg::backdrop { background: rgba(9, 8, 6, 0.62); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
.tl-dlg .pf-tdx { margin: 0; max-height: calc(88vh / var(--k, 1)); overflow: auto; overscroll-behavior: contain; box-shadow: 0 40px 90px -30px rgba(0, 0, 0, 0.85); }
.tl-dlg .pf-tdx::before { display: none; }
.tl-dlg .pf-tdx-i { font-size: 22px; } .tl-dlg .pf-tdx-i .tool-i { opacity: 1; }
.tl-dlg[open] .pf-tdx:not([hidden]) { animation: pf-tdx-in 0.45s var(--ease); }
html.dlg-open { overflow: hidden; }
@media (prefers-reduced-motion: reduce) { .tl-dlg[open] .pf-tdx:not([hidden]) { animation: none; } }
.motion-off .tl-dlg[open] .pf-tdx:not([hidden]) { animation: none; }
`;

export const TOOLBOX_JS = `
(function(){
  // /full/'s toolbox: a tool (or a language or tool in the GitHub card) opens its panel in the dialog; the cross, Escape or a click
  // beside it closes it, and the focus goes back to what opened it; the page behind stays still while it is open
  var dlg = document.getElementById('tool-dlg'); if (!dlg || typeof dlg.showModal !== 'function') return;
  var back = null, html = document.documentElement;
  function open(slug, from) {
    var art = null;
    dlg.querySelectorAll('.pf-tdx').forEach(function (a) { var on = a.dataset.tool === slug; a.hidden = !on; if (on) art = a; });
    if (!art) return;
    back = from || null;
    if (!dlg.open) { html.style.paddingRight = (innerWidth - html.clientWidth) + 'px'; html.classList.add('dlg-open'); dlg.showModal(); }
    art.scrollTop = 0;
    var x = art.querySelector('.pf-tdx-x'); if (x) x.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tool-open], .stack [data-jump]');
    if (b) { e.preventDefault(); open(b.dataset.toolOpen || b.dataset.jump, b); return; }
    if (e.target.closest('#tool-dlg .pf-tdx-x')) dlg.close();
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', function () { html.classList.remove('dlg-open'); html.style.paddingRight = ''; if (back && back.focus) back.focus({ preventScroll: true }); });
})();
`;

export const STACK_JS = `
(function(){
  // the stack: a tool's chip opens what was done with it under its row (one at a time on the page); the card's languages and tools
  // open theirs and bring the row into view; Escape or the cross closes it; #stack-<tool> in the address opens one on arrival
  var sec = document.querySelector('.pf-sec--st'); if (!sec) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-off');
  var cur = null;
  function rowOf(c) { return c.closest('.pf-st'); }
  function shut() {
    if (!cur) return; var row = rowOf(cur);
    cur.setAttribute('aria-expanded', 'false'); row.classList.remove('is-open'); row.querySelector('.pf-td').inert = true; cur = null;
    if (/^#stack-/.test(location.hash)) try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }
  function open(chip, scroll) {
    if (cur === chip) { shut(); return; }
    var row = rowOf(chip), td = row.querySelector('.pf-td'), was = cur && rowOf(cur) === row;
    if (cur && !was) shut();
    if (cur) cur.setAttribute('aria-expanded', 'false');
    chip.setAttribute('aria-expanded', 'true'); cur = chip;
    var art = null;
    td.querySelectorAll('.pf-tdx').forEach(function (a) { var on = a.dataset.tool === chip.dataset.tool; a.hidden = !on; a.classList.remove('is-in'); if (on) art = a; });
    if (art) {   // the little arrow on the panel points at the chip
      var r = chip.getBoundingClientRect(), b = td.getBoundingClientRect();
      art.style.setProperty('--ax', Math.max(14, Math.min(b.width - 24, r.left - b.left + r.width / 2 - 5)) + 'px');
      if (was && !reduce) { void art.offsetWidth; art.classList.add('is-in'); }
    }
    row.classList.add('is-open'); td.inert = false;
    if (scroll) setTimeout(function () { row.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); }, 60);
    try { history.replaceState(null, '', '#stack-' + chip.dataset.tool); } catch (e) {}
  }
  sec.addEventListener('click', function (e) {
    var c = e.target.closest('.pf-tool'); if (c) { open(c); return; }
    var x = e.target.closest('.pf-tdx-x'); if (x) { var back = cur; shut(); if (back) back.focus(); return; }
    var j = e.target.closest('[data-jump]'); if (j) { var t = sec.querySelector('.pf-tool[data-tool="' + j.dataset.jump + '"]'); if (t) { if (cur !== t) open(t, true); else rowOf(t).scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); } }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cur && sec.contains(document.activeElement)) { var back = cur; shut(); back.focus(); } });
  function fromHash() { var h = location.hash.match(/^#stack-([a-z0-9-]+)$/); if (!h) return; var t0 = sec.querySelector('.pf-tool[data-tool="' + h[1] + '"]'); if (t0 && cur !== t0) open(t0, true); }
  fromHash(); addEventListener('hashchange', fromHash);
})();
`;
