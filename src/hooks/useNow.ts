import { useEffect, useState } from 'react'

/** Current time in epoch ms, re-read from the clock on every tick. */
export function useNow(intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const update = () => setNow(Date.now())
    const id = setInterval(update, intervalMs)
    document.addEventListener('visibilitychange', update)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', update)
    }
  }, [intervalMs])

  return now
}
