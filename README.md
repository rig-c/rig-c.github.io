# rig-c.github.io (`rig-c.org`)

Official static website for the **rig-c** 2D character rigging and animation toolchain, served at `https://rig-c.org` (GitHub Pages custom domain; the `CNAME` file holds it).

Built flat-first for **zero-JS `curl` readability**, **AI agent ingestion (`llms.txt` / `llms-full.txt` / per-page `index.md`)**, and **technical SEO** (semantic HTML5, Schema.org JSON-LD, Open Graph, `sitemap.xml`, `robots.txt`).

## Routes & Static Outputs

Every page is one Markdown file under `content/` (frontmatter + body). `bun run build` renders it to `<route>/index.html` and copies it to `<route>/index.md`.

| Route | Source | Subject |
| --- | --- | --- |
| `/` | `content/index.md` | Toolchain overview, package table, licensing boundaries |
| `/docs/` | `content/docs/index.md` | Docs hub: the packages in pipeline order (the list is generated from each page's frontmatter) |
| `/docs/getting-started/` | `content/docs/getting-started.md` | The three-step pipeline and the 10-step no-GPU walkthrough from [`rig-c/getting-started`](https://github.com/rig-c/getting-started) |
| `/docs/parts/` … `/docs/adapters/` | `content/docs/<slug>.md` | One concept page per package: what it is, when to use it, what it solves, what you get, how it works, key concepts, and links into the repo for detail |
| `/examples/` | `content/examples.md` | Reproducible examples (`rig-c/parts-examples`, `rig-c/trailer`) |
| `/exam/` | `content/exam.md` | [`rig-c/exam`](https://github.com/rig-c/exam) — the open-book exam for AI agents, Basic and Advanced editions |

The first version's routes (`/parts/`, `/core/`, `/getting-started/`, …) are redirect stubs to their `/docs/` pages (`REDIRECTS` in `src/content.ts`); they are `noindex` and stay out of the sitemap.

Each docs page keeps a `<!-- SOURCES … -->` comment listing where every claim comes from. It is stripped at build time and never published. `{{version:<slug>}}` in any page prints that docs page's `packageVersion`.

### Machine / AI Crawler Endpoints

- `/llms.txt` — Concise index of all pages, packages, and install commands following the `llms.txt` specification.
- `/llms-full.txt` — Complete single-file Markdown corpus of every page for single-request LLM context ingestion.
- `/sitemap.xml` — XML sitemap for search engines.
- `/robots.txt` — Explicit `Allow: /` rules for search engines and AI crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`, `PerplexityBot`, etc.).

## Commands

```bash
bun run build    # Emit all static HTML pages, Markdown mirrors, llms.txt, llms-full.txt, sitemap.xml, robots.txt
bun run verify   # Verify HTML semantics, JSON-LD validity, canonical URLs, internal links, and zero inline styles
bun run serve    # Start local static server on http://localhost:4321
```
