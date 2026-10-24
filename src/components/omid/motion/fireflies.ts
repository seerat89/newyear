import { approach, spring, stepSpring } from './math'
import type { Spring, Vec } from './math'

// How the meadow's fireflies answer Omid. Ambient drifting is plain CSS in the
// page; this is only the reaction, as offsets from each firefly's home: they
// gather round him in a slow orbit when he settles among them, and scatter a
// little when he rushes past. All springs, no snapping.

export type Firefly = {
  /** Home position, px, in the same space as the body. */
  home: Vec
  /** Orbit phase, radius factor, spin and a per-firefly random bias. */
  angle: number
  orbit: number
  spin: number
  bias: number
}

export type FireflyState = { x: Spring; y: Spring; glow: number }

export type FireflyWorld = {
  /** Centre of Omid's body, px. */
  omid: Vec
  speed: number
  bodyW: number
  bodyH: number
  /** True while he is visiting the meadow. */
  gather: boolean
  /** How close a firefly must be to notice him, px. */
  range: number
  vref: number
  time: number
}

export function createFireflyStates(count: number): FireflyState[] {
  return Array.from({ length: count }, () => ({ x: spring(), y: spring(), glow: 0 }))
}

/** Advances every firefly; returns true while any of them is still moving. */
export function stepFireflies(
  flies: Firefly[],
  states: FireflyState[],
  world: FireflyWorld,
  dt: number,
): boolean {
  let active = false
  for (let i = 0; i < flies.length; i++) {
    const f = flies[i]
    const s = states[i]
    const dx = world.omid.x - f.home.x
    const dy = world.omid.y - f.home.y
    const d = Math.hypot(dx, dy)
    let tx = 0
    let ty = 0
    let omega = 2.4
    let zeta = 0.8
    let glow = 0
    if (world.gather && d < world.range) {
      const angle = f.angle + f.spin * world.time
      const radius = f.orbit * world.bodyW
      tx = world.omid.x + Math.cos(angle) * radius - f.home.x
      ty = world.omid.y + Math.sin(angle) * radius * 0.72 - world.bodyH * 0.12 - f.home.y
      omega = 3
      zeta = 0.7
      glow = 1
    } else if (world.speed > 0.35 * world.vref && d < 1.2 * world.bodyW + 0.1 * world.range) {
      const away = Math.min(1, world.speed / world.vref) * (36 + 60 * f.bias)
      tx = (-dx / (d || 1)) * away
      ty = (-dy / (d || 1)) * away
      omega = 5
      zeta = 0.6
      glow = 0.7
    }
    stepSpring(s.x, tx, omega, zeta, dt)
    stepSpring(s.y, ty, omega, zeta, dt)
    s.glow = approach(s.glow, glow, 0.5, dt)
    if (
      Math.abs(s.x.v) > 0.4 ||
      Math.abs(s.y.v) > 0.4 ||
      Math.abs(s.x.x - tx) > 0.4 ||
      Math.abs(s.y.x - ty) > 0.4 ||
      s.glow > 0.02
    ) {
      active = true
    }
  }
  return active
}
