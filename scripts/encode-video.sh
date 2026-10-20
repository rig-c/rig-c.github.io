#!/usr/bin/env bash
# Rebuild the site's MP4s (and their posters) from pinned sources.
#
#   PARTS_EXAMPLES=/path/to/parts-examples scripts/encode-video.sh [clip ...]
#
# With no clip names it rebuilds every clip whose status is "build".
# Each source is read with `git show <sha>:<path>` from a local clone, so the
# clone's working tree does not matter, only that it has the pinned commit.
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
#   clip | output | source repo | sha | source path | fps | frames | duration s | background | status
# fps is what ffmpeg reads the frames at (a rational is fine): frames / fps
# must equal the source's own duration. background is the colour transparent
# sources are composited over ("-" = source is opaque). status "build" means
# this script rebuilds it; "hold" rows are recorded but not rebuilt here.
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
  # Parts page hero. Source and script unknown; being re-cut separately.
  "parts-explode|assets/docs/parts-explode.mp4|unknown|unknown|unknown|30|198|6.600|-|hold"
  # Pose page hero. A rigc render beside a drawn source skeleton; the
  # compositing script is unknown. Waits for its source.
  "pose-swing|assets/docs/pose-swing.mp4|unknown|unknown|unknown|24|73|3.042|-|hold"
)

# Local clone of each source repo, set by the caller.
clone_for() {
  case "$1" in
    rig-c/parts-examples) echo "${PARTS_EXAMPLES:-}" ;;
    rig-c/trailer) echo "${TRAILER:-}" ;;
    rig-c/core) echo "${CORE:-}" ;;
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

loop_zones() { # frames -> x264 zones string
  echo "zones=0,0,q=12/$(($1 - 3)),$(($1 - 1)),q=12"
}

# Decode an animated image to numbered RGB PNGs, compositing alpha over $bg.
# Pillow (libwebp) is used rather than ffmpeg's WebP decoder: libwebp is the
# decoder browsers use, and ffmpeg's chroma upsampling differs by up to ~50
# levels on edges.
dump_frames() {
  local src="$1" dir="$2" bg="$3"
  python3 -I - "$src" "$dir" "$bg" <<'PY'
import sys
import numpy as np
from PIL import Image, ImageSequence
src, out, bg = sys.argv[1:4]
colour = None if bg == "-" else np.array([int(bg.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)], float)
with Image.open(src) as im:
    for n, frame in enumerate(ImageSequence.Iterator(im)):
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
  local clip out repo sha path fps frames duration bg status
  IFS='|' read -r clip out repo sha path fps frames duration bg status <<<"$1"
  if [[ "$status" != build ]]; then
    echo "skip $clip: status $status (source $repo@$sha $path)" >&2
    return 0
  fi
  local clone
  clone="$(clone_for "$repo")"
  if [[ -z "$clone" ]]; then
    echo "$clip: set the local clone of $repo (e.g. PARTS_EXAMPLES=...)" >&2
    return 1
  fi

  local tmp
  tmp="$(mktemp -d)"
  TMPDIRS+=("$tmp")
  mkdir "$tmp/frames"
  git -C "$clone" show "$sha:$path" >"$tmp/source"
  dump_frames "$tmp/source" "$tmp/frames" "$bg"

  local got
  got="$(find "$tmp/frames" -name '*.png' | wc -l | tr -d ' ')"
  if [[ "$got" != "$frames" ]]; then
    echo "$clip: source has $got frames, expected $frames" >&2
    return 1
  fi

  echo "== $clip <- $repo@${sha:0:7} $path ($frames frames at $fps fps)"
  mkdir -p "$ROOT/$(dirname "$out")"
  "$FFMPEG" -v error -y -framerate "$fps" -i "$tmp/frames/%04d.png" \
    -vf "crop=trunc(iw/2)*2:trunc(ih/2)*2,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
    "${X264[@]}" -x264-params "$(loop_zones "$frames")" "$ROOT/$out"
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
