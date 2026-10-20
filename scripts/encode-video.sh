#!/usr/bin/env bash
# Rebuild the site's MP4s (and their posters) from pinned sources.
#
#   PARTS_EXAMPLES=/path/to/parts-examples scripts/encode-video.sh [clip ...]
#   WALKTHROUGH=/path/to/rig-c-start/my-rig scripts/encode-video.sh getting-started-idle
#
# With no clip names it rebuilds every clip whose status is "build".
# Each source is read with `git show <sha>:<path>` from a local clone, so the
# clone's working tree does not matter, only that it has the pinned commit.
# Rows whose source repo is "walkthrough" have no commit: their source is a
# file or a frame directory a run of the Getting Started walkthrough wrote,
# read from the folder WALKTHROUGH names (the walkthrough's my-rig). The row's
# comment records the commands and package versions that wrote it; with
# WALKTHROUGH unset those rows are skipped, not failed.
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
# source path is an animated image, or (walkthrough rows only) a directory of
# rendered frames f0000.png, f0001.png, ... as `rigc render` writes them.
# wrap qp (optional, default 12) is the QP frame 0 and the last 3 frames are
# coded at (see loop_zones).
CLIPS=(
  # Examples page. Source metadata family/docs/family-preview.json: 67 frames,
  # duration 3.333 s (49/50 ms each). 67 / 20.1 = 3.333 s. Composited over the
  # page background (--bg in styles.css), as the WebP's alpha is shown there.
  "family-preview|assets/family-preview.mp4|rig-c/parts-examples|c239b09328ca7364361b9761fac817502c09ede0|family/docs/family-preview.webp|201/10|67|3.333|#070b18|build"
  # Parts page. Character 1's lossless idle (APNG, 41 frames at 83.33 ms;
  # the GIF beside it is the same 41 frames at 80/90 ms). Opaque.
  "parts-idle|assets/docs/parts-idle.mp4|rig-c/parts-examples|c239b09328ca7364361b9761fac817502c09ede0|family/roa/docs/idle.png|12|41|3.417|-|build"
  # Landing hero. Built by rig-c/trailer build.sh -> out/scene/trailer.webp
  # (a build output); the commit the site's MP4 came from is not recorded.
  "trailer|assets/trailer.mp4|rig-c/trailer|unknown|out/scene/trailer.webp|20|240|12.000|-|hold"
  # Landing, under the hero. rig-c/core films/one-assembly/run.sh ->
  # assets/rigc-demo.gif (600x405; the MP4 is 600x404). Commit not recorded.
  # Waits for the re-render under the rig-c name.
  "rigc-demo|assets/rigc-demo.mp4|rig-c/core|unknown|assets/rigc-demo.gif|20|134|6.700|-|hold"
  # Parts page hero. Rendered and encoded by scripts/parts-explode.py from
  # rig-c/parts-examples@c239b09 (same encode settings); not rebuilt here.
  "parts-explode|assets/docs/parts-explode.mp4|this repo|-|scripts/parts-explode.py|30|147|4.900|-|hold"
  # Pose page hero. Rendered and encoded by scripts/pose-swing.py from the
  # committed assets/rigs/character-1-swing/ (same encode settings); not
  # rebuilt here.
  "pose-swing|assets/docs/pose-swing.mp4|this repo|-|scripts/pose-swing.py|24|39|1.625|-|hold"
  # Getting Started page, step 8. The walkthrough's own idle: out/idle.png,
  # the lossless APNG `rig-parts build --loop` writes beside out/idle.gif (the
  # same 40 frames; the GIF is its palette copy at 80/90 ms). 40 frames at
  # 83.33 ms = 12 fps, 3.333 s. Opaque. Written by the page's ten steps as
  # given, run 2026-10-20 from an empty folder with Bun 1.4.2, which resolved
  # @rig-c/parts 1.42.0, rig-c 2.64.1, @rig-c/pose 0.36.0, @rig-c/play 1.12.0
  # and rig-c/getting-started 2928714; step 8 is
  #   bunx rig-parts build --config config.json --source inputs/painting.png \
  #     --full inputs/layers/full --head inputs/layers/head --out out --loop
  # That run's out/idle.png: md5 b958dbf8574d7939667d61a47d46b26a.
  # Wrap QP 10: this idle's wrap is itself one of its largest steps (source
  # seam 0.497 vs max step 0.504; 0.512 vs 0.518 after a lossless yuv420p
  # round trip), so at QP 12 the encode's seam was 0.562 vs max 0.552 (FAIL);
  # CRF 16 and 18 failed too. QP 10 gives 0.545 vs 0.551.
  "getting-started-idle|assets/docs/getting-started-idle.mp4|walkthrough|-|out/idle.png|12|40|3.333|-|build|10"
  # Getting Started page, step 10. The `wave` animation of step 9's
  # wave-build/ (same run as above), drawn frame by frame by rig-c's own poser
  # rather than recorded from the browser player:
  #   bunx rigc render --candidate wave-build --animation wave --fps 24 \
  #     --max 640 --poser core --out wave-render
  # 73 frames (0..3 s inclusive at 24 fps; frame 72 is the rest pose again,
  # as frame 0), 388x640, opaque on rigc render's grey. 73 / 24 = 3.042 s.
  # That run's frames, f0000..f0072 concatenated: md5 e1cbb4c0b8d582bfe0855f21e2ea671e.
  "getting-started-wave|assets/docs/getting-started-wave.mp4|walkthrough|-|wave-render/wave@24fps|24|73|3.042|-|build"
)

# Local clone of each source repo, set by the caller.
clone_for() {
  case "$1" in
    rig-c/parts-examples) echo "${PARTS_EXAMPLES:-}" ;;
    rig-c/trailer) echo "${TRAILER:-}" ;;
    rig-c/core) echo "${CORE:-}" ;;
    walkthrough) echo "${WALKTHROUGH:-}" ;;
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
  if [[ -z "$clone" ]]; then
    echo "$clip: set the local clone of $repo (e.g. PARTS_EXAMPLES=...)" >&2
    return 1
  fi

  local tmp
  tmp="$(mktemp -d)"
  TMPDIRS+=("$tmp")
  mkdir "$tmp/frames"
  if [[ "$repo" == walkthrough ]]; then
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

  if [[ "$repo" == walkthrough ]]; then
    echo "== $clip <- walkthrough $path ($frames frames at $fps fps)"
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
