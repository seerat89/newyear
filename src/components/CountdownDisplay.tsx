import { motion, useReducedMotion } from 'motion/react'
import type { TimeRemaining } from '../lib/countdown'

const pad = (value: number) => String(value).padStart(2, '0')

type CountdownDisplayProps = {
  remaining: TimeRemaining
}

// Each digit sits in its own fixed-width cell so the layout cannot shift as
// values change, whatever font the system provides.
function Digits({ value }: { value: number }) {
  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="flex">
        {pad(value)
          .split('')
          .map((digit, index) => (
            <span key={index} className="inline-block w-[0.62em] text-center">
              {digit}
            </span>
          ))}
      </span>
    </>
  )
}

function CountdownDisplay({ remaining }: CountdownDisplayProps) {
  const reduceMotion = useReducedMotion()
  const units = [
    ['Days', remaining.days],
    ['Hours', remaining.hours],
    ['Minutes', remaining.minutes],
    ['Seconds', remaining.seconds],
  ] as const

  return (
    <dl className="grid grid-cols-2 gap-x-[6vmin] gap-y-8 sm:grid-cols-4 sm:gap-x-[3vmin]">
      {units.map(([label, value], index) => (
        <motion.div
          key={label}
          className="flex flex-col-reverse items-center"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
        >
          <dt className="mt-2 text-[clamp(0.75rem,2vmin,1.5rem)] tracking-[0.25em] text-ink-muted uppercase">
            {label}
          </dt>
          <dd className="font-numeric text-[clamp(3.5rem,16vmin,11rem)] leading-none font-light text-gold-300 sm:text-[clamp(3rem,11vmin,11rem)]">
            <Digits value={value} />
          </dd>
        </motion.div>
      ))}
    </dl>
  )
}

export default CountdownDisplay
