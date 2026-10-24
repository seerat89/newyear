#!/usr/bin/env python3
"""Make contact sheets (tiled frame strips) from a video.

Used to read motion over time: the reference video and Omid's own recordings are
sheeted the same way and compared side by side.

    python contact_sheet.py VIDEO --start 18.2 --duration 2.4 --fps 15 \
        --crop 340:480:830:150 --width 230 --cols 9 --out sheets/jump

--crop is w:h:x:y in source pixels (optional). Writes OUT_01.jpg, OUT_02.jpg, ...
Needs ffmpeg: either on PATH, or `pip install imageio-ffmpeg`.
"""
import argparse
import shutil
import subprocess
import sys
from pathlib import Path


def find_ffmpeg() -> str:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg not found. Install ffmpeg, or: pip install imageio-ffmpeg")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    p.add_argument("video")
    p.add_argument("--start", type=float, default=0.0, help="start time in seconds")
    p.add_argument("--duration", type=float, default=5.0, help="seconds to sheet")
    p.add_argument("--fps", type=float, default=10.0, help="frames per second to sample")
    p.add_argument("--crop", default=None, help="w:h:x:y in source pixels")
    p.add_argument("--width", type=int, default=250, help="tile width in pixels")
    p.add_argument("--cols", type=int, default=8)
    p.add_argument("--rows", type=int, default=6, help="rows per sheet")
    p.add_argument("--out", default="sheet", help="output prefix")
    a = p.parse_args()

    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    filters = [f"fps={a.fps}"]
    if a.crop:
        filters.append(f"crop={a.crop}")
    filters += [f"scale={a.width}:-1", f"tile={a.cols}x{a.rows}"]
    cmd = [
        find_ffmpeg(), "-v", "error", "-y",
        "-ss", str(a.start), "-t", str(a.duration), "-i", a.video,
        "-vf", ",".join(filters), "-q:v", "3", f"{out}_%02d.jpg",
    ]
    subprocess.run(cmd, check=True)
    made = sorted(out.parent.glob(out.name + "_*.jpg"))
    per_sheet = a.cols * a.rows
    print(f"{len(made)} sheet(s), up to {per_sheet} frames each, {1000 / a.fps:.0f} ms per tile:")
    for m in made:
        print(" ", m)


if __name__ == "__main__":
    main()
