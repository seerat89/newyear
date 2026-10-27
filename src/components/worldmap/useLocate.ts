import { useState } from 'react'
import { nearestCity } from './savedCity'

/**
 * "Use my location": optional, never blocking. The position is only used to pick the
 * nearest listed city (passed to `onFound`) and is not stored.
 */
export function useLocate(onFound: (city: number) => void) {
  const [locating, setLocating] = useState<'idle' | 'asking' | 'failed'>('idle')
  const locate = () => {
    if (!('geolocation' in navigator)) return setLocating('failed')
    setLocating('asking')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onFound(nearestCity(position.coords.latitude, position.coords.longitude))
        setLocating('idle')
      },
      () => setLocating('failed'),
      { timeout: 10_000, maximumAge: 600_000 },
    )
  }
  return { locating, locate }
}
