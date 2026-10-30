import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

// All captures use the page's loaded assets and the same renderer at exactly 1 CSS px/rig px.
// Extrema are selected from the pinned model's authored keys, before rendering their values.
export async function captureNative(page, out) {
  const dir = join(out, 'native'); mkdirSync(dir, { recursive: true });
  await page.setViewportSize({ width: 1280, height: 1500 });
  const section = page.locator('#rigboy-demo'), stage = section.locator('.demo-stage');
  if (await section.locator('[data-part=demo-play]').textContent() === 'Pause') await section.locator('[data-part=demo-play]').click();
  await page.addStyleTag({ content: '#rigboy-demo{width:834px;max-width:none} #rigboy-demo .demo-body{display:block} #rigboy-demo .demo-stage{width:832px;height:1216px;border:0;background:#0b1228} #rigboy-demo .demo-head,#rigboy-demo .demo-panel{display:none}' });
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
  await section.evaluate(s => {
    const d = s.demo, el = d.player.root;
    Object.assign(d.view, { scale: 1, left: 416, top: 1216 });
    el.style.cssText = 'position:absolute;transform-origin:0 0;transform:scale(1);left:416px;top:1216px';
    d.player.renderer.syncPixelRatio();
  });
  const hash = b => createHash('sha256').update(b).digest('hex');
  // A genuine unanimated setup pose, drawn with the published renderer and the loaded page assets.
  await section.evaluate(async s => {
    const { RigPlayer } = await import(`https://cdn.jsdelivr.net/npm/@rig-c/play@${s.dataset.playVersion}/dist/index.js`);
    const el = document.createElement('div'); el.style.cssText = 'position:absolute;left:416px;top:1216px';
    s.querySelector('.demo-stage').append(el); s.demo.player.root.hidden = true;
    const setup = new RigPlayer(el, s.demo.assets, { mode: 'dom', meshBackend: 'canvas2d' });
    setup.renderer.syncPixelRatio(); setup.renderer.render(setup.posedFrame());
    s.nativeSetup = { el, player: setup };
  });
  const setup = await stage.screenshot({ path: join(dir, 'setup.png') });
  await section.evaluate(s => { s.nativeSetup.player.dispose(); s.nativeSetup.el.remove(); delete s.nativeSetup; s.demo.player.root.hidden = false; });
  const channels = { idle: ['chest','translatey'], walk: ['near_knee','rotate'], run: ['near_knee','rotate'], jump: ['hip','translatey'], shoot: ['near_arm','rotate'], hit: ['chest','translatex'] };
  const records = [];
  for (const clip of ['idle','walk','run','jump','aim','shoot','hit']) {
    // Dispatch the page's normal selector handler while its controls are hidden for native capture.
    await section.locator('select').evaluate((el, clip) => { el.value = clip; el.dispatchEvent(new Event('change', { bubbles: true })); }, clip);
    const extreme = await section.evaluate((s, { clip, channels }) => {
      if (clip === 'aim') return { channel: 'aim_control.rotate property', min: { value: -8, time: 0 }, max: { value: 8, time: 0 } };
      const [bone, channel] = channels[clip];
      const animation = s.demo.assets.document.parsed.animations.find(a => a.name === clip);
      const keys = animation.bones.find(b => b.name === bone).timelines.find(t => t.name === channel).keys;
      return { channel: `${bone}.${channel}`, min: keys.reduce((a,b) => b.value < a.value ? b : a), max: keys.reduce((a,b) => b.value > a.value ? b : a) };
    }, { clip, channels });
    const shots = {}, joints = {};
    for (const name of ['min','max']) {
      joints[name] = await section.evaluate((s, { clip, key }) => {
        const p = s.demo.player, aim = s.querySelector('[data-part=demo-aim]');
        aim.value = clip === 'aim' ? key.value : 0; aim.dispatchEvent(new Event('input', { bubbles: true }));
        p.pause(); p.seek(key.time); p.draw();
        return Object.fromEntries(['chest','hip','near_knee','far_knee','near_foot','far_foot','near_arm','toy','head','fringe'].map(n => { const b = p.bone(n); return [n, { x: 416+b.x, y: 1216-b.y }]; }));
      }, { clip, key: extreme[name] });
      shots[name] = await stage.screenshot({ path: join(dir, `${clip}-${name}.png`) });
    }
    const products = await page.evaluate(async ({ setup, min, max, joints, clip }) => {
      const load = src => new Promise((done, reject) => { const i = new Image(); i.onload = () => done(i); i.onerror = reject; i.src = `data:image/png;base64,${src}`; });
      const [a,b,c] = await Promise.all([load(setup),load(min),load(max)]);
      const canvas = (w,h) => { const c = document.createElement('canvas'); c.width=w; c.height=h; return c; };
      const diff = canvas(832,1216), dc = diff.getContext('2d'); dc.drawImage(b,0,0);
      const bd = dc.getImageData(0,0,832,1216); dc.drawImage(c,0,0); const cd = dc.getImageData(0,0,832,1216);
      let changed=0; for (let i=0;i<bd.data.length;i+=4) { let delta=0; for (let j=0;j<3;j++) { const d=Math.abs(cd.data[i+j]-bd.data[i+j]); bd.data[i+j]=d; delta+=d; } if(delta)changed++; bd.data[i+3]=255; } dc.putImageData(bd,0,0);
      const sheet=canvas(832*4,1250), sc=sheet.getContext('2d'); sc.fillStyle='#172036';sc.fillRect(0,0,sheet.width,sheet.height);sc.font='18px sans-serif'; sc.fillStyle='white';
      for(const [i,img] of [a,b,c,diff].entries()){sc.fillText(`${clip} · ${['setup','min','max','abs(max−min)'][i]} · native 1:1`,i*832+10,24);sc.drawImage(img,i*832,34);}
      const crops={};
      for(const joint of Object.keys(joints.min)){
        const sheet=canvas(1800,520), ctx=sheet.getContext('2d');ctx.fillStyle='#172036';ctx.fillRect(0,0,1800,520);ctx.font='16px sans-serif';ctx.fillStyle='white';ctx.imageSmoothingEnabled=false;
        for(const [i,img] of [b,c,diff].entries()){
          const point=joints[i===1?'max':'min'][joint],x=Math.round(point.x-60),y=Math.round(point.y-60);
          ctx.fillText(`${clip} / ${joint} / ${['min','max','diff'][i]} / 1x + 4x NN`,600*i+8,24);
          ctx.drawImage(img,x,y,120,120,600*i,40,120,120);ctx.drawImage(img,x,y,120,120,600*i+120,40,480,480);
        }crops[joint]=sheet.toDataURL('image/png').split(',')[1];
      }
      return {diff:diff.toDataURL('image/png').split(',')[1],sheet:sheet.toDataURL('image/png').split(',')[1],crops,changed};
    }, { setup: setup.toString('base64'), min: shots.min.toString('base64'), max: shots.max.toString('base64'), joints, clip });
    writeFileSync(join(dir,`${clip}-diff.png`), Buffer.from(products.diff,'base64'));
    writeFileSync(join(dir,`${clip}-sheet.png`), Buffer.from(products.sheet,'base64'));
    for (const [joint,data] of Object.entries(products.crops)) writeFileSync(join(dir,`${clip}-${joint}-boundary.png`),Buffer.from(data,'base64'));
    records.push({ clip, ...extreme, nativeScale:1, width:832,height:1216, changedPixels:products.changed, setupSha256:hash(setup), minSha256:hash(shots.min), maxSha256:hash(shots.max), joints });
  }
  writeFileSync(join(dir,'receipt.json'),JSON.stringify(records,null,2));
  return records;
}
