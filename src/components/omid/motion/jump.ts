import { smoothstep } from './math'

// The jump, authored from the reference clip (see the omid-motion skill):
// squash -> fast launch -> stretch -> open pose and a long, nearly still hang ->
// fast descent -> landing compression -> settle. Height follows a Hermite curve
// through key times with explicit speeds (so it is smooth everywhere except the
// deliberate launch kick), and the squash/stretch and the arm-opening follow
// their own smooth key tracks. All three feed the one rig; nothing here moves a
// DOM element.

export const JUMP_SECONDS = 2.36

type HeightKey = { t: number; y: number; v: number } // y in jump heights, v in heights/s
const HEIGHT: HeightKey[] = [
  { t: 0, y: 0, v: 0 },
  { t: 0.22, y: 0, v: 0 }, // end of the crouch
  { t: 0.26, y: 0.1, v: 4.2 }, // launch kick
  { t: 0.52, y: 0.93, v: 0.5 }, // decelerating rise
  { t: 0.72, y: 1, v: 0 }, // apex
  { t: 1.52, y: 0.9, v: -0.12 }, // the hang: sinks about a tenth
  { t: 1.62, y: 0.84, v: -1.0 },
  { t: 1.82, y: 0.04, v: -5.5 }, // fast drop
  { t: 1.93, y: -0.012, v: -0.2 }, // touchdown: sinks into the landing
  { t: 2.06, y: 0.012, v: 0.35 }, // a small rebound
  { t: 2.2, y: 0, v: 0 },
  { t: JUMP_SECONDS, y: 0, v: 0 },
]

// Squash (negative) and stretch (positive) of the body.
const SQUASH: [number, number][] = [
  [0, 0],
  [0.22, -1],
  [0.3, 1],
  [0.52, 0.4],
  [0.6, -0.15],
  [0.72, -0.5],
  [1.52, -0.35],
  [1.62, 0.1],
  [1.8, 0.85],
  [1.93, -1],
  [2.1, 0.35],
  [2.24, -0.12],
  [JUMP_SECONDS, 0],
]

// How far the arms are thrown open (0 at rest, 1 in the star pose).
const OPEN: [number, number][] = [
  [0, 0],
  [0.22, -0.3],
  [0.3, 0.1],
  [0.52, 0.6],
  [0.72, 1],
  [1.52, 1],
  [1.7, 0.6],
  [1.93, 0],
  [JUMP_SECONDS, 0],
]

function track(keys: [number, number][], t: number): number {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i]
    const [t1, b] = keys[i + 1]
    if (t <= t1) return a + (b - a) * smoothstep(t0, t1, t)
  }
  return keys[keys.length - 1][1]
}

function height(t: number): number {
  const keys = HEIGHT
  if (t <= 0) return 0
  for (let i = 0; i < keys.length - 1; i++) {
    const k0 = keys[i]
    const k1 = keys[i + 1]
    if (t <= k1.t) {
      const h = k1.t - k0.t
      const s = (t - k0.t) / h
      const s2 = s * s
      const s3 = s2 * s
      return (
        (2 * s3 - 3 * s2 + 1) * k0.y +
        (s3 - 2 * s2 + s) * h * k0.v +
        (-2 * s3 + 3 * s2) * k1.y +
        (s3 - s2) * h * k1.v
      )
    }
  }
  return 0
}

export type JumpPose = {
  /** How far above the take-off point he is, in px (never meaningfully below it). */
  lift: number
  /** Squash (negative) or stretch (positive), about -1..1. */
  squash: number
  /** Arms thrown open, about -0.3..1. */
  open: number
}

export function jumpPose(t: number, jumpHeight: number): JumpPose {
  return {
    lift: Math.max(-0.03 * jumpHeight, height(t) * jumpHeight),
    squash: track(SQUASH, t),
    open: track(OPEN, t),
  }
}
