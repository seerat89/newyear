import { useSyncExternalStore } from 'react'

// The viewer's music preference, remembered in this browser. There is no audio yet:
// it only decides whether the cassette player looks like it is playing (reels turn,
// notes drift). Off by default. A real player can read the same setting later.
const KEY = 'newyear.music'

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) === 'on'
  } catch {
    return false
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
