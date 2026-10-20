#!/usr/bin/env bun
/**
 * Rebuild the Review page's clip (assets/docs/review-flow.mp4 and its poster)
 * and its three stills (assets/docs/review-screen.jpg, review-in-context.jpg,
 * review-before-after.jpg) from one run of the tool.
 *
 * Pins: @rig-c/review 0.7.0, @rig-c/parts 1.44.0 (the producer review runs),
 * and Character 1's config, painting and See-through layers at
 * rig-c/parts-examples@c239b09 (family/roa).
 *
 * Usage, from a scratch directory where the pinned tools are installed (open
 * is run from there, so review finds that @rig-c/parts):
 *
 *   bun add @rig-c/review@0.7.0 @rig-c/parts@1.44.0 playwright@1.63.0
 *   PARTS_EXAMPLES=/path/to/parts-examples \
 *   PLAYWRIGHT_MODULE=$PWD/node_modules/playwright/index.mjs \
 *     bun /path/to/site/scripts/review-capture.ts --bin $PWD/node_modules/.bin [--keep DIR]
 *
 * What it does:
 *   1. writes family/roa's config.json and inputs (painting.png, layers/full,
 *      layers/head) at c239b09 into <work>/character-1/, read with `git show`,
 *      and builds the character there with the installed producer:
 *        rig-parts build --config config.json --source inputs/painting.png \
 *          --full inputs/layers/full --head inputs/layers/head --out out
 *      then copies out/check/build/ to build/ (the folder review opens);
 *   2. opens it with the producer handoff (RIG_REVIEW_STATE_DIR in <work>):
 *        rig-review open character-1 --direct --config character-1/config.json \
 *          --parts character-1/out --source character-1/inputs/painting.png \
 *          --full character-1/inputs/layers/full --head character-1/inputs/layers/head
 *      reads the URL from stdout (the launcher contract), and waits until
 *      review's baseline reads "reproduced" (it exits 1 with the line if not);
 *   3. drives the page in headless Chromium (WebGL through --use-angle=metal),
 *      1600x1000: the idle plays; Animate, the time slider is set to 1.25 s
 *      (frame 15 at the check sampler's 12 fps); `topwear` is picked and
 *      soloed and the camera zoomed on the screen-left shoulder (the
 *      review-screen still; the in-context still is the same camera with
 *      Solo off); Setup, topwear fitted, Chest regions and Mesh edges on, the
 *      R region's centre dragged up 30 crop px (y 665 -> 635); Apply ·
 *      Rebuild runs `rig-parts remesh` in scratch and reloads the result (the
 *      ~30 s run is cut: no frame is taken until the editor bar's "Applied"
 *      line is in); Use slot for feedback, frames 15-15, Defect, the summary
 *      line, Add feedback, status Changes requested, Submit review;
 *   4. runs `rig-review feedback ... --format json` with the open's flags (0.7.0
 *      has no export button) and shows that output in the same browser as the
 *      last shots: its head, the feedback item, its context.applied;
 *   5. opens the build committed at c239b09 (family/roa/out/check/build, with
 *      the shoulder repair) in a second instance, with that commit's config
 *      and out/ as its handoff (0.7.0 refuses part picks on a package opened
 *      without one), repeats the same pick, solo, zoom and pan, and puts the
 *      two shoulders side by side (review-before-after: left the build the
 *      producer makes from the config, right the committed one).
 *
 * Frames. The page's clock is Playwright's fake clock: before each screenshot
 * it is advanced by exactly 1/12 s, so the capture is deterministic at 12 fps
 * however long a screenshot takes. While the producer runs, the clock is
 * advanced without screenshots. The cursor is drawn by this script (headless
 * screenshots have none); it moves to each control before the real click.
 *
 * Encode: the site recipe (scripts/encode-video.sh) - H.264 High, yuv420p,
 * BT.709, -tune animation, CRF 20, closed GOP 60, faststart, no audio. One
 * pass, not a loop: no seam zones, no seam check. Poster = encoded frame 0.
 * Stills: PNG screenshots saved as JPEG quality 90 with Pillow.
 */
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, statSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const FPS = 12;
const SHA = 'c239b09';
const SRC = 'family/roa';
const SUMMARY = 'Screen-left shoulder top of topwear is flat and indented (cloth alpha cut); exposed when hair moves aside';
const OUT = 'assets/docs/review-flow.mp4';
const VIEW = { width: 1600, height: 1000 };
const PKG = 'character-1';
const R_FROM = 665, R_TO = 635;            // the chest region R's centre y, crop px
const TARGET = { x: 880, y: 380 };         // where the shoulder is panned to, page px
const WHEEL = 6;                           // wheel steps of -240 on the shoulder (1.1x each)
const GRAB = { x: 1150, y: 520 };          // where the pan drag starts, page px (inside the stage)

const args = process.argv.slice(2);
const opt = (name: string) => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
const bin = opt('--bin');
const keep = opt('--keep');
const clone = process.env.PARTS_EXAMPLES;
if (!bin || !clone) {
  console.error('usage: PARTS_EXAMPLES=<clone> PLAYWRIGHT_MODULE=<playwright> bun scripts/review-capture.ts --bin <node_modules/.bin> [--keep DIR]');
  process.exit(2);
}
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
const ffprobe = process.env.FFPROBE ?? 'ffprobe';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const reviewBin = join(resolve(bin), 'rig-review');
const partsBin = join(resolve(bin), 'rig-parts');
const version = (name: string) => JSON.parse(readFileSync(join(resolve(bin), '..', name, 'package.json'), 'utf8')).version;
const versions = { review: version('@rig-c/review'), parts: version('@rig-c/parts'), rigc: version('rig-c'), play: version('@rig-c/play') };

const work = keep ? resolve(keep) : mkdtempSync(join(tmpdir(), 'review-capture-'));
const pkg = join(work, PKG);
const committed = join(work, 'committed');
const frames = join(work, 'frames');
const stills = join(work, 'stills');
const state = join(work, 'state');
for (const d of [frames, stills, state, join(committed, 'build')]) mkdirSync(d, { recursive: true });

function stop() {
  const dir = join(state, 'open');
  let names: string[] = [];
  try { names = readdirSync(dir); } catch { /* none started */ }
  for (const f of names) {
    if (!/^[0-9a-f]{64}\.json$/.test(f)) continue;
    try { process.kill(JSON.parse(readFileSync(join(dir, f), 'utf8')).pid); } catch { /* already gone */ }
  }
}

// 1. Inputs at the pinned commit, then the producer's own build.
const show = (path: string) => execFileSync('git', ['-C', clone, 'show', `${SHA}:${path}`], { maxBuffer: 1 << 28 });
const tree = (path: string) => execFileSync('git', ['-C', clone, 'ls-tree', '-r', '--name-only', SHA, '--', path]).toString().split('\n').filter(Boolean);
for (const f of [`${SRC}/config.json`, `${SRC}/inputs/painting.png`, ...tree(`${SRC}/inputs/layers/full`), ...tree(`${SRC}/inputs/layers/head`)]) {
  const to = join(pkg, f.slice(SRC.length + 1));
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, show(f));
}
// The committed build (with the shoulder repair) and the files it was made from, so it opens with a
// handoff too: without one, 0.7.0 refuses every part pick ("Part selection refused: Cannot read
// properties of undefined (reading 'map')"). Its baseline does not reproduce (the repair is not in
// the config); nothing is applied on it.
for (const f of [`${SRC}/config.json`, `${SRC}/out/parts.json`, ...tree(`${SRC}/out/parts`), ...tree(`${SRC}/out/rig`)]) {
  const to = join(committed, f.slice(SRC.length + 1));
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, show(f));
}
for (const f of ['skeleton.atlas', 'skeleton.json', 'skeleton.model.json', 'skeleton.png']) writeFileSync(join(committed, 'build', f), show(`${SRC}/out/check/build/${f}`));
const built = spawnSync(partsBin, ['build', '--config', 'config.json', '--source', 'inputs/painting.png', '--full', 'inputs/layers/full', '--head', 'inputs/layers/head', '--out', 'out'], { cwd: pkg, encoding: 'utf8', maxBuffer: 1 << 28 });
if (built.status !== 0) { console.error((built.stdout ?? '').slice(-4000), built.stderr); console.error(`rig-parts build exited ${built.status}`); process.exit(1); }
mkdirSync(join(pkg, 'build'), { recursive: true });
for (const f of readdirSync(join(pkg, 'out/check/build'))) copyFileSync(join(pkg, 'out/check/build', f), join(pkg, 'build', f));
console.log(`rig-parts ${versions.parts} ${(built.stdout ?? '').split('\n').find(l => l.startsWith('build: ')) ?? ''}`);

// 2. Open with the handoff; stdout is the URL alone.
const env = { ...process.env, RIG_REVIEW_STATE_DIR: state };
const handoff = ['--config', join(pkg, 'config.json'), '--parts', join(pkg, 'out'), '--source', join(pkg, 'inputs/painting.png'), '--full', join(pkg, 'inputs/layers/full'), '--head', join(pkg, 'inputs/layers/head')];
const open = (dir: string, extra: string[]) => {
  const r = spawnSync(reviewBin, ['open', dir, '--direct', ...extra], { env, encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr); stop(); process.exit(1); }
  return r.stdout.trim();
};
const url = open(pkg, handoff);
const api = url.replace(/#.*$/, '').replace(/\?.*$/, '') + 'api/rebuild';
let baselineLine = '';
for (let i = 0; ; i++) {
  const d = await (await fetch(api)).json() as any;
  baselineLine = d.baseline?.line ?? '';
  if (d.baseline?.status === 'reproduced' && d.inspectedCheck?.status === 'checked') break;
  if (d.baseline && d.baseline.status !== 'running' && d.baseline.status !== 'reproduced') { console.error(baselineLine); stop(); process.exit(1); }
  if (i > 600) { console.error('baseline did not finish:', baselineLine); stop(); process.exit(1); }
  await Bun.sleep(500);
}
console.log(baselineLine);

const jpeg = (png: string, out: string, size?: [number, number]) =>
  execFileSync('python3', ['-I', '-c', 'import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert("RGB")\nif len(sys.argv)>3: im=im.resize((int(sys.argv[3]),int(sys.argv[4])), Image.LANCZOS)\nim.save(sys.argv[2], quality=90)', png, out, ...(size ? size.map(String) : [])]);
const decodeView = (hash: string) => JSON.parse(Buffer.from(hash.replace(/^#review=/, ''), 'base64').toString('utf8'));

const browser = await chromium.launch({ args: ['--use-angle=metal'] });
let status = 0;
try {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'no-preference' });

  const load = async (link: string) => {
    const page = await ctx.newPage();
    await page.clock.install({ time: new Date('2026-10-20T00:00:00Z') });
    await page.goto(link);
    for (let i = 0; ; i++) {
      await page.clock.runFor(100);
      await page.waitForTimeout(50);
      const drawn = /WebGL|Canvas/.test((await page.locator('#renderer-state').textContent()) ?? '');
      const parts = /17 declared slots/.test((await page.locator('[data-part-status]').textContent()) ?? '');
      if (drawn && parts) break;
      if (i > 300) throw new Error('page did not finish loading');
    }
    return page;
  };
  // The rig pane's camera, as the page keeps it in its #review= view link
  // (README, "Keep and share an inspection"): world (y up) -> page px.
  const camera = async (page: any) => {
    const cam = decodeView(await page.evaluate(() => location.hash)).view.cameras.rig;
    const v = cam.visible;
    // The rig pane: the canvas the page reports this viewport size for.
    const pane = await page.evaluate(([w, h]: number[]) => {
      const c = [...document.querySelectorAll('canvas')].map(e => e.getBoundingClientRect())
        .filter(r => Math.abs(r.width - w) < 2 && Math.abs(r.height - h) < 2)[0];
      return c ? { x: c.x, y: c.y, width: c.width, height: c.height } : null;
    }, [cam.viewport.width, cam.viewport.height]);
    if (!pane) throw new Error('no canvas has the rig viewport size');
    return (wx: number, wy: number) => [pane.x + (wx - v.x) * pane.width / v.width, pane.y + (v.y + v.height - wy) * pane.height / v.height] as const;
  };
  const config = JSON.parse(readFileSync(join(pkg, 'config.json'), 'utf8'));
  // README, Chest regions: crop (x, y) is world (x - width/2, height - y).
  const world = (x: number, y: number) => [x - 800 / 2, 2284 - y] as const;
  const topwear = JSON.parse(readFileSync(join(pkg, 'out/parts.json'), 'utf8')).parts.find((p: any) => p.name === 'topwear');
  // The screen-left shoulder: part image px (50, 80); rig = image + (box - 4).
  const SHOULDER = world(topwear.x - 4 + 50, topwear.y - 4 + 80);

  const page = await load(url);
  await page.evaluate(() => {
    const c = document.createElement('div');
    c.id = 'capture-cursor';
    c.innerHTML = '<svg width="22" height="28" viewBox="0 0 22 28"><path d="M2 2 L2 22 L7.5 17 L11.5 26 L15 24.5 L11 15.5 L18.5 15.5 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', width: '22px', height: '28px', pointerEvents: 'none', zIndex: '2147483647', transform: 'translate(800px,560px)' });
    document.documentElement.appendChild(c);
  });
  let cx = 800, cy = 560, n = 0;
  const marks: Record<string, number> = {};
  const mark = (name: string) => { marks[name] = n; };
  const shot = async () => {
    await page.clock.runFor(1000 / FPS);
    await page.waitForTimeout(30);
    await page.screenshot({ path: join(frames, `${String(n++).padStart(4, '0')}.png`) });
  };
  const hold = async (k: number) => { for (let i = 0; i < k; i++) await shot(); };
  const place = (x: number, y: number) => page.evaluate(([x, y]: number[]) => { document.getElementById('capture-cursor')!.style.transform = `translate(${x - 2}px,${y - 2}px)`; }, [x, y]);
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
  const clickOn = async (sel: string, k = 6) => { const [x, y] = await centre(sel); await glide(x, y, k); await page.mouse.click(x, y); };
  const typeIn = async (sel: string, text: string, perFrame: number, k = 5) => {
    await clickOn(sel, k);
    for (let i = 0; i < text.length; i += perFrame) { await page.keyboard.type(text.slice(i, i + perFrame)); await shot(); }
  };
  const still = (name: string) => page.screenshot({ path: join(stills, `${name}.png`) });

  // Inspection.
  await place(cx, cy);
  mark('open'); await hold(6);                                            // the build opens; the idle plays
  mark('animate'); await clickOn('button:text-is("Animate")', 5); await hold(1);
  const scrub = page.locator('#scrub');
  const sb = (await scrub.boundingBox())!;
  const max = Number(await scrub.getAttribute('max'));
  await glide(sb.x + 8 + (sb.width - 16) * (1.25 / max), sb.y + sb.height / 2, 6);
  await page.mouse.down(); await page.mouse.up();
  await scrub.evaluate((el: HTMLInputElement) => { el.value = '1.25'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  mark('paused'); await hold(5);                                          // paused at 1.25 s
  mark('topwear'); await clickOn('#parts-explorer button:has-text("topwear")', 6); await hold(4);
  mark('solo'); await clickOn('#part-solo', 5); await hold(3);
  let toScreen = await camera(page);
  const [sx, sy] = toScreen(...SHOULDER);
  await glide(sx, sy, 5);
  mark('zoom'); for (let i = 0; i < WHEEL; i++) { await page.mouse.wheel(0, -240); await shot(); }
  const [zx, zy] = (await camera(page))(...SHOULDER);                     // where the wheel left the shoulder
  const viewNow = async (pg: any) => { const c = decodeView(await pg.evaluate(() => location.hash)).view.cameras.rig; return `zoom ${c.zoom.toFixed(4)} centre ${c.center.x.toFixed(2)},${c.center.y.toFixed(2)} visible ${JSON.stringify(c.visible)}`; };
  console.log(`shoulder at ${sx.toFixed(1)},${sy.toFixed(1)} before the wheel; after it ${zx.toFixed(1)},${zy.toFixed(1)}; ${await viewNow(page)}`);
  await glide(GRAB.x, GRAB.y, 3);                                         // drag the view so the shoulder lands on TARGET
  await page.mouse.down(); await glide(GRAB.x + TARGET.x - zx, GRAB.y + TARGET.y - zy, 5); await page.mouse.up();
  await glide(TARGET.x + 380, TARGET.y + 200, 4);                         // the cursor steps off the shoulder
  await hold(4);
  console.log(`after the pan: shoulder at ${(await camera(page))(...SHOULDER).map(v => v.toFixed(1)).join(',')}; ${await viewNow(page)}`);
  await still('screen');
  const zoomView = await page.evaluate(() => location.hash);
  await page.locator('#part-solo').uncheck();
  await page.clock.runFor(1); await page.waitForTimeout(300);
  await still('in-context');
  await page.locator('#part-solo').check();
  await page.clock.runFor(1); await page.waitForTimeout(300);
  await still('shoulder-fresh');

  // The editor loop.
  mark('setup'); await clickOn('button:text-is("Setup")', 5); await hold(1);
  await clickOn('#parts-explorer button:text-is("Whole rig")', 5);
  await clickOn('#parts-explorer button:has-text("topwear")', 5); await hold(3); // the camera fits topwear again
  if (!(await page.locator('#part-solo').isChecked())) { await clickOn('#part-solo', 4); await hold(2); } // Whole rig cleared Solo
  mark('chest'); await clickOn('#chest-edit', 5); await hold(3);
  await clickOn('#layer-mesh', 5); await hold(3);                          // Mesh edges, so the new triangulation shows
  toScreen = await camera(page);
  const r0 = config.meshes.topwear.contour.regions.find((r: any) => r.name === 'bust_r');
  if (r0.cy !== R_FROM) throw new Error(`bust_r cy is ${r0.cy}, expected ${R_FROM}`);
  const [hx, hy] = toScreen(...world(r0.cx, r0.cy));
  const [tx, ty] = toScreen(...world(r0.cx, R_TO));
  console.log(`R handle at ${hx.toFixed(1)},${hy.toFixed(1)} -> ${tx.toFixed(1)},${ty.toFixed(1)}`);
  await glide(hx, hy, 5);
  mark('drag'); await page.mouse.down();
  await glide(tx, ty, 6);
  await page.mouse.up(); await hold(4);
  const movedTo = await page.inputValue('#bust-r-y');
  if (movedTo !== String(R_TO)) throw new Error(`the drag set R y to ${movedTo}, expected ${R_TO}`);
  const [ax, ay] = await centre('#bust-apply');
  await glide(ax, ay, 5);
  mark('apply'); await page.mouse.click(ax, ay);
  let applied = '';
  for (let i = 0; ; i++) {                                                // the producer runs: no frames
    await page.clock.runFor(100);
    await page.waitForTimeout(250);
    applied = ((await page.locator('#chest-editor-status').textContent()) ?? '').trim();
    if (/^Applied /.test(applied)) break;
    if (/FAIL|refused/.test(applied) || i > 1200) throw new Error(`Apply did not build: ${applied}`);
  }
  await page.clock.runFor(500); await page.waitForTimeout(500);
  mark('applied'); await glide(ax - 260, ay + 330, 4); await hold(14);    // the producer line and the reloaded rig
  await still('applied');
  console.log(applied);

  // Feedback on the shoulder, written while the applied build is on the stage.
  mark('pin'); await clickOn('button:has-text("Use slot for feedback")', 6); await hold(2);
  if (!(await page.locator('#feedback-start').isVisible())) { await clickOn('#write-review', 5); await hold(2); }
  await typeIn('#feedback-start', '15', 2, 4); await hold(1);
  await typeIn('#feedback-end', '15', 2, 3); await hold(1);
  await clickOn('#feedback-category', 4); await page.locator('#feedback-category').selectOption('defect'); await hold(1);
  await typeIn('#feedback-summary', SUMMARY, 15, 4);
  mark('add'); await clickOn('#add-proposal', 5); await hold(8);
  await clickOn('#review-status', 5); await page.locator('#review-status').selectOption('changes-requested'); await hold(2);
  mark('submit'); await clickOn('#save', 6); await hold(6);

  // 4. The export: the CLI, with the open's flags.
  const fb = spawnSync(reviewBin, ['feedback', pkg, '--animation', 'idle', ...handoff, '--format', 'json'], { env, encoding: 'utf8', maxBuffer: 1 << 26 });
  if (fb.status !== 0) throw new Error(`feedback exited ${fb.status}: ${fb.stderr}`);
  const file = join(work, 'feedback.json');
  writeFileSync(file, fb.stdout);
  if (fb.stdout.includes(work) || fb.stdout.includes(resolve(tmpdir()))) { console.error('the export carries a local path'); status = 1; }
  const shown = await ctx.newPage();
  await shown.goto('file://' + file);
  await shown.addStyleTag({ content: 'body,pre{font:13px/1.4 ui-monospace,Menlo,monospace;margin:12px;white-space:pre-wrap}' });
  // Three stops down the export: its head, the feedback item, and its context.applied.
  const scrollTo = (needle: string) => shown.evaluate((needle: string) => {
    const pre = document.querySelector('pre')!;
    const text = pre.firstChild as Text;
    const at = text.data.indexOf(needle);
    if (at < 0) throw new Error(`not in the export: ${needle}`);
    const range = document.createRange(); range.setStart(text, at); range.setEnd(text, at + needle.length);
    window.scrollTo(0, window.scrollY + range.getBoundingClientRect().top - 12);
  }, needle);
  const jsonShots = async (k: number) => { for (let i = 0; i < k; i++) await shown.screenshot({ path: join(frames, `${String(n++).padStart(4, '0')}.png`) }); };
  mark('json'); await jsonShots(5);
  await scrollTo('"status": "changes-requested"'); mark('json-feedback'); await jsonShots(7);
  await scrollTo('"applied": {'); mark('json-applied'); await jsonShots(10);
  await shown.close();

  // 5. The committed (repaired) build at the same pick, solo and zoom.
  const page2 = await load(open(committed, ['--config', join(committed, 'config.json'), '--parts', join(committed, 'out')]));
  const tick = async () => { await page2.clock.runFor(1000 / FPS); await page2.waitForTimeout(60); };
  await page2.click('button:text-is("Animate")'); await tick();
  await page2.locator('#scrub').evaluate((el: HTMLInputElement) => { el.value = '1.25'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await tick();
  await page2.click('#parts-explorer button:has-text("topwear")'); for (let i = 0; i < 4; i++) await tick();
  await page2.locator('#part-solo').check(); for (let i = 0; i < 3; i++) await tick();
  const [sx2, sy2] = (await camera(page2))(...SHOULDER);
  await page2.mouse.move(sx2, sy2);
  for (let i = 0; i < WHEEL; i++) { await page2.mouse.wheel(0, -240); await tick(); }
  const [zx2, zy2] = (await camera(page2))(...SHOULDER);
  await page2.mouse.move(GRAB.x, GRAB.y); await page2.mouse.down();
  for (let i = 1; i <= 5; i++) { await page2.mouse.move(GRAB.x + (TARGET.x - zx2) * i / 5, GRAB.y + (TARGET.y - zy2) * i / 5); await tick(); }
  await page2.mouse.up(); await page2.mouse.move(TARGET.x + 380, TARGET.y + 200);
  for (let i = 0; i < 6; i++) await tick();
  await page2.screenshot({ path: join(stills, 'shoulder-committed.png') });
  const zoom2 = await page2.evaluate(() => location.hash);
  await page2.close();

  // Stills.
  jpeg(join(stills, 'screen.png'), join(ROOT, 'assets/docs/review-screen.jpg'));
  jpeg(join(stills, 'in-context.png'), join(ROOT, 'assets/docs/review-in-context.jpg'), [1200, 750]);
  execFileSync('python3', ['-I', '-c', [
    'import sys', 'from PIL import Image',
    'a=Image.open(sys.argv[1]).convert("RGB"); b=Image.open(sys.argv[2]).convert("RGB")',
    'x=max(0,min(int(float(sys.argv[4]))-324,a.width-648)); y=max(0,min(int(float(sys.argv[5]))-200,a.height-400))',
    'o=Image.new("RGB",(1296,400)); o.paste(a.crop((x,y,x+648,y+400)),(0,0)); o.paste(b.crop((x,y,x+648,y+400)),(648,0))',
    'o.save(sys.argv[3], quality=90)', 'print("before-after crop at", x, y)',
  ].join('\n'), join(stills, 'shoulder-fresh.png'), join(stills, 'shoulder-committed.png'), join(ROOT, 'assets/docs/review-before-after.jpg'), String(TARGET.x), String(TARGET.y)], { stdio: 'inherit' });
  const cam = (h: string) => { const c = decodeView(h).view.cameras.rig; return `zoom ${c.zoom.toFixed(4)} centre ${c.center.x.toFixed(2)},${c.center.y.toFixed(2)}`; };
  console.log(`shoulder camera: built ${cam(zoomView)}; committed ${cam(zoom2)}`);

  // Encode.
  const count = n;
  execFileSync(ffmpeg, ['-v', 'error', '-y', '-framerate', String(FPS), '-i', join(frames, '%04d.png'),
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'veryslow', '-tune', 'animation', '-crf', '20',
    '-g', '60', '-keyint_min', '60', '-sc_threshold', '0', '-flags', '+cgop',
    '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-an', '-movflags', '+faststart', join(ROOT, OUT)], { stdio: 'inherit' });
  execFileSync(ffmpeg, ['-v', 'error', '-y', '-i', join(ROOT, OUT), '-frames:v', '1', '-q:v', '3', join(ROOT, OUT.replace(/\.mp4$/, '-poster.jpg'))], { stdio: 'inherit' });
  const nb = execFileSync(ffprobe, ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'default=nw=1:nk=1', join(ROOT, OUT)]).toString().trim();
  const dur = execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', join(ROOT, OUT)]).toString().trim();
  console.log(`@rig-c/review ${versions.review} (play ${versions.play}), @rig-c/parts ${versions.parts}, rig-c ${versions.rigc}; parts-examples@${SHA} ${SRC}`);
  console.log(`marks ${Object.entries(marks).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  console.log(`frames ${nb} (captured ${count}), duration ${dur} s at ${FPS} fps, ${statSync(join(ROOT, OUT)).size} bytes`);
  if (Number(nb) !== count) { console.error('frame count is off'); status = 1; }
} catch (e) {
  console.error(e); status = 1;
} finally {
  await browser.close();
  stop();
  if (!keep) rmSync(work, { recursive: true, force: true });
}
process.exit(status);
