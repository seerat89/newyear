import { memo } from 'react'

// Two huge soft radial gradients (no blur filter) drifting slowly behind
// everything: a warm gold wash and a cool indigo one for depth.
function Aurora() {
  return (
    <>
      <div className="animate-float absolute -top-[18vmin] -left-[18vmin] h-[90vmin] w-[90vmin] rounded-full bg-[radial-gradient(circle,rgb(var(--theme-glow)/0.13),transparent_65%)]" />
      <div className="animate-float-alt absolute -right-[22vmin] -bottom-[22vmin] h-[100vmin] w-[100vmin] rounded-full bg-[radial-gradient(circle,rgb(var(--theme-glow-cool)/0.2),transparent_65%)]" />
    </>
  )
}

export default memo(Aurora)
