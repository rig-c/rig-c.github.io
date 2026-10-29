import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { resolve, relative, sep, extname } from 'node:path';
import { chromium } from 'playwright';

// Test the built artifact. Port 0 prevents reusing another lane's server.
const args = process.argv.slice(2);
assert(args.length === 0 || (args.length === 2 && args[0] === '--out'), 'Usage: test:browser [--out directory]');
const root = resolve(args[1] ?? '_site');
assert(statSync(resolve(root, 'demos/head-turn/index.html')).isFile(), 'Build the site before test:browser');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = createServer((req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = resolve(root, `.${pathname}`);
    const rel = relative(root, file);
    if (rel === '..' || rel.startsWith(`..${sep}`) || pathname.includes('\0')) throw Error('Invalid path');
    res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    res.end(readFileSync(file));
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
});
let browser;
let page;
let phase = 'startup';
const started = performance.now();
let timedOut = false;
// Whole smoke bound, in addition to each Playwright operation's 30s bound.
const deadline = setTimeout(() => {
  timedOut = true;
  console.error('HEAD_TURN_SMOKE_TIMEOUT 60000ms');
  void browser?.close();
  server.closeAllConnections();
}, 60_000);
const errors = [];
try {
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  browser = await chromium.launch({ headless: true, timeout: 30_000 });
  page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  page.setDefaultTimeout(30_000);
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
  page.on('requestfailed', (request) => errors.push(`Request failed: ${request.url()} ${request.failure()?.errorText}`));
  phase = 'navigation';
  await page.goto(`http://127.0.0.1:${server.address().port}/demos/head-turn/?manual=1&idle=0&dpr=2`, { waitUntil: 'load' });
  phase = 'readiness';
  // The sole readiness contract. Do not fall back to hook existence or aria-busy.
  await page.waitForFunction(() => document.querySelector('#demo')?.getAttribute('data-ready') === 'true', undefined, { polling: 100, timeout: 30_000 });
  phase = 'assertions';
  const result = await page.evaluate(() => {
    const d = window.__headTurnDemo;
    const pointer = {}, clip = {}, environments = [], bounds = [], clamps = [];
    const environment = (label) => environments.push({ label, value: d.rig.environment() });
    environment('ready');
    for (const [name, x, y] of [['neutral', 0, 0], ['left', -1, 0], ['right', 1, 0], ['up', 0, 1], ['down', 0, -1]]) {
      d.setPointer(x, y, true);
      pointer[name] = d.stepFrame(0);
      environment(`pointer:${name}`);
    }
    for (const [name, time] of [['neutral', .08], ['left', .29], ['right', .50], ['up', .71], ['down', .92]]) {
      clip[name] = d.seekClip(time);
      environment(`clip:${name}`);
    }
    for (const [mode, states] of Object.entries({ pointer, clip })) {
      for (const [state, frame] of Object.entries(states)) {
        for (const [axis, binding] of Object.entries(d.bindings)) {
          // The clip intentionally animates only these three dials.
          if (mode === 'clip' && !['yaw', 'pitch', 'body'].includes(axis)) continue;
          bounds.push({ mode, state, axis, value: frame.dials[axis], range: binding.range });
        }
      }
    }
    // bone(name) is a world-transform read, not the dial's local channel.
    // Observe the public adjustment locals after the page applies its callback,
    // and independently check the direct hook's returned clamped values.
    d.setMode('pointer');
    const adjust = d.rig.adjust;
    if (typeof adjust !== 'function') throw Error('Pointer BoneAdjust is missing');
    let applied;
    d.rig.adjust = (bones, context) => {
      adjust(bones, context);
      applied = Object.fromEntries(Object.entries(d.bindings).map(([axis, binding]) => [
        axis, bones.bone(binding.bone)[binding.channel],
      ]));
    };
    try {
      for (const [axis, binding] of Object.entries(d.bindings)) {
        for (const [input, expected] of [[-1e6, binding.range[0]], [0, 0], [1e6, binding.range[1]]]) {
          applied = undefined;
          const frame = d.setDialsDirect({ [axis]: input });
          clamps.push({ axis, input, expected, value: frame.dials[axis], applied: applied?.[axis], range: binding.range });
        }
      }
    } finally {
      d.rig.adjust = adjust;
    }
    // Saturated corners exercise all six pointer bindings, including roll and gaze.
    for (const [x, y] of [[-10, -10], [-10, 10], [10, -10], [10, 10]]) {
      d.setPointer(x, y, true);
      const frame = d.stepFrame(0);
      for (const [axis, binding] of Object.entries(d.bindings)) bounds.push({ mode: 'saturated', state: `${x},${y}`, axis, value: frame.dials[axis], range: binding.range });
    }
    d.setMode('clip'); d.seekClip(0); d.setMode('pointer');
    environment('after-transitions');
    return { pointer, clip, environments, bounds, clamps, axes: Object.keys(d.bindings), renderer: d.getRendererInfo() };
  });
  // Exercise the actual pointermove listener as well as deterministic hook samples.
  await page.evaluate(() => { const d = window.__headTurnDemo; d.setPointer(0, 0, true); d.stepFrame(0); });
  const pointerEvents = {};
  for (const [name, x, y] of [['neutral', 640, 400], ['left', 480, 400], ['right', 800, 400], ['up', 640, 200], ['down', 640, 600]]) {
    await page.mouse.move(x, y);
    pointerEvents[name] = await page.evaluate(() => {
      for (let i = 0; i < 30; i++) window.__headTurnDemo.stepFrame(.05);
      return window.__headTurnDemo.getFeaturePositions().nose;
    });
  }
  for (const [name, axis, sign] of [['left', 'screenX', -1], ['right', 'screenX', 1], ['up', 'screenY', -1], ['down', 'screenY', 1]]) {
    const delta = pointerEvents[name][axis] - pointerEvents.neutral[axis];
    assert(Number.isFinite(delta) && delta * sign > .01, `pointermove:${name}:${axis} delta=${delta}`);
  }
  result.pointerEvents = pointerEvents;
  console.log('HEAD_TURN_MEASUREMENTS', JSON.stringify(result));
  assert.deepEqual(result.axes.sort(), ['body', 'gazeX', 'gazeY', 'pitch', 'roll', 'yaw']);
  let directions = 0;
  for (const [mode, states] of Object.entries({ pointer: result.pointer, clip: result.clip })) {
    for (const [state, feature, coordinate, sign] of [
      ['left', 'nose', 'screenX', -1], ['right', 'nose', 'screenX', 1],
      ['up', 'nose', 'screenY', -1], ['down', 'nose', 'screenY', 1],
      ['left', 'bodyshift', 'screenX', -1], ['right', 'bodyshift', 'screenX', 1],
    ]) {
      const delta = states[state].features[feature][coordinate] - states.neutral.features[feature][coordinate];
      assert(Number.isFinite(delta) && delta * sign > 0.01, `${mode}:${state}:${feature}:${coordinate} direction delta=${delta}`);
      directions++;
    }
  }
  for (const { mode, state, axis, value, range } of result.bounds) {
    assert(Number.isFinite(value) && value >= range[0] && value <= range[1], `${mode}:${state}:${axis} slider bounds: ${value} outside ${range}`);
  }
  assert.equal(result.bounds.length, 69, 'Every pointer/clip/saturated bound case must run');
  assert.equal(result.clamps.length, 18, 'All six min/neutral/max clamps must run');
  assert.equal(result.environments.length, 12, 'Every environment state must run');
  for (const { axis, input, expected, value, applied } of result.clamps) {
    assert(Number.isFinite(value) && Math.abs(value - expected) < 1e-6, `${axis} clamp ${input}: expected ${expected}, got ${value}`);
    assert(Number.isFinite(applied) && Math.abs(applied - expected) < 1e-6, `${axis} applied local ${input}: expected ${expected}, got ${applied}`);
  }
  for (const { label, value } of result.environments) {
    assert.deepEqual(value.wind, [0, 0], `${label} wind`);
    assert.deepEqual(value.gravity, [0, 1], `${label} gravity`);
  }
  assert.notEqual(result.renderer.renderer, 'unavailable');
  assert.equal(result.renderer.resolution, 2);
  assert.deepEqual(errors, [], 'Browser errors');
  assert(!timedOut, 'Whole smoke deadline exceeded');
  console.log('HEAD_TURN_SMOKE_PASS', JSON.stringify({ directions, pointerEvents: 4, bounds: result.bounds.length, clamps: result.clamps.length, appliedLocals: result.clamps.length, environments: result.environments.length, errors: errors.length, retries: 0, elapsedMs: performance.now() - started }));
} catch (error) {
  const diagnostic = await Promise.race([
    page?.evaluate(() => ({
      signal: document.querySelector('#demo')?.getAttribute('data-ready'),
      busy: document.querySelector('#demo')?.getAttribute('aria-busy'),
      hook: Boolean(window.__headTurnDemo),
      loading: document.querySelector('#loading')?.textContent,
      pageTimeMs: performance.now(),
    })).catch(() => 'Page unavailable'),
    new Promise((done) => setTimeout(() => done('Diagnostic exceeded 2000ms'), 2000)),
  ]);
  console.error('HEAD_TURN_SMOKE_FAIL', error, JSON.stringify({ phase, errors, timedOut, elapsedMs: performance.now() - started, diagnostic }));
  process.exitCode = 1;
} finally {
  clearTimeout(deadline);
  await browser?.close();
  server.closeAllConnections();
  await new Promise((done) => server.close(done));
}
