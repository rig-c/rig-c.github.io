---
navLabel: Parts
title: "@rig-c/parts: a 2D character rig from one painting"
description: A CLI for agents that turns one anime painting and its See-through layers into measured parts and a gated, packed Spine-format rig.
summaryForLlms: "@rig-c/parts is a Bun CLI that turns one character painting and its See-through layer decomposition into measured parts, a rig-c rig spec and an idle, gated and packed by rig-c into Spine 4.3 skeleton data."
packageName: "@rig-c/parts"
packageVersion: 1.40.0
repoUrl: https://github.com/rig-c/parts
npmUrl: https://www.npmjs.com/package/@rig-c/parts
---
# @rig-c/parts

Turn one anime character painting into a rigged, idling 2D character. Every stage is checked before anything is written.

## What it is

`@rig-c/parts` (command `rig-parts`) is a command-line tool. It takes a single character painting and the layers See-through decomposed it into. It merges them into measured parts, authors weighted meshes, bone chains and a looping idle, and hands that spec to rig-c to compile, gate, pack, render and check.

## When to use it

Use it when you start from a painting, not from a finished rig. It is built for agents that cannot see the image: every stage prints named, numeric findings instead of asking you to look.

It also reads an artist's own layered PSD, one layer per part, with no See-through step.

Do not use it to write Spine data directly. rig-parts never does that itself. Compiling, gating and packing belong to [rig-c](/docs/core/). Drawing the result on a web page belongs to [rig-play](/docs/play/). To set up the machine that makes the painting and the layers, start at [Getting started](/docs/getting-started/).

## What it solves

Cutting a painted character into rig parts is slow, and the mistakes show up late: a layer holds the wrong pixels, a part leaves a hole, a chain swings a skirt about its middle. rig-parts measures these. A refusal names the object, the value found and the value required. Nothing is written after a red, and no value is invented where the input is silent.

## What you get

A green `build` ends like a Spine editor export, with one packed atlas page:

- **The artifact**: `skeleton.json`, `skeleton.atlas` and `skeleton.png` under `check/build/`. This is Spine 4.3 skeleton data, written by rig-c and gated under the `rig-play` profile.
- **The intermediates**: the loose `parts/`, `parts.json` (where every part came from), the recomposite and its error map.
- **The rig spec**: `rig.json` and `motion.json` in rig-c's spec.
- **The checks**: both gate files, the idle's frames and `check.json`.
- **With `--loop`**: the idle as a lossless APNG, an indexed APNG and a GIF.

## How it works

1. **Inputs.** `inputs` cuts the two images See-through is fed: the painting on a white square, and a square crop around the head. The head run exists because a full-figure run leaves the eyes too small to separate.
2. **Layers.** You run See-through by any route: a hosted demo, the upstream CLI, or ComfyUI. rig-parts reads its `.psd` or the ComfyUI wrapper form. An optional `comfy` adapter drives a ComfyUI box; nothing else needs one.
3. **Assemble.** The two runs merge into rig-space parts. Uncovered holes are listed, and the error map shows them in red.
4. **Propose.** `propose` drafts bones, meshes, regions and an idle, with an overlay to correct against. It is a draft, not a step of `build`. You copy its sections into `config.json`, and LINT lines flag what still looks wrong.
5. **Build.** `build` runs assemble, rig and check in one process and stops at the first refusal.

## Key concepts

- **See-through layers**: the decomposition of the painting into tagged layers, one run on the full figure and one on the head.
- **Parts**: the merged, measured pieces in rig space, recorded in `parts.json`.
- **Proposal**: the drafted bones, meshes, regions and motion in `proposal.json`, to be corrected.
- **Config**: `config.json`, the character's part plan, head box, bones and idle. Unknown or missing fields are refused by name.
- **FAIL line**: a refusal; it names a rule and ends with `(see rig-parts guide <RULE>)`.
- **Gate**: rig-c's validation of the compiled rig, here under the `rig-play` profile.

## Install

Requires [Bun](https://bun.sh) 1.2 or later. rig-c comes with it as a dependency.

```sh
npm i -D @rig-c/parts
rig-parts --help
```

Output is Spine skeleton data, so using it in a product requires a Spine Editor licence.

## Go deeper

- [README: What it takes in](https://github.com/rig-c/parts#what-it-takes-in) and [What it gives out](https://github.com/rig-c/parts#what-it-gives-out)
- [README: The loop, for an agent](https://github.com/rig-c/parts#the-loop-for-an-agent), the full command sequence
- [docs/AUTHORING.md](https://github.com/rig-c/parts/blob/main/docs/AUTHORING.md): every config field, what to read after each stage, every refusal
- [docs/PAINTING.md](https://github.com/rig-c/parts/blob/main/docs/PAINTING.md): what makes a painting riggable
- [docs/STABILITY.md](https://github.com/rig-c/parts/blob/main/docs/STABILITY.md): what 1.0.0 holds stable
- [NOTICE.md](https://github.com/rig-c/parts/blob/main/NOTICE.md): third-party terms, See-through's included
- [CHANGELOG.md](https://github.com/rig-c/parts/blob/main/CHANGELOG.md)
- [npm: @rig-c/parts](https://www.npmjs.com/package/@rig-c/parts)

<!-- SOURCES (not published)
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
