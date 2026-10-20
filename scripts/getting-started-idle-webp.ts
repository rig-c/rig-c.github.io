#!/usr/bin/env bun
/**
 * Rebuild the Getting Started step-8 clip: assets/docs/getting-started-idle.webp
 * (animated WebP with alpha) and assets/docs/getting-started-idle-poster.png
 * (its frame 0, RGBA).
 *
 * Usage, from a scratch directory where Playwright is installed:
 *
 *   bun add -d playwright@1.63.0
 *   WALKTHROUGH=/path/to/rig-c-start/my-rig \
 *   PLAYWRIGHT_MODULE=$PWD/node_modules/playwright/index.mjs \
 *     bun /path/to/site/scripts/getting-started-idle-webp.ts [--player DIR] [--keep DIR]
 *
 * WALKTHROUGH is the `my-rig` folder a run of the Getting Started walkthrough
 * wrote: the step-8 build is its out/check/build/skeleton.model.json and the
 * player is its node_modules/@rig-c/play. --player is the folder holding the
 * walkthrough's step-10 player, play.html and serve.ts (default
 * $WALKTHROUGH/../getting-started/scripts, where step 1 clones it). --keep
 * keeps the captured RGBA frames (f0000.png ...) in DIR.
 *
 * Why not `rigc render`: its frames are composited over a fixed grey
 * (232, 232, 232) and `rigc check` refuses frames that are not opaque, so a
 * rigc-rendered idle (out/idle.png) cannot carry alpha. The same build is drawn
 * here by @rig-c/play on a transparent page instead.
 *
 * What it does:
 *   1. starts the player's own server (`bun serve.ts --port 0`) in WALKTHROUGH;
 *   2. opens /?model=out/check/build/skeleton.model.json&anim=idle in headless
 *      Chromium (WebGL through --use-angle=metal on macOS) on Playwright's fake
 *      clock, so the page's own requestAnimationFrame loop does not move the
 *      rig; makes html, body and #stage transparent and hides #bar;
 *   3. frames the rig the way `rigc render --max 640` does (rig-c's
 *      render_shared.ts): the union of the pose's bounds over the idle at
 *      60 fps, padded by 4% of its long side, scaled so the long side is
 *      640 px; sizes #stage to that box and places the rig's root in it;
 *   4. for frame i of 40 seeks the player to i/12 s (RigPlayer.seek: reopen and
 *      step in 1/60 s increments, deterministic), draws, and screenshots
 *      #stage with omitBackground -> RGBA PNG;
 *   5. encodes the 40 frames with img2webp (lossy q85, method 6, -exact; the
 *      alpha plane is lossless, libwebp's default alpha_quality 100), frame i
 *      lasting round((i+1)*1000/12) - round(i*1000/12) ms (83 or 84), so the
 *      loop is 3333 ms; webpmux sets the animation background colour to
 *      transparent (img2webp writes opaque white); frame 0 is copied as the
 *      poster.
 *
 * Run 2026-10-20 with Bun 1.4.2, Playwright 1.63.0 (Chromium 153), libwebp
 * 1.6.0 (img2webp), on the walkthrough run recorded in the Getting Started
 * page's SOURCES (@rig-c/parts 1.42.0, rig-c 2.64.1, @rig-c/play 1.12.0,
 * rig-c/getting-started 2928714).
 */
import { spawn, execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const FRAMES = 40;
const FPS = 12;
const MAX_SIDE = 640;
const PAD = 0.04; // rig-c render_shared.ts PAD
const FRAMING_FPS = 60; // rig-c render_shared.ts FRAMING_FPS

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const walkthrough = process.env.WALKTHROUGH;
if (!walkthrough) throw new Error('set WALKTHROUGH to a walkthrough run\'s my-rig folder');
const here = resolve(walkthrough);
const playerDir = resolve(arg('--player') ?? join(here, '../getting-started/scripts'));
for (const f of [join(here, 'out/check/build/skeleton.model.json'), join(here, 'node_modules/@rig-c/play/dist/index.js'), join(playerDir, 'serve.ts')]) {
  if (!existsSync(f)) throw new Error(`missing ${f}`);
}
const site = resolve(import.meta.dir, '..');
const outWebp = join(site, 'assets/docs/getting-started-idle.webp');
const outPoster = join(site, 'assets/docs/getting-started-idle-poster.png');
const keep = arg('--keep');
const frameDir = keep ? resolve(keep) : mkdtempSync(join(tmpdir(), 'gs-idle-'));
mkdirSync(frameDir, { recursive: true });

const pw = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');

const server = spawn('bun', [join(playerDir, 'serve.ts'), '--port', '0'], { cwd: here, stdio: ['ignore', 'pipe', 'inherit'] });
const base: string = await new Promise((ok, fail) => {
  let seen = '';
  server.stdout!.on('data', (b: Buffer) => {
    seen += b.toString();
    const m = seen.match(/http:\/\/localhost:(\d+)\//);
    if (m) ok(`http://localhost:${m[1]}`);
  });
  server.on('exit', (code) => fail(new Error(`serve.ts exited ${code}`)));
});

const browser = await pw.chromium.launch({ args: process.platform === 'darwin' ? ['--use-angle=metal'] : [] });
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1 });
  await page.clock.install({ time: 0 });
  await page.goto(`${base}/?model=out/check/build/skeleton.model.json&anim=idle`);
  await page.waitForFunction(() => (window as any).rigPlayer);
  await page.clock.pauseAt(1000); // the page's rAF loop stops; only seek moves the rig
  await page.addStyleTag({ content: 'html, body, #stage { background: transparent !important; } #bar { display: none !important; }' });

  const view = await page.evaluate(async ({ FRAMING_FPS, PAD, MAX_SIDE }) => {
    const player = (window as any).rigPlayer;
    const { loadModel } = await import('/node_modules/@rig-c/play/dist/index.js');
    const assets = await loadModel({ modelUrl: '/out/check/build/skeleton.model.json' });
    const idle = assets.animations.find((a: any) => a.name === 'idle');
    const duration: number = idle.duration;
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
    return { duration, width, height, scale, box: [minX, minY, maxX, maxY], animations: assets.animations.map((a: any) => a.name) };
  }, { FRAMING_FPS, PAD, MAX_SIDE });
  console.log(`idle ${view.duration.toFixed(4)} s (animations: ${view.animations.join(', ')}); frame ${view.width}x${view.height}, scale ${view.scale.toFixed(5)}`);
  if (Math.abs(view.duration - FRAMES / FPS) > 1e-6) throw new Error(`idle lasts ${view.duration} s, not ${FRAMES}/${FPS}`);

  const stage = page.locator('#stage');
  for (let i = 0; i < FRAMES; i++) {
    await page.evaluate((t) => { const p = (window as any).rigPlayer; p.seek(t); p.draw(); }, i / FPS);
    await stage.screenshot({ path: join(frameDir, `f${String(i).padStart(4, '0')}.png`), omitBackground: true, animations: 'disabled' });
  }
} finally {
  await browser.close();
  server.kill();
}

const args = ['-loop', '0', '-m', '6'];
for (let i = 0; i < FRAMES; i++) {
  const ms = Math.round(((i + 1) * 1000) / FPS) - Math.round((i * 1000) / FPS);
  args.push('-d', String(ms), '-lossy', '-q', '85', '-exact', join(frameDir, `f${String(i).padStart(4, '0')}.png`));
}
args.push('-o', outWebp);
execFileSync(process.env.IMG2WEBP ?? 'img2webp', args, { stdio: 'inherit' });
// img2webp writes an opaque white background colour into the ANIM chunk; make it transparent.
execFileSync(process.env.WEBPMUX ?? 'webpmux', ['-set', 'bgcolor', '0,0,0,0', outWebp, '-o', outWebp], { stdio: 'inherit' });
copyFileSync(join(frameDir, 'f0000.png'), outPoster);
console.log(`wrote ${outWebp} (${statSync(outWebp).size} bytes), ${outPoster} (${statSync(outPoster).size} bytes)`);
if (!keep) rmSync(frameDir, { recursive: true, force: true });
