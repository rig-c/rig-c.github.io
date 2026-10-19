---
navLabel: Pose
title: "@rig-c/pose: put pose motion onto a rig-c rig"
description: "Turns a body-18 pose sequence into bone keys in rig-c's motion format, checked through rig-c's gate before anything is written."
summaryForLlms: "@rig-c/pose is a Bun CLI that cleans a body-18 joint-position sequence and retargets it onto a rig-c rig as gated, verified bone keys."
packageName: "@rig-c/pose"
packageVersion: 0.35.0
repoUrl: https://github.com/rig-c/pose
npmUrl: https://www.npmjs.com/package/@rig-c/pose
---
# @rig-c/pose

<p class="mod-role">Joint positions over time in — bone keys on a rig-c rig out, checked before they are written.</p>

<figure class="mod-hero">
  <div class="media">
    <video data-loop="the swing comparison" controls muted loop playsinline preload="metadata" poster="/assets/docs/pose-swing-poster.jpg" width="608" height="792" aria-label="Recorded video: on the left a stick-figure pose swinging its right arm loosely; on the right Character 1 swinging her coffee cup the same way">
      <source src="/assets/docs/pose-swing.mp4" type="video/mp4">
      <img src="/assets/docs/pose-swing-poster.jpg" alt="Side by side: the source pose's hanging arm and Character 1 holding her cup" width="608" height="792">
    </video>
  </div>
  <figcaption><span class="media-kind">Recorded video</span> Left: the source — 18 body joints over 3 s at 24 fps, the right forearm swinging the cup like a pendulum about the elbow. Right: Character 1's rig playing the motion <code>rig-pose retarget</code> wrote from it, drawn by <code>rigc render</code>.</figcaption>
</figure>

<p class="mod-skip">Skip to <a href="#install">Install</a> · <a href="#inputs-and-outputs">Inputs and outputs</a> · <a href="#limits">Limits</a> · <a href="#go-deeper">Docs</a></p>

{{thread:pose}}

A pose model reads each frame alone, so joints shake from frame to frame, and every key would carry that shake. Mapping picture angles onto bones has traps of its own: setup rotations, and parents that turn their children. `rig-pose` cleans the sequence once, where it can be inspected, then turns each mapped bone to point along its segment — and refuses to write keys that do not land where the pose asked.

## How the swing reached Character 1

### A motion that fits the rig

The first try was a full arm-over-the-head wave. It passed every check — the gate, the landing tolerance, the fold test — and the render still showed the sleeve torn open at the shoulder once the arm went overhead. A pass is structural, so the motion has to suit the character and the rig: here, the coffee cup she is already holding, swung loosely like a pendulum from the elbow, two swings in three seconds so the loop closes.

Getting that right took measuring rather than looking. Swung outward, the arm uncovered the edge of the trousers it hides in the painting, which See-through had to synthesize; swung inward, it slid under the shirt, because the arm part is drawn beneath `topwear`. And the hand-placed joints did not sit exactly on the rig's bones, so even "at rest" the retarget turned the upper arm 4.5° and the chest 2.6° away from how the rig was drawn. So the rest pose was aligned first — every track reads 0 at rest — and then the arm part was rendered alone and with the whole rig, counting, frame by frame, how many of its pixels end up covered by another part:

| Animation | Arm pixels covered (rim excluded), worst frame |
| --- | --- |
| `idle`, as the rig was drawn | 926 |
| the previous swing (upper arm and forearm, rest not aligned) | 1,854 |
| this swing (forearm only, aligned rest) | 1,242 |

What the extra ~300 px are: a thin strip along the inside edge of the sleeve, where its mesh meets the shirt. The sleeve and cuff stay in front.

The outward side got the same treatment. Counting pixels on the body side of the resting arm that turn into bare background — a hole in the trousers behind it — a ±6° swing opened up to 5,173 px at its outermost frame; with the outward half cut to 30% of the inward one, the worst frame opens 1,124 px, and side by side at twice the size it reads like the resting pose.

The map names two chains: the **trunk** (hip to neck) on the `chest` bone, and the **right arm** (shoulder, elbow, wrist) on the two sleeve bones. The rig has no left-arm bones (no `sleeve_l` in its `rig.json`), so that arm stays as painted, and the hand with the cup is not mapped: it turns with the forearm.

| Track the rig received | From the pose | Range over the loop |
| --- | --- | --- |
| `sleeve_r0` rotate | shoulder → elbow | 0° (held) |
| `sleeve_r1` rotate | elbow → wrist | −1.2° (outward) to 6.0° (inward) |
| `chest` rotate | hip → neck | 0° (held) |
| `hip` translate | hip | 0, 0 (held) |

**Direction, not length.** Each bone points the way its segment points in the picture but keeps the rig's own length (upper arm 300 px in the pose, 267 units on the rig; forearm 335 px and 303 units).

<div class="compare">
  <figure><img src="/assets/docs/pose-keypoints.jpg" alt="Character 1's painting with 18 labelled body joints drawn over it" width="400" height="1142" loading="lazy"><figcaption>Where the motion starts: 18 body joints placed by hand on the painting (joints under the clothes marked occluded).</figcaption></figure>
  <figure><img src="/assets/docs/pose-swing-ends.jpg" alt="Two side-by-side frames: the swing at its outermost and its innermost, source pose and rig each" width="1216" height="792" loading="lazy"><figcaption>The two ends of the swing (t = 0.17 s and 2.79 s). Orange is what the map carries; the rest of the skeleton has no bone to go to.</figcaption></figure>
</div>

### What it checked before writing

```
rig-pose retarget: 73 frame(s), 3.000s — 4 track(s); min-score 0.3, flip off, short off, bends refuse (tolerance 0°)
  GATE   rigc build --profile spine-html: green — 52 assertions: 26 measured (26 passed, 0 failed), 26 skipped, 0 not in profile "rig-play"
  LAND   bone "sleeve_r0" aim — worst |reached − asked| 0.0000764° at frame 0 (t=0.000s); the tolerance is 0.01°
  LAND   bone "sleeve_r1" aim — worst |reached − asked| 0.000574° at frame 2 (t=0.083s); the tolerance is 0.01°
  FOLD   rigc render --folds at 24 fps: no mesh folds
  wrote swing.motion.json — animations: idle, swing
```

The rig is built with the new animation and gated before anything is written; every mapped bone, posed by rig-c's own poser, has to land within 0.01° of what the pose asked on every frame. The run also says what it left out: 26 `IDLE-DROPPED` lines name the breathing and hair tracks that were not carried into `swing` — which is why only the arm moves. And then someone still has to look: the torn first try passed all of these lines.

The joints were placed by hand on the painting (the way the getting-started guide's `docs/KEYPOINTS.md` describes); the swing is a three-second test motion made from them, not footage. Next, [Core](/docs/core/) is the compiler that gated this build, [Review](/docs/review/) is where a person checks a motion against footage, and [Play](/docs/play/) runs this one live.

## How it works

1. **Clean.** `rig-pose clean` removes spikes, fills low-score or occluded joints from their neighbours, smooths each joint and holds joints that have stopped. `retarget` reads only a sequence `clean` wrote; COCO-17 input is converted with `--coco`.
2. **Map.** You write which bones carry which joints, chain by chain.
3. **Retarget.** For every frame and every mapped bone, the bone is turned so it points the way its segment points, minus its setup angle and its parent's turn.
4. **Check.** The gate must be green with and without the animation, every mapped bone must land on its angle, hinges must bend one way; otherwise nothing is written and every reason is printed.
5. **Say what it cannot decide.** Lines such as `HOLD`, `END-ON` and `IDLE-DROPPED` name what to look at.

**Key terms.** *body-18* — the 18 joints the sequence uses; `r`/`l` are the subject's sides. *Chain* — a limb in the map, as bones that descend from one another. *Lands* — a mapped bone within 0.01° of the angle the pose asks for. *Cleaned record* — the block `clean` writes into the sequence, which `retarget` requires.

## Install

```sh
npm i -D @rig-c/pose
bunx rig-pose retarget --rig out/rig --map map.json --pose swing.pose.clean.json --out swing.motion.json --name swing --build swing-build
```

Needs [Bun](https://bun.sh) 1.2 or later on `PATH`; rig-c comes as a dependency.

## Inputs and outputs
| In | Out |
| --- | --- |
| A body-18 pose sequence, `rig-pose-sequence/1` (COCO-17 with `--coco`) | A cleaned sequence carrying its `cleaned` record (`rig-pose clean`) |
| A rig built with rig-c: the `rig/` directory with `rig.json` and `motion.json` | A motion spec (`--out`, e.g. `motion.json`) with the bone keys |
| A map, `rig-pose-map/1` — which bones carry which joints | A JSON report, `rig-pose-report/1` (`--report`), and a gated build (`--build`) |
| For `compare`: a reference and a render sequence on one time base | `compare.json` and a `compare.png` sheet, differences per body unit, worst first |

## Limits
- **"0.x is the prototype."** The format, the command and the output can change in any release until 1.0 (README, intro).
- **Does not extract poses from video**: the input is joint positions, from a pose model, a dataset or by hand (README §"What it does not do").
- **2D only — does not turn the body**: a segment pointing at the camera foreshortens and "the rig cannot"; the direction is matched, not the length (README §"What it does not do").
- **No front/behind order per segment, no blinks or mouth shapes**, and cloth physics is not fitted to the reference (README §"What it does not do").
- **No hands or fingers** — there are no bones for them yet (README §"What it does not do").
- No importable API: the supported surface is the `rig-pose` command (README §"Requirements").

## Go deeper
- [Try it](https://github.com/rig-c/pose#try-it) — a self-contained wave example in the repository
- [Clean first: `rig-pose clean`](https://github.com/rig-c/pose#clean-first-rig-pose-clean)
- [What it does](https://github.com/rig-c/pose#what-it-does)
- [The pose: `rig-pose-sequence/1`](https://github.com/rig-c/pose#the-pose-rig-pose-sequence1)
- [The map: `rig-pose-map/1`](https://github.com/rig-c/pose#the-map-rig-pose-map1)
- [Compare: the rig's render against the video](https://github.com/rig-c/pose#compare-the-rigs-render-against-the-video)
- [What it does not do](https://github.com/rig-c/pose#what-it-does-not-do)
- [npm](https://www.npmjs.com/package/@rig-c/pose) · [CHANGELOG](https://github.com/rig-c/pose/blob/main/CHANGELOG.md)
<!-- SOURCES (not published)
- outward cut (2026-10-20, owner saw the trousers tear on the outward swing): swing.py out_k 0.3; body-side holes (scripts/holes.py, one fixed viewport) max 5173 -> 1124 px; all coverage rows re-measured on one fixed viewport: idle 926, previous 1854, this 1242
- swing case, measured (2026-10-20, after owner review that the arm still slid under the torso): rest aligned with swing.py off1 -1.19, off2 0.37, off0 2.553 (all tracks 0 at rest); upper 0, forearm +-6 deg; arm coverage measured with rigc render --slot handwear_r vs the full render (scripts/core_hidden.py): idle max 926, #15 swing max 1828, this swing max 1218 core px
- swing case (owner's idea, 2026-10-19; range cut after owner review: the arm slid under topwear): swing.py, upper arm +-3 deg, forearm +-10 deg trailing 0.18 s, centred 3 deg toward the body, period 1.5 s; outward swing uncovered the synthesized trouser edge, inward slid under topwear (handwear_r is slot 3, topwear slot 5 in rig.json); ends checked at 1400 px; track ranges and GATE/LAND/FOLD lines from the run
- lift case (superseded; replaced the wave, which tore the sleeve at the shoulder; owner review 2026-10-19): lift.py over the hand-placed keypoints, forearm 40 deg, upper arm 6 deg; GATE/LAND/FOLD lines and track values from the run; frames inspected at 2000 px
- wave case (superseded): @rig-c/pose 0.35.0, rig-c 2.61.0, rig family/roa/out/rig @c239b09; verbatim clean/retarget lines and track table from the case run (2026-10-19); keypoints hand-placed; wave from rig-c/getting-started scripts/wave.ts
- retarget flags --pose / --name / --build: the case run's command (and getting-started step 9)

Read at release commit 6ddcdb8 ("release: v0.33.0"); origin/main is 4 commits ahead (88bc69e).
- published version 0.33.0 — `npm view @rig-c/pose version`; package.json "version": "0.33.0" @6ddcdb8
- puts motion from a pose onto a rig; joint positions from video, dataset, or by hand; body-18 to bone keys in rig-c's motion format; checked before anything is written — README.md:3
- 0.x is the prototype; format, command, output can change until 1.0 — README.md:5
- toolchain roles core/parts/play/pose — README.md:7
- CLI name rig-pose; Bun >=1.2; dependency rig-c — package.json "bin", "engines", "dependencies"; README.md:505
- does not extract poses from video; input is joint positions — README.md:523
- 2D only; direction matched, length not; leg-scale exception — README.md:524
- no hands/fingers bones — README.md:527
- map needs chains (thigh/shin, upper arm/forearm); one-bone arm refused MAP_*; parts builds such a rig — README.md:23
- pose model reads each frame alone, shake carried by every key; clean takes it out once, where it can be inspected — README.md:31
- retarget reads only a sequence clean wrote — README.md:31; `rig-pose --help` "clean (required before retarget; rig-c/pose#67)"
- clean steps: spikes, occlusion (state not observed or score < 0.3 takes 3-frame median), Savitzky–Golay smoothing, floor (loop only), hold — README.md:35-39; hold of stopped joints README.md:56
- each step printed with its figures — README.md:33
- cleaned record written into sequence — README.md:43-50; `--help` "--out ... carrying the record of what was done ("cleaned")"
- COCO-17 via clean --coco — README.md:312; `--help` "--coco"
- map: which bones carry which joints, you write it — README.md:326
- bone turned: picture angle, y-up flip, minus setup angle, less parent's turn; pelvis midpoint travel moves hip — README.md:114
- nothing written until every check passes; gate green as-is and with animation (RIG_GATE_BASE, RIG_GATE); lands 0.01° posed by rig-c's poser (POSE_LANDS); bend one way (POSE_BEND_ONE_WAY) — README.md:116-122
- lists what run cannot decide: HOLD, END-ON lines — README.md:126,131,133; IDLE-DROPPED — README.md:251
- exit 1 refused, every reason printed, nothing written — README.md:287
- --report writes rig-pose-report/1 — README.md:170
- --build gated build; rigc preview --candidate plays it — README.md:16,19
- outputs motion json + report — README.md:19
- compare report rig-pose-compare/1 — README.md:487; --sheet compare.png — README.md:431
- compare: same detector on both sides, reference vs render — README.md:434
- retarget example command — README.md:107; --sequence/--animation are the names (with --pose/--name aliases) — README.md:110
- install line: package name @rig-c/pose, bin rig-pose, publishConfig public — package.json @6ddcdb8 (README has no install line)
- body-18 joint list; r/l subject's sides — README.md:306
- chain bone k carries joint k to k+1; bones descend — README.md:338; README.md:23
- alternates: set of slots switched together; for poses bone rotation cannot carry — README.md:363
- wave example runs with nothing else, no art; in repo not npm package — README.md:13; examples/wave/README.md:3
- every flag in --help — README.md:287
- README anchors: headings at README.md:11,25,104,289,324,361,425,503,521
-->
