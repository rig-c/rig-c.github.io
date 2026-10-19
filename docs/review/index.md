# @rig-c/review

<p class="mod-role">A local inspection page for a person: open what an agent built, find what looks wrong, pin it to a frame and a slot, and hand it back as an issue.</p>

<figure class="mod-hero">
  <img src="/assets/docs/review-screen.jpg" alt="The rig-review page: the left column lists checkpoints and source files, the centre shows Character 1's shirt part zoomed in with a dashed selection box, the right column lists all 17 slots with topwear selected, and the Feedback panel below shows one saved defect on slot topwear" width="1600" height="1000">
  <figcaption>Character 1's build from before the shoulder repair, open in <code>rig-review</code> 0.2.1: <code>topwear</code> soloed and zoomed, one defect saved against it, the review submitted as <em>changes requested</em>.</figcaption>
</figure>

<p class="mod-skip">Skip to <a href="#install">Install</a> · <a href="#inputs-and-outputs">Inputs and outputs</a> · <a href="#limits">Limits</a> · <a href="#go-deeper">Docs</a></p>

*This page follows Character 1 from the Family set: here it is looked at. Every module works on its own; this order is one path, not a requirement.*

The checks that keep a broken rig off the disk are structural: a shoulder that renders flat passes all of them. Someone has to look — and what they find has to reach whoever fixes it as something more precise than a screenshot. Review runs on your machine (`127.0.0.1` only), plays the build with the same `@rig-c/play` runtime a site would use, and records feedback bound to a frame range, a slot or bone, and the exact camera, without touching the files it was given.

## One problem, from seeing it to the fix

Character 1's shirt once had a flat, indented shoulder: an earlier preparation script had cut away cloth that the hair covers in the still and uncovers when it moves. The family suite records that repair in [its shoulder-repair note](https://github.com/rig-c/parts-examples/blob/main/family/roa/SHOULDER_REPAIR.md). Here it is replayed in Review on the build from before the repair.

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

Review also lines a build up against reference footage — side by side, synchronized cameras, frame strips — which is how a retargeted motion like the [Pose](/docs/pose/) page's wave gets judged against what it was meant to copy.

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
