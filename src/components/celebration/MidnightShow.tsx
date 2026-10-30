import { memo } from 'react'
import type { CSSProperties } from 'react'
import { FireworkBurst } from './Burst'
import { SHOW } from './showScript'
import { useOnTheDot } from './useOnTheDot'
import { useWithin } from './useWithin'

// The opening fireworks in the sky: a warm flash, a bloom of light on the
// horizon, and the composed show from showScript.ts (the same CSS bursts as the
// ambient ones in scene/Fireworks.tsx, played once, larger and doubled up for
// brightness). Every animation start is offset by how long ago midnight was when
// it mounted, so a page opened a few seconds late joins the show part-way instead
// of replaying it. It is mounted a few seconds BEFORE midnight (App.tsx), where that
// offset is negative (a start in the future), so the CSS itself starts the show on the
// dot instead of waiting for React to render at midnight. It drops out of the page once it has played; the long display
// that follows is Sustained.tsx.

function MidnightShow({ startedAt }: { startedAt: number }) {
  const { since, root } = useOnTheDot(startedAt)
  const offset = (t: number) => `${(t - since).toFixed(2)}s`
  if (!useWithin(startedAt, 62_000)) return null

  return (
    <div className="scene-show" ref={root}>
      <div className="scene-flash" style={{ '--show-delay': offset(0) } as CSSProperties} />
      <div className="scene-bloom" style={{ '--show-delay': offset(0) } as CSSProperties} />
      {SHOW.map((b, i) => (
        <FireworkBurst key={i} burst={b} delay={offset(b.t)} />
      ))}
    </div>
  )
}

export default memo(MidnightShow)
