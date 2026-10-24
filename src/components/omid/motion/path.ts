import { clamp, distance, inside, length, mix, sub } from './math'
import type { Rect, Vec } from './math'

// Curved routes for Omid. A trip is never a straight line: it is a cubic Bezier
// with a gentle bulge (an arc, an S, a rising swoop, or a rounded corner when
// the countdown is in the way), sampled into a polyline so the carrot can be
// placed by distance travelled.

export type Bezier = [Vec, Vec, Vec, Vec]

export type Path = {
  pts: Vec[]
  cumulative: number[]
  length: number
  /** Radius of the tightest rounded corner, px (undefined for smooth arcs). */
  cornerRadius?: number
}

const SAMPLES_PER_SEGMENT = 28

function bezierAt([p0, p1, p2, p3]: Bezier, t: number): Vec {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  }
}

const line = (a: Vec, b: Vec): Bezier => [a, mix(a, b, 1 / 3), mix(a, b, 2 / 3), b]

/** A polyline whose corners are rounded off with arcs of up to `radius` px. */
export function roundedPolyline(points: Vec[], radius: number): Bezier[] {
  const out: Bezier[] = []
  let cur = points[0]
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const corner = points[i]
    const next = points[i + 1]
    const r = Math.min(radius, distance(prev, corner) / 2, distance(corner, next) / 2)
    const toward = (to: Vec): Vec => {
      const d = distance(corner, to) || 1
      return { x: corner.x + ((to.x - corner.x) / d) * r, y: corner.y + ((to.y - corner.y) / d) * r }
    }
    const a = toward(prev)
    const b = toward(next)
    out.push(line(cur, a))
    out.push([a, mix(a, corner, 2 / 3), mix(b, corner, 2 / 3), b])
    cur = b
  }
  out.push(line(cur, points[points.length - 1]))
  return out
}

export function pathFrom(segments: Bezier[]): Path {
  const pts: Vec[] = [bezierAt(segments[0], 0)]
  for (const seg of segments) {
    for (let i = 1; i <= SAMPLES_PER_SEGMENT; i++) {
      pts.push(bezierAt(seg, i / SAMPLES_PER_SEGMENT))
    }
  }
  const cumulative = [0]
  for (let i = 1; i < pts.length; i++) {
    cumulative.push(cumulative[i - 1] + distance(pts[i], pts[i - 1]))
  }
  return { pts, cumulative, length: cumulative[cumulative.length - 1] }
}

/** The point `d` px along the path (clamped to its ends). */
export function pointAt(path: Path, d: number): Vec {
  const target = clamp(d, 0, path.length)
  let lo = 0
  let hi = path.cumulative.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (path.cumulative[mid] <= target) lo = mid
    else hi = mid
  }
  const span = path.cumulative[hi] - path.cumulative[lo]
  const f = span > 0 ? (target - path.cumulative[lo]) / span : 0
  return mix(path.pts[lo], path.pts[hi], f)
}

/** Unit direction of travel `d` px along the path. */
export function directionAt(path: Path, d: number): Vec {
  const a = pointAt(path, d - 6)
  const b = pointAt(path, d + 6)
  const v = sub(b, a)
  const n = length(v) || 1
  return { x: v.x / n, y: v.y / n }
}

export type RouteStyle = 'arc' | 's' | 'rise'

export type RouteContext = {
  /** Where the centre of his body may be. */
  bounds: Rect
  /** Where it may not be (the countdown, already inflated). */
  obstacles: Rect[]
  random: () => number
}

function clear(path: Path, ctx: RouteContext): boolean {
  const slack = 3
  const { bounds } = ctx
  // If he starts a hair inside an obstacle (a resized window, say), the first
  // stretch of the route is allowed to leave it.
  const grace = ctx.obstacles.some((r) => inside(path.pts[0], r)) ? 70 : 0
  return path.pts.every(
    (p, i) =>
      p.x >= bounds.left - slack &&
      p.x <= bounds.right + slack &&
      p.y >= bounds.top - slack &&
      p.y <= bounds.bottom + slack &&
      (path.cumulative[i] < grace || ctx.obstacles.every((r) => !inside(p, r))),
  )
}

/**
 * A curved route from `from` to `to` that stays inside the bounds and clear of
 * the obstacles, or null. Tries several bulges and, if the countdown is in the
 * way, a rounded corner around it.
 */
export function planRoute(
  from: Vec,
  to: Vec,
  style: RouteStyle,
  ctx: RouteContext,
): Path | null {
  const chord = sub(to, from)
  const len = length(chord)
  if (len < 8) return null
  const dir = { x: chord.x / len, y: chord.y / len }
  const normal = { x: -dir.y, y: dir.x }
  const at = (t: number) => mix(from, to, t)
  const base = clamp(len * 0.2, 22, 240) * (0.75 + 0.5 * ctx.random())
  const side = ctx.random() < 0.5 ? 1 : -1
  const candidates: Bezier[] = []

  for (const scale of [1, -1, 1.8, -1.8, 0.5, -0.5]) {
    const b = base * scale * side
    const offset = (t: number, k: number): Vec => ({
      x: at(t).x + normal.x * b * k,
      y: at(t).y + normal.y * b * k,
    })
    if (style === 's') {
      candidates.push([from, offset(0.33, 1), offset(0.66, -1), to])
    } else if (style === 'rise') {
      const lift = clamp(len * 0.25, 30, 260)
      const p1 = offset(0.25, 0.9)
      const p2 = offset(0.7, 0.5)
      candidates.push([
        from,
        { x: p1.x, y: p1.y - lift * (to.y < from.y ? 0.3 : 0.9) },
        { x: p2.x, y: p2.y - lift * 0.45 },
        to,
      ])
    } else {
      candidates.push([from, offset(0.3, 1), offset(0.72, 1), to])
    }
  }
  // Rounded corners around whatever is in the way.
  for (const wp of [
    { x: to.x, y: from.y },
    { x: from.x, y: to.y },
  ]) {
    candidates.push([from, mix(from, wp, 0.85), mix(to, wp, 0.85), to])
  }

  for (const seg of candidates) {
    const path = pathFrom([seg])
    if (clear(path, ctx)) return path
  }

  // Still blocked (a narrow gap beside the countdown, say): go round a corner
  // with a rounded turn, tightening the turn until it fits.
  const corners: Vec[] = [
    { x: to.x, y: from.y },
    { x: from.x, y: to.y },
  ]
  for (const corner of corners) {
    for (const radius of [200, 150, 110, 80, 55, 30]) {
      const path = pathFrom(roundedPolyline([from, corner, to], radius))
      if (clear(path, ctx)) return { ...path, cornerRadius: radius }
    }
  }
  return null
}
