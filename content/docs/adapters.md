---
navLabel: Adapters
title: "rig-c engine adapters: PixiJS, Phaser and Three.js"
description: Play a rig that rigc built inside PixiJS 8, Phaser 4.2+ or Three.js, posed by @rig-c/play and drawn by the host's own renderer. No Spine runtime.
summaryForLlms: "@rig-c/pixi, @rig-c/phaser and @rig-c/three play rigc's skeleton.model.json inside PixiJS, Phaser or Three.js scenes, posed through @rig-c/play and drawn with each host's native objects, without a Spine runtime."
packageName: "@rig-c/pixi, @rig-c/phaser, @rig-c/three"
repoUrl: https://github.com/rig-c/adapters
npmUrl: https://www.npmjs.com/package/@rig-c/pixi
---
# Engine adapters

The adapters put a rigc-built rig inside the engine or renderer your game already uses. [Play](/docs/play/) computes the pose; the host draws it with its own objects.

## What it is

Three packages, each versioned on its own, with 0.x APIs. The badge above lists each current npm release; the recording below keeps its original versions:

- `@rig-c/pixi`: a PixiJS 8 adapter.
- `@rig-c/phaser`: a Phaser 4.2+ adapter for WebGL scenes.
- `@rig-c/three`: a native Three.js 0.186.1 renderer and live `Group`.

Each one reads the model document `rigc build` writes, `skeleton.model.json`, through `@rig-c/play`.

<figure class="figure-wide">
  <div class="media">
    <video data-loop="the walk" controls muted loop playsinline preload="metadata" poster="/assets/docs/adapters-three-engines-poster.jpg" width="1424" height="638" aria-label="Recorded video: the same cartoon animal character walking in place in three panels, labelled PixiJS, Phaser and Three.js, in step with each other">
      <source src="/assets/docs/adapters-three-engines.mp4" type="video/mp4">
      <img src="/assets/docs/adapters-three-engines-poster.jpg" alt="The same walking character in three panels labelled @rig-c/pixi, @rig-c/phaser and @rig-c/three" width="1424" height="638">
    </video>
  </div>
  <figcaption><span class="media-kind">Recorded video</span> One rig, three hosts: <code>@rig-c/pixi</code> 0.1.1 on PixiJS 8.22.0, <code>@rig-c/phaser</code> 0.1.1 on Phaser 4.2.1 and <code>@rig-c/three</code> 0.1.1 on Three.js 0.186.1. Each panel is the adapters repository's own demo page, run against the npm releases, playing rigc's <code>walk</code> gallery rig and its 0.9 s <code>walk</code> animation; all three read the same <code>skeleton.model.json</code> through <code>@rig-c/play</code> 1.10.0, unmodified. Every frame was posed by seeking each page to the same time (30 fps) and reading its WebGL canvas, and the 0.9 s cycle plays four times. At equal times the panels differ by a mean of 0.03 (PixiJS vs Phaser) and 0.54 (PixiJS vs Three.js) on 0–255 RGB, against 2.4 between neighbouring frames; the Three.js demo draws the rig smaller, so its panel is enlarged more.</figcaption>
</figure>

## When to use it

Use an adapter when your game or page already renders with PixiJS, Phaser or Three.js, and the rig must sit in that scene graph with your other objects. Three.js is a 3D renderer, so its adapter is for 2D characters inside 3D scenes and interactive pages.

If you only need a rig in a web page, with no engine, use [Play](/docs/play/) directly. It draws as DOM elements or one canvas. Native engines such as Godot or Unity are planned, not available.

## What it solves

rigc compiles a rig into two things side by side: Spine 4.3 skeleton data and its own model document. An official Spine runtime can load the Spine data, but it brings the Spine Runtimes licence with it. An adapter is a third way: rig-c's own poser runs inside the engine's scene graph and renderer, reads the model document, and links no Spine runtime.

## What you get

- **A live object** per host: `PixiRig` (a Pixi `Container`), `PhaserRig` (a Phaser `Container`) and `ThreeRig` (a flat Three.js `Group`). Each owns an independent player and exposes `play`, `seek`, `bone()` and `bounds()`.
- **A renderer** per host for when you own the player: `PixiRenderer`, `PhaserRenderer` and `ThreeRenderer`. Each draws a supplied `PosedFrame`.
- **Shared page textures**: several rigs over one `ModelAssets` load share page textures until the last holder releases them.

## How it works

1. Load the model with `@rig-c/play`'s `loadModel`, using the files `rigc build` wrote, unmodified.
2. Create the host object, for example `new PixiRig(assets, { ticker: app.ticker })`, and add it to your stage or scene.
3. Each update, `@rig-c/play` poses the rig and produces a `PosedFrame` record.
4. The adapter reads slot corners or mesh vertices, page UVs, tint, blend and clip straight from that record. It maps world `(x, y)` to `(x, -y)` and draws with the host's native objects.
5. On removal, `destroy()` frees that rig's own resources. Dispose the shared assets after the last rig is gone.

```sh
npm install @rig-c/pixi pixi.js @rig-c/play
```

Swap in `@rig-c/phaser phaser` or `@rig-c/three three` for the other hosts.

## Run a pointer-follow example

The [upstream look example](https://github.com/rig-c/adapters/tree/cccc84136c0342312c4d353b46bae9d8c130627f/examples/look) is a runnable page: move the pointer to turn the face, with eyes following immediately and the head and body following on a spring. Start with **PixiJS** below. This route runs locally from a fixed source archive; it needs Bun, curl, tar and a browser with WebGL.

In a new directory:

```sh
mkdir rig-c-look
cd rig-c-look
curl -fL https://codeload.github.com/rig-c/adapters/tar.gz/cccc84136c0342312c4d353b46bae9d8c130627f -o source.tar.gz
tar -xzf source.tar.gz --strip-components=1
bun install --frozen-lockfile
cat > look.vite.config.ts <<'EOF'
import { defineConfig, mergeConfig } from 'vite';
import upstream from './vite.config.ts';
export default defineConfig((env) => {
  if (typeof upstream !== 'function') throw new Error('Expected the pinned Vite config');
  return mergeConfig(upstream(env), {
    optimizeDeps: { entries: ['examples/look/index.html'] },
  });
});
EOF
BROWSER=none bun run example:look --config look.vite.config.ts --host 127.0.0.1 --port 5173 --strictPort
```

Open the [local PixiJS page](http://127.0.0.1:5173/examples/look/index.html?host=pixi). Wait for the loading message to become dial values, then move across the canvas; leaving it returns the target to neutral. Stop the server with Ctrl-C when finished. The committed model and image are already in the archive: no fixture fetch or rebuild is needed. The small Vite config keeps the upstream aliases and helper intact, while limiting dependency scanning to this example; the default config also scans unrelated test/oracle pages whose packages are not installed by this recipe.

### What this run uses

The source pin is [cccc841](https://github.com/rig-c/adapters/commit/cccc84136c0342312c4d353b46bae9d8c130627f); its [frozen lockfile](https://github.com/rig-c/adapters/blob/cccc84136c0342312c4d353b46bae9d8c130627f/bun.lock) selects **Play 1.12.0**, **PixiJS 8.22.0**, **rig-c 2.64.1** (the public `rig-c/core` reader) and **Vite 6.4.4**. The page imports `@rig-c/pixi` from this checkout's **0.1.2 workspace source**, through the upstream Vite development alias. It does not install that adapter from npm. Keep the archive and lock together; the current-release badges above describe a different, build-time lookup.

The [fixture directory](https://github.com/rig-c/adapters/tree/cccc84136c0342312c4d353b46bae9d8c130627f/examples/look/rig) contains a compiled model and one atlas image used at runtime:

| File | Bytes | SHA-256 |
| --- | --- | --- |
| `skeleton.model.json` | 2,182,604 | `1c2786199210007021fa82874e375a7d29f91e422285ccdf9416caa976585c50` |
| `skeleton.png` | 1,790,672 | `d41b70387f1e1f6e988f319c466441f1b0e0dadc731212278113c747ac2cef4e` |

[The fixture's introduction](https://github.com/rig-c/adapters/issues/37) records a Parts **1.34.0** build on Core **2.59.0**, from the project owner's painting, with cylinder-based face turn and slider dials. The committed example and fixture are distributed under the repository's [MIT licence](https://github.com/rig-c/adapters/blob/cccc84136c0342312c4d353b46bae9d8c130627f/LICENSE); retain that notice when copying them. These are the public bytes this recipe plays, not a new build from the released [depth producer](/docs/parts/#depth-driven-head-turns). Upstream still marks a refresh to a released public depth rig as pending. Slider motion here does not establish depth-producer acceptance, full 3D rotation or parity between hosts. The separate [head-turn preview](/demos/head-turn/) has its own implementation.

### Connect it to your own page

Read the pinned [helper](https://github.com/rig-c/adapters/blob/cccc84136c0342312c4d353b46bae9d8c130627f/examples/look/pointer-dials.ts), [page](https://github.com/rig-c/adapters/blob/cccc84136c0342312c4d353b46bae9d8c130627f/examples/look/main.ts) and [host setup](https://github.com/rig-c/adapters/blob/cccc84136c0342312c4d353b46bae9d8c130627f/examples/look/hosts.ts) together. `pointer-dials.ts` is example-side TypeScript: import it from the checkout, or copy it with its MIT notice into a bundler-based application. It is not a package export. The upstream page is the complete executable reference; the lifecycle below explains where each piece belongs.

1. **Load the same model bytes into both readers.** Fetch the model URL and check `response.ok`. Pass its text to `readModel(text, modelUrl)` from `rig-c/core`. Pass the same text back to `loadModel({ modelUrl, regions: 'none', fetch })` from `@rig-c/play` through the public fetch callback, delegating image requests to the browser's `fetch`. Keep the model and its image pages together. There is no need to unwrap the opaque `ModelAssets.document`.
2. **Create the host rig.** The PixiJS host creates a `WebGLRenderer`, a stage `Container` and `new PixiRig(assets, { ticker: null, autoUpdate: false })`, fits the rig's bounds and adds it to the stage. With manual stepping there is only one clock. The example's `LookController` selects the declared `idle`, sets the environment and adds its existing calibrated global hair impulse.
3. **Bind declared slider names.** For the reusable helper, call `readPointerDialBindings(doc, { yaw: 'yaw_dial', pitch: 'pitch_dial' })`, then `new PointerDials(bindings)` and assign `rig.player.adjust = follow.adjust`. Yaw and pitch are required. Add `roll`, `body`, `gazeX` or `gazeY` only when your model declares their dial bones and usable sliders. The upstream `LookController` requests all six for this fixture, and derives yaw/pitch direction signs from its animation curves; preserve that probe when reusing its fixture. A different rig supplies its own names and directions.
4. **Feed input, then pose and draw.** On `pointermove`, call `pointerToNormalized(event.clientX, event.clientY, canvas.getBoundingClientRect())` and pass its `fx, fy` to `follow.setPointer`. CSS coordinates map right/up to positive X/Y and clamp to `[-1, 1]`; an empty rectangle or nonfinite input maps to zero. On `pointerleave`, call `follow.clearPointer()`. In each frame, with elapsed seconds `dt`, call `follow.step(dt)` **before** `rig.advance(dt)`, then `renderer.render({ container: stage })`. The full upstream page uses `controller.step(dt)` to perform that sequence plus its hair input; do not advance the rig a second time. For a touch-controlled application, bind pointer down/move/up/cancel, set the canvas touch policy and clear on release; the pinned example itself only listens to move/leave.
5. **Release in ownership order.** Stop your animation frame loop and remove your input listeners. Remove the rig from its stage and call `rig.destroy()` before `assets.dispose()`; shared assets stay alive until the last rig releases them. Destroy a renderer only if your page owns it. The upstream page exposes `window.__lookDemo.dispose()`: it cancels its clock, destroys the rig, disposes assets, destroys its host and removes the canvas. It also calls this on non-persisted `pagehide`; this is the example's inspection API, not a package API.

Each requested dial must have exactly one **local, non-looping** slider, with finite `from`/`to`, nonzero finite `scale` and a positive animation duration. The helper inverts `time = to + (value - from) * scale` at time zero and at the duration, then sorts the two endpoints. It preserves asymmetric bands; the raw model's `max` is not the parsed range. A missing or unsupported slider throws `PointerDialRefusal` with the axis and bone. Do not replace that refusal with guessed angles or direct head-bone writes.

For these fixture bytes, the derived bands are:

| Axis | Dial bone | Local channel | Band |
| --- | --- | --- | --- |
| yaw | `yaw_dial` | rotation | `[-15, 15]` |
| pitch | `pitch_dial` | rotation | `[-12, 12]` |
| roll | `roll_dial` | rotation | `[-8, 8]` |
| body | `body_dial` | rotation | `[-6, 6]` |
| gazeX | `gaze_x_dial` | rotation | `[-1, 1]` |
| gazeY | `gaze_y_dial` | rotation | `[-1, 1]` |

### Failures and checks

A missing requested dial produces a console warning and a static rig with the missing axis in the HUD. A failed model fetch sets `document.body.dataset.lookReady` to `error` and records `window.__lookDemoError`; the pinned page leaves its loading text in place. Inspect the console/network and that error value, or add a visible error message and release partially created resources in your application's catch path. Do not treat a loading message as success.

From the extracted repository, `bun run test:look` exercises the actual helper's reader, refusal, normalization, asymmetric clamp and spring controls without a browser. `?manual=1` disables the page clock for controlled stepping via its inspection API. The reproducible route here is scoped to PixiJS; the upstream host links are available, but no new three-host equivalence or physical touch-device result is claimed.

## Key concepts

- **Host**: the engine or renderer an adapter targets. Each host lives in `packages/<host>`.
- **Model document**: `skeleton.model.json`, the source the adapters read. Spine is one export of it.
- **`PosedFrame`**: the per-frame record `@rig-c/play` produces and every renderer draws.
- **`ModelAssets`**: one `loadModel` result, which several rigs can share.
- **Parity**: an adapter plays the same pose for the same time as `@rig-c/play`, held to the player's output by a test.

## Go deeper

- [Measured runtime costs and unresolved results](/docs/performance/) — historical Play comparisons through the legacy Pixi adapter, with workload and device limits.
- [README: Why this exists](https://github.com/rig-c/adapters#why-this-exists)
- [README: What an adapter promises](https://github.com/rig-c/adapters#what-an-adapter-promises)
- [packages/pixi README](https://github.com/rig-c/adapters/tree/main/packages/pixi#readme)
- [packages/phaser README](https://github.com/rig-c/adapters/tree/main/packages/phaser#readme) (renderer contract)
- [packages/three README](https://github.com/rig-c/adapters/tree/main/packages/three#readme) (native drawing and scene placement)
- [docs/ADDING_A_HOST.md](https://github.com/rig-c/adapters/blob/main/docs/ADDING_A_HOST.md)
- Changelogs: [pixi](https://github.com/rig-c/adapters/blob/main/packages/pixi/CHANGELOG.md), [phaser](https://github.com/rig-c/adapters/blob/main/packages/phaser/CHANGELOG.md), [three](https://github.com/rig-c/adapters/blob/main/packages/three/CHANGELOG.md)
- npm: [@rig-c/pixi](https://www.npmjs.com/package/@rig-c/pixi), [@rig-c/phaser](https://www.npmjs.com/package/@rig-c/phaser), [@rig-c/three](https://www.npmjs.com/package/@rig-c/three)

<!-- SOURCES (not published)
- pointer recipe: adapters@cccc84136c0342312c4d353b46bae9d8c130627f examples/look/{README.md,pointer-dials.ts,look.ts,main.ts,hosts.ts,index.html}, root package.json/bun.lock/vite.config.ts; workspace pixi 0.1.2 source alias. Fixture hashes from immutable Git blob bytes, introduction adapters#37/#38 (Parts 1.34.0/Core 2.59.0); repository LICENSE. No fixture rebuild.
- versions 0.1.1 each — `npm view @rig-c/pixi version`, `npm view @rig-c/phaser version`, `npm view @rig-c/three version`; .release-please-manifest.json
- 0.x APIs; PixiJS 8, Phaser 4.2+, Three.js 0.186.1 renderer and live Group — README.md:6-12
- each host independently versioned in packages/<host> — README.md:15
- play inside the engine or renderer your game uses — README.md:3-4
- reads skeleton.model.json via @rig-c/play — `npm view @rig-c/pixi description`; packages/*/README.md:3
- Phaser WebGL scene — packages/phaser/README.md:3
- Three.js is a 3D renderer for 2D characters in 3D scenes and interactive pages — README.md:115-116
- Play draws DOM or one canvas in a web page — README.md:97-98
- native engines later / planned — README.md:13, 120-121
- two outputs: Spine 4.3 data and model document — README.md:94-95
- official Spine runtime brings Spine Runtimes licence — README.md:99-101
- third way: rig-c poser inside engine scene graph and renderer, no Spine runtime — README.md:103-104, 128
- model document is source, Spine is one export — README.md:105-106
- PixiRig is Pixi Container, PixiRenderer when you own the player — packages/pixi/README.md:29-32
- PhaserRig is Phaser Container with independent RigPlayer; PhaserRenderer — packages/phaser/README.md:39, 43
- ThreeRig flat Group; independent RigPlayer; ThreeRenderer — packages/three/README.md:3-5, 47-48, 66-67
- play/seek/bone/bounds on live objects — packages/pixi/README.md:30; packages/phaser/README.md:39; packages/three/README.md:47-52
- renderers draw a supplied PosedFrame — packages/pixi/README.md:31; packages/phaser/README.md:43; packages/three/README.md:66-67
- shared page textures across one ModelAssets load until last holder — packages/phaser/README.md:41; packages/three/README.md:59-60; packages/pixi/src/pixi.ts:362-375
- files from rigc build unmodified — README.md:40, 127
- PixiRig constructor with ticker — README.md:34
- adapter reads corners/vertices, UVs, tint, blend, clip from record; (x,-y) mapping — packages/pixi/src/pixi.ts:401-410; packages/phaser/README.md:47
- destroy frees own resources; dispose assets after last — packages/three/README.md:54-57; packages/phaser/README.md:33-36, 41
- install line — README.md:22; phaser/three install — README.md:48, packages/three/README.md:10
- parity: same pose for same time held by a test — README.md:125-126
- ADDING_A_HOST.md exists — README.md:85; repo tree docs/ADDING_A_HOST.md
- figure: rig-c/adapters 5423bf4 index.html (PixiRig; ?host=phaser runs PhaserRig) and three-demo.html, src/ copied unmodified, public/rigs/ from that repo's scripts/fetch-assets.sh (rig-c 2.52.0 build of rig-c/core v2.52.0 gallery/walk, skeleton.model.json md5 b19607a17e5e74d4046eff62b716a389); served by vite 6.4.4 against npm @rig-c/pixi 0.1.1, @rig-c/phaser 0.1.1, @rig-c/three 0.1.1, @rig-c/play 1.10.0, pixi.js 8.22.0, phaser 4.2.1, three 0.186.1 (pixi.js/phaser/three/play versions are the adapters root package.json pins; peer ranges pixi.js ^8.0.0, phaser ^4.2.0, three ^0.186.1 — `npm view @rig-c/<host>@0.1.1 peerDependencies`)
- capture: `bun scripts/adapters-capture.ts --base http://localhost:4391 --out capture` (Playwright 1.62.1 headless Chromium, --use-angle=metal; seek via each page's time control, canvas toDataURL; two runs md5-identical), `python3 scripts/adapters-composite.py capture capture/frames`, `ADAPTERS_CAPTURE=capture scripts/encode-video.sh adapters-three-engines` — 2026-10-20
- walk animation 0.9 s — skeleton.model.json animations; 27 frames per cycle at 30 fps x 4 = 108 frames, 3.600 s, 1424x638, 622,390 bytes; loop seam 0.629 vs step median 2.202 max 3.221 PASS (scripts/loop-seam.py on the MP4)
- inter-panel MAD (composite, same times, 448x560 panels after Lanczos resample): pixi-phaser mean 0.025 max 0.031; pixi-three mean 0.543 max 0.557; phaser-three mean 0.533 max 0.549; pixi-phaser on the 800x600 canvases before resampling mean 0.008 max 0.010; pixi panel frame-to-frame step median 2.428 max 3.503 — scripts/adapters-composite.py output
- demo scale: Pixi/Phaser 0.6359 px/unit (src/main.ts computeStagePlacement, 78% of 800x600), Three.js 0.5842 (src/three-demo.ts, 430 px tall) — checked per frame against the drawn rectangle by the composite script
- "It plays what @rig-c/play plays: the same pose for the same time, held to the player's output by a test" — README.md:125-126 (the caption's numbers are this page's measurement, not a parity claim)
-->
