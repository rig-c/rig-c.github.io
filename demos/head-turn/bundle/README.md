# Depth-driven 2.5D head and body turn (`demos/head-turn/bundle/`)

This directory holds the compiled runtime assets for [`/demos/head-turn/`](../):

- `skeleton.model.json`, `skeleton.json`, `skeleton.atlas`, `skeleton.png` — compiled 2.5D head and body turn rig produced by `@rig-c/parts@1.71.0`, `@rig-c/pose@1.4.0`, and `rig-c@2.79.0` (`--profile rig-play --pack --page-edges free --pack-shape polygon`).
- `runtime.js` — browser ESM bundle of the published runtime packages (`@rig-c/play@1.20.0`, `@rig-c/pixi@0.1.5`, `rig-c@2.79.0`, `pixi.js@8.22.0`).
- `app.js`, `index.html` — consumer page driving `pointer` mode (critically damped spring on `yaw_dial`, `pitch_dial`, `body_yaw_dial`, `gaze_x_dial`, `gaze_y_dial`) and `clip` mode (`@rig-c/pose` 4-way sign-test clip played by `@rig-c/play` and rendered on WebGL via `@rig-c/pixi`).
- `look.png`, `depth.jpg` — the source character painting and confirmed grayscale depth atlas (`1284×1289`, SHA-256 `c814960c7e40dd1d5573a5e6d6e5d97eefeb309d015dea924359dc87f8e998a0`).
- `THIRD_PARTY_LICENSES.txt` — third-party licence notices.

See [`../README.md`](../README.md), [`../bundle-manifest.json`](../bundle-manifest.json), and [`../package-manifest.json`](../package-manifest.json) for full package provenance (`name@version` + npm tarball `sha512` integrity) and step-by-step rebuild instructions.
