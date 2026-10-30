import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, relative, sep, extname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { captureNative } from './rigboy-native.mjs';

const precheck = process.argv.includes('--precheck');
const root = resolve('_site');
const out = resolve('_site-smoke');
mkdirSync(out, { recursive: true });
assert(statSync(join(root, 'examples/index.html')).isFile(), 'Build the site first');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const server = createServer((req, res) => {
  console.log('HTTP_START', req.url);
  res.on('finish', () => console.log('HTTP_END', req.url, res.statusCode));
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

const deadline = setTimeout(() => { console.error('RIGBOY_TIMEOUT'); void browser?.close(); server.closeAllConnections(); }, 300_000);
const clips = ['idle', 'walk', 'run', 'jump', 'aim', 'shoot', 'hit'];
const sha = '8aa220713b1c8216ea535a8a14a8a34f65ee5a2a';
const isRigboy = url => (url.includes(sha) && url.includes('/rigboy/')) || url.includes('@rig-c/play@1.21.2/');
const pending = [];
const outstanding = new Set();
async function watch(p) {
  // Optional pool transport diagnostic: preserve the actual remote CSS/font response bytes.
  // No synthetic stylesheet and no product/runtime request interception.
  if (process.argv.includes('--proxy-fonts')) await p.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, async route => {
    const response = await route.fetch({ timeout: 15_000 });
    const body = await response.body();
    (report.fontTransport ??= []).push({ url: route.request().url(), status: response.status(), bytes: body.length, sha256: createHash('sha256').update(body).digest('hex') });
    await route.fulfill({ response });
  });
  p.on('request', r => outstanding.add(r.url()));
  p.on('requestfinished', r => { outstanding.delete(r.url()); console.log('FINISHED', Date.now(), r.url()); });
  p.on('requestfailed', r => outstanding.delete(r.url()));
  p.on('pageerror', e => report.errors.push(`pageerror: ${e}`));
  p.on('console', m => { if (m.type() === 'error') report.errors.push(`console: ${m.text()}`); });
  p.on('requestfailed', r => report.errors.push(`request: ${r.url()} ${r.failure()?.errorText}`));
  p.on('response', r => {
    console.log('RESPONSE', Date.now(), r.status(), r.url());
    if (r.status() >= 400) report.errors.push(`HTTP ${r.status()} ${r.url()}`);
    if (isRigboy(r.url())) pending.push((async () => {
      const body = await r.body();
      report.downloads.push({ url: r.url(), bytes: body.length, sha256: createHash('sha256').update(body).digest('hex'), encoding: r.headers()['content-encoding'] ?? 'identity' });
    })());
  });
}
const ready = async (s) => {
  await s.locator('[role=status]').filter({ hasText: 'Live:' }).waitFor({ timeout: 45_000 });
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
  page.setDefaultTimeout(30_000); await watch(page);
  phase = 'gated load'; console.log('RIGBOY_PHASE', phase);
  const requests = [];
  page.on('request', r => { if (isRigboy(r.url())) requests.push(r.url()); });
  await page.goto(`${base}/examples/?demo-test=1`, { waitUntil: 'commit' });
  console.log('RIGBOY_COMMIT');
  await page.locator('#rigboy-demo.demo-ready').waitFor({ timeout: 60_000 });
  assert.equal(requests.length, 0, 'rigboy downloaded before Start');
  let section = page.locator('#rigboy-demo');
  await section.locator('[data-part=demo-start]').click(); await ready(section);
  await Promise.all(pending);
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
  for (const clip of ['walk', 'run']) {
    await section.locator('select').selectOption(clip);
    await section.locator('[data-part=demo-travel]').check();
    const travel = await section.evaluate((s, clip) => {
      const p = s.demo.player, v = s.demo.view, stage = s.querySelector('.demo-stage');
      p.pause(); p.seek(0); p.resume();
      let wraps = 0, previous = p.bone('root').x, min = Infinity, max = -Infinity;
      for (let i = 0; i < 1800; i++) {
        p.frame(1 / 60);
        const x = p.bone('root').x, b = p.bounds();
        if (x < previous - 10) wraps++;
        previous = x;
        const left = v.left + b.x * v.scale, right = left + b.width * v.scale;
        const top = v.top - (b.y + b.height) * v.scale, bottom = v.top - b.y * v.scale;
        min = Math.min(min, left); max = Math.max(max, right);
        if (left < 0 || right > stage.clientWidth || top < 0 || bottom > stage.clientHeight) throw Error(`travel escaped ${clip} at ${i}: ${JSON.stringify({ left, right, top, bottom })}`);
      }
      return { clip, seconds: p.time, wraps, min, max, stageWidth: stage.clientWidth, root: p.bone('root').x };
    }, clip);
    assert(travel.seconds > 29.9); assert(travel.wraps >= (clip === 'walk' ? 9 : 28));
    report.travel.push(travel);
    await section.locator('[data-part=demo-travel]').uncheck();
  }
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
    await page.locator('#live-demo.demo-ready').waitFor({ timeout: 60_000 });
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
      assert(await family.locator('canvas').evaluate(c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v,i) => i%4===3 && v>0)));
      await family.locator(`#demo-${part}`).click();
    }
    await family.locator('#demo-character').selectOption('luna'); await ready(family);
    await family.locator('#demo-outfit').selectOption('homewear'); await ready(family);
    assert(page.url().includes('character=luna')); assert(page.url().includes('outfit=homewear'));
    report.family.push({ time, status: await family.locator('#demo-status').textContent(), source: await family.locator('#demo-source').textContent() });
    await family.screenshot({ path: join(out, 'family.png') });
    phase = 'Play page regression';
    await page.goto(`${base}/docs/play/?demo-test=1`, { waitUntil: 'commit' });
    await page.locator('.live-demo-play.demo-ready').waitFor({ timeout: 60_000 });
    const play = page.locator('.live-demo-play');
    await play.locator('[data-part=demo-start]').click(); await ready(play);
    assert.match(await play.locator('[data-part=demo-status]').textContent(), /2 motions/);
    await play.locator('[data-part=demo-mode]').selectOption('canvas'); await ready(play);
    await overlays(play);
    report.family.push({ play: await play.locator('[data-part=demo-status]').textContent() });
    phase = 'reduced motion';
    const reduced = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 375, height: 1000 } }); await watch(reduced);
    await reduced.goto(`${base}/examples/?demo-test=1`, { waitUntil: 'commit' });
    await reduced.locator('#rigboy-demo.demo-ready').waitFor({ timeout: 60_000 });
    const r = reduced.locator('#rigboy-demo'); await r.locator('[data-part=demo-start]').click(); await ready(r);
    assert.equal(await r.locator('[data-part=demo-play]').textContent(), 'Play');
    assert.equal(await r.evaluate(s => s.demo.player.time), 0);
    await reduced.close();
    phase = 'noscript';
    const nojs = await browser.newPage({ javaScriptEnabled: false }); await watch(nojs);
    await nojs.goto(`${base}/examples/`, { waitUntil: 'commit' });
    assert.equal(await nojs.locator('#rigboy-demo noscript a').getAttribute('href'), `https://raw.githubusercontent.com/rig-c/examples/${sha}/rigboy/preview.webp`);
    await nojs.close();
  }
  assert.deepEqual(report.errors, []);
  console.log('RIGBOY_SMOKE_PASS', JSON.stringify({ clips: report.clips.length, aim: report.aim.map(a => a.toy), travel: report.travel, errors: report.errors.length, downloadBytes: 2264805 }));
} catch (e) {
  report.failure = { phase, error: String(e), stack: e.stack, outstanding: [...outstanding] };
  report.diagnostic = await Promise.race([page?.evaluate(() => ({ ready: document.readyState, title: document.title, demos: [...document.querySelectorAll('.live-demo')].map(s => ({ id:s.id, class:s.className, status:s.querySelector('[role=status]')?.textContent })) })).catch(e => String(e)), new Promise(done => setTimeout(() => done('diagnostic timeout'), 2000))]);
  console.error('RIGBOY_DIAGNOSTIC', JSON.stringify({ failure:report.failure, diagnostic:report.diagnostic, errors: report.errors }));
  if (page) await page.screenshot({ path: join(out, 'failure.png'), fullPage: true }).catch(() => {});
  console.error('RIGBOY_SMOKE_FAIL', JSON.stringify(report.failure)); process.exitCode = 1;
} finally {
  clearTimeout(deadline); clearInterval(memorySample); report.peakRssBytes = peakRssBytes; await Promise.allSettled(pending);
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser?.close(); server.closeAllConnections(); await new Promise(done => server.close(done));
}
