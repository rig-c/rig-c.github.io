import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { parseOutputArgs } from './output.ts';
import { htmlRel, mdRoute, PAGES, REDIRECTS, SITE_ORIGIN } from './content.ts';

export interface LinkDocument {
  source: string;
  route: string;
  html: string;
}

// Generated markup uses semicolon-terminated HTML entities. Let Bun's entity table
// decode those references without interpreting the rest of an attribute as Markdown.
export function decodeAttribute(value: string): string {
  return value.replace(/&(?:#[xX][\da-fA-F]+|#\d+|[a-zA-Z][\da-zA-Z]+);/g,
    (entity) => Bun.markdown.render(entity, { text: (text) => text }));
}

export function inspectHtml(html: string): { ids: Set<string>; hrefs: string[]; base: boolean } {
  const ids = new Set<string>();
  const hrefs: string[] = [];
  let base = false;
  new HTMLRewriter()
    .on('[id]', { element: (element) => { ids.add(decodeAttribute(element.getAttribute('id')!)); } })
    .on('[href]', { element: (element) => { hrefs.push(element.getAttribute('href')!); } })
    .on('base[href]', { element: () => { base = true; } })
    .transform(html);
  return { ids, hrefs, base };
}

export function markdownDocument(source: string, route: string, markdown: string): LinkDocument {
  // Resolve inline/reference/autolinks and raw HTML through the site's own renderer.
  return { source, route, html: Bun.markdown.html(markdown, { headings: { ids: true } }) };
}

export function siteDocuments(root: string): LinkDocument[] {
  const documents: LinkDocument[] = [];
  const read = (path: string) => readFileSync(join(root, path), 'utf8');
  for (const page of PAGES) {
    const html = htmlRel(page.route);
    const md = mdRoute(page.route).slice(1);
    if (existsSync(join(root, html))) documents.push({ source: html, route: page.route, html: read(html) });
    if (existsSync(join(root, md))) documents.push(markdownDocument(md, `/${md}`, read(md)));
  }
  if (existsSync(join(root, 'llms.txt'))) documents.push(markdownDocument('llms.txt', '/llms.txt', read('llms.txt')));
  if (existsSync(join(root, 'llms-full.txt'))) {
    const full = read('llms-full.txt');
    const marker = /^={80}\nURL: (https:\/\/rig-c\.org\/[^\n]*)\nMarkdown: [^\n]+(?:\nLatest published packages \(npm at build time\): [^\n]+)?\nRepository: [^\n]+\n={80}\n/gm;
    const sections = [...full.matchAll(marker)];
    for (const page of PAGES) {
      if (sections.filter((section) => section[1] === `${SITE_ORIGIN}${page.route}`).length !== 1) {
        throw new Error(`[llms-full.txt] Expected one section for ${page.route}`);
      }
    }
    if (sections.length !== PAGES.length) throw new Error('[llms-full.txt] Unexpected page sections');
    const start = sections[0]?.index ?? full.length;
    documents.push(markdownDocument('llms-full.txt header', '/llms-full.txt', full.slice(0, start)));
    sections.forEach((section, index) => {
      const route = new URL(section[1]!).pathname;
      const body = full.slice(section.index! + section[0].length, sections[index + 1]?.index ?? full.length);
      documents.push(markdownDocument(`llms-full.txt (${route})`, route, body));
    });
  }
  return documents;
}

export function checkInternalLinks(root: string, documents: readonly LinkDocument[]): string[] {
  const errors: string[] = [];
  const anchorCache = new Map<string, Set<string>>();
  const mirrors = new Map(PAGES.map((page) => [mdRoute(page.route), htmlRel(page.route)]));
  const absoluteRoot = resolve(root);
  for (const document of documents) {
    const markup = inspectHtml(document.html);
    if (markup.base) {
      errors.push(`[${document.source}] Unsupported base href in generated page`);
      continue;
    }
    for (const original of markup.hrefs) {
      const fail = (reason: string) => errors.push(`[${document.source}] href="${original}": ${reason}`);
      try {
        const href = decodeAttribute(original);
        const url = new URL(href, `${SITE_ORIGIN}${document.route}`);
        if (url.origin !== SITE_ORIGIN) continue;
        const pathname = decodeURIComponent(url.pathname);
        const fragment = decodeURIComponent(url.hash.slice(1));
        if (pathname in REDIRECTS) fail(`Moved route ${pathname}; use ${REDIRECTS[pathname]}`);
        let target = resolve(absoluteRoot, `.${pathname}`);
        const rel = relative(absoluteRoot, target);
        if (rel === '..' || rel.startsWith(`..${sep}`)) { fail('Target escapes output directory'); continue; }
        if (pathname.endsWith('/') || (existsSync(target) && statSync(target).isDirectory())) target = join(target, 'index.html');
        if (!existsSync(target) || !statSync(target).isFile()) { fail(`Missing target ${pathname}`); continue; }
        if (!fragment) continue; // An empty # navigates to the top of an existing resource.
        const mirror = mirrors.get(pathname);
        if (mirror) target = join(absoluteRoot, mirror);
        if (!existsSync(target)) { fail(`Missing HTML anchor target for ${pathname}`); continue; }
        if (!['.html', '.htm'].includes(extname(target).toLowerCase())) {
          fail(`Cannot validate fragment #${fragment} on non-HTML target ${pathname}`);
          continue;
        }
        let ids = anchorCache.get(target);
        if (!ids) { ids = inspectHtml(readFileSync(target, 'utf8')).ids; anchorCache.set(target, ids); }
        if (!ids.has(fragment) && fragment.toLowerCase() !== 'top') fail(`Missing anchor #${fragment} in ${pathname}`);
      } catch (error) {
        fail(`Invalid local URL or target: ${String(error)}`);
      }
    }
  }
  return errors;
}

if (import.meta.main) {
  const root = parseOutputArgs();
  const errors = checkInternalLinks(root, siteDocuments(root));
  for (const error of errors) console.error(error);
  console.log(`Internal links: ${errors.length} error(s)`);
  if (errors.length) process.exitCode = 1;
}
