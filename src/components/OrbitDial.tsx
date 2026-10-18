import { memo, useLayoutEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import type { TimeRemaining } from '../lib/countdown'

const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

const CENTER = 50

// If a bead's animation and the real countdown disagree by more than this
// (tab slept, clock changed), the animation is re-aligned to the countdown.
const DRIFT_MS = 300

type Ring = {
  key: 'hours' | 'minutes' | 'seconds'
  radius: number
  ticks: number
  periodMs: number
  /** Bead diameter in cqw (percent of dial width). */
  bead: number
}

// Outer to inner. Each bead completes one lap per period of its unit and
// sits at the top whenever that unit is at zero.
const RINGS: Ring[] = [
  { key: 'hours', radius: 49, ticks: 24, periodMs: DAY_MS, bead: 1.9 },
  { key: 'minutes', radius: 46, ticks: 60, periodMs: HOUR_MS, bead: 1.7 },
  { key: 'seconds', radius: 43, ticks: 60, periodMs: MINUTE_MS, bead: 1.5 },
]

/** Clockwise rotation in degrees for a bead, from the milliseconds left. */
function getBeadAngle(totalMs: number, periodMs: number): number {
  return -(totalMs / periodMs) * 360
}

/** Fraction (0..1) of the current lap already travelled. */
function getLapProgress(totalMs: number, periodMs: number): number {
  const left = (totalMs % periodMs) / periodMs
  return left === 0 ? 0 : 1 - left
}

// Hairline plus tick marks per ring. Static, so memoised.
const DialRings = memo(function DialRings() {
  return (
    <>
      {RINGS.map(({ key, radius, ticks }) => {
        const circumference = 2 * Math.PI * radius
        const tick = 0.16
        return (
          <g key={key} fill="none" className="stroke-accent">
            <circle
              cx={CENTER}
              cy={CENTER}
              r={radius}
              strokeWidth={0.12}
              opacity={0.28}
            />
            <circle
              cx={CENTER}
              cy={CENTER}
              r={radius}
              strokeWidth={key === 'hours' ? 1.6 : 1.1}
              strokeDasharray={`${tick} ${circumference / ticks - tick}`}
              strokeDashoffset={tick / 2}
              opacity={0.34}
            />
          </g>
        )
      })}
    </>
  )
})

const mod = (value: number, divisor: number) =>
  ((value % divisor) + divisor) % divisor

// Beads are plain HTML layers rotated by a CSS animation, so the browser's
// compositor moves them without depending on the clock tick or the main
// thread. Each animation is phase-aligned to the countdown before first paint
// and nudged back only if it drifts (tab slept, clock changed); the effect
// below synchronises those external animations with the countdown. Reduced
// motion gets a static, always-correct angle instead.
function OrbitBeads({ totalMs }: { totalMs: number }) {
  const reduceMotion = useReducedMotion()
  const layers = useRef<Partial<Record<Ring['key'], HTMLDivElement | null>>>({})

  useLayoutEffect(() => {
    if (reduceMotion) return
    for (const { key, periodMs } of RINGS) {
      const animation = layers.current[key]?.getAnimations()[0]
      if (!animation) continue
      const target = getLapProgress(totalMs, periodMs) * periodMs
      const current = mod(Number(animation.currentTime ?? 0), periodMs)
      const drift = mod(target - current + periodMs / 2, periodMs) - periodMs / 2
      if (Math.abs(drift) > DRIFT_MS) animation.currentTime = target
    }
  }, [totalMs, reduceMotion])

  return (
    <>
      {RINGS.map(({ key, radius, periodMs, bead }) => {
        const layerStyle: CSSProperties = reduceMotion
          ? { transform: `rotate(${getBeadAngle(totalMs, periodMs)}deg)` }
          : { animationDuration: `${periodMs / SECOND_MS}s` }
        return (
          <div
            key={key}
            ref={(element) => {
              layers.current[key] = element
            }}
            className={`absolute inset-0 ${reduceMotion ? '' : 'animate-orbit will-change-transform'}`}
            style={layerStyle}
          >
            <span
              className="absolute left-1/2 rounded-full bg-accent"
              style={{
                top: `${CENTER - radius}%`,
                width: `${bead}cqw`,
                height: `${bead}cqw`,
                transform: 'translate(-50%, -50%)',
                boxShadow:
                  '0 0 0 0.5cqw rgb(var(--theme-glow) / 0.25), 0 0 0 1.2cqw rgb(var(--theme-glow) / 0.1)',
              }}
            />
          </div>
        )
      })}
    </>
  )
}

type OrbitDialProps = {
  remaining: TimeRemaining
  children: ReactNode
}

// Square, container-query sized dial: the children are centred inside the
// rings and can size themselves in cqw units relative to the dial.
function OrbitDial({ remaining, children }: OrbitDialProps) {
  return (
    <div className="@container relative aspect-square w-[min(100%,calc(100svh-6rem))]">
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
      >
        <DialRings />
      </svg>
      <div aria-hidden="true" className="absolute inset-0 overflow-clip">
        <OrbitBeads totalMs={remaining.totalMs} />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4cqw]">
        {children}
      </div>
    </div>
  )
}

export default OrbitDial
