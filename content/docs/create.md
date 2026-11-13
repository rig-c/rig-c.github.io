---
navLabel: Create
title: "@rig-c/create: project direction, interview and signed plan"
description: Start a rig-c project with the user's direction, an interview and a signed plan, then record human decisions made in Review.
summaryForLlms: "@rig-c/create scaffolds a rig-c project, records the user's direction and interview, and keeps its signed plan and approvals. The first cycle covers interview, plan, parts, rigging interview, rig, post, direction-review and accepted, with human acts made in Review and recorded by create's writers."
packageName: "@rig-c/create"
repoUrl: https://github.com/rig-c/create
npmUrl: https://www.npmjs.com/package/@rig-c/create
---
# @rig-c/create

## Install

```sh
bunx rig-create init p1
```

Or install the canonical package globally:

```sh
bun add -g @rig-c/create
rig-create init p1
```

Requires [Bun](https://bun.sh) 1.4.0 or newer and Git. Choose one route and a new or empty `p1` folder. `init` creates the project, installs its pinned rig-c dependencies and makes its first Git commit. If dependency installation fails, the project still exists; run `bun install` inside `p1` to recover. `init p1 --no-install` defers that installation.

<p class="mod-role">The project layer: the folder a rig is made in, the user's direction, the interview before rigging and the plan the user signs.</p>

<p class="mod-skip">Skip to <a href="#install">Install</a> · <a href="#inputs-and-outputs">Inputs and outputs</a> · <a href="#limits">Limits</a> · <a href="#go-deeper">Docs</a></p>

Create keeps what the rig is meant to do before an agent starts work: the cut, the bones, what deforms, physics and motion; then camera and timing after the rig is accepted, and the user's feedback after seeing a result. An explicit delegation is recorded as the user's choice. The agent's guide points at the installed packages' own documentation.

The first cycle moves through **interview → plan → parts → rigging interview → rig → post → direction-review → accepted**. Human acts are made in [Review](/docs/review/) and recorded by create's writers. The project keeps the direction, sign-offs and versions together.

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
- https://github.com/rig-c/rig-c.github.io/issues/140 — first-cycle scope: interview → plan → parts → rigging interview → rig → post → direction-review → accepted; human acts in Review recorded by create's writers. Publication and alias confirmed by the parent for 1.0.1.
- README "Docs" and "Licence" — linked document subjects and MIT licence.
-->
