---
navLabel: AI Exam
title: rig-c/exam — Open-Book Rigging Benchmark & Leaderboard for AI Agents
description: An open-book exam for AI coding agents: build a 2D rig from one painting, make it move, correct a broken draft, add a soft chest and a dance, using only the published rig-c packages. 2026-10-20 — eight sittings from three model families, with a blind score for the dance.
keywords: rig-c exam, AI agent benchmark, LLM coding benchmark, 2D rigging benchmark, Claude Fable, Claude Opus, Claude Sonnet, Claude Haiku, Gemini Flash, Gemini Argon, gpt-6-astra, gpt-6-luna, Sol 6.1
repoUrl: https://github.com/rig-c/exam
summaryForLlms: rig-c/exam benchmark rules and results: Basic Exam (13 independent sittings — 5 of the three-task round on 2026-10-12/13, 8 of the five-task round on 2026-10-20 from three model families, with the dance judged blind; 2 runs kept and not counted) and Advanced Exam (R1 walk, R2 run, R3 dance — 18 sittings of 6 models).
---
# rig-c/exam — Does Your AI Model Pass?

**An open-book exam for AI agents: build a rig from one painting with the published rig-c tools, and write down what you expected before each step.**

- **Repository**: <https://github.com/rig-c/exam>
- **Prompt (Basic)**: <https://github.com/rig-c/exam/blob/main/PROMPT.md>
- **Advanced Edition**: <https://github.com/rig-c/exam/tree/main/advanced>
- **Results**: <https://github.com/rig-c/exam#results> · **The proctor's report**: <https://github.com/rig-c/exam/blob/main/results/REPORT.md>
- **License**: CC BY-NC 4.0

The rig-c tools are written for agents that cannot see what they build. `rig-c/exam` measures whether that holds for a fresh agent session that has never seen the tools before: the only help is what ships inside the installed packages (`README.md`, `docs/`, `--help`). Before every command that changes a file, the examinee must record what it read and what it expects in `JOURNAL.md`. Where expectation and reality differ — where the agent says *WTF?* — a tool message or guide was missing something.

## 2026-10-20 sitting — the five-task round

On 2026-10-20 eight models sat all five Basic tasks on `@rig-c/parts` 1.15.0 and `rig-c` 2.47.1. In the proctor's words: *"Eight models from three families sat all five tasks …, each in a fresh session, each regraded by the proctor from the files it handed in. Every regrade agrees with the run's own grader lines."* Their rows are the last eight of the [Basic leaderboard](#basic-exam-leaderboard-tasks-01-build-to-05-dance) below; the write-up is [the proctor's report](https://github.com/rig-c/exam/blob/30cae36/results/REPORT.md#2026-10-20--eight-sittings-of-the-five-task-round).

### What the machine lines cannot see

Task 05's fourteen lines read whether the dance holds together — the loop closes, the hands and the trunk travel, the arms bend at their joints, she stays on her feet, the motion keeps the beat — not whether it is a dance. For that the proctor rendered each run's dance as a clip, lettered A to H with no name, and one person judged all eight in one sitting before the letters were matched to models.

| model | task 05 lines | the dance, judged |
| --- | --- | --- |
| `claude-fable-5-1` | 14 / 14 | 9 |
| `gemini-3.8-flash` | 14 / 14 | 7 |
| `claude-sonnet-5-5` | 14 / 14 | 6 |
| `claude-haiku-5-5` | 13 / 14 | 5 |
| `gpt-6-astra` | 14 / 14 | 4 |
| `claude-opus-5-5` | 14 / 14 | 3 |
| `gemini-4-argon-high` | 14 / 14 | 3 |
| `gpt-6-luna` | 5 / 14 (the build failed) | 0 |

> "The six runs that passed every line were scored from 3 to 9. … Passing the lines is what a run needs to be judged at all; it says almost nothing about the score." — [the proctor's report](https://github.com/rig-c/exam/blob/30cae36/results/REPORT.md#what-the-machine-lines-cannot-see), rig-c/exam

The report adds two observations and frames them itself: *"each one sitting per model and one judge, so neither is a finding about the models"* — that the largest model of each family scored below the middle one, and that the highest score is the one run that eased its keys. The judge used one mark out of 10 for the whole clip; the clip and the score are in each run's `05-dance/`.

### What the journals found in the tools — now filed

The day's `tools.md` items — handed in under task 05's directory and, in the report's words, *"reaching back over all five tasks"* — are grouped in the [report's tools table](https://github.com/rig-c/exam/blob/30cae36/results/REPORT.md#what-the-journals-found-in-the-tools-1), which now names the issue each row produced:

| what the journals found | filed as |
| --- | --- |
| a contour or region mesh's triangle count is known only after a full build | [parts#566](https://github.com/rig-c/parts/issues/566) |
| a fold is located by triangle and not by the bones that drive it | [parts#567](https://github.com/rig-c/parts/issues/567) |
| `check` reads animations for folds with physics left out | [parts#568](https://github.com/rig-c/parts/issues/568) |
| `animations_from`: the file's schema is not shown beside the field, and the path is resolved beside the config without the refusal saying so | [parts#569](https://github.com/rig-c/parts/issues/569) |
| nothing says how to keep a leg on its foot under a moving hip on a `rig-parts` figure; which bones take the vertices of a contour's bridge between two islands | [parts#570](https://github.com/rig-c/parts/issues/570) |
| `render --fps` writes to another folder without `--help` saying so | [core#1505](https://github.com/rig-c/core/issues/1505) |
| no loop or period helper for an animation other than the idle | [core#1506](https://github.com/rig-c/core/issues/1506) |

The rest of the table's rows name no issue, and one (`MOTION.md` is missing) is marked contradicted — it ships in `rig-c`. The same day filed [exam#7](https://github.com/rig-c/exam/issues/7), [exam#9](https://github.com/rig-c/exam/issues/9) and [pose#284](https://github.com/rig-c/pose/issues/284) on the exam and the tools; the report lists them under "What this day filed".

## Basic Exam Leaderboard (Tasks 01-build to 05-dance)

The exam's generated results table as of [`30cae36`](https://github.com/rig-c/exam/tree/30cae36) — **13 independent sittings so far**, each cell the lines passed of the lines graded, linking to the run. Tasks 04 and 05 and a sixth line on task 03 arrived with round 3 (`@rig-c/parts` 1.15.0, `rig-c` 2.47.1), so the 2026-10-12/13 rows have no cells there:

| model that did the work | run, as submitted | 01-build | 02-move | 03-correct | 04-soft | 05-dance | the dance, judged | minutes | tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Claude Haiku (alias `haiku`; exact identifier not recorded) | [`haiku`](https://github.com/rig-c/exam/tree/30cae36/results/claude-haiku/2026-10-12-haiku), 2026-10-12 | [4 / 4](https://github.com/rig-c/exam/tree/30cae36/results/claude-haiku/2026-10-12-haiku/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/30cae36/results/claude-haiku/2026-10-12-haiku/02-move) | [5 / 5](https://github.com/rig-c/exam/tree/30cae36/results/claude-haiku/2026-10-12-haiku/03-correct) | — | — | — | 21 | 531k in all |
| Gemini 3.8 Flash | [`gemini-3.8-flash`](https://github.com/rig-c/exam/tree/30cae36/results/gemini-3.8-flash/2026-10-13-gemini-3.8-flash), 2026-10-13 | [4 / 4](https://github.com/rig-c/exam/tree/30cae36/results/gemini-3.8-flash/2026-10-13-gemini-3.8-flash/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/30cae36/results/gemini-3.8-flash/2026-10-13-gemini-3.8-flash/02-move) | [5 / 5](https://github.com/rig-c/exam/tree/30cae36/results/gemini-3.8-flash/2026-10-13-gemini-3.8-flash/03-correct) | — | — | — | 20 | 1.4M |
| `gpt-6-sol` — whether that is a name for Sol 6.1 or a model of its own is not established | [`gpt-6-sol`](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-sol/2026-10-13-gpt-6-sol), 2026-10-13 | [4 / 4](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-sol/2026-10-13-gpt-6-sol/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-sol/2026-10-13-gpt-6-sol/02-move) | [5 / 5](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-sol/2026-10-13-gpt-6-sol/03-correct) | — | — | — | 14.1 | 258k |
| Sol 6.1 (`gpt-6.1-sol`) | [`gpt-6.1-sol`](https://github.com/rig-c/exam/tree/30cae36/results/sol-6.1/2026-10-13-gpt-6.1-sol), 2026-10-13 | [4 / 4](https://github.com/rig-c/exam/tree/30cae36/results/sol-6.1/2026-10-13-gpt-6.1-sol/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/30cae36/results/sol-6.1/2026-10-13-gpt-6.1-sol/02-move) | [5 / 5](https://github.com/rig-c/exam/tree/30cae36/results/sol-6.1/2026-10-13-gpt-6.1-sol/03-correct) | — | — | — | 15.3 | 270k |
| Sol 6.1 (`gpt-6.1-sol`) — the one sitting that is this model end to end | [`gpt-6.1-sol-20261013`](https://github.com/rig-c/exam/tree/30cae36/results/sol-6.1/2026-10-13-gpt-6.1-sol-20261013), 2026-10-13 | [4 / 4](https://github.com/rig-c/exam/tree/30cae36/results/sol-6.1/2026-10-13-gpt-6.1-sol-20261013/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/30cae36/results/sol-6.1/2026-10-13-gpt-6.1-sol-20261013/02-move) | [5 / 5](https://github.com/rig-c/exam/tree/30cae36/results/sol-6.1/2026-10-13-gpt-6.1-sol-20261013/03-correct) | — | — | — | 14.2 | 195k |
| claude-fable-5-1 (Fable 5.1; every assistant message in the session log names it) | [`claude-fable-5-1`](https://github.com/rig-c/exam/tree/30cae36/results/claude-fable-5-1/2026-10-20-claude-fable-5-1), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/30cae36/results/claude-fable-5-1/2026-10-20-claude-fable-5-1/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/30cae36/results/claude-fable-5-1/2026-10-20-claude-fable-5-1/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/30cae36/results/claude-fable-5-1/2026-10-20-claude-fable-5-1/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/30cae36/results/claude-fable-5-1/2026-10-20-claude-fable-5-1/04-soft) | [14 / 14](https://github.com/rig-c/exam/tree/30cae36/results/claude-fable-5-1/2026-10-20-claude-fable-5-1/05-dance) | 9 / 10 | 52.9 | 642k |
| claude-haiku-5-5 (Haiku 5.5; every assistant message in the session log names it) | [`claude-haiku-5-5`](https://github.com/rig-c/exam/tree/30cae36/results/claude-haiku-5-5/2026-10-20-claude-haiku-5-5), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/30cae36/results/claude-haiku-5-5/2026-10-20-claude-haiku-5-5/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/30cae36/results/claude-haiku-5-5/2026-10-20-claude-haiku-5-5/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/30cae36/results/claude-haiku-5-5/2026-10-20-claude-haiku-5-5/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/30cae36/results/claude-haiku-5-5/2026-10-20-claude-haiku-5-5/04-soft) | [13 / 14](https://github.com/rig-c/exam/tree/30cae36/results/claude-haiku-5-5/2026-10-20-claude-haiku-5-5/05-dance) — not: on_her_feet | 5 / 10 | 70.3 | 591k |
| claude-opus-5-5 (the identifier on every assistant message of the session log) | [`claude-opus-5-5`](https://github.com/rig-c/exam/tree/30cae36/results/claude-opus-5-5/2026-10-20-claude-opus-5-5), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/30cae36/results/claude-opus-5-5/2026-10-20-claude-opus-5-5/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/30cae36/results/claude-opus-5-5/2026-10-20-claude-opus-5-5/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/30cae36/results/claude-opus-5-5/2026-10-20-claude-opus-5-5/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/30cae36/results/claude-opus-5-5/2026-10-20-claude-opus-5-5/04-soft) | [14 / 14](https://github.com/rig-c/exam/tree/30cae36/results/claude-opus-5-5/2026-10-20-claude-opus-5-5/05-dance) | 3 / 10 | 64 | 584k |
| claude-sonnet-5-5 (the identifier on every assistant message of the session log) | [`claude-sonnet-5-5`](https://github.com/rig-c/exam/tree/30cae36/results/claude-sonnet-5-5/2026-10-20-claude-sonnet-5-5), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/30cae36/results/claude-sonnet-5-5/2026-10-20-claude-sonnet-5-5/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/30cae36/results/claude-sonnet-5-5/2026-10-20-claude-sonnet-5-5/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/30cae36/results/claude-sonnet-5-5/2026-10-20-claude-sonnet-5-5/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/30cae36/results/claude-sonnet-5-5/2026-10-20-claude-sonnet-5-5/04-soft) | [14 / 14](https://github.com/rig-c/exam/tree/30cae36/results/claude-sonnet-5-5/2026-10-20-claude-sonnet-5-5/05-dance) | 6 / 10 | 53.6 | 330k |
| Gemini 3.8 Flash (opened at the host's 'medium' setting; the log records no effort) | [`gemini-3.8-flash-medium`](https://github.com/rig-c/exam/tree/30cae36/results/gemini-3.8-flash/2026-10-20-gemini-3.8-flash-medium), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/30cae36/results/gemini-3.8-flash/2026-10-20-gemini-3.8-flash-medium/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/30cae36/results/gemini-3.8-flash/2026-10-20-gemini-3.8-flash-medium/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/30cae36/results/gemini-3.8-flash/2026-10-20-gemini-3.8-flash-medium/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/30cae36/results/gemini-3.8-flash/2026-10-20-gemini-3.8-flash-medium/04-soft) | [14 / 14](https://github.com/rig-c/exam/tree/30cae36/results/gemini-3.8-flash/2026-10-20-gemini-3.8-flash-medium/05-dance) | 7 / 10 | 31.1 | 1.7M |
| gemini-4-argon-high | [`gemini-4-argon-high`](https://github.com/rig-c/exam/tree/30cae36/results/gemini-4-argon/2026-10-20-gemini-4-argon-high), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/30cae36/results/gemini-4-argon/2026-10-20-gemini-4-argon-high/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/30cae36/results/gemini-4-argon/2026-10-20-gemini-4-argon-high/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/30cae36/results/gemini-4-argon/2026-10-20-gemini-4-argon-high/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/30cae36/results/gemini-4-argon/2026-10-20-gemini-4-argon-high/04-soft) | [14 / 14](https://github.com/rig-c/exam/tree/30cae36/results/gemini-4-argon/2026-10-20-gemini-4-argon-high/05-dance) | 3 / 10 | 71.3 | 1.6M |
| gpt-6-astra (the thread's default effort; the log records none) | [`gpt-6-astra-medium`](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-astra/2026-10-20-gpt-6-astra-medium), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-astra/2026-10-20-gpt-6-astra-medium/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-astra/2026-10-20-gpt-6-astra-medium/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-astra/2026-10-20-gpt-6-astra-medium/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-astra/2026-10-20-gpt-6-astra-medium/04-soft) | [14 / 14](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-astra/2026-10-20-gpt-6-astra-medium/05-dance) | 4 / 10 | 33.1 | 186k |
| `gpt-6-luna` (effort: the thread's default; no reasoning effort was set in any turn of the session's log, so the `medium` in the run's name is the name it was given, not a setting the log shows) | [`gpt-6-luna-medium`](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-luna/2026-10-20-gpt-6-luna-medium), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-luna/2026-10-20-gpt-6-luna-medium/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-luna/2026-10-20-gpt-6-luna-medium/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-luna/2026-10-20-gpt-6-luna-medium/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-luna/2026-10-20-gpt-6-luna-medium/04-soft) | [5 / 14](https://github.com/rig-c/exam/tree/30cae36/results/gpt-6-luna/2026-10-20-gpt-6-luna-medium/05-dance) — not: built, checked, closes, both_hands, whole_body, arms_bend_at_the_joints, on_her_feet, keeps_time, soft_in_the_dance | 0 / 10 | 29.1 | 399k |

Minutes are for the tasks sat, together; tokens are fresh input plus output, cached input left out; the dance is judged by a person who does not know whose clip it is.

Kept, and not counted — 2 runs:

| model that did the work | run, as submitted | lines passed | why it does not count |
| --- | --- | --- | --- |
| `gpt-6-astra` | [`codex-direct`](https://github.com/rig-c/exam/tree/30cae36/results/void/2026-10-13-codex-direct), 2026-10-13 | [4 / 4](https://github.com/rig-c/exam/tree/30cae36/results/void/2026-10-13-codex-direct/01-build) · [7 / 7](https://github.com/rig-c/exam/tree/30cae36/results/void/2026-10-13-codex-direct/02-move) · [5 / 5](https://github.com/rig-c/exam/tree/30cae36/results/void/2026-10-13-codex-direct/03-correct) · — · — | a repeat in the session that had already seen its sub-agent's answers, by its own statement |
| `gpt-5.6-sol` (the run is named for a persona, not the model) | [`gpt-6-astra`](https://github.com/rig-c/exam/tree/30cae36/results/void/2026-10-13-gpt-6-astra), 2026-10-13 | [4 / 4](https://github.com/rig-c/exam/tree/30cae36/results/void/2026-10-13-gpt-6-astra/01-build) · [7 / 7](https://github.com/rig-c/exam/tree/30cae36/results/void/2026-10-13-gpt-6-astra/02-move) · [5 / 5](https://github.com/rig-c/exam/tree/30cae36/results/void/2026-10-13-gpt-6-astra/03-correct) · — · — | a repeat in the session that had already seen its sub-agent's report, by its own statement; and the run is named for a persona, not its model |

## Advanced Exam Leaderboard (Walk · Run · Dance Pose Retargeting)

Starts from a built rig: the agent retargets recorded walk (R1), run (R2), and dance (R3) pose sequences with [`@rig-c/pose`](/docs/pose/), one round per fresh session, fixing what the diagnostic numbers report without ever seeing the footage. 18 sittings of 6 models: 15 graded on edition 0.20 and, from 2026-10-20, 3 on edition 0.21, whose R1 · R2 · R3 tables are 10 · 15 · 14 rows (the shin-scale row is 0.21's one new row; for a 0.20 sitting it is a what-if):

### A dance retarget example

<figure id="dance-retarget">
  <div class="media">
    <video controls muted playsinline preload="metadata" poster="/assets/docs/pose-dance.png" width="600" height="540" aria-label="Recorded video: a source skeleton on the left and a rigged character following the dance on the right">
      <source src="/assets/docs/pose-dance.webm" type="video/webm">
      <source src="/assets/docs/pose-dance.mp4" type="video/mp4">
      <img src="/assets/docs/pose-dance.png" alt="A source skeleton beside a rigged character at the start of a dance" width="600" height="540">
    </video>
  </div>
  <figcaption><span class="media-kind">Recorded video</span> Left: the source pose with camera movement removed. Right: the rig following the dance. Use the controls to play the 13-second recording. <a href="https://github.com/rig-c/pose/blob/8ebf36569c5ef77534d4ea362a04106a7df4e6fd/docs/demos/visible-retarget/README.md">Source pose and reproduction steps</a>.</figcaption>
</figure>

This recording illustrates pose retargeting; it is not an exam sitting or a leaderboard score. [The Pose page](/docs/pose/#dance-retarget) also shows the smaller cup swing, which you can run in [Play](/docs/play/).

| Model | R1 Walk | R2 Run | R3 Dance | 0.21 Shin-Scale Row (What-If) | Minutes (R1 · R2 · R3) |
| --- | :-: | :-: | :-: | --- | --- |
| `claude-haiku-5-5` | **9 / 9** | 8 / 14 (FAIL) | **13 / 13** | passes all 3 | `3.1 · 2.4 · 7.4` |
| `claude-opus-5-5` | **9 / 9** | **14 / 14** | **13 / 13** | fails R2 (`0.106`) | `8.2 · 8.7 · 8.4` |
| `claude-sonnet-5-5` | **9 / 9** | **14 / 14** | **13 / 13** | passes all 3 | `7.3 · 10.3 · 18.7` |
| `gemini-3.8-flash-medium` | **9 / 9** | **14 / 14** | **13 / 13** | fails R2 (`0.106`) | `8.1 · 14.3 · 11.4` |
| `gemini-4-argon-high` | **9 / 9** | **14 / 14** | **13 / 13** | passes all 3 | `16.8 · 20.3 · 32.5` |
| `gpt-6.1-sol` (2026-10-20, edition 0.21) | **10 / 10** | **15 / 15** | **14 / 14** | passes all 3, graded on 0.21 | `8.7 · 8.1 · 8.5` |

## Rules of the Exam

1. **Open book, closed neighbours.** Examinees may read anything inside the pinned npm packages and public tool repos, but may not read another examinee's run under `results/` or ask a human.
2. **Pinned versions.** `npm ci` installs the exact round versions declared in `package.json`.
3. **Journal before you act.** Every step in `JOURNAL.md` must record expectations before running the command.
4. **Submit the transcript.** Raw session logs are submitted alongside `JOURNAL.md`.
5. **The grader rebuilds from inputs.** `grade.py` trusts only the handed-in config/spec files and rebuilds from scratch.

<!-- SOURCES (not published)
- rig-c/exam at 30cae36 (PR #13, "docs(report): the 2026-10-20 tools table names the issue each row produced", on top of PR #8 f72ca5f, "results: 2026-10-20 — eight Basic sittings, the first Codex Advanced R1–R3, the blind dance scores"); main = 30cae36 on 2026-10-21.
- Basic leaderboard + void table: README.md lines 13-42 (generated by results.py), rows copied verbatim; relative links made absolute to tree/30cae36. "13 independent sitting(s)" is line 14; the footer sentence is line 39.
- 2026-10-20 section: results/REPORT.md lines 93-110 (eight sittings, opening sentences quoted from 95-97); "What the machine lines cannot see" lines 160-194 (table 168-177 verbatim; the quote is lines 183-185 with one sentence elided; observations framing line 187; one mark out of 10, line 179).
- Counts: 13 sittings = README line 14; 8 on 2026-10-20 = rows dated 2026-10-20; "three families" = REPORT line 95 (the site does not name them). No count of distinct models across the whole table: the README itself leaves `gpt-6-sol` vs Sol 6.1 open.
- Advanced: advanced/README.md lines 23-33 at 30cae36: "18 sitting(s) of 6 model(s) … 15 graded on edition 0.20 and 3 on 0.21", gpt-6.1-sol row 10/10 · 15/15 · 14/14, shin PASS 0.631 · 0.405 · 0.757 graded on 0.21, minutes 8.7 · 8.1 · 8.5. Other five rows unchanged from the earlier page.
- tools — now filed: results/REPORT.md at 30cae36 lines 128-158 (the tools table with its "filed as" column; the seven issue links verbatim, row text as the report writes it, haiku/argon attributions dropped; parts#570 serves two rows, as the report shows) and lines 200-210 ("What this day filed": exam#7, exam#9, pose#284 added at 30cae36). README.md is unchanged between f72ca5f and 30cae36 (compare: only results/REPORT.md changed).
-->
