# rig-c.github.io (`rig-c.org`)

Official static website for the **rig-c** 2D character rigging and animation toolchain, served at `https://rig-c.org` (GitHub Pages custom domain; the `CNAME` file holds it).

Built flat-first for **zero-JS `curl` readability**, **AI agent ingestion (`llms.txt` / `llms-full.txt` / per-page `index.md`)**, and **technical SEO** (semantic HTML5, Schema.org JSON-LD, Open Graph, `sitemap.xml`, `robots.txt`).

## Routes & Static Outputs

Every documentation page is one Markdown file under `content/` (frontmatter + body). `bun run build` renders it to `_site/<route>/index.html` and copies it to `_site/<route>/index.md`. Only `_site/` is published; the repository root contains authored inputs and tooling.

| Route | Source | Subject |
| --- | --- | --- |
| `/` | `content/index.md` | Toolchain overview, package table, licensing boundaries |
| `/docs/` | `content/docs/index.md` | Docs hub: the packages in pipeline order (the list is generated from each page's frontmatter) |
| `/docs/capabilities/` | `content/docs/capabilities.md` | Input, producer, controls, output and playback matrix for 2D, depth-driven 2.5D and full 3D |
| `/docs/getting-started/` | `content/docs/getting-started.md` | The three-step pipeline and the 10-step no-GPU walkthrough from [`rig-c/getting-started`](https://github.com/rig-c/getting-started) |
| `/docs/parts/` … `/docs/adapters/` | `content/docs/<slug>.md` | One concept page per package: what it is, when to use it, what it solves, what you get, how it works, key concepts, and links into the repo for detail |
| `/examples/` | `content/examples.md` | Reproducible examples (`rig-c/examples`, `rig-c/trailer`) |
| `/demos/head-turn/` | `demos/head-turn/index.html` | Standalone depth-driven head-turn demo (separate from the released Parts producer) (JavaScript/WebGL required) |
| `/demos/head-turn/curvature/` | `demos/head-turn/curvature/index.html` | Curvature check: the original painting displaced by its depth map in one fragment shader, no rig (WebGL required) |
| `/exam/` | `content/exam.md` | [`rig-c/exam`](https://github.com/rig-c/exam) — the open-book exam for AI agents, Basic and Advanced editions |

The first version's routes (`/parts/`, `/core/`, `/getting-started/`, …) are redirect stubs to their `/docs/` pages (`REDIRECTS` in `src/content.ts`); they are `noindex` and stay out of the sitemap.

Each docs page keeps a `<!-- SOURCES … -->` comment listing where every claim comes from. It is stripped at build time and never published. `{{version:<slug>}}` resolves the docs page's package names against npm's `latest` manifests at build time. Each engine adapter is resolved separately and labelled by name. The landing table, docs badges, per-page Markdown metadata, JSON-LD and both LLM endpoints use that same resolved map for current versions. Multi-package docs emit one badge and one SoftwareSourceCode record per actual package. There is no authored `packageVersion` frontmatter: it previously duplicated current-looking metadata without defining a historical documentation baseline. Recorded demo, fixture and reproduction versions remain pinned in their captions and instructions.

The build requires access to `https://registry.npmjs.org`. Before writing any output, `src/versions.ts` fetches each package's `/latest` manifest once, with a 15-second timeout and no retries or stale fallback. HTTP, network, JSON, package-name or version errors fail the build. Build stdout records each exact endpoint, version and SHA-256 of the response body for reproduction. `/play/` and `/licensing/` are compatibility stubs to `/docs/play/` and `/docs/licensing/`.

### Machine / AI Crawler Endpoints

- `/llms.txt` — Concise index of all pages, packages, and install commands following the `llms.txt` specification.
- `/llms-full.txt` — Complete single-file Markdown corpus of every page for single-request LLM context ingestion.
- `/sitemap.xml` — XML sitemap for search engines.
- `/robots.txt` — Explicit `Allow: /` rules for search engines and AI crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`, `PerplexityBot`, etc.).

## Commands

Use **Bun 1.4.4** (the Actions runtime is pinned to that release). There are no third-party build dependencies to install. Build and full verification bundles run on the project's approved remote verification runner, against frozen inputs; the commands below are also the exact pipeline run by Actions.

```bash
bun run test       # Offline resolver/layout/artifact/live-comparison/workflow tests
bun run build      # Fetch eight npm latest manifests, emit an isolated _site/ artifact
bun run verify     # Check _site/: all routes, redirects, static assets and deployment manifest
bun run compare:live # Read-only comparison with the currently served deployment manifest
bun run serve      # Serve only _site/ on http://localhost:4321 (after a build)
```

Build, verify, serve and live comparison all accept `--out <directory>`:

```bash
bun run build --out dist
bun run verify --out dist
bun run compare:live --out dist
bun run serve --out dist
```

Inside this repository, output is restricted to `_site/` or `dist/`; an external isolated output directory is also supported. The repository root and authored directories cannot be output targets. New or empty output directories are allowed. A nonempty destination is replaceable only if its valid `deployment-manifest.json` identifies a previous generated site and every current file/directory is recorded by that marker (or is the marker itself). Unknown files are preserved by refusing the build; checkout/`.git` destinations are always refused, including other checkout ancestors. The marker's own digest is validated without requiring current file bytes to match, so regeneration can remove previously recorded stale files. Ownership is checked before fetching and again immediately before replacement. A successful build replaces only that owned output directory. Output paths must have canonical, symlink-free ancestors: on macOS use `/private/tmp/...` rather than `/tmp/...` (or resolve a parent with `realpath` before choosing the output path). Aliases into authored input are rejected rather than followed. All version lookups and rendering finish before any output is written; failed lookups preserve an existing output directory unchanged. Asset copying or filesystem errors fail the build and prevent publication.

The builder copies **only this repository's** `assets/`, `demos/`, `styles.css` and `CNAME`, byte for byte. It never reads a sibling checkout or runs the media scripts. Site-authoring Markdown, scripts and configuration are not published; the static demo bundle intentionally preserves its own README and licence notice. Generated HTML/Markdown, redirect stubs, `llms*.txt`, `robots.txt` and `sitemap.xml` belong exclusively in the output directory and must be removed from source tracking during migration; authored `assets/`, `styles.css` and `CNAME` stay tracked. Actions publishes an already-rendered artifact without Jekyll. It does not need `.nojekyll`, and the official upload action excludes dotfiles, so the builder emits none and rejects hidden artifact files or symlinks rather than silently publishing an incomplete file set.

The landing HTML gives each adapter version its own escaped `<code>` item separated by `<br>`. Its Markdown table remains one physical line per row, followed by a plain per-package list of all eight independently resolved packages; the same list appears in `llms.txt` and `llms-full.txt`. `@rig-c/core` and `@rig-c/adapters` are labels/aliases, not additional latest lookups. Docs badges and structured docs versions use the same build-time registry map. Recorded demo versions remain pinned to their sources.

## Link checks

`bun run verify` checks links in all registered generated pages, their Markdown mirrors, `llms.txt` and each page section of `llms-full.txt`. The same check runs alone with `bun run check:links`. Build the output first: standalone checks refuse a nonexistent output directory or any missing expected page HTML, Markdown mirror, `llms.txt` or `llms-full.txt`, naming the missing input and exiting 1. Expected documents must be regular files. It reads the actual element IDs from generated HTML, including IDs on non-heading elements; it does not guess heading slugs. Markdown is rendered by Bun to extract inline, reference, autolinks and raw HTML links. Code examples and HTML comments are not links.

Same-page, relative, cross-page and absolute same-origin links are resolved in the source page's URL context. A link to a known `index.md#fragment` uses that page's generated HTML IDs. Each `llms-full.txt` section keeps its original page context, so another page's heading cannot satisfy its same-page fragment. Attributes decode semicolon-terminated named and numeric HTML entities once; URL paths and fragments decode percent escapes once, including Unicode. Empty `#` and `#top` navigate to the top. Missing files, missing IDs, invalid URL escapes and fragments on unsupported non-HTML files fail with the source and original href.

The link crawl covers generated pages and mirrors. It does not recursively inspect copied demo/bundle links, apply their `<base>` elements, execute scripts, or check dynamic links. Existing specialized demo and asset checks still run. A `<base>` in a generated source page is refused rather than resolved against the wrong context.

Use an external scratch directory for build output and test temporary files:

```bash
CHECK_ROOT="$HOME/.cache/rig-c-site-checks"
mkdir -p "$CHECK_ROOT"
export TMPDIR="$CHECK_ROOT"
bun run build --out "$CHECK_ROOT/output"
bun run check:links --out "$CHECK_ROOT/output"
bun run verify --out "$CHECK_ROOT/output"
bun test src/links.test.ts src/external-links.test.ts
```

The tests plant a missing anchor in an existing private fixture file, run the real check CLI and assert exit 1 with the source and href, then repair the fixture and assert exit 0. They also cover HTML entities, Unicode, queries, Markdown-only and LLM-only failures, and page context. No authored page is mutated by these controls. Tests and verification remain offline; only the existing build's npm lookups require network access.

### Bounded repository documentation report

`bun run check:external --out "$CHECK_ROOT/output" > "$CHECK_ROOT/external-links.json"` is an optional live report, separate from test, build, verify and CI. It collects only public `https://github.com/rig-c/<repo>` README pages and `/blob/...` documents ending in `.md`, `.mdx`, `.rst`, `.txt`, or named `LICENSE`, `LICENCE`, `COPYING`, `NOTICE`. Other organizations, raw hosts, directory trees, issues and arbitrary domains are outside its scope. It follows no discovered links.

Bounds are fixed: 40 HTTP requests total (redirects included), at most two redirect hops per page, 1 MiB per response body, five seconds per request including body reads, and 45 seconds for the request budget. Requests are sequential, deduplicated by URL without fragment, unauthenticated, and use manual redirects with the same scope checks at every hop. No cookies or authorization headers are sent or forwarded. There are no retries. Unvisited targets are reported as `budget`; oversized responses and refused redirects remain uncertain.

Only HTTP 404/410 are `missing` and produce exit 1. Auth failures, rate limits, server errors, timeouts and network errors have distinct report statuses and never become missing targets. Exit 0 means the bounded report completed with no observed 404/410; it does not establish that every target is valid. Results retain source pages, requested and final URLs, HTTP status and, for completed bodies, length and SHA-256. GitHub can supply headings dynamically: an observed ID proves `anchor: present`, but an unobserved fragment stays `anchor: unknown`, even on HTTP 200. This report does not claim external anchor absence. Offline fixtures cover all these dispositions without live requests.

## Actions Pages deployment

`.github/workflows/pages.yml` runs on pushes to `main`, pull requests, manual dispatch and hourly at minute **17 UTC** (`17 * * * *`). Pull requests only test, build and verify. Main runs are serialized through deployment to keep the live comparison meaningful. Actions first runs the offline tests, then the real registry-backed build, then artifact verification; only successful, eligible and changed artifacts reach `actions/upload-pages-artifact@v4` and `actions/deploy-pages@v4`. Checkout uses `actions/checkout@v6` with credential persistence disabled. No bot writes source commits.

An independent gate uses **authenticated** `gh api repos/rig-c/rig-c.github.io/pages` to read the actual `build_type`. Its token has `contents: read` and `pages: read`; a public anonymous request is not a substitute. Only `build_type: workflow` allows publication. `legacy` leaves the build in verification-only mode; API/network/authentication errors and unknown modes fail closed. A 404 from the Pages API is an error. The build job has only `contents: read`. Only the deploy job receives `pages: write` and `id-token: write`, and it uses the existing `github-pages` environment. Its `main`-only branch policy is preserved. There is no `configure-pages` call, Pages auto-enable, setting mutation or PR deployment.

### Cutover order

1. Complete PR review and verification and sign off the exact PR head, including removal of tracked generated outputs and preservation of authored static inputs.
2. **Immediately before merge**, HQ changes Pages from `legacy` to `workflow` and reads the setting back. The workflow is not on `main` yet, so the previous legacy deployment stays live. Do not merge a source-only tree while legacy publishing is enabled: no legacy build may run against it.
3. The parent merges the approved head only after that readback. The `main` push can perform the first Actions deployment; a normal dispatch (`failure_fixture=none`) is available if another run is needed. The authenticated build-type gate remains a second guard.
4. The parent checks the deployment, canonical live routes, CNAME, Markdown/LLM endpoints, all redirect stubs and eight package versions against fresh npm manifests. Observe a no-change run and the deliberate failed run described below. Settings, merge and live acceptance remain separate owner actions.

### Deterministic artifact and no-change behavior

`deployment-manifest.json` is public. Schema 1 contains a path-sorted `files` array, with each file's relative path, byte count and SHA-256; the top-level `sha256` hashes the compact JSON encoding of that array. Every deployable file, including all authored assets and `CNAME`, participates. The manifest excludes itself and contains no timestamps, source commits or workflow/run IDs. New files, removed files and asset-only edits therefore change the hash even when package versions do not. The verifier recomputes the complete artifact digest and separately compares authored static files with their source inputs.

After verification, the workflow compares against **the currently served** `https://rig-c.org/deployment-manifest.json`. Each request uses explicit no-cache/no-store revalidation headers, a unique request-only cache-busting query and a 15-second timeout. The random query never enters the artifact or digest. The live manifest must pass schema, path ordering and file-list digest validation. Equal hashes skip **both upload and deploy**, also for scheduled and manual runs. A live manifest **404 only** permits the initial migration. Other HTTP statuses, redirects, network failures, invalid JSON or invalid manifests fail the run and prevent publication. There is no stale fallback or comparison to a repository copy of the manifest.

### Real failure fixture

After a good deployment, the parent can dispatch a deliberately red build:

```bash
gh workflow run pages.yml --repo rig-c/rig-c.github.io --ref main -f failure_fixture=invalid-version
```

The input injects a registry fetch returning an invalid version through the **same exported `buildSite` and `publishedVersions` resolver** as production. The real build must fail before writing an artifact; this dispatch is intentionally red, not an expected-failure test reported as a successful workflow. No production registry, credential, proxy or external state is changed. If the resolver ever regresses and accepts the fixture, a second CLI tripwire still fails, and independent upload/deploy conditions forbid fixture publication. Unknown fixture values also fail. The normal `none` path always fetches real npm latest manifests without retry or fallback.

Keep the failed run and compare the live manifest SHA and deployment history before/after it; the parent owns that evidence and must show no upload/deploy. Offline tests cover resolver refusal, no writes on failure, nonzero fixture CLI exit, independent publication guards, deterministic complete file sets, changed/deleted assets, live no-change/404/error behavior and all route/static copies. HTML structure assertions establish separate adapter code items and breaks; they are not a rendered-browser visual acceptance claim.

## Videos

The MP4s under `assets/` are encoded from pinned sources by one script, which also writes each clip's poster (frame 0 of the encoded clip):

```bash
EXAMPLES=../examples scripts/encode-video.sh               # every clip marked "build"
EXAMPLES=../examples scripts/encode-video.sh family-preview  # one clip
ADAPTERS_CAPTURE=../adapters-demo/capture scripts/encode-video.sh adapters-three-engines
scripts/loop-seam.py assets/family-preview.mp4 assets/docs/parts-idle.webp
```

- `scripts/encode-video.sh` holds one table: per clip, the output path, the source (repo, commit, path), the frame rate, frame count and duration, and the background a transparent source is composited over. Sources are read with `git show <sha>:<path>` from the local clone you name (`EXAMPLES=`, `TRAILER=`, `CORE=`), so that clone's working tree does not matter. A row may instead read what a run of the Getting Started walkthrough wrote, from the run's `my-rig` folder (`WALKTHROUGH=`; no row does at present). The Adapters clip has no commit to pin either: its frames are captured from rig-c/adapters' own demo pages, served against the npm releases, by `scripts/adapters-capture.ts` (Playwright) and laid side by side by `scripts/adapters-composite.py`; the row and the two scripts' headers record the setup and versions, and without `ADAPTERS_CAPTURE` (the capture folder) it is skipped. The encode is H.264 High, `yuv420p`, BT.709, `-tune animation`, CRF 20, a closed GOP of at most 60 frames, fast start, no audio; frame 0 and the last 3 frames are coded at QP 12 (a row may set a lower one) so the two sides of the loop's wrap are equally sharp. After each encode it checks the frame count, the duration (±0.02 s) and the loop seam, and exits non-zero if any is off. Clips whose source is not pinned yet are listed with status `hold` and are not rebuilt.
- Three clips are not MP4s but animated WebPs with alpha, each with an RGBA PNG still (`<name>-poster.png`) for reduced motion, so the page background shows through: Getting Started's step-8 idle (`assets/docs/getting-started-idle.webp`) and step-10 hello (`getting-started-hello.webp`), and the Parts page's idle (`parts-idle.webp`). `rigc render` frames are opaque by design, so `scripts/play-capture-webp.ts` draws the build with `@rig-c/play` on a transparent page in headless Chromium (Playwright, fake clock, `RigPlayer.seek` per frame), frames it as `rigc render --max 640` does, and encodes it with `img2webp` (libwebp, exact alpha). Its header gives the three commands: the Getting Started clips read the walkthrough run's `my-rig` folder, the Parts idle a folder holding `@rig-c/play` and Character 1's build from rig-c/examples@c239b09. Versions are in each page's SOURCES.
- The landing's "From loose parts to a living rig" clip (`assets/landing-parts-to-rig.mp4`) is rendered by `scripts/landing-film.py --trailer <rig-c/trailer clone>`: the trailer's `build.sh` steps 1–3 with its pinned packages, then the script runs `rigc build`/`rigc render` for the parts rig's idle and the film rig's `show` (each with a black-tinted twin for alpha), lays the 23 parts out loose, glides them into `parts.json`'s placement (checking every frame that no two unplaced parts overlap), splices the idle and a stretch of the show, and draws the caption band. Its header says what is the rig's and what is the film's.
- `scripts/loop-seam.py` prints, as mean absolute difference on 0–255 RGB, the first-vs-last difference (the seam) and the median and largest frame-to-frame step, then PASS when the seam is no larger than the largest step. It reads videos (through ffmpeg) and animated WebP/PNG/GIF (through Pillow, composited over `--bg`, default the page background `#070b18`), so a source and its MP4 can be compared.

Needs `git`, `ffmpeg`/`ffprobe` with libx264, and `python3` with Pillow and numpy; the WebP clips also need Bun, Playwright and libwebp's `img2webp`/`webpmux`.

## Static head-turn preview

After building, `bun run serve` serves `/demos/head-turn/` from the isolated output. The integration entry uses `<base href="./bundle/">`, with separate `site-ui.css` / `site-ui.js` for its single preview caption and Controls toggle. Below 800 CSS pixels the controls start closed; desktop keeps them available. Loading status belongs to the original application and remains visible until it finishes. The preserved demo caption predates the Parts 1.68.0 producer release. The Examples and Parts pages distinguish that standalone snapshot from the released producer; this documentation update does not rebuild or change its interactive files.

`demos/head-turn/bundle/` contains the approved ten-file preview inventory. The 2026-10-26 depth revision replaces `depth.jpg` and re-bakes `scene.json` / `scene.bin.gz` from that same confirmed atlas; the bundle README records the input and output hashes. The field reader, scene extractor and exact tuple deduplicator first reproduced the previous fields and complete gzip bytes as a control. The revision preserves ordered triangle-expanded neutral positions and UVs, all 224,144 triangles, draw order, eye aperture/core data and controller parameters. Depth-dependent deduplication now stores 132,540 vertices instead of 132,534. `index.html`, `app.js`, `aperture.js`, `runtime.js`, `look.png` and `THIRD_PARTY_LICENSES.txt` retain their previous bytes, as do the integration UI and separate curvature page. The adjacent `bundle-manifest.json` pins the revised inventory's path-sorted lengths and SHA-256 values; the build checks its digest before fetching registry data. Verification checks the whole copied `demos/` tree and the complete deployment manifest.

`demos/head-turn/curvature/` is a separate static page linked from the preview's caption: one WebGL fragment shader samples `original.webp` at each pixel's position plus depth × camera offset (pointer on desktop, drag on touch), with depth gamma, contrast and bias and a Show depth view. It reads the depth map and is not the head-turn feature. `depth.webp` is the supplied 1359×2000 depth map resampled into the painting's 1368×2000 frame by `x_depth = 0.99908·x − 2.939` (pixel indices, y unchanged), fitted to the silhouette edges of both images; a uniform 1359/1368 stretch left a median edge residual of 2.77 px, this fit 0.17 px. `verifyCurvaturePage` (in `src/head-turn.ts`) checks its five files, caption, back link, that every reference is relative and resolves, and the preview's link to it.

Serve `scene.bin.gz` as raw gzip bytes with **no Content-Encoding header**; the application decompresses it itself. The local static server returns the file directly. The Examples page links it from a "Preview: depth-driven head turn" section; the landing page does not feature it. Its `assets/head-turn-yaw15.png` poster is a real canvas render at yaw +15 degrees, captured with a synthetic pointer event at the right canvas edge through the original handler, with default controls; separate motion evidence uses real mouse movement. It is not an image-model asset. Browser captures and measured viewport/renderer details are separate acceptance evidence; source tests alone do not establish visual or physical-device correctness.
