# Getting Started with rig-c

You start with one painting of a character. You end with that character rigged — split into movable pieces on a skeleton — breathing, blinking, and waving in your browser.

Repository: <https://github.com/rig-c/getting-started>

## The whole pipeline in three steps

1. **Paint one character.** Any image model or illustration workflow produces a front-facing, full-body character PNG on a plain white background with arms clear of the body.
2. **Split it into layers, and mark the joints.** [See-through](https://github.com/shitagaki-lab/see-through) cuts the painting into layered parts (twice: full figure + head crop). Body-18 joints come from a lightweight CPU script (`rtmlib`) or hand placement.
3. **Run the rig-c packages on the CPU.** `@rig-c/parts`, `rig-c`, `@rig-c/pose`, and `@rig-c/play` assemble the parts, author meshes and bones, gate the build, retarget motion, and play it in the browser. **No GPU is used in step 3.**

## Try it first — no GPU, no Python

This builds a published example character whose painting and See-through layers are already made, then plays it in your browser. The joints come from a hand-placed file that ships with the guide, so the only tools you need are [Bun](https://bun.sh) 1.2 or later, `git` and `curl`, on macOS or Linux (Windows is not tested).

**How long it takes.** Every command below was run as written, in order, from an empty folder on 2026-10-21 — Apple M4, Bun 1.4.2, and whatever `bun add` resolved that day (`rig-c` 2.65.1, `@rig-c/parts` 1.54.0, `@rig-c/pose` 0.38.0, `@rig-c/play` 1.12.0). Other jobs kept the machine's load average between 20 and 95 throughout, so both figures are upper bounds:

| Run | Steps 1–10, with 9b and 9c |
| --- | --- |
| Empty Bun cache (includes downloading the packages and the 41 MB example) | 536 s |
| A second run, caches warm, step 6 by the script (pose models already downloaded) | 571 s |

The three builds (steps 8, 9b and 9c, 100–190 s each here) and step 5 (assemble) are most of it. A quiet machine takes less; the two runs above are the only measurements.

### 1. Install the packages

```sh
mkdir rig-c-start
cd rig-c-start
git clone https://github.com/rig-c/getting-started
mkdir my-rig
cd my-rig
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

You should see 22 parts, then `recomposite vs source: mean |d|=1.13, within 8: 97.8%`.

### 6. Put the joints in place

~~~sh
sed -n '/^```json$/,/^```$/p' ../getting-started/docs/KEYPOINTS.md | sed '1d;$d' > keypoints.json
~~~

This copies the hand-placed body-18 joints for this painting out of the guide's [`docs/KEYPOINTS.md`](https://github.com/rig-c/getting-started/blob/main/docs/KEYPOINTS.md), which also explains how to place them for a painting of your own.

**Detecting the joints with a script instead** needs [uv](https://docs.astral.sh/uv/) and downloads about 300 MB of pose models on first run:

```sh
uv run --with rtmlib --with onnxruntime python ../getting-started/scripts/keypoints.py inputs/painting.png --out keypoints.json
```

You should see `18 observed, 0 occluded, 0 missing -> keypoints.json`. The hand-placed file was tuned to the script's joints, so every step prints what this page quotes either way, except step 9b's settle, which reads `33.2 px in` and `15.96 -> 12.87 deg` on the script's joints.

### 7. Draft the bones

```sh
bun -e 'const f = "keypoints.json", k = await Bun.file(f).json(); k.people[0].joints.l_ankle.at = [848, 2140]; await Bun.write(f, JSON.stringify(k, null, 1) + "\n")'
bunx rig-parts propose --parts work/rig --source inputs/painting.png --out work --keypoints keypoints.json
bun ../getting-started/scripts/take.ts work/proposal.json config.json bones meshes regions motion limbs
```

This is where a person corrects the draft, and the first line is the example's one correction: it puts the left ankle on the shin at `[848, 2140]`, so both ankles lie on the leg art and `propose` cuts the shoes into one part per foot. The hand-placed file already has it there; the script puts it 12 px off the art, and without the line `propose` prints a `LINT` and leaves the shoes one part that no leg bone moves.

You should see `0 LINT line(s) over 6 mesh(es) and the hip` and a coverage line ending `44 bone(s) — 29 checked and clean, 0 checked with a LINT line, 15 not checked`.

### 8. Build the rig

```sh
bunx rig-parts build --config config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out out --loop
```

You should see `limb cut: "shoes" opaque 13735 = "foot_r" 8071 + "foot_l" 5664`, then `check: PASS; 11 of 13 bar(s) measured, 2 skipped (FEET_STAY_LEVEL, STRESS_OFF_CHAIN)`, then `build: PASS`. `FEET_STAY_LEVEL` is skipped because the idle turns no leg; step 9b's hello does. Open `out/idle.gif`: the character breathes and blinks in a loop.

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

You should see `73 frame(s), 3 s at 24 fps`, a `GATE … green` line, and `wrote wave.motion.json — animations: idle, wave`. `wave-build/` holds the rig with both animations.

### 9b. Say hello

A motion can also be written as keys on the bones and handed to the build, which checks it with the rig. The guide's `scripts/hello.ts` writes a hello of under five seconds that way from the rig step 8 built; the config names the file in `motion.animations_from`, and the build runs again.

```sh
bun ../getting-started/scripts/hello.ts out/rig/rig.json
echo '{"animations_from": "hello.anim.json"}' > work/hello-from.json
bun ../getting-started/scripts/take.ts work/hello-from.json config.json motion.animations_from=animations_from
bunx rig-parts build --config config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out out --loop
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
bunx rig-parts propose --parts work/rig --source inputs/painting.png --out work --keypoints keypoints.json --cloth config.json --write-config config.cloth.json
mv config.cloth.json config.json
bun -e 'const f = "config.json", c = await Bun.file(f).json(); c.motion.tracks.find((t) => t.bone === "bun").amp = 1; await Bun.write(f, JSON.stringify(c, null, 2) + "\n")'
bunx rig-parts build --config config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out out --loop --lead-in 1
```

The first line writes the hello again without its skirt keys (`14 tracks of 115 keys`): from here physics follows her hip. `propose --cloth` writes the config with the new chains and `every other byte as read`, and `mv` makes it yours. Two lines correct the draft: `strength` makes the side locks stiff enough not to pull off her cheek when her head turns, and the `bun -e` line raises the bun's swing, without which the build stops at `CHECK_CHAIN_LAG`.

You should see `check: PASS; 12 of 13 bar(s) measured, 1 skipped (STRESS_OFF_CHAIN); 5 warning(s) (SEAM_OVER_MOTION, CLOTH_SETTLES, not a bar)`, a `lead-in:` line ending `max |d| 0, 0 px over 40 — the jump at the wrap`, and `build: PASS`. `CLOTH_SETTLES` is a warning, not a failure: the skirt hangs into place within 2 seconds and then rests, because the idle never moves her hip. `--lead-in 1` plays the idle once before `out/idle.gif` is cut from it, so the loop starts after the skirt has settled.

### 10. Play it in your browser

```sh
bun ../getting-started/scripts/serve.ts
```

Open <http://localhost:3000/?model=out/check/build/skeleton.model.json&anim=hello&under=idle>: she notices you, smiles with two little shrugs, waves with her forearm beside her shoulder and re-plants her weight, while the locks beside her face and the skirt trail after her. `&under=idle` keeps the idle playing beneath, so she breathes through it. The page also blows a light breeze through `@rig-c/play`'s `player.environment()`; untick **breeze**, or add `&wind=0`, for the runtime's own steady wind. Step 9's wave is at <http://localhost:3000/?model=wave-build/skeleton.model.json&anim=wave>; the menu switches animations. Ctrl+C stops the server.

<figure>
  <div class="media">
    <picture>
      <source srcset="/assets/docs/getting-started-hello.webp" type="image/webp" media="(prefers-reduced-motion: no-preference)">
      <img src="/assets/docs/getting-started-hello-poster.png" alt="Animation: the example character notices the viewer and straightens her head, smiles with two small shrugs, waves with her forearm beside her shoulder, then shifts her weight, one foot sliding in toward the other and back" width="356" height="640">
    </picture>
  </div>
  <figcaption><span class="media-kind">Animation</span> The <code>hello</code> in this walkthrough's <code>out/check/build</code> after the guide's steps 9b and 9c, unedited: 4.75 s, 57 frames at 12 fps, looping, in the page's breeze, after one pass of settling so the hair and skirt are already moving. Step 10's page plays the hello over the <code>idle</code>, so she also breathes through it; this clip is the hello alone, because the two loops (4.75 s and 3.33 s) never line up into one that repeats. Its wave is an elbow-down wave, the upper arm kept within 4 degrees of rest, and every seam the guide's build reads stays inside its tear bars (gap ≤ 25 px, ghost ≤ 50 px) at every phase of the breeze. Drawn by <code>@rig-c/play</code> 1.12.0 over the page rather than by <code>rigc render</code>, whose frames are opaque by design. Run as written on 2026-10-21 with <code>@rig-c/parts</code> 1.53.0, <code>rig-c</code> 2.65.1, <code>@rig-c/pose</code> 0.37.0. With reduced motion on, the first frame stands still.</figcaption>
</figure>

The full guide — making your own character, the GPU routes, troubleshooting and every measured figure — is the [rig-c/getting-started README](https://github.com/rig-c/getting-started#readme) and its [docs/REFERENCE.md](https://github.com/rig-c/getting-started/blob/main/docs/REFERENCE.md).

## Three ways to use the output

1. **On the web with [`@rig-c/play`](/docs/play/) or [`@rig-c/adapters`](/docs/adapters/)**: Load `skeleton.model.json` and part PNGs directly. The packages are MIT and integrate no Spine Runtime.
2. **In the Spine 4.3 Editor**: Import `out/check/build/skeleton.json` via `Import Data` and point `Images` to `out/rig/images/` to refine timelines by hand (requires rig-c 2.51.1+; the editor is under the Spine Editor License Agreement).
3. **In a game engine via official Spine Runtimes**: Load `skeleton.json` and `skeleton.atlas` in Unity, Godot, Unreal, or C++ runtimes under the Spine Runtimes License.

The example inputs in step 2 come from [rig-c/exam](https://github.com/rig-c/exam) and are **CC BY-NC 4.0**, not MIT: free to use with credit, not for commercial use, and what you build from them carries that licence. Which terms each route brings: [Licensing](/docs/licensing/).
