# @rig-c/pose (`rig-pose`)

**Puts motion from a body-18 pose sequence onto a rig that [`rig-c`](/core/) built — checked before a key is written.**

- **npm package**: `@rig-c/pose`, latest `0.33.0` (0.x prototype)
- **CLI executable**: `rig-pose`
- **Repository**: <https://github.com/rig-c/pose>
- **License**: MIT

The motion is joint positions over time — from a video detector, a motion dataset, or points placed by hand. `@rig-c/pose` cleans detector jitter and spikes at the sequence level, retargets each limb chain onto `rig-c` bone keys (`rigc-motion/1`), poses the compiled rig through `rig-c`'s own poser to verify every bone lands on its target angle, and emits a structured diagnostic report (`rig-pose-report/1`).

## Install & Quick Try

```sh
bun add -d @rig-c/pose rig-c

# Clean a raw detector pose sequence first
bunx rig-pose clean --pose dance.scan.json --out dance.pose.json --loop

# Retarget onto a rig-c rig and emit a gated build + report
bunx rig-pose retarget \
  --rig out/rig \
  --map map.json \
  --pose dance.pose.json \
  --out dance.motion.json \
  --name dance \
  --build dance-build
```

## Step 1: `rig-pose clean` (Mandatory Sequence Hygiene)

`retarget` refuses any pose sequence that lacks a `rig-pose-clean/1` record (`POSE_NOT_CLEANED`). `clean` executes five deterministic passes:

1. **Spikes (`SPIKE`)**: Replaces any joint jumping more than `0.2` trunk lengths from its 5-frame median.
2. **Occlusion (`OCCLUDED`)**: Replaces joints not marked `observed`/`inferred` or scored below `0.3` with their 3-frame median.
3. **Savitzky–Golay Smoothing**: Quadratic filter over `--legs` frames (default `5`) for hips/knees/ankles and `--rest` frames (default `7`) for other joints.
4. **Floor & In-Place Loop (`--loop`)**: Aligns lowest ankle over the cycle and declares `"travel": "in-place"`.
5. **Stillness Hold (`HOLD`)**: Locks joints whose median speed stays below `--hold-speed` (`0.015` trunk lengths/frame) and within `--hold-reach` (`0.03`) for at least `0.5s`, cross-fading across 6-frame ramps.

### Measured Jitter Reduction on Reference Fixtures

| Clip | Mode | Jitter Reduction | Comparison vs. Hand-Cleaned Reference |
| --- | --- | --- | --- |
| `dance-a` (13 s non-loop) | defaults | **−42%** (`7.91 -> 4.62 px/f²`) | Hand-cleaned: `4.62`; positions within `0.071 px` |
| `walk-a` (1 gait cycle) | `--loop` | **−66%** | Within `0.001 px/f²` outside the arms |
| `run-a` (1 gait cycle) | `--loop` | **−53%** | Matches hand-cleaned reference |
| `walk-b` (90 frames, held out) | defaults | **−67%** | Target bar: `−30%` |
| `run-b` (90 frames, held out) | defaults | **−75%** | Target bar: `−30%` |

## Step 2: `rig-pose retarget` Gate & Diagnostics

Nothing is written unless every hard gate passes:

| Check | Refusal Code | Requirement |
| --- | --- | --- |
| Base rig & retargeted rig pass `rigc build` | `RIG_GATE_BASE`, `RIG_GATE` | All 50 compiler assertions pass before and after adding the animation. |
| Every mapped bone lands on target angle/scale/ankle | `POSE_LANDS` | Posed by `rig-c`'s poser and measured within `0.01°` / `0.01` units on every frame. |
| Hinges bend only in their anatomically valid direction | `POSE_BEND_ONE_WAY` | Elbows and knees stay on the rest pose's bend side (or clamp with `--bends clamp`). |
| Every mapped point has valid data | `POSE_POINT_NEVER_GOOD` | Each required joint is good on at least one frame. |
| Map resolves against rig hierarchy | `MAP_*` | Named bones exist and chains descend parent-to-child. |

And the diagnostic report (`<out>.report.json`, consumed by [`@rig-c/review`](/review/) and agents) records `HOLD`, `SHORT`, `END-ON`, `FOLD`, `POSTURE`, `FEET`, `STANCE`, `SHEAR`, `SEAM_OVER_MOTION` (`seams` + `seamPairs` with `--parts`), `NOD` loop closure, and alternate-drawing `SWITCH`/`UNCOVERED` demands.
