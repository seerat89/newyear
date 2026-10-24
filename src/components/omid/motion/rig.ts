import { approach, clamp, spring, stepSpring } from './math'
import type { Spring, Vec } from './math'

// Omid's rig: everything that makes the body a performing character instead of a
// sprite being dragged. It only reads the body's position, velocity and
// acceleration (plus a few pose commands from the current step) and produces
// numbers for the writer. Secondary parts are damped springs driven by the
// body's *acceleration*, so they lag, overshoot, and keep moving a little after
// the body stops.

export type RigCommand = {
  /** Squash (negative) or stretch (positive) the step asks for. */
  squash: number
  /** Arms thrown open, 0 at rest, 1 in the star pose. */
  open: number
  /** Extra lean in degrees (anticipation leans back). */
  leanBias: number
  /** Extra crest angle in degrees. */
  crestBias: number
  /** Arm paddling, 0..1 (a glide). */
  paddle: number
  /** A point to look at, in the same px space as the body, or null. */
  gaze: Vec | null
}

export const NEUTRAL: RigCommand = {
  squash: 0,
  open: 0,
  leanBias: 0,
  crestBias: 0,
  paddle: 0,
  gaze: null,
}

export type RigInput = {
  dt: number
  /** Seconds since the rig started, for the paddle rhythm. */
  time: number
  pos: Vec
  vel: Vec
  acc: Vec
  /** Reference speed and acceleration used to normalise (px/s, px/s^2). */
  vref: number
  aref: number
  /** How far a gaze point must be to look fully sideways (px). */
  gazeRange: number
  cmd: RigCommand
}

export type RigOutput = {
  lean: number
  sx: number
  sy: number
  crest: number
  crestScale: number
  armL: number
  armR: number
  haloX: number
  haloY: number
  haloScale: number
  gazeX: number
  gazeY: number
  travel: number
}

export type RigState = {
  lean: number
  squash: Spring
  crest: Spring
  crestScale: Spring
  armL: Spring
  armR: Spring
  haloX: Spring
  haloY: Spring
  haloReady: boolean
  gaze: Vec
  travel: number
  /** True while anything is still moving, so the loop knows when it may sleep. */
  active: boolean
}

export function createRig(): RigState {
  return {
    lean: 0,
    squash: spring(),
    crest: spring(),
    crestScale: spring(1),
    armL: spring(),
    armR: spring(),
    haloX: spring(),
    haloY: spring(),
    haloReady: false,
    gaze: { x: 0, y: 0 },
    travel: 0,
    active: false,
  }
}

/** A small random nudge to the crest and arms: an idle fidget through the same springs. */
export function fidget(rig: RigState, random: () => number, strength = 1) {
  rig.crest.v += (random() * 2 - 1) * 70 * strength
  rig.armL.v += (random() * 2 - 0.3) * 45 * strength
  rig.armR.v += (random() * 2 - 0.3) * 45 * strength
}

const limit = (value: number, max: number) => clamp(value, -max, max)

export function stepRig(rig: RigState, input: RigInput): RigOutput {
  const { dt, pos, vel, acc, cmd } = input
  const vn = { x: vel.x / input.vref, y: vel.y / input.vref }
  const an = { x: acc.x / input.aref, y: acc.y / input.aref }
  const speedN = clamp(Math.hypot(vn.x, vn.y), 0, 1.4)

  // Lean into the direction of travel: velocity gives the steady tilt,
  // acceleration the push and the rock-back when he stops. Hard-capped.
  const leanTarget = limit(
    limit(9 * vn.x + 3.4 * an.x, 12.5) + cmd.leanBias,
    17,
  )
  rig.lean = approach(rig.lean, leanTarget, 0.14, dt)

  // Squash and stretch: the step's request, shaped by a springy response so it
  // snaps in and rebounds; plus a stretch along the direction of travel.
  stepSpring(rig.squash, cmd.squash, 20, 0.72, dt)
  const vertical = Math.min(1, Math.abs(vn.y))
  const horizontal = Math.min(1, Math.abs(vn.x))
  let sx = (1 + 0.07 * horizontal) * (1 - 0.05 * vertical)
  let sy = (1 + 0.08 * vertical) * (1 - 0.05 * horizontal)
  sy *= 1 + 0.17 * rig.squash.x
  sx *= 1 - 0.11 * rig.squash.x
  sx = clamp(sx, 0.8, 1.2)
  sy = clamp(sy, 0.8, 1.2)

  // Crest: trails behind the acceleration, overshoots, and wobbles on.
  const crestTarget = limit(-30 * an.x - 9 * vn.x + cmd.crestBias, 40)
  stepSpring(rig.crest, crestTarget, 9, 0.38, dt)
  const crestScaleTarget = 1 - 0.16 * clamp(-an.y, -1, 1) + 0.1 * cmd.open
  stepSpring(rig.crestScale, crestScaleTarget, 10, 0.4, dt)

  // Arms: lift on an upward push, swing against sideways acceleration, thrown
  // open in the star pose, and paddling in a glide.
  const up = clamp(-an.y, -1, 1.5)
  const sway = clamp(-an.x, -1.5, 1.5)
  const paddle = cmd.paddle * 14 * Math.sin(2 * Math.PI * 1.5 * input.time)
  const armBase = cmd.open * 82 + 38 * up
  stepSpring(rig.armL, clamp(armBase + 10 * sway + paddle, -18, 100), 11, 0.45, dt)
  stepSpring(rig.armR, clamp(armBase - 10 * sway - paddle, -18, 100), 11, 0.45, dt)

  // Halo: follows the body a moment late and stretches a little with speed.
  if (!rig.haloReady) {
    rig.haloX.x = pos.x
    rig.haloY.x = pos.y
    rig.haloReady = true
  }
  stepSpring(rig.haloX, pos.x, 5.5, 0.85, dt)
  stepSpring(rig.haloY, pos.y, 5.5, 0.85, dt)

  // Gaze: looks at the target first, then along the way he is going.
  let gx = 0
  let gy = 0
  if (cmd.gaze) {
    gx = clamp((cmd.gaze.x - pos.x) / input.gazeRange, -1, 1)
    gy = clamp((cmd.gaze.y - pos.y) / input.gazeRange, -1, 1)
  }
  gx = clamp(gx + 0.45 * vn.x, -1, 1)
  gy = clamp(gy + 0.35 * vn.y, -1, 1)
  rig.gaze.x = approach(rig.gaze.x, gx, 0.22, dt)
  rig.gaze.y = approach(rig.gaze.y, gy, 0.22, dt)

  rig.travel = approach(rig.travel, speedN > 0.12 ? 1 : 0, 0.35, dt)

  const moving =
    Math.abs(rig.lean - leanTarget) > 0.05 ||
    Math.abs(rig.squash.v) > 0.02 ||
    Math.abs(rig.squash.x - cmd.squash) > 0.01 ||
    Math.abs(rig.crest.v) > 0.3 ||
    Math.abs(rig.crest.x - crestTarget) > 0.1 ||
    Math.abs(rig.crestScale.v) > 0.01 ||
    Math.abs(rig.armL.v) > 0.3 ||
    Math.abs(rig.armR.v) > 0.3 ||
    Math.abs(rig.armL.x - clamp(armBase + 10 * sway + paddle, -18, 100)) > 0.15 ||
    Math.abs(rig.haloX.v) > 0.3 ||
    Math.abs(rig.haloY.v) > 0.3 ||
    Math.abs(rig.haloX.x - pos.x) > 0.2 ||
    Math.abs(rig.haloY.x - pos.y) > 0.2 ||
    Math.abs(rig.gaze.x - gx) > 0.01 ||
    Math.abs(rig.gaze.y - gy) > 0.01 ||
    rig.travel > 0.02
  rig.active = moving

  const lag = { x: rig.haloX.x - pos.x, y: rig.haloY.x - pos.y }
  const maxLag = 0.6 * input.gazeRange * 0.2
  const lagLen = Math.hypot(lag.x, lag.y)
  const k = lagLen > maxLag ? maxLag / lagLen : 1

  return {
    lean: rig.lean,
    sx,
    sy,
    crest: rig.crest.x,
    crestScale: rig.crestScale.x,
    armL: rig.armL.x,
    armR: rig.armR.x,
    haloX: lag.x * k,
    haloY: lag.y * k,
    haloScale: 1 + 0.22 * clamp(speedN, 0, 1) + 0.14 * cmd.open,
    gazeX: rig.gaze.x,
    gazeY: rig.gaze.y,
    travel: rig.travel,
  }
}
