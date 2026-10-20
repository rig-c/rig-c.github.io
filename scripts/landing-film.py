#!/usr/bin/env python3
"""Render the landing clip "From loose parts to a living rig": rig-c's mascot, the trailer character.

Source:  a rig-c/trailer clone (see TRAILER_SHA) after its build.sh steps 1-3 (parts, film rig,
         compile; step 4's renders and step 5's compose are not read), with @rig-c/parts and
         rig-c installed in its node_modules. This script then runs, with that rig-c:
           rigc build  out/parts/rig (rig.json + motion.json) and its black-tinted twin  -> idle build
           rigc render --animation idle --fps 30 --max 599   (the parts rig's drafted idle)
           rigc render --animation show --fps 30 --max 840   (the film rig's performance, out/build)
         each twice, the second on the black-tinted twin, so the alpha channel can be recovered
         (rigc render's frames are opaque by design; the trailer's compose.py does the same).
Command: python3 scripts/landing-film.py --trailer <path to the trailer clone>
Output:  assets/landing-parts-to-rig.mp4, assets/landing-parts-to-rig-poster.jpg
Needs:   Python 3, Pillow, NumPy, ffmpeg with libx264 (`--ffmpeg` or $FFMPEG to override).

What is data and what is this film's:
  * the rig's: every part image and its placement (out/parts/parts.json x/y, list order = draw
    order, one uniform scale); every frame of the idle and of the show, posed by `rigc render`,
    placed by the renders' own viewports so the figure stays where parts.json put it.
  * the film's: the loose layout, the filename labels, the glide (straight lines, smoothstep, in
    draw order, scheduled so that no two parts that are both off their final place ever overlap:
    checked on every frame from the parts' drawn rectangles, the run fails otherwise), the
    dissolves, the choice of the show's stretch, and the caption band.
The camera is fixed: one world-to-canvas scale for every shot, no zoom, no pan.
"""
import argparse, glob, json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

TRAILER_SHA = "2248a13"                  # rig-c/trailer commit the film was rendered from
W, H, FPS = 1280, 720, 30
BG = (7, 11, 24)                         # page background, --bg in styles.css
LABEL = (150, 158, 178)
BAND_TOP = 644                           # caption band: y 644..720
FIG_TOP = 40                             # canvas y of the figure's top drawn pixel (parts.json)
IDLE_MAX, SHOW_MAX = 599, 840            # rigc render --max: both put the figure at ~0.4936 px/unit
# timeline, frames at 30 fps
HOLD_LOOSE, LABEL_FADE = 48, 18          # loose parts with labels, labels fade out
FLIGHT, HOLD_ASSEMBLED = 18, 6           # one part's glide; hold once all have landed
FADE_IDLE, IDLE_LEN = 10, 90             # assembled -> idle dissolve (inside the idle's 90 frames)
FADE_SHOW, SHOW_FROM, SHOW_LEN = 12, 282, 180   # idle -> show dissolve; show frames 282.. (9.4 s
                                                # of `show` = 5.4 s into its loop: kick, hop, wave)
FADE_BACK = 15                           # show -> frame 0 dissolve, so the clip loops
# loose layout: columns of rows, top to bottom; a row is one part or several side by side.
# Inner columns hold the parts that fly first (back of the draw order), outer columns the later
# ones, so no glide crosses a part that is still waiting.
COLUMNS = [
    (115, [["hairpin"], ["face"], ["brow_r"], ["lash_r", "iris_r"], ["eyewhite_r", "ear_r"], ["handwear_r"]]),
    (345, [["hair_back"], ["bottomwear"], ["legwear"]]),
    (935, [["neck"], ["topwear"], ["handwear_l"], ["shoes"]]),
    (1165, [["hair_front"], ["brow_l"], ["lash_l", "iris_l"], ["eyewhite_l", "ear_l"], ["mouth"]]),
]
CENTRE = ["hair_long"]                   # waits at its own place: it is the backmost layer
LABEL_SIZE, LABEL_GAP, ROW_GAP_MIN = 15, 5, 6


def font(size, bold=False):
    for name in ("Menlo.ttc", "DejaVuSansMono-Bold.ttf" if bold else "DejaVuSansMono.ttf", "Consolas.ttf"):
        try:
            return ImageFont.truetype(name, size, index=1 if bold and name.endswith(".ttc") else 0)
        except OSError:
            pass
    return ImageFont.load_default()


def run(cmd, cwd):
    print("$", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True, stdout=subprocess.DEVNULL)


def prepare(trailer, rerender):
    """The idle build and the four renders, written under <trailer>/out/landing/."""
    rigc = os.path.join(trailer, "node_modules", ".bin", "rigc")
    out = os.path.join(trailer, "out", "landing")
    os.makedirs(out, exist_ok=True)
    rig = json.load(open(os.path.join(trailer, "out/parts/rig/rig.json")))
    black = dict(rig, slots=[{**s, "color": "000000ff"} for s in rig["slots"]])
    json.dump(black, open(os.path.join(trailer, "out/parts/rig/rig_black.json"), "w"))
    jobs = [
        ("idle_build", ["build", "--rig", "out/parts/rig/rig.json", "--motion", "out/parts/rig/motion.json",
                        "--out", "out/landing/idle_build", "--profile", "spine"]),
        ("idle_build_black", ["build", "--rig", "out/parts/rig/rig_black.json", "--motion", "out/parts/rig/motion.json",
                              "--out", "out/landing/idle_build_black", "--profile", "spine"]),
        ("idle", ["render", "--candidate", "out/landing/idle_build", "--animation", "idle", "--fps", str(FPS),
                  "--max", str(IDLE_MAX), "--out", "out/landing/idle"]),
        ("idle_black", ["render", "--candidate", "out/landing/idle_build_black", "--animation", "idle", "--fps", str(FPS),
                        "--max", str(IDLE_MAX), "--out", "out/landing/idle_black"]),
        ("show", ["render", "--candidate", "out/build", "--animation", "show", "--fps", str(FPS),
                  "--max", str(SHOW_MAX), "--out", "out/landing/show"]),
        ("show_black", ["render", "--candidate", "out/build_black", "--animation", "show", "--fps", str(FPS),
                        "--max", str(SHOW_MAX), "--out", "out/landing/show_black"]),
    ]
    for name, args in jobs:
        if rerender or not os.path.isdir(os.path.join(out, name)):
            run([rigc] + args, trailer)
    return out


class RgbaFrames:
    """A render and its black-tinted twin, read frame by frame. On a ground g a pixel is
    c*a + g*(1-a); the twin gives g*(1-a), so a = 1 - black/g and c = (open - g*(1-a)) / a."""

    def __init__(self, open_dir, black_dir, anim):
        meta = json.load(open(os.path.join(open_dir, "frames.json")))
        self.ground = np.array(meta["background"][:3], np.float32)
        self.viewport = meta["viewport"]
        self.opens = sorted(glob.glob(os.path.join(open_dir, f"{anim}@{FPS}fps", "f[0-9]*.png")))
        self.blacks = sorted(glob.glob(os.path.join(black_dir, f"{anim}@{FPS}fps", "f[0-9]*.png")))
        assert self.opens and len(self.opens) == len(self.blacks), (len(self.opens), len(self.blacks))

    def __len__(self):
        return len(self.opens)

    def __getitem__(self, i):
        o = np.asarray(Image.open(self.opens[i]).convert("RGB"), np.float32)
        k = np.asarray(Image.open(self.blacks[i]).convert("RGB"), np.float32)
        a = np.clip(1 - (k / self.ground).mean(axis=2), 0, 1)[..., None]
        c = np.where(a > 1e-3, (o - self.ground * (1 - a)) / np.maximum(a, 1e-3), 0)
        return np.dstack([np.clip(c, 0, 255), a * 255]).astype(np.float32)


def ease(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def over(dst, src, x, y):
    """Alpha-composite float RGBA `src` onto float RGB `dst` at integer x, y (clipped)."""
    h, w = src.shape[:2]
    x0, y0, x1, y1 = max(x, 0), max(y, 0), min(x + w, dst.shape[1]), min(y + h, dst.shape[0])
    if x1 <= x0 or y1 <= y0:
        return
    s = src[y0 - y:y1 - y, x0 - x:x1 - x]
    a = s[..., 3:] / 255.0
    dst[y0:y1, x0:x1] = s[..., :3] * a + dst[y0:y1, x0:x1] * (1 - a)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--trailer", required=True, help="rig-c/trailer clone after build.sh steps 1-3")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets"))
    ap.add_argument("--ffmpeg", default=os.environ.get("FFMPEG", "ffmpeg"))
    ap.add_argument("--crf", default="23")   # 20 is the site recipe; 23 keeps this 14 s clip near 1.5 MB
    ap.add_argument("--rerender", action="store_true", help="rerun the rigc builds and renders")
    ap.add_argument("--frames", help="also write these frame numbers as PNGs to --frames-dir, e.g. 0,60,120")
    ap.add_argument("--frames-dir", default=".")
    a = ap.parse_args()
    T = a.trailer

    def pkg(name):
        return json.load(open(os.path.join(T, "node_modules", name, "package.json")))["version"]
    v_parts, v_rigc = pkg("@rig-c/parts"), pkg("rig-c")
    head = subprocess.run(["git", "-C", T, "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip()
    print(f"trailer {head} (film pinned to {TRAILER_SHA}); @rig-c/parts {v_parts}; rig-c {v_rigc}")
    if head != TRAILER_SHA:
        sys.exit(f"trailer clone is at {head}, not {TRAILER_SHA}")
    work = prepare(T, a.rerender)

    # ---- the rig's data: parts and placement
    meta = json.load(open(os.path.join(T, "out/parts/parts.json")))
    parts = meta["parts"]
    rig_w, rig_h = meta["rig_size"]
    show = RgbaFrames(os.path.join(work, "show"), os.path.join(work, "show_black"), "show")
    idle = RgbaFrames(os.path.join(work, "idle"), os.path.join(work, "idle_black"), "idle")
    vp_s, vp_i = show.viewport, idle.viewport
    s = vp_s["scale"]                                    # the one world-to-canvas scale
    print(f"scale {s:.6f} px/unit (show render); idle render {vp_i['scale']:.6f} "
          f"({(vp_i['scale'] / s - 1) * 100:+.3f} %, not resampled)")
    # parts.json pixels are rig units with y down from the skeleton box's top-left (box x -rig_w/2,
    # y 0, rig_w x rig_h, y up); canvas = (640 + wx*s, CY - wy*s).
    top_px = min(p["y"] for p in parts)
    CY = FIG_TOP + (rig_h - top_px) * s
    def canvas_of_world(wx, wy):
        return 640 + wx * s, CY - wy * s
    def canvas_of_rigpx(x, y):
        return canvas_of_world(x - rig_w / 2, rig_h - y)

    imgs, rects_final = {}, {}
    for p in parts:
        im = Image.open(os.path.join(T, "out/parts/parts", p["name"] + ".png")).convert("RGBA")
        assert im.size == (p["w"], p["h"]), (p["name"], im.size)
        X, Y = canvas_of_rigpx(p["x"], p["y"])
        # resample on the canvas grid: the part's fractional origin is folded into the resize box
        ox, oy = int(np.floor(X)), int(np.floor(Y))
        fx, fy = X - ox, Y - oy
        wpx, hpx = int(np.ceil(fx + p["w"] * s)) + 1, int(np.ceil(fy + p["h"] * s)) + 1
        t = im.transform((wpx, hpx), Image.AFFINE, (1 / s, 0, -fx / s, 0, 1 / s, -fy / s), Image.BICUBIC)
        arr = np.asarray(t, np.float32)
        imgs[p["name"]] = arr
        al = arr[..., 3] > 8
        ys, xs = np.nonzero(al)
        bb = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)          # drawn rectangle, local
        rects_final[p["name"]] = (ox, oy, bb)
    order = [p["name"] for p in parts]

    # ---- the film's: the loose layout
    lab = font(LABEL_SIZE)
    meas = ImageDraw.Draw(Image.new("RGB", (8, 8)))
    def size(n):
        bb = rects_final[n][2]
        return bb[2] - bb[0], bb[3] - bb[1]
    park = {}                                           # name -> canvas x, y of the drawn rect
    labels = []                                         # (text, x, y)
    stage_top, stage_bot = 14, BAND_TOP - 14
    for cx, rows in COLUMNS:
        hs = [max(size(n)[1] for n in row) + LABEL_GAP + LABEL_SIZE + 2 for row in rows]
        gap = (stage_bot - stage_top - sum(hs)) / max(1, len(rows) - 1)
        assert gap >= ROW_GAP_MIN, f"column at {cx}: rows do not fit ({gap:.1f} px gap)"
        y = stage_top
        for row, rh in zip(rows, hs):
            widths = [max(size(n)[0], meas.textlength(n, font=lab)) for n in row]
            spread = sum(widths) + 14 * (len(row) - 1)
            x = cx - spread / 2
            content_h = rh - LABEL_GAP - LABEL_SIZE - 2
            for n, wcell in zip(row, widths):
                w, h = size(n)
                px, py = round(x + (wcell - w) / 2), round(y + (content_h - h) / 2)
                park[n] = (px, py)
                tw = meas.textlength(n, font=lab)
                labels.append((n, x + (wcell - tw) / 2, y + content_h + LABEL_GAP))
                x += wcell + 14
            y += rh + gap
    for n in CENTRE:
        ox, oy, bb = rects_final[n]
        park[n] = (ox + bb[0], oy + bb[1])
        tw = meas.textlength(n, font=lab)
        labels.append((n, ox + (bb[0] + bb[2]) / 2 - tw / 2, oy + bb[3] + LABEL_GAP))
    assert sorted(park) == sorted(order), f"layout {sorted(park)} != parts.json {sorted(order)}"

    def final_xy(n):
        ox, oy, bb = rects_final[n]
        return ox + bb[0], oy + bb[1]
    def rect_at(n, u):
        """drawn rectangle of part n at glide progress u (0 = parked, 1 = placed)"""
        (x0, y0), (x1, y1) = park[n], final_xy(n)
        e = ease(u)
        x, y = x0 + (x1 - x0) * e, y0 + (y1 - y0) * e
        w, h = size(n)
        return x, y, x + w, y + h
    def hit(r, q):
        return r[0] < q[2] and q[0] < r[2] and r[1] < q[3] and q[1] < r[3]
    def u_of(n, f, start):
        if park[n] == final_xy(n):
            return 1.0
        return (f - start[n]) / FLIGHT

    # ---- schedule: starts non-decreasing in draw order, each the earliest frame at which its whole
    # glide overlaps no other part that is also off its place (in flight, or still parked)
    start = {}
    def conflicts(n, s0, partial):
        for f in range(s0, s0 + FLIGHT + 1):
            r = rect_at(n, (f - s0) / FLIGHT)
            for m in order:
                if m == n:
                    continue
                if m in partial:
                    um = u_of(m, f, partial)
                    if um >= 1.0:
                        continue                       # m has landed: n lands over it in draw order
                    q = rect_at(m, max(um, 0.0))
                else:
                    q = rect_at(m, 0.0)                # not scheduled yet: parked
                if (f - s0) / FLIGHT < 1.0 and hit(r, q):
                    return True
        return False
    t = 0
    for n in order:
        if park[n] == final_xy(n):
            start[n] = 0
            continue
        while conflicts(n, t, start):
            t += 1
            if t > 600:
                sys.exit(f"no clean glide for {n}")
        start[n] = t
    conv_len = max(start[n] + FLIGHT for n in order)

    # independent check over every frame and every pair
    checked = clash = 0
    clearance = 1e9
    for f in range(0, conv_len + 1):
        state = {n: u_of(n, f, start) for n in order}
        live = [n for n in order if state[n] < 1.0]
        moving = {n for n in live if state[n] > 0.0}
        for i, n in enumerate(live):
            r = rect_at(n, max(state[n], 0.0))
            for m in live[i + 1:]:
                if n not in moving and m not in moving:
                    continue
                q = rect_at(m, max(state[m], 0.0))
                checked += 1
                if hit(r, q):
                    clash += 1
                    print(f"  clash frame {f}: {n} x {m}")
                dx = max(q[0] - r[2], r[0] - q[2], 0)
                dy = max(q[1] - r[3], r[1] - q[3], 0)
                clearance = min(clearance, max(dx, dy))
    print(f"converge: {conv_len} frames ({conv_len / FPS:.2f} s), {FLIGHT}-frame glides, starts "
          + ", ".join(f"{n}@{start[n]}" for n in order))
    print(f"converge check: {checked} pair-frames with a part in flight and neither placed, "
          f"{clash} overlapping, smallest gap {clearance:.1f} px")
    if clash:
        sys.exit("a part passes through another")

    # ---- the band
    def band(cmd, note):
        im = Image.new("RGBA", (W, H - BAND_TOP), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.line([(40, 0), (W - 40, 0)], fill=(255, 255, 255, 34), width=1)
        b, m, sm = font(24, bold=True), font(22), font(16)
        d.text((40, 14), "rig-c", font=b, fill=(243, 246, 252, 255))
        x = 40 + d.textlength("rig-c", font=b) + 22
        d.text((x, 16), cmd, font=m, fill=(140, 200, 255, 255))
        ver = f"@rig-c/parts {v_parts} · rig-c {v_rigc}"
        d.text((W - 40 - d.textlength(ver, font=sm), 20), ver, font=sm, fill=LABEL + (255,))
        d.text((40, 48), note, font=sm, fill=LABEL + (255,))
        return np.asarray(im, np.float32)
    note_parts = "parts and placement: the rig's (parts.json) · labels and glide: this film's"
    bands = {
        "parts": band("rig-parts build  →  23 parts", note_parts),
        "idle": band("rigc render --animation idle", "the drafted idle: the rig's · the cut: this film's"),
        "show": band("rigc render --animation show", "the film rig's performance: the rig's · the stretch and the dissolves: this film's"),
    }
    n_parts = len(order)
    assert n_parts == 23, n_parts

    # ---- frames
    base = np.empty((H, W, 3), np.float32)
    base[:] = BG
    def with_band(stage, key):
        out = stage.copy()
        over(out, bands[key], 0, BAND_TOP)
        return out
    label_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(label_layer)
    for text, x, y in labels:
        ld.text((x, y), text, font=lab, fill=LABEL + (255,))
    label_np = np.asarray(label_layer, np.float32)

    def parts_frame(f, label_alpha):                    # f = frame inside the converge (0 = parked)
        st = base.copy()
        for n in order:
            u = u_of(n, f, start)
            r = rect_at(n, max(u, 0.0))
            ox, oy, bb = rects_final[n]
            over(st, imgs[n], round(r[0]) - bb[0], round(r[1]) - bb[1])
        if label_alpha > 0:
            la = label_np.copy()
            la[..., 3] *= label_alpha
            over(st, la, 0, 0)
        return with_band(st, "parts")

    def render_frame(frames, vp, i, key):
        st = base.copy()
        x = round(640 + vp["x"] * s)
        y = round(CY - (vp["y"] + vp["height"]) * s)
        over(st, frames[i], x, y)
        return with_band(st, key)

    def u8(fr):
        return np.clip(np.rint(fr), 0, 255).astype(np.uint8)
    seq = []
    f0 = parts_frame(0, 1.0)
    seq += [u8(f0)] * HOLD_LOOSE
    seq += [u8(parts_frame(0, 1.0 - ease((i + 1) / (LABEL_FADE + 1)))) for i in range(LABEL_FADE)]
    mark_conv = len(seq)
    seq += [u8(parts_frame(f, 0.0)) for f in range(1, conv_len + 1)]
    assembled = parts_frame(conv_len, 0.0)
    seq += [u8(assembled)] * HOLD_ASSEMBLED
    mark_idle = len(seq)
    for i in range(IDLE_LEN):
        fr = render_frame(idle, vp_i, i, "idle")
        if i < FADE_IDLE:
            fr = assembled + (fr - assembled) * ease((i + 1) / (FADE_IDLE + 1))
        seq.append(u8(fr))
    mark_show = len(seq)
    for i in range(FADE_SHOW):
        a_ = render_frame(idle, vp_i, IDLE_LEN + i, "idle")
        b_ = render_frame(show, vp_s, SHOW_FROM + i, "show")
        seq.append(u8(a_ + (b_ - a_) * ease((i + 1) / (FADE_SHOW + 1))))
    for i in range(FADE_SHOW, SHOW_LEN):
        seq.append(u8(render_frame(show, vp_s, SHOW_FROM + i, "show")))
    mark_back = len(seq)
    for i in range(FADE_BACK):
        fr = render_frame(show, vp_s, SHOW_FROM + SHOW_LEN + i, "show")
        seq.append(u8(fr + (f0 - fr) * ease((i + 1) / (FADE_BACK + 1))))
    last_show = SHOW_FROM + SHOW_LEN + FADE_BACK - 1
    assert last_show < len(show), (last_show, len(show))

    # placement vs the idle's first frame (alpha-weighted, over the page background)
    i0 = render_frame(idle, vp_i, 0, "idle")
    diff = np.abs(i0[:BAND_TOP] - assembled[:BAND_TOP]).mean()
    print(f"assembled (parts.json) vs idle frame 0 (rigc render), stage area: mean abs diff {diff:.3f} (0-255)")
    print(f"timeline: loose 0-{mark_conv - 1}, converge {mark_conv}-{mark_idle - 1}, idle {mark_idle}-{mark_show - 1} "
          f"(idle frames 0-{IDLE_LEN + FADE_SHOW - 1}), show {mark_show}-{mark_back - 1} (show frames "
          f"{SHOW_FROM}-{last_show} = {SHOW_FROM / FPS:.2f}-{last_show / FPS:.2f} s), back to frame 0 "
          f"{mark_back}-{len(seq) - 1}; {len(seq)} frames = {len(seq) / FPS:.3f} s")

    if a.frames:
        os.makedirs(a.frames_dir, exist_ok=True)
        for k in (int(v) for v in a.frames.split(",")):
            Image.fromarray(seq[k]).save(
                os.path.join(a.frames_dir, f"frame{k:04d}.png"))

    os.makedirs(a.out, exist_ok=True)
    mp4 = os.path.join(a.out, "landing-parts-to-rig.mp4")
    n = len(seq)
    zones = f"zones=0,0,q=12/{n - 3},{n - 1},q=12"
    cmd = [a.ffmpeg, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
           "-c:v", "libx264", "-profile:v", "high", "-preset", "veryslow", "-tune", "animation",
           "-crf", a.crf, "-g", "60", "-keyint_min", "60", "-sc_threshold", "0", "-flags", "+cgop",
           "-x264-params", zones, "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
           "-color_range", "tv", "-an", "-movflags", "+faststart", mp4]
    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for fr in seq:
        enc.stdin.write(fr.tobytes())
    enc.stdin.close()
    if enc.wait() != 0:
        sys.exit("ffmpeg failed")
    poster = os.path.join(a.out, "landing-parts-to-rig-poster.jpg")
    subprocess.run([a.ffmpeg, "-v", "error", "-y", "-i", mp4, "-frames:v", "1", "-q:v", "3", poster], check=True)
    print(f"wrote {os.path.relpath(mp4)} ({os.path.getsize(mp4)} bytes, CRF {a.crf}) and {os.path.basename(poster)}")


if __name__ == "__main__":
    main()
