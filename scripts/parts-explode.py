#!/usr/bin/env python3
"""Render the /docs/parts/ hero clip: assembled Character 1 -> labelled parts grid -> assembled.

Source:  rig-c/examples @ c239b09328ca7364361b9761fac817502c09ede0, family/roa/out/
         (parts/*.png and parts.json, read with `git show <sha>:<path>` so the working tree
         of the clone does not matter).
Command: python3 scripts/parts-explode.py --examples <path to a rig-c/examples clone>
Output:  assets/docs/parts-explode.mp4, assets/docs/parts-explode-poster.jpg
Needs:   Python 3, Pillow, NumPy, git, ffmpeg with libx264 (`--ffmpeg` or $FFMPEG to override).

Only the assembled frames are data: every part drawn at the x/y that parts.json records, in
parts.json's list order (the rig's draw order), scaled as one figure. The grid layout, the part
scale inside each grid cell and the crossfades are this page's illustration. No frame moves a
part through the figure: the clip only dissolves between the two stills.
"""
import argparse, io, json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

SHA = "c239b09328ca7364361b9761fac817502c09ede0"
ROOT = "family/roa/out"
W, H, FPS = 1280, 720, 30
BG = (7, 11, 24)
LABEL = (150, 158, 178)
FIG_TOP, FIG_H = 40, 640                     # assembled figure box on the canvas
# timeline in frames: hold assembled, dissolve, hold grid, dissolve, hold assembled
HOLD_A, FADE, HOLD_G, HOLD_END = 30, 18, 45, 36
# grid rows: (row height, cell content height, parts left to right)
ROWS = [
    (170, 132, ["hair_back", "ear_r", "face", "ear_l", "hair_front"]),
    (120, 88, ["brow_r", "brow_l", "lash_r", "lash_l", "nose", "mouth", "earring", "neck"]),
    (396, 362, ["handwear_r", "topwear", "bottomwear", "shoes"]),
]
GRID_TOP, LABEL_GAP = 20, 6


def git_bytes(repo, path):
    return subprocess.run(["git", "-C", repo, "show", f"{SHA}:{ROOT}/{path}"],
                          check=True, capture_output=True).stdout


def font(size):
    for name in ("Menlo.ttc", "DejaVuSansMono.ttf", "Consolas.ttf", "Courier New.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def over(canvas, img, x, y):
    canvas.alpha_composite(img, (int(round(x)), int(round(y))))


def assembled(parts, imgs, rig_w, rig_h):
    """parts.json placement, list order, one uniform scale; returns frame + face box."""
    fig = Image.new("RGBA", (rig_w, rig_h), (0, 0, 0, 0))
    for p in parts:
        fig.alpha_composite(imgs[p["name"]], (p["x"], p["y"]))
    s = FIG_H / rig_h
    fw, fh = round(rig_w * s), FIG_H
    ox = (W - fw) // 2
    canvas = Image.new("RGBA", (W, H), BG + (255,))
    over(canvas, fig.resize((fw, fh), Image.LANCZOS), ox, FIG_TOP)
    f = next(p for p in parts if p["name"] == "face")
    face = (ox + f["x"] * s, FIG_TOP + f["y"] * s, f["w"] * s, f["h"] * s)
    return canvas.convert("RGB"), face


def grid(parts, imgs):
    canvas = Image.new("RGBA", (W, H), BG + (255,))
    draw = ImageDraw.Draw(canvas)
    lab = font(15)
    y0, face = GRID_TOP, None
    named = {p["name"] for p in parts}
    laid = [n for _, _, row in ROWS for n in row]
    assert sorted(laid) == sorted(named), f"grid {sorted(laid)} != parts.json {sorted(named)}"
    for row_h, content_h, row in ROWS:
        cell_w = W / len(row)
        for i, name in enumerate(row):
            img = imgs[name]
            s = min(1.0, (cell_w - 24) / img.width, content_h / img.height)
            t = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
            cx = cell_w * (i + 0.5)
            x, y = cx - t.width / 2, y0 + (content_h - t.height) / 2
            over(canvas, t, x, y)
            if name == "face":
                face = (x, y, t.width, t.height)
            tw = draw.textlength(name, font=lab)
            draw.text((cx - tw / 2, y0 + content_h + LABEL_GAP), name, fill=LABEL, font=lab)
        y0 += row_h
    return canvas.convert("RGB"), face


def ease(t):
    return t * t * (3 - 2 * t)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--examples", required=True, help="path to a rig-c/examples clone holding " + SHA[:7])
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "assets", "docs"))
    ap.add_argument("--ffmpeg", default=os.environ.get("FFMPEG", "ffmpeg"))
    a = ap.parse_args()
    print(f"examples {SHA} {ROOT}")
    print("command: python3 scripts/parts-explode.py --examples <clone>")

    meta = json.loads(git_bytes(a.examples, "parts.json"))
    parts = meta["parts"]
    rig_w, rig_h = meta["rig_size"]
    imgs = {p["name"]: Image.open(io.BytesIO(git_bytes(a.examples, f"parts/{p['name']}.png"))).convert("RGBA")
            for p in parts}

    # parts.json placement must reproduce the recomposite it ships with (white background)
    ref = np.asarray(Image.open(io.BytesIO(git_bytes(a.examples, "recomposite_rig.png"))).convert("RGB"), np.int16)
    white = Image.new("RGBA", (rig_w, rig_h), (255, 255, 255, 255))
    for p in parts:
        white.alpha_composite(imgs[p["name"]], (p["x"], p["y"]))
    rec = np.abs(np.asarray(white.convert("RGB"), np.int16) - ref).mean()
    print(f"placement vs recomposite_rig.png: mean abs diff {rec:.4f} (0-255)")

    A, face_a = assembled(parts, imgs, rig_w, rig_h)
    G, face_g = grid(parts, imgs)
    ca = (face_a[0] + face_a[2] / 2, face_a[1] + face_a[3] / 2)
    cg = (face_g[0] + face_g[2] / 2, face_g[1] + face_g[3] / 2)
    dist = ((ca[0] - cg[0]) ** 2 + (ca[1] - cg[1]) ** 2) ** 0.5
    print(f"face centre: assembled ({ca[0]:.0f},{ca[1]:.0f}) size {face_a[2]:.0f}x{face_a[3]:.0f}; "
          f"grid ({cg[0]:.0f},{cg[1]:.0f}) size {face_g[2]:.0f}x{face_g[3]:.0f}; offset {dist:.1f} px")

    a_np, g_np = np.asarray(A, np.float32), np.asarray(G, np.float32)
    frames = [a_np] * HOLD_A
    frames += [a_np + (g_np - a_np) * ease((i + 1) / (FADE + 1)) for i in range(FADE)]
    frames += [g_np] * HOLD_G
    frames += [g_np + (a_np - g_np) * ease((i + 1) / (FADE + 1)) for i in range(FADE)]
    frames += [a_np] * HOLD_END
    print(f"frames {len(frames)} at {FPS} fps = {len(frames) / FPS:.2f} s")

    os.makedirs(a.out, exist_ok=True)
    mp4 = os.path.join(a.out, "parts-explode.mp4")
    cmd = [a.ffmpeg, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryslow", "-tune", "animation",
           "-crf", "20", "-pix_fmt", "yuv420p", "-g", "60", "-keyint_min", "60", "-sc_threshold", "0",
           "-flags", "+cgop", "-movflags", "+faststart", "-an", mp4]
    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in frames:
        enc.stdin.write(np.clip(np.rint(f), 0, 255).astype(np.uint8).tobytes())
    enc.stdin.close()
    if enc.wait() != 0:
        sys.exit("ffmpeg failed")
    A.save(os.path.join(a.out, "parts-explode-poster.jpg"), quality=88, optimize=True)
    print(f"wrote {os.path.relpath(mp4)} ({os.path.getsize(mp4)} bytes) and parts-explode-poster.jpg")


if __name__ == "__main__":
    main()
