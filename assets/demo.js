// The live demo on /examples/: the published @rig-c/play runtime playing the Family rigs from
// rig-c/parts-examples, pinned to one commit. Nothing is fetched until the reader asks for it,
// motion waits for a click when the reader prefers reduced motion, and a failure only replaces
// the demo's own status line — the rest of the page never depends on this script.
const PLAY_URL = 'https://cdn.jsdelivr.net/npm/@rig-c/play@1.12.0/dist/index.js';

for (const root of document.querySelectorAll('.live-demo')) init(root);

function init(section) {
  const sha = section.dataset.sha;
  const base = `https://cdn.jsdelivr.net/gh/rig-c/parts-examples@${sha}/family`;
  const repo = `https://github.com/rig-c/parts-examples/tree/${sha}/family`;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (id) => section.querySelector(`[data-part="${id}"]`) ?? section.querySelector(`#${id}`);
  // A page may fix the rig (data-character / data-outfit) instead of offering the selects.
  const fixed = (el, value) => el ?? { value, disabled: false, selectedOptions: [{ textContent: section.dataset.label ?? value }], addEventListener() {} };
  const ui = {
    character: fixed($('demo-character'), section.dataset.character), outfit: fixed($('demo-outfit'), section.dataset.outfit), motion: $('demo-motion'), mode: $('demo-mode'),
    play: $('demo-play'), bones: $('demo-bones'), mesh: $('demo-mesh'),
    start: $('demo-start'), stage: $('demo-stage'), overlay: $('demo-overlay'),
    status: $('demo-status'), source: $('demo-source'),
  };
  section.classList.add('demo-ready');
  setControls(false);

  let lib = null; // the imported @rig-c/play module
  let current = null; // { player, assets, el, bones }
  let playing = false;
  let showBones = false;
  let showMesh = false;
  let request = 0;
  let last = performance.now();

  const dir = (c, o) => (o === 'office' ? c : `outfits/${o}/${c}`);
  const config = (c, o) => (o === 'office' ? `${c}/config.json` : `outfits/${o}/${c}/authoring/config.json`);
  const label = () => section.dataset.label ?? `${ui.character.selectedOptions[0].textContent}, ${ui.outfit.value}`;

  function status(text, kind = '') {
    ui.status.textContent = text;
    ui.status.dataset.kind = kind;
  }

  function setControls(enabled) {
    for (const el of [ui.character, ui.outfit, ui.motion, ui.mode, ui.play, ui.bones, ui.mesh]) if (el) el.disabled = !enabled;
  }

  function syncButtons() {
    ui.play.textContent = playing ? 'Pause' : 'Play';
    ui.play.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} the live rig`);
    ui.bones.setAttribute('aria-pressed', String(showBones));
    ui.mesh.setAttribute('aria-pressed', String(showMesh));
  }

  function showSource(c, o) {
    ui.source.innerHTML = '';
    const links = [
      ['config.json', `${repo}/${config(c, o)}`],
      ['built model', `${repo}/${dir(c, o)}/out/check/build`],
      ['how to rebuild it', `https://github.com/rig-c/parts-examples/blob/${sha}/family/README.md`],
    ];
    ui.source.append('Source for this rig: ');
    links.forEach(([text, href], i) => {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = text;
      ui.source.append(a, i < links.length - 1 ? ' · ' : '');
    });
  }

  function fit() {
    if (!current) return;
    const box = current.assets.stage ?? current.player.bounds();
    const w = ui.stage.clientWidth;
    const h = ui.stage.clientHeight;
    const scale = Number(section.dataset.fit ?? 0.94) * Math.min(w / box.width, h / box.height);
    const left = (w - box.width * scale) / 2 - box.x * scale;
    const top = (h - box.height * scale) / 2 + (box.y + box.height) * scale;
    current.view = { box, scale, left, top };
    current.el.style.cssText = `position:absolute;transform-origin:0 0;transform:scale(${scale});left:${left}px;top:${top}px`;
    current.player.renderer.syncPixelRatio();
  }

  function drawOverlay() {
    const canvas = ui.overlay;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr);
    if (canvas.height !== Math.round(h * dpr)) canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!current || !current.view || (!showBones && !showMesh)) return;
    const { scale, left, top } = current.view;
    // World units are Y up; the stage element is placed so world (0, 0) lands at (left, top).
    const project = (x, y) => [left + x * scale, top - y * scale];
    const { player, bones } = current;
    if (showMesh) {
      ctx.strokeStyle = 'rgba(96, 236, 255, 0.55)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (const slot of player.posedFrame().order) {
        if (slot.kind !== 'mesh') continue;
        const v = slot.vertices;
        const t = slot.triangles;
        for (let i = 0; i < t.length; i += 3) {
          for (let e = 0; e < 3; e++) {
            const a = t[i + e];
            const b = t[i + ((e + 1) % 3)];
            const [ax, ay] = project(v[2 * a], v[2 * a + 1]);
            const [bx, by] = project(v[2 * b], v[2 * b + 1]);
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
          }
        }
      }
      ctx.stroke();
    }
    if (showBones) {
      ctx.strokeStyle = '#ffe07a';
      ctx.fillStyle = '#ffe07a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const joints = [];
      for (const spec of bones) {
        const bone = player.bone(spec.name);
        if (!bone.active) continue;
        joints.push(project(bone.x, bone.y));
        if (spec.parent && spec.parent !== 'root') {
          const parent = player.bone(spec.parent);
          if (!parent.active) continue;
          const [px, py] = project(parent.x, parent.y);
          const [bx, by] = project(bone.x, bone.y);
          ctx.moveTo(px, py);
          ctx.lineTo(bx, by);
        }
      }
      ctx.stroke();
      for (const [x, y] of joints) {
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function tick(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (current && playing && !document.hidden) {
      current.player.frame(dt);
      drawOverlay();
    }
    requestAnimationFrame(tick);
  }

  async function load() {
    const c = ui.character.value;
    const o = ui.outfit.value;
    const id = ++request;
    const keepTime = current ? current.player.time : 0;
    const keepMotion = current ? current.player.current : null;
    setControls(false);
    status(`Loading ${label()} — about 1.5–2 MB…`, 'loading');
    try {
      let bones = [];
      const assets = await lib.loadModel({
        modelUrl: section.dataset.modelUrl ?? `${base}/${dir(c, o)}/out/check/build/skeleton.model.json`,
        crossOrigin: 'anonymous',
        setsUrl: null,
        fetch: async (input, init) => {
          const response = await fetch(input, init);
          if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${String(input).split('/family/')[1] ?? input}`);
          if (String(input).endsWith('skeleton.model.json')) bones = (await response.clone().json()).bones ?? [];
          return response;
        },
      });
      if (id !== request) {
        assets.dispose();
        return;
      }
      // Dispose the old rig before creating the new one: the mesh renderer shares one WebGL
      // context per page, and disposing after the new player exists tears down what it uses.
      if (current) {
        current.player.dispose();
        current.assets.dispose();
        current.el.remove();
        current = null;
      }
      const el = document.createElement('div');
      ui.stage.insertBefore(el, ui.overlay);
      const player = new lib.RigPlayer(el, assets, ui.mode ? { mode: ui.mode.value } : {});
      const names = assets.animations.map((a) => a.name);
      const motion = names.includes(keepMotion) ? keepMotion : names[0];
      current = { player, assets, el, bones };
      ui.motion.replaceChildren(...names.map((n) => new Option(n, n, false, n === motion)));
      player.play(motion);
      if (keepTime > 0) player.seek(keepTime % (assets.animations.find((a) => a.name === motion)?.duration || 1));
      if (!playing) player.pause();
      fit();
      player.frame(0);
      drawOverlay();
      if (!section.dataset.modelUrl) showSource(c, o);
      const backend = player.mode === 'canvas' ? 'everything in one canvas (canvas mode)' : `meshes drawn with ${player.renderer.meshBackendActive ?? 'canvas'} (DOM mode)`;
      const motions = names.length === 1 ? `its one motion, ${names[0]}` : `${names.length} motions`;
      status(`Live: ${label()} — ${motions}, ${backend}.${playing ? '' : ' Paused; press Play.'}`, 'ready');
    } catch (err) {
      if (id !== request) return;
      status(`The live demo could not load ${label()}: ${err.message}. The recorded preview above shows the same rigs.`, 'error');
    } finally {
      if (id === request) setControls(true);
      syncButtons();
    }
  }

  async function start() {
    ui.start.disabled = true;
    status('Loading the @rig-c/play runtime…', 'loading');
    try {
      lib = await import(PLAY_URL);
    } catch (err) {
      ui.start.disabled = false;
      ui.start.textContent = 'Try again';
      status(`The live demo could not load the @rig-c/play runtime from jsDelivr (${err.message}). The recorded preview above shows the same rigs.`, 'error');
      return;
    }
    ui.start.hidden = true;
    playing = !reduce.matches;
    requestAnimationFrame(tick);
    await load();
  }

  ui.start.addEventListener('click', start);
  ui.character.addEventListener('change', load);
  ui.outfit.addEventListener('change', load);
  if (ui.mode) ui.mode.addEventListener('change', load);
  ui.motion.addEventListener('change', () => {
    if (!current) return;
    current.player.play(ui.motion.value);
    if (!playing) current.player.pause();
    current.player.frame(0);
    drawOverlay();
  });
  ui.play.addEventListener('click', () => {
    if (!current) return;
    playing = !playing;
    if (playing) current.player.resume();
    else current.player.pause();
    last = performance.now();
    syncButtons();
    status(ui.status.textContent.replace(' Paused; press Play.', '') + (playing ? '' : ' Paused; press Play.'), 'ready');
  });
  ui.bones.addEventListener('click', () => {
    showBones = !showBones;
    syncButtons();
    drawOverlay();
  });
  ui.mesh.addEventListener('click', () => {
    showMesh = !showMesh;
    syncButtons();
    drawOverlay();
  });
  new ResizeObserver(() => {
    fit();
    drawOverlay();
  }).observe(ui.stage);
  syncButtons();
}
