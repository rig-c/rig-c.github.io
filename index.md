# rig-c — AI-Authored 2D Rigging and Animation, Verified Before It Is Written

One character painting goes in; a rigged, animated 2D character that plays in the browser or imports into the Spine 4.3 editor comes out. Every stage prints named, numeric findings and refuses by name what it cannot verify, so a file that fails a check never reaches the disk. A pass is a structural fact about the data, not a verdict on how the character looks.

**rig-c makes no images.** The painting and its layer split ([See-through](https://github.com/shitagaki-lab/see-through)) come from image models you run yourself — on your own GPU, or a free web demo. rig-c starts from those files, ships no model weights, and runs every one of its own steps on the CPU.

## From loose parts to a living rig

<figure class="figure-media">
  <div class="media">
    <video data-loop="the parts-to-rig film" controls muted loop playsinline preload="metadata" poster="/assets/landing-parts-to-rig-poster.jpg" width="1280" height="720" aria-label="Recorded video: rig-c's mascot as 23 labelled loose parts, which glide one by one into place, then breathe and blink in the drafted idle and, on a swing, kick, hop and wave">
      <source src="/assets/landing-parts-to-rig.mp4" type="video/mp4">
      <img src="/assets/landing-parts-to-rig-poster.jpg" alt="rig-c's mascot as 23 labelled loose parts: hair, face, eyes, clothes and shoes laid out around her long back hair" width="1280" height="720">
    </video>
  </div>
  <figcaption><span class="media-kind">Recorded video</span> rig-c's mascot — the trailer's painting, built by <code>@rig-c/parts</code> 1.12.0 into 23 parts, a rig and an idle, then the film rig's performance compiled and rendered by <code>rig-c</code> 2.47.1; the labels, the glide and the dissolves are this film's; the placement and the motion are the rig's. From <a href="https://github.com/rig-c/trailer">rig-c/trailer</a>.</figcaption>
</figure>

1. **[Parts](/docs/parts/)** merges the painting's two See-through layer sets into rig-space parts, then drafts bones, weighted meshes, physics and a looping idle.
2. **[Pose](/docs/pose/)** cleans a recorded body-18 pose sequence and retargets it onto the rig as an animation.
3. **[Core](/docs/core/)** compiles the rig and motion specs and gates them by named assertions — nothing is written unless every one passes.
4. **[Review](/docs/review/)** lets a person look at what an agent built and hand back feedback bound to a frame, bone or slot.
5. **[Play](/docs/play/)** and the **[adapters](/docs/adapters/)** run the compiled model in a page, PixiJS, Phaser or Three.js, with no Spine runtime.

Try it end to end with no GPU and no Python — about a minute of commands on an Apple M4: **[Getting started](/docs/getting-started/)**. See what agents do with it on the **[Exam](/exam/)** (2026-10-20: [eight sittings, three families — results](/exam/#2026-10-20-sitting-the-five-task-round)), and rebuild the published rigs from **[Examples](/examples/)**.

## The toolchain

| Package | Latest | Install | What it does |
| --- | --- | --- | --- |
| [**@rig-c/parts**](/docs/parts/) | `1.60.2` | `npm i -D @rig-c/parts` | Assembles one character painting's decomposed See-through layers into rig-ready parts, then authors weighted meshes, bone chains, physics, and a looping idle over them. |
| [**@rig-c/pose**](/docs/pose/) | `1.0.2` | `npm i -D @rig-c/pose` | Cleans and retargets a body-18 pose sequence (from video, dataset, or hand-placed points) onto a rig that rig-c built, gated before keys are written. |
| [**rig-c / @rig-c/core**](/docs/core/) | `2.68.0` | `npm i -D rig-c` | The rig compiler: a rig spec and a motion spec in, Spine 4.3 skeleton data (`skeleton.json` + `.atlas`) and `skeleton.model.json` out — gated by named assertions before a byte is written (36 under the default `--profile spine`, all 50 under the opt-in `--profile rig-play`). |
| [**@rig-c/review**](/docs/review/) | `0.11.2` | `npm i -D @rig-c/review` | Local human inspection workspace: compare setup geometry, compiled-model playback, source video/sheets, and export frame/bone/slot-bound feedback ready to become an issue. |
| [**@rig-c/play**](/docs/play/) | `1.17.0` | `npm i @rig-c/play` | Plays `skeleton.model.json` in the browser with no Spine runtime — as plain DOM elements (`<img>` with CSS `matrix()`) or one `<canvas>` per player. |
| [**@rig-c/adapters**](/docs/adapters/) | `pixi 0.1.1 / phaser 0.1.1 / three 0.1.1` | `npm i @rig-c/pixi`<br>`npm i @rig-c/phaser`<br>`npm i @rig-c/three` | Plays a rig-c compiled model inside PixiJS 8, Phaser 4.2+, or Three.js 0.186+ through `@rig-c/play`'s posing core, with no Spine runtime. |

## Built for agents that cannot see

An AI agent asked to author a 2D rig cannot see the screen, and standard JSON parsers accept broken rigs in silence — a 4.2-shaped constraint vanishes in 4.3, a mismatched `size:` collapses every UV, a four-number curve array yields `NaN`, and a mesh whose vertex count equals its UV count silently loses its bone weights.

rig-c replaces that silence with five rules:

1. **The messages are the UI.** Every refusal names the object, the value found, and the value required. An agent reads one line and knows which field in which file to change — this is rig-c core's own example, a renamed page image:

   ```
   FAIL  A17_ATLAS_PAGE_FILES_EXIST: page "../images/hull.png" is not on disk at …/images/hull.png
   rigc: 1 assertion(s) failed
   ```

2. **Nothing is invented.** The compiler never guesses defaults from art or fills in missing numbers. Where the input is silent, it raises a named `CompileError`.
3. **Emit only after green — and green means structural.** `rigc build` writes to disk **only** if every named assertion of its profile passes: 36 under the default `spine` profile (*is this valid Spine 4.3 that any runtime plays correctly?*), all 50 under the opt-in `rig-play` profile. `rig-parts build` adds its own measured bars (seam, loop, folds and more) on top. None of this judges the picture: in rig-c core's words, *a rig with its head off its torso passes the gate*.
4. **What was not checked is printed too.** Every gate report names the profile that judged it and lists, on `PROF` lines, the rules that profile left out. `rig-parts check` names each bar that said `SKIP` and why, and a build accepted with failing bars (`compose --accept`) is, in its own words, for looking, not shipping.
5. **A person looks.** `rigc render` and `rigc inspect` draw what was built; [`@rig-c/review`](/docs/review/) puts it beside the source footage and exports feedback bound to a frame, bone or slot. The checks keep broken data off the disk; Review is where someone judges whether it looks right.

## Install

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

## Package names and aliases

- `rig-c`, `@rig-c/core`, and `spine-rigc` are the same compiler package on npm and install the `rigc` command.
- `@rig-c/parts`, `rig-parts`, and `spine-parts` are the same part-assembly package and install the `rig-parts` command.
- `@rig-c/play`, `rig-play`, and `spine-html` are the same browser player package.

## Licensing, stated plainly

rig-c's code is **MIT**. Which Spine terms apply depends on what plays the output, because `rigc` writes both Spine 4.3 skeleton data and rig-c's own model (`skeleton.model.json`):

- **rig-c's model in [`@rig-c/play`](/docs/play/) or an [engine adapter](/docs/adapters/)**: these link nothing from Esoteric Software and integrate no Spine Runtime.
- **Spine data in an official Spine Runtime or the Spine Web Player**: the [Spine Runtimes License](https://esotericsoftware.com/spine-runtimes-license) applies to that integration.
- **Spine data in the Spine editor**: the [Spine Editor License Agreement](https://esotericsoftware.com/spine-editor-license) applies.

Sample paintings and layers carry their own licences — Getting Started's example inputs are CC BY-NC 4.0. The full table, with sources: **[Licensing](/docs/licensing/)**.
