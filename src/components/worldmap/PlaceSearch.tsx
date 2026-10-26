import { useEffect, useId, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { CITIES } from './places'

type PlaceSearchProps = {
  /** Place indexes in the order they should be listed. */
  order: number[]
  onSelect: (place: number) => void
}

/** Lower-case and strip accents so "sao" finds "São Paulo". */
const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** A small search box with a filtered list (the ARIA combobox pattern), no library. */
function PlaceSearch({ order, onSelect }: PlaceSearchProps) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const terms = fold(query).split(/\s+/).filter(Boolean)
  const matches = order.filter((i) => {
    const haystack = fold(`${CITIES[i].name} ${CITIES[i].country}`)
    return terms.every((term) => haystack.includes(term))
  })
  const current = Math.min(active, matches.length - 1)
  const optionId = (n: number) => `${id}-option-${n}`

  useEffect(() => {
    if (open) document.getElementById(`${id}-option-${current}`)?.scrollIntoView({ block: 'nearest' })
  }, [id, open, current])

  const choose = (place: number) => {
    onSelect(place)
    setQuery('')
    setActive(0)
    setOpen(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) return setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current + step + matches.length) % Math.max(matches.length, 1))
    } else if (event.key === 'Enter' && open && matches.length) {
      event.preventDefault()
      choose(matches[current])
    } else if (event.key === 'Escape' && open) {
      // Close the list first; a second Escape closes the whole panel.
      event.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <div className="wm-search">
      <svg className="wm-search-icon" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        role="combobox"
        className="wm-search-input"
        placeholder="Find a city or country"
        aria-label="Search places"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && matches.length ? optionId(current) : undefined}
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul className="wm-search-list" role="listbox" id={`${id}-list`} aria-label="Places">
          {matches.map((place, n) => (
            <li
              key={place}
              id={optionId(n)}
              role="option"
              aria-selected={n === current}
              className="wm-search-option"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(place)}
            >
              {CITIES[place].name} <span>{CITIES[place].country}</span>
            </li>
          ))}
          {matches.length === 0 && <li className="wm-search-empty">No matching place</li>}
        </ul>
      )}
    </div>
  )
}

export default PlaceSearch
