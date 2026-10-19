---
navLabel: Adapters
title: "rig-c engine adapters: PixiJS, Phaser and Three.js"
description: Play a rig that rigc built inside PixiJS 8, Phaser 4.2+ or Three.js, posed by @rig-c/play and drawn by the host's own renderer. No Spine runtime.
summaryForLlms: "@rig-c/pixi, @rig-c/phaser and @rig-c/three play rigc's skeleton.model.json inside PixiJS, Phaser or Three.js scenes, posed through @rig-c/play and drawn with each host's native objects, without a Spine runtime."
packageName: "@rig-c/pixi, @rig-c/phaser, @rig-c/three"
packageVersion: "0.1.1, 0.1.1, 0.1.1"
repoUrl: https://github.com/rig-c/adapters
npmUrl: https://www.npmjs.com/package/@rig-c/pixi
---
# Engine adapters

The adapters put a rigc-built rig inside the engine or renderer your game already uses. [Play](/docs/play/) computes the pose; the host draws it with its own objects.

## What it is

Three packages, each versioned on its own, all at 0.1.1 with 0.x APIs:

- `@rig-c/pixi`: a PixiJS 8 adapter.
- `@rig-c/phaser`: a Phaser 4.2+ adapter for WebGL scenes.
- `@rig-c/three`: a native Three.js 0.186.1 renderer and live `Group`.

Each one reads the model document `rigc build` writes, `skeleton.model.json`, through `@rig-c/play`.

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

<!-- SOURCES (not published)
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
-->
