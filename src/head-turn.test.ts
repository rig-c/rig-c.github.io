import { afterEach, describe, expect, test } from 'bun:test';
import fs, { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os, { tmpdir } from 'node:os';
import path, { join } from 'node:path';
import { artifactManifest } from './deployment.ts';
import {
  CURVATURE_PATH,
  HEAD_TURN_APP_REL,
  HEAD_TURN_INDEX_REL,
  HEAD_TURN_MANIFEST_REL,
  HEAD_TURN_PACKAGE_MANIFEST_REL,
  HEAD_TURN_PAGE_README_REL,
  HEAD_TURN_PATH,
  HEAD_TURN_PROTOTYPE_INDEX_REL,
  HEAD_TURN_README_REL,
  REQUIRED_PUBLISHED_PACKAGES,
  REQUIRED_README_TOKENS,
  verifyCurvaturePage,
  verifyHeadTurnBundle,
  verifyHeadTurnDemo,
} from './head-turn.ts';
import { ROOT_DIR } from './output.ts';

const read = (relPath: string) => readFileSync(join(ROOT_DIR, relPath), 'utf8');

const tmpDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rig-c-head-turn-'));
  tmpDirs.push(dir);
  return dir;
}

const VALID_PACKAGES = REQUIRED_PUBLISHED_PACKAGES.map((name) => ({
  name,
  version: '1.0.0',
  spec: `${name}@1.0.0`,
  integrity: 'sha512-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
  shasum: '0123456789abcdef0123456789abcdef01234567',
  tarball: `https://registry.npmjs.org/${name}/-/pkg-1.0.0.tgz`,
}));

function writeValidFixture(rootDir: string): void {
  const bundleDir = path.join(rootDir, 'demos/head-turn/bundle');
  const protoDir = path.join(rootDir, 'demos/head-turn/prototype');
  fs.mkdirSync(bundleDir, { recursive: true });
  fs.mkdirSync(protoDir, { recursive: true });

  const appJs = `// HEAD_SPRING_OMEGA0 = 20\nimport { PixiRig, WebGLRenderer, loadModel, readModel } from "./runtime.js";\n`;
  const readmeMd = `# Head turn\n${REQUIRED_README_TOKENS.join('\n')}\n`;
  const licenses = 'MIT License\n';
  const indexHtml = `<!doctype html><html><head><base href="./bundle/"><link rel="stylesheet" href="../site-ui.css"><script src="../site-ui.js" defer></script></head><body><p>Depth-driven 2.5D head and body turn</p><a id="curvature-link" href="../curvature/">Curvature check</a><button id="controls-toggle" type="button" aria-controls="head-turn-controls" aria-expanded="false">Controls</button><section id="head-turn-controls"><button id="mode-pointer" type="button" data-mode="pointer" aria-pressed="true">Pointer</button><button id="mode-clip" type="button" data-mode="clip" aria-pressed="false">Pose clip</button><a href="../prototype/">Prototype</a><a href="./THIRD_PARTY_LICENSES.txt">Licences</a></section></body></html>`;

  fs.writeFileSync(path.join(rootDir, HEAD_TURN_APP_REL), appJs);
  fs.writeFileSync(path.join(rootDir, HEAD_TURN_README_REL), readmeMd);
  fs.writeFileSync(path.join(rootDir, HEAD_TURN_PAGE_README_REL), readmeMd);
  fs.writeFileSync(path.join(rootDir, 'demos/head-turn/bundle/THIRD_PARTY_LICENSES.txt'), licenses);
  fs.writeFileSync(path.join(rootDir, HEAD_TURN_INDEX_REL), indexHtml);
  fs.writeFileSync(path.join(rootDir, HEAD_TURN_PROTOTYPE_INDEX_REL), '<!doctype html><html></html>');

  const manifest = artifactManifest(bundleDir);
  fs.writeFileSync(path.join(rootDir, HEAD_TURN_MANIFEST_REL), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(
    path.join(rootDir, HEAD_TURN_PACKAGE_MANIFEST_REL),
    `${JSON.stringify({ schema: 1, packages: VALID_PACKAGES }, null, 2)}\n`,
  );
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0, tmpDirs.length)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('verifyHeadTurnDemo & verifyHeadTurnBundle', () => {
  test('committed demos/head-turn bundle passes integrity, package provenance, dial range, and no-2d-spin verification', () => {
    verifyHeadTurnBundle(ROOT_DIR);
    expect(verifyHeadTurnDemo(ROOT_DIR)).toEqual([]);

    // Preserved prototype gzip header check
    const gzip = readFileSync(join(ROOT_DIR, HEAD_TURN_PATH, 'prototype/scene.bin.gz'));
    expect([...gzip.subarray(0, 2)]).toEqual([31, 139]);

    // Bar 1: Published package versions and integrities
    const pkgManifest = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, HEAD_TURN_PACKAGE_MANIFEST_REL), 'utf-8'),
    ) as { packages: Array<{ name: string; version: string; integrity: string }> };
    const byName = new Map(pkgManifest.packages.map((p) => [p.name, p]));
    expect(byName.get('@rig-c/parts')?.version).toBe('1.75.0');
    expect(byName.get('@rig-c/pose')?.version).toBe('1.4.0');
    expect(byName.get('@rig-c/play')?.version).toBe('1.21.0');
    expect(byName.get('@rig-c/pixi')?.version).toBe('0.1.5');
    expect(byName.get('rig-c')?.version).toBe('2.79.0');
    expect(byName.get('pixi.js')?.version).toBe('8.22.0');

    // Bar 3 & Bar 5: Verify compiled skeleton.json slider bounds and pure depth × view change (no rigid 2D spin)
    const skel = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'demos/head-turn/bundle/skeleton.json'), 'utf-8'),
    ) as {
      constraints: Array<{
        name: string;
        type: string;
        bone?: string;
        animation?: string;
        from?: number;
        to?: number;
        scale?: number;
      }>;
      animations: Record<
        string,
        {
          bones?: Record<string, Record<string, Array<{ time?: number; value?: number }>>>;
          attachments?: Record<string, Record<string, Record<string, { deform?: unknown[] }>>>;
        }
      >;
    };

    const slots = (skel as unknown as { slots: Array<{ name: string }> }).slots.map((s) => s.name);
    for (const ear of ['ear_r', 'ear_l']) {
      expect(slots.indexOf(ear)).toBeGreaterThan(slots.indexOf('hair_back'));
      expect(slots.indexOf(ear)).toBeLessThan(slots.indexOf('face'));
    }

    const sliders = skel.constraints.filter((c) => c.type === 'slider');
    const sliderRangeByBone = new Map<string, [number, number]>();
    for (const s of sliders) {
      if (!s.bone || !s.animation) continue;
      const from = s.from ?? 0;
      const to = s.to ?? 0;
      const scale = s.scale ?? 1;
      const animName = s.animation;
      const maxDeg = Math.abs(from);
      const a = from - to / scale;
      const b = maxDeg;
      sliderRangeByBone.set(s.bone, [Math.min(a, b), Math.max(a, b)]);

      if (animName === 'turn' || animName === 'tilt' || animName === 'body_turn') {
        const anim = skel.animations[animName];
        expect(anim).toBeDefined();
        // Bar 5: zero rotate or scalex timelines on any turn-driven bone
        for (const [, channels] of Object.entries(anim.bones ?? {})) {
          expect(channels.rotate).toBeUndefined();
          expect(channels.scalex).toBeUndefined();
          expect(channels.scaley).toBeUndefined();
        }
        // Bar 5: deform offsets exist for surface slot inside attachments.default
        const defaultSkinAtts = anim.attachments?.default ?? {};
        const deformSlots = Object.keys(defaultSkinAtts).filter((slot) =>
          Object.values(defaultSkinAtts[slot] ?? {}).some((att) => Array.isArray(att.deform) && att.deform.length > 0),
        );
        expect(deformSlots.length).toBeGreaterThan(0);
        const requiredSurfaces = animName === 'body_turn'
          ? ['topwear']
          : ['face', 'hair_back', 'hair_front', 'hairpin'];
        for (const slot of requiredSurfaces) expect(deformSlots).toContain(slot);
      }
    }

    // Bar 3: Every keyed dial value in clip is within slider bounds
    const clipBones = skel.animations.clip?.bones ?? {};
    for (const dialBone of ['yaw_dial', 'pitch_dial', 'body_yaw_dial']) {
      const range = sliderRangeByBone.get(dialBone);
      expect(range).toBeDefined();
      const [min, max] = range!;
      const keys = clipBones[dialBone]?.rotate ?? [];
      expect(keys.length).toBeGreaterThan(0);
      for (const k of keys) {
        const v = k.value ?? 0;
        expect(v).toBeGreaterThanOrEqual(min - 1e-6);
        expect(v).toBeLessThanOrEqual(max + 1e-6);
      }
    }
  });

  test('neck is an independent chest unit with one named binding and scalar depth', () => {
    const skeleton = JSON.parse(read('demos/head-turn/bundle/skeleton.json'));
    const model = JSON.parse(read('demos/head-turn/bundle/skeleton.model.json'));
    const parentOf = (name: string) => model.bones.find((bone: { name: string }) => bone.name === name)?.parent;
    expect(parentOf('neck_unit')).toBe('bodyshift');
    expect(parentOf('neck_part')).toBe('neck_unit');
    expect(parentOf('bodyshift')).toBe('chest');
    expect(model.meshes.find((mesh: { slot: string }) => mesh.slot === 'neck').bones).toEqual(['neck_part']);
    for (const animation of ['turn', 'tilt', 'body_turn']) {
      expect(skeleton.animations[animation].attachments?.default?.neck).toBeUndefined();
    }
    const depths = model.trackDerivations
      .filter((track: { animation: string }) => track.animation === 'body_turn')
      .flatMap((track: { model: { members?: Array<{ member: string; depth: number }> } }) =>
        (track.model.members ?? []).filter((member) => member.member === 'neck_unit').map((member) => member.depth));
    expect(depths).toHaveLength(4);
    expect([...new Set(depths)]).toEqual([31.7338]);
  });

  test('unit ears share depth translation and reverse together across opposite turn extremes', () => {
    const skeleton = JSON.parse(read('demos/head-turn/bundle/skeleton.json'));
    for (const [animation, channel] of [['turn', 'translatex'], ['tilt', 'translatey']]) {
      const bones = skeleton.animations[animation].bones;
      const right = bones.ear_r[channel] as Array<{ value?: number }>;
      const left = bones.ear_l[channel] as Array<{ value?: number }>;
      expect(left).toEqual(right);
      const carrier = bones.faceshift[channel] as Array<{ value?: number }>;
      const total = (index: number) => (carrier[index].value ?? 0) + (right[index].value ?? 0);
      expect(total(0)).not.toBe(0);
      expect(total(0)).toBe(-total(right.length - 1));
    }
  });

  test('site entry changes only integration UI; original resources still use bundle base', () => {
    const original = read(`${HEAD_TURN_PATH}/bundle/index.html`);
    const entry = read(`${HEAD_TURN_PATH}/index.html`);
    const restored = entry
      .replace('<base href="./bundle/">', '')
      .replace('<link rel="stylesheet" href="../site-ui.css"><script src="../site-ui.js" defer></script><link rel="canonical" href="https://rig-c.org/demos/head-turn/">', '')
      .replace('<a id="curvature-link" href="../curvature/">Curvature check</a>', '')
      .replace('<button id="controls-toggle" type="button" aria-controls="head-turn-controls" aria-expanded="false">Controls</button><section id="head-turn-controls" class="controls"', '<section class="controls"');
    expect(restored).toBe(original);
    expect(entry).toContain('<div id="loading" role="status">Loading the depth demo…</div>');
    const caption = 'Standalone depth-driven head-turn demo; the Parts producer shipped separately in 1.68.0';
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

  test('valid synthetic fixture passes', () => {
    const dir = makeTempDir();
    writeValidFixture(dir);
    expect(verifyHeadTurnDemo(dir)).toEqual([]);
  });

  test('fails when a declared bundle file has a modified sha256 or byte count', () => {
    const dir = makeTempDir();
    writeValidFixture(dir);
    fs.writeFileSync(
      path.join(dir, HEAD_TURN_APP_REL),
      '// tampered HEAD_SPRING_OMEGA0 PixiRig WebGLRenderer loadModel readModel\n',
    );
    const errors = verifyHeadTurnDemo(dir);
    expect(errors.some((e) => e.includes('bundle files differ'))).toBe(true);
  });

  test('fails when an undeclared file is added to demos/head-turn/bundle', () => {
    const dir = makeTempDir();
    writeValidFixture(dir);
    fs.writeFileSync(path.join(dir, 'demos/head-turn/bundle/extra.txt'), 'stray');
    const errors = verifyHeadTurnDemo(dir);
    expect(errors.some((e) => e.includes('bundle files differ'))).toBe(true);
  });

  test('fails when forbidden private provenance tokens appear in public files', () => {
    const dir = makeTempDir();
    writeValidFixture(dir);
    const pollutedReadme = `${fs.readFileSync(path.join(dir, HEAD_TURN_PAGE_README_REL), 'utf-8')}\nCopied from /Users/someone/.worktrees/site/demo\n`;
    fs.writeFileSync(path.join(dir, HEAD_TURN_PAGE_README_REL), pollutedReadme);
    const errors = verifyHeadTurnDemo(dir);
    expect(errors.some((e) => e.includes('contains forbidden provenance string "/Users/"'))).toBe(true);
    expect(errors.some((e) => e.includes('contains forbidden provenance string ".worktrees/"'))).toBe(true);
  });

  test('fails when mobile controls drawer markup or mode buttons are removed from index.html', () => {
    const dir = makeTempDir();
    writeValidFixture(dir);
    const brokenHtml = fs
      .readFileSync(path.join(dir, HEAD_TURN_INDEX_REL), 'utf-8')
      .replace('id="controls-toggle"', 'id="wrong-toggle"')
      .replace('id="mode-clip"', 'id="wrong-mode"');
    fs.writeFileSync(path.join(dir, HEAD_TURN_INDEX_REL), brokenHtml);
    const errors = verifyHeadTurnDemo(dir);
    expect(errors.some((e) => e.includes('missing mobile controls toggle button'))).toBe(true);
    expect(errors.some((e) => e.includes('must include both #mode-pointer and #mode-clip'))).toBe(true);
  });

  test('fails when a required published package is missing in package-manifest.json', () => {
    const dir = makeTempDir();
    writeValidFixture(dir);
    const badPackages = VALID_PACKAGES.filter((p) => p.name !== '@rig-c/pose');
    fs.writeFileSync(
      path.join(dir, HEAD_TURN_PACKAGE_MANIFEST_REL),
      JSON.stringify({ schema: 1, packages: badPackages }, null, 2),
    );
    const errors = verifyHeadTurnDemo(dir);
    expect(errors.some((e) => e.includes('missing required published package "@rig-c/pose"'))).toBe(true);
  });
});
