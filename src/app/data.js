// Portfolio content for Navy Gibran. Every name, project and line of copy on the desk lives here.
import { BACKLIGHTS as _BL } from 'app/theme';
export const BACKLIGHTS = _BL;

export const SITE = {
  name: 'Navy Gibran',
  author: 'Navy Gibran',
  role: 'Full-stack developer',
  initials: 'NG',
  tagline: 'full-stack developer · ERP systems, Next.js and Go, WordPress',
  year: '2026',
  whatsapp: '6285157170559',
  links: [
    { label: 'WhatsApp', href: 'https://wa.me/6285157170559' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/navy-gibran-29950528a/' },
    { label: 'GitHub', href: 'https://github.com/itsnevu' },
    { label: 'X', href: 'https://x.com/itsnevuu' },
    { label: 'Résumé', href: 'https://www.itsnevu.xyz/CV%20ATS%20Navy%20Gibran.pdf' },
  ],
  about: `I'm Navy Gibran, a full-stack developer and WordPress specialist studying Informatics at Universitas Multimedia Nusantara. I build ERP systems with Go and Next.js, and websites for Indonesian businesses, sixteen of them live today.`,
  currently: 'leading GodPlan ERP at PT. Gajah Terbang Kreatif.',
  // the About panel's "at a glance" chips: one fact each, short enough to scan
  facts: ['Informatics · UMN', 'GPA 3.7 / 4.00', '16 live client sites', 'Leads GodPlan ERP'],
  // printed on objects, so the length is fixed: the paper note fits ~16 characters a line, the monitor ~25
  note: ['full-stack dev', 'Informatics, UMN', 'loves to build', 'smart contract addict', 'AI tools researcher'],
  headline: ["Hi, I'm Navy,", 'full-stack developer.'],
  screen: ['ERP systems in Go + Next.js', '16 live sites, 10+ industries'], // the smaller lines under the headline
  // the lamp prints these on the desk: four groups, four items each at most
  skills: [
    { group: 'Frontend', items: ['Next.js / React', 'TypeScript', 'Tailwind CSS', 'Figma'] },
    { group: 'Backend & data', items: ['Go (Golang)', 'Node.js', 'PostgreSQL / MySQL', 'Docker'] },
    { group: 'WordPress', items: ['Custom themes', 'WooCommerce', 'Elementor', 'PHP'] },
    { group: 'Web3', items: ['Solidity', 'Smart contracts', 'Wallet integration', 'dApp frontends'] },
  ],
};

// The nine destinations. Each is a Blender-built miniature world (assets/world_XX.json) with its own physical trigger on the desk.
// 01–03 are the work, 04–08 are who I am, 09 is contact. Hotspot ids belong to the world's geometry and must stay as they are;
// the first hotspot is also the note shown when the key is pressed, and on 04–07 the order is the order of the closer looks.
export const WORLDS = [
  { key: 'signal-garden', num: '01', title: 'GodPlan ERP', sub: 'Enterprise platform', asset: 'world_01', trigger: 'signal', tier: 'world', project: 'godplan-erp', sign: 'GODPLAN ERP', tagline: 'one system, every department',
    hotspots: { screen: { title: 'The dashboard', body: 'Headcount, today\'s attendance, pending tasks and monthly payroll on one screen, with a shortcut into every module. Every corner of this floor is one of them, and the screen answers when something happens there.' }, desk: { title: 'Employees', body: 'The staff roster (who works here), with headcount carried up to the dashboard. One of the core features I built, alongside authentication.' }, papers: { title: 'Payroll', body: 'Monthly outgoings, carried on the dashboard right beside headcount.' }, lamp: { title: 'CRM', body: 'Who the company is talking to: its contacts, one shortcut away from the dashboard.' }, tower: { title: 'The core', body: 'Go and PostgreSQL behind every screen. System health (database state, storage, backups) is reported in the interface instead of buried on a server.' }, greenhouse: { title: 'Attendance & leave', body: 'Daily present/absent tracking, summarised as a rate for the day, with leave handled in the same system.' } } },
  { key: 'market-district', num: '02', title: 'Client Websites', sub: 'Client work', asset: 'world_02', trigger: 'market', tier: 'world', project: 'client-websites', sign: 'CLIENT WEBSITES', tagline: 'sixteen live sites, no mockups',
    hotspots: { sign: { title: 'Market street', body: 'Sixteen live websites for Indonesian businesses: car care, manufacturing, florists, optics, packaging, medical, marketing, server racks, home decor, children\'s dress rental. Every shop on this street is a real client.' }, shelves: { title: 'Company profiles', body: 'Ten WordPress company profiles a client can hand to their own team afterwards: Dams Garage, NF Optical, Gracia Box, Orthobone, Yukti Rasa Mitrabumi and more.' }, counter: { title: 'The checkout', body: 'Three WooCommerce stores: Flora Indonesia, a florist; Miniatur Kapal, an export-facing craft catalogue; and FLS Group Indonesia, feng shui decor and LED lamps. Payments and delivery logistics are part of the build.' }, crate: { title: 'Behind the shops', body: 'A custom theme where the design demands it, Elementor where the client will edit pages themselves, and a custom SvelteKit build when a CMS is the wrong tool, as for Winfaith.' } } },
  { key: 'tech-lab', num: '03', title: 'JAKASN', sub: 'GovTech · BKN', asset: 'world_03', trigger: 'lab', tier: 'world', project: 'jakasn', sign: 'JAKASN', tagline: 'digital publishing for the civil service',
    hotspots: { monitors: { title: 'The platform', body: 'JAKASN: a journal platform for Pusbangpeg ASN BKN, built on Open Journal Systems with a redesigned interface that fits the institution\'s branding.' }, rings: { title: 'The core', body: 'Front end in HTML, CSS and JavaScript; system integration on the back end in PHP and MySQL.' }, diagram: { title: 'The network', body: 'Work across BKN\'s enterprise-scale systems (OJS, JAKASN and BKNPEDIA) and the legacy integrations between them.' }, device: { title: 'The internship', body: 'Full-stack developer intern in the Information Systems Working Group at BKN, January to June 2025.' } } },
  { key: 'living-archive', num: '04', title: 'Education', sub: 'Informatics · UMN', asset: 'world_04', trigger: 'o', tier: 'discover', project: 'education', sign: 'EDUCATION', tagline: 'since August 2022',
    hotspots: { hall: { title: 'Reading hall', body: 'Bachelor of Informatics at Universitas Multimedia Nusantara, since August 2022.' }, courtyard: { title: 'The courtyard', body: 'Where notes are read aloud: two years as teaching assistant for Object-Oriented Programming: design patterns, SOLID, and the logic behind them, for undergraduates.' }, stacks: { title: 'The stacks', body: 'A 3.7 GPA out of 4.00, kept up alongside internships and client work.' }, annex: { title: 'Languages', body: 'Indonesian and English, both active. Mandarin, passive.' } } },
  { key: 'playground', num: '05', title: 'Early Days', sub: 'Before the code', asset: 'world_05', trigger: 'x', tier: 'discover', project: 'early-days', sign: 'EARLY DAYS', tagline: 'freelance work and campus life',
    hotspots: { tree: { title: 'Where it started', body: 'October 2023, freelance crew for PT. Nusantara Compnet Integrator: five smart TVs a day, carried up the stairs at Pertamina Simprug by a team of four.' }, slide: { title: 'The laptop job', body: 'December 2024, back as a freelance technician: 341 Zyrex laptops re-imaged and cloned for a BNI procurement, in two days.' }, climber: { title: 'Programming club', body: 'UMN Programming Club, 2024 to 2025: C++ for competitive programming, problems solved as a team, and the UMNPC contest.' }, kiosk: { title: 'Campus crew', body: 'PPIF UMN security division, 2024: planning paths, seating and event flow so new students could take part safely.' } } },
  { key: 'visual-atelier', num: '06', title: 'How I Work', sub: 'Process & standards', asset: 'world_06', trigger: 'rbr', tier: 'discover', project: 'how-i-work', sign: 'HOW I WORK', tagline: 'strategy, design, development, deployment',
    hotspots: { studio: { title: 'The process', body: 'Four steps, every project. Strategy: the roadmap and the architecture. Design: the experience. Development: secure, scalable systems. Deployment: the launch, then monitoring.' }, gallery: { title: 'Deep focus', body: 'Uninterrupted blocks of time for the hard architectural problems, solved without distractions.' }, terrace: { title: 'Clean architecture', body: 'Systems with clear boundaries, so they stay maintainable and testable as they grow.' }, workshop: { title: 'With the team', body: 'Business requirements and Figma prototypes in, reliable and user-friendly workflows out, built together with design and product teams.' } } },
  { key: 'field-notes', num: '07', title: 'Career', sub: 'The path so far', asset: 'world_07', trigger: 'f8', tier: 'discover', project: 'career', sign: 'CAREER', tagline: 'from field work to system architecture',
    hotspots: { tower: { title: 'The long view', body: 'From freelance technician in 2024 to leading an ERP build in 2025: the climb so far, one camp at a time.' }, camp: { title: 'Base camp', body: 'January to June 2025: full-stack developer intern at Pusbangpeg ASN BKN, building JAKASN in PHP and MySQL.' }, bridge: { title: 'The crossing', body: 'July 2025: joined PT. Gajah Terbang Kreatif for full-stack and WordPress work.' }, cabin: { title: 'The cabin', body: 'Now: leading the development of GodPlan ERP, a scalable Go and Next.js architecture with workforce management features.' } } },
  { key: 'workshop', num: '08', title: 'About', sub: 'Who I am', asset: 'world_08', trigger: 'enter', tier: 'world', project: 'about', sign: 'ABOUT ME', tagline: 'where the work gets made',
    hotspots: { bench: { title: 'The workbench', body: 'I\'m Navy, a full-stack developer and WordPress specialist. Everything else on this desk was built at this bench.', panel: 'about' }, shelves: { title: 'The shelves', body: 'The tools behind every project here: Go, Next.js, TypeScript, PostgreSQL, Docker, Node.js, Tailwind, WordPress and PHP.' }, sketches: { title: 'Sketch wall', body: 'Two focus areas pinned above the bench: enterprise logic (scalable systems for high-concurrency environments) and tactical UX, bridging efficient engineering with cinematic, high-fidelity interfaces.' }, plants: { title: 'The mission', body: '“I build digital infrastructure that defines excellence.” The plants are there to check that I do.' } } },
  { key: 'night-desk', num: '09', title: 'Contact', sub: 'Say hello', asset: 'world_09', trigger: 'mouse', project: 'contact', sign: 'CONTACT', tagline: 'the quiet end of the day',
    hotspots: { phone: { title: 'Say hello', body: 'Have a project in mind? WhatsApp is the fastest way to reach me.', panel: 'contact' }, monitor: { title: 'Scope first', body: 'Tell me the shape of what you need and you get a written scope back before anything starts.' }, window: { title: 'The window', body: 'A sentence or two is enough to start the conversation. The city lights stay on either way.' }, shelf: { title: 'The shelf', body: 'No price list on it: no two projects have had the same scope, so any number here would be fiction.' } } },
];
export const DIORAMAS = Object.fromEntries(WORLDS.map((w) => [w.project, { kind: 'asset', world: w, sign: w.sign, tagline: w.tagline, hotspots: w.hotspots }]));

// Everything that has been built: the project pages, the clock's timeline and the monitor.
// `portal` links a project to its world on the keyboard, `url` is the live site.
// `date` is free text; 'live' stands in until the real date is known (the timeline groups those last).
export const PROJECTS = [
  { key: 'godplan-erp', title: 'GodPlan ERP', date: 'since July 2025', industry: 'HR & workforce', stack: 'Go · Next.js · TypeScript · PostgreSQL', portal: 'f1', hue: 36,
    description: 'One system for the parts of running a company that usually sprawl across four tools and a spreadsheet: employees, attendance and leave, payroll, tasks and CRM. Architecture and full-stack build for PT. Gajah Terbang Kreatif, in production, internal access only, and built for the phone too.' },
  { key: 'client-websites', title: 'Client Websites', date: 'live', industry: '10+ industries', stack: 'WordPress · WooCommerce · Next.js · Go', portal: 'f2', hue: 22,
    description: 'Sixteen live websites for Indonesian businesses: twelve WordPress sites, three WooCommerce stores and one custom SvelteKit build. None of them is a mockup: every one is listed below and online.' },
  { key: 'jakasn', title: 'JAKASN', date: 'January to June 2025', industry: 'Government (GovTech)', stack: 'PHP · MySQL · OJS · JavaScript', portal: 'f3', hue: 48,
    description: 'A journal platform for Pusbangpeg ASN BKN that integrates Open Journal Systems with a redesigned interface, for accessibility and the institution\'s branding. Front end in HTML, CSS and JavaScript; back-end integration in PHP and MySQL. Built during a full-stack internship.' },
  { key: 'winfaith', title: 'PT. Winfaith Indonesia', date: 'live', industry: 'Industrial manufacturing', stack: 'SvelteKit · Tailwind · GSAP · Three.js', url: 'https://winfaith.co.id/', hue: 14,
    description: 'Company site for an industrial manufacturer, built as a custom application instead of on a CMS: SvelteKit and Tailwind, GSAP motion and Three.js, with the product catalogue served from the company\'s own API.' },
  { key: 'flora-indonesia', title: 'Flora Indonesia', date: 'live', industry: 'Premium e-commerce', stack: 'WordPress · WooCommerce · MySQL', url: 'https://floraindonesia.com/', hue: 10,
    description: 'An online florist on WooCommerce: catalogue, checkout, payment integration and delivery logistics, all part of the build.' },
  { key: 'miniatur-kapal', title: 'Miniatur Kapal', date: 'live', industry: 'Luxury handicraft', stack: 'WordPress · WooCommerce · MySQL', url: 'https://miniaturkapal.com/', hue: 44,
    description: 'An export-facing catalogue store for luxury handicrafts, on WooCommerce.' },
  { key: 'dams-garage', title: 'Dams Garage', date: 'live', industry: 'Premium car care', stack: 'WordPress · PHP · Elementor · Custom CSS', url: 'https://damsgarage.id/', hue: 28,
    description: 'Company profile for a premium car care business. WordPress and Elementor, with custom CSS on top.' },
  { key: 'yukti-rasa-mitrabumi', title: 'PT. Yukti Rasa Mitrabumi', date: 'live', industry: 'Flavor & fragrance', stack: 'WordPress · PHP', url: 'https://yrm.co.id/', hue: 52,
    description: 'Company profile for a flavour and fragrance manufacturer, on WordPress.' },
  { key: 'nf-optical', title: 'NF Optical', date: 'live', industry: 'Retail & medical', stack: 'WordPress · PHP · Custom UI', url: 'https://nfopticalofficial.com/', hue: 40,
    description: 'Company profile for an optical retailer, on WordPress with a custom interface.' },
  { key: 'gajah-terbang-kreatif', title: 'PT. Gajah Terbang Kreatif', date: 'live', industry: 'Creative ecosystem', stack: 'WordPress · PHP · Creative theme', url: 'https://gajahterbangkreatif.id/', hue: 34,
    description: 'The public site of the company behind GodPlan ERP. The same client twice: a WordPress site anyone can open, and the internal platform.' },
  { key: 'gracia-box', title: 'Gracia Box', date: 'live', industry: 'Industrial packaging', stack: 'WordPress · PHP', url: 'https://graciabox.id/', hue: 18,
    description: 'Company profile for an industrial packaging business, on WordPress.' },
  { key: 'orthobone', title: 'Orthobone', date: 'live', industry: 'Medical solutions', stack: 'WordPress · PHP', url: 'https://orthobone.store/', hue: 46,
    description: 'Company profile for a medical equipment business, on WordPress.' },
  { key: 'rameinaja', title: 'RameinAja', date: 'live', industry: 'Digital marketing', stack: 'WordPress · PHP', url: 'https://rameinaja.com/', hue: 26,
    description: 'Company profile for a digital marketing business, on WordPress.' },
  { key: 'recon', title: 'Recon', date: 'live', industry: 'Tech research', stack: 'WordPress · PHP', url: 'https://reconstruction.id/', hue: 38,
    description: 'Company profile for a tech research company, on WordPress.' },
  { key: 'airon', title: 'Airon', date: 'live', industry: 'AC service & installation', stack: 'WordPress · PHP · Modern UI', url: 'https://airon.site/', hue: 30,
    description: 'Site for an air-conditioning service: cleaning, repairs and installation, on WordPress with a modern interface.' },
  { key: 'izzi', title: 'Izzi', date: 'live', industry: 'Lifestyle brand', stack: 'WordPress · PHP', url: 'https://izzi-bsd.com/', hue: 56,
    description: 'Company profile for a lifestyle brand, on WordPress.' },
  { key: 'little-aivy', title: 'Little Aivy', date: 'live', industry: 'Kids\' dress rental', stack: 'WordPress · Elementor', url: 'https://littleaivy.com/', hue: 8,
    description: 'A rental catalogue for premium children\'s party dresses, on WordPress and Elementor: the collection, the terms, and a WhatsApp button to book.' },
  { key: 'fortunarack', title: 'Fortunarack', date: 'live', industry: 'Server & network racks', stack: 'WordPress · Elementor', url: 'https://new.fortunarack.co.id/', hue: 210,
    description: 'Company site for a maker of indoor and outdoor cabinets for server, networking, telecom and power infrastructure, with a product catalogue, on WordPress and Elementor.' },
  { key: 'fls-group-indonesia', title: 'FLS Group Indonesia', date: 'live', industry: 'Feng shui decor & lighting', stack: 'WordPress · WooCommerce · Elementor', url: 'https://flsgroupindonesia.com/', hue: 42,
    description: 'An online store on WooCommerce for feng shui porcelain, Chinese cultural art, wall decor and decorative LED lamps: catalogue, cart and checkout.' },
];

// The who-I-am worlds (04–09) need a record to live in; they stay out of the project list, the timeline and the monitor.
// Real screenshots of the live sites, desktop and phone (public/shots/<key>.webp and <key>-m.webp, captured 2 Oct 2026). The project
// page shows them in a browser frame; projects without one keep their generated card.
// More screenshots per project, from Navy (public/shots/gallery/<key>-<n>.webp, n from 1): the project page shows them in its browser
// frame with a row of thumbnails under it; GALLERY_PHONE is a phone screenshot for a project without a live one (GodPlan is internal)
export const GALLERY = { 'godplan-erp': 1, 'client-websites': 6, winfaith: 5, 'flora-indonesia': 3, 'miniatur-kapal': 3, 'dams-garage': 3, 'yukti-rasa-mitrabumi': 3, 'nf-optical': 3, 'gajah-terbang-kreatif': 4, 'gracia-box': 3, orthobone: 2, rameinaja: 1, recon: 3, airon: 3, izzi: 3 };
export const GALLERY_PHONE = { 'godplan-erp': 'shots/gallery/godplan-erp-m.webp', 'client-websites': 'shots/little-aivy-m.webp' };
// what the browser frame's address bar says for a project with no single address of its own
export const SHOT_HOST = { 'client-websites': 'sixteen live sites' };
export const SHOTS = ['winfaith', 'flora-indonesia', 'dams-garage', 'yukti-rasa-mitrabumi', 'nf-optical', 'gracia-box', 'orthobone', 'recon', 'izzi', 'little-aivy', 'fortunarack', 'fls-group-indonesia'];

// The keyboard read as a story, in the order it happened. Each stop is a place on the board (its target id), when it was, and a
// line or two; the bookmark key (or T) walks it, and the keys between two stops light up as if the story were being typed.
// Every line comes from the facts above: nothing here is new.
export const STORY = [
  { at: 'keyboard', when: '2022 to now', title: 'The story so far', body: 'Everything on this keyboard is something I built or somewhere I worked, laid out like a model of a small town. Here it is in the order it happened.' },
  { at: 'o', when: 'since 2022', title: 'Campus', body: 'Informatics at Universitas Multimedia Nusantara since August 2022, and two years as a teaching assistant for Object-Oriented Programming.' },
  { at: 'x', when: '2023 to 2024', title: 'Early days', body: 'Field work first: smart TVs carried up the stairs at Pertamina Simprug with a crew of four, then 341 laptops re-imaged in two days for a BNI procurement.' },
  { at: 'lab', when: 'January to June 2025', title: 'JAKASN', body: 'Full-stack developer intern at BKN: JAKASN, a journal platform for the civil service on Open Journal Systems, in PHP and MySQL.' },
  { at: 'signal', when: 'since July 2025', title: 'GodPlan ERP', body: 'At PT. Gajah Terbang Kreatif, leading GodPlan ERP: one system for employees, attendance, payroll and CRM, in Go and Next.js. The crane is still up.' },
  { at: 'market', when: 'live today', title: 'Client websites', body: 'Sixteen live websites for Indonesian businesses. Every shop on this street is a real client, and the lot at the top is still free.' },
  { at: 'f8', when: 'the long view', title: 'Career', body: 'From freelance technician to leading an ERP build, one camp at a time. The next camp is not on the map yet.' },
  { at: 'enter', when: 'every day', title: 'The workshop', body: 'Where all of it gets made. Go inside for the rest of who I am, or say hello: WhatsApp is the fastest way to reach me.' },
];

export const CHAPTERS = [
  { key: 'education', title: 'Education', date: 'since 2022', stack: 'Informatics · UMN', hue: 40 },
  { key: 'early-days', title: 'Early Days', date: '2023 to 2024', stack: 'Freelance · campus', hue: 28 },
  { key: 'how-i-work', title: 'How I Work', date: 'every project', stack: 'Process · standards', hue: 34 },
  { key: 'career', title: 'Career', date: 'since 2023', stack: 'Field work → system architecture', hue: 44 },
  { key: 'about', title: 'About', date: 'since 2022', stack: 'Full-stack · WordPress', hue: 30 },
  { key: 'contact', title: 'Contact', date: 'any day', stack: 'WhatsApp · LinkedIn · GitHub', hue: 38 },
];

export const projectByKey = (k) => PROJECTS.find((p) => p.key === k) || CHAPTERS.find((p) => p.key === k);
export const projectIndex = (p) => String(PROJECTS.indexOf(p) + 1).padStart(2, '0');

// Facts shown while switching scenes. Keyboard trivia, the site's own voice.
export const FACTS = [
  'The QWERTY layout was patented in 1878, long before anyone typed on glass.',
  'A mechanical switch is rated for roughly fifty million presses.',
  'The space bar is the most-pressed key on almost every keyboard ever made.',
  'The F and J keys carry small bumps so your fingers can find home without looking.',
  'Keycap profiles have names: Cherry, OEM, SA, DSA. Each one shapes the sound.',
  'A 1u keycap is 19.05 millimetres wide, the same on nearly every keyboard.',
  'The Escape key dates back to 1960, when it was used to leave a mode.',
  'Tenkeyless keyboards drop the number pad and keep the arrows. This desk has one.',
  'Rubber dome, scissor, optical, hall-effect: four ways to notice a finger.',
  'The first computer mouse was carved from wood in 1964.',
  'Typing "the quick brown fox" is only interesting because it uses every letter.',
  'Early terminals rang a real bell for the BEL character. Some still beep.',
];

// Interactive targets in the desk scene. The object itself is the navigation.
export const TARGETS = {
  monitor: { kind: 'projects', hint: 'Projects', label: { title: 'Projects', sub: 'the screen is a door' }, discover: 'Projects' },
  signal: { kind: 'world', world: 0, discover: 'GodPlan ERP' },
  market: { kind: 'world', world: 1, discover: 'Client Websites' },
  lab: { kind: 'world', world: 2, discover: 'JAKASN' },
  mechbay: { kind: 'micro', title: 'The mechanism bay', sub: 'three caps off, on purpose', body: 'F5 to F7 were never fitted. The plate is exposed here: brass stems, coil springs, a leaf contact each, and a small bronze gantry where the switches get serviced. The amber lights mean everything is still wired.', discover: 'Mechanism bay' },
  o: { kind: 'world', world: 3, discover: 'Education' },
  x: { kind: 'world', world: 4, discover: 'Early Days' },
  rbr: { kind: 'world', world: 5, discover: 'How I Work' },
  f8: { kind: 'world', world: 6, discover: 'Career' },
  mech: { kind: 'micro', title: 'Under the cap', sub: 'a lifted keycap', body: 'Every key on this board is a real switch: brass stem, a coiled spring, a leaf contact. F3 came off during a photo shoot and never went back on.', discover: 'Mechanism' },
  sapling: { kind: 'micro', title: 'The sapling', sub: 'a tree through a keycap', body: 'Something took root in the H key during a long build. It gets watered. It has a lamp.', discover: 'Sapling' },
  stairs: { kind: 'micro', title: 'The staircase', sub: 'steps under the keys', body: 'A stair descends into the plate below the [ key. Nobody has reached the bottom; the light down there is on, though.', discover: 'Staircase' },
  secret: { kind: 'secret', title: 'Hidden compartment', sub: 'you found it', body: 'A brass token under the scroll-lock cap. It reads: thank you for looking closely. N.', discover: 'Secret' },
  // the panel shows `code` as an editor snippet (file tab, line numbers, highlighting); `body` says in plain words what it means
  notebook: { kind: 'sketches', title: 'Notebook', sub: 'builder_manifesto.ts', hint: 'Builder manifesto', file: 'builder_manifesto.ts',
    code: ['class NavyGibran {', "  private specialization = 'Logic';", "  private directive = 'Excellence';", '', '  execute() { return this.build(); }', '}'],
    body: 'The first page of the notebook, written as code: logic is the speciality, excellence is the standard, and every run ends with something built.', discover: 'Notebook' },
  // the study book on the right of the desk (app/mandarin): the "Mandarin, passive" of the Education world, being worked on
  mandarin: { kind: 'book', title: 'Learning Mandarin', sub: 'book 1 · HSK 1-2', hint: 'Mandarin', body: 'Mandarin is passive for now; this book is how it becomes active. A lesson most evenings: the four tones and pinyin first, then characters, a few flashcards at a time. 你好 (nǐ hǎo) means hello.', discover: 'Mandarin' },
  model: { kind: 'model', title: 'Study model', sub: 'a district under acrylic', hint: 'Study model', body: 'A massing study under acrylic: foam, brass wire, one LED. The keyboard version kept the tower and the bridge.', discover: 'Study model' },
  plant: { kind: 'plant', title: 'The plant', sub: 'still alive', hint: 'The plant', body: 'A small potted tree by the clock, still alive. It has watched every project on this desk get built.', discover: 'Plant' },
  chair: { kind: 'pov', hint: 'Sit down', label: { title: 'Sit down', sub: 'the view Navy works from' }, discover: 'The chair' },
  katana: { kind: 'gym', title: 'Two katana', sub: 'black and red lacquer', hint: 'Katana', body: 'A pair on a walnut rack, edges up, handles to the left: a black saya and a red one, iron tsuba, silk-wrapped grips. A reminder to keep the work sharp and the cuts clean.', discover: 'Katana' },
  pullup: { kind: 'gym', title: 'The bar', sub: 'pull-ups & dips', hint: 'Pull-up bar', body: 'A power tower by the wall: pull-ups on the straight bar, dips on the handles, knee raises on the pads. A set between builds keeps the back straight after long hours at the desk. The dumbbells next to it, 2.5 to 25 kg, are for the rest.', discover: 'Pull-up bar' },
  satoshi: { kind: 'gym', title: 'Satoshi Nakamoto', sub: 'the creator of Bitcoin', hint: 'Satoshi', body: 'The pseudonymous creator of Bitcoin. In 2008 Satoshi published the Bitcoin whitepaper, a peer-to-peer electronic cash system with no bank in the middle, and in January 2009 mined its first block. By 2011 Satoshi had stepped away, and still nobody knows who they are. This figure follows the bronze bust in Budapest: a hoodie and a face polished to a mirror, so whoever looks into it sees themselves. We are all Satoshi.', discover: 'Satoshi' },
  guide: { kind: 'guide', hint: 'Open the guide', label: { title: 'Guide', sub: 'how to look around' } },
  work: { kind: 'quickwork', hint: 'See the work', label: { title: 'Projects', sub: 'the quick way' } },
  neon: { kind: 'neon', hint: 'Neon', label: { title: 'Neon', sub: 'click to switch it' } },
  desklamp: { kind: 'desklamp', hint: 'Desk lamp', label: { title: 'Desk lamp', sub: 'click to switch it' } },
  watches: { kind: 'watches', title: 'The watch box', sub: 'three that keep time', hint: 'Watch box', badge: 'soon', body: 'A Patek Philippe Nautilus 5712/1A, a Cartier Santos and a TAG Heuer Aquaracer Professional 300, already set to the time where you are. Not on the wrist yet: soon.', discover: 'Watch box' },
  bike: { kind: 'bike', hint: 'Road bike', shortcut: 'B', label: { title: 'Road bike', sub: 'black on black' }, discover: 'Road bike', toast: '<b>road bike</b>: black on black, no badges. the helmet hangs on the bar.' },
  curtains: { kind: 'curtains', hint: 'Open / close the curtains' },
  lights: { kind: 'lights', hint: 'Room lights' },
  door: { kind: 'door', hint: 'Door' },
  aircon: { kind: 'aircon', hint: 'Air conditioner' },
  floorlamp: { kind: 'floorlamp', hint: 'Floor lamp' },
  medals: { kind: 'medals', hint: 'Running medals', label: { title: 'Running medals', sub: 'finisher medals' }, discover: 'Medals', toast: '<b>running medals</b>: finisher medals, hung in a neat row.' },
  // the panel prints `stack` as a spec sheet: one row per layer, each tool a chip (app/ui panel.machine); `body` is the line above it
  pc: { kind: 'machine', title: 'The machine', sub: 'what the work runs on', hint: 'Tech stack', body: 'The tools behind every project on this desk, layer by layer.', github: 'https://github.com/itsnevu',
    stack: [
      { layer: 'Frontend', items: ['Next.js', 'SvelteKit', 'TypeScript', 'Tailwind'] },
      { layer: 'Backend', items: ['Go', 'Node.js', 'Bun', 'PHP'] },
      { layer: 'Data', items: ['PostgreSQL', 'MySQL'] },
      { layer: 'Ship', items: ['Docker', 'Vercel'] },
      { layer: 'Motion & 3D', items: ['GSAP', 'Framer Motion', 'Three.js', 'WebGL'] },
    ], discover: 'The machine' },
  enter: { kind: 'world', world: 7, discover: 'About' },
  plaza: { kind: 'micro', title: 'The plaza', sub: 'a brass gate on the \' key', body: 'A square with one bench and one gate that leads nowhere in particular. People meet under the sign anyway. The lamp comes on when you look.', discover: 'Plaza' },
  garden: { kind: 'micro', title: 'The sunken garden', sub: 'a pond under the ; key', body: 'A pine, a pond and four stepping stones, sunk into the cap so the water stays level when the key is pressed.', discover: 'Garden' },
  note: { kind: 'about', hint: 'About me', label: { title: 'About', sub: 'who I am' }, discover: 'About me' },
  lamp: { kind: 'skills', hint: 'Skills', label: { title: 'Skills', sub: 'what the lamp lights up' }, discover: 'Skills' },
  mouse: { kind: 'world', world: 8, label: { title: 'Contact', sub: 'say hello' }, discover: 'Contact' },
  clock: { kind: 'timeline', hint: 'Timeline', label: { title: 'Timeline', sub: 'every project, in order' }, discover: 'Timeline' },
  mug: { kind: 'coffee', hint: 'Coffee', label: { title: 'Coffee', sub: 'still warm' }, discover: 'Coffee' },
  keyboard: { kind: 'keyboard', hint: 'Keyboard', label: { title: 'Keyboard', sub: 'a map of the work' }, discover: 'Keyboard' },
  // the orange bookmark key: the keyboard read as a story, stop by stop (STORY below)
  art4: { kind: 'story', hint: 'The story so far', shortcut: 'T', label: { title: 'The story', sub: '2022 to now, stop by stop' }, discover: 'The story' },
  story: { kind: 'alias', to: 'art4' },   // #story, and the menu's Story
  esc: { kind: 'overview', hint: 'Overview', label: { title: 'Overview', sub: 'a slow orbit of the desk' }, discover: 'Overview' },
  fn: { kind: 'backlight', hint: 'Backlight', label: { title: 'Backlight', sub: 'cycle the key light' }, discover: 'Backlight' },
  space: { kind: 'music', hint: 'Music', label: { title: 'Sound', sub: 'play / pause the room tone' } },
  speaker: { kind: 'music', hint: 'Music', shortcut: 'M', label: { title: 'Music', sub: 'play / pause the room' } },
  // keyboard aliases: the keys are the navigation
  a: { kind: 'alias', to: 'note' },
  s: { kind: 'alias', to: 'lamp' },
  c: { kind: 'alias', to: 'mouse' },
  w: { kind: 'alias', to: 'monitor' },
  p: { kind: 'alias', to: 'clock' },
  caps: { kind: 'alias', to: 'note' },
  n: { kind: 'alias', to: 'note' },
};

// What counts as a discovery: one per intended interaction, never random clicks.
export const DISCOVERY_ORDER = ['signal', 'market', 'lab', 'o', 'x', 'rbr', 'f8', 'enter', 'note', 'mechbay', 'mech', 'sapling', 'stairs', 'plaza', 'garden', 'secret', 'mouse', 'notebook', 'mandarin', 'model', 'plant', 'watches', 'katana', 'pullup', 'satoshi', 'chair', 'bike', 'medals', 'pc', 'monitor', 'lamp', 'clock', 'mug', 'keyboard', 'esc', 'art4'];

// The seven rooms of the project gallery, in corridor order (mirrors worlds 01–07). `project` links a room to a built world; the rest are curated exhibits only.
export const ROOMS = WORLDS.slice(0, 7).map((w) => ({ id: w.key, num: w.num, title: w.title, sub: w.sub, project: w.tier === 'world' ? w.project : null, note: w.tier === 'world' ? undefined : w.tagline }));
export const DISCOVERY_TOTAL = DISCOVERY_ORDER.length;
// The counter's three groups, by where to look, so a visitor knows what is left and roughly where. Every DISCOVERY_ORDER id
// belongs to exactly one; the HUD files any id missing here under the desk.
export const DISCOVERY_GROUPS = [
  { id: 'keys', label: 'keys', title: 'On the keyboard', hint: 'keys that look different, and the tiny worlds built into them', ids: ['signal', 'market', 'lab', 'o', 'x', 'rbr', 'f8', 'enter', 'mechbay', 'mech', 'sapling', 'stairs', 'plaza', 'garden', 'secret', 'keyboard', 'esc', 'art4'] },
  { id: 'desk', label: 'desk', title: 'On the desk', hint: 'the screens, the lamp and everything lying around the keyboard', ids: ['monitor', 'note', 'lamp', 'clock', 'mouse', 'mug', 'notebook', 'mandarin', 'model', 'plant', 'watches', 'pc'] },
  { id: 'room', label: 'room', title: 'Around the room', hint: 'the walls, the corners and the chair you would sit in', ids: ['chair', 'katana', 'pullup', 'satoshi', 'bike', 'medals'] },
];


export const MENU = [
  { id: 'about', label: 'About', target: 'note' },
  { id: 'projects', label: 'Projects', target: 'monitor' },
  { id: 'story', label: 'Story', target: 'story', key: 'T' },
  { id: 'skills', label: 'Skills', target: 'lamp' },
  { id: 'index', label: 'Index', target: 'clock' },
  { id: 'contact', label: 'Contact', target: 'mouse' },
];
