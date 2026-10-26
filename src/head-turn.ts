import { existsSync, readdirSync, readFileSync } from 'node:fs';
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

// Curvature check: a static shader page over the original painting and its depth map, no rig.
export const CURVATURE_PATH = `${HEAD_TURN_PATH}/curvature`;
export const CURVATURE_FILES = ['curvature.css', 'curvature.js', 'depth.webp', 'index.html', 'original.webp'];
export const CURVATURE_CAPTION = 'Curvature check: the original painting displaced by its depth map, with no rig. A tool for reading the depth, not the head-turn feature.';
export function verifyCurvaturePage(root: string): string[] {
  const errors: string[] = [];
  const page = join(root, CURVATURE_PATH);
  const listed = existsSync(page) ? readdirSync(page).sort() : [];
  if (JSON.stringify(listed) !== JSON.stringify(CURVATURE_FILES)) {
    errors.push(`Curvature check files differ: expected ${CURVATURE_FILES.join(', ')}, found ${listed.join(', ') || 'none'}`);
    return errors;
  }
  const html = readFileSync(join(page, 'index.html'), 'utf8');
  const script = readFileSync(join(page, 'curvature.js'), 'utf8');
  if (!html.includes(`<p class="caption">${CURVATURE_CAPTION}</p>`)) errors.push('Curvature check caption missing');
  if (!html.includes('<a class="back" href="../">')) errors.push('Curvature check back link missing');
  // Self-contained: every reference is relative and resolves inside the page folder.
  for (const [, ref] of [...html.matchAll(/(?:src|href)="([^"]+)"/g), ...script.matchAll(/loadImage\('([^']+)'\)/g)]) {
    if (ref === undefined || ref.startsWith('data:') || ref === 'https://rig-c.org/demos/head-turn/curvature/') continue;
    if (/^[a-z]+:|^\/\//i.test(ref)) errors.push(`Curvature check references an external URL: ${ref}`);
    else if (!existsSync(join(page, ref.endsWith('/') ? `${ref}index.html` : ref))) errors.push(`Curvature check reference does not resolve: ${ref}`);
  }
  const entry = readFileSync(join(root, HEAD_TURN_PATH, 'index.html'), 'utf8');
  if (!entry.includes('<a id="curvature-link" href="../curvature/">Curvature check</a>')) errors.push('Head-turn page does not link the curvature check');
  return errors;
}
