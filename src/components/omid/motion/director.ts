import { averageSpeedFactor } from './profile'
import { planRoute } from './path'
import type { Path, RouteStyle } from './path'
import { clamp, distance, mix } from './math'
import type { Rect, Vec } from './math'

// The director decides what Omid does and why. A behaviour is a short list of
// steps (travel, hold, jump) with a destination, a gaze and an effect on the
// scene; the controller plays the steps through the one motion system. Pure:
// everything it needs comes in through the context.

export type Behaviour =
  | 'meadow'
  | 'lantern'
  | 'fly'
  | 'glide'
  | 'cross'
  | 'jump'
  | 'float'
  | 'lookout'

export type TravelStyle = 'float' | 'fly' | 'glide'

/** What a step does to the scene when it starts. */
export type SceneEvent = 'gather' | 'lantern' | 'scatter'

export type TravelStep = {
  kind: 'travel'
  path: Path
  style: TravelStyle
  /** Seconds spent anticipating, travelling, and settling. */
  anticipation: number
  duration: number
  settle: number
  /** Speed-profile shape (see profile.ts): fraction of the trip speeding up / slowing down. */
  accelUp: number
  accelDown: number
  /** Body spring: stiffness and damping ratio. */
  omega: number
  zeta: number
  /** Arm opening while travelling, paddle strength, bob amplitude (px). */
  open: number
  paddle: number
  bob: number
  /** Overshoot at the end, px. */
  overshoot: number
  /** Where he looks while travelling. */
  gaze: Vec
}

export type HoldStep = {
  kind: 'hold'
  duration: number
  gaze: Vec | null
  /** Hovering bob amplitude (px), 0 for resting on the ground. */
  bob: number
  event?: SceneEvent
}

export type JumpStep = { kind: 'jump'; height: number }

export type Step = TravelStep | HoldStep | JumpStep

export type Plan = { name: Behaviour; steps: Step[] }

export type Places = {
  /** Omid's lookout: the body's resting position (the origin). */
  lookout: Vec
  /** Where he stands to visit the lantern, and the lamp itself. */
  lantern: Vec
  lamp: Vec
  /** Spots among the fireflies and their centre. */
  meadow: Vec[]
  meadowCentre: Vec
  /** A point on the glowing horizon. */
  horizon: Vec
}

export type Context = {
  pos: Vec
  bodyW: number
  bodyH: number
  viewW: number
  viewH: number
  bounds: Rect
  obstacles: Rect[]
  places: Places
  random: () => number
}

const STYLE: Record<
  TravelStyle,
  {
    up: number
    down: number
    speed: number
    omega: number
    zeta: number
    minSeconds: number
    open: number
    paddle: number
    bob: number
    anticipation: number
    overshoot: number
    route: RouteStyle
  }
> = {
  float: { up: 0.3, down: 0.55, speed: 0.85, omega: 6.5, zeta: 0.8, minSeconds: 1.8, open: 0.1, paddle: 0, bob: 0, anticipation: 0.26, overshoot: 0.05, route: 'arc' },
  fly: { up: 0.35, down: 0.5, speed: 0.95, omega: 7, zeta: 0.75, minSeconds: 2.2, open: 0.4, paddle: 0, bob: 0.03, anticipation: 0.3, overshoot: 0.06, route: 'rise' },
  glide: { up: 0.3, down: 0.32, speed: 0.8, omega: 5.5, zeta: 0.8, minSeconds: 3, open: 0.15, paddle: 1, bob: 0.07, anticipation: 0.3, overshoot: 0.04, route: 's' },
}

const between = (random: () => number, a: number, b: number) => a + (b - a) * random()

function routeContext(ctx: Context) {
  return { bounds: ctx.bounds, obstacles: ctx.obstacles, random: ctx.random }
}

function travelStep(
  path: Path,
  style: TravelStyle,
  ctx: Context,
  gaze: Vec,
): TravelStep {
  const s = STYLE[style]
  const vref = ctx.viewW * 0.19
  // A tight corner taken at full speed turns too fast, so slow down for it.
  const corner = path.cornerRadius !== undefined && path.cornerRadius < 120 ? 1.4 : 1
  const duration = clamp(
    (corner * path.length) / (vref * s.speed * averageSpeedFactor(s.up, s.down)),
    s.minSeconds,
    11,
  )
  return {
    kind: 'travel',
    path,
    style,
    anticipation: s.anticipation,
    duration,
    settle: 0.8,
    accelUp: s.up,
    accelDown: s.down,
    omega: s.omega,
    zeta: s.zeta,
    open: s.open,
    paddle: s.paddle,
    bob: s.bob * ctx.bodyH,
    overshoot: Math.min(s.overshoot * path.length, 0.14 * ctx.bodyH),
    gaze,
  }
}

function go(
  ctx: Context,
  to: Vec,
  style: TravelStyle,
  gaze: Vec,
  route: RouteStyle = STYLE[style].route,
): TravelStep | null {
  const path = planRoute(ctx.pos, to, route, routeContext(ctx))
  return path ? travelStep(path, style, ctx, gaze) : null
}

/** Free height above a body-centre position, to the window top or the countdown. */
export function headroom(p: Vec, bounds: Rect, obstacles: Rect[]): number {
  let room = p.y - bounds.top
  for (const r of obstacles) {
    if (p.x > r.left && p.x < r.right && r.bottom <= p.y) {
      room = Math.min(room, p.y - r.bottom)
    }
  }
  return room
}

const hold = (
  random: () => number,
  min: number,
  max: number,
  gaze: Vec | null,
  extra: Partial<HoldStep> = {},
): HoldStep => ({
  kind: 'hold',
  duration: between(random, min, max),
  gaze,
  bob: 0,
  ...extra,
})

function pick<T>(list: T[], random: () => number): T {
  return list[Math.floor(random() * list.length)]
}

const BUILDERS: Record<Behaviour, (ctx: Context) => Step[] | null> = {
  // Visit the firefly meadow: drift over, and the fireflies gather round him.
  meadow(ctx) {
    const spots = [...ctx.places.meadow].sort(() => ctx.random() - 0.5)
    for (const spot of spots) {
      if (distance(spot, ctx.pos) < 0.12 * ctx.viewW) continue
      const t = go(ctx, spot, 'float', ctx.places.meadowCentre)
      if (t) {
        return [
          t,
          hold(ctx.random, 4.5, 6.5, ctx.places.meadowCentre, { event: 'gather' }),
        ]
      }
    }
    return null
  },

  // Go to the lantern and look up at the lamp; it flares as he arrives.
  lantern(ctx) {
    const t = go(ctx, ctx.places.lantern, 'float', ctx.places.lamp)
    if (!t) return null
    return [t, hold(ctx.random, 3.5, 4.5, ctx.places.lamp, { event: 'lantern' })]
  },

  // Fly up into the open sky, hover with a gentle bob, then come back down.
  fly(ctx) {
    // Candidate spots: anywhere free, plus the open columns either side of the countdown.
    const spots: Vec[] = []
    const { bounds, obstacles } = ctx
    const left = Math.min(...obstacles.map((r) => r.left), bounds.right)
    const right = Math.max(...obstacles.map((r) => r.right), bounds.left)
    const lowY = ctx.pos.y - 0.2 * ctx.bodyH
    for (let i = 0; i < 28; i++) {
      spots.push({
        x: between(ctx.random, bounds.left, bounds.right),
        y: between(ctx.random, bounds.top, lowY),
      })
    }
    for (let i = 0; i < 10; i++) {
      if (left - bounds.left > 12) {
        spots.push({ x: between(ctx.random, bounds.left, left), y: between(ctx.random, bounds.top, lowY) })
      }
      if (bounds.right - right > 12) {
        spots.push({ x: between(ctx.random, right, bounds.right), y: between(ctx.random, bounds.top, lowY) })
      }
    }
    let best: { p: Vec; gain: number } | null = null
    for (const p of spots) {
      if (obstacles.some((r) => p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom)) continue
      if (Math.abs(p.x - ctx.pos.x) < 0.1 * ctx.viewW && ctx.viewW > 700) continue
      const gain = (ctx.pos.y - p.y) * (0.6 + 0.4 * ctx.random())
      if (!best || gain > best.gain) best = { p, gain }
    }
    if (!best || best.gain < 0.45 * ctx.bodyH) return null
    const up = go(ctx, best.p, 'fly', ctx.places.horizon)
    if (!up) return null
    const home = pick([ctx.places.lookout, ctx.places.lookout, ctx.places.lantern], ctx.random)
    const back = planRoute(best.p, home, 'arc', routeContext(ctx))
    if (!back) return null
    return [
      up,
      hold(ctx.random, 2.2, 3.2, ctx.places.lookout, { bob: 0.05 * ctx.bodyH }),
      travelStep(back, 'fly', ctx, home),
    ]
  },

  // Glide part-way across the scene at a steady speed.
  glide(ctx) {
    return crossBy(ctx, 0.38, 0.6)
  },

  // Occasionally cross a large part of the viewport.
  cross(ctx) {
    return crossBy(ctx, 0.62, 0.9)
  },

  // Jump where there is clear sky above him: here if there is room, otherwise
  // drift to the nearest open spot first. Short screens get a smaller jump.
  jump(ctx) {
    const wanted = 1.5 * ctx.bodyH
    const fit = (p: Vec) =>
      Math.min(wanted, headroom(p, ctx.bounds, ctx.obstacles) - 0.1 * ctx.bodyH)
    const here = fit(ctx.pos)
    if (here >= 1.0 * ctx.bodyH) {
      return [
        { kind: 'jump', height: here },
        hold(ctx.random, 1.6, 2.4, null, { event: 'scatter' }),
      ]
    }
    let best: { p: Vec; height: number; score: number } | null = null
    const { bounds } = ctx
    for (let i = 0; i <= 24; i++) {
      for (const y of [ctx.places.lookout.y, bounds.bottom]) {
        const p = { x: bounds.left + ((bounds.right - bounds.left) * i) / 24, y }
        if (ctx.obstacles.some((r) => p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom)) continue
        const height = fit(p)
        if (height < 0.6 * ctx.bodyH) continue
        const score = height / wanted - 0.6 * (distance(p, ctx.pos) / ctx.viewW)
        if (!best || score > best.score) best = { p, height, score }
      }
    }
    if (!best) return null
    const t = go(ctx, best.p, 'float', mix(best.p, ctx.places.horizon, 0.4))
    if (!t) return null
    return [
      t,
      hold(ctx.random, 0.5, 0.9, null),
      { kind: 'jump', height: best.height },
      hold(ctx.random, 1.6, 2.4, null, { event: 'scatter' }),
    ]
  },

  // A short drift to somewhere else along the ridge.
  float(ctx) {
    // Sized to the free space, so a short screen still gets a visible drift.
    const span = ctx.bounds.right - ctx.bounds.left
    for (let i = 0; i < 16; i++) {
      const angle = between(ctx.random, 0, Math.PI * 2)
      const dist = between(ctx.random, 0.22, 0.45) * Math.min(span, 1.4 * ctx.viewW)
      const p = {
        x: clamp(ctx.pos.x + Math.cos(angle) * dist, ctx.bounds.left, ctx.bounds.right),
        y: clamp(ctx.pos.y + Math.sin(angle) * dist * 0.5, ctx.bounds.top, ctx.bounds.bottom),
      }
      if (distance(p, ctx.pos) < 0.12 * Math.min(span, ctx.viewW)) continue
      const t = go(ctx, p, 'float', mix(p, ctx.places.horizon, 0.3))
      if (t) return [t, hold(ctx.random, 3, 5, pick([ctx.places.horizon, ctx.places.lamp, ctx.places.meadowCentre], ctx.random))]
    }
    return null
  },

  // Go back to the lookout and watch the horizon for a while.
  lookout(ctx) {
    // Coming back up to the lookout is a buoyant little flight.
    const climbing = ctx.pos.y > 0.3 * ctx.bodyH
    const t = go(ctx, ctx.places.lookout, climbing ? 'fly' : 'float', ctx.places.horizon)
    if (!t) return null
    return [t, hold(ctx.random, 5, 8, ctx.places.horizon)]
  },
}

function crossBy(ctx: Context, minFraction: number, maxFraction: number): Step[] | null {
  const { bounds } = ctx
  const width = bounds.right - bounds.left
  const goRight = ctx.pos.x < (bounds.left + bounds.right) / 2
  for (let i = 0; i < 12; i++) {
    const span = between(ctx.random, minFraction, maxFraction) * width
    const x = clamp(ctx.pos.x + (goRight ? span : -span), bounds.left, bounds.right)
    if (Math.abs(x - ctx.pos.x) < 0.3 * width) continue
    const y = clamp(ctx.pos.y + between(ctx.random, -0.12, 0.08) * ctx.viewH, bounds.top, bounds.bottom)
    const to = { x, y }
    const t = go(ctx, to, 'glide', mix(to, ctx.places.horizon, 0.25))
    if (t) return [t, hold(ctx.random, 2.5, 3.5, ctx.places.horizon)]
  }
  return null
}

/** Plans one named behaviour (used by tests and the console), or null if it does not fit now. */
export function planBehaviour(name: Behaviour, ctx: Context): Plan | null {
  const steps = BUILDERS[name](ctx)
  return steps ? { name, steps } : null
}

export type DirectorState = {
  bag: Behaviour[]
  last: Behaviour | null
  away: number
}

export const createDirector = (): DirectorState => ({ bag: [], last: null, away: 0 })

const BAG: Behaviour[] = ['meadow', 'lantern', 'fly', 'glide', 'jump', 'float', 'cross', 'float']

function refill(state: DirectorState, random: () => number) {
  const bag = [...BAG]
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[bag[i], bag[j]] = [bag[j], bag[i]]
  }
  if (bag[bag.length - 1] === state.last) bag.unshift(bag.pop() as Behaviour)
  state.bag = bag
}

/** Chooses and plans the next behaviour. Always returns something he can do. */
export function planNext(state: DirectorState, ctx: Context): Plan {
  const away = distance(ctx.pos, ctx.places.lookout) > 0.16 * ctx.viewW
  state.away = away ? state.away + 1 : 0
  if (state.away >= 2) {
    const steps = BUILDERS.lookout(ctx)
    if (steps) {
      state.last = 'lookout'
      state.away = 0
      return { name: 'lookout', steps }
    }
  }
  for (let attempt = 0; attempt < 12; attempt++) {
    if (state.bag.length === 0) refill(state, ctx.random)
    const name = state.bag.pop() as Behaviour
    if (name === state.last) continue
    const steps = BUILDERS[name](ctx)
    if (steps) {
      state.last = name
      return { name, steps }
    }
  }
  // Nothing fits (a tiny window, say): rest and look around.
  state.last = 'lookout'
  return {
    name: 'lookout',
    steps: [hold(ctx.random, 4, 6, ctx.places.horizon)],
  }
}

