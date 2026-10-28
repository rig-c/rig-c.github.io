import { describe, expect, test } from 'bun:test';
import { renderSite } from './build.ts';
import { htmlRel, mdRoute, PAGES } from './content.ts';

const names = ['@rig-c/core', '@rig-c/parts', '@rig-c/pose', '@rig-c/review', '@rig-c/play', '@rig-c/pixi', '@rig-c/phaser', '@rig-c/three'];
// Distinct versions catch accidental aliasing, especially independently versioned adapters.
const versions = new Map(names.map((name, index) => [name, `200.${index}.3`]));

function assertConsistent(files: ReadonlyMap<string, string>): void {
  const read = (path: string) => {
    const value = files.get(path);
    if (value === undefined) throw new Error(`Missing surface: ${path}`);
    return value;
  };
  const jsonLd = (html: string) => JSON.parse(html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/)![1]!)['@graph'];
  const landing = read('index.html');
  expect(jsonLd(landing).find((node: any) => node['@type'] === 'SoftwareApplication').softwareVersion).toBe(versions.get('@rig-c/core'));
  for (const [name, version] of versions) {
    for (const path of ['index.md', 'llms.txt', 'llms-full.txt']) {
      expect(read(path).split('\n')).toContain(`- \`${name}\`: \`${version}\``);
    }
  }
  for (const page of PAGES.filter((page) => page.packageName)) {
    const entries = page.packageName!.split(',').map((name) => name.trim());
    const expected = entries.map((name) => ({ name, version: versions.get(name)! }));
    const html = read(htmlRel(page.route));
    if (page.route !== '/') {
      const badges = [...html.matchAll(/<span class="pkg"><code>([^<]+)<\/code> <span class="ver">([^<]+)<\/span><\/span>/g)]
        .map(([, name, version]) => ({ name, version }));
      expect(badges).toEqual(expected);
      expect(jsonLd(html).filter((node: any) => node['@type'] === 'SoftwareSourceCode')
        .map(({ name, version }: any) => ({ name, version }))).toEqual(expected);
      const row = (landing.match(/<tr>[\s\S]*?<\/tr>/g) ?? []).find((row) => row.includes(`href="${page.route}"`))!;
      expect(row).toBeDefined();
      const cell = row.slice(row.indexOf(`href="${page.route}"`)).match(/<\/td>\s*<td>([\s\S]*?)<\/td>/)![1];
      expect(cell).toBe(expected.map(({ name, version }) => `<code>${expected.length > 1 ? `${name} ` : ''}${version}</code>`).join('<br>'));
    }
    const metadata = expected.map(({ name, version }) => `${name}@${version}`).join('; ');
    const md = read(mdRoute(page.route).slice(1));
    expect(md.split('\n').filter((line) => line.startsWith('Latest published (npm at build time):')))
      .toEqual([`Latest published (npm at build time): ${expected.map(({ name, version }) => `\`${name}@${version}\``).join('; ')}.`]);
    expect(read('llms.txt').split('\n').find((line) => line.startsWith(`- [${page.navLabel}]`)))
      .toContain(`(latest published: \`${metadata}\`)`);
    const section = read('llms-full.txt').split(`URL: https://rig-c.org${page.route}\n`)[1]!.split('================================================================================')[0]!;
    expect(section).toContain(`Latest published packages (npm at build time): ${metadata}\n`);
    expect(read('llms-full.txt')).toContain(md.trim());
  }
}

describe('one current package version across all published surfaces', () => {
  test('complete build agrees across badges, homepage, structured data and Markdown/LLM mirrors', () => {
    const files = renderSite(versions);
    assertConsistent(files);
  });

  test('canonical package identities stay separate from convenience installs, commands and history', () => {
    const files = renderSite(versions);
    const landing = files.get('index.html')!;
    const graph = JSON.parse(landing.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/)![1]!)['@graph'];
    const core = graph.find((node: any) => node['@type'] === 'SoftwareApplication');
    expect(core.name).toBe('@rig-c/core');
    expect(core.downloadUrl).toBe('https://www.npmjs.com/package/@rig-c/core');
    expect(graph.find((node: any) => node['@type'] === 'WebSite').name).toBe('rig-c');
    for (const path of ['index.md', 'llms.txt', 'llms-full.txt']) {
      const text = files.get(path)!;
      expect(text).toContain('bun add -d @rig-c/core');
      expect(text).toContain('Legacy');
      expect(text).not.toContain('bunx rig-pose');
      expect(text).not.toContain('@rig-c/adapters');
      expect(text).toContain('rig-pose');
      expect(text).toContain('not published');
    }
    expect(files.get('docs/pose/index.md')).toContain('bun run rig-pose retarget');
    expect(files.get('docs/core/index.md')).toContain('bunx rig-c@2.61.0 build');
    expect(files.get('docs/getting-started/index.md')).toContain('rig-c@2.65.1');
    expect(files.get('docs/adapters/index.md')).toContain('from `rig-c/core`');
    const aliasOnly = new Map(versions);
    aliasOnly.delete('@rig-c/core');
    aliasOnly.set('rig-c', '999.0.0');
    expect(() => renderSite(aliasOnly)).toThrow('npm latest version not resolved for @rig-c/core');
  });

  test('a planted disagreement in one rendered badge is rejected without changing source files', () => {
    const files = renderSite(versions);
    const path = 'docs/parts/index.html';
    const original = files.get(path)!;
    const planted = original.replace('<span class="ver">200.1.3</span>', '<span class="ver">999.0.0</span>');
    expect(planted).not.toBe(original);
    files.set(path, planted);
    expect(() => assertConsistent(files)).toThrow();
    files.set(path, original);
    assertConsistent(files);
  });

  test('missing adapter resolution refuses rather than falling back to authored or another adapter version', () => {
    const missing = new Map(versions);
    missing.delete('@rig-c/three');
    expect(() => renderSite(missing)).toThrow('npm latest version not resolved for @rig-c/three');
  });

  test('current labels do not replace historical player and recording pins', () => {
    const files = renderSite(versions);
    expect(files.get('docs/play/index.html')).toContain('@rig-c/play 1.12.0 running in your browser');
    expect(files.get('docs/pose/index.md')).toContain('`@rig-c/pose` 0.35.0 and `rig-c` 2.61.0');
    expect(files.get('docs/adapters/index.html')).toContain('<code>@rig-c/pixi</code> 0.1.1 on PixiJS 8.22.0');
    expect(files.get('docs/review/index.html')).toContain('<code>rig-review</code> 0.7.1');
  });
});
