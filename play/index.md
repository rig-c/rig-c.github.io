# @rig-c/play (`rig-play`)

**Plays the compiled model document [`rig-c`](/core/) builds (`skeleton.model.json`) in the browser — as plain DOM elements or one canvas, with no Spine runtime.**

- **npm package**: `@rig-c/play` (aliases: `rig-play`, `spine-html`), latest `1.12.0`
- **Repository**: <https://github.com/rig-c/play>
- **License**: MIT (links nothing from Esoteric Software)

## Two Render Modes

1. **`mode: 'dom'` (default)**: Draws each rigid slot as an absolutely-positioned `<img>` posed with a single CSS `transform: matrix()` write per frame, and deforms weighted meshes on small per-part canvases backed by a shared WebGL context (`meshBackend: 'webgl'` default since 1.9). Unchanged or held meshes skip rasterization (`0 triangles`, `0 draw calls`).
2. **`mode: 'canvas'`**: Draws the entire skeleton frame into **one `<canvas>`** per player through the shared WebGL context, with vertex-color tints, blend modes, and CPU polygon clipping. Swappable in place via `player.mode = 'canvas'`.

Both modes share at most **one WebGL context across the entire page**, avoiding the browser's 16-context WebGL eviction limit when mounting 20+ independent character players on one page.

## Minimal Usage

```sh
npm install @rig-c/play
```

```ts
import { loadModel, RigPlayer } from '@rig-c/play';

const assets = await loadModel({
  modelUrl: '/rigs/character/skeleton.model.json',
});

const player = new RigPlayer({
  container: document.getElementById('stage')!,
  assets,
  mode: 'dom', // or 'canvas'
});

player.play('idle', { loop: true });
```

## Measured Performance (Apple M4 Chromium, `1280×720`)

Standing comparison against `@esotericsoftware/spine-webgl 4.3.13` (600 measured frames after 100 warm-up frames):

| Scene | `dom` Mode | `canvas` Mode | `official` (batched / per-cell) | Key Observation |
| --- | --- | --- | --- | --- |
| **1 meshed rig animating** | `59.99 fps` (0.17 ms pose / 0.16 ms render) | `59.99 fps` (0.23 ms / 0.18 ms) | `60.00 fps` (0.05 ms / 0.13 ms) | All three hold 60 fps under 0.45 ms/frame. |
| **16 meshed rigs animating** | `60.00 fps` (0.66 ms / 0.74 ms) | `59.87 fps` (0.84 ms / 0.50 ms) | `60.00 fps` (0.21 ms / 0.30 ms) | Up to 16 animating meshed rigs hold 60 fps across all modes. |
| **64 held poses (static)** | `59.99 fps` (`0 triangles`) | `60.10 fps` (`0 triangles`) | `60.10 fps` (`5,632 triangles`) | `dom` and `canvas` dirty-skip unchanged rasters completely. |
| **64 rigid rigs animating** | `59.89 fps` (`0 triangles`, CSS `matrix()`) | `42.00 fps` (64 canvas blits) | `60.00 fps` (1 batched draw call) | `dom` holds 60 fps on 64 rigid skeletons via pure CSS transforms. |
| **20 independent small players** | `60.00 fps` (**20/20 drawn**, 1 context) | `59.99 fps` (**20/20 drawn**, 1 context) | `60.00 fps` (**16/20 drawn**, 4 evicted) | Official loses 4 players to the browser's 16 WebGL context limit; `@rig-c/play` draws all 20. |
