// Procedural geometry generators. All return { positions, normals, uvs, indices, bounds }.

function finish(pos, nor, uv, idx) {
  const positions = new Float32Array(pos);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const v = positions[i + k];
      if (v < min[k]) min[k] = v;
      if (v > max[k]) max[k] = v;
    }
  }
  return {
    positions,
    normals: new Float32Array(nor),
    uvs: new Float32Array(uv),
    indices: positions.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx),
    bounds: { min, max },
  };
}

/**
 * Rounded box with optional taper (keycap-like) and optional top dish.
 * w,h,d: full size. r: corner radius. seg: arc samples per corner.
 * taper: top-face scale relative to bottom (1 = straight). dish: depth of concave top.
 */
export function roundedBox({ w = 1, h = 1, d = 1, r = 0.1, seg = 3, taper = 1, dish = 0, uvTopOnly = true } = {}) {
  const pos = [], nor = [], uv = [], idx = [];
  const hw = w / 2, hh = h / 2, hd = d / 2;
  r = Math.min(r, hw, hh, hd);
  // sample positions along an axis: flat + arc bands
  function samples(half) {
    const s = [-half];
    for (let i = 1; i < seg; i++) s.push(-half + r * (1 - Math.cos((i / seg) * (Math.PI / 2))));
    s.push(-(half - r));
    s.push(half - r);
    for (let i = seg - 1; i >= 1; i--) s.push(half - r * (1 - Math.cos((i / seg) * (Math.PI / 2))));
    s.push(half);
    return s;
  }
  const sx = samples(hw), sy = samples(hh), sz = samples(hd);
  const innerW = hw - r, innerH = hh - r, innerD = hd - r;
  const tmp = [0, 0, 0];
  function push(p, faceN, u, v) {
    // round: clamp to inner box, push out by r
    const ix = Math.max(-innerW, Math.min(innerW, p[0]));
    const iy = Math.max(-innerH, Math.min(innerH, p[1]));
    const iz = Math.max(-innerD, Math.min(innerD, p[2]));
    let nx = p[0] - ix, ny = p[1] - iy, nz = p[2] - iz;
    const l = Math.hypot(nx, ny, nz);
    let px, py, pz;
    if (l > 1e-6) { nx /= l; ny /= l; nz /= l; px = ix + nx * r; py = iy + ny * r; pz = iz + nz * r; }
    else { nx = faceN[0]; ny = faceN[1]; nz = faceN[2]; px = p[0]; py = p[1]; pz = p[2]; }
    // taper: scale x,z with height
    if (taper !== 1) {
      const t = (py + hh) / h; // 0 bottom .. 1 top
      const s = 1 + (taper - 1) * t;
      px *= s; pz *= s;
      // adjust normal for slanted sides (approximate): blend in upward component
      const slant = (1 - taper) * (hw / h);
      if (Math.abs(ny) < 0.99) { ny += slant * Math.hypot(nx, nz); const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl; }
    }
    if (dish > 0 && faceN[1] > 0.5 && Math.abs(ny) > 0.95) {
      const dx = px / (hw * taper), dz = pz / (hd * taper);
      const rr = Math.min(1, dx * dx + dz * dz);
      py -= dish * (1 - rr) ;
    }
    pos.push(px, py, pz);
    nor.push(nx, ny, nz);
    uv.push(u, v);
    return pos.length / 3 - 1;
  }
  function face(axis, sign, a, b) {
    // axis: 0=x,1=y,2=z ; a,b sample arrays for the two other axes
    const faceN = [0, 0, 0]; faceN[axis] = sign;
    const half = axis === 0 ? hw : axis === 1 ? hh : hd;
    const base = pos.length / 3;
    const cols = a.length, rows = b.length;
    const aSpan = a[cols - 1] - a[0] || 1, bSpan = b[rows - 1] - b[0] || 1;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const p = [0, 0, 0];
        p[axis] = sign * half;
        const [ax1, ax2] = axis === 0 ? [2, 1] : axis === 1 ? [0, 2] : [0, 1];
        p[ax1] = a[i]; p[ax2] = b[j];
        // position-based UVs (samples are non-uniform near rounded edges)
        let u = (a[i] - a[0]) / aSpan, v = (b[j] - b[0]) / bSpan;
        if (axis === 1 && sign > 0) v = 1 - v;       // top face: +x right, -z up
        if (axis === 2 && sign < 0) u = 1 - u;       // back face mirrored
        if (axis === 0 && sign > 0) u = 1 - u;
        if (uvTopOnly && !(axis === 1 && sign > 0)) { u = 0.02; v = 0.02; }
        push(p, faceN, u, v);
      }
    }
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const q = base + j * cols + i;
        const flip = (axis === 0 && sign < 0) || (axis === 1 && sign > 0) || (axis === 2 && sign < 0);
        if (flip) idx.push(q, q + cols, q + 1, q + 1, q + cols, q + cols + 1);
        else idx.push(q, q + 1, q + cols, q + 1, q + cols + 1, q + cols);
      }
    }
  }
  face(0, 1, sz, sy); face(0, -1, sz, sy);
  face(1, 1, sx, sz); face(1, -1, sx, sz);
  face(2, 1, sx, sy); face(2, -1, sx, sy);
  const g = finish(pos, nor, uv, idx);
  // fix winding by checking normal vs face orientation: recompute via cross product and flip if needed
  fixWinding(g);
  return g;
}

function fixWinding(g) {
  const p = g.positions, n = g.normals, id = g.indices;
  for (let i = 0; i < id.length; i += 3) {
    const a = id[i] * 3, b = id[i + 1] * 3, c = id[i + 2] * 3;
    const e1 = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]];
    const e2 = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
    const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0];
    const nx = n[a] + n[b] + n[c], ny = n[a + 1] + n[b + 1] + n[c + 1], nz = n[a + 2] + n[b + 2] + n[c + 2];
    if (cx * nx + cy * ny + cz * nz < 0) { const t = id[i + 1]; id[i + 1] = id[i + 2]; id[i + 2] = t; }
  }
}

export function box(w = 1, h = 1, d = 1) {
  return roundedBox({ w, h, d, r: 0, seg: 1, uvTopOnly: false });
}

export function plane(w = 1, d = 1, segs = 1) {
  const pos = [], nor = [], uv = [], idx = [];
  for (let j = 0; j <= segs; j++) for (let i = 0; i <= segs; i++) {
    pos.push((i / segs - 0.5) * w, 0, (j / segs - 0.5) * d);
    nor.push(0, 1, 0); uv.push(i / segs, 1 - j / segs);
  }
  for (let j = 0; j < segs; j++) for (let i = 0; i < segs; i++) {
    const q = j * (segs + 1) + i;
    idx.push(q, q + segs + 1, q + 1, q + 1, q + segs + 1, q + segs + 2);
  }
  return finish(pos, nor, uv, idx);
}

export function sphere(radius = 1, ws = 24, hs = 16) {
  const pos = [], nor = [], uv = [], idx = [];
  for (let y = 0; y <= hs; y++) {
    const v = y / hs, phi = v * Math.PI;
    for (let x = 0; x <= ws; x++) {
      const u = x / ws, theta = u * Math.PI * 2;
      const nx = -Math.cos(theta) * Math.sin(phi), ny = Math.cos(phi), nz = Math.sin(theta) * Math.sin(phi);
      pos.push(nx * radius, ny * radius, nz * radius); nor.push(nx, ny, nz); uv.push(u, 1 - v);
    }
  }
  for (let y = 0; y < hs; y++) for (let x = 0; x < ws; x++) {
    const a = y * (ws + 1) + x, b = a + ws + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = finish(pos, nor, uv, idx); fixWinding(g); return g;
}

export function cylinder(rTop = 1, rBottom = 1, height = 1, radial = 24, caps = true) {
  const pos = [], nor = [], uv = [], idx = [];
  const hh = height / 2;
  const slope = (rBottom - rTop) / height;
  for (let y = 0; y <= 1; y++) {
    const r = y === 0 ? rBottom : rTop;
    for (let i = 0; i <= radial; i++) {
      const t = (i / radial) * Math.PI * 2;
      const c = Math.cos(t), s = Math.sin(t);
      pos.push(r * c, y === 0 ? -hh : hh, r * s);
      const nl = Math.hypot(1, slope);
      nor.push(c / nl, slope / nl, s / nl); uv.push(i / radial, y);
    }
  }
  for (let i = 0; i < radial; i++) idx.push(i, i + radial + 1, i + 1, i + 1, i + radial + 1, i + radial + 2);
  if (caps) {
    for (const [r, yv, ny] of [[rTop, hh, 1], [rBottom, -hh, -1]]) {
      const center = pos.length / 3;
      pos.push(0, yv, 0); nor.push(0, ny, 0); uv.push(0.5, 0.5);
      for (let i = 0; i <= radial; i++) {
        const t = (i / radial) * Math.PI * 2;
        pos.push(r * Math.cos(t), yv, r * Math.sin(t)); nor.push(0, ny, 0);
        uv.push(0.5 + 0.5 * Math.cos(t), 0.5 + 0.5 * Math.sin(t));
      }
      for (let i = 0; i < radial; i++) idx.push(center, center + 1 + i, center + 2 + i);
    }
  }
  const g = finish(pos, nor, uv, idx); fixWinding(g); return g;
}

export function torus(R = 1, r = 0.3, radial = 24, tubular = 12, arc = Math.PI * 2) {
  const pos = [], nor = [], uv = [], idx = [];
  for (let j = 0; j <= tubular; j++) for (let i = 0; i <= radial; i++) {
    const u = (i / radial) * arc, v = (j / tubular) * Math.PI * 2;
    const cx = R * Math.cos(u), cz = R * Math.sin(u);
    const x = (R + r * Math.cos(v)) * Math.cos(u), y = r * Math.sin(v), z = (R + r * Math.cos(v)) * Math.sin(u);
    pos.push(x, y, z);
    const n = [x - cx, y, z - cz]; const l = Math.hypot(...n) || 1;
    nor.push(n[0] / l, n[1] / l, n[2] / l); uv.push(i / radial, j / tubular);
  }
  for (let j = 0; j < tubular; j++) for (let i = 0; i < radial; i++) {
    const a = j * (radial + 1) + i, b = a + radial + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = finish(pos, nor, uv, idx); fixWinding(g); return g;
}

export function cone(radius = 1, height = 1, radial = 4) {
  return cylinder(0.0001, radius, height, radial, true);
}

/** Merge multiple geometries with per-part transforms [{geo, m4}] */
export function merge(parts) {
  const pos = [], nor = [], uv = [], idx = [];
  let offset = 0;
  for (const { geo, m, n } of parts) {
    const p = geo.positions, nn = geo.normals;
    for (let i = 0; i < p.length; i += 3) {
      const x = p[i], y = p[i + 1], z = p[i + 2];
      if (m) {
        pos.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]);
        const nx = nn[i], ny = nn[i + 1], nz = nn[i + 2];
        const ox = n[0] * nx + n[3] * ny + n[6] * nz, oy = n[1] * nx + n[4] * ny + n[7] * nz, oz = n[2] * nx + n[5] * ny + n[8] * nz;
        const l = Math.hypot(ox, oy, oz) || 1; nor.push(ox / l, oy / l, oz / l);
      } else { pos.push(x, y, z); nor.push(nn[i], nn[i + 1], nn[i + 2]); }
    }
    for (let i = 0; i < geo.uvs.length; i++) uv.push(geo.uvs[i]);
    for (let i = 0; i < geo.indices.length; i++) idx.push(geo.indices[i] + offset);
    offset += p.length / 3;
  }
  return finish(pos, nor, uv, idx);
}
