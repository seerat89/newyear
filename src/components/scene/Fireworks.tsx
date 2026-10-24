import { memo } from 'react'
import type { CSSProperties } from 'react'

// A few far-away New Year bursts in the open sky beside the countdown, each in
// its own style (ring, peony, double ring, willow, glitter, comet): a spark
// rises, opens, and fades. Each one is two elements
// animated with transform and opacity only, once every 12-20 s, staggered so at
// most one or two are ever visible at a time. They sit at the sides, never behind the
// numbers, and are hidden under reduced motion (see index.css).
// x is a percentage of the width, y a fraction of the way down to the horizon.

const BURSTS = [
  { x: 9, y: 0.62, size: 1, hue: 'gold', style: 'ring', delay: 2, cycle: 15 },
  { x: 90, y: 0.5, size: 0.8, hue: 'blue', style: 'peony', delay: 8, cycle: 17 },
  { x: 19, y: 0.34, size: 0.7, hue: 'violet', style: 'double', delay: 13, cycle: 19, wide: true },
  { x: 82, y: 0.68, size: 0.95, hue: 'gold', style: 'willow', delay: 18, cycle: 16, wide: true },
  { x: 30, y: 0.78, size: 0.6, hue: 'silver', style: 'glitter', delay: 23, cycle: 21, wide: true },
  { x: 93, y: 0.78, size: 0.7, hue: 'gold', style: 'comet', delay: 28, cycle: 23, wide: true },
]

function Fireworks() {
  return (
    <div className="scene-fireworks">
      {BURSTS.map((b, i) => (
        <div
          key={i}
          className="fw"
          data-hue={b.hue}
          data-style={b.style}
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
          <span className="fw-flash" />
          <span className="fw-burst" />
        </div>
      ))}
    </div>
  )
}

export default memo(Fireworks)
