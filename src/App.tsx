import CountdownDisplay from './components/CountdownDisplay'
import { glowForDaysLeft } from './components/omid/omidState'
import NewYearMessage from './components/celebration/NewYearMessage'
import { useOmidCelebration } from './components/celebration/useOmidCelebration'
import PhaseMessage from './components/PhaseMessage'
import Scene from './components/scene/Scene'
import { useNow } from './hooks/useNow'
import { getCelebration } from './lib/celebration'
import { getCountdownState } from './lib/countdown'

function App() {
  const now = useNow()
  const state = getCountdownState(now)
  const celebration = getCelebration(state, now)
  useOmidCelebration(state.phase === 'celebrating' ? state.startedAt : null)
  const glow = state.phase === 'counting' ? glowForDaysLeft(state.remaining.days) : 1

  return (
    <>
      <Scene
        glow={glow}
        celebration={celebration?.stage ?? null}
        celebrationStart={celebration?.startedAt ?? null}
      />
      <main className="hero">
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
        {state.phase === 'celebrating' && (
          <NewYearMessage year={state.year} stage={celebration?.stage ?? null} />
        )}
        {state.phase === 'afterglow' && (
          <PhaseMessage title={`${state.year} has begun`} />
        )}
      </main>
    </>
  )
}

export default App
