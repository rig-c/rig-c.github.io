import { createHash } from 'node:crypto';
import { parseOutputArgs } from './output.ts';
import { decodeAttribute, inspectHtml, siteDocuments, type LinkDocument } from './links.ts';
import { SITE_ORIGIN } from './content.ts';

export const EXTERNAL_BOUNDS = Object.freeze({
  requests: 40, redirects: 2, responseBytes: 1_048_576, requestMs: 5_000, totalMs: 45_000,
});
export type ExternalStatus = 'ok' | 'missing' | 'auth' | 'rate-limit' | 'transient'
  | 'timeout' | 'network' | 'body-limit' | 'budget' | 'redirect' | 'unknown';
export interface DocumentationLink { url: string; sources: string[] }
export interface ExternalResult extends DocumentationLink {
  status: ExternalStatus;
  anchor: 'present' | 'unknown' | 'not-requested';
  http?: number;
  finalUrl?: string;
  bytes?: number;
  sha256?: string;
  detail?: string;
}

// Repository roots expose README documentation. Direct document paths stay on
// github.com/rig-c; directory trees, issue pages, raw hosts and other domains do not.
export function repositoryDoc(url: URL): boolean {
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port || url.username || url.password) return false;
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'rig-c' || !/^[\w.-]+$/.test(parts[1] ?? '')) return false;
  if (parts.length === 2) return true;
  if (parts[2] !== 'blob' || parts.length < 5) return false;
  const file = parts.at(-1)!;
  return /\.(md|mdx|rst|txt)$/i.test(file) || /^(LICENSE|LICENCE|COPYING|NOTICE)$/i.test(file);
}

export function documentationLinks(documents: readonly LinkDocument[]): DocumentationLink[] {
  const links = new Map<string, Set<string>>();
  for (const document of documents) {
    for (const href of inspectHtml(document.html).hrefs) {
      let url: URL;
      try { url = new URL(decodeAttribute(href), `${SITE_ORIGIN}${document.route}`); } catch { continue; }
      if (!repositoryDoc(url)) continue;
      const sources = links.get(url.href) ?? new Set<string>();
      sources.add(document.source);
      links.set(url.href, sources);
    }
  }
  return [...links].sort(([a], [b]) => a.localeCompare(b)).map(([url, sources]) => ({ url, sources: [...sources].sort() }));
}

export async function checkExternalLinks(links: readonly DocumentationLink[], fetchPublic: typeof fetch = fetch) {
  const started = Date.now();
  const deadline = started + EXTERNAL_BOUNDS.totalMs;
  let requests = 0;
  // All fragments of one page share a single request chain and bounded body.
  const cache = new Map<string, { result: Omit<ExternalResult, 'url' | 'sources' | 'anchor'>; ids?: Set<string> }>();
  const results: ExternalResult[] = [];
  async function requestPage(initial: string) {
    let current = initial;
    for (let redirects = 0; ; redirects++) {
      if (requests >= EXTERNAL_BOUNDS.requests || Date.now() >= deadline) return { result: { status: 'budget' as const, detail: 'Request or total-time limit reached' } };
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(EXTERNAL_BOUNDS.requestMs, deadline - Date.now()));
      try {
        requests++;
        const response = await fetchPublic(current, {
          method: 'GET', redirect: 'manual', credentials: 'omit', signal: controller.signal,
          headers: { Accept: 'text/html', 'User-Agent': 'rig-c-site-documentation-links' },
        });
        const http = response.status;
        const result = { http, finalUrl: current };
        if (http >= 300 && http < 400) {
          await response.body?.cancel();
          const location = response.headers.get('location');
          let next: URL;
          try { next = new URL(location ?? '', current); } catch { return { result: { ...result, status: 'redirect' as const, detail: 'Invalid redirect' } }; }
          if (!location || redirects >= EXTERNAL_BOUNDS.redirects || !repositoryDoc(next)) {
            return { result: { ...result, status: 'redirect' as const, detail: 'Redirect refused by scope or hop limit' } };
          }
          next.hash = '';
          current = next.href;
          continue;
        }
        let status: ExternalStatus = 'unknown';
        if (http === 404 || http === 410) status = 'missing';
        else if (http === 429 || ((http === 403) && (response.headers.get('x-ratelimit-remaining') === '0' || response.headers.has('retry-after')))) status = 'rate-limit';
        else if (http === 401 || http === 403) status = 'auth';
        else if (http >= 500 || [408, 425].includes(http)) status = 'transient';
        else if (http >= 200 && http < 300) status = 'ok';
        if (status !== 'ok') { await response.body?.cancel(); return { result: { ...result, status } }; }
        const declared = Number(response.headers.get('content-length'));
        if (declared > EXTERNAL_BOUNDS.responseBytes) {
          await response.body?.cancel();
          return { result: { ...result, status: 'body-limit' as const, detail: 'Declared response exceeds byte limit' } };
        }
        const chunks: Uint8Array[] = [];
        let bytes = 0;
        const reader = response.body?.getReader();
        if (reader) {
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            bytes += chunk.value.byteLength;
            if (bytes > EXTERNAL_BOUNDS.responseBytes) {
              await reader.cancel();
              return { result: { ...result, status: 'body-limit' as const, detail: 'Streamed response exceeds byte limit' } };
            }
            chunks.push(chunk.value);
          }
        }
        const body = Buffer.concat(chunks);
        const sha256 = createHash('sha256').update(body).digest('hex');
        const ids = response.headers.get('content-type')?.toLowerCase().includes('text/html')
          ? inspectHtml(body.toString('utf8')).ids : undefined;
        return { result: { ...result, status, bytes, sha256 }, ids };
      } catch (error) {
        return { result: { status: controller.signal.aborted ? 'timeout' as const : 'network' as const, finalUrl: current, detail: controller.signal.aborted ? 'Request/total deadline reached' : String(error) } };
      } finally { clearTimeout(timer); }
    }
  }
  for (const link of links) {
    const url = new URL(link.url);
    if (!repositoryDoc(url)) {
      results.push({ ...link, status: 'unknown', anchor: 'unknown', detail: 'Outside repository-document scope; no request' });
      continue;
    }
    let fragment: string;
    try { fragment = decodeURIComponent(url.hash.slice(1)); } catch {
      results.push({ ...link, status: 'unknown', anchor: 'unknown', detail: 'Invalid fragment encoding' });
      continue;
    }
    url.hash = '';
    let page = cache.get(url.href);
    if (!page) { page = await requestPage(url.href); cache.set(url.href, page); }
    // GitHub renders some headings dynamically and prefixes some IDs. Observing
    // an ID proves presence; failing to extract one never proves absence.
    const present = page.ids?.has(fragment) || page.ids?.has(`user-content-${fragment}`);
    results.push({ ...link, ...page.result, anchor: !fragment ? 'not-requested' : present ? 'present' : 'unknown' });
  }
  return {
    schema: 1, startedAt: new Date(started).toISOString(), elapsedMs: Date.now() - started,
    scope: 'Unauthenticated public https://github.com/rig-c repository roots and blob documentation links from generated pages/mirrors/LLM sections; no crawl or retries. Unobserved GitHub anchors are unknown.',
    bounds: EXTERNAL_BOUNDS, requests, links: results.length,
    missing: results.filter((result) => result.status === 'missing').length,
    results,
  };
}

if (import.meta.main) {
  const report = await checkExternalLinks(documentationLinks(siteDocuments(parseOutputArgs())));
  console.log(JSON.stringify(report, null, 2));
  if (report.missing) process.exitCode = 1;
}
