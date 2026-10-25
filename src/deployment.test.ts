import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, realpathSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { artifactManifest, compareLive, LIVE_MANIFEST_URL, MANIFEST_PATH, parseManifest, verifyManifest, writeManifest } from './deployment.ts';

const directories: string[] = [];
function artifact() {
  const root = mkdtempSync(join(realpathSync(tmpdir()), 'site-artifact-'));
  directories.push(root);
  mkdirSync(join(root, 'assets'));
  writeFileSync(join(root, 'index.html'), '<h1>Same package versions</h1>');
  writeFileSync(join(root, 'assets', 'demo.js'), 'export const frame = 1;');
  writeFileSync(join(root, 'CNAME'), 'rig-c.org');
  return root;
}
afterEach(() => { for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe('complete deployable file set', () => {
  test('manifest is deterministic, self-excluding and independent of filesystem insertion order', () => {
    const first = artifact();
    const second = artifact();
    const manifest = writeManifest(first);
    writeManifest(first);
    const bytes = readFileSync(join(first, MANIFEST_PATH), 'utf8');
    expect(bytes).toBe(`${JSON.stringify(manifest, null, 2)}\n`);
    expect(manifest.files.map((file) => file.path)).toEqual(['CNAME', 'assets/demo.js', 'index.html']);
    // Reinsert a file at the end: only path and content affect the digest.
    unlinkSync(join(second, 'CNAME'));
    writeFileSync(join(second, 'CNAME'), 'rig-c.org');
    expect(artifactManifest(second)).toEqual(manifest);
    expect(verifyManifest(first)).toEqual(manifest);
    expect(parseManifest(bytes)).toEqual(manifest);
  });

  test('an asset-only edit, removal or new file changes the digest with unchanged HTML', () => {
    const root = artifact();
    const before = writeManifest(root);
    writeFileSync(join(root, 'assets', 'demo.js'), 'export const frame = 2;');
    expect(artifactManifest(root).sha256).not.toBe(before.sha256);
    expect(() => verifyManifest(root)).toThrow('differ');
    writeFileSync(join(root, 'assets', 'demo.js'), 'export const frame = 1;');
    unlinkSync(join(root, 'assets', 'demo.js'));
    expect(artifactManifest(root).sha256).not.toBe(before.sha256);
    writeFileSync(join(root, 'assets', 'demo.js'), 'export const frame = 1;');
    writeFileSync(join(root, 'new.txt'), 'new');
    expect(artifactManifest(root).sha256).not.toBe(before.sha256);
  });

  test('rejects files the official upload action would silently exclude', () => {
    const root = artifact();
    writeFileSync(join(root, '.unexpected'), 'lost');
    expect(() => writeManifest(root)).toThrow('Hidden file');
  });
});

describe('current live comparison', () => {
  test('same bytes skip; cache-busting is request-only and changes every time', async () => {
    const manifest = writeManifest(artifact());
    const urls: string[] = [];
    const fetchLive = async (url: string, init: RequestInit) => {
      urls.push(url);
      expect(new URL(url).origin + new URL(url).pathname).toBe(LIVE_MANIFEST_URL);
      expect(init.cache).toBe('no-store');
      expect(init.redirect).toBe('error');
      expect(init.headers).toMatchObject({ 'cache-control': 'no-cache, no-store' });
      expect(init.signal).toBeInstanceOf(AbortSignal);
      return Response.json(manifest);
    };
    const before = JSON.stringify(manifest);
    for (let i = 0; i < 2; i++) {
      expect(await compareLive(manifest, fetchLive)).toEqual({ changed: false, sha256: manifest.sha256,
        liveSha256: manifest.sha256, reason: 'identical' });
    }
    expect(urls[0]).not.toBe(urls[1]);
    expect(JSON.stringify(manifest)).toBe(before);
  });

  test('changed asset or deletion authorizes a new artifact, and only live 404 bootstraps', async () => {
    const root = artifact();
    const live = writeManifest(root);
    writeFileSync(join(root, 'assets', 'demo.js'), 'new bytes');
    expect((await compareLive(artifactManifest(root), async () => Response.json(live))).reason).toBe('different');
    unlinkSync(join(root, 'assets', 'demo.js'));
    expect((await compareLive(artifactManifest(root), async () => Response.json(live))).changed).toBe(true);
    expect((await compareLive(live, async () => new Response('', { status: 404 }))).reason).toBe('initial-404');
  });

  test('HTTP, transport, JSON and invalid-manifest failures are closed', async () => {
    const manifest = writeManifest(artifact());
    for (const status of [401, 403, 429, 500, 503]) {
      await expect(compareLive(manifest, async () => new Response('', { status }))).rejects.toThrow(`HTTP ${status}`);
    }
    await expect(compareLive(manifest, async () => { throw new Error('timeout'); })).rejects.toThrow('timeout');
    for (const body of ['not JSON', '{}', JSON.stringify({ ...manifest, sha256: '0'.repeat(64) }),
      JSON.stringify({ ...manifest, files: [...manifest.files].reverse() }),
      JSON.stringify({ ...manifest, files: [{ path: '../private', bytes: 0, sha256: '0'.repeat(64) }] })]) {
      await expect(compareLive(manifest, async () => new Response(body))).rejects.toThrow();
    }
  });
});
