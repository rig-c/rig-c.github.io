import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, relative, sep, extname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { captureNative } from './rigboy-native.mjs';

const READY_MS = 180_000; // Cold pool Canvas2D initialization was measured at ~79s; CI is preferred.
const precheck = process.argv.includes('--precheck');
const root = resolve('_site');
const out = resolve('_site-smoke');
mkdirSync(out, { recursive: true });
assert(statSync(join(root, 'examples/index.html')).isFile(), 'Build the site first');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const server = createServer((req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(root, `.${path}`), rel = relative(root, file);
    assert(rel !== '..' && !rel.startsWith(`..${sep}`) && !path.includes('\0'));
    res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    res.end(readFileSync(file));
  } catch { res.writeHead(404); res.end('Not found'); }
});
const report = { precheck, errors: [], downloads: [], clips: [], aim: [], travel: [], family: [], native: [] };
let browser, page, phase = 'start';
let peakRssBytes = 0;
// Linux /proc status only: no argv or environment reads. Include all browser descendants.
const memorySample = setInterval(() => {
  if (process.platform !== 'linux') return;
  const processes = new Map();
  for (const id of readdirSync('/proc').filter(x => /^\d+$/.test(x))) {
    try { const s = readFileSync(`/proc/${id}/status`, 'utf8'); processes.set(Number(id), { parent: Number(s.match(/^PPid:\s+(\d+)/m)?.[1]), rss: Number(s.match(/^VmRSS:\s+(\d+)/m)?.[1] ?? 0) * 1024 }); } catch {}
  }
  const ids = new Set([process.pid]); let changed = true;
  while (changed) { changed = false; for (const [id, p] of processes) if (ids.has(p.parent) && !ids.has(id)) { ids.add(id); changed = true; } }
  peakRssBytes = Math.max(peakRssBytes, [...ids].reduce((sum,id) => sum + (processes.get(id)?.rss ?? 0),0));
}, 500);

const deadline = setTimeout(() => { console.error('RIGBOY_TIMEOUT'); void browser?.close(); server.closeAllConnections(); }, 480_000);
const clips = ['idle', 'walk', 'run', 'jump', 'aim', 'shoot', 'hit'];
const sha = '8aa220713b1c8216ea535a8a14a8a34f65ee5a2a';
const isRigboy = url => (url.includes(sha) && url.includes('/rigboy/')) || url.includes('@rig-c/play@1.21.2/');
const pending = [];
const outstanding = new Set();
async function watch(p) {
  p.on('request', r => outstanding.add(r.url()));
  p.on('requestfinished', r => outstanding.delete(r.url()));
  p.on('requestfailed', r => outstanding.delete(r.url()));
  p.on('pageerror', e => report.errors.push(`pageerror: ${e}`));
  p.on('console', m => { if (m.type() === 'error') report.errors.push(`console: ${m.text()}`); });
  p.on('requestfailed', r => report.errors.push(`request: ${r.url()} ${r.failure()?.errorText}`));
  p.on('response', r => {
    if (r.status() >= 400) report.errors.push(`HTTP ${r.status()} ${r.url()}`);
    if (isRigboy(r.url())) pending.push((async () => {
      const body = await r.body();
      report.downloads.push({ url: r.url(), bytes: body.length, sha256: createHash('sha256').update(body).digest('hex'), encoding: r.headers()['content-encoding'] ?? 'identity' });
    })());
  });
}
const ready = async (s) => {
  await s.locator('[role=status]').filter({ hasText: 'Live:' }).waitFor({ timeout: READY_MS });
  assert.equal(await s.locator('[role=status]').getAttribute('data-kind'), 'ready');
};
const state = () => page.locator('#rigboy-demo').evaluate(s => {
  const p = s.demo.player, b = p.bone('toy');
  return { time: p.time, current: p.current, toy: b.rotationX, rootX: p.bone('root').x, bounds: p.bounds(), spring: p.readPhysicsParameters('arm_settle'), view: s.demo.view };
});
async function aim(s, value) {
  const slider = s.locator('[data-part=demo-aim]');
  await slider.press('Home');
  for (let i = -8; i < value; i++) await slider.press('ArrowRight');
  // Keyboard changes exercise the real range input's input event.

  assert.equal(await s.locator('output').textContent(), `${value}°`);
}
async function overlays(s) {
  for (const part of ['bones', 'mesh']) {
    await s.locator(`[data-part=demo-${part}], #demo-${part}`).click();
    const pixels = await s.locator('canvas.demo-overlay').evaluate(c => {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let count = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) count++; return count;
    });
    assert(pixels > 100, `${part} overlay has no drawn pixels`);
    await s.locator(`[data-part=demo-${part}], #demo-${part}`).click();
  }
}
try {
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(READY_MS); await watch(page);
  phase = 'gated load'; console.log('RIGBOY_PHASE', phase);
  const requests = [];
  page.on('request', r => { if (isRigboy(r.url())) requests.push(r.url()); });
  await page.goto(`${base}/examples/?demo-test=1`, { waitUntil: 'commit' });
  console.log('RIGBOY_COMMIT');
  await page.locator('#rigboy-demo.demo-ready').waitFor({ timeout: READY_MS });
  assert.equal(requests.length, 0, 'rigboy downloaded before Start');
  let section = page.locator('#rigboy-demo');
  await section.locator('[data-part=demo-start]').click(); await ready(section);
  await Promise.all(pending);
  report.travelEnvelope = await section.evaluate(s => s.demo.travelEnvelope);
  assert(report.travelEnvelope.samples > 0);
  assert.deepEqual(report.travelEnvelope.clips, ['walk', 'run']);
  assert.deepEqual(report.travelEnvelope.aims, [-8, 0, 8]);
  assert.equal(report.downloads.length, 4, 'runtime, helper, model and atlas only');
  assert.equal(report.downloads.reduce((n, d) => n + d.bytes, 0), 2264805);
  assert.equal(await section.locator('[data-part=demo-travel]').isChecked(), false);
  phase = 'UI clip playback'; console.log('RIGBOY_PHASE', phase);
  for (const clip of clips) {
    await section.locator('select').selectOption(clip);
    const before = await state();
    if (clip !== 'aim') {
      await page.waitForFunction(t => document.querySelector('#rigboy-demo').demo.player.time > t + 0.16, before.time);
      const after = await state();
      assert.equal(after.current, clip); assert(after.time > before.time);
      assert.notEqual(JSON.stringify(after.bounds), JSON.stringify(before.bounds), `${clip} pose did not change`);
      report.clips.push({ clip, before, after });
    } else {
      assert.equal(before.current, 'idle', 'aim range must not autoplay');
      assert(Math.abs(before.time) < 1e-9);
      report.clips.push({ clip, before });
    }
    if (!precheck) {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await section.screenshot({ path: join(out, `desktop-${clip}.png`) });
    }
  }
  phase = 'aim endpoints and paused input';
  await section.locator('select').selectOption('aim');
  for (const value of [-8, 0, 8]) {
    await aim(section, value);
    const measured = await state();
    assert(Math.abs(measured.toy - (90 + value)) < 0.2, `toy ${value}: ${measured.toy}`);
    assert.equal(measured.spring.override.mix, 0);
    report.aim.push({ input: value, ...measured });
  }
  const held = await state();
  await page.waitForTimeout(250);
  assert.equal((await state()).toy, held.toy);
  assert.equal((await state()).time, held.time);
  await section.locator('select').selectOption('shoot');
  assert.equal((await state()).spring.override, null, 'shoot must restore recoil spring after direct aim');
  await aim(section, 0);
  assert.equal((await state()).spring.override, null, 'slider during shoot must retain recoil');
  phase = 'long travel and bounding';
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    // Wait for ResizeObserver fit using actual stage width; no arbitrary layout sleep.
    await section.evaluate(s => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
    for (const clip of ['walk', 'run']) {
      await section.locator('select').selectOption(clip);
      await section.locator('[data-part=demo-travel]').check();
      for (const angle of [-8, 0, 8]) {
        await aim(section, angle);
        const travel = await section.evaluate((s, { clip, angle, width }) => {
          const p = s.demo.player, v = s.demo.view, stage = s.querySelector('.demo-stage');
          const { low, high, span, padding } = s.demo.travelWindow;
          if (!(span > 0)) throw Error('No measured travel interval');
          p.play(clip); p.repose();
          let wraps = 0, previous = p.bone('root').x, min = Infinity, max = -Infinity;
          for (let i = 0; i < 1800; i++) {
            p.advance(1 / 60);
            const x = p.bone('root').x, b = p.bounds();
            if (x < previous - span / 2) wraps++;
            previous = x;
            const left = v.left + b.x * v.scale, right = left + b.width * v.scale;
            const top = v.top - (b.y + b.height) * v.scale, bottom = v.top - b.y * v.scale;
            min = Math.min(min, left); max = Math.max(max, right);
            if (left < 0 || right > stage.clientWidth || top < 0 || bottom > stage.clientHeight) throw Error(`travel escaped ${clip} at ${i}: ${JSON.stringify({ left, right, top, bottom, width, angle })}`);
          }
          p.draw();
          const velocity = clip === 'walk' ? 64 : 192; // pinned controls.js, rig px/s
          const expectedWraps = Math.floor((velocity * p.time - low) / span) - Math.floor(-low / span);
          return { clip, angle, width, simulatedSeconds: p.time, wraps, expectedWraps, min, max, stageWidth: stage.clientWidth, root: p.bone('root').x, interval: { low, high, span, padding } };
        }, { clip, angle, width });
        assert(travel.simulatedSeconds > 29.9);
        assert.equal(travel.wraps, travel.expectedWraps);
        assert(travel.wraps > 0, '30 seconds must exercise wrap');
        report.travel.push(travel);
      }
      await section.locator('[data-part=demo-travel]').uncheck();
    }
  }
  await page.setViewportSize({ width: 1280, height: 1000 });
  await aim(section, 0);
  await section.locator('select').selectOption('idle');
  assert.equal(await section.locator('[data-part=demo-travel]').isEnabled(), false);
  phase = 'pause and overlays';
  await section.locator('[data-part=demo-play]').click();
  const paused = (await state()).time; await page.waitForTimeout(180);
  assert.equal((await state()).time, paused);
  await aim(section, 8); assert((await state()).toy > 97);
  await section.locator('[data-part=demo-play]').click();
  await page.waitForFunction(t => document.querySelector('#rigboy-demo').demo.player.time > t, paused);
  await aim(section, 0); await overlays(section);
  if (!precheck) {
    phase = 'phone screenshots';
    await page.setViewportSize({ width: 375, height: 1000 });
    for (const clip of clips) {
      await section.locator('select').selectOption(clip);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${clip} horizontal scroll`);
      await section.screenshot({ path: join(out, `phone-${clip}.png`) });
    }
    phase = 'native setup extrema diff';
    report.native = await captureNative(page, out);
    await page.goto(`${base}/examples/?demo-test=1`, { waitUntil: 'commit' });
    await page.locator('#live-demo.demo-ready').waitFor({ timeout: READY_MS });
    phase = 'Family regression';
    await page.setViewportSize({ width: 1280, height: 1000 });
    const family = page.locator('#live-demo');
    await family.locator('#demo-start').click(); await ready(family);
    assert.equal(await family.locator('#demo-motion').inputValue(), 'idle');
    const time = await family.evaluate(s => s.demo.player.time);
    await family.locator('#demo-play').click();
    const pause = await family.evaluate(s => s.demo.player.time); await page.waitForTimeout(180);
    assert.equal(await family.evaluate(s => s.demo.player.time), pause);
    await family.locator('#demo-play').click();
    await page.waitForFunction(t => document.querySelector('#live-demo').demo.player.time > t, pause);
    // Family's id-based controls use the shared overlay implementation.
    for (const part of ['bones', 'mesh']) {
      await family.locator(`#demo-${part}`).click();
      assert.equal(await family.locator(`#demo-${part}`).getAttribute('aria-pressed'), 'true');
      assert(await family.locator('canvas.demo-overlay').evaluate(c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v,i) => i%4===3 && v>0)));
      await family.locator(`#demo-${part}`).click();
    }
    assert.equal(await family.evaluate(s => s.demo.runtimeUrl), 'https://cdn.jsdelivr.net/npm/@rig-c/play@1.12.0/dist/index.js');
    const familyRuntimeRequests = [];
    page.on('request', r => { if (r.url().includes('/family/') && r.url().endsWith('skeleton.model.json')) familyRuntimeRequests.push(r.url()); });
    const switchFamily = async (selector, value, key, label) => {
      await family.locator(selector).selectOption(value);
      await family.evaluate((s, { key, label }) => new Promise((resolve, reject) => {
        const deadline = performance.now() + 180_000;
        const check = () => {
          const status = s.querySelector('[role=status]');
          if (status.dataset.kind === 'error') return reject(Error(status.textContent));
          if (status.dataset.kind === 'ready' && s.demo.modelKey === key && status.textContent.includes(label)) return resolve();
          if (performance.now() > deadline) return reject(Error(`Family did not finish loading ${key}`));
          setTimeout(check, 50);
        }; check();
      }), { key, label });
      const source = await family.locator('#demo-source a').first().getAttribute('href');
      assert(source.includes(key === 'luna/office' ? '/family/luna/config.json' : '/family/outfits/homewear/luna/authoring/config.json'));
    };
    await switchFamily('#demo-character', 'luna', 'luna/office', 'Character 2, office');
    await switchFamily('#demo-outfit', 'homewear', 'luna/homewear', 'Character 2, homewear');
    assert(familyRuntimeRequests.some(u => u.includes('/family/luna/')));
    assert(familyRuntimeRequests.some(u => u.includes('/family/outfits/homewear/luna/')));
    report.family.push({ runtime: await family.evaluate(s => s.demo.runtimeUrl), requests: familyRuntimeRequests });
    assert(page.url().includes('character=luna')); assert(page.url().includes('outfit=homewear'));
    report.family.push({ time, status: await family.locator('#demo-status').textContent(), source: await family.locator('#demo-source').textContent() });
    await family.screenshot({ path: join(out, 'family.png') });
    phase = 'Play page regression';
    await page.goto(`${base}/docs/play/?demo-test=1`, { waitUntil: 'commit' });
    await page.locator('.live-demo-play.demo-ready').waitFor({ timeout: READY_MS });
    const play = page.locator('.live-demo-play');
    await play.locator('[data-part=demo-start]').click(); await ready(play);
    assert.match(await play.locator('[data-part=demo-status]').textContent(), /2 motions/);
    await play.locator('[data-part=demo-mode]').selectOption('canvas');
    await page.waitForFunction(() => document.querySelector('.live-demo-play').demo.player.mode === 'canvas' && document.querySelector('.live-demo-play [role=status]').dataset.kind === 'ready', null, { timeout: READY_MS });
    await ready(play);
    assert.equal(await play.evaluate(s => s.demo.modelKey), 'roa/office');
    assert.equal(await play.evaluate(s => s.demo.runtimeUrl), 'https://cdn.jsdelivr.net/npm/@rig-c/play@1.12.0/dist/index.js');
    await overlays(play);
    report.family.push({ play: await play.locator('[data-part=demo-status]').textContent() });
    phase = 'reduced motion';
    const reduced = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 375, height: 1000 } }); reduced.setDefaultTimeout(READY_MS); await watch(reduced);
    await reduced.goto(`${base}/examples/?demo-test=1`, { waitUntil: 'commit' });
    await reduced.locator('#rigboy-demo.demo-ready').waitFor({ timeout: READY_MS });
    const r = reduced.locator('#rigboy-demo'); await r.locator('[data-part=demo-start]').click(); await ready(r);
    assert.equal(await r.locator('[data-part=demo-play]').textContent(), 'Play');
    assert.equal(await r.evaluate(s => s.demo.player.time), 0);
    await reduced.waitForLoadState('load', { timeout: READY_MS });
    await reduced.close();
    phase = 'noscript';
    const nojs = await browser.newPage({ javaScriptEnabled: false }); nojs.setDefaultTimeout(READY_MS); await watch(nojs);
    await nojs.goto(`${base}/examples/`, { waitUntil: 'load', timeout: READY_MS });
    assert.equal(await nojs.locator('#rigboy-demo noscript a').getAttribute('href'), `https://raw.githubusercontent.com/rig-c/examples/${sha}/rigboy/preview.webp`);
    await nojs.close();
  }
  assert.deepEqual(report.errors, []);
  console.log('RIGBOY_SMOKE_PASS', JSON.stringify({ clips: report.clips.length, aim: report.aim.map(a => a.toy), travel: report.travel, errors: report.errors.length, downloadBytes: 2264805 }));
} catch (e) {
  report.failure = { phase, error: String(e), stack: e.stack, outstanding: [...outstanding] };
  report.diagnostic = await Promise.race([page?.evaluate(() => ({ ready: document.readyState, title: document.title, demos: [...document.querySelectorAll('.live-demo')].map(s => ({ id:s.id, class:s.className, status:s.querySelector('[role=status]')?.textContent })) })).catch(e => String(e)), new Promise(done => setTimeout(() => done('diagnostic timeout'), 2000))]);
  console.error('RIGBOY_DIAGNOSTIC', JSON.stringify({ failure:report.failure, diagnostic:report.diagnostic, errors: report.errors }));
  // Persist the failure before capture/close so Actions always has a useful report.
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
  if (page) await page.screenshot({ path: join(out, 'failure.png'), fullPage: true, timeout: 15_000 }).catch(() => {});
  console.error('RIGBOY_SMOKE_FAIL', JSON.stringify(report.failure)); process.exitCode = 1;
} finally {
  clearTimeout(deadline); clearInterval(memorySample); report.peakRssBytes = peakRssBytes; await Promise.allSettled(pending);
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
  const pngs = [];
  function inventory(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) inventory(file);
      else if (entry.name.endsWith('.png')) {
        const b = readFileSync(file);
        assert.equal(b.subarray(1, 4).toString(), 'PNG');
        pngs.push({ path: relative(out, file), bytes: b.length, width: b.readUInt32BE(16), height: b.readUInt32BE(20), sha256: createHash('sha256').update(b).digest('hex') });
      }
    }
  }
  inventory(out);
  writeFileSync(join(out, 'screenshots.json'), JSON.stringify(pngs, null, 2));
  await browser?.close(); server.closeAllConnections(); await new Promise(done => server.close(done));
}
