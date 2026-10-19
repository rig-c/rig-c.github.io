---
navLabel: Pose
title: "@rig-c/pose: put pose motion onto a rig-c rig"
description: "Turns a body-18 pose sequence into bone keys in rig-c's motion format, checked through rig-c's gate before anything is written."
summaryForLlms: "@rig-c/pose is a Bun CLI that cleans a body-18 joint-position sequence and retargets it onto a rig-c rig as gated, verified bone keys."
packageName: "@rig-c/pose"
packageVersion: 0.33.0
repoUrl: https://github.com/rig-c/pose
npmUrl: https://www.npmjs.com/package/@rig-c/pose
---
# @rig-c/pose

Pose moves a rig. It takes joint positions over time and writes them onto a rig-c rig as bone keys, and it checks those keys before it writes anything.

## What it is

A command-line tool, `rig-pose`, that turns a body-18 pose sequence into an animation in rig-c's motion format. In the rig-c toolchain, [core](/docs/core/) gates the rig, [parts](/docs/parts/) builds it, [play](/docs/play/) plays it, and pose moves it. Version 0.x is a prototype: the format, the commands and the output can change in any release before 1.0.

## When to use it

Use it when you already have joint positions (from a pose model, a dataset, or placed by hand) and a rig-c rig with limb chains, and you want an animation that follows them.

Do not use it to:

- **Get the poses.** It does not extract poses from video; how you get joint positions is up to you.
- **Build the rig.** The rig must have chains: a thigh with a shin below it, an upper arm with a forearm below it. [@rig-c/parts](/docs/parts/) builds such a rig from a painting. A rig whose arm is one bone is refused.
- **Animate hands, fingers or depth.** It works in 2D. A limb pointing at the camera foreshortens, and the rig matches its direction, not its length.

## What it solves

A pose model reads each frame alone, so joints shake from frame to frame, and every key would carry that shake. Mapping picture angles onto bones also has traps: setup rotations, and parents that turn their children. Pose cleans the sequence once, where it can be inspected, and then refuses to write keys that do not land where the pose asked.

## What you get

- A cleaned `rig-pose-sequence/1` file that carries a `cleaned` record of what was done.
- A motion file with the new animation, for the rig's motion spec.
- With `--report`, a `rig-pose-report/1` JSON file of everything the run found.
- With `--build`, the gated build, which `rigc preview` can play.
- From `compare`, a `rig-pose-compare/1` report and an optional PNG sheet.

## How it works

1. **Clean.** `rig-pose clean` removes spikes, fills low-score or occluded joints from their neighbours, smooths each joint, and holds joints that have stopped. `retarget` reads only a sequence that `clean` wrote. COCO-17 input is converted here with `--coco`.
2. **Map.** You write a map that says which bones carry which joints, chain by chain.
3. **Retarget.** For every frame and every mapped bone, the bone is turned so it points the way its segment points in the picture, minus its setup angle and its parent's turn.
4. **Check.** rig-c's gate must be green with the rig as it is and with the animation in. Every mapped bone must land on its asked angle on every frame, posed by rig-c's own poser. Hinges must bend only one way. If any check fails, nothing is written and every reason is printed.
5. **List what it cannot decide.** Lines such as `HOLD`, `END-ON` and `IDLE-DROPPED` name what you should look at.

```sh
bun add @rig-c/pose
rig-pose retarget --rig out/rig --map map.json --sequence dance.pose.json --out motion.json --animation dance
```

## Key concepts

- **body-18**: the 18 joints the sequence uses (`nose`, `neck`, shoulders, elbows, wrists, hips, knees, ankles, eyes, ears); `r`/`l` are the subject's sides.
- **chain**: a limb in the map, as bones that descend from one another; bone *k* carries the segment from joint *k* to joint *k*+1.
- **lands**: a mapped bone, posed by rig-c's poser, is within 0.01° of the angle the pose asks for.
- **cleaned record**: the `cleaned` block `clean` writes into the sequence; `retarget` requires it.
- **alternates**: sets of slots switched together to show a second drawing for a pose bone rotation cannot carry.

## Go deeper

- [Try it](https://github.com/rig-c/pose#try-it) and the [wave example](https://github.com/rig-c/pose/tree/main/examples/wave), with no art and no video
- [Clean first](https://github.com/rig-c/pose#clean-first-rig-pose-clean)
- [What it does](https://github.com/rig-c/pose#what-it-does): every check and every listed line
- [The pose format](https://github.com/rig-c/pose#the-pose-rig-pose-sequence1) and [the map format](https://github.com/rig-c/pose#the-map-rig-pose-map1)
- [Alternate drawings](https://github.com/rig-c/pose#alternate-drawings-alternates)
- [Compare](https://github.com/rig-c/pose#compare-the-rigs-render-against-the-video)
- [What it does not do](https://github.com/rig-c/pose#what-it-does-not-do) and [Requirements](https://github.com/rig-c/pose#requirements)
- [CHANGELOG](https://github.com/rig-c/pose/blob/main/CHANGELOG.md) and the [npm page](https://www.npmjs.com/package/@rig-c/pose)
- `rig-pose --help` lists every flag.

<!-- SOURCES (not published)
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
