import { useSyncExternalStore } from 'react'

// Whether the page is on screen. Hidden tabs, and installed apps sent to the background, report
// "hidden" through the Page Visibility API; `pagehide` and `pageshow` cover mobile browsers and
// the back/forward cache, which do not always send a visibility change first.
let visible = typeof document === 'undefined' || document.visibilityState !== 'hidden'

const subscribe = (fn: () => void) => {
  const update = (next?: boolean) => {
    const now = next ?? document.visibilityState !== 'hidden'
    if (now === visible) return
    visible = now
    fn()
  }
  const onVisibility = () => update()
  const onHide = () => update(false)
  const onShow = () => update()
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', onHide)
  window.addEventListener('pageshow', onShow)
  return () => {
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pagehide', onHide)
    window.removeEventListener('pageshow', onShow)
  }
}

/** True while the page is visible; sound is paused while it is false. */
export const usePageVisible = () => useSyncExternalStore(subscribe, () => visible)
