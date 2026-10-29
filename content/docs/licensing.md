---
navLabel: Licensing
title: rig-c Licensing — MIT Code, Spine Terms by Playback Path, Sample Assets
description: rig-c's code is MIT. Which Spine terms apply depends on what plays the output; sample paintings and layers carry their own licences.
keywords: rig-c license, Spine Runtimes License, Spine Editor License, MIT, CC BY-NC 4.0
repoUrl: https://github.com/rig-c/core/blob/main/NOTICE.md
summaryForLlms: Licensing by path: rig-c code is MIT; rig-c's own model played by @rig-c/play or the adapters integrates no Spine Runtime; Spine data in a Spine Runtime or the Spine Editor falls under Esoteric Software's terms; sample assets carry their own licences (Getting Started's inputs are CC BY-NC 4.0).
---
# Licensing

Three separate questions, answered separately: the licence of rig-c's own code, the Spine terms that come with the way you play the output, and the licence of the sample paintings and layers. This page restates rig-c's notices and Esoteric Software's published terms; it is not legal advice, and the originals linked below are what count.

## rig-c's own code: MIT

`@rig-c/core` (`rigc`), `@rig-c/parts`, `@rig-c/pose`, `@rig-c/review`, `@rig-c/play`, `@rig-c/pixi`, `@rig-c/phaser` and `@rig-c/three` are MIT — each repository's `LICENSE`. That grant covers rig-c's code. It says nothing about Spine, and it does not cover the sample assets below.

## Spine terms: they follow what plays the output

`rigc build` writes two things side by side: **Spine 4.3 skeleton data** (`skeleton.json` + `skeleton.atlas`) and **rig-c's own model** (`skeleton.model.json`). rig-c core's [NOTICE](https://github.com/rig-c/core/blob/main/NOTICE.md) puts the rule in one line: *what the terms turn on is the integration* of a Spine Runtime — and rigc *neither adds those terms nor removes them*.

| Path | What plays or opens the output | Terms that apply |
| --- | --- | --- |
| rig-c's model in a page or an engine | [`@rig-c/play`](/docs/play/), [`@rig-c/pixi` / `phaser` / `three`](/docs/adapters/) | rig-c's MIT. These packages link nothing from Esoteric Software and pose the rig with rig-c's own core, so no Spine Runtime is integrated. |
| Spine data in a product | an official Spine Runtime, or the Spine Web Player (which `rigc preview` loads) | The [Spine Runtimes License](https://esotericsoftware.com/spine-runtimes-license): integration is permitted under Section 2 of the Spine Editor License Agreement, or on the condition that each user of the product obtains their own Spine Editor licence, and redistribution includes that licence and copyright notice. |
| Spine data in the Spine editor | the Spine editor, to refine by hand | The [Spine Editor License Agreement](https://esotericsoftware.com/spine-editor-license). |
| rigc with `@esotericsoftware/spine-core` installed beside it | rigc's round-trip gate, `validate`, `preview`, `vote`, `bench`, `bonedist` | That install integrates a Spine Runtime, so the Spine Runtimes License applies there. The published `@rig-c/core` package does not carry spine-core. |

Esoteric Software's licence pages read *Last updated April 5, 2025* when this page was written.

## Sample assets carry their own licences

| Assets | Licence | Source |
| --- | --- | --- |
| The painting and layers [Getting started](/docs/getting-started/) downloads | **CC BY-NC 4.0** — credit required, no commercial use; what you build from them carries that licence | [rig-c/exam `LICENSE`](https://github.com/rig-c/exam/blob/main/LICENSE) |
| The paintings, See-through inputs and layers in [rig-c/examples](https://github.com/rig-c/examples) | MIT | [`LICENSE`](https://github.com/rig-c/examples/blob/main/LICENSE) |
| The trailer's painting, layers, sky, palm and rendered trailer | MIT | [rig-c/trailer `LICENSE`](https://github.com/rig-c/trailer/blob/main/LICENSE) |

The image models that generated those paintings, and See-through itself, have their own terms; each repository's `NOTICE.md` records them, and [rig-c/parts `NOTICE.md`](https://github.com/rig-c/parts/blob/main/NOTICE.md) collects See-through's. No rig-c package contains See-through code or weights.

<!-- SOURCES (not published)
- canonical core package identity: core README at 666b30bf27b1447e71b02271b48253a8b47e7520, canonical npm package / convenience install name; npm view @rig-c/core@2.81.0 name license (2026-10-30): @rig-c/core, MIT.
- MIT per repo: LICENSE files of rig-c/core, parts, pose, review, play, adapters (gh api .../LICENSE)
- "what the terms turn on is the integration", "neither adds those terms nor removes them": rig-c/core NOTICE.md "What that means for rigc" + README "Licensing, stated plainly" (origin/main)
- play/adapters link nothing from Esoteric, own core: rig-c/getting-started README "On a web page" licence line; rig-c/adapters README:99-104
- Runtimes License wording + "Last updated April 5, 2025": esotericsoftware.com/spine-runtimes-license (fetched 2026-10-19)
- Editor License §2 integration + date: esotericsoftware.com/spine-editor-license (fetched 2026-10-19)
- preview loads Spine Web Player: core NOTICE.md "The Spine Web Player"
- spine-core commands: bunx rig-c@2.61.0 <cmd> --help
- exam CC BY-NC 4.0 + "what you build from them carries that licence": rig-c/exam LICENSE; rig-c/getting-started README "Credits and licences"
- examples / trailer MIT coverage: their LICENSE headers
- See-through not in any rig-c package: getting-started README Credits; parts NOTICE.md §1
-->
