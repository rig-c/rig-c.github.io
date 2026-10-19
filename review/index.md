# @rig-c/review (`rig-review`)

**A reusable local workspace for a person to inspect an agent's rig output, compare source references, and export structured feedback ready to become an issue.**

- **npm package**: `@rig-c/review`, latest `0.2.1`
- **CLI executable**: `rig-review`
- **Repository**: <https://github.com/rig-c/review>
- **License**: MIT

Instead of asking an AI agent to build a one-off viewer for every rig, `@rig-c/review` opens any existing output directory or curated `review.json` package, plays the compiled model through [`@rig-c/play`](/play/), aligns reference videos, contact sheets, and `rig-pose-report/1` diagnostic markers, and exports annotations bound to exact frames, bones, and slots.

**Motion is view, annotate, and export only.** Navigation changes inspection time; it never retimes, authors keys, or mutates `motion.json` or `rig.json`.

## Place in the Toolchain

[`@rig-c/parts`](/parts/) → [`@rig-c/pose`](/pose/) → [`rig-c (core)`](/core/) → **`@rig-c/review`** → [`@rig-c/play`](/play/) → [`@rig-c/adapters`](/adapters/)

## Install & Usage

Requires **Bun 1.3.0 or later** on `PATH`.

```sh
# Install beside the agent that produced the output
npm i -D @rig-c/review

# Open an output folder and print the loopback capability URL (127.0.0.1 only)
npx rig-review open /absolute/path/to/output

# Validate the delivery contract and model envelope
npx rig-review check /absolute/path/to/output
```

## Zero-Config Output Discovery

When pointed at an output folder without a `review.json` manifest, `rig-review` automatically discovers:
- Root `skeleton.model.json` or `build/skeleton.model.json` (root takes precedence)
- Root `motion.json`, `report.json` (`rig-pose-report/1`), and `skeleton.json` / `.skel` / `.atlas` evidence
- Source reference videos (`.mp4`, `.webm`, `.mov`)
- Contact sheets and strips (filenames containing `strip`, `contact`, `sheet`, `filmstrip`, or `띠`)
- Canonical `*pose*.json` sequences

When `report.json` carries `rig-pose-report/1` event markers (`HOLD`, `FOLD`, `FEET`, `SEAM`), `rig-review` exposes read-only event markers and prefills feedback coordinates with actual bone and slot names.
