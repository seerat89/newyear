import Backdrop from './components/Backdrop'
import CountdownDisplay from './components/CountdownDisplay'
import PhaseMessage from './components/PhaseMessage'
import { useNow } from './hooks/useNow'
import { getCountdownState } from './lib/countdown'

function App() {
  const state = getCountdownState(useNow())

  return (
    <>
      <Backdrop />
      <main className="relative z-10 flex min-h-svh flex-col items-center justify-center pt-[max(3rem,env(safe-area-inset-top))] pr-[max(1.5rem,env(safe-area-inset-right))] pb-[max(3rem,env(safe-area-inset-bottom))] pl-[max(1.5rem,env(safe-area-inset-left))]">
        {state.phase === 'counting' && (
          <div className="flex flex-col items-center gap-10 text-center">
            <h1 className="text-[clamp(0.75rem,2vmin,1.5rem)] font-normal tracking-[0.3em] text-gold-400 uppercase">
              New Year Countdown
            </h1>
            <CountdownDisplay remaining={state.remaining} />
          </div>
        )}
        {state.phase === 'celebrating' && (
          <PhaseMessage
            eyebrow="New Year"
            title={`Happy New Year ${state.year}`}
          />
        )}
        {state.phase === 'afterglow' && (
          <PhaseMessage eyebrow="New Year" title={`${state.year} has begun`} />
        )}
      </main>
    </>
  )
}

export default App
