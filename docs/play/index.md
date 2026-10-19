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

- [README: Install](https://github.com/rig-c/play#install)
- [README: A minimal page](https://github.com/rig-c/play#a-minimal-page)
- [README: Drawing your own frames](https://github.com/rig-c/play#drawing-your-own-frames)
- [README: Runtime knobs and what they cost](https://github.com/rig-c/play#runtime-knobs-and-what-they-cost)
- [README: Benchmark](https://github.com/rig-c/play#benchmark-dom-canvas-and-official-webgl)
- [README: How it works](https://github.com/rig-c/play#how-it-works)
- [README: License](https://github.com/rig-c/play#license) and [NOTICE.md](https://github.com/rig-c/play/blob/main/NOTICE.md)
- [CHANGELOG](https://github.com/rig-c/play/blob/main/CHANGELOG.md)
- [npm: @rig-c/play](https://www.npmjs.com/package/@rig-c/play)
