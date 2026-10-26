// A small cassette tape, a Christmas prop that rests on the shore beside Omid.
// Tapping it makes Omid jump (the existing omid-behave event), and it bounces
// whenever Omid jumps, so the two answer each other.
function Cassette() {
  const poke = () => window.dispatchEvent(new CustomEvent('omid-behave', { detail: 'jump' }))
  return (
    <div className="cassette" onClick={poke}>
      <svg viewBox="0 0 80 54" aria-hidden="true">
        <rect x="2" y="2" width="76" height="50" rx="7" fill="#7a2a4a" stroke="#f6c56e" strokeWidth="2" />
        <rect x="9" y="8" width="62" height="22" rx="4" fill="#fff0d2" />
        <rect x="9" y="8" width="62" height="7" rx="3" fill="#c8443f" />
        <path d="M14 22h30" stroke="#7a2a4a" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M14 26h20" stroke="#7a2a4a" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <circle cx="56" cy="22" r="3" fill="#2f8f5b" />
        <path d="M56 17v10M51 22h10" stroke="#fff0d2" strokeWidth="1" opacity="0.8" />
        <path d="M16 52l5-12h38l5 12Z" fill="#33162f" />
        <path d="M4 5 C14 -3 26 3 38 -1 C52 -4 62 3 76 4 C70 8 60 6 52 9 C40 6 30 10 20 8 C12 9 8 8 4 5Z" fill="#f2f4ff" />
        <circle cx="30" cy="44" r="4.5" fill="#fff0d2" />
        <circle cx="50" cy="44" r="4.5" fill="#fff0d2" />
        <circle cx="30" cy="44" r="1.8" fill="#33162f" />
        <circle cx="50" cy="44" r="1.8" fill="#33162f" />
      </svg>
    </div>
  )
}

export default Cassette
