# Depth-driven 2.5D head and body turn (`demos/head-turn/bundle/`)

This directory holds the compiled runtime assets for [`/demos/head-turn/`](../):

- `skeleton.model.json`, `skeleton.json`, `skeleton.atlas`, `skeleton.png` — compiled 2.5D head and body turn rig produced by `@rig-c/parts@1.75.0`, `@rig-c/pose@1.4.0`, and `rig-c@2.79.0` (`--profile rig-play --pack --page-edges free --pack-shape polygon`).
- `runtime.js` — browser ESM bundle of the published runtime packages (`@rig-c/play@1.21.0`, `@rig-c/pixi@0.1.5`, `rig-c@2.79.0`, `pixi.js@8.22.0`).
- `app.js`, `index.html` — consumer page driving `pointer` mode (critically damped spring on `yaw_dial`, `pitch_dial`, `body_yaw_dial`, `gaze_x_dial`, `gaze_y_dial`) and `clip` mode (`@rig-c/pose` 4-way sign-test clip played by `@rig-c/play` and rendered on WebGL via `@rig-c/pixi`).
- `look.png`, `depth.jpg` — the source character painting and confirmed grayscale depth atlas (`1284×1289`, SHA-256 `c814960c7e40dd1d5573a5e6d6e5d97eefeb309d015dea924359dc87f8e998a0`).
- `THIRD_PARTY_LICENSES.txt` — third-party licence notices.

See [`../README.md`](../README.md), [`../bundle-manifest.json`](../bundle-manifest.json), and [`../package-manifest.json`](../package-manifest.json) for full package provenance (`name@version` + npm tarball `sha512` integrity) and step-by-step rebuild instructions.

The page sets its own player environment: `rig.environment({ wind: [0, 0], gravity: [0, 1] })`. Reassemble the approved source layers with turn roles before rig generation; do not reuse legacy assembled PNGs.

Weighted `hair_back`, `hair_front`, and `hairpin` use their own depth sheets with the `surface` role. The neck uses the `full:neck` drawing and one `neck_part` segment under `chest`. It is a body `unit` at scalar depth `31.7338`, with no head turn role or own depth sheet. Ears retain their order between back hair and face; `config.turn.unitDepths` remains `{"ear_r": -7.0432, "ear_l": -7.0432}`.

The full-source neck removes the garment collar pixels embedded in the former head-source cut. Painted skin shading and collar outlines remain; no manual art cleanup is applied.
