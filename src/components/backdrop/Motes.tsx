import { memo } from 'react'
import type { CSSProperties } from 'react'
import { createRandom } from './random'

const MOTE_COUNT = 12

const MOTES = (() => {
  const random = createRandom(2027)
  return Array.from({ length: MOTE_COUNT }, () => ({
    left: 3 + random() * 94,
    size: 2 + random() * 3,
    opacity: 0.3 + random() * 0.4,
    dx: (random() - 0.5) * 12,
    duration: 38 + random() * 34,
    delay: random() * -70,
  }))
})()

// Tiny warm particles drifting upward. They start at opacity 0 and only become
// visible through the rise animation, so reduced motion simply hides them.
function Motes() {
  return (
    <>
      {MOTES.map((mote, index) => (
        <span
          key={index}
          className="animate-rise absolute bottom-0 rounded-full bg-accent opacity-0"
          style={
            {
              left: `${mote.left}%`,
              width: `${mote.size}px`,
              height: `${mote.size}px`,
              animationDelay: `${mote.delay}s`,
              '--mote-opacity': mote.opacity,
              '--mote-dx': `${mote.dx}vmin`,
              '--mote-duration': `${mote.duration}s`,
            } as CSSProperties
          }
        />
      ))}
    </>
  )
}

export default memo(Motes)
