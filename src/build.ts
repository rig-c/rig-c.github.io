import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { htmlRel, mdRoute, PAGES, type Page, REDIRECTS, SITE_ORIGIN } from './content.ts';

const ROOT_DIR = resolve(import.meta.dir, '..');
const TODAY = '2026-10-19';
const DOCS = PAGES.filter((p) => p.section === 'docs');
const CORE = PAGES.find((p) => p.route === '/docs/core/');

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// The docs hub lists every docs page from its own frontmatter, so the list cannot drift from the pages.
function docsMap(): string {
  return DOCS.filter((p) => p.route !== '/docs/')
    .map((p) => {
      const pkg = p.packageName ? ` — \`${p.packageName}\`` : '';
      return `- [**${p.navLabel}**](${p.route})${pkg}: ${p.summaryForLlms}`;
    })
    .join('\n');
}

// {{version:<docs slug>}} prints that docs page's published version, so a page never quotes a stale one.
function version(slug: string): string {
  const doc = DOCS.find((p) => p.route === `/docs/${slug}/`);
  const v = doc?.packageVersion?.split(',')[0]?.trim();
  if (!v) throw new Error(`{{version:${slug}}}: no docs page with a packageVersion`);
  return v;
}

// The Family rigs the live demo plays, pinned to one rig-c/parts-examples commit.
const FAMILY_SHA = 'c239b09328ca7364361b9761fac817502c09ede0';
const FAMILY = ['Character 1', 'Character 2', 'Character 3', 'Character 4', 'Character 5'];
const FAMILY_DIRS = ['roa', 'luna', 'jinni', 'naru', 'nova'];
const OUTFITS = ['office', 'homewear', 'swimwear', 'uniform'];

// The live demo is markup plus /assets/demo.js; the Markdown mirror gets a sentence instead.
function liveDemo(target: 'html' | 'md'): string {
  if (target === 'md') {
    return `The live demo on ${SITE_ORIGIN}/examples/ plays the 20 Family rigs (5 characters × 4 outfits) in the browser with @rig-c/play, with play/pause and bone and mesh overlays. It needs JavaScript.`;
  }
  const characters = FAMILY.map((name, i) => `<option value="${FAMILY_DIRS[i]}">${name}</option>`).join('');
  const outfits = OUTFITS.map((o) => `<option value="${o}">${o}</option>`).join('');
  return `<section class="live-demo" id="live-demo" data-sha="${FAMILY_SHA}" aria-label="Live demo">
<div class="demo-head"><span class="badge-live">Live</span><span>Running in your browser — not a recording</span></div>
<div class="demo-body">
<div class="demo-stage" id="demo-stage"><button type="button" class="btn btn-primary demo-start" id="demo-start">Start the live demo</button><canvas class="demo-overlay" id="demo-overlay" aria-hidden="true"></canvas></div>
<div class="demo-panel">
<div class="demo-controls" role="group" aria-label="Live demo controls">
<label>Character <select id="demo-character">${characters}</select></label>
<label>Outfit <select id="demo-outfit">${outfits}</select></label>
<label>Motion <select id="demo-motion"><option>idle</option></select></label>
<div class="demo-buttons"><button type="button" class="btn" id="demo-play">Play</button><button type="button" class="btn" id="demo-bones" aria-pressed="false">Bones</button><button type="button" class="btn" id="demo-mesh" aria-pressed="false">Mesh</button></div>
</div>
<p class="demo-status" id="demo-status" role="status" aria-live="polite">Not loaded yet. Pressing Start downloads the player (about 0.4 MB) and one rig (about 1.5–2 MB); each outfit or character you pick loads another.</p>
<p class="demo-source" id="demo-source">Source for each rig: its config.json and built model, linked here once it loads.</p>
<noscript><p class="demo-status" data-kind="error">The live demo needs JavaScript. The recorded preview above shows the same rigs.</p></noscript>
</div>
</div>
</section>
<script type="module" src="/assets/demo.js"></script>`;
}

function expand(page: Page, target: 'html' | 'md' = 'md'): string {
  return page.markdown
    .replace('{{live-demo}}', liveDemo(target))
    .replace('{{docs-map}}', docsMap())
    .replace(/\{\{version:([a-z-]+)\}\}/g, (_, slug: string) => version(slug));
}

// Verdict words inside code blocks get a class, so a gate transcript reads at a glance.
function markVerdicts(html: string): string {
  return html.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (_, attrs: string, code: string) => {
    const marked = code.replace(/\b(PASS|FAIL|SKIP|WARN)\b/g, (w) => `<span class="v-${w.toLowerCase()}">${w}</span>`);
    return `<pre><code${attrs}>${marked}</code></pre>`;
  });
}

function renderMarkdown(markdown: string): string {
  return markVerdicts(Bun.markdown.html(markdown, { headings: { ids: true } }));
}

function hero(page: Page): string {
  return `<section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">${escapeHtml(page.heroEyebrow ?? '')}</p>
          <h1 id="hero-title">${escapeHtml(page.heroTitle ?? page.title)}</h1>
          <p class="lede">${escapeHtml(page.heroLede ?? page.description)}</p>
          <div class="cta">
            <a class="btn btn-primary" href="/docs/getting-started/">Get started</a>
            <a class="btn" href="/docs/">Read the docs</a>
          </div>
          <pre class="install"><code>bunx rig-c --help</code></pre>
        </div>
        <figure class="hero-media">
          <div class="media">
            <video data-loop="the trailer loop" controls muted loop playsinline preload="metadata" poster="/assets/trailer-poster.jpg" width="960" height="540" aria-label="Recorded video: a rigged character on a swing breathes, smiles, kicks her legs and waves">
              <source src="/assets/trailer.mp4" type="video/mp4">
              <img src="/assets/trailer-poster.jpg" alt="A rigged character on a swing breathes, smiles, kicks her legs and waves" width="960" height="540">
            </video>
          </div>
          <figcaption><span class="media-kind">Recorded video</span> One generated painting, two See-through layer sets and a config an agent wrote, rebuilt by one command — <a href="https://github.com/rig-c/trailer">rig-c/trailer</a></figcaption>
        </figure>
      </section>`;
}

function breadcrumbItems(page: Page): { name: string; route: string }[] {
  const items = [{ name: 'rig-c', route: '/' }];
  if (page.section === 'docs' && page.route !== '/docs/') items.push({ name: 'Docs', route: '/docs/' });
  if (page.route !== '/') items.push({ name: page.navLabel, route: page.route });
  return items;
}

function buildJsonLd(page: Page): string {
  const url = `${SITE_ORIGIN}${page.route}`;
  const graph: Record<string, unknown>[] = [];

  if (page.route === '/') {
    graph.push(
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        url: `${SITE_ORIGIN}/`,
        name: 'rig-c',
        alternateName: ['rigc', '@rig-c/core'],
        description: page.description,
        inLanguage: 'en',
        publisher: { '@type': 'Organization', name: 'rig-c', url: 'https://github.com/rig-c' },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${SITE_ORIGIN}/#toolchain`,
        name: 'rig-c',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'macOS, Linux, Windows, Web Browser',
        softwareVersion: CORE?.packageVersion,
        url: `${SITE_ORIGIN}/`,
        downloadUrl: 'https://www.npmjs.com/package/rig-c',
        codeRepository: 'https://github.com/rig-c/core',
        description: page.description,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    );
  } else {
    graph.push(
      {
        '@type': 'TechArticle',
        '@id': `${url}#article`,
        headline: page.title,
        description: page.description,
        url,
        datePublished: TODAY,
        dateModified: TODAY,
        inLanguage: 'en',
        author: { '@type': 'Organization', name: 'rig-c', url: 'https://github.com/rig-c' },
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems(page).map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: `${SITE_ORIGIN}${item.route}`,
        })),
      },
    );
    if (page.packageName) {
      graph.push({
        '@type': 'SoftwareSourceCode',
        name: page.packageName,
        version: page.packageVersion,
        codeRepository: page.repoUrl,
        url,
        programmingLanguage: 'TypeScript',
        description: page.description,
      });
    }
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
}

function head(page: Page): string {
  const canonicalUrl = `${SITE_ORIGIN}${page.route}`;
  const ogImageUrl = `${SITE_ORIGIN}/assets/banner.svg`;
  return `<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}">
    <meta name="keywords" content="${escapeHtml(page.keywords.join(', '))}">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    <link rel="canonical" href="${canonicalUrl}">
    <link rel="icon" href="/assets/logo.svg" type="image/svg+xml">
    <link rel="alternate" type="text/markdown" href="${mdRoute(page.route)}" title="${escapeHtml(page.navLabel)} (Markdown)">
    <link rel="alternate" type="text/plain" href="/llms.txt" title="rig-c LLM Documentation Index">
    <link rel="alternate" type="text/plain" href="/llms-full.txt" title="rig-c Full LLM Documentation">
    <meta property="og:type" content="${page.route === '/' ? 'website' : 'article'}">
    <meta property="og:site_name" content="rig-c">
    <meta property="og:title" content="${escapeHtml(page.title)}">
    <meta property="og:description" content="${escapeHtml(page.description)}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:locale" content="en_US">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(page.title)}">
    <meta name="twitter:description" content="${escapeHtml(page.description)}">
    <meta name="twitter:image" content="${ogImageUrl}">
    <meta name="theme-color" content="#070b18">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap">
    <link rel="stylesheet" href="/styles.css">
    <script src="/assets/media.js" defer></script>
    <script type="application/ld+json">
${buildJsonLd(page)}
    </script>`;
}

function siteHeader(page: Page): string {
  const top: { label: string; href: string; section?: Page['section'] }[] = [
    { label: 'Docs', href: '/docs/', section: 'docs' },
    { label: 'Examples', href: '/examples/', section: 'examples' },
    { label: 'Exam', href: '/exam/', section: 'exam' },
    { label: 'GitHub', href: 'https://github.com/rig-c' },
  ];
  const links = top
    .map((t) => {
      const current = t.section === page.section ? ' aria-current="page"' : '';
      return `<a href="${t.href}"${current}>${t.label}</a>`;
    })
    .join('\n          ');
  return `<header class="site-header">
      <div class="header-inner">
        <a href="/" class="brand"><img src="/assets/logo.svg" alt="" width="28" height="28"><span>rig-c</span></a>
        <nav aria-label="Primary" class="site-nav">
          ${links}
        </nav>
      </div>
    </header>`;
}

function siteFooter(page: Page): string {
  return `<footer class="site-footer">
      <div class="footer-inner">
        <p><strong>rig-c</strong> — AI-authored 2D rigging and animation, verified before it is written. Every page is static HTML with a Markdown mirror.</p>
        <nav aria-label="Machine-readable" class="footer-links">
          <a href="${mdRoute(page.route)}">This page as Markdown</a>
          <a href="/llms.txt">llms.txt</a>
          <a href="/llms-full.txt">llms-full.txt</a>
          <a href="/sitemap.xml">sitemap.xml</a>
          <a href="https://github.com/rig-c">GitHub</a>
          <a href="https://www.npmjs.com/package/rig-c">npm</a>
        </nav>
      </div>
    </footer>`;
}

function breadcrumb(page: Page): string {
  if (page.route === '/') return '';
  const items = breadcrumbItems(page);
  const lis = items
    .map((item, i) =>
      i === items.length - 1
        ? `<li aria-current="page">${escapeHtml(item.name)}</li>`
        : `<li><a href="${item.route}">${escapeHtml(item.name)}</a></li>`,
    )
    .join('');
  return `<nav aria-label="Breadcrumb" class="breadcrumb"><ol>${lis}</ol></nav>`;
}

function packageBar(page: Page): string {
  const items: string[] = [];
  if (page.packageName && page.packageVersion) {
    items.push(`<span class="pkg"><code>${escapeHtml(page.packageName)}</code> <span class="ver">${escapeHtml(page.packageVersion)}</span></span>`);
  }
  items.push(`<a href="${escapeHtml(page.repoUrl)}">${escapeHtml(page.repoUrl.replace('https://github.com/', 'github.com/'))}</a>`);
  if (page.npmUrl) items.push(`<a href="${escapeHtml(page.npmUrl)}">npm</a>`);
  return `<div class="pkg-bar">${items.join('')}</div>`;
}

function docsSidebar(page: Page): string {
  const links = DOCS.map((p) => {
    const current = p.route === page.route ? ' aria-current="page"' : '';
    return `<li><a href="${p.route}"${current}>${escapeHtml(p.navLabel)}</a></li>`;
  }).join('\n            ');
  return `<nav aria-label="Docs" class="docs-nav">
          <ol>
            ${links}
          </ol>
        </nav>`;
}

function onThisPage(html: string): string {
  const items = [...html.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map(
    (m) => `<li><a href="#${m[1]}">${m[2]?.replace(/<[^>]+>/g, '')}</a></li>`,
  );
  if (items.length < 2) return '';
  return `<aside class="toc" aria-label="On this page"><p>On this page</p><ol>${items.join('')}</ol></aside>`;
}

function pager(page: Page): string {
  const at = DOCS.indexOf(page);
  const prev = DOCS[at - 1];
  const next = DOCS[at + 1];
  const parts: string[] = [];
  if (prev) parts.push(`<a href="${prev.route}" rel="prev"><span>Previous</span>${escapeHtml(prev.navLabel)}</a>`);
  if (next) parts.push(`<a href="${next.route}" rel="next"><span>Next</span>${escapeHtml(next.navLabel)}</a>`);
  return parts.length ? `<nav aria-label="Docs pages" class="pager">${parts.join('')}</nav>` : '';
}

function renderPage(page: Page): string {
  const body = renderMarkdown(expand(page, 'html'));
  let main: string;
  if (page.section === 'home') {
    // The hero carries the page's one <h1>; the Markdown's own H1 stays in the .md mirror only.
    const rest = body.replace(/<h1[^>]*>[\s\S]*?<\/h1>\s*/, '');
    main = `<main class="site-main home">
      ${hero(page)}
      <article class="home-body">
${rest}
      </article>
    </main>`;
  } else if (page.section === 'docs') {
    main = `<div class="docs-layout">
        ${docsSidebar(page)}
      <main class="site-main docs-main">
        ${breadcrumb(page)}
        ${page.packageName ? packageBar(page) : ''}
        <article>
${body}
        </article>
        ${pager(page)}
      </main>
      ${onThisPage(body)}
    </div>`;
  } else {
    main = `<main class="site-main page">
      ${breadcrumb(page)}
      ${packageBar(page)}
      <article>
${body}
      </article>
    </main>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    ${head(page)}
  </head>
  <body class="section-${page.section}">
    ${siteHeader(page)}
    ${main}
    ${siteFooter(page)}
  </body>
</html>
`;
}

function renderRedirect(from: string, to: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Moved to ${to}</title>
    <meta name="robots" content="noindex">
    <link rel="canonical" href="${SITE_ORIGIN}${to}">
    <meta http-equiv="refresh" content="0; url=${to}">
  </head>
  <body>
    <p>This page moved from <code>${from}</code> to <a href="${to}">${SITE_ORIGIN}${to}</a>.</p>
  </body>
</html>
`;
}

function buildLlmsTxt(): string {
  const lines: string[] = [
    '# rig-c',
    '',
    '> AI-authored 2D character rigging and animation toolchain, verified before a byte is written. Takes one character painting decomposed into RGBA layers (via See-through) and compiles Spine 4.3 skeleton data (`skeleton.json` + `.atlas`) and self-contained browser/engine models (`skeleton.model.json`), gated by named assertions (36 under the default spine profile, 50 under the opt-in rig-play profile).',
    '',
    `All pages on ${SITE_ORIGIN} are served as static semantic HTML (\`/<path>/\`) with a clean Markdown mirror (\`/<path>/index.md\`). No JavaScript execution is required to fetch or parse any page.`,
    '',
    '## Pages',
    '',
  ];
  for (const page of PAGES) {
    const badge = page.packageName && page.packageVersion ? ` (\`${page.packageName}@${page.packageVersion}\`)` : '';
    lines.push(
      `- [${page.navLabel}](${SITE_ORIGIN}${page.route}) ([Markdown](${SITE_ORIGIN}${mdRoute(page.route)}))${badge}: ${page.summaryForLlms}`,
    );
  }
  lines.push(
    '',
    '## Install',
    '',
    '```bash',
    '# Authoring toolchain',
    'npm i -D rig-c @rig-c/parts @rig-c/pose @rig-c/review',
    '',
    '# Browser and engine runtimes (no Spine runtime required)',
    'npm i @rig-c/play @rig-c/pixi @rig-c/phaser @rig-c/three',
    '',
    '# AI Agent Skills: rig-c ships skills/ (Codex, Gemini CLI, Antigravity read .agents/skills/)',
    'bun add -d rig-c',
    'bun rigc skills install',
    '',
    '# Claude Code: the rig-c/core repository is a plugin marketplace',
    '/plugin marketplace add rig-c/core',
    '/plugin install rigc@rigc',
    '```',
    '',
    '## Full Single-File Corpus',
    '',
    `- [Full Documentation Bundle (llms-full.txt)](${SITE_ORIGIN}/llms-full.txt): Concatenated Markdown of every page on this site for single-request LLM context ingestion.`,
    '',
  );
  return lines.join('\n');
}

function buildLlmsFullTxt(): string {
  const header = [
    '# rig-c — Complete Toolchain Documentation (llms-full.txt)',
    '',
    `> Source: ${SITE_ORIGIN}/llms-full.txt`,
    `> Generated: ${TODAY}`,
    `> Purpose: Single-request Markdown bundle of all documentation pages on ${SITE_ORIGIN} for AI agents, RAG pipelines, and curl inspection.`,
    '',
  ].join('\n');
  const sections = PAGES.map((page) => {
    const pkg = page.packageName && page.packageVersion ? `\nPackage: ${page.packageName}@${page.packageVersion}` : '';
    return [
      '================================================================================',
      `URL: ${SITE_ORIGIN}${page.route}`,
      `Markdown: ${SITE_ORIGIN}${mdRoute(page.route)}${pkg}`,
      `Repository: ${page.repoUrl}`,
      '================================================================================',
      '',
      expand(page).trim(),
      '',
    ].join('\n');
  });
  return `${header}\n${sections.join('\n')}`;
}

function buildSitemapXml(): string {
  const urls = PAGES.map(
    (page) => `  <url>
    <loc>${SITE_ORIGIN}${page.route}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.route === '/' ? '1.0' : '0.8'}</priority>
  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

function buildRobotsTxt(): string {
  const agents = [
    '*', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'anthropic-ai',
    'Google-Extended', 'Googlebot', 'Bingbot', 'PerplexityBot', 'Amazonbot', 'Applebot-Extended',
    'Bytespider', 'CCBot', 'DuckAssistBot', 'cohere-ai',
  ];
  const blocks = agents.map((agent) => `User-agent: ${agent}\nAllow: /`);
  blocks.push(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
  return `${blocks.join('\n\n')}\n`;
}

function writeOut(relPath: string, content: string): void {
  const absPath = join(ROOT_DIR, relPath);
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, content, 'utf8');
}

function main(): void {
  for (const asset of ['banner.svg', 'logo.svg']) {
    const source = resolve(ROOT_DIR, `../rigc/assets/${asset}`);
    if (existsSync(source)) {
      mkdirSync(join(ROOT_DIR, 'assets'), { recursive: true });
      copyFileSync(source, join(ROOT_DIR, 'assets', asset));
    }
  }

  for (const page of PAGES) {
    writeOut(htmlRel(page.route), renderPage(page));
    writeOut(mdRoute(page.route).slice(1), `${expand(page).trim()}\n`);
  }
  for (const [from, to] of Object.entries(REDIRECTS)) {
    writeOut(htmlRel(from), renderRedirect(from, to));
  }

  writeOut('llms.txt', buildLlmsTxt());
  writeOut('llms-full.txt', buildLlmsFullTxt());
  writeOut('sitemap.xml', buildSitemapXml());
  writeOut('robots.txt', buildRobotsTxt());
  writeOut('.nojekyll', '');

  console.log(
    `Built ${PAGES.length} pages (HTML + Markdown mirror), ${Object.keys(REDIRECTS).length} redirect stubs, llms.txt, llms-full.txt, sitemap.xml, and robots.txt in ${ROOT_DIR}`,
  );
}

main();
