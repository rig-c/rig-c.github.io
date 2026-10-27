---
navLabel: Capabilities
title: rig-c capabilities — 2D, depth-driven 2.5D and full 3D
description: Compare rig-c routes by input, released producer, turn controls, output and verified playback, from cut-out 2D to depth-driven rotation and the boundary with full 3D.
keywords: rig-c capabilities, 2D rigging, depth map, 2.5D rotation, Spine 4.3, Three.js
repoUrl: https://github.com/rig-c
summaryForLlms: Capability matrix: cut-out 2D, Core depth-driven rotation, the released Parts producer and the standalone preview, with inputs, controls, outputs, playback evidence and full-3D limits.
---
# 2D, depth-driven 2.5D, and full 3D

A painted rig can turn in depth without becoming a complete 3D character. The route matters: Core can project actual rotation of a declared surface, Parts chooses a particular projection, and a Three.js scene can host the result.

## Capability matrix

These are release-scoped capabilities, checked on **2026-10-27**. **VERIFIED** names an existing playback record and its pins; **UNVERIFIED** means that combination has no playback evidence here; **UNSUPPORTED** means the named path does not provide it. A released producer or a green compiler gate alone is not a playback result. On narrow screens, scroll the table horizontally.

| Route | Required input | Producing package / version | Controls or range | Output | Verified playback |
| --- | --- | --- | --- | --- | --- |
| Cut-out 2D | Painting, layered PSD or See-through layers, corrected config; or authored rig/motion specs and part PNGs | [Parts 1.68.0](/docs/parts/) → [Core 2.74.0](/docs/core/) | Bone transforms, weighted meshes, authored motion; range depends on art and rig | Native model + Spine 4.3 export | **VERIFIED:** [recorded Parts idle](/docs/parts/#3-a-drafted-rig-that-idles) in Play 1.12.0. This older fixture does not establish every current producer/player pairing. |
| 2D body retarget, with optional depth cues | Cleaned body-18 joints, built rig, explicit bone map; depth-derived ordering also needs depth data and target bindings | [Pose 1.2.1](/docs/pose/) → Core | `clean --depth walk\|run`; opt-in `retarget --draw-order depth`, `--leg-scale`, `--plant-feet`, `--stance`, `--depth-scale` | Motion spec, report, gated native model + Spine export | **VERIFIED:** [swing](/docs/pose/#how-the-swing-reached-character-1), Pose 0.35.0 / Core 2.61.0 in [Play 1.12.0](/docs/play/). **UNVERIFIED:** these 1.2.1 opt-ins in that playback fixture. |
| Core depth-driven 2.5D rotation | Authored specs; mesh with a drawing-sized greyscale depth sheet, explicit `near` / `zScale`, or a declared cylinder radius; feature depths for bone `derive` | [Core 2.74.0](https://github.com/rig-c/core/releases/tag/v2.74.0) | Authored `yaw` / `pitch` degrees and axis; default `narrowing:true`; mesh fold ceiling and feature edge-on limits are construction-specific | Compiled 2D deform / bone keys in native model + Spine export | **UNVERIFIED:** this release's depth-sheet route across Play, adapters and official runtimes. See the [projection contract](#what-the-turn-means); the standalone preview is a different path. |
| Released Parts depth-sheet head turn | Registered layer sheets; opt-in `config.depth` polarity / scale; `config.turn.roles` with a `surface`, plus `unit` / `rear` parts as needed | [Parts 1.68.0](https://github.com/rig-c/parts/releases/tag/v1.68.0) → Core | `yaw_dial` / `pitch_dial`, `turn` / `tilt`; default band ±15° yaw / ±12° pitch; **`narrowing:false`** | Rig/motion specs and depth-sheet companion → native model + Spine export | **UNVERIFIED:** this producer's depth output with Play, adapters or official runtimes. Release scope is documented in the [Parts contract](/docs/parts/#depth-driven-head-turns). |
| Standalone depth preview | Its shipped precompiled scene, textures and depth samples, prepared from one painting and its depth map | [Frozen preview bundle](/examples/#preview-depth-driven-head-turn), separate from npm producers | Pointer: nominal ±15° yaw / ±12° pitch at gain 1; gain, pivot, gaze and rear counter controls | Preview-specific scene JSON / compressed geometry and browser bundle | **VERIFIED:** the [standalone WebGL demo](/demos/head-turn/) documented with that bundle. **UNSUPPORTED:** loading this scene format directly as a Play model or Spine export. |
| Full 3D character reconstruction / toon relighting | Would require unseen surfaces, volume and lighting/material information beyond these painted inputs | **UNSUPPORTED** by the routes above | No unrestricted orbit or relight control in these producers | No complete 3D character model from these paths | **UNSUPPORTED:** treating the Three.js adapter as a reconstruction producer. Its supported scene placement is described [below](#pick-the-playback-path). |

## What the turn means

**Core evaluates a rotation, then projects it into the picture.** Its [mesh transform and bone `derive` contracts](https://github.com/rig-c/core/blob/78269be5dca759ed7a3cf4597fae2068700906cf/docs/AUTHORING.md) include both `u·(cos θ − 1)` narrowing and `−z·sin θ` depth shift. A depth sheet supplies each mesh vertex's `z`; a radius supplies a cylinder's `z`. Bone `derive` can also key the separate foreshortening scale. This is more than sliding each layer at one ordering depth.

**Parts 1.68.0 deliberately keeps the front-view proportions.** Its [shipped producer](https://github.com/rig-c/parts/blob/89a7671229d155976fc8b5e87ffd6459301ff7b9/src/turn.ts) sets `narrowing:false` on surface and feature displacement: sine-depth movement remains, cosine narrowing is omitted. The standalone preview also uses sine-depth displacement, but has its own dense geometry and controller. Neither describes every Core turn.

Depth supplies no unseen drawing. Wider Parts bands require a declared alternate face drawing; a Core surface's fold ceiling is a geometric limit, not a guarantee that the face looks right. The [face construction guide](https://github.com/rig-c/core/blob/78269be5dca759ed7a3cf4597fae2068700906cf/docs/FACE.md) explains why larger turns can need different eye, cheek and neck art. Pose's [depth and feet options](/docs/pose/#depth-projection-and-feet) estimate constrained cues from 2D joints; they do not reconstruct a rotating 3D body.

## Pick the playback path

- **Native model:** [Play](/docs/play/) loads `skeleton.model.json` (`rigc-compiled/3`) and image pages. It does not load the Spine export. [Engine adapters](/docs/adapters/) consume Play's posed frames. The recorded walk verifies adapters **0.1.1** with Play **1.10.0**; it does not verify new depth producers with today's releases.
- **Spine export:** `skeleton.json` + `skeleton.atlas` and image pages go to an official Spine runtime or the editor. That is a separate integration; matching file names do not establish feature parity. Use the existing [licensing guidance](/docs/licensing/#spine-terms-they-follow-what-plays-the-output) for each path.
- **Three.js host:** [Three 0.1.1's contract](https://github.com/rig-c/adapters/blob/26af17776d90f56af1ff0e153e4f4b95ec292bdc/packages/three/README.md) permits translating, rotating and scaling a flat Group in perspective or orthographic scenes, with ordinary 3D occlusion. Its slot vertices remain `(x, y, 0)` and its shader has no lighting: painted shading and tint are not reconstructed normals or toon relighting.

<!-- SOURCES (not published)
- Release snapshot from fresh npm latest manifests + tarballs, with gitHead: rig-c 2.74.0 78269be5dca759ed7a3cf4597fae2068700906cf; Parts 1.68.0 89a7671229d155976fc8b5e87ffd6459301ff7b9; Pose 1.2.1 35d4d140fa45410051117251c9e55a9fb36f4920. These are capability pins, not dynamic latest badges or retimed demonstration recordings.
- Core AUTHORING at that gitHead §§3.4.5 (drawing-sized sheets / polarity / zScale / setup-world projection), 4.5.1 (derive shift and separate scale), 4.12 (yaw/pitch, narrowing default / false); shipped src/deformgen.ts:428-521 and src/depth.ts:214-215; FACE §§1,2.2,8,11: rotation, ceilings and artwork-dependent turn limits. No global safe-angle claim.
- Parts AUTHORING turn field and Per-layer depth sheets; src/turn.ts buildDepth25DTurn:1458-1770 uses depth:true,narrowing:false and separate dials; CHANGELOG 1.68.0 #774/#777. Legacy scalar ordering-depth is not the per-pixel sheet. No claim that latest output played end to end here.
- Pose REFERENCE at gitHead 35d4d14: derived depth, draw order bindings/layout, foreshortening/planted feet and depth-scale. Existing docs/pose scope and historic swing pins preserved.
- Verified playback means the existing source-bound site records: parts idle (Play 1.12.0); pose swing (Pose 0.35.0 / Core 2.61.0 / Play 1.12.0); adapters walk (host adapters 0.1.1 / Play 1.10.0). No new package-runtime playback measurement in this docs card.
- Standalone bundle README + app.js and existing examples source: nominal 15/12 degrees, gain=1; depth samples / pivot / gaze / rear counter. Bundle hash pinned by src/head-turn.ts and unchanged. Demo has no generic package model loader/exporter.
- Three npm 0.1.1 README Native drawing and scene placement, shipped dist/index.js:271-272 adds z=0 to posed 2D positions; shader without lighting. Actual native scene placement is supported, full character reconstruction is not supplied by that implementation.
- Native format: published Play 1.20.0 README Install; licensing language is delegated to existing unchanged site guidance.
-->
