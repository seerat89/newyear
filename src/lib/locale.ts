import { useSyncExternalStore } from 'react'

// The one language setting for the whole interface: the browser's language by
// default (never the physical location), English as the fallback, and a choice the
// viewer can make that is remembered in this browser. Greetings (greetings.ts) and
// the interface text (strings.ts) both read it.

export type Language = { code: string; name: string; rtl?: boolean }

/** The supported languages, each named in itself. */
export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'fi', name: 'Suomi' },
  { code: 'sv', name: 'Svenska' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'fa', name: 'فارسی', rtl: true },
  { code: 'ar', name: 'العربية', rtl: true },
  { code: 'tr', name: 'Türkçe' },
  { code: 'ru', name: 'Русский' },
  { code: 'uk', name: 'Українська' },
  { code: 'pl', name: 'Polski' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'ro', name: 'Română' },
  { code: 'cs', name: 'Čeština' },
  { code: 'hu', name: 'Magyar' },
  { code: 'da', name: 'Dansk' },
  { code: 'no', name: 'Norsk' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'hi', name: 'हिन्दी' },
]

const KEY = 'newyear.lang'

export const isRtl = (code: string) => LANGUAGES.find((l) => l.code === code)?.rtl === true

/** The first of the preferred languages that is supported (by its primary subtag), else English. */
export function pickLanguage(preferred: readonly string[]): string {
  for (const tag of preferred) {
    const raw = tag.toLowerCase().split('-')[0]
    const primary = raw === 'nb' || raw === 'nn' ? 'no' : raw // Norwegian Bokmål and Nynorsk
    if (LANGUAGES.some((l) => l.code === primary)) return primary
  }
  return 'en'
}

function initial(): string {
  // In development only, ?lang=fi previews another language.
  const forced = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('lang') : null
  if (forced) return pickLanguage([forced])
  try {
    const saved = window.localStorage.getItem(KEY)
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved
  } catch {
    // Storage blocked: fall through to the browser's language.
  }
  return pickLanguage(navigator.languages?.length ? navigator.languages : [navigator.language ?? 'en'])
}

let current = initial()
const listeners = new Set<() => void>()

/** The page's language and direction follow the setting (text direction only; the map and countdown stay left to right). */
function apply() {
  document.documentElement.lang = current
  document.documentElement.dir = isRtl(current) ? 'rtl' : 'ltr'
}
apply()

export const getLanguage = () => current

export function setLanguage(code: string) {
  if (!LANGUAGES.some((l) => l.code === code) || code === current) return
  current = code
  try {
    window.localStorage.setItem(KEY, code)
  } catch {
    // Not remembered; the choice still applies for this visit.
  }
  apply()
  listeners.forEach((fn) => fn())
}

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** The current language code; components using it re-render when it changes. */
export const useLanguage = () => useSyncExternalStore(subscribe, getLanguage)
