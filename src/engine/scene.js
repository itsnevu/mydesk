import { M4, V3 } from 'engine/math';

let uid = 0;

export class Node {
  constructor(name = '') {
    this.id = uid++;
    this.name = name;
    this.position = [0, 0, 0];
    this.rotation = [0, 0, 0]; // euler XYZ radians
    this.scale = [1, 1, 1];
    this.children = [];
    this.parent = null;
    this.visible = true;
    this.matrix = M4.create();
    this.worldMatrix = M4.create();
    this.userData = {};
  }
  add(...nodes) { for (const n of nodes) { if (n.parent) n.parent.remove(n); n.parent = this; this.children.push(n); } return this; }
  remove(n) { const i = this.children.indexOf(n); if (i >= 0) { this.children.splice(i, 1); n.parent = null; } return this; }
  traverse(fn) { fn(this); for (const c of this.children) c.traverse(fn); }
  updateWorld(parentMatrix) {
    M4.compose(this.matrix, this.position, this.rotation, this.scale);
    if (parentMatrix) M4.multiply(this.worldMatrix, parentMatrix, this.matrix);
    else M4.copy(this.worldMatrix, this.matrix);
    for (const c of this.children) c.updateWorld(this.worldMatrix);
  }
  getWorldPosition(out = [0, 0, 0]) { out[0] = this.worldMatrix[12]; out[1] = this.worldMatrix[13]; out[2] = this.worldMatrix[14]; return out; }
  localToWorld(p, out = [0, 0, 0]) { return V3.transformMat4(out, p, this.worldMatrix); }
}

export class Material {
  constructor(o = {}) {
    this.color = o.color ?? [1, 1, 1];
    this.roughness = o.roughness ?? 0.6;
    this.metalness = o.metalness ?? 0;
    this.emissive = o.emissive ?? [0, 0, 0];
    this.emissiveIntensity = o.emissiveIntensity ?? 1;
    this.map = o.map ?? null;
    this.emissiveMap = o.emissiveMap ?? null;
    this.opacity = o.opacity ?? 1;
    this.transparent = o.transparent ?? false;
    this.doubleSide = o.doubleSide ?? false;
    this.unlit = o.unlit ?? false;
    this.fresnel = o.fresnel ?? 0;
    this.fresnelColor = o.fresnelColor ?? [1, 1, 1];
    this.depthWrite = o.depthWrite ?? true;
    this.receiveShadow = o.receiveShadow ?? true;
    this.mapRepeat = o.mapRepeat ?? [1, 1];
    this.fog = o.fog ?? true; // false: things that must stay crisp in the distance (a city through a window) ignore the fog
  }
}

export class Mesh extends Node {
  constructor(geometry, material, name = '') {
    super(name);
    this.geometry = geometry;
    this.material = material;
    this.castShadow = true;
    this.renderOrder = 0;
    this.pickable = false;
  }
}

export class Texture {
  constructor(image, o = {}) {
    this.image = image;
    this.needsUpdate = true;
    this.srgb = o.srgb ?? true;
    this.repeat = o.repeat ?? false;
    this.flipY = o.flipY ?? true;
    this.mipmaps = o.mipmaps ?? true;
    this.gl = null; // handle
  }
}

export class Camera {
  constructor(fov = 45, aspect = 1, near = 0.1, far = 200) {
    this.fov = fov; this.aspect = aspect; this.near = near; this.far = far;
    this.position = [0, 5, 10];
    this.target = [0, 0, 0];
    this.up = [0, 1, 0];
    this.view = M4.create();
    this.proj = M4.create();
    this.viewProj = M4.create();
    this.invViewProj = M4.create();
  }
  update() {
    M4.perspective(this.proj, (this.fov * Math.PI) / 180, this.aspect, this.near, this.far);
    M4.lookAt(this.view, this.position, this.target, this.up);
    M4.multiply(this.viewProj, this.proj, this.view);
    M4.invert(this.invViewProj, this.viewProj);
  }
  /** project world point to NDC */
  project(p, out = [0, 0, 0]) { return V3.transformMat4(out, p, this.viewProj); }
}
