---
navLabel: Examples
title: rig-c Examples — See the Rigs, Play Them Live, Rebuild Them
description: The 20 Family rigs (5 characters × 4 outfits) as a recorded preview and live in your browser with @rig-c/play, plus the inputs, configs and commands that rebuild them.
keywords: rig-c examples, live demo, @rig-c/play, examples, rig-c trailer, reproducible rigging, Spine 4.3 examples
repoUrl: https://github.com/rig-c/examples
summaryForLlms: Examples in three steps: a recorded preview of the Family rigs, a live in-browser demo that plays all 20 Family rigs (5 characters × 4 outfits) with the published @rig-c/play, then the sources and rebuild commands (rig-c/examples family suite, six standalone input sets, rig-c/trailer).
---
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

{{live-demo}}

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

## Preview: depth-driven head turn

<figure class="head-turn-feature">
  <a href="/demos/head-turn/" aria-label="Open the interactive head-turn demo"><img src="/assets/head-turn-yaw15.png" alt="The head-turn demo character rendered at a positive 15-degree yaw" width="1280" height="900" loading="lazy"></a>
  <figcaption>Depth-driven head turn: a preview of an upcoming @rig-c/parts feature; the producer is in progress</figcaption>
</figure>

[Open the interactive demo](/demos/head-turn/) (WebGL required) and move the pointer across the character. Nothing in the picture rotates flat. The head turns because every part shifts by its own depth.

**How it is made.** It starts from two images: the painting the look example already rigs, and a depth map estimated from that same painting. No new art is drawn.

- **Depth becomes motion.** Each part is covered by a dense mesh, about 224,000 triangles in all. When the view turns, every vertex moves by its depth times the sine of the view angle. Near points shift further than far ones, and that is the parallax your eye reads as volume.
- **The head swings from the neck.** On top of the depth motion, the whole head moves as if on a lever 55 units long from the neck (the *Pivot depth* slider, 0–100). That is why the face follows the pointer instead of only shading in place.
- **Small features move as one piece.** Eyes, nose and ears each take a single depth value, so they slide without warping. The eyes also look at the pointer, inside the eyelids' outline.
- **Hair keeps its layers.** The fringe moves with the face, and the back hair shifts slightly the other way (10 % by default) so the head reads as having a back.

These rules were settled over four rounds of judging the motion by eye. Next is the version inside [`@rig-c/parts`](/docs/parts/): give it a depth map with the layers, and the rig it builds carries these deformations as dials (a yaw and pitch you set, or drive from the pointer). Today the demo is a static preview, and no published package ships it yet.

<!-- SOURCES (not published)
- family preview: examples family/README.md "움직이는 미리보기" (5 accepted models, breathing, blink, breeze 4, render-readme-preview.mjs)
- 20 rigs / 396 part rows / outfits / config paths / repro commands: family/README.md §현재 승인된 입력과 재검증
- every model carries one animation, idle; stage 800x2284; 2 files per rig; jsDelivr CORS: demo survey of all 20 models at c239b09
- blink from the viewer's adjust, not the model: family/viewer/index.html lines 545-568
- family-preview.mp4: encoded by scripts/encode-video.sh from examples@c239b09 family/docs/family-preview.webp (67 frames, 3.333 s per family-preview.json) at 20.1 fps over the page --bg #070b18; loop seam 0.960 vs max step 1.324 (scripts/loop-seam.py)
- standalone table: examples README Layout table; trailer: rig-c/trailer README
- head-turn preview: demos/head-turn (approved bundle, tree 46477ab4), poster assets/head-turn-yaw15.png, rig-c.github.io#79
- how it is made: rig-c/parts#763 accepted v4 behaviour + plan comment 6406395097 (delta = Z*sin(view), pivot 55 / 0..100, eye/nose/ear units, gaze in aperture, fringe on face, rear counter 10%); 224,144 triangles from the bundle README/handoff; depth map estimated from the look atlas; dials-not-pointer ruling #763 comment 6406405223
-->
