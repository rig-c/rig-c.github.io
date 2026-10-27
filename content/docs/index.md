---
navLabel: Overview
title: rig-c Docs — What Each Package Is, When to Use It, How It Works
description: Choose a rig-c route by goal, required inputs, minimum packages and output, then explore how the packages fit together.
keywords: rig-c docs, 2D rigging documentation, Spine 4.3, @rig-c/parts, @rig-c/pose, rig-c, @rig-c/review, @rig-c/play
repoUrl: https://github.com/rig-c
summaryForLlms: "Docs hub: five goal-based entry points with required inputs, minimum packages, outputs and next steps, followed by the package pipeline. Playback and inspection can start from an existing build."
---
# Docs

rig-c is a set of small packages that hand files to each other: a painting split into layers goes in at one end, and a rig that plays in a browser, a game engine, or the Spine editor comes out at the other. These pages explain what each package is for and how it works. Flags, schemas, and every rule live in the package's own repository — each page links there.

## Start here

Pick the row that matches what you already have. Each route starts there; you do not need every package. On narrow screens, scroll the table horizontally.

| I want to… | Have ready | Minimum packages | What comes out | Next step |
| --- | --- | --- | --- | --- |
| Start from a painting and layers | Painting, full-figure and head layers (See-through or layered PSD), joints and a corrected config | `@rig-c/parts` + `rig-c` to build | Parts, rig/motion specs, a gated native model and Spine export | [Getting Started](/docs/getting-started/) — prepared inputs through a first build and browser playback |
| Play an existing compiled rig | Native `skeleton.model.json` and its image pages; for a host, a PixiJS, Phaser or Three.js scene | `@rig-c/play`; add only the matching `@rig-c/pixi`, `@rig-c/phaser` or `@rig-c/three` and host package for an engine scene | A rig playing in a page or host scene | [Play: a minimal page](https://github.com/rig-c/play#a-minimal-page); for a host, [Adapters](/docs/adapters/) |
| Apply a pose sequence | Body-18 sequence (or COCO-17 converted by `clean`), target rig spec with its parts, explicit bone map; clean before retargeting | `@rig-c/pose` + `rig-c` | Motion spec, optional report and gated compiled build | [Pose: inputs and outputs](/docs/pose/#inputs-and-outputs) |
| Add interactive head/gaze controls | Compiled native model and image pages with declared yaw/pitch slider dials; gaze needs its own declared dials | For the adapter example: `@rig-c/play` + `rig-c` (model reader) + one host adapter and host package; example-side pointer helper | Pointer-driven control of the rig's declared sliders | [Adapter controls guide](https://github.com/rig-c/adapters/blob/main/examples/look/README.md) — helper, required dials and refusal rules |
| Inspect, correct and review an agent's result | Existing output folder; references if available. Apply also needs original reproducible config and parts, plus source inputs for edits that use them | `@rig-c/review` for inspection/feedback; Apply also needs the original producer installed | Local inspection, source-bound feedback; eligible Apply edits rebuild in scratch | [Review: inputs and outputs](/docs/review/#inputs-and-outputs) |

Painting and layer generation happen **before CPU-only rig-c processing**. The walkthrough starts with prepared layers; image models and See-through have their own requirements. Compiled-model playback skips both input generation and rig authoring. If you have Spine data instead, use the [Spine playback path](/docs/capabilities/#pick-the-playback-path), not Play's native-model loader. Keep the inputs' provenance and [asset and playback licensing](/docs/licensing/) with the route you choose; the walkthrough's sample inputs are CC BY-NC 4.0.

For interactive work, compare [2D, depth-driven 2.5D and full 3D capabilities](/docs/capabilities/) first. The adapter guide's current example uses its public slider fixture; it does not establish playback of a newly released depth producer. The [standalone head-turn preview](/demos/head-turn/) runs its own frozen scene format, separate from that integration.

**Structural checks do not judge how a rig looks.** A person still needs to inspect the result. Review can inspect without a producer handoff; Apply requires the original producer to reproduce the inspected build. Review authors no motion keys itself, and the source files stay unchanged.

{{docs-map}}

## How the pieces fit

1. **Parts** turns the painting's layers into rig-space parts and authors a first rig over them.
2. **Pose** turns a recorded body pose sequence into an animation on that rig.
3. **Core** (`rigc`) compiles the rig and motion specs, gates them by named assertions, and writes only when every one passes.
4. **Review** lets a person look at what an agent built and hand back feedback bound to a frame, bone, or slot.
5. **Play** and the **adapters** run the compiled model in a page or a game engine with no Spine runtime.
