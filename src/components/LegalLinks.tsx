import { useEffect, useRef, useState } from 'react'
import { useT } from '../lib/strings'
import type { StringKey } from '../lib/strings'
import LanguageSelect from './LanguageSelect'
import type { PageName } from '../hooks/usePage'

const LINKS: { page: PageName; label: StringKey }[] = [
  { page: 'about', label: 'about' },
  { page: 'privacy', label: 'privacy' },
  { page: 'terms', label: 'terms' },
]

/**
 * Quiet links to the small pages: a row in the bottom-right corner on larger
 * screens, and on phones one small button (top-right) that opens a compact menu.
 */
function LegalLinks() {
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

export default LegalLinks
