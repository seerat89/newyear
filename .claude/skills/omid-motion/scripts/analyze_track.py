#!/usr/bin/env python3
"""Measure whether a recorded movement is smooth, restrained and natural.

    python analyze_track.py track.json [--series body] [--selftest]

Input is the JSON produced by track_sampler.js ({series: [{t,x,y,a,sx,sy,o}, ...]}).
Pure standard library. Prints metrics and flags. The thresholds are starting points
derived from the rules in SKILL.md, not laws: a flag means "go and look at the
frames", a clean report does not mean the motion is good (it only rules out
the mechanical failures that numbers can catch).
"""
import argparse
import json
import math
import re
import sys

# Starting-point thresholds. Keep them in step with SKILL.md.
LIMITS = {
    "frame_gap_p95_ms": 24.0,     # frame pacing while moving
    "ramp_up_min_s": 0.25,        # 5% -> 50% of peak speed
    "ramp_down_min_s": 0.30,      # 50% -> 5% of peak speed after the last peak
    "speed_step_max": 0.25,       # biggest per-frame speed change / peak speed (at 60 fps)
    "heading_rate_max_dps": 200.0,  # degrees/s while moving at >10% of peak
    "rotation_range_max_deg": 25.0,
    "rotation_rate_max_dps": 90.0,
    "stretch_max": 1.25,
    "squash_min": 0.75,
}


def load(path: str):
    text = sys.stdin.read() if path == "-" else open(path, encoding="utf-8").read()
    text = text.strip()
    if text.startswith('"'):  # `playwright-cli --raw eval "JSON.stringify(...)"` prints a quoted string
        text = json.loads(text)
    start, end = text.find("{"), text.rfind("}")
    if start < 0:
        sys.exit("no JSON object found in input")
    return json.loads(text[start : end + 1])


def smooth(values, window=3):
    half = window // 2
    out = []
    for i in range(len(values)):
        lo, hi = max(0, i - half), min(len(values), i + half + 1)
        out.append(sum(values[lo:hi]) / (hi - lo))
    return out


def percentile(values, q):
    if not values:
        return 0.0
    s = sorted(values)
    return s[min(len(s) - 1, int(q * len(s)))]


def resample(samples, step_ms):
    """Linear resampling of the track onto a fixed time step."""
    out, j = [], 0
    t = samples[0]["t"]
    end = samples[-1]["t"]
    keys = [k for k in samples[0] if k != "t"]
    while t <= end:
        while j < len(samples) - 2 and samples[j + 1]["t"] < t:
            j += 1
        a, b = samples[j], samples[j + 1]
        span = (b["t"] - a["t"]) or 1
        f = min(1.0, max(0.0, (t - a["t"]) / span))
        out.append({"t": t, **{k: a[k] + (b[k] - a[k]) * f for k in keys}})
        t += step_ms
    return out


def derivative(values, times):
    d = [0.0]
    for i in range(1, len(values)):
        dt = (times[i] - times[i - 1]) / 1000.0
        d.append((values[i] - values[i - 1]) / dt if dt > 0 else 0.0)
    return d


def analyze(name, samples):
    flags, m = [], {}
    if len(samples) < 8:
        return {"samples": len(samples)}, ["too few samples to analyse"]
    # Resample to a uniform 60 Hz grid so uneven frame timing (common in
    # headless browsers) does not read as jerky motion.
    samples = resample(samples, 1000 / 60)
    t = [s["t"] for s in samples]
    x = smooth([s["x"] for s in samples])
    y = smooth([s["y"] for s in samples])
    vx, vy = derivative(x, t), derivative(y, t)
    speed = smooth([math.hypot(a, b) for a, b in zip(vx, vy)])
    peak = max(speed) or 1e-9
    gaps = [b - a for a, b in zip(t, t[1:])]
    m["samples"] = len(samples)
    m["duration_s"] = round((t[-1] - t[0]) / 1000, 2)
    m["frame_gap_ms_p50_p95_max"] = [round(percentile(gaps, q), 1) for q in (0.5, 0.95, 1.0)]
    m["peak_speed_px_s"] = round(peak)
    m["path_px"] = round(sum(math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]) for i in range(1, len(x))))

    if m["frame_gap_ms_p50_p95_max"][1] > LIMITS["frame_gap_p95_ms"]:
        flags.append(f"uneven frame pacing: p95 gap {m['frame_gap_ms_p50_p95_max'][1]} ms")

    if peak > 20:  # there is real translation to judge
        def first_cross(level, begin=0):
            for i in range(begin, len(speed)):
                if speed[i] >= level:
                    return i
            return None

        i_peak = max(range(len(speed)), key=lambda i: speed[i])
        i5, i50 = first_cross(0.05 * peak), first_cross(0.5 * peak)
        if i5 is not None and i50 is not None and i50 >= i5:
            ramp_up = (t[i50] - t[i5]) / 1000
            m["ramp_up_s (5%->50% of peak)"] = round(ramp_up, 2)
            if ramp_up < LIMITS["ramp_up_min_s"]:
                flags.append(f"abrupt start: {ramp_up:.2f} s from 5% to 50% of peak speed")
        last_hi = max((i for i in range(len(speed)) if speed[i] >= 0.5 * peak), default=None)
        if last_hi is not None:
            i_end = next((i for i in range(last_hi, len(speed)) if speed[i] <= 0.05 * peak), None)
            if i_end is not None:
                ramp_down = (t[i_end] - t[last_hi]) / 1000
                m["ramp_down_s (50%->5% of peak)"] = round(ramp_down, 2)
                if ramp_down < LIMITS["ramp_down_min_s"]:
                    flags.append(f"abrupt stop: {ramp_down:.2f} s from 50% to 5% of peak speed")
        # per-frame speed steps, normalised to 60 fps so slow frames are not punished twice
        steps = [
            abs(speed[i] - speed[i - 1]) / peak * (16.7 / max(1.0, t[i] - t[i - 1]))
            for i in range(1, len(speed))
        ]
        m["max_speed_step_vs_peak"] = round(max(steps), 3)
        if max(steps) > LIMITS["speed_step_max"]:
            flags.append(f"speed jumps by {max(steps):.0%} of peak in one frame (snap or teleport)")
        # heading rate while moving at real speed (the anticipation back-step is a deliberate reversal)
        heading = [math.degrees(math.atan2(b, a)) for a, b in zip(vx, vy)]
        rates = []
        for i in range(1, len(heading)):
            if speed[i] > 0.25 * peak and speed[i - 1] > 0.25 * peak:
                dh = (heading[i] - heading[i - 1] + 180) % 360 - 180
                dt = (t[i] - t[i - 1]) / 1000
                if dt > 0:
                    rates.append(abs(dh) / dt)
        if rates:
            m["max_heading_rate_deg_s"] = round(max(smooth(rates, 5)))
            if max(smooth(rates, 5)) > LIMITS["heading_rate_max_dps"]:
                flags.append("heading turns too quickly (angular change of the path)")
        # straightness: ratio of net displacement to path (1.0 = ruler line)
        net = math.hypot(x[-1] - x[0], y[-1] - y[0])
        if m["path_px"] > 0:
            m["straightness"] = round(net / m["path_px"], 3)
        # jerk (smoothness), reported for comparison between iterations
        ax, ay = derivative(vx, t), derivative(vy, t)
        jerk = [math.hypot(a, b) for a, b in zip(derivative(smooth(ax), t), derivative(smooth(ay), t))]
        m["rms_jerk_px_s3"] = round(math.sqrt(sum(j * j for j in jerk) / len(jerk)))

    angle = smooth([s["a"] for s in samples])
    rng = max(angle) - min(angle)
    rate = max(abs(v) for v in smooth(derivative(angle, t), 5))
    m["rotation_range_deg"] = round(rng, 1)
    m["rotation_peak_rate_deg_s"] = round(rate)
    if rng > LIMITS["rotation_range_max_deg"]:
        flags.append(f"rotates over a range of {rng:.0f} deg (limit {LIMITS['rotation_range_max_deg']:.0f})")
    if rate > LIMITS["rotation_rate_max_dps"]:
        flags.append(f"rotation speed peaks at {rate:.0f} deg/s (limit {LIMITS['rotation_rate_max_dps']:.0f})")

    sx = [s["sx"] for s in samples]
    sy = [s["sy"] for s in samples]
    m["scale_x_min_max"] = [round(min(sx), 2), round(max(sx), 2)]
    m["scale_y_min_max"] = [round(min(sy), 2), round(max(sy), 2)]
    if max(sx + sy) > LIMITS["stretch_max"] or min(sx + sy) < LIMITS["squash_min"]:
        flags.append("scale outside the squash/stretch range (about 0.75-1.25)")
    return m, flags


def selftest():
    def series(fn, seconds=3.0, fps=60):
        n = int(seconds * fps)
        out = []
        for i in range(n + 1):
            t = i * 1000 / fps
            x, y, a = fn(i / n)
            out.append({"t": t, "x": x, "y": y, "a": a, "sx": 1, "sy": 1, "o": 1})
        return out

    smooth_move = series(lambda u: (400 * (10 * u**3 - 15 * u**4 + 6 * u**5), 40 * math.sin(math.pi * u), 8 * math.sin(math.pi * u)))
    snappy = series(lambda u: (400 * min(1, u * 8), 0, 70 * min(1, u * 8)))
    for label, data in (("smooth min-jerk move (expect no flags)", smooth_move), ("snappy linear move with big rotation (expect flags)", snappy)):
        m, f = analyze(label, data)
        print(label, "->", f if f else "no flags")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    p.add_argument("track", nargs="?", help="track JSON file, or - for stdin")
    p.add_argument("--series", help="only this series name")
    p.add_argument("--selftest", action="store_true")
    a = p.parse_args()
    if a.selftest:
        return selftest()
    if not a.track:
        p.error("track file required")
    data = load(a.track)
    for name, samples in data.items():
        if a.series and name != a.series:
            continue
        m, flags = analyze(name, samples)
        print(f"== {name}")
        for k, v in m.items():
            print(f"   {k}: {v}")
        print("   FLAGS:" if flags else "   no numeric flags")
        for f in flags:
            print("   -", f)


if __name__ == "__main__":
    main()
