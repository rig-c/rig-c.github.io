#!/usr/bin/env bun
/**
 * Draw one animation of a rigc build with @rig-c/play on a transparent page and
 * write it as an animated WebP with alpha (<out>.webp) plus its frame 0 as an
 * RGBA PNG still (<out>-poster.png).
 *
 * Usage, from a scratch directory where Playwright is installed:
 *
 *   bun add -d playwright@1.63.0
 *   PLAYWRIGHT_MODULE=$PWD/node_modules/playwright/index.mjs \
 *     bun /path/to/site/scripts/play-capture-webp.ts \
 *       --root DIR --model PATH --anim NAME --fps N --frames N \
 *       --out BASENAME [--long-side 640] [--q 85] [--settle 0] [--player DIR] [--keep DIR]
 *       [--under NAME] [--breeze] [--step-hz 120]
 *
 *   --root     the folder served to the page: it holds node_modules/@rig-c/play
 *              and the build (default: the current directory)
 *   --model    the build's skeleton.model.json, relative to --root
 *   --anim     the animation to draw
 *   --fps      frames per second; frame i is the pose at i/fps s
 *   --frames   frame count; must equal the animation's duration x fps, so the
 *              last frame is one step before the duration and the loop wraps
 *              from it back to frame 0 (no repeated end pose)
 *   --out      output path without extension, relative to the site root
 *              (e.g. assets/docs/getting-started-hello)
 *   --long-side  the frame's long side in px (default 640, as rigc render --max 640)
 *   --q        WebP quality of the colour planes (default 85; alpha is lossless)
 *   --settle   whole loops to play before frame 0 (default 0): frame i is the
 *              pose at settle x duration + i/fps. A rig with physics starts
 *              from rest, so its first pass does not end where it began; one
 *              loop of settling makes the captured pass close
 *   --player   the folder holding rig-c/getting-started's step-10 player,
 *              play.html and serve.ts (default: <root>/../getting-started/scripts,
 *              where the walkthrough's step 1 clones it)
 *   --keep     keep the captured RGBA frames (f0000.png ...) in this folder
 *   --under    play this animation on track 0 and --anim over it on track 1,
 *              as the page's &under= does. RigPlayer.seek refuses two tracks,
 *              so the player is stepped forward instead (see --step-hz)
 *   --breeze   blow the page's own breeze: before every step, the wind
 *              play.html sets, BASE + GUST x sin(2 pi HZ t) to the right with t
 *              the seconds played, its three constants read from play.html
 *   --step-hz  with --under or --breeze, the player is stepped forward from
 *              its first pose in steps of 1/step-hz s (default 120, a whole
 *              number of steps per frame at 24 fps), as the page's own
 *              requestAnimationFrame loop does; nothing is seeked, so the
 *              physics carries its history and two runs step alike
 *
 * The site's three clips (each page's SOURCES gives the run and versions):
 *
 *   # Getting Started step 8: the walkthrough's my-rig folder as --root
 *   --root $WALKTHROUGH --model out/check/build/skeleton.model.json --anim idle \
 *     --fps 12 --frames 40 --out assets/docs/getting-started-idle
 *   # Getting Started step 10: the hello (steps 9b-9c) alone, in the page's
 *   # breeze, after one pass of settling. The page plays it over the idle
 *   # (&under=idle), but 4.75 s over 3.33 s never closes a loop, so the clip
 *   # is the hello alone; 12 fps keeps 57 frames under 1.5 MB at q85
 *   --root $WALKTHROUGH --model out/check/build/skeleton.model.json --anim hello \
 *     --breeze --settle 1 --fps 12 --frames 57 --out assets/docs/getting-started-hello
 *   # Parts page: a folder holding node_modules/@rig-c/play 1.12.0 and, under
 *   # build/, rig-c/parts-examples@c239b09 family/roa/out/check/build/*
 *   # (skeleton.atlas, .json, .model.json, .png, read with git show)
 *   --root $PARTS_ROOT --model build/skeleton.model.json --anim idle \
 *     --fps 12 --frames 40 --settle 1 --player $WALKTHROUGH/../getting-started/scripts \
 *     --out assets/docs/parts-idle
 *
 * Why not `rigc render`: its frames are composited over a fixed grey
 * (232, 232, 232) and `rigc check` refuses frames that are not opaque, so a
 * rigc-rendered clip cannot carry alpha. The same build is drawn here by
 * @rig-c/play on a transparent page instead.
 *
 * What it does:
 *   1. starts the player's own server (`bun serve.ts --port 0`) in --root;
 *   2. opens /?model=<model>&anim=<anim> in headless Chromium (WebGL through
 *      --use-angle=metal on macOS) on Playwright's fake clock, so the page's
 *      own requestAnimationFrame loop does not move the rig; makes html, body
 *      and #stage transparent and hides #bar;
 *   3. frames the rig the way `rigc render --max <long side>` does (rig-c's
 *      render_shared.ts): the union of the pose's bounds over the animation at
 *      60 fps, padded by 4% of its long side, scaled so the long side is
 *      --long-side px; sizes #stage to that box and places the rig's root in it;
 *   4. for frame i seeks the player to i/fps s, after --settle loops
 *      (RigPlayer.seek: reopen and step in 1/60 s increments, deterministic),
 *      draws, and screenshots #stage with omitBackground -> RGBA PNG;
 *   5. encodes the frames with img2webp (lossy at --q, method 6, -exact; the
 *      alpha plane is lossless, libwebp's default alpha_quality 100), frame i
 *      lasting round((i+1)*1000/fps) - round(i*1000/fps) ms, so one loop is
 *      round(frames*1000/fps) ms; webpmux sets the animation background colour
 *      to transparent (img2webp writes opaque white); frame 0 is copied as the
 *      poster.
 *
 * The wave this replaced (step 10 until 2026-10-21, --model wave-build/skeleton.model.json
 * --anim wave --fps 24 --frames 72) was encoded at --q 75: at 85 its 72 frames came
 * to 1,531,186 bytes.
 *
 * Run 2026-10-20 with Bun 1.4.2, Playwright 1.63.0 (Chromium 153), libwebp
 * 1.6.0 (img2webp, webpmux), @rig-c/play 1.12.0 and rig-c/getting-started
 * 2928714's play.html + serve.ts; the hello on 2026-10-21 with the same tools
 * and getting-started 0932046's play.html + serve.ts.
 */
import { spawn, execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';

const PAD = 0.04; // rig-c render_shared.ts PAD
const FRAMING_FPS = 60; // rig-c render_shared.ts FRAMING_FPS

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const need = (name: string) => {
  const v = arg(name);
  if (!v) throw new Error(`missing ${name} (see the header of ${import.meta.file})`);
  return v;
};
const here = resolve(arg('--root') ?? '.');
const model = need('--model').replace(/^\/+/, '');
const anim = need('--anim');
const FPS = Number(need('--fps'));
const FRAMES = Number(need('--frames'));
const MAX_SIDE = Number(arg('--long-side') ?? 640);
const QUALITY = arg('--q') ?? '85';
const SETTLE = Number(arg('--settle') ?? 0);
if (!(SETTLE >= 0) || !Number.isInteger(SETTLE)) throw new Error('--settle must be a whole number of loops');
if (!(FPS > 0) || !Number.isInteger(FRAMES) || FRAMES < 2 || !(MAX_SIDE > 0)) throw new Error('--fps, --frames and --long-side must be positive numbers');
const UNDER = arg('--under');
const BREEZE = process.argv.includes('--breeze');
const STEP_HZ = Number(arg('--step-hz') ?? 120);
const STEPPED = Boolean(UNDER) || BREEZE;
if (STEPPED && !(Number.isInteger(STEP_HZ) && STEP_HZ > 0 && Number.isInteger(STEP_HZ / FPS))) throw new Error('--step-hz must be a whole multiple of --fps');
const playerDir = resolve(arg('--player') ?? join(here, '../getting-started/scripts'));
for (const f of [join(here, model), join(here, 'node_modules/@rig-c/play/dist/index.js'), join(playerDir, 'serve.ts')]) {
  if (!existsSync(f)) throw new Error(`missing ${f}`);
}
// play.html's breeze: const BASE = 0.75, GUST = 0.25, HZ = 0.2;
let breeze: { BASE: number; GUST: number; HZ: number } | null = null;
if (BREEZE) {
  const m = readFileSync(join(playerDir, 'play.html'), 'utf8').match(/const BASE = ([\d.]+), GUST = ([\d.]+), HZ = ([\d.]+);/);
  if (!m) throw new Error(`no "const BASE = …, GUST = …, HZ = …;" line in ${join(playerDir, 'play.html')}`);
  breeze = { BASE: Number(m[1]), GUST: Number(m[2]), HZ: Number(m[3]) };
}
const site = resolve(import.meta.dir, '..');
const out = need('--out');
const base = isAbsolute(out) ? out : join(site, out);
const outWebp = `${base}.webp`;
const outPoster = `${base}-poster.png`;
mkdirSync(dirname(base), { recursive: true });
const keep = arg('--keep');
const frameDir = keep ? resolve(keep) : mkdtempSync(join(tmpdir(), 'play-capture-'));
mkdirSync(frameDir, { recursive: true });

const pw = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');

const server = spawn('bun', [join(playerDir, 'serve.ts'), '--port', '0'], { cwd: here, stdio: ['ignore', 'pipe', 'inherit'] });
const origin: string = await new Promise((ok, fail) => {
  let seen = '';
  server.stdout!.on('data', (b: Buffer) => {
    seen += b.toString();
    const m = seen.match(/http:\/\/localhost:(\d+)\//);
    if (m) ok(`http://localhost:${m[1]}`);
  });
  server.on('exit', (code) => fail(new Error(`serve.ts exited ${code}`)));
});

// --under / --breeze: the page is opened with its clock paused before it loads,
// so its own requestAnimationFrame loop never steps the rig; the player is then
// stepped here the way that loop does it (the wind for the time played, then
// frame(dt)), from the first pose play() opened. Pass 1 reads the frame's box
// over the captured stretch; the page is loaded again and pass 2 steps it the
// same way and screenshots frame i at settle x duration + i/fps.
async function captureStepped(page: any) {
  await page.clock.pauseAt(0);
  const q = `model=${encodeURIComponent(model)}&anim=${encodeURIComponent(anim)}${UNDER ? `&under=${encodeURIComponent(UNDER)}` : ''}${BREEZE ? '' : '&wind=0'}`;
  const open = async () => {
    await page.goto(`${origin}/?${q}`);
    await page.waitForFunction(() => (window as any).rigPlayer, null, { polling: 50 });
    await page.addStyleTag({ content: 'html, body, #stage { background: transparent !important; } #bar { display: none !important; }' });
    return page.evaluate(({ anim, under, breeze }) => {
      const w = window as any;
      const player = w.rigPlayer;
      if (player.time !== 0) return { error: `the page stepped the player before the capture (time ${player.time})` };
      let clock = 0;
      w.__capStep = (dt: number) => {
        clock += dt;
        if (breeze) player.environment({ wind: [breeze.BASE + breeze.GUST * Math.sin(2 * Math.PI * breeze.HZ * clock), 0] });
        player.advance(dt);
      };
      const names = (player as any).assets?.animations?.map((a: any) => a.name);
      return { tracks: under ? [player.entry(0)?.animation?.name ?? under, player.entry(1)?.animation?.name ?? anim] : [anim], names };
    }, { anim, under: UNDER ?? null, breeze });
  };
  const opened = await open();
  if ('error' in opened) throw new Error(opened.error);
  const view = await page.evaluate(async ({ model, anim }) => {
    const { loadModel } = await import('/node_modules/@rig-c/play/dist/index.js');
    const assets = await loadModel({ modelUrl: `/${model}`, setsUrl: null });
    const clip = assets.animations.find((a: any) => a.name === anim);
    return clip ? { duration: clip.duration as number } : { error: `no animation ${anim} (animations: ${assets.animations.map((a: any) => a.name).join(', ')})` };
  }, { model, anim });
  if ('error' in view) throw new Error(view.error);
  if (Math.abs(view.duration - FRAMES / FPS) > 1e-6) throw new Error(`${anim} lasts ${view.duration} s, not ${FRAMES}/${FPS} (pass --frames ${Math.round(view.duration * FPS)})`);
  const per = STEP_HZ / FPS;
  const lead = Math.round(SETTLE * view.duration * STEP_HZ);
  const span = FRAMES * per;
  // Pass 1: the union of player.bounds() at every step of the captured stretch (frames 0 .. FRAMES-1).
  const box = await page.evaluate(({ lead, span, per, dt }) => {
    const w = window as any, player = w.rigPlayer;
    for (let k = 0; k < lead; k++) w.__capStep(dt);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let k = 0; k <= span - per; k++) {
      if (k > 0) w.__capStep(dt);
      const b = player.bounds();
      minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width); maxY = Math.max(maxY, b.y + b.height);
    }
    return [minX, minY, maxX, maxY];
  }, { lead, span, per, dt: 1 / STEP_HZ });
  let [minX, minY, maxX, maxY] = box;
  const pad = Math.max(maxX - minX, maxY - minY) * PAD;
  minX -= pad; minY -= pad; maxX += pad; maxY += pad;
  const scale = MAX_SIDE / Math.max(maxX - minX, maxY - minY);
  const width = Math.max(1, Math.round((maxX - minX) * scale));
  const height = Math.max(1, Math.round((maxY - minY) * scale));
  console.log(`${anim}${UNDER ? ` over ${UNDER}` : ''} ${view.duration.toFixed(4)} s, tracks ${opened.tracks.join(' < ')}${breeze ? `, breeze ${breeze.BASE} + ${breeze.GUST} sin(2 pi ${breeze.HZ} t)` : ', wind=0'}, stepped at 1/${STEP_HZ} s, ${lead} step(s) of settling; frame ${width}x${height}, scale ${scale.toFixed(5)}, viewport x ${minX.toFixed(2)} y ${minY.toFixed(2)} w ${(maxX - minX).toFixed(2)} h ${(maxY - minY).toFixed(2)} (box over the captured stretch at ${STEP_HZ} Hz)`);
  // Pass 2: a fresh page, stepped the same way.
  const again = await open();
  if ('error' in again) throw new Error(again.error);
  await page.evaluate(({ width, height, scale, minX, maxY }) => {
    const stage = document.getElementById('stage')!;
    const root = document.getElementById('root')!;
    Object.assign(stage.style, { width: `${width}px`, height: `${height}px`, flex: 'none' });
    root.style.left = `${-minX * scale}px`;
    root.style.top = `${maxY * scale}px`;
    root.style.transform = `scale(${scale})`;
    (window as any).rigPlayer.renderer.syncPixelRatio();
  }, { width, height, scale, minX, maxY });
  await page.evaluate(({ lead, dt }) => { const w = window as any; for (let k = 0; k < lead; k++) w.__capStep(dt); }, { lead, dt: 1 / STEP_HZ });
  const stage = page.locator('#stage');
  for (let i = 0; i < FRAMES; i++) {
    const t = await page.evaluate(({ i, per, dt }) => { const w = window as any; if (i > 0) for (let k = 0; k < per; k++) w.__capStep(dt); w.rigPlayer.draw(); return w.rigPlayer.time; }, { i, per, dt: 1 / STEP_HZ });
    if (Math.abs(t - (SETTLE * view.duration + i / FPS)) > 1e-6) throw new Error(`frame ${i} at player time ${t}, not ${SETTLE * view.duration + i / FPS}`);
    await stage.screenshot({ path: join(frameDir, `f${String(i).padStart(4, '0')}.png`), omitBackground: true, animations: 'disabled' });
  }
}

const browser = await pw.chromium.launch({ args: process.platform === 'darwin' ? ['--use-angle=metal'] : [] });
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1 });
  await page.clock.install({ time: 0 });
  if (STEPPED) {
    await captureStepped(page);
  } else {
  await page.goto(`${origin}/?model=${encodeURIComponent(model)}&anim=${encodeURIComponent(anim)}`);
  await page.waitForFunction(() => (window as any).rigPlayer);
  await page.clock.pauseAt(1000); // the page's rAF loop stops; only seek moves the rig
  await page.addStyleTag({ content: 'html, body, #stage { background: transparent !important; } #bar { display: none !important; }' });

  const view = await page.evaluate(async ({ FRAMING_FPS, PAD, MAX_SIDE, model, anim }) => {
    const player = (window as any).rigPlayer;
    const { loadModel } = await import('/node_modules/@rig-c/play/dist/index.js');
    const assets = await loadModel({ modelUrl: `/${model}` });
    const clip = assets.animations.find((a: any) => a.name === anim);
    if (!clip) return { error: `no animation ${anim} (animations: ${assets.animations.map((a: any) => a.name).join(', ')})` };
    const duration: number = clip.duration;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const n = Math.round(duration * FRAMING_FPS);
    for (let i = 0; i <= n; i++) {
      player.seek(Math.min(duration, i / FRAMING_FPS));
      const b = player.bounds();
      minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width); maxY = Math.max(maxY, b.y + b.height);
    }
    const pad = Math.max(maxX - minX, maxY - minY) * PAD;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const scale = MAX_SIDE / Math.max(maxX - minX, maxY - minY);
    const width = Math.max(1, Math.round((maxX - minX) * scale));
    const height = Math.max(1, Math.round((maxY - minY) * scale));
    const stage = document.getElementById('stage')!;
    const root = document.getElementById('root')!;
    Object.assign(stage.style, { width: `${width}px`, height: `${height}px`, flex: 'none' });
    root.style.left = `${-minX * scale}px`;
    root.style.top = `${maxY * scale}px`;
    root.style.transform = `scale(${scale})`;
    player.renderer.syncPixelRatio();
    return { duration, width, height, scale, box: [minX, minY, maxX - minX, maxY - minY], animations: assets.animations.map((a: any) => a.name) };
  }, { FRAMING_FPS, PAD, MAX_SIDE, model, anim });
  if ('error' in view) throw new Error(view.error);
  console.log(`${anim} ${view.duration.toFixed(4)} s (animations: ${view.animations.join(', ')}); frame ${view.width}x${view.height}, scale ${view.scale.toFixed(5)}, viewport x ${view.box[0].toFixed(2)} y ${view.box[1].toFixed(2)} w ${view.box[2].toFixed(2)} h ${view.box[3].toFixed(2)}`);
  if (Math.abs(view.duration - FRAMES / FPS) > 1e-6) throw new Error(`${anim} lasts ${view.duration} s, not ${FRAMES}/${FPS} (pass --frames ${Math.round(view.duration * FPS)})`);

  const stage = page.locator('#stage');
  for (let i = 0; i < FRAMES; i++) {
    await page.evaluate((t) => { const p = (window as any).rigPlayer; p.seek(t); p.draw(); }, SETTLE > 0 ? SETTLE * view.duration + i / FPS : i / FPS);
    await stage.screenshot({ path: join(frameDir, `f${String(i).padStart(4, '0')}.png`), omitBackground: true, animations: 'disabled' });
  }
  }
} finally {
  await browser.close();
  server.kill();
}

const args = ['-loop', '0', '-m', '6'];
for (let i = 0; i < FRAMES; i++) {
  const ms = Math.round(((i + 1) * 1000) / FPS) - Math.round((i * 1000) / FPS);
  args.push('-d', String(ms), '-lossy', '-q', QUALITY, '-exact', join(frameDir, `f${String(i).padStart(4, '0')}.png`));
}
args.push('-o', outWebp);
execFileSync(process.env.IMG2WEBP ?? 'img2webp', args, { stdio: 'inherit' });
// img2webp writes an opaque white background colour into the ANIM chunk; make it transparent.
execFileSync(process.env.WEBPMUX ?? 'webpmux', ['-set', 'bgcolor', '0,0,0,0', outWebp, '-o', outWebp], { stdio: 'inherit' });
copyFileSync(join(frameDir, 'f0000.png'), outPoster);
console.log(`wrote ${outWebp} (${statSync(outWebp).size} bytes), ${outPoster} (${statSync(outPoster).size} bytes)`);
if (!keep) rmSync(frameDir, { recursive: true, force: true });
