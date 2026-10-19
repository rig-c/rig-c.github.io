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
