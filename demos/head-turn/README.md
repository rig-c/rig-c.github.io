# Depth-driven 2.5D head and body turn (`demos/head-turn/`)

This demo runs a compiled 2.5D character rig (`skeleton.model.json` + `skeleton.png`) built from a single front-facing character painting (`look.png`) and its confirmed grayscale depth atlas (`depth.jpg`) using only the published `@rig-c/{parts,pose,play,pixi}` and `rig-c` npm packages.

The earlier 224k-triangle standalone PixiJS mesh prototype is preserved side-by-side at [`/demos/head-turn/prototype/`](./prototype/) for direct visual comparison.

---

## Published package stack

Every build and runtime dependency is installed from the public npm registry (`https://registry.npmjs.org/`) and pinned with its exact version and tarball `sha512` integrity in [`bundle-manifest.json`](./bundle-manifest.json) and [`package-manifest.json`](./package-manifest.json):

| Package | Version | Role |
| --- | --- | --- |
| `@rig-c/parts` | `1.71.1` | Slices per-part depth sheets from `depth.jpg`, promotes `face` (`head`) and `topwear` (`chest`) to `13×16` depth-sampled surface grids (`360` triangles each), and emits the 2.5D `turn`, `tilt`, and `body_turn` animations and `yaw` / `pitch` / `body_yaw_dial` sliders |
| `@rig-c/pose` | `1.4.0` | Cleans and retargets the 4-way sign-test pose sequence (`pose#455`, 25 frames at 24 fps) onto the rig's `yaw`, `pitch`, and `body_yaw_dial` sliders as the `"clip"` animation |
| `rig-c` | `2.79.0` | Gates (`--profile rig-play`) and compiles `rig.json` + `motion.json` into `skeleton.model.json`, `skeleton.json`, `skeleton.atlas`, and polygon-packed `skeleton.png`, and provides `readModel` in the browser |
| `@rig-c/play` | `1.21.0` | Loads `skeleton.model.json` + `skeleton.png` (`loadModel`) and steps the runtime pose and animation mixer (`RigPlayer`) |
| `@rig-c/pixi` | `0.1.5` | Renders the posed `RigPlayer` frame onto a PixiJS v8 `Container` (`PixiRig`) |
| `pixi.js` | `8.22.0` | Hardware-accelerated `WebGLRenderer` host |

---

## What it is built from

1. **Source art and confirmed depth atlas**
   - Painting: [`bundle/look.png`](./bundle/look.png)
   - Confirmed depth atlas: [`bundle/depth.jpg`](./bundle/depth.jpg) (`1284×1289`, SHA-256 `c814960c7e40dd1d5573a5e6d6e5d97eefeb309d015dea924359dc87f8e998a0`, white = near, `zScale = 109.86819166092819`)
2. **2.5D head and body turn configuration (`@rig-c/parts@1.71.1`)**
   - `config.turn`:
     - `pivot: 55`, `counter: 0.1`, `grid: [13, 16]`
     - Head roles: `face: "surface"` (`face_surface` under `faceshift`), `hair_back: "rear"`, `hairpin: "rear"` (`rear_shift`), and facial/hair features (`ear_r`, `ear_l`, `nose`, `mouth`, `eyewhite_r`, `eyewhite_l`, `iris_r`, `iris_l`, `lash_r`, `lash_l`, `brow_l`, `brow_r`, `hair_front`) as `"unit"`
   - `config.turn.body`:
     - `pivot: 55`, `counter: 0.1`, `grid: [13, 16]`
     - Body roles: `topwear: "surface"` (`topwear_surface` under `bodyshift`), `collar_back: "rear"` (`body_rear_shift`)
   - **No rigid 2D spin (`narrowing: false`)**:
     - `rig.json` generates `face` and `topwear` with `generator: { "kind": "grid", "cols": 13, "rows": 16, "depth": true }`.
     - `motion.json` keys `faceshift`, `rear_shift`, `face_surface`, `turn_units`, `bodyshift`, `body_rear_shift`, and `topwear_surface` exclusively via `derive: { kind: "yaw" | "pitch", degrees, depth, narrowing: false }` and surface `deform` via `transform: { kind: "yaw" | "pitch", degrees, depth: true, narrowing: false }`.
     - In the compiled `skeleton.json` / `skeleton.model.json`, `animations.turn`, `animations.tilt`, and `animations.body_turn` carry only translation (`translatex` / `translatey`) and per-vertex `deform` offsets—zero `rotate` timelines and zero `scalex` narrowing timelines.
3. **4-way sign-test pose clip (`@rig-c/pose@1.4.0`)**
   - 25 frames at 24 fps (`1.000 s` duration):
     - Frames `0..4`: neutral (`yaw = 0°`, `pitch = 0°`, `body = 0°`)
     - Frames `5..9`: viewer-left turn (`yaw_dial = +12°`, `body_yaw_dial = +15°`)
     - Frames `10..14`: viewer-right turn (`yaw_dial = -12°`, `body_yaw_dial = -15°`)
     - Frames `15..19`: upward pitch (`pitch_dial = -9°`)
     - Frames `20..24`: downward pitch (`pitch_dial = +9°`)

---

## Playback modes

- **`pointer` (default, or `?mode=pointer`)**:
  - Reads the slider constraints (`yaw_dial`, `pitch_dial`, `roll_dial`, `body_yaw_dial`, `gaze_x_dial`, `gaze_y_dial`) from `skeleton.model.json` via `rig-c/core`'s `readModel`.
  - Steps an analytical critically damped 2D spring (`HEAD_SPRING_OMEGA0 = 20 rad/s`) toward the normalized pointer offset `(fx, fy)` and writes the dial bone rotations through `rig.player.adjust`.
  - Pointer right (`fx > 0`) turns the face and torso toward viewer-right; pointer up (`fy > 0`) turns the face up.
- **`clip` (`?mode=clip`)**:
  - Detaches the pointer `BoneAdjust` callback and plays the `@rig-c/pose`-retargeted `"clip"` animation in a loop via `@rig-c/play` (`rig.play("clip", { loop: true })`), stepping through the `neutral → left → right → up → down` segments in order.

---

## How to rebuild from scratch

1. **Install the exact published packages in a clean directory**:
   ```bash
   mkdir -p build-env && cd build-env
   npm init -y
   PLAYWRIGHT_SKIP_BROWSER_GC=1 npm install --no-save \
     @rig-c/parts@1.71.1 \
     @rig-c/pose@1.4.0 \
     @rig-c/play@1.21.0 \
     @rig-c/pixi@0.1.5 \
     rig-c@2.79.0 \
     pixi.js@8.22.0
   ```
2. **Reassemble the approved source layers using `@rig-c/parts@1.71.1` with the turn roles in the assemble config**:
   - Do not reuse PNGs assembled by an older version: moving head parts must keep their own fringe and seam colours.
   - Then run `@rig-c/parts` (`rigStage`) on the cut parts + depth sheets cropped from `depth.jpg`:
   - Configure `config.turn` (head) and `config.turn.body` (torso `topwear` + `collar_back`) with `pivot: 55`, `counter: 0.1`, `grid: [13, 16]`, and `zScale: 109.86819166092819`.
   - Emit `rig-out/rig.json`, `rig-out/motion.json`, `rig-out/images/`, `rig-out/depth_sheets.json`, and `rig-out/mesh_report.json`.
3. **Clean and retarget the 4-way sign-test pose clip with `@rig-c/pose`**:
   ```bash
   ./node_modules/.bin/rig-pose clean \
     --pose sign-pose.json \
     --out sign-pose.clean.json \
     --legs 1 --rest 1 --hold off

   ./node_modules/.bin/rig-pose retarget \
     --rig rig-out \
     --map map.json \
     --sequence sign-pose.clean.json \
     --out rig-out/motion.json \
     --animation clip \
     --bends clamp \
     --profile rig-play
   ```
4. **Compile and gate the runtime bundle with `rig-c`**:
   ```bash
   ./node_modules/.bin/rigc build \
     --rig rig-out/rig.json \
     --motion rig-out/motion.json \
     --out built \
     --profile rig-play \
     --pack --page-edges free --pack-shape polygon
   ```
5. **Bundle the browser runtime exports (`runtime.js`)**:
   ```bash
   bun build runtime-entry.ts \
     --target browser --format esm --minify \
     --outfile demos/head-turn/bundle/runtime.js
   ```
6. **Copy `built/skeleton.{model.json,json,atlas,png}` into `demos/head-turn/bundle/` and verify**:
   ```bash
   bun run build
   bun run verify
   ```

## Page physics environment

Immediately after creating its `PixiRig`, the page calls:

```js
rig.environment({ wind: [0, 0], gravity: [0, 1] });
```

This environment belongs to that player and persists across pointer/clip changes and seeks. Wind is zero; gravity uses the runtime axes (x right, y down). Authored physics response strengths remain in the rig. No global runtime default is changed.
