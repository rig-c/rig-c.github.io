# Contributing

`rig-c/rig-c.github.io` builds the static website for [rig-c.org](https://rig-c.org), generating HTML pages, Markdown mirrors, `llms.txt`, and `llms-full.txt`.

## Getting the code running

From a clone, with [Bun](https://bun.sh) 1.4.4+ and Node.js 22+ on `PATH`:

```sh
bun install --frozen-lockfile
bun run build
bun run serve
```

`bun run build` writes the static site to `_site/`, and `bun run serve` serves `_site/` locally.

## Before you open a pull request

Run the offline unit tests, build, artifact verification, and internal link checks from `package.json` and `.github/workflows/pages.yml`:

```sh
bun test src/rigboy.test.ts src/workflow.test.ts
bun run test
bun run build
bun run verify
bun run check:links
```

CI also runs the registry-backed build, headless Chromium smoke tests, and external link check (these require network access and Playwright Chromium installed via `PLAYWRIGHT_SKIP_BROWSER_GC=1 bunx --no-install playwright install chromium`; `bun run test:browser` requires WebGL readiness within 30 s, and `bun run test:rigboy` is a multi-minute browser smoke over the Rigboy and Family demos):

```sh
bun run build:ci
bun run verify
bun run test:browser
bun run test:rigboy
bun run check:external
```

On `main` runs, `.github/workflows/pages.yml` also runs `bun run compare:live` before deploying changed artifacts.

## Reporting a change

- **Issue first.** Open an issue before changing pages, demos, or build scripts, describing what you ran, what it produced, and what should change.
- **One issue per pull request.** Keep each pull request scoped to a single issue.
- **Conventional Commits.** Write commit messages, code, and documentation in English using [Conventional Commits](https://www.conventionalcommits.org/) with a scope (`feat(site):`, `fix(demos):`, `docs(readme):`). Include no private names, secrets, or local machine paths.

## Where further rules live

- [README.md](README.md) — site architecture, page and mirror routes, `llms.txt` generation, link verification, and Pages deployment gates.
