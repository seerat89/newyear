import CountdownDisplay from './components/CountdownDisplay'
import { glowForDaysLeft } from './components/omid/omidState'
import PhaseMessage from './components/PhaseMessage'
import Scene from './components/scene/Scene'
import { useNow } from './hooks/useNow'
import { getCountdownState } from './lib/countdown'

function App() {
  const state = getCountdownState(useNow())
  const glow = state.phase === 'counting' ? glowForDaysLeft(state.remaining.days) : 1

  return (
    <>
      <Scene glow={glow} />
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
          <PhaseMessage title={`Happy New Year ${state.year}`} />
        )}
        {state.phase === 'afterglow' && (
          <PhaseMessage title={`${state.year} has begun`} />
        )}
      </main>
    </>
  )
}

export default App
