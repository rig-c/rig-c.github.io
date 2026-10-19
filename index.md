# rig-c — AI-Authored 2D Rigging and Animation, Verified Before It Is Written

One character painting goes in; a rigged, animated 2D character that plays in the browser or imports into the Spine 4.3 editor comes out. Every stage prints named, numeric findings and refuses by name what it cannot verify, so a broken file never reaches the disk.

**rig-c makes no images.** The painting and its layer split ([See-through](https://github.com/shitagaki-lab/see-through)) come from image models you run yourself — on your own GPU, or a free web demo. rig-c starts from those files, ships no model weights, and runs every one of its own steps on the CPU.

## The Toolchain at a Glance

| # | Package | Latest | Install | What It Does |
| :-: | --- | --- | --- | --- |
| 1 | [**@rig-c/parts**](/docs/parts/) | `1.40.0` | `npm i -D @rig-c/parts` | Assembles one character painting's decomposed See-through layers into rig-ready parts, then authors weighted meshes, bone chains, physics, and a looping idle over them. |
| 2 | [**@rig-c/pose**](/docs/pose/) | `0.33.0` | `npm i -D @rig-c/pose` | Cleans and retargets a body-18 pose sequence (from video, dataset, or hand-placed points) onto a rig that rig-c built, gated before keys are written. |
| 3 | [**rig-c / @rig-c/core**](/docs/core/) | `2.61.0` | `npm i -D rig-c` | The rig compiler: a rig spec and a motion spec in, Spine 4.3 skeleton data (`skeleton.json` + `.atlas`) and `skeleton.model.json` out — gated by named assertions before a byte is written (36 under the default `--profile spine`, all 50 under the opt-in `--profile rig-play`). |
| 4 | [**@rig-c/review**](/docs/review/) | `0.2.1` | `npm i -D @rig-c/review` | Local human inspection workspace: compare setup geometry, compiled-model playback, source video/sheets, and export frame/bone/slot-bound feedback ready to become an issue. |
| 5 | [**@rig-c/play**](/docs/play/) | `1.12.0` | `npm i @rig-c/play` | Plays `skeleton.model.json` in the browser with no Spine runtime — as plain DOM elements (`<img>` with CSS `matrix()`) or one `<canvas>` per player. |
| 6 | [**@rig-c/adapters**](/docs/adapters/) | `0.1.1` | `npm i @rig-c/pixi`<br>`npm i @rig-c/phaser`<br>`npm i @rig-c/three` | Plays a rig-c compiled model inside PixiJS 8, Phaser 4.2+, or Three.js 0.186+ through `@rig-c/play`'s posing core, with no Spine runtime. |

Additional resources:
- [**Getting Started**](/docs/getting-started/) — Try the full pipeline in about 3 minutes with no GPU, or set up your own character workflow.
- [**AI Agent Exam (`rig-c/exam`)**](/exam/) — Open-book benchmark measuring whether coding agents that have never seen the tools pass build, motion retargeting, and repair tasks on the first sitting.
- [**Reproducible Examples**](/examples/) — Public character inputs, the 20-rig Agent Family reproducibility suite, and the 12-second reproducible trailer.
- [**Machine-Readable Docs (`/llms.txt`)**](/llms.txt) and [**Full Context (`/llms-full.txt`)**](/llms-full.txt) — Plain-text indexes optimized for `curl` and LLM context windows.

## Quick Install

```sh
# Run the compiler CLI directly with Bun
bunx rig-c --help

# Install the authoring & compilation toolchain in a project
bun add -d @rig-c/parts rig-c @rig-c/pose @rig-c/review

# Install the zero-Spine-runtime browser player
bun add @rig-c/play
```

### Install Agent Skills

`rig-c` and `@rig-c/parts` ship [Agent Skills](https://agentskills.io) (`skills/<name>/SKILL.md`, inside each npm package) that route coding agents directly to the authoritative authoring rules:

```sh
# Codex, Gemini CLI, or Antigravity: link rig-c's skills into .agents/skills/
bun add -d rig-c
bun rigc skills install

# Claude Code: the rig-c/core repository is a plugin marketplace
/plugin marketplace add rig-c/core
/plugin install rigc@rigc
```

## Built for Agents That Cannot See

An AI agent asked to author a 2D rig cannot see the screen, and standard JSON parsers accept broken rigs in silence — a 4.2-shaped constraint vanishes in 4.3, a mismatched `size:` collapses every UV, a four-number curve array yields `NaN`, and a mesh whose vertex count equals its UV count silently loses its bone weights.

rig-c replaces that silence with four structural invariants:

1. **The messages are the UI.** Every refusal names the object, the value found, and the value required (for example, `A20_MESH_WEIGHTS_COHERENT: mesh "x" vertex 12 weights sum to 0.9000`). An agent reads one line and knows which field in which file to change.
2. **Nothing is invented.** The compiler never guesses defaults from art or fills in missing numbers. Where the input is silent, it raises a named `CompileError`.
3. **Emit only after green.** `rigc build` compiles, runs its assertion gate, and writes to disk **only** if every assertion passes. No broken file ever outlives the console output that warned about it.
4. **A person can still look.** [`@rig-c/review`](/docs/review/) lets a human inspect the agent's output against reference footage and export structured feedback bound to a frame, bone, or slot.

## Package Names & Aliases

- `rig-c`, `@rig-c/core`, and `spine-rigc` are the same compiler package on npm and install the `rigc` command.
- `@rig-c/parts`, `rig-parts`, and `spine-parts` are the same part-assembly package and install the `rig-parts` command.
- `@rig-c/play`, `rig-play`, and `spine-html` are the same browser player package.

## Licensing, Stated Plainly

All rig-c packages are **MIT licensed**. The published packages link **no Spine runtime**:
- `rigc` emits both Spine 4.3 skeleton data (`skeleton.json` + `skeleton.atlas`) and rig-c's own compiled model document (`skeleton.model.json`).
- Playing `skeleton.model.json` with [`@rig-c/play`](/docs/play/) or [`@rig-c/adapters`](/docs/adapters/) integrates no Esoteric Software code and requires no Spine license.
- Importing `skeleton.json` into the Spine Editor or playing it with an official Spine Runtime is subject to Esoteric Software's [Spine Editor License Agreement](https://esotericsoftware.com/spine-editor-license) and [Spine Runtimes License Agreement](https://esotericsoftware.com/spine-runtimes-license).
