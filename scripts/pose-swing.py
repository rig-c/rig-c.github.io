#!/usr/bin/env python3
"""Rebuild the Pose page hero (assets/docs/pose-swing.mp4 and its poster).

Usage: scripts/pose-swing.py [--rigc "bunx rig-c@2.61.0"] [--window 21:60] [--keep DIR]

Three columns on the page background:
  1. the source pose: the cleaned body-18 sequence the retarget read
     (assets/rigs/character-1-swing/swing.pose.clean.json), drawn as a stick
     figure on the rig render's own grid, the mapped right arm in orange;
  2. Character 1's rig playing `swing`, drawn by `rigc render` from the
     committed model (assets/rigs/character-1-swing/skeleton.model.json, the
     same file the Play page's live player loads);
  3. an inset: the forearm and cup, rendered by rigc at twice the size, with
     the cropped region marked by orange corners on the rig panel.

The loop. `swing` is 3 s (73 keys, 0..3 s) but does not close: `rig-pose
clean` ran with "loop": false and held the wrist at the outward end
(frames 4-23, 26-37, 40-59 in its "holds"), so the forearm reads 2.355 deg at
t = 0 and 4.108 deg at t = 3 s. No 72-frame cut of it wraps without a jump.
The clip is therefore one whole swing that does close: frames 21..59 of the
motion (39 frames, 1.625 s), from the start of the inward swing back through
the outward hold, whose last frame (-1.154 deg) sits one ordinary step before
frame 21 (-0.758 deg). The cycle is rotated to start at the frame whose
forearm track is nearest 0 (the rest pose), which is also the poster.

Rendering. The site carries the model document and the part PNGs, not the
Spine skeleton.json the build wrote beside them. `rigc render` poses a
rigc-compiled/3 document with its own core and reads off skeleton.json only
its roster (bones, slots, skins, animation names and durations), but refuses a
skeleton.json whose sha256 is not the one the document records. So the script
copies the build into a work directory, writes a roster-only skeleton.json
there and records that file's digest in the copy of the document. The posing
and the pixels are the committed document's: checked once against the
original build's skeleton.json, all 73 frames were identical (max difference
0 on 0-255).

Encode: the site recipe (scripts/encode-video.sh) - H.264 High, yuv420p,
BT.709, -tune animation, CRF 20, closed GOP 60, faststart, x264 zones coding
frame 0 and the last 3 frames at QP 12. Then the loop seam is measured on the
encoded file, on the rig panel and on the whole frame (mean absolute
difference on 0-255 RGB, first vs last frame against the largest step inside
the clip); the script exits 1 unless both PASS.

Needs: bun (for bunx) or a rigc on PATH via --rigc, ffmpeg/ffprobe with
libx264 (FFMPEG/FFPROBE to override), python3 with Pillow and numpy.
"""
import argparse
import hashlib
import json
import os
import shlex
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RIG = os.path.join(ROOT, "assets/rigs/character-1-swing")
POSE = os.path.join(RIG, "swing.pose.clean.json")
OUT = os.path.join(ROOT, "assets/docs/pose-swing.mp4")
POSTER = os.path.join(ROOT, "assets/docs/pose-swing-poster.jpg")
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
FFPROBE = os.environ.get("FFPROBE", "ffprobe")

RIGC = "bunx rig-c@2.61.0"   # the rig-c the swing build was made with (Play page SOURCES)
FPS = 24
PANEL = 720                  # rigc --max: the rig panel is 274x720
M, TOP = 20, 52              # margin and title band
BG = (7, 11, 24)             # page --bg
TITLE = (230, 234, 245)
ORANGE = (230, 90, 40)
# The inset: this box of the 1x rig panel (x, y, w, h), drawn from the 2x render.
CROP = (18, 236, 88, 204)

LIMBS = [("neck", "r_shoulder"), ("neck", "l_shoulder"), ("l_shoulder", "l_elbow"), ("l_elbow", "l_wrist"),
         ("neck", "mid_hip"), ("mid_hip", "r_hip"), ("mid_hip", "l_hip"), ("r_hip", "r_knee"), ("r_knee", "r_ankle"),
         ("l_hip", "l_knee"), ("l_knee", "l_ankle"), ("neck", "nose"), ("nose", "r_eye"), ("nose", "l_eye"),
         ("r_eye", "r_ear"), ("l_eye", "l_ear")]
ARM = [("r_shoulder", "r_elbow"), ("r_elbow", "r_wrist")]

X264 = ["-c:v", "libx264", "-profile:v", "high", "-preset", "veryslow", "-tune", "animation", "-crf", "20",
        "-g", "60", "-keyint_min", "60", "-sc_threshold", "0", "-flags", "+cgop",
        "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-color_range", "tv", "-an", "-movflags", "+faststart"]


def font(size):
    for name in ("Helvetica.ttc", "Arial.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def candidate(work):
    """A copy of the committed build that `rigc render` accepts (see the module docstring)."""
    cand = os.path.join(work, "candidate")
    os.makedirs(cand)
    for name in os.listdir(RIG):
        if name.endswith(".png"):
            shutil.copy(os.path.join(RIG, name), cand)
    text = open(os.path.join(RIG, "skeleton.model.json"), encoding="utf-8").read()
    model = json.loads(text)
    bone = lambda b: {"name": b["name"], **({"parent": b["parent"]} if b.get("parent") else {})}
    roster = {
        "skeleton": {"spine": "4.3.13"},
        "bones": [bone(b) for b in model["bones"]],
        "slots": [{"name": s["name"], "bone": s["bone"]} for s in model["slots"]],
        "skins": [{"name": k["name"], "attachments": {}} for k in model["skins"]],
        "animations": {a["name"]: {"bones": {"root": {"rotate": [{"time": 0}, {"time": a["duration"]}]}}}
                       for a in model["animations"]},
    }
    data = (json.dumps(roster, indent=2) + "\n").encode()
    open(os.path.join(cand, "skeleton.json"), "wb").write(data)
    old = model["spine"]["sha256"]
    assert text.count(old) == 1
    open(os.path.join(cand, "skeleton.model.json"), "w", encoding="utf-8").write(
        text.replace(old, hashlib.sha256(data).hexdigest()))
    return cand, model


def render(rigc, cand, out, size):
    cmd = shlex.split(rigc) + ["render", "--candidate", cand, "--animation", "swing", "--fps", str(FPS),
                               "--max", str(size), "--poser", "core", "--out", out]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)
    frames = json.load(open(os.path.join(out, "frames.json")))
    sub = os.path.join(out, frames["sets"][0]["dir"])
    n = frames["sets"][0]["written"]
    return frames, [Image.open(os.path.join(sub, f"f{i:04d}.png")).convert("RGB") for i in range(n)]


def forearm_track(model):
    swing = next(a for a in model["animations"] if a["name"] == "swing")
    bone = next(b for b in swing["bones"] if b["name"] == "sleeve_r1")
    keys = next(t for t in bone["timelines"] if t["name"] == "rotate")["keys"]
    return [k["value"] for k in keys]


def source_panel(frame, vp, bg):
    """The cleaned pose's frame as a stick figure on the rig render's grid (painting px -> world -> px)."""
    W, H, s = vp["pixelWidth"], vp["pixelHeight"], vp["scale"]

    def px(p):  # the rig's root sits at painting (400, 2284), rig_scale 1
        wx, wy = p[0] - 400, 2284 - p[1]
        return ((wx - vp["x"]) * s, H - (wy - vp["y"]) * s)

    J = {k: v["at"] for k, v in frame["people"][0]["joints"].items() if v.get("at")}
    J["mid_hip"] = [(J["r_hip"][0] + J["l_hip"][0]) / 2, (J["r_hip"][1] + J["l_hip"][1]) / 2]
    im = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(im)
    for a, b in LIMBS:
        if a in J and b in J:
            d.line([px(J[a]), px(J[b])], fill=(70, 78, 100), width=5)
    for a, b in ARM:
        d.line([px(J[a]), px(J[b])], fill=ORANGE, width=6)
    for k, p in J.items():
        if k == "mid_hip":
            continue
        x, y = px(p)
        r = 6 if k in ("r_shoulder", "r_elbow", "r_wrist") else 4
        d.ellipse([x - r, y - r, x + r, y + r], fill=ORANGE if r == 6 else (40, 46, 64))
    return im


def corners(d, box, length=10, width=2):
    x0, y0, x1, y1 = box
    for (x, y, dx, dy) in ((x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)):
        d.line([(x, y), (x + dx * length, y)], fill=ORANGE, width=width)
        d.line([(x, y), (x, y + dy * length)], fill=ORANGE, width=width)


def mad(a, b):
    return float(np.abs(a - b).mean())


def seam(frames, label):
    steps = [mad(frames[i], frames[i + 1]) for i in range(len(frames) - 1)]
    s, top = mad(frames[-1], frames[0]), max(steps)
    ok = s <= top
    print(f"   {label}: seam {s:.3f}  step median {float(np.median(steps)):.3f} max {top:.3f} "
          f"(at {steps.index(top)}->{steps.index(top) + 1})  seam/max {s / top:.2f}  {'PASS' if ok else 'FAIL'}")
    return ok


def decode(path):
    w, h = (int(v) for v in subprocess.run(
        [FFPROBE, "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0",
         path], check=True, capture_output=True, text=True).stdout.strip().split(","))
    raw = subprocess.run([FFMPEG, "-v", "error", "-i", path, "-fps_mode", "passthrough", "-f", "rawvideo",
                          "-pix_fmt", "rgb24", "-"], check=True, capture_output=True).stdout
    return [f.astype(np.float64) for f in np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)]


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--rigc", default=RIGC, help=f"how to run rigc (default: {RIGC})")
    ap.add_argument("--window", default="21:60", help="frames of the 73 to loop, START:END (end excluded)")
    ap.add_argument("--keep", help="also keep the composited PNG frames in this directory")
    args = ap.parse_args()
    start, end = (int(v) for v in args.window.split(":"))

    work = tempfile.mkdtemp(prefix="pose-swing-")
    try:
        cand, model = candidate(work)
        frames1, rig1 = render(args.rigc, cand, os.path.join(work, "r1"), PANEL)
        frames2, rig2 = render(args.rigc, cand, os.path.join(work, "r2"), PANEL * 2)
        vp, bg = frames1["viewport"], tuple(frames1["background"][:3])
        W, H = vp["pixelWidth"], vp["pixelHeight"]
        # Same world box at twice the scale (its pixel width rounds to 549, not 548; the crop never reaches it).
        v2 = frames2["viewport"]
        if (v2["x"], v2["y"]) != (vp["x"], vp["y"]) or abs(v2["scale"] / vp["scale"] - 2) > 1e-9:
            sys.exit("the 2x render is not the panel's box at twice the scale")
        pose = json.load(open(POSE))["frames"]
        if len(pose) != len(rig1):
            sys.exit(f"pose has {len(pose)} frames, render {len(rig1)}")

        track = forearm_track(model)
        window = list(range(start, end))
        rest = min(window, key=lambda i: abs(track[i]))
        order = window[window.index(rest):] + window[:window.index(rest)]
        print(f"pose-swing: frames {start}..{end - 1} of {len(rig1)} ({len(order)} frames, {len(order) / FPS:.3f} s), "
              f"starting at frame {rest} (forearm {track[rest]:.3f} deg); forearm over the clip "
              f"{min(track[i] for i in window):.3f}..{max(track[i] for i in window):.3f} deg; "
              f"wrap {track[window[-1]]:.3f} -> {track[window[0]]:.3f} deg")

        cx, cy, cw, ch = CROP
        IW, IH = 2 * cw, 2 * ch
        CW, CH = M * 4 + 2 * W + IW, TOP + H + M
        CW += CW % 2
        CH += CH % 2
        rig_x, inset_x = 2 * M + W, 3 * M + 2 * W
        inset_y = TOP + cy + ch // 2 - IH // 2
        title, small = font(22), font(15)

        out_dir = os.path.join(work, "comp")
        os.makedirs(out_dir)
        for n, i in enumerate(order):
            c = Image.new("RGB", (CW, CH), BG)
            d = ImageDraw.Draw(c)
            c.paste(source_panel(pose[i], vp, bg), (M, TOP))
            c.paste(rig1[i], (rig_x, TOP))
            c.paste(rig2[i].crop((2 * cx, 2 * cy, 2 * (cx + cw), 2 * (cy + ch))), (inset_x, inset_y))
            d.text((M, 16), "Source pose", fill=TITLE, font=title)
            d.text((rig_x, 16), "Retargeted onto Character 1", fill=TITLE, font=title)
            d.text((inset_x, inset_y - 24), "2×", fill=TITLE, font=small)
            corners(d, (rig_x + cx, TOP + cy, rig_x + cx + cw - 1, TOP + cy + ch - 1))
            d.rectangle([inset_x - 2, inset_y - 2, inset_x + IW + 1, inset_y + IH + 1], outline=ORANGE, width=2)
            c.save(os.path.join(out_dir, f"{n:04d}.png"))
        if args.keep:
            shutil.copytree(out_dir, args.keep, dirs_exist_ok=True)

        n = len(order)
        subprocess.run([FFMPEG, "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(out_dir, "%04d.png"),
                        "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", *X264,
                        "-x264-params", f"zones=0,0,q=12/{n - 3},{n - 1},q=12", OUT], check=True)
        subprocess.run([FFMPEG, "-v", "error", "-y", "-i", OUT, "-frames:v", "1", "-q:v", "3", POSTER], check=True)

        nb = subprocess.run([FFPROBE, "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries",
                             "stream=nb_read_frames", "-of", "default=nw=1:nk=1", OUT],
                            check=True, capture_output=True, text=True).stdout.strip()
        print(f"   {os.path.relpath(OUT, ROOT)}: {CW}x{CH}, {nb} frames at {FPS} fps, {os.path.getsize(OUT)} bytes")
        if int(nb) != n:
            sys.exit(f"encoded {nb} frames, expected {n}")
        enc = decode(OUT)
        ok = seam([f[TOP:TOP + H, rig_x:rig_x + W] for f in enc], "rig panel")
        ok = seam(enc, "whole frame") and ok
        sys.exit(0 if ok else 1)
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
