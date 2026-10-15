// Dither: the background of the profile home, a port of react-bits' Dither component (reactbits.dev, MIT) to plain JS for this
// static site: WebGL2, two passes. The first draws a wave field (fbm of Perlin noise, warped by the pointer's trail and by click
// rings) at one texel per cell of pixelSize CSS px; the second spreads it into a few tones between the page's background and the
// wave colour with an ordered (Bayer) threshold, one cell per screen block, so the picture is made of visible pixels on purpose.
// Emitted into the page script as DITHER_JS: a global function nvDither(options) returning { canvas, start, stop, destroy } or
// null without WebGL2; scripts/home-profile.js mounts it behind the column. Options mirror the component's props (waveSpeed,
// waveFrequency, waveAmplitude, waveColor, backgroundColor, colorNum, pixelSize, mouseRadius, mode, scale, contrast, brightness,
// effect, mouseStrength, trail, clickRipple, intro, dpr) plus animate (false: one still frame), mouse (false: no pointer) and fps.
// setFps(n) changes the frame rate while it runs (the profile home slows it down when nobody moves, so it never looks stopped).
export const DITHER_JS = String.raw`function nvDither(opts) {
  var o = Object.assign({ waveSpeed: 0.05, waveFrequency: 3, waveAmplitude: 0.3, waveColor: '#bcbcbc', backgroundColor: '#120f17', colorNum: 4, pixelSize: 2, animate: true, mouse: true, mouseRadius: 0.3, mode: 'bayer', scale: 1, contrast: 1, brightness: 0, effect: 'erase', mouseStrength: 1, trail: 0.5, clickRipple: true, intro: true, dpr: 0, fps: 60, className: 'pf-field' }, opts || {});
  var MODES = { bayer: 0, bayer4: 1, bayer2: 2, halftone: 3, lines: 4, crosshatch: 5, noise: 6, none: 7 }, EFFECTS = { erase: 0, reveal: 1, ripple: 2 };
  var MAX_TRAIL = 16, MAX_RIPPLES = 4, INTRO_S = 1.8, RIPPLE_S = 1.6;
  var canvas = document.createElement('canvas'); canvas.className = o.className; canvas.setAttribute('aria-hidden', 'true');
  var gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) return null;
  var VERT = ['#version 300 es', 'in vec2 aPosition;', 'void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }'].join('\n');
  var WAVE = [
    '#version 300 es', 'precision highp float;', 'precision highp int;',
    'uniform vec2 uResolution; uniform float uCell; uniform float uTime; uniform float uWaveSpeed; uniform float uWaveFrequency; uniform float uWaveAmplitude;',
    'uniform float uScale; uniform float uContrast; uniform float uBrightness; uniform int uEffect; uniform float uRadius; uniform float uStrength;',
    'uniform vec3 uTrail[16]; uniform int uTrailCount; uniform vec4 uRipples[4]; uniform int uRippleCount; uniform float uIntro; uniform float uReach;',
    'out vec4 outColor;',
    'vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }',
    'vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }',
    'vec2 fade(vec2 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }',
    'float cnoise(vec2 P) {',
    '  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0); vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0); Pi = mod289(Pi);',
    '  vec4 ix = Pi.xzxz; vec4 iy = Pi.yyww; vec4 fx = Pf.xzxz; vec4 fy = Pf.yyww; vec4 i = permute(permute(ix) + iy);',
    '  vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0; vec4 gy = abs(gx) - 0.5; vec4 tx = floor(gx + 0.5); gx = gx - tx;',
    '  vec2 g00 = vec2(gx.x, gy.x); vec2 g10 = vec2(gx.y, gy.y); vec2 g01 = vec2(gx.z, gy.z); vec2 g11 = vec2(gx.w, gy.w);',
    '  vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11))); g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;',
    '  float n00 = dot(g00, vec2(fx.x, fy.x)); float n10 = dot(g10, vec2(fx.y, fy.y)); float n01 = dot(g01, vec2(fx.z, fy.z)); float n11 = dot(g11, vec2(fx.w, fy.w));',
    '  vec2 fadeXY = fade(Pf.xy); vec2 nx = mix(vec2(n00, n01), vec2(n10, n11), fadeXY.x); return 2.3 * mix(nx.x, nx.y, fadeXY.y);',
    '}',
    'float fbm(vec2 p) { float value = 0.0; float amp = 1.0; for (int i = 0; i < 4; i++) { value += amp * abs(cnoise(p)); p *= uWaveFrequency; amp *= uWaveAmplitude; } return value; }',
    'float pattern(vec2 p) { vec2 p2 = p - uTime * uWaveSpeed; return fbm(p + fbm(p2)); }',
    'void main() {',
    '  vec2 corner = (gl_FragCoord.xy - 0.5) * uCell; vec2 uv = corner / uResolution - 0.5; uv.x *= uResolution.x / uResolution.y;',
    '  float touch = 0.0;',
    '  for (int i = 0; i < 16; i++) { if (i >= uTrailCount) break; vec3 point = uTrail[i]; float reach = uRadius * mix(0.55, 1.0, point.z); touch = max(touch, point.z * (1.0 - smoothstep(0.0, reach, length(uv - point.xy)))); }',
    '  vec2 warp = vec2(0.0); float ring = 0.0;',
    '  for (int i = 0; i < 4; i++) { if (i >= uRippleCount) break; vec4 ripple = uRipples[i]; vec2 delta = uv - ripple.xy; float dist = length(delta); float life = clamp(ripple.z / 1.6, 0.0, 1.0);',
    '    float wave = exp(-pow((dist - ripple.z * 0.9) / 0.07, 2.0)) * (1.0 - life) * (1.0 - life) * ripple.w; warp += (dist > 0.0001 ? delta / dist : vec2(0.0)) * wave * 0.035; ring += wave; }',
    '  if (uEffect == 2 && touch > 0.0) { vec3 head = uTrail[0]; vec2 delta = uv - head.xy; float dist = length(delta); warp += (dist > 0.0001 ? delta / dist : vec2(0.0)) * sin(dist / max(uRadius, 0.001) * 16.0 - uTime * 7.0) * 0.04 * touch * uStrength; }',
    '  float f = pattern((uv + warp) / uScale);',
    '  if (uEffect == 0) f -= 0.5 * touch * uStrength;',
    '  if (uEffect == 1) f += 0.5 * touch * uStrength;',
    '  f += ring * 0.55; f = (f - 0.5) * uContrast + 0.5 + uBrightness;',
    '  float show = clamp((uIntro * uReach - length(uv)) / 0.45, 0.0, 1.0); float v = clamp(f, 0.0, 1.0) * show * show * (3.0 - 2.0 * show);',
    '  outColor = vec4(floor(v * 255.0) / 255.0, fract(v * 255.0), 0.0, 1.0);',
    '}'
  ].join('\n');
  var DITH = [
    '#version 300 es', 'precision highp float;', 'precision highp int;',
    'uniform sampler2D uField; uniform ivec2 uFieldSize; uniform float uCellDevice; uniform int uMode; uniform float uColorNum; uniform vec3 uWave; uniform vec3 uBackground;',
    'out vec4 outColor;',
    'const float bayer8[64] = float[64](0.0, 48.0, 12.0, 60.0, 3.0, 51.0, 15.0, 63.0, 32.0, 16.0, 44.0, 28.0, 35.0, 19.0, 47.0, 31.0, 8.0, 56.0, 4.0, 52.0, 11.0, 59.0, 7.0, 55.0, 40.0, 24.0, 36.0, 20.0, 43.0, 27.0, 39.0, 23.0,',
    '  2.0, 50.0, 14.0, 62.0, 1.0, 49.0, 13.0, 61.0, 34.0, 18.0, 46.0, 30.0, 33.0, 17.0, 45.0, 29.0, 10.0, 58.0, 6.0, 54.0, 9.0, 57.0, 5.0, 53.0, 42.0, 26.0, 38.0, 22.0, 41.0, 25.0, 37.0, 21.0);',
    'const float bayer4[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);',
    'const float bayer2[4] = float[4](0.0, 2.0, 3.0, 1.0);',
    'float threshold(vec2 cell) {',
    '  if (uMode == 1) { ivec2 c = ivec2(mod(cell, 4.0)); return bayer4[c.y * 4 + c.x] / 16.0; }',
    '  if (uMode == 2) { ivec2 c = ivec2(mod(cell, 2.0)); return bayer2[c.y * 2 + c.x] / 4.0; }',
    '  if (uMode == 3) { vec2 r = vec2(cell.x + cell.y, cell.x - cell.y) * 0.70710678 / 4.0; return clamp(length(fract(r) - 0.5) * 1.41421356, 0.0, 0.999); }',
    '  if (uMode == 4) { return abs(fract(cell.y / 4.0) - 0.5) * 2.0 * 0.999; }',
    '  if (uMode == 5) { float a = abs(fract((cell.x + cell.y) / 6.0) - 0.5) * 2.0; float b = abs(fract((cell.x - cell.y) / 6.0) - 0.5) * 2.0; return min(a, b) * 0.999; }',
    '  if (uMode == 6) { return fract(52.9829189 * fract(dot(cell, vec2(0.06711056, 0.00583715)))); }',
    '  if (uMode == 7) { return 0.25; }',
    '  ivec2 c = ivec2(mod(cell, 8.0)); return bayer8[c.y * 8 + c.x] / 64.0;',
    '}',
    'vec3 toSrgb(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }',
    'void main() {',
    '  vec2 cell = floor(gl_FragCoord.xy / uCellDevice);',
    '  vec4 s = texelFetch(uField, clamp(ivec2(cell), ivec2(0), uFieldSize - 1), 0); float f = s.r + s.g / 255.0; float t = threshold(cell) - 0.25;',
    '  float levels = max(uColorNum, 1.01) - 1.0; float base = dot(uBackground, vec3(0.2126, 0.7152, 0.0722));',
    '  vec3 offset = (uWave - vec3(base)) * f + t / levels; float luminance = dot(uBackground + offset, vec3(0.2126, 0.7152, 0.0722));',
    '  offset -= mix(0.2, 0.0, smoothstep(0.45, 0.8, luminance));',
    '  bool rising = dot(uWave, vec3(0.2126, 0.7152, 0.0722)) >= base;',
    '  float lower = rising ? 0.0 : -max(uBackground.r, max(uBackground.g, uBackground.b)); float upper = rising ? 1.0 - min(uBackground.r, min(uBackground.g, uBackground.b)) : 0.0;',
    '  offset = floor(clamp(offset, lower, upper) * levels + 0.5) / levels;',
    '  outColor = vec4(toSrgb(uBackground + offset), 1.0);',
    '}'
  ].join('\n');
  function compile(type, src) { var sh = gl.createShader(type); if (!sh) return null; gl.shaderSource(sh, src); gl.compileShader(sh); if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh; gl.deleteShader(sh); return null; }
  function link(frag) {
    var v = compile(gl.VERTEX_SHADER, VERT), f = compile(gl.FRAGMENT_SHADER, frag), p = gl.createProgram(); if (!v || !f || !p) return null;
    gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, 'aPosition'); gl.linkProgram(p); gl.deleteShader(v); gl.deleteShader(f);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { gl.deleteProgram(p); return null; }
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var info = gl.getActiveUniform(p, i); if (info) u[info.name.replace('[0]', '')] = gl.getUniformLocation(p, info.name); }
    return { program: p, u: u };
  }
  var wave = link(WAVE), dither = link(DITH); if (!wave || !dither) return null;
  var buffer = gl.createBuffer(), vao = gl.createVertexArray();
  gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  var field = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, field);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  var framebuffer = gl.createFramebuffer();
  function lin(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function color(v) {
    if (Array.isArray(v)) return [0, 1, 2].map(function (i) { return Math.min(1, Math.max(0, +v[i] || 0)); });
    var m = /^#?([0-9a-f]{6})$/i.exec(String(v).trim()), n = m ? parseInt(m[1], 16) : 0;
    return [lin(((n >> 16) & 255) / 255), lin(((n >> 8) & 255) / 255), lin((n & 255) / 255)];
  }
  var waveRgb = color(o.waveColor), bgRgb = color(o.backgroundColor), mode = MODES[o.mode] || 0, effect = EFFECTS[o.effect] || 0;
  var view = { w: 1, h: 1, ratio: 1, cell: 1, cellCss: 1, cols: 1, rows: 1 }, ptr = { x: 0, y: 0, inside: false, set: false };
  var trailPts = [], ripples = [], trailData = new Float32Array(MAX_TRAIL * 3), rippleData = new Float32Array(MAX_RIPPLES * 4);
  var st = { time: 0, hx: 0, hy: 0, presence: 0, reveal: o.intro ? 0 : 1 }, raf = 0, last = 0, lastDraw = 0, on = false, step = o.fps > 0 && o.fps < 60 ? 1000 / o.fps - 2 : 0;
  function allocate() {
    view.cell = Math.max(1, Math.round(o.pixelSize * view.ratio)); view.cellCss = view.cell / view.ratio;
    view.cols = Math.max(1, Math.ceil(canvas.width / view.cell)); view.rows = Math.max(1, Math.ceil(canvas.height / view.cell));
    gl.bindTexture(gl.TEXTURE_2D, field); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, view.cols, view.rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, field, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  function toUv(x, y) { var aspect = view.w / view.h; return [(x / view.w - 0.5) * aspect, -(y / view.h - 0.5)]; }
  function render() {
    var n = 0, i;
    for (i = 0; i < trailPts.length && n < MAX_TRAIL; i++) { var pt = trailPts[i]; if (pt.weight <= 0.01) continue; trailData[n * 3] = pt.x; trailData[n * 3 + 1] = pt.y; trailData[n * 3 + 2] = pt.weight; n++; }
    var rn = 0;
    for (i = ripples.length - 1; i >= 0 && rn < MAX_RIPPLES; i--) { rippleData[rn * 4] = ripples[i].x; rippleData[rn * 4 + 1] = ripples[i].y; rippleData[rn * 4 + 2] = ripples[i].age; rippleData[rn * 4 + 3] = 1; rn++; }
    var eased = o.intro ? st.reveal * st.reveal * (3 - 2 * st.reveal) : 1;
    gl.bindVertexArray(vao); gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); gl.viewport(0, 0, view.cols, view.rows); gl.useProgram(wave.program);
    var w = wave.u;
    gl.uniform2f(w.uResolution, canvas.width / view.ratio, canvas.height / view.ratio); gl.uniform1f(w.uCell, view.cellCss); gl.uniform1f(w.uTime, st.time);
    gl.uniform1f(w.uWaveSpeed, o.waveSpeed); gl.uniform1f(w.uWaveFrequency, o.waveFrequency); gl.uniform1f(w.uWaveAmplitude, o.waveAmplitude);
    gl.uniform1f(w.uScale, Math.max(0.05, o.scale)); gl.uniform1f(w.uContrast, o.contrast); gl.uniform1f(w.uBrightness, o.brightness);
    gl.uniform1i(w.uEffect, effect); gl.uniform1f(w.uRadius, Math.max(0.001, o.mouseRadius)); gl.uniform1f(w.uStrength, Math.max(0, o.mouseStrength));
    gl.uniform3fv(w.uTrail, trailData); gl.uniform1i(w.uTrailCount, n); gl.uniform4fv(w.uRipples, rippleData); gl.uniform1i(w.uRippleCount, rn);
    gl.uniform1f(w.uIntro, eased); gl.uniform1f(w.uReach, 0.5 * Math.hypot(view.w / view.h, 1) + 0.45);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); gl.useProgram(dither.program);
    var d = dither.u;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, field); gl.uniform1i(d.uField, 0); gl.uniform2i(d.uFieldSize, view.cols, view.rows); gl.uniform1f(d.uCellDevice, view.cell);
    gl.uniform1i(d.uMode, mode); gl.uniform1f(d.uColorNum, Math.max(2, o.colorNum)); gl.uniform3fv(d.uWave, waveRgb); gl.uniform3fv(d.uBackground, bgRgb);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function frame(now) {
    raf = 0;
    if (!on || document.hidden) return;
    if (step && now - lastDraw < step) { raf = requestAnimationFrame(frame); return; }
    lastDraw = now;
    var dt = last ? Math.min(0.05, Math.max(0.0005, (now - last) / 1000)) : 1 / 60; last = now;
    if (o.animate) st.time += dt;
    var engaged = o.mouse && ptr.inside;
    st.presence += ((engaged ? 1 : 0) - st.presence) * (1 - Math.exp(-dt / (engaged ? 0.12 : 0.35)));
    if (ptr.set) {
      var t = toUv(ptr.x, ptr.y), follow = 1 - Math.exp(-dt / 0.06), moved = Math.hypot(t[0] - st.hx, t[1] - st.hy);
      st.hx += (t[0] - st.hx) * follow; st.hy += (t[1] - st.hy) * follow;
      var decay = Math.exp(-dt / (0.08 + o.trail * 0.7));
      for (var i = 0; i < trailPts.length; i++) trailPts[i].weight *= decay;
      var head = trailPts[0];
      if (!head || Math.hypot(head.x - st.hx, head.y - st.hy) > 0.012 || moved > 0.012) trailPts.unshift({ x: st.hx, y: st.hy, weight: st.presence });
      else { head.x = st.hx; head.y = st.hy; head.weight = st.presence; }
      if (o.trail <= 0.001) trailPts.length = Math.min(trailPts.length, 1);
      while (trailPts.length > MAX_TRAIL || (trailPts.length > 1 && trailPts[trailPts.length - 1].weight < 0.01)) trailPts.pop();
    }
    for (var r = ripples.length - 1; r >= 0; r--) { ripples[r].age += dt; if (ripples[r].age >= RIPPLE_S) ripples.splice(r, 1); }
    if (!o.intro) st.reveal = 1; else if (st.reveal < 1) st.reveal = Math.min(1, st.reveal + dt / INTRO_S);
    render();
    var busy = o.animate || st.reveal < 1 || ripples.length > 0 || st.presence > 0.002 || trailPts.some(function (p) { return p.weight > 0.01; });
    if (busy) raf = requestAnimationFrame(frame); else last = 0;
  }
  function wake() { if (!raf && on && !document.hidden) raf = requestAnimationFrame(frame); }
  function resize() {
    var width = Math.max(1, innerWidth), height = Math.max(1, innerHeight), ratio = Math.min(o.dpr || devicePixelRatio || 1, 2);
    view.w = width; view.h = height; canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio)); view.ratio = canvas.width / width;
    allocate(); render(); wake();
  }
  function locate(e) {
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.inside = e.clientX >= 0 && e.clientY >= 0 && e.clientX <= view.w && e.clientY <= view.h;
    if (ptr.inside && !ptr.set) { var p = toUv(ptr.x, ptr.y); st.hx = p[0]; st.hy = p[1]; ptr.set = true; }
  }
  function onMove(e) { locate(e); wake(); }
  function onDown(e) { locate(e); if (!ptr.inside || !o.clickRipple) return; var p = toUv(ptr.x, ptr.y); ripples.push({ x: p[0], y: p[1], age: 0 }); if (ripples.length > MAX_RIPPLES) ripples.shift(); wake(); }
  function onUp(e) { if (e.pointerType !== 'mouse') ptr.inside = false; }
  function onLeave() { ptr.inside = false; }
  function onVisible() { last = 0; wake(); }
  function start() {
    if (on) return; on = true;
    addEventListener('resize', resize);
    if (o.mouse) { addEventListener('pointermove', onMove, { passive: true }); addEventListener('pointerdown', onDown, { passive: true }); addEventListener('pointerup', onUp, { passive: true }); addEventListener('pointercancel', onUp, { passive: true }); document.documentElement.addEventListener('pointerleave', onLeave); }
    document.addEventListener('visibilitychange', onVisible);
    resize();
  }
  function stop() {
    if (!on) return; on = false; cancelAnimationFrame(raf); raf = 0; last = 0;
    removeEventListener('resize', resize); removeEventListener('pointermove', onMove); removeEventListener('pointerdown', onDown); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp);
    document.documentElement.removeEventListener('pointerleave', onLeave); document.removeEventListener('visibilitychange', onVisible);
  }
  function destroy() {
    stop(); gl.deleteProgram(wave.program); gl.deleteProgram(dither.program); gl.deleteBuffer(buffer); gl.deleteVertexArray(vao); gl.deleteTexture(field); gl.deleteFramebuffer(framebuffer);
    var lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }
  function setFps(f) { step = f > 0 && f < 60 ? 1000 / f - 2 : 0; }
  return { canvas: canvas, start: start, stop: stop, destroy: destroy, setFps: setFps };
}`;
