import { memo } from 'react'

const pad = (value: number) => String(value).padStart(2, '0')

type CountdownDisplayProps = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

// Each digit sits in its own fixed-width cell so the layout cannot shift as
// values change, whatever the font's own digit widths are.
function Digits({ value }: { value: number }) {
  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="flex">
        {pad(value)
          .split('')
          .map((digit, index) => (
            <span key={index} className="inline-block w-[0.64em] text-center">
              {digit}
            </span>
          ))}
      </span>
    </>
  )
}

// Sizes and arrangement per screen shape live in index.css (one composition
// each for phone, tablet, desktop and TV). Takes plain numbers and is memoised,
// so it only re-renders when a displayed value changes (once a second), not on
// every clock tick.
function CountdownDisplay({
  days,
  hours,
  minutes,
  seconds,
}: CountdownDisplayProps) {
  const units = [
    ['days', days],
    ['hours', hours],
    ['minutes', minutes],
    ['seconds', seconds],
  ] as const

  return (
    <dl data-omid-keepout className="countdown">
      {units.map(([label, value]) => (
        <div key={label} className="unit">
          <dt className="unit-label">{label}</dt>
          <dd className="unit-value">
            <Digits value={value} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

export default memo(CountdownDisplay)
