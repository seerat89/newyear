import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useT } from '../lib/strings'
import type { StringKey } from '../lib/strings'
import LanguageSelect from './LanguageSelect'
import type { PageName } from '../hooks/usePage'

const ICON = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const LINKS: { page: PageName; label: StringKey; icon: ReactNode }[] = [
  {
    page: 'about',
    label: 'about',
    icon: (
      <>
        <circle cx="10" cy="10" r="7.2" {...ICON} />
        <path d="M10 9v4.6M10 6.4v.1" {...ICON} />
      </>
    ),
  },
  {
    page: 'privacy',
    label: 'privacy',
    icon: <path d="M10 2.8 16 5v4.6c0 3.4-2.4 6-6 7.6-3.6-1.6-6-4.2-6-7.6V5l6-2.2Z" {...ICON} />,
  },
  {
    page: 'terms',
    label: 'terms',
    icon: <path d="M5.5 2.8h6l3.5 3.5v10.9h-9.5V2.8ZM11.5 2.8v3.5H15M8 10h4M8 13h4" {...ICON} />,
  },
]

/**
 * One small floating menu in the bottom-right corner (a speed dial, drawn here without a
 * library): the closed button opens Language, About, Privacy and Terms upward from it.
 * Language is the ordinary language picker; the other three are the hash-route pages.
 */
function CornerMenu() {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)

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
      if (!list.current?.contains(target) && !button.current?.contains(target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div className="dial" data-open={open || undefined}>
      <button
        ref={button}
        type="button"
        className="dial-button"
        aria-label={t('aboutLegal')}
        title={t('aboutLegal')}
        aria-expanded={open}
        aria-controls="dial-list"
        onClick={() => setOpen(!open)}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <g className="dial-dots">
            <circle cx="4" cy="10" r="1.9" />
            <circle cx="10" cy="10" r="1.9" />
            <circle cx="16" cy="10" r="1.9" />
          </g>
          <path className="dial-cross" d="M5 5l10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </button>
      <div ref={list} id="dial-list" className="dial-list" hidden={!open}>
        <LanguageSelect className="dial-lang" onPick={() => setOpen(false)} />
        {LINKS.map(({ page, label, icon }) => (
          <a key={page} className="dial-item" href={`#${page}`} onClick={() => setOpen(false)}>
            <span>{t(label)}</span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              {icon}
            </svg>
          </a>
        ))}
      </div>
    </div>
  )
}

export default CornerMenu
