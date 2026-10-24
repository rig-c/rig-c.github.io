import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { publishedVersions, versionLabel } from './versions.ts';

describe('build-time npm versions', () => {
  test('fetches each exact package once and records the response digest', async () => {
    const calls: string[] = [];
    const body = '{"name":"@rig-c/pose","version":"1.0.2"}';
    const versions = await publishedVersions(['@rig-c/pose', '@rig-c/pose'], async (url, init) => {
      calls.push(url);
      expect(init.cache).toBe('no-store');
      expect(init.signal).toBeInstanceOf(AbortSignal);
      return new Response(body);
    });
    expect(calls).toEqual(['https://registry.npmjs.org/%40rig-c%2Fpose/latest']);
    expect(versions).toEqual([{ name: '@rig-c/pose', version: '1.0.2', url: calls[0],
      sha256: createHash('sha256').update(body).digest('hex') }]);
  });

  test('labels independently versioned adapters instead of taking only the first', () => {
    const names = ['@rig-c/pixi', '@rig-c/phaser', '@rig-c/three'];
    expect(versionLabel(names, new Map(names.map((name, i) => [name, `0.${i}.1`]))))
      .toBe('pixi 0.0.1 / phaser 0.1.1 / three 0.2.1');
    expect(() => versionLabel(['rig-c'], new Map())).toThrow('not resolved for rig-c');
  });

  test('HTTP errors name the package and exact registry endpoint', async () => {
    await expect(publishedVersions(['rig-c'], async () => new Response('unavailable', { status: 503 })))
      .rejects.toThrow('npm latest lookup failed for rig-c (https://registry.npmjs.org/rig-c/latest): HTTP 503');
  });

  test('network and timeout errors are fatal without fallback', async () => {
    for (const message of ['connection refused', 'The operation timed out.']) {
      await expect(publishedVersions(['rig-c'], async () => { throw new Error(message); }))
        .rejects.toThrow(message);
    }
  });

  test('malformed JSON is fatal', async () => {
    await expect(publishedVersions(['rig-c'], async () => new Response('not JSON')))
      .rejects.toThrow('npm latest lookup failed for rig-c');
  });

  test('wrong package identity, missing version and unsafe version text are fatal', async () => {
    for (const manifest of [
      { name: '@rig-c/core', version: '1.0.0' },
      { name: 'rig-c' },
      { name: 'rig-c', version: '<script>' },
    ]) {
      await expect(publishedVersions(['rig-c'], async () => Response.json(manifest)))
        .rejects.toThrow('npm latest lookup failed for rig-c');
    }
  });
});
