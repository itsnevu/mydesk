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
  copyright: '2025',   // the year after the © (Navy's call, 2025 since 2026-10-12); `year` stays the current one for the clocks and the intro
  whatsapp: '6285179536062',
  links: [
    { label: 'WhatsApp', href: 'https://wa.me/6285179536062' },
    { label: 'Email', href: 'mailto:navygibran16@gmail.com' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/navy-gibran-29950528a/' },
    { label: 'GitHub', href: 'https://github.com/itsnevu' },
    { label: 'X', href: 'https://x.com/itsnevuu' },
    { label: 'Résumé', href: '/cv/Navy-Gibran-CV.pdf' },   // (public/cv: the same PDF as on itsnevu.xyz, served from this domain)
  ],
  // the one-line status a recruiter or a client looks for first (hero corner, menu, contact); `where` is the time zone, not a street
  status: 'Open to freelance and full-time work',
  where: 'Indonesia, GMT+7',
  email: 'navygibran16@gmail.com',
  about: `I'm Navy Gibran, a full-stack developer and WordPress specialist, a 2026 Informatics graduate of Universitas Multimedia Nusantara, now at PT. Gajah Terbang Kreatif. I build ERP systems with Go and Next.js, and websites for Indonesian businesses, twenty-three of them live today.`,
  currently: 'full-stack developer at PT. Gajah Terbang Kreatif.',   // (never "intern", never "leading": "full-stack developer", and GodPlan ERP was "built" there, Navy 2026-10-12)
  // the About panel's "at a glance" chips: one fact each, short enough to scan
  facts: ['Informatics graduate · UMN 2026', 'GPA 3.71 / 4.00', '23 live client sites', 'Built GodPlan ERP'],
  // printed on objects, so the length is fixed: the paper note fits ~16 characters a line, the monitor ~25
  note: ['full-stack dev', 'Informatics, UMN', 'loves to build', 'smart contract addict', 'AI tools researcher'],
  headline: ["Hi, I'm Navy,", 'full-stack developer.'],
  screen: ['ERP systems in Go + Next.js', '23 live sites, 10+ industries'], // the smaller lines under the headline
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
  { key: 'market-district', num: '02', title: 'Client Websites', sub: 'Client work', asset: 'world_02', trigger: 'market', tier: 'world', project: 'client-websites', sign: 'CLIENT WEBSITES', tagline: 'twenty-three live sites, no mockups',
    hotspots: { sign: { title: 'Market street', body: 'Twenty-three live websites for Indonesian businesses: car care, manufacturing, florists, optics, packaging, mattresses, property, events, server racks, home decor, children\'s dress rental, river adventures in Bali. Every shop on this street is a real client.' }, shelves: { title: 'Company profiles', body: 'Seventeen WordPress company profiles a client can hand to their own team afterwards: Dams Garage, NF Optical, The Bedji Group, Gracia Box, Yukti Rasa Mitrabumi and more.' }, counter: { title: 'The checkout', body: 'Four WooCommerce stores: PT. Rumindo Pertiwi Wardhana, the florist Flora Indonesia; Miniatur Kapal, handmade ship miniatures; FLS Group Indonesia, feng shui decor and LED lamps; and Orthobone, orthopedic mattresses. Payments and delivery logistics are part of the build.' }, crate: { title: 'Behind the shops', body: 'A custom theme where the design demands it, Elementor where the client will edit pages themselves, and a custom SvelteKit build when a CMS is the wrong tool, as for Winfaith.' } } },
  { key: 'tech-lab', num: '03', title: 'JAKASN', sub: 'GovTech · BKN', asset: 'world_03', trigger: 'lab', tier: 'world', project: 'jakasn', sign: 'JAKASN', tagline: 'digital publishing for the civil service',
    hotspots: { monitors: { title: 'The platform', body: 'JAKASN: a journal platform for Pusbangpeg ASN BKN, built on Open Journal Systems with a redesigned interface that fits the institution\'s branding.' }, rings: { title: 'The core', body: 'Front end in HTML, CSS and JavaScript; system integration on the back end in PHP and MySQL.' }, diagram: { title: 'The network', body: 'Work across BKN\'s enterprise-scale systems (OJS, JAKASN and BKNPEDIA) and the legacy integrations between them.' }, device: { title: 'The internship', body: 'Full-stack developer intern in the Information Systems Working Group at BKN, January to June 2025.' } } },
  { key: 'living-archive', num: '04', title: 'Education', sub: 'Informatics · UMN', asset: 'world_04', trigger: 'o', tier: 'discover', project: 'education', sign: 'EDUCATION', tagline: '2022 to 2026, graduated',
    hotspots: { hall: { title: 'Reading hall', body: 'Bachelor of Informatics at Universitas Multimedia Nusantara, August 2022 to graduation in 2026.' }, courtyard: { title: 'The courtyard', body: 'Where notes are read aloud: two years as teaching assistant for Object-Oriented Programming: design patterns, SOLID, and the logic behind them, for undergraduates.' }, stacks: { title: 'The stacks', body: 'A 3.71 GPA out of 4.00, kept up alongside internships and client work.' }, annex: { title: 'Languages', body: 'Indonesian and English, both active. Mandarin, passive.' } } },
  { key: 'playground', num: '05', title: 'Early Days', sub: 'Before the code', asset: 'world_05', trigger: 'x', tier: 'discover', project: 'early-days', sign: 'EARLY DAYS', tagline: 'freelance work and campus life',
    hotspots: { tree: { title: 'Where it started', body: 'October 2023, freelance crew for PT. Nusantara Compnet Integrator: five smart TVs a day, carried up the stairs at Pertamina Simprug by a team of four.' }, slide: { title: 'The laptop job', body: 'December 2024, back as a freelance technician: 341 Zyrex laptops re-imaged and cloned for a BNI procurement, in two days.' }, climber: { title: 'Programming club', body: 'UMN Programming Club, 2024 to 2025: C++ for competitive programming, problems solved as a team, and the UMNPC contest.' }, kiosk: { title: 'Campus crew', body: 'PPIF UMN security division, 2024: planning paths, seating and event flow so new students could take part safely.' } } },
  { key: 'visual-atelier', num: '06', title: 'How I Work', sub: 'Process & standards', asset: 'world_06', trigger: 'rbr', tier: 'discover', project: 'how-i-work', sign: 'HOW I WORK', tagline: 'strategy, design, development, deployment',
    hotspots: { studio: { title: 'The process', body: 'Four steps, every project. Strategy: the roadmap and the architecture. Design: the experience. Development: secure, scalable systems. Deployment: the launch, then monitoring.' }, gallery: { title: 'Deep focus', body: 'Uninterrupted blocks of time for the hard architectural problems, solved without distractions.' }, terrace: { title: 'Clean architecture', body: 'Systems with clear boundaries, so they stay maintainable and testable as they grow.' }, workshop: { title: 'With the team', body: 'Business requirements and Figma prototypes in, reliable and user-friendly workflows out, built together with design and product teams.' } } },
  { key: 'field-notes', num: '07', title: 'Career', sub: 'The path so far', asset: 'world_07', trigger: 'f8', tier: 'discover', project: 'career', sign: 'CAREER', tagline: 'from field work to system architecture',
    hotspots: { tower: { title: 'The long view', body: 'From freelance technician in 2024 to building an ERP in 2025: the climb so far, one camp at a time.' }, camp: { title: 'Base camp', body: 'January to June 2025: full-stack developer intern at Pusbangpeg ASN BKN, building JAKASN in PHP and MySQL.' }, bridge: { title: 'The crossing', body: 'July 2025: full-stack developer at PT. Gajah Terbang Kreatif, for full-stack and WordPress work.' }, cabin: { title: 'The cabin', body: 'GodPlan ERP, built there: a Go and Next.js architecture with workforce management features.' } } },
  { key: 'workshop', num: '08', title: 'About', sub: 'Who I am', asset: 'world_08', trigger: 'enter', tier: 'world', project: 'about', sign: 'ABOUT ME', tagline: 'where the work gets made',
    hotspots: { bench: { title: 'The workbench', body: 'I\'m Navy, a full-stack developer and WordPress specialist. Everything else on this desk was built at this bench.', panel: 'about' }, shelves: { title: 'The shelves', body: 'The tools behind every project here: Go, Next.js, TypeScript, PostgreSQL, Docker, Node.js, Tailwind, WordPress and PHP.' }, sketches: { title: 'Sketch wall', body: 'Two things pinned above the bench: systems that hold up when a company grows, and interfaces people enjoy using. Every project here is an attempt at both.' }, plants: { title: 'The mission', body: 'Build software a business can lean on, then make it a pleasure to use. The plants are there to check that I do.' } } },
  { key: 'night-desk', num: '09', title: 'Contact', sub: 'Say hello', asset: 'world_09', trigger: 'mouse', project: 'contact', sign: 'CONTACT', tagline: 'the quiet end of the day',
    hotspots: { phone: { title: 'Say hello', body: 'Have a project in mind? WhatsApp is the fastest way to reach me.', panel: 'contact' }, monitor: { title: 'Scope first', body: 'Tell me the shape of what you need and you get a written scope back before anything starts.' }, window: { title: 'The window', body: 'A sentence or two is enough to start the conversation. The city lights stay on either way.' }, shelf: { title: 'The shelf', body: 'No price list on it: no two projects have had the same scope, so any number here would be fiction.' } } },
];
export const DIORAMAS = Object.fromEntries(WORLDS.map((w) => [w.project, { kind: 'asset', world: w, sign: w.sign, tagline: w.tagline, hotspots: w.hotspots }]));

// Everything that has been built: the project pages, the clock's timeline and the monitor.
// `portal` links a project to its world on the keyboard, `url` is the live site.
// `date` is free text; 'live' stands in until the real date is known (the timeline groups those last).
export const PROJECTS = [
  { key: 'godplan-erp', title: 'GodPlan ERP', date: 'since July 2025', industry: 'HR & workforce', stack: 'Go · Next.js · TypeScript · PostgreSQL', portal: 'f1', hue: 36,
    description: 'One system for the parts of running a company that usually sprawl across four tools and a spreadsheet: employees, attendance and leave, payroll, tasks and CRM. Architecture and full-stack build at PT. Gajah Terbang Kreatif, and built for the phone too.',
    role: 'Architecture and full-stack build', did: ['The architecture: Go services on PostgreSQL, a Next.js and TypeScript front end, shipped in Docker','Authentication and the employees module, with headcount carried up to the dashboard','The dashboard: headcount, today’s attendance, pending tasks and monthly payroll on one screen','System health (database state, storage, backups) reported in the interface instead of buried on a server','Built for the phone too'], modules: ['Dashboard','Employees','Attendance & leave','Payroll','Tasks','CRM','System health'] },
  { key: 'client-websites', title: 'Client Websites', date: 'live', industry: '10+ industries', stack: 'WordPress · WooCommerce · Elementor · SvelteKit · Next.js', portal: 'f2', hue: 22,
    description: 'Twenty-three live websites for Indonesian businesses: seventeen WordPress sites, four WooCommerce stores and two custom builds, in SvelteKit and Next.js. None of them is a mockup: every one is listed below, with its own page.' },
  { key: 'jakasn', title: 'JAKASN', date: 'January to June 2025', industry: 'Government (GovTech)', stack: 'PHP · MySQL · OJS · JavaScript', portal: 'f3', hue: 48,
    description: 'A journal platform for Pusbangpeg ASN BKN that integrates Open Journal Systems with a redesigned interface, for accessibility and the institution\'s branding. Front end in HTML, CSS and JavaScript; back-end integration in PHP and MySQL. My first internship project, as a full-stack developer intern.',
    // the picture that is not there (Navy could not find one, 2026-10-11): the plate says so, lightly, in place of the screenshot
    noShot: { tag: 'Sorry, no picture', line: 'My first internship project, built before I learned to screenshot my own work. Not one picture of it survived; the platform did.' },
    role: 'Full-stack developer intern', did: ['Open Journal Systems integrated behind a redesigned interface','Front end in HTML, CSS and JavaScript, fitted to the institution’s branding and accessibility','Back-end integration in PHP and MySQL','Work across BKN’s systems: OJS, JAKASN and BKNPEDIA'] },
  // the online stores first (Navy's call): they show checkout, payments and delivery, the most involved of the client builds
  { key: 'miniatur-kapal', title: 'Miniatur Kapal', date: 'live', industry: 'Handmade ship miniatures', stack: 'WordPress · WooCommerce · PHP · HTML · CSS · MySQL', url: 'https://miniaturkapal.com/', hue: 44,
    description: 'An online store for exclusive ship miniatures, for collectors and for decoration: shop, cart, checkout and customer accounts on WooCommerce.',
    did: ['A WooCommerce store for handmade ship miniatures: shop, product pages, cart, checkout and customer accounts', 'A home page led by the bestsellers and four lines: classic and historic ships, traditional Nusantara ships, modern ships and custom orders', 'Order Now and custom-order buttons straight to WhatsApp', 'WordPress, WooCommerce and Elementor, with Google Site Kit'] },
  // (the client is the company; Flora Indonesia is its florist brand and the site's name, Navy 2026-10-12)
  { key: 'flora-indonesia', title: 'PT. Rumindo Pertiwi Wardhana', date: 'live', industry: 'Premium e-commerce', stack: 'WordPress · WooCommerce · PHP · HTML · CSS · MySQL', url: 'https://floraindonesia.com/', hue: 10,
    description: 'Flora Indonesia, the online florist of PT. Rumindo Pertiwi Wardhana, from Bogor on WooCommerce: flower boards, bouquets, bloom boxes and standing flowers, with checkout, payment integration and delivery logistics all part of the build.',
    did: ['A catalogue by occasion: eleven occasions, from birthdays to condolences, across eight flower lines (bouquets, bloom boxes, flower boards, standing flowers)', 'Every arrangement set on its product page: size, fresh or artificial flowers, a colour theme and a card message, the price following each choice', 'Checkout with shipping priced by address through Jubelio, a map pin for Gojek and Grab, and payment through Xendit (QRIS, bank transfer and e-wallets)', 'Flora, an AI chat assistant that suggests bouquets by occasion in Indonesian or English and hands over to WhatsApp', 'In Indonesian and English (TranslatePress), on WordPress, WooCommerce and Elementor'] },
  { key: 'orthobone', title: 'Orthobone', date: 'live', industry: 'Orthopedic mattresses', stack: 'WordPress · WooCommerce · Elementor · PHP · HTML · CSS', url: 'https://orthobone.store/', hue: 46,
    description: 'An online store for orthopedic mattresses and toppers, on WooCommerce and Elementor: a catalogue where every bed shows its firmness and height, then cart, account and checkout.',
    did: ['A catalogue of 19 mattresses and toppers in eight types (orthopedic, orthopedic latex, latex, high density, bonnel and pocket spring beds, toppers, trifold), every bed showing its firmness and height', 'Sizes picked on the product page, from 90 x 200 to 200 x 200 cm, the price following the size', 'Checkout paid through Midtrans: QRIS, e-wallets, virtual accounts and e-banking, confirmed automatically', 'Shipping priced by address through Jubelio, with a map pin for Gojek and Grab couriers, and abandoned-cart recovery', 'Customer accounts, an FAQ and WhatsApp chat, on WordPress, WooCommerce and Elementor'] },
  { key: 'fls-group-indonesia', title: 'FLS Group Indonesia', date: 'live', year: 2026, industry: 'Feng shui decor & lighting', stack: 'WordPress · WooCommerce · Elementor · PHP · HTML · CSS', url: 'https://flsgroupindonesia.com/', hue: 42,
    description: 'An online store on WooCommerce for feng shui porcelain, Chinese cultural art, wall decor and decorative LED lamps: catalogue, cart and checkout.',
    did: ['A catalogue of over 1,700 products under six brands: feng shui porcelain, Chinese cultural art, wall decor, LED lamps, LED lighting and Ankay home living', 'Ready to ship or pre-order marked on every product, with the shop filtered by status and price', 'Product pages with specs and the pre-order wait, some with the feng shui meaning of the piece and where to place it', 'A shop built for phones: bottom navigation, search, quick view, favourites and sharing', 'Checkout by bank transfer, the shipping (JNE, J&T, SiCepat or cargo) confirmed on WhatsApp first, on WordPress, WooCommerce and Elementor'] },
  { key: 'winfaith', title: 'PT. Winfaith Indonesia', date: 'live', industry: 'Plastic injection moulding', stack: 'SvelteKit · Tailwind · GSAP · Three.js', url: 'https://winfaith.co.id/', hue: 14,
    description: 'Company site for a plastic injection moulding manufacturer (components for footwear, bags and more), built as a custom application instead of on a CMS: SvelteKit and Tailwind, GSAP motion and Three.js, with the product catalogue served from the company\'s own API.',
    did: ['A custom SvelteKit application instead of a CMS','The product catalogue served from the company’s own API','GSAP motion and Three.js','Tailwind for the interface'] },
  { key: 'dams-garage', title: 'Dams Garage', date: 'live', industry: 'Premium car care', stack: 'WordPress · PHP · Elementor · Custom CSS', url: 'https://damsgarage.id/', hue: 28,
    description: 'Company profile for an auto detailing, coating and premium car wash specialist in South Tangerang. WordPress and Elementor, with custom CSS on top.',
    did: ['Five services, each with what it includes: premium car wash, detailing, rust protection, ceramic coating and PPF', 'A price list for every package', 'Each Book Now opens WhatsApp with the service already named in the message', 'A gallery of finished cars, customer reviews and the Google rating', 'WordPress and Elementor, with custom CSS on top'] },
  { key: 'yukti-rasa-mitrabumi', title: 'PT. Yukti Rasa Mitrabumi', date: 'live', industry: 'Flavour & fragrance', stack: 'WordPress · PHP', url: 'https://yrm.co.id/', hue: 52,
    description: 'Company profile for a flavour and fragrance manufacturer, on WordPress.',
    did: ['Three product lines, each with its own page: flavors, fragrances and HoReCa', 'Seven flavor applications, each with its own page: oils and fats, dairy, bakery, beverages, confectionery, savory and pharma', 'A catalogue download form that first asks for a name, an email, and a company or university', 'A contact form, the head office address and a Google Maps link', 'WordPress and Elementor'] },
  { key: 'nf-optical', title: 'NF Optical', date: 'live', industry: 'Optician', stack: 'WordPress · PHP · Custom UI', url: 'https://nfopticalofficial.com/', hue: 40,
    description: 'Site for an optician in Citra Indah City, Jonggol: frames and lenses, BPJS and insurance claims, a comfort guarantee and a consultation form, on WordPress with a custom interface.',
    did: ['Four pages written for local search: home, progressive lenses, BPJS glasses and about, each with its own FAQ and structured data', 'A step-by-step BPJS and insurance claim guide, so customers come prepared', 'A guide to progressive lenses, compared with reading and bifocal lenses', 'A consultation form behind every Konsultasi button, next to the store\'s map link and phone number', 'A custom interface instead of a stock theme: hand-written HTML and CSS on WordPress'] },
  // the third site for PT. Gajah Terbang Kreatif, for the digital marketing agency it founded in 2024 (Navy, 2026-10-14); its
  // pictures are uploaded under 2026/10, the month it went up. `company` names the company's first site: the three pages point at
  // one another
  { key: 'godtive', title: 'Godtive', date: 'live', year: 2026, industry: 'Digital marketing agency', stack: 'WordPress · Elementor', url: 'https://godtive.id/', hue: 258, company: 'gajah-terbang-kreatif',
    description: 'The third site I built for PT. Gajah Terbang Kreatif, for Godtive, the digital marketing agency it founded in 2024: its five services, each with a page of its own (social media management, performance marketing, website development, e-commerce management, product photo and video), case studies of real clients, the agency\'s story and a WhatsApp line to start, on WordPress and Elementor.',
    did: ['A page for each of the five services', 'Case studies: Warteg Online, Apnea Journey and Orthobone Mattress', 'The agency\'s story from 2024 to today, and its testimonies', 'WordPress and Elementor, so the team edits its own pages'] },
  { key: 'godjah-studio', title: 'Godjah Studio', date: 'live', industry: 'Creative agency', stack: 'Next.js · custom build', url: 'https://gajahterbangkreatif.id/', hue: 262,
    description: 'The second site I built for PT. Gajah Terbang Kreatif, when the company asked for an upgrade with 3D and interactive design: its WordPress site rebuilt from scratch in Next.js, one studio presenting its three brands (Godjah for photo and video, Godtive for social media, Godweb for websites), with a motion-led intro and a four-step way to start a project.',
    did: ['Rebuilt from WordPress into a custom Next.js site','One studio, three brands: Godjah for photo and video, Godtive for social media, Godweb for websites','A motion-led intro','A four-step way to start a project'] },
  { key: 'gajah-terbang-kreatif', title: 'PT. Gajah Terbang Kreatif', date: 'previous design', industry: 'Creative ecosystem', stack: 'WordPress · PHP · Creative theme', url: 'https://gajahterbangkreatif.id/', hue: 34,
    // the same company appears twice on purpose: both of its sites are Navy's, this one first (Navy, 2026-10-11)
    description: 'The first site I built for the company behind GodPlan ERP: a WordPress company profile anyone can open, beside the internal platform. The company later asked for an upgrade with 3D and interactive design, and its address now serves that second version, Godjah Studio.',
    did: ['One company, three brands: Godjah for product photo and video, Godtive for social media, Godweb for websites, opened from a menu of their logos', 'A page and a portfolio for each brand', 'The company\'s story since 2020, with its vision and mission', 'A blog of articles on product photos, video and content, and a download area for client project files', 'WhatsApp buttons with the question already written, and a floating chat button'] },
  { key: 'gracia-box', title: 'Gracia Box', date: 'live', industry: 'Custom packaging', stack: 'WordPress · PHP', url: 'https://graciabox.id/', hue: 18,
    description: 'Company profile for a maker of custom premium hardboxes, the packaging brands put their products in: designs, process and a WhatsApp line, on WordPress.',
    did: ['A 3D carousel of ten box designs, each an interactive model you can turn, loaded only when its slide is showing', 'A floating WhatsApp button with two admins: one for retail, one for custom orders', 'The company story, the factory and both branches, each with its own map', 'An FAQ and the terms and conditions on one page', 'WordPress and Elementor'] },
  // RameinAja has since rebranded as Reparty Indonesia (Navy, 2026-10-09): `now` names the business as it is today, and the page links
  // there as "today", never as something built here; rameinaja.com itself has expired
  { key: 'rameinaja', title: 'RameinAja', date: 'live', industry: 'Events & nightlife', stack: 'WordPress · PHP', url: 'https://rameinaja.com/', hue: 26,
    now: { name: 'Reparty Indonesia', url: 'https://www.reparty.co.id/' },
    description: 'Site for an events platform: which venues are busy, which events are on and who is going, with the next big event front and centre, on WordPress. RameinAja is now Reparty Indonesia, an app for finding, hosting and joining parties across Indonesia.',
    did: ['Three listings, each its own content type: Socials (meet-ups), Events and Crowds (venues)', 'A page for each venue: capacity, how many women and men, how busy it is, the address, and a WhatsApp button that names the venue in the message', 'Meet-up cards with the host, date, start time and group size, over several pages', 'Swipeable rows of events and top spots on the home page, with headline counts', 'A four-step guide for hosts: chat the admin, fill in the criteria, the meet is posted, the party fills up'] },
  { key: 'recon', title: 'Recon', date: 'live', industry: 'Property & construction', stack: 'WordPress · Elementor · PHP', url: 'https://reconstruction.id/', hue: 38,
    description: 'A property platform on WordPress: homes, shophouses, boarding houses, offices, warehouses and land, for sale and for rent, each listing with its details, with construction services alongside.',
    did: ['Listings for rent and for sale, sorted by city and property type, with a menu that counts what each city has', 'A page for each listing: photo gallery, land and building size, building age, full address and room types', 'A WhatsApp button on each listing, with the property\'s name and ID already in the message', 'Construction alongside: a page each for building, renovation and material supply', 'Listings as their own post types in WordPress, sorted by location, with the pages in Elementor'] },
  { key: 'airon', title: 'Airon', date: 'live', industry: 'AC service & installation', stack: 'WordPress · PHP · Modern UI', url: 'https://airon.site/', hue: 30,
    description: 'Site for an air-conditioning service: cleaning, repairs and installation, on WordPress with a modern interface.',
    did: ['Services with their starting prices: AC cleaning, unit installation, and freon top-up and refill', 'The offer up front: free transport and AC check, and a three-month warranty', 'A floating WhatsApp button, and a WhatsApp call in the \'why Airon\' section', 'WordPress with a modern interface'] },
  { key: 'izzi', title: 'Izzi', date: 'live', industry: 'Residential property', stack: 'WordPress · Elementor · PHP', url: 'https://izzi-bsd.com/', hue: 56,
    description: 'Site for IZZI BSD City, a housing development in West BSD: the two house types with their sizes and plans, the location and its access, and a WhatsApp line to ask, on WordPress and Elementor.',
    did: ['The two house types, Tipe 5 and Tipe 6, each with its land and building size, its rooms and a photo slider', 'Each type\'s brochure requested on WhatsApp, the message already written', 'The location: nearby toll roads, international schools and malls, and a map that opens Google Maps', 'A call to book a show-unit visit on WhatsApp, over a video background', 'One page on WordPress and Elementor'] },
  { key: 'little-aivy', title: 'Little Aivy', date: 'live', year: 2026, industry: 'Kids\' dress rental', stack: 'WordPress · Elementor', url: 'https://littleaivy.com/', hue: 8,
    description: 'A rental catalogue for premium children\'s party dresses, on WordPress and Elementor: the collection, the terms, and a WhatsApp button to book.',
    did: ['A one-page site: the dresses, why renting makes sense, and how every dress is cleaned and delivered', 'A featured catalogue and a carousel of the collection', 'View Catalog opens the full rental catalogue on Etalasy, where a dress is picked by rental dates, size and age', 'Chat Admin buttons and a floating WhatsApp button to book', 'WordPress and Elementor'] },
  { key: 'fortunarack', title: 'Fortunarack', date: 'live', year: 2026, industry: 'Server & network racks', stack: 'WordPress · Elementor', url: 'https://new.fortunarack.co.id/', hue: 210,
    description: 'Company site for a maker of indoor and outdoor cabinets for server, networking, telecom and power infrastructure, with a product catalogue, on WordPress and Elementor.',
    did: ['A catalogue of 48 products in four families: indoor cabinets, outdoor cabinets, cabinet accessories, and PDU, IP-PDU and power monitoring', 'Every product page with its specs and a PDF brochure, the cabinets with a table of models and sizes', 'A project references page, the clients grouped by industry, from banking to government', 'Pages for the company, its warranty and quality testing, and contact by WhatsApp and email', 'WordPress and Elementor, the products kept as a custom post type with their own categories'] },
  // (the year a site was built is known for the 2026 ones only, Navy 2026-10-12; the rest stay "live" until he digs up the dates)
  { key: 'the-bedji-group', title: 'The Bedji Group', date: 'live', year: 2026, industry: 'Tourism & hospitality', stack: 'WordPress · Elementor', url: 'https://whiteriver.id/', hue: 152,
    description: 'Company site for The Bedji Group, three businesses on one stretch of the Jatiluwih rice terraces in Bali: river tubing with Bali Waterfun, The Bedji Restaurant, and melukat, the Balinese purification ritual, at Beji Kedatuan Raksa Sidhi. Activities, a travel blog and booking by WhatsApp, on WordPress and Elementor at whiteriver.id.',
    did: ['A page for each of the three business units: Bali Waterfun, The Bedji Restaurant and Beji Kedatuan Raksa Sidhi', 'Activities and reservations, each with its own WhatsApp line', 'A travel blog: guides and tips from Jatiluwih', 'WordPress and Elementor, so the team edits its own pages'] },
  // five more client sites from Navy's list (2026-10-14), all WordPress and Elementor, built from April to June 2026 (the months
  // of their first uploads); Ur Branded Bae is told as what its page says it is, a reseller programme sourced from the factory
  { key: 'rathera-beauty-studio', title: 'Rathera Beauty Studio', date: 'live', year: 2026, industry: 'Nails, lashes & waxing', stack: 'WordPress · Elementor', url: 'https://ratherabeautystudio.com/', hue: 340,
    description: 'Site for Rathera Beauty Studio, a nail, eyelash and waxing studio in Ciputat: its three services, client testimonials, the studio on a map and booking by WhatsApp, all on one page, on WordPress and Elementor.',
    did: ['One page in three parts, About, Service and Location, each a link in the menu', 'The three services: nails and pedicure, lashes, waxing', 'Client testimonials, and six reasons to choose the studio', 'The studio on an embedded map, with a link to open it in Google Maps', 'Booking by WhatsApp: three steps to an appointment, and WhatsApp in the header, the footer and a floating button'] },
  { key: 'kusen-tangsel', title: 'Kusen Tangsel', date: 'live', year: 2026, industry: 'Aluminium doors & windows', stack: 'WordPress · Elementor', url: 'https://kusentangsel.com/', hue: 28,
    description: 'Site for Kusen Tangsel, the aluminium and glass workshop of Gita Makmur Aluminium in Ciputat Timur, South Tangerang: doors, windows, kitchen sets and tempered glass, each line with a page of its variants, plus a project gallery, customer reviews and a WhatsApp line, on WordPress and Elementor.',
    did: ['A page for each of nine product lines: five kinds of door, windows, sliding windows, kitchen sets and tempered glass doors', 'Each product page lays out its variants, such as glass, sprandel and ACP door panels, or four families of HPL finish', 'A home page with the services, a project gallery and customer reviews in a carousel', 'The workshop on an embedded map, and a WhatsApp button on every page', 'WordPress and Elementor, so the team edits its own pages'] },
  { key: 'ur-branded-bae', title: 'Ur Branded Bae', date: 'live', year: 2026, industry: 'Bag reseller programme', stack: 'WordPress · Elementor', url: 'https://ubbonlinepartners.id/', hue: 320,
    description: 'Site for Ur Branded Bae, a reseller programme for bags, wallets and accessories sourced straight from the factory: why to join, four steps to start, how products are checked and what resellers say, on one page, on WordPress and Elementor.',
    did: ['One page for a reseller programme: bags, wallets and accessories sourced straight from the factory', 'Six reasons to join, among them an e-catalogue of product photos and videos ready to post, free business coaching and a dropship option', 'Four steps to become a reseller, from free sign-up to coaching', 'How each product is checked before it enters the catalogue (stitching, hardware, leather), and stories from resellers', 'WordPress and Elementor, so the team edits its own pages'] },
  { key: 'duta-mesh', title: 'CV. Duta Mesh', date: 'live', year: 2026, industry: 'Steel & BRC fencing', stack: 'WordPress · Elementor', url: 'https://dutamesh.com/', hue: 228,
    description: 'Site for CV. Duta Mesh, a supplier of BRC fencing and construction steel in Serpong, South Tangerang: a page for each of its thirteen products, with specification tables and buying notes, and WhatsApp lines to its two sales contacts, on WordPress and Elementor.',
    did: ['A page for each of thirteen products, from BRC fencing and razor wire to WF and H-beam steel', 'Specification tables on the product pages: BRC panel sizes with their posts, H-beam weights per 12 m', 'Buying notes on the BRC page: an installation guide, delivery, and how hot-dip galvanising works', 'WhatsApp everywhere: every consult button opens a chat with the message already written, and a floating chat reaches either of the two sales contacts', 'An about page, and a contact page with a message form and a map'] },
  { key: 'nudelisius', title: 'Nudelisius', date: 'live', year: 2026, industry: 'Noodle brand & partnerships', stack: 'WordPress · Elementor', url: 'https://nudelisius.com/', hue: 78,
    description: 'Site for Nudelisius, a noodle brand looking for business partners: its menu in three tiers, the ways to partner (new outlets, event booths, food festivals, franchise), and catering for events with its outlet formats and terms, on WordPress and Elementor.',
    did: ['The menu concept in three tiers, Santai, Mantap and Sultan, each with its example dishes', 'A partnership page: new outlets, booths at corporate events, food festivals, franchise and licensing', 'The brand laid out for partners: vision and mission, target market, likely locations and brand values', 'An events page for weddings, office events and parties, its cards hand-coded in HTML and CSS', 'Three outlet formats with their sizes, how to book, and the terms of purchase, complaints and refunds'] },
];

// The who-I-am worlds (04–09) need a record to live in; they stay out of the project list, the timeline and the monitor.
// Real screenshots of the live sites, desktop and phone (public/shots/<key>.webp and <key>-m.webp, captured 2 Oct 2026). The project
// page shows them in a browser frame; projects without one keep their generated card.
// More screenshots per project, from Navy (public/shots/gallery/<key>-<n>.webp, n from 1): the project page shows them in its browser
// frame with a row of thumbnails under it; GALLERY_PHONE is a phone screenshot for a project without a live one (GodPlan is internal)
export const GALLERY = { 'the-bedji-group': 4, 'duta-mesh': 3, 'kusen-tangsel': 3, nudelisius: 3, godtive: 4, 'godjah-studio': 4, 'godplan-erp': 1, 'client-websites': 6, winfaith: 5, 'flora-indonesia': 3, 'miniatur-kapal': 3, 'dams-garage': 3, 'yukti-rasa-mitrabumi': 3, 'nf-optical': 3, 'gajah-terbang-kreatif': 4, 'gracia-box': 3, orthobone: 2, rameinaja: 1, recon: 3, airon: 3, izzi: 3 };
export const GALLERY_PHONE = { 'godplan-erp': 'shots/gallery/godplan-erp-m.webp', 'client-websites': 'shots/little-aivy-m.webp' };
// what the browser frame's address bar says for a project with no single address of its own
export const SHOT_HOST = { 'client-websites': 'twenty-three live sites' };
export const SHOTS = ['the-bedji-group', 'godtive', 'rathera-beauty-studio', 'kusen-tangsel', 'ur-branded-bae', 'duta-mesh', 'nudelisius', 'winfaith', 'flora-indonesia', 'dams-garage', 'yukti-rasa-mitrabumi', 'nf-optical', 'gracia-box', 'orthobone', 'recon', 'izzi', 'little-aivy', 'fortunarack', 'fls-group-indonesia'];

// The keyboard read as a story, in the order it happened. Each stop is a place on the board (its target id), when it was, and a
// line or two; the bookmark key (or T) walks it, and the keys between two stops light up as if the story were being typed.
// Every line comes from the facts above: nothing here is new.
export const STORY = [
  { at: 'keyboard', when: '2022 to now', title: 'The story so far', body: 'Everything on this keyboard is something I built or somewhere I worked, laid out like a model of a small town. Here it is in the order it happened.' },
  { at: 'o', when: '2022 to 2026', title: 'Campus', body: 'Informatics at Universitas Multimedia Nusantara, August 2022 to graduation in 2026, and two years as a teaching assistant for Object-Oriented Programming.' },
  { at: 'x', when: '2023 to 2024', title: 'Early days', body: 'Field work first: smart TVs carried up the stairs at Pertamina Simprug with a crew of four, then 341 laptops re-imaged in two days for a BNI procurement.' },
  { at: 'lab', when: 'January to June 2025', title: 'JAKASN', body: 'Full-stack developer intern at BKN: JAKASN, a journal platform for the civil service on Open Journal Systems, in PHP and MySQL.' },
  { at: 'signal', when: 'since July 2025', title: 'GodPlan ERP', body: 'At PT. Gajah Terbang Kreatif, where I built GodPlan ERP: one system for employees, attendance, payroll and CRM, in Go and Next.js.' },
  { at: 'market', when: 'live today', title: 'Client websites', body: 'Twenty-three live websites for Indonesian businesses. Every shop on this street is a real client, and the lot at the top is still free.' },
  { at: 'f8', when: 'the long view', title: 'Career', body: 'From freelance technician to building an ERP, one camp at a time. The next camp is not on the map yet.' },
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

// Facts shown while switching scenes: keyboard trivia (the site's own voice) in turns with a line about Navy, so the wait
// between scenes also says who this desk belongs to. Every Navy line restates a fact from SITE or PATH; nothing here is new.
const KEY_FACTS = [
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
export const NAVY_FACTS = [
  'Twenty-three live websites for Indonesian businesses, in more than ten industries. None of them is a mockup.',
  'Open to freelance and full-time work. The quickest way to reach Navy is WhatsApp; email works too.',
  'GodPlan ERP: employees, attendance, payroll, tasks and CRM in one system, in Go and Next.js, built by Navy at PT. Gajah Terbang Kreatif.',
  'Informatics at Universitas Multimedia Nusantara, graduated 2026 with a GPA of 3.71 out of 4.00.',
  'Two years as teaching assistant for Object-Oriented Programming: design patterns, SOLID, and the logic behind them.',
  'Full-stack developer intern at BKN in 2025: JAKASN, a journal platform for the civil service, in PHP and MySQL.',
  'Before the code: smart TVs carried up the stairs at Pertamina Simprug, and 341 laptops re-imaged in two days.',
  'Go, Next.js, TypeScript, PostgreSQL, WordPress and WooCommerce: the stack behind everything on this desk.',
  'Open to new projects. WhatsApp is the fastest way to reach Navy; a written scope comes back before anything starts.',
];
export const FACTS = KEY_FACTS.flatMap((f, i) => (NAVY_FACTS[i] ? [NAVY_FACTS[i], f] : [f]));

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
  // the cat (app/cat): asleep on the desk chair; click her and she wakes and goes to her bowl, click the bowl and she comes to eat
  cat: { kind: 'cat', hint: 'Tupac the cat · wake up', label: { title: 'Tupac', sub: 'my cat, asleep on my chair' }, discover: 'Tupac' },
  catbowl: { kind: 'catbowl', hint: "Tupac's bowl · fill it" },
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
export const DISCOVERY_ORDER = ['signal', 'market', 'lab', 'o', 'x', 'rbr', 'f8', 'enter', 'note', 'mechbay', 'mech', 'sapling', 'stairs', 'plaza', 'garden', 'secret', 'mouse', 'notebook', 'mandarin', 'model', 'plant', 'watches', 'katana', 'pullup', 'satoshi', 'chair', 'bike', 'medals', 'pc', 'monitor', 'lamp', 'clock', 'mug', 'keyboard', 'esc', 'art4', 'cat'];

// The seven rooms of the project gallery, in corridor order (mirrors worlds 01–07). `project` links a room to a built world; the rest are curated exhibits only.
export const ROOMS = WORLDS.slice(0, 7).map((w) => ({ id: w.key, num: w.num, title: w.title, sub: w.sub, project: w.tier === 'world' ? w.project : null, note: w.tier === 'world' ? undefined : w.tagline }));
export const DISCOVERY_TOTAL = DISCOVERY_ORDER.length;
// The counter's three groups, by where to look, so a visitor knows what is left and roughly where. Every DISCOVERY_ORDER id
// belongs to exactly one; the HUD files any id missing here under the desk.
export const DISCOVERY_GROUPS = [
  { id: 'keys', label: 'keys', title: 'On the keyboard', hint: 'keys that look different, and the tiny worlds built into them', ids: ['signal', 'market', 'lab', 'o', 'x', 'rbr', 'f8', 'enter', 'mechbay', 'mech', 'sapling', 'stairs', 'plaza', 'garden', 'secret', 'keyboard', 'esc', 'art4'] },
  { id: 'desk', label: 'desk', title: 'On the desk', hint: 'the screens, the lamp and everything lying around the keyboard', ids: ['monitor', 'note', 'lamp', 'clock', 'mouse', 'mug', 'notebook', 'mandarin', 'model', 'plant', 'watches', 'pc'] },
  { id: 'room', label: 'room', title: 'Around the room', hint: 'the walls, the corners and the chair you would sit in', ids: ['chair', 'cat', 'katana', 'pullup', 'satoshi', 'bike', 'medals'] },
];


export const MENU = [
  { id: 'about', label: 'About', target: 'note' },
  { id: 'projects', label: 'Projects', target: 'monitor' },
  { id: 'story', label: 'Story', target: 'story', key: 'T' },
  { id: 'skills', label: 'Skills', target: 'lamp' },
  { id: 'index', label: 'Index', target: 'clock' },
  { id: 'contact', label: 'Contact', target: 'mouse' },
  { id: 'portfolio', label: 'Portfolio ↗', href: '/', key: 'exit' },   // out of the desk, to the plain portfolio
];
