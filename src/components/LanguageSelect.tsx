import { LANGUAGES, setLanguage } from '../lib/locale'
import { useT } from '../lib/strings'

/**
 * A small native language picker, drawn as a pill with a globe and a chevron so it reads
 * as a control. (A globe rather than a flag: a language is not a country, and some
 * systems do not draw flag emoji at all.) The choice is remembered and drives all text.
 */
function LanguageSelect({ className = '', onPick }: { className?: string; onPick?: () => void }) {
  const { t, lang } = useT()
  return (
    <label className={`lang-pick ${className}`}>
      <svg className="lang-globe" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M2.5 10h15M10 2.5c2.4 2.3 3.6 4.8 3.6 7.5s-1.2 5.2-3.6 7.5C7.6 15.2 6.4 12.7 6.4 10S7.6 4.8 10 2.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
      <select className="lang-select" aria-label={t('language')} value={lang} onChange={(e) => {
          setLanguage(e.target.value)
          onPick?.()
        }}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.name}
          </option>
        ))}
      </select>
      <svg className="lang-chevron" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M2 3.6 5 6.8 8 3.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  )
}

export default LanguageSelect
