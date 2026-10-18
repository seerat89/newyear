import { memo } from 'react'
import Aurora from './backdrop/Aurora'
import Motes from './backdrop/Motes'
import StarField from './backdrop/StarField'

// The page background lives on <html> (index.css); this layer paints above it
// with a positive z-index and the content sits above this layer. Layers are
// ordered back to front: sky gradient, aurora, stars (3 depths), motes.
function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,var(--color-night-1),var(--color-night-2)_45%,var(--color-night-3))]"
    >
      <Aurora />
      <StarField />
      <Motes />
    </div>
  )
}

export default memo(Backdrop)
