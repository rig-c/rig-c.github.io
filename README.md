# rig-c.github.io (`rig-c.org`)

Official static website for the **rig-c** 2D character rigging and animation toolchain (`https://rig-c.org`).

Built flat-first for **zero-JS `curl` readability**, **AI agent ingestion (`llms.txt` / `llms-full.txt` / per-page `index.md`)**, and **technical SEO** (semantic HTML5, Schema.org JSON-LD, Open Graph, `sitemap.xml`, `robots.txt`).

## Routes & Static Outputs

| Route | Static HTML | Markdown Mirror | Subject |
| --- | --- | --- | --- |
| `/` | `index.html` | `index.md` | Toolchain overview, 6-package table, architecture pipeline, licensing boundaries |
| `/getting-started/` | `getting-started/index.html` | `getting-started/index.md` | Install commands, AI agent skill setup (`npx skills add`), end-to-end 6-step workflow |
| `/parts/` | `parts/index.html` | `parts/index.md` | `@rig-c/parts` (`1.38.0`) — See-through layer assembly, contour/lattice mesh, auto-weights, spring chains |
| `/pose/` | `pose/index.html` | `pose/index.md` | `@rig-c/pose` (`0.33.0`) — body-18 pose cleaning, bone-length normalization, retargeting |
| `/core/` | `core/index.html` | `core/index.md` | `rig-c` / `@rig-c/core` (`2.61.0`) — 2D rig compiler, 50 named assertions, CLI reference |
| `/review/` | `review/index.html` | `review/index.md` | `@rig-c/review` (`0.2.1`) — local human inspection workspace and structured JSON feedback export |
| `/play/` | `play/index.html` | `play/index.md` | `@rig-c/play` (`1.12.0`) — Spine-free browser player (`<rig-player>`, DOM & 2D `<canvas>` modes) |
| `/adapters/` | `adapters/index.html` | `adapters/index.md` | `@rig-c/pixi`, `@rig-c/phaser`, `@rig-c/three` (`0.1.1`) — game engine adapters |
| `/exam/` | `exam/index.html` | `exam/index.md` | `rigc exam` & `rigc check` — 10-subject graduation exam (`A1`–`D2`) and 50 named assertions |
| `/examples/` | `examples/index.html` | `examples/index.md` | Reproducible benchmarks (`rig-c/examples` 7 single rigs + 20 `family/` rigs, `rig-c/trailer` 240-frame short) |

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
