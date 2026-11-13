---
navLabel: Create
title: "@rig-c/create: project direction, interview and signed plan"
description: Start a rig-c project with the user's direction, an interview and a signed plan, then record human decisions made in Review.
summaryForLlms: "@rig-c/create scaffolds a rig-c project, records the user's direction and interview, and keeps its signed plan and approvals. A project moves through eleven stages: interview → plan-approved → parts → parts-review → rigging-interview → rigging → rig-review → post-interview → post → direction-review → accepted, with human acts made in Review and recorded by create's writers."
packageName: "@rig-c/create"
repoUrl: https://github.com/rig-c/create
npmUrl: https://www.npmjs.com/package/@rig-c/create
---
# @rig-c/create

## Install

```sh
bunx rig-create init p1
```

Then ask it what to do:

```sh
bunx rig-create next p1
```

`next` lists what comes now: which decisions are yours to make in Review, and which commands are the agent's.

Or install the canonical package globally:

```sh
bun add -g @rig-c/create
rig-create init p1
```

Requires [Bun](https://bun.sh) 1.4.0 or newer and Git. Choose one route and a new or empty `p1` folder. `init` creates the project, installs its pinned rig-c dependencies and makes its first Git commit. If dependency installation fails, the project still exists; run `bun install` inside `p1` to recover. `init p1 --no-install` defers that installation.

<p class="mod-role">The project layer: the folder a rig is made in, the user's direction, the interview before rigging and the plan the user signs.</p>

<p class="mod-skip">Skip to <a href="#install">Install</a> · <a href="#inputs-and-outputs">Inputs and outputs</a> · <a href="#limits">Limits</a> · <a href="#go-deeper">Docs</a></p>

Create is where a rig starts. Before any rigging it interviews you about what the rig should do, turns your answers into a plan you sign, and then keeps the record of every decision after that: which parts you approved, how the rig should bend and move, and what you said when you saw the result. An agent does the work between your decisions. If you hand a decision to the agent, that is recorded as your choice too.

A project moves through eleven stages: **interview → plan-approved → parts → parts-review → rigging-interview → rigging → rig-review → post-interview → post → direction-review → accepted**. You make your decisions in [Review](/docs/review/), and create's writers record them.

## Inputs and outputs

| In | Out |
| --- | --- |
| A new or empty project folder | A project scaffold with pinned rig-c dependencies and a first Git commit |
| The user's direction, interview answers and explicit delegations | A recorded interview and a plan for the user to sign |
| Human acts made in Review | Approvals and feedback recorded by create's writers |
| A project ready for its next action | `rig-create next p1 --json` reports the available next actions |

## Limits

- **Create defines the project and its direction**: [Parts](/docs/parts/) cuts parts; [Core](/docs/core/) compiles and gates rigs.
- **A fresh interview is incomplete**: `rig-create interview --check p1 --json` exits nonzero until the stage's requirements are met. Follow the available next actions through Review rather than editing records by hand.
- **A sign-off does not move the stage**: `signoff` records the user's words and preserves existing answers and delegations.
- **Not in 1.0 yet: a 2.5D head turn.** The post interview can ask for one, but the direction format has no depth or turn fields, so nothing produces it yet.

## Go deeper

- [Install and start](https://github.com/rig-c/create#install-and-start)
- [Recording approvals](https://github.com/rig-c/create#recording-approvals)
- [docs/PROJECT.md](https://github.com/rig-c/create/blob/main/docs/PROJECT.md) — project folder, stages, sign-offs, plan and versions
- [docs/INTERVIEW.md](https://github.com/rig-c/create/blob/main/docs/INTERVIEW.md) — user steps, answer states, post-production and feedback
- [docs/CHECKS.md](https://github.com/rig-c/create/blob/main/docs/CHECKS.md) — interview refusal codes and how to clear them
- [npm](https://www.npmjs.com/package/@rig-c/create) · [Licence](https://github.com/rig-c/create/blob/main/LICENSE)

<!-- SOURCES (not published)
- Structure mirrored from content/docs/review.md: role, skip links, introduction, Install, Inputs and outputs, Limits, Go deeper. Install moved first for issue #140; no hero, historical case or historical character thread is claimed for Create.
- https://github.com/rig-c/create README supplied for issue #140: introduction — project layer, user direction, interview, signed plan; Parts cuts parts and Core compiles/gates rigs.
- README "Install and start" — bunx rig-create init p1 alias, bun add -g @rig-c/create, Bun >=1.4.0 and Git, new/empty folder, pinned dependency installation, initial commit, recovery, --no-install, interview check and next actions through Review.
- README "Why it exists" and "What it provides" — base motion, camera/timing after rig acceptance, feedback, explicit delegation, scaffold, direction/sign-offs/versions and installed-package guide.
- README "Recording approvals" — signoff records without moving the stage, preserves existing answers/delegations and keeps verbatim input.
- https://github.com/rig-c/rig-c.github.io/issues/140 — human acts in Review recorded by create's writers. Publication and alias confirmed by the parent for 1.0.1.
- https://github.com/rig-c/create/tree/cc94700fef82f177df1692a0236778454367e090 (v1.0.1): src/stages.ts:32-44 — eleven stages; src/next.ts:1485-1488 — next lists each move's role and command or act; templates/project.json:155-157 and src/direction.ts:93-114 — post interview asks about a 2.5D head turn, but the closed direction schema has camera boxes and timing, no depth/turn fields. This limit concerns Create's direction producer; README.md:73-76 keeps depth and turn in Parts.
- No universal sign-off guarantee is claimed: src/stage-progress.ts:134-148 permits post-interview → accepted when post is not passed; src/check.ts:433-436,733-738 exempts direction-review when every post item is not applicable. Legacy exceptions: src/check.ts:734-736,771-782 and src/stages.ts:146-148.
- README "Docs" and "Licence" — linked document subjects and MIT licence.
-->
