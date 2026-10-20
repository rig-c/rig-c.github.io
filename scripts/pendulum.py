#!/usr/bin/env python3
"""Write the Pose page's swing: Character 1's right arm swinging her cup like a pendulum.

Usage: scripts/pendulum.py <keypoints.json> <out.pose.json> [--fore 5] [--centre 0] [--upper 0]
                           [--lag 0.15] [--period 1.5] [--periods 2] [--fps 24]

The Pose page's swing: --fore 4 --centre 2.5 --upper 0 --lag 0.15, then
  rig-pose clean --pose swing.pose.json --out swing.pose.clean.json --loop --hold off --rest 1
(--rest 1: the input is an exact sine, and the default smoothing window, wrapped over
the repeated last frame, would move it off frame 0).

The input is the hand-placed body-18 keypoints of the painting
(spine-parts-keypoints/1); the output a rig-pose-sequence/1 for `rig-pose clean --loop`.

The motion, with w = 2*pi/period, in picture degrees about the aligned rest:
  upper arm (shoulder -> elbow)   u(t) = upper * sin(w t)
  forearm against the upper arm   f(t) = fore  * sin(w (t - lag)) - centre
so the forearm's own swing is a symmetric sine that trails the upper arm by `lag`
seconds, the cup hanging from the elbow, and the forearm's direction in the picture
is u + f. Every other joint is held. The clip is exactly `periods` periods long and
is written 0..periods*period inclusive (73 frames for 2 x 1.5 s at 24 fps), so its
last frame repeats frame 0 and the animation's last key is its first: a player
looping it at its duration wraps onto the same pose. A rendered loop drops the
last frame.

Rest alignment. The hand-placed joints do not sit exactly on the rig's bones, so
at rest the retarget would turn the upper arm and the chest away from how the
rig was drawn. The rest is turned first, so every track reads 0 at rest: the arm
by -1.19 deg (upper arm) and a further +0.37 deg (forearm), the neck about the
mid-hip by +2.553 deg (the figures the page records; --off-upper, --off-fore,
--off-trunk). Picture angles are y-down: a positive forearm angle turns it away
from the body on this painting, which the rig reads as a negative sleeve_r1 key.

A test motion made from the keypoints, not footage.
"""
import argparse
import json
import math

ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
ap.add_argument("keypoints")
ap.add_argument("out")
ap.add_argument("--fore", type=float, default=5.0, help="forearm amplitude against the upper arm, deg")
ap.add_argument("--upper", type=float, default=0.0, help="upper-arm amplitude, deg")
ap.add_argument("--lag", type=float, default=0.15, help="the forearm's lag behind the upper arm, s")
ap.add_argument("--centre", type=float, default=0.0,
                help="the forearm's swing centred this far toward the body, deg (0: about the rest)")
ap.add_argument("--period", type=float, default=1.5, help="one swing there and back, s")
ap.add_argument("--periods", type=int, default=2, help="whole periods in the clip")
ap.add_argument("--fps", type=int, default=24)
ap.add_argument("--off-upper", type=float, default=-1.19, help="rest alignment of the upper arm, deg")
ap.add_argument("--off-fore", type=float, default=0.37, help="further rest alignment of the forearm, deg")
ap.add_argument("--off-trunk", type=float, default=2.553, help="rest alignment of the neck about mid-hip, deg")
a = ap.parse_args()

kp = json.load(open(a.keypoints))
J = kp["people"][0]["joints"]
sh, el, wr = J["r_shoulder"]["at"], J["r_elbow"]["at"], J["r_wrist"]["at"]
L1, L2 = math.dist(sh, el), math.dist(el, wr)
a1 = math.atan2(el[1] - sh[1], el[0] - sh[0]) + math.radians(a.off_upper)
a2 = math.atan2(wr[1] - el[1], wr[0] - el[0]) + math.radians(a.off_upper + a.off_fore)

# the neck, turned about the mid-hip once (the trunk is held)
hips = [J[k]["at"] for k in ("r_hip", "l_hip")]
mh = [(hips[0][0] + hips[1][0]) / 2, (hips[0][1] + hips[1][1]) / 2]
nk = J["neck"]["at"]
c, s = math.cos(math.radians(a.off_trunk)), math.sin(math.radians(a.off_trunk))
neck = [round(mh[0] + c * (nk[0] - mh[0]) - s * (nk[1] - mh[1]), 2),
        round(mh[1] + s * (nk[0] - mh[0]) + c * (nk[1] - mh[1]), 2)]

n = round(a.periods * a.period * a.fps)
if abs(n - a.periods * a.period * a.fps) > 1e-9:
    raise SystemExit("periods x period must be a whole number of frames")
w = 2 * math.pi / a.period
frames = []
for i in range(n + 1):
    k = i % n  # the last frame is frame 0 again, exactly
    t = k / a.fps
    u = math.radians(a.upper) * math.sin(w * t)
    f = math.radians(a.fore) * math.sin(w * (t - a.lag)) - math.radians(a.centre)
    e = [sh[0] + L1 * math.cos(a1 + u), sh[1] + L1 * math.sin(a1 + u)]
    x = [e[0] + L2 * math.cos(a2 + u + f), e[1] + L2 * math.sin(a2 + u + f)]
    joints = {name: dict(j) for name, j in J.items()}
    joints["r_elbow"] = {"state": "observed", "at": [round(e[0], 2), round(e[1], 2)]}
    joints["r_wrist"] = {"state": "observed", "at": [round(x[0], 2), round(x[1], 2)]}
    joints["neck"] = {"state": J["neck"]["state"], "at": neck}
    frames.append({"t": round(i / a.fps, 6), "people": [{"id": "a", "joints": joints}]})

desc = (f"scripts/pendulum.py over the hand-placed keypoints: the right forearm swings the cup as a pendulum, "
        f"+-{a.fore:g} deg against the upper arm (centred {a.centre:g} deg toward the body) trailing it by {a.lag:g} s, upper arm +-{a.upper:g} deg, "
        f"period {a.period:g} s, {a.periods} periods ({n + 1} frames at {a.fps} fps, the last repeating the first); "
        f"rest aligned (upper arm {a.off_upper:g}, forearm {a.off_fore:g}, trunk {a.off_trunk:g} deg); every other joint held")
json.dump({"spec": "rig-pose-sequence/1", "space": {"units": "picture-px", "origin": "top-left", "y": "down"},
           "width": kp["width"], "height": kp["height"], "source": desc, "frames": frames}, open(a.out, "w"))
print(f"pendulum.py: {len(frames)} frame(s), forearm +-{a.fore:g} deg trailing {a.lag:g} s, "
      f"upper arm +-{a.upper:g} deg, period {a.period:g} s x {a.periods}")
