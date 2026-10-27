---
navLabel: Performance
title: Runtime performance — measured costs and unresolved results
description: Historical Play package costs through the legacy Pixi adapter, with device, workload, CPU and GPU boundaries, unresolved results and reproducible methodology.
summaryForLlms: Historical Play 1.17.1 versus 1.18.0 through the legacy Pixi snapshot adapter. M4 CPU gains and a separate RTX recapture retain their own decision rules; raptor/100 repeated positive costs and unresolved results remain explicit. No presentation/FPS or current-renderer claim.
repoUrl: https://github.com/rig-c/adapters
---
# Runtime performance

What does one character cost, or a hundred? These measurements compare **published Play 1.17.1 (A) with 1.18.0 (B)** through the same legacy Pixi snapshot adapter. Some pose and combined CPU costs fell; submission and GPU outcomes depend on the workload and capture. They do not establish an FPS gain or a budget for every rig.

The sources are the frozen [original hardware report (#62)][report62] and [separate RTX recapture (#64)][report64], with [#62 JSON][json62] and [#64 JSON][json64]. These are historical package comparisons, not measurements of today's releases, every renderer, DOM/canvas mode or a direct-buffer path. They do not isolate a core-only change. Play bundles core: 1.17.1 declares build-time core 2.67.0, with embedded sources matching 2.70.0; 1.18.0 declares and matches 2.72.0. Installing another core beside it does not replace that bundled code.

## What was measured

| Capture | Device and browser | Date and conditions |
| --- | --- | --- |
| #62 Mac | Apple M4, 10 GPU cores; ANGLE Metal; Chromium 151.0.7922.34; macOS 26.6.1 (25G76), Darwin 25.6.0 | Calendar date absent from the published receipt. Other measurement/build sessions excluded during capture; normal desktop background work remained. |
| #62 Windows | NVIDIA GeForce RTX 4070 Ti; ANGLE D3D11; driver 32.0.16.1088; Chromium 155.0.8059.80; Windows 11 Pro 10.0.26300 | JSON host observations: **2026-10-26, 18:14:51–18:16:17 UTC**. An unrelated application used the measured display GPU at 22% before / 21% after, plus desktop composition. **Not an uncontended RTX baseline.** |
| #64 Windows | RTX 4070 Ti; ANGLE D3D11; driver 32.0.16.1088; Chromium 155.0.8059.80 | Capture date absent from the published receipt. Adapter identity pinned per launch, host observations retained privately; **no quiet or idle claim**. Mac was **not recaptured**: admission refused before a timing browser launch. |

Both workloads play `walk`, at **1 and 100 independent instances**, on a shared **1800 × 640 canvas, DPR 1**, with 60 warmup and 180 measured paired frames per workload per launch. The fixture identity and size below come from the report JSON; bone/mesh/triangle counts are not supplied there. Byte size identifies these inputs, not a general measure of rig complexity.

| Fixture | Compiled model bytes | Model SHA-256 |
| --- | ---: | --- |
| spineboy | 748,024 | `06bb683060a3e38866718885b78d295c2aa246739ff79efddb22bd7332dd8919` |
| raptor | 917,106 | `4b02193c4100e1da392929b409f4b12806c50d79aca7d8bc3738ad83a5aa18fc` |

The fixtures use rigc `v2.64.1` and upstream Spine examples at `38ddb1a0652c2e3473e8487ebd88b4b291ad9a7e` ([input metadata][json62]). Wind-wave was withdrawn, not replaced by another workload.

**Read the clocks separately.** `poseMs` is CPU posing; `submitMs` is CPU render submission, including query instrumentation and possible driver back-pressure; `cpuMs` is combined CPU work. `gpuMs` comes from asynchronous per-arm WebGL timer queries when available. Whole-frame `gl.finish()` completion is CPU wall time, not GPU-only execution. **Presentation, input-to-present latency and FPS were not measured.** CPU and GPU deltas cannot be converted into FPS. See the [same-frame timing boundaries][timing].

## Original capture: M4 and contended RTX

#62 ran AA1, AA2, AB1, AB2 in fresh headful launches. A/A compares old/old; A/B compares old/new, alternating AB/BA within each frame. A gain needs both paired A/B medians below the negative maximum absolute A/A p05/p95 envelope. All values here are **milliseconds**, copied to six decimals; slash-separated numbers are AB1 / AB2, not a confidence interval.

| M4 workload | A combined CPU p50 | B combined CPU p50 | Paired B − A p50 | Verdict |
| --- | --- | --- | --- | --- |
| spineboy / 1 | 0.125000 / 0.130000 | 0.080000 / 0.085000 | −0.055000 / −0.050000 | Gain outside A/A envelope |
| spineboy / 100 | 8.635000 / 9.800000 | 6.230000 / 6.945000 | −2.535000 / −2.970000 | Gain outside A/A envelope |
| raptor / 1 | 0.210000 / 0.225000 | 0.175000 / 0.190000 | −0.045000 / −0.050000 | Gain outside A/A envelope |
| raptor / 100 | 13.845000 / 13.520000 | 13.235000 / 12.935000 | −0.620000 / −0.630000 | Unresolved |

Pose CPU gains resolve for those same first three M4 workloads. **M4 raptor/100 pose, every M4 submission delta and every M4 GPU delta remain unresolved. Every Windows #62 metric remains unresolved**: no improvement repeats beyond its A/A envelope. That does not prove equal performance or no poser benefit. Background load remains part of the RTX capture's limit. The [full tables][report62] retain the individual pose, submission and GPU costs, envelopes and both repeats; separate column medians need not subtract to the paired median.

## RTX recapture: gains and repeated positive costs

#64 rebuilt the merged instrument at `78e696b41fc07552a4861dde84cd8c85148cb8c4` and interleaved AA1 AB1 AA2 AB2 AA3 AB3. Unresolved finite intervals or mixed A/B signs triggered the predeclared extension to six pairs. Each launch contributes its paired median; AA and AB get separate mean ± t × sampleSD/√n intervals. Gain requires AB upper < 0, AB upper < AA lower and every AB launch median < 0.

Stage 3 had **6 gain / 10 unresolved** rows; stage 6 had **8 gain / 8 unresolved**. These nominal descriptive 95% intervals do not guarantee sequential or family-wise coverage after adaptive looks and multiple comparisons. Added launches narrowed 25 intervals, widened 4 and left 3 unchanged. **The decision statistic changed:** applying #62's legacy envelope rule to these same rows yields only **one gain at each stage**, spineboy/100 pose. The counts cannot show an apples-to-apples hardware, noise or code improvement over #62.

Below are all stage 6 outcomes. Values are **B − A milliseconds, mean of six launch medians [descriptive 95% interval], rounded to nine decimals**, as in the report. **G** is gain under its posted rule; **U** preserves the reader's unresolved verdict.

| Workload | Metric | Mean [lower, upper] ms | Verdict |
| --- | --- | --- | --- |
| spineboy / 1 | Pose CPU | −0.040000061 [−0.043318665, −0.036681457] | G |
| spineboy / 1 | Submission CPU | 0.000000000 [0.000000000, 0.000000000] | U |
| spineboy / 1 | Combined CPU | −0.044166664 [−0.050300811, −0.038032517] | G |
| spineboy / 1 | GPU | −0.003461333 [−0.005792260, −0.001130406] | G |
| spineboy / 100 | Pose CPU | −2.327500045 [−2.444536837, −2.210463254] | G |
| spineboy / 100 | Submission CPU | 0.002500017 [−0.050050417, 0.055050452] | U |
| spineboy / 100 | Combined CPU | −2.254999995 [−2.421195607, −2.088804384] | G |
| spineboy / 100 | GPU | 0.002218667 [0.000367736, 0.004069597] | U |
| raptor / 1 | Pose CPU | −0.015833318 [−0.021967501, −0.009699136] | G |
| raptor / 1 | Submission CPU | 0.000000020 [−0.000000031, 0.000000071] | U |
| raptor / 1 | Combined CPU | −0.015833318 [−0.021967501, −0.009699136] | G |
| raptor / 1 | GPU | −0.034304000 [−0.064229862, −0.004378138] | U |
| raptor / 100 | Pose CPU | −0.125833352 [−0.230430851, −0.021235854] | G |
| raptor / 100 | Submission CPU | +0.672499955 [+0.583344255, +0.761655655] | U |
| raptor / 100 | Combined CPU | +0.529166679 [+0.402301365, +0.656031993] | U |
| raptor / 100 | GPU | −0.013824000 [−0.075801845, 0.048153845] | U |

**Raptor/100 submission and combined CPU have repeated positive cost observations.** All six A/B launch medians are positive and their intervals lie above the A/A intervals. The posted rule named gains only: these observations do **not** retrofit a predeclared regression verdict or change U to another label. Conversely, a negative GPU interval alone does not establish a gain: raptor/1 still fails the full rule. The [complete #64 report][report64] preserves stage 3, stage 6, A/A intervals and all exclusions. No new Mac timing or idle RTX baseline follows from this recapture.

## Fixture integrity and reproduction

The historical #62 manifest hashes were checked, but its declarations did not prove which bytes the receiving browser consumed. The [merged fixture instrumentation (#65)](https://github.com/rig-c/adapters/pull/65), documented in [receiving-host fixture integrity][fixtures], now verifies all 18 bodies before controls/timing and makes both players and the oracle consume those verified Blobs. #64 records those per-launch measurements. This closes that consumption gap for the recapture; it does **not** retroactively browser-verify #62 or make legacy fixture generation immutable across toolchains. Keep the exact recorded hashes with any reproduction.

- [#62 protocol and commands][repro62] cover frozen installation, oracle and fixture preparation, published-player site preparation, precheck, historical Mac capture and summary, and the native Windows task route. Its host-window instructions describe that historical run, not a new scheduling requirement.
- [#64 protocol and commands][report64] specify the interleaved 3/6 schedule, controls, stopping rule and recovered-reader replay. **Its Windows scheduler, capture config and frozen reader copies are private.** The old public Mac/Windows runners still schedule 2/2 and cannot produce this v2 capture; the printed private task command is not a public turnkey reproduction.
- [Timing boundaries][timing] and [fixture controls][fixtures] explain what is checked before sampling and what the clocks exclude. Neither preparation nor a correctness test is a new hardware measurement. No benchmark was run for this guide.

For integration, return to [Play](/docs/play/) or [Adapters](/docs/adapters/). Use these workload- and version-bound costs as recorded evidence; measure your own rig and presentation path before choosing a character budget.

[report62]: https://github.com/rig-c/adapters/blob/cccc84136c0342312c4d353b46bae9d8c130627f/bench/HARDWARE-62.md
[report64]: https://github.com/rig-c/adapters/blob/cccc84136c0342312c4d353b46bae9d8c130627f/bench/HARDWARE-64.md
[json62]: https://github.com/rig-c/adapters/blob/cccc84136c0342312c4d353b46bae9d8c130627f/bench/HARDWARE-62.json
[json64]: https://github.com/rig-c/adapters/blob/cccc84136c0342312c4d353b46bae9d8c130627f/bench/HARDWARE-64.json
[repro62]: https://github.com/rig-c/adapters/blob/cccc84136c0342312c4d353b46bae9d8c130627f/bench/HARDWARE-62.md#protocol-and-reproducibility
[timing]: https://github.com/rig-c/adapters/blob/cccc84136c0342312c4d353b46bae9d8c130627f/bench/TIMING.md#same-frame-paired-mode
[fixtures]: https://github.com/rig-c/adapters/blob/cccc84136c0342312c4d353b46bae9d8c130627f/bench/FIXTURE-BYTES.md

<!-- SOURCES (not published)
- All hardware figures: adapters@cccc84136c0342312c4d353b46bae9d8c130627f bench/HARDWARE-62.md/.json and HARDWARE-64.md/.json. Stage 6 numbers copy the Markdown's nine-decimal rounding, including original U labels on repeated positive costs. #62 table copies its six-decimal Mac combined CPU rows.
- #62 JSON mac.input.dependencies and assets: embedded/declared core, fixture build tag/ref, animation, compiled-model lengths/hashes; windowsMachine.observations dates are UTC. Neither Mac #62 nor #64 public JSON supplies a capture date; no date inferred from publication or commit time. These receipts do not supply per-fixture bone/mesh/triangle counts.
- Associated methodology only: TIMING.md Same-frame paired mode defines CPU/query/completion boundaries; FIXTURE-BYTES.md describes actual receiving-byte/Blob/reader controls and unchanged 2/2 helpers. #64 Frozen source names merged 78e696b41fc07552a4861dde84cd8c85148cb8c4 (#65), private scheduler and no Mac recapture.
- Do not carry #62's old quiet-window recommendation forward as an admission gate. #64 repeats/interleaves on recorded host conditions, uses a different decision statistic, and establishes no idle baseline. No current-release, all-renderer, FPS, core-only or regression-verdict promotion.
-->
