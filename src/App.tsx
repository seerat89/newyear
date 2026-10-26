import { useState } from 'react'
import CountdownDisplay from './components/CountdownDisplay'
import { glowForDaysLeft } from './components/omid/omidState'
import NewYearMessage from './components/celebration/NewYearMessage'
import { useOmidCelebration } from './components/celebration/useOmidCelebration'
import PhaseMessage from './components/PhaseMessage'
import Scene from './components/scene/Scene'
import SceneSwitch from './components/SceneSwitch'
import type { SceneName } from './components/SceneSwitch'
import WorldMap from './components/worldmap/WorldMap'
import { useNow } from './hooks/useNow'
import { getNewYearWindow } from './lib/autoView'
import { getCelebration } from './lib/celebration'
import { getCountdownState } from './lib/countdown'

function App() {
  const now = useNow()
  const state = getCountdownState(now)
  const celebration = getCelebration(state, now)
  useOmidCelebration(state.phase === 'celebrating' ? state.startedAt : null)
  const glow = state.phase === 'counting' ? glowForDaysLeft(state.remaining.days) : 1

  // Two fullscreen scenes, no scrolling, and the viewer's choice is never overridden,
  // with one exception: when the viewer's own midnight is 5 minutes away the screen
  // moves to the countdown for the celebration (lib/autoView.ts). They can switch back.
  const [scene, setScene] = useState<SceneName>('countdown')
  const midnight = getNewYearWindow(now)
  const [seen, setSeen] = useState<number | null>(null)
  if (midnight !== seen) {
    setSeen(midnight)
    if (midnight !== null) setScene('countdown')
  }

  return (
    <div className="app" data-scene={scene}>
      <Scene
        glow={glow}
        celebration={celebration?.stage ?? null}
        celebrationStart={celebration?.startedAt ?? null}
      />
      <SceneSwitch scene={scene} onChange={setScene} />
      <main className="hero" inert={scene !== 'countdown'}>
        {state.phase === 'counting' && (
          <>
            <h1 data-omid-keepout className="hero-title">Until {state.year}</h1>
            <CountdownDisplay
              days={state.remaining.days}
              hours={state.remaining.hours}
              minutes={state.remaining.minutes}
              seconds={state.remaining.seconds}
            />
          </>
        )}
        {state.phase === 'celebrating' && <NewYearMessage year={state.year} stage={celebration?.stage ?? null} />}
        {state.phase === 'afterglow' && <PhaseMessage title={`${state.year} has begun`} />}
      </main>
      <section className="map-section" aria-label="New Year around the world" inert={scene !== 'map'}>
        <WorldMap now={now} active={scene === 'map'} />
      </section>
    </div>
  )
}

export default App
