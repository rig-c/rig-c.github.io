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

Which Spine terms apply depends on what plays the output — rig-c's own model in `@rig-c/play` or an engine adapter, or the Spine data in a Spine Runtime or the editor. See [Licensing](/docs/licensing/).

## Go deeper

- [README: What it takes in](https://github.com/rig-c/parts#what-it-takes-in) and [What it gives out](https://github.com/rig-c/parts#what-it-gives-out)
- [README: The loop, for an agent](https://github.com/rig-c/parts#the-loop-for-an-agent), the full command sequence
- [docs/AUTHORING.md](https://github.com/rig-c/parts/blob/main/docs/AUTHORING.md): every config field, what to read after each stage, every refusal
- [docs/PAINTING.md](https://github.com/rig-c/parts/blob/main/docs/PAINTING.md): what makes a painting riggable
- [docs/STABILITY.md](https://github.com/rig-c/parts/blob/main/docs/STABILITY.md): what 1.0.0 holds stable
- [NOTICE.md](https://github.com/rig-c/parts/blob/main/NOTICE.md): third-party terms, See-through's included
- [CHANGELOG.md](https://github.com/rig-c/parts/blob/main/CHANGELOG.md)
- [npm: @rig-c/parts](https://www.npmjs.com/package/@rig-c/parts)
