# @rig-c/adapters — PixiJS, Phaser & Three.js

**Play a rig that [`rig-c`](/core/) built inside the engine or renderer your game already uses — with no Spine runtime.**

- **Repository**: <https://github.com/rig-c/adapters>
- **License**: MIT

| Package | Version | Target Host | Exports |
| --- | --- | --- | --- |
| `@rig-c/pixi` | `0.1.1` | PixiJS 8 | `PixiRig`, `PixiRenderer` |
| `@rig-c/phaser` | `0.1.1` | Phaser 4.2+ | `PhaserRig`, `PhaserRenderer` (shared ref-counted page textures) |
| `@rig-c/three` | `0.1.1` | Three.js 0.186.1+ | Native Three.js renderer and live `Group` (orthographic & perspective) |

## PixiJS 8 Usage (`@rig-c/pixi`)

```sh
npm install @rig-c/pixi pixi.js @rig-c/play
```

```ts
import { loadModel } from '@rig-c/play';
import { Application } from 'pixi.js';
import { PixiRig } from '@rig-c/pixi';

const app = new Application();
await app.init({ width: 800, height: 600 });
document.body.appendChild(app.canvas);

const assets = await loadModel({ modelUrl: '/rigs/walk/skeleton.model.json' });
const rig = new PixiRig(assets, { ticker: app.ticker });
rig.play('walk');
app.stage.addChild(rig);
// On removal: app.stage.removeChild(rig); rig.destroy();
```

## Phaser 4 Usage (`@rig-c/phaser`)

```sh
npm install @rig-c/phaser phaser @rig-c/play
```

```ts
import { loadModel } from '@rig-c/play';
import { PhaserRig } from '@rig-c/phaser';

const assets = await loadModel({
  modelUrl: '/rigs/walk/skeleton.model.json',
  regions: 'none',
});
const rig = new PhaserRig(scene, assets);
rig.setPosition(400, 480);
rig.play('walk');
scene.add.existing(rig);
// On removal: rig.destroy(); assets.dispose();
```

## Three.js Usage (`@rig-c/three`)

```sh
npm install @rig-c/three three @rig-c/play
```

## What Every Adapter Guarantees

1. **Pose parity with `@rig-c/play`**: Produces the exact same pose for the same time, verified in CI across Chromium and WebKit against `@rig-c/play`'s reference output.
2. **Unmodified `rigc build` inputs**: Reads `skeleton.model.json` and its atlas pages directly as emitted by `rigc build`.
3. **Zero Spine runtime**: Links no Esoteric Software code.
