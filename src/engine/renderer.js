import { M4, V3 } from 'engine/math';
import { Mesh } from 'engine/scene';

const VERT = `#version 300 es
precision highp float;
in vec3 position; in vec3 normal; in vec2 uv;
uniform mat4 uModel; uniform mat3 uNormalMat; uniform mat4 uViewProj; uniform mat4 uLightVP;
uniform vec2 uRepeat;
out vec3 vWorld; out vec3 vNormal; out vec2 vUv; out vec4 vShadow;
void main(){
  vec4 w = uModel * vec4(position,1.0);
  vWorld = w.xyz; vNormal = normalize(uNormalMat * normal); vUv = uv * uRepeat;
  vShadow = uLightVP * w;
  gl_Position = uViewProj * w;
}`;

const FRAG = `#version 300 es
precision highp float;
precision highp sampler2DShadow;
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec4 vShadow;
uniform vec3 uColor; uniform float uRough; uniform float uMetal; uniform vec3 uEmissive; uniform float uOpacity;
uniform float uUnlit; uniform float uFresnel; uniform vec3 uFresnelColor; uniform float uHasMap; uniform float uHasEmap; uniform float uRecv;
uniform sampler2D uMap; uniform sampler2D uEmap; uniform sampler2DShadow uShadow; uniform float uShadowSize;
uniform vec3 uCam; uniform vec3 uHemiSky; uniform vec3 uHemiGround;
uniform vec3 uDirDir; uniform vec3 uDirColor;
uniform vec3 uPtPos[4]; uniform vec3 uPtColor[4]; uniform float uPtDist[4]; uniform int uPtCount;
uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar; uniform float uExposure; uniform float uFogAmt;
out vec4 frag;

float shadowSample(){
  vec3 p = vShadow.xyz / vShadow.w; p = p*0.5+0.5;
  if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0||p.z>1.0||p.z<0.0) return 1.0;
  float bias = 0.0015;
  float s = 0.0; float px = 1.0/uShadowSize;
  for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++) s += texture(uShadow, vec3(p.xy + vec2(float(x),float(y))*px, p.z - bias));
  s /= 9.0;
  // fade toward the frustum border so the edge is never visible
  vec2 e = min(p.xy, 1.0 - p.xy); float edge = smoothstep(0.0, 0.08, min(e.x, e.y));
  return mix(1.0, s, edge);
}
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
// interleaved gradient noise: a fixed per-pixel pattern (never animated, so a still frame stays bit-identical)
float ign(vec2 p){ return fract(52.9829189*fract(dot(p, vec2(0.06711056, 0.00583715)))); }

void main(){
  vec3 base = uColor;
  float alpha = uOpacity;
  if(uHasMap>0.5){ vec4 t = texture(uMap, vUv); base *= t.rgb; alpha *= t.a; }
  vec3 N = normalize(vNormal); if(!gl_FrontFacing) N = -N;
  // specular anti-aliasing: where the normal turns fast across a pixel (small or distant curved metal) the lobe widens a little,
  // so a highlight can't collapse into a sub-pixel spark that crackles as the view moves; flat and large surfaces are untouched
  vec3 dnx = dFdx(N), dny = dFdy(N); float kern = min(0.5*(dot(dnx,dnx)+dot(dny,dny)), 0.1);
  vec3 V = normalize(uCam - vWorld);
  float NdV = max(dot(N,V),0.0);
  vec3 col;
  if(uUnlit>0.5){ col = base; }
  else {
    float rough = clamp(uRough,0.04,1.0); rough = sqrt(min(rough*rough + kern, 1.0));
    vec3 F0 = mix(vec3(0.04), base, uMetal);
    vec3 diffuseColor = base*(1.0-uMetal);
    vec3 hemi = mix(uHemiGround, uHemiSky, N.y*0.5+0.5);
    col = diffuseColor * hemi;
    // directional
    vec3 L = normalize(-uDirDir);
    float NdL = max(dot(N,L),0.0);
    float sh = uRecv>0.5 ? shadowSample() : 1.0;
    vec3 H = normalize(L+V);
    float NdH = max(dot(N,H),0.0);
    float shin = exp2(11.0*(1.0-rough)+1.0);
    float spec = pow(NdH, shin) * (shin+2.0)/(8.0*3.14159) ;
    vec3 F = F0 + (1.0-F0)*pow(1.0-max(dot(H,V),0.0),5.0);
    col += (diffuseColor*NdL/3.14159 + F*spec*NdL) * uDirColor * sh * 3.14159;
    // point lights
    for(int i=0;i<4;i++){ if(i>=uPtCount) break;
      vec3 d = uPtPos[i]-vWorld; float dist = length(d); vec3 Lp = d/dist;
      float att = 1.0/(1.0 + (dist*dist)/(uPtDist[i]*uPtDist[i]*0.25));
      float win = clamp(1.0 - pow(dist/uPtDist[i],4.0),0.0,1.0);
      float nl = max(dot(N,Lp),0.0);
      vec3 Hp = normalize(Lp+V); float sp = pow(max(dot(N,Hp),0.0), shin)*(shin+2.0)/(8.0*3.14159);
      col += (diffuseColor*nl + F0*sp*nl) * uPtColor[i] * att * win;
    }
    // rim / fresnel glow
    col += uFresnelColor * uFresnel * pow(1.0-NdV, 3.0);
  }
  vec3 em = uEmissive; if(uHasEmap>0.5) em *= texture(uEmap, vUv).rgb;
  col += em;
  // fog
  float fd = length(uCam - vWorld);
  float fog = clamp((fd-uFogNear)/(uFogFar-uFogNear),0.0,1.0);
  col = mix(col, uFogColor, fog*fog*uFogAmt);
  col = aces(col*uExposure);
  col = pow(col, vec3(1.0/2.2));
  // half a step of dither before the 8-bit store: the room is dark, and its slow gradients (lamp falloff on the walls) band without it
  frag = vec4(col + (ign(gl_FragCoord.xy) - 0.5)/255.0, alpha);
}`;

const SHADOW_VERT = `#version 300 es
in vec3 position; uniform mat4 uModel; uniform mat4 uLightVP;
void main(){ gl_Position = uLightVP * uModel * vec4(position,1.0); }`;
const SHADOW_FRAG = `#version 300 es
precision mediump float; out vec4 f; void main(){ f = vec4(1.0); }`;


// ---- post: a cinematic pass (depth of field around the camera's focus distance, a soft vignette)
const POST_VERT = `#version 300 es
precision highp float;
out vec2 vUv;
void main(){ vec2 p = vec2((gl_VertexID<<1)&2, gl_VertexID&2); vUv = p; gl_Position = vec4(p*2.0-1.0, 0.0, 1.0); }`;
const POST_FRAG = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 frag;
uniform sampler2D uColor; uniform sampler2D uDepth;
uniform vec2 uTexel; uniform float uNear; uniform float uFar; uniform float uFocus; uniform float uRange; uniform float uMaxBlur; uniform float uVignette;
float lin(float d){ float z = d*2.0-1.0; return (2.0*uNear*uFar)/(uFar+uNear-z*(uFar-uNear)); }
float coc(vec2 uv){ float z = lin(texture(uDepth, uv).r); return clamp(abs(z-uFocus)/uRange, 0.0, 1.0); }
float ign(vec2 p){ return fract(52.9829189*fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main(){
  float c = coc(vUv); float r = c*uMaxBlur;
  vec3 sharp = texture(uColor, vUv).rgb, col = sharp; float wsum = 1.0;
  if (r > 0.4) {
    const vec2 taps[12] = vec2[12](vec2(-0.326,-0.406),vec2(-0.840,-0.074),vec2(-0.696,0.457),vec2(-0.203,0.621),vec2(0.962,-0.195),vec2(0.473,-0.480),vec2(0.519,0.767),vec2(0.185,-0.893),vec2(0.507,0.064),vec2(0.896,0.412),vec2(-0.322,-0.933),vec2(-0.792,-0.598));
    for (int i=0;i<12;i++){ vec2 o = taps[i]*r*uTexel; vec2 uv2 = vUv+o; float c2 = coc(uv2); float w = 0.55 + 0.45*min(1.0, c2/max(c,0.001)); col += texture(uColor, uv2).rgb*w; wsum += w; }
    // ease in from the threshold: a hard cut at 0.4 px let pixels whose blur sat near it (fine text on the monitor, the book
    // spines) flick between sharp and soft as the focus distance drifted, a crackle; past ~1.2 px it is the same blur as before
    col = mix(sharp, col / wsum, smoothstep(0.4, 1.2, r));
  }
  vec2 q = vUv*2.0-1.0; float v = 1.0 - uVignette*smoothstep(0.35, 1.45, dot(q,q));
  // static dither (a fixed per-pixel pattern) so the vignette's long dark ramp doesn't band
  frag = vec4(col*v + (ign(gl_FragCoord.xy) - 0.5)/255.0, 1.0);
}`;

function compile(gl, vs, fs) {
  const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
  const p = gl.createProgram();
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'position'); gl.bindAttribLocation(p, 1, 'normal'); gl.bindAttribLocation(p, 2, 'uv');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const uniforms = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); uniforms[info.name.replace('[0]', '')] = gl.getUniformLocation(p, info.name); }
  return { program: p, u: uniforms };
}

// the six planes of a view-projection matrix (column-major), normalised; a point is inside where a·x + b·y + c·z + d ≥ 0
function planes(vp, out) {
  for (let k = 0; k < 6; k++) {
    const i = k >> 1, s = k & 1 ? -1 : 1, p = out[k];
    p[0] = vp[3] + s * vp[i]; p[1] = vp[7] + s * vp[4 + i]; p[2] = vp[11] + s * vp[8 + i]; p[3] = vp[15] + s * vp[12 + i];
    const l = Math.hypot(p[0], p[1], p[2]) || 1; p[0] /= l; p[1] /= l; p[2] /= l; p[3] /= l;
  }
  return out;
}
// a geometry's local bounding sphere (centre + radius of its box), worked out once; a dynamic one (the curtains) rewrites
// its bounds as it moves, so its sphere is redone every time it's asked for
function sphere(geo, g) {
  if (g.sph && !geo.dynamic) return g.sph;
  const b = geo.bounds; if (!b) return null;
  const s = g.sph || (g.sph = [0, 0, 0, 0]);
  s[0] = (b.min[0] + b.max[0]) * 0.5; s[1] = (b.min[1] + b.max[1]) * 0.5; s[2] = (b.min[2] + b.max[2]) * 0.5;
  s[3] = Math.hypot(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]) * 0.5;
  return s;
}
// a mesh counts as in view when that sphere, carried by its world matrix (radius × its largest axis scale), is inside every plane
function inside(w, s, P) {
  if (!s || !P) return true;
  const cx = s[0], cy = s[1], cz = s[2];
  const x = w[0] * cx + w[4] * cy + w[8] * cz + w[12], y = w[1] * cx + w[5] * cy + w[9] * cz + w[13], z = w[2] * cx + w[6] * cy + w[10] * cz + w[14];
  const r = s[3] * Math.sqrt(Math.max(w[0] * w[0] + w[1] * w[1] + w[2] * w[2], w[4] * w[4] + w[5] * w[5] + w[6] * w[6], w[8] * w[8] + w[9] * w[9] + w[10] * w[10]));
  if (!(r >= 0)) return true;   // empty or odd bounds: draw it rather than lose it
  for (let k = 0; k < 6; k++) { const p = P[k]; if (p[0] * x + p[1] * y + p[2] * z + p[3] < -r) return false; }
  return true;
}
const backToFront = (a, b) => (a.renderOrder - b.renderOrder) || (b._dist - a._dist);
// slots in the uniform cache (_uc): what the main program last received, so a draw only sends what differs
const U_COLOR = 0, U_ROUGH = 3, U_METAL = 4, U_EMIS = 5, U_OPAC = 8, U_UNLIT = 9, U_FRES = 10, U_FRESC = 11, U_RECV = 14, U_FOG = 15, U_REP = 16, U_MAP = 18, U_EMAP = 19;

export class Renderer {
  constructor(canvas, { shadowSize = 2048 } = {}) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;
    this.main = compile(gl, VERT, FRAG);
    this.shadowProg = compile(gl, SHADOW_VERT, SHADOW_FRAG);
    this.postProg = compile(gl, POST_VERT, POST_FRAG);
    this.post = { enabled: true, focus: 20, range: 14, maxBlur: 4, vignette: 0.32 };
    this.shadowSize = shadowSize;
    // 1.5× the CSS pixels at most (with 4× MSAA on top that is plenty sharp); _adapt() lowers it when frames run long, never
    // below the CSS pixels (0.75 of them on a dense phone screen, where that still looks sharp). renderer.adaptive = false pins it.
    const dpr = window.devicePixelRatio || 1;
    this.maxPixelRatio = Math.min(dpr, 1.5);
    this.minPixelRatio = Math.min(this.maxPixelRatio, dpr >= 2 ? 0.75 : 1);
    this.pixelRatio = this.maxPixelRatio;
    this.adaptive = true;
    this.culling = true;   // false draws everything (a debugging switch: culled and unculled frames must look the same)
    this._planes = [0, 1, 2, 3, 4, 5].map(() => new Float32Array(4)); this._lightPlanes = [0, 1, 2, 3, 4, 5].map(() => new Float32Array(4));
    // per-frame scratch, so render() allocates nothing
    this._opaque = []; this._transparent = []; this._seen = [];
    this._pp = new Float32Array(12); this._pc = new Float32Array(12); this._pd = new Float32Array(4); this._dirN = [0, 0, 0];
    this._lightView = M4.create(); this._lightProj = M4.create(); this._lightEye = [0, 0, 0]; this._lightD = [0, 0, 0]; this._up = [0, 1, 0];
    this._uc = new Array(20).fill(NaN);   // NaN never equals anything, so the first draw sends every value
    this._bound = [null, null, null, null]; this._unit = -1; this._cull = true; this._lastMat = null;
    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    this._aniso = aniso ? { ext: aniso, max: Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)) } : null;
    this._frame = 0;
    this.clearColor = [0.04, 0.04, 0.05];
    this.fog = { color: [0.04, 0.04, 0.05], near: 30, far: 80 };
    this.exposure = 1.0;
    this.hemi = { sky: [0.35, 0.36, 0.42], ground: [0.08, 0.07, 0.07] };
    this.dir = { direction: [-0.4, -1, -0.35], color: [1.2, 1.1, 1.0], shadow: { size: 22, near: 1, far: 60, center: [0, 0, 0], distance: 30 } };
    this.points = [];
    this._geoCache = new WeakMap();
    this._texCache = new WeakMap();
    this._lightVP = M4.create();
    this._normalMat = new Float32Array(9);
    this._initShadow();
    this._white = this._makeWhite();
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.drawCalls = 0;
  }
  _makeWhite() {
    const gl = this.gl; const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    return t;
  }
  _initShadow() {
    const gl = this.gl, s = this.shadowSize;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, s, s, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
    gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.shadowTex = tex; this.shadowFB = fb;
  }
  setSize(w, h) {
    const pr = this.pixelRatio;
    this.canvas.width = Math.floor(w * pr); this.canvas.height = Math.floor(h * pr);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.width = w; this.height = h;
    this._initPost(this.canvas.width, this.canvas.height);
  }
  _initPost(w, h) {
    const gl = this.gl;
    if (this._post) { gl.deleteFramebuffer(this._post.msFB); gl.deleteFramebuffer(this._post.fb); gl.deleteRenderbuffer(this._post.rbC); gl.deleteRenderbuffer(this._post.rbD); gl.deleteTexture(this._post.color); gl.deleteTexture(this._post.depth); }
    const samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES));
    const rbC = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rbC); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, w, h);
    const rbD = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rbD); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, w, h);
    const msFB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, msFB);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, rbC); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbD);
    const mkTex = (ifmt, fmt, type) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, type, null); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
    const color = mkTex(gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE); const depth = mkTex(gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT);
    gl.bindTexture(gl.TEXTURE_2D, depth); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this._post = { msFB, fb, rbC, rbD, color, depth, w, h, ok };
    if (!this._postVAO) this._postVAO = gl.createVertexArray();
  }
  _geo(geo) {
    let g = this._geoCache.get(geo);
    const gl = this.gl;
    if (g) {
      // a geometry that moves (geo.dynamic, e.g. the curtains) re-uploads its positions and normals when it sets needsUpdate
      if (geo.needsUpdate && g.pos) { gl.bindBuffer(gl.ARRAY_BUFFER, g.pos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, geo.positions); gl.bindBuffer(gl.ARRAY_BUFFER, g.nor); gl.bufferSubData(gl.ARRAY_BUFFER, 0, geo.normals); geo.needsUpdate = false; }
      return g;
    }
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const usage = geo.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;
    const mk = (data, loc, size) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, usage); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); return b; };
    const pos = mk(geo.positions, 0, 3), nor = mk(geo.normals, 1, 3); mk(geo.uvs, 2, 2);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.indices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    g = { vao, count: geo.indices.length, type: geo.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, pos: geo.dynamic ? pos : null, nor: geo.dynamic ? nor : null };
    geo.needsUpdate = false;
    this._geoCache.set(geo, g);
    return g;
  }
  _tex(tex) {
    const gl = this.gl;
    let t = this._texCache.get(tex);
    if (!t) { t = gl.createTexture(); this._texCache.set(tex, t); tex.needsUpdate = true; }
    if (tex.needsUpdate) {
      // uploads go through a unit no sampler reads, so the cached bindings of units 0–2 stay true
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, t); this._unit = 3; this._bound[3] = t;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, tex.flipY);
      gl.texImage2D(gl.TEXTURE_2D, 0, tex.srgb ? gl.SRGB8_ALPHA8 : gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);
      const wrap = tex.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (tex.mipmaps) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
      else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      const an = this._aniso; if (an) gl.texParameterf(gl.TEXTURE_2D, an.ext.TEXTURE_MAX_ANISOTROPY_EXT, an.max);
      tex.needsUpdate = false;
    }
    return t;
  }
  _bind(unit, t) {
    if (this._bound[unit] === t) return;
    const gl = this.gl; if (this._unit !== unit) { gl.activeTexture(gl.TEXTURE0 + unit); this._unit = unit; }
    gl.bindTexture(gl.TEXTURE_2D, t); this._bound[unit] = t;
  }
  _collect(scene) {
    const opaque = this._opaque, transparent = this._transparent; opaque.length = 0; transparent.length = 0;
    scene.traverse((n) => {
      if (!n.visible) { n._hidden = true; return; }
      n._hidden = n.parent ? n.parent._hidden : false;
      if (n._hidden) return;
      if (n instanceof Mesh && n.geometry && n.material) (n.material.transparent ? transparent : opaque).push(n);
    });
    return { opaque, transparent };
  }
  _updateLightVP() {
    const s = this.dir.shadow;
    const d = V3.normalize(this._lightD, this.dir.direction);
    const eye = V3.addScaled(this._lightEye, s.center, d, -s.distance);
    const view = M4.lookAt(this._lightView, eye, s.center, this._up);
    const proj = M4.ortho(this._lightProj, -s.size, s.size, -s.size, s.size, s.near, s.far);
    M4.multiply(this._lightVP, proj, view);
  }
  /** Adaptive resolution: when frames keep running long (a smoothed ~22 ms+ for a couple of seconds), render fewer pixels, down
   *  to minPixelRatio; creep back up when there is headroom. Changes are rare and spaced out, since each one re-allocates the
   *  frame buffers (setSize). The canvas keeps its CSS size, so hover/picking (CSS pixels) is untouched. */
  _adapt() {
    // (a QA capture pins the resolution; holdAdapt is set while the app deliberately renders slower, so that isn't read as a slow device)
    if (this.adaptive === false || this.holdAdapt) { this._lastT = 0; return; }
    const now = performance.now(), dt = this._lastT ? now - this._lastT : 16.7; this._lastT = now;
    if (dt > 250) return;   // a background tab or a one-off hitch, not a trend
    this._ema = this._ema ? this._ema + (dt - this._ema) * 0.04 : dt;
    const since = now - (this._adaptAt || now - 3000), max = this.maxPixelRatio, min = this.minPixelRatio;
    let pr = this.pixelRatio;
    if (this._ema > 22 && pr > min && since > 2500) pr = Math.max(min, pr * 0.85);
    else if (this._ema < 17.4 && pr < max && since > 8000) pr = Math.min(max, pr * 1.1);
    if (pr !== this.pixelRatio && this.width) { this.pixelRatio = pr; this._adaptAt = now; this.setSize(this.width, this.height); }
  }
  render(scene, camera) {
    const gl = this.gl;
    this._adapt();
    scene.updateWorld(null);
    camera.update();
    const { opaque, transparent } = this._collect(scene);
    this.drawCalls = 0;
    // upload (or refresh) every visible geometry first: the shadow and main passes need its buffers and its bounding sphere
    for (const m of opaque) m._g = this._geo(m.geometry);
    for (const m of transparent) m._g = this._geo(m.geometry);
    this._vao = null;   // (uploads and the post pass bind other vertex arrays)
    // ---- shadow pass: every other frame (the casters barely move; the map from the frame before is still right), and only
    // for casters inside the light's box
    this._updateLightVP();
    if (this._frame++ % 2 === 0) {
      const LP = this.culling ? planes(this._lightVP, this._lightPlanes) : null;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFB);
      gl.viewport(0, 0, this.shadowSize, this.shadowSize);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.shadowProg.program);
      gl.uniformMatrix4fv(this.shadowProg.u.uLightVP, false, this._lightVP);
      gl.cullFace(gl.FRONT);
      for (const m of opaque) {
        const g = m._g;
        if (!m.castShadow || !inside(m.worldMatrix, sphere(m.geometry, g), LP)) continue;
        gl.uniformMatrix4fv(this.shadowProg.u.uModel, false, m.worldMatrix);
        if (g.vao !== this._vao) { gl.bindVertexArray(g.vao); this._vao = g.vao; } gl.drawElements(gl.TRIANGLES, g.count, g.type, 0);
      }
      gl.cullFace(gl.BACK);
    }
    // what the camera can't see isn't drawn
    const P = this.culling ? planes(camera.viewProj, this._planes) : null;
    // ---- main pass (into the multisampled post buffer when the post pass is on)
    const usePost = this.post.enabled && this._post && this._post.ok;
    gl.bindFramebuffer(gl.FRAMEBUFFER, usePost ? this._post.msFB : null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    const cc = this.clearColor; gl.clearColor(cc[0], cc[1], cc[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.main.program);
    const u = this.main.u;
    gl.uniformMatrix4fv(u.uViewProj, false, camera.viewProj);
    gl.uniformMatrix4fv(u.uLightVP, false, this._lightVP);
    gl.uniform3fv(u.uCam, camera.position);
    gl.uniform3fv(u.uHemiSky, this.hemi.sky); gl.uniform3fv(u.uHemiGround, this.hemi.ground);
    gl.uniform3fv(u.uDirDir, V3.normalize(this._dirN, this.dir.direction)); gl.uniform3fv(u.uDirColor, this.dir.color);
    const pp = this._pp, pc = this._pc, pd = this._pd, np = Math.min(4, this.points.length); pp.fill(0); pc.fill(0); pd.fill(0);
    for (let i = 0; i < np; i++) { const p = this.points[i], k = p.intensity; pp.set(p.position, i * 3); pc[i * 3] = p.color[0] * k; pc[i * 3 + 1] = p.color[1] * k; pc[i * 3 + 2] = p.color[2] * k; pd[i] = p.distance; }
    gl.uniform3fv(u.uPtPos, pp); gl.uniform3fv(u.uPtColor, pc); gl.uniform1fv(u.uPtDist, pd); gl.uniform1i(u.uPtCount, np);
    gl.uniform3fv(u.uFogColor, this.fog.color); gl.uniform1f(u.uFogNear, this.fog.near); gl.uniform1f(u.uFogFar, this.fog.far);
    gl.uniform1f(u.uExposure, this.exposure);
    gl.uniform1f(u.uShadowSize, this.shadowSize);
    // texture bindings are tracked from here on (setSize and the post pass bind behind the tracker's back, so start clean)
    this._bound.fill(null); this._unit = -1; this._lastMat = null;
    this._bind(2, this.shadowTex); gl.uniform1i(u.uShadow, 2);
    gl.uniform1i(u.uMap, 0); gl.uniform1i(u.uEmap, 1);
    gl.enable(gl.CULL_FACE); this._cull = true;
    gl.depthMask(true); gl.disable(gl.BLEND);
    for (const m of opaque) if (inside(m.worldMatrix, sphere(m.geometry, m._g), P)) this._draw(m, u);
    // transparent: back to front (invisible hit boxes are skipped outright: they only exist for picking)
    const cp = camera.position, seen = this._seen; seen.length = 0;
    for (const m of transparent) {
      if (!(m.material.opacity > 0) || !inside(m.worldMatrix, sphere(m.geometry, m._g), P)) continue;
      const w = m.worldMatrix; m._dist = Math.hypot(w[12] - cp[0], w[13] - cp[1], w[14] - cp[2]); seen.push(m);
    }
    seen.sort(backToFront);
    gl.enable(gl.BLEND);
    let dm = true;
    for (const m of seen) { if (m.material.depthWrite !== dm) { dm = m.material.depthWrite; gl.depthMask(dm); } this._draw(m, u); }
    gl.depthMask(true); gl.disable(gl.BLEND);
    if (!this._cull) { gl.enable(gl.CULL_FACE); this._cull = true; }   // the next shadow pass expects culling on
    if (usePost) this._postPass(camera);
  }
  _postPass(camera) {
    const gl = this.gl, p = this._post, w = this.canvas.width, h = this.canvas.height;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, p.msFB); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, p.fb);
    gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.DEPTH_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h); gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    const P = this.postProg; gl.useProgram(P.program); const u = P.u;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, p.color); gl.uniform1i(u.uColor, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, p.depth); gl.uniform1i(u.uDepth, 1);
    gl.uniform2f(u.uTexel, 1 / w, 1 / h); gl.uniform1f(u.uNear, camera.near); gl.uniform1f(u.uFar, camera.far);
    gl.uniform1f(u.uFocus, this.post.focus); gl.uniform1f(u.uRange, this.post.range); gl.uniform1f(u.uMaxBlur, this.post.maxBlur * this.pixelRatio); gl.uniform1f(u.uVignette, this.post.vignette);
    gl.bindVertexArray(this._postVAO); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
  }
  _draw(m, u) {
    const gl = this.gl, mat = m.material, g = m._g;
    gl.uniformMatrix4fv(u.uModel, false, m.worldMatrix);
    gl.uniformMatrix3fv(u.uNormalMat, false, M4.normalFromMat4(this._normalMat, m.worldMatrix));
    if (mat !== this._lastMat) { this._lastMat = mat; this._material(mat, u); }
    if (g.vao !== this._vao) { gl.bindVertexArray(g.vao); this._vao = g.vao; } gl.drawElements(gl.TRIANGLES, g.count, g.type, 0);
    this.drawCalls++;
  }
  // nearly every mesh has a material of its own, but most share their values (the same roughness, no map, no fresnel...), so
  // each uniform is only sent when it differs from what the program already holds; values persist in the program across frames
  _material(mat, u) {
    const gl = this.gl, c = this._uc, col = mat.color, em = mat.emissive, ei = mat.emissiveIntensity, fc = mat.fresnelColor, rp = mat.mapRepeat;
    if (c[U_COLOR] !== col[0] || c[U_COLOR + 1] !== col[1] || c[U_COLOR + 2] !== col[2]) { c[U_COLOR] = col[0]; c[U_COLOR + 1] = col[1]; c[U_COLOR + 2] = col[2]; gl.uniform3f(u.uColor, col[0], col[1], col[2]); }
    if (c[U_ROUGH] !== mat.roughness) gl.uniform1f(u.uRough, c[U_ROUGH] = mat.roughness);
    if (c[U_METAL] !== mat.metalness) gl.uniform1f(u.uMetal, c[U_METAL] = mat.metalness);
    const ex = em[0] * ei, ey = em[1] * ei, ez = em[2] * ei;
    if (c[U_EMIS] !== ex || c[U_EMIS + 1] !== ey || c[U_EMIS + 2] !== ez) { c[U_EMIS] = ex; c[U_EMIS + 1] = ey; c[U_EMIS + 2] = ez; gl.uniform3f(u.uEmissive, ex, ey, ez); }
    if (c[U_OPAC] !== mat.opacity) gl.uniform1f(u.uOpacity, c[U_OPAC] = mat.opacity);
    const unlit = mat.unlit ? 1 : 0; if (c[U_UNLIT] !== unlit) gl.uniform1f(u.uUnlit, c[U_UNLIT] = unlit);
    if (c[U_FRES] !== mat.fresnel) gl.uniform1f(u.uFresnel, c[U_FRES] = mat.fresnel);
    if (c[U_FRESC] !== fc[0] || c[U_FRESC + 1] !== fc[1] || c[U_FRESC + 2] !== fc[2]) { c[U_FRESC] = fc[0]; c[U_FRESC + 1] = fc[1]; c[U_FRESC + 2] = fc[2]; gl.uniform3f(u.uFresnelColor, fc[0], fc[1], fc[2]); }
    const recv = mat.receiveShadow ? 1 : 0; if (c[U_RECV] !== recv) gl.uniform1f(u.uRecv, c[U_RECV] = recv);
    const fog = mat.fog === false ? 0 : 1; if (c[U_FOG] !== fog) gl.uniform1f(u.uFogAmt, c[U_FOG] = fog);
    if (c[U_REP] !== rp[0] || c[U_REP + 1] !== rp[1]) { c[U_REP] = rp[0]; c[U_REP + 1] = rp[1]; gl.uniform2f(u.uRepeat, rp[0], rp[1]); }
    this._bind(0, mat.map ? this._tex(mat.map) : this._white); const hm = mat.map ? 1 : 0; if (c[U_MAP] !== hm) gl.uniform1f(u.uHasMap, c[U_MAP] = hm);
    this._bind(1, mat.emissiveMap ? this._tex(mat.emissiveMap) : this._white); const he = mat.emissiveMap ? 1 : 0; if (c[U_EMAP] !== he) gl.uniform1f(u.uHasEmap, c[U_EMAP] = he);
    const cull = !mat.doubleSide; if (cull !== this._cull) { this._cull = cull; if (cull) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE); }
  }
}
