import { useNow } from './hooks/useNow'
import { getCountdownState } from './lib/countdown'

const pad = (value: number) => String(value).padStart(2, '0')

function App() {
  const state = getCountdownState(useNow())

  if (state.phase === 'celebrating') {
    return (
      <main className="min-h-svh p-6">
        <h1>Happy New Year {state.year}</h1>
      </main>
    )
  }

  if (state.phase === 'afterglow') {
    return (
      <main className="min-h-svh p-6">
        <h1>{state.year} has begun</h1>
      </main>
    )
  }

  const { days, hours, minutes, seconds } = state.remaining
  const units = [
    ['Days', days],
    ['Hours', hours],
    ['Minutes', minutes],
    ['Seconds', seconds],
  ] as const

  return (
    <main className="min-h-svh p-6">
      <h1>New Year Countdown</h1>
      <dl className="flex gap-6 tabular-nums">
        {units.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{pad(value)}</dd>
          </div>
        ))}
      </dl>
    </main>
  )
}

export default App
