---
navLabel: Core
title: rig-c core — a 2D rig compiler with a named-assertion gate
description: rigc compiles a rig spec and a motion spec into Spine 4.3 skeleton data, and writes nothing unless every named assertion passes.
summaryForLlms: rig-c (also @rig-c/core, CLI rigc) compiles a JSON rig spec and motion spec plus loose part PNGs into Spine 4.3 skeleton data, gated by named assertions so nothing invalid is written.
packageName: rig-c
packageVersion: 2.61.0
repoUrl: https://github.com/rig-c/core
npmUrl: https://www.npmjs.com/package/rig-c
---
# rig-c core (`rigc`)

<p class="mod-role">The compiler: a rig spec and a motion spec in, Spine 4.3 skeleton data out — and nothing written unless every named check passes.</p>

<div class="triptych" role="group" aria-label="One mistake, its refusal, and the fix">
<figure><figcaption><span class="label fail">1 · The mistake</span> one weight on one neck vertex</figcaption>
<pre><code class="language-diff">                 "bone": "chest",
                 "x": -112,
                 "y": 315,
-                "weight": 0.32227
+                "weight": 0.42227</code></pre></figure>
<figure><figcaption><span class="label fail">2 · The refusal</span> named, with the value found</figcaption>
<pre><code>  <span class="v-fail">FAIL</span>  A20_MESH_WEIGHTS_COHERENT: mesh "neck"
        vertex 0 weights sum to 1.1000
        (see rigc guide A20_MESH_WEIGHTS_COHERENT)
  ..    52 assertions: 21 measured
        (20 passed, 1 failed), 17 skipped
rigc: 1 assertion(s) failed — nothing written
exit=1</code></pre></figure>
<figure><figcaption><span class="label pass">3 · After the fix</span> the same command, green</figcaption>
<pre><code>  ..    52 assertions: 21 measured
        (21 passed, 0 failed), 17 skipped,
        14 not in profile "spine"
rigc: wrote build/skeleton.json
rigc: wrote build/skeleton.atlas
rigc: wrote build/skeleton.model.json
exit=0</code></pre></figure>
</div>

<p class="mod-skip">Real output from Character 1's rig, <code>rig-c</code> 2.61.0 (long lines wrapped). Why the summary says 52 when the gate has 50 rules: <a href="#how-the-gate-decides">below</a>. Skip to <a href="#install">Install</a> · <a href="#inputs-and-outputs">Inputs and outputs</a> · <a href="#limits">Limits</a> · <a href="#go-deeper">Docs</a></p>

{{thread:core}}

An agent authoring a rig cannot tell whether it succeeded, because Spine's JSON parser accepts a lot of nonsense silently: a constraint in the 4.2 shape simply vanishes, a `size:` that disagrees with the PNG collapses every UV, a four-number curve array yields NaN. Each of these loads clean, plays, and is wrong. `rigc` makes the failure legible: every refusal names its rule and the value it found, ends with the command that explains it, and leaves nothing on disk.

<figure class="figure-media">
  <div class="media">
    <video data-loop="the key-pose film" controls muted loop playsinline preload="metadata" poster="/assets/docs/core-keypose-poster.jpg" width="600" height="404" aria-label="Recorded video: two key poses of a drawn character side by side, rigc pose's report on where each part sits, two candidate in-between motions playing side by side, a rigc vote ballot with B chosen, and the chosen motion at full size — core's own film two">
      <source src="/assets/docs/core-keypose.mp4" type="video/mp4">
      <img src="/assets/docs/core-keypose-poster.jpg" alt="Two key poses of a drawn character side by side, with the command under them" width="600" height="404">
    </video>
  </div>
  <figcaption><span class="media-kind">Recorded video</span> rig-c core's own film two, the authoring loop on one character. Two key poses are the given conditions; <code>rigc pose</code> reads back where every part sits in each picture; two candidate in-betweenings are compiled from the same pair; and a real <code>rigc vote</code> ballot picks the winner — the movement between the poses is the one thing nothing in the toolchain grades. Five shots: the two pictures, <code>rigc pose</code>'s report on pose B, the two candidates, a photograph of the real ballot page, and the winner at full size; the command in the band is the one that produced the shot above it. Everything on screen is compiled output or a photograph of a real page, and every number on it was printed first by a tool. The character is film one's; the poses and the three motion specs are the only new authoring. From the <a href="https://github.com/rig-c/core">rig-c/core</a> README, built under the package's earlier name, <code>spine-rigc</code> — shot 2 is spine-rigc 0.9.0's report, not what <code>rigc pose</code> prints today.</figcaption>
</figure>

## Three mistakes an agent makes, on one rig

Each case starts from a fresh copy of Character 1's `rig.json`, `motion.json` and its 17 part images, built with `bunx rig-c@2.61.0 build --rig rig.json --motion motion.json --images images --out build`.

<div class="case">

### <span class="label fail">compile</span> A slot names a bone that does not exist

```diff
     {
       "name": "face",
-      "bone": "head",
+      "bone": "haed",
       "attachment": "face"
```

```
rigc compile error: rig.json: slot "face" names bone "haed", which this rig does not declare (see rigc guide CE_RIG_SLOT_BONE_UNKNOWN)
exit=1
```

`rigc guide CE_RIG_SLOT_BONE_UNKNOWN` prints that rule's row from the authoring guide, fix included: *Name a declared bone in slot.bone.* No `build/` directory exists afterwards.

</div>

<div class="case">

### <span class="label fail">compile</span> An image the rig names was renamed on disk

`mv images/hair_front.png images/hair-front.png`, with `rig.json` still naming `hair_front.png`:

```
rigc compile error: image "hair_front.png" is not on disk at images/hair_front.png (see rigc guide CE_COMPILE_IMAGE_MISSING)
exit=1
```

The guide's fix: *Supply the PNG at the named images path or correct the image name.*

</div>

<div class="case">

### <span class="label fail">gate</span> One vertex's weights do not sum to 1

This one compiles; the gate measures it and refuses — the case at the top of this page. Its guide row covers *a weighted vertex with no bone, a negative weight, a bone index out of range, or weights that do not sum to 1*.

</div>

Put each value back and the same command passes, writing files byte-identical to the clean build. The two compile refusals stop before the gate runs, so they print no assertion summary; the third is a gate `FAIL` with one.

## Passing is structural; looking is separate

A green gate says the data is valid Spine 4.3 that plays without errors — in core's own words, *a rig with its head off its torso passes the gate*. So rigc also draws what it built, with no reference needed:

<div class="compare">
  <figure><img src="/assets/docs/core-render-contact.jpg" alt="A contact sheet of Character 1's idle: 41 small frames of the full figure" width="401" height="775" loading="lazy"><figcaption><code>rigc render --candidate build --animation idle</code> — <code>idle 41 frame(s), 3.333s + contact.png</code></figcaption></figure>
  <figure><img src="/assets/docs/core-inspect-weights.jpg" alt="The neck mesh over dimmed art, coloured by how much each vertex follows the chest bone: blue near the head, red near the chest, with the triangle edges drawn" width="443" height="512" loading="lazy"><figcaption><code>rigc inspect … --show art,weights:chest,mesh --zoom slot:neck</code> — the neck mesh after the fix, coloured by its chest weight</figcaption></figure>
</div>

When a person needs to judge the motion against footage and hand back notes, that is [Review](/docs/review/).

## How the gate decides

1. **Measure the art.** rigc reads the PNGs themselves instead of trusting sizes you typed, so the skeleton and the atlas cannot drift apart.
2. **Compile two specs.** The rig spec (`rigc-rig/1`) holds structure — bones, slots in draw order, skins. The motion spec (`rigc-motion/1`) holds time — animations, tracks, keys.
3. **Gate.** The default profile, `spine`, runs the 36 validity rules: *is this valid Spine 4.3 that any runtime plays correctly?* `--profile rig-play` runs all 50; the extra 14 are one renderer's and one canvas budget's policy, which is why they are opt-in. Every report names its profile and lists, on `PROF` lines, the rules it left out.

   **Why a report counts 52.** The registry holds 50 named assertions, and `spine` + the 14 policy rules = 50. The published package links no Spine runtime, so the round trip's own parse, `A00_ROUNDTRIP_PARSE`, reports SKIP; in its place the report also carries the model side's two parse rules, `A00_MODEL_READ` and `A00_MODEL_REGIONS_ON_PAGES`, which the registry does not hold — so the summary totals 52 (rig-c 2.61.0, as in the runs on this page: 21 measured + 17 skipped + 14 not in profile `spine`).
4. **Write, or refuse.** Only a green gate writes `--out`.

The published package links no Spine runtime, so `A00_ROUNDTRIP_PARSE` — Spine's own parse — reports SKIP. Install `@esotericsoftware/spine-core` beside it and the same `rigc` runs that round trip too, plus `validate`, `preview`, `vote`, `bench` and `bonedist`.

**Key terms.** *Rig spec* — bones, the slots array (the setup draw order) and skins. *Motion spec* — the time file, aimed at the rig by name. *Named assertion* — a rule the gate runs; each failure names it. *Profile* — the rulebook: `spine` (default) or `rig-play`. *`ingest`* — `build` run backwards: a Spine 4.3 `skeleton.json` in, the two specs that rebuild it byte for byte out.

## Install

```sh
bun add -d rig-c
bun rigc build --rig rig.json --motion motion.json --out build/
```

rigc runs on Bun 1.2.0 or later. The npm package is `rig-c`; `@rig-c/core` is the same package under the scope, and the command is `rigc`. Licensing by playback path: [Licensing](/docs/licensing/).

## Inputs and outputs

| In | Out |
| --- | --- |
| Part PNGs | `skeleton.json` + `skeleton.atlas` — Spine 4.3 data |
| A rig spec (`rig.json`) | `skeleton.model.json` — rig-c's own compiled model, for [Play](/docs/play/) |
| A motion spec (`motion.json`) | the gate report (`--report` also writes it as JSON) |
| — | on a refusal: the named lines, and nothing on disk |

## Limits

- **The gate is structural.** It does not judge the picture; `render` and `inspect` are for looking.
- **The round trip needs spine-core.** Without it, `A00_ROUNDTRIP_PARSE` is SKIP and `validate`, `preview`, `vote`, `bench`, `bonedist` do not run.
- **Packing is opt-in and narrow** — `--pack` and `--atlas-in` do no trimming, rotation or scaling.
- **It emits Spine's format.** What a product may do with that data, and with a Spine Runtime, is in [Licensing](/docs/licensing/).

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

<!-- SOURCES (not published)
- key-pose film: rig-c/core@539572d (539572d34bb034b9e905e30dc2d45bcd2650b34f, the commit that last changed it; identical at v2.64.1 51dba78) assets/rigc-keypose.gif — 234 frames, 600x405, 5 cs each = 11.70 s, opaque; encoded by scripts/encode-video.sh row core-keypose (20 fps, cropped to 600x404); caption from films/two-keypose/README.md (summary, shot table, honesty stance; shot 2 = spine-rigc@0.9.0 output); "spine-rigc" is drawn in the caption band of every frame
- three cases: rig-c 2.61.0 on rig-c/parts-examples@c239b09 family/roa/out/rig — verbatim fail.log / pass.log / guide.txt of each case (case run 2026-10-19)
- render contact: "idle 41 frame(s), 3.333s + contact.png"; inspect command and image from the same run
- packing narrow: core README Install ("no trimming, no rotation, no scaling")

- published version 2.61.0 (rig-c and @rig-c/core) — `npm view rig-c version`, `npm view @rig-c/core version`; origin/main package.json:3 also 2.61.0
- rig compiler; rig spec + motion spec in, skeleton data out, Spine 4.3 — README.md:11-13
- built so AI agents author rigs and check their work; ships as an agent skill — README.md:16-17
- @rig-c/core same package under the scope — README.md:17-19, README.md:157
- command is rigc, npm package rig-c — README.md:150
- loads in any Spine runtime, imports into Spine editor; "an AI drafts, a human refines in the editor" — README.md:59-61
- @rig-c/parts: from one painting, parts + weighted-mesh rig specs, verified through rig-c — `npm view @rig-c/parts description`
- @rig-c/pose: body-18 pose sequence, bone keys in rig-c's motion format — `npm view @rig-c/pose description`
- @rig-c/play: plays skeleton.model.json written by rigc build — `npm view @rig-c/play description`; "Spine-free" not claimed beyond: README.md:101-102 (output may be played by something other than a Spine runtime)
- @rig-c/review: human review / feedback — README.md:620; `npm view @rig-c/review description`
- problem statement (parser accepts nonsense; 4.2 constraint vanishes; size: collapses UVs; four-number curve NaN; loads clean, plays, wrong) — README.md:122-130
- failure named by rule, nothing on disk — README.md:40
- skeleton.json + skeleton.atlas — README.md:31-32, README.md:40
- skeleton.model.json written by build — `rigc build --help` line 10 and lines 26-27; "rigc's own compiled model beside it" README.md:13
- report names its profile — README.md:635-636; --report JSON `build-report/1` — `rigc build --help` line 23
- failure line ends with (see rigc guide <RULE>) — README.md:618
- measures PNGs rather than typed sizes, so sizes cannot drift — README.md:259-260, 307-309
- rig spec rigc-rig/1: bones, slots (draw order), skins — README.md:275-276, 280, 305-306
- motion spec rigc-motion/1: time only, aimed at rig by name — README.md:313, 317
- 52 = 50 registry assertions + A00_MODEL_READ + A00_MODEL_REGIONS_ON_PAGES on the core entry — rig-c/core README lines 68-74 (origin/main, 2.61.0)
- default profile spine, 36 validity rules; rig-play all 50; extra 14 = one renderer's and one canvas budget's policy, opt-in — README.md:627-630; `rigc build --help` line 22
- writes only if gate green — README.md:600
- green says nothing about the picture; render/inspect/check — README.md:519, README.md:44, README.md:616
- published package links no Spine runtime; install spine-core beside → round trip on every build — README.md:64, 75-76
- validate needs spine-core — `bunx rig-c@2.61.0 validate --help` output
- preview and vote need spine-core — README.md:50-51; core entry command list excludes them — `bunx rig-c@2.61.0 validate --help` output
- Spine Runtimes License Agreement applies to that dependency — README.md:77-78
- Bun >=1.2.0 — package.json:34; README.md:140-144
- install line `bun add -d rig-c` — README.md:162
- build and render command shapes — `bunx rig-c@2.61.0 --help` (build --rig/--motion/--out; render --candidate)
- A00_ROUNDTRIP_PARSE runs only where runtime installed, SKIP elsewhere — README.md:68-70; `rigc build --help` lines 33-34
- ingest = build backwards, byte for byte — `rigc --help` ("ingest runs build backwards … build(ingest(x)) is x, byte for byte"); README.md:606
- docs list and descriptions (AUTHORING read before writing a spec; BENCHMARK = why you can trust output, 50 assertions with profiles) — README.md:789-796
- README anchors from headings — README.md:21, 80, 132, 189, 239, 591, 644
- CHANGELOG.md exists, top entry 2.61.0 — origin/main CHANGELOG.md:3
-->
