import { useEffect, useState } from 'react'

export type PageName = 'about' | 'privacy' | 'terms'

export const PAGES: PageName[] = ['about', 'privacy', 'terms']

const pageFromHash = (): PageName | null => {
  const name = window.location.hash.slice(1)
  return PAGES.find((p) => p === name) ?? null
}

/** The small pages are addressed by the hash (#about, #privacy, #terms): no router needed. */
export function usePage(): PageName | null {
  const [page, setPage] = useState(pageFromHash)
  useEffect(() => {
    const onChange = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return page
}
