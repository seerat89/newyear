import { useState } from 'react'
import { loadCity, saveCity } from '../components/worldmap/savedCity'

/** The viewer's chosen city (an index into CITIES), remembered in this browser. */
export function useCity(): [number | null, (city: number | null) => void] {
  const [city, setCity] = useState<number | null>(loadCity)
  const choose = (next: number | null) => {
    setCity(next)
    saveCity(next)
  }
  return [city, choose]
}
