import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, realpathSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite } from './build.ts';
import { htmlRel, mdRoute, PAGES, REDIRECTS } from './content.ts';
import { verifyManifest, writeManifest } from './deployment.ts';
import { outputRoot, ROOT_DIR } from './output.ts';
import { verifySite } from './verify.ts';
import { buildForActions } from '../scripts/build-site.ts';

const NAMES = ['rig-c', '@rig-c/parts', '@rig-c/pose', '@rig-c/review', '@rig-c/play', '@rig-c/pixi', '@rig-c/phaser', '@rig-c/three'];
const versions = new Map(NAMES.map((name, i) => [name, `100.0.${i}`]));
const temp = mkdtempSync(join(realpathSync(tmpdir()), 'site-build-'));
const out = join(temp, 'output');
const calls: string[] = [];
const read = (path: string) => readFileSync(join(out, path), 'utf8');
beforeAll(async () => {
  await buildSite({ outDir: out, fetchRegistry: async (url) => {
    const name = decodeURIComponent(new URL(url).pathname.slice(1, -'/latest'.length));
    calls.push(name);
    return Response.json({ name, version: versions.get(name) });
  } });
});
afterAll(() => rmSync(temp, { recursive: true, force: true }));

describe('isolated deployable site', () => {
  test('resolves exactly eight real names once, verifies every route, mirror and redirect', () => {
    expect(calls.sort()).toEqual([...NAMES].sort());
    verifySite(out);
    for (const page of PAGES) {
      expect(read(htmlRel(page.route))).toContain(`<link rel="canonical" href="https://rig-c.org${page.route}">`);
      expect(read(mdRoute(page.route).slice(1))).toStartWith('# ');
    }
    for (const [from, to] of Object.entries(REDIRECTS)) {
      expect(read(htmlRel(from))).toContain(`content="0; url=${to}"`);
    }
    expect(read('CNAME')).toBe(readFileSync(join(ROOT_DIR, 'CNAME'), 'utf8'));
    expect(read('styles.css')).toBe(readFileSync(join(ROOT_DIR, 'styles.css'), 'utf8'));
    const manifest = verifyManifest(out);
    expect(manifest.files.some((file) => file.path === 'assets/banner.svg')).toBe(true);
    expect(manifest.files.some((file) => file.path === 'assets/logo.svg')).toBe(true);
    expect(manifest.files.some((file) => file.path === 'assets/demo.js')).toBe(true);
    expect(manifest.files.some((file) => file.path === 'demos/head-turn/bundle/scene.bin.gz')).toBe(true);
    expect(read('demos/head-turn/index.html')).toBe(readFileSync(join(ROOT_DIR, 'demos/head-turn/index.html'), 'utf8'));
    expect(read('index.html')).not.toContain('head-turn-feature');
    expect(read('examples/index.html').split('Standalone depth-driven head-turn demo; the Parts producer shipped separately in 1.68.0')).toHaveLength(2);
    expect(existsSync(join(out, 'src'))).toBe(false);
    expect(existsSync(join(out, '.nojekyll'))).toBe(false);
  });

  test('HTML adapter cell is three separate escaped code items with line breaks', () => {
    const html = read('index.html');
    const row = (html.match(/<tr>[\s\S]*?<\/tr>/g) ?? []).find((row) => row.includes('href="/docs/adapters/"'));
    expect(row).toBeDefined();
    // Start at the adapter link rather than an earlier table row.
    const cell = row!.slice(row!.indexOf('href="/docs/adapters/"')).match(/<\/td>\s*<td>([\s\S]*?)<\/td>/)?.[1];
    expect(cell).toBe('<code>@rig-c/pixi 100.0.5</code><br><code>@rig-c/phaser 100.0.6</code><br><code>@rig-c/three 100.0.7</code>');
    expect(cell).not.toContain('&lt;br');
    expect(html).toContain('"softwareVersion": "100.0.0"');
  });

  test('Markdown and llms contain all eight on their own lines; table row stays intact', () => {
    for (const path of ['index.md', 'llms.txt', 'llms-full.txt']) {
      const text = read(path);
      for (const name of NAMES) expect(text.split('\n')).toContain(`- \`${name}\`: \`${versions.get(name)}\``);
      expect(text).not.toContain('{{version:');
    }
    const row = read('index.md').split('\n').find((line) => line.startsWith('| [**@rig-c/adapters**]'))!;
    expect(row).toContain('`@rig-c/pixi 100.0.5`; `@rig-c/phaser 100.0.6`; `@rig-c/three 100.0.7`');
    expect(row.endsWith('|')).toBe(true);
    expect(row.split('|')).toHaveLength(6);
  });

  test('current docs metadata is resolved while the live player stays pinned', () => {
    expect(read('docs/play/index.html')).toContain('"version": "100.0.4"');
    expect(read('docs/play/index.html')).toContain('@rig-c/play 1.12.0 running in your browser');
    expect(read('docs/play/index.html')).toContain('c239b09328ca7364361b9761fac817502c09ede0');
    expect(read('llms.txt')).toContain('`@rig-c/play@100.0.4`');
    expect(read('index.md')).toContain('`@rig-c/play`: `100.0.4`');
  });

  test('invalid resolver fixture writes nothing and a CLI fixture is a real red process', async () => {
    const absent = join(temp, 'absent');
    await expect(buildForActions(absent, 'invalid-version')).rejects.toThrow('manifest has no valid version');
    expect(existsSync(absent)).toBe(false);
    expect(readdirSync(temp).sort()).toEqual(['output']);
    const before = verifyManifest(out);
    await expect(buildForActions(out, 'invalid-version')).rejects.toThrow('manifest has no valid version');
    expect(verifyManifest(out)).toEqual(before);
    const child = Bun.spawn([process.execPath, 'scripts/build-site.ts', '--out', absent], {
      cwd: ROOT_DIR, env: { ...process.env, SITE_FAILURE_FIXTURE: 'invalid-version' }, stdout: 'pipe', stderr: 'pipe',
    });
    const [code, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()]);
    expect(code).not.toBe(0);
    expect(stderr).toContain('manifest has no valid version');
    expect(existsSync(absent)).toBe(false);
  });

  test('unrelated nonempty output is refused before fetch or writes and its sentinel survives', async () => {
    const unrelated = join(temp, 'unrelated');
    mkdirSync(unrelated);
    const sentinel = join(unrelated, 'source.txt');
    writeFileSync(sentinel, 'unrelated source must survive');
    let calls = 0;
    await expect(buildSite({ outDir: unrelated, fetchRegistry: async () => {
      calls++;
      throw new Error('Registry must not be reached');
    } })).rejects.toThrow('Refusing to replace nonempty output');
    expect(calls).toBe(0);
    expect(readFileSync(sentinel, 'utf8')).toBe('unrelated source must survive');
    expect(readdirSync(unrelated)).toEqual(['source.txt']);
    expect(readdirSync(temp).sort()).toEqual(['output', 'unrelated']);
    rmSync(unrelated, { recursive: true });
  });

  test('an unrecorded file in a generated output is preserved and blocks replacement', async () => {
    const sentinel = join(out, 'unowned.txt');
    const marker = read('deployment-manifest.json');
    writeFileSync(sentinel, 'preserve this unrecorded file');
    try {
      await expect(buildSite({ outDir: out })).rejects.toThrow('Refusing unknown file');
      expect(readFileSync(sentinel, 'utf8')).toBe('preserve this unrecorded file');
      expect(read('deployment-manifest.json')).toBe(marker);
    } finally {
      rmSync(sentinel);
    }
  });

  test('successful rebuild removes previously recorded stale output even when current bytes changed', async () => {
    const before = verifyManifest(out);
    writeFileSync(join(out, 'removed-route.txt'), 'previously generated');
    writeManifest(out); // The old artifact records ownership of this obsolete route.
    writeFileSync(join(out, 'removed-route.txt'), 'stale changed bytes');
    await buildSite({ outDir: out, fetchRegistry: async (url) => {
      const name = decodeURIComponent(new URL(url).pathname.slice(1, -'/latest'.length));
      return Response.json({ name, version: versions.get(name) });
    } });
    expect(existsSync(join(out, 'removed-route.txt'))).toBe(false);
    expect(verifyManifest(out)).toEqual(before);
    verifySite(out);
  });

  test('verification rejects missing redirects, CNAME or assets even with an updated valid digest', () => {
    for (const path of ['parts/index.html', 'CNAME', 'assets/logo.svg', 'demos/head-turn/bundle/scene.bin.gz', 'demos/head-turn/site-ui.js']) {
      const absolute = join(out, path);
      const original = readFileSync(absolute);
      const manifest = readFileSync(join(out, 'deployment-manifest.json'));
      try {
        rmSync(absolute);
        writeManifest(out);
        expect(() => verifySite(out)).toThrow('Verification failed');
      } finally {
        writeFileSync(absolute, original);
        writeFileSync(join(out, 'deployment-manifest.json'), manifest);
      }
    }
    verifySite(out);
  });

  test('output argument cannot target authored paths or root', () => {
    for (const path of [ROOT_DIR, '..', 'assets', 'content', 'src', 'docs']) expect(() => outputRoot(path)).toThrow();
  });
});
