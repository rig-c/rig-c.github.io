# @rig-c/parts

<p class="mod-role">One painting and its See-through layers in — measured parts, a drafted rig and a looping idle out.</p>

<figure class="mod-hero">
  <div class="media">
    <video data-loop="the parts loop" controls muted loop playsinline preload="metadata" poster="/assets/docs/parts-explode-poster.jpg" width="1280" height="720" aria-label="Recorded video: Character 1 assembled from her seventeen parts, dissolving into a labelled grid of those parts and back">
      <source src="/assets/docs/parts-explode.mp4" type="video/mp4">
      <img src="/assets/docs/parts-explode-poster.jpg" alt="Character 1 assembled from her seventeen parts" width="1280" height="720">
    </video>
  </div>
  <figcaption><span class="media-kind">Recorded video</span> Character 1's 17 parts from <code>out/parts/</code>. The assembled figure that opens and closes the loop is drawn at the positions <code>parts.json</code> records, in the rig's draw order; the labelled grid and the dissolves between them are this page's illustration.</figcaption>
</figure>

<p class="mod-skip">Skip to <a href="#install">Install</a> · <a href="#inputs-and-outputs">Inputs and outputs</a> · <a href="#limits">Limits</a> · <a href="#go-deeper">Docs</a></p>

*This page follows Character 1 from the Family set: here it is split into parts. Every module works on its own; this order is one path, not a requirement.*

Cutting a painted character into rig parts is slow, and the mistakes show up late: a layer holds the wrong pixels, a part leaves a hole, a chain swings a skirt about its middle. `rig-parts` measures each of these and prints the number, so an agent that cannot see the image can still tell where it went wrong. A refusal names the object, the value found and the value required; nothing is written after a red, and no value is invented where the input is silent.

## How Character 1 was made

### 1. Two See-through runs

<figure class="figure-wide">
  <img src="/assets/docs/parts-layers.jpg" alt="A sheet of every See-through layer of Character 1, each labelled with its tag, size and opaque pixel count" width="1400" height="1225" loading="lazy">
  <figcaption>The layers See-through returned — one run on the full figure, one on a square crop around the head, because a full-figure run leaves the eyes too small to separate. Each tile is labelled with its tag, size and opaque pixels.</figcaption>
</figure>

### 2. Parts, and what they miss

`assemble` merges the two runs into rig-space parts, then lays them back together and compares the result with the painting. The error map is the point of that step: it shows, in colour, the painting that no part holds.

<div class="compare cols-3">
  <figure><img src="/assets/docs/parts-painting.jpg" alt="Character 1's painting" width="315" height="900" loading="lazy"><figcaption>The painting</figcaption></figure>
  <figure><img src="/assets/docs/parts-recomposite.jpg" alt="The 17 parts laid back together" width="315" height="900" loading="lazy"><figcaption>The 17 parts, recomposited</figcaption></figure>
  <figure><img src="/assets/docs/parts-errormap.jpg" alt="Error map: the figure in grey with thin red and blue edges where the parts and the painting differ" width="315" height="900" loading="lazy"><figcaption>The error map</figcaption></figure>
</div>

<div class="compare">
  <figure><img src="/assets/docs/parts-painting-zoom.jpg" alt="Close-up of the painting: Character 1's left hand resting on her forearm" width="660" height="660" loading="lazy"><figcaption>The painting, around the resting hand</figcaption></figure>
  <figure><img src="/assets/docs/parts-errormap-zoom.jpg" alt="The same close-up on the error map: a thin red line along the hand and sleeve edge, with a few blue pixels" width="660" height="660" loading="lazy"><figcaption>The error map there: <strong>red</strong> is painting no part holds, <strong>blue</strong> is a part whose colour is more than 40 off</figcaption></figure>
</div>

For this build `parts.json` records a mean difference of 0.873 per pixel, 98.3% of pixels within 8, and 6,041 uncovered error pixels. The largest hole it lists is 834 px along the edge of `bottomwear`. A clean recomposite is what lets the rig move without showing the background through.

### 3. A drafted rig that idles

`propose` drafts bones, weighted meshes, regions and a looping idle over those parts, for a person or an agent to correct; `build` runs assemble, rig and check in one process and stops at the first refusal.

<div class="compare">
  <figure>
    <div class="media">
      <picture>
        <source srcset="/assets/docs/parts-idle.webp" type="image/webp" media="(prefers-reduced-motion: no-preference)">
        <img src="/assets/docs/parts-idle-poster.png" alt="Animation: Character 1 standing, breathing in its idle loop" width="244" height="640">
      </picture>
    </div>
    <figcaption><span class="media-kind">Animation</span> The idle, as <code>build --loop</code> wrote it: 41 frames at 12 fps, 0 to 3.33 s with both ends included. Here the same build plays the 3.33 s loop (40 frames, the 41st being where it wraps), drawn by <code>@rig-c/play</code> 1.12.0 over the page rather than by <code>rigc render</code>. With reduced motion on, the first frame stands still.</figcaption>
  </figure>
  <figure><img src="/assets/docs/parts-contact.jpg" alt="A contact sheet of the idle's 41 frames" width="401" height="775" loading="lazy"><figcaption><code>check</code>'s contact sheet of the same idle — what the measured bars read.</figcaption></figure>
</div>

The idle then goes on: [Pose](/docs/pose/) gives the same rig a recorded motion, and [Core](/docs/core/) is the compiler every one of these builds went through.

## How it works

1. **Inputs.** `inputs` cuts the two images See-through is fed: the painting on a white square, and a square crop around the head.
2. **Layers.** You run See-through by any route — a hosted demo, the upstream CLI, or ComfyUI. rig-parts reads its `.psd` or the ComfyUI wrapper form; an artist's own layered PSD works too, with no See-through step.
3. **Assemble.** The two runs merge into rig-space parts; uncovered holes are listed and the error map shows them.
4. **Propose.** Bones, meshes, regions and an idle are drafted with an overlay to correct against. It is a draft, not a step of `build`: you copy its sections into `config.json`, and LINT lines flag what still looks wrong.
5. **Build.** Assemble, rig and check in one process; compiling, gating and packing are rig-c's.

**Key terms.** *See-through layers* — the painting's decomposition, one run on the full figure and one on the head. *Parts* — the merged, measured pieces in rig space (`parts.json`). *Proposal* — the drafted bones, meshes, regions and motion, to be corrected. *Config* — `config.json`, the character's part plan, head box, bones and idle; unknown or missing fields are refused by name. *FAIL line* — a refusal that names a rule and ends with `(see rig-parts guide <RULE>)`.

## Install

```sh
npm i -D @rig-c/parts
rig-parts --help
```

Requires [Bun](https://bun.sh) 1.2 or later; rig-c comes with it as a dependency. Which Spine terms apply depends on what plays the output: see [Licensing](/docs/licensing/).

## Inputs and outputs

| In | Out |
| --- | --- |
| One character painting (`painting.png`) | `check/build/skeleton.json`, `skeleton.atlas`, `skeleton.png` — Spine 4.3 data and one packed page |
| Two See-through layer sets (`full`, `head`), as the ComfyUI wrapper form or a `.psd` | `parts/*.png`, `parts.json`, the recomposite and its error map |
| A character config (`config.json`) | `rig/rig.json`, `rig/motion.json` in rig-c's spec |
| Optional body-18 keypoints for `propose --keypoints` | `check/`: both gate files, the idle's frames, `contact.png`, `check.json`; with `--loop`, the idle as APNG and GIF |

## Limits

From the README's own *What it does not do*:

- **One depth value per layer.** A layer that is in front of another in one place and behind it in another is right in the still and wrong once it moves.
- **No expression or lip-sync, and no jiggle.** The mouth is one layer; nothing here proposes, keys or judges a soft region.
- **Occluded pixels are See-through's synthesis**, not the artist's.
- **No success rate is claimed** — ten characters measured stage by stage is an existence proof, not a rate.
- **No WebP**: `loop` writes GIF and APNG.
- **The proposer reads tags, not pictures**, and reads the torso by screen y unless it is given keypoints; it does not estimate a pose itself.

## Go deeper

- [README: What it takes in](https://github.com/rig-c/parts#what-it-takes-in) and [What it gives out](https://github.com/rig-c/parts#what-it-gives-out)
- [README: The loop, for an agent](https://github.com/rig-c/parts#the-loop-for-an-agent), the full command sequence
- [README: What it does not do](https://github.com/rig-c/parts#what-it-does-not-do)
- [docs/AUTHORING.md](https://github.com/rig-c/parts/blob/main/docs/AUTHORING.md): every config field, what to read after each stage, every refusal
- [docs/PAINTING.md](https://github.com/rig-c/parts/blob/main/docs/PAINTING.md): what makes a painting riggable
- [docs/STABILITY.md](https://github.com/rig-c/parts/blob/main/docs/STABILITY.md) · [NOTICE.md](https://github.com/rig-c/parts/blob/main/NOTICE.md) · [CHANGELOG.md](https://github.com/rig-c/parts/blob/main/CHANGELOG.md) · [npm](https://www.npmjs.com/package/@rig-c/parts)
- Character 1's own files: [its folder in rig-c/examples](https://github.com/rig-c/examples/tree/c239b09328ca7364361b9761fac817502c09ede0/family/roa)
