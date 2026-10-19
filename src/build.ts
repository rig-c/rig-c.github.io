import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { PAGES, type PageSpec, SITE_ORIGIN } from './pages.ts';

const ROOT_DIR = resolve(import.meta.dir, '..');
const TODAY = '2026-10-19';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pagePath(slug: string): string {
  return slug === '' ? '/' : `/${slug}/`;
}

function pageMdPath(slug: string): string {
  return slug === '' ? '/index.md' : `/${slug}/index.md`;
}

function buildJsonLd(page: PageSpec): string {
  const url = `${SITE_ORIGIN}${pagePath(page.slug)}`;
  const graph: Record<string, unknown>[] = [];

  if (page.slug === '') {
    graph.push(
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        url: `${SITE_ORIGIN}/`,
        name: 'rig-c',
        alternateName: ['rigc', '@rig-c/core'],
        description: page.description,
        inLanguage: 'en',
        publisher: {
          '@type': 'Organization',
          name: 'rig-c',
          url: 'https://github.com/rig-c',
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${SITE_ORIGIN}/#toolchain`,
        name: 'rig-c',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'macOS, Linux, Windows, Web Browser',
        softwareVersion: page.packageVersion ?? '2.61.0',
        url: `${SITE_ORIGIN}/`,
        downloadUrl: 'https://www.npmjs.com/package/rig-c',
        codeRepository: 'https://github.com/rig-c/rigc',
        description: page.description,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
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
        author: {
          '@type': 'Organization',
          name: 'rig-c',
          url: 'https://github.com/rig-c',
        },
        isPartOf: {
          '@id': `${SITE_ORIGIN}/#website`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'rig-c',
            item: `${SITE_ORIGIN}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: page.navLabel,
            item: url,
          },
        ],
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
        runtimePlatform: 'Node.js >= 20, Bun, Web Browser',
        description: page.description,
      });
    }
  }

  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': graph,
    },
    null,
    2,
  );
}

function renderHtmlPage(page: PageSpec, index: number): string {
  const route = pagePath(page.slug);
  const mdRoute = pageMdPath(page.slug);
  const canonicalUrl = `${SITE_ORIGIN}${route}`;
  const ogImageUrl = `${SITE_ORIGIN}/assets/banner.svg`;
  const jsonLd = buildJsonLd(page);

  const navLinks = PAGES.map((item) => {
    const href = pagePath(item.slug);
    const current = item.slug === page.slug ? ' aria-current="page"' : '';
    return `<a href="${href}"${current}>${escapeHtml(item.navLabel)}</a>`;
  }).join('\n          ');

  const breadcrumb =
    page.slug === ''
      ? ''
      : `<nav aria-label="Breadcrumb" class="breadcrumb">
        <ol>
          <li><a href="/">rig-c</a></li>
          <li aria-current="page">${escapeHtml(page.navLabel)}</li>
        </ol>
      </nav>`;

  const metaItems: string[] = [];
  if (page.packageName && page.packageVersion) {
    metaItems.push(
      `<span>Package: <code>${escapeHtml(page.packageName)}@${escapeHtml(page.packageVersion)}</code></span>`,
    );
  }
  metaItems.push(`<span>GitHub: <a href="${escapeHtml(page.repoUrl)}">${escapeHtml(page.repoUrl.replace('https://github.com/', ''))}</a></span>`);
  if (page.npmUrl) {
    metaItems.push(`<span>npm: <a href="${escapeHtml(page.npmUrl)}">registry</a></span>`);
  }
  metaItems.push(`<span>Markdown: <a href="${mdRoute}">${mdRoute}</a></span>`);
  metaItems.push(`<span>LLM Index: <a href="/llms.txt">/llms.txt</a> · <a href="/llms-full.txt">/llms-full.txt</a></span>`);

  const prevPage = index > 0 ? PAGES[index - 1] : undefined;
  const nextPage = index < PAGES.length - 1 ? PAGES[index + 1] : undefined;
  const paginationParts: string[] = [];
  if (prevPage) {
    paginationParts.push(
      `<span>Previous: <a href="${pagePath(prevPage.slug)}" rel="prev">${escapeHtml(prevPage.navLabel)}</a></span>`,
    );
  }
  if (nextPage) {
    paginationParts.push(
      `<span>Next: <a href="${pagePath(nextPage.slug)}" rel="next">${escapeHtml(nextPage.navLabel)}</a></span>`,
    );
  }
  const paginationHtml =
    paginationParts.length > 0
      ? `\n      <nav aria-label="Page pagination" class="meta-bar">\n        ${paginationParts.join('\n        ')}\n      </nav>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}">
    <meta name="keywords" content="${escapeHtml(page.keywords.join(', '))}">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    <link rel="canonical" href="${canonicalUrl}">
    <link rel="alternate" type="text/markdown" href="${mdRoute}" title="${escapeHtml(page.navLabel)} (Markdown)">
    <link rel="alternate" type="text/plain" href="/llms.txt" title="rig-c LLM Documentation Index">
    <link rel="alternate" type="text/plain" href="/llms-full.txt" title="rig-c Full LLM Documentation">
    <meta property="og:type" content="${page.slug === '' ? 'website' : 'article'}">
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
    <link rel="stylesheet" href="/styles.css">
    <script type="application/ld+json">
${jsonLd}
    </script>
  </head>
  <body>
    <header class="site-header">
      <div class="header-inner">
        <a href="/" class="brand">rig-c<span>v2.61.0</span></a>
        <nav aria-label="Primary" class="site-nav">
          ${navLinks}
        </nav>
      </div>
    </header>
    <main class="site-main">
      ${breadcrumb}
      <div class="meta-bar" role="region" aria-label="Document metadata">
        ${metaItems.join('\n        ')}
      </div>
      <article>
        <h1>${escapeHtml(page.title)}</h1>
${page.html}
      </article>${paginationHtml}
    </main>
    <footer class="site-footer">
      <div class="footer-inner">
        <div>
          <strong>rig-c</strong> — AI-authored 2D rigging and animation toolchain. Static HTML &amp; Markdown built for zero-JS <code>curl</code> and search indexing.
        </div>
        <div class="footer-links">
          <a href="/llms.txt">llms.txt</a>
          <a href="/llms-full.txt">llms-full.txt</a>
          <a href="${mdRoute}">Page Markdown</a>
          <a href="/sitemap.xml">sitemap.xml</a>
          <a href="https://github.com/rig-c">GitHub</a>
          <a href="https://www.npmjs.com/package/rig-c">npm</a>
        </div>
      </div>
    </footer>
  </body>
</html>
`;
}

function buildLlmsTxt(): string {
  const lines: string[] = [
    '# rig-c',
    '',
    '> AI-authored 2D character rigging and animation toolchain, verified before a byte is written. Takes one character painting decomposed into RGBA layers (via See-through) and compiles Spine 4.3 skeleton data (`skeleton.json` + `.atlas`) and self-contained browser/engine models (`skeleton.model.json`) gated by 50 named assertions.',
    '',
    'All pages on https://rig-c.org are served as static semantic HTML (`/<slug>/`) with a clean Markdown mirror (`/<slug>/index.md`). No JavaScript execution is required to fetch or parse any page.',
    '',
    '## Documentation Pages',
    '',
  ];

  for (const page of PAGES) {
    const htmlUrl = `${SITE_ORIGIN}${pagePath(page.slug)}`;
    const mdUrl = `${SITE_ORIGIN}${pageMdPath(page.slug)}`;
    const pkgBadge =
      page.packageName && page.packageVersion
        ? ` (\`${page.packageName}@${page.packageVersion}\`)`
        : '';
    lines.push(
      `- [${page.navLabel}](${htmlUrl}) ([Markdown](${mdUrl}))${pkgBadge}: ${page.summaryForLlms}`,
    );
  }

  lines.push(
    '',
    '## Packages & Latest Versions',
    '',
    '- `rig-c` / `@rig-c/core` (`2.61.0`): The 2D rig compiler (`rigc compile`, `rigc check`, `rigc exam`, `rigc preview`, `rigc render`, `rigc import`, `rigc schema`).',
    '- `@rig-c/parts` (`1.38.0`): Layer assembly, contour/lattice mesh generation, auto-weights, spring chain synthesis, and procedural idle authoring (`rig-parts`).',
    '- `@rig-c/pose` (`0.33.0`): Body-18 pose cleaning, bone-length normalization, and retargeting (`rig-pose`).',
    '- `@rig-c/review` (`0.2.1`): Local human inspection workspace and structured JSON feedback exporter (`rig-review`).',
    '- `@rig-c/play` (`1.12.0`): Spine-free browser player (`<rig-player>`, `mountRig()`, `loadCompiledModel()`) using DOM `matrix()` or single `<canvas>` 2D affine triangular mesh rendering.',
    '- `@rig-c/pixi` (`0.1.1`), `@rig-c/phaser` (`0.1.1`), `@rig-c/three` (`0.1.1`): Spine-free game engine adapters built on `@rig-c/play/core`.',
    '',
    '## Quick Install',
    '',
    '```bash',
    '# Authoring toolchain',
    'npm i -D rig-c @rig-c/parts @rig-c/pose @rig-c/review',
    '',
    '# Browser and engine runtimes (no Spine runtime required)',
    'npm i @rig-c/play @rig-c/pixi @rig-c/phaser @rig-c/three',
    '',
    '# AI Agent Skills (Claude Code, Codex, Cursor, Gemini CLI, OpenCode)',
    'npx skills add rig-c/rigc rig-c/parts rig-c/pose rig-c/play rig-c/review rig-c/adapters',
    '```',
    '',
    '## Full Single-File Corpus',
    '',
    `- [Full Documentation Bundle (llms-full.txt)](${SITE_ORIGIN}/llms-full.txt): Concatenated Markdown of every page on rig-c.org for single-request LLM context ingestion.`,
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
    '> Purpose: Single-request Markdown bundle of all documentation pages on https://rig-c.org for AI agents, RAG pipelines, and curl inspection.',
    '',
  ].join('\n');

  const sections = PAGES.map((page) => {
    const route = pagePath(page.slug);
    const pkgMeta =
      page.packageName && page.packageVersion
        ? `\nPackage: ${page.packageName}@${page.packageVersion}`
        : '';
    return [
      '================================================================================',
      `URL: ${SITE_ORIGIN}${route}`,
      `Markdown: ${SITE_ORIGIN}${pageMdPath(page.slug)}${pkgMeta}`,
      `Repository: ${page.repoUrl}`,
      '================================================================================',
      '',
      page.markdown.trim(),
      '',
    ].join('\n');
  });

  return `${header}\n${sections.join('\n')}`;
}

function buildSitemapXml(): string {
  const urls = PAGES.map((page) => {
    const loc = `${SITE_ORIGIN}${pagePath(page.slug)}`;
    const priority = page.slug === '' ? '1.0' : '0.8';
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

function buildRobotsTxt(): string {
  const agents = [
    '*',
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-Web',
    'anthropic-ai',
    'Google-Extended',
    'Googlebot',
    'Bingbot',
    'PerplexityBot',
    'Amazonbot',
    'Applebot-Extended',
    'Bytespider',
    'CCBot',
    'DuckAssistBot',
    'cohere-ai',
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
  const sourceBanner = resolve(ROOT_DIR, '../rigc/assets/banner.svg');
  if (existsSync(sourceBanner)) {
    const targetBanner = join(ROOT_DIR, 'assets/banner.svg');
    mkdirSync(dirname(targetBanner), { recursive: true });
    copyFileSync(sourceBanner, targetBanner);
  }

  for (let i = 0; i < PAGES.length; i += 1) {
    const page = PAGES[i];
    const htmlRel = page.slug === '' ? 'index.html' : `${page.slug}/index.html`;
    const mdRel = page.slug === '' ? 'index.md' : `${page.slug}/index.md`;

    writeOut(htmlRel, renderHtmlPage(page, i));
    writeOut(mdRel, `${page.markdown.trim()}\n`);
  }

  writeOut('llms.txt', buildLlmsTxt());
  writeOut('llms-full.txt', buildLlmsFullTxt());
  writeOut('sitemap.xml', buildSitemapXml());
  writeOut('robots.txt', buildRobotsTxt());
  writeOut('.nojekyll', '');

  console.log(
    `Built ${PAGES.length} HTML pages, ${PAGES.length} Markdown mirrors, llms.txt, llms-full.txt, sitemap.xml, and robots.txt in ${ROOT_DIR}`,
  );
}

main();
