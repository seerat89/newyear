import { useEffect, useRef, useState } from 'react'
import { setMusic } from './useMusic'
import { unlockMidnightAudio } from './useMidnightAudio'

// Omid's reminder that sound needs a tap. Browsers only let audio start by itself after a tap
// or key press, and a saved "music off" means no sound either, so "sound is on" here means
// music is switched on AND a tap or key press has happened this visit. Until then Omid asks,
// briefly: once about 10 s after the page opens and once more when midnight is under 5 minutes
// away (and once if the browser holds the recording back when it starts). Each appearance
// lasts SHOW_MS and then goes away by itself (it fades, see cassette.css).
//
// A tap or key press while the reminder is up is the gesture the browser wants: it unlocks the
// audio, switches music on (the saved preference) and dismisses the reminder at once, so one
// tap is enough. If the viewer switches music off with the music button after it was on, that
// is deliberate and there are no more reminders this visit.

const GESTURES = ['pointerup', 'mousedown', 'touchend', 'keydown'] as const
const FIRST_MS = 10_000
/** How long one appearance stays before it goes away. */
const SHOW_MS = 8_000

/** Set by the first gesture; kept for the whole visit even if the app remounts. */
let heard = false
/** Set when music is switched off by the viewer after it was on; kept for the visit. */
let silenced = false

type Slot = 'first' | 'near' | 'held'

export function useSoundNudge(music: boolean, nearMidnight: boolean, held: boolean): boolean {
  const [unlocked, setUnlocked] = useState(heard)
  const [quiet, setQuiet] = useState(silenced)
  const [showing, setShowing] = useState(false)
  const used = useRef<Record<Slot, boolean>>({ first: false, near: false, held: false })
  const hideTimer = useRef<number | undefined>(undefined)
  const visible = useRef(false)
  const wasOn = useRef(music)
  const done = unlocked && music
  const stop = useRef(false)
  stop.current = done || quiet

  const reveal = (slot: Slot) => {
    if (used.current[slot] || stop.current) return
    used.current[slot] = true
    setShowing(true)
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setShowing(false), SHOW_MS)
  }

  // Turning music off after it was on is deliberate: no more reminders this visit.
  useEffect(() => {
    if (wasOn.current && !music) {
      silenced = true
      setQuiet(true)
      setShowing(false)
      window.clearTimeout(hideTimer.current)
    }
    wasOn.current = music
  }, [music])

  useEffect(() => {
    const onGesture = (e: Event) => {
      if (!heard) {
        heard = true
        unlockMidnightAudio()
        setUnlocked(true)
      }
      if (!visible.current) return
      // The music button handles its own tap; do not turn music on just before it toggles.
      const onButton = e.target instanceof Element && e.target.closest('.music-toggle')
      if (!onButton) setMusic(true)
      setShowing(false)
      window.clearTimeout(hideTimer.current)
    }
    GESTURES.forEach((g) => window.addEventListener(g, onGesture))
    return () => {
      GESTURES.forEach((g) => window.removeEventListener(g, onGesture))
      window.clearTimeout(hideTimer.current)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => reveal('first'), FIRST_MS)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (nearMidnight) reveal('near')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearMidnight])

  useEffect(() => {
    if (held) reveal('held')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [held])

  const shown = showing && !done && !quiet
  useEffect(() => {
    visible.current = shown
  }, [shown])
  return shown
}
