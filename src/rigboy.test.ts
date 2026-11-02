import { expect, test } from 'bun:test';
import { renderSite } from './build.ts';

const versions = new Map(['core', 'parts', 'pose', 'review', 'play', 'pixi', 'phaser', 'three'].map(n => [`@rig-c/${n}`, '100.0.0']));
const CLIPS = ['idle', 'walk', 'run', 'jump', 'shoot', 'aim', 'idle-turn', 'run-to-idle', 'death'] as const;

function assertRigboyClips(rigboy: string): void {
  for (const clip of CLIPS) expect(rigboy).toContain(`<option value="${clip}">`);
}

test('examples points the rigboy live player at v2 nine clips and keeps Family unchanged', () => {
  const files = renderSite(versions);
  const html = files.get('examples/index.html')!;
  expect(html).toContain('id="rigboy-demo"');
  expect(html).toContain('97f34f352a720e4830c94cc1150d4f69505f9e14');
  expect(html).not.toContain('8aa22071');
  expect(html).toContain('rigboy/v2/build/skeleton.model.json');
  expect(html).toContain('data-play-version="1.22.1"');
  expect(html).toContain('1,353,981');
  const rigboy = html.slice(html.indexOf('<section class="live-demo live-demo-rigboy"'), html.indexOf('</section>', html.indexOf('id="rigboy-demo"')));
  assertRigboyClips(rigboy);
  for (const clip of CLIPS) {
    expect(() => assertRigboyClips(rigboy.replace(`<option value="${clip}">${clip}</option>`, ''))).toThrow();
  }
  expect(rigboy).not.toContain('data-controls-url');
  expect(rigboy).not.toContain('controls.js');
  expect(rigboy).not.toContain('data-part="demo-aim"');
  expect(rigboy).not.toContain('data-part="demo-travel"');
  expect(rigboy).not.toContain('min="-8" max="8"');
  expect(rigboy).toContain('data-part="demo-start"');
  expect(rigboy).toContain('data-part="demo-play"');
  expect(rigboy).toContain('data-part="demo-bones"');
  expect(rigboy).toContain('data-part="demo-mesh"');
  expect(rigboy).toContain('<noscript>');
  expect(rigboy).toContain('/assets/rigboy-preview.webp');
  expect(rigboy).toContain('data-fallback-href="/assets/rigboy-preview.webp"');
  expect(rigboy).not.toContain('/rigboy/preview.webp');
  expect(rigboy).not.toContain('v1');
  const rigboySection = html.slice(html.indexOf('<h3 id="rigboy-v2'), html.indexOf('<h2 id="3-open-the-sources'));
  expect(rigboySection).toContain('/assets/rigboy-preview.webp');
  expect(rigboySection).not.toContain('rigboy/preview.webp');
  expect(rigboySection).not.toContain('v1');
  expect(html).toContain('data-sha="c239b09328ca7364361b9761fac817502c09ede0"');
  expect(html.match(/src="\/assets\/demo.js"/g)).toHaveLength(1);
  const md = files.get('examples/index.md')!;
  const rigboyMd = md.slice(md.indexOf('### rigboy v2'), md.indexOf('## 3. Open the sources'));
  expect(md).not.toContain('8aa22071');
  expect(md).not.toContain('one profile painting folds at deep knee flexion');
  expect(md).toContain('spineboy-pro.json');
  expect(md).toContain('hoverboard');
  expect(rigboyMd).toContain('/assets/rigboy-preview.webp');
  expect(rigboyMd).not.toContain('rigboy/preview.webp');
  expect(rigboyMd).not.toContain('v1');
});
