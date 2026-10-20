---
navLabel: Review
title: "@rig-c/review: local rig inspection and feedback"
description: A local workspace where a person inspects an agent's rig output, compares it with reference video, and exports issue-ready feedback.
summaryForLlms: "@rig-c/review is a local, loopback-only CLI and browser workspace for a person to inspect a compiled rig, compare it with reference video, and save structured, source-bound feedback for the producing agent."
packageName: "@rig-c/review"
packageVersion: "0.2.1"
repoUrl: https://github.com/rig-c/review
npmUrl: https://www.npmjs.com/package/@rig-c/review
---
# @rig-c/review

<p class="mod-role">A local inspection page for a person: open what an agent built, find what looks wrong, pin it to a frame and a slot, and hand it back as an issue.</p>

<figure class="mod-hero">
  <img src="/assets/docs/review-screen.jpg" alt="The rig-review page: the left column lists checkpoints and source files, the centre shows Character 1's shirt part zoomed in with a dashed selection box, the right column lists all 17 slots with topwear selected, and the Feedback panel below shows one saved defect on slot topwear" width="1600" height="1000">
  <figcaption>Character 1's build from before the shoulder repair, open in <code>rig-review</code> 0.2.1: <code>topwear</code> soloed and zoomed, one defect saved against it, the review submitted as <em>changes requested</em>.</figcaption>
</figure>

<p class="mod-skip">Skip to <a href="#install">Install</a> · <a href="#inputs-and-outputs">Inputs and outputs</a> · <a href="#limits">Limits</a> · <a href="#go-deeper">Docs</a></p>

{{thread:review}}

The checks that keep a broken rig off the disk are structural: a shoulder that renders flat passes all of them. Someone has to look — and what they find has to reach whoever fixes it as something more precise than a screenshot. Review runs on your machine (`127.0.0.1` only), plays the build with the same `@rig-c/play` runtime a site would use, and records feedback bound to a frame range, a slot or bone, and the exact camera, without touching the files it was given.

## One problem, from seeing it to the fix

Character 1's shirt once had a flat, indented shoulder: an earlier preparation script had cut away cloth that the hair covers in the still and uncovers when it moves. The family suite records that repair in [its shoulder-repair note](https://github.com/rig-c/parts-examples/blob/main/family/roa/SHOULDER_REPAIR.md). Here it is replayed in Review on the build from before the repair.

<figure class="figure-media">
  <div class="media">
    <video data-loop="the review flow" controls muted playsinline preload="metadata" poster="/assets/docs/review-flow-poster.jpg" width="1200" height="750" aria-label="Recorded video: the rig-review page with Character 1's build; the idle is paused at 1.25 seconds, the topwear slot is picked, soloed and zoomed until the step in the screen-left shoulder shows, the slot is used for feedback with frames 15 to 15, category Defect and a one-line summary, the feedback is added and the review submitted as changes requested, and the exported feedback JSON is shown">
      <source src="/assets/docs/review-flow.mp4" type="video/mp4">
      <img src="/assets/docs/review-flow-poster.jpg" alt="The rig-review page with Character 1's whole rig playing its idle" width="1200" height="750">
    </video>
  </div>
  <figcaption><span class="media-kind">Recorded video</span> The whole case in 15 seconds: <code>rig-review</code> 0.2.1 driven through its own page on Character 1's check build at parts-examples <code>144f556</code>, before the repair — pause at 1.25 s, pick and solo <code>topwear</code>, zoom on the shoulder, pin it as feedback, submit, export. Nothing is edited but the cut at both ends; the cursor is drawn in, and the last shot is the downloaded JSON opened in the same browser.</figcaption>
</figure>

<div class="case">

### 1. Open the build, and look where the motion would reveal it

`rig-review open <dir>` checks the folder and prints a loopback URL. In the whole rig the back hair covers the spot, so the reviewer pauses the idle, picks `topwear` in the parts list, ticks *Solo selected slot* and zooms in.

<figure class="figure-wide">
  <img src="/assets/docs/review-in-context.jpg" alt="The whole rig at the same zoom: the back hair covers the shoulder" width="1200" height="750" loading="lazy">
  <figcaption>The same camera with every slot drawn — the hair hides what the solo view shows.</figcaption>
</figure>

</div>

<div class="case">

### 2. Pin it, and submit

*Use slot for feedback*, then a category, a frame range and one line of summary; *Submit review* with status *Changes requested*. The export is plain JSON (or issue-ready Markdown):

```json
{
  "schema": "rig-review-feedback/1",
  "reviewedSource": {
    "viewerVersion": "0.2.1", "runtimeVersion": "1.12.0",
    "rig": { "path": "build/skeleton.model.json", "sha256": "28490ee9e2c7fa8a…" }
  },
  "status": "changes-requested",
  "feedback": [{
    "frameStart": 15, "frameEnd": 15,
    "target": { "kind": "slot", "name": "topwear" },
    "category": "defect",
    "summary": "Screen-left shoulder top of topwear is flat and indented (cloth alpha cut); exposed when hair moves aside",
    "context": { "animation": "idle", "time": 1.25, "frame": null,
                 "camera": { "zoom": 7.3586, "x": -112.72, "y": 1792.86, "coordinateSystem": "world-y-up" } }
  }]
}
```

The rig's hash, the viewer and runtime versions and the saved camera mean anyone holding the issue can reopen exactly this view. `"frame": null` is honest: this build declares no frame clock, so Review shows `rate unknown`, and the 15 is a number the reviewer entered (1.25 s at the check sampler's 12 fps).

</div>

<div class="case">

### 3. The fix happens upstream; the rebuilt rig comes back

Review changes nothing in the package — the repair was made in the authoring workflow: a guarded stage restored the original shirt cloth in that area and widened five outline vertices, then the rig was rebuilt and checked through the ordinary gates. Reopened in Review with the same view:

<figure class="figure-wide">
  <img src="/assets/docs/review-before-after.jpg" alt="Two close-ups of the shoulder: left, flat with a step; right, a smooth rounded shoulder" width="1296" height="400" loading="lazy">
  <figcaption>Left: before the repair, as pinned. Right: the current build, same time, slot and camera.</figcaption>
</figure>

</div>

Review also lines a build up against reference footage — side by side, synchronized cameras, frame strips — which is how a retargeted motion like the [Pose](/docs/pose/) page's cup swing gets judged against what it was meant to copy.

## Install
```sh
npm i -D @rig-c/review
npx rig-review open /absolute/path/to/output
```
Runs under Bun 1.3.0 or later, which must be on `PATH`; `open` prints a loopback URL and exits (README §"Start").

## Inputs and outputs
| In | Out |
| --- | --- |
| An output folder: `skeleton.model.json` (root or `build/`), `motion.json`, `report.json`, `skeleton.json`/`.skel`/`.atlas` | A loopback inspection page (`127.0.0.1` only) |
| Source references: videos (`.mp4`, `.webm`, `.mov`), strip/contact/sheet images, `*pose*.json` sequences | Saved review session: status, checkpoint outcomes and feedback, under `~/.local/state/rig-c-review/` |
| (optional) a curated `review.json` with checkpoints, references and angle axes | Feedback export as JSON or issue-ready Markdown (`feedback --format issue`) |
| For `compare`: two outputs and one local reference video | Frame strips as PNG (plus a `.png.json` provenance sidecar) or JSON |

## Limits
- **"Motion is view, annotate and export only."** It never retimes, authors keys, or writes `motion.json` (README, intro).
- **No modeling touch-up yet**: it "does not edit meshes, weights or source art" (README, intro).
- **`check` validates the delivery contract and model envelope**, not the upstream compiler gate or visual quality; a raw `skeleton.json` can be inspected but not played (README §"Existing output handoff").
- **No frame rate is inferred**: without a declared clock the page shows `rate unknown`, and strip PNGs need the report's exact `frameTimes` (README §"Existing output handoff", §"Frame strip export").
- **Never publishes an issue automatically**; saving or exporting feedback modifies no model (README §"Feedback ownership").
- **Maturity**: "the CLI is the supported surface, and no importable API is promised yet" (README §"Start"; the README still says 0.1.x while npm is at 0.2.1).

## Go deeper
- [Place in the toolchain](https://github.com/rig-c/review#place-in-the-toolchain)
- [Existing output handoff](https://github.com/rig-c/review#existing-output-handoff)
- [Compare two outputs](https://github.com/rig-c/review#compare-two-outputs)
- [Feedback ownership](https://github.com/rig-c/review#feedback-ownership)
- [One-command owner handoff](https://github.com/rig-c/review#one-command-owner-handoff)
- [docs/REVIEW_PACKAGE.md](https://github.com/rig-c/review/blob/main/docs/REVIEW_PACKAGE.md) — the `review.json` package and folder adapter ([two-package comparison](https://github.com/rig-c/review/blob/main/docs/REVIEW_PACKAGE.md#two-package-comparison))
- [docs/DESIGN.md](https://github.com/rig-c/review/blob/main/docs/DESIGN.md) — the runnable foundation vs. future modeling touch-up
- [npm](https://www.npmjs.com/package/@rig-c/review) · [CHANGELOG](https://github.com/rig-c/review/blob/main/CHANGELOG.md)
<!-- SOURCES (not published)
- review case: @rig-c/review 0.2.1 (play 1.12.0) driven through its UI with Playwright on parts-examples family/roa/out/check/build at 144f556 (pre-repair) and c239b09 (current); feedback-export.json verbatim (excerpted with …); frame 15 entered by hand
- review flow clip: @rig-c/review 0.2.1 (play 1.12.0) + playwright 1.63.0 headless Chromium (--use-angle=metal), 1200x750, fake clock 1/12 s per frame — `PARTS_EXAMPLES=<clone> PLAYWRIGHT_MODULE=<playwright> bun scripts/review-capture.ts --review <rig-review bin>`; parts-examples 144f556 family/roa/out/check/build (model sha256 28490ee9e2c7fa8a…, source hash 0ecaf7876b64); 179 frames, 14.917 s at 12 fps, 1200x750 H.264 High yuv420p, 591758 bytes (ffprobe); camera 736 % after fit + four wheel steps + one drag; export opened from the download (no local paths in it)
- repair description: family/roa/SHOULDER_REPAIR.md (restore original head-run cloth, five outer-hull vertices expanded, rebuilt through rigc build + rig-parts check)

- version 0.2.1, bin rig-review, description — `npm view @rig-c/review version description bin`
- human inspection and feedback gate; does not replace Core's compiler gate — README.md:13-14
- agent does not build a new viewer per rig — README.md:3
- playback through @rig-c/play; image, video, pose-sequence references; feedback — README.md:5
- motion view/annotate/export only; never retimes, authors keys, writes motion.json — README.md:5
- does not edit meshes, weights or source art — README.md:5
- check validates delivery contract and model envelope, not compiler gate or visual quality — README.md:46
- feedback bound to exact bytes; interval, target, category, summary — README.md:72
- reviewedSource fields — README.md:72
- changed content starts new pending session — README.md:76
- agent retrieves with feedback command, read-only session JSON — README.md:78-86
- prior submission never borrowed across content changes — README.md:86
- status values; opening leaves pending — README.md:72; never approves — README.md:172-173
- JSON and issue-ready Markdown exports — README.md:72; --format issue — README.md:89-96
- frame strip PNG/JSON, .png.json sidecar — README.md:126, README.md:136
- recognized files: root or build/skeleton.model.json, motion.json, report.json, videos, pose json; reads without changing — README.md:42
- open hashes, starts or reuses background instance, prints URL, exits — README.md:146-147
- no browser opened, binds only 127.0.0.1 — README.md:202-203; README.md:54
- feedback stored under ~/.local/state/rig-c-review/ — README.md:76
- compare: two packages, one reference video, one playhead — README.md:58-66
- install + open commands — README.md:24-27
- Bun 1.3.0 or later — README.md:29; `npm view @rig-c/review engines`
- CLI is supported surface, no importable API; exports only package.json — README.md:31; `npm view @rig-c/review exports`
- review.json with checkpoints, references, angle axes — README.md:48
- checkpoint outcomes/notes — README.md:72
- producer clock fps+frame0 / frameTimes; `rate unknown` — README.md:44
- reference binding name + streaming byte hash — README.md:178-181
- #cap= write capability; copied link without fragment opens read-only — README.md:229-243
- sibling Play / adapters as delivery downstream — README.md:9-11
- README anchors exist — README.md headings at lines 20, 56, 70, 124, 208, 245
- docs files — docs/REVIEW_PACKAGE.md:1, docs/DESIGN.md:1
-->
