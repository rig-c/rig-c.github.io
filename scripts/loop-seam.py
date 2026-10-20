#!/usr/bin/env python3
"""Loop-seam check for a looping clip.

Usage: scripts/loop-seam.py [--bg '#070b18'] [--crop X,Y,W,H] FILE [FILE ...]

FILE is a video (decoded with ffmpeg to RGB) or an animated image
(WebP / APNG / GIF, decoded with Pillow and composited over --bg).

For each file it prints, as mean absolute difference on 0-255 RGB:
  seam  = first frame vs last frame (the wrap)
  step  = median and max of the frame-to-frame differences inside the clip
and PASS when seam <= max step (the wrap is no bigger a jump than any step
the clip already makes), FAIL otherwise. Exit code is 1 if any file fails.

Needs numpy. Pillow is needed for image inputs; videos need ffmpeg/ffprobe
on PATH (or FFMPEG / FFPROBE set).
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np

FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
FFPROBE = os.environ.get("FFPROBE", "ffprobe")
IMAGE_EXT = {".webp", ".png", ".apng", ".gif"}


def parse_bg(text):
    text = text.lstrip("#")
    return np.array([int(text[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float64)


def video_frames(path):
    probe = subprocess.run(
        [FFPROBE, "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "json", path],
        check=True, capture_output=True, text=True)
    stream = json.loads(probe.stdout)["streams"][0]
    w, h = stream["width"], stream["height"]
    raw = subprocess.run(
        [FFMPEG, "-v", "error", "-i", path, "-fps_mode", "passthrough",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        check=True, capture_output=True).stdout
    frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, h, w, 3)
    return [f.astype(np.float64) for f in frames]


def image_frames(path, bg):
    from PIL import Image, ImageSequence
    out = []
    with Image.open(path) as im:
        for frame in ImageSequence.Iterator(im):
            rgba = np.asarray(frame.convert("RGBA"), dtype=np.float64)
            alpha = rgba[..., 3:] / 255.0
            out.append(rgba[..., :3] * alpha + bg * (1.0 - alpha))
    return out


def mad(a, b):
    return float(np.abs(a - b).mean())


def check(path, bg, crop):
    ext = os.path.splitext(path)[1].lower()
    frames = image_frames(path, bg) if ext in IMAGE_EXT else video_frames(path)
    if crop:
        x, y, w, h = crop
        frames = [f[y:y + h, x:x + w] for f in frames]
    if len(frames) < 3:
        raise SystemExit(f"{path}: need at least 3 frames, got {len(frames)}")
    steps = [mad(frames[i], frames[i + 1]) for i in range(len(frames) - 1)]
    seam = mad(frames[-1], frames[0])
    median, largest = float(np.median(steps)), max(steps)
    verdict = "PASS" if seam <= largest else "FAIL"
    print(f"{path}: frames {len(frames)}  seam {seam:.3f}  "
          f"step median {median:.3f} max {largest:.3f} (at {steps.index(largest)}->{steps.index(largest) + 1})  "
          f"seam/max {seam / largest:.2f}  {verdict}")
    return verdict == "PASS"


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--bg", default="#070b18",
                    help="colour transparent images are composited over (default: the page --bg)")
    ap.add_argument("--crop", help="X,Y,W,H region to measure (e.g. one panel)")
    ap.add_argument("files", nargs="+")
    args = ap.parse_args()
    crop = tuple(int(v) for v in args.crop.split(",")) if args.crop else None
    ok = [check(f, parse_bg(args.bg), crop) for f in args.files]
    sys.exit(0 if all(ok) else 1)


if __name__ == "__main__":
    main()
