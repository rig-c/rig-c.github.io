#!/usr/bin/env python3
"""Write the Pose page's swing: Character 1's right arm swinging her cup like a pendulum.

No arguments: rebuild the committed model in an isolated temporary workspace and
check byte identity (Python 3.10+, Bun 1.4.2, HTTPS access required). The committed
model and art are never overwritten. Exact tool packages are installed only in
that new workspace, using its own fresh cache and a frozen lock.

Legacy usage: scripts/pendulum.py <keypoints.json> <out.pose.json> [--fore 5] [--centre 0] [--upper 0]
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
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets/rigs/character-1-swing"
PUBLIC_PIN = "c239b09328ca7364361b9761fac817502c09ede0"
BUN_VERSION = "1.4.2"
PACKAGES = {"@esotericsoftware/spine-core": "4.3.13", "@rig-c/pose": "0.35.0", "rig-c": "2.61.0"}
INPUT_HASHES = {
    "keypoints.json": "76b3152592362524921dc44843b04b525bc98ef6d873a579fca7d5a83318e3fd",
    "map.json": "cf27eef4c4fa173249807f68e3531e670eaf4a6f0caeb663c0eda039d1e1cbfb",
}
BASE_HASHES = {
    "rig.json": "904ab90fc64b622dab38ed891cdd72ca27fe38471c432dbec29bf3ce5a31b5f2",
    "motion.json": "0389d8edf15a17221e8a3a62131600efd397c0b9fc7663da277e8e02700f1beb",
}
LOCK = '{\n  "lockfileVersion": 2,\n  "configVersion": 1,\n  "workspaces": {\n    "": {\n      "name": "rig-c-site-pendulum",\n      "dependencies": {\n        "@esotericsoftware/spine-core": "4.3.13",\n        "@rig-c/pose": "0.35.0",\n        "rig-c": "2.61.0",\n      },\n    },\n  },\n  "packages": {\n    "@esotericsoftware/spine-core": ["@esotericsoftware/spine-core@4.3.13", "", {}, "sha512-iGs/40qOWSQYicABebDzFSwFOS1Nsm0dCCS8sGqbpVuThRKdLYeI1cVJpmATSpEmtcetEABTmh97NoBnt7XLDw=="],\n\n    "@rig-c/pose": ["@rig-c/pose@0.35.0", "", { "dependencies": { "rig-c": "^2.60.0" }, "bin": { "rig-pose": "bin/rig-pose.cjs" } }, "sha512-E1A/RbnWYnt2vD3heJbyY65iTfOUskqLD8E3WRxPaznnFEyz69JrJELzBhprFDnj/6EN4vX6IgorMySKu9pAuA=="],\n\n    "rig-c": ["rig-c@2.61.0", "", { "bin": { "rigc": "bin/rigc.cjs" } }, "sha512-+pG8Zy2acbA0Aaj+qaXSFeGx/VDDNOkURONxTtUVGrPlrPKkJHVmzNUadhWbesDy1hUE+AmB68A7SnG97ps8Bw=="],\n  }\n}\n'

def write_pose(a):
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


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def checked(ok, message):
    if not ok:
        raise RuntimeError(message)


def run(args, work, env, log_name, timeout=120):
    with (work / log_name).open("wb") as log:
        result = subprocess.run([str(x) for x in args], cwd=work, env=env,
                                stdout=log, stderr=subprocess.STDOUT, timeout=timeout)
    checked(result.returncode == 0, f"{log_name}: exit {result.returncode}; see {work / log_name}")


def prepare(work, supplied_toolchain=None):
    checked(shutil.which("bun") is not None, "Bun 1.4.2 must be installed on PATH")
    actual = subprocess.check_output(["bun", "--version"], text=True).strip()
    checked(actual == BUN_VERSION, f"Bun {BUN_VERSION} required; found {actual}")
    for name, expected in INPUT_HASHES.items():
        checked(sha(ASSETS / name) == expected, f"canonical input hash mismatch: {name}")
    rig = work / "out" / "rig"
    rig.mkdir(parents=True)
    for name, expected in BASE_HASHES.items():
        url = f"https://raw.githubusercontent.com/rig-c/examples/{PUBLIC_PIN}/family/roa/out/rig/{name}"
        with urlopen(Request(url, headers={"User-Agent": "rig-c-site-pendulum/1", "Accept-Encoding": "identity"}), timeout=20) as response:
            checked(response.status == 200, f"source fetch failed: {name}")
            data = response.read(4 * 1024 * 1024)
        checked(hashlib.sha256(data).hexdigest() == expected, f"public source hash mismatch: {name}")
        (rig / name).write_bytes(data)
    # The committed individual PNGs are the public source rig's unchanged images.
    (rig / "images").mkdir()
    for image in sorted(ASSETS.glob("*.png")):
        shutil.copyfile(image, rig / "images" / image.name)
    toolchain = Path(supplied_toolchain).resolve() if supplied_toolchain else work / "toolchain"
    env = dict(os.environ)
    env["BUN_INSTALL_CACHE_DIR"] = str(work / "fresh-cache")
    env["BUN_RUNTIME_TRANSPILER_CACHE_PATH"] = str(work / "transpiler-cache")
    env["TMPDIR"] = str(work / "tmp")
    Path(env["TMPDIR"]).mkdir()
    env.pop("NODE_PATH", None)
    if supplied_toolchain is None:
        toolchain.mkdir()
        (toolchain / "package.json").write_text(json.dumps({"name": "rig-c-site-pendulum", "private": True, "type": "module", "dependencies": PACKAGES}, indent=2) + "\n")
        (toolchain / "bun.lock").write_text(LOCK)
        with (work / "install.log").open("wb") as log:
            installed = subprocess.run(["bun", "install", "--frozen-lockfile", "--ignore-scripts"], cwd=toolchain, env=env, stdout=log, stderr=subprocess.STDOUT, timeout=120)
        checked(installed.returncode == 0, f"isolated install failed; see {work / 'install.log'}")
    for name, version in PACKAGES.items():
        manifest = json.loads((toolchain / "node_modules" / name / "package.json").read_text())
        checked(manifest.get("name") == name and manifest.get("version") == version, f"wrong tool version: {name}")
    pose = toolchain / "node_modules/@rig-c/pose/bin/rig-pose.cjs"
    core = toolchain / "node_modules/rig-c/bin/rigc.cjs"
    run(["bun", "--no-install", core, "--version"], work, env, "core-version.log")
    checked("2.61.0" in (work / "core-version.log").read_text() and "spine-core 4.3.13 present" in (work / "core-version.log").read_text(), "full rig-c 2.61.0/spine-core 4.3.13 entry required")
    return pose, core, rig, toolchain, env


def rebuild(a, work):
    pose, core, rig, toolchain, env = prepare(work, a.toolchain)
    a.keypoints = str(ASSETS / "keypoints.json")
    a.out = str(work / "swing.pose.json")
    # Legacy positional defaults stay unchanged; zero-argument reproduction uses the shipped preset.
    a.fore, a.centre, a.upper, a.lag = 4.0, 2.5, 0.0, 0.15
    write_pose(a)
    clean = work / "swing.pose.clean.json"
    run(["bun", "--no-install", pose, "clean", "--pose", a.out, "--out", clean, "--loop", "--hold", "off", "--rest", "1"], work, env, "clean.log")
    checked(json.loads(clean.read_text()) == json.loads((ASSETS / "swing.pose.clean.json").read_text()), "cleaned pose differs from committed input")
    # Keep the recorded build layout: model image paths are relative to this
    # sibling of out/rig, and skeleton.images records ../swing-build/.
    candidate = work / "swing-build"
    run(["bun", "--no-install", pose, "retarget", "--rig", rig, "--map", ASSETS / "map.json", "--pose", clean, "--out", work / "swing.motion.json", "--name", "swing", "--profile", "spine-html", "--build", candidate], work, env, "retarget.log", timeout=600)
    model = candidate / "skeleton.model.json"
    expected = sha(ASSETS / "skeleton.model.json")
    checked(sha(model) == expected, f"model mismatch: rebuilt {sha(model)}, committed {expected}; committed model untouched")
    for image in ASSETS.glob("*.png"):
        checked((candidate / image.name).read_bytes() == image.read_bytes(), f"image mismatch: {image.name}")
    receipt = {"publicPin": PUBLIC_PIN, "bun": BUN_VERSION, "packages": PACKAGES, "toolLockSHA256": sha(toolchain / "bun.lock"), "modelSHA256": expected, "byteIdentical": True, "committedFilesChanged": False}
    (work / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps(receipt, sort_keys=True))
    print(f"PASS: rebuilt committed swing model byte-identical, sha256 {expected}; original model and art unchanged")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("keypoints", nargs="?")
    ap.add_argument("out", nargs="?")
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
    ap.add_argument("--toolchain", help="existing isolated exact toolchain; otherwise install with the embedded frozen lock")
    ap.add_argument("--work", help="new reproduction workspace to retain; otherwise use a temporary directory under the current directory")
    a = ap.parse_args()
    if (a.keypoints is None) != (a.out is None):
        ap.error("legacy generation needs both keypoints and out")
    if a.keypoints is not None:
        if a.toolchain or a.work:
            ap.error("--toolchain/--work apply only to the complete reproduction")
        write_pose(a)
        return
    if a.work:
        work = Path(a.work).resolve()
        work.mkdir(exist_ok=False)
        rebuild(a, work)
    else:
        with tempfile.TemporaryDirectory(prefix="rig-c-pendulum-", dir=Path.cwd()) as temporary:
            rebuild(a, Path(temporary))


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, subprocess.SubprocessError, ValueError) as error:
        raise SystemExit(f"pendulum.py: {error}")
