// Labs: what Navy builds when nobody asks. Every entry is one of his own public repositories (github.com/itsnevu, no forks), and
// every line restates that repository's README or its GitHub description; `when` is the month the repository was created (from
// the GitHub API, 2026-10-12). Nothing here is invented: a lab with no README stays out. `kind` groups them: ai (agents and AI),
// play (games and 3D), tools (apps and tools). `mark` is the language's mark in public/site/tools.
// (Navy's call, 2026-10-12: the on-chain work, Rukun, StreakFit and the registration form are not shown; the list is his to edit)
// The Indonesian and Chinese words are under the list (LABS_T, LAB_KINDS_T), read through labsFor(lang) and labKindsFor(lang).
export const LAB_KINDS = [['ai', 'Agents & AI'], ['play', 'Games & 3D'], ['tools', 'Apps & tools']];

export const LABS = [
  { key: 'flowkite', name: 'Flowkite', kind: 'ai', when: 'Aug 2026', mark: 'typescript', lang: 'TypeScript', license: 'Apache 2.0', shot: 'shots/labs/flowkite.webp',
    stack: ['Chrome extension', 'TypeScript', 'Multi-agent'],
    line: 'An open-source AI browser agent that plans and acts locally in your browser, and asks before anything that matters.',
    more: 'A Planner works out the approach, a Navigator clicks and types, and the whole run shows in the side panel. Your data goes straight to the model provider you chose, with your own key: there is no Flowkite server in the middle. Free, and on the Chrome Web Store.',
    links: [['Live', 'https://flowkite.xyz/'], ['Chrome Web Store', 'https://chromewebstore.google.com/detail/flowkite-ai-web-agent-aut/kacmblccfhnfcjfpeageldmmbkocafab'], ['GitHub', 'https://github.com/itsnevu/Flowkite']] },
  { key: 'curb', name: 'Curb', kind: 'ai', when: 'Aug 2026', mark: 'typescript', lang: 'TypeScript', license: 'MIT',
    stack: ['Policy engine', 'TypeScript SDK', 'Python SDK', 'Docker'],
    line: 'Guardrails and circuit breakers for AI agents: one policy engine that stops runaway loops, cost blowups and destructive tool calls.',
    more: 'It sits at every point where an agent touches the outside world: an OpenAI and Anthropic proxy, SDKs on npm and PyPI, a human-approval dashboard, and an audit trail instead of an "if step > 20: break" scattered through the code. 282 tests.',
    links: [['GitHub', 'https://github.com/itsnevu/Curb'], ['npm', 'https://www.npmjs.com/package/@curb/sdk'], ['PyPI', 'https://pypi.org/project/curb-sdk/']] },
  { key: 'jarvis', name: 'Jarvis', kind: 'ai', when: 'Sep 2026', mark: 'python', lang: 'Python',
    stack: ['Faster-Whisper', 'Edge TTS', 'OpenRouter', 'Windows'],
    line: 'A voice and text personal assistant for Windows, in the Iron Man mould, that listens and answers in Indonesian.',
    more: 'Offline speech-to-text with a wake word ("Jarvis", "Hey Jarvis"), natural Indonesian voices through Edge TTS, an LLM behind it, and control of the machine: volume, media, apps found by fuzzy search, screenshots, CPU and RAM. Voice, GUI or terminal mode, with a daily rate limiter and a token tracker so it stays cheap.',
    links: [['GitHub', 'https://github.com/itsnevu/jarvis']] },
  { key: 'reel-fortune', name: 'Reel Fortune', kind: 'play', when: 'Aug 2026', mark: 'threedotjs', lang: 'JavaScript',
    stack: ['Three.js', 'Voxels', 'One index.html'],
    line: 'A voxel fishing, mining and gambling adventure across four islands, built with Three.js. Double your fish or lose it.',
    more: 'Shores where some species only bite at night or in a storm, a quarry and woods, a trader whose prices swing every three minutes, an exchange with five fictional stocks and hourly dividends, gear in ten tiers, and a 3D roulette table the camera dives onto. No install: it runs from one index.html.',
    links: [['GitHub', 'https://github.com/itsnevu/voxel']] },
  { key: 'mydesk', name: 'The 3D desk', kind: 'play', when: 'Oct 2026', mark: 'javascript', lang: 'JavaScript', shot: 'site/desk-wide.webp',
    stack: ['WebGL2', 'Custom engine', 'Blender', 'Zero dependencies'],
    line: 'This portfolio as a desk at night: a furnished room, a mechanical keyboard with a town built into its keys, and everything typed on it.',
    more: 'On a small WebGL2 engine of its own: a renderer with shadow mapping, ACES tone mapping and a depth-of-field pass, orbit controls, raycasting and a tween system, with nothing to install. The worlds are built in Blender and packed into one self-contained file.',
    links: [['Live', '/3d/'], ['GitHub', 'https://github.com/itsnevu/mydesk']] },
  { key: 'adpulse', name: 'AdPulse', kind: 'ai', when: 'Aug 2026', mark: 'javascript', lang: 'JavaScript',
    stack: ['Express', 'PostgreSQL', 'Next.js', 'Claude API'],
    line: 'Ad analytics that puts Google Ads and Meta Ads on one dashboard, with AI insight and a daily summary email.',
    more: 'Sync jobs pull both platforms into PostgreSQL every four hours, an insight engine on the Claude API writes the recommendations, and the marketing team reads spend, CTR, CPC and conversions in one place. A mock mode runs the whole thing on sample data without an API key.',
    links: [['GitHub', 'https://github.com/itsnevu/adpulse']] },
  { key: 'chimera', name: 'Chimera', kind: 'ai', when: 'Aug 2026', mark: 'javascript', lang: 'JavaScript', license: 'MIT',
    stack: ['Node 20', 'canvas', 'OpenRouter'],
    line: 'A generative NFT collection engine: roll traits against real rarity weights, render the art, write metadata that matches.',
    more: 'Two modes: composite the PNG layers you supply, or roll traits, build prompts and render through an image model conditioned on a style bible. A QC pass catches flat renders and visual twins and checks that each image contains the traits its metadata claims. Run end to end for 1,000 editions with zero duplicates.',
    links: [['GitHub', 'https://github.com/itsnevu/chimera']] },
  { key: 'nevu', name: 'NEVU', kind: 'ai', when: 'Aug 2026', mark: 'python', lang: 'Python', license: 'Research only',
    stack: ['Machine learning', 'Multimodal', 'Blockchain anchoring'],
    line: 'Detecting and locating forgery in Indonesian diplomas, transcripts and competency certificates.',
    more: 'A multimodal model for the legacy documents, and blockchain anchoring for the verified ones, with its own dataset of forgery operations and capture conditions. Milestone zero done, phase one (the model) under way.',
    links: [['GitHub', 'https://github.com/itsnevu/credential-forgery-detection']] },
  { key: 'luxe', name: 'LUXE', kind: 'tools', when: 'May 2026', mark: 'nextdotjs', lang: 'TypeScript',
    stack: ['Next.js', 'Midtrans / Stripe bridge'],
    line: 'A Next.js e-commerce template for premium brands: rebrand the whole store from one config file.',
    more: 'A wishlist, an urgency engine, a free-shipping progress bar, a payment service bridge ready for Midtrans or Stripe, and floating WhatsApp and scroll-to-top actions.',
    links: [['GitHub', 'https://github.com/itsnevu/nextjs-commerce-boilerplate']] },
  { key: 'student-performance', name: 'Student Performance', kind: 'tools', when: 'Apr 2026', mark: 'python', lang: 'Python',
    stack: ['scikit-learn', 'XGBoost', 'FastAPI', 'Next.js', 'Docker'],
    line: 'An end-to-end machine learning pipeline that predicts whether a student will graduate.',
    more: 'Five audit phases from EDA to evaluation, ten algorithms compared with hyperparameter tuning, a FastAPI inference API and a Next.js front end for trying predictions, ready to run in Docker.',
    links: [['GitHub', 'https://github.com/itsnevu/student-performance']] },
];

// ---------- the same labs in Indonesian and Chinese (scripts/labs.js renders them per language, through labsFor and labKindsFor).
// A field missing here falls back to the English above; names, tech names, links and the GitHub mark stay as they are. `stack`
// is the whole row (the names kept, the words translated); `when` is translated from the English month, never written twice.
// (No dashes in any language, Navy's rule; the Labs worlds' wording rule, scripts/labs-worlds.js, holds here too)
export const LAB_KINDS_T = {
  id: { ai: 'Agen & AI', play: 'Game & 3D', tools: 'Aplikasi & tools' },
  zh: { ai: '智能体与 AI', play: '游戏与 3D', tools: '应用与工具' },
};

export const LABS_T = {
  id: {
    flowkite: { stack: ['Ekstensi Chrome', 'TypeScript', 'Multi-agen'],
      line: 'Agen browser AI open-source yang merencanakan dan bertindak secara lokal di browser Anda, dan bertanya dulu sebelum melakukan hal yang penting.',
      more: 'Planner menyusun pendekatannya, Navigator mengklik dan mengetik, dan seluruh prosesnya tampil di side panel. Data Anda langsung dikirim ke penyedia model yang Anda pilih, dengan key Anda sendiri: tidak ada server Flowkite di tengahnya. Gratis, dan sudah ada di Chrome Web Store.' },
    curb: { stack: ['Policy engine', 'SDK TypeScript', 'SDK Python', 'Docker'],
      line: 'Guardrail dan circuit breaker untuk agen AI: satu policy engine yang menghentikan loop yang lepas kendali, biaya yang membengkak dan pemanggilan tool yang merusak.',
      more: 'Ia berjaga di setiap titik tempat agen menyentuh dunia luar: proxy OpenAI dan Anthropic, SDK di npm dan PyPI, dashboard persetujuan manusia dan audit trail, sebagai ganti "if step > 20: break" yang bertebaran di seluruh kode. 282 test.' },
    jarvis: {
      line: 'Asisten pribadi suara dan teks untuk Windows, ala Iron Man, yang mendengarkan dan menjawab dalam bahasa Indonesia.',
      more: 'Speech-to-text offline dengan wake word ("Jarvis", "Hey Jarvis"), suara bahasa Indonesia yang natural lewat Edge TTS, sebuah LLM di belakangnya, dan kendali atas komputer: volume, media, aplikasi yang dicari dengan fuzzy search, tangkapan layar, CPU dan RAM. Mode suara, GUI atau terminal, dengan rate limiter harian dan token tracker supaya biayanya tetap hemat.' },
    'reel-fortune': { stack: ['Three.js', 'Voxel', 'Satu index.html'],
      line: 'Petualangan memancing, menambang dan berjudi bergaya voxel di empat pulau, dibangun dengan Three.js. Gandakan ikan Anda, atau kehilangan semuanya.',
      more: 'Pantai tempat beberapa spesies hanya menggigit di malam hari atau saat badai, tambang batu dan hutan, pedagang yang harganya berubah setiap tiga menit, bursa dengan lima saham fiktif dan dividen per jam, perlengkapan dalam sepuluh tingkat, dan meja roulette 3D tempat kamera menukik turun. Tanpa instalasi: semuanya berjalan dari satu index.html.' },
    mydesk: { name: 'Desk 3D', stack: ['WebGL2', 'Engine buatan sendiri', 'Blender', 'Tanpa dependensi'],
      line: 'Portofolio ini sebagai desk di malam hari: ruangan lengkap dengan perabotnya, keyboard mekanik dengan kota kecil yang dibangun di tombol-tombolnya, dan semua yang diketik di atasnya.',
      more: 'Berjalan di atas engine WebGL2 kecil buatan sendiri: renderer dengan shadow mapping, tone mapping ACES dan depth-of-field pass, orbit controls, raycasting dan sistem tween, tanpa ada yang perlu diinstal. Dunia-dunianya dibangun di Blender lalu dikemas ke dalam satu file mandiri.' },
    adpulse: {
      line: 'Analitik iklan yang menyatukan Google Ads dan Meta Ads dalam satu dashboard, dengan insight AI dan email ringkasan harian.',
      more: 'Sync job menarik data kedua platform ke PostgreSQL setiap empat jam, insight engine di atas Claude API menulis rekomendasinya, dan tim marketing membaca spend, CTR, CPC dan konversi di satu tempat. Mode mock menjalankan semuanya dengan data contoh, tanpa API key.' },
    chimera: {
      line: 'Mesin koleksi NFT generatif: mengacak trait dengan bobot kelangkaan sungguhan, merender karyanya, lalu menulis metadata yang cocok.',
      more: 'Dua mode: menyusun layer PNG yang Anda berikan, atau mengacak trait, menyusun prompt dan merender lewat model gambar yang dikondisikan pada sebuah style bible. Tahap QC menangkap render yang datar dan kembaran visual, serta memeriksa bahwa setiap gambar benar-benar memuat trait yang diklaim metadatanya. Sudah dijalankan dari awal sampai akhir untuk 1.000 edisi tanpa satu pun duplikat.' },
    nevu: { license: 'Khusus riset', stack: ['Machine learning', 'Multimodal', 'Anchoring blockchain'],
      line: 'Mendeteksi dan menemukan letak pemalsuan pada ijazah, transkrip nilai dan sertifikat kompetensi Indonesia.',
      more: 'Model multimodal untuk dokumen lama, dan anchoring blockchain untuk dokumen yang sudah terverifikasi, dengan dataset sendiri berisi jenis operasi pemalsuan dan kondisi pengambilan gambarnya. Milestone nol selesai, fase satu (modelnya) sedang berjalan.' },
    luxe: { stack: ['Next.js', 'Bridge Midtrans / Stripe'],
      line: 'Template e-commerce Next.js untuk brand premium: ganti identitas seluruh toko dari satu file config.',
      more: 'Wishlist, urgency engine, progress bar gratis ongkir, bridge layanan pembayaran yang siap untuk Midtrans atau Stripe, serta tombol melayang untuk WhatsApp dan kembali ke atas.' },
    'student-performance': {
      line: 'Pipeline machine learning end-to-end yang memprediksi apakah seorang mahasiswa akan lulus.',
      more: 'Lima fase audit dari EDA sampai evaluasi, sepuluh algoritma dibandingkan dengan hyperparameter tuning, API inferensi FastAPI dan front end Next.js untuk mencoba prediksinya, siap dijalankan di Docker.' },
  },
  zh: {
    flowkite: { stack: ['Chrome 扩展', 'TypeScript', '多智能体'],
      line: '一个开源的 AI 浏览器智能体，在你的浏览器里本地规划、本地执行，遇到要紧的事会先问你。',
      more: 'Planner 负责想清楚做法，Navigator 负责点击和输入，整个运行过程都显示在侧边栏里。你的数据用你自己的密钥，直接发给你选择的模型提供商：中间没有 Flowkite 的服务器。免费，已上架 Chrome 网上应用店。' },
    curb: { stack: ['策略引擎', 'TypeScript SDK', 'Python SDK', 'Docker'],
      line: '给 AI 智能体用的护栏和熔断器：一个策略引擎，拦下失控的循环、暴涨的费用和破坏性的工具调用。',
      more: '它守在智能体接触外部世界的每一个点上：OpenAI 和 Anthropic 代理、npm 和 PyPI 上的 SDK、一个人工审批仪表盘，以及一份审计记录，取代散落在代码各处的“if step > 20: break”。282 个测试。' },
    jarvis: {
      line: 'Windows 上的语音和文字私人助手，走钢铁侠路线，能听印尼语，也用印尼语回答。',
      more: '离线语音转文字，带唤醒词（“Jarvis”“Hey Jarvis”），通过 Edge TTS 发出自然的印尼语语音，背后接一个 LLM，还能控制电脑：音量、媒体、靠模糊搜索找到的应用、截图、CPU 和内存。语音、图形界面和终端三种模式，并有每日限流器和 token 统计，让成本一直很低。' },
    'reel-fortune': { stack: ['Three.js', '体素', '一个 index.html'],
      line: '一场横跨四座岛屿的体素风钓鱼、挖矿和赌博冒险，用 Three.js 打造。鱼翻倍，或者全赔光。',
      more: '海岸上有些鱼只在夜里或暴风雨中咬钩，还有采石场和树林，一个价格每三分钟就变一次的商人，一家挂着五支虚构股票、每小时分红的交易所，分十个等级的装备，以及一张镜头会俯冲下去的 3D 轮盘赌桌。无需安装：全靠一个 index.html 运行。' },
    mydesk: { name: '3D 桌面', stack: ['WebGL2', '自研引擎', 'Blender', '零依赖'],
      line: '把这份作品集做成夜里的一张书桌：一个布置好的房间，一把键帽上建着小镇的机械键盘，以及在它上面敲出的一切。',
      more: '跑在一个自己写的小型 WebGL2 引擎上：渲染器带阴影贴图、ACES 色调映射和景深处理，还有轨道控制、射线拾取和补间系统，什么都不用安装。那些世界在 Blender 里搭好，再打包成一个独立的文件。' },
    adpulse: {
      line: '把 Google Ads 和 Meta Ads 放进同一个仪表盘的广告分析工具，附带 AI 洞察和每日摘要邮件。',
      more: '同步任务每四小时把两个平台的数据拉进 PostgreSQL，基于 Claude API 的洞察引擎写出建议，市场团队在同一个地方查看花费、CTR、CPC 和转化。模拟模式用样例数据跑通整套流程，不需要 API 密钥。' },
    chimera: {
      line: '一个生成式 NFT 系列引擎：按真实的稀有度权重抽取特征，渲染作品，再写出与之相符的元数据。',
      more: '两种模式：把你提供的 PNG 图层合成起来，或者抽取特征、生成提示词，再通过以风格手册为条件的图像模型渲染。质检环节会揪出平淡的渲染和视觉上的双胞胎，并检查每张图是否真的包含元数据所声称的特征。已完整跑过 1000 个版本，零重复。' },
    nevu: { license: '仅限研究', stack: ['机器学习', '多模态', '区块链锚定'],
      line: '检测并定位印尼毕业证书、成绩单和职业资格证书中的伪造之处。',
      more: '对存量的旧文件用多模态模型，对已验证的文件用区块链锚定，并配有自建的数据集，涵盖各类伪造操作和拍摄条件。第零个里程碑已完成，第一阶段（模型）正在进行。' },
    luxe: { stack: ['Next.js', 'Midtrans / Stripe 桥接'],
      line: '面向高端品牌的 Next.js 电商模板：改一个配置文件，就能给整家店换上新的品牌。',
      more: '心愿单、紧迫感引擎、包邮进度条、可对接 Midtrans 或 Stripe 的支付服务桥接，以及悬浮的 WhatsApp 和回到顶部按钮。' },
    'student-performance': {
      line: '一条端到端的机器学习流水线，预测一名学生能否顺利毕业。',
      more: '从 EDA 到评估的五个审计阶段，十种算法配合超参数调优逐一比较，一个 FastAPI 推理接口和一个用来试预测的 Next.js 前端，可直接在 Docker 里运行。' },
  },
};

// the month a lab was made, in the language: 'Aug 2026' stays in English, becomes 'Agu 2026' and '2026 年 8 月'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function whenIn(lang, s) {
  const m = /^([A-Z][a-z]{2}) (\d{4})$/.exec(s || ''), i = m ? MONTHS.indexOf(m[1]) : -1;
  if (i < 0) return s;
  return lang === 'id' ? `${MONTHS_ID[i]} ${m[2]}` : lang === 'zh' ? `${m[2]} 年 ${i + 1} 月` : s;
}

/** The kinds in a language: [[key, label]], in LAB_KINDS' order ('en', or a language without labels, gives LAB_KINDS itself). */
export function labKindsFor(lang = 'en') {
  const T = LAB_KINDS_T[lang];
  return T ? LAB_KINDS.map(([k, label]) => [k, T[k] ?? label]) : LAB_KINDS;
}

/** The labs in a language: LABS in the same order, with name, line, more, stack, license and when translated where a translation
 *  exists ('en', or a language without translations, gives LABS itself). */
export function labsFor(lang = 'en') {
  const T = LABS_T[lang];
  if (!T) return LABS;
  return LABS.map((l) => {
    const x = T[l.key] || {};
    return { ...l, name: x.name ?? l.name, line: x.line ?? l.line, more: x.more ?? l.more, stack: x.stack ?? l.stack, license: x.license ?? l.license, when: whenIn(lang, l.when) };
  });
}
