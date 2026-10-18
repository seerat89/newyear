import { memo } from 'react'
import { motion, useReducedMotion } from 'motion/react'

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

// Sizes use container query units, so the numbers scale with the surrounding
// orbit dial rather than the viewport. Takes plain numbers and is memoised, so
// it only re-renders when a displayed value changes (once a second), not on
// every clock tick.
function CountdownDisplay({
  days,
  hours,
  minutes,
  seconds,
}: CountdownDisplayProps) {
  const reduceMotion = useReducedMotion()
  const units = [
    ['Days', days],
    ['Hours', hours],
    ['Minutes', minutes],
    ['Seconds', seconds],
  ] as const

  return (
    <dl className="grid grid-cols-2 gap-x-[8cqw] gap-y-[4cqw] sm:grid-cols-4 sm:gap-x-[3.5cqw]">
      {units.map(([label, value], index) => (
        <motion.div
          key={label}
          className="flex flex-col-reverse items-center"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
        >
          <dt className="mt-[0.8cqw] text-[clamp(0.75rem,2.4cqw,1.5rem)] tracking-[0.25em] text-ink-muted uppercase">
            {label}
          </dt>
          <dd className="font-display text-[15cqw] leading-none font-light tabular-nums lining-nums text-accent sm:text-[11.3cqw]">
            <Digits value={value} />
          </dd>
        </motion.div>
      ))}
    </dl>
  )
}

export default memo(CountdownDisplay)
