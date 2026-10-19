---
navLabel: Getting Started
title: Getting Started with rig-c — One Painting to a Browser Rig in 3 Minutes
description: Step-by-step walkthrough to build a rigged, breathing, waving 2D character from one painting using @rig-c/parts, rig-c, @rig-c/pose, and @rig-c/play with no GPU required.
keywords: rig-c tutorial, getting started, 2D character rigging tutorial, See-through layers, rig-parts build, rig-pose retarget
repoUrl: https://github.com/rig-c/getting-started
summaryForLlms: 10-step no-GPU walkthrough from pre-decomposed character layers to a compiled rig with idle and wave animations playing in the browser, plus downstream export routes.
---
# Getting Started with rig-c

You start with one painting of a character. You end with that character rigged — split into movable pieces on a skeleton — breathing, blinking, and waving in your browser.

Repository: <https://github.com/rig-c/getting-started>

## The Whole Pipeline in Three Steps

1. **Paint one character.** Any image model or illustration workflow produces a front-facing, full-body character PNG on a plain white background with arms clear of the body.
2. **Split it into layers, and mark the joints.** [See-through](https://github.com/shitagaki-lab/see-through) cuts the painting into layered parts (twice: full figure + head crop). Body-18 joints come from a lightweight CPU script (`rtmlib`) or hand placement.
3. **Run the rig-c packages on the CPU.** `@rig-c/parts`, `rig-c`, `@rig-c/pose`, and `@rig-c/play` assemble the parts, author meshes and bones, gate the build, retarget motion, and play it in the browser. **No GPU is used in step 3.**

## Try It First — No GPU, About 3 Minutes

This walkthrough builds a published example character whose painting and See-through layers are already prepared. Requires [Bun](https://bun.sh) 1.2+ and optionally [uv](https://docs.astral.sh/uv/) for step 6.

### 1. Install the Packages

```sh
mkdir rig-c-start && cd rig-c-start
git clone https://github.com/rig-c/getting-started
mkdir my-rig && cd my-rig
bun add @rig-c/parts rig-c @rig-c/pose @rig-c/play
```

### 2. Fetch the Example Inputs

```sh
curl -L -o exam.tar.gz https://codeload.github.com/rig-c/exam/tar.gz/01436ee3f02c189fe1a1e9656fe62068889837f5
tar -xzf exam.tar.gz --strip-components=3 exam-01436ee3f02c189fe1a1e9656fe62068889837f5/tasks/01-build/inputs
tar -xzf exam.tar.gz --strip-components=1 exam-01436ee3f02c189fe1a1e9656fe62068889837f5/LICENSE exam-01436ee3f02c189fe1a1e9656fe62068889837f5/NOTICE.md
rm exam.tar.gz
```

### 3. Initialize `config.json`

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

### 4. Propose the Head Box

```sh
bunx rig-parts layers inputs/layers/full
bunx rig-parts propose --head-box --full inputs/layers/full --canvas 1664x2432 | tail -n 1 > work/head_box.json
bun ../getting-started/scripts/take.ts work/head_box.json config.json seethrough.head_box=head_box
bunx rig-parts inputs --source inputs/painting.png --config config.json --out work
```

### 5. Assemble the Parts

```sh
bunx rig-parts assemble --propose-plan --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --config config.json > work/plan.json
bun ../getting-started/scripts/take.ts work/plan.json config.json assemble.plan=plan assemble.extend_below_crop=extend_below_crop
bunx rig-parts assemble --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --config config.json --out work
```

### 6. Detect Body-18 Keypoints

```sh
uv run --with rtmlib --with onnxruntime python ../getting-started/scripts/keypoints.py inputs/painting.png --out keypoints.json
```

### 7. Draft Bones, Meshes, Regions, and Idle Motion

```sh
bunx rig-parts propose --parts work/rig --source inputs/painting.png --out work --keypoints keypoints.json
bun ../getting-started/scripts/take.ts work/proposal.json config.json bones meshes regions motion
```

### 8. Build and Gate the Rig

```sh
bunx rig-parts build --config config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out out --loop
```

Expected verdict: `[check] check: PASS; 10 of 10 bar(s) measured`, followed by `build: PASS` and `out/idle.gif`.

### 9. Retarget a 3-Second Wave with `@rig-c/pose`

```sh
bun ../getting-started/scripts/wave.ts keypoints.json wave.pose.json
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
bunx rig-pose retarget --rig out/rig --map map.json --pose wave.pose.json --out wave.motion.json --name wave --profile spine-html --build wave-build
```

### 10. Play It in the Browser

```sh
bun ../getting-started/scripts/serve.ts
# Open http://localhost:3000/?model=wave-build/skeleton.model.json&anim=wave
```

## Three Ways to Use the Output

1. **On the web with [`@rig-c/play`](/docs/play/) or [`@rig-c/adapters`](/docs/adapters/)**: Load `skeleton.model.json` and part PNGs directly. The packages are MIT and integrate no Spine Runtime.
2. **In the Spine 4.3 Editor**: Import `out/check/build/skeleton.json` via `Import Data` and point `Images` to `out/rig/images/` to refine timelines by hand (requires rig-c 2.51.1+; the editor is under the Spine Editor License Agreement).
3. **In a game engine via official Spine Runtimes**: Load `skeleton.json` and `skeleton.atlas` in Unity, Godot, Unreal, or C++ runtimes under the Spine Runtimes License.

The example inputs in step 2 come from [rig-c/exam](https://github.com/rig-c/exam) and are **CC BY-NC 4.0**, not MIT: free to use with credit, not for commercial use, and what you build from them carries that licence. Which terms each route brings: [Licensing](/docs/licensing/).
