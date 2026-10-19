# Reproducible Examples (`parts-examples` & `trailer`)

Every public rig-c showcase ships with its generated source paintings, See-through layer decompositions, agent-authored configs, and one-command deterministic rebuild scripts.

## 1. `rig-c/parts-examples` — Public Character Inputs & The 20-Rig Agent Family

Repository: <https://github.com/rig-c/parts-examples>

### Single-Character Fixtures

| Key | Seed | Checkpoint | See-through Layers | Purpose |
| --- | --- | --- | --- | --- |
| `demo` | `71006` (+ hand detailer) | Hassaku XL (Illustrious) v1.3 Style A | 29 full + 29 head | The primary `@rig-c/parts` README character: twin tails, bow, layered skirt, arms held clear of the body. |
| `scarf` | `72004` | Pony Diffusion V6 XL | 29 full + 29 head | A very long red scarf with both ends hanging free, knit sweater and pleated skirt: the hanging element the others lack. |
| `three-quarter` | `250011` | Hassaku XL (Illustrious) v1.3 Style A | 29 full + 29 head | Head turned toward image left and tilted for head-frame turn measurements. |
| `wind` | `372108` | Hassaku XL (Illustrious) v1.3 Style A | 29 full + 29 head | Very long ribbon-wrapped twin tails and a wide two-layer skirt, painted for wind interaction. |
| `reference-sample` | `70011` | Pony Diffusion V6 XL | 29 full + 29 head | Regression fixture held to the reference implementation's outputs. |
| `reference-demo` | `71004` | Pony Diffusion V6 XL | 29 full + 29 head | Regression fixture held to the reference implementation's outputs. |

### `family/` — 5 Characters × 4 Outfits (20 Rigs, 396 Parts)

Starting from one wide group illustration (`1024×571` RGBA) upscaled with `4x-AnimeSharp` to `4096×2284`, the `family/` suite overcomes See-through's fixed `1024×1024` resolution limit by combining 2-pass (`full` + `head`) decomposition, visible-surface 4x detail injection, and hash-bound declarative mesh/binding repair recipes (`declared-repairs.json`) across 5 characters and 4 outfit sets (`office`, `homewear`, `swimwear`, `uniform`).

```sh
# Deterministic rebuild & compiler gate across all 20 rigs (396 parts)
bun install --cwd family/tools/outline-field-islands --frozen-lockfile
node family/tools/verify-reproducibility.mjs --out /tmp/new-repro-evidence
bun family/tools/verify-accepted.mjs --out /tmp/new-family-evidence
```

## 2. `rig-c/trailer` — 12-Second Reproducible Animated Short

Repository: <https://github.com/rig-c/trailer>

A character sitting on a swing under a night sky breathes, tilts her head, smiles, kicks her legs, hops, and waves, her twin tails following on physics chains — rebuilt byte-for-byte (240 frames at 20 fps, `960×540` WebP + `1920×1080` PNG frames) from one painting, two See-through layer sets, and agent-authored configs:

```sh
git clone https://github.com/rig-c/trailer && cd trailer
pip install -r requirements.txt
./build.sh
```
