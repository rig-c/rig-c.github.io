import { expect, test } from 'bun:test';
import { renderSite } from './build.ts';

const versions = new Map(['core', 'parts', 'pose', 'review', 'play', 'pixi', 'phaser', 'three'].map(n => [`@rig-c/${n}`, '100.0.0']));
test('examples separates rigboy motion controls from the unchanged Family selector', () => {
  const files = renderSite(versions);
  const html = files.get('examples/index.html')!;
  expect(html).toContain('id="rigboy-demo"');
  expect(html).toContain('8aa220713b1c8216ea535a8a14a8a34f65ee5a2a');
  expect(html).toContain('data-play-version="1.21.2"');
  expect(html).toContain('min="-8" max="8"');
  expect(html).toContain('2,264,805');
  const rigboy = html.slice(html.indexOf('<section class="live-demo live-demo-rigboy"'), html.indexOf('</section>', html.indexOf('id="rigboy-demo"')));
  for (const clip of ['idle', 'walk', 'run', 'jump', 'aim', 'shoot', 'hit']) expect(rigboy).toContain(`<option value="${clip}">`);
  expect(rigboy).toContain('<noscript>');
  expect(rigboy).toContain('/rigboy/preview.webp');
  expect(html).toContain('data-sha="c239b09328ca7364361b9761fac817502c09ede0"');
  expect(html.match(/src="\/assets\/demo.js"/g)).toHaveLength(1);
  expect(files.get('examples/index.md')).toContain('one profile painting folds at deep knee flexion');
});
