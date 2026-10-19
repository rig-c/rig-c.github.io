---
navLabel: Overview
title: rig-c Docs — What Each Package Is, When to Use It, How It Works
description: Concept docs for the rig-c toolchain — what each package solves, what it produces, and how it works. Details live in each package's repository.
keywords: rig-c docs, 2D rigging documentation, Spine 4.3, @rig-c/parts, @rig-c/pose, rig-c, @rig-c/review, @rig-c/play
repoUrl: https://github.com/rig-c
summaryForLlms: Docs hub: the rig-c packages in pipeline order, each with what it is, when to use it, what it produces, and how it works.
---
# Docs

rig-c is a set of small packages that hand files to each other: a painting split into layers goes in at one end, and a rig that plays in a browser, a game engine, or the Spine editor comes out at the other. These pages explain what each package is for and how it works. Flags, schemas, and every rule live in the package's own repository — each page links there.

## Start here

{{docs-map}}

## How the pieces fit

1. **Parts** turns the painting's layers into rig-space parts and authors a first rig over them.
2. **Pose** turns a recorded body pose sequence into an animation on that rig.
3. **Core** (`rigc`) compiles the rig and motion specs, gates them by named assertions, and writes only when every one passes.
4. **Review** lets a person look at what an agent built and hand back feedback bound to a frame, bone, or slot.
5. **Play** and the **adapters** run the compiled model in a page or a game engine with no Spine runtime.
