---
navLabel: Review
title: "@rig-c/review: local rig inspection and feedback"
description: A local workspace where a person inspects an agent's rig output, tries setup edits that the installed producer rebuilds, and exports issue-ready feedback.
summaryForLlms: "@rig-c/review is a local, loopback-only CLI and browser workspace for a person to inspect a compiled rig, compare it with reference video, try setup edits that the installed producer rebuilds in scratch, and save structured, source-bound feedback for the producing agent."
packageName: "@rig-c/review"
packageVersion: "0.7.1"
repoUrl: https://github.com/rig-c/review
npmUrl: https://www.npmjs.com/package/@rig-c/review
---
# @rig-c/review

<p class="mod-role">A local workspace for a person: open what an agent built, find what looks wrong, try a setup change through the producer that built it, pin what is left to a frame and a slot, and hand it back as an issue.</p>

<figure class="mod-hero">
  <img src="/assets/docs/review-screen.jpg" alt="The rig-review page in Setup with Edit mesh on: the left column lists Character 1's 17 parts with topwear selected and Solo ticked; the stage shows the shirt at 800 percent with its mesh drawn over it — the orange hull outline, the triangulation's edges and the vertices, a dense grid of them over the chest — and the top vertex of the screen-left shoulder, where the outline runs flat, selected; the editor bar above reads Modify, Create, Delete, Edges, Undo, Redo, Reset, Download JSON, Apply · Rebuild and 0 ops · setup pose · preview only" width="1600" height="1000">
  <figcaption>Character 1 as <code>rig-parts</code> 1.44.0 builds it from its config at parts-examples <code>c239b09</code>, open in <code>rig-review</code> 0.7.1 with <em>Edit mesh</em> on: the mesh the producer drafted for <code>topwear</code> (502 vertices, 885 triangles), read from the compiled model document and drawn in setup space, at 800 % on the screen-left shoulder where the cloth cut leaves a flat, indented step; its top vertex is selected. A move, an added vertex or a constraint edge is a typed delta, previewed only; <em>Apply · Rebuild</em> sends it to <code>rig-parts remesh --delta</code>, which retriangulates in scratch, and the revision loads in place.</figcaption>
</figure>

<p class="mod-skip">Skip to <a href="#install">Install</a> · <a href="#inputs-and-outputs">Inputs and outputs</a> · <a href="#limits">Limits</a> · <a href="#go-deeper">Docs</a></p>

{{thread:review}}

The checks that keep a broken rig off the disk are structural: a shoulder that renders flat passes all of them. Someone has to look — and what they find has to reach whoever fixes it as something more precise than a screenshot. Review runs on your machine (`127.0.0.1` only), plays the build with the same `@rig-c/play` runtime a site would use, and records feedback bound to a frame range, a slot or bone, and the exact camera, without touching the files it was given. Given the files the build was made from, its Setup and Animate edits go back through the producer that made it: review writes the edit as data, the installed producer rebuilds in scratch, and the result reloads on the stage.

## One problem, from seeing it to the fix

Built by its producer from its config and painting, Character 1's shirt has a flat, indented shoulder: the cloth cut leaves out what the hair covers in the still, and the hair uncovers it when it moves. The family suite records the repair in [its shoulder-repair note](https://github.com/rig-c/parts-examples/blob/main/family/roa/SHOULDER_REPAIR.md). Here review opens the build `rig-parts` 1.44.0 makes from that commit's config, finds the step, tries a setup edit through the producer on the way, and hands the defect back.

<figure class="figure-media">
  <div class="media">
    <video data-loop="the review flow" controls muted playsinline preload="metadata" poster="/assets/docs/review-flow-poster.jpg" width="1600" height="1000" aria-label="Recorded video: the rig-review page with Character 1's build; the idle is paused at 1.25 seconds, the topwear slot is picked, soloed and zoomed until the step in the screen-left shoulder shows; in Setup Edit mesh draws the shirt's mesh over the shoulder and its top vertex is selected, then Edit mesh is turned off; the chest-region editor and mesh edges are turned on, the R region is dragged up and Apply · Rebuild reloads the shirt with the producer's line in the editor bar; the slot is used for feedback with frames 15 to 15, category Defect and a one-line summary, the review is submitted as changes requested, and the exported feedback JSON is shown down to its applied record">
      <source src="/assets/docs/review-flow.mp4" type="video/mp4">
      <img src="/assets/docs/review-flow-poster.jpg" alt="The rig-review page with Character 1's whole rig playing its idle" width="1600" height="1000">
    </video>
  </div>
  <figcaption><span class="media-kind">Recorded video</span> The whole case in 23 seconds: <code>rig-review</code> 0.7.1 driven through its own page on Character 1 as <code>@rig-c/parts</code> 1.44.0 builds it from parts-examples <code>c239b09</code> — pause at 1.25 s, pick and solo <code>topwear</code>, zoom on the shoulder; in Setup, <em>Edit mesh</em> on the shoulder, then drag the R chest region up 30 px and <em>Apply · Rebuild</em>; pin the shoulder as feedback, submit, and the export. The producer's run behind Apply (remesh 109 s + compile 5 s in this capture) is cut to its result line; nothing else is edited but the two ends. The cursor is drawn in, and the last shots are <code>rig-review feedback --format json</code> opened in the same browser.</figcaption>
</figure>

<div class="case">

### 1. Open the build, and look where the motion would reveal it

`rig-review open <dir> --config <config.json> --parts <out>` checks the folder, records the producer handoff — the config, the parts and the rig directory the build was made from — and prints a loopback URL. Once per session review reruns the producer on that handoff and compares what it writes with the inspected rig; here the editor bar reads `baseline: reproduced — rig.json 838579dc3c4f… = inspected 838579dc3c4f…`. In the whole rig the back hair covers the shoulder, so the reviewer pauses the idle, picks `topwear` in the parts list, ticks *Solo selected slot* and zooms in.

<figure class="figure-wide">
  <img src="/assets/docs/review-in-context.jpg" alt="The whole rig at the same zoom: the back hair covers the shoulder" width="1200" height="750" loading="lazy">
  <figcaption>The same camera with every slot drawn — the hair hides what the solo view shows.</figcaption>
</figure>

</div>

<div class="case">

### 2. Change the setup, and let the producer rebuild it

In Setup, *Chest regions* draws the config's two chest circles on the shirt. Dragging the R circle's centre from y 665 to 635 changes one number; *Apply · Rebuild* sends it. "Review builds no mesh itself and never runs a manifest command" (README, *Chest regions*): the server writes the regions into the shirt's entry of a scratch copy of the config, runs the installed `rig-parts remesh` for that part and `rigc build`, both in scratch under review's state directory, and the rebuilt rig replaces the drawn one with the same camera. The editor bar ends on the producer's result — `Applied topwear with @rig-c/parts 1.44.0 · remesh … s + compile … s · Reset returns to the inspected build` — and the shirt goes from 502 to 504 vertices and 885 to 889 triangles. The inspected package is only read.

Motion edits work the same way: "The producer writes motion in scratch; review never authors keys" (README, intro). The chest edit here shows the loop; it does not touch the shoulder.

</div>

<div class="case">

### 3. Pin it, and submit

*Use slot for feedback* opens the review dialog with the target filled in; then a frame range, a category and one line of summary, *Add feedback*, status *Changes requested*, *Submit review*. The page has no export button: `rig-review feedback <dir> --config <config.json> … --format json` prints the submission (`--format issue` prints issue-ready Markdown):

```json
{
  "schema": "rig-review-session/1",
  "reviewedSource": {
    "viewerVersion": "0.7.1", "runtimeVersion": "1.12.0",
    "rig": { "path": "build/skeleton.model.json", "sha256": "1f0e98202ea9dadf…" },
    "handoff": { "schema": "rig-review-handoff/1", "how": "declared", "via": "open --config",
                 "config": { "path": "config.json", "sha256": "b132cc7680cdc3c4…" }, … }
  },
  "status": "changes-requested",
  "feedback": [{
    "frameStart": 15, "frameEnd": 15,
    "target": { "kind": "slot", "name": "topwear" },
    "category": "defect",
    "summary": "Screen-left shoulder top of topwear is flat and indented (cloth alpha cut); exposed when hair moves aside",
    "context": { "animation": "idle", "time": 1.2500000000000004, "frame": null, …
      "applied": {
        "schema": "rig-review-applied/1", "part": "topwear",
        "regions": [{ "name": "bust_r", "shape": "circle", "cx": 295, "cy": 635, "r": 21, … }, …],
        "producer": { "package": "@rig-c/parts", "version": "1.44.0" },
        "compiler": { "package": "rig-c", "version": "2.64.1" },
        "line": "rig-parts remesh: wrote 21 file(s) under revision, the provenance in remesh.json",
        "modelHash": "0ed6916485b591e9…" } }
  }]
}
```

The rig's hash, the handoff's hashes, the viewer and runtime versions and the saved camera mean anyone holding the issue can reopen exactly this view. `reviewedSource` still names the inspected build; `context.applied` names what was on the stage when the feedback was written — the regions sent, the producer and compiler, the producer's last line and the rebuilt model's hash. `"frame": null` is honest: this build declares no frame clock, so review shows `rate unknown`, and the 15 is a number the reviewer entered (1.25 s at the check sampler's 12 fps).

</div>

<div class="case">

### 4. The fix happens upstream

The repair is not in the config: a guarded stage restored the original shirt cloth in that area and widened five outline vertices, and the build committed at that commit carries it. That is why the producer's own build from the config still shows the step — and why review, opened on the committed build with the same handoff, reports `baseline: not reproduced — out/rig/images/topwear.png` and has nothing it can rebuild there. Reopened with the same view:

<figure class="figure-wide">
  <img src="/assets/docs/review-before-after.jpg" alt="Two close-ups of the shoulder: left, flat with a step; right, a smooth rounded shoulder" width="1296" height="400" loading="lazy">
  <figcaption>Left: the build <code>rig-parts</code> 1.44.0 makes from the config at <code>c239b09</code>, as pinned. Right: the build committed at <code>c239b09</code>, with the repair — same time, slot and camera (800 %).</figcaption>
</figure>

</div>

Review also lines a build up against reference footage — side by side, synchronized cameras, frame strips — which is how a retargeted motion like the [Pose](/docs/pose/) page's cup swing gets judged against what it was meant to copy.

## Install
```sh
npm i -D @rig-c/review
npx rig-review open /absolute/path/to/output
```
Runs under Bun 1.3.0 or later, which must be on `PATH`; `open` prints a loopback URL and exits (README §"Start"). Apply runs the `@rig-c/parts` installed beside the package, never one from `PATH`, and review installs nothing: without it Apply refuses `MODELING_PRODUCER_NOT_INSTALLED … bun add -d @rig-c/parts` (README §"Chest regions").

## Inputs and outputs
| In | Out |
| --- | --- |
| An output folder: `skeleton.model.json` (root or `build/`), `motion.json`, `report.json`, `skeleton.json`/`.skel`/`.atlas` | A loopback inspection page (`127.0.0.1` only) |
| Source references: videos (`.mp4`, `.webm`, `.mov`), strip/contact/sheet images, `*pose*.json` sequences | Saved review session: status, checkpoint outcomes and feedback, under `~/.local/state/rig-c-review/` |
| (optional) the producer handoff: `--config`, `--parts`, and `--source`/`--full`/`--head` for edits that rebuild from the painting | Scratch rebuilds under the state directory, loaded on the stage; nothing is written into the package |
| (optional) a curated `review.json` with checkpoints, references and angle axes | Feedback export as JSON or issue-ready Markdown from `rig-review feedback` (`--format json` / `--format issue`); the page has no export button |
| For `compare`: two outputs and one local reference video | Frame strips as PNG (plus a `.png.json` provenance sidecar) or JSON |

## Limits
- **Review authors nothing itself**: "The producer writes motion in scratch; review never authors keys"; it never writes the package's `motion.json`, meshes are rebuilt by the producer, and "weights and source art are not edited" (README, intro).
- **Apply needs a build its producer can reproduce**: whole-rig edits refuse `EDIT_BASELINE_MISMATCH` unless review's baseline reproduced the inspected rig (README §"Chest regions"), and the producer refuses a rig it did not write. A build with hand repairs, like the committed Character 1, can be inspected and reviewed but not rebuilt.
- **`check` validates the delivery contract and model envelope**, not the upstream compiler gate or visual quality; a raw `skeleton.json` can be inspected but not played (README §"Existing output handoff").
- **No frame rate is inferred**: without a declared clock the page shows `rate unknown`, and strip PNGs need the report's exact `frameTimes` (README §"Existing output handoff", §"Frame strip export").
- **Never publishes an issue automatically**; saving or exporting feedback modifies no model (README §"Feedback ownership").
- **Maturity**: "the CLI is the supported surface, and no importable API is promised yet" (README §"Start"; the README still says 0.1.x while npm is at 0.7.1).

## Go deeper
- [Place in the toolchain](https://github.com/rig-c/review#place-in-the-toolchain)
- [Existing output handoff](https://github.com/rig-c/review#existing-output-handoff)
- [Compare two outputs](https://github.com/rig-c/review#compare-two-outputs)
- [Feedback ownership](https://github.com/rig-c/review#feedback-ownership)
- [Chest regions (designate, rebuild, watch)](https://github.com/rig-c/review#chest-regions-designate-rebuild-watch) — the Apply · Rebuild loop
- [One-command owner handoff](https://github.com/rig-c/review#one-command-owner-handoff)
- [docs/REVIEW_PACKAGE.md](https://github.com/rig-c/review/blob/main/docs/REVIEW_PACKAGE.md) — the `review.json` package and folder adapter ([producer handoff](https://github.com/rig-c/review/blob/main/docs/REVIEW_PACKAGE.md#producer-handoff), [two-package comparison](https://github.com/rig-c/review/blob/main/docs/REVIEW_PACKAGE.md#two-package-comparison))
- [docs/DESIGN.md](https://github.com/rig-c/review/blob/main/docs/DESIGN.md) — the runnable foundation vs. future modeling touch-up
- [npm](https://www.npmjs.com/package/@rig-c/review) · [CHANGELOG](https://github.com/rig-c/review/blob/main/CHANGELOG.md)
<!-- SOURCES (not published)
- pins: @rig-c/review 0.7.1 (play 1.12.0; 0.7.1 = 0.7.0 + review#151, part pick without a handoff no longer throws — CHANGELOG; README unchanged from 0.7.0, diffed), @rig-c/parts 1.44.0 (rig-c 2.64.1 beside it), parts-examples c239b09 family/roa config.json + inputs/painting.png + inputs/layers/{full,head}; playwright 1.63.0 headless Chromium (--use-angle=metal)
- review case + clip + four stills + export, one run of `PARTS_EXAMPLES=<clone> PLAYWRIGHT_MODULE=<playwright> bun scripts/review-capture.ts --bin <node_modules/.bin>` (run 2026-10-21; a second run gave the same frames except the producer's timing lines — the baseline's "(… s)" and the Applied line —, the idle's phase in frames 1–17 before the pause (the playback does not follow the page's fake clock), the feedback item's random id in the export frames, and a few single anti-aliased pixels in the top bar; review-before-after and review-weights byte-identical):
  - build: `rig-parts build --config config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out out` → "build: PASS"; out/check/build copied to build/
  - open: `rig-review open character-1 --direct --config character-1/config.json --parts character-1/out --source character-1/inputs/painting.png --full character-1/inputs/layers/full --head character-1/inputs/layers/head` → exit 0, URL on stdout, stderr "animation: idle (unique actual clip)"
  - baseline line verbatim: "baseline: reproduced — rig.json 838579dc3c4f… = inspected 838579dc3c4f…"
  - flow (frame numbers of the clip, 12 fps): open 0 · Animate 6 · paused at 1.25 s 18 · topwear 23 · Solo 33 · zoom 46 (9 wheel steps of 1.1x, 800 %, the camera's limit; pan to the shoulder) · Setup 71 · pan 80 · Edit mesh 85 (view-bar toggle `#mesh-edit`, "Edit mesh") · shoulder vertex selected 98 (0 ops) · Edit mesh off 110 · Chest regions 134 (Mesh edges on) · drag R y 665→635 155 · Apply · Rebuild 170 (producer run cut, no frames) · Applied line + reloaded rig 170–187 · Use slot for feedback 188 · Add feedback 223 · Submit 243 · export JSON 255 (feedback item 260, context.applied 267)
  - Applied line verbatim (the seconds vary per run; 78.5–127.8 s remesh over seven runs on a loaded machine): "Applied topwear with @rig-c/parts 1.44.0 · remesh 109.0 s + compile 4.8 s · Reset returns to the inspected build"; topwear 502→504 posed vertices, 885→889 triangles (Inspector)
  - clip: 277 frames, 23.083 s at 12 fps, 1600x1000 H.264 High yuv420p, 1,887,557 bytes (ffprobe); poster = encoded frame 0 (the idle, as before)
  - Edit mesh (hero): the script's log "Edit mesh: topwear/topwear 502 vertices, 885 triangles, hull 117; shoulder vertex 114 at crop 174.00,480.00" (window.rigReviewEditor.meshEdit(), inspection-only); editor bar verbatim "0 ops · setup pose · preview only — the producer retriangulates · drag a vertex or edge · Shift-click selects more · drag empty space to box-select · arrows nudge 1 px (Shift 10) · Space-drag pans"; Apply · Rebuild button title "Send the delta to the producer (rig-parts remesh --delta) and load the scratch revision in place; nothing is written into the package"; sub-modes Modify / Create / Delete / Edges (web/index.html 0.7.1); CHANGELOG 0.7.0 #137 "Edit Mesh works in setup space from the model document", #140 "Edit Mesh Apply runs `rig-parts remesh --delta` and loads the revision"
  - weights (not on the page): Weights · Show weights, Bone weight, bone `chest`, same camera with Edit mesh off; state line verbatim "topwear / default / topwear · 502 vertices · weighted over 4 bone(s) · setup pose"; CHANGELOG 0.7.0 #132
  - stills: review-screen 1600x1000 (Edit mesh, frame 109's view: 800 %, the shoulder's vertex selected), review-weights 1600x1000 (written by the script, not used on the page), review-in-context 1200x750 (the inspection camera after the zoom, Solo off, 1600x1000 resized), review-before-after 1296x400 (two 648x400 crops at the same page px; right = the build committed at c239b09 opened with that commit's config + out/ as handoff, same pick, solo, zoom and pan: 800 %, shoulder at page 880.0,380.0 on both); JPEG q90
  - export: `rig-review feedback character-1 --animation idle <the open's handoff flags> --format json`, verbatim, excerpted with …; no local paths in it (checked by the script); feedback[0].context.applied = rig-review-applied/1 with regions bust_r cy 635, producer @rig-c/parts 1.44.0, compiler rig-c 2.64.1, line, modelHash; context.camera is the fitted camera the pin was written in (zoom 5.026), not the 800 % close-up
  - committed build: baseline line "baseline: not reproduced — out/rig/images/topwear.png"; Apply refused there (remesh REMESH_INPUT_WRITTEN, retune RETUNE_INPUT_WRITTEN, whole-rig EDIT_BASELINE_MISMATCH: out/rig/images/topwear.png) — observed 2026-10-20 with the pins above
  - the step is in the producer's own cut: out/rig/images/topwear.png built from the config differs from the committed one only in the shoulder box (part px x 4–99, y 60–101; 853 px alpha differ) — measured
- repair description: family/roa/SHOULDER_REPAIR.md (restore original head-run cloth, five outer-hull vertices expanded, rebuilt through rigc build + rig-parts check)

- version 0.7.1, bin rig-review, description — `npm view @rig-c/review version description bin`
- human inspection and feedback gate; does not replace Core's compiler gate — README.md:13-14
- agent does not build a new viewer per rig — README.md:3
- playback through @rig-c/play; image, video, pose-sequence references; feedback — README.md:5
- "The producer writes motion in scratch; review never authors keys."; never writes motion.json; meshes rebuilt by the producer; weights and source art not edited — README.md:5; CHANGELOG 0.7.0 Bug Fixes #143
- Apply · Rebuild runs the installed producer and reloads — README.md:577; CHANGELOG 0.7.0 #116, #120, #138
- "Review builds no mesh itself and never runs a manifest command" — README.md:577
- producer resolved beside the package, never PATH; MODELING_PRODUCER_NOT_INSTALLED … bun add -d @rig-c/parts; review installs nothing — README.md:579
- regions into a scratch config, rig-parts remesh then rigc build in scratch — README.md:580
- baseline line, EDIT_BASELINE_MISMATCH for whole-rig ops — README.md:581
- scratch under RIG_REVIEW_STATE_DIR; package only read — README.md:582
- reload in place with same camera — README.md:583
- applied record carried as context.applied; reviewedSource still names the inspected build — README.md:584
- producer handoff flags; record in reviewedSource.handoff — README.md:158-172; docs/REVIEW_PACKAGE.md "Producer handoff"
- page has no export buttons; `rig-review feedback --format json|issue` — README.md:72, README.md:96
- check validates delivery contract and model envelope, not compiler gate or visual quality — README.md:46
- feedback bound to exact bytes; interval, target, category, summary; reviewedSource fields — README.md:72
- feedback stored under ~/.local/state/rig-c-review/; saving/exporting modifies no model, never publishes an issue — README.md:76
- frame strip PNG/JSON, .png.json sidecar — README.md:126, README.md:136
- recognized files: root or build/skeleton.model.json, motion.json, report.json, videos, pose json — README.md:42
- open hashes, starts or reuses background instance, prints URL, exits; binds only 127.0.0.1 — README.md:146-147, README.md:217
- producer clock fps+frame0 / frameTimes; `rate unknown` — README.md:44
- compare: two packages, one reference video, one playhead — README.md:58-66
- install + open commands — README.md:24-27
- Bun 1.3.0 or later — README.md:29; `npm view @rig-c/review engines`
- CLI is supported surface, no importable API; README says 0.1.x — README.md:31
- review.json with checkpoints, references, angle axes — README.md:48
- README anchors exist — README.md headings "Place in the toolchain", "Existing output handoff", "Compare two outputs", "Feedback ownership", "One-command owner handoff", "Chest regions (designate, rebuild, watch)"; docs/REVIEW_PACKAGE.md "Producer handoff", "Two-package comparison"
- docs files — docs/REVIEW_PACKAGE.md:1, docs/DESIGN.md:1
-->
