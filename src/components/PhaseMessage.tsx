type PhaseMessageProps = {
  eyebrow: string
  title: string
}

function PhaseMessage({ eyebrow, title }: PhaseMessageProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-[clamp(0.75rem,2vmin,1.5rem)] tracking-[0.3em] text-accent-strong uppercase">
        {eyebrow}
      </p>
      <h1 className="font-display text-[clamp(2.5rem,11vmin,9rem)] leading-tight font-light text-accent">
        {title}
      </h1>
    </div>
  )
}

export default PhaseMessage
