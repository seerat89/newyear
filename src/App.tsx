import Backdrop from './components/Backdrop'
import CountdownDisplay from './components/CountdownDisplay'
import Omid from './components/omid/Omid'
import { glowForDaysLeft, gazeForSeconds } from './components/omid/omidState'
import OrbitDial from './components/OrbitDial'
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
          <>
            <h1 className="absolute inset-x-0 top-[max(1.25rem,env(safe-area-inset-top))] text-center text-[clamp(0.75rem,1.6vmin,1.25rem)] font-normal tracking-[0.3em] text-accent-strong uppercase">
              New Year Countdown
            </h1>
            <OrbitDial remaining={state.remaining}>
              <div className="mb-[12cqw] flex flex-col items-center gap-[4cqw] max-sm:portrait:mb-0">
                <h2 className="font-display text-[clamp(1.25rem,6.5cqw,4rem)] leading-none font-light tracking-wide text-ink">
                  Until {state.year}
                </h2>
                <CountdownDisplay
                  days={state.remaining.days}
                  hours={state.remaining.hours}
                  minutes={state.remaining.minutes}
                  seconds={state.remaining.seconds}
                />
              </div>
              <Omid
                glow={glowForDaysLeft(state.remaining.days)}
                gaze={gazeForSeconds(state.remaining.seconds)}
                className="absolute bottom-[8.5cqw] left-1/2 w-[17cqw] -translate-x-1/2 max-sm:portrait:-bottom-[14cqw] max-sm:portrait:w-[26cqw]"
              />
            </OrbitDial>
          </>
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
