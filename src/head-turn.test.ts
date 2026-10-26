import { expect, test } from 'bun:test';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT_DIR } from './output.ts';
import { CURVATURE_PATH, HEAD_TURN_PATH, verifyCurvaturePage, verifyHeadTurnBundle } from './head-turn.ts';
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
    .replace('<a id="curvature-link" href="../curvature/">Curvature check</a>', '')
    .replace('A preview of an upcoming @rig-c/parts feature; the producer is in progress.', 'Depth-driven head turn: a preview of an upcoming @rig-c/parts feature (the producer is in progress)')
    .replace('<button id="controls-toggle" type="button" aria-controls="head-turn-controls" aria-expanded="false">Controls</button><section id="head-turn-controls" class="controls"', '<section class="controls"');
  expect(restored).toBe(original);
  expect(entry).toContain('<div id="loading" role="status">Loading the depth demo…</div>');
  const caption = 'Depth-driven head turn: a preview of an upcoming @rig-c/parts feature; the producer is in progress';
  const examples = read('content/examples.md');
  expect(examples.split(caption)).toHaveLength(2);
  expect(examples).toContain('](/demos/head-turn/)');
  expect(read('content/index.md')).not.toContain('/demos/head-turn/');
});

test('curvature check is a self-contained page linked both ways from the head-turn preview', () => {
  expect(verifyCurvaturePage(ROOT_DIR)).toEqual([]);
  const entry = read(`${HEAD_TURN_PATH}/index.html`);
  expect(entry.split('href="../curvature/"')).toHaveLength(2);
  const page = read(`${CURVATURE_PATH}/index.html`);
  expect(page).not.toMatch(/(?:src|href)="(?:https?:)?\/\/(?!rig-c\.org\/demos\/head-turn\/curvature\/")/);
  expect(read(`${CURVATURE_PATH}/curvature.js`)).not.toMatch(/https?:\/\//);
});

test('curvature check verification names a missing file and a broken reference', () => {
  const copy = mkdtempSync(join(tmpdir(), 'curvature-'));
  try {
    cpSync(join(ROOT_DIR, 'demos'), join(copy, 'demos'), { recursive: true });
    rmSync(join(copy, CURVATURE_PATH, 'depth.webp'));
    expect(verifyCurvaturePage(copy).join('\n')).toContain('Curvature check files differ');
    writeFileSync(join(copy, CURVATURE_PATH, 'depth.webp'), '');
    const html = join(copy, CURVATURE_PATH, 'index.html');
    writeFileSync(html, readFileSync(html, 'utf8').replace('./curvature.css', './missing.css'));
    expect(verifyCurvaturePage(copy)).toEqual(['Curvature check reference does not resolve: ./missing.css']);
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
});
