type PhaseMessageProps = {
  title: string
}

function PhaseMessage({ title }: PhaseMessageProps) {
  return <h1 data-omid-keepout className="hero-title hero-title--big">{title}</h1>
}

export default PhaseMessage
