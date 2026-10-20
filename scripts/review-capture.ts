#!/usr/bin/env bun
/**
 * Rebuild the Review page clip (assets/docs/review-flow.mp4 and its poster).
 *
 * Usage, from a scratch directory where the pinned tools are installed:
 *
 *   bun add @rig-c/review@0.2.1 playwright@1.63.0
 *   PARTS_EXAMPLES=/path/to/parts-examples \
 *   PLAYWRIGHT_MODULE=$PWD/node_modules/playwright/index.mjs \
 *     bun /path/to/site/scripts/review-capture.ts --review $PWD/node_modules/.bin/rig-review [--keep DIR]
 *
 * What it does, all through the tool's own page:
 *   1. writes Character 1's check build at rig-c/parts-examples@144f556
 *      (family/roa/out/check/build, from before the shoulder repair) into a
 *      temporary folder named `before/build/`, read with `git show`, and
 *      starts `rig-review <folder> --port 0` on it, with its session state in
 *      a temporary directory (RIG_REVIEW_STATE_DIR);
 *   2. opens the printed loopback URL in headless Chromium (WebGL through
 *      --use-angle=metal on macOS) at 1200x750, and drives the page the way
 *      the Review page's case describes: the idle plays; Playback, the time
 *      slider is set to 1.25 s (frame 15 at the check sampler's 12 fps) and
 *      the idle pauses; `topwear` is picked in the parts list (the camera fits
 *      it) and Solo is ticked; Use slot for feedback; frames 15-15, category
 *      Defect and the one-line summary are entered and added; status Changes
 *      requested; Submit review; Feedback JSON;
 *   3. opens the downloaded export in the same browser for the last shot.
 *
 * Frames. The page's clock is Playwright's fake clock: before each screenshot
 * it is advanced by exactly 1/12 s, so the idle plays at its own speed and the
 * capture is deterministic at 12 fps however long a screenshot takes. The
 * cursor is drawn by this script (an arrow element that does not take
 * pointer events) because headless screenshots have none; it moves to each
 * control before the real click lands there.
 *
 * Encode: the site recipe (scripts/encode-video.sh) - H.264 High, yuv420p,
 * BT.709, -tune animation, CRF 20, closed GOP 60, faststart, no audio. This
 * clip is one pass, not a loop, so there are no seam zones and no seam check.
 * Poster = the encoded clip's frame 0.
 */
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const FPS = 12;
const SHA = '144f556';
const BUILD = 'family/roa/out/check/build';
const FILES = ['skeleton.atlas', 'skeleton.json', 'skeleton.model.json', 'skeleton.png'];
const SUMMARY = 'Screen-left shoulder top of topwear is flat and indented (cloth alpha cut); exposed when hair moves aside';
const OUT = 'assets/docs/review-flow.mp4';
const VIEW = { width: 1200, height: 750 };

const args = process.argv.slice(2);
const opt = (name: string) => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
const review = opt('--review');
const keep = opt('--keep');
const clone = process.env.PARTS_EXAMPLES;
if (!review || !clone) {
  console.error('usage: PARTS_EXAMPLES=<clone> PLAYWRIGHT_MODULE=<playwright> bun scripts/review-capture.ts --review <rig-review bin> [--keep DIR]');
  process.exit(2);
}
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
const ffprobe = process.env.FFPROBE ?? 'ffprobe';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');

const work = keep ? resolve(keep) : mkdtempSync(join(tmpdir(), 'review-capture-'));
const pkg = join(work, 'before');
const frames = join(work, 'frames');
const state = join(work, 'state');
for (const d of [join(pkg, 'build'), frames, state]) mkdirSync(d, { recursive: true });
for (const f of FILES) writeFileSync(join(pkg, 'build', f), execFileSync('git', ['-C', clone, 'show', `${SHA}:${BUILD}/${f}`], { maxBuffer: 1 << 28 }));

const server = spawn(review, [pkg, '--port', '0'], { env: { ...process.env, RIG_REVIEW_STATE_DIR: state }, stdio: ['ignore', 'pipe', 'inherit'] });
const url: string = await new Promise((ok, fail) => {
  let text = '';
  server.stdout!.on('data', (chunk: Buffer) => { text += chunk; const m = text.match(/http:\/\/127\.0\.0\.1:\d+\/#cap=\S+/); if (m) ok(m[0]); });
  server.on('exit', code => fail(new Error(`rig-review exited ${code}`)));
});
const reviewVersion = JSON.parse(readFileSync(join(dirname(resolve(review)), '..', '@rig-c', 'review', 'package.json'), 'utf8')).version;

const browser = await chromium.launch({ args: ['--use-angle=metal'] });
let status = 0;
try {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, acceptDownloads: true, colorScheme: 'light', reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date('2026-10-20T00:00:00Z') });
  await page.goto(url);
  // Let the page load on the fake clock until the rig is drawn.
  for (let i = 0; ; i++) {
    await page.clock.runFor(100);
    await page.waitForTimeout(50);
    const drawn = /WebGL|Canvas/.test((await page.locator('#renderer-state').textContent()) ?? '');
    const parts = /17 declared slots/.test((await page.locator('[data-part-status]').textContent()) ?? '');
    if (drawn && parts) break;
    if (i > 300) throw new Error('page did not finish loading');
  }

  // Drawn cursor.
  await page.evaluate(() => {
    const c = document.createElement('div');
    c.id = 'capture-cursor';
    c.innerHTML = '<svg width="22" height="28" viewBox="0 0 22 28"><path d="M2 2 L2 22 L7.5 17 L11.5 26 L15 24.5 L11 15.5 L18.5 15.5 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', width: '22px', height: '28px', pointerEvents: 'none', zIndex: '2147483647', transform: 'translate(600px,420px)' });
    document.documentElement.appendChild(c);
  });
  let cx = 600, cy = 420, n = 0;
  const shot = async () => {
    await page.clock.runFor(1000 / FPS);
    await page.waitForTimeout(30);
    await page.screenshot({ path: join(frames, `${String(n++).padStart(4, '0')}.png`) });
  };
  const hold = async (k: number) => { for (let i = 0; i < k; i++) await shot(); };
  const place = (x: number, y: number) => page.evaluate(([x, y]) => { document.getElementById('capture-cursor')!.style.transform = `translate(${x - 2}px,${y - 2}px)`; }, [x, y]);
  const glide = async (x: number, y: number, k: number) => {
    const x0 = cx, y0 = cy;
    for (let i = 1; i <= k; i++) {
      const t = i / k, e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      cx = x0 + (x - x0) * e; cy = y0 + (y - y0) * e;
      await page.mouse.move(cx, cy); await place(cx, cy); await shot();
    }
  };
  const centre = async (sel: string) => {
    const loc = page.locator(sel).first();
    await loc.scrollIntoViewIfNeeded();
    const b = (await loc.boundingBox())!;
    return [b.x + b.width / 2, b.y + b.height / 2] as const;
  };
  const clickOn = async (sel: string, k = 7) => { const [x, y] = await centre(sel); await glide(x, y, k); await page.mouse.click(x, y); };
  const typeIn = async (sel: string, text: string, perFrame: number, k = 7) => {
    await clickOn(sel, k);
    for (let i = 0; i < text.length; i += perFrame) { await page.keyboard.type(text.slice(i, i + perFrame)); await shot(); }
  };

  await place(cx, cy);
  await hold(6);                                         // 1. the build opens; idle plays
  await clickOn('#tab-playback', 5); await hold(1);      // 2. Playback, pause at 1.25 s
  const scrub = page.locator('#scrub');
  const sb = (await scrub.boundingBox())!;
  const max = Number(await scrub.getAttribute('max'));
  const sx = sb.x + 8 + (sb.width - 16) * (1.25 / max), sy = sb.y + sb.height / 2;
  await glide(sx, sy, 6);
  await page.mouse.down(); await page.mouse.up();
  await scrub.evaluate((el: HTMLInputElement) => { el.value = '1.25'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await hold(6);
  await clickOn('[data-part-list] button:has-text("topwear")', 7); await hold(5); // 3. topwear; camera fits it
  await clickOn('#part-solo', 6); await hold(5);        //    Solo
  const shoulder = await page.evaluate(() => {           //    zoom on the screen-left shoulder (top-left of the fitted part)
    const v = document.getElementById('rig-viewport')!.getBoundingClientRect();
    return [v.left + v.width * 0.405, v.top + v.height * 0.2];
  });
  await glide(shoulder[0], shoulder[1], 5);
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -240); await shot(); }
  await page.mouse.down(); await glide(shoulder[0], shoulder[1] + 85, 4); await page.mouse.up(); // drag to pan the shoulder down into view
  await glide(shoulder[0] + 330, shoulder[1] + 160, 3); await hold(4); //    the cursor steps off the step
  await clickOn('button:has-text("Use slot for feedback")', 6); await hold(2); // 4. pin
  await clickOn('#tab-feedback', 5); await hold(1);
  await typeIn('#feedback-start', '15', 2, 4);
  await typeIn('#feedback-end', '15', 2, 3);
  await clickOn('#feedback-category', 4); await page.locator('#feedback-category').selectOption('defect'); await hold(1);
  await typeIn('#feedback-summary', SUMMARY, 15, 4);
  await clickOn('#add-proposal', 5); await hold(2);
  await page.locator('#proposal-list').scrollIntoViewIfNeeded(); await hold(15);
  await clickOn('#review-status', 5); await page.locator('#review-status').selectOption('changes-requested'); await hold(2);
  await clickOn('#save', 6); await hold(7);              // 5. submit
  const download = page.waitForEvent('download');
  await clickOn('#export', 6);                           // 6. export
  const file = join(work, 'feedback.json');
  await (await download).saveAs(file);
  await hold(3);
  const exported = await ctx.newPage();
  await exported.goto('file://' + file);
  await exported.addStyleTag({ content: 'body,pre{font:13px/1.4 ui-monospace,Menlo,monospace;margin:12px;white-space:pre-wrap}' });
  for (let i = 0; i < 22; i++) await exported.screenshot({ path: join(frames, `${String(n++).padStart(4, '0')}.png`) });

  const count = n;
  mkdirSync(join(ROOT, dirname(OUT)), { recursive: true });
  execFileSync(ffmpeg, ['-v', 'error', '-y', '-framerate', String(FPS), '-i', join(frames, '%04d.png'),
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'veryslow', '-tune', 'animation', '-crf', '20',
    '-g', '60', '-keyint_min', '60', '-sc_threshold', '0', '-flags', '+cgop',
    '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-an', '-movflags', '+faststart', join(ROOT, OUT)], { stdio: 'inherit' });
  execFileSync(ffmpeg, ['-v', 'error', '-y', '-i', join(ROOT, OUT), '-frames:v', '1', '-q:v', '3', join(ROOT, OUT.replace(/\.mp4$/, '-poster.jpg'))], { stdio: 'inherit' });
  const nb = execFileSync(ffprobe, ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'default=nw=1:nk=1', join(ROOT, OUT)]).toString().trim();
  const dur = execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', join(ROOT, OUT)]).toString().trim();
  console.log(`@rig-c/review ${reviewVersion} on parts-examples@${SHA} ${BUILD}`);
  console.log(`frames ${nb} (captured ${count}), duration ${dur} s at ${FPS} fps, ${statSync(join(ROOT, OUT)).size} bytes`);
  if (Number(nb) !== count) { console.error('frame count is off'); status = 1; }
} finally {
  await browser.close();
  server.kill();
  if (!keep) rmSync(work, { recursive: true, force: true });
}
process.exit(status);
