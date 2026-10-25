import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { artifactManifest, verifyManifest } from './deployment.ts';
import { DEFAULT_OUTPUT, outputRoot, parseOutputArgs, ROOT_DIR as SOURCE_ROOT } from './output.ts';
import { htmlRel, mdRoute, PAGES, REDIRECTS, SITE_ORIGIN } from './content.ts';

function resolveLocalHref(href: string, ROOT_DIR: string): string | null {
  const clean = href.split('#')[0]?.split('?')[0] ?? '';
  if (!clean.startsWith('/')) {
    return null;
  }
  if (clean === '/') {
    return join(ROOT_DIR, 'index.html');
  }
  if (clean.endsWith('/')) {
    return join(ROOT_DIR, clean.slice(1), 'index.html');
  }
  return join(ROOT_DIR, clean.slice(1));
}

export function verifySite(outDir = DEFAULT_OUTPUT): void {
  const ROOT_DIR = outputRoot(outDir);
  const errors: string[] = [];

  for (const requiredFile of [
    'CNAME',
    'deployment-manifest.json',
    'styles.css',
    'llms.txt',
    'llms-full.txt',
    'sitemap.xml',
    'robots.txt',
  ]) {
    if (!existsSync(join(ROOT_DIR, requiredFile))) {
      errors.push(`Missing root file: ${requiredFile}`);
    }
  }

  const sitemap = existsSync(join(ROOT_DIR, 'sitemap.xml'))
    ? readFileSync(join(ROOT_DIR, 'sitemap.xml'), 'utf8')
    : '';
  const llmsTxt = existsSync(join(ROOT_DIR, 'llms.txt'))
    ? readFileSync(join(ROOT_DIR, 'llms.txt'), 'utf8')
    : '';
  const llmsFullTxt = existsSync(join(ROOT_DIR, 'llms-full.txt'))
    ? readFileSync(join(ROOT_DIR, 'llms-full.txt'), 'utf8')
    : '';

  for (const page of PAGES) {
    const route = page.route;
    const htmlPath = join(ROOT_DIR, htmlRel(route));
    const mdPath = join(ROOT_DIR, mdRoute(route).slice(1));

    if (!existsSync(htmlPath)) {
      errors.push(`[${route}] Missing HTML file: ${htmlRel(route)}`);
      continue;
    }
    if (!existsSync(mdPath)) {
      errors.push(`[${route}] Missing Markdown file: ${mdRoute(route)}`);
      continue;
    }

    const html = readFileSync(htmlPath, 'utf8');
    const md = readFileSync(mdPath, 'utf8');

    if (!md.startsWith('# ')) {
      errors.push(`[${route}] Markdown mirror does not start with an H1 heading (# )`);
    }

    const h1Matches = html.match(/<h1\b[^>]*>/g) ?? [];
    if (h1Matches.length !== 1) {
      errors.push(`[${route}] Expected exactly 1 <h1>, found ${h1Matches.length}`);
    }

    // Code samples may show a style attribute as text; the page's own markup may not carry one.
    if (/\sstyle\s*=/i.test(html.replace(/<pre>[\s\S]*?<\/pre>/g, ''))) {
      errors.push(`[${route}] Found forbidden inline style= attribute`);
    }

    const expectedCanonical = `<link rel="canonical" href="${SITE_ORIGIN}${route}">`;
    if (!html.includes(expectedCanonical)) {
      errors.push(`[${route}] Missing expected canonical tag: ${expectedCanonical}`);
    }

    const jsonLdMatch = html.match(
      /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
    );
    if (!jsonLdMatch || !jsonLdMatch[1]) {
      errors.push(`[${route}] Missing application/ld+json script block`);
    } else {
      try {
        JSON.parse(jsonLdMatch[1]);
      } catch (err) {
        errors.push(`[${route}] Invalid JSON-LD: ${String(err)}`);
      }
    }

    const hrefRegex = /href="([^"]+)"/g;
    let match: RegExpExecArray | null = hrefRegex.exec(html);
    while (match !== null) {
      const href = match[1] ?? '';
      const targetPath = resolveLocalHref(href, ROOT_DIR);
      if (targetPath && !existsSync(targetPath)) {
        errors.push(`[${route}] Broken internal link href="${href}" -> ${targetPath}`);
      }
      const bare = href.split('#')[0] ?? '';
      if (bare in REDIRECTS) {
        errors.push(`[${route}] Links to moved route ${bare}; link ${REDIRECTS[bare]} instead`);
      }
      match = hrefRegex.exec(html);
    }

    const fullUrl = `${SITE_ORIGIN}${route}`;
    if (!sitemap.includes(`<loc>${fullUrl}</loc>`)) {
      errors.push(`[${route}] Missing ${fullUrl} in sitemap.xml`);
    }
    if (!llmsTxt.includes(fullUrl)) {
      errors.push(`[${route}] Missing ${fullUrl} in llms.txt`);
    }
    if (!llmsFullTxt.includes(`URL: ${fullUrl}`)) {
      errors.push(`[${route}] Missing URL: ${fullUrl} in llms-full.txt`);
    }
    if (md.includes('{{') || html.includes('{{')) {
      errors.push(`[${route}] Unexpanded template token`);
    }
  }

  for (const [from, to] of Object.entries(REDIRECTS)) {
    const stubPath = join(ROOT_DIR, htmlRel(from));
    if (!existsSync(stubPath)) {
      errors.push(`[${from}] Missing redirect stub`);
      continue;
    }
    const stub = readFileSync(stubPath, 'utf8');
    if (!stub.includes(`url=${to}"`) || !stub.includes(`href="${SITE_ORIGIN}${to}"`)) {
      errors.push(`[${from}] Redirect stub does not point at ${to}`);
    }
    if (!PAGES.some((p) => p.route === to)) {
      errors.push(`[${from}] Redirect target ${to} is not a page`);
    }
    if (sitemap.includes(`<loc>${SITE_ORIGIN}${from}</loc>`)) {
      errors.push(`[${from}] Moved route is still in sitemap.xml`);
    }
  }

  // A valid digest alone cannot prove that authored assets were copied completely.
  for (const file of ['CNAME', 'styles.css']) {
    if (!existsSync(join(ROOT_DIR, file)) || !readFileSync(join(SOURCE_ROOT, file)).equals(readFileSync(join(ROOT_DIR, file)))) {
      errors.push(`Authored static file missing or changed: ${file}`);
    }
  }
  try {
    const sourceAssets = artifactManifest(join(SOURCE_ROOT, 'assets')).files;
    const outputAssets = artifactManifest(join(ROOT_DIR, 'assets')).files;
    if (JSON.stringify(sourceAssets) !== JSON.stringify(outputAssets)) errors.push('Authored asset file set differs');
    verifyManifest(ROOT_DIR);
  } catch (error) {
    errors.push(String(error));
  }

  if (errors.length > 0) {
    console.error('Verification failed:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    throw new Error(`Verification failed with ${errors.length} error(s)`);
  }

  console.log(
    `PASS: Verified ${PAGES.length} static HTML pages, ${PAGES.length} Markdown mirrors, ${Object.keys(REDIRECTS).length} redirect stubs, JSON-LD schemas, canonical tags, internal links, llms.txt, llms-full.txt, sitemap.xml, and robots.txt.`,
  );
}

if (import.meta.main) verifySite(parseOutputArgs());
