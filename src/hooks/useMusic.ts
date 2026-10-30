import { useSyncExternalStore } from 'react'

// The viewer's music preference, remembered in this browser. On unless they switched it
// off: it keeps the cassette player's reels turning and lets the midnight recording
// play by itself (hooks/useMidnightAudio.ts), so a screen left running just works.
const KEY = 'newyear.music'

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

let playing = read()
const listeners = new Set<() => void>()

export function setMusic(on: boolean) {
  if (on === playing) return
  playing = on
  try {
    window.localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    // Not remembered; the choice still applies for this visit.
  }
  listeners.forEach((fn) => fn())
}

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Whether music is switched on; components using it re-render when it changes. */
export const useMusic = () => useSyncExternalStore(subscribe, () => playing)
