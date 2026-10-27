import { memo } from 'react'
import type { CSSProperties } from 'react'
import { createRandom } from './ridge'

// A static field of stars that thins out towards the horizon: dense and a little
// brighter high in the sky, rare near the glow. Three size tiers give depth
// (small and dim far away, larger and brighter near). The second half is hidden
// on phones so the small screen stays calm. Positions are fractions of the
// distance from the top of the screen to the horizon (--horizon-y).

type Star = { x: number; f: number; size: number; alpha: number; tier: 'a' | 'b' }

const random = createRandom(20271)
const STARS: Star[] = Array.from({ length: 150 }, (_, i) => {
  // Bias towards the top: fraction of the way down to the horizon.
  const f = 1 - Math.pow(random(), 0.55)
  const depth = random()
  return {
    x: random() * 100,
    f: Math.min(0.97, f),
    size: depth < 0.6 ? 1.4 : depth < 0.9 ? 2 : 2.8,
    alpha: (depth < 0.6 ? 0.4 : depth < 0.9 ? 0.65 : 0.9) * (1 - 0.7 * f),
    tier: i < 75 ? 'a' : 'b',
  }
})

function Stars() {
  return (
    <div className="scene-stars">
      {STARS.map((s, i) => (
        <span
          key={i}
          data-tier={s.tier}
          style={{
            left: `${s.x}%`,
            top: `calc(var(--horizon-y) * ${s.f.toFixed(3)})`,
            width: `calc(${s.size}px * var(--star-scale))`,
            height: `calc(${s.size}px * var(--star-scale))`,
            opacity: s.alpha,
            '--a': s.alpha,
          } as CSSProperties}
        />
      ))}
    </div>
  )
}

export default memo(Stars)
