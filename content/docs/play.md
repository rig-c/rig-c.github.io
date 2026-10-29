---
navLabel: Play
title: "@rig-c/play: play rigc models as DOM or one canvas"
description: A browser player for the skeleton.model.json that rigc build writes. Draws rigs as plain DOM elements or into one canvas per player.
summaryForLlms: "@rig-c/play is the browser runtime that loads rigc's compiled skeleton.model.json and plays it as plain DOM elements (CSS matrix per rigid slot, small canvases per mesh) or as one canvas per player."
packageName: "@rig-c/play"
repoUrl: https://github.com/rig-c/play
npmUrl: https://www.npmjs.com/package/@rig-c/play
---
# @rig-c/play

<p class="mod-role">The browser player for the model rigc writes — no Spine runtime, rigid parts as plain DOM elements or the whole rig in one canvas.</p>

{{play-demo}}

<p class="mod-skip">Skip to <a href="#a-minimal-page">A minimal page</a> · <a href="#install">Install</a> · <a href="#inputs-and-outputs">Inputs and outputs</a> · <a href="#limits">Limits</a> · <a href="#go-deeper">Docs</a></p>

{{thread:play}}

A rigged character usually means a canvas runtime that rasterizes everything. For a rigid part, though, the bone transform is a plain affine map that CSS `matrix()` expresses exactly — so the rigid parts can live in the DOM, where the browser composites them and you can inspect and style them like any element. Play keeps that path, and adds what the DOM cannot do alone: per-part mesh canvases, `clip-path` clipping, and skipping meshes that did not move. Switch the player above to **One canvas** to see the other mode draw the same pose, or pick another **Character** and **Outfit**: the player switches between the 20 Family rigs.

## What you just ran

The player above is the published package doing what any page does with it — nothing on this site poses the rig:

1. `loadModel()` read the rig's `skeleton.model.json` — Character 1 office from this site, every other pick from rig-c/examples at a pinned commit, fetched when you pick it — and cut each atlas region into its own bitmap (the `.atlas` and `skeleton.json` beside it are not fetched).
2. `new RigPlayer(root, assets, { mode })` opened the motion you picked on a live track; rig-c's core, bundled in the package, poses bones, constraints, physics and draw order on the CPU, one `frame(dt)` at a time.
3. Each frame became a `PosedFrame` — region corners or mesh vertices, UVs, tint and clip, in draw order. A region is written as one `matrix()` string; meshes draw through one shared WebGL context and fall back to canvas2d (the status line says which ran).
4. **Bones** and **Mesh** draw from the player's own read-only queries, `bone(name)` and `posedFrame()`; **Pause** calls `pause()`.

Character 1 in the office outfit keeps both motions: `swing` — the cup swung like a pendulum — is the motion the [Pose](/docs/pose/) page retargeted onto that rig, and `idle` came with it from [Parts](/docs/parts/). The other 19 rigs play the `idle` they were built with; the motion menu lists what the loaded rig carries.

## A minimal page

Twenty-odd lines, from the README, load a model from jsDelivr, fit its stage box to a container and drive the clock:

```html
<div id="stage" style="position: relative; width: 480px; height: 640px; overflow: hidden"></div>
<script type="module">
  import { loadModel, RigPlayer } from 'https://cdn.jsdelivr.net/npm/@rig-c/play@1/dist/index.js';
  const stage = document.getElementById('stage');
  const assets = await loadModel({ modelUrl: 'rigs/look/skeleton.model.json' });
  const root = stage.appendChild(document.createElement('div'));
  const player = new RigPlayer(root, assets);
  player.play(assets.animations[0].name);
  const box = assets.stage ?? player.bounds();
  const scale = Math.min(stage.clientWidth / box.width, stage.clientHeight / box.height);
  root.style.cssText = `position: absolute; transform-origin: 0 0; transform: scale(${scale});
    left: ${-box.x * scale}px; top: ${(box.y + box.height) * scale}px`;
  player.renderer.syncPixelRatio();
  let last = performance.now();
  requestAnimationFrame(function tick(now) {
    player.frame((now - last) / 1000);
    last = now;
    requestAnimationFrame(tick);
  });
</script>
```

The player does not run its own clock: the page calls `frame(dt)`, so pausing, slowing down or stopping the loop is yours to decide (this site's player stays paused when your system asks for reduced motion). To play the same model inside PixiJS, Phaser or Three.js, see the [adapters](/docs/adapters/).

**Key terms.** *Model document* — `skeleton.model.json` (spec `rigc-compiled/3`). *Region attachment* — a rigid part, an `<img>` with a CSS matrix. *Mesh attachment* — a deforming part on its own small canvas. *Render mode* — `dom` (default) or `canvas`. *Mesh backend* — `webgl` (default since 1.9) or `canvas2d`. *Attachment set* — a named swap of slot attachments from `sets.json`.

## Install

```sh
npm i @rig-c/play
npm i -D @rig-c/core    # rigc build writes the model the player loads
```

Runs in the browser as an ES module; rig-c's posing core is bundled, so there is nothing else to install. The package is MIT and links nothing from Esoteric Software — see [Licensing](/docs/licensing/).

## Inputs and outputs
| In | Out |
| --- | --- |
| `skeleton.model.json` — the compiled model `rigc build` writes (spec `rigc-compiled/3`) | DOM mode (default): one `<img>` per rigid slot posed by a CSS `matrix()`, small per-part canvases for meshes |
| Its atlas page images (the `.atlas` and `skeleton.json` beside it are not fetched) | Canvas mode: the whole frame in one `<canvas>` per player |
| (optional) `sets.json` — named attachment sets, spec `rig-parts-sets/1` | Reads off the pose: `player.bone(name)`, `player.bounds()`, `slotIdentity()` |
| (optional) your own `PosedFrame` records, via `DomRenderer.render` | |

## Limits
From [REFERENCE.md §Status](https://github.com/rig-c/play/blob/main/docs/REFERENCE.md#status) and [MIGRATION.md §No counterpart in 1.0.0](https://github.com/rig-c/play/blob/main/docs/MIGRATION.md#no-counterpart-in-100):
- **Status: "Production."** — 60 fps on every engine measured for the practical scenario (REFERENCE.md §"Status").
- **Reads rigc's model only**: "a Spine export is refused by name"; `loadModel` reads a compiled model document and nothing else ([README §Why](https://github.com/rig-c/play#why), MIGRATION.md §"No counterpart in 1.0.0").
- **Which render mode is faster where is "not measured on a device yet"**, so the default stays `dom` (REFERENCE.md §"Status").
- **Dark/two-colour tint stays out of scope in DOM mode**; RGB tint needs reference-filter support, Safari 15+ (REFERENCE.md §"Status").
- **Clipping caveats**: an inverse polygon matches Spine's clipper only when convex, and the cost of many `clip-path`s on real-device Safari is not measured (REFERENCE.md §"Status").
- **No per-slot changes from code** (attachment, colour) and no `scale` on load; scaling the root element is the caller's (MIGRATION.md §"No counterpart in 1.0.0").

## Go deeper
- [Measured runtime costs and unresolved results](/docs/performance/) — historical package comparisons, with CPU, GPU and presentation boundaries.
- [Install](https://github.com/rig-c/play#install) · [A minimal page](https://github.com/rig-c/play#a-minimal-page)
- [Status](https://github.com/rig-c/play/blob/main/docs/REFERENCE.md#status)
- [Attachment sets (`sets.json`)](https://github.com/rig-c/play/blob/main/docs/REFERENCE.md#attachment-sets-setsjson)
- [Runtime knobs and what they cost](https://github.com/rig-c/play/blob/main/docs/REFERENCE.md#runtime-knobs-and-what-they-cost)
- [Benchmark: DOM, canvas and official WebGL](https://github.com/rig-c/play/blob/main/docs/BENCHMARK.md#benchmark-dom-canvas-and-official-webgl)
- [How it works](https://github.com/rig-c/play#how-it-works)
- [npm](https://www.npmjs.com/package/@rig-c/play) · [CHANGELOG](https://github.com/rig-c/play/blob/main/CHANGELOG.md)
<!-- SOURCES (not published)
- six Limits bullets rechecked against @rig-c/play 1.21.1 (npm gitHead = main 7f84c22f1fb8dacbf8db4aa1333efa3fbac6120a, 2026-10-30): docs/REFERENCE.md Status (production, practical scenario, mode cost, tint and clipping caveats); docs/MIGRATION.md No counterpart in 1.0.0 (model input, no load scale, no per-slot API); README Why (Spine export refused). Older line references below document the original 1.12.0 page/recording.
- live player picks: the 20 Family rigs = rig-c/examples@c239b09 family/ (same pin as /examples/), each with one animation `idle` (skeleton.model.json animations); sizes measured on jsDelivr: skeleton.png 1.19–2.00 MB + model ~0.09 MB compressed
- live player: @rig-c/play 1.12.0 from jsDelivr; Character 1 office model assets/rigs/character-1-swing = the Pose case's swing-build (Character 1 rig @examples c239b09 + retargeted cup swing; rig-c 2.61.0, @rig-c/pose 0.35.0)
- minimal page: rig-c/play README "A minimal page" (lines 301-326), style attribute only in the sample code
- mode switch / meshBackendActive / pause / bone / posedFrame: dist/player.d.ts, DomRenderer.d.ts 1.12.0

- version 1.12.0; main matches tag (ahead_by 0) — `npm view @rig-c/play version`; `gh api repos/rig-c/play/compare/v1.12.0...main`; .release-please-manifest.json
- plays skeleton.model.json from rigc build; <img> per rigid slot, one CSS matrix() write per frame; per-part mesh canvases; or one canvas per player — README.md:11-14
- dom default, canvas mode one <canvas> per player; switch with player.mode — README.md:170-177
- practical scenario (a character or two, mostly holding pose, a few parts deforming) holds 60 fps on every engine measured — README.md:163-167
- Spine export refused by name — README.md:31-33
- rigid bone transform is affine, CSS matrix expresses it exactly; DOM composited, inspectable, styled — README.md:24-27
- per-part mesh canvases, clip-path, dirty-skip — README.md:28-29, 191-193, 209-214
- loadModel; .atlas and skeleton.json not fetched — README.md:264-271
- RigPlayer play/frame(delta) — README.md:273-285; several tracks, mix, queue — README.md:569-580
- DomRenderer/PosedFrame, anything that produces one can draw — README.md:405-426
- CanvasRenderer after mode switch — README.md:808-813
- bone(), bounds() — README.md:435-443; posedFrame() — README.md:428; slotIdentity() — README.md:523-530
- sets.json, setSet() — README.md:477-512
- rig-c/core bundled, nothing else to install — README.md:269-271
- regions cut into bitmaps, rotation restored — README.md:1281-1283
- core poses bones, constraints, physics, deform, draw order CPU-side one dt at a time — README.md:1277-1280
- PosedFrame contents; affine from three corners, one matrix() string — README.md:1284-1288
- meshes through one shared WebGL context by default since 1.9; canvas2d fallback — README.md:244-252, 116
- install line — README.md:259-260
- spec rigc-compiled/3; document states skeleton, animations, region placement — README.md:265-268
- mesh canvas sized to world bounds — README.md:191-192
- dirty-skip definition — README.md:209
- neighbour adapters draw posed frames in engines — `npm view @rig-c/phaser description`, `npm view @rig-c/pixi description`
- section anchors — README.md headings at 257, 293, 405, 806, 1200, 1275, 1290
-->
