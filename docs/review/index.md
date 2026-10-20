# @rig-c/review

<p class="mod-role">A local workspace for a person: open what an agent built, find what looks wrong, try a setup change through the producer that built it, pin what is left to a frame and a slot, and hand it back as an issue.</p>

<figure class="mod-hero">
  <img src="/assets/docs/review-screen.jpg" alt="The rig-review page in Setup mode: the left column lists Character 1's 17 parts with topwear selected and Solo ticked, the stage shows the shirt alone at 800 percent with the screen-left shoulder cut flat and stepped, and the Inspector below describes the topwear mesh" width="1600" height="1000">
  <figcaption>Character 1 as <code>rig-parts</code> 1.44.0 builds it from its config at parts-examples <code>c239b09</code>, open in <code>rig-review</code> 0.7.0: <code>topwear</code> soloed at 800 % on the screen-left shoulder, where the build's cloth cut leaves a flat, indented step.</figcaption>
</figure>

<p class="mod-skip">Skip to <a href="#install">Install</a> · <a href="#inputs-and-outputs">Inputs and outputs</a> · <a href="#limits">Limits</a> · <a href="#go-deeper">Docs</a></p>

*This page follows Character 1 from the Family set: here it is looked at. Every module works on its own; this order is one path, not a requirement.*

The checks that keep a broken rig off the disk are structural: a shoulder that renders flat passes all of them. Someone has to look — and what they find has to reach whoever fixes it as something more precise than a screenshot. Review runs on your machine (`127.0.0.1` only), plays the build with the same `@rig-c/play` runtime a site would use, and records feedback bound to a frame range, a slot or bone, and the exact camera, without touching the files it was given. Given the files the build was made from, its Setup and Animate edits go back through the producer that made it: review writes the edit as data, the installed producer rebuilds in scratch, and the result reloads on the stage.

## One problem, from seeing it to the fix

Built by its producer from its config and painting, Character 1's shirt has a flat, indented shoulder: the cloth cut leaves out what the hair covers in the still, and the hair uncovers it when it moves. The family suite records the repair in [its shoulder-repair note](https://github.com/rig-c/parts-examples/blob/main/family/roa/SHOULDER_REPAIR.md). Here review opens the build `rig-parts` 1.44.0 makes from that commit's config, finds the step, tries a setup edit through the producer on the way, and hands the defect back.

<figure class="figure-media">
  <div class="media">
    <video data-loop="the review flow" controls muted playsinline preload="metadata" poster="/assets/docs/review-flow-poster.jpg" width="1600" height="1000" aria-label="Recorded video: the rig-review page with Character 1's build; the idle is paused at 1.25 seconds, the topwear slot is picked, soloed and zoomed until the step in the screen-left shoulder shows; in Setup the chest-region editor and mesh edges are turned on, the R region is dragged up and Apply · Rebuild reloads the shirt with the producer's line in the editor bar; the slot is used for feedback with frames 15 to 15, category Defect and a one-line summary, the review is submitted as changes requested, and the exported feedback JSON is shown down to its applied record">
      <source src="/assets/docs/review-flow.mp4" type="video/mp4">
      <img src="/assets/docs/review-flow-poster.jpg" alt="The rig-review page with Character 1's whole rig playing its idle" width="1600" height="1000">
    </video>
  </div>
  <figcaption><span class="media-kind">Recorded video</span> The whole case in 20 seconds: <code>rig-review</code> 0.7.0 driven through its own page on Character 1 as <code>@rig-c/parts</code> 1.44.0 builds it from parts-examples <code>c239b09</code> — pause at 1.25 s, pick and solo <code>topwear</code>, zoom on the shoulder; in Setup, drag the R chest region up 30 px and <em>Apply · Rebuild</em>; pin the shoulder as feedback, submit, and the export. The producer's ~30 s run behind Apply is cut to its result line; nothing else is edited but the two ends. The cursor is drawn in, and the last shots are <code>rig-review feedback --format json</code> opened in the same browser.</figcaption>
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
    "viewerVersion": "0.7.0", "runtimeVersion": "1.12.0",
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
- **Maturity**: "the CLI is the supported surface, and no importable API is promised yet" (README §"Start"; the README still says 0.1.x while npm is at 0.7.0).

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
