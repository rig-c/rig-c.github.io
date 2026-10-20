#!/usr/bin/env python3
"""Lay the three adapter captures side by side (the Adapters page clip).

Usage: scripts/adapters-composite.py CAPTURE OUT [--cycles 4]

CAPTURE is the folder scripts/adapters-capture.ts wrote (pixi/, phaser/,
three/, each f0000.png .. f0026.png: one 0.9 s cycle of `walk` at 30 fps).
OUT receives f0000.png, f0001.png, ... - the cycle repeated --cycles times -
which scripts/encode-video.sh reads as the `adapters-three-engines` row.

Each panel is the same window of rig space, cut from that demo's canvas and
resampled (Lanczos) to PANEL_W x PANEL_H. The demos place the rig themselves:
the Pixi and Phaser demos (adapters src/main.ts, computeStagePlacement) scale
it to 78% of an 800x600 stage around the stage centre; the Three.js demo
(adapters src/three-demo.ts) scales it to 430 px tall and centres it in a
1000x600 orthographic view. For `walk` (bounds 576 x 736 world units, the same
at every time sampled) that is 0.6359 px per unit (Pixi, Phaser) and 0.5842
(Three.js); the script checks each frame's drawn rectangle against that
placement before cutting. Pixi and Phaser draw on a transparent canvas (the
demo page shows a CSS checkerboard behind it); here they are composited over
the Three.js demo's clear colour, #14161a, so the three panels share a
background. The Three.js demo's wireframe cube sits outside the window.

It prints, per pair of panels, the mean absolute difference on 0-255 RGB
between the two panels at the same time (mean and max over the cycle), and the
Pixi-vs-Phaser difference at the demos' own resolution, before resampling.

Needs python3 with Pillow and numpy.
"""
import argparse
import glob
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

BG = (7, 11, 24)            # page --bg
PANEL_BG = (20, 22, 26)     # three-demo.ts setClearColor('#14161a')
TITLE = (230, 234, 245)
MUTED = (150, 160, 180)
M, TOP = 20, 58             # margin and label band
PANEL_W, PANEL_H = 448, 560
RIG_W, RIG_H = 576.0, 736.0          # walk's bounds in world units
UNITS_PER_PX = (RIG_H + 80.0) / PANEL_H  # 40 units of margin above and below

HOSTS = [
    # name, label, engine, canvas centre (px), px per world unit
    ("pixi", "@rig-c/pixi 0.1.1", "PixiJS 8.22.0", (400.0, 300.0), min(800 * 0.78 / RIG_W, 600 * 0.78 / RIG_H)),
    ("phaser", "@rig-c/phaser 0.1.1", "Phaser 4.2.1", (400.0, 300.0), min(800 * 0.78 / RIG_W, 600 * 0.78 / RIG_H)),
    ("three", "@rig-c/three 0.1.1", "Three.js 0.186.1", (500.0, 300.0), min(430 / RIG_H, 850 / RIG_W)),
]


def font(size):
    for name in ("Helvetica.ttc", "Arial.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def flatten(path):
    rgba = np.asarray(Image.open(path).convert("RGBA"), dtype=np.float64)
    alpha = rgba[..., 3:] / 255.0
    return rgba[..., :3] * alpha + np.array(PANEL_BG, float) * (1.0 - alpha), rgba[..., 3]


def drawn_rect(name, rgb, alpha):
    if name == "three":
        mask = np.abs(rgb - np.array(PANEL_BG, float)).sum(-1) > 0
        mask[:, 760:] = False  # the demo's wireframe cube
    else:
        mask = alpha > 0
    ys, xs = np.nonzero(mask)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def mad(a, b):
    return float(np.abs(a - b).mean())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("capture")
    ap.add_argument("out")
    ap.add_argument("--cycles", type=int, default=4)
    args = ap.parse_args()

    names = {h[0]: sorted(glob.glob(os.path.join(args.capture, h[0], "f[0-9][0-9][0-9][0-9].png"))) for h in HOSTS}
    count = len(names["pixi"])
    if count == 0 or any(len(v) != count for v in names.values()):
        sys.exit(f"capture: frame counts differ or are empty: { {k: len(v) for k, v in names.items()} }")

    W = M + 3 * PANEL_W + 2 * M + M
    H = TOP + PANEL_H + M
    title, small = font(20), font(15)
    os.makedirs(args.out, exist_ok=True)

    panels_all = {h[0]: [] for h in HOSTS}
    native_pp = []
    cycle = []
    for i in range(count):
        frame = Image.new("RGB", (W, H), BG)
        d = ImageDraw.Draw(frame)
        flat = {}
        for k, (name, label, engine, (cx, cy), s) in enumerate(HOSTS):
            rgb, alpha = flatten(names[name][i])
            flat[name] = rgb
            # The demo's placement predicts where the rig's bounds land.
            want = (cx - RIG_W / 2 * s, cy - RIG_H / 2 * s, cx + RIG_W / 2 * s, cy + RIG_H / 2 * s)
            got = drawn_rect(name, rgb, alpha)
            if max(abs(g - w) for g, w in zip(got, want)) > 2.0:
                sys.exit(f"{name} frame {i}: rig drawn at {got}, placement predicts {tuple(round(v, 1) for v in want)}")
            hw, hh = PANEL_W / 2 * UNITS_PER_PX * s, PANEL_H / 2 * UNITS_PER_PX * s
            box = (cx - hw, cy - hh, cx + hw, cy + hh)
            src = Image.fromarray(np.rint(rgb).astype(np.uint8), "RGB")
            panel = src.resize((PANEL_W, PANEL_H), Image.LANCZOS, box=box)
            panels_all[name].append(np.asarray(panel, dtype=np.float64))
            x = M + k * (PANEL_W + M)
            frame.paste(panel, (x, TOP))
            d.text((x, 10), label, fill=TITLE, font=title)
            d.text((x, 35), engine, fill=MUTED, font=small)
        # Pixi vs Phaser before resampling: same stage, same placement.
        native_pp.append(mad(flat["pixi"], flat["phaser"]))
        cycle.append(frame)

    for n in range(args.cycles * count):
        cycle[n % count].save(os.path.join(args.out, f"f{n:04d}.png"))

    print(f"{count} captured frames x {args.cycles} cycles = {args.cycles * count} frames, {W}x{H}")
    for a, b in (("pixi", "phaser"), ("pixi", "three"), ("phaser", "three")):
        vals = [mad(p, q) for p, q in zip(panels_all[a], panels_all[b])]
        print(f"panel MAD {a} vs {b}: mean {np.mean(vals):.3f} max {max(vals):.3f}")
    print(f"canvas MAD pixi vs phaser (800x600, unresampled): mean {np.mean(native_pp):.3f} max {max(native_pp):.3f}")
    # How far the rig moves between neighbouring frames, for scale.
    steps = [mad(panels_all["pixi"][i], panels_all["pixi"][(i + 1) % count]) for i in range(count)]
    print(f"pixi panel frame-to-frame step: median {np.median(steps):.3f} max {max(steps):.3f} (wrap {steps[-1]:.3f})")


if __name__ == "__main__":
    main()
