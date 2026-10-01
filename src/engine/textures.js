import { Texture } from 'engine/scene';

export const MONO = '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace';
export const SANS = '"Space Grotesk", "Inter", system-ui, sans-serif';

export function canvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

/**
 * Keycap legend. Returns { map, emissiveMap }.
 * map: white background with legend darkened (multiplies base color), used on light keys.
 * emissiveMap: black background with legend white, used on dark keys for backlit legends.
 * One drawing makes both, so the printed ink and the backlit glow line up exactly. The canvas follows the shape of the cap's
 * top (aspect = its width over its depth), so a wide cap's legend is not stretched; single characters are big, every word
 * shares one size and weight; the four arrows are one vector triangle, the same size whichever way they point.
 */
const ARROWS = { '▲': 0, '▶': 1, '▼': 2, '◀': 3 };
const legendWidth = (aspect) => Math.min(1024, Math.round(256 * Math.max(1, aspect)));
function drawLegend(ctx, W, S, label, { sub, size, align, icon }, color) {
  ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.textBaseline = 'middle';
  const cy = sub ? S * 0.42 : S * 0.5, x = align === 'center' ? W / 2 : 34;
  if (label in ARROWS) {
    const r = S * 0.15 * size, a = ARROWS[label] * (Math.PI / 2) - Math.PI / 2;
    ctx.beginPath(); for (let k = 0; k < 3; k++) { const t = a + k * ((2 * Math.PI) / 3); ctx.lineTo(W / 2 + Math.cos(t) * r, cy + Math.sin(t) * r); } ctx.closePath(); ctx.fill();
  } else if (label) {
    ctx.font = `600 ${([...label].length <= 1 ? 96 : 44) * size}px ${MONO}`; ctx.textAlign = align === 'center' ? 'center' : 'left';
    ctx.fillText(label, x, cy);
  }
  if (sub) { ctx.font = `600 ${26 * size}px ${MONO}`; ctx.textAlign = align === 'center' ? 'center' : 'left'; ctx.fillText(sub, x, S * 0.66); }
  if (icon) { ctx.save(); ctx.translate((W - S) / 2, 0); icon(ctx, S, color); ctx.restore(); }
}
export function legendTexture(label, { sub = null, size = 1, dark = true, icon = null, align = 'center', aspect = 1 } = {}) {
  const S = 256, W = legendWidth(aspect), o = { sub, size, align, icon };
  const [c, ctx] = canvas(W, S); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, S); drawLegend(ctx, W, S, label, o, dark ? 'rgba(150,140,125,1)' : 'rgba(40,30,20,1)');
  const [e, ectx] = canvas(W, S); ectx.fillStyle = '#000'; ectx.fillRect(0, 0, W, S); drawLegend(ectx, W, S, label, o, '#fff');
  return { map: new Texture(c), emissiveMap: new Texture(e, { srgb: false }) };
}

/** Subtle noise / grain texture for desk & plate. */
export function noiseTexture(size = 256, base = [24, 25, 30], amount = 10, lines = false) {
  const [c, ctx] = canvas(size, size);
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    img.data[i] = base[0] + n; img.data[i + 1] = base[1] + n; img.data[i + 2] = base[2] + n; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  if (lines) {
    ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1;
    for (let y = 0; y < size; y += 16) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(size, y + 0.5); ctx.stroke(); }
    for (let x = 0; x < size; x += 16) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, size); ctx.stroke(); }
  }
  return new Texture(c, { repeat: true });
}

/** Generic drawn texture from a callback. */
export function drawTexture(w, h, fn, opts = {}) {
  const [c, ctx] = canvas(w, h);
  fn(ctx, w, h);
  return new Texture(c, opts);
}

/** Small engraved icons for the special keys. */
const ln = (ctx, S) => { ctx.lineWidth = S * 0.035; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; };
export const ICONS = {
  about: (ctx, S, c) => { ln(ctx, S); ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(S / 2, S * 0.38, S * 0.11, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(S / 2, S * 0.8, S * 0.22, Math.PI, 0); ctx.stroke(); },
  skills: (ctx, S, c) => { ln(ctx, S); ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(S / 2, S * 0.42, S * 0.15, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke(); ctx.beginPath(); ctx.moveTo(S * 0.42, S * 0.66); ctx.lineTo(S * 0.58, S * 0.66); ctx.moveTo(S * 0.44, S * 0.74); ctx.lineTo(S * 0.56, S * 0.74); ctx.stroke(); },
  contact: (ctx, S, c) => { ln(ctx, S); ctx.strokeStyle = c; ctx.strokeRect(S * 0.26, S * 0.34, S * 0.48, S * 0.32); ctx.beginPath(); ctx.moveTo(S * 0.26, S * 0.34); ctx.lineTo(S * 0.5, S * 0.52); ctx.lineTo(S * 0.74, S * 0.34); ctx.stroke(); },
  work: (ctx, S, c) => { ln(ctx, S); ctx.strokeStyle = c; ctx.strokeRect(S * 0.24, S * 0.3, S * 0.52, S * 0.32); ctx.beginPath(); ctx.moveTo(S * 0.4, S * 0.72); ctx.lineTo(S * 0.6, S * 0.72); ctx.moveTo(S * 0.5, S * 0.62); ctx.lineTo(S * 0.5, S * 0.72); ctx.stroke(); },
  time: (ctx, S, c) => { ln(ctx, S); ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.2, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(S / 2, S * 0.36); ctx.lineTo(S / 2, S / 2); ctx.lineTo(S * 0.62, S * 0.58); ctx.stroke(); },
  cup: (ctx, S, c) => { ln(ctx, S); ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(S * 0.3, S * 0.4); ctx.lineTo(S * 0.34, S * 0.7); ctx.lineTo(S * 0.6, S * 0.7); ctx.lineTo(S * 0.64, S * 0.4); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(S * 0.66, S * 0.53, S * 0.08, -Math.PI / 2, Math.PI / 2); ctx.stroke(); for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(S * (0.42 + i * 0.1), S * 0.32); ctx.quadraticCurveTo(S * (0.46 + i * 0.1), S * 0.26, S * (0.42 + i * 0.1), S * 0.2); ctx.stroke(); } },
  leaf: (ctx, S, c) => { ln(ctx, S); ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(S * 0.3, S * 0.72); ctx.quadraticCurveTo(S * 0.28, S * 0.3, S * 0.72, S * 0.28); ctx.quadraticCurveTo(S * 0.72, S * 0.72, S * 0.3, S * 0.72); ctx.stroke(); ctx.beginPath(); ctx.moveTo(S * 0.3, S * 0.72); ctx.lineTo(S * 0.62, S * 0.38); ctx.stroke(); },
  bread: (ctx, S, c) => { ln(ctx, S); ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(S * 0.26, S * 0.66); ctx.lineTo(S * 0.26, S * 0.46); ctx.quadraticCurveTo(S * 0.5, S * 0.22, S * 0.74, S * 0.46); ctx.lineTo(S * 0.74, S * 0.66); ctx.closePath(); ctx.stroke(); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(S * (0.36 + i * 0.12), S * 0.4); ctx.lineTo(S * (0.4 + i * 0.12), S * 0.5); ctx.stroke(); } },
  cat: (ctx, S, c) => { ln(ctx, S); ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(S * 0.3, S * 0.34); ctx.lineTo(S * 0.32, S * 0.66); ctx.quadraticCurveTo(S * 0.5, S * 0.78, S * 0.68, S * 0.66); ctx.lineTo(S * 0.7, S * 0.34); ctx.lineTo(S * 0.6, S * 0.44); ctx.lineTo(S * 0.4, S * 0.44); ctx.closePath(); ctx.stroke(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(S * 0.43, S * 0.55, S * 0.02, 0, 7); ctx.arc(S * 0.57, S * 0.55, S * 0.02, 0, 7); ctx.fill(); },
  bookmark: (ctx, S, c) => { ln(ctx, S); ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(S * 0.34, S * 0.26); ctx.lineTo(S * 0.66, S * 0.26); ctx.lineTo(S * 0.66, S * 0.74); ctx.lineTo(S * 0.5, S * 0.62); ctx.lineTo(S * 0.34, S * 0.74); ctx.closePath(); ctx.stroke(); },
  num: (n) => (ctx, S, c) => { ctx.fillStyle = c; ctx.font = `600 ${S * 0.16}px ${MONO}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(n, S * 0.12, S * 0.1); },
};
/** Keycap with an icon (+ optional tiny caption). Returns { map, emissiveMap }. */
export function iconLegendTexture(icon, caption, { dark = true, aspect = 1 } = {}) {
  const S = 256, W = legendWidth(aspect);
  // the icon keeps its square drawing area, centred on a wide cap
  const draw = (ctx, col) => { ctx.save(); ctx.translate((W - S) / 2, 0); icon(ctx, S, col); ctx.restore(); if (caption) { ctx.fillStyle = col; ctx.font = `600 22px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(caption, W / 2, S * 0.9); } };
  const [c, ctx] = canvas(W, S); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, S); draw(ctx, dark ? 'rgba(150,140,125,1)' : 'rgba(40,30,20,1)');
  const [e, ectx] = canvas(W, S); ectx.fillStyle = '#000'; ectx.fillRect(0, 0, W, S); draw(ectx, '#fff');
  return { map: new Texture(c), emissiveMap: new Texture(e, { srgb: false }) };
}
