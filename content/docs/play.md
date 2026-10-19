---
navLabel: Play
title: "@rig-c/play: play rigc models as DOM or one canvas"
description: A browser player for the skeleton.model.json that rigc build writes. Draws rigs as plain DOM elements or into one canvas per player.
summaryForLlms: "@rig-c/play is the browser runtime that loads rigc's compiled skeleton.model.json and plays it as plain DOM elements (CSS matrix per rigid slot, small canvases per mesh) or as one canvas per player."
packageName: "@rig-c/play"
packageVersion: "1.12.0"
repoUrl: https://github.com/rig-c/play
npmUrl: https://www.npmjs.com/package/@rig-c/play
---
# Play

Play is the runtime of the rig-c toolchain. It loads the model a [Core](/docs/core/) build writes and animates it in a web page.

## What it is

`@rig-c/play` plays `skeleton.model.json`, the compiled model document that `rigc build` writes. In the default `dom` mode, each rigid slot is one absolutely positioned `<img>`, posed with one CSS `matrix()` write per frame, and deforming meshes draw on small per-part canvases. In `canvas` mode the whole frame draws into one `<canvas>` per player.

## When to use it

Use it to show a rigc-built character in a browser page, with no game engine. It suits a few characters that mostly hold a pose with some parts deforming. The README reports that this case holds 60 fps on every engine it measured.

When you already render with PixiJS, Phaser or Three.js, use the [engine adapters](/docs/adapters/) instead. They draw Play's posed frames inside that engine. To inspect a rig and leave feedback, use [Review](/docs/review/). Play does not play Spine exports; a Spine export is refused by name.

## What it solves

A rigged character usually means a canvas runtime that rasterizes everything. For a rigid part, though, the bone transform is a plain affine map that CSS `matrix()` expresses exactly. So the rigid parts can live in the DOM, where the browser composites them and you can inspect and style them like any element. Play keeps that path and adds what the DOM cannot do alone: per-part mesh canvases, `clip-path` clipping, and dirty-skip for meshes that did not move.

## What you get

- `loadModel()`: loads the model document and cuts each atlas region into its own bitmap. The `.atlas` and `skeleton.json` next to it are not fetched.
- `RigPlayer`: plays, queues and mixes animations on several tracks, and steps one `frame(delta)` at a time.
- `DomRenderer` and `CanvasRenderer`: the two render modes. You can switch in place with `player.mode`.
- `PosedFrame`: a plain record of what to draw this frame. Any code that produces one can draw through the renderer.
- Read-only queries: `bone()`, `bounds()`, `posedFrame()` and `slotIdentity()`.
- Attachment sets from an optional `sets.json`, switched with `setSet()`.

## How it works

1. `loadModel` reads the compiled model document with `rig-c/core`, which is bundled into the package. There is nothing else to install.
2. At load time each region on the document's pages is cut into its own bitmap, with its rotation restored.
3. `RigPlayer` opens an animation on a live track. The core poses bones, constraints, physics, deform and draw order on the CPU, one `dt` at a time.
4. Each frame the pose becomes a `PosedFrame`: region corners or mesh vertices, UVs, tint, blend and clip, in draw order.
5. For a region, the renderer derives the affine from three corners and writes one `matrix()` string. Meshes draw through one shared WebGL context by default, and fall back to canvas2d.

```sh
npm i @rig-c/play
```

## Key concepts

- **Model document**: `skeleton.model.json` (spec `rigc-compiled/3`). It holds the skeleton, animations and region placement.
- **Region attachment**: a rigid part, drawn as an `<img>` with a CSS matrix.
- **Mesh attachment**: a deforming part, drawn on its own small canvas sized to its world bounds.
- **Render mode**: `dom` (the default) or `canvas`.
- **Mesh backend**: `webgl` (the default since 1.9) or `canvas2d`.
- **Dirty-skip**: a mesh whose vertices match its last raster reuses that raster.
- **Attachment set**: a named swap of slot attachments, declared in `sets.json`.

## Go deeper

- [Try it live](/examples/#2-play-it-live): the published player running the 20 Family rigs on this site, with bone and mesh overlays

- [README: Install](https://github.com/rig-c/play#install)
- [README: A minimal page](https://github.com/rig-c/play#a-minimal-page)
- [README: Drawing your own frames](https://github.com/rig-c/play#drawing-your-own-frames)
- [README: Runtime knobs and what they cost](https://github.com/rig-c/play#runtime-knobs-and-what-they-cost)
- [README: Benchmark](https://github.com/rig-c/play#benchmark-dom-canvas-and-official-webgl)
- [README: How it works](https://github.com/rig-c/play#how-it-works)
- [README: License](https://github.com/rig-c/play#license) and [NOTICE.md](https://github.com/rig-c/play/blob/main/NOTICE.md)
- [CHANGELOG](https://github.com/rig-c/play/blob/main/CHANGELOG.md)
- [npm: @rig-c/play](https://www.npmjs.com/package/@rig-c/play)

<!-- SOURCES (not published)
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
