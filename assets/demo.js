// The live demos on /examples/ and /docs/play/: the published @rig-c/play runtime playing the Family
// rigs from rig-c/examples, pinned to one commit. A section may also carry data-model-url with
// data-model-for="<character>/<outfit>": that one pick loads the site-served model instead (Play's
// Character 1 office, the Pose page's build with the cup swing). ?character=<dir>&outfit=<o> preselects. Nothing is fetched until the reader asks for it,
// motion waits for a click when the reader prefers reduced motion, and a failure only replaces
// the demo's own status line — the rest of the page never depends on this script.
const PLAY_URL = 'https://cdn.jsdelivr.net/npm/@rig-c/play@1.12.0/dist/index.js';

for (const root of document.querySelectorAll('.live-demo')) init(root);

function init(section) {
  const rigboy = section.dataset.demo === 'rigboy';
  const playUrl = rigboy ? `https://cdn.jsdelivr.net/npm/@rig-c/play@${section.dataset.playVersion}/dist/index.js` : PLAY_URL;
  const sha = section.dataset.sha;
  const base = `https://raw.githubusercontent.com/rig-c/examples/${sha}/family`;
  const repo = `https://github.com/rig-c/examples/tree/${sha}/family`;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (id) => section.querySelector(`[data-part="${id}"]`) ?? section.querySelector(`#${id}`);
  const ui = {
    character: $('demo-character'), outfit: $('demo-outfit'), motion: $('demo-motion'), mode: $('demo-mode'),
    play: $('demo-play'), bones: $('demo-bones'), mesh: $('demo-mesh'),
    start: $('demo-start'), stage: $('demo-stage'), overlay: $('demo-overlay'),
    status: $('demo-status'), source: $('demo-source'),
  };
  section.classList.add('demo-ready');
  setControls(false);
  const modelSource = ui.source.innerHTML; // the site-served model's source sentence, as the page wrote it
  const query = new URLSearchParams(location.search);
  for (const [key, el] of [['character', ui.character], ['outfit', ui.outfit]]) {
    const value = query.get(key);
    if (el && value && [...el.options].some((opt) => opt.value === value)) el.value = value;
  }

  let lib = null; // the imported @rig-c/play module
  let current = null; // { player, assets, el, bones }
  let playing = false;
  let showBones = false;
  let showMesh = false;
  let request = 0;
  let last = performance.now();

  const dir = (c, o) => (o === 'office' ? c : `outfits/${o}/${c}`);
  const config = (c, o) => (o === 'office' ? `${c}/config.json` : `outfits/${o}/${c}/authoring/config.json`);
  const siteModel = (c, o) => Boolean(section.dataset.modelUrl) && section.dataset.modelFor === `${c}/${o}`;
  const label = (c, o) => rigboy ? 'rigboy' : (siteModel(c, o) ? section.dataset.modelLabel : null) ?? `${ui.character.selectedOptions[0].textContent}, ${o}`;
  const size = (c, o) => rigboy ? section.dataset.modelSize : (siteModel(c, o) ? section.dataset.modelSize : null) ?? section.dataset.familySize ?? 'about 1.3–2.1 MB';

  // Keep the pick in the address bar, so a link reopens the same rig.
  function remember(c, o) {
    const url = new URL(location.href);
    url.searchParams.set('character', c);
    url.searchParams.set('outfit', o);
    history.replaceState(history.state, '', url);
  }

  // A failure line ends with a pointer to a recording of the same rig (data-fallback-href / -text on the section).
  function status(text, kind = '', fallback = false) {
    ui.status.textContent = text;
    ui.status.dataset.kind = kind;
    if (fallback && section.dataset.fallbackHref) {
      const a = document.createElement('a');
      a.href = section.dataset.fallbackHref;
      a.textContent = section.dataset.fallbackText ?? 'Watch a recording instead';
      ui.status.append(' ', a, '.');
    }
  }

  // After any failure the Start button comes back as Retry; the rest of the page never waits on it.
  function offerRetry() {
    ui.start.hidden = false;
    ui.start.disabled = false;
    ui.start.textContent = 'Retry';
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
    if (rigboy) return;
    if (siteModel(c, o)) {
      ui.source.innerHTML = modelSource;
      return;
    }
    ui.source.innerHTML = '';
    const links = [
      ['config.json', `${repo}/${config(c, o)}`],
      ['built model', `${repo}/${dir(c, o)}/out/check/build`],
      ['how to rebuild it', `https://github.com/rig-c/examples/blob/${sha}/family/README.md`],
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
    if (!current || section.nativeCapture) return;
    const box = (rigboy ? current.clipBox : null) ?? current.assets.stage ?? current.player.bounds();
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
        if (bone.active === false) continue;
        joints.push(project(bone.x, bone.y));
        if (spec.parent && spec.parent !== 'root') {
          const parent = player.bone(spec.parent);
          if (parent.active === false) continue;
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
    const c = ui.character?.value;
    const o = ui.outfit?.value;
    const id = ++request;
    const keepTime = current ? current.player.time : 0;
    const keepMotion = current ? current.player.current : null;
    setControls(false);
    const name = label(c, o);
    status(`Loading ${name} — ${size(c, o)}…`, 'loading');
    try {
      let bones = [];
      let attachedBones = new Set();
      const assets = await lib.loadModel({
        modelUrl: rigboy || siteModel(c, o) ? section.dataset.modelUrl : `${base}/${dir(c, o)}/out/check/build/skeleton.model.json`,
        crossOrigin: 'anonymous',
        setsUrl: null,
        ...(rigboy ? { regions: 'data' } : {}),
        fetch: async (input, init) => {
          const response = await fetch(input, init);
          if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${String(input).split('/family/')[1] ?? input}`);
          if (String(input).endsWith('skeleton.model.json')) {
            const model = await response.clone().json();
            bones = model.bones ?? [];
            if (rigboy) {
              const skin = Array.isArray(model.skins) ? model.skins[0] : model.skins?.default;
              const atts = skin?.attachments ?? skin ?? {};
              attachedBones = new Set((model.slots ?? []).filter((s) => s.name in atts).map((s) => s.bone));
            }
          }
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
      const player = new lib.RigPlayer(el, assets, rigboy ? { mode: 'dom', meshBackend: 'canvas2d' } : ui.mode ? { mode: ui.mode.value } : {});
      const names = assets.animations.map((a) => a.name);
      const motion = names.includes(keepMotion) ? keepMotion : names[0];
      current = { player, assets, el, bones, modelKey: rigboy ? 'rigboy' : `${c}/${o}` };
      ui.motion.replaceChildren(...names.map((n) => new Option(n, n, false, n === motion)));
      if (rigboy) {
        current.clipBoxes = measureClipBoxes(player, assets, bones.filter((b) => attachedBones.has(b.name)));
        current.clipBox = unionBoxes(Object.values(current.clipBoxes));
      }
      player.play(motion);
      if (keepTime > 0) player.seek(keepTime % (assets.animations.find((a) => a.name === motion)?.duration || 1));
      if (!playing) player.pause();
      fit();
      player.frame(0);
      drawOverlay();
      showSource(c, o);
      if (query.get('demo-test') === '1') {
        section.demo = { get player() { return current.player; }, get assets() { return current.assets; }, get view() { return current.view; }, get clipBox() { return current.clipBox; }, get clipBoxes() { return current.clipBoxes; }, get modelKey() { return current.modelKey; }, get runtimeUrl() { return playUrl; }, draw: () => { current.player.draw(); drawOverlay(); } };
      }
      const backend = player.mode === 'canvas' ? 'everything in one canvas (canvas mode)' : rigboy ? 'region pieces, no meshes (DOM mode)' : `meshes drawn with ${player.renderer.meshBackendActive ?? 'canvas'} (DOM mode)`;
      const motions = names.length === 1 ? `its one motion, ${names[0]}` : `${names.length} motions`;
      status(`Live: ${name} — ${motions}, ${backend}.${playing ? '' : ' Paused; press Play.'}`, 'ready');
    } catch (err) {
      if (id !== request) return;
      status(`The live demo could not load ${name}: ${err.message}.`, 'error', true);
      offerRetry();
    } finally {
      if (id === request) setControls(true);
      syncButtons();
    }
  }

  let ticking = false;
  let attempts = 0;
  async function start() {
    ui.start.disabled = true;
    if (!lib) {
      status('Loading the @rig-c/play runtime…', 'loading');
      try {
        // A failed module import is cached by the browser, so each retry asks for a fresh URL.
        lib = await import(attempts++ ? `${playUrl}?retry=${attempts}` : playUrl);
      } catch (err) {
        lib = null;
        status(`The live demo could not load the @rig-c/play runtime from jsDelivr (${err.message}).`, 'error', true);
        offerRetry();
        return;
      }
    }
    ui.start.hidden = true;
    if (!ticking) {
      ticking = true;
      playing = !reduce.matches;
      requestAnimationFrame(tick);
    }
    await load();
  }

  // Frame each clip from its posed attached-bone envelope (including the large SD head/hair/visor
  // silhouette on `head` and the barrel reach on `gun`) so high arcs (jump), backward tilts (aim,
  // shoot) and horizontal falls (death) never clip against .demo-stage on desktop or phone.
  function measureClipBoxes(player, assets, attachedSpecs) {
    const pad = 28;
    const boxes = {};
    for (const anim of assets.animations) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const steps = Math.max(1, Math.ceil((anim.duration || 0) * 30));
      player.play(anim.name);
      player.repose();
      for (let i = 0; i <= steps; i++) {
        for (const spec of attachedSpecs) {
          const b = player.bone(spec.name);
          if (b.active === false) continue;
          const rad = (b.rotationX * Math.PI) / 180;
          const cos = Math.cos(rad), sin = Math.sin(rad);
          if (spec.name === 'head') {
            for (const lx of [-25, 195]) {
              for (const ly of [-115, 195]) {
                const px = b.x + lx * cos - ly * sin;
                const py = b.y + lx * sin + ly * cos;
                minX = Math.min(minX, px);
                maxX = Math.max(maxX, px);
                minY = Math.min(minY, py);
                maxY = Math.max(maxY, py);
              }
            }
          } else {
            const len = spec.name === 'gun' ? 125 : (spec.length || 0);
            const tx = b.x + cos * len;
            const ty = b.y + sin * len;
            minX = Math.min(minX, b.x - pad, tx - pad);
            maxX = Math.max(maxX, b.x + pad, tx + pad);
            minY = Math.min(minY, b.y - pad, ty - pad);
            maxY = Math.max(maxY, b.y + pad, ty + pad);
          }
        }
        if (i < steps && anim.duration > 0) player.advance(anim.duration / steps);
      }
      boxes[anim.name] = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    return boxes;
  }

  function unionBoxes(boxes) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const b of boxes) {
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  ui.start.addEventListener('click', start);
  const pick = () => {
    remember(ui.character.value, ui.outfit.value);
    if (lib) load();
  };
  ui.character?.addEventListener('change', pick);
  ui.outfit?.addEventListener('change', pick);
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
