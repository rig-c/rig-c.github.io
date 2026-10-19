# @rig-c/play

<p class="mod-role">The browser player for the model rigc writes — no Spine runtime, rigid parts as plain DOM elements or the whole rig in one canvas.</p>

The live player on this page plays Character 1 with two motions (idle and the cup lift from the Pose page), with play/pause, DOM or canvas mode, and bone and mesh overlays. It needs JavaScript.

<p class="mod-skip">Skip to <a href="#a-minimal-page">A minimal page</a> · <a href="#install">Install</a> · <a href="#inputs-and-outputs">Inputs and outputs</a> · <a href="#limits">Limits</a> · <a href="#go-deeper">Docs</a></p>

*This page follows Character 1 from the Family set: here it is played. Every module works on its own; this order is one path, not a requirement.*

A rigged character usually means a canvas runtime that rasterizes everything. For a rigid part, though, the bone transform is a plain affine map that CSS `matrix()` expresses exactly — so the rigid parts can live in the DOM, where the browser composites them and you can inspect and style them like any element. Play keeps that path, and adds what the DOM cannot do alone: per-part mesh canvases, `clip-path` clipping, and skipping meshes that did not move. Switch the player above to **One canvas** to see the other mode draw the same pose.

## What you just ran

The player above is the published package doing what any page does with it — nothing on this site poses the rig:

1. `loadModel()` read Character 1's `skeleton.model.json` and cut each atlas region into its own bitmap (the `.atlas` and `skeleton.json` beside it are not fetched).
2. `new RigPlayer(root, assets, { mode })` opened the motion you picked on a live track; rig-c's core, bundled in the package, poses bones, constraints, physics and draw order on the CPU, one `frame(dt)` at a time.
3. Each frame became a `PosedFrame` — region corners or mesh vertices, UVs, tint and clip, in draw order. A region is written as one `matrix()` string; meshes draw through one shared WebGL context and fall back to canvas2d (the status line says which ran).
4. **Bones** and **Mesh** draw from the player's own read-only queries, `bone(name)` and `posedFrame()`; **Pause** calls `pause()`.

`lift` is the motion the [Pose](/docs/pose/) page retargeted onto this rig; `idle` came with the rig from [Parts](/docs/parts/).

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
npm i -D rig-c    # rigc build writes the model the player loads
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
From the README's *Status* and *No counterpart in 1.0.0* (it has no limits section):
- **Status: "Production."** — 60 fps on every engine measured for the practical scenario (README §"Status").
- **Reads rigc's model only**: "a Spine export is refused by name"; `loadModel` reads a compiled model document and nothing else (README §"Why", §"No counterpart in 1.0.0").
- **Which render mode is faster where is "not measured on a device yet"**, so the default stays `dom` (README §"Status").
- **Dark/two-colour tint stays out of scope in DOM mode**; RGB tint needs reference-filter support, Safari 15+ (README §"Status").
- **Clipping caveats**: an inverse polygon matches Spine's clipper only when convex, and the cost of many `clip-path`s on real-device Safari is not measured (README §"Status").
- **No per-slot changes from code** (attachment, colour) and no `scale` on load; scaling the root element is the caller's (README §"No counterpart in 1.0.0").

## Go deeper
- [Install](https://github.com/rig-c/play#install) · [A minimal page](https://github.com/rig-c/play#a-minimal-page)
- [Status](https://github.com/rig-c/play#status)
- [Attachment sets (`sets.json`)](https://github.com/rig-c/play#attachment-sets-setsjson)
- [Runtime knobs and what they cost](https://github.com/rig-c/play#runtime-knobs-and-what-they-cost)
- [Benchmark: DOM, canvas and official WebGL](https://github.com/rig-c/play#benchmark-dom-canvas-and-official-webgl)
- [How it works](https://github.com/rig-c/play#how-it-works)
- [npm](https://www.npmjs.com/package/@rig-c/play) · [CHANGELOG](https://github.com/rig-c/play/blob/main/CHANGELOG.md)
