---
navLabel: Parts
title: "@rig-c/parts: a 2D character rig from one painting"
description: A CLI for agents that turns one anime painting and its See-through layers into measured parts and a gated, packed Spine-format rig.
summaryForLlms: "@rig-c/parts is a Bun CLI that turns one character painting and its See-through layer decomposition into measured parts, a rig-c rig spec and an idle, gated and packed by rig-c into Spine 4.3 skeleton data."
packageName: "@rig-c/parts"
packageVersion: 1.41.0
repoUrl: https://github.com/rig-c/parts
npmUrl: https://www.npmjs.com/package/@rig-c/parts
---
# @rig-c/parts

<p class="mod-role">One painting and its See-through layers in — measured parts, a drafted rig and a looping idle out.</p>

<figure class="mod-hero">
  <div class="media">
    <video data-loop="the parts coming together" controls muted loop playsinline preload="metadata" poster="/assets/docs/parts-explode-poster.jpg" width="1280" height="720" aria-label="Recorded video: Character 1's seventeen parts laid out in a grid, then moving to their places in the rig">
      <source src="/assets/docs/parts-explode.mp4" type="video/mp4">
      <img src="/assets/docs/parts-explode-poster.jpg" alt="Character 1's seventeen parts laid out in a grid" width="1280" height="720">
    </video>
  </div>
  <figcaption><span class="media-kind">Recorded video</span> Character 1's 17 parts as rig-parts assembled them, drawn from <code>out/parts/</code> at the positions <code>parts.json</code> records, in the rig's draw order.</figcaption>
</figure>

<p class="mod-skip">Skip to <a href="#install">Install</a> · <a href="#inputs-and-outputs">Inputs and outputs</a> · <a href="#limits">Limits</a> · <a href="#go-deeper">Docs</a></p>

{{thread:parts}}

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
      <video data-loop="the idle" controls muted loop playsinline preload="metadata" poster="/assets/docs/parts-idle-poster.jpg" width="246" height="640" aria-label="Recorded video: Character 1 breathing in its idle loop">
        <source src="/assets/docs/parts-idle.mp4" type="video/mp4">
        <img src="/assets/docs/parts-idle-poster.jpg" alt="Character 1 standing" width="246" height="640">
      </video>
    </div>
    <figcaption><span class="media-kind">Recorded video</span> The idle, as <code>build --loop</code> wrote it: 41 frames at 12 fps.</figcaption>
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
- Character 1's own files: [its folder in rig-c/parts-examples](https://github.com/rig-c/parts-examples/tree/c239b09328ca7364361b9761fac817502c09ede0/family/roa)

<!-- SOURCES (not published)
- Character 1 assets: rig-c/parts-examples@c239b09 family/roa — docs/roa_layers_sheet.png, out/parts/*.png, out/parts.json (17 parts, recomposite: mean_abs 0.873, within_share 0.9831, uncovered_error_px 6041, holes[0] 834 px bordering bottomwear), out/recomposite_rig.png, out/recomposite_error_rig.png, docs/idle.gif (41 frames, 80 ms), out/check/contact.png
- red = uncovered error, blue = covered error (>40 off): rig-c/parts docs/AUTHORING.md lines 2200, 2633
- Limits: rig-c/parts README "What it does not do" (origin/main lines 325-362)
- 12 fps idle: 41 frames at 80 ms = 12.5 fps per GIF timing; check renders at 12 fps (rig-parts AUTHORING check row)

- published version 1.40.0; origin/main = tag v1.40.0 (8718427) — `npm view @rig-c/parts version`; `git rev-parse v1.40.0^{} origin/main`
- command name rig-parts — package.json "bin"; README.md:425-426
- takes one painting + See-through layers; merges into measured parts; authors weighted meshes, bone chains, looping idle; hands spec to rig-c to compile, gate, pack, render, check — README.md:3-8
- built for agents that cannot see the image; named numeric findings; refusal names object/value found/value required; nothing written after a red; no value invented — README.md:9-12
- artist's own layered PSD, one layer per part, no See-through — docs/AUTHORING.md:2100-2103 (§4 "For artists"); docs/PAINTING.md:16-21
- rig-parts never writes Spine data itself; check/build written by rig-c after its gate — README.md:160-161
- rig-c owns compile, gate, packer, renderer; rig-play is a DOM renderer — README.md:154-158
- getting-started for the machine that makes painting and layers — README.md:83-84
- sleeve layer holding torso etc. fail late — docs/PAINTING.md:5-6; skirt chain swung about its middle failed TIP_OVER_ROOT — README.md:34-37; uncovered holes — README.md:248-249
- one packed atlas page, like a Spine editor export — README.md:105-106
- check/build/skeleton.json/.atlas/.png = artifact, Spine 4.3, written by rigc build --pack, gated under rig-play — README.md:110
- parts/, parts.json (where every part came from), recomposite, error map — README.md:111
- rig/rig.json + motion.json in rig-c's spec — README.md:112
- check/: gate files, idle frames, check.json — README.md:113
- --loop: lossless APNG, indexed APNG, GIF — README.md:114
- inputs cuts painting on white square + head box crop — README.md:206-211, 294
- head run because full-figure eyes too small to separate — README.md:85-87
- See-through routes: HF Space, ModelScope, upstream CLI, ComfyUI wrapper; reads .psd or wrapper form — README.md:89-92, 169-174
- optional comfy adapter; nothing else needs ComfyUI — README.md:197-199, 215-216
- assemble merges two runs into rig-space parts, lists uncovered holes; error map red = no part covers — README.md:111, 300
- propose drafts bones, meshes, regions, idle, overlay; not a step of build; copy into config.json; LINT lines via --from-config — README.md:251-257, 282-283, 302
- build = assemble, rig and check in one process, stops at first refusal — README.md:310
- full run + head run — README.md:85-87
- uncovered hole: no later gate can see it — README.md:248-249
- config: part plan, head box, bones, idle; loader refuses unknown/missing field by name — README.md:93-100
- FAIL line ends with (see rig-parts guide <RULE>) — README.md:316; docs/STABILITY.md:37-38
- gate under rig-play profile — README.md:110, 158
- Bun 1.2+; npm i -D @rig-c/parts; rig-c as dependency — README.md:425-427, 435-436; package.json "engines"
- rig-parts --help has every flag — README.md:314; `bunx @rig-c/parts@1.40.0 --help` output
- Spine Editor licence for product use — README.md:445-447
- docs files exist and are what they say: AUTHORING (README.md:284-286), PAINTING (README.md:80-83), STABILITY (README.md:320-322), NOTICE (README.md:448-449), CHANGELOG.md (`git ls-tree origin/main`)
-->
