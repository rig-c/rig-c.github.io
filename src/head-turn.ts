import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { artifactManifest, parseManifest } from './deployment.ts';

export const HEAD_TURN_PATH = 'demos/head-turn';
// Approved ten-file producer inventory; changes require a new producer handoff.
export const HEAD_TURN_BUNDLE_SHA256 = '46477ab4b95d2f6aa2f804d2114f3f9dbc90d280c85c9c7aa58546dc018a5a2d';
export function verifyHeadTurnBundle(root: string): void {
  const demo = join(root, HEAD_TURN_PATH);
  const expected = parseManifest(readFileSync(join(demo, 'bundle-manifest.json'), 'utf8'));
  if (expected.sha256 !== HEAD_TURN_BUNDLE_SHA256 || expected.files.length !== 10
    || artifactManifest(join(demo, 'bundle')).sha256 !== expected.sha256) {
    throw new Error('Head-turn producer bundle differs from the approved ten-file inventory');
  }
}
