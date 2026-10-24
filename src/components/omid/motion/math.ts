// Small pure helpers shared by the motion modules. Plain numbers in, plain
// numbers out: nothing here touches the DOM or the clock.

export type Vec = { x: number; y: number }
export type Rect = { left: number; top: number; right: number; bottom: number }

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export const smootherstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** Exponential smoothing: moves `current` towards `target` with time constant `tau` (s). */
export const approach = (current: number, target: number, tau: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-dt / tau))

export const length = (v: Vec) => Math.hypot(v.x, v.y)
export const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y)
export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y })
export const scale = (v: Vec, k: number): Vec => ({ x: v.x * k, y: v.y * k })
export const mix = (a: Vec, b: Vec, t: number): Vec => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
})

export function inflate(rect: Rect, x: number, y: number = x): Rect {
  return {
    left: rect.left - x,
    top: rect.top - y,
    right: rect.right + x,
    bottom: rect.bottom + y,
  }
}

export const inside = (p: Vec, r: Rect) =>
  p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom

/** A damped spring: position `x` and velocity `v`. */
export type Spring = { x: number; v: number }

export const spring = (x = 0): Spring => ({ x, v: 0 })

const MAX_SUBSTEP = 1 / 120

/**
 * Advances a damped spring towards `target`. `omega` is the natural frequency
 * (rad/s), `zeta` the damping ratio (below 1 overshoots and wobbles). Substepped
 * so a long frame cannot make it unstable. Returns the acceleration of the last
 * substep, which callers use to drive secondary motion.
 */
export function stepSpring(
  s: Spring,
  target: number,
  omega: number,
  zeta: number,
  dt: number,
): number {
  const n = Math.max(1, Math.ceil(dt / MAX_SUBSTEP))
  const h = dt / n
  let a = 0
  for (let i = 0; i < n; i++) {
    a = omega * omega * (target - s.x) - 2 * zeta * omega * s.v
    s.v += a * h
    s.x += s.v * h
  }
  return a
}

/** A spring's remaining energy, normalised, to decide when it may sleep. */
export const springIdle = (s: Spring, target: number, eps = 0.02) =>
  Math.abs(s.v) < eps && Math.abs(s.x - target) < eps
