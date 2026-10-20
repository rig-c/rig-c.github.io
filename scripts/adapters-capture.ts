// Capture the adapters page's side-by-side clip: one rig playing one
// animation in PixiJS, Phaser and Three.js, each drawn by its adapter's own
// demo page from rig-c/adapters.
//
// Pinned run (2026-10-20):
//   rig-c/adapters 5423bf4: index.html (PixiRig demo; ?host=phaser runs the
//     PhaserRig demo on the same page), three-demo.html and src/, copied
//     unmodified into a scratch folder, plus public/rigs/ as that repo's
//     scripts/fetch-assets.sh builds it (rig-c 2.52.0 `rigc build` of
//     rig-c/core v2.52.0 gallery/walk; skeleton.model.json md5
//     b19607a17e5e74d4046eff62b716a389).
//   Installed there with Bun 1.4.2 from npm, exact versions:
//     @rig-c/pixi 0.1.1, @rig-c/phaser 0.1.1, @rig-c/three 0.1.1,
//     @rig-c/play 1.10.0, pixi.js 8.22.0, phaser 4.2.1, three 0.186.1,
//     vite 6.4.4, playwright 1.62.1 (its headless Chromium,
//     --use-angle=metal on macOS so WebGL is available).
//   Served with `bunx vite --port 4391` from that folder (no vite config, so
//   the pages import the published packages, not workspace sources).
//
// Run from that folder (so `playwright` resolves from its node_modules), with
// this repo's scripts by path:
//   bun <site>/scripts/adapters-capture.ts --base http://localhost:4391 --out capture
//   python3 <site>/scripts/adapters-composite.py capture capture/frames
//   ADAPTERS_CAPTURE=capture <site>/scripts/encode-video.sh adapters-three-engines
//
// Every page is opened paused at a time (?time=0, timescale 0), and each frame
// is posed by the page's own time control: Pixi and Phaser seek on the time
// box's change event (Phaser then steps its stopped game once), Three.js on
// the time slider's input event. The slider's step is set to "any" first so
// the browser does not round the time to 1 ms. After each seek the page's own
// state is checked to hold the requested time; then the WebGL canvas is read
// with toDataURL (all three demos keep the drawing buffer). No wall clock, no
// requestAnimationFrame: the same command writes the same frames.
//
// The `walk` animation is 0.9 s, so 30 fps gives 27 frames per cycle
// (t = 0, 1/30, ..., 26/30); the composite repeats that cycle.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const RIG = 'walk';
const ANIM = 'walk';
const FPS = 30;
const FRAMES = 27; // 0.9 s * 30 fps

function arg(name: string): string {
  const i = process.argv.indexOf(name);
  if (i < 0 || !process.argv[i + 1]) throw new Error(`missing ${name}`);
  return process.argv[i + 1];
}

const base = arg('--base');
const out = arg('--out');

const HOSTS = [
  { name: 'pixi', url: `/?rig=${RIG}&anim=${ANIM}&time=0` },
  { name: 'phaser', url: `/?host=phaser&rig=${RIG}&anim=${ANIM}&time=0` },
  { name: 'three', url: `/three-demo.html?rig=${RIG}&anim=${ANIM}&time=0&timescale=0` },
] as const;

const browser = await chromium.launch({ args: ['--use-angle=metal'] });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const host of HOSTS) {
    await page.goto(base + host.url);
    if (host.name === 'three') {
      await page.waitForFunction(() => (window as any).threeDemoState?.ready || (window as any).threeDemoState?.error);
      const err = await page.evaluate(() => (window as any).threeDemoState.error);
      if (err) throw new Error(`three: ${err}`);
      await page.evaluate(() => { (document.getElementById('time') as HTMLInputElement).step = 'any'; });
    } else {
      await page.waitForFunction(() => document.body.dataset.demoReady === 'true' || document.body.dataset.demoReady === 'error');
      const err = await page.evaluate(() => (window as any).__rigAdaptersDemoError);
      if (err) throw new Error(`${host.name}: ${err}`);
    }
    const dir = join(out, host.name);
    mkdirSync(dir, { recursive: true });
    for (let i = 0; i < FRAMES; i++) {
      const t = i / FPS;
      const { got, png } = await page.evaluate(({ name, t }) => {
        const w = window as any;
        if (name === 'three') {
          const input = document.getElementById('time') as HTMLInputElement;
          input.value = String(t);
          input.dispatchEvent(new Event('input'));
          return { got: w.threeDemoState.times[0], png: (document.querySelector('#stage canvas') as HTMLCanvasElement).toDataURL('image/png') };
        }
        const input = document.getElementById('time-input') as HTMLInputElement;
        input.value = String(t);
        input.dispatchEvent(new Event('change'));
        return { got: w.__rigAdaptersDemo.time, png: (document.querySelector('#pixi-stage canvas') as HTMLCanvasElement).toDataURL('image/png') };
      }, { name: host.name, t });
      if (Math.abs(got - t) > 1e-9) throw new Error(`${host.name}: asked for t=${t}, page holds ${got}`);
      writeFileSync(join(dir, `f${String(i).padStart(4, '0')}.png`), Buffer.from(png.split(',')[1], 'base64'));
    }
    console.log(`${host.name}: ${FRAMES} frames, t 0..${((FRAMES - 1) / FPS).toFixed(4)} s`);
  }
  if (errors.length) throw new Error(`page errors: ${errors.join('; ')}`);
} finally {
  await browser.close();
}
