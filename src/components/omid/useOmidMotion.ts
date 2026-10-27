import { useEffect } from 'react'
import type { RefObject } from 'react'
import { SCENES, groundBelow, lampCenter } from '../scene/scenes'
import type { SceneArt } from '../scene/scenes'
import { createDirector, planBehaviour, planNext } from './motion/director'
import type { Behaviour, Context, Plan, Places, Step, TravelStep } from './motion/director'
import { createFireflyStates, stepFireflies } from './motion/fireflies'
import type { Firefly } from './motion/fireflies'
import { JUMP_SECONDS, jumpPose } from './motion/jump'
import { approach, clamp, smoothstep, spring, stepSpring } from './motion/math'
import type { Rect, Vec } from './motion/math'
import { directionAt, pointAt } from './motion/path'
import { profile } from './motion/profile'
import { NEUTRAL, createRig, fidget, stepRig } from './motion/rig'
import type { RigCommand } from './motion/rig'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

// Omid's motion system: the one frame loop. The director (motion/director.ts)
// decides what he does; this file plays it. A step moves a "carrot" along a
// curved route; Omid's body is a damped spring chasing the carrot, so every
// start, turn and stop has inertia, lag and a small overshoot. The rig
// (motion/rig.ts) turns the body's velocity and acceleration into lean,
// squash and stretch, crest and arm lag, halo lag and gaze. The environment
// answers (fireflies, light pool, trail, lantern, parallax). Only transforms
// and opacity are written, nothing re-renders, and the loop sleeps whenever
// nothing is moving and stops while the tab is hidden. Under reduced motion it
// does not run at all: he rests on his lookout.
//
// He can also be picked up (Pointer Events, so touch, pen and mouse alike): a tap
// plays the existing jump, and a drag suspends the director while the carrot follows
// the pointer (the same spring, so the same lean and stretch). On release he settles
// where he was dropped and the director resumes after a calm few seconds.
//
// Space: pixels, relative to where Omid rests on his lookout (the origin is the
// centre of his body there).

export const TRAIL_DOTS = 10
const TRAIL_LIFE = 1.4
const MAX_FRAME_S = 0.05
/** How far the pointer may move (px) and still count as a tap. */
const TAP_SLOP = 6
/** The calm pause (seconds) after a drop before the director takes over again. */
const DROP_CALM: [number, number] = [6, 10]

type Layout = {
  art: SceneArt
  k: number
  stageLeft: number
  stageTop: number
  c0: Vec
  bodyW: number
  bodyH: number
  viewW: number
  viewH: number
  bounds: Rect
  obstacles: Rect[]
  places: Places
  fireflies: Firefly[]
  setEl: HTMLElement
}

function measureObstacles(layout: Layout): Rect[] {
  // The body box's top edge is a little above the crest tip, so below the
  // countdown the margin is measured to the crest, not the box.
  const air = 4
  return Array.from(document.querySelectorAll('[data-omid-keepout]'), (el) => {
    const r = el.getBoundingClientRect()
    return {
      left: r.left - layout.c0.x - layout.bodyW / 2 - air,
      right: r.right - layout.c0.x + layout.bodyW / 2 + air,
      top: r.top - layout.c0.y - layout.bodyH * 0.5 - air,
      bottom: r.bottom - layout.c0.y + layout.bodyH * 0.43 + air,
    }
  })
}

function measureLayout(scene: HTMLElement): Layout | null {
  const stage = scene.querySelector<HTMLElement>('.scene-stage')
  const anchor = scene.querySelector<HTMLElement>('.scene-omid')
  const sets = Array.from(scene.querySelectorAll<HTMLElement>('.scene-set'))
  const setEl = sets.find((el) => el.offsetParent !== null) ?? sets[0]
  if (!stage || !anchor || !setEl) return null
  const art = SCENES.find((a) => a.id === setEl.dataset.art)
  if (!art) return null

  const sr = stage.getBoundingClientRect()
  const ar = anchor.getBoundingClientRect()
  const k = sr.width / art.width
  const bodyW = ar.width
  const bodyH = ar.height
  const c0 = { x: ar.left + bodyW / 2, y: ar.top + bodyH / 2 }
  const viewW = document.documentElement.clientWidth
  const viewH = window.innerHeight

  // A point in art units -> offset space (relative to his resting centre).
  const world = (x: number, y: number): Vec => ({
    x: sr.left + x * k - c0.x,
    y: sr.top + y * k - c0.y,
  })
  // Feet positions move the body centre by the same offset.
  const feet = (p: [number, number]): Vec => ({
    x: (p[0] - art.omid.x) * k,
    y: (p[1] - art.omid.feet) * k,
  })

  const inset = viewW >= 1600 ? 0.04 * viewW : 0.025 * viewW
  const hx = bodyW / 2
  const hy = bodyH / 2
  const bounds: Rect = {
    left: inset + hx - c0.x,
    right: viewW - inset - hx - c0.x,
    top: inset + hy - c0.y,
    bottom: Math.min(viewH - inset - hy, sr.top + art.feetMax * k - hy) - c0.y,
  }

  const centre = art.fireflies.reduce(
    (acc, f) => ({ x: acc.x + f.x / art.fireflies.length, y: acc.y + f.y / art.fireflies.length }),
    { x: 0, y: 0 },
  )
  const lamp = lampCenter(art)
  const places: Places = {
    lookout: { x: 0, y: 0 },
    lantern: feet(art.stops.lantern),
    lamp: world(lamp.x, lamp.y),
    meadow: art.stops.meadow.map(feet),
    meadowCentre: world(centre.x, centre.y),
    horizon: world(art.glow.x, art.glow.y),
  }
  const fireflies: Firefly[] = art.fireflies.map((f, i) => {
    const frac = (n: number) => n - Math.floor(n)
    return {
      home: world(f.x, f.y),
      angle: i * 2.399,
      orbit: 0.55 + 0.5 * frac(i * 0.37),
      spin: (i % 2 ? 1 : -1) * (0.5 + 0.4 * frac(i * 0.61)),
      bias: frac(i * 0.73),
    }
  })
  const layout: Layout = {
    art,
    k,
    stageLeft: sr.left,
    stageTop: sr.top,
    c0,
    bodyW,
    bodyH,
    viewW,
    viewH,
    bounds,
    obstacles: [],
    places,
    fireflies,
    setEl,
  }
  layout.obstacles = measureObstacles(layout)
  return layout
}

type Parts = {
  body: HTMLElement
  action: HTMLElement
  halo: HTMLElement
  crest: SVGElement
  armL: SVGElement
  armR: SVGElement
  feet: SVGElement
  gaze: SVGElement
  pool: HTMLElement
  trail: HTMLElement[]
  far: HTMLElement
  ground: HTMLElement
  near: HTMLElement
  flies: HTMLElement[]
  flare: HTMLElement
}

function findParts(scene: HTMLElement, layout: Layout): Parts | null {
  const q = <T extends Element>(sel: string, root: ParentNode = scene) => root.querySelector<T>(sel)
  const body = q<HTMLElement>('.scene-omid-body')
  const action = q<HTMLElement>('.omid-action')
  const halo = q<HTMLElement>('.omid-halo')
  const crest = q<SVGElement>('.omid-crest-pose')
  const armL = q<SVGElement>('.omid-arm-pose-l')
  const armR = q<SVGElement>('.omid-arm-pose-r')
  const feet = q<SVGElement>('.omid-feet')
  const gaze = q<SVGElement>('.omid-gaze')
  const pool = q<HTMLElement>('.scene-pool')
  const far = q<HTMLElement>('.scene-layer[data-layer="far"]')
  const ground = q<HTMLElement>('.scene-layer[data-layer="ground"]')
  const near = q<HTMLElement>('.scene-layer[data-layer="near"]')
  const flare = q<HTMLElement>('.lantern-flare', layout.setEl)
  if (!body || !action || !halo || !crest || !armL || !armR || !feet || !gaze || !pool || !far || !ground || !near || !flare) {
    return null
  }
  return {
    body,
    action,
    halo,
    crest,
    armL,
    armR,
    feet,
    gaze,
    pool,
    trail: Array.from(scene.querySelectorAll<HTMLElement>('.scene-trail span')),
    far,
    ground,
    near,
    flies: Array.from(layout.setEl.querySelectorAll<HTMLElement>('.ff')),
    flare,
  }
}

const f2 = (n: number) => n.toFixed(2)

export function useOmidMotion(sceneRef: RefObject<HTMLElement | null>) {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene || reduced) return
    let layout = measureLayout(scene)
    let parts = layout && findParts(scene, layout)
    if (!layout || !parts) return
    const random = Math.random

    // Simulation state. Position is of the body centre; lift is a jump's height.
    const p: Vec = { x: 0, y: 0 }
    const v: Vec = { x: 0, y: 0 }
    const anchor: Vec = { x: 0, y: 0 }
    const rig = createRig()
    const director = createDirector()
    let flies = createFireflyStates(layout.fireflies.length)
    const flare = spring(0)
    const trail = Array.from({ length: TRAIL_DOTS }, () => ({ age: TRAIL_LIFE, x: 0, y: 0 }))
    let plan: Plan | null = null
    let stepIndex = 0
    let step: Step | null = null
    let stepT = 0
    let time = 0
    let lift = 0
    let liftOld = 0
    let liftV = 0
    let liftA = 0
    let gatherActive = false
    let scatterUntil = 0
    let idleGaze: Vec | null = null
    let trailClock = 0
    let flareUntil = -1
    let camX = 0

    // While held: the pointer's grab offset on his body and where the carrot is sent.
    let drag: { id: number; sx: number; sy: number; gx: number; gy: number; moved: boolean; x: number; y: number } | null = null

    let raf = 0
    let last = 0
    let sleptAt = 0
    let layoutDirty = false
    let nextTimer: number | undefined
    let idleTimer: number | undefined
    let holdTimer: number | undefined

    const cache = new WeakMap<Element, Record<string, string>>()
    const put = (el: Element, prop: string, value: string) => {
      let c = cache.get(el)
      if (!c) cache.set(el, (c = {}))
      if (c[prop] === value) return
      c[prop] = value
      ;(el as HTMLElement).style.setProperty(prop, value)
    }

    // ---- planning -------------------------------------------------------
    const context = (): Context => ({
      pos: { x: p.x, y: p.y },
      bodyW: layout!.bodyW,
      bodyH: layout!.bodyH,
      viewW: layout!.viewW,
      viewH: layout!.viewH,
      bounds: layout!.bounds,
      obstacles: layout!.obstacles,
      places: layout!.places,
      random,
    })

    const startStep = (next: Step) => {
      step = next
      stepT = 0
      if (next.kind === 'hold') {
        gatherActive = next.event === 'gather'
        if (next.event === 'lantern') flareUntil = time + 1.5
        if (next.event === 'scatter') scatterUntil = time + 1.8
      } else {
        gatherActive = false
        if (next.kind === 'jump') scatterUntil = time + 2
      }
    }

    const startPlan = (next: Plan) => {
      plan = next
      scene.dataset.behaviour = next.name
      stepIndex = 0
      startStep(next.steps[0])
      window.clearTimeout(holdTimer)
      wake()
    }

    const scheduleNext = (min: number, max: number) => {
      window.clearTimeout(nextTimer)
      nextTimer = window.setTimeout(
        () => {
          if (layout) layout.obstacles = measureObstacles(layout)
          startPlan(planNext(director, context()))
        },
        (min + (max - min) * random()) * 1000,
      )
    }

    const finishStep = () => {
      if (step?.kind === 'travel') {
        const end = step.path.pts[step.path.pts.length - 1]
        anchor.x = end.x
        anchor.y = end.y
      }
      if (step?.kind === 'hold') gatherActive = false
      stepIndex += 1
      if (plan && stepIndex < plan.steps.length) {
        startStep(plan.steps[stepIndex])
      } else {
        step = null
        plan = null
        delete scene.dataset.behaviour
        scheduleNext(5, 11)
      }
    }

    // ---- one step's carrot and pose ------------------------------------
    let omega = 6
    let zeta = 0.9
    const carrot: Vec = { x: 0, y: 0 }

    const drive = (): RigCommand => {
      const cmd: RigCommand = { ...NEUTRAL }
      omega = 6
      zeta = 0.9
      carrot.x = anchor.x
      carrot.y = anchor.y
      cmd.gaze = idleGaze
      if (drag?.moved) {
        // Held: follow the pointer a little softly, so he trails and leans into the move.
        omega = 10
        zeta = 0.85
        carrot.x = drag.x
        carrot.y = drag.y
        return cmd
      }
      if (!step) return cmd

      if (step.kind === 'travel') {
        const s: TravelStep = step
        omega = s.omega
        zeta = s.zeta
        cmd.gaze = s.gaze
        const L = s.path.length
        const a = s.anticipation
        const start = s.path.pts[0]
        const end = s.path.pts[s.path.pts.length - 1]
        if (stepT < a) {
          const w = stepT / a
          const dir = directionAt(s.path, 0)
          const back = Math.min(0.05 * L, 0.1 * layout!.bodyH) * Math.sin(Math.PI * w)
          carrot.x = start.x - dir.x * back
          carrot.y = start.y - dir.y * back
          cmd.squash = -0.85 * smoothstep(0, 0.8, w)
          cmd.leanBias = -4.5 * dir.x * smoothstep(0, 1, w)
          cmd.crestBias = -8 * dir.x * smoothstep(0, 1, w)
        } else if (stepT < a + s.duration) {
          const u = (stepT - a) / s.duration
          const pt = pointAt(s.path, profile(u, s.accelUp, s.accelDown) * L)
          const bobW = smoothstep(0.1, 0.35, u) * (1 - smoothstep(0.75, 1, u))
          carrot.x = pt.x
          carrot.y = pt.y + s.bob * bobW * Math.sin(2 * Math.PI * 0.5 * (stepT - a))
          const fade = smoothstep(0, 0.2, u) * (1 - smoothstep(0.85, 1, u))
          cmd.open = s.open * fade
          cmd.paddle = s.paddle * smoothstep(0.15, 0.35, u) * (1 - smoothstep(0.8, 0.95, u))
          cmd.squash = u < 0.12 ? 0.5 * (1 - u / 0.12) : 0
        } else {
          const w = clamp((stepT - a - s.duration) / s.settle, 0, 1)
          const dir = directionAt(s.path, L)
          const ov = s.overshoot * Math.sin(Math.PI * w) * (1 - w)
          carrot.x = end.x + dir.x * ov
          carrot.y = end.y + dir.y * ov
          cmd.squash = w < 0.18 ? -0.3 * (1 - w / 0.18) : 0
        }
        return cmd
      }

      if (step.kind === 'hold') {
        cmd.gaze = step.gaze ?? idleGaze
        const hover = step.bob * smoothstep(0, 0.8, stepT)
        carrot.y = anchor.y + hover * Math.sin(2 * Math.PI * 0.45 * stepT)
        return cmd
      }

      // jump
      omega = 7
      zeta = 0.9
      const pose = jumpPose(stepT, step.height)
      lift = pose.lift
      cmd.squash = pose.squash
      cmd.open = pose.open
      const hang = smoothstep(0.72, 0.9, stepT) * (1 - smoothstep(1.4, 1.52, stepT))
      cmd.leanBias = 2.5 * hang * Math.sin(2 * Math.PI * 0.7 * stepT)
      return cmd
    }

    // ---- the frame ------------------------------------------------------
    const frame = (now: number) => {
      raf = 0
      if (document.hidden || !layout || !parts) return
      const dt = last ? clamp((now - last) / 1000, 0, MAX_FRAME_S) : 1 / 60
      last = now
      time += dt
      if (layoutDirty) {
        layoutDirty = false
        relayout()
        if (!layout || !parts) return
      }
      const L = layout
      const P = parts
      const vref = L.viewW * 0.19
      const aref = vref * 2.6

      // Advance the step clock, then work out this frame's carrot and pose.
      if (step) {
        stepT += dt
        const total =
          step.kind === 'travel'
            ? step.anticipation + step.duration + step.settle
            : step.kind === 'hold'
              ? step.duration
              : JUMP_SECONDS
        if (stepT >= total) {
          if (step.kind === 'jump') lift = 0
          finishStep()
        }
      }
      if (!step || step.kind !== 'jump') lift = 0
      const cmd = drive()

      // Body: a damped spring chasing the carrot.
      let ax = 0
      let ay = 0
      const n = Math.max(1, Math.ceil(dt / (1 / 120)))
      const h = dt / n
      for (let i = 0; i < n; i++) {
        ax = omega * omega * (carrot.x - p.x) - 2 * zeta * omega * v.x
        ay = omega * omega * (carrot.y - p.y) - 2 * zeta * omega * v.y
        v.x += ax * h
        v.y += ay * h
        p.x += v.x * h
        p.y += v.y * h
      }
      // Safety net only: planned routes stay inside the bounds.
      const b = L.bounds
      if (p.x < b.left) { p.x = b.left; if (v.x < 0) v.x *= -0.1 }
      if (p.x > b.right) { p.x = b.right; if (v.x > 0) v.x *= -0.1 }
      if (p.y < b.top) { p.y = b.top; if (v.y < 0) v.y *= -0.1 }
      if (p.y > b.bottom) { p.y = b.bottom; if (v.y > 0) v.y *= -0.1 }

      // A jump's lift counts as motion for the rig (crest and arms feel it).
      const newLiftV = (lift - liftOld) / dt
      liftA = approach(liftA, clamp((newLiftV - liftV) / dt, -aref * 3, aref * 3), 0.03, dt)
      liftV = newLiftV
      liftOld = lift

      const shown: Vec = { x: p.x, y: p.y - lift }
      const rv: Vec = { x: v.x, y: v.y - liftV }
      const ra: Vec = { x: ax, y: ay - liftA }
      const speed = Math.hypot(rv.x, rv.y)

      const out = stepRig(rig, {
        dt,
        time,
        pos: shown,
        vel: rv,
        acc: ra,
        vref,
        aref,
        gazeRange: 0.35 * L.viewW,
        cmd,
      })

      // ---- environment ----
      const nearScatter = time < scatterUntil
      const fliesActive = stepFireflies(
        L.fireflies,
        flies,
        {
          omid: shown,
          speed: nearScatter ? Math.max(speed, 0.6 * vref) : speed,
          bodyW: L.bodyW,
          bodyH: L.bodyH,
          gather: gatherActive,
          range: 0.45 * L.viewW,
          vref,
          time,
        },
        dt,
      )
      stepSpring(flare, time < flareUntil ? 1 : 0, 7, 0.55, dt)

      // A faint trail along big moves.
      trailClock += dt
      const big = step?.kind === 'travel' && (step.style !== 'float' || step.path.length > 0.3 * L.viewW)
      if (big && out.travel > 0.5 && speed > 0.42 * vref && trailClock > 0.07) {
        trailClock = 0
        const dot = trail.reduce((o, d) => (d.age > o.age ? d : o), trail[0])
        dot.age = 0
        dot.x = shown.x - rv.x * 0.05
        dot.y = shown.y - rv.y * 0.05
      }
      let trailActive = false
      for (let i = 0; i < trail.length; i++) {
        const d = trail[i]
        d.age += dt
        const el = P.trail[i]
        if (!el) continue
        if (d.age < TRAIL_LIFE) {
          trailActive = true
          const f = 1 - d.age / TRAIL_LIFE
          put(el, 'translate', `${f2(d.x)}px ${f2(d.y)}px`)
          put(el, 'scale', f2(0.55 + 0.45 * f))
          put(el, 'opacity', f2(0.5 * f * f))
        } else {
          put(el, 'opacity', '0')
        }
      }

      // Ground under him: where the warm light pool lands.
      const art = L.art
      const feetX = art.omid.x + p.x / L.k
      const feetY = art.omid.feet + p.y / L.k
      const groundY = groundBelow(art, feetX, feetY)
      const poolDy = (groundY - art.omid.feet) * L.k
      const height = Math.max(0, (groundY - feetY) * L.k) + Math.max(0, lift)
      const poolW = 1 + 0.5 * clamp(height / L.bodyH, 0, 2)
      put(P.pool, 'translate', `${f2(p.x)}px ${f2(poolDy)}px`)
      put(P.pool, 'scale', f2(poolW))
      put(P.pool, 'opacity', f2(0.9 * Math.exp(-height / (1.2 * L.bodyH))))

      // Slight parallax: the far hills and the foreground drift opposite to him.
      camX = approach(camX, clamp(p.x * 0.03, -0.012 * L.viewW, 0.012 * L.viewW), 0.4, dt)
      put(P.far, 'transform', `translate3d(${f2(-0.35 * camX)}px,0,0)`)
      put(P.ground, 'transform', `translate3d(${f2(-camX)}px,0,0)`)
      put(P.near, 'transform', `translate3d(${f2(-camX)}px,0,0)`)

      // ---- write the rig ----
      put(P.body, 'transform', `translate3d(${f2(shown.x)}px,${f2(shown.y)}px,0)`)
      put(P.action, 'transform', `rotate(${f2(out.lean)}deg) scale(${out.sx.toFixed(3)},${out.sy.toFixed(3)})`)
      put(P.crest, 'transform', `rotate(${f2(out.crest)}deg) scale(1,${out.crestScale.toFixed(3)})`)
      // Arms swell as they open, and the feet spread, so the star pose reads.
      const openL = 1 + 0.5 * clamp(out.armL / 80, 0, 1)
      const openR = 1 + 0.5 * clamp(out.armR / 80, 0, 1)
      put(P.armL, 'transform', `rotate(${f2(out.armL)}deg) scale(${f2(openL)})`)
      put(P.armR, 'transform', `rotate(${f2(-out.armR)}deg) scale(${f2(openR)})`)
      put(P.feet, 'transform', `scale(${f2(1 + 0.35 * clamp((out.armL + out.armR) / 160, 0, 1))},1)`)
      put(P.halo, 'translate', `${f2(out.haloX)}px ${f2(out.haloY)}px`)
      put(P.halo, 'scale', out.haloScale.toFixed(3))
      put(P.gaze, 'transform', `translate(${f2(out.gazeX * 4)}px,${f2(out.gazeY * 3)}px)`)
      for (let i = 0; i < P.flies.length; i++) {
        const s = flies[i]
        put(P.flies[i], 'transform', `translate3d(${f2(s.x.x)}px,${f2(s.y.x)}px,0) scale(${f2(1 + 0.4 * s.glow)})`)
      }
      put(P.flare, 'opacity', f2(clamp(flare.x, 0, 1) * 0.9))

      // ---- sleep or continue ----
      const bodyActive =
        Math.hypot(v.x, v.y) > 0.3 || Math.abs(carrot.x - p.x) > 0.3 || Math.abs(carrot.y - p.y) > 0.3
      const stepRunning = step !== null && step.kind !== 'hold'
      const busy =
        stepRunning ||
        bodyActive ||
        rig.active ||
        fliesActive ||
        trailActive ||
        gatherActive ||
        time < scatterUntil ||
        Math.abs(flare.x) > 0.01 ||
        Math.abs(flare.v) > 0.01 ||
        (step?.kind === 'hold' && step.bob > 0)
      if (busy) {
        raf = requestAnimationFrame(frame)
        return
      }
      // Nothing is moving: sleep. A hold in progress ends by a timer.
      last = 0
      sleptAt = performance.now()
      P.body.style.willChange = ''
      if (step?.kind === 'hold') {
        const remaining = Math.max(0, step.duration - stepT)
        window.clearTimeout(holdTimer)
        holdTimer = window.setTimeout(wake, remaining * 1000 + 10)
      }
    }
    const wake = () => {
      if (raf || document.hidden) return
      if (sleptAt && step?.kind === 'hold') {
        stepT += (performance.now() - sleptAt) / 1000
      }
      sleptAt = 0
      last = 0
      if (parts) parts.body.style.willChange = 'transform'
      raf = requestAnimationFrame(frame)
    }

    // ---- relayout, idle life, visibility --------------------------------
    const resetToLookout = () => {
      p.x = p.y = v.x = v.y = 0
      anchor.x = anchor.y = 0
      lift = liftOld = liftV = liftA = 0
      drag = null
      scene.removeAttribute('data-dragging')
      plan = null
      delete scene.dataset.behaviour
      step = null
      stepIndex = 0
      gatherActive = false
      camX = 0
    }

    const relayout = () => {
      const next = measureLayout(scene)
      const nextParts = next && findParts(scene, next)
      if (!next || !nextParts) return
      const changed = !layout || next.art.id !== layout.art.id || Math.abs(next.k - layout.k) > 0.001
      layout = next
      parts = nextParts
      if (changed) {
        flies = createFireflyStates(next.fireflies.length)
        resetToLookout()
        window.clearTimeout(nextTimer)
        scheduleNext(2, 4)
      }
    }

    const idleLook = () => {
      const L = layout
      if (L && !document.hidden) {
        const spots = [
          L.places.horizon,
          L.places.lamp,
          L.places.meadowCentre,
          { x: p.x + (random() - 0.5) * L.viewW * 0.5, y: p.y - 0.3 * L.viewH * random() },
        ]
        idleGaze = spots[Math.floor(random() * spots.length)]
        if (random() < 0.4) fidget(rig, random, 0.8)
        wake()
      }
      idleTimer = window.setTimeout(idleLook, (2.6 + 2 * random()) * 1000)
    }

    const onResize = () => {
      layoutDirty = true
      if (!raf) {
        // Nothing is running: apply it now.
        layoutDirty = false
        relayout()
        wake()
      }
    }
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
        window.clearTimeout(nextTimer)
        window.clearTimeout(idleTimer)
        window.clearTimeout(holdTimer)
        if (sleptAt === 0) sleptAt = performance.now()
        if (parts) parts.body.style.willChange = ''
      } else {
        layoutDirty = true
        if (!plan) scheduleNext(1.5, 3)
        idleTimer = window.setTimeout(idleLook, 2500)
        wake()
      }
    }

    // Starts a named behaviour right now (tests, the console, the cassette, a tap).
    const runBehaviour = (name: Behaviour) => {
      if (!layout) return
      layout.obstacles = measureObstacles(layout)
      const next = planBehaviour(name, context())
      if (next) {
        window.clearTimeout(nextTimer)
        startPlan(next)
      }
    }
    // Nothing else moves him while he is held.
    const onBehave = (event: Event) => {
      if (!drag?.moved) runBehaviour((event as CustomEvent<Behaviour>).detail)
    }

    // ---- touch, pointer and mouse ---------------------------------------
    // Only the pointer's position is stored per move; the frame loop does the rest.
    const grabbed = (event: PointerEvent) => {
      const b = layout!.bounds
      return {
        x: clamp(event.clientX - layout!.c0.x - drag!.gx, b.left, b.right),
        y: clamp(event.clientY - layout!.c0.y - drag!.gy, b.top, b.bottom),
      }
    }
    const onDown = (event: PointerEvent) => {
      if (!layout || drag || (event.pointerType === 'mouse' && event.button !== 0)) return
      event.preventDefault()
      parts?.body.setPointerCapture(event.pointerId)
      drag = {
        id: event.pointerId,
        sx: event.clientX,
        sy: event.clientY,
        gx: event.clientX - layout.c0.x - p.x,
        gy: event.clientY - layout.c0.y - (p.y - lift),
        moved: false,
        x: p.x,
        y: p.y,
      }
    }
    const onMove = (event: PointerEvent) => {
      if (!layout || !drag || event.pointerId !== drag.id) return
      if (!drag.moved) {
        if (Math.hypot(event.clientX - drag.sx, event.clientY - drag.sy) < TAP_SLOP) return
        // Picked up: the director steps aside, keeping him where he is (a jump's lift
        // becomes his position, so nothing pops).
        drag.moved = true
        window.clearTimeout(nextTimer)
        window.clearTimeout(holdTimer)
        plan = null
        step = null
        p.y -= lift
        lift = liftOld = liftV = liftA = 0
        gatherActive = false
        delete scene.dataset.behaviour
        scene.setAttribute('data-dragging', '')
      }
      const to = grabbed(event)
      drag.x = to.x
      drag.y = to.y
      wake()
    }
    const onUp = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return
      const held = drag
      if (held.moved) {
        // Dropped: he settles here, and the director resumes after a calm pause.
        anchor.x = held.x
        anchor.y = held.y
        scene.removeAttribute('data-dragging')
        drag = null
        scheduleNext(DROP_CALM[0], DROP_CALM[1])
        wake()
      } else {
        drag = null
        if (event.type === 'pointerup') runBehaviour('jump')
      }
    }
    const swallow = (event: Event) => event.stopPropagation()
    const grip = parts.body
    scene.setAttribute('data-omid-touch', '')
    grip.addEventListener('pointerdown', onDown)
    grip.addEventListener('pointermove', onMove)
    grip.addEventListener('pointerup', onUp)
    grip.addEventListener('pointercancel', onUp)
    grip.addEventListener('click', swallow)

    ;(window as unknown as Record<string, unknown>).__omidLayout = () => ({ layout, p })
    const observer = new ResizeObserver(onResize)
    observer.observe(scene)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('omid-behave', onBehave)
    if (!document.hidden) {
      scheduleNext(3.5, 5.5)
      idleTimer = window.setTimeout(idleLook, 2500)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(nextTimer)
      window.clearTimeout(idleTimer)
      window.clearTimeout(holdTimer)
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('omid-behave', onBehave)
      grip.removeEventListener('pointerdown', onDown)
      grip.removeEventListener('pointermove', onMove)
      grip.removeEventListener('pointerup', onUp)
      grip.removeEventListener('pointercancel', onUp)
      grip.removeEventListener('click', swallow)
      scene.removeAttribute('data-omid-touch')
      scene.removeAttribute('data-dragging')
      // Back to the resting composition.
      if (parts) {
        const clear = (el: Element, ...props: string[]) =>
          props.forEach((prop) => (el as HTMLElement).style.removeProperty(prop))
        clear(parts.body, 'transform', 'will-change')
        clear(parts.action, 'transform')
        clear(parts.halo, 'translate', 'scale')
        clear(parts.crest, 'transform')
        clear(parts.armL, 'transform')
        clear(parts.armR, 'transform')
        clear(parts.feet, 'transform')
        clear(parts.gaze, 'transform')
        clear(parts.pool, 'translate', 'scale', 'opacity')
        clear(parts.far, 'transform')
        clear(parts.ground, 'transform')
        clear(parts.near, 'transform')
        clear(parts.flare, 'opacity')
        parts.trail.forEach((el) => clear(el, 'translate', 'scale', 'opacity'))
        parts.flies.forEach((el) => clear(el, 'transform'))
      }
    }
  }, [sceneRef, reduced])
}
