import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { htmlRel, mdRoute, PAGES, REDIRECTS, SITE_ORIGIN } from './content.ts';

const ROOT_DIR = resolve(import.meta.dir, '..');

function resolveLocalHref(href: string): string | null {
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

function main(): void {
  const errors: string[] = [];

  for (const requiredFile of [
    'styles.css',
    'llms.txt',
    'llms-full.txt',
    'sitemap.xml',
    'robots.txt',
    '.nojekyll',
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

    if (/\sstyle\s*=/i.test(html)) {
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
      const targetPath = resolveLocalHref(href);
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

  if (errors.length > 0) {
    console.error('Verification failed:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(
    `PASS: Verified ${PAGES.length} static HTML pages, ${PAGES.length} Markdown mirrors, ${Object.keys(REDIRECTS).length} redirect stubs, JSON-LD schemas, canonical tags, internal links, llms.txt, llms-full.txt, sitemap.xml, and robots.txt.`,
  );
}

main();
