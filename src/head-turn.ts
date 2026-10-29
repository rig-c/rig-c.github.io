import fs, { existsSync, readdirSync, readFileSync } from 'node:fs';
import path, { join } from 'node:path';
import { artifactManifest, parseManifest } from './deployment.ts';

export const HEAD_TURN_PATH = 'demos/head-turn';
export const HEAD_TURN_MANIFEST_REL = 'demos/head-turn/bundle-manifest.json';
export const HEAD_TURN_PACKAGE_MANIFEST_REL = 'demos/head-turn/package-manifest.json';
export const HEAD_TURN_BUNDLE_DIR_REL = 'demos/head-turn/bundle';
export const HEAD_TURN_PROTOTYPE_DIR_REL = 'demos/head-turn/prototype';
export const HEAD_TURN_PROTOTYPE_INDEX_REL = 'demos/head-turn/prototype/index.html';
export const HEAD_TURN_INDEX_REL = 'demos/head-turn/index.html';
export const HEAD_TURN_PAGE_README_REL = 'demos/head-turn/README.md';
export const HEAD_TURN_APP_REL = 'demos/head-turn/bundle/app.js';
export const HEAD_TURN_README_REL = 'demos/head-turn/bundle/README.md';

// Approved eleven-file published-stack bundle inventory (@rig-c/parts 1.75.0, @rig-c/pose 1.4.0, @rig-c/play 1.21.0, @rig-c/pixi 0.1.5, rig-c 2.79.0, pixi.js 8.22.0).
export const HEAD_TURN_BUNDLE_SHA256 = '216adaab2d048229511faffbbb61ec0be5d445497bb921ce56199a759e8aeadd';
// Preserved ten-file GPU displacement prototype inventory at demos/head-turn/prototype/.
export const HEAD_TURN_PROTOTYPE_SHA256 = 'fb7bc15b188ed8f29a931067df44a4c3cdb61ba3f114c706722eee73c8a6c2fc';

export interface HeadTurnPackageEntry {
  name: string;
  version: string;
  spec: string;
  integrity: string;
  shasum: string;
  tarball: string;
}

export const REQUIRED_PUBLISHED_PACKAGES = [
  '@rig-c/parts',
  '@rig-c/pose',
  '@rig-c/play',
  '@rig-c/pixi',
  'rig-c',
  'pixi.js',
] as const;

const FORBIDDEN_PROVENANCE_TOKENS = [
  '/Users/',
  '.worktrees/',
  '/tmp/',
  'file:',
  'link:',
] as const;

export const REQUIRED_README_TOKENS = [
  '@rig-c/parts',
  '@rig-c/pose',
  '@rig-c/play',
  '@rig-c/pixi',
  'rig-c',
  'pixi.js',
  'narrowing: false',
  'How to rebuild',
] as const;

function verifyPackageEntries(
  packages: HeadTurnPackageEntry[] | undefined,
  label: string,
  errors: string[],
): void {
  if (!Array.isArray(packages) || packages.length === 0) {
    errors.push(`${label}: "packages" must be a non-empty array of published npm package records`);
    return;
  }
  const byName = new Map<string, HeadTurnPackageEntry>();
  for (const pkg of packages) {
    if (!pkg || typeof pkg.name !== 'string') continue;
    byName.set(pkg.name, pkg);
    if (!pkg.version || typeof pkg.version !== 'string') {
      errors.push(`${label}: package "${pkg.name}" is missing a valid version`);
    }
    if (pkg.spec !== `${pkg.name}@${pkg.version}`) {
      errors.push(`${label}: package "${pkg.name}" spec "${pkg.spec}" does not match "${pkg.name}@${pkg.version}"`);
    }
    if (typeof pkg.integrity !== 'string' || !pkg.integrity.startsWith('sha512-')) {
      errors.push(`${label}: package "${pkg.name}" is missing a sha512 tarball integrity`);
    }
    if (typeof pkg.shasum !== 'string' || !/^[0-9a-f]{40}$/.test(pkg.shasum)) {
      errors.push(`${label}: package "${pkg.name}" is missing a valid 40-hex shasum`);
    }
    if (typeof pkg.tarball !== 'string' || !pkg.tarball.startsWith('https://registry.npmjs.org/')) {
      errors.push(`${label}: package "${pkg.name}" tarball "${pkg.tarball}" must resolve from https://registry.npmjs.org/`);
    }
  }
  for (const reqName of REQUIRED_PUBLISHED_PACKAGES) {
    if (!byName.has(reqName)) {
      errors.push(`${label}: missing required published package "${reqName}"`);
    }
  }
}

export function verifyHeadTurnDemo(rootDir: string): string[] {
  const errors: string[] = [];
  const manifestPath = path.join(rootDir, HEAD_TURN_MANIFEST_REL);
  if (!fs.existsSync(manifestPath)) {
    return [`Missing head-turn bundle manifest: ${HEAD_TURN_MANIFEST_REL}`];
  }

  let expected;
  try {
    expected = parseManifest(fs.readFileSync(manifestPath, 'utf-8'));
  } catch (err) {
    return [`Invalid manifest in ${HEAD_TURN_MANIFEST_REL}: ${(err as Error).message}`];
  }

  const bundleDir = path.join(rootDir, HEAD_TURN_BUNDLE_DIR_REL);
  if (!fs.existsSync(bundleDir)) {
    errors.push(`Missing head-turn bundle directory: ${HEAD_TURN_BUNDLE_DIR_REL}`);
  } else {
    const actual = artifactManifest(bundleDir);
    if (actual.sha256 !== expected.sha256) {
      errors.push(`${HEAD_TURN_MANIFEST_REL}: bundle files differ from recorded manifest sha256`);
    }
  }

  const pkgManifestPath = path.join(rootDir, HEAD_TURN_PACKAGE_MANIFEST_REL);
  if (!fs.existsSync(pkgManifestPath)) {
    errors.push(`Missing head-turn package manifest: ${HEAD_TURN_PACKAGE_MANIFEST_REL}`);
  } else {
    try {
      const pkgManifest = JSON.parse(fs.readFileSync(pkgManifestPath, 'utf-8')) as {
        packages?: HeadTurnPackageEntry[];
      };
      verifyPackageEntries(pkgManifest.packages, HEAD_TURN_PACKAGE_MANIFEST_REL, errors);
    } catch (err) {
      errors.push(`Invalid JSON in ${HEAD_TURN_PACKAGE_MANIFEST_REL}: ${(err as Error).message}`);
    }
  }

  const protoIndexPath = path.join(rootDir, HEAD_TURN_PROTOTYPE_INDEX_REL);
  if (!fs.existsSync(protoIndexPath)) {
    errors.push(`Missing preserved prototype page: ${HEAD_TURN_PROTOTYPE_INDEX_REL}`);
  }

  const textFilesToScan = [
    HEAD_TURN_INDEX_REL,
    HEAD_TURN_PAGE_README_REL,
    HEAD_TURN_APP_REL,
    HEAD_TURN_README_REL,
    HEAD_TURN_MANIFEST_REL,
    HEAD_TURN_PACKAGE_MANIFEST_REL,
  ];
  for (const rel of textFilesToScan) {
    const abs = path.join(rootDir, rel);
    if (!fs.existsSync(abs)) continue;
    const text = fs.readFileSync(abs, 'utf-8');
    for (const token of FORBIDDEN_PROVENANCE_TOKENS) {
      if (text.includes(token)) {
        errors.push(`${rel}: contains forbidden provenance string "${token}"`);
      }
    }
  }

  const indexPath = path.join(rootDir, HEAD_TURN_INDEX_REL);
  if (!fs.existsSync(indexPath)) {
    errors.push(`Missing head-turn entry page: ${HEAD_TURN_INDEX_REL}`);
  } else {
    const indexHtml = fs.readFileSync(indexPath, 'utf-8');
    if (!indexHtml.includes('id="controls-toggle"')) {
      errors.push(`${HEAD_TURN_INDEX_REL}: missing mobile controls toggle button (#controls-toggle)`);
    }
    if (!indexHtml.includes('id="head-turn-controls"')) {
      errors.push(`${HEAD_TURN_INDEX_REL}: missing controls panel id (#head-turn-controls)`);
    }
    if (!indexHtml.includes('aria-controls="head-turn-controls"')) {
      errors.push(`${HEAD_TURN_INDEX_REL}: #controls-toggle must declare aria-controls="head-turn-controls"`);
    }
    if (!indexHtml.includes('aria-expanded="false"')) {
      errors.push(`${HEAD_TURN_INDEX_REL}: #controls-toggle must declare aria-expanded="false"`);
    }
    if (!indexHtml.includes('href="../site-ui.css"') || !indexHtml.includes('src="../site-ui.js"')) {
      errors.push(`${HEAD_TURN_INDEX_REL}: must include ../site-ui.css and ../site-ui.js for mobile drawer behavior`);
    }
    if (!indexHtml.includes('id="mode-pointer"') || !indexHtml.includes('id="mode-clip"')) {
      errors.push(`${HEAD_TURN_INDEX_REL}: must include both #mode-pointer and #mode-clip mode buttons`);
    }
    if (!indexHtml.includes('href="../prototype/"')) {
      errors.push(`${HEAD_TURN_INDEX_REL}: missing link to ../prototype/`);
    }
    if (!indexHtml.includes('<a id="curvature-link" href="../curvature/">Curvature check</a>')) {
      errors.push(`${HEAD_TURN_INDEX_REL}: missing link to ../curvature/`);
    }
    if (!indexHtml.includes('href="./THIRD_PARTY_LICENSES.txt"')) {
      errors.push(`${HEAD_TURN_INDEX_REL}: missing link to ./THIRD_PARTY_LICENSES.txt`);
    }
  }

  const appPath = path.join(rootDir, HEAD_TURN_APP_REL);
  if (fs.existsSync(appPath)) {
    const appText = fs.readFileSync(appPath, 'utf-8');
    for (const token of ['PixiRig', 'WebGLRenderer', 'loadModel', 'readModel', 'HEAD_SPRING_OMEGA0']) {
      if (!appText.includes(token)) {
        errors.push(`${HEAD_TURN_APP_REL}: missing required runtime token "${token}"`);
      }
    }
  }

  const pageReadmePath = path.join(rootDir, HEAD_TURN_PAGE_README_REL);
  if (!fs.existsSync(pageReadmePath)) {
    errors.push(`Missing head-turn README: ${HEAD_TURN_PAGE_README_REL}`);
  } else {
    const readmeText = fs.readFileSync(pageReadmePath, 'utf-8');
    for (const token of REQUIRED_README_TOKENS) {
      if (!readmeText.includes(token)) {
        errors.push(`${HEAD_TURN_PAGE_README_REL}: missing required documentation token "${token}"`);
      }
    }
  }

  return errors;
}

export function verifyHeadTurnBundle(root: string): void {
  const demo = join(root, HEAD_TURN_PATH);
  const expected = parseManifest(readFileSync(join(demo, 'bundle-manifest.json'), 'utf8'));
  if (
    expected.sha256 !== HEAD_TURN_BUNDLE_SHA256 ||
    expected.files.length !== 11 ||
    artifactManifest(join(demo, 'bundle')).sha256 !== expected.sha256
  ) {
    throw new Error('Head-turn bundle differs from the approved eleven-file published-stack inventory');
  }
  const prototype = artifactManifest(join(demo, 'prototype'));
  if (prototype.sha256 !== HEAD_TURN_PROTOTYPE_SHA256 || prototype.files.length !== 10) {
    throw new Error('Preserved head-turn prototype differs from the approved ten-file inventory');
  }
  const demoErrors = verifyHeadTurnDemo(root);
  if (demoErrors.length > 0) {
    throw new Error(`Head-turn verification failed: ${demoErrors.join('; ')}`);
  }
}

// Curvature check: a static shader page over the original painting and its depth map, no rig.
export const CURVATURE_PATH = `${HEAD_TURN_PATH}/curvature`;
export const CURVATURE_FILES = ['curvature.css', 'curvature.js', 'depth.webp', 'index.html', 'original.webp'];
export const CURVATURE_CAPTION =
  'Curvature check: the original painting displaced by its depth map, with no rig. A tool for reading the depth, not the head-turn feature.';

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
    else if (!existsSync(join(page, ref.endsWith('/') ? `${ref}index.html` : ref))) {
      errors.push(`Curvature check reference does not resolve: ${ref}`);
    }
  }
  const entry = readFileSync(join(root, HEAD_TURN_PATH, 'index.html'), 'utf8');
  if (!entry.includes('<a id="curvature-link" href="../curvature/">Curvature check</a>')) {
    errors.push('Head-turn page does not link the curvature check');
  }
  return errors;
}
