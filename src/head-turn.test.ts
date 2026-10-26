import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT_DIR } from './output.ts';
import { HEAD_TURN_PATH, verifyHeadTurnBundle } from './head-turn.ts';
const read = (path: string) => readFileSync(join(ROOT_DIR, path), 'utf8');

test('approved producer bundle is byte exact, including original entry and raw gzip', () => {
  verifyHeadTurnBundle(ROOT_DIR);
  const gzip = readFileSync(join(ROOT_DIR, HEAD_TURN_PATH, 'bundle/scene.bin.gz'));
  expect([...gzip.subarray(0, 2)]).toEqual([31, 139]);
});

test('site entry changes only caption and integration UI; original resources still use bundle base', () => {
  const original = read(`${HEAD_TURN_PATH}/bundle/index.html`);
  const entry = read(`${HEAD_TURN_PATH}/index.html`);
  const restored = entry
    .replace('<base href="./bundle/">', '')
    .replace('<link rel="stylesheet" href="../site-ui.css"><script src="../site-ui.js" defer></script><link rel="canonical" href="https://rig-c.org/demos/head-turn/">', '')
    .replace('A preview of an upcoming @rig-c/parts feature; the producer is in progress.', 'Depth-driven head turn: a preview of an upcoming @rig-c/parts feature (the producer is in progress)')
    .replace('<button id="controls-toggle" type="button" aria-controls="head-turn-controls" aria-expanded="false">Controls</button><section id="head-turn-controls" class="controls"', '<section class="controls"');
  expect(restored).toBe(original);
  expect(entry).toContain('<div id="loading" role="status">Loading the depth demo…</div>');
  const caption = 'Depth-driven head turn: a preview of an upcoming @rig-c/parts feature; the producer is in progress';
  const landing = read('content/index.md');
  expect(landing.split(caption)).toHaveLength(2);
  expect(landing.indexOf('/demos/head-turn/')).toBeLessThan(landing.indexOf('## From loose parts'));
});
