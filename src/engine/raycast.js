import { M4, V3 } from 'engine/math';

const inv = M4.create(), _o = [0, 0, 0], _d = [0, 0, 0];

/** Build a world-space ray from NDC coords. */
export function rayFromCamera(camera, ndcX, ndcY) {
  const near = V3.transformMat4([0, 0, 0], [ndcX, ndcY, -1], camera.invViewProj);
  const far = V3.transformMat4([0, 0, 0], [ndcX, ndcY, 1], camera.invViewProj);
  const dir = V3.normalize([0, 0, 0], V3.sub([0, 0, 0], far, near));
  return { origin: near, dir };
}

/** Ray vs mesh local AABB (transformed into mesh space → OBB test). Returns distance or -1. */
export function intersectMesh(ray, mesh) {
  const b = mesh.geometry.bounds;
  M4.invert(inv, mesh.worldMatrix);
  const o = V3.transformMat4(_o, ray.origin, inv);
  const d = V3.transformDir(_d, ray.dir, inv);
  let tmin = -Infinity, tmax = Infinity;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) { if (o[i] < b.min[i] || o[i] > b.max[i]) return -1; continue; }
    let t1 = (b.min[i] - o[i]) / d[i], t2 = (b.max[i] - o[i]) / d[i];
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return -1;
  }
  // a box the ray starts inside is not picked: from inside, every ray would hit it, and one hit volume would swallow every click
  // an affine map keeps the ray parameter (local o + d·t is world origin + dir·t) and dir is unit length, so t is already the world distance
  return tmin < 0 ? -1 : tmin;
}

/** Pick the closest mesh among candidates. */
export function pick(ray, meshes) {
  let best = null, bestD = Infinity;
  for (const m of meshes) {
    if (!m.visible || m._hidden) continue;
    const d = intersectMesh(ray, m);
    if (d >= 0 && d < bestD) { bestD = d; best = m; }
  }
  return best ? { mesh: best, distance: bestD } : null;
}
