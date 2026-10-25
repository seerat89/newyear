import type { CSSProperties } from 'react'
import { isFar } from './showScript'
import type { Burst } from './showScript'

// The two pieces of markup every firework is made of, shared by the opening show,
// the sustained display and the light they throw on the city (the styles are in
// index.css: the burst itself, and the `echo` washes the buildings and ripples
// the bay).

/** One burst in the sky, played once, starting `delay` from now (a CSS time). */
export function FireworkBurst({ burst: b, delay }: { burst: Burst; delay: string }) {
  return (
    <div
      className="fw fw-once"
      data-hue={b.hue}
      data-style={b.style}
      data-wide={b.wide ? '' : undefined}
      data-tv={b.tv ? '' : undefined}
      data-far={isFar(b) ? '' : undefined}
      style={
        {
          left: `${b.x}%`,
          top: `calc(var(--horizon-y) * ${b.y})`,
          '--fw-scale': b.size,
          '--fw-cycle': '11s',
          '--fw-delay': delay,
        } as CSSProperties
      }
    >
      <span className="fw-rise" />
      <span className="fw-flash" />
      <span className="fw-burst" />
      <span className="fw-burst fw-burst-b" />
    </div>
  )
}

/** The light of one burst on the buildings and the water, timed to its opening. */
export function EchoLight({ burst: b, delay }: { burst: Burst; delay: string }) {
  return (
    <div
      className="echo"
      data-hue={b.hue}
      data-wide={b.wide ? '' : undefined}
      data-tv={b.tv ? '' : undefined}
      style={
        {
          left: `${b.x}%`,
          '--echo': Math.min(1, 0.45 + b.size * 0.25),
          '--echo-scale': b.size,
          '--echo-delay': delay,
        } as CSSProperties
      }
    />
  )
}
