import { memo } from 'react'
import type { CSSProperties } from 'react'

// A few far-away New Year bursts in the open sky beside the countdown: a spark
// rises, opens into a faint ring of rays, and fades. Each one is two elements
// animated with transform and opacity only, once every 12-20 s, staggered so at
// most one is ever visible at a time. They sit at the sides, never behind the
// numbers, and are hidden under reduced motion (see index.css).
// x is a percentage of the width, y a fraction of the way down to the horizon.

const BURSTS = [
  { x: 9, y: 0.62, size: 1, hue: 'gold', delay: 2, cycle: 15 },
  { x: 90, y: 0.5, size: 0.8, hue: 'blue', delay: 8, cycle: 17 },
  { x: 19, y: 0.34, size: 0.65, hue: 'rose', delay: 13, cycle: 19, wide: true },
  { x: 82, y: 0.68, size: 0.9, hue: 'gold', delay: 18, cycle: 16, wide: true },
]

function Fireworks() {
  return (
    <div className="scene-fireworks">
      {BURSTS.map((b, i) => (
        <div
          key={i}
          className="fw"
          data-hue={b.hue}
          data-wide={b.wide ? '' : undefined}
          style={
            {
              left: `${b.x}%`,
              top: `calc(var(--horizon-y) * ${b.y})`,
              '--fw-scale': b.size,
              '--fw-cycle': `${b.cycle}s`,
              '--fw-delay': `${b.delay}s`,
            } as CSSProperties
          }
        >
          <span className="fw-rise" />
          <span className="fw-burst" />
        </div>
      ))}
    </div>
  )
}

export default memo(Fireworks)
