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

## Videos

The MP4s under `assets/` are encoded from pinned sources by one script, which also writes each clip's poster (frame 0 of the encoded clip):

```bash
PARTS_EXAMPLES=../parts-examples scripts/encode-video.sh               # every clip marked "build"
PARTS_EXAMPLES=../parts-examples scripts/encode-video.sh family-preview  # one clip
ADAPTERS_CAPTURE=../adapters-demo/capture scripts/encode-video.sh adapters-three-engines
scripts/loop-seam.py assets/family-preview.mp4 assets/docs/parts-idle.webp
```

- `scripts/encode-video.sh` holds one table: per clip, the output path, the source (repo, commit, path), the frame rate, frame count and duration, and the background a transparent source is composited over. Sources are read with `git show <sha>:<path>` from the local clone you name (`PARTS_EXAMPLES=`, `TRAILER=`, `CORE=`), so that clone's working tree does not matter. A row may instead read what a run of the Getting Started walkthrough wrote, from the run's `my-rig` folder (`WALKTHROUGH=`; no row does at present). The Adapters clip has no commit to pin either: its frames are captured from rig-c/adapters' own demo pages, served against the npm releases, by `scripts/adapters-capture.ts` (Playwright) and laid side by side by `scripts/adapters-composite.py`; the row and the two scripts' headers record the setup and versions, and without `ADAPTERS_CAPTURE` (the capture folder) it is skipped. The encode is H.264 High, `yuv420p`, BT.709, `-tune animation`, CRF 20, a closed GOP of at most 60 frames, fast start, no audio; frame 0 and the last 3 frames are coded at QP 12 (a row may set a lower one) so the two sides of the loop's wrap are equally sharp. After each encode it checks the frame count, the duration (±0.02 s) and the loop seam, and exits non-zero if any is off. Clips whose source is not pinned yet are listed with status `hold` and are not rebuilt.
- Three clips are not MP4s but animated WebPs with alpha, each with an RGBA PNG still (`<name>-poster.png`) for reduced motion, so the page background shows through: Getting Started's step-8 idle (`assets/docs/getting-started-idle.webp`) and step-10 hello (`getting-started-hello.webp`), and the Parts page's idle (`parts-idle.webp`). `rigc render` frames are opaque by design, so `scripts/play-capture-webp.ts` draws the build with `@rig-c/play` on a transparent page in headless Chromium (Playwright, fake clock, `RigPlayer.seek` per frame), frames it as `rigc render --max 640` does, and encodes it with `img2webp` (libwebp, exact alpha). Its header gives the three commands: the Getting Started clips read the walkthrough run's `my-rig` folder, the Parts idle a folder holding `@rig-c/play` and Character 1's build from rig-c/parts-examples@c239b09. Versions are in each page's SOURCES.
- The landing's "From loose parts to a living rig" clip (`assets/landing-parts-to-rig.mp4`) is rendered by `scripts/landing-film.py --trailer <rig-c/trailer clone>`: the trailer's `build.sh` steps 1–3 with its pinned packages, then the script runs `rigc build`/`rigc render` for the parts rig's idle and the film rig's `show` (each with a black-tinted twin for alpha), lays the 23 parts out loose, glides them into `parts.json`'s placement (checking every frame that no two unplaced parts overlap), splices the idle and a stretch of the show, and draws the caption band. Its header says what is the rig's and what is the film's.
- `scripts/loop-seam.py` prints, as mean absolute difference on 0–255 RGB, the first-vs-last difference (the seam) and the median and largest frame-to-frame step, then PASS when the seam is no larger than the largest step. It reads videos (through ffmpeg) and animated WebP/PNG/GIF (through Pillow, composited over `--bg`, default the page background `#070b18`), so a source and its MP4 can be compared.

Needs `git`, `ffmpeg`/`ffprobe` with libx264, and `python3` with Pillow and numpy; the WebP clips also need Bun, Playwright and libwebp's `img2webp`/`webpmux`.
