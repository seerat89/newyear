import { memo } from 'react'
import { EchoLight, FireworkBurst } from './Burst'
import type { LiveBurst } from './useSustainedBursts'

// The long display, in two places: the bursts themselves behind the city
// (`SustainedSky`), and the light the larger ones throw on the buildings and the
// water, in front of the art (`SustainedGlow`). Each burst starts at once; the
// list is kept short by useSustainedBursts.

export const SustainedSky = memo(function SustainedSky({ live }: { live: LiveBurst[] }) {
  return (
    <div className="scene-show">
      {live.map(({ id, burst }) => (
        <FireworkBurst key={id} burst={burst} delay="0s" />
      ))}
    </div>
  )
})

export const SustainedGlow = memo(function SustainedGlow({ live }: { live: LiveBurst[] }) {
  return (
    <div className="scene-afterglow">
      {live
        .filter(({ burst }) => burst.size >= 0.9)
        .map(({ id, burst }) => (
          <EchoLight key={id} burst={burst} delay="0.6s" />
        ))}
    </div>
  )
})
