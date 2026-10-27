import { afterEach, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { htmlRel, mdRoute, PAGES, SITE_ORIGIN } from './content.ts';
import { checkInternalLinks, decodeAttribute, inspectHtml, markdownDocument, siteDocuments } from './links.ts';

const temporary: string[] = [];
function fixture() {
  const root = mkdtempSync(join(realpathSync(tmpdir()), 'site-links-'));
  temporary.push(root);
  for (const [index, page] of PAGES.entries()) {
    const html = join(root, htmlRel(page.route));
    mkdirSync(join(html, '..'), { recursive: true });
    writeFileSync(html, Bun.markdown.html(`# Page ${index}\n\n## Section ${index}`, { headings: { ids: true } }));
    writeFileSync(join(root, mdRoute(page.route)), `# Page ${index}\n\n[Section](#section-${index})`);
  }
  llms(root);
  return root;
}
afterEach(() => { for (const root of temporary.splice(0)) rmSync(root, { recursive: true, force: true }); });
const document = (html: string, route = '/docs/core/', source = 'docs/core/index.html') => ({ html, route, source });

// Controls fixed in issue acceptance: actual IDs are emitted by Bun or explicit markup.
test('same/cross-page, relative, query and absolute same-origin links inspect generated IDs', () => {
  const root = fixture();
  const target = join(root, 'docs/core/index.html');
  writeFileSync(target, Bun.markdown.html('# Core\n\n## café & tea', { headings: { ids: true } }) + '<div id="dialog"></div>');
  const heading = [...inspectHtml(readFileSync(target, 'utf8')).ids].find((id) => id !== 'core' && id !== 'dialog')!;
  const html = `<a href="#${encodeURIComponent(heading)}">unicode</a>
    <a href="index.html?x=1&amp;y=2#dialog">query</a><a href="../core/#dialog">relative</a>
    <a href="${SITE_ORIGIN}/docs/core/#dialog">absolute</a><a href="/docs/core/index.md#dialog">mirror</a>`;
  expect(checkInternalLinks(root, [document(html)])).toEqual([]);
});

test('numeric and named HTML URL/ID entities decode once, including non-ASCII and literal percent', () => {
  const root = fixture();
  writeFileSync(join(root, 'docs/core/index.html'), '<div id="caf&#233; &amp; &copy;"></div><div id="100%"></div><div id="&amp;copy;"></div>');
  expect(checkInternalLinks(root, [document('<a href="#caf&#xE9;%20&amp;%20&copy;">x</a><a href="#100%25">percent</a><a href="#%26copy%3B">one decode</a>')])).toEqual([]);
  expect(decodeAttribute('&NotEqualTilde;')).toBe('≂̸');
});

test('empty # and top work, external/protocol-relative URLs are not local paths', () => {
  const root = fixture();
  expect(checkInternalLinks(root, [document('<a href="#">top</a><a href="#top">top</a><a href="#TOP">top</a><a href="//github.com/rig-c/core#remote">remote</a><a href="mailto:example@example.org">mail</a>')])).toEqual([]);
});

test('missing anchor on existing HTML reports source and original href', () => {
  const root = fixture();
  const href = '/docs/core/?x=1&amp;y=2#planted-missing';
  const errors = checkInternalLinks(root, [document(`<a href="${href}">broken</a>`, '/', 'index.html')]);
  expect(errors).toHaveLength(1);
  expect(errors[0]).toContain('[index.html]');
  expect(errors[0]).toContain(href);
  expect(errors[0]).toContain('Missing anchor #planted-missing');
});

test('missing file, malformed percent, moved routes and non-HTML fragment targets fail explicitly', () => {
  const root = fixture();
  writeFileSync(join(root, 'data.txt'), 'no HTML anchor semantics');
  for (const href of ['/absent/#x', '#bad%zz', '/bad%zz/', '/data.txt#x', '/core/#x']) {
    const errors = checkInternalLinks(root, [document(`<a href="${href}">x</a>`)]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain(href);
  }
  expect(checkInternalLinks(root, [document('<base href="/elsewhere/"><a href="#x">x</a>')])[0]).toContain('Unsupported base href');
});

test('Markdown links use rendered inline, reference, autolink and raw HTML; code/comments are not links', () => {
  const root = fixture();
  const md = `[inline](/docs/core/#section-5) [reference][target]\n\n[target]: /docs/core/index.md#section-5\n\n<${SITE_ORIGIN}/docs/core/#section-5>\n\n<a href="/docs/core/#section-5">raw</a>\n\n\`[code](/absent/)\`\n\n\`\`\`html\n<a href="/absent/">code</a>\n\`\`\`\n\n<!-- <a href="/absent/">comment</a> -->`;
  expect(checkInternalLinks(root, [markdownDocument('mirror.md', '/docs/core/index.md', md)])).toEqual([]);
  expect(checkInternalLinks(root, [markdownDocument('mirror.md', '/docs/core/index.md', '[bad](#missing)')])[0]).toContain('[mirror.md]');
});

function llms(root: string) {
  const full = PAGES.map((page, i) => `================================================================================\nURL: ${SITE_ORIGIN}${page.route}\nMarkdown: ${SITE_ORIGIN}${mdRoute(page.route)}\nRepository: https://github.com/rig-c/core\n================================================================================\n\n# Page ${i}\n\n[Own section](#section-${i})\n`).join('\n');
  writeFileSync(join(root, 'llms-full.txt'), full);
  writeFileSync(join(root, 'llms.txt'), `[Core](${SITE_ORIGIN}/docs/core/index.md#section-5)`);
}

test('llms-full resolves every same-page fragment in original page context; LLM-only defect fails', () => {
  const root = fixture();
  llms(root);
  expect(checkInternalLinks(root, siteDocuments(root))).toEqual([]);
  const fullPath = join(root, 'llms-full.txt');
  writeFileSync(fullPath, readFileSync(fullPath, 'utf8').replace('[Own section](#section-5)', '[Own section](#section-0)'));
  const errors = checkInternalLinks(root, siteDocuments(root));
  expect(errors).toHaveLength(1);
  expect(errors[0]).toContain('[llms-full.txt (/docs/core/)]');
  expect(errors[0]).toContain('#section-0');
});

test('Markdown-only and llms-index-only missing anchors fail; missing/duplicate corpus sections refuse', () => {
  const root = fixture();
  llms(root);
  writeFileSync(join(root, 'docs/core/index.md'), '# Core\n[Bad](#md-only-defect)');
  writeFileSync(join(root, 'llms.txt'), '[Bad](/docs/parts/#llms-index-defect)');
  const errors = checkInternalLinks(root, siteDocuments(root));
  expect(errors).toHaveLength(2);
  expect(errors.some((e) => e.includes('[docs/core/index.md]') && e.includes('#md-only-defect'))).toBe(true);
  expect(errors.some((e) => e.includes('[llms.txt]') && e.includes('#llms-index-defect'))).toBe(true);
  const full = readFileSync(join(root, 'llms-full.txt'), 'utf8');
  writeFileSync(join(root, 'llms-full.txt'), full + full);
  expect(() => siteDocuments(root)).toThrow('Expected one section');
});

test('actual CLI process is RED for planted missing anchor, then GREEN after private fixture repair', async () => {
  const root = fixture();
  const path = join(root, 'docs/core/index.html');
  const good = readFileSync(path, 'utf8');
  writeFileSync(path, good + '<a href="#planted-missing-anchor">planted</a>');
  async function run() {
    const child = Bun.spawn([process.execPath, join(import.meta.dir, 'links.ts'), '--out', root], { stdout: 'pipe', stderr: 'pipe' });
    const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
    return { code, stdout, stderr };
  }
  const red = await run();
  console.log(`PLANTED RED exit=${red.code}: ${red.stderr.trim()}`);
  expect(red.code).toBe(1);
  expect(red.stderr).toContain('[docs/core/index.html] href="#planted-missing-anchor": Missing anchor');
  writeFileSync(path, good);
  const green = await run();
  console.log(`REPAIRED GREEN exit=${green.code}: ${green.stdout.trim()}`);
  expect(green.code).toBe(0);
});

// These are process controls: absent inputs must never become a zero-link PASS.
test('standalone CLI refuses missing output and every expected source, and restored output stays green', async () => {
  const root = fixture();
  async function run(output = root) {
    const child = Bun.spawn([process.execPath, join(import.meta.dir, 'links.ts'), '--out', output], { stdout: 'pipe', stderr: 'pipe' });
    const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
    return { code, stdout, stderr };
  }
  const good = await run();
  expect(good.code).toBe(0);
  expect(good.stdout).toBe('Internal links: 0 error(s)\n');
  const absent = join(root, 'not-built');
  const noOutput = await run(absent);
  expect(noOutput.code).toBe(1);
  expect(noOutput.stderr).toContain(`Missing output directory: ${absent}`);
  expect(noOutput.stdout).toBe('');
  console.log(`INPUT REFUSAL nonexistent exit=${noOutput.code}: ${noOutput.stderr.trim()}`);
  const expected = [...PAGES.flatMap((page) => [htmlRel(page.route), mdRoute(page.route).slice(1)]), 'llms.txt', 'llms-full.txt'];
  for (const path of expected) {
    const absolute = join(root, path);
    const original = readFileSync(absolute);
    try {
      rmSync(absolute);
      const refusal = await run();
      expect(refusal.code).toBe(1);
      expect(refusal.stderr).toContain(`Missing expected source document(s) (regular files required): ${path}.`);
      expect(refusal.stdout).toBe('');
      console.log(`INPUT REFUSAL deleted=${path} exit=${refusal.code}: ${refusal.stderr.trim()}`);
      if (path === 'docs/core/index.md') {
        mkdirSync(absolute);
        const directory = await run();
        expect(directory.code).toBe(1);
        expect(directory.stderr).toContain(path);
        console.log(`INPUT REFUSAL directory=${path} exit=${directory.code}: ${directory.stderr.trim()}`);
        rmSync(absolute, { recursive: true });
      }
    } finally { writeFileSync(absolute, original); }
  }
  const restored = await run();
  expect(restored).toEqual(good);
  console.log(`INPUT RESTORED GREEN exit=${restored.code}: ${restored.stdout.trim()}`);
}, 30_000);
