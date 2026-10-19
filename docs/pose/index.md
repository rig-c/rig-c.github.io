# @rig-c/pose

<p class="mod-role">Joint positions over time in — bone keys on a rig-c rig out, checked before they are written.</p>

<figure class="mod-hero">
  <div class="media">
    <video data-loop="the wave comparison" controls muted loop playsinline preload="metadata" poster="/assets/docs/pose-wave-poster.jpg" width="978" height="792" aria-label="Recorded video: on the left a stick-figure pose raising and waving its right arm; on the right Character 1 doing the same wave">
      <source src="/assets/docs/pose-wave.mp4" type="video/mp4">
      <img src="/assets/docs/pose-wave-peak.jpg" alt="Side by side at the top of the wave: the source pose's raised arm and Character 1's raised arm" width="978" height="792">
    </video>
  </div>
  <figcaption><span class="media-kind">Recorded video</span> Left: the source — 18 body joints over 3 s at 24 fps, the right arm raised and waved. Right: Character 1's rig playing the motion <code>rig-pose retarget</code> wrote from it, drawn by <code>rigc render</code>.</figcaption>
</figure>

<p class="mod-skip">Skip to <a href="#install">Install</a> · <a href="#inputs-and-outputs">Inputs and outputs</a> · <a href="#limits">Limits</a> · <a href="#go-deeper">Docs</a></p>

*This page follows Character 1 from the Family set: here it is given a motion. Every module works on its own; this order is one path, not a requirement.*

A pose model reads each frame alone, so joints shake from frame to frame, and every key would carry that shake. Mapping picture angles onto bones has traps of its own: setup rotations, and parents that turn their children. `rig-pose` cleans the sequence once, where it can be inspected, then turns each mapped bone to point along its segment — and refuses to write keys that do not land where the pose asked.

## How the wave reached Character 1

### What was carried, and what was not

The map names two chains: the **trunk** (hip to neck) on the `chest` bone, and the **right arm** (shoulder, elbow, wrist) on the two sleeve bones. Character 1's rig has no left-arm bones (no `sleeve_l` in its `rig.json`), so the map leaves that arm out, and the hand with the cup is not mapped either: it turns with the forearm.

| Track the rig received | From the pose | First key | Top of the wave |
| --- | --- | --- | --- |
| `sleeve_r0` rotate | shoulder → elbow | −3.7° | −114.7° |
| `sleeve_r1` rotate | elbow → wrist | 0.4° | −71.0° |
| `chest` rotate | hip → neck | 2.6° | 2.6° (held) |
| `hip` translate | hip | 0, 0 | 0, 0 (held) |

**Direction, not length.** Each bone points the way its segment points in the picture but keeps the rig's own length: the upper arm is 300 px in the pose and 267 units on the rig, the forearm 335 px and 303 units. That is why the raised cup ends up above the source's wrist dot.

<div class="compare">
  <figure><img src="/assets/docs/pose-keypoints.jpg" alt="Character 1's painting with 18 labelled body joints drawn over it" width="400" height="1142" loading="lazy"><figcaption>Where the wave starts: 18 body joints placed by hand on the painting (shoulders, hips, knees and ankles under the clothes marked occluded).</figcaption></figure>
  <figure><img src="/assets/docs/pose-wave-peak.jpg" alt="Side by side at the top of the wave: the source pose's raised arm in orange and Character 1's raised arm holding the cup" width="978" height="792" loading="lazy"><figcaption>The top of the wave, t = 0.50 s. Orange is what the map carries; the rest of the skeleton has no bone to go to.</figcaption></figure>
</div>

### What it checked before writing

```
rig-pose clean: SPIKES 0 replaced
  JITTER mean |second difference| of y over 1207 joint-frame triple(s): 1.260 → 1.222 px/f² (3.1% lower)
rig-pose retarget:
  GATE   rigc build --profile spine-html: green — 52 assertions: 26 measured (26 passed, 0 failed), 26 skipped, 0 not in profile "rig-play"
  LAND   bone "sleeve_r0" aim — worst |reached − asked| 0.000652° at frame 65 (t=2.708s); the tolerance is 0.01°
  LAND   bone "sleeve_r1" aim — worst |reached − asked| 0.000983° at frame 4 (t=0.167s); the tolerance is 0.01°
  FOLD   rigc render --folds at 24 fps: no mesh folds
  wrote wave.motion.json — animations: idle, wave
```

The rig is built with the new animation and gated before anything is written; every mapped bone, posed by rig-c's own poser, has to land within 0.01° of what the pose asked on every frame. The run also says what it left out: 26 `IDLE-DROPPED` lines name the breathing, hair and skirt tracks that were not carried into `wave` — which is why only the arm moves.

The joints were placed by hand on the painting (the way the guide's `docs/KEYPOINTS.md` describes), and the wave itself comes from the getting-started guide's `scripts/wave.ts`. Next, [Core](/docs/core/) is the compiler that gated this build, and [Review](/docs/review/) is where a person checks a motion like this one against footage.

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
bunx rig-pose retarget --rig out/rig --map map.json --pose wave.pose.clean.json --out wave.motion.json --name wave --build wave-build
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
