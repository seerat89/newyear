import { useEffect, useState } from 'react'
import { AUDIO_MIDNIGHT_S, AUDIO_SRC, audioOffset } from '../lib/midnightAudio'

// Plays the midnight recording (on unless the viewer switched music off, hooks/useMusic.ts)
// so that its "Happy New Year" burst lands on the viewer's midnight. The recording is
// slaved to the clock: it starts at the right second (a page opened part-way joins in
// at the matching point), and while it plays it is checked against the clock several
// times a second and nudged back if it has drifted (slow start-up, a stall, a seek that
// landed short), so it cannot slide away from the fireworks.
//
// The recording is only ever started inside its own window (`audioOffset` is not null);
// it is never "warmed up" or tested at any other time, so opening the page, tapping around or
// switching music on can not make it play. Browsers only let audio start by itself on pages
// they trust (a recent tap or key press, an installed app, a site allowed to play sound, or a
// kiosk flag). Where that is not so when the window opens, the first tap, click or key press
// (a remote's button counts) starts it at the right place, and `blocked` is true meanwhile so
// the page can say so.

let element: HTMLAudioElement | null = null

const audio = () => {
  if (!element) {
    element = new Audio(AUDIO_SRC)
    element.preload = 'auto'
    // Lets tests read the element (development only).
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__midnightAudio = element
  }
  return element
}

/** Any of these counts as the "user gesture" browsers want before they let sound start. */
const GESTURES = ['pointerup', 'mousedown', 'touchend', 'keydown'] as const

/** How far (s) the recording may stray from the clock before it is put back. */
const DRIFT_S = 0.12

/**
 * The only place the recording is started. It does so only inside the recording's window for
 * this midnight, at the second the clock says; otherwise it stays paused and returns null.
 */
function startInWindow(a: HTMLAudioElement, midnight: number): Promise<void> | null {
  const at = audioOffset(Date.now(), midnight)
  if (at === null) {
    a.pause()
    return null
  }
  a.currentTime = at
  a.muted = false
  return a.play()
}

/** Returns whether the browser is holding the recording back until a tap or key press. */
export function useMidnightAudio(midnight: number | null, enabled: boolean): boolean {
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    if (!enabled || midnight === null) return
    const a = audio()
    // Keep the recording in the offline cache (the service worker stores a plain fetch).
    if (navigator.onLine) fetch(AUDIO_SRC).then((r) => r.blob()).catch(() => {})

    let timer: number | undefined
    let watch: number | undefined
    let waiting = false
    let alive = true

    const stopWaiting = () => {
      GESTURES.forEach((g) => window.removeEventListener(g, retry))
      waiting = false
    }
    const retry = () => {
      stopWaiting()
      begin()
    }
    const holdSync = () => {
      window.clearInterval(watch)
      watch = window.setInterval(() => {
        const want = audioOffset(Date.now(), midnight)
        if (want === null) {
          window.clearInterval(watch)
          return
        }
        if (!a.paused && Math.abs(a.currentTime - want) > DRIFT_S) a.currentTime = want
      }, 200)
    }
    const play = () => {
      if (!alive) return
      const started = startInWindow(a, midnight)
      if (!started) return
      started.then(
        () => {
          // Cleaned up (its cleanup already paused it) or the window closed meanwhile: nothing to do.
          if (!alive || audioOffset(Date.now(), midnight) === null) return
          setBlocked(false)
          holdSync()
        },
        () => {
          // Not allowed yet: wait for the first tap or key press, then join at the right second.
          if (!alive || waiting || audioOffset(Date.now(), midnight) === null) return
          setBlocked(true)
          waiting = true
          GESTURES.forEach((g) => window.addEventListener(g, retry))
        },
      )
    }
    const begin = () => {
      if (!alive || audioOffset(Date.now(), midnight) === null) return
      if (a.readyState >= 1) play()
      else {
        a.addEventListener('loadedmetadata', play, { once: true })
        a.load()
      }
    }

    const wait = midnight - AUDIO_MIDNIGHT_S * 1000 - Date.now()
    if (wait > 0) timer = window.setTimeout(begin, wait)
    else begin()

    return () => {
      alive = false
      window.clearTimeout(timer)
      window.clearInterval(watch)
      stopWaiting()
      a.removeEventListener('loadedmetadata', play)
      a.pause()
      setBlocked(false)
    }
  }, [midnight, enabled])

  return blocked
}
