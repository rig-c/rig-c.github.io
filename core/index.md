# rig-c (`@rig-c/core`) — The Rig Compiler

**AI-authored 2D rigging and animation, verified before it is written.**

- **npm package**: `rig-c` (aliases: `@rig-c/core`, `spine-rigc`), latest `2.61.0`
- **CLI executable**: `rigc`
- **Repository**: <https://github.com/rig-c/core>
- **License**: MIT (published package links no Spine runtime)

`rigc` is a deterministic rig compiler: a rig spec (`rig.json`), a motion spec (`motion.json`), and loose part PNGs go in; **Spine 4.3 skeleton data (`skeleton.json` + `skeleton.atlas`) and `skeleton.model.json` come out** — gated by 50 named assertions before a single byte is written to disk.

## Install

```sh
bunx rig-c --help    # run without installing
bun add -g rig-c     # install global 'rigc' command
bun add -d rig-c     # pin in a project
```

## CLI Commands & Capabilities

| You Have | You Run | You Get |
| --- | --- | --- |
| Part PNGs, `rig.json`, and `motion.json` | `rigc build` | `skeleton.json` + `skeleton.atlas` + `skeleton.model.json` — or a refusal named by rule, and **nothing on disk**. |
| The same, wanting packed textures | `rigc build --pack` | Every part arranged losslessly onto shared atlas pages (supports `--page-edges free` and `--pack-shape polygon`). |
| Pre-packed atlas from another tool | `rigc build --atlas-in` | Skeleton resolved against that atlas — or a named refusal, never a part that silently fails to draw. |
| A compiled rig | `rigc render` | Every animation rendered as PNG frames plus a labelled contact sheet (supports `--folds` and physics readouts). |
| A compiled rig and a geometry question | `rigc inspect` | Diagnostic overlay of bones, axes, mesh edges/hulls, bone weights, folded triangles, draw order, and world grid. |
| A compiled rig | `rigc preview` | Self-contained `.html` playing the rig in Spine's web player (when `@esotericsoftware/spine-core` is installed beside it). |
| 2 to 4 candidate rigs | `rigc vote` | Human A/B ballot page with verdicts recorded into a ledger. |
| A key-pose image and part PNGs | `rigc pose` | Spec coordinates where each loose part sits in the target key pose. |
| A key-pose image and an occluded rig | `rigc chainfit` | Fits occluded limb chains through the candidate's own draw order and hierarchy. |

## The 50-Assertion Gate & Structural Invariants

- **Validation is a structural invariant, never an option.** There is no `--no-validate` or `--emit-anyway` flag.
- **Two suppliers, one oracle**:
  1. Where `@esotericsoftware/spine-core` is installed (CI, repository clones, or optional dev install), `rigc` runs the full Spine 4.3 parser round-trip (`A00_ROUNDTRIP_PARSE`) plus 49 assertions.
  2. In the standalone published package (which links zero Spine runtime code), `rigc` runs its own validator over the model document and emitted text — 49 shared rules plus `A00_MODEL_READ` and `A00_MODEL_REGIONS_ON_PAGES` (52 total lines), held equal to the `spine-core` round-trip verdicts on every commit in CI by `verdict_gate`, `RC28`, and `core_gate` (pose tolerance `0`).
- **Byte-for-byte determinism (`A18_DETERMINISTIC_EMIT`)**: Every `build` compiles twice independently and compares the output byte for byte before emitting.
- **Named resolution everywhere**: Bone parents, slot bones, constraint targets, draw-order slots, and mesh vertex weights resolve by name, never silent raw array indices.
