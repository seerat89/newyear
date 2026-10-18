import { memo } from 'react'
import type { CSSProperties } from 'react'
import { createRandom } from './random'

type Layer = {
  seed: number
  count: number
  radius: [number, number]
  opacity: [number, number]
  /**
   * Twinkling stars are tiny HTML elements (opacity is composited on the GPU);
   * non-twinkling layers are one static SVG that never repaints.
   */
  twinkle: boolean
  /** Parallax drift of the whole layer; nearer layers move further. */
  drift: { x: string; y: string; duration: string }
}

const LAYERS: Layer[] = [
  {
    seed: 11,
    count: 60,
    radius: [0.05, 0.1],
    opacity: [0.3, 0.55],
    twinkle: false,
    drift: { x: '-1.5vmin', y: '0.8vmin', duration: '240s' },
  },
  {
    seed: 23,
    count: 26,
    radius: [0.09, 0.16],
    opacity: [0.45, 0.75],
    twinkle: false,
    drift: { x: '-3vmin', y: '1.6vmin', duration: '180s' },
  },
  {
    seed: 37,
    count: 10,
    radius: [0.16, 0.26],
    opacity: [0.6, 0.9],
    twinkle: true,
    drift: { x: '-6vmin', y: '3vmin', duration: '130s' },
  },
]

type Star = {
  x: number
  y: number
  r: number
  opacity: number
  twinkle: { min: number; max: number; duration: number; delay: number } | null
}

function createStars(layer: Layer): Star[] {
  const random = createRandom(layer.seed)
  const between = ([min, max]: [number, number]) => min + random() * (max - min)

  return Array.from({ length: layer.count }, () => {
    const opacity = between(layer.opacity)
    return {
      x: random() * 100,
      y: random() * 100,
      r: between(layer.radius),
      opacity,
      twinkle: layer.twinkle
        ? {
            min: opacity * 0.4,
            max: opacity,
            duration: 6 + random() * 8,
            delay: random() * -14,
          }
        : null,
    }
  })
}

const STAR_LAYERS = LAYERS.map((layer) => ({ layer, stars: createStars(layer) }))

function layerStyle(layer: Layer): CSSProperties {
  return {
    '--px': layer.drift.x,
    '--py': layer.drift.y,
    '--parallax-duration': layer.drift.duration,
  } as CSSProperties
}

// Three depth layers; each drifts as a single element (parallax) so the cost
// is three transform animations, not one per star. Nothing here repaints.
function StarField() {
  return (
    <>
      {STAR_LAYERS.map(({ layer, stars }) =>
        layer.twinkle ? (
          <div
            key={layer.seed}
            className="animate-parallax absolute -inset-[8vmin]"
            style={layerStyle(layer)}
          >
            {stars.map((star, index) => (
              <span
                key={index}
                className="animate-twinkle absolute rounded-full bg-ink"
                style={
                  {
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: `${star.r * 2}vmax`,
                    height: `${star.r * 2}vmax`,
                    opacity: star.opacity,
                    '--star-min': star.twinkle?.min,
                    '--star-max': star.twinkle?.max,
                    '--twinkle-duration': `${star.twinkle?.duration}s`,
                    animationDelay: `${star.twinkle?.delay}s`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        ) : (
          <svg
            key={layer.seed}
            className="animate-parallax absolute -inset-[8vmin]"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid slice"
            style={layerStyle(layer)}
          >
            {stars.map((star, index) => (
              <circle
                key={index}
                cx={star.x}
                cy={star.y}
                r={star.r}
                opacity={star.opacity}
                className="fill-ink"
              />
            ))}
          </svg>
        ),
      )}
    </>
  )
}

export default memo(StarField)
