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
# Review

Review is the human inspection gate in the rig-c toolchain. A person opens an agent's rig output in one local workspace, checks it, and saves feedback that the agent can read back.

## What it is

`@rig-c/review` is a CLI, `rig-review`, that serves a browser workspace on `127.0.0.1`. It plays a compiled model through `@rig-c/play`, shows local image, video and pose-sequence references beside it, and records the person's review decision and feedback.

## When to use it

Use it after a [Core](/docs/core/) build, when a person needs to look at the result before it goes on. The agent does not have to build a new viewer for each rig.

Do not use it to fix the rig. Motion is view, annotate and export only: it never retimes, authors keys or writes `motion.json`. It does not edit meshes, weights or source art. It also does not replace Core's compiler gate; `check` validates the delivery contract and model envelope, not visual quality. To ship a rig into a game, use [Play](/docs/play/) or an [engine adapter](/docs/adapters/).

## What it solves

An agent can produce a rig, but a person has to judge it. Without a shared tool, that judgment ends up as loose notes that point at nothing exact. Review ties each piece of feedback to the exact bytes that were reviewed, and to a frame interval and a bone or slot target. The agent then retrieves it with one command. If the input changes, the old approval does not carry over.

## What you get

- A **review status**: `approved`, `changes-requested` or `pending`. Opening never approves.
- **Feedback** items with an inclusive frame interval, a bone/slot/rig target, a defect/quality category and a one-line summary.
- A `reviewedSource` record: package revision, viewer/runtime versions, and SHA-256 plus path for the reviewed rig and motion.
- JSON and issue-ready Markdown exports (`--format issue`).
- **Frame strip** exports as PNG or JSON, with a `.png.json` provenance sidecar.

## How it works

1. Install it beside the agent and run `open` on the output folder. It recognizes `skeleton.model.json` at the root or under `build/`, plus `motion.json`, `report.json`, source videos and pose sequences. It reads them without changing them.
2. `open` hashes the folder, starts or reuses a background loopback instance, prints its URL and exits. It never opens a browser and binds only `127.0.0.1`.
3. The person inspects playback, parts and references, then explicitly saves a status and feedback. Feedback is stored under `~/.local/state/rig-c-review/`, outside the delivered files.
4. The agent runs `feedback` on the same folder to read the session JSON. Changed content starts a fresh pending session.
5. Optionally, `compare` seeks two outputs against one reference video with a single playhead.

```sh
npm i -D @rig-c/review
npx rig-review open /absolute/path/to/output
```

It runs under Bun 1.3.0 or later. The CLI is the supported surface; no importable API is promised.

## Key concepts

- **Output folder**: an existing agent output opened as-is, with no manifest required.
- **`review.json`**: an optional curated manifest with named checkpoints, references and angle axes.
- **Checkpoint**: a named inspection point in a curated package, with its own outcome and notes.
- **Producer clock**: `fps` plus `frame0`, or exact `frameTimes[]`, declared in the report. Without it the UI shows `rate unknown`.
- **Reference binding**: the name and byte hash of a selected external video, bound into sessions and exports.
- **Write capability**: a per-instance secret carried in the URL's `#cap=` fragment. A link without it opens read-only.

## Go deeper

- [README: Start](https://github.com/rig-c/review#start)
- [README: Feedback ownership](https://github.com/rig-c/review#feedback-ownership)
- [README: Compare two outputs](https://github.com/rig-c/review#compare-two-outputs)
- [README: Frame strip export](https://github.com/rig-c/review#frame-strip-export)
- [README: Managed front and write capability](https://github.com/rig-c/review#managed-front-and-write-capability)
- [README: Control the current inspection page](https://github.com/rig-c/review#control-the-current-inspection-page)
- [docs/REVIEW_PACKAGE.md](https://github.com/rig-c/review/blob/main/docs/REVIEW_PACKAGE.md) (package format and HTTP contract)
- [docs/DESIGN.md](https://github.com/rig-c/review/blob/main/docs/DESIGN.md) (product boundary and direction)
- [CHANGELOG](https://github.com/rig-c/review/blob/main/CHANGELOG.md)
- [npm: @rig-c/review](https://www.npmjs.com/package/@rig-c/review)

<!-- SOURCES (not published)
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
