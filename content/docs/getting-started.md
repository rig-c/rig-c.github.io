---
navLabel: Getting Started
title: Getting Started with rig-c — One Painting to a Browser Rig, No GPU
description: Step-by-step walkthrough to build a rigged, breathing, waving 2D character from one painting using @rig-c/parts, rig-c, @rig-c/pose, and @rig-c/play with no GPU required.
keywords: rig-c tutorial, getting started, 2D character rigging tutorial, See-through layers, rig-parts build, rig-pose retarget
repoUrl: https://github.com/rig-c/getting-started
summaryForLlms: Tested 10-step no-GPU, no-Python walkthrough (about a minute of commands on an Apple M4) from pre-decomposed character layers to a compiled rig with idle and wave animations playing in the browser, plus downstream export routes.
---
# Getting Started with rig-c

You start with one painting of a character. You end with that character rigged — split into movable pieces on a skeleton — breathing, blinking, and waving in your browser.

Repository: <https://github.com/rig-c/getting-started>

## The whole pipeline in three steps

1. **Paint one character.** Any image model or illustration workflow produces a front-facing, full-body character PNG on a plain white background with arms clear of the body.
2. **Split it into layers, and mark the joints.** [See-through](https://github.com/shitagaki-lab/see-through) cuts the painting into layered parts (twice: full figure + head crop). Body-18 joints come from a lightweight CPU script (`rtmlib`) or hand placement.
3. **Run the rig-c packages on the CPU.** `@rig-c/parts`, `rig-c`, `@rig-c/pose`, and `@rig-c/play` assemble the parts, author meshes and bones, gate the build, retarget motion, and play it in the browser. **No GPU is used in step 3.**

## Try it first — no GPU, no Python

This builds a published example character whose painting and See-through layers are already made, then plays it in your browser. The joints come from a hand-placed file that ships with the guide, so the only tools you need are [Bun](https://bun.sh) 1.2 or later, `git` and `curl`, on macOS or Linux (Windows is not tested).

**How long it takes.** Every command below was run as written, in order, from an empty folder on 2026-10-19 — Apple M4, Bun 1.4.2, and whatever `bun add` resolved that day (`rig-c` 2.61.0, `@rig-c/parts` 1.41.0, `@rig-c/pose` 0.35.0, `@rig-c/play` 1.12.0):

| Run | Steps 1–10 |
| --- | --- |
| Empty Bun cache (includes downloading the packages and the 41 MB example) | 56 s |
| A second run, caches warm | 62 s |

Steps 5 (assemble) and 8 (build) are most of it. A slower machine or network takes longer; the two runs above are the only measurements.

### 1. Install the packages

```sh
mkdir rig-c-start && cd rig-c-start
git clone https://github.com/rig-c/getting-started
mkdir my-rig && cd my-rig
bun add @rig-c/parts rig-c @rig-c/pose @rig-c/play
```

Every command from here on runs in `my-rig`.

### 2. Get the example inputs

```sh
curl -L -o exam.tar.gz https://codeload.github.com/rig-c/exam/tar.gz/01436ee3f02c189fe1a1e9656fe62068889837f5
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
bunx rig-parts inputs --source inputs/painting.png --config config.json --out work
```

You should see `st_input_full.png 2432x2432` and a note that there is no head box yet.

### 4. Find the head box

```sh
bunx rig-parts layers inputs/layers/full
bunx rig-parts propose --head-box --full inputs/layers/full --canvas 1664x2432 | tail -n 1 > work/head_box.json
bun ../getting-started/scripts/take.ts work/head_box.json config.json seethrough.head_box=head_box
bunx rig-parts inputs --source inputs/painting.png --config config.json --out work
```

You should see `29 layer(s): 29 with opaque pixels`, `0 WARN line(s)`, `work/head_box.json` holding `{"head_box":[616,32,1132,548]}`, then `st_input_head.png 516x516`.

### 5. Assemble the parts

```sh
bunx rig-parts assemble --propose-plan --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --config config.json > work/plan.json
bun ../getting-started/scripts/take.ts work/plan.json config.json assemble.plan=plan assemble.extend_below_crop=extend_below_crop
bunx rig-parts assemble --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --config config.json --out work
```

You should see `22 part(s) on a 832x1216 rig`, then `recomposite vs source: mean |d|=1.13, within 8: 97.8%`.

### 6. Put the joints in place

~~~sh
sed -n '/^```json$/,/^```$/p' ../getting-started/docs/KEYPOINTS.md | sed '1d;$d' > keypoints.json
~~~

This copies the hand-placed body-18 joints for this painting out of the guide's [`docs/KEYPOINTS.md`](https://github.com/rig-c/getting-started/blob/main/docs/KEYPOINTS.md), which also explains how to place them for a painting of your own.

**Detecting the joints with a script instead** needs [uv](https://docs.astral.sh/uv/) and downloads about 300 MB of pose models on first run:

```sh
uv run --with rtmlib --with onnxruntime python ../getting-started/scripts/keypoints.py inputs/painting.png --out keypoints.json
```

With this painting the script puts the left ankle just off the shoe art. On `@rig-c/parts` 1.41.1, step 7 then prints one `LINT` beginning `LINT foot_l at [428, 1077], the l_ankle joint and leg_l1's tip, lies on none of leg_l's art within 1 px along its joint line`, drafts that leg without its ankle cut, and the build goes green (measured 2026-10-20 from empty caches: all ten steps in 166 s, the model download included). From 1.17.0 through 1.41.0 the same joints made step 8 refuse with `ASSEMBLE_LIMB_JOINT_ON_ART`; use the hand-placed file if you are on one of those.

### 7. Draft the bones

```sh
bunx rig-parts propose --parts work/rig --source inputs/painting.png --out work --keypoints keypoints.json
bun ../getting-started/scripts/take.ts work/proposal.json config.json bones meshes regions motion limbs
```

You should see a coverage line starting `coverage: 42 bone(s) — 29 checked and clean`. This is where a person would correct the draft; the example uses it as is.

### 8. Build the rig

```sh
bunx rig-parts build --config config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out out --loop
```

You should see `check: PASS; 11 of 12 bar(s) measured, 1 skipped (STRESS_OFF_CHAIN)`, then `build: PASS`. Open `out/idle.gif`: the character breathes and blinks in a loop.

<figure>
  <div class="media">
    <picture>
      <source srcset="/assets/docs/getting-started-idle.webp" type="image/webp" media="(prefers-reduced-motion: no-preference)">
      <img src="/assets/docs/getting-started-idle-poster.png" alt="Animation: the example character standing, breathing and blinking once in her idle loop" width="317" height="640">
    </picture>
  </div>
  <figcaption><span class="media-kind">Animation</span> The step-8 build this walkthrough wrote (<code>out/check/build</code>), playing its <code>idle</code>: 40 frames at 12 fps, looping, drawn by <code>@rig-c/play</code> 1.12.0 over the page rather than by <code>rigc render</code>, whose frames are opaque by design. Made by the commands above, run as written on 2026-10-20 with <code>@rig-c/parts</code> 1.42.0 and <code>rig-c</code> 2.64.1. With reduced motion on, the first frame stands still.</figcaption>
</figure>

A skipped bar is named with its reason; any `FAIL` line means nothing was written, and the line says what to change. A green build means the checks passed — whether it looks right is yours to judge (`out/idle.gif`, or [Review](/docs/review/)).

### 9. Give it a wave

```sh
bun ../getting-started/scripts/wave.ts keypoints.json wave.pose.json
bunx rig-pose clean --pose wave.pose.json --out wave.pose.clean.json
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
bunx rig-pose retarget --rig out/rig --map map.json --pose wave.pose.clean.json --out wave.motion.json --name wave --profile spine-html --build wave-build
```

You should see `wave.ts: 73 frame(s), 3 s at 24 fps`, a `GATE … green` line, and `wrote wave.motion.json — animations: idle, wave`. `wave-build/` holds the rig with both animations.

### 10. Play it in your browser

```sh
bun ../getting-started/scripts/serve.ts
```

Open <http://localhost:3000/?model=wave-build/skeleton.model.json&anim=wave>: the character raises her right arm and waves; the menu switches to `idle`. Ctrl+C stops the server.

<figure>
  <div class="media">
    <video data-loop="the wave" controls muted loop playsinline preload="metadata" poster="/assets/docs/getting-started-wave-poster.jpg" width="388" height="640" aria-label="Recorded video: the example character raises her right arm above her head, waves, and lowers it back to rest">
      <source src="/assets/docs/getting-started-wave.mp4" type="video/mp4">
      <img src="/assets/docs/getting-started-wave-poster.jpg" alt="The example character standing at rest before the wave" width="388" height="640">
    </video>
  </div>
  <figcaption><span class="media-kind">Recorded video</span> The <code>wave</code> animation in this walkthrough's <code>wave-build/</code>, unedited: 73 frames, 3 s at 24 fps, from rest back to rest. Drawn frame by frame by rig-c's own poser (<code>bunx rigc render --candidate wave-build --animation wave --fps 24 --max 640 --poser core</code>) rather than filmed from the browser player. Same run as the idle above: <code>@rig-c/parts</code> 1.42.0, <code>rig-c</code> 2.64.1, <code>@rig-c/pose</code> 0.36.0.</figcaption>
</figure>

The full guide — making your own character, the GPU routes, troubleshooting and every measured figure — is the [rig-c/getting-started README](https://github.com/rig-c/getting-started#readme) and its [docs/REFERENCE.md](https://github.com/rig-c/getting-started/blob/main/docs/REFERENCE.md).

## Three ways to use the output

1. **On the web with [`@rig-c/play`](/docs/play/) or [`@rig-c/adapters`](/docs/adapters/)**: Load `skeleton.model.json` and part PNGs directly. The packages are MIT and integrate no Spine Runtime.
2. **In the Spine 4.3 Editor**: Import `out/check/build/skeleton.json` via `Import Data` and point `Images` to `out/rig/images/` to refine timelines by hand (requires rig-c 2.51.1+; the editor is under the Spine Editor License Agreement).
3. **In a game engine via official Spine Runtimes**: Load `skeleton.json` and `skeleton.atlas` in Unity, Godot, Unreal, or C++ runtimes under the Spine Runtimes License.

The example inputs in step 2 come from [rig-c/exam](https://github.com/rig-c/exam) and are **CC BY-NC 4.0**, not MIT: free to use with credit, not for commercial use, and what you build from them carries that licence. Which terms each route brings: [Licensing](/docs/licensing/).

<!-- SOURCES (not published)
- Both clips (the idle as drawn by @rig-c/play, the wave by rigc render): one run of steps 1-10 as written, 2026-10-20, Apple M4, Bun 1.4.2, from an empty folder. `bun add` resolved @rig-c/parts 1.42.0, rig-c 2.64.1, @rig-c/pose 0.36.0, @rig-c/play 1.12.0 (bun.lock; `npm view` the same day gave the same four); rig-c/getting-started cloned at 2928714. Every command exited 0. Hand-placed keypoints (step 6's default), so step 7 printed 0 LINT lines; the 1.41.1 LINT line in step 6 is for the script-detected joints and was not re-run here.
- Expected lines matched: st_input_full.png 2432x2432; 29 layer(s): 29 with opaque pixels; 0 WARN line(s); head_box [616,32,1132,548]; st_input_head.png 516x516; 22 part(s) on a 832x1216 rig; recomposite mean |d|=1.13, within 8: 97.8%; coverage: 42 bone(s) - 29 checked and clean; check: PASS; 11 of 12 bar(s) measured, 1 skipped (STRESS_OFF_CHAIN); build: PASS; wave.ts: 73 frame(s), 3 s at 24 fps; GATE rigc build --profile spine-html: green; wrote wave.motion.json - animations: idle, wave.
- getting-started-idle.webp + getting-started-idle-poster.png: scripts/getting-started-idle-webp.ts (Bun 1.4.2, Playwright 1.63.0 / Chromium 153 headless with --use-angle=metal, libwebp 1.6.0 img2webp) on the run's out/check/build/skeleton.model.json, drawn by the run's own @rig-c/play 1.12.0 through rig-c/getting-started@2928714 scripts/play.html + serve.ts (`bun serve.ts --port 0`, page /?model=out/check/build/skeleton.model.json&anim=idle), html/body/#stage made transparent and #bar hidden. Page on Playwright's fake clock (paused, so its rAF loop does not step); frame i = RigPlayer.seek(i/12) + draw(), screenshot of #stage with omitBackground -> RGBA PNG. idle duration from loadModel's assets.animations: 3.3333 s = 40 frames at 12 fps. Framing as rigc render --max 640: union of player.bounds() over the idle at 60 fps, padded 4% of the long side, long side 640 -> 317x640 (scale 0.50395), the same size as out/idle.png. Two runs gave identical frames (40 PNGs concatenated md5 53c314fdcbd3f61647bb065d413c16e3). WebP: lossy q85, -m 6, -exact, alpha lossless (libwebp default alpha_quality 100; decoded alpha equals the capture's, max error 0); frame durations round((i+1)*1000/12)-round(i*1000/12) = 27 x 83 ms + 13 x 84 ms = 3333 ms per loop; animation background colour set to 0,0,0,0 with webpmux. 713104 bytes (md5 6ac3e8c0b31c1949dc368cfa245e54a4); lossless was 2363528 bytes; q75 596356, q70 581414 - the lossless alpha plane alone is about 12 KB a frame, so no exact-alpha encode of this clip comes near 500 KB. Poster = captured frame 0, 121305 bytes, md5 a124eb937745fc4a36c0a32bd01285ed. Alpha: corners 0, interior 255, 3430 edge px at alpha 30-225 on frame 0; no grey fringe - composited over 232 the edge band's mean luminance differs from rigc render's by +0.02 (a fringe would bias it). Loop seam (scripts/loop-seam.py over --bg #070b18): captured frames 0.451 vs max step 0.552; WebP 0.865 vs 0.877 PASS (over #e8e8e8: 0.823 vs 0.868 PASS). Against rigc render (out/idle.png, md5 b958dbf8574d7939667d61a47d46b26a, composited capture over 232,232,232): MAD frame 0 1.655, mean over the 40 frames 1.674, max 1.771; interior 3.52, edge band 18.2, outside 0.01; silhouettes differ by 1923 of ~57k px. Same pose and framing; the difference is resampling - the browser scales the part images (CSS transform, 0.504) and rigc rasterizes them itself, so line art and edges land up to a pixel apart and play's is a little softer.
- getting-started-wave.mp4 + poster: `bunx rigc render --candidate wave-build --animation wave --fps 24 --max 640 --poser core --out wave-render` (rig-c 2.64.1) -> 73 frames (0..3 s inclusive), 388x640, opaque on rigc render's grey (232,232,232); encode-video.sh row getting-started-wave, 73 frames, 3.042 s. Frame 72 is the rest pose of frame 0 (source seam 0.002, max step 0.755), so it loops; MP4 seam 0.319 vs max step 0.779 PASS.
-->
