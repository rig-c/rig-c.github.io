# rig-c.github.io

Official static website for the **rig-c** 2D character rigging and animation toolchain, served at `https://rig-c.github.io` (the `rig-c.org` custom domain is not connected yet).

Built flat-first for **zero-JS `curl` readability**, **AI agent ingestion (`llms.txt` / `llms-full.txt` / per-page `index.md`)**, and **technical SEO** (semantic HTML5, Schema.org JSON-LD, Open Graph, `sitemap.xml`, `robots.txt`).

## Routes & Static Outputs

| Route | Static HTML | Markdown Mirror | Subject |
| --- | --- | --- | --- |
| `/` | `index.html` | `index.md` | Toolchain overview, 6-package table, architecture pipeline, licensing boundaries |
| `/getting-started/` | `getting-started/index.html` | `getting-started/index.md` | The three-step pipeline (paint, split into layers, run the packages on the CPU) and the 10-step no-GPU walkthrough from [`rig-c/getting-started`](https://github.com/rig-c/getting-started), plus downstream export routes |
| `/parts/` | `parts/index.html` | `parts/index.md` | `@rig-c/parts` (`1.38.0`) — See-through layer assembly, contour/lattice mesh, auto-weights, spring chains |
| `/pose/` | `pose/index.html` | `pose/index.md` | `@rig-c/pose` (`0.33.0`) — body-18 pose cleaning, bone-length normalization, retargeting |
| `/core/` | `core/index.html` | `core/index.md` | `rig-c` / `@rig-c/core` (`2.61.0`) — 2D rig compiler, 50 named assertions, CLI reference |
| `/review/` | `review/index.html` | `review/index.md` | `@rig-c/review` (`0.2.1`) — local human inspection workspace and structured JSON feedback export |
| `/play/` | `play/index.html` | `play/index.md` | `@rig-c/play` (`1.12.0`) — Spine-free browser player (`<rig-player>`, DOM & 2D `<canvas>` modes) |
| `/adapters/` | `adapters/index.html` | `adapters/index.md` | `@rig-c/pixi`, `@rig-c/phaser`, `@rig-c/three` (`0.1.1`) — game engine adapters |
| `/exam/` | `exam/index.html` | `exam/index.md` [`rig-c/exam`](https://github.com/rig-c/exam) — open-book exam for AI agents: Basic edition (tasks 01-build, 02-move, 03-correct) and Advanced edition (R1 walk, R2 run, R3 dance retargeting), rules and leaderboards |
| `/examples/` | `examples/index.html` | `examples/index.md` | Reproducible examples (`rig-c/parts-examples`: 6 standalone character input sets + 20 `family/` rigs, 396 part rows; `rig-c/trailer`: 240-frame short) |

### Machine / AI Crawler Endpoints

- `/llms.txt` — Concise index of all pages, packages, and install commands following the `llms.txt` specification.
- `/llms-full.txt` — Complete single-file Markdown corpus of all 10 documentation pages for single-request LLM context ingestion.
- `/sitemap.xml` — XML sitemap for search engines.
- `/robots.txt` — Explicit `Allow: /` rules for search engines and AI crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`, `PerplexityBot`, etc.).

## Commands

```bash
bun run build    # Emit all static HTML pages, Markdown mirrors, llms.txt, llms-full.txt, sitemap.xml, robots.txt
bun run verify   # Verify HTML semantics, JSON-LD validity, canonical URLs, internal links, and zero inline styles
bun run serve    # Start local static server on http://localhost:4321
```
