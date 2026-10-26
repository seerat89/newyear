import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useT } from '../lib/strings'
import type { StringKey } from '../lib/strings'
import LanguageSelect from './LanguageSelect'

import { PAGES } from '../hooks/usePage'
import type { PageName } from '../hooks/usePage'

const closePage = () => {
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

const LINKS: { page: PageName; label: StringKey }[] = [
  { page: 'about', label: 'about' },
  { page: 'privacy', label: 'privacy' },
  { page: 'terms', label: 'terms' },
]

/**
 * Quiet links to the small pages: a row in the bottom-right corner on larger
 * screens, and on phones one small button (top-right) that opens a compact menu.
 */
export function LegalLinks() {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (!menu.current?.contains(target) && !button.current?.contains(target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <>
      <nav className="legal" aria-label={t('aboutLegal')}>
        {LINKS.map(({ page, label }) => (
          <a key={page} href={`#${page}`}>
            {t(label)}
          </a>
        ))}
        <LanguageSelect className="legal-lang" />
      </nav>
      <div className="legal-menu">
        <button
          ref={button}
          type="button"
          className="legal-menu-button"
          aria-label={t('aboutLegal')}
          aria-expanded={open}
          aria-controls="legal-menu-list"
          onClick={() => setOpen(!open)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="4" cy="10" r="2" />
            <circle cx="10" cy="10" r="2" />
            <circle cx="16" cy="10" r="2" />
          </svg>
        </button>
        {open && (
          <div ref={menu} id="legal-menu-list" className="legal-menu-list">
            {LINKS.map(({ page, label }) => (
              <a key={page} href={`#${page}`} onClick={() => setOpen(false)}>
                {t(label)}
              </a>
            ))}
            <LanguageSelect className="legal-menu-lang" onPick={() => setOpen(false)} />
          </div>
        )}
      </div>
    </>
  )
}

const CONTENT: Record<PageName, { title: string; body: ReactNode }> = {
  about: {
    title: 'About',
    body: (
      <>
        <p>
          New Year Countdown is a global countdown experience for welcoming the new year, from the final minutes before
          midnight to the celebrations unfolding around the world.
        </p>
        <h2>Omid</h2>
        <p>
          Omid is the spirit of the countdown: a small glowing companion who brings warmth, movement and a little
          personality to the night.
        </p>
        <p>
          His name, امید, means “hope” in Persian, a fitting idea for the moment when one year ends and another begins.
        </p>
        <h2>Around the world</h2>
        <p>New Year does not arrive everywhere at once.</p>
        <p>
          As midnight moves across time zones, the world map follows the celebration from place to place, showing where
          the new year has already arrived, where it is being celebrated now, and where midnight is coming next.
        </p>
        <p>
          The countdown follows the city you choose, so you can count down to midnight wherever you are, or wherever
          someone you care about is. If you do not choose one, it uses your device's time zone.
        </p>
        <h2>Languages</h2>
        <p className="info-note">
          Some translations are AI-assisted and may contain mistakes. If you spot one, please let us know.
        </p>
        <h2>About the creator</h2>
        <p>
          Created by{' '}
          <a href="https://seerat.me" target="_blank" rel="noopener noreferrer">
            Seerat.me
          </a>
          , where you can also find more projects and contact information.
        </p>
      </>
    ),
  },
  privacy: {
    title: 'Privacy',
    body: (
      <>
        <p>No account is needed, and the app does not create a personal profile.</p>
        <h2>Time zone</h2>
        <p>
          When you choose a city, the countdown uses that city's time zone. Your browser's time zone is only the
          fallback, used when no city is chosen. Neither needs a location permission, and nothing is sent anywhere for
          them.
        </p>
        <h2>Location (optional)</h2>
        <p>
          Precise location is optional and is never required. If you choose “Use my location” on the map, your browser
          asks for permission, and the position is used only to find the nearest listed city. That is worked out in your
          browser, and the position itself is not stored.
        </p>
        <p>If you decline, or location is not available, you can choose a city by hand instead.</p>
        <h2>What is remembered</h2>
        <p>
          The city you choose, by search, by tapping the map or by location, is remembered in your browser's local
          storage so you do not have to choose it again. It stays on your device. You can clear it with the “Clear”
          button next to the city, or by clearing your site data.
        </p>
      </>
    ),
  },
  terms: {
    title: 'Terms',
    body: (
      <>
        <p>
          This is a free personal project, provided for information and entertainment. By using it you agree to these
          short terms.
        </p>
        <h2>As is</h2>
        <p>
          The app is provided “as is”, without warranties. There is no guarantee that it will always be available or free
          of errors. Countdowns depend on your device's clock and on the time zone data in your browser, and the city you choose
          sets the time zone used. They may be inaccurate, so please do not rely on them for anything important.
        </p>
        <h2>Ownership</h2>
        <p>
          The design, artwork, text and the character Omid belong to the project and may not be copied or sold without
          permission. The map's land shapes come from Natural Earth (public domain), and the Fraunces typeface is used
          under the SIL Open Font License.
        </p>
      </>
    ),
  },
}

/** A full-screen page over the app, for About, Privacy and Terms. */
export function InfoPage({ page }: { page: PageName }) {
  const { t } = useT()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closePage()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const { title, body } = CONTENT[page]
  return (
    <div className="info" role="dialog" aria-modal="true" aria-label={title}>
      <article className="info-card">
        <button type="button" className="info-back" onClick={closePage}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 9.5 10 3.5l7 6M5 8.5V16h3.5v-4h3v4H15V8.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('home')}
        </button>
        <h1>{title}</h1>
        {body}
        <nav className="info-nav" aria-label="Pages">
          {PAGES.map((p) => (
            <a key={p} href={`#${p}`} aria-current={p === page ? 'page' : undefined}>
              {CONTENT[p].title}
            </a>
          ))}
        </nav>
      </article>
    </div>
  )
}
