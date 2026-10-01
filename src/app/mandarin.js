// A Mandarin course book on the free right front of the desk, in front of the leather notebook: a small red cloth-bound
// textbook lying a little askew, a gold ribbon out of its tail, and two character flashcards fanned beside it. Clicked, the
// cover swings open flat to Lesson 1. Every printed line is English, apart from the characters and pinyin being learnt.
// Units: 1 unit ≈ 19.5 mm; the desk top is y = 0. Footprint: book x 13.1..21.2, cards x 21.5..25.9, both z 13.7..23.3.
// One canvas atlas carries the cover, endpaper, first page, spine, page edges, both cards and the plain colours, so the prop
// is a single material: the book and cards bake into one draw, the swinging cover into another.
import { Node, Mesh, Material } from 'engine/scene';
import { box } from 'engine/geometry';
import { drawTexture, MONO, SANS } from 'engine/textures';
import { tween, Ease } from 'engine/tween';
import { flatten } from 'app/bake';

export const MANDARIN_POS = [17.2, 0, 18.45];
const CARDS_POS = [23.65, 0, 18.6];
const YAW = 0.08;
// characters come from the system's CJK fonts (canvas falls back per glyph when none of these is installed)
const CJK = '"Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", "SimSun", "Microsoft YaHei", "PingFang SC", serif';
const CLOTH = '#8c2a20', GOLD = '#d9b26a', CREAM = '#f1e6cf', PAPER = '#efe7d4', INK = '#1f1a16', RED = '#a8322a', GREY = 'rgba(31,26,22,0.55)', CARD = '#f6f0e2', RIBBON = '#c99a3a';

// the atlas: [x0, y0, x1, y1] in canvas pixels; plain colours are small blocks sampled at their centre
const AW = 1024, AH = 1024;
// (each rect keeps the proportions of the face it is printed on; the gaps keep the mipmaps from bleeding between them)
const R = {
  cover: [0, 0, 480, 600], endpaper: [0, 624, 320, 1024], page: [520, 300, 970, 878], spine: [520, 920, 1004, 973],
  card1: [520, 0, 712, 284], card2: [752, 0, 944, 284], edge: [400, 640, 480, 1000],
  cloth: [340, 640, 380, 680], paper: [340, 700, 380, 740], gold: [340, 760, 380, 800], card: [340, 820, 380, 860],
};

function centred(ctx, text, x, y) { ctx.textAlign = 'center'; ctx.fillText(text, x, y); ctx.textAlign = 'left'; }
function weave(ctx, w, h) {
  ctx.globalAlpha = 0.08; ctx.fillStyle = '#000'; for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  ctx.globalAlpha = 0.04; ctx.fillStyle = '#fff'; for (let x = 0; x < w; x += 3) ctx.fillRect(x, 0, 1, h);
  ctx.globalAlpha = 1;
}
function inRect(ctx, r, fn) { ctx.save(); ctx.translate(r[0], r[1]); ctx.beginPath(); ctx.rect(0, 0, r[2] - r[0], r[3] - r[1]); ctx.clip(); fn(ctx, r[2] - r[0], r[3] - r[1]); ctx.restore(); }

function atlasTexture() {
  return drawTexture(AW, AH, (ctx) => {
    ctx.fillStyle = CLOTH; ctx.fillRect(0, 0, AW, AH);
    ctx.textBaseline = 'middle';
    // ---------- the cover: red cloth, a gold frame, the characters and the English title
    inRect(ctx, R.cover, (c, w, h) => {
      c.fillStyle = CLOTH; c.fillRect(0, 0, w, h); weave(c, w, h);
      c.strokeStyle = GOLD; c.lineWidth = 3; c.strokeRect(22, 22, w - 44, h - 44); c.lineWidth = 1; c.strokeRect(30, 30, w - 60, h - 60);
      c.fillStyle = GOLD; c.font = `600 17px ${MONO}`; c.letterSpacing = '5px'; centred(c, 'BOOK 1 · BEGINNER', w / 2, 70);
      c.letterSpacing = '0px'; c.fillStyle = CREAM; c.font = `400 150px ${CJK}`; centred(c, '汉语', w / 2, 200);
      c.font = `italic 400 30px ${SANS}`; c.fillStyle = 'rgba(241,230,207,0.78)'; centred(c, 'Hànyǔ', w / 2, 300);
      c.fillStyle = GOLD; c.fillRect(96, 334, w - 192, 2);
      c.fillStyle = CREAM; c.font = `700 60px ${SANS}`; c.letterSpacing = '4px'; centred(c, 'MANDARIN', w / 2, 388); centred(c, 'CHINESE', w / 2, 450);
      c.fillStyle = GOLD; c.font = `500 15px ${MONO}`; c.letterSpacing = '3px'; centred(c, 'A COURSE FOR ENGLISH SPEAKERS', w / 2, 500);
      c.letterSpacing = '0px'; c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.roundRect(w / 2 - 62, 524, 124, 34, 17); c.stroke();
      c.font = `600 16px ${MONO}`; c.letterSpacing = '3px'; centred(c, 'HSK 1-2', w / 2 + 2, 542); c.letterSpacing = '0px';
    });
    // ---------- the spine, read from the head (left) to the tail (right)
    inRect(ctx, R.spine, (c, w, h) => {
      c.fillStyle = CLOTH; c.fillRect(0, 0, w, h); weave(c, w, h);
      c.fillStyle = GOLD; c.fillRect(10, 0, 4, h); c.fillRect(w - 14, 0, 4, h);
      c.font = `700 22px ${SANS}`; c.letterSpacing = '3px'; c.fillText('MANDARIN CHINESE', 36, h / 2 + 1); c.letterSpacing = '0px';
      c.fillStyle = CREAM; c.font = `400 28px ${CJK}`; c.fillText('汉语', w - 150, h / 2 + 1);
      c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.arc(w - 50, h / 2, 14, 0, Math.PI * 2); c.stroke();
      c.fillStyle = GOLD; c.font = `700 16px ${MONO}`; centred(c, '1', w - 50, h / 2 + 1);
    });
    // ---------- inside the cover, seen once it is open
    inRect(ctx, R.endpaper, (c, w, h) => {
      c.fillStyle = PAPER; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(168,50,42,0.35)'; c.lineWidth = 2; c.strokeRect(16, 16, w - 32, h - 32);
      c.fillStyle = GREY; c.font = `500 12px ${MONO}`; c.letterSpacing = '3px'; centred(c, 'THIS BOOK BELONGS TO', w / 2, 112); c.letterSpacing = '0px';
      c.fillStyle = INK; c.font = `italic 400 44px Georgia, "Times New Roman", serif`; centred(c, 'Navy', w / 2, 166);
      c.fillStyle = 'rgba(31,26,22,0.4)'; c.fillRect(64, 196, w - 128, 1.5);
      c.fillStyle = RED; c.font = `400 22px ${CJK}`; centred(c, '汉语 · Book 1', w / 2, 236);
      c.fillStyle = GREY; c.font = `400 14px ${SANS}`; centred(c, 'one lesson a night, tones first', w / 2, 270);
      c.fillStyle = RED; c.fillRect(w - 92, h - 96, 52, 52);
      c.fillStyle = PAPER; c.font = `400 36px ${CJK}`; centred(c, '学', w - 66, h - 69);
    });
    // ---------- the first page: Lesson 1, a short greeting dialogue and the four tones
    inRect(ctx, R.page, (c, w, h) => {
      c.fillStyle = PAPER; c.fillRect(0, 0, w, h);
      c.fillStyle = GREY; c.font = `600 12px ${MONO}`; c.letterSpacing = '3px'; c.fillText('LESSON 1', 34, 44); c.letterSpacing = '0px';
      c.font = `400 16px ${CJK}`; c.textAlign = 'right'; c.fillText('第一课', w - 34, 44); c.textAlign = 'left';
      c.fillStyle = INK; c.font = `700 34px ${SANS}`; c.fillText('Greetings', 34, 92);
      c.fillStyle = RED; c.font = `400 20px ${CJK}`; c.fillText('问候 · wènhòu', 34, 126);
      c.fillStyle = 'rgba(31,26,22,0.25)'; c.fillRect(34, 148, w - 68, 1.5);
      const lines = [['A', '你好！', 'Nǐ hǎo!', 'Hello!'], ['B', '你好！你叫什么名字？', 'Nǐ hǎo! Nǐ jiào shénme míngzi?', "Hello! What's your name?"],
        ['A', '我叫 Navy。', 'Wǒ jiào Navy.', 'My name is Navy.'], ['B', '很高兴认识你。', 'Hěn gāoxìng rènshi nǐ.', 'Nice to meet you.']];
      lines.forEach(([who, zh, py, en], i) => {
        const y = 188 + i * 82;
        c.strokeStyle = RED; c.lineWidth = 1.5; c.beginPath(); c.arc(48, y, 13, 0, Math.PI * 2); c.stroke();
        c.fillStyle = RED; c.font = `700 13px ${MONO}`; centred(c, who, 48, y + 1);
        c.fillStyle = INK; c.font = `400 26px ${CJK}`; c.fillText(zh, 74, y);
        c.fillStyle = GREY; c.font = `italic 400 15px ${SANS}`; c.fillText(py, 74, y + 28);
        c.font = `400 15px ${SANS}`; c.fillStyle = 'rgba(31,26,22,0.72)'; c.fillText(en, 74, y + 50);
      });
      c.fillStyle = 'rgba(31,26,22,0.25)'; c.fillRect(34, 512, w - 68, 1.5);
      c.fillStyle = GREY; c.font = `600 11px ${MONO}`; c.letterSpacing = '3px'; c.fillText('THE FOUR TONES', 34, 538); c.letterSpacing = '0px';
      c.fillStyle = INK; c.font = `500 18px ${SANS}`; c.fillText('mā   má   mǎ   mà', 196, 538);
      c.fillStyle = GREY; c.font = `500 12px ${MONO}`; c.textAlign = 'right'; c.fillText('1', w - 34, h - 22); c.textAlign = 'left';
    });
    // ---------- page edges: fine uneven lines
    inRect(ctx, R.edge, (c, w, h) => {
      c.fillStyle = PAPER; c.fillRect(0, 0, w, h);
      let a = 7; const rnd = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
      for (let y = 0; y < h; y += 3) { c.fillStyle = `rgba(90,70,50,${0.05 + rnd() * 0.12})`; c.fillRect(0, y, w, 1); }
    });
    // ---------- two flashcards: character, pinyin, English
    for (const [r, zh, py, en, n] of [[R.card1, '你好', 'nǐ hǎo', 'hello', '01'], [R.card2, '谢谢', 'xièxie', 'thank you', '02']]) {
      inRect(ctx, r, (c, w, h) => {
        c.fillStyle = CARD; c.fillRect(0, 0, w, h); c.fillStyle = RED; c.fillRect(0, 0, w, 9);
        c.fillStyle = GREY; c.font = `600 11px ${MONO}`; c.letterSpacing = '2px'; c.fillText(n, 14, 30); c.textAlign = 'right'; c.fillText('HSK 1', w - 14, 30); c.textAlign = 'left'; c.letterSpacing = '0px';
        c.fillStyle = INK; c.font = `400 76px ${CJK}`; centred(c, zh, w / 2, 122);
        c.fillStyle = RED; c.font = `500 24px ${SANS}`; centred(c, py, w / 2, 198);
        c.fillStyle = 'rgba(31,26,22,0.62)'; c.font = `400 19px ${SANS}`; centred(c, en, w / 2, 234);
      });
    }
    for (const [r, col] of [[R.cloth, CLOTH], [R.paper, PAPER], [R.gold, RIBBON], [R.card, CARD]]) { ctx.fillStyle = col; ctx.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]); }
  });
}

// Box faces come out of engine/geometry as +x, −x, +y, −y, +z, −z, 16 vertices each, every face with its own 0..1 UVs.
// `faces` maps a face name to an atlas rect, { rect, turn } (printed turned 180°) or solid(rect) (one flat colour);
// unnamed faces take `rest`.
const FACES = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
const solid = (rect) => ({ rect, solid: true });
function paint(g, faces) {
  const uv = g.uvs, per = uv.length / 2 / 6;
  for (let i = 0; i < uv.length / 2; i++) {
    const f = faces[FACES[Math.floor(i / per)]] || faces.rest;
    const r = Array.isArray(f) ? f : f.rect;
    let u = uv[i * 2], v = uv[i * 2 + 1];
    if (f.solid) u = v = 0.5;
    else if (f.turn) { u = 1 - u; v = 1 - v; }
    uv[i * 2] = (r[0] + u * (r[2] - r[0])) / AW;
    uv[i * 2 + 1] = 1 - (r[3] - v * (r[3] - r[1])) / AH;
  }
  return g;
}

export function buildMandarinBook() {
  const root = new Node('mandarin');
  const mat = new Material({ color: [1, 1, 1], map: atlasTexture(), roughness: 0.78, metalness: 0, emissive: [0.035, 0.032, 0.03] });
  const put = (parent, geo, p, r) => { const m = new Mesh(geo, mat); m.position = p; if (r) m.rotation = r; parent.add(m); return m; };
  const CLOTH_F = solid(R.cloth), PAPER_F = solid(R.paper);

  // ---------- the book: 140 × 175 × 19 mm, spine on the left, lying a little askew
  const book = new Node('mandarin-book'); book.position = [...MANDARIN_POS]; book.rotation[1] = YAW; root.add(book);
  const BW = 7.2, BD = 9.0, BT = 0.12, PH = 0.72;
  put(book, paint(box(BW, BT, BD), { rest: CLOTH_F }), [0, BT / 2, 0]);                                                   // back board
  put(book, paint(box(6.85, PH, 8.8), { py: R.page, ny: PAPER_F, rest: R.edge }), [0.025, BT + PH / 2, 0]);               // the pages
  put(book, paint(box(0.42, BT * 2 + PH + 0.02, BD), { nx: R.spine, rest: CLOTH_F }), [-BW / 2 + 0.09, (BT * 2 + PH + 0.02) / 2, 0]);   // spine
  // the ribbon: out of the tail between the pages, down onto the desk
  put(book, paint(box(0.2, 0.025, 0.62), { rest: solid(R.gold) }), [1.6, 0.3, 4.55], [1.06, 0, 0]);
  put(book, paint(box(0.2, 0.02, 0.3), { rest: solid(R.gold) }), [1.62, 0.012, 4.84], [0, 0.12, 0]);
  // the cover swings about the spine's middle, so wide open it lands flat on the desk, endpaper up
  const hinge = new Node('mandarin-cover'); hinge.position = [-BW / 2, (BT * 2 + PH) / 2, 0]; hinge.userData.dynamic = true; book.add(hinge);
  put(hinge, paint(box(BW, BT, BD), { py: R.cover, ny: { rect: R.endpaper, turn: true }, rest: CLOTH_F }), [BW / 2, (BT * 2 + PH) / 2 - BT / 2, 0]);

  // ---------- two flashcards, fanned
  const cards = new Node('mandarin-cards'); cards.position = [...CARDS_POS]; root.add(cards);
  const CW = 3.1, CD = 4.6, CT = 0.035;
  put(cards, paint(box(CW, CT, CD), { py: R.card2, rest: solid(R.card) }), [-0.25, CT / 2, -0.25], [0, 0.18, 0]);
  put(cards, paint(box(CW, CT, CD), { py: R.card1, rest: solid(R.card) }), [0.2, CT * 1.5, 0.2], [0, -0.22, 0]);

  flatten(hinge, 'mandarin-cover');
  flatten(book, 'mandarin-book');
  flatten(cards, 'mandarin-cards');

  // ---------- hover/click volumes, tight to what is there; the cards answer for the book
  const ghost = () => new Material({ color: [0, 0, 0], opacity: 0, transparent: true, unlit: true, depthWrite: false });
  const hit = new Mesh(box(BW + 0.5, 1.4, BD + 0.4), ghost(), 'hit:mandarin');
  hit.position = [0, 0.6, 0]; hit.castShadow = false; hit.pickable = true; hit.userData = { keyId: 'mandarin', interactive: true, glow: 0, targetGlow: 0 }; book.add(hit);
  const cardsHit = new Mesh(box(4.4, 0.4, 5.4), ghost(), 'hit:mandarin-cards');
  cardsHit.position = [0, 0.15, 0]; cardsHit.castShadow = false; cardsHit.pickable = true; cardsHit.userData = { keyId: 'mandarin', interactive: true, glow: 0, targetGlow: 0, ownerKey: hit }; cards.add(cardsHit);

  // ---------- open / close the cover
  let open = false;
  const setOpen = (v) => {
    if (v === open) return; open = v;
    tween.killOf(hinge.rotation);
    tween.to(hinge.rotation, [0, 0, v ? Math.PI : 0], { duration: v ? 0.95 : 0.7, ease: Ease.power2InOut });
  };
  // the camera takes in the open book (the cover lies out to x ≈ 6.4) from the chair's side; the panel sits right of the cards
  const c = [MANDARIN_POS[0] - 1.6, 0.3, MANDARIN_POS[2] - 0.2];
  const stages = [{ position: [c[0] + 2.2, 19.5, c[2] + 13.5], target: c }];
  const panelOffset = [9.0, 1.2, 0];
  return { root, hit, cardsHit, stages, panelOffset, open: setOpen, get isOpen() { return open; } };
}
