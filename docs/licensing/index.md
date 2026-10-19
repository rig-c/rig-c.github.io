# Licensing

Three separate questions, answered separately: the licence of rig-c's own code, the Spine terms that come with the way you play the output, and the licence of the sample paintings and layers. This page restates rig-c's notices and Esoteric Software's published terms; it is not legal advice, and the originals linked below are what count.

## rig-c's own code: MIT

`rig-c` (core), `@rig-c/parts`, `@rig-c/pose`, `@rig-c/review`, `@rig-c/play`, `@rig-c/pixi`, `@rig-c/phaser` and `@rig-c/three` are MIT — each repository's `LICENSE`. That grant covers rig-c's code. It says nothing about Spine, and it does not cover the sample assets below.

## Spine terms: they follow what plays the output

`rigc build` writes two things side by side: **Spine 4.3 skeleton data** (`skeleton.json` + `skeleton.atlas`) and **rig-c's own model** (`skeleton.model.json`). rig-c core's [NOTICE](https://github.com/rig-c/core/blob/main/NOTICE.md) puts the rule in one line: *what the terms turn on is the integration* of a Spine Runtime — and rigc *neither adds those terms nor removes them*.

| Path | What plays or opens the output | Terms that apply |
| --- | --- | --- |
| rig-c's model in a page or an engine | [`@rig-c/play`](/docs/play/), [`@rig-c/pixi` / `phaser` / `three`](/docs/adapters/) | rig-c's MIT. These packages link nothing from Esoteric Software and pose the rig with rig-c's own core, so no Spine Runtime is integrated. |
| Spine data in a product | an official Spine Runtime, or the Spine Web Player (which `rigc preview` loads) | The [Spine Runtimes License](https://esotericsoftware.com/spine-runtimes-license): integration is permitted under Section 2 of the Spine Editor License Agreement, or on the condition that each user of the product obtains their own Spine Editor licence, and redistribution includes that licence and copyright notice. |
| Spine data in the Spine editor | the Spine editor, to refine by hand | The [Spine Editor License Agreement](https://esotericsoftware.com/spine-editor-license). |
| rigc with `@esotericsoftware/spine-core` installed beside it | rigc's round-trip gate, `validate`, `preview`, `vote`, `bench`, `bonedist` | That install integrates a Spine Runtime, so the Spine Runtimes License applies there. The published `rig-c` package does not carry spine-core. |

Esoteric Software's licence pages read *Last updated April 5, 2025* when this page was written.

## Sample assets carry their own licences

| Assets | Licence | Source |
| --- | --- | --- |
| The painting and layers [Getting started](/docs/getting-started/) downloads | **CC BY-NC 4.0** — credit required, no commercial use; what you build from them carries that licence | [rig-c/exam `LICENSE`](https://github.com/rig-c/exam/blob/main/LICENSE) |
| The paintings, See-through inputs and layers in [rig-c/parts-examples](https://github.com/rig-c/parts-examples) | MIT | [`LICENSE`](https://github.com/rig-c/parts-examples/blob/main/LICENSE) |
| The trailer's painting, layers, sky, palm and rendered trailer | MIT | [rig-c/trailer `LICENSE`](https://github.com/rig-c/trailer/blob/main/LICENSE) |

The image models that generated those paintings, and See-through itself, have their own terms; each repository's `NOTICE.md` records them, and [rig-c/parts `NOTICE.md`](https://github.com/rig-c/parts/blob/main/NOTICE.md) collects See-through's. No rig-c package contains See-through code or weights.
