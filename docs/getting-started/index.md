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
    <picture>
      <source srcset="/assets/docs/getting-started-wave.webp" type="image/webp" media="(prefers-reduced-motion: no-preference)">
      <img src="/assets/docs/getting-started-wave-poster.png" alt="Animation: the example character raises her right arm above her head, waves, and lowers it back to rest" width="385" height="640">
    </picture>
  </div>
  <figcaption><span class="media-kind">Animation</span> The <code>wave</code> animation in this walkthrough's <code>wave-build/</code>, unedited: 3 s at 24 fps, from rest back to rest, looping (72 frames; the closing rest pose is frame 0 again). Drawn by <code>@rig-c/play</code> 1.12.0 over the page rather than by <code>rigc render</code>, whose frames are opaque by design. Same run as the idle above: <code>@rig-c/parts</code> 1.42.0, <code>rig-c</code> 2.64.1, <code>@rig-c/pose</code> 0.36.0. With reduced motion on, the first frame stands still.</figcaption>
</figure>

The full guide — making your own character, the GPU routes, troubleshooting and every measured figure — is the [rig-c/getting-started README](https://github.com/rig-c/getting-started#readme) and its [docs/REFERENCE.md](https://github.com/rig-c/getting-started/blob/main/docs/REFERENCE.md).

## Three ways to use the output

1. **On the web with [`@rig-c/play`](/docs/play/) or [`@rig-c/adapters`](/docs/adapters/)**: Load `skeleton.model.json` and part PNGs directly. The packages are MIT and integrate no Spine Runtime.
2. **In the Spine 4.3 Editor**: Import `out/check/build/skeleton.json` via `Import Data` and point `Images` to `out/rig/images/` to refine timelines by hand (requires rig-c 2.51.1+; the editor is under the Spine Editor License Agreement).
3. **In a game engine via official Spine Runtimes**: Load `skeleton.json` and `skeleton.atlas` in Unity, Godot, Unreal, or C++ runtimes under the Spine Runtimes License.

The example inputs in step 2 come from [rig-c/exam](https://github.com/rig-c/exam) and are **CC BY-NC 4.0**, not MIT: free to use with credit, not for commercial use, and what you build from them carries that licence. Which terms each route brings: [Licensing](/docs/licensing/).
