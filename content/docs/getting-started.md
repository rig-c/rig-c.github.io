---
navLabel: Getting Started
title: Getting Started with rig-c — One Painting to a Browser Rig, No GPU
description: Step-by-step walkthrough to build a rigged, breathing, waving 2D character that says hello from one painting using @rig-c/parts, @rig-c/core, @rig-c/pose, and @rig-c/play with no GPU required.
keywords: rig-c tutorial, getting started, 2D character rigging tutorial, See-through layers, rig-parts build, rig-pose retarget
repoUrl: https://github.com/rig-c/getting-started
summaryForLlms: Pinned CPU-only, no-Python recipe from prepared example layers and hand-placed joints through idle, wave and hello with hair/skirt physics to browser playback. Historical 2026-10-21 Apple M4 durations cover steps 1-10 including 9b/9c; a separate Linux reproduction and the upstream rolling-latest CI have their own records.
---
# Getting Started with rig-c

You start with one painting of a character. You end with that character rigged — split into movable pieces on a skeleton — breathing, blinking, and waving in your browser.

Repository: <https://github.com/rig-c/getting-started>

## The whole pipeline in three steps

1. **Paint one character.** Any image model or illustration workflow produces a front-facing, full-body character PNG on a plain white background with arms clear of the body.
2. **Split it into layers, and mark the joints.** [See-through](https://github.com/shitagaki-lab/see-through) cuts the painting into layered parts (twice: full figure + head crop). Body-18 joints come from a lightweight CPU script (`rtmlib`) or hand placement.
3. **Run the rig-c packages on the CPU.** `@rig-c/parts`, `@rig-c/core`, `@rig-c/pose`, and `@rig-c/play` assemble the parts, author meshes and bones, gate the build, retarget motion, and play it in the browser. **No GPU is used in step 3.**

## Try it first — no GPU, no Python

This builds a published example character whose painting and See-through layers are already made. Its joints are hand-placed, so this route needs **Bun 1.4.4** (the version tested below), `curl` and `tar`, with a macOS or Linux shell. The new reproduction below ran on Linux; Windows was not tested. Painting and layer generation happen before this recipe, on the [full guide's GPU or hosted routes](https://github.com/rig-c/getting-started#readme). A person still judges how the result looks.

**Choose a versioned run.** The commands here pin four packages, their dependency overrides, the helper-script commit and the example input commit. They reproduce this page's historical package combination; they are not an install of the latest packages. For a rolling-latest walkthrough, use the [upstream guide](https://github.com/rig-c/getting-started#try-it-first) and its existing [scheduled CPU walkthrough CI](https://github.com/rig-c/getting-started/actions/workflows/adapters.yml). Its [tested-with record](https://github.com/rig-c/getting-started/blob/main/docs/REFERENCE.md#tested-with) has its own date and versions. That job polls npm daily and runs weekly regardless.

### What the time records include

The **historical Apple M4 runs on 2026-10-21** covered steps **1–10, including 9b and 9c**: install, input download, assembly, the idle build, wave, hello, cloth rebuild and server checks. They used Bun 1.4.2, helper commit [`093204686165630a9d6912675fc0cf9df6ada398`](https://github.com/rig-c/getting-started/tree/093204686165630a9d6912675fc0cf9df6ada398), `@rig-c/parts` 1.54.0, `rig-c` 2.65.1, `@rig-c/pose` 0.38.0 and `@rig-c/play` 1.12.0. Other jobs kept the load average between 20 and 95.

| Historical run | Observed duration, steps 1–10 with 9b and 9c |
| --- | --- |
| Empty Bun cache; includes package downloads and the 41 MB example; hand-placed joints | 536 s |
| Warm caches; step 6 used the CPU detector, with pose models already downloaded | 571 s |

These are two observed durations under that load. They establish neither an upper bound nor a quiet-machine estimate. Image generation, the two See-through runs and human review are outside them. Step 10 checked HTTP 200 for the page and both models, then stopped the server; these times do not include a person's browser review. The recipe below replaces the old default-branch clone and unversioned install with verified archives and explicit pins, so it has a separate reproduction record.

**Pinned recipe reproduced 2026-10-27.** A new empty working directory on a **Linux x86_64 / WSL2 shared runner**, with Bun **1.4.4**, npm **11.19.1** and Node **24.22.1**, passed all **12 step groups** (1–10 plus 9b/9c). The direct versions are the four listed above; the dependency overrides are printed in step 1. The runner used an isolated HOME and a new dedicated Bun cache; this is not a claim about cold OS, network or CDN caches. Helper and input archives passed the printed SHA-256 checks. The quoted output figures below matched, including hello's 33.6 px / 16.05 → 12.92 degrees and cloth's 12/13 measured bars, one SKIP and five warnings. Chromium 153 also exercised both step-10 URLs: advancing poses, pause/resume and breeze, with no page errors. This is a Linux reproduction, not a new Apple timing or a human visual verdict.

Start from an empty directory and run the numbered steps in order. Keep the shell open: step 1 sets a dedicated Bun cache for this run. An empty working directory alone does not mean every cache is cold.

### 1. Install the packages

```sh
mkdir rig-c-start
cd rig-c-start
export BUN_INSTALL_CACHE_DIR="$PWD/.bun-cache"
curl --fail --location --output helpers.tar.gz https://codeload.github.com/rig-c/getting-started/tar.gz/093204686165630a9d6912675fc0cf9df6ada398
bun -e 'const b = await Bun.file("helpers.tar.gz").arrayBuffer(); if (new Bun.CryptoHasher("sha256").update(b).digest("hex") !== "df9731cbbd9a983fca2c7353a0fc8b78c49319ba7e29e34fda1a0f72536e848a") throw new Error("archive checksum mismatch")'
mkdir getting-started
tar -xzf helpers.tar.gz --strip-components=1 -C getting-started
rm helpers.tar.gz
mkdir my-rig
cd my-rig
cat > package.json <<'EOF'
{
  "private": true,
  "type": "module",
  "overrides": { "rig-c": "2.65.1", "ag-psd": "31.0.3", "base64-js": "1.5.1", "pako": "2.1.0" }
}
EOF
bun add --exact --backend=copyfile @rig-c/parts@1.54.0 rig-c@2.65.1 @rig-c/pose@0.38.0 @rig-c/play@1.12.0
```

Every command from here on runs in `my-rig`. The helpers come from the full commit above; the archive checksum is checked before extraction. `--exact` saves exact direct dependencies, and the explicit overrides hold `parts` and `pose` to the same compiler and explicitly set the three transitive dependency versions used in this run. `--backend=copyfile` keeps this install independent of cache hardlinks. Keep the generated `package.json` and `bun.lock` with your result for later reinstalls. `bun run rig-parts` and `bun run rig-pose` use this project's installed CLIs.

### 2. Get the example inputs

```sh
curl --fail --location --output exam.tar.gz https://codeload.github.com/rig-c/exam/tar.gz/01436ee3f02c189fe1a1e9656fe62068889837f5
bun -e 'const b = await Bun.file("exam.tar.gz").arrayBuffer(); if (new Bun.CryptoHasher("sha256").update(b).digest("hex") !== "c2224a08620ec0929c8e139a7dfcf257b30eba562d306300e6455ed54c2ba977") throw new Error("archive checksum mismatch")'
tar -xzf exam.tar.gz --strip-components=3 exam-01436ee3f02c189fe1a1e9656fe62068889837f5/tasks/01-build/inputs
tar -xzf exam.tar.gz --strip-components=1 exam-01436ee3f02c189fe1a1e9656fe62068889837f5/LICENSE exam-01436ee3f02c189fe1a1e9656fe62068889837f5/NOTICE.md
rm exam.tar.gz
```

You now have `inputs/` with `painting.png`, `layers/full/` and `layers/head/`. These inputs are **CC BY-NC 4.0** — see [Licensing](/docs/licensing/).

### 3. Start the config

```sh
cat > config.json <<'EOF'
{
  "key": "exam-01",
  "seethrough": { "resolution": 1024, "steps": 30, "seed": 42, "offload": true },
  "assemble": { "rig_scale": 0.5 }
}
EOF
bun run rig-parts inputs --source inputs/painting.png --config config.json --out work
```

You should see `st_input_full.png 2432x2432` and a note that there is no head box yet.

### 4. Find the head box

```sh
bun run rig-parts layers inputs/layers/full
bun run rig-parts propose --head-box --full inputs/layers/full --canvas 1664x2432 | tail -n 1 > work/head_box.json
bun ../getting-started/scripts/take.ts work/head_box.json config.json seethrough.head_box=head_box
bun run rig-parts inputs --source inputs/painting.png --config config.json --out work
```

You should see `29 layer(s): 29 with opaque pixels`, `0 WARN line(s)`, `work/head_box.json` holding `{"head_box":[616,32,1132,548]}`, then `st_input_head.png 516x516`.

### 5. Assemble the parts

```sh
bun run rig-parts assemble --propose-plan --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --config config.json > work/plan.json
bun ../getting-started/scripts/take.ts work/plan.json config.json assemble.plan=plan assemble.extend_below_crop=extend_below_crop
bun run rig-parts assemble --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --config config.json --out work
```

You should see 22 parts, then `recomposite vs source: mean |d|=1.13, within 8: 97.8%`.

### 6. Put the joints in place

~~~sh
sed -n '/^```json$/,/^```$/p' ../getting-started/docs/KEYPOINTS.md | sed '1d;$d' > keypoints.json
~~~

This copies the hand-placed body-18 joints for this painting out of the guide's [`docs/KEYPOINTS.md`](https://github.com/rig-c/getting-started/blob/093204686165630a9d6912675fc0cf9df6ada398/docs/KEYPOINTS.md), which also explains how to place them for a painting of your own.

The optional CPU detector needs Python/uv and downloads pose models. It is a separate route in the [upstream guide](https://github.com/rig-c/getting-started#readme); it was not run for this pinned no-Python recipe. The historical warm-cache timing above used that detector, which is why it is kept separate from the hand-placed route here.

### 7. Draft the bones

```sh
bun -e 'const f = "keypoints.json", k = await Bun.file(f).json(); k.people[0].joints.l_ankle.at = [848, 2140]; await Bun.write(f, JSON.stringify(k, null, 1) + "\n")'
bun run rig-parts propose --parts work/rig --source inputs/painting.png --out work --keypoints keypoints.json
bun ../getting-started/scripts/take.ts work/proposal.json config.json bones meshes regions motion limbs
```

This is where a person corrects the draft, and the first line is the example's one correction: it puts the left ankle on the shin at `[848, 2140]`, so both ankles lie on the leg art and `propose` cuts the shoes into one part per foot. The hand-placed file already has it there; the script puts it 12 px off the art, and without the line `propose` prints a `LINT` and leaves the shoes one part that no leg bone moves.

You should see `0 LINT line(s) over 6 mesh(es) and the hip` and a coverage line ending `44 bone(s) — 29 checked and clean, 0 checked with a LINT line, 15 not checked`.

### 8. Build the rig

```sh
bun run rig-parts build --config config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out out --loop
```

You should see `limb cut: "shoes" opaque 13735 = "foot_r" 8071 + "foot_l" 5664`, then `check: PASS; 11 of 13 bar(s) measured, 2 skipped (FEET_STAY_LEVEL, STRESS_OFF_CHAIN)`, then `build: PASS`. `FEET_STAY_LEVEL` is skipped because the idle turns no leg; step 9b's hello does. Open `out/idle.gif`: the character breathes and blinks in a loop.

<figure>
  <div class="media">
    <picture>
      <source srcset="/assets/docs/getting-started-idle.webp" type="image/webp" media="(prefers-reduced-motion: no-preference)">
      <img src="/assets/docs/getting-started-idle-poster.png" alt="Animation: the example character standing, breathing and blinking once in her idle loop" width="317" height="640">
    </picture>
  </div>
  <figcaption><span class="media-kind">Historical animation</span> The step-8 build from the 2026-10-20 walkthrough (<code>out/check/build</code>), playing its <code>idle</code>: 40 frames at 12 fps, looping, drawn by <code>@rig-c/play</code> 1.12.0 over the page rather than by <code>rigc render</code>, whose frames are opaque by design. Captured from the then-current walkthrough, run on 2026-10-20 with <code>@rig-c/parts</code> 1.42.0 and <code>rig-c</code> 2.64.1. With reduced motion on, the first frame stands still.</figcaption>
</figure>

A skipped bar is named with its reason; any `FAIL` line means nothing was written, and the line says what to change. A green build means the checks passed — whether it looks right is yours to judge (`out/idle.gif`, or [Review](/docs/review/)).

### 9. Give it a wave

```sh
bun ../getting-started/scripts/wave.ts keypoints.json wave.pose.json
bun run rig-pose clean --pose wave.pose.json --out wave.pose.clean.json
cat > map.json <<'EOF'
{
  "spec": "rig-pose-map/1",
  "chains": [
    { "name": "trunk", "bones": ["chest"], "joints": ["mid_hip", "neck"], "aim": ["neck"] },
    { "name": "arm_r", "bones": ["sleeve_r0", "sleeve_r1"], "joints": ["r_shoulder", "r_elbow", "r_wrist"], "bend": "free" },
    { "name": "arm_l", "bones": ["sleeve_l0", "sleeve_l1"], "joints": ["l_shoulder", "l_elbow", "l_wrist"], "bend": "free" }
  ],
  "translate": { "bone": "hip", "joint": "mid_hip", "scale": { "pose": ["mid_hip", "neck"], "rig": ["hip", "neck"] } }
}
EOF
bun run rig-pose retarget --rig out/rig --map map.json --pose wave.pose.clean.json --out wave.motion.json --name wave --profile spine-html --build wave-build
```

You should see `73 frame(s), 3 s at 24 fps`, a `GATE … green` line, and `wrote wave.motion.json — animations: idle, wave`. `wave-build/` holds the rig with both animations.

### 9b. Say hello

A motion can also be written as keys on the bones and handed to the build, which checks it with the rig. The guide's `scripts/hello.ts` writes a hello of under five seconds that way from the rig step 8 built; the config names the file in `motion.animations_from`, and the build runs again.

```sh
bun ../getting-started/scripts/hello.ts out/rig/rig.json
echo '{"animations_from": "hello.anim.json"}' > work/hello-from.json
bun ../getting-started/scripts/take.ts work/hello-from.json config.json motion.animations_from=animations_from
bun run rig-parts build --config config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out out --loop
```

You should see `hello.ts: 4 beats (hm?, heh, wave, settle), 4.75 s at 24 fps, 16 tracks of 115 keys; sleeve_r0 at most 4.0 deg` and a settle of `33.6 px in` and `16.05 -> 12.92 deg` on the hand-placed joints, then from the build `FEET_STAY_LEVEL: PASS`, `check: PASS; 12 of 13 bar(s) measured, 1 skipped (STRESS_OFF_CHAIN); 1 warning(s)` and `build: PASS`. The warning is `SEAM_OVER_MOTION`, never a bar: a sliver of the forearm shows past the sleeve's cuff where it turns at the elbow. The wave is the forearm's, because on this painting swinging the whole arm out, as step 9 does, opens a gap at the armhole. As the arm comes down she re-plants her weight, her right foot sliding in toward the other and back, on the two feet step 7's correction made.

### 9c. Let the hair and the skirt answer

A `cloth` block in the config hands the skirt (`bottomwear`) and the hair around the face (`front hair`) to physics, `propose --cloth` drafts chains with a physics constraint on each link, and the build carries them. Then her breath, her head and the hello's hip move them, and no key does.

```sh
bun ../getting-started/scripts/hello.ts out/rig/rig.json --no-skirt-keys
cat > work/cloth.json <<'EOF'
{
  "cloth": {
    "bottomwear": { "chains": 3, "links": 3, "wind": [1, 6], "gravity": [2, 12], "translate": 0.2,
                    "swing": { "scales": [1.2, 1, 1.2] } },
    "front hair": { "chains": 1, "links": 3, "wind": [1, 6], "gravity": [2, 12], "translate": 0.2,
                    "strength": { "trunk": 100, "branch": 100, "edge": 100 } }
  }
}
EOF
bun ../getting-started/scripts/take.ts work/cloth.json config.json cloth
bun run rig-parts propose --parts work/rig --source inputs/painting.png --out work --keypoints keypoints.json --cloth config.json --write-config config.cloth.json
mv config.cloth.json config.json
bun -e 'const f = "config.json", c = await Bun.file(f).json(); c.motion.tracks.find((t) => t.bone === "bun").amp = 1; await Bun.write(f, JSON.stringify(c, null, 2) + "\n")'
bun run rig-parts build --config config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out out --loop --lead-in 1
```

The first line writes the hello again without its skirt keys (`14 tracks of 115 keys`): from here physics follows her hip. `propose --cloth` writes the config with the new chains and `every other byte as read`, and `mv` makes it yours. The proposal prints one LINT line about the chain amplitude before the correction below. Two lines correct the draft: `strength` makes the side locks stiff enough not to pull off her cheek when her head turns, and the `bun -e` line raises the bun's swing, without which the build stops at `CHECK_CHAIN_LAG`.

You should see `check: PASS; 12 of 13 bar(s) measured, 1 skipped (STRESS_OFF_CHAIN); 5 warning(s) (SEAM_OVER_MOTION, CLOTH_SETTLES, not a bar)`, a `lead-in:` line ending `max |d| 0, 0 px over 40 — the jump at the wrap`, and `build: PASS`. `CLOTH_SETTLES` is a warning, not a failure: the skirt hangs into place within 2 seconds and then rests, because the idle never moves her hip. `--lead-in 1` plays the idle once before `out/idle.gif` is cut from it, so the loop starts after the skirt has settled.

### 10. Play it in your browser

```sh
bun ../getting-started/scripts/serve.ts
```

[Open hello over idle](http://localhost:3000/?model=out/check/build/skeleton.model.json&anim=hello&under=idle): she notices you, smiles with two little shrugs, waves with her forearm beside her shoulder and re-plants her weight, while the locks beside her face and the skirt trail after her. `&under=idle` keeps the idle playing beneath, so she breathes through it. The page also blows a light breeze through `@rig-c/play`'s `player.environment()`; untick **breeze**, or add `&wind=0`, for the runtime's own steady wind. [Open step 9's wave](http://localhost:3000/?model=wave-build/skeleton.model.json&anim=wave); the menu switches animations. Ctrl+C stops the server.

<figure>
  <div class="media">
    <picture>
      <source srcset="/assets/docs/getting-started-hello.webp" type="image/webp" media="(prefers-reduced-motion: no-preference)">
      <img src="/assets/docs/getting-started-hello-poster.png" alt="Animation: the example character notices the viewer and straightens her head, smiles with two small shrugs, waves with her forearm beside her shoulder, then shifts her weight, one foot sliding in toward the other and back" width="356" height="640">
    </picture>
  </div>
  <figcaption><span class="media-kind">Historical animation</span> The <code>hello</code> from the 2026-10-21 walkthrough's <code>out/check/build</code> after the guide's steps 9b and 9c, unedited: 4.75 s, 57 frames at 12 fps, looping, in the page's breeze, after one pass of settling so the hair and skirt are already moving. Step 10's page plays the hello over the <code>idle</code>, so she also breathes through it; this clip is the hello alone, because the two loops (4.75 s and 3.33 s) never line up into one that repeats. Its wave is an elbow-down wave, the upper arm kept within 4 degrees of rest, and every seam the guide's build reads stays inside its tear bars (gap ≤ 25 px, ghost ≤ 50 px) at every phase of the breeze. Drawn by <code>@rig-c/play</code> 1.12.0 over the page rather than by <code>rigc render</code>, whose frames are opaque by design. That walkthrough was run on 2026-10-21 with <code>@rig-c/parts</code> 1.53.0, <code>rig-c</code> 2.65.1, <code>@rig-c/pose</code> 0.37.0. With reduced motion on, the first frame stands still.</figcaption>
</figure>

The full guide — making your own character, the GPU routes, troubleshooting and every measured figure — is the [rig-c/getting-started README](https://github.com/rig-c/getting-started#readme) and its [docs/REFERENCE.md](https://github.com/rig-c/getting-started/blob/main/docs/REFERENCE.md).

## Three ways to use the output

1. **On the web with [`@rig-c/play`](/docs/play/) or [an engine adapter](/docs/adapters/)**: Load `skeleton.model.json` and part PNGs directly. The packages are MIT and integrate no Spine Runtime.
2. **In the Spine 4.3 Editor**: Import `out/check/build/skeleton.json` via `Import Data` and point `Images` to `out/rig/images/` to refine timelines by hand (requires rig-c 2.51.1+; the editor is under the Spine Editor License Agreement).
3. **In a game engine via official Spine Runtimes**: Load `skeleton.json` and `skeleton.atlas` in Unity, Godot, Unreal, or C++ runtimes under the Spine Runtimes License.

The example inputs in step 2 come from [rig-c/exam](https://github.com/rig-c/exam) and are **CC BY-NC 4.0**, not MIT: free to use with credit, not for commercial use, and what you build from them carries that licence. Which terms each route brings: [Licensing](/docs/licensing/).

<!-- SOURCES (not published)
- The idle clip (drawn by @rig-c/play; the step-10 wave beside it came from the same run until 2026-10-21): one run of steps 1-10 as written, 2026-10-20, Apple M4, Bun 1.4.2, from an empty folder. `bun add` resolved @rig-c/parts 1.42.0, rig-c 2.64.1, @rig-c/pose 0.36.0, @rig-c/play 1.12.0 (bun.lock; `npm view` the same day gave the same four); rig-c/getting-started cloned at 2928714. Every command exited 0. Hand-placed keypoints (step 6's default), so step 7 printed 0 LINT lines; the 1.41.1 LINT line in step 6 is for the script-detected joints and was not re-run here.
- Expected lines matched: st_input_full.png 2432x2432; 29 layer(s): 29 with opaque pixels; 0 WARN line(s); head_box [616,32,1132,548]; st_input_head.png 516x516; 22 part(s) on a 832x1216 rig; recomposite mean |d|=1.13, within 8: 97.8%; coverage: 42 bone(s) - 29 checked and clean; check: PASS; 11 of 12 bar(s) measured, 1 skipped (STRESS_OFF_CHAIN); build: PASS; wave.ts: 73 frame(s), 3 s at 24 fps; GATE rigc build --profile spine-html: green; wrote wave.motion.json - animations: idle, wave.
- getting-started-idle.webp + getting-started-idle-poster.png: scripts/play-capture-webp.ts (written as scripts/getting-started-idle-webp.ts, generalised 2026-10-20; re-run through it with --root <run> --model out/check/build/skeleton.model.json --anim idle --fps 12 --frames 40 the WebP and poster came out md5-identical to these; Bun 1.4.2, Playwright 1.63.0 / Chromium 153 headless with --use-angle=metal, libwebp 1.6.0 img2webp) on the run's out/check/build/skeleton.model.json, drawn by the run's own @rig-c/play 1.12.0 through rig-c/getting-started@2928714 scripts/play.html + serve.ts (`bun serve.ts --port 0`, page /?model=out/check/build/skeleton.model.json&anim=idle), html/body/#stage made transparent and #bar hidden. Page on Playwright's fake clock (paused, so its rAF loop does not step); frame i = RigPlayer.seek(i/12) + draw(), screenshot of #stage with omitBackground -> RGBA PNG. idle duration from loadModel's assets.animations: 3.3333 s = 40 frames at 12 fps. Framing as rigc render --max 640: union of player.bounds() over the idle at 60 fps, padded 4% of the long side, long side 640 -> 317x640 (scale 0.50395), the same size as out/idle.png. Two runs gave identical frames (40 PNGs concatenated md5 53c314fdcbd3f61647bb065d413c16e3). WebP: lossy q85, -m 6, -exact, alpha lossless (libwebp default alpha_quality 100; decoded alpha equals the capture's, max error 0); frame durations round((i+1)*1000/12)-round(i*1000/12) = 27 x 83 ms + 13 x 84 ms = 3333 ms per loop; animation background colour set to 0,0,0,0 with webpmux. 713104 bytes (md5 6ac3e8c0b31c1949dc368cfa245e54a4); lossless was 2363528 bytes; q75 596356, q70 581414 - the lossless alpha plane alone is about 12 KB a frame, so no exact-alpha encode of this clip comes near 500 KB. Poster = captured frame 0, 121305 bytes, md5 a124eb937745fc4a36c0a32bd01285ed. Alpha: corners 0, interior 255, 3430 edge px at alpha 30-225 on frame 0; no grey fringe - composited over 232 the edge band's mean luminance differs from rigc render's by +0.02 (a fringe would bias it). Loop seam (scripts/loop-seam.py over --bg #070b18): captured frames 0.451 vs max step 0.552; WebP 0.865 vs 0.877 PASS (over #e8e8e8: 0.823 vs 0.868 PASS). Against rigc render (out/idle.png, md5 b958dbf8574d7939667d61a47d46b26a, composited capture over 232,232,232): MAD frame 0 1.655, mean over the 40 frames 1.674, max 1.771; interior 3.52, edge band 18.2, outside 0.01; silhouettes differ by 1923 of ~57k px. Same pose and framing; the difference is resampling - the browser scales the part images (CSS transform, 0.504) and rigc rasterizes them itself, so line art and edges land up to a pixel apart and play's is a little softer.
- getting-started-hello.webp + getting-started-hello-poster.png (2026-10-21): a second run, rig-c/getting-started at 0932046 (steps 1-10 with 9b and 9c, as written, from an empty folder; Apple M4, Bun 1.4.2; every command exited 0). `bun add` resolved @rig-c/parts 1.53.0, rig-c 2.65.1, @rig-c/pose 0.37.0, @rig-c/play 1.12.0 (bun.lock). Step 6 by scripts/keypoints.py (18 observed, 0 occluded, 0 missing); the hand-placed set in docs/KEYPOINTS.md is retuned at 0932046 to within a pixel of the script's joints, so the no-Python route now gives the hello too (the guide's README: step 9b reads 33.6 px in and 16.05 -> 12.92 deg; the earlier set gave 41.1 px and broke the seam bars). First run 2026-10-21 against the guide at 066a7ef, which differs from 0932046 only in README, KEYPOINTS and REFERENCE; re-run from an empty folder against a clone at 0932046, where `bun add` resolved @rig-c/parts 1.54.0, rig-c 2.65.1, @rig-c/pose 0.37.1, @rig-c/play 1.12.0, the same expected lines printed and the capture below came out byte-identical (frames, WebP and poster md5 as below). Expected lines matched the README: coverage: 44 bone(s) - 29 checked and clean; limb cut: "shoes" opaque 13735 = "foot_r" 8071 + "foot_l" 5664; step 8 check: PASS; 11 of 13 bar(s) measured, 2 skipped (FEET_STAY_LEVEL, STRESS_OFF_CHAIN); hello.ts: 4 beats (hm?, heh, wave, settle), 4.75 s at 24 fps, 16 tracks of 115 keys; sleeve_r0 at most 4.0 deg; settle: right ankle 33.2 px in (40 % of the way to parallel, 15.96 -> 12.87 deg), hip 6.0 px; 9b check: PASS; 12 of 13 bar(s) measured, 1 skipped (STRESS_OFF_CHAIN); 1 warning(s) (SEAM_OVER_MOTION: upperarm_r|forearm_r max 23 px in hello, the cuff sliver the README names); 9c hello.ts 14 tracks of 115 keys, check: PASS; 12 of 13, 5 warning(s) (SEAM_OVER_MOTION, CLOTH_SETTLES); lead-in max |d| 0, 0 px over 40; build: PASS. Steps 2-9c took 221 s. Tear bars (the guide's REFERENCE, step 10 breeze): rigc render --candidate out/check/build --animation hello --fps 24 --max 640 --geometry --folds --seam (the 15 pairs) --pass-through bottomwear:thigh_r,bottomwear:thigh_l with --environment schedules of the page's breeze (wind 0.75 + 0.25 sin(2 pi 0.2 t), one step a frame) at phases 0/90/180/270 deg and the runtime's (1, 0): every pair within gap <= 25 / ghost <= 50; worst face|hair_front 7/47, topwear|bottomwear 3/44, hem thigh_l|bottomwear gap 24, thigh_r 20, shin_r|thigh_r 1/38, shin_r|foot_r 0/24; 0 of 115 frames of pass-through, no folds. Capture: scripts/play-capture-webp.ts --root <run> --model out/check/build/skeleton.model.json --anim hello --breeze --settle 1 --fps 12 --frames 57 --q 85 --out assets/docs/getting-started-hello (Bun 1.4.2, Playwright 1.63.0 / Chromium 153 with --use-angle=metal, libwebp 1.6.0; the run's @rig-c/play 1.12.0 through getting-started@0932046 play.html + serve.ts, page /?model=...&anim=hello). RigPlayer.seek is not used: the page loads on a paused fake clock, and the player is stepped from its first pose in 1/120 s steps as play.html's rAF loop does (clock += dt; environment({ wind: [0.75 + 0.25 sin(2 pi 0.2 clock), 0] }); advance(dt)), the breeze's constants read from play.html. 570 steps (one 4.75 s pass) of settling, then frame i at player time 4.75 + i/12 s (asserted). hello 4.7500 s = 57 frames at 12 fps; durations round((i+1)*1000/12)-round(i*1000/12) = 38 x 83 ms + 19 x 84 ms = 4750 ms per loop. Not over the idle: page step 10 adds &under=idle (idle on track 0, hello on track 1), which seek refuses and which never closes a loop (4.75 s against 3.333 s); captured that way (114 frames at 24 fps) the seam over #e8e8e8 was 2.134 vs max step 1.821, FAIL, against 0.555 vs 1.776 for the hello alone, the breeze adding nothing to it. 24 fps was also over 1.5 MB (114 frames: q85 2537814, q75 2138742, q65 2040310 bytes), so 12 fps. Framing: union of player.bounds() at every 1/120 s step of the captured pass + 4% pad -> 356x640, scale 0.50250, viewport x -391.83 y -25.17 w 708.57 h 1273.62; rigc render --max 640 of the same animation frames it 356x640, scale 0.50258, x -391.82 y -25.17. Border alpha 0 on every frame. Two runs gave identical frames (57 PNGs concatenated md5 4fb995fe1b95e26a29fd9c39edc80fdb), WebPs and posters. WebP lossy q85 -m 6 -exact, alpha lossless, background 0,0,0,0: 1247770 bytes (md5 0e45909a034a721180cb4cce6a1aeac9). Poster = captured frame 0, 121160 bytes, md5 cd5b93c69aaad3dffa7410bb0166c872. Alpha: corners 0, interior 255 (2517 px inside the silhouette at 254 or a little under, where parts overlap, as the wave and idle posters had: 1899 and 2254), 9188 edge px on frame 0. Fringe, against the bar as restated 2026-10-21 (no grey halo: semi-transparent px darker than their brightest opaque neighbour on every frame, and edge luminance over 232 within +-1 level of rigc render's): per-frame mean 15.3-24.5 darker, PASS; edge px (0<alpha<255) over 232 minus rigc render --fps 12 --max 640 with the breeze schedule, frame by frame: frame 0 +0.464, mean +0.435, range +0.213 to +0.741, PASS (a capture from rest against the same render, so the physics match: +0.256 / +0.426 / max +0.658); whole frame +0.015 at frame 0, mean +0.005. The bar it replaced, edge px no lighter than rigc's, measured play's antialiasing against rigc's harder edge rather than a halo; the wave below fails it too. Loop seam (scripts/loop-seam.py): over #070b18 WebP 1.304 vs max step 5.353 PASS, captured frames 1.059 vs 5.148; over #e8e8e8 WebP 1.490 vs 3.062 PASS, captured frames 1.245 vs 2.843. Against rigc render (capture over 232): MAD frame 0 1.329, mean 1.190, max 1.382 - resampling plus the settled physics (rigc starts it at rest).
- Replaced 2026-10-21: getting-started-wave.webp + poster (the 2026-10-20 run above; wave-build, wave, 72 frames at 24 fps, q75, 1293346 bytes, md5 8275a9f2571cded4ded3a91615bdb746; 385x640), deleted. Its fringe line read "edge px -0.27 (darker)": frame 0 only. Re-measured on a capture of this run's wave-build (same script, 380x640) the edge px went -0.444 at frame 0, mean +0.152, range -0.530 to +0.282 - lighter on most frames, so it fails the old bar and passes the restated one (+-1 level); its semi-transparent px were 19.5-23.4 darker than their brightest opaque neighbour on every frame of the shipped WebP.
- Replaced earlier: getting-started-wave.mp4 + poster (rigc render --candidate wave-build --animation wave --fps 24 --max 640 --poser core, 73 frames, 388x640, opaque; MP4 seam 0.319 vs max step 0.779), deleted.
- Page text synced to the guide's README at rig-c/getting-started 0932046 (2026-10-21, #61): every command and quoted line on the page diffed against that README step by step (scripted; 0 mismatches, one page-only command allowed: step 6's sed that copies docs/KEYPOINTS.md's json block). Then the page's walkthrough was run as written twice from empty folders on 2026-10-21, Apple M4, Bun 1.4.2, the guide cloned at 0932046 (its main). `bun add` resolved @rig-c/parts 1.54.0, rig-c 2.65.1, @rig-c/pose 0.38.0, @rig-c/play 1.12.0 (bun.lock) both times. Run 1: empty Bun cache, step 6 by the hand-placed file (the page's route), 536 s; per step 4.3, 5.3, 4.6, 6.5, 56.2, 0.1, 7.1, 103.0, 7.0, 160.5 (9b), 178.5 (9c), 0.5 s; load average 21 at the start, 94 at the end. Run 2: warm cache, step 6 by scripts/keypoints.py (18 observed, 0 occluded, 0 missing), 570.5 s; per step 2.1, 4.0, 3.8, 6.7, 54.5, 5.8, 7.1, 113.5, 9.3, 170.6 (9b), 190.4 (9c), 0.5 s; load average 87-95. Every command exited 0 in both. Run 1 printed every quoted line of its route: st_input_full.png 2432x2432; 29 layer(s): 29 with opaque pixels; 0 WARN line(s); head_box [616,32,1132,548]; st_input_head.png 516x516; recomposite mean |d|=1.13, within 8: 97.8%; 0 LINT line(s) over 6 mesh(es) and the hip; 44 bone(s) - 29 checked and clean, 0 checked with a LINT line, 15 not checked; limb cut: "shoes" opaque 13735 = "foot_r" 8071 + "foot_l" 5664; check: PASS; 11 of 13 bar(s) measured, 2 skipped (FEET_STAY_LEVEL, STRESS_OFF_CHAIN); build: PASS; 73 frame(s), 3 s at 24 fps; GATE ... green; wrote wave.motion.json - animations: idle, wave; hello.ts: 4 beats (hm?, heh, wave, settle), 4.75 s at 24 fps, 16 tracks of 115 keys; sleeve_r0 at most 4.0 deg, settle 33.6 px in, 16.05 -> 12.92 deg; FEET_STAY_LEVEL: PASS; check: PASS; 12 of 13 bar(s) measured, 1 skipped (STRESS_OFF_CHAIN); 1 warning(s); 14 tracks of 115 keys; every other byte as read; check: PASS; 12 of 13 ... 5 warning(s) (SEAM_OVER_MOTION, CLOTH_SETTLES, not a bar); max |d| 0, 0 px over 40 - the jump at the wrap; build: PASS. Run 2 printed step 6's script-route lines: 18 observed, 0 occluded, 0 missing -> keypoints.json, and at step 9b 33.2 px in, 15.96 -> 12.87 deg. Step 10: serve.ts answered 200 for both URLs on the page and both skeleton.model.json files, then was stopped.
-->
