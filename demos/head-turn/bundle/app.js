import { Container, PixiRig, WebGLRenderer, loadModel, readModel } from "./runtime.js";

export const HEAD_SPRING_OMEGA0 = 20;

export class PointerDialRefusal extends Error {
  constructor(axis, bone, detail) {
    super(`PointerDials: axis "${axis}", bone "${bone}": ${detail}`);
    this.name = "PointerDialRefusal";
    this.axis = axis;
    this.bone = bone;
  }
}

export function clampRange(value, min, max) {
  if (!Number.isFinite(value)) return 0;
  const clamped = Math.max(min, Math.min(max, value));
  return clamped === 0 ? 0 : clamped;
}

function clampUnit(value) {
  return clampRange(value, -1, 1);
}

export function pointerToNormalized(clientX, clientY, rect) {
  if (!(rect.width > 0) || !(rect.height > 0)) {
    return { fx: 0, fy: 0 };
  }
  const cx = rect.left + rect.width * 0.5;
  const cy = rect.top + rect.height * 0.5;
  const fx = clampUnit((clientX - cx) / (rect.width * 0.5));
  const fy = clampUnit((cy - clientY) / (rect.height * 0.5));
  return {
    fx: fx === 0 ? 0 : fx,
    fy: fy === 0 ? 0 : fy,
  };
}

export function stepCriticallyDampedSpring2D(state, targetX, targetY, dt, omega0 = HEAD_SPRING_OMEGA0) {
  if (!(dt > 0) || !Number.isFinite(dt)) return;
  const ex = state.x - targetX;
  const ey = state.y - targetY;
  if (ex === 0 && ey === 0 && state.vx === 0 && state.vy === 0) {
    state.x = targetX;
    state.y = targetY;
    return;
  }
  const tau = omega0 * dt;
  const exp = Math.exp(-tau);
  const nextX = targetX + (ex * (1 + tau) + state.vx * dt) * exp;
  const nextY = targetY + (ey * (1 + tau) + state.vy * dt) * exp;
  const nextVx = (state.vx * (1 - tau) - omega0 * omega0 * dt * ex) * exp;
  const nextVy = (state.vy * (1 - tau) - omega0 * omega0 * dt * ey) * exp;

  state.x = Math.abs(nextX - targetX) < 1e-12 && Math.abs(nextVx) < 1e-9 ? targetX : nextX;
  state.y = Math.abs(nextY - targetY) < 1e-12 && Math.abs(nextVy) < 1e-9 ? targetY : nextY;
  state.vx = state.x === targetX ? 0 : nextVx;
  state.vy = state.y === targetY ? 0 : nextVy;
}

export function normalizedToDial(normalized, range) {
  const n = clampUnit(normalized);
  const neutral = clampRange(0, range[0], range[1]);
  return clampRange(neutral + Math.abs(n) * ((n < 0 ? range[0] : range[1]) - neutral), range[0], range[1]);
}

export function readPointerDialBindings(doc, names) {
  const bindings = {};
  const used = new Set();
  for (const axis of ["yaw", "pitch", "roll", "body", "gazeX", "gazeY"]) {
    const bone = names[axis];
    if (bone === undefined && axis !== "yaw" && axis !== "pitch") continue;
    const refuse = (detail) => {
      throw new PointerDialRefusal(axis, bone ?? "", detail);
    };
    if (!bone || !doc.bones.some((b) => b.name === bone)) return refuse("expected a declared dial bone");
    const matches = doc.constraints.filter(
      (c) => c.kind === "slider" && c.record?.kind === "slider" && c.record.bone === bone,
    );
    if (matches.length !== 1) refuse(`found ${matches.length} slider constraints; expected exactly one`);
    const record = matches[0].record;
    if (record?.kind !== "slider") return refuse("expected a parsed slider record");
    if (!record.local || record.loop) refuse("expected a local, non-looping slider");
    const { from, to, scale } = record;
    const duration = record.timelines.duration;
    if (![from, to, scale, duration].every(Number.isFinite) || scale === 0 || duration <= 0) {
      refuse("expected finite from/to, nonzero scale and positive animation duration");
    }
    const a = from - to / scale;
    const b = from + (duration - to) / scale;
    if (![a, b].every(Number.isFinite) || a === b) refuse("slider does not define a finite, nonzero dial range");
    const range = a < b ? [a, b] : [b, a];
    const channel = record.property === "rotate" ? "rotation" : record.property;
    const key = `${bone}/${channel}`;
    if (used.has(key)) refuse("dial channel is already bound to another axis");
    used.add(key);
    bindings[axis] = Object.freeze({
      bone,
      slider: matches[0].name,
      animation: matches[0].animation,
      channel,
      range: Object.freeze(range),
    });
  }
  return Object.freeze(bindings);
}

export function detectSliderDirectionSign(doc, animationName, channel) {
  if (!animationName) return 1;
  const anim = doc.animations.find((a) => a.name === animationName);
  if (!anim) return 1;
  const probeBone =
    anim.timelines.bones.find((b) => b.name === "faceshift") ??
    anim.timelines.bones.find((b) => b.name === "bodyshift") ??
    anim.timelines.bones.find((b) => b.name === "nose") ??
    anim.timelines.bones.find((b) => b.name === "eye_r") ??
    anim.timelines.bones[0];
  if (!probeBone) return 1;
  const tl = probeBone.timelines.find((t) => t.kind === channel);
  if (!tl || tl.keys.length < 2) return 1;
  const firstKey = tl.keys[0];
  const lastKey = tl.keys[tl.keys.length - 1];
  const first = firstKey?.values?.[0] ?? firstKey?.value ?? 0;
  const last = lastKey?.values?.[0] ?? lastKey?.value ?? 0;
  return last < first ? -1 : 1;
}

export class PointerDials {
  constructor(bindings, direction = { yaw: 1, pitch: 1, body: 1 }) {
    this.bindings = bindings;
    this.direction = {
      yaw: direction.yaw ?? 1,
      pitch: direction.pitch ?? 1,
      body: direction.body ?? direction.yaw ?? 1,
    };
    this.fx = 0;
    this.fy = 0;
    this.gain = 1;
    this.gazeScale = 1;
    this.spring = { x: 0, y: 0, vx: 0, vy: 0 };
    this.values = {};
    this.adjust = (bones) => {
      for (const axis of Object.keys(this.bindings)) {
        const dial = this.bindings[axis];
        bones.bone(dial.bone)[dial.channel] = clampRange(this.values[axis] ?? 0, dial.range[0], dial.range[1]);
      }
    };
    this.step(0);
  }

  setPointer(fx, fy) {
    this.fx = clampUnit(fx);
    this.fy = clampUnit(fy);
  }

  clearPointer() {
    this.setPointer(0, 0);
  }

  snapToTarget() {
    this.spring.x = this.fx;
    this.spring.y = this.fy;
    this.spring.vx = 0;
    this.spring.vy = 0;
    return this.step(0);
  }

  setDirectValues(overrides) {
    for (const axis of Object.keys(this.bindings)) {
      const dial = this.bindings[axis];
      const raw = overrides[axis] ?? 0;
      this.values[axis] = clampRange(raw, dial.range[0], dial.range[1]);
    }
  }

  step(dt) {
    stepCriticallyDampedSpring2D(this.spring, this.fx, this.fy, dt);
    const hx = clampUnit(this.spring.x * this.gain);
    const hy = clampUnit(this.spring.y * this.gain);
    const normalized = {
      yaw: hx * this.direction.yaw,
      pitch: hy * this.direction.pitch,
      roll: -hx * hy,
      body: hx * this.direction.body,
      gazeX: clampUnit(this.fx * this.gazeScale),
      gazeY: clampUnit(this.fy * this.gazeScale),
    };
    const values = {};
    for (const axis of Object.keys(this.bindings)) {
      const dial = this.bindings[axis];
      values[axis] = normalizedToDial(normalized[axis], dial.range);
    }
    this.values = values;
    return { fx: this.fx, fy: this.fy, hx, hy, values: { ...values } };
  }
}

function classifyClipSegment(timeSeconds) {
  const t = ((timeSeconds % 1) + 1) % 1;
  const frame = t * 24;
  if (frame >= 5 && frame < 10) return "left";
  if (frame >= 10 && frame < 15) return "right";
  if (frame >= 15 && frame < 20) return "up";
  if (frame >= 20 && frame <= 24) return "down";
  return "neutral";
}

function sampleLinearKeys(keys, time) {
  if (!keys || keys.length === 0) return 0;
  if (time <= (keys[0].time ?? 0)) return keys[0].values?.[0] ?? keys[0].value ?? 0;
  for (let i = 0; i < keys.length - 1; i++) {
    const k0 = keys[i];
    const k1 = keys[i + 1];
    const t0 = k0.time ?? 0;
    const t1 = k1.time ?? 0;
    const v0 = k0.values?.[0] ?? k0.value ?? 0;
    const v1 = k1.values?.[0] ?? k1.value ?? 0;
    if (time <= t1) {
      if (k0.curve === "stepped" || !(t1 > t0)) return v0;
      const u = (time - t0) / (t1 - t0);
      return v0 + (v1 - v0) * u;
    }
  }
  const last = keys[keys.length - 1];
  return last.values?.[0] ?? last.value ?? 0;
}

function readClipDialValues(doc, animName, timeSeconds, bindings) {
  const anim = doc.animations.find((a) => a.name === animName);
  if (!anim) return { yaw: 0, pitch: 0, body: 0 };
  const dur = anim.timelines?.duration > 0 ? anim.timelines.duration : 1;
  const t = ((timeSeconds % dur) + dur) % dur;
  const readBoneRotate = (boneName) => {
    if (!boneName) return 0;
    const b = anim.timelines.bones.find((entry) => entry.name === boneName);
    const tl = b?.timelines.find((entry) => entry.kind === "rotate");
    return tl ? sampleLinearKeys(tl.keys, t) : 0;
  };
  return {
    yaw: readBoneRotate(bindings.yaw?.bone),
    pitch: readBoneRotate(bindings.pitch?.bone),
    body: readBoneRotate(bindings.body?.bone),
  };
}

function formatDeg(value) {
  const v = Number.isFinite(value) ? value : 0;
  const clean = Math.abs(v) < 0.05 ? 0 : v;
  return `${clean >= 0 ? "+" : "−"}${Math.abs(clean).toFixed(1)}°`;
}

async function main() {
  const demo = document.querySelector("#demo");
  const loading = document.querySelector("#loading");
  const modePointerBtn = document.querySelector("#mode-pointer");
  const modeClipBtn = document.querySelector("#mode-clip");
  const modeHint = document.querySelector("#mode-hint");
  const yawReadout = document.querySelector("#yawReadout");
  const pitchReadout = document.querySelector("#pitchReadout");
  const bodyReadout = document.querySelector("#bodyReadout");
  const segmentReadout = document.querySelector("#segmentReadout");
  const gainInput = document.querySelector("#gain");
  const gainOutput = document.querySelector("#gainValue");
  const gazeInput = document.querySelector("#gaze");
  const gazeOutput = document.querySelector("#gazeValue");
  const centreBtn = document.querySelector("#centre");

  const params = new URLSearchParams(window.location.search);
  const manualClock = params.get("manual") === "1";
  const disableIdle = params.get("idle") === "0";
  const initialMode = params.get("mode") === "clip" ? "clip" : "pointer";
  const dprOverride = Number(params.get("dpr"));

  const modelUrl = new URL("./skeleton.model.json", import.meta.url).href;
  const [assets, modelText] = await Promise.all([
    loadModel({ modelUrl, setsUrl: null, regions: "none" }),
    fetch(modelUrl).then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch model (${res.status})`);
      return res.text();
    }),
  ]);
  const doc = readModel(modelText, modelUrl);

  const hasBodyYawDial = doc.bones.some((b) => b.name === "body_yaw_dial");
  const hasBodyDial = doc.bones.some((b) => b.name === "body_dial");
  const dialNames = {
    yaw: "yaw_dial",
    pitch: "pitch_dial",
    ...(doc.bones.some((b) => b.name === "roll_dial") ? { roll: "roll_dial" } : {}),
    ...(hasBodyYawDial ? { body: "body_yaw_dial" } : hasBodyDial ? { body: "body_dial" } : {}),
    ...(doc.bones.some((b) => b.name === "gaze_x_dial") ? { gazeX: "gaze_x_dial" } : {}),
    ...(doc.bones.some((b) => b.name === "gaze_y_dial") ? { gazeY: "gaze_y_dial" } : {}),
  };

  const bindings = readPointerDialBindings(doc, dialNames);
  const direction = {
    yaw: detectSliderDirectionSign(doc, bindings.yaw?.animation, "translatex"),
    pitch: detectSliderDirectionSign(doc, bindings.pitch?.animation, "translatey"),
    body: bindings.body ? detectSliderDirectionSign(doc, bindings.body.animation, "translatex") : 1,
  };
  const pointerDials = new PointerDials(bindings, direction);

  const renderer = new WebGLRenderer();
  const resolution = Number.isFinite(dprOverride) && dprOverride > 0
    ? dprOverride
    : Math.min(window.devicePixelRatio || 1, 2);
  await renderer.init({
    width: window.innerWidth,
    height: window.innerHeight,
    resolution,
    autoDensity: true,
    antialias: true,
    backgroundColor: 0x20232a,
    preference: "webgl",
    preserveDrawingBuffer: true,
  });

  const canvas = renderer.canvas;
  canvas.setAttribute("aria-label", "Depth-driven 2.5D character rig rendered on WebGL");
  demo.prepend(canvas);

  const stage = new Container();
  const rig = new PixiRig(assets, { ticker: null, autoUpdate: false });
  stage.addChild(rig);

  // Measure neutral bounds at setup/idle to frame the bust cleanly in the viewport.
  const idleName = assets.animations.find((a) => a.name === "idle")?.name ?? assets.animations[0]?.name ?? null;
  const clipName = assets.animations.find((a) => a.name === "clip")?.name ?? null;
  if (idleName) {
    rig.play(idleName, { loop: true });
  }
  rig.draw();
  const neutralBounds = rig.bounds() ?? { x: -350, y: -250, width: 700, height: 950 };

  function layoutStage() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.resize(w, h);
    const pad = 0.88;
    const scaleX = (w * pad) / Math.max(1, neutralBounds.width);
    const scaleY = (h * pad) / Math.max(1, neutralBounds.height);
    const scale = Math.min(scaleX, scaleY);
    rig.scale.set(scale);
    const centerWorldX = neutralBounds.x + neutralBounds.width * 0.5;
    const centerWorldY = neutralBounds.y + neutralBounds.height * 0.5;
    rig.position.set(w * 0.5 - centerWorldX * scale, h * 0.54 + centerWorldY * scale);
  }

  let mode = initialMode;
  let directOverride = false;

  function updateReadouts(dials, segLabel) {
    if (yawReadout) yawReadout.textContent = formatDeg(dials.yaw ?? 0);
    if (pitchReadout) pitchReadout.textContent = formatDeg(dials.pitch ?? 0);
    if (bodyReadout) bodyReadout.textContent = formatDeg(dials.body ?? 0);
    if (segmentReadout) segmentReadout.textContent = segLabel;
  }

  function applyMode(nextMode) {
    mode = nextMode === "clip" && clipName ? "clip" : "pointer";
    directOverride = false;
    if (modePointerBtn) modePointerBtn.setAttribute("aria-pressed", String(mode === "pointer"));
    if (modeClipBtn) modeClipBtn.setAttribute("aria-pressed", String(mode === "clip"));
    if (gainInput) gainInput.disabled = mode !== "pointer";
    if (gazeInput) gazeInput.disabled = mode !== "pointer";

    if (mode === "clip" && clipName) {
      rig.adjust = null;
      rig.timescale = 1;
      rig.play(clipName, { loop: true });
      if (modeHint) {
        modeHint.textContent =
          "Playing the @rig-c/pose 4-way sign-test clip (neutral → left → right → up → down) via @rig-c/play.";
      }
      const clipDials = readClipDialValues(doc, clipName, rig.time, bindings);
      updateReadouts(clipDials, classifyClipSegment(rig.time));
    } else {
      rig.adjust = pointerDials.adjust;
      if (idleName) {
        rig.play(idleName, { loop: true });
      }
      rig.timescale = disableIdle ? 0 : 1;
      pointerDials.step(0);
      rig.repose();
      if (modeHint) {
        modeHint.textContent =
          "Move the pointer across the character to drive the yaw, pitch, body, and gaze dials through a critically damped spring.";
      }
      updateReadouts(pointerDials.values, "pointer");
    }
    renderer.render({ container: stage });
  }

  layoutStage();
  applyMode(initialMode);

  window.addEventListener("resize", () => {
    layoutStage();
    renderer.render({ container: stage });
  });

  window.addEventListener("pointermove", (event) => {
    if (mode !== "pointer") return;
    if (event.target instanceof Element && event.target.closest(".controls, #controls-toggle")) return;
    const { fx, fy } = pointerToNormalized(event.clientX, event.clientY, canvas.getBoundingClientRect());
    directOverride = false;
    pointerDials.setPointer(fx, fy);
  });

  document.addEventListener("pointerleave", () => {
    if (mode !== "pointer") return;
    pointerDials.clearPointer();
  });

  if (modePointerBtn) {
    modePointerBtn.addEventListener("click", () => applyMode("pointer"));
  }
  if (modeClipBtn) {
    modeClipBtn.addEventListener("click", () => applyMode("clip"));
  }

  if (gainInput && gainOutput) {
    gainInput.addEventListener("input", () => {
      const g = Number(gainInput.value);
      pointerDials.gain = Number.isFinite(g) ? g : 1;
      gainOutput.textContent = `${pointerDials.gain.toFixed(2)}×`;
    });
  }

  if (gazeInput && gazeOutput) {
    gazeInput.addEventListener("input", () => {
      const gz = Number(gazeInput.value);
      pointerDials.gazeScale = Number.isFinite(gz) ? gz : 1;
      gazeOutput.textContent = `${Math.round(pointerDials.gazeScale * 100)}%`;
    });
  }

  if (centreBtn) {
    centreBtn.addEventListener("click", () => {
      pointerDials.clearPointer();
      if (mode === "clip" && clipName) {
        rig.seek(0);
        const clipDials = readClipDialValues(doc, clipName, 0, bindings);
        updateReadouts(clipDials, classifyClipSegment(0));
      } else {
        pointerDials.snapToTarget();
        rig.repose();
        updateReadouts(pointerDials.values, "pointer");
      }
      renderer.render({ container: stage });
    });
  }

  function getFeaturePositions() {
    const readBone = (name) => {
      try {
        const b = rig.bone(name);
        const wx = Number.isFinite(b.x) ? b.x : b.worldX;
        const wy = Number.isFinite(b.y) ? b.y : b.worldY;
        return {
          worldX: wx,
          worldY: wy,
          screenX: rig.position.x + wx * rig.scale.x,
          screenY: rig.position.y - wy * rig.scale.y,
        };
      } catch {
        return null;
      }
    };
    return {
      nose: readBone("nose"),
      eye_l: readBone("eye_l"),
      eye_r: readBone("eye_r"),
      faceshift: readBone("faceshift"),
      face_surface: readBone("face_surface"),
      rear_shift: readBone("rear_shift"),
      bodyshift: readBone("bodyshift"),
      topwear_surface: readBone("topwear_surface"),
      head: readBone("head"),
      chest: readBone("chest"),
    };
  }

  function getRendererInfo() {
    const gl = renderer.gl ?? canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return { renderer: "unavailable", vendor: "unavailable", version: "unavailable", resolution };
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      unmaskedVendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : null,
      unmaskedRenderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : null,
      resolution: renderer.resolution,
      width: renderer.width,
      height: renderer.height,
    };
  }

  function stepFrame(dtSeconds) {
    const dt = Math.min(Math.max(dtSeconds, 0), 0.05);
    const t0 = performance.now();
    let dials;
    let segment;
    if (mode === "clip" && clipName) {
      rig.advance(dt);
      dials = readClipDialValues(doc, clipName, rig.time, bindings);
      segment = classifyClipSegment(rig.time);
    } else {
      if (!directOverride) {
        pointerDials.step(dt);
      }
      if (rig.timescale > 0) {
        rig.advance(dt);
      } else {
        rig.repose();
      }
      dials = { ...pointerDials.values };
      segment = "pointer";
    }
    renderer.render({ container: stage });
    const callbackMs = performance.now() - t0;
    updateReadouts(dials, segment);
    return {
      callbackMs,
      mode,
      time: rig.time,
      segment,
      dials,
      features: getFeaturePositions(),
    };
  }

  window.__headTurnDemo = {
    getMode: () => mode,
    setMode: (nextMode) => applyMode(nextMode),
    setPointer: (fx, fy, snap = false) => {
      if (mode !== "pointer") applyMode("pointer");
      directOverride = false;
      pointerDials.setPointer(fx, fy);
      if (snap) pointerDials.snapToTarget();
    },
    clearPointer: () => pointerDials.clearPointer(),
    setDialsDirect: (overrides) => {
      if (mode !== "pointer") applyMode("pointer");
      directOverride = true;
      pointerDials.setDirectValues(overrides);
      rig.timescale = 0;
      rig.repose();
      renderer.render({ container: stage });
      updateReadouts(pointerDials.values, "direct");
      return {
        dials: { ...pointerDials.values },
        features: getFeaturePositions(),
      };
    },
    seekClip: (timeSeconds) => {
      if (mode !== "clip") applyMode("clip");
      rig.seek(timeSeconds);
      renderer.render({ container: stage });
      const dials = readClipDialValues(doc, clipName, timeSeconds, bindings);
      const segment = classifyClipSegment(timeSeconds);
      updateReadouts(dials, segment);
      return {
        time: timeSeconds,
        segment,
        dials,
        features: getFeaturePositions(),
      };
    },
    stepFrame,
    getRendererInfo,
    getFeaturePositions,
    bindings,
    direction,
    doc,
    rig,
    renderer,
    stage,
    canvas,
  };

  if (loading) loading.remove();
  demo.setAttribute("aria-busy", "false");

  if (!manualClock) {
    let lastNow = performance.now();
    const tick = (now) => {
      const dt = (now - lastNow) * 0.001;
      lastNow = now;
      stepFrame(dt);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

if (typeof document !== "undefined") {
  main().catch((err) => {
    console.error(err);
    const loading = document.querySelector("#loading");
    if (loading) loading.textContent = "Could not load the depth rig.";
  });
}
