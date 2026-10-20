# Engine adapters

The adapters put a rigc-built rig inside the engine or renderer your game already uses. [Play](/docs/play/) computes the pose; the host draws it with its own objects.

## What it is

Three packages, each versioned on its own, all at 0.1.1 with 0.x APIs:

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

## Key concepts

- **Host**: the engine or renderer an adapter targets. Each host lives in `packages/<host>`.
- **Model document**: `skeleton.model.json`, the source the adapters read. Spine is one export of it.
- **`PosedFrame`**: the per-frame record `@rig-c/play` produces and every renderer draws.
- **`ModelAssets`**: one `loadModel` result, which several rigs can share.
- **Parity**: an adapter plays the same pose for the same time as `@rig-c/play`, held to the player's output by a test.

## Go deeper

- [README: Why this exists](https://github.com/rig-c/adapters#why-this-exists)
- [README: What an adapter promises](https://github.com/rig-c/adapters#what-an-adapter-promises)
- [packages/pixi README](https://github.com/rig-c/adapters/tree/main/packages/pixi#readme)
- [packages/phaser README](https://github.com/rig-c/adapters/tree/main/packages/phaser#readme) (renderer contract)
- [packages/three README](https://github.com/rig-c/adapters/tree/main/packages/three#readme) (native drawing and scene placement)
- [docs/ADDING_A_HOST.md](https://github.com/rig-c/adapters/blob/main/docs/ADDING_A_HOST.md)
- Changelogs: [pixi](https://github.com/rig-c/adapters/blob/main/packages/pixi/CHANGELOG.md), [phaser](https://github.com/rig-c/adapters/blob/main/packages/phaser/CHANGELOG.md), [three](https://github.com/rig-c/adapters/blob/main/packages/three/CHANGELOG.md)
- npm: [@rig-c/pixi](https://www.npmjs.com/package/@rig-c/pixi), [@rig-c/phaser](https://www.npmjs.com/package/@rig-c/phaser), [@rig-c/three](https://www.npmjs.com/package/@rig-c/three)
