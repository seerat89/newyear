import { memo } from 'react'
import type { CSSProperties } from 'react'

type Star = {
  x: number
  y: number
  r: number
  /** Static opacity; also the resting value when animation is disabled. */
  opacity: number
  /** Only a few stars twinkle; the rest stay static. */
  twinkle: { min: number; max: number; duration: number; delay: number } | null
}

const STAR_COUNT = 56
const TWINKLE_EVERY = 4

// Small seeded generator so the star field is identical on every render.
function createRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const STARS: Star[] = (() => {
  const random = createRandom(2027)
  return Array.from({ length: STAR_COUNT }, (_, index) => {
    const min = 0.25 + random() * 0.15
    const max = 0.65 + random() * 0.3
    const x = random() * 100
    const y = random() * 100
    const r = 0.06 + random() * 0.14
    const duration = 6 + random() * 8
    const delay = random() * -14
    return {
      x,
      y,
      r,
      opacity: (min + max) / 2,
      twinkle:
        index % TWINKLE_EVERY === 0 ? { min, max, duration, delay } : null,
    }
  })
})()

// The page background lives on <html> (index.css); this layer paints above it
// with a positive z-index and the content sits above this layer.
function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,var(--color-midnight-800),var(--color-midnight-900)_45%,var(--color-midnight-950))]"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        {STARS.map((star, index) => (
          <circle
            key={index}
            cx={star.x}
            cy={star.y}
            r={star.r}
            opacity={star.opacity}
            className={
              star.twinkle ? 'animate-twinkle fill-ink' : 'fill-ink'
            }
            style={
              star.twinkle
                ? ({
                    '--star-min': star.twinkle.min,
                    '--star-max': star.twinkle.max,
                    '--twinkle-duration': `${star.twinkle.duration}s`,
                    animationDelay: `${star.twinkle.delay}s`,
                  } as CSSProperties)
                : undefined
            }
          />
        ))}
      </svg>

      {/* Soft gold glow: a plain radial gradient, no blur filter */}
      <div className="animate-float absolute top-[4%] left-[2%] h-[50vmin] w-[50vmin] rounded-full bg-[radial-gradient(circle,rgb(217_180_95/0.14),transparent_65%)]" />

      {/* Crescent moon */}
      <svg
        className="animate-drift absolute top-[10%] right-[8%] h-[14vmin] w-[14vmin] min-h-16 min-w-16 text-gold-300/70"
        viewBox="0 0 100 100"
      >
        <path
          fill="currentColor"
          d="M62 8a42 42 0 1 0 30 70A34 34 0 0 1 62 8z"
        />
      </svg>
    </div>
  )
}

export default memo(Backdrop)
