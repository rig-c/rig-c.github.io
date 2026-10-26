// Curvature check: one fragment shader over the original painting. Each pixel samples the
// painting at its own position plus depth × camera offset, so near (bright) pixels move more
// than far ones. No mesh, no rig, no rotation of the whole image.
// depth.webp is the supplied depth map resampled into the painting's 1368×2000 frame
// (x_depth = 0.99908·x − 2.939, y unchanged; see the site README).
'use strict';

const MAX_SHIFT = 0.03; // fraction of the image width at strength 1 and the pointer at the edge
const SETTLE = 8; // 1/s; exponential damping rate toward the pointer target
const BACKGROUND = [0x20 / 255, 0x23 / 255, 0x2a / 255];

const VERT = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;
const FRAG = `
precision mediump float;
uniform sampler2D uImage;
uniform sampler2D uDepth;
uniform vec4 uRect;      // image rectangle in drawing-buffer pixels: x, y (bottom-left), w, h
uniform vec2 uOffset;    // camera offset in image UV units
uniform float uGamma;
uniform float uContrast;
uniform float uBias;
uniform float uShowDepth;
uniform vec3 uBackground;
float depthAt(vec2 uv) {
  float raw = texture2D(uDepth, uv).r;
  return clamp((pow(raw, uGamma) - 0.5) * uContrast + 0.5 + uBias, 0.0, 1.0);
}
void main() {
  vec2 p = (gl_FragCoord.xy - uRect.xy) / uRect.zw;
  p.y = 1.0 - p.y;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) { gl_FragColor = vec4(uBackground, 1.0); return; }
  float depth = depthAt(p);
  if (uShowDepth > 0.5) { gl_FragColor = vec4(vec3(depth), 1.0); return; }
  gl_FragColor = texture2D(uImage, clamp(p + depth * uOffset, 0.0, 1.0));
}`;

const $ = (id) => document.getElementById(id);
const main = $('curvature');
const canvas = $('view');
const status = $('status');

function fail(message) {
  status.textContent = message;
  main.setAttribute('aria-busy', 'false');
  main.dataset.state = 'error';
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'shader compile failed');
  return shader;
}

function texture(gl, unit, image) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  return tex;
}

// Controls panel: open on desktop, collapsed below 800 CSS pixels (as on the head-turn page).
const toggle = $('controls-toggle');
const panel = $('curvature-controls');
const phone = matchMedia('(max-width: 799px)');
function setOpen(open) {
  const expanded = !phone.matches || open;
  panel.toggleAttribute('data-open', expanded);
  panel.inert = !expanded;
  toggle.setAttribute('aria-expanded', String(expanded));
}
setOpen(false);
phone.addEventListener('change', () => setOpen(false));
toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
addEventListener('keydown', (event) => {
  if (phone.matches && event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    setOpen(false);
    toggle.focus();
  }
});

const params = { strength: 1, gamma: 1, contrast: 1, bias: 0, showDepth: false };
const target = { x: 0, y: 0 };
const camera = { x: 0, y: 0 };
let requestDraw = () => {};

function bindSlider(name, format) {
  const input = $(name);
  const output = $(`${name}Value`);
  const update = () => {
    params[name] = Number(input.value);
    output.textContent = format(params[name]);
    requestDraw();
  };
  input.addEventListener('input', update);
  update();
}
bindSlider('strength', (v) => `${v.toFixed(2)}×`);
bindSlider('gamma', (v) => v.toFixed(2));
bindSlider('contrast', (v) => v.toFixed(2));
bindSlider('bias', (v) => v.toFixed(2));
$('showDepth').addEventListener('change', (event) => { params.showDepth = event.target.checked; requestDraw(); });
$('centre').addEventListener('click', () => { target.x = 0; target.y = 0; requestDraw(); });

const clamp1 = (v) => Math.max(-1, Math.min(1, v));
// Mouse and pen: the pointer's position relative to the viewport centre is the camera target.
// Touch: dragging moves the target by the drag distance, so a finger never has to cover the face.
let drag = null;
canvas.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'touch') return;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointerup', (event) => { if (drag && drag.id === event.pointerId) drag = null; });
canvas.addEventListener('pointercancel', (event) => { if (drag && drag.id === event.pointerId) drag = null; });
addEventListener('pointermove', (event) => {
  const halfW = innerWidth / 2;
  const halfH = innerHeight / 2;
  if (event.pointerType === 'touch') {
    if (!drag || drag.id !== event.pointerId) return;
    target.x = clamp1(target.x + (event.clientX - drag.x) / halfW);
    target.y = clamp1(target.y + (event.clientY - drag.y) / halfH);
    drag.x = event.clientX;
    drag.y = event.clientY;
  } else {
    target.x = clamp1((event.clientX - halfW) / halfW);
    target.y = clamp1((event.clientY - halfH) / halfH);
  }
  requestDraw();
});

async function start() {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) return fail('This check needs WebGL, which this browser did not provide.');
  const [image, depth] = await Promise.all([loadImage('./original.webp'), loadImage('./depth.webp')]);
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'program link failed');
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  texture(gl, 0, image);
  texture(gl, 1, depth);
  const u = (name) => gl.getUniformLocation(program, name);
  const uni = {
    image: u('uImage'), depth: u('uDepth'), rect: u('uRect'), offset: u('uOffset'), gamma: u('uGamma'),
    contrast: u('uContrast'), bias: u('uBias'), showDepth: u('uShowDepth'), background: u('uBackground'),
  };
  gl.uniform1i(uni.image, 0);
  gl.uniform1i(uni.depth, 1);
  gl.uniform3fv(uni.background, BACKGROUND);
  const aspect = image.naturalWidth / image.naturalHeight;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    // Contain-fit with a margin of 4% of the shorter side, leaving room for the camera shift.
    const margin = Math.min(w, h) * 0.04;
    let rw = w - 2 * margin;
    let rh = rw / aspect;
    if (rh > h - 2 * margin) { rh = h - 2 * margin; rw = rh * aspect; }
    gl.viewport(0, 0, w, h);
    gl.uniform4f(uni.rect, (w - rw) / 2, (h - rh) / 2, rw, rh);
  }

  let last = 0;
  let pending = false;
  function frame(now) {
    pending = false;
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
    last = now;
    const k = 1 - Math.exp(-SETTLE * dt);
    camera.x += (target.x - camera.x) * k;
    camera.y += (target.y - camera.y) * k;
    resize();
    const shift = MAX_SHIFT * params.strength;
    // Same pixel distance on both axes: the y component is scaled by the image's aspect.
    gl.uniform2f(uni.offset, camera.x * shift, camera.y * shift * aspect);
    gl.uniform1f(uni.gamma, params.gamma);
    gl.uniform1f(uni.contrast, params.contrast);
    gl.uniform1f(uni.bias, params.bias);
    gl.uniform1f(uni.showDepth, params.showDepth ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const moving = Math.abs(target.x - camera.x) > 1e-4 || Math.abs(target.y - camera.y) > 1e-4;
    main.dataset.settled = String(!moving);
    if (moving) requestDraw(); else last = 0;
  }
  requestDraw = () => { if (!pending) { pending = true; requestAnimationFrame(frame); } };
  addEventListener('resize', requestDraw);
  canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); fail('The WebGL context was lost; reload the page.'); });
  requestDraw();
  status.textContent = '';
  main.setAttribute('aria-busy', 'false');
  main.dataset.state = 'ready';
}

start().catch((error) => fail(`The curvature check could not start: ${error.message}`));
