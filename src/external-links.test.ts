import { expect, spyOn, test } from 'bun:test';
import { checkExternalLinks, documentationLinks, EXTERNAL_BOUNDS, repositoryDoc, type DocumentationLink } from './external-links.ts';
import { markdownDocument } from './links.ts';

const link = (url = 'https://github.com/rig-c/core#section'): DocumentationLink => ({ url, sources: ['docs/core/index.html'] });
const fake = (handler: (url: string, init: RequestInit) => Response | Promise<Response>) =>
  ((url: string | URL | Request, init?: RequestInit) => handler(String(url), init!)) as typeof fetch;

test('only public rig-c repository roots and document blobs enter the bounded report', () => {
  const allowed = ['https://github.com/rig-c/core', 'https://github.com/rig-c/core/blob/main/docs/AUTHORING.md#x', 'https://github.com/rig-c/core/blob/main/LICENSE'];
  const excluded = ['https://example.org/doc.md', 'https://github.com/else/core', 'https://github.com/rig-c/core/issues/88', 'https://github.com/rig-c/core/tree/main/docs', 'https://github.com/rig-c/core/blob/main/src/run.ts', 'https://token@github.com/rig-c/core', 'http://github.com/rig-c/core', 'https://raw.githubusercontent.com/rig-c/core/main/README.md'];
  for (const url of allowed) expect(repositoryDoc(new URL(url))).toBe(true);
  for (const url of excluded) expect(repositoryDoc(new URL(url))).toBe(false);
  const md = [...allowed, ...excluded].map((url) => `[doc](${url})`).join('\n');
  const documents = [markdownDocument('one.md', '/', md), markdownDocument('two.md', '/', md)];
  const links = documentationLinks(documents);
  expect(links).toHaveLength(allowed.length);
  expect(links.every((item) => item.sources.join(',') === 'one.md,two.md')).toBe(true);
});

test('one page request covers multiple fragments, actual IDs establish presence, absent GitHub IDs stay unknown', async () => {
  let calls = 0;
  const report = await checkExternalLinks([link(), link('https://github.com/rig-c/core#dynamic'), link('https://github.com/rig-c/core')], fake((url, init) => {
    calls++;
    expect(url).toBe('https://github.com/rig-c/core');
    expect(init.credentials).toBe('omit');
    expect(init.redirect).toBe('manual');
    const headers = new Headers(init.headers);
    expect(headers.has('authorization')).toBe(false);
    expect(headers.has('cookie')).toBe(false);
    return new Response('<h2 id="user-content-section">Section</h2>', { headers: { 'content-type': 'text/html' } });
  }));
  expect(calls).toBe(1);
  expect(report.results.map((item) => item.anchor)).toEqual(['present', 'unknown', 'not-requested']);
  expect(report.missing).toBe(0);
  expect(report.results[0]!.sha256).toHaveLength(64);
});

for (const [http, status, headers] of [
  [404, 'missing', {}], [410, 'missing', {}], [401, 'auth', {}], [403, 'auth', {}],
  [403, 'rate-limit', { 'x-ratelimit-remaining': '0' }], [429, 'rate-limit', {}],
  [500, 'transient', {}], [503, 'transient', {}], [408, 'transient', {}], [418, 'unknown', {}],
] as const) {
  test(`HTTP ${http} / ${status} is classified without retries`, async () => {
    const report = await checkExternalLinks([link()], fake(() => new Response('', { status: http, headers })));
    expect(report.requests).toBe(1);
    expect(report.results[0]!.status).toBe(status);
    expect(report.results[0]!.anchor).toBe('unknown');
    expect(report.missing).toBe(status === 'missing' ? 1 : 0);
  });
}

test('redirects remain in scope, count toward request limit, stop at two hops, never forward credentials', async () => {
  const locations: string[] = [];
  const report = await checkExternalLinks([link()], fake((url, init) => {
    locations.push(url);
    expect(new Headers(init.headers).has('authorization')).toBe(false);
    return new Response('', { status: 302, headers: { location: `${url}/` } });
  }));
  expect(report.requests).toBe(3);
  expect(report.results[0]!.status).toBe('redirect');
  expect(locations).toHaveLength(3);
  for (const location of ['https://example.org/doc', 'https://secret@github.com/rig-c/core', '/login']) {
    let calls = 0;
    const blocked = await checkExternalLinks([link()], fake(() => { calls++; return new Response('', { status: 302, headers: { location } }); }));
    expect(calls).toBe(1);
    expect(blocked.results[0]!.status).toBe('redirect');
    expect(blocked.missing).toBe(0);
  }
});

test('declared and streamed byte limits produce uncertainty and cancel oversized responses', async () => {
  const declared = await checkExternalLinks([link()], fake(() => new Response('x', { headers: { 'content-length': String(EXTERNAL_BOUNDS.responseBytes + 1) } })));
  expect(declared.results[0]!.status).toBe('body-limit');
  let cancelled = false;
  const streamed = await checkExternalLinks([link()], fake(() => new Response(new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(EXTERNAL_BOUNDS.responseBytes + 1)); },
    cancel() { cancelled = true; },
  }))));
  expect(streamed.results[0]!.status).toBe('body-limit');
  expect(cancelled).toBe(true);
});

test('request budget is strict and out-of-scope input makes no request', async () => {
  const links = Array.from({ length: EXTERNAL_BOUNDS.requests + 2 }, (_, i) => link(`https://github.com/rig-c/repo-${i}`));
  links.push(link('https://example.org/not-in-scope'));
  const report = await checkExternalLinks(links, fake(() => new Response('ok')));
  expect(report.requests).toBe(EXTERNAL_BOUNDS.requests);
  expect(report.results.filter((item) => item.status === 'budget')).toHaveLength(2);
  expect(report.results.at(-1)!.status).toBe('unknown');
});

test('elapsed total-time budget stops further requests', async () => {
  let now = 1_000;
  const clock = spyOn(Date, 'now').mockImplementation(() => now);
  try {
    const report = await checkExternalLinks([link(), link('https://github.com/rig-c/parts')], fake(() => {
      now += EXTERNAL_BOUNDS.totalMs + 1;
      return new Response('ok');
    }));
    expect(report.requests).toBe(1);
    expect(report.results[1]!.status).toBe('budget');
  } finally { clock.mockRestore(); }
});

test('network errors are uncertain and do not retry', async () => {
  const report = await checkExternalLinks([link()], fake(() => { throw new Error('fixture connection refused'); }));
  expect(report.requests).toBe(1);
  expect(report.results[0]!.status).toBe('network');
  expect(report.missing).toBe(0);
});

test('timeout aborts the request and remains uncertain', async () => {
  const report = await checkExternalLinks([link()], fake((_url, init) => new Promise((_resolve, reject) => {
    init.signal!.addEventListener('abort', () => reject(new Error('fixture abort')), { once: true });
  })));
  expect(report.results[0]!.status).toBe('timeout');
  expect(report.requests).toBe(1);
  expect(report.missing).toBe(0);
}, 10_000);
