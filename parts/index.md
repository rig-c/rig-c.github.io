# @rig-c/parts (`rig-parts`)

**AI-authored 2D character rigs from one anime painting, verified before they are written.**

- **npm package**: `@rig-c/parts` (aliases: `rig-parts`, `spine-parts`), latest `1.38.0`
- **CLI executable**: `rig-parts`
- **Repository**: <https://github.com/rig-c/parts>
- **License**: MIT

`@rig-c/parts` takes a single character painting and the layers [See-through](https://github.com/shitagaki-lab/see-through) decomposed it into, merges them into measured rig-space parts, authors weighted meshes, bone chains, physics constraints, and a looping idle in [`rig-c`](/core/)'s spec, and hands that spec to `rig-c` to compile, gate, pack, render, and check.

## Install

```sh
bun add -d @rig-c/parts rig-c
bunx rig-parts --help
```

## What It Takes In

1. **One character painting (`painting.png`)** — Front view, full body head-to-toe, arms clear of the body, hands apart and open, legs with a clear gap, on a plain white background. Checked against body-18 joints before See-through runs via `rig-parts painting`.
2. **Two See-through layer sets (`full` and `head`)** — One run on the whole figure (white-padded to a square) and one run on a square head crop so eye and face layers separate cleanly. Accepts either the ComfyUI wrapper directory (`layers.json` + `parts/<tag>.png`) or an upstream `.psd`.
3. **A character config (`config.json`)** — Declares the part merge plan, `head_box`, bones, mesh region rules, idle sines, and optional constraints. Unknown or missing fields are refused by name.

## What `rig-parts build` Emits

| Output Path under `--out` | Contents |
| --- | --- |
| `check/build/skeleton.json`, `skeleton.atlas`, `skeleton.png` | **The primary artifact** — Spine 4.3 skeleton data, compiled model (`skeleton.model.json`), and one polygon-packed free-edge atlas page, gated under `rig-play` and `spine`. |
| `parts/*.png`, `parts.json`, `recomposite_rig.png`, `recomposite_error_rig.png` | Cropped alpha-box part PNGs, provenance record per pixel, flat recomposite, and red/blue uncovered error map against the source painting. |
| `rig/` | `rig.json`, `motion.json`, `mesh_report.json`, and 4px-padded `images/` for Spine Editor import. |
| `check/` | Gate verdicts verbatim, rendered frames, `geometry.json`, `contact.png`, `motion_heat.png`, and `check.json` (including `SEAM_OVER_MOTION`, `CLOTH_SETTLES`, loop closure, and fold checks). |
| `idle.png`, `idle-indexed.png`, `idle.gif` | Written with `--loop`: lossless APNG exactness record, 256-color indexed APNG, and looping GIF with measured palette error. |

## Core CLI Commands

```sh
# Inspect See-through layer coverage and WARN lines
rig-parts layers <dir | layers.json | file.psd>

# Verify painting against body-18 keypoints before decomposition
rig-parts painting --source painting.png --keypoints keypoints.json

# Cut full (white-padded square) and head-crop inputs for See-through
rig-parts inputs --source painting.png --config config.json --out work

# Propose head crop box from full layers
rig-parts propose --head-box --full layers/full --canvas 1664x2432

# Propose or run the 2-pass layer merge into rig-space parts
rig-parts assemble --propose-plan --source painting.png --full layers/full --head layers/head --config config.json
rig-parts assemble --source painting.png --full layers/full --head layers/head --config config.json --out work

# Propose bones, weighted meshes, regions, and idle motion from keypoints
rig-parts propose --parts work/rig --source painting.png --out work --keypoints keypoints.json

# Run assemble -> rig -> check in one gated process
rig-parts build --config config.json --source painting.png --full layers/full --head layers/head --out out --loop --lead-in 3

# Optional ComfyUI adapters for remote GPU boxes
rig-parts comfy paint --config config.json --out paint-out --host http://127.0.0.1:8188
rig-parts comfy seethrough --image work/st_input_full.png --out layers/full --host http://127.0.0.1:8188 --offload
```
