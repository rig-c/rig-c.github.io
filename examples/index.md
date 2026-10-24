# Examples

See what the rigs look like, play one in your browser, then open the files and commands that rebuild it.

[`rig-c/examples`](https://github.com/rig-c/examples) holds the gate corpus and toolchain trials, including failures.

## 1. See the result

<figure class="figure-media">
  <div class="media">
    <video data-loop="the Family preview" controls muted loop playsinline preload="metadata" poster="/assets/family-preview-poster.jpg" width="960" height="832" aria-label="Recorded video: five rigged characters breathing and swaying in a light breeze">
      <source src="/assets/family-preview.mp4" type="video/mp4">
      <img src="/assets/family-preview-poster.jpg" alt="Five rigged characters standing side by side" width="960" height="832">
    </video>
  </div>
  <figcaption><span class="media-kind">Recorded video</span> The five accepted Family rigs, rendered from their real models with breathing, blinking and a constant light breeze — from <a href="https://github.com/rig-c/examples/tree/main/family">rig-c/examples</a> (<a href="https://github.com/rig-c/examples/blob/main/family/scripts/render-readme-preview.mjs">render recipe</a>).</figcaption>
</figure>

## 2. Play it live

The live demo on https://rig-c.org/examples/ plays the 20 Family rigs (5 characters × 4 outfits) in the browser with @rig-c/play, with play/pause and bone and mesh overlays. It needs JavaScript.

The live demo loads the published [`@rig-c/play`](/docs/play/) 1.12.0 from jsDelivr and the Family models from rig-c/examples at one pinned commit. Each rig plays its own `idle` — the only motion these models carry — with its physics; the blink and the breeze in the recording above come from the Family viewer, not from the models.

## 3. Open the sources and rebuild

### The Family suite — 5 characters × 4 outfits (20 rigs, 396 parts)

[`rig-c/examples/family`](https://github.com/rig-c/examples/tree/main/family) starts from one wide group illustration (`1024×571` RGBA) upscaled with `4x-AnimeSharp` to `4096×2284`, decomposed with See-through in two passes (`full` + `head`), and rigged per character in four outfit sets (`office`, `homewear`, `swimwear`, `uniform`). Each rig's config pins its declared mesh and binding repairs (`declared-repairs.json`) by hash. The live demo links each rig's `config.json` and built model under the player.

From the repository root (Bun and Node on `PATH`), this rebuilds all 20 rigs from their configs and checks them against the stored outputs:

```sh
bun install --cwd family/tools/outline-field-islands --frozen-lockfile
node family/tools/verify-reproducibility.mjs --out /tmp/new-repro-evidence
bun family/tools/verify-accepted.mjs --out /tmp/new-family-evidence
```

### Standalone character inputs

| Key | Seed | Checkpoint | See-through Layers | Purpose |
| --- | --- | --- | --- | --- |
| `demo` | `71006` (+ hand detailer) | Hassaku XL (Illustrious) v1.3 Style A | 29 full + 29 head | The primary `@rig-c/parts` README character: twin tails, bow, layered skirt, arms held clear of the body. |
| `scarf` | `72004` | Pony Diffusion V6 XL | 29 full + 29 head | A very long red scarf with both ends hanging free, knit sweater and pleated skirt: the hanging element the others lack. |
| `three-quarter` | `250011` | Hassaku XL (Illustrious) v1.3 Style A | 29 full + 29 head | Head turned toward image left and tilted for head-frame turn measurements. |
| `wind` | `372108` | Hassaku XL (Illustrious) v1.3 Style A | 29 full + 29 head | Very long ribbon-wrapped twin tails and a wide two-layer skirt, painted for wind interaction. |
| `reference-sample` | `70011` | Pony Diffusion V6 XL | 29 full + 29 head | Regression fixture held to the reference implementation's outputs. |
| `reference-demo` | `71004` | Pony Diffusion V6 XL | 29 full + 29 head | Regression fixture held to the reference implementation's outputs. |

These are inputs — painting, See-through inputs and layers; [`@rig-c/parts`](/docs/parts/) keeps the configs and expected outputs under its own `examples/<key>/`.

### `rig-c/trailer` — the 12-second short

[`rig-c/trailer`](https://github.com/rig-c/trailer) is the loop on the landing page: a character on a swing breathes, tilts her head, smiles, kicks her legs, hops and waves, her twin tails following on physics chains — 240 frames at 20 fps, rebuilt from one painting, two See-through layer sets and agent-authored configs:

```sh
git clone https://github.com/rig-c/trailer && cd trailer
pip install -r requirements.txt
./build.sh
```

Licences for all of these: [Licensing](/docs/licensing/).
