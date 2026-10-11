// Project copy in Indonesian and Chinese: what data.js says in English, said again per project (description, what was done, role,
// modules, the no-picture note, the industry) and per world (the notes the 3D hotspots carry, shown on the project page as
// "Inside the project"). A field that is missing here falls back to the English in data.js. The case studies (STORY) are drafts
// written from the facts on hand, for Navy to correct; nothing in them is a number he did not give.

export const PROJECTS_T = {
  id: {
    'godplan-erp': { industry: 'HR & tenaga kerja', role: 'Arsitektur dan pengembangan full-stack',
      description: 'Satu sistem untuk bagian-bagian menjalankan perusahaan yang biasanya tercecer di empat aplikasi dan satu spreadsheet: karyawan, absensi dan cuti, penggajian, tugas dan CRM. Arsitektur dan pengembangan full-stack di PT. Gajah Terbang Kreatif, dibangun untuk ponsel juga.',
      did: ['Arsitekturnya: layanan Go di atas PostgreSQL, front end Next.js dan TypeScript, dirilis dengan Docker', 'Autentikasi dan modul karyawan, dengan jumlah karyawan yang ditarik ke dashboard', 'Dashboard: jumlah karyawan, absensi hari ini, tugas tertunda dan penggajian bulanan dalam satu layar', 'Kesehatan sistem (status database, penyimpanan, backup) ditampilkan di antarmuka, bukan terkubur di server', 'Dibangun untuk ponsel juga'],
      modules: ['Dashboard', 'Karyawan', 'Absensi & cuti', 'Penggajian', 'Tugas', 'CRM', 'Kesehatan sistem'] },
    'client-websites': { industry: '10+ industri', description: 'Tujuh belas website live untuk bisnis Indonesia: sebelas situs WordPress, empat toko WooCommerce dan dua aplikasi custom, dengan SvelteKit dan Next.js. Tidak ada satu pun yang mockup: semuanya tercantum di bawah, masing-masing dengan halamannya sendiri.' },
    jakasn: { industry: 'Pemerintahan (GovTech)', role: 'Full-stack developer intern',
      description: 'Platform jurnal untuk Pusbangpeg ASN BKN yang mengintegrasikan Open Journal Systems dengan antarmuka yang didesain ulang, demi aksesibilitas dan identitas institusi. Front end dengan HTML, CSS dan JavaScript; integrasi back end dengan PHP dan MySQL. Proyek magang pertama saya, sebagai full-stack developer intern.',
      did: ['Open Journal Systems diintegrasikan di balik antarmuka yang didesain ulang', 'Front end dengan HTML, CSS dan JavaScript, disesuaikan dengan identitas dan aksesibilitas institusi', 'Integrasi back end dengan PHP dan MySQL', 'Pekerjaan lintas sistem BKN: OJS, JAKASN dan BKNPEDIA'],
      noShot: { tag: 'Maaf, tidak ada gambar', line: 'Proyek magang pertama saya, dibangun sebelum saya terbiasa menyimpan tangkapan layar karya sendiri. Tidak ada satu gambar pun yang tersisa; platformnya tetap ada.' } },
    'miniatur-kapal': { industry: 'Miniatur kapal buatan tangan', description: 'Toko online untuk miniatur kapal eksklusif, untuk kolektor dan dekorasi: toko, keranjang, checkout dan akun pelanggan di WooCommerce.', did: ['Toko WooCommerce untuk miniatur kapal buatan tangan', 'Toko, keranjang, checkout dan akun pelanggan'] },
    'flora-indonesia': { industry: 'E-commerce premium', description: 'Flora Indonesia, florist online milik PT. Rumindo Pertiwi Wardhana dari Bogor, di WooCommerce: papan bunga, buket, bloom box dan standing flower, dengan checkout, integrasi pembayaran dan logistik pengiriman sebagai bagian dari bangunan.', did: ['Katalog dan keranjang di WooCommerce', 'Integrasi pembayaran', 'Logistik pengiriman, bagian dari bangunan, bukan tambahan belakangan'] },
    orthobone: { industry: 'Kasur ortopedi', description: 'Toko online kasur dan topper ortopedi, di WooCommerce dan Elementor: katalog yang menampilkan tingkat kekerasan dan tinggi setiap kasur, lalu keranjang, akun dan checkout.', did: ['Katalog yang menampilkan tingkat kekerasan dan tinggi setiap kasur', 'Keranjang, akun dan checkout', 'Elementor, supaya toko bisa mengedit halamannya sendiri'] },
    'fls-group-indonesia': { industry: 'Dekorasi feng shui & lampu', description: 'Toko online di WooCommerce untuk porselen feng shui, seni budaya Tionghoa, dekorasi dinding dan lampu LED dekoratif: katalog, keranjang dan checkout.', did: ['Katalog: porselen feng shui, seni budaya Tionghoa, dekorasi dinding dan lampu LED', 'Keranjang dan checkout di WooCommerce', 'Elementor untuk pengeditan oleh klien sendiri'] },
    winfaith: { industry: 'Injection moulding plastik', description: 'Situs perusahaan untuk pabrik injection moulding plastik (komponen untuk alas kaki, tas dan lainnya), dibangun sebagai aplikasi custom, bukan di atas CMS: SvelteKit dan Tailwind, motion GSAP dan Three.js, dengan katalog produk yang disajikan dari API milik perusahaan sendiri.', did: ['Aplikasi SvelteKit custom, bukan CMS', 'Katalog produk yang disajikan dari API milik perusahaan sendiri', 'Motion GSAP dan Three.js', 'Tailwind untuk antarmukanya'] },
    'dams-garage': { industry: 'Perawatan mobil premium', description: 'Company profile untuk spesialis auto detailing, coating dan cuci mobil premium di Tangerang Selatan. WordPress dan Elementor, dengan CSS custom di atasnya.', did: ['Company profile WordPress', 'Halaman Elementor dengan CSS custom di atasnya'] },
    'yukti-rasa-mitrabumi': { industry: 'Perisa & pewangi', description: 'Company profile untuk produsen perisa dan pewangi, di WordPress.' },
    'nf-optical': { industry: 'Optik', description: 'Situs untuk optik di Citra Indah City, Jonggol: frame dan lensa, klaim BPJS dan asuransi, jaminan kenyamanan dan formulir konsultasi, di WordPress dengan antarmuka custom.', did: ['Company profile WordPress', 'Antarmuka custom, bukan tema bawaan'] },
    'godjah-studio': { industry: 'Agensi kreatif', description: 'Situs kedua yang saya bangun untuk PT. Gajah Terbang Kreatif, ketika perusahaan meminta versi baru dengan 3D dan desain interaktif: situs WordPress-nya dibangun ulang dari nol dengan Next.js, satu studio yang menampilkan tiga brand-nya (Godjah untuk foto dan video, Godtive untuk media sosial, Godweb untuk website), dengan intro bermotion dan empat langkah untuk memulai proyek.', did: ['Dibangun ulang dari WordPress menjadi situs Next.js custom', 'Satu studio, tiga brand: Godjah untuk foto dan video, Godtive untuk media sosial, Godweb untuk website', 'Intro yang digerakkan motion', 'Empat langkah untuk memulai proyek'] },
    'gajah-terbang-kreatif': { industry: 'Ekosistem kreatif', description: 'Situs pertama yang saya bangun untuk perusahaan di balik GodPlan ERP: company profile WordPress yang bisa dibuka siapa saja, di samping platform internalnya. Perusahaan kemudian meminta versi baru dengan 3D dan desain interaktif, dan alamatnya kini melayani versi kedua itu, Godjah Studio.' },
    'gracia-box': { industry: 'Kemasan custom', description: 'Company profile untuk pembuat hardbox premium custom, kemasan tempat brand menaruh produknya: desain, proses dan jalur WhatsApp, di WordPress.' },
    rameinaja: { industry: 'Event & hiburan malam', description: 'Situs untuk platform event: venue mana yang ramai, event apa yang sedang berlangsung dan siapa yang datang, dengan event besar berikutnya di depan, di WordPress. RameinAja kini menjadi Reparty Indonesia, aplikasi untuk mencari, mengadakan dan mengikuti pesta di seluruh Indonesia.' },
    recon: { industry: 'Properti & konstruksi', description: 'Platform properti di WordPress: rumah, ruko, kos, kantor, gudang dan tanah, dijual dan disewakan, setiap listing dengan detailnya, ditambah jasa konstruksi.' },
    airon: { industry: 'Servis & pemasangan AC', description: 'Situs untuk jasa AC: cuci, perbaikan dan pemasangan, di WordPress dengan antarmuka modern.', did: ['Halaman layanan: cuci, perbaikan dan pemasangan', 'WordPress dengan antarmuka modern'] },
    izzi: { industry: 'Properti hunian', description: 'Situs untuk IZZI BSD City, perumahan di BSD Barat: dua tipe rumah dengan ukuran dan denahnya, lokasi dan aksesnya, serta jalur WhatsApp untuk bertanya, di WordPress dan Elementor.' },
    'little-aivy': { industry: 'Sewa gaun anak', description: 'Katalog sewa gaun pesta anak premium, di WordPress dan Elementor: koleksinya, ketentuannya, dan tombol WhatsApp untuk memesan.', did: ['Koleksi dan ketentuan sewa', 'Tombol WhatsApp untuk memesan', 'WordPress dan Elementor'] },
    fortunarack: { industry: 'Rak server & jaringan', description: 'Situs perusahaan untuk pembuat kabinet indoor dan outdoor untuk infrastruktur server, jaringan, telekomunikasi dan daya, dengan katalog produk, di WordPress dan Elementor.', did: ['Katalog produk kabinet indoor dan outdoor', 'WordPress dan Elementor'] },
    'the-bedji-group': { industry: 'Pariwisata & hospitality', description: 'Situs perusahaan untuk The Bedji Group, tiga usaha di satu kawasan sawah terasering Jatiluwih, Bali: river tubing bersama Bali Waterfun, The Bedji Restaurant, dan melukat, ritual penyucian diri Bali, di Beji Kedatuan Raksa Sidhi. Aktivitas, blog perjalanan dan pemesanan lewat WhatsApp, di WordPress dan Elementor di whiteriver.id.', did: ['Satu halaman untuk setiap unit usaha: Bali Waterfun, The Bedji Restaurant dan Beji Kedatuan Raksa Sidhi', 'Aktivitas dan reservasi, masing-masing dengan jalur WhatsApp-nya sendiri', 'Blog perjalanan: panduan dan tips dari Jatiluwih', 'WordPress dan Elementor, supaya tim bisa mengedit halamannya sendiri'] },
  },
  zh: {
    'godplan-erp': { industry: '人力资源与人员管理', role: '架构与全栈开发',
      description: '一套系统，装下公司运营中通常散落在四个工具加一张表格里的那些事：员工、考勤与请假、薪资、任务和 CRM。在 PT. Gajah Terbang Kreatif 完成架构与全栈开发，手机端同样可用。',
      did: ['架构：PostgreSQL 之上的 Go 服务，Next.js 和 TypeScript 前端，用 Docker 发布', '认证和员工模块，员工总数直接汇总到仪表盘', '仪表盘：员工总数、今日考勤、待办任务和当月薪资，一屏看完', '系统健康（数据库状态、存储、备份）直接显示在界面里，而不是埋在服务器上', '手机端同样可用'],
      modules: ['仪表盘', '员工', '考勤与请假', '薪资', '任务', 'CRM', '系统健康'] },
    'client-websites': { industry: '10 余个行业', description: '为印尼企业做的十七个上线网站：十一个 WordPress 站、四个 WooCommerce 商店和两个定制应用（SvelteKit 和 Next.js）。没有一个是样稿：全部列在下方，各有自己的页面。' },
    jakasn: { industry: '政府（GovTech）', role: '全栈开发实习生',
      description: '为 Pusbangpeg ASN BKN 做的期刊平台，把 Open Journal Systems 集成在重新设计的界面之后，兼顾无障碍和机构形象。前端用 HTML、CSS 和 JavaScript；后端集成用 PHP 和 MySQL。我的第一个实习项目，身份是全栈开发实习生。',
      did: ['把 Open Journal Systems 集成在重新设计的界面之后', '用 HTML、CSS 和 JavaScript 做前端，贴合机构形象与无障碍要求', '用 PHP 和 MySQL 做后端集成', '参与 BKN 各系统的工作：OJS、JAKASN 和 BKNPEDIA'],
      noShot: { tag: '抱歉，没有图片', line: '我的第一个实习项目，做它的时候我还没养成给自己的作品截图的习惯。一张图都没留下；平台还在。' } },
    'miniatur-kapal': { industry: '手工船模', description: '一家售卖精品船模的网店，面向收藏者和装饰用途：商店、购物车、结账和客户账户，基于 WooCommerce。', did: ['一家手工船模的 WooCommerce 商店', '商店、购物车、结账和客户账户'] },
    'flora-indonesia': { industry: '高端电商', description: 'Flora Indonesia，PT. Rumindo Pertiwi Wardhana 旗下来自茂物的网上花店，基于 WooCommerce：花牌、花束、花盒和落地花篮，结账、支付集成和配送物流都在同一次开发里。', did: ['WooCommerce 上的目录和购物车', '支付集成', '配送物流，从一开始就是开发的一部分'] },
    orthobone: { industry: '骨科床垫', description: '一家骨科床垫和床褥的网店，基于 WooCommerce 和 Elementor：目录里每张床都标着软硬度和高度，然后是购物车、账户和结账。', did: ['每张床都标着软硬度和高度的目录', '购物车、账户和结账', '用 Elementor，店家之后可以自己改页面'] },
    'fls-group-indonesia': { industry: '风水摆件与灯饰', description: '一家 WooCommerce 网店，售卖风水瓷器、中华文化艺术品、墙饰和装饰 LED 灯：目录、购物车和结账。', did: ['目录：风水瓷器、中华文化艺术品、墙饰和 LED 灯', 'WooCommerce 上的购物车和结账', '用 Elementor，方便客户自行编辑'] },
    winfaith: { industry: '塑料注塑', description: '一家塑料注塑厂（鞋类、箱包等配件）的企业网站，不用 CMS 而是做成定制应用：SvelteKit 和 Tailwind，GSAP 动效和 Three.js，产品目录来自公司自己的 API。', did: ['用 SvelteKit 做定制应用，而不是 CMS', '产品目录来自公司自己的 API', 'GSAP 动效和 Three.js', '界面用 Tailwind'] },
    'dams-garage': { industry: '高端汽车美容', description: '南唐格朗一家汽车美容、镀膜和高端洗车专门店的企业网站。WordPress 和 Elementor，外加定制 CSS。', did: ['WordPress 企业网站', 'Elementor 页面加定制 CSS'] },
    'yukti-rasa-mitrabumi': { industry: '香精与香料', description: '一家香精香料制造商的企业网站，基于 WordPress。' },
    'nf-optical': { industry: '眼镜店', description: 'Jonggol 的 Citra Indah City 一家眼镜店的网站：镜架和镜片、BPJS 与保险理赔、舒适保证和咨询表单，基于 WordPress，界面为定制。', did: ['WordPress 企业网站', '定制界面，而不是现成主题'] },
    'godjah-studio': { industry: '创意机构', description: '我为 PT. Gajah Terbang Kreatif 做的第二个网站，起因是公司希望升级，加入 3D 和交互设计：把原来的 WordPress 网站用 Next.js 从零重建，一个工作室呈现它的三个品牌（Godjah 做照片和视频，Godtive 做社交媒体，Godweb 做网站），加上动效开场和四步启动项目的流程。', did: ['从 WordPress 重建为定制的 Next.js 网站', '一个工作室，三个品牌：Godjah 做照片和视频，Godtive 做社交媒体，Godweb 做网站', '动效开场', '四步启动项目的流程'] },
    'gajah-terbang-kreatif': { industry: '创意生态', description: '我为 GodPlan ERP 背后这家公司做的第一个网站：一个谁都能打开的 WordPress 企业站，与内部平台并行。公司后来希望升级，加入 3D 和交互设计，这个地址现在用于第二版，Godjah Studio。' },
    'gracia-box': { industry: '定制包装', description: '一家定制高端硬盒制造商的企业网站，也就是品牌用来装产品的包装：设计、流程和一条 WhatsApp 联系线，基于 WordPress。' },
    rameinaja: { industry: '活动与夜生活', description: '一个活动平台的网站：哪些场地热闹、哪些活动在办、谁会去，下一场大活动放在最醒目的位置，基于 WordPress。RameinAja 现已更名为 Reparty Indonesia，一个在印尼各地寻找、举办和参加派对的应用。' },
    recon: { industry: '房产与建筑', description: '一个基于 WordPress 的房产平台：住宅、商铺、公寓宿舍、办公室、仓库和土地，出售与出租，每条房源都有详情，另有建筑施工服务。' },
    airon: { industry: '空调维修与安装', description: '一家空调服务商的网站：清洗、维修和安装，基于 WordPress，界面现代。', did: ['服务页面：清洗、维修和安装', '界面现代的 WordPress 站'] },
    izzi: { industry: '住宅地产', description: 'IZZI BSD City 的网站，一个位于 BSD 西区的住宅项目：两种户型及其面积和平面图，位置与交通，以及咨询用的 WhatsApp 联系线，基于 WordPress 和 Elementor。' },
    'little-aivy': { industry: '儿童礼服租赁', description: '高端儿童派对礼服的租赁目录，基于 WordPress 和 Elementor：系列、条款，以及一个用于预订的 WhatsApp 按钮。', did: ['系列与租赁条款', '用于预订的 WhatsApp 按钮', 'WordPress 和 Elementor'] },
    fortunarack: { industry: '服务器与网络机柜', description: '一家服务器、网络、电信和电力基础设施室内外机柜制造商的企业网站，附产品目录，基于 WordPress 和 Elementor。', did: ['室内外机柜的产品目录', 'WordPress 和 Elementor'] },
    'the-bedji-group': { industry: '旅游与接待', description: 'The Bedji Group 的企业网站，巴厘岛 Jatiluwih 梯田上的三家店：Bali Waterfun 的漂流、The Bedji Restaurant 餐厅，以及在 Beji Kedatuan Raksa Sidhi 进行的巴厘净身仪式 melukat。活动、旅行博客和 WhatsApp 预订，基于 WordPress 和 Elementor，域名 whiteriver.id。', did: ['三个业务单元各有一页：Bali Waterfun、The Bedji Restaurant 和 Beji Kedatuan Raksa Sidhi', '活动与预订，各自有自己的 WhatsApp 联系线', '旅行博客：来自 Jatiluwih 的指南和小贴士', 'WordPress 和 Elementor，团队可以自己改页面'] },
  },
};

// the worlds' notes (the 3D hotspots), on the project page as "Inside the project"
export const WORLDS_T = {
  id: {
    'signal-garden': { tagline: 'satu sistem, setiap departemen', hotspots: {
      screen: { title: 'Dashboard', body: 'Jumlah karyawan, absensi hari ini, tugas tertunda dan penggajian bulanan dalam satu layar, dengan jalan pintas ke setiap modul. Setiap sudut lantai ini adalah salah satunya, dan layar ini merespons saat sesuatu terjadi di sana.' },
      desk: { title: 'Karyawan', body: 'Daftar staf (siapa yang bekerja di sini), dengan jumlah karyawan yang ditarik ke dashboard. Salah satu fitur inti yang saya bangun, bersama autentikasi.' },
      papers: { title: 'Penggajian', body: 'Pengeluaran bulanan, ditampilkan di dashboard tepat di samping jumlah karyawan.' },
      lamp: { title: 'CRM', body: 'Dengan siapa perusahaan sedang berbicara: kontaknya, satu jalan pintas dari dashboard.' },
      tower: { title: 'Inti sistem', body: 'Go dan PostgreSQL di balik setiap layar. Kesehatan sistem (status database, penyimpanan, backup) ditampilkan di antarmuka, bukan terkubur di server.' },
      greenhouse: { title: 'Absensi & cuti', body: 'Pencatatan hadir/tidak hadir harian, dirangkum sebagai persentase hari itu, dengan cuti ditangani di sistem yang sama.' } } },
    'market-district': { tagline: 'tujuh belas situs live, tanpa mockup', hotspots: {
      sign: { title: 'Jalan pasar', body: 'Tujuh belas website live untuk bisnis Indonesia: perawatan mobil, manufaktur, florist, optik, kemasan, kasur, properti, event, rak server, dekorasi rumah, sewa gaun anak, petualangan sungai di Bali. Setiap toko di jalan ini adalah klien sungguhan.' },
      shelves: { title: 'Company profile', body: 'Sebelas company profile WordPress yang bisa diserahkan klien ke tim mereka sendiri: Dams Garage, NF Optical, The Bedji Group, Gracia Box, Yukti Rasa Mitrabumi dan lainnya.' },
      counter: { title: 'Kasir', body: 'Empat toko WooCommerce: PT. Rumindo Pertiwi Wardhana, florist Flora Indonesia; Miniatur Kapal, miniatur kapal buatan tangan; FLS Group Indonesia, dekorasi feng shui dan lampu LED; dan Orthobone, kasur ortopedi. Pembayaran dan logistik pengiriman bagian dari bangunan.' },
      crate: { title: 'Di balik toko-toko', body: 'Tema custom bila desainnya menuntut, Elementor bila klien akan mengedit halaman sendiri, dan aplikasi SvelteKit custom ketika CMS bukan alat yang tepat, seperti untuk Winfaith.' } } },
    'tech-lab': { tagline: 'penerbitan digital untuk aparatur sipil', hotspots: {
      monitors: { title: 'Platformnya', body: 'JAKASN: platform jurnal untuk Pusbangpeg ASN BKN, dibangun di atas Open Journal Systems dengan antarmuka yang didesain ulang agar sesuai identitas institusi.' },
      rings: { title: 'Intinya', body: 'Front end dengan HTML, CSS dan JavaScript; integrasi sistem di back end dengan PHP dan MySQL.' },
      diagram: { title: 'Jaringannya', body: 'Pekerjaan lintas sistem skala enterprise BKN (OJS, JAKASN dan BKNPEDIA) dan integrasi lama di antaranya.' },
      device: { title: 'Magangnya', body: 'Full-stack developer intern di Kelompok Kerja Sistem Informasi BKN, Januari sampai Juni 2025.' } } },
  },
  zh: {
    'signal-garden': { tagline: '一套系统，覆盖每个部门', hotspots: {
      screen: { title: '仪表盘', body: '员工总数、今日考勤、待办任务和当月薪资，一屏看完，并有通往每个模块的快捷入口。这层楼的每个角落都是其中一个模块，那里一有动静，屏幕就会响应。' },
      desk: { title: '员工', body: '员工名册（谁在这里工作），员工总数汇总到仪表盘。我做的核心功能之一，和认证一起。' },
      papers: { title: '薪资', body: '每月支出，显示在仪表盘上，就在员工总数旁边。' },
      lamp: { title: 'CRM', body: '公司正在联系的人：联系人列表，离仪表盘只有一步。' },
      tower: { title: '核心', body: '每个界面背后都是 Go 和 PostgreSQL。系统健康（数据库状态、存储、备份）直接显示在界面里，而不是埋在服务器上。' },
      greenhouse: { title: '考勤与请假', body: '每日出勤/缺勤记录，汇总为当天的出勤率，请假在同一个系统里处理。' } } },
    'market-district': { tagline: '十七个上线网站，没有样稿', hotspots: {
      sign: { title: '市场街', body: '为印尼企业做的十七个上线网站：汽车美容、制造业、花店、眼镜、包装、床垫、房产、活动、服务器机柜、家居装饰、儿童礼服租赁、巴厘岛的河上探险。这条街上的每家店都是真实的客户。' },
      shelves: { title: '企业官网', body: '十一个 WordPress 企业站，客户事后可以交给自己的团队维护：Dams Garage、NF Optical、The Bedji Group、Gracia Box、Yukti Rasa Mitrabumi 等。' },
      counter: { title: '收银台', body: '四家 WooCommerce 商店：PT. Rumindo Pertiwi Wardhana 旗下的花店 Flora Indonesia；手工船模 Miniatur Kapal；风水摆件和 LED 灯的 FLS Group Indonesia；以及骨科床垫 Orthobone。支付和配送物流都是开发的一部分。' },
      crate: { title: '店铺背后', body: '设计有要求时用定制主题，客户要自己改页面时用 Elementor，CMS 不合适时用定制的 SvelteKit 应用，比如 Winfaith。' } } },
    'tech-lab': { tagline: '面向公务员体系的数字出版', hotspots: {
      monitors: { title: '平台', body: 'JAKASN：为 Pusbangpeg ASN BKN 做的期刊平台，建在 Open Journal Systems 之上，界面重新设计以贴合机构形象。' },
      rings: { title: '核心', body: '前端用 HTML、CSS 和 JavaScript；后端系统集成用 PHP 和 MySQL。' },
      diagram: { title: '网络', body: '参与 BKN 企业级系统（OJS、JAKASN 和 BKNPEDIA）的工作，以及它们之间的遗留集成。' },
      device: { title: '实习', body: '2025 年 1 月至 6 月，在 BKN 信息系统工作组担任全栈开发实习生。' } } },
  },
};

// ---------- the case studies: the problem, the approach, the decisions and what comes next, for the three projects that carry
// the most weight. Drafts from the facts on hand (Navy, 2026-10-12): he corrects what is off.
export const STORY = {
  en: {
    'godplan-erp': {
      problem: 'A company of some dozens of people ran its payroll, attendance, leave, tasks and client contacts across separate tools and spreadsheets. Each month the numbers had to be reconciled by hand, and nobody could see headcount, attendance and payroll on one screen.',
      approach: 'Before the first screen I mapped how the company actually ran: who records attendance, who approves leave, when payroll closes, where the client list lived. The modules follow that flow, so each one owns its data and the dashboard reads from all of them.',
      decisions: [
        { title: 'Go for the services', body: 'One compiled binary per service, typed end to end, cheap to run and simple to deploy in Docker. Workforce data is relational and rule-heavy; a strict language keeps the rules honest.' },
        { title: 'PostgreSQL as the single source', body: 'Employees, attendance, leave and payroll are one connected set of records. A relational database with constraints keeps a payroll line from pointing at a person who does not exist.' },
        { title: 'Next.js and TypeScript for the interface', body: 'The same types the API speaks, on the front end. Server rendering for the dashboard, so the first screen is ready without a loading state.' },
        { title: 'System health in the interface', body: 'Database state, storage and backups are shown where the administrator already is, instead of a server nobody logs into.' },
        { title: 'Built for the phone', body: 'Attendance is recorded on the floor, not at a desk. Every module works at phone width from the start.' },
      ],
      next: 'What I would do next: reports that export straight to the accountant, and role-based views so a team lead sees only their people.',
    },
    winfaith: {
      problem: 'A plastic injection moulding manufacturer (components for footwear, bags and more) needed a site that reads as an industrial product, with a catalogue that stays in step with what the factory actually makes.',
      approach: 'Treat the site as an application: the catalogue is served from the company\'s own API, so a product added there appears on the site without anyone touching a page. The design carries the material: motion that feels machined, a 3D element where it says more than a photo.',
      decisions: [
        { title: 'SvelteKit instead of a CMS', body: 'The content is structured data, not pages. A framework that renders fast and ships little JavaScript fits a catalogue better than a theme does.' },
        { title: 'The catalogue from the API', body: 'One source of truth for products, owned by the company. The site reads it; it never holds a copy that can go stale.' },
        { title: 'GSAP and Three.js, with restraint', body: 'Motion where it explains (a part turning, a section arriving), never as decoration. Everything still works with motion off.' },
        { title: 'Tailwind for the interface', body: 'A tight set of utilities keeps the industrial look consistent across every page.' },
      ],
      next: 'What I would do next: a quotation flow that sends a parts list straight to the sales team.',
    },
    'godjah-studio': {
      problem: 'PT. Gajah Terbang Kreatif already had the WordPress site I built first. When the company wanted to present itself as a studio with three brands, and asked for 3D and interactive design, a theme was no longer the right tool.',
      approach: 'Rebuild from scratch in Next.js, at the same address: one studio, three brands (Godjah for photo and video, Godtive for social media, Godweb for websites), an entrance led by motion, and a four-step way to start a project so a visitor always knows what happens next.',
      decisions: [
        { title: 'Next.js, not WordPress again', body: 'The interactions the company wanted live in components, not in page templates. A React framework with server rendering keeps the site fast and the motion precise.' },
        { title: 'One studio, three doors', body: 'Each brand gets its own colour and section, but the navigation, the type and the rhythm stay one, so it reads as one company.' },
        { title: 'Motion with a reason', body: 'The entrance sets the tone once; after that, motion only marks a change of place or state.' },
        { title: 'Four steps to start', body: 'Brief, scope, build, launch: the path a client takes, written as the site\'s own call to action.' },
      ],
      next: 'What I would do next: case pages for the studio\'s own client work, fed by a small CMS the team edits.',
    },
  },
  id: {
    'godplan-erp': {
      problem: 'Sebuah perusahaan dengan puluhan karyawan menjalankan penggajian, absensi, cuti, tugas dan kontak klien di alat dan spreadsheet yang terpisah. Setiap bulan angkanya harus dicocokkan dengan tangan, dan tidak ada yang bisa melihat jumlah karyawan, absensi dan penggajian dalam satu layar.',
      approach: 'Sebelum layar pertama, saya memetakan cara perusahaan benar-benar berjalan: siapa mencatat absensi, siapa menyetujui cuti, kapan penggajian ditutup, di mana daftar klien disimpan. Modul-modulnya mengikuti alur itu, sehingga masing-masing memiliki datanya sendiri dan dashboard membaca dari semuanya.',
      decisions: [
        { title: 'Go untuk layanannya', body: 'Satu binary terkompilasi per layanan, bertipe dari ujung ke ujung, murah dijalankan dan mudah dirilis dengan Docker. Data tenaga kerja bersifat relasional dan penuh aturan; bahasa yang ketat menjaga aturannya tetap jujur.' },
        { title: 'PostgreSQL sebagai satu sumber kebenaran', body: 'Karyawan, absensi, cuti dan penggajian adalah satu kumpulan catatan yang saling terhubung. Database relasional dengan constraint mencegah baris gaji menunjuk ke orang yang tidak ada.' },
        { title: 'Next.js dan TypeScript untuk antarmukanya', body: 'Tipe yang sama dengan yang dipakai API, di front end. Server rendering untuk dashboard, supaya layar pertama siap tanpa status loading.' },
        { title: 'Kesehatan sistem di antarmuka', body: 'Status database, penyimpanan dan backup ditampilkan di tempat admin sudah berada, bukan di server yang tak pernah dibuka siapa pun.' },
        { title: 'Dibangun untuk ponsel', body: 'Absensi dicatat di lapangan, bukan di meja. Setiap modul bekerja di lebar ponsel sejak awal.' },
      ],
      next: 'Yang akan saya kerjakan berikutnya: laporan yang langsung bisa diekspor ke akuntan, dan tampilan berbasis peran supaya kepala tim hanya melihat orangnya sendiri.',
    },
    winfaith: {
      problem: 'Pabrik injection moulding plastik (komponen untuk alas kaki, tas dan lainnya) membutuhkan situs yang terasa seperti produk industri, dengan katalog yang selalu sejalan dengan apa yang benar-benar dibuat pabrik.',
      approach: 'Memperlakukan situs sebagai aplikasi: katalog disajikan dari API milik perusahaan sendiri, sehingga produk yang ditambahkan di sana muncul di situs tanpa ada yang menyentuh halaman. Desainnya membawa materialnya: motion yang terasa presisi mesin, elemen 3D ketika ia bercerita lebih baik daripada foto.',
      decisions: [
        { title: 'SvelteKit, bukan CMS', body: 'Kontennya adalah data terstruktur, bukan halaman. Framework yang merender cepat dan mengirim sedikit JavaScript lebih cocok untuk katalog daripada tema.' },
        { title: 'Katalog dari API', body: 'Satu sumber kebenaran untuk produk, milik perusahaan. Situs membacanya; situs tidak pernah menyimpan salinan yang bisa basi.' },
        { title: 'GSAP dan Three.js, secukupnya', body: 'Motion ketika ia menjelaskan (sebuah part yang berputar, sebuah section yang datang), tidak pernah sekadar hiasan. Semuanya tetap berfungsi dengan motion dimatikan.' },
        { title: 'Tailwind untuk antarmukanya', body: 'Sekumpulan utility yang rapat menjaga tampilan industrinya konsisten di setiap halaman.' },
      ],
      next: 'Yang akan saya kerjakan berikutnya: alur penawaran yang mengirim daftar komponen langsung ke tim penjualan.',
    },
    'godjah-studio': {
      problem: 'PT. Gajah Terbang Kreatif sudah punya situs WordPress yang saya bangun lebih dulu. Ketika perusahaan ingin tampil sebagai studio dengan tiga brand, dan meminta 3D serta desain interaktif, tema bukan lagi alat yang tepat.',
      approach: 'Dibangun ulang dari nol dengan Next.js, di alamat yang sama: satu studio, tiga brand (Godjah untuk foto dan video, Godtive untuk media sosial, Godweb untuk website), pembukaan yang digerakkan motion, dan empat langkah untuk memulai proyek supaya pengunjung selalu tahu apa yang terjadi berikutnya.',
      decisions: [
        { title: 'Next.js, bukan WordPress lagi', body: 'Interaksi yang diinginkan perusahaan hidup di komponen, bukan di template halaman. Framework React dengan server rendering menjaga situs tetap cepat dan motion-nya presisi.' },
        { title: 'Satu studio, tiga pintu', body: 'Setiap brand punya warna dan section sendiri, tetapi navigasi, tipografi dan ritmenya tetap satu, sehingga terbaca sebagai satu perusahaan.' },
        { title: 'Motion yang punya alasan', body: 'Pembukaan menentukan nadanya sekali; setelah itu, motion hanya menandai perpindahan tempat atau keadaan.' },
        { title: 'Empat langkah untuk memulai', body: 'Brief, ruang lingkup, pembangunan, peluncuran: jalur yang ditempuh klien, ditulis sebagai ajakan bertindak situs itu sendiri.' },
      ],
      next: 'Yang akan saya kerjakan berikutnya: halaman studi kasus untuk karya klien studio itu sendiri, diisi dari CMS kecil yang bisa diedit tim.',
    },
  },
  zh: {
    'godplan-erp': {
      problem: '一家几十人的公司，薪资、考勤、请假、任务和客户联系人分散在不同的工具和表格里。每个月都要手工对数，没有人能在一个屏幕上同时看到员工总数、考勤和薪资。',
      approach: '在画第一个界面之前，我先梳理了公司真正的运转方式：谁记考勤，谁批请假，薪资什么时候结算，客户名单放在哪里。模块沿着这条流程来划分，各自拥有自己的数据，仪表盘再从所有模块读取。',
      decisions: [
        { title: '服务层用 Go', body: '每个服务一个编译后的二进制文件，端到端类型约束，运行成本低，用 Docker 部署简单。人力数据是关系型且规则很多的，一门严格的语言能让规则保持诚实。' },
        { title: 'PostgreSQL 作为唯一数据源', body: '员工、考勤、请假和薪资是一组彼此关联的记录。带约束的关系型数据库能防止一条薪资记录指向一个不存在的人。' },
        { title: '界面用 Next.js 和 TypeScript', body: 'API 用什么类型，前端就用什么类型。仪表盘做服务端渲染，第一屏无需加载状态即可就绪。' },
        { title: '系统健康放进界面', body: '数据库状态、存储和备份显示在管理员本来就在的地方，而不是一台没人登录的服务器上。' },
        { title: '为手机而建', body: '考勤是在现场记录的，不是在办公桌前。每个模块从一开始就能在手机宽度下使用。' },
      ],
      next: '接下来我会做的：可以直接导出给会计的报表，以及按角色划分的视图，让组长只看到自己的人。',
    },
    winfaith: {
      problem: '一家塑料注塑厂（鞋类、箱包等配件）需要一个读起来像工业产品的网站，产品目录要和工厂实际生产的东西保持同步。',
      approach: '把网站当作应用来做：目录来自公司自己的 API，那边新增一个产品，网站上就会出现，不需要任何人去改页面。设计承载材质本身：动效有机加工的质感，照片说不清的地方用 3D 元素。',
      decisions: [
        { title: '用 SvelteKit 而不是 CMS', body: '内容是结构化数据，不是页面。一个渲染快、发出的 JavaScript 少的框架，比主题更适合做目录。' },
        { title: '目录来自 API', body: '产品只有一个数据源，归公司所有。网站只读取它，从不保存一份可能过期的副本。' },
        { title: 'GSAP 和 Three.js，点到为止', body: '动效只在它能解释什么的时候出现（一个零件在转动，一个区块到位），从不当装饰。关闭动效后一切照常工作。' },
        { title: '界面用 Tailwind', body: '一小套紧凑的工具类，让工业感在每个页面上保持一致。' },
      ],
      next: '接下来我会做的：一条报价流程，把零件清单直接送到销售团队手上。',
    },
    'godjah-studio': {
      problem: 'PT. Gajah Terbang Kreatif 已经有了我先前做的 WordPress 网站。当公司想以拥有三个品牌的工作室身份示人，并提出要 3D 和交互设计时，主题就不再是合适的工具了。',
      approach: '用 Next.js 从零重建，地址不变：一个工作室，三个品牌（Godjah 做照片和视频，Godtive 做社交媒体，Godweb 做网站），一段由动效引领的开场，以及四步启动项目的流程，让访客始终知道下一步会发生什么。',
      decisions: [
        { title: '用 Next.js，不再用 WordPress', body: '公司想要的交互存在于组件里，而不是页面模板里。带服务端渲染的 React 框架让网站保持快速，动效保持精确。' },
        { title: '一个工作室，三扇门', body: '每个品牌有自己的颜色和区块，但导航、字体和节奏保持统一，读起来仍是同一家公司。' },
        { title: '有理由的动效', body: '开场只定一次基调；之后，动效只用来标记位置或状态的变化。' },
        { title: '四步开始', body: '简报、范围、构建、上线：客户要走的路，被写成了网站自己的行动号召。' },
      ],
      next: '接下来我会做的：为工作室自己的客户案例做案例页，由团队可以编辑的小型 CMS 驱动。',
    },
  },
};
