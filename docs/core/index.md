# rig-c core: the rig compiler

rigc turns loose part PNGs and two small JSON files into Spine 4.3 skeleton data. It checks the result against a list of named assertions first, and writes nothing if any of them fails.

## What it is

rigc is a rig compiler: a rig spec and a motion spec in, skeleton data out. It was built so AI agents can author rigs and check their own work, and it ships as an agent skill. On npm it is `rig-c`; `@rig-c/core` is the same package under the toolchain's scope, and the command it installs is `rigc`.

## When to use it

Use it when you want Spine skeleton data generated from a spec and checked before it is written. The output loads in any Spine runtime and imports into the Spine editor, so the intended hand-off is: an AI drafts, a human refines in the editor.

Reach for a neighbour instead when:

- you start from one painting rather than finished part PNGs: [@rig-c/parts](/docs/parts/) produces the parts and rig specs, verified through rig-c;
- you have a body-18 pose sequence to put on a rig: [@rig-c/pose](/docs/pose/) writes the bone keys in rigc's motion format;
- you want to play the result in a browser without a Spine runtime: [@rig-c/play](/docs/play/) plays the `skeleton.model.json` that `rigc build` writes;
- a person needs to look at a build and leave feedback: [@rig-c/review](/docs/review/).

## What it solves

An agent authoring a rig cannot tell whether it succeeded, because Spine's JSON parser accepts a lot of nonsense silently. A constraint in the 4.2 shape simply vanishes. A `size:` that disagrees with the PNG collapses every UV. A four-number curve array yields NaN. Each of these loads clean, plays, and is wrong. rigc makes the failure legible: every failure is named by rule, and nothing reaches disk.

## What you get

- `skeleton.json` and `skeleton.atlas` in the Spine 4.3 format.
- `skeleton.model.json`, rigc's own compiled model, written beside them.
- A gate report, which names the profile it ran; `--report` also writes it as JSON.
- On failure: one line per failed rule, ending with `(see rigc guide <RULE>)`, and no files.

## How it works

1. **Measure the art.** rigc reads the PNGs themselves instead of trusting sizes you typed, so the skeleton and the atlas cannot drift apart.
2. **Compile two specs.** The rig spec (`rigc-rig/1`) holds structure: bones, slots in draw order, skins. The motion spec (`rigc-motion/1`) holds time: animations, tracks, keys.
3. **Gate.** The compiled rig is checked against named assertions. The default profile, `spine`, runs the 36 validity rules: is this valid Spine 4.3 that any runtime plays correctly? `--profile rig-play` runs all 50; the extra 14 are one renderer's and one canvas budget's policy, which is why they are opt-in.
4. **Write, or refuse.** Only a green gate writes `--out`.
5. **Look at it.** A green gate says nothing about the picture, so `render`, `inspect` and `check` show and compare what was built.

The published package links no Spine runtime. Install `@esotericsoftware/spine-core` beside it and the same `rigc` also runs the round trip through Spine's own parser, plus the commands that need it: `validate`, `preview`, `vote`, `bench` and `bonedist`. The Spine Runtimes License Agreement applies to that dependency wherever it is installed.

rigc runs on Bun 1.2.0 or later.

```bash
bun add -d rig-c
bun rigc build --rig rig.json --motion motion.json --out build/
bun rigc render --candidate build/
```

## Key concepts

- **Rig spec** — the structure file: bones, the slots array (the setup draw order) and skins.
- **Motion spec** — the time file, aimed at the rig by name.
- **Named assertions** — the rules the gate runs; each failure names its rule.
- **Profile** — which rulebook the gate checks against: `spine` (default) or `rig-play`.
- **`A00_ROUNDTRIP_PARSE`** — Spine's own parse; it runs only where spine-core is installed and reports SKIP elsewhere.
- **`ingest`** — `build` run backwards: a Spine 4.3 `skeleton.json` in, the two specs that rebuild it byte for byte out.

## Go deeper

- [README: What you get](https://github.com/rig-c/core#what-you-get) · [Install](https://github.com/rig-c/core#install) · [Install it into your agent](https://github.com/rig-c/core#install-it-into-your-agent)
- [README: First rig in ten minutes](https://github.com/rig-c/core#first-rig-in-ten-minutes)
- [README: Commands](https://github.com/rig-c/core#commands) and [Starting from a skeleton you already have](https://github.com/rig-c/core#starting-from-a-skeleton-you-already-have)
- [README: Licensing, stated plainly](https://github.com/rig-c/core#licensing-stated-plainly) and [NOTICE.md](https://github.com/rig-c/core/blob/main/NOTICE.md)
- [docs/AUTHORING.md](https://github.com/rig-c/core/blob/main/docs/AUTHORING.md) — the format guide; read it before writing a spec
- [docs/RIGGING.md](https://github.com/rig-c/core/blob/main/docs/RIGGING.md) · [docs/MOTION.md](https://github.com/rig-c/core/blob/main/docs/MOTION.md) · [docs/FACE.md](https://github.com/rig-c/core/blob/main/docs/FACE.md) · [docs/INGEST.md](https://github.com/rig-c/core/blob/main/docs/INGEST.md) · [docs/PROMPTING.md](https://github.com/rig-c/core/blob/main/docs/PROMPTING.md)
- [docs/BENCHMARK.md](https://github.com/rig-c/core/blob/main/docs/BENCHMARK.md) — why you can trust the output, and the 50 assertions with their profiles
- [npm: rig-c](https://www.npmjs.com/package/rig-c) · [CHANGELOG.md](https://github.com/rig-c/core/blob/main/CHANGELOG.md)
- Start here: [/docs/getting-started/](/docs/getting-started/)
