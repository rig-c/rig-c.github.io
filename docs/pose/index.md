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
