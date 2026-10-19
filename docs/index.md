# Docs

rig-c is a set of small packages that hand files to each other: a painting split into layers goes in at one end, and a rig that plays in a browser, a game engine, or the Spine editor comes out at the other. These pages explain what each package is for and how it works. Flags, schemas, and every rule live in the package's own repository — each page links there.

## Start here

- [**Getting Started**](/docs/getting-started/): Tested 10-step no-GPU, no-Python walkthrough (about a minute of commands on an Apple M4) from pre-decomposed character layers to a compiled rig with idle and wave animations playing in the browser, plus downstream export routes.
- [**Parts**](/docs/parts/) — `@rig-c/parts`: @rig-c/parts is a Bun CLI that turns one character painting and its See-through layer decomposition into measured parts, a rig-c rig spec and an idle, gated and packed by rig-c into Spine 4.3 skeleton data.
- [**Pose**](/docs/pose/) — `@rig-c/pose`: @rig-c/pose is a Bun CLI that cleans a body-18 joint-position sequence and retargets it onto a rig-c rig as gated, verified bone keys.
- [**Core**](/docs/core/) — `rig-c`: rig-c (also @rig-c/core, CLI rigc) compiles a JSON rig spec and motion spec plus loose part PNGs into Spine 4.3 skeleton data, gated by named assertions so nothing invalid is written.
- [**Review**](/docs/review/) — `@rig-c/review`: @rig-c/review is a local, loopback-only CLI and browser workspace for a person to inspect a compiled rig, compare it with reference video, and save structured, source-bound feedback for the producing agent.
- [**Play**](/docs/play/) — `@rig-c/play`: @rig-c/play is the browser runtime that loads rigc's compiled skeleton.model.json and plays it as plain DOM elements (CSS matrix per rigid slot, small canvases per mesh) or as one canvas per player.
- [**Adapters**](/docs/adapters/) — `@rig-c/pixi, @rig-c/phaser, @rig-c/three`: @rig-c/pixi, @rig-c/phaser and @rig-c/three play rigc's skeleton.model.json inside PixiJS, Phaser or Three.js scenes, posed through @rig-c/play and drawn with each host's native objects, without a Spine runtime.
- [**Licensing**](/docs/licensing/): Licensing by path: rig-c code is MIT; rig-c's own model played by @rig-c/play or the adapters integrates no Spine Runtime; Spine data in a Spine Runtime or the Spine Editor falls under Esoteric Software's terms; sample assets carry their own licences (Getting Started's inputs are CC BY-NC 4.0).

## How the pieces fit

1. **Parts** turns the painting's layers into rig-space parts and authors a first rig over them.
2. **Pose** turns a recorded body pose sequence into an animation on that rig.
3. **Core** (`rigc`) compiles the rig and motion specs, gates them by named assertions, and writes only when every one passes.
4. **Review** lets a person look at what an agent built and hand back feedback bound to a frame, bone, or slot.
5. **Play** and the **adapters** run the compiled model in a page or a game engine with no Spine runtime.
