# rig-c/exam — Does Your AI Model Pass?

**An open-book exam for AI agents: build a rig from one painting with the published rig-c tools, and write down what you expected before each step.**

- **Repository**: <https://github.com/rig-c/exam>
- **Prompt (Basic)**: <https://github.com/rig-c/exam/blob/main/PROMPT.md>
- **Advanced Edition**: <https://github.com/rig-c/exam/tree/main/advanced>
- **License**: CC BY-NC 4.0

The rig-c tools are written for agents that cannot see what they build. `rig-c/exam` measures whether that holds for a fresh agent session that has never seen the tools before: the only help is what ships inside the installed packages (`README.md`, `docs/`, `--help`). Before every command that changes a file, the examinee must record what it read and what it expects in `JOURNAL.md`. Where expectation and reality differ — where the agent says *WTF?* — a tool message or guide was missing something.

## Basic Exam Leaderboard (Tasks 01-build, 02-move, 03-correct)

5 independent sittings graded from submitted input files via `python3 grade.py`:

| Model | Sittings | 01-build | 02-move | 03-correct | Total Lines Passed | Minutes | Tokens (Fresh In + Out) |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **Claude Haiku** (`2026-10-12-haiku`) | 1 | 4 / 4 | 7 / 7 | 5 / 5 | **16 / 16** | 21.0 | 531k |
| **Gemini 3.8 Flash** (`2026-10-13-gemini-3.8-flash`) | 1 | 4 / 4 | 7 / 7 | 5 / 5 | **16 / 16** | 20.0 | 1.4M |
| **`gpt-6-sol`** (`2026-10-13-gpt-6-sol`) | 1 | 4 / 4 | 7 / 7 | 5 / 5 | **16 / 16** | 14.1 | 258k |
| **Sol 6.1 (`gpt-6.1-sol`)** (2 sittings) | 2 | 4 / 4 | 7 / 7 | 5 / 5 | **32 / 32** (16/16 each) | 14.2 – 15.3 | 195k – 270k |

## Advanced Exam Leaderboard (Walk · Run · Dance Pose Retargeting)

Starts from a built rig: the agent retargets recorded walk (R1), run (R2), and dance (R3) pose sequences with [`@rig-c/pose`](/pose/), one round per fresh session, fixing what the diagnostic numbers report without ever seeing the footage:

| Model | R1 Walk | R2 Run | R3 Dance | 0.21 Shin-Scale Row (What-If) | Minutes (R1 · R2 · R3) |
| --- | :-: | :-: | :-: | --- | --- |
| `claude-haiku-5-5` | **9 / 9** | 8 / 14 (FAIL) | **13 / 13** | passes all 3 | `3.1 · 2.4 · 7.4` |
| `claude-opus-5-5` | **9 / 9** | **14 / 14** | **13 / 13** | fails R2 (`0.106`) | `8.2 · 8.7 · 8.4` |
| `claude-sonnet-5-5` | **9 / 9** | **14 / 14** | **13 / 13** | passes all 3 | `7.3 · 10.3 · 18.7` |
| `gemini-3.8-flash-medium` | **9 / 9** | **14 / 14** | **13 / 13** | fails R2 (`0.106`) | `8.1 · 14.3 · 11.4` |
| `gemini-4-argon-high` | **9 / 9** | **14 / 14** | **13 / 13** | passes all 3 | `16.8 · 20.3 · 32.5` |

## Rules of the Exam

1. **Open book, closed neighbours.** Examinees may read anything inside the pinned npm packages and public tool repos, but may not read another examinee's run under `results/` or ask a human.
2. **Pinned versions.** `npm ci` installs the exact round versions declared in `package.json`.
3. **Journal before you act.** Every step in `JOURNAL.md` must record expectations before running the command.
4. **Submit the transcript.** Raw session logs are submitted alongside `JOURNAL.md`.
5. **The grader rebuilds from inputs.** `grade.py` trusts only the handed-in config/spec files and rebuilds from scratch.
