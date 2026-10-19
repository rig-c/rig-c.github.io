export interface PageSpec {
  slug: string; // "" for root, or "parts", "pose", etc.
  navLabel: string;
  title: string;
  description: string;
  keywords: string[];
  packageName?: string;
  packageVersion?: string;
  repoUrl: string;
  npmUrl?: string;
  summaryForLlms: string;
  markdown: string;
  html: string;
}

// rig-c.org has no DNS yet; canonicals point at the live GitHub Pages host until the custom domain is connected.
export const SITE_ORIGIN = 'https://rig-c.github.io';

export const PAGES: readonly PageSpec[] = [
  {
    slug: '',
    navLabel: 'Overview',
    title: 'rig-c — AI-Authored 2D Rigging and Animation Toolchain',
    description:
      'AI-authored 2D character rigging and animation, verified before a byte is written. Compile Spine 4.3 skeleton data and model documents from one painting with named assertions.',
    keywords: [
      'rig-c',
      'rigc',
      '2D rigging',
      'Spine 4.3',
      'AI agent toolchain',
      '@rig-c/parts',
      '@rig-c/pose',
      '@rig-c/play',
      '@rig-c/review',
      '@rig-c/adapters',
    ],
    packageName: 'rig-c',
    packageVersion: '2.61.0',
    repoUrl: 'https://github.com/rig-c',
    npmUrl: 'https://www.npmjs.com/package/rig-c',
    summaryForLlms:
      'Toolchain overview, package index (parts, pose, core, review, play, adapters), installation commands, AI agent skill setup, and licensing boundaries.',
    markdown: `# rig-c — AI-Authored 2D Rigging and Animation, Verified Before It Is Written

One character painting goes in; a rigged, animated 2D character that plays in the browser or imports into the Spine 4.3 editor comes out. Every stage prints named, numeric findings and refuses by name what it cannot verify, so a broken file never reaches the disk.

**rig-c makes no images.** The painting and its layer split ([See-through](https://github.com/shitagaki-lab/see-through)) come from image models you run yourself — on your own GPU, or a free web demo. rig-c starts from those files, ships no model weights, and runs every one of its own steps on the CPU.

## The Toolchain at a Glance

| # | Package | Latest | Install | What It Does |
| :-: | --- | --- | --- | --- |
| 1 | [**@rig-c/parts**](/parts/) | \`1.38.0\` | \`npm i -D @rig-c/parts\` | Assembles one character painting's decomposed See-through layers into rig-ready parts, then authors weighted meshes, bone chains, physics, and a looping idle over them. |
| 2 | [**@rig-c/pose**](/pose/) | \`0.33.0\` | \`npm i -D @rig-c/pose\` | Cleans and retargets a body-18 pose sequence (from video, dataset, or hand-placed points) onto a rig that rig-c built, gated before keys are written. |
| 3 | [**rig-c / @rig-c/core**](/core/) | \`2.61.0\` | \`npm i -D rig-c\` | The rig compiler: a rig spec and a motion spec in, Spine 4.3 skeleton data (\`skeleton.json\` + \`.atlas\`) and \`skeleton.model.json\` out — gated by named assertions before a byte is written (36 under the default \`--profile spine\`, all 50 under the opt-in \`--profile rig-play\`). |
| 4 | [**@rig-c/review**](/review/) | \`0.2.1\` | \`npm i -D @rig-c/review\` | Local human inspection workspace: compare setup geometry, compiled-model playback, source video/sheets, and export frame/bone/slot-bound feedback ready to become an issue. |
| 5 | [**@rig-c/play**](/play/) | \`1.12.0\` | \`npm i @rig-c/play\` | Plays \`skeleton.model.json\` in the browser with no Spine runtime — as plain DOM elements (\`<img>\` with CSS \`matrix()\`) or one \`<canvas>\` per player. |
| 6 | [**@rig-c/adapters**](/adapters/) | \`0.1.1\` | \`npm i @rig-c/pixi\`<br>\`npm i @rig-c/phaser\`<br>\`npm i @rig-c/three\` | Plays a rig-c compiled model inside PixiJS 8, Phaser 4.2+, or Three.js 0.186+ through \`@rig-c/play\`'s posing core, with no Spine runtime. |

Additional resources:
- [**Getting Started**](/getting-started/) — Try the full pipeline in about 3 minutes with no GPU, or set up your own character workflow.
- [**AI Agent Exam (\`rig-c/exam\`)**](/exam/) — Open-book benchmark measuring whether coding agents that have never seen the tools pass build, motion retargeting, and repair tasks on the first sitting.
- [**Reproducible Examples**](/examples/) — Public character inputs, the 20-rig Agent Family reproducibility suite, and the 12-second reproducible trailer.
- [**Machine-Readable Docs (\`/llms.txt\`)**](/llms.txt) and [**Full Context (\`/llms-full.txt\`)**](/llms-full.txt) — Plain-text indexes optimized for \`curl\` and LLM context windows.

## Quick Install

\`\`\`sh
# Run the compiler CLI directly with Bun
bunx rig-c --help

# Install the authoring & compilation toolchain in a project
bun add -d @rig-c/parts rig-c @rig-c/pose @rig-c/review

# Install the zero-Spine-runtime browser player
bun add @rig-c/play
\`\`\`

### Install Agent Skills

\`rig-c\` and \`@rig-c/parts\` ship [Agent Skills](https://agentskills.io) (\`skills/<name>/SKILL.md\`, inside each npm package) that route coding agents directly to the authoritative authoring rules:

\`\`\`sh
# Codex, Gemini CLI, or Antigravity: link rig-c's skills into .agents/skills/
bun add -d rig-c
bun rigc skills install

# Claude Code: the rig-c/core repository is a plugin marketplace
/plugin marketplace add rig-c/core
/plugin install rigc@rigc
\`\`\`

## Built for Agents That Cannot See

An AI agent asked to author a 2D rig cannot see the screen, and standard JSON parsers accept broken rigs in silence — a 4.2-shaped constraint vanishes in 4.3, a mismatched \`size:\` collapses every UV, a four-number curve array yields \`NaN\`, and a mesh whose vertex count equals its UV count silently loses its bone weights.

rig-c replaces that silence with four structural invariants:

1. **The messages are the UI.** Every refusal names the object, the value found, and the value required (for example, \`A20_MESH_WEIGHTS_COHERENT: mesh "x" vertex 12 weights sum to 0.9000\`). An agent reads one line and knows which field in which file to change.
2. **Nothing is invented.** The compiler never guesses defaults from art or fills in missing numbers. Where the input is silent, it raises a named \`CompileError\`.
3. **Emit only after green.** \`rigc build\` compiles, runs its assertion gate, and writes to disk **only** if every assertion passes. No broken file ever outlives the console output that warned about it.
4. **A person can still look.** [\`@rig-c/review\`](/review/) lets a human inspect the agent's output against reference footage and export structured feedback bound to a frame, bone, or slot.

## Package Names & Aliases

- \`rig-c\`, \`@rig-c/core\`, and \`spine-rigc\` are the same compiler package on npm and install the \`rigc\` command.
- \`@rig-c/parts\`, \`rig-parts\`, and \`spine-parts\` are the same part-assembly package and install the \`rig-parts\` command.
- \`@rig-c/play\`, \`rig-play\`, and \`spine-html\` are the same browser player package.

## Licensing, Stated Plainly

All rig-c packages are **MIT licensed**. The published packages link **no Spine runtime**:
- \`rigc\` emits both Spine 4.3 skeleton data (\`skeleton.json\` + \`skeleton.atlas\`) and rig-c's own compiled model document (\`skeleton.model.json\`).
- Playing \`skeleton.model.json\` with [\`@rig-c/play\`](/play/) or [\`@rig-c/adapters\`](/adapters/) integrates no Esoteric Software code and requires no Spine license.
- Importing \`skeleton.json\` into the Spine Editor or playing it with an official Spine Runtime is subject to Esoteric Software's [Spine Editor License Agreement](https://esotericsoftware.com/spine-editor-license) and [Spine Runtimes License Agreement](https://esotericsoftware.com/spine-runtimes-license).
`,
    html: `<p class="lead">One character painting goes in; a rigged, animated 2D character that plays in the browser or imports into the Spine 4.3 editor comes out. Every stage prints named, numeric findings and refuses by name what it cannot verify, so a broken file never reaches the disk.</p>

<div class="callout">
  <strong>rig-c makes no images.</strong> The painting and its layer split (<a href="https://github.com/shitagaki-lab/see-through">See-through</a>) come from image models you run yourself — on your own GPU, or a free web demo. rig-c starts from those files, ships no model weights, and runs every one of its own steps on the CPU.
</div>

<h2>The Toolchain at a Glance</h2>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Package</th>
        <th>Latest</th>
        <th>Install</th>
        <th>What It Does</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td><a href="/parts/"><strong>@rig-c/parts</strong></a></td>
        <td><code>1.38.0</code></td>
        <td><code>npm i -D @rig-c/parts</code></td>
        <td>Assembles one character painting's decomposed See-through layers into rig-ready parts, then authors weighted meshes, bone chains, physics, and a looping idle over them.</td>
      </tr>
      <tr>
        <td>2</td>
        <td><a href="/pose/"><strong>@rig-c/pose</strong></a></td>
        <td><code>0.33.0</code></td>
        <td><code>npm i -D @rig-c/pose</code></td>
        <td>Cleans and retargets a body-18 pose sequence (from video, dataset, or hand-placed points) onto a rig that rig-c built, gated before keys are written.</td>
      </tr>
      <tr>
        <td>3</td>
        <td><a href="/core/"><strong>rig-c / @rig-c/core</strong></a></td>
        <td><code>2.61.0</code></td>
        <td><code>npm i -D rig-c</code></td>
        <td>The rig compiler: a rig spec and a motion spec in, Spine 4.3 skeleton data (<code>skeleton.json</code> + <code>.atlas</code>) and <code>skeleton.model.json</code> out — gated by named assertions before a byte is written (36 under the default <code>--profile spine</code>, all 50 under the opt-in <code>--profile rig-play</code>).</td>
      </tr>
      <tr>
        <td>4</td>
        <td><a href="/review/"><strong>@rig-c/review</strong></a></td>
        <td><code>0.2.1</code></td>
        <td><code>npm i -D @rig-c/review</code></td>
        <td>Local human inspection workspace: compare setup geometry, compiled-model playback, source video/sheets, and export frame/bone/slot-bound feedback ready to become an issue.</td>
      </tr>
      <tr>
        <td>5</td>
        <td><a href="/play/"><strong>@rig-c/play</strong></a></td>
        <td><code>1.12.0</code></td>
        <td><code>npm i @rig-c/play</code></td>
        <td>Plays <code>skeleton.model.json</code> in the browser with no Spine runtime — as plain DOM elements (<code>&lt;img&gt;</code> with CSS <code>matrix()</code>) or one <code>&lt;canvas&gt;</code> per player.</td>
      </tr>
      <tr>
        <td>6</td>
        <td><a href="/adapters/"><strong>@rig-c/adapters</strong></a></td>
        <td><code>0.1.1</code></td>
        <td><code>npm i @rig-c/pixi</code><br /><code>npm i @rig-c/phaser</code><br /><code>npm i @rig-c/three</code></td>
        <td>Plays a rig-c compiled model inside PixiJS 8, Phaser 4.2+, or Three.js 0.186+ through <code>@rig-c/play</code>'s posing core, with no Spine runtime.</td>
      </tr>
    </tbody>
  </table>
</div>

<ul>
  <li><a href="/getting-started/"><strong>Getting Started</strong></a> — Try the full pipeline in about 3 minutes with no GPU, or set up your own character workflow.</li>
  <li><a href="/exam/"><strong>AI Agent Exam (<code>rig-c/exam</code>)</strong></a> — Open-book benchmark measuring whether coding agents that have never seen the tools pass build, motion retargeting, and repair tasks on the first sitting.</li>
  <li><a href="/examples/"><strong>Reproducible Examples</strong></a> — Public character inputs, the 20-rig Agent Family reproducibility suite, and the 12-second reproducible trailer.</li>
  <li><a href="/llms.txt"><strong><code>/llms.txt</code></strong></a> and <a href="/llms-full.txt"><strong><code>/llms-full.txt</code></strong></a> — Plain-text indexes optimized for <code>curl</code> and LLM context windows.</li>
</ul>

<h2>Quick Install</h2>
<pre><code># Run the compiler CLI directly with Bun
bunx rig-c --help

# Install the authoring &amp; compilation toolchain in a project
bun add -d @rig-c/parts rig-c @rig-c/pose @rig-c/review

# Install the zero-Spine-runtime browser player
bun add @rig-c/play</code></pre>

<h3>Install Agent Skills</h3>
<p><code>rig-c</code> and <code>@rig-c/parts</code> ship <a href="https://agentskills.io">Agent Skills</a> (<code>skills/&lt;name&gt;/SKILL.md</code>, inside each npm package) that route coding agents directly to the authoritative authoring rules:</p>
<pre><code># Codex, Gemini CLI, or Antigravity: link rig-c's skills into .agents/skills/
bun add -d rig-c
bun rigc skills install

# Claude Code: the rig-c/core repository is a plugin marketplace
/plugin marketplace add rig-c/core
/plugin install rigc@rigc</code></pre>

<h2>Built for Agents That Cannot See</h2>
<p>An AI agent asked to author a 2D rig cannot see the screen, and standard JSON parsers accept broken rigs in silence — a 4.2-shaped constraint vanishes in 4.3, a mismatched <code>size:</code> collapses every UV, a four-number curve array yields <code>NaN</code>, and a mesh whose vertex count equals its UV count silently loses its bone weights.</p>
<p>rig-c replaces that silence with four structural invariants:</p>
<ol>
  <li><strong>The messages are the UI.</strong> Every refusal names the object, the value found, and the value required (for example, <code>A20_MESH_WEIGHTS_COHERENT: mesh "x" vertex 12 weights sum to 0.9000</code>). An agent reads one line and knows which field in which file to change.</li>
  <li><strong>Nothing is invented.</strong> The compiler never guesses defaults from art or fills in missing numbers. Where the input is silent, it raises a named <code>CompileError</code>.</li>
  <li><strong>Emit only after green.</strong> <code>rigc build</code> compiles, runs its assertion gate, and writes to disk <strong>only</strong> if every assertion passes. No broken file ever outlives the console output that warned about it.</li>
  <li><strong>A person can still look.</strong> <a href="/review/"><code>@rig-c/review</code></a> lets a human inspect the agent's output against reference footage and export structured feedback bound to a frame, bone, or slot.</li>
</ol>

<h2>Package Names &amp; Aliases</h2>
<ul>
  <li><code>rig-c</code>, <code>@rig-c/core</code>, and <code>spine-rigc</code> are the same compiler package on npm and install the <code>rigc</code> command.</li>
  <li><code>@rig-c/parts</code>, <code>rig-parts</code>, and <code>spine-parts</code> are the same part-assembly package and install the <code>rig-parts</code> command.</li>
  <li><code>@rig-c/play</code>, <code>rig-play</code>, and <code>spine-html</code> are the same browser player package.</li>
</ul>

<h2>Licensing, Stated Plainly</h2>
<p>All rig-c packages are <strong>MIT licensed</strong>. The published packages link <strong>no Spine runtime</strong>:</p>
<ul>
  <li><code>rigc</code> emits both Spine 4.3 skeleton data (<code>skeleton.json</code> + <code>skeleton.atlas</code>) and rig-c's own compiled model document (<code>skeleton.model.json</code>).</li>
  <li>Playing <code>skeleton.model.json</code> with <a href="/play/"><code>@rig-c/play</code></a> or <a href="/adapters/"><code>@rig-c/adapters</code></a> integrates no Esoteric Software code and requires no Spine license.</li>
  <li>Importing <code>skeleton.json</code> into the Spine Editor or playing it with an official Spine Runtime is subject to Esoteric Software's <a href="https://esotericsoftware.com/spine-editor-license">Spine Editor License Agreement</a> and <a href="https://esotericsoftware.com/spine-runtimes-license">Spine Runtimes License Agreement</a>.</li>
</ul>`,
  },
  {
    slug: 'getting-started',
    navLabel: 'Getting Started',
    title: 'Getting Started with rig-c — One Painting to a Browser Rig in 3 Minutes',
    description:
      'Step-by-step walkthrough to build a rigged, breathing, waving 2D character from one painting using @rig-c/parts, rig-c, @rig-c/pose, and @rig-c/play with no GPU required.',
    keywords: [
      'rig-c tutorial',
      'getting started',
      '2D character rigging tutorial',
      'See-through layers',
      'rig-parts build',
      'rig-pose retarget',
    ],
    repoUrl: 'https://github.com/rig-c/getting-started',
    summaryForLlms:
      '10-step no-GPU walkthrough from pre-decomposed character layers to a compiled rig with idle and wave animations playing in the browser, plus downstream export routes.',
    markdown: `# Getting Started with rig-c

You start with one painting of a character. You end with that character rigged — split into movable pieces on a skeleton — breathing, blinking, and waving in your browser.

Repository: <https://github.com/rig-c/getting-started>

## The Whole Pipeline in Three Steps

1. **Paint one character.** Any image model or illustration workflow produces a front-facing, full-body character PNG on a plain white background with arms clear of the body.
2. **Split it into layers, and mark the joints.** [See-through](https://github.com/shitagaki-lab/see-through) cuts the painting into layered parts (twice: full figure + head crop). Body-18 joints come from a lightweight CPU script (\`rtmlib\`) or hand placement.
3. **Run the rig-c packages on the CPU.** \`@rig-c/parts\`, \`rig-c\`, \`@rig-c/pose\`, and \`@rig-c/play\` assemble the parts, author meshes and bones, gate the build, retarget motion, and play it in the browser. **No GPU is used in step 3.**

## Try It First — No GPU, About 3 Minutes

This walkthrough builds a published example character whose painting and See-through layers are already prepared. Requires [Bun](https://bun.sh) 1.2+ and optionally [uv](https://docs.astral.sh/uv/) for step 6.

### 1. Install the Packages

\`\`\`sh
mkdir rig-c-start && cd rig-c-start
git clone https://github.com/rig-c/getting-started
mkdir my-rig && cd my-rig
bun add @rig-c/parts rig-c @rig-c/pose @rig-c/play
\`\`\`

### 2. Fetch the Example Inputs

\`\`\`sh
curl -L -o exam.tar.gz https://codeload.github.com/rig-c/exam/tar.gz/01436ee3f02c189fe1a1e9656fe62068889837f5
tar -xzf exam.tar.gz --strip-components=3 exam-01436ee3f02c189fe1a1e9656fe62068889837f5/tasks/01-build/inputs
tar -xzf exam.tar.gz --strip-components=1 exam-01436ee3f02c189fe1a1e9656fe62068889837f5/LICENSE exam-01436ee3f02c189fe1a1e9656fe62068889837f5/NOTICE.md
rm exam.tar.gz
\`\`\`

### 3. Initialize \`config.json\`

\`\`\`sh
cat > config.json <<'EOF'
{
  "key": "exam-01",
  "seethrough": { "resolution": 1024, "steps": 30, "seed": 42, "offload": true },
  "assemble": { "rig_scale": 0.5 }
}
EOF
bunx rig-parts inputs --source inputs/painting.png --config config.json --out work
\`\`\`

### 4. Propose the Head Box

\`\`\`sh
bunx rig-parts layers inputs/layers/full
bunx rig-parts propose --head-box --full inputs/layers/full --canvas 1664x2432 | tail -n 1 > work/head_box.json
bun ../getting-started/scripts/take.ts work/head_box.json config.json seethrough.head_box=head_box
bunx rig-parts inputs --source inputs/painting.png --config config.json --out work
\`\`\`

### 5. Assemble the Parts

\`\`\`sh
bunx rig-parts assemble --propose-plan --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --config config.json > work/plan.json
bun ../getting-started/scripts/take.ts work/plan.json config.json assemble.plan=plan assemble.extend_below_crop=extend_below_crop
bunx rig-parts assemble --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --config config.json --out work
\`\`\`

### 6. Detect Body-18 Keypoints

\`\`\`sh
uv run --with rtmlib --with onnxruntime python ../getting-started/scripts/keypoints.py inputs/painting.png --out keypoints.json
\`\`\`

### 7. Draft Bones, Meshes, Regions, and Idle Motion

\`\`\`sh
bunx rig-parts propose --parts work/rig --source inputs/painting.png --out work --keypoints keypoints.json
bun ../getting-started/scripts/take.ts work/proposal.json config.json bones meshes regions motion
\`\`\`

### 8. Build and Gate the Rig

\`\`\`sh
bunx rig-parts build --config config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out out --loop
\`\`\`

Expected verdict: \`[check] check: PASS; 10 of 10 bar(s) measured\`, followed by \`build: PASS\` and \`out/idle.gif\`.

### 9. Retarget a 3-Second Wave with \`@rig-c/pose\`

\`\`\`sh
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
\`\`\`

### 10. Play It in the Browser

\`\`\`sh
bun ../getting-started/scripts/serve.ts
# Open http://localhost:3000/?model=wave-build/skeleton.model.json&anim=wave
\`\`\`

## Three Ways to Use the Output

1. **On the web with [\`@rig-c/play\`](/play/) or [\`@rig-c/adapters\`](/adapters/)**: Load \`skeleton.model.json\` and part PNGs directly. MIT licensed, zero Spine runtime dependencies.
2. **In the Spine 4.3 Editor**: Import \`out/check/build/skeleton.json\` via \`Import Data\` and point \`Images\` to \`out/rig/images/\` to refine timelines by hand (requires rig-c 2.51.1+ and a Spine Editor license).
3. **In a game engine via official Spine Runtimes**: Load \`skeleton.json\` and \`skeleton.atlas\` in Unity, Godot, Unreal, or C++ runtimes under the Spine Runtimes License.
`,
    html: `<p class="lead">You start with one painting of a character. You end with that character rigged — split into movable pieces on a skeleton — breathing, blinking, and waving in your browser.</p>

<div class="meta-bar">
  <span>Repository: <a href="https://github.com/rig-c/getting-started"><code>github.com/rig-c/getting-started</code></a></span>
  <span>Requirements: <code>Bun &gt;= 1.2</code> (CPU only)</span>
</div>

<h2>The Whole Pipeline in Three Steps</h2>
<ol>
  <li><strong>Paint one character.</strong> Any image model or illustration workflow produces a front-facing, full-body character PNG on a plain white background with arms clear of the body.</li>
  <li><strong>Split it into layers, and mark the joints.</strong> <a href="https://github.com/shitagaki-lab/see-through">See-through</a> cuts the painting into layered parts (twice: full figure + head crop). Body-18 joints come from a lightweight CPU script (<code>rtmlib</code>) or hand placement.</li>
  <li><strong>Run the rig-c packages on the CPU.</strong> <a href="/parts/"><code>@rig-c/parts</code></a>, <a href="/core/"><code>rig-c</code></a>, <a href="/pose/"><code>@rig-c/pose</code></a>, and <a href="/play/"><code>@rig-c/play</code></a> assemble the parts, author meshes and bones, gate the build, retarget motion, and play it in the browser. <strong>No GPU is used in step 3.</strong></li>
</ol>

<h2>Try It First — No GPU, About 3 Minutes</h2>
<p>This walkthrough builds a published example character whose painting and See-through layers are already prepared. Requires <a href="https://bun.sh">Bun</a> 1.2+ and optionally <a href="https://docs.astral.sh/uv/">uv</a> for step 6.</p>

<h3>1. Install the Packages</h3>
<pre><code>mkdir rig-c-start &amp;&amp; cd rig-c-start
git clone https://github.com/rig-c/getting-started
mkdir my-rig &amp;&amp; cd my-rig
bun add @rig-c/parts rig-c @rig-c/pose @rig-c/play</code></pre>

<h3>2. Fetch the Example Inputs</h3>
<pre><code>curl -L -o exam.tar.gz https://codeload.github.com/rig-c/exam/tar.gz/01436ee3f02c189fe1a1e9656fe62068889837f5
tar -xzf exam.tar.gz --strip-components=3 exam-01436ee3f02c189fe1a1e9656fe62068889837f5/tasks/01-build/inputs
tar -xzf exam.tar.gz --strip-components=1 exam-01436ee3f02c189fe1a1e9656fe62068889837f5/LICENSE exam-01436ee3f02c189fe1a1e9656fe62068889837f5/NOTICE.md
rm exam.tar.gz</code></pre>

<h3>3. Initialize <code>config.json</code></h3>
<pre><code>cat &gt; config.json &lt;&lt;'EOF'
{
  "key": "exam-01",
  "seethrough": { "resolution": 1024, "steps": 30, "seed": 42, "offload": true },
  "assemble": { "rig_scale": 0.5 }
}
EOF
bunx rig-parts inputs --source inputs/painting.png --config config.json --out work</code></pre>

<h3>4. Propose the Head Box</h3>
<pre><code>bunx rig-parts layers inputs/layers/full
bunx rig-parts propose --head-box --full inputs/layers/full --canvas 1664x2432 | tail -n 1 &gt; work/head_box.json
bun ../getting-started/scripts/take.ts work/head_box.json config.json seethrough.head_box=head_box
bunx rig-parts inputs --source inputs/painting.png --config config.json --out work</code></pre>

<h3>5. Assemble the Parts</h3>
<pre><code>bunx rig-parts assemble --propose-plan --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --config config.json &gt; work/plan.json
bun ../getting-started/scripts/take.ts work/plan.json config.json assemble.plan=plan assemble.extend_below_crop=extend_below_crop
bunx rig-parts assemble --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --config config.json --out work</code></pre>

<h3>6. Detect Body-18 Keypoints</h3>
<pre><code>uv run --with rtmlib --with onnxruntime python ../getting-started/scripts/keypoints.py inputs/painting.png --out keypoints.json</code></pre>

<h3>7. Draft Bones, Meshes, Regions, and Idle Motion</h3>
<pre><code>bunx rig-parts propose --parts work/rig --source inputs/painting.png --out work --keypoints keypoints.json
bun ../getting-started/scripts/take.ts work/proposal.json config.json bones meshes regions motion</code></pre>

<h3>8. Build and Gate the Rig</h3>
<pre><code>bunx rig-parts build --config config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out out --loop</code></pre>
<p>Expected verdict: <code>[check] check: PASS; 10 of 10 bar(s) measured</code>, followed by <code>build: PASS</code> and <code>out/idle.gif</code>.</p>

<h3>9. Retarget a 3-Second Wave with <code>@rig-c/pose</code></h3>
<pre><code>bun ../getting-started/scripts/wave.ts keypoints.json wave.pose.json
cat &gt; map.json &lt;&lt;'EOF'
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
bunx rig-pose retarget --rig out/rig --map map.json --pose wave.pose.json --out wave.motion.json --name wave --profile spine-html --build wave-build</code></pre>

<h3>10. Play It in the Browser</h3>
<pre><code>bun ../getting-started/scripts/serve.ts
# Open http://localhost:3000/?model=wave-build/skeleton.model.json&amp;anim=wave</code></pre>

<h2>Three Ways to Use the Output</h2>
<ol>
  <li><strong>On the web with <a href="/play/"><code>@rig-c/play</code></a> or <a href="/adapters/"><code>@rig-c/adapters</code></a></strong>: Load <code>skeleton.model.json</code> and part PNGs directly. MIT licensed, zero Spine runtime dependencies.</li>
  <li><strong>In the Spine 4.3 Editor</strong>: Import <code>out/check/build/skeleton.json</code> via <code>Import Data</code> and point <code>Images</code> to <code>out/rig/images/</code> to refine timelines by hand (requires rig-c 2.51.1+ and a Spine Editor license).</li>
  <li><strong>In a game engine via official Spine Runtimes</strong>: Load <code>skeleton.json</code> and <code>skeleton.atlas</code> in Unity, Godot, Unreal, or C++ runtimes under the Spine Runtimes License.</li>
</ol>`,
  },
  {
    slug: 'parts',
    navLabel: 'Parts',
    title: '@rig-c/parts (rig-parts) — AI-Authored 2D Character Rigs from One Painting',
    description:
      '@rig-c/parts merges 2-pass See-through layer decompositions from one anime painting into rig-ready PNG parts, weighted meshes, bone chains, physics, and a gated Spine 4.3 build.',
    keywords: [
      '@rig-c/parts',
      'rig-parts',
      'spine-parts',
      'See-through layers',
      '2D mesh generation',
      'automatic rigging',
      'Spine physics',
    ],
    packageName: '@rig-c/parts',
    packageVersion: '1.38.0',
    repoUrl: 'https://github.com/rig-c/parts',
    npmUrl: 'https://www.npmjs.com/package/@rig-c/parts',
    summaryForLlms:
      '@rig-c/parts (v1.38.0) CLI and pipeline: merges full + head See-through runs, proposes bones/meshes/physics, and runs rigc build + rig-parts check (nine bars, plus fold, feet, sleeve-stress, limb and joint-range bars where the rig has them).',
    markdown: `# @rig-c/parts (\`rig-parts\`)

**AI-authored 2D character rigs from one anime painting, verified before they are written.**

- **npm package**: \`@rig-c/parts\` (aliases: \`rig-parts\`, \`spine-parts\`), latest \`1.38.0\`
- **CLI executable**: \`rig-parts\`
- **Repository**: <https://github.com/rig-c/parts>
- **License**: MIT

\`@rig-c/parts\` takes a single character painting and the layers [See-through](https://github.com/shitagaki-lab/see-through) decomposed it into, merges them into measured rig-space parts, authors weighted meshes, bone chains, physics constraints, and a looping idle in [\`rig-c\`](/core/)'s spec, and hands that spec to \`rig-c\` to compile, gate, pack, render, and check.

## Install

\`\`\`sh
bun add -d @rig-c/parts rig-c
bunx rig-parts --help
\`\`\`

## What It Takes In

1. **One character painting (\`painting.png\`)** — Front view, full body head-to-toe, arms clear of the body, hands apart and open, legs with a clear gap, on a plain white background. Checked against body-18 joints before See-through runs via \`rig-parts painting\`.
2. **Two See-through layer sets (\`full\` and \`head\`)** — One run on the whole figure (white-padded to a square) and one run on a square head crop so eye and face layers separate cleanly. Accepts either the ComfyUI wrapper directory (\`layers.json\` + \`parts/<tag>.png\`) or an upstream \`.psd\`.
3. **A character config (\`config.json\`)** — Declares the part merge plan, \`head_box\`, bones, mesh region rules, idle sines, and optional constraints. Unknown or missing fields are refused by name.

## What \`rig-parts build\` Emits

| Output Path under \`--out\` | Contents |
| --- | --- |
| \`check/build/skeleton.json\`, \`skeleton.atlas\`, \`skeleton.png\` | **The primary artifact** — Spine 4.3 skeleton data, compiled model (\`skeleton.model.json\`), and one polygon-packed free-edge atlas page, gated under \`rig-play\` and \`spine\`. |
| \`parts/*.png\`, \`parts.json\`, \`recomposite_rig.png\`, \`recomposite_error_rig.png\` | Cropped alpha-box part PNGs, provenance record per pixel, flat recomposite, and red/blue uncovered error map against the source painting. |
| \`rig/\` | \`rig.json\`, \`motion.json\`, \`mesh_report.json\`, and 4px-padded \`images/\` for Spine Editor import. |
| \`check/\` | Gate verdicts verbatim, rendered frames, \`geometry.json\`, \`contact.png\`, \`motion_heat.png\`, and \`check.json\` (including \`SEAM_OVER_MOTION\`, \`CLOTH_SETTLES\`, loop closure, and fold checks). |
| \`idle.png\`, \`idle-indexed.png\`, \`idle.gif\` | Written with \`--loop\`: lossless APNG exactness record, 256-color indexed APNG, and looping GIF with measured palette error. |

## Core CLI Commands

\`\`\`sh
# Inspect See-through layer coverage and WARN lines
rig-parts layers <dir | layers.json | file.psd>

# Verify painting against body-18 keypoints before decomposition
rig-parts painting --source painting.png --keypoints keypoints.json

# Cut full (white-padded square) and head-crop inputs for See-through
rig-parts inputs --source painting.png --config config.json --out work

# Propose head crop box from full layers
rig-parts propose --head-box --full layers/full --canvas 1664x2432

# Propose or run the 2-pass layer merge into rig-space parts
rig-parts assemble --propose-plan --source painting.png --full layers/full --head layers/head --config config.json
rig-parts assemble --source painting.png --full layers/full --head layers/head --config config.json --out work

# Propose bones, weighted meshes, regions, and idle motion from keypoints
rig-parts propose --parts work/rig --source painting.png --out work --keypoints keypoints.json

# Run assemble -> rig -> check in one gated process
rig-parts build --config config.json --source painting.png --full layers/full --head layers/head --out out --loop --lead-in 3

# Optional ComfyUI adapters for remote GPU boxes
rig-parts comfy paint --config config.json --out paint-out --host http://127.0.0.1:8188
rig-parts comfy seethrough --image work/st_input_full.png --out layers/full --host http://127.0.0.1:8188 --offload
\`\`\`
`,
    html: `<p class="lead"><strong>AI-authored 2D character rigs from one anime painting, verified before they are written.</strong></p>

<div class="meta-bar">
  <span>npm: <a href="https://www.npmjs.com/package/@rig-c/parts"><code>@rig-c/parts@1.38.0</code></a></span>
  <span>CLI: <code>rig-parts</code></span>
  <span>Repository: <a href="https://github.com/rig-c/parts"><code>github.com/rig-c/parts</code></a></span>
  <span>License: <code>MIT</code></span>
</div>

<p><code>@rig-c/parts</code> takes a single character painting and the layers <a href="https://github.com/shitagaki-lab/see-through">See-through</a> decomposed it into, merges them into measured rig-space parts, authors weighted meshes, bone chains, physics constraints, and a looping idle in <a href="/core/"><code>rig-c</code></a>'s spec, and hands that spec to <code>rig-c</code> to compile, gate, pack, render, and check.</p>

<h2>Install</h2>
<pre><code>bun add -d @rig-c/parts rig-c
bunx rig-parts --help</code></pre>

<h2>What It Takes In</h2>
<ol>
  <li><strong>One character painting (<code>painting.png</code>)</strong> — Front view, full body head-to-toe, arms clear of the body, hands apart and open, legs with a clear gap, on a plain white background. Checked against body-18 joints before See-through runs via <code>rig-parts painting</code>.</li>
  <li><strong>Two See-through layer sets (<code>full</code> and <code>head</code>)</strong> — One run on the whole figure (white-padded to a square) and one run on a square head crop so eye and face layers separate cleanly. Accepts either the ComfyUI wrapper directory (<code>layers.json</code> + <code>parts/&lt;tag&gt;.png</code>) or an upstream <code>.psd</code>.</li>
  <li><strong>A character config (<code>config.json</code>)</strong> — Declares the part merge plan, <code>head_box</code>, bones, mesh region rules, idle sines, and optional constraints. Unknown or missing fields are refused by name.</li>
</ol>

<h2>What <code>rig-parts build</code> Emits</h2>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Output Path under <code>--out</code></th>
        <th>Contents</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>check/build/skeleton.json</code>, <code>skeleton.atlas</code>, <code>skeleton.png</code></td>
        <td><strong>The primary artifact</strong> — Spine 4.3 skeleton data, compiled model (<code>skeleton.model.json</code>), and one polygon-packed free-edge atlas page, gated under <code>rig-play</code> and <code>spine</code>.</td>
      </tr>
      <tr>
        <td><code>parts/*.png</code>, <code>parts.json</code>, <code>recomposite_rig.png</code>, <code>recomposite_error_rig.png</code></td>
        <td>Cropped alpha-box part PNGs, provenance record per pixel, flat recomposite, and red/blue uncovered error map against the source painting.</td>
      </tr>
      <tr>
        <td><code>rig/</code></td>
        <td><code>rig.json</code>, <code>motion.json</code>, <code>mesh_report.json</code>, and 4px-padded <code>images/</code> for Spine Editor import.</td>
      </tr>
      <tr>
        <td><code>check/</code></td>
        <td>Gate verdicts verbatim, rendered frames, <code>geometry.json</code>, <code>contact.png</code>, <code>motion_heat.png</code>, and <code>check.json</code> (including <code>SEAM_OVER_MOTION</code>, <code>CLOTH_SETTLES</code>, loop closure, and fold checks).</td>
      </tr>
      <tr>
        <td><code>idle.png</code>, <code>idle-indexed.png</code>, <code>idle.gif</code></td>
        <td>Written with <code>--loop</code>: lossless APNG exactness record, 256-color indexed APNG, and looping GIF with measured palette error.</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>Core CLI Commands</h2>
<pre><code># Inspect See-through layer coverage and WARN lines
rig-parts layers &lt;dir | layers.json | file.psd&gt;

# Verify painting against body-18 keypoints before decomposition
rig-parts painting --source painting.png --keypoints keypoints.json

# Cut full (white-padded square) and head-crop inputs for See-through
rig-parts inputs --source painting.png --config config.json --out work

# Propose head crop box from full layers
rig-parts propose --head-box --full layers/full --canvas 1664x2432

# Propose or run the 2-pass layer merge into rig-space parts
rig-parts assemble --propose-plan --source painting.png --full layers/full --head layers/head --config config.json
rig-parts assemble --source painting.png --full layers/full --head layers/head --config config.json --out work

# Propose bones, weighted meshes, regions, and idle motion from keypoints
rig-parts propose --parts work/rig --source painting.png --out work --keypoints keypoints.json

# Run assemble -&gt; rig -&gt; check in one gated process
rig-parts build --config config.json --source painting.png --full layers/full --head layers/head --out out --loop --lead-in 3

# Optional ComfyUI adapters for remote GPU boxes
rig-parts comfy paint --config config.json --out paint-out --host http://127.0.0.1:8188
rig-parts comfy seethrough --image work/st_input_full.png --out layers/full --host http://127.0.0.1:8188 --offload</code></pre>`,
  },
  {
    slug: 'pose',
    navLabel: 'Pose',
    title: '@rig-c/pose (rig-pose) — Retarget Body-18 Pose Sequences onto 2D Rigs',
    description:
      '@rig-c/pose cleans noisy detector pose sequences and retargets joint trajectories onto rig-c bone chains with hinge, landing, foot-slip, and seam verification.',
    keywords: [
      '@rig-c/pose',
      'rig-pose',
      '2D motion retargeting',
      'OpenPose',
      'body-18',
      'Savitzky-Golay',
      'Spine animation retargeting',
    ],
    packageName: '@rig-c/pose',
    packageVersion: '0.33.0',
    repoUrl: 'https://github.com/rig-c/pose',
    npmUrl: 'https://www.npmjs.com/package/@rig-c/pose',
    summaryForLlms:
      '@rig-c/pose (v0.33.0) pipeline: clean (spikes, occlusion, Savitzky-Golay, floor, stillness hold) -> retarget onto descending bone chains with landing and hinge gates.',
    markdown: `# @rig-c/pose (\`rig-pose\`)

**Puts motion from a body-18 pose sequence onto a rig that [\`rig-c\`](/core/) built — checked before a key is written.**

- **npm package**: \`@rig-c/pose\`, latest \`0.33.0\` (0.x prototype)
- **CLI executable**: \`rig-pose\`
- **Repository**: <https://github.com/rig-c/pose>
- **License**: MIT

The motion is joint positions over time — from a video detector, a motion dataset, or points placed by hand. \`@rig-c/pose\` cleans detector jitter and spikes at the sequence level, retargets each limb chain onto \`rig-c\` bone keys (\`rigc-motion/1\`), poses the compiled rig through \`rig-c\`'s own poser to verify every bone lands on its target angle, and emits a structured diagnostic report (\`rig-pose-report/1\`).

## Install & Quick Try

\`\`\`sh
bun add -d @rig-c/pose rig-c

# Clean a raw detector pose sequence first
bunx rig-pose clean --pose dance.scan.json --out dance.pose.json --loop

# Retarget onto a rig-c rig and emit a gated build + report
bunx rig-pose retarget \\
  --rig out/rig \\
  --map map.json \\
  --pose dance.pose.json \\
  --out dance.motion.json \\
  --name dance \\
  --build dance-build
\`\`\`

## Step 1: \`rig-pose clean\` (Mandatory Sequence Hygiene)

\`retarget\` refuses any pose sequence that lacks a \`rig-pose-clean/1\` record (\`POSE_NOT_CLEANED\`). \`clean\` executes five deterministic passes:

1. **Spikes (\`SPIKE\`)**: Replaces any joint jumping more than \`0.2\` trunk lengths from its 5-frame median.
2. **Occlusion (\`OCCLUDED\`)**: Replaces joints not marked \`observed\`/\`inferred\` or scored below \`0.3\` with their 3-frame median.
3. **Savitzky–Golay Smoothing**: Quadratic filter over \`--legs\` frames (default \`5\`) for hips/knees/ankles and \`--rest\` frames (default \`7\`) for other joints.
4. **Floor & In-Place Loop (\`--loop\`)**: Aligns lowest ankle over the cycle and declares \`"travel": "in-place"\`.
5. **Stillness Hold (\`HOLD\`)**: Locks joints whose median speed stays below \`--hold-speed\` (\`0.015\` trunk lengths/frame) and within \`--hold-reach\` (\`0.03\`) for at least \`0.5s\`, cross-fading across 6-frame ramps.

### Measured Jitter Reduction on Reference Fixtures

| Clip | Mode | Jitter Reduction | Comparison vs. Hand-Cleaned Reference |
| --- | --- | --- | --- |
| \`dance-a\` (13 s non-loop) | defaults | **−42%** (\`7.91 -> 4.62 px/f²\`) | Hand-cleaned: \`4.62\`; positions within \`0.071 px\` |
| \`walk-a\` (1 gait cycle) | \`--loop\` | **−66%** | Within \`0.001 px/f²\` outside the arms |
| \`run-a\` (1 gait cycle) | \`--loop\` | **−53%** | Matches hand-cleaned reference |
| \`walk-b\` (90 frames, held out) | defaults | **−67%** | Target bar: \`−30%\` |
| \`run-b\` (90 frames, held out) | defaults | **−75%** | Target bar: \`−30%\` |

## Step 2: \`rig-pose retarget\` Gate & Diagnostics

Nothing is written unless every hard gate passes:

| Check | Refusal Code | Requirement |
| --- | --- | --- |
| Base rig & retargeted rig pass \`rigc build\` | \`RIG_GATE_BASE\`, \`RIG_GATE\` | rig-c's gate is green with the rig as it is, and again with the animation in. |
| Every mapped bone lands on target angle/scale/ankle | \`POSE_LANDS\` | Posed by \`rig-c\`'s poser and measured within \`0.01°\` / \`0.01\` units on every frame. |
| Hinges bend only in their anatomically valid direction | \`POSE_BEND_ONE_WAY\` | Elbows and knees stay on the rest pose's bend side (or clamp with \`--bends clamp\`). |
| Every mapped point has valid data | \`POSE_POINT_NEVER_GOOD\` | Each required joint is good on at least one frame. |
| Map resolves against rig hierarchy | \`MAP_*\` | Named bones exist and chains descend parent-to-child. |

And the diagnostic report (\`<out>.report.json\`, consumed by [\`@rig-c/review\`](/review/) and agents) records \`HOLD\`, \`SHORT\`, \`END-ON\`, \`FOLD\`, \`POSTURE\`, \`FEET\`, \`STANCE\`, \`SHEAR\`, \`SEAM_OVER_MOTION\` (\`seams\` + \`seamPairs\` with \`--parts\`), \`NOD\` loop closure, and alternate-drawing \`SWITCH\`/\`UNCOVERED\` demands.
`,
    html: `<p class="lead"><strong>Puts motion from a body-18 pose sequence onto a rig that <a href="/core/"><code>rig-c</code></a> built — checked before a key is written.</strong></p>

<div class="meta-bar">
  <span>npm: <a href="https://www.npmjs.com/package/@rig-c/pose"><code>@rig-c/pose@0.33.0</code></a></span>
  <span>CLI: <code>rig-pose</code></span>
  <span>Repository: <a href="https://github.com/rig-c/pose"><code>github.com/rig-c/pose</code></a></span>
  <span>License: <code>MIT</code></span>
</div>

<p>The motion is joint positions over time — from a video detector, a motion dataset, or points placed by hand. <code>@rig-c/pose</code> cleans detector jitter and spikes at the sequence level, retargets each limb chain onto <code>rig-c</code> bone keys (<code>rigc-motion/1</code>), poses the compiled rig through <code>rig-c</code>'s own poser to verify every bone lands on its target angle, and emits a structured diagnostic report (<code>rig-pose-report/1</code>).</p>

<h2>Install &amp; Quick Try</h2>
<pre><code>bun add -d @rig-c/pose rig-c

# Clean a raw detector pose sequence first
bunx rig-pose clean --pose dance.scan.json --out dance.pose.json --loop

# Retarget onto a rig-c rig and emit a gated build + report
bunx rig-pose retarget \
  --rig out/rig \
  --map map.json \
  --pose dance.pose.json \
  --out dance.motion.json \
  --name dance \
  --build dance-build</code></pre>

<h2>Step 1: <code>rig-pose clean</code> (Mandatory Sequence Hygiene)</h2>
<p><code>retarget</code> refuses any pose sequence that lacks a <code>rig-pose-clean/1</code> record (<code>POSE_NOT_CLEANED</code>). <code>clean</code> executes five deterministic passes:</p>
<ol>
  <li><strong>Spikes (<code>SPIKE</code>)</strong>: Replaces any joint jumping more than <code>0.2</code> trunk lengths from its 5-frame median.</li>
  <li><strong>Occlusion (<code>OCCLUDED</code>)</strong>: Replaces joints not marked <code>observed</code>/<code>inferred</code> or scored below <code>0.3</code> with their 3-frame median.</li>
  <li><strong>Savitzky–Golay Smoothing</strong>: Quadratic filter over <code>--legs</code> frames (default <code>5</code>) for hips/knees/ankles and <code>--rest</code> frames (default <code>7</code>) for other joints.</li>
  <li><strong>Floor &amp; In-Place Loop (<code>--loop</code>)</strong>: Aligns lowest ankle over the cycle and declares <code>"travel": "in-place"</code>.</li>
  <li><strong>Stillness Hold (<code>HOLD</code>)</strong>: Locks joints whose median speed stays below <code>--hold-speed</code> (<code>0.015</code> trunk lengths/frame) and within <code>--hold-reach</code> (<code>0.03</code>) for at least <code>0.5s</code>, cross-fading across 6-frame ramps.</li>
</ol>

<h3>Measured Jitter Reduction on Reference Fixtures</h3>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Clip</th>
        <th>Mode</th>
        <th>Jitter Reduction</th>
        <th>Comparison vs. Hand-Cleaned Reference</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>dance-a</code> (13 s non-loop)</td>
        <td>defaults</td>
        <td><strong>−42%</strong> (<code>7.91 -&gt; 4.62 px/f²</code>)</td>
        <td>Hand-cleaned: <code>4.62</code>; positions within <code>0.071 px</code></td>
      </tr>
      <tr>
        <td><code>walk-a</code> (1 gait cycle)</td>
        <td><code>--loop</code></td>
        <td><strong>−66%</strong></td>
        <td>Within <code>0.001 px/f²</code> outside the arms</td>
      </tr>
      <tr>
        <td><code>run-a</code> (1 gait cycle)</td>
        <td><code>--loop</code></td>
        <td><strong>−53%</strong></td>
        <td>Matches hand-cleaned reference</td>
      </tr>
      <tr>
        <td><code>walk-b</code> (90 frames, held out)</td>
        <td>defaults</td>
        <td><strong>−67%</strong></td>
        <td>Target bar: <code>−30%</code></td>
      </tr>
      <tr>
        <td><code>run-b</code> (90 frames, held out)</td>
        <td>defaults</td>
        <td><strong>−75%</strong></td>
        <td>Target bar: <code>−30%</code></td>
      </tr>
    </tbody>
  </table>
</div>

<h2>Step 2: <code>rig-pose retarget</code> Gate &amp; Diagnostics</h2>
<p>Nothing is written unless every hard gate passes:</p>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Check</th>
        <th>Refusal Code</th>
        <th>Requirement</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Base rig &amp; retargeted rig pass <code>rigc build</code></td>
        <td><code>RIG_GATE_BASE</code>, <code>RIG_GATE</code></td>
        <td>rig-c's gate is green with the rig as it is, and again with the animation in.</td>
      </tr>
      <tr>
        <td>Every mapped bone lands on target angle/scale/ankle</td>
        <td><code>POSE_LANDS</code></td>
        <td>Posed by <code>rig-c</code>'s poser and measured within <code>0.01°</code> / <code>0.01</code> units on every frame.</td>
      </tr>
      <tr>
        <td>Hinges bend only in their anatomically valid direction</td>
        <td><code>POSE_BEND_ONE_WAY</code></td>
        <td>Elbows and knees stay on the rest pose's bend side (or clamp with <code>--bends clamp</code>).</td>
      </tr>
      <tr>
        <td>Every mapped point has valid data</td>
        <td><code>POSE_POINT_NEVER_GOOD</code></td>
        <td>Each required joint is good on at least one frame.</td>
      </tr>
      <tr>
        <td>Map resolves against rig hierarchy</td>
        <td><code>MAP_*</code></td>
        <td>Named bones exist and chains descend parent-to-child.</td>
      </tr>
    </tbody>
  </table>
</div>
<p>The diagnostic report (<code>&lt;out&gt;.report.json</code>, consumed by <a href="/review/"><code>@rig-c/review</code></a> and agents) records <code>HOLD</code>, <code>SHORT</code>, <code>END-ON</code>, <code>FOLD</code>, <code>POSTURE</code>, <code>FEET</code>, <code>STANCE</code>, <code>SHEAR</code>, <code>SEAM_OVER_MOTION</code> (<code>seams</code> + <code>seamPairs</code> with <code>--parts</code>), <code>NOD</code> loop closure, and alternate-drawing <code>SWITCH</code>/<code>UNCOVERED</code> demands.</p>`,
  },
  {
    slug: 'core',
    navLabel: 'Core (rigc)',
    title: 'rig-c (@rig-c/core) — 2D Rig Compiler & Named-Assertion Gate for Spine 4.3',
    description:
      'rigc compiles a rig spec and motion spec into Spine 4.3 skeleton data and rig-c compiled models, gated by named assertions (36 under the default spine profile, 50 under the opt-in rig-play profile) held to spine-core round-trip verdicts in CI.',
    keywords: [
      'rig-c',
      '@rig-c/core',
      'spine-rigc',
      'rigc compiler',
      'Spine 4.3 JSON',
      'skeleton.model.json',
      'A18_DETERMINISTIC_EMIT',
      'A20_MESH_WEIGHTS_COHERENT',
    ],
    packageName: 'rig-c',
    packageVersion: '2.61.0',
    repoUrl: 'https://github.com/rig-c/core',
    npmUrl: 'https://www.npmjs.com/package/rig-c',
    summaryForLlms:
      'rig-c / @rig-c/core (v2.61.0) rig compiler: CLI commands (build, render, inspect, preview, vote, pose, chainfit, check), named-assertion gate and profiles, and determinism guarantees.',
    markdown: `# rig-c (\`@rig-c/core\`) — The Rig Compiler

**AI-authored 2D rigging and animation, verified before it is written.**

- **npm package**: \`rig-c\` (aliases: \`@rig-c/core\`, \`spine-rigc\`), latest \`2.61.0\`
- **CLI executable**: \`rigc\`
- **Repository**: <https://github.com/rig-c/core>
- **License**: MIT (published package links no Spine runtime)

\`rigc\` is a deterministic rig compiler: a rig spec (\`rig.json\`), a motion spec (\`motion.json\`), and loose part PNGs go in; **Spine 4.3 skeleton data (\`skeleton.json\` + \`skeleton.atlas\`) and \`skeleton.model.json\` come out** — gated by named assertions before a single byte is written to disk (36 under the default \`--profile spine\`, all 50 under the opt-in \`--profile rig-play\`).

## Install

\`\`\`sh
bunx rig-c --help    # run without installing
bun add -g rig-c     # install global 'rigc' command
bun add -d rig-c     # pin in a project
\`\`\`

## CLI Commands & Capabilities

| You Have | You Run | You Get |
| --- | --- | --- |
| Part PNGs, \`rig.json\`, and \`motion.json\` | \`rigc build\` | \`skeleton.json\` + \`skeleton.atlas\` + \`skeleton.model.json\` — or a refusal named by rule, and **nothing on disk**. |
| The same, wanting packed textures | \`rigc build --pack\` | Every part arranged losslessly onto shared atlas pages (supports \`--page-edges free\` and \`--pack-shape polygon\`). |
| Pre-packed atlas from another tool | \`rigc build --atlas-in\` | Skeleton resolved against that atlas — or a named refusal, never a part that silently fails to draw. |
| A compiled rig | \`rigc render\` | Every animation rendered as PNG frames plus a labelled contact sheet (supports \`--folds\` and physics readouts). |
| A compiled rig and a geometry question | \`rigc inspect\` | Diagnostic overlay of bones, axes, mesh edges/hulls, bone weights, folded triangles, draw order, and world grid. |
| A compiled rig | \`rigc preview\` | Self-contained \`.html\` playing the rig in Spine's web player (when \`@esotericsoftware/spine-core\` is installed beside it). |
| 2 to 4 candidate rigs | \`rigc vote\` | Human A/B ballot page with verdicts recorded into a ledger (when \`@esotericsoftware/spine-core\` is installed beside it). |
| A key-pose image and part PNGs | \`rigc pose\` | Spec coordinates where each loose part sits in the target key pose. |
| A key-pose image and an occluded rig | \`rigc chainfit\` | Fits occluded limb chains through the candidate's own draw order and hierarchy. |

## The Named-Assertion Gate & Structural Invariants

- **Validation is a structural invariant, never an option.** There is no \`--no-validate\` or \`--emit-anyway\` flag.
- **Two suppliers, one oracle**:
  1. The published package links no Spine runtime: \`rigc\` runs its own validator. Of the 50 assertions, 49 run there; \`A00_ROUNDTRIP_PARSE\`, the official parser's own parse, is reported as a SKIP, and the model side's own two parse rules, \`A00_MODEL_READ\` and \`A00_MODEL_REGIONS_ON_PAGES\`, run in its place — so the report's summary totals 52.
  2. With \`@esotericsoftware/spine-core\` installed beside it (\`bun add -d @esotericsoftware/spine-core\`), the same \`rigc\` also runs the Spine 4.3 round trip, \`A00_ROUNDTRIP_PARSE\`, on every build. The rig-c/core repository holds the validator to the round trip's verdicts in its CI.
- **Byte-for-byte determinism (\`A18_DETERMINISTIC_EMIT\`)**: Every \`build\` compiles twice independently and compares the output byte for byte before emitting.
- **Named resolution everywhere**: Bone parents, slot bones, constraint targets, draw-order slots, and mesh vertex weights resolve by name, never silent raw array indices.
`,
    html: `<p class="lead"><strong>AI-authored 2D rigging and animation, verified before it is written.</strong></p>

<div class="meta-bar">
  <span>npm: <a href="https://www.npmjs.com/package/rig-c"><code>rig-c@2.61.0</code></a> (<code>@rig-c/core</code>)</span>
  <span>CLI: <code>rigc</code></span>
  <span>Repository: <a href="https://github.com/rig-c/core"><code>github.com/rig-c/core</code></a></span>
  <span>License: <code>MIT</code></span>
</div>

<p><code>rigc</code> is a deterministic rig compiler: a rig spec (<code>rig.json</code>), a motion spec (<code>motion.json</code>), and loose part PNGs go in; <strong>Spine 4.3 skeleton data (<code>skeleton.json</code> + <code>skeleton.atlas</code>) and <code>skeleton.model.json</code> come out</strong> — gated by named assertions before a single byte is written to disk (36 under the default <code>--profile spine</code>, all 50 under the opt-in <code>--profile rig-play</code>).</p>

<h2>Install</h2>
<pre><code>bunx rig-c --help    # run without installing
bun add -g rig-c     # install global 'rigc' command
bun add -d rig-c     # pin in a project</code></pre>

<h2>CLI Commands &amp; Capabilities</h2>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>You Have</th>
        <th>You Run</th>
        <th>You Get</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Part PNGs, <code>rig.json</code>, and <code>motion.json</code></td>
        <td><code>rigc build</code></td>
        <td><code>skeleton.json</code> + <code>skeleton.atlas</code> + <code>skeleton.model.json</code> — or a refusal named by rule, and <strong>nothing on disk</strong>.</td>
      </tr>
      <tr>
        <td>The same, wanting packed textures</td>
        <td><code>rigc build --pack</code></td>
        <td>Every part arranged losslessly onto shared atlas pages (supports <code>--page-edges free</code> and <code>--pack-shape polygon</code>).</td>
      </tr>
      <tr>
        <td>Pre-packed atlas from another tool</td>
        <td><code>rigc build --atlas-in</code></td>
        <td>Skeleton resolved against that atlas — or a named refusal, never a part that silently fails to draw.</td>
      </tr>
      <tr>
        <td>A compiled rig</td>
        <td><code>rigc render</code></td>
        <td>Every animation rendered as PNG frames plus a labelled contact sheet (supports <code>--folds</code> and physics readouts).</td>
      </tr>
      <tr>
        <td>A compiled rig and a geometry question</td>
        <td><code>rigc inspect</code></td>
        <td>Diagnostic overlay of bones, axes, mesh edges/hulls, bone weights, folded triangles, draw order, and world grid.</td>
      </tr>
      <tr>
        <td>A compiled rig</td>
        <td><code>rigc preview</code></td>
        <td>Self-contained <code>.html</code> playing the rig in Spine's web player (when <code>@esotericsoftware/spine-core</code> is installed beside it).</td>
      </tr>
      <tr>
        <td>2 to 4 candidate rigs</td>
        <td><code>rigc vote</code></td>
        <td>Human A/B ballot page with verdicts recorded into a ledger (when <code>@esotericsoftware/spine-core</code> is installed beside it).</td>
      </tr>
      <tr>
        <td>A key-pose image and part PNGs</td>
        <td><code>rigc pose</code></td>
        <td>Spec coordinates where each loose part sits in the target key pose.</td>
      </tr>
      <tr>
        <td>A key-pose image and an occluded rig</td>
        <td><code>rigc chainfit</code></td>
        <td>Fits occluded limb chains through the candidate's own draw order and hierarchy.</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>The Named-Assertion Gate &amp; Structural Invariants</h2>
<ul>
  <li><strong>Validation is a structural invariant, never an option.</strong> There is no <code>--no-validate</code> or <code>--emit-anyway</code> flag.</li>
  <li><strong>Two suppliers, one oracle</strong>:
    <ol>
      <li>The published package links no Spine runtime: <code>rigc</code> runs its own validator. Of the 50 assertions, 49 run there; <code>A00_ROUNDTRIP_PARSE</code>, the official parser's own parse, is reported as a SKIP, and the model side's own two parse rules, <code>A00_MODEL_READ</code> and <code>A00_MODEL_REGIONS_ON_PAGES</code>, run in its place — so the report's summary totals 52.</li>
      <li>With <code>@esotericsoftware/spine-core</code> installed beside it (<code>bun add -d @esotericsoftware/spine-core</code>), the same <code>rigc</code> also runs the Spine 4.3 round trip, <code>A00_ROUNDTRIP_PARSE</code>, on every build. The rig-c/core repository holds the validator to the round trip's verdicts in its CI.</li>
    </ol>
  </li>
  <li><strong>Byte-for-byte determinism (<code>A18_DETERMINISTIC_EMIT</code>)</strong>: Every <code>build</code> compiles twice independently and compares the output byte for byte before emitting.</li>
  <li><strong>Named resolution everywhere</strong>: Bone parents, slot bones, constraint targets, draw-order slots, and mesh vertex weights resolve by name, never silent raw array indices.</li>
</ul>`,
  },
  {
    slug: 'review',
    navLabel: 'Review',
    title: '@rig-c/review (rig-review) — Human Inspection & Source-Bound Feedback Workspace',
    description:
      '@rig-c/review provides a reusable local workspace to inspect AI-authored rigs, compare reference footage side by side, and export frame/bone/slot-bound feedback.',
    keywords: [
      '@rig-c/review',
      'rig-review',
      'rig inspection',
      'human-in-the-loop',
      'animation review tool',
      'rig-pose-report',
    ],
    packageName: '@rig-c/review',
    packageVersion: '0.2.1',
    repoUrl: 'https://github.com/rig-c/review',
    npmUrl: 'https://www.npmjs.com/package/@rig-c/review',
    summaryForLlms:
      '@rig-c/review (v0.2.1) local human inspection workspace: opens compiled output folders, plays models via @rig-c/play beside source videos/poses, and exports structured issue feedback without mutating rig files.',
    markdown: `# @rig-c/review (\`rig-review\`)

**A reusable local workspace for a person to inspect an agent's rig output, compare source references, and export structured feedback ready to become an issue.**

- **npm package**: \`@rig-c/review\`, latest \`0.2.1\`
- **CLI executable**: \`rig-review\`
- **Repository**: <https://github.com/rig-c/review>
- **License**: MIT

Instead of asking an AI agent to build a one-off viewer for every rig, \`@rig-c/review\` opens any existing output directory or curated \`review.json\` package, plays the compiled model through [\`@rig-c/play\`](/play/), aligns reference videos, contact sheets, and \`rig-pose-report/1\` diagnostic markers, and exports annotations bound to exact frames, bones, and slots.

**Motion is view, annotate, and export only.** Navigation changes inspection time; it never retimes, authors keys, or mutates \`motion.json\` or \`rig.json\`.

## Place in the Toolchain

[\`@rig-c/parts\`](/parts/) → [\`@rig-c/pose\`](/pose/) → [\`rig-c (core)\`](/core/) → **\`@rig-c/review\`** → [\`@rig-c/play\`](/play/) → [\`@rig-c/adapters\`](/adapters/)

## Install & Usage

Requires **Bun 1.3.0 or later** on \`PATH\`.

\`\`\`sh
# Install beside the agent that produced the output
npm i -D @rig-c/review

# Open an output folder and print the loopback capability URL (127.0.0.1 only)
npx rig-review open /absolute/path/to/output

# Validate the delivery contract and model envelope
npx rig-review check /absolute/path/to/output
\`\`\`

## Zero-Config Output Discovery

When pointed at an output folder without a \`review.json\` manifest, \`rig-review\` automatically discovers:
- Root \`skeleton.model.json\` or \`build/skeleton.model.json\` (root takes precedence)
- Root \`motion.json\`, \`report.json\` (\`rig-pose-report/1\`), and \`skeleton.json\` / \`.skel\` / \`.atlas\` evidence
- Source reference videos (\`.mp4\`, \`.webm\`, \`.mov\`)
- Contact sheets and strips (filenames containing \`strip\`, \`contact\`, \`sheet\`, \`filmstrip\`, or \`띠\`)
- Canonical \`*pose*.json\` sequences

When \`report.json\` carries \`rig-pose-report/1\` event markers (\`HOLD\`, \`FOLD\`, \`FEET\`, \`SEAM\`), \`rig-review\` exposes read-only event markers and prefills feedback coordinates with actual bone and slot names.
`,
    html: `<p class="lead"><strong>A reusable local workspace for a person to inspect an agent's rig output, compare source references, and export structured feedback ready to become an issue.</strong></p>

<div class="meta-bar">
  <span>npm: <a href="https://www.npmjs.com/package/@rig-c/review"><code>@rig-c/review@0.2.1</code></a></span>
  <span>CLI: <code>rig-review</code></span>
  <span>Repository: <a href="https://github.com/rig-c/review"><code>github.com/rig-c/review</code></a></span>
  <span>License: <code>MIT</code></span>
</div>

<p>Instead of asking an AI agent to build a one-off viewer for every rig, <code>@rig-c/review</code> opens any existing output directory or curated <code>review.json</code> package, plays the compiled model through <a href="/play/"><code>@rig-c/play</code></a>, aligns reference videos, contact sheets, and <code>rig-pose-report/1</code> diagnostic markers, and exports annotations bound to exact frames, bones, and slots.</p>

<div class="callout">
  <strong>Motion is view, annotate, and export only.</strong> Navigation changes inspection time; it never retimes, authors keys, or mutates <code>motion.json</code> or <code>rig.json</code>.
</div>

<h2>Place in the Toolchain</h2>
<p><a href="/parts/"><code>@rig-c/parts</code></a> → <a href="/pose/"><code>@rig-c/pose</code></a> → <a href="/core/"><code>rig-c (core)</code></a> → <strong><code>@rig-c/review</code></strong> → <a href="/play/"><code>@rig-c/play</code></a> → <a href="/adapters/"><code>@rig-c/adapters</code></a></p>

<h2>Install &amp; Usage</h2>
<p>Requires <strong>Bun 1.3.0 or later</strong> on <code>PATH</code>.</p>
<pre><code># Install beside the agent that produced the output
npm i -D @rig-c/review

# Open an output folder and print the loopback capability URL (127.0.0.1 only)
npx rig-review open /absolute/path/to/output

# Validate the delivery contract and model envelope
npx rig-review check /absolute/path/to/output</code></pre>

<h2>Zero-Config Output Discovery</h2>
<p>When pointed at an output folder without a <code>review.json</code> manifest, <code>rig-review</code> automatically discovers:</p>
<ul>
  <li>Root <code>skeleton.model.json</code> or <code>build/skeleton.model.json</code> (root takes precedence)</li>
  <li>Root <code>motion.json</code>, <code>report.json</code> (<code>rig-pose-report/1</code>), and <code>skeleton.json</code> / <code>.skel</code> / <code>.atlas</code> evidence</li>
  <li>Source reference videos (<code>.mp4</code>, <code>.webm</code>, <code>.mov</code>)</li>
  <li>Contact sheets and strips (filenames containing <code>strip</code>, <code>contact</code>, <code>sheet</code>, <code>filmstrip</code>, or <code>띠</code>)</li>
  <li>Canonical <code>*pose*.json</code> sequences</li>
</ul>
<p>When <code>report.json</code> carries <code>rig-pose-report/1</code> event markers (<code>HOLD</code>, <code>FOLD</code>, <code>FEET</code>, <code>SEAM</code>), <code>rig-review</code> exposes read-only event markers and prefills feedback coordinates with actual bone and slot names.</p>`,
  },
  {
    slug: 'play',
    navLabel: 'Play',
    title: '@rig-c/play (rig-play) — Zero-Spine-Runtime Browser Player (DOM & Canvas)',
    description:
      'Play rig-c compiled models (skeleton.model.json) in the browser as plain DOM elements (CSS matrix) or a single canvas at 60 fps with tracks, mixing, physics, and bone hooks.',
    keywords: [
      '@rig-c/play',
      'rig-play',
      'spine-html',
      '2D web player',
      'DOM skeletal animation',
      'WebGL mesh player',
      'skeleton.model.json',
    ],
    packageName: '@rig-c/play',
    packageVersion: '1.12.0',
    repoUrl: 'https://github.com/rig-c/play',
    npmUrl: 'https://www.npmjs.com/package/@rig-c/play',
    summaryForLlms:
      '@rig-c/play (v1.12.0) browser player for skeleton.model.json: DOM mode (<img> + CSS matrix() + WebGL mesh backend) and single-canvas mode, API usage, and 60fps benchmark table.',
    markdown: `# @rig-c/play (\`rig-play\`)

**Plays the compiled model document [\`rig-c\`](/core/) builds (\`skeleton.model.json\`) in the browser — as plain DOM elements or one canvas, with no Spine runtime.**

- **npm package**: \`@rig-c/play\` (aliases: \`rig-play\`, \`spine-html\`), latest \`1.12.0\`
- **Repository**: <https://github.com/rig-c/play>
- **License**: MIT (links nothing from Esoteric Software)

## Two Render Modes

1. **\`mode: 'dom'\` (default)**: Draws each rigid slot as an absolutely-positioned \`<img>\` posed with a single CSS \`transform: matrix()\` write per frame, and deforms weighted meshes on small per-part canvases backed by a shared WebGL context (\`meshBackend: 'webgl'\` default since 1.9). Unchanged or held meshes skip rasterization (\`0 triangles\`, \`0 draw calls\`).
2. **\`mode: 'canvas'\`**: Draws the entire skeleton frame into **one \`<canvas>\`** per player through the shared WebGL context, with vertex-color tints, blend modes, and CPU polygon clipping. Swappable in place via \`player.mode = 'canvas'\`.

Both modes share at most **one WebGL context across the entire page**, avoiding the browser's 16-context WebGL eviction limit when mounting 20+ independent character players on one page.

## Minimal Usage

\`\`\`sh
npm install @rig-c/play
\`\`\`

\`\`\`ts
import { loadModel, RigPlayer } from '@rig-c/play';

const assets = await loadModel({
  modelUrl: '/rigs/character/skeleton.model.json',
});

const player = new RigPlayer({
  container: document.getElementById('stage')!,
  assets,
  mode: 'dom', // or 'canvas'
});

player.play('idle', { loop: true });
\`\`\`

## Measured Performance (Apple M4 Chromium, \`1280×720\`)

Standing comparison against \`@esotericsoftware/spine-webgl 4.3.13\` (600 measured frames after 100 warm-up frames):

| Scene | \`dom\` Mode | \`canvas\` Mode | \`official\` (batched / per-cell) | Key Observation |
| --- | --- | --- | --- | --- |
| **1 meshed rig animating** | \`59.99 fps\` (0.17 ms pose / 0.16 ms render) | \`59.99 fps\` (0.23 ms / 0.18 ms) | \`60.00 fps\` (0.05 ms / 0.13 ms) | All three hold 60 fps under 0.45 ms/frame. |
| **16 meshed rigs animating** | \`60.00 fps\` (0.66 ms / 0.74 ms) | \`59.87 fps\` (0.84 ms / 0.50 ms) | \`60.00 fps\` (0.21 ms / 0.30 ms) | Up to 16 animating meshed rigs hold 60 fps across all modes. |
| **64 held poses (static)** | \`59.99 fps\` (\`0 triangles\`) | \`60.10 fps\` (\`0 triangles\`) | \`60.10 fps\` (\`5,632 triangles\`) | \`dom\` and \`canvas\` dirty-skip unchanged rasters completely. |
| **64 rigid rigs animating** | \`59.89 fps\` (\`0 triangles\`, CSS \`matrix()\`) | \`42.00 fps\` (64 canvas blits) | \`60.00 fps\` (1 batched draw call) | \`dom\` holds 60 fps on 64 rigid skeletons via pure CSS transforms. |
| **20 independent small players** | \`60.00 fps\` (**20/20 drawn**, 1 context) | \`59.99 fps\` (**20/20 drawn**, 1 context) | \`60.00 fps\` (**16/20 drawn**, 4 evicted) | Official loses 4 players to the browser's 16 WebGL context limit; \`@rig-c/play\` draws all 20. |
`,
    html: `<p class="lead"><strong>Plays the compiled model document <a href="/core/"><code>rig-c</code></a> builds (<code>skeleton.model.json</code>) in the browser — as plain DOM elements or one canvas, with no Spine runtime.</strong></p>

<div class="meta-bar">
  <span>npm: <a href="https://www.npmjs.com/package/@rig-c/play"><code>@rig-c/play@1.12.0</code></a> (<code>rig-play</code>, <code>spine-html</code>)</span>
  <span>Repository: <a href="https://github.com/rig-c/play"><code>github.com/rig-c/play</code></a></span>
  <span>License: <code>MIT</code></span>
</div>

<h2>Two Render Modes</h2>
<ol>
  <li><strong><code>mode: 'dom'</code> (default)</strong>: Draws each rigid slot as an absolutely-positioned <code>&lt;img&gt;</code> posed with a single CSS <code>transform: matrix()</code> write per frame, and deforms weighted meshes on small per-part canvases backed by a shared WebGL context (<code>meshBackend: 'webgl'</code> default since 1.9). Unchanged or held meshes skip rasterization (<code>0 triangles</code>, <code>0 draw calls</code>).</li>
  <li><strong><code>mode: 'canvas'</code></strong>: Draws the entire skeleton frame into <strong>one <code>&lt;canvas&gt;</code></strong> per player through the shared WebGL context, with vertex-color tints, blend modes, and CPU polygon clipping. Swappable in place via <code>player.mode = 'canvas'</code>.</li>
</ol>
<p>Both modes share at most <strong>one WebGL context across the entire page</strong>, avoiding the browser's 16-context WebGL eviction limit when mounting 20+ independent character players on one page.</p>

<h2>Minimal Usage</h2>
<pre><code>npm install @rig-c/play</code></pre>
<pre><code>import { loadModel, RigPlayer } from '@rig-c/play';

const assets = await loadModel({
  modelUrl: '/rigs/character/skeleton.model.json',
});

const player = new RigPlayer({
  container: document.getElementById('stage')!,
  assets,
  mode: 'dom', // or 'canvas'
});

player.play('idle', { loop: true });</code></pre>

<h2>Measured Performance (Apple M4 Chromium, <code>1280×720</code>)</h2>
<p>Standing comparison against <code>@esotericsoftware/spine-webgl 4.3.13</code> (600 measured frames after 100 warm-up frames):</p>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Scene</th>
        <th><code>dom</code> Mode</th>
        <th><code>canvas</code> Mode</th>
        <th><code>official</code> (batched / per-cell)</th>
        <th>Key Observation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1 meshed rig animating</strong></td>
        <td><code>59.99 fps</code> (0.17 ms pose / 0.16 ms render)</td>
        <td><code>59.99 fps</code> (0.23 ms / 0.18 ms)</td>
        <td><code>60.00 fps</code> (0.05 ms / 0.13 ms)</td>
        <td>All three hold 60 fps under 0.45 ms/frame.</td>
      </tr>
      <tr>
        <td><strong>16 meshed rigs animating</strong></td>
        <td><code>60.00 fps</code> (0.66 ms / 0.74 ms)</td>
        <td><code>59.87 fps</code> (0.84 ms / 0.50 ms)</td>
        <td><code>60.00 fps</code> (0.21 ms / 0.30 ms)</td>
        <td>Up to 16 animating meshed rigs hold 60 fps across all modes.</td>
      </tr>
      <tr>
        <td><strong>64 held poses (static)</strong></td>
        <td><code>59.99 fps</code> (<code>0 triangles</code>)</td>
        <td><code>60.10 fps</code> (<code>0 triangles</code>)</td>
        <td><code>60.10 fps</code> (<code>5,632 triangles</code>)</td>
        <td><code>dom</code> and <code>canvas</code> dirty-skip unchanged rasters completely.</td>
      </tr>
      <tr>
        <td><strong>64 rigid rigs animating</strong></td>
        <td><code>59.89 fps</code> (<code>0 triangles</code>, CSS <code>matrix()</code>)</td>
        <td><code>42.00 fps</code> (64 canvas blits)</td>
        <td><code>60.00 fps</code> (1 batched draw call)</td>
        <td><code>dom</code> holds 60 fps on 64 rigid skeletons via pure CSS transforms.</td>
      </tr>
      <tr>
        <td><strong>20 independent small players</strong></td>
        <td><code>60.00 fps</code> (<strong>20/20 drawn</strong>, 1 context)</td>
        <td><code>59.99 fps</code> (<strong>20/20 drawn</strong>, 1 context)</td>
        <td><code>60.00 fps</code> (<strong>16/20 drawn</strong>, 4 evicted)</td>
        <td>Official loses 4 players to the browser's 16 WebGL context limit; <code>@rig-c/play</code> draws all 20.</td>
      </tr>
    </tbody>
  </table>
</div>`,
  },
  {
    slug: 'adapters',
    navLabel: 'Adapters',
    title: '@rig-c/adapters — Play rig-c Models in PixiJS 8, Phaser 4, and Three.js',
    description:
      'Native scene-graph and renderer adapters for @rig-c/pixi, @rig-c/phaser, and @rig-c/three. Play rig-c compiled models inside web game engines with no Spine runtime.',
    keywords: [
      '@rig-c/adapters',
      '@rig-c/pixi',
      '@rig-c/phaser',
      '@rig-c/three',
      'PixiJS 8 2D rigging',
      'Phaser 4 skeletal animation',
      'Three.js 2D character',
    ],
    packageName: '@rig-c/pixi',
    packageVersion: '0.1.1',
    repoUrl: 'https://github.com/rig-c/adapters',
    npmUrl: 'https://www.npmjs.com/package/@rig-c/pixi',
    summaryForLlms:
      'Engine adapters (@rig-c/pixi 0.1.1, @rig-c/phaser 0.1.1, @rig-c/three 0.1.1): mount skeleton.model.json inside PixiJS 8, Phaser 4.2+, and Three.js 0.186+ with zero Spine runtime.',
    markdown: `# @rig-c/adapters — PixiJS, Phaser & Three.js

**Play a rig that [\`rig-c\`](/core/) built inside the engine or renderer your game already uses — with no Spine runtime.**

- **Repository**: <https://github.com/rig-c/adapters>
- **License**: MIT

| Package | Version | Target Host | Exports |
| --- | --- | --- | --- |
| \`@rig-c/pixi\` | \`0.1.1\` | PixiJS 8 | \`PixiRig\`, \`PixiRenderer\` |
| \`@rig-c/phaser\` | \`0.1.1\` | Phaser 4.2+ | \`PhaserRig\`, \`PhaserRenderer\` (shared ref-counted page textures) |
| \`@rig-c/three\` | \`0.1.1\` | Three.js 0.186.1+ | Native Three.js renderer and live \`Group\` (orthographic & perspective) |

## PixiJS 8 Usage (\`@rig-c/pixi\`)

\`\`\`sh
npm install @rig-c/pixi pixi.js @rig-c/play
\`\`\`

\`\`\`ts
import { loadModel } from '@rig-c/play';
import { Application } from 'pixi.js';
import { PixiRig } from '@rig-c/pixi';

const app = new Application();
await app.init({ width: 800, height: 600 });
document.body.appendChild(app.canvas);

const assets = await loadModel({ modelUrl: '/rigs/walk/skeleton.model.json' });
const rig = new PixiRig(assets, { ticker: app.ticker });
rig.play('walk');
app.stage.addChild(rig);
// On removal: app.stage.removeChild(rig); rig.destroy();
\`\`\`

## Phaser 4 Usage (\`@rig-c/phaser\`)

\`\`\`sh
npm install @rig-c/phaser phaser @rig-c/play
\`\`\`

\`\`\`ts
import { loadModel } from '@rig-c/play';
import { PhaserRig } from '@rig-c/phaser';

const assets = await loadModel({
  modelUrl: '/rigs/walk/skeleton.model.json',
  regions: 'none',
});
const rig = new PhaserRig(scene, assets);
rig.setPosition(400, 480);
rig.play('walk');
scene.add.existing(rig);
// On removal: rig.destroy(); assets.dispose();
\`\`\`

## Three.js Usage (\`@rig-c/three\`)

\`\`\`sh
npm install @rig-c/three three @rig-c/play
\`\`\`

## What Every Adapter Guarantees

1. **Pose parity with \`@rig-c/play\`**: Produces the exact same pose for the same time, verified in CI across Chromium and WebKit against \`@rig-c/play\`'s reference output.
2. **Unmodified \`rigc build\` inputs**: Reads \`skeleton.model.json\` and its atlas pages directly as emitted by \`rigc build\`.
3. **Zero Spine runtime**: Links no Esoteric Software code.
`,
    html: `<p class="lead"><strong>Play a rig that <a href="/core/"><code>rig-c</code></a> built inside the engine or renderer your game already uses — with no Spine runtime.</strong></p>

<div class="meta-bar">
  <span>npm: <code>@rig-c/pixi@0.1.1</code> · <code>@rig-c/phaser@0.1.1</code> · <code>@rig-c/three@0.1.1</code></span>
  <span>Repository: <a href="https://github.com/rig-c/adapters"><code>github.com/rig-c/adapters</code></a></span>
  <span>License: <code>MIT</code></span>
</div>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Package</th>
        <th>Version</th>
        <th>Target Host</th>
        <th>Exports</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><a href="https://www.npmjs.com/package/@rig-c/pixi"><code>@rig-c/pixi</code></a></td>
        <td><code>0.1.1</code></td>
        <td>PixiJS 8</td>
        <td><code>PixiRig</code>, <code>PixiRenderer</code></td>
      </tr>
      <tr>
        <td><a href="https://www.npmjs.com/package/@rig-c/phaser"><code>@rig-c/phaser</code></a></td>
        <td><code>0.1.1</code></td>
        <td>Phaser 4.2+</td>
        <td><code>PhaserRig</code>, <code>PhaserRenderer</code> (shared ref-counted page textures)</td>
      </tr>
      <tr>
        <td><a href="https://www.npmjs.com/package/@rig-c/three"><code>@rig-c/three</code></a></td>
        <td><code>0.1.1</code></td>
        <td>Three.js 0.186.1+</td>
        <td>Native Three.js renderer and live <code>Group</code> (orthographic &amp; perspective)</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>PixiJS 8 Usage (<code>@rig-c/pixi</code>)</h2>
<pre><code>npm install @rig-c/pixi pixi.js @rig-c/play</code></pre>
<pre><code>import { loadModel } from '@rig-c/play';
import { Application } from 'pixi.js';
import { PixiRig } from '@rig-c/pixi';

const app = new Application();
await app.init({ width: 800, height: 600 });
document.body.appendChild(app.canvas);

const assets = await loadModel({ modelUrl: '/rigs/walk/skeleton.model.json' });
const rig = new PixiRig(assets, { ticker: app.ticker });
rig.play('walk');
app.stage.addChild(rig);
// On removal: app.stage.removeChild(rig); rig.destroy();</code></pre>

<h2>Phaser 4 Usage (<code>@rig-c/phaser</code>)</h2>
<pre><code>npm install @rig-c/phaser phaser @rig-c/play</code></pre>
<pre><code>import { loadModel } from '@rig-c/play';
import { PhaserRig } from '@rig-c/phaser';

const assets = await loadModel({
  modelUrl: '/rigs/walk/skeleton.model.json',
  regions: 'none',
});
const rig = new PhaserRig(scene, assets);
rig.setPosition(400, 480);
rig.play('walk');
scene.add.existing(rig);
// On removal: rig.destroy(); assets.dispose();</code></pre>

<h2>Three.js Usage (<code>@rig-c/three</code>)</h2>
<pre><code>npm install @rig-c/three three @rig-c/play</code></pre>

<h2>What Every Adapter Guarantees</h2>
<ol>
  <li><strong>Pose parity with <code>@rig-c/play</code></strong>: Produces the exact same pose for the same time, verified in CI across Chromium and WebKit against <code>@rig-c/play</code>'s reference output.</li>
  <li><strong>Unmodified <code>rigc build</code> inputs</strong>: Reads <code>skeleton.model.json</code> and its atlas pages directly as emitted by <code>rigc build</code>.</li>
  <li><strong>Zero Spine runtime</strong>: Links no Esoteric Software code.</li>
</ol>`,
  },
  {
    slug: 'exam',
    navLabel: 'AI Exam',
    title: 'rig-c/exam — Open-Book Rigging Benchmark & Leaderboard for AI Agents',
    description:
      'An open-book exam for AI coding agents: build a 2D rig from one painting, retarget walk/run/dance motions, and fix broken drafts using only the published rig-c packages.',
    keywords: [
      'rig-c exam',
      'AI agent benchmark',
      'LLM coding benchmark',
      '2D rigging benchmark',
      'Claude Opus',
      'Claude Haiku',
      'Gemini Flash',
      'Gemini Argon',
    ],
    repoUrl: 'https://github.com/rig-c/exam',
    summaryForLlms:
      'rig-c/exam benchmark rules and leaderboards: Basic Exam (5 sittings, 16/16 pass across Haiku, Gemini Flash, Sol 6.1) and Advanced Exam (R1 walk, R2 run, R3 dance across 5 models).',
    markdown: `# rig-c/exam — Does Your AI Model Pass?

**An open-book exam for AI agents: build a rig from one painting with the published rig-c tools, and write down what you expected before each step.**

- **Repository**: <https://github.com/rig-c/exam>
- **Prompt (Basic)**: <https://github.com/rig-c/exam/blob/main/PROMPT.md>
- **Advanced Edition**: <https://github.com/rig-c/exam/tree/main/advanced>
- **License**: CC BY-NC 4.0

The rig-c tools are written for agents that cannot see what they build. \`rig-c/exam\` measures whether that holds for a fresh agent session that has never seen the tools before: the only help is what ships inside the installed packages (\`README.md\`, \`docs/\`, \`--help\`). Before every command that changes a file, the examinee must record what it read and what it expects in \`JOURNAL.md\`. Where expectation and reality differ — where the agent says *WTF?* — a tool message or guide was missing something.

## Basic Exam Leaderboard (Tasks 01-build, 02-move, 03-correct)

5 independent sittings graded from submitted input files via \`python3 grade.py\`:

| Model | Sittings | 01-build | 02-move | 03-correct | Total Lines Passed | Minutes | Tokens (Fresh In + Out) |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **Claude Haiku** (\`2026-10-12-haiku\`) | 1 | 4 / 4 | 7 / 7 | 5 / 5 | **16 / 16** | 21.0 | 531k |
| **Gemini 3.8 Flash** (\`2026-10-13-gemini-3.8-flash\`) | 1 | 4 / 4 | 7 / 7 | 5 / 5 | **16 / 16** | 20.0 | 1.4M |
| **\`gpt-6-sol\`** (\`2026-10-13-gpt-6-sol\`) | 1 | 4 / 4 | 7 / 7 | 5 / 5 | **16 / 16** | 14.1 | 258k |
| **Sol 6.1 (\`gpt-6.1-sol\`)** (2 sittings) | 2 | 4 / 4 | 7 / 7 | 5 / 5 | **32 / 32** (16/16 each) | 14.2 – 15.3 | 195k – 270k |

## Advanced Exam Leaderboard (Walk · Run · Dance Pose Retargeting)

Starts from a built rig: the agent retargets recorded walk (R1), run (R2), and dance (R3) pose sequences with [\`@rig-c/pose\`](/pose/), one round per fresh session, fixing what the diagnostic numbers report without ever seeing the footage:

| Model | R1 Walk | R2 Run | R3 Dance | 0.21 Shin-Scale Row (What-If) | Minutes (R1 · R2 · R3) |
| --- | :-: | :-: | :-: | --- | --- |
| \`claude-haiku-5-5\` | **9 / 9** | 8 / 14 (FAIL) | **13 / 13** | passes all 3 | \`3.1 · 2.4 · 7.4\` |
| \`claude-opus-5-5\` | **9 / 9** | **14 / 14** | **13 / 13** | fails R2 (\`0.106\`) | \`8.2 · 8.7 · 8.4\` |
| \`claude-sonnet-5-5\` | **9 / 9** | **14 / 14** | **13 / 13** | passes all 3 | \`7.3 · 10.3 · 18.7\` |
| \`gemini-3.8-flash-medium\` | **9 / 9** | **14 / 14** | **13 / 13** | fails R2 (\`0.106\`) | \`8.1 · 14.3 · 11.4\` |
| \`gemini-4-argon-high\` | **9 / 9** | **14 / 14** | **13 / 13** | passes all 3 | \`16.8 · 20.3 · 32.5\` |

## Rules of the Exam

1. **Open book, closed neighbours.** Examinees may read anything inside the pinned npm packages and public tool repos, but may not read another examinee's run under \`results/\` or ask a human.
2. **Pinned versions.** \`npm ci\` installs the exact round versions declared in \`package.json\`.
3. **Journal before you act.** Every step in \`JOURNAL.md\` must record expectations before running the command.
4. **Submit the transcript.** Raw session logs are submitted alongside \`JOURNAL.md\`.
5. **The grader rebuilds from inputs.** \`grade.py\` trusts only the handed-in config/spec files and rebuilds from scratch.
`,
    html: `<p class="lead"><strong>An open-book exam for AI agents: build a rig from one painting with the published rig-c tools, and write down what you expected before each step.</strong></p>

<div class="meta-bar">
  <span>Repository: <a href="https://github.com/rig-c/exam"><code>github.com/rig-c/exam</code></a></span>
  <span>Basic Prompt: <a href="https://github.com/rig-c/exam/blob/main/PROMPT.md"><code>PROMPT.md</code></a></span>
  <span>Advanced Edition: <a href="https://github.com/rig-c/exam/tree/main/advanced"><code>advanced/</code></a></span>
  <span>License: <code>CC BY-NC 4.0</code></span>
</div>

<p>The rig-c tools are written for agents that cannot see what they build. <code>rig-c/exam</code> measures whether that holds for a fresh agent session that has never seen the tools before: the only help is what ships inside the installed packages (<code>README.md</code>, <code>docs/</code>, <code>--help</code>). Before every command that changes a file, the examinee must record what it read and what it expects in <code>JOURNAL.md</code>. Where expectation and reality differ — where the agent says <em>WTF?</em> — a tool message or guide was missing something.</p>

<h2>Basic Exam Leaderboard (Tasks 01-build, 02-move, 03-correct)</h2>
<p>5 independent sittings graded from submitted input files via <code>python3 grade.py</code>:</p>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Model</th>
        <th>Sittings</th>
        <th>01-build</th>
        <th>02-move</th>
        <th>03-correct</th>
        <th>Total Passed</th>
        <th>Minutes</th>
        <th>Tokens (Fresh In + Out)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><a href="https://github.com/rig-c/exam/tree/main/results/claude-haiku/"><strong>Claude Haiku</strong></a></td>
        <td>1</td>
        <td>4 / 4</td>
        <td>7 / 7</td>
        <td>5 / 5</td>
        <td><strong>16 / 16</strong></td>
        <td>21.0</td>
        <td>531k</td>
      </tr>
      <tr>
        <td><a href="https://github.com/rig-c/exam/tree/main/results/gemini-3.8-flash/"><strong>Gemini 3.8 Flash</strong></a></td>
        <td>1</td>
        <td>4 / 4</td>
        <td>7 / 7</td>
        <td>5 / 5</td>
        <td><strong>16 / 16</strong></td>
        <td>20.0</td>
        <td>1.4M</td>
      </tr>
      <tr>
        <td><a href="https://github.com/rig-c/exam/tree/main/results/gpt-6-sol/"><strong><code>gpt-6-sol</code></strong></a></td>
        <td>1</td>
        <td>4 / 4</td>
        <td>7 / 7</td>
        <td>5 / 5</td>
        <td><strong>16 / 16</strong></td>
        <td>14.1</td>
        <td>258k</td>
      </tr>
      <tr>
        <td><a href="https://github.com/rig-c/exam/tree/main/results/sol-6.1/"><strong>Sol 6.1 (<code>gpt-6.1-sol</code>)</strong></a></td>
        <td>2</td>
        <td>4 / 4</td>
        <td>7 / 7</td>
        <td>5 / 5</td>
        <td><strong>32 / 32</strong> (16/16 each)</td>
        <td>14.2 – 15.3</td>
        <td>195k – 270k</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>Advanced Exam Leaderboard (Walk · Run · Dance Pose Retargeting)</h2>
<p>Starts from a built rig: the agent retargets recorded walk (R1), run (R2), and dance (R3) pose sequences with <a href="/pose/"><code>@rig-c/pose</code></a>, one round per fresh session, fixing what the diagnostic numbers report without ever seeing the footage:</p>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Model</th>
        <th>R1 Walk</th>
        <th>R2 Run</th>
        <th>R3 Dance</th>
        <th>0.21 Shin-Scale Row (What-If)</th>
        <th>Minutes (R1 · R2 · R3)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><a href="https://github.com/rig-c/exam/tree/main/advanced/results/claude-haiku-5-5/"><code>claude-haiku-5-5</code></a></td>
        <td><strong>9 / 9</strong></td>
        <td>8 / 14 (FAIL)</td>
        <td><strong>13 / 13</strong></td>
        <td>passes all 3</td>
        <td><code>3.1 · 2.4 · 7.4</code></td>
      </tr>
      <tr>
        <td><a href="https://github.com/rig-c/exam/tree/main/advanced/results/claude-opus-5-5/"><code>claude-opus-5-5</code></a></td>
        <td><strong>9 / 9</strong></td>
        <td><strong>14 / 14</strong></td>
        <td><strong>13 / 13</strong></td>
        <td>fails R2 (<code>0.106</code>)</td>
        <td><code>8.2 · 8.7 · 8.4</code></td>
      </tr>
      <tr>
        <td><a href="https://github.com/rig-c/exam/tree/main/advanced/results/claude-sonnet-5-5/"><code>claude-sonnet-5-5</code></a></td>
        <td><strong>9 / 9</strong></td>
        <td><strong>14 / 14</strong></td>
        <td><strong>13 / 13</strong></td>
        <td>passes all 3</td>
        <td><code>7.3 · 10.3 · 18.7</code></td>
      </tr>
      <tr>
        <td><a href="https://github.com/rig-c/exam/tree/main/advanced/results/gemini-3.8-flash-medium/"><code>gemini-3.8-flash-medium</code></a></td>
        <td><strong>9 / 9</strong></td>
        <td><strong>14 / 14</strong></td>
        <td><strong>13 / 13</strong></td>
        <td>fails R2 (<code>0.106</code>)</td>
        <td><code>8.1 · 14.3 · 11.4</code></td>
      </tr>
      <tr>
        <td><a href="https://github.com/rig-c/exam/tree/main/advanced/results/gemini-4-argon-high/"><code>gemini-4-argon-high</code></a></td>
        <td><strong>9 / 9</strong></td>
        <td><strong>14 / 14</strong></td>
        <td><strong>13 / 13</strong></td>
        <td>passes all 3</td>
        <td><code>16.8 · 20.3 · 32.5</code></td>
      </tr>
    </tbody>
  </table>
</div>

<h2>Rules of the Exam</h2>
<ol>
  <li><strong>Open book, closed neighbours.</strong> Examinees may read anything inside the pinned npm packages and public tool repos, but may not read another examinee's run under <code>results/</code> or ask a human.</li>
  <li><strong>Pinned versions.</strong> <code>npm ci</code> installs the exact round versions declared in <code>package.json</code>.</li>
  <li><strong>Journal before you act.</strong> Every step in <code>JOURNAL.md</code> must record expectations before running the command.</li>
  <li><strong>Submit the transcript.</strong> Raw session logs are submitted alongside <code>JOURNAL.md</code>.</li>
  <li><strong>The grader rebuilds from inputs.</strong> <code>grade.py</code> trusts only the handed-in config/spec files and rebuilds from scratch.</li>
</ol>`,
  },
  {
    slug: 'examples',
    navLabel: 'Examples',
    title: 'rig-c Reproducible Examples — parts-examples (20-Rig Family) & Trailer',
    description:
      'Public reproducible character inputs, the 5-character x 4-outfit (20 rigs, 396 parts) Agent Family deterministic rebuild suite, and the 12-second rig-c trailer.',
    keywords: [
      'rig-c examples',
      'parts-examples',
      'rig-c trailer',
      'See-through dataset',
      'deterministic rigging',
      'Spine 4.3 examples',
    ],
    repoUrl: 'https://github.com/rig-c/parts-examples',
    summaryForLlms:
      'Reproducible showcase repositories: rig-c/parts-examples (6 standalone character input sets + 5x4=20 Family rigs, 396 part rows, with SHA256 reproducibility gates) and rig-c/trailer (12s 240-frame animated short rebuilt by ./build.sh).',
    markdown: `# Reproducible Examples (\`parts-examples\` & \`trailer\`)

Every public rig-c showcase ships with its generated source paintings, See-through layer decompositions, agent-authored configs, and one-command deterministic rebuild scripts.

## 1. \`rig-c/parts-examples\` — Public Character Inputs & The 20-Rig Agent Family

Repository: <https://github.com/rig-c/parts-examples>

### Single-Character Fixtures

| Key | Seed | Checkpoint | See-through Layers | Purpose |
| --- | --- | --- | --- | --- |
| \`demo\` | \`71006\` (+ hand detailer) | Hassaku XL (Illustrious) v1.3 Style A | 29 full + 29 head | The primary \`@rig-c/parts\` README character: twin tails, bow, layered skirt, arms held clear of the body. |
| \`scarf\` | \`72004\` | Pony Diffusion V6 XL | 29 full + 29 head | A very long red scarf with both ends hanging free, knit sweater and pleated skirt: the hanging element the others lack. |
| \`three-quarter\` | \`250011\` | Hassaku XL (Illustrious) v1.3 Style A | 29 full + 29 head | Head turned toward image left and tilted for head-frame turn measurements. |
| \`wind\` | \`372108\` | Hassaku XL (Illustrious) v1.3 Style A | 29 full + 29 head | Very long ribbon-wrapped twin tails and a wide two-layer skirt, painted for wind interaction. |
| \`reference-sample\` | \`70011\` | Pony Diffusion V6 XL | 29 full + 29 head | Regression fixture held to the reference implementation's outputs. |
| \`reference-demo\` | \`71004\` | Pony Diffusion V6 XL | 29 full + 29 head | Regression fixture held to the reference implementation's outputs. |

### \`family/\` — 5 Characters × 4 Outfits (20 Rigs, 396 Parts)

Starting from one wide group illustration (\`1024×571\` RGBA) upscaled with \`4x-AnimeSharp\` to \`4096×2284\`, the \`family/\` suite overcomes See-through's fixed \`1024×1024\` resolution limit by combining 2-pass (\`full\` + \`head\`) decomposition, visible-surface 4x detail injection, and hash-bound declarative mesh/binding repair recipes (\`declared-repairs.json\`) across 5 characters and 4 outfit sets (\`office\`, \`homewear\`, \`swimwear\`, \`uniform\`).

\`\`\`sh
# Deterministic rebuild & compiler gate across all 20 rigs (396 parts)
bun install --cwd family/tools/outline-field-islands --frozen-lockfile
node family/tools/verify-reproducibility.mjs --out /tmp/new-repro-evidence
bun family/tools/verify-accepted.mjs --out /tmp/new-family-evidence
\`\`\`

## 2. \`rig-c/trailer\` — 12-Second Reproducible Animated Short

Repository: <https://github.com/rig-c/trailer>

A character sitting on a swing under a night sky breathes, tilts her head, smiles, kicks her legs, hops, and waves, her twin tails following on physics chains — rebuilt byte-for-byte (240 frames at 20 fps, \`960×540\` WebP + \`1920×1080\` PNG frames) from one painting, two See-through layer sets, and agent-authored configs:

\`\`\`sh
git clone https://github.com/rig-c/trailer && cd trailer
pip install -r requirements.txt
./build.sh
\`\`\`
`,
    html: `<p class="lead">Every public rig-c showcase ships with its generated source paintings, See-through layer decompositions, agent-authored configs, and one-command deterministic rebuild scripts.</p>

<div class="meta-bar">
  <span>Inputs &amp; Family: <a href="https://github.com/rig-c/parts-examples"><code>github.com/rig-c/parts-examples</code></a></span>
  <span>Trailer: <a href="https://github.com/rig-c/trailer"><code>github.com/rig-c/trailer</code></a></span>
</div>

<h2>1. <code>rig-c/parts-examples</code> — Public Character Inputs &amp; The 20-Rig Agent Family</h2>

<h3>Single-Character Fixtures</h3>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Key</th>
        <th>Seed</th>
        <th>Checkpoint</th>
        <th>See-through Layers</th>
        <th>Purpose</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>demo</code></td>
        <td><code>71006</code> (+ hand detailer)</td>
        <td>Hassaku XL (Illustrious) v1.3 Style A</td>
        <td>29 full + 29 head</td>
        <td>The primary <a href="/parts/"><code>@rig-c/parts</code></a> README character: twin tails, bow, layered skirt, arms held clear of the body.</td>
      </tr>
      <tr>
        <td><code>scarf</code></td>
        <td><code>72004</code></td>
        <td>Pony Diffusion V6 XL</td>
        <td>29 full + 29 head</td>
        <td>A very long red scarf with both ends hanging free, knit sweater and pleated skirt: the hanging element the others lack.</td>
      </tr>
      <tr>
        <td><code>three-quarter</code></td>
        <td><code>250011</code></td>
        <td>Hassaku XL (Illustrious) v1.3 Style A</td>
        <td>29 full + 29 head</td>
        <td>Head turned toward image left and tilted for head-frame turn measurements.</td>
      </tr>
      <tr>
        <td><code>wind</code></td>
        <td><code>372108</code></td>
        <td>Hassaku XL (Illustrious) v1.3 Style A</td>
        <td>29 full + 29 head</td>
        <td>Very long ribbon-wrapped twin tails and a wide two-layer skirt, painted for wind interaction.</td>
      </tr>
      <tr>
        <td><code>reference-sample</code></td>
        <td><code>70011</code></td>
        <td>Pony Diffusion V6 XL</td>
        <td>29 full + 29 head</td>
        <td>Regression fixture held to the reference implementation's outputs.</td>
      </tr>
      <tr>
        <td><code>reference-demo</code></td>
        <td><code>71004</code></td>
        <td>Pony Diffusion V6 XL</td>
        <td>29 full + 29 head</td>
        <td>Regression fixture held to the reference implementation's outputs.</td>
      </tr>
    </tbody>
  </table>
</div>

<h3><code>family/</code> — 5 Characters × 4 Outfits (20 Rigs, 396 Parts)</h3>
<p>Starting from one wide group illustration (<code>1024×571</code> RGBA) upscaled with <code>4x-AnimeSharp</code> to <code>4096×2284</code>, the <code>family/</code> suite overcomes See-through's fixed <code>1024×1024</code> resolution limit by combining 2-pass (<code>full</code> + <code>head</code>) decomposition, visible-surface 4x detail injection, and hash-bound declarative mesh/binding repair recipes (<code>declared-repairs.json</code>) across 5 characters and 4 outfit sets (<code>office</code>, <code>homewear</code>, <code>swimwear</code>, <code>uniform</code>).</p>
<pre><code># Deterministic rebuild &amp; compiler gate across all 20 rigs (396 parts)
bun install --cwd family/tools/outline-field-islands --frozen-lockfile
node family/tools/verify-reproducibility.mjs --out /tmp/new-repro-evidence
bun family/tools/verify-accepted.mjs --out /tmp/new-family-evidence</code></pre>

<h2>2. <code>rig-c/trailer</code> — 12-Second Reproducible Animated Short</h2>
<p>A character sitting on a swing under a night sky breathes, tilts her head, smiles, kicks her legs, hops, and waves, her twin tails following on physics chains — rebuilt byte-for-byte (240 frames at 20 fps, <code>960×540</code> WebP + <code>1920×1080</code> PNG frames) from one painting, two See-through layer sets, and agent-authored configs:</p>
<pre><code>git clone https://github.com/rig-c/trailer &amp;&amp; cd trailer
pip install -r requirements.txt
./build.sh</code></pre>`,
  },
];
