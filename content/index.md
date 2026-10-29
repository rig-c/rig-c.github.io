---
navLabel: Overview
title: rig-c — AI-Authored 2D Rigging and Animation Toolchain
description: AI-authored 2D character rigging and animation, verified before a byte is written. Compile Spine 4.3 skeleton data and model documents from one painting with named assertions.
keywords: rig-c, rigc, 2D rigging, Spine 4.3, AI agent toolchain, @rig-c/parts, @rig-c/pose, @rig-c/play, @rig-c/review, @rig-c/core, @rig-c/pixi, @rig-c/phaser, @rig-c/three
packageName: "@rig-c/core"
repoUrl: https://github.com/rig-c
npmUrl: https://www.npmjs.com/package/@rig-c/core
heroEyebrow: 2D character rigging, authored by agents
heroTitle: One painting in. A verified rig out.
heroLede: rig-c turns a character painting, split into layers, into a rigged and animated character — Spine 4.3 skeleton data and a model a web page can play — and writes nothing until its named structural checks pass. How the result looks is still a person's call.
summaryForLlms: Toolchain overview, package index (parts, pose, core, review, play, adapters), installation commands, AI agent skill setup, and licensing boundaries.
---
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

Try the CPU-only, no-Python path from prepared example layers: **[Getting started](/docs/getting-started/)** pins a tested recipe through idle, wave, hello, cloth and browser playback. Its historical Apple M4 runs took 536–571 s for steps 1–10 including 9b/9c, with load average 20–95; the guide separates download/cache scope and its newer Linux reproduction. See what agents do with it on the **[Exam](/exam/)** (2026-10-20: [eight sittings, three families — results](/exam/#2026-10-20-sitting-the-five-task-round)), and rebuild the published rigs from **[Examples](/examples/)**.

## The toolchain

| Package | Latest | Install | What it does |
| --- | --- | --- | --- |
| [**@rig-c/parts**](/docs/parts/) | `{{version:parts}}` | `npm i -D @rig-c/parts` | Assembles one character painting's decomposed See-through layers into rig-ready parts, then authors weighted meshes, bone chains, physics, and a looping idle over them. |
| [**@rig-c/pose**](/docs/pose/) | `{{version:pose}}` | `npm i -D @rig-c/pose` | Cleans and retargets a body-18 pose sequence (from video, dataset, or hand-placed points) onto a rig that rig-c built, gated before keys are written. |
| [**@rig-c/core**](/docs/core/) | `{{version:core}}` | `npm i -D @rig-c/core` | The rig compiler: a rig spec and a motion spec in, Spine 4.3 skeleton data (`skeleton.json` + `.atlas`) and `skeleton.model.json` out — gated by named assertions before a byte is written (36 under the default `--profile spine`, all 50 under the opt-in `--profile rig-play`). |
| [**@rig-c/review**](/docs/review/) | `{{version:review}}` | `npm i -D @rig-c/review` | Local human inspection workspace: compare setup geometry, compiled-model playback, source video/sheets, and export frame/bone/slot-bound feedback ready to become an issue. |
| [**@rig-c/play**](/docs/play/) | `{{version:play}}` | `npm i @rig-c/play` | Plays `skeleton.model.json` in the browser with no Spine runtime — as plain DOM elements (`<img>` with CSS `matrix()`) or one `<canvas>` per player. |
| [**@rig-c/pixi**](/docs/adapters/)<br>[**@rig-c/phaser**](/docs/adapters/)<br>[**@rig-c/three**](/docs/adapters/) | `{{version:adapters}}` | `npm i @rig-c/pixi`<br>`npm i @rig-c/phaser`<br>`npm i @rig-c/three` | Plays a rig-c compiled model inside PixiJS 8, Phaser 4.2+, or Three.js 0.186+ through `@rig-c/play`'s posing core, with no Spine runtime. |

{{published-versions}}

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
bunx @rig-c/core --help

# Install the authoring & compilation toolchain in a project
bun add -d @rig-c/parts @rig-c/core @rig-c/pose @rig-c/review

# Install the zero-Spine-runtime browser player
bun add @rig-c/play
```

### Install Agent Skills

`@rig-c/core` and `@rig-c/parts` ship [Agent Skills](https://agentskills.io) (`skills/<name>/SKILL.md`, inside each npm package) that route coding agents directly to the authoritative authoring rules:

```sh
# Codex, Gemini CLI, or Antigravity: link rig-c's skills into .agents/skills/
bun add -d @rig-c/core
bun rigc skills install

# Claude Code: the rig-c/core repository is a plugin marketplace
/plugin marketplace add rig-c/core
/plugin install rigc@rigc
```

## Package names and aliases

`rig-c` is the project and toolchain brand. The scoped names above are the canonical npm package identities; the engine adapters are three separately published packages.

### Convenience install names and commands

These short npm names are alternative entry points for the same products. Prefer scoped names for new installs; existing installations keep working.

| Canonical package | Convenience install name | Executable |
| --- | --- | --- |
| `@rig-c/core` | `rig-c` | `rigc` |
| `@rig-c/parts` | `rig-parts` | `rig-parts` |
| `@rig-c/pose` | `rig-pose` | `rig-pose` |
| `@rig-c/play` | `rig-play` | None; import the browser library |
| `@rig-c/review` | `rig-review` | `rig-review` |

## Licensing, stated plainly

rig-c's code is **MIT**. Which Spine terms apply depends on what plays the output, because `rigc` writes both Spine 4.3 skeleton data and rig-c's own model (`skeleton.model.json`):

- **rig-c's model in [`@rig-c/play`](/docs/play/) or an [engine adapter](/docs/adapters/)**: these link nothing from Esoteric Software and integrate no Spine Runtime.
- **Spine data in an official Spine Runtime or the Spine Web Player**: the [Spine Runtimes License](https://esotericsoftware.com/spine-runtimes-license) applies to that integration.
- **Spine data in the Spine editor**: the [Spine Editor License Agreement](https://esotericsoftware.com/spine-editor-license) applies.

Sample paintings and layers carry their own licences — Getting Started's example inputs are CC BY-NC 4.0. The full table, with sources: **[Licensing](/docs/licensing/)**.

<!-- SOURCES (not published)
- "From loose parts to a living rig" clip landing-parts-to-rig.mp4 + poster: scripts/landing-film.py --trailer <clone> --crf 23, from rig-c/trailer@2248a13 with its pinned @rig-c/parts 1.12.0 and rig-c 2.47.1 (package.json devDependencies; npm ci). build.sh steps 1-3 as written: `rig-parts build --config inputs/config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --requirements inputs/requirements.json --out out/parts` -> "check: PASS; 9 of 9 bar(s) measured, 0 skipped"; film/palm.py + film/rig.py -> "bones 83 slots 29 physics 24 animations ['idle', 'show']"; `rigc build --rig out/film/rig.json --motion out/film/motion.json --out out/build --profile spine` (and rig_black.json) -> "53 assertions: 20 measured (20 passed, 0 failed), 17 skipped, 16 not in profile "spine"", "bones=83 slots=29 animations=2 regionAttachments=18 meshAttachments=11 physicsConstraints=24". Step 4 as written: show 321 frames, 16.000 s at 20 fps. Step 5 (compose.py: sky, lights, reveal, captions) not used.
- Then the script runs, with that rigc: rigc build of out/parts/rig (rig.json + motion.json) and a black-tinted twin (every slot color 000000ff), --profile spine -> "bones=73 slots=23 animations=1"; `rigc render --animation idle --fps 30 --max 599` (121 frames, 4.000 s) and `rigc render --candidate out/build --animation show --fps 30 --max 840` (481 frames, 16.000 s), each also on the black twin; alpha recovered from the pair as compose.py does.
- One scale for every shot: 0.493636 px per rig unit (the show render's); the idle render is 0.493947 (+0.063 %, not resampled). parts.json placement = rig x - 416, 1216 - y in world units (the skeleton box); assembled (parts.json) vs the idle's frame 0, stage area: mean abs diff 1.878 (0-255).
- Timeline (30 fps, 417 frames = 13.900 s): loose parts with labels 0-47, labels fade 48-65; converge 66-131 (60 frames of glides, 18 frames each, starts in draw order, + 6 held); idle 132-221 (idle frames 0-89, the first 10 a dissolve from the assembled still); idle -> show dissolve 222-233 (idle frames 90-101 into show frames 282-293); show 234-401 (show frames 294-461; the stretch 282-461 = 9.40-15.37 s of `show`, 5.4-11.4 s of its loop: the kick's end, hop, wave); dissolve back to frame 0 402-416 (show frames 462-476).
- Converge check (script): 3927 pair-frames with a part in flight and neither placed, 0 overlapping drawn rectangles, smallest gap 0.8 px.
- Encode: H.264 High, yuv420p, BT.709, -tune animation, CRF 23 (CRF 20 1,992,894 bytes, 22 1,649,992, 24 1,374,920), closed GOP 60, x264 zones q=12 on frame 0 and the last 3, faststart: 1,506,310 bytes, md5 467ffef0053a2367574cfb19b787b556; 1280x720, 417 frames, 13.900 s. Poster = encoded frame 0, 89,606 bytes, md5 d021b813cad7d197205b724d4496bcbc. Loop seam (scripts/loop-seam.py): 0.399 vs max step 5.032 (at 77->78), PASS.
- Current published @rig-c/parts 1.48.0 refuses the trailer's inputs at check: "check: FAIL — 3 bar(s) not met, 0 declared requirement(s) not PASS; 12 of 12 bar(s) measured, 0 skipped" (CHECK_STRESS_OFF_CHAIN on handwear_l), so the film uses the trailer's pinned versions.
- Replaced rigc-demo.mp4 + poster (rig-c/core film one, 600x404, the old package name in its frames), deleted.
-->
