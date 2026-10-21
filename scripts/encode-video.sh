#!/usr/bin/env bash
# Rebuild the site's MP4s (and their posters) from pinned sources.
#
#   PARTS_EXAMPLES=/path/to/parts-examples scripts/encode-video.sh [clip ...]
#   ADAPTERS_CAPTURE=/path/to/capture scripts/encode-video.sh adapters-three-engines
#
# With no clip names it rebuilds every clip whose status is "build".
# Each source is read with `git show <sha>:<path>` from a local clone, so the
# clone's working tree does not matter, only that it has the pinned commit.
# Rows whose source repo is "walkthrough" (none at present: the Getting
# Started clips are WebPs now) have no commit: their source is a
# file or a frame directory a run of the Getting Started walkthrough wrote,
# read from the folder WALKTHROUGH names (the walkthrough's my-rig). The row's
# comment records the commands and package versions that wrote it; with
# WALKTHROUGH unset those rows are skipped, not failed.
# Rows whose source repo is "capture" are the same, for frames this repo's own
# capture scripts wrote from a browser run (the row's comment gives the
# commands and versions), read from the folder ADAPTERS_CAPTURE names.
# Needs: git, ffmpeg + ffprobe with libx264, python3 with Pillow and numpy.
# After each encode it checks frame count, duration (±0.02 s) and the loop
# seam (scripts/loop-seam.py), and fails if any of them is off.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FFMPEG="${FFMPEG:-ffmpeg}"
FFPROBE="${FFPROBE:-ffprobe}"
export FFMPEG FFPROBE

# ---------------------------------------------------------------------------
# The clips. One row each, fields separated by "|":
#   clip | output | source repo | sha | source path | fps | frames | duration s | background | status [| wrap qp]
# fps is what ffmpeg reads the frames at (a rational is fine): frames / fps
# must equal the source's own duration. background is the colour transparent
# sources are composited over ("-" = source is opaque). status "build" means
# this script rebuilds it; "hold" rows are recorded but not rebuilt here.
# source path is an animated image, or (walkthrough and capture rows only) a
# directory of rendered frames f0000.png, f0001.png, ... as `rigc render`
# writes them.
# wrap qp (optional, default 12) is the QP frame 0 and the last 3 frames are
# coded at (see loop_zones).
CLIPS=(
  # Examples page. Source metadata family/docs/family-preview.json: 67 frames,
  # duration 3.333 s (49/50 ms each). 67 / 20.1 = 3.333 s. Composited over the
  # page background (--bg in styles.css), as the WebP's alpha is shown there.
  "family-preview|assets/family-preview.mp4|rig-c/parts-examples|c239b09328ca7364361b9761fac817502c09ede0|family/docs/family-preview.webp|201/10|67|3.333|#070b18|build"
  # Parts page, "A drafted rig that idles": no longer an MP4. Character 1's
  # idle (rig-c/parts-examples@c239b09 family/roa/out/check/build) is an
  # animated WebP with alpha (assets/docs/parts-idle.webp + -poster.png),
  # drawn by @rig-c/play over a transparent page by
  # scripts/play-capture-webp.ts (its header has the command and versions).
  # The old source, family/roa/docs/idle.png, is rigc render's and opaque.
  # Core page. rig-c/core film two (films/two-keypose/run.sh), the GIF as it
  # ships in core's README: 234 frames at 5 cs = 11.700 s, 600x405, opaque.
  # Its last 7 frames dissolve back into frame 0, so it is a loop.
  "core-keypose|assets/docs/core-keypose.mp4|rig-c/core|539572d34bb034b9e905e30dc2d45bcd2650b34f|assets/rigc-keypose.gif|20|234|11.700|-|build"
  # Landing hero. Built by rig-c/trailer build.sh -> out/scene/trailer.webp
  # (a build output); the commit the site's MP4 came from is not recorded.
  "trailer|assets/trailer.mp4|rig-c/trailer|unknown|out/scene/trailer.webp|20|240|12.000|-|hold"
  # Landing, under the hero ("From loose parts to a living rig"). Rendered and
  # encoded by scripts/landing-film.py from rig-c/trailer@2248a13 (its pinned
  # @rig-c/parts 1.12.0 and rig-c 2.47.1; build.sh steps 1-3, then the
  # script's own rigc renders), CRF 23 with the wrap zones; not rebuilt here.
  "landing-parts-to-rig|assets/landing-parts-to-rig.mp4|this repo|-|scripts/landing-film.py|30|417|13.900|-|hold"
  # Parts page hero. Rendered and encoded by scripts/parts-explode.py from
  # rig-c/parts-examples@c239b09 (same encode settings); not rebuilt here.
  "parts-explode|assets/docs/parts-explode.mp4|this repo|-|scripts/parts-explode.py|30|147|4.900|-|hold"
  # Pose page hero. Rendered and encoded by scripts/pose-swing.py from the
  # committed assets/rigs/character-1-swing/ (same encode settings); not
  # rebuilt here.
  "pose-swing|assets/docs/pose-swing.mp4|this repo|-|scripts/pose-swing.py|24|72|3.000|-|hold"
  # Getting Started page, step 8: no longer an MP4. The idle is an animated
  # WebP with alpha (assets/docs/getting-started-idle.webp + -poster.png),
  # drawn by @rig-c/play over a transparent page and encoded by
  # scripts/play-capture-webp.ts (its header has the command; the page's
  # SOURCES the versions). rigc render's out/idle.png, the old source, is opaque by design.

  # Getting Started page, step 10: no longer an MP4 either. The hello is an
  # animated WebP with alpha (assets/docs/getting-started-hello.webp +
  # -poster.png) drawn by @rig-c/play from the walkthrough's out/check/build
  # (steps 9b-9c) in the page's breeze by scripts/play-capture-webp.ts, like
  # step 8's idle (it replaced the wave from wave-build/ on 2026-10-21).
  # Review page. Captured from @rig-c/review 0.7.1 with scripts/review-capture.ts:
  # Character 1 built by @rig-c/parts 1.44.0 (rig-parts build) from its
  # config.json and inputs/ at parts-examples@c239b09 (family/roa), opened
  # with that producer handoff (baseline reproduced), and the tool driven
  # through its own page in headless Chromium, 1600x1000, on a paused fake clock
  # advanced 1/12 s per frame; the cursor is drawn by the script. Frames
  # 85-109 are Edit mesh on the shoulder (the page's hero still). The
  # producer run behind Apply · Rebuild is cut (no frames while it runs); the
  # last 22 frames are the `rig-review feedback --format json` output. One
  # pass, not a loop (no seam zones). Captured and encoded there (same encode
  # settings otherwise); not rebuilt here.
  "review-flow|assets/docs/review-flow.mp4|this repo|-|scripts/review-capture.ts|12|277|23.083|-|hold"
  # Adapters page. rig-c/adapters' own demo pages (5423bf4: index.html, which
  # runs PixiRig or, with ?host=phaser, PhaserRig; and three-demo.html), served
  # with vite 6.4.4 against the npm releases @rig-c/pixi, @rig-c/phaser and
  # @rig-c/three 0.1.1, @rig-c/play 1.10.0, pixi.js 8.22.0, phaser 4.2.1 and
  # three 0.186.1, each showing the `walk` gallery rig (rig-c 2.52.0 build)
  # playing `walk` (0.9 s). Captured and laid out by
  #   bun scripts/adapters-capture.ts --base http://localhost:4391 --out capture
  #   python3 scripts/adapters-composite.py capture capture/frames
  # with ADAPTERS_CAPTURE=capture (run 2026-10-20, Playwright 1.62.1
  # Chromium; the scripts' headers give the setup). One cycle is 27 frames
  # at 30 fps; the composite repeats it 4 times: 108 frames / 30 = 3.600 s,
  # 1424x638, opaque. The 27 frames per engine,
  # concatenated: pixi md5 1396c54b71494016803c549e11c3401e, phaser
  # 498095a24e00822aad0d808499d987c4, three edf77b197b5252203860daf0807c59fc.
  "adapters-three-engines|assets/docs/adapters-three-engines.mp4|capture|-|frames|30|108|3.600|-|build"
)

# Local clone of each source repo, set by the caller.
clone_for() {
  case "$1" in
    rig-c/parts-examples) echo "${PARTS_EXAMPLES:-}" ;;
    rig-c/trailer) echo "${TRAILER:-}" ;;
    rig-c/core) echo "${CORE:-}" ;;
    walkthrough) echo "${WALKTHROUGH:-}" ;;
    capture) echo "${ADAPTERS_CAPTURE:-}" ;;
    *) echo "" ;;
  esac
}

# H.264 High, yuv420p, BT.709, no audio, fast start, -tune animation, CRF 20,
# closed GOP of at most 60 frames.
#
# The loop seam: the wrap shows the last frame next to frame 0, and the two are
# coded independently (frame 0 is a keyframe, the last frame the end of a
# predicted chain), so their coding errors add instead of cancelling. CRF
# alone does not close it (CRF 18: Family seam 1.26 vs max step 1.25, idle
# 1.07 vs 0.97). So x264 zones code frame 0 and the last 3 frames at QP 12,
# making both ends of the wrap as sharp as each other (see loop_zones).
X264=(-c:v libx264 -profile:v high -preset veryslow -tune animation -crf 20
      -g 60 -keyint_min 60 -sc_threshold 0 -flags +cgop
      -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv
      -an -movflags +faststart)

loop_zones() { # frames [qp] -> x264 zones string
  local qp="${2:-12}"
  echo "zones=0,0,q=$qp/$(($1 - 3)),$(($1 - 1)),q=$qp"
}

# Decode an animated image to numbered RGB PNGs, compositing alpha over $bg.
# Pillow (libwebp) is used rather than ffmpeg's WebP decoder: libwebp is the
# decoder browsers use, and ffmpeg's chroma upsampling differs by up to ~50
# levels on edges.
dump_frames() {
  local src="$1" dir="$2" bg="$3"
  python3 -I - "$src" "$dir" "$bg" <<'PY'
import glob
import os
import sys
import numpy as np
from PIL import Image, ImageSequence
src, out, bg = sys.argv[1:4]
colour = None if bg == "-" else np.array([int(bg.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)], float)


def frames():
    if os.path.isdir(src):  # a rendered frame series: f0000.png, f0001.png, ...
        for name in sorted(glob.glob(os.path.join(src, "f[0-9][0-9][0-9][0-9].png"))):
            with Image.open(name) as im:
                yield im
    else:
        with Image.open(src) as im:
            yield from ImageSequence.Iterator(im)


for n, frame in enumerate(frames()):
    rgba = np.asarray(frame.convert("RGBA"), dtype=np.float64)
    alpha = rgba[..., 3:] / 255.0
    if colour is None:
        if alpha.min() < 1.0:
            sys.exit(f"{src}: frame {n} has transparency; give the clip a background")
        rgb = rgba[..., :3]
    else:
        rgb = rgba[..., :3] * alpha + colour * (1.0 - alpha)
    Image.fromarray(np.rint(rgb).astype(np.uint8), "RGB").save(f"{out}/{n:04d}.png")
PY
}

encode_clip() {
  local clip out repo sha path fps frames duration bg status wrapqp
  IFS='|' read -r clip out repo sha path fps frames duration bg status wrapqp <<<"$1"
  if [[ "$status" != build ]]; then
    echo "skip $clip: status $status (source $repo@$sha $path)" >&2
    return 0
  fi
  local clone
  clone="$(clone_for "$repo")"
  if [[ -z "$clone" && "$repo" == walkthrough ]]; then
    echo "skip $clip: set WALKTHROUGH to a walkthrough run's my-rig folder (source $path)" >&2
    return 0
  fi
  if [[ -z "$clone" && "$repo" == capture ]]; then
    echo "skip $clip: set ADAPTERS_CAPTURE to the capture folder (source $path)" >&2
    return 0
  fi
  if [[ -z "$clone" ]]; then
    echo "$clip: set the local clone of $repo (e.g. PARTS_EXAMPLES=...)" >&2
    return 1
  fi

  local tmp
  tmp="$(mktemp -d)"
  TMPDIRS+=("$tmp")
  mkdir "$tmp/frames"
  if [[ "$repo" == walkthrough || "$repo" == capture ]]; then
    dump_frames "$clone/$path" "$tmp/frames" "$bg"
  else
    git -C "$clone" show "$sha:$path" >"$tmp/source"
    dump_frames "$tmp/source" "$tmp/frames" "$bg"
  fi

  local got
  got="$(find "$tmp/frames" -name '*.png' | wc -l | tr -d ' ')"
  if [[ "$got" != "$frames" ]]; then
    echo "$clip: source has $got frames, expected $frames" >&2
    return 1
  fi

  if [[ "$repo" == walkthrough || "$repo" == capture ]]; then
    echo "== $clip <- $repo $path ($frames frames at $fps fps)"
  else
    echo "== $clip <- $repo@${sha:0:7} $path ($frames frames at $fps fps)"
  fi
  mkdir -p "$ROOT/$(dirname "$out")"
  "$FFMPEG" -v error -y -framerate "$fps" -i "$tmp/frames/%04d.png" \
    -vf "crop=trunc(iw/2)*2:trunc(ih/2)*2,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
    "${X264[@]}" -x264-params "$(loop_zones "$frames" "$wrapqp")" "$ROOT/$out"
  # Poster = the encoded clip's frame 0, so nothing shifts when it starts.
  "$FFMPEG" -v error -y -i "$ROOT/$out" -frames:v 1 -q:v 3 "$ROOT/${out%.mp4}-poster.jpg"

  local nb dur
  nb="$("$FFPROBE" -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of default=nw=1:nk=1 "$ROOT/$out")"
  dur="$("$FFPROBE" -v error -show_entries format=duration -of default=nw=1:nk=1 "$ROOT/$out")"
  echo "   frames $nb, duration $dur s (expected $frames, $duration s), $(wc -c <"$ROOT/$out" | tr -d ' ') bytes"
  if [[ "$nb" != "$frames" ]] || ! awk -v a="$dur" -v b="$duration" 'BEGIN { d = a - b; exit !(d <= 0.02 && d >= -0.02) }'; then
    echo "$clip: frame count or duration is off" >&2
    return 1
  fi
  python3 -I "$ROOT/scripts/loop-seam.py" "$ROOT/$out"
}

TMPDIRS=()
cleanup() { ((${#TMPDIRS[@]})) && rm -rf "${TMPDIRS[@]}"; return 0; }
trap cleanup EXIT

main() {
  local want=("$@") row name status=0
  for row in "${CLIPS[@]}"; do
    name="${row%%|*}"
    if ((${#want[@]})); then
      [[ " ${want[*]} " == *" $name "* ]] || continue
    fi
    encode_clip "$row" || status=1
  done
  return "$status"
}

main "$@"
