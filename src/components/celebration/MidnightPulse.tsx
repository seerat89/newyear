import { memo, useState } from 'react'
import type { CSSProperties } from 'react'
import { EchoLight } from './Burst'
import { isMajor, SHOW } from './showScript'
import { useWithin } from './useWithin'

// What the opening show does to the world in front of the sky: it sits above the
// city and the water (and blends with them) so it can light them. A pulse of warm
// white runs out across the skyline and its reflections at midnight (and swells
// again on wide screens as the crescendo builds), each major firework throws a
// wash of its own colour on the buildings and a rippled column on the bay, and
// sparks and light streaks drift past in the foreground. Same late-join offset as
// MidnightShow, and it drops out of the page when it has played. Transform and
// opacity only.

const major = SHOW.filter(isMajor)

// Foreground sparks: x (% of width), y (% of height), size px, seconds, wide screens only.
const EMBERS: [number, number, number, number, boolean][] = [
  [7, 78, 3, 11, false], [15, 64, 2, 13, false], [24, 88, 4, 10, false], [33, 70, 2, 14, false],
  [41, 82, 3, 12, false], [52, 91, 2, 9, false], [61, 74, 4, 13, false], [69, 86, 2, 11, false],
  [77, 68, 3, 14, false], [85, 80, 4, 10, false], [93, 72, 2, 12, false], [47, 60, 2, 15, false],
  [3, 58, 3, 12, true], [11, 90, 5, 9, true], [19, 72, 3, 13, true], [28, 62, 4, 11, true],
  [37, 93, 3, 10, true], [44, 76, 5, 12, true], [56, 66, 3, 14, true], [64, 94, 4, 9, true],
  [72, 60, 3, 11, true], [81, 90, 5, 13, true], [89, 64, 3, 10, true], [96, 84, 4, 12, true],
  [22, 54, 2, 15, true], [58, 52, 2, 14, true], [75, 74, 2, 16, true], [9, 70, 2, 13, true],
]
const STREAKS = [
  { t: 1.4, top: '58%', tv: false },
  { t: 2.6, top: '74%', tv: false },
  { t: 4.8, top: '66%', tv: false },
  { t: 6.4, top: '82%', tv: false },
  { t: 3.4, top: '50%', tv: true },
  { t: 5.6, top: '88%', tv: true },
  { t: 7.2, top: '60%', tv: true },
  { t: 8.6, top: '78%', tv: true },
  { t: 9.8, top: '54%', tv: true },
]
// Extra swells of the skyline pulse as the crescendo builds (wide screens).
const SWELLS = [3.6, 6.6, 10.2]

function MidnightPulse({ startedAt }: { startedAt: number }) {
  const [sinceMidnight] = useState(() => Math.max(0, (Date.now() - startedAt) / 1000))
  const offset = (t: number) => `${(t - sinceMidnight).toFixed(2)}s`
  if (!useWithin(startedAt, 62_000)) return null

  return (
    <div className="scene-afterglow">
      <div className="pulse-wave" style={{ '--show-delay': offset(0.1) } as CSSProperties} />
      {SWELLS.map((t) => (
        <div key={t} className="pulse-wave pulse-swell" data-tv="" style={{ '--show-delay': offset(t) } as CSSProperties} />
      ))}
      <div className="pulse-sweep" style={{ '--show-delay': offset(0.2) } as CSSProperties} />
      <div className="water-glow" data-tv="" style={{ '--show-delay': offset(0.6) } as CSSProperties} />
      {major.map((b, i) => (
        <EchoLight key={i} burst={b} delay={offset(b.t + 0.55)} />
      ))}
      <div className="embers" style={{ '--show-delay': offset(0) } as CSSProperties}>
        {EMBERS.map(([x, y, size, dur, tv], i) => (
          <span
            key={i}
            data-tv={tv ? '' : undefined}
            style={
              {
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                '--dur': `${dur}s`,
                '--dx': `${(i % 2 ? 1 : -1) * (14 + (i % 4) * 8)}px`,
                '--d': `${-i * 1.7}s`,
              } as CSSProperties
            }
          />
        ))}
        {STREAKS.map((s, i) => (
          <i key={i} data-tv={s.tv ? '' : undefined} style={{ top: s.top, '--streak-delay': offset(s.t) } as CSSProperties} />
        ))}
      </div>
    </div>
  )
}

export default memo(MidnightPulse)
