# rig-c/exam — Does Your AI Model Pass?

**An open-book exam for AI agents: build a rig from one painting with the published rig-c tools, and write down what you expected before each step.**

- **Repository**: <https://github.com/rig-c/exam>
- **Prompt (Basic)**: <https://github.com/rig-c/exam/blob/main/PROMPT.md>
- **Advanced Edition**: <https://github.com/rig-c/exam/tree/main/advanced>
- **Results**: <https://github.com/rig-c/exam#results> · **The proctor's report**: <https://github.com/rig-c/exam/blob/main/results/REPORT.md>
- **License**: CC BY-NC 4.0

The rig-c tools are written for agents that cannot see what they build. `rig-c/exam` measures whether that holds for a fresh agent session that has never seen the tools before: the only help is what ships inside the installed packages (`README.md`, `docs/`, `--help`). Before every command that changes a file, the examinee must record what it read and what it expects in `JOURNAL.md`. Where expectation and reality differ — where the agent says *WTF?* — a tool message or guide was missing something.

## 2026-10-20 sitting — the five-task round

On 2026-10-20 eight models sat all five Basic tasks on `@rig-c/parts` 1.15.0 and `rig-c` 2.47.1. In the proctor's words: *"Eight models from three families sat all five tasks …, each in a fresh session, each regraded by the proctor from the files it handed in. Every regrade agrees with the run's own grader lines."* Their rows are the last eight of the [Basic leaderboard](#basic-exam-leaderboard-tasks-01-build-to-05-dance) below; the write-up is [the proctor's report](https://github.com/rig-c/exam/blob/f72ca5f/results/REPORT.md#2026-10-20--eight-sittings-of-the-five-task-round).

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

> "The six runs that passed every line were scored from 3 to 9. … Passing the lines is what a run needs to be judged at all; it says almost nothing about the score." — [the proctor's report](https://github.com/rig-c/exam/blob/f72ca5f/results/REPORT.md#what-the-machine-lines-cannot-see), rig-c/exam

The report adds two observations and frames them itself: *"each one sitting per model and one judge, so neither is a finding about the models"* — that the largest model of each family scored below the middle one, and that the highest score is the one run that eased its keys. The judge used one mark out of 10 for the whole clip; the clip and the score are in each run's `05-dance/`.

## Basic Exam Leaderboard (Tasks 01-build to 05-dance)

The exam's generated results table as of [`f72ca5f`](https://github.com/rig-c/exam/tree/f72ca5f) — **13 independent sittings so far**, each cell the lines passed of the lines graded, linking to the run. Tasks 04 and 05 and a sixth line on task 03 arrived with round 3 (`@rig-c/parts` 1.15.0, `rig-c` 2.47.1), so the 2026-10-12/13 rows have no cells there:

| model that did the work | run, as submitted | 01-build | 02-move | 03-correct | 04-soft | 05-dance | the dance, judged | minutes | tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Claude Haiku (alias `haiku`; exact identifier not recorded) | [`haiku`](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-haiku/2026-10-12-haiku), 2026-10-12 | [4 / 4](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-haiku/2026-10-12-haiku/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-haiku/2026-10-12-haiku/02-move) | [5 / 5](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-haiku/2026-10-12-haiku/03-correct) | — | — | — | 21 | 531k in all |
| Gemini 3.8 Flash | [`gemini-3.8-flash`](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-3.8-flash/2026-10-13-gemini-3.8-flash), 2026-10-13 | [4 / 4](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-3.8-flash/2026-10-13-gemini-3.8-flash/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-3.8-flash/2026-10-13-gemini-3.8-flash/02-move) | [5 / 5](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-3.8-flash/2026-10-13-gemini-3.8-flash/03-correct) | — | — | — | 20 | 1.4M |
| `gpt-6-sol` — whether that is a name for Sol 6.1 or a model of its own is not established | [`gpt-6-sol`](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-sol/2026-10-13-gpt-6-sol), 2026-10-13 | [4 / 4](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-sol/2026-10-13-gpt-6-sol/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-sol/2026-10-13-gpt-6-sol/02-move) | [5 / 5](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-sol/2026-10-13-gpt-6-sol/03-correct) | — | — | — | 14.1 | 258k |
| Sol 6.1 (`gpt-6.1-sol`) | [`gpt-6.1-sol`](https://github.com/rig-c/exam/tree/f72ca5f/results/sol-6.1/2026-10-13-gpt-6.1-sol), 2026-10-13 | [4 / 4](https://github.com/rig-c/exam/tree/f72ca5f/results/sol-6.1/2026-10-13-gpt-6.1-sol/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/f72ca5f/results/sol-6.1/2026-10-13-gpt-6.1-sol/02-move) | [5 / 5](https://github.com/rig-c/exam/tree/f72ca5f/results/sol-6.1/2026-10-13-gpt-6.1-sol/03-correct) | — | — | — | 15.3 | 270k |
| Sol 6.1 (`gpt-6.1-sol`) — the one sitting that is this model end to end | [`gpt-6.1-sol-20261013`](https://github.com/rig-c/exam/tree/f72ca5f/results/sol-6.1/2026-10-13-gpt-6.1-sol-20261013), 2026-10-13 | [4 / 4](https://github.com/rig-c/exam/tree/f72ca5f/results/sol-6.1/2026-10-13-gpt-6.1-sol-20261013/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/f72ca5f/results/sol-6.1/2026-10-13-gpt-6.1-sol-20261013/02-move) | [5 / 5](https://github.com/rig-c/exam/tree/f72ca5f/results/sol-6.1/2026-10-13-gpt-6.1-sol-20261013/03-correct) | — | — | — | 14.2 | 195k |
| claude-fable-5-1 (Fable 5.1; every assistant message in the session log names it) | [`claude-fable-5-1`](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-fable-5-1/2026-10-20-claude-fable-5-1), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-fable-5-1/2026-10-20-claude-fable-5-1/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-fable-5-1/2026-10-20-claude-fable-5-1/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-fable-5-1/2026-10-20-claude-fable-5-1/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-fable-5-1/2026-10-20-claude-fable-5-1/04-soft) | [14 / 14](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-fable-5-1/2026-10-20-claude-fable-5-1/05-dance) | 9 / 10 | 52.9 | 642k |
| claude-haiku-5-5 (Haiku 5.5; every assistant message in the session log names it) | [`claude-haiku-5-5`](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-haiku-5-5/2026-10-20-claude-haiku-5-5), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-haiku-5-5/2026-10-20-claude-haiku-5-5/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-haiku-5-5/2026-10-20-claude-haiku-5-5/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-haiku-5-5/2026-10-20-claude-haiku-5-5/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-haiku-5-5/2026-10-20-claude-haiku-5-5/04-soft) | [13 / 14](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-haiku-5-5/2026-10-20-claude-haiku-5-5/05-dance) — not: on_her_feet | 5 / 10 | 70.3 | 591k |
| claude-opus-5-5 (the identifier on every assistant message of the session log) | [`claude-opus-5-5`](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-opus-5-5/2026-10-20-claude-opus-5-5), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-opus-5-5/2026-10-20-claude-opus-5-5/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-opus-5-5/2026-10-20-claude-opus-5-5/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-opus-5-5/2026-10-20-claude-opus-5-5/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-opus-5-5/2026-10-20-claude-opus-5-5/04-soft) | [14 / 14](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-opus-5-5/2026-10-20-claude-opus-5-5/05-dance) | 3 / 10 | 64 | 584k |
| claude-sonnet-5-5 (the identifier on every assistant message of the session log) | [`claude-sonnet-5-5`](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-sonnet-5-5/2026-10-20-claude-sonnet-5-5), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-sonnet-5-5/2026-10-20-claude-sonnet-5-5/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-sonnet-5-5/2026-10-20-claude-sonnet-5-5/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-sonnet-5-5/2026-10-20-claude-sonnet-5-5/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-sonnet-5-5/2026-10-20-claude-sonnet-5-5/04-soft) | [14 / 14](https://github.com/rig-c/exam/tree/f72ca5f/results/claude-sonnet-5-5/2026-10-20-claude-sonnet-5-5/05-dance) | 6 / 10 | 53.6 | 330k |
| Gemini 3.8 Flash (opened at the host's 'medium' setting; the log records no effort) | [`gemini-3.8-flash-medium`](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-3.8-flash/2026-10-20-gemini-3.8-flash-medium), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-3.8-flash/2026-10-20-gemini-3.8-flash-medium/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-3.8-flash/2026-10-20-gemini-3.8-flash-medium/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-3.8-flash/2026-10-20-gemini-3.8-flash-medium/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-3.8-flash/2026-10-20-gemini-3.8-flash-medium/04-soft) | [14 / 14](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-3.8-flash/2026-10-20-gemini-3.8-flash-medium/05-dance) | 7 / 10 | 31.1 | 1.7M |
| gemini-4-argon-high | [`gemini-4-argon-high`](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-4-argon/2026-10-20-gemini-4-argon-high), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-4-argon/2026-10-20-gemini-4-argon-high/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-4-argon/2026-10-20-gemini-4-argon-high/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-4-argon/2026-10-20-gemini-4-argon-high/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-4-argon/2026-10-20-gemini-4-argon-high/04-soft) | [14 / 14](https://github.com/rig-c/exam/tree/f72ca5f/results/gemini-4-argon/2026-10-20-gemini-4-argon-high/05-dance) | 3 / 10 | 71.3 | 1.6M |
| gpt-6-astra (the thread's default effort; the log records none) | [`gpt-6-astra-medium`](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-astra/2026-10-20-gpt-6-astra-medium), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-astra/2026-10-20-gpt-6-astra-medium/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-astra/2026-10-20-gpt-6-astra-medium/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-astra/2026-10-20-gpt-6-astra-medium/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-astra/2026-10-20-gpt-6-astra-medium/04-soft) | [14 / 14](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-astra/2026-10-20-gpt-6-astra-medium/05-dance) | 4 / 10 | 33.1 | 186k |
| `gpt-6-luna` (effort: the thread's default; no reasoning effort was set in any turn of the session's log, so the `medium` in the run's name is the name it was given, not a setting the log shows) | [`gpt-6-luna-medium`](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-luna/2026-10-20-gpt-6-luna-medium), 2026-10-20 | [4 / 4](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-luna/2026-10-20-gpt-6-luna-medium/01-build) | [7 / 7](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-luna/2026-10-20-gpt-6-luna-medium/02-move) | [6 / 6](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-luna/2026-10-20-gpt-6-luna-medium/03-correct) | [9 / 9](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-luna/2026-10-20-gpt-6-luna-medium/04-soft) | [5 / 14](https://github.com/rig-c/exam/tree/f72ca5f/results/gpt-6-luna/2026-10-20-gpt-6-luna-medium/05-dance) — not: built, checked, closes, both_hands, whole_body, arms_bend_at_the_joints, on_her_feet, keeps_time, soft_in_the_dance | 0 / 10 | 29.1 | 399k |

Minutes are for the tasks sat, together; tokens are fresh input plus output, cached input left out; the dance is judged by a person who does not know whose clip it is.

Kept, and not counted — 2 runs:

| model that did the work | run, as submitted | lines passed | why it does not count |
| --- | --- | --- | --- |
| `gpt-6-astra` | [`codex-direct`](https://github.com/rig-c/exam/tree/f72ca5f/results/void/2026-10-13-codex-direct), 2026-10-13 | [4 / 4](https://github.com/rig-c/exam/tree/f72ca5f/results/void/2026-10-13-codex-direct/01-build) · [7 / 7](https://github.com/rig-c/exam/tree/f72ca5f/results/void/2026-10-13-codex-direct/02-move) · [5 / 5](https://github.com/rig-c/exam/tree/f72ca5f/results/void/2026-10-13-codex-direct/03-correct) · — · — | a repeat in the session that had already seen its sub-agent's answers, by its own statement |
| `gpt-5.6-sol` (the run is named for a persona, not the model) | [`gpt-6-astra`](https://github.com/rig-c/exam/tree/f72ca5f/results/void/2026-10-13-gpt-6-astra), 2026-10-13 | [4 / 4](https://github.com/rig-c/exam/tree/f72ca5f/results/void/2026-10-13-gpt-6-astra/01-build) · [7 / 7](https://github.com/rig-c/exam/tree/f72ca5f/results/void/2026-10-13-gpt-6-astra/02-move) · [5 / 5](https://github.com/rig-c/exam/tree/f72ca5f/results/void/2026-10-13-gpt-6-astra/03-correct) · — · — | a repeat in the session that had already seen its sub-agent's report, by its own statement; and the run is named for a persona, not its model |

## Advanced Exam Leaderboard (Walk · Run · Dance Pose Retargeting)

Starts from a built rig: the agent retargets recorded walk (R1), run (R2), and dance (R3) pose sequences with [`@rig-c/pose`](/docs/pose/), one round per fresh session, fixing what the diagnostic numbers report without ever seeing the footage. 18 sittings of 6 models: 15 graded on edition 0.20 and, from 2026-10-20, 3 on edition 0.21, whose R1 · R2 · R3 tables are 10 · 15 · 14 rows (the shin-scale row is 0.21's one new row; for a 0.20 sitting it is a what-if):

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
