// Three 27" monitors on a triple-arm pole stand across the back of the desk, mid-build: the left screen hunts for design
// references, the centre one codes (VS Code), the right one previews the site, which is the clickable portfolio screen
// (its material comes from world.js).
// Units: 1 unit ≈ 19.5 mm, so a 27" 16:9 panel (597 × 336 mm active) is 30.6 × 17.2.
import { Node, Mesh, Material } from 'engine/scene';
import { roundedBox, box, cylinder, sphere } from 'engine/geometry';
import { drawTexture, MONO } from 'engine/textures';
import { color } from 'engine/math';
import { flatten } from 'app/bake';

export const SCREEN = { w: 30.6, h: 17.2 };
const HOUSING = { w: 31.4, h: 18.5, d: 0.8 };
const CY = 17.5;                        // screen centre height above the desk
const CENTER = [0, CY, -16.4];          // centre screen, facing +z (its back clears the pole)
const ANGLE = 0.42;                     // side screens turn ~24° toward the chair
const GAP = 0.25;
const POLE = [0, -20.5];                // far enough forward that the base sits on the desk (back edge z = -24)

// where each panel sits: centre, then left and right, hinged at the centre panel's edges
function layout() {
  const half = HOUSING.w / 2, halfP = HOUSING.h / 2, c = Math.cos(ANGLE), s = Math.sin(ANGLE);
  const rx = (half + GAP) + half * c, rz = CENTER[2] + half * s;
  const lx = -(half + GAP) - halfP * c, lz = CENTER[2] + halfP * s;
  return [
    { id: 'center', pos: [...CENTER], ry: 0 },
    { id: 'left', pos: [lx, CY + 2, lz], ry: ANGLE, rz: Math.PI / 2 },   // portrait, so the PC in front of it doesn't hide it
    { id: 'right', pos: [rx, CY, rz], ry: -ANGLE },
  ];
}

// ---------- left screen: a browser looking for design references, a grid of UI shots scrolling slowly under the cursor
const SHOTS = [
  ['ERP Dashboard - Dark', 'dash-dark', 'studio.kiln', 842], ['Inventory Admin', 'dash-light', 'mara.ui', 615], ['Sales Rep App', 'mobile', 'pocketlab', 1204],
  ['SaaS Landing', 'landing', 'northform', 977], ['Task Board', 'kanban', 'grid & co', 388], ['Analytics Overview', 'analytics', 'datawell', 731],
  ['Warm Brand Palette', 'palette', 'type.house', 529], ['Sign-in Flow', 'login', 'calm.design', 296], ['Customers Table', 'table', 'rowset', 452],
];
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function thumb(ctx, kind, x, y, w, h) {
  ctx.save(); rr(ctx, x, y, w, h, 8); ctx.clip();
  const bars = (bx, by, bw, bh, n, col) => { for (let k = 0; k < n; k++) { const v = 0.3 + 0.7 * Math.abs(Math.sin(k * 1.7 + bx)); ctx.fillStyle = col; ctx.fillRect(bx + k * (bw / n), by + bh * (1 - v), bw / n - 3, bh * v); } };
  const line = (lx, ly, lw, lh, col, seed) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k <= 20; k++) { const px = lx + (lw * k) / 20, py = ly + lh * (0.5 - 0.35 * Math.sin(k * 0.6 + seed) - 0.1 * Math.sin(k * 1.9)); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); };
  const pill = (px, py, pw, ph, col) => { ctx.fillStyle = col; rr(ctx, px, py, pw, ph, ph / 2); ctx.fill(); };
  switch (kind) {
    case 'dash-dark': ctx.fillStyle = '#16130f'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#211c16'; ctx.fillRect(x, y, w * 0.2, h);
      for (let k = 0; k < 5; k++) pill(x + 10, y + 18 + k * 18, w * 0.13, 7, k ? '#3a3127' : '#d9a05b');
      for (let k = 0; k < 3; k++) { ctx.fillStyle = '#231d16'; rr(ctx, x + w * 0.24 + k * w * 0.25, y + 12, w * 0.22, 40, 6); ctx.fill(); pill(x + w * 0.26 + k * w * 0.25, y + 22, 30, 6, '#6b5a44'); ctx.fillStyle = '#efe4cf'; ctx.fillRect(x + w * 0.26 + k * w * 0.25, y + 34, 44, 9); }
      bars(x + w * 0.25, y + 64, w * 0.7, h - 78, 12, '#d9a05b'); break;
    case 'dash-light': ctx.fillStyle = '#f5f6f8'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, 26); pill(x + 10, y + 9, 50, 8, '#3a5bd9');
      ctx.fillStyle = '#ffffff'; rr(ctx, x + 10, y + 36, w * 0.58, h - 46, 6); ctx.fill(); line(x + 18, y + 46, w * 0.54, h - 64, '#3a5bd9', 1);
      for (let k = 0; k < 4; k++) { ctx.fillStyle = '#ffffff'; rr(ctx, x + w * 0.64, y + 36 + k * ((h - 46) / 4), w * 0.32, (h - 46) / 4 - 6, 5); ctx.fill(); pill(x + w * 0.67, y + 46 + k * ((h - 46) / 4), 40, 6, ['#3a5bd9', '#e2e6f0', '#e2e6f0', '#e2e6f0'][k]); } break;
    case 'mobile': ctx.fillStyle = '#e9e2d6'; ctx.fillRect(x, y, w, h);
      for (let k = 0; k < 2; k++) { const px = x + w * 0.18 + k * w * 0.36, pw = w * 0.28; ctx.fillStyle = '#141210'; rr(ctx, px, y + 12, pw, h - 4, 14); ctx.fill(); ctx.fillStyle = k ? '#fbf7f0' : '#1f1a14'; rr(ctx, px + 5, y + 18, pw - 10, h - 14, 10); ctx.fill();
        for (let q = 0; q < 4; q++) { ctx.fillStyle = k ? '#efe6d6' : '#2c251c'; rr(ctx, px + 12, y + 36 + q * 30, pw - 24, 24, 6); ctx.fill(); pill(px + 18, y + 44 + q * 30, 30, 6, q === 0 ? '#c7743a' : k ? '#cdbfa8' : '#5a4b39'); } } break;
    case 'landing': ctx.fillStyle = '#0f0e14'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 16, y + 34, w * 0.42, 14); ctx.fillRect(x + 16, y + 54, w * 0.34, 14);
      pill(x + 16, y + 80, w * 0.38, 6, '#5d5a6e'); pill(x + 16, y + 112, 70, 18, '#c6f36b'); const g = ctx.createRadialGradient(x + w * 0.74, y + h * 0.48, 4, x + w * 0.74, y + h * 0.48, h * 0.5); g.addColorStop(0, '#9a7bff'); g.addColorStop(1, 'rgba(154,123,255,0)'); ctx.fillStyle = g; ctx.fillRect(x + w * 0.45, y, w * 0.55, h);
      ctx.fillStyle = '#e8e4ff'; ctx.beginPath(); ctx.arc(x + w * 0.74, y + h * 0.48, h * 0.22, 0, Math.PI * 2); ctx.fill(); break;
    case 'kanban': ctx.fillStyle = '#f3efe8'; ctx.fillRect(x, y, w, h);
      for (let c = 0; c < 3; c++) { const cx = x + 10 + c * (w - 20) / 3; pill(cx + 2, y + 10, 50, 7, ['#c7743a', '#3a7bd5', '#3fa36b'][c]); for (let q = 0; q < 3 - (c === 2 ? 1 : 0); q++) { ctx.fillStyle = '#ffffff'; rr(ctx, cx, y + 26 + q * 44, (w - 20) / 3 - 8, 38, 5); ctx.fill(); pill(cx + 8, y + 34 + q * 44, 60, 6, '#d8d1c4'); pill(cx + 8, y + 46 + q * 44, 36, 6, '#e8e2d8'); } } break;
    case 'analytics': ctx.fillStyle = '#0f1512'; ctx.fillRect(x, y, w, h); const cx = x + w * 0.24, cy = y + h * 0.5, R = h * 0.3;
      [['#4fd18b', 0.45], ['#2f7d58', 0.3], ['#a7e8c4', 0.25]].reduce((a0, [col, f]) => { ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(cx, cy, R, a0, a0 + f * Math.PI * 2); ctx.stroke(); return a0 + f * Math.PI * 2; }, -Math.PI / 2);
      bars(x + w * 0.5, y + 22, w * 0.45, h - 36, 9, '#4fd18b'); break;
    case 'palette': ctx.fillStyle = '#f7f1e6'; ctx.fillRect(x, y, w, h);
      ['#1f150c', '#8e6a3d', '#d9a05b', '#b8622c', '#e7ddc8'].forEach((c, k) => { ctx.fillStyle = c; ctx.fillRect(x + 12 + k * (w - 24) / 5, y + 12, (w - 24) / 5 - 4, h * 0.5); });
      ctx.fillStyle = '#1f150c'; ctx.font = `700 ${Math.round(h * 0.28)}px ${MONO}`; ctx.fillText('Aa', x + 14, y + h - 14); pill(x + w * 0.42, y + h * 0.7, w * 0.4, 7, '#cbb894'); pill(x + w * 0.42, y + h * 0.84, w * 0.28, 7, '#e0d3bb'); break;
    case 'login': ctx.fillStyle = '#ece7f6'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#ffffff'; rr(ctx, x + w * 0.28, y + 14, w * 0.44, h - 28, 10); ctx.fill();
      pill(x + w * 0.36, y + 32, w * 0.2, 9, '#2b2540'); for (let k = 0; k < 2; k++) { ctx.strokeStyle = '#d9d3e6'; ctx.lineWidth = 2; rr(ctx, x + w * 0.34, y + 56 + k * 30, w * 0.32, 20, 5); ctx.stroke(); } pill(x + w * 0.34, y + 122, w * 0.32, 20, '#6c4cf0'); break;
    default: ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#f2f2f4'; ctx.fillRect(x, y, w, 24);
      for (let k = 0; k < 6; k++) { const ry = y + 30 + k * 24; ctx.fillStyle = ['#f0b28a', '#9cc5f0', '#b6e0a8', '#e9b3d6', '#f3d68b', '#b9b3f3'][k]; ctx.beginPath(); ctx.arc(x + 20, ry + 8, 7, 0, Math.PI * 2); ctx.fill(); pill(x + 34, ry + 4, 70, 7, '#d6d6dc'); pill(x + w * 0.5, ry + 4, 50, 7, '#e6e6ea'); pill(x + w * 0.78, ry + 2, 40, 11, k % 3 ? '#e3f4e6' : '#fde7df'); }
  }
  ctx.restore();
}
function designScreen() {
  const W = 576, H = 1024;                                   // the portrait page; the canvas itself stays 1024 × 576
  const tex = drawTexture(1024, 576, () => {});
  const ctx = tex.image.getContext('2d');
  const cols = 2, cardW = 250, cardH = 214, gap = 22, x0 = 24, top = 200;
  const rowsTotal = Math.ceil(SHOTS.length / cols), span = rowsTotal * (cardH + gap);
  const draw = (t) => {
    ctx.setTransform(0, 1, -1, 0, 1024, 0);                   // page top → the panel's top once it stands portrait
    ctx.fillStyle = '#161412'; ctx.fillRect(0, 0, W, H);
    const scroll = (t * 9) % span;
    ctx.save(); ctx.beginPath(); ctx.rect(0, top - 10, W, H - top + 10); ctx.clip();
    const cur = [W * 0.5 + Math.sin(t * 0.37) * 190, top + 330 + Math.sin(t * 0.53) * 260];
    for (let rep = 0; rep < 2; rep++) SHOTS.forEach(([title, kind, by, likes], k) => {
      const x = x0 + (k % cols) * (cardW + gap + 8), y = top + Math.floor(k / cols) * (cardH + gap) - scroll + rep * span;
      if (y > H || y + cardH < top - 10) return;
      const hover = cur[0] > x && cur[0] < x + cardW && cur[1] > y && cur[1] < y + cardH - 40;
      thumb(ctx, kind, x, y, cardW, cardH - 44);
      if (hover) { ctx.strokeStyle = '#d9a05b'; ctx.lineWidth = 3; rr(ctx, x - 1.5, y - 1.5, cardW + 3, cardH - 41, 9); ctx.stroke(); ctx.fillStyle = '#d9a05b'; rr(ctx, x + cardW - 70, y + 10, 60, 24, 12); ctx.fill(); ctx.fillStyle = '#1a140d'; ctx.font = `700 13px ${MONO}`; ctx.fillText('Save', x + cardW - 57, y + 27); }
      ctx.fillStyle = '#e7ddc8'; ctx.font = `600 15px ${MONO}`; ctx.fillText(title, x + 2, y + cardH - 22);
      ctx.fillStyle = 'rgba(231,221,200,0.5)'; ctx.font = `500 13px ${MONO}`; ctx.fillText(by, x + 2, y + cardH - 4); ctx.textAlign = 'right'; ctx.fillText('♥ ' + likes, x + cardW - 2, y + cardH - 4); ctx.textAlign = 'left';
    });
    ctx.restore();
    ctx.fillStyle = '#0f0e0d'; ctx.fillRect(0, 0, W, 34);
    [['erp dashboard ui - Inspo', true], ['Color palettes', false]].forEach(([n, on], k) => { const x = 10 + k * 270; ctx.fillStyle = on ? '#1f1c19' : '#151311'; rr(ctx, x, 6, 262, 28, 7); ctx.fill(); ctx.fillStyle = on ? '#e7ddc8' : '#8d8374'; ctx.font = `500 13px ${MONO}`; ctx.fillText(n, x + 14, 25); });
    ctx.fillStyle = '#1f1c19'; ctx.fillRect(0, 34, W, 40); ctx.fillStyle = '#2b2723'; rr(ctx, 86, 41, W - 100, 26, 13); ctx.fill();
    ctx.fillStyle = '#8d8374'; ctx.font = `500 13px ${MONO}`; ctx.fillText('<   >   C', 16, 59); ctx.fillStyle = '#c9bea9'; ctx.fillText('inspo.design/search?q=erp+dashboard', 104, 59);
    ctx.fillStyle = '#161412'; ctx.fillRect(0, 74, W, top - 84);
    ctx.fillStyle = '#e7ddc8'; ctx.font = `700 22px ${MONO}`; ctx.fillText('erp dashboard', 24, 106); ctx.fillStyle = '#8d8374'; ctx.font = `500 13px ${MONO}`; ctx.fillText('2,184 shots', 234, 105);
    ['Dashboard', 'ERP', 'Dark mode', 'Data viz', 'Minimal', 'Mobile'].forEach((c, k) => { const x = 24 + (k % 3) * 178, y = 122 + Math.floor(k / 3) * 36; ctx.fillStyle = k === 2 ? '#d9a05b' : '#25211d'; rr(ctx, x, y, 168, 28, 14); ctx.fill(); ctx.fillStyle = k === 2 ? '#1a140d' : '#c9bea9'; ctx.font = `600 13px ${MONO}`; ctx.fillText(c, x + 16, y + 19); });
    ctx.save(); ctx.translate(cur[0], cur[1]); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#000000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(6, 17); ctx.lineTo(10, 26); ctx.lineTo(14, 24); ctx.lineTo(10, 15); ctx.lineTo(17, 15); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    tex.needsUpdate = true;
  };
  return { tex, draw };
}

// VS Code (Dark+), mid-edit: the ERP's explorer, a Go handler being typed line by line, a terminal running the tests
const CODE = [
  'package orders',
  '',
  'import (',
  '\t"context"',
  '\t"net/http"',
  '',
  '\t"github.com/godplan/erp/internal/db"',
  ')',
  '',
  '// Create books a sales order and reserves its stock in one transaction.',
  'func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {',
  '\tvar in CreateOrder',
  '\tif err := decode(r, &in); err != nil {',
  '\t\th.fail(w, http.StatusBadRequest, err)',
  '\t\treturn',
  '\t}',
  '\tctx := r.Context()',
  '\torder, err := db.Tx(ctx, h.pool, func(tx db.Q) (*Order, error) {',
  '\t\tif err := reserveStock(ctx, tx, in.Lines); err != nil {',
  '\t\t\treturn nil, err',
  '\t\t}',
  '\t\treturn tx.InsertOrder(ctx, in)',
  '\t})',
  '\tif err != nil {',
  '\t\th.fail(w, http.StatusConflict, err)',
  '\t\treturn',
  '\t}',
  '\th.json(w, http.StatusCreated, order)',
  '}',
];
const GO_KW = new Set(['package', 'import', 'func', 'var', 'nil', 'type', 'struct', 'error']);
const GO_CTL = new Set(['if', 'return', 'for', 'range', 'import', 'package']);
const VS = { bg: '#1e1e1e', side: '#252526', bar: '#333333', tab: '#2d2d2d', status: '#007acc', text: '#d4d4d4', dim: '#858585', kw: '#569cd6', ctl: '#c586c0', str: '#ce9178', fn: '#dcdcaa', com: '#6a9955', id: '#9cdcfe', type: '#4ec9b0', num: '#b5cea8' };
function tokens(line) {
  const out = [], re = /(\/\/.*$)|("(?:[^"\\]|\\.)*"?)|(\b\d+\b)|([A-Za-z_]\w*)(?=\()|([A-Za-z_]\w*)|(\s+)|(.)/g; let m;
  while ((m = re.exec(line))) {
    const [t, com, str, num, call, word] = m; let c = VS.text;
    if (com) c = VS.com; else if (str) c = VS.str; else if (num) c = VS.num;
    else if (call) c = GO_KW.has(call) ? VS.kw : VS.fn;
    else if (word) c = GO_CTL.has(word) ? VS.ctl : GO_KW.has(word) ? VS.kw : /^[A-Z]/.test(word) ? VS.type : VS.id;
    out.push([t, c]);
  }
  return out;
}
function codeScreen() {
  const W = 1024, H = 576, ROWS = 18;
  const tex = drawTexture(W, H, () => {});
  const ctx = tex.image.getContext('2d');
  const total = CODE.reduce((s, l) => s + l.length + 1, 0);
  let typed = 0, hold = 0, blink = 0;
  const tree = [['GODPLAN-ERP', 0, 'open'], ['cmd', 1, 'shut'], ['internal', 1, 'open'], ['db', 2, 'shut'], ['inventory', 2, 'shut'], ['orders', 2, 'open'], ['handler.go', 3, 'go'], ['model.go', 3, 'go'], ['service.go', 3, 'go'], ['web', 1, 'shut'], ['go.mod', 1, 'mod'], ['package.json', 1, 'js'], ['README.md', 1, 'md']];
  const draw = () => {
    ctx.fillStyle = VS.bg; ctx.fillRect(0, 0, W, H);
    // title bar, activity bar, explorer
    ctx.fillStyle = '#3c3c3c'; ctx.fillRect(0, 0, W, 26); ctx.fillStyle = '#cccccc'; ctx.font = `500 13px ${MONO}`; ctx.textAlign = 'center'; ctx.fillText('handler.go - godplan-erp - Visual Studio Code', W / 2, 18); ctx.textAlign = 'left';
    for (const [x, c] of [[14, '#ff5f57'], [32, '#febc2e'], [50, '#28c840']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, 13, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = VS.bar; ctx.fillRect(0, 26, 44, H - 48);
    for (let k = 0; k < 5; k++) { ctx.strokeStyle = k ? '#858585' : '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(13, 44 + k * 46, 18, 18); }
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 40, 2, 30);
    ctx.fillStyle = VS.side; ctx.fillRect(44, 26, 200, H - 48);
    ctx.fillStyle = '#bbbbbb'; ctx.font = `600 11px ${MONO}`; ctx.fillText('EXPLORER', 60, 48);
    tree.forEach(([name, depth, kind], k) => {
      const y = 74 + k * 22, x = 56 + depth * 14; if (name === 'handler.go') { ctx.fillStyle = '#37373d'; ctx.fillRect(44, y - 15, 200, 22); }
      ctx.font = `500 13px ${MONO}`;
      if (kind === 'open' || kind === 'shut') { ctx.fillStyle = '#c5c5c5'; ctx.fillText(kind === 'open' ? 'v' : '>', x, y); ctx.fillText(name, x + 14, y); }
      else { ctx.fillStyle = { go: '#519aba', js: '#cbcb41', mod: '#e37933', md: '#a074c4' }[kind]; ctx.font = `700 11px ${MONO}`; ctx.fillText({ go: 'GO', js: '{}', mod: 'MOD', md: 'MD' }[kind], x, y); ctx.fillStyle = '#cccccc'; ctx.font = `500 13px ${MONO}`; ctx.fillText(name, x + 30, y); }
    });
    // tabs and breadcrumb
    ctx.fillStyle = '#252526'; ctx.fillRect(244, 26, W - 244, 34);
    [['handler.go', true], ['service.go', false], ['model.go', false]].forEach(([n, on], k) => { const x = 244 + k * 140; ctx.fillStyle = on ? VS.bg : VS.tab; ctx.fillRect(x, 26, 139, 34); if (on) { ctx.fillStyle = VS.status; ctx.fillRect(x, 26, 139, 2); } ctx.fillStyle = '#519aba'; ctx.font = `700 11px ${MONO}`; ctx.fillText('GO', x + 10, 48); ctx.fillStyle = on ? '#ffffff' : '#969696'; ctx.font = `500 13px ${MONO}`; ctx.fillText(n, x + 34, 48); });
    ctx.fillStyle = '#a0a0a0'; ctx.font = `500 12px ${MONO}`; ctx.fillText('internal > orders > handler.go > Create', 256, 78);
    // the code typed so far; the view scrolls once the cursor passes the last row
    const lh = 17.5, top = 100, gx = 300;
    let left = typed, curL = 0, curC = 0;
    const shownLen = CODE.map((line) => { const n = Math.max(0, Math.min(line.length, left)); if (left >= 0 && left <= line.length) { curC = n; } left -= line.length + 1; return n; });
    curL = Math.max(0, shownLen.findIndex((n, i) => n < CODE[i].length || i === CODE.length - 1)); if (typed >= total) curL = CODE.length - 1;
    const first = Math.max(0, curL - (ROWS - 3));
    ctx.font = `500 13px ${MONO}`;
    for (let i = first; i < Math.min(CODE.length, first + ROWS, curL + 1); i++) {
      const y = top + (i - first) * lh;
      if (i === curL) { ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(244, y - 13, W - 320, lh); }
      ctx.fillStyle = i === curL ? '#c6c6c6' : VS.dim; ctx.textAlign = 'right'; ctx.fillText(String(i + 1), gx - 14, y); ctx.textAlign = 'left';
      let x = gx; const src = CODE[i].slice(0, shownLen[i]).replace(/\t/g, '    ');
      for (const [t, c] of tokens(src)) { ctx.fillStyle = c; ctx.fillText(t, x, y); x += ctx.measureText(t).width; }
      if (i === curL && blink % 6 < 3) { ctx.fillStyle = '#aeafad'; ctx.fillRect(x + 1, y - 13, 2, 17); }
    }
    // minimap
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(W - 70, 64, 62, 300);
    CODE.forEach((line, i) => { if (!shownLen[i]) return; ctx.fillStyle = 'rgba(200,200,200,0.22)'; ctx.fillRect(W - 66 + line.match(/^\t*/)[0].length * 4, 70 + i * 4, Math.min(52, shownLen[i] * 0.9), 2); });
    // terminal
    const ty = 420; ctx.fillStyle = VS.bg; ctx.fillRect(244, ty, W - 244, H - ty - 22); ctx.fillStyle = '#3c3c3c'; ctx.fillRect(244, ty, W - 244, 1);
    ctx.font = `600 11px ${MONO}`; ['PROBLEMS', 'OUTPUT', 'TERMINAL', 'PORTS'].forEach((t, k) => { ctx.fillStyle = t === 'TERMINAL' ? '#e7e7e7' : '#969696'; ctx.fillText(t, 260 + k * 92, ty + 22); }); ctx.fillStyle = '#e7e7e7'; ctx.fillRect(260 + 2 * 92, ty + 28, 66, 1);
    ctx.font = `500 12px ${MONO}`;
    const term = [['#4ec9b0', 'navy@desk', '#d4d4d4', ' ~/godplan-erp $ go test ./internal/orders/...'], ['#6a9955', 'ok', '#d4d4d4', '    github.com/godplan/erp/internal/orders   0.412s'], ['#4ec9b0', 'navy@desk', '#d4d4d4', ' ~/godplan-erp $ air']];
    term.forEach(([c1, a, c2, b], k) => { const y = ty + 52 + k * 19; ctx.fillStyle = c1; ctx.fillText(a, 260, y); ctx.fillStyle = c2; ctx.fillText(b, 260 + ctx.measureText(a).width, y); });
    ctx.fillStyle = '#d4d4d4'; ctx.fillText('watching .go files, rebuilding on save', 260, ty + 109); if (blink % 6 < 3) ctx.fillRect(260, ty + 116, 8, 14);
    // status bar
    ctx.fillStyle = VS.status; ctx.fillRect(0, H - 22, W, 22); ctx.fillStyle = '#ffffff'; ctx.font = `500 12px ${MONO}`;
    ctx.fillText('main*    0 errors  0 warnings', 12, H - 7); ctx.textAlign = 'right'; ctx.fillText(`Ln ${curL + 1}, Col ${curC + 1}    Tab Size: 4    UTF-8    LF    Go 1.22`, W - 12, H - 7); ctx.textAlign = 'left';
    tex.needsUpdate = true;
  };
  // a few characters per step; a pause when the file is done, then it starts over
  const step = () => { blink++; if (typed >= total) { if (++hold > 45) { typed = 0; hold = 0; } return; } typed = Math.min(total, typed + 1 + Math.floor(Math.random() * 3)); };
  return { tex, draw, step };
}

// a sticker on the back of the side screens
function backNoteTexture() {
  return drawTexture(512, 80, (ctx, w, h) => { ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#b8b2a8'; ctx.font = `600 44px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('nothing here bro', w / 2, h / 2 + 2); });
}

// where the cables plug in, in world coordinates (for app/cables): each panel's video and power ports, and the pole
const toWorld = (p, [x0, y0, z]) => { const r = p.rz || 0, x = x0 * Math.cos(r) - y0 * Math.sin(r), y = x0 * Math.sin(r) + y0 * Math.cos(r), c = Math.cos(p.ry), s = Math.sin(p.ry); return [p.pos[0] + x * c + z * s, p.pos[1] + y, p.pos[2] - x * s + z * c]; };
export const MONITOR_PORTS = Object.fromEntries(layout().map((p) => [p.id, { video: toWorld(p, [1.6, -5.95, -1.55]), power: toWorld(p, [4.2, -5.95, -1.55]) }]));
// the stand base: two stacked plates (half-width x, z range, top y) and the collar at the pole foot
export const MONITOR_BASE = { lo: { x: 7.5, z: [POLE[1] - 3.25, POLE[1] + 3.25], y: 0.7 }, hi: { x: 6.3, z: [POLE[1] - 2.5, POLE[1] + 2.5], y: 1.025 }, collar: 1.6 };
export const MONITOR_POLE = { x: POLE[0], z: POLE[1], y0: 0.7, y1: CY + 3, r: 0.8, clipsZ: POLE[1] - 1.3 };

// ---------- build
/** portfolioMaterial: the portfolio screen's material (owned by world.js). Returns { root, portfolio, portfolioPos, portfolioNormal, setLevel, update }. */
export function buildMonitors(portfolioMaterial) {
  const root = new Node('monitors');
  const housing = new Material({ color: color('#141210'), roughness: 0.42, metalness: 0.45, emissive: color('#141210').map((v) => v * 0.4) });
  const back = new Material({ color: color('#1b1815'), roughness: 0.6, metalness: 0.25 });
  const alu = new Material({ color: color('#8f8a84'), roughness: 0.34, metalness: 0.8, emissive: color('#1a1816') });
  const ledMat = new Material({ color: [0, 0, 0], emissive: color('#ffb066'), emissiveIntensity: 1.4, unlit: true });
  const design = designScreen(), code = codeScreen();
  const screenMats = { left: new Material({ color: [1, 1, 1], unlit: true, map: design.tex }), center: new Material({ color: [1, 1, 1], unlit: true, map: code.tex }) };
  const dark = new Material({ color: color('#0a0909'), roughness: 0.8 });
  const port = new Material({ color: color('#6d6a66'), roughness: 0.3, metalness: 0.8 });
  const rubber = new Material({ color: color('#0e0d0c'), roughness: 0.95 });
  const note = new Material({ color: [1, 1, 1], map: backNoteTexture(), emissive: [0.1, 0.095, 0.085], emissiveMap: backNoteTexture(), transparent: true, depthWrite: false, roughness: 0.7 });
  const panels = layout();
  let portfolio = null;
  for (const p of panels) {
    const g = new Node('monitor:' + p.id); g.position = p.pos; g.rotation = [0, p.ry, p.rz || 0]; root.add(g);
    const add = (geo, mat, pos, rot) => { const m = new Mesh(geo, mat); m.position = pos; if (rot) m.rotation = rot; g.add(m); return m; };
    // front: slim bezel, a chin with a small brushed bar and the power LED
    add(roundedBox({ w: HOUSING.w, h: HOUSING.h, d: HOUSING.d, r: 0.22, seg: 3 }), housing, [0, -0.25, 0]);
    add(box(2.2, 0.1, 0.02), alu, [0, -8.95, HOUSING.d / 2 + 0.01]).castShadow = false;
    add(sphere(0.09, 8, 6), ledMat, [HOUSING.w / 2 - 1.2, -9.0, HOUSING.d / 2 + 0.01]).castShadow = false;
    // back: a tapered shell, the electronics bump with vents, the VESA plate and its four bolts
    add(roundedBox({ w: HOUSING.w - 1.6, h: HOUSING.h - 1.6, d: 0.9, r: 0.4, seg: 3 }), back, [0, -0.25, -0.75]);
    add(roundedBox({ w: 19, h: 12, d: 1.9, r: 0.7, seg: 3 }), back, [0, 0.2, -1.55]);
    for (let k = -7; k <= 7; k++) add(box(0.28, 2.4, 0.06), dark, [k * 1.05, 4.4, -2.5]).castShadow = false;
    add(box(7, 7, 0.35), alu, [0, 0.2, -2.67]);
    for (const [bx, by] of [[-2.56, -2.36], [2.56, -2.36], [-2.56, 2.76], [2.56, 2.76]]) add(cylinder(0.32, 0.32, 0.22, 12), port, [bx, by, -2.92], [Math.PI / 2, 0, 0]);
    // ports along the underside of the bump: power, DisplayPort, HDMI, USB-C, USB-A
    add(box(10.4, 0.08, 1.5), dark, [0, -5.84, -1.55]).castShadow = false;
    for (const [px, w2, d2] of [[4.2, 0.9, 0.9], [1.6, 0.85, 0.4], [-0.3, 0.75, 0.32], [-2.0, 0.45, 0.2], [-3.6, 0.6, 0.28]]) add(box(w2, 0.1, d2), port, [px, -5.9, -1.55]).castShadow = false;
    add(cylinder(0.3, 0.3, 0.5, 12), rubber, [-1.5, -9.75, -0.1]); // the menu joystick under the chin
    // something to find if you look behind the side screens
    // (on the portrait panel the sticker is turned back level and sits low on the back, clear of the vents and the VESA plate)
    if (p.id !== 'center') { const n = p.rz ? add(box(6.5, 1.02, 0.02), note, [-4.6, -0.6, -2.53], [0, 0, -p.rz]) : add(box(11, 1.65, 0.02), note, [0, -3.95, -2.53]); n.castShadow = false; n.renderOrder = 11; }
    const mat = p.id === 'right' ? portfolioMaterial : screenMats[p.id];
    const scr = add(box(SCREEN.w, SCREEN.h, 0.02), mat, [0, 0.2, HOUSING.d / 2 + 0.012]); scr.castShadow = false; scr.name = 'monitor-screen:' + p.id;
    if (p.id === 'right') { portfolio = scr; scr.pickable = true; }
  }
  // the stand: stepped weighted base, pole with collars and cable clips, a crossbar arm to each panel with a tilt knuckle
  const st = (geo, pos, rot, m2 = alu) => { const m = new Mesh(geo, m2); m.position = pos; if (rot) m.rotation = rot; root.add(m); return m; };
  st(roundedBox({ w: 15, h: 0.7, d: 6.5, r: 0.3, seg: 3 }), [POLE[0], 0.35, POLE[1]]);
  st(roundedBox({ w: 12.6, h: 0.35, d: 5, r: 0.3, seg: 3 }), [POLE[0], 0.85, POLE[1]], null, housing);
  st(cylinder(1.4, 1.6, 0.9, 32), [POLE[0], 1.4, POLE[1]]);
  st(cylinder(0.75, 0.85, CY + 3, 24), [POLE[0], (CY + 3) / 2, POLE[1]]);
  st(cylinder(0.85, 0.85, 0.12, 24), [POLE[0], CY + 3.02, POLE[1]], null, housing);
  st(cylinder(1.1, 1.1, 1.6, 24), [POLE[0], CY + 0.2, POLE[1]]);
  st(cylinder(0.95, 0.95, 0.5, 24), [POLE[0], CY - 1.0, POLE[1]], null, housing);
  for (const y of [4.5, 8.5, 12.5]) st(roundedBox({ w: 1.2, h: 0.6, d: 0.7, r: 0.15, seg: 2 }), [POLE[0], y, POLE[1] - 0.95], null, housing);
  const beam = (a, b, t = 0.9) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ry = -Math.atan2(dz, dx), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    st(roundedBox({ w: len, h: t, d: t, r: 0.25, seg: 2 }), [mid[0], CY + 0.2, mid[1]], [0, ry, 0]);
    st(roundedBox({ w: len - 1.2, h: 0.18, d: t * 0.6, r: 0.06, seg: 1 }), [mid[0], CY + 0.2 + t / 2 + 0.02, mid[1]], [0, ry, 0], housing);
    st(cylinder(0.75, 0.75, t + 0.3, 16), [b[0], CY + 0.2, b[1]]);
    st(cylinder(0.8, 0.8, 0.12, 16), [b[0], CY + 0.2 + t / 2 + 0.2, b[1]], null, housing);
  };
  for (const p of panels) {
    const mount = [p.pos[0] - Math.sin(p.ry) * 3.6, p.pos[2] - Math.cos(p.ry) * 3.6];
    if (p.id === 'center') beam(POLE, mount); else { const elbow = [Math.sign(p.pos[0]) * 13, POLE[1] + 0.6]; beam(POLE, elbow); beam(elbow, mount); }
    // tilt knuckle between the arm and the VESA plate
    st(cylinder(0.55, 0.55, 2.4, 16), [p.pos[0] - Math.sin(p.ry) * 3.25, CY + 0.2, p.pos[2] - Math.cos(p.ry) * 3.25], [Math.PI / 2, p.ry + Math.PI / 2, 0]);
  }
  root.traverse((n) => { if (n.geometry && (n.material === alu || n.material === back || n.material === housing)) n.castShadow = true; });
  // Redrawing a canvas and re-uploading it is the expensive part, so each screen refreshes a few times a second, never
  // both in the same frame, and both slow down further when frames run long (an EMA of the frame time).
  let lastType = -1, lastScroll = -1, lastT = 0, slow = 0.016, turn = 0;
  design.draw(0); code.draw();
  const update = (time) => {
    const dt = Math.min(0.25, Math.max(0, time - lastT)); lastT = time; slow += (dt - slow) * 0.05;
    const k = slow > 0.024 ? 2 : 1;
    turn ^= 1;
    if (turn && time - lastType >= 0.15 * k) { lastType = time; code.step(); code.step(); code.draw(); }
    else if (!turn && time - lastScroll >= 0.16 * k) { lastScroll = time; design.draw(time); }
  };
  const setLevel = (v) => { for (const m of Object.values(screenMats)) m.color = [v, v, v]; ledMat.emissiveIntensity = 0.3 + v * 1.1; };
  // the portfolio screen's centre and facing, for the camera stages in world.js
  const rp = panels.find((p) => p.id === 'right'), portfolioPos = toWorld(rp, [0, 0.2, HOUSING.d / 2 + 0.012]), portfolioNormal = [Math.sin(rp.ry), 0, Math.cos(rp.ry)];
  flatten(root, 'monitors');
  return { root, portfolio, portfolioPos, portfolioNormal, setLevel, update };
}
